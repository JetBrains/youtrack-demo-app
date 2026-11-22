import '@jetbrains/ring-ui-built/components/style.css';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '../widgets/time-plot/app.tsx';
import {ControlsHeight, ControlsHeightContext} from '@jetbrains/ring-ui-built/components/global/controls-height';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <App/>
    </ControlsHeightContext.Provider>
  </StrictMode>
);