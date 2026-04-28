import { createHash } from "node:crypto";

export const SUPPORT_LINEAGE_ASSEMBLER_NAME = "SupportLineageAssembler";
export const SUPPORT_TICKET_WORKSPACE_ASSEMBLER_NAME = "SupportTicketWorkspaceAssembler";
export const SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME = "SupportSubjectHistoryQueryService";
export const SUPPORT_SUBJECT_CONTEXT_DISCLOSURE_SERVICE_NAME =
  "SupportSubjectContextDisclosureService";
export const SUPPORT_LINEAGE_SCHEMA_VERSION = "218.crosscutting.support-lineage.v1";
export const SUPPORT_LINEAGE_POLICY_VERSION = "support-lineage-subject-history-v1";
export const SUPPORT_LINEAGE_VISUAL_MODE = "Support_Lineage_Atlas";
export const SUPPORT_LINEAGE_FIXTURE_TICKET_ID = "support_ticket_218_delivery_failure";

export const SUPPORT_LINEAGE_QUERY_SURFACES = [
  "GET /ops/support/tickets/:supportTicketId",
  "GET /ops/support/tickets/:supportTicketId/subject-history",
  "GET /ops/support/tickets/:supportTicketId/subject-360",
  "GET /internal/ops/support/tickets/:supportTicketId/lineage/scope-members",
  "GET /internal/ops/support/tickets/:supportTicketId/lineage/artifacts",
] as const;

export const SUPPORT_LINEAGE_REASON_CODES = [
  "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
  "SUPPORT_218_SCOPE_MEMBER_EXPLICIT",
  "SUPPORT_218_ARTIFACT_PROVENANCE_BOUND",
  "SUPPORT_218_TICKET_WORKSPACE_ANATOMY",
  "SUPPORT_218_SUBJECT_360_SUMMARY_FIRST",
  "SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED",
  "SUPPORT_218_READ_ONLY_FALLBACK_SAME_SHELL",
  "SUPPORT_218_NO_TICKET_LOCAL_TRUTH",
  "SUPPORT_218_ALIAS_GAP_RESOLUTION_PUBLISHED",
] as const;

export const SUPPORT_LINEAGE_FORBIDDEN_TRUTH_SOURCES = [
  "ticket_local_linked_refs_as_authority",
  "subject_only_clustering_as_scope",
  "copied_thread_excerpt_without_SupportLineageArtifactBinding",
  "raw_adapter_payload_subject_history",
  "support_local_contact_route_health_copy",
  "browser_history_state_as_restore_authority",
] as const;

export type SupportLineageReasonCode = (typeof SUPPORT_LINEAGE_REASON_CODES)[number];
export type SupportLineageBindingState = "active" | "stale" | "superseded" | "closed";
export type SupportLineageScopeMemberRole =
  | "primary_action_target"
  | "communication_context"
  | "recovery_dependency"
  | "identity_repair_dependency"
  | "related_case_context"
  | "artifact_provenance";
export type SupportLineageVisibilityMode =
  | "masked_summary"
  | "bounded_detail"
  | "repair_actionable";
export type SupportLineageActionability = "observe_only" | "governed_mutation" | "artifact_only";
export type SupportLineageMemberState = "active" | "stale" | "superseded" | "released";
export type SupportArtifactBindingState = "active" | "superseded" | "blocked";
export type SupportShellMode =
  | "live"
  | "replay"
  | "observe_only"
  | "provisional"
  | "read_only_recovery";
export type SupportTicketState =
  | "open"
  | "waiting_on_subject"
  | "waiting_on_owner"
  | "resolved"
  | "closed";
export type SupportSlaState = "within_sla" | "at_risk" | "breached";
export type SupportSeverity = "low" | "medium" | "high" | "critical";
export type SupportDisclosureMode = "summary_only" | "bounded_detail" | "break_glass_blocked";
export type SupportDisclosureApprovalState = "not_required" | "approved" | "denied" | "expired";
export type SupportSubjectHistorySourceType =
  | "request"
  | "message_thread"
  | "callback_case"
  | "record_artifact"
  | "identity_repair"
  | "support_note";
export type SupportReadOnlyFallbackMode =
  | "stale_reacquire"
  | "observe_only"
  | "awaiting_external_hold"
  | "transfer_pending"
  | "blocked_scope";
export type SupportRuntimeBindingState = "live" | "recovery_only" | "blocked";

export interface SupportLineageTicketSubjectHistoryRouteDefinition {
  readonly routeId: string;
  readonly method: "GET";
  readonly path: string;
  readonly contractFamily: string;
  readonly projectionNames: readonly string[];
  readonly purpose: string;
}

export const supportLineageTicketSubjectHistoryRoutes = [
  {
    routeId: "support_ticket_workspace_current",
    method: "GET",
    path: "/ops/support/tickets/{supportTicketId}",
    contractFamily: "SupportTicketWorkspaceProjectionContract",
    projectionNames: [
      "SupportTicket",
      "SupportLineageBinding",
      "SupportLineageScopeMember",
      "SupportLineageArtifactBinding",
      "SupportTicketWorkspaceProjection",
      "SupportReadOnlyFallbackProjection",
    ],
    purpose:
      "Resolve one ticket anatomy from the current support-lineage binding, explicit scope members, artifact provenance, and same-shell fallback posture.",
  },
  {
    routeId: "support_ticket_subject_history",
    method: "GET",
    path: "/ops/support/tickets/{supportTicketId}/subject-history",
    contractFamily: "SupportSubjectHistoryQueryContract",
    projectionNames: [
      "SupportSubjectHistoryQuery",
      "SupportSubjectContextBinding",
      "SupportContextDisclosureRecord",
      "SupportSubjectHistoryProjection",
    ],
    purpose:
      "Return summary-first subject history slices that widen only through the current context binding and reason-coded disclosure record.",
  },
  {
    routeId: "support_ticket_subject_360",
    method: "GET",
    path: "/ops/support/tickets/{supportTicketId}/subject-360",
    contractFamily: "SupportSubject360ProjectionContract",
    projectionNames: [
      "SupportSubject360Projection",
      "SupportSubjectContextBinding",
      "SupportContextDisclosureRecord",
    ],
    purpose:
      "Expose compact masked identity, contact-route, open-object, and recent-outcome context without a broad dossier.",
  },
  {
    routeId: "support_ticket_lineage_scope_members",
    method: "GET",
    path: "/internal/ops/support/tickets/{supportTicketId}/lineage/scope-members",
    contractFamily: "SupportLineageScopeMemberContract",
    projectionNames: ["SupportLineageBinding", "SupportLineageScopeMember"],
    purpose:
      "Expose the internal typed support scope set so downstream support work cannot infer scope from subject coincidence or copied ticket links.",
  },
  {
    routeId: "support_ticket_artifact_provenance",
    method: "GET",
    path: "/internal/ops/support/tickets/{supportTicketId}/lineage/artifacts",
    contractFamily: "SupportLineageArtifactBindingContract",
    projectionNames: ["SupportLineageBinding", "SupportLineageArtifactBinding"],
    purpose:
      "Expose support-visible derived artifact provenance before transcript excerpts, notes, summaries, or exports become durable timeline truth.",
  },
] as const satisfies readonly SupportLineageTicketSubjectHistoryRouteDefinition[];

export interface SupportTicket {
  readonly projectionName: "SupportTicket";
  readonly supportTicketId: string;
  readonly originRef: string;
  readonly originChannel: string;
  readonly subjectRef: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly primaryRequestLineageRef: string;
  readonly primaryLineageCaseLinkRef: string;
  readonly activeScopeMemberRefs: readonly string[];
  readonly reasonCategory: string;
  readonly severity: SupportSeverity;
  readonly slaState: SupportSlaState;
  readonly ticketState: SupportTicketState;
  readonly currentOwnerRef: string;
  readonly queueKey: string;
  readonly latestSubjectEventRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly selectedTimelineAnchorTupleHashRef: string;
  readonly activeConversationRef: string;
  readonly currentKnowledgePackRef: string;
  readonly currentHistoryPackRef: string;
  readonly effectiveMaskScopeRef: string;
  readonly allowedActionRefs: readonly string[];
  readonly currentActionLeaseRef: string | null;
  readonly activeMutationAttemptRef: string | null;
  readonly activeIdentityCorrectionRequestRef: string | null;
  readonly activeIdentityRepairCaseRef: string | null;
  readonly identityRepairFreezeRef: string | null;
  readonly identityRepairReleaseSettlementRef: string | null;
  readonly activeReplayCheckpointRef: string | null;
  readonly activeObserveSessionRef: string | null;
  readonly activeTransferRef: string | null;
  readonly activeTransferAcceptanceSettlementRef: string | null;
  readonly activeReadOnlyFallbackRef: string | null;
  readonly ticketVersionRef: string;
  readonly shellMode: SupportShellMode;
  readonly staffWorkspaceConsistencyProjectionRef: string;
  readonly workspaceSliceTrustProjectionRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly releaseRecoveryDispositionRef: string | null;
  readonly taskCompletionSettlementEnvelopeRef: string | null;
  readonly lastResolutionSummaryRef: string | null;
}

