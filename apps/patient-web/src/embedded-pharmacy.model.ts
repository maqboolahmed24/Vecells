import {
  resolvePharmacyChoicePreview,
  type PharmacyChoicePreviewSnapshot,
  type PharmacyChoiceProviderCardSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-choice-preview";
import {
  resolvePharmacyDispatchPreview,
  type PharmacyDispatchPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-dispatch-preview";
import {
  resolvePharmacyPatientStatusPreview,
  type PharmacyPatientStatusPreviewSnapshot,
} from "../../../packages/domains/pharmacy/src/phase6-pharmacy-patient-status-preview";
import {
  caseForPatientPharmacyId,
  type PatientPharmacyCaseSeed,
} from "./patient-pharmacy-shell.model";

export const EMBEDDED_PHARMACY_TASK_ID = "par_392";
export const EMBEDDED_PHARMACY_VISUAL_MODE = "NHSApp_Embedded_Pharmacy";
export const EMBEDDED_PHARMACY_CONTRACT_REF =
  "EmbeddedPharmacyContract:392:phase6-choice-instructions-status-return";
export const EMBEDDED_PHARMACY_SHELL_CONTINUITY_KEY =
  "patient.portal.pharmacy.embedded.pharmacy-family";

export type EmbeddedPharmacyRouteKey =
  | "choice"
  | "instructions"
  | "status"
  | "outcome"
  | "recovery";

export type EmbeddedPharmacyFixture =
  | "choice"
  | "warned-choice"
  | "proof-refresh"
  | "instructions"
  | "referral-sent"
  | "dispatch-pending"
  | "completed"
  | "urgent-return"
  | "bounce-back"
  | "reopen"
  | "recovery";

export type EmbeddedPharmacyActionability =
  | "live"
  | "secondary"
  | "read_only"
  | "frozen"
  | "recovery_required";

export interface EmbeddedPharmacyCurrentState {
  readonly title: string;
  readonly body: string;
  readonly stateLabel: string;
  readonly nextActionLabel: string;
  readonly actionability: EmbeddedPharmacyActionability;
  readonly tone: "info" | "success" | "warning" | "blocked";
  readonly liveRegionMessage: string;
}

export interface EmbeddedPharmacySummaryRow {
  readonly label: string;
  readonly value: string;
}

export interface EmbeddedPharmacyContinuityEvidence {
  readonly evidenceRef: string;
  readonly pharmacyCaseId: string;
  readonly selectedProviderRef: string;
  readonly selectedProviderLabel: string;
  readonly selectedProviderProvenanceRef: string;
  readonly shellContinuityKey: typeof EMBEDDED_PHARMACY_SHELL_CONTINUITY_KEY;
  readonly sameShellState: "preserved" | "read_only" | "recovery_required";
  readonly sourceProjectionRefs: readonly string[];
}

export interface EmbeddedPharmacyContext {
  readonly taskId: typeof EMBEDDED_PHARMACY_TASK_ID;
  readonly visualMode: typeof EMBEDDED_PHARMACY_VISUAL_MODE;
  readonly contractRef: typeof EMBEDDED_PHARMACY_CONTRACT_REF;
  readonly routeKey: EmbeddedPharmacyRouteKey;
  readonly pharmacyCaseId: string;
  readonly fixture: EmbeddedPharmacyFixture;
  readonly embeddedPath: string;
  readonly canonicalPath: string;
  readonly shellCase: PatientPharmacyCaseSeed;
  readonly choicePreview: PharmacyChoicePreviewSnapshot | null;
  readonly dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  readonly patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
  readonly selectedProvider: PharmacyChoiceProviderCardSnapshot | null;
  readonly chosenProviderLabel: string;
  readonly chosenProviderSummary: string;
  readonly currentState: EmbeddedPharmacyCurrentState;
  readonly continuityEvidence: EmbeddedPharmacyContinuityEvidence;
  readonly summaryRows: readonly EmbeddedPharmacySummaryRow[];
  readonly recoveryBanner: {
    readonly visible: boolean;
    readonly title: string;
    readonly body: string;
    readonly actionLabel: string;
  };
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel: string | null;
  readonly announcement: string;
}

const KNOWN_FIXTURES = new Set<EmbeddedPharmacyFixture>([
  "choice",
  "warned-choice",
  "proof-refresh",
  "instructions",
  "referral-sent",
  "dispatch-pending",
  "completed",
  "urgent-return",
  "bounce-back",
  "reopen",
  "recovery",
]);

const EMBEDDED_PHARMACY_SOURCE_PROJECTIONS = [
  "PharmacyChoiceTruthProjection",
  "PharmacyDispatchTruthProjection",
  "PharmacyPatientStatusProjection",
  "PharmacyOutcomeTruthProjection",
] as const;

function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim() || "/nhs-app/pharmacy/PHC-2048/choice";
  return trimmed === "/" ? "/nhs-app/pharmacy/PHC-2048/choice" : trimmed.replace(/\/+$/, "");
}

export function isEmbeddedPharmacyPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return (
    /^\/nhs-app\/pharmacy\/[^/]+(?:\/(?:choice|instructions|status|outcome|recovery))?$/.test(
      normalized,
    ) ||
    /^\/embedded-pharmacy(?:\/[^/]+)?(?:\/(?:choice|instructions|status|outcome|recovery))?$/.test(
      normalized,
    )
  );
}

