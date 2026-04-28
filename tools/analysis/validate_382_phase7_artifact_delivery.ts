import fs from "node:fs";
import path from "node:path";

import {
  buildNavigationContract,
  createFakeNhsAppApi,
  createLiveEligibility,
  negotiateBridgeCapabilityMatrix,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";
import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  createDefaultPhase7ArtifactDeliveryApplication,
  phase7ArtifactDeliveryRoutes,
  type PrepareArtifactDeliveryInput,
} from "../../services/command-api/src/phase7-artifact-delivery-service.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";
const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";
const CONTINUITY = "ContinuityEvidence:382-validator";

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

function bridgeTruth(input?: { readonly missingDownload?: boolean }) {
  const navigationContract = buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:382-validator",
    routeFreezeDispositionRef: "RouteFreezeDisposition:382-validator",
    continuityEvidenceRef: CONTINUITY,
  });
  const eligibility = createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
    continuityEvidenceRef: CONTINUITY,
  });
  const matrix = negotiateBridgeCapabilityMatrix({
    api: createFakeNhsAppApi({
      platform: "ios",
      missingMethods: input?.missingDownload ? ["downloadBytes"] : [],
    }),
    navigationContract,
    eligibility,
    manifestVersionRef: MANIFEST,
    contextFenceRef: "ChannelContext:382-validator",
  });
  return { matrix, eligibility };
}

function deliveryInput(
  input?: Partial<PrepareArtifactDeliveryInput> & { readonly missingDownload?: boolean },
): PrepareArtifactDeliveryInput {
  const { matrix, eligibility } = bridgeTruth({
    missingDownload: input?.missingDownload,
  });
  return {
    environment: "sandpit",
    artifactId: "artifact:382:appointment-letter",
    subjectRef: "Subject:patient-382",
    journeyPathId: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    selectedAnchorRef: "SelectedAnchor:382-validator",
    returnContractRef: "ReturnContract:382-validator",
    sessionEpochRef: eligibility.sessionEpochRef,
    subjectBindingVersionRef: eligibility.subjectBindingVersionRef,
    continuityEvidenceRef: CONTINUITY,
    bridgeCapabilityMatrix: matrix,
    patientEmbeddedNavEligibility: eligibility,
    ...input,
  };
}

const REQUIRED_FILES = [
  "services/command-api/src/phase7-artifact-delivery-service.ts",
  "docs/architecture/382_phase7_artifact_delivery_and_degraded_mode.md",
  "docs/api/382_phase7_artifact_delivery_api.md",
  "docs/security/382_phase7_artifact_transport_controls.md",
  "data/analysis/382_external_reference_notes.md",
  "data/analysis/382_algorithm_alignment_notes.md",
  "data/test/382_artifact_delivery_matrix.csv",
  "data/test/382_degraded_mode_matrix.csv",
  "tools/analysis/validate_382_phase7_artifact_delivery.ts",
  "tests/unit/382_artifact_byte_grant.spec.ts",
  "tests/integration/382_artifact_delivery_and_embedded_degraded_mode.spec.ts",
] as const;

for (const relativePath of REQUIRED_FILES) {
  invariant(fs.existsSync(path.join(ROOT, relativePath)), `MISSING_REQUIRED_FILE:${relativePath}`);
}

const packageJson = readJson<{ scripts?: Record<string, string> }>("package.json");
invariant(
  packageJson.scripts?.["validate:382-phase7-artifact-delivery"] ===
    "pnpm exec tsx ./tools/analysis/validate_382_phase7_artifact_delivery.ts",
  "package.json missing validate:382-phase7-artifact-delivery script.",
);

const checklist = readText("prompt/checklist.md");
invariant(/^- \[X\] par_381_/m.test(checklist), "par_381 must be complete before par_382.");
invariant(
  /^- \[(?:-|X)\] par_382_/m.test(checklist),
  "par_382 must be claimed or complete while validator runs.",
);

const serviceSource = readText("services/command-api/src/phase7-artifact-delivery-service.ts");
for (const needle of [
  "BinaryArtifactDelivery",
  "ArtifactByteGrant",
  "EmbeddedErrorContract",
  "ChannelDegradedMode",
  "payload_too_large",
  "continuity_stale",
  "subject_mismatch",
  "source_unavailable",
  "downloadBytes",
]) {
  requireIncludes(serviceSource, needle, "artifact delivery service");
}

for (const route of phase7ArtifactDeliveryRoutes) {
  invariant(
    serviceDefinition.routeCatalog.some((catalogRoute) => catalogRoute.routeId === route.routeId),
    `serviceDefinition route catalog missing ${route.routeId}.`,
  );
}

for (const [relativePath, requiredTerms] of Object.entries({
  "docs/architecture/382_phase7_artifact_delivery_and_degraded_mode.md": [
    "BinaryArtifactDelivery",
    "ArtifactByteGrant",
    "EmbeddedErrorContract",
    "ChannelDegradedMode",
    "summary-first",
  ],
  "docs/api/382_phase7_artifact_delivery_api.md": [
    "/internal/v1/nhs-app/artifacts:prepare-delivery",
    "/internal/v1/nhs-app/artifact-byte-grants:redeem",
    "recovery_required",
  ],
  "docs/security/382_phase7_artifact_transport_controls.md": [
    "Byte Grant Boundary",
    "payload_too_large",
    "grant_tuple_mismatch",
  ],
  "data/analysis/382_external_reference_notes.md": [
    "nhsconnect.github.io",
    "downloadFromBytes",
    "service-manual.nhs.uk",
  ],
  "data/analysis/382_algorithm_alignment_notes.md": [
    "BridgeCapabilityMatrix",
    "PatientEmbeddedNavEligibility",
    "summary-first",
  ],
})) {
  const text = readText(relativePath);
  for (const term of requiredTerms) {
    requireIncludes(text, term, relativePath);
  }
}

