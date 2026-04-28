#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TODAY = date.today().isoformat()
VISUAL_MODE = "Human_Checkpoint_Exit_Board"
TASK_ID = "seq_277"


def repo_path(relative: str) -> str:
    return str(ROOT / relative)


def read_json(relative: str) -> dict:
    return json.loads((ROOT / relative).read_text())


def write_text(relative: str, content: str) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(relative: str, payload: object) -> None:
    write_text(relative, json.dumps(payload, indent=2))


def write_csv(relative: str, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def md_escape(value: str) -> str:
    return value.replace("|", "\\|")


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    rule_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = [
        "| " + " | ".join(md_escape(cell) for cell in row) + " |"
        for row in rows
    ]
    return "\n".join([header_row, rule_row, *body])


SUITE_FILES = {
    "seq_272": "data/test/272_suite_results.json",
    "seq_273": "data/test/273_suite_results.json",
    "seq_274": "data/test/274_suite_results.json",
    "seq_275": "data/test/275_suite_results.json",
    "seq_276": "data/test/276_suite_results.json",
}

SUITE_RESULTS = {task_id: read_json(path) for task_id, path in SUITE_FILES.items()}


CONSTRAINTS = [
    {
        "constraintId": "C277_001",
        "summary": "Callback telephony, clinician messaging, reminder delivery, and admin notification transports remain simulator-backed provider seams.",
        "scope": "live_provider_and_delivery_rollout",
        "phase3Blocker": False,
        "phase4Blocker": False,
        "ownerTask": "future_live_provider_activation",
        "nextAction": "Replace simulator adapter profiles with live provider bindings without changing the canonical Phase 3 object models or settlement grammar.",
        "evidenceRefs": [
            repo_path("data/analysis/243_gap_log.json"),
            repo_path("data/analysis/244_gap_log.json"),
            repo_path("data/analysis/245_gap_log.json"),
            repo_path("data/analysis/236_gap_log.json"),
            repo_path("data/analysis/254_gap_log.json"),
        ],
    },
    {
        "constraintId": "C277_002",
        "summary": "Several patient and staff browser surfaces still consume seeded Phase 3 projection helpers instead of live command-api fetches.",
        "scope": "runtime_read_path_fidelity",
        "phase3Blocker": False,
        "phase4Blocker": False,
        "ownerTask": "future_phase3_live_projection_fetch_hardening",
        "nextAction": "Swap seeded merge-bundle readers for live command-api queries while preserving the published 255 to 271 shell and parity contracts.",
        "evidenceRefs": [
            repo_path("data/analysis/271_phase3_integration_gap_log.json"),
            repo_path("data/analysis/270_phase3_queue_callback_admin_gap_log.json"),
        ],
    },
    {
        "constraintId": "C277_003",
        "summary": "Release-watch, channel-freeze, content-authoring, and some continuity-control feeds are still governed by seeded refs or simulator-backed inputs rather than live operational control planes.",
        "scope": "production_operational_readiness",
        "phase3Blocker": False,
        "phase4Blocker": False,
        "ownerTask": "future_phase9_control_plane_activation",
        "nextAction": "Bind the existing publication, trust, release-watch, and content refs to live control-plane feeds before production go-live claims are made.",
        "evidenceRefs": [
            repo_path("data/analysis/250_gap_log.json"),
            repo_path("data/analysis/253_gap_log.json"),
            repo_path("data/analysis/242_gap_log.json"),
        ],
    },
]


ROWS = [
    {
        "rowId": "PH3_ROW_01",
        "capabilityFamily": "Triage contract and workspace state model",
        "phaseBraidRefs": ["3A"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/phase-cards.md')}#Card 4: Phase 3 - The Human Checkpoint",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3A. Triage contract and workspace state model",
            f"{repo_path('blueprint/staff-workspace-interface-architecture.md')}#Route family",
        ],
        "owningTasks": ["seq_226", "seq_230", "par_231", "par_232", "par_255", "par_257", "par_258", "par_262"],
        "summary": "The canonical triage object model, lease fencing, workspace trust envelope, and same-shell task route family are implemented and validated.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("docs/architecture/226_phase3_triage_contract_and_workspace_state_model.md"),
            repo_path("packages/domains/triage_workspace/src/phase3-triage-kernel.ts"),
            repo_path("services/command-api/src/phase3-triage-kernel.ts"),
            repo_path("apps/clinical-workspace/src/workspace-active-task-shell.tsx"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_phase3_triage_workspace_contracts.py"),
            repo_path("tools/analysis/validate_231_triage_kernel.py"),
            repo_path("tools/analysis/validate_232_workspace_projection_stack.py"),
            repo_path("tools/analysis/validate_255_workspace_shell_contracts.py"),
            repo_path("tools/analysis/validate_257_active_task_shell_contracts.py"),
        ],
    },
    {
        "rowId": "PH3_ROW_02",
        "capabilityFamily": "Deterministic queue, fairness, duplicate, and ownership law",
        "phaseBraidRefs": ["3B"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/phase-cards.md')}#Card 4: Phase 3 - The Human Checkpoint",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3B. Deterministic queue engine, assignment, and fairness controls",
            f"{repo_path('blueprint/phase-0-the-foundation-protocol.md')}#8A. Consequence-bearing review actions must bind one current DecisionEpoch",
        ],
        "owningTasks": ["seq_227", "par_233", "par_234", "par_241", "par_242", "par_256", "par_261", "par_262", "seq_270", "seq_272"],
        "summary": "Queue ranking, fairness honesty, duplicate review authority, stale-owner recovery, and queue-to-task continuity are deterministic and replayable against committed fact cuts.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("docs/architecture/227_phase3_queue_ranking_fairness_duplicate_and_more_info_contracts.md"),
            repo_path("services/command-api/src/queue-ranking.ts"),
            repo_path("packages/domains/identity_access/src/duplicate-review-backbone.ts"),
            repo_path("apps/clinical-workspace/src/workspace-queue-workboard.tsx"),
            repo_path("services/command-api/src/phase3-queue-callback-admin-merge.ts"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_233_queue_engine.py"),
            repo_path("tools/analysis/validate_234_duplicate_authority.py"),
            repo_path("tools/analysis/validate_241_reopen_and_launch_leases.py"),
            repo_path("data/test/272_suite_results.json"),
            repo_path("services/command-api/tests/272_phase3_queue_governance_assurance.integration.test.js"),
        ],
    },
    {
        "rowId": "PH3_ROW_03",
        "capabilityFamily": "Review bundle, more-info loop, and canonical re-safety",
        "phaseBraidRefs": ["3C", "3D"],
        "status": "go_with_constraints",
        "proofMode": "mixed",
        "sourceSections": [
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3C. Review bundle and suggestion seam",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3D. More-info loop, patient response threading, and re-safety",
            f"{repo_path('blueprint/phase-0-the-foundation-protocol.md')}#Any route family whose rendered DOM markers",
        ],
        "owningTasks": ["par_235", "par_236", "par_237", "par_246", "par_247", "par_258", "par_266", "seq_271", "seq_273"],
        "summary": "The review bundle, reply-window checkpoint, response disposition, and re-safety chain are implemented and browser-proven, but reminder and inbound channel adapters are still simulator-backed.",
        "blockingRationale": "Live outbound reminder transport and some channel ingress adapters remain simulator-backed, so the row is approved for Phase 3 exit only with explicit live-later constraints.",
        "currentConstraints": ["C277_001"],
        "implementationEvidence": [
            repo_path("packages/domain-kernel/src/review-bundle-contracts.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-more-info-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-more-info-response-resafety.ts"),
            repo_path("packages/domains/communications/src/phase3-conversation-control-kernel.ts"),
            repo_path("packages/domains/communications/src/phase3-patient-conversation-tuple.ts"),
            repo_path("apps/patient-web/src/patient-conversation-surface.tsx"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_235_review_bundle_stack.py"),
            repo_path("tools/analysis/validate_236_more_info_kernel.py"),
            repo_path("tools/analysis/validate_237_response_resafety_pipeline.py"),
            repo_path("tools/analysis/validate_246_conversation_digest_and_settlement.py"),
            repo_path("tools/analysis/validate_247_patient_conversation_tuple.py"),
            repo_path("data/test/273_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_04",
        "capabilityFamily": "Endpoint decision, approval checkpoint, and urgent escalation control",
        "phaseBraidRefs": ["3E", "3F"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3E. Endpoint decision engine and resolution model",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3F. Human approval checkpoint and urgent escalation path",
            f"{repo_path('blueprint/forensic-audit-findings.md')}#Finding 21 - Human approval boundary was too coarse",
        ],
        "owningTasks": ["seq_228", "par_238", "par_239", "par_258", "par_260", "seq_273"],
        "summary": "DecisionEpoch, endpoint submission, approval checkpoints, and urgent escalation mutation paths are implemented with stale-fence rejection and one repository defect fixed in 273.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("docs/architecture/228_phase3_endpoint_decision_approval_and_escalation_contracts.md"),
            repo_path("packages/domains/triage_workspace/src/phase3-endpoint-decision-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-approval-escalation-kernel.ts"),
            repo_path("services/command-api/src/phase3-approval-escalation.ts"),
            repo_path("apps/clinical-workspace/src/workspace-approval-escalation.tsx"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_phase3_endpoint_consequence_contracts.py"),
            repo_path("tools/analysis/validate_238_endpoint_decision_engine.py"),
            repo_path("tools/analysis/validate_239_approval_and_urgent_escalation.py"),
            repo_path("data/test/273_suite_results.json"),
            repo_path("data/test/273_defect_log_and_remediation.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_05",
        "capabilityFamily": "Callback, clinician messaging, reachability repair, and linked support recovery",
        "phaseBraidRefs": ["3G", "3H"],
        "status": "go_with_constraints",
        "proofMode": "mixed",
        "sourceSections": [
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3G. Direct resolution, consequence paths, and downstream handoff seeds",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3H. Hardening, clinical beta, and formal exit gate",
            f"{repo_path('blueprint/forensic-audit-findings.md')}#Finding 23 - Clinician messaging had contradictory loop-and-close semantics",
            f"{repo_path('blueprint/forensic-audit-findings.md')}#Finding 24 - Callback handling had contradictory loop-and-close semantics",
        ],
        "owningTasks": ["seq_229", "par_243", "par_244", "par_245", "par_248", "par_263", "par_264", "par_267", "seq_274"],
        "summary": "Callback and message truth, reachability repair, and support-linked recovery are implemented and parity-proven, but live telephony and secure-message providers remain simulator-backed.",
        "blockingRationale": "The authoritative kernel is complete, but external communication transports remain simulator-backed and therefore keep the row in a constrained exit posture.",
        "currentConstraints": ["C277_001"],
        "implementationEvidence": [
            repo_path("docs/architecture/229_phase3_callback_message_selfcare_admin_boundaries.md"),
            repo_path("packages/domains/triage_workspace/src/phase3-callback-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-clinician-message-kernel.ts"),
            repo_path("services/command-api/src/phase3-communication-reachability-repair.ts"),
            repo_path("packages/domains/support/src/phase3-communication-failure-linkage.ts"),
            repo_path("apps/clinical-workspace/src/workspace-callback-workbench.tsx"),
            repo_path("apps/clinical-workspace/src/workspace-clinician-message-repair.tsx"),
            repo_path("apps/clinical-workspace/src/support-workspace-shell.tsx"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_phase3_conversation_and_resolution_contracts.py"),
            repo_path("tools/analysis/validate_243_callback_domain.py"),
            repo_path("tools/analysis/validate_244_clinician_message_domain.py"),
            repo_path("tools/analysis/validate_245_reachability_repair_and_resend.py"),
            repo_path("tools/analysis/validate_248_support_communication_failure_linkage.py"),
            repo_path("data/test/274_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_06",
        "capabilityFamily": "Self-care, bounded admin resolution, and reopen consequence law",
        "phaseBraidRefs": ["3G", "3H"],
        "status": "go_with_constraints",
        "proofMode": "mixed",
        "sourceSections": [
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3G. Direct resolution, consequence paths, and downstream handoff seeds",
            f"{repo_path('blueprint/forensic-audit-findings.md')}#Finding 20 - Endpoint choice lacked a durable decision object",
            f"{repo_path('blueprint/forensic-audit-findings.md')}#Finding 22 - Direct outcomes and downstream handoffs were collapsed",
        ],
        "owningTasks": ["par_249", "par_250", "par_251", "par_252", "par_253", "par_254", "par_265", "seq_275"],
        "summary": "Boundary decisions, advice render, admin waiting and settlement, typed completion artifacts, and reopen recovery are implemented and proven, but release-watch and downstream delivery/control-plane feeds remain partly simulated.",
        "blockingRationale": "The row is constrained because release-watch, content-authoring, and outbound admin-notification integrations still stop at simulator-backed or seeded control-plane seams.",
        "currentConstraints": ["C277_001", "C277_003"],
        "implementationEvidence": [
            repo_path("packages/domains/triage_workspace/src/phase3-self-care-boundary-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-advice-render-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-admin-resolution-policy-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-advice-admin-dependency-kernel.ts"),
            repo_path("packages/domains/triage_workspace/src/phase3-admin-resolution-settlement-kernel.ts"),
            repo_path("apps/clinical-workspace/src/workspace-selfcare-admin.tsx"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_249_self_care_boundary_and_grants.py"),
            repo_path("tools/analysis/validate_250_advice_render_and_content_approval.py"),
            repo_path("tools/analysis/validate_251_admin_resolution_policy_kernel.py"),
            repo_path("tools/analysis/validate_252_advice_admin_dependency_sets.py"),
            repo_path("tools/analysis/validate_253_analytics_and_expectation_templates.py"),
            repo_path("tools/analysis/validate_254_admin_resolution_settlement.py"),
            repo_path("data/test/275_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_07",
        "capabilityFamily": "Same-shell continuity, protected composition, and patient/staff parity",
        "phaseBraidRefs": ["3A", "3H"],
        "status": "go_with_constraints",
        "proofMode": "mixed",
        "sourceSections": [
            f"{repo_path('blueprint/staff-workspace-interface-architecture.md')}#Route family",
            f"{repo_path('blueprint/phase-0-the-foundation-protocol.md')}#Any route family whose rendered DOM markers",
            f"{repo_path('blueprint/phase-cards.md')}#Card 4: Phase 3 - The Human Checkpoint",
        ],
        "owningTasks": ["par_241", "par_242", "par_255", "par_256", "par_257", "par_258", "par_259", "par_261", "par_262", "seq_270", "seq_271"],
        "summary": "Same-shell continuity, selected-anchor preservation, focused drafting, patient/workspace conversation parity, and queue-to-task merge truth are implemented and browser-proven, but several surfaces still read from seeded projection helpers.",
        "blockingRationale": "The shell law is implemented and proven, but the current browser runtime still relies on seeded merge-bundle helpers instead of live command-api fetches on several routes.",
        "currentConstraints": ["C277_002"],
        "implementationEvidence": [
            repo_path("apps/clinical-workspace/src/workspace-focus-continuity.tsx"),
            repo_path("apps/clinical-workspace/src/workspace-reasoning-layer.tsx"),
            repo_path("apps/clinical-workspace/src/workspace-attachment-thread.tsx"),
            repo_path("apps/patient-web/src/patient-conversation-surface.tsx"),
            repo_path("packages/domain-kernel/src/phase3-patient-workspace-conversation-bundle.ts"),
            repo_path("services/command-api/src/phase3-patient-workspace-conversation-merge.ts"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_241_reopen_and_launch_leases.py"),
            repo_path("tools/analysis/validate_242_completion_and_continuity.py"),
            repo_path("tools/analysis/validate_258_reasoning_layer_contracts.py"),
            repo_path("tools/analysis/validate_259_attachment_viewer_and_thread_contracts.py"),
            repo_path("tools/analysis/validate_262_focus_protection_next_task_contracts.py"),
            repo_path("tools/analysis/validate_270_phase3_queue_callback_admin_merge.py"),
            repo_path("tools/analysis/validate_271_phase3_patient_workspace_conversation_merge.py"),
        ],
    },
    {
        "rowId": "PH3_ROW_08",
        "capabilityFamily": "Support replay and linked-context investigation",
        "phaseBraidRefs": ["3H"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/forensic-audit-findings.md')}#Finding 104 - The admin control plane still treated continuity proof as optional release commentary",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3H. Hardening, clinical beta, and formal exit gate",
        ],
        "owningTasks": ["par_248", "par_267", "seq_274"],
        "summary": "Support replay restore, linked context, masking, and same-shell recovery are implemented with machine-readable support parity and no unresolved repository defect in the communication suite.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("packages/domains/support/src/phase3-communication-failure-linkage.ts"),
            repo_path("apps/clinical-workspace/src/support-workspace-shell.tsx"),
            repo_path("docs/frontend/267_support_replay_linked_context_spec.md"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_248_support_communication_failure_linkage.py"),
            repo_path("tools/analysis/validate_267_support_replay_linked_context_contracts.py"),
            repo_path("tools/analysis/validate_support_workspace_ui.py"),
            repo_path("data/test/274_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_09",
        "capabilityFamily": "Accessibility, ergonomics, semantic coverage, and multi-user read-only safety",
        "phaseBraidRefs": ["3H"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/accessibility-and-content-system-contract.md')}#Route-family semantic coverage",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3H. Hardening, clinical beta, and formal exit gate",
            f"{repo_path('blueprint/phase-cards.md')}#Card 4: Phase 3 - The Human Checkpoint",
        ],
        "owningTasks": ["par_268", "seq_276"],
        "summary": "The dense workspace now has explicit semantic coverage, keyboard contracts, reduced-motion equivalence, performance budgets, and one-writer read-only proof.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("apps/clinical-workspace/src/workspace-accessibility.tsx"),
            repo_path("docs/frontend/276_workspace_hardening_assurance_lab.html"),
            repo_path("data/test/276_web_vitals_and_interaction_metrics.json"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_268_workspace_accessibility_contracts.py"),
            repo_path("tools/test/validate_276_workspace_hardening_suite.py"),
            repo_path("data/test/276_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_10",
        "capabilityFamily": "PHI-safe UI observability, settlement, and disclosure fencing",
        "phaseBraidRefs": ["3H"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3H. Hardening, clinical beta, and formal exit gate",
            f"{repo_path('blueprint/accessibility-and-content-system-contract.md')}#Screen-reader announcements and state messaging",
            f"{repo_path('blueprint/platform-runtime-and-release-blueprint.md')}#GatewayBffSurface",
        ],
        "owningTasks": ["par_246", "par_269", "seq_276"],
        "summary": "UIEventEnvelope, UITransitionSettlementRecord, UITelemetryDisclosureFence, and PHI-safe browser evidence are implemented and proven for critical workspace and support transitions.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("packages/domains/communications/src/phase3-conversation-control-kernel.ts"),
            repo_path("apps/clinical-workspace/src/workspace-support-observability.ts"),
            repo_path("docs/frontend/269_clinical_beta_validation_board.html"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_269_workspace_support_observability.py"),
            repo_path("data/contracts/269_ui_event_contract_catalog.json"),
            repo_path("data/test/276_defect_log_and_remediation.json"),
            repo_path("data/test/276_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_11",
        "capabilityFamily": "Final assurance suites and final hardening evidence",
        "phaseBraidRefs": ["3H"],
        "status": "approved",
        "proofMode": "mock_now",
        "sourceSections": [
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3H. Hardening, clinical beta, and formal exit gate",
            f"{repo_path('blueprint/phase-cards.md')}#Card 4: Phase 3 - The Human Checkpoint",
        ],
        "owningTasks": ["seq_272", "seq_273", "seq_274", "seq_275", "seq_276"],
        "summary": "The decisive queue, decision-cycle, communication-integrity, boundary-reopen, and workspace-hardening suites all passed with machine-readable evidence.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("docs/tests/272_phase3_queue_fairness_duplicate_stale_owner_suite.md"),
            repo_path("docs/tests/273_phase3_more_info_resafety_endpoint_approval_suite.md"),
            repo_path("docs/tests/274_phase3_callback_message_reachability_suite.md"),
            repo_path("docs/tests/275_phase3_self_care_admin_reopen_suite.md"),
            repo_path("docs/tests/276_phase3_workspace_accessibility_performance_multi_user_suite.md"),
        ],
        "automatedProofArtifacts": [
            repo_path("data/test/272_suite_results.json"),
            repo_path("data/test/273_suite_results.json"),
            repo_path("data/test/274_suite_results.json"),
            repo_path("data/test/275_suite_results.json"),
            repo_path("data/test/276_suite_results.json"),
        ],
    },
    {
        "rowId": "PH3_ROW_12",
        "capabilityFamily": "Phase 3 to Phase 4 booking boundary integrity",
        "phaseBraidRefs": ["3G", "3H"],
        "status": "approved",
        "proofMode": "mixed",
        "sourceSections": [
            f"{repo_path('blueprint/phase-cards.md')}#Card 5: Phase 4 - The Booking Engine",
            f"{repo_path('blueprint/phase-3-the-human-checkpoint.md')}#3G. Direct resolution, consequence paths, and downstream handoff seeds",
            f"{repo_path('blueprint/phase-0-the-foundation-protocol.md')}#LifecycleCoordinator remains the only request-closure authority",
        ],
        "owningTasks": ["par_240", "seq_270", "seq_271", "seq_277", "seq_278", "seq_279", "seq_280", "seq_281", "par_282", "par_283"],
        "summary": "Phase 3 exits with lawful BookingIntent and PharmacyIntent seeds, same-shell continuity, and clear Phase 4 ownership. The gate does not relabel those seeds as a complete Booking Engine.",
        "blockingRationale": "",
        "currentConstraints": [],
        "implementationEvidence": [
            repo_path("services/command-api/src/phase3-direct-resolution-handoffs.ts"),
            repo_path("docs/architecture/270_phase3_queue_callback_admin_merge.md"),
            repo_path("docs/architecture/271_phase3_patient_workspace_conversation_merge.md"),
        ],
        "automatedProofArtifacts": [
            repo_path("tools/analysis/validate_240_direct_resolution_and_handoffs.py"),
            repo_path("tools/analysis/validate_270_phase3_queue_callback_admin_merge.py"),
            repo_path("tools/analysis/validate_271_phase3_patient_workspace_conversation_merge.py"),
        ],
    },
]


STATUS_COUNTS = Counter(row["status"] for row in ROWS)
PHASE_STATUS = defaultdict(list)
for row in ROWS:
    for phase in row["phaseBraidRefs"]:
        PHASE_STATUS[phase].append(row["status"])


def aggregate_phase_status(statuses: list[str]) -> str:
    if "withheld" in statuses:
        return "withheld"
    if "go_with_constraints" in statuses:
        return "go_with_constraints"
    if "deferred_non_blocking" in statuses:
        return "deferred_non_blocking"
    return "approved"


PHASE_BRAID = [
    {
        "phaseId": phase_id,
        "label": label,
        "status": aggregate_phase_status(PHASE_STATUS.get(phase_id, ["approved"])),
    }
    for phase_id, label in [
        ("3A", "Triage contract"),
        ("3B", "Deterministic queue"),
        ("3C", "Review bundle"),
        ("3D", "More-info and re-safety"),
        ("3E", "Endpoint decision"),
        ("3F", "Approval and escalation"),
        ("3G", "Consequence paths and handoff seeds"),
        ("3H", "Hardening and exit gate"),
    ]
]


MANDATORY_QUESTIONS = [
    {
        "questionId": "Q277_001",
        "question": "Are tasks 226 to 276 complete, source-traceable, and internally coherent?",
        "answerStatus": "approved",
        "answer": "Yes. The freeze packs, implementation slices, UI route families, merge tasks, and assurance suites are all present in the repository and reconcile to one coherent Phase 3 contract stack.",
        "evidenceRowRefs": ["PH3_ROW_01", "PH3_ROW_02", "PH3_ROW_11", "PH3_ROW_12"],
    },
    {
        "questionId": "Q277_002",
        "question": "Did the decisive testing tasks 272 to 276 pass with machine-readable evidence?",
        "answerStatus": "approved",
        "answer": "Yes. Every decisive suite from 272 through 276 produced a passing suite result JSON, runnable validators, and browser or service proof artifacts.",
        "evidenceRowRefs": ["PH3_ROW_11"],
    },
    {
        "questionId": "Q277_003",
        "question": "Are the Phase 3 invariants demonstrably true in the current repository?",
        "answerStatus": "approved",
        "answer": "Yes for the current repository truth. Queue determinism, duplicate authority, one-writer mutation law, same-shell fail-closed recovery, PHI-safe observability, and accessibility/read-only hardening are all proven with executable evidence.",
        "evidenceRowRefs": ["PH3_ROW_02", "PH3_ROW_03", "PH3_ROW_04", "PH3_ROW_05", "PH3_ROW_06", "PH3_ROW_07", "PH3_ROW_08", "PH3_ROW_09", "PH3_ROW_10", "PH3_ROW_11"],
    },
    {
        "questionId": "Q277_004",
        "question": "Which evidence is simulator-backed today, and where is later live proof still required?",
        "answerStatus": "go_with_constraints",
        "answer": "External transport, some control-plane feeds, and some seeded read paths remain live-later boundaries. The gate keeps them explicit instead of promoting them into live provider readiness claims.",
        "evidenceRowRefs": ["PH3_ROW_03", "PH3_ROW_05", "PH3_ROW_06", "PH3_ROW_07"],
    },
    {
        "questionId": "Q277_005",
        "question": "Which items are intentionally deferred into Phase 4 or later, and why are they not Phase 3 blockers?",
        "answerStatus": "go_with_constraints",
        "answer": "Booking engine freeze and implementation work begins in 278 to 283, while live provider and live control-plane onboarding remain explicit later tracks. They do not block Human Checkpoint completion because Phase 3 only promises lawful triage, consequence, and handoff-seed truth.",
        "evidenceRowRefs": ["PH3_ROW_06", "PH3_ROW_07", "PH3_ROW_12"],
    },
    {
        "questionId": "Q277_006",
        "question": "Is there any unresolved contradiction between the blueprint corpus, the frozen prompt contracts, implemented artifacts, and verification results?",
        "answerStatus": "approved",
        "answer": "No blocking contradiction remains. The open gaps are all explicit, machine-readable, and non-blocking for the Human Checkpoint exit. They are constraints, not hidden drift.",
        "evidenceRowRefs": ["PH3_ROW_01", "PH3_ROW_11", "PH3_ROW_12"],
    },
]


OPEN_ITEMS = [
    {
        "itemId": "PH3_CF_001",
        "title": "Freeze BookingCase kernel, state machine, and intent lineage contract",
        "ownerTask": "seq_278",
        "category": "phase4_boundary",
        "phase3Blocker": False,
        "risk": "Phase 4 implementation could drift if the BookingCase kernel is not frozen before executable work continues.",
        "nextAction": "Publish the BookingCase freeze pack exactly as the lawful consumer of Phase 3 BookingIntent handoff seeds.",
    },
    {
        "itemId": "PH3_CF_002",
        "title": "Freeze provider capability matrix, adapter profiles, and confirmation gates",
        "ownerTask": "seq_279",
        "category": "phase4_boundary",
        "phase3Blocker": False,
        "risk": "Capability truth could fork if Phase 4 local booking infers supplier behaviour locally.",
        "nextAction": "Publish the capability compiler and projection freeze pack before local booking commit paths land.",
    },
    {
        "itemId": "PH3_CF_003",
        "title": "Freeze slot snapshot, offer scoring, commit, and manage contracts",
        "ownerTask": "seq_280",
        "category": "phase4_boundary",
        "phase3Blocker": False,
        "risk": "Reservation truth and confirmation truth could drift if slot, offer, and manage semantics are not frozen before implementation.",
        "nextAction": "Publish the slot-to-manage contract pack including reservation and confirmation truth boundaries.",
    },
    {
        "itemId": "PH3_CF_004",
        "title": "Open the Phase 4 local-booking implementation gate with exact ownership",
        "ownerTask": "seq_281",
        "category": "phase4_boundary",
        "phase3Blocker": False,
        "risk": "Parallel implementation could overlap or duplicate ownership if the gate is not explicit.",
        "nextAction": "Approve only the ready Phase 4 tracks and keep all other work machine-readably deferred.",
    },
    {
        "itemId": "PH3_CF_005",
        "title": "Implement durable BookingCase backend kernel",
        "ownerTask": "par_282",
        "category": "phase4_execution",
        "phase3Blocker": False,
        "risk": "Booking intent would remain a lawful seed without the durable case state machine needed for Phase 4 execution.",
        "nextAction": "Land BookingCase records, transitions, migrations, and request-lease enforcement against the frozen 278 contract.",
    },
    {
        "itemId": "PH3_CF_006",
        "title": "Implement capability compiler and audience-aware capability resolution engine",
        "ownerTask": "par_283",
        "category": "phase4_execution",
        "phase3Blocker": False,
        "risk": "Provider capability projection would remain static and Phase 4 flows could infer capability locally.",
        "nextAction": "Land the versioned capability matrix, adapter bindings, and audience-aware projection engine from the 279 freeze pack.",
    },
    {
        "itemId": "PH3_CF_007",
        "title": "Replace simulator-backed telephony and secure-message providers with live adapters",
        "ownerTask": "future_live_provider_activation",
        "category": "live_later",
        "phase3Blocker": False,
        "risk": "Production transport, receipt, and delivery semantics are not yet proven against live providers.",
        "nextAction": "Replay the 243 to 245 and 274 proof families against live provider bindings without changing the Phase 3 kernels.",
    },
    {
        "itemId": "PH3_CF_008",
        "title": "Replace simulator-backed reminders and admin notifications with live outbound delivery workers",
        "ownerTask": "future_transport_integration_track",
        "category": "live_later",
        "phase3Blocker": False,
        "risk": "Reminder and notification timing remains functionally correct in-kernel but not yet operationally proven on live delivery rails.",
        "nextAction": "Bind the existing outbox effects and idempotency keys to real transport workers and rerun 236 and 254 hardening.",
    },
    {
        "itemId": "PH3_CF_009",
        "title": "Replace seeded Phase 3 merge-bundle reads with live command-api fetch consumption",
        "ownerTask": "future_phase3_live_projection_fetch_hardening",
        "category": "live_later",
        "phase3Blocker": False,
        "risk": "Browser parity is proven today, but runtime drift could still hide behind seeded helpers until live fetches take over.",
        "nextAction": "Move patient-web and clinical-workspace routes to live command-api reads without changing the published route family or parity contract.",
    },
    {
        "itemId": "PH3_CF_010",
        "title": "Bind release-watch, channel-freeze, and content-authoring refs to live operational control planes",
        "ownerTask": "future_phase9_control_plane_activation",
        "category": "live_later",
        "phase3Blocker": False,
        "risk": "Current consequence and content proofs can be mistaken for live operational readiness if the seeded control-plane boundary is not preserved.",
        "nextAction": "Replace seeded control-plane refs with live watch, publication, and authoring feeds before live rollout claims are made.",
    },
]


VISUAL_REFERENCE_NOTES = {
    "taskId": TASK_ID,
    "reviewedOn": TODAY,
    "references": [
    {
        "referenceId": "REF_277_001",
        "source": "Clinical risk management standards",
        "url": "https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards",
        "official": True,
        "borrowed": [
            "The gate pack frames clinical beta and live deployment as governed evidence states rather than narrative milestones.",
            "The decision documents separate specification-level conformance from later deployment-use readiness."
        ],
        "rejected": [
            "We did not import any NHS template wording as the local algorithm remains the source of truth."
        ],
    },
    {
        "referenceId": "REF_277_002",
        "source": "Playwright accessibility testing",
        "url": "https://playwright.dev/docs/accessibility-testing",
        "official": True,
        "borrowed": [
            "The proof plan uses separate accessibility assertions and keeps manual/assistive review distinct from automated scans.",
            "The board proof expects browser-level accessibility checks rather than screenshot-only review."
        ],
        "rejected": [
            "We did not reduce accessibility proof to axe-only pass/fail because the local phase contract requires keyboard, reduced-motion, and parity proof as first-class checks."
        ],
    },
    {
        "referenceId": "REF_277_003",
        "source": "Playwright aria snapshots",
        "url": "https://playwright.dev/docs/aria-snapshots",
        "official": True,
        "borrowed": [
            "The Playwright proof writes ARIA snapshots for the scorecard and carry-forward map.",
            "The board keeps accessible structure stable enough for snapshot-based review."
        ],
        "rejected": [
            "We did not let the ARIA tree become the only proof surface; each visual region also keeps visible table/list parity."
        ],
    },
    {
        "referenceId": "REF_277_004",
        "source": "NHS accessibility guidance",
        "url": "https://service-manual.nhs.uk/accessibility",
        "official": True,
        "borrowed": [
            "The board treats accessibility as a release criterion, not a polishing pass.",
            "The gate board keeps one stable main region and explicit heading hierarchy."
        ],
        "rejected": [
            "We did not restate generic NHS accessibility guidance verbatim because the repository already defines stricter local route-family contracts."
        ],
    },
    {
        "referenceId": "REF_277_005",
        "source": "NHS layout guidance",
        "url": "https://service-manual.nhs.uk/design-system/styles/layout",
        "official": True,
        "borrowed": [
            "The board is mobile-first and collapses to one column on narrow screens.",
            "Readable text measures and clear main-content structure are preserved even though the board uses a wider operational canvas than the default NHS content width."
        ],
        "rejected": [
            "We rejected the fixed 960px width because prompt 277 requires a much wider governance board for dense operational evidence."
        ],
    },
    {
        "referenceId": "REF_277_006",
        "source": "NHS typography guidance",
        "url": "https://service-manual.nhs.uk/design-system/styles/typography",
        "official": True,
        "borrowed": [
            "The board keeps explicit heading levels and protects long technical tokens from horizontal overflow.",
            "Dense evidence tables use controlled line-wrapping rather than truncating critical identifiers."
        ],
        "rejected": [
            "We did not adopt NHS-specific type tokens because the repository already has a canonical token foundation."
        ],
    },
    {
        "referenceId": "REF_277_007",
        "source": "Linear UI refresh",
        "url": "https://linear.app/changelog",
        "official": True,
        "borrowed": [
            "The board uses a calmer, denser, and more consistent scanning hierarchy.",
            "Navigation chrome stays dimmer than the evidence content region."
        ],
        "rejected": [
            "We did not mirror product-brand styling or promotional visuals."
        ],
    },
    {
        "referenceId": "REF_277_008",
        "source": "Vercel dashboard navigation redesign rollout",
        "url": "https://vercel.com/changelog/dashboard-navigation-redesign-rollout",
        "official": True,
        "borrowed": [
            "The board uses a consistent rail and main-content split with a mobile-friendly collapse path.",
            "Dense navigation and workflow grouping stay subordinate to the main evidence surface."
        ],
        "rejected": [
            "We did not turn the board into a product dashboard with generic navigation chrome."
        ],
    },
    {
        "referenceId": "REF_277_009",
        "source": "Carbon data table usage",
        "url": "https://carbondesignsystem.com/components/data-table/usage/",
        "official": True,
        "borrowed": [
            "Evidence tables use sentence-case labels, stable headers, and toolbar-free dense reading surfaces.",
            "The scorecard and manifest favor table or list parity over decorative visual-only charts."
        ],
        "rejected": [
            "We did not adopt row-selection or batch-action patterns because this board is a governance review surface, not an operational bulk-action table."
        ],
    },
    ],
}


SUITE_SUMMARY = []
for task_id, relative_path in SUITE_FILES.items():
    payload = SUITE_RESULTS[task_id]
    SUITE_SUMMARY.append(
        {
            "taskId": task_id,
            "suiteResultRef": repo_path(relative_path),
            "visualMode": payload["visualMode"],
            "suiteVerdict": payload["suiteVerdict"],
            "summary": payload["summary"],
        }
    )


DECISION = {
    "taskId": TASK_ID,
    "repoRoot": str(ROOT),
    "generatedAt": TODAY,
    "visualMode": VISUAL_MODE,
    "phase": "phase_3_human_checkpoint",
    "verdict": "go_with_constraints",
    "phase4EntryVerdict": "approved",
    "clinicalBetaVerdict": "approved",
    "liveProviderRolloutVerdict": "withheld",
    "scorecardSummary": {
        "approvedCount": STATUS_COUNTS.get("approved", 0),
        "goWithConstraintsCount": STATUS_COUNTS.get("go_with_constraints", 0),
        "withheldCount": STATUS_COUNTS.get("withheld", 0),
        "deferredNonBlockingCount": STATUS_COUNTS.get("deferred_non_blocking", 0),
        "rowCount": len(ROWS),
    },
    "phaseBraid": PHASE_BRAID,
    "decisionStatement": "Phase 3 Human Checkpoint is complete for source-algorithm conformance and for entry into the Phase 4 booking freeze and implementation gate, but the exit remains constrained because simulator-backed provider adapters, seeded runtime read paths, and seeded control-plane feeds must not be relabeled as production-live readiness.",
    "allowedNextSteps": [
        "Proceed to seq_278 through seq_281 to freeze and open the Phase 4 local-booking implementation wave.",
        "Proceed to par_282 and par_283 only after the freeze tasks declare readiness.",
        "Continue internal clinical beta and repository hardening under the current feature-flag and simulator-backed boundaries."
    ],
    "withheldClaims": [
        "Do not claim live provider readiness for callback, secure messaging, reminders, or admin notifications.",
        "Do not claim that seeded browser read paths are equivalent to live command-api consumption.",
        "Do not claim that Phase 4 booking is already complete because BookingIntent handoff seeds exist."
    ],
    "constraints": CONSTRAINTS,
    "decisiveSuites": SUITE_SUMMARY,
    "mandatoryQuestions": MANDATORY_QUESTIONS,
    "evidenceManifestRef": repo_path("data/analysis/277_phase3_evidence_manifest.csv"),
    "conformanceRowsRef": repo_path("data/analysis/277_phase3_conformance_rows.json"),
    "openItemsRef": repo_path("data/analysis/277_phase3_open_items_and_phase4_carry_forward.json"),
    "invariantProofMapRef": repo_path("data/analysis/277_phase3_invariant_proof_map.json"),
}


EVIDENCE_MANIFEST = [
    {
        "evidenceId": f"E277_{index:03d}",
        "rowId": row["rowId"],
        "evidenceKind": kind,
        "artifactPath": artifact,
        "sourceSection": source_section,
        "ownerTask": owner_task,
        "proofMode": row["proofMode"],
        "freshnessState": "current_checked_2026_04_18",
        "notes": note,
    }
    for index, (row, kind, artifact, source_section, owner_task, note) in enumerate(
        [
            (ROWS[0], "algorithm", repo_path("blueprint/phase-3-the-human-checkpoint.md"), "3A. Triage contract and workspace state model", "seq_226", "Phase 3 triage object and lease law"),
            (ROWS[0], "implementation", repo_path("packages/domains/triage_workspace/src/phase3-triage-kernel.ts"), "kernel", "par_231", "Executable triage state machine"),
            (ROWS[0], "proof", repo_path("tools/analysis/validate_phase3_triage_workspace_contracts.py"), "validator", "seq_226", "Freeze pack and route stack validator"),
            (ROWS[1], "algorithm", repo_path("blueprint/phase-3-the-human-checkpoint.md"), "3B. Deterministic queue engine and fairness controls", "seq_227", "Queue ranking and duplicate authority law"),
            (ROWS[1], "implementation", repo_path("services/command-api/src/phase3-queue-callback-admin-merge.ts"), "merge service", "seq_270", "Queue and consequence merge authority"),
            (ROWS[1], "proof", repo_path("data/test/272_suite_results.json"), "suite result", "seq_272", "Deterministic queue and stale-owner proof"),
            (ROWS[2], "algorithm", repo_path("blueprint/phase-3-the-human-checkpoint.md"), "3D. More-info loop and re-safety", "par_236", "Reply window and re-safety law"),
            (ROWS[2], "implementation", repo_path("packages/domains/triage_workspace/src/phase3-more-info-response-resafety.ts"), "kernel", "par_237", "Assimilation and re-safety pipeline"),
            (ROWS[2], "proof", repo_path("data/test/273_suite_results.json"), "suite result", "seq_273", "Decision-cycle assurance covers more-info and re-safety"),
            (ROWS[3], "algorithm", repo_path("blueprint/phase-3-the-human-checkpoint.md"), "3E and 3F", "seq_228", "DecisionEpoch and approval law"),
            (ROWS[3], "implementation", repo_path("services/command-api/src/phase3-approval-escalation.ts"), "service", "par_239", "Approval invalidation and urgent escalation path"),
            (ROWS[3], "proof", repo_path("data/test/273_defect_log_and_remediation.json"), "defect log", "seq_273", "Repository fix closed stale approval invalidation drift"),
            (ROWS[4], "algorithm", repo_path("blueprint/forensic-audit-findings.md"), "Finding 23 and Finding 24", "seq_229", "Communication closure and replay law"),
            (ROWS[4], "implementation", repo_path("packages/domains/triage_workspace/src/phase3-clinician-message-kernel.ts"), "kernel", "par_244", "Clinician message delivery chain"),
            (ROWS[4], "proof", repo_path("data/test/274_suite_results.json"), "suite result", "seq_274", "Communication integrity suite"),
            (ROWS[5], "algorithm", repo_path("blueprint/phase-3-the-human-checkpoint.md"), "3G. Direct resolution and consequence paths", "seq_229", "Boundary and reopen law"),
            (ROWS[5], "implementation", repo_path("packages/domains/triage_workspace/src/phase3-admin-resolution-settlement-kernel.ts"), "kernel", "par_254", "Admin settlement and re-entry"),
            (ROWS[5], "proof", repo_path("data/test/275_suite_results.json"), "suite result", "seq_275", "Boundary and reopen assurance"),
            (ROWS[6], "algorithm", repo_path("blueprint/staff-workspace-interface-architecture.md"), "Route family and continuity rules", "par_255", "Same-shell continuity law"),
            (ROWS[6], "implementation", repo_path("packages/domain-kernel/src/phase3-patient-workspace-conversation-bundle.ts"), "bundle", "seq_271", "Patient and workspace merge parity"),
            (ROWS[6], "proof", repo_path("tools/analysis/validate_271_phase3_patient_workspace_conversation_merge.py"), "validator", "seq_271", "Patient and workspace bundle parity validator"),
            (ROWS[7], "algorithm", repo_path("blueprint/forensic-audit-findings.md"), "Finding 104", "par_267", "Support replay restore law"),
            (ROWS[7], "implementation", repo_path("apps/clinical-workspace/src/support-workspace-shell.tsx"), "ui", "par_267", "Support replay and linked context shell"),
            (ROWS[7], "proof", repo_path("tools/analysis/validate_267_support_replay_linked_context_contracts.py"), "validator", "par_267", "Support replay contract validator"),
            (ROWS[8], "algorithm", repo_path("blueprint/accessibility-and-content-system-contract.md"), "Route-family semantic coverage", "par_268", "Accessibility and semantic coverage law"),
            (ROWS[8], "implementation", repo_path("apps/clinical-workspace/src/workspace-accessibility.tsx"), "ui", "par_268", "Accessibility contract layer"),
            (ROWS[8], "proof", repo_path("data/test/276_web_vitals_and_interaction_metrics.json"), "performance budget", "seq_276", "Measured browser budgets"),
            (ROWS[9], "algorithm", repo_path("blueprint/platform-runtime-and-release-blueprint.md"), "GatewayBffSurface", "par_269", "Disclosure fence and runtime contract law"),
            (ROWS[9], "implementation", repo_path("apps/clinical-workspace/src/workspace-support-observability.ts"), "ui", "par_269", "Observability contract sink"),
            (ROWS[9], "proof", repo_path("data/contracts/269_ui_event_contract_catalog.json"), "contract", "par_269", "UI event catalog and disclosure matrix"),
            (ROWS[10], "proof", repo_path("docs/tests/272_phase3_queue_fairness_duplicate_stale_owner_suite.md"), "suite doc", "seq_272", "Queue-governance assurance"),
            (ROWS[10], "proof", repo_path("docs/tests/273_phase3_more_info_resafety_endpoint_approval_suite.md"), "suite doc", "seq_273", "Decision-cycle assurance"),
            (ROWS[10], "proof", repo_path("docs/tests/274_phase3_callback_message_reachability_suite.md"), "suite doc", "seq_274", "Communication integrity assurance"),
            (ROWS[10], "proof", repo_path("docs/tests/275_phase3_self_care_admin_reopen_suite.md"), "suite doc", "seq_275", "Boundary and reopen assurance"),
            (ROWS[10], "proof", repo_path("docs/tests/276_phase3_workspace_accessibility_performance_multi_user_suite.md"), "suite doc", "seq_276", "Workspace hardening assurance"),
            (ROWS[11], "algorithm", repo_path("blueprint/phase-cards.md"), "Card 5. Phase 4 - The Booking Engine", "seq_278", "Phase 4 consumes Phase 3 handoff seeds"),
            (ROWS[11], "implementation", repo_path("services/command-api/src/phase3-direct-resolution-handoffs.ts"), "service", "par_240", "Direct resolution and BookingIntent seed creation"),
            (ROWS[11], "proof", repo_path("tools/analysis/validate_240_direct_resolution_and_handoffs.py"), "validator", "par_240", "Booking and pharmacy handoff validator"),
        ],
        start=1,
    )
]


INVARIANT_PROOF_MAP = {
    "taskId": TASK_ID,
    "generatedAt": TODAY,
    "invariants": [
        {
            "invariantId": "PH3_INV_001",
            "statement": "Queue order is deterministic, replayable, and honest under overload.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_02", "PH3_ROW_11"],
            "suiteRefs": [repo_path("data/test/272_suite_results.json")],
            "proofMode": "mock_now",
            "residualRisk": "No unresolved repository-owned queue-governance defect remained after 272 rerun.",
        },
        {
            "invariantId": "PH3_INV_002",
            "statement": "Duplicate clustering and duplicate authority stay bound to canonical evidence.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_02", "PH3_ROW_11"],
            "suiteRefs": [repo_path("data/test/272_suite_results.json")],
            "proofMode": "mock_now",
            "residualRisk": "Duplicate review remains bounded to DuplicateReviewSnapshot and append-only resolution decisions.",
        },
        {
            "invariantId": "PH3_INV_003",
            "statement": "Only one current owner may mutate a live task while others remain read-only.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_01", "PH3_ROW_02", "PH3_ROW_07", "PH3_ROW_09", "PH3_ROW_11"],
            "suiteRefs": [repo_path("data/test/272_suite_results.json"), repo_path("data/test/276_suite_results.json")],
            "proofMode": "mock_now",
            "residualRisk": "Mutation remains fenced to the live lease and read-only recovery is browser-proven in 276.",
        },
        {
            "invariantId": "PH3_INV_004",
            "statement": "More-info, re-safety, endpoint decision, approval, escalation, callback, messaging, self-care, admin resolution, reopen, and support replay stay bound to their canonical objects.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_03", "PH3_ROW_04", "PH3_ROW_05", "PH3_ROW_06", "PH3_ROW_08", "PH3_ROW_11"],
            "suiteRefs": [
                repo_path("data/test/273_suite_results.json"),
                repo_path("data/test/274_suite_results.json"),
                repo_path("data/test/275_suite_results.json"),
            ],
            "proofMode": "mixed",
            "residualRisk": "Live adapter onboarding remains outstanding, but the canonical object boundaries themselves are enforced and proven in repository execution.",
        },
        {
            "invariantId": "PH3_INV_005",
            "statement": "Route publication, trust drift, continuity evidence, focus protection, and task completion settlement all fail closed in the same shell.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_01", "PH3_ROW_07", "PH3_ROW_09", "PH3_ROW_11"],
            "suiteRefs": [repo_path("data/test/276_suite_results.json"), repo_path("data/test/271_suite_results.json") if (ROOT / "data/test/271_suite_results.json").exists() else repo_path("tools/analysis/validate_271_phase3_patient_workspace_conversation_merge.py")],
            "proofMode": "mixed",
            "residualRisk": "Seed-backed read helpers remain, but same-shell failure and recovery semantics are enforced and browser-proven.",
        },
        {
            "invariantId": "PH3_INV_006",
            "statement": "PHI-safe UI observability and redaction are proven for critical transitions.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_08", "PH3_ROW_10", "PH3_ROW_11"],
            "suiteRefs": [repo_path("data/test/274_suite_results.json"), repo_path("data/test/276_suite_results.json")],
            "proofMode": "mock_now",
            "residualRisk": "No evidence pack or browser artifact is allowed to publish patient names on hardening-safe routes.",
        },
        {
            "invariantId": "PH3_INV_007",
            "statement": "Accessibility, semantic coverage, performance, and multi-user read-only behaviour are proven across the dense workspace.",
            "status": "approved",
            "rowRefs": ["PH3_ROW_09", "PH3_ROW_11"],
            "suiteRefs": [repo_path("data/test/276_suite_results.json")],
            "proofMode": "mock_now",
            "residualRisk": "The 276 hardening suite fixed all repository-owned defects it surfaced and finished within the declared budgets.",
        },
    ],
}


def render_pack_markdown() -> str:
    scorecard_rows = [
        [
            row["rowId"],
            row["capabilityFamily"],
            row["status"],
            row["proofMode"],
            ", ".join(row["owningTasks"]),
        ]
        for row in ROWS
    ]
    suite_rows = [
        [
            suite["taskId"],
            suite["visualMode"],
            suite["suiteVerdict"],
            str(suite["summary"]),
        ]
        for suite in SUITE_SUMMARY
    ]
    return textwrap.dedent(
        f"""
        # 277 Phase 3 Exit Gate Pack

        ## Verdict

        - Human Checkpoint exit verdict: `{DECISION["verdict"]}`
        - Phase 4 entry verdict: `{DECISION["phase4EntryVerdict"]}`
        - Clinical beta verdict: `{DECISION["clinicalBetaVerdict"]}`
        - Live-provider rollout verdict: `{DECISION["liveProviderRolloutVerdict"]}`

        {DECISION["decisionStatement"]}

        ## Evidence posture

        The gate is evidence-led. Merged code alone is not the release decision. The decision is pinned to:

        1. the local blueprint corpus
        2. validated outputs from tasks `226` to `276`
        3. decisive executable suites `272` to `276`
        4. the explicit carry-forward and live-later boundaries published in this pack

        ## Conformance scorecard summary

        {markdown_table(
            ["Row", "Capability family", "Status", "Proof mode", "Owning tasks"],
            scorecard_rows,
        )}

        ## Decisive suite summary

        {markdown_table(
            ["Task", "Visual mode", "Suite verdict", "Summary"],
            suite_rows,
        )}

        ## Constraints carried by the verdict

        {chr(10).join(
            f"- `{constraint['constraintId']}`: {constraint['summary']} Owner: `{constraint['ownerTask']}`."
            for constraint in CONSTRAINTS
        )}

        ## Carry-forward boundary

        The Human Checkpoint is complete enough to open the Phase 4 booking freeze and implementation gate, but it is not allowed to over-claim:

        - lawful `BookingIntent` and `PharmacyIntent` seeds exist
        - Phase 4 still starts with `BookingCase`, capability resolution, slot truth, reservation truth, and confirmation truth freezes
        - live provider onboarding and live control-plane wiring remain explicit later work

        ## Machine-auditable artifacts

        - Decision file: [277_phase3_exit_gate_decision.json]({repo_path('data/analysis/277_phase3_exit_gate_decision.json')})
        - Conformance rows: [277_phase3_conformance_rows.json]({repo_path('data/analysis/277_phase3_conformance_rows.json')})
        - Evidence manifest: [277_phase3_evidence_manifest.csv]({repo_path('data/analysis/277_phase3_evidence_manifest.csv')})
        - Invariant proof map: [277_phase3_invariant_proof_map.json]({repo_path('data/analysis/277_phase3_invariant_proof_map.json')})
        - Carry-forward list: [277_phase3_open_items_and_phase4_carry_forward.json]({repo_path('data/analysis/277_phase3_open_items_and_phase4_carry_forward.json')})
        """
    ).strip()


def render_go_no_go_markdown() -> str:
    question_rows = [
        [entry["questionId"], entry["answerStatus"], entry["question"], entry["answer"]]
        for entry in MANDATORY_QUESTIONS
    ]
    return textwrap.dedent(
        f"""
        # 277 Phase 3 Go/No-Go Decision

        ## Decision

        The authoritative verdict is `{DECISION["verdict"]}`.

        This is a **go** for:

        - closing the Human Checkpoint against the local Phase 3 algorithm
        - opening the Phase 4 booking freeze tasks `278` to `281`
        - opening executable Phase 4 implementation tasks only through that freeze gate
        - continuing clinical beta and simulator-backed hardening under the current guarded posture

        This is a **no-go** for:

        - claiming live-provider readiness for callback, secure-message, reminder, or admin-notification delivery
        - claiming seeded browser reads are equivalent to live command-api consumption
        - claiming the Booking Engine already exists because Phase 3 can emit lawful handoff seeds

        ## Why the verdict is not `approved`

        All decisive suites passed and all required Phase 3 invariants are proven in the current repository. The verdict remains constrained because the repository still publishes several simulator-backed or seeded seams that must remain explicit:

        {chr(10).join(f"- {constraint['summary']}" for constraint in CONSTRAINTS)}

        ## Mandatory question ledger

        {markdown_table(["Id", "Status", "Question", "Answer"], question_rows)}
        """
    ).strip()


def render_scorecard_markdown() -> str:
    rows = [
        [
            row["rowId"],
            row["capabilityFamily"],
            row["status"],
            row["proofMode"],
            "; ".join(row["phaseBraidRefs"]),
            row["blockingRationale"] or "None",
        ]
        for row in ROWS
    ]
    return textwrap.dedent(
        f"""
        # 277 Phase 3 Conformance Scorecard

        {markdown_table(
            ["Row", "Capability family", "Status", "Proof mode", "Phase braid", "Blocking rationale"],
            rows,
        )}

        ## Row notes

        {chr(10).join(
            f"### {row['rowId']} {row['capabilityFamily']}\n"
            f"- Summary: {row['summary']}\n"
            f"- Source sections: {', '.join(row['sourceSections'])}\n"
            f"- Owning tasks: {', '.join(row['owningTasks'])}\n"
            f"- Implementation evidence: {', '.join(row['implementationEvidence'])}\n"
            f"- Automated proof: {', '.join(row['automatedProofArtifacts'])}"
            for row in ROWS
        )}
        """
    ).strip()


def render_boundary_markdown() -> str:
    table_rows = [
        [
            item["ownerTask"],
            item["title"],
            item["category"],
            item["risk"],
            item["nextAction"],
        ]
        for item in OPEN_ITEMS
        if item["category"] in {"phase4_boundary", "phase4_execution"}
    ]
    return textwrap.dedent(
        f"""
        # 277 Phase 3 To Phase 4 Boundary

        Phase 3 closes the Human Checkpoint. Phase 4 starts from the lawful objects and continuity contracts already minted by Phase 3. It does **not** reopen triage truth.

        ## Phase 4 consumes from Phase 3

        - `DecisionEpoch`, `DecisionSupersessionRecord`, and `TaskCompletionSettlementEnvelope`
        - lawful `BookingIntent` and `PharmacyIntent` handoff seeds
        - same-shell continuity, trust, and route-publication law from the staff and patient shells
        - the merged queue or callback or consequence posture from `270` and `271`
        - the formal exit verdict and carry-forward boundary from this task

        ## Phase 4 must not redefine

        - queue determinism or duplicate authority
        - the one-writer many-readers mutation law
        - the same-shell fail-closed recovery model
        - the rule that `LifecycleCoordinator` remains the only request-closure authority
        - the separation between simulator-backed proof and live-provider readiness

        ## Phase 4 entry tasks

        {markdown_table(
            ["Owner task", "Work item", "Category", "Risk if absent", "Next action"],
            table_rows,
        )}
        """
    ).strip()


def render_beta_boundary_markdown() -> str:
    live_later_rows = [
        [item["itemId"], item["title"], item["ownerTask"], item["risk"], item["nextAction"]]
        for item in OPEN_ITEMS
        if item["category"] == "live_later"
    ]
    return textwrap.dedent(
        f"""
        # 277 Phase 3 Clinical Beta And Live-Later Boundary

        ## Mock-now execution accepted now

        The following are accepted as valid Phase 3 exit evidence in the current repository:

        - simulator-backed provider seams exercising the canonical callback, message, reminder, and notification contracts
        - seeded browser projection helpers preserving the published route, parity, and recovery contracts
        - seeded control-plane refs for release-watch, content, and continuity proof where the domain kernels already bind those refs deterministically

        ## Live-later boundaries

        The gate explicitly withholds production-live claims for these items:

        {markdown_table(
            ["Id", "Live-later item", "Owner task", "Risk", "Next action"],
            live_later_rows,
        )}

        ## Practical reading

        Phase 3 is complete enough to freeze and open the Booking Engine wave. It is not complete enough to call external-channel production onboarding done.
        """
    ).strip()


def render_board_html() -> str:
    return textwrap.dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>277 Phase 3 Exit Board</title>
            <style>
              :root {{
                color-scheme: light;
                --canvas: #f5f7fb;
                --panel: #ffffff;
                --inset: #eef2f7;
                --border: #d7dfea;
                --text-strong: #0f172a;
                --text: #334155;
                --muted: #64748b;
                --approved: #0f766e;
                --constrained: #b7791f;
                --withheld: #b42318;
                --evidence: #3158e0;
                --shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
              }}

              * {{ box-sizing: border-box; }}

              html, body {{
                margin: 0;
                background: var(--canvas);
                color: var(--text);
                font-family: Inter, "Segoe UI", Arial, sans-serif;
              }}

              body {{
                min-height: 100vh;
              }}

              a {{
                color: var(--evidence);
                text-decoration: none;
              }}

              a:hover {{
                text-decoration: underline;
              }}

              .board {{
                max-width: 1600px;
                margin: 0 auto;
                padding: 1.25rem;
                display: grid;
                gap: 1rem;
              }}

              .masthead,
              .panel {{
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 0.5rem;
                box-shadow: var(--shadow);
              }}

              .masthead {{
                min-height: 72px;
                padding: 1rem 1.25rem;
                display: grid;
                gap: 0.85rem;
              }}

              .eyebrow {{
                font-size: 0.74rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--evidence);
              }}

              h1, h2, h3, h4, p {{
                margin: 0;
              }}

              .muted {{
                color: var(--muted);
                line-height: 1.5;
              }}

              .verdict-band {{
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 1rem;
                align-items: start;
              }}

              .verdict-copy {{
                display: grid;
                gap: 0.65rem;
              }}

              .verdict-band[data-verdict="approved"] {{
                border-left: 6px solid var(--approved);
              }}

              .verdict-band[data-verdict="go_with_constraints"] {{
                border-left: 6px solid var(--constrained);
              }}

              .verdict-band[data-verdict="withheld"] {{
                border-left: 6px solid var(--withheld);
              }}

              .chip-row {{
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
              }}

              .chip {{
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                min-height: 32px;
                padding: 0.35rem 0.65rem;
                border-radius: 999px;
                border: 1px solid var(--border);
                font-size: 0.82rem;
                background: var(--inset);
                color: var(--text-strong);
              }}

              .chip[data-tone="approved"] {{
                color: var(--approved);
                border-color: rgba(15, 118, 110, 0.3);
                background: rgba(15, 118, 110, 0.08);
              }}

              .chip[data-tone="go_with_constraints"] {{
                color: var(--constrained);
                border-color: rgba(183, 121, 31, 0.3);
                background: rgba(183, 121, 31, 0.1);
              }}

              .chip[data-tone="withheld"] {{
                color: var(--withheld);
                border-color: rgba(180, 35, 24, 0.3);
                background: rgba(180, 35, 24, 0.08);
              }}

              .chip[data-tone="evidence"] {{
                color: var(--evidence);
                border-color: rgba(49, 88, 224, 0.25);
                background: rgba(49, 88, 224, 0.08);
              }}

              .preview-controls {{
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: flex-end;
              }}

              .preview-button {{
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text-strong);
                border-radius: 999px;
                min-height: 40px;
                padding: 0.55rem 0.85rem;
                cursor: pointer;
              }}

              .preview-button[data-active="true"] {{
                border-color: var(--evidence);
                color: var(--evidence);
                background: rgba(49, 88, 224, 0.08);
              }}

              .layout {{
                display: grid;
                grid-template-columns: minmax(0, 8fr) minmax(320px, 4fr);
                gap: 1rem;
              }}

              .stack {{
                display: grid;
                gap: 1rem;
              }}

              .panel {{
                padding: 1rem;
                display: grid;
                gap: 0.85rem;
              }}

              .region-header {{
                display: grid;
                gap: 0.3rem;
              }}

              .phase-braid {{
                display: grid;
                gap: 0.85rem;
              }}

              .phase-braid-diagram {{
                display: grid;
                grid-template-columns: repeat(8, minmax(0, 1fr));
                gap: 0.55rem;
              }}

              .phase-node {{
                border: 1px solid var(--border);
                background: var(--inset);
                border-radius: 0.45rem;
                padding: 0.7rem 0.65rem;
                display: grid;
                gap: 0.35rem;
                min-height: 88px;
              }}

              .phase-node[data-status="approved"] {{
                border-color: rgba(15, 118, 110, 0.25);
              }}

              .phase-node[data-status="go_with_constraints"] {{
                border-color: rgba(183, 121, 31, 0.25);
              }}

              .phase-node[data-status="withheld"] {{
                border-color: rgba(180, 35, 24, 0.25);
              }}

              .phase-braid-table,
              .suite-table,
              .manifest-table,
              .boundary-table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 0.88rem;
              }}

              .phase-braid-table th,
              .phase-braid-table td,
              .suite-table th,
              .suite-table td,
              .manifest-table th,
              .manifest-table td,
              .boundary-table th,
              .boundary-table td {{
                border-bottom: 1px solid var(--border);
                padding: 0.55rem 0.4rem;
                text-align: left;
                vertical-align: top;
                overflow-wrap: anywhere;
                word-break: break-word;
              }}

              .ladder {{
                display: grid;
                gap: 0.75rem;
              }}

              .scorecard-row {{
                border: 1px solid var(--border);
                border-radius: 0.45rem;
                background: var(--panel);
              }}

              .scorecard-row > summary {{
                list-style: none;
                cursor: pointer;
                padding: 0.85rem 0.95rem;
                display: grid;
                gap: 0.55rem;
              }}

              .scorecard-row > summary::-webkit-details-marker {{
                display: none;
              }}

              .summary-head {{
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 0.75rem;
                align-items: start;
              }}

              .summary-head > div {{
                min-width: 0;
              }}

              .row-meta {{
                display: flex;
                flex-wrap: wrap;
                gap: 0.45rem;
                min-width: 0;
              }}

              .summary-body {{
                color: var(--muted);
                line-height: 1.5;
                overflow-wrap: anywhere;
                word-break: break-word;
              }}

              .scorecard-detail {{
                border-top: 1px solid var(--border);
                padding: 0.85rem 0.95rem 0.95rem;
                display: grid;
                gap: 0.75rem;
                background: rgba(238, 242, 247, 0.45);
              }}

              .detail-grid {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.75rem;
              }}

              .detail-list {{
                display: grid;
                gap: 0.35rem;
              }}

              .detail-list li {{
                line-height: 1.45;
                overflow-wrap: anywhere;
                word-break: break-word;
              }}

              .suite-grid,
              .constraint-list,
              .ledger-list,
              .boundary-grid {{
                display: grid;
                gap: 0.75rem;
              }}

              .constraint-card,
              .ledger-card,
              .boundary-card {{
                border: 1px solid var(--border);
                border-radius: 0.45rem;
                background: var(--inset);
                padding: 0.8rem 0.85rem;
                display: grid;
                gap: 0.45rem;
                min-width: 0;
                overflow-wrap: anywhere;
                word-break: break-word;
              }}

              .boundary-grid {{
                grid-template-columns: repeat(3, minmax(0, 1fr));
              }}

              .rail-kpis {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.6rem;
              }}

              .kpi {{
                border: 1px solid var(--border);
                border-radius: 0.45rem;
                background: var(--inset);
                padding: 0.75rem 0.8rem;
                display: grid;
                gap: 0.25rem;
                min-width: 0;
                overflow-wrap: anywhere;
                word-break: break-word;
              }}

              .kpi strong {{
                font-size: 1.1rem;
                color: var(--text-strong);
              }}

              .lower-zone {{
                display: grid;
                grid-template-columns: repeat(12, minmax(0, 1fr));
                gap: 1rem;
              }}

              .span-5 {{ grid-column: span 5; }}
              .span-4 {{ grid-column: span 4; }}
              .span-3 {{ grid-column: span 3; }}

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

              button:focus-visible,
              summary:focus-visible,
              a:focus-visible {{
                outline: 2px solid var(--evidence);
                outline-offset: 2px;
              }}

              @media (prefers-reduced-motion: reduce) {{
                *, *::before, *::after {{
                  animation-duration: 0.01ms !important;
                  animation-iteration-count: 1 !important;
                  transition-duration: 0.01ms !important;
                  scroll-behavior: auto !important;
                }}
              }}

              @media (max-width: 1100px) {{
                .layout,
                .lower-zone {{
                  grid-template-columns: 1fr;
                }}

                .span-5,
                .span-4,
                .span-3 {{
                  grid-column: auto;
                }}

                .phase-braid-diagram {{
                  grid-template-columns: repeat(4, minmax(0, 1fr));
                }}
              }}

              @media (max-width: 720px) {{
                .board {{
                  padding: 0.85rem;
                }}

                .verdict-band {{
                  grid-template-columns: 1fr;
                }}

                .preview-controls {{
                  justify-content: flex-start;
                }}

                .phase-braid-diagram,
                .detail-grid,
                .boundary-grid,
                .rail-kpis {{
                  grid-template-columns: 1fr;
                }}
              }}
            </style>
          </head>
          <body>
            <main
              class="board"
              data-testid="Phase3ExitBoard"
              data-visual-mode="{VISUAL_MODE}"
              data-current-verdict=""
              data-active-verdict=""
              data-preview-mode="false"
              data-reduced-motion=""
            >
              <section class="masthead verdict-band" data-testid="VerdictBand">
                <div class="verdict-copy">
                  <div class="eyebrow">Human checkpoint exit board</div>
                  <h1 id="verdict-title">Loading Phase 3 exit verdict...</h1>
                  <p class="muted" id="verdict-summary">Fetching decision data.</p>
                  <div class="chip-row" id="verdict-chip-row"></div>
                </div>
                <div class="preview-controls" data-testid="VerdictScenarioControls" aria-label="Verdict preview controls"></div>
              </section>

              <div class="layout">
                <div class="stack">
                  <section class="panel" data-testid="PhaseBraid">
                    <div class="region-header">
                      <h2>Phase braid</h2>
                      <p class="muted">Compact 3A to 3H status with table parity.</p>
                    </div>
                    <div class="phase-braid">
                      <div class="phase-braid-diagram" data-testid="PhaseBraidDiagram"></div>
                      <table class="phase-braid-table" data-testid="PhaseBraidTable">
                        <thead>
                          <tr><th>Phase</th><th>Meaning</th><th>Status</th></tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </div>
                  </section>

                  <section class="panel" data-testid="ConformanceLadder">
                    <div class="region-header">
                      <h2>Conformance ladder</h2>
                      <p class="muted">One row per Phase 3 capability family with current status, proof mode, and evidence trace.</p>
                    </div>
                    <div class="chip-row" id="scorecard-summary-row"></div>
                    <div class="ladder" id="scorecard-ladder"></div>
                  </section>
                </div>

                <div class="stack">
                  <section class="panel" data-testid="EvidenceManifestPanel">
                    <div class="region-header">
                      <h2>Evidence manifest</h2>
                      <p class="muted">Current suite freshness and machine-auditable artifacts.</p>
                    </div>
                    <div class="rail-kpis" id="evidence-kpis"></div>
                    <table class="suite-table" data-testid="EvidenceFreshnessMatrix">
                      <thead>
                        <tr><th>Task</th><th>Visual mode</th><th>Verdict</th><th>Summary</th></tr>
                      </thead>
                      <tbody id="suite-table-body"></tbody>
                    </table>
                    <table class="manifest-table" data-testid="EvidenceManifestTable">
                      <thead>
                        <tr><th>Evidence</th><th>Row</th><th>Kind</th><th>Owner</th></tr>
                      </thead>
                      <tbody id="manifest-table-body"></tbody>
                    </table>
                  </section>

                  <section class="panel" data-testid="RiskAndConstraintPanel">
                    <div class="region-header">
                      <h2>Risk and constraints</h2>
                      <p class="muted">These are the explicit reasons the exit is constrained rather than live-ready.</p>
                    </div>
                    <div class="constraint-list" id="constraint-list"></div>
                  </section>
                </div>
              </div>

              <div class="lower-zone">
                <section class="panel span-5" data-testid="CarryForwardBoundaryMap">
                  <div class="region-header">
                    <h2>Carry-forward boundary map</h2>
                    <p class="muted">Phase 3 closes here. Phase 4 and live-later work continue from explicit published seams.</p>
                  </div>
                  <div class="boundary-grid" data-testid="CarryForwardBoundaryDiagram"></div>
                  <table class="boundary-table" data-testid="CarryForwardBoundaryTable">
                    <thead>
                      <tr><th>Owner</th><th>Item</th><th>Category</th><th>Risk</th></tr>
                    </thead>
                    <tbody id="boundary-table-body"></tbody>
                  </table>
                </section>

                <section class="panel span-4" data-testid="DecisionLedger">
                  <div class="region-header">
                    <h2>Decision ledger</h2>
                    <p class="muted">The mandatory gate questions answered directly.</p>
                  </div>
                  <div class="ledger-list" id="decision-ledger-list"></div>
                </section>

                <section class="panel span-3" data-testid="BoundarySummaryPanel">
                  <div class="region-header">
                    <h2>Clinical beta and live-later boundary</h2>
                    <p class="muted">What is approved now, what remains phase-gated, and what is explicitly withheld.</p>
                  </div>
                  <div class="boundary-card" id="boundary-summary-card"></div>
                </section>
              </div>
            </main>

            <script>
              const ROOT = document.querySelector("[data-testid='Phase3ExitBoard']");
              const DATA_BASE = "../../data/analysis";
              const SUITE_BASE = "../../data/test";
              const params = new URLSearchParams(window.location.search);
              const previewVerdict = params.get("previewVerdict");
              const allowedPreviews = new Set(["approved", "go_with_constraints", "withheld"]);

              const verdictMeta = {{
                approved: {{
                  title: "Approved",
                  tone: "approved",
                  summary:
                    "Preview posture only. Use this to review the fully approved visual state. The current repository verdict remains whatever the decision file publishes.",
                }},
                go_with_constraints: {{
                  title: "Go with constraints",
                  tone: "go_with_constraints",
                  summary:
                    "Current repository posture when the decision file says constraints remain explicit and non-blocking for the Phase 4 entry boundary.",
                }},
                withheld: {{
                  title: "Withheld",
                  tone: "withheld",
                  summary:
                    "Preview posture only. Use this to review the fail-closed withheld visual state. The current repository verdict remains whatever the decision file publishes.",
                }},
              }};

              function escapeHtml(value) {{
                return String(value)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#39;");
              }}

              function toRepoHref(repoRoot, absolutePath) {{
                if (!absolutePath || typeof absolutePath !== "string") {{
                  return "#";
                }}
                if (absolutePath.startsWith(repoRoot)) {{
                  return absolutePath.slice(repoRoot.length) || "/";
                }}
                return absolutePath;
              }}

              function parseCsv(text) {{
                const lines = text.trim().split(/\\r?\\n/).filter(Boolean);
                if (!lines.length) {{
                  return [];
                }}
                const headers = lines[0].split(",");
                return lines.slice(1).map((line) => {{
                  const values = line.split(",");
                  const record = {{}};
                  headers.forEach((header, index) => {{
                    record[header] = values[index] ?? "";
                  }});
                  return record;
                }});
              }}

              function setSearchParam(name, value) {{
                const next = new URL(window.location.href);
                if (value) {{
                  next.searchParams.set(name, value);
                }} else {{
                  next.searchParams.delete(name);
                }}
                window.location.href = next.toString();
              }}

              function renderVerdict(decision, rows) {{
                const activeVerdict = allowedPreviews.has(previewVerdict) ? previewVerdict : decision.verdict;
                const actualVerdictMeta = verdictMeta[decision.verdict];
                const activeMeta = verdictMeta[activeVerdict];
                ROOT.dataset.currentVerdict = decision.verdict;
                ROOT.dataset.activeVerdict = activeVerdict;
                ROOT.dataset.previewMode = String(activeVerdict !== decision.verdict);
                ROOT.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduce" : "no-preference";

                const title = document.getElementById("verdict-title");
                const summary = document.getElementById("verdict-summary");
                const chipRow = document.getElementById("verdict-chip-row");
                const controls = document.querySelector("[data-testid='VerdictScenarioControls']");
                const verdictBand = document.querySelector("[data-testid='VerdictBand']");

                verdictBand.dataset.verdict = activeVerdict;
                title.textContent = activeVerdict === decision.verdict
                  ? `Phase 3 verdict: ${{actualVerdictMeta.title}}`
                  : `Preview posture: ${{activeMeta.title}}`;

                summary.textContent = activeVerdict === decision.verdict
                  ? decision.decisionStatement
                  : activeMeta.summary;

                chipRow.innerHTML = `
                  <span class="chip" data-tone="${{actualVerdictMeta.tone}}">Current verdict: ${{actualVerdictMeta.title}}</span>
                  <span class="chip" data-tone="approved">Phase 4 entry: ${{decision.phase4EntryVerdict}}</span>
                  <span class="chip" data-tone="approved">Clinical beta: ${{decision.clinicalBetaVerdict}}</span>
                  <span class="chip" data-tone="withheld">Live-provider rollout: ${{decision.liveProviderRolloutVerdict}}</span>
                  <span class="chip" data-tone="evidence">${{decision.scorecardSummary.rowCount}} scorecard rows</span>
                  <span class="chip" data-tone="evidence">${{rows.length}} capability families traced</span>
                  ${{activeVerdict !== decision.verdict ? '<span class="chip" data-tone="evidence">Preview only</span>' : ''}}
                `;

                controls.innerHTML = [
                  ["", "Current"],
                  ["approved", "Approved"],
                  ["go_with_constraints", "Go with constraints"],
                  ["withheld", "Withheld"],
                ].map(([value, label]) => `
                  <button
                    type="button"
                    class="preview-button"
                    data-preview="${{value || 'current'}}"
                    data-active="${{(!value && activeVerdict === decision.verdict) || value === activeVerdict}}"
                    aria-pressed="${{(!value && activeVerdict === decision.verdict) || value === activeVerdict}}"
                  >${{label}}</button>
                `).join("");

                controls.querySelectorAll(".preview-button").forEach((button) => {{
                  button.addEventListener("click", () => {{
                    const value = button.getAttribute("data-preview");
                    setSearchParam("previewVerdict", value === "current" ? "" : value);
                  }});
                }});
              }}

              function renderPhaseBraid(decision) {{
                const diagram = document.querySelector("[data-testid='PhaseBraidDiagram']");
                const tableBody = document.querySelector("[data-testid='PhaseBraidTable'] tbody");
                diagram.innerHTML = decision.phaseBraid.map((phase) => `
                  <article class="phase-node" data-status="${{phase.status}}">
                    <strong>${{phase.phaseId}}</strong>
                    <span>${{phase.label}}</span>
                    <span class="chip" data-tone="${{phase.status}}">${{phase.status.replaceAll("_", " ")}}</span>
                  </article>
                `).join("");
                tableBody.innerHTML = decision.phaseBraid.map((phase) => `
                  <tr>
                    <td>${{phase.phaseId}}</td>
                    <td>${{phase.label}}</td>
                    <td><span class="chip" data-tone="${{phase.status}}">${{phase.status.replaceAll("_", " ")}}</span></td>
                  </tr>
                `).join("");
              }}

              function renderScorecard(decision, rows) {{
                const summaryRow = document.getElementById("scorecard-summary-row");
                const ladder = document.getElementById("scorecard-ladder");
                summaryRow.innerHTML = `
                  <span class="chip" data-tone="approved">${{decision.scorecardSummary.approvedCount}} approved</span>
                  <span class="chip" data-tone="go_with_constraints">${{decision.scorecardSummary.goWithConstraintsCount}} constrained</span>
                  <span class="chip" data-tone="withheld">${{decision.scorecardSummary.withheldCount}} withheld</span>
                  <span class="chip" data-tone="evidence">${{decision.scorecardSummary.deferredNonBlockingCount}} deferred non-blocking</span>
                `;

                ladder.innerHTML = rows.map((row) => `
                  <details class="scorecard-row" data-row-id="${{row.rowId}}" open>
                    <summary>
                      <div class="summary-head">
                        <div>
                          <strong>${{row.capabilityFamily}}</strong>
                          <div class="row-meta">
                            <span class="chip" data-tone="${{row.status}}">${{row.status.replaceAll("_", " ")}}</span>
                            <span class="chip" data-tone="evidence">${{row.proofMode}}</span>
                            <span class="chip">${{row.phaseBraidRefs.join(" · ")}}</span>
                          </div>
                        </div>
                        <span class="chip">${{row.rowId}}</span>
                      </div>
                      <div class="summary-body">${{escapeHtml(row.summary)}}</div>
                    </summary>
                    <div class="scorecard-detail">
                      <div class="detail-grid">
                        <div>
                          <h3>Source sections</h3>
                          <ul class="detail-list">
                            ${{row.sourceSections.map((entry) => `<li>${{escapeHtml(entry)}}</li>`).join("")}}
                          </ul>
                        </div>
                        <div>
                          <h3>Owning tasks</h3>
                          <ul class="detail-list">
                            ${{row.owningTasks.map((entry) => `<li>${{escapeHtml(entry)}}</li>`).join("")}}
                          </ul>
                        </div>
                      </div>
                      <div class="detail-grid">
                        <div>
                          <h3>Implementation evidence</h3>
                          <ul class="detail-list">
                            ${{row.implementationEvidence.map((entry) => `<li><a href="${{toRepoHref(decision.repoRoot, entry)}}" target="_blank" rel="noreferrer">${{escapeHtml(entry.split("/").slice(-1)[0])}}</a></li>`).join("")}}
                          </ul>
                        </div>
                        <div>
                          <h3>Automated proof</h3>
                          <ul class="detail-list">
                            ${{row.automatedProofArtifacts.map((entry) => `<li><a href="${{toRepoHref(decision.repoRoot, entry)}}" target="_blank" rel="noreferrer">${{escapeHtml(entry.split("/").slice(-1)[0])}}</a></li>`).join("")}}
                          </ul>
                        </div>
                      </div>
                      <div>
                        <strong>Blocking rationale</strong>
                        <p class="muted">${{escapeHtml(row.blockingRationale || "None")}}</p>
                      </div>
                    </div>
                  </details>
                `).join("");
              }}

              function renderEvidence(decision, suites, manifestRows) {{
                document.getElementById("evidence-kpis").innerHTML = `
                  <div class="kpi"><span class="muted">Decisive suites</span><strong>${{suites.length}}</strong></div>
                  <div class="kpi"><span class="muted">Manifest entries</span><strong>${{manifestRows.length}}</strong></div>
                  <div class="kpi"><span class="muted">Constraint count</span><strong>${{decision.constraints.length}}</strong></div>
                  <div class="kpi"><span class="muted">Generated at</span><strong>${{decision.generatedAt}}</strong></div>
                `;

                document.getElementById("suite-table-body").innerHTML = suites.map((suite) => `
                  <tr>
                    <td>${{suite.taskId}}</td>
                    <td>${{suite.visualMode}}</td>
                    <td><span class="chip" data-tone="approved">${{suite.suiteVerdict}}</span></td>
                    <td>${{escapeHtml(JSON.stringify(suite.summary))}}</td>
                  </tr>
                `).join("");

                document.getElementById("manifest-table-body").innerHTML = manifestRows.slice(0, 12).map((entry) => `
                  <tr>
                    <td><a href="${{toRepoHref(decision.repoRoot, entry.artifactPath)}}" target="_blank" rel="noreferrer">${{escapeHtml(entry.evidenceId)}}</a></td>
                    <td>${{entry.rowId}}</td>
                    <td>${{entry.evidenceKind}}</td>
                    <td>${{entry.ownerTask}}</td>
                  </tr>
                `).join("");
              }}

              function renderConstraints(decision) {{
                document.getElementById("constraint-list").innerHTML = decision.constraints.map((constraint) => `
                  <article class="constraint-card">
                    <div class="chip-row">
                      <span class="chip" data-tone="go_with_constraints">${{constraint.constraintId}}</span>
                      <span class="chip">${{constraint.scope.replaceAll("_", " ")}}</span>
                      <span class="chip" data-tone="evidence">Owner: ${{constraint.ownerTask}}</span>
                    </div>
                    <strong>${{escapeHtml(constraint.summary)}}</strong>
                    <p class="muted">${{escapeHtml(constraint.nextAction)}}</p>
                  </article>
                `).join("");
              }}

              function renderBoundary(decision, openItems) {{
                const grouped = {{
                  phase4_boundary: openItems.filter((item) => item.category === "phase4_boundary"),
                  phase4_execution: openItems.filter((item) => item.category === "phase4_execution"),
                  live_later: openItems.filter((item) => item.category === "live_later"),
                }};
                document.querySelector("[data-testid='CarryForwardBoundaryDiagram']").innerHTML = [
                  ["Phase 3 closed truth", grouped.phase4_boundary],
                  ["Phase 4 implementation", grouped.phase4_execution],
                  ["Live-later onboarding", grouped.live_later],
                ].map(([label, items]) => `
                  <article class="boundary-card">
                    <strong>${{label}}</strong>
                    <ul class="detail-list">
                      ${{items.map((item) => `<li>${{escapeHtml(item.ownerTask)}} · ${{escapeHtml(item.title)}}</li>`).join("")}}
                    </ul>
                  </article>
                `).join("");

                document.getElementById("boundary-table-body").innerHTML = openItems.map((item) => `
                  <tr>
                    <td>${{item.ownerTask}}</td>
                    <td>${{escapeHtml(item.title)}}</td>
                    <td>${{item.category.replaceAll("_", " ")}}</td>
                    <td>${{escapeHtml(item.risk)}}</td>
                  </tr>
                `).join("");

                document.getElementById("boundary-summary-card").innerHTML = `
                  <p><strong>Approved now</strong></p>
                  <p class="muted">Human Checkpoint completion, clinical beta continuation, and Phase 4 freeze-task entry.</p>
                  <p><strong>Withheld now</strong></p>
                  <p class="muted">Live-provider rollout, live control-plane claims, and any claim that BookingIntent seeds mean the Booking Engine already exists.</p>
                `;
              }}

              function renderLedger(decision) {{
                document.getElementById("decision-ledger-list").innerHTML = decision.mandatoryQuestions.map((entry) => `
                  <article class="ledger-card">
                    <div class="chip-row">
                      <span class="chip">${{entry.questionId}}</span>
                      <span class="chip" data-tone="${{entry.answerStatus === 'approved' ? 'approved' : 'go_with_constraints'}}">${{entry.answerStatus.replaceAll("_", " ")}}</span>
                    </div>
                    <strong>${{escapeHtml(entry.question)}}</strong>
                    <p class="muted">${{escapeHtml(entry.answer)}}</p>
                  </article>
                `).join("");
              }}

              Promise.all([
                fetch(`${{DATA_BASE}}/277_phase3_exit_gate_decision.json`).then((response) => response.json()),
                fetch(`${{DATA_BASE}}/277_phase3_conformance_rows.json`).then((response) => response.json()),
                fetch(`${{DATA_BASE}}/277_phase3_open_items_and_phase4_carry_forward.json`).then((response) => response.json()),
                fetch(`${{DATA_BASE}}/277_phase3_evidence_manifest.csv`).then((response) => response.text()),
              ]).then(([decision, rows, openItems, manifestText]) => {{
                const manifestRows = parseCsv(manifestText);
                renderVerdict(decision, rows);
                renderPhaseBraid(decision);
                renderScorecard(decision, rows);
                renderEvidence(decision, decision.decisiveSuites, manifestRows);
                renderConstraints(decision);
                renderBoundary(decision, openItems);
                renderLedger(decision);
              }}).catch((error) => {{
                document.getElementById("verdict-title").textContent = "Failed to load Phase 3 exit board";
                document.getElementById("verdict-summary").textContent = String(error);
              }});
            </script>
          </body>
        </html>
        """
    ).strip()


def main() -> None:
    write_json("data/analysis/277_visual_reference_notes.json", VISUAL_REFERENCE_NOTES)
    write_json("data/analysis/277_phase3_conformance_rows.json", ROWS)
    write_json("data/analysis/277_phase3_exit_gate_decision.json", DECISION)
    write_json("data/analysis/277_phase3_invariant_proof_map.json", INVARIANT_PROOF_MAP)
    write_json("data/analysis/277_phase3_open_items_and_phase4_carry_forward.json", OPEN_ITEMS)
    write_csv(
        "data/analysis/277_phase3_evidence_manifest.csv",
        EVIDENCE_MANIFEST,
        [
            "evidenceId",
            "rowId",
            "evidenceKind",
            "artifactPath",
            "sourceSection",
            "ownerTask",
            "proofMode",
            "freshnessState",
            "notes",
        ],
    )

    write_text("docs/governance/277_phase3_exit_gate_pack.md", render_pack_markdown())
    write_text("docs/governance/277_phase3_go_no_go_decision.md", render_go_no_go_markdown())
    write_text("docs/governance/277_phase3_conformance_scorecard.md", render_scorecard_markdown())
    write_text("docs/governance/277_phase3_to_phase4_boundary.md", render_boundary_markdown())
    write_text(
        "docs/governance/277_phase3_clinical_beta_and_live_later_boundary.md",
        render_beta_boundary_markdown(),
    )
    write_text("docs/frontend/277_phase3_exit_board.html", render_board_html())


if __name__ == "__main__":
    main()
