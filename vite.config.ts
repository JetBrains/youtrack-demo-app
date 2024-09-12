import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react';

/*
      See https://vitejs.dev/config/
*/

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: '../manifest.json',
          dest: '.'
        },
        {
          src: '*.*',
          dest: '.'
        },
        {
          src: '../public/*.*',
          dest: '.'
        }
      ]
    }),
    viteStaticCopy({
      targets: [
        // Widget icons and configurations
        {
          src: 'widgets/**/*.{svg,png,jpg,json}',
          dest: '.'
        }
      ],
      structured: true
    })
  ],
  root: './src',
  base: '',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: false,
    target: ['es2022'],
    assetsDir: 'widgets/assets',
    rollupOptions: {
      input: {
        // List every widget entry point here
        fullPage: resolve(__dirname, 'src/widgets/full-page/index.html'),
        markdown: resolve(__dirname, 'src/widgets/markdown/index.html'),
        userCard: resolve(__dirname, 'src/widgets/user-card/index.html'),
        quotes: resolve(__dirname, 'src/widgets/quotes/index.html'),
        lorem: resolve(__dirname, 'src/widgets/lorem/index.html'),
        cats: resolve(__dirname, 'src/widgets/cats/index.html')
      }
    }
  }
});
