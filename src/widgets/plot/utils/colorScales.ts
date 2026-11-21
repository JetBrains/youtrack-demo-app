import { color, InternMap, scaleLinear, scaleThreshold, zip } from "d3";
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

export const colorScaleContributionCategorical = scaleThreshold(
    contributionLabels.en.map((_, i) => i / contributionLabels.en.length),
    [...contributionLabels.en.map((_, i) => colorScaleContributionLinear(i/ contributionLabels.en.length / 0.8))]
)

const constructContributionLabelScale = (labels: string[]) => {
    // without borders
    const bandCount = labels.length;
    // n labels need n - 1 thresholds (scaleThreshold's range has one more entry than its domain)
    const thresholds: number[] = Array(bandCount - 1).fill(0).map((_, idx) => ((idx + 1) / bandCount));
    return scaleThreshold(thresholds, labels);
}

export const contributionLabelScale = constructContributionLabelScale(contributionLabels.en)

const constructContributionCategoryColour = (labels: string[]) => {
    const colors: string[] = labels.map((_, i) => colorScaleContributionLinear(i / (labels.length - 1)));
    const pairs = zip(labels, colors) as [string, string][]
    return new InternMap(pairs)
}

export const contributionCategoryColour: InternMap<string, string> =
    constructContributionCategoryColour(contributionLabels.en);