function routeKeyFromSegment(segment: string | null): EmbeddedPharmacyRouteKey {
  switch (segment) {
    case "instructions":
      return "instructions";
    case "status":
      return "status";
    case "outcome":
      return "outcome";
    case "recovery":
      return "recovery";
    case "choice":
    default:
      return "choice";
  }
}

function normalizeFixture(
  fixture: string | null,
  routeKey: EmbeddedPharmacyRouteKey,
): EmbeddedPharmacyFixture {
  if (fixture && KNOWN_FIXTURES.has(fixture as EmbeddedPharmacyFixture)) {
    return fixture as EmbeddedPharmacyFixture;
  }
  if (routeKey === "instructions") return "referral-sent";
  if (routeKey === "status") return "dispatch-pending";
  if (routeKey === "outcome") return "completed";
  if (routeKey === "recovery") return "urgent-return";
  return "choice";
}

export function embeddedPharmacyCaseIdForFixture(
  fixture: EmbeddedPharmacyFixture,
): string {
  switch (fixture) {
    case "warned-choice":
      return "PHC-2148";
    case "proof-refresh":
    case "recovery":
      return "PHC-2156";
    case "dispatch-pending":
      return "PHC-2057";
    case "instructions":
    case "referral-sent":
      return "PHC-2184";
    case "completed":
      return "PHC-2196";
    case "urgent-return":
    case "bounce-back":
    case "reopen":
      return "PHC-2103";
    case "choice":
    default:
      return "PHC-2048";
  }
}

function normalizePharmacyCaseId(
  requestedCaseId: string,
  fixture: EmbeddedPharmacyFixture,
  fixtureWasExplicit: boolean,
): string {
  if (fixtureWasExplicit) {
    return embeddedPharmacyCaseIdForFixture(fixture);
  }
  return /^PHC-\d{4}$/i.test(requestedCaseId)
    ? requestedCaseId.toUpperCase()
    : embeddedPharmacyCaseIdForFixture(fixture);
}

export function parseEmbeddedPharmacyLocation(input: {
  readonly pathname: string;
  readonly search?: string;
}): {
  readonly pharmacyCaseId: string;
  readonly routeKey: EmbeddedPharmacyRouteKey;
  readonly fixture: EmbeddedPharmacyFixture;
  readonly fixtureWasExplicit: boolean;
} {
  const normalized = normalizePathname(input.pathname);
  const params = new URLSearchParams(input.search ?? "");
  const parts = normalized.split("/").filter(Boolean);
  let pharmacyCaseId = params.get("case") ?? "PHC-2048";
  let segment: string | null = params.get("view");

  const nhsPharmacyIndex =
    parts[0] === "nhs-app" && parts[1] === "pharmacy" ? 1 : -1;
  if (nhsPharmacyIndex >= 0) {
    pharmacyCaseId = parts[nhsPharmacyIndex + 1] ?? pharmacyCaseId;
    segment = parts[nhsPharmacyIndex + 2] ?? segment ?? "choice";
  }

  const embeddedIndex = parts.indexOf("embedded-pharmacy");
  if (embeddedIndex >= 0) {
    pharmacyCaseId = parts[embeddedIndex + 1] ?? pharmacyCaseId;
    segment = parts[embeddedIndex + 2] ?? segment ?? "choice";
  }

  const routeKey = routeKeyFromSegment(segment);
  const fixtureWasExplicit = params.has("fixture");
  const fixture = normalizeFixture(params.get("fixture"), routeKey);
  return {
    pharmacyCaseId: normalizePharmacyCaseId(pharmacyCaseId, fixture, fixtureWasExplicit),
    routeKey,
    fixture,
    fixtureWasExplicit,
  };
}

