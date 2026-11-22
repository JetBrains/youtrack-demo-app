// we only feed raw data into the component.
import { useRef, useEffect, useMemo } from "react";
import type { ChartDataPoint } from "./types.d.ts";

import { max, sort, union } from "d3-array";
import { select } from "d3-selection";
import { scaleBand, scaleLinear } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { timeDay, timeDays } from "d3-time";
import "d3-transition";

import {describeDataPoint} from "../../utils/helper.ts";
import {margins} from "../../utils/constants.ts";
import {TimeAggregationOption} from "../../utils/classes.ts";
import {changeOpacity, colorScaleContributionCategorical, intensityScale} from "../../utils/colorScales.ts";
import {timeMondays, timeFormat, timeMonday, timeSunday} from "d3";

const TRANSITION_MS = 500;
const MIN_STEP_WIDTH = 30;

const WEEKDAYS = timeDays(timeMonday(new Date()), timeMonday.ceil(new Date())).map(
    d => timeFormat("%a")(d)
);

// YouTrack's user locale if available (not on localhost), otherwise the browser's language
const getLocale = (): string => {
    const candidates = [
        typeof YTApp !== "undefined" ? YTApp.locale : undefined,
        navigator.language,
    ];
    return candidates.find((l) => {
        if (!l) return false;
        try {
            return Intl.DateTimeFormat.supportedLocalesOf(l.replace("_", "-")).length > 0;
        } catch {
            return false;
        }
    })?.replace("_", "-") ?? "en";
};

const TilePlot = ({
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

    // x: one band per aggregated day/week/... in the timeframe
    const xBandValues: Date[] = useMemo(
        () => timeMondays(timeDay.floor(timeframe.from), timeDay.ceil(timeframe.to)),
        [timeframe.from, timeframe.to],
    );

    const canvasWidth = viewBoxWidth - margins.left - margins.right;
    const canvasHeight = viewBoxHeight - margins.top - margins.bottom;

    // y: one band per weekday, Monday (0) at the top to Sunday (6) at the bottom
    const yScale = scaleBand<number>()
        .domain(WEEKDAYS, d => timeFormat("%a")(d))
        .range([0, canvasHeight])
        .padding(0.2);

    // the scrolling area is everything right of the pinned y-axis; it must be wider than
    // the visible area, otherwise .scroll-area has nothing to scroll
    const visibleCanvasWidth = viewBoxWidth - margins.left - margins.right;
    const contentWidth = union(xBandValues).size * yScale.step();

    useEffect(() => {
        if (!chartRef.current || !pinnedRef.current) {
            return;
        }

        const svg = select(chartRef.current);
        const pinnedAxes = select(pinnedRef.current);

        // not measured yet (or nothing to show): wait for the next width/height/data change
        if (canvasWidth <= 0 || canvasHeight <= 0 || data.length === 0) {
            return;
        }

        // animate only when the data or category toggles changed (and it is not the first paint);
        // resizes must update instantly, otherwise every resize tick restarts all transitions
        const dataChanged = previousDataRef.current !== null && previousDataRef.current !== data;
        previousDataRef.current = data;

        const duration = dataChanged ? TRANSITION_MS : 0;


        const xScale = scaleBand<Date>()
            .domain(xBandValues)
            .range([0, contentWidth])
            .padding(0.2);

        const tickValues: Set<Date> = union(xBandValues)

        svg
            .select<SVGGElement>(".x.axis")
            .transition()
            .duration(duration)
            .call(
                axisBottom(xScale)
                    .tickValues(tickValues)
                    .tickFormat(timeFormat("cw %V"))
            );

        pinnedAxes
            .select<SVGGElement>(".y.axis")
            .transition()
            .duration(duration)
            .call(axisLeft(yScale));

        const canvas = svg.select(".canvas");

        canvas
            .selectAll<SVGRectElement, ChartDataPoint>("rect.own-contribution")
            .data(sort(data, d => d.date), d => d.date.getTime())
            .join(
                (enter) => {
                    const rects = enter.append("rect");
                    rects.append("title");
                    return rects;
                },
                (update) => {
                    return update
                },
                (exit) => exit.remove(),
            )
            .attr("data-value", (d) => d.contribution)
            .attr("data-date", (d) => d.date)
            .attr("class", "own-contribution")
            .attr("x", (d) => xScale(timeMonday(d.date)) ?? - xScale.bandwidth())
            .attr("width", xScale.bandwidth())
            .attr("rx", 0.2 * xScale.bandwidth())
            .attr("y", (d) => yScale(timeFormat("%a")(d.date)))
            .attr("ry", 0.2 * yScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .transition()
            .duration(duration)
            .attr("fill", (d) => changeOpacity(colorScaleContributionCategorical(d.contribution), intensityScale(d.minutes)))
            .call((rects) =>
                rects
                    .select("title")
                    .text((d) => describeDataPoint(d)),
            );
    }, [data, viewBoxWidth, viewBoxHeight, xBandValues, contentWidth]);


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

export default TilePlot;
