import fs from "node:fs";
import path from "node:path";

import {
  assert397MonthlyPackRedactionSafe,
  buildDefault397ChannelReleaseCohortManifest,
  buildDefault397ReleaseGuardrailPolicyManifest,
  buildDefault397RouteFreezeDispositionManifest,
  create397ReleaseControlApplication,
  create397ReleaseControlReadinessReport,
  evaluate397ReleaseGuardrails,
  generate397MonthlyPerformancePack,
  rehearse397GuardrailFreezeAndKillSwitch,
  submit397JourneyChangeNotice,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";
import { createEmbeddedA11yCoverageRows } from "../../apps/patient-web/src/embedded-accessibility-responsive.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

const REQUIRED_FILES = [
  "docs/tests/401_phase7_accessibility_responsive_and_release_readiness_suite.md",
  "docs/tests/401_phase7_browser_and_backend_matrix.md",
  "data/test/401_accessibility_and_keyboard_cases.csv",
  "data/test/401_responsive_safe_area_and_device_matrix.csv",
  "data/test/401_route_freeze_and_guardrail_cases.csv",
  "data/test/401_telemetry_disclosure_and_monthly_pack_cases.csv",
  "data/test/401_rollback_and_release_readiness_cases.csv",
  "data/test/401_suite_results.json",
  "data/test/401_defect_log_and_remediation.json",
  "data/analysis/401_external_reference_notes.md",
  "tools/test/validate_401_phase7_final_readiness_suite.ts",
  "tests/playwright/401_accessibility_keyboard_and_aria.spec.ts",
  "tests/playwright/401_responsive_safe_area_and_reduced_motion.spec.ts",
  "tests/playwright/401_route_freeze_and_guardrail_behaviour.spec.ts",
  "tests/playwright/401_release_control_surfaces_and_visual.spec.ts",
  "tests/integration/401_release_readiness_contract.spec.ts",
  "tests/scheduled/401_monthly_pack_and_rollback_job.spec.ts",
] as const;

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  for (const relativePath of REQUIRED_FILES) {
    invariant(
      fs.existsSync(path.join(ROOT, relativePath)),
      `MISSING_REQUIRED_FILE:${relativePath}`,
    );
  }

  const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
  invariant(
    packageJson.scripts?.["validate:401-phase7-final-readiness-suite"] ===
      "pnpm exec tsx ./tools/test/validate_401_phase7_final_readiness_suite.ts",
    "package.json missing validate:401-phase7-final-readiness-suite script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(/^- \[X\] par_400_/m.test(checklist), "par_400 must be complete before par_401.");
  invariant(/^- \[(?:-|X)\] par_401_/m.test(checklist), "par_401 must be claimed or complete.");

  const externalNotes = readText("data/analysis/401_external_reference_notes.md");
  for (const url of [
    "https://playwright.dev/docs/accessibility-testing",
    "https://playwright.dev/docs/aria-snapshots",
    "https://playwright.dev/docs/test-snapshots",
    "https://playwright.dev/docs/emulation",
    "https://playwright.dev/docs/browser-contexts",
    "https://www.w3.org/WAI/WCAG22/Understanding/reflow.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html",
    "https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/",
    "https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/",
    "https://service-manual.nhs.uk/accessibility",
    "https://service-manual.nhs.uk/accessibility/testing",
    "https://service-manual.nhs.uk/design-system/components/error-summary",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration",
  ]) {
    requireIncludes(externalNotes, url, "401 external reference notes");
  }

  for (const [file, minimumRows] of [
    ["data/test/401_accessibility_and_keyboard_cases.csv", 10],
    ["data/test/401_responsive_safe_area_and_device_matrix.csv", 10],
    ["data/test/401_route_freeze_and_guardrail_cases.csv", 8],
    ["data/test/401_telemetry_disclosure_and_monthly_pack_cases.csv", 7],
    ["data/test/401_rollback_and_release_readiness_cases.csv", 7],
  ] as const) {
    const rows = readCsv(file);
    invariant(rows.length >= minimumRows, `${file} missing required scenario rows.`);
    invariant(
      rows.every((row) => row.at(-1) === "passed"),
      `${file} contains a non-passed row.`,
    );
  }

  const results = readJson<{
    status?: string;
    proofs?: Array<{ proofId?: string; status?: string }>;
  }>("data/test/401_suite_results.json");
  invariant(results.status === "passed", "401 suite results must be passed.");
  for (const proofId of [
    "401-backend-release-readiness-contract",
    "401-scheduled-monthly-pack-and-rollback-job",
    "401-accessibility-keyboard-and-aria",
    "401-responsive-safe-area-and-reduced-motion",
    "401-route-freeze-and-guardrail-behaviour",
    "401-release-control-surfaces-and-visual",
  ]) {
    invariant(
      results.proofs?.some((proof) => proof.proofId === proofId && proof.status === "passed"),
      `401 suite results missing passed proof ${proofId}.`,
    );
  }

  const defectLog = readJson<{ status?: string; defects?: unknown[] }>(
    "data/test/401_defect_log_and_remediation.json",
  );
  invariant(defectLog.status === "no_open_defects", "401 defect log has open defects.");
  invariant(
    Array.isArray(defectLog.defects) && defectLog.defects.length === 0,
    "401 defect log should be empty.",
  );

  for (const specPath of [
    "tests/playwright/401_accessibility_keyboard_and_aria.spec.ts",
    "tests/playwright/401_responsive_safe_area_and_reduced_motion.spec.ts",
    "tests/playwright/401_route_freeze_and_guardrail_behaviour.spec.ts",
    "tests/playwright/401_release_control_surfaces_and_visual.spec.ts",
  ]) {
    const source = readText(specPath);
    for (const needle of ["importPlaywright", "tracing.start", "tracing.stop", "--run"]) {
      requireIncludes(source, needle, specPath);
    }
  }

  const accessibilitySpec = readText(
    "tests/playwright/401_accessibility_keyboard_and_aria.spec.ts",
  );
  for (const needle of [
    "embeddedA11yRouteFamilies",
    "writeAriaSnapshot",
    "401-calm-booking.aria.yml",
    "401-degraded-recovery.aria.yml",
    "401-frozen-recovery.aria.yml",
  ]) {
    requireIncludes(accessibilitySpec, needle, "401 accessibility spec");
  }

  const responsiveSpec = readText(
    "tests/playwright/401_responsive_safe_area_and_reduced_motion.spec.ts",
  );
  for (const needle of [
    "EmbeddedSafeAreaObserver",
    "EmbeddedReducedMotionAdapter",
    "HostResizeResilienceLayer",
    "320",
    "640",
  ]) {
    requireIncludes(responsiveSpec, needle, "401 responsive spec");
  }

  const routeFreezeSpec = readText(
    "tests/playwright/401_route_freeze_and_guardrail_behaviour.spec.ts",
  );
  for (const needle of [
    "telemetry_missing",
    "threshold_breach",
    "assurance_slice_degraded",
    "compatibility_drift",
    "continuity_evidence_degraded",
    "NHSAppRouteFreezeInspector",
    "redirect_to_safe_route",
  ]) {
    requireIncludes(routeFreezeSpec, needle, "401 route freeze spec");
  }

  const releaseVisualSpec = readText(
    "tests/playwright/401_release_control_surfaces_and_visual.spec.ts",
  );
  for (const needle of [
    "NHSAppReadinessCockpit",
    "OpenEvidenceDrawerButton",
    "401-release-control-surface-desktop.png",
    "401-release-control-surface-mobile.png",
  ]) {
    requireIncludes(releaseVisualSpec, needle, "401 release visual spec");
  }

  const backendSource = readText("tests/integration/401_release_readiness_contract.spec.ts");
  for (const needle of [
    "assert397MonthlyPackRedactionSafe",
    "release397FreezeWithFreshGreenWindow",
    "rehearse397GuardrailFreezeAndKillSwitch",
    "submit397JourneyChangeNotice",
    "createEmbeddedA11yCoverageRows",
    "blocked_lead_time",
  ]) {
    requireIncludes(backendSource, needle, "401 backend contract proof");
  }

  const scheduledSource = readText("tests/scheduled/401_monthly_pack_and_rollback_job.spec.ts");
  for (const needle of [
    "generate397MonthlyPerformancePack",
    "401_monthly_pack_and_rollback_job.json",
    "rehearse397GuardrailFreezeAndKillSwitch",
  ]) {
    requireIncludes(scheduledSource, needle, "401 scheduled job proof");
  }

  const suiteDoc = readText(
    "docs/tests/401_phase7_accessibility_responsive_and_release_readiness_suite.md",
  );
  for (const needle of [
    "VisualizationFallbackContract",
    "telemetry-missing",
    "monthly performance pack",
    "kill switch activation without redeploy",
  ]) {
    requireIncludes(suiteDoc, needle, "401 suite document");
  }

  validateReleaseReadinessModel();
  console.log("validate_401_phase7_final_readiness_suite: ok");
}

function validateReleaseReadinessModel(): void {
  const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest = buildDefault397RouteFreezeDispositionManifest();
  const cohortId = cohortManifest.cohorts[0]?.cohortId;
  invariant(Boolean(cohortId), "401 release model missing cohort.");

  const report = create397ReleaseControlReadinessReport({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  invariant(report.readinessState === "ready", "401 release model readiness is not ready.");
  invariant(
    report.machineReadableSummary.rollbackWithoutRedeploy,
    "401 release model rollback is not reversible.",
  );

  for (const scenario of [
    { trigger: "telemetry_missing", observationWindow: { telemetryPresent: false } },
    { trigger: "threshold_breach", observationWindow: { journeyErrorRate: 0.04 } },
    {
      trigger: "assurance_slice_degraded",
      observationWindow: { assuranceSliceState: "degraded" as const },
    },
    {
      trigger: "compatibility_drift",
      observationWindow: { compatibilityEvidenceState: "stale" as const },
    },
    {
      trigger: "continuity_evidence_degraded",
      observationWindow: { continuityEvidenceState: "degraded" as const },
    },
  ] as const) {
    const guardrails = evaluate397ReleaseGuardrails({
      guardrailManifest,
      observationWindow: scenario.observationWindow,
    });
    invariant(
      guardrails.triggerTypes.includes(scenario.trigger),
      `401 guardrail missing ${scenario.trigger}.`,
    );
  }

  const pack = generate397MonthlyPerformancePack({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
    environment: "limited_release",
    period: "2026-05",
  });
  invariant(pack.eventContractRefs.length > 0, "401 pack missing event contracts.");
  invariant(assert397MonthlyPackRedactionSafe(pack).safeForExport, "401 pack redaction not safe.");

  const rehearsal = rehearse397GuardrailFreezeAndKillSwitch({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  invariant(rehearsal.disabledJumpOffWithoutRedeploy, "401 rehearsal not reversible.");

  const notice = submit397JourneyChangeNotice({
    application: create397ReleaseControlApplication({
      cohortManifest,
      guardrailManifest,
      dispositionManifest,
    }),
    cohortManifest,
    changeType: "minor",
    affectedJourneys: ["jp_request_status"],
    submittedAt: "2026-04-27T12:00:00.000Z",
    plannedChangeAt: "2026-05-30T12:00:00.000Z",
  });
  invariant(notice.approvalState === "submitted", "401 minor notice did not submit.");

  const coverageRows = createEmbeddedA11yCoverageRows();
  invariant(coverageRows.length >= 7, "401 accessibility coverage rows incomplete.");
  invariant(
    coverageRows.every((row) => row.contractCount >= 10),
    "401 accessibility coverage row missing contracts.",
  );
}

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

function readCsv(relativePath: string): string[][] {
  const lines = readText(relativePath).trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(1).map(parseCsvLine);
}
