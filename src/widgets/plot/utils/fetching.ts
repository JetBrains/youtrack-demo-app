import { HostAPI } from "../../../../@types/globals";
import {AlertType} from "@jetbrains/ring-ui-built/components/alert/alert";
import {mockData} from "./mockData.ts";
import type {FetchedDataPoint} from "./types.d.ts";

export const fetchWorkItems = async (
    host: HostAPI | null,
    from: Date,
    to: Date,
    query: string
): Promise<FetchedDataPoint[]> => {
    // No YouTrack host (e.g. `npm run dev`): use mock data in dev, nothing in production
    if (!host) {
        return import.meta.env.DEV ? mockData(from, to, ["Alice", "Bob", "Charlie"], 500) : [];
    }

    try {
        const fields = "id,author(id,name,login),duration(minutes),date,text,issue(id,customFields(id,name,value(id,name)))"
        const startDate = from.toISOString().split("T")[0];
        const endDate = to.toISOString().split("T")[0];
        return await host.fetchYouTrack<FetchedDataPoint[]>(`workItems?startDate=${startDate}&endDate=${endDate}&fields=${fields}&query=${query}`);
    } catch (error) {
        host.alert('YTApp: could not request custom HTTP endpoint', 'error' as AlertType.ERROR)
        return []
    }
}
