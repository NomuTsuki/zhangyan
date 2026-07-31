import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const hifiRoot = fileURLToPath(new URL("./hifi/", import.meta.url));
const buildOutput = fileURLToPath(new URL("./work/hifi/", import.meta.url));

export default defineConfig({
  root: hifiRoot,
  base: "./",
  publicDir: false,
  plugins: [react()],
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  build: {
    outDir: buildOutput,
    emptyOutDir: true,
    copyPublicDir: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    sourcemap: false,
    target: "es2020",
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
        codeSplitting: false,
      },
    },
  },
});
