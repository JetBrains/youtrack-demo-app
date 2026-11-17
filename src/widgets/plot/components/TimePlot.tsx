// we only feed raw data into the component.
import { useRef, useEffect } from "react";
import { ChartDataPoint } from "../utils/types.d.ts";

import { colorScaleContributionCategorical } from "../utils/colorScales.ts";

import { every, max, union } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { timeDay, timeMonday } from "d3-time";
import "d3-transition";
import { easeBounce, easeBounceIn, easeElastic } from "d3";
import { describeDataPoint } from "../utils/helper.ts";
import { margins } from "../utils/constants.ts";

const TRANSITION_MS = 500;
const MIN_TICK_SPACING_PX = 48;
const MIN_STEP_WIDTH = 25;

const formatWeekTick = (ms: number) =>
  new Date(ms).toLocaleDateString([], { day: "2-digit", month: "short" });


const TimePlot = ({
  data,
  timeframe,
  width,
  height,
  isResizing
}: {
  data: ChartDataPoint[];
  timeframe: { from: Date, to: Date };
  width: number;
  height: number;
  isResizing: boolean;
}) => {
  const pinnedRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef<ChartDataPoint[] | null>(null);

  const viewBoxHeight = height > 0 ? height : 0;
  const viewBoxWidth = width > 0 ? width : 0;

  useEffect(() => {
    if (!chartRef.current) {
        return;
    }

    console.log(timeframe)
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

    const svg = select(chartRef.current);
    const pinnedAxes = select(pinnedRef.current);

    // x: one band per day from the first day with data until now
    const days: Date[] = timeDay
      .range(timeDay.floor(timeframe.from), timeDay.ceil(timeframe.to));

    // the scrolling area is everything right of the pinned y-axis
    const contentWidth = Math.max(canvasWidth, data.length * MIN_STEP_WIDTH);

    const xScale = scaleBand<number>()
      .domain(days)
      .range([0, contentWidth])
      .padding(0.2);

      console.log(xScale.domain().length)

    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.totalMinutes) as number])
      .range([canvasHeight, 0])
      .nice();

    const tickValues: Set<Date> = union(days.map((d: Date) => timeMonday(d)))
    svg
      .select<SVGGElement>(".x.axis")
      .transition()
      .duration(duration)
      .call(
        axisBottom(xScale)
            .tickValues(tickValues)
          .tickFormat(d => new Date(d).toLocaleDateString([], { "weekday": "short" }))
      );

    pinnedAxes
      .select<SVGGElement>(".y.axis")
      .transition()
      .duration(duration)
      .call(axisLeft(yScale));

    const canvas = svg.select(".canvas");

    // bars, keyed by day so changed data updates in place instead of appending duplicates
    canvas
      .selectAll<SVGRectElement, ChartDataPoint[]>("rect.total-minutes")
      .data(data, (d) => d.date)
      .join(
        (enter) => {
            const rects = enter
                .append("rect")
                .attr("class", "total-minutes")
                .attr("x", (d) => xScale(d.date.getTime()) ?? 0)
                .attr("width", xScale.bandwidth())
                .attr("y", canvasHeight)
                .attr("height", 0)
                .attr("opacity", (d) => 0.2);
            rects.append("title");
            return rects;
        },
        (update) => update,
        (exit) =>
          exit
            .transition()
            .duration(duration)
            .attr("y", canvasHeight)
            .attr("height", 0)
            .remove(),
      )
      .attr("data-value", (d) => d.totalMinutes)
      .transition()
      .duration(duration)
      .attr("x", (d) => xScale(d.date.getTime()) ?? 0)
      .attr("width", xScale.bandwidth())
      .attr("y", (d) => yScale(d.totalMinutes))
      .attr("height", (d) => canvasHeight - yScale(d.totalMinutes));

    canvas
      .selectAll<SVGRectElement, ChartDataPoint>("rect.own-contribution")
      .data(data, d => d.date)
      .join(
        (enter) => {
            const rects = enter
                .append("rect")
                .attr("class", "own-contribution")
                .attr("x", (d) => xScale(d.date.getTime()) ?? 0)
                .attr("width", xScale.bandwidth())
                .attr("y", canvasHeight)
                .attr("height", 0)
            rects.append("title");
            return rects;
        },
        (update) => {
          return update
        },
        (exit) =>
            exit
                .transition()
                .duration(duration)
                .transition()
                .delay(200)
                .remove(),
      )
      .attr("data-value", (d) => d.contribution)
      .call((rects) =>
        rects
          .select("title")
          .text((d) => describeDataPoint(d)),
      )
      .attr("x", (d) => xScale(d.date.getTime()) ?? 0)
      .attr("width", xScale.bandwidth())
      .transition()
      .duration(duration / 2)
      .attr("fill", (d) => colorScaleContributionCategorical(d.contribution))
      .transition()
      .duration(duration)
      .attr("y", (d) => yScale(d.minutes))
      .attr("height", (d) => yScale(0) - yScale(d.minutes))
      ;
  }, [data, viewBoxWidth, viewBoxHeight]);

  
  // hovering the chart + mouse wheel scrolls it horizontally, handled via d3's event binding
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const area = select(el);
    area.on(
      "wheel.scroll",
      function (event: WheelEvent) {
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
  const canvasWidth = viewBoxWidth - margins.left - margins.right;
  return (
    <div className={`scrollable-bar-chart ${isResizing ? "resizing" : ""}`}>
      <svg
        ref={pinnedRef}
        className="pinned axes"
        width={margins.left}
        height={viewBoxHeight}
      >
        <g
          className="y axis"
          transform={`translate(${margins.left}, ${margins.top})`}
        />
      </svg>
      <div ref={scrollRef} className="scroll-area">
        <svg 
          ref={chartRef}
          width={viewBoxWidth - margins.left}
          height={viewBoxHeight - margins.top}
          transform={`translate(0, ${margins.top})`}
        >
          <g
            className="canvas"
          />
          <g
            className="x axis"
            transform={`translate(0, ${canvasHeight})`}
          />
        </svg>
      </div>
    </div>
  );
};

export default TimePlot;