export function embeddedPharmacyPath(input: {
  readonly pharmacyCaseId: string;
  readonly routeKey: EmbeddedPharmacyRouteKey;
  readonly fixture?: EmbeddedPharmacyFixture | null;
}): string {
  const params = new URLSearchParams();
  if (input.fixture) params.set("fixture", input.fixture);
  return `/nhs-app/pharmacy/${input.pharmacyCaseId}/${input.routeKey}${
    params.size > 0 ? `?${params.toString()}` : ""
  }`;
}

function canonicalPathFor(input: {
  readonly pharmacyCaseId: string;
  readonly routeKey: EmbeddedPharmacyRouteKey;
}): string {
  const shellRoute =
    input.routeKey === "choice"
      ? "choose"
      : input.routeKey === "outcome" || input.routeKey === "recovery"
        ? "status"
        : input.routeKey;
  return `/pharmacy/${input.pharmacyCaseId}/${shellRoute}`;
}

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function selectedProviderFor(
  choicePreview: PharmacyChoicePreviewSnapshot | null,
): PharmacyChoiceProviderCardSnapshot | null {
  const selectedRef = choicePreview?.choiceSession.selectedProviderRef?.refId;
  if (!selectedRef) return null;
  return choicePreview?.providerCards.find((provider) => provider.providerId === selectedRef) ?? null;
}

function chosenProviderFor(input: {
  readonly shellCase: PatientPharmacyCaseSeed;
  readonly choicePreview: PharmacyChoicePreviewSnapshot | null;
  readonly dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  readonly patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
}): { readonly label: string; readonly summary: string; readonly provenanceRef: string } {
  const selectedProvider = selectedProviderFor(input.choicePreview);
  if (selectedProvider) {
    return {
      label: selectedProvider.displayName,
      summary: selectedProvider.consultationLabel,
      provenanceRef: selectedProvider.explanationRef.refId,
    };
  }
  if (input.choicePreview?.driftRecovery?.previousSelectionLabel) {
    return {
      label: input.choicePreview.driftRecovery.previousSelectionLabel,
      summary:
        input.choicePreview.driftRecovery.previousSelectionSummary ??
        "Previous pharmacy is preserved as read-only provenance.",
      provenanceRef: input.choicePreview.driftRecovery.previousVisibleChoiceSetHash,
    };
  }
  if (input.patientStatusPreview) {
    return {
      label: input.patientStatusPreview.chosenPharmacyAnchor.providerLabel,
      summary: input.patientStatusPreview.chosenPharmacyAnchor.providerSummary,
      provenanceRef: input.patientStatusPreview.outcomeTruth.pharmacyOutcomeTruthProjectionId,
    };
  }
  if (input.dispatchPreview) {
    return {
      label: input.dispatchPreview.chosenPharmacy.providerLabel,
      summary: input.dispatchPreview.chosenPharmacy.providerSummary,
      provenanceRef: input.dispatchPreview.truthBinding.pharmacyDispatchTruthProjectionId,
    };
  }
  return {
    label: input.shellCase.chosenProviderLabel,
    summary: input.shellCase.chosenProviderSummary,
    provenanceRef: input.shellCase.continuityKey,
  };
}

