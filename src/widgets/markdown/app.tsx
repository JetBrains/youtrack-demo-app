import React, {memo, useEffect} from 'react';
import type {EmbeddableWidgetAPI} from '../../../@types/globals';
import {Configuration} from './configuration';
import {WidgetConfiguration} from './types';


interface Props {}

const AppComponent: React.FunctionComponent<Props> = () => {
  const hostRef = React.useRef<EmbeddableWidgetAPI | null>(null);

  const [isConfiguring, setIsConfiguring] = React.useState(false);
  const [config, setConfig] = React.useState<WidgetConfiguration | null>(null);

  useEffect(() => {
    async function register() {
      // Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
      const host = await YTApp.register({
        onConfigure: () => setIsConfiguring(true)
      });

      if (!('readConfig' in host)) {
        throw new Error('Wrong type of API returned: probably widget used in wrong extension point');
      }

      hostRef.current = host;

      const configValue = await hostRef.current!.readConfig<WidgetConfiguration>();
      if (!configValue?.someValue) {
        hostRef.current.enterConfigMode();
        setIsConfiguring(true);
      } else {
        setConfig(configValue);
      }
    }

    register();
  }, []);

  const doneConfiguring = React.useCallback((newConfig?: WidgetConfiguration) => {
    setConfig(newConfig ?? null);
    setIsConfiguring(false);
    if (newConfig) {
      hostRef.current?.storeConfig(newConfig);
    }
    hostRef.current?.exitConfigMode();
  }, []);

  return (
    <div className="widget">
      {isConfiguring && hostRef.current
        ? (
          <Configuration onDone={doneConfiguring}/>
        )
        : (
          <section>
            {'Configuration = '}
            <span style={{fontWeight: 'bold'}}>{config?.someValue}</span>
          </section>
        )}

    </div>
  );
};

export const App = memo(AppComponent);
