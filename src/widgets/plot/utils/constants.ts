import { scaleDiverging, timeDay, timeFormat, timeMonday, timeMonth, timeYear } from "d3";
import { TimeAggregationOption } from "./classes";
import { startOfQuarter } from "date-fns/fp";


// export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#ffef5b", "#008d4b"]);

export const contributionLabels = {
    "en": [
        "little",
        "less",
        "average",
        "more",
        "most"
    ]
}

export const margins = { top: 20, right: 20, bottom: 50, left: 40 };
// horizontal px per day in the scrollable bar chart (bar + gap)
export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#e45bff", "#0065ff"]);

export const timeAggregationOptions: Map<string, TimeAggregationOption> = new Map(
    [
        ["day", new TimeAggregationOption(timeDay, timeFormat("%d"))],
        ["week", new TimeAggregationOption(timeMonday, timeFormat("cw %V"))],
        ["month", new TimeAggregationOption(timeMonth, timeFormat("%b"))],
        ["quarter", new TimeAggregationOption(startOfQuarter, timeFormat("Q%q %G"))],
        ["year", new TimeAggregationOption(timeYear, timeFormat("%Y"))]
    ]
)