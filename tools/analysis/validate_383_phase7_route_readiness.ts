import fs from "node:fs";
import path from "node:path";

import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7RouteReadinessApplication,
  phase7RouteReadinessRoutes,
  type RouteReadinessFailureReason,
  type RouteReadinessVerdict,
} from "../../services/command-api/src/phase7-route-readiness-service.ts";
import {
  PHASE7_CONFIG_FINGERPRINT,
  PHASE7_MANIFEST_VERSION,
  PHASE7_RELEASE_APPROVAL_FREEZE_REF,
} from "../../services/command-api/src/phase7-nhs-app-manifest-service.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";

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

const REQUIRED_FILES = [
  "services/command-api/src/phase7-route-readiness-service.ts",
  "docs/architecture/383_phase7_route_readiness_and_promotion_verifier.md",
  "docs/api/383_phase7_route_readiness_api.md",
  "docs/accessibility/383_phase7_accessibility_support_contracts.md",
  "data/analysis/383_external_reference_notes.md",
  "data/analysis/383_algorithm_alignment_notes.md",
  "data/test/383_route_readiness_matrix.csv",
  "data/test/383_promotion_failure_reason_matrix.csv",
  "tools/analysis/validate_383_phase7_route_readiness.ts",
  "tests/unit/383_continuity_evidence_and_accessibility_contracts.spec.ts",
  "tests/integration/383_route_readiness_and_promotion_verifier.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:383-phase7-route-readiness"] ===
    "pnpm exec tsx ./tools/analysis/validate_383_phase7_route_readiness.ts",
  "package.json missing validate:383-phase7-route-readiness script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_382_/m.test(checklist), "par_382 must be complete before par_383.");
invariant(
  /^- \[(?:-|X)\] par_383_/m.test(checklist),
  "par_383 must be claimed or complete while validator runs.",
);

const serviceSource = readText("services/command-api/src/phase7-route-readiness-service.ts");
for (const needle of [
  "NHSAppContinuityEvidenceBundle",
  "AccessibleContentVariant",
  "AuditEvidenceReference",
  "UIStateContract",
  "verifyPromotionReadiness",
  "accessibility_audit_missing",
  "continuity_evidence_stale",
  "bridge_support_mismatch",
  "release_tuple_drift",
  "placeholder_contract_missing",
  "incompatible_ui_state",
]) {
  requireIncludes(serviceSource, needle, "route readiness service");
}

