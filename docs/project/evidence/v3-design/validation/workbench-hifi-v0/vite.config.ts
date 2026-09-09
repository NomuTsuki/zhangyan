import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: { fs: { allow: [fileURLToPath(new URL('../../../../../../', import.meta.url))] } },
  build: { target: 'es2022', assetsInlineLimit: 10000000, sourcemap: false, chunkSizeWarningLimit: 1600 },
});
