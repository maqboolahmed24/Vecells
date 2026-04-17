#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

DOCS_PROGRAMME = ROOT / "docs" / "programme"
DOCS_FRONTEND = ROOT / "docs" / "frontend"
DATA_ANALYSIS = ROOT / "data" / "analysis"

GATE_DOC = DOCS_PROGRAMME / "209_crosscutting_patient_account_and_support_gate.md"
MATRIX_DOC = DOCS_PROGRAMME / "209_crosscutting_track_dependency_matrix.md"
CLAIM_DOC = DOCS_PROGRAMME / "209_crosscutting_parallel_claim_protocol.md"
REGISTRY_DOC = DOCS_PROGRAMME / "209_crosscutting_shared_interface_registry.md"
BOARD_PATH = DOCS_FRONTEND / "209_crosscutting_gate_board.html"
TRACK_MATRIX_PATH = DATA_ANALYSIS / "209_crosscutting_track_matrix.csv"
GATE_JSON_PATH = DATA_ANALYSIS / "209_crosscutting_parallel_gate.json"
REGISTRY_JSON_PATH = DATA_ANALYSIS / "209_crosscutting_shared_interface_seams.json"
MOCK_ACTUAL_PATH = DATA_ANALYSIS / "209_crosscutting_mock_now_vs_actual_later_matrix.csv"

TASK_ID = "seq_209"
VISUAL_MODE = "Patient_Account_Support_Gate_Board"
GENERATED_AT = "2026-04-15T00:00:00Z"
SCHEMA_VERSION = "crosscutting-parallel-gate-v1"

LANES = [
    {
        "laneId": "patient_backend",
        "label": "Patient backend",
        "color": "#3158E0",
        "tasks": ["par_210", "par_211", "par_212", "par_213", "par_214"],
        "summary": "Projection owners for patient home, request detail, child context, records, and communications.",
    },
    {
        "laneId": "patient_frontend",
        "label": "Patient frontend",
        "color": "#5B61F6",
        "tasks": ["par_215", "par_216", "par_217"],
        "summary": "Patient account routes consume backend projections and publish browser proof without route-local truth.",
    },
    {
        "laneId": "support_backend",
        "label": "Support backend",
        "color": "#0F766E",
        "tasks": ["par_218", "par_219"],
        "summary": "Support lineage, ticket workspace, controlled repair, delivery, replay, and fallback foundations.",
    },
    {
        "laneId": "support_frontend",
        "label": "Support frontend",
        "color": "#B7791F",
        "tasks": ["par_220", "par_221", "par_222"],
        "summary": "Staff entry, support ticket shell, masking, read-only fallback, and contextual assist surfaces.",
    },
]

CONTINUITY_LAWS = [
    {
        "lawId": "IDENTITY_BINDING_TRUTH",
        "label": "Identity-binding truth",
        "rule": "No patient or support surface may reinterpret authenticated subject, identity hold, wrong-patient repair, or binding supersession outside the Phase 2 binding outputs.",
        "sourceRefs": ["data/test/204_suite_results.json", "data/test/206_suite_results.json", "data/test/207_suite_results.json"],
    },
    {
        "lawId": "SESSION_TRUTH",
        "label": "Session truth",
        "rule": "Local session, logout, expiry, state, nonce, and same-shell recovery remain owned by the Phase 2 session governor.",
        "sourceRefs": ["data/test/204_suite_results.json", "data/analysis/195_auth_recovery_state_matrix.csv"],
    },
    {
        "lawId": "RELEASE_TRUST_FREEZES",
        "label": "Release and trust freezes",
        "rule": "Writable posture requires route intent, release freeze, channel release posture, and assurance-slice trust to remain live for the governing object.",
        "sourceRefs": ["data/analysis/180_scope_envelope_authorization_cases.json", "data/analysis/197_access_posture_and_reason_code_matrix.csv"],
    },
    {
        "lawId": "SAME_SHELL_CONTINUITY",
        "label": "Same-shell continuity",
        "rule": "Home, request detail, more-info, records, messages, support ticket, observe, and replay routes preserve shell and selected anchor when the continuity tuple is still valid.",
        "sourceRefs": ["data/analysis/199_saved_context_restore_and_promotion_mapping_matrix.csv", "blueprint/phase-0-the-foundation-protocol.md"],
    },
    {
        "lawId": "RETURN_CONTRACTS",
        "label": "Return contracts",
        "rule": "Patient and support child routes return through typed return bundles or continuity evidence, not browser history alone.",
        "sourceRefs": ["blueprint/patient-account-and-communications-blueprint.md", "blueprint/staff-operations-and-support-blueprint.md"],
    },
    {
        "lawId": "CANONICAL_REQUEST_AND_DUPLICATE_TRUTH",
        "label": "Canonical request and duplicate truth",
        "rule": "Request lineage, duplicate follow-up, late evidence, and re-safety remain canonical request truth and may only be consumed through the published projections.",
        "sourceRefs": ["data/test/206_suite_results.json", "data/test/207_suite_results.json", "data/analysis/184_request_identity_state_matrix.csv"],
    },
    {
        "lawId": "CONTACT_REACHABILITY_TRUTH",
        "label": "Contact and reachability truth",
        "rule": "Reachability, contact repair, consent, callback, and delivery posture are blocker-first and may not be bypassed by stale optimistic actions.",
        "sourceRefs": ["data/analysis/200_contact_source_editability_and_repair_matrix.csv", "data/analysis/201_channel_parity_matrix.csv"],
    },
    {
        "lawId": "MASKING_REPLAY_TRUTH",
        "label": "Masking and replay truth",
        "rule": "Support summary, replay, observe, and read-only fallback preserve chronology and mask scope without becoming a second system of record.",
        "sourceRefs": ["data/analysis/186_masking_and_disclosure_cases.json", "blueprint/staff-operations-and-support-blueprint.md"],
    },
]

GAP_ARTIFACTS = [
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json",
        "taskId": TASK_ID,
        "missingSurface": "Patient home projection implementation may be absent while 210 is in parallel.",
        "expectedOwnerTask": "par_210",
        "temporaryFallback": "Use frozen Phase 2 portal projection rows and render home as governed placeholder with no dashboard filler until PatientSpotlightDecisionProjection lands.",
        "riskIfUnresolved": "Home spotlight ownership or quiet posture could be recomputed locally by frontend routes.",
        "followUpAction": "Task 210 must publish PatientSpotlightDecisionProjection, PatientSpotlightDecisionUseWindow, PatientQuietHomeDecision, and alias resolution before merge gate 223.",
    },
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json",
        "taskId": TASK_ID,
        "missingSurface": "More-info, callback, reachability, consent, and contact-repair child context may be absent while 212 is in parallel.",
        "expectedOwnerTask": "par_212",
        "temporaryFallback": "Expose child-route placeholders from PatientRequestDownstreamProjection and suppress live reply or callback actions unless typed routing says live.",
        "riskIfUnresolved": "Request detail could hide active child work or leave stale reply and callback controls armed.",
        "followUpAction": "Task 212 must publish the more-info, callback, reachability, contact-repair, and consent checkpoint projection family before integration.",
    },
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json",
        "taskId": TASK_ID,
        "missingSurface": "Health-record and artifact parity projections may be absent while 213 is in parallel.",
        "expectedOwnerTask": "par_213",
        "temporaryFallback": "Render records as summary-first placeholders bound to source artifact refs and do not promote chart, preview, download, or follow-up action without a parity witness.",
        "riskIfUnresolved": "Record summary, table, chart, preview, and download could drift from source artifact truth.",
        "followUpAction": "Task 213 must publish PatientRecordSurfaceContext, PatientRecordArtifactProjection, RecordArtifactParityWitness, and continuity state.",
    },
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json",
        "taskId": TASK_ID,
        "missingSurface": "Communications visibility, conversation chronology, callback cards, reminder notices, and receipt grammar may be absent while 214 is in parallel.",
        "expectedOwnerTask": "par_214",
        "temporaryFallback": "Keep clusters visible as governed placeholders and bind every unread, reminder, callback, and composer affordance to a non-live state.",
        "riskIfUnresolved": "Message rows, thread mastheads, callback cards, and receipts could disagree or leak preview content beyond the current envelope.",
        "followUpAction": "Task 214 must publish communications visibility and timeline projections with placeholder and receipt parity before merge.",
    },
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json",
        "taskId": TASK_ID,
        "missingSurface": "Support ticket lineage, subject history, and workspace projection may be absent while 218 is in parallel.",
        "expectedOwnerTask": "par_218",
        "temporaryFallback": "Support entry and ticket shells may show ticket-shell placeholders but must not stitch request, message, subject, or artifact truth locally.",
        "riskIfUnresolved": "Support could become a second system of record or widen masked history outside context binding.",
        "followUpAction": "Task 218 must publish SupportLineageBinding, SupportTicketWorkspaceProjection, subject context, and disclosure records.",
    },
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json",
        "taskId": TASK_ID,
        "missingSurface": "Controlled resend, delivery repair, support replay, and read-only fallback settlement may be absent while 219 is in parallel.",
        "expectedOwnerTask": "par_219",
        "temporaryFallback": "Support action workbench remains preview or read-only only; no resend, repair, replay release, or live restore can be armed.",
        "riskIfUnresolved": "Support repair or replay could duplicate external effects or restore live controls from stale evidence.",
        "followUpAction": "Task 219 must publish mutation, settlement, replay checkpoint, evidence boundary, release, and restore contracts.",
    },
    {
        "fileName": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json",
        "taskId": TASK_ID,
        "missingSurface": "Support entry, core ticket shell, masking, read-only fallback, knowledge, observe, and replay UI may be absent while 220-222 are in parallel.",
        "expectedOwnerTask": "par_220;par_221;par_222",
        "temporaryFallback": "Keep support frontend surfaces as governed entry or child placeholders that preserve anchors, chronology, mask scope, and read-only posture.",
        "riskIfUnresolved": "Operators could lose place, widen disclosure accidentally, or mistake stale context for writable authority.",
        "followUpAction": "Tasks 220-222 must publish Playwright-proven support entry, ticket, masking, fallback, observe, replay, and knowledge surfaces before merge.",
    },
]


def list_value(values: list[str]) -> str:
    return ";".join(values)