export interface SupportLineageBinding {
  readonly projectionName: "SupportLineageBinding";
  readonly supportLineageBindingId: string;
  readonly supportTicketId: string;
  readonly subjectRef: string;
  readonly primaryRequestLineageRef: string;
  readonly primaryLineageCaseLinkRef: string;
  readonly primaryScopeMemberRef: string;
  readonly governingObjectDescriptorRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly scopeMemberRefs: readonly string[];
  readonly sourceLineageRefs: readonly string[];
  readonly sourceThreadRefs: readonly string[];
  readonly sourceArtifactRefs: readonly string[];
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly bindingHash: string;
  readonly supersedesSupportLineageBindingRef: string | null;
  readonly bindingState: SupportLineageBindingState;
  readonly createdAt: string;
  readonly supersededAt: string | null;
}

export interface SupportLineageScopeMember {
  readonly projectionName: "SupportLineageScopeMember";
  readonly supportLineageScopeMemberId: string;
  readonly supportLineageBindingRef: string;
  readonly requestLineageRef: string;
  readonly lineageCaseLinkRef: string;
  readonly domainCaseRef: string;
  readonly governingObjectDescriptorRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly sourceThreadRef: string | null;
  readonly sourceArtifactRef: string | null;
  readonly memberRole: SupportLineageScopeMemberRole;
  readonly continuityWitnessRef: string;
  readonly visibilityMode: SupportLineageVisibilityMode;
  readonly actionability: SupportLineageActionability;
  readonly memberState: SupportLineageMemberState;
  readonly addedAt: string;
  readonly releasedAt: string | null;
}

export interface SupportLineageArtifactBinding {
  readonly projectionName: "SupportLineageArtifactBinding";
  readonly supportLineageArtifactBindingId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageScopeMemberRef: string;
  readonly supportTicketId: string;
  readonly sourceLineageRef: string;
  readonly sourceLineageCaseLinkRef: string;
  readonly sourceEvidenceSnapshotRef: string;
  readonly sourceArtifactRef: string;
  readonly derivedArtifactRef: string;
  readonly noteOrSummaryRef: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly parityDigestRef: string;
  readonly bindingState: SupportArtifactBindingState;
  readonly createdAt: string;
  readonly supersededAt: string | null;
}

export interface SupportSubjectContextBinding {
  readonly projectionName: "SupportSubjectContextBinding";
  readonly subjectContextBindingId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly subjectRef: string;
  readonly purposeOfUse: "support_ticket_summary" | "subject_history_review";
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly allowedScopeMemberRefs: readonly string[];
  readonly allowedArtifactBindingRefs: readonly string[];
  readonly subjectSummaryPackRef: string;
  readonly disclosurePolicyRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly bindingHash: string;
  readonly bindingState: "live" | "summary_only" | "blocked";
  readonly expiresAt: string;
  readonly createdAt: string;
}

export interface SupportContextDisclosureRecord {
  readonly projectionName: "SupportContextDisclosureRecord";
  readonly supportContextDisclosureRecordId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly subjectContextBindingRef: string;
  readonly requestedByRef: string;
  readonly reasonCode: string;
  readonly requestedMode: SupportDisclosureMode;
  readonly approvedMode: SupportDisclosureMode;
  readonly approvalState: SupportDisclosureApprovalState;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly revealedScopeMemberRefs: readonly string[];
  readonly revealedArtifactBindingRefs: readonly string[];
  readonly collapsedAt: string | null;
  readonly expiresAt: string;
  readonly recordedAt: string;
}

export interface SupportSubject360Projection {
  readonly projectionName: "SupportSubject360Projection";
  readonly supportSubject360ProjectionId: string;
  readonly supportTicketId: string;
  readonly subjectRef: string;
  readonly supportLineageBindingRef: string;
  readonly subjectContextBindingRef: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly compactIdentitySummaryRef: string;
  readonly maskedSubjectLabel: string;
  readonly contactRouteHealthState: "clear" | "at_risk" | "blocked" | "disputed";
  readonly activeOpenObjectRefs: readonly string[];
  readonly recentOutcomeRefs: readonly string[];
  readonly repeatContactSignalRef: string;
  readonly supportLineageScopeMemberRefs: readonly string[];
  readonly supportLineageArtifactBindingRefs: readonly string[];
  readonly disclosureRecordRefs: readonly string[];
  readonly summaryRows: readonly {
    readonly rowRef: string;
    readonly label: string;
    readonly maskedValue: string;
    readonly sourceRef: string;
  }[];
  readonly querySurfaceRef: "GET /ops/support/tickets/:supportTicketId/subject-360";
  readonly reasonCodes: readonly SupportLineageReasonCode[];
  readonly generatedAt: string;
  readonly createdByAuthority: typeof SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME;
}

export interface SupportSubjectHistoryQuery {
  readonly projectionName: "SupportSubjectHistoryQuery";
  readonly supportSubjectHistoryQueryId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly subjectContextBindingRef: string;
  readonly requestedByRef: string;
  readonly purposeOfUse: "support_ticket_summary" | "subject_history_review";
  readonly requestedMode: SupportDisclosureMode;
  readonly approvedMode: SupportDisclosureMode;
  readonly reasonCode: string;
  readonly maskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly queryTupleHash: string;
  readonly requestedAt: string;
}

export interface SupportSubjectHistorySlice {
  readonly sliceRef: string;
  readonly sourceType: SupportSubjectHistorySourceType;
  readonly sourceRef: string;
  readonly sourceVersionRef: string;
  readonly supportLineageScopeMemberRef: string;
  readonly supportLineageArtifactBindingRef: string | null;
  readonly chronologyAt: string;
  readonly maskedSummary: string;
  readonly boundedDetail: string | null;
  readonly visibilityMode: SupportLineageVisibilityMode;
  readonly disclosureState: "summary_visible" | "detail_visible" | "withheld";
  readonly reasonCodes: readonly SupportLineageReasonCode[];
}

export interface SupportSubjectHistoryProjection {
  readonly projectionName: "SupportSubjectHistoryProjection";
  readonly supportSubjectHistoryProjectionId: string;
  readonly supportTicketId: string;
  readonly subjectRef: string;
  readonly supportLineageBindingRef: string;
  readonly subjectContextBindingRef: string;
  readonly disclosureRecordRef: string;
  readonly querySurfaceRef: "GET /ops/support/tickets/:supportTicketId/subject-history";
  readonly approvedMode: SupportDisclosureMode;
  readonly historySlices: readonly SupportSubjectHistorySlice[];
  readonly maskedSliceCount: number;
  readonly detailedSliceCount: number;
  readonly withheldSliceRefs: readonly string[];
  readonly reasonCodes: readonly SupportLineageReasonCode[];
  readonly generatedAt: string;
  readonly createdByAuthority: typeof SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME;
}

export interface SupportReadOnlyFallbackProjection {
  readonly projectionName: "SupportReadOnlyFallbackProjection";
  readonly supportReadOnlyFallbackProjectionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly primaryScopeMemberRef: string;
  readonly triggerRef: string;
  readonly ticketVersionRef: string;
  readonly currentMaskScopeRef: string;
  readonly preservedAnchorRef: string;
  readonly preservedArtifactRef: string;
  readonly preservedDraftRef: string | null;
  readonly supportReplayCheckpointRef: string | null;
  readonly supportReplayDraftHoldRef: string | null;
  readonly supportReplayRestoreSettlementRef: string | null;
  readonly heldSupportMutationAttemptRef: string | null;
  readonly heldMessageDispatchEnvelopeRef: string | null;
  readonly heldDeliveryEvidenceBundleRef: string | null;
  readonly heldThreadResolutionGateRef: string | null;
  readonly mode: SupportReadOnlyFallbackMode;
  readonly explanationRef: string;
  readonly reacquireActionRef: string;
  readonly renderedAt: string;
}

