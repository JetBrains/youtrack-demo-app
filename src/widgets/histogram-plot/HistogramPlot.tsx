// we only feed raw data into the component.
import { useRef, useEffect, useMemo } from "react";
import type { ChartConfig, ChartData, ChartDataPoint } from "./types.d.ts";

import { every, max, range } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";

import "d3-transition";

import { margins } from "../../utils/constants.ts";
import { area, curveBasis, curveBumpX, curveMonotoneX, curveMonotoneY, curveNatural, curveStep, curveStepBefore } from "d3";

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
  const maxCounts = useMemo(
    () => max(data.values()) ?? 0,
    [data]
  );
  const maxMinutes = useMemo(
    () => max(data.keys()) ?? 0,
    [data]
  );

  const bands = useMemo(() => range(0, maxMinutes, binWidthMinutes), [maxMinutes]);

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
      .call(axisBottom(xScale)
      .tickFormat(d => `≥${d}m`));

    pinnedAxes
      .select<SVGGElement>(".y.axis")
      .transition()
      .duration(duration)
      .call(axisLeft(yScale));

    const canvas = svg.select(".canvas");
    
    const areaGenerator = area<[number, number]>()
      .x(d => (xScale(d[0]) ?? 0) + xScale.bandwidth() / 2)
      .y0(yScale(0))
      .y1(d => yScale(d[1]))
      .curve(curveBumpX);

    // one point per band (bands are already in ascending order); bands without data count as 0
    const points = bands.map((band): [number, number] => [band, data.get(band) ?? 0]);

    // bind the generated curve to the (single) path.area in g.canvas, creating it on first render
    canvas
      .selectAll<SVGPathElement, [number, number][]>("path.area")
      .data([points])
      .join("path")
      .attr("class", "area")
      .attr("d", d => areaGenerator(d))
      .attr("stroke", "red")
      .attr("stroke-width", 3)
      .attr("fill-opacity", 0.4);

    // bars, keyed by day so changed data updates in place instead of appending duplicates
    canvas
      .selectAll<SVGRectElement, ChartData>("rect.counts")
      .data(data)
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
      .attr("data-value", (d) => d)
      .attr("class", "counts").attr("fill-opacity", 0.4);
  }, [data, binWidthMinutes, viewBoxWidth, viewBoxHeight, contentWidth]);

  
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
