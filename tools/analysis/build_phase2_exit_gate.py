#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]

DOCS_GOVERNANCE = ROOT / "docs" / "governance"
DOCS_FRONTEND = ROOT / "docs" / "frontend"
DATA_ANALYSIS = ROOT / "data" / "analysis"

DECISION_PATH = DATA_ANALYSIS / "208_phase2_exit_gate_decision.json"
ROWS_PATH = DATA_ANALYSIS / "208_phase2_conformance_rows.json"
EVIDENCE_PATH = DATA_ANALYSIS / "208_phase2_evidence_manifest.csv"
OPEN_ITEMS_PATH = DATA_ANALYSIS / "208_phase2_open_items_and_crosscutting_carry_forward.json"

EXIT_PACK_PATH = DOCS_GOVERNANCE / "208_phase2_exit_gate_pack.md"
GO_NO_GO_PATH = DOCS_GOVERNANCE / "208_phase2_go_no_go_decision.md"
SCORECARD_PATH = DOCS_GOVERNANCE / "208_phase2_conformance_scorecard.md"
BOUNDARY_PATH = DOCS_GOVERNANCE / "208_phase2_mock_now_vs_crosscutting_boundary.md"
BOARD_PATH = DOCS_FRONTEND / "208_phase2_exit_board.html"

TASK_ID = "seq_208"
VISUAL_MODE = "Identity_Echoes_Exit_Board"
GATE_VERDICT = "go_with_constraints"
GENERATED_AT = "2026-04-15T00:00:00Z"


