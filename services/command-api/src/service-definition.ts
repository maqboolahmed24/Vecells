import { shellSurfaceContracts } from "@vecells/api-contracts";
import { foundationPolicyScopes } from "@vecells/authz-policy";
import { domainModule as identityAccessDomain } from "@vecells/domain-identity-access";
import { domainModule as intakeSafetyDomain } from "@vecells/domain-intake-safety";
import { packageMetadata as kernelMetadata } from "@vecells/domain-kernel";
import { makeFoundationEvent } from "@vecells/event-contracts";
import {
  foundationReleasePosture,
  resolveCommandMutationDegradation,
  type DependencyFailureModeClass,
  type DependencyHealthState,
} from "@vecells/release-controls";
import type { ServiceConfig } from "./config";

export interface ServiceRouteDefinition {
  routeId: string;
  method: "GET" | "POST";
  path: string;
  contractFamily: string;
  purpose: string;
  bodyRequired: boolean;
  idempotencyRequired: boolean;
}

export interface WorkloadRequestContext {
  correlationId: string;
  traceId: string;
  config: ServiceConfig;
  headers: Record<string, string>;
  requestBody: unknown;
  readiness: ReadonlyArray<{ name: string; status: "ready" }>;
}

export interface WorkloadResponse {
  statusCode: number;
  body: unknown;
}

const routeIntentFamilies = [
  ...shellSurfaceContracts["patient-web"].routeFamilyIds,
  ...shellSurfaceContracts["clinical-workspace"].routeFamilyIds,
];

