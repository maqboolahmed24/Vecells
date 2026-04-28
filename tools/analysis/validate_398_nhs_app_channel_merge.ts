import fs from "node:fs";
import path from "node:path";

import {
  NHS_APP_CHANNEL_AUDIT_PREFIX,
  NHS_APP_CHANNEL_CASES,
  NHS_APP_CHANNEL_RELEASE_PREFIX,
  NHS_APP_CHANNEL_SUPPORT_CASE_PREFIX,
  NHS_APP_CHANNEL_SUPPORT_PREFIX,
  NHS_APP_CHANNEL_WORKBENCH_VISUAL_MODE,
  buildNHSAppWorkbenchUrl,
  parseNHSAppWorkbenchUrl,
} from "../../apps/ops-console/src/nhs-app-channel-workbench.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "apps/ops-console/src/nhs-app-channel-workbench.model.ts",
  "apps/ops-console/src/nhs-app-channel-workbench.tsx",
  "apps/ops-console/src/nhs-app-channel-workbench.css",
  "apps/ops-console/src/App.tsx",
  "docs/architecture/398_nhs_app_channel_support_ops_merge_map.md",
  "docs/frontend/398_nhs_app_channel_support_ops_atlas.html",
  "docs/frontend/398_nhs_app_channel_merge_tokens.json",
  "docs/accessibility/398_nhs_app_support_ops_a11y_notes.md",
  "data/contracts/398_nhs_app_support_ops_surface_contract.json",
  "data/analysis/398_algorithm_alignment_notes.md",
  "data/analysis/398_visual_reference_notes.json",
  "data/analysis/398_channel_observability_matrix.csv",
  "tools/analysis/validate_398_nhs_app_channel_merge.ts",
  "tests/playwright/398_support_channel_traceability.spec.ts",
  "tests/playwright/398_ops_governance_and_freeze_inspection.spec.ts",
  "tests/playwright/398_audit_and_patient_state_preview.spec.ts",
  "tests/playwright/398_channel_merge_accessibility_and_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:398-nhs-app-channel-merge"] ===
    "pnpm exec tsx ./tools/analysis/validate_398_nhs_app_channel_merge.ts",
  "package.json missing validate:398-nhs-app-channel-merge script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_397_/m.test(checklist), "par_397 must be complete before par_398.");
invariant(
  /^- \[(?:-|X)\] par_398_/m.test(checklist),
  "par_398 must be claimed or complete while validator runs.",
);

const appSource = readText("apps/ops-console/src/App.tsx");
for (const routePrefix of [
  NHS_APP_CHANNEL_SUPPORT_PREFIX,
  NHS_APP_CHANNEL_SUPPORT_CASE_PREFIX,
  NHS_APP_CHANNEL_RELEASE_PREFIX,
  NHS_APP_CHANNEL_AUDIT_PREFIX,
]) {
  requireIncludes(appSource, routePrefix, "ops-console route wiring");
}
requireIncludes(appSource, "NHSAppChannelControlWorkbench", "ops-console route wiring");

const workbenchSource = readText("apps/ops-console/src/nhs-app-channel-workbench.tsx");
for (const componentName of [
  "NHSAppChannelContextRibbon",
  "NHSAppJumpOffRouteChip",
  "EmbeddedSSOOutcomePill",
  "WhatPatientSawPanel",
  "NHSAppChannelEventTimeline",
  "NHSAppRouteFreezeInspector",
  "NHSAppArtifactPostureCard",
  "NHSAppAuditDeepLinkStrip",
  "NHSAppSupportRecoveryActionBar",
  "NHSAppChannelStatePreviewCard",
]) {
  requireIncludes(
    workbenchSource,
    `export function ${componentName}`,
    "398 workbench component export",
  );
  requireIncludes(
    workbenchSource,
    `data-testid="${componentName}"`,
    `${componentName} automation hook`,
  );
}
for (const hook of [
  "NHSAppChannelControlWorkbench",
  "data-selected-case",
  "data-selected-channel",
  "data-selected-route-family",
  "data-sso-outcome",
  "data-freeze-posture",
  "data-patient-visible-recovery-summary",
  "ChannelCaseRow-",
  "ChannelTimelineEvent-",
  "ChannelWorkbenchTab-",
]) {
  requireIncludes(workbenchSource, hook, "398 stable automation hooks");
}

const cssSource = readText("apps/ops-console/src/nhs-app-channel-workbench.css");
for (const cssNeedle of [
  "#F6F8FB".toLowerCase(),
  "#FFFFFF".toLowerCase(),
  "#EEF2F6".toLowerCase(),
  "#D6DEE8".toLowerCase(),
  "#2457FF".toLowerCase(),
  "@media (max-width: 1280px)",
  "@media (max-width: 1024px)",
  "@media (prefers-reduced-motion: reduce)",
]) {
  requireIncludes(cssSource.toLowerCase(), cssNeedle.toLowerCase(), "398 CSS");
}

