import '@jetbrains/ring-ui-built/components/style.css';
import type {AlertType} from '@jetbrains/ring-ui-built/components/alert/alert';

/* eslint-disable no-console */
const host = await YTApp.register();

async function main() {
  try {
    const scopedResponse = await host.fetchApp('backend/demo', {scope: true});
    const globalResponse = await host.fetchApp('backend-global/demo', {});
    const postResponse = await host.fetchApp('backend-global/demo', {method: 'POST', query: {test: 123}, body: {testBody: 'test'}});


    console.log('[YT Demo App] pluginResponse', scopedResponse);
    console.log('[YT Demo App] globalResponse', globalResponse);
    console.log('[YT Demo App] postResponse', postResponse);

    const root = document.getElementById('root');

    root!.innerHTML = '<h1>Demo App is loaded</h1>';
  } catch (e) {
    host.alert('YTApp: could not request custom HTTP endpoint', 'error' as AlertType.ERROR);
  }
}

main();
