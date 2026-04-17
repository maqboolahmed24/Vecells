import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const policy = JSON.parse(
  fs.readFileSync(
    path.join(root, "tools", "git-hooks", "engineering-standards-policy.json"),
    "utf8",
  ),
);

function currentBranch() {
  return execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim();
}

function branchFromArgs() {
  const explicit = process.argv[2];
  if (explicit && explicit !== "--current") {
    return explicit.trim();
  }
  return currentBranch();
}

const branch = branchFromArgs();
if (!branch) {
  console.error("[branch-check] detached HEAD is not allowed for contributor work");
  process.exit(1);
}

const allowed = policy.branch_policy.allowed_patterns.some((pattern) =>
  new RegExp(pattern).test(branch),
);
if (!allowed) {
  console.error(`[branch-check] branch '${branch}' does not match the Vecells policy`);
  console.error(`[branch-check] allowed examples: ${policy.branch_policy.examples.join(", ")}`);
  process.exit(1);
}

console.log(`[branch-check] branch '${branch}' passed`);
