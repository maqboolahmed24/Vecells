import {
  controlPlaneField,
  digestForTelemetry,
  maskedContactField,
  maskedRouteField,
  mintEdgeCorrelation,
  phiReferenceField,
  publicDescriptor,
  summarizeDisclosureFence,
  type CorrelationReplayState,
  type TelemetryDisclosureClass,
  type TelemetrySafeField,
} from "@vecells/observability";
import { staffCases } from "./workspace-shell.data";

export const CLINICAL_BETA_VALIDATION_VISUAL_MODE = "Clinical_Beta_Validation_Deck";
export const CLINICAL_BETA_VALIDATION_FEATURE_FLAG = "phase3_internal_validation";
export const WORKSPACE_SUPPORT_OBSERVABILITY_STORAGE_KEY =
  "vecells.phase3.workspace_support_observability";
export const WORKSPACE_SUPPORT_OBSERVABILITY_CHANGE_EVENT =
  "vecells-observability-change";

export type RuntimeValidationScenario =
  | "live"
  | "stale_review"
  | "read_only"
  | "recovery_only"
  | "blocked";
export type ValidationRouteFamilyRef =
  | "rf_staff_workspace"
  | "rf_staff_workspace_child"
  | "rf_support_ticket_workspace";
export type ValidationActionFamily =
  | "claim"
  | "release"
  | "start_review"
  | "request_more_info"
  | "approve"
  | "escalate"
  | "reopen"
  | "close"
  | "stale_recovery"
  | "handoff"
  | "support_replay"
  | "support_restore"
  | "knowledge_reveal"
  | "history_reveal"
  | "callback_action"
  | "message_action"
  | "self_care_action"
  | "admin_resolution_action";
export type ValidationEventClass =
  | "shell"
  | "continuity"
  | "transition"
  | "projection"
  | "queue"
  | "anchor"
  | "side_stage"
  | "live"
  | "announcement"
  | "motion"
  | "review"
  | "recovery";
export type ValidationEventState =
  | "provisional"
  | "authoritative"
  | "buffered"
  | "resolved"
  | "failed";
export type ValidationDisclosureClass =
  | "descriptor_and_hash_only"
  | "masked_scope_and_refs_only";
export type ValidationPublicationPosture =
  | "live"
  | "projection_visible"
  | "recovery_only"
  | "blocked";
export type ValidationRecoveryPosture =
  | "none"
  | "stale_recoverable"
  | "recovery_required"
  | "read_only_fallback"
  | "blocked";
export type ValidationLocalAckState = "none" | "shown" | "buffered" | "restored";
export type ValidationProcessingAcceptanceState =
  | "not_started"
  | "accepted_for_processing"
  | "awaiting_external_confirmation"
  | "externally_accepted"
  | "externally_rejected";
export type ValidationExternalObservationState =
  | "unobserved"
  | "projection_visible"
  | "recovery_only"
  | "blocked";
export type ValidationAuthoritativeSource =
  | "not_yet_authoritative"
  | "projection_visible"
  | "recovery_disposition";
export type ValidationAuthoritativeOutcomeState =
  | "pending"
  | "review_required"
  | "recovery_required"
  | "settled"
  | "failed"
  | "expired";
export type ValidationSettlementState =
  | "provisional"
  | "accepted"
  | "authoritative"
  | "reverted"
  | "disputed"
  | "expired";
export type ValidationFenceState = "enforced" | "blocked" | "mismatched";
export type ValidationInteractionMode = "pointer" | "keyboard" | "system";

export interface UIEventEnvelope {
  uiEventId: string;
  eventName: string;
  actionFamily: ValidationActionFamily;
  contractVersionRef: string;
  eventVersion: string;
  continuityKey: string;
  continuityFrameRef: string;
  routeFamilyRef: ValidationRouteFamilyRef;
  routeIntentRef: string;
  canonicalObjectDescriptorRef: string;
  canonicalEntityRef: string;
  shellInstanceRef: string;
  surfaceRef: string;
  audienceTier: "staff" | "support";
  channelContextRef: string;
  eventClass: ValidationEventClass;
  eventState: ValidationEventState;
  occurredAt: string;
  correlationId: string;
  edgeCorrelationId: string;
  actionRecordRef: string | null;
  commandSettlementRef: string | null;
  projectionVisibilityRef: string | null;
  selectedAnchorRef: string;
  shellDecisionClass:
    | "created"
    | "reused"
    | "restored"
    | "recovered"
    | "replaced"
    | "frozen";
  auditRecordRef: string | null;
  disclosureClass: ValidationDisclosureClass;
  publicationPosture: ValidationPublicationPosture;
  recoveryPosture: ValidationRecoveryPosture;
  redactionPosture: "verified" | "masked" | "blocked";
  automationAnchorRef: string;
  semanticCoverageRef: string;
  routeScopeHash: string;
  releaseTupleRef: string;
  evidenceLinkPath: string;
  interactionMode: ValidationInteractionMode;
}

export interface UITransitionSettlementRecord {
  uiTransitionSettlementRecordId: string;
  uiEventRef: string;
  continuityFrameRef: string;
  edgeCorrelationId: string;
  actionRecordRef: string | null;
  commandSettlementRef: string | null;
  localAckState: ValidationLocalAckState;
  processingAcceptanceState: ValidationProcessingAcceptanceState;
  externalObservationState: ValidationExternalObservationState;
  projectionVisibilityState: "unseen" | "visible" | "stale" | "superseded";
  projectionVisibilityRef: string | null;
  authoritativeSource: ValidationAuthoritativeSource;
  authoritativeOutcomeState: ValidationAuthoritativeOutcomeState;
  settlementState: ValidationSettlementState;
  settlementRevision: number;
  settledAt: string;
}

export interface UITelemetryDisclosureFence {
  uiTelemetryDisclosureFenceId: string;
  uiEventRef: string;
  edgeCorrelationId: string;
  routeIntentRef: string;
  audienceTier: "staff" | "support";
  routeSensitivity: ValidationDisclosureClass;
  allowedIdentifierClass: ValidationDisclosureClass;
  allowedPayloadClass: ValidationDisclosureClass;
  allowedFieldRefs: readonly string[];
  safeDescriptorHash: string;
  safeRouteScopeHash: string;
  redactionPolicyRef: string;
  maskingPolicyVersionRef: string;
  fenceState: ValidationFenceState;
  blockedFieldCount: number;
  maskedFieldCount: number;
  verifiedFieldCount: number;
}

