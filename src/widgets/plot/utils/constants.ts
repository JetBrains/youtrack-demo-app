import { scaleDiverging } from "d3";

export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#ffef5b", "#008d4b"]);

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
export const BAR_STEP = 10;
// export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#e45bff", "#0065ff"]);