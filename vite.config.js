import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  optimizeDeps: { entries: ['index.html', 'house-3d/index.html'] },
  server: { watch: { ignored: ['**/public/assets', '**/public/assets/**'] } },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        house3d: fileURLToPath(new URL('./house-3d/index.html', import.meta.url)),
      },
    },
  },
});
