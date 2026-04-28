import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const tsconfig = JSON.parse(
  fs.readFileSync(path.join(ROOT, "tsconfig.base.json"), "utf8"),
) as {
  compilerOptions?: {
    paths?: Record<string, string[]>;
  };
};

const alias = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions?.paths ?? {}).flatMap(([specifier, targets]) => {
    const target = targets[0];
    if (!target) {
      return [];
    }
    return [[specifier, path.join(ROOT, target)]];
  }),
);

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