def task_rows() -> list[dict[str, Any]]:
    rows = [
        {
            "taskNumber": "210",
            "taskId": "par_210",
            "taskName": "Patient spotlight decision projection and quiet home logic",
            "domainLane": "patient_backend",
            "sourceSections": [
                "patient-account-and-communications-blueprint.md#Patient home contract",
                "patient-portal-experience-architecture-blueprint.md#Home",
                "phase-0-the-foundation-protocol.md#PatientSpotlightDecisionProjection",
            ],
            "hardPrerequisites": ["seq_208", "seq_209", "par_185", "par_196", "par_197", "par_199", "par_200", "par_201"],
            "softPrerequisites": ["par_211", "par_212", "par_213", "par_214"],
            "sharedInterfacesConsumed": ["PatientRequestsIndexProjection", "PatientNextActionProjection", "PatientSafetyInterruptionProjection", "PatientReachabilitySummaryProjection", "PatientCallbackStatusProjection"],
            "sharedInterfacesProduced": ["PatientSpotlightDecisionProjection", "PatientSpotlightDecisionUseWindow", "PatientQuietHomeDecision", "PatientPortalNavigationProjection", "PatientNavUrgencyDigest", "PatientNavReturnContract"],
            "allowedParallelNeighbors": ["par_211", "par_212", "par_213", "par_214", "par_215"],
            "forbiddenOverlap": "May not own request detail, typed action routing, more-info, record, communications, or support ticket semantics.",
            "mergeGateRequirements": "Home alias resolution and spotlight use-window proofs must land; gap HOME closed or explicitly reconciled.",
            "mockNowVsActualLaterAssumptions": "Fixture-backed request, status, reachability, and identity signals now; richer records/messages/support candidates enter later through the same ranking rules.",
        },
        {
            "taskNumber": "211",
            "taskId": "par_211",
            "taskName": "Request browsing, detail, lineage, and typed patient action routing projections",
            "domainLane": "patient_backend",
            "sourceSections": [
                "patient-account-and-communications-blueprint.md#Requests browsing contract",
                "patient-account-and-communications-blueprint.md#Request detail contract",
                "patient-account-and-communications-blueprint.md#Typed patient action routing contract",
            ],
            "hardPrerequisites": ["seq_208", "seq_209", "par_184", "par_185", "par_196", "par_197", "par_198", "par_199", "par_200", "par_201"],
            "softPrerequisites": ["par_210", "par_212", "par_213", "par_214"],
            "sharedInterfacesConsumed": ["PatientSpotlightDecisionProjection", "PatientNavReturnContract", "PatientCommunicationVisibilityProjection"],
            "sharedInterfacesProduced": ["PatientRequestsIndexProjection", "PatientRequestLineageProjection", "PatientRequestDetailProjection", "PatientRequestDownstreamProjection", "PatientRequestReturnBundle", "PatientNextActionProjection", "PatientActionRoutingProjection", "PatientActionSettlementProjection", "PatientSafetyInterruptionProjection"],
            "allowedParallelNeighbors": ["par_210", "par_212", "par_213", "par_214", "par_215", "par_216", "par_217"],
            "forbiddenOverlap": "May not decide home spotlight ownership, callback truth, record parity, communications chronology, or support lineage ownership.",
            "mergeGateRequirements": "List, detail, downstream, return bundle, action routing, settlement, and safety interruption parity must agree with frontend task 215.",
            "mockNowVsActualLaterAssumptions": "Use current canonical request/status/continuity outputs now; future child projections plug into downstream placeholders and typed routing only.",
        },
        {
            "taskNumber": "212",
            "taskId": "par_212",
            "taskName": "More-info response thread, callback status, reachability, and contact repair projections",
            "domainLane": "patient_backend",
            "sourceSections": [
                "patient-account-and-communications-blueprint.md#More-info response contract",
                "patient-account-and-communications-blueprint.md#Callback status, contact repair, and consent checkpoint contract",
                "callback-and-clinician-messaging-loop.md#CallbackExpectationEnvelope",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_211", "par_214", "par_216"],
            "sharedInterfacesConsumed": ["PatientRequestDetailProjection", "PatientActionRoutingProjection", "PatientRequestReturnBundle", "ConversationThreadProjection"],
            "sharedInterfacesProduced": ["PatientMoreInfoStatusProjection", "PatientMoreInfoResponseThreadProjection", "PatientCallbackStatusProjection", "PatientReachabilitySummaryProjection", "PatientContactRepairProjection", "PatientConsentCheckpointProjection", "CallbackExpectationEnvelope", "CallbackOutcomeEvidenceBundle", "CallbackResolutionGate"],
            "allowedParallelNeighbors": ["par_210", "par_211", "par_213", "par_214", "par_215", "par_216"],
            "forbiddenOverlap": "May not replace request detail/action routing or own communications timeline chronology beyond callback and reply child truth.",
            "mergeGateRequirements": "REQUEST_CONTEXT gap closed; blocker-first dominance proven with 216 and communications placeholders.",
            "mockNowVsActualLaterAssumptions": "Simulator and fixture reachability/callback chains now; live provider callback evidence stays actual-later through Phase 2 carry-forward.",
        },
        {
            "taskNumber": "213",
            "taskId": "par_213",
            "taskName": "Health record projection and record artifact parity witness",
            "domainLane": "patient_backend",
            "sourceSections": [
                "patient-account-and-communications-blueprint.md#Health record contract",
                "patient-portal-experience-architecture-blueprint.md#Secure health record visualization",
                "phase-0-the-foundation-protocol.md#Artifact presentation",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_211", "par_214", "par_217"],
            "sharedInterfacesConsumed": ["PatientRequestLineageProjection", "PatientRequestReturnBundle", "PatientActionRoutingProjection"],
            "sharedInterfacesProduced": ["PatientRecordSurfaceContext", "PatientResultInterpretationProjection", "PatientRecordArtifactProjection", "RecordArtifactParityWitness", "PatientRecordFollowUpEligibilityProjection", "PatientRecordContinuityState"],
            "allowedParallelNeighbors": ["par_210", "par_211", "par_212", "par_214", "par_217"],
            "forbiddenOverlap": "May not invent request status, communications visibility, or support artifact authority; record summaries remain subordinate to source artifacts.",
            "mergeGateRequirements": "Record parity witness must be present before charts, downloads, previews, or follow-up actions go live.",
            "mockNowVsActualLaterAssumptions": "Fixture artifact and release posture now; production clinical record integrations and live downloads remain actual-later.",
        },
        {
            "taskNumber": "214",
            "taskId": "par_214",
            "taskName": "Communications timeline and message/callback visibility rules",
            "domainLane": "patient_backend",
            "sourceSections": [
                "patient-account-and-communications-blueprint.md#Communications timeline contract",
                "callback-and-clinician-messaging-loop.md#Conversation truth tuple",
                "patient-portal-experience-architecture-blueprint.md#Direct communication with providers",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_211", "par_212", "par_217", "par_219"],
            "sharedInterfacesConsumed": ["PatientRequestLineageProjection", "PatientCallbackStatusProjection", "PatientReachabilitySummaryProjection", "PatientRequestReturnBundle"],
            "sharedInterfacesProduced": ["PatientCommunicationVisibilityProjection", "ConversationThreadProjection", "ConversationSubthreadProjection", "PatientConversationPreviewDigest", "PatientReceiptEnvelope", "ConversationCommandSettlement", "MessageDispatchEnvelope", "MessageDeliveryEvidenceBundle"],
            "allowedParallelNeighbors": ["par_210", "par_211", "par_212", "par_213", "par_217", "par_218", "par_219"],
            "forbiddenOverlap": "May not own support ticket chronology, controlled resend, record artifact parity, or request action settlement.",
            "mergeGateRequirements": "COMMUNICATIONS gap closed; patient message rows, thread mastheads, callback cards, reminders, and receipts agree.",
            "mockNowVsActualLaterAssumptions": "Simulator-backed dispatch, receipt, and callback facts now; live provider evidence remains actual-later.",
        },
        {
            "taskNumber": "215",
            "taskId": "par_215",
            "taskName": "Frontend patient home, requests, and request detail routes",
            "domainLane": "patient_frontend",
            "sourceSections": [
                "patient-portal-experience-architecture-blueprint.md#Shell and route map",
                "patient-account-and-communications-blueprint.md#Patient home contract",
                "patient-account-and-communications-blueprint.md#Requests browsing contract",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_210", "par_211", "par_212", "par_213", "par_214"],
            "sharedInterfacesConsumed": ["PatientSpotlightDecisionProjection", "PatientQuietHomeDecision", "PatientRequestsIndexProjection", "PatientRequestDetailProjection", "PatientRequestReturnBundle", "PatientNextActionProjection"],
            "sharedInterfacesProduced": ["PatientHomeRequestsRouteContract", "PatientRequestDetailRouteContract", "PatientAccountVisualGrammar"],
            "allowedParallelNeighbors": ["par_210", "par_211", "par_212", "par_213", "par_214", "par_216", "par_217"],
            "forbiddenOverlap": "May not recompute backend projection truth, add dashboard filler, or arm route-local CTAs outside PatientNextActionProjection.",
            "mergeGateRequirements": "Playwright proof for home/list/detail; governed placeholders for every missing sibling projection; no dashboard drift.",
            "mockNowVsActualLaterAssumptions": "Mock projection payloads can drive UI states now; later real APIs must preserve identical typed projection consumption.",
        },
        {
            "taskNumber": "216",
            "taskId": "par_216",
            "taskName": "Frontend more-info, callback status, and contact repair views",
            "domainLane": "patient_frontend",
            "sourceSections": [
                "patient-account-and-communications-blueprint.md#More-info response contract",
                "patient-portal-experience-architecture-blueprint.md#same-shell child-route behavior",
                "accessibility-and-content-system-contract.md",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_211", "par_212", "par_214", "par_215"],
            "sharedInterfacesConsumed": ["PatientMoreInfoStatusProjection", "PatientMoreInfoResponseThreadProjection", "PatientCallbackStatusProjection", "PatientReachabilitySummaryProjection", "PatientContactRepairProjection", "PatientConsentCheckpointProjection", "PatientRequestReturnBundle"],
            "sharedInterfacesProduced": ["PatientMoreInfoCallbackRepairRouteContract"],
            "allowedParallelNeighbors": ["par_212", "par_214", "par_215", "par_217"],
            "forbiddenOverlap": "May not detach more-info into a standalone app or infer callback timers locally.",
            "mergeGateRequirements": "REQUEST_CONTEXT and COMMUNICATIONS seams reconciled; Playwright covers blocker-first, confirmation, recovery, and read-only states.",
            "mockNowVsActualLaterAssumptions": "Fixture thread and repair payloads now; live delivery and callback evidence later through the same projections.",
        },
        {
            "taskNumber": "217",
            "taskId": "par_217",
            "taskName": "Frontend health record and communications timeline views",
            "domainLane": "patient_frontend",
            "sourceSections": [
                "patient-portal-experience-architecture-blueprint.md#Secure health record visualization",
                "patient-account-and-communications-blueprint.md#Health record contract",
                "patient-account-and-communications-blueprint.md#Communications timeline contract",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_213", "par_214", "par_215", "par_216"],
            "sharedInterfacesConsumed": ["PatientRecordSurfaceContext", "RecordArtifactParityWitness", "PatientCommunicationVisibilityProjection", "ConversationThreadProjection", "PatientConversationPreviewDigest", "PatientReceiptEnvelope"],
            "sharedInterfacesProduced": ["PatientRecordsCommunicationsRouteContract", "RecordAndConversationVisualGrammar"],
            "allowedParallelNeighbors": ["par_213", "par_214", "par_215", "par_216"],
            "forbiddenOverlap": "May not make charts or previews authoritative, hide blocked communications, or invent record interpretation locally.",
            "mergeGateRequirements": "RECORDS and COMMUNICATIONS seams closed or placeholders governed; Playwright covers parity fallback and visibility placeholders.",
            "mockNowVsActualLaterAssumptions": "Fixture records and conversation clusters now; production documents and live message evidence later.",
        },
        {
            "taskNumber": "218",
            "taskId": "par_218",
            "taskName": "Support lineage binding, ticket projection, and subject history queries",
            "domainLane": "support_backend",
            "sourceSections": [
                "staff-operations-and-support-blueprint.md#Support desk model",
                "staff-operations-and-support-blueprint.md#SupportTicketWorkspaceProjection",
                "phase-0-the-foundation-protocol.md#masking and disclosure",
            ],
            "hardPrerequisites": ["seq_208", "seq_209", "par_186"],
            "softPrerequisites": ["par_211", "par_214", "par_219", "par_220", "par_221", "par_222"],
            "sharedInterfacesConsumed": ["PatientRequestLineageProjection", "ConversationThreadProjection", "PatientCommunicationVisibilityProjection", "MessageDeliveryEvidenceBundle"],
            "sharedInterfacesProduced": ["SupportTicket", "SupportLineageBinding", "SupportLineageScopeMember", "SupportLineageArtifactBinding", "SupportTicketWorkspaceProjection", "SupportSubject360Projection", "SupportSubjectContextBinding", "SupportContextDisclosureRecord", "SupportReadOnlyFallbackProjection"],
            "allowedParallelNeighbors": ["par_214", "par_219", "par_220", "par_221", "par_222"],
            "forbiddenOverlap": "May not replace patient request, message, identity, callback, artifact, or communications truth with support-local copies.",
            "mergeGateRequirements": "SUPPORT_LINEAGE gap closed; support ticket shell and subject context cite lineage, artifact, mask scope, and disclosure records.",
            "mockNowVsActualLaterAssumptions": "Fixture support tickets and masked subject summaries now; live support data migration later.",
        },
        {
            "taskNumber": "219",
            "taskId": "par_219",
            "taskName": "Controlled resend, delivery repair, and support replay foundations",
            "domainLane": "support_backend",
            "sourceSections": [
                "staff-operations-and-support-blueprint.md#Controlled resend and delivery-repair contract",
                "callback-and-clinician-messaging-loop.md#MessageDispatchEnvelope",
                "staff-operations-and-support-blueprint.md#Support replay",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_214", "par_218", "par_220", "par_221", "par_222"],
            "sharedInterfacesConsumed": ["SupportLineageBinding", "SupportTicketWorkspaceProjection", "MessageDispatchEnvelope", "MessageDeliveryEvidenceBundle", "ConversationCommandSettlement"],
            "sharedInterfacesProduced": ["SupportOmnichannelTimelineProjection", "SupportMutationAttempt", "SupportActionRecord", "SupportActionSettlement", "CommunicationReplayRecord", "SupportReplayCheckpoint", "SupportReplayEvidenceBoundary", "SupportReplayDeltaReview", "SupportReplayReleaseDecision", "SupportReplayRestoreSettlement", "SupportRouteIntentToken", "SupportContinuityEvidenceProjection", "SupportActionWorkbenchProjection", "SupportReachabilityPostureProjection"],
            "allowedParallelNeighbors": ["par_214", "par_218", "par_220", "par_221", "par_222"],
            "forbiddenOverlap": "May not rewrite provider adapters, claim live provider proof, or create second timeline truth through resend or replay.",
            "mergeGateRequirements": "SUPPORT_REPAIR_REPLAY gap closed; duplicate clicks, retries, replay checkpoints, release, restore, and read-only fallback are idempotent and evidence-bound.",
            "mockNowVsActualLaterAssumptions": "Simulator-backed delivery and replay evidence now; live provider webhook proof later.",
        },
        {
            "taskNumber": "220",
            "taskId": "par_220",
            "taskName": "Staff start-of-day operations and support entry surfaces",
            "domainLane": "support_frontend",
            "sourceSections": [
                "staff-operations-and-support-blueprint.md#staff start-of-day model",
                "operations-console-frontend-blueprint.md#NorthStarBand",
                "staff-operations-and-support-blueprint.md#SupportDeskHomeProjection",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_218", "par_219", "par_221", "par_222"],
            "sharedInterfacesConsumed": ["SupportDeskHomeProjection", "SupportInboxProjection", "SupportTicketWorkspaceProjection", "SupportOmnichannelTimelineProjection", "SupportReadOnlyFallbackProjection"],
            "sharedInterfacesProduced": ["WorkspaceHomeProjection", "StaffInboxProjection", "SupportDeskHomeProjection", "SupportInboxProjection", "SupportEntryRouteContract"],
            "allowedParallelNeighbors": ["par_218", "par_219", "par_221", "par_222"],
            "forbiddenOverlap": "May not turn staff entry into a KPI dashboard or invent deeper ticket semantics beyond governed placeholders.",
            "mergeGateRequirements": "Playwright proves quiet workbench, operations entry, support inbox entry, placeholders, reduced motion, and no support ownership creep.",
            "mockNowVsActualLaterAssumptions": "Fixture entry projections now; live operations publication and queue data later through the same route contracts.",
        },
        {
            "taskNumber": "221",
            "taskId": "par_221",
            "taskName": "Support workspace shell and omnichannel ticket views",
            "domainLane": "support_frontend",
            "sourceSections": [
                "staff-operations-and-support-blueprint.md#support route contract",
                "staff-operations-and-support-blueprint.md#SupportTicketWorkspaceProjection",
                "platform-frontend-blueprint.md",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_218", "par_219", "par_220", "par_222"],
            "sharedInterfacesConsumed": ["SupportTicketWorkspaceProjection", "SupportOmnichannelTimelineProjection", "SupportActionWorkbenchProjection", "SupportReachabilityPostureProjection", "SupportActionSettlement", "SupportContinuityEvidenceProjection"],
            "sharedInterfacesProduced": ["SupportWorkspaceShellRouteContract", "SupportTicketConversationPlaneContract"],
            "allowedParallelNeighbors": ["par_218", "par_219", "par_220", "par_222"],
            "forbiddenOverlap": "May not own masking-depth, read-only fallback depth, or backend mutation semantics; may only render bounded placeholders for 222 child surfaces.",
            "mergeGateRequirements": "Playwright proves ticket-centric same shell, chronology parity, action-entry boundaries, degraded states, and anchor preservation.",
            "mockNowVsActualLaterAssumptions": "Fixture tickets and timelines now; production support integrations later.",
        },
        {
            "taskNumber": "222",
            "taskId": "par_222",
            "taskName": "Support masking, read-only fallback, contextual knowledge, observe, and replay panels",
            "domainLane": "support_frontend",
            "sourceSections": [
                "staff-operations-and-support-blueprint.md#masking, artifact, and read-only fallback contract",
                "staff-operations-and-support-blueprint.md#SupportKnowledgeStackProjection",
                "staff-operations-and-support-blueprint.md#SupportReplayEvidenceBoundary",
            ],
            "hardPrerequisites": ["seq_208", "seq_209"],
            "softPrerequisites": ["par_218", "par_219", "par_221"],
            "sharedInterfacesConsumed": ["SupportReadOnlyFallbackProjection", "SupportSubject360Projection", "SupportSubjectContextBinding", "SupportContextDisclosureRecord", "SupportReplayCheckpoint", "SupportReplayEvidenceBoundary", "SupportReplayRestoreSettlement"],
            "sharedInterfacesProduced": ["SupportKnowledgeStackProjection", "SupportKnowledgeBinding", "SupportKnowledgeAssistLease", "SupportObserveSession", "SupportReplaySession", "SupportPresentationArtifact", "SupportMaskingFallbackRouteContract"],
            "allowedParallelNeighbors": ["par_218", "par_219", "par_220", "par_221"],
            "forbiddenOverlap": "May not fork the support shell anatomy, widen disclosure locally, or treat replay/observe state as live writable authority.",
            "mergeGateRequirements": "Playwright proves masking preserves chronology, read-only fallback keeps anchors, knowledge assists are bounded, and replay/observe posture is visible.",
            "mockNowVsActualLaterAssumptions": "Fixture masking, knowledge, observe, and replay states now; live disclosure and replay sessions later.",
        },
    ]
    for row in rows:
        row["promptRef"] = f"prompt/{row['taskNumber']}.md"
        row["gapArtifactRefs"] = matching_gap_refs(row["taskId"], row["sharedInterfacesProduced"], row["sharedInterfacesConsumed"])
    return rows


def matching_gap_refs(task_id: str, produced: list[str], consumed: list[str]) -> list[str]:
    names = set(produced) | set(consumed)
    refs: list[str] = []
    if task_id in {"par_210", "par_215"} or {"PatientSpotlightDecisionProjection", "PatientQuietHomeDecision"} & names:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json")
    if task_id in {"par_211", "par_212", "par_216"} or {"PatientMoreInfoStatusProjection", "PatientCallbackStatusProjection", "PatientContactRepairProjection"} & names:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json")
    if task_id in {"par_213", "par_217"} or {"RecordArtifactParityWitness", "PatientRecordArtifactProjection"} & names:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json")
    if task_id in {"par_214", "par_217"} or {"PatientCommunicationVisibilityProjection", "ConversationThreadProjection"} & names:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json")
    if task_id in {"par_218", "par_220", "par_221", "par_222"} or {"SupportLineageBinding", "SupportTicketWorkspaceProjection"} & names:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json")
    if task_id in {"par_219", "par_221", "par_222"} or {"SupportOmnichannelTimelineProjection", "SupportReplayCheckpoint"} & names:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json")
    if task_id in {"par_220", "par_221", "par_222"}:
        refs.append("data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json")
    return sorted(set(refs))


def interface_registry() -> list[dict[str, Any]]:
    def row(name: str, owner: str, consumers: list[str], family: str, gap: str | None, fallback: str) -> dict[str, Any]:
        return {
            "interfaceName": name,
            "interfaceFamily": family,
            "authoritativeOwnerTask": owner,
            "consumingTasks": consumers,
            "versioningRule": "v1 is frozen by seq_209; additive presentation fields require a minor registry note; ownership, route intent, actionability, visibility, masking, or settlement semantics require a major version and merge-gate approval.",
            "temporaryFallbackIfOwnerNotLanded": fallback,
            "gapArtifactAllowed": gap is not None,
            "gapArtifactRef": f"data/analysis/{gap}" if gap else "",
            "sourceRefs": source_refs_for_family(family),
        }

    home_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json"
    request_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json"
    records_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json"
    comms_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json"
    support_lineage_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json"
    support_repair_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json"
    support_frontend_gap = "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json"
    placeholder = "Render governed placeholder or read-only summary; no live writable posture or hidden route-local truth is allowed."
    return [
        row("PatientSpotlightDecisionProjection", "par_210", ["par_215", "par_211", "par_216", "par_217"], "patient_home_spotlight_family", home_gap, placeholder),
        row("PatientSpotlightDecisionUseWindow", "par_210", ["par_215", "par_211"], "patient_home_spotlight_family", home_gap, placeholder),
        row("PatientQuietHomeDecision", "par_210", ["par_215", "par_216", "par_217"], "patient_home_spotlight_family", home_gap, placeholder),
        row("PatientPortalNavigationProjection", "par_210", ["par_215", "par_216", "par_217"], "patient_home_spotlight_family", home_gap, placeholder),
        row("PatientNavUrgencyDigest", "par_210", ["par_215", "par_216", "par_217"], "patient_home_spotlight_family", home_gap, placeholder),
        row("PatientNavReturnContract", "par_210", ["par_211", "par_215", "par_216", "par_217"], "patient_home_spotlight_family", home_gap, placeholder),
        row("PatientRequestsIndexProjection", "par_211", ["par_210", "par_215", "par_216", "par_217", "par_218"], "patient_request_action_family", request_gap, placeholder),
        row("PatientRequestLineageProjection", "par_211", ["par_212", "par_213", "par_214", "par_215", "par_216", "par_217", "par_218", "par_219"], "patient_request_action_family", request_gap, placeholder),
        row("PatientRequestDetailProjection", "par_211", ["par_212", "par_213", "par_214", "par_215", "par_216", "par_217", "par_218"], "patient_request_action_family", request_gap, placeholder),
        row("PatientRequestDownstreamProjection", "par_211", ["par_212", "par_213", "par_214", "par_215", "par_216", "par_217"], "patient_request_action_family", request_gap, placeholder),
        row("PatientRequestReturnBundle", "par_211", ["par_212", "par_213", "par_214", "par_215", "par_216", "par_217"], "patient_request_action_family", request_gap, placeholder),
        row("PatientNextActionProjection", "par_211", ["par_210", "par_215", "par_216", "par_217"], "patient_request_action_family", request_gap, placeholder),
        row("PatientActionRoutingProjection", "par_211", ["par_212", "par_213", "par_215", "par_216", "par_217"], "patient_request_action_family", request_gap, placeholder),
        row("PatientActionSettlementProjection", "par_211", ["par_212", "par_215", "par_216", "par_217"], "patient_request_action_family", request_gap, placeholder),
        row("PatientSafetyInterruptionProjection", "par_211", ["par_210", "par_212", "par_215", "par_216", "par_217"], "patient_request_action_family", request_gap, placeholder),
        row("PatientMoreInfoStatusProjection", "par_212", ["par_211", "par_215", "par_216", "par_214"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("PatientMoreInfoResponseThreadProjection", "par_212", ["par_211", "par_216", "par_214"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("PatientCallbackStatusProjection", "par_212", ["par_210", "par_211", "par_214", "par_215", "par_216", "par_217", "par_219"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("PatientReachabilitySummaryProjection", "par_212", ["par_210", "par_211", "par_215", "par_216", "par_218", "par_219"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("PatientContactRepairProjection", "par_212", ["par_210", "par_211", "par_215", "par_216", "par_218", "par_219"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("PatientConsentCheckpointProjection", "par_212", ["par_211", "par_216"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("CallbackExpectationEnvelope", "par_212", ["par_214", "par_219"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("CallbackOutcomeEvidenceBundle", "par_212", ["par_214", "par_219"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("CallbackResolutionGate", "par_212", ["par_214", "par_219"], "callback_and_clinician_message_projection_family", request_gap, placeholder),
        row("PatientRecordSurfaceContext", "par_213", ["par_215", "par_217", "par_218"], "health_record_artifact_family", records_gap, placeholder),
        row("PatientResultInterpretationProjection", "par_213", ["par_217"], "health_record_artifact_family", records_gap, placeholder),
        row("PatientRecordArtifactProjection", "par_213", ["par_217", "par_218", "par_222"], "health_record_artifact_family", records_gap, placeholder),
        row("RecordArtifactParityWitness", "par_213", ["par_217", "par_222"], "health_record_artifact_family", records_gap, placeholder),
        row("PatientRecordFollowUpEligibilityProjection", "par_213", ["par_211", "par_217"], "health_record_artifact_family", records_gap, placeholder),
        row("PatientRecordContinuityState", "par_213", ["par_217"], "health_record_artifact_family", records_gap, placeholder),
        row("PatientCommunicationVisibilityProjection", "par_214", ["par_212", "par_215", "par_216", "par_217", "par_218", "par_219"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("ConversationThreadProjection", "par_214", ["par_212", "par_216", "par_217", "par_218", "par_219"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("ConversationSubthreadProjection", "par_214", ["par_216", "par_217", "par_219"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("PatientConversationPreviewDigest", "par_214", ["par_217"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("PatientReceiptEnvelope", "par_214", ["par_216", "par_217", "par_219"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("ConversationCommandSettlement", "par_214", ["par_216", "par_217", "par_219"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("MessageDispatchEnvelope", "par_214", ["par_219", "par_221"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("MessageDeliveryEvidenceBundle", "par_214", ["par_218", "par_219", "par_221"], "communications_timeline_and_visibility_family", comms_gap, placeholder),
        row("SupportTicket", "par_218", ["par_220", "par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_lineage_gap, placeholder),
        row("SupportLineageBinding", "par_218", ["par_219", "par_220", "par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_lineage_gap, placeholder),
        row("SupportLineageScopeMember", "par_218", ["par_219", "par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_lineage_gap, placeholder),
        row("SupportLineageArtifactBinding", "par_218", ["par_219", "par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_lineage_gap, placeholder),
        row("SupportTicketWorkspaceProjection", "par_218", ["par_219", "par_220", "par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_lineage_gap, placeholder),
        row("SupportSubject360Projection", "par_218", ["par_220", "par_221", "par_222"], "support_masking_and_replay_diff_family", support_lineage_gap, placeholder),
        row("SupportSubjectContextBinding", "par_218", ["par_221", "par_222"], "support_masking_and_replay_diff_family", support_lineage_gap, placeholder),
        row("SupportContextDisclosureRecord", "par_218", ["par_221", "par_222"], "support_masking_and_replay_diff_family", support_lineage_gap, placeholder),
        row("SupportReadOnlyFallbackProjection", "par_218", ["par_219", "par_220", "par_221", "par_222"], "support_masking_and_replay_diff_family", support_lineage_gap, placeholder),
        row("SupportOmnichannelTimelineProjection", "par_219", ["par_220", "par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_repair_gap, placeholder),
        row("SupportMutationAttempt", "par_219", ["par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_repair_gap, placeholder),
        row("SupportActionRecord", "par_219", ["par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_repair_gap, placeholder),
        row("SupportActionSettlement", "par_219", ["par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_repair_gap, placeholder),
        row("CommunicationReplayRecord", "par_219", ["par_221", "par_222"], "support_masking_and_replay_diff_family", support_repair_gap, placeholder),
        row("SupportReplayCheckpoint", "par_219", ["par_222"], "support_masking_and_replay_diff_family", support_repair_gap, placeholder),
        row("SupportReplayEvidenceBoundary", "par_219", ["par_222"], "support_masking_and_replay_diff_family", support_repair_gap, placeholder),
        row("SupportReplayDeltaReview", "par_219", ["par_222"], "support_masking_and_replay_diff_family", support_repair_gap, placeholder),
        row("SupportReplayReleaseDecision", "par_219", ["par_222"], "support_masking_and_replay_diff_family", support_repair_gap, placeholder),
        row("SupportReplayRestoreSettlement", "par_219", ["par_222"], "support_masking_and_replay_diff_family", support_repair_gap, placeholder),
        row("SupportRouteIntentToken", "par_219", ["par_221", "par_222"], "shared_continuity_evidence_and_reachability_truth_family", support_repair_gap, placeholder),
        row("SupportContinuityEvidenceProjection", "par_219", ["par_220", "par_221", "par_222"], "shared_continuity_evidence_and_reachability_truth_family", support_repair_gap, placeholder),
        row("SupportActionWorkbenchProjection", "par_219", ["par_221", "par_222"], "support_ticket_and_omnichannel_timeline_family", support_repair_gap, placeholder),
        row("SupportReachabilityPostureProjection", "par_219", ["par_220", "par_221", "par_222"], "shared_continuity_evidence_and_reachability_truth_family", support_repair_gap, placeholder),
        row("WorkspaceHomeProjection", "par_220", ["par_221", "par_222"], "support_frontend_entry_family", support_frontend_gap, placeholder),
        row("SupportDeskHomeProjection", "par_220", ["par_221", "par_222"], "support_frontend_entry_family", support_frontend_gap, placeholder),
        row("SupportInboxProjection", "par_220", ["par_221", "par_222"], "support_frontend_entry_family", support_frontend_gap, placeholder),
        row("SupportWorkspaceShellRouteContract", "par_221", ["par_222", "par_223"], "support_frontend_entry_family", support_frontend_gap, placeholder),
        row("SupportKnowledgeStackProjection", "par_222", ["par_221", "par_223"], "support_masking_and_replay_diff_family", support_frontend_gap, placeholder),
        row("SupportKnowledgeBinding", "par_222", ["par_221", "par_223"], "support_masking_and_replay_diff_family", support_frontend_gap, placeholder),
        row("SupportKnowledgeAssistLease", "par_222", ["par_221", "par_223"], "support_masking_and_replay_diff_family", support_frontend_gap, placeholder),
        row("SupportObserveSession", "par_222", ["par_221", "par_223"], "support_masking_and_replay_diff_family", support_frontend_gap, placeholder),
        row("SupportReplaySession", "par_222", ["par_221", "par_223"], "support_masking_and_replay_diff_family", support_frontend_gap, placeholder),
        row("SupportPresentationArtifact", "par_222", ["par_221", "par_223"], "support_masking_and_replay_diff_family", support_frontend_gap, placeholder),
    ]


def source_refs_for_family(family: str) -> list[str]:
    mapping = {
        "patient_home_spotlight_family": ["blueprint/patient-account-and-communications-blueprint.md", "blueprint/patient-portal-experience-architecture-blueprint.md", "prompt/210.md"],
        "patient_request_action_family": ["blueprint/patient-account-and-communications-blueprint.md", "blueprint/patient-portal-experience-architecture-blueprint.md", "prompt/211.md"],
        "callback_and_clinician_message_projection_family": ["blueprint/patient-account-and-communications-blueprint.md", "blueprint/callback-and-clinician-messaging-loop.md", "prompt/212.md"],
        "health_record_artifact_family": ["blueprint/patient-account-and-communications-blueprint.md", "blueprint/patient-portal-experience-architecture-blueprint.md", "prompt/213.md"],
        "communications_timeline_and_visibility_family": ["blueprint/patient-account-and-communications-blueprint.md", "blueprint/callback-and-clinician-messaging-loop.md", "prompt/214.md"],
        "support_ticket_and_omnichannel_timeline_family": ["blueprint/staff-operations-and-support-blueprint.md", "prompt/218.md", "prompt/219.md"],
        "support_masking_and_replay_diff_family": ["blueprint/staff-operations-and-support-blueprint.md", "prompt/219.md", "prompt/222.md"],
        "shared_continuity_evidence_and_reachability_truth_family": ["blueprint/phase-0-the-foundation-protocol.md", "blueprint/staff-operations-and-support-blueprint.md", "prompt/219.md"],
        "support_frontend_entry_family": ["blueprint/staff-operations-and-support-blueprint.md", "blueprint/operations-console-frontend-blueprint.md", "prompt/220.md", "prompt/221.md", "prompt/222.md"],
    }
    return mapping[family]


MERGE_GATES = [
    {
        "gateId": "MG_209_TASK_OUTPUT_CONTRACT_PRESENT",
        "label": "Every task publishes required contracts",
        "requirement": "Tasks 210-222 must each publish their promised docs, data, validator, and Playwright or backend proof before seq_223 integrates the block.",
        "evidenceRefs": ["prompt/210.md", "prompt/211.md", "prompt/212.md", "prompt/213.md", "prompt/214.md", "prompt/215.md", "prompt/216.md", "prompt/217.md", "prompt/218.md", "prompt/219.md", "prompt/220.md", "prompt/221.md", "prompt/222.md"],
    },
    {
        "gateId": "MG_209_INTERFACE_SINGLE_OWNER",
        "label": "Shared interfaces have one owner",
        "requirement": "Every interface in the shared registry has exactly one authoritative owner and all consumers bind through that owner or an explicit gap artifact.",
        "evidenceRefs": ["data/analysis/209_crosscutting_shared_interface_seams.json"],
    },
    {
        "gateId": "MG_209_PHASE2_TRUTH_CONSUMED_NOT_REOPENED",
        "label": "Phase 2 truth is consumed",
        "requirement": "Identity, session, release/trust, same-shell, return, request, duplicate, masking, and replay laws remain frozen and are not redefined by patient or support tasks.",
        "evidenceRefs": ["data/analysis/208_phase2_exit_gate_decision.json", "data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json"],
    },
    {
        "gateId": "MG_209_NO_DASHBOARD_ROUTE_LOCAL_DRIFT",
        "label": "No dashboard or route-local drift",
        "requirement": "Patient home stays quiet and projection-owned; staff/support entry stays workbench-owned; no route may recompute action, visibility, or status truth from local joins.",
        "evidenceRefs": ["docs/frontend/209_crosscutting_gate_board.html", "tests/playwright/209_crosscutting_gate_board.spec.js"],
    },
    {
        "gateId": "MG_209_GAP_ARTIFACT_RECONCILED",
        "label": "Parallel gaps are explicit and resolved",
        "requirement": "Every missing sibling seam is represented by a PARALLEL_INTERFACE_GAP_CROSSCUTTING artifact and is either closed by the owning task or carried into 223 as a named blocker.",
        "evidenceRefs": [f"data/analysis/{gap['fileName']}" for gap in GAP_ARTIFACTS],
    },
    {
        "gateId": "MG_209_MOCK_ACTUAL_BOUNDARY",
        "label": "Mock-now and actual-later stay separated",
        "requirement": "Simulator, fixture, and board evidence may open the block; live provider, live credential, clinical-safety, DSPT, and production operational evidence remain actual-later.",
        "evidenceRefs": ["data/analysis/209_crosscutting_mock_now_vs_actual_later_matrix.csv", "data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json"],
    },
    {
        "gateId": "MG_209_BROWSER_BOARD_PARITY",
        "label": "Board agrees with registry",
        "requirement": "The browser gate board, track matrix, merge gate strip, seam ribbon, ownership conflict panel, and mock/actual boundary map agree exactly with machine-readable artifacts.",
        "evidenceRefs": ["docs/frontend/209_crosscutting_gate_board.html", "tests/playwright/209_crosscutting_gate_board.spec.js"],
    },
]

FORBIDDEN_OVERLAPS = [
    {
        "overlapId": "FO_209_HOME_VS_REQUEST_ACTIONS",
        "title": "Home spotlight cannot own request action semantics",
        "ownerBoundary": "par_210 owns spotlight selection; par_211 owns request action routing and settlement.",
        "risk": "Two dominant patient CTAs or a home card that bypasses typed action routing.",
        "mergeCheck": "Patient home Playwright proof must show the spotlight CTA binds to PatientNextActionProjection or renders read-only.",
    },
    {
        "overlapId": "FO_209_REQUEST_VS_CHILD_CONTEXT",
        "title": "Request detail cannot hide missing child context",
        "ownerBoundary": "par_211 owns shell/detail placeholders; par_212, par_213, and par_214 own child truth.",
        "risk": "More-info, callback, record, or message work disappears instead of degrading to governed placeholders.",
        "mergeCheck": "Request downstream projections must enumerate every missing child with a placeholder or gap artifact.",
    },
    {
        "overlapId": "FO_209_RECORDS_COMMS_STATUS_DRIFT",
        "title": "Records and communications cannot redefine status",
        "ownerBoundary": "par_213 owns source-artifact parity; par_214 owns visibility/receipt chronology; neither owns canonical request status.",
        "risk": "Record summaries, callback cards, or receipt copy contradict request list/detail state.",
        "mergeCheck": "Lineage and receipt parity evidence must bind to PatientRequestLineageProjection and authoritative settlement refs.",
    },
    {
        "overlapId": "FO_209_FRONTEND_ROUTE_LOCAL_TRUTH",
        "title": "Frontend routes cannot compose truth locally",
        "ownerBoundary": "par_215 to par_217 consume typed patient projections; par_220 to par_222 consume typed support projections.",
        "risk": "Browser state, local joins, optimistic timers, or dashboard widgets become de facto domain logic.",
        "mergeCheck": "Playwright and validators must assert projection payload parity for every browser state.",
    },
    {
        "overlapId": "FO_209_SUPPORT_SECOND_SYSTEM_OF_RECORD",
        "title": "Support cannot become a second system of record",
        "ownerBoundary": "par_218 frames support tickets over lineage; patient request, message, callback, identity, and artifact truths stay upstream.",
        "risk": "Ticket-local copies diverge from patient-visible truth or mask scope.",
        "mergeCheck": "Support projections cite SupportLineageBinding, SupportLineageArtifactBinding, and disclosure records for every widened context.",
    },
    {
        "overlapId": "FO_209_REPAIR_REPLAY_EXTERNAL_EFFECTS",
        "title": "Repair and replay cannot fork external effects",
        "ownerBoundary": "par_219 owns controlled resend, repair, replay checkpoint, release, and restore settlement; frontend tasks render only those states.",
        "risk": "Duplicate operator clicks or provider retries create second external side effects or timeline truth.",
        "mergeCheck": "Support action settlement and replay release must prove idempotency, evidence freeze, live-restore checks, and read-only fallback.",
    },
]


def dependency_edges(rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    edges: list[dict[str, str]] = []
    all_tasks = {row["taskId"] for row in rows}
    for row in rows:
        for prereq in row["hardPrerequisites"]:
            if prereq in all_tasks or prereq == "seq_209":
                edges.append({"fromTask": prereq, "toTask": row["taskId"], "edgeType": "hard", "mergeGateRef": "MG_209_TASK_OUTPUT_CONTRACT_PRESENT"})
        for prereq in row["softPrerequisites"]:
            if prereq in all_tasks:
                edges.append({"fromTask": prereq, "toTask": row["taskId"], "edgeType": "soft_parallel_seam", "mergeGateRef": "MG_209_GAP_ARTIFACT_RECONCILED"})
    return edges


def mock_actual_rows() -> list[dict[str, str]]:
    return [
        {
            "boundaryId": "MA_209_NHS_LOGIN_AND_SESSION",
            "surfaceArea": "identity session and patient account entry",
            "mockNowAllowed": "Phase 2 simulator-backed session and recovery evidence",
            "actualLaterOwner": "live provider onboarding and production release gate",
            "temporaryFallback": "Do not claim credentialled NHS login; use frozen local session fixtures.",
            "closeCondition": "Credentialled NHS login callback, session, logout, and recovery suites pass unchanged.",
            "riskIfBlurred": "Patient account routes could imply production identity readiness.",
            "artifactRef": "data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json",
        },
        {
            "boundaryId": "MA_209_HOME_SPOTLIGHT",
            "surfaceArea": "home spotlight and quiet home",
            "mockNowAllowed": "Fixture candidate sets and prior portal matrices",
            "actualLaterOwner": "par_210",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json",
            "closeCondition": "210 publishes decision projection, use-window cases, and alias resolution.",
            "riskIfBlurred": "Dashboard filler could replace lawful quiet-home decision.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json",
        },
        {
            "boundaryId": "MA_209_REQUEST_ACTIONS",
            "surfaceArea": "request list detail and typed patient actions",
            "mockNowAllowed": "Canonical request/status fixtures and governed placeholders",
            "actualLaterOwner": "par_211",
            "temporaryFallback": "Downstream placeholders; no raw domain posts.",
            "closeCondition": "211 publishes request projections and action settlement cases.",
            "riskIfBlurred": "Route-local CTAs bypass typed routing and settlement.",
            "artifactRef": "data/analysis/209_crosscutting_track_matrix.csv",
        },
        {
            "boundaryId": "MA_209_MORE_INFO_CALLBACK_REPAIR",
            "surfaceArea": "more-info callback reachability contact repair",
            "mockNowAllowed": "Fixture callback and reachability states",
            "actualLaterOwner": "par_212",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json",
            "closeCondition": "212 publishes blocker-first projection family.",
            "riskIfBlurred": "Stale reply or callback controls remain live beside blockers.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json",
        },
        {
            "boundaryId": "MA_209_RECORDS",
            "surfaceArea": "records results documents artifact parity",
            "mockNowAllowed": "Fixture artifact summaries and source refs",
            "actualLaterOwner": "par_213",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json",
            "closeCondition": "213 publishes record parity witness and continuity state.",
            "riskIfBlurred": "Charts, previews, or downloads imply source authority they do not have.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json",
        },
        {
            "boundaryId": "MA_209_COMMUNICATIONS",
            "surfaceArea": "patient communications timeline visibility and receipts",
            "mockNowAllowed": "Simulator-backed message and callback event evidence",
            "actualLaterOwner": "par_214",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json",
            "closeCondition": "214 publishes visibility, chronology, receipt, and settlement parity.",
            "riskIfBlurred": "Preview leakage, hidden work, or contradictory receipts.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json",
        },
        {
            "boundaryId": "MA_209_SUPPORT_LINEAGE",
            "surfaceArea": "support ticket lineage and subject history",
            "mockNowAllowed": "Fixture tickets and masked subject summaries",
            "actualLaterOwner": "par_218",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json",
            "closeCondition": "218 publishes lineage binding, workspace projection, and disclosure records.",
            "riskIfBlurred": "Support local copies become a second system of record.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json",
        },
        {
            "boundaryId": "MA_209_SUPPORT_REPAIR_REPLAY",
            "surfaceArea": "controlled resend delivery repair and replay",
            "mockNowAllowed": "Simulator-backed delivery, repair, and replay fixtures",
            "actualLaterOwner": "par_219",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json",
            "closeCondition": "219 publishes idempotent repair, replay freeze, release, restore, and fallback evidence.",
            "riskIfBlurred": "Duplicate external side effects or stale live restore.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json",
        },
        {
            "boundaryId": "MA_209_SUPPORT_FRONTEND",
            "surfaceArea": "support entry ticket shell masking knowledge observe replay",
            "mockNowAllowed": "Fixture projections and browser proof",
            "actualLaterOwner": "par_220;par_221;par_222",
            "temporaryFallback": "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json",
            "closeCondition": "220-222 publish Playwright-proven entry, ticket, masking, fallback, knowledge, observe, and replay surfaces.",
            "riskIfBlurred": "Operators mistake placeholder or stale context for writable authority.",
            "artifactRef": "data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json",
        },
        {
            "boundaryId": "MA_209_PRODUCTION_ASSURANCE",
            "surfaceArea": "clinical safety DSPT live rollback operational acceptance",
            "mockNowAllowed": "Board and local suite evidence only",
            "actualLaterOwner": "future production release gate",
            "temporaryFallback": "Keep as go-with-constraints carry-forward from 208.",
            "closeCondition": "Production gate links clinical-safety, DSPT, rollback, live incidents, and deployer acceptance.",
            "riskIfBlurred": "Crosscutting baseline could be misread as production signoff.",
            "artifactRef": "data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json",
        },
    ]


def build_gate_payload(rows: list[dict[str, Any]], registry: list[dict[str, Any]]) -> dict[str, Any]:
    lane_counts = {lane["laneId"]: len(lane["tasks"]) for lane in LANES}
    return {
        "taskId": TASK_ID,
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": GENERATED_AT,
        "visualMode": VISUAL_MODE,
        "gateState": "opened_with_explicit_parallel_seams",
        "decision": "open_patient_account_and_support_parallel_work_package",
        "sourcePrecedence": [
            "prompt/209.md",
            "prompt/shared_operating_contract_204_to_211.md",
            "prompt/shared_operating_contract_212_to_219.md",
            "prompt/shared_operating_contract_220_to_227.md",
            "data/analysis/208_phase2_exit_gate_decision.json",
            "data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json",
            "blueprint/patient-account-and-communications-blueprint.md",
            "blueprint/patient-portal-experience-architecture-blueprint.md",
            "blueprint/callback-and-clinician-messaging-loop.md",
            "blueprint/staff-operations-and-support-blueprint.md",
            "blueprint/phase-0-the-foundation-protocol.md",
        ],
        "summary": {
            "taskCount": len(rows),
            "laneCount": len(LANES),
            "patientBackendTaskCount": lane_counts["patient_backend"],
            "patientFrontendTaskCount": lane_counts["patient_frontend"],
            "supportBackendTaskCount": lane_counts["support_backend"],
            "supportFrontendTaskCount": lane_counts["support_frontend"],
            "sharedInterfaceCount": len(registry),
            "mergeGateCount": len(MERGE_GATES),
            "forbiddenOverlapCount": len(FORBIDDEN_OVERLAPS),
            "gapArtifactCount": len(GAP_ARTIFACTS),
            "mockActualBoundaryCount": len(mock_actual_rows()),
        },
        "designTokens": {
            "canvas": "#F5F7FB",
            "panel": "#FFFFFF",
            "inset": "#EEF2F7",
            "strongText": "#0F172A",
            "defaultText": "#334155",
            "mutedText": "#64748B",
            "border": "#D7DFEA",
            "patientBackend": "#3158E0",
            "patientFrontend": "#5B61F6",
            "supportBackend": "#0F766E",
            "supportFrontend": "#B7791F",
            "conflict": "#B42318",
        },
        "lanes": LANES,
        "tasks": rows,
        "dependencyEdges": dependency_edges(rows),
        "mergeGates": MERGE_GATES,
        "forbiddenOverlaps": FORBIDDEN_OVERLAPS,
        "continuityLaws": CONTINUITY_LAWS,
        "gapArtifacts": [f"data/analysis/{gap['fileName']}" for gap in GAP_ARTIFACTS],
        "requiredBoardRegions": ["TrackLaneGrid", "SharedSeamRibbon", "MergeGateStrip", "OwnershipConflictPanel", "MockVsActualBoundaryMap"],
        "driftControls": [
            "dashboard drift blocked by PatientSpotlightDecisionProjection and PatientQuietHomeDecision ownership",
            "route-local action drift blocked by PatientActionRoutingProjection and PatientActionSettlementProjection",
            "support ownership creep blocked by SupportLineageBinding and SupportLineageArtifactBinding",
        ],
    }


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    def clean(value: str) -> str:
        return str(value).replace("|", "\\|")

    output = [
        "| " + " | ".join(clean(header) for header in headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        output.append("| " + " | ".join(clean(value) for value in row) + " |")
    return "\n".join(output)


def refs_join(values: list[str]) -> str:
    return "<br>".join(values)


def render_docs(rows: list[dict[str, Any]], registry: list[dict[str, Any]], gate: dict[str, Any]) -> None:
    write_text(
        GATE_DOC,
        f"""
# Crosscutting Patient Account And Support Gate

Task: `{TASK_ID}`

Visual mode: `{VISUAL_MODE}`

Decision: `{gate["decision"]}`

Gate state: `{gate["gateState"]}`

This gate opens tasks `210` through `222` as one parallel work package with explicit seams. It does not approve production clinical-safety, DSPT, credentialled live NHS login, live signal-provider, or operational release evidence. Those remain actual-later constraints from `seq_208`.

## Tracks

{md_table(["Lane", "Tasks", "Responsibility"], [[lane["label"], refs_join(lane["tasks"]), lane["summary"]] for lane in LANES])}

## Frozen Continuity Laws

{md_table(["Law", "Rule", "Evidence"], [[law["label"], law["rule"], refs_join(law["sourceRefs"])] for law in CONTINUITY_LAWS])}

## Merge Gates

{md_table(["Gate", "Requirement", "Evidence"], [[gate_row["gateId"], gate_row["requirement"], refs_join(gate_row["evidenceRefs"])] for gate_row in MERGE_GATES])}

## Forbidden Overlap Controls

{md_table(["Overlap", "Owner boundary", "Risk", "Merge check"], [[item["title"], item["ownerBoundary"], item["risk"], item["mergeCheck"]] for item in FORBIDDEN_OVERLAPS])}

## Drift Controls

- Dashboard drift is blocked by `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, and `PatientQuietHomeDecision`.
- Route-local patient action drift is blocked by `PatientActionRoutingProjection`, `PatientActionSettlementProjection`, `PatientNextActionProjection`, and `PatientSafetyInterruptionProjection`.
- Support ownership creep is blocked by `SupportLineageBinding`, `SupportLineageArtifactBinding`, `SupportContextDisclosureRecord`, and `SupportReadOnlyFallbackProjection`.

## Machine-Readable Artifacts

- `data/analysis/209_crosscutting_parallel_gate.json`
- `data/analysis/209_crosscutting_track_matrix.csv`
- `data/analysis/209_crosscutting_shared_interface_seams.json`
- `data/analysis/209_crosscutting_mock_now_vs_actual_later_matrix.csv`
- `docs/frontend/209_crosscutting_gate_board.html`
- `tools/analysis/validate_crosscutting_parallel_gate.py`
- `tests/playwright/209_crosscutting_gate_board.spec.js`
""",
    )

    write_text(
        MATRIX_DOC,
        f"""
# Crosscutting Track Dependency Matrix

Task: `{TASK_ID}`

Every row below maps one task from `210` to `222` to its lane, source sections, hard and soft prerequisites, produced and consumed seams, allowed parallel neighbors, forbidden overlap, merge gate, and mock-now versus actual-later boundary.

{md_table(
    ["Task", "Lane", "Hard prereqs", "Soft prereqs", "Produces", "Consumes", "Allowed parallel neighbors"],
    [[row["taskId"], row["domainLane"], refs_join(row["hardPrerequisites"]), refs_join(row["softPrerequisites"]), refs_join(row["sharedInterfacesProduced"]), refs_join(row["sharedInterfacesConsumed"]), refs_join(row["allowedParallelNeighbors"])] for row in rows],
)}

## Merge Rules Per Task

{md_table(["Task", "Forbidden overlap", "Merge gate requirement", "Mock-now vs actual-later"], [[row["taskId"], row["forbiddenOverlap"], row["mergeGateRequirements"], row["mockNowVsActualLaterAssumptions"]] for row in rows])}
""",
    )

    write_text(
        CLAIM_DOC,
        f"""
# Crosscutting Parallel Claim Protocol

Task: `{TASK_ID}`

This protocol is the exact claim rule for the patient-account and support-surface work package.

## Claim Rule

1. A worker may claim any unchecked task from `210` through `222` after `seq_209` is complete.
2. Before implementing, the worker must read `prompt/AGENT.md`, the live checklist, the assigned prompt, this gate pack, the shared interface registry, and the adjacent shared operating contract.
3. The worker must treat `seq_208` and this gate as hard prerequisites.
4. Sibling outputs inside `210` to `222` are soft parallel seams unless the assigned prompt explicitly says otherwise and the output already exists.
5. If a sibling output is absent, stale, contradictory, or underspecified, the worker must consume the relevant `PARALLEL_INTERFACE_GAP_CROSSCUTTING_<AREA>.json` artifact and publish a governed placeholder, adapter, or compatibility note.
6. A worker may not mark a task complete until implementation, local validation, Playwright proof where browser-visible, and machine-readable artifacts are present.

## Parallel Compatibility

{md_table(["Task", "Allowed neighbors", "Gap artifacts"], [[row["taskId"], refs_join(row["allowedParallelNeighbors"]), refs_join(row["gapArtifactRefs"])] for row in rows])}

## Merge Stop Conditions

- Any shared interface has two owners.
- Any task consumes a sibling projection without a real artifact or explicit gap artifact.
- Any frontend route recomputes domain truth locally.
- Any support surface becomes a second request, message, identity, artifact, or delivery system of record.
- Any live-provider, production clinical-safety, DSPT, rollback, or operational evidence is claimed by this mock-now gate.
""",
    )

    write_text(
        REGISTRY_DOC,
        f"""
# Crosscutting Shared Interface Registry

Task: `{TASK_ID}`

Registry rule: one shared interface has one authoritative owner. Consumers may bind to a temporary gap artifact while the owner is still landing, but they may not create a second shape or local semantic alias.

{md_table(
    ["Interface", "Family", "Owner", "Consumers", "Gap allowed"],
    [[item["interfaceName"], item["interfaceFamily"], item["authoritativeOwnerTask"], refs_join(item["consumingTasks"]), str(item["gapArtifactAllowed"])] for item in registry],
)}

## Versioning Rule

All rows use the same frozen rule: `v1` is locked by `seq_209`; additive presentation fields require a minor registry note; ownership, route intent, actionability, visibility, masking, or settlement semantics require a major version and merge-gate approval.
""",
    )


def render_board(rows: list[dict[str, Any]], registry: list[dict[str, Any]], gate: dict[str, Any], mock_rows: list[dict[str, str]]) -> None:
    task_by_id = {row["taskId"]: row for row in rows}
    lanes_html = []
    for lane in LANES:
        task_cards = []
        for task_id in lane["tasks"]:
            row = task_by_id[task_id]
            task_cards.append(
                f"""
                <article class="task-card" data-testid="task-card-{row['taskId']}" data-task-id="{row['taskId']}">
                  <div class="task-card__top">
                    <span class="task-number">{row['taskNumber']}</span>
                    <span class="lane-dot" style="background:{lane['color']}"></span>
                  </div>
                  <h3>{html.escape(row['taskName'])}</h3>
                  <p>{html.escape(row['mergeGateRequirements'])}</p>
                  <dl>
                    <div><dt>Produces</dt><dd>{html.escape(', '.join(row['sharedInterfacesProduced'][:3]))}</dd></div>
                    <div><dt>Consumes</dt><dd>{html.escape(', '.join(row['sharedInterfacesConsumed'][:3]))}</dd></div>
                  </dl>
                  <button type="button" data-task-detail="{row['taskId']}">Inspect task seam</button>
                </article>
                """
            )
        lanes_html.append(
            f"""
            <section class="lane" data-testid="lane-{lane['laneId']}" data-lane="{lane['laneId']}" style="--lane-color:{lane['color']}">
              <div class="lane-header">
                <span>{html.escape(lane['label'])}</span>
                <strong>{len(lane['tasks'])}</strong>
              </div>
              <p>{html.escape(lane['summary'])}</p>
              <div class="connector" aria-hidden="true"></div>
              <div class="task-stack">
                {''.join(task_cards)}
              </div>
            </section>
            """
        )

    seam_buttons = []
    for item in registry:
        seam_buttons.append(
            f"""
            <button type="button" class="seam-pill" data-seam-button="{html.escape(item['interfaceName'])}" data-owner="{item['authoritativeOwnerTask']}">
              <span>{html.escape(item['interfaceName'])}</span>
              <strong>{item['authoritativeOwnerTask']}</strong>
            </button>
            """
        )

    merge_buttons = [
        f"""<button type="button" data-merge-gate="{gate_row['gateId']}"><span>{html.escape(gate_row['label'])}</span><strong>{gate_row['gateId']}</strong></button>"""
        for gate_row in MERGE_GATES
    ]
    conflict_rows = [
        f"""<li><strong>{html.escape(item['title'])}</strong><span>{html.escape(item['ownerBoundary'])}</span></li>"""
        for item in FORBIDDEN_OVERLAPS
    ]
    mock_rows_html = [
        f"""<tr><th scope="row">{html.escape(row['boundaryId'])}</th><td>{html.escape(row['surfaceArea'])}</td><td>{html.escape(row['mockNowAllowed'])}</td><td>{html.escape(row['actualLaterOwner'])}</td></tr>"""
        for row in mock_rows
    ]
    lane_filter_buttons = [
        f"""<button type="button" data-lane-filter="{lane['laneId']}">{html.escape(lane['label'])}</button>"""
        for lane in LANES
    ]
    json_blob = json.dumps({"gate": gate, "registry": registry, "mockActualRows": mock_rows}, separators=(",", ":")).replace("<", "\\u003c")
    template = """<!doctype html>
<html lang="en" data-ready="false">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>209 Crosscutting Gate Board</title>
    <style>
      :root {
        --canvas: #F5F7FB;
        --panel: #FFFFFF;
        --inset: #EEF2F7;
        --strong: #0F172A;
        --default: #334155;
        --muted: #64748B;
        --border: #D7DFEA;
        --patient-backend: #3158E0;
        --patient-frontend: #5B61F6;
        --support-backend: #0F766E;
        --support-frontend: #B7791F;
        --conflict: #B42318;
        --top-band-height: 72px;
        color: var(--default);
        background: var(--canvas);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      html, body { overflow-x: hidden; }
      body { margin: 0; min-width: 320px; background: var(--canvas); color: var(--default); }
      button { font: inherit; }
      button:focus-visible, .task-card:focus-within { outline: 3px solid #0F172A; outline-offset: 3px; }
      .board { max-width: 1600px; margin: 0 auto; padding: 20px; }
      .top-band {
        min-height: var(--top-band-height);
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        color: var(--strong);
      }
      .top-band h1 { margin: 0; font-size: 1.75rem; letter-spacing: 0; }
      .top-band p { margin: 4px 0 0; max-width: 76ch; }
      .metric-strip { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
      .metric { min-width: 112px; border: 1px solid var(--border); background: var(--panel); padding: 10px 12px; border-radius: 8px; }
      .metric strong { display: block; color: var(--strong); font-size: 1.3rem; }
      .lane-filter { display: none; gap: 8px; overflow-x: auto; padding: 8px 0; }
      .lane-filter button, .seam-pill, .merge-gate-strip button, .task-card button {
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--strong);
        border-radius: 8px;
        cursor: pointer;
      }
      .track-lane-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 16px;
        min-width: 0;
      }
      .lane { position: relative; min-width: 0; border: 1px solid var(--border); border-top: 4px solid var(--lane-color); background: var(--panel); border-radius: 8px; padding: 14px; overflow: hidden; }
      .lane-header { display: flex; justify-content: space-between; gap: 12px; color: var(--strong); font-weight: 700; }
      .lane > p { margin: 8px 0 14px; color: var(--muted); font-size: 0.92rem; }
      .connector { position: absolute; left: 22px; top: 116px; bottom: 20px; width: 2px; background: linear-gradient(var(--lane-color), transparent); opacity: 0.5; }
      .task-stack { display: grid; gap: 12px; position: relative; }
      .task-card {
        position: relative;
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        min-height: 236px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .task-card::before { content: ""; position: absolute; left: -14px; top: 28px; width: 14px; height: 2px; background: var(--lane-color); opacity: 0.7; }
      .task-card__top { display: flex; align-items: center; justify-content: space-between; }
      .task-number { font-weight: 800; color: var(--strong); }
      .lane-dot { width: 10px; height: 10px; border-radius: 999px; }
      .task-card h3 { margin: 0; color: var(--strong); font-size: 1rem; line-height: 1.25; letter-spacing: 0; }
      .task-card p { margin: 0; color: var(--default); font-size: 0.9rem; line-height: 1.4; }
      .task-card dl { display: grid; gap: 8px; margin: auto 0 0; }
      .task-card dt { font-size: 0.72rem; text-transform: uppercase; color: var(--muted); }
      .task-card dd { margin: 0; color: var(--strong); font-size: 0.82rem; overflow-wrap: anywhere; }
      .task-card button { padding: 8px 10px; text-align: left; }
      .seam-section, .merge-section, .lower-grid { margin-top: 16px; }
      .section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; color: var(--strong); }
      .section-heading h2 { margin: 0; font-size: 1.2rem; letter-spacing: 0; }
      .shared-seam-ribbon {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding: 10px 2px;
        min-width: 0;
        max-width: 100%;
      }
      .seam-pill { flex: 0 0 210px; min-height: 72px; text-align: left; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; }
      .seam-pill span { overflow-wrap: anywhere; }
      .seam-pill strong { color: var(--muted); font-size: 0.78rem; }
      .merge-gate-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; min-width: 0; max-width: 100%; }
      .merge-gate-strip button { min-height: 88px; padding: 10px; text-align: left; display: flex; flex-direction: column; justify-content: space-between; border-bottom: 3px solid #0F172A; }
      .merge-gate-strip span { color: var(--strong); font-weight: 700; }
      .merge-gate-strip strong { color: var(--muted); font-size: 0.75rem; }
      .lower-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 0.75fr); gap: 14px; align-items: start; min-width: 0; }
      .panel { border: 1px solid var(--border); border-radius: 8px; background: var(--panel); padding: 14px; min-width: 0; }
      .panel h2 { margin: 0 0 10px; color: var(--strong); font-size: 1.1rem; letter-spacing: 0; }
      .conflict-list { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
      .conflict-list li { border-left: 4px solid var(--conflict); background: #FFF7F5; padding: 10px; border-radius: 6px; display: grid; gap: 4px; }
      .conflict-list strong { color: var(--strong); }
      .conflict-list span { color: var(--default); }
      table { width: 100%; border-collapse: collapse; font-size: 0.86rem; table-layout: fixed; }
      th, td { border-bottom: 1px solid var(--border); padding: 8px; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
      th { color: var(--strong); background: var(--inset); }
      .detail-drawer { margin-top: 16px; border: 1px solid var(--border); border-radius: 8px; background: #FFFFFF; padding: 14px; min-height: 150px; }
      .detail-drawer h2 { margin: 0 0 8px; color: var(--strong); }
      .detail-drawer p { margin: 6px 0; }
      .detail-drawer code { background: var(--inset); padding: 2px 4px; border-radius: 4px; }
      @media (max-width: 1180px) {
        .track-lane-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .merge-gate-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .lower-grid { grid-template-columns: 1fr; }
      }
      @media (max-width: 720px) {
        .board { padding: 14px; }
        .top-band { grid-template-columns: 1fr; }
        .metric-strip { justify-content: stretch; }
        .metric { flex: 1 1 45%; }
        .lane-filter { display: flex; }
        .lane-filter button { flex: 0 0 auto; padding: 8px 10px; }
        .track-lane-grid { grid-template-columns: 1fr; }
        .track-lane-grid[data-active-lane] .lane { display: none; }
        .track-lane-grid[data-active-lane="patient_backend"] [data-lane="patient_backend"],
        .track-lane-grid[data-active-lane="patient_frontend"] [data-lane="patient_frontend"],
        .track-lane-grid[data-active-lane="support_backend"] [data-lane="support_backend"],
        .track-lane-grid[data-active-lane="support_frontend"] [data-lane="support_frontend"] { display: block; }
        .seam-pill { flex-basis: min(82vw, 260px); }
        .merge-gate-strip { grid-template-columns: 1fr; }
        .task-card { min-height: 210px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
      }
    </style>
  </head>
  <body>
    <script id="crosscutting-gate-data" type="application/json">__JSON__</script>
    <main class="board" data-testid="Patient_Account_Support_Gate_Board">
      <header class="top-band">
        <div>
          <h1>Crosscutting patient account and support gate</h1>
          <p>Exact dependency gate for tasks 210 through 222. Parallel work is open only through owned seams, explicit gap artifacts, and merge gates.</p>
        </div>
        <div class="metric-strip" aria-label="Gate counts">
          <div class="metric"><strong data-testid="task-count">13</strong><span>tasks</span></div>
          <div class="metric"><strong data-testid="interface-count">__INTERFACE_COUNT__</strong><span>interfaces</span></div>
          <div class="metric"><strong data-testid="gap-count">7</strong><span>gap artifacts</span></div>
          <div class="metric"><strong data-testid="merge-count">7</strong><span>merge gates</span></div>
        </div>
      </header>
      <nav class="lane-filter" data-testid="lane-filter" aria-label="Compact lane filter">
        __LANE_FILTER__
      </nav>
      <section class="track-lane-grid" data-testid="TrackLaneGrid" aria-label="Track lane grid">
        __LANES__
      </section>
      <section class="seam-section" aria-labelledby="seam-heading">
        <div class="section-heading"><h2 id="seam-heading">Shared seam ribbon</h2><span>one owner per seam</span></div>
        <div class="shared-seam-ribbon" data-testid="SharedSeamRibbon" aria-label="Shared seam ribbon">
          __SEAMS__
        </div>
      </section>
      <section class="merge-section" aria-labelledby="merge-heading">
        <div class="section-heading"><h2 id="merge-heading">Merge gate strip</h2><span>required before 223</span></div>
        <div class="merge-gate-strip" data-testid="MergeGateStrip" aria-label="Merge gate strip">
          __MERGE_GATES__
        </div>
      </section>
      <section class="lower-grid">
        <div class="panel" data-testid="OwnershipConflictPanel">
          <h2>Ownership conflict panel</h2>
          <ul class="conflict-list">__CONFLICTS__</ul>
        </div>
        <div class="panel" data-testid="MockVsActualBoundaryMap">
          <h2>Mock vs actual boundary map</h2>
          <table aria-label="Mock now versus actual later boundaries">
            <thead><tr><th>Boundary</th><th>Surface</th><th>Mock now</th><th>Actual later owner</th></tr></thead>
            <tbody>__MOCK_ROWS__</tbody>
          </table>
        </div>
      </section>
      <aside class="detail-drawer" data-testid="detail-drawer" aria-live="polite">
        <h2 data-testid="detail-title">Select a seam, task, or merge gate</h2>
        <p data-testid="detail-body">Use the lane cards, seam ribbon, or merge gate strip to inspect the exact dependency rule.</p>
        <p><strong>Owner:</strong> <code data-testid="detail-owner">seq_209</code></p>
        <p><strong>Evidence:</strong> <span data-testid="detail-evidence">data/analysis/209_crosscutting_parallel_gate.json</span></p>
      </aside>
    </main>
    <script>
      const payload = JSON.parse(document.getElementById("crosscutting-gate-data").textContent);
      const grid = document.querySelector("[data-testid='TrackLaneGrid']");
      const title = document.querySelector("[data-testid='detail-title']");
      const body = document.querySelector("[data-testid='detail-body']");
      const owner = document.querySelector("[data-testid='detail-owner']");
      const evidence = document.querySelector("[data-testid='detail-evidence']");

      function setDetail(nextTitle, nextBody, nextOwner, refs) {
        title.textContent = nextTitle;
        body.textContent = nextBody;
        owner.textContent = nextOwner;
        evidence.textContent = Array.isArray(refs) ? refs.join(", ") : refs;
      }

      document.querySelectorAll("[data-lane-filter]").forEach((button) => {
        button.addEventListener("click", () => {
          const lane = button.getAttribute("data-lane-filter");
          grid.setAttribute("data-active-lane", lane);
          setDetail("Lane filter: " + button.textContent, "Compact mobile lane filter is active. Other lanes remain in source order and return when a new lane is selected.", lane, "docs/frontend/209_crosscutting_gate_board.html");
        });
      });

      document.querySelectorAll("[data-task-detail]").forEach((button) => {
        button.addEventListener("click", () => {
          const taskId = button.getAttribute("data-task-detail");
          const task = payload.gate.tasks.find((candidate) => candidate.taskId === taskId);
          setDetail(task.taskId + " " + task.taskName, task.forbiddenOverlap + " " + task.mockNowVsActualLaterAssumptions, task.taskId, task.gapArtifactRefs);
        });
      });

      document.querySelectorAll("[data-seam-button]").forEach((button) => {
        button.addEventListener("click", () => {
          const name = button.getAttribute("data-seam-button");
          const seam = payload.registry.find((candidate) => candidate.interfaceName === name);
          setDetail(seam.interfaceName, seam.temporaryFallbackIfOwnerNotLanded, seam.authoritativeOwnerTask, seam.gapArtifactRef || seam.sourceRefs);
        });
      });

      document.querySelectorAll("[data-merge-gate]").forEach((button) => {
        button.addEventListener("click", () => {
          const gateId = button.getAttribute("data-merge-gate");
          const gate = payload.gate.mergeGates.find((candidate) => candidate.gateId === gateId);
          setDetail(gate.label, gate.requirement, gate.gateId, gate.evidenceRefs);
        });
      });

      document.documentElement.dataset.ready = "true";
    </script>
  </body>
</html>
"""
    html_output = (
        template.replace("__JSON__", json_blob)
        .replace("__INTERFACE_COUNT__", str(len(registry)))
        .replace("__LANE_FILTER__", "".join(lane_filter_buttons))
        .replace("__LANES__", "".join(lanes_html))
        .replace("__SEAMS__", "".join(seam_buttons))
        .replace("__MERGE_GATES__", "".join(merge_buttons))
        .replace("__CONFLICTS__", "".join(conflict_rows))
        .replace("__MOCK_ROWS__", "".join(mock_rows_html))
    )
    write_text(BOARD_PATH, html_output)


def main() -> None:
    rows = task_rows()
    registry = interface_registry()
    gate = build_gate_payload(rows, registry)
    mock_rows = mock_actual_rows()

    write_json(GATE_JSON_PATH, gate)
    write_json(REGISTRY_JSON_PATH, {"taskId": TASK_ID, "schemaVersion": SCHEMA_VERSION, "interfaces": registry})
    for gap in GAP_ARTIFACTS:
        write_json(DATA_ANALYSIS / gap["fileName"], gap)

    write_csv(
        TRACK_MATRIX_PATH,
        [
            "taskNumber",
            "taskId",
            "taskName",
            "domainLane",
            "promptRef",
            "sourceSections",
            "hardPrerequisites",
            "softPrerequisites",
            "sharedInterfacesConsumed",
            "sharedInterfacesProduced",
            "allowedParallelNeighbors",
            "forbiddenOverlap",
            "mergeGateRequirements",
            "mockNowVsActualLaterAssumptions",
            "gapArtifactRefs",
        ],
        [
            {
                **row,
                "sourceSections": list_value(row["sourceSections"]),
                "hardPrerequisites": list_value(row["hardPrerequisites"]),
                "softPrerequisites": list_value(row["softPrerequisites"]),
                "sharedInterfacesConsumed": list_value(row["sharedInterfacesConsumed"]),
                "sharedInterfacesProduced": list_value(row["sharedInterfacesProduced"]),
                "allowedParallelNeighbors": list_value(row["allowedParallelNeighbors"]),
                "gapArtifactRefs": list_value(row["gapArtifactRefs"]),
            }
            for row in rows
        ],
    )
    write_csv(
        MOCK_ACTUAL_PATH,
        ["boundaryId", "surfaceArea", "mockNowAllowed", "actualLaterOwner", "temporaryFallback", "closeCondition", "riskIfBlurred", "artifactRef"],
        mock_rows,
    )
    render_docs(rows, registry, gate)
    render_board(rows, registry, gate, mock_rows)


if __name__ == "__main__":
    main()
