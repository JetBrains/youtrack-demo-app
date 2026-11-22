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