export const serviceDefinition = {
  service: "command-api",
  packageName: "@vecells/command-api",
  ownerContext: "platform_runtime",
  workloadFamily: "mutation_command_ingress",
  purpose:
    "Own mutation command ingress, validation, idempotency envelope reservation, route-intent hooks, mutation gates, and outbox publication seams without implementing feature logic yet.",
  truthBoundary:
    "Command acceptance is not settlement truth. Finality requires downstream settlement, projection freshness, and external proof where contracts demand it.",
  adminRoutes: ["/health", "/ready", "/manifest"],
  routeCatalog: [
    {
      routeId: "submit_command",
      method: "POST",
      path: "/commands/submit",
      contractFamily: "MutationCommandContract",
      purpose: "Reserve idempotency, validate route-intent hooks, and queue outbox publication.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "describe_command_contracts",
      method: "GET",
      path: "/commands/contracts",
      contractFamily: "MutationCommandContract",
      purpose:
        "Expose the mutation contract seam, settlement ladder, and outbox publication shape.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "auth_bridge_authorize",
      method: "POST",
      path: "/identity/auth/nhs/authorize",
      contractFamily: "AuthBridgeAuthorizeContract",
      purpose:
        "Create an AuthTransaction, freeze AuthScopeBundle and PostAuthReturnIntent, and issue the NHS login authorize redirect seam.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "auth_bridge_callback",
      method: "POST",
      path: "/identity/auth/nhs/callback",
      contractFamily: "AuthBridgeCallbackContract",
      purpose:
        "Settle the OIDC callback through the AuthTransaction callback fence without direct session or patient-link writes.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "session_governor_current",
      method: "GET",
      path: "/identity/session/current",
      contractFamily: "SessionGovernorProjectionContract",
      purpose:
        "Resolve the server-side local session through SessionGovernor and materialize least-privilege session posture.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "session_governor_logout",
      method: "POST",
      path: "/identity/session/logout",
      contractFamily: "SessionTerminationSettlementContract",
      purpose:
        "Settle logout through the SessionGovernor rather than treating cookie disappearance as authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_evidence_vault_write",
      method: "POST",
      path: "/identity/evidence",
      contractFamily: "IdentityEvidenceEnvelopeContract",
      purpose:
        "Append encrypted identity evidence through the vault boundary and return only refs, hashes, and masked display hints.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_evidence_vault_masked_read",
      method: "GET",
      path: "/identity/evidence/masked",
      contractFamily: "IdentityEvidenceMaskedReadContract",
      purpose:
        "Read masked identity evidence views without exposing raw claims or telephony identifiers to operational DTOs.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_linker_evaluate",
      method: "POST",
      path: "/identity/patient-link/evaluate",
      contractFamily: "PatientLinkDecisionContract",
      purpose:
        "Evaluate bounded patient candidates through calibrated PatientLinker scoring and emit only authority intents, never direct patientRef mutation.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "patient_linker_candidates",
      method: "GET",
      path: "/identity/patient-link/candidates",
      contractFamily: "CandidateSearchSpecContract",
      purpose:
        "Expose candidate-search posture, feature basis refs, and masked decision metadata for audit-safe patient linkage review.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "pds_enrichment_evaluate",
      method: "POST",
      path: "/identity/pds/enrichment/evaluate",
      contractFamily: "PdsEnrichmentDecisionContract",
      purpose:
        "Evaluate disabled-by-default PDS access policy, legal basis, onboarding readiness, route approval, and bounded demographic enrichment.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "pds_enrichment_snapshot",
      method: "GET",
      path: "/identity/pds/enrichment/snapshots",
      contractFamily: "PdsNormalizedDemographicSnapshotContract",
      purpose:
        "Expose provenance, freshness, and data-class-separated PDS enrichment snapshot refs without raw demographic payloads.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "pds_change_signal",
      method: "POST",
      path: "/identity/pds/change-signals",
      contractFamily: "PdsChangeSignalContract",
      purpose:
        "Record optional PDS notification or change-feed signals as bounded refresh requests, never direct patient state mutation.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "signed_in_request_start",
      method: "POST",
      path: "/identity/request-ownership/signed-in/start",
      contractFamily: "SignedInRequestStartContract",
      purpose:
        "Create signed-in drafts on the same request lineage model as public starts while attaching durable subject, session, binding-version, route-intent, and lineage-fence refs.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "pre_submit_claim_attach",
      method: "POST",
      path: "/identity/request-ownership/pre-submit-claim",
      contractFamily: "PreSubmitClaimOwnershipContract",
      purpose:
        "Claim a public draft before submission without changing draftPublicId, SubmissionEnvelope, continuity shell, continuity anchor, or writable scope outside authority and grant-service settlements.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "post_submit_uplift_map",
      method: "POST",
      path: "/identity/request-ownership/post-submit-uplift",
      contractFamily: "PostSubmitAuthenticatedUpliftContract",
      purpose:
        "Map post-submit authenticated uplift onto the existing request shell and episode lineage without cloning requests or redirecting to a generic home route.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "authority_patient_ref_derive",
      method: "POST",
      path: "/identity/request-ownership/patient-ref/derive",
      contractFamily: "AuthorityPatientRefDerivationContract",
      purpose:
        "Advance request and episode patient refs only inside the same IdentityBindingAuthority-derived transaction that settles the subject binding version.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "ownership_drift_evaluate",
      method: "POST",
      path: "/identity/request-ownership/drift/evaluate",
      contractFamily: "OwnershipDriftFenceContract",
      purpose:
        "Fence stale session, stale binding, subject switch, route-intent tuple drift, and lineage-fence drift into recovery or claim-pending posture.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_entry_current",
      method: "GET",
      path: "/v1/me",
      contractFamily: "PatientPortalEntryProjectionContract",
      purpose:
        "Resolve the authenticated portal entry through PatientAudienceCoverageProjection before home, request, recovery, or hold surfaces are selected.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_home_current",
      method: "GET",
      path: "/v1/me/home",
      contractFamily: "PatientHomeProjectionContract",
      purpose:
        "Return the harmonized PatientHomeProjection and PatientPortalHomeProjection alias with one spotlight decision, quiet-home eligibility, PatientNavUrgencyDigest, and PatientNavReturnContract.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_requests_index",
      method: "GET",
      path: "/v1/me/requests",
      contractFamily: "PatientRequestsIndexProjectionContract",
      purpose:
        "Return only request-list rows derived from PatientAudienceCoverageProjection, never broad payloads trimmed by the controller.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_request_detail",
      method: "GET",
      path: "/v1/me/requests/{requestRef}",
      contractFamily: "PatientRequestDetailProjectionContract",
      purpose:
        "Expose authenticated request detail, summary-only detail, or same-shell recovery from one coverage-bound PatientRequestDetailProjection vocabulary.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_request_action_route",
      method: "POST",
      path: "/v1/me/requests/{requestRef}/actions/{actionType}/route",
      contractFamily: "PatientActionRoutingProjectionContract",
      purpose:
        "Resolve a typed PatientActionRoutingProjection and PatientActionSettlementProjection before any patient mutation can post to a domain command.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_request_more_info",
      method: "GET",
      path: "/v1/me/requests/{requestRef}/more-info",
      contractFamily: "PatientMoreInfoStatusProjectionContract",
      purpose:
        "Resolve PatientMoreInfoStatusProjection with PatientReachabilitySummaryProjection, PatientContactRepairProjection, PatientConsentCheckpointProjection, and request return-bundle bindings before any reply posture is shown.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_request_more_info_thread",
      method: "GET",
      path: "/v1/me/requests/{requestRef}/more-info/thread",
      contractFamily: "PatientMoreInfoResponseThreadProjectionContract",
      purpose:
        "Expose the renderable PatientMoreInfoResponseThreadProjection as a derivative of the active more-info cycle, PatientMoreInfoStatusProjection, and request return bundle, never as a frontend-local prompt stack.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_messages_index",
      method: "GET",
      path: "/v1/me/messages",
      contractFamily: "PatientCommunicationsTimelineProjectionContract",
      purpose:
        "Return PatientCommunicationsTimelineProjection with PatientConversationPreviewDigest rows, PatientCommunicationVisibilityProjection gates, ConversationTimelineAnchor ordering, PatientComposerLease actionability, governed placeholders, delivery-failure visibility, and callback-status compatibility refs.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_message_cluster",
      method: "GET",
      path: "/v1/me/messages/{clusterId}",
      contractFamily: "ConversationThreadProjectionContract",
      purpose:
        "Resolve a PatientConversationCluster, ConversationThreadProjection, and ConversationSubthreadProjection family from the canonical communications timeline without widening preview visibility beyond CommunicationVisibilityResolver.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_message_thread",
      method: "GET",
      path: "/v1/me/messages/{clusterId}/thread/{threadId}",
      contractFamily: "ConversationThreadProjectionContract",
      purpose:
        "Hydrate a single conversation thread with strict clusterRef, threadId, receipt grammar, monotone revision, preview visibility, and summary safety tuple alignment.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_message_callback_status",
      method: "GET",
      path: "/v1/me/messages/{clusterId}/callback/{callbackCaseId}",
      contractFamily: "PatientCallbackStatusProjectionContract",
      purpose:
        "Resolve PatientCallbackStatusProjection inside the communications timeline compatibility seam so ConversationCallbackCardProjection consumes the 212 callback truth rather than a second callback status source.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_message_cluster_hydration",
      method: "GET",
      path: "/v1/me/messages/{clusterId}/hydrate",
      contractFamily: "PatientCommunicationsTimelineProjectionContract",
      purpose:
        "Hydrate selected cluster anchors, PatientReceiptEnvelope receipts, ConversationCommandSettlement settlements, ConversationCallbackCardProjection callback cards, and PatientComposerLease state while preserving governed preview placeholders for hidden content.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_conversation_control_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/conversation-control",
      contractFamily: "ConversationControlTaskBundleContract",
      purpose:
        "Expose the task-scoped canonical PatientConversationPreviewDigest, PatientComposerLease, PatientUrgentDiversionState, ConversationCommandSettlement, and communication-repair compatibility bundle without restitching thread truth locally.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_conversation_control_current",
      method: "GET",
      path: "/v1/me/messages/{clusterId}/conversation-control",
      contractFamily: "ConversationControlClusterBundleContract",
      purpose:
        "Resolve the current cluster digest, composer, urgent-diversion, and latest settlement posture from the canonical 246 control plane rather than draft or scroll-local state.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "internal_conversation_tuple_publish",
      method: "POST",
      path: "/internal/v1/conversations/tuples:publish",
      contractFamily: "ConversationTupleCompatibilityContract",
      purpose:
        "Publish the 246/247 tuple compatibility snapshot as the only input to digest and composer derivation, without local thread reconstruction in this service.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "patient_portal_conversation_acquire_composer",
      method: "POST",
      path: "/v1/me/messages/{clusterId}:acquire-composer",
      contractFamily: "AcquirePatientComposerLeaseCommandContract",
      purpose:
        "Acquire or reuse the single live PatientComposerLease for the current cluster while preserving the active anchor and draft across refresh or reconnect.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "patient_portal_conversation_release_composer",
      method: "POST",
      path: "/v1/me/messages/{clusterId}/composer-leases/{leaseId}:release",
      contractFamily: "ReleasePatientComposerLeaseCommandContract",
      purpose:
        "Release the live PatientComposerLease explicitly instead of allowing hidden secondary composers or silent local draft orphaning.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "internal_conversation_urgent_diversion_recompute",
      method: "POST",
      path: "/internal/v1/conversations/clusters/{clusterId}:recompute-urgent-diversion",
      contractFamily: "PatientUrgentDiversionStateCommandContract",
      purpose:
        "Recompute PatientUrgentDiversionState so unsafe async messaging freezes composition in place and redirects the dominant action without losing the current cluster.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "internal_message_conversation_settlement_record",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-conversation-settlement",
      contractFamily: "RecordConversationCommandSettlementCommandContract",
      purpose:
        "Record the canonical message mutation settlement with local ack, transport, external observation, and authoritative outcome held apart under one immutable conversation receipt grammar.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "internal_callback_conversation_settlement_record",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-conversation-settlement",
      contractFamily: "RecordConversationCommandSettlementCommandContract",
      purpose:
        "Record the canonical callback mutation settlement with bounded same-shell recovery and without collapsing staff acknowledgement into final callback truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_patient_conversation_projection_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/patient-conversation",
      contractFamily: "PatientConversationProjectionBundleContract",
      purpose:
        "Resolve the authoritative request-centered PatientConversationCluster, CommunicationEnvelope, ConversationSubthreadProjection, ConversationThreadProjection, PatientCommunicationVisibilityProjection, and PatientReceiptEnvelope family for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_conversation_thread_projection_current",
      method: "GET",
      path: "/v1/me/messages/{clusterId}/threading",
      contractFamily: "PatientConversationThreadProjectionContract",
      purpose:
        "Hydrate the patient-facing conversation thread from the canonical 247 tuple instead of restitching callback, reminder, repair, or secure-message truth separately.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_phase3_patient_workspace_conversation_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/patient-workspace-conversation",
      contractFamily: "Phase3PatientWorkspaceConversationBundleContract",
      purpose:
        "Resolve one merged patient and workspace conversation bundle so more-info, callback, thread, repair, and recovery routes agree on the same lineage truth.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_request_phase3_workspace_conversation_current",
      method: "GET",
      path: "/v1/me/requests/{requestRef}/conversation-merge",
      contractFamily: "Phase3PatientWorkspaceConversationBundleContract",
      purpose:
        "Resolve the patient conversation child-route bundle from the same canonical lineage that workspace more-info, callback, and message actions mutate.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_message_cluster_phase3_workspace_conversation_current",
      method: "GET",
      path: "/v1/me/messages/{clusterId}/conversation-merge",
      contractFamily: "Phase3PatientWorkspaceConversationBundleContract",
      purpose:
        "Resolve request-linked callback, thread, repair, and return continuity from a patient message cluster without detaching the patient from the governing request shell.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "internal_workspace_task_refresh_patient_conversation_projection",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:refresh-patient-conversation",
      contractFamily: "RefreshPatientConversationProjectionCommandContract",
      purpose:
        "Refresh the authoritative patient conversation tuple from callback, clinician-message, more-info, and reachability-repair truth, then publish the compatibility tuple that 246 consumes.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "internal_conversation_legacy_backfill",
      method: "POST",
      path: "/internal/v1/conversations/legacy-history:backfill",
      contractFamily: "BackfillPatientConversationLegacyHistoryCommandContract",
      purpose:
        "Backfill legacy callback or clinician-message history into placeholder or recovery posture before calm settled copy is allowed on the canonical patient thread.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "patient_portal_contact_repair_current",
      method: "GET",
      path: "/v1/me/contact-repair/{repairCaseId}",
      contractFamily: "PatientContactRepairProjectionContract",
      purpose:
        "Expose same-shell PatientContactRepairProjection while preserving the blocked action summary, request return bundle, PatientConsentCheckpointProjection context, and reachability assessment refs.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_records_index",
      method: "GET",
      path: "/v1/me/records",
      contractFamily: "PatientRecordSurfaceContextContract",
      purpose:
        "Return summary-first health record groups from PatientRecordSurfaceContext with PatientRecordArtifactProjection, RecordArtifactParityWitness, VisualizationFallbackContract, VisualizationTableContract, VisualizationParityProjection, and placeholder visibility already resolved.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_record_result_detail",
      method: "GET",
      path: "/v1/me/records/results/{resultId}",
      contractFamily: "PatientResultInterpretationProjectionContract",
      purpose:
        "Expose result detail in the required explanation order from PatientResultInterpretationProjection, while preserving the PatientResultInsightProjection alias, PatientRecordFollowUpEligibilityProjection, PatientRecordContinuityState, and current RecordArtifactParityWitness.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_record_document_detail",
      method: "GET",
      path: "/v1/me/records/documents/{documentId}",
      contractFamily: "PatientRecordArtifactProjectionContract",
      purpose:
        "Resolve document and letter summaries, previews, downloads, print, and browser handoff through PatientRecordArtifactProjection plus RecordArtifactParityWitness rather than raw file exits.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_recovery_current",
      method: "GET",
      path: "/v1/me/recovery/current",
      contractFamily: "PatientActionRecoveryProjectionContract",
      purpose:
        "Expose same-shell PatientActionRecoveryProjection outputs for stale sessions, stale bindings, route drift, lineage-fence drift, and pending consistency.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "patient_portal_identity_hold_current",
      method: "GET",
      path: "/v1/me/identity-hold",
      contractFamily: "PatientIdentityHoldProjectionContract",
      purpose:
        "Expose PatientIdentityHoldProjection while wrong-patient repair or binding disputes suppress PHI-bearing detail and writable actions.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_ticket_workspace_current",
      method: "GET",
      path: "/ops/support/tickets/{supportTicketId}",
      contractFamily: "SupportTicketWorkspaceProjectionContract",
      purpose:
        "Resolve SupportTicket, SupportLineageBinding, SupportLineageScopeMember, SupportLineageArtifactBinding, SupportTicketWorkspaceProjection, and SupportReadOnlyFallbackProjection from one current support-lineage binding rather than ticket-local joins.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_ticket_subject_history",
      method: "GET",
      path: "/ops/support/tickets/{supportTicketId}/subject-history",
      contractFamily: "SupportSubjectHistoryQueryContract",
      purpose:
        "Resolve SupportSubjectHistoryQuery and SupportSubjectHistoryProjection with SupportSubjectContextBinding and SupportContextDisclosureRecord so subject history starts as summary-first and widens only through current mask scope.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_ticket_subject_360",
      method: "GET",
      path: "/ops/support/tickets/{supportTicketId}/subject-360",
      contractFamily: "SupportSubject360ProjectionContract",
      purpose:
        "Expose compact SupportSubject360Projection context for identity, contact-route health, open objects, and recent outcomes through the current subject context binding.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_ticket_lineage_scope_members",
      method: "GET",
      path: "/internal/ops/support/tickets/{supportTicketId}/lineage/scope-members",
      contractFamily: "SupportLineageScopeMemberContract",
      purpose:
        "Expose explicit SupportLineageScopeMember rows for support internals so sibling case context never becomes implicit live mutation authority.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_ticket_artifact_provenance",
      method: "GET",
      path: "/internal/ops/support/tickets/{supportTicketId}/lineage/artifacts",
      contractFamily: "SupportLineageArtifactBindingContract",
      purpose:
        "Expose SupportLineageArtifactBinding provenance for support-visible excerpts, record summaries, notes, and future exports before they become durable support timeline truth.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_communication_repair_preview",
      method: "POST",
      path: "/ops/support/tickets/{supportTicketId}/communication-repair/preview",
      contractFamily: "SupportCommunicationRepairPreviewContract",
      purpose:
        "Preview SupportRepairChainView, SupportMutationAttempt, SupportActionRecord, SupportActionSettlement, MessageDispatchEnvelope, MessageDeliveryEvidenceBundle, ThreadExpectationEnvelope, ThreadResolutionGate, SupportLineageBinding, SupportLineageScopeMember, and SupportReadOnlyFallbackProjection before any external repair effect is armed.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "support_communication_repair_commit",
      method: "POST",
      path: "/ops/support/tickets/{supportTicketId}/communication-repair/commit",
      contractFamily: "SupportCommunicationRepairCommitContract",
      purpose:
        "Commit one idempotent SupportMutationAttempt for controlled resend, reissue, channel change, callback reschedule, or attachment recovery while reusing the live attempt for duplicate clicks and retries, carrying ProviderSafeMetadataBundle controls, and reconciling later AdapterReceiptCheckpoint delivery proof.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "support_replay_start",
      method: "POST",
      path: "/ops/support/tickets/{supportTicketId}/replay/start",
      contractFamily: "SupportReplayStartContract",
      purpose:
        "Create CommunicationReplayRecord, SupportReplayCheckpoint, and SupportReplayEvidenceBoundary while suspending mutating controls and keeping drafts outside frozen replay proof.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "support_replay_release",
      method: "POST",
      path: "/ops/support/tickets/{supportTicketId}/replay/release",
      contractFamily: "SupportReplayReleaseContract",
      purpose:
        "Require SupportReplayDeltaReview, SupportRouteIntentToken, SupportContinuityEvidenceProjection, SupportReplayReleaseDecision, and current SupportLineageBinding before emitting SupportReplayRestoreSettlement or same-shell SupportReadOnlyFallbackProjection.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "support_ticket_timeline_current",
      method: "GET",
      path: "/ops/support/tickets/{supportTicketId}/timeline",
      contractFamily: "SupportOmnichannelTimelineProjectionContract",
      purpose:
        "Expose SupportOmnichannelTimelineProjection with MessageDispatchEnvelope, MessageDeliveryEvidenceBundle, ThreadExpectationEnvelope, ThreadResolutionGate, SupportActionSettlement, SupportActionWorkbenchProjection, and SupportReachabilityPostureProjection alignment.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_repair_restore_status",
      method: "GET",
      path: "/ops/support/tickets/{supportTicketId}/restore-status",
      contractFamily: "SupportReplayRestoreStatusContract",
      purpose:
        "Expose latest SupportReplayRestoreSettlement, CommunicationReplayRecord, SupportContinuityEvidenceProjection, and SupportReadOnlyFallbackProjection for support workbench rehydration.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_open_support_communication_failure",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:open-support-communication-failure",
      contractFamily: "OpenSupportCommunicationFailureCommandContract",
      purpose:
        "Open or attach one governed SupportTicket for the active callback or clinician-message failure tuple, reusing the live support lineage when the same failure path re-enters through another channel.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "support_ticket_communication_failure_linkage_current",
      method: "GET",
      path: "/ops/support/tickets/{supportTicketId}/communication-failure-linkage",
      contractFamily: "SupportCommunicationFailureLinkageBundleContract",
      purpose:
        "Resolve the current SupportTicket, SupportLineageBinding, SupportLineageScopeMember, SupportLineageArtifactBinding, SupportActionRecord, SupportActionSettlement, SupportResolutionSnapshot, and workspace projection over the same callback or message failure chain.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "support_ticket_record_communication_action",
      method: "POST",
      path: "/ops/support/tickets/{supportTicketId}:record-communication-action",
      contractFamily: "RecordSupportCommunicationActionCommandContract",
      purpose:
        "Record one communication-aware support action and settlement against the current message dispatch or callback gate chain, failing closed on stale ticket, stale lineage binding, or stale governing tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "support_ticket_publish_resolution_snapshot",
      method: "POST",
      path: "/ops/support/tickets/{supportTicketId}:publish-resolution-snapshot",
      contractFamily: "PublishSupportResolutionSnapshotCommandContract",
      purpose:
        "Publish a provenance-bound SupportResolutionSnapshot only after authoritative support settlement and current artifact-binding proof exist for the cited summary or handoff note.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_self_care_boundary_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/self-care-boundary",
      contractFamily: "SelfCareBoundaryBundleContract",
      purpose:
        "Expose the current SelfCareBoundaryDecision, AdviceEligibilityGrant posture, and the upstream endpoint, approval, and direct-resolution tuple later advice-render and admin-resolution work must consume.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_classify_self_care_boundary",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:classify-self-care-boundary",
      contractFamily: "ClassifySelfCareBoundaryCommandContract",
      purpose:
        "Classify whether the current request remains informational self-care, bounded admin-resolution, clinician review, or blocked pending review from one authoritative boundary tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_issue_advice_eligibility_grant",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/self-care-boundary/{boundaryDecisionId}:issue-advice-grant",
      contractFamily: "IssueAdviceEligibilityGrantCommandContract",
      purpose:
        "Issue one bounded AdviceEligibilityGrant only while the current self-care boundary, publication tuple, trust tuple, subject binding, and session epoch still align.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_supersede_self_care_boundary",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/self-care-boundary/{boundaryDecisionId}:supersede",
      contractFamily: "SupersedeSelfCareBoundaryCommandContract",
      purpose:
        "Supersede the current boundary when evidence, safety, route, trust, publication, or reopen drift invalidates the prior self-care or bounded-admin tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_invalidate_advice_eligibility_grant",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/advice-grants/{grantId}:invalidate",
      contractFamily: "InvalidateAdviceEligibilityGrantCommandContract",
      purpose:
        "Invalidate a live advice grant when decision, evidence, session, subject, route, publication, or trust drift means the stored tuple is no longer current.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_expire_advice_eligibility_grant",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/advice-grants/{grantId}:expire",
      contractFamily: "ExpireAdviceEligibilityGrantCommandContract",
      purpose:
        "Expire one AdviceEligibilityGrant explicitly when its bounded render window has elapsed.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_self_care_boundary_expire_due_grants",
      method: "POST",
      path: "/internal/v1/workspace/self-care-boundaries:expire-due-grants",
      contractFamily: "ExpireDueAdviceEligibilityGrantsCommandContract",
      purpose:
        "Expire due advice grants from the canonical TTL queue instead of letting stale grants stay live.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_advice_render_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/advice-render",
      contractFamily: "AdviceRenderBundleContract",
      purpose:
        "Expose the current approved advice content selection, AdviceRenderSettlement, and effective render posture that patient self-care and bounded-admin surfaces must consume.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_advice_content_approval_register",
      method: "POST",
      path: "/internal/v1/workspace/advice-content/approvals:register",
      contractFamily: "ClinicalContentApprovalRecordRegisterCommandContract",
      purpose:
        "Register one explicit ClinicalContentApprovalRecord so advice render cannot rely on implied or stale content approval.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_advice_content_review_schedule_register",
      method: "POST",
      path: "/internal/v1/workspace/advice-content/review-schedules:register",
      contractFamily: "ContentReviewScheduleRegisterCommandContract",
      purpose:
        "Register one ContentReviewSchedule so advice render can fail closed when review cadence or hard expiry drift.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_advice_bundle_version_register",
      method: "POST",
      path: "/internal/v1/workspace/advice-content/bundles:register",
      contractFamily: "AdviceBundleVersionRegisterCommandContract",
      purpose:
        "Register one AdviceBundleVersion for a specific pathway, compiled policy bundle, and approved audience envelope.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_advice_variant_set_register",
      method: "POST",
      path: "/internal/v1/workspace/advice-content/variants:register",
      contractFamily: "AdviceVariantSetRegisterCommandContract",
      purpose:
        "Register one AdviceVariantSet with explicit channel, locale, reading-level, accessibility, and governed artifact-contract references.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_render_advice",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:render-advice",
      contractFamily: "AdviceRenderCommandContract",
      purpose:
        "Settle visible self-care advice only when the current boundary, grant, approved content, variant set, publication tuple, and trust posture still align.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_invalidate_advice_render",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/advice-render/{adviceRenderSettlementId}:invalidate",
      contractFamily: "AdviceRenderInvalidateCommandContract",
      purpose:
        "Invalidate the current advice render when boundary, grant, evidence, session, or publication truth has drifted.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_supersede_advice_render",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/advice-render/{adviceRenderSettlementId}:supersede",
      contractFamily: "AdviceRenderSupersedeCommandContract",
      purpose:
        "Supersede the current advice render when a newer approved content bundle or variant set replaces the visible settlement.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_quarantine_advice_render",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/advice-render/{adviceRenderSettlementId}:quarantine",
      contractFamily: "AdviceRenderQuarantineCommandContract",
      purpose:
        "Quarantine the current advice render when trust or publication posture blocks fresh visible advice while preserving governed provenance.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_admin_resolution_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution",
      contractFamily: "AdminResolutionPolicyBundleContract",
      purpose:
        "Expose the current AdminResolutionCase, current subtype policy, completion artifact, and continuity freeze posture for one bounded admin-resolution task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_admin_resolution_subtype_policy_current",
      method: "GET",
      path: "/internal/v1/workspace/admin-resolution/subtypes/{adminResolutionSubtypeRef}",
      contractFamily: "AdminResolutionSubtypePolicyContract",
      purpose:
        "Fetch one canonical AdminResolutionSubtypeProfile through the governed registry instead of route-local prose or queue labels.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_open_admin_resolution_case",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:open-admin-resolution-case",
      contractFamily: "OpenAdminResolutionCaseCommandContract",
      purpose:
        "Open the canonical AdminResolutionCase only from the current legal bounded-admin boundary tuple and live admin-resolution starter.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reclassify_admin_resolution_subtype",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:reclassify-subtype",
      contractFamily: "ReclassifyAdminResolutionSubtypeCommandContract",
      purpose:
        "Reclassify routed or active bounded admin work onto one canonical subtype profile instead of leaving it as prose routing.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_enter_admin_resolution_waiting_state",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:enter-waiting-state",
      contractFamily: "EnterAdminResolutionWaitingStateCommandContract",
      purpose:
        "Enter one typed waiting posture only when dependency shape, owner, SLA clock, and expiry or repair rule all match subtype policy.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_cancel_admin_resolution_wait",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:cancel-wait",
      contractFamily: "CancelAdminResolutionWaitCommandContract",
      purpose:
        "Cancel one active admin waiting posture and restore in-progress work without widening into a generic waiting bucket.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_admin_resolution_completion_artifact",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:record-completion-artifact",
      contractFamily: "RecordAdminResolutionCompletionArtifactCommandContract",
      purpose:
        "Record one typed AdminResolutionCompletionArtifact so bounded admin completion is proof-backed instead of a generic done toggle.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_advice_admin_dependency_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/advice-admin-dependency",
      contractFamily: "AdviceAdminDependencySetBundleContract",
      purpose:
        "Expose the current AdviceAdminDependencySet, dominant blocker, dominant recovery route, and reopen posture for the active self-care or bounded-admin tuple.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_evaluate_advice_admin_dependency_set",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:evaluate-advice-admin-dependency-set",
      contractFamily: "EvaluateAdviceAdminDependencySetCommandContract",
      purpose:
        "Evaluate dependency legality for the live boundary tuple and reject stale tuple writes as stale_recoverable instead of silently mutating consequence state.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_refresh_advice_admin_dependency_set",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:refresh-advice-admin-dependency-set",
      contractFamily: "RefreshAdviceAdminDependencySetCommandContract",
      purpose:
        "Refresh the current AdviceAdminDependencySet against canonical reachability, render, admin, and conversation truth while preserving idempotent reuse on the same tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_recalculate_advice_admin_reopen_state",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:recalculate-advice-admin-reopen-state",
      contractFamily: "RecalculateAdviceAdminReopenStateCommandContract",
      purpose:
        "Recalculate reopen and clinical reentry posture from the canonical trigger registry when dependency blockers or boundary drift change under the same request lineage.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_self_care_outcome_analytics_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/self-care-outcome-analytics",
      contractFamily: "SelfCareOutcomeAnalyticsBundleContract",
      purpose:
        "Expose the current expectation-template resolution, typed outcome analytics records, and watch-window analytics linkage for one Phase 3 self-care or bounded-admin task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_follow_up_watch_analytics_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/follow-up-watch-analytics",
      contractFamily: "AdviceFollowUpWatchAnalyticsContract",
      purpose:
        "Expose AdviceFollowUpWatchWindow rows and the typed AdviceUsageAnalyticsRecord chain linked to those windows for the current task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_publish_patient_expectation_template_version",
      method: "POST",
      path: "/internal/v1/workspace/patient-expectation-templates:publish-version",
      contractFamily: "PublishPatientExpectationTemplateVersionCommandContract",
      purpose:
        "Publish one governed patient expectation template version with explicit channel, locale, readability, accessibility, release, and delivery-mode coverage.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_resolve_patient_expectation_template",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:resolve-patient-expectation-template",
      contractFamily: "ResolvePatientExpectationTemplateCommandContract",
      purpose:
        "Resolve the current patient expectation wording against the live self-care or bounded-admin tuple without letting free text drift outside the canonical registry.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_record_advice_outcome_analytics",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:record-advice-outcome-analytics",
      contractFamily: "RecordAdviceOutcomeAnalyticsCommandContract",
      purpose:
        "Record typed self-care outcome analytics and link them to the active AdviceFollowUpWatchWindow without changing operational authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_admin_outcome_analytics",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:record-admin-outcome-analytics",
      contractFamily: "RecordAdminOutcomeAnalyticsCommandContract",
      purpose:
        "Record typed bounded-admin outcome analytics against the current subtype, completion artifact, and expectation-template chain without implying settlement truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_admin_resolution_settlement_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution-settlement",
      contractFamily: "AdminResolutionSettlementBundleContract",
      purpose:
        "Expose the authoritative AdminResolutionSettlement chain, current AdminResolutionExperienceProjection, and governed re-entry record for one bounded admin task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_record_admin_resolution_settlement",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:record-settlement",
      contractFamily: "RecordAdminResolutionSettlementCommandContract",
      purpose:
        "Record one authoritative bounded-admin settlement against the current boundary, dependency, continuity, and publication tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_admin_notification",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:settle-notification",
      contractFamily: "SettleAdminNotificationCommandContract",
      purpose:
        "Settle the patient-notified posture without collapsing notification, waiting, and completion into one generic done state.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_admin_waiting_state",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:settle-waiting-state",
      contractFamily: "SettleAdminWaitingStateCommandContract",
      purpose:
        "Settle one live waiting_dependency posture only while the bounded-admin tuple remains legal and the case is genuinely in waiting state.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_admin_completion",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:settle-completion",
      contractFamily: "SettleAdminCompletionCommandContract",
      purpose:
        "Enter completed only when the current tuple, completion artifact, expectation binding, and continuity envelope all remain authoritative.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reopen_admin_resolution_for_review",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:reopen-for-review",
      contractFamily: "ReopenAdminResolutionForReviewCommandContract",
      purpose:
        "Freeze bounded-admin consequence and reopen governed review with lineage-safe provenance instead of a route-local status flip.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_resolve_admin_cross_domain_reentry",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/admin-resolution/{adminResolutionCaseId}:resolve-cross-domain-reentry",
      contractFamily: "ResolveAdminCrossDomainReentryCommandContract",
      purpose:
        "Resolve the correct re-entry domain from current boundary, dependency, and stale tuple truth and write one canonical re-entry artifact.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_context_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/context",
      contractFamily: "WorkspaceContextProjectionContract",
      purpose:
        "Resolve StaffWorkspaceConsistencyProjection, WorkspaceSliceTrustProjection, ProtectedCompositionState, WorkspaceContinuityEvidenceProjection, and WorkspaceTrustEnvelope from one task-scoped workspace context query.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_trust_envelope_current",
      method: "GET",
      path: "/internal/v1/workspace/tasks/{taskId}/trust-envelope",
      contractFamily: "WorkspaceTrustEnvelopeContract",
      purpose:
        "Expose the current WorkspaceTrustEnvelope as the only authority for writable posture, interruption pacing, and calm completion.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_completion_continuity_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/completion-continuity",
      contractFamily: "TaskCompletionContinuityBundleContract",
      purpose:
        "Expose the current TaskCompletionSettlementEnvelope, OperatorHandoffFrame, WorkspaceContinuityEvidenceProjection, WorkspaceTrustEnvelope, and NextTaskLaunchLease for one task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_settle_completion",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:settle-completion",
      contractFamily: "TaskCompletionSettlementCommandContract",
      purpose:
        "Settle one authoritative TaskCompletionSettlementEnvelope from the current direct consequence or governed handoff path instead of inferring calm completion from local acknowledgement.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_manual_handoff_requirement",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:record-manual-handoff",
      contractFamily: "OperatorHandoffFrameCommandContract",
      purpose:
        "Record one durable OperatorHandoffFrame when manual baton, supervisor takeover, or downstream owner acceptance keeps calm completion blocked.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_compute_continuity_evidence",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:compute-continuity-evidence",
      contractFamily: "WorkspaceContinuityEvidenceComputationCommandContract",
      purpose:
        "Recompute WorkspaceContinuityEvidenceProjection and WorkspaceTrustEnvelope from authoritative task, publication, anchor, queue-snapshot, and launch-lease truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_evaluate_next_task_readiness",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:evaluate-next-task-readiness",
      contractFamily: "NextTaskReadinessEvaluationCommandContract",
      purpose:
        "Evaluate next-task readiness only from the live NextTaskLaunchLease, TaskCompletionSettlementEnvelope, WorkspaceContinuityEvidenceProjection, and current trust tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_invalidate_stale_continuity",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:invalidate-stale-continuity",
      contractFamily: "WorkspaceContinuityInvalidationCommandContract",
      purpose:
        "Move completion and continuity posture to stale_recoverable or recovery_required when reopen, supersession, ownership drift, or publication drift invalidates the current calm shell.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_more_info_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/more-info",
      contractFamily: "MoreInfoCycleBundleContract",
      purpose:
        "Expose the current MoreInfoCycle, MoreInfoReplyWindowCheckpoint, and MoreInfoReminderSchedule as one authoritative more-info bundle for the active task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_request_more_info",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:request-more-info",
      contractFamily: "MoreInfoCycleRequestCommandContract",
      purpose:
        "Create or replace the active MoreInfoCycle from authoritative server time, triage lease state, and governed respond-more-info grant issuance.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_supersede_more_info",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:supersede",
      contractFamily: "MoreInfoCycleSupersessionCommandContract",
      purpose:
        "Supersede the current MoreInfoCycle explicitly, revoke stale reply grants, cancel reminder pathways, and preserve superseded history.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_cancel_more_info",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:cancel",
      contractFamily: "MoreInfoCycleCancellationCommandContract",
      purpose:
        "Cancel the current MoreInfoCycle, settle the checkpoint out of actionability, release the lifecycle lease, and revoke reply authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_recompute_more_info_checkpoint",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:recompute-checkpoint",
      contractFamily: "MoreInfoReplyWindowRecomputeCommandContract",
      purpose:
        "Recompute the active MoreInfoReplyWindowCheckpoint only from authoritative server time plus current reachability posture, never browser-local clocks.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_mark_more_info_reminder_due",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:mark-reminder-due",
      contractFamily: "MoreInfoReminderDueCommandContract",
      purpose:
        "Advance a MoreInfoReplyWindowCheckpoint into reminder_due only when the authoritative policy window says a reminder is now due.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_dispatch_more_info_reminder",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:dispatch-reminder",
      contractFamily: "MoreInfoReminderDispatchCommandContract",
      purpose:
        "Dispatch one replay-safe more-info reminder through the transactional outbox while checkpoint and schedule truth move atomically.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_suppress_more_info_reminder",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:suppress-reminder",
      contractFamily: "MoreInfoReminderSuppressionCommandContract",
      purpose:
        "Suppress one reminder because of quiet hours or contact repair posture without creating a second schedule truth source.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_expire_more_info_cycle",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:expire",
      contractFamily: "MoreInfoCycleExpiryCommandContract",
      purpose:
        "Expire an actionable more-info loop, release the more-info lifecycle lease, and revoke reply grants without leaving stale reminder effects live.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_more_info_worker_drain",
      method: "POST",
      path: "/internal/v1/workspace/more-info:drain-worker",
      contractFamily: "MoreInfoWorkerDrainCommandContract",
      purpose:
        "Drain pending initial-delivery, reminder, suppression, callback-fallback, and expiry work from one replay-safe more-info worker seam.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_receive_more_info_reply",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/more-info/{cycleId}:receive-reply",
      contractFamily: "MoreInfoReplyReceiptCommandContract",
      purpose:
        "Resolve one patient reply against the current cycle and checkpoint, record MoreInfoResponseDisposition, and only continue into assimilation when the accepted posture is still current.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_evaluate_more_info_reply_disposition",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:evaluate-reply",
      contractFamily: "MoreInfoReplyDispositionCommandContract",
      purpose:
        "Evaluate current-cycle, checkpoint, replay, closure, and repair posture before reply receipt can mint any new evidence or task transition.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_assimilate_more_info_reply",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:assimilate-reply",
      contractFamily: "MoreInfoReplyAssimilationCommandContract",
      purpose:
        "Bridge accepted patient reply evidence into the canonical EvidenceAssimilationRecord and immutable capture path instead of letting queue resume shortcut around resafety.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_classify_more_info_reply",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:classify-reply",
      contractFamily: "MoreInfoReplyClassificationCommandContract",
      purpose:
        "Append one fail-safe EvidenceClassificationDecision for accepted patient reply evidence, including contact-safety and degraded-parser branches.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_run_more_info_resafety",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:run-resafety",
      contractFamily: "MoreInfoReplyResafetyCommandContract",
      purpose:
        "Run canonical re-safety on reply deltas, impacted rules, and active dependencies before routine consequence is allowed to continue.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_more_info_urgent_return",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:settle-urgent-return",
      contractFamily: "MoreInfoUrgentReturnSettlementContract",
      purpose:
        "Settle urgent re-safety return by moving the task into escalated posture rather than silently requeueing it.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_more_info_review_resumed_return",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:settle-review-resumed-return",
      contractFamily: "MoreInfoReviewResumedSettlementContract",
      purpose:
        "Resume routine review only after accepted assimilation and clear or residual-only settlement, preserving the legal review_resumed to queued path.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_mark_more_info_supervisor_review_required",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/more-info/{cycleId}:mark-supervisor-review-required",
      contractFamily: "MoreInfoSupervisorReviewRequirementContract",
      purpose:
        "Create a governed supervisor-review hold when repeated reopen cycles exceed the oscillation threshold inside the configured window.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_duplicate_review_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/duplicate-review",
      contractFamily: "DuplicateReviewSnapshotContract",
      purpose:
        "Expose the current DuplicateReviewSnapshot from canonical DuplicateCluster, DuplicatePairEvidence, and DuplicateResolutionDecision authority.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_duplicate_review_resolve",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/duplicate-review/resolve",
      contractFamily: "DuplicateResolutionDecisionCommandContract",
      purpose:
        "Resolve duplicate review only from the latest DuplicateReviewSnapshot and explicit DuplicatePairEvidence rather than queue-local heuristics.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_review_bundle_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/review-bundle",
      contractFamily: "ReviewBundleContract",
      purpose:
        "Expose one authoritative ReviewBundle, deterministic summary, and EvidenceDeltaPacket for the active task without letting the UI compose local summary truth.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_review_bundle_suggestions_current",
      method: "GET",
      path: "/internal/v1/workspace/tasks/{taskId}/review-bundle/suggestions",
      contractFamily: "SuggestionEnvelopeContract",
      purpose:
        "Hydrate the current task-scoped SuggestionEnvelope set from the pinned ReviewBundle while keeping shadow-model output dark and advisory only.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_endpoint_decision_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/endpoint-decision",
      contractFamily: "EndpointDecisionBundleContract",
      purpose:
        "Expose the current DecisionEpoch, EndpointDecision, EndpointDecisionBinding, approval requirement, preview artifact, and latest DecisionSupersessionRecord for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_select_endpoint",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:select-endpoint",
      contractFamily: "EndpointDecisionSelectCommandContract",
      purpose:
        "Select one Phase 3 endpoint, mint the first live DecisionEpoch when required, and persist the draft decision through the canonical command and settlement chain.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_update_endpoint_payload",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:update-payload",
      contractFamily: "EndpointDecisionPayloadUpdateCommandContract",
      purpose:
        "Update endpoint payload under the current decision fence or rotate to a replacement epoch when evidence, anchor, trust, publication, or approval burden drift invalidates the old tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_preview_endpoint_outcome",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:preview",
      contractFamily: "EndpointDecisionPreviewCommandContract",
      purpose:
        "Generate one deterministic summary-first EndpointOutcomePreviewArtifact from the current endpoint choice, evidence summary, safety posture, duplicate posture, and selected anchor.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_regenerate_endpoint_preview",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:regenerate-preview",
      contractFamily: "EndpointDecisionPreviewRegenerationCommandContract",
      purpose:
        "Regenerate endpoint preview output and degrade superseded preview artifacts to recovery-only provenance rather than leaving stale preview state writable.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_submit_endpoint_decision",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:submit",
      contractFamily: "EndpointDecisionSubmitCommandContract",
      purpose:
        "Commit an endpoint decision only when binding posture remains live and approval is not required, otherwise persist an explicit blocked_approval_gate or blocked_policy settlement.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_invalidate_endpoint_decision",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/endpoint-decision/{decisionId}:invalidate",
      contractFamily: "EndpointDecisionInvalidationCommandContract",
      purpose:
        "Append DecisionSupersessionRecord, freeze stale preview posture to recovery-only provenance, and mint a replacement live epoch when current endpoint decision state drifts.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_approval_escalation_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/approval-escalation",
      contractFamily: "ApprovalEscalationBundleContract",
      purpose:
        "Expose the current governed ApprovalCheckpoint rail, urgent escalation posture, contact-attempt chain, and urgent outcome state for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_evaluate_approval_requirement",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:evaluate-approval-requirement",
      contractFamily: "ApprovalRequirementEvaluationCommandContract",
      purpose:
        "Evaluate the frozen 228 approval policy matrix against the current unsuperseded DecisionEpoch and mint or reuse the authoritative ApprovalCheckpoint.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_request_approval",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/approval/{checkpointId}:request",
      contractFamily: "ApprovalCheckpointRequestCommandContract",
      purpose:
        "Promote a required ApprovalCheckpoint into pending review under its own lifecycle lease instead of relying on endpoint-local submit semantics.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_approve_decision",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/approval/{checkpointId}:approve",
      contractFamily: "ApprovalCheckpointApproveCommandContract",
      purpose:
        "Approve the current epoch-bound checkpoint only when the presented approver roles satisfy the matched policy rule and self-approval stays blocked.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reject_decision",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/approval/{checkpointId}:reject",
      contractFamily: "ApprovalCheckpointRejectCommandContract",
      purpose:
        "Reject the current ApprovalCheckpoint with an explicit reason so direct consequence stays fail-closed until a fresh approval path is settled.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_invalidate_approval",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/approval/{checkpointId}:invalidate",
      contractFamily: "ApprovalCheckpointInvalidationCommandContract",
      purpose:
        "Supersede stale approval after endpoint drift, patient reply, duplicate resolution, trust drift, publication drift, or manual epoch replacement.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_start_urgent_escalation",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:start-urgent-escalation",
      contractFamily: "DutyEscalationStartCommandContract",
      purpose:
        "Create the first-class DutyEscalationRecord from the current live DecisionEpoch and move the triage task into escalated posture.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_urgent_contact_attempt",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/urgent-escalation/{escalationId}/contact-attempts",
      contractFamily: "UrgentContactAttemptCommandContract",
      purpose:
        "Append one replay-safe urgent contact attempt without allowing duplicate taps, worker retries, or provider retries to fork a second live chain.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_urgent_outcome",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/urgent-escalation/{escalationId}:record-outcome",
      contractFamily: "UrgentEscalationOutcomeCommandContract",
      purpose:
        "Settle one urgent escalation outcome only against the current unsuperseded DecisionEpoch, routing to direct outcome, handoff pending, or governed reopen.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_callback_case_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/callback-case",
      contractFamily: "CallbackCaseBundleContract",
      purpose:
        "Expose the current CallbackCase, CallbackIntentLease, CallbackAttemptRecord, CallbackExpectationEnvelope, CallbackOutcomeEvidenceBundle, and CallbackResolutionGate for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_create_callback_case",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:create-callback-case",
      contractFamily: "CreateCallbackCaseCommandContract",
      purpose:
        "Create the canonical CallbackCase from the current live callback seed instead of leaving callback work implied by direct-resolution seed state.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_schedule_callback_case",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:schedule",
      contractFamily: "ScheduleCallbackCaseCommandContract",
      purpose:
        "Schedule or claim the current callback only through the live CallbackIntentLease and a fresh CallbackExpectationEnvelope revision.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reschedule_callback_case",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:reschedule",
      contractFamily: "RescheduleCallbackCaseCommandContract",
      purpose:
        "Replace materially stale callback lease tuples when the callback window, urgency, or contact route changes.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_cancel_callback_case",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:cancel",
      contractFamily: "CancelCallbackCaseCommandContract",
      purpose:
        "Cancel callback only through CallbackResolutionGate instead of treating local schedule removal as authoritative cancellation truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_arm_callback_ready",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:arm-ready",
      contractFamily: "ArmCallbackReadyCommandContract",
      purpose:
        "Arm callback ready-for-attempt only when the active CallbackIntentLease and current attempt-window policy still agree.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_initiate_callback_attempt",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:initiate-attempt",
      contractFamily: "InitiateCallbackAttemptCommandContract",
      purpose:
        "Initiate one exclusive callback attempt through the canonical idempotency, command-action, and adapter-dispatch chain.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_callback_provider_receipt",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-provider-receipt",
      contractFamily: "RecordCallbackProviderReceiptCommandContract",
      purpose:
        "Verify telephony webhook signatures, collapse replay onto the live attempt fence, and record AdapterReceiptCheckpoint-backed callback evidence.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_record_callback_outcome_evidence",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-outcome-evidence",
      contractFamily: "RecordCallbackOutcomeEvidenceCommandContract",
      purpose:
        "Bind callback outcome truth to CallbackOutcomeEvidenceBundle instead of telephony status or local acknowledgement.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_callback_resolution_gate",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:settle-resolution-gate",
      contractFamily: "SettleCallbackResolutionGateCommandContract",
      purpose:
        "Settle retry, escalation, completion, cancel, or expiry only through the authoritative CallbackResolutionGate.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reopen_callback_case",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:reopen",
      contractFamily: "ReopenCallbackCaseCommandContract",
      purpose:
        "Reopen a closed callback shell with a fresh CallbackIntentLease and fresh expectation envelope when downstream or lineage drift invalidates the prior closure.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_message_thread_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/message-thread",
      contractFamily: "ClinicianMessageThreadBundleContract",
      purpose:
        "Expose the current ClinicianMessageThread, MessageDispatchEnvelope, MessageDeliveryEvidenceBundle, ThreadExpectationEnvelope, ThreadResolutionGate, and latest patient reply for one task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_create_message_thread",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:create-message-thread",
      contractFamily: "CreateClinicianMessageThreadCommandContract",
      purpose:
        "Create the canonical ClinicianMessageThread from the live ClinicianMessageSeed instead of leaving messaging as an implied preview consequence.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_save_message_draft",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:save-draft",
      contractFamily: "SaveClinicianMessageDraftCommandContract",
      purpose:
        "Save the current thread draft under the live thread fence so stale tabs cannot fork new thread text or reset approval posture.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_approve_message_draft",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:approve-draft",
      contractFamily: "ApproveClinicianMessageDraftCommandContract",
      purpose:
        "Bind draft approval to the live thread version and review-action lease instead of treating approval as an unfenced UI transition.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_send_message_thread",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:send",
      contractFamily: "SendClinicianMessageThreadCommandContract",
      purpose:
        "Create or reuse one immutable MessageDispatchEnvelope for the current thread version and dispatch fence.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_message_provider_receipt",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-provider-receipt",
      contractFamily: "RecordClinicianMessageProviderReceiptCommandContract",
      purpose:
        "Verify signed channel callbacks and reconcile provider replay onto the live MessageDispatchEnvelope through AdapterReceiptCheckpoint.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_record_message_delivery_evidence",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-delivery-evidence",
      contractFamily: "RecordMessageDeliveryEvidenceCommandContract",
      purpose:
        "Bind delivered, failed, disputed, or expired posture to MessageDeliveryEvidenceBundle instead of raw provider status.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_ingest_message_reply",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:ingest-reply",
      contractFamily: "IngestClinicianMessageReplyCommandContract",
      purpose:
        "Persist patient reply on the canonical thread first, then emit the assimilation hook needed for later resafety work.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_message_resolution_gate",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:settle-resolution-gate",
      contractFamily: "SettleThreadResolutionGateCommandContract",
      purpose:
        "Authorize await-reply, review-pending, repair-route, callback escalation, reopen, or close only through ThreadResolutionGate.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reopen_message_thread",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:reopen",
      contractFamily: "ReopenClinicianMessageThreadCommandContract",
      purpose:
        "Reopen a closed thread under a fresh lifecycle lease and expectation revision instead of mutating a stale closed shell.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_communication_repair_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/communication-repair",
      contractFamily: "CommunicationRepairBundleContract",
      purpose:
        "Expose the canonical callback or clinician-message reachability dependency, repair journey, verification checkpoint, repair-entry grant posture, and resend or reschedule authorization chain for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_record_callback_reachability",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:record-reachability",
      contractFamily: "RecordCallbackReachabilityObservationCommandContract",
      purpose:
        "Append callback failure or route-drift evidence as authoritative ReachabilityObservation input and open or refresh same-shell repair only through the canonical dependency chain.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_record_message_reachability",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/message-thread/{threadId}:record-reachability",
      contractFamily: "RecordMessageReachabilityObservationCommandContract",
      purpose:
        "Append clinician-message delivery or dispute evidence as authoritative ReachabilityObservation input instead of mutating local message status flags.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_attach_contact_route_candidate",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/communication-repair/{bindingId}:attach-candidate-route",
      contractFamily: "AttachCommunicationRepairCandidateRouteCommandContract",
      purpose:
        "Attach one candidate ContactRouteSnapshot to the live repair journey so repair can rebound only on a fresh snapshot rather than mutable profile edits.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_issue_contact_route_verification",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/communication-repair/{bindingId}:issue-verification",
      contractFamily: "IssueCommunicationRepairVerificationCheckpointCommandContract",
      purpose:
        "Open the one live ContactRouteVerificationCheckpoint for the current repair journey and return the existing checkpoint on duplicate requests.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_settle_contact_route_verification",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/communication-repair/{bindingId}/verification/{checkpointId}:settle",
      contractFamily: "SettleCommunicationRepairVerificationCheckpointCommandContract",
      purpose:
        "Settle communication-route verification, mint a fresh verified snapshot, append a new ReachabilityAssessmentRecord, and rebind only on the new reachability epoch.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_authorize_message_repair_action",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/message-thread/{threadId}:authorize-repair-action",
      contractFamily: "AuthorizeMessageRepairActionCommandContract",
      purpose:
        "Authorize controlled resend, channel change, or attachment recovery only when the current repair chain is clear, rebound, and still backed by the governing ThreadResolutionGate or terminal delivery chain.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_authorize_callback_reschedule",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}/callback-case/{callbackCaseId}:authorize-reschedule",
      contractFamily: "AuthorizeCallbackRescheduleCommandContract",
      purpose:
        "Authorize callback reschedule only after the current repair chain rebounds on a fresh reachability epoch and the callback retry or reopen chain remains current.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_direct_resolution_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/direct-resolution",
      contractFamily: "DirectResolutionBundleContract",
      purpose:
        "Expose the current direct-resolution settlement, typed downstream seed, summary-first outcome artifact, patient-status projection, and queued outbox effects for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_commit_direct_resolution",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:commit-direct-resolution",
      contractFamily: "DirectResolutionCommitCommandContract",
      purpose:
        "Commit one direct resolution or handoff seed only against the current live submitted DecisionEpoch and any required approved ApprovalCheckpoint.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_publish_outcome_artifact",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/direct-resolution/{settlementId}:publish-artifact",
      contractFamily: "TriageOutcomePresentationArtifactPublishCommandContract",
      purpose:
        "Publish or replay one summary-first TriageOutcomePresentationArtifact through the authoritative outbox seam without creating a detached confirmation path.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reconcile_stale_direct_resolution",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:reconcile-direct-resolution-supersession",
      contractFamily: "DirectResolutionSupersessionReconcileCommandContract",
      purpose:
        "Degrade stale direct-resolution artifacts and downstream seeds to governed recovery-only posture when the source DecisionEpoch is superseded.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_direct_resolution_worker_drain",
      method: "POST",
      path: "/internal/v1/workspace/direct-resolution:drain-worker",
      contractFamily: "DirectResolutionOutboxDrainCommandContract",
      purpose:
        "Drain pending patient-status, consequence publication, artifact publication, and lifecycle milestone effects from the replay-safe direct-resolution outbox.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_reopen_launch_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/reopen-launch",
      contractFamily: "ReopenLaunchBundleContract",
      purpose:
        "Expose the current TriageReopenRecord, TaskLaunchContext, NextTaskLaunchLease, and reopen priority posture for one workspace task.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_reopen_from_resolved",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:reopen-from-resolved",
      contractFamily: "TriageReopenCommandContract",
      purpose:
        "Reopen governed work after a resolved direct-outcome path fails, preserving the superseded consequence lineage and restoring queue continuity.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reopen_from_handoff",
      method: "POST",
      path: "/v1/workspace/tasks/{taskId}:reopen-from-handoff",
      contractFamily: "TriageReopenCommandContract",
      purpose:
        "Reopen governed work after booking or pharmacy handoff bounce-back while preserving the invalidated handoff path and superseded DecisionEpoch.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_reopen_from_invalidation",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:reopen-from-invalidation",
      contractFamily: "TriageReopenCommandContract",
      purpose:
        "Reopen governed work after approval invalidation, consequence supersession, or materially new evidence invalidates the prior endpoint path.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_issue_next_task_launch_lease",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}:issue-next-task-launch-lease",
      contractFamily: "NextTaskLaunchLeaseCommandContract",
      purpose:
        "Issue the explicit NextTaskLaunchLease for the recommended next task only from current TaskLaunchContext, source settlement, and continuity tuple truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_validate_next_task_launch_lease",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/next-task-launch/{nextTaskLaunchLeaseId}:validate",
      contractFamily: "NextTaskLaunchLeaseValidationCommandContract",
      purpose:
        "Validate or degrade an issued NextTaskLaunchLease when queue, continuity, settlement, anchor, publication, or trust truth drifts.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_task_invalidate_next_task_launch_lease",
      method: "POST",
      path: "/internal/v1/workspace/tasks/{taskId}/next-task-launch/{nextTaskLaunchLeaseId}:invalidate",
      contractFamily: "NextTaskLaunchLeaseInvalidationCommandContract",
      purpose:
        "Explicitly invalidate a stale or blocked NextTaskLaunchLease without silently advancing to the next task.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_queue_current",
      method: "GET",
      path: "/v1/workspace/queues/{queueKey}",
      contractFamily: "QueueRankSnapshotContract",
      purpose:
        "Return the latest committed QueueRankSnapshot plus QueueRankEntry rows for one workspace queue key without recomputing canonical order client-side.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_queue_assignment_suggestions_current",
      method: "GET",
      path: "/internal/v1/workspace/queues/{queueKey}/assignment-suggestions",
      contractFamily: "QueueAssignmentSuggestionSnapshotContract",
      purpose:
        "Expose the latest QueueAssignmentSuggestionSnapshot as a downstream reviewer-fit view over the committed queue snapshot.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_queue_refresh_current",
      method: "POST",
      path: "/internal/v1/workspace/queues/{queueKey}/refresh",
      contractFamily: "QueueRankRefreshCommandContract",
      purpose:
        "Refresh one deterministic QueueRankSnapshot from one governed fact cut and persist overload, fairness, and explanation state.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_queue_soft_claim",
      method: "POST",
      path: "/v1/workspace/queues/{queueKey}/tasks/{taskId}/soft-claim",
      contractFamily: "QueueSoftClaimContract",
      purpose:
        "Acquire a fenced soft-claim into the Phase 3 triage kernel using the presented queue snapshot ref and current task lease tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "workspace_queue_phase3_execution_merge_current",
      method: "GET",
      path: "/v1/workspace/queues/{queueKey}/phase3-execution-merge",
      contractFamily: "Phase3QueueCallbackAdminMergeContract",
      purpose:
        "Expose one queue-visible digest that joins queue rank, callback consequence, self-care or bounded-admin, completion settlement, and next-task gate posture.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "workspace_task_phase3_execution_merge_current",
      method: "GET",
      path: "/v1/workspace/tasks/{taskId}/phase3-execution-merge",
      contractFamily: "Phase3QueueCallbackAdminMergeTaskContract",
      purpose:
        "Expose the merged Phase 3 execution bundle for one task so queue, callback, consequence, completion, and next-task surfaces read the same authority chain.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "identity_audit_event_publish",
      method: "POST",
      path: "/identity/audit/events",
      contractFamily: "IdentityCanonicalEventEnvelopeContract",
      purpose:
        "Publish auth, claim, grant, capability, repair, and PDS lifecycle events through the canonical redacted identity audit envelope.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_audit_reconstruct_decision",
      method: "GET",
      path: "/identity/audit/reconstruct",
      contractFamily: "IdentityAuditDecisionReconstructionContract",
      purpose:
        "Reconstruct identity, session, capability, claim, grant, and repair decisions from append-only audit refs and reason codes.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "identity_audit_masking_preview",
      method: "POST",
      path: "/identity/audit/mask",
      contractFamily: "IdentityMaskingPolicyPreviewContract",
      purpose:
        "Apply the centralized identity redaction transform used by logs, traces, metrics, event payloads, and audit rows.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_edge_provider_webhook",
      method: "POST",
      path: "/internal/telephony/webhooks/{providerRef}",
      contractFamily: "TelephonyProviderWebhookContract",
      purpose:
        "Validate provider authenticity, quarantine raw telephony callback receipts, and enqueue provider-neutral normalized telephony events.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_webhook_worker_drain",
      method: "POST",
      path: "/internal/telephony/webhook-worker/drain",
      contractFamily: "TelephonyWebhookWorkerDrainContract",
      purpose:
        "Process normalized telephony event outbox entries into early CallSession bootstrap, idempotent replay, and disorder-buffer reconciliation.",
      bodyRequired: false,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_call_session_bootstrap_current",
      method: "GET",
      path: "/internal/telephony/call-sessions/{callSessionRef}",
      contractFamily: "TelephonyCallSessionBootstrapProjectionContract",
      purpose:
        "Expose the support-safe provider-neutral early CallSession projection without raw provider payloads or full caller numbers.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_call_session_event_append",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/events",
      contractFamily: "CallSessionEventContract",
      purpose:
        "Append provider-neutral CallSession canonical events and apply the deterministic state machine without raw provider payloads.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_call_session_rebuild",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/rebuild",
      contractFamily: "CallSessionRebuildContract",
      purpose:
        "Rebuild one CallSession projection from append-only canonical session events, immutable assessment refs, and replay-safe precedence rules.",
      bodyRequired: false,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_call_session_projection_current",
      method: "GET",
      path: "/internal/telephony/call-sessions/{callSessionRef}/projection",
      contractFamily: "CallSessionProjectionContract",
      purpose:
        "Expose the support-safe derived CallSession projection with masked caller fragments and linked readiness refs only.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_identifier_capture_append",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/identifier-captures",
      contractFamily: "TelephonyIdentifierCaptureAttemptContract",
      purpose:
        "Append controlled-order caller identifier captures through IdentityEvidenceVault, returning only vault refs, hashes, and masked fragments.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_verification_evaluate",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/verification",
      contractFamily: "TelephonyVerificationDecisionContract",
      purpose:
        "Resolve local patient candidates, compute calibrated identity and destination confidence lower bounds, and submit seeded evidence to IdentityBindingAuthority without local binding mutation.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_verification_decision_current",
      method: "GET",
      path: "/internal/telephony/call-sessions/{callSessionRef}/verification",
      contractFamily: "TelephonyVerificationProjectionContract",
      purpose:
        "Expose the latest support-safe telephony verification decision with refs, lower bounds, reason codes, and continuation posture only.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_recording_fetch_job_schedule",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/recordings/fetch-jobs",
      contractFamily: "RecordingFetchJobContract",
      purpose:
        "Create or replay the durable recording fetch job from a provider recording-available event without persisting raw provider URLs or assets.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_recording_fetch_worker_drain",
      method: "POST",
      path: "/internal/telephony/recording-fetch-worker/drain",
      contractFamily: "AudioIngestSettlementContract",
      purpose:
        "Fetch provider recording assets through the adapter boundary, quarantine and scan audio, settle governed storage, and create exact-once DocumentReference links.",
      bodyRequired: false,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_recording_document_reference_current",
      method: "GET",
      path: "/internal/telephony/call-sessions/{callSessionRef}/recordings",
      contractFamily: "RecordingDocumentReferenceProjectionContract",
      purpose:
        "Expose the current support-safe recording DocumentReference linkage with governed object refs and artifact URLs only.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_transcript_job_enqueue",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/transcript-jobs",
      contractFamily: "TranscriptJobContract",
      purpose:
        "Enqueue append-only transcript and fact-extraction work from governed recording DocumentReference refs without treating worker status as clinical readiness.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_transcript_worker_drain",
      method: "POST",
      path: "/internal/telephony/transcript-worker/drain",
      contractFamily: "TranscriptDerivationPackageContract",
      purpose:
        "Run rapid transcription and structured fact extraction, append immutable derivation packages, and settle transcript-readiness plus evidence-readiness records.",
      bodyRequired: false,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_evidence_readiness_current",
      method: "GET",
      path: "/internal/telephony/call-sessions/{callSessionRef}/evidence-readiness",
      contractFamily: "TelephonyEvidenceReadinessProjectionContract",
      purpose:
        "Expose the latest promotion-gating TelephonyEvidenceReadinessAssessment and governing refs for support-safe callers.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_manual_audio_review_queue",
      method: "GET",
      path: "/internal/telephony/manual-audio-review",
      contractFamily: "ManualAudioReviewQueueEntryContract",
      purpose:
        "List structured manual audio review queue entries for degraded transcripts, contradictions, urgent-live-only postures, and unusable audio follow-up.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_continuation_eligibility_settle",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/continuation-eligibility",
      contractFamily: "TelephonyContinuationEligibilityContract",
      purpose:
        "Settle seeded, challenge, or manual-only continuation eligibility from the latest readiness, identity, destination, binding, and route-fence posture before any dispatch decision.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_continuation_dispatch_create",
      method: "POST",
      path: "/internal/telephony/call-sessions/{callSessionRef}/continuation-dispatches",
      contractFamily: "ContinuationDispatchIntentContract",
      purpose:
        "Issue canonical continuation AccessGrant rows for seeded or challenge outcomes, or persist explicit manual-only no-grant routing, then create a masked SMS dispatch intent.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_continuation_grant_redeem",
      method: "POST",
      path: "/patient/secure-link/telephony-continuation/redeem",
      contractFamily: "ContinuationRedemptionOutcomeContract",
      purpose:
        "Redeem a continuation AccessGrant exactly once, returning the settled secure-link session, replay, denial, supersession, or same-shell recovery outcome.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_recovery_continuation_resume",
      method: "POST",
      path: "/patient/secure-link/telephony-continuation/recovery",
      contractFamily: "RecoveryContinuationEnvelopeContract",
      purpose:
        "Consume a RecoveryContinuationToken after step-up, stale-link, contact-route repair, subject conflict, or session-expiry interruption without dropping the caller into a generic shell.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_secure_link_session_projection_current",
      method: "GET",
      path: "/internal/telephony/continuation-sessions/{secureLinkSessionRef}",
      contractFamily: "SecureLinkSessionProjectionContract",
      purpose:
        "Expose the governed continuation session projection and disclosure posture created after successful SMS continuation redemption.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_convergence_command_submit",
      method: "POST",
      path: "/internal/telephony/convergence/submit",
      contractFamily: "TelephonyConvergenceCommandContract",
      purpose:
        "Freeze phone, secure-link continuation, or support-assisted capture and converge it into canonical SubmissionIngressRecord, NormalizedSubmission, duplicate, promotion, and receipt semantics.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "telephony_convergence_current_projection",
      method: "GET",
      path: "/internal/telephony/convergence/{convergenceOutcomeRef}",
      contractFamily: "ChannelParityProjectionContract",
      purpose:
        "Expose provenance-safe channel parity, duplicate, promotion, and canonical normalized-submission refs for a settled convergence command.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_convergence_receipt_status",
      method: "GET",
      path: "/internal/telephony/convergence/{convergenceOutcomeRef}/receipt-status",
      contractFamily: "ReceiptConsistencyKeyContract",
      purpose:
        "Expose the channel-neutral receipt and early status consistency keys used by web, phone, continuation, and support-assisted intake.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "telephony_convergence_readiness_resume",
      method: "POST",
      path: "/internal/telephony/convergence/{convergenceOutcomeRef}/readiness-resume",
      contractFamily: "LateReadinessConvergenceResumeContract",
      purpose:
        "Resume an already frozen ingress after a later safety-usable evidence-readiness assessment without creating a second request or receipt.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "phone_followup_evidence_ingest",
      method: "POST",
      path: "/internal/telephony/followups/evidence",
      contractFamily: "FollowupEvidenceIngressCommandContract",
      purpose:
        "Freeze post-submit phone, SMS continuation, support-transcribed, or duplicate-attachment evidence and settle canonical duplicate, assimilation, material-delta, and re-safety records.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "phone_followup_assimilation_current",
      method: "GET",
      path: "/internal/telephony/followups/{followupOutcomeRef}/assimilation",
      contractFamily: "FollowupEvidenceAssimilationContract",
      purpose:
        "Expose the settled EvidenceClassificationDecision, MaterialDeltaAssessment, EvidenceAssimilationRecord, and SafetyPreemptionRecord refs for a late phone evidence batch.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "phone_followup_projection_hold_current",
      method: "GET",
      path: "/internal/telephony/followups/{followupOutcomeRef}/projection-hold",
      contractFamily: "PhoneFollowupProjectionHoldContract",
      purpose:
        "Expose patient and staff projection hold states so stale routine reassurance is suppressed while late evidence review or re-safety is pending.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "phone_followup_duplicate_review_current",
      method: "GET",
      path: "/internal/telephony/followups/{followupOutcomeRef}/duplicate-review",
      contractFamily: "FollowupDuplicateControlContract",
      purpose:
        "Expose same-request attach, same-episode review, same-episode link, and separate-request decisions with continuity witness outcomes.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "identity_binding_authority_settle",
      method: "POST",
      path: "/identity/binding/settle",
      contractFamily: "IdentityBindingAuthorityCommandContract",
      purpose:
        "Settle binding intents through the append-only IdentityBindingAuthority with CAS, idempotency, and derived patient-ref transaction semantics.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_binding_authority_current",
      method: "GET",
      path: "/identity/binding/current",
      contractFamily: "IdentityBindingCurrentPointerContract",
      purpose:
        "Read the current binding pointer owned by IdentityBindingAuthority without permitting route-local patientRef mutation.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "capability_decision_evaluate",
      method: "POST",
      path: "/identity/capability/evaluate",
      contractFamily: "CapabilityDecisionContract",
      purpose:
        "Evaluate a protected route through CapabilityDecisionEngine so unknown routes deny and CapabilityDecision remains a ceiling only.",
      bodyRequired: true,
      idempotencyRequired: false,
    },
    {
      routeId: "scope_envelope_authorize",
      method: "POST",
      path: "/identity/capability/scope-envelope/authorize",
      contractFamily: "AccessGrantScopeEnvelopeAuthorizationContract",
      purpose:
        "Validate grant scope envelopes against the current route tuple, session epoch, binding version, lineage fence, and release/channel posture.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "access_grant_issue",
      method: "POST",
      path: "/identity/access-grants/issue",
      contractFamily: "AccessGrantIssueContract",
      purpose:
        "Issue redeemable grants only through the canonical AccessGrantService with immutable AccessGrantScopeEnvelope records and token-hash storage.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "access_grant_redeem",
      method: "POST",
      path: "/identity/access-grants/redeem",
      contractFamily: "AccessGrantRedemptionContract",
      purpose:
        "Settle terminal grant redemption through AccessGrantRedemptionRecord and return the same outcome for duplicate clicks, refreshes, and replays.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "access_grant_supersede",
      method: "POST",
      path: "/identity/access-grants/supersede",
      contractFamily: "AccessGrantSupersessionContract",
      purpose:
        "Record every grant rotation, revocation, replacement, and privilege change as an AccessGrantSupersessionRecord.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "draft_claim_redeem",
      method: "POST",
      path: "/v1/drafts/{publicId}/claim",
      contractFamily: "ClaimRedemptionWorkflowContract",
      purpose:
        "Redeem claim grants only after active-session, CapabilityDecision, RouteIntentBinding, scope-envelope, and IdentityBindingAuthority handoff checks.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "secure_link_redeem",
      method: "POST",
      path: "/identity/access-grants/secure-link/redeem",
      contractFamily: "SecureLinkAccessGrantRedemptionContract",
      purpose:
        "Project stale secure-link or continuation grants into same-shell recovery instead of silently upgrading session privilege.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_repair_signal",
      method: "POST",
      path: "/identity/repair/signals",
      contractFamily: "IdentityRepairSignalContract",
      purpose:
        "Append wrong-patient suspicion or confirmed drift as an immutable IdentityRepairSignal and open or reuse the active repair case.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_repair_freeze",
      method: "POST",
      path: "/identity/repair/freeze",
      contractFamily: "IdentityRepairFreezeRecordContract",
      purpose:
        "Commit the exact-once IdentityRepairFreezeRecord, lineage fence, stale session fencing, grant supersession, route-intent supersession, and communication hold.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_repair_branch_disposition",
      method: "POST",
      path: "/identity/repair/branches/settle",
      contractFamily: "IdentityRepairBranchDispositionContract",
      purpose:
        "Settle quarantined downstream branch dispositions for compensation, suppression, rebuild, or manual review before release.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_repair_correction",
      method: "POST",
      path: "/identity/repair/correction",
      contractFamily: "IdentityRepairAuthorityCorrectionContract",
      purpose:
        "Apply corrected or revoked identity bindings only through IdentityBindingAuthority after freeze and dual review.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_repair_release",
      method: "POST",
      path: "/identity/repair/release",
      contractFamily: "IdentityRepairReleaseSettlementContract",
      purpose:
        "Settle the single IdentityRepairReleaseSettlement that rebuilds projections and permits fresh sessions, grants, route intents, and communications.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "identity_repair_hold_projection",
      method: "GET",
      path: "/identity/repair/hold",
      contractFamily: "PatientIdentityHoldProjectionContract",
      purpose:
        "Expose safe PatientIdentityHoldProjection and PatientActionRecoveryProjection surfaces without stale PHI details or generic redirects.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "capability_route_profiles",
      method: "GET",
      path: "/identity/capability/route-profiles",
      contractFamily: "RouteCapabilityProfileRegistryContract",
      purpose:
        "Expose the explicit route profile registry consumed by the central capability decision engine.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_current",
      method: "GET",
      path: "/v1/bookings/cases/{bookingCaseId}",
      contractFamily: "BookingCaseBundleContract",
      purpose:
        "Expose the current BookingCase, durable BookingIntent lineage, SearchPolicy ref, and append-only transition journal for one booking branch.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_create_from_intent",
      method: "POST",
      path: "/internal/v1/bookings/cases:create-from-intent",
      contractFamily: "CreateBookingCaseFromIntentCommandContract",
      purpose:
        "Create or replay one Phase 4 BookingCase from the current Phase 3 booking handoff lineage without widening capability, slot, offer, or waitlist authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_capability_checked",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-capability-checked",
      contractFamily: "BookingCaseCapabilityCheckedCommandContract",
      purpose:
        "Acknowledge that the booking case handoff tuple remains current and can enter capability_checked before any live slot search starts.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_begin_local_search",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:begin-local-search",
      contractFamily: "BookingCaseBeginLocalSearchCommandContract",
      purpose:
        "Enter searching_local only when the current capability tuple is live and one SearchPolicy has been durably recorded.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_publish_offers_ready",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:publish-offers-ready",
      contractFamily: "BookingCaseOffersReadyCommandContract",
      purpose:
        "Advance the booking branch into offers_ready when a typed OfferSession ref exists, without claiming offer-generation ownership.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_start_selection",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:start-selection",
      contractFamily: "BookingCaseSelectionCommandContract",
      purpose:
        "Advance the booking branch into selecting against one typed selected-slot ref and the live booking tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_start_revalidation",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:start-revalidation",
      contractFamily: "BookingCaseRevalidationCommandContract",
      purpose:
        "Advance the booking branch into revalidating without locally re-deriving reservation or commit semantics.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_enter_commit_pending",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:enter-commit-pending",
      contractFamily: "BookingCaseCommitPendingCommandContract",
      purpose:
        "Advance the booking branch into commit_pending against the current selected-slot tuple while keeping BookingTransaction authority external to 282.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_confirmation_pending",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-confirmation-pending",
      contractFamily: "BookingCaseConfirmationPendingCommandContract",
      purpose:
        "Advance the booking branch into confirmation_pending when authoritative confirmation truth is pending on the same lineage.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_supplier_reconciliation_pending",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-supplier-reconciliation-pending",
      contractFamily: "BookingCaseSupplierReconciliationPendingCommandContract",
      purpose:
        "Advance the booking branch into supplier_reconciliation_pending when authoritative booking truth is ambiguous or disputed on the same lineage.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_waitlisted",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-waitlisted",
      contractFamily: "BookingCaseWaitlistedCommandContract",
      purpose:
        "Advance the booking branch into waitlisted only when typed waitlist truth refs exist, without claiming waitlist policy authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_callback_fallback",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-callback-fallback",
      contractFamily: "BookingCaseCallbackFallbackCommandContract",
      purpose:
        "Advance the booking branch into callback_fallback only when the typed fallback obligation and linked callback case refs exist.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_hub_fallback",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-hub-fallback",
      contractFamily: "BookingCaseHubFallbackCommandContract",
      purpose:
        "Advance the booking branch into fallback_to_hub only when the typed fallback obligation and linked hub case refs exist.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_booking_failed",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-booking-failed",
      contractFamily: "BookingCaseFailureCommandContract",
      purpose:
        "Advance the booking branch into booking_failed when the authoritative continuation path has ended without live waitlist or fallback truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_booked",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-booked",
      contractFamily: "BookingCaseBookedCommandContract",
      purpose:
        "Advance the booking branch into booked only when typed appointment and confirmation-truth refs exist on the current lineage.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_mark_managed",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:mark-managed",
      contractFamily: "BookingCaseManagedCommandContract",
      purpose:
        "Advance the booking branch into managed when authoritative appointment truth exists, without granting request closure authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_close",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:close",
      contractFamily: "BookingCaseCloseCommandContract",
      purpose:
        "Close one finished booking branch without directly closing the canonical request lifecycle.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_capability_current",
      method: "GET",
      path: "/v1/bookings/cases/{bookingCaseId}/capability",
      contractFamily: "BookingCapabilityResolutionContract",
      purpose:
        "Resolve one current BookingCapabilityResolution and BookingCapabilityProjection for the exact booking-case tuple.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "appointment_manage_capability_current",
      method: "GET",
      path: "/v1/appointments/{appointmentId}/manage-capability",
      contractFamily: "AppointmentManageCapabilityResolutionContract",
      purpose:
        "Resolve one current BookingCapabilityResolution and BookingCapabilityProjection for the exact appointment-manage tuple.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_capability_resolve",
      method: "POST",
      path: "/internal/v1/bookings/capabilities:resolve-case",
      contractFamily: "ResolveBookingCaseCapabilityCommandContract",
      purpose:
        "Compile the current binding and persist one lawful booking-case capability tuple for the exact tenant, provider, audience, and route context.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "appointment_manage_capability_resolve",
      method: "POST",
      path: "/internal/v1/bookings/capabilities:resolve-appointment-manage",
      contractFamily: "ResolveAppointmentManageCapabilityCommandContract",
      purpose:
        "Compile the current binding and persist one lawful appointment-manage capability tuple for the exact tenant, provider, audience, and route context.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_capability_diagnostics",
      method: "GET",
      path: "/internal/v1/bookings/capabilities/diagnostics",
      contractFamily: "BookingCapabilityDiagnosticsContract",
      purpose:
        "Inspect the current matrix row, binding, fallback actions, blocked reasons, and projection for internal diagnostics without widening booking truth.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_slot_search_current",
      method: "GET",
      path: "/v1/bookings/cases/{bookingCaseId}/slot-search/current",
      contractFamily: "SlotSearchSessionContract",
      purpose:
        "Resolve the current frozen SlotSearchSession, SlotSetSnapshot, recovery state, and candidate index for one booking case.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_slot_snapshot_page",
      method: "GET",
      path: "/v1/bookings/slot-snapshots/{slotSetSnapshotId}/pages/{pageNumber}",
      contractFamily: "SlotSetSnapshotPageContract",
      purpose:
        "Fetch one page from the frozen SnapshotCandidateIndex after re-evaluating the active booking-case and capability tuple.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_slot_snapshot_day_bucket",
      method: "GET",
      path: "/v1/bookings/slot-snapshots/{slotSetSnapshotId}/days/{localDayKey}",
      contractFamily: "SlotSetSnapshotDayBucketContract",
      purpose:
        "Fetch one local-day bucket from the frozen SnapshotCandidateIndex after re-evaluating the active booking-case and capability tuple.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_slot_search_start",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:start-slot-search",
      contractFamily: "StartSlotSearchCommandContract",
      purpose:
        "Execute one bounded supplier search and freeze a SlotSearchSession plus SlotSetSnapshot against the live booking-case and capability tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_slot_search_refresh",
      method: "POST",
      path: "/internal/v1/bookings/slot-snapshots/{slotSetSnapshotId}:refresh",
      contractFamily: "RefreshSlotSearchCommandContract",
      purpose:
        "Refresh or supersede the current booking slot snapshot without widening beyond the live SearchPolicy and capability tuple.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_slot_search_invalidate",
      method: "POST",
      path: "/internal/v1/bookings/slot-snapshots/{slotSetSnapshotId}:invalidate",
      contractFamily: "InvalidateSlotSnapshotCommandContract",
      purpose:
        "Invalidate a stale or disputed slot snapshot while preserving its recovery provenance and clearing the current snapshot pointer.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_offer_session_current",
      method: "GET",
      path: "/v1/bookings/cases/{bookingCaseId}/offers/current",
      contractFamily: "OfferSessionContract",
      purpose:
        "Resolve the current authoritative OfferSession, CapacityRankProof, explanation rows, and branch posture for one booking case.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_offer_session_page",
      method: "GET",
      path: "/v1/bookings/offer-sessions/{offerSessionId}/pages/{pageNumber}",
      contractFamily: "OfferSessionPageContract",
      purpose:
        "Slice the persisted CapacityRankProof into one stable page without rescoring the current slot snapshot.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_offer_session_compare",
      method: "GET",
      path: "/v1/bookings/offer-sessions/{offerSessionId}/compare",
      contractFamily: "OfferSessionCompareContract",
      purpose:
        "Return a compare subset in the persisted proof order so browser compare mode cannot fork ranking or reason-cue truth.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_offer_session_create",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:create-offer-session",
      contractFamily: "CreateOfferSessionCommandContract",
      purpose:
        "Compile one deterministic RankPlan, CapacityRankProof, explanation set, and OfferSession from the current lawful slot snapshot.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_offer_session_refresh",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:refresh-offer-session",
      contractFamily: "RefreshOfferSessionCommandContract",
      purpose:
        "Supersede the current OfferSession from the latest lawful slot snapshot while keeping ranking replay append-only.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_offer_session_select_candidate",
      method: "POST",
      path: "/internal/v1/bookings/offer-sessions/{offerSessionId}:select-candidate",
      contractFamily: "SelectOfferCandidateCommandContract",
      purpose:
        "Verify one selection token and selection-proof hash, then move the BookingCase into selecting without claiming hold or commit truth.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_truth_current",
      method: "GET",
      path: "/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}",
      contractFamily: "BookingReservationTruthContract",
      purpose:
        "Resolve the authoritative CapacityReservation, ReservationTruthProjection, fence token, and append-only audit journal for one offer-session or waitlist scope.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_reservation_soft_select",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:soft-select",
      contractFamily: "BookingReservationSoftSelectCommandContract",
      purpose:
        "Create or refresh one bounded soft_selected CapacityReservation without implying exclusivity.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_acquire_hold",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:acquire-hold",
      contractFamily: "BookingReservationAcquireHoldCommandContract",
      purpose:
        "Acquire or refresh one real exclusive hold only when the current binding allows reservationSemantics = exclusive_hold.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_mark_pending_confirmation",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:mark-pending-confirmation",
      contractFamily: "BookingReservationPendingConfirmationCommandContract",
      purpose:
        "Advance one active reservation into pending_confirmation on the same fenced scope and truth basis.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_mark_confirmed",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:mark-confirmed",
      contractFamily: "BookingReservationConfirmedCommandContract",
      purpose:
        "Mark one reservation confirmed on the same fenced scope and reservation version.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_release",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:release",
      contractFamily: "BookingReservationReleaseCommandContract",
      purpose:
        "Release one active reservation and immediately degrade ReservationTruthProjection authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_expire",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:expire",
      contractFamily: "BookingReservationExpireCommandContract",
      purpose:
        "Expire one active reservation and immediately degrade ReservationTruthProjection authority.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_mark_disputed",
      method: "POST",
      path: "/internal/v1/bookings/reservations/scopes/{scopeFamily}/{scopeObjectRef}:mark-disputed",
      contractFamily: "BookingReservationDisputedCommandContract",
      purpose:
        "Mark one reservation disputed on the same fenced scope when provider truth or external evidence conflicts.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_reservation_expiry_sweep",
      method: "POST",
      path: "/internal/v1/bookings/reservations:expire-stale",
      contractFamily: "BookingReservationExpirySweepCommandContract",
      purpose:
        "Sweep active soft-selected or held reservations whose bounded expiry has elapsed and refresh truth projections safely.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_case_commit_current",
      method: "GET",
      path: "/v1/bookings/cases/{bookingCaseId}/commit/current",
      contractFamily: "BookingTransactionBundleContract",
      purpose:
        "Resolve the current BookingTransaction, BookingConfirmationTruthProjection, AppointmentRecord, exception, reservation truth, and transition journal for one booking case.",
      bodyRequired: false,
      idempotencyRequired: false,
    },
    {
      routeId: "booking_case_begin_commit",
      method: "POST",
      path: "/internal/v1/bookings/cases/{bookingCaseId}:begin-commit",
      contractFamily: "BeginBookingCommitCommandContract",
      purpose:
        "Run preflight revalidation, reservation fencing, idempotent dispatch, authoritative success classification, and confirmation-truth settlement from the current selected offer.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_transaction_record_authoritative_observation",
      method: "POST",
      path: "/internal/v1/bookings/transactions/{bookingTransactionId}:record-authoritative-observation",
      contractFamily: "RecordBookingAuthoritativeObservationCommandContract",
      purpose:
        "Collapse supplier callbacks and read-after-write observations through the canonical receipt-checkpoint chain before booking truth is refreshed.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_transaction_reconcile_ambiguous",
      method: "POST",
      path: "/internal/v1/bookings/transactions/{bookingTransactionId}:reconcile-ambiguous",
      contractFamily: "ReconcileBookingCommitCommandContract",
      purpose:
        "Resolve a pending or disputed BookingTransaction into confirmed, failed, or expired truth without rewriting the original transaction chain.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
    {
      routeId: "booking_transaction_release_or_supersede_failed",
      method: "POST",
      path: "/internal/v1/bookings/transactions/{bookingTransactionId}:release-or-supersede-failed",
      contractFamily: "ReleaseBookingFailedTransactionCommandContract",
      purpose:
        "Release or supersede a failed, expired, or reconciliation-required BookingTransaction while keeping compensation and recovery append-only.",
      bodyRequired: true,
      idempotencyRequired: true,
    },
  ] as const satisfies readonly ServiceRouteDefinition[],
  topics: {
    consumes: [],
    publishes: ["command.accepted", "command.outbox.pending"],
  },
  readinessChecks: [
    {
      name: "idempotency_envelope",
      detail: "An explicit idempotency reservation seam exists before commands are accepted.",
      failureMode:
        "Reject command ingress rather than creating duplicate or ambiguous mutation attempts.",
    },
    {
      name: "route_intent_hook",
      detail: "Route-intent validation remains explicit before a command is queued.",
      failureMode:
        "Hold the command in validation-required posture instead of inferring caller intent.",
    },
    {
      name: "outbox_publication",
      detail: "Outbox publication remains a separate seam from command acceptance and settlement.",
      failureMode:
        "Keep the command in accepted-but-unpublished posture and surface it via readiness manifests.",
    },
  ] as const,
  retryProfiles: [
    {
      class: "transient_command_retry",
      triggers: ["idempotency store contention", "outbox append timeout"],
      outcome:
        "Retry within the bounded command window while keeping a single idempotency key in control.",
    },
    {
      class: "manual_settlement_review",
      triggers: ["scope mismatch", "route-intent ambiguity"],
      outcome: "Escalate to named review rather than marking the command settled.",
    },
  ] as const,
  secretBoundaries: ["COMMAND_IDEMPOTENCY_STORE_REF", "COMMAND_MUTATION_GATE_SECRET_REF"] as const,
  testHarnesses: ["tests/config.test.js", "tests/runtime.integration.test.js"] as const,
} as const;

