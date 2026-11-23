// we only feed raw data into the component.
import { useRef, useEffect, useMemo } from "react";
import type { ChartConfig, ChartDataPoint } from "./types.d.ts";

import { max, range } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";

import "d3-transition";

import { margins } from "../../utils/constants.ts";

const TRANSITION_MS = 500;
const MIN_STEP_WIDTH = 30;

const HistogramPlot = ({
  data,
  width,
  height,
  binWidthMinutes
}: ChartConfig) => {
  const pinnedRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef<ChartDataPoint[] | null>(null);

  const viewBoxHeight = height > 0 ? height : 0;
  const viewBoxWidth = width > 0 ? width : 0;
  const BIN_SIZE_MINUTES = 5
  const maxCounts = useMemo(
    () => max(data.values(), inner => max(inner.values())) ?? 0,
    [data]
  );
  const maxMinutes = useMemo(
    () => max(data.values(), inner => max(inner.keys())) ?? 0,
    [data]
  );
  // one band per bin, identified by its start in minutes: 0, BIN_SIZE_MINUTES, ... maxMinutes - BIN_SIZE_MINUTES

  const bands = useMemo(() => range(0, maxMinutes, binWidthMinutes), [maxMinutes]);
  // number of data points falling into each band (a value equal to maxMinutes lands in the last band)
  const bins = useMemo(() => {
    const counts = bands.map((start) => ({ start, count: 0 }));
    for (const d of data) {
      if (!Number.isFinite(d.minutes)) {
        continue;
      }
      const index = Math.max(0, Math.min(Math.floor(d.minutes / BIN_SIZE_MINUTES), bands.length - 1));
      counts[index].count += 1;
    }
    return counts;
  }, [data, bands]);

  // the scrolling area is everything right of the pinned y-axis; it must be wider than
  // the visible area, otherwise .scroll-area has nothing to scroll
  const visibleCanvasWidth = viewBoxWidth - margins.left - margins.right;
  const contentWidth = Math.max(visibleCanvasWidth, bands.length * MIN_STEP_WIDTH);

  useEffect(() => {
    if (!chartRef.current || !pinnedRef.current) {
        return;
    }

    const svg = select(chartRef.current);
    const pinnedAxes = select(pinnedRef.current);

    const canvasWidth = viewBoxWidth - margins.left - margins.right;
    const canvasHeight = viewBoxHeight - margins.top - margins.bottom;
    // not measured yet (or nothing to show): wait for the next width/height/data change
    if (canvasWidth <= 0 || canvasHeight <= 0 || data.length === 0) {
        return;
    }

    // animate only when the data or category toggles changed (and it is not the first paint);
    // resizes must update instantly, otherwise every resize tick restarts all transitions
    const dataChanged = previousDataRef.current !== null && previousDataRef.current !== data;
    previousDataRef.current = data;

    const duration = dataChanged ? TRANSITION_MS : 0;

    const xScale = scaleBand<number>()
      .domain(bands)
      .range([0, contentWidth])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, maxCounts ?? 0])
      .range([canvasHeight, 0])
      .nice();

    svg
      .select<SVGGElement>(".x.axis")
      .transition()
      .duration(duration)
      .call(axisBottom(xScale));

    pinnedAxes
      .select<SVGGElement>(".y.axis")
      .transition()
      .duration(duration)
      .call(axisLeft(yScale));

    const canvas = svg.select(".canvas");
    const groupsPerAuthor = canvas.selectAll("g")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "author")
      .attr("data-author", d => d[0])
      .attr("stroke", (_, i) => ["red", "blue", "green"][i])
      .attr("stroke-width", 1)
      .attr("fill", "none");
    
    // bars, keyed by day so changed data updates in place instead of appending duplicates
    groupsPerAuthor
      .selectAll<SVGRectElement>("rect.counts")
      .data(d => d[1])
      .join(
        (enter) => {
            const rects = enter
                .append("rect")
                .attr("y", canvasHeight)
                .attr("height", 0);

              rects
                .transition()
                .duration(duration)
                .delay((_, i) => i * 10)
                .attr("y", (d) => yScale(d[1]))
                .attr("height", (d) => canvasHeight - yScale(d[1]));

            rects.append("title");
            return rects;
        },
        (update) => update
                      .transition()
                      .duration(duration)
                      .attr("y", (d) => yScale(d[1]))
                      .attr("height", (d) => canvasHeight - yScale(d[1])),

        (exit) => exit.remove(),
      )
      .attr("x", (d) => xScale(d[0]) ?? -xScale.bandwidth())
      .attr("width", xScale.bandwidth())
      .attr("data-value", (d) => d[1])
      .attr("class", "counts");
  }, [data, bands, viewBoxWidth, viewBoxHeight, contentWidth]);

  
  // hovering the chart + mouse wheel scrolls it horizontally, handled via d3's event binding
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const area = select(el);
    
    area.on(
      "wheel.scroll",
      function wheelScroll(event: WheelEvent) {
        const node = this as HTMLDivElement;
        const maxScroll = node.scrollWidth - node.clientWidth;
        if (maxScroll <= 0) {
          return; // nothing to scroll, let the page handle the wheel
        }
        // trackpads send deltaX directly; mouse wheels only send deltaY
        let delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (event.deltaMode === 1) {
          delta *= 16; // lines -> px
        } else if (event.deltaMode === 2) {
          delta *= node.clientWidth; // pages -> px
        }
        const next = Math.max(0, Math.min(maxScroll, node.scrollLeft + delta));
        if (next === node.scrollLeft) {
          return; // at an edge, let the page scroll on
        }
        event.preventDefault();
        node.scrollLeft = next;
      },
      { passive: false },
    );
    return () => {
      area.on("wheel.scroll", null);
    };
  }, []);

  const canvasHeight = viewBoxHeight - margins.top - margins.bottom;
  return (
    <div className={`scrollable-canvas`}>
      <svg
        ref={pinnedRef}
        className="pinned axes"
        width={margins.left}
        height={viewBoxHeight}
      >
        <g
          className="y axis"
          transform={`translate(${margins.left - 1}, ${margins.top})`}
        />
      </svg>
      <div ref={scrollRef} className="scroll-area">
        <svg
          ref={chartRef}
          width={contentWidth}
          height={viewBoxHeight}
        >
          <g transform={`translate(0, ${margins.top})`}>
            <g className="canvas"/>
            <g
              className="x axis"
              transform={`translate(0, ${canvasHeight})`}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default HistogramPlot;
