import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./tests/setup.ts", "./tests/component/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    testTimeout: 60000,
    hookTimeout: 60000,
    // All integration tests share one remote Neon DB — running test files in
    // parallel causes real connection-pool contention and Serializable-transaction
    // retries under load. Sequential files keep the suite reliable over speed.
    fileParallelism: false,
  },
});
