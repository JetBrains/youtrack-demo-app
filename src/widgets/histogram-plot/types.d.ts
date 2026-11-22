export type WidgetConfiguration = {
    title: string;
    query: string;
}

export type ChartDataPoint = {
    bracket: string;
    count: number
}

export type ChartConfig = {
    viewBoxWidth?: number,
    viewBoxHeight?: number,
    data: ChartDataPoint[],
    width: number,
    height: number
}