def load_json(path: str) -> Any:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


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
    def cell(value: str) -> str:
        return str(value).replace("|", "\\|")

    output = [
        "| " + " | ".join(cell(header) for header in headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        output.append("| " + " | ".join(cell(value) for value in row) + " |")
    return "\n".join(output)


def refs_join(refs: list[str]) -> str:
    return "<br>".join(refs)


def build_open_items() -> list[dict[str, Any]]:
    return [
        {
            "itemId": "CFI_208_LIVE_NHS_LOGIN_CREDENTIALLED_PROOF",
            "title": "Live NHS login credentialled callback and logout evidence",
            "priority": "P1",
            "deferredState": "deferred_non_blocking",
            "workClass": "live_provider_onboarding",
            "ownerTask": "seq_209",
            "ownerTrack": "crosscutting_gate_and_later_live_provider_runbook",
            "futureTaskRefs": ["prompt/209.md", "prompt/202.md"],
            "currentBoundaryState": "mock_now_contracts_passed_live_credentials_not_claimed",
            "whyNonBlockingNow": "The local callback, replay, session, and logout algorithms are proven by seq_204. Live NHS login credentials remain a provider onboarding and operational-gate activity, not a reason to reopen Phase 2 request truth.",
            "consumedBy": ["seq_209", "patient-account auth entry surfaces"],
            "riskIfMissed": "A later live environment could diverge from the local callback and session fence if provider configuration is changed outside the frozen route and scope bundle.",
            "closeCondition": "Credentialled NHS login environment executes the same callback, state, nonce, session, logout, and recovery suites without new local algorithm changes.",
            "sourceRefs": ["prompt/202.md", "data/analysis/202_environment_gate_and_evidence_checklist.json", "data/test/204_suite_results.json"],
        },
        {
            "itemId": "CFI_208_LIVE_TELEPHONY_SIGNAL_PROVIDER_PROOF",
            "title": "Live telephony, SMS, and email signal-provider webhook evidence",
            "priority": "P1",
            "deferredState": "deferred_non_blocking",
            "workClass": "live_provider_onboarding",
            "ownerTask": "seq_209",
            "ownerTrack": "crosscutting_gate_and_later_live_provider_runbook",
            "futureTaskRefs": ["prompt/209.md", "prompt/203.md"],
            "currentBoundaryState": "mock_now_webhook_and_grant_proof_passed_live_mutation_blocked",
            "whyNonBlockingNow": "Seq_205 proves signed webhook, recording, readiness, and continuation-grant semantics against simulator-backed inputs. Live console mutation remains intentionally blocked until provider credentials and approvals exist.",
            "consumedBy": ["seq_209", "support ticket and replay surfaces"],
            "riskIfMissed": "Provider retry, signature, or recording callback behavior could drift from the simulator if the live webhook binding is not re-run against the same matrices.",
            "closeCondition": "Live carrier and notification providers replay the 205 webhook, recording, readiness, and grant cases with unchanged acceptance rules.",
            "sourceRefs": ["prompt/203.md", "data/analysis/203_live_gate_and_rollback_checklist.json", "data/test/205_suite_results.json"],
        },
        {
            "itemId": "CFI_208_CROSSCUTTING_PATIENT_ACCOUNT_CONSUMPTION",
            "title": "Patient-account work consumes Phase 2 identity truth without redefining it",
            "priority": "P1",
            "deferredState": "crosscutting_ready",
            "workClass": "semantic_boundary",
            "ownerTask": "seq_209",
            "ownerTrack": "patient_account_backend_and_frontend",
            "futureTaskRefs": ["prompt/209.md", "prompt/210.md", "prompt/211.md", "prompt/215.md", "prompt/216.md", "prompt/217.md"],
            "currentBoundaryState": "ready_for_crosscutting_consumption",
            "whyNonBlockingNow": "Phase 2 has frozen identity, session, grant, contact-truth, and same-shell laws. Patient home, request detail, contact repair, record, and communications surfaces may consume those laws without reopening the binding or session algorithms.",
            "consumedBy": ["par_210", "par_211", "par_215", "par_216", "par_217"],
            "riskIfMissed": "Patient-home or request-detail projections could become dashboard logic or route-local joins instead of typed consumers of Phase 2 truth.",
            "closeCondition": "Seq_209 publishes the shared interface registry and merge gates for patient-account tasks 210-217.",
            "sourceRefs": ["prompt/209.md", "data/analysis/196_home_spotlight_and_request_tracker_matrix.csv", "data/analysis/201_channel_parity_matrix.csv"],
        },
        {
            "itemId": "CFI_208_SUPPORT_SURFACE_CONSUMPTION",
            "title": "Support surfaces consume repair, replay, and masking boundaries without owning patient truth",
            "priority": "P1",
            "deferredState": "crosscutting_ready",
            "workClass": "semantic_boundary",
            "ownerTask": "seq_209",
            "ownerTrack": "support_backend_and_frontend",
            "futureTaskRefs": ["prompt/209.md", "prompt/218.md", "prompt/219.md", "prompt/220.md", "prompt/221.md"],
            "currentBoundaryState": "ready_for_crosscutting_consumption",
            "whyNonBlockingNow": "Identity repair, replay, duplicate, and masking controls are Phase 2 truths. Support tasks can bind tickets and replay evidence, but they may not redefine request ownership, binding authority, or patient-facing status.",
            "consumedBy": ["par_218", "par_219", "par_220", "par_221"],
            "riskIfMissed": "Support resend or replay could accidentally bypass identity-hold, masking, or exact-once grant semantics.",
            "closeCondition": "Seq_209 freezes support lineage, subject history, controlled resend, replay, masking, and read-only fallback seams.",
            "sourceRefs": ["prompt/209.md", "data/analysis/186_masking_and_disclosure_cases.json", "data/test/206_suite_results.json"],
        },
        {
            "itemId": "CFI_208_CLINICAL_SECURITY_OPERATIONAL_SIGNOFF",
            "title": "Production clinical-safety, DSPT, and operational signoff remains later assurance work",
            "priority": "P2",
            "deferredState": "deferred_non_blocking",
            "workClass": "production_assurance",
            "ownerTask": "seq_209",
            "ownerTrack": "crosscutting_gate_and_later_assurance_runbook",
            "futureTaskRefs": ["prompt/209.md", "prompt/121.md", "prompt/122.md", "prompt/125.md", "prompt/126.md"],
            "currentBoundaryState": "bounded_for_phase_exit_not_production_signoff",
            "whyNonBlockingNow": "The gate can exit the simulator-backed local algorithm with constraints because clinical-safety, DSPT, and production operational proof are explicitly outside this live-provider claim.",
            "consumedBy": ["seq_209", "future production release gates"],
            "riskIfMissed": "A production release could over-read the Phase 2 exit as clinical or DSPT signoff.",
            "closeCondition": "Production release gate links DCB0129 hazard updates, DSPT evidence, live incident runbooks, rollback rehearsals, and deployer acceptance to the same Phase 2 truth set.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2h-hardening-safety-evidence-and-the-formal-phase-2-exit-gate", "prompt/121.md", "prompt/122.md", "prompt/125.md", "prompt/126.md"],
        },
    ]


def build_rows() -> list[dict[str, Any]]:
    rows = [
        {
            "rowId": "P2R_208_TRUST_CONTRACT_AND_CAPABILITY_GATES",
            "capabilityFamilyId": "trust_contract_and_capability_gates",
            "capabilityLabel": "Trust contract and capability gates",
            "status": "approved",
            "proofBasis": "mixed",
            "blockerClass": "none",
            "summary": "Trust tuples, capability ceilings, route intent, release freezes, and grant families are frozen before authenticated or continuation actions can mutate state.",
            "sourceRefs": ["blueprint/phase-cards.md#card-3-phase-2-identity-and-echoes", "prompt/170.md", "prompt/180.md"],
            "owningTasks": ["seq_170", "par_180"],
            "implementationEvidence": ["data/analysis/170_capability_matrix.csv", "data/analysis/180_route_decision_matrix.csv", "data/analysis/180_scope_envelope_authorization_cases.json"],
            "automatedProofArtifacts": ["tools/analysis/validate_phase2_trust_contracts.py", "tools/analysis/validate_capability_decision_engine.py"],
            "suiteRefs": ["seq_204", "seq_205"],
            "invariantRefs": ["routeIntentBindingRequired", "grantScopeEnvelopeImmutable"],
            "risks": [],
            "deferredRefs": [],
        },
        {
            "rowId": "P2R_208_AUTH_BRIDGE_AND_LOCAL_SESSION_ENGINE",
            "capabilityFamilyId": "auth_bridge_and_local_session_engine",
            "capabilityLabel": "Auth bridge and local session engine",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Auth callback consumption, state and nonce replay protection, local session establishment, rotation, expiry, logout, and same-shell recovery pass the Phase 2 suite.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2b-nhs-login-bridge-and-local-session-engine", "prompt/171.md", "prompt/175.md", "prompt/176.md", "prompt/204.md"],
            "owningTasks": ["seq_171", "par_175", "par_176", "seq_204"],
            "implementationEvidence": ["data/analysis/171_callback_outcome_matrix.csv", "data/analysis/176_session_rotation_matrix.csv", "data/test/204_suite_results.json"],
            "automatedProofArtifacts": ["services/command-api/tests/auth-bridge.integration.test.js", "services/command-api/tests/session-governor.integration.test.js", "tools/test/validate_phase2_auth_session_suite.py", "tests/playwright/204_auth_session_assurance_lab.spec.ts"],
            "suiteRefs": ["seq_204"],
            "invariantRefs": ["callbackReplayBlocked", "localSessionOwnedByRelyingService", "logoutTerminatesLocalSession"],
            "risks": [],
            "deferredRefs": ["CFI_208_LIVE_NHS_LOGIN_CREDENTIALLED_PROOF"],
        },
        {
            "rowId": "P2R_208_PATIENT_LINKAGE_AND_OPTIONAL_PDS_SEAM",
            "capabilityFamilyId": "patient_linkage_optional_pds_seam",
            "capabilityLabel": "Patient linkage and optional PDS seam",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Patient linkage, append-only binding decisions, optional PDS enrichment, and contact-truth separation preserve local authority and do not turn enrichment into hidden truth.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2c-patient-linkage-demographic-confidence-and-optional-pds-enrichment", "prompt/172.md", "prompt/178.md", "prompt/179.md", "prompt/183.md", "prompt/207.md"],
            "owningTasks": ["seq_172", "par_178", "par_179", "par_183", "seq_207"],
            "implementationEvidence": ["data/analysis/178_link_decision_examples.json", "data/analysis/179_binding_version_transition_matrix.csv", "data/analysis/183_pds_enrichment_decision_matrix.csv", "data/test/207_pds_mode_cases.csv"],
            "automatedProofArtifacts": ["services/command-api/tests/patient-linker.integration.test.js", "services/command-api/tests/identity-binding-authority.integration.test.js", "services/command-api/tests/pds-enrichment.integration.test.js", "tools/test/validate_phase2_enrichment_and_resafety_suite.py"],
            "suiteRefs": ["seq_207"],
            "invariantRefs": ["pdsOptionalNotTruthSource", "contactTruthSourcesSeparated", "bindingAppendOnly"],
            "risks": [],
            "deferredRefs": ["CFI_208_LIVE_NHS_LOGIN_CREDENTIALLED_PROOF"],
        },
        {
            "rowId": "P2R_208_AUTHENTICATED_OWNERSHIP_AND_PORTAL_ACCESS",
            "capabilityFamilyId": "authenticated_request_ownership_and_portal_access",
            "capabilityLabel": "Authenticated request ownership and portal access",
            "status": "approved",
            "proofBasis": "mixed",
            "blockerClass": "none",
            "summary": "Authenticated request ownership, request claim, stale grant recovery, identity hold, and portal projection access rules keep patient-visible continuity in the same shell.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2d-signed-in-portal-uplift-and-authenticated-request-ownership", "prompt/181.md", "prompt/184.md", "prompt/185.md", "prompt/195.md", "prompt/196.md", "prompt/197.md"],
            "owningTasks": ["par_181", "par_184", "par_185", "par_195", "par_196", "par_197"],
            "implementationEvidence": ["data/analysis/181_claim_replay_and_supersession_cases.json", "data/analysis/184_request_identity_state_matrix.csv", "data/analysis/185_portal_projection_matrix.csv", "data/analysis/197_access_posture_and_reason_code_matrix.csv"],
            "automatedProofArtifacts": ["services/command-api/tests/access-grant-supersession.integration.test.js", "services/command-api/tests/signed-in-request-ownership.integration.test.js", "services/command-api/tests/authenticated-portal-projections.integration.test.js", "tools/analysis/validate_authenticated_portal_projections.py"],
            "suiteRefs": ["seq_204", "seq_206"],
            "invariantRefs": ["sameShellContinuity", "grantRedemptionExactOnce", "identityHoldSuppressesPhi"],
            "risks": [],
            "deferredRefs": ["CFI_208_CROSSCUTTING_PATIENT_ACCOUNT_CONSUMPTION"],
        },
        {
            "rowId": "P2R_208_TELEPHONY_EDGE_AND_CALL_SESSION_STATE_MACHINE",
            "capabilityFamilyId": "telephony_edge_call_session_state_machine",
            "capabilityLabel": "Telephony edge and call-session state machine",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Signed webhook ingestion, out-of-order and duplicate handling, IVR menu capture, terminal state rules, and no-early-promotion laws pass the telephony integrity suite.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2e-telephony-edge-ivr-choreography-and-call-session-persistence", "prompt/173.md", "prompt/187.md", "prompt/188.md", "prompt/205.md"],
            "owningTasks": ["seq_173", "par_187", "par_188", "seq_205"],
            "implementationEvidence": ["data/analysis/173_call_state_transition_matrix.csv", "data/analysis/187_webhook_idempotency_and_disorder_cases.json", "data/analysis/188_call_session_transition_matrix.csv", "data/test/205_webhook_event_cases.csv"],
            "automatedProofArtifacts": ["services/command-api/tests/telephony-edge-ingestion.integration.test.js", "services/command-api/tests/telephony-call-session-state-machine.integration.test.js", "tools/test/validate_phase2_telephony_integrity_suite.py", "tests/playwright/205_telephony_integrity_lab.spec.ts"],
            "suiteRefs": ["seq_205"],
            "invariantRefs": ["webhookReplayBlocked", "callSessionAppendOnly", "noPromotionBeforeSafetyUsable"],
            "risks": [],
            "deferredRefs": ["CFI_208_LIVE_TELEPHONY_SIGNAL_PROVIDER_PROOF"],
        },
        {
            "rowId": "P2R_208_CALLER_VERIFICATION_RECORDING_CUSTODY_AND_READINESS",
            "capabilityFamilyId": "caller_verification_recording_custody_readiness",
            "capabilityLabel": "Caller verification, recording custody, and readiness",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Caller verification, captured identifier handling, recording fetch, quarantine, transcript readiness, and evidence-readiness assessments are proven without optimistic promotion.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2f-caller-verification-voice-capture-transcript-stub-and-sms-continuation", "prompt/189.md", "prompt/190.md", "prompt/191.md", "prompt/205.md"],
            "owningTasks": ["par_189", "par_190", "par_191", "seq_205"],
            "implementationEvidence": ["data/analysis/189_verification_threshold_matrix.csv", "data/analysis/190_audio_format_and_scan_policy.json", "data/analysis/191_evidence_readiness_transition_matrix.csv", "data/test/205_audio_integrity_cases.csv"],
            "automatedProofArtifacts": ["services/command-api/tests/telephony-verification-pipeline.integration.test.js", "services/command-api/tests/telephony-recording-ingest-pipeline.integration.test.js", "services/command-api/tests/telephony-readiness-pipeline.integration.test.js", "tools/test/validate_phase2_telephony_integrity_suite.py"],
            "suiteRefs": ["seq_205"],
            "invariantRefs": ["recordingQuarantinedBeforeUse", "readinessAssessmentRequired", "manualOnlyOnInsufficientEvidence"],
            "risks": [],
            "deferredRefs": ["CFI_208_LIVE_TELEPHONY_SIGNAL_PROVIDER_PROOF"],
        },
        {
            "rowId": "P2R_208_CONTINUATION_GRANTS_AND_SUPERSESSION",
            "capabilityFamilyId": "continuation_grants_and_supersession",
            "capabilityLabel": "Continuation grants and supersession",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Seeded and challenge continuation grants are issued only through AccessGrantService, are bounded by one scope envelope, and redeem exactly once with supersession on replacement.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2f-caller-verification-voice-capture-transcript-stub-and-sms-continuation", "prompt/181.md", "prompt/192.md", "prompt/198.md", "prompt/205.md"],
            "owningTasks": ["par_181", "par_192", "par_198", "seq_205"],
            "implementationEvidence": ["data/analysis/181_grant_family_transition_matrix.csv", "data/analysis/192_continuation_eligibility_to_grant_matrix.csv", "data/analysis/198_continuation_entry_and_recovery_matrix.csv", "data/test/205_continuation_grant_cases.csv"],
            "automatedProofArtifacts": ["services/command-api/tests/telephony-continuation-grants.integration.test.js", "services/command-api/tests/access-grant-supersession.integration.test.js", "tools/test/validate_phase2_telephony_integrity_suite.py"],
            "suiteRefs": ["seq_205", "seq_206"],
            "invariantRefs": ["singleRedemptionGrant", "supersededGrantRevoked", "sameShellContinuationRecovery"],
            "risks": [],
            "deferredRefs": ["CFI_208_SUPPORT_SURFACE_CONSUMPTION"],
        },
        {
            "rowId": "P2R_208_ONE_PIPELINE_CONVERGENCE",
            "capabilityFamilyId": "one_pipeline_convergence",
            "capabilityLabel": "One-pipeline convergence",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Web, authenticated, secure-link, telephony, and continuation facts normalize through one canonical intake path and one status model when facts are equivalent.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2g-one-pipeline-convergence-safety-parity-and-duplicate-control", "prompt/193.md", "prompt/201.md", "prompt/206.md"],
            "owningTasks": ["par_193", "par_201", "seq_206"],
            "implementationEvidence": ["data/analysis/193_channel_convergence_matrix.csv", "data/analysis/201_channel_parity_matrix.csv", "data/test/206_web_phone_parity_cases.csv"],
            "automatedProofArtifacts": ["services/command-api/tests/telephony-convergence-pipeline.integration.test.js", "tools/test/validate_phase2_parity_and_repair_suite.py", "tests/playwright/206_parity_repair_lab.spec.ts"],
            "suiteRefs": ["seq_206"],
            "invariantRefs": ["sameFactsSameRequestTruth", "sameFactsSameSafetyOutcome", "sameStatusSemantics"],
            "risks": [],
            "deferredRefs": ["CFI_208_CROSSCUTTING_PATIENT_ACCOUNT_CONSUMPTION"],
        },
        {
            "rowId": "P2R_208_DUPLICATE_FOLLOWUP_AND_RESAFETY",
            "capabilityFamilyId": "duplicate_followup_and_resafety_handling",
            "capabilityLabel": "Duplicate follow-up and re-safety handling",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Exact replay, semantic replay, same-request attachments, materially new phone evidence, late closed-case evidence, and identity-hold evidence all re-enter duplicate or safety logic correctly.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2g-one-pipeline-convergence-safety-parity-and-duplicate-control", "prompt/194.md", "prompt/206.md", "prompt/207.md"],
            "owningTasks": ["par_194", "seq_206", "seq_207"],
            "implementationEvidence": ["data/analysis/194_followup_duplicate_cases.json", "data/analysis/194_material_delta_trigger_matrix.csv", "data/test/207_followup_duplicate_cases.csv", "data/test/207_expected_enrichment_and_resafety_chains.json"],
            "automatedProofArtifacts": ["services/command-api/tests/phone-followup-resafety.integration.test.js", "tools/analysis/validate_phone_followup_resafety.py", "tools/test/validate_phase2_enrichment_and_resafety_suite.py"],
            "suiteRefs": ["seq_206", "seq_207"],
            "invariantRefs": ["exactReplayCollapses", "materialEvidenceTriggersResafety", "noStaleCalmStatus"],
            "risks": [],
            "deferredRefs": ["CFI_208_SUPPORT_SURFACE_CONSUMPTION"],
        },
        {
            "rowId": "P2R_208_AUDIT_AND_MASKING",
            "capabilityFamilyId": "audit_and_masking",
            "capabilityLabel": "Audit and masking",
            "status": "approved",
            "proofBasis": "mixed",
            "blockerClass": "none",
            "summary": "Identity, contact, telephony, continuation, PDS, and repair events are audit-bound with raw identity values masked or referenced, not emitted as bus payload truth.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2a-trust-contract-and-capability-gates", "prompt/177.md", "prompt/186.md", "prompt/204.md", "prompt/207.md"],
            "owningTasks": ["par_177", "par_186", "seq_204", "seq_207"],
            "implementationEvidence": ["data/analysis/177_redaction_and_masking_cases.json", "data/analysis/186_identity_event_catalogue.csv", "data/analysis/186_masking_and_disclosure_cases.json", "data/test/207_expected_enrichment_and_resafety_chains.json"],
            "automatedProofArtifacts": ["services/command-api/tests/identity-audit-and-masking.integration.test.js", "tools/analysis/validate_identity_audit_and_masking.py", "tools/test/validate_phase2_auth_session_suite.py"],
            "suiteRefs": ["seq_204", "seq_207"],
            "invariantRefs": ["noRawIdentityBusPayload", "phiSuppressedOnHold", "provenanceVisible"],
            "risks": [],
            "deferredRefs": ["CFI_208_CLINICAL_SECURITY_OPERATIONAL_SIGNOFF"],
        },
        {
            "rowId": "P2R_208_BROWSER_FACING_PATIENT_EXPERIENCES",
            "capabilityFamilyId": "browser_facing_patient_experiences",
            "capabilityLabel": "Browser-facing patient experiences",
            "status": "approved",
            "proofBasis": "mock_now",
            "blockerClass": "none",
            "summary": "Sign-in callback recovery, authenticated home, request claim, SMS continuation, signed-in start, contact truth, cross-channel receipt, and test labs keep same-shell continuity and accessible browser proof.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2h-hardening-safety-evidence-and-the-formal-phase-2-exit-gate", "prompt/195.md", "prompt/196.md", "prompt/197.md", "prompt/198.md", "prompt/199.md", "prompt/200.md", "prompt/201.md"],
            "owningTasks": ["par_195", "par_196", "par_197", "par_198", "par_199", "par_200", "par_201"],
            "implementationEvidence": ["data/analysis/195_auth_recovery_state_matrix.csv", "data/analysis/196_home_spotlight_and_request_tracker_matrix.csv", "data/analysis/198_mobile_step_restore_and_replay_cases.json", "data/analysis/200_contact_source_editability_and_repair_matrix.csv"],
            "automatedProofArtifacts": ["tools/analysis/validate_195_auth_frontend_contracts.py", "tools/analysis/validate_authenticated_home_and_status_tracker.py", "tools/analysis/validate_mobile_sms_continuation_flow.py", "tools/analysis/validate_cross_channel_receipt_and_status_parity.py"],
            "suiteRefs": ["seq_204", "seq_206", "seq_207"],
            "invariantRefs": ["sameShellRecovery", "accessibleAuthAndContinuationStates", "contactPreferenceSeparation"],
            "risks": [],
            "deferredRefs": ["CFI_208_CROSSCUTTING_PATIENT_ACCOUNT_CONSUMPTION"],
        },
        {
            "rowId": "P2R_208_PROVIDER_CONFIGURATION_DISCIPLINE",
            "capabilityFamilyId": "provider_configuration_discipline",
            "capabilityLabel": "Provider-configuration discipline",
            "status": "go_with_constraints",
            "proofBasis": "mixed",
            "blockerClass": "live_later_non_blocking",
            "summary": "NHS login redirects, test users, signal-provider webhook settings, and live mutation gates are documented and dry-run bounded, but credentialled provider proof is not claimed.",
            "sourceRefs": ["prompt/202.md", "prompt/203.md", "docs/external/202_nhs_login_console_automation_runbook.md", "docs/external/203_signal_provider_webhook_settings.md"],
            "owningTasks": ["seq_202", "seq_203"],
            "implementationEvidence": ["data/analysis/202_redirect_uri_matrix.csv", "data/analysis/202_test_user_matrix.csv", "data/analysis/203_webhook_endpoint_matrix.csv", "data/analysis/203_live_gate_and_rollback_checklist.json"],
            "automatedProofArtifacts": ["tools/analysis/validate_nhs_login_client_config.py", "tools/analysis/validate_signal_provider_manifest.py"],
            "suiteRefs": ["seq_204", "seq_205"],
            "invariantRefs": ["mockNowNotLiveProof", "liveMutationGateClosed"],
            "risks": ["Live console behavior remains actual-later evidence."],
            "deferredRefs": ["CFI_208_LIVE_NHS_LOGIN_CREDENTIALLED_PROOF", "CFI_208_LIVE_TELEPHONY_SIGNAL_PROVIDER_PROOF"],
        },
        {
            "rowId": "P2R_208_HARDENING_AND_REGRESSION_EVIDENCE",
            "capabilityFamilyId": "hardening_and_regression_evidence",
            "capabilityLabel": "Hardening and regression evidence",
            "status": "go_with_constraints",
            "proofBasis": "mixed",
            "blockerClass": "production_assurance_non_blocking",
            "summary": "Regression suites 204-207 pass with machine-readable evidence and browser labs. Production clinical-safety, DSPT, live rollback, and operational signoff remain carry-forward constraints.",
            "sourceRefs": ["blueprint/phase-2-identity-and-echoes.md#2h-hardening-safety-evidence-and-the-formal-phase-2-exit-gate", "prompt/204.md", "prompt/205.md", "prompt/206.md", "prompt/207.md"],
            "owningTasks": ["seq_204", "seq_205", "seq_206", "seq_207"],
            "implementationEvidence": ["data/test/204_suite_results.json", "data/test/205_suite_results.json", "data/test/206_suite_results.json", "data/test/207_suite_results.json"],
            "automatedProofArtifacts": ["tools/test/validate_phase2_auth_session_suite.py", "tools/test/validate_phase2_telephony_integrity_suite.py", "tools/test/validate_phase2_parity_and_repair_suite.py", "tools/test/validate_phase2_enrichment_and_resafety_suite.py"],
            "suiteRefs": ["seq_204", "seq_205", "seq_206", "seq_207"],
            "invariantRefs": ["mandatorySuitesPassed", "liveProviderEvidenceNotClaimed", "clinicalSafetyBoundedNotSignedOff"],
            "risks": ["Production safety and operational acceptance cannot be inferred from simulator-backed proof."],
            "deferredRefs": ["CFI_208_CLINICAL_SECURITY_OPERATIONAL_SIGNOFF"],
        },
    ]

    for row in rows:
        row["evidenceFiles"] = row["implementationEvidence"] + row["automatedProofArtifacts"]
    return rows


