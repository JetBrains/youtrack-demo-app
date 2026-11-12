import { HostAPI } from "../../../../@types/globals";
import {AlertType} from "@jetbrains/ring-ui-built/components/alert/alert";
import {mockData} from "./mockData.ts";

export const fetchWorkItems = async (host: HostAPI, from: Date, to: Date, query: string) => {
    try {
        if (true) {
            return mockData(from, to, ["Alice", "Bob", "Charlie"], 500)
        }
        const fields = "id,author(id,name,login),duration(minutes),date,text,issue(id,customFields(id,name,value(id,name)))"
        const startDate = from.toISOString().split("T")[0];
        const endDate = to.toISOString().split("T")[0];
        return await host.fetchYouTrack(`workItems?startDate=${startDate}&endDate=${endDate}&fields=${fields}&query=${query}`);
    } catch (error) {
        host.alert('YTApp: could not request custom HTTP endpoint', 'error' as AlertType.ERROR)
        return
    }
}
