import fs from "node:fs";
import path from "node:path";

import {
  buildNavigationContract,
  BridgeActionLeaseManager,
  createFakeNhsAppApi,
  createLiveEligibility,
  createNhsAppBridgeRuntime,
  createOutboundNavigationGrant,
  negotiateBridgeCapabilityMatrix,
  renderBridgeDiagnosticsHtml,
  validateNavigationContract,
  visibleCapabilitiesFor,
  type BridgeAction,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";
const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";

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

function readCsv(relativePath: string): JsonRecord[] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0] ?? "");
  invariant(headers.length > 1, `${relativePath} must have a header.`);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    invariant(values.length === headers.length, `${relativePath} malformed row: ${line}`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function requireIncludes(haystack: string, needle: string, label: string): void {
  invariant(haystack.includes(needle), `${label} missing ${needle}.`);
}

function contract() {
  return buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:381-validator",
    routeFreezeDispositionRef: "RouteFreezeDisposition:381-validator",
    continuityEvidenceRef: "ContinuityEvidence:381-validator",
  });
}

function eligibility(input?: { readonly eligibilityState?: "live" | "recovery_required" }) {
  return createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
    eligibilityState: input?.eligibilityState ?? "live",
  });
}

const REQUIRED_FILES = [
  "packages/nhs-app-bridge-runtime/package.json",
  "packages/nhs-app-bridge-runtime/tsconfig.json",
  "packages/nhs-app-bridge-runtime/src/index.ts",
  "docs/architecture/381_phase7_nhs_app_bridge_runtime.md",
  "docs/frontend/381_phase7_navigation_contract_and_bridge_usage.md",
  "docs/security/381_phase7_bridge_navigation_fences.md",
  "data/analysis/381_external_reference_notes.md",
  "data/analysis/381_algorithm_alignment_notes.md",
  "data/test/381_bridge_capability_matrix_cases.csv",
  "data/test/381_navigation_contract_cases.csv",
  "tools/analysis/validate_381_phase7_bridge_runtime.ts",
  "tests/unit/381_bridge_capability_negotiation.spec.ts",
  "packages/nhs-app-bridge-runtime/tests/381_bridge_capability_negotiation.test.ts",
  "tests/playwright/381_nhs_app_bridge.helpers.ts",
  "tests/playwright/381_nhs_app_bridge_runtime.spec.ts",
  "tests/playwright/381_nhs_app_back_action_and_navigation.spec.ts",
  "tests/playwright/381_nhs_app_bridge_accessibility_and_aria.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:381-phase7-bridge-runtime"] ===
    "pnpm exec tsx ./tools/analysis/validate_381_phase7_bridge_runtime.ts",
  "package.json missing validate:381-phase7-bridge-runtime script.",
);

const tsconfig = readText("tsconfig.base.json");
requireIncludes(
  tsconfig,
  '"@vecells/nhs-app-bridge-runtime": ["packages/nhs-app-bridge-runtime/src/index.ts"]',
  "tsconfig.base.json",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_380_/m.test(checklist), "par_380 must be complete before par_381.");
invariant(
  /^- \[(?:-|X)\] par_381_/m.test(checklist),
  "par_381 must be claimed or complete while validator runs.",
);

