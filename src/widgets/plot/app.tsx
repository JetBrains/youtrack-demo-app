import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    timeDay,
    timeMonday,
    timeMonth
} from "d3-time"
import type {EmbeddableWidgetAPI, HostAPI} from "../../../@types/globals";
import {Configuration} from './components/Configuration.tsx';
import type {WidgetConfiguration} from './utils/types.d.ts';
import "@jetbrains/ring-ui-built/components/style.css";
import "./app.css"
import {sub} from "date-fns"
import {ControlsHeight, ControlsHeightContext} from '@jetbrains/ring-ui-built/components/global/controls-height';
import {extractAllPeople} from "./utils/dataService.ts";
import {
    evaluateFromPOV,
    extractRelevantInfo,
    getCategorySummary
} from "./utils/processingData.ts";
import ButtonGroup from "@jetbrains/ring-ui-built/components/button-group/button-group";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import {author, ExtractedDataPoint, ChartDataPoint, FetchedDataPoint } from "./utils/types.d.ts";
import ButtonToolbar from "@jetbrains/ring-ui-built/components/button-toolbar/button-toolbar";
import TimePlot from './components/TimePlot.tsx';
import CategoryFilterTable from './components/CategoryFilterTable.tsx';
import { useResizeObserver } from './hooks/useResizeObserver.ts';
import DatePicker from '@jetbrains/ring-ui-built/components/date-picker/date-picker.js';
import DummyComponent from './components/DummyComponent.tsx';
import { mockData } from './utils/mockData.ts';
import ResizeScreen from './components/ResizeScreen.tsx';

const AppComponent = () => {
    const [plotEl, setPlotEl] = useState<HTMLDivElement|null>(null);
    const [devMode, setDevMode] = useState<boolean>(true);
    const { width: containerWidth, height: containerHeight, isResizing } = useResizeObserver(plotEl);
    const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
    const [config, setConfig] = useState<WidgetConfiguration>({ name: "" });
    const [host, setHost] = useState<EmbeddableWidgetAPI|"localhost">("localhost");

    useEffect(() => {
        const register = async () => {
            if (devMode) {
                setHost("localhost");
                return;
            }

            try {
                const newHost = await YTApp.register({onConfigure: () => setIsConfiguring(true)});
                if (!('readConfig' in newHost)) {
                    return;
                }
                setHost(newHost);
                const stored = await newHost.readConfig<WidgetConfiguration>();
                if (stored?.name) {
                    setConfig(stored);
                } else {
                    await newHost.enterConfigMode();
                    setIsConfiguring(true);
                }
            } catch (e) {
                console.warn('Could not register with YouTrack host', e);
            }
        };
        register();
    }, []);

    const doneConfiguring = (newConfig?: WidgetConfiguration) => {
        console.log(newConfig)
        if (newConfig) {
            setConfig(newConfig);
            if (host !== "localhost")
                host?.storeConfig(newConfig);
        }
        setIsConfiguring(false);
        if (host !== "localhost")
            host?.exitConfigMode();
    };

    useEffect(() => console.log("config changed", config), [config])

    const [timeframe, setTimeframe] = useState<{ from: Date, to: Date }>({ 
        from: sub(new Date(), { months: 6 }),
        to: new Date()
    })

    const [extractedDataPoints, setExtractedDataPoints] = useState<ExtractedDataPoint[]>([]);
    const [authors, setAuthors] = useState<author[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<string>("");
    
    const [ChartData, setChartData] = useState<ChartDataPoint[]>([])

    const startConfiguring = async () => {
        if (host === "localhost") {
            setIsConfiguring(true);
            return;
        }

        setIsConfiguring(true);
        const currentConfig = await host.readConfig<WidgetConfiguration>()
        if (currentConfig) {
            setConfig(currentConfig);
            host.storeConfig(currentConfig);
        }
    }
    const loadData = async () => {
        const { from, to } = timeframe;
        const fetchData = async () => {
          if (host === "localhost") {
            return mockData(from, to, ["Alice", "Bob", "Charlie"], 200);
          }
          
          const newHost: HostAPI = await YTApp.register();
          // define which fields you need
          const query = "Subtask of: TODO-380"
          const fields = "id,author(id,name,login),duration(minutes),date,text,issue(id,customFields(id,name,value(id,name)))"
          const startDate = from.toISOString().split("T")[0];
          const endDate = to.toISOString().split("T")[0];
          
          return await newHost.fetchYouTrack(`workItems?startDate=${startDate}&endDate=${endDate}&fields=${fields}&query=${query}`);
        }
        
        const fetchedData = await fetchData();
        const authors = extractAllPeople(fetchedData);
        setAuthors(authors);

        if (authors.length) {
            setSelectedPerson(authors[0].id)
        }
        const extractedDataPoints: ExtractedDataPoint[] = extractRelevantInfo(fetchedData);
        setExtractedDataPoints(extractedDataPoints);
    }

    useEffect(() => {
        loadData()
    }, [timeframe]);

    useEffect(() => {
        if (extractedDataPoints.length === 0) {
            return
        };
        const { from, to } = timeframe;
        const groupingFunction = (d: ExtractedDataPoint) => timeDay(d.date)
        const povData = evaluateFromPOV(selectedPerson, extractedDataPoints, from, to, groupingFunction);
        setChartData([...povData]);
    }, [extractedDataPoints, selectedPerson]);

    if (isConfiguring) {

        return <Configuration
            onDone={doneConfiguring}
            initialName={config?.name}
        />;
    }

    return (
      <>
        <section
            id="header"
            className="component"
        >
          <ButtonToolbar>
            <ButtonGroup>
              {authors.map(author => {
                            return (
                              <Button
                                key={author.id}
                                active={author.id === selectedPerson}
                                onClick={() => setSelectedPerson(author.id)}
                              >
                                {author.name}
                              </Button>
                            )
                        })}
            </ButtonGroup>
            
            <Button
                onClick={() => loadData()}
            >
                Refresh Data
            </Button>

            <Button
                onClick={() => setIsConfiguring(!isConfiguring)}
            >
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
        <section
            id="graph"
            className="component"
            ref={setPlotEl}
        >
            {isResizing && <ResizeScreen message="lol" />}
            {isResizing === false && <DummyComponent
                data={ChartData}
                config={config}
                width={containerWidth}
                height={containerHeight}
            />}
        </section>
      </>
    )
};


export const App = memo(AppComponent);