function actionabilityFor(input: {
  readonly routeKey: EmbeddedPharmacyRouteKey;
  readonly fixture: EmbeddedPharmacyFixture;
  readonly choicePreview: PharmacyChoicePreviewSnapshot | null;
  readonly dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  readonly patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
}): EmbeddedPharmacyActionability {
  if (
    input.fixture === "urgent-return" ||
    input.fixture === "bounce-back" ||
    input.fixture === "reopen" ||
    input.patientStatusPreview?.surfaceState === "urgent_action"
  ) {
    return "recovery_required";
  }
  if (
    input.fixture === "proof-refresh" ||
    input.fixture === "recovery" ||
    input.choicePreview?.driftRecovery?.requiresSafeReselection
  ) {
    return "recovery_required";
  }
  if (input.routeKey === "choice" && input.fixture === "warned-choice") {
    return "secondary";
  }
  if (
    input.patientStatusPreview?.statusProjection.staleOrBlockedPosture === "repair_required" ||
    input.patientStatusPreview?.statusProjection.staleOrBlockedPosture === "blocked" ||
    input.patientStatusPreview?.statusProjection.staleOrBlockedPosture === "identity_frozen"
  ) {
    return "frozen";
  }
  if (
    input.dispatchPreview?.continuityWarning ||
    input.dispatchPreview?.truthBinding.authoritativeProofState === "pending" ||
    input.patientStatusPreview?.statusProjection.staleOrBlockedPosture === "stale"
  ) {
    return "read_only";
  }
  if (input.routeKey === "outcome" || input.patientStatusPreview?.surfaceState === "completed") {
    return "read_only";
  }
  return "live";
}

function currentStateFor(input: {
  readonly routeKey: EmbeddedPharmacyRouteKey;
  readonly fixture: EmbeddedPharmacyFixture;
  readonly shellCase: PatientPharmacyCaseSeed;
  readonly choicePreview: PharmacyChoicePreviewSnapshot | null;
  readonly dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  readonly patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
  readonly chosenProviderLabel: string;
}): EmbeddedPharmacyCurrentState {
  const actionability = actionabilityFor(input);
  if (actionability === "recovery_required") {
    const urgent = input.patientStatusPreview?.reviewNextStepPage;
    return {
      title: urgent?.title ?? input.choicePreview?.driftRecovery?.title ?? "Pharmacy route needs review",
      body:
        urgent?.summary ??
        input.choicePreview?.driftRecovery?.summary ??
        "The last safe pharmacy context remains visible while live controls are paused.",
      stateLabel: "Recovery required",
      nextActionLabel: "Review recovery guidance",
      actionability,
      tone: "blocked",
      liveRegionMessage: "Pharmacy route is in recovery. Live provider-change controls are paused.",
    };
  }
  if (input.routeKey === "choice") {
    return {
      title: input.choicePreview?.pageTitle ?? "Choose a pharmacy",
      body:
        input.choicePreview?.pageSummary ??
        "Choose from the current pharmacy proof before the referral can continue.",
      stateLabel:
        input.fixture === "warned-choice" ? "Warning needs acknowledgement" : "Choice current",
      nextActionLabel:
        input.fixture === "warned-choice" ? "Confirm pharmacy choice" : "Continue with pharmacy",
      actionability,
      tone: input.fixture === "warned-choice" ? "warning" : "info",
      liveRegionMessage: "Pharmacy choice proof is visible in list order.",
    };
  }
  if (input.routeKey === "instructions") {
    const page = input.patientStatusPreview?.nextStepPage ?? input.patientStatusPreview?.confirmationPage;
    return {
      title: page?.title ?? input.dispatchPreview?.patientPendingState?.nextStepTitle ?? "What happens next",
      body:
        page?.summary ??
        input.dispatchPreview?.patientPendingState?.nextStepSummary ??
        input.shellCase.nextStepSummary,
      stateLabel: input.patientStatusPreview?.surfaceState.replaceAll("_", " ") ?? "instructions",
      nextActionLabel: "Check pharmacy status",
      actionability,
      tone: actionability === "read_only" ? "warning" : "info",
      liveRegionMessage: `Instructions are shown for ${input.chosenProviderLabel}.`,
    };
  }
  if (input.routeKey === "outcome") {
    return {
      title: input.patientStatusPreview?.outcomePage?.title ?? "Pharmacy outcome",
      body:
        input.patientStatusPreview?.outcomePage?.summary ??
        "The pharmacy outcome is not recorded yet for this route.",
      stateLabel:
        input.patientStatusPreview?.outcomeTruth.outcomeTruthState.replaceAll("_", " ") ??
        "outcome pending",
      nextActionLabel: "Review status",
      actionability,
      tone: input.patientStatusPreview?.surfaceState === "completed" ? "success" : "warning",
      liveRegionMessage: "Pharmacy outcome record is visible.",
    };
  }
  if (input.routeKey === "recovery") {
    return {
      title: input.patientStatusPreview?.reviewNextStepPage?.title ?? "Pharmacy recovery",
      body:
        input.patientStatusPreview?.reviewNextStepPage?.summary ??
        "Keep the chosen provider context visible while the recovery route is reviewed.",
      stateLabel: "Recovery",
      nextActionLabel: "Return to choice",
      actionability,
      tone: "blocked",
      liveRegionMessage: "Pharmacy recovery guidance is visible.",
    };
  }
  return {
    title:
      input.patientStatusPreview?.statusTracker.title ??
      input.dispatchPreview?.statusStrip.title ??
      "Referral status",
    body:
      input.patientStatusPreview?.statusTracker.summary ??
      input.dispatchPreview?.statusStrip.summary ??
      input.shellCase.checkpointSummary,
    stateLabel:
      input.patientStatusPreview?.surfaceState.replaceAll("_", " ") ??
      input.dispatchPreview?.surfaceState.replaceAll("_", " ") ??
      "status",
    nextActionLabel:
      input.patientStatusPreview?.surfaceState === "completed" ? "Review outcome" : "Review next step",
    actionability,
    tone:
      input.patientStatusPreview?.surfaceState === "completed"
        ? "success"
        : actionability === "read_only"
          ? "warning"
          : "info",
    liveRegionMessage: `Referral status is shown for ${input.chosenProviderLabel}.`,
  };
}

