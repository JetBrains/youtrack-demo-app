import { scaleDiverging } from "d3";
import {timeDay, timeMonday, timeMonth} from "d3-time";

// export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#ffef5b", "#008d4b"]);
export const colorScaleContributionLinear = scaleDiverging(["#ff1f6b", "#e45bff", "#0065ff"]);

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

export const groupingFunction = (d: Date) => timeMonday(d)

// Used only in dev preview (no YouTrack host) to generate fake worklogs
export const MOCK_AUTHORS = ["Alice", "Bob", "Carol"];
export const MOCK_WORKLOG_COUNT = 400;