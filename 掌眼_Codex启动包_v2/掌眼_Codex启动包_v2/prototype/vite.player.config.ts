import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const playerRoot = fileURLToPath(new URL("./player/", import.meta.url));
const buildOutput = fileURLToPath(new URL("./work/player/", import.meta.url));

export default defineConfig({
  root: playerRoot,
  base: "./",
  publicDir: false,
  plugins: [react()],
  server: { fs: { allow: [projectRoot] } },
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
        entryFileNames: "assets/player.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
        codeSplitting: false,
      },
    },
  },
});
