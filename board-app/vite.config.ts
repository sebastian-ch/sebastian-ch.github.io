import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds into the Jekyll site with stable entry name so garden.html can reference it directly.
// The editor is a lazy chunk loaded only on #edit; `base` lets Vite resolve its chunk/CSS URLs.
export default defineConfig({
  plugins: [react()],
  base: '/assets/board/',
  build: {
    outDir: '../assets/board',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'board.js',
        chunkFileNames: 'board-[name].js',
        assetFileNames: 'board-[name][extname]',
      },
    },
  },
});
