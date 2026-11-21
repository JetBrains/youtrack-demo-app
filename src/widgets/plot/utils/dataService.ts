import type {
    author, FetchedDataPoint
} from "./types.d.ts";

import {map, rollup, sort, union} from "d3";

export const extractAllPeople = (fetchedData: FetchedDataPoint[]): author[] => {
    const onlyAuthors = union(map(fetchedData, d => d.author).sort((a, b) => a.name.localeCompare(b.name)))
    return Array.from(onlyAuthors.values());
};