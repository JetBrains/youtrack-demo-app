import type {FetchedDataPoint, ExtractedDataPoint, ChartDataPoint} from "./types.d.ts";
import {timeDay} from "d3-time";
import { rollup, sum, union } from "d3-array";
import {compareContributionToRest} from "./helper.ts";
import {contributionLabelScale} from "./colorScales.ts";
import {contributionLabels} from "./constants.ts";

export const extractRelevantInfo = (fetchedData: FetchedDataPoint[]): ExtractedDataPoint[] => fetchedData.map(d => {
    const date = timeDay.floor(new Date(d.date));
    return {
        authorId: d.author.id,
        minutes: d.duration.minutes,
        date
    };
})

export const evaluateFromPOV = (authorId: string,
                                extractedDataPoints: ExtractedDataPoint[],
                                groupingFunction: (d: Date) => Date): ChartDataPoint[] => {
                     
    const uniquePersons = union(extractedDataPoints.map(d => d.authorId))
    const minutesByTimeframe = rollup(extractedDataPoints,
        D => {
            return {
                totalMinutes: sum(D, d => d.minutes),
                uniquePersons: uniquePersons.size
            }
        },
        d => groupingFunction(d.date)
    );

    const minutesByTimeframeAndPersonId = rollup(extractedDataPoints,
        D => sum(D, d => d.minutes),
        d => groupingFunction(d.date),
        d => d.authorId
    );

    const allDays = Array.from(minutesByTimeframe.keys());

    const fillDates = allDays.map(date => {

        const somebodyDidSomething = minutesByTimeframe.has(date);

        if (somebodyDidSomething === false) {
            return {
                date,
                minutes: 0,
                totalMinutes: 0,
                contribution: 0.5,
                avgMinutes: 0,
                contributionCategory: contributionLabelScale(0.5)
            }
        }
        const {totalMinutes} = minutesByTimeframe.get(date)!;
        const ownContribution: number = minutesByTimeframeAndPersonId.get(date)!.get(authorId) || 0;
        const avgMinutes = (totalMinutes - ownContribution) / (uniquePersons.size - 1);
        
        const contribution = compareContributionToRest([ownContribution, avgMinutes])

        return {
            date,
            totalMinutes,
            contribution,
            avgMinutes: avgMinutes,
            contributionCategory: contributionLabelScale(contribution),
            minutes: ownContribution
        }
    })
    return fillDates
}

export type CategorySummary = { label: string; days: number; ownMinutes: number };

// per category: number of days with any work (by anybody) and the perspective person's own minutes on those days
export const getCategorySummary = (evaluatedDataPoints: ChartDataPoint[]): CategorySummary[] => {
    const workedDays = evaluatedDataPoints.filter(d => d.totalMinutes)
    const byLabel = rollup(workedDays,
        D => ({days: D.length, ownMinutes: sum(D, d => d.minutes)}),
        d => d.contributionCategory
    )

    return contributionLabels.en.map((label: string) => {
        const entry = byLabel.get(label)
        return {label, days: entry?.days ?? 0, ownMinutes: entry?.ownMinutes ?? 0}
    })
}
