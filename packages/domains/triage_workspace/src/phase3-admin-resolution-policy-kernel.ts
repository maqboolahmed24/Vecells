import {
  RequestBackboneInvariantError,
  createDeterministicBackboneIdGenerator,
  stableReviewDigest,
  type BackboneIdGenerator,
  type CompareAndSetWriteOptions,
} from "@vecells/domain-kernel";

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

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
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

function nextId(idGenerator: BackboneIdGenerator, kind: string): string {
  return (idGenerator.nextId as unknown as (value: string) => string)(kind);
}

function addHours(isoTimestamp: string, hours: number): string {
  const value = new Date(isoTimestamp);
  value.setUTCHours(value.getUTCHours() + hours);
  return value.toISOString();
}

function isRawExternalRef(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export type AdminResolutionSubtypeRef =
  | "document_or_letter_workflow"
  | "form_workflow"
  | "result_follow_up_workflow"
  | "medication_admin_query"
  | "registration_or_demographic_update"
  | "routed_admin_task";

export type AdminResolutionWaitingState =
  | "none"
  | "awaiting_internal_action"
  | "awaiting_external_dependency"
  | "awaiting_practice_action"
  | "patient_document_return"
  | "identity_verification";

export type AdminResolutionDependencyShape =
  | "internal_team"
  | "external_party"
  | "practice_action"
  | "patient_document_return"
  | "identity_verification";

export type AdminResolutionCaseState =
  | "queued"
  | "in_progress"
  | "waiting"
  | "completion_artifact_recorded"
  | "frozen"
  | "closed";

export type AdminResolutionCompletionType =
  | "document_issued"
  | "form_submitted"
  | "result_notice_delivered"
  | "medication_admin_answered"
  | "demographics_updated"
  | "routed_task_disposition_recorded";

export type AdminResolutionCompletionArtifactState =
  | "draft"
  | "recorded"
  | "delivered"
  | "disputed"
  | "superseded";

export type AdminResolutionReleaseState = "current" | "degraded" | "quarantined";
export type AdminResolutionReclassificationDeadlineState = "current" | "elapsed";

const subtypeRefs: readonly AdminResolutionSubtypeRef[] = [
  "document_or_letter_workflow",
  "form_workflow",
  "result_follow_up_workflow",
  "medication_admin_query",
  "registration_or_demographic_update",
  "routed_admin_task",
];
const waitingStates: readonly AdminResolutionWaitingState[] = [
  "none",
  "awaiting_internal_action",
  "awaiting_external_dependency",
  "awaiting_practice_action",
  "patient_document_return",
  "identity_verification",
];
const caseStates: readonly AdminResolutionCaseState[] = [
  "queued",
  "in_progress",
  "waiting",
  "completion_artifact_recorded",
  "frozen",
  "closed",
];
const dependencyShapes: readonly AdminResolutionDependencyShape[] = [
  "internal_team",
  "external_party",
  "practice_action",
  "patient_document_return",
  "identity_verification",
];
const completionTypes: readonly AdminResolutionCompletionType[] = [
  "document_issued",
  "form_submitted",
  "result_notice_delivered",
  "medication_admin_answered",
  "demographics_updated",
  "routed_task_disposition_recorded",
];
const artifactStates: readonly AdminResolutionCompletionArtifactState[] = [
  "draft",
  "recorded",
  "delivered",
  "disputed",
  "superseded",
];
const releaseStates: readonly AdminResolutionReleaseState[] = [
  "current",
  "degraded",
  "quarantined",
];

export interface AdminResolutionWaitingPolicyRuleSnapshot {
  waitingState: Exclude<AdminResolutionWaitingState, "none">;
  allowedReasonCodeRefs: readonly string[];
  dependencyShape: AdminResolutionDependencyShape;
  ownerRoleRef: string;
  slaClockSourceRef: string;
  expiryOrRepairRuleRef: string;
  patientExpectationTemplateRef: string;
  version: number;
}

export interface AdminResolutionCompletionPolicyRuleSnapshot {
  completionType: AdminResolutionCompletionType;
  patientExpectationTemplateRef: string;
  artifactPresentationContractRef: string;
  defaultVisibilityTier: string;
  defaultSummarySafetyTier: string;
  defaultPlaceholderContractRef: string;
  defaultReleaseState: AdminResolutionReleaseState;
  requiresCommunicationDeliveryOutcome: boolean;
  version: number;
}

export interface AdminResolutionSubtypeProfileSnapshot {
  adminResolutionSubtypeRef: AdminResolutionSubtypeRef;
  queuePolicyRef: string;
  waitingReasonPolicyRef: string;
  completionArtifactPolicyRef: string;
  patientExpectationTemplateRef: string;
  externalDependencyPolicyRef: string;
  reopenPolicyRef: string;
  allowedReclassificationTargets: readonly AdminResolutionSubtypeRef[];
  reclassificationWindowHours: number | null;
  sourceDomainRequired: boolean;
  sourceDecisionRequired: boolean;
  waitingPolicies: readonly AdminResolutionWaitingPolicyRuleSnapshot[];
  completionPolicies: readonly AdminResolutionCompletionPolicyRuleSnapshot[];
  version: number;
}

export interface AdminResolutionCaseSnapshot {
  adminResolutionCaseId: string;
  episodeRef: string;
  requestRef: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  sourceTriageTaskRef: string;
  sourceAdminResolutionStarterRef: string | null;
  sourceDomainRef: string | null;
  sourceDecisionRef: string | null;
  sourceLineageRef: string | null;
  adminResolutionSubtypeRef: AdminResolutionSubtypeRef;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  clinicalMeaningState: string;
  operationalFollowUpScope: string;
  adminMutationAuthorityState: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef: string | null;
  policyBundleRef: string;
  lineageFenceEpoch: number;
  caseVersionRef: string;
  currentOwnerRef: string;
  caseState: AdminResolutionCaseState;
  waitingState: AdminResolutionWaitingState;
  waitingReasonCodeRef: string | null;
  waitingDependencyShape: AdminResolutionDependencyShape | null;
  waitingOwnerRef: string | null;
  waitingOwnerRoleRef: string | null;
  waitingSlaClockSourceRef: string | null;
  waitingExpiryOrRepairRuleRef: string | null;
  currentActionRecordRef: string | null;
  completionArtifactRef: string | null;
  dependencySetRef: string | null;
  reopenState: string;
  experienceProjectionRef: string | null;
  releaseWatchRef: string | null;
  watchWindowRef: string | null;
  reclassificationDueAt: string | null;
  openedAt: string;
  closedAt: string | null;
  version: number;
}

export interface AdminResolutionCompletionArtifactSnapshot {
  adminResolutionCompletionArtifactId: string;
  adminResolutionCaseRef: string;
  completionType: AdminResolutionCompletionType;
  completionEvidenceRefs: readonly string[];
  patientExpectationTemplateRef: string;
  patientVisibleSummaryRef: string;
  artifactPresentationContractRef: string;
  artifactByteGrantRefs: readonly string[];
  outboundNavigationGrantRefs: readonly string[];
  releaseState: AdminResolutionReleaseState;
  visibilityTier: string;
  summarySafetyTier: string;
  placeholderContractRef: string;
  communicationDispatchRefs: readonly string[];
  deliveryOutcomeRefs: readonly string[];
  reopenPolicyRef: string;
  artifactState: AdminResolutionCompletionArtifactState;
  recordedAt: string;
  version: number;
}

export interface Phase3AdminResolutionPolicyBundle {
  currentAdminResolutionCase: AdminResolutionCaseSnapshot | null;
  currentSubtypeProfile: AdminResolutionSubtypeProfileSnapshot | null;
  currentCompletionArtifact: AdminResolutionCompletionArtifactSnapshot | null;
  adminResolutionCases: readonly AdminResolutionCaseSnapshot[];
  adminResolutionCompletionArtifacts: readonly AdminResolutionCompletionArtifactSnapshot[];
  subtypeProfiles: readonly AdminResolutionSubtypeProfileSnapshot[];
}

export interface OpenAdminResolutionCaseInput {
  adminResolutionCaseId?: string;
  episodeRef: string;
  requestRef: string;
  requestLineageRef: string;
  lineageCaseLinkRef: string;
  sourceTriageTaskRef: string;
  sourceAdminResolutionStarterRef?: string | null;
  sourceDomainRef?: string | null;
  sourceDecisionRef?: string | null;
  sourceLineageRef?: string | null;
  adminResolutionSubtypeRef: AdminResolutionSubtypeRef;
  boundaryDecisionRef: string;
  boundaryTupleHash: string;
  boundaryState: string;
  clinicalMeaningState: string;
  operationalFollowUpScope: string;
  adminMutationAuthorityState: string;
  decisionEpochRef: string;
  decisionSupersessionRecordRef?: string | null;
  policyBundleRef: string;
  lineageFenceEpoch: number;
  caseVersionRef?: string | null;
  currentOwnerRef: string;
  dependencySetRef?: string | null;
  reopenState: string;
  experienceProjectionRef?: string | null;
  releaseWatchRef?: string | null;
  watchWindowRef?: string | null;
  currentActionRecordRef?: string | null;
  openedAt: string;
  caseState?: Extract<AdminResolutionCaseState, "queued" | "in_progress">;
}

export interface ReclassifyAdminResolutionSubtypeInput {
  adminResolutionCaseId: string;
  nextSubtypeRef: AdminResolutionSubtypeRef;
  currentOwnerRef?: string | null;
  currentActionRecordRef?: string | null;
  recordedAt: string;
}

export interface EnterAdminResolutionWaitingStateInput {
  adminResolutionCaseId: string;
  waitingState: Exclude<AdminResolutionWaitingState, "none">;
  waitingReasonCodeRef: string;
  dependencyShape: AdminResolutionDependencyShape;
  ownerRef: string;
  slaClockSourceRef: string;
  expiryOrRepairRuleRef: string;
  currentActionRecordRef?: string | null;
  enteredAt: string;
}

export interface CancelAdminResolutionWaitInput {
  adminResolutionCaseId: string;
  currentOwnerRef?: string | null;
  currentActionRecordRef?: string | null;
  canceledAt: string;
}

export interface RecordAdminResolutionCompletionArtifactInput {
  adminResolutionCompletionArtifactId?: string;
  adminResolutionCaseId: string;
  completionType: AdminResolutionCompletionType;
  completionEvidenceRefs: readonly string[];
  patientExpectationTemplateRef?: string | null;
  patientVisibleSummaryRef: string;
  artifactPresentationContractRef?: string | null;
  artifactByteGrantRefs?: readonly string[];
  outboundNavigationGrantRefs?: readonly string[];
  releaseState?: AdminResolutionReleaseState;
  visibilityTier?: string | null;
  summarySafetyTier?: string | null;
  placeholderContractRef?: string | null;
  communicationDispatchRefs?: readonly string[];
  deliveryOutcomeRefs?: readonly string[];
  recordedAt: string;
}

export interface EvaluateAdminResolutionCaseContinuityInput {
  taskId: string;
  currentBoundaryDecisionRef: string | null;
  currentBoundaryTupleHash: string | null;
  currentBoundaryState: string | null;
  currentClinicalMeaningState: string | null;
  currentOperationalFollowUpScope: string | null;
  currentAdminMutationAuthorityState: string | null;
  currentDecisionEpochRef: string | null;
  currentDecisionSupersessionRecordRef?: string | null;
  currentReopenState: string | null;
  evaluatedAt: string;
}

export interface AdminResolutionCaseContinuityEvaluation {
  currentAdminResolutionCase: AdminResolutionCaseSnapshot | null;
  currentSubtypeProfile: AdminResolutionSubtypeProfileSnapshot | null;
  currentCompletionArtifact: AdminResolutionCompletionArtifactSnapshot | null;
  effectiveCaseState: AdminResolutionCaseState | null;
  effectiveReasonCodeRefs: readonly string[];
  reclassificationDeadlineState: AdminResolutionReclassificationDeadlineState | null;
}

export interface Phase3AdminResolutionPolicyKernelRepositories {
  getSubtypeProfile(
    adminResolutionSubtypeRef: AdminResolutionSubtypeRef,
  ): Promise<AdminResolutionSubtypeProfileSnapshot | null>;
  saveSubtypeProfile(
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listSubtypeProfiles(): Promise<readonly AdminResolutionSubtypeProfileSnapshot[]>;

  getAdminResolutionCase(adminResolutionCaseId: string): Promise<AdminResolutionCaseSnapshot | null>;
  saveAdminResolutionCase(
    adminResolutionCase: AdminResolutionCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdminResolutionCasesForTask(
    taskId: string,
  ): Promise<readonly AdminResolutionCaseSnapshot[]>;
  getCurrentAdminResolutionCaseForTask(taskId: string): Promise<AdminResolutionCaseSnapshot | null>;

  getAdminResolutionCompletionArtifact(
    adminResolutionCompletionArtifactId: string,
  ): Promise<AdminResolutionCompletionArtifactSnapshot | null>;
  saveAdminResolutionCompletionArtifact(
    completionArtifact: AdminResolutionCompletionArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listAdminResolutionCompletionArtifactsForCase(
    adminResolutionCaseId: string,
  ): Promise<readonly AdminResolutionCompletionArtifactSnapshot[]>;
}

class InMemoryPhase3AdminResolutionPolicyKernelStore
  implements Phase3AdminResolutionPolicyKernelRepositories
{
  private readonly subtypeProfiles = new Map<
    AdminResolutionSubtypeRef,
    AdminResolutionSubtypeProfileSnapshot
  >();
  private readonly adminResolutionCases = new Map<string, AdminResolutionCaseSnapshot>();
  private readonly adminResolutionCasesByTask = new Map<string, string[]>();
  private readonly currentAdminResolutionCaseByTask = new Map<string, string>();
  private readonly completionArtifacts = new Map<
    string,
    AdminResolutionCompletionArtifactSnapshot
  >();
  private readonly completionArtifactsByCase = new Map<string, string[]>();

  constructor(seedProfiles?: readonly AdminResolutionSubtypeProfileSnapshot[]) {
    for (const profile of seedProfiles ?? createCanonicalSubtypeProfiles()) {
      this.subtypeProfiles.set(profile.adminResolutionSubtypeRef, profile);
    }
  }

  async getSubtypeProfile(
    adminResolutionSubtypeRef: AdminResolutionSubtypeRef,
  ): Promise<AdminResolutionSubtypeProfileSnapshot | null> {
    return this.subtypeProfiles.get(adminResolutionSubtypeRef) ?? null;
  }

  async saveSubtypeProfile(
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.subtypeProfiles,
      subtypeProfile.adminResolutionSubtypeRef,
      subtypeProfile,
      options,
    );
  }

  async listSubtypeProfiles(): Promise<readonly AdminResolutionSubtypeProfileSnapshot[]> {
    return [...this.subtypeProfiles.values()].sort((left, right) =>
      left.adminResolutionSubtypeRef.localeCompare(right.adminResolutionSubtypeRef),
    );
  }

  async getAdminResolutionCase(
    adminResolutionCaseId: string,
  ): Promise<AdminResolutionCaseSnapshot | null> {
    return this.adminResolutionCases.get(adminResolutionCaseId) ?? null;
  }

  async saveAdminResolutionCase(
    adminResolutionCase: AdminResolutionCaseSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.adminResolutionCases,
      adminResolutionCase.adminResolutionCaseId,
      adminResolutionCase,
      options,
    );
    const existing = this.adminResolutionCasesByTask.get(adminResolutionCase.sourceTriageTaskRef) ?? [];
    if (!existing.includes(adminResolutionCase.adminResolutionCaseId)) {
      this.adminResolutionCasesByTask.set(adminResolutionCase.sourceTriageTaskRef, [
        ...existing,
        adminResolutionCase.adminResolutionCaseId,
      ]);
    }
    this.currentAdminResolutionCaseByTask.set(
      adminResolutionCase.sourceTriageTaskRef,
      adminResolutionCase.adminResolutionCaseId,
    );
  }

  async listAdminResolutionCasesForTask(
    taskId: string,
  ): Promise<readonly AdminResolutionCaseSnapshot[]> {
    return (this.adminResolutionCasesByTask.get(taskId) ?? [])
      .map((id) => this.adminResolutionCases.get(id))
      .filter((entry): entry is AdminResolutionCaseSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.openedAt, right.openedAt));
  }

  async getCurrentAdminResolutionCaseForTask(
    taskId: string,
  ): Promise<AdminResolutionCaseSnapshot | null> {
    const current = this.currentAdminResolutionCaseByTask.get(taskId);
    return current ? (this.adminResolutionCases.get(current) ?? null) : null;
  }

  async getAdminResolutionCompletionArtifact(
    adminResolutionCompletionArtifactId: string,
  ): Promise<AdminResolutionCompletionArtifactSnapshot | null> {
    return this.completionArtifacts.get(adminResolutionCompletionArtifactId) ?? null;
  }

  async saveAdminResolutionCompletionArtifact(
    completionArtifact: AdminResolutionCompletionArtifactSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(
      this.completionArtifacts,
      completionArtifact.adminResolutionCompletionArtifactId,
      completionArtifact,
      options,
    );
    const existing =
      this.completionArtifactsByCase.get(completionArtifact.adminResolutionCaseRef) ?? [];
    if (!existing.includes(completionArtifact.adminResolutionCompletionArtifactId)) {
      this.completionArtifactsByCase.set(completionArtifact.adminResolutionCaseRef, [
        ...existing,
        completionArtifact.adminResolutionCompletionArtifactId,
      ]);
    }
  }

  async listAdminResolutionCompletionArtifactsForCase(
    adminResolutionCaseId: string,
  ): Promise<readonly AdminResolutionCompletionArtifactSnapshot[]> {
    return (this.completionArtifactsByCase.get(adminResolutionCaseId) ?? [])
      .map((id) => this.completionArtifacts.get(id))
      .filter((entry): entry is AdminResolutionCompletionArtifactSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }
}

function buildWaitingPolicyRule(
  input: Omit<AdminResolutionWaitingPolicyRuleSnapshot, "version">,
): AdminResolutionWaitingPolicyRuleSnapshot {
  return {
    ...input,
    allowedReasonCodeRefs: uniqueSorted(input.allowedReasonCodeRefs),
    version: 1,
  };
}

function buildCompletionPolicyRule(
  input: Omit<AdminResolutionCompletionPolicyRuleSnapshot, "version">,
): AdminResolutionCompletionPolicyRuleSnapshot {
  return {
    ...input,
    version: 1,
  };
}

function createCanonicalSubtypeProfiles(): readonly AdminResolutionSubtypeProfileSnapshot[] {
  const commonVisibility = "patient_authenticated";
  const commonSummarySafety = "clinical_safe_summary";
  return [
    {
      adminResolutionSubtypeRef: "document_or_letter_workflow",
      queuePolicyRef: "queue_policy.admin.document_or_letter",
      waitingReasonPolicyRef: "waiting_reason_policy.admin.document_or_letter",
      completionArtifactPolicyRef: "completion_artifact_policy.admin.document_or_letter",
      patientExpectationTemplateRef: "patient_expectation_template.admin.document_or_letter",
      externalDependencyPolicyRef: "external_dependency_policy.admin.document_or_letter",
      reopenPolicyRef: "reopen_policy.admin.document_or_letter",
      allowedReclassificationTargets: [],
      reclassificationWindowHours: null,
      sourceDomainRequired: false,
      sourceDecisionRequired: false,
      waitingPolicies: [
        buildWaitingPolicyRule({
          waitingState: "awaiting_internal_action",
          allowedReasonCodeRefs: ["document_generation_pending", "document_review_pending"],
          dependencyShape: "internal_team",
          ownerRoleRef: "admin_document_team",
          slaClockSourceRef: "sla_clock.internal_business_hours",
          expiryOrRepairRuleRef: "expiry_or_repair.document_generation",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.document_or_letter.waiting_internal",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_external_dependency",
          allowedReasonCodeRefs: ["external_print_or_mail_pending"],
          dependencyShape: "external_party",
          ownerRoleRef: "admin_dispatch_coordinator",
          slaClockSourceRef: "sla_clock.vendor_turnaround",
          expiryOrRepairRuleRef: "expiry_or_repair.dispatch_vendor",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.document_or_letter.waiting_external",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_practice_action",
          allowedReasonCodeRefs: ["practice_authorisation_pending"],
          dependencyShape: "practice_action",
          ownerRoleRef: "practice_operations",
          slaClockSourceRef: "sla_clock.practice_response",
          expiryOrRepairRuleRef: "expiry_or_repair.practice_authorisation",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.document_or_letter.waiting_practice",
        }),
      ],
      completionPolicies: [
        buildCompletionPolicyRule({
          completionType: "document_issued",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.document_or_letter.completed",
          artifactPresentationContractRef: "artifact_presentation_contract.admin.document",
          defaultVisibilityTier: commonVisibility,
          defaultSummarySafetyTier: commonSummarySafety,
          defaultPlaceholderContractRef: "placeholder_contract.admin.document",
          defaultReleaseState: "current",
          requiresCommunicationDeliveryOutcome: false,
        }),
      ],
      version: 1,
    },
    {
      adminResolutionSubtypeRef: "form_workflow",
      queuePolicyRef: "queue_policy.admin.form_workflow",
      waitingReasonPolicyRef: "waiting_reason_policy.admin.form_workflow",
      completionArtifactPolicyRef: "completion_artifact_policy.admin.form_workflow",
      patientExpectationTemplateRef: "patient_expectation_template.admin.form_workflow",
      externalDependencyPolicyRef: "external_dependency_policy.admin.form_workflow",
      reopenPolicyRef: "reopen_policy.admin.form_workflow",
      allowedReclassificationTargets: [],
      reclassificationWindowHours: null,
      sourceDomainRequired: false,
      sourceDecisionRequired: false,
      waitingPolicies: [
        buildWaitingPolicyRule({
          waitingState: "awaiting_internal_action",
          allowedReasonCodeRefs: ["form_pack_preparation"],
          dependencyShape: "internal_team",
          ownerRoleRef: "admin_forms_team",
          slaClockSourceRef: "sla_clock.internal_business_hours",
          expiryOrRepairRuleRef: "expiry_or_repair.form_pack_preparation",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.form_workflow.waiting_internal",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_external_dependency",
          allowedReasonCodeRefs: ["external_form_submission_pending"],
          dependencyShape: "external_party",
          ownerRoleRef: "admin_forms_external",
          slaClockSourceRef: "sla_clock.external_submission",
          expiryOrRepairRuleRef: "expiry_or_repair.external_form_submission",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.form_workflow.waiting_external",
        }),
        buildWaitingPolicyRule({
          waitingState: "patient_document_return",
          allowedReasonCodeRefs: ["patient_document_requested"],
          dependencyShape: "patient_document_return",
          ownerRoleRef: "patient_document_return",
          slaClockSourceRef: "sla_clock.patient_document_return",
          expiryOrRepairRuleRef: "expiry_or_repair.patient_document_return",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.form_workflow.waiting_patient_document",
        }),
      ],
      completionPolicies: [
        buildCompletionPolicyRule({
          completionType: "form_submitted",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.form_workflow.completed",
          artifactPresentationContractRef: "artifact_presentation_contract.admin.form_submission",
          defaultVisibilityTier: commonVisibility,
          defaultSummarySafetyTier: commonSummarySafety,
          defaultPlaceholderContractRef: "placeholder_contract.admin.form_submission",
          defaultReleaseState: "current",
          requiresCommunicationDeliveryOutcome: false,
        }),
      ],
      version: 1,
    },
    {
      adminResolutionSubtypeRef: "result_follow_up_workflow",
      queuePolicyRef: "queue_policy.admin.result_follow_up",
      waitingReasonPolicyRef: "waiting_reason_policy.admin.result_follow_up",
      completionArtifactPolicyRef: "completion_artifact_policy.admin.result_follow_up",
      patientExpectationTemplateRef: "patient_expectation_template.admin.result_follow_up",
      externalDependencyPolicyRef: "external_dependency_policy.admin.result_follow_up",
      reopenPolicyRef: "reopen_policy.admin.result_follow_up",
      allowedReclassificationTargets: [],
      reclassificationWindowHours: null,
      sourceDomainRequired: false,
      sourceDecisionRequired: false,
      waitingPolicies: [
        buildWaitingPolicyRule({
          waitingState: "awaiting_internal_action",
          allowedReasonCodeRefs: ["internal_result_release_pending"],
          dependencyShape: "internal_team",
          ownerRoleRef: "results_team",
          slaClockSourceRef: "sla_clock.internal_business_hours",
          expiryOrRepairRuleRef: "expiry_or_repair.result_release",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.result_follow_up.waiting_internal",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_practice_action",
          allowedReasonCodeRefs: ["practice_result_ack_pending"],
          dependencyShape: "practice_action",
          ownerRoleRef: "practice_operations",
          slaClockSourceRef: "sla_clock.practice_response",
          expiryOrRepairRuleRef: "expiry_or_repair.practice_result_ack",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.result_follow_up.waiting_practice",
        }),
      ],
      completionPolicies: [
        buildCompletionPolicyRule({
          completionType: "result_notice_delivered",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.result_follow_up.completed",
          artifactPresentationContractRef:
            "artifact_presentation_contract.admin.result_notice",
          defaultVisibilityTier: commonVisibility,
          defaultSummarySafetyTier: commonSummarySafety,
          defaultPlaceholderContractRef: "placeholder_contract.admin.result_notice",
          defaultReleaseState: "current",
          requiresCommunicationDeliveryOutcome: true,
        }),
      ],
      version: 1,
    },
    {
      adminResolutionSubtypeRef: "medication_admin_query",
      queuePolicyRef: "queue_policy.admin.medication_query",
      waitingReasonPolicyRef: "waiting_reason_policy.admin.medication_query",
      completionArtifactPolicyRef: "completion_artifact_policy.admin.medication_query",
      patientExpectationTemplateRef: "patient_expectation_template.admin.medication_query",
      externalDependencyPolicyRef: "external_dependency_policy.admin.medication_query",
      reopenPolicyRef: "reopen_policy.admin.medication_query",
      allowedReclassificationTargets: [],
      reclassificationWindowHours: null,
      sourceDomainRequired: false,
      sourceDecisionRequired: false,
      waitingPolicies: [
        buildWaitingPolicyRule({
          waitingState: "awaiting_internal_action",
          allowedReasonCodeRefs: ["medication_admin_review_pending"],
          dependencyShape: "internal_team",
          ownerRoleRef: "medication_admin_team",
          slaClockSourceRef: "sla_clock.internal_business_hours",
          expiryOrRepairRuleRef: "expiry_or_repair.medication_admin_review",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.medication_query.waiting_internal",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_external_dependency",
          allowedReasonCodeRefs: ["external_medication_admin_pending"],
          dependencyShape: "external_party",
          ownerRoleRef: "medication_external_partner",
          slaClockSourceRef: "sla_clock.external_partner",
          expiryOrRepairRuleRef: "expiry_or_repair.external_medication_admin",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.medication_query.waiting_external",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_practice_action",
          allowedReasonCodeRefs: ["practice_medication_admin_pending"],
          dependencyShape: "practice_action",
          ownerRoleRef: "practice_operations",
          slaClockSourceRef: "sla_clock.practice_response",
          expiryOrRepairRuleRef: "expiry_or_repair.practice_medication_admin",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.medication_query.waiting_practice",
        }),
      ],
      completionPolicies: [
        buildCompletionPolicyRule({
          completionType: "medication_admin_answered",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.medication_query.completed",
          artifactPresentationContractRef:
            "artifact_presentation_contract.admin.medication_admin_answer",
          defaultVisibilityTier: commonVisibility,
          defaultSummarySafetyTier: commonSummarySafety,
          defaultPlaceholderContractRef:
            "placeholder_contract.admin.medication_admin_answer",
          defaultReleaseState: "current",
          requiresCommunicationDeliveryOutcome: false,
        }),
      ],
      version: 1,
    },
    {
      adminResolutionSubtypeRef: "registration_or_demographic_update",
      queuePolicyRef: "queue_policy.admin.registration_or_demographic_update",
      waitingReasonPolicyRef:
        "waiting_reason_policy.admin.registration_or_demographic_update",
      completionArtifactPolicyRef:
        "completion_artifact_policy.admin.registration_or_demographic_update",
      patientExpectationTemplateRef:
        "patient_expectation_template.admin.registration_or_demographic_update",
      externalDependencyPolicyRef:
        "external_dependency_policy.admin.registration_or_demographic_update",
      reopenPolicyRef: "reopen_policy.admin.registration_or_demographic_update",
      allowedReclassificationTargets: [],
      reclassificationWindowHours: null,
      sourceDomainRequired: false,
      sourceDecisionRequired: false,
      waitingPolicies: [
        buildWaitingPolicyRule({
          waitingState: "awaiting_internal_action",
          allowedReasonCodeRefs: ["demographic_update_processing"],
          dependencyShape: "internal_team",
          ownerRoleRef: "registration_admin_team",
          slaClockSourceRef: "sla_clock.internal_business_hours",
          expiryOrRepairRuleRef: "expiry_or_repair.demographic_update",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.registration_or_demographic_update.waiting_internal",
        }),
        buildWaitingPolicyRule({
          waitingState: "awaiting_practice_action",
          allowedReasonCodeRefs: ["practice_registration_pending"],
          dependencyShape: "practice_action",
          ownerRoleRef: "practice_operations",
          slaClockSourceRef: "sla_clock.practice_response",
          expiryOrRepairRuleRef: "expiry_or_repair.practice_registration",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.registration_or_demographic_update.waiting_practice",
        }),
        buildWaitingPolicyRule({
          waitingState: "identity_verification",
          allowedReasonCodeRefs: ["identity_evidence_requested"],
          dependencyShape: "identity_verification",
          ownerRoleRef: "identity_repair_team",
          slaClockSourceRef: "sla_clock.identity_verification",
          expiryOrRepairRuleRef: "expiry_or_repair.identity_verification",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.registration_or_demographic_update.waiting_identity",
        }),
      ],
      completionPolicies: [
        buildCompletionPolicyRule({
          completionType: "demographics_updated",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.registration_or_demographic_update.completed",
          artifactPresentationContractRef:
            "artifact_presentation_contract.admin.demographics_update",
          defaultVisibilityTier: commonVisibility,
          defaultSummarySafetyTier: commonSummarySafety,
          defaultPlaceholderContractRef:
            "placeholder_contract.admin.demographics_update",
          defaultReleaseState: "current",
          requiresCommunicationDeliveryOutcome: false,
        }),
      ],
      version: 1,
    },
    {
      adminResolutionSubtypeRef: "routed_admin_task",
      queuePolicyRef: "queue_policy.admin.routed_ingress",
      waitingReasonPolicyRef: "waiting_reason_policy.admin.routed_ingress",
      completionArtifactPolicyRef: "completion_artifact_policy.admin.routed_ingress",
      patientExpectationTemplateRef: "patient_expectation_template.admin.routed_ingress",
      externalDependencyPolicyRef: "external_dependency_policy.admin.routed_ingress",
      reopenPolicyRef: "reopen_policy.admin.routed_ingress",
      allowedReclassificationTargets: [
        "document_or_letter_workflow",
        "form_workflow",
        "result_follow_up_workflow",
        "medication_admin_query",
        "registration_or_demographic_update",
      ],
      reclassificationWindowHours: 4,
      sourceDomainRequired: true,
      sourceDecisionRequired: true,
      waitingPolicies: [
        buildWaitingPolicyRule({
          waitingState: "awaiting_internal_action",
          allowedReasonCodeRefs: ["routed_task_reclassification_pending"],
          dependencyShape: "internal_team",
          ownerRoleRef: "admin_triage",
          slaClockSourceRef: "sla_clock.routed_admin_triage",
          expiryOrRepairRuleRef: "expiry_or_repair.routed_admin_reclassification",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.routed_ingress.waiting_reclassification",
        }),
      ],
      completionPolicies: [
        buildCompletionPolicyRule({
          completionType: "routed_task_disposition_recorded",
          patientExpectationTemplateRef:
            "patient_expectation_template.admin.routed_ingress.completed",
          artifactPresentationContractRef:
            "artifact_presentation_contract.admin.routed_disposition",
          defaultVisibilityTier: commonVisibility,
          defaultSummarySafetyTier: commonSummarySafety,
          defaultPlaceholderContractRef:
            "placeholder_contract.admin.routed_disposition",
          defaultReleaseState: "current",
          requiresCommunicationDeliveryOutcome: false,
        }),
      ],
      version: 1,
    },
  ];
}

function validateSubtypeProfile(profile: AdminResolutionSubtypeProfileSnapshot): void {
  invariant(
    subtypeRefs.includes(profile.adminResolutionSubtypeRef),
    "INVALID_ADMIN_RESOLUTION_SUBTYPE",
    "Unsupported adminResolutionSubtypeRef.",
  );
  if (profile.reclassificationWindowHours !== null) {
    ensurePositiveInteger(profile.reclassificationWindowHours, "reclassificationWindowHours");
  }
  invariant(
    profile.waitingPolicies.every((policy) => waitingStates.includes(policy.waitingState)),
    "INVALID_WAITING_POLICY_STATE",
    "Subtype profile contains an unsupported waiting state.",
  );
  invariant(
    profile.waitingPolicies.every((policy) =>
      dependencyShapes.includes(policy.dependencyShape),
    ),
    "INVALID_WAITING_POLICY_DEPENDENCY_SHAPE",
    "Subtype profile contains an unsupported dependency shape.",
  );
  invariant(
    profile.completionPolicies.every((policy) =>
      completionTypes.includes(policy.completionType),
    ),
    "INVALID_COMPLETION_POLICY_TYPE",
    "Subtype profile contains an unsupported completion type.",
  );
  invariant(
    profile.completionPolicies.every((policy) =>
      releaseStates.includes(policy.defaultReleaseState),
    ),
    "INVALID_COMPLETION_POLICY_RELEASE_STATE",
    "Subtype profile contains an unsupported release state.",
  );
}

function findWaitingPolicy(
  profile: AdminResolutionSubtypeProfileSnapshot,
  waitingState: Exclude<AdminResolutionWaitingState, "none">,
): AdminResolutionWaitingPolicyRuleSnapshot {
  const rule = profile.waitingPolicies.find((entry) => entry.waitingState === waitingState);
  invariant(
    rule,
    "WAITING_STATE_NOT_ALLOWED_FOR_SUBTYPE",
    `Subtype ${profile.adminResolutionSubtypeRef} does not allow ${waitingState}.`,
  );
  return rule;
}

function findCompletionPolicy(
  profile: AdminResolutionSubtypeProfileSnapshot,
  completionType: AdminResolutionCompletionType,
): AdminResolutionCompletionPolicyRuleSnapshot {
  const rule = profile.completionPolicies.find((entry) => entry.completionType === completionType);
  invariant(
    rule,
    "COMPLETION_TYPE_NOT_ALLOWED_FOR_SUBTYPE",
    `Subtype ${profile.adminResolutionSubtypeRef} does not allow ${completionType}.`,
  );
  return rule;
}

function validateBoundedAdminOpenTuple(input: OpenAdminResolutionCaseInput): void {
  invariant(
    input.boundaryState === "live",
    "BOUNDARY_NOT_LIVE",
    "AdminResolutionCase may open only from a live SelfCareBoundaryDecision.",
  );
  invariant(
    input.clinicalMeaningState === "bounded_admin_only",
    "BOUNDARY_NOT_BOUNDED_ADMIN_ONLY",
    "AdminResolutionCase may open only while clinicalMeaningState = bounded_admin_only.",
  );
  invariant(
    input.operationalFollowUpScope === "bounded_admin_resolution",
    "BOUNDARY_NOT_BOUNDED_ADMIN_RESOLUTION",
    "AdminResolutionCase may open only while operationalFollowUpScope = bounded_admin_resolution.",
  );
  invariant(
    input.adminMutationAuthorityState === "bounded_admin_only",
    "ADMIN_MUTATION_AUTHORITY_NOT_BOUNDED",
    "AdminResolutionCase may open only while adminMutationAuthorityState = bounded_admin_only.",
  );
  invariant(
    input.reopenState === "stable",
    "BOUNDARY_REOPEN_NOT_STABLE",
    "AdminResolutionCase may open only while reopenState = stable.",
  );
}

export interface Phase3AdminResolutionPolicyKernelService {
  queryTaskBundle(taskId: string): Promise<Phase3AdminResolutionPolicyBundle>;
  querySubtypeProfile(
    adminResolutionSubtypeRef: AdminResolutionSubtypeRef,
  ): Promise<AdminResolutionSubtypeProfileSnapshot | null>;
  listSubtypeProfiles(): Promise<readonly AdminResolutionSubtypeProfileSnapshot[]>;
  openAdminResolutionCase(
    input: OpenAdminResolutionCaseInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
    reusedExisting: boolean;
  }>;
  reclassifyAdminResolutionSubtype(
    input: ReclassifyAdminResolutionSubtypeInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
  }>;
  enterAdminResolutionWaitingState(
    input: EnterAdminResolutionWaitingStateInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
  }>;
  cancelAdminResolutionWait(input: CancelAdminResolutionWaitInput): Promise<AdminResolutionCaseSnapshot>;
  recordAdminResolutionCompletionArtifact(
    input: RecordAdminResolutionCompletionArtifactInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    completionArtifact: AdminResolutionCompletionArtifactSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
    reusedExisting: boolean;
  }>;
  evaluateCaseContinuity(
    input: EvaluateAdminResolutionCaseContinuityInput,
  ): Promise<AdminResolutionCaseContinuityEvaluation>;
}

class Phase3AdminResolutionPolicyKernelServiceImpl
  implements Phase3AdminResolutionPolicyKernelService
{
  constructor(
    private readonly repositories: Phase3AdminResolutionPolicyKernelRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(taskId: string): Promise<Phase3AdminResolutionPolicyBundle> {
    const adminResolutionCases = await this.repositories.listAdminResolutionCasesForTask(taskId);
    const currentAdminResolutionCase =
      await this.repositories.getCurrentAdminResolutionCaseForTask(taskId);
    const currentSubtypeProfile = currentAdminResolutionCase
      ? await this.repositories.getSubtypeProfile(currentAdminResolutionCase.adminResolutionSubtypeRef)
      : null;
    const currentCompletionArtifact =
      currentAdminResolutionCase?.completionArtifactRef !== null &&
      currentAdminResolutionCase?.completionArtifactRef !== undefined
        ? await this.repositories.getAdminResolutionCompletionArtifact(
            currentAdminResolutionCase.completionArtifactRef,
          )
        : null;
    const completionArtifactMap = new Map<string, AdminResolutionCompletionArtifactSnapshot>();
    for (const adminCase of adminResolutionCases) {
      const artifacts =
        await this.repositories.listAdminResolutionCompletionArtifactsForCase(
          adminCase.adminResolutionCaseId,
        );
      for (const artifact of artifacts) {
        completionArtifactMap.set(
          artifact.adminResolutionCompletionArtifactId,
          artifact,
        );
      }
    }

    return {
      currentAdminResolutionCase,
      currentSubtypeProfile,
      currentCompletionArtifact,
      adminResolutionCases,
      adminResolutionCompletionArtifacts: [...completionArtifactMap.values()].sort((left, right) =>
        compareIso(left.recordedAt, right.recordedAt),
      ),
      subtypeProfiles: await this.repositories.listSubtypeProfiles(),
    };
  }

  async querySubtypeProfile(
    adminResolutionSubtypeRef: AdminResolutionSubtypeRef,
  ): Promise<AdminResolutionSubtypeProfileSnapshot | null> {
    return this.repositories.getSubtypeProfile(adminResolutionSubtypeRef);
  }

  async listSubtypeProfiles(): Promise<readonly AdminResolutionSubtypeProfileSnapshot[]> {
    return this.repositories.listSubtypeProfiles();
  }

  async openAdminResolutionCase(
    input: OpenAdminResolutionCaseInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
    reusedExisting: boolean;
  }> {
    validateBoundedAdminOpenTuple(input);
    const subtypeProfile = await this.repositories.getSubtypeProfile(
      input.adminResolutionSubtypeRef,
    );
    invariant(
      subtypeProfile,
      "ADMIN_RESOLUTION_SUBTYPE_PROFILE_NOT_FOUND",
      `Subtype profile ${input.adminResolutionSubtypeRef} is required.`,
    );
    validateSubtypeProfile(subtypeProfile);
    if (subtypeProfile.sourceDomainRequired) {
      requireRef(input.sourceDomainRef, "sourceDomainRef");
      requireRef(input.sourceLineageRef, "sourceLineageRef");
    }
    if (subtypeProfile.sourceDecisionRequired) {
      requireRef(input.sourceDecisionRef, "sourceDecisionRef");
    }

    const existing = await this.repositories.getCurrentAdminResolutionCaseForTask(
      input.sourceTriageTaskRef,
    );
    if (existing) {
      invariant(
        existing.boundaryTupleHash === requireRef(input.boundaryTupleHash, "boundaryTupleHash") &&
          existing.decisionEpochRef === requireRef(input.decisionEpochRef, "decisionEpochRef"),
        "ADMIN_RESOLUTION_CASE_ALREADY_OPEN",
        `Task ${input.sourceTriageTaskRef} already has an open AdminResolutionCase on a different tuple.`,
      );
      return {
        adminResolutionCase: existing,
        subtypeProfile,
        reusedExisting: true,
      };
    }

    const openedAt = ensureIsoTimestamp(input.openedAt, "openedAt");
    const adminResolutionCaseId =
      input.adminResolutionCaseId ??
      `admin_resolution_case_${stableReviewDigest({
        sourceTriageTaskRef: input.sourceTriageTaskRef,
        boundaryTupleHash: input.boundaryTupleHash,
        decisionEpochRef: input.decisionEpochRef,
        adminResolutionSubtypeRef: input.adminResolutionSubtypeRef,
      })}`;
    const caseState = input.caseState ?? "in_progress";
    invariant(
      caseState === "queued" || caseState === "in_progress",
      "INVALID_ADMIN_RESOLUTION_CASE_STATE",
      "AdminResolutionCase may open only into queued or in_progress state.",
    );

    const snapshot: AdminResolutionCaseSnapshot = {
      adminResolutionCaseId,
      episodeRef: requireRef(input.episodeRef, "episodeRef"),
      requestRef: requireRef(input.requestRef, "requestRef"),
      requestLineageRef: requireRef(input.requestLineageRef, "requestLineageRef"),
      lineageCaseLinkRef: requireRef(input.lineageCaseLinkRef, "lineageCaseLinkRef"),
      sourceTriageTaskRef: requireRef(input.sourceTriageTaskRef, "sourceTriageTaskRef"),
      sourceAdminResolutionStarterRef: optionalRef(input.sourceAdminResolutionStarterRef),
      sourceDomainRef: optionalRef(input.sourceDomainRef),
      sourceDecisionRef: optionalRef(input.sourceDecisionRef),
      sourceLineageRef: optionalRef(input.sourceLineageRef),
      adminResolutionSubtypeRef: input.adminResolutionSubtypeRef,
      boundaryDecisionRef: requireRef(input.boundaryDecisionRef, "boundaryDecisionRef"),
      boundaryTupleHash: requireRef(input.boundaryTupleHash, "boundaryTupleHash"),
      clinicalMeaningState: requireRef(input.clinicalMeaningState, "clinicalMeaningState"),
      operationalFollowUpScope: requireRef(
        input.operationalFollowUpScope,
        "operationalFollowUpScope",
      ),
      adminMutationAuthorityState: requireRef(
        input.adminMutationAuthorityState,
        "adminMutationAuthorityState",
      ),
      decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
      decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
      policyBundleRef: requireRef(input.policyBundleRef, "policyBundleRef"),
      lineageFenceEpoch: ensurePositiveInteger(input.lineageFenceEpoch, "lineageFenceEpoch"),
      caseVersionRef:
        optionalRef(input.caseVersionRef) ?? "admin_resolution_case_version.v1",
      currentOwnerRef: requireRef(input.currentOwnerRef, "currentOwnerRef"),
      caseState,
      waitingState: "none",
      waitingReasonCodeRef: null,
      waitingDependencyShape: null,
      waitingOwnerRef: null,
      waitingOwnerRoleRef: null,
      waitingSlaClockSourceRef: null,
      waitingExpiryOrRepairRuleRef: null,
      currentActionRecordRef:
        optionalRef(input.currentActionRecordRef) ??
        nextId(this.idGenerator, "phase3_admin_resolution_action_record"),
      completionArtifactRef: null,
      dependencySetRef: optionalRef(input.dependencySetRef),
      reopenState: requireRef(input.reopenState, "reopenState"),
      experienceProjectionRef: optionalRef(input.experienceProjectionRef),
      releaseWatchRef: optionalRef(input.releaseWatchRef),
      watchWindowRef:
        optionalRef(input.watchWindowRef) ??
        (subtypeProfile.reclassificationWindowHours
          ? `watch_window.admin_resolution.reclassification.${subtypeProfile.reclassificationWindowHours}h`
          : null),
      reclassificationDueAt:
        subtypeProfile.reclassificationWindowHours === null
          ? null
          : addHours(openedAt, subtypeProfile.reclassificationWindowHours),
      openedAt,
      closedAt: null,
      version: 1,
    };
    await this.repositories.saveAdminResolutionCase(snapshot);
    return {
      adminResolutionCase: snapshot,
      subtypeProfile,
      reusedExisting: false,
    };
  }

  async reclassifyAdminResolutionSubtype(
    input: ReclassifyAdminResolutionSubtypeInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
  }> {
    const adminCase = await this.requireCase(input.adminResolutionCaseId);
    invariant(
      adminCase.caseState !== "closed" && adminCase.caseState !== "frozen",
      "ADMIN_RESOLUTION_CASE_NOT_MUTABLE",
      "Closed or frozen AdminResolutionCase may not be reclassified.",
    );
    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const currentProfile = await this.requireSubtypeProfile(adminCase.adminResolutionSubtypeRef);
    if (
      adminCase.adminResolutionSubtypeRef === "routed_admin_task" &&
      adminCase.reclassificationDueAt !== null &&
      compareIso(adminCase.reclassificationDueAt, recordedAt) <= 0
    ) {
      invariant(
        false,
        "ROUTED_ADMIN_TASK_RECLASSIFICATION_WINDOW_ELAPSED",
        "routed_admin_task may not remain open after its governed reclassification window.",
      );
    }

    const nextProfile = await this.requireSubtypeProfile(input.nextSubtypeRef);
    if (adminCase.adminResolutionSubtypeRef === "routed_admin_task") {
      invariant(
        currentProfile.allowedReclassificationTargets.includes(input.nextSubtypeRef),
        "INVALID_ROUTED_ADMIN_RECLASSIFICATION_TARGET",
        `Subtype ${input.nextSubtypeRef} is not an allowed routed_admin_task reclassification target.`,
      );
    }

    const updated: AdminResolutionCaseSnapshot = {
      ...adminCase,
      adminResolutionSubtypeRef: input.nextSubtypeRef,
      currentOwnerRef: optionalRef(input.currentOwnerRef) ?? adminCase.currentOwnerRef,
      currentActionRecordRef:
        optionalRef(input.currentActionRecordRef) ??
        nextId(this.idGenerator, "phase3_admin_resolution_action_record"),
      caseState: "in_progress",
      waitingState: "none",
      waitingReasonCodeRef: null,
      waitingDependencyShape: null,
      waitingOwnerRef: null,
      waitingOwnerRoleRef: null,
      waitingSlaClockSourceRef: null,
      waitingExpiryOrRepairRuleRef: null,
      reclassificationDueAt:
        nextProfile.reclassificationWindowHours === null
          ? null
          : addHours(recordedAt, nextProfile.reclassificationWindowHours),
      version: adminCase.version + 1,
    };
    await this.repositories.saveAdminResolutionCase(updated, {
      expectedVersion: adminCase.version,
    });
    return {
      adminResolutionCase: updated,
      subtypeProfile: nextProfile,
    };
  }

  async enterAdminResolutionWaitingState(
    input: EnterAdminResolutionWaitingStateInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
  }> {
    const adminCase = await this.requireCase(input.adminResolutionCaseId);
    invariant(
      adminCase.caseState !== "closed" &&
        adminCase.caseState !== "frozen" &&
        adminCase.caseState !== "completion_artifact_recorded",
      "ADMIN_RESOLUTION_CASE_NOT_WAITABLE",
      "Closed, frozen, or completion-artifact-recorded AdminResolutionCase may not enter waiting state.",
    );
    const subtypeProfile = await this.requireSubtypeProfile(adminCase.adminResolutionSubtypeRef);
    const waitingPolicy = findWaitingPolicy(subtypeProfile, input.waitingState);
    invariant(
      waitingPolicy.allowedReasonCodeRefs.includes(
        requireRef(input.waitingReasonCodeRef, "waitingReasonCodeRef"),
      ),
      "WAITING_REASON_NOT_ALLOWED_FOR_SUBTYPE",
      `Subtype ${subtypeProfile.adminResolutionSubtypeRef} does not allow waiting reason ${input.waitingReasonCodeRef}.`,
    );
    invariant(
      waitingPolicy.dependencyShape === input.dependencyShape,
      "WAITING_DEPENDENCY_SHAPE_MISMATCH",
      `Waiting state ${input.waitingState} requires dependency shape ${waitingPolicy.dependencyShape}.`,
    );
    invariant(
      waitingPolicy.slaClockSourceRef === requireRef(input.slaClockSourceRef, "slaClockSourceRef"),
      "WAITING_SLA_CLOCK_SOURCE_MISMATCH",
      `Waiting state ${input.waitingState} requires SLA clock ${waitingPolicy.slaClockSourceRef}.`,
    );
    invariant(
      waitingPolicy.expiryOrRepairRuleRef ===
        requireRef(input.expiryOrRepairRuleRef, "expiryOrRepairRuleRef"),
      "WAITING_EXPIRY_OR_REPAIR_RULE_MISMATCH",
      `Waiting state ${input.waitingState} requires expiry or repair rule ${waitingPolicy.expiryOrRepairRuleRef}.`,
    );

    const updated: AdminResolutionCaseSnapshot = {
      ...adminCase,
      caseState: "waiting",
      waitingState: input.waitingState,
      waitingReasonCodeRef: requireRef(input.waitingReasonCodeRef, "waitingReasonCodeRef"),
      waitingDependencyShape: input.dependencyShape,
      waitingOwnerRef: requireRef(input.ownerRef, "ownerRef"),
      waitingOwnerRoleRef: waitingPolicy.ownerRoleRef,
      waitingSlaClockSourceRef: waitingPolicy.slaClockSourceRef,
      waitingExpiryOrRepairRuleRef: waitingPolicy.expiryOrRepairRuleRef,
      currentOwnerRef: requireRef(input.ownerRef, "ownerRef"),
      currentActionRecordRef:
        optionalRef(input.currentActionRecordRef) ??
        nextId(this.idGenerator, "phase3_admin_resolution_action_record"),
      version: adminCase.version + 1,
    };
    await this.repositories.saveAdminResolutionCase(updated, {
      expectedVersion: adminCase.version,
    });
    return {
      adminResolutionCase: updated,
      subtypeProfile,
    };
  }

  async cancelAdminResolutionWait(
    input: CancelAdminResolutionWaitInput,
  ): Promise<AdminResolutionCaseSnapshot> {
    const adminCase = await this.requireCase(input.adminResolutionCaseId);
    invariant(
      adminCase.waitingState !== "none",
      "ADMIN_RESOLUTION_CASE_NOT_WAITING",
      "Cancel wait requires a current waiting state.",
    );
    invariant(
      adminCase.caseState !== "frozen" && adminCase.caseState !== "closed",
      "ADMIN_RESOLUTION_CASE_NOT_MUTABLE",
      "Closed or frozen AdminResolutionCase may not cancel wait.",
    );
    const updated: AdminResolutionCaseSnapshot = {
      ...adminCase,
      caseState: "in_progress",
      waitingState: "none",
      waitingReasonCodeRef: null,
      waitingDependencyShape: null,
      waitingOwnerRef: null,
      waitingOwnerRoleRef: null,
      waitingSlaClockSourceRef: null,
      waitingExpiryOrRepairRuleRef: null,
      currentOwnerRef: optionalRef(input.currentOwnerRef) ?? adminCase.currentOwnerRef,
      currentActionRecordRef:
        optionalRef(input.currentActionRecordRef) ??
        nextId(this.idGenerator, "phase3_admin_resolution_action_record"),
      version: adminCase.version + 1,
    };
    await this.repositories.saveAdminResolutionCase(updated, {
      expectedVersion: adminCase.version,
    });
    return updated;
  }

  async recordAdminResolutionCompletionArtifact(
    input: RecordAdminResolutionCompletionArtifactInput,
  ): Promise<{
    adminResolutionCase: AdminResolutionCaseSnapshot;
    completionArtifact: AdminResolutionCompletionArtifactSnapshot;
    subtypeProfile: AdminResolutionSubtypeProfileSnapshot;
    reusedExisting: boolean;
  }> {
    invariant(
      completionTypes.includes(input.completionType),
      "INVALID_ADMIN_RESOLUTION_COMPLETION_TYPE",
      "Unsupported AdminResolutionCompletionArtifact completionType.",
    );
    const adminCase = await this.requireCase(input.adminResolutionCaseId);
    invariant(
      adminCase.caseState !== "closed" && adminCase.caseState !== "frozen",
      "ADMIN_RESOLUTION_CASE_NOT_MUTABLE",
      "Closed or frozen AdminResolutionCase may not record completion artifacts.",
    );
    invariant(
      adminCase.waitingState === "none",
      "ADMIN_RESOLUTION_CASE_WAITING",
      "Waiting AdminResolutionCase may not record a completion artifact.",
    );
    const subtypeProfile = await this.requireSubtypeProfile(adminCase.adminResolutionSubtypeRef);
    const completionPolicy = findCompletionPolicy(subtypeProfile, input.completionType);
    const completionEvidenceRefs = uniqueSorted(input.completionEvidenceRefs);
    invariant(
      completionEvidenceRefs.length > 0,
      "ADMIN_RESOLUTION_COMPLETION_EVIDENCE_REQUIRED",
      "AdminResolutionCompletionArtifact requires at least one completionEvidenceRef.",
    );
    const deliveryOutcomeRefs = uniqueSorted(input.deliveryOutcomeRefs ?? []);
    if (completionPolicy.requiresCommunicationDeliveryOutcome) {
      invariant(
        deliveryOutcomeRefs.length > 0,
        "ADMIN_RESOLUTION_DELIVERY_OUTCOME_REQUIRED",
        `Completion type ${input.completionType} requires at least one deliveryOutcomeRef.`,
      );
    }

    const recordedAt = ensureIsoTimestamp(input.recordedAt, "recordedAt");
    const patientExpectationTemplateRef =
      optionalRef(input.patientExpectationTemplateRef) ??
      completionPolicy.patientExpectationTemplateRef;
    invariant(
      patientExpectationTemplateRef === completionPolicy.patientExpectationTemplateRef,
      "PATIENT_EXPECTATION_TEMPLATE_MISMATCH",
      `Completion type ${input.completionType} requires template ${completionPolicy.patientExpectationTemplateRef}.`,
    );
    const artifactPresentationContractRef =
      optionalRef(input.artifactPresentationContractRef) ??
      completionPolicy.artifactPresentationContractRef;
    invariant(
      !isRawExternalRef(artifactPresentationContractRef),
      "RAW_ARTIFACT_URL_FORBIDDEN",
      "AdminResolutionCompletionArtifact may not emit a raw external artifact contract reference.",
    );

    const completionArtifactId =
      input.adminResolutionCompletionArtifactId ??
      `admin_resolution_completion_artifact_${stableReviewDigest({
        adminResolutionCaseId: input.adminResolutionCaseId,
        completionType: input.completionType,
        completionEvidenceRefs,
        patientVisibleSummaryRef: input.patientVisibleSummaryRef,
      })}`;
    const existing = await this.repositories.getAdminResolutionCompletionArtifact(
      completionArtifactId,
    );
    if (existing) {
      return {
        adminResolutionCase: {
          ...adminCase,
          completionArtifactRef: existing.adminResolutionCompletionArtifactId,
        },
        completionArtifact: existing,
        subtypeProfile,
        reusedExisting: true,
      };
    }

    if (adminCase.completionArtifactRef) {
      const prior = await this.repositories.getAdminResolutionCompletionArtifact(
        adminCase.completionArtifactRef,
      );
      if (prior && prior.artifactState !== "superseded") {
        await this.repositories.saveAdminResolutionCompletionArtifact(
          {
            ...prior,
            artifactState: "superseded",
            version: prior.version + 1,
          },
          { expectedVersion: prior.version },
        );
      }
    }

    const completionArtifact: AdminResolutionCompletionArtifactSnapshot = {
      adminResolutionCompletionArtifactId: completionArtifactId,
      adminResolutionCaseRef: adminCase.adminResolutionCaseId,
      completionType: input.completionType,
      completionEvidenceRefs,
      patientExpectationTemplateRef,
      patientVisibleSummaryRef: requireRef(
        input.patientVisibleSummaryRef,
        "patientVisibleSummaryRef",
      ),
      artifactPresentationContractRef,
      artifactByteGrantRefs: uniqueSorted(input.artifactByteGrantRefs ?? []),
      outboundNavigationGrantRefs: uniqueSorted(input.outboundNavigationGrantRefs ?? []),
      releaseState: input.releaseState ?? completionPolicy.defaultReleaseState,
      visibilityTier:
        optionalRef(input.visibilityTier) ?? completionPolicy.defaultVisibilityTier,
      summarySafetyTier:
        optionalRef(input.summarySafetyTier) ??
        completionPolicy.defaultSummarySafetyTier,
      placeholderContractRef:
        optionalRef(input.placeholderContractRef) ??
        completionPolicy.defaultPlaceholderContractRef,
      communicationDispatchRefs: uniqueSorted(input.communicationDispatchRefs ?? []),
      deliveryOutcomeRefs,
      reopenPolicyRef: subtypeProfile.reopenPolicyRef,
      artifactState: "recorded",
      recordedAt,
      version: 1,
    };
    invariant(
      releaseStates.includes(completionArtifact.releaseState),
      "INVALID_ADMIN_RESOLUTION_RELEASE_STATE",
      "Unsupported AdminResolutionCompletionArtifact releaseState.",
    );

    await this.repositories.saveAdminResolutionCompletionArtifact(completionArtifact);
    const updatedCase: AdminResolutionCaseSnapshot = {
      ...adminCase,
      caseState: "completion_artifact_recorded",
      completionArtifactRef: completionArtifact.adminResolutionCompletionArtifactId,
      currentActionRecordRef: nextId(this.idGenerator, "phase3_admin_resolution_action_record"),
      version: adminCase.version + 1,
    };
    await this.repositories.saveAdminResolutionCase(updatedCase, {
      expectedVersion: adminCase.version,
    });
    return {
      adminResolutionCase: updatedCase,
      completionArtifact,
      subtypeProfile,
      reusedExisting: false,
    };
  }

  async evaluateCaseContinuity(
    input: EvaluateAdminResolutionCaseContinuityInput,
  ): Promise<AdminResolutionCaseContinuityEvaluation> {
    const currentAdminResolutionCase =
      await this.repositories.getCurrentAdminResolutionCaseForTask(input.taskId);
    if (!currentAdminResolutionCase) {
      return {
        currentAdminResolutionCase: null,
        currentSubtypeProfile: null,
        currentCompletionArtifact: null,
        effectiveCaseState: null,
        effectiveReasonCodeRefs: [],
        reclassificationDeadlineState: null,
      };
    }
    const currentSubtypeProfile = await this.repositories.getSubtypeProfile(
      currentAdminResolutionCase.adminResolutionSubtypeRef,
    );
    const currentCompletionArtifact = currentAdminResolutionCase.completionArtifactRef
      ? await this.repositories.getAdminResolutionCompletionArtifact(
          currentAdminResolutionCase.completionArtifactRef,
        )
      : null;

    const evaluatedAt = ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt");
    const reasons = new Set<string>();
    let effectiveCaseState: AdminResolutionCaseState =
      currentAdminResolutionCase.caseState;
    let reclassificationDeadlineState: AdminResolutionReclassificationDeadlineState | null =
      null;

    if (optionalRef(input.currentBoundaryDecisionRef) === null) {
      reasons.add("boundary_decision_missing");
    } else {
      if (
        input.currentBoundaryDecisionRef !==
        currentAdminResolutionCase.boundaryDecisionRef
      ) {
        reasons.add("boundary_decision_drift");
      }
      if (
        optionalRef(input.currentBoundaryTupleHash) !==
        currentAdminResolutionCase.boundaryTupleHash
      ) {
        reasons.add("boundary_tuple_drift");
      }
      if (input.currentBoundaryState !== "live") {
        reasons.add("boundary_state_not_live");
      }
      if (input.currentClinicalMeaningState !== "bounded_admin_only") {
        reasons.add("clinical_meaning_not_bounded_admin_only");
      }
      if (
        input.currentOperationalFollowUpScope !== "bounded_admin_resolution"
      ) {
        reasons.add("operational_follow_up_scope_not_bounded_admin_resolution");
      }
      if (input.currentAdminMutationAuthorityState !== "bounded_admin_only") {
        reasons.add("admin_mutation_authority_not_bounded");
      }
      if (input.currentReopenState !== "stable") {
        reasons.add("boundary_reopen_not_stable");
      }
      if (optionalRef(input.currentDecisionEpochRef) !== currentAdminResolutionCase.decisionEpochRef) {
        reasons.add("decision_epoch_drift");
      }
      if (optionalRef(input.currentDecisionSupersessionRecordRef) !== null) {
        reasons.add("decision_superseded");
      }
    }

    if (
      currentAdminResolutionCase.adminResolutionSubtypeRef === "routed_admin_task" &&
      currentAdminResolutionCase.reclassificationDueAt !== null
    ) {
      reclassificationDeadlineState =
        compareIso(currentAdminResolutionCase.reclassificationDueAt, evaluatedAt) <= 0
          ? "elapsed"
          : "current";
      if (reclassificationDeadlineState === "elapsed") {
        reasons.add("routed_admin_task_reclassification_window_elapsed");
      }
    }

    if (reasons.size > 0 && currentAdminResolutionCase.caseState !== "closed") {
      effectiveCaseState = "frozen";
    }

    return {
      currentAdminResolutionCase,
      currentSubtypeProfile,
      currentCompletionArtifact,
      effectiveCaseState,
      effectiveReasonCodeRefs: uniqueSorted([...reasons]),
      reclassificationDeadlineState,
    };
  }

  private async requireCase(adminResolutionCaseId: string): Promise<AdminResolutionCaseSnapshot> {
    const adminCase = await this.repositories.getAdminResolutionCase(
      requireRef(adminResolutionCaseId, "adminResolutionCaseId"),
    );
    invariant(
      adminCase,
      "ADMIN_RESOLUTION_CASE_NOT_FOUND",
      `AdminResolutionCase ${adminResolutionCaseId} is required.`,
    );
    invariant(
      caseStates.includes(adminCase.caseState),
      "INVALID_ADMIN_RESOLUTION_CASE_STATE",
      "Stored AdminResolutionCase contains an unsupported caseState.",
    );
    invariant(
      waitingStates.includes(adminCase.waitingState),
      "INVALID_ADMIN_RESOLUTION_WAITING_STATE",
      "Stored AdminResolutionCase contains an unsupported waitingState.",
    );
    return adminCase;
  }

  private async requireSubtypeProfile(
    adminResolutionSubtypeRef: AdminResolutionSubtypeRef,
  ): Promise<AdminResolutionSubtypeProfileSnapshot> {
    const subtypeProfile = await this.repositories.getSubtypeProfile(
      adminResolutionSubtypeRef,
    );
    invariant(
      subtypeProfile,
      "ADMIN_RESOLUTION_SUBTYPE_PROFILE_NOT_FOUND",
      `Subtype profile ${adminResolutionSubtypeRef} is required.`,
    );
    validateSubtypeProfile(subtypeProfile);
    return subtypeProfile;
  }
}

export function createPhase3AdminResolutionPolicyKernelStore(options?: {
  subtypeProfiles?: readonly AdminResolutionSubtypeProfileSnapshot[];
}): Phase3AdminResolutionPolicyKernelRepositories {
  return new InMemoryPhase3AdminResolutionPolicyKernelStore(options?.subtypeProfiles);
}

export function createPhase3AdminResolutionPolicyKernelService(
  repositories: Phase3AdminResolutionPolicyKernelRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3AdminResolutionPolicyKernelService {
  const idGenerator =
    options?.idGenerator ??
    createDeterministicBackboneIdGenerator("phase3_admin_resolution_policy_kernel");
  return new Phase3AdminResolutionPolicyKernelServiceImpl(repositories, idGenerator);
}
