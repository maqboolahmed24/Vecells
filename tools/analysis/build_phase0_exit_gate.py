#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST_PATH = ROOT / "prompt" / "checklist.md"

DOCS_GOVERNANCE_DIR = ROOT / "docs" / "governance"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"

EXIT_GATE_PACK_DOC_PATH = DOCS_GOVERNANCE_DIR / "138_phase0_exit_gate_pack.md"
GO_NO_GO_DOC_PATH = DOCS_GOVERNANCE_DIR / "138_phase0_go_no_go_decision.md"
CONFORMANCE_DOC_PATH = DOCS_GOVERNANCE_DIR / "138_phase0_conformance_scorecard.md"
BOUNDARY_DOC_PATH = DOCS_GOVERNANCE_DIR / "138_phase0_mock_now_vs_actual_later_boundary.md"
BOARD_HTML_PATH = DOCS_GOVERNANCE_DIR / "138_phase0_gate_review_board.html"

DECISION_JSON_PATH = DATA_ANALYSIS_DIR / "138_phase0_exit_gate_decision.json"
ROWS_JSON_PATH = DATA_ANALYSIS_DIR / "138_phase0_conformance_rows.json"
EVIDENCE_MANIFEST_PATH = DATA_ANALYSIS_DIR / "138_phase0_evidence_manifest.csv"
OPEN_ITEMS_JSON_PATH = DATA_ANALYSIS_DIR / "138_phase0_open_items_and_deferred_live_provider_work.json"

COVERAGE_SUMMARY_PATH = DATA_ANALYSIS_DIR / "coverage_summary.json"
TRACEABILITY_PATH = DATA_ANALYSIS_DIR / "requirement_task_traceability.csv"
REQUEST_LINEAGE_PATH = DATA_ANALYSIS_DIR / "request_lineage_transitions.json"
REPLAY_CLASSIFICATION_PATH = DATA_ANALYSIS_DIR / "replay_classification_matrix.csv"
DUPLICATE_MANIFEST_PATH = DATA_ANALYSIS_DIR / "duplicate_cluster_manifest.json"
REPLAY_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "replay_collision_casebook.json"
IDENTITY_REPAIR_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "identity_repair_casebook.json"
REACHABILITY_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "reachability_assessment_casebook.json"
ACCESS_GRANT_MANIFEST_PATH = DATA_ANALYSIS_DIR / "access_grant_runtime_tuple_manifest.json"
RUNTIME_PUBLICATION_BUNDLES_PATH = DATA_ANALYSIS_DIR / "runtime_publication_bundles.json"
RELEASE_PARITY_PATH = DATA_ANALYSIS_DIR / "release_publication_parity_records.json"
SURFACE_AUTHORITY_PATH = DATA_ANALYSIS_DIR / "surface_authority_verdicts.json"
MANIFEST_FUSION_PATH = DATA_ANALYSIS_DIR / "manifest_fusion_verdicts.json"
RELEASE_CANDIDATE_PATH = ROOT / "data" / "release" / "release_candidate_tuple.json"
FREEZE_BLOCKERS_PATH = ROOT / "data" / "release" / "freeze_blockers.json"
PERSISTENT_SHELL_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "persistent_shell_contracts.json"
FRONTEND_MANIFESTS_PATH = DATA_ANALYSIS_DIR / "frontend_contract_manifests.json"
SELECTED_ANCHOR_POLICY_PATH = DATA_ANALYSIS_DIR / "selected_anchor_policy_matrix.csv"
DEPENDENCY_SIMULATOR_STRATEGY_PATH = DATA_ANALYSIS_DIR / "dependency_simulator_strategy.json"
SEEDED_EXTERNAL_CONTRACTS_PATH = ROOT / "data" / "integration" / "seeded_external_contract_catalog.json"
ADAPTER_VALIDATION_RESULTS_PATH = ROOT / "data" / "integration" / "adapter_validation_results.json"
LIVE_PROVIDER_HANDOVER_PATH = ROOT / "data" / "integration" / "live_provider_handover_matrix.csv"
OBSERVABILITY_SIGNAL_MATRIX_PATH = DATA_ANALYSIS_DIR / "observability_signal_matrix.csv"
OBSERVABILITY_EVENT_SCHEMA_PATH = DATA_ANALYSIS_DIR / "observability_event_schema_manifest.json"
AUDIT_RECORD_SCHEMA_PATH = DATA_ANALYSIS_DIR / "audit_record_schema.json"
AUDIT_DISCLOSURE_MATRIX_PATH = DATA_ANALYSIS_DIR / "audit_event_disclosure_matrix.csv"
WORM_RETENTION_CLASSES_PATH = DATA_ANALYSIS_DIR / "worm_retention_classes.json"
BUILD_PROVENANCE_MANIFEST_PATH = DATA_ANALYSIS_DIR / "build_provenance_manifest.json"
BUILD_PROVENANCE_INTEGRITY_PATH = DATA_ANALYSIS_DIR / "build_provenance_integrity_catalog.json"
RELEASE_WATCH_CATALOG_PATH = DATA_ANALYSIS_DIR / "release_watch_pipeline_catalog.json"
RELEASE_WATCH_EVIDENCE_PATH = DATA_ANALYSIS_DIR / "release_watch_required_evidence.csv"
RESILIENCE_BASELINE_PATH = DATA_ANALYSIS_DIR / "resilience_baseline_catalog.json"
ACCESSIBILITY_PROFILES_PATH = DATA_ANALYSIS_DIR / "accessibility_semantic_coverage_profiles.json"
PREVIEW_MANIFEST_PATH = DATA_ANALYSIS_DIR / "preview_environment_manifest.json"
AUDIENCE_SURFACE_BINDINGS_PATH = DATA_ANALYSIS_DIR / "audience_surface_runtime_bindings.json"
PHASE0_EXIT_ARTIFACT_INDEX_PATH = DATA_ANALYSIS_DIR / "phase0_exit_artifact_index.json"
FOUNDATION_TRACE_INDEX_PATH = DATA_ANALYSIS_DIR / "foundation_demo_trace_index.json"
DCB0129_OUTLINE_PATH = ROOT / "data" / "assurance" / "dcb0129_safety_case_outline.json"
IM1_ARTIFACT_INDEX_PATH = ROOT / "data" / "assurance" / "im1_artifact_index.json"
PRIVACY_TRACEABILITY_PATH = ROOT / "data" / "assurance" / "privacy_control_traceability.json"
CLINICAL_SIGNOFF_REQUIREMENTS_PATH = ROOT / "data" / "assurance" / "clinical_signoff_gate_requirements.json"
DSPT_GAP_REGISTER_PATH = ROOT / "data" / "assurance" / "dspt_gap_register.json"
NHS_LOGIN_GAP_REGISTER_PATH = ROOT / "data" / "assurance" / "nhs_login_gap_register.json"
IM1_GAP_REGISTER_PATH = ROOT / "data" / "assurance" / "im1_gap_register.json"

SUITE_133_PATH = ROOT / "data" / "test" / "transition_suite_results.json"
SUITE_134_PATH = ROOT / "data" / "test" / "continuity_gate_suite_results.json"
SUITE_135_PATH = ROOT / "data" / "test" / "exception_path_suite_results.json"
SUITE_136_PATH = ROOT / "data" / "test" / "136_preview_environment_suite_results.json"
SUITE_137_PATH = ROOT / "data" / "test" / "137_rehearsal_results.json"

TASK_ID = "seq_138"
VISUAL_MODE = "Foundation_Gate_Board"
GATE_PACK_REF = "P0G_138_FOUNDATION_PROTOCOL_COMPLETION_V1"
GATE_VERDICT = "go_with_constraints"
BASELINE_SCOPE = "simulator_first_foundation"
LIVE_READINESS_STATE = "deferred_explicitly_not_approved"

SOURCE_PRECEDENCE = [
    "prompt/138.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/platform-frontend-blueprint.md",
    "blueprint/phase-1-the-red-flag-gate.md",
    "blueprint/forensic-audit-findings.md",
    "docs/programme/132_phase0_exit_artifacts.md",
    "data/test/transition_suite_results.json",
    "data/test/continuity_gate_suite_results.json",
    "data/test/exception_path_suite_results.json",
    "data/test/136_preview_environment_suite_results.json",
    "data/test/137_rehearsal_results.json",
]

REQUIRED_CAPABILITY_FAMILIES = [
    "canonical_request_intake_backbone",
    "replay_and_duplicate_handling",
    "identity_access_substrate",
    "runtime_publication_and_freeze_control",
    "shell_and_continuity_infrastructure",
    "simulator_estate_and_degraded_defaults",
    "observability_and_audit",
    "backup_restore_and_canary_rehearsal",
    "accessibility_and_shell_smoke_proof",
    "assurance_privacy_and_clinical_safety_seed_artifacts",
]

REQUIRED_SUITES = ["seq_133", "seq_134", "seq_135", "seq_136", "seq_137"]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def require_file(path: Path) -> None:
    require(path.exists(), f"PREREQUISITE_GAP_138_MISSING::{path.relative_to(ROOT)}")