export interface UIEventContractCatalogEntry {
  catalogId: string;
  routeFamilyRef: ValidationRouteFamilyRef;
  actionFamily: ValidationActionFamily;
  eventName: string;
  allowedSettlementStates: readonly ValidationSettlementState[];
  allowedDisclosureClasses: readonly ValidationDisclosureClass[];
  automationAnchorRef: string;
  semanticCoverageRef: string;
  requiredShellSlug: "clinical_workspace" | "support_workspace";
}

export interface TransitionDisclosureMatrixEntry {
  matrixId: string;
  actionFamily: ValidationActionFamily;
  localAckState: ValidationLocalAckState;
  processingAcceptanceState: ValidationProcessingAcceptanceState;
  authoritativeOutcomeState: ValidationAuthoritativeOutcomeState;
  settlementState: ValidationSettlementState;
  disclosureClass: ValidationDisclosureClass;
}

export interface ValidationEvidenceLink {
  evidenceId: string;
  label: string;
  path: string;
  failureClass:
    | "event_chain"
    | "redaction"
    | "contract_drift"
    | "support_integrity"
    | "visual_guardrail";
}

export interface ValidationMetricDefinition {
  metricId: string;
  label: string;
  unit: "count" | "percent" | "minutes" | "ratio";
  sourceFamilies: readonly ValidationActionFamily[];
  guardrail: string;
  operatorUse: string;
  sparkline: readonly number[];
}

export interface ValidationMetricRow extends ValidationMetricDefinition {
  currentValue: number;
  status: "healthy" | "watch" | "failure";
}

export interface ValidationDefectLedgerEntry {
  defectId: string;
  severity: "watch" | "failure";
  className:
    | "missing_settlement_join"
    | "duplicate_event_emission"
    | "stale_route_contract_mismatch"
    | "invalid_sequence_ordering"
    | "disclosure_fence_failure";
  title: string;
  summary: string;
  routeFamilyRef: ValidationRouteFamilyRef;
  evidenceLinkPath: string;
  remediation: string;
}

export interface ValidationEventChainRow {
  chainId: string;
  routeFamilyRef: ValidationRouteFamilyRef;
  actionFamily: ValidationActionFamily;
  eventName: string;
  eventState: ValidationEventState;
  settlementState: ValidationSettlementState;
  redactionPosture: "verified" | "masked" | "blocked";
  anchorHash: string;
  occurredAt: string;
  evidenceLinkPath: string;
}

export interface WorkspaceSupportObservabilitySnapshot {
  version: string;
  releaseTupleRef: string;
  events: readonly UIEventEnvelope[];
  settlements: readonly UITransitionSettlementRecord[];
  disclosureFences: readonly UITelemetryDisclosureFence[];
  lastUpdatedAt: string;
}

export interface ClinicalValidationDeckModel {
  visualMode: typeof CLINICAL_BETA_VALIDATION_VISUAL_MODE;
  featureFlag: typeof CLINICAL_BETA_VALIDATION_FEATURE_FLAG;
  runtimeScenario: RuntimeValidationScenario;
  totalEvents: number;
  settlementJoinRate: number;
  redactionPassRate: number;
  duplicateEventCount: number;
  routeDriftCount: number;
  supportIntegrityCount: number;
  metricRows: readonly ValidationMetricRow[];
  eventChains: readonly ValidationEventChainRow[];
  defects: readonly ValidationDefectLedgerEntry[];
  evidenceLinks: readonly ValidationEvidenceLink[];
  routeFamilyCounts: readonly {
    routeFamilyRef: ValidationRouteFamilyRef;
    count: number;
  }[];
  actionFamilyCounts: readonly {
    actionFamily: ValidationActionFamily;
    count: number;
  }[];
}

export interface RecordUiTelemetryInput {
  routeFamilyRef: ValidationRouteFamilyRef;
  routePath: string;
  routeIntentRef: string;
  canonicalObjectDescriptorRef: string;
  canonicalEntitySeed: string;
  shellInstanceRef: string;
  continuityKey: string;
  selectedAnchorRef: string;
  surfaceRef: string;
  audienceTier: "staff" | "support";
  channelContextRef: string;
  actionFamily: ValidationActionFamily;
  eventClass: ValidationEventClass;
  eventState: ValidationEventState;
  publicationPosture: ValidationPublicationPosture;
  recoveryPosture: ValidationRecoveryPosture;
  shellDecisionClass: UIEventEnvelope["shellDecisionClass"];
  semanticCoverageRef: string;
  releaseTupleRef: string;
  evidenceLinkPath: string;
  interactionMode?: ValidationInteractionMode;
  localAckState: ValidationLocalAckState;
  processingAcceptanceState: ValidationProcessingAcceptanceState;
  externalObservationState: ValidationExternalObservationState;
  authoritativeSource: ValidationAuthoritativeSource;
  authoritativeOutcomeState: ValidationAuthoritativeOutcomeState;
  settlementState: ValidationSettlementState;
  replayState?: CorrelationReplayState;
  maskedContactDescriptor?: string | null;
  actionRecordRef?: string | null;
  commandSettlementRef?: string | null;
  auditRecordRef?: string | null;
  projectionVisibilityRef?: string | null;
}

const OBSERVABILITY_CONTRACT_VERSION = "UI_EVENT_CONTRACT_269_V1";
const OBSERVABILITY_EVENT_VERSION = "EVENT_VERSION_269_V1";
const REDACTION_POLICY_REF = "redaction_policy_phase3_validation_v1";
const MASKING_POLICY_VERSION_REF = "masking_policy_phase3_validation_v1";
const SHELL_SLUG_BY_ROUTE: Record<
  ValidationRouteFamilyRef,
  "clinical_workspace" | "support_workspace"
> = {
  rf_staff_workspace: "clinical_workspace",
  rf_staff_workspace_child: "clinical_workspace",
  rf_support_ticket_workspace: "support_workspace",
};

