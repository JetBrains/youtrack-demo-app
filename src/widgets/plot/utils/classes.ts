export type AggregationValue = { agg: (d: Date) => Date, tickValueFormat: (d: Date) => string };

export type AggregationEntry = [string, AggregationValue];

export class AggregationConfiguration extends Map<string, AggregationValue> {
    constructor(entries: AggregationEntry[]) {
        super(entries);
    }
}