import type {
    author, FetchedDataPoint
} from "./types.d.ts";

import {map, rollup, sort, union} from "d3";

export const extractAllPeople = (fetchedData: FetchedDataPoint[]): author[] => {
    const byLogin = new Map<string, author>();
    for (const d of fetchedData) {
        if (!byLogin.has(d.author.login)) byLogin.set(d.author.login, d.author);
    }
    return Array.from(byLogin.values()).sort((a, b) => a.name.localeCompare(b.name));
};