export interface SupportTicketWorkspaceProjection {
  readonly projectionName: "SupportTicketWorkspaceProjection";
  readonly supportTicketWorkspaceProjectionId: string;
  readonly supportTicketId: string;
  readonly supportLineageBindingRef: string;
  readonly supportLineageBindingHash: string;
  readonly primaryScopeMemberRef: string;
  readonly ticketVersionRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly selectedTimelineAnchorTupleHashRef: string;
  readonly ticketHeaderRef: string;
  readonly timelineProjectionRef: string;
  readonly supportReachabilityPostureProjectionRef: string;
  readonly actionWorkbenchProjectionRef: string;
  readonly subject360ProjectionRef: string;
  readonly knowledgeStackProjectionRef: string;
  readonly resolutionSnapshotRef: string | null;
  readonly supportSurfacePostureRef: string;
  readonly supportReadOnlyFallbackProjectionRef: string | null;
  readonly dominantRegion: "timeline" | "action_workbench" | "replay_diff" | "handoff_resolution";
  readonly querySurfaceRef: "GET /ops/support/tickets/:supportTicketId";
  readonly workspaceContinuityKey: string;
  readonly ticketHeader: {
    readonly maskedSubjectLabel: string;
    readonly reasonCategory: string;
    readonly severity: SupportSeverity;
    readonly slaState: SupportSlaState;
    readonly shellMode: SupportShellMode;
  };
  readonly timelineEntryPoints: readonly {
    readonly anchorRef: string;
    readonly label: string;
    readonly sourceScopeMemberRef: string;
    readonly artifactBindingRef: string | null;
  }[];
  readonly promotedContext: {
    readonly subject360ProjectionRef: string;
    readonly subjectHistoryQueryRef: string;
    readonly maskScopeRef: string;
    readonly disclosureCeilingRef: string;
  };
  readonly artifactProvenanceRefs: readonly string[];
  readonly allowedActionRefs: readonly string[];
  readonly reasonCodes: readonly SupportLineageReasonCode[];
  readonly renderedAt: string;
  readonly createdByAuthority: typeof SUPPORT_TICKET_WORKSPACE_ASSEMBLER_NAME;
}

export interface SupportTicketWorkspaceResult {
  readonly supportTicket: SupportTicket;
  readonly supportLineageBinding: SupportLineageBinding;
  readonly supportLineageScopeMembers: readonly SupportLineageScopeMember[];
  readonly supportLineageArtifactBindings: readonly SupportLineageArtifactBinding[];
  readonly subjectContextBinding: SupportSubjectContextBinding;
  readonly disclosureRecords: readonly SupportContextDisclosureRecord[];
  readonly subject360Projection: SupportSubject360Projection;
  readonly subjectHistoryQuery: SupportSubjectHistoryQuery;
  readonly subjectHistoryProjection: SupportSubjectHistoryProjection;
  readonly supportReadOnlyFallbackProjection: SupportReadOnlyFallbackProjection | null;
  readonly supportTicketWorkspaceProjection: SupportTicketWorkspaceProjection;
  readonly routeDefinitions: readonly SupportLineageTicketSubjectHistoryRouteDefinition[];
}

export interface SupportSubjectHistoryResult {
  readonly query: SupportSubjectHistoryQuery;
  readonly subjectContextBinding: SupportSubjectContextBinding;
  readonly disclosureRecord: SupportContextDisclosureRecord;
  readonly historyProjection: SupportSubjectHistoryProjection;
  readonly supportLineageBinding: SupportLineageBinding;
  readonly supportLineageScopeMembers: readonly SupportLineageScopeMember[];
  readonly supportLineageArtifactBindings: readonly SupportLineageArtifactBinding[];
}

export interface SupportLineageArtifactProvenanceResult {
  readonly supportTicketId: string;
  readonly supportLineageBinding: SupportLineageBinding;
  readonly artifactBindings: readonly SupportLineageArtifactBinding[];
}

export interface SupportTicketQueryInput {
  readonly supportTicketId: string;
  readonly requestedByRef?: string;
  readonly requestedAt?: string;
  readonly disclosureReasonCode?: string;
  readonly purposeOfUse?: "support_ticket_summary" | "subject_history_review";
  readonly disclosureMode?: SupportDisclosureMode;
  readonly disclosureApprovalState?: SupportDisclosureApprovalState;
  readonly simulateBindingState?: SupportLineageBindingState;
  readonly simulateRuntimeBindingState?: SupportRuntimeBindingState;
}

export interface ScopeMemberSeed {
  readonly supportLineageScopeMemberId: string;
  readonly requestLineageRef: string;
  readonly lineageCaseLinkRef: string;
  readonly domainCaseRef: string;
  readonly governingObjectDescriptorRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly sourceThreadRef: string | null;
  readonly sourceArtifactRef: string | null;
  readonly memberRole: SupportLineageScopeMemberRole;
  readonly continuityWitnessRef: string;
  readonly visibilityMode: SupportLineageVisibilityMode;
  readonly actionability: SupportLineageActionability;
  readonly memberState: SupportLineageMemberState;
  readonly addedAt: string;
  readonly releasedAt: string | null;
}

export interface ArtifactBindingSeed {
  readonly supportLineageArtifactBindingId: string;
  readonly supportLineageScopeMemberRef: string;
  readonly sourceLineageRef: string;
  readonly sourceLineageCaseLinkRef: string;
  readonly sourceEvidenceSnapshotRef: string;
  readonly sourceArtifactRef: string;
  readonly derivedArtifactRef: string;
  readonly noteOrSummaryRef: string;
  readonly parityDigestRef: string;
  readonly bindingState: SupportArtifactBindingState;
  readonly createdAt: string;
  readonly supersededAt: string | null;
}

export interface HistorySliceSeed {
  readonly sliceRef: string;
  readonly sourceType: SupportSubjectHistorySourceType;
  readonly sourceRef: string;
  readonly sourceVersionRef: string;
  readonly supportLineageScopeMemberRef: string;
  readonly supportLineageArtifactBindingRef: string | null;
  readonly chronologyAt: string;
  readonly maskedSummary: string;
  readonly boundedDetail: string;
  readonly visibilityMode: SupportLineageVisibilityMode;
}

export interface SupportLineageFixture {
  readonly supportTicketId: string;
  readonly originRef: string;
  readonly originChannel: string;
  readonly subjectRef: string;
  readonly maskedSubjectLabel: string;
  readonly supportLineageBindingRef: string;
  readonly primaryRequestLineageRef: string;
  readonly primaryLineageCaseLinkRef: string;
  readonly governingObjectDescriptorRef: string;
  readonly governingObjectRef: string;
  readonly governingObjectVersionRef: string;
  readonly reasonCategory: string;
  readonly severity: SupportSeverity;
  readonly slaState: SupportSlaState;
  readonly ticketState: SupportTicketState;
  readonly currentOwnerRef: string;
  readonly queueKey: string;
  readonly latestSubjectEventRef: string;
  readonly selectedTimelineAnchorRef: string;
  readonly activeConversationRef: string;
  readonly currentKnowledgePackRef: string;
  readonly currentHistoryPackRef: string;
  readonly effectiveMaskScopeRef: string;
  readonly disclosureCeilingRef: string;
  readonly allowedActionRefs: readonly string[];
  readonly currentActionLeaseRef: string | null;
  readonly activeMutationAttemptRef: string | null;
  readonly activeReadOnlyFallbackRef: string | null;
  readonly ticketVersionRef: string;
  readonly shellMode: SupportShellMode;
  readonly staffWorkspaceConsistencyProjectionRef: string;
  readonly workspaceSliceTrustProjectionRef: string;
  readonly supportSurfaceRuntimeBindingRef: string;
  readonly sourceLineageRefs: readonly string[];
  readonly sourceThreadRefs: readonly string[];
  readonly sourceArtifactRefs: readonly string[];
  readonly scopeMembers: readonly ScopeMemberSeed[];
  readonly artifactBindings: readonly ArtifactBindingSeed[];
  readonly historySlices: readonly HistorySliceSeed[];
  readonly repeatContactSignalRef: string;
  readonly contactRouteHealthState: "clear" | "at_risk" | "blocked" | "disputed";
  readonly recentOutcomeRefs: readonly string[];
  readonly generatedAt: string;
}

