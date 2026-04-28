import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { loadInternalEntrypointConfig } from "../src/config.js";

const originalCwd = process.cwd();
const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");

afterEach(() => {
  process.chdir(originalCwd);
});

describe("internal entrypoint config", () => {
  it("discovers the workspace root when started from the service package", () => {
    process.chdir(packageRoot);

    const config = loadInternalEntrypointConfig({});

    expect(config.repoRoot).toBe(workspaceRoot);
    expect(fs.existsSync(path.join(config.repoRoot, "pnpm-workspace.yaml"))).toBe(true);
  });

  it("honors an explicit repo root override", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-entrypoint-root-"));

    try {
      const config = loadInternalEntrypointConfig({ VECELLS_REPO_ROOT: repoRoot });

      expect(config.repoRoot).toBe(repoRoot);
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
