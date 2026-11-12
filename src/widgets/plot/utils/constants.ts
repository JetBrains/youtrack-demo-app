import { scaleDiverging } from "d3";

export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#ffef5b", "#008d4b"]);
// export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#e45bff", "#0065ff"]);

export const contributionLabels = {
    "en": [
        "little",
        "less",
        "average",
        "more",
        "most"
    ]
}

export const margins = { top: 20, right: 20, bottom: 30, left: 40 };
