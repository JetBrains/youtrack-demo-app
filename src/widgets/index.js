const host = await YTApp.register();

async function main() {
  try {
  const pluginResponse = await host.fetchApp('backend/demo', {scope: true});
  const globalResponse = await host.fetchApp('backend/demo', {});
  const postResponse = await host.fetchApp('backend/demo', {method: 'POST'});


  console.log('[YT Demo App] pluginResponse', pluginResponse);
  console.log('[YT Demo App] globalResponse', globalResponse);
  console.log('[YT Demo App] postResponse', postResponse);

  const root = document.getElementById('root')

  root.innerHTML = `<span>Demo App is loaded</span>`;
  } catch (e) {
    host.alert('YTApp: could not request custom HTTP endpoint', 'error');
  }
}

main();

