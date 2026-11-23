import { InternMap } from "d3";

export type WidgetConfiguration = {
    title: string;
    query: string;
    binSize: number;
}

export type ChartData = InternMap<string, InternMap<number, number>>

export type ChartConfig = {
    viewBoxWidth?: number,
    viewBoxHeight?: number,
    data: ChartData,
    width: number,
    height: number,
    binWidthMinutes: number,
}
