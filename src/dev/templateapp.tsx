/* eslint-disable no-console */
import React, { memo, useEffect, useState } from "react";

import type { EmbeddableWidgetAPI, HostAPI } from "../../@types/globals";
import { Configuration } from "./components/Configuration.tsx";
import "@jetbrains/ring-ui-built/components/style.css";
import "./app.css";
import { sub } from "date-fns";

import { extractAllPeople } from "../utils/dataService.ts";
import { evaluateFromPOV, extractRelevantInfo } from "../utils/processingData.ts";
import ButtonGroup from "@jetbrains/ring-ui-built/components/button-group/button-group";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import type {
  author,
  ExtractedDataPoint,
  ChartDataPoint,
  FetchedDataPoint,
} from "../utils/types.d.ts";
import ButtonToolbar from "@jetbrains/ring-ui-built/components/button-toolbar/button-toolbar";
import DummyComponent from "../components/DummyComponent.tsx";
import { useResizeObserver } from "../hooks/useResizeObserver.ts";
import DatePicker from "@jetbrains/ring-ui-built/components/date-picker/date-picker.js";
import { mockData } from "../utils/mockData.ts";
import { timeAggregationOptions } from "../utils/constants.ts";

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

  const isLocalhost = window.location.hostname === "localhost";

  const register = async () => {
    if (isLocalhost) {
      // running outside of YouTrack (vite dev server): no Host API available, use mock data
      console.info("running on localhost, skipping YouTrack registration");
      setHost("localhost");
      return;
    }
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
    if (isLocalhost) return;
    const registeredHost = await YTApp.register()
    if (!("readConfig" in registeredHost)) {
      console.error("no readconfig method in host! Check extension type")
      return;
    }

    try {
      const loadedConfig = await registeredHost.readConfig<WidgetConfiguration>();
      console.info("loaded config", loadedConfig);
      if (loadedConfig) {
        // if config is sufficient
        setConfig(loadedConfig);
        if ("setTitle" in registeredHost)
          await registeredHost.setTitle(loadedConfig.title);
      } else {
        await registeredHost.enterConfigMode();
        setIsConfiguring(true);
      }
    } catch (e) {
      console.error("Could not read config from host", e);
    }
  };

  const doneConfiguring = async (newConfig?: WidgetConfiguration) => {
    try {
      if (host === "localhost") {
        if (newConfig) setConfig(newConfig);
        setIsConfiguring(false);
        return;
      }
      if (newConfig) {
        await (host as EmbeddableWidgetAPI).storeConfig(newConfig);
        setConfig(newConfig);
      }
      setIsConfiguring(false);
      await (host as EmbeddableWidgetAPI).exitConfigMode();
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
    from: sub(new Date(), { months: 3 }),
    to: new Date(),
  });
  const [selectedTimeAggregationKey, setSelectedTimeAggregationKey] = useState<string>("week")

  const [extractedDataPoints, setExtractedDataPoints] = useState<
    ExtractedDataPoint[]
  >([]);
  const [authors, setAuthors] = useState<author[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const loadData = async () => {
    const { from, to } = timeframe;
    const fetchData = async () => {
      if (isLocalhost) {
        return mockData(from, to, ["David", "Britta", "Cinna"], 200);
      }

      const newHost: HostAPI = await YTApp.register();
      // define which fields you need
      const query = encodeURIComponent(config?.query ?? "");
      const fields =
        "id,author(id,name,login),duration(minutes),date,text,issue(id,customFields(id,name,value(id,name)))";
      const startDate = from.toISOString().split("T")[0];
      const endDate = to.toISOString().split("T")[0];

      return await newHost.fetchYouTrack<FetchedDataPoint[]>(
        `workItems?startDate=${startDate}&endDate=${endDate}&fields=${fields}&query=${query}`,
      );
    };

    const fetchedData: FetchedDataPoint[] = await fetchData();
    const allAuthors = extractAllPeople(fetchedData);
    setAuthors(allAuthors);

    if (allAuthors.length) {
      setSelectedPerson(allAuthors[0].id);
    }
    const newDataPoints: ExtractedDataPoint[] =
      extractRelevantInfo(fetchedData);
    setExtractedDataPoints(newDataPoints);
  };

  useEffect(() => {
    loadData();
  }, [timeframe, config?.query]);

  useEffect(() => {
    if (extractedDataPoints.length === 0) {
      return;
    }

    const groupingFunction = timeAggregationOptions.get(selectedTimeAggregationKey)!.dateAggregationFunction;

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
            {authors.map((person) => {
              return (
                <Button
                  key={person.id}
                  active={person.id === selectedPerson}
                  onClick={() => setSelectedPerson(person.id)}
                >
                  {person.name}
                </Button>
              );
            })}
          </ButtonGroup>

          {/*<Button onClick={() => loadData()}>Refresh Data</Button>*/}

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
            Configure
          </Button>

          <DatePicker
            clear
            from={timeframe.from}
            maxDate={new Date().toDateString()}
            onChange={({ from, to }: { from?: Date | null; to?: Date | null }) => {
              if (from && to) {
                setTimeframe({ from, to });
              }
            }}
            range
            to={timeframe.to}
          />
        </ButtonToolbar>
      </section>
      <section id="graph" className="component" ref={(el: HTMLElement | null) => setPlotEl(el as HTMLDivElement | null)}>
        {(
          <DummyComponent
            data={chartData}
            config={config}
            width={containerWidth}
            height={containerHeight}
          />
        )}
      </section>
    </>
  );
};

export const Templateapp = memo(AppComponent);