export interface SupportLineageProjectionRepository {
  getFixture(supportTicketId: string): SupportLineageFixture | null;
}

function stableHash(parts: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 24);
}

function clone<T>(value: T): T {
  return structuredClone(value) as T;
}

function requireValue<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
  return value;
}

function createDefaultSupportLineageFixtures(): readonly SupportLineageFixture[] {
  return [
    {
      supportTicketId: SUPPORT_LINEAGE_FIXTURE_TICKET_ID,
      originRef: "support_origin_218_delivery_failure",
      originChannel: "ops_support_inbox",
      subjectRef: "nhs_subject_214",
      maskedSubjectLabel: "Subject ending 214",
      supportLineageBindingRef: "support_lineage_binding_218_delivery_failure_v1",
      primaryRequestLineageRef: "lineage_214_a",
      primaryLineageCaseLinkRef: "lineage_case_link_214_callback_message",
      governingObjectDescriptorRef: "ConversationThreadProjection",
      governingObjectRef: "thread_214_a",
      governingObjectVersionRef: "thread_214_a_v5",
      reasonCategory: "delivery_failure_and_reply_risk",
      severity: "high",
      slaState: "at_risk",
      ticketState: "open",
      currentOwnerRef: "support_user_218_primary",
      queueKey: "support.delivery-repair.at-risk",
      latestSubjectEventRef: "envelope_214_reply",
      selectedTimelineAnchorRef: "envelope_214_reply",
      activeConversationRef: "cluster_214_message_a",
      currentKnowledgePackRef: "knowledge_pack_218_delivery_repair_v1",
      currentHistoryPackRef: "history_pack_218_subject_summary_v1",
      effectiveMaskScopeRef: "mask_scope_218_support_summary",
      disclosureCeilingRef: "disclosure_ceiling_218_bounded_support",
      allowedActionRefs: [
        "support_action_preview_resend_218",
        "support_action_open_subject_history_218",
      ],
      currentActionLeaseRef: "support_action_lease_218_delivery_repair",
      activeMutationAttemptRef: null,
      activeReadOnlyFallbackRef: null,
      ticketVersionRef: "support_ticket_218_delivery_failure_v3",
      shellMode: "live",
      staffWorkspaceConsistencyProjectionRef: "staff_workspace_consistency_218_support",
      workspaceSliceTrustProjectionRef: "workspace_slice_trust_218_support",
      supportSurfaceRuntimeBindingRef: "support_surface_runtime_binding_218_live",
      sourceLineageRefs: ["lineage_214_a", "lineage_record_213_result_a"],
      sourceThreadRefs: ["thread_214_a", "callback_214_a"],
      sourceArtifactRefs: ["record_artifact_record_213_result_a", "conversation_excerpt_214_reply"],
      scopeMembers: [
        {
          supportLineageScopeMemberId: "support_scope_member_218_primary_thread",
          requestLineageRef: "lineage_214_a",
          lineageCaseLinkRef: "lineage_case_link_214_callback_message",
          domainCaseRef: "cluster_214_message_a",
          governingObjectDescriptorRef: "ConversationThreadProjection",
          governingObjectRef: "thread_214_a",
          governingObjectVersionRef: "thread_214_a_v5",
          sourceThreadRef: "thread_214_a",
          sourceArtifactRef: "conversation_excerpt_214_reply",
          memberRole: "primary_action_target",
          continuityWitnessRef: "continuity_214_callback",
          visibilityMode: "repair_actionable",
          actionability: "governed_mutation",
          memberState: "active",
          addedAt: "2026-04-16T13:55:00.000Z",
          releasedAt: null,
        },
        {
          supportLineageScopeMemberId: "support_scope_member_218_callback_context",
          requestLineageRef: "lineage_214_a",
          lineageCaseLinkRef: "lineage_case_link_214_callback_message",
          domainCaseRef: "callback_214_a",
          governingObjectDescriptorRef: "PatientCallbackStatusProjection",
          governingObjectRef: "patient_callback_status_214_a",
          governingObjectVersionRef: "callback_214_a_v3",
          sourceThreadRef: "callback_214_a",
          sourceArtifactRef: null,
          memberRole: "communication_context",
          continuityWitnessRef: "continuity_214_callback",
          visibilityMode: "masked_summary",
          actionability: "observe_only",
          memberState: "active",
          addedAt: "2026-04-16T13:56:00.000Z",
          releasedAt: null,
        },
        {
          supportLineageScopeMemberId: "support_scope_member_218_record_artifact",
          requestLineageRef: "lineage_record_213_result_a",
          lineageCaseLinkRef: "lineage_case_link_213_result_follow_up",
          domainCaseRef: "record_213_result_a",
          governingObjectDescriptorRef: "PatientRecordArtifactProjection",
          governingObjectRef: "record_artifact_record_213_result_a",
          governingObjectVersionRef: "record_artifact_record_213_result_a_v2",
          sourceThreadRef: null,
          sourceArtifactRef: "record_artifact_record_213_result_a",
          memberRole: "artifact_provenance",
          continuityWitnessRef: "PatientPortalContinuityEvidenceBundle_record_213_result_a",
          visibilityMode: "bounded_detail",
          actionability: "artifact_only",
          memberState: "active",
          addedAt: "2026-04-16T13:57:00.000Z",
          releasedAt: null,
        },
        {
          supportLineageScopeMemberId: "support_scope_member_218_identity_repair_watch",
          requestLineageRef: "lineage_214_a",
          lineageCaseLinkRef: "lineage_case_link_214_identity_watch",
          domainCaseRef: "identity_repair_watch_218",
          governingObjectDescriptorRef: "IdentityRepairCase",
          governingObjectRef: "identity_repair_case_218_watch",
          governingObjectVersionRef: "identity_repair_case_218_watch_v1",
          sourceThreadRef: null,
          sourceArtifactRef: null,
          memberRole: "identity_repair_dependency",
          continuityWitnessRef: "identity_binding_authority_witness_218",
          visibilityMode: "masked_summary",
          actionability: "observe_only",
          memberState: "active",
          addedAt: "2026-04-16T13:58:00.000Z",
          releasedAt: null,
        },
      ],
      artifactBindings: [
        {
          supportLineageArtifactBindingId: "support_artifact_binding_218_reply_excerpt",
          supportLineageScopeMemberRef: "support_scope_member_218_primary_thread",
          sourceLineageRef: "lineage_214_a",
          sourceLineageCaseLinkRef: "lineage_case_link_214_callback_message",
          sourceEvidenceSnapshotRef: "evidence_snapshot_214_reply",
          sourceArtifactRef: "conversation_excerpt_214_reply",
          derivedArtifactRef: "support_summary_excerpt_218_reply",
          noteOrSummaryRef: "support_note_218_reply_summary",
          parityDigestRef: "parity_digest_218_reply_excerpt",
          bindingState: "active",
          createdAt: "2026-04-16T14:00:00.000Z",
          supersededAt: null,
        },
        {
          supportLineageArtifactBindingId: "support_artifact_binding_218_record_result",
          supportLineageScopeMemberRef: "support_scope_member_218_record_artifact",
          sourceLineageRef: "lineage_record_213_result_a",
          sourceLineageCaseLinkRef: "lineage_case_link_213_result_follow_up",
          sourceEvidenceSnapshotRef: "source_bundle_record_213_result_a",
          sourceArtifactRef: "record_artifact_record_213_result_a",
          derivedArtifactRef: "support_record_summary_218_fbc",
          noteOrSummaryRef: "support_note_218_record_context",
          parityDigestRef: "ArtifactParityDigest_record_213_result_a",
          bindingState: "active",
          createdAt: "2026-04-16T14:01:00.000Z",
          supersededAt: null,
        },
      ],
      historySlices: [
        {
          sliceRef: "support_history_slice_218_request",
          sourceType: "request",
          sourceRef: "request_214_a",
          sourceVersionRef: "request_214_a_v4",
          supportLineageScopeMemberRef: "support_scope_member_218_primary_thread",
          supportLineageArtifactBindingRef: null,
          chronologyAt: "2026-04-16T10:00:00.000Z",
          maskedSummary: "Request lineage is open and awaiting review of a recent reply.",
          boundedDetail:
            "Request request_214_a is still bound to lineage_214_a and cannot be closed while delivery risk is at risk.",
          visibilityMode: "masked_summary",
        },
        {
          sliceRef: "support_history_slice_218_message_reply",
          sourceType: "message_thread",
          sourceRef: "thread_214_a",
          sourceVersionRef: "thread_214_a_v5",
          supportLineageScopeMemberRef: "support_scope_member_218_primary_thread",
          supportLineageArtifactBindingRef: "support_artifact_binding_218_reply_excerpt",
          chronologyAt: "2026-04-16T13:45:00.000Z",
          maskedSummary: "A replacement-photo reply exists with delivery evidence still pending.",
          boundedDetail:
            "The support-visible reply excerpt is bound to support_artifact_binding_218_reply_excerpt and cannot become durable without that provenance row.",
          visibilityMode: "repair_actionable",
        },
        {
          sliceRef: "support_history_slice_218_callback",
          sourceType: "callback_case",
          sourceRef: "callback_214_a",
          sourceVersionRef: "callback_214_a_v3",
          supportLineageScopeMemberRef: "support_scope_member_218_callback_context",
          supportLineageArtifactBindingRef: null,
          chronologyAt: "2026-04-16T11:00:00.000Z",
          maskedSummary: "A callback is scheduled in the same conversation cluster.",
          boundedDetail:
            "Callback case callback_214_a is observe-only context and does not supply mutation authority for this ticket.",
          visibilityMode: "masked_summary",
        },
        {
          sliceRef: "support_history_slice_218_record_artifact",
          sourceType: "record_artifact",
          sourceRef: "record_artifact_record_213_result_a",
          sourceVersionRef: "record_artifact_record_213_result_a_v2",
          supportLineageScopeMemberRef: "support_scope_member_218_record_artifact",
          supportLineageArtifactBindingRef: "support_artifact_binding_218_record_result",
          chronologyAt: "2026-04-16T12:30:00.000Z",
          maskedSummary:
            "A related record summary is available through source-authoritative artifact parity.",
          boundedDetail:
            "The record summary remains subordinate to ArtifactParityDigest_record_213_result_a and source_bundle_record_213_result_a.",
          visibilityMode: "bounded_detail",
        },
        {
          sliceRef: "support_history_slice_218_identity_watch",
          sourceType: "identity_repair",
          sourceRef: "identity_repair_case_218_watch",
          sourceVersionRef: "identity_repair_case_218_watch_v1",
          supportLineageScopeMemberRef: "support_scope_member_218_identity_repair_watch",
          supportLineageArtifactBindingRef: null,
          chronologyAt: "2026-04-16T13:58:00.000Z",
          maskedSummary:
            "Identity repair is watch-only; no PHI-bearing detail is widened by default.",
          boundedDetail:
            "IdentityBindingAuthority remains the only service allowed to settle a binding correction.",
          visibilityMode: "masked_summary",
        },
      ],
      repeatContactSignalRef: "repeat_contact_signal_218_same_lineage",
      contactRouteHealthState: "at_risk",
      recentOutcomeRefs: [
        "ConversationCommandSettlement_214_reply",
        "CallbackResolutionGate_214_a",
      ],
      generatedAt: "2026-04-16T14:05:00.000Z",
    },
  ];
}

