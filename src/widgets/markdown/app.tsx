import React, { memo, useEffect } from 'react';
import type { EmbeddableWidgetAPI } from '../../../@types/globals';
import { Configuration } from './configuration';
import { WidgetConfiguration } from './types';


const AppComponent: React.FC = () => {
  const [host, setHost] = React.useState<EmbeddableWidgetAPI | null>(null);

  const [isConfiguring, setIsConfiguring] = React.useState(false);
  const [config, setConfig] = React.useState<WidgetConfiguration | null>(null);

  useEffect(() => {
    async function register() {
      // Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
      const newHost = await YTApp.register({
        onConfigure: () => setIsConfiguring(true)
      });

      if (!('readConfig' in newHost)) {
        throw new Error('Wrong type of API returned: probably widget used in wrong extension point');
      }

      setHost(newHost);

      const configValue = await newHost.readConfig<WidgetConfiguration>();
      if (!configValue?.someValue) {
        newHost.enterConfigMode();
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
      host?.storeConfig(newConfig);
    }
    host?.exitConfigMode();
  }, [host]);

  return (
    <div className="widget">
      {isConfiguring && host
        ? (
          <Configuration onDone={doneConfiguring}/>
        )
        : (
          <section>
            {'Configuration = '}
            <span style={{ fontWeight: 'bold' }}>{config?.someValue}</span>
          </section>
        )}

    </div>
  );
};

export const App = memo(AppComponent);