function continuityFor(input: {
  readonly pharmacyCaseId: string;
  readonly currentState: EmbeddedPharmacyCurrentState;
  readonly chosenProviderLabel: string;
  readonly chosenProviderProvenanceRef: string;
  readonly choicePreview: PharmacyChoicePreviewSnapshot | null;
  readonly dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  readonly patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
}): EmbeddedPharmacyContinuityEvidence {
  const sameShellState =
    input.currentState.actionability === "recovery_required"
      ? "recovery_required"
      : input.currentState.actionability === "read_only" ||
          input.currentState.actionability === "frozen"
        ? "read_only"
        : "preserved";
  return {
    evidenceRef: "experience_continuity::embedded_pharmacy::phase7::392",
    pharmacyCaseId: input.pharmacyCaseId,
    selectedProviderRef: input.chosenProviderProvenanceRef,
    selectedProviderLabel: input.chosenProviderLabel,
    selectedProviderProvenanceRef: input.chosenProviderProvenanceRef,
    shellContinuityKey: EMBEDDED_PHARMACY_SHELL_CONTINUITY_KEY,
    sameShellState,
    sourceProjectionRefs: [
      ...EMBEDDED_PHARMACY_SOURCE_PROJECTIONS,
      input.choicePreview?.truthProjection.pharmacyChoiceTruthProjectionId,
      input.dispatchPreview?.truthBinding.pharmacyDispatchTruthProjectionId,
      input.patientStatusPreview?.statusProjection.pharmacyPatientStatusProjectionId,
      input.patientStatusPreview?.outcomeTruth.pharmacyOutcomeTruthProjectionId,
    ].filter(Boolean) as string[],
  };
}