export function createInMemorySupportLineageProjectionRepository(
  fixtures: readonly SupportLineageFixture[] = createDefaultSupportLineageFixtures(),
): SupportLineageProjectionRepository {
  const byTicketId = new Map(fixtures.map((fixture) => [fixture.supportTicketId, clone(fixture)]));
  return {
    getFixture(supportTicketId: string) {
      const fixture = byTicketId.get(supportTicketId);
      return fixture ? clone(fixture) : null;
    },
  };
}

function assembleScopeMembers(
  fixture: SupportLineageFixture,
): readonly SupportLineageScopeMember[] {
  return fixture.scopeMembers.map((member) => ({
    projectionName: "SupportLineageScopeMember",
    supportLineageBindingRef: fixture.supportLineageBindingRef,
    ...member,
  }));
}

function assembleArtifactBindings(
  fixture: SupportLineageFixture,
): readonly SupportLineageArtifactBinding[] {
  return fixture.artifactBindings.map((binding) => ({
    projectionName: "SupportLineageArtifactBinding",
    supportLineageBindingRef: fixture.supportLineageBindingRef,
    supportTicketId: fixture.supportTicketId,
    maskScopeRef: fixture.effectiveMaskScopeRef,
    disclosureCeilingRef: fixture.disclosureCeilingRef,
    ...binding,
  }));
}

function assembleSupportLineageBinding(
  fixture: SupportLineageFixture,
  scopeMembers: readonly SupportLineageScopeMember[],
  input: SupportTicketQueryInput,
): SupportLineageBinding {
  const primaryScopeMember = requireValue(
    scopeMembers.find((member) => member.memberRole === "primary_action_target"),
    "Support lineage fixture must include a primary action target scope member.",
  );
  const bindingState = input.simulateBindingState ?? "active";
  const bindingHash = stableHash([
    fixture.supportLineageBindingRef,
    fixture.supportTicketId,
    fixture.subjectRef,
    fixture.primaryRequestLineageRef,
    fixture.primaryLineageCaseLinkRef,
    fixture.governingObjectRef,
    fixture.governingObjectVersionRef,
    scopeMembers.map((member) => [
      member.supportLineageScopeMemberId,
      member.governingObjectRef,
      member.memberRole,
      member.actionability,
      member.memberState,
    ]),
    fixture.effectiveMaskScopeRef,
    fixture.disclosureCeilingRef,
    bindingState,
  ]);
  return {
    projectionName: "SupportLineageBinding",
    supportLineageBindingId: fixture.supportLineageBindingRef,
    supportTicketId: fixture.supportTicketId,
    subjectRef: fixture.subjectRef,
    primaryRequestLineageRef: fixture.primaryRequestLineageRef,
    primaryLineageCaseLinkRef: fixture.primaryLineageCaseLinkRef,
    primaryScopeMemberRef: primaryScopeMember.supportLineageScopeMemberId,
    governingObjectDescriptorRef: fixture.governingObjectDescriptorRef,
    governingObjectRef: fixture.governingObjectRef,
    governingObjectVersionRef: fixture.governingObjectVersionRef,
    scopeMemberRefs: scopeMembers.map((member) => member.supportLineageScopeMemberId),
    sourceLineageRefs: fixture.sourceLineageRefs,
    sourceThreadRefs: fixture.sourceThreadRefs,
    sourceArtifactRefs: fixture.sourceArtifactRefs,
    maskScopeRef: fixture.effectiveMaskScopeRef,
    disclosureCeilingRef: fixture.disclosureCeilingRef,
    bindingHash,
    supersedesSupportLineageBindingRef: null,
    bindingState,
    createdAt: "2026-04-16T14:02:00.000Z",
    supersededAt: bindingState === "superseded" ? "2026-04-16T14:04:00.000Z" : null,
  };
}

function shouldForceReadOnly(
  binding: SupportLineageBinding,
  input: SupportTicketQueryInput,
): boolean {
  return (
    binding.bindingState !== "active" ||
    input.simulateRuntimeBindingState === "recovery_only" ||
    input.simulateRuntimeBindingState === "blocked"
  );
}