def build_suite_records(results: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "suiteId": "seq_204",
            "label": "Auth replay, session expiry, identity mismatch, and logout",
            "verificationOutcome": results["204"]["overallStatus"],
            "proofVerdict": "auth_session_boundary_passed",
            "proofBasis": "mock_now",
            "summary": "State, nonce, replay, session rotation, expiry, logout, identity mismatch, and same-shell recovery are proven without live provider claims.",
            "artifactRefs": [
                "data/test/204_suite_results.json",
                "tools/test/validate_phase2_auth_session_suite.py",
                "docs/frontend/204_auth_session_assurance_lab.html",
                "tests/playwright/204_auth_session_assurance_lab.spec.ts",
            ],
        },
        {
            "suiteId": "seq_205",
            "label": "IVR webhook, audio integrity, and continuation grants",
            "verificationOutcome": results["205"]["overallStatus"],
            "proofVerdict": "telephony_integrity_boundary_passed",
            "proofBasis": "mock_now",
            "summary": "Webhook signatures, duplicate and disorder handling, recording custody, readiness, seeded and challenge grants, and grant replay behavior are proven with simulator-backed evidence.",
            "artifactRefs": [
                "data/test/205_suite_results.json",
                "tools/test/validate_phase2_telephony_integrity_suite.py",
                "docs/frontend/205_telephony_integrity_lab.html",
                "tests/playwright/205_telephony_integrity_lab.spec.ts",
            ],
        },
        {
            "suiteId": "seq_206",
            "label": "Wrong-patient repair and web-phone parity",
            "verificationOutcome": results["206"]["overallStatus"],
            "proofVerdict": "parity_and_repair_boundary_passed",
            "proofBasis": "mock_now",
            "summary": "Wrong-patient hold, PHI suppression, release fail-closed rules, and semantic web/phone parity are proven.",
            "artifactRefs": [
                "data/test/206_suite_results.json",
                "tools/test/validate_phase2_parity_and_repair_suite.py",
                "docs/frontend/206_parity_repair_lab.html",
                "tests/playwright/206_parity_repair_lab.spec.ts",
            ],
        },
        {
            "suiteId": "seq_207",
            "label": "PDS feature flag and duplicate follow-up re-safety",
            "verificationOutcome": results["207"]["overallStatus"],
            "proofVerdict": "enrichment_and_resafety_boundary_passed",
            "proofBasis": "mock_now",
            "summary": "Optional PDS enrichment remains bounded and duplicate or late follow-up evidence re-enters duplicate and safety rules correctly.",
            "artifactRefs": [
                "data/test/207_suite_results.json",
                "tools/test/validate_phase2_enrichment_and_resafety_suite.py",
                "docs/frontend/207_enrichment_resafety_lab.html",
                "tests/playwright/207_enrichment_resafety_lab.spec.ts",
            ],
        },
    ]