function summaryRowsFor(input: {
  readonly currentState: EmbeddedPharmacyCurrentState;
  readonly choicePreview: PharmacyChoicePreviewSnapshot | null;
  readonly dispatchPreview: PharmacyDispatchPreviewSnapshot | null;
  readonly patientStatusPreview: PharmacyPatientStatusPreviewSnapshot | null;
  readonly chosenProviderLabel: string;
}): readonly EmbeddedPharmacySummaryRow[] {
  return [
    { label: "Chosen pharmacy", value: input.chosenProviderLabel },
    {
      label: "Choice proof",
      value: input.choicePreview?.truthProjection.projectionState.replaceAll("_", " ") ?? "not shown",
    },
    {
      label: "Dispatch proof",
      value:
        input.dispatchPreview?.truthBinding.authoritativeProofState.replaceAll("_", " ") ??
        "not started",
    },
    {
      label: "Outcome truth",
      value:
        input.patientStatusPreview?.outcomeTruth.outcomeTruthState.replaceAll("_", " ") ??
        "waiting",
    },
    {
      label: "Actionability",
      value: input.currentState.actionability.replaceAll("_", " "),
    },
  ];
}

export function resolveEmbeddedPharmacyContext(input: {
  readonly pathname: string;
  readonly search?: string;
}): EmbeddedPharmacyContext {
  const parsed = parseEmbeddedPharmacyLocation(input);
  const pharmacyCaseId = parsed.pharmacyCaseId;
  const shellCase = caseForPatientPharmacyId(pharmacyCaseId);
  const choicePreview = resolvePharmacyChoicePreview(pharmacyCaseId);
  const dispatchPreview = resolvePharmacyDispatchPreview(pharmacyCaseId);
  const patientStatusPreview = resolvePharmacyPatientStatusPreview(pharmacyCaseId);
  const selectedProvider = selectedProviderFor(choicePreview);
  const chosenProvider = chosenProviderFor({
    shellCase,
    choicePreview,
    dispatchPreview,
    patientStatusPreview,
  });
  const currentState = currentStateFor({
    routeKey: parsed.routeKey,
    fixture: parsed.fixture,
    shellCase,
    choicePreview,
    dispatchPreview,
    patientStatusPreview,
    chosenProviderLabel: chosenProvider.label,
  });
  const continuityEvidence = continuityFor({
    pharmacyCaseId,
    currentState,
    chosenProviderLabel: chosenProvider.label,
    chosenProviderProvenanceRef: chosenProvider.provenanceRef,
    choicePreview,
    dispatchPreview,
    patientStatusPreview,
  });
  const recoveryVisible =
    currentState.actionability === "recovery_required" ||
    currentState.actionability === "frozen" ||
    Boolean(choicePreview?.driftRecovery) ||
    Boolean(dispatchPreview?.continuityWarning);
  return {
    taskId: EMBEDDED_PHARMACY_TASK_ID,
    visualMode: EMBEDDED_PHARMACY_VISUAL_MODE,
    contractRef: EMBEDDED_PHARMACY_CONTRACT_REF,
    routeKey: parsed.routeKey,
    pharmacyCaseId,
    fixture: parsed.fixture,
    embeddedPath: embeddedPharmacyPath(parsed),
    canonicalPath: canonicalPathFor(parsed),
    shellCase,
    choicePreview,
    dispatchPreview,
    patientStatusPreview,
    selectedProvider,
    chosenProviderLabel: chosenProvider.label,
    chosenProviderSummary: chosenProvider.summary,
    currentState,
    continuityEvidence,
    summaryRows: summaryRowsFor({
      currentState,
      choicePreview,
      dispatchPreview,
      patientStatusPreview,
      chosenProviderLabel: chosenProvider.label,
    }),
    recoveryBanner: {
      visible: recoveryVisible,
      title:
        currentState.actionability === "recovery_required"
          ? currentState.title
          : "Pharmacy context preserved",
      body:
        currentState.actionability === "recovery_required"
          ? currentState.body
          : "The previous provider context stays visible while current pharmacy truth is checked.",
      actionLabel:
        currentState.actionability === "recovery_required"
          ? "Review recovery guidance"
          : "Review preserved pharmacy context",
    },
    primaryActionLabel: currentState.nextActionLabel,
    secondaryActionLabel:
      parsed.routeKey === "choice" ? null : `Back to ${titleCase("choice")}`,
    announcement: currentState.liveRegionMessage,
  };
}