const runtimeSource = readText("packages/nhs-app-bridge-runtime/src/index.ts");
for (const needle of [
  "NavigationContract",
  "BridgeCapabilityMatrix",
  "BridgeActionLease",
  "OutboundNavigationGrant",
  "NhsAppBridgeRuntime",
  "createFakeNhsAppApi",
  "renderBridgeDiagnosticsHtml",
  "destination_not_scrubbed",
  "destination_not_allowlisted",
]) {
  requireIncludes(runtimeSource, needle, "nhs-app bridge runtime source");
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/architecture/381_phase7_nhs_app_bridge_runtime.md": [
    "NavigationContract",
    "BridgeCapabilityMatrix",
    "BridgeActionLease",
    "OutboundNavigationGrant",
    "Playwright",
  ],
  "docs/frontend/381_phase7_navigation_contract_and_bridge_usage.md": [
    "@vecells/nhs-app-bridge-runtime",
    "window.nhsapp.navigation",
    "setBackAction",
    "clearForFenceDrift",
  ],
  "docs/security/381_phase7_bridge_navigation_fences.md": [
    "Raw API Boundary",
    "destination_not_scrubbed",
    "outbound_navigation_session_epoch_mismatch",
  ],
  "data/analysis/381_external_reference_notes.md": [
    "nhsconnect.github.io",
    "js-v2-api-specification",
    "web-integration-guidance",
    "playwright.dev",
  ],
  "data/analysis/381_algorithm_alignment_notes.md": [
    "NavigationContract",
    "BridgeCapabilityMatrix",
    "manifestVersionRef",
    "routeFamilyRef",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

const capabilityRows = readCsv("data/test/381_bridge_capability_matrix_cases.csv");
invariant(capabilityRows.length >= 6, "Capability matrix CSV must cover at least six cases.");
for (const caseId of ["standalone_browser", "stale_route_context", "recovery_eligibility"]) {
  invariant(
    capabilityRows.some((row) => row.case_id === caseId),
    `Capability matrix CSV missing ${caseId}.`,
  );
}

const navigationRows = readCsv("data/test/381_navigation_contract_cases.csv");
invariant(
  navigationRows.some(
    (row) => row.case_id === "appointment_manage" && row.expected_validation === "valid",
  ),
  "Navigation contract CSV missing valid appointment_manage case.",
);
invariant(
  navigationRows.some(
    (row) =>
      row.case_id === "bad_external_allowlist" &&
      row.expected_validation === "blocked_without_host_allowlist",
  ),
  "Navigation contract CSV missing bad_external_allowlist denial case.",
);

const navigationContract = contract();
const liveEligibility = eligibility();
const matrix = negotiateBridgeCapabilityMatrix({
  api: createFakeNhsAppApi({ platform: "ios" }),
  navigationContract,
  eligibility: liveEligibility,
  manifestVersionRef: MANIFEST,
  contextFenceRef: "ChannelContext:381-validator",
  scriptVersionHint: "v=2025-10-21",
});
const capabilities = visibleCapabilitiesFor(matrix, navigationContract, liveEligibility);
invariant(
  validateNavigationContract(navigationContract).valid,
  "NavigationContract should validate.",
);
invariant(matrix.capabilityState === "verified", "Full fake NHS App API should verify.");
invariant(matrix.scriptUrl.includes("?v=2025-10-21"), "Script query hint must be preserved.");
for (const action of ["setBackAction", "openOverlay", "addToCalendar"] satisfies BridgeAction[]) {
  invariant(capabilities.visible.includes(action), `Expected visible capability ${action}.`);
}

const standaloneMatrix = negotiateBridgeCapabilityMatrix({
  api: null,
  navigationContract,
  eligibility: liveEligibility,
  manifestVersionRef: MANIFEST,
  contextFenceRef: "ChannelContext:381-validator-browser",
});
const standaloneCapabilities = visibleCapabilitiesFor(
  standaloneMatrix,
  navigationContract,
  liveEligibility,
);
invariant(
  standaloneMatrix.capabilityState === "unavailable",
  "Standalone browser must be unavailable.",
);
invariant(
  standaloneCapabilities.visible.join("|") === "isEmbedded",
  "Standalone browser must not infer bridge-backed capabilities.",
);

const staleMatrix = negotiateBridgeCapabilityMatrix({
  api: createFakeNhsAppApi({ platform: "android" }),
  navigationContract,
  eligibility: liveEligibility,
  manifestVersionRef: MANIFEST,
  contextFenceRef: "ChannelContext:381-validator-stale",
  checkedAt: "2026-04-27T00:20:00.000Z",
  routeObservedAt: "2026-04-27T00:21:00.000Z",
});
const staleBridge = createNhsAppBridgeRuntime({
  api: createFakeNhsAppApi({ platform: "android" }),
  channelContextRef: "ChannelContext:381-validator-stale",
  patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381-validator",
  navigationContract,
  eligibility: liveEligibility,
  matrix: staleMatrix,
});
invariant(staleMatrix.capabilityState === "stale", "Stale route context must stale matrix.");
invariant(!staleBridge.setBackAction(() => undefined).ok, "Stale bridge must block back action.");

const fakeApi = createFakeNhsAppApi({ platform: "ios" });
const leaseBridge = createNhsAppBridgeRuntime({
  api: fakeApi,
  channelContextRef: "ChannelContext:381-validator-lease",
  patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381-validator",
  navigationContract,
  eligibility: liveEligibility,
  leaseManager: new BridgeActionLeaseManager(),
  selectedAnchorRef: "SelectedAnchor:validator-381",
});
const install = leaseBridge.setBackAction(() => undefined);
invariant(install.ok, "Verified bridge should install back action lease.");
invariant(leaseBridge.snapshot().activeLeases.length === 1, "Back action lease should be active.");
const staleLeases = leaseBridge.clearForFenceDrift({ sessionEpochRef: "SessionEpoch:drifted" });
invariant(staleLeases[0]?.leaseState === "stale", "Fence drift must stale active lease.");
invariant(
  fakeApi.calls.some((call) => call.action === "clearBackAction"),
  "Fence drift must clear raw NHS App back callback.",
);

const overlayGrant = createOutboundNavigationGrant({
  routeFamilyRef: "appointment_manage",
  destinationClass: "browser_overlay",
  scrubbedUrlRef: "https://www.nhs.uk/conditions/",
  allowedHostRef: "www.nhs.uk",
  allowedPathPattern: "/conditions/*",
  selectedAnchorRef: "SelectedAnchor:validator-381",
  bridgeCapabilityMatrixRef: leaseBridge.matrix.matrixId,
  patientEmbeddedNavEligibilityRef: liveEligibility.embeddedNavEligibilityId,
  manifestVersionRef: MANIFEST,
});
invariant(
  leaseBridge.openOverlay("https://www.nhs.uk/conditions/", overlayGrant).ok,
  "Allowlisted scrubbed overlay should open.",
);
invariant(
  leaseBridge.openOverlay("https://www.nhs.uk/conditions/?token=raw", {
    ...overlayGrant,
    scrubbedUrlRef: "https://www.nhs.uk/conditions/?token=raw",
  }).blockedReason === "destination_not_scrubbed",
  "Unscrubbed overlay URL must fail closed.",
);
invariant(
  leaseBridge.openOverlay("https://malicious.invalid/conditions/", {
    ...overlayGrant,
    scrubbedUrlRef: "https://malicious.invalid/conditions/",
    allowedHostRef: "malicious.invalid",
  }).blockedReason === "destination_not_allowlisted",
  "Non-allowlisted overlay host must fail closed.",
);

const recoveryBridge = createNhsAppBridgeRuntime({
  api: createFakeNhsAppApi({ platform: "ios" }),
  channelContextRef: "ChannelContext:381-validator-recovery",
  patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381-validator",
  navigationContract,
  eligibility: eligibility({ eligibilityState: "recovery_required" }),
});
const recoverySnapshot = recoveryBridge.snapshot();
invariant(
  recoverySnapshot.bridgeState === "recovery",
  "Recovery eligibility must render recovery state.",
);
const diagnosticsHtml = renderBridgeDiagnosticsHtml(recoverySnapshot);
for (const needle of [
  'data-testid="bridge-diagnostics-root"',
  'role="status"',
  "Hidden capabilities",
  "overflow-wrap: anywhere",
]) {
  requireIncludes(diagnosticsHtml, needle, "rendered bridge diagnostics HTML");
}

const invalidContract = buildNavigationContract({
  routeId: "jp_manage_local_appointment",
  manifestVersionRef: MANIFEST,
  patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:381-validator-invalid",
  routeFreezeDispositionRef: "RouteFreezeDisposition:381-validator-invalid",
  continuityEvidenceRef: "ContinuityEvidence:381-validator-invalid",
  allowedExternalHosts: [],
});
invariant(
  !validateNavigationContract(invalidContract).valid,
  "External-browser route without host allowlist must not validate.",
);

const playwrightRuntime = readText("tests/playwright/381_nhs_app_bridge_runtime.spec.ts");
const playwrightBack = readText("tests/playwright/381_nhs_app_back_action_and_navigation.spec.ts");
const playwrightAccessibility = readText(
  "tests/playwright/381_nhs_app_bridge_accessibility_and_aria.spec.ts",
);
for (const [label, source] of [
  ["runtime Playwright spec", playwrightRuntime],
  ["back/navigation Playwright spec", playwrightBack],
] as const) {
  for (const needle of ["newContext", "tracing.start", "screenshot"]) {
    requireIncludes(source, needle, label);
  }
}
requireIncludes(playwrightAccessibility, "ariaSnapshot", "accessibility Playwright spec");
requireIncludes(playwrightAccessibility, "scrollWidth", "accessibility Playwright spec");

const directRawApiLeaks = [
  "apps/patient-web/src",
  "packages/persistent-shell/src",
  "packages/surface-postures/src",
]
  .filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)))
  .flatMap((relativePath) => {
    const entries: string[] = [];
    const stack = [path.join(ROOT, relativePath)];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(absolute);
          continue;
        }
        if (!/\.[cm]?[tj]sx?$/.test(entry.name)) {
          continue;
        }
        const source = fs.readFileSync(absolute, "utf8");
        if (/window\.nhsapp|nhsapp\.navigation|nhsapp\.storage/.test(source)) {
          entries.push(path.relative(ROOT, absolute));
        }
      }
    }
    return entries;
  });
invariant(
  directRawApiLeaks.length === 0,
  `Route/runtime packages must not call raw NHS App API directly: ${directRawApiLeaks.join(", ")}`,
);

console.log("validate_381_phase7_bridge_runtime: ok");
