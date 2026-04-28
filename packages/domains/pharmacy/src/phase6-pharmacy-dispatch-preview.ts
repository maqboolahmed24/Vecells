import type { AggregateRef, PharmacyPathwayCode } from "./phase6-pharmacy-case-kernel";
import type {
  PharmacyConsentCheckpoint,
  PharmacyTransportMode,
} from "./phase6-pharmacy-directory-choice-engine";
import type {
  DispatchProofEnvelopeSnapshot,
  DispatchProofState,
  DispatchRiskState,
  DispatchTransportAcceptanceState,
  PharmacyDispatchPlanSnapshot,
  PharmacyDispatchTruthProjectionSnapshot,
} from "./phase6-pharmacy-dispatch-engine";
import type { PharmacyReferralPackageSnapshot } from "./phase6-pharmacy-referral-package-engine";
import type {
  PharmacyConsoleContinuityEvidenceProjectionSnapshot,
  PharmacyHandoffWatchProjectionSnapshot,
} from "./phase6-pharmacy-console-engine";

const TASK_342 = "seq_342" as const;
const TASK_343 =
  "seq_343_phase6_freeze_directory_discovery_referral_dispatch_and_outcome_reconciliation_contracts" as const;
const TASK_349 =
  "par_349_phase6_track_backend_build_referral_pack_composer_and_content_governance_binding" as const;
const TASK_355 =
  "par_355_phase6_track_backend_build_pharmacy_console_support_region_and_stock_truth_api" as const;

type Task342 = typeof TASK_342;
type Task343 = typeof TASK_343;
type Task349 = typeof TASK_349;
type Task355 = typeof TASK_355;

export const PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE = "Pharmacy_Dispatch_Assurance";

export type DispatchSurfaceState =
  | "dispatch_pending"
  | "dispatch_confirmed"
  | "consent_blocked"
  | "continuity_drift"
  | "reconciliation_required";

export type DispatchSurfaceTone = "ready" | "pending" | "watch" | "blocked";
export type DispatchWarningKind = "proof_drift" | "consent_drift" | "anchor_drift";
export type DispatchArtifactDisposition = "included" | "redacted" | "omitted";

export interface ChosenPharmacyAnchorCardSnapshot {
  requestLineageLabel: string;
  providerLabel: string;
  providerSummary: string;
  preservedSelectionLabel: string | null;
  continuityKey: string;
  audienceLabel: string;
  anchorState: "current" | "read_only" | "stale";
  chips: readonly string[];
}

export interface DispatchProofStatusStripSnapshot {
  tone: DispatchSurfaceTone;
  eyebrow: string;
  title: string;
  summary: string;
  statusPill: string;
  proofDeadlineLabel: string;
  nextStepLabel: string;
  recoveryOwnerLabel: string;
}

export interface DispatchEvidenceRowSnapshot {
  rowId:
    | "transport_acceptance"
    | "provider_acceptance"
    | "authoritative_proof"
    | "proof_deadline"
    | "recovery_owner";
  label: string;
  value: string;
  summary: string;
  detail: string;
  tone: DispatchSurfaceTone;
}

export interface DispatchArtifactSummaryRowSnapshot {
  artifactRef: string;
  label: string;
  disposition: DispatchArtifactDisposition;
  summary: string;
}

export interface DispatchArtifactSummaryCardSnapshot {
  title: string;
  summary: string;
  transformNotesLabel: string;
  classificationLabel: string;
  rows: readonly DispatchArtifactSummaryRowSnapshot[];
}

export interface PatientDispatchPendingStateSnapshot {
  title: string;
  summary: string;
  dominantActionLabel: string;
  dominantActionRoute: "instructions" | "status" | "choose";
  nextStepTitle: string;
  nextStepSummary: string;
  reassuranceLabel: string;
}

export interface PatientConsentCheckpointNoticeSnapshot {
  title: string;
  summary: string;
  actionLabel: string;
  actionRoute: "choose" | "instructions" | "status";
  blockingReasonLabel: string;
}

export interface DispatchContinuityWarningStripSnapshot {
  kind: DispatchWarningKind;
  tone: Exclude<DispatchSurfaceTone, "ready">;
  title: string;
  summary: string;
  actionLabel: string;
}

export interface PharmacyDispatchTruthBinding
  extends Pick<
    PharmacyDispatchTruthProjectionSnapshot,
    | "pharmacyDispatchTruthProjectionId"
    | "dispatchAttemptRef"
    | "dispatchPlanRef"
    | "selectedProviderRef"
    | "packageId"
    | "packageHash"
    | "transportMode"
    | "dispatchPlanHash"
    | "transportAcceptanceState"
    | "providerAcceptanceState"
    | "authoritativeProofState"
    | "proofRiskState"
    | "proofDeadlineAt"
    | "continuityEvidenceRef"
    | "computedAt"
  > {}

export interface PharmacyConsentCheckpointBinding
  extends Pick<
    PharmacyConsentCheckpoint,
    | "pharmacyConsentCheckpointId"
    | "providerRef"
    | "pathwayOrLane"
    | "referralScope"
    | "selectionBindingHash"
    | "packageFingerprint"
    | "checkpointState"
    | "continuityState"
    | "evaluatedAt"
  > {}

export interface PharmacyReferralPackageBinding
  extends Pick<
    PharmacyReferralPackageSnapshot,
    | "packageId"
    | "providerRef"
    | "pathwayRef"
    | "selectionBindingHash"
    | "packageFingerprint"
    | "packageHash"
    | "packageState"
    | "sourcePracticeSummary"
    | "requestLineageSummary"
    | "visibilityPolicyRef"
    | "minimumNecessaryContractRef"
  > {}

export interface PharmacyDispatchPlanBinding
  extends Pick<
    PharmacyDispatchPlanSnapshot,
    | "dispatchPlanId"
    | "packageId"
    | "providerRef"
    | "transportMode"
    | "artifactManifestRef"
    | "dispatchPlanHash"
    | "planState"
    | "plannedAt"
  > {}

export interface DispatchProofEnvelopeBinding
  extends Pick<
    DispatchProofEnvelopeSnapshot,
    | "dispatchProofEnvelopeId"
    | "proofDeadlineAt"
    | "proofSources"
    | "transportAcceptanceEvidenceRefs"
    | "providerAcceptanceEvidenceRefs"
    | "deliveryEvidenceRefs"
    | "authoritativeProofSourceRef"
    | "proofState"
    | "riskState"
    | "verifiedAt"
  > {}

export interface ReferralArtifactManifestBinding {
  artifactManifestId: string;
  packageId: string;
  includedArtifactRefs: readonly string[];
  redactedArtifactRefs: readonly string[];
  omittedArtifactRefs: readonly string[];
  transformNotesRef: string;
  classificationRef: string;
  compiledAt: string;
}

export interface DispatchRecoveryBinding
  extends Pick<
      PharmacyHandoffWatchProjectionSnapshot,
      "watchWindowState" | "watchWindowEndAt" | "recoveryOwnerRef"
    >,
    Pick<
      PharmacyConsoleContinuityEvidenceProjectionSnapshot,
      "validationState" | "pendingPosture" | "nextReviewAt"
    > {}

