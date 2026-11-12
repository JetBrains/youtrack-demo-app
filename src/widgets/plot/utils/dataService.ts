import {
    author, FetchedDataPoint
} from "./types.d.ts";

import {rollup} from "d3";

export const extractAllPeople = (fetchedData: FetchedDataPoint[]): author[] => {
    const lookup = rollup(fetchedData, D => D[0].author, d => d.author.id);
    return Array.from(lookup.values());
};
