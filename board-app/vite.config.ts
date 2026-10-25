import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds into the Jekyll site with stable filenames so garden.html can reference them directly
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../assets/board',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/main.tsx',
      output: {
        entryFileNames: 'board.js',
        chunkFileNames: 'board-[name].js',
        assetFileNames: 'board.[ext]',
      },
    },
  },
});