export interface PharmacyDispatchPreviewSnapshot {
  pharmacyCaseId: string;
  visualMode: typeof PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE;
  surfaceState: DispatchSurfaceState;
  patientCalmAllowed: boolean;
  selectedAnchorRef: string;
  chosenPharmacy: ChosenPharmacyAnchorCardSnapshot;
  statusStrip: DispatchProofStatusStripSnapshot;
  evidenceRows: readonly DispatchEvidenceRowSnapshot[];
  artifactSummary: DispatchArtifactSummaryCardSnapshot;
  patientPendingState: PatientDispatchPendingStateSnapshot | null;
  patientConsentNotice: PatientConsentCheckpointNoticeSnapshot | null;
  continuityWarning: DispatchContinuityWarningStripSnapshot | null;
  drawerTitle: string;
  drawerSummary: string;
  referralSummary: string;
  pathwayLabel: string;
  transportLabel: string;
  truthBinding: PharmacyDispatchTruthBinding;
  consentBinding: PharmacyConsentCheckpointBinding;
  packageBinding: PharmacyReferralPackageBinding;
  dispatchPlanBinding: PharmacyDispatchPlanBinding;
  proofEnvelopeBinding: DispatchProofEnvelopeBinding;
  artifactManifestBinding: ReferralArtifactManifestBinding;
  recoveryBinding: DispatchRecoveryBinding;
}