function assembleSupportReadOnlyFallbackProjection(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  input: SupportTicketQueryInput,
): SupportReadOnlyFallbackProjection | null {
  if (!shouldForceReadOnly(binding, input)) return null;
  const mode: SupportReadOnlyFallbackMode =
    input.simulateRuntimeBindingState === "blocked" ? "blocked_scope" : "stale_reacquire";
  return {
    projectionName: "SupportReadOnlyFallbackProjection",
    supportReadOnlyFallbackProjectionId: "support_read_only_fallback_218_lineage_reacquire",
    supportTicketId: fixture.supportTicketId,
    supportLineageBindingRef: binding.supportLineageBindingId,
    supportLineageBindingHash: binding.bindingHash,
    primaryScopeMemberRef: binding.primaryScopeMemberRef,
    triggerRef:
      binding.bindingState === "active"
        ? "support_surface_runtime_binding_drift_218"
        : "support_lineage_binding_state_drift_218",
    ticketVersionRef: fixture.ticketVersionRef,
    currentMaskScopeRef: fixture.effectiveMaskScopeRef,
    preservedAnchorRef: fixture.selectedTimelineAnchorRef,
    preservedArtifactRef: fixture.sourceArtifactRefs[0] ?? "none",
    preservedDraftRef: null,
    supportReplayCheckpointRef: null,
    supportReplayDraftHoldRef: null,
    supportReplayRestoreSettlementRef: null,
    heldSupportMutationAttemptRef: fixture.activeMutationAttemptRef,
    heldMessageDispatchEnvelopeRef: "MessageDispatchEnvelope_214_reply",
    heldDeliveryEvidenceBundleRef: "MessageDeliveryEvidenceBundle_214_reply",
    heldThreadResolutionGateRef: "ThreadResolutionGate_214_a",
    mode,
    explanationRef: "support_read_only_explanation_218_revalidate_lineage_binding",
    reacquireActionRef: "support_action_reacquire_lineage_binding_218",
    renderedAt: input.requestedAt ?? fixture.generatedAt,
  };
}

function assembleSupportTicket(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  fallback: SupportReadOnlyFallbackProjection | null,
): SupportTicket {
  return {
    projectionName: "SupportTicket",
    supportTicketId: fixture.supportTicketId,
    originRef: fixture.originRef,
    originChannel: fixture.originChannel,
    subjectRef: fixture.subjectRef,
    supportLineageBindingRef: binding.supportLineageBindingId,
    supportLineageBindingHash: binding.bindingHash,
    primaryRequestLineageRef: fixture.primaryRequestLineageRef,
    primaryLineageCaseLinkRef: fixture.primaryLineageCaseLinkRef,
    activeScopeMemberRefs: binding.scopeMemberRefs,
    reasonCategory: fixture.reasonCategory,
    severity: fixture.severity,
    slaState: fixture.slaState,
    ticketState: fixture.ticketState,
    currentOwnerRef: fixture.currentOwnerRef,
    queueKey: fixture.queueKey,
    latestSubjectEventRef: fixture.latestSubjectEventRef,
    selectedTimelineAnchorRef: fixture.selectedTimelineAnchorRef,
    selectedTimelineAnchorTupleHashRef: stableHash([
      fixture.selectedTimelineAnchorRef,
      binding.bindingHash,
      fixture.ticketVersionRef,
    ]),
    activeConversationRef: fixture.activeConversationRef,
    currentKnowledgePackRef: fixture.currentKnowledgePackRef,
    currentHistoryPackRef: fixture.currentHistoryPackRef,
    effectiveMaskScopeRef: fixture.effectiveMaskScopeRef,
    allowedActionRefs: fallback
      ? ["support_action_reacquire_lineage_binding_218"]
      : fixture.allowedActionRefs,
    currentActionLeaseRef: fallback ? null : fixture.currentActionLeaseRef,
    activeMutationAttemptRef: fixture.activeMutationAttemptRef,
    activeIdentityCorrectionRequestRef: null,
    activeIdentityRepairCaseRef: "identity_repair_case_218_watch",
    identityRepairFreezeRef: null,
    identityRepairReleaseSettlementRef: null,
    activeReplayCheckpointRef: null,
    activeObserveSessionRef: null,
    activeTransferRef: null,
    activeTransferAcceptanceSettlementRef: null,
    activeReadOnlyFallbackRef: fallback?.supportReadOnlyFallbackProjectionId ?? null,
    ticketVersionRef: fixture.ticketVersionRef,
    shellMode: fallback ? "read_only_recovery" : fixture.shellMode,
    staffWorkspaceConsistencyProjectionRef: fixture.staffWorkspaceConsistencyProjectionRef,
    workspaceSliceTrustProjectionRef: fixture.workspaceSliceTrustProjectionRef,
    supportSurfaceRuntimeBindingRef: fixture.supportSurfaceRuntimeBindingRef,
    releaseRecoveryDispositionRef: fallback ? "release_recovery_disposition_218_same_shell" : null,
    taskCompletionSettlementEnvelopeRef: null,
    lastResolutionSummaryRef: null,
  };
}

function assembleSubjectContextBinding(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  artifactBindings: readonly SupportLineageArtifactBinding[],
  input: SupportTicketQueryInput,
): SupportSubjectContextBinding {
  const bindingState =
    binding.bindingState === "active" && input.simulateRuntimeBindingState !== "blocked"
      ? "live"
      : "summary_only";
  return {
    projectionName: "SupportSubjectContextBinding",
    subjectContextBindingId: "support_subject_context_binding_218_summary",
    supportTicketId: fixture.supportTicketId,
    supportLineageBindingRef: binding.supportLineageBindingId,
    subjectRef: fixture.subjectRef,
    purposeOfUse: input.purposeOfUse ?? "support_ticket_summary",
    maskScopeRef: fixture.effectiveMaskScopeRef,
    disclosureCeilingRef: fixture.disclosureCeilingRef,
    allowedScopeMemberRefs: binding.scopeMemberRefs,
    allowedArtifactBindingRefs: artifactBindings
      .filter((artifact) => artifact.bindingState === "active")
      .map((artifact) => artifact.supportLineageArtifactBindingId),
    subjectSummaryPackRef: "subject_summary_pack_218_masked",
    disclosurePolicyRef: "support_disclosure_policy_218_minimum_necessary",
    supportSurfaceRuntimeBindingRef: fixture.supportSurfaceRuntimeBindingRef,
    bindingHash: stableHash([
      fixture.subjectRef,
      binding.bindingHash,
      fixture.effectiveMaskScopeRef,
      fixture.disclosureCeilingRef,
      input.purposeOfUse ?? "support_ticket_summary",
    ]),
    bindingState,
    expiresAt: "2026-04-16T15:05:00.000Z",
    createdAt: input.requestedAt ?? fixture.generatedAt,
  };
}

function approveDisclosureMode(
  requestedMode: SupportDisclosureMode,
  input: SupportTicketQueryInput,
  contextBinding: SupportSubjectContextBinding,
): SupportDisclosureMode {
  if (requestedMode !== "bounded_detail") return "summary_only";
  if (contextBinding.bindingState !== "live") return "summary_only";
  if (input.disclosureApprovalState === "denied" || input.disclosureApprovalState === "expired") {
    return "summary_only";
  }
  if (input.disclosureApprovalState === "approved") return "bounded_detail";
  return "summary_only";
}

function assembleDisclosureRecord(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  contextBinding: SupportSubjectContextBinding,
  artifactBindings: readonly SupportLineageArtifactBinding[],
  input: SupportTicketQueryInput,
): SupportContextDisclosureRecord {
  const requestedMode = input.disclosureMode ?? "summary_only";
  const approvedMode = approveDisclosureMode(requestedMode, input, contextBinding);
  const approvalState: SupportDisclosureApprovalState =
    requestedMode === "bounded_detail"
      ? approvedMode === "bounded_detail"
        ? "approved"
        : (input.disclosureApprovalState ?? "denied")
      : "not_required";
  return {
    projectionName: "SupportContextDisclosureRecord",
    supportContextDisclosureRecordId: `support_context_disclosure_218_${approvedMode}`,
    supportTicketId: fixture.supportTicketId,
    supportLineageBindingRef: binding.supportLineageBindingId,
    subjectContextBindingRef: contextBinding.subjectContextBindingId,
    requestedByRef: input.requestedByRef ?? "support_user_218_primary",
    reasonCode: input.disclosureReasonCode ?? "SUPPORT_HISTORY_SUMMARY_DEFAULT",
    requestedMode,
    approvedMode,
    approvalState,
    maskScopeRef: fixture.effectiveMaskScopeRef,
    disclosureCeilingRef: fixture.disclosureCeilingRef,
    revealedScopeMemberRefs:
      approvedMode === "bounded_detail" ? contextBinding.allowedScopeMemberRefs : [],
    revealedArtifactBindingRefs:
      approvedMode === "bounded_detail"
        ? artifactBindings.map((bindingRow) => bindingRow.supportLineageArtifactBindingId)
        : [],
    collapsedAt:
      approvedMode === "bounded_detail" ? null : (input.requestedAt ?? fixture.generatedAt),
    expiresAt: "2026-04-16T15:05:00.000Z",
    recordedAt: input.requestedAt ?? fixture.generatedAt,
  };
}

