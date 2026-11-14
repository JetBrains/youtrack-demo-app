import {FetchedDataPoint, ExtractedDataPoint, ChartDataPoint} from "./types.d.ts";
import {timeDay} from "d3-time";
import {rollup, sum, union} from "d3-array";
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
                                from: Date,
                                to: Date,
                                groupingFunction: (d: Date) => Date): ChartDataPoint[] => {

    const uniquePersons = union(extractedDataPoints.map(d => d.authorId))
    const minutesByTimeframe = rollup(extractedDataPoints,
        D => {
            return {
                totalMinutes: sum(D, d => d.minutes),
                uniquePersons: uniquePersons.size
            }
        },
        d => groupingFunction(new Date(d.date))
    );

    const minutesByTimeframeAndPersonId = rollup(extractedDataPoints,
        D => sum(D, d => d.minutes),
        d => groupingFunction(new Date(d.date)),
        d => d.authorId
    );

    const allDays = minutesByTimeframe.keys();
    const fillDates = allDays.map(date => {
        const dateToCheck = date;
        const somebodyDidSomething = minutesByTimeframe.has(dateToCheck);

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
        const {totalMinutes} = minutesByTimeframe.get(dateToCheck)!;
        const ownContribution: number = minutesByTimeframeAndPersonId.get(dateToCheck)!.get(authorId) || 0;
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
//
// export const addWeekAggregates = (dayPoints: ChartDataPoint[]): ChartDataPoint[] => {
//     const minutesByWeek = rollup(dayPoints,
//         D => {
//             return {
//                 totalMinutes: sum(D, d => d.totalMinutes),
//                 minutes: sum(D, d => d.minutes),
//                 avgMinutes: sum(D, d => d.avgMinutes),
//             }
//         },
//         d => timeMonday(d.date).getTime()
//     )
//
//     const weekAggregates: ChartDataPoint[] = Array.from(minutesByWeek.entries()).map(([weekTimestamp, { totalMinutes, minutes, avgMinutes }]) => {
//         const weekDate = new Date(weekTimestamp);
//         const contribution = compareContributionToRest([minutes, avgMinutes])
//
//         return {
//             date: weekDate,
//             minutes,
//             avgMinutes,
//             totalMinutes,
//             contribution,
//             contributionCategory: contributionLabelScale(contribution),
//             isWeekAggregate: true
//         }
//     })
//
//     return [...dayPoints, ...weekAggregates]
// }
//
// export const getAverageContributionPerCategory = (evaluatedDataPoints: ChartDataPoint[]): CountChartDataPoint[] => {
//     // to get the average contribution of e.g. "little" we have to look at avg minutes on category "most" for perspective Person!
//     const averageContributionByLabel = rollup(evaluatedDataPoints,
//         D => {
//             const allNonZeroDays = D.filter(d => d.totalMinutes)
//             return median(allNonZeroDays, d => d.avgMinutes)
//         },
//         d => contributionLabelScale(1 - d.contribution))
//
//     const medianContributionByLabel = rollup(evaluatedDataPoints,
//         D => {
//             const allNonZeroDays = D.filter(d => d.totalMinutes)
//             return {
//                 value: median(allNonZeroDays, d => d.minutes),
//                 benchmark: averageContributionByLabel.get(D[0].contributionCategory)
//             }
//         },
//         d => d.contributionCategory
//     )
//     const dummyResult = { value: 0, benchmark: 0 }
//     return contributionLabels.en.map((label: string) => {
//         const labelIsPresent = medianContributionByLabel.has(label)
//             if (labelIsPresent) {
//                 const values = medianContributionByLabel.get(label)
//                 return { label, ...dummyResult, ...values }
//             }
//         return  { label, ...dummyResult }
//     })
// }

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

export const getDayCountContributionCategories = (evaluatedDataPoints: ChartDataPoint[]): ChartDataPoint[] => {
    const allNonZeroDays = evaluatedDataPoints.filter(d => d.totalMinutes)
    // to get the average contribution of e.g. "little" we have to look at avg minutes on category "most" for perspective Person!
    const otherContributionByLabel = rollup(allNonZeroDays,
        D => {
            const allNonZeroDays = D.filter(d => d.totalMinutes)
            return allNonZeroDays.length
        },
        d => contributionLabelScale(1 - d.contribution)
    )

    const countsByLabel = rollup(allNonZeroDays,
        D => D.length,
        d => d.contributionCategory
    )

    return contributionLabels.en.map((label: string) => {
        return (
            {
                label,
                value: countsByLabel.get(label) || 0,
                benchmark: otherContributionByLabel.get(label) || 0,
            })
    })
}