import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const envExample = path.join(root, ".env.example");
const hooksPath = ".githooks";

function installHooks() {
  if (!fs.existsSync(path.join(root, ".git"))) {
    console.log("[dev-bootstrap] no .git directory found, skipping hook installation");
    return;
  }
  execFileSync("git", ["config", "core.hooksPath", hooksPath], { cwd: root, stdio: "ignore" });
  console.log(`[dev-bootstrap] installed git hooks via core.hooksPath=${hooksPath}`);
}

const text = fs.readFileSync(envExample, "utf8");
const expectedKeys = text
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"))
  .map((line) => line.split("=")[0]);

const missing = expectedKeys.filter((key) => !(key in process.env));
console.log("[dev-bootstrap] Vecells Phase 0 foundation scaffold");
console.log(`[dev-bootstrap] expected env keys: ${expectedKeys.length}`);
console.log(`[dev-bootstrap] missing from current shell: ${missing.length}`);
if (missing.length > 0) {
  console.log(
    "[dev-bootstrap] continuing with placeholder defaults because the repo still scaffolds local foundations.",
  );
}
installHooks();
console.log(
  "[dev-bootstrap] canonical validation loop: pnpm codegen && pnpm check && pnpm test:e2e",
);
