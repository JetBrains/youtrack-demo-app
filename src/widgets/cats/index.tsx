import '@jetbrains/ring-ui-built/components/style.css';

async function run() {
  /* eslint-disable no-console */
  const host = await YTApp.register();
  console.log('init cat widget', host);

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  const img = document.createElement('img');
  img.src = `https://cataas.com/cat?width=${viewportWidth}`;
  img.width = viewportWidth;
  img.height = viewportHeight;
  img.setAttribute('style', 'object-fit: cover;');

  document.getElementById('root')!.appendChild(img);

  img.addEventListener('click', () => {
    host.collapse();
  });
}

run();

