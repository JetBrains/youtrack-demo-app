// we only feed raw data into the component.
import { useRef, useEffect } from "react";
import {ChartDataPoint, ExtractedDataPoint} from "../utils/types.d.ts";

import { colorScaleContributionCategorical } from "../utils/colorScales.ts";

import { max, union } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { timeDay } from "d3-time";
import "d3-transition";
import {easeBounce, easeBounceIn, easeElastic, every, map, timeDays} from "d3";
import {describeDataPoint, getEmptyMap, toHoursAndMinutes} from "../utils/helper.ts";
import { margins } from "../utils/constants.ts";
import {AggregationValue} from "../utils/classes.ts";
import {formatDuration} from "date-fns/formatDuration";

const TRANSITION_MS = 500;
const MIN_TICK_SPACING_PX = 48;

const formatWeekTick = (ms: number) =>
  new Date(ms).toLocaleDateString([], { day: "2-digit", month: "short" });


const TimePlot = ({
  data,
  timeframe,
  width,
  height,
  timeAggregation
}: {
  data: ChartDataPoint[];
  timeframe: {from: Date, to: Date};
  width: number;
  height: number;
  timeAggregation: AggregationValue;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const previousDataRef = useRef<ChartDataPoint[] | null>(null);
  const previousActiveRef = useRef<Set<string> | null>(null);

  const viewBoxHeight = height > 0 ? height : 0;
  const viewBoxWidth = width > 0 ? width : 0;

  useEffect(() => {
    if (!svgRef.current) {
        return;
    }

    const canvasWidth = viewBoxWidth - margins.left - margins.right;
    const canvasHeight = viewBoxHeight - margins.top - margins.bottom;
    // not measured yet (or nothing to show): wait for the next width/height/data change
    if (canvasWidth <= 0 || canvasHeight <= 0 || data.length === 0) {
        return;
    }

    // animate only when the data or category toggles changed (and it is not the first paint);
    // resizes must update instantly, otherwise every resize tick restarts all transitions
    const dataChanged = previousDataRef.current !== null && previousDataRef.current !== data;
    const categoriesChanged = previousActiveRef.current !== null;
    previousDataRef.current = data;

    const duration = dataChanged || categoriesChanged ? TRANSITION_MS : 0;

    const svg = select(svgRef.current);

    // x: one band per day from the first day with data until now
    const minDate = data[0].date;
    const days: Date[] = timeDays(timeDay.floor(timeframe.from), timeDay.ceil(timeframe.to));

    const xScale = scaleBand<number>()
      .domain(map(days, timeAggregation.agg))
      .range([0, canvasWidth])
      .padding(0.2);

    const yScale = scaleLinear()
      .domain([0, max(data, (d) => d.totalMinutes) as number])
      .range([canvasHeight, 0])
      .nice();

    const tickValues: Set<Date> = union(map(days, timeAggregation.agg));
    svg
      .select<SVGGElement>(".x.axis")
      .transition()
      .duration(duration)
      .call(
        axisBottom(xScale)
          .tickValues(tickValues.values())
          .tickFormat((d) => timeAggregation.tickValueFormat(d)),
      );

    const tickValueFormatting = (totalMinutes) => {
      const { hours, minutes } = toHoursAndMinutes(totalMinutes);
      if (hours <= 0) {
        return `${minutes}m`;
      }
      return `${hours}h ${minutes}m`
    }
    svg
      .select<SVGGElement>(".y.axis")
      .transition()
      .duration(duration)
      .call(axisLeft(yScale)
          .tickFormat((d: number) => tickValueFormatting(d))
      );

    const canvas = svg.select(".canvas");

    console.log(data.length, data[0])
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
      // .attr("fill", (d) => colorScaleContributionCategorical(1 - d.contribution));

    canvas
      .selectAll<SVGRectElement, ChartDataPoint>("rect.own-contribution")
      .data(data, d => d.date)
      .join(
        (enter) => {
            const rects = enter
                .append("rect")
                .attr("class", "own-contribution")
                .attr("data-date", (d) => d.date)
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
                .attr("y", canvasHeight)
                .attr("height", 0)
                .remove()
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
      .attr("height", (d) => yScale(0) - yScale(d.minutes));
  }, [data, viewBoxWidth, viewBoxHeight]);

  const canvasHeight = viewBoxHeight - margins.top - margins.bottom;

  return (
    <svg
      ref={svgRef}
      width={viewBoxWidth}
      height={viewBoxHeight}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    >
      <g
        className="axes"
        transform={`translate(${margins.left}, ${margins.top})`}
      >
        <g className="x axis" transform={`translate(0, ${canvasHeight})`}/>
        <g className="y axis"/>
      </g>
      <g
        className="canvas"
        transform={`translate(${margins.left}, ${margins.top})`}
      />
    </svg>
  );
};

export default TimePlot;
