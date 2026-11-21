import { InternMap, union, timeMonday, timeMondays, timeDays, timeDay } from "d3";
import type {ChartDataPoint} from "./types.d.ts";
import {formatDuration} from "date-fns/formatDuration";
import {contributionLabelScale} from "./colorScales.ts";
import type {HostAPI} from "../../../../@types/globals";

// Resolves the YouTrack host, or null when running outside YouTrack (plain dev server)
export const getHost = async (): Promise<HostAPI | null> => {
    if (typeof YTApp === "undefined") {
        return null;
    }
    try {
        return await YTApp.register();
    } catch {
        return null;
    }
}


export const margin = {
    left: 50,
    right: 10,
    bottom: 30,
    top: 10,
}

export const getMondays = (from: Date, to: Date) => {
    return union([timeMonday.floor(from), ...timeMondays(from, to, 1), timeDay.floor(to)])
}

export const toHoursAndMinutes = (totalMinutes: number) => ({
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
});

export const describeDataPoint = (d: ChartDataPoint) => {
    const dateString = `${d.date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric", weekday: "short" })}`
    if (d.totalMinutes === 0) {
        return `${dateString}\nno work done by anybody`
    }

    return (
        `${dateString}\n\n` +
        `Contributed ${contributionLabelScale(d.contribution)} in comparison to all members.\n` +
        `${formatDuration(toHoursAndMinutes(d.minutes), { zero: false })} out of ${formatDuration(toHoursAndMinutes(d.totalMinutes), { zero: false })} (${(d.contribution * 100).toFixed(0)}%)`
    )
}

// Takes a date and returns a function that yields its quarter label, e.g. "Q1"
export const getQuarterLabel = (date: Date): (() => string) => {
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return () => `Q${quarter}`;
};

export const getEmptyMap =(from: Date, to: Date) => timeDays(timeDay.floor(from), timeDay.ceil(to))

export const calculateAverageOtherContribution = (
    minutesByPerson: InternMap<string, number>,
    excludePerson: string
): number => {
    const otherPeople = Array.from(minutesByPerson.entries())
        .filter(([person]) => person !== excludePerson)
        .map(([, minutes]) => minutes);

    if (otherPeople.length === 0) {return 0;}
    return otherPeople.reduce((sum, minutes) => sum + minutes, 0) / otherPeople.length;
};

export const compareContributionToRest = ([personalContribution = 0, otherContributions = 0]: [number, number]) => {
    if (
        !Number.isFinite(personalContribution) ||
        !Number.isFinite(otherContributions) ||
        personalContribution < 0 ||
        otherContributions < 0
    ) {
        throw new Error("Both values must be finite numbers greater than or equal to 0");
    }

    const total = personalContribution + otherContributions;

    // Undefined mathematically, but 0 is usually the most useful result.
    if (total === 0) {return .5;}


    return personalContribution / total;
};