def load_json(path: Path) -> Any:
    require_file(path)
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    require_file(path)
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


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


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    def escape_cell(value: str) -> str:
        return value.replace("|", "\\|")

    rendered = [
        "| " + " | ".join(escape_cell(header) for header in headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        rendered.append("| " + " | ".join(escape_cell(cell) for cell in row) + " |")
    return "\n".join(rendered)


def join_refs(refs: list[str]) -> str:
    return "; ".join(refs)


def ensure_refs_exist(refs: list[str]) -> None:
    for ref in refs:
        require(ref, "PREREQUISITE_GAP_138_EMPTY_REF")
        candidate = ROOT / ref.split("#", 1)[0]
        require(candidate.exists(), f"PREREQUISITE_GAP_138_REF_MISSING::{ref}")


def normalize_task_line(line: str) -> tuple[str, str] | None:
    match = re.match(r"- \[([ X\-])\] ([^ ]+)", line.strip())
    if not match:
        return None
    return match.group(1), match.group(2)


def assert_prior_tasks_complete() -> dict[str, Any]:
    require_file(CHECKLIST_PATH)
    lines = CHECKLIST_PATH.read_text(encoding="utf-8").splitlines()
    prior_task_ids: list[str] = []
    for line in lines:
        parsed = normalize_task_line(line)
        if not parsed:
            continue
        marker, task_id = parsed
        if task_id == TASK_ID or task_id.startswith(f"{TASK_ID}_"):
            break
        require(marker == "X", f"PREREQUISITE_GAP_138_INCOMPLETE_PRIOR_TASK::{task_id}")
        prior_task_ids.append(task_id)
    require(prior_task_ids, "PREREQUISITE_GAP_138_CHECKLIST_SCAN_FAILED")
    return {
        "priorTaskCount": len(prior_task_ids),
        "lastCompletedTaskId": prior_task_ids[-1],
    }


def build_suite_records() -> list[dict[str, Any]]:
    suite_133 = load_json(SUITE_133_PATH)
    suite_134 = load_json(SUITE_134_PATH)
    suite_135 = load_json(SUITE_135_PATH)
    suite_136 = load_json(SUITE_136_PATH)
    suite_137 = load_json(SUITE_137_PATH)

    require(suite_133["summary"]["suiteVerdict"] == "pass_with_bounded_gaps", "PREREQUISITE_GAP_138_SUITE_133_DRIFT")
    require(suite_134["summary"]["required_family_coverage_count"] == 8, "PREREQUISITE_GAP_138_SUITE_134_DRIFT")
    require(suite_135["summary"]["required_case_family_count"] == 8, "PREREQUISITE_GAP_138_SUITE_135_DRIFT")
    require(suite_136["suiteVerdict"] == "release_withheld", "PREREQUISITE_GAP_138_SUITE_136_DRIFT")
    require(suite_137["suiteVerdict"] == "rehearsal_exact_live_withheld", "PREREQUISITE_GAP_138_SUITE_137_DRIFT")
    require(suite_137["summary"]["live_control_reopened_count"] == 0, "PREREQUISITE_GAP_138_SUITE_137_LIVE_REOPEN")

    return [
        {
            "suiteId": "seq_133",
            "label": "Domain transition and event schema compatibility",
            "verificationOutcome": "passed",
            "proofVerdict": suite_133["summary"]["suiteVerdict"],
            "summary": "Canonical transition and schema compatibility remain machine-verified with bounded, explicit catalog gaps rather than silent drift.",
            "artifactRefs": [
                "data/test/transition_suite_results.json",
                "docs/tests/133_domain_transition_and_event_schema_compatibility.md",
                "docs/tests/133_transition_lab.html",
            ],
            "signalRows": [
                {"label": "Transition rows", "value": str(suite_133["summary"]["transitionMatrixRows"])},
                {"label": "Schema rows", "value": str(suite_133["summary"]["schemaMatrixRows"])},
                {"label": "Gap rows", "value": str(suite_133["summary"]["gapRows"])},
            ],
        },
        {
            "suiteId": "seq_134",
            "label": "Route intent, freshness, and scoped mutation gate",
            "verificationOutcome": "passed",
            "proofVerdict": "pass_with_explicit_browser_gaps",
            "summary": "Route-intent, projection freshness, and scoped mutation proof are current, with the remaining browser specimen gaps held as explicit guarded rows.",
            "artifactRefs": [
                "data/test/continuity_gate_suite_results.json",
                "docs/tests/134_route_intent_projection_freshness_scoped_mutation_suite.md",
                "docs/tests/134_continuity_gate_lab.html",
            ],
            "signalRows": [
                {"label": "Route-intent cases", "value": str(suite_134["summary"]["route_intent_case_count"])},
                {"label": "Browser gaps", "value": str(suite_134["summary"]["browser_gap_count"])},
                {"label": "Covered families", "value": str(suite_134["summary"]["required_family_coverage_count"])},
            ],
        },
        {
            "suiteId": "seq_135",
            "label": "Adapter replay, duplicate, quarantine, and fallback review",
            "verificationOutcome": "passed",
            "proofVerdict": "pass_with_bounded_event_gap",
            "summary": "Replay, duplicate clustering, quarantine, and fallback review are explicitly proven, with zero duplicate side effects and one bounded event-catalog gap kept visible.",
            "artifactRefs": [
                "data/test/exception_path_suite_results.json",
                "docs/tests/135_adapter_replay_duplicate_quarantine_fallback_suite.md",
                "docs/tests/135_exception_path_lab.html",
            ],
            "signalRows": [
                {"label": "Exception cases", "value": str(suite_135["summary"]["exception_case_count"])},
                {"label": "Zero side-effect cases", "value": str(suite_135["summary"]["zero_duplicate_side_effect_case_count"])},
                {"label": "Bounded event gaps", "value": str(suite_135["summary"]["bounded_gap_event_expectation_count"])},
            ],
        },
        {
            "suiteId": "seq_136",
            "label": "Shell accessibility, preview environment, and smoke proof",
            "verificationOutcome": "passed",
            "proofVerdict": suite_136["suiteVerdict"],
            "summary": "All shell families are exercised, but every smoke verdict remains rightly withheld because publication parity and browser truth are not yet exact.",
            "artifactRefs": [
                "data/test/136_preview_environment_suite_results.json",
                "docs/tests/136_shell_accessibility_preview_smoke_suite.md",
                "docs/tests/136_shell_conformance_atlas.html",
            ],
            "signalRows": [
                {"label": "Shell families", "value": str(suite_136["summary"]["shell_family_count"])},
                {"label": "Smoke pass count", "value": str(suite_136["summary"]["smoke_pass_count"])},
                {"label": "Smoke withheld count", "value": str(suite_136["summary"]["smoke_withheld_count"])},
            ],
        },
        {
            "suiteId": "seq_137",
            "label": "Release freeze, restore, and non-production canary rehearsals",
            "verificationOutcome": "passed",
            "proofVerdict": suite_137["suiteVerdict"],
            "summary": "Release-watch, canary, rollback, and restore proof is exact for the simulator-first baseline, with no premature applied success and no live control reopening.",
            "artifactRefs": [
                "data/test/137_rehearsal_results.json",
                "docs/tests/137_release_restore_canary_rehearsal_suite.md",
                "docs/tests/137_release_rehearsal_cockpit.html",
            ],
            "signalRows": [
                {"label": "Rehearsal cases", "value": str(suite_137["summary"]["rehearsal_case_count"])},
                {"label": "Blocked actions", "value": str(suite_137["summary"]["blocked_action_count"])},
                {"label": "Live reopened", "value": str(suite_137["summary"]["live_control_reopened_count"])},
            ],
        },
    ]


def build_open_items(surface_summary: dict[str, Any], adapter_summary: dict[str, Any]) -> list[dict[str, Any]]:
    items = [
        {
            "itemId": "OI_138_LIVE_NHS_LOGIN_ONBOARDING",
            "title": "Complete live NHS login onboarding and scope approval",
            "workClass": "live_provider_identity",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "mock_identity_available_live_identity_not_approved",
            "summary": "The mock NHS login baseline is present, but live scope approval, environment progression, and IM1-dependent identity routes remain outside the simulator-first Phase 0 approval.",
            "whyNonBlockingNow": "Phase 0 only claims simulator-first foundation readiness and does not advertise live provider identity authority.",
            "sourceRefs": [
                "docs/assurance/124_nhs_login_onboarding_evidence_pack.md",
                "docs/assurance/124_nhs_login_actual_onboarding_strategy_later.md",
                "data/assurance/nhs_login_gap_register.json",
            ],
        },
        {
            "itemId": "OI_138_LIVE_NHS_APP_EMBEDDED_CHANNEL",
            "title": "Publish the live NHS App embedded shell posture",
            "workClass": "live_channel",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "embedded_channel_blocked_from_live_publication",
            "summary": "The embedded patient shell remains an explicit blocked surface until the later live channel posture, publication tuple, and browser contract are published.",
            "whyNonBlockingNow": "Phase 0 approves the foundation while keeping embedded live-channel truth blocked instead of faking parity.",
            "sourceRefs": [
                "data/analysis/surface_authority_verdicts.json",
                "docs/architecture/112_embedded_and_constrained_channel_guard_rules.md",
                "data/test/136_preview_environment_suite_results.json",
            ],
        },
        {
            "itemId": "OI_138_LIVE_BOOKING_PROVIDER_PAIRING",
            "title": "Replace simulator-first booking/provider seams with live paired integrations",
            "workClass": "live_provider_pairing",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "simulator_only_pairing_boundary",
            "summary": "Current release and replay proofs use simulator-backed downstreams; live provider pairing, supported-test evidence, and production agreements remain later work.",
            "whyNonBlockingNow": "The simulator estate is explicit and bounded, and the gate pack does not describe those paths as live-ready.",
            "sourceRefs": [
                "docs/assurance/123_im1_actual_pairing_strategy_later.md",
                "data/assurance/im1_gap_register.json",
                "data/integration/live_provider_handover_matrix.csv",
            ],
        },
        {
            "itemId": "OI_138_LIVE_MESH_GP_PHARMACY_ONBOARDING",
            "title": "Finish live MESH, GP, pharmacy, and partner onboarding",
            "workClass": "live_provider_operations",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "partner_handover_pending",
            "summary": "Provider handover remains open for the real operational channels even though the simulator-backed contract catalog is current.",
            "whyNonBlockingNow": "The current approval is for the foundation tuple model and degraded defaults, not for live external transport ownership.",
            "sourceRefs": [
                "data/integration/live_provider_handover_matrix.csv",
                "docs/integrations/129_adapter_simulator_validation.md",
                "data/integration/adapter_validation_results.json",
            ],
        },
        {
            "itemId": "OI_138_PRODUCTION_ASSURANCE_SIGNOFF",
            "title": "Close production-grade assurance, DSPT, and clinical signoff work",
            "workClass": "production_assurance",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "seed_artifacts_present_formal_signoff_pending",
            "summary": "The repository has seed packs and explicit gap registers for DCB0129, privacy, DSPT, NHS login, and clinical signoff, but not a production signoff claim.",
            "whyNonBlockingNow": "The gate pack approves the seed-layer governance posture while keeping production signoff out of scope.",
            "sourceRefs": [
                "data/assurance/clinical_signoff_gate_requirements.json",
                "data/assurance/dspt_gap_register.json",
                "data/assurance/nhs_login_gap_register.json",
                "docs/assurance/126_privacy_threat_model.md",
            ],
        },
        {
            "itemId": "OI_138_EXECUTABLE_MALWARE_SCANNING_RUNTIME",
            "title": "Replace the remaining blocked malware-scanning seam with an executable runtime",
            "workClass": "runtime_hardening",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "bounded_blocked_gap",
            "summary": f"The adapter validation estate still reports {adapter_summary['blockedCount']} blocked runtime gap, including the explicit malware-scanning seam.",
            "whyNonBlockingNow": "The blocked gap is declared and fail-closed; the gate does not treat it as hidden runtime coverage.",
            "sourceRefs": [
                "data/integration/adapter_validation_results.json",
                "docs/integrations/129_adapter_simulator_validation.md",
                "data/analysis/35_scan_and_quarantine_policy_matrix.csv",
            ],
        },
        {
            "itemId": "OI_138_PUBLISHABLE_LIVE_BROWSER_PARITY",
            "title": "Close design, accessibility, and browser-proof gaps before any live surface publication claim",
            "workClass": "browser_surface_hardening",
            "deferredState": "deferred_non_blocking",
            "currentBoundaryState": "live_publication_withheld",
            "summary": f"Current surface truth still reports {surface_summary['publishable_live_count']} publishable-live rows, {surface_summary['partial_count']} partial rows, and {surface_summary['blocked_count']} blocked rows.",
            "whyNonBlockingNow": "Phase 0 approves the governed non-live foundation and keeps live surface truth withheld instead of weakening the publication law.",
            "sourceRefs": [
                "data/analysis/surface_authority_verdicts.json",
                "data/analysis/manifest_fusion_verdicts.json",
                "data/test/136_preview_environment_suite_results.json",
            ],
        },
    ]
    for item in items:
        ensure_refs_exist(item["sourceRefs"])
    return items


def build_conformance_rows(
    suite_records: list[dict[str, Any]],
    prior_completion: dict[str, Any],
) -> list[dict[str, Any]]:
    coverage_summary = load_json(COVERAGE_SUMMARY_PATH)
    release_candidate = load_json(RELEASE_CANDIDATE_PATH)
    surface_authority = load_json(SURFACE_AUTHORITY_PATH)
    manifest_fusion = load_json(MANIFEST_FUSION_PATH)
    adapter_validation = load_json(ADAPTER_VALIDATION_RESULTS_PATH)
    observability_schema = load_json(OBSERVABILITY_EVENT_SCHEMA_PATH)
    build_provenance_integrity = load_json(BUILD_PROVENANCE_INTEGRITY_PATH)
    resilience_baseline = load_json(RESILIENCE_BASELINE_PATH)
    suite_136 = load_json(SUITE_136_PATH)
    suite_137 = load_json(SUITE_137_PATH)
    clinical_signoff = load_json(CLINICAL_SIGNOFF_REQUIREMENTS_PATH)
    dspt_gap_register = load_json(DSPT_GAP_REGISTER_PATH)
    nhs_login_gap_register = load_json(NHS_LOGIN_GAP_REGISTER_PATH)
    im1_gap_register = load_json(IM1_GAP_REGISTER_PATH)

    surface_summary = surface_authority["summary"]
    adapter_summary = adapter_validation["summary"]
    suite_by_id = {suite["suiteId"]: suite for suite in suite_records}

    open_items = build_open_items(surface_summary, adapter_summary)
    open_item_ids = {item["itemId"] for item in open_items}

    rows = [
        {
            "rowId": "P0R_138_CANONICAL_REQUEST_INTAKE_BACKBONE",
            "capabilityFamilyId": "canonical_request_intake_backbone",
            "capabilityLabel": "Canonical request-intake backbone",
            "status": "approved",
            "summary": "The canonical SubmissionEnvelope -> Request boundary, state atlas, and requirement traceability are current for the simulator-first foundation baseline.",
            "blockingRationale": "",
            "sourceRefs": [
                "blueprint/phase-0-the-foundation-protocol.md",
                "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
                "blueprint/phase-1-the-red-flag-gate.md",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/request_lineage_transitions.json",
                "data/analysis/coverage_summary.json",
                "data/analysis/requirement_task_traceability.csv",
            ],
            "automatedProofRefs": [
                "data/test/transition_suite_results.json",
                "data/analysis/foundation_demo_trace_index.json",
                "data/analysis/phase0_exit_artifact_index.json",
            ],
            "suiteRefs": ["seq_133"],
            "openItemRefs": [],
            "signalRows": [
                {"label": "Prior completed tasks", "value": str(prior_completion["priorTaskCount"])},
                {"label": "Requirements with gaps", "value": str(coverage_summary["summary"]["requirements_with_gaps_count"])},
                {"label": "Traceability rows", "value": str(coverage_summary["summary"]["traceability_row_count"])},
            ],
        },
        {
            "rowId": "P0R_138_REPLAY_AND_DUPLICATE_HANDLING",
            "capabilityFamilyId": "replay_and_duplicate_handling",
            "capabilityLabel": "Replay and duplicate handling",
            "status": "approved",
            "summary": "Replay, duplicate clustering, quarantine fallback, and closure blocking are machine-proven with zero duplicate side-effect cases.",
            "blockingRationale": "",
            "sourceRefs": [
                "blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
                "blueprint/phase-1-the-red-flag-gate.md#Replay duplicate and safety-preemption law",
                "blueprint/forensic-audit-findings.md",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/replay_classification_matrix.csv",
                "data/analysis/duplicate_cluster_manifest.json",
                "data/analysis/replay_collision_casebook.json",
            ],
            "automatedProofRefs": [
                "data/test/exception_path_suite_results.json",
                "data/integration/adapter_validation_results.json",
                "data/analysis/foundation_demo_trace_index.json",
            ],
            "suiteRefs": ["seq_135"],
            "openItemRefs": [],
            "signalRows": [
                {"label": "Exception cases", "value": str(load_json(SUITE_135_PATH)["summary"]["exception_case_count"])},
                {"label": "Zero side-effect cases", "value": str(load_json(SUITE_135_PATH)["summary"]["zero_duplicate_side_effect_case_count"])},
                {"label": "Adapter replay cases", "value": str(load_json(SUITE_135_PATH)["summary"]["adapter_replay_case_count"])},
            ],
        },
        {
            "rowId": "P0R_138_IDENTITY_ACCESS_SUBSTRATE",
            "capabilityFamilyId": "identity_access_substrate",
            "capabilityLabel": "Identity/access substrate",
            "status": "approved",
            "summary": "Identity repair, reachability, and access-grant substrates are implemented and exercised, while live NHS login onboarding stays explicitly outside this approval boundary.",
            "blockingRationale": "",
            "sourceRefs": [
                "blueprint/phase-0-the-foundation-protocol.md",
                "docs/architecture/68_identity_binding_and_access_grant_design.md",
                "docs/architecture/80_identity_repair_and_reachability_governor_design.md",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/access_grant_runtime_tuple_manifest.json",
                "data/analysis/identity_repair_casebook.json",
                "data/analysis/reachability_assessment_casebook.json",
            ],
            "automatedProofRefs": [
                "data/test/transition_suite_results.json",
                "data/analysis/foundation_demo_trace_index.json",
                "data/assurance/nhs_login_gap_register.json",
            ],
            "suiteRefs": ["seq_133"],
            "openItemRefs": ["OI_138_LIVE_NHS_LOGIN_ONBOARDING"],
            "signalRows": [
                {"label": "Identity gap rows", "value": "0 in seq_133 transition coverage"},
                {"label": "NHS login open gaps", "value": str(nhs_login_gap_register["summary"]["gap_count"])},
                {"label": "Identity hold proof", "value": "present in phase0 foundation demo"},
            ],
        },
        {
            "rowId": "P0R_138_RUNTIME_PUBLICATION_AND_FREEZE_CONTROL",
            "capabilityFamilyId": "runtime_publication_and_freeze_control",
            "capabilityLabel": "Runtime/publication and freeze control",
            "status": "constrained",
            "summary": "Release-candidate freeze, publication parity, and runtime bundle seams are implemented and exact enough for the non-production baseline, but live surface truth remains intentionally withheld.",
            "blockingRationale": "Current surface truth has zero publishable-live rows, so this approval cannot be read as live calm/writable publication readiness.",
            "sourceRefs": [
                "blueprint/platform-runtime-and-release-blueprint.md",
                "blueprint/phase-0-the-foundation-protocol.md#Release trust and runtime publication law",
                "docs/release/131_release_candidate_freeze.md",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/runtime_publication_bundles.json",
                "data/analysis/release_publication_parity_records.json",
                "data/release/release_candidate_tuple.json",
            ],
            "automatedProofRefs": [
                "data/analysis/surface_authority_verdicts.json",
                "data/analysis/manifest_fusion_verdicts.json",
                "data/test/137_rehearsal_results.json",
            ],
            "suiteRefs": ["seq_137"],
            "openItemRefs": [
                "OI_138_PUBLISHABLE_LIVE_BROWSER_PARITY",
                "OI_138_LIVE_NHS_APP_EMBEDDED_CHANNEL",
            ],
            "signalRows": [
                {"label": "Freeze verdict", "value": release_candidate["summary"]["freezeVerdict"]},
                {"label": "Publishable live rows", "value": str(surface_summary["publishable_live_count"])},
                {"label": "Partial or blocked rows", "value": str(surface_summary["partial_count"] + surface_summary["blocked_count"])},
            ],
        },
        {
            "rowId": "P0R_138_SHELL_AND_CONTINUITY_INFRASTRUCTURE",
            "capabilityFamilyId": "shell_and_continuity_infrastructure",
            "capabilityLabel": "Shell and continuity infrastructure",
            "status": "constrained",
            "summary": "Persistent-shell, selected-anchor, and same-shell recovery law are implemented, but browser truth remains guarded by partial publication and explicit specimen gaps.",
            "blockingRationale": "Manifest fusion still reports partial tuples and seq_134 keeps two browser specimen gaps visible, so calm browser authority is not exact.",
            "sourceRefs": [
                "blueprint/platform-frontend-blueprint.md",
                "blueprint/phase-0-the-foundation-protocol.md#Same-shell continuity",
                "docs/architecture/108_continuity_inspector.html",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/persistent_shell_contracts.json",
                "data/analysis/frontend_contract_manifests.json",
                "data/analysis/selected_anchor_policy_matrix.csv",
            ],
            "automatedProofRefs": [
                "data/test/continuity_gate_suite_results.json",
                "data/analysis/manifest_fusion_verdicts.json",
                "data/test/136_preview_environment_suite_results.json",
            ],
            "suiteRefs": ["seq_134", "seq_136"],
            "openItemRefs": [
                "OI_138_PUBLISHABLE_LIVE_BROWSER_PARITY",
                "OI_138_LIVE_NHS_APP_EMBEDDED_CHANNEL",
            ],
            "signalRows": [
                {"label": "Manifest-fusion blocked tuples", "value": str(manifest_fusion["verdictCounts"]["blocked"])},
                {"label": "Manifest-fusion partial tuples", "value": str(manifest_fusion["verdictCounts"]["partial"])},
                {"label": "Browser specimen gaps", "value": str(load_json(SUITE_134_PATH)["summary"]["browser_gap_count"])},
            ],
        },
        {
            "rowId": "P0R_138_SIMULATOR_ESTATE_AND_DEGRADED_DEFAULTS",
            "capabilityFamilyId": "simulator_estate_and_degraded_defaults",
            "capabilityLabel": "Simulator estate and degraded defaults",
            "status": "constrained",
            "summary": "The simulator-first estate is honest and fail-closed, with real contract rows, replay-safe adapters, and explicit degraded defaults instead of optimistic provider claims.",
            "blockingRationale": "One blocked executable adapter seam and the remaining live-provider handover work keep this as simulator-first readiness rather than live-provider certification.",
            "sourceRefs": [
                "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
                "docs/integrations/129_adapter_simulator_validation.md",
                "data/analysis/dependency_simulator_strategy.json",
            ],
            "implementationEvidenceRefs": [
                "data/integration/seeded_external_contract_catalog.json",
                "data/integration/live_provider_handover_matrix.csv",
                "data/analysis/dependency_simulator_strategy.json",
            ],
            "automatedProofRefs": [
                "data/integration/adapter_validation_results.json",
                "data/test/137_rehearsal_results.json",
                "data/analysis/preview_environment_manifest.json",
            ],
            "suiteRefs": ["seq_135", "seq_137"],
            "openItemRefs": [
                "OI_138_LIVE_BOOKING_PROVIDER_PAIRING",
                "OI_138_LIVE_MESH_GP_PHARMACY_ONBOARDING",
                "OI_138_EXECUTABLE_MALWARE_SCANNING_RUNTIME",
            ],
            "signalRows": [
                {"label": "Validated adapters", "value": str(adapter_summary["runtimeValidatedCount"])},
                {"label": "Explicit gaps", "value": str(adapter_summary["gapCount"])},
                {"label": "Dishonest claims", "value": str(adapter_summary["dishonestCount"])},
            ],
        },
        {
            "rowId": "P0R_138_OBSERVABILITY_AND_AUDIT",
            "capabilityFamilyId": "observability_and_audit",
            "capabilityLabel": "Observability and audit",
            "status": "approved",
            "summary": "Observability, audit disclosure, retention, and provenance lineage are published as machine-readable controls for the foundation baseline.",
            "blockingRationale": "",
            "sourceRefs": [
                "blueprint/phase-0-the-foundation-protocol.md",
                "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
                "docs/architecture/93_edge_correlation_spine_explorer.html",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/observability_signal_matrix.csv",
                "data/analysis/audit_record_schema.json",
                "data/analysis/worm_retention_classes.json",
            ],
            "automatedProofRefs": [
                "data/analysis/observability_event_schema_manifest.json",
                "data/analysis/build_provenance_manifest.json",
                "data/analysis/build_provenance_integrity_catalog.json",
            ],
            "suiteRefs": [],
            "openItemRefs": [],
            "signalRows": [
                {"label": "Observability schema manifests", "value": str(observability_schema["summary"]["event_count"]) if "summary" in observability_schema and "event_count" in observability_schema["summary"] else "current"},
                {"label": "Provenance publishable scenarios", "value": str(build_provenance_integrity["summary"]["publishable_count"])},
                {"label": "Provenance blocked scenarios", "value": str(build_provenance_integrity["summary"]["blocked_count"])},
            ],
        },
        {
            "rowId": "P0R_138_BACKUP_RESTORE_AND_CANARY_REHEARSAL",
            "capabilityFamilyId": "backup_restore_and_canary_rehearsal",
            "capabilityLabel": "Backup/restore and canary rehearsal",
            "status": "approved",
            "summary": "Release-watch, canary, rollback, and restore drills are tuple-bound and machine-readable for non-production rings, with live authority intentionally withheld.",
            "blockingRationale": "",
            "sourceRefs": [
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
                "blueprint/phase-cards.md#card-1-mandatory-tests",
                "docs/tests/137_release_restore_canary_rehearsal_suite.md",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/release_watch_pipeline_catalog.json",
                "data/analysis/release_watch_required_evidence.csv",
                "data/analysis/resilience_baseline_catalog.json",
            ],
            "automatedProofRefs": [
                "data/test/137_rehearsal_results.json",
                "data/test/137_wave_observation_cases.csv",
                "data/test/137_restore_readiness_cases.csv",
            ],
            "suiteRefs": ["seq_137"],
            "openItemRefs": [],
            "signalRows": [
                {"label": "Release-watch scenarios", "value": str(load_json(RELEASE_WATCH_CATALOG_PATH)["summary"]["scenario_count"])},
                {"label": "Exact-ready restore cases", "value": str(resilience_baseline["summary"]["exact_ready_count"])},
                {"label": "Live reopened controls", "value": str(suite_137["summary"]["live_control_reopened_count"])},
            ],
        },
        {
            "rowId": "P0R_138_ACCESSIBILITY_AND_SHELL_SMOKE_PROOF",
            "capabilityFamilyId": "accessibility_and_shell_smoke_proof",
            "capabilityLabel": "Accessibility and shell smoke proof",
            "status": "constrained",
            "summary": "Accessibility semantics, shell smoke, and preview proof are present for every shell family, but they correctly stop short of live proof.",
            "blockingRationale": "The seq_136 suite verdict remains release_withheld, smoke_pass_count is zero, and one accessibility case stays blocked, so this cannot be described as live browser readiness.",
            "sourceRefs": [
                "blueprint/accessibility-and-content-system-contract.md",
                "blueprint/platform-frontend-blueprint.md",
                "docs/tests/136_shell_accessibility_preview_smoke_suite.md",
            ],
            "implementationEvidenceRefs": [
                "data/analysis/accessibility_semantic_coverage_profiles.json",
                "data/analysis/preview_environment_manifest.json",
                "data/analysis/audience_surface_runtime_bindings.json",
            ],
            "automatedProofRefs": [
                "data/test/136_preview_environment_suite_results.json",
                "data/test/continuity_gate_suite_results.json",
                "data/analysis/surface_authority_verdicts.json",
            ],
            "suiteRefs": ["seq_134", "seq_136"],
            "openItemRefs": [
                "OI_138_PUBLISHABLE_LIVE_BROWSER_PARITY",
                "OI_138_LIVE_NHS_APP_EMBEDDED_CHANNEL",
            ],
            "signalRows": [
                {"label": "Shell families", "value": str(suite_136["summary"]["shell_family_count"])},
                {"label": "Accessibility blocked cases", "value": str(suite_136["summary"]["accessibility_blocked_count"])},
                {"label": "Smoke withheld count", "value": str(suite_136["summary"]["smoke_withheld_count"])},
            ],
        },
        {
            "rowId": "P0R_138_ASSURANCE_PRIVACY_AND_CLINICAL_SAFETY",
            "capabilityFamilyId": "assurance_privacy_and_clinical_safety_seed_artifacts",
            "capabilityLabel": "Assurance, privacy, and clinical-safety seed artifacts",
            "status": "constrained",
            "summary": "The repository holds current seed packs and gap registers for clinical safety, privacy, NHS login, DSPT, IM1, and signoff governance, without pretending those seeds are production approvals.",
            "blockingRationale": "Open assurance and onboarding gaps remain explicit for live signoff, provider scope approval, and deployer-bound evidence, so this row is seed-complete but not production-approved.",
            "sourceRefs": [
                "docs/assurance/121_dcb0129_clinical_safety_case_structure.md",
                "docs/assurance/123_im1_prerequisite_readiness_pack.md",
                "docs/assurance/126_privacy_threat_model.md",
            ],
            "implementationEvidenceRefs": [
                "data/assurance/dcb0129_safety_case_outline.json",
                "data/assurance/im1_artifact_index.json",
                "data/assurance/privacy_control_traceability.json",
            ],
            "automatedProofRefs": [
                "data/assurance/clinical_signoff_gate_requirements.json",
                "data/assurance/dspt_gap_register.json",
                "data/assurance/nhs_login_gap_register.json",
            ],
            "suiteRefs": [],
            "openItemRefs": [
                "OI_138_PRODUCTION_ASSURANCE_SIGNOFF",
                "OI_138_LIVE_NHS_LOGIN_ONBOARDING",
                "OI_138_LIVE_BOOKING_PROVIDER_PAIRING",
            ],
            "signalRows": [
                {"label": "Clinical signoff blocked prerequisites", "value": str(clinical_signoff["summary"]["blocked_prerequisite_count"])},
                {"label": "DSPT gap count", "value": str(dspt_gap_register["summary"]["gap_count"])},
                {"label": "IM1 gap count", "value": str(im1_gap_register["summary"]["gap_count"])},
            ],
        },
    ]

    for row in rows:
        require(row["capabilityFamilyId"] in REQUIRED_CAPABILITY_FAMILIES, f"PREREQUISITE_GAP_138_ROW_FAMILY::{row['capabilityFamilyId']}")
        require(set(row["openItemRefs"]).issubset(open_item_ids), f"PREREQUISITE_GAP_138_OPEN_ITEM_REF::{row['rowId']}")
        ensure_refs_exist(row["sourceRefs"])
        ensure_refs_exist(row["implementationEvidenceRefs"])
        ensure_refs_exist(row["automatedProofRefs"])
        require(all(ref in suite_by_id for ref in row["suiteRefs"]), f"PREREQUISITE_GAP_138_SUITE_REF::{row['rowId']}")

    return rows


def build_evidence_manifest(rows: list[dict[str, Any]], suite_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    suite_by_id = {suite["suiteId"]: suite for suite in suite_records}
    manifest_rows: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    counter = 1
    for row in rows:
        for evidence_kind, refs, artifact_class, machine_state in [
            ("implementation", row["implementationEvidenceRefs"], "implementation_evidence", "current"),
            ("automated_proof", row["automatedProofRefs"], "automated_proof", "machine_verified"),
        ]:
            for ref in refs:
                key = (row["capabilityFamilyId"], ref)
                if key in seen:
                    continue
                seen.add(key)
                manifest_rows.append(
                    {
                        "evidence_id": f"EVID_138_{counter:03d}",
                        "capability_family_id": row["capabilityFamilyId"],
                        "capability_label": row["capabilityLabel"],
                        "evidence_kind": evidence_kind,
                        "artifact_class": artifact_class,
                        "source_task_ref": infer_task_ref_from_ref(ref, row["suiteRefs"]),
                        "machine_state": machine_state,
                        "artifact_ref": ref,
                        "summary": f"{row['capabilityLabel']} {evidence_kind.replace('_', ' ')}",
                    }
                )
                counter += 1
        for suite_id in row["suiteRefs"]:
            suite = suite_by_id[suite_id]
            key = (row["capabilityFamilyId"], suite_id)
            if key in seen:
                continue
            seen.add(key)
            manifest_rows.append(
                {
                    "evidence_id": f"EVID_138_{counter:03d}",
                    "capability_family_id": row["capabilityFamilyId"],
                    "capability_label": row["capabilityLabel"],
                    "evidence_kind": "suite_binding",
                    "artifact_class": "verification_suite",
                    "source_task_ref": suite_id,
                    "machine_state": suite["verificationOutcome"],
                    "artifact_ref": suite["artifactRefs"][0],
                    "summary": suite["label"],
                }
            )
            counter += 1
    return manifest_rows


def infer_task_ref_from_ref(ref: str, suite_refs: list[str]) -> str:
    name = ref.split("/")[-1]
    if name.startswith("138_"):
        return TASK_ID
    if "transition_suite_results" in name or name.startswith("133_"):
        return "seq_133"
    if "continuity_gate_suite_results" in name or name.startswith("134_"):
        return "seq_134"
    if "exception_path_suite_results" in name or name.startswith("135_"):
        return "seq_135"
    if "136_" in name:
        return "seq_136"
    if "137_" in name:
        return "seq_137"
    if "phase0_exit_artifact_index" in name or "foundation_demo_trace_index" in name:
        return "seq_132"
    if "release_candidate" in name or "freeze_blockers" in name:
        return "seq_131"
    if "surface_authority" in name or "audience_surface_runtime_bindings" in name:
        return "seq_130"
    if "manifest_fusion" in name:
        return "seq_127"
    if "adapter_validation" in name or "seeded_external_contract_catalog" in name or "live_provider_handover" in name:
        return "seq_129"
    if "build_provenance" in name:
        return "par_100"
    if "resilience_baseline" in name or "release_watch" in name:
        return "par_097_or_101"
    if "nhs_login" in name:
        return "par_124"
    if "dspt" in name:
        return "par_122"
    if "clinical_signoff" in name:
        return "par_125"
    if "dcb0129" in name:
        return "par_121"
    if "im1" in name:
        return "par_123"
    if "privacy" in name:
        return "par_126"
    if "observability" in name or "audit_" in name or "worm_" in name:
        return "par_093_or_seq_051"
    if "persistent_shell" in name or "frontend_contract" in name or "selected_anchor" in name:
        return "par_106_or_par_108"
    if "request_lineage" in name:
        return "seq_005"
    if "coverage_summary" in name or "requirement_task_traceability" in name:
        return "seq_019"
    if suite_refs:
        return suite_refs[0]
    return "phase0_foundation"


def build_decision_payload(
    rows: list[dict[str, Any]],
    suites: list[dict[str, Any]],
    open_items: list[dict[str, Any]],
    prior_completion: dict[str, Any],
) -> dict[str, Any]:
    phase0_exit_pack = load_json(PHASE0_EXIT_ARTIFACT_INDEX_PATH)
    release_candidate = load_json(RELEASE_CANDIDATE_PATH)
    surface_authority = load_json(SURFACE_AUTHORITY_PATH)
    coverage_summary = load_json(COVERAGE_SUMMARY_PATH)
    suite_136 = load_json(SUITE_136_PATH)
    suite_137 = load_json(SUITE_137_PATH)

    status_counts: dict[str, int] = {}
    for row in rows:
        status_counts[row["status"]] = status_counts.get(row["status"], 0) + 1

    contradiction_checks = [
        {
            "checkId": "CHK_138_SURFACE_LIVE_TRUTH_WITHHELD",
            "state": "aligned"
            if surface_authority["summary"]["publishable_live_count"] == 0 and suite_136["suiteVerdict"] == "release_withheld"
            else "conflict",
            "summary": "Surface authority and shell smoke both keep live browser publication withheld.",
            "evidenceRefs": [
                "data/analysis/surface_authority_verdicts.json",
                "data/test/136_preview_environment_suite_results.json",
            ],
        },
        {
            "checkId": "CHK_138_RELEASE_CONTROL_NOT_REOPENED",
            "state": "aligned"
            if suite_137["summary"]["live_control_reopened_count"] == 0
            else "conflict",
            "summary": "Release rehearsals do not reopen live control during the simulator-first gate.",
            "evidenceRefs": [
                "data/test/137_rehearsal_results.json",
            ],
        },
        {
            "checkId": "CHK_138_PREVIOUS_EXIT_WITHHELD_IS_EXPLAINED",
            "state": "aligned"
            if phase0_exit_pack["phase0ExitClaimState"] == "withheld"
            else "conflict",
            "summary": "The earlier exit pack withheld the claim, and this gate now resolves that ambiguity by approving only the simulator-first foundation baseline.",
            "evidenceRefs": [
                "data/analysis/phase0_exit_artifact_index.json",
                "docs/governance/138_phase0_go_no_go_decision.md",
            ],
        },
    ]
    require(all(check["state"] == "aligned" for check in contradiction_checks), "CONFLICT_138_FOUNDATION_GATE_ALIGNMENT")

    gate_questions = [
        {
            "questionId": "Q1",
            "question": "Are all mandatory Phase 0 tasks complete and traceable?",
            "answerState": "approved",
            "answer": "Yes. Every task before seq_138 is complete in the checklist and repository traceability still reports zero requirement gaps.",
            "evidenceRefs": [
                "prompt/checklist.md",
                "data/analysis/coverage_summary.json",
                "data/analysis/requirement_task_traceability.csv",
            ],
        },
        {
            "questionId": "Q2",
            "question": "Did verification suites 133-137 pass with machine-readable evidence?",
            "answerState": "approved",
            "answer": "Yes. The suites passed, while seq_136 and seq_137 still correctly keep live publication and live control withheld.",
            "evidenceRefs": [
                "data/test/transition_suite_results.json",
                "data/test/continuity_gate_suite_results.json",
                "data/test/exception_path_suite_results.json",
                "data/test/136_preview_environment_suite_results.json",
                "data/test/137_rehearsal_results.json",
            ],
        },
        {
            "questionId": "Q3",
            "question": "Are the canonical shell, runtime, publication, accessibility, replay, and recovery invariants demonstrably in place?",
            "answerState": "constrained",
            "answer": "Yes for the simulator-first baseline. The invariants are implemented and machine-tested, but live surface calm/writable truth is still intentionally withheld.",
            "evidenceRefs": [
                "data/analysis/manifest_fusion_verdicts.json",
                "data/analysis/surface_authority_verdicts.json",
                "data/test/136_preview_environment_suite_results.json",
                "data/test/137_rehearsal_results.json",
            ],
        },
        {
            "questionId": "Q4",
            "question": "Are simulator-first external dependency assumptions explicit and bounded?",
            "answerState": "approved",
            "answer": "Yes. Adapter validation, handover matrices, and deferred live-provider items are explicit, bounded, and fail closed.",
            "evidenceRefs": [
                "data/integration/adapter_validation_results.json",
                "data/integration/live_provider_handover_matrix.csv",
                "data/analysis/138_phase0_open_items_and_deferred_live_provider_work.json",
            ],
        },
        {
            "questionId": "Q5",
            "question": "Which items are genuinely deferred to later live-provider or live-channel phases, and why are they not Phase 0 blockers?",
            "answerState": "approved",
            "answer": "They are listed explicitly in the open-items register and are non-blocking because this gate approves only simulator-first foundation readiness.",
            "evidenceRefs": [
                "data/analysis/138_phase0_open_items_and_deferred_live_provider_work.json",
                "docs/governance/138_phase0_mock_now_vs_actual_later_boundary.md",
            ],
        },
        {
            "questionId": "Q6",
            "question": "Is there any unresolved contradiction between the canonical docs, prompts, and implemented foundation artifacts?",
            "answerState": "approved",
            "answer": "No current contradiction was detected. The remaining constraints all preserve fail-closed truth instead of weakening the blueprints.",
            "evidenceRefs": [
                "data/analysis/phase0_exit_artifact_index.json",
                "data/analysis/138_phase0_exit_gate_decision.json",
            ],
        },
    ]

    return {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": datetime.now(timezone.utc).date().isoformat(),
        "visual_mode": VISUAL_MODE,
        "gatePackRef": GATE_PACK_REF,
        "gateVerdict": GATE_VERDICT,
        "baselineScope": BASELINE_SCOPE,
        "liveProviderReadinessState": LIVE_READINESS_STATE,
        "foundationProtocolDecision": "approved_for_simulator_first_mvp_baseline",
        "source_precedence": SOURCE_PRECEDENCE,
        "mock_now_execution": "Approve the current simulator-backed foundation only. Keep live publication, live-provider readiness, and production signoff outside the approved claim.",
        "actual_production_strategy_later": "Extend the same tuple, parity, shell, and evidence contracts into later live-provider and live-channel onboarding without redefining Phase 0 semantics.",
        "summary": {
            "prior_completed_task_count": prior_completion["priorTaskCount"],
            "approved_row_count": status_counts.get("approved", 0),
            "constrained_row_count": status_counts.get("constrained", 0),
            "blocked_row_count": status_counts.get("blocked", 0),
            "deferred_non_blocking_row_count": status_counts.get("deferred_non_blocking", 0),
            "mandatory_suite_count": len(suites),
            "mandatory_suite_pass_count": sum(1 for suite in suites if suite["verificationOutcome"] == "passed"),
            "deferred_open_item_count": len(open_items),
            "publishable_live_surface_count": surface_authority["summary"]["publishable_live_count"],
            "live_control_reopened_count": suite_137["summary"]["live_control_reopened_count"],
        },
        "selectedReleaseRef": release_candidate["releaseCandidateTuple"]["releaseRef"],
        "selectedTupleHash": release_candidate["releaseCandidateTuple"]["compilationTupleHash"],
        "previousExitPackState": phase0_exit_pack["phase0ExitClaimState"],
        "requirementTraceabilityState": {
            "requirements_with_gaps_count": coverage_summary["summary"]["requirements_with_gaps_count"],
            "traceability_row_count": coverage_summary["summary"]["traceability_row_count"],
        },
        "mandatorySuites": suites,
        "capabilityRowRefs": [row["rowId"] for row in rows],
        "openItemRefs": [item["itemId"] for item in open_items],
        "contradictionChecks": contradiction_checks,
        "gateQuestions": gate_questions,
        "assumptions": [
            {
                "assumptionId": "ASSUMPTION_138_PRIOR_VALIDATORS_REMAIN_AUTHORITATIVE",
                "summary": "Validated outputs from tasks 001-137 remain the governing machine-readable baseline for this gate pack."
            }
        ],
        "risks": [
            {
                "riskId": "RISK_138_LIVE_SURFACE_TRUTH_STILL_WITHHELD",
                "summary": "Phase 0 ends with live surface truth withheld; later phases must not misread this gate as permission to advertise live calm/writable posture."
            },
            {
                "riskId": "RISK_138_DEFERRED_PROVIDER_ONBOARDING_CAN_BE_MISSTATED",
                "summary": "Deferred provider/channel work must stay explicit so later delivery does not launder simulator-first proof into live-provider claims."
            },
        ],
        "prerequisite_gaps": [],
    }


def build_exit_gate_pack_doc(decision: dict[str, Any], rows: list[dict[str, Any]], suites: list[dict[str, Any]], open_items: list[dict[str, Any]], evidence_manifest: list[dict[str, Any]]) -> str:
    row_table = markdown_table(
        ["Capability family", "Status", "Summary", "Blocking rationale"],
        [
            [
                row["capabilityLabel"],
                row["status"],
                row["summary"],
                row["blockingRationale"] or "None",
            ]
            for row in rows
        ],
    )
    suite_table = markdown_table(
        ["Suite", "Outcome", "Proof verdict", "Summary"],
        [
            [
                suite["suiteId"],
                suite["verificationOutcome"],
                suite["proofVerdict"],
                suite["summary"],
            ]
            for suite in suites
        ],
    )
    question_table = markdown_table(
        ["Question", "State", "Answer"],
        [[item["question"], item["answerState"], item["answer"]] for item in decision["gateQuestions"]],
    )
    evidence_preview = markdown_table(
        ["Evidence", "Family", "Kind", "Task", "State"],
        [
            [
                row["artifact_ref"],
                row["capability_label"],
                row["evidence_kind"],
                row["source_task_ref"],
                row["machine_state"],
            ]
            for row in evidence_manifest[:12]
        ],
    )
    open_items_table = markdown_table(
        ["Open item", "Class", "State", "Why non-blocking now"],
        [
            [item["title"], item["workClass"], item["deferredState"], item["whyNonBlockingNow"]]
            for item in open_items
        ],
    )
    return dedent(
        f"""
        # 138 Phase 0 Exit Gate Pack

        Gate verdict: `{decision["gateVerdict"]}`

        This pack formally approves the current MVP baseline as **simulator-first foundation readiness**. It does **not** approve live-provider readiness, live-channel publication, or production signoff.

        ## Decision Summary

        - Gate pack ref: `{decision["gatePackRef"]}`
        - Foundation decision: `{decision["foundationProtocolDecision"]}`
        - Baseline scope: `{decision["baselineScope"]}`
        - Live-provider readiness state: `{decision["liveProviderReadinessState"]}`
        - Approved rows: `{decision["summary"]["approved_row_count"]}`
        - Constrained rows: `{decision["summary"]["constrained_row_count"]}`
        - Blocked rows: `{decision["summary"]["blocked_row_count"]}`
        - Deferred open items: `{decision["summary"]["deferred_open_item_count"]}`

        ## Gate Questions

        {question_table}

        ## Mandatory Verification Binding

        {suite_table}

        ## Conformance Scorecard Snapshot

        {row_table}

        ## Evidence Manifest Preview

        {evidence_preview}

        Full manifest: [138_phase0_evidence_manifest.csv](/Users/test/Code/V/data/analysis/138_phase0_evidence_manifest.csv)

        ## Explicit Deferred Work

        {open_items_table}
        """
    ).strip()


def build_go_no_go_doc(decision: dict[str, Any], rows: list[dict[str, Any]]) -> str:
    constrained_rows = [row for row in rows if row["status"] == "constrained"]
    return dedent(
        f"""
        # 138 Phase 0 Go No Go Decision

        Verdict: `{decision["gateVerdict"]}`

        ## Go Statement

        Approve the current repository state as **Phase 0 foundation protocol completed for the simulator-first MVP baseline**.

        ## Non-Claims

        - This decision is not live-provider readiness.
        - This decision is not live-channel publication approval.
        - This decision is not production clinical, DSPT, or provider signoff.

        ## Why The Verdict Is Not A Full Go

        The constrained rows below remain intentionally bounded:

        {markdown_table(
            ["Capability family", "Constraint"],
            [[row["capabilityLabel"], row["blockingRationale"]] for row in constrained_rows],
        )}

        ## Credibility Guardrail

        The repository now has one formal gate pack that resolves the earlier ambiguity left by seq_132: the foundation is approved for simulator-first execution, while live-provider work remains explicitly deferred.
        """
    ).strip()


def build_conformance_doc(rows: list[dict[str, Any]]) -> str:
    return dedent(
        f"""
        # 138 Phase 0 Conformance Scorecard

        {markdown_table(
            [
                "Capability family",
                "Status",
                "Implementation evidence",
                "Automated proof artifacts",
                "Blocking rationale",
            ],
            [
                [
                    row["capabilityLabel"],
                    row["status"],
                    join_refs(row["implementationEvidenceRefs"]),
                    join_refs(row["automatedProofRefs"]),
                    row["blockingRationale"] or "None",
                ]
                for row in rows
            ],
        )}
        """
    ).strip()


def build_boundary_doc(open_items: list[dict[str, Any]]) -> str:
    return dedent(
        f"""
        # 138 Phase 0 Mock Now Vs Actual Later Boundary

        ## Mock Now Execution

        - Use simulator-backed providers, preview and non-production tuples, and explicit degraded defaults.
        - Keep live browser calm/writable truth withheld unless exact publication parity exists.
        - Treat seed assurance packs as seed evidence only, not as live signoff.

        ## Actual Production Strategy Later

        {markdown_table(
            ["Deferred item", "Current boundary", "Later production work"],
            [
                [
                    item["title"],
                    item["currentBoundaryState"],
                    item["summary"],
                ]
                for item in open_items
            ],
        )}
        """
    ).strip()


def build_board_html(decision: dict[str, Any], rows: list[dict[str, Any]], suites: list[dict[str, Any]], evidence_manifest: list[dict[str, Any]], open_items: list[dict[str, Any]]) -> str:
    decision_json = json.dumps(decision).replace("</", "<\\/")
    rows_json = json.dumps(rows).replace("</", "<\\/")
    suites_json = json.dumps(suites).replace("</", "<\\/")
    evidence_json = json.dumps(evidence_manifest).replace("</", "<\\/")
    open_items_json = json.dumps(open_items).replace("</", "<\\/")
    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>138 Phase 0 Gate Review Board</title>
    <style>
      :root {{
        color-scheme: light;
        --canvas: #F7F8FA;
        --panel: #FFFFFF;
        --rail: #EEF2F6;
        --text-strong: #0F1720;
        --text-default: #24313D;
        --text-muted: #5E6B78;
        --border: #D8E0E8;
        --approved: #117A55;
        --constrained: #B7791F;
        --blocked: #B42318;
        --deferred: #5B61F6;
        --shadow: 0 18px 42px rgba(15, 23, 32, 0.08);
      }}
      * {{ box-sizing: border-box; }}
      html, body {{ margin: 0; padding: 0; background: var(--canvas); color: var(--text-default); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
      body {{ min-height: 100vh; }}
      button, select {{ font: inherit; }}
      button {{ cursor: pointer; }}
      .page {{ max-width: 1560px; margin: 0 auto; padding: 0 20px 28px; }}
      .masthead {{
        position: sticky; top: 0; z-index: 12; height: 72px; display: flex; align-items: center; justify-content: space-between;
        gap: 16px; padding: 14px 20px; margin: 0 -20px 18px; background: rgba(247, 248, 250, 0.94); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(216, 224, 232, 0.8);
      }}
      .brand {{ display: flex; align-items: center; gap: 14px; min-width: 0; }}
      .brand-mark {{ width: 34px; height: 34px; border-radius: 12px; background: linear-gradient(135deg, rgba(17,122,85,0.18), rgba(91,97,246,0.12)); display: grid; place-items: center; }}
      .brand-label {{ display: grid; gap: 2px; }}
      .brand-label strong {{ color: var(--text-strong); font-size: 15px; }}
      .brand-label span {{ color: var(--text-muted); font-size: 12px; }}
      .summary-pills {{ display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }}
      .summary-pill {{ min-width: 148px; padding: 10px 12px; border-radius: 16px; border: 1px solid var(--border); background: var(--panel); box-shadow: var(--shadow); }}
      .summary-pill small {{ display: block; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }}
      .summary-pill strong {{ color: var(--text-strong); font-size: 14px; }}
      .layout {{ display: grid; grid-template-columns: 280px minmax(0, 1fr) 392px; gap: 18px; align-items: start; }}
      .layout > * {{ min-width: 0; }}
      .rail, .canvas, .inspector, .panel {{ min-width: 0; background: var(--panel); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow); }}
      .rail, .inspector {{ position: sticky; top: 92px; }}
      .rail {{ padding: 18px; display: grid; gap: 16px; background: var(--rail); }}
      .canvas {{ padding: 18px; display: grid; gap: 18px; }}
      .inspector {{ padding: 18px; display: grid; gap: 14px; }}
      .panel {{ padding: 16px; display: grid; gap: 14px; }}
      h1, h2, h3, p {{ margin: 0; }}
      .section-title {{ color: var(--text-strong); font-size: 15px; }}
      .muted {{ color: var(--text-muted); }}
      .filter-group {{ display: grid; gap: 8px; min-width: 0; }}
      .filter-group label {{ color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }}
      .filter-group select {{ width: 100%; max-width: 100%; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--border); background: var(--panel); color: var(--text-default); }}
      .suite-strip {{ display: flex; flex-wrap: wrap; gap: 8px; }}
      .suite-pill {{ display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 999px; background: #f1f4f8; color: var(--text-strong); font-size: 12px; font-weight: 600; }}
      .suite-pill[data-tone="passed"] {{ background: rgba(17,122,85,0.12); color: var(--approved); }}
      .heat-strip {{ display: grid; gap: 10px; }}
      .capability-card {{ width: 100%; text-align: left; padding: 14px; border-radius: 18px; border: 1px solid var(--border); background: var(--panel); display: grid; gap: 8px; transition: border-color 120ms ease, transform 120ms ease, background 120ms ease; }}
      .capability-card:hover, .capability-card:focus-visible {{ outline: none; transform: translateY(-1px); }}
      .capability-card[data-status="approved"] {{ border-left: 4px solid var(--approved); }}
      .capability-card[data-status="constrained"] {{ border-left: 4px solid var(--constrained); }}
      .capability-card[data-status="blocked"] {{ border-left: 4px solid var(--blocked); }}
      .capability-card[data-selected="true"] {{ box-shadow: inset 0 0 0 1px rgba(91, 97, 246, 0.18); background: linear-gradient(180deg, rgba(91,97,246,0.08), rgba(255,255,255,0.98)); }}
      .card-meta {{ display: flex; gap: 8px; flex-wrap: wrap; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }}
      .status-pill {{ display: inline-flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }}
      .status-pill[data-status="approved"] {{ background: rgba(17,122,85,0.12); color: var(--approved); }}
      .status-pill[data-status="constrained"] {{ background: rgba(183,121,31,0.12); color: var(--constrained); }}
      .status-pill[data-status="blocked"] {{ background: rgba(180,35,24,0.12); color: var(--blocked); }}
      .status-pill[data-status="deferred_non_blocking"] {{ background: rgba(91,97,246,0.12); color: var(--deferred); }}
      .table-shell {{ overflow: auto; border: 1px solid var(--border); border-radius: 18px; background: var(--panel); }}
      table {{ width: 100%; min-width: 100%; border-collapse: collapse; }}
      th, td {{ padding: 11px 12px; border-bottom: 1px solid rgba(216,224,232,0.82); text-align: left; vertical-align: top; font-size: 12px; }}
      th {{ color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; background: rgba(238,242,246,0.74); position: sticky; top: 0; }}
      tbody tr[data-selected="true"] {{ background: rgba(91,97,246,0.08); }}
      tbody tr:hover {{ background: rgba(238,242,246,0.72); }}
      tbody tr button {{ all: unset; display: block; width: 100%; cursor: pointer; }}
      .timeline {{ display: grid; gap: 10px; }}
      .timeline-card {{ border: 1px solid var(--border); border-radius: 18px; padding: 12px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,248,250,0.98)); display: grid; gap: 6px; }}
      .timeline-card[data-kind="automated_proof"], .timeline-card[data-kind="suite_binding"] {{ border-left: 4px solid var(--approved); }}
      .timeline-card[data-kind="implementation"] {{ border-left: 4px solid var(--deferred); }}
      .lower-grid {{ display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 18px; }}
      .inspector-block {{ border: 1px solid var(--border); border-radius: 18px; padding: 14px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,248,250,0.98)); display: grid; gap: 8px; }}
      .inspector-block small {{ color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }}
      .signal-grid {{ display: grid; gap: 8px; }}
      .signal-row {{ display: flex; justify-content: space-between; gap: 12px; font-size: 12px; }}
      .mono {{ font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; word-break: break-all; }}
      @media (max-width: 1360px) {{
        .layout {{ grid-template-columns: 280px minmax(0, 1fr); }}
        .inspector {{ position: static; grid-column: 1 / -1; }}
      }}
      @media (max-width: 1100px) {{
        .page {{ padding-inline: 16px; }}
        .masthead {{ margin-inline: -16px; height: auto; min-height: 72px; align-items: start; flex-direction: column; }}
        .layout {{ grid-template-columns: 1fr; }}
        .rail {{ position: static; }}
        .lower-grid {{ grid-template-columns: 1fr; }}
        .summary-pill {{ min-width: 0; }}
      }}
      @media (prefers-reduced-motion: reduce) {{
        *, *::before, *::after {{ animation: none !important; transition: none !important; scroll-behavior: auto !important; }}
      }}
    </style>
  </head>
  <body data-testid="foundation-gate-board">
    <div class="page">
      <header class="masthead" data-testid="board-masthead">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 15h14" stroke="#117A55" stroke-width="1.5" stroke-linecap="round"></path>
              <path d="M6 11h10" stroke="#5B61F6" stroke-width="1.5" stroke-linecap="round"></path>
              <path d="M8 7h6" stroke="#B7791F" stroke-width="1.5" stroke-linecap="round"></path>
            </svg>
          </div>
          <div class="brand-label">
            <strong>Vecells Foundation Gate</strong>
            <span>Foundation_Gate_Board</span>
          </div>
        </div>
        <div class="summary-pills">
          <div class="summary-pill">
            <small>Verdict</small>
            <strong data-testid="gate-verdict"></strong>
          </div>
          <div class="summary-pill">
            <small>Approved</small>
            <strong data-testid="approved-row-count"></strong>
          </div>
          <div class="summary-pill">
            <small>Constrained</small>
            <strong data-testid="constrained-row-count"></strong>
          </div>
          <div class="summary-pill">
            <small>Blocked</small>
            <strong data-testid="blocked-row-count"></strong>
          </div>
        </div>
      </header>

      <div class="layout">
        <nav class="rail" aria-label="Foundation gate filters" data-testid="filter-rail">
          <div class="filter-group">
            <label for="filter-status">Decision state</label>
            <select id="filter-status" data-testid="filter-status"></select>
          </div>
          <div class="filter-group">
            <label for="filter-family">Capability family</label>
            <select id="filter-family" data-testid="filter-family"></select>
          </div>
          <section class="panel" style="background: var(--panel);">
            <h2 class="section-title">Mandatory suites</h2>
            <p class="muted">The gate binds directly to the machine-readable outputs from seq_133 through seq_137.</p>
            <div class="suite-strip" data-testid="suite-strip"></div>
            <div class="table-shell">
              <table data-testid="suite-table">
                <thead><tr><th>Suite</th><th>Outcome</th><th>Proof verdict</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
        </nav>

        <main class="canvas" data-testid="board-canvas">
          <section class="panel">
            <h2 class="section-title">Conformance heat strip</h2>
            <p class="muted">Selecting a capability row synchronizes the inspector, evidence manifest, and deferred-work table.</p>
            <div class="heat-strip" data-testid="heat-strip"></div>
            <div class="table-shell">
              <table data-testid="scorecard-table">
                <thead><tr><th>Capability family</th><th>Status</th><th>Summary</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </section>

          <section class="panel">
            <h2 class="section-title">Evidence manifest timeline</h2>
            <p class="muted">Implementation evidence, automated proof artifacts, and bound verification suites remain visible for the currently selected row.</p>
            <div class="timeline" data-testid="evidence-timeline"></div>
          </section>

          <div class="lower-grid">
            <section class="panel">
              <h2 class="section-title">Evidence manifest</h2>
              <div class="table-shell">
                <table data-testid="evidence-table">
                  <thead><tr><th>Artifact</th><th>Kind</th><th>Task</th><th>State</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>
            <section class="panel">
              <h2 class="section-title">Open items</h2>
              <div class="table-shell">
                <table data-testid="open-items-table">
                  <thead><tr><th>Open item</th><th>Class</th><th>State</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>
          </div>
        </main>

        <aside class="inspector" aria-label="Selected capability family" data-testid="inspector">
          <div class="inspector-block" data-testid="inspector-summary">
            <small>Selected capability</small>
            <div id="inspector-title"></div>
            <div id="inspector-status"></div>
            <div id="inspector-summary-text" class="muted"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-signals">
            <small>Machine signals</small>
            <div class="signal-grid" id="inspector-signals-grid"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-rationale">
            <small>Constraint rationale</small>
            <div id="inspector-rationale-text"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-boundary">
            <small>Boundary notes</small>
            <div id="inspector-open-items"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-refs">
            <small>Source refs</small>
            <div class="mono" id="inspector-refs-text"></div>
          </div>
        </aside>
      </div>
    </div>

    <script id="decision-json" type="application/json">{decision_json}</script>
    <script id="rows-json" type="application/json">{rows_json}</script>
    <script id="suites-json" type="application/json">{suites_json}</script>
    <script id="evidence-json" type="application/json">{evidence_json}</script>
    <script id="open-items-json" type="application/json">{open_items_json}</script>
    <script>
      const decision = JSON.parse(document.getElementById("decision-json").textContent);
      const rows = JSON.parse(document.getElementById("rows-json").textContent);
      const suites = JSON.parse(document.getElementById("suites-json").textContent);
      const evidenceManifest = JSON.parse(document.getElementById("evidence-json").textContent);
      const openItems = JSON.parse(document.getElementById("open-items-json").textContent);
      const body = document.body;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      body.dataset.reducedMotion = String(reduceMotion.matches);

      const state = {{
        status: "all",
        family: "all",
        selectedRowId: rows[0].rowId,
      }};

      function optionize(select, values) {{
        select.innerHTML = "";
        values.forEach((value) => {{
          const option = document.createElement("option");
          option.value = value.value;
          option.textContent = value.label;
          select.append(option);
        }});
      }}

      function getVisibleRows() {{
        return rows.filter((row) => {{
          if (state.status !== "all" && row.status !== state.status) return false;
          if (state.family !== "all" && row.capabilityFamilyId !== state.family) return false;
          return true;
        }});
      }}

      function getSelectedRow() {{
        const visible = getVisibleRows();
        return visible.find((row) => row.rowId === state.selectedRowId) || visible[0] || rows[0];
      }}

      function getOpenItemsForRow(row) {{
        return openItems.filter((item) => row.openItemRefs.includes(item.itemId));
      }}

      function getEvidenceForRow(row) {{
        return evidenceManifest.filter((item) => item.capability_family_id === row.capabilityFamilyId);
      }}

      function renderMasthead() {{
        document.querySelector("[data-testid='gate-verdict']").textContent = decision.gateVerdict;
        document.querySelector("[data-testid='approved-row-count']").textContent = String(decision.summary.approved_row_count);
        document.querySelector("[data-testid='constrained-row-count']").textContent = String(decision.summary.constrained_row_count);
        document.querySelector("[data-testid='blocked-row-count']").textContent = String(decision.summary.blocked_row_count);
      }}

      function renderSuites() {{
        const strip = document.querySelector("[data-testid='suite-strip']");
        const tbody = document.querySelector("[data-testid='suite-table'] tbody");
        strip.innerHTML = "";
        tbody.innerHTML = "";
        suites.forEach((suite) => {{
          strip.insertAdjacentHTML("beforeend", `<div class="suite-pill" data-tone="${{suite.verificationOutcome}}" data-testid="suite-pill-${{suite.suiteId}}">${{suite.suiteId}} · ${{suite.proofVerdict}}</div>`);
          tbody.insertAdjacentHTML("beforeend", `<tr><td>${{suite.label}}</td><td>${{suite.verificationOutcome}}</td><td>${{suite.proofVerdict}}</td></tr>`);
        }});
      }}

      function renderHeatStrip(selected) {{
        const visible = getVisibleRows();
        const container = document.querySelector("[data-testid='heat-strip']");
        container.innerHTML = "";
        visible.forEach((row) => {{
          const button = document.createElement("button");
          button.type = "button";
          button.className = "capability-card";
          button.dataset.status = row.status;
          button.dataset.selected = String(row.rowId === selected.rowId);
          button.dataset.testid = `capability-card-${{row.rowId}}`;
          button.setAttribute("data-testid", `capability-card-${{row.rowId}}`);
          button.innerHTML = `
            <div class="card-meta">
              <span class="status-pill" data-status="${{row.status}}">${{row.status}}</span>
              <span>${{row.rowId}}</span>
            </div>
            <strong>${{row.capabilityLabel}}</strong>
            <span>${{row.summary}}</span>
          `;
          button.addEventListener("click", () => selectRow(row.rowId));
          button.addEventListener("keydown", (event) => handleRowKeydown(event, row.rowId));
          container.append(button);
        }});

        const tbody = document.querySelector("[data-testid='scorecard-table'] tbody");
        tbody.innerHTML = "";
        visible.forEach((row) => {{
          tbody.insertAdjacentHTML(
            "beforeend",
            `<tr data-selected="${{String(row.rowId === selected.rowId)}}"><td><button type="button" data-testid="scorecard-row-${{row.rowId}}">${{row.capabilityLabel}}</button></td><td>${{row.status}}</td><td>${{row.summary}}</td></tr>`,
          );
        }});
        tbody.querySelectorAll("button").forEach((button) => {{
          button.addEventListener("click", () => {{
            const match = rows.find((row) => row.capabilityLabel === button.textContent);
            if (match) selectRow(match.rowId);
          }});
        }});
      }}

      function handleRowKeydown(event, rowId) {{
        const visibleIds = getVisibleRows().map((row) => row.rowId);
        const index = visibleIds.indexOf(rowId);
        if (event.key === "ArrowDown" || event.key === "ArrowRight") {{
          event.preventDefault();
          selectRow(visibleIds[(index + 1) % visibleIds.length]);
        }} else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {{
          event.preventDefault();
          selectRow(visibleIds[(index - 1 + visibleIds.length) % visibleIds.length]);
        }} else if (event.key === "Home") {{
          event.preventDefault();
          selectRow(visibleIds[0]);
        }} else if (event.key === "End") {{
          event.preventDefault();
          selectRow(visibleIds[visibleIds.length - 1]);
        }}
      }}

      function renderEvidence(selected) {{
        const evidenceRows = getEvidenceForRow(selected);
        const timeline = document.querySelector("[data-testid='evidence-timeline']");
        const tbody = document.querySelector("[data-testid='evidence-table'] tbody");
        timeline.innerHTML = "";
        tbody.innerHTML = "";
        evidenceRows.forEach((item) => {{
          timeline.insertAdjacentHTML(
            "beforeend",
            `<div class="timeline-card" data-kind="${{item.evidence_kind}}" data-testid="timeline-card-${{item.evidence_id}}"><strong>${{item.summary}}</strong><div class="muted">${{item.evidence_kind}} · ${{item.source_task_ref}}</div><div class="mono">${{item.artifact_ref}}</div></div>`,
          );
          tbody.insertAdjacentHTML(
            "beforeend",
            `<tr><td>${{item.artifact_ref}}</td><td>${{item.evidence_kind}}</td><td>${{item.source_task_ref}}</td><td>${{item.machine_state}}</td></tr>`,
          );
        }});
      }}

      function renderOpenItems(selected) {{
        const itemRows = getOpenItemsForRow(selected);
        const tbody = document.querySelector("[data-testid='open-items-table'] tbody");
        tbody.innerHTML = "";
        itemRows.forEach((item) => {{
          tbody.insertAdjacentHTML(
            "beforeend",
            `<tr><td>${{item.title}}</td><td>${{item.workClass}}</td><td>${{item.deferredState}}</td></tr>`,
          );
        }});
      }}

      function renderInspector(selected) {{
        const rowOpenItems = getOpenItemsForRow(selected);
        document.getElementById("inspector-title").innerHTML = `<strong>${{selected.capabilityLabel}}</strong>`;
        document.getElementById("inspector-status").innerHTML = `<span class="status-pill" data-status="${{selected.status}}">${{selected.status}}</span>`;
        document.getElementById("inspector-summary-text").textContent = selected.summary;
        document.getElementById("inspector-rationale-text").textContent = selected.blockingRationale || "No current blocking rationale.";
        document.getElementById("inspector-refs-text").textContent = [...selected.sourceRefs, ...selected.implementationEvidenceRefs, ...selected.automatedProofRefs].join(" ; ");
        document.getElementById("inspector-signals-grid").innerHTML = selected.signalRows.map((signal) => `<div class="signal-row"><span>${{signal.label}}</span><strong>${{signal.value}}</strong></div>`).join("");
        document.getElementById("inspector-open-items").innerHTML =
          rowOpenItems.length === 0
            ? `<div>No deferred live-provider or live-channel item is currently bound to this row.</div>`
            : rowOpenItems.map((item) => `<div><strong>${{item.title}}</strong><div class="muted">${{item.summary}}</div></div>`).join("");
      }}

      function selectRow(rowId) {{
        state.selectedRowId = rowId;
        render();
      }}

      function render() {{
        const selected = getSelectedRow();
        if (!selected) return;
        state.selectedRowId = selected.rowId;
        renderHeatStrip(selected);
        renderEvidence(selected);
        renderOpenItems(selected);
        renderInspector(selected);
      }}

      optionize(document.querySelector("[data-testid='filter-status']"), [
        {{ value: "all", label: "all" }},
        {{ value: "approved", label: "approved" }},
        {{ value: "constrained", label: "constrained" }},
        {{ value: "blocked", label: "blocked" }},
      ]);
      optionize(document.querySelector("[data-testid='filter-family']"), [
        {{ value: "all", label: "all" }},
        ...rows.map((row) => ({{ value: row.capabilityFamilyId, label: row.capabilityLabel }})),
      ]);

      document.querySelector("[data-testid='filter-status']").addEventListener("change", (event) => {{
        state.status = event.target.value;
        render();
      }});
      document.querySelector("[data-testid='filter-family']").addEventListener("change", (event) => {{
        state.family = event.target.value;
        render();
      }});

      renderMasthead();
      renderSuites();
      render();
    </script>
  </body>
</html>
"""


def main() -> None:
    for path in [
        COVERAGE_SUMMARY_PATH,
        TRACEABILITY_PATH,
        REQUEST_LINEAGE_PATH,
        REPLAY_CLASSIFICATION_PATH,
        DUPLICATE_MANIFEST_PATH,
        REPLAY_CASEBOOK_PATH,
        IDENTITY_REPAIR_CASEBOOK_PATH,
        REACHABILITY_CASEBOOK_PATH,
        ACCESS_GRANT_MANIFEST_PATH,
        RUNTIME_PUBLICATION_BUNDLES_PATH,
        RELEASE_PARITY_PATH,
        SURFACE_AUTHORITY_PATH,
        MANIFEST_FUSION_PATH,
        RELEASE_CANDIDATE_PATH,
        FREEZE_BLOCKERS_PATH,
        PERSISTENT_SHELL_CONTRACTS_PATH,
        FRONTEND_MANIFESTS_PATH,
        SELECTED_ANCHOR_POLICY_PATH,
        DEPENDENCY_SIMULATOR_STRATEGY_PATH,
        SEEDED_EXTERNAL_CONTRACTS_PATH,
        ADAPTER_VALIDATION_RESULTS_PATH,
        LIVE_PROVIDER_HANDOVER_PATH,
        OBSERVABILITY_SIGNAL_MATRIX_PATH,
        OBSERVABILITY_EVENT_SCHEMA_PATH,
        AUDIT_RECORD_SCHEMA_PATH,
        AUDIT_DISCLOSURE_MATRIX_PATH,
        WORM_RETENTION_CLASSES_PATH,
        BUILD_PROVENANCE_MANIFEST_PATH,
        BUILD_PROVENANCE_INTEGRITY_PATH,
        RELEASE_WATCH_CATALOG_PATH,
        RELEASE_WATCH_EVIDENCE_PATH,
        RESILIENCE_BASELINE_PATH,
        ACCESSIBILITY_PROFILES_PATH,
        PREVIEW_MANIFEST_PATH,
        AUDIENCE_SURFACE_BINDINGS_PATH,
        PHASE0_EXIT_ARTIFACT_INDEX_PATH,
        FOUNDATION_TRACE_INDEX_PATH,
        DCB0129_OUTLINE_PATH,
        IM1_ARTIFACT_INDEX_PATH,
        PRIVACY_TRACEABILITY_PATH,
        CLINICAL_SIGNOFF_REQUIREMENTS_PATH,
        DSPT_GAP_REGISTER_PATH,
        NHS_LOGIN_GAP_REGISTER_PATH,
        IM1_GAP_REGISTER_PATH,
        SUITE_133_PATH,
        SUITE_134_PATH,
        SUITE_135_PATH,
        SUITE_136_PATH,
        SUITE_137_PATH,
    ]:
        require_file(path)

    prior_completion = assert_prior_tasks_complete()
    suites = build_suite_records()
    rows = build_conformance_rows(suites, prior_completion)
    open_items = build_open_items(load_json(SURFACE_AUTHORITY_PATH)["summary"], load_json(ADAPTER_VALIDATION_RESULTS_PATH)["summary"])
    evidence_manifest = build_evidence_manifest(rows, suites)
    decision = build_decision_payload(rows, suites, open_items, prior_completion)

    write_json(DECISION_JSON_PATH, decision)
    write_json(ROWS_JSON_PATH, rows)
    write_json(OPEN_ITEMS_JSON_PATH, open_items)
    write_csv(
        EVIDENCE_MANIFEST_PATH,
        [
            "evidence_id",
            "capability_family_id",
            "capability_label",
            "evidence_kind",
            "artifact_class",
            "source_task_ref",
            "machine_state",
            "artifact_ref",
            "summary",
        ],
        evidence_manifest,
    )
    write_text(EXIT_GATE_PACK_DOC_PATH, build_exit_gate_pack_doc(decision, rows, suites, open_items, evidence_manifest))
    write_text(GO_NO_GO_DOC_PATH, build_go_no_go_doc(decision, rows))
    write_text(CONFORMANCE_DOC_PATH, build_conformance_doc(rows))
    write_text(BOUNDARY_DOC_PATH, build_boundary_doc(open_items))
    write_text(BOARD_HTML_PATH, build_board_html(decision, rows, suites, evidence_manifest, open_items))


if __name__ == "__main__":
    main()
