import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Multi-page static app: the classic Phaser game and the Ranger 3D laboratory.
// Keep the base relative so both pages work under GitHub Pages /learn-english/.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        house3d: resolve(process.cwd(), 'house-3d/index.html')
      }
    }
  }
});
