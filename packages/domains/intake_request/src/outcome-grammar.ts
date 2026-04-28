import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RequestBackboneInvariantError } from "../../../domain-kernel/src/index";

function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) {
    throw new RequestBackboneInvariantError(code, message);
  }
}

function requireRef(value: string | null | undefined, field: string): string {
  invariant(
    typeof value === "string" && value.trim().length > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} is required.`,
  );
  return value.trim();
}

function optionalRef(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function addMinutes(timestamp: string, minutes: number): string {
  return new Date(Date.parse(timestamp) + minutes * 60_000).toISOString();
}

function addDays(timestamp: string, days: number): string {
  return new Date(Date.parse(timestamp) + days * 24 * 60_000 * 60).toISOString();
}

function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (true) {
    if (existsSync(join(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = dirname(current);
    invariant(parent !== current, "REPO_ROOT_NOT_FOUND", "Could not locate repository root.");
    current = parent;
  }
}

const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

function readJsonArtifact<TValue>(relativePath: string): TValue {
  const absolutePath = join(REPO_ROOT, relativePath);
  invariant(existsSync(absolutePath), "MISSING_PHASE1_OUTCOME_ARTIFACT", `Missing ${relativePath}.`);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as TValue;
}

export type Phase1OutcomeGrammarResult =
  | "urgent_diversion"
  | "triage_ready"
  | "stale_recoverable"
  | "failed_safe"
  | "denied_scope";

export type Phase1OutcomeAppliedState =
  | "screen_clear"
  | "residual_risk_flagged"
  | "urgent_diversion_required"
  | "urgent_diverted"
  | "processing_failed"
  | "stale_recoverable"
  | "denied_scope";

export type PatientReceiptBucket =
  | "same_day"
  | "next_working_day"
  | "within_2_working_days"
  | "after_2_working_days";

export type PatientReceiptPromiseState =
  | "on_track"
  | "improved"
  | "at_risk"
  | "revised_downward"
  | "recovery_required";

export type IntakeOutcomeVisibilityTier =
  | "public_safe_summary"
  | "public_recovery_summary"
  | "grant_scoped_summary"
  | "authenticated_summary";

export type IntakeOutcomeArtifactState =
  | "summary_only"
  | "inline_renderable"
  | "external_handoff_ready"
  | "recovery_only";

export type OutcomeNavigationDestinationType =
  | "external_browser"
  | "browser_overlay"
  | "cross_app"
  | "phone_dialer";

interface Phase1OutcomeCopyContractArtifact {
  outcomeCopyContractId: string;
  copyFamilies: Array<{
    outcomeFamily: string;
    deckId: string;
    artifactPresentationContractRef: string;
    outboundNavigationGrantPolicyRef: string;
    routePattern: string;
    variants: Array<{
      variantRef: string;
      appliesToState: string;
      summarySafetyTier: string;
      submitResult: string;
      requiresUrgentSettlementIssued?: boolean;
      focusTarget: string;
      primaryAction: { actionId: string; label: string };
      secondaryAction?: { actionId: string; label: string };
      title: string;
      summary: string;
    }>;
  }>;
}

export const phase1OutcomeCopyContract = readJsonArtifact<Phase1OutcomeCopyContractArtifact>(
  "data/contracts/142_outcome_copy_contract.json",
);

export const phase1OutcomeGrammarContractRef = "OGC_151_PHASE1_OUTCOME_GRAMMAR_V1";
export const phase1ReceiptEnvelopeCalibrationRef =
  "GAP_RESOLVED_RECEIPT_GRAMMAR_OBJECTS_151_V1";
export const phase1ReceiptEtaPromiseRef = "ETA_151_CONSERVATIVE_AFTER_2_WORKING_DAYS_V1";

export interface Phase1OutcomeVariantDefinition {
  outcomeFamily: string;
  deckId: string;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  routePattern: string;
  variantRef: string;
  appliesToState: Phase1OutcomeAppliedState;
  submitResult: Phase1OutcomeGrammarResult;
  summarySafetyTier:
    | "routine_clear"
    | "routine_recovery"
    | "urgent_diversion_required"
    | "residual_risk_flagged"
    | "processing_failed";
  focusTarget: string;
  primaryActionId: string;
  primaryActionLabel: string;
  secondaryActionId: string | null;
  secondaryActionLabel: string | null;
  placeholderContractRef: string;
  surfaceRouteContractRef: string;
  visibilityTier: IntakeOutcomeVisibilityTier;
  artifactState: IntakeOutcomeArtifactState;
}

function contractVariant(
  familyId: string,
  variantId: string,
  options: {
    placeholderContractRef: string;
    surfaceRouteContractRef: string;
    visibilityTier: IntakeOutcomeVisibilityTier;
    artifactState: IntakeOutcomeArtifactState;
  },
): Phase1OutcomeVariantDefinition {
  const family = phase1OutcomeCopyContract.copyFamilies.find(
    (candidate) => candidate.outcomeFamily === familyId,
  );
  invariant(!!family, "OUTCOME_COPY_FAMILY_MISSING", `Missing outcome family ${familyId}.`);
  const variant = family.variants.find((candidate) => candidate.variantRef === variantId);
  invariant(!!variant, "OUTCOME_COPY_VARIANT_MISSING", `Missing outcome variant ${variantId}.`);
  return {
    outcomeFamily: family.outcomeFamily,
    deckId: family.deckId,
    artifactPresentationContractRef: family.artifactPresentationContractRef,
    outboundNavigationGrantPolicyRef: family.outboundNavigationGrantPolicyRef,
    routePattern: family.routePattern,
    variantRef: variant.variantRef,
    appliesToState: variant.appliesToState as Phase1OutcomeAppliedState,
    submitResult: variant.submitResult as Phase1OutcomeGrammarResult,
    summarySafetyTier: variant.summarySafetyTier as Phase1OutcomeVariantDefinition["summarySafetyTier"],
    focusTarget: variant.focusTarget,
    primaryActionId: variant.primaryAction.actionId,
    primaryActionLabel: variant.primaryAction.label,
    secondaryActionId: variant.secondaryAction?.actionId ?? null,
    secondaryActionLabel: variant.secondaryAction?.label ?? null,
    placeholderContractRef: options.placeholderContractRef,
    surfaceRouteContractRef: options.surfaceRouteContractRef,
    visibilityTier: options.visibilityTier,
    artifactState: options.artifactState,
  };
}

const staleRecoverableVariant: Phase1OutcomeVariantDefinition = {
  outcomeFamily: "stale_recoverable",
  deckId: "stale_recovery",
  artifactPresentationContractRef: "APC_151_STALE_RECOVERY_V1",
  outboundNavigationGrantPolicyRef: "ONG_151_STALE_RECOVERY_V1",
  routePattern: "/intake/drafts/:draftPublicId/recovery",
  variantRef: "COPYVAR_151_STALE_RECOVERABLE_V1",
  appliesToState: "stale_recoverable",
  submitResult: "stale_recoverable",
  summarySafetyTier: "routine_recovery",
  focusTarget: "primary_action",
  primaryActionId: "resume_saved_draft",
  primaryActionLabel: "Resume this draft",
  secondaryActionId: "review_saved_answers",
  secondaryActionLabel: "Review saved answers",
  placeholderContractRef: "PHC_139_STALE_RECOVERY_SUMMARY_V1",
  surfaceRouteContractRef: "ISRC_151_INTAKE_RECOVERY_OUTCOME_V1",
  visibilityTier: "public_recovery_summary",
  artifactState: "recovery_only",
};

const deniedScopeVariant: Phase1OutcomeVariantDefinition = {
  outcomeFamily: "denied_scope",
  deckId: "scope_boundary",
  artifactPresentationContractRef: "APC_151_DENIED_SCOPE_V1",
  outboundNavigationGrantPolicyRef: "ONG_151_DENIED_SCOPE_V1",
  routePattern: "/intake/drafts/:draftPublicId/recovery",
  variantRef: "COPYVAR_151_DENIED_SCOPE_V1",
  appliesToState: "denied_scope",
  submitResult: "denied_scope",
  summarySafetyTier: "routine_recovery",
  focusTarget: "primary_action",
  primaryActionId: "return_to_supported_entry",
  primaryActionLabel: "Use a supported route",
  secondaryActionId: "review_boundary_reason",
  secondaryActionLabel: "See why this path is blocked",
  placeholderContractRef: "PHC_151_DENIED_SCOPE_SUMMARY_V1",
  surfaceRouteContractRef: "ISRC_151_INTAKE_DENIED_SCOPE_OUTCOME_V1",
  visibilityTier: "public_recovery_summary",
  artifactState: "recovery_only",
};

export const phase1OutcomeVariants = {
  routineClear: contractVariant("safe_receipt", "COPYVAR_142_SAFE_CLEAR_V1", {
    placeholderContractRef: "PHC_139_RECEIPT_STATUS_SUMMARY_V1",
    surfaceRouteContractRef: "ISRC_151_INTAKE_RECEIPT_OUTCOME_V1",
    visibilityTier: "public_safe_summary",
    artifactState: "inline_renderable",
  }),
  routineResidual: contractVariant("safe_receipt", "COPYVAR_142_SAFE_REVIEW_V1", {
    placeholderContractRef: "PHC_139_RECEIPT_STATUS_SUMMARY_V1",
    surfaceRouteContractRef: "ISRC_151_INTAKE_RECEIPT_OUTCOME_V1",
    visibilityTier: "public_safe_summary",
    artifactState: "inline_renderable",
  }),
  urgentRequired: contractVariant("urgent_diversion", "COPYVAR_142_URGENT_REQUIRED_V1", {
    placeholderContractRef: "PHC_139_URGENT_GUIDANCE_SUMMARY_V1",
    surfaceRouteContractRef: "ISRC_151_INTAKE_URGENT_OUTCOME_V1",
    visibilityTier: "public_safe_summary",
    artifactState: "external_handoff_ready",
  }),
  urgentIssued: contractVariant("urgent_diversion", "COPYVAR_142_URGENT_ISSUED_V1", {
    placeholderContractRef: "PHC_139_URGENT_GUIDANCE_SUMMARY_V1",
    surfaceRouteContractRef: "ISRC_151_INTAKE_URGENT_OUTCOME_V1",
    visibilityTier: "public_safe_summary",
    artifactState: "external_handoff_ready",
  }),
  failedSafe: contractVariant("failed_safe", "COPYVAR_142_FAILED_SAFE_V1", {
    placeholderContractRef: "PHC_139_FAILED_SAFE_SUMMARY_V1",
    surfaceRouteContractRef: "ISRC_151_INTAKE_RECOVERY_OUTCOME_V1",
    visibilityTier: "public_recovery_summary",
    artifactState: "summary_only",
  }),
  staleRecoverable: staleRecoverableVariant,
  deniedScope: deniedScopeVariant,
} as const;

export interface PatientReceiptConsistencyEnvelopeSnapshot {
  receiptEnvelopeSchemaVersion: "PATIENT_RECEIPT_CONSISTENCY_ENVELOPE_V1";
  consistencyEnvelopeId: string;
  requestRef: string | null;
  requestLineageRef: string | null;
  submissionPromotionRecordRef: string | null;
  normalizedSubmissionRef: string | null;
  receiptConsistencyKey: string | null;
  statusConsistencyKey: string | null;
  receiptBucket: PatientReceiptBucket;
  etaPromiseRef: string;
  etaLowerBoundAt: string | null;
  etaMedianAt: string | null;
  etaUpperBoundAt: string | null;
  bucketConfidence: number;
  promiseState: PatientReceiptPromiseState;
  calibrationVersionRef: string;
  statusProjectionVersionRef: string;
  causalToken: string;
  monotoneRevision: number;
  visibilityTier: IntakeOutcomeVisibilityTier;
  issuedAt: string;
  version: number;
}

export interface IntakeOutcomePresentationArtifactSnapshot {
  artifactSchemaVersion: "INTAKE_OUTCOME_PRESENTATION_ARTIFACT_V1";
  intakeOutcomePresentationArtifactId: string;
  requestPublicId: string | null;
  requestRef: string | null;
  requestLineageRef: string | null;
  intakeSubmitSettlementRef: string;
  outcomeResult: Phase1OutcomeGrammarResult;
  appliesToState: Phase1OutcomeAppliedState;
  copyDeckId: string;
  copyVariantRef: string;
  focusTarget: string;
  primaryActionId: string;
  secondaryActionId: string | null;
  artifactPresentationContractRef: string;
  outboundNavigationGrantPolicyRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfaceRouteContractRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  routePattern: string;
  visibilityTier: IntakeOutcomeVisibilityTier;
  summarySafetyTier:
    | "routine_clear"
    | "routine_recovery"
    | "urgent_diversion_required"
    | "residual_risk_flagged"
    | "processing_failed";
  placeholderContractRef: string;
  artifactState: IntakeOutcomeArtifactState;
  outboundNavigationGrantRef: string | null;
  createdAt: string;
  version: number;
}

export interface OutcomeNavigationGrantSnapshot {
  outboundNavigationGrantSchemaVersion: "OUTBOUND_NAVIGATION_GRANT_V1";
  outboundNavigationGrantId: string;
  intakeSubmitSettlementRef: string;
  requestRef: string | null;
  requestPublicId: string | null;
  routeFamilyRef: string;
  continuityKey: string;
  selectedAnchorRef: string;
  returnTargetRef: string;
  destinationType: OutcomeNavigationDestinationType;
  destinationLabel: string;
  scrubbedDestination: string;
  reasonCode: string;
  expiresAt: string;
  createdAt: string;
  version: number;
}

export interface Phase1OutcomeTupleSnapshot {
  outcomeTupleSchemaVersion: "PHASE1_OUTCOME_GRAMMAR_TUPLE_V1";
  phase1OutcomeTupleId: string;
  outcomeGrammarContractRef: string;
  intakeSubmitSettlementRef: string;
  requestRef: string | null;
  requestLineageRef: string | null;
  requestPublicId: string | null;
  outcomeResult: Phase1OutcomeGrammarResult;
  appliesToState: Phase1OutcomeAppliedState;
  presentationArtifactRef: string;
  receiptEnvelopeRef: string | null;
  urgentDiversionSettlementRef: string | null;
  outboundNavigationGrantRef: string | null;
  replayTupleHash: string;
  continuityPosture: "authoritative_same_shell" | "recovery_same_shell";
  recordedAt: string;
  version: number;
}

export class PatientReceiptConsistencyEnvelopeDocument {
  private readonly snapshot: PatientReceiptConsistencyEnvelopeSnapshot;

  private constructor(snapshot: PatientReceiptConsistencyEnvelopeSnapshot) {
    this.snapshot = PatientReceiptConsistencyEnvelopeDocument.normalize(snapshot);
  }

  static create(
    input: Omit<PatientReceiptConsistencyEnvelopeSnapshot, "version">,
  ): PatientReceiptConsistencyEnvelopeDocument {
    return new PatientReceiptConsistencyEnvelopeDocument({ ...input, version: 1 });
  }

  static hydrate(
    snapshot: PatientReceiptConsistencyEnvelopeSnapshot,
  ): PatientReceiptConsistencyEnvelopeDocument {
    return new PatientReceiptConsistencyEnvelopeDocument(snapshot);
  }

  private static normalize(
    snapshot: PatientReceiptConsistencyEnvelopeSnapshot,
  ): PatientReceiptConsistencyEnvelopeSnapshot {
    return {
      ...snapshot,
      consistencyEnvelopeId: requireRef(snapshot.consistencyEnvelopeId, "consistencyEnvelopeId"),
      requestRef: optionalRef(snapshot.requestRef),
      requestLineageRef: optionalRef(snapshot.requestLineageRef),
      submissionPromotionRecordRef: optionalRef(snapshot.submissionPromotionRecordRef),
      normalizedSubmissionRef: optionalRef(snapshot.normalizedSubmissionRef),
      receiptConsistencyKey: optionalRef(snapshot.receiptConsistencyKey),
      statusConsistencyKey: optionalRef(snapshot.statusConsistencyKey),
      etaPromiseRef: requireRef(snapshot.etaPromiseRef, "etaPromiseRef"),
      etaLowerBoundAt: optionalRef(snapshot.etaLowerBoundAt),
      etaMedianAt: optionalRef(snapshot.etaMedianAt),
      etaUpperBoundAt: optionalRef(snapshot.etaUpperBoundAt),
      bucketConfidence: ensureUnitInterval(snapshot.bucketConfidence, "bucketConfidence"),
      calibrationVersionRef: requireRef(snapshot.calibrationVersionRef, "calibrationVersionRef"),
      statusProjectionVersionRef: requireRef(
        snapshot.statusProjectionVersionRef,
        "statusProjectionVersionRef",
      ),
      causalToken: requireRef(snapshot.causalToken, "causalToken"),
      monotoneRevision: ensurePositiveInteger(snapshot.monotoneRevision, "monotoneRevision"),
      issuedAt: ensureIsoTimestamp(snapshot.issuedAt, "issuedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toSnapshot(): PatientReceiptConsistencyEnvelopeSnapshot {
    return { ...this.snapshot };
  }
}

export class IntakeOutcomePresentationArtifactDocument {
  private readonly snapshot: IntakeOutcomePresentationArtifactSnapshot;

  private constructor(snapshot: IntakeOutcomePresentationArtifactSnapshot) {
    this.snapshot = IntakeOutcomePresentationArtifactDocument.normalize(snapshot);
  }

  static create(
    input: Omit<IntakeOutcomePresentationArtifactSnapshot, "version">,
  ): IntakeOutcomePresentationArtifactDocument {
    return new IntakeOutcomePresentationArtifactDocument({ ...input, version: 1 });
  }

  static hydrate(
    snapshot: IntakeOutcomePresentationArtifactSnapshot,
  ): IntakeOutcomePresentationArtifactDocument {
    return new IntakeOutcomePresentationArtifactDocument(snapshot);
  }

  private static normalize(
    snapshot: IntakeOutcomePresentationArtifactSnapshot,
  ): IntakeOutcomePresentationArtifactSnapshot {
    return {
      ...snapshot,
      intakeOutcomePresentationArtifactId: requireRef(
        snapshot.intakeOutcomePresentationArtifactId,
        "intakeOutcomePresentationArtifactId",
      ),
      requestPublicId: optionalRef(snapshot.requestPublicId),
      requestRef: optionalRef(snapshot.requestRef),
      requestLineageRef: optionalRef(snapshot.requestLineageRef),
      intakeSubmitSettlementRef: requireRef(
        snapshot.intakeSubmitSettlementRef,
        "intakeSubmitSettlementRef",
      ),
      copyDeckId: requireRef(snapshot.copyDeckId, "copyDeckId"),
      copyVariantRef: requireRef(snapshot.copyVariantRef, "copyVariantRef"),
      focusTarget: requireRef(snapshot.focusTarget, "focusTarget"),
      primaryActionId: requireRef(snapshot.primaryActionId, "primaryActionId"),
      secondaryActionId: optionalRef(snapshot.secondaryActionId),
      artifactPresentationContractRef: requireRef(
        snapshot.artifactPresentationContractRef,
        "artifactPresentationContractRef",
      ),
      outboundNavigationGrantPolicyRef: requireRef(
        snapshot.outboundNavigationGrantPolicyRef,
        "outboundNavigationGrantPolicyRef",
      ),
      audienceSurfaceRuntimeBindingRef: requireRef(
        snapshot.audienceSurfaceRuntimeBindingRef,
        "audienceSurfaceRuntimeBindingRef",
      ),
      surfaceRouteContractRef: requireRef(
        snapshot.surfaceRouteContractRef,
        "surfaceRouteContractRef",
      ),
      surfacePublicationRef: requireRef(snapshot.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        snapshot.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      releasePublicationParityRef: requireRef(
        snapshot.releasePublicationParityRef,
        "releasePublicationParityRef",
      ),
      routePattern: requireRef(snapshot.routePattern, "routePattern"),
      placeholderContractRef: requireRef(
        snapshot.placeholderContractRef,
        "placeholderContractRef",
      ),
      outboundNavigationGrantRef: optionalRef(snapshot.outboundNavigationGrantRef),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toSnapshot(): IntakeOutcomePresentationArtifactSnapshot {
    return { ...this.snapshot };
  }
}

export class OutcomeNavigationGrantDocument {
  private readonly snapshot: OutcomeNavigationGrantSnapshot;

  private constructor(snapshot: OutcomeNavigationGrantSnapshot) {
    this.snapshot = OutcomeNavigationGrantDocument.normalize(snapshot);
  }

  static create(
    input: Omit<OutcomeNavigationGrantSnapshot, "version">,
  ): OutcomeNavigationGrantDocument {
    return new OutcomeNavigationGrantDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: OutcomeNavigationGrantSnapshot): OutcomeNavigationGrantDocument {
    return new OutcomeNavigationGrantDocument(snapshot);
  }

  private static normalize(snapshot: OutcomeNavigationGrantSnapshot): OutcomeNavigationGrantSnapshot {
    return {
      ...snapshot,
      outboundNavigationGrantId: requireRef(
        snapshot.outboundNavigationGrantId,
        "outboundNavigationGrantId",
      ),
      intakeSubmitSettlementRef: requireRef(
        snapshot.intakeSubmitSettlementRef,
        "intakeSubmitSettlementRef",
      ),
      requestRef: optionalRef(snapshot.requestRef),
      requestPublicId: optionalRef(snapshot.requestPublicId),
      routeFamilyRef: requireRef(snapshot.routeFamilyRef, "routeFamilyRef"),
      continuityKey: requireRef(snapshot.continuityKey, "continuityKey"),
      selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
      returnTargetRef: requireRef(snapshot.returnTargetRef, "returnTargetRef"),
      destinationLabel: requireRef(snapshot.destinationLabel, "destinationLabel"),
      scrubbedDestination: requireRef(snapshot.scrubbedDestination, "scrubbedDestination"),
      reasonCode: requireRef(snapshot.reasonCode, "reasonCode"),
      expiresAt: ensureIsoTimestamp(snapshot.expiresAt, "expiresAt"),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toSnapshot(): OutcomeNavigationGrantSnapshot {
    return { ...this.snapshot };
  }
}

export class Phase1OutcomeTupleDocument {
  private readonly snapshot: Phase1OutcomeTupleSnapshot;

  private constructor(snapshot: Phase1OutcomeTupleSnapshot) {
    this.snapshot = Phase1OutcomeTupleDocument.normalize(snapshot);
  }

  static create(input: Omit<Phase1OutcomeTupleSnapshot, "version">): Phase1OutcomeTupleDocument {
    return new Phase1OutcomeTupleDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: Phase1OutcomeTupleSnapshot): Phase1OutcomeTupleDocument {
    return new Phase1OutcomeTupleDocument(snapshot);
  }

  private static normalize(snapshot: Phase1OutcomeTupleSnapshot): Phase1OutcomeTupleSnapshot {
    return {
      ...snapshot,
      phase1OutcomeTupleId: requireRef(snapshot.phase1OutcomeTupleId, "phase1OutcomeTupleId"),
      outcomeGrammarContractRef: requireRef(
        snapshot.outcomeGrammarContractRef,
        "outcomeGrammarContractRef",
      ),
      intakeSubmitSettlementRef: requireRef(
        snapshot.intakeSubmitSettlementRef,
        "intakeSubmitSettlementRef",
      ),
      requestRef: optionalRef(snapshot.requestRef),
      requestLineageRef: optionalRef(snapshot.requestLineageRef),
      requestPublicId: optionalRef(snapshot.requestPublicId),
      presentationArtifactRef: requireRef(
        snapshot.presentationArtifactRef,
        "presentationArtifactRef",
      ),
      receiptEnvelopeRef: optionalRef(snapshot.receiptEnvelopeRef),
      urgentDiversionSettlementRef: optionalRef(snapshot.urgentDiversionSettlementRef),
      outboundNavigationGrantRef: optionalRef(snapshot.outboundNavigationGrantRef),
      replayTupleHash: requireRef(snapshot.replayTupleHash, "replayTupleHash"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toSnapshot(): Phase1OutcomeTupleSnapshot {
    return { ...this.snapshot };
  }
}

export interface Phase1OutcomeGrammarRepositories {
  saveReceiptEnvelope(document: PatientReceiptConsistencyEnvelopeDocument): Promise<void>;
  getReceiptEnvelope(consistencyEnvelopeId: string): Promise<PatientReceiptConsistencyEnvelopeDocument | undefined>;
  findLatestReceiptEnvelopeByReceiptConsistencyKey(
    receiptConsistencyKey: string,
  ): Promise<PatientReceiptConsistencyEnvelopeDocument | undefined>;
  saveOutcomeArtifact(document: IntakeOutcomePresentationArtifactDocument): Promise<void>;
  getOutcomeArtifact(
    intakeOutcomePresentationArtifactId: string,
  ): Promise<IntakeOutcomePresentationArtifactDocument | undefined>;
  saveOutcomeNavigationGrant(document: OutcomeNavigationGrantDocument): Promise<void>;
  getOutcomeNavigationGrant(
    outboundNavigationGrantId: string,
  ): Promise<OutcomeNavigationGrantDocument | undefined>;
  saveOutcomeTuple(document: Phase1OutcomeTupleDocument): Promise<void>;
  getOutcomeTuple(phase1OutcomeTupleId: string): Promise<Phase1OutcomeTupleDocument | undefined>;
  findOutcomeTupleBySettlement(
    intakeSubmitSettlementRef: string,
  ): Promise<Phase1OutcomeTupleDocument | undefined>;
}

export class InMemoryPhase1OutcomeGrammarStore implements Phase1OutcomeGrammarRepositories {
  private readonly receiptEnvelopes = new Map<string, PatientReceiptConsistencyEnvelopeSnapshot>();
  private readonly receiptEnvelopeByKey = new Map<string, string>();
  private readonly artifacts = new Map<string, IntakeOutcomePresentationArtifactSnapshot>();
  private readonly grants = new Map<string, OutcomeNavigationGrantSnapshot>();
  private readonly tuples = new Map<string, Phase1OutcomeTupleSnapshot>();
  private readonly tupleBySettlement = new Map<string, string>();

  async saveReceiptEnvelope(document: PatientReceiptConsistencyEnvelopeDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.receiptEnvelopes.has(snapshot.consistencyEnvelopeId),
      "RECEIPT_ENVELOPE_APPEND_ONLY",
      "PatientReceiptConsistencyEnvelope is append-only.",
    );
    this.receiptEnvelopes.set(snapshot.consistencyEnvelopeId, snapshot);
    if (snapshot.receiptConsistencyKey) {
      this.receiptEnvelopeByKey.set(snapshot.receiptConsistencyKey, snapshot.consistencyEnvelopeId);
    }
  }

  async getReceiptEnvelope(
    consistencyEnvelopeId: string,
  ): Promise<PatientReceiptConsistencyEnvelopeDocument | undefined> {
    const row = this.receiptEnvelopes.get(consistencyEnvelopeId);
    return row ? PatientReceiptConsistencyEnvelopeDocument.hydrate(row) : undefined;
  }

  async findLatestReceiptEnvelopeByReceiptConsistencyKey(
    receiptConsistencyKey: string,
  ): Promise<PatientReceiptConsistencyEnvelopeDocument | undefined> {
    const envelopeId = this.receiptEnvelopeByKey.get(receiptConsistencyKey);
    return envelopeId ? this.getReceiptEnvelope(envelopeId) : undefined;
  }

  async saveOutcomeArtifact(document: IntakeOutcomePresentationArtifactDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.artifacts.has(snapshot.intakeOutcomePresentationArtifactId),
      "OUTCOME_ARTIFACT_APPEND_ONLY",
      "IntakeOutcomePresentationArtifact is append-only.",
    );
    this.artifacts.set(snapshot.intakeOutcomePresentationArtifactId, snapshot);
  }

  async getOutcomeArtifact(
    intakeOutcomePresentationArtifactId: string,
  ): Promise<IntakeOutcomePresentationArtifactDocument | undefined> {
    const row = this.artifacts.get(intakeOutcomePresentationArtifactId);
    return row ? IntakeOutcomePresentationArtifactDocument.hydrate(row) : undefined;
  }

  async saveOutcomeNavigationGrant(document: OutcomeNavigationGrantDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.grants.has(snapshot.outboundNavigationGrantId),
      "OUTCOME_NAVIGATION_GRANT_APPEND_ONLY",
      "Outcome navigation grants are append-only.",
    );
    this.grants.set(snapshot.outboundNavigationGrantId, snapshot);
  }

  async getOutcomeNavigationGrant(
    outboundNavigationGrantId: string,
  ): Promise<OutcomeNavigationGrantDocument | undefined> {
    const row = this.grants.get(outboundNavigationGrantId);
    return row ? OutcomeNavigationGrantDocument.hydrate(row) : undefined;
  }

  async saveOutcomeTuple(document: Phase1OutcomeTupleDocument): Promise<void> {
    const snapshot = document.toSnapshot();
    invariant(
      !this.tuples.has(snapshot.phase1OutcomeTupleId),
      "OUTCOME_TUPLE_APPEND_ONLY",
      "Outcome tuples are append-only.",
    );
    invariant(
      !this.tupleBySettlement.has(snapshot.intakeSubmitSettlementRef),
      "OUTCOME_TUPLE_SETTLEMENT_UNIQUE",
      "Each intake submit settlement may resolve only one authoritative outcome tuple.",
    );
    this.tuples.set(snapshot.phase1OutcomeTupleId, snapshot);
    this.tupleBySettlement.set(snapshot.intakeSubmitSettlementRef, snapshot.phase1OutcomeTupleId);
  }

  async getOutcomeTuple(
    phase1OutcomeTupleId: string,
  ): Promise<Phase1OutcomeTupleDocument | undefined> {
    const row = this.tuples.get(phase1OutcomeTupleId);
    return row ? Phase1OutcomeTupleDocument.hydrate(row) : undefined;
  }

  async findOutcomeTupleBySettlement(
    intakeSubmitSettlementRef: string,
  ): Promise<Phase1OutcomeTupleDocument | undefined> {
    const tupleId = this.tupleBySettlement.get(intakeSubmitSettlementRef);
    return tupleId ? this.getOutcomeTuple(tupleId) : undefined;
  }
}

export interface Phase1OutcomeSettlementInput {
  intakeSubmitSettlementRef: string;
  draftPublicId: string;
  requestRef: string | null;
  requestLineageRef: string | null;
  requestPublicId: string | null;
  submissionPromotionRecordRef: string | null;
  normalizedSubmissionRef: string | null;
  receiptConsistencyKey: string | null;
  statusConsistencyKey: string | null;
  result: Phase1OutcomeGrammarResult;
  appliesToState: Phase1OutcomeAppliedState;
  routeFamilyRef: string;
  routeIntentBindingRef: string;
  audienceSurfaceRuntimeBindingRef: string;
  surfacePublicationRef: string;
  runtimePublicationBundleRef: string;
  releasePublicationParityRef: string;
  continuityKey: string;
  selectedAnchorRef: string;
  returnTargetRef: string;
  urgentDiversionSettlementRef?: string | null;
  receiptEnvelopeOverride?: {
    receiptBucket: PatientReceiptBucket;
    etaPromiseRef: string;
    etaLowerBoundAt: string | null;
    etaMedianAt: string | null;
    etaUpperBoundAt: string | null;
    bucketConfidence: number;
    promiseState: PatientReceiptPromiseState;
    calibrationVersionRef: string;
    statusProjectionVersionRef: string;
    causalToken: string;
    monotoneRevision: number;
  } | null;
  recordedAt: string;
}

export interface Phase1OutcomeSettlementResult {
  replayed: boolean;
  tuple: Phase1OutcomeTupleSnapshot;
  artifact: IntakeOutcomePresentationArtifactSnapshot;
  receiptEnvelope: PatientReceiptConsistencyEnvelopeSnapshot | null;
  outboundNavigationGrant: OutcomeNavigationGrantSnapshot | null;
}

export function resolvePhase1OutcomeVariant(
  input: Pick<Phase1OutcomeSettlementInput, "result" | "appliesToState">,
): Phase1OutcomeVariantDefinition {
  if (input.result === "triage_ready" && input.appliesToState === "screen_clear") {
    return phase1OutcomeVariants.routineClear;
  }
  if (input.result === "triage_ready" && input.appliesToState === "residual_risk_flagged") {
    return phase1OutcomeVariants.routineResidual;
  }
  if (input.result === "urgent_diversion" && input.appliesToState === "urgent_diversion_required") {
    return phase1OutcomeVariants.urgentRequired;
  }
  if (input.result === "urgent_diversion" && input.appliesToState === "urgent_diverted") {
    return phase1OutcomeVariants.urgentIssued;
  }
  if (input.result === "failed_safe") {
    return phase1OutcomeVariants.failedSafe;
  }
  if (input.result === "stale_recoverable") {
    return phase1OutcomeVariants.staleRecoverable;
  }
  if (input.result === "denied_scope") {
    return phase1OutcomeVariants.deniedScope;
  }
  throw new RequestBackboneInvariantError(
    "UNSUPPORTED_PHASE1_OUTCOME_VARIANT",
    `No Phase 1 outcome grammar variant for ${input.result}/${input.appliesToState}.`,
  );
}

export function buildPhase1OutcomeArtifactId(input: {
  intakeSubmitSettlementRef: string;
  result: Phase1OutcomeGrammarResult;
  appliesToState: Phase1OutcomeAppliedState;
}): string {
  const variant = resolvePhase1OutcomeVariant(input);
  return `iopa_${sha256Hex({
    settlementRef: input.intakeSubmitSettlementRef,
    variant: variant.variantRef,
  }).slice(0, 20)}`;
}

function materializeRoutePattern(
  pattern: string,
  input: Pick<Phase1OutcomeSettlementInput, "requestPublicId" | "draftPublicId">,
): string {
  return pattern
    .replace(":requestPublicId", input.requestPublicId ?? "request")
    .replace(":draftPublicId", input.draftPublicId);
}

export class Phase1OutcomeGrammarService {
  constructor(readonly repositories: Phase1OutcomeGrammarRepositories) {}

  async settleOutcome(
    input: Phase1OutcomeSettlementInput,
  ): Promise<Phase1OutcomeSettlementResult> {
    const existing = await this.repositories.findOutcomeTupleBySettlement(
      input.intakeSubmitSettlementRef,
    );
    if (existing) {
      const tuple = existing.toSnapshot();
      const artifact = await this.repositories.getOutcomeArtifact(tuple.presentationArtifactRef);
      invariant(!!artifact, "OUTCOME_ARTIFACT_NOT_FOUND", "Outcome tuple is missing its artifact.");
      const receiptEnvelope = tuple.receiptEnvelopeRef
        ? await this.repositories.getReceiptEnvelope(tuple.receiptEnvelopeRef)
        : undefined;
      const outboundNavigationGrant = tuple.outboundNavigationGrantRef
        ? await this.repositories.getOutcomeNavigationGrant(tuple.outboundNavigationGrantRef)
        : undefined;
      return {
        replayed: true,
        tuple,
        artifact: artifact.toSnapshot(),
        receiptEnvelope: receiptEnvelope?.toSnapshot() ?? null,
        outboundNavigationGrant: outboundNavigationGrant?.toSnapshot() ?? null,
      };
    }

    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const variant = resolvePhase1OutcomeVariant(input);
    const settlementRef = requireRef(input.intakeSubmitSettlementRef, "intakeSubmitSettlementRef");
    const urgentDiversionSettlementRef = optionalRef(input.urgentDiversionSettlementRef);
    invariant(
      input.result !== "urgent_diversion" ||
        input.appliesToState !== "urgent_diverted" ||
        urgentDiversionSettlementRef !== null,
      "URGENT_DIVERTED_REQUIRES_ISSUED_SETTLEMENT",
      "urgent_diverted outcome grammar requires an issued UrgentDiversionSettlement reference.",
    );
    const requestPublicId = optionalRef(input.requestPublicId);
    const requestRef = optionalRef(input.requestRef);
    const requestLineageRef = optionalRef(input.requestLineageRef);
    const routePattern = materializeRoutePattern(variant.routePattern, input);

    let outboundNavigationGrant: OutcomeNavigationGrantDocument | null = null;
    if (variant.artifactState === "external_handoff_ready") {
      outboundNavigationGrant = OutcomeNavigationGrantDocument.create({
        outboundNavigationGrantSchemaVersion: "OUTBOUND_NAVIGATION_GRANT_V1",
        outboundNavigationGrantId: `ong_${sha256Hex({ settlementRef, routePattern }).slice(0, 20)}`,
        intakeSubmitSettlementRef: settlementRef,
        requestRef,
        requestPublicId,
        routeFamilyRef: requireRef(input.routeFamilyRef, "routeFamilyRef"),
        continuityKey: requireRef(input.continuityKey, "continuityKey"),
        selectedAnchorRef: requireRef(input.selectedAnchorRef, "selectedAnchorRef"),
        returnTargetRef: requireRef(input.returnTargetRef, "returnTargetRef"),
        destinationType: "external_browser",
        destinationLabel: variant.primaryActionLabel,
        scrubbedDestination: routePattern,
        reasonCode: variant.primaryActionId,
        expiresAt: addMinutes(recordedAt, 5),
        createdAt: recordedAt,
      });
      await this.repositories.saveOutcomeNavigationGrant(outboundNavigationGrant);
    }

    const artifact = IntakeOutcomePresentationArtifactDocument.create({
      artifactSchemaVersion: "INTAKE_OUTCOME_PRESENTATION_ARTIFACT_V1",
      intakeOutcomePresentationArtifactId: buildPhase1OutcomeArtifactId({
        intakeSubmitSettlementRef: settlementRef,
        result: input.result,
        appliesToState: input.appliesToState,
      }),
      requestPublicId,
      requestRef,
      requestLineageRef,
      intakeSubmitSettlementRef: settlementRef,
      outcomeResult: input.result,
      appliesToState: input.appliesToState,
      copyDeckId: variant.deckId,
      copyVariantRef: variant.variantRef,
      focusTarget: variant.focusTarget,
      primaryActionId: variant.primaryActionId,
      secondaryActionId: variant.secondaryActionId,
      artifactPresentationContractRef: variant.artifactPresentationContractRef,
      outboundNavigationGrantPolicyRef: variant.outboundNavigationGrantPolicyRef,
      audienceSurfaceRuntimeBindingRef: requireRef(
        input.audienceSurfaceRuntimeBindingRef,
        "audienceSurfaceRuntimeBindingRef",
      ),
      surfaceRouteContractRef: variant.surfaceRouteContractRef,
      surfacePublicationRef: requireRef(input.surfacePublicationRef, "surfacePublicationRef"),
      runtimePublicationBundleRef: requireRef(
        input.runtimePublicationBundleRef,
        "runtimePublicationBundleRef",
      ),
      releasePublicationParityRef: requireRef(
        input.releasePublicationParityRef,
        "releasePublicationParityRef",
      ),
      routePattern,
      visibilityTier: variant.visibilityTier,
      summarySafetyTier: variant.summarySafetyTier,
      placeholderContractRef: variant.placeholderContractRef,
      artifactState: variant.artifactState,
      outboundNavigationGrantRef: outboundNavigationGrant?.toSnapshot().outboundNavigationGrantId ?? null,
      createdAt: recordedAt,
    });
    await this.repositories.saveOutcomeArtifact(artifact);

    let receiptEnvelope: PatientReceiptConsistencyEnvelopeDocument | null = null;
    if (input.result !== "urgent_diversion") {
      const receiptOverride = input.receiptEnvelopeOverride ?? null;
      const promiseState: PatientReceiptPromiseState =
        receiptOverride?.promiseState ??
        (input.result === "triage_ready" ? "on_track" : "recovery_required");
      receiptEnvelope = PatientReceiptConsistencyEnvelopeDocument.create({
        receiptEnvelopeSchemaVersion: "PATIENT_RECEIPT_CONSISTENCY_ENVELOPE_V1",
        consistencyEnvelopeId: `rce_${sha256Hex({
          settlementRef,
          promiseState,
          monotoneRevision: receiptOverride?.monotoneRevision ?? 1,
        }).slice(0, 20)}`,
        requestRef,
        requestLineageRef,
        submissionPromotionRecordRef: optionalRef(input.submissionPromotionRecordRef),
        normalizedSubmissionRef: optionalRef(input.normalizedSubmissionRef),
        receiptConsistencyKey: optionalRef(input.receiptConsistencyKey),
        statusConsistencyKey: optionalRef(input.statusConsistencyKey),
        receiptBucket: receiptOverride?.receiptBucket ?? "after_2_working_days",
        etaPromiseRef: receiptOverride?.etaPromiseRef ?? phase1ReceiptEtaPromiseRef,
        etaLowerBoundAt: receiptOverride?.etaLowerBoundAt ?? recordedAt,
        etaMedianAt: receiptOverride?.etaMedianAt ?? addDays(recordedAt, 2),
        etaUpperBoundAt: receiptOverride?.etaUpperBoundAt ?? addDays(recordedAt, 3),
        bucketConfidence: receiptOverride?.bucketConfidence ?? 1,
        promiseState,
        calibrationVersionRef:
          receiptOverride?.calibrationVersionRef ?? phase1ReceiptEnvelopeCalibrationRef,
        statusProjectionVersionRef:
          receiptOverride?.statusProjectionVersionRef ?? `status_projection::${settlementRef}`,
        causalToken: receiptOverride?.causalToken ?? settlementRef,
        monotoneRevision: receiptOverride?.monotoneRevision ?? 1,
        visibilityTier:
          input.result === "triage_ready"
            ? variant.visibilityTier
            : "public_recovery_summary",
        issuedAt: recordedAt,
      });
      await this.repositories.saveReceiptEnvelope(receiptEnvelope);
    }

    const tuple = Phase1OutcomeTupleDocument.create({
      outcomeTupleSchemaVersion: "PHASE1_OUTCOME_GRAMMAR_TUPLE_V1",
      phase1OutcomeTupleId: `otu_${sha256Hex({ settlementRef, result: input.result }).slice(0, 20)}`,
      outcomeGrammarContractRef: phase1OutcomeGrammarContractRef,
      intakeSubmitSettlementRef: settlementRef,
      requestRef,
      requestLineageRef,
      requestPublicId,
      outcomeResult: input.result,
      appliesToState: input.appliesToState,
      presentationArtifactRef: artifact.toSnapshot().intakeOutcomePresentationArtifactId,
      receiptEnvelopeRef: receiptEnvelope?.toSnapshot().consistencyEnvelopeId ?? null,
      urgentDiversionSettlementRef,
      outboundNavigationGrantRef:
        outboundNavigationGrant?.toSnapshot().outboundNavigationGrantId ?? null,
      replayTupleHash: sha256Hex({
        settlementRef,
        result: input.result,
        appliesToState: input.appliesToState,
        artifactRef: artifact.toSnapshot().intakeOutcomePresentationArtifactId,
        receiptEnvelopeRef: receiptEnvelope?.toSnapshot().consistencyEnvelopeId ?? null,
        urgentDiversionSettlementRef,
      }),
      continuityPosture:
        input.result === "triage_ready" || input.result === "urgent_diversion"
          ? "authoritative_same_shell"
          : "recovery_same_shell",
      recordedAt,
    });
    await this.repositories.saveOutcomeTuple(tuple);

    return {
      replayed: false,
      tuple: tuple.toSnapshot(),
      artifact: artifact.toSnapshot(),
      receiptEnvelope: receiptEnvelope?.toSnapshot() ?? null,
      outboundNavigationGrant: outboundNavigationGrant?.toSnapshot() ?? null,
    };
  }
}

export function createPhase1OutcomeGrammarStore(): Phase1OutcomeGrammarRepositories {
  return new InMemoryPhase1OutcomeGrammarStore();
}

export function createPhase1OutcomeGrammarService(
  repositories: Phase1OutcomeGrammarRepositories = createPhase1OutcomeGrammarStore(),
): Phase1OutcomeGrammarService {
  return new Phase1OutcomeGrammarService(repositories);
}