function makeRef<TTarget extends string, TOwner extends string>(
  targetFamily: TTarget,
  refId: string,
  ownerTask: TOwner,
): AggregateRef<TTarget, TOwner> {
  return { targetFamily, refId, ownerTask };
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `phd_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function titleCase(value: string): string {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function transportLabel(transportMode: PharmacyTransportMode): string {
  switch (transportMode) {
    case "bars_fhir":
      return "BARS FHIR dispatch";
    case "supplier_interop":
      return "Supplier interoperability route";
    case "nhsmail_shared_mailbox":
      return "NHSmail shared mailbox";
    case "mesh":
      return "MESH secure mailbox";
    case "manual_assisted_dispatch":
      return "Manual assisted dispatch";
  }
}

function toneForAcceptanceState(
  state: DispatchTransportAcceptanceState,
): DispatchSurfaceTone {
  switch (state) {
    case "accepted":
      return "ready";
    case "none":
    case "timed_out":
      return "pending";
    case "rejected":
    case "disputed":
      return "blocked";
  }
}

function toneForProofState(
  state: DispatchProofState,
  riskState: DispatchRiskState,
): DispatchSurfaceTone {
  if (state === "satisfied") {
    return "ready";
  }
  if (state === "disputed" || state === "expired" || riskState === "likely_failed") {
    return "blocked";
  }
  if (riskState === "at_risk") {
    return "watch";
  }
  return "pending";
}

function formatAcceptanceValue(state: DispatchTransportAcceptanceState): string {
  switch (state) {
    case "accepted":
      return "Accepted";
    case "none":
      return "Not yet received";
    case "timed_out":
      return "Timed out";
    case "rejected":
      return "Rejected";
    case "disputed":
      return "Disputed";
  }
}

function formatProofValue(state: DispatchProofState): string {
  switch (state) {
    case "satisfied":
      return "Authoritative proof satisfied";
    case "pending":
      return "Still being confirmed";
    case "disputed":
      return "Proof disputed";
    case "expired":
      return "Proof deadline passed";
  }
}

function formatProofRiskLabel(riskState: DispatchRiskState): string {
  switch (riskState) {
    case "on_track":
      return "On track";
    case "at_risk":
      return "At risk";
    case "likely_failed":
      return "Likely failed";
    case "disputed":
      return "Disputed";
  }
}

function makeTruthBinding(input: {
  pharmacyCaseId: string;
  providerId: string;
  packageId: string;
  packageHash: string;
  transportMode: PharmacyTransportMode;
  transportAcceptanceState: DispatchTransportAcceptanceState;
  providerAcceptanceState: DispatchTransportAcceptanceState;
  authoritativeProofState: DispatchProofState;
  proofRiskState: DispatchRiskState;
  proofDeadlineAt: string;
  continuityEvidenceRef: string;
  computedAt: string;
}): PharmacyDispatchTruthBinding {
  return {
    pharmacyDispatchTruthProjectionId: `dispatch_truth_${input.pharmacyCaseId}`,
    dispatchAttemptRef: makeRef(
      "PharmacyDispatchAttempt",
      `dispatch_attempt_${input.pharmacyCaseId}`,
      TASK_343,
    ),
    dispatchPlanRef: makeRef(
      "PharmacyDispatchPlan",
      `dispatch_plan_${input.pharmacyCaseId}`,
      TASK_343,
    ),
    selectedProviderRef: makeRef("PharmacyProvider", input.providerId, TASK_343),
    packageId: input.packageId,
    packageHash: input.packageHash,
    transportMode: input.transportMode,
    dispatchPlanHash: stableHash(`plan::${input.pharmacyCaseId}`),
    transportAcceptanceState: input.transportAcceptanceState,
    providerAcceptanceState: input.providerAcceptanceState,
    authoritativeProofState: input.authoritativeProofState,
    proofRiskState: input.proofRiskState,
    proofDeadlineAt: input.proofDeadlineAt,
    continuityEvidenceRef: input.continuityEvidenceRef,
    computedAt: input.computedAt,
  };
}

function makeConsentBinding(input: {
  pharmacyCaseId: string;
  providerId: string;
  pathwayOrLane: PharmacyPathwayCode;
  referralScope: string;
  selectionBindingHash: string;
  packageFingerprint: string | null;
  checkpointState: PharmacyConsentCheckpoint["checkpointState"];
  continuityState: PharmacyConsentCheckpoint["continuityState"];
  evaluatedAt: string;
}): PharmacyConsentCheckpointBinding {
  return {
    pharmacyConsentCheckpointId: `consent_checkpoint_${input.pharmacyCaseId}`,
    providerRef: makeRef("PharmacyProvider", input.providerId, TASK_343),
    pathwayOrLane: input.pathwayOrLane,
    referralScope: input.referralScope,
    selectionBindingHash: input.selectionBindingHash,
    packageFingerprint: input.packageFingerprint,
    checkpointState: input.checkpointState,
    continuityState: input.continuityState,
    evaluatedAt: input.evaluatedAt,
  };
}

function makePackageBinding(input: {
  pharmacyCaseId: string;
  providerId: string;
  packageId: string;
  packageFingerprint: string;
  packageHash: string;
  requestLineageSummary: string;
  sourcePracticeSummary: string;
  pathwayEvaluationId: string;
  selectionBindingHash: string;
}): PharmacyReferralPackageBinding {
  return {
    packageId: input.packageId,
    providerRef: makeRef("PharmacyProvider", input.providerId, TASK_343),
    pathwayRef: makeRef("PathwayEligibilityEvaluation", input.pathwayEvaluationId, TASK_342),
    selectionBindingHash: input.selectionBindingHash,
    packageFingerprint: input.packageFingerprint,
    packageHash: input.packageHash,
    packageState: "frozen",
    sourcePracticeSummary: input.sourcePracticeSummary,
    requestLineageSummary: input.requestLineageSummary,
    visibilityPolicyRef: "minimum_necessary::pharmacy_referral_v1",
    minimumNecessaryContractRef: "mn_contract::pharmacy_referral_v1",
  };
}

function makePlanBinding(input: {
  pharmacyCaseId: string;
  providerId: string;
  packageId: string;
  transportMode: PharmacyTransportMode;
  artifactManifestId: string;
  plannedAt: string;
}): PharmacyDispatchPlanBinding {
  return {
    dispatchPlanId: `dispatch_plan_${input.pharmacyCaseId}`,
    packageId: input.packageId,
    providerRef: makeRef("PharmacyProvider", input.providerId, TASK_343),
    transportMode: input.transportMode,
    artifactManifestRef: makeRef(
      "ReferralArtifactManifest",
      input.artifactManifestId,
      TASK_343,
    ),
    dispatchPlanHash: stableHash(`plan::${input.pharmacyCaseId}`),
    planState: "planned",
    plannedAt: input.plannedAt,
  };
}

function makeProofEnvelopeBinding(input: {
  pharmacyCaseId: string;
  proofDeadlineAt: string;
  authoritativeProofSourceRef: string | null;
  proofState: DispatchProofState;
  riskState: DispatchRiskState;
  verifiedAt: string;
  proofSources: readonly string[];
  transportEvidenceCount: number;
  providerEvidenceCount: number;
  deliveryEvidenceCount: number;
}): DispatchProofEnvelopeBinding {
  return {
    dispatchProofEnvelopeId: `dispatch_proof_${input.pharmacyCaseId}`,
    proofDeadlineAt: input.proofDeadlineAt,
    proofSources: input.proofSources,
    transportAcceptanceEvidenceRefs: Array.from(
      { length: input.transportEvidenceCount },
      (_, index) => `transport_evidence_${input.pharmacyCaseId}_${index + 1}`,
    ),
    providerAcceptanceEvidenceRefs: Array.from(
      { length: input.providerEvidenceCount },
      (_, index) => `provider_evidence_${input.pharmacyCaseId}_${index + 1}`,
    ),
    deliveryEvidenceRefs: Array.from(
      { length: input.deliveryEvidenceCount },
      (_, index) => `delivery_evidence_${input.pharmacyCaseId}_${index + 1}`,
    ),
    authoritativeProofSourceRef: input.authoritativeProofSourceRef,
    proofState: input.proofState,
    riskState: input.riskState,
    verifiedAt: input.verifiedAt,
  };
}

function makeArtifactManifestBinding(input: {
  pharmacyCaseId: string;
  packageId: string;
  includedArtifactRefs: readonly string[];
  redactedArtifactRefs: readonly string[];
  omittedArtifactRefs: readonly string[];
  transformNotesRef: string;
  classificationRef: string;
  compiledAt: string;
}): ReferralArtifactManifestBinding {
  return {
    artifactManifestId: `artifact_manifest_${input.pharmacyCaseId}`,
    packageId: input.packageId,
    includedArtifactRefs: input.includedArtifactRefs,
    redactedArtifactRefs: input.redactedArtifactRefs,
    omittedArtifactRefs: input.omittedArtifactRefs,
    transformNotesRef: input.transformNotesRef,
    classificationRef: input.classificationRef,
    compiledAt: input.compiledAt,
  };
}

function makeRecoveryBinding(input: {
  recoveryOwnerRef: string | null;
  watchWindowState: PharmacyHandoffWatchProjectionSnapshot["watchWindowState"];
  watchWindowEndAt: string | null;
  validationState: PharmacyConsoleContinuityEvidenceProjectionSnapshot["validationState"];
  pendingPosture: PharmacyConsoleContinuityEvidenceProjectionSnapshot["pendingPosture"];
  nextReviewAt: string | null;
}): DispatchRecoveryBinding {
  return {
    recoveryOwnerRef: input.recoveryOwnerRef,
    watchWindowState: input.watchWindowState,
    watchWindowEndAt: input.watchWindowEndAt,
    validationState: input.validationState,
    pendingPosture: input.pendingPosture,
    nextReviewAt: input.nextReviewAt,
  };
}

function buildEvidenceRows(
  truthBinding: PharmacyDispatchTruthBinding,
  proofEnvelopeBinding: DispatchProofEnvelopeBinding,
  recoveryBinding: DispatchRecoveryBinding,
): readonly DispatchEvidenceRowSnapshot[] {
  return [
    {
      rowId: "transport_acceptance",
      label: "Transport acceptance",
      value: formatAcceptanceValue(truthBinding.transportAcceptanceState),
      summary: "What the delivery rail itself has confirmed.",
      detail:
        "This row stays separate from provider acknowledgement and authoritative proof so receipt noise cannot read as a completed referral.",
      tone: toneForAcceptanceState(truthBinding.transportAcceptanceState),
    },
    {
      rowId: "provider_acceptance",
      label: "Provider acceptance",
      value: formatAcceptanceValue(truthBinding.providerAcceptanceState),
      summary: "What the receiving pharmacy has acknowledged so far.",
      detail:
        "Provider acknowledgement can widen the pending explanation, but it may not promote calm referral posture without current authoritative proof.",
      tone: toneForAcceptanceState(truthBinding.providerAcceptanceState),
    },
    {
      rowId: "authoritative_proof",
      label: "Authoritative proof",
      value: formatProofValue(truthBinding.authoritativeProofState),
      summary: `Current risk posture: ${formatProofRiskLabel(truthBinding.proofRiskState)}.`,
      detail: proofEnvelopeBinding.authoritativeProofSourceRef
        ? `Current proof source ${proofEnvelopeBinding.authoritativeProofSourceRef} has been correlated to the active dispatch attempt.`
        : "No current proof source satisfies the active assurance policy for this dispatch attempt.",
      tone: toneForProofState(
        truthBinding.authoritativeProofState,
        truthBinding.proofRiskState,
      ),
    },
    {
      rowId: "proof_deadline",
      label: "Proof deadline",
      value: new Date(truthBinding.proofDeadlineAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/London",
      }),
      summary:
        recoveryBinding.watchWindowEndAt ??
        "The watch window remains open until the current proof deadline closes.",
      detail:
        "When the deadline passes without current proof, the shell must widen pending or repair guidance instead of implying referral success.",
      tone:
        truthBinding.proofRiskState === "at_risk"
          ? "watch"
          : truthBinding.proofRiskState === "likely_failed"
            ? "blocked"
            : "pending",
    },
    {
      rowId: "recovery_owner",
      label: "Current recovery owner",
      value: recoveryBinding.recoveryOwnerRef ?? "No repair owner assigned",
      summary:
        recoveryBinding.validationState === "current"
          ? "Continuity is still current for the active provider, consent tuple, and route family."
          : "Continuity has drifted, so this recovery owner stays visible until the same shell is safe again.",
      detail:
        "Recovery ownership is displayed explicitly so a disputed or drifted referral never looks ownerless or quietly complete.",
      tone: recoveryBinding.recoveryOwnerRef ? "watch" : "pending",
    },
  ];
}

function buildArtifactSummary(
  manifestBinding: ReferralArtifactManifestBinding,
  rows: readonly DispatchArtifactSummaryRowSnapshot[],
): DispatchArtifactSummaryCardSnapshot {
  return {
    title: "Artifact summary",
    summary: `${manifestBinding.includedArtifactRefs.length} included, ${manifestBinding.redactedArtifactRefs.length} redacted, ${manifestBinding.omittedArtifactRefs.length} omitted.`,
    transformNotesLabel: manifestBinding.transformNotesRef,
    classificationLabel: manifestBinding.classificationRef,
    rows,
  };
}

const previews: readonly PharmacyDispatchPreviewSnapshot[] = [
  (() => {
    const packageId = "package_PHC_2048";
    const selectionBindingHash = stableHash("PHC-2048::north-quay");
    const packageFingerprint = stableHash("PHC-2048::package");
    const packageHash = stableHash("PHC-2048::hash");
    const truthBinding = makeTruthBinding({
      pharmacyCaseId: "PHC-2048",
      providerId: "provider_NQ_001",
      packageId,
      packageHash,
      transportMode: "bars_fhir",
      transportAcceptanceState: "accepted",
      providerAcceptanceState: "accepted",
      authoritativeProofState: "satisfied",
      proofRiskState: "on_track",
      proofDeadlineAt: "2026-04-24T14:20:00.000Z",
      continuityEvidenceRef: "continuity_console_PHC_2048",
      computedAt: "2026-04-24T13:54:00.000Z",
    });
    const consentBinding = makeConsentBinding({
      pharmacyCaseId: "PHC-2048",
      providerId: "provider_NQ_001",
      pathwayOrLane: "impetigo_1_plus",
      referralScope: "minor_skin_condition",
      selectionBindingHash,
      packageFingerprint,
      checkpointState: "satisfied",
      continuityState: "current",
      evaluatedAt: "2026-04-24T13:52:00.000Z",
    });
    const packageBinding = makePackageBinding({
      pharmacyCaseId: "PHC-2048",
      providerId: "provider_NQ_001",
      packageId,
      packageFingerprint,
      packageHash,
      requestLineageSummary: "Minor skin condition referral / lineage 2048",
      sourcePracticeSummary: "Riverside Medical Practice",
      pathwayEvaluationId: "eval_PHC_2048",
      selectionBindingHash,
    });
    const artifactManifestBinding = makeArtifactManifestBinding({
      pharmacyCaseId: "PHC-2048",
      packageId,
      includedArtifactRefs: [
        "service_request",
        "clinical_summary",
        "patient_summary",
        "consent_record",
      ],
      redactedArtifactRefs: ["contact_preference_masked"],
      omittedArtifactRefs: [],
      transformNotesRef: "masking_transform_v1",
      classificationRef: "routine_pharmacy_referral",
      compiledAt: "2026-04-24T13:50:00.000Z",
    });
    const proofEnvelopeBinding = makeProofEnvelopeBinding({
      pharmacyCaseId: "PHC-2048",
      proofDeadlineAt: truthBinding.proofDeadlineAt,
      authoritativeProofSourceRef: "bars_fhir_receipt_2048",
      proofState: truthBinding.authoritativeProofState,
      riskState: truthBinding.proofRiskState,
      verifiedAt: "2026-04-24T13:54:00.000Z",
      proofSources: ["bars_fhir_receipt", "provider_ack"],
      transportEvidenceCount: 2,
      providerEvidenceCount: 1,
      deliveryEvidenceCount: 1,
    });
    const recoveryBinding = makeRecoveryBinding({
      recoveryOwnerRef: "Handoff lane / North Quay release owner",
      watchWindowState: "completed",
      watchWindowEndAt: "Watch window clear for this confirmed referral.",
      validationState: "current",
      pendingPosture: "calm_confirmed",
      nextReviewAt: null,
    });
    return {
      pharmacyCaseId: "PHC-2048",
      visualMode: PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE,
      surfaceState: "dispatch_confirmed",
      patientCalmAllowed: true,
      selectedAnchorRef: "North Quay Pharmacy",
      chosenPharmacy: {
        requestLineageLabel: "Minor skin condition referral / lineage 2048",
        providerLabel: "North Quay Pharmacy",
        providerSummary:
          "The same chosen pharmacy anchor is preserved while the confirmed referral proof and continuity evidence stay current.",
        preservedSelectionLabel: null,
        continuityKey: "pharmacy.patient::PHC-2048::north-quay",
        audienceLabel: "Chosen pharmacy",
        anchorState: "current",
        chips: ["Impetigo pathway", "Consent current", "Proof satisfied"],
      },
      statusStrip: {
        tone: "ready",
        eyebrow: "Dispatch posture",
        title: "Referral proof is current for the active handoff",
        summary:
          "Transport, provider, and authoritative proof are aligned for this dispatch attempt. Calm referral posture is allowed while continuity stays current.",
        statusPill: "Proof satisfied",
        proofDeadlineLabel: "Proof deadline met at 14:20",
        nextStepLabel: "Handoff evidence can stay calm until continuity drifts or new repair work starts.",
        recoveryOwnerLabel: recoveryBinding.recoveryOwnerRef ?? "None",
      },
      evidenceRows: buildEvidenceRows(truthBinding, proofEnvelopeBinding, recoveryBinding),
      artifactSummary: buildArtifactSummary(artifactManifestBinding, [
        {
          artifactRef: "service_request",
          label: "Service request",
          disposition: "included",
          summary: "Included exactly as frozen in the referral package.",
        },
        {
          artifactRef: "patient_summary",
          label: "Patient summary",
          disposition: "included",
          summary: "Included for the active provider and pathway tuple.",
        },
        {
          artifactRef: "contact_preference_masked",
          label: "Contact preference summary",
          disposition: "redacted",
          summary: "Masked to minimum-necessary contact detail before transport.",
        },
      ]),
      patientPendingState: null,
      patientConsentNotice: null,
      continuityWarning: null,
      drawerTitle: "Confirm the referral package and proof posture",
      drawerSummary:
        "Staff can confirm what is being sent, how it is being sent, and why this attempt is allowed to read as a current referral.",
      referralSummary:
        "Stable package freeze for North Quay Pharmacy with current consent, current package fingerprint, and authoritative proof already correlated.",
      pathwayLabel: "Impetigo 1+",
      transportLabel: transportLabel(truthBinding.transportMode),
      truthBinding,
      consentBinding,
      packageBinding,
      dispatchPlanBinding: makePlanBinding({
        pharmacyCaseId: "PHC-2048",
        providerId: "provider_NQ_001",
        packageId,
        transportMode: "bars_fhir",
        artifactManifestId: artifactManifestBinding.artifactManifestId,
        plannedAt: "2026-04-24T13:49:00.000Z",
      }),
      proofEnvelopeBinding,
      artifactManifestBinding,
      recoveryBinding,
    } satisfies PharmacyDispatchPreviewSnapshot;
  })(),
  (() => {
    const packageId = "package_PHC_2057";
    const selectionBindingHash = stableHash("PHC-2057::harbour");
    const packageFingerprint = stableHash("PHC-2057::package");
    const packageHash = stableHash("PHC-2057::hash");
    const truthBinding = makeTruthBinding({
      pharmacyCaseId: "PHC-2057",
      providerId: "provider_HG_002",
      packageId,
      packageHash,
      transportMode: "mesh",
      transportAcceptanceState: "accepted",
      providerAcceptanceState: "none",
      authoritativeProofState: "pending",
      proofRiskState: "at_risk",
      proofDeadlineAt: "2026-04-24T14:38:00.000Z",
      continuityEvidenceRef: "continuity_console_PHC_2057",
      computedAt: "2026-04-24T14:16:00.000Z",
    });
    const consentBinding = makeConsentBinding({
      pharmacyCaseId: "PHC-2057",
      providerId: "provider_HG_002",
      pathwayOrLane: "acute_sore_throat_5_plus",
      referralScope: "acute_cough_treatment",
      selectionBindingHash,
      packageFingerprint,
      checkpointState: "satisfied",
      continuityState: "current",
      evaluatedAt: "2026-04-24T14:14:00.000Z",
    });
    const packageBinding = makePackageBinding({
      pharmacyCaseId: "PHC-2057",
      providerId: "provider_HG_002",
      packageId,
      packageFingerprint,
      packageHash,
      requestLineageSummary: "Acute cough pathway / lineage 2057",
      sourcePracticeSummary: "Harbour Medical Centre",
      pathwayEvaluationId: "eval_PHC_2057",
      selectionBindingHash,
    });
    const artifactManifestBinding = makeArtifactManifestBinding({
      pharmacyCaseId: "PHC-2057",
      packageId,
      includedArtifactRefs: ["service_request", "clinical_summary", "consent_record"],
      redactedArtifactRefs: ["patient_summary_contact_masked"],
      omittedArtifactRefs: ["nonessential_attachment_preview"],
      transformNotesRef: "minimum_necessary_transform_v2",
      classificationRef: "cough_referral_guarded",
      compiledAt: "2026-04-24T14:10:00.000Z",
    });
    const proofEnvelopeBinding = makeProofEnvelopeBinding({
      pharmacyCaseId: "PHC-2057",
      proofDeadlineAt: truthBinding.proofDeadlineAt,
      authoritativeProofSourceRef: null,
      proofState: truthBinding.authoritativeProofState,
      riskState: truthBinding.proofRiskState,
      verifiedAt: "2026-04-24T14:16:00.000Z",
      proofSources: ["mesh_submission_receipt", "mailbox_delivery_ping"],
      transportEvidenceCount: 1,
      providerEvidenceCount: 0,
      deliveryEvidenceCount: 1,
    });
    const recoveryBinding = makeRecoveryBinding({
      recoveryOwnerRef: "Dispatch watch owner / Harbour queue",
      watchWindowState: "active",
      watchWindowEndAt: "Watch window ends at 14:38.",
      validationState: "current",
      pendingPosture: "at_risk_pending",
      nextReviewAt: "2026-04-24T14:32:00.000Z",
    });
    return {
      pharmacyCaseId: "PHC-2057",
      visualMode: PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE,
      surfaceState: "dispatch_pending",
      patientCalmAllowed: false,
      selectedAnchorRef: "Harbour Pharmacy Group",
      chosenPharmacy: {
        requestLineageLabel: "Acute cough pathway / lineage 2057",
        providerLabel: "Harbour Pharmacy Group",
        providerSummary:
          "The chosen pharmacy stays visible while referral proof is still converging. The patient view keeps the next step calm and non-technical.",
        preservedSelectionLabel: null,
        continuityKey: "pharmacy.patient::PHC-2057::harbour",
        audienceLabel: "Chosen pharmacy",
        anchorState: "current",
        chips: ["Acute sore throat 5+", "Consent current", "Referral still pending"],
      },
      statusStrip: {
        tone: "watch",
        eyebrow: "Dispatch posture",
        title: "Proof is still being confirmed for this referral",
        summary:
          "The delivery rail has accepted the referral, but there is not yet current authoritative proof for the active attempt. Calm referral wording stays blocked.",
        statusPill: "Proof pending",
        proofDeadlineLabel: "Proof deadline 24 Apr 2026, 15:38",
        nextStepLabel: "Keep the chosen pharmacy visible and widen the pending explanation until current proof lands.",
        recoveryOwnerLabel: recoveryBinding.recoveryOwnerRef ?? "No repair owner assigned",
      },
      evidenceRows: buildEvidenceRows(truthBinding, proofEnvelopeBinding, recoveryBinding),
      artifactSummary: buildArtifactSummary(artifactManifestBinding, [
        {
          artifactRef: "service_request",
          label: "Service request",
          disposition: "included",
          summary: "Included for the current provider and pathway.",
        },
        {
          artifactRef: "clinical_summary",
          label: "Clinical summary",
          disposition: "included",
          summary: "Included because it remains within the minimum-necessary scope.",
        },
        {
          artifactRef: "patient_summary_contact_masked",
          label: "Patient summary",
          disposition: "redacted",
          summary: "Contact details are masked before transmission.",
        },
        {
          artifactRef: "nonessential_attachment_preview",
          label: "Attachment preview",
          disposition: "omitted",
          summary: "Omitted because it is not needed for the current handoff.",
        },
      ]),
      patientPendingState: {
        title: "We are still confirming your referral with Harbour Pharmacy Group",
        summary:
          "You do not need to do anything new right now. We are checking that the referral has been accepted in full for your chosen pharmacy.",
        dominantActionLabel: "Check referral status",
        dominantActionRoute: "status",
        nextStepTitle: "What happens next",
        nextStepSummary:
          "We will keep this page aligned to the same pharmacy while we confirm the referral. If anything changes, this shell will explain the change here instead of sending you somewhere new.",
        reassuranceLabel: "Pending confirmation",
      },
      patientConsentNotice: null,
      continuityWarning: null,
      drawerTitle: "Review the current referral package before it can read as confirmed",
      drawerSummary:
        "This drawer keeps transport acceptance, provider acknowledgement, authoritative proof, deadline risk, and recovery ownership on separate evidence lanes.",
      referralSummary:
        "Guarded package freeze for Harbour Pharmacy Group with current consent but incomplete proof for the active MESH route.",
      pathwayLabel: "Acute sore throat 5+",
      transportLabel: transportLabel(truthBinding.transportMode),
      truthBinding,
      consentBinding,
      packageBinding,
      dispatchPlanBinding: makePlanBinding({
        pharmacyCaseId: "PHC-2057",
        providerId: "provider_HG_002",
        packageId,
        transportMode: "mesh",
        artifactManifestId: artifactManifestBinding.artifactManifestId,
        plannedAt: "2026-04-24T14:08:00.000Z",
      }),
      proofEnvelopeBinding,
      artifactManifestBinding,
      recoveryBinding,
    } satisfies PharmacyDispatchPreviewSnapshot;
  })(),
  (() => {
    const packageId = "package_PHC_2090";
    const selectionBindingHash = stableHash("PHC-2090::high-street");
    const packageFingerprint = stableHash("PHC-2090::package");
    const packageHash = stableHash("PHC-2090::hash");
    const truthBinding = makeTruthBinding({
      pharmacyCaseId: "PHC-2090",
      providerId: "provider_HS_003",
      packageId,
      packageHash,
      transportMode: "manual_assisted_dispatch",
      transportAcceptanceState: "none",
      providerAcceptanceState: "none",
      authoritativeProofState: "pending",
      proofRiskState: "likely_failed",
      proofDeadlineAt: "2026-04-24T15:12:00.000Z",
      continuityEvidenceRef: "continuity_console_PHC_2090",
      computedAt: "2026-04-24T14:40:00.000Z",
    });
    const consentBinding = makeConsentBinding({
      pharmacyCaseId: "PHC-2090",
      providerId: "provider_HS_003",
      pathwayOrLane: "acute_sinusitis_12_plus",
      referralScope: "allergy_advice_pathway",
      selectionBindingHash,
      packageFingerprint,
      checkpointState: "withdrawal_reconciliation",
      continuityState: "blocked",
      evaluatedAt: "2026-04-24T14:39:00.000Z",
    });
    const packageBinding = makePackageBinding({
      pharmacyCaseId: "PHC-2090",
      providerId: "provider_HS_003",
      packageId,
      packageFingerprint,
      packageHash,
      requestLineageSummary: "Clarification required / lineage 2090",
      sourcePracticeSummary: "High Street Health Partnership",
      pathwayEvaluationId: "eval_PHC_2090",
      selectionBindingHash,
    });
    const artifactManifestBinding = makeArtifactManifestBinding({
      pharmacyCaseId: "PHC-2090",
      packageId,
      includedArtifactRefs: ["clinical_summary", "advice_note"],
      redactedArtifactRefs: ["contact_route_masked"],
      omittedArtifactRefs: ["service_request_pending_clarification"],
      transformNotesRef: "clarification_hold_transform_v1",
      classificationRef: "clarification_hold",
      compiledAt: "2026-04-24T14:37:00.000Z",
    });
    const proofEnvelopeBinding = makeProofEnvelopeBinding({
      pharmacyCaseId: "PHC-2090",
      proofDeadlineAt: truthBinding.proofDeadlineAt,
      authoritativeProofSourceRef: null,
      proofState: truthBinding.authoritativeProofState,
      riskState: truthBinding.proofRiskState,
      verifiedAt: "2026-04-24T14:40:00.000Z",
      proofSources: ["clarification_hold"],
      transportEvidenceCount: 0,
      providerEvidenceCount: 0,
      deliveryEvidenceCount: 0,
    });
    const recoveryBinding = makeRecoveryBinding({
      recoveryOwnerRef: "Consent clarification owner / High Street queue",
      watchWindowState: "blocked",
      watchWindowEndAt: "Clarification deadline has breached and needs manual recovery.",
      validationState: "blocked",
      pendingPosture: "recovery_required",
      nextReviewAt: "2026-04-24T14:52:00.000Z",
    });
    return {
      pharmacyCaseId: "PHC-2090",
      visualMode: PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE,
      surfaceState: "consent_blocked",
      patientCalmAllowed: false,
      selectedAnchorRef: "High Street Pharmacy",
      chosenPharmacy: {
        requestLineageLabel: "Clarification required / lineage 2090",
        providerLabel: "High Street Pharmacy",
        providerSummary:
          "The last chosen pharmacy remains visible even while consent or continuity drift blocks further dispatch.",
        preservedSelectionLabel: null,
        continuityKey: "pharmacy.patient::PHC-2090::high-street",
        audienceLabel: "Chosen pharmacy",
        anchorState: "read_only",
        chips: ["Clarification required", "Consent blocked", "Recovery owned"],
      },
      statusStrip: {
        tone: "blocked",
        eyebrow: "Dispatch posture",
        title: "Dispatch is paused because the consent checkpoint is no longer current",
        summary:
          "The current provider selection remains visible, but the referral package and proof chain cannot progress until the checkpoint is renewed or reconciled.",
        statusPill: "Consent blocked",
        proofDeadlineLabel: "Clarification deadline breached",
        nextStepLabel: "Promote consent renewal or withdrawal reconciliation in the same shell.",
        recoveryOwnerLabel: recoveryBinding.recoveryOwnerRef ?? "No repair owner assigned",
      },
      evidenceRows: buildEvidenceRows(truthBinding, proofEnvelopeBinding, recoveryBinding),
      artifactSummary: buildArtifactSummary(artifactManifestBinding, [
        {
          artifactRef: "clinical_summary",
          label: "Clinical summary",
          disposition: "included",
          summary: "Still visible to support clarification work.",
        },
        {
          artifactRef: "contact_route_masked",
          label: "Contact route",
          disposition: "redacted",
          summary: "Masked while the clarification path is active.",
        },
        {
          artifactRef: "service_request_pending_clarification",
          label: "Service request",
          disposition: "omitted",
          summary: "Omitted until consent renewal or reconciliation settles.",
        },
      ]),
      patientPendingState: {
        title: "Your chosen pharmacy is still shown while we sort out the next step",
        summary:
          "We are holding the referral safely in place. You should not need to repeat your choice unless we ask you to review it here.",
        dominantActionLabel: "Review this checkpoint",
        dominantActionRoute: "instructions",
        nextStepTitle: "What happens next",
        nextStepSummary:
          "This request will stay attached to the same pharmacy card while the checkpoint is renewed or withdrawn safely.",
        reassuranceLabel: "Paused safely",
      },
      patientConsentNotice: {
        title: "This referral is paused until the consent checkpoint is current again",
        summary:
          "We are keeping your chosen pharmacy in view, but we cannot move the referral on until the current confirmation step is valid again.",
        actionLabel: "Review the chosen pharmacy",
        actionRoute: "choose",
        blockingReasonLabel: "Consent checkpoint blocked",
      },
      continuityWarning: {
        kind: "consent_drift",
        tone: "blocked",
        title: "Consent changed after this pharmacy was chosen",
        summary:
          "The previous confirmation no longer matches the active provider or referral scope, so the shell stays paused and read-only.",
        actionLabel: "Return to the chosen pharmacy step",
      },
      drawerTitle: "Review why this referral is paused before any redispatch is attempted",
      drawerSummary:
        "Current consent drift is shown explicitly. The shell keeps the chosen pharmacy anchor and the last safe package summary visible while the clarification owner resolves the blocker.",
      referralSummary:
        "Clarification hold for High Street Pharmacy with consent drift blocking the current package and any new dispatch attempt.",
      pathwayLabel: "Acute sinusitis 12+",
      transportLabel: transportLabel(truthBinding.transportMode),
      truthBinding,
      consentBinding,
      packageBinding,
      dispatchPlanBinding: makePlanBinding({
        pharmacyCaseId: "PHC-2090",
        providerId: "provider_HS_003",
        packageId,
        transportMode: "manual_assisted_dispatch",
        artifactManifestId: artifactManifestBinding.artifactManifestId,
        plannedAt: "2026-04-24T14:34:00.000Z",
      }),
      proofEnvelopeBinding,
      artifactManifestBinding,
      recoveryBinding,
    } satisfies PharmacyDispatchPreviewSnapshot;
  })(),
  (() => {
    const packageId = "package_PHC_2148";
    const selectionBindingHash = stableHash("PHC-2148::market-square");
    const packageFingerprint = stableHash("PHC-2148::package");
    const packageHash = stableHash("PHC-2148::hash");
    const truthBinding = makeTruthBinding({
      pharmacyCaseId: "PHC-2148",
      providerId: "provider_MS_004",
      packageId,
      packageHash,
      transportMode: "supplier_interop",
      transportAcceptanceState: "none",
      providerAcceptanceState: "none",
      authoritativeProofState: "pending",
      proofRiskState: "on_track",
      proofDeadlineAt: "2026-04-24T16:00:00.000Z",
      continuityEvidenceRef: "continuity_patient_PHC_2148",
      computedAt: "2026-04-24T14:45:00.000Z",
    });
    const consentBinding = makeConsentBinding({
      pharmacyCaseId: "PHC-2148",
      providerId: "provider_MS_004",
      pathwayOrLane: "acute_sore_throat_5_plus",
      referralScope: "warned_choice_acknowledgement",
      selectionBindingHash,
      packageFingerprint,
      checkpointState: "missing",
      continuityState: "blocked",
      evaluatedAt: "2026-04-24T14:44:00.000Z",
    });
    const packageBinding = makePackageBinding({
      pharmacyCaseId: "PHC-2148",
      providerId: "provider_MS_004",
      packageId,
      packageFingerprint,
      packageHash,
      requestLineageSummary: "Same-day sore throat referral / lineage 2148",
      sourcePracticeSummary: "Market Square Practice",
      pathwayEvaluationId: "eval_PHC_2148",
      selectionBindingHash,
    });
    const artifactManifestBinding = makeArtifactManifestBinding({
      pharmacyCaseId: "PHC-2148",
      packageId,
      includedArtifactRefs: ["clinical_summary", "service_request_pending_ack"],
      redactedArtifactRefs: [],
      omittedArtifactRefs: ["dispatch_payload_unreleased"],
      transformNotesRef: "warning_ack_hold_v1",
      classificationRef: "warned_choice_pending_ack",
      compiledAt: "2026-04-24T14:43:00.000Z",
    });
    const proofEnvelopeBinding = makeProofEnvelopeBinding({
      pharmacyCaseId: "PHC-2148",
      proofDeadlineAt: truthBinding.proofDeadlineAt,
      authoritativeProofSourceRef: null,
      proofState: truthBinding.authoritativeProofState,
      riskState: truthBinding.proofRiskState,
      verifiedAt: "2026-04-24T14:45:00.000Z",
      proofSources: ["waiting_for_warning_acknowledgement"],
      transportEvidenceCount: 0,
      providerEvidenceCount: 0,
      deliveryEvidenceCount: 0,
    });
    const recoveryBinding = makeRecoveryBinding({
      recoveryOwnerRef: "Patient acknowledgement step / chosen-pharmacy shell",
      watchWindowState: "active",
      watchWindowEndAt: "Awaiting warning acknowledgement before dispatch can start.",
      validationState: "blocked",
      pendingPosture: "recovery_required",
      nextReviewAt: null,
    });
    return {
      pharmacyCaseId: "PHC-2148",
      visualMode: PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE,
      surfaceState: "consent_blocked",
      patientCalmAllowed: false,
      selectedAnchorRef: "Market Square Pharmacy",
      chosenPharmacy: {
        requestLineageLabel: "Same-day sore throat referral / lineage 2148",
        providerLabel: "Market Square Pharmacy",
        providerSummary:
          "This pharmacy remains selected, but the referral cannot move on until the current acknowledgement step is completed.",
        preservedSelectionLabel: null,
        continuityKey: "pharmacy.patient::PHC-2148::market-square",
        audienceLabel: "Chosen pharmacy",
        anchorState: "current",
        chips: ["Warned choice", "Acknowledgement needed", "Referral paused"],
      },
      statusStrip: {
        tone: "blocked",
        eyebrow: "Current checkpoint",
        title: "The referral is waiting for this pharmacy choice to be confirmed",
        summary:
          "Your chosen pharmacy is still current. We are holding the referral safely here until the acknowledgement step is complete.",
        statusPill: "Waiting for confirmation",
        proofDeadlineLabel: "No dispatch has started yet",
        nextStepLabel: "Return to the chosen pharmacy step to review or change the selection.",
        recoveryOwnerLabel: recoveryBinding.recoveryOwnerRef ?? "No repair owner assigned",
      },
      evidenceRows: buildEvidenceRows(truthBinding, proofEnvelopeBinding, recoveryBinding),
      artifactSummary: buildArtifactSummary(artifactManifestBinding, [
        {
          artifactRef: "clinical_summary",
          label: "Clinical summary",
          disposition: "included",
          summary: "Ready for dispatch once the checkpoint is current.",
        },
        {
          artifactRef: "dispatch_payload_unreleased",
          label: "Dispatch payload",
          disposition: "omitted",
          summary: "Held back until the acknowledgement step is complete.",
        },
      ]),
      patientPendingState: {
        title: "Your chosen pharmacy is being kept in place",
        summary:
          "Nothing new has been sent yet. We are keeping the same pharmacy visible while the current confirmation step is completed.",
        dominantActionLabel: "Review the chosen pharmacy",
        dominantActionRoute: "choose",
        nextStepTitle: "What happens next",
        nextStepSummary:
          "After you confirm or change this pharmacy here, the referral can move to the next step without losing the same shell or request anchor.",
        reassuranceLabel: "Paused before dispatch",
      },
      patientConsentNotice: {
        title: "You still need to confirm this pharmacy choice",
        summary:
          "We have kept your chosen pharmacy card on screen so you can review it without losing your place. The referral will stay paused until that confirmation is current.",
        actionLabel: "Go back to the chosen pharmacy",
        actionRoute: "choose",
        blockingReasonLabel: "Pharmacy confirmation needed",
      },
      continuityWarning: null,
      drawerTitle: "Review the paused referral package for this warned choice",
      drawerSummary:
        "The provider stays selected, but no transport or provider proof lane may advance until the warned choice acknowledgement is satisfied.",
      referralSummary:
        "Warned-choice hold for Market Square Pharmacy; package is frozen but not yet dispatchable.",
      pathwayLabel: "Acute sore throat 5+",
      transportLabel: transportLabel(truthBinding.transportMode),
      truthBinding,
      consentBinding,
      packageBinding,
      dispatchPlanBinding: makePlanBinding({
        pharmacyCaseId: "PHC-2148",
        providerId: "provider_MS_004",
        packageId,
        transportMode: "supplier_interop",
        artifactManifestId: artifactManifestBinding.artifactManifestId,
        plannedAt: "2026-04-24T14:42:00.000Z",
      }),
      proofEnvelopeBinding,
      artifactManifestBinding,
      recoveryBinding,
    } satisfies PharmacyDispatchPreviewSnapshot;
  })(),
  (() => {
    const packageId = "package_PHC_2156";
    const selectionBindingHash = stableHash("PHC-2156::hilltop-current");
    const packageFingerprint = stableHash("PHC-2156::package");
    const packageHash = stableHash("PHC-2156::hash");
    const truthBinding = makeTruthBinding({
      pharmacyCaseId: "PHC-2156",
      providerId: "provider_HT_005",
      packageId,
      packageHash,
      transportMode: "mesh",
      transportAcceptanceState: "accepted",
      providerAcceptanceState: "none",
      authoritativeProofState: "pending",
      proofRiskState: "at_risk",
      proofDeadlineAt: "2026-04-24T15:22:00.000Z",
      continuityEvidenceRef: "continuity_patient_PHC_2156",
      computedAt: "2026-04-24T14:58:00.000Z",
    });
    const consentBinding = makeConsentBinding({
      pharmacyCaseId: "PHC-2156",
      providerId: "provider_HT_005",
      pathwayOrLane: "acute_otitis_media_1_17",
      referralScope: "provider_refresh_review",
      selectionBindingHash,
      packageFingerprint,
      checkpointState: "satisfied",
      continuityState: "stale",
      evaluatedAt: "2026-04-24T14:57:00.000Z",
    });
    const packageBinding = makePackageBinding({
      pharmacyCaseId: "PHC-2156",
      providerId: "provider_HT_005",
      packageId,
      packageFingerprint,
      packageHash,
      requestLineageSummary: "Provider refresh review / lineage 2156",
      sourcePracticeSummary: "Hilltop Practice",
      pathwayEvaluationId: "eval_PHC_2156",
      selectionBindingHash,
    });
    const artifactManifestBinding = makeArtifactManifestBinding({
      pharmacyCaseId: "PHC-2156",
      packageId,
      includedArtifactRefs: ["service_request", "clinical_summary"],
      redactedArtifactRefs: ["contact_preference_masked"],
      omittedArtifactRefs: [],
      transformNotesRef: "provider_refresh_masking_v1",
      classificationRef: "refresh_review",
      compiledAt: "2026-04-24T14:56:00.000Z",
    });
    const proofEnvelopeBinding = makeProofEnvelopeBinding({
      pharmacyCaseId: "PHC-2156",
      proofDeadlineAt: truthBinding.proofDeadlineAt,
      authoritativeProofSourceRef: null,
      proofState: truthBinding.authoritativeProofState,
      riskState: truthBinding.proofRiskState,
      verifiedAt: "2026-04-24T14:58:00.000Z",
      proofSources: ["mesh_submission_receipt", "refreshed_choice_set_notice"],
      transportEvidenceCount: 1,
      providerEvidenceCount: 0,
      deliveryEvidenceCount: 1,
    });
    const recoveryBinding = makeRecoveryBinding({
      recoveryOwnerRef: "Choice refresh owner / patient pharmacy shell",
      watchWindowState: "active",
      watchWindowEndAt: "Refresh review remains open until a current anchor is confirmed.",
      validationState: "stale",
      pendingPosture: "at_risk_pending",
      nextReviewAt: "2026-04-24T15:08:00.000Z",
    });
    return {
      pharmacyCaseId: "PHC-2156",
      visualMode: PHARMACY_DISPATCH_ASSURANCE_VISUAL_MODE,
      surfaceState: "continuity_drift",
      patientCalmAllowed: false,
      selectedAnchorRef: "Hilltop Pharmacy (current proof)",
      chosenPharmacy: {
        requestLineageLabel: "Provider refresh review / lineage 2156",
        providerLabel: "Hilltop Pharmacy (current proof)",
        providerSummary:
          "The current proof has changed. The previous pharmacy is preserved as read-only provenance until a current anchor is confirmed.",
        preservedSelectionLabel: "Hilltop Pharmacy (previous)",
        continuityKey: "pharmacy.patient::PHC-2156::proof-refresh",
        audienceLabel: "Chosen pharmacy",
        anchorState: "stale",
        chips: ["Choice proof changed", "Read-only provenance", "Review needed"],
      },
      statusStrip: {
        tone: "watch",
        eyebrow: "Continuity posture",
        title: "This referral needs a current pharmacy anchor before it can settle",
        summary:
          "Earlier choice proof is preserved for context, but it cannot support calm referral copy until the current anchor and continuity evidence agree again.",
        statusPill: "Continuity drift",
        proofDeadlineLabel: "Proof deadline 24 Apr 2026, 16:22",
        nextStepLabel: "Review the refreshed pharmacy choice or continue in read-only posture until it is current again.",
        recoveryOwnerLabel: recoveryBinding.recoveryOwnerRef ?? "No repair owner assigned",
      },
      evidenceRows: buildEvidenceRows(truthBinding, proofEnvelopeBinding, recoveryBinding),
      artifactSummary: buildArtifactSummary(artifactManifestBinding, [
        {
          artifactRef: "service_request",
          label: "Service request",
          disposition: "included",
          summary: "Still bound to the current provider proof.",
        },
        {
          artifactRef: "contact_preference_masked",
          label: "Contact preference",
          disposition: "redacted",
          summary: "Still masked in the same way while the anchor is reviewed.",
        },
      ]),
      patientPendingState: {
        title: "We are keeping your referral safe while the pharmacy choice is refreshed",
        summary:
          "The earlier pharmacy you saw is still shown for context, but we need a current match before this referral can read as confirmed.",
        dominantActionLabel: "Review the updated pharmacy choice",
        dominantActionRoute: "choose",
        nextStepTitle: "What happens next",
        nextStepSummary:
          "You can review the updated choice set in the same shell. Until then, this page stays read-only and keeps the previous selection visible as provenance.",
        reassuranceLabel: "Read-only review",
      },
      patientConsentNotice: null,
      continuityWarning: {
        kind: "anchor_drift",
        tone: "watch",
        title: "The earlier pharmacy choice is no longer the current anchor",
        summary:
          "We have kept the previous selection visible so you do not lose context, but it is now provenance only and cannot support calm referral reassurance.",
        actionLabel: "Review the updated pharmacy list",
      },
      drawerTitle: "Review the refreshed choice and current dispatch tuple",
      drawerSummary:
        "This drawer keeps the previous anchor visible as provenance while showing the current package, proof, and continuity tuple that now govern the referral.",
      referralSummary:
        "Refreshed choice proof for Hilltop Pharmacy with continuity drift widening the patient shell into read-only posture.",
      pathwayLabel: "Acute otitis media 1-17",
      transportLabel: transportLabel(truthBinding.transportMode),
      truthBinding,
      consentBinding,
      packageBinding,
      dispatchPlanBinding: makePlanBinding({
        pharmacyCaseId: "PHC-2156",
        providerId: "provider_HT_005",
        packageId,
        transportMode: "mesh",
        artifactManifestId: artifactManifestBinding.artifactManifestId,
        plannedAt: "2026-04-24T14:55:00.000Z",
      }),
      proofEnvelopeBinding,
      artifactManifestBinding,
      recoveryBinding,
    } satisfies PharmacyDispatchPreviewSnapshot;
  })(),
];

const previewMap = new Map(previews.map((preview) => [preview.pharmacyCaseId, preview] as const));

export function resolvePharmacyDispatchPreview(
  pharmacyCaseId: string | null | undefined,
): PharmacyDispatchPreviewSnapshot | null {
  return previewMap.get(pharmacyCaseId ?? "") ?? null;
}
