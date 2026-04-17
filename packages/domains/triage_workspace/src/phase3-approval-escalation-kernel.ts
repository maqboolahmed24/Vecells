import {
  RequestBackboneInvariantError,
  computeWorkspaceTupleHash,
  createDeterministicBackboneIdGenerator,
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

function ensureNonNegativeInteger(value: number, field: string): number {
  invariant(
    Number.isInteger(value) && value >= 0,
    `INVALID_${field.toUpperCase()}`,
    `${field} must be a non-negative integer.`,
  );
  return value;
}

function compareIso(left: string, right: string): number {
  return left.localeCompare(right);
}

function nextVersion(currentVersion: number): number {
  invariant(currentVersion >= 1, "INVALID_VERSION", "Aggregate version must start at 1.");
  return currentVersion + 1;
}

function nextKernelId(idGenerator: BackboneIdGenerator, kind: string): string {
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

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export type Phase3ApprovalActionType =
  | "submit_endpoint"
  | "issue_direct_resolution"
  | "commit_admin_resolution"
  | "commit_self_care"
  | "commit_escalation_override";

export type ApprovalCheckpointState =
  | "not_required"
  | "required"
  | "pending"
  | "approved"
  | "rejected"
  | "superseded";

export type ApprovalRequiredMode = "required" | "not_required";
export type GovernedRiskBurdenClass = "low" | "moderate" | "high" | "urgent" | "any";
export type GovernedAssistiveProvenanceState =
  | "none"
  | "seeded"
  | "seeded_or_override"
  | "any";
export type GovernedSensitiveOverrideState =
  | "none"
  | "tenant_sensitive_override"
  | "manual_override"
  | "any";
export type ApprovalInvalidationReasonClass =
  | "endpoint_changed"
  | "payload_changed"
  | "patient_reply"
  | "duplicate_resolution"
  | "publication_drift"
  | "trust_drift"
  | "epoch_superseded"
  | "manual_replace";

export type DutyEscalationTriggerMode =
  | "reviewer_manual"
  | "residual_high_risk"
  | "safety_preemption"
  | "supervisor_override";

export type DutyEscalationSeverityBand = "urgent" | "critical";
export type DutyEscalationState =
  | "active"
  | "contact_in_progress"
  | "direct_outcome_recorded"
  | "handoff_pending"
  | "returned_to_triage"
  | "cancelled"
  | "expired";

export type UrgentContactRouteClass =
  | "primary_phone"
  | "secondary_phone"
  | "practice_transfer"
  | "secure_message_notice";

export type UrgentContactAttemptState =
  | "queued"
  | "ringing"
  | "voicemail_left"
  | "connected"
  | "no_answer"
  | "failed"
  | "cancelled";

export type UrgentEscalationOutcomeClass =
  | "direct_non_appointment"
  | "downstream_handoff"
  | "return_to_triage"
  | "cancelled"
  | "expired";

export type TriageReopenSourceDomain =
  | "urgent_escalation"
  | "direct_resolution"
  | "booking_handoff"
  | "pharmacy_handoff"
  | "callback"
  | "clinician_message"
  | "supervisor_review";

export type TriageReopenByMode = "automatic" | "reviewer_manual" | "supervisor_manual";

const approvalActionTypes: readonly Phase3ApprovalActionType[] = [
  "submit_endpoint",
  "issue_direct_resolution",
  "commit_admin_resolution",
  "commit_self_care",
  "commit_escalation_override",
];

const checkpointStates: readonly ApprovalCheckpointState[] = [
  "not_required",
  "required",
  "pending",
  "approved",
  "rejected",
  "superseded",
];

const approvalModes: readonly ApprovalRequiredMode[] = ["required", "not_required"];

const riskBurdenClasses: readonly GovernedRiskBurdenClass[] = [
  "low",
  "moderate",
  "high",
  "urgent",
  "any",
];

const assistiveProvenanceStates: readonly GovernedAssistiveProvenanceState[] = [
  "none",
  "seeded",
  "seeded_or_override",
  "any",
];

const sensitiveOverrideStates: readonly GovernedSensitiveOverrideState[] = [
  "none",
  "tenant_sensitive_override",
  "manual_override",
  "any",
];

const invalidationReasonClasses: readonly ApprovalInvalidationReasonClass[] = [
  "endpoint_changed",
  "payload_changed",
  "patient_reply",
  "duplicate_resolution",
  "publication_drift",
  "trust_drift",
  "epoch_superseded",
  "manual_replace",
];

const escalationTriggerModes: readonly DutyEscalationTriggerMode[] = [
  "reviewer_manual",
  "residual_high_risk",
  "safety_preemption",
  "supervisor_override",
];

const escalationSeverityBands: readonly DutyEscalationSeverityBand[] = ["urgent", "critical"];

const escalationStates: readonly DutyEscalationState[] = [
  "active",
  "contact_in_progress",
  "direct_outcome_recorded",
  "handoff_pending",
  "returned_to_triage",
  "cancelled",
  "expired",
];

const contactRouteClasses: readonly UrgentContactRouteClass[] = [
  "primary_phone",
  "secondary_phone",
  "practice_transfer",
  "secure_message_notice",
];

const contactAttemptStates: readonly UrgentContactAttemptState[] = [
  "queued",
  "ringing",
  "voicemail_left",
  "connected",
  "no_answer",
  "failed",
  "cancelled",
];

const escalationOutcomeClasses: readonly UrgentEscalationOutcomeClass[] = [
  "direct_non_appointment",
  "downstream_handoff",
  "return_to_triage",
  "cancelled",
  "expired",
];

const reopenSourceDomains: readonly TriageReopenSourceDomain[] = [
  "urgent_escalation",
  "direct_resolution",
  "booking_handoff",
  "pharmacy_handoff",
  "callback",
  "clinician_message",
  "supervisor_review",
];

const reopenByModes: readonly TriageReopenByMode[] = [
  "automatic",
  "reviewer_manual",
  "supervisor_manual",
];

interface ApprovalPolicyRule {
  ruleId: string;
  endpointClass: string;
  pathwayRef: string;
  riskBurdenClass: GovernedRiskBurdenClass;
  assistiveProvenanceState: GovernedAssistiveProvenanceState;
  sensitiveOverrideState: GovernedSensitiveOverrideState;
  tenantPolicyRef: string;
  policyReasonCode: string;
  requiredApprovalMode: ApprovalRequiredMode;
  approverRoleRefs: readonly string[];
}

export const phase3GovernedApprovalMatrixRef = "228.approval-policy-matrix.v1";

const approvalPolicyRules: readonly ApprovalPolicyRule[] = [
  {
    ruleId: "AP_228_ASSISTIVE_SEEDED_SUBMIT",
    endpointClass: "*",
    pathwayRef: "assistive_seeded_submit",
    riskBurdenClass: "any",
    assistiveProvenanceState: "seeded_or_override",
    sensitiveOverrideState: "any",
    tenantPolicyRef: "tenant_policy::assistive_submit_guard",
    policyReasonCode: "assistive_seeded_consequence_requires_human_checkpoint",
    requiredApprovalMode: "required",
    approverRoleRefs: ["clinical_supervisor"],
  },
  {
    ruleId: "AP_228_ADMIN_SENSITIVE",
    endpointClass: "admin_resolution",
    pathwayRef: "bounded_admin_resolution",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "tenant_sensitive_override",
    tenantPolicyRef: "tenant_policy::admin_sensitive",
    policyReasonCode: "admin_completion_requires_explicit_authority",
    requiredApprovalMode: "required",
    approverRoleRefs: ["practice_manager", "clinical_supervisor"],
  },
  {
    ruleId: "AP_228_SELF_CARE_CLOSURE",
    endpointClass: "self_care_and_safety_net",
    pathwayRef: "self_serve_guidance",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "none",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::self_care_direct_close",
    policyReasonCode: "clinically_definitive_advice_closure",
    requiredApprovalMode: "required",
    approverRoleRefs: ["clinical_supervisor"],
  },
  {
    ruleId: "AP_228_MESSAGE_CLOSURE",
    endpointClass: "clinician_message",
    pathwayRef: "clinician_message",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "none",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::message_close",
    policyReasonCode: "message_based_case_completion",
    requiredApprovalMode: "required",
    approverRoleRefs: ["clinical_supervisor"],
  },
  {
    ruleId: "AP_228_PHARMACY_OVERRIDE",
    endpointClass: "pharmacy_first_candidate",
    pathwayRef: "pharmacy_handoff",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "none",
    sensitiveOverrideState: "tenant_sensitive_override",
    tenantPolicyRef: "tenant_policy::pharmacy_exclusion_override",
    policyReasonCode: "pharmacy_exclusion_or_override",
    requiredApprovalMode: "required",
    approverRoleRefs: ["clinical_supervisor"],
  },
  {
    ruleId: "AP_228_CALLBACK_ROUTINE",
    endpointClass: "clinician_callback",
    pathwayRef: "clinician_callback",
    riskBurdenClass: "low",
    assistiveProvenanceState: "none",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::callback_creation",
    policyReasonCode: "follow_up_creation_only",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  {
    ruleId: "AP_228_APPOINTMENT_HANDOFF",
    endpointClass: "appointment_required",
    pathwayRef: "booking_handoff",
    riskBurdenClass: "low",
    assistiveProvenanceState: "none",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::booking_handoff",
    policyReasonCode: "handoff_seed_creation",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  {
    ruleId: "AP_228_DUTY_ESCALATION",
    endpointClass: "duty_clinician_escalation",
    pathwayRef: "urgent_escalation",
    riskBurdenClass: "urgent",
    assistiveProvenanceState: "none",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::urgent_contact",
    policyReasonCode: "urgent_safety_path_audited",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
];

const defaultApprovalPolicies: Readonly<Record<string, ApprovalPolicyRule>> = {
  admin_resolution: {
    ruleId: "AP_239_ADMIN_DEFAULT",
    endpointClass: "admin_resolution",
    pathwayRef: "bounded_admin_resolution",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::admin_default",
    policyReasonCode: "admin_resolution_default_no_extra_checkpoint",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  self_care_and_safety_net: {
    ruleId: "AP_239_SELF_CARE_DEFAULT",
    endpointClass: "self_care_and_safety_net",
    pathwayRef: "self_serve_guidance",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "any",
    tenantPolicyRef: "tenant_policy::self_care_default",
    policyReasonCode: "self_care_policy_default",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  clinician_message: {
    ruleId: "AP_239_MESSAGE_DEFAULT",
    endpointClass: "clinician_message",
    pathwayRef: "clinician_message",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "any",
    tenantPolicyRef: "tenant_policy::message_default",
    policyReasonCode: "message_policy_default",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  clinician_callback: {
    ruleId: "AP_239_CALLBACK_DEFAULT",
    endpointClass: "clinician_callback",
    pathwayRef: "clinician_callback",
    riskBurdenClass: "low",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "any",
    tenantPolicyRef: "tenant_policy::callback_default",
    policyReasonCode: "callback_policy_default",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  appointment_required: {
    ruleId: "AP_239_APPOINTMENT_DEFAULT",
    endpointClass: "appointment_required",
    pathwayRef: "booking_handoff",
    riskBurdenClass: "low",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "any",
    tenantPolicyRef: "tenant_policy::appointment_default",
    policyReasonCode: "appointment_policy_default",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  pharmacy_first_candidate: {
    ruleId: "AP_239_PHARMACY_DEFAULT",
    endpointClass: "pharmacy_first_candidate",
    pathwayRef: "pharmacy_handoff",
    riskBurdenClass: "moderate",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "none",
    tenantPolicyRef: "tenant_policy::pharmacy_default",
    policyReasonCode: "pharmacy_policy_default",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
  duty_clinician_escalation: {
    ruleId: "AP_239_DUTY_DEFAULT",
    endpointClass: "duty_clinician_escalation",
    pathwayRef: "urgent_escalation",
    riskBurdenClass: "urgent",
    assistiveProvenanceState: "any",
    sensitiveOverrideState: "any",
    tenantPolicyRef: "tenant_policy::duty_default",
    policyReasonCode: "duty_escalation_default",
    requiredApprovalMode: "not_required",
    approverRoleRefs: [],
  },
};

function normalizeApprovalActionType(value: Phase3ApprovalActionType): Phase3ApprovalActionType {
  invariant(
    approvalActionTypes.includes(value),
    "INVALID_APPROVAL_ACTION_TYPE",
    "Unsupported approval action type.",
  );
  return value;
}

function normalizeApprovalCheckpointState(value: ApprovalCheckpointState): ApprovalCheckpointState {
  invariant(
    checkpointStates.includes(value),
    "INVALID_APPROVAL_CHECKPOINT_STATE",
    "Unsupported approval checkpoint state.",
  );
  return value;
}

export interface GovernedApprovalRequirementAssessmentSnapshot {
  assessmentId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  decisionId: string;
  endpointClass: string;
  approvalPolicyMatrixRef: string;
  tenantPolicyRef: string;
  pathwayRef: string;
  riskBurdenClass: GovernedRiskBurdenClass;
  assistiveProvenanceState: GovernedAssistiveProvenanceState;
  sensitiveOverrideState: GovernedSensitiveOverrideState;
  matchedPolicyRuleRefs: readonly string[];
  requiredApprovalMode: ApprovalRequiredMode;
  checkpointState: ApprovalCheckpointState;
  reasonCodeRefs: readonly string[];
  evaluatedAt: string;
  tupleHash: string;
  version: number;
}

export interface ApprovalCheckpointSnapshot {
  checkpointId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  decisionId: string;
  actionType: Phase3ApprovalActionType;
  state: ApprovalCheckpointState;
  approvalRequirementAssessmentRef: string;
  decisionSupersessionRecordRef: string | null;
  requestedBy: string;
  requestedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  invalidationReasonClass: ApprovalInvalidationReasonClass | null;
  supersedesCheckpointRef: string | null;
  supersededByCheckpointRef: string | null;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  lastHeartbeatAt: string;
  fencingToken: string;
  ownershipEpoch: number;
  currentLineageFenceEpoch: number;
  staleOwnerRecoveryRef: string | null;
  version: number;
}

export interface DutyEscalationRecordSnapshot {
  dutyEscalationRecordId: string;
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  endpointDecisionRef: string;
  decisionSupersessionRecordRef: string | null;
  triggerMode: DutyEscalationTriggerMode;
  triggerReasonCode: string;
  severityBand: DutyEscalationSeverityBand;
  urgentTaskRef: string;
  currentUrgentContactAttemptRef: string | null;
  currentUrgentEscalationOutcomeRef: string | null;
  escalationState: DutyEscalationState;
  openedAt: string;
  closedAt: string | null;
  version: number;
}

export interface UrgentContactAttemptSnapshot {
  urgentContactAttemptId: string;
  dutyEscalationRecordRef: string;
  decisionEpochRef: string;
  attemptOrdinal: number;
  attemptReplayKey: string;
  contactRouteClass: UrgentContactRouteClass;
  attemptState: UrgentContactAttemptState;
  attemptedAt: string;
  completedAt: string | null;
  outcomeNote: string | null;
  version: number;
}

export interface UrgentEscalationOutcomeSnapshot {
  urgentEscalationOutcomeId: string;
  dutyEscalationRecordRef: string;
  decisionEpochRef: string;
  outcomeClass: UrgentEscalationOutcomeClass;
  endpointDecisionSettlementRef: string | null;
  bookingIntentRef: string | null;
  pharmacyIntentRef: string | null;
  triageReopenRecordRef: string | null;
  presentationArtifactRef: string | null;
  recordedAt: string;
  version: number;
}

export interface TriageReopenRecordSnapshot {
  reopenRecordId: string;
  taskId: string;
  sourceDomain: TriageReopenSourceDomain;
  reasonCode: string;
  evidenceRefs: readonly string[];
  supersededDecisionEpochRef: string;
  decisionSupersessionRecordRef: string;
  priorityOverride: string;
  reopenedByMode: TriageReopenByMode;
  reopenedAt: string;
  version: number;
}

export interface Phase3ApprovalEscalationBundle {
  approvalAssessment: GovernedApprovalRequirementAssessmentSnapshot | null;
  checkpoint: ApprovalCheckpointSnapshot | null;
  escalation: DutyEscalationRecordSnapshot | null;
  attempts: readonly UrgentContactAttemptSnapshot[];
  outcome: UrgentEscalationOutcomeSnapshot | null;
  reopenRecord: TriageReopenRecordSnapshot | null;
}

export interface EvaluateGovernedApprovalInput {
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  decisionId: string;
  endpointCode: string;
  payload: Readonly<Record<string, unknown>>;
  evaluatedAt: string;
}

export interface EvaluatedGovernedApproval {
  actionType: Phase3ApprovalActionType;
  approvalPolicyMatrixRef: string;
  tenantPolicyRef: string;
  pathwayRef: string;
  riskBurdenClass: GovernedRiskBurdenClass;
  assistiveProvenanceState: GovernedAssistiveProvenanceState;
  sensitiveOverrideState: GovernedSensitiveOverrideState;
  matchedPolicyRuleRefs: readonly string[];
  requiredApprovalMode: ApprovalRequiredMode;
  checkpointState: ApprovalCheckpointState;
  reasonCodeRefs: readonly string[];
  approverRoleRefs: readonly string[];
  tupleHash: string;
}

function endpointPathwayRef(endpointCode: string): string {
  switch (endpointCode) {
    case "admin_resolution":
      return "bounded_admin_resolution";
    case "self_care_and_safety_net":
      return "self_serve_guidance";
    case "clinician_message":
      return "clinician_message";
    case "clinician_callback":
      return "clinician_callback";
    case "appointment_required":
      return "booking_handoff";
    case "pharmacy_first_candidate":
      return "pharmacy_handoff";
    case "duty_clinician_escalation":
      return "urgent_escalation";
    default:
      return `unmapped_pathway::${endpointCode}`;
  }
}

function endpointRiskBurdenClass(
  endpointCode: string,
  payload: Readonly<Record<string, unknown>>,
): GovernedRiskBurdenClass {
  if (Boolean(payload["urgentOverride"])) {
    return "urgent";
  }
  if (Boolean(payload["highRiskOverride"])) {
    return "high";
  }
  switch (endpointCode) {
    case "clinician_callback":
    case "appointment_required":
      return "low";
    case "duty_clinician_escalation":
      return "urgent";
    default:
      return "moderate";
  }
}

function assistiveStateFromPayload(
  payload: Readonly<Record<string, unknown>>,
): GovernedAssistiveProvenanceState {
  const explicit = optionalRef(payload["assistiveProvenanceState"] as string | null | undefined);
  if (explicit === "none" || explicit === "seeded" || explicit === "seeded_or_override" || explicit === "any") {
    return explicit;
  }
  if (Boolean(payload["assistiveSeedRef"]) || Boolean(payload["assistiveSeeded"])) {
    return "seeded_or_override";
  }
  return "none";
}

function sensitiveOverrideStateFromPayload(
  payload: Readonly<Record<string, unknown>>,
): GovernedSensitiveOverrideState {
  const explicit = optionalRef(payload["sensitiveOverrideState"] as string | null | undefined);
  if (
    explicit === "none" ||
    explicit === "tenant_sensitive_override" ||
    explicit === "manual_override" ||
    explicit === "any"
  ) {
    return explicit;
  }
  if (Boolean(payload["manualOverride"])) {
    return "manual_override";
  }
  if (Boolean(payload["sensitiveOverride"]) || Boolean(payload["tenantSensitiveOverride"])) {
    return "tenant_sensitive_override";
  }
  return "none";
}

function actionTypeForEndpoint(
  endpointCode: string,
  sensitiveOverrideState: GovernedSensitiveOverrideState,
): Phase3ApprovalActionType {
  switch (endpointCode) {
    case "admin_resolution":
      return "commit_admin_resolution";
    case "self_care_and_safety_net":
      return "commit_self_care";
    case "clinician_message":
    case "clinician_callback":
      return "issue_direct_resolution";
    case "duty_clinician_escalation":
      return sensitiveOverrideState === "none"
        ? "submit_endpoint"
        : "commit_escalation_override";
    default:
      return "submit_endpoint";
  }
}

function ruleMatches(input: {
  rule: ApprovalPolicyRule;
  endpointCode: string;
  pathwayRef: string;
  riskBurdenClass: GovernedRiskBurdenClass;
  assistiveProvenanceState: GovernedAssistiveProvenanceState;
  sensitiveOverrideState: GovernedSensitiveOverrideState;
}): boolean {
  const { rule } = input;
  const endpointMatches = rule.endpointClass === "*" || rule.endpointClass === input.endpointCode;
  const pathwayMatches =
    rule.endpointClass === "*" || rule.pathwayRef === input.pathwayRef;
  const riskMatches =
    rule.riskBurdenClass === "any" || rule.riskBurdenClass === input.riskBurdenClass;
  const assistiveMatches =
    rule.assistiveProvenanceState === "any" ||
    rule.assistiveProvenanceState === input.assistiveProvenanceState;
  const sensitiveMatches =
    rule.sensitiveOverrideState === "any" ||
    rule.sensitiveOverrideState === input.sensitiveOverrideState;
  return endpointMatches && pathwayMatches && riskMatches && assistiveMatches && sensitiveMatches;
}

export function evaluateGovernedApprovalRequirement(
  input: EvaluateGovernedApprovalInput,
): EvaluatedGovernedApproval {
  const endpointCode = requireRef(input.endpointCode, "endpointCode");
  const pathwayRef = endpointPathwayRef(endpointCode);
  const riskBurdenClass = endpointRiskBurdenClass(endpointCode, input.payload);
  const assistiveProvenanceState = assistiveStateFromPayload(input.payload);
  const sensitiveOverrideState = sensitiveOverrideStateFromPayload(input.payload);
  const matchedRule =
    approvalPolicyRules.find((rule) =>
      ruleMatches({
        rule,
        endpointCode,
        pathwayRef,
        riskBurdenClass,
        assistiveProvenanceState,
        sensitiveOverrideState,
      }),
    ) ?? defaultApprovalPolicies[endpointCode];
  invariant(matchedRule, "APPROVAL_POLICY_RULE_NOT_FOUND", `No approval rule matched ${endpointCode}.`);
  const requiredApprovalMode = matchedRule.requiredApprovalMode;
  const actionType = actionTypeForEndpoint(endpointCode, sensitiveOverrideState);
  const reasonCodeRefs = [matchedRule.policyReasonCode];
  const tupleHash = computeWorkspaceTupleHash([
    { key: "decisionEpochRef", value: input.decisionEpochRef },
    { key: "decisionId", value: input.decisionId },
    { key: "endpointCode", value: endpointCode },
    { key: "actionType", value: actionType },
    { key: "pathwayRef", value: pathwayRef },
    { key: "tenantPolicyRef", value: matchedRule.tenantPolicyRef },
    { key: "riskBurdenClass", value: riskBurdenClass },
    { key: "assistiveProvenanceState", value: assistiveProvenanceState },
    { key: "sensitiveOverrideState", value: sensitiveOverrideState },
    { key: "matchedPolicyRuleRefs", value: matchedRule.ruleId },
    { key: "requiredApprovalMode", value: requiredApprovalMode },
  ]);
  return {
    actionType,
    approvalPolicyMatrixRef: phase3GovernedApprovalMatrixRef,
    tenantPolicyRef: matchedRule.tenantPolicyRef,
    pathwayRef,
    riskBurdenClass,
    assistiveProvenanceState,
    sensitiveOverrideState,
    matchedPolicyRuleRefs: [matchedRule.ruleId],
    requiredApprovalMode,
    checkpointState: requiredApprovalMode,
    reasonCodeRefs,
    approverRoleRefs: [...matchedRule.approverRoleRefs],
    tupleHash,
  };
}

function normalizeGovernedApprovalAssessment(
  input: GovernedApprovalRequirementAssessmentSnapshot,
): GovernedApprovalRequirementAssessmentSnapshot {
  invariant(
    approvalModes.includes(input.requiredApprovalMode),
    "INVALID_REQUIRED_APPROVAL_MODE",
    "Unsupported requiredApprovalMode.",
  );
  invariant(
    checkpointStates.includes(input.checkpointState),
    "INVALID_CHECKPOINT_STATE",
    "Unsupported checkpointState.",
  );
  invariant(
    riskBurdenClasses.includes(input.riskBurdenClass),
    "INVALID_RISK_BURDEN_CLASS",
    "Unsupported riskBurdenClass.",
  );
  invariant(
    assistiveProvenanceStates.includes(input.assistiveProvenanceState),
    "INVALID_ASSISTIVE_PROVENANCE_STATE",
    "Unsupported assistiveProvenanceState.",
  );
  invariant(
    sensitiveOverrideStates.includes(input.sensitiveOverrideState),
    "INVALID_SENSITIVE_OVERRIDE_STATE",
    "Unsupported sensitiveOverrideState.",
  );
  return {
    assessmentId: requireRef(input.assessmentId, "assessmentId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    endpointClass: requireRef(input.endpointClass, "endpointClass"),
    approvalPolicyMatrixRef: requireRef(input.approvalPolicyMatrixRef, "approvalPolicyMatrixRef"),
    tenantPolicyRef: requireRef(input.tenantPolicyRef, "tenantPolicyRef"),
    pathwayRef: requireRef(input.pathwayRef, "pathwayRef"),
    riskBurdenClass: input.riskBurdenClass,
    assistiveProvenanceState: input.assistiveProvenanceState,
    sensitiveOverrideState: input.sensitiveOverrideState,
    matchedPolicyRuleRefs: uniqueSorted(input.matchedPolicyRuleRefs),
    requiredApprovalMode: input.requiredApprovalMode,
    checkpointState: input.checkpointState,
    reasonCodeRefs: uniqueSorted(input.reasonCodeRefs),
    evaluatedAt: ensureIsoTimestamp(input.evaluatedAt, "evaluatedAt"),
    tupleHash: requireRef(input.tupleHash, "tupleHash"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeApprovalCheckpoint(input: ApprovalCheckpointSnapshot): ApprovalCheckpointSnapshot {
  invariant(
    approvalActionTypes.includes(input.actionType),
    "INVALID_APPROVAL_ACTION_TYPE",
    "Unsupported approval action type.",
  );
  invariant(
    checkpointStates.includes(input.state),
    "INVALID_APPROVAL_CHECKPOINT_STATE",
    "Unsupported approval checkpoint state.",
  );
  invariant(
    input.invalidationReasonClass === null ||
      invalidationReasonClasses.includes(input.invalidationReasonClass),
    "INVALID_INVALIDATION_REASON_CLASS",
    "Unsupported invalidation reason class.",
  );
  return {
    checkpointId: requireRef(input.checkpointId, "checkpointId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    decisionId: requireRef(input.decisionId, "decisionId"),
    actionType: input.actionType,
    state: input.state,
    approvalRequirementAssessmentRef: requireRef(
      input.approvalRequirementAssessmentRef,
      "approvalRequirementAssessmentRef",
    ),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    requestedBy: requireRef(input.requestedBy, "requestedBy"),
    requestedAt: ensureIsoTimestamp(input.requestedAt, "requestedAt"),
    approvedBy: optionalRef(input.approvedBy),
    approvedAt: optionalRef(input.approvedAt)
      ? ensureIsoTimestamp(input.approvedAt!, "approvedAt")
      : null,
    rejectedBy: optionalRef(input.rejectedBy),
    rejectedAt: optionalRef(input.rejectedAt)
      ? ensureIsoTimestamp(input.rejectedAt!, "rejectedAt")
      : null,
    rejectionReason: optionalRef(input.rejectionReason),
    invalidationReasonClass: input.invalidationReasonClass,
    supersedesCheckpointRef: optionalRef(input.supersedesCheckpointRef),
    supersededByCheckpointRef: optionalRef(input.supersededByCheckpointRef),
    lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
    leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
    leaseTtlSeconds: ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds"),
    lastHeartbeatAt: ensureIsoTimestamp(input.lastHeartbeatAt, "lastHeartbeatAt"),
    fencingToken: requireRef(input.fencingToken, "fencingToken"),
    ownershipEpoch: ensureNonNegativeInteger(input.ownershipEpoch, "ownershipEpoch"),
    currentLineageFenceEpoch: ensureNonNegativeInteger(
      input.currentLineageFenceEpoch,
      "currentLineageFenceEpoch",
    ),
    staleOwnerRecoveryRef: optionalRef(input.staleOwnerRecoveryRef),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeDutyEscalationRecord(
  input: DutyEscalationRecordSnapshot,
): DutyEscalationRecordSnapshot {
  invariant(
    escalationTriggerModes.includes(input.triggerMode),
    "INVALID_ESCALATION_TRIGGER_MODE",
    "Unsupported DutyEscalationRecord.triggerMode.",
  );
  invariant(
    escalationSeverityBands.includes(input.severityBand),
    "INVALID_ESCALATION_SEVERITY_BAND",
    "Unsupported DutyEscalationRecord.severityBand.",
  );
  invariant(
    escalationStates.includes(input.escalationState),
    "INVALID_ESCALATION_STATE",
    "Unsupported DutyEscalationRecord.escalationState.",
  );
  return {
    dutyEscalationRecordId: requireRef(input.dutyEscalationRecordId, "dutyEscalationRecordId"),
    taskId: requireRef(input.taskId, "taskId"),
    requestId: requireRef(input.requestId, "requestId"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    endpointDecisionRef: requireRef(input.endpointDecisionRef, "endpointDecisionRef"),
    decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
    triggerMode: input.triggerMode,
    triggerReasonCode: requireRef(input.triggerReasonCode, "triggerReasonCode"),
    severityBand: input.severityBand,
    urgentTaskRef: requireRef(input.urgentTaskRef, "urgentTaskRef"),
    currentUrgentContactAttemptRef: optionalRef(input.currentUrgentContactAttemptRef),
    currentUrgentEscalationOutcomeRef: optionalRef(input.currentUrgentEscalationOutcomeRef),
    escalationState: input.escalationState,
    openedAt: ensureIsoTimestamp(input.openedAt, "openedAt"),
    closedAt: optionalRef(input.closedAt) ? ensureIsoTimestamp(input.closedAt!, "closedAt") : null,
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeUrgentContactAttempt(
  input: UrgentContactAttemptSnapshot,
): UrgentContactAttemptSnapshot {
  invariant(
    contactRouteClasses.includes(input.contactRouteClass),
    "INVALID_CONTACT_ROUTE_CLASS",
    "Unsupported UrgentContactAttempt.contactRouteClass.",
  );
  invariant(
    contactAttemptStates.includes(input.attemptState),
    "INVALID_CONTACT_ATTEMPT_STATE",
    "Unsupported UrgentContactAttempt.attemptState.",
  );
  return {
    urgentContactAttemptId: requireRef(input.urgentContactAttemptId, "urgentContactAttemptId"),
    dutyEscalationRecordRef: requireRef(input.dutyEscalationRecordRef, "dutyEscalationRecordRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    attemptOrdinal: ensurePositiveInteger(input.attemptOrdinal, "attemptOrdinal"),
    attemptReplayKey: requireRef(input.attemptReplayKey, "attemptReplayKey"),
    contactRouteClass: input.contactRouteClass,
    attemptState: input.attemptState,
    attemptedAt: ensureIsoTimestamp(input.attemptedAt, "attemptedAt"),
    completedAt: optionalRef(input.completedAt)
      ? ensureIsoTimestamp(input.completedAt!, "completedAt")
      : null,
    outcomeNote: optionalRef(input.outcomeNote),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeUrgentEscalationOutcome(
  input: UrgentEscalationOutcomeSnapshot,
): UrgentEscalationOutcomeSnapshot {
  invariant(
    escalationOutcomeClasses.includes(input.outcomeClass),
    "INVALID_URGENT_ESCALATION_OUTCOME_CLASS",
    "Unsupported UrgentEscalationOutcome.outcomeClass.",
  );
  return {
    urgentEscalationOutcomeId: requireRef(input.urgentEscalationOutcomeId, "urgentEscalationOutcomeId"),
    dutyEscalationRecordRef: requireRef(input.dutyEscalationRecordRef, "dutyEscalationRecordRef"),
    decisionEpochRef: requireRef(input.decisionEpochRef, "decisionEpochRef"),
    outcomeClass: input.outcomeClass,
    endpointDecisionSettlementRef: optionalRef(input.endpointDecisionSettlementRef),
    bookingIntentRef: optionalRef(input.bookingIntentRef),
    pharmacyIntentRef: optionalRef(input.pharmacyIntentRef),
    triageReopenRecordRef: optionalRef(input.triageReopenRecordRef),
    presentationArtifactRef: optionalRef(input.presentationArtifactRef),
    recordedAt: ensureIsoTimestamp(input.recordedAt, "recordedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

function normalizeTriageReopenRecord(
  input: TriageReopenRecordSnapshot,
): TriageReopenRecordSnapshot {
  invariant(
    reopenSourceDomains.includes(input.sourceDomain),
    "INVALID_REOPEN_SOURCE_DOMAIN",
    "Unsupported TriageReopenRecord.sourceDomain.",
  );
  invariant(
    reopenByModes.includes(input.reopenedByMode),
    "INVALID_REOPENED_BY_MODE",
    "Unsupported TriageReopenRecord.reopenedByMode.",
  );
  return {
    reopenRecordId: requireRef(input.reopenRecordId, "reopenRecordId"),
    taskId: requireRef(input.taskId, "taskId"),
    sourceDomain: input.sourceDomain,
    reasonCode: requireRef(input.reasonCode, "reasonCode"),
    evidenceRefs: uniqueSorted(input.evidenceRefs),
    supersededDecisionEpochRef: requireRef(
      input.supersededDecisionEpochRef,
      "supersededDecisionEpochRef",
    ),
    decisionSupersessionRecordRef: requireRef(
      input.decisionSupersessionRecordRef,
      "decisionSupersessionRecordRef",
    ),
    priorityOverride: requireRef(input.priorityOverride, "priorityOverride"),
    reopenedByMode: input.reopenedByMode,
    reopenedAt: ensureIsoTimestamp(input.reopenedAt, "reopenedAt"),
    version: ensurePositiveInteger(input.version, "version"),
  };
}

export interface Phase3ApprovalEscalationRepositories {
  getApprovalAssessment(
    assessmentId: string,
  ): Promise<GovernedApprovalRequirementAssessmentSnapshot | null>;
  saveApprovalAssessment(
    assessment: GovernedApprovalRequirementAssessmentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listApprovalAssessmentsForTask(
    taskId: string,
  ): Promise<readonly GovernedApprovalRequirementAssessmentSnapshot[]>;

  getCheckpoint(checkpointId: string): Promise<ApprovalCheckpointSnapshot | null>;
  getCurrentCheckpointForTask(taskId: string): Promise<ApprovalCheckpointSnapshot | null>;
  saveCheckpoint(
    checkpoint: ApprovalCheckpointSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listCheckpointsForTask(taskId: string): Promise<readonly ApprovalCheckpointSnapshot[]>;

  getEscalation(escalationId: string): Promise<DutyEscalationRecordSnapshot | null>;
  getCurrentEscalationForTask(taskId: string): Promise<DutyEscalationRecordSnapshot | null>;
  saveEscalation(
    escalation: DutyEscalationRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listEscalationsForTask(taskId: string): Promise<readonly DutyEscalationRecordSnapshot[]>;

  getUrgentContactAttempt(attemptId: string): Promise<UrgentContactAttemptSnapshot | null>;
  findUrgentContactAttemptByReplayKey(
    escalationId: string,
    replayKey: string,
  ): Promise<UrgentContactAttemptSnapshot | null>;
  saveUrgentContactAttempt(
    attempt: UrgentContactAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listUrgentContactAttemptsForEscalation(
    escalationId: string,
  ): Promise<readonly UrgentContactAttemptSnapshot[]>;

  getUrgentEscalationOutcome(
    outcomeId: string,
  ): Promise<UrgentEscalationOutcomeSnapshot | null>;
  getLatestUrgentEscalationOutcomeForEscalation(
    escalationId: string,
  ): Promise<UrgentEscalationOutcomeSnapshot | null>;
  saveUrgentEscalationOutcome(
    outcome: UrgentEscalationOutcomeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listUrgentEscalationOutcomesForEscalation(
    escalationId: string,
  ): Promise<readonly UrgentEscalationOutcomeSnapshot[]>;

  getTriageReopenRecord(reopenRecordId: string): Promise<TriageReopenRecordSnapshot | null>;
  getLatestTriageReopenRecordForTask(taskId: string): Promise<TriageReopenRecordSnapshot | null>;
  saveTriageReopenRecord(
    record: TriageReopenRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void>;
  listTriageReopenRecordsForTask(taskId: string): Promise<readonly TriageReopenRecordSnapshot[]>;

  withTaskBoundary<T>(operation: () => Promise<T>): Promise<T>;
}

class InMemoryPhase3ApprovalEscalationStore
  implements Phase3ApprovalEscalationRepositories
{
  private readonly approvalAssessments = new Map<
    string,
    GovernedApprovalRequirementAssessmentSnapshot
  >();
  private readonly approvalAssessmentsByTask = new Map<string, string[]>();

  private readonly checkpoints = new Map<string, ApprovalCheckpointSnapshot>();
  private readonly checkpointsByTask = new Map<string, string[]>();
  private readonly currentCheckpointByTask = new Map<string, string>();

  private readonly escalations = new Map<string, DutyEscalationRecordSnapshot>();
  private readonly escalationsByTask = new Map<string, string[]>();
  private readonly currentEscalationByTask = new Map<string, string>();

  private readonly attempts = new Map<string, UrgentContactAttemptSnapshot>();
  private readonly attemptsByEscalation = new Map<string, string[]>();
  private readonly attemptReplayIndex = new Map<string, string>();

  private readonly outcomes = new Map<string, UrgentEscalationOutcomeSnapshot>();
  private readonly outcomesByEscalation = new Map<string, string[]>();

  private readonly reopenRecords = new Map<string, TriageReopenRecordSnapshot>();
  private readonly reopenRecordsByTask = new Map<string, string[]>();

  private boundaryQueue: Promise<void> = Promise.resolve();

  async withTaskBoundary<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.boundaryQueue;
    let release: () => void = () => undefined;
    this.boundaryQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async getApprovalAssessment(
    assessmentId: string,
  ): Promise<GovernedApprovalRequirementAssessmentSnapshot | null> {
    return this.approvalAssessments.get(assessmentId) ?? null;
  }

  async saveApprovalAssessment(
    assessment: GovernedApprovalRequirementAssessmentSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.approvalAssessments, assessment.assessmentId, assessment, options);
    const existing = this.approvalAssessmentsByTask.get(assessment.taskId) ?? [];
    if (!existing.includes(assessment.assessmentId)) {
      this.approvalAssessmentsByTask.set(assessment.taskId, [...existing, assessment.assessmentId]);
    }
  }

  async listApprovalAssessmentsForTask(
    taskId: string,
  ): Promise<readonly GovernedApprovalRequirementAssessmentSnapshot[]> {
    const ids = this.approvalAssessmentsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.approvalAssessments.get(id))
      .filter((entry): entry is GovernedApprovalRequirementAssessmentSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.evaluatedAt, right.evaluatedAt));
  }

  async getCheckpoint(checkpointId: string): Promise<ApprovalCheckpointSnapshot | null> {
    return this.checkpoints.get(checkpointId) ?? null;
  }

  async getCurrentCheckpointForTask(taskId: string): Promise<ApprovalCheckpointSnapshot | null> {
    const current = this.currentCheckpointByTask.get(taskId);
    return current ? (this.checkpoints.get(current) ?? null) : null;
  }

  async saveCheckpoint(
    checkpoint: ApprovalCheckpointSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.checkpoints, checkpoint.checkpointId, checkpoint, options);
    const existing = this.checkpointsByTask.get(checkpoint.taskId) ?? [];
    if (!existing.includes(checkpoint.checkpointId)) {
      this.checkpointsByTask.set(checkpoint.taskId, [...existing, checkpoint.checkpointId]);
    }
    if (checkpoint.state !== "superseded") {
      this.currentCheckpointByTask.set(checkpoint.taskId, checkpoint.checkpointId);
    } else if (this.currentCheckpointByTask.get(checkpoint.taskId) === checkpoint.checkpointId) {
      this.currentCheckpointByTask.delete(checkpoint.taskId);
    }
  }

  async listCheckpointsForTask(taskId: string): Promise<readonly ApprovalCheckpointSnapshot[]> {
    const ids = this.checkpointsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.checkpoints.get(id))
      .filter((entry): entry is ApprovalCheckpointSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.requestedAt, right.requestedAt));
  }

  async getEscalation(escalationId: string): Promise<DutyEscalationRecordSnapshot | null> {
    return this.escalations.get(escalationId) ?? null;
  }

  async getCurrentEscalationForTask(taskId: string): Promise<DutyEscalationRecordSnapshot | null> {
    const current = this.currentEscalationByTask.get(taskId);
    return current ? (this.escalations.get(current) ?? null) : null;
  }

  async saveEscalation(
    escalation: DutyEscalationRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.escalations, escalation.dutyEscalationRecordId, escalation, options);
    const existing = this.escalationsByTask.get(escalation.taskId) ?? [];
    if (!existing.includes(escalation.dutyEscalationRecordId)) {
      this.escalationsByTask.set(escalation.taskId, [...existing, escalation.dutyEscalationRecordId]);
    }
    if (
      escalation.escalationState === "active" ||
      escalation.escalationState === "contact_in_progress"
    ) {
      this.currentEscalationByTask.set(escalation.taskId, escalation.dutyEscalationRecordId);
    } else if (this.currentEscalationByTask.get(escalation.taskId) === escalation.dutyEscalationRecordId) {
      this.currentEscalationByTask.delete(escalation.taskId);
    }
  }

  async listEscalationsForTask(taskId: string): Promise<readonly DutyEscalationRecordSnapshot[]> {
    const ids = this.escalationsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.escalations.get(id))
      .filter((entry): entry is DutyEscalationRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.openedAt, right.openedAt));
  }

  async getUrgentContactAttempt(attemptId: string): Promise<UrgentContactAttemptSnapshot | null> {
    return this.attempts.get(attemptId) ?? null;
  }

  async findUrgentContactAttemptByReplayKey(
    escalationId: string,
    replayKey: string,
  ): Promise<UrgentContactAttemptSnapshot | null> {
    const attemptId = this.attemptReplayIndex.get(`${escalationId}::${replayKey}`);
    return attemptId ? (this.attempts.get(attemptId) ?? null) : null;
  }

  async saveUrgentContactAttempt(
    attempt: UrgentContactAttemptSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.attempts, attempt.urgentContactAttemptId, attempt, options);
    const existing = this.attemptsByEscalation.get(attempt.dutyEscalationRecordRef) ?? [];
    if (!existing.includes(attempt.urgentContactAttemptId)) {
      this.attemptsByEscalation.set(attempt.dutyEscalationRecordRef, [
        ...existing,
        attempt.urgentContactAttemptId,
      ]);
    }
    this.attemptReplayIndex.set(
      `${attempt.dutyEscalationRecordRef}::${attempt.attemptReplayKey}`,
      attempt.urgentContactAttemptId,
    );
  }

  async listUrgentContactAttemptsForEscalation(
    escalationId: string,
  ): Promise<readonly UrgentContactAttemptSnapshot[]> {
    const ids = this.attemptsByEscalation.get(escalationId) ?? [];
    return ids
      .map((id) => this.attempts.get(id))
      .filter((entry): entry is UrgentContactAttemptSnapshot => entry !== undefined)
      .sort((left, right) => left.attemptOrdinal - right.attemptOrdinal);
  }

  async getUrgentEscalationOutcome(
    outcomeId: string,
  ): Promise<UrgentEscalationOutcomeSnapshot | null> {
    return this.outcomes.get(outcomeId) ?? null;
  }

  async getLatestUrgentEscalationOutcomeForEscalation(
    escalationId: string,
  ): Promise<UrgentEscalationOutcomeSnapshot | null> {
    const ids = this.outcomesByEscalation.get(escalationId) ?? [];
    const latest = ids.at(-1);
    return latest ? (this.outcomes.get(latest) ?? null) : null;
  }

  async saveUrgentEscalationOutcome(
    outcome: UrgentEscalationOutcomeSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.outcomes, outcome.urgentEscalationOutcomeId, outcome, options);
    const existing = this.outcomesByEscalation.get(outcome.dutyEscalationRecordRef) ?? [];
    if (!existing.includes(outcome.urgentEscalationOutcomeId)) {
      this.outcomesByEscalation.set(outcome.dutyEscalationRecordRef, [
        ...existing,
        outcome.urgentEscalationOutcomeId,
      ]);
    }
  }

  async listUrgentEscalationOutcomesForEscalation(
    escalationId: string,
  ): Promise<readonly UrgentEscalationOutcomeSnapshot[]> {
    const ids = this.outcomesByEscalation.get(escalationId) ?? [];
    return ids
      .map((id) => this.outcomes.get(id))
      .filter((entry): entry is UrgentEscalationOutcomeSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.recordedAt, right.recordedAt));
  }

  async getTriageReopenRecord(reopenRecordId: string): Promise<TriageReopenRecordSnapshot | null> {
    return this.reopenRecords.get(reopenRecordId) ?? null;
  }

  async getLatestTriageReopenRecordForTask(taskId: string): Promise<TriageReopenRecordSnapshot | null> {
    const ids = this.reopenRecordsByTask.get(taskId) ?? [];
    const latest = ids.at(-1);
    return latest ? (this.reopenRecords.get(latest) ?? null) : null;
  }

  async saveTriageReopenRecord(
    record: TriageReopenRecordSnapshot,
    options?: CompareAndSetWriteOptions,
  ): Promise<void> {
    saveWithCas(this.reopenRecords, record.reopenRecordId, record, options);
    const existing = this.reopenRecordsByTask.get(record.taskId) ?? [];
    if (!existing.includes(record.reopenRecordId)) {
      this.reopenRecordsByTask.set(record.taskId, [...existing, record.reopenRecordId]);
    }
  }

  async listTriageReopenRecordsForTask(
    taskId: string,
  ): Promise<readonly TriageReopenRecordSnapshot[]> {
    const ids = this.reopenRecordsByTask.get(taskId) ?? [];
    return ids
      .map((id) => this.reopenRecords.get(id))
      .filter((entry): entry is TriageReopenRecordSnapshot => entry !== undefined)
      .sort((left, right) => compareIso(left.reopenedAt, right.reopenedAt));
  }
}

export function createPhase3ApprovalEscalationKernelStore(): Phase3ApprovalEscalationRepositories {
  return new InMemoryPhase3ApprovalEscalationStore();
}

export interface EvaluateApprovalCheckpointInput {
  assessment: GovernedApprovalRequirementAssessmentSnapshot;
  checkpointId: string;
  actionType: Phase3ApprovalActionType;
  requestedBy: string;
  requestedAt: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
  lastHeartbeatAt: string;
  fencingToken: string;
  ownershipEpoch: number;
  currentLineageFenceEpoch: number;
  staleOwnerRecoveryRef?: string | null;
  decisionSupersessionRecordRef?: string | null;
}

export interface RequestApprovalCheckpointInput {
  checkpointId: string;
  requestedBy: string;
  requestedAt: string;
}

export interface ApproveCheckpointInput {
  checkpointId: string;
  approvedBy: string;
  approvedAt: string;
  presentedRoleRefs: readonly string[];
}

export interface RejectCheckpointInput {
  checkpointId: string;
  rejectedBy: string;
  rejectedAt: string;
  rejectionReason: string;
}

export interface InvalidateCheckpointInput {
  checkpointId: string;
  invalidationReasonClass: ApprovalInvalidationReasonClass;
  invalidatedAt: string;
  decisionSupersessionRecordRef?: string | null;
  supersededByCheckpointRef?: string | null;
}

export interface StartUrgentEscalationInput {
  taskId: string;
  requestId: string;
  decisionEpochRef: string;
  endpointDecisionRef: string;
  triggerMode: DutyEscalationTriggerMode;
  triggerReasonCode: string;
  severityBand: DutyEscalationSeverityBand;
  urgentTaskRef: string;
  openedAt: string;
}

export interface RecordUrgentContactAttemptInput {
  escalationId: string;
  decisionEpochRef: string;
  attemptReplayKey: string;
  contactRouteClass: UrgentContactRouteClass;
  attemptState: UrgentContactAttemptState;
  attemptedAt: string;
  completedAt?: string | null;
  outcomeNote?: string | null;
}

export interface RecordUrgentOutcomeInput {
  escalationId: string;
  decisionEpochRef: string;
  outcomeClass: UrgentEscalationOutcomeClass;
  endpointDecisionSettlementRef?: string | null;
  bookingIntentRef?: string | null;
  pharmacyIntentRef?: string | null;
  triageReopenRecord?: TriageReopenRecordSnapshot | null;
  presentationArtifactRef?: string | null;
  recordedAt: string;
}

export interface CancelUrgentEscalationInput {
  escalationId: string;
  decisionSupersessionRecordRef: string;
  cancelledAt: string;
  cancellationState: "cancelled" | "expired";
}

export interface Phase3ApprovalEscalationKernelService {
  queryTaskBundle(taskId: string): Promise<Phase3ApprovalEscalationBundle>;
  evaluateApprovalRequirement(
    input: EvaluateApprovalCheckpointInput,
  ): Promise<{
    assessment: GovernedApprovalRequirementAssessmentSnapshot;
    checkpoint: ApprovalCheckpointSnapshot;
    supersededCheckpoint: ApprovalCheckpointSnapshot | null;
  }>;
  requestApproval(
    input: RequestApprovalCheckpointInput,
  ): Promise<ApprovalCheckpointSnapshot>;
  approveCheckpoint(
    input: ApproveCheckpointInput,
  ): Promise<ApprovalCheckpointSnapshot>;
  rejectCheckpoint(
    input: RejectCheckpointInput,
  ): Promise<ApprovalCheckpointSnapshot>;
  invalidateCheckpoint(
    input: InvalidateCheckpointInput,
  ): Promise<ApprovalCheckpointSnapshot>;
  startUrgentEscalation(
    input: StartUrgentEscalationInput,
  ): Promise<DutyEscalationRecordSnapshot>;
  recordUrgentContactAttempt(
    input: RecordUrgentContactAttemptInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    attempt: UrgentContactAttemptSnapshot;
  }>;
  recordUrgentOutcome(
    input: RecordUrgentOutcomeInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    outcome: UrgentEscalationOutcomeSnapshot;
    reopenRecord: TriageReopenRecordSnapshot | null;
  }>;
  cancelUrgentEscalation(
    input: CancelUrgentEscalationInput,
  ): Promise<DutyEscalationRecordSnapshot>;
}

class Phase3ApprovalEscalationKernelServiceImpl
  implements Phase3ApprovalEscalationKernelService
{
  constructor(
    private readonly repositories: Phase3ApprovalEscalationRepositories,
    private readonly idGenerator: BackboneIdGenerator,
  ) {}

  async queryTaskBundle(taskId: string): Promise<Phase3ApprovalEscalationBundle> {
    const checkpoint = await this.repositories.getCurrentCheckpointForTask(taskId);
    const approvalAssessment = checkpoint
      ? await this.repositories.getApprovalAssessment(checkpoint.approvalRequirementAssessmentRef)
      : null;
    const escalation =
      (await this.repositories.getCurrentEscalationForTask(taskId)) ??
      (await this.repositories.listEscalationsForTask(taskId)).at(-1) ??
      null;
    const attempts = escalation
      ? await this.repositories.listUrgentContactAttemptsForEscalation(
          escalation.dutyEscalationRecordId,
        )
      : [];
    const outcome = escalation
      ? await this.repositories.getLatestUrgentEscalationOutcomeForEscalation(
          escalation.dutyEscalationRecordId,
        )
      : null;
    const reopenRecord = await this.repositories.getLatestTriageReopenRecordForTask(taskId);
    return {
      approvalAssessment,
      checkpoint,
      escalation,
      attempts,
      outcome,
      reopenRecord,
    };
  }

  async evaluateApprovalRequirement(
    input: EvaluateApprovalCheckpointInput,
  ): Promise<{
    assessment: GovernedApprovalRequirementAssessmentSnapshot;
    checkpoint: ApprovalCheckpointSnapshot;
    supersededCheckpoint: ApprovalCheckpointSnapshot | null;
  }> {
    return this.repositories.withTaskBoundary(async () => {
      const assessment = normalizeGovernedApprovalAssessment(input.assessment);
      const currentCheckpoint = await this.repositories.getCurrentCheckpointForTask(assessment.taskId);
      const currentAssessment =
        currentCheckpoint &&
        (await this.repositories.getApprovalAssessment(currentCheckpoint.approvalRequirementAssessmentRef));

      if (
        currentCheckpoint &&
        currentAssessment &&
        currentCheckpoint.decisionEpochRef === assessment.decisionEpochRef &&
        currentCheckpoint.actionType === input.actionType &&
        currentAssessment.tupleHash === assessment.tupleHash
      ) {
        if (currentAssessment.version !== assessment.version) {
          await this.repositories.saveApprovalAssessment(assessment, {
            expectedVersion: currentAssessment.version,
          });
        }
        return {
          assessment,
          checkpoint: currentCheckpoint,
          supersededCheckpoint: null,
        };
      }

      await this.repositories.saveApprovalAssessment(assessment);

      let supersededCheckpoint: ApprovalCheckpointSnapshot | null = null;
      if (currentCheckpoint && currentCheckpoint.state !== "superseded") {
        supersededCheckpoint = normalizeApprovalCheckpoint({
          ...currentCheckpoint,
          state: "superseded",
          invalidationReasonClass:
            currentCheckpoint.decisionEpochRef === assessment.decisionEpochRef
              ? "payload_changed"
              : "epoch_superseded",
          decisionSupersessionRecordRef:
            optionalRef(input.decisionSupersessionRecordRef) ??
            currentCheckpoint.decisionSupersessionRecordRef,
          supersededByCheckpointRef: input.checkpointId,
          version: nextVersion(currentCheckpoint.version),
        });
        await this.repositories.saveCheckpoint(supersededCheckpoint, {
          expectedVersion: currentCheckpoint.version,
        });
      }

      const checkpoint = normalizeApprovalCheckpoint({
        checkpointId: input.checkpointId,
        taskId: assessment.taskId,
        requestId: assessment.requestId,
        decisionEpochRef: assessment.decisionEpochRef,
        decisionId: assessment.decisionId,
        actionType: normalizeApprovalActionType(input.actionType),
        state: normalizeApprovalCheckpointState(assessment.checkpointState),
        approvalRequirementAssessmentRef: assessment.assessmentId,
        decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
        requestedBy: requireRef(input.requestedBy, "requestedBy"),
        requestedAt: ensureIsoTimestamp(input.requestedAt, "requestedAt"),
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        invalidationReasonClass: null,
        supersedesCheckpointRef: supersededCheckpoint?.checkpointId ?? null,
        supersededByCheckpointRef: null,
        lifecycleLeaseRef: requireRef(input.lifecycleLeaseRef, "lifecycleLeaseRef"),
        leaseAuthorityRef: requireRef(input.leaseAuthorityRef, "leaseAuthorityRef"),
        leaseTtlSeconds: ensurePositiveInteger(input.leaseTtlSeconds, "leaseTtlSeconds"),
        lastHeartbeatAt: ensureIsoTimestamp(input.lastHeartbeatAt, "lastHeartbeatAt"),
        fencingToken: requireRef(input.fencingToken, "fencingToken"),
        ownershipEpoch: ensureNonNegativeInteger(input.ownershipEpoch, "ownershipEpoch"),
        currentLineageFenceEpoch: ensureNonNegativeInteger(
          input.currentLineageFenceEpoch,
          "currentLineageFenceEpoch",
        ),
        staleOwnerRecoveryRef: optionalRef(input.staleOwnerRecoveryRef),
        version: 1,
      });
      await this.repositories.saveCheckpoint(checkpoint);

      return {
        assessment,
        checkpoint,
        supersededCheckpoint,
      };
    });
  }

  async requestApproval(input: RequestApprovalCheckpointInput): Promise<ApprovalCheckpointSnapshot> {
    return this.repositories.withTaskBoundary(async () => {
      const checkpoint = await this.requireCheckpoint(input.checkpointId);
      invariant(
        checkpoint.state === "required" || checkpoint.state === "rejected",
        "APPROVAL_REQUEST_NOT_ALLOWED",
        "Approval may only be requested from required or rejected state.",
      );
      const updated = normalizeApprovalCheckpoint({
        ...checkpoint,
        state: "pending",
        requestedBy: requireRef(input.requestedBy, "requestedBy"),
        requestedAt: ensureIsoTimestamp(input.requestedAt, "requestedAt"),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        approvedBy: null,
        approvedAt: null,
        version: nextVersion(checkpoint.version),
      });
      await this.repositories.saveCheckpoint(updated, { expectedVersion: checkpoint.version });
      await this.updateAssessmentCheckpointState(updated.approvalRequirementAssessmentRef, "pending");
      return updated;
    });
  }

  async approveCheckpoint(input: ApproveCheckpointInput): Promise<ApprovalCheckpointSnapshot> {
    return this.repositories.withTaskBoundary(async () => {
      const checkpoint = await this.requireCheckpoint(input.checkpointId);
      invariant(
        checkpoint.state === "pending" || checkpoint.state === "required",
        "APPROVAL_NOT_PENDING",
        "Checkpoint must be pending or required before approval.",
      );
      invariant(
        checkpoint.requestedBy !== input.approvedBy,
        "SELF_APPROVAL_BLOCKED",
        "Approval must be performed by a different actor than the requester.",
      );
      const assessment = await this.requireAssessment(checkpoint.approvalRequirementAssessmentRef);
      const requiredRoleRefs = this.requiredApproverRoleRefs(assessment);
      invariant(
        requiredRoleRefs.every((roleRef) => input.presentedRoleRefs.includes(roleRef)) ||
          requiredRoleRefs.some((roleRef) => input.presentedRoleRefs.includes(roleRef)),
        "APPROVER_ROLE_REQUIRED",
        "Approval requires one presented approver role from the current matched policy rule.",
      );
      const updated = normalizeApprovalCheckpoint({
        ...checkpoint,
        state: "approved",
        approvedBy: requireRef(input.approvedBy, "approvedBy"),
        approvedAt: ensureIsoTimestamp(input.approvedAt, "approvedAt"),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        version: nextVersion(checkpoint.version),
      });
      await this.repositories.saveCheckpoint(updated, { expectedVersion: checkpoint.version });
      await this.updateAssessmentCheckpointState(updated.approvalRequirementAssessmentRef, "approved");
      return updated;
    });
  }

  async rejectCheckpoint(input: RejectCheckpointInput): Promise<ApprovalCheckpointSnapshot> {
    return this.repositories.withTaskBoundary(async () => {
      const checkpoint = await this.requireCheckpoint(input.checkpointId);
      invariant(
        checkpoint.state === "pending" || checkpoint.state === "required",
        "REJECTION_NOT_ALLOWED",
        "Checkpoint must be pending or required before rejection.",
      );
      const updated = normalizeApprovalCheckpoint({
        ...checkpoint,
        state: "rejected",
        rejectedBy: requireRef(input.rejectedBy, "rejectedBy"),
        rejectedAt: ensureIsoTimestamp(input.rejectedAt, "rejectedAt"),
        rejectionReason: requireRef(input.rejectionReason, "rejectionReason"),
        approvedBy: null,
        approvedAt: null,
        version: nextVersion(checkpoint.version),
      });
      await this.repositories.saveCheckpoint(updated, { expectedVersion: checkpoint.version });
      await this.updateAssessmentCheckpointState(updated.approvalRequirementAssessmentRef, "rejected");
      return updated;
    });
  }

  async invalidateCheckpoint(input: InvalidateCheckpointInput): Promise<ApprovalCheckpointSnapshot> {
    return this.repositories.withTaskBoundary(async () => {
      const checkpoint = await this.requireCheckpoint(input.checkpointId);
      invariant(
        checkpoint.state !== "superseded",
        "CHECKPOINT_ALREADY_SUPERSEDED",
        "Checkpoint is already superseded.",
      );
      const updated = normalizeApprovalCheckpoint({
        ...checkpoint,
        state: "superseded",
        invalidationReasonClass: input.invalidationReasonClass,
        decisionSupersessionRecordRef: optionalRef(input.decisionSupersessionRecordRef),
        supersededByCheckpointRef: optionalRef(input.supersededByCheckpointRef),
        version: nextVersion(checkpoint.version),
      });
      await this.repositories.saveCheckpoint(updated, { expectedVersion: checkpoint.version });
      await this.updateAssessmentCheckpointState(updated.approvalRequirementAssessmentRef, "superseded");
      return updated;
    });
  }

  async startUrgentEscalation(
    input: StartUrgentEscalationInput,
  ): Promise<DutyEscalationRecordSnapshot> {
    return this.repositories.withTaskBoundary(async () => {
      const current = await this.repositories.getCurrentEscalationForTask(input.taskId);
      if (
        current &&
        current.decisionEpochRef === input.decisionEpochRef &&
        current.triggerMode === input.triggerMode &&
        current.triggerReasonCode === input.triggerReasonCode
      ) {
        return current;
      }
      invariant(
        !current,
        "ESCALATION_ALREADY_ACTIVE",
        "A task may not hold two active urgent escalation records.",
      );
      const escalation = normalizeDutyEscalationRecord({
        dutyEscalationRecordId: nextKernelId(this.idGenerator, "phase3_duty_escalation_record"),
        taskId: input.taskId,
        requestId: input.requestId,
        decisionEpochRef: input.decisionEpochRef,
        endpointDecisionRef: input.endpointDecisionRef,
        decisionSupersessionRecordRef: null,
        triggerMode: input.triggerMode,
        triggerReasonCode: input.triggerReasonCode,
        severityBand: input.severityBand,
        urgentTaskRef: input.urgentTaskRef,
        currentUrgentContactAttemptRef: null,
        currentUrgentEscalationOutcomeRef: null,
        escalationState: "active",
        openedAt: input.openedAt,
        closedAt: null,
        version: 1,
      });
      await this.repositories.saveEscalation(escalation);
      return escalation;
    });
  }

  async recordUrgentContactAttempt(
    input: RecordUrgentContactAttemptInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    attempt: UrgentContactAttemptSnapshot;
  }> {
    return this.repositories.withTaskBoundary(async () => {
      const escalation = await this.requireEscalation(input.escalationId);
      invariant(
        escalation.decisionEpochRef === input.decisionEpochRef,
        "STALE_ESCALATION_EPOCH",
        "Urgent contact attempts must bind to the current escalation epoch.",
      );
      invariant(
        escalation.escalationState === "active" ||
          escalation.escalationState === "contact_in_progress",
        "ESCALATION_NOT_ACTIVE",
        "Urgent contact attempts require an active escalation record.",
      );
      const existing = await this.repositories.findUrgentContactAttemptByReplayKey(
        escalation.dutyEscalationRecordId,
        input.attemptReplayKey,
      );
      if (existing) {
        return {
          escalation,
          attempt: existing,
        };
      }
      const priorAttempts = await this.repositories.listUrgentContactAttemptsForEscalation(
        escalation.dutyEscalationRecordId,
      );
      const attempt = normalizeUrgentContactAttempt({
        urgentContactAttemptId: nextKernelId(this.idGenerator, "phase3_urgent_contact_attempt"),
        dutyEscalationRecordRef: escalation.dutyEscalationRecordId,
        decisionEpochRef: input.decisionEpochRef,
        attemptOrdinal: priorAttempts.length + 1,
        attemptReplayKey: requireRef(input.attemptReplayKey, "attemptReplayKey"),
        contactRouteClass: input.contactRouteClass,
        attemptState: input.attemptState,
        attemptedAt: input.attemptedAt,
        completedAt: optionalRef(input.completedAt),
        outcomeNote: optionalRef(input.outcomeNote),
        version: 1,
      });
      await this.repositories.saveUrgentContactAttempt(attempt);
      const updatedEscalation = normalizeDutyEscalationRecord({
        ...escalation,
        currentUrgentContactAttemptRef: attempt.urgentContactAttemptId,
        escalationState: "contact_in_progress",
        version: nextVersion(escalation.version),
      });
      await this.repositories.saveEscalation(updatedEscalation, { expectedVersion: escalation.version });
      return {
        escalation: updatedEscalation,
        attempt,
      };
    });
  }

  async recordUrgentOutcome(
    input: RecordUrgentOutcomeInput,
  ): Promise<{
    escalation: DutyEscalationRecordSnapshot;
    outcome: UrgentEscalationOutcomeSnapshot;
    reopenRecord: TriageReopenRecordSnapshot | null;
  }> {
    return this.repositories.withTaskBoundary(async () => {
      const escalation = await this.requireEscalation(input.escalationId);
      invariant(
        escalation.decisionEpochRef === input.decisionEpochRef,
        "STALE_ESCALATION_EPOCH",
        "Urgent outcomes must bind to the current escalation epoch.",
      );
      const existingOutcome = await this.repositories.getLatestUrgentEscalationOutcomeForEscalation(
        escalation.dutyEscalationRecordId,
      );
      if (existingOutcome && existingOutcome.outcomeClass === input.outcomeClass) {
        return {
          escalation,
          outcome: existingOutcome,
          reopenRecord: existingOutcome.triageReopenRecordRef
            ? await this.repositories.getTriageReopenRecord(existingOutcome.triageReopenRecordRef)
            : null,
        };
      }
      const reopenRecord =
        input.outcomeClass === "return_to_triage" && input.triageReopenRecord
          ? normalizeTriageReopenRecord(input.triageReopenRecord)
          : null;
      if (reopenRecord) {
        await this.repositories.saveTriageReopenRecord(reopenRecord);
      }
      const outcome = normalizeUrgentEscalationOutcome({
        urgentEscalationOutcomeId: nextKernelId(this.idGenerator, "phase3_urgent_escalation_outcome"),
        dutyEscalationRecordRef: escalation.dutyEscalationRecordId,
        decisionEpochRef: input.decisionEpochRef,
        outcomeClass: input.outcomeClass,
        endpointDecisionSettlementRef: optionalRef(input.endpointDecisionSettlementRef),
        bookingIntentRef: optionalRef(input.bookingIntentRef),
        pharmacyIntentRef: optionalRef(input.pharmacyIntentRef),
        triageReopenRecordRef: reopenRecord?.reopenRecordId ?? null,
        presentationArtifactRef: optionalRef(input.presentationArtifactRef),
        recordedAt: input.recordedAt,
        version: 1,
      });
      await this.repositories.saveUrgentEscalationOutcome(outcome);
      const nextState: DutyEscalationState =
        input.outcomeClass === "direct_non_appointment"
          ? "direct_outcome_recorded"
          : input.outcomeClass === "downstream_handoff"
            ? "handoff_pending"
            : input.outcomeClass === "return_to_triage"
              ? "returned_to_triage"
              : input.outcomeClass;
      const updatedEscalation = normalizeDutyEscalationRecord({
        ...escalation,
        currentUrgentEscalationOutcomeRef: outcome.urgentEscalationOutcomeId,
        escalationState: nextState,
        closedAt: input.recordedAt,
        version: nextVersion(escalation.version),
      });
      await this.repositories.saveEscalation(updatedEscalation, { expectedVersion: escalation.version });
      return {
        escalation: updatedEscalation,
        outcome,
        reopenRecord,
      };
    });
  }

  async cancelUrgentEscalation(
    input: CancelUrgentEscalationInput,
  ): Promise<DutyEscalationRecordSnapshot> {
    return this.repositories.withTaskBoundary(async () => {
      const escalation = await this.requireEscalation(input.escalationId);
      invariant(
        escalation.escalationState === "active" ||
          escalation.escalationState === "contact_in_progress",
        "ESCALATION_NOT_CANCELLABLE",
        "Only active escalations may be cancelled or expired.",
      );
      const updated = normalizeDutyEscalationRecord({
        ...escalation,
        decisionSupersessionRecordRef: requireRef(
          input.decisionSupersessionRecordRef,
          "decisionSupersessionRecordRef",
        ),
        escalationState: input.cancellationState,
        closedAt: ensureIsoTimestamp(input.cancelledAt, "cancelledAt"),
        version: nextVersion(escalation.version),
      });
      await this.repositories.saveEscalation(updated, { expectedVersion: escalation.version });
      return updated;
    });
  }

  private async requireCheckpoint(checkpointId: string): Promise<ApprovalCheckpointSnapshot> {
    const checkpoint = await this.repositories.getCheckpoint(checkpointId);
    invariant(checkpoint, "APPROVAL_CHECKPOINT_NOT_FOUND", `ApprovalCheckpoint ${checkpointId} is required.`);
    return checkpoint;
  }

  private async requireAssessment(
    assessmentId: string,
  ): Promise<GovernedApprovalRequirementAssessmentSnapshot> {
    const assessment = await this.repositories.getApprovalAssessment(assessmentId);
    invariant(
      assessment,
      "APPROVAL_REQUIREMENT_ASSESSMENT_NOT_FOUND",
      `GovernedApprovalRequirementAssessment ${assessmentId} is required.`,
    );
    return assessment;
  }

  private async requireEscalation(
    escalationId: string,
  ): Promise<DutyEscalationRecordSnapshot> {
    const escalation = await this.repositories.getEscalation(escalationId);
    invariant(
      escalation,
      "DUTY_ESCALATION_RECORD_NOT_FOUND",
      `DutyEscalationRecord ${escalationId} is required.`,
    );
    return escalation;
  }

  private requiredApproverRoleRefs(
    assessment: GovernedApprovalRequirementAssessmentSnapshot,
  ): readonly string[] {
    const ruleId = assessment.matchedPolicyRuleRefs[0];
    const rule = approvalPolicyRules.find((entry) => entry.ruleId === ruleId) ?? defaultApprovalPolicies[assessment.endpointClass];
    return rule?.approverRoleRefs ?? [];
  }

  private async updateAssessmentCheckpointState(
    assessmentId: string,
    checkpointState: ApprovalCheckpointState,
  ): Promise<void> {
    const assessment = await this.requireAssessment(assessmentId);
    const updated = normalizeGovernedApprovalAssessment({
      ...assessment,
      checkpointState,
      version: nextVersion(assessment.version),
    });
    await this.repositories.saveApprovalAssessment(updated, {
      expectedVersion: assessment.version,
    });
  }
}

export function createPhase3ApprovalEscalationKernelService(
  repositories: Phase3ApprovalEscalationRepositories,
  options?: { idGenerator?: BackboneIdGenerator },
): Phase3ApprovalEscalationKernelService {
  return new Phase3ApprovalEscalationKernelServiceImpl(
    repositories,
    options?.idGenerator ?? createDeterministicBackboneIdGenerator("phase3_approval_escalation_kernel"),
  );
}
