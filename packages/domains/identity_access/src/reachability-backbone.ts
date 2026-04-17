import { createHash } from "node:crypto";
import {
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
  RequestBackboneInvariantError,
} from "@vecells/domain-kernel";
import {
  type AccessGrantActionScope,
  type IdentityAccessDependencies,
  InMemoryIdentityAccessStore,
} from "./identity-access-backbone";

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

function uniqueSortedRefs(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function uniqueSortedActionScopes(
  values: readonly AccessGrantActionScope[],
): AccessGrantActionScope[] {
  return [...new Set(values)].sort() as AccessGrantActionScope[];
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextReachabilityId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function saveWithCas<T extends { version: number }>(
  map: Map<string, T>,
  key: string,
  row: T,
  options?: CompareAndSetWriteOptions,
): void {
  const current = map.get(key);
  if (options?.expectedVersion !== undefined) {
    invariant(
      current?.version === options.expectedVersion,
      "OPTIMISTIC_CONCURRENCY_MISMATCH",
      `Expected version ${options.expectedVersion} for ${key}, received ${current?.version ?? "missing"}.`,
    );
  } else if (current) {
    invariant(
      current.version < row.version,
      "NON_MONOTONE_SAVE",
      `Persisted version for ${key} must increase monotonically.`,
    );
  }
  map.set(key, row);
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

function ensureIsoTimestamp(value: string, field: string): string {
  const normalized = requireRef(value, field);
  invariant(
    !Number.isNaN(Date.parse(normalized)),
    `INVALID_${field.toUpperCase()}_TIMESTAMP`,
    `${field} must be a valid ISO-8601 timestamp.`,
  );
  return normalized;
}

export type ContactRouteKind =
  | "sms"
  | "voice"
  | "email"
  | "app_message"
  | "postal"
  | "practice_endpoint"
  | "pharmacy_endpoint";

export type ContactRouteSnapshotVerificationState =
  | "verified_current"
  | "verified_stale"
  | "unverified"
  | "failed"
  | "disputed"
  | "superseded";

export type ContactRouteFreshnessState = "current" | "stale" | "disputed";

export type ContactRouteSourceAuthorityClass =
  | "patient_confirmed"
  | "clinician_confirmed"
  | "support_captured"
  | "imported"
  | "derived";

export interface ContactRouteSnapshot {
  contactRouteSnapshotId: string;
  subjectRef: string;
  routeRef: string;
  routeVersionRef: string;
  routeKind: ContactRouteKind;
  normalizedAddressRef: string;
  preferenceProfileRef: string;
  verificationCheckpointRef: string | null;
  verificationState: ContactRouteSnapshotVerificationState;
  demographicFreshnessState: ContactRouteFreshnessState;
  preferenceFreshnessState: ContactRouteFreshnessState;
  sourceAuthorityClass: ContactRouteSourceAuthorityClass;
  supersedesSnapshotRef: string | null;
  snapshotVersion: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedContactRouteSnapshotRow extends ContactRouteSnapshot {
  aggregateType: "ContactRouteSnapshot";
  persistenceSchemaVersion: 1;
}

export class ContactRouteSnapshotDocument {
  private readonly snapshot: ContactRouteSnapshot;

  private constructor(snapshot: ContactRouteSnapshot) {
    this.snapshot = ContactRouteSnapshotDocument.normalize(snapshot);
  }

  static create(input: Omit<ContactRouteSnapshot, "version">): ContactRouteSnapshotDocument {
    return new ContactRouteSnapshotDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ContactRouteSnapshot): ContactRouteSnapshotDocument {
    return new ContactRouteSnapshotDocument(snapshot);
  }

  private static normalize(snapshot: ContactRouteSnapshot): ContactRouteSnapshot {
    const createdAt = ensureIsoTimestamp(snapshot.createdAt, "createdAt");
    const updatedAt = ensureIsoTimestamp(snapshot.updatedAt, "updatedAt");
    invariant(
      snapshot.snapshotVersion >= 1,
      "INVALID_SNAPSHOT_VERSION",
      "ContactRouteSnapshot.snapshotVersion must be >= 1.",
    );
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "ContactRouteSnapshot.version must be >= 1.",
    );
    if (snapshot.snapshotVersion === 1) {
      invariant(
        snapshot.supersedesSnapshotRef === null,
        "ROOT_SNAPSHOT_SUPERSEDES_FORBIDDEN",
        "The first ContactRouteSnapshot version cannot supersede another snapshot.",
      );
    } else {
      invariant(
        optionalRef(snapshot.supersedesSnapshotRef) !== null,
        "SUPERSEDES_SNAPSHOT_REQUIRED",
        "Later ContactRouteSnapshot versions must reference supersedesSnapshotRef.",
      );
    }
    invariant(
      snapshot.supersedesSnapshotRef !== snapshot.contactRouteSnapshotId,
      "SNAPSHOT_SELF_SUPERSEDES_FORBIDDEN",
      "ContactRouteSnapshot cannot supersede itself.",
    );
    return {
      ...snapshot,
      subjectRef: requireRef(snapshot.subjectRef, "subjectRef"),
      routeRef: requireRef(snapshot.routeRef, "routeRef"),
      routeVersionRef: requireRef(snapshot.routeVersionRef, "routeVersionRef"),
      normalizedAddressRef: requireRef(snapshot.normalizedAddressRef, "normalizedAddressRef"),
      preferenceProfileRef: requireRef(snapshot.preferenceProfileRef, "preferenceProfileRef"),
      verificationCheckpointRef: optionalRef(snapshot.verificationCheckpointRef),
      supersedesSnapshotRef: optionalRef(snapshot.supersedesSnapshotRef),
      createdAt,
      updatedAt,
    };
  }

  get contactRouteSnapshotId(): string {
    return this.snapshot.contactRouteSnapshotId;
  }

  get routeRef(): string {
    return this.snapshot.routeRef;
  }

  get routeKind(): ContactRouteKind {
    return this.snapshot.routeKind;
  }

  get snapshotVersion(): number {
    return this.snapshot.snapshotVersion;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactRouteSnapshot {
    return { ...this.snapshot };
  }
}

export type ReachabilityObservationClass =
  | "transport_ack"
  | "delivery_receipt"
  | "bounce"
  | "no_answer"
  | "invalid_route"
  | "opt_out"
  | "preference_change"
  | "demographic_change"
  | "verification_success"
  | "verification_failure"
  | "manual_dispute"
  | "manual_confirmed_reachable"
  | "manual_confirmed_unreachable";

export type ReachabilityOutcomePolarity = "positive" | "negative" | "ambiguous";
export type ReachabilityAuthorityWeight = "weak" | "moderate" | "strong";

const OBSERVATION_POLICY: Record<
  ReachabilityObservationClass,
  {
    readonly polarities: readonly ReachabilityOutcomePolarity[];
    readonly weights: readonly ReachabilityAuthorityWeight[];
  }
> = {
  transport_ack: { polarities: ["positive", "ambiguous"], weights: ["weak"] },
  delivery_receipt: {
    polarities: ["positive", "negative", "ambiguous"],
    weights: ["weak", "moderate"],
  },
  bounce: { polarities: ["negative"], weights: ["moderate", "strong"] },
  no_answer: { polarities: ["negative", "ambiguous"], weights: ["moderate"] },
  invalid_route: { polarities: ["negative"], weights: ["strong"] },
  opt_out: { polarities: ["negative"], weights: ["strong"] },
  preference_change: { polarities: ["negative", "ambiguous"], weights: ["moderate"] },
  demographic_change: { polarities: ["ambiguous"], weights: ["moderate"] },
  verification_success: { polarities: ["positive"], weights: ["strong"] },
  verification_failure: { polarities: ["negative"], weights: ["moderate", "strong"] },
  manual_dispute: { polarities: ["ambiguous"], weights: ["strong"] },
  manual_confirmed_reachable: { polarities: ["positive"], weights: ["strong"] },
  manual_confirmed_unreachable: { polarities: ["negative"], weights: ["strong"] },
};

export interface ReachabilityObservation {
  reachabilityObservationId: string;
  reachabilityDependencyRef: string;
  contactRouteSnapshotRef: string;
  observationClass: ReachabilityObservationClass;
  observationSourceRef: string;
  observedAt: string;
  recordedAt: string;
  outcomePolarity: ReachabilityOutcomePolarity;
  authorityWeight: ReachabilityAuthorityWeight;
  evidenceRef: string;
  supersedesObservationRef: string | null;
  version: number;
}

export interface PersistedReachabilityObservationRow extends ReachabilityObservation {
  aggregateType: "ReachabilityObservation";
  persistenceSchemaVersion: 1;
}

export class ReachabilityObservationDocument {
  private readonly snapshot: ReachabilityObservation;

  private constructor(snapshot: ReachabilityObservation) {
    this.snapshot = ReachabilityObservationDocument.normalize(snapshot);
  }

  static create(input: Omit<ReachabilityObservation, "version">): ReachabilityObservationDocument {
    return new ReachabilityObservationDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ReachabilityObservation): ReachabilityObservationDocument {
    return new ReachabilityObservationDocument(snapshot);
  }

  private static normalize(snapshot: ReachabilityObservation): ReachabilityObservation {
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "ReachabilityObservation.version must be >= 1.",
    );
    const policy = OBSERVATION_POLICY[snapshot.observationClass];
    invariant(
      policy.polarities.includes(snapshot.outcomePolarity),
      "OBSERVATION_POLARITY_INVALID",
      `${snapshot.observationClass} may not use outcomePolarity ${snapshot.outcomePolarity}.`,
    );
    invariant(
      policy.weights.includes(snapshot.authorityWeight),
      "OBSERVATION_WEIGHT_INVALID",
      `${snapshot.observationClass} may not use authorityWeight ${snapshot.authorityWeight}.`,
    );
    invariant(
      snapshot.supersedesObservationRef !== snapshot.reachabilityObservationId,
      "OBSERVATION_SELF_SUPERSEDES_FORBIDDEN",
      "ReachabilityObservation cannot supersede itself.",
    );
    return {
      ...snapshot,
      reachabilityDependencyRef: requireRef(
        snapshot.reachabilityDependencyRef,
        "reachabilityDependencyRef",
      ),
      contactRouteSnapshotRef: requireRef(
        snapshot.contactRouteSnapshotRef,
        "contactRouteSnapshotRef",
      ),
      observationSourceRef: requireRef(snapshot.observationSourceRef, "observationSourceRef"),
      observedAt: ensureIsoTimestamp(snapshot.observedAt, "observedAt"),
      recordedAt: ensureIsoTimestamp(snapshot.recordedAt, "recordedAt"),
      evidenceRef: requireRef(snapshot.evidenceRef, "evidenceRef"),
      supersedesObservationRef: optionalRef(snapshot.supersedesObservationRef),
    };
  }

  get reachabilityObservationId(): string {
    return this.snapshot.reachabilityObservationId;
  }

  get reachabilityDependencyRef(): string {
    return this.snapshot.reachabilityDependencyRef;
  }

  get contactRouteSnapshotRef(): string {
    return this.snapshot.contactRouteSnapshotRef;
  }

  get observedAt(): string {
    return this.snapshot.observedAt;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ReachabilityObservation {
    return { ...this.snapshot };
  }
}

export type RouteAuthorityState =
  | "current"
  | "stale_verification"
  | "stale_demographics"
  | "stale_preferences"
  | "disputed"
  | "superseded";

export type DeliverabilityState =
  | "confirmed_reachable"
  | "uncertain"
  | "likely_failed"
  | "confirmed_failed";

export type DeliveryRiskState = "on_track" | "at_risk" | "likely_failed" | "disputed";
export type ReachabilityAssessmentState = "clear" | "at_risk" | "blocked" | "disputed";
export type FalseNegativeGuardState =
  | "pass"
  | "stale_input"
  | "conflicting_signal"
  | "insufficient_observation";

export type ReachabilityRepairState =
  | "none"
  | "repair_required"
  | "awaiting_verification"
  | "rebound_pending";

export interface ReachabilityAssessmentRecord {
  reachabilityAssessmentId: string;
  reachabilityDependencyRef: string;
  governingObjectRef: string;
  contactRouteSnapshotRef: string;
  consideredObservationRefs: readonly string[];
  priorAssessmentRef: string | null;
  routeAuthorityState: RouteAuthorityState;
  deliverabilityState: DeliverabilityState;
  deliveryRiskState: DeliveryRiskState;
  assessmentState: ReachabilityAssessmentState;
  falseNegativeGuardState: FalseNegativeGuardState;
  dominantReasonCode: string;
  resultingRepairState: ReachabilityRepairState;
  resultingReachabilityEpoch: number;
  assessedAt: string;
  version: number;
}

export interface PersistedReachabilityAssessmentRow extends ReachabilityAssessmentRecord {
  aggregateType: "ReachabilityAssessmentRecord";
  persistenceSchemaVersion: 1;
}

export class ReachabilityAssessmentRecordDocument {
  private readonly snapshot: ReachabilityAssessmentRecord;

  private constructor(snapshot: ReachabilityAssessmentRecord) {
    this.snapshot = ReachabilityAssessmentRecordDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ReachabilityAssessmentRecord, "version">,
  ): ReachabilityAssessmentRecordDocument {
    return new ReachabilityAssessmentRecordDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ReachabilityAssessmentRecord): ReachabilityAssessmentRecordDocument {
    return new ReachabilityAssessmentRecordDocument(snapshot);
  }

  private static normalize(snapshot: ReachabilityAssessmentRecord): ReachabilityAssessmentRecord {
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "ReachabilityAssessmentRecord.version must be >= 1.",
    );
    invariant(
      snapshot.resultingReachabilityEpoch >= 1,
      "INVALID_REACHABILITY_EPOCH",
      "ReachabilityAssessmentRecord.resultingReachabilityEpoch must be >= 1.",
    );
    if (snapshot.assessmentState === "clear") {
      invariant(
        snapshot.routeAuthorityState === "current" &&
          snapshot.deliverabilityState === "confirmed_reachable" &&
          snapshot.deliveryRiskState === "on_track" &&
          snapshot.falseNegativeGuardState === "pass" &&
          snapshot.resultingRepairState === "none",
        "CLEAR_ASSESSMENT_INVARIANT_BROKEN",
        "Clear reachability assessments require current authority, confirmed reachability, and no repair state.",
      );
    }
    return {
      ...snapshot,
      reachabilityDependencyRef: requireRef(
        snapshot.reachabilityDependencyRef,
        "reachabilityDependencyRef",
      ),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      contactRouteSnapshotRef: requireRef(
        snapshot.contactRouteSnapshotRef,
        "contactRouteSnapshotRef",
      ),
      consideredObservationRefs: uniqueSortedRefs(snapshot.consideredObservationRefs),
      priorAssessmentRef: optionalRef(snapshot.priorAssessmentRef),
      dominantReasonCode: requireRef(snapshot.dominantReasonCode, "dominantReasonCode"),
      assessedAt: ensureIsoTimestamp(snapshot.assessedAt, "assessedAt"),
    };
  }

  get reachabilityAssessmentId(): string {
    return this.snapshot.reachabilityAssessmentId;
  }

  get reachabilityDependencyRef(): string {
    return this.snapshot.reachabilityDependencyRef;
  }

  get contactRouteSnapshotRef(): string {
    return this.snapshot.contactRouteSnapshotRef;
  }

  get assessmentState(): ReachabilityAssessmentState {
    return this.snapshot.assessmentState;
  }

  get routeAuthorityState(): RouteAuthorityState {
    return this.snapshot.routeAuthorityState;
  }

  get resultingRepairState(): ReachabilityRepairState {
    return this.snapshot.resultingRepairState;
  }

  get resultingReachabilityEpoch(): number {
    return this.snapshot.resultingReachabilityEpoch;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ReachabilityAssessmentRecord {
    return {
      ...this.snapshot,
      consideredObservationRefs: [...this.snapshot.consideredObservationRefs],
    };
  }
}

export type ReachabilityDomain = "patient" | "staff" | "callback" | "booking" | "hub" | "pharmacy";

export type ReachabilityPurpose =
  | "callback"
  | "clinician_message"
  | "more_info"
  | "waitlist_offer"
  | "alternative_offer"
  | "pharmacy_contact"
  | "urgent_return"
  | "outcome_confirmation";

export type RouteHealthState = "clear" | "degraded" | "blocked" | "disputed";
export type ReachabilityFailureEffect =
  | "escalate"
  | "urgent_review"
  | "requeue"
  | "invalidate_pending_action";

export type ReachabilityDependencyState = "active" | "satisfied" | "expired" | "superseded";

export interface ReachabilityDependency {
  dependencyId: string;
  episodeId: string;
  requestId: string;
  domain: ReachabilityDomain;
  domainObjectRef: string;
  requiredRouteRef: string;
  contactRouteVersionRef: string;
  currentContactRouteSnapshotRef: string;
  currentReachabilityAssessmentRef: string;
  reachabilityEpoch: number;
  purpose: ReachabilityPurpose;
  blockedActionScopeRefs: readonly AccessGrantActionScope[];
  selectedAnchorRef: string;
  requestReturnBundleRef: string | null;
  resumeContinuationRef: string | null;
  repairJourneyRef: string | null;
  routeAuthorityState: RouteAuthorityState;
  routeHealthState: RouteHealthState;
  deliveryRiskState: DeliveryRiskState;
  repairState: ReachabilityRepairState;
  deadlineAt: string;
  failureEffect: ReachabilityFailureEffect;
  state: ReachabilityDependencyState;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PersistedReachabilityDependencyRow extends ReachabilityDependency {
  aggregateType: "ReachabilityDependency";
  persistenceSchemaVersion: 1;
}

function routeHealthFromAssessment(assessmentState: ReachabilityAssessmentState): RouteHealthState {
  switch (assessmentState) {
    case "clear":
      return "clear";
    case "at_risk":
      return "degraded";
    case "blocked":
      return "blocked";
    case "disputed":
      return "disputed";
  }
}

export class ReachabilityDependencyDocument {
  private readonly snapshot: ReachabilityDependency;

  private constructor(snapshot: ReachabilityDependency) {
    this.snapshot = ReachabilityDependencyDocument.normalize(snapshot);
  }

  static create(input: Omit<ReachabilityDependency, "version">): ReachabilityDependencyDocument {
    return new ReachabilityDependencyDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ReachabilityDependency): ReachabilityDependencyDocument {
    return new ReachabilityDependencyDocument(snapshot);
  }

  private static normalize(snapshot: ReachabilityDependency): ReachabilityDependency {
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "ReachabilityDependency.version must be >= 1.",
    );
    invariant(
      snapshot.reachabilityEpoch >= 1,
      "INVALID_REACHABILITY_EPOCH",
      "ReachabilityDependency.reachabilityEpoch must be >= 1.",
    );
    const blockedActionScopeRefs = uniqueSortedActionScopes(snapshot.blockedActionScopeRefs);
    invariant(
      blockedActionScopeRefs.length >= 1,
      "BLOCKED_ACTION_SCOPE_REQUIRED",
      "ReachabilityDependency requires at least one blockedActionScopeRef.",
    );
    return {
      ...snapshot,
      episodeId: requireRef(snapshot.episodeId, "episodeId"),
      requestId: requireRef(snapshot.requestId, "requestId"),
      domainObjectRef: requireRef(snapshot.domainObjectRef, "domainObjectRef"),
      requiredRouteRef: requireRef(snapshot.requiredRouteRef, "requiredRouteRef"),
      contactRouteVersionRef: requireRef(snapshot.contactRouteVersionRef, "contactRouteVersionRef"),
      currentContactRouteSnapshotRef: requireRef(
        snapshot.currentContactRouteSnapshotRef,
        "currentContactRouteSnapshotRef",
      ),
      currentReachabilityAssessmentRef: requireRef(
        snapshot.currentReachabilityAssessmentRef,
        "currentReachabilityAssessmentRef",
      ),
      blockedActionScopeRefs,
      selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
      requestReturnBundleRef: optionalRef(snapshot.requestReturnBundleRef),
      resumeContinuationRef: optionalRef(snapshot.resumeContinuationRef),
      repairJourneyRef: optionalRef(snapshot.repairJourneyRef),
      deadlineAt: ensureIsoTimestamp(snapshot.deadlineAt, "deadlineAt"),
      createdAt: ensureIsoTimestamp(snapshot.createdAt, "createdAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
    };
  }

  get dependencyId(): string {
    return this.snapshot.dependencyId;
  }

  get currentContactRouteSnapshotRef(): string {
    return this.snapshot.currentContactRouteSnapshotRef;
  }

  get currentReachabilityAssessmentRef(): string {
    return this.snapshot.currentReachabilityAssessmentRef;
  }

  get repairJourneyRef(): string | null {
    return this.snapshot.repairJourneyRef;
  }

  get state(): ReachabilityDependencyState {
    return this.snapshot.state;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ReachabilityDependency {
    return {
      ...this.snapshot,
      blockedActionScopeRefs: [...this.snapshot.blockedActionScopeRefs],
    };
  }

  applyAssessment(input: {
    assessment: ReachabilityAssessmentRecordDocument;
    contactRouteSnapshotRef?: string;
    updatedAt: string;
  }): ReachabilityDependencyDocument {
    const assessment = input.assessment.toSnapshot();
    return new ReachabilityDependencyDocument({
      ...this.snapshot,
      currentContactRouteSnapshotRef:
        optionalRef(input.contactRouteSnapshotRef) ?? assessment.contactRouteSnapshotRef,
      currentReachabilityAssessmentRef: assessment.reachabilityAssessmentId,
      reachabilityEpoch: assessment.resultingReachabilityEpoch,
      routeAuthorityState: assessment.routeAuthorityState,
      routeHealthState: routeHealthFromAssessment(assessment.assessmentState),
      deliveryRiskState: assessment.deliveryRiskState,
      repairState: assessment.resultingRepairState,
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  bindRepairJourney(input: {
    repairJourneyRef: string;
    updatedAt: string;
  }): ReachabilityDependencyDocument {
    if (this.snapshot.repairJourneyRef === input.repairJourneyRef) {
      return this;
    }
    invariant(
      this.snapshot.repairJourneyRef === null,
      "REPAIR_JOURNEY_ALREADY_BOUND",
      "ReachabilityDependency already has an active repairJourneyRef.",
    );
    return new ReachabilityDependencyDocument({
      ...this.snapshot,
      repairJourneyRef: requireRef(input.repairJourneyRef, "repairJourneyRef"),
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  completeRepairJourney(input: { updatedAt: string }): ReachabilityDependencyDocument {
    if (this.snapshot.repairJourneyRef === null && this.snapshot.repairState === "none") {
      return this;
    }
    return new ReachabilityDependencyDocument({
      ...this.snapshot,
      repairJourneyRef: null,
      repairState: "none",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type ContactRouteRepairJourneyState =
  | "ready"
  | "collecting_route"
  | "awaiting_verification"
  | "rebound_pending"
  | "completed"
  | "recovery_required"
  | "stale";

export interface ContactRouteRepairJourney {
  repairJourneyId: string;
  reachabilityDependencyRef: string;
  governingObjectRef: string;
  blockedActionScopeRefs: readonly AccessGrantActionScope[];
  selectedAnchorRef: string;
  requestReturnBundleRef: string | null;
  resumeContinuationRef: string | null;
  patientRecoveryLoopRef: string | null;
  blockedAssessmentRef: string;
  currentContactRouteSnapshotRef: string;
  candidateContactRouteSnapshotRef: string | null;
  verificationCheckpointRef: string | null;
  resultingReachabilityAssessmentRef: string | null;
  journeyState: ContactRouteRepairJourneyState;
  issuedAt: string;
  updatedAt: string;
  completedAt: string | null;
  version: number;
}

export interface PersistedContactRouteRepairJourneyRow extends ContactRouteRepairJourney {
  aggregateType: "ContactRouteRepairJourney";
  persistenceSchemaVersion: 1;
}

export class ContactRouteRepairJourneyDocument {
  private readonly snapshot: ContactRouteRepairJourney;

  private constructor(snapshot: ContactRouteRepairJourney) {
    this.snapshot = ContactRouteRepairJourneyDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ContactRouteRepairJourney, "version">,
  ): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(snapshot: ContactRouteRepairJourney): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument(snapshot);
  }

  private static normalize(snapshot: ContactRouteRepairJourney): ContactRouteRepairJourney {
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "ContactRouteRepairJourney.version must be >= 1.",
    );
    const blockedActionScopeRefs = uniqueSortedActionScopes(snapshot.blockedActionScopeRefs);
    invariant(
      blockedActionScopeRefs.length >= 1,
      "REPAIR_JOURNEY_BLOCKED_SCOPE_REQUIRED",
      "ContactRouteRepairJourney requires blockedActionScopeRefs.",
    );
    if (snapshot.journeyState === "completed") {
      invariant(
        optionalRef(snapshot.resultingReachabilityAssessmentRef) !== null &&
          optionalRef(snapshot.verificationCheckpointRef) !== null &&
          optionalRef(snapshot.completedAt) !== null,
        "COMPLETED_REPAIR_JOURNEY_INCOMPLETE",
        "Completed ContactRouteRepairJourney requires checkpoint, resulting assessment, and completedAt.",
      );
    }
    return {
      ...snapshot,
      reachabilityDependencyRef: requireRef(
        snapshot.reachabilityDependencyRef,
        "reachabilityDependencyRef",
      ),
      governingObjectRef: requireRef(snapshot.governingObjectRef, "governingObjectRef"),
      blockedActionScopeRefs,
      selectedAnchorRef: requireRef(snapshot.selectedAnchorRef, "selectedAnchorRef"),
      requestReturnBundleRef: optionalRef(snapshot.requestReturnBundleRef),
      resumeContinuationRef: optionalRef(snapshot.resumeContinuationRef),
      patientRecoveryLoopRef: optionalRef(snapshot.patientRecoveryLoopRef),
      blockedAssessmentRef: requireRef(snapshot.blockedAssessmentRef, "blockedAssessmentRef"),
      currentContactRouteSnapshotRef: requireRef(
        snapshot.currentContactRouteSnapshotRef,
        "currentContactRouteSnapshotRef",
      ),
      candidateContactRouteSnapshotRef: optionalRef(snapshot.candidateContactRouteSnapshotRef),
      verificationCheckpointRef: optionalRef(snapshot.verificationCheckpointRef),
      resultingReachabilityAssessmentRef: optionalRef(snapshot.resultingReachabilityAssessmentRef),
      issuedAt: ensureIsoTimestamp(snapshot.issuedAt, "issuedAt"),
      updatedAt: ensureIsoTimestamp(snapshot.updatedAt, "updatedAt"),
      completedAt: optionalRef(snapshot.completedAt),
    };
  }

  get repairJourneyId(): string {
    return this.snapshot.repairJourneyId;
  }

  get reachabilityDependencyRef(): string {
    return this.snapshot.reachabilityDependencyRef;
  }

  get candidateContactRouteSnapshotRef(): string | null {
    return this.snapshot.candidateContactRouteSnapshotRef;
  }

  get verificationCheckpointRef(): string | null {
    return this.snapshot.verificationCheckpointRef;
  }

  get journeyState(): ContactRouteRepairJourneyState {
    return this.snapshot.journeyState;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactRouteRepairJourney {
    return {
      ...this.snapshot,
      blockedActionScopeRefs: [...this.snapshot.blockedActionScopeRefs],
    };
  }

  attachCandidateSnapshot(input: {
    candidateContactRouteSnapshotRef: string;
    updatedAt: string;
  }): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...this.snapshot,
      candidateContactRouteSnapshotRef: requireRef(
        input.candidateContactRouteSnapshotRef,
        "candidateContactRouteSnapshotRef",
      ),
      journeyState: "collecting_route",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  attachCheckpoint(input: {
    verificationCheckpointRef: string;
    updatedAt: string;
  }): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...this.snapshot,
      verificationCheckpointRef: requireRef(
        input.verificationCheckpointRef,
        "verificationCheckpointRef",
      ),
      journeyState: "awaiting_verification",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markReboundPending(input: {
    resultingAssessmentRef: string;
    updatedAt: string;
  }): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...this.snapshot,
      resultingReachabilityAssessmentRef: requireRef(
        input.resultingAssessmentRef,
        "resultingAssessmentRef",
      ),
      journeyState: "rebound_pending",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  complete(input: {
    resultingAssessmentRef: string;
    updatedAt: string;
  }): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...this.snapshot,
      resultingReachabilityAssessmentRef: requireRef(
        input.resultingAssessmentRef,
        "resultingAssessmentRef",
      ),
      journeyState: "completed",
      updatedAt: input.updatedAt,
      completedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markRecoveryRequired(input: {
    resultingAssessmentRef: string | null;
    updatedAt: string;
  }): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...this.snapshot,
      resultingReachabilityAssessmentRef: optionalRef(input.resultingAssessmentRef),
      journeyState: "recovery_required",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }

  markStale(input: { updatedAt: string }): ContactRouteRepairJourneyDocument {
    return new ContactRouteRepairJourneyDocument({
      ...this.snapshot,
      journeyState: "stale",
      updatedAt: input.updatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export type ContactRouteVerificationMethod =
  | "otp"
  | "link"
  | "clinician_verified"
  | "existing_verified"
  | "policy_exempt";

export type ContactRouteVerificationState =
  | "pending"
  | "verified"
  | "failed"
  | "expired"
  | "superseded";
export type ContactRouteRebindState = "pending" | "rebound" | "blocked";

export interface ContactRouteVerificationCheckpoint {
  checkpointId: string;
  repairJourneyRef: string;
  contactRouteRef: string;
  contactRouteVersionRef: string;
  preVerificationAssessmentRef: string;
  verificationMethod: ContactRouteVerificationMethod;
  verificationState: ContactRouteVerificationState;
  resultingContactRouteSnapshotRef: string | null;
  resultingReachabilityAssessmentRef: string | null;
  rebindState: ContactRouteRebindState;
  dependentGrantRefs: readonly string[];
  dependentRouteIntentRefs: readonly string[];
  evaluatedAt: string;
  version: number;
}

export interface PersistedContactRouteVerificationCheckpointRow
  extends ContactRouteVerificationCheckpoint {
  aggregateType: "ContactRouteVerificationCheckpoint";
  persistenceSchemaVersion: 1;
}

export class ContactRouteVerificationCheckpointDocument {
  private readonly snapshot: ContactRouteVerificationCheckpoint;

  private constructor(snapshot: ContactRouteVerificationCheckpoint) {
    this.snapshot = ContactRouteVerificationCheckpointDocument.normalize(snapshot);
  }

  static create(
    input: Omit<ContactRouteVerificationCheckpoint, "version">,
  ): ContactRouteVerificationCheckpointDocument {
    return new ContactRouteVerificationCheckpointDocument({
      ...input,
      version: 1,
    });
  }

  static hydrate(
    snapshot: ContactRouteVerificationCheckpoint,
  ): ContactRouteVerificationCheckpointDocument {
    return new ContactRouteVerificationCheckpointDocument(snapshot);
  }

  private static normalize(
    snapshot: ContactRouteVerificationCheckpoint,
  ): ContactRouteVerificationCheckpoint {
    invariant(
      snapshot.version >= 1,
      "INVALID_ROW_VERSION",
      "ContactRouteVerificationCheckpoint.version must be >= 1.",
    );
    if (snapshot.verificationState === "pending") {
      invariant(
        snapshot.rebindState === "pending",
        "PENDING_CHECKPOINT_REQUIRES_PENDING_REBIND",
        "Pending checkpoints must keep rebindState pending.",
      );
    } else {
      invariant(
        optionalRef(snapshot.resultingReachabilityAssessmentRef) !== null,
        "TERMINAL_CHECKPOINT_REQUIRES_RESULTING_ASSESSMENT",
        "Terminal checkpoints require resultingReachabilityAssessmentRef.",
      );
      if (snapshot.verificationState === "verified") {
        invariant(
          optionalRef(snapshot.resultingContactRouteSnapshotRef) !== null &&
            snapshot.rebindState !== "pending",
          "VERIFIED_CHECKPOINT_REQUIRES_REBOUND_OR_BLOCKED",
          "Verified checkpoints require resultingContactRouteSnapshotRef and a terminal rebind state.",
        );
      }
    }
    return {
      ...snapshot,
      repairJourneyRef: requireRef(snapshot.repairJourneyRef, "repairJourneyRef"),
      contactRouteRef: requireRef(snapshot.contactRouteRef, "contactRouteRef"),
      contactRouteVersionRef: requireRef(snapshot.contactRouteVersionRef, "contactRouteVersionRef"),
      preVerificationAssessmentRef: requireRef(
        snapshot.preVerificationAssessmentRef,
        "preVerificationAssessmentRef",
      ),
      resultingContactRouteSnapshotRef: optionalRef(snapshot.resultingContactRouteSnapshotRef),
      resultingReachabilityAssessmentRef: optionalRef(snapshot.resultingReachabilityAssessmentRef),
      dependentGrantRefs: uniqueSortedRefs(snapshot.dependentGrantRefs),
      dependentRouteIntentRefs: uniqueSortedRefs(snapshot.dependentRouteIntentRefs),
      evaluatedAt: ensureIsoTimestamp(snapshot.evaluatedAt, "evaluatedAt"),
    };
  }

  get checkpointId(): string {
    return this.snapshot.checkpointId;
  }

  get repairJourneyRef(): string {
    return this.snapshot.repairJourneyRef;
  }

  get verificationState(): ContactRouteVerificationState {
    return this.snapshot.verificationState;
  }

  get version(): number {
    return this.snapshot.version;
  }

  toSnapshot(): ContactRouteVerificationCheckpoint {
    return {
      ...this.snapshot,
      dependentGrantRefs: [...this.snapshot.dependentGrantRefs],
      dependentRouteIntentRefs: [...this.snapshot.dependentRouteIntentRefs],
    };
  }

  settle(input: {
    verificationState: Exclude<ContactRouteVerificationState, "pending">;
    resultingContactRouteSnapshotRef?: string | null;
    resultingReachabilityAssessmentRef: string;
    rebindState: Exclude<ContactRouteRebindState, "pending">;
    evaluatedAt: string;
  }): ContactRouteVerificationCheckpointDocument {
    invariant(
      this.snapshot.verificationState === "pending" ||
        this.snapshot.verificationState === input.verificationState,
      "CHECKPOINT_ALREADY_SETTLED",
      "ContactRouteVerificationCheckpoint is already settled to a different verificationState.",
    );
    return new ContactRouteVerificationCheckpointDocument({
      ...this.snapshot,
      verificationState: input.verificationState,
      resultingContactRouteSnapshotRef: input.resultingContactRouteSnapshotRef ?? null,
      resultingReachabilityAssessmentRef: requireRef(
        input.resultingReachabilityAssessmentRef,
        "resultingReachabilityAssessmentRef",
      ),
      rebindState: input.rebindState,
      evaluatedAt: input.evaluatedAt,
      version: nextVersion(this.snapshot.version),
    });
  }
}

export interface ContactRouteSnapshotRepository {
  getContactRouteSnapshot(
    contactRouteSnapshotId: string,
  ): Promise<ContactRouteSnapshotDocument | undefined>;
  getLatestContactRouteSnapshotForRoute(
    routeRef: string,
  ): Promise<ContactRouteSnapshotDocument | undefined>;
  listContactRouteSnapshots(): Promise<readonly ContactRouteSnapshotDocument[]>;
  listContactRouteSnapshotsForRoute(
    routeRef: string,
  ): Promise<readonly ContactRouteSnapshotDocument[]>;
  saveContactRouteSnapshot(
    snapshot: ContactRouteSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ReachabilityObservationRepository {
  getReachabilityObservation(
    reachabilityObservationId: string,
  ): Promise<ReachabilityObservationDocument | undefined>;
  listReachabilityObservations(): Promise<readonly ReachabilityObservationDocument[]>;
  listReachabilityObservationsForDependency(
    dependencyId: string,
  ): Promise<readonly ReachabilityObservationDocument[]>;
  listReachabilityObservationsForSnapshot(
    contactRouteSnapshotRef: string,
  ): Promise<readonly ReachabilityObservationDocument[]>;
  saveReachabilityObservation(
    observation: ReachabilityObservationDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ReachabilityAssessmentRepository {
  getReachabilityAssessment(
    reachabilityAssessmentId: string,
  ): Promise<ReachabilityAssessmentRecordDocument | undefined>;
  getLatestReachabilityAssessmentForDependency(
    dependencyId: string,
  ): Promise<ReachabilityAssessmentRecordDocument | undefined>;
  listReachabilityAssessments(): Promise<readonly ReachabilityAssessmentRecordDocument[]>;
  listReachabilityAssessmentsForDependency(
    dependencyId: string,
  ): Promise<readonly ReachabilityAssessmentRecordDocument[]>;
  saveReachabilityAssessment(
    assessment: ReachabilityAssessmentRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ReachabilityDependencyRepository {
  getReachabilityDependency(
    dependencyId: string,
  ): Promise<ReachabilityDependencyDocument | undefined>;
  listReachabilityDependencies(): Promise<readonly ReachabilityDependencyDocument[]>;
  listReachabilityDependenciesForRequest(
    requestId: string,
  ): Promise<readonly ReachabilityDependencyDocument[]>;
  saveReachabilityDependency(
    dependency: ReachabilityDependencyDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ContactRouteRepairJourneyRepository {
  getContactRouteRepairJourney(
    repairJourneyId: string,
  ): Promise<ContactRouteRepairJourneyDocument | undefined>;
  listContactRouteRepairJourneys(): Promise<readonly ContactRouteRepairJourneyDocument[]>;
  listContactRouteRepairJourneysForDependency(
    dependencyId: string,
  ): Promise<readonly ContactRouteRepairJourneyDocument[]>;
  saveContactRouteRepairJourney(
    journey: ContactRouteRepairJourneyDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ContactRouteVerificationCheckpointRepository {
  getContactRouteVerificationCheckpoint(
    checkpointId: string,
  ): Promise<ContactRouteVerificationCheckpointDocument | undefined>;
  listContactRouteVerificationCheckpoints(): Promise<
    readonly ContactRouteVerificationCheckpointDocument[]
  >;
  listContactRouteVerificationCheckpointsForRepairJourney(
    repairJourneyId: string,
  ): Promise<readonly ContactRouteVerificationCheckpointDocument[]>;
  saveContactRouteVerificationCheckpoint(
    checkpoint: ContactRouteVerificationCheckpointDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
}

export interface ReachabilityDependencies
  extends IdentityAccessDependencies,
    ContactRouteSnapshotRepository,
    ReachabilityObservationRepository,
    ReachabilityAssessmentRepository,
    ReachabilityDependencyRepository,
    ContactRouteRepairJourneyRepository,
    ContactRouteVerificationCheckpointRepository {}

export class InMemoryReachabilityStore
  extends InMemoryIdentityAccessStore
  implements ReachabilityDependencies
{
  private readonly contactRouteSnapshots = new Map<string, PersistedContactRouteSnapshotRow>();
  private readonly reachabilityObservations = new Map<
    string,
    PersistedReachabilityObservationRow
  >();
  private readonly reachabilityAssessments = new Map<string, PersistedReachabilityAssessmentRow>();
  private readonly reachabilityDependencies = new Map<string, PersistedReachabilityDependencyRow>();
  private readonly repairJourneys = new Map<string, PersistedContactRouteRepairJourneyRow>();
  private readonly verificationCheckpoints = new Map<
    string,
    PersistedContactRouteVerificationCheckpointRow
  >();

  async getContactRouteSnapshot(
    contactRouteSnapshotId: string,
  ): Promise<ContactRouteSnapshotDocument | undefined> {
    const row = this.contactRouteSnapshots.get(contactRouteSnapshotId);
    return row ? ContactRouteSnapshotDocument.hydrate(row) : undefined;
  }

  async getLatestContactRouteSnapshotForRoute(
    routeRef: string,
  ): Promise<ContactRouteSnapshotDocument | undefined> {
    const rows = [...this.contactRouteSnapshots.values()]
      .filter((row) => row.routeRef === routeRef)
      .sort((left, right) =>
        left.snapshotVersion === right.snapshotVersion
          ? compareIso(left.createdAt, right.createdAt)
          : left.snapshotVersion - right.snapshotVersion,
      );
    const row = rows.at(-1);
    return row ? ContactRouteSnapshotDocument.hydrate(row) : undefined;
  }

  async listContactRouteSnapshots(): Promise<readonly ContactRouteSnapshotDocument[]> {
    return [...this.contactRouteSnapshots.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => ContactRouteSnapshotDocument.hydrate(row));
  }

  async listContactRouteSnapshotsForRoute(
    routeRef: string,
  ): Promise<readonly ContactRouteSnapshotDocument[]> {
    return [...this.contactRouteSnapshots.values()]
      .filter((row) => row.routeRef === routeRef)
      .sort((left, right) =>
        left.snapshotVersion === right.snapshotVersion
          ? compareIso(left.createdAt, right.createdAt)
          : left.snapshotVersion - right.snapshotVersion,
      )
      .map((row) => ContactRouteSnapshotDocument.hydrate(row));
  }

  async saveContactRouteSnapshot(
    snapshot: ContactRouteSnapshotDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = snapshot.toSnapshot();
    saveWithCas(
      this.contactRouteSnapshots,
      row.contactRouteSnapshotId,
      {
        ...row,
        aggregateType: "ContactRouteSnapshot",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getReachabilityObservation(
    reachabilityObservationId: string,
  ): Promise<ReachabilityObservationDocument | undefined> {
    const row = this.reachabilityObservations.get(reachabilityObservationId);
    return row ? ReachabilityObservationDocument.hydrate(row) : undefined;
  }

  async listReachabilityObservations(): Promise<readonly ReachabilityObservationDocument[]> {
    return [...this.reachabilityObservations.values()]
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt))
      .map((row) => ReachabilityObservationDocument.hydrate(row));
  }

  async listReachabilityObservationsForDependency(
    dependencyId: string,
  ): Promise<readonly ReachabilityObservationDocument[]> {
    return [...this.reachabilityObservations.values()]
      .filter((row) => row.reachabilityDependencyRef === dependencyId)
      .sort(
        (left, right) =>
          compareIso(left.observedAt, right.observedAt) ||
          compareIso(left.recordedAt, right.recordedAt),
      )
      .map((row) => ReachabilityObservationDocument.hydrate(row));
  }

  async listReachabilityObservationsForSnapshot(
    contactRouteSnapshotRef: string,
  ): Promise<readonly ReachabilityObservationDocument[]> {
    return [...this.reachabilityObservations.values()]
      .filter((row) => row.contactRouteSnapshotRef === contactRouteSnapshotRef)
      .sort(
        (left, right) =>
          compareIso(left.observedAt, right.observedAt) ||
          compareIso(left.recordedAt, right.recordedAt),
      )
      .map((row) => ReachabilityObservationDocument.hydrate(row));
  }

  async saveReachabilityObservation(
    observation: ReachabilityObservationDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = observation.toSnapshot();
    saveWithCas(
      this.reachabilityObservations,
      row.reachabilityObservationId,
      {
        ...row,
        aggregateType: "ReachabilityObservation",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getReachabilityAssessment(
    reachabilityAssessmentId: string,
  ): Promise<ReachabilityAssessmentRecordDocument | undefined> {
    const row = this.reachabilityAssessments.get(reachabilityAssessmentId);
    return row ? ReachabilityAssessmentRecordDocument.hydrate(row) : undefined;
  }

  async getLatestReachabilityAssessmentForDependency(
    dependencyId: string,
  ): Promise<ReachabilityAssessmentRecordDocument | undefined> {
    const rows = [...this.reachabilityAssessments.values()]
      .filter((row) => row.reachabilityDependencyRef === dependencyId)
      .sort((left, right) => compareIso(left.assessedAt, right.assessedAt));
    const row = rows.at(-1);
    return row ? ReachabilityAssessmentRecordDocument.hydrate(row) : undefined;
  }

  async listReachabilityAssessments(): Promise<readonly ReachabilityAssessmentRecordDocument[]> {
    return [...this.reachabilityAssessments.values()]
      .sort((left, right) => compareIso(left.assessedAt, right.assessedAt))
      .map((row) => ReachabilityAssessmentRecordDocument.hydrate(row));
  }

  async listReachabilityAssessmentsForDependency(
    dependencyId: string,
  ): Promise<readonly ReachabilityAssessmentRecordDocument[]> {
    return [...this.reachabilityAssessments.values()]
      .filter((row) => row.reachabilityDependencyRef === dependencyId)
      .sort((left, right) => compareIso(left.assessedAt, right.assessedAt))
      .map((row) => ReachabilityAssessmentRecordDocument.hydrate(row));
  }

  async saveReachabilityAssessment(
    assessment: ReachabilityAssessmentRecordDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = assessment.toSnapshot();
    saveWithCas(
      this.reachabilityAssessments,
      row.reachabilityAssessmentId,
      {
        ...row,
        aggregateType: "ReachabilityAssessmentRecord",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getReachabilityDependency(
    dependencyId: string,
  ): Promise<ReachabilityDependencyDocument | undefined> {
    const row = this.reachabilityDependencies.get(dependencyId);
    return row ? ReachabilityDependencyDocument.hydrate(row) : undefined;
  }

  async listReachabilityDependencies(): Promise<readonly ReachabilityDependencyDocument[]> {
    return [...this.reachabilityDependencies.values()]
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => ReachabilityDependencyDocument.hydrate(row));
  }

  async listReachabilityDependenciesForRequest(
    requestId: string,
  ): Promise<readonly ReachabilityDependencyDocument[]> {
    return [...this.reachabilityDependencies.values()]
      .filter((row) => row.requestId === requestId)
      .sort((left, right) => compareIso(left.createdAt, right.createdAt))
      .map((row) => ReachabilityDependencyDocument.hydrate(row));
  }

  async saveReachabilityDependency(
    dependency: ReachabilityDependencyDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = dependency.toSnapshot();
    saveWithCas(
      this.reachabilityDependencies,
      row.dependencyId,
      {
        ...row,
        aggregateType: "ReachabilityDependency",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getContactRouteRepairJourney(
    repairJourneyId: string,
  ): Promise<ContactRouteRepairJourneyDocument | undefined> {
    const row = this.repairJourneys.get(repairJourneyId);
    return row ? ContactRouteRepairJourneyDocument.hydrate(row) : undefined;
  }

  async listContactRouteRepairJourneys(): Promise<readonly ContactRouteRepairJourneyDocument[]> {
    return [...this.repairJourneys.values()]
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt))
      .map((row) => ContactRouteRepairJourneyDocument.hydrate(row));
  }

  async listContactRouteRepairJourneysForDependency(
    dependencyId: string,
  ): Promise<readonly ContactRouteRepairJourneyDocument[]> {
    return [...this.repairJourneys.values()]
      .filter((row) => row.reachabilityDependencyRef === dependencyId)
      .sort((left, right) => compareIso(left.issuedAt, right.issuedAt))
      .map((row) => ContactRouteRepairJourneyDocument.hydrate(row));
  }

  async saveContactRouteRepairJourney(
    journey: ContactRouteRepairJourneyDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = journey.toSnapshot();
    saveWithCas(
      this.repairJourneys,
      row.repairJourneyId,
      {
        ...row,
        aggregateType: "ContactRouteRepairJourney",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }

  async getContactRouteVerificationCheckpoint(
    checkpointId: string,
  ): Promise<ContactRouteVerificationCheckpointDocument | undefined> {
    const row = this.verificationCheckpoints.get(checkpointId);
    return row ? ContactRouteVerificationCheckpointDocument.hydrate(row) : undefined;
  }

  async listContactRouteVerificationCheckpoints(): Promise<
    readonly ContactRouteVerificationCheckpointDocument[]
  > {
    return [...this.verificationCheckpoints.values()]
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt))
      .map((row) => ContactRouteVerificationCheckpointDocument.hydrate(row));
  }

  async listContactRouteVerificationCheckpointsForRepairJourney(
    repairJourneyId: string,
  ): Promise<readonly ContactRouteVerificationCheckpointDocument[]> {
    return [...this.verificationCheckpoints.values()]
      .filter((row) => row.repairJourneyRef === repairJourneyId)
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt))
      .map((row) => ContactRouteVerificationCheckpointDocument.hydrate(row));
  }

  async saveContactRouteVerificationCheckpoint(
    checkpoint: ContactRouteVerificationCheckpointDocument,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    const row = checkpoint.toSnapshot();
    saveWithCas(
      this.verificationCheckpoints,
      row.checkpointId,
      {
        ...row,
        aggregateType: "ContactRouteVerificationCheckpoint",
        persistenceSchemaVersion: 1,
      },
      options,
    );
  }
}

export function createReachabilityStore(): ReachabilityDependencies {
  return new InMemoryReachabilityStore();
}

function authorityWeightScore(value: ReachabilityAuthorityWeight): number {
  switch (value) {
    case "weak":
      return 1;
    case "moderate":
      return 2;
    case "strong":
      return 3;
  }
}

function latestObservationForClass(
  observations: readonly ReachabilityObservationDocument[],
  observationClass: ReachabilityObservationClass,
): ReachabilityObservationDocument | undefined {
  return observations
    .filter((observation) => observation.toSnapshot().observationClass === observationClass)
    .sort(
      (left, right) =>
        compareIso(left.toSnapshot().observedAt, right.toSnapshot().observedAt) ||
        compareIso(left.toSnapshot().recordedAt, right.toSnapshot().recordedAt),
    )
    .at(-1);
}

function hasObservationClass(
  observations: readonly ReachabilityObservationDocument[],
  observationClass: ReachabilityObservationClass,
): boolean {
  return latestObservationForClass(observations, observationClass) !== undefined;
}

function summarizeObservationScores(observations: readonly ReachabilityObservationDocument[]): {
  positiveScore: number;
  negativeScore: number;
  ambiguousScore: number;
  onlyTransportAcknowledgements: boolean;
  conflictingStrongSignals: boolean;
} {
  let positiveScore = 0;
  let negativeScore = 0;
  let ambiguousScore = 0;
  let onlyTransportAcknowledgements = observations.length > 0;
  let positiveStrong = false;
  let negativeStrong = false;

  for (const observation of observations) {
    const snapshot = observation.toSnapshot();
    const score = authorityWeightScore(snapshot.authorityWeight);
    if (snapshot.observationClass !== "transport_ack") {
      onlyTransportAcknowledgements = false;
    }
    if (snapshot.outcomePolarity === "positive") {
      positiveScore += score;
      positiveStrong ||= score >= 3;
    } else if (snapshot.outcomePolarity === "negative") {
      negativeScore += score;
      negativeStrong ||= score >= 3;
    } else {
      ambiguousScore += score;
    }
  }

  return {
    positiveScore,
    negativeScore,
    ambiguousScore,
    onlyTransportAcknowledgements,
    conflictingStrongSignals: positiveStrong && negativeStrong,
  };
}

function latestSnapshotSuperseded(
  snapshot: ContactRouteSnapshotDocument,
  latestSnapshot: ContactRouteSnapshotDocument | undefined,
): boolean {
  return (
    latestSnapshot !== undefined &&
    latestSnapshot.contactRouteSnapshotId !== snapshot.contactRouteSnapshotId
  );
}

function sameReachabilityObservation(
  existing: ReachabilityObservationDocument,
  input: {
    reachabilityDependencyRef: string;
    contactRouteSnapshotRef: string;
    observationClass: ReachabilityObservationClass;
    observationSourceRef: string;
    observedAt: string;
    outcomePolarity: ReachabilityOutcomePolarity;
    authorityWeight: ReachabilityAuthorityWeight;
    evidenceRef: string;
    supersedesObservationRef: string | null;
  },
): boolean {
  const snapshot = existing.toSnapshot();
  return (
    snapshot.reachabilityDependencyRef === input.reachabilityDependencyRef &&
    snapshot.contactRouteSnapshotRef === input.contactRouteSnapshotRef &&
    snapshot.observationClass === input.observationClass &&
    snapshot.observationSourceRef === input.observationSourceRef &&
    snapshot.observedAt === input.observedAt &&
    snapshot.outcomePolarity === input.outcomePolarity &&
    snapshot.authorityWeight === input.authorityWeight &&
    snapshot.evidenceRef === input.evidenceRef &&
    snapshot.supersedesObservationRef === input.supersedesObservationRef
  );
}

function sameAssessmentPosture(
  existing: ReachabilityAssessmentRecordDocument,
  next: ReachabilityAssessmentRecordDocument,
): boolean {
  const current = existing.toSnapshot();
  const candidate = next.toSnapshot();
  return (
    current.contactRouteSnapshotRef === candidate.contactRouteSnapshotRef &&
    stableStringify(current.consideredObservationRefs) ===
      stableStringify(candidate.consideredObservationRefs) &&
    current.routeAuthorityState === candidate.routeAuthorityState &&
    current.deliverabilityState === candidate.deliverabilityState &&
    current.deliveryRiskState === candidate.deliveryRiskState &&
    current.assessmentState === candidate.assessmentState &&
    current.falseNegativeGuardState === candidate.falseNegativeGuardState &&
    current.dominantReasonCode === candidate.dominantReasonCode &&
    current.resultingRepairState === candidate.resultingRepairState
  );
}

export interface ReachabilityAssessmentCalculationInput {
  dependencyId: string;
  governingObjectRef: string;
  contactRouteSnapshot: ContactRouteSnapshotDocument;
  observations: readonly ReachabilityObservationDocument[];
  latestRouteSnapshot?: ContactRouteSnapshotDocument;
  priorAssessmentRef?: string | null;
  resultingReachabilityEpoch: number;
  assessedAt: string;
  rebindPending?: boolean;
}

export interface CalculatedReachabilityAssessment {
  routeAuthorityState: RouteAuthorityState;
  deliverabilityState: DeliverabilityState;
  deliveryRiskState: DeliveryRiskState;
  assessmentState: ReachabilityAssessmentState;
  falseNegativeGuardState: FalseNegativeGuardState;
  dominantReasonCode: string;
  resultingRepairState: ReachabilityRepairState;
  consideredObservationRefs: readonly string[];
}

export function calculateReachabilityAssessment(
  input: ReachabilityAssessmentCalculationInput,
): CalculatedReachabilityAssessment {
  const snapshot = input.contactRouteSnapshot.toSnapshot();
  const observations = [...input.observations].sort(
    (left, right) =>
      compareIso(left.toSnapshot().observedAt, right.toSnapshot().observedAt) ||
      compareIso(left.toSnapshot().recordedAt, right.toSnapshot().recordedAt),
  );
  const observationRefs = observations.map((observation) => observation.reachabilityObservationId);
  const scores = summarizeObservationScores(observations);
  const superseded = latestSnapshotSuperseded(
    input.contactRouteSnapshot,
    input.latestRouteSnapshot,
  );

  let routeAuthorityState: RouteAuthorityState;
  if (superseded || snapshot.verificationState === "superseded") {
    routeAuthorityState = "superseded";
  } else if (
    snapshot.verificationState === "disputed" ||
    snapshot.demographicFreshnessState === "disputed" ||
    snapshot.preferenceFreshnessState === "disputed" ||
    hasObservationClass(observations, "manual_dispute")
  ) {
    routeAuthorityState = "disputed";
  } else if (
    snapshot.demographicFreshnessState === "stale" ||
    hasObservationClass(observations, "demographic_change")
  ) {
    routeAuthorityState = "stale_demographics";
  } else if (
    snapshot.preferenceFreshnessState === "stale" ||
    hasObservationClass(observations, "preference_change") ||
    hasObservationClass(observations, "opt_out")
  ) {
    routeAuthorityState = "stale_preferences";
  } else if (
    snapshot.verificationState !== "verified_current" ||
    hasObservationClass(observations, "verification_failure")
  ) {
    routeAuthorityState = "stale_verification";
  } else {
    routeAuthorityState = "current";
  }

  let deliverabilityState: DeliverabilityState;
  if (
    hasObservationClass(observations, "invalid_route") ||
    hasObservationClass(observations, "opt_out") ||
    hasObservationClass(observations, "manual_confirmed_unreachable")
  ) {
    deliverabilityState = "confirmed_failed";
  } else if (scores.conflictingStrongSignals) {
    deliverabilityState = "uncertain";
  } else if (
    hasObservationClass(observations, "verification_success") ||
    hasObservationClass(observations, "manual_confirmed_reachable") ||
    (scores.positiveScore >= 2 &&
      scores.negativeScore === 0 &&
      routeAuthorityState === "current" &&
      !scores.onlyTransportAcknowledgements)
  ) {
    deliverabilityState = "confirmed_reachable";
  } else if (scores.negativeScore >= 3 || hasObservationClass(observations, "bounce")) {
    deliverabilityState = "likely_failed";
  } else {
    deliverabilityState = "uncertain";
  }

  let falseNegativeGuardState: FalseNegativeGuardState;
  if (routeAuthorityState !== "current") {
    falseNegativeGuardState = "stale_input";
  } else if (scores.conflictingStrongSignals) {
    falseNegativeGuardState = "conflicting_signal";
  } else if (observations.length === 0 || scores.onlyTransportAcknowledgements) {
    falseNegativeGuardState = "insufficient_observation";
  } else {
    falseNegativeGuardState = "pass";
  }

  let deliveryRiskState: DeliveryRiskState;
  if (routeAuthorityState === "disputed" || routeAuthorityState === "superseded") {
    deliveryRiskState = "disputed";
  } else if (
    deliverabilityState === "confirmed_reachable" &&
    falseNegativeGuardState === "pass" &&
    routeAuthorityState === "current"
  ) {
    deliveryRiskState = "on_track";
  } else if (
    deliverabilityState === "confirmed_failed" ||
    deliverabilityState === "likely_failed"
  ) {
    deliveryRiskState = "likely_failed";
  } else {
    deliveryRiskState = "at_risk";
  }

  let assessmentState: ReachabilityAssessmentState;
  if (
    routeAuthorityState === "disputed" ||
    falseNegativeGuardState === "conflicting_signal" ||
    deliveryRiskState === "disputed"
  ) {
    assessmentState = "disputed";
  } else if (
    routeAuthorityState !== "current" ||
    deliverabilityState === "confirmed_failed" ||
    deliverabilityState === "likely_failed"
  ) {
    assessmentState = "blocked";
  } else if (deliveryRiskState === "at_risk" || falseNegativeGuardState !== "pass") {
    assessmentState = "at_risk";
  } else {
    assessmentState = "clear";
  }

  let resultingRepairState: ReachabilityRepairState;
  if (assessmentState === "clear") {
    resultingRepairState = input.rebindPending ? "rebound_pending" : "none";
  } else if (
    routeAuthorityState === "stale_verification" ||
    snapshot.verificationState === "unverified" ||
    snapshot.verificationState === "verified_stale" ||
    snapshot.verificationState === "failed" ||
    hasObservationClass(observations, "verification_failure")
  ) {
    resultingRepairState = "awaiting_verification";
  } else {
    resultingRepairState = "repair_required";
  }

  let dominantReasonCode = "CLEAR_VERIFIED_REACHABLE";
  if (routeAuthorityState === "superseded") {
    dominantReasonCode = "SNAPSHOT_SUPERSEDED";
  } else if (routeAuthorityState === "disputed") {
    dominantReasonCode = hasObservationClass(observations, "manual_dispute")
      ? "MANUAL_DISPUTE_OPEN"
      : "ROUTE_AUTHORITY_DISPUTED";
  } else if (hasObservationClass(observations, "opt_out")) {
    dominantReasonCode = "PREFERENCE_OPT_OUT_ACTIVE";
  } else if (routeAuthorityState === "stale_preferences") {
    dominantReasonCode = "PREFERENCE_FRESHNESS_STALE";
  } else if (routeAuthorityState === "stale_demographics") {
    dominantReasonCode = "DEMOGRAPHIC_FRESHNESS_STALE";
  } else if (routeAuthorityState === "stale_verification") {
    dominantReasonCode = hasObservationClass(observations, "verification_failure")
      ? "VERIFICATION_FAILURE_RECORDED"
      : "VERIFICATION_STALE_OR_MISSING";
  } else if (hasObservationClass(observations, "invalid_route")) {
    dominantReasonCode = "INVALID_ROUTE_CONFIRMED";
  } else if (hasObservationClass(observations, "manual_confirmed_unreachable")) {
    dominantReasonCode = "MANUAL_UNREACHABLE_CONFIRMED";
  } else if (hasObservationClass(observations, "bounce")) {
    dominantReasonCode = "DELIVERY_BOUNCE_RECORDED";
  } else if (deliverabilityState === "likely_failed") {
    dominantReasonCode = "DELIVERY_LIKELY_FAILED";
  } else if (scores.onlyTransportAcknowledgements) {
    dominantReasonCode = "TRANSPORT_ACK_WITHOUT_PROOF";
  } else if (deliverabilityState === "confirmed_reachable") {
    dominantReasonCode = hasObservationClass(observations, "verification_success")
      ? "VERIFICATION_SUCCESS_REBOUND_READY"
      : "REACHABLE_SIGNAL_CONFIRMED";
  } else if (assessmentState === "at_risk") {
    dominantReasonCode = "INSUFFICIENT_REACHABILITY_SIGNAL";
  }

  return {
    routeAuthorityState,
    deliverabilityState,
    deliveryRiskState,
    assessmentState,
    falseNegativeGuardState,
    dominantReasonCode,
    resultingRepairState,
    consideredObservationRefs: observationRefs,
  };
}

export function estimateReachabilitySuccessProbability(
  assessment: ReachabilityAssessmentRecordDocument,
): number {
  const snapshot = assessment.toSnapshot();
  if (
    snapshot.assessmentState === "clear" &&
    snapshot.routeAuthorityState === "current" &&
    snapshot.falseNegativeGuardState === "pass"
  ) {
    return 1;
  }
  if (
    snapshot.assessmentState === "blocked" &&
    (snapshot.deliverabilityState === "confirmed_failed" ||
      snapshot.routeAuthorityState === "disputed" ||
      snapshot.routeAuthorityState === "superseded")
  ) {
    return 0;
  }
  if (
    snapshot.assessmentState === "at_risk" &&
    snapshot.routeAuthorityState === "current" &&
    snapshot.falseNegativeGuardState === "pass"
  ) {
    return 0.35;
  }
  return 0.15;
}

function createAssessmentDocument(input: {
  reachabilityAssessmentId: string;
  dependencyId: string;
  governingObjectRef: string;
  snapshot: ContactRouteSnapshotDocument;
  observations: readonly ReachabilityObservationDocument[];
  latestRouteSnapshot?: ContactRouteSnapshotDocument;
  priorAssessmentRef?: string | null;
  resultingReachabilityEpoch: number;
  assessedAt: string;
  rebindPending?: boolean;
}): ReachabilityAssessmentRecordDocument {
  const calculated = calculateReachabilityAssessment({
    dependencyId: input.dependencyId,
    governingObjectRef: input.governingObjectRef,
    contactRouteSnapshot: input.snapshot,
    observations: input.observations,
    latestRouteSnapshot: input.latestRouteSnapshot,
    priorAssessmentRef: input.priorAssessmentRef,
    resultingReachabilityEpoch: input.resultingReachabilityEpoch,
    assessedAt: input.assessedAt,
    rebindPending: input.rebindPending,
  });
  return ReachabilityAssessmentRecordDocument.create({
    reachabilityAssessmentId: input.reachabilityAssessmentId,
    reachabilityDependencyRef: input.dependencyId,
    governingObjectRef: input.governingObjectRef,
    contactRouteSnapshotRef: input.snapshot.contactRouteSnapshotId,
    consideredObservationRefs: calculated.consideredObservationRefs,
    priorAssessmentRef: input.priorAssessmentRef ?? null,
    routeAuthorityState: calculated.routeAuthorityState,
    deliverabilityState: calculated.deliverabilityState,
    deliveryRiskState: calculated.deliveryRiskState,
    assessmentState: calculated.assessmentState,
    falseNegativeGuardState: calculated.falseNegativeGuardState,
    dominantReasonCode: calculated.dominantReasonCode,
    resultingRepairState: calculated.resultingRepairState,
    resultingReachabilityEpoch: input.resultingReachabilityEpoch,
    assessedAt: input.assessedAt,
  });
}

export interface FreezeContactRouteSnapshotInput {
  subjectRef: string;
  routeRef: string;
  routeVersionRef: string;
  routeKind: ContactRouteKind;
  normalizedAddressRef: string;
  preferenceProfileRef: string;
  verificationCheckpointRef?: string | null;
  verificationState: ContactRouteSnapshotVerificationState;
  demographicFreshnessState: ContactRouteFreshnessState;
  preferenceFreshnessState: ContactRouteFreshnessState;
  sourceAuthorityClass: ContactRouteSourceAuthorityClass;
  expectedCurrentSnapshotRef?: string | null;
  createdAt: string;
}

export interface FreezeContactRouteSnapshotResult {
  readonly snapshot: ContactRouteSnapshotDocument;
  readonly previousSnapshot: ContactRouteSnapshotDocument | null;
}

export interface CreateReachabilityDependencyInput {
  episodeId: string;
  requestId: string;
  domain: ReachabilityDomain;
  domainObjectRef: string;
  requiredRouteRef: string;
  purpose: ReachabilityPurpose;
  blockedActionScopeRefs: readonly AccessGrantActionScope[];
  selectedAnchorRef: string;
  requestReturnBundleRef?: string | null;
  resumeContinuationRef?: string | null;
  deadlineAt: string;
  failureEffect: ReachabilityFailureEffect;
  assessedAt: string;
}

export interface ReachabilityDependencyResult {
  readonly dependency: ReachabilityDependencyDocument;
  readonly assessment: ReachabilityAssessmentRecordDocument;
}

export interface RecordReachabilityObservationInput {
  reachabilityDependencyRef: string;
  contactRouteSnapshotRef?: string | null;
  observationClass: ReachabilityObservationClass;
  observationSourceRef: string;
  observedAt: string;
  recordedAt: string;
  outcomePolarity: ReachabilityOutcomePolarity;
  authorityWeight: ReachabilityAuthorityWeight;
  evidenceRef: string;
  supersedesObservationRef?: string | null;
}

export interface RefreshReachabilityAssessmentInput {
  reachabilityDependencyRef: string;
  contactRouteSnapshotRef?: string | null;
  assessedAt: string;
  rebindPending?: boolean;
}

export interface OpenContactRouteRepairJourneyInput {
  reachabilityDependencyRef: string;
  patientRecoveryLoopRef?: string | null;
  issuedAt: string;
}

export interface ContactRouteRepairJourneyResult {
  readonly dependency: ReachabilityDependencyDocument;
  readonly journey: ContactRouteRepairJourneyDocument;
}

export interface AttachCandidateContactRouteInput {
  repairJourneyRef: string;
  contactRouteSnapshotRef: string;
  updatedAt: string;
}

export interface IssueContactRouteVerificationCheckpointInput {
  repairJourneyRef: string;
  contactRouteRef: string;
  contactRouteVersionRef: string;
  verificationMethod: ContactRouteVerificationMethod;
  dependentGrantRefs?: readonly string[];
  dependentRouteIntentRefs?: readonly string[];
  evaluatedAt: string;
}

export interface SettleContactRouteVerificationCheckpointInput {
  checkpointId: string;
  verificationState: Exclude<ContactRouteVerificationState, "pending">;
  evaluatedAt: string;
}

export interface SettleContactRouteVerificationCheckpointResult {
  readonly checkpoint: ContactRouteVerificationCheckpointDocument;
  readonly journey: ContactRouteRepairJourneyDocument;
  readonly dependency: ReachabilityDependencyDocument;
  readonly resultingSnapshot: ContactRouteSnapshotDocument | null;
  readonly assessment: ReachabilityAssessmentRecordDocument;
}

export class ReachabilityGovernorService {
  private readonly repositories: ReachabilityDependencies;
  private readonly idGenerator: BackboneIdGenerator;

  constructor(repositories: ReachabilityDependencies, idGenerator: BackboneIdGenerator) {
    this.repositories = repositories;
    this.idGenerator = idGenerator;
  }

  private async appendGovernanceEvents(
    events: readonly {
      eventName: string;
      emittedAt: string;
      payload: Record<string, unknown>;
    }[],
  ): Promise<void> {
    const candidate = this.repositories as ReachabilityDependencies & {
      appendIdentityRepairReachabilityEvents?: (
        events: readonly {
          eventName: string;
          emittedAt: string;
          payload: Record<string, unknown>;
        }[],
      ) => Promise<void>;
    };
    if (
      typeof candidate.appendIdentityRepairReachabilityEvents === "function" &&
      events.length > 0
    ) {
      await candidate.appendIdentityRepairReachabilityEvents(events);
    }
  }

  async freezeContactRouteSnapshot(
    input: FreezeContactRouteSnapshotInput,
  ): Promise<FreezeContactRouteSnapshotResult> {
    const previousSnapshot = await this.repositories.getLatestContactRouteSnapshotForRoute(
      input.routeRef,
    );
    if (input.expectedCurrentSnapshotRef !== undefined) {
      invariant(
        optionalRef(input.expectedCurrentSnapshotRef) ===
          (previousSnapshot?.contactRouteSnapshotId ?? null),
        "CONTACT_ROUTE_SNAPSHOT_EXPECTATION_MISMATCH",
        "ContactRouteSnapshot compare-and-set guard failed.",
      );
    }
    const snapshot = ContactRouteSnapshotDocument.create({
      contactRouteSnapshotId: nextReachabilityId(this.idGenerator, "contactRouteSnapshot"),
      subjectRef: input.subjectRef,
      routeRef: input.routeRef,
      routeVersionRef: input.routeVersionRef,
      routeKind: input.routeKind,
      normalizedAddressRef: input.normalizedAddressRef,
      preferenceProfileRef: input.preferenceProfileRef,
      verificationCheckpointRef: input.verificationCheckpointRef ?? null,
      verificationState: input.verificationState,
      demographicFreshnessState: input.demographicFreshnessState,
      preferenceFreshnessState: input.preferenceFreshnessState,
      sourceAuthorityClass: input.sourceAuthorityClass,
      supersedesSnapshotRef: previousSnapshot?.contactRouteSnapshotId ?? null,
      snapshotVersion: (previousSnapshot?.snapshotVersion ?? 0) + 1,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    });
    await this.repositories.saveContactRouteSnapshot(snapshot);
    if (previousSnapshot !== undefined) {
      await this.appendGovernanceEvents([
        {
          eventName: "reachability.route_snapshot.superseded",
          emittedAt: input.createdAt,
          payload: {
            priorContactRouteSnapshotRef: previousSnapshot.contactRouteSnapshotId,
            nextContactRouteSnapshotRef: snapshot.contactRouteSnapshotId,
            routeRef: input.routeRef,
            snapshotVersion: snapshot.toSnapshot().snapshotVersion,
          },
        },
      ]);
    }
    return { snapshot, previousSnapshot: previousSnapshot ?? null };
  }

  async createDependency(
    input: CreateReachabilityDependencyInput,
  ): Promise<ReachabilityDependencyResult> {
    const currentSnapshot = await this.repositories.getLatestContactRouteSnapshotForRoute(
      input.requiredRouteRef,
    );
    invariant(
      currentSnapshot,
      "CONTACT_ROUTE_SNAPSHOT_REQUIRED",
      `A ContactRouteSnapshot is required before dependency ${input.domainObjectRef} can bind reachability truth.`,
    );
    const assessment = createAssessmentDocument({
      reachabilityAssessmentId: nextReachabilityId(this.idGenerator, "reachabilityAssessment"),
      dependencyId: "pending",
      governingObjectRef: input.domainObjectRef,
      snapshot: currentSnapshot,
      observations: [],
      latestRouteSnapshot: currentSnapshot,
      priorAssessmentRef: null,
      resultingReachabilityEpoch: 1,
      assessedAt: input.assessedAt,
    });
    const dependency = ReachabilityDependencyDocument.create({
      dependencyId: nextReachabilityId(this.idGenerator, "reachabilityDependency"),
      episodeId: input.episodeId,
      requestId: input.requestId,
      domain: input.domain,
      domainObjectRef: input.domainObjectRef,
      requiredRouteRef: input.requiredRouteRef,
      contactRouteVersionRef: currentSnapshot.toSnapshot().routeVersionRef,
      currentContactRouteSnapshotRef: currentSnapshot.contactRouteSnapshotId,
      currentReachabilityAssessmentRef: "pending",
      reachabilityEpoch: 1,
      purpose: input.purpose,
      blockedActionScopeRefs: input.blockedActionScopeRefs,
      selectedAnchorRef: input.selectedAnchorRef,
      requestReturnBundleRef: input.requestReturnBundleRef ?? null,
      resumeContinuationRef: input.resumeContinuationRef ?? null,
      repairJourneyRef: null,
      routeAuthorityState: "current",
      routeHealthState: routeHealthFromAssessment(assessment.toSnapshot().assessmentState),
      deliveryRiskState: assessment.toSnapshot().deliveryRiskState,
      repairState: assessment.toSnapshot().resultingRepairState,
      deadlineAt: input.deadlineAt,
      failureEffect: input.failureEffect,
      state: "active",
      createdAt: input.assessedAt,
      updatedAt: input.assessedAt,
    });
    const finalizedAssessment = ReachabilityAssessmentRecordDocument.create({
      ...assessment.toSnapshot(),
      reachabilityAssessmentId: nextReachabilityId(this.idGenerator, "reachabilityAssessment"),
      reachabilityDependencyRef: dependency.dependencyId,
      resultingReachabilityEpoch: 1,
    });
    const finalizedDependency = ReachabilityDependencyDocument.hydrate({
      ...dependency.toSnapshot(),
      currentReachabilityAssessmentRef: finalizedAssessment.reachabilityAssessmentId,
      routeAuthorityState: finalizedAssessment.toSnapshot().routeAuthorityState,
      routeHealthState: routeHealthFromAssessment(finalizedAssessment.toSnapshot().assessmentState),
      deliveryRiskState: finalizedAssessment.toSnapshot().deliveryRiskState,
      repairState: finalizedAssessment.toSnapshot().resultingRepairState,
    });
    await this.repositories.saveReachabilityAssessment(finalizedAssessment);
    await this.repositories.saveReachabilityDependency(finalizedDependency);
    await this.appendGovernanceEvents([
      {
        eventName: "reachability.assessment.settled",
        emittedAt: input.assessedAt,
        payload: {
          dependencyId: finalizedDependency.dependencyId,
          reachabilityAssessmentId: finalizedAssessment.reachabilityAssessmentId,
          assessmentState: finalizedAssessment.toSnapshot().assessmentState,
          routeHealthState: finalizedDependency.toSnapshot().routeHealthState,
        },
      },
      {
        eventName: "reachability.changed",
        emittedAt: input.assessedAt,
        payload: {
          dependencyId: finalizedDependency.dependencyId,
          reachabilityAssessmentId: finalizedAssessment.reachabilityAssessmentId,
          assessmentState: finalizedAssessment.toSnapshot().assessmentState,
          routeHealthState: finalizedDependency.toSnapshot().routeHealthState,
          repairState: finalizedDependency.toSnapshot().repairState,
        },
      },
    ]);
    return {
      dependency: finalizedDependency,
      assessment: finalizedAssessment,
    };
  }

  async recordObservation(
    input: RecordReachabilityObservationInput,
  ): Promise<ReachabilityObservationDocument> {
    const dependency = await this.repositories.getReachabilityDependency(
      input.reachabilityDependencyRef,
    );
    invariant(
      dependency,
      "REACHABILITY_DEPENDENCY_NOT_FOUND",
      `ReachabilityDependency ${input.reachabilityDependencyRef} was not found.`,
    );
    const snapshotRef =
      optionalRef(input.contactRouteSnapshotRef) ?? dependency.currentContactRouteSnapshotRef;
    const snapshot = await this.repositories.getContactRouteSnapshot(snapshotRef);
    invariant(
      snapshot,
      "CONTACT_ROUTE_SNAPSHOT_NOT_FOUND",
      `ContactRouteSnapshot ${snapshotRef} was not found.`,
    );
    const existing = await this.repositories.listReachabilityObservationsForDependency(
      dependency.dependencyId,
    );
    const replayed = existing.find((candidate) =>
      sameReachabilityObservation(candidate, {
        reachabilityDependencyRef: dependency.dependencyId,
        contactRouteSnapshotRef: snapshot.contactRouteSnapshotId,
        observationClass: input.observationClass,
        observationSourceRef: input.observationSourceRef,
        observedAt: input.observedAt,
        outcomePolarity: input.outcomePolarity,
        authorityWeight: input.authorityWeight,
        evidenceRef: input.evidenceRef,
        supersedesObservationRef: input.supersedesObservationRef ?? null,
      }),
    );
    if (replayed) {
      return replayed;
    }
    const observation = ReachabilityObservationDocument.create({
      reachabilityObservationId: nextReachabilityId(this.idGenerator, "reachabilityObservation"),
      reachabilityDependencyRef: dependency.dependencyId,
      contactRouteSnapshotRef: snapshot.contactRouteSnapshotId,
      observationClass: input.observationClass,
      observationSourceRef: input.observationSourceRef,
      observedAt: input.observedAt,
      recordedAt: input.recordedAt,
      outcomePolarity: input.outcomePolarity,
      authorityWeight: input.authorityWeight,
      evidenceRef: input.evidenceRef,
      supersedesObservationRef: input.supersedesObservationRef ?? null,
    });
    await this.repositories.saveReachabilityObservation(observation);
    return observation;
  }

  async refreshDependencyAssessment(
    input: RefreshReachabilityAssessmentInput,
  ): Promise<ReachabilityDependencyResult> {
    const dependency = await this.repositories.getReachabilityDependency(
      input.reachabilityDependencyRef,
    );
    invariant(
      dependency,
      "REACHABILITY_DEPENDENCY_NOT_FOUND",
      `ReachabilityDependency ${input.reachabilityDependencyRef} was not found.`,
    );
    const snapshotRef =
      optionalRef(input.contactRouteSnapshotRef) ?? dependency.currentContactRouteSnapshotRef;
    const snapshot = await this.repositories.getContactRouteSnapshot(snapshotRef);
    invariant(
      snapshot,
      "CONTACT_ROUTE_SNAPSHOT_NOT_FOUND",
      `ContactRouteSnapshot ${snapshotRef} was not found.`,
    );
    const observations = (
      await this.repositories.listReachabilityObservationsForDependency(dependency.dependencyId)
    ).filter(
      (observation) => observation.contactRouteSnapshotRef === snapshot.contactRouteSnapshotId,
    );
    const latestRouteSnapshot = await this.repositories.getLatestContactRouteSnapshotForRoute(
      snapshot.routeRef,
    );
    const currentAssessment = await this.repositories.getReachabilityAssessment(
      dependency.currentReachabilityAssessmentRef,
    );
    invariant(
      currentAssessment,
      "CURRENT_REACHABILITY_ASSESSMENT_NOT_FOUND",
      `ReachabilityAssessmentRecord ${dependency.currentReachabilityAssessmentRef} was not found.`,
    );
    const assessment = createAssessmentDocument({
      reachabilityAssessmentId: nextReachabilityId(this.idGenerator, "reachabilityAssessment"),
      dependencyId: dependency.dependencyId,
      governingObjectRef: dependency.toSnapshot().domainObjectRef,
      snapshot,
      observations,
      latestRouteSnapshot: latestRouteSnapshot ?? undefined,
      priorAssessmentRef: dependency.currentReachabilityAssessmentRef,
      resultingReachabilityEpoch: dependency.toSnapshot().reachabilityEpoch + 1,
      assessedAt: input.assessedAt,
      rebindPending: input.rebindPending,
    });
    if (sameAssessmentPosture(currentAssessment, assessment)) {
      return {
        dependency,
        assessment: currentAssessment,
      };
    }
    await this.repositories.saveReachabilityAssessment(assessment);
    const updatedDependency = dependency.applyAssessment({
      assessment,
      contactRouteSnapshotRef: snapshot.contactRouteSnapshotId,
      updatedAt: input.assessedAt,
    });
    await this.repositories.saveReachabilityDependency(updatedDependency, {
      expectedVersion: dependency.version,
    });
    const events = [
      {
        eventName: "reachability.assessment.settled",
        emittedAt: input.assessedAt,
        payload: {
          dependencyId: updatedDependency.dependencyId,
          reachabilityAssessmentId: assessment.reachabilityAssessmentId,
          assessmentState: assessment.toSnapshot().assessmentState,
          dominantReasonCode: assessment.toSnapshot().dominantReasonCode,
        },
      },
      {
        eventName: "reachability.changed",
        emittedAt: input.assessedAt,
        payload: {
          dependencyId: updatedDependency.dependencyId,
          reachabilityAssessmentId: assessment.reachabilityAssessmentId,
          assessmentState: assessment.toSnapshot().assessmentState,
          routeHealthState: updatedDependency.toSnapshot().routeHealthState,
          repairState: updatedDependency.toSnapshot().repairState,
        },
      },
    ] as const;
    await this.appendGovernanceEvents(events);
    return {
      dependency: updatedDependency,
      assessment,
    };
  }

  async openRepairJourney(
    input: OpenContactRouteRepairJourneyInput,
  ): Promise<ContactRouteRepairJourneyResult> {
    const dependency = await this.repositories.getReachabilityDependency(
      input.reachabilityDependencyRef,
    );
    invariant(
      dependency,
      "REACHABILITY_DEPENDENCY_NOT_FOUND",
      `ReachabilityDependency ${input.reachabilityDependencyRef} was not found.`,
    );
    const currentAssessment = await this.repositories.getReachabilityAssessment(
      dependency.currentReachabilityAssessmentRef,
    );
    invariant(
      currentAssessment,
      "REACHABILITY_ASSESSMENT_NOT_FOUND",
      `ReachabilityAssessmentRecord ${dependency.currentReachabilityAssessmentRef} was not found.`,
    );
    invariant(
      currentAssessment.assessmentState !== "clear",
      "REPAIR_JOURNEY_NOT_ALLOWED_FOR_CLEAR_ASSESSMENT",
      "ContactRouteRepairJourney may open only when the current assessment is not clear.",
    );
    if (dependency.repairJourneyRef) {
      const existing = await this.repositories.getContactRouteRepairJourney(
        dependency.repairJourneyRef,
      );
      invariant(
        existing,
        "REPAIR_JOURNEY_POINTER_DRIFT",
        `Repair journey ${dependency.repairJourneyRef} is missing.`,
      );
      return { dependency, journey: existing };
    }
    const journey = ContactRouteRepairJourneyDocument.create({
      repairJourneyId: nextReachabilityId(this.idGenerator, "contactRouteRepairJourney"),
      reachabilityDependencyRef: dependency.dependencyId,
      governingObjectRef: dependency.toSnapshot().domainObjectRef,
      blockedActionScopeRefs: dependency.toSnapshot().blockedActionScopeRefs,
      selectedAnchorRef: dependency.toSnapshot().selectedAnchorRef,
      requestReturnBundleRef: dependency.toSnapshot().requestReturnBundleRef,
      resumeContinuationRef: dependency.toSnapshot().resumeContinuationRef,
      patientRecoveryLoopRef: input.patientRecoveryLoopRef ?? null,
      blockedAssessmentRef: currentAssessment.reachabilityAssessmentId,
      currentContactRouteSnapshotRef: dependency.currentContactRouteSnapshotRef,
      candidateContactRouteSnapshotRef: null,
      verificationCheckpointRef: null,
      resultingReachabilityAssessmentRef: null,
      journeyState: "ready",
      issuedAt: input.issuedAt,
      updatedAt: input.issuedAt,
      completedAt: null,
    });
    await this.repositories.saveContactRouteRepairJourney(journey);
    const updatedDependency = dependency.bindRepairJourney({
      repairJourneyRef: journey.repairJourneyId,
      updatedAt: input.issuedAt,
    });
    await this.repositories.saveReachabilityDependency(updatedDependency, {
      expectedVersion: dependency.version,
    });
    await this.appendGovernanceEvents([
      {
        eventName: "reachability.repair.started",
        emittedAt: input.issuedAt,
        payload: {
          dependencyId: updatedDependency.dependencyId,
          repairJourneyId: journey.repairJourneyId,
          blockedAssessmentRef: journey.toSnapshot().blockedAssessmentRef,
          blockedActionScopeRefs: journey.toSnapshot().blockedActionScopeRefs,
        },
      },
    ]);
    return { dependency: updatedDependency, journey };
  }

  async attachCandidateSnapshot(
    input: AttachCandidateContactRouteInput,
  ): Promise<ContactRouteRepairJourneyDocument> {
    const journey = await this.repositories.getContactRouteRepairJourney(input.repairJourneyRef);
    invariant(
      journey,
      "REPAIR_JOURNEY_NOT_FOUND",
      `ContactRouteRepairJourney ${input.repairJourneyRef} was not found.`,
    );
    const snapshot = await this.repositories.getContactRouteSnapshot(input.contactRouteSnapshotRef);
    invariant(
      snapshot,
      "CONTACT_ROUTE_SNAPSHOT_NOT_FOUND",
      `ContactRouteSnapshot ${input.contactRouteSnapshotRef} was not found.`,
    );
    const updatedJourney = journey.attachCandidateSnapshot({
      candidateContactRouteSnapshotRef: snapshot.contactRouteSnapshotId,
      updatedAt: input.updatedAt,
    });
    await this.repositories.saveContactRouteRepairJourney(updatedJourney, {
      expectedVersion: journey.version,
    });
    return updatedJourney;
  }

  async issueVerificationCheckpoint(
    input: IssueContactRouteVerificationCheckpointInput,
  ): Promise<ContactRouteVerificationCheckpointDocument> {
    const journey = await this.repositories.getContactRouteRepairJourney(input.repairJourneyRef);
    invariant(
      journey,
      "REPAIR_JOURNEY_NOT_FOUND",
      `ContactRouteRepairJourney ${input.repairJourneyRef} was not found.`,
    );
    invariant(
      journey.candidateContactRouteSnapshotRef !== null,
      "CANDIDATE_SNAPSHOT_REQUIRED",
      "A candidate ContactRouteSnapshot is required before a verification checkpoint can open.",
    );
    if (journey.verificationCheckpointRef) {
      const existing = await this.repositories.getContactRouteVerificationCheckpoint(
        journey.verificationCheckpointRef,
      );
      invariant(
        existing,
        "VERIFICATION_CHECKPOINT_POINTER_DRIFT",
        `Verification checkpoint ${journey.verificationCheckpointRef} is missing.`,
      );
      return existing;
    }
    const checkpoint = ContactRouteVerificationCheckpointDocument.create({
      checkpointId: nextReachabilityId(this.idGenerator, "contactRouteVerificationCheckpoint"),
      repairJourneyRef: journey.repairJourneyId,
      contactRouteRef: input.contactRouteRef,
      contactRouteVersionRef: input.contactRouteVersionRef,
      preVerificationAssessmentRef: journey.toSnapshot().blockedAssessmentRef,
      verificationMethod: input.verificationMethod,
      verificationState: "pending",
      resultingContactRouteSnapshotRef: null,
      resultingReachabilityAssessmentRef: null,
      rebindState: "pending",
      dependentGrantRefs: input.dependentGrantRefs ?? [],
      dependentRouteIntentRefs: input.dependentRouteIntentRefs ?? [],
      evaluatedAt: input.evaluatedAt,
    });
    await this.repositories.saveContactRouteVerificationCheckpoint(checkpoint);
    const updatedJourney = journey.attachCheckpoint({
      verificationCheckpointRef: checkpoint.checkpointId,
      updatedAt: input.evaluatedAt,
    });
    await this.repositories.saveContactRouteRepairJourney(updatedJourney, {
      expectedVersion: journey.version,
    });
    return checkpoint;
  }

  async settleVerificationCheckpoint(
    input: SettleContactRouteVerificationCheckpointInput,
  ): Promise<SettleContactRouteVerificationCheckpointResult> {
    const checkpoint = await this.repositories.getContactRouteVerificationCheckpoint(
      input.checkpointId,
    );
    invariant(
      checkpoint,
      "VERIFICATION_CHECKPOINT_NOT_FOUND",
      `ContactRouteVerificationCheckpoint ${input.checkpointId} was not found.`,
    );
    const journey = await this.repositories.getContactRouteRepairJourney(
      checkpoint.repairJourneyRef,
    );
    invariant(
      journey,
      "REPAIR_JOURNEY_NOT_FOUND",
      `ContactRouteRepairJourney ${checkpoint.repairJourneyRef} was not found.`,
    );
    const dependency = await this.repositories.getReachabilityDependency(
      journey.reachabilityDependencyRef,
    );
    invariant(
      dependency,
      "REACHABILITY_DEPENDENCY_NOT_FOUND",
      `ReachabilityDependency ${journey.reachabilityDependencyRef} was not found.`,
    );
    const preAssessment = await this.repositories.getReachabilityAssessment(
      checkpoint.toSnapshot().preVerificationAssessmentRef,
    );
    invariant(
      preAssessment,
      "PRE_VERIFICATION_ASSESSMENT_NOT_FOUND",
      `ReachabilityAssessmentRecord ${checkpoint.toSnapshot().preVerificationAssessmentRef} was not found.`,
    );

    const candidateSnapshotRef = journey.candidateContactRouteSnapshotRef;
    invariant(
      candidateSnapshotRef,
      "CANDIDATE_SNAPSHOT_REQUIRED",
      "Repair journey must hold a candidate ContactRouteSnapshot before verification settles.",
    );
    const candidateSnapshot = await this.repositories.getContactRouteSnapshot(candidateSnapshotRef);
    invariant(
      candidateSnapshot,
      "CONTACT_ROUTE_SNAPSHOT_NOT_FOUND",
      `ContactRouteSnapshot ${candidateSnapshotRef} was not found.`,
    );

    let resultingSnapshot: ContactRouteSnapshotDocument | null = null;
    if (input.verificationState === "verified") {
      const latestForRoute = await this.repositories.getLatestContactRouteSnapshotForRoute(
        candidateSnapshot.routeRef,
      );
      invariant(
        latestForRoute?.contactRouteSnapshotId === candidateSnapshot.contactRouteSnapshotId,
        "VERIFIED_SNAPSHOT_EXPECTATION_MISMATCH",
        "Verification success must mint its verified snapshot from the latest candidate snapshot.",
      );
      resultingSnapshot = ContactRouteSnapshotDocument.create({
        contactRouteSnapshotId: nextReachabilityId(this.idGenerator, "contactRouteSnapshot"),
        subjectRef: candidateSnapshot.toSnapshot().subjectRef,
        routeRef: candidateSnapshot.routeRef,
        routeVersionRef: candidateSnapshot.toSnapshot().routeVersionRef,
        routeKind: candidateSnapshot.routeKind,
        normalizedAddressRef: candidateSnapshot.toSnapshot().normalizedAddressRef,
        preferenceProfileRef: candidateSnapshot.toSnapshot().preferenceProfileRef,
        verificationCheckpointRef: checkpoint.checkpointId,
        verificationState: "verified_current",
        demographicFreshnessState: candidateSnapshot.toSnapshot().demographicFreshnessState,
        preferenceFreshnessState: candidateSnapshot.toSnapshot().preferenceFreshnessState,
        sourceAuthorityClass: candidateSnapshot.toSnapshot().sourceAuthorityClass,
        supersedesSnapshotRef: candidateSnapshot.contactRouteSnapshotId,
        snapshotVersion: candidateSnapshot.toSnapshot().snapshotVersion + 1,
        createdAt: input.evaluatedAt,
        updatedAt: input.evaluatedAt,
      });
      await this.repositories.saveContactRouteSnapshot(resultingSnapshot);
    }

    const observationClass =
      input.verificationState === "verified" ? "verification_success" : "verification_failure";
    const observation = await this.recordObservation({
      reachabilityDependencyRef: dependency.dependencyId,
      contactRouteSnapshotRef:
        resultingSnapshot?.contactRouteSnapshotId ?? candidateSnapshot.contactRouteSnapshotId,
      observationClass,
      observationSourceRef: `verification_checkpoint:${checkpoint.checkpointId}`,
      observedAt: input.evaluatedAt,
      recordedAt: input.evaluatedAt,
      outcomePolarity: input.verificationState === "verified" ? "positive" : "negative",
      authorityWeight: "strong",
      evidenceRef: `${checkpoint.checkpointId}:${input.verificationState}`,
    });

    const observations = await this.repositories.listReachabilityObservationsForDependency(
      dependency.dependencyId,
    );
    const assessmentSnapshot = resultingSnapshot ?? candidateSnapshot;
    const candidateObservations = observations.filter(
      (entry) => entry.contactRouteSnapshotRef === assessmentSnapshot.contactRouteSnapshotId,
    );
    const latestRouteSnapshot = await this.repositories.getLatestContactRouteSnapshotForRoute(
      assessmentSnapshot.routeRef,
    );
    const assessment = createAssessmentDocument({
      reachabilityAssessmentId: nextReachabilityId(this.idGenerator, "reachabilityAssessment"),
      dependencyId: dependency.dependencyId,
      governingObjectRef: dependency.toSnapshot().domainObjectRef,
      snapshot: assessmentSnapshot,
      observations: candidateObservations,
      latestRouteSnapshot: latestRouteSnapshot ?? undefined,
      priorAssessmentRef: preAssessment.reachabilityAssessmentId,
      resultingReachabilityEpoch: dependency.toSnapshot().reachabilityEpoch + 1,
      assessedAt: input.evaluatedAt,
    });
    await this.repositories.saveReachabilityAssessment(assessment);

    const settledCheckpoint = checkpoint.settle({
      verificationState: input.verificationState,
      resultingContactRouteSnapshotRef:
        input.verificationState === "verified" ? assessmentSnapshot.contactRouteSnapshotId : null,
      resultingReachabilityAssessmentRef: assessment.reachabilityAssessmentId,
      rebindState:
        input.verificationState === "verified" && assessment.assessmentState === "clear"
          ? "rebound"
          : "blocked",
      evaluatedAt: input.evaluatedAt,
    });
    await this.repositories.saveContactRouteVerificationCheckpoint(settledCheckpoint, {
      expectedVersion: checkpoint.version,
    });

    let updatedDependency = dependency;
    let updatedJourney: ContactRouteRepairJourneyDocument;
    if (input.verificationState === "verified" && assessment.assessmentState === "clear") {
      updatedDependency = dependency
        .applyAssessment({
          assessment,
          contactRouteSnapshotRef: assessmentSnapshot.contactRouteSnapshotId,
          updatedAt: input.evaluatedAt,
        })
        .completeRepairJourney({ updatedAt: input.evaluatedAt });
      await this.repositories.saveReachabilityDependency(updatedDependency, {
        expectedVersion: dependency.version,
      });
      updatedJourney = journey.complete({
        resultingAssessmentRef: assessment.reachabilityAssessmentId,
        updatedAt: input.evaluatedAt,
      });
    } else {
      updatedJourney = journey.markRecoveryRequired({
        resultingAssessmentRef: assessment.reachabilityAssessmentId,
        updatedAt: input.evaluatedAt,
      });
    }
    await this.repositories.saveContactRouteRepairJourney(updatedJourney, {
      expectedVersion: journey.version,
    });
    const events = [
      {
        eventName: "reachability.assessment.settled",
        emittedAt: input.evaluatedAt,
        payload: {
          dependencyId: dependency.dependencyId,
          reachabilityAssessmentId: assessment.reachabilityAssessmentId,
          assessmentState: assessment.toSnapshot().assessmentState,
          dominantReasonCode: assessment.toSnapshot().dominantReasonCode,
        },
      },
      {
        eventName: "reachability.changed",
        emittedAt: input.evaluatedAt,
        payload: {
          dependencyId: dependency.dependencyId,
          reachabilityAssessmentId: assessment.reachabilityAssessmentId,
          assessmentState: assessment.toSnapshot().assessmentState,
          routeHealthState: updatedDependency.toSnapshot().routeHealthState,
          repairState: updatedDependency.toSnapshot().repairState,
        },
      },
      ...(input.verificationState === "verified"
        ? [
            {
              eventName: "reachability.verification_checkpoint.verified",
              emittedAt: input.evaluatedAt,
              payload: {
                checkpointId: checkpoint.checkpointId,
                repairJourneyId: journey.repairJourneyId,
                resultingContactRouteSnapshotRef: assessmentSnapshot.contactRouteSnapshotId,
                resultingReachabilityAssessmentRef: assessment.reachabilityAssessmentId,
              },
            },
          ]
        : []),
      ...(updatedJourney.toSnapshot().journeyState === "completed"
        ? [
            {
              eventName: "reachability.repair_journey.closed",
              emittedAt: input.evaluatedAt,
              payload: {
                repairJourneyId: updatedJourney.repairJourneyId,
                dependencyId: dependency.dependencyId,
                resultingReachabilityAssessmentRef: assessment.reachabilityAssessmentId,
              },
            },
          ]
        : []),
    ] as const;
    await this.appendGovernanceEvents(events);

    void observation;
    return {
      checkpoint: settledCheckpoint,
      journey: updatedJourney,
      dependency: updatedDependency,
      resultingSnapshot,
      assessment,
    };
  }
}

export function createReachabilityGovernorService(
  repositories: ReachabilityDependencies,
  idGenerator: BackboneIdGenerator,
): ReachabilityGovernorService {
  return new ReachabilityGovernorService(repositories, idGenerator);
}

export type ReachabilitySimulationChannel = "sms" | "voice" | "email" | "otp";
export type ReachabilitySimulationScenario =
  | "accepted"
  | "delivered"
  | "bounced"
  | "expired"
  | "opt_out"
  | "no_answer"
  | "invalid_route"
  | "manual_reachable"
  | "manual_unreachable"
  | "disputed"
  | "preference_change"
  | "verification_success"
  | "verification_failure";

const SIMULATION_SCENARIOS: Partial<
  Record<
    `${ReachabilitySimulationChannel}:${ReachabilitySimulationScenario}`,
    {
      readonly observationClass: ReachabilityObservationClass;
      readonly outcomePolarity: ReachabilityOutcomePolarity;
      readonly authorityWeight: ReachabilityAuthorityWeight;
    }
  >
> = {
  "sms:accepted": {
    observationClass: "transport_ack",
    outcomePolarity: "positive",
    authorityWeight: "weak",
  },
  "sms:delivered": {
    observationClass: "delivery_receipt",
    outcomePolarity: "positive",
    authorityWeight: "moderate",
  },
  "sms:bounced": {
    observationClass: "bounce",
    outcomePolarity: "negative",
    authorityWeight: "strong",
  },
  "sms:expired": {
    observationClass: "delivery_receipt",
    outcomePolarity: "negative",
    authorityWeight: "moderate",
  },
  "sms:opt_out": {
    observationClass: "opt_out",
    outcomePolarity: "negative",
    authorityWeight: "strong",
  },
  "voice:no_answer": {
    observationClass: "no_answer",
    outcomePolarity: "negative",
    authorityWeight: "moderate",
  },
  "voice:invalid_route": {
    observationClass: "invalid_route",
    outcomePolarity: "negative",
    authorityWeight: "strong",
  },
  "voice:manual_reachable": {
    observationClass: "manual_confirmed_reachable",
    outcomePolarity: "positive",
    authorityWeight: "strong",
  },
  "voice:manual_unreachable": {
    observationClass: "manual_confirmed_unreachable",
    outcomePolarity: "negative",
    authorityWeight: "strong",
  },
  "email:accepted": {
    observationClass: "transport_ack",
    outcomePolarity: "positive",
    authorityWeight: "weak",
  },
  "email:bounced": {
    observationClass: "bounce",
    outcomePolarity: "negative",
    authorityWeight: "strong",
  },
  "email:disputed": {
    observationClass: "manual_dispute",
    outcomePolarity: "ambiguous",
    authorityWeight: "strong",
  },
  "email:preference_change": {
    observationClass: "preference_change",
    outcomePolarity: "negative",
    authorityWeight: "moderate",
  },
  "otp:verification_success": {
    observationClass: "verification_success",
    outcomePolarity: "positive",
    authorityWeight: "strong",
  },
  "otp:verification_failure": {
    observationClass: "verification_failure",
    outcomePolarity: "negative",
    authorityWeight: "strong",
  },
  "otp:expired": {
    observationClass: "verification_failure",
    outcomePolarity: "negative",
    authorityWeight: "moderate",
  },
};

export interface SimulateReachabilityScenarioInput {
  reachabilityDependencyRef: string;
  channel: ReachabilitySimulationChannel;
  scenario: ReachabilitySimulationScenario;
  contactRouteSnapshotRef?: string | null;
  observedAt: string;
  recordedAt: string;
  evidenceRef?: string;
}

export interface SimulatedReachabilityScenarioResult {
  readonly observation: ReachabilityObservationDocument;
  readonly dependency: ReachabilityDependencyDocument;
  readonly assessment: ReachabilityAssessmentRecordDocument;
}

export class ReachabilitySimulationHarness {
  private readonly governor: ReachabilityGovernorService;

  constructor(governor: ReachabilityGovernorService) {
    this.governor = governor;
  }

  async simulateScenario(
    input: SimulateReachabilityScenarioInput,
  ): Promise<SimulatedReachabilityScenarioResult> {
    const mapping = SIMULATION_SCENARIOS[`${input.channel}:${input.scenario}`];
    invariant(
      mapping,
      "SIMULATION_SCENARIO_UNSUPPORTED",
      `Unsupported reachability simulation scenario ${input.channel}:${input.scenario}.`,
    );
    const observation = await this.governor.recordObservation({
      reachabilityDependencyRef: input.reachabilityDependencyRef,
      contactRouteSnapshotRef: input.contactRouteSnapshotRef ?? null,
      observationClass: mapping.observationClass,
      observationSourceRef: `simulator:${input.channel}`,
      observedAt: input.observedAt,
      recordedAt: input.recordedAt,
      outcomePolarity: mapping.outcomePolarity,
      authorityWeight: mapping.authorityWeight,
      evidenceRef:
        input.evidenceRef ??
        sha256Hex(
          stableStringify({
            dependency: input.reachabilityDependencyRef,
            channel: input.channel,
            scenario: input.scenario,
            observedAt: input.observedAt,
          }),
        ),
    });
    const refreshed = await this.governor.refreshDependencyAssessment({
      reachabilityDependencyRef: input.reachabilityDependencyRef,
      contactRouteSnapshotRef: observation.contactRouteSnapshotRef,
      assessedAt: input.recordedAt,
    });
    return {
      observation,
      dependency: refreshed.dependency,
      assessment: refreshed.assessment,
    };
  }
}

export function createReachabilitySimulationHarness(
  governor: ReachabilityGovernorService,
): ReachabilitySimulationHarness {
  return new ReachabilitySimulationHarness(governor);
}

export interface ReachabilityLedgerIssue {
  code: string;
  severity: "error" | "warning";
  message: string;
  reference: string;
}

export async function validateReachabilityLedgerState(
  repositories: ReachabilityDependencies,
): Promise<readonly ReachabilityLedgerIssue[]> {
  const issues: ReachabilityLedgerIssue[] = [];
  const snapshots = await repositories.listContactRouteSnapshots();
  const observations = await repositories.listReachabilityObservations();
  const assessments = await repositories.listReachabilityAssessments();
  const dependencies = await repositories.listReachabilityDependencies();
  const journeys = await repositories.listContactRouteRepairJourneys();
  const checkpoints = await repositories.listContactRouteVerificationCheckpoints();

  const snapshotsById = new Map(
    snapshots.map((snapshot) => [snapshot.contactRouteSnapshotId, snapshot]),
  );
  const assessmentsById = new Map(
    assessments.map((assessment) => [assessment.reachabilityAssessmentId, assessment]),
  );
  const journeysById = new Map(journeys.map((journey) => [journey.repairJourneyId, journey]));

  for (const dependency of dependencies) {
    const dependencySnapshot = dependency.toSnapshot();
    const snapshot = snapshotsById.get(dependencySnapshot.currentContactRouteSnapshotRef);
    if (!snapshot) {
      issues.push({
        code: "DEPENDENCY_MISSING_CONTACT_ROUTE_SNAPSHOT",
        severity: "error",
        message: "ReachabilityDependency references a missing ContactRouteSnapshot.",
        reference: `dependency:${dependency.dependencyId}`,
      });
    }
    const assessment = assessmentsById.get(dependencySnapshot.currentReachabilityAssessmentRef);
    if (!assessment) {
      issues.push({
        code: "DEPENDENCY_MISSING_ASSESSMENT",
        severity: "error",
        message: "ReachabilityDependency references a missing ReachabilityAssessmentRecord.",
        reference: `dependency:${dependency.dependencyId}`,
      });
    } else {
      const assessmentSnapshot = assessment.toSnapshot();
      if (
        assessmentSnapshot.contactRouteSnapshotRef !==
        dependencySnapshot.currentContactRouteSnapshotRef
      ) {
        issues.push({
          code: "DEPENDENCY_ASSESSMENT_SNAPSHOT_DRIFT",
          severity: "error",
          message: "Current dependency snapshot and assessment snapshot must match.",
          reference: `dependency:${dependency.dependencyId}`,
        });
      }
      if (
        assessmentSnapshot.assessmentState === "clear" &&
        assessmentSnapshot.consideredObservationRefs.every((observationRef) => {
          const observation = observations.find(
            (entry) => entry.reachabilityObservationId === observationRef,
          );
          return observation?.toSnapshot().observationClass === "transport_ack";
        }) &&
        assessmentSnapshot.consideredObservationRefs.length > 0
      ) {
        issues.push({
          code: "TRANSPORT_ACK_TREATED_AS_PROOF",
          severity: "error",
          message:
            "Transport acknowledgement alone may not produce a clear reachability assessment.",
          reference: `assessment:${assessment.reachabilityAssessmentId}`,
        });
      }
      if (
        assessmentSnapshot.assessmentState !== "clear" &&
        dependencySnapshot.repairState === "none" &&
        dependencySnapshot.repairJourneyRef === null
      ) {
        issues.push({
          code: "BLOCKED_DEPENDENCY_WITHOUT_REPAIR_PATH",
          severity: "warning",
          message:
            "Blocked or disputed dependencies should surface same-shell repair or recovery routing.",
          reference: `dependency:${dependency.dependencyId}`,
        });
      }
    }
    if (
      dependencySnapshot.routeHealthState === "clear" &&
      dependencySnapshot.repairState !== "none"
    ) {
      issues.push({
        code: "DEPENDENCY_CLEAR_WITH_REPAIR_STATE",
        severity: "error",
        message: "ReachabilityDependency cannot be clear while repairState is not none.",
        reference: `dependency:${dependency.dependencyId}`,
      });
    }
    if (dependencySnapshot.repairJourneyRef) {
      const journey = journeysById.get(dependencySnapshot.repairJourneyRef);
      if (!journey) {
        issues.push({
          code: "DEPENDENCY_REPAIR_JOURNEY_MISSING",
          severity: "error",
          message: "ReachabilityDependency references a missing ContactRouteRepairJourney.",
          reference: `dependency:${dependency.dependencyId}`,
        });
      }
    }
  }

  for (const snapshot of snapshots) {
    const snapshotState = snapshot.toSnapshot();
    if (snapshotState.snapshotVersion > 1 && !snapshotState.supersedesSnapshotRef) {
      issues.push({
        code: "SNAPSHOT_CHAIN_BROKEN",
        severity: "error",
        message: "Later ContactRouteSnapshot versions must reference supersedesSnapshotRef.",
        reference: `snapshot:${snapshot.contactRouteSnapshotId}`,
      });
    }
  }

  for (const checkpoint of checkpoints) {
    const checkpointSnapshot = checkpoint.toSnapshot();
    if (checkpointSnapshot.verificationState === "verified") {
      const journey = journeysById.get(checkpointSnapshot.repairJourneyRef);
      if (!journey) {
        issues.push({
          code: "CHECKPOINT_REPAIR_JOURNEY_MISSING",
          severity: "error",
          message:
            "Verified ContactRouteVerificationCheckpoint references a missing repair journey.",
          reference: `checkpoint:${checkpoint.checkpointId}`,
        });
        continue;
      }
      if (checkpointSnapshot.rebindState !== "rebound") {
        issues.push({
          code: "VERIFIED_CHECKPOINT_NOT_REBOUND",
          severity: "error",
          message:
            "Verified ContactRouteVerificationCheckpoint must rebind or fail closed explicitly.",
          reference: `checkpoint:${checkpoint.checkpointId}`,
        });
      }
      if (
        checkpointSnapshot.resultingContactRouteSnapshotRef &&
        !snapshotsById.has(checkpointSnapshot.resultingContactRouteSnapshotRef)
      ) {
        issues.push({
          code: "CHECKPOINT_RESULTING_SNAPSHOT_MISSING",
          severity: "error",
          message:
            "Verified ContactRouteVerificationCheckpoint references a missing resulting snapshot.",
          reference: `checkpoint:${checkpoint.checkpointId}`,
        });
      }
      if (
        checkpointSnapshot.resultingReachabilityAssessmentRef &&
        !assessmentsById.has(checkpointSnapshot.resultingReachabilityAssessmentRef)
      ) {
        issues.push({
          code: "CHECKPOINT_RESULTING_ASSESSMENT_MISSING",
          severity: "error",
          message:
            "Terminal ContactRouteVerificationCheckpoint references a missing resulting assessment.",
          reference: `checkpoint:${checkpoint.checkpointId}`,
        });
      }
      if (
        journey.toSnapshot().journeyState === "completed" &&
        checkpointSnapshot.resultingReachabilityAssessmentRef !==
          journey.toSnapshot().resultingReachabilityAssessmentRef
      ) {
        issues.push({
          code: "JOURNEY_CHECKPOINT_RESULT_DRIFT",
          severity: "error",
          message:
            "Completed repair journeys must point to the same resulting assessment as their checkpoint.",
          reference: `repairJourney:${journey.repairJourneyId}`,
        });
      }
    }
  }

  return issues;
}
