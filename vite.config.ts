import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
        vote: resolve(__dirname, 'src/vote.html'),
        section: resolve(__dirname, 'src/section.html'),
        report: resolve(__dirname, 'src/report.html'),
        settings: resolve(__dirname, 'src/settings.html')
      }
    }
  }
});
