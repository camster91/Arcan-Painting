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
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    pool: "threads",
    poolOptions: {
      threads: { singleThread: true },
    },
  },
});