function assembleSubject360Projection(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  contextBinding: SupportSubjectContextBinding,
  artifactBindings: readonly SupportLineageArtifactBinding[],
  disclosureRecords: readonly SupportContextDisclosureRecord[],
): SupportSubject360Projection {
  return {
    projectionName: "SupportSubject360Projection",
    supportSubject360ProjectionId: "support_subject_360_projection_218_masked",
    supportTicketId: fixture.supportTicketId,
    subjectRef: fixture.subjectRef,
    supportLineageBindingRef: binding.supportLineageBindingId,
    subjectContextBindingRef: contextBinding.subjectContextBindingId,
    maskScopeRef: fixture.effectiveMaskScopeRef,
    disclosureCeilingRef: fixture.disclosureCeilingRef,
    compactIdentitySummaryRef: "compact_identity_summary_218_masked",
    maskedSubjectLabel: fixture.maskedSubjectLabel,
    contactRouteHealthState: fixture.contactRouteHealthState,
    activeOpenObjectRefs: [fixture.governingObjectRef, ...fixture.sourceThreadRefs],
    recentOutcomeRefs: fixture.recentOutcomeRefs,
    repeatContactSignalRef: fixture.repeatContactSignalRef,
    supportLineageScopeMemberRefs: binding.scopeMemberRefs,
    supportLineageArtifactBindingRefs: artifactBindings.map(
      (artifact) => artifact.supportLineageArtifactBindingId,
    ),
    disclosureRecordRefs: disclosureRecords.map(
      (record) => record.supportContextDisclosureRecordId,
    ),
    summaryRows: [
      {
        rowRef: "support_subject_360_row_identity",
        label: "Identity",
        maskedValue: fixture.maskedSubjectLabel,
        sourceRef: "IdentityBindingAuthority",
      },
      {
        rowRef: "support_subject_360_row_contact",
        label: "Contact route health",
        maskedValue: fixture.contactRouteHealthState,
        sourceRef: "ReachabilityAssessmentRecord",
      },
      {
        rowRef: "support_subject_360_row_open_objects",
        label: "Open objects",
        maskedValue: `${binding.scopeMemberRefs.length} scoped objects`,
        sourceRef: binding.supportLineageBindingId,
      },
      {
        rowRef: "support_subject_360_row_recent_outcomes",
        label: "Recent outcomes",
        maskedValue: `${fixture.recentOutcomeRefs.length} bounded outcomes`,
        sourceRef: "ConversationCommandSettlement",
      },
    ],
    querySurfaceRef: "GET /ops/support/tickets/:supportTicketId/subject-360",
    reasonCodes: [
      "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
      "SUPPORT_218_SUBJECT_360_SUMMARY_FIRST",
      "SUPPORT_218_SCOPE_MEMBER_EXPLICIT",
    ],
    generatedAt: fixture.generatedAt,
    createdByAuthority: SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME,
  };
}

function assembleSubjectHistoryQuery(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  contextBinding: SupportSubjectContextBinding,
  disclosureRecord: SupportContextDisclosureRecord,
  input: SupportTicketQueryInput,
): SupportSubjectHistoryQuery {
  const requestedMode = input.disclosureMode ?? "summary_only";
  return {
    projectionName: "SupportSubjectHistoryQuery",
    supportSubjectHistoryQueryId: `support_subject_history_query_218_${disclosureRecord.approvedMode}`,
    supportTicketId: fixture.supportTicketId,
    supportLineageBindingRef: binding.supportLineageBindingId,
    subjectContextBindingRef: contextBinding.subjectContextBindingId,
    requestedByRef: input.requestedByRef ?? "support_user_218_primary",
    purposeOfUse: input.purposeOfUse ?? "support_ticket_summary",
    requestedMode,
    approvedMode: disclosureRecord.approvedMode,
    reasonCode: disclosureRecord.reasonCode,
    maskScopeRef: fixture.effectiveMaskScopeRef,
    disclosureCeilingRef: fixture.disclosureCeilingRef,
    queryTupleHash: stableHash([
      fixture.supportTicketId,
      binding.bindingHash,
      contextBinding.bindingHash,
      disclosureRecord.supportContextDisclosureRecordId,
      requestedMode,
      disclosureRecord.approvedMode,
    ]),
    requestedAt: input.requestedAt ?? fixture.generatedAt,
  };
}

function assembleSubjectHistoryProjection(
  fixture: SupportLineageFixture,
  binding: SupportLineageBinding,
  contextBinding: SupportSubjectContextBinding,
  disclosureRecord: SupportContextDisclosureRecord,
): SupportSubjectHistoryProjection {
  const canShowDetail = disclosureRecord.approvedMode === "bounded_detail";
  const historySlices = fixture.historySlices.map((slice) => {
    const detailAllowed =
      canShowDetail &&
      disclosureRecord.revealedScopeMemberRefs.includes(slice.supportLineageScopeMemberRef) &&
      (slice.supportLineageArtifactBindingRef === null ||
        disclosureRecord.revealedArtifactBindingRefs.includes(
          slice.supportLineageArtifactBindingRef,
        ));
    return {
      sliceRef: slice.sliceRef,
      sourceType: slice.sourceType,
      sourceRef: slice.sourceRef,
      sourceVersionRef: slice.sourceVersionRef,
      supportLineageScopeMemberRef: slice.supportLineageScopeMemberRef,
      supportLineageArtifactBindingRef: slice.supportLineageArtifactBindingRef,
      chronologyAt: slice.chronologyAt,
      maskedSummary: slice.maskedSummary,
      boundedDetail: detailAllowed ? slice.boundedDetail : null,
      visibilityMode: slice.visibilityMode,
      disclosureState: detailAllowed ? "detail_visible" : "summary_visible",
      reasonCodes: [
        "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
        "SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED",
      ],
    } satisfies SupportSubjectHistorySlice;
  });
  return {
    projectionName: "SupportSubjectHistoryProjection",
    supportSubjectHistoryProjectionId: `support_subject_history_projection_218_${disclosureRecord.approvedMode}`,
    supportTicketId: fixture.supportTicketId,
    subjectRef: fixture.subjectRef,
    supportLineageBindingRef: binding.supportLineageBindingId,
    subjectContextBindingRef: contextBinding.subjectContextBindingId,
    disclosureRecordRef: disclosureRecord.supportContextDisclosureRecordId,
    querySurfaceRef: "GET /ops/support/tickets/:supportTicketId/subject-history",
    approvedMode: disclosureRecord.approvedMode,
    historySlices,
    maskedSliceCount: historySlices.filter((slice) => slice.disclosureState === "summary_visible")
      .length,
    detailedSliceCount: historySlices.filter((slice) => slice.disclosureState === "detail_visible")
      .length,
    withheldSliceRefs: [],
    reasonCodes: [
      "SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED",
      "SUPPORT_218_ARTIFACT_PROVENANCE_BOUND",
      "SUPPORT_218_NO_TICKET_LOCAL_TRUTH",
    ],
    generatedAt: fixture.generatedAt,
    createdByAuthority: SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME,
  };
}