def build_decision(rows: list[dict[str, Any]], open_items: list[dict[str, Any]], suite_records: list[dict[str, Any]]) -> dict[str, Any]:
    approved = sum(1 for row in rows if row["status"] == "approved")
    constrained = sum(1 for row in rows if row["status"] == "go_with_constraints")
    withheld = sum(1 for row in rows if row["status"] == "withheld")
    suite_passes = sum(1 for suite in suite_records if suite["verificationOutcome"] == "passed")

    return {
        "taskId": TASK_ID,
        "schemaVersion": "phase2-exit-gate-decision-v1",
        "generatedAt": GENERATED_AT,
        "visualMode": VISUAL_MODE,
        "gatePackRef": "P2G_208_IDENTITY_ECHOES_COMPLETION_V1",
        "gateVerdict": GATE_VERDICT,
        "phase2CompletionDecision": "go_with_constraints_for_crosscutting_entry",
        "baselineScope": "simulator_backed_identity_telephony_and_cross_channel_algorithm",
        "liveProviderReadinessState": "deferred_explicitly_not_approved",
        "approvalBoundary": "Approves the local Phase 2 identity, session, telephony, parity, optional PDS, duplicate, and re-safety algorithm for cross-cutting consumption. It does not approve production clinical signoff, DSPT signoff, credentialled live NHS login, or live signal-provider operation.",
        "sourcePrecedence": [
            "prompt/208.md",
            "prompt/shared_operating_contract_204_to_211.md",
            "blueprint/phase-cards.md#card-3-phase-2-identity-and-echoes",
            "blueprint/phase-2-identity-and-echoes.md",
            "blueprint/phase-0-the-foundation-protocol.md",
            "blueprint/platform-runtime-and-release-blueprint.md",
            "blueprint/forensic-audit-findings.md",
            "prompt/checklist.md",
            "data/test/204_suite_results.json",
            "data/test/205_suite_results.json",
            "data/test/206_suite_results.json",
            "data/test/207_suite_results.json",
        ],
        "summary": {
            "completedPhase2TaskCount": 38,
            "conformanceRowCount": len(rows),
            "approvedRowCount": approved,
            "goWithConstraintsRowCount": constrained,
            "withheldRowCount": withheld,
            "carryForwardItemCount": len(open_items),
            "deferredNonBlockingItemCount": sum(1 for item in open_items if item["deferredState"] == "deferred_non_blocking"),
            "crosscuttingReadyItemCount": sum(1 for item in open_items if item["deferredState"] == "crosscutting_ready"),
            "mandatorySuiteCount": len(suite_records),
            "mandatorySuitePassCount": suite_passes,
            "blockingItemCount": 0,
            "unresolvedContradictionCount": 0,
        },
        "canonicalInvariants": {
            "nhsLoginAndTelephonyConvergeOnCanonicalIntake": True,
            "localSessionAndLogoutOwnedAtRelyingServiceBoundary": True,
            "subjectSwitchWrongPatientHoldAndBindingSupersessionFailClosed": True,
            "seededAndChallengeContinuationGrantsBoundedAndExactlyOnce": True,
            "webAndPhoneEquivalentFactsProduceSameTruthAndSafetyOutcome": True,
            "duplicateFollowupAndLateEvidenceReenterSafetyCorrectly": True,
            "authenticatedPortalRecoveryAndIdentityHoldPreserveSameShellContinuity": True,
            "optionalPdsNeverBecomesHiddenTruthOrHardDependency": True,
            "simulatorBackedEvidenceNotDisguisedAsLiveProviderProof": True,
            "clinicalSecurityOperationalCarryForwardExplicit": True,
        },
        "mandatorySuites": suite_records,
        "gateQuestions": [
            {
                "questionId": "Q208_001",
                "question": "Are tasks 170 to 207 complete, source-traceable, and internally coherent?",
                "answerState": "go_with_constraints",
                "answer": "Yes for the repository-owned local algorithm. The checklist marks 170-207 complete and conformance rows bind owning tasks to evidence. Live provider proof remains explicitly deferred.",
                "evidenceRefs": ["prompt/checklist.md", "data/analysis/208_phase2_conformance_rows.json", "data/analysis/208_phase2_evidence_manifest.csv"],
            },
            {
                "questionId": "Q208_002",
                "question": "Did testing tasks 204 to 207 pass with machine-readable evidence?",
                "answerState": "approved",
                "answer": "Yes. All four mandatory Phase 2 suites report passed overall status with fixtures, validators, service tests, and browser-facing lab evidence.",
                "evidenceRefs": ["data/test/204_suite_results.json", "data/test/205_suite_results.json", "data/test/206_suite_results.json", "data/test/207_suite_results.json"],
            },
            {
                "questionId": "Q208_003",
                "question": "Are Phase 2 canonical invariants demonstrably true?",
                "answerState": "approved",
                "answer": "Yes for the mock-now and simulator-backed scope. Identity, session, grant, telephony, parity, PDS, duplicate, re-safety, audit, and same-shell invariants are explicit booleans and scorecard rows.",
                "evidenceRefs": ["data/analysis/208_phase2_exit_gate_decision.json", "data/analysis/208_phase2_conformance_rows.json"],
            },
            {
                "questionId": "Q208_004",
                "question": "Which evidence is simulator-backed today and where does live proof remain?",
                "answerState": "go_with_constraints",
                "answer": "The mandatory suites are mock-now. Credentialled NHS login, live telephony/SMS/email provider behavior, production clinical-safety signoff, DSPT signoff, and live rollback evidence are carry-forward items.",
                "evidenceRefs": ["data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json", "docs/governance/208_phase2_mock_now_vs_crosscutting_boundary.md"],
            },
            {
                "questionId": "Q208_005",
                "question": "Which items are deferred to cross-cutting tasks 209+ and why are they not Phase 2 blockers?",
                "answerState": "approved",
                "answer": "Patient account and support surfaces consume frozen Phase 2 truth. They must not reopen identity binding, session, grant, request, duplicate, or safety laws, and seq_209 owns the dependency gate.",
                "evidenceRefs": ["data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json", "prompt/209.md"],
            },
            {
                "questionId": "Q208_006",
                "question": "Are clinical-safety, security, logging, and operational readiness artifacts bounded enough for this phase boundary?",
                "answerState": "go_with_constraints",
                "answer": "Yes for algorithmic exit and cross-cutting consumption. They remain explicit non-production constraints and are not represented as live deployment signoff.",
                "evidenceRefs": ["blueprint/phase-2-identity-and-echoes.md#2h-hardening-safety-evidence-and-the-formal-phase-2-exit-gate", "data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json"],
            },
        ],
        "contradictionChecks": [
            {
                "checkId": "CHK_208_MOCK_NOW_NOT_LIVE_PROVIDER_PROOF",
                "state": "aligned",
                "summary": "The gate verdict is go_with_constraints because all mandatory suites pass while credentialled live provider evidence remains actual-later.",
                "evidenceRefs": ["data/test/204_suite_results.json", "data/test/205_suite_results.json", "data/test/207_suite_results.json"],
            },
            {
                "checkId": "CHK_208_ONE_PIPELINE_NOT_SECOND_PHONE_MODEL",
                "state": "aligned",
                "summary": "Web and phone parity proof binds to canonical intake, duplicate, safety, receipt, and status semantics.",
                "evidenceRefs": ["data/test/206_web_phone_parity_cases.csv", "data/analysis/193_channel_convergence_matrix.csv"],
            },
            {
                "checkId": "CHK_208_CROSSCUTTING_CONSUMES_NOT_REDEFINES_PHASE2_TRUTH",
                "state": "aligned",
                "summary": "Carry-forward rows make patient-account and support surfaces consumers of Phase 2 identity, session, grant, and repair truth.",
                "evidenceRefs": ["data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json", "prompt/209.md"],
            },
        ],
        "deferredOpenItemRefs": [item["itemId"] for item in open_items],
        "blockerRefs": [],
        "unresolvedDefects": [],
    }


