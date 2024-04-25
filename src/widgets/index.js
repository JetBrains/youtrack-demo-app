const host = await YTApp.register();

async function main() {
  try {
  const pluginResponse2 = await host.fetchApp('backend/demo', {scope: true});
  const pluginResponse = await host.fetchApp('backend/demo', {});

  const root = document.getElementById('root')

  root.innerHTML = `<span>Demo App is loaded</span>`;
  } catch (e) {
    host.alert('YTApp: could not request custom HTTP endpoint', 'error');
  }
}

main();

