import { InternMap } from "d3";

type relativeTimeframe = {
    amount: number;
    unit: "days" | "weeks" | "months" | "years";
}

export type WidgetConfiguration = {
    title: string;
    query: string;
    binSize: number;
    groupWorkItemsBy: "none" | "day" | "week" | "month" | "quarter" | "year";
    timeframe: {
        start: relativeTimeframe;
        end: relativeTimeframe;
    }
}

export type ChartData = InternMap<number, number>

export type ChartConfig = {
    viewBoxWidth?: number,
    viewBoxHeight?: number,
    data: ChartData,
    width: number,
    height: number,
    binWidthMinutes: number,
    maxX: number,
    maxY: number,
}
