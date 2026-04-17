import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  type RequestAggregate,
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
} from "@vecells/domain-kernel";
import { makeFoundationEvent, type FoundationEventEnvelope } from "@vecells/event-contracts";
import {
  type CreateEvidenceSnapshotInput,
  type EvidenceBackboneDependencies,
  type EvidenceBackboneServices,
  type EvidenceSnapshotDocument,
  type MaterialDeltaDisposition,
  createEvidenceBackboneServices,
  createEvidenceBackboneStore,
} from "./evidence-backbone";

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

function ensurePositiveInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value > 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a positive integer.`,
  );
  return value;
}

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function ensureUnitInterval(value: number, field: string): number {
  invariant(
    Number.isFinite(value) && value >= 0 && value <= 1,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be between 0 and 1 inclusive.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  return `{${entries
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function appendOnlyInsert<T>(
  map: Map<string, T>,
  key: string,
  row: T,
  aggregateLabel: string,
): void {
  invariant(
    !map.has(key),
    `IMMUTABLE_${aggregateLabel.toUpperCase()}_REWRITE_FORBIDDEN`,
    `${aggregateLabel} is append-only and may not be rewritten in place.`,
  );
  map.set(key, row);
}

function nextSafetyId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function buildIngressSignature(input: {
  requestId: string;
  sourceDomain: EvidenceIngressSourceDomain;
  governingObjectRef: string;
  ingressEvidenceRefs: readonly string[];
}): string {
  return sha256Hex(
    stableStringify({
      requestId: input.requestId,
      sourceDomain: input.sourceDomain,
      governingObjectRef: input.governingObjectRef,
      ingressEvidenceRefs: uniqueSortedRefs(input.ingressEvidenceRefs),
    }),
  );
}

function highestEvidenceClass(classes: readonly EvidenceClass[]): EvidenceClass {
  const rank: Record<EvidenceClass, number> = {
    technical_metadata: 0,
    operationally_material_nonclinical: 1,
    contact_safety_relevant: 2,
    potentially_clinical: 3,
  };
  const sorted = [...classes].sort((left, right) => rank[right] - rank[left]);
  return sorted[0] ?? "potentially_clinical";
}

function toSnapshotDisposition(materialityClass: MaterialityClass): MaterialDeltaDisposition {
  switch (materialityClass) {
    case "technical_only":
      return "technical_only";
    case "operational_nonclinical":
      return "operational_nonclinical";
    case "contact_safety_material":
      return "delivery_meaning_changed";
    case "unresolved":
      return "patient_visible_interpretation_changed";
    case "safety_material":
    default:
      return "clinical_meaning_changed";
  }
}

export type EvidenceIngressSourceDomain =
  | "patient_reply"
  | "callback_outcome"
  | "booking_narrative"
  | "pharmacy_return"
  | "support_capture"
  | "adapter_observation"
  | "async_enrichment"
  | "operator_override";

export type EvidenceAttachmentDisposition =
  | "new_snapshot"
  | "derivative_only"
  | "replay_existing"
  | "hold_pending_review";

export type AssimilationState =
  | "pending_materiality"
  | "pending_classification"
  | "pending_preemption"
  | "settled_no_re_safety"
  | "settled_triggered"
  | "blocked_manual_review"
  | "replay_returned"
  | "superseded";

export type MaterialityClass =
  | "technical_only"
  | "operational_nonclinical"
  | "safety_material"
  | "contact_safety_material"
  | "unresolved";

export type MaterialDeltaTriggerDecision =
  | "re_safety_required"
  | "no_re_safety"
  | "blocked_manual_review"
  | "coalesced_with_pending_preemption";

export type MaterialDeltaDecisionBasis =
  | "no_semantic_delta"
  | "feature_delta"
  | "chronology_delta"
  | "contradiction_delta"
  | "dependency_delta"
  | "manual_override"
  | "degraded_fail_closed";

export type EvidenceClass =
  | "technical_metadata"
  | "operationally_material_nonclinical"
  | "contact_safety_relevant"
  | "potentially_clinical";

export type ClassificationBasis =
  | "allow_list"
  | "route_dependency"
  | "content_signal"
  | "manual_review"
  | "degraded_fail_closed";

export type ConfidenceBand = "high" | "medium" | "low";

export type MisclassificationRiskState = "ordinary" | "fail_closed_review" | "urgent_hold";

export type PreemptionPriority = "routine_review" | "urgent_review" | "urgent_live";

export type PreemptionFallbackState = "none" | "manual_review_required" | "artifact_degraded";

export type PreemptionStatus =
  | "pending"
  | "blocked_manual_review"
  | "cleared_routine"
  | "escalated_urgent"
  | "cancelled"
  | "superseded";

export type SafetyDecisionOutcome =
  | "urgent_required"
  | "urgent_live"
  | "urgent_review"
  | "residual_review"
  | "clear_routine"
  | "fallback_manual_review";

export type RequestedSafetyState =
  | "urgent_diversion_required"
  | "residual_risk_flagged"
  | "screen_clear";

export type SafetyDecisionState = "pending_settlement" | "settled" | "superseded";

export type UrgentDiversionActionMode =
  | "urgent_guidance_presented"
  | "live_transfer_started"
  | "duty_clinician_escalated"
  | "urgent_callback_opened"
  | "emergency_service_handoff"
  | "manual_follow_up_only";

export type UrgentDiversionSettlementState = "pending" | "issued" | "failed" | "superseded";

export type FeatureState = "present" | "absent" | "unresolved";

export type RuleKind = "hard_stop" | "urgent" | "residual";

export type RuleMissingnessMode = "ignore" | "conservative_hold";

export interface EvidenceAssimilationRecordSnapshot {
  evidenceAssimilationId: string;
  episodeId: string;
  requestId: string;
  sourceDomain: EvidenceIngressSourceDomain;
  governingObjectRef: string;
  ingressEvidenceRefs: readonly string[];
  priorCompositeSnapshotRef: string | null;
  resultingSnapshotRef: string | null;
  materialDeltaAssessmentRef: string;
  classificationDecisionRef: string;
  resultingPreemptionRef: string | null;
  attachmentDisposition: EvidenceAttachmentDisposition;
  assimilationState: AssimilationState;
  resultingSafetyEpoch: number;
  decidedAt: string;
  version: number;
}

export interface MaterialDeltaAssessmentSnapshot {
  materialDeltaAssessmentId: string;
  requestId: string;
  evidenceAssimilationRef: string;
  sourceDomain: EvidenceIngressSourceDomain;
  governingObjectRef: string;
  priorCompositeSnapshotRef: string | null;
  candidateSnapshotRef: string | null;
  changedEvidenceRefs: readonly string[];
  changedFeatureRefs: readonly string[];
  changedDependencyRefs: readonly string[];
  changedChronologyRefs: readonly string[];
  materialityPolicyRef: string;
  materialityClass: MaterialityClass;
  triggerDecision: MaterialDeltaTriggerDecision;
  decisionBasis: MaterialDeltaDecisionBasis;
  reasonCodes: readonly string[];
  supersedesAssessmentRef: string | null;
  decidedByRef: string;
  decidedAt: string;
  version: number;
}

export interface EvidenceClassificationDecisionSnapshot {
  classificationDecisionId: string;
  requestId: string;
  triggeringSnapshotRef: string | null;
  evidenceAssimilationRef: string;
  sourceDomain: EvidenceIngressSourceDomain;
  governingObjectRef: string;
  classifiedEvidenceRefs: readonly string[];
  classifierVersionRef: string;
  dominantEvidenceClass: EvidenceClass;
  classificationBasis: ClassificationBasis;
  triggerReasonCodes: readonly string[];
  activeDependencyRefs: readonly string[];
  confidenceBand: ConfidenceBand;
  misclassificationRiskState: MisclassificationRiskState;
  decisionState: "applied" | "superseded";
  supersedesDecisionRef: string | null;
  decidedByRef: string;
  decidedAt: string;
  version: number;
}

export interface SafetyPreemptionRecordSnapshot {
  preemptionId: string;
  episodeId: string;
  requestId: string;
  triggeringSnapshotRef: string | null;
  evidenceAssimilationRef: string;
  materialDeltaAssessmentRef: string;
  classificationDecisionRef: string;
  sourceDomain: EvidenceIngressSourceDomain;
  evidenceClass: EvidenceClass;
  openingSafetyEpoch: number;
  blockingActionScopeRefs: readonly string[];
  priority: PreemptionPriority;
  reasonCode: string;
  fallbackState: PreemptionFallbackState;
  status: PreemptionStatus;
  createdAt: string;
  resolvedAt: string | null;
  version: number;
}

export interface SafetyDecisionRecordSnapshot {
  safetyDecisionId: string;
  requestId: string;
  preemptionRef: string;
  classificationDecisionRef: string;
  compositeSnapshotRef: string | null;
  sourceDomain: EvidenceIngressSourceDomain;
  rulePackVersionRef: string;
  calibratorVersionRef: string;
  decisionTupleHash: string;
  hardStopRuleRefs: readonly string[];
  urgentContributorRuleRefs: readonly string[];
  residualContributorRuleRefs: readonly string[];
  activeReachabilityDependencyRefs: readonly string[];
  conflictVectorRef: string | null;
  criticalMissingnessRef: string | null;
  decisionOutcome: SafetyDecisionOutcome;
  requestedSafetyState: RequestedSafetyState;
  decisionState: SafetyDecisionState;
  resultingSafetyEpoch: number;
  supersedesSafetyDecisionRef: string | null;
  decidedAt: string;
  settledAt: string | null;
  version: number;
}

export interface UrgentDiversionSettlementSnapshot {
  urgentDiversionSettlementId: string;
  requestId: string;
  preemptionRef: string;
  safetyDecisionRef: string;
  actionMode: UrgentDiversionActionMode;
  presentationArtifactRef: string | null;
  authoritativeActionRef: string | null;
  settlementState: UrgentDiversionSettlementState;
  supersedesSettlementRef: string | null;
  issuedAt: string | null;
  settledAt: string | null;
  version: number;
}

export interface PersistedEvidenceAssimilationRecordRow extends EvidenceAssimilationRecordSnapshot {
  aggregateType: "EvidenceAssimilationRecord";
  persistenceSchemaVersion: 1;
}

export interface PersistedMaterialDeltaAssessmentRow extends MaterialDeltaAssessmentSnapshot {
  aggregateType: "MaterialDeltaAssessment";
  persistenceSchemaVersion: 1;
}

export interface PersistedEvidenceClassificationDecisionRow
  extends EvidenceClassificationDecisionSnapshot {
  aggregateType: "EvidenceClassificationDecision";
  persistenceSchemaVersion: 1;
}

export interface PersistedSafetyPreemptionRecordRow extends SafetyPreemptionRecordSnapshot {
  aggregateType: "SafetyPreemptionRecord";
  persistenceSchemaVersion: 1;
}

export interface PersistedSafetyDecisionRecordRow extends SafetyDecisionRecordSnapshot {
  aggregateType: "SafetyDecisionRecord";
  persistenceSchemaVersion: 1;
}

export interface PersistedUrgentDiversionSettlementRow extends UrgentDiversionSettlementSnapshot {
  aggregateType: "UrgentDiversionSettlement";
  persistenceSchemaVersion: 1;
}

abstract class AppendOnlyDocument<TSnapshot extends { version: number }, TRow> {
  constructor(protected readonly snapshot: TSnapshot) {}

  abstract toPersistedRow(): TRow;

  toSnapshot(): TSnapshot {
    return stableStructuredClone(this.snapshot);
  }
}

function stableStructuredClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class EvidenceAssimilationRecordDocument extends AppendOnlyDocument<
  EvidenceAssimilationRecordSnapshot,
  PersistedEvidenceAssimilationRecordRow
> {
  private constructor(snapshot: EvidenceAssimilationRecordSnapshot) {
    super(EvidenceAssimilationRecordDocument.normalize(snapshot));
  }

  static create(
    input: Omit<EvidenceAssimilationRecordSnapshot, "version">,
  ): EvidenceAssimilationRecordDocument {
    return new EvidenceAssimilationRecordDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: EvidenceAssimilationRecordSnapshot): EvidenceAssimilationRecordDocument {
    return new EvidenceAssimilationRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: EvidenceAssimilationRecordSnapshot,
  ): EvidenceAssimilationRecordSnapshot {
    return {
      ...snapshot,
      evidenceAssimilationId: requireRef(snapshot.evidenceAssimilationId, "evidenceAssimilationId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      ingressEvidenceRefs: uniqueSortedRefs(snapshot.ingressEvidenceRefs),
      priorCompositeSnapshotRef: optionalRef(snapshot.priorCompositeSnapshotRef),
      resultingSnapshotRef: optionalRef(snapshot.resultingSnapshotRef),
      materialDeltaAssessmentRef: requireRef(
        snapshot.materialDeltaAssessmentRef,
        "materialDeltaAssessmentRef",
      ),
      classificationDecisionRef: requireRef(
        snapshot.classificationDecisionRef,
        "classificationDecisionRef",
      ),
      resultingPreemptionRef: optionalRef(snapshot.resultingPreemptionRef),
      resultingSafetyEpoch: ensureNonNegativeInteger(
        snapshot.resultingSafetyEpoch,
        "resultingSafetyEpoch",
      ),
      decidedAt: ensureIsoTimestamp(snapshot.decidedAt, "decidedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toPersistedRow(): PersistedEvidenceAssimilationRecordRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "EvidenceAssimilationRecord",
      persistenceSchemaVersion: 1,
    };
  }
}

export class MaterialDeltaAssessmentDocument extends AppendOnlyDocument<
  MaterialDeltaAssessmentSnapshot,
  PersistedMaterialDeltaAssessmentRow
> {
  private constructor(snapshot: MaterialDeltaAssessmentSnapshot) {
    super(MaterialDeltaAssessmentDocument.normalize(snapshot));
  }

  static create(
    input: Omit<MaterialDeltaAssessmentSnapshot, "version">,
  ): MaterialDeltaAssessmentDocument {
    return new MaterialDeltaAssessmentDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: MaterialDeltaAssessmentSnapshot): MaterialDeltaAssessmentDocument {
    return new MaterialDeltaAssessmentDocument(snapshot);
  }

  private static normalize(
    snapshot: MaterialDeltaAssessmentSnapshot,
  ): MaterialDeltaAssessmentSnapshot {
    const normalized = {
      ...snapshot,
      materialDeltaAssessmentId: requireRef(
        snapshot.materialDeltaAssessmentId,
        "materialDeltaAssessmentId",
      ),
      requestId: requireRef(snapshot.requestId, "requestId"),
      evidenceAssimilationRef: requireRef(
        snapshot.evidenceAssimilationRef,
        "evidenceAssimilationRef",
      ),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      priorCompositeSnapshotRef: optionalRef(snapshot.priorCompositeSnapshotRef),
      candidateSnapshotRef: optionalRef(snapshot.candidateSnapshotRef),
      changedEvidenceRefs: uniqueSortedRefs(snapshot.changedEvidenceRefs),
      changedFeatureRefs: uniqueSortedRefs(snapshot.changedFeatureRefs),
      changedDependencyRefs: uniqueSortedRefs(snapshot.changedDependencyRefs),
      changedChronologyRefs: uniqueSortedRefs(snapshot.changedChronologyRefs),
      materialityPolicyRef: requireRef(snapshot.materialityPolicyRef, "materialityPolicyRef"),
      reasonCodes: uniqueSortedRefs(snapshot.reasonCodes),
      supersedesAssessmentRef: optionalRef(snapshot.supersedesAssessmentRef),
      decidedByRef: requireRef(snapshot.decidedByRef, "decidedByRef"),
      decidedAt: ensureIsoTimestamp(snapshot.decidedAt, "decidedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };

    if (normalized.triggerDecision === "no_re_safety") {
      invariant(
        normalized.materialityClass === "technical_only" ||
          normalized.materialityClass === "operational_nonclinical",
        "NO_RESAFETY_REQUIRES_NONSAFETY_MATERIALITY",
        "triggerDecision = no_re_safety is legal only for technical_only or operational_nonclinical materiality.",
      );
    }

    return normalized;
  }

  toPersistedRow(): PersistedMaterialDeltaAssessmentRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "MaterialDeltaAssessment",
      persistenceSchemaVersion: 1,
    };
  }
}

export class EvidenceClassificationDecisionDocument extends AppendOnlyDocument<
  EvidenceClassificationDecisionSnapshot,
  PersistedEvidenceClassificationDecisionRow
> {
  private constructor(snapshot: EvidenceClassificationDecisionSnapshot) {
    super(EvidenceClassificationDecisionDocument.normalize(snapshot));
  }

  static create(
    input: Omit<EvidenceClassificationDecisionSnapshot, "version">,
  ): EvidenceClassificationDecisionDocument {
    return new EvidenceClassificationDecisionDocument({ ...input, version: 1 });
  }

  static hydrate(
    snapshot: EvidenceClassificationDecisionSnapshot,
  ): EvidenceClassificationDecisionDocument {
    return new EvidenceClassificationDecisionDocument(snapshot);
  }

  private static normalize(
    snapshot: EvidenceClassificationDecisionSnapshot,
  ): EvidenceClassificationDecisionSnapshot {
    return {
      ...snapshot,
      classificationDecisionId: requireRef(
        snapshot.classificationDecisionId,
        "classificationDecisionId",
      ),
      requestId: requireRef(snapshot.requestId, "requestId"),
      triggeringSnapshotRef: optionalRef(snapshot.triggeringSnapshotRef),
      evidenceAssimilationRef: requireRef(
        snapshot.evidenceAssimilationRef,
        "evidenceAssimilationRef",
      ),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      classifiedEvidenceRefs: uniqueSortedRefs(snapshot.classifiedEvidenceRefs),
      classifierVersionRef: requireRef(snapshot.classifierVersionRef, "classifierVersionRef"),
      triggerReasonCodes: uniqueSortedRefs(snapshot.triggerReasonCodes),
      activeDependencyRefs: uniqueSortedRefs(snapshot.activeDependencyRefs),
      supersedesDecisionRef: optionalRef(snapshot.supersedesDecisionRef),
      decidedByRef: requireRef(snapshot.decidedByRef, "decidedByRef"),
      decidedAt: ensureIsoTimestamp(snapshot.decidedAt, "decidedAt"),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toPersistedRow(): PersistedEvidenceClassificationDecisionRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "EvidenceClassificationDecision",
      persistenceSchemaVersion: 1,
    };
  }
}

export class SafetyPreemptionRecordDocument extends AppendOnlyDocument<
  SafetyPreemptionRecordSnapshot,
  PersistedSafetyPreemptionRecordRow
> {
  private constructor(snapshot: SafetyPreemptionRecordSnapshot) {
    super(SafetyPreemptionRecordDocument.normalize(snapshot));
  }

  static create(
    input: Omit<SafetyPreemptionRecordSnapshot, "version">,
  ): SafetyPreemptionRecordDocument {
    return new SafetyPreemptionRecordDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: SafetyPreemptionRecordSnapshot): SafetyPreemptionRecordDocument {
    return new SafetyPreemptionRecordDocument(snapshot);
  }

  private static normalize(
    snapshot: SafetyPreemptionRecordSnapshot,
  ): SafetyPreemptionRecordSnapshot {
    return {
      ...snapshot,
      preemptionId: requireRef(snapshot.preemptionId, "preemptionId"),
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      triggeringSnapshotRef: optionalRef(snapshot.triggeringSnapshotRef),
      evidenceAssimilationRef: requireRef(
        snapshot.evidenceAssimilationRef,
        "evidenceAssimilationRef",
      ),
      materialDeltaAssessmentRef: requireRef(
        snapshot.materialDeltaAssessmentRef,
        "materialDeltaAssessmentRef",
      ),
      classificationDecisionRef: requireRef(
        snapshot.classificationDecisionRef,
        "classificationDecisionRef",
      ),
      openingSafetyEpoch: ensurePositiveInteger(snapshot.openingSafetyEpoch, "openingSafetyEpoch"),
      blockingActionScopeRefs: uniqueSortedRefs(snapshot.blockingActionScopeRefs),
      reasonCode: requireRef(snapshot.reasonCode, "reasonCode"),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      resolvedAt: optionalRef(snapshot.resolvedAt),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toPersistedRow(): PersistedSafetyPreemptionRecordRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "SafetyPreemptionRecord",
      persistenceSchemaVersion: 1,
    };
  }
}

export class SafetyDecisionRecordDocument extends AppendOnlyDocument<
  SafetyDecisionRecordSnapshot,
  PersistedSafetyDecisionRecordRow
> {
  private constructor(snapshot: SafetyDecisionRecordSnapshot) {
    super(SafetyDecisionRecordDocument.normalize(snapshot));
  }

  static create(
    input: Omit<SafetyDecisionRecordSnapshot, "version">,
  ): SafetyDecisionRecordDocument {
    return new SafetyDecisionRecordDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: SafetyDecisionRecordSnapshot): SafetyDecisionRecordDocument {
    return new SafetyDecisionRecordDocument(snapshot);
  }

  private static normalize(snapshot: SafetyDecisionRecordSnapshot): SafetyDecisionRecordSnapshot {
    return {
      ...snapshot,
      safetyDecisionId: requireRef(snapshot.safetyDecisionId, "safetyDecisionId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      preemptionRef: requireRef(snapshot.preemptionRef, "preemptionRef"),
      classificationDecisionRef: requireRef(
        snapshot.classificationDecisionRef,
        "classificationDecisionRef",
      ),
      compositeSnapshotRef: optionalRef(snapshot.compositeSnapshotRef),
      rulePackVersionRef: requireRef(snapshot.rulePackVersionRef, "rulePackVersionRef"),
      calibratorVersionRef: requireRef(snapshot.calibratorVersionRef, "calibratorVersionRef"),
      decisionTupleHash: requireRef(snapshot.decisionTupleHash, "decisionTupleHash"),
      hardStopRuleRefs: uniqueSortedRefs(snapshot.hardStopRuleRefs),
      urgentContributorRuleRefs: uniqueSortedRefs(snapshot.urgentContributorRuleRefs),
      residualContributorRuleRefs: uniqueSortedRefs(snapshot.residualContributorRuleRefs),
      activeReachabilityDependencyRefs: uniqueSortedRefs(snapshot.activeReachabilityDependencyRefs),
      conflictVectorRef: optionalRef(snapshot.conflictVectorRef),
      criticalMissingnessRef: optionalRef(snapshot.criticalMissingnessRef),
      resultingSafetyEpoch: ensurePositiveInteger(
        snapshot.resultingSafetyEpoch,
        "resultingSafetyEpoch",
      ),
      supersedesSafetyDecisionRef: optionalRef(snapshot.supersedesSafetyDecisionRef),
      decidedAt: ensureIsoTimestamp(snapshot.decidedAt, "decidedAt"),
      settledAt: optionalRef(snapshot.settledAt),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toPersistedRow(): PersistedSafetyDecisionRecordRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "SafetyDecisionRecord",
      persistenceSchemaVersion: 1,
    };
  }
}

export class UrgentDiversionSettlementDocument extends AppendOnlyDocument<
  UrgentDiversionSettlementSnapshot,
  PersistedUrgentDiversionSettlementRow
> {
  private constructor(snapshot: UrgentDiversionSettlementSnapshot) {
    super(UrgentDiversionSettlementDocument.normalize(snapshot));
  }

  static create(
    input: Omit<UrgentDiversionSettlementSnapshot, "version">,
  ): UrgentDiversionSettlementDocument {
    return new UrgentDiversionSettlementDocument({ ...input, version: 1 });
  }

  static hydrate(snapshot: UrgentDiversionSettlementSnapshot): UrgentDiversionSettlementDocument {
    return new UrgentDiversionSettlementDocument(snapshot);
  }

  private static normalize(
    snapshot: UrgentDiversionSettlementSnapshot,
  ): UrgentDiversionSettlementSnapshot {
    return {
      ...snapshot,
      urgentDiversionSettlementId: requireRef(
        snapshot.urgentDiversionSettlementId,
        "urgentDiversionSettlementId",
      ),
      requestId: requireRef(snapshot.requestId, "requestId"),
      preemptionRef: requireRef(snapshot.preemptionRef, "preemptionRef"),
      safetyDecisionRef: requireRef(snapshot.safetyDecisionRef, "safetyDecisionRef"),
      presentationArtifactRef: optionalRef(snapshot.presentationArtifactRef),
      authoritativeActionRef: optionalRef(snapshot.authoritativeActionRef),
      supersedesSettlementRef: optionalRef(snapshot.supersedesSettlementRef),
      issuedAt: optionalRef(snapshot.issuedAt),
      settledAt: optionalRef(snapshot.settledAt),
      version: ensurePositiveInteger(snapshot.version, "version"),
    };
  }

  toPersistedRow(): PersistedUrgentDiversionSettlementRow {
    return {
      ...this.toSnapshot(),
      aggregateType: "UrgentDiversionSettlement",
      persistenceSchemaVersion: 1,
    };
  }
}

export interface EvidenceAssimilationRecordRepository {
  saveEvidenceAssimilationRecord(
    row: PersistedEvidenceAssimilationRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getEvidenceAssimilationRecord(
    evidenceAssimilationId: string,
  ): Promise<PersistedEvidenceAssimilationRecordRow | null>;
  listEvidenceAssimilationRecordsByRequest(
    requestId: string,
  ): Promise<PersistedEvidenceAssimilationRecordRow[]>;
  findEquivalentEvidenceAssimilation(
    requestId: string,
    sourceDomain: EvidenceIngressSourceDomain,
    governingObjectRef: string,
    ingressEvidenceRefs: readonly string[],
  ): Promise<PersistedEvidenceAssimilationRecordRow | null>;
}

export interface MaterialDeltaAssessmentRepository {
  saveMaterialDeltaAssessment(
    row: PersistedMaterialDeltaAssessmentRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getMaterialDeltaAssessment(
    materialDeltaAssessmentId: string,
  ): Promise<PersistedMaterialDeltaAssessmentRow | null>;
  listMaterialDeltaAssessmentsByRequest(
    requestId: string,
  ): Promise<PersistedMaterialDeltaAssessmentRow[]>;
}

export interface EvidenceClassificationDecisionRepository {
  saveEvidenceClassificationDecision(
    row: PersistedEvidenceClassificationDecisionRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getEvidenceClassificationDecision(
    classificationDecisionId: string,
  ): Promise<PersistedEvidenceClassificationDecisionRow | null>;
  listEvidenceClassificationDecisionsByRequest(
    requestId: string,
  ): Promise<PersistedEvidenceClassificationDecisionRow[]>;
}

export interface SafetyPreemptionRecordRepository {
  saveSafetyPreemptionRecord(
    row: PersistedSafetyPreemptionRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getSafetyPreemptionRecord(
    preemptionId: string,
  ): Promise<PersistedSafetyPreemptionRecordRow | null>;
  listSafetyPreemptionRecordsByRequest(
    requestId: string,
  ): Promise<PersistedSafetyPreemptionRecordRow[]>;
}

export interface SafetyDecisionRecordRepository {
  saveSafetyDecisionRecord(
    row: PersistedSafetyDecisionRecordRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getSafetyDecisionRecord(
    safetyDecisionId: string,
  ): Promise<PersistedSafetyDecisionRecordRow | null>;
  listSafetyDecisionRecordsByRequest(
    requestId: string,
  ): Promise<PersistedSafetyDecisionRecordRow[]>;
  findLatestSafetyDecisionForRequest(
    requestId: string,
  ): Promise<PersistedSafetyDecisionRecordRow | null>;
}

export interface UrgentDiversionSettlementRepository {
  saveUrgentDiversionSettlement(
    row: PersistedUrgentDiversionSettlementRow,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  getUrgentDiversionSettlement(
    urgentDiversionSettlementId: string,
  ): Promise<PersistedUrgentDiversionSettlementRow | null>;
  listUrgentDiversionSettlementsByRequest(
    requestId: string,
  ): Promise<PersistedUrgentDiversionSettlementRow[]>;
  findLatestUrgentDiversionSettlementForRequest(
    requestId: string,
  ): Promise<PersistedUrgentDiversionSettlementRow | null>;
}

export interface AssimilationSafetyDependencies
  extends EvidenceBackboneDependencies,
    EvidenceAssimilationRecordRepository,
    MaterialDeltaAssessmentRepository,
    EvidenceClassificationDecisionRepository,
    SafetyPreemptionRecordRepository,
    SafetyDecisionRecordRepository,
    UrgentDiversionSettlementRepository {}

export function createAssimilationSafetyStore(
  evidenceBackbone: EvidenceBackboneDependencies = createEvidenceBackboneStore(),
): AssimilationSafetyDependencies {
  const evidenceAssimilations = new Map<string, PersistedEvidenceAssimilationRecordRow>();
  const materialDeltaAssessments = new Map<string, PersistedMaterialDeltaAssessmentRow>();
  const classificationDecisions = new Map<string, PersistedEvidenceClassificationDecisionRow>();
  const safetyPreemptions = new Map<string, PersistedSafetyPreemptionRecordRow>();
  const safetyDecisions = new Map<string, PersistedSafetyDecisionRecordRow>();
  const urgentDiversions = new Map<string, PersistedUrgentDiversionSettlementRow>();

  return {
    registerSourceArtifact: evidenceBackbone.registerSourceArtifact.bind(evidenceBackbone),
    getSourceArtifact: evidenceBackbone.getSourceArtifact.bind(evidenceBackbone),
    listSourceArtifacts: evidenceBackbone.listSourceArtifacts.bind(evidenceBackbone),
    registerDerivedArtifact: evidenceBackbone.registerDerivedArtifact.bind(evidenceBackbone),
    getDerivedArtifact: evidenceBackbone.getDerivedArtifact.bind(evidenceBackbone),
    listDerivedArtifacts: evidenceBackbone.listDerivedArtifacts.bind(evidenceBackbone),
    registerRedactedArtifact: evidenceBackbone.registerRedactedArtifact.bind(evidenceBackbone),
    getRedactedArtifact: evidenceBackbone.getRedactedArtifact.bind(evidenceBackbone),
    listRedactedArtifacts: evidenceBackbone.listRedactedArtifacts.bind(evidenceBackbone),
    getEvidenceCaptureBundle: evidenceBackbone.getEvidenceCaptureBundle.bind(evidenceBackbone),
    saveEvidenceCaptureBundle: evidenceBackbone.saveEvidenceCaptureBundle.bind(evidenceBackbone),
    listEvidenceCaptureBundles: evidenceBackbone.listEvidenceCaptureBundles.bind(evidenceBackbone),
    getEvidenceDerivationPackage:
      evidenceBackbone.getEvidenceDerivationPackage.bind(evidenceBackbone),
    saveEvidenceDerivationPackage:
      evidenceBackbone.saveEvidenceDerivationPackage.bind(evidenceBackbone),
    listEvidenceDerivationPackages:
      evidenceBackbone.listEvidenceDerivationPackages.bind(evidenceBackbone),
    getEvidenceRedactionTransform:
      evidenceBackbone.getEvidenceRedactionTransform.bind(evidenceBackbone),
    saveEvidenceRedactionTransform:
      evidenceBackbone.saveEvidenceRedactionTransform.bind(evidenceBackbone),
    listEvidenceRedactionTransforms:
      evidenceBackbone.listEvidenceRedactionTransforms.bind(evidenceBackbone),
    getEvidenceSummaryParityRecord:
      evidenceBackbone.getEvidenceSummaryParityRecord.bind(evidenceBackbone),
    saveEvidenceSummaryParityRecord:
      evidenceBackbone.saveEvidenceSummaryParityRecord.bind(evidenceBackbone),
    listEvidenceSummaryParityRecords:
      evidenceBackbone.listEvidenceSummaryParityRecords.bind(evidenceBackbone),
    getEvidenceSnapshot: evidenceBackbone.getEvidenceSnapshot.bind(evidenceBackbone),
    saveEvidenceSnapshot: evidenceBackbone.saveEvidenceSnapshot.bind(evidenceBackbone),
    listEvidenceSnapshots: evidenceBackbone.listEvidenceSnapshots.bind(evidenceBackbone),
    getCurrentEvidenceSnapshotForLineage:
      evidenceBackbone.getCurrentEvidenceSnapshotForLineage.bind(evidenceBackbone),

    async saveEvidenceAssimilationRecord(row, _options) {
      appendOnlyInsert(
        evidenceAssimilations,
        row.evidenceAssimilationId,
        row,
        "EvidenceAssimilationRecord",
      );
    },
    async getEvidenceAssimilationRecord(evidenceAssimilationId) {
      return evidenceAssimilations.get(evidenceAssimilationId) ?? null;
    },
    async listEvidenceAssimilationRecordsByRequest(requestId) {
      return [...evidenceAssimilations.values()]
        .filter((row) => row.requestId === requestId)
        .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
    },
    async findEquivalentEvidenceAssimilation(
      requestId,
      sourceDomain,
      governingObjectRef,
      ingressEvidenceRefs,
    ) {
      const signature = buildIngressSignature({
        requestId,
        sourceDomain,
        governingObjectRef,
        ingressEvidenceRefs,
      });
      return (
        [...evidenceAssimilations.values()]
          .filter(
            (row) =>
              buildIngressSignature({
                requestId: row.requestId,
                sourceDomain: row.sourceDomain,
                governingObjectRef: row.governingObjectRef,
                ingressEvidenceRefs: row.ingressEvidenceRefs,
              }) === signature,
          )
          .sort((left, right) => compareIso(left.decidedAt, right.decidedAt))
          .at(-1) ?? null
      );
    },

    async saveMaterialDeltaAssessment(row, _options) {
      appendOnlyInsert(
        materialDeltaAssessments,
        row.materialDeltaAssessmentId,
        row,
        "MaterialDeltaAssessment",
      );
    },
    async getMaterialDeltaAssessment(materialDeltaAssessmentId) {
      return materialDeltaAssessments.get(materialDeltaAssessmentId) ?? null;
    },
    async listMaterialDeltaAssessmentsByRequest(requestId) {
      return [...materialDeltaAssessments.values()]
        .filter((row) => row.requestId === requestId)
        .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
    },

    async saveEvidenceClassificationDecision(row, _options) {
      appendOnlyInsert(
        classificationDecisions,
        row.classificationDecisionId,
        row,
        "EvidenceClassificationDecision",
      );
    },
    async getEvidenceClassificationDecision(classificationDecisionId) {
      return classificationDecisions.get(classificationDecisionId) ?? null;
    },
    async listEvidenceClassificationDecisionsByRequest(requestId) {
      return [...classificationDecisions.values()]
        .filter((row) => row.requestId === requestId)
        .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
    },

    async saveSafetyPreemptionRecord(row, _options) {
      appendOnlyInsert(safetyPreemptions, row.preemptionId, row, "SafetyPreemptionRecord");
    },
    async getSafetyPreemptionRecord(preemptionId) {
      return safetyPreemptions.get(preemptionId) ?? null;
    },
    async listSafetyPreemptionRecordsByRequest(requestId) {
      return [...safetyPreemptions.values()]
        .filter((row) => row.requestId === requestId)
        .sort((left, right) => compareIso(left.createdAt, right.createdAt));
    },

    async saveSafetyDecisionRecord(row, _options) {
      appendOnlyInsert(safetyDecisions, row.safetyDecisionId, row, "SafetyDecisionRecord");
    },
    async getSafetyDecisionRecord(safetyDecisionId) {
      return safetyDecisions.get(safetyDecisionId) ?? null;
    },
    async listSafetyDecisionRecordsByRequest(requestId) {
      return [...safetyDecisions.values()]
        .filter((row) => row.requestId === requestId)
        .sort((left, right) => compareIso(left.decidedAt, right.decidedAt));
    },
    async findLatestSafetyDecisionForRequest(requestId) {
      return (
        [...safetyDecisions.values()]
          .filter((row) => row.requestId === requestId)
          .sort((left, right) => compareIso(left.decidedAt, right.decidedAt))
          .at(-1) ?? null
      );
    },

    async saveUrgentDiversionSettlement(row, _options) {
      appendOnlyInsert(
        urgentDiversions,
        row.urgentDiversionSettlementId,
        row,
        "UrgentDiversionSettlement",
      );
    },
    async getUrgentDiversionSettlement(urgentDiversionSettlementId) {
      return urgentDiversions.get(urgentDiversionSettlementId) ?? null;
    },
    async listUrgentDiversionSettlementsByRequest(requestId) {
      return [...urgentDiversions.values()]
        .filter((row) => row.requestId === requestId)
        .sort((left, right) => compareIso(left.settledAt ?? "", right.settledAt ?? ""));
    },
    async findLatestUrgentDiversionSettlementForRequest(requestId) {
      return (
        [...urgentDiversions.values()]
          .filter((row) => row.requestId === requestId)
          .sort((left, right) =>
            compareIso(
              left.settledAt ?? left.issuedAt ?? "",
              right.settledAt ?? right.issuedAt ?? "",
            ),
          )
          .at(-1) ?? null
      );
    },
  };
}

export interface EvidenceBatchItem {
  evidenceRef: string;
  suggestedClass: EvidenceClass;
  confidence?: number;
  allowListRef?: string | null;
  dependencyRef?: string | null;
  signalRef?: string | null;
}

export interface MaterialDeltaInput {
  changedEvidenceRefs?: readonly string[];
  changedFeatureRefs?: readonly string[];
  changedDependencyRefs?: readonly string[];
  changedChronologyRefs?: readonly string[];
  materialityPolicyRef: string;
  explicitMaterialityClass?: MaterialityClass;
  explicitDecisionBasis?: MaterialDeltaDecisionBasis;
  reasonCodes?: readonly string[];
  degradedFailClosed?: boolean;
  currentPendingPreemptionRef?: string | null;
  supersedesAssessmentRef?: string | null;
  decidedByRef?: string;
}

export interface ClassificationInput {
  classifierVersionRef: string;
  evidenceItems: readonly EvidenceBatchItem[];
  activeDependencyRefs?: readonly string[];
  triggerReasonCodes?: readonly string[];
  confidenceBand?: ConfidenceBand;
  explicitDominantEvidenceClass?: EvidenceClass;
  explicitMisclassificationRiskState?: MisclassificationRiskState;
  manualReviewOverride?: boolean;
  supersedesDecisionRef?: string | null;
  decidedByRef?: string;
}

export interface UrgentDiversionIntent {
  actionMode: UrgentDiversionActionMode;
  settlementState?: UrgentDiversionSettlementState;
  presentationArtifactRef?: string | null;
  authoritativeActionRef?: string | null;
  issuedAt?: string | null;
  settledAt?: string | null;
  supersedesSettlementRef?: string | null;
}

export interface SafetyEvaluationInput {
  requestTypeRef: string;
  featureStates: Record<string, FeatureState>;
  deltaFeatureRefs?: readonly string[];
  deltaDependencyRefs?: readonly string[];
  activeReachabilityDependencyRefs?: readonly string[];
  conflictVectorRef?: string | null;
  criticalMissingnessRef?: string | null;
  priorityHint?: PreemptionPriority;
  blockingActionScopeRefs?: readonly string[];
  reasonCode?: string;
  urgentDiversionIntent?: UrgentDiversionIntent | null;
  preferredRulePackVersionRef?: string | null;
  preferredCalibratorVersionRef?: string | null;
  supersedesSafetyDecisionRef?: string | null;
}

export interface CandidateSnapshotIntent
  extends Omit<
    CreateEvidenceSnapshotInput,
    | "evidenceSnapshotId"
    | "supersedesEvidenceSnapshotRef"
    | "materialDeltaDisposition"
    | "createdAt"
  > {
  evidenceSnapshotId?: string;
  createdAt?: string;
}

export interface AssimilateEvidenceIngressInput {
  episodeId: string;
  requestId: string;
  sourceDomain: EvidenceIngressSourceDomain;
  governingObjectRef: string;
  ingressEvidenceRefs: readonly string[];
  decidedAt: string;
  currentSafetyDecisionEpoch?: number;
  currentPendingPreemptionRef?: string | null;
  currentPendingSafetyEpoch?: number | null;
  priorCompositeSnapshotRef?: string | null;
  candidateSnapshotIntent?: CandidateSnapshotIntent | null;
  materialDelta: MaterialDeltaInput;
  classification: ClassificationInput;
  safetyEvaluation: SafetyEvaluationInput;
  replayClassHint?: "exact_replay" | "semantic_replay" | null;
}

export interface SafetyRuleEvaluationContext {
  readonly classification: EvidenceClassificationDecisionSnapshot;
  readonly featureStates: Readonly<Record<string, FeatureState>>;
  readonly activeReachabilityDependencyRefs: readonly string[];
}

export interface SafetyRuleDefinition {
  ruleRef: string;
  ruleKind: RuleKind;
  dependencyGroupRef: string;
  antecedentFeatureRefs: readonly string[];
  antecedentDependencyRefs?: readonly string[];
  missingnessMode?: RuleMissingnessMode;
  weight: number;
  description: string;
  evaluate?: (context: SafetyRuleEvaluationContext) => boolean;
}

export interface SafetyRuleGroupCap {
  urgentCap: number;
  residualCap: number;
}

export interface SafetyRulePack {
  requestTypeRef: string;
  rulePackVersionRef: string;
  calibratorVersionRef: string;
  urgentThreshold: number;
  residualThreshold: number;
  contradictionThreshold: number;
  missingnessThreshold: number;
  urgentBias: number;
  residualBias: number;
  groupCaps: Readonly<Record<string, SafetyRuleGroupCap>>;
  rules: readonly SafetyRuleDefinition[];
}

export interface SafetyRulePackLoader {
  loadRulePack(
    requestTypeRef: string,
    preferredRulePackVersionRef?: string | null,
    preferredCalibratorVersionRef?: string | null,
  ): Promise<SafetyRulePack>;
}

export interface SafetyEvaluationCacheEntry {
  requestId: string;
  rulePackVersionRef: string;
  calibratorVersionRef: string;
  featureStates: Record<string, FeatureState>;
  ruleHits: Record<string, boolean>;
  decisionTupleHash: string;
}

export interface IncrementalRuleEvaluationResult {
  rulePackVersionRef: string;
  calibratorVersionRef: string;
  impactedRuleRefs: readonly string[];
  evaluatedRuleRefs: readonly string[];
  hardStopRuleRefs: readonly string[];
  urgentContributorRuleRefs: readonly string[];
  residualContributorRuleRefs: readonly string[];
  urgentProbability: number;
  residualProbability: number;
  criticalMissingnessRef: string | null;
  conflictVectorRef: string | null;
  decisionTupleHash: string;
}

export class StaticSafetyRulePackLoader implements SafetyRulePackLoader {
  async loadRulePack(
    requestTypeRef: string,
    preferredRulePackVersionRef?: string | null,
    preferredCalibratorVersionRef?: string | null,
  ): Promise<SafetyRulePack> {
    const rulePackVersionRef = preferredRulePackVersionRef ?? "safety_rule_pack_v1";
    const calibratorVersionRef = preferredCalibratorVersionRef ?? "safety_calibrator_v1";

    return {
      requestTypeRef,
      rulePackVersionRef,
      calibratorVersionRef,
      urgentThreshold: 0.66,
      residualThreshold: 0.42,
      contradictionThreshold: 0.35,
      missingnessThreshold: 0.2,
      urgentBias: -0.45,
      residualBias: -0.35,
      groupCaps: {
        clinical_red_flags: { urgentCap: 1.8, residualCap: 0.7 },
        contact_failures: { urgentCap: 1.1, residualCap: 0.9 },
        chronology_shifts: { urgentCap: 0.8, residualCap: 0.6 },
        consent_and_pharmacy: { urgentCap: 0.9, residualCap: 0.8 },
        contradiction_burden: { urgentCap: 1.2, residualCap: 0.7 },
      },
      rules: [
        {
          ruleRef: "RULE_HARDSTOP_URGENT_RED_FLAG",
          ruleKind: "hard_stop",
          dependencyGroupRef: "clinical_red_flags",
          antecedentFeatureRefs: ["urgent_red_flag", "respiratory_distress", "severe_bleeding"],
          missingnessMode: "conservative_hold",
          weight: 1.9,
          description: "Critical urgent clinical antecedent remains present or unresolved.",
        },
        {
          ruleRef: "RULE_URGENT_CALLBACK_FAILURE",
          ruleKind: "urgent",
          dependencyGroupRef: "contact_failures",
          antecedentFeatureRefs: ["urgent_contact_failure", "callback_unreachable"],
          antecedentDependencyRefs: ["reachability_callback", "reachability_urgent_return"],
          weight: 1.2,
          description: "Urgent callback or urgent return dependency failed.",
        },
        {
          ruleRef: "RULE_URGENT_CRITICAL_CONTRADICTION",
          ruleKind: "urgent",
          dependencyGroupRef: "contradiction_burden",
          antecedentFeatureRefs: ["critical_contradiction"],
          weight: 1.15,
          description: "High-burden contradiction preserves urgent handling.",
          evaluate: (context) =>
            context.featureStates.critical_contradiction === "present" ||
            context.featureStates.critical_contradiction === "unresolved",
        },
        {
          ruleRef: "RULE_RESIDUAL_NEW_CLINICAL_DETAIL",
          ruleKind: "residual",
          dependencyGroupRef: "clinical_red_flags",
          antecedentFeatureRefs: ["new_clinical_detail", "symptom_worsened"],
          weight: 0.85,
          description: "New or worsened clinical detail requires residual review.",
        },
        {
          ruleRef: "RULE_RESIDUAL_CHRONOLOGY_DRIFT",
          ruleKind: "residual",
          dependencyGroupRef: "chronology_shifts",
          antecedentFeatureRefs: ["backdated_event", "timing_conflict"],
          weight: 0.75,
          description: "Chronology drift requires re-safety or review.",
        },
        {
          ruleRef: "RULE_RESIDUAL_CONSENT_WITHDRAWAL",
          ruleKind: "residual",
          dependencyGroupRef: "consent_and_pharmacy",
          antecedentFeatureRefs: ["consent_withdrawn", "weak_pharmacy_match"],
          weight: 0.9,
          description: "Pharmacy consent or match drift requires manual review.",
        },
      ],
    };
  }
}

function buildRuleDependencyMap(rulePack: SafetyRulePack): Map<string, Set<string>> {
  const dependencies = new Map<string, Set<string>>();
  for (const rule of rulePack.rules) {
    for (const featureRef of rule.antecedentFeatureRefs) {
      const set = dependencies.get(featureRef) ?? new Set<string>();
      set.add(rule.ruleRef);
      dependencies.set(featureRef, set);
    }
    for (const dependencyRef of rule.antecedentDependencyRefs ?? []) {
      const set = dependencies.get(dependencyRef) ?? new Set<string>();
      set.add(rule.ruleRef);
      dependencies.set(dependencyRef, set);
    }
  }
  return dependencies;
}

export class IncrementalSafetyRuleEvaluator {
  private readonly cache = new Map<string, SafetyEvaluationCacheEntry>();

  async evaluate(
    requestId: string,
    classification: EvidenceClassificationDecisionSnapshot,
    input: SafetyEvaluationInput,
    loader: SafetyRulePackLoader,
  ): Promise<IncrementalRuleEvaluationResult> {
    const rulePack = await loader.loadRulePack(
      input.requestTypeRef,
      input.preferredRulePackVersionRef,
      input.preferredCalibratorVersionRef,
    );
    const dependencyMap = buildRuleDependencyMap(rulePack);
    const previous = this.cache.get(requestId);
    const deltaRefs = uniqueSortedRefs([
      ...(input.deltaFeatureRefs ?? []),
      ...(input.deltaDependencyRefs ?? []),
    ]);
    const impactedRuleRefs = new Set<string>(
      rulePack.rules.filter((rule) => rule.ruleKind === "hard_stop").map((rule) => rule.ruleRef),
    );
    for (const ref of deltaRefs) {
      for (const ruleRef of dependencyMap.get(ref) ?? []) {
        impactedRuleRefs.add(ruleRef);
      }
    }
    const evaluateAll =
      previous === undefined ||
      previous.rulePackVersionRef !== rulePack.rulePackVersionRef ||
      previous.calibratorVersionRef !== rulePack.calibratorVersionRef ||
      deltaRefs.length === 0;
    const ruleHits = { ...(previous?.ruleHits ?? {}) };
    const context: SafetyRuleEvaluationContext = {
      classification,
      featureStates: input.featureStates,
      activeReachabilityDependencyRefs: uniqueSortedRefs(
        input.activeReachabilityDependencyRefs ?? [],
      ),
    };

    const evaluatedRuleRefs = evaluateAll
      ? rulePack.rules.map((rule) => rule.ruleRef)
      : [...impactedRuleRefs].sort();

    for (const rule of rulePack.rules) {
      if (!evaluateAll && !impactedRuleRefs.has(rule.ruleRef)) {
        continue;
      }
      const dependencyHit = (rule.antecedentDependencyRefs ?? []).some((dependencyRef) =>
        context.activeReachabilityDependencyRefs.includes(dependencyRef),
      );
      const predicateHit =
        rule.evaluate?.(context) ??
        rule.antecedentFeatureRefs.some(
          (featureRef) => context.featureStates[featureRef] === "present",
        );
      ruleHits[rule.ruleRef] = dependencyHit || predicateHit;
    }

    const hardStopRuleRefs = rulePack.rules
      .filter((rule) => {
        if (rule.ruleKind !== "hard_stop") {
          return false;
        }
        if (ruleHits[rule.ruleRef]) {
          return true;
        }
        return (
          rule.missingnessMode === "conservative_hold" &&
          rule.antecedentFeatureRefs.some(
            (featureRef) => context.featureStates[featureRef] === "unresolved",
          )
        );
      })
      .map((rule) => rule.ruleRef)
      .sort();

    const urgentContributorRuleRefs = rulePack.rules
      .filter((rule) => rule.ruleKind === "urgent" && ruleHits[rule.ruleRef])
      .map((rule) => rule.ruleRef)
      .sort();
    const residualContributorRuleRefs = rulePack.rules
      .filter((rule) => rule.ruleKind === "residual" && ruleHits[rule.ruleRef])
      .map((rule) => rule.ruleRef)
      .sort();

    const groupScores = new Map<string, { urgent: number; residual: number }>();
    for (const rule of rulePack.rules) {
      if (!ruleHits[rule.ruleRef]) {
        continue;
      }
      const current = groupScores.get(rule.dependencyGroupRef) ?? { urgent: 0, residual: 0 };
      if (rule.ruleKind === "hard_stop" || rule.ruleKind === "urgent") {
        current.urgent += rule.weight;
      }
      if (rule.ruleKind === "residual") {
        current.residual += rule.weight;
      }
      groupScores.set(rule.dependencyGroupRef, current);
    }

    let urgentScore = rulePack.urgentBias;
    let residualScore = rulePack.residualBias;
    for (const [groupRef, scores] of groupScores.entries()) {
      const caps = rulePack.groupCaps[groupRef];
      urgentScore += Math.min(caps?.urgentCap ?? scores.urgent, scores.urgent);
      residualScore += Math.min(caps?.residualCap ?? scores.residual, scores.residual);
    }
    urgentScore += context.activeReachabilityDependencyRefs.length > 0 ? 0.2 : 0;
    residualScore += context.activeReachabilityDependencyRefs.length > 0 ? 0.15 : 0;

    const urgentProbability = 1 / (1 + Math.exp(-urgentScore));
    const residualProbability = 1 / (1 + Math.exp(-residualScore));

    const criticalMissingFeatures = Object.entries(context.featureStates)
      .filter(([, state]) => state === "unresolved")
      .map(([featureRef]) => featureRef)
      .sort();
    const criticalMissingnessRef =
      input.criticalMissingnessRef ??
      (criticalMissingFeatures.length > 0
        ? `critical_missingness_${sha256Hex(stableStringify(criticalMissingFeatures)).slice(0, 12)}`
        : null);
    const conflictVectorRef =
      input.conflictVectorRef ??
      (context.featureStates.critical_contradiction === "present" ||
      context.featureStates.critical_contradiction === "unresolved"
        ? `conflict_${sha256Hex(requestId).slice(0, 12)}`
        : null);

    const decisionTupleHash = sha256Hex(
      stableStringify({
        requestId,
        rulePackVersionRef: rulePack.rulePackVersionRef,
        calibratorVersionRef: rulePack.calibratorVersionRef,
        hardStopRuleRefs,
        urgentContributorRuleRefs,
        residualContributorRuleRefs,
        urgentProbability,
        residualProbability,
        criticalMissingnessRef,
        conflictVectorRef,
      }),
    );

    this.cache.set(requestId, {
      requestId,
      rulePackVersionRef: rulePack.rulePackVersionRef,
      calibratorVersionRef: rulePack.calibratorVersionRef,
      featureStates: stableStructuredClone(input.featureStates),
      ruleHits,
      decisionTupleHash,
    });

    return {
      rulePackVersionRef: rulePack.rulePackVersionRef,
      calibratorVersionRef: rulePack.calibratorVersionRef,
      impactedRuleRefs: [...impactedRuleRefs].sort(),
      evaluatedRuleRefs,
      hardStopRuleRefs,
      urgentContributorRuleRefs,
      residualContributorRuleRefs,
      urgentProbability: ensureUnitInterval(urgentProbability, "urgentProbability"),
      residualProbability: ensureUnitInterval(residualProbability, "residualProbability"),
      criticalMissingnessRef,
      conflictVectorRef,
      decisionTupleHash,
    };
  }
}

export interface SafetyClassificationResult {
  snapshot: EvidenceClassificationDecisionSnapshot;
}

export interface SafetyEvaluationResult {
  classification: EvidenceClassificationDecisionSnapshot;
  preemption: SafetyPreemptionRecordSnapshot | null;
  safetyDecision: SafetyDecisionRecordSnapshot | null;
  urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  incremental: IncrementalRuleEvaluationResult | null;
}

function deriveMateriality(input: MaterialDeltaInput): {
  materialityClass: MaterialityClass;
  triggerDecision: MaterialDeltaTriggerDecision;
  decisionBasis: MaterialDeltaDecisionBasis;
} {
  const explicit = input.explicitMaterialityClass;
  const changedFeatures = uniqueSortedRefs(input.changedFeatureRefs ?? []);
  const changedDependencies = uniqueSortedRefs(input.changedDependencyRefs ?? []);
  const changedChronology = uniqueSortedRefs(input.changedChronologyRefs ?? []);

  const materialityClass =
    explicit ??
    (input.degradedFailClosed
      ? "unresolved"
      : changedDependencies.length > 0
        ? "contact_safety_material"
        : changedFeatures.length > 0 || changedChronology.length > 0
          ? "safety_material"
          : (input.changedEvidenceRefs?.length ?? 0) > 0
            ? "operational_nonclinical"
            : "technical_only");

  const decisionBasis =
    input.explicitDecisionBasis ??
    (input.degradedFailClosed
      ? "degraded_fail_closed"
      : changedDependencies.length > 0
        ? "dependency_delta"
        : changedChronology.length > 0
          ? "chronology_delta"
          : changedFeatures.includes("critical_contradiction")
            ? "contradiction_delta"
            : changedFeatures.length > 0
              ? "feature_delta"
              : "no_semantic_delta");

  const triggerDecision: MaterialDeltaTriggerDecision =
    materialityClass === "technical_only" || materialityClass === "operational_nonclinical"
      ? "no_re_safety"
      : materialityClass === "unresolved"
        ? "blocked_manual_review"
        : input.currentPendingPreemptionRef
          ? "coalesced_with_pending_preemption"
          : "re_safety_required";

  return { materialityClass, triggerDecision, decisionBasis };
}

function deriveClassification(
  input: ClassificationInput,
  fallbackToPotentiallyClinical: boolean,
): {
  dominantEvidenceClass: EvidenceClass;
  classificationBasis: ClassificationBasis;
  confidenceBand: ConfidenceBand;
  misclassificationRiskState: MisclassificationRiskState;
} {
  const dominantEvidenceClass =
    input.explicitDominantEvidenceClass ??
    (input.evidenceItems.length === 0 && fallbackToPotentiallyClinical
      ? "potentially_clinical"
      : highestEvidenceClass(input.evidenceItems.map((item) => item.suggestedClass)));

  const degraded = input.evidenceItems.some(
    (item) => (item.confidence ?? 1) < 0.5 && item.suggestedClass !== "technical_metadata",
  );
  const confidenceBand =
    input.confidenceBand ??
    (input.evidenceItems.every((item) => (item.confidence ?? 1) >= 0.8)
      ? "high"
      : degraded
        ? "low"
        : "medium");

  const misclassificationRiskState =
    input.explicitMisclassificationRiskState ??
    (degraded
      ? "fail_closed_review"
      : confidenceBand === "low" &&
          (dominantEvidenceClass === "potentially_clinical" ||
            dominantEvidenceClass === "contact_safety_relevant")
        ? "urgent_hold"
        : "ordinary");

  const classificationBasis = input.manualReviewOverride
    ? "manual_review"
    : misclassificationRiskState === "fail_closed_review"
      ? "degraded_fail_closed"
      : dominantEvidenceClass === "technical_metadata" &&
          input.evidenceItems.every((item) => item.allowListRef)
        ? "allow_list"
        : dominantEvidenceClass === "contact_safety_relevant" &&
            input.evidenceItems.some((item) => item.dependencyRef)
          ? "route_dependency"
          : "content_signal";

  return {
    dominantEvidenceClass,
    classificationBasis,
    confidenceBand,
    misclassificationRiskState,
  };
}

export class SafetyOrchestrator {
  private readonly evaluator: IncrementalSafetyRuleEvaluator;

  constructor(
    private readonly repositories: AssimilationSafetyDependencies,
    private readonly rulePackLoader: SafetyRulePackLoader = new StaticSafetyRulePackLoader(),
    evaluator?: IncrementalSafetyRuleEvaluator,
  ) {
    this.evaluator = evaluator ?? new IncrementalSafetyRuleEvaluator();
  }

  async classifyEvidence(input: {
    classificationDecisionId: string;
    requestId: string;
    triggeringSnapshotRef: string | null;
    evidenceAssimilationRef: string;
    sourceDomain: EvidenceIngressSourceDomain;
    governingObjectRef: string;
    classification: ClassificationInput;
    decidedAt: string;
  }): Promise<SafetyClassificationResult> {
    const derived = deriveClassification(input.classification, true);
    const snapshot = EvidenceClassificationDecisionDocument.create({
      classificationDecisionId: input.classificationDecisionId,
      requestId: input.requestId,
      triggeringSnapshotRef: input.triggeringSnapshotRef,
      evidenceAssimilationRef: input.evidenceAssimilationRef,
      sourceDomain: input.sourceDomain,
      governingObjectRef: input.governingObjectRef,
      classifiedEvidenceRefs: uniqueSortedRefs(
        input.classification.evidenceItems.map((item) => item.evidenceRef),
      ),
      classifierVersionRef: requireRef(
        input.classification.classifierVersionRef,
        "classifierVersionRef",
      ),
      dominantEvidenceClass: derived.dominantEvidenceClass,
      classificationBasis: derived.classificationBasis,
      triggerReasonCodes: uniqueSortedRefs(input.classification.triggerReasonCodes ?? []),
      activeDependencyRefs: uniqueSortedRefs(input.classification.activeDependencyRefs ?? []),
      confidenceBand: derived.confidenceBand,
      misclassificationRiskState: derived.misclassificationRiskState,
      decisionState: "applied",
      supersedesDecisionRef: optionalRef(input.classification.supersedesDecisionRef),
      decidedByRef: input.classification.decidedByRef ?? "SafetyOrchestrator",
      decidedAt: input.decidedAt,
    }).toSnapshot();

    await this.repositories.saveEvidenceClassificationDecision(
      EvidenceClassificationDecisionDocument.hydrate(snapshot).toPersistedRow(),
    );
    return { snapshot };
  }

  async evaluateSafety(input: {
    episodeId: string;
    requestId: string;
    sourceDomain: EvidenceIngressSourceDomain;
    evidenceAssimilationRef: string;
    materialDelta: MaterialDeltaAssessmentSnapshot;
    classification: EvidenceClassificationDecisionSnapshot;
    triggeringSnapshotRef: string | null;
    currentSafetyDecisionEpoch: number;
    safetyEvaluation: SafetyEvaluationInput;
    preemptionId: string;
    safetyDecisionId: string;
    urgentDiversionSettlementId?: string | null;
    decidedAt: string;
  }): Promise<SafetyEvaluationResult> {
    const evaluation = await this.evaluator.evaluate(
      input.requestId,
      input.classification,
      input.safetyEvaluation,
      this.rulePackLoader,
    );

    const openingSafetyEpoch = input.currentSafetyDecisionEpoch + 1;
    const urgentOutcome =
      evaluation.hardStopRuleRefs.length > 0 ||
      evaluation.urgentProbability >= 0.66 ||
      input.classification.misclassificationRiskState === "urgent_hold";
    const residualOutcome =
      !urgentOutcome &&
      (evaluation.residualProbability >= 0.42 ||
        Boolean(evaluation.conflictVectorRef) ||
        Boolean(evaluation.criticalMissingnessRef));

    let decisionOutcome: SafetyDecisionOutcome;
    if (input.classification.misclassificationRiskState === "fail_closed_review") {
      decisionOutcome = "fallback_manual_review";
    } else if (urgentOutcome && input.safetyEvaluation.priorityHint === "urgent_live") {
      decisionOutcome = "urgent_live";
    } else if (
      urgentOutcome &&
      input.classification.dominantEvidenceClass === "contact_safety_relevant"
    ) {
      decisionOutcome = "urgent_review";
    } else if (urgentOutcome) {
      decisionOutcome = "urgent_required";
    } else if (residualOutcome) {
      decisionOutcome = "residual_review";
    } else {
      decisionOutcome = "clear_routine";
    }

    const requestedSafetyState: RequestedSafetyState =
      decisionOutcome === "clear_routine"
        ? "screen_clear"
        : decisionOutcome === "residual_review" || decisionOutcome === "fallback_manual_review"
          ? "residual_risk_flagged"
          : "urgent_diversion_required";

    const preemptionStatus: PreemptionStatus =
      decisionOutcome === "clear_routine" || decisionOutcome === "residual_review"
        ? "cleared_routine"
        : decisionOutcome === "fallback_manual_review"
          ? "blocked_manual_review"
          : "escalated_urgent";
    const fallbackState: PreemptionFallbackState =
      decisionOutcome === "fallback_manual_review"
        ? input.classification.misclassificationRiskState === "fail_closed_review"
          ? "artifact_degraded"
          : "manual_review_required"
        : "none";

    const preemption = SafetyPreemptionRecordDocument.create({
      preemptionId: input.preemptionId,
      episodeId: input.episodeId,
      requestId: input.requestId,
      triggeringSnapshotRef: input.triggeringSnapshotRef,
      evidenceAssimilationRef: input.evidenceAssimilationRef,
      materialDeltaAssessmentRef: input.materialDelta.materialDeltaAssessmentId,
      classificationDecisionRef: input.classification.classificationDecisionId,
      sourceDomain: input.sourceDomain,
      evidenceClass: input.classification.dominantEvidenceClass,
      openingSafetyEpoch,
      blockingActionScopeRefs: uniqueSortedRefs(
        input.safetyEvaluation.blockingActionScopeRefs ?? [],
      ),
      priority: input.safetyEvaluation.priorityHint ?? "routine_review",
      reasonCode: input.safetyEvaluation.reasonCode ?? input.materialDelta.triggerDecision,
      fallbackState,
      status: preemptionStatus,
      createdAt: input.decidedAt,
      resolvedAt:
        preemptionStatus === "cleared_routine" || preemptionStatus === "escalated_urgent"
          ? input.decidedAt
          : null,
    }).toSnapshot();
    await this.repositories.saveSafetyPreemptionRecord(
      SafetyPreemptionRecordDocument.hydrate(preemption).toPersistedRow(),
    );

    const safetyDecision = SafetyDecisionRecordDocument.create({
      safetyDecisionId: input.safetyDecisionId,
      requestId: input.requestId,
      preemptionRef: preemption.preemptionId,
      classificationDecisionRef: input.classification.classificationDecisionId,
      compositeSnapshotRef: input.triggeringSnapshotRef,
      sourceDomain: input.sourceDomain,
      rulePackVersionRef: evaluation.rulePackVersionRef,
      calibratorVersionRef: evaluation.calibratorVersionRef,
      decisionTupleHash: evaluation.decisionTupleHash,
      hardStopRuleRefs: evaluation.hardStopRuleRefs,
      urgentContributorRuleRefs: evaluation.urgentContributorRuleRefs,
      residualContributorRuleRefs: evaluation.residualContributorRuleRefs,
      activeReachabilityDependencyRefs: uniqueSortedRefs(
        input.safetyEvaluation.activeReachabilityDependencyRefs ?? [],
      ),
      conflictVectorRef: evaluation.conflictVectorRef,
      criticalMissingnessRef: evaluation.criticalMissingnessRef,
      decisionOutcome,
      requestedSafetyState,
      decisionState: "settled",
      resultingSafetyEpoch: openingSafetyEpoch,
      supersedesSafetyDecisionRef: optionalRef(input.safetyEvaluation.supersedesSafetyDecisionRef),
      decidedAt: input.decidedAt,
      settledAt: input.decidedAt,
    }).toSnapshot();
    await this.repositories.saveSafetyDecisionRecord(
      SafetyDecisionRecordDocument.hydrate(safetyDecision).toPersistedRow(),
    );

    let urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null = null;
    if (
      decisionOutcome === "urgent_required" ||
      decisionOutcome === "urgent_live" ||
      decisionOutcome === "urgent_review"
    ) {
      const intent = input.safetyEvaluation.urgentDiversionIntent;
      urgentDiversionSettlement = UrgentDiversionSettlementDocument.create({
        urgentDiversionSettlementId:
          input.urgentDiversionSettlementId ??
          `urgent_diversion_${sha256Hex(`${input.requestId}:${input.decidedAt}`).slice(0, 16)}`,
        requestId: input.requestId,
        preemptionRef: preemption.preemptionId,
        safetyDecisionRef: safetyDecision.safetyDecisionId,
        actionMode: intent?.actionMode ?? "urgent_guidance_presented",
        presentationArtifactRef: optionalRef(intent?.presentationArtifactRef),
        authoritativeActionRef: optionalRef(intent?.authoritativeActionRef),
        settlementState: intent?.settlementState ?? "pending",
        supersedesSettlementRef: optionalRef(intent?.supersedesSettlementRef),
        issuedAt: optionalRef(intent?.issuedAt) ?? null,
        settledAt: optionalRef(intent?.settledAt) ?? null,
      }).toSnapshot();
      await this.repositories.saveUrgentDiversionSettlement(
        UrgentDiversionSettlementDocument.hydrate(urgentDiversionSettlement).toPersistedRow(),
      );
    }

    return {
      classification: input.classification,
      preemption,
      safetyDecision,
      urgentDiversionSettlement,
      incremental: evaluation,
    };
  }
}

export interface EvidenceAssimilationSettlement {
  assimilationRecord: EvidenceAssimilationRecordSnapshot;
  materialDelta: MaterialDeltaAssessmentSnapshot;
  classification: EvidenceClassificationDecisionSnapshot;
  resultingSnapshot: EvidenceSnapshotDocument | null;
  preemption: SafetyPreemptionRecordSnapshot | null;
  safetyDecision: SafetyDecisionRecordSnapshot | null;
  urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  replayDisposition: "distinct" | "exact_replay" | "semantic_replay" | "coalesced_inflight";
  incremental: IncrementalRuleEvaluationResult | null;
}

export class CanonicalEvidenceAssimilationCoordinator {
  private readonly inFlight = new Map<string, Promise<EvidenceAssimilationSettlement>>();

  constructor(
    private readonly repositories: AssimilationSafetyDependencies,
    private readonly evidenceBackbone: EvidenceBackboneServices,
    private readonly safetyOrchestrator: SafetyOrchestrator,
    private readonly idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator(
      "assimilation_safety",
    ),
  ) {}

  async assimilateEvidence(
    input: AssimilateEvidenceIngressInput,
  ): Promise<EvidenceAssimilationSettlement> {
    const ingressKey = buildIngressSignature({
      requestId: input.requestId,
      sourceDomain: input.sourceDomain,
      governingObjectRef: input.governingObjectRef,
      ingressEvidenceRefs: input.ingressEvidenceRefs,
    });

    const existing = await this.repositories.findEquivalentEvidenceAssimilation(
      input.requestId,
      input.sourceDomain,
      input.governingObjectRef,
      input.ingressEvidenceRefs,
    );
    if (existing) {
      return this.hydrateSettlement(existing, input.replayClassHint ?? "exact_replay");
    }

    const currentPromise = this.inFlight.get(ingressKey);
    if (currentPromise) {
      return currentPromise.then((result) => ({
        ...result,
        replayDisposition: "coalesced_inflight",
      }));
    }

    const promise = this.assimilateInternal(input);
    this.inFlight.set(ingressKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(ingressKey);
    }
  }

  private async assimilateInternal(
    input: AssimilateEvidenceIngressInput,
  ): Promise<EvidenceAssimilationSettlement> {
    const decidedAt = ensureIsoTimestamp(input.decidedAt, "decidedAt");
    const evidenceAssimilationId = nextSafetyId(this.idGenerator, "evidenceAssimilation");
    const materialDeltaAssessmentId = nextSafetyId(this.idGenerator, "materialDeltaAssessment");
    const classificationDecisionId = nextSafetyId(
      this.idGenerator,
      "evidenceClassificationDecision",
    );
    const preemptionId = nextSafetyId(this.idGenerator, "safetyPreemption");
    const safetyDecisionId = nextSafetyId(this.idGenerator, "safetyDecision");
    const urgentDiversionSettlementId = nextSafetyId(this.idGenerator, "urgentDiversionSettlement");

    const currentSnapshot =
      optionalRef(input.priorCompositeSnapshotRef) !== null
        ? await this.repositories.getEvidenceSnapshot(input.priorCompositeSnapshotRef ?? "")
        : await this.repositories.getCurrentEvidenceSnapshotForLineage(input.requestId);
    const priorCompositeSnapshotRef = currentSnapshot?.evidenceSnapshotId ?? null;

    const materiality = deriveMateriality({
      ...input.materialDelta,
      currentPendingPreemptionRef: input.currentPendingPreemptionRef,
    });

    let attachmentDisposition: EvidenceAttachmentDisposition;
    let resultingSnapshot: EvidenceSnapshotDocument | null = null;
    if (input.replayClassHint) {
      attachmentDisposition = "replay_existing";
    } else if (
      materiality.materialityClass === "technical_only" ||
      materiality.materialityClass === "operational_nonclinical"
    ) {
      attachmentDisposition = "derivative_only";
    } else if (!input.candidateSnapshotIntent) {
      attachmentDisposition = "hold_pending_review";
    } else {
      attachmentDisposition = "new_snapshot";
      resultingSnapshot = await this.evidenceBackbone.snapshots.createEvidenceSnapshot({
        evidenceSnapshotId: input.candidateSnapshotIntent.evidenceSnapshotId,
        captureBundleRef: input.candidateSnapshotIntent.captureBundleRef,
        authoritativeNormalizedDerivationPackageRef:
          input.candidateSnapshotIntent.authoritativeNormalizedDerivationPackageRef,
        authoritativeDerivedFactsPackageRef:
          input.candidateSnapshotIntent.authoritativeDerivedFactsPackageRef ?? null,
        currentSummaryParityRecordRef:
          input.candidateSnapshotIntent.currentSummaryParityRecordRef ?? null,
        supersedesEvidenceSnapshotRef: priorCompositeSnapshotRef,
        materialDeltaDisposition: toSnapshotDisposition(materiality.materialityClass),
        createdAt: input.candidateSnapshotIntent.createdAt ?? decidedAt,
      });
    }

    const candidateSnapshotRef =
      attachmentDisposition === "new_snapshot"
        ? (resultingSnapshot?.evidenceSnapshotId ?? null)
        : null;

    const materialDelta = MaterialDeltaAssessmentDocument.create({
      materialDeltaAssessmentId,
      requestId: input.requestId,
      evidenceAssimilationRef: evidenceAssimilationId,
      sourceDomain: input.sourceDomain,
      governingObjectRef: input.governingObjectRef,
      priorCompositeSnapshotRef,
      candidateSnapshotRef,
      changedEvidenceRefs: uniqueSortedRefs(
        input.materialDelta.changedEvidenceRefs ?? input.ingressEvidenceRefs,
      ),
      changedFeatureRefs: uniqueSortedRefs(input.materialDelta.changedFeatureRefs ?? []),
      changedDependencyRefs: uniqueSortedRefs(input.materialDelta.changedDependencyRefs ?? []),
      changedChronologyRefs: uniqueSortedRefs(input.materialDelta.changedChronologyRefs ?? []),
      materialityPolicyRef: input.materialDelta.materialityPolicyRef,
      materialityClass: materiality.materialityClass,
      triggerDecision: materiality.triggerDecision,
      decisionBasis: materiality.decisionBasis,
      reasonCodes: uniqueSortedRefs(input.materialDelta.reasonCodes ?? []),
      supersedesAssessmentRef: optionalRef(input.materialDelta.supersedesAssessmentRef),
      decidedByRef: input.materialDelta.decidedByRef ?? "CanonicalEvidenceAssimilationCoordinator",
      decidedAt,
    }).toSnapshot();
    await this.repositories.saveMaterialDeltaAssessment(
      MaterialDeltaAssessmentDocument.hydrate(materialDelta).toPersistedRow(),
    );

    const classificationResult = await this.safetyOrchestrator.classifyEvidence({
      classificationDecisionId,
      requestId: input.requestId,
      triggeringSnapshotRef: candidateSnapshotRef ?? priorCompositeSnapshotRef,
      evidenceAssimilationRef: evidenceAssimilationId,
      sourceDomain: input.sourceDomain,
      governingObjectRef: input.governingObjectRef,
      classification: input.classification,
      decidedAt,
    });

    let preemption: SafetyPreemptionRecordSnapshot | null = null;
    let safetyDecision: SafetyDecisionRecordSnapshot | null = null;
    let urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null = null;
    let resultingSafetyEpoch = input.currentSafetyDecisionEpoch ?? 0;
    let incremental: IncrementalRuleEvaluationResult | null = null;
    let resultingPreemptionRef: string | null = null;
    let assimilationState: AssimilationState;

    if (materialDelta.triggerDecision === "no_re_safety") {
      assimilationState = "settled_no_re_safety";
    } else if (materialDelta.triggerDecision === "coalesced_with_pending_preemption") {
      assimilationState = "pending_preemption";
      resultingSafetyEpoch = ensureNonNegativeInteger(
        input.currentPendingSafetyEpoch ?? resultingSafetyEpoch,
        "currentPendingSafetyEpoch",
      );
      resultingPreemptionRef = optionalRef(input.currentPendingPreemptionRef);
    } else {
      const safety = await this.safetyOrchestrator.evaluateSafety({
        episodeId: input.episodeId,
        requestId: input.requestId,
        sourceDomain: input.sourceDomain,
        evidenceAssimilationRef: evidenceAssimilationId,
        materialDelta,
        classification: classificationResult.snapshot,
        triggeringSnapshotRef: candidateSnapshotRef ?? priorCompositeSnapshotRef,
        currentSafetyDecisionEpoch: input.currentSafetyDecisionEpoch ?? 0,
        safetyEvaluation: input.safetyEvaluation,
        preemptionId,
        safetyDecisionId,
        urgentDiversionSettlementId,
        decidedAt,
      });
      preemption = safety.preemption;
      safetyDecision = safety.safetyDecision;
      urgentDiversionSettlement = safety.urgentDiversionSettlement;
      incremental = safety.incremental;
      resultingPreemptionRef = preemption?.preemptionId ?? null;
      resultingSafetyEpoch = safetyDecision?.resultingSafetyEpoch ?? resultingSafetyEpoch;
      assimilationState =
        materialDelta.triggerDecision === "blocked_manual_review" ||
        preemption?.status === "blocked_manual_review"
          ? "blocked_manual_review"
          : "settled_triggered";
    }

    const assimilationRecord = EvidenceAssimilationRecordDocument.create({
      evidenceAssimilationId,
      episodeId: input.episodeId,
      requestId: input.requestId,
      sourceDomain: input.sourceDomain,
      governingObjectRef: input.governingObjectRef,
      ingressEvidenceRefs: uniqueSortedRefs(input.ingressEvidenceRefs),
      priorCompositeSnapshotRef,
      resultingSnapshotRef:
        attachmentDisposition === "replay_existing"
          ? priorCompositeSnapshotRef
          : (resultingSnapshot?.evidenceSnapshotId ?? null),
      materialDeltaAssessmentRef: materialDelta.materialDeltaAssessmentId,
      classificationDecisionRef: classificationResult.snapshot.classificationDecisionId,
      resultingPreemptionRef,
      attachmentDisposition,
      assimilationState,
      resultingSafetyEpoch,
      decidedAt,
    }).toSnapshot();
    await this.repositories.saveEvidenceAssimilationRecord(
      EvidenceAssimilationRecordDocument.hydrate(assimilationRecord).toPersistedRow(),
    );

    return {
      assimilationRecord,
      materialDelta,
      classification: classificationResult.snapshot,
      resultingSnapshot,
      preemption,
      safetyDecision,
      urgentDiversionSettlement,
      replayDisposition: "distinct",
      incremental,
    };
  }

  private async hydrateSettlement(
    existing: PersistedEvidenceAssimilationRecordRow,
    replayDisposition: "exact_replay" | "semantic_replay",
  ): Promise<EvidenceAssimilationSettlement> {
    const materialDelta = await this.repositories.getMaterialDeltaAssessment(
      existing.materialDeltaAssessmentRef,
    );
    const classification = await this.repositories.getEvidenceClassificationDecision(
      existing.classificationDecisionRef,
    );
    invariant(materialDelta !== null, "MISSING_MATERIAL_DELTA", "MaterialDeltaAssessment missing.");
    invariant(
      classification !== null,
      "MISSING_CLASSIFICATION",
      "EvidenceClassificationDecision missing.",
    );
    const preemption = existing.resultingPreemptionRef
      ? await this.repositories.getSafetyPreemptionRecord(existing.resultingPreemptionRef)
      : null;
    const safetyDecision = preemption
      ? await this.repositories.findLatestSafetyDecisionForRequest(existing.requestId)
      : null;
    const urgentDiversionSettlement = safetyDecision
      ? await this.repositories.findLatestUrgentDiversionSettlementForRequest(existing.requestId)
      : null;
    const resultingSnapshot = existing.resultingSnapshotRef
      ? ((await this.repositories.getEvidenceSnapshot(existing.resultingSnapshotRef)) ?? null)
      : null;

    return {
      assimilationRecord: EvidenceAssimilationRecordDocument.hydrate(existing).toSnapshot(),
      materialDelta: MaterialDeltaAssessmentDocument.hydrate(materialDelta).toSnapshot(),
      classification: EvidenceClassificationDecisionDocument.hydrate(classification).toSnapshot(),
      resultingSnapshot,
      preemption: preemption
        ? SafetyPreemptionRecordDocument.hydrate(preemption).toSnapshot()
        : null,
      safetyDecision: safetyDecision
        ? SafetyDecisionRecordDocument.hydrate(safetyDecision).toSnapshot()
        : null,
      urgentDiversionSettlement: urgentDiversionSettlement
        ? UrgentDiversionSettlementDocument.hydrate(urgentDiversionSettlement).toSnapshot()
        : null,
      replayDisposition,
      incremental: null,
    };
  }
}

export interface AssimilationSafetyEventCatalogEntry {
  eventName: string;
  contractRef: string;
  stateMeaning: string;
}

export const assimilationSafetyCanonicalEventEntries = [
  {
    eventName: "evidence.assimilation.recorded",
    contractRef: "CEC_EVIDENCE_ASSIMILATION_RECORDED",
    stateMeaning: "Canonical evidence assimilation settled on the active lineage.",
  },
  {
    eventName: "evidence.material_delta.assessed",
    contractRef: "CEC_EVIDENCE_MATERIAL_DELTA_ASSESSED",
    stateMeaning: "Canonical material-delta assessment settled for the ingress batch.",
  },
  {
    eventName: "evidence.classification.applied",
    contractRef: "CEC_EVIDENCE_CLASSIFICATION_APPLIED",
    stateMeaning: "Evidence batch classification settled under the canonical lattice.",
  },
  {
    eventName: "safety.preemption.opened",
    contractRef: "CEC_SAFETY_PREEMPTION_OPENED",
    stateMeaning: "Safety preemption opened for materially meaningful post-submit evidence.",
  },
  {
    eventName: "safety.decision.recorded",
    contractRef: "CEC_SAFETY_DECISION_RECORDED",
    stateMeaning: "Safety truth settled for the active safety epoch.",
  },
  {
    eventName: "safety.urgent_diversion.settled",
    contractRef: "CEC_SAFETY_URGENT_DIVERSION_SETTLED",
    stateMeaning: "Urgent diversion issuance advanced for the current safety decision.",
  },
  {
    eventName: "request.safety_blockers.changed",
    contractRef: "CEC_REQUEST_SAFETY_BLOCKERS_CHANGED",
    stateMeaning: "Routine continuation blockers changed for the request lineage.",
  },
] as const satisfies readonly AssimilationSafetyEventCatalogEntry[];

export const assimilationSafetyParallelInterfaceGaps = [
  {
    gapId: "PARALLEL_INTERFACE_GAP_CALLBACK_OUTCOME_INGRESS_SHAPE",
    description:
      "Callback domains are still in flight, so task 079 publishes a bounded callback ingress envelope instead of waiting for sibling task internals.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_PHARMACY_RETURN_INGRESS_SHAPE",
    description:
      "Pharmacy returns feed the canonical coordinator through a bounded envelope until the full pharmacy loop lands.",
  },
  {
    gapId: "PARALLEL_INTERFACE_GAP_REACHABILITY_ASSESSMENT_BINDING",
    description:
      "ReachabilityGovernor is not complete yet, so current reachability refs enter task 079 as bounded dependency refs rather than full records.",
  },
] as const;

export interface AssimilationSafetyBlockersChangedPayload {
  requestId: string;
  evidenceAssimilationRef: string;
  materialDeltaAssessmentRef: string;
  triggerDecision: MaterialDeltaTriggerDecision;
  resultingSafetyEpoch: number;
}

export function makeEvidenceAssimilationRecordedEvent(
  snapshot: EvidenceAssimilationRecordSnapshot,
): FoundationEventEnvelope<
  Pick<
    EvidenceAssimilationRecordSnapshot,
    "evidenceAssimilationId" | "requestId" | "attachmentDisposition" | "assimilationState"
  >
> {
  return makeFoundationEvent("evidence.assimilation.recorded", {
    evidenceAssimilationId: snapshot.evidenceAssimilationId,
    requestId: snapshot.requestId,
    attachmentDisposition: snapshot.attachmentDisposition,
    assimilationState: snapshot.assimilationState,
  });
}

export function makeMaterialDeltaAssessedEvent(
  snapshot: MaterialDeltaAssessmentSnapshot,
): FoundationEventEnvelope<
  Pick<
    MaterialDeltaAssessmentSnapshot,
    "materialDeltaAssessmentId" | "requestId" | "materialityClass" | "triggerDecision"
  >
> {
  return makeFoundationEvent("evidence.material_delta.assessed", {
    materialDeltaAssessmentId: snapshot.materialDeltaAssessmentId,
    requestId: snapshot.requestId,
    materialityClass: snapshot.materialityClass,
    triggerDecision: snapshot.triggerDecision,
  });
}

export function makeEvidenceClassificationAppliedEvent(
  snapshot: EvidenceClassificationDecisionSnapshot,
): FoundationEventEnvelope<
  Pick<
    EvidenceClassificationDecisionSnapshot,
    | "classificationDecisionId"
    | "requestId"
    | "dominantEvidenceClass"
    | "misclassificationRiskState"
  >
> {
  return makeFoundationEvent("evidence.classification.applied", {
    classificationDecisionId: snapshot.classificationDecisionId,
    requestId: snapshot.requestId,
    dominantEvidenceClass: snapshot.dominantEvidenceClass,
    misclassificationRiskState: snapshot.misclassificationRiskState,
  });
}

export function makeSafetyPreemptionOpenedEvent(
  snapshot: SafetyPreemptionRecordSnapshot,
): FoundationEventEnvelope<
  Pick<
    SafetyPreemptionRecordSnapshot,
    "preemptionId" | "requestId" | "openingSafetyEpoch" | "status"
  >
> {
  return makeFoundationEvent("safety.preemption.opened", {
    preemptionId: snapshot.preemptionId,
    requestId: snapshot.requestId,
    openingSafetyEpoch: snapshot.openingSafetyEpoch,
    status: snapshot.status,
  });
}

export function makeSafetyDecisionRecordedEvent(
  snapshot: SafetyDecisionRecordSnapshot,
): FoundationEventEnvelope<
  Pick<
    SafetyDecisionRecordSnapshot,
    "safetyDecisionId" | "requestId" | "decisionOutcome" | "resultingSafetyEpoch"
  >
> {
  return makeFoundationEvent("safety.decision.recorded", {
    safetyDecisionId: snapshot.safetyDecisionId,
    requestId: snapshot.requestId,
    decisionOutcome: snapshot.decisionOutcome,
    resultingSafetyEpoch: snapshot.resultingSafetyEpoch,
  });
}

export function makeUrgentDiversionSettledEvent(
  snapshot: UrgentDiversionSettlementSnapshot,
): FoundationEventEnvelope<
  Pick<
    UrgentDiversionSettlementSnapshot,
    "urgentDiversionSettlementId" | "requestId" | "actionMode" | "settlementState"
  >
> {
  return makeFoundationEvent("safety.urgent_diversion.settled", {
    urgentDiversionSettlementId: snapshot.urgentDiversionSettlementId,
    requestId: snapshot.requestId,
    actionMode: snapshot.actionMode,
    settlementState: snapshot.settlementState,
  });
}

export function makeRequestSafetyBlockersChangedEvent(
  settlement: EvidenceAssimilationSettlement,
): FoundationEventEnvelope<AssimilationSafetyBlockersChangedPayload> {
  return makeFoundationEvent("request.safety_blockers.changed", {
    requestId: settlement.assimilationRecord.requestId,
    evidenceAssimilationRef: settlement.assimilationRecord.evidenceAssimilationId,
    materialDeltaAssessmentRef: settlement.materialDelta.materialDeltaAssessmentId,
    triggerDecision: settlement.materialDelta.triggerDecision,
    resultingSafetyEpoch: settlement.assimilationRecord.resultingSafetyEpoch,
  });
}

export interface AssimilationSafetyServices {
  evidenceBackbone: EvidenceBackboneServices;
  coordinator: CanonicalEvidenceAssimilationCoordinator;
  safetyOrchestrator: SafetyOrchestrator;
  rulePackLoader: SafetyRulePackLoader;
}

export function createAssimilationSafetyServices(
  repositories: AssimilationSafetyDependencies,
  idGenerator: BackboneIdGenerator = createDeterministicBackboneIdGenerator("assimilation_safety"),
  rulePackLoader: SafetyRulePackLoader = new StaticSafetyRulePackLoader(),
): AssimilationSafetyServices {
  const evidenceBackbone = createEvidenceBackboneServices(repositories);
  const safetyOrchestrator = new SafetyOrchestrator(repositories, rulePackLoader);
  const coordinator = new CanonicalEvidenceAssimilationCoordinator(
    repositories,
    evidenceBackbone,
    safetyOrchestrator,
    idGenerator,
  );
  return {
    evidenceBackbone,
    coordinator,
    safetyOrchestrator,
    rulePackLoader,
  };
}

export function assertRoutineContinuationAllowed(input: {
  latestAssimilation: EvidenceAssimilationRecordSnapshot | null;
  latestPreemption: SafetyPreemptionRecordSnapshot | null;
  latestSafetyDecision: SafetyDecisionRecordSnapshot | null;
  latestUrgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
  expectedSafetyEpoch?: number | null;
}): void {
  const assimilation = input.latestAssimilation;
  if (
    assimilation &&
    [
      "pending_materiality",
      "pending_classification",
      "pending_preemption",
      "blocked_manual_review",
    ].includes(assimilation.assimilationState)
  ) {
    invariant(
      false,
      "ROUTINE_CONTINUATION_BLOCKED_BY_ASSIMILATION",
      "Routine continuation is forbidden while evidence assimilation remains pending or blocked.",
    );
  }
  const preemption = input.latestPreemption;
  if (
    preemption &&
    (preemption.status === "pending" || preemption.status === "blocked_manual_review")
  ) {
    invariant(
      false,
      "ROUTINE_CONTINUATION_BLOCKED_BY_PREEMPTION",
      "Routine continuation is forbidden while safety preemption remains pending or blocked.",
    );
  }
  const safetyDecision = input.latestSafetyDecision;
  if (safetyDecision && safetyDecision.decisionState === "pending_settlement") {
    invariant(
      false,
      "ROUTINE_CONTINUATION_BLOCKED_BY_PENDING_SAFETY_DECISION",
      "Routine continuation is forbidden while the current safety decision remains pending.",
    );
  }
  if (
    safetyDecision?.requestedSafetyState === "urgent_diversion_required" &&
    input.latestUrgentDiversionSettlement?.settlementState !== "issued"
  ) {
    invariant(
      false,
      "ROUTINE_CONTINUATION_BLOCKED_BY_PENDING_URGENT_DIVERSION",
      "urgent_diversion_required may not behave as urgent_diverted before one issued settlement exists.",
    );
  }
  if (
    input.expectedSafetyEpoch !== undefined &&
    input.expectedSafetyEpoch !== null &&
    safetyDecision &&
    safetyDecision.resultingSafetyEpoch !== input.expectedSafetyEpoch
  ) {
    invariant(
      false,
      "ROUTINE_CONTINUATION_BLOCKED_BY_SAFETY_EPOCH_DRIFT",
      "Routine continuation must fail closed when safetyDecisionEpoch drifted.",
    );
  }
}

export function applyAssimilationSafetyToRequest(
  request: RequestAggregate,
  settlement: EvidenceAssimilationSettlement,
): RequestAggregate {
  let next = request.recordEvidence({
    evidenceSnapshotRef:
      settlement.resultingSnapshot?.evidenceSnapshotId ??
      request.toSnapshot().currentEvidenceSnapshotRef ??
      settlement.assimilationRecord.priorCompositeSnapshotRef ??
      "unknown_snapshot_ref",
    evidenceAssimilationRef: settlement.assimilationRecord.evidenceAssimilationId,
    materialDeltaAssessmentRef: settlement.materialDelta.materialDeltaAssessmentId,
    evidenceClassificationRef: settlement.classification.classificationDecisionId,
    updatedAt: settlement.assimilationRecord.decidedAt,
  });

  if (settlement.safetyDecision) {
    next = next.recordSafety({
      safetyState: settlement.safetyDecision.requestedSafetyState,
      safetyDecisionRef: settlement.safetyDecision.safetyDecisionId,
      safetyPreemptionRef: settlement.preemption?.preemptionId ?? null,
      urgentDiversionSettlementRef:
        settlement.urgentDiversionSettlement?.urgentDiversionSettlementId ?? null,
      safetyDecisionEpoch: settlement.safetyDecision.resultingSafetyEpoch,
      updatedAt: settlement.assimilationRecord.decidedAt,
    });
  }

  return next;
}

export interface AssimilationSafetySimulationResult {
  scenarioId: string;
  attachmentDisposition: EvidenceAttachmentDisposition;
  assimilationState: AssimilationState;
  triggerDecision: MaterialDeltaTriggerDecision;
  dominantEvidenceClass: EvidenceClass;
  decisionOutcome: SafetyDecisionOutcome | null;
  requestedSafetyState: RequestedSafetyState | null;
  urgentDiversionState: UrgentDiversionSettlementState | "none";
  replayDisposition: EvidenceAssimilationSettlement["replayDisposition"];
  impactedRuleRefs: readonly string[];
  assimilationRecord: EvidenceAssimilationRecordSnapshot;
  materialDelta: MaterialDeltaAssessmentSnapshot;
  classification: EvidenceClassificationDecisionSnapshot;
  preemption: SafetyPreemptionRecordSnapshot | null;
  safetyDecision: SafetyDecisionRecordSnapshot | null;
  urgentDiversionSettlement: UrgentDiversionSettlementSnapshot | null;
}

export class AssimilationSafetySimulationHarness {
  constructor(private readonly services: AssimilationSafetyServices) {}

  async runAllScenarios(): Promise<readonly AssimilationSafetySimulationResult[]> {
    const seedServices = this.services.evidenceBackbone;

    await seedServices.artifacts.registerSourceArtifact({
      artifactId: "artifact_post_submit_seed_payload",
      locator: "object://evidence/source/post-submit-seed.json",
      checksum: "sha256_post_submit_seed_payload",
      mediaType: "application/json",
      byteLength: 120,
      createdAt: "2026-04-12T18:00:00Z",
    });
    const capture = await seedServices.captureBundles.freezeCaptureBundle({
      captureBundleId: "capture_post_submit_seed",
      evidenceLineageRef: "request_case_clinical_material",
      sourceChannel: "patient_reply",
      replayClass: "distinct",
      capturePolicyVersion: "capture_policy_v1",
      sourceHash: "source_hash_seed",
      semanticHash: "semantic_hash_seed",
      sourceArtifactRefs: ["artifact_post_submit_seed_payload"],
      createdAt: "2026-04-12T18:00:01Z",
    });
    await seedServices.artifacts.registerDerivedArtifact({
      artifactId: "artifact_post_submit_seed_normalized",
      locator: "object://evidence/derived/post-submit-seed-normalized.json",
      checksum: "sha256_post_submit_seed_normalized",
      mediaType: "application/json",
      byteLength: 96,
      createdAt: "2026-04-12T18:00:02Z",
    });
    const normalized = await seedServices.derivations.createDerivationPackage({
      derivationPackageId: "derivation_post_submit_seed_normalized",
      captureBundleRef: capture.captureBundleId,
      derivationClass: "canonical_normalization",
      derivationVersion: "norm_v1",
      policyVersionRef: "norm_policy_v1",
      derivedArtifactRef: "artifact_post_submit_seed_normalized",
      createdAt: "2026-04-12T18:00:02Z",
    });
    const baselineSnapshot = await seedServices.snapshots.createEvidenceSnapshot({
      evidenceSnapshotId: "snapshot_post_submit_seed",
      captureBundleRef: capture.captureBundleId,
      authoritativeNormalizedDerivationPackageRef: normalized.derivationPackageId,
      createdAt: "2026-04-12T18:00:03Z",
    });

    const noMaterialChange = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_no_material",
      requestId: "request_case_no_material",
      sourceDomain: "patient_reply",
      governingObjectRef: "message_thread_001",
      ingressEvidenceRefs: ["evidence_reply_no_material"],
      decidedAt: "2026-04-12T18:10:00Z",
      currentSafetyDecisionEpoch: 0,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_reply_no_material"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_reply_no_material",
            suggestedClass: "operationally_material_nonclinical",
            confidence: 0.92,
          },
        ],
        triggerReasonCodes: ["reply_acknowledgement_only"],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: {},
      },
    });

    await seedServices.artifacts.registerSourceArtifact({
      artifactId: "artifact_clinical_payload",
      locator: "object://evidence/source/clinical-reply.json",
      checksum: "sha256_clinical_payload",
      mediaType: "application/json",
      byteLength: 132,
      createdAt: "2026-04-12T18:11:00Z",
    });
    const clinicalCapture = await seedServices.captureBundles.freezeCaptureBundle({
      captureBundleId: "capture_clinical_payload",
      evidenceLineageRef: "request_case_clinical_material",
      sourceChannel: "patient_reply",
      replayClass: "distinct",
      capturePolicyVersion: "capture_policy_v1",
      sourceHash: "source_hash_clinical",
      semanticHash: "semantic_hash_clinical",
      sourceArtifactRefs: ["artifact_clinical_payload"],
      createdAt: "2026-04-12T18:11:01Z",
    });
    await seedServices.artifacts.registerDerivedArtifact({
      artifactId: "artifact_clinical_normalized",
      locator: "object://evidence/derived/clinical-normalized.json",
      checksum: "sha256_clinical_normalized",
      mediaType: "application/json",
      byteLength: 110,
      createdAt: "2026-04-12T18:11:02Z",
    });
    const clinicalNormalized = await seedServices.derivations.createDerivationPackage({
      derivationPackageId: "derivation_clinical_normalized",
      captureBundleRef: clinicalCapture.captureBundleId,
      derivationClass: "canonical_normalization",
      derivationVersion: "norm_v1",
      policyVersionRef: "norm_policy_v1",
      derivedArtifactRef: "artifact_clinical_normalized",
      createdAt: "2026-04-12T18:11:02Z",
    });

    const clinicallyMaterial = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_clinical_material",
      requestId: "request_case_clinical_material",
      sourceDomain: "patient_reply",
      governingObjectRef: "message_thread_critical",
      ingressEvidenceRefs: ["evidence_reply_clinical_material"],
      decidedAt: "2026-04-12T18:12:00Z",
      currentSafetyDecisionEpoch: 0,
      priorCompositeSnapshotRef: baselineSnapshot.evidenceSnapshotId,
      candidateSnapshotIntent: {
        captureBundleRef: clinicalCapture.captureBundleId,
        authoritativeNormalizedDerivationPackageRef: clinicalNormalized.derivationPackageId,
      },
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_reply_clinical_material"],
        changedFeatureRefs: ["new_clinical_detail", "symptom_worsened"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_reply_clinical_material",
            suggestedClass: "potentially_clinical",
            confidence: 0.88,
            signalRef: "symptom_change_signal",
          },
        ],
        triggerReasonCodes: ["clinical_meaning_changed"],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: { new_clinical_detail: "present", symptom_worsened: "present" },
        deltaFeatureRefs: ["new_clinical_detail", "symptom_worsened"],
        blockingActionScopeRefs: ["scope_patient_reply_continue"],
      },
    });

    const lowAssuranceContradiction = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_contradiction",
      requestId: "request_case_contradiction",
      sourceDomain: "patient_reply",
      governingObjectRef: "message_thread_contradiction",
      ingressEvidenceRefs: ["evidence_low_assurance_contradiction"],
      decidedAt: "2026-04-12T18:13:00Z",
      currentSafetyDecisionEpoch: 1,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_low_assurance_contradiction"],
        changedFeatureRefs: ["critical_contradiction", "urgent_red_flag"],
        reasonCodes: ["low_assurance_contradiction"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_low_assurance_contradiction",
            suggestedClass: "potentially_clinical",
            confidence: 0.6,
          },
        ],
        triggerReasonCodes: ["contradiction_delta"],
        explicitMisclassificationRiskState: "urgent_hold",
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: {
          critical_contradiction: "unresolved",
          urgent_red_flag: "present",
        },
        deltaFeatureRefs: ["critical_contradiction"],
      },
    });

    const callbackUrgent = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_callback_urgent",
      requestId: "request_case_callback_urgent",
      sourceDomain: "callback_outcome",
      governingObjectRef: "callback_case_001",
      ingressEvidenceRefs: ["evidence_callback_outcome_urgent"],
      decidedAt: "2026-04-12T18:14:00Z",
      currentSafetyDecisionEpoch: 0,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_callback_outcome_urgent"],
        changedFeatureRefs: ["urgent_contact_failure", "callback_unreachable"],
        changedDependencyRefs: ["reachability_callback"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_callback_outcome_urgent",
            suggestedClass: "contact_safety_relevant",
            confidence: 0.96,
            dependencyRef: "reachability_callback",
          },
        ],
        activeDependencyRefs: ["reachability_callback"],
        triggerReasonCodes: ["callback_unreachable"],
      },
      safetyEvaluation: {
        requestTypeRef: "callback_request",
        featureStates: {
          urgent_contact_failure: "present",
          callback_unreachable: "present",
        },
        deltaFeatureRefs: ["urgent_contact_failure", "callback_unreachable"],
        deltaDependencyRefs: ["reachability_callback"],
        activeReachabilityDependencyRefs: ["reachability_callback"],
        priorityHint: "urgent_live",
        urgentDiversionIntent: {
          actionMode: "live_transfer_started",
          settlementState: "issued",
          authoritativeActionRef: "telephony_live_transfer_001",
          issuedAt: "2026-04-12T18:14:01Z",
          settledAt: "2026-04-12T18:14:01Z",
        },
      },
    });

    const supportContactSafety = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_support_contact",
      requestId: "request_case_support_contact",
      sourceDomain: "support_capture",
      governingObjectRef: "support_case_001",
      ingressEvidenceRefs: ["evidence_support_contact_shift"],
      decidedAt: "2026-04-12T18:15:00Z",
      currentSafetyDecisionEpoch: 0,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_support_contact_shift"],
        changedDependencyRefs: ["reachability_callback"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_support_contact_shift",
            suggestedClass: "contact_safety_relevant",
            confidence: 0.9,
            dependencyRef: "reachability_callback",
          },
        ],
        activeDependencyRefs: ["reachability_callback"],
        triggerReasonCodes: ["contact_route_invalidated"],
      },
      safetyEvaluation: {
        requestTypeRef: "support_request",
        featureStates: { callback_unreachable: "present" },
        deltaDependencyRefs: ["reachability_callback"],
        activeReachabilityDependencyRefs: ["reachability_callback"],
      },
    });

    const pharmacyBlocked = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_pharmacy_blocked",
      requestId: "request_case_pharmacy_blocked",
      sourceDomain: "pharmacy_return",
      governingObjectRef: "pharmacy_return_001",
      ingressEvidenceRefs: ["evidence_pharmacy_weak_match"],
      decidedAt: "2026-04-12T18:16:00Z",
      currentSafetyDecisionEpoch: 0,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_pharmacy_weak_match"],
        changedFeatureRefs: ["weak_pharmacy_match", "consent_withdrawn"],
        explicitMaterialityClass: "unresolved",
        reasonCodes: ["weak_match", "consent_withdrawn"],
        degradedFailClosed: true,
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_pharmacy_weak_match",
            suggestedClass: "potentially_clinical",
            confidence: 0.38,
          },
        ],
        triggerReasonCodes: ["pharmacy_return_unresolved"],
      },
      safetyEvaluation: {
        requestTypeRef: "pharmacy_request",
        featureStates: { weak_pharmacy_match: "present", consent_withdrawn: "present" },
        deltaFeatureRefs: ["weak_pharmacy_match", "consent_withdrawn"],
      },
    });

    const replayDistinct = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_replay",
      requestId: "request_case_replay",
      sourceDomain: "patient_reply",
      governingObjectRef: "message_thread_replay",
      ingressEvidenceRefs: ["evidence_replay_case"],
      decidedAt: "2026-04-12T18:17:00Z",
      currentSafetyDecisionEpoch: 0,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_replay_case"],
        changedFeatureRefs: ["new_clinical_detail"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_replay_case",
            suggestedClass: "potentially_clinical",
            confidence: 0.82,
          },
        ],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: { new_clinical_detail: "present" },
        deltaFeatureRefs: ["new_clinical_detail"],
      },
    });
    const replayExisting = await this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_replay",
      requestId: "request_case_replay",
      sourceDomain: "patient_reply",
      governingObjectRef: "message_thread_replay",
      ingressEvidenceRefs: ["evidence_replay_case"],
      decidedAt: "2026-04-12T18:17:30Z",
      currentSafetyDecisionEpoch: 1,
      replayClassHint: "exact_replay",
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: {},
      },
    });

    const concurrentOne = this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_concurrent",
      requestId: "request_case_concurrent",
      sourceDomain: "async_enrichment",
      governingObjectRef: "enrichment_job_001",
      ingressEvidenceRefs: ["evidence_enrichment_concurrent"],
      decidedAt: "2026-04-12T18:18:00Z",
      currentSafetyDecisionEpoch: 2,
      currentPendingPreemptionRef: "existing_pending_preemption_001",
      currentPendingSafetyEpoch: 3,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_enrichment_concurrent"],
        changedFeatureRefs: ["new_clinical_detail"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_enrichment_concurrent",
            suggestedClass: "potentially_clinical",
            confidence: 0.73,
          },
        ],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: { new_clinical_detail: "present" },
        deltaFeatureRefs: ["new_clinical_detail"],
      },
    });
    const concurrentTwo = this.services.coordinator.assimilateEvidence({
      episodeId: "episode_case_concurrent",
      requestId: "request_case_concurrent",
      sourceDomain: "async_enrichment",
      governingObjectRef: "enrichment_job_001",
      ingressEvidenceRefs: ["evidence_enrichment_concurrent"],
      decidedAt: "2026-04-12T18:18:00Z",
      currentSafetyDecisionEpoch: 2,
      currentPendingPreemptionRef: "existing_pending_preemption_001",
      currentPendingSafetyEpoch: 3,
      materialDelta: {
        materialityPolicyRef: "materiality_policy_v1",
        changedEvidenceRefs: ["evidence_enrichment_concurrent"],
        changedFeatureRefs: ["new_clinical_detail"],
      },
      classification: {
        classifierVersionRef: "classifier_v1",
        evidenceItems: [
          {
            evidenceRef: "evidence_enrichment_concurrent",
            suggestedClass: "potentially_clinical",
            confidence: 0.73,
          },
        ],
      },
      safetyEvaluation: {
        requestTypeRef: "general_request",
        featureStates: { new_clinical_detail: "present" },
        deltaFeatureRefs: ["new_clinical_detail"],
      },
    });
    const [concurrentFirst, concurrentSecond] = await Promise.all([concurrentOne, concurrentTwo]);

    const results = [
      ["post_submit_reply_no_material_change", noMaterialChange],
      ["reply_clinically_material_forces_resafety", clinicallyMaterial],
      ["contradictory_low_assurance_cannot_clear_prior_urgent", lowAssuranceContradiction],
      ["callback_outcome_triggers_urgent_diversion", callbackUrgent],
      ["support_capture_changes_contact_safety_meaning", supportContactSafety],
      ["weak_pharmacy_outcome_forces_manual_review", pharmacyBlocked],
      ["exact_replay_returns_existing_assimilation", replayExisting],
      [
        "overlapping_inflight_assimilation_coalesces",
        {
          ...concurrentFirst,
          replayDisposition: concurrentSecond.replayDisposition,
        },
      ],
    ] as const;

    invariant(
      replayDistinct.assimilationRecord.evidenceAssimilationId ===
        replayExisting.assimilationRecord.evidenceAssimilationId,
      "SIMULATION_REPLAY_DID_NOT_RETURN_EXISTING_ASSIMILATION",
      "Replay scenario must reuse the previously settled assimilation record.",
    );
    invariant(
      concurrentFirst.assimilationRecord.evidenceAssimilationId ===
        concurrentSecond.assimilationRecord.evidenceAssimilationId,
      "SIMULATION_CONCURRENT_COALESCING_FAILED",
      "Overlapping in-flight assimilation must coalesce to one assimilation record.",
    );

    return results.map(([scenarioId, settlement]) => ({
      scenarioId,
      attachmentDisposition: settlement.assimilationRecord.attachmentDisposition,
      assimilationState: settlement.assimilationRecord.assimilationState,
      triggerDecision: settlement.materialDelta.triggerDecision,
      dominantEvidenceClass: settlement.classification.dominantEvidenceClass,
      decisionOutcome: settlement.safetyDecision?.decisionOutcome ?? null,
      requestedSafetyState: settlement.safetyDecision?.requestedSafetyState ?? null,
      urgentDiversionState: settlement.urgentDiversionSettlement?.settlementState ?? "none",
      replayDisposition: settlement.replayDisposition,
      impactedRuleRefs: settlement.incremental?.impactedRuleRefs ?? [],
      assimilationRecord: settlement.assimilationRecord,
      materialDelta: settlement.materialDelta,
      classification: settlement.classification,
      preemption: settlement.preemption,
      safetyDecision: settlement.safetyDecision,
      urgentDiversionSettlement: settlement.urgentDiversionSettlement,
    }));
  }
}

export function createAssimilationSafetySimulationHarness(options?: {
  repositories?: AssimilationSafetyDependencies;
  services?: AssimilationSafetyServices;
  idGenerator?: BackboneIdGenerator;
  rulePackLoader?: SafetyRulePackLoader;
}): AssimilationSafetySimulationHarness {
  const repositories = options?.repositories ?? createAssimilationSafetyStore();
  const services =
    options?.services ??
    createAssimilationSafetyServices(repositories, options?.idGenerator, options?.rulePackLoader);
  return new AssimilationSafetySimulationHarness(services);
}
