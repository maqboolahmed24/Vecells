import fs from "node:fs";
import path from "node:path";
import { parseArgs, readJson } from "./shared.ts";

const args = parseArgs(process.argv);
const inputDir = args["--input-dir"];

if (!inputDir) {
  throw new Error("Missing required --input-dir.");
}

const resolvedInputDir = path.resolve(inputDir);

const requiredFiles = [
  "scenario-definition.json",
  "scenario-context.json",
  "wave-guardrail-snapshot.json",
  "wave-action-impact-preview.json",
  "wave-action-record.json",
  "wave-action-execution-receipt.json",
  "wave-action-observation-window.json",
  "wave-action-settlement.json",
  "release-watch-evidence-cockpit.json",
  "wave-action-audit-trail.json",
  "rehearsal-history.json",
  "rehearsal-summary.json",
];

for (const filename of requiredFiles) {
  const filePath = path.join(resolvedInputDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing canary rehearsal artifact: ${filePath}`);
  }
}

const summary = readJson<{
  impactPreviewRef: string;
  settlementRef: string;
  cockpitState: string;
  settlementState: string;
}>(path.join(resolvedInputDir, "rehearsal-summary.json"));
const preview = readJson<{ waveActionImpactPreviewId: string }>(
  path.join(resolvedInputDir, "wave-action-impact-preview.json"),
);
const settlement = readJson<{
  waveActionSettlementId: string;
  cockpitState: string;
  settlementState: string;
}>(
  path.join(resolvedInputDir, "wave-action-settlement.json"),
);
const cockpit = readJson<{
  activeWaveActionImpactPreviewRef: string;
  activeWaveActionSettlementRef: string;
  cockpitState: string;
}>(
  path.join(resolvedInputDir, "release-watch-evidence-cockpit.json"),
);

if (summary.impactPreviewRef !== preview.waveActionImpactPreviewId) {
  throw new Error("Canary rehearsal summary drifted from wave-action impact preview.");
}
if (summary.settlementRef !== settlement.waveActionSettlementId) {
  throw new Error("Canary rehearsal summary drifted from wave-action settlement.");
}
if (summary.cockpitState !== settlement.cockpitState) {
  throw new Error("Canary rehearsal summary lost cockpit-state linkage.");
}
if (summary.settlementState !== settlement.settlementState) {
  throw new Error("Canary rehearsal summary lost settlement-state linkage.");
}
if (cockpit.activeWaveActionImpactPreviewRef !== preview.waveActionImpactPreviewId) {
  throw new Error("Canary cockpit lost preview linkage.");
}
if (cockpit.activeWaveActionSettlementRef !== settlement.waveActionSettlementId) {
  throw new Error("Canary cockpit lost settlement linkage.");
}
if (cockpit.cockpitState !== settlement.cockpitState) {
  throw new Error("Canary cockpit lost cockpit-state linkage.");
}

console.log(
  `Verified canary rehearsal for ${resolvedInputDir} (${summary.cockpitState}).`,
);
