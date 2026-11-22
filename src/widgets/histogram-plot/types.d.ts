export type WidgetConfiguration = {
    title: string;
    query: string;
}

export type ChartDataPoint = {
    date: Date,
    minutes: number,
    avgMinutes: number,
    totalMinutes: number,
    contribution: number,
    contributionCategory: string
}

export type ChartConfig = {
    viewBoxWidth?: number,
    viewBoxHeight?: number,
    data: ChartDataPoint[],
    width: number,
    height: number
}