const deliveryRows = readCsv("data/test/382_artifact_delivery_matrix.csv");
for (const caseId of [
  "download_ready",
  "payload_too_large",
  "capability_missing",
  "continuity_stale",
  "route_frozen",
  "subject_mismatch",
  "source_unavailable",
  "mime_type_blocked",
]) {
  invariant(
    deliveryRows.some((row) => row.case_id === caseId),
    `Missing delivery case ${caseId}.`,
  );
}

const degradedRows = readCsv("data/test/382_degraded_mode_matrix.csv");
invariant(
  degradedRows.some(
    (row) =>
      row.failure_reason === "continuity_stale" &&
      row.expected_degraded_state === "recovery_required",
  ),
  "Degraded matrix must cover stale continuity recovery.",
);
invariant(
  degradedRows.some(
    (row) =>
      row.failure_reason === "payload_too_large" &&
      row.expected_degraded_state === "secure_send_later",
  ),
  "Degraded matrix must cover oversized send-later fallback.",
);

const application = createDefaultPhase7ArtifactDeliveryApplication();
const prepared = application.prepareDelivery(deliveryInput());
invariant(prepared.delivery.deliveryPosture === "live", "Valid artifact should be live.");
invariant(prepared.byteGrant?.grantState === "issued", "Valid artifact should issue byte grant.");
invariant(
  prepared.delivery.summaryFallback.title === "Appointment letter",
  "Summary fallback required.",
);
const preparedGrant = prepared.byteGrant;
invariant(preparedGrant, "Prepared delivery must include byte grant.");

const redeemed = application.redeemByteGrant({
  grantId: preparedGrant.grantId,
  artifactId: prepared.delivery.artifactId,
  bridgeCapabilityMatrixRef: preparedGrant.bridgeCapabilityMatrixRef,
  patientEmbeddedNavEligibilityRef: preparedGrant.patientEmbeddedNavEligibilityRef,
  selectedAnchorRef: preparedGrant.selectedAnchorRef,
  returnContractRef: preparedGrant.returnContractRef,
  sessionEpochRef: preparedGrant.sessionEpochRef,
  subjectBindingVersionRef: preparedGrant.subjectBindingVersionRef,
  continuityEvidenceRef: preparedGrant.continuityEvidenceRef,
});
invariant(redeemed.status === "transferred", "Issued byte grant should redeem.");
invariant(redeemed.byteDownload?.mimeType === "application/pdf", "Redeemed payload must be PDF.");
const replay = application.redeemByteGrant({
  grantId: preparedGrant.grantId,
  artifactId: prepared.delivery.artifactId,
  bridgeCapabilityMatrixRef: preparedGrant.bridgeCapabilityMatrixRef,
  patientEmbeddedNavEligibilityRef: preparedGrant.patientEmbeddedNavEligibilityRef,
  selectedAnchorRef: preparedGrant.selectedAnchorRef,
  returnContractRef: preparedGrant.returnContractRef,
  sessionEpochRef: preparedGrant.sessionEpochRef,
  subjectBindingVersionRef: preparedGrant.subjectBindingVersionRef,
  continuityEvidenceRef: preparedGrant.continuityEvidenceRef,
});
invariant(replay.failureReasons.includes("grant_redeemed"), "Grant replay must fail closed.");

const oversized = application.prepareDelivery(
  deliveryInput({ artifactId: "artifact:382:large-appointment-pack" }),
);
invariant(oversized.delivery.deliveryPosture === "deferred", "Oversized payload should defer.");
invariant(
  oversized.delivery.failureReasons.includes("payload_too_large"),
  "Oversized payload reason missing.",
);
invariant(oversized.byteGrant === null, "Oversized payload must not issue byte grant.");
invariant(
  oversized.degradedMode?.degradedState === "secure_send_later",
  "Oversized payload should select secure send-later.",
);

const stale = application.prepareDelivery(deliveryInput({ continuityState: "stale" }));
invariant(stale.delivery.deliveryPosture === "recovery_required", "Stale continuity must recover.");
invariant(
  stale.embeddedErrorContract?.shellDisposition === "same_shell_recovery",
  "Stale continuity must preserve same-shell recovery.",
);

const frozen = application.prepareDelivery(deliveryInput({ routeFreezeState: "frozen" }));
invariant(frozen.delivery.deliveryPosture === "blocked", "Frozen route must block byte delivery.");
invariant(
  frozen.delivery.summaryFallback.patientSummary.length > 0,
  "Frozen route must keep summary.",
);

const subjectMismatch = application.prepareDelivery(
  deliveryInput({ subjectRef: "Subject:other-patient" }),
);
invariant(
  subjectMismatch.delivery.failureReasons.includes("subject_mismatch"),
  "Subject mismatch must be explicit.",
);

const missingCapability = application.prepareDelivery(deliveryInput({ missingDownload: true }));
invariant(
  missingCapability.delivery.failureReasons.includes("capability_missing"),
  "Missing bridge download capability must be explicit.",
);

const telemetry = JSON.stringify(application.listTelemetry());
invariant(
  !telemetry.includes("appointment-letter.pdf"),
  "Telemetry must not include raw filenames.",
);
invariant(!telemetry.includes("Subject:patient-382"), "Telemetry must hash subject refs.");

console.log("validate_382_phase7_artifact_delivery: ok");
