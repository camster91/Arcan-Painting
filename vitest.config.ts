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
    poolOptions: {
      // CI runs in a constrained rootless container. A single fork preserves
      // per-file isolation without using the worker-thread shutdown path that
      // crashes there after otherwise-successful runs.
      forks: { singleFork: true, isolate: true },
    },
    fileParallelism: false,
  },
});
