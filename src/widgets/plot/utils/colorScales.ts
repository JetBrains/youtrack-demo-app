import {color, InternMap, scaleBand, scaleDiverging, scaleLinear, scaleThreshold, zip} from "d3";
import { colorScaleContributionLinear, contributionLabels } from "./constants";

export const intensityScale = scaleLinear().domain([0, 60]).range([0, 1]);

export const changeOpacity = (colorString: string, opacity: number): string => {
    if (colorString.length === 0) {
        return "transparent";
    }
    if (color(colorString) === null) {
        return colorString
    }
    return color(colorString)!.copy({ opacity }).formatHex8()
}
const labels = contributionLabels.en;
const n = labels.length;

export const colorScaleContributionCategorical = scaleThreshold<number, string>()
    .domain(Array.from({ length: Math.max(0, n - 1) }, (_, i) => (i + 1) / n))
    .range(
        labels.map((_, i) =>
            colorScaleContributionLinear(n === 1 ? 0 : i / (n - 1))
        )
);

const constructContributionLabelScale = (labels: string[]) => {
    // without borders
    const bandCount = labels.length;
    const thresholds = Array.from(
        { length: bandCount - 1 },
        (_, idx) => (idx + 1) / bandCount
    );

    return scaleThreshold<number, string>()
        .domain(thresholds)
        .range(labels);
}
export const contributionLabelScale = constructContributionLabelScale(contributionLabels.en)

const constructContributionCategoryColour = (labels: string[]) => {
    const colors: string[] = labels.map((_, i) => colorScaleContributionLinear(i / (labels.length - 1)));
    const pairs = zip(labels, colors) as [string, string][]
    return new InternMap(pairs)
}

export const contributionCategoryColour: InternMap<string, string> = constructContributionCategoryColour(contributionLabels.en);