import fs from "node:fs";
import path from "node:path";

import {
  EMBEDDED_RECOVERY_ARTIFACT_VISUAL_MODE,
  embeddedRecoveryArtifactPath,
  isEmbeddedRecoveryArtifactPath,
  resolveEmbeddedRecoveryArtifactContext,
} from "../../apps/patient-web/src/embedded-recovery-artifact.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson<T extends JsonRecord>(relativePath: string): T {
  return JSON.parse(readText(relativePath)) as T;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char ?? "";
  }
  cells.push(current);
  return cells;
}

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headerLine = lines[0];
  invariant(headerLine, `${relativePath} missing header`);
  const headers = parseCsvLine(headerLine);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}`);
}

const REQUIRED_FILES = [
  "apps/patient-web/src/embedded-recovery-artifact.model.ts",
  "apps/patient-web/src/embedded-recovery-artifact.tsx",
  "apps/patient-web/src/embedded-recovery-artifact.css",
  "docs/frontend/393_embedded_recovery_and_artifact_spec.md",
  "docs/frontend/393_embedded_recovery_and_artifact_atlas.html",
  "docs/frontend/393_embedded_recovery_and_artifact_topology.mmd",
  "docs/frontend/393_embedded_recovery_and_artifact_tokens.json",
  "docs/accessibility/393_embedded_recovery_and_artifact_a11y_notes.md",
  "data/contracts/393_embedded_recovery_and_artifact_contract.json",
  "data/analysis/393_algorithm_alignment_notes.md",
  "data/analysis/393_visual_reference_notes.json",
  "data/analysis/393_embedded_recovery_and_artifact_state_matrix.csv",
  "tools/analysis/validate_393_embedded_recovery_and_artifact_ui.ts",
  "tests/playwright/393_embedded_recovery.helpers.ts",
  "tests/playwright/393_embedded_recovery_link_and_freeze.spec.ts",
  "tests/playwright/393_embedded_recovery_artifact_and_fallback.spec.ts",
  "tests/playwright/393_embedded_recovery_accessibility.spec.ts",
  "tests/playwright/393_embedded_recovery_visual.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:393-embedded-recovery-and-artifact-ui"] ===
    "pnpm exec tsx ./tools/analysis/validate_393_embedded_recovery_and_artifact_ui.ts",
  "package.json missing validate:393-embedded-recovery-and-artifact-ui script",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_392_/m.test(checklist), "par_392 must be complete before par_393.");
invariant(/^- \[(?:-|X)\] par_393_/m.test(checklist), "par_393 must be claimed or complete.");

const appSource = readText("apps/patient-web/src/App.tsx");
requireIncludes(appSource, "EmbeddedRecoveryArtifactApp", "patient-web App route wiring");
requireIncludes(appSource, "isEmbeddedRecoveryArtifactPath(pathname)", "patient-web App route wiring");
const pharmacyRouteIndex = appSource.indexOf("isEmbeddedPharmacyPath(pathname)");
const recoveryRouteIndex = appSource.indexOf("isEmbeddedRecoveryArtifactPath(pathname)");
const shellRouteIndex = appSource.indexOf("isEmbeddedShellSplitPath(pathname, search)");
invariant(recoveryRouteIndex > pharmacyRouteIndex, "recovery route should follow embedded pharmacy route");
invariant(recoveryRouteIndex < shellRouteIndex, "recovery route must precede /nhs-app shell catch-all");

const componentSource = readText("apps/patient-web/src/embedded-recovery-artifact.tsx");
for (const componentName of [
  "EmbeddedLinkRecoveryBanner",
  "EmbeddedExpiredLinkView",
  "EmbeddedInvalidContextView",
  "EmbeddedUnsupportedActionView",
  "EmbeddedRouteFreezeNotice",
  "EmbeddedDegradedModePanel",
  "EmbeddedArtifactSummarySurface",
  "EmbeddedArtifactPreviewFrame",
  "EmbeddedDownloadProgressCard",
  "EmbeddedArtifactFallbackPanel",
  "EmbeddedReturnSafeRecoveryFrame",
]) {
  invariant(
    componentSource.includes(`function ${componentName}`) ||
      componentSource.includes(`export function ${componentName}`),
    `component source missing ${componentName}`,
  );
}

for (const hook of [
  "EmbeddedRecoveryArtifactFrame",
  "EmbeddedRecoveryActionCluster",
  "data-visual-mode",
  "data-route-key",
  "data-actionability",
  "data-artifact-mode",
  "data-route-freeze-state",
  "data-degraded-mode-state",
  "aria-live=\"polite\"",
  "role=\"progressbar\"",
]) {
  requireIncludes(componentSource, hook, "automation and accessibility hooks");
}

const modelSource = readText("apps/patient-web/src/embedded-recovery-artifact.model.ts");
for (const canonical of [
  "ExternalEntryResolution",
  "SiteLinkManifest",
  "BridgeCapabilityMatrix",
  "ArtifactPresentationContract",
  "ArtifactModeTruthProjection",
  "PatientDegradedModeProjection",
  "RouteFreezeDisposition",
  "EmbeddedRecoveryTruth",
  "EmbeddedArtifactTruth",
]) {
  requireIncludes(modelSource, canonical, "canonical projection binding");
}

const cssSource = readText("apps/patient-web/src/embedded-recovery-artifact.css").toLowerCase();
for (const token of [
  "#f6f8fb",
  "#ffffff",
  "#f3f7fb",
  "#d9e2ec",
  "#0f172a",
  "#334155",
  "#64748b",
  "#2457ff",
  "#a16207",
  "#b42318",
  "#475467",
  "40rem",
  "20px",
  "12px",
  "76px",
  "env(safe-area-inset-bottom",
  "prefers-reduced-motion",
]) {
  requireIncludes(cssSource, token, "embedded recovery CSS tokens");
}

invariant(
  EMBEDDED_RECOVERY_ARTIFACT_VISUAL_MODE === "NHSApp_Embedded_Recovery_And_Artifacts",
  "visual mode drift",
);
invariant(
  isEmbeddedRecoveryArtifactPath("/nhs-app/recovery/REC-393/expired-link"),
  "expired link path not recognized",
);
invariant(
  isEmbeddedRecoveryArtifactPath("/embedded-recovery/REC-393/invalid-context"),
  "fallback recovery path not recognized",
);
invariant(
  isEmbeddedRecoveryArtifactPath("/nhs-app/artifacts/ART-393/artifact-preview"),
  "artifact path not recognized",
);
invariant(
  !isEmbeddedRecoveryArtifactPath("/nhs-app/pharmacy/PHC-2048/choice"),
  "pharmacy route should not be recovery",
);

const builtPath = embeddedRecoveryArtifactPath({
  journeyRef: "ART-393",
  routeKey: "artifact_preview",
  fixture: "artifact-preview",
});
invariant(
  builtPath.includes("/nhs-app/recovery/ART-393/artifact-preview"),
  "embedded recovery path builder drift",
);

const expired = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/REC-393/expired-link",
  search: "?fixture=expired-link",
});
invariant(expired.visualMode === "NHSApp_Embedded_Recovery_And_Artifacts", "expired visual mode drift");
invariant(expired.recoveryTruth.actionability === "recovery_required", "expired link should require recovery");
invariant(expired.recoveryTruth.supportCode === "P7-LINK-EXPIRED", "expired link support code missing");

const invalid = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/REC-393/invalid-context",
  search: "?fixture=invalid-context",
});
invariant(invalid.preservedContext.summarySafetyState === "placeholder_only", "invalid context should be placeholder only");
invariant(invalid.recoveryTruth.shellDisposition === "same_shell_recovery", "invalid context shell recovery missing");

const lost = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/REC-393/lost-session",
  search: "?fixture=lost-session",
});
invariant(lost.recoveryTruth.primaryActionLabel === "Confirm NHS login", "lost session action drift");

const unsupported = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/REC-393/unsupported-action",
  search: "?fixture=unsupported-action",
});
invariant(unsupported.recoveryTruth.actionability === "handoff_gated", "unsupported action should be handoff gated");
invariant(unsupported.recoveryTruth.degradedModeState === "summary_only", "unsupported action degraded state missing");

const channel = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/REC-393/channel-unavailable",
  search: "?fixture=channel-unavailable",
});
invariant(channel.recoveryTruth.actionability === "blocked", "channel unavailable should be blocked");
invariant(channel.actionCluster.primaryEnabled === false, "blocked channel primary action should be disabled");

const freeze = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/FRZ-393/route-freeze",
  search: "?fixture=route-freeze",
});
invariant(freeze.recoveryTruth.routeFreezeState === "frozen", "route freeze state missing");
invariant(freeze.recoveryTruth.actionability === "read_only", "route freeze should be read only");

const degraded = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/DGD-393/degraded-mode",
  search: "?fixture=degraded-mode",
});
invariant(degraded.recoveryTruth.degradedModeState === "summary_only", "degraded mode state missing");
invariant(degraded.continuityEvidence.bridgeCapabilityState === "stale", "degraded bridge state missing");

const summary = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/ART-393/artifact-summary",
  search: "?fixture=artifact-summary",
});
invariant(summary.artifactTruth.modeTruth === "structured_summary", "artifact summary truth missing");
invariant(summary.artifactTruth.rows.length >= 4, "artifact summary rows missing");

const preview = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/ART-393/artifact-preview",
  search: "?fixture=artifact-preview",
});
invariant(preview.artifactTruth.previewState === "available", "artifact preview state missing");
invariant(preview.artifactTruth.byteGrantState === "issued", "preview byte grant should be issued");

const progress = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/ART-393/download-progress",
  search: "?fixture=download-progress",
});
invariant(progress.artifactTruth.transferState === "in_progress", "download progress transfer missing");

const fallback = resolveEmbeddedRecoveryArtifactContext({
  pathname: "/nhs-app/recovery/ART-393/artifact-fallback",
  search: "?fixture=artifact-fallback",
});
invariant(fallback.artifactTruth.fallbackState === "secure_send_later", "artifact fallback state missing");
invariant(fallback.artifactTruth.secureSendLaterAllowed, "secure send later should be allowed");

const contract = readJson<{ visualMode?: string; canonicalBindings?: Record<string, unknown>; components?: unknown[] }>(
  "data/contracts/393_embedded_recovery_and_artifact_contract.json",
);
invariant(contract.visualMode === "NHSApp_Embedded_Recovery_And_Artifacts", "contract visual mode drift");
invariant(contract.canonicalBindings?.artifact === "ArtifactPresentationContract", "contract artifact binding drift");
invariant(contract.canonicalBindings?.routeFreeze === "RouteFreezeDisposition", "contract route freeze binding drift");
invariant(Array.isArray(contract.components) && contract.components.length >= 11, "contract missing components");

const tokens = readJson<{ layout?: Record<string, unknown>; color?: Record<string, unknown> }>(
  "docs/frontend/393_embedded_recovery_and_artifact_tokens.json",
);
invariant(tokens.layout?.contentMaxWidth === "40rem", "token width drift");
invariant(tokens.layout?.cardPadding === "20px", "token card padding drift");
invariant(tokens.color?.accent === "#2457FF", "token accent drift");

const visualRefs = readJson<{ references?: Array<{ url?: string }> }>(
  "data/analysis/393_visual_reference_notes.json",
);
const visualUrls = (visualRefs.references ?? []).map((reference) => reference.url ?? "").join("\n");
for (const domain of [
  "nhsconnect.github.io",
  "nhs.uk",
  "service-manual.nhs.uk",
  "design-system.nhsapp.service.nhs.uk",
  "w3.org",
  "playwright.dev",
  "linear.app",
  "nextjs.org",
  "carbondesignsystem.com",
]) {
  requireIncludes(visualUrls, domain, "visual reference notes");
}

const stateRows = readCsv("data/analysis/393_embedded_recovery_and_artifact_state_matrix.csv");
for (const state of [
  "expired_link_recovery",
  "invalid_context_recovery",
  "lost_session_reauth",
  "unsupported_action_fallback",
  "channel_unavailable_blocked",
  "route_freeze_visible",
  "degraded_mode_summary_only",
  "artifact_summary_first",
  "artifact_preview_available",
  "download_progress_bridge",
  "artifact_fallback_send_later",
  "return_safe_summary",
]) {
  invariant(stateRows.some((row) => row.state === state), `state matrix missing ${state}`);
}

for (const relativePath of [
  "tests/playwright/393_embedded_recovery_link_and_freeze.spec.ts",
  "tests/playwright/393_embedded_recovery_artifact_and_fallback.spec.ts",
  "tests/playwright/393_embedded_recovery_accessibility.spec.ts",
  "tests/playwright/393_embedded_recovery_visual.spec.ts",
]) {
  const testSource = readText(relativePath);
  requireIncludes(testSource, "startPatientWeb", `${relativePath} Playwright server harness`);
  requireIncludes(testSource, "openEmbeddedRecovery", `${relativePath} route opener`);
}

console.log("validate_393_embedded_recovery_and_artifact_ui: ok");
