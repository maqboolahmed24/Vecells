import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const policy = JSON.parse(
  fs.readFileSync(
    path.join(root, "tools", "git-hooks", "engineering-standards-policy.json"),
    "utf8",
  ),
);

const allowedTypes = new Set([
  "arch",
  "scaffold",
  "feat",
  "fix",
  "test",
  "docs",
  "security",
  "release",
  "migration",
]);
const riskyTypes = new Set(["release", "migration"]);
const headerPattern = new RegExp(policy.commit_policy.header_pattern);

function readMessage() {
  const messagePath = process.argv[2];
  if (messagePath) {
    return fs.readFileSync(path.resolve(messagePath), "utf8");
  }
  return fs.readFileSync(0, "utf8");
}

function footerMap(message) {
  const map = new Map();
  for (const rawLine of message.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = line.match(/^([A-Za-z-]+):\s*(.+)$/);
    if (match) {
      map.set(match[1], match[2]);
    }
  }
  return map;
}

const message = readMessage();
const lines = message
  .split("\n")
  .map((line) => line.trimEnd())
  .filter((line) => line.trim() && !line.startsWith("#"));

if (lines.length === 0) {
  console.error("[commit-check] commit message is empty");
  process.exit(1);
}

const header = lines[0];
if (!headerPattern.test(header)) {
  console.error("[commit-check] header does not match the Vecells taxonomy");
  process.exit(1);
}

const typeMatch = header.match(/^(?<type>[a-z]+)/);
const commitType = typeMatch?.groups?.type ?? "";
if (!allowedTypes.has(commitType)) {
  console.error(`[commit-check] type '${commitType}' is not allowed`);
  process.exit(1);
}

const footers = footerMap(message);
for (const footer of policy.commit_policy.required_footers) {
  if (!footers.has(footer)) {
    console.error(`[commit-check] missing required footer: ${footer}`);
    process.exit(1);
  }
}

const taskFooter = footers.get("Task") ?? "";
if (!/(seq|par)_[0-9]{3}[a-z0-9_]*/.test(taskFooter)) {
  console.error("[commit-check] Task footer must include a seq_ or par_ identifier");
  process.exit(1);
}

const refsFooter = footers.get("Refs") ?? "";
if (!refsFooter.includes(".md")) {
  console.error("[commit-check] Refs footer must include one or more markdown refs");
  process.exit(1);
}

if (riskyTypes.has(commitType) || header.includes("!")) {
  for (const footer of policy.commit_policy.risky_footers) {
    if (!footers.has(footer)) {
      console.error(`[commit-check] missing risky-change footer: ${footer}`);
      process.exit(1);
    }
  }
}

console.log(`[commit-check] commit header '${header}' passed`);