const contract = readJson<{
  visualMode?: string;
  routePrefixes?: string[];
  urlState?: string[];
  components?: string[];
  stableAutomationHooks?: JsonRecord;
  channelTruthGrammar?: JsonRecord;
}>("data/contracts/398_nhs_app_support_ops_surface_contract.json");
invariant(
  contract.visualMode === NHS_APP_CHANNEL_WORKBENCH_VISUAL_MODE,
  "Contract visual mode mismatch.",
);
for (const routePrefix of [
  NHS_APP_CHANNEL_SUPPORT_PREFIX,
  NHS_APP_CHANNEL_SUPPORT_CASE_PREFIX,
  NHS_APP_CHANNEL_RELEASE_PREFIX,
  NHS_APP_CHANNEL_AUDIT_PREFIX,
]) {
  invariant(
    contract.routePrefixes?.includes(routePrefix),
    `Contract missing route prefix ${routePrefix}.`,
  );
}
for (const key of ["case", "tab", "event", "channel", "route", "sso", "freeze", "dock"]) {
  invariant(contract.urlState?.includes(key), `Contract missing URL state ${key}.`);
}
invariant((contract.components?.length ?? 0) >= 10, "Contract must list all required components.");
invariant(Boolean(contract.stableAutomationHooks?.root), "Contract missing stable hooks.");
invariant(Boolean(contract.channelTruthGrammar?.ssoOutcomes), "Contract missing channel grammar.");

const visualRefs = readText("data/analysis/398_visual_reference_notes.json");
for (const url of [
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
  "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  "https://service-manual.nhs.uk/accessibility",
  "https://playwright.dev/docs/browser-contexts",
  "https://playwright.dev/docs/accessibility-testing",
  "https://playwright.dev/docs/trace-viewer",
  "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
  "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
  "https://linear.app/method/introduction",
  "https://vercel.com/design/guidelines",
  "https://carbondesignsystem.com/components/data-table/usage/",
]) {
  requireIncludes(visualRefs, url, "398 visual reference notes");
}

const matrixRows = readCsv("data/analysis/398_channel_observability_matrix.csv");
invariant(matrixRows.length >= 3, "Observability matrix must include 3 cases.");
for (const requiredCase of NHS_APP_CHANNEL_CASES) {
  invariant(
    matrixRows.some((row) => row.case_id === requiredCase.caseId),
    `Observability matrix missing ${requiredCase.caseId}.`,
  );
}

invariant(NHS_APP_CHANNEL_CASES.length >= 3, "398 model must include at least 3 channel cases.");
invariant(
  NHS_APP_CHANNEL_CASES.some((entry) => entry.channelType === "embedded_nhs_app"),
  "398 model must include embedded NHS App case.",
);
invariant(
  NHS_APP_CHANNEL_CASES.some((entry) => entry.channelType === "standalone_web"),
  "398 model must include standalone web case.",
);
invariant(
  NHS_APP_CHANNEL_CASES.some((entry) => entry.ssoOutcome === "consent_denied"),
  "398 model must include consent denied.",
);
invariant(
  NHS_APP_CHANNEL_CASES.some((entry) => entry.ssoOutcome === "safe_reentry_required"),
  "398 model must include safe re-entry.",
);
invariant(
  NHS_APP_CHANNEL_CASES.some((entry) => entry.freezePosture === "redirect_to_safe_route"),
  "398 model must include redirect-to-safe-route freeze.",
);
invariant(
  NHS_APP_CHANNEL_CASES.some((entry) => entry.artifactPosture === "download_blocked"),
  "398 model must include blocked artifact posture.",
);

const replayState = parseNHSAppWorkbenchUrl(
  "/ops/audit/channel/nhs-app/evt-398-consent-denied",
  "?tab=audit&dock=false",
);
const replayUrl = buildNHSAppWorkbenchUrl(replayState);
for (const needle of [
  "/ops/audit/channel/nhs-app/evt-398-consent-denied",
  "case=SUP-398-003",
  "tab=audit",
  "sso=consent_denied",
  "freeze=read_only",
  "dock=false",
]) {
  requireIncludes(replayUrl, needle, "398 URL replay");
}

for (const specPath of [
  "tests/playwright/398_support_channel_traceability.spec.ts",
  "tests/playwright/398_ops_governance_and_freeze_inspection.spec.ts",
  "tests/playwright/398_audit_and_patient_state_preview.spec.ts",
  "tests/playwright/398_channel_merge_accessibility_and_visual.spec.ts",
]) {
  const source = readText(specPath);
  requireIncludes(source, "importPlaywright", specPath);
  requireIncludes(source, "startOpsConsole", specPath);
  requireIncludes(source, "NHSAppChannelControlWorkbench", specPath);
  requireIncludes(source, "--run", specPath);
}

console.log("validate_398_nhs_app_channel_merge: ok");

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): Record<string, string>[] {
  const [headerLine, ...lines] = readText(relativePath).trim().split(/\r?\n/u);
  invariant(headerLine, `${relativePath} missing header.`);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}
