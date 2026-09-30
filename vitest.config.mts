import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      // Tests run against an in-memory Postgres (PGlite) instead of DATABASE_URL.
      { find: /^@\/lib\/db$/, replacement: path.resolve(__dirname, "tests/support/test-db.ts") },
      { find: /^@\//, replacement: `${path.resolve(__dirname)}/` },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "pglite://memory",
      BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-better-auth",
      BETTER_AUTH_URL: "http://localhost:3000",
      PAYSTACK_SECRET_KEY: "sk_test_vitest",
      NEXT_RUNTIME: "nodejs",
    },
    // One database per test file; files run in separate workers.
    fileParallelism: true,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
