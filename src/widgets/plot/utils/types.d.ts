export type author = {
    id: string;
    login: string;
    name: string;
}

export type FetchedDataPoint = {
    duration: {
        minutes: number
    };
    category?: string;
    author: author;
    date: number;
}

export type ExtractedDataPoint = {
    minutes: number;
    authorId: string;
    date: Date;
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
    height: number,
    mode: "day" | "week"
}

export interface WidgetConfiguration {
    query: string;
}