export function buildWorkloadResponse(
  route: ServiceRouteDefinition,
  context: WorkloadRequestContext,
): WorkloadResponse {
  if (route.routeId === "describe_command_contracts") {
    return {
      statusCode: 200,
      body: {
        service: serviceDefinition.service,
        contractFamily: route.contractFamily,
        idempotencyTtlSeconds: context.config.idempotencyTtlSeconds,
        outboxTopic: context.config.outboxTopic,
        mutationGateMode: context.config.mutationGateMode,
        routeIntentMode: context.config.routeIntentMode,
        supportedRouteFamilies: routeIntentFamilies,
        kernelMetadata,
        domainPackages: [identityAccessDomain, intakeSafetyDomain],
      },
    };
  }

  const requestBody =
    typeof context.requestBody === "object" && context.requestBody !== null
      ? (context.requestBody as Record<string, unknown>)
      : {};
  const routeIntent = typeof requestBody.routeIntent === "string" ? requestBody.routeIntent : null;
  const dependencyCode =
    typeof requestBody.dependencyCode === "string" ? requestBody.dependencyCode : null;
  const observedFailureModeClass =
    typeof requestBody.observedFailureModeClass === "string"
      ? (requestBody.observedFailureModeClass as DependencyFailureModeClass)
      : undefined;
  const healthState =
    typeof requestBody.healthState === "string"
      ? (requestBody.healthState as DependencyHealthState)
      : undefined;
  const degradationDecision = dependencyCode
    ? resolveCommandMutationDegradation({
        dependencyCode,
        environmentRing: context.config.environment,
        routeFamilyRef: routeIntent ?? "rf_patient_requests",
        observedFailureModeClass,
        healthState,
      })
    : null;
  const accepted =
    degradationDecision === null ? true : degradationDecision.browserMutationResolution.allowed;

  return {
    statusCode: 200,
    body: {
      service: serviceDefinition.service,
      accepted,
      correlationId: context.correlationId,
      traceId: context.traceId,
      envelope: makeFoundationEvent("command.placeholder.accepted", {
        idempotencyKey: context.headers["idempotency-key"],
        routeIntent,
        kernelMetadata,
      }),
      idempotency: {
        key: context.headers["idempotency-key"],
        ttlSeconds: context.config.idempotencyTtlSeconds,
        status: "reserved",
      },
      mutationGate: {
        mode: context.config.mutationGateMode,
        releaseRing: foundationReleasePosture["clinical-workspace"].ring,
        requiredScope: foundationPolicyScopes.triage_review,
      },
      routeIntentValidation: {
        mode: context.config.routeIntentMode,
        observedRouteIntent: routeIntent,
        supportedRouteFamilies: routeIntentFamilies,
        status: routeIntent ? "observed" : "missing_but_stubbed",
      },
      degradation:
        degradationDecision === null
          ? null
          : {
              decisionState: degradationDecision.decisionState,
              outcomeState: degradationDecision.outcomeState,
              dependencyCode: degradationDecision.dependencyCode,
              browserMutationMode: degradationDecision.browserMutationResolution.mode,
              browserReadPosture: degradationDecision.browserMutationResolution.readPosture,
              gatewayReadMode: degradationDecision.gatewayReadResolution.mode,
              primaryAudienceFallback: degradationDecision.primaryAudienceFallback,
              blockedEscalationFamilyRefs: degradationDecision.blockedEscalationFamilyRefs,
              reasonRefs: degradationDecision.reasonRefs,
            },
      settlement: {
        state: accepted ? "awaiting_settlement_evidence" : "halted_by_dependency_degradation",
        note: accepted
          ? "Acceptance never implies settlement truth."
          : "Dependency degradation froze mutation authority before command ingress could widen truth.",
      },
      outbox: {
        topic: context.config.outboxTopic,
        status: accepted ? "queued_stub" : "withheld_by_degradation",
      },
    },
  };
}