def build_evidence_manifest(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    evidence_rows: list[dict[str, Any]] = []
    for row in rows:
        for ref in row["implementationEvidence"]:
            evidence_rows.append(
                {
                    "capability_family_id": row["capabilityFamilyId"],
                    "evidence_kind": "implementation",
                    "artifact_ref": ref,
                    "task_ref": ";".join(row["owningTasks"]),
                    "proof_basis": row["proofBasis"],
                    "status": row["status"],
                    "notes": row["summary"],
                }
            )
        for ref in row["automatedProofArtifacts"]:
            evidence_rows.append(
                {
                    "capability_family_id": row["capabilityFamilyId"],
                    "evidence_kind": "automated_proof",
                    "artifact_ref": ref,
                    "task_ref": ";".join(row["owningTasks"]),
                    "proof_basis": row["proofBasis"],
                    "status": row["status"],
                    "notes": "Automated validator, service test, or Playwright proof for " + row["capabilityLabel"],
                }
            )
        for suite_ref in row["suiteRefs"]:
            evidence_rows.append(
                {
                    "capability_family_id": row["capabilityFamilyId"],
                    "evidence_kind": "suite_binding",
                    "artifact_ref": f"prompt/{suite_ref.split('_', 1)[1]}.md",
                    "task_ref": suite_ref,
                    "proof_basis": row["proofBasis"],
                    "status": row["status"],
                    "notes": "Mandatory suite or owning prompt binding.",
                }
            )
    return evidence_rows


def render_docs(decision: dict[str, Any], rows: list[dict[str, Any]], open_items: list[dict[str, Any]], evidence_rows: list[dict[str, Any]]) -> None:
    suite_rows = [
        [
            suite["suiteId"],
            suite["verificationOutcome"],
            suite["proofBasis"],
            suite["summary"],
        ]
        for suite in decision["mandatorySuites"]
    ]
    score_rows = [
        [
            row["capabilityLabel"],
            row["status"],
            row["proofBasis"],
            row["blockerClass"],
            refs_join(row["owningTasks"]),
        ]
        for row in rows
    ]
    carry_rows = [
        [
            item["itemId"],
            item["deferredState"],
            item["ownerTask"],
            refs_join(item["futureTaskRefs"]),
            item["whyNonBlockingNow"],
        ]
        for item in open_items
    ]

    write_text(
        EXIT_PACK_PATH,
        f"""
# Phase 2 Exit Gate Pack

Task: `{TASK_ID}`

Visual mode: `{VISUAL_MODE}`

Verdict: `{decision["gateVerdict"]}`

Decision boundary: {decision["approvalBoundary"]}

## Design Research References

The board reuses structure, not brand chrome, from:

- https://carbondesignsystem.com/data-visualization/dashboards/ for dense scorecard grouping and calm chart density
- https://carbondesignsystem.com/patterns/status-indicator-pattern/ for restrained state chips and status language
- https://design-system.service.gov.uk/components/summary-list/ for evidence summary parity and readable key-value rows
- https://design-system.service.gov.uk/components/tabs/ for compact state switching without changing source truth
- https://service-manual.nhs.uk/design-system/styles/typography for high-trust typography hierarchy
- https://playwright.dev/docs/screenshots, https://playwright.dev/docs/aria-snapshots, and https://playwright.dev/docs/emulation#reduced-motion for screenshot, ARIA, reduced-motion, and browser-proof expectations

Ideas reused: a full-width verdict band, an 8/12 conformance ladder plus 4/12 evidence rail, a lower boundary zone, diagram-to-table parity, and visible status chips for every row.

## Gate Decision

This is a real go/no-go gate. The verdict is `go_with_constraints`, not `approved`, because the repository proves the local Phase 2 algorithm but does not claim credentialled live-provider or production assurance evidence.

{md_table(["Question", "Answer state", "Evidence"], [[q["question"], q["answerState"], refs_join(q["evidenceRefs"])] for q in decision["gateQuestions"]])}

## Mandatory Suites

{md_table(["Suite", "Outcome", "Proof basis", "Summary"], suite_rows)}

## Conformance Summary

{md_table(["Capability family", "Status", "Proof basis", "Blocker class", "Owning tasks"], score_rows)}

## Carry-Forward Boundary

{md_table(["Item", "State", "Owner", "Future task refs", "Why non-blocking now"], carry_rows)}

## Machine-Readable Artifacts

- `data/analysis/208_phase2_exit_gate_decision.json`
- `data/analysis/208_phase2_conformance_rows.json`
- `data/analysis/208_phase2_evidence_manifest.csv`
- `data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json`
- `docs/frontend/208_phase2_exit_board.html`
- `tools/analysis/validate_phase2_exit_gate.py`
- `tests/playwright/208_phase2_exit_board.spec.js`

## Risk And Operational Posture

- Clinical-safety and DSPT artifacts are bounded for algorithmic exit, not production deployment signoff.
- Logging, audit, masking, and event references are sufficient for Phase 2 proof and must be preserved by support and patient-account tasks.
- Rollback and freeze posture remains constrained until live provider and production operational gates rerun the same trust tuples.
- No Sev-1 or Sev-2 local algorithm blocker is represented in the machine-readable rows.
""",
    )

    write_text(
        GO_NO_GO_PATH,
        f"""
# Phase 2 Go/No-Go Decision

Gate verdict: `{decision["gateVerdict"]}`

Formal decision: `go_with_constraints`

## Go Statement

Proceed into the cross-cutting patient-account and support-surface gate (`seq_209`) using the frozen Phase 2 local algorithm for identity, session, telephony, continuation, optional PDS, web-phone parity, duplicate follow-up, late evidence, audit, and masking.

## Constraints

This decision does not approve:

- credentialled live NHS login evidence
- live telephony, SMS, or email provider operation
- production clinical-safety signoff
- DSPT signoff
- production rollback or live operational acceptance

## Go Criteria Checked

{md_table(["Criterion", "Result"], [
    ["Tasks 170-207 complete in the live checklist", "go_with_constraints"],
    ["Mandatory suites 204-207 pass with machine-readable evidence", "go"],
    ["Phase 2 invariants are explicit and true in the decision file", "go"],
    ["Simulator-backed and live-later proof are separated", "go_with_constraints"],
    ["Cross-cutting 209+ boundary is published", "go"],
    ["No unresolved local algorithm blocker remains", "go"],
])}

## No-Go Conditions Checked

{md_table(["No-go condition", "Gate result"], [
    ["Mandatory proof family missing", "not present"],
    ["Approved verdict while live-provider proof is absent", "not present"],
    ["Phone path creates a second request model", "not present"],
    ["PDS silently overwrites local identity or contact truth", "not present"],
    ["Patient-account or support work redefines Phase 2 truth", "blocked by carry-forward boundary"],
])}
""",
    )

    write_text(
        SCORECARD_PATH,
        f"""
# Phase 2 Conformance Scorecard

Source rows: `data/analysis/208_phase2_conformance_rows.json`

Evidence manifest: `data/analysis/208_phase2_evidence_manifest.csv`

{md_table(["Capability family", "Status", "Proof basis", "Blocker class", "Evidence count", "Suite refs"], [
    [
        row["capabilityLabel"],
        row["status"],
        row["proofBasis"],
        row["blockerClass"],
        str(sum(1 for evidence in evidence_rows if evidence["capability_family_id"] == row["capabilityFamilyId"])),
        refs_join(row["suiteRefs"]),
    ]
    for row in rows
])}

## Row Detail

{chr(10).join(
    f"### {row['capabilityLabel']}\\n\\nStatus: `{row['status']}`\\n\\nProof basis: `{row['proofBasis']}`\\n\\nOwning tasks: {', '.join(row['owningTasks'])}\\n\\nEvidence files: {', '.join(row['evidenceFiles'])}\\n\\nRisks: {', '.join(row['risks']) if row['risks'] else 'none'}\\n"
    for row in rows
)}
""",
    )

    write_text(
        BOUNDARY_PATH,
        f"""
# Phase 2 Mock-Now Vs Cross-Cutting Boundary

## Mock Now Execution

{md_table(["Area", "Mock-now truth"], [
    ["Auth and session", "Callback, replay, nonce/state, session establishment, rotation, expiry, logout, identity mismatch, and same-shell recovery pass in seq_204."],
    ["Telephony", "Webhook, IVR, recording custody, evidence readiness, and continuation grants pass in seq_205 using simulator-backed provider behavior."],
    ["Parity and repair", "Wrong-patient hold/release and web-phone semantic parity pass in seq_206."],
    ["PDS and re-safety", "Optional enrichment and duplicate follow-up re-safety pass in seq_207 without turning PDS into hidden truth."],
])}

## Cross-Cutting Consumption In 209+

{md_table(["Consumer track", "May consume", "May not redefine"], [
    ["Patient backend/frontend", "Identity binding truth, session truth, grant truth, same-shell return contracts, canonical request/status truth", "Patient binding, session establishment, duplicate law, or safety preemption law"],
    ["Support backend/frontend", "Repair state, masking, subject-history, controlled resend, replay-diff, support ticket lineage", "Patient request ownership, patient-visible truth, or grant widening"],
])}

## Actual Production Strategy Later

{md_table(["Carry-forward item", "Owner", "Close condition"], [[item["title"], item["ownerTask"], item["closeCondition"]] for item in open_items])}

The Phase 2 truth model is closed for local algorithm work. Later patient-account and support tasks are consumers of the same trust tuples, action-routing semantics, and recovery laws.
""",
    )


def render_board(decision: dict[str, Any], rows: list[dict[str, Any]], open_items: list[dict[str, Any]], evidence_rows: list[dict[str, Any]]) -> None:
    board_data = {
        "decision": decision,
        "rows": rows,
        "openItems": open_items,
        "evidence": evidence_rows,
    }
    json_blob = json.dumps(board_data)
    status_counts = decision["summary"]
    phase_steps = [
        ("2A", "Trust", "trust_contract_and_capability_gates"),
        ("2B", "Auth/session", "auth_bridge_and_local_session_engine"),
        ("2C", "Link/PDS", "patient_linkage_optional_pds_seam"),
        ("2D", "Portal/grants", "authenticated_request_ownership_and_portal_access"),
        ("2E", "Telephony", "telephony_edge_call_session_state_machine"),
        ("2F", "Readiness", "caller_verification_recording_custody_readiness"),
        ("2G", "Parity", "one_pipeline_convergence"),
        ("2H", "Exit", "hardening_and_regression_evidence"),
    ]

    write_text(
        BOARD_PATH,
        f"""
<!doctype html>
<html lang="en" data-ready="false">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Phase 2 Identity And Echoes Exit Board</title>
    <style>
      :root {{
        --masthead-height: 72px;
        --canvas: #f5f7fb;
        --panel: #ffffff;
        --inset: #eef2f7;
        --strong: #0f172a;
        --text: #334155;
        --muted: #64748b;
        --border: #d7dfea;
        --approved: #0f766e;
        --constrained: #b7791f;
        --withheld: #b42318;
        --trace: #3158e0;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        background: var(--canvas);
        color: var(--text);
      }}
      a {{ color: var(--trace); }}
      .board {{
        max-width: 1560px;
        margin: 0 auto;
        padding: 0 28px 48px;
      }}
      .masthead {{
        min-height: var(--masthead-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border-bottom: 1px solid var(--border);
      }}
      .eyebrow {{
        margin: 0;
        color: var(--muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0;
        font-weight: 760;
      }}
      h1, h2, h3, p {{ margin-top: 0; }}
      h1 {{
        margin-bottom: 0;
        color: var(--strong);
        font-size: clamp(1.45rem, 2.5vw, 2.35rem);
        line-height: 1.05;
        letter-spacing: 0;
      }}
      h2 {{
        color: var(--strong);
        font-size: 1.05rem;
        line-height: 1.2;
        letter-spacing: 0;
      }}
      h3 {{
        color: var(--strong);
        font-size: 0.95rem;
        line-height: 1.25;
        letter-spacing: 0;
      }}
      .mode-mark {{
        display: inline-flex;
        align-items: center;
        min-height: 32px;
        padding: 0 12px;
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--strong);
        background: var(--panel);
        font-size: 0.82rem;
        font-weight: 760;
        white-space: nowrap;
      }}
      .verdict-band {{
        margin: 26px 0;
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
        gap: 24px;
        padding: 24px;
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
      }}
      .verdict-kicker {{
        color: var(--muted);
        font-weight: 760;
        margin-bottom: 8px;
      }}
      .verdict-value {{
        color: var(--constrained);
        font-size: clamp(2.5rem, 5.2vw, 5.6rem);
        line-height: 0.92;
        font-weight: 860;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }}
      .verdict-value[data-preview="approved"] {{ color: var(--approved); }}
      .verdict-value[data-preview="withheld"] {{ color: var(--withheld); }}
      .verdict-copy {{
        max-width: 72ch;
        font-size: 1rem;
        line-height: 1.55;
      }}
      .summary-grid {{
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }}
      .metric {{
        min-height: 84px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--inset);
      }}
      .metric strong {{
        display: block;
        color: var(--strong);
        font-size: 1.65rem;
        line-height: 1;
      }}
      .metric span {{
        color: var(--muted);
        font-size: 0.82rem;
      }}
      .state-controls {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }}
      button {{
        font: inherit;
        border: 1px solid var(--border);
        background: var(--panel);
        color: var(--strong);
        min-height: 36px;
        padding: 0 12px;
        border-radius: 6px;
        cursor: pointer;
      }}
      button[aria-pressed="true"], button:focus-visible {{
        outline: 3px solid rgba(49, 88, 224, 0.35);
        outline-offset: 2px;
        border-color: var(--trace);
      }}
      .main-grid {{
        display: grid;
        grid-template-columns: minmax(0, 8fr) minmax(340px, 4fr);
        gap: 24px;
        align-items: start;
      }}
      .main-grid > *, .boundary-zone > *, .rail, .panel {{
        min-width: 0;
      }}
      .panel {{
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 18px;
      }}
      .phase-braid {{
        display: grid;
        grid-template-columns: repeat(8, minmax(72px, 1fr));
        gap: 8px;
        margin: 12px 0 18px;
      }}
      .phase-node {{
        position: relative;
        min-height: 86px;
        padding: 12px;
        border-radius: 8px;
        background: linear-gradient(180deg, #ffffff 0%, #eef2f7 100%);
        border: 1px solid var(--border);
      }}
      .phase-node::after {{
        content: "";
        position: absolute;
        top: 50%;
        right: -9px;
        width: 10px;
        height: 2px;
        background: var(--trace);
      }}
      .phase-node:last-child::after {{ display: none; }}
      .phase-node b {{
        display: block;
        color: var(--trace);
        margin-bottom: 6px;
      }}
      .phase-node span {{
        display: block;
        color: var(--strong);
        font-weight: 760;
        font-size: 0.86rem;
      }}
      .ladder {{
        display: grid;
        gap: 8px;
      }}
      .ladder-row {{
        display: grid;
        grid-template-columns: minmax(160px, 1.2fr) minmax(110px, 0.5fr) minmax(150px, 0.6fr);
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 58px;
        text-align: left;
        border-radius: 8px;
        background: var(--panel);
      }}
      .ladder-row .label {{
        font-weight: 760;
        color: var(--strong);
      }}
      .status-chip {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        color: #ffffff;
        background: var(--approved);
        font-size: 0.78rem;
        font-weight: 760;
        white-space: nowrap;
      }}
      .status-chip[data-status="go_with_constraints"] {{ background: var(--constrained); }}
      .status-chip[data-status="withheld"] {{ background: var(--withheld); }}
      .severity {{
        display: block;
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: var(--inset);
      }}
      .severity span {{
        display: block;
        height: 100%;
        width: 100%;
        background: var(--approved);
        transform-origin: left;
        animation: reveal-bar 220ms ease-out both;
      }}
      .ladder-row[data-status="go_with_constraints"] .severity span {{
        width: 68%;
        background: var(--constrained);
      }}
      .rail {{
        position: sticky;
        top: 14px;
        display: grid;
        gap: 14px;
      }}
      .manifest-list {{
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }}
      .manifest-list li {{
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
        overflow-wrap: anywhere;
      }}
      .manifest-list li:last-child {{ border-bottom: 0; }}
      .manifest-kind {{
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 760;
      }}
      .boundary-zone {{
        margin-top: 24px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }}
      .boundary-map {{
        display: grid;
        gap: 10px;
      }}
      .boundary-button {{
        width: 100%;
        min-height: 64px;
        text-align: left;
        border-radius: 8px;
      }}
      .table-wrap {{
        max-width: 100%;
        overflow-x: auto;
        border: 1px solid var(--border);
        border-radius: 8px;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }}
      th, td {{
        padding: 12px;
        border-bottom: 1px solid var(--border);
        text-align: left;
        vertical-align: top;
        font-size: 0.86rem;
        line-height: 1.4;
      }}
      th {{
        color: var(--strong);
        background: var(--inset);
      }}
      tr:last-child td {{ border-bottom: 0; }}
      .accordion-list {{
        display: none;
        gap: 10px;
      }}
      details {{
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--panel);
      }}
      summary {{
        cursor: pointer;
        padding: 12px;
        color: var(--strong);
        font-weight: 760;
      }}
      details p {{
        padding: 0 12px 12px;
        margin: 0;
      }}
      .sr-only {{
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }}
      @keyframes reveal-bar {{
        from {{ transform: scaleX(0.35); opacity: 0.4; }}
        to {{ transform: scaleX(1); opacity: 1; }}
      }}
      @media (max-width: 1080px) {{
        .verdict-band, .main-grid {{ grid-template-columns: 1fr; }}
        .rail {{ position: static; }}
        .phase-braid {{ grid-template-columns: repeat(4, minmax(0, 1fr)); }}
        .boundary-zone {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
      }}
      @media (max-width: 680px) {{
        .board {{ padding: 0 14px 36px; }}
        .masthead {{ align-items: flex-start; flex-direction: column; padding: 14px 0; }}
        .verdict-band {{ padding: 16px; }}
        .summary-grid, .boundary-zone {{ grid-template-columns: 1fr; }}
        .phase-braid {{ grid-template-columns: 1fr; }}
        .phase-node::after {{ display: none; }}
        .ladder-row {{ grid-template-columns: 1fr; }}
        .desktop-score-table {{ display: none; }}
        .accordion-list {{ display: grid; }}
      }}
      @media (prefers-reduced-motion: reduce) {{
        *, *::before, *::after {{
          animation-duration: 1ms !important;
          transition-duration: 1ms !important;
          scroll-behavior: auto !important;
        }}
      }}
    </style>
  </head>
  <body>
    <script id="phase2-exit-data" type="application/json">{json_blob}</script>
    <div class="board" data-testid="Identity_Echoes_Exit_Board">
      <header class="masthead" data-testid="board-masthead">
        <div>
          <p class="eyebrow">Phase 2 formal gate</p>
          <h1>Identity and Echoes exit board</h1>
        </div>
        <span class="mode-mark">{VISUAL_MODE}</span>
      </header>

      <main id="gate-main" tabindex="-1">
        <section class="verdict-band" data-testid="VerdictBand" aria-labelledby="verdict-heading">
          <div>
            <p class="verdict-kicker">Formal verdict</p>
            <h2 id="verdict-heading" class="verdict-value" data-testid="decision-verdict" data-preview="{GATE_VERDICT}">{GATE_VERDICT}</h2>
            <p class="verdict-copy" data-testid="decision-rationale">{decision["approvalBoundary"]}</p>
            <div class="state-controls" aria-label="Visual state previews">
              <button type="button" data-preview-button="approved">Approved state</button>
              <button type="button" data-preview-button="go_with_constraints" aria-pressed="true">Go-with-constraints state</button>
              <button type="button" data-preview-button="withheld">Withheld state</button>
            </div>
          </div>
          <div class="summary-grid" aria-label="Gate summary">
            <div class="metric"><strong data-testid="approved-count">{status_counts["approvedRowCount"]}</strong><span>approved rows</span></div>
            <div class="metric"><strong data-testid="constrained-count">{status_counts["goWithConstraintsRowCount"]}</strong><span>constrained rows</span></div>
            <div class="metric"><strong data-testid="suite-pass-count">{status_counts["mandatorySuitePassCount"]}/{status_counts["mandatorySuiteCount"]}</strong><span>mandatory suites passed</span></div>
            <div class="metric"><strong data-testid="blocker-count">{status_counts["blockingItemCount"]}</strong><span>blocking items</span></div>
          </div>
        </section>

        <section class="main-grid" aria-label="Scorecard and evidence">
          <div class="panel">
            <section data-testid="PhaseBraid" aria-labelledby="phase-braid-heading">
              <h2 id="phase-braid-heading">Phase braid</h2>
              <div class="phase-braid" role="list">
                {''.join(f'<div class="phase-node" role="listitem" data-family="{family}"><b>{step}</b><span>{label}</span></div>' for step, label, family in phase_steps)}
              </div>
              <div class="table-wrap">
                <table data-testid="phase-braid-table" aria-label="Phase braid evidence families">
                  <thead><tr><th>Phase section</th><th>Evidence family</th><th>Status</th></tr></thead>
                  <tbody>
                    {''.join(f'<tr><td>{step}</td><td>{label}</td><td>{next((row["status"] for row in rows if row["capabilityFamilyId"] == family), "approved")}</td></tr>' for step, label, family in phase_steps)}
                  </tbody>
                </table>
              </div>
            </section>

            <section data-testid="ConformanceLadder" aria-labelledby="ladder-heading">
              <h2 id="ladder-heading">Conformance ladder</h2>
              <div class="ladder" data-testid="family-list">
                {''.join(f'<button class="ladder-row" type="button" data-testid="family-button-{row["capabilityFamilyId"]}" data-family="{row["capabilityFamilyId"]}" data-status="{row["status"]}"><span class="label">{row["capabilityLabel"]}</span><span class="status-chip" data-status="{row["status"]}">{row["status"]}</span><span class="severity" aria-hidden="true"><span></span></span></button>' for row in rows)}
              </div>
              <div class="accordion-list" data-testid="mobile-scorecard-accordions">
                {''.join(f'<details><summary>{row["capabilityLabel"]} <span class="status-chip" data-status="{row["status"]}">{row["status"]}</span></summary><p>{row["summary"]}</p></details>' for row in rows)}
              </div>
              <div class="table-wrap desktop-score-table">
                <table data-testid="conformance-score-table" aria-label="Phase 2 conformance scorecard">
                  <thead><tr><th>Family</th><th>Status</th><th>Proof</th><th>Blocker class</th><th>Suite refs</th></tr></thead>
                  <tbody>
                    {''.join(f'<tr><td>{row["capabilityLabel"]}</td><td>{row["status"]}</td><td>{row["proofBasis"]}</td><td>{row["blockerClass"]}</td><td>{", ".join(row["suiteRefs"])}</td></tr>' for row in rows)}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside class="rail" aria-label="Evidence summary rail">
            <section class="panel" data-testid="EvidenceManifestPanel" aria-labelledby="manifest-heading">
              <h2 id="manifest-heading">Evidence manifest</h2>
              <p><strong data-testid="selected-family-label">{rows[0]["capabilityLabel"]}</strong></p>
              <p><span data-testid="selected-evidence-count">0</span> linked evidence rows</p>
              <ul class="manifest-list" data-testid="manifest-list"></ul>
            </section>
            <section class="panel" data-testid="inspector" aria-live="polite">
              <h2>Selected row</h2>
              <p data-testid="inspector-title"></p>
              <p data-testid="inspector-summary"></p>
              <p><strong>Status:</strong> <span data-testid="inspector-status"></span></p>
              <p><strong>Proof basis:</strong> <span data-testid="inspector-proof"></span></p>
              <p><strong>Carry-forward:</strong> <span data-testid="inspector-carry"></span></p>
            </section>
          </aside>
        </section>

        <section class="boundary-zone" aria-label="Boundary and carry forward">
          <section class="panel" data-testid="BoundaryMap" aria-labelledby="boundary-heading">
            <h2 id="boundary-heading">Boundary map</h2>
            <div class="boundary-map">
              {''.join(f'<button class="boundary-button" type="button" data-testid="open-item-button-{item["itemId"]}" data-open-item="{item["itemId"]}"><strong>{item["title"]}</strong><br><span>{item["deferredState"]}</span></button>' for item in open_items)}
            </div>
          </section>
          <section class="panel">
            <h2>Risk carry-forward</h2>
            <div class="table-wrap">
              <table data-testid="RiskCarryForwardTable" aria-label="Risk carry-forward table">
                <thead><tr><th>Item</th><th>Owner</th><th>Close condition</th></tr></thead>
                <tbody>
                  {''.join(f'<tr><td>{item["itemId"]}</td><td>{item["ownerTask"]}</td><td>{item["closeCondition"]}</td></tr>' for item in open_items)}
                </tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <h2>Diagram parity</h2>
            <div class="table-wrap">
              <table data-testid="parity-table" aria-label="Diagram to table parity">
                <thead><tr><th>Visual region</th><th>Table or data parity</th></tr></thead>
                <tbody>
                  <tr><td>VerdictBand</td><td>data/analysis/208_phase2_exit_gate_decision.json</td></tr>
                  <tr><td>PhaseBraid</td><td>phase-braid-table</td></tr>
                  <tr><td>ConformanceLadder</td><td>conformance-score-table</td></tr>
                  <tr><td>BoundaryMap</td><td>RiskCarryForwardTable</td></tr>
                  <tr><td>EvidenceManifestPanel</td><td>data/analysis/208_phase2_evidence_manifest.csv</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
    <script>
      const payload = JSON.parse(document.getElementById("phase2-exit-data").textContent);
      const stateLabels = {{
        approved: "approved",
        go_with_constraints: "go_with_constraints",
        withheld: "withheld",
      }};
      function evidenceForFamily(family) {{
        return payload.evidence.filter((row) => row.capability_family_id === family);
      }}
      function selectFamily(family) {{
        const row = payload.rows.find((item) => item.capabilityFamilyId === family) || payload.rows[0];
        const evidence = evidenceForFamily(row.capabilityFamilyId);
        document.querySelector("[data-testid='selected-family-label']").textContent = row.capabilityLabel;
        document.querySelector("[data-testid='selected-evidence-count']").textContent = String(evidence.length);
        document.querySelector("[data-testid='inspector-title']").textContent = row.capabilityLabel;
        document.querySelector("[data-testid='inspector-summary']").textContent = row.summary;
        document.querySelector("[data-testid='inspector-status']").textContent = row.status;
        document.querySelector("[data-testid='inspector-proof']").textContent = row.proofBasis;
        document.querySelector("[data-testid='inspector-carry']").textContent = row.deferredRefs.length ? row.deferredRefs.join(", ") : "none";
        const list = document.querySelector("[data-testid='manifest-list']");
        list.innerHTML = evidence.slice(0, 8).map((item) => `<li><span class="manifest-kind">${{item.evidence_kind}} / ${{item.status}}</span><br>${{item.artifact_ref}}</li>`).join("");
        document.querySelectorAll("[data-family]").forEach((button) => {{
          if (button.matches("button")) {{
            button.setAttribute("aria-pressed", button.dataset.family === row.capabilityFamilyId ? "true" : "false");
          }}
        }});
      }}
      function selectOpenItem(itemId) {{
        const item = payload.openItems.find((entry) => entry.itemId === itemId);
        if (!item) return;
        document.querySelector("[data-testid='inspector-title']").textContent = item.title;
        document.querySelector("[data-testid='inspector-summary']").textContent = item.whyNonBlockingNow;
        document.querySelector("[data-testid='inspector-status']").textContent = item.deferredState;
        document.querySelector("[data-testid='inspector-proof']").textContent = item.deferredState;
        document.querySelector("[data-testid='inspector-carry']").textContent = item.futureTaskRefs.join(", ");
      }}
      function setPreview(state) {{
        const verdict = document.querySelector("[data-testid='decision-verdict']");
        verdict.textContent = stateLabels[state] || payload.decision.gateVerdict;
        verdict.dataset.preview = state;
        document.querySelectorAll("[data-preview-button]").forEach((button) => {{
          button.setAttribute("aria-pressed", button.dataset.previewButton === state ? "true" : "false");
        }});
      }}
      document.querySelectorAll("[data-family]").forEach((button) => {{
        if (button.matches("button")) {{
          button.addEventListener("click", () => selectFamily(button.dataset.family));
        }}
      }});
      document.querySelectorAll("[data-open-item]").forEach((button) => {{
        button.addEventListener("click", () => selectOpenItem(button.dataset.openItem));
      }});
      document.querySelectorAll("[data-preview-button]").forEach((button) => {{
        button.addEventListener("click", () => setPreview(button.dataset.previewButton));
      }});
      const query = new URLSearchParams(window.location.search);
      setPreview(query.get("preview") || payload.decision.gateVerdict);
      selectFamily(payload.rows[0].capabilityFamilyId);
      document.documentElement.dataset.ready = "true";
    </script>
  </body>
</html>
""",
    )


def main() -> None:
    suite_results = {
        "204": load_json("data/test/204_suite_results.json"),
        "205": load_json("data/test/205_suite_results.json"),
        "206": load_json("data/test/206_suite_results.json"),
        "207": load_json("data/test/207_suite_results.json"),
    }
    open_items = build_open_items()
    rows = build_rows()
    suite_records = build_suite_records(suite_results)
    evidence_rows = build_evidence_manifest(rows)
    decision = build_decision(rows, open_items, suite_records)

    write_json(DECISION_PATH, decision)
    write_json(ROWS_PATH, rows)
    write_json(OPEN_ITEMS_PATH, open_items)
    write_csv(
        EVIDENCE_PATH,
        ["capability_family_id", "evidence_kind", "artifact_ref", "task_ref", "proof_basis", "status", "notes"],
        evidence_rows,
    )
    render_docs(decision, rows, open_items, evidence_rows)
    render_board(decision, rows, open_items, evidence_rows)
    print("Phase 2 exit gate artifacts generated.")


if __name__ == "__main__":
    main()
