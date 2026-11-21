/* eslint-disable no-console */
import React, { memo, useEffect, useState } from "react";

import type { EmbeddableWidgetAPI, HostAPI } from "../../../@types/globals";
import { Configuration } from "./components/Configuration.tsx";
import type { WidgetConfiguration } from "./utils/types.d.ts";
import "@jetbrains/ring-ui-built/components/style.css";
import "./app.css";
import { sub } from "date-fns";

import { extractAllPeople } from "./utils/dataService.ts";
import { evaluateFromPOV, extractRelevantInfo } from "./utils/processingData.ts";
import ButtonGroup from "@jetbrains/ring-ui-built/components/button-group/button-group";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import {
  author,
  ExtractedDataPoint,
  ChartDataPoint,
  FetchedDataPoint,
} from "./utils/types.d.ts";
import ButtonToolbar from "@jetbrains/ring-ui-built/components/button-toolbar/button-toolbar";
import TimePlot from "./components/TimePlot.tsx";
import ScrollableBarChart from "./components/ScrollableBarChart.tsx";
import { useResizeObserver } from "./hooks/useResizeObserver.ts";
import DatePicker from "@jetbrains/ring-ui-built/components/date-picker/date-picker.js";
import { mockData } from "./utils/mockData.ts";
import { timeAggregationOptions } from "./utils/constants.ts";
import HistogramPlot from "./components/HistogramPlot.tsx";
import { rollup, sum } from "d3";

const AppComponent = () => {
  const [plotEl, setPlotEl] = useState<HTMLDivElement | null>(null);
  const {
    width: containerWidth,
    height: containerHeight,
    isResizing,
  } = useResizeObserver(plotEl);
  const [host, setHost] = useState<EmbeddableWidgetAPI | "localhost">();
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);

  const [config, setConfig] = useState<WidgetConfiguration>();

  const register = async () => {
    console.info("trying to register")
    try {
      const newHost = await YTApp.register({
        onConfigure: () => setIsConfiguring(true),
      });

      if (!("readConfig" in newHost)) {
        console.error("no readconfig method in host! Check extension type")
        return;
      }
      setHost(newHost);
    } catch (e) {
      console.warn("Could not register with YouTrack host", e);
    }
  };

  const readConfig = async () => {
    const host = await YTApp.register()
    if (!("readConfig" in host)) {
      console.error("no readconfig method in host! Check extension type")
      return;
    }

    try {
      const loadedConfig = await host.readConfig<WidgetConfiguration>();
      console.info("loaded config", loadedConfig);
      if (loadedConfig) {
        // if config is sufficient
        setConfig(loadedConfig);
      } else {
        await host.enterConfigMode();
        setIsConfiguring(true);
      }
    } catch (e) {
      console.error("Could not read config from host", e);
    }
  };

  const doneConfiguring = async (newConfig?: WidgetConfiguration) => {
    try {
      if (newConfig) {
        await host.storeConfig(newConfig);
        setConfig(newConfig);
      }
      setIsConfiguring(false);
      await host.exitConfigMode();
    } catch (e) {
      console.error("Failed to store config / exit config mode", e);
      return;
    }
  };

  useEffect(() => {
    register()
        .then(() => readConfig());
  }, []);

  const [timeframe, setTimeframe] = useState<{ from: Date; to: Date }>({
    from: sub(new Date(), { months: 6 }),
    to: new Date(),
  });
  const [selectedTimeAggregationKey, setSelectedTimeAggregationKey] = useState<string>("week")

  const [extractedDataPoints, setExtractedDataPoints] = useState<
    ExtractedDataPoint[]
  >([]);
  const [authors, setAuthors] = useState<author[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [histogramChartData, setHistogramChartData] = useState([]);

  const loadData = async () => {
    const { from, to } = timeframe;
    const fetchData = async () => {
      if (host === "localhost") {
        return mockData(from, to, ["David", "Britta", "Cinna"], 200);
      }

      const newHost: HostAPI = await YTApp.register();
      // define which fields you need
      const query = encodeURIComponent(config?.query ?? "");
      const fields =
        "id,author(id,name,login),duration(minutes),date,text,issue(id,customFields(id,name,value(id,name)))";
      const startDate = from.toISOString().split("T")[0];
      const endDate = to.toISOString().split("T")[0];

      return await newHost.fetchYouTrack(
        `workItems?startDate=${startDate}&endDate=${endDate}&fields=${fields}&query=${query}`,
      );
    };

    const fetchedData: FetchedDataPoint[] = await fetchData();
    const authors = extractAllPeople(fetchedData);
    setAuthors(authors);

    if (authors.length) {
      setSelectedPerson(authors[0].id);
    }
    const extractedDataPoints: ExtractedDataPoint[] =
      extractRelevantInfo(fetchedData);
    setExtractedDataPoints(extractedDataPoints);
  };

  useEffect(() => {
    loadData();
  }, [timeframe, config?.query]);

  useEffect(() => {
    if (extractedDataPoints.length === 0) {
      return;
    }

    const groupingFunction = timeAggregationOptions.get(selectedTimeAggregationKey)!.dateAggregationFunction;
    const minutesByPersonAndTimeframe = rollup(extractedDataPoints,
      D => sum(D.map(d => d.minutes)),
      d => d.authorId,
      d => groupingFunction(d.date)
    )
    setHistogramChartData(minutesByPersonAndTimeframe)

    const povData = evaluateFromPOV(
        selectedPerson,
        extractedDataPoints,
        groupingFunction
    );
    setChartData([...povData]);
  }, [extractedDataPoints, selectedPerson, selectedTimeAggregationKey]);

  if (isConfiguring) {
    return (
      <Configuration
        onDone={doneConfiguring}
        currentConfiguration={config}
      />
    );
  }

  return (
    <>
      <section id="header" className="component">
        <ButtonToolbar>
          <ButtonGroup>
            {authors.map((author) => {
              return (
                <Button
                  key={author.id}
                  active={author.id === selectedPerson}
                  onClick={() => setSelectedPerson(author.id)}
                >
                  {author.name}
                </Button>
              );
            })}
          </ButtonGroup>

          <Button onClick={() => loadData()}>Refresh Data</Button>

          <ButtonGroup>
            {Array.from(timeAggregationOptions.keys()).map((key) => {
              return (
                <Button
                  key={key}
                  value={key}
                  onClick={() => setSelectedTimeAggregationKey(key)}
                  active={key === selectedTimeAggregationKey}
                >
                  {key}
                </Button>
              )
            })}
          </ButtonGroup>

          <Button onClick={() => setIsConfiguring(!isConfiguring)}>
            Toggle Config
          </Button>

          <DatePicker
            clear
            from={timeframe.from}
            maxDate={new Date().toDateString()}
            onChange={(event) => setTimeframe(event)}
            range
            to={timeframe.to}
          />
        </ButtonToolbar>
      </section>
      <section id="graph" className="component" ref={setPlotEl}>
        {(
          <TimePlot
            data={chartData}
            timeframe={timeframe}
            timeAggregation={timeAggregationOptions.get(selectedTimeAggregationKey)}
            isResizing={isResizing}
            width={containerWidth}
            height={containerHeight}
          />
        )}
      </section>
    </>
  );
};

export const App = memo(AppComponent);