for (const route of phase7RouteReadinessRoutes) {
  invariant(
    serviceDefinition.routeCatalog.some((catalogRoute) => catalogRoute.routeId === route.routeId),
    `serviceDefinition route catalog missing ${route.routeId}.`,
  );
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/architecture/383_phase7_route_readiness_and_promotion_verifier.md": [
    "NHSAppContinuityEvidenceBundle",
    "AccessibleContentVariant",
    "AuditEvidenceReference",
    "UIStateContract",
    "promotion tuple hash",
  ],
  "docs/api/383_phase7_route_readiness_api.md": [
    "/internal/v1/nhs-app/readiness/routes",
    "/internal/v1/nhs-app/readiness:verify-promotion",
    "evidence_missing",
  ],
  "docs/accessibility/383_phase7_accessibility_support_contracts.md": [
    "WCAG2.2-AA",
    "WAI-ARIA APG",
    "Playwright ARIA snapshot",
  ],
  "data/analysis/383_external_reference_notes.md": [
    "nhsconnect.github.io",
    "service-manual.nhs.uk",
    "WCAG 2.2",
    "Playwright",
  ],
  "data/analysis/383_algorithm_alignment_notes.md": [
    "release_tuple_drift",
    "bridge_support_mismatch",
    "Verdict Precedence",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

const routeRows = readCsv("data/test/383_route_readiness_matrix.csv");
for (const verdict of [
  "ready",
  "conditionally_ready",
  "placeholder_only",
  "blocked",
  "evidence_missing",
] satisfies RouteReadinessVerdict[]) {
  invariant(
    routeRows.some((row) => row.expected_verdict === verdict),
    `Route readiness matrix missing ${verdict}.`,
  );
}

const failureRows = readCsv("data/test/383_promotion_failure_reason_matrix.csv");
for (const failureReason of [
  "accessibility_audit_missing",
  "continuity_evidence_stale",
  "bridge_support_mismatch",
  "release_tuple_drift",
  "placeholder_contract_missing",
  "incompatible_ui_state",
] satisfies RouteReadinessFailureReason[]) {
  invariant(
    failureRows.some((row) => row.failure_reason === failureReason),
    `Promotion failure matrix missing ${failureReason}.`,
  );
}

const application = createDefaultPhase7RouteReadinessApplication();
const evidence = application.listEvidence();
invariant(evidence.continuityEvidenceBundles.length >= 4, "Continuity evidence seed incomplete.");
invariant(evidence.accessibleContentVariants.length >= 4, "Accessible content seed incomplete.");
invariant(evidence.auditEvidenceReferences.length >= 7, "Audit evidence seed incomplete.");
invariant(evidence.uiStateContracts.length >= 5, "UI state contract seed incomplete.");

const pharmacy = application.evaluateRouteReadiness({
  environment: "sandpit",
  journeyPathId: "jp_pharmacy_status",
});
invariant(pharmacy.verdict === "ready", "jp_pharmacy_status should be ready.");
invariant(pharmacy.failureReasons.length === 0, "Ready route must have no failures.");

const appointment = application.evaluateRouteReadiness({
  environment: "sandpit",
  journeyPathId: "jp_manage_local_appointment",
});
invariant(
  appointment.verdict === "conditionally_ready",
  "jp_manage_local_appointment should be conditionally_ready.",
);
invariant(
  appointment.failureReasons.includes("manual_observation_pending"),
  "Conditional route must expose observation reason.",
);

const requestStatus = application.evaluateRouteReadiness({
  environment: "sandpit",
  journeyPathId: "jp_request_status",
});
invariant(requestStatus.verdict === "evidence_missing", "jp_request_status should miss evidence.");
invariant(
  requestStatus.failureReasons.includes("continuity_evidence_missing"),
  "Missing continuity must be explicit.",
);
invariant(
  requestStatus.failureReasons.includes("accessibility_audit_missing"),
  "Missing accessibility audit must be explicit.",
);

const records = application.evaluateRouteReadiness({
  environment: "sandpit",
  journeyPathId: "jp_records_letters_summary",
});
invariant(records.verdict === "placeholder_only", "Records route should be placeholder_only.");
invariant(
  records.failureReasons.includes("route_requires_embedded_adaptation"),
  "Placeholder route should disclose adaptation dependency.",
);

const waitlist = application.evaluateRouteReadiness({
  environment: "sandpit",
  journeyPathId: "jp_waitlist_offer_response",
});
invariant(waitlist.verdict === "blocked", "Waitlist route should be blocked.");
invariant(
  waitlist.failureReasons.includes("bridge_support_mismatch"),
  "Waitlist route should show bridge mismatch.",
);
invariant(
  waitlist.failureReasons.includes("incompatible_ui_state"),
  "Waitlist route should show incompatible UI state.",
);

const promotable = application.verifyPromotionReadiness({
  environment: "sandpit",
  journeyPathIds: ["jp_pharmacy_status"],
  expectedManifestVersion: PHASE7_MANIFEST_VERSION,
  expectedConfigFingerprint: PHASE7_CONFIG_FINGERPRINT,
  expectedReleaseApprovalFreezeRef: PHASE7_RELEASE_APPROVAL_FREEZE_REF,
});
invariant(promotable.promotionState === "promotable", "Ready pharmacy route should promote.");

const blocked = application.verifyPromotionReadiness({ environment: "sandpit" });
invariant(blocked.promotionState === "blocked", "Default route set should block promotion.");
invariant(
  blocked.aggregateFailureReasons.includes("promotion_policy_not_ready"),
  "Blocked promotion must include promotion policy reason.",
);

const drift = application.verifyPromotionReadiness({
  environment: "sandpit",
  journeyPathIds: ["jp_pharmacy_status"],
  expectedManifestVersion: "nhsapp-manifest-v0.1.0-drift",
});
invariant(drift.promotionState === "blocked", "Release tuple drift should block promotion.");
invariant(
  drift.aggregateFailureReasons.includes("release_tuple_drift"),
  "Release drift reason missing.",
);

console.log("validate_383_phase7_route_readiness: ok");
