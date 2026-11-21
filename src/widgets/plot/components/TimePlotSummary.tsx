import Text from "@jetbrains/ring-ui-built/components/text/text.js"
import { rollup, sum } from "d3"
import { differenceInDays } from "date-fns/fp"
import { calculateAverageOtherContribution, compareContributionToRest, formatMinutesAsHoursAndMinutes } from "../utils/helper"
import { contributionLabelScale } from "../utils/colorScales"
import type {ChartDataPoint} from "../utils/types";

const TimePlotSummary = ( { timeframe, data, contributingPeopleCount } ) => {
    const dayCount = differenceInDays(timeframe.from, timeframe.to)
    const anyContributionDayCount = rollup(
        data,
        D => D.length,
        (d: ChartDataPoint) => d.totalMinutes > 0
    )

    const ownContributionDayCount = rollup(
        data,
        D => D,
        (d: ChartDataPoint) => d.minutes > 0
    )

    const daysWithOwnContributionPercent = ownContributionDayCount.has(true) ? ownContributionDayCount.get(true)?.length / dayCount * 100 : 0

    const durationContribution = sum(data, (d: ChartDataPoint) => d.minutes)
    const durationAverageContribution = contributingPeopleCount ?
        (sum(data, (d: ChartDataPoint) => d.totalMinutes))
        : 0
    const contributionGrade = compareContributionToRest([durationContribution, durationAverageContribution])
    return (
        <Text size={Text.Size.M}>
            {/* You contributed on {ownContributionDayCount.get(true)?.length} across the {dayCount} shown days ({daysWithOwnContributionPercent.toFixed(1)}%). */}
            You contributed {(contributionGrade)}, {formatMinutesAsHoursAndMinutes(durationContribution)} out of {formatMinutesAsHoursAndMinutes(sum(data, d => d.totalMinutes))}.
        </Text>
    )
}

export default TimePlotSummary