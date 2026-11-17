import { TimeInterval } from "d3";

export class TimeAggregationOption {
    dateAggregationFunction: TimeInterval | ((date: Date) => Date);
    tickValueFormattingFunction: (date: Date) => string;

    constructor(
        dateAggregationFunction: TimeInterval | ((date: Date) => Date),
        tickValueFormattingFunction: (date: Date) => string
    ) {
        this.dateAggregationFunction = dateAggregationFunction;
        this.tickValueFormattingFunction = tickValueFormattingFunction;
    }
}
