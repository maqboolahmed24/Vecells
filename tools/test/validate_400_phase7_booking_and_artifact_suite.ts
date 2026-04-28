import fs from "node:fs";
import path from "node:path";

import {
  buildNavigationContract,
  createFakeNhsAppApi,
  createLiveEligibility,
  createNhsAppBridgeRuntime,
  createOutboundNavigationGrant,
  negotiateBridgeCapabilityMatrix,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";
import {
  createDefaultPhase7ArtifactDeliveryApplication,
  type PrepareArtifactDeliveryInput,
} from "../../services/command-api/src/phase7-artifact-delivery-service.ts";
import {
  createDefaultPhase7ExternalEntryApplication,
  type ExternalEntrySessionSnapshot,
} from "../../services/command-api/src/phase7-external-entry-service.ts";
import { resolveEmbeddedBookingContext } from "../../apps/patient-web/src/embedded-booking.model.ts";
import { resolveEmbeddedPharmacyContext } from "../../apps/patient-web/src/embedded-pharmacy.model.ts";
import { resolveEmbeddedRecoveryArtifactContext } from "../../apps/patient-web/src/embedded-recovery-artifact.model.ts";

type JsonRecord = Record<string, unknown>;

const ROOT = "/Users/test/Code/V";
const MANIFEST = "nhsapp-manifest-v0.1.0-freeze-374";
const CONTINUITY = "ContinuityEvidence:400-validator";

const REQUIRED_FILES = [
  "docs/tests/400_phase7_booking_pharmacy_artifact_navigation_suite.md",
  "docs/tests/400_phase7_browser_and_backend_matrix.md",
  "data/test/400_deep_link_and_site_link_cases.csv",
  "data/test/400_booking_waitlist_manage_and_calendar_cases.csv",
  "data/test/400_pharmacy_choice_instruction_status_cases.csv",
  "data/test/400_artifact_and_fallback_cases.csv",
  "data/test/400_suite_results.json",
  "data/test/400_defect_log_and_remediation.json",
  "data/analysis/400_external_reference_notes.md",
  "tools/test/validate_400_phase7_booking_and_artifact_suite.ts",
  "tests/playwright/400_deep_links_site_links_and_return_to_journey.spec.ts",
  "tests/playwright/400_booking_waitlist_manage_and_calendar.spec.ts",
  "tests/playwright/400_pharmacy_choice_status_and_recovery.spec.ts",
  "tests/playwright/400_artifact_fallback_and_navigation.spec.ts",
  "tests/integration/400_booking_artifact_navigation_contract.spec.ts",
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
    packageJson.scripts?.["validate:400-phase7-booking-artifact-suite"] ===
      "pnpm exec tsx ./tools/test/validate_400_phase7_booking_and_artifact_suite.ts",
    "package.json missing validate:400-phase7-booking-artifact-suite script.",
  );

  const checklist = readText("prompt/checklist.md");
  invariant(/^- \[X\] par_399_/m.test(checklist), "par_399 must be complete before par_400.");
  invariant(/^- \[(?:-|X)\] par_400_/m.test(checklist), "par_400 must be claimed or complete.");

  const externalNotes = readText("data/analysis/400_external_reference_notes.md");
  for (const url of [
    "https://playwright.dev/docs/browser-contexts",
    "https://playwright.dev/docs/emulation",
    "https://playwright.dev/docs/trace-viewer",
    "https://playwright.dev/docs/screenshots",
    "https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/",
    "https://nhsconnect.github.io/nhsapp-developer-documentation/js-api-specification/",
    "https://service-manual.nhs.uk/accessibility/testing",
    "https://service-manual.nhs.uk/content/pdfs-and-other-non-html-documents",
    "https://service-manual.nhs.uk/design-system/components/error-summary",
  ]) {
    requireIncludes(externalNotes, url, "400 external reference notes");
  }

  for (const [file, minimumRows] of [
    ["data/test/400_deep_link_and_site_link_cases.csv", 9],
    ["data/test/400_booking_waitlist_manage_and_calendar_cases.csv", 8],
    ["data/test/400_pharmacy_choice_instruction_status_cases.csv", 7],
    ["data/test/400_artifact_and_fallback_cases.csv", 9],
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
  }>("data/test/400_suite_results.json");
  invariant(results.status === "passed", "400 suite results must be passed after verification.");
  for (const proofId of [
    "400-backend-booking-artifact-navigation-contract",
    "400-deep-links-site-links-and-return-to-journey",
    "400-booking-waitlist-manage-and-calendar",
    "400-pharmacy-choice-status-and-recovery",
    "400-artifact-fallback-and-navigation",
  ]) {
    invariant(
      results.proofs?.some((proof) => proof.proofId === proofId && proof.status === "passed"),
      `400 suite results missing passed proof ${proofId}.`,
    );
  }

  const defectLog = readJson<{ status?: string; defects?: unknown[] }>(
    "data/test/400_defect_log_and_remediation.json",
  );
  invariant(defectLog.status === "no_open_defects", "400 defect log has open defects.");
  invariant(
    Array.isArray(defectLog.defects) && defectLog.defects.length === 0,
    "400 defect log should be empty.",
  );

  for (const specPath of [
    "tests/playwright/400_deep_links_site_links_and_return_to_journey.spec.ts",
    "tests/playwright/400_booking_waitlist_manage_and_calendar.spec.ts",
    "tests/playwright/400_pharmacy_choice_status_and_recovery.spec.ts",
    "tests/playwright/400_artifact_fallback_and_navigation.spec.ts",
  ]) {
    const source = readText(specPath);
    for (const needle of ["importPlaywright", "tracing.start", "tracing.stop", "--run"]) {
      requireIncludes(source, needle, specPath);
    }
  }

  for (const specPath of [
    "tests/playwright/400_booking_waitlist_manage_and_calendar.spec.ts",
    "tests/playwright/400_pharmacy_choice_status_and_recovery.spec.ts",
    "tests/playwright/400_artifact_fallback_and_navigation.spec.ts",
  ]) {
    requireIncludes(readText(specPath), "startPatientWeb", specPath);
  }

  const backendSource = readText(
    "tests/integration/400_booking_artifact_navigation_contract.spec.ts",
  );
  for (const needle of [
    "createDefaultPhase7ExternalEntryApplication",
    "createDefaultPhase7ArtifactDeliveryApplication",
    "createNhsAppBridgeRuntime",
    "createOutboundNavigationGrant",
    "draft_promoted_request_shell_only",
    "payload_too_large",
    "mime_type_blocked",
    "destination_not_scrubbed",
    "resolveEmbeddedBookingContext",
    "resolveEmbeddedPharmacyContext",
    "resolveEmbeddedRecoveryArtifactContext",
  ]) {
    requireIncludes(backendSource, needle, "400 backend contract proof");
  }

  await validateExternalEntry();
  validateBridgeAndArtifactFences();
  validatePatientVisibleModels();

  console.log("validate_400_phase7_booking_and_artifact_suite: ok");
}

async function validateExternalEntry(): Promise<void> {
  const application = createDefaultPhase7ExternalEntryApplication();
  const manifest = application.getSiteLinkManifest({ environment: "sandpit" });
  invariant(
    manifest.allowedPathPatterns.includes("/requests/*"),
    "site-link manifest missing /requests/*.",
  );
  invariant(
    !manifest.allowedPathPatterns.includes("/admin/*"),
    "site-link manifest associated /admin/*.",
  );
  const android = application.exportAndroidAssetLinks({ environment: "sandpit" });
  const ios = application.exportIosAssociation({ environment: "sandpit" });
  invariant(
    android.body[0]?.target.package_name === "uk.nhs.nhsapp.sandpit",
    "Android package drift.",
  );
  invariant(ios.body.applinks.details[0]?.paths.includes("/requests/*"), "iOS paths drift.");

  const session = activeSession();
  const issuance = await application.issueExternalEntryGrant({
    environment: "sandpit",
    entryMode: "nhs_app_site_link",
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-400/pharmacy/status?from=nhsApp",
    governingObjectRef: "Request:REQ-400",
    governingObjectVersionRef: "RequestVersion:REQ-400:v1",
    sessionEpochRef: session.sessionEpochRef,
    subjectBindingVersionRef: session.subjectBindingVersionRef,
    lineageFenceRef: "LineageFence:REQ-400",
    subjectRef: session.subjectRef,
    issueIdempotencyKey: "issue-400-validator-status",
    opaqueToken: "external-entry-token-400-validator-status",
  });
  const common = {
    environment: "sandpit" as const,
    entryMode: "nhs_app_site_link" as const,
    journeyPathId: "jp_pharmacy_status",
    incomingPath: "/requests/REQ-400/pharmacy/status?from=nhsApp",
    presentedToken: issuance.materializedToken,
    governingObjectRef: "Request:REQ-400",
    governingObjectVersionRef: "RequestVersion:REQ-400:v1",
    lineageFenceRef: "LineageFence:REQ-400",
    currentSession: session,
  };
  const first = await application.resolveExternalEntry({
    ...common,
    redemptionIdempotencyKey: "redeem-400-validator-first",
  });
  const replay = await application.resolveExternalEntry({
    ...common,
    redemptionIdempotencyKey: "redeem-400-validator-replay",
  });
  invariant(first.outcome === "resolved_full", "first site-link redemption did not resolve.");
  invariant(replay.grantFenceState === "replayed", "site-link replay did not fence.");
  invariant(!replay.routeInstruction.includePhi, "site-link replay exposed PHI.");
}

function validateBridgeAndArtifactFences(): void {
  const bridgeFixture = bridgeTruth();
  const safeExternalGrant = createOutboundNavigationGrant({
    routeFamilyRef: bridgeFixture.bridge.navigationContract.routeFamilyRef,
    destinationClass: "external_browser",
    scrubbedUrlRef: "https://www.nhs.uk/conditions/",
    allowedHostRef: "www.nhs.uk",
    allowedPathPattern: "/conditions/*",
    selectedAnchorRef: "SelectedAnchor:400-validator",
    bridgeCapabilityMatrixRef: bridgeFixture.bridge.matrix.matrixId,
    patientEmbeddedNavEligibilityRef: bridgeFixture.bridge.eligibility.embeddedNavEligibilityId,
    manifestVersionRef: bridgeFixture.bridge.navigationContract.manifestVersionRef,
  });
  invariant(
    bridgeFixture.bridge.openExternal("https://www.nhs.uk/conditions/", safeExternalGrant).ok,
    "scrubbed external grant did not open.",
  );
  invariant(
    bridgeFixture.bridge.openExternal("https://www.nhs.uk/conditions/?token=raw", {
      ...safeExternalGrant,
      scrubbedUrlRef: "https://www.nhs.uk/conditions/?token=raw",
    }).blockedReason === "destination_not_scrubbed",
    "PHI-bearing external URL was not blocked.",
  );
  const noCalendar = bridgeTruth({ missingCalendar: true }).bridge.addToCalendar({
    subject: "Appointment",
    body: "Appointment details",
    location: "Clinic",
    startTimeEpochInSeconds: 1_775_000_000,
  });
  invariant(
    noCalendar.blockedReason === "bridge_action_not_visible" ||
      noCalendar.blockedReason === "runtime_method_missing",
    "missing calendar did not fail closed.",
  );

  const artifactApplication = createDefaultPhase7ArtifactDeliveryApplication();
  const prepared = artifactApplication.prepareDelivery(deliveryInput());
  invariant(prepared.byteGrant?.grantState === "issued", "artifact byte grant not issued.");
  const redeemed = artifactApplication.redeemByteGrant({
    grantId: prepared.byteGrant.grantId,
    artifactId: prepared.delivery.artifactId,
    bridgeCapabilityMatrixRef: prepared.byteGrant.bridgeCapabilityMatrixRef,
    patientEmbeddedNavEligibilityRef: prepared.byteGrant.patientEmbeddedNavEligibilityRef,
    selectedAnchorRef: prepared.byteGrant.selectedAnchorRef,
    returnContractRef: prepared.byteGrant.returnContractRef,
    sessionEpochRef: prepared.byteGrant.sessionEpochRef,
    subjectBindingVersionRef: prepared.byteGrant.subjectBindingVersionRef,
    continuityEvidenceRef: prepared.byteGrant.continuityEvidenceRef,
  });
  const replay = artifactApplication.redeemByteGrant({
    grantId: prepared.byteGrant.grantId,
    artifactId: prepared.delivery.artifactId,
    bridgeCapabilityMatrixRef: prepared.byteGrant.bridgeCapabilityMatrixRef,
    patientEmbeddedNavEligibilityRef: prepared.byteGrant.patientEmbeddedNavEligibilityRef,
    selectedAnchorRef: prepared.byteGrant.selectedAnchorRef,
    returnContractRef: prepared.byteGrant.returnContractRef,
    sessionEpochRef: prepared.byteGrant.sessionEpochRef,
    subjectBindingVersionRef: prepared.byteGrant.subjectBindingVersionRef,
    continuityEvidenceRef: prepared.byteGrant.continuityEvidenceRef,
  });
  invariant(redeemed.status === "transferred", "artifact byte grant did not redeem.");
  invariant(replay.failureReasons.includes("grant_redeemed"), "artifact byte replay not blocked.");
  invariant(
    artifactApplication
      .prepareDelivery(deliveryInput({ artifactId: "artifact:382:large-appointment-pack" }))
      .delivery.failureReasons.includes("payload_too_large"),
    "oversized artifact not blocked.",
  );
  invariant(
    artifactApplication
      .prepareDelivery(
        deliveryInput({
          artifactId: "artifact:382:unsupported-script",
          journeyPathId: "jp_request_status",
          routeFamilyRef: "request_status",
        }),
      )
      .delivery.failureReasons.includes("mime_type_blocked"),
    "unsupported MIME artifact not blocked.",
  );
}

function validatePatientVisibleModels(): void {
  const booking = resolveEmbeddedBookingContext({
    pathname: "/nhs-app/bookings/booking_case_391/alternatives",
    search: "?fixture=alternatives-drifted",
  });
  invariant(
    booking.currentState.actionability === "read_only",
    "drifted booking alternatives stayed writable.",
  );
  const calendar = resolveEmbeddedBookingContext({
    pathname: "/nhs-app/bookings/booking_case_391/calendar",
    search: "?fixture=manage",
  });
  invariant(
    calendar.calendarBridgeAction.capability === "available",
    "booking calendar capability drifted.",
  );
  const pharmacy = resolveEmbeddedPharmacyContext({
    pathname: "/nhs-app/pharmacy/PHC-2103/recovery",
    search: "?fixture=urgent-return",
  });
  invariant(
    pharmacy.currentState.actionability === "recovery_required",
    "pharmacy urgent recovery drifted.",
  );
  const artifact = resolveEmbeddedRecoveryArtifactContext({
    pathname: "/nhs-app/recovery/ART-400/artifact-fallback",
    search: "?fixture=artifact-fallback",
  });
  invariant(
    artifact.artifactTruth.fallbackState === "secure_send_later",
    "artifact fallback drifted.",
  );
}

function bridgeTruth(input?: {
  readonly missingDownload?: boolean;
  readonly missingCalendar?: boolean;
}) {
  const navigationContract = buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:400-validator",
    routeFreezeDispositionRef: "RouteFreezeDisposition:400-validator",
    continuityEvidenceRef: CONTINUITY,
  });
  const eligibility = createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST,
    continuityEvidenceRef: CONTINUITY,
  });
  const missingMethods = [
    ...(input?.missingDownload ? ["downloadBytes" as const] : []),
    ...(input?.missingCalendar ? ["addToCalendar" as const] : []),
  ];
  const api = createFakeNhsAppApi({ platform: "ios", missingMethods });
  const matrix = negotiateBridgeCapabilityMatrix({
    api,
    navigationContract,
    eligibility,
    manifestVersionRef: MANIFEST,
    contextFenceRef: "ChannelContext:400-validator",
  });
  return {
    matrix,
    eligibility,
    bridge: createNhsAppBridgeRuntime({
      api,
      channelContextRef: "ChannelContext:400-validator",
      patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:400-validator",
      navigationContract,
      eligibility,
      matrix,
      selectedAnchorRef: "SelectedAnchor:400-validator",
    }),
  };
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
    selectedAnchorRef: "SelectedAnchor:400-artifact",
    returnContractRef: "ReturnContract:400-artifact",
    sessionEpochRef: eligibility.sessionEpochRef,
    subjectBindingVersionRef: eligibility.subjectBindingVersionRef,
    continuityEvidenceRef: CONTINUITY,
    bridgeCapabilityMatrix: matrix,
    patientEmbeddedNavEligibility: eligibility,
    ...input,
  };
}

function activeSession(): ExternalEntrySessionSnapshot {
  return {
    sessionRef: "Session:400-validator",
    subjectRef: "Subject:patient-400",
    sessionEpochRef: "SessionEpoch:400",
    subjectBindingVersionRef: "SubjectBindingVersion:patient-400:v1",
    assuranceLevel: "nhs_p9",
    sessionState: "active",
    embeddedSessionRef: "EmbeddedSession:400",
  };
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
