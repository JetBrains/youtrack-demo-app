import {
    author, FetchedDataPoint
} from "./types.d.ts";

import {rollup, sort} from "d3";

export const extractAllPeople = (fetchedData: FetchedDataPoint[]): author[] => {
    const lookup = rollup(fetchedData, D => D[0].author, d => d.author.id);
    sort(lookup, (a, b) => a[0].name - b[0].name)
    return Array.from(lookup.values());
};