import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      lodash: "lodash-es",
      "npm:stripe": "stripe",
      stripe: path.resolve(__dirname, "./src/__create/stripe"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**", "build/**"],
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    pool: "forks",
    // Keep fork-based execution and per-file isolation within CI's worker limit.
    maxWorkers: 1,
    isolate: true,
    fileParallelism: false,
  },
});
