// we only feed raw data into the component.
import { useRef, useEffect, useMemo } from "react";
import type { ChartDataPoint } from "./types.d.ts";

import { colorScaleContributionCategorical } from "../../../utils/colorScales.ts";

import { max, sort, union } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { timeDay, timeDays } from "d3-time";
import "d3-transition";

import {describeDataPoint} from "../../utils/helper.ts";
import {margins} from "../../utils/constants.ts";
import {TimeAggregationOption} from "../../utils/classes.ts";

const TRANSITION_MS = 500;
const MIN_STEP_WIDTH = 30;

const TimePlot = ({
  data,
  timeframe,
  width,
  height,
  isResizing,
  timeAggregation
}: {
  data: ChartDataPoint[];
  timeframe: { from: Date, to: Date };
  width: number;
  height: number;
  isResizing: boolean;
  timeAggregation: TimeAggregationOption
}) => {
  const pinnedRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef<ChartDataPoint[] | null>(null);

  const viewBoxHeight = height > 0 ? height : 0;
  const viewBoxWidth = width > 0 ? width : 0;

  // x: one band per aggregated day/week/... in the timeframe
  const xBandValues: Date[] = useMemo(
    () =>
      timeDays(timeDay.floor(timeframe.from), timeDay.ceil(timeframe.to)).map(
        timeAggregation.dateAggregationFunction,
      ),
    [timeframe.from, timeframe.to, timeAggregation],
  );

  // the scrolling area is everything right of the pinned y-axis; it must be wider than
  // the visible area, otherwise .scroll-area has nothing to scroll
  const visibleCanvasWidth = viewBoxWidth - margins.left - margins.right;
  const contentWidth = Math.max(visibleCanvasWidth, union(xBandValues).size * MIN_STEP_WIDTH);

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


    const {
      dateAggregationFunction,
      tickValueFormattingFunction
    } = timeAggregation

    const xScale = scaleBand<Date>()
      .domain(xBandValues)
      .range([0, contentWidth])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.totalMinutes) as number])
      .range([canvasHeight, 0])
      .nice();

    const tickValues: Set<Date> = union(xBandValues.map(dateAggregationFunction))

    svg
      .select<SVGGElement>(".x.axis")
      .transition()
      .duration(duration)
      .call(
        axisBottom(xScale)
          .tickValues(tickValues)
          .tickFormat(tickValueFormattingFunction)
      );

    pinnedAxes
      .select<SVGGElement>(".y.axis")
      .transition()
      .duration(duration)
      .call(axisLeft(yScale));

    const canvas = svg.select(".canvas");
    // bars, keyed by day so changed data updates in place instead of appending duplicates
    canvas
      .selectAll<SVGRectElement, ChartDataPoint>("rect.total-minutes")
      .data(sort(data, d => d.date), (d) => d.date.getTime())
      .join(
        (enter) => {
            const rects = enter
                .append("rect")
                .attr("y", canvasHeight)
                .attr("height", 0)
                .attr("opacity", () => 0.2);

              rects
                .transition()
                .duration(duration)
                .delay((_, i) => i * 10)
                .attr("y", (d) => yScale(d.totalMinutes))
                .attr("height", (d) => canvasHeight - yScale(d.totalMinutes));

            rects.append("title");
            return rects;
        },
        (update) => update
                      .transition()
                      .duration(duration)
                      .attr("y", (d) => yScale(d.totalMinutes))
                      .attr("height", (d) => canvasHeight - yScale(d.totalMinutes)),

        (exit) => exit.remove(),
      )
      .attr("x", (d) => xScale(d.date) ?? - xScale.bandwidth())
      .attr("width", xScale.bandwidth())
      .attr("data-value", (d) => d.totalMinutes)
      .attr("class", "total-minutes");

    canvas
      .selectAll<SVGRectElement, ChartDataPoint>("rect.own-contribution")
      .data(sort(data, d => d.date), d => d.date.getTime())
      .join(
        (enter) => {
            const rects = enter
                .append("rect")
                .attr("fill", (d) => colorScaleContributionCategorical(d.contribution))
                .attr("y", canvasHeight)
                .attr("height", 0);

            rects                
                .transition()
                .duration(duration)
                .attr("y", (d) => yScale(d.minutes))
                .attr("height", (d) => canvasHeight - yScale(d.minutes));
            rects.append("title");
            return rects;
        },
        (update) => {
          return update
                    .attr("y", canvasHeight)
                    .attr("height", 0)
                    .transition()
                    .duration(duration)
                    .delay((_, i) => 100 + i * 10)
                    .attr("fill", (d) => colorScaleContributionCategorical(d.contribution))
                    .attr("y", (d) => yScale(d.minutes))
                    .attr("height", (d) => canvasHeight - yScale(d.minutes));
        },
        (exit) => exit.remove(),
      )
      .attr("data-value", (d) => d.contribution)
      .attr("class", "own-contribution")
      .attr("x", (d) => xScale(d.date) ?? - xScale.bandwidth())
      .attr("width", xScale.bandwidth())
      .call((rects) =>
        rects
          .select("title")
          .text((d) => describeDataPoint(d)),
      );
  }, [data, viewBoxWidth, viewBoxHeight, xBandValues, contentWidth, timeAggregation]);

  
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
    <div className={`scrollable-canvas ${isResizing ? "resizing" : ""}`}>
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

export default TimePlot;
