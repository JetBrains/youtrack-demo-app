import React from 'react';
import ReactDOM from 'react-dom/client';
import {ControlsHeight, ControlsHeightContext} from '@jetbrains/ring-ui-built/components/global/controls-height';
import '@jetbrains/ring-ui-built/components/style.css';
import {App} from './app';

// Register widget in YouTrack. To learn more, see https://www.jetbrains.com/help/youtrack/devportal-apps/apps-host-api.html
const host = await YTApp.register({
  onAppLocationChange: location => {
    const event = new CustomEvent('appLocationChange', {detail: location});
    window.dispatchEvent(event);
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <App host={host}/>
    </ControlsHeightContext.Provider>
  </React.StrictMode>
);