export const VALIDATION_EVIDENCE_LINKS: readonly ValidationEvidenceLink[] = [
  {
    evidenceId: "workspace-event-chain-trace",
    label: "Workspace and support event-chain trace",
    path: "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-trace.zip",
    failureClass: "event_chain",
  },
  {
    evidenceId: "ui-redaction-trace",
    label: "UI event redaction trace",
    path: "/Users/test/Code/V/output/playwright/269-ui-event-redaction-trace.zip",
    failureClass: "redaction",
  },
  {
    evidenceId: "validation-board-trace",
    label: "Validation board trace",
    path: "/Users/test/Code/V/output/playwright/269-validation-board-trace.zip",
    failureClass: "contract_drift",
  },
  {
    evidenceId: "validation-board-visual",
    label: "Validation board visual proof",
    path: "/Users/test/Code/V/output/playwright/269-validation-board-live.png",
    failureClass: "visual_guardrail",
  },
  {
    evidenceId: "support-integrity-visual",
    label: "Support integrity visual proof",
    path: "/Users/test/Code/V/output/playwright/269-validation-board-support-integrity.png",
    failureClass: "support_integrity",
  },
];

export const UI_EVENT_CONTRACT_CATALOG: readonly UIEventContractCatalogEntry[] = [
  {
    catalogId: "ui_event_catalog_staff_claim",
    routeFamilyRef: "rf_staff_workspace",
    actionFamily: "claim",
    eventName: "ui.review.claim",
    allowedSettlementStates: ["accepted", "authoritative"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_release",
    routeFamilyRef: "rf_staff_workspace",
    actionFamily: "release",
    eventName: "ui.review.release",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_start_review",
    routeFamilyRef: "rf_staff_workspace",
    actionFamily: "start_review",
    eventName: "ui.review.start",
    allowedSettlementStates: ["accepted", "authoritative"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_workspace_stale_recovery",
    routeFamilyRef: "rf_staff_workspace",
    actionFamily: "stale_recovery",
    eventName: "ui.recovery.entered",
    allowedSettlementStates: ["disputed", "authoritative"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_more_info",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "request_more_info",
    eventName: "ui.more_info.request",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_approve",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "approve",
    eventName: "ui.approval.record",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_escalate",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "escalate",
    eventName: "ui.escalation.record",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_reopen",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "reopen",
    eventName: "ui.task.reopen",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_close",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "close",
    eventName: "ui.task.close",
    allowedSettlementStates: ["accepted", "authoritative", "expired"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_stale_recovery",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "stale_recovery",
    eventName: "ui.recovery.entered",
    allowedSettlementStates: ["disputed", "authoritative"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_handoff",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "handoff",
    eventName: "ui.handoff.launch",
    allowedSettlementStates: ["accepted", "authoritative"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_callback",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "callback_action",
    eventName: "ui.callback.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_message",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "message_action",
    eventName: "ui.message.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_self_care",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "self_care_action",
    eventName: "ui.self_care.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_staff_admin_resolution",
    routeFamilyRef: "rf_staff_workspace_child",
    actionFamily: "admin_resolution_action",
    eventName: "ui.admin_resolution.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["descriptor_and_hash_only"],
    automationAnchorRef: "marker.rf_staff_workspace_child.dominant_action",
    semanticCoverageRef: "AccessibilitySemanticCoverageProfile",
    requiredShellSlug: "clinical_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_replay",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "support_replay",
    eventName: "ui.support.replay.entered",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_restore",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "support_restore",
    eventName: "ui.support.restore.resolved",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_stale_recovery",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "stale_recovery",
    eventName: "ui.support.recovery.entered",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_knowledge",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "knowledge_reveal",
    eventName: "ui.support.knowledge.revealed",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_history",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "history_reveal",
    eventName: "ui.support.history.revealed",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_callback",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "callback_action",
    eventName: "ui.support.callback.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_message",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "message_action",
    eventName: "ui.support.message.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
  {
    catalogId: "ui_event_catalog_support_admin_resolution",
    routeFamilyRef: "rf_support_ticket_workspace",
    actionFamily: "admin_resolution_action",
    eventName: "ui.support.admin_resolution.action",
    allowedSettlementStates: ["accepted", "authoritative", "disputed"],
    allowedDisclosureClasses: ["masked_scope_and_refs_only"],
    automationAnchorRef: "support.timeline.selected_anchor",
    semanticCoverageRef: "SupportMaskingFallbackRouteContract",
    requiredShellSlug: "support_workspace",
  },
];

export const TRANSITION_AND_DISCLOSURE_MATRIX: readonly TransitionDisclosureMatrixEntry[] = [
  {
    matrixId: "transition_disclosure_provisional_descriptor",
    actionFamily: "start_review",
    localAckState: "shown",
    processingAcceptanceState: "accepted_for_processing",
    authoritativeOutcomeState: "pending",
    settlementState: "accepted",
    disclosureClass: "descriptor_and_hash_only",
  },
  {
    matrixId: "transition_disclosure_authoritative_descriptor",
    actionFamily: "approve",
    localAckState: "shown",
    processingAcceptanceState: "externally_accepted",
    authoritativeOutcomeState: "settled",
    settlementState: "authoritative",
    disclosureClass: "descriptor_and_hash_only",
  },
  {
    matrixId: "transition_disclosure_support_masked",
    actionFamily: "support_replay",
    localAckState: "shown",
    processingAcceptanceState: "accepted_for_processing",
    authoritativeOutcomeState: "recovery_required",
    settlementState: "disputed",
    disclosureClass: "masked_scope_and_refs_only",
  },
  {
    matrixId: "transition_disclosure_support_restore",
    actionFamily: "support_restore",
    localAckState: "restored",
    processingAcceptanceState: "externally_accepted",
    authoritativeOutcomeState: "settled",
    settlementState: "authoritative",
    disclosureClass: "masked_scope_and_refs_only",
  },
];

export const VALIDATION_METRIC_DEFINITIONS: readonly ValidationMetricDefinition[] = [
  {
    metricId: "queue_depth_high_band",
    label: "High-band queue depth",
    unit: "count",
    sourceFamilies: ["claim", "start_review"],
    guardrail: "<= 4 cases in the critical band",
    operatorUse: "Detect queue pressure before fairness and abandonment degrade.",
    sparkline: [3, 4, 4, 3, 2, 3],
  },
  {
    metricId: "median_claim_to_review_minutes",
    label: "Median claim to review",
    unit: "minutes",
    sourceFamilies: ["claim", "start_review"],
    guardrail: "<= 6 minutes",
    operatorUse: "Checks whether the shell is helping operators enter active review quickly.",
    sparkline: [5, 4, 6, 5, 4, 5],
  },
  {
    metricId: "awaiting_patient_dwell_minutes",
    label: "Awaiting-patient dwell",
    unit: "minutes",
    sourceFamilies: ["request_more_info"],
    guardrail: "<= 2880 minutes before escalation",
    operatorUse: "Tracks reply-window pressure and stale patient waits.",
    sparkline: [1320, 1410, 1440, 1500, 1380, 1410],
  },
  {
    metricId: "approval_dwell_minutes",
    label: "Approval dwell",
    unit: "minutes",
    sourceFamilies: ["approve", "escalate"],
    guardrail: "<= 90 minutes",
    operatorUse: "Shows whether approval checkpoints are blocking flow beyond the agreed envelope.",
    sparkline: [44, 50, 52, 48, 55, 51],
  },
  {
    metricId: "duplicate_rate_percent",
    label: "Duplicate rate",
    unit: "percent",
    sourceFamilies: ["reopen", "start_review"],
    guardrail: "<= 8%",
    operatorUse: "Detects duplicate churn that can distort queue fairness.",
    sparkline: [4.8, 4.5, 4.3, 4.1, 4.0, 4.2],
  },
  {
    metricId: "reopen_rate_percent",
    label: "Reopen rate",
    unit: "percent",
    sourceFamilies: ["reopen", "close"],
    guardrail: "<= 10%",
    operatorUse: "Surfaces consequence or review closure that is calming too early.",
    sparkline: [6.1, 6.4, 6.9, 7.0, 7.2, 7.1],
  },
  {
    metricId: "queue_abandonment_after_live_reorder_percent",
    label: "Queue abandonment after live reorder",
    unit: "percent",
    sourceFamilies: ["claim", "stale_recovery"],
    guardrail: "<= 3%",
    operatorUse: "Checks whether queue churn or anchor invalidation is causing operators to bail out.",
    sparkline: [1.0, 1.2, 1.5, 1.3, 1.4, 1.6],
  },
  {
    metricId: "keyboard_only_completion_rate_percent",
    label: "Keyboard-only completion rate",
    unit: "percent",
    sourceFamilies: ["start_review", "approve", "close"],
    guardrail: ">= 55%",
    operatorUse: "Verifies that repetitive review can stay keyboard-first without losing legality.",
    sparkline: [58, 60, 61, 63, 62, 64],
  },
  {
    metricId: "focus_protection_churn_rate",
    label: "Focus-protection churn",
    unit: "ratio",
    sourceFamilies: ["stale_recovery", "request_more_info", "approve"],
    guardrail: "<= 0.12 protected interruptions per review",
    operatorUse: "Tracks how often protected composition is being invalidated or re-armed.",
    sparkline: [0.08, 0.09, 0.1, 0.11, 0.1, 0.09],
  },
  {
    metricId: "premature_next_task_launch_rate_percent",
    label: "Premature next-task launch rate",
    unit: "percent",
    sourceFamilies: ["close", "handoff"],
    guardrail: "<= 1%",
    operatorUse: "Ensures next-task launch stays gated on real settlement and continuity truth.",
    sparkline: [0.6, 0.8, 0.7, 0.7, 0.6, 0.7],
  },
  {
    metricId: "support_replay_restore_block_rate_percent",
    label: "Support replay restore block rate",
    unit: "percent",
    sourceFamilies: ["support_replay", "support_restore"],
    guardrail: "<= 25%",
    operatorUse: "Checks whether replay boundaries are sticking in read-only recovery too often.",
    sparkline: [18, 20, 21, 19, 18, 17],
  },
  {
    metricId: "support_repair_join_rate_percent",
    label: "Support repair join rate",
    unit: "percent",
    sourceFamilies: ["message_action", "callback_action", "knowledge_reveal", "history_reveal"],
    guardrail: ">= 95%",
    operatorUse: "Verifies replay, history, knowledge, and repair events are joining one lawful chain.",
    sparkline: [96, 97, 96, 98, 97, 97],
  },
];

const CONTRACT_CATALOG_BY_KEY = new Map(
  UI_EVENT_CONTRACT_CATALOG.map((entry) => [
    `${entry.routeFamilyRef}:${entry.actionFamily}`,
    entry,
  ]),
);

const DISCLOSURE_CLASSES_BY_ROUTE: Record<
  ValidationDisclosureClass,
  readonly TelemetryDisclosureClass[]
> = {
  descriptor_and_hash_only: [
    "control_plane_safe",
    "public_descriptor",
    "phi_reference_only",
    "masked_route_descriptor",
  ],
  masked_scope_and_refs_only: [
    "control_plane_safe",
    "public_descriptor",
    "phi_reference_only",
    "masked_route_descriptor",
    "masked_contact_descriptor",
  ],
};

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function maskAnchorRef(selectedAnchorRef: string): string {
  return `anchor_${digestForTelemetry(selectedAnchorRef).slice(0, 12)}`;
}

function maskEntityRef(value: string): string {
  return `entity_${digestForTelemetry(value).slice(0, 12)}`;
}

function readSnapshot(): WorkspaceSupportObservabilitySnapshot {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return {
      version: OBSERVABILITY_CONTRACT_VERSION,
      releaseTupleRef: "phase3_workspace_support_release_tuple_v1",
      events: [],
      settlements: [],
      disclosureFences: [],
      lastUpdatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = ownerWindow.sessionStorage.getItem(
      WORKSPACE_SUPPORT_OBSERVABILITY_STORAGE_KEY,
    );
    if (!raw) {
      return {
        version: OBSERVABILITY_CONTRACT_VERSION,
        releaseTupleRef: "phase3_workspace_support_release_tuple_v1",
        events: [],
        settlements: [],
        disclosureFences: [],
        lastUpdatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as WorkspaceSupportObservabilitySnapshot;
  } catch {
    return {
      version: OBSERVABILITY_CONTRACT_VERSION,
      releaseTupleRef: "phase3_workspace_support_release_tuple_v1",
      events: [],
      settlements: [],
      disclosureFences: [],
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}

function writeSnapshot(snapshot: WorkspaceSupportObservabilitySnapshot): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.sessionStorage.setItem(
    WORKSPACE_SUPPORT_OBSERVABILITY_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  (ownerWindow as Window & {
    __vecellsClinicalValidationStore?: WorkspaceSupportObservabilitySnapshot;
  }).__vecellsClinicalValidationStore = snapshot;
  ownerWindow.dispatchEvent(
    new CustomEvent(WORKSPACE_SUPPORT_OBSERVABILITY_CHANGE_EVENT),
  );
}

export function clearWorkspaceSupportObservabilityStore(): void {
  const ownerWindow = safeWindow();
  if (!ownerWindow) {
    return;
  }
  ownerWindow.sessionStorage.removeItem(WORKSPACE_SUPPORT_OBSERVABILITY_STORAGE_KEY);
  delete (ownerWindow as Window & {
    __vecellsClinicalValidationStore?: WorkspaceSupportObservabilitySnapshot;
  }).__vecellsClinicalValidationStore;
  ownerWindow.dispatchEvent(
    new CustomEvent(WORKSPACE_SUPPORT_OBSERVABILITY_CHANGE_EVENT),
  );
}

export function readWorkspaceSupportObservabilityStore(): WorkspaceSupportObservabilitySnapshot {
  return readSnapshot();
}

function buildFieldFence(
  input: RecordUiTelemetryInput,
  catalog: UIEventContractCatalogEntry,
): {
  fields: Record<string, TelemetrySafeField>;
  disclosureState: "verified" | "masked" | "blocked";
  blockedFieldCount: number;
  maskedFieldCount: number;
  verifiedFieldCount: number;
  fenceState: ValidationFenceState;
} {
  const fields: Record<string, TelemetrySafeField> = {
    routeFamilyRef: controlPlaneField(input.routeFamilyRef, "routeFamilyRef"),
    routeIntentRef: controlPlaneField(input.routeIntentRef, "routeIntentRef"),
    routePath: maskedRouteField(input.routePath, "routePath"),
    canonicalEntityRef: phiReferenceField(
      input.canonicalEntitySeed,
      "canonicalEntityRef",
    ),
    selectedAnchorRef: phiReferenceField(
      input.selectedAnchorRef,
      "selectedAnchorRef",
    ),
    actionFamily: publicDescriptor(input.actionFamily, "actionFamily"),
    eventName: publicDescriptor(catalog.eventName, "eventName"),
    automationAnchorRef: controlPlaneField(
      catalog.automationAnchorRef,
      "automationAnchorRef",
    ),
    semanticCoverageRef: controlPlaneField(
      input.semanticCoverageRef,
      "semanticCoverageRef",
    ),
  };
  if (input.maskedContactDescriptor) {
    fields.maskedContactDescriptor = maskedContactField(
      input.maskedContactDescriptor,
      "maskedContactDescriptor",
    );
  }
  const summary = summarizeDisclosureFence(fields);
  const permittedClasses = new Set(
    DISCLOSURE_CLASSES_BY_ROUTE[input.publicationPosture === "live"
      ? catalog.allowedDisclosureClasses[0] ?? "descriptor_and_hash_only"
      : input.audienceTier === "support"
        ? "masked_scope_and_refs_only"
        : "descriptor_and_hash_only"],
  );
  const hasMismatch = Object.values(fields).some(
    (field) => !permittedClasses.has(field.disclosureClass),
  );
  return {
    fields,
    disclosureState: summary.disclosureState,
    blockedFieldCount: summary.blockedFieldCount,
    maskedFieldCount: summary.maskedFieldCount,
    verifiedFieldCount: summary.verifiedFieldCount,
    fenceState: hasMismatch
      ? "mismatched"
      : summary.disclosureState === "blocked"
        ? "blocked"
        : "enforced",
  };
}

export function recordWorkspaceSupportUiEvent(
  input: RecordUiTelemetryInput,
): {
  event: UIEventEnvelope;
  settlement: UITransitionSettlementRecord;
  disclosureFence: UITelemetryDisclosureFence;
} {
  const catalog = CONTRACT_CATALOG_BY_KEY.get(
    `${input.routeFamilyRef}:${input.actionFamily}`,
  );
  if (!catalog) {
    throw new Error(
      `Missing UI event catalog row for ${input.routeFamilyRef}:${input.actionFamily}.`,
    );
  }

  const occurredAt = new Date().toISOString();
  const correlation = mintEdgeCorrelation({
    environment: "clinical_beta",
    serviceRef:
      input.audienceTier === "support"
        ? "frontend.support_workspace"
        : "frontend.clinical_workspace",
    hopKind: "browser",
    replayState: input.replayState ?? "live",
    audienceSurfaceRef: input.audienceTier,
    routeFamilyRef: input.routeFamilyRef,
    requestMethod: "GET",
    requestPath: input.routePath,
    issuedAt: occurredAt,
    correlationSeed: JSON.stringify({
      routeFamilyRef: input.routeFamilyRef,
      actionFamily: input.actionFamily,
      selectedAnchorRef: input.selectedAnchorRef,
      publicationPosture: input.publicationPosture,
      recoveryPosture: input.recoveryPosture,
      occurredAt,
    }),
  });

  const continuityFrameRef = `frame_${digestForTelemetry({
    continuityKey: input.continuityKey,
    routeFamilyRef: input.routeFamilyRef,
    selectedAnchorRef: input.selectedAnchorRef,
    routeIntentRef: input.routeIntentRef,
  }).slice(0, 16)}`;

  const routeScopeHash = `scope_${digestForTelemetry({
    routeFamilyRef: input.routeFamilyRef,
    routePath: input.routePath,
  }).slice(0, 16)}`;

  const { fields, disclosureState, blockedFieldCount, maskedFieldCount, verifiedFieldCount, fenceState } =
    buildFieldFence(input, catalog);

  const event: UIEventEnvelope = {
    uiEventId: `uie_${digestForTelemetry({
      routeFamilyRef: input.routeFamilyRef,
      actionFamily: input.actionFamily,
      edgeCorrelationId: correlation.edgeCorrelationId,
      occurredAt,
    }).slice(0, 18)}`,
    eventName: catalog.eventName,
    actionFamily: input.actionFamily,
    contractVersionRef: OBSERVABILITY_CONTRACT_VERSION,
    eventVersion: OBSERVABILITY_EVENT_VERSION,
    continuityKey: input.continuityKey,
    continuityFrameRef,
    routeFamilyRef: input.routeFamilyRef,
    routeIntentRef: input.routeIntentRef,
    canonicalObjectDescriptorRef: input.canonicalObjectDescriptorRef,
    canonicalEntityRef: maskEntityRef(input.canonicalEntitySeed),
    shellInstanceRef: input.shellInstanceRef,
    surfaceRef: input.surfaceRef,
    audienceTier: input.audienceTier,
    channelContextRef: input.channelContextRef,
    eventClass: input.eventClass,
    eventState: input.eventState,
    occurredAt,
    correlationId: correlation.traceId,
    edgeCorrelationId: correlation.edgeCorrelationId,
    actionRecordRef: input.actionRecordRef ?? null,
    commandSettlementRef: input.commandSettlementRef ?? null,
    projectionVisibilityRef: input.projectionVisibilityRef ?? null,
    selectedAnchorRef: maskAnchorRef(input.selectedAnchorRef),
    shellDecisionClass: input.shellDecisionClass,
    auditRecordRef: input.auditRecordRef ?? null,
    disclosureClass:
      input.audienceTier === "support"
        ? "masked_scope_and_refs_only"
        : "descriptor_and_hash_only",
    publicationPosture: input.publicationPosture,
    recoveryPosture: input.recoveryPosture,
    redactionPosture: disclosureState,
    automationAnchorRef: catalog.automationAnchorRef,
    semanticCoverageRef: input.semanticCoverageRef,
    routeScopeHash,
    releaseTupleRef: input.releaseTupleRef,
    evidenceLinkPath: input.evidenceLinkPath,
    interactionMode: input.interactionMode ?? "system",
  };

  const settlement: UITransitionSettlementRecord = {
    uiTransitionSettlementRecordId: `uits_${digestForTelemetry({
      uiEventId: event.uiEventId,
      settlementState: input.settlementState,
      authoritativeOutcomeState: input.authoritativeOutcomeState,
    }).slice(0, 18)}`,
    uiEventRef: event.uiEventId,
    continuityFrameRef,
    edgeCorrelationId: correlation.edgeCorrelationId,
    actionRecordRef: event.actionRecordRef,
    commandSettlementRef: event.commandSettlementRef,
    localAckState: input.localAckState,
    processingAcceptanceState: input.processingAcceptanceState,
    externalObservationState: input.externalObservationState,
    projectionVisibilityState:
      input.publicationPosture === "blocked"
        ? "stale"
        : input.publicationPosture === "projection_visible"
          ? "visible"
          : input.publicationPosture === "recovery_only"
            ? "superseded"
            : "visible",
    projectionVisibilityRef: event.projectionVisibilityRef,
    authoritativeSource: input.authoritativeSource,
    authoritativeOutcomeState: input.authoritativeOutcomeState,
    settlementState: input.settlementState,
    settlementRevision: 1,
    settledAt: occurredAt,
  };

  const disclosureFence: UITelemetryDisclosureFence = {
    uiTelemetryDisclosureFenceId: `uidf_${digestForTelemetry({
      uiEventId: event.uiEventId,
      safeDescriptorHash: digestForTelemetry(fields),
      routeScopeHash,
    }).slice(0, 18)}`,
    uiEventRef: event.uiEventId,
    edgeCorrelationId: correlation.edgeCorrelationId,
    routeIntentRef: input.routeIntentRef,
    audienceTier: input.audienceTier,
    routeSensitivity: event.disclosureClass,
    allowedIdentifierClass: event.disclosureClass,
    allowedPayloadClass: event.disclosureClass,
    allowedFieldRefs: Object.keys(fields),
    safeDescriptorHash: `desc_${digestForTelemetry(fields).slice(0, 16)}`,
    safeRouteScopeHash: routeScopeHash,
    redactionPolicyRef: REDACTION_POLICY_REF,
    maskingPolicyVersionRef: MASKING_POLICY_VERSION_REF,
    fenceState,
    blockedFieldCount,
    maskedFieldCount,
    verifiedFieldCount,
  };

  const snapshot = readSnapshot();
  const nextSnapshot: WorkspaceSupportObservabilitySnapshot = {
    version: OBSERVABILITY_CONTRACT_VERSION,
    releaseTupleRef: input.releaseTupleRef,
    events: [...snapshot.events, event].slice(-180),
    settlements: [...snapshot.settlements, settlement].slice(-180),
    disclosureFences: [...snapshot.disclosureFences, disclosureFence].slice(-180),
    lastUpdatedAt: occurredAt,
  };
  writeSnapshot(nextSnapshot);
  return { event, settlement, disclosureFence };
}

function baseMetricValue(metricId: ValidationMetricDefinition["metricId"]): number {
  switch (metricId) {
    case "queue_depth_high_band":
      return staffCases.filter((caseItem) => caseItem.urgencyTone === "critical").length;
    case "median_claim_to_review_minutes":
      return 5;
    case "awaiting_patient_dwell_minutes":
      return 1410;
    case "approval_dwell_minutes":
      return 51;
    case "duplicate_rate_percent":
      return 4.2;
    case "reopen_rate_percent":
      return 7.1;
    case "queue_abandonment_after_live_reorder_percent":
      return 1.6;
    case "keyboard_only_completion_rate_percent":
      return 64;
    case "focus_protection_churn_rate":
      return 0.09;
    case "premature_next_task_launch_rate_percent":
      return 0.7;
    case "support_replay_restore_block_rate_percent":
      return 17;
    case "support_repair_join_rate_percent":
      return 97;
  }
  return 0;
}

function metricStatus(
  definition: ValidationMetricDefinition,
  value: number,
): ValidationMetricRow["status"] {
  switch (definition.metricId) {
    case "queue_depth_high_band":
      return value <= 4 ? "healthy" : value <= 5 ? "watch" : "failure";
    case "median_claim_to_review_minutes":
      return value <= 6 ? "healthy" : value <= 8 ? "watch" : "failure";
    case "awaiting_patient_dwell_minutes":
      return value <= 2880 ? "healthy" : value <= 3600 ? "watch" : "failure";
    case "approval_dwell_minutes":
      return value <= 90 ? "healthy" : value <= 120 ? "watch" : "failure";
    case "duplicate_rate_percent":
    case "reopen_rate_percent":
      return value <= 8 ? "healthy" : value <= 10 ? "watch" : "failure";
    case "queue_abandonment_after_live_reorder_percent":
      return value <= 3 ? "healthy" : value <= 4 ? "watch" : "failure";
    case "keyboard_only_completion_rate_percent":
      return value >= 55 ? "healthy" : value >= 45 ? "watch" : "failure";
    case "focus_protection_churn_rate":
      return value <= 0.12 ? "healthy" : value <= 0.16 ? "watch" : "failure";
    case "premature_next_task_launch_rate_percent":
      return value <= 1 ? "healthy" : value <= 2 ? "watch" : "failure";
    case "support_replay_restore_block_rate_percent":
      return value <= 25 ? "healthy" : value <= 35 ? "watch" : "failure";
    case "support_repair_join_rate_percent":
      return value >= 95 ? "healthy" : value >= 90 ? "watch" : "failure";
  }
  return "watch";
}

function detectDefects(
  snapshot: WorkspaceSupportObservabilitySnapshot,
): ValidationDefectLedgerEntry[] {
  const defects: ValidationDefectLedgerEntry[] = [];
  const settlementByEvent = new Map(
    snapshot.settlements.map((settlement) => [settlement.uiEventRef, settlement]),
  );
  const replayIndices = new Map<string, number>();
  const duplicateKeys = new Set<string>();
  const duplicateKeyHits = new Set<string>();

  snapshot.events.forEach((event, index) => {
    if (!settlementByEvent.has(event.uiEventId)) {
      defects.push({
        defectId: `missing_settlement_join_${event.uiEventId}`,
        severity: "failure",
        className: "missing_settlement_join",
        title: "Event missing settlement join",
        summary: `${event.eventName} emitted without a matching UITransitionSettlementRecord.`,
        routeFamilyRef: event.routeFamilyRef,
        evidenceLinkPath: event.evidenceLinkPath,
        remediation:
          "Bind the event family to a canonical transition settlement before release.",
      });
    }

    const contract = CONTRACT_CATALOG_BY_KEY.get(
      `${event.routeFamilyRef}:${event.actionFamily}`,
    );
    if (!contract || contract.eventName !== event.eventName) {
      defects.push({
        defectId: `stale_route_contract_mismatch_${event.uiEventId}`,
        severity: "failure",
        className: "stale_route_contract_mismatch",
        title: "Route contract drift detected",
        summary:
          "An emitted event no longer matches the published route-family event contract.",
        routeFamilyRef: event.routeFamilyRef,
        evidenceLinkPath: event.evidenceLinkPath,
        remediation:
          "Update the event catalog, automation anchor, and semantic coverage together.",
      });
    }

    const duplicateKey = `${event.routeFamilyRef}:${event.actionFamily}:${event.selectedAnchorRef}:${event.eventState}`;
    if (duplicateKeys.has(duplicateKey)) {
      duplicateKeyHits.add(duplicateKey);
    }
    duplicateKeys.add(duplicateKey);

    if (event.actionFamily === "support_replay") {
      replayIndices.set(event.routeFamilyRef, index);
    }
    if (event.actionFamily === "support_restore") {
      const replayIndex = replayIndices.get(event.routeFamilyRef);
      if (replayIndex === undefined || replayIndex > index) {
        defects.push({
          defectId: `invalid_sequence_ordering_${event.uiEventId}`,
          severity: "failure",
          className: "invalid_sequence_ordering",
          title: "Support restore precedes replay entry",
          summary:
            "Restore rendered before the same chain observed a replay entry event.",
          routeFamilyRef: event.routeFamilyRef,
          evidenceLinkPath: event.evidenceLinkPath,
          remediation:
            "Require replay entry to emit before restore joins can settle.",
        });
      }
    }
  });

  duplicateKeyHits.forEach((duplicateKey) => {
    const [routeFamilyRef] = duplicateKey.split(":") as [ValidationRouteFamilyRef];
    defects.push({
      defectId: `duplicate_event_emission_${digestForTelemetry(duplicateKey).slice(0, 12)}`,
      severity: "watch",
      className: "duplicate_event_emission",
      title: "Duplicate event emission detected",
      summary:
        "The same route-family action family emitted multiple times without a new settlement or anchor change.",
      routeFamilyRef,
      evidenceLinkPath:
        VALIDATION_EVIDENCE_LINKS[0]?.path ??
        "/Users/test/Code/V/output/playwright/269-workspace-support-event-chains-trace.zip",
      remediation:
        "Deduplicate emissions by continuity frame, action family, and selected anchor hash.",
    });
  });

  snapshot.disclosureFences.forEach((fence) => {
    if (fence.fenceState !== "enforced") {
      const event = snapshot.events.find((entry) => entry.uiEventId === fence.uiEventRef);
      defects.push({
        defectId: `disclosure_fence_failure_${fence.uiTelemetryDisclosureFenceId}`,
        severity: "failure",
        className: "disclosure_fence_failure",
        title: "Disclosure fence failed",
        summary:
          "A UI event exceeded the permitted disclosure class or redaction posture for this route.",
        routeFamilyRef: event?.routeFamilyRef ?? "rf_support_ticket_workspace",
        evidenceLinkPath:
          event?.evidenceLinkPath ??
          VALIDATION_EVIDENCE_LINKS[1]?.path ??
          "/Users/test/Code/V/output/playwright/269-ui-event-redaction-trace.zip",
        remediation:
          "Reduce emitted fields to descriptor-and-hash or masked-scope classes only.",
      });
    }
  });

  return defects;
}

function buildMetricRows(
  snapshot: WorkspaceSupportObservabilitySnapshot,
  runtimeScenario: RuntimeValidationScenario,
): readonly ValidationMetricRow[] {
  return VALIDATION_METRIC_DEFINITIONS.map((definition) => {
    let currentValue = baseMetricValue(definition.metricId);
    if (definition.metricId === "support_replay_restore_block_rate_percent") {
      const replayCount = snapshot.events.filter(
        (event) => event.actionFamily === "support_replay",
      ).length;
      const restoreBlockedCount = snapshot.events.filter(
        (event) =>
          event.actionFamily === "support_restore" &&
          event.recoveryPosture !== "none",
      ).length;
      currentValue =
        replayCount === 0
          ? currentValue
          : Math.round((restoreBlockedCount / replayCount) * 100);
    }
    if (definition.metricId === "support_repair_join_rate_percent") {
      const supportEvents = snapshot.events.filter(
        (event) => event.routeFamilyRef === "rf_support_ticket_workspace",
      );
      const supportSettlements = snapshot.settlements.filter((settlement) =>
        supportEvents.some((event) => event.uiEventId === settlement.uiEventRef),
      );
      currentValue =
        supportEvents.length === 0
          ? currentValue
          : Math.round((supportSettlements.length / supportEvents.length) * 100);
    }
    if (runtimeScenario === "recovery_only") {
      currentValue =
        definition.metricId === "support_replay_restore_block_rate_percent"
          ? Math.max(currentValue, 29)
          : definition.metricId === "focus_protection_churn_rate"
            ? 0.14
            : currentValue;
    }
    if (runtimeScenario === "blocked") {
      currentValue =
        definition.metricId === "support_replay_restore_block_rate_percent"
          ? 41
          : definition.metricId === "support_repair_join_rate_percent"
            ? 82
            : definition.metricId === "premature_next_task_launch_rate_percent"
              ? 3.4
              : definition.metricId === "queue_abandonment_after_live_reorder_percent"
                ? 5.6
                : currentValue;
    }
    return {
      ...definition,
      currentValue,
      status: metricStatus(definition, currentValue),
    };
  });
}

function buildEventChainRows(
  snapshot: WorkspaceSupportObservabilitySnapshot,
): readonly ValidationEventChainRow[] {
  const settlementByEvent = new Map(
    snapshot.settlements.map((settlement) => [settlement.uiEventRef, settlement]),
  );
  return snapshot.events
    .slice(-40)
    .map((event) => {
      const settlement = settlementByEvent.get(event.uiEventId);
      return {
        chainId: event.edgeCorrelationId,
        routeFamilyRef: event.routeFamilyRef,
        actionFamily: event.actionFamily,
        eventName: event.eventName,
        eventState: event.eventState,
        settlementState: settlement?.settlementState ?? "provisional",
        redactionPosture: event.redactionPosture,
        anchorHash: event.selectedAnchorRef,
        occurredAt: event.occurredAt,
        evidenceLinkPath: event.evidenceLinkPath,
      };
    })
    .reverse();
}

export function buildClinicalValidationDeckModel(input: {
  snapshot?: WorkspaceSupportObservabilitySnapshot;
  runtimeScenario: RuntimeValidationScenario;
}): ClinicalValidationDeckModel {
  const snapshot = input.snapshot ?? readSnapshot();
  const defects = detectDefects(snapshot);
  if (input.runtimeScenario === "blocked") {
    defects.push({
      defectId: "synthetic_blocked_route_contract_failure",
      severity: "failure",
      className: "stale_route_contract_mismatch",
      title: "Blocked validation mode surfaces contract drift loudly",
      summary:
        "The blocked validation scenario intentionally shows a route-contract mismatch to prove the release gate remains visible.",
      routeFamilyRef: "rf_staff_workspace_child",
      evidenceLinkPath:
        VALIDATION_EVIDENCE_LINKS[2]?.path ??
        "/Users/test/Code/V/output/playwright/269-validation-board-trace.zip",
      remediation:
        "Restore the matching automation anchor, semantic coverage, and event catalog row before release.",
    });
  }

  const metricRows = buildMetricRows(snapshot, input.runtimeScenario);
  const eventChains = buildEventChainRows(snapshot);
  const totalEvents = snapshot.events.length;
  const settlementJoinRate =
    totalEvents === 0
      ? 100
      : Math.round((snapshot.settlements.length / totalEvents) * 100);
  const redactionPassRate =
    snapshot.disclosureFences.length === 0
      ? 100
      : Math.round(
          (snapshot.disclosureFences.filter((fence) => fence.fenceState === "enforced")
            .length /
            snapshot.disclosureFences.length) *
            100,
        );
  const routeFamilyCounts = (
    ["rf_staff_workspace", "rf_staff_workspace_child", "rf_support_ticket_workspace"] as const
  ).map((routeFamilyRef) => ({
    routeFamilyRef,
    count: snapshot.events.filter((event) => event.routeFamilyRef === routeFamilyRef).length,
  }));
  const actionFamilyCounts = (
    [
      "claim",
      "start_review",
      "request_more_info",
      "approve",
      "escalate",
      "reopen",
      "close",
      "support_replay",
      "support_restore",
      "history_reveal",
      "knowledge_reveal",
      "callback_action",
      "message_action",
      "self_care_action",
      "admin_resolution_action",
    ] as const
  ).map((actionFamily) => ({
    actionFamily,
    count: snapshot.events.filter((event) => event.actionFamily === actionFamily).length,
  }));

  return {
    visualMode: CLINICAL_BETA_VALIDATION_VISUAL_MODE,
    featureFlag: CLINICAL_BETA_VALIDATION_FEATURE_FLAG,
    runtimeScenario: input.runtimeScenario,
    totalEvents,
    settlementJoinRate:
      input.runtimeScenario === "blocked" ? Math.min(settlementJoinRate, 72) : settlementJoinRate,
    redactionPassRate:
      input.runtimeScenario === "blocked" ? Math.min(redactionPassRate, 86) : redactionPassRate,
    duplicateEventCount: defects.filter(
      (defect) => defect.className === "duplicate_event_emission",
    ).length,
    routeDriftCount: defects.filter(
      (defect) => defect.className === "stale_route_contract_mismatch",
    ).length,
    supportIntegrityCount: snapshot.events.filter(
      (event) =>
        event.routeFamilyRef === "rf_support_ticket_workspace" &&
        [
          "support_replay",
          "support_restore",
          "history_reveal",
          "knowledge_reveal",
          "callback_action",
          "message_action",
        ].includes(event.actionFamily),
    ).length,
    metricRows,
    eventChains,
    defects,
    evidenceLinks: VALIDATION_EVIDENCE_LINKS,
    routeFamilyCounts,
    actionFamilyCounts,
  };
}
