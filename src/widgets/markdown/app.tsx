import React, {memo, useEffect} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import type {CustomWidgetAPILayer} from '../../../@types/globals';
import {Configuration} from './configuration';
import { WidgetConfiguration } from './types';


interface Props {}

const AppComponent: React.FunctionComponent<Props> = () => {
  const hostRef = React.useRef<CustomWidgetAPILayer | null>(null);

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

      const config = await hostRef.current!.readConfig<WidgetConfiguration>();
      if (!config?.someValue) {
        hostRef.current.enterConfigMode();
        setIsConfiguring(true);
      } else {
        setConfig(config);
      }
    }

    register();
  }, []);

  const doneConfiguring = React.useCallback((config?: WidgetConfiguration) => {
    setConfig(config ?? null);
    setIsConfiguring(false);
    if (config) {
      hostRef.current?.storeConfig(config);
    }
    hostRef.current?.exitConfigMode();
  }, []);

  return (
    <div className="widget">
      <ControlsHeightContext.Provider value={ControlsHeight.S}>
        {isConfiguring && hostRef.current ? (
          <Configuration onDone={doneConfiguring}/>
        ) : (
          <section>
          {'Configuration = '}
          <span style={{fontWeight: 'bold'}}>{config?.someValue}</span>
        </section>
        )}

      </ControlsHeightContext.Provider>
    </div>
  );
};

export const App = memo(AppComponent);
