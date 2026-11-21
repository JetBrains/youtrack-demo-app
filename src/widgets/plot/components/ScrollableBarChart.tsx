/* eslint-disable no-console */
// Total hours per day. Bars keep a fixed width, so a long range scrolls horizontally
// while the y-axis stays pinned in its own svg.
import { useRef, useEffect } from "react";
import type { ChartDataPoint } from "../utils/types.d.ts";

import { max } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear, scaleThreshold } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { timeMonday } from "d3-time";
import "d3-transition";
import { BAR_STEP, margins } from "../utils/constants.ts";

const TRANSITION_MS = 500;

const formatWeekTick = (ms: number) =>
  new Date(ms).toLocaleDateString([], { day: "2-digit", month: "short" });

const formatDay = (ms: number) =>
  new Date(ms).toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const ScrollableBarChart = ({
  data,
  width,
  height,
  isResizing
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  isResizing: boolean;
}) => {
  const axisRef = useRef<SVGSVGElement>(null);
  const chartRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousDataRef = useRef<ChartDataPoint[] | null>(null);

  const viewHeight = height > 0 ? height : 0;
  const viewWidth = width > 0 ? width : 0;

  // the scrolling area is everything right of the pinned y-axis
  const visibleWidth = viewWidth - margins.left - margins.right;
  const contentWidth = Math.max(visibleWidth, data.length * BAR_STEP + margins.right);
  const canvasHeight = viewHeight - margins.top - margins.bottom;

  useEffect(() => {
    if (!axisRef.current || !chartRef.current) {
      return;
    }
    // not measured yet (or nothing to show): wait for the next width/height/data change
    if (visibleWidth <= 0 || canvasHeight <= 0 || data.length === 0) {
      return;
    }

    if (isResizing) {
      console.log("resizing...")
      return
    }
    console.info("rendering again!")
    // animate only on data changes; resizes must update instantly
    const dataChanged =
      previousDataRef.current !== null && previousDataRef.current !== data;
    const firstPaint = previousDataRef.current === null;
    previousDataRef.current = data;
    const duration = dataChanged ? TRANSITION_MS : 0;

    const days = data.map((d) => d.date.getTime());
    const canvasWidth = contentWidth - margins.right;

    const thresholdScale = scaleThreshold<number, string>([0, 0.5, 1], ["blue", "green", "orange", "red"])

    const xScale = scaleBand<number>()
      .domain(days)
      .range([0, canvasWidth])
      .padding(0.2);

    // domain comes from all data, so the pinned axis never changes while scrolling
    const maxHours = (max(data, (d) => d.totalMinutes) ?? 0) / 60;
    const yScale = scaleLinear()
      .domain([0, maxHours > 0 ? maxHours : 1])
      .range([canvasHeight, 0])
      .nice();

    const mondays = days.filter((ms) => timeMonday(new Date(ms)).getTime() === ms);

    const chart = select(chartRef.current);
    chart
      .select<SVGGElement>(".x.axis")
      .transition()
      .duration(duration)
      .call(
        axisBottom(xScale)
          .tickValues(mondays)
          .tickFormat((d) => formatWeekTick(+d)),
      );

    chart
      .select(".canvas")
      .selectAll<SVGRectElement, ChartDataPoint>("rect.hours")
      .data(data, (d) => d.date.getTime())
      .join(
        (enter) => {
          const rects = enter
            .append("rect")
            .attr("class", "hours")
            .attr("y", canvasHeight)
            .attr("height", 0);
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
      .attr("x", (d) => xScale(d.date.getTime()) ?? 0)
      .attr("width", xScale.bandwidth())
      .call((rects) =>
        rects
          .select("title")
          .text(
            (d) =>
              `${formatDay(d.date.getTime())}: ${(d.totalMinutes / 60).toFixed(1)} h`,
          ),
      )
      .transition()
      .duration(duration)
      .attr("y", (d) => yScale(d.totalMinutes / 60))
      .attr("height", (d) => canvasHeight - yScale(d.totalMinutes / 60))
      .attr("fill", (d) => thresholdScale(d.totalMinutes / 60));

    select(axisRef.current)
      .select<SVGGElement>(".y.axis")
      .transition()
      .duration(duration)
      .call(axisLeft(yScale));

    // start at the most recent data
    if (firstPaint || dataChanged) {
      const el = scrollRef.current;
      if (el) {
        el.scrollLeft = el.scrollWidth;
      }
    }
  }, [data, isResizing, visibleWidth, contentWidth, canvasHeight]);

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

  return (
    <div className={`scrollable-canvas ${isResizing ? "resizing" : ""}`}>
      <svg
        ref={axisRef}
        className="pinned axes"
        width={margins.left}
        height={viewHeight}
      >
        <g
          className="y axis"
          transform={`translate(${margins.left - 1}, ${margins.top})`}
        />
      </svg>
      <div ref={scrollRef} className="scroll-area">
        <svg ref={chartRef} width={contentWidth} height={viewHeight}>
          <g
            className="canvas"
            transform={`translate(0, ${margins.top})`}
          />
          <g
            className="x axis"
            transform={`translate(0, ${margins.top + canvasHeight})`}
          />
        </svg>
      </div>
    </div>
  );
};

export default ScrollableBarChart;