function assembleTicketWorkspaceProjection(
  fixture: SupportLineageFixture,
  ticket: SupportTicket,
  binding: SupportLineageBinding,
  scopeMembers: readonly SupportLineageScopeMember[],
  artifactBindings: readonly SupportLineageArtifactBinding[],
  subject360Projection: SupportSubject360Projection,
  subjectHistoryQuery: SupportSubjectHistoryQuery,
  fallback: SupportReadOnlyFallbackProjection | null,
): SupportTicketWorkspaceProjection {
  const primaryScopeMember = requireValue(
    scopeMembers.find(
      (member) => member.supportLineageScopeMemberId === binding.primaryScopeMemberRef,
    ),
    "Support lineage binding must point to a real primary scope member.",
  );
  const timelineEntryPoints = scopeMembers.map((member) => {
    const artifactBinding = artifactBindings.find(
      (artifact) => artifact.supportLineageScopeMemberRef === member.supportLineageScopeMemberId,
    );
    return {
      anchorRef: member.sourceThreadRef ?? member.sourceArtifactRef ?? member.governingObjectRef,
      label: member.memberRole,
      sourceScopeMemberRef: member.supportLineageScopeMemberId,
      artifactBindingRef: artifactBinding?.supportLineageArtifactBindingId ?? null,
    };
  });
  return {
    projectionName: "SupportTicketWorkspaceProjection",
    supportTicketWorkspaceProjectionId: "support_ticket_workspace_projection_218_delivery_failure",
    supportTicketId: fixture.supportTicketId,
    supportLineageBindingRef: binding.supportLineageBindingId,
    supportLineageBindingHash: binding.bindingHash,
    primaryScopeMemberRef: primaryScopeMember.supportLineageScopeMemberId,
    ticketVersionRef: fixture.ticketVersionRef,
    selectedTimelineAnchorRef: ticket.selectedTimelineAnchorRef,
    selectedTimelineAnchorTupleHashRef: ticket.selectedTimelineAnchorTupleHashRef,
    ticketHeaderRef: "support_ticket_header_218_delivery_failure",
    timelineProjectionRef: "support_omnichannel_timeline_projection_218_placeholder",
    supportReachabilityPostureProjectionRef: "support_reachability_posture_218_at_risk",
    actionWorkbenchProjectionRef: "support_action_workbench_projection_218_placeholder",
    subject360ProjectionRef: subject360Projection.supportSubject360ProjectionId,
    knowledgeStackProjectionRef: fixture.currentKnowledgePackRef,
    resolutionSnapshotRef: null,
    supportSurfacePostureRef: fallback
      ? "support_surface_posture_218_read_only_recovery"
      : "support_surface_posture_218_live",
    supportReadOnlyFallbackProjectionRef: fallback?.supportReadOnlyFallbackProjectionId ?? null,
    dominantRegion: fallback ? "timeline" : "action_workbench",
    querySurfaceRef: "GET /ops/support/tickets/:supportTicketId",
    workspaceContinuityKey: stableHash([
      fixture.supportTicketId,
      binding.bindingHash,
      ticket.selectedTimelineAnchorTupleHashRef,
      ticket.shellMode,
    ]),
    ticketHeader: {
      maskedSubjectLabel: fixture.maskedSubjectLabel,
      reasonCategory: fixture.reasonCategory,
      severity: fixture.severity,
      slaState: fixture.slaState,
      shellMode: ticket.shellMode,
    },
    timelineEntryPoints,
    promotedContext: {
      subject360ProjectionRef: subject360Projection.supportSubject360ProjectionId,
      subjectHistoryQueryRef: subjectHistoryQuery.supportSubjectHistoryQueryId,
      maskScopeRef: fixture.effectiveMaskScopeRef,
      disclosureCeilingRef: fixture.disclosureCeilingRef,
    },
    artifactProvenanceRefs: artifactBindings.map(
      (artifact) => artifact.supportLineageArtifactBindingId,
    ),
    allowedActionRefs: ticket.allowedActionRefs,
    reasonCodes: fallback
      ? [
          "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
          "SUPPORT_218_TICKET_WORKSPACE_ANATOMY",
          "SUPPORT_218_READ_ONLY_FALLBACK_SAME_SHELL",
        ]
      : [
          "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
          "SUPPORT_218_SCOPE_MEMBER_EXPLICIT",
          "SUPPORT_218_ARTIFACT_PROVENANCE_BOUND",
          "SUPPORT_218_TICKET_WORKSPACE_ANATOMY",
        ],
    renderedAt: fixture.generatedAt,
    createdByAuthority: SUPPORT_TICKET_WORKSPACE_ASSEMBLER_NAME,
  };
}

export class SupportLineageTicketProjectionService {
  readonly #repository: SupportLineageProjectionRepository;

  constructor(repository: SupportLineageProjectionRepository) {
    this.#repository = repository;
  }

  getSupportTicketWorkspace(input: SupportTicketQueryInput): SupportTicketWorkspaceResult {
    const fixture = requireValue(
      this.#repository.getFixture(input.supportTicketId),
      `Unknown support ticket: ${input.supportTicketId}`,
    );
    const scopeMembers = assembleScopeMembers(fixture);
    const artifactBindings = assembleArtifactBindings(fixture);
    const supportLineageBinding = assembleSupportLineageBinding(fixture, scopeMembers, input);
    const supportReadOnlyFallbackProjection = assembleSupportReadOnlyFallbackProjection(
      fixture,
      supportLineageBinding,
      input,
    );
    const supportTicket = assembleSupportTicket(
      fixture,
      supportLineageBinding,
      supportReadOnlyFallbackProjection,
    );
    const subjectContextBinding = assembleSubjectContextBinding(
      fixture,
      supportLineageBinding,
      artifactBindings,
      input,
    );
    const disclosureRecord = assembleDisclosureRecord(
      fixture,
      supportLineageBinding,
      subjectContextBinding,
      artifactBindings,
      input,
    );
    const subject360Projection = assembleSubject360Projection(
      fixture,
      supportLineageBinding,
      subjectContextBinding,
      artifactBindings,
      [disclosureRecord],
    );
    const subjectHistoryQuery = assembleSubjectHistoryQuery(
      fixture,
      supportLineageBinding,
      subjectContextBinding,
      disclosureRecord,
      input,
    );
    const subjectHistoryProjection = assembleSubjectHistoryProjection(
      fixture,
      supportLineageBinding,
      subjectContextBinding,
      disclosureRecord,
    );
    const supportTicketWorkspaceProjection = assembleTicketWorkspaceProjection(
      fixture,
      supportTicket,
      supportLineageBinding,
      scopeMembers,
      artifactBindings,
      subject360Projection,
      subjectHistoryQuery,
      supportReadOnlyFallbackProjection,
    );

    return {
      supportTicket,
      supportLineageBinding,
      supportLineageScopeMembers: scopeMembers,
      supportLineageArtifactBindings: artifactBindings,
      subjectContextBinding,
      disclosureRecords: [disclosureRecord],
      subject360Projection,
      subjectHistoryQuery,
      subjectHistoryProjection,
      supportReadOnlyFallbackProjection,
      supportTicketWorkspaceProjection,
      routeDefinitions: supportLineageTicketSubjectHistoryRoutes,
    };
  }

  getSupportSubject360(input: SupportTicketQueryInput): SupportSubject360Projection {
    return this.getSupportTicketWorkspace(input).subject360Projection;
  }

  getSupportSubjectHistory(input: SupportTicketQueryInput): SupportSubjectHistoryResult {
    const result = this.getSupportTicketWorkspace({
      purposeOfUse: "subject_history_review",
      ...input,
    });
    return {
      query: result.subjectHistoryQuery,
      subjectContextBinding: result.subjectContextBinding,
      disclosureRecord: result.disclosureRecords[0] as SupportContextDisclosureRecord,
      historyProjection: result.subjectHistoryProjection,
      supportLineageBinding: result.supportLineageBinding,
      supportLineageScopeMembers: result.supportLineageScopeMembers,
      supportLineageArtifactBindings: result.supportLineageArtifactBindings,
    };
  }

  getSupportLineageScopeMembers(
    input: SupportTicketQueryInput,
  ): readonly SupportLineageScopeMember[] {
    return this.getSupportTicketWorkspace(input).supportLineageScopeMembers;
  }

  getSupportLineageArtifactProvenance(
    input: SupportTicketQueryInput,
  ): SupportLineageArtifactProvenanceResult {
    const result = this.getSupportTicketWorkspace(input);
    return {
      supportTicketId: input.supportTicketId,
      supportLineageBinding: result.supportLineageBinding,
      artifactBindings: result.supportLineageArtifactBindings,
    };
  }
}

export function createSupportLineageTicketSubjectHistoryApplication(options?: {
  readonly repository?: SupportLineageProjectionRepository;
}) {
  const repository = options?.repository ?? createInMemorySupportLineageProjectionRepository();
  return {
    supportLineageTicketProjectionService: new SupportLineageTicketProjectionService(repository),
    repository,
  } as const;
}
