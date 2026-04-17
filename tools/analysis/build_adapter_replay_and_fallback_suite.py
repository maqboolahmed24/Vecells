#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_INTEGRATION_DIR = ROOT / "data" / "integration"
DATA_TEST_DIR = ROOT / "data" / "test"
DOCS_TEST_DIR = ROOT / "docs" / "tests"

TASK_ID = "seq_135"
VISUAL_MODE = "Exception_Path_Lab"

REPLAY_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "replay_collision_casebook.json"
REPLAY_MATRIX_PATH = DATA_ANALYSIS_DIR / "replay_classification_matrix.csv"
IDEMPOTENCY_MANIFEST_PATH = DATA_ANALYSIS_DIR / "idempotency_record_manifest.json"
DUPLICATE_MANIFEST_PATH = DATA_ANALYSIS_DIR / "duplicate_cluster_manifest.json"
FALLBACK_MATRIX_PATH = DATA_ANALYSIS_DIR / "fallback_review_case_matrix.csv"
CLOSURE_BLOCKER_CASEBOOK_PATH = DATA_ANALYSIS_DIR / "closure_blocker_casebook.json"
REFERENCE_CASE_CATALOG_PATH = DATA_ANALYSIS_DIR / "reference_case_catalog.json"
FOUNDATION_DEMO_SCENARIOS_PATH = DATA_ANALYSIS_DIR / "foundation_demo_scenarios.csv"
REQUIREMENT_REGISTRY_PATH = DATA_ANALYSIS_DIR / "requirement_registry.jsonl"
DEPENDENCY_WATCHLIST_PATH = DATA_ANALYSIS_DIR / "dependency_watchlist.csv"
SCAN_POLICY_MATRIX_PATH = DATA_ANALYSIS_DIR / "35_scan_and_quarantine_policy_matrix.csv"
OBJECT_STORAGE_CLASS_MANIFEST_PATH = DATA_ANALYSIS_DIR / "object_storage_class_manifest.json"
ARTIFACT_QUARANTINE_POLICY_PATH = DATA_ANALYSIS_DIR / "artifact_quarantine_policy.json"
ADAPTER_SIMULATOR_MATRIX_PATH = DATA_INTEGRATION_DIR / "adapter_simulator_matrix.csv"
ADAPTER_VALIDATION_RESULTS_PATH = DATA_INTEGRATION_DIR / "adapter_validation_results.json"
CANONICAL_EVENT_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "canonical_event_contracts.json"
CANONICAL_EVENT_TO_TRANSPORT_PATH = DATA_ANALYSIS_DIR / "canonical_event_to_transport_mapping.json"

SUITE_DOC_PATH = DOCS_TEST_DIR / "135_adapter_replay_duplicate_quarantine_fallback_suite.md"
TRUTH_DOC_PATH = DOCS_TEST_DIR / "135_duplicate_cluster_and_fallback_truth_matrix.md"
LAB_HTML_PATH = DOCS_TEST_DIR / "135_exception_path_lab.html"

ADAPTER_REPLAY_CASES_PATH = DATA_TEST_DIR / "adapter_replay_cases.csv"
DUPLICATE_CLUSTER_CASES_PATH = DATA_TEST_DIR / "duplicate_cluster_cases.csv"
QUARANTINE_FALLBACK_CASES_PATH = DATA_TEST_DIR / "quarantine_fallback_cases.csv"
EVENT_EXPECTATIONS_PATH = DATA_TEST_DIR / "exception_path_event_expectations.json"
SUITE_RESULTS_PATH = DATA_TEST_DIR / "exception_path_suite_results.json"

SOURCE_PRECEDENCE = [
    "prompt/135.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#3. Non-negotiable invariants",
    "blueprint/phase-0-the-foundation-protocol.md#4.1 Command ingest and envelope creation",
    "blueprint/phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
    "blueprint/phase-0-the-foundation-protocol.md#4.3B Evidence immutability, derivation, and parity",
    "blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
    "blueprint/phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
    "blueprint/phase-0-the-foundation-protocol.md#1.12 RequestClosureRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.20 FallbackReviewCase",
    "blueprint/phase-1-the-red-flag-gate.md#Replay duplicate and safety-preemption law",
    "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
    "blueprint/forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
    "blueprint/forensic-audit-findings.md#Finding 61 - The event catalogue lacked attachment-quarantine events",
    "blueprint/forensic-audit-findings.md#Finding 63 - The event catalogue lacked fallback-review lifecycle events",
    "blueprint/forensic-audit-findings.md#Finding 65",
    "blueprint/forensic-audit-findings.md#Finding 83",
    "blueprint/forensic-audit-findings.md#Finding 84",
    "data/analysis/replay_collision_casebook.json",
    "data/analysis/replay_classification_matrix.csv",
    "data/analysis/idempotency_record_manifest.json",
    "data/analysis/duplicate_cluster_manifest.json",
    "data/analysis/fallback_review_case_matrix.csv",
    "data/analysis/closure_blocker_casebook.json",
    "data/analysis/reference_case_catalog.json",
    "data/analysis/foundation_demo_scenarios.csv",
    "data/analysis/35_scan_and_quarantine_policy_matrix.csv",
    "data/analysis/dependency_watchlist.csv",
    "data/integration/adapter_simulator_matrix.csv",
    "data/integration/adapter_validation_results.json",
    "data/analysis/object_storage_class_manifest.json",
    "data/analysis/artifact_quarantine_policy.json",
]

REQUIRED_CASE_FAMILIES = [
    "exact_submit_replay",
    "semantic_replay_or_collision_review",
    "review_required_duplicate_cluster",
    "same_request_attach_requires_proof",
    "adapter_callback_replay_safe",
    "quarantine_opens_fallback_review",
    "fallback_review_stays_explicit",
    "closure_blocked_while_review_open",
]

FULL_SURFACE_PROOF = "full_surface_proof"
PARTIAL_SURFACE_PROOF = "partial_surface_proof"
EXACT_MACHINE_PROOF = "exact_machine_proof"
BOUNDED_CONTRACT_PROOF = "bounded_contract_proof"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def slug(value: str) -> str:
    normalized = []
    for char in value.lower():
        normalized.append(char if char.isalnum() else "-")
    output = "".join(normalized)
    while "--" in output:
        output = output.replace("--", "-")
    return output.strip("-")


def unique(items: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


def to_refs(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if str(item).strip()]
    text = str(value).strip()
    if not text:
        return []
    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = json.loads(text.replace("'", '"'))
            if isinstance(parsed, list):
                return [str(item) for item in parsed if str(item).strip()]
        except json.JSONDecodeError:
            pass
    if " | " in text:
        return [segment.strip() for segment in text.split(" | ") if segment.strip()]
    if "; " in text:
        return [segment.strip() for segment in text.split("; ") if segment.strip()]
    return [text]


def row_pairs(*pairs: tuple[str, Any]) -> list[dict[str, str]]:
    return [{"label": label, "value": str(value)} for label, value in pairs]


def step(label: str, detail: str, state: str) -> dict[str, str]:
    return {"label": label, "detail": detail, "state": state}


def event_expectation(
    event_name: str,
    registry_state: str,
    obligation: str,
    notes: str,
    source_refs: list[str],
) -> dict[str, Any]:
    return {
        "eventName": event_name,
        "registryState": registry_state,
        "obligation": obligation,
        "notes": notes,
        "sourceRefs": source_refs,
    }


def markdown_escape(value: Any) -> str:
    text = str(value)
    return text.replace("\\", "\\\\").replace("|", "\\|").replace("\n", "<br>")


def markdown_table(headers: list[str], rows: list[list[Any]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    divider_row = "| " + " | ".join("---" for _ in headers) + " |"
    body_rows = [
        "| " + " | ".join(markdown_escape(cell) for cell in row) + " |" for row in rows
    ]
    return "\n".join([header_row, divider_row, *body_rows])


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def to_script_json(payload: Any) -> str:
    return json.dumps(payload, indent=2).replace("</", "<\\/")


def make_case(
    *,
    case_id: str,
    case_group: str,
    case_family: str,
    title: str,
    summary: str,
    case_accent: str,
    scenario_ref: str,
    route_family_ref: str,
    audience_surface_ref: str,
    browser_proof_state: str,
    machine_proof_state: str,
    browser_surface_refs: list[str],
    source_refs: list[str],
    evidence_refs: list[str],
    blocker_refs: list[str],
    gap_refs: list[str],
    event_expectations: list[dict[str, Any]],
    summary_rows: list[dict[str, str]],
    replay_rows: list[dict[str, str]],
    duplicate_rows: list[dict[str, str]],
    fallback_rows: list[dict[str, str]],
    evidence_rows: list[dict[str, str]],
    event_rows: list[dict[str, str]],
    blocker_rows: list[dict[str, str]],
    replay_steps: list[dict[str, str]],
    duplicate_nodes: list[dict[str, str]],
    fallback_stages: list[dict[str, str]],
    prior_authoritative_chain_count: int,
    duplicate_request_delta: int,
    duplicate_side_effect_delta: int,
    duplicate_closure_side_effect_delta: int,
    closure_blocked: bool,
    continuity_outcome: str,
    patient_visible_state: str,
    continuity_witness_class: str = "none",
    safety_reassessment_contract: str = "not_applicable",
) -> dict[str, Any]:
    return {
        "caseId": case_id,
        "slug": slug(case_id),
        "caseGroup": case_group,
        "caseFamily": case_family,
        "title": title,
        "summary": summary,
        "caseAccent": case_accent,
        "scenarioRef": scenario_ref,
        "routeFamilyRef": route_family_ref,
        "audienceSurfaceRef": audience_surface_ref,
        "browserProofState": browser_proof_state,
        "machineProofState": machine_proof_state,
        "browserSurfaceRefs": browser_surface_refs,
        "sourceRefs": source_refs,
        "evidenceRefs": evidence_refs,
        "blockerRefs": blocker_refs,
        "gapRefs": gap_refs,
        "eventExpectations": event_expectations,
        "summaryRows": summary_rows,
        "replayRows": replay_rows,
        "duplicateRows": duplicate_rows,
        "fallbackRows": fallback_rows,
        "evidenceRows": evidence_rows,
        "eventRows": event_rows,
        "blockerRows": blocker_rows,
        "replaySteps": replay_steps,
        "duplicateNodes": duplicate_nodes,
        "fallbackStages": fallback_stages,
        "priorAuthoritativeChainCount": prior_authoritative_chain_count,
        "duplicateRequestDelta": duplicate_request_delta,
        "duplicateSideEffectDelta": duplicate_side_effect_delta,
        "duplicateClosureSideEffectDelta": duplicate_closure_side_effect_delta,
        "closureBlocked": closure_blocked,
        "continuityOutcome": continuity_outcome,
        "patientVisibleState": patient_visible_state,
        "continuityWitnessClass": continuity_witness_class,
        "safetyReassessmentContract": safety_reassessment_contract,
    }


def build_case_payloads() -> dict[str, Any]:
    replay_casebook = read_json(REPLAY_CASEBOOK_PATH)
    replay_cases_by_scenario = {
        row["scenarioId"]: row for row in replay_casebook["replayCases"]
    }
    replay_matrix_rows = read_csv(REPLAY_MATRIX_PATH)
    replay_matrix_by_scenario = {row["scenario_id"]: row for row in replay_matrix_rows}

    idempotency_manifest = read_json(IDEMPOTENCY_MANIFEST_PATH)
    idempotency_by_scenario = {
        row["scenarioId"]: row for row in idempotency_manifest["idempotencyRecords"]
    }
    replay_reviews_by_record = {
        row["idempotencyRecordRef"]: row for row in idempotency_manifest["replayCollisionReviews"]
    }
    dispatch_attempts_by_record = {
        row["idempotencyRecordRef"]: row for row in idempotency_manifest["adapterDispatchAttempts"]
    }

    duplicate_manifest = read_json(DUPLICATE_MANIFEST_PATH)
    duplicate_clusters_by_scenario = {
        row["scenarioId"]: row for row in duplicate_manifest["clusters"]
    }
    duplicate_decisions_by_cluster = {
        row["duplicateClusterRef"]: row for row in duplicate_manifest["decisions"]
    }

    fallback_matrix_rows = read_csv(FALLBACK_MATRIX_PATH)
    fallback_row = fallback_matrix_rows[0]
    closure_casebook = read_json(CLOSURE_BLOCKER_CASEBOOK_PATH)
    closure_history_by_scenario = {
        row["scenarioId"]: row for row in closure_casebook["closureHistory"]
    }

    reference_catalog = read_json(REFERENCE_CASE_CATALOG_PATH)
    reference_flow_by_id = {
        row["referenceCaseId"]: row for row in reference_catalog["referenceFlowCases"]
    }
    foundation_demo_rows = read_csv(FOUNDATION_DEMO_SCENARIOS_PATH)
    foundation_demo_by_ref_flow = {
        row["reference_flow_case_ref"]: row
        for row in foundation_demo_rows
        if row["reference_flow_case_ref"]
    }

    requirement_rows = read_jsonl(REQUIREMENT_REGISTRY_PATH)
    requirement_by_id = {row["requirement_id"]: row for row in requirement_rows}
    req_inv_026 = requirement_by_id["REQ-INV-026"]

    dependency_watchlist = read_csv(DEPENDENCY_WATCHLIST_PATH)
    dependency_by_id = {row["dependency_id"]: row for row in dependency_watchlist}
    malware_dependency = dependency_by_id["dep_malware_scanning_provider"]

    scan_policy_rows = read_csv(SCAN_POLICY_MATRIX_PATH)
    scan_policy_by_id = {row["policy_row_id"]: row for row in scan_policy_rows}
    suspicious_policy = scan_policy_by_id["SCAN_POLICY_SUSPICIOUS_HOLD"]
    unreadable_policy = scan_policy_by_id["SCAN_POLICY_UNREADABLE_RETRY"]

    object_storage_manifest = read_json(OBJECT_STORAGE_CLASS_MANIFEST_PATH)
    seed_catalog_by_fixture = {
        row["fixture_ref"]: row for row in object_storage_manifest["seed_catalog"]
    }

    quarantine_policy = read_json(ARTIFACT_QUARANTINE_POLICY_PATH)
    quarantine_rules_by_trigger = {
        row["triggerRef"]: row for row in quarantine_policy["rules"]
    }

    adapter_simulator_rows = read_csv(ADAPTER_SIMULATOR_MATRIX_PATH)
    adapter_simulator_by_id = {row["adapterId"]: row for row in adapter_simulator_rows}
    malware_adapter = adapter_simulator_by_id["adp_malware_artifact_scanning"]

    adapter_validation_results = read_json(ADAPTER_VALIDATION_RESULTS_PATH)
    adapter_validation_by_id = {
        row["adapterId"]: row for row in adapter_validation_results["rows"]
    }
    malware_validation = adapter_validation_by_id["adp_malware_artifact_scanning"]

    canonical_event_contracts = read_json(CANONICAL_EVENT_CONTRACTS_PATH)
    canonical_event_text = json.dumps(canonical_event_contracts)
    canonical_event_transport = read_json(CANONICAL_EVENT_TO_TRANSPORT_PATH)
    canonical_event_transport_text = json.dumps(canonical_event_transport)

    def published_event_state(event_name: str) -> str:
        published = event_name in canonical_event_text and event_name in canonical_event_transport_text
        return "published" if published else "bounded_gap"

    flow_replay = reference_flow_by_id["RC_FLOW_002"]
    flow_duplicate = reference_flow_by_id["RC_FLOW_003"]
    flow_fallback = reference_flow_by_id["RC_FLOW_004"]
    demo_replay = foundation_demo_by_ref_flow["RC_FLOW_002"]
    demo_duplicate = foundation_demo_by_ref_flow["RC_FLOW_003"]
    demo_fallback = foundation_demo_by_ref_flow["RC_FLOW_004"]

    replay_exact = replay_cases_by_scenario["repeated_browser_taps_identical_raw_payloads"]
    replay_semantic = replay_cases_by_scenario["semantically_identical_transport_variance"]
    replay_collision = replay_cases_by_scenario["reused_source_command_id_changed_semantics"]
    replay_callback = replay_cases_by_scenario["duplicate_callbacks_and_out_of_order_provider_receipts"]
    replay_outbox = replay_cases_by_scenario["delayed_duplicate_jobs_from_outbox"]

    matrix_exact = replay_matrix_by_scenario["repeated_browser_taps_identical_raw_payloads"]
    matrix_semantic = replay_matrix_by_scenario["semantically_identical_transport_variance"]
    matrix_collision = replay_matrix_by_scenario["reused_source_command_id_changed_semantics"]
    matrix_callback = replay_matrix_by_scenario["duplicate_callbacks_and_out_of_order_provider_receipts"]
    matrix_outbox = replay_matrix_by_scenario["delayed_duplicate_jobs_from_outbox"]

    idem_exact = idempotency_by_scenario["repeated_browser_taps_identical_raw_payloads"]
    idem_semantic = idempotency_by_scenario["semantically_identical_transport_variance"]
    idem_collision = idempotency_by_scenario["reused_source_command_id_changed_semantics"]
    idem_callback = idempotency_by_scenario["duplicate_callbacks_and_out_of_order_provider_receipts"]
    idem_outbox = idempotency_by_scenario["delayed_duplicate_jobs_from_outbox"]

    callback_review = replay_reviews_by_record[idem_callback["idempotencyRecordId"]]
    callback_dispatch = dispatch_attempts_by_record[idem_callback["idempotencyRecordId"]]

    duplicate_review_cluster = duplicate_clusters_by_scenario["same_episode_candidate_high_similarity"]
    duplicate_attach_cluster = duplicate_clusters_by_scenario["same_request_continuation_with_witness"]
    duplicate_conflict_cluster = duplicate_clusters_by_scenario["conflicting_candidates_low_margin"]
    duplicate_retry_cluster = duplicate_clusters_by_scenario["exact_retry_collapse"]

    duplicate_review_decision = duplicate_decisions_by_cluster[duplicate_review_cluster["clusterId"]]
    duplicate_attach_decision = duplicate_decisions_by_cluster[duplicate_attach_cluster["clusterId"]]
    duplicate_conflict_decision = duplicate_decisions_by_cluster[duplicate_conflict_cluster["clusterId"]]
    duplicate_retry_decision = duplicate_decisions_by_cluster[duplicate_retry_cluster["clusterId"]]

    closure_duplicate = closure_history_by_scenario["defer_duplicate_review_open"]
    closure_fallback = closure_history_by_scenario["defer_fallback_review_after_degraded_progress"]

    cases: list[dict[str, Any]] = []

    cases.append(
        make_case(
            case_id="CASE_135_EXACT_SUBMIT_REPLAY",
            case_group="adapter_replay",
            case_family="exact_submit_replay",
            title="Exact submit replay returns the prior authoritative settlement",
            summary="Repeated submit taps reuse the existing settlement chain and keep duplicate request and side-effect deltas at zero.",
            case_accent="replay",
            scenario_ref=replay_exact["scenarioId"],
            route_family_ref=demo_replay["route_family_ref"],
            audience_surface_ref=demo_replay["audience_surface_ref"],
            browser_proof_state=demo_replay["proof_posture"],
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/67_replay_collision_studio.html",
                "docs/programme/128_reference_flow_observatory.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + to_refs(replay_exact["sourceRefs"])
                + to_refs(idem_exact["sourceRefs"])
                + flow_replay["provesRuleRefs"]
            ),
            evidence_refs=[
                "data/analysis/replay_collision_casebook.json#repeated_browser_taps_identical_raw_payloads",
                "data/analysis/replay_classification_matrix.csv#repeated_browser_taps_identical_raw_payloads",
                "data/analysis/idempotency_record_manifest.json#IDR_067_BROWSER_PRIMARY",
                "data/analysis/reference_case_catalog.json#RC_FLOW_002",
                "data/analysis/foundation_demo_scenarios.csv#P0_SCN_002_EXACT_REPLAY",
            ],
            blocker_refs=[],
            gap_refs=flow_replay.get("gapRefs", []),
            event_expectations=[
                event_expectation(
                    "intake.promotion.replay_returned",
                    "bounded_gap",
                    "Replay returns the prior authoritative settlement without minting a second request.",
                    "The synthetic reference flow names the replay-return event explicitly while the canonical registry row remains a bounded gap.",
                    [
                        "data/analysis/reference_case_catalog.json#RC_FLOW_002",
                        "blueprint/phase-1-the-red-flag-gate.md#Replay duplicate and safety-preemption law",
                    ],
                )
            ],
            summary_rows=row_pairs(
                ("Decision class", idem_exact["decisionClass"]),
                ("Prior authoritative chain count", 1),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Browser proof state", demo_replay["proof_posture"]),
            ),
            replay_rows=row_pairs(
                ("Scenario", replay_exact["scenarioId"]),
                ("Returned settlement ref", idem_exact["acceptedSettlementRef"]),
                ("Action scope", matrix_exact["action_scope"]),
                ("Effect scope relation", matrix_exact["effect_scope_relation"]),
                ("Timeline", " > ".join(replay_exact["timeline"])),
            ),
            duplicate_rows=row_pairs(
                ("Replay key", idem_exact["replayKey"]),
                ("Scope fingerprint", idem_exact["scopeFingerprint"]),
                ("Blocked automatic mutation", matrix_exact["blocked_automatic_mutation"]),
                ("Review state", "not_required"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "not_opened"),
                ("Patient-visible continuity", "Prior request stays visible and read-only."),
                ("Closure blocked", "no"),
                ("Closure side-effect delta", 0),
            ),
            evidence_rows=row_pairs(
                ("Replay matrix row", matrix_exact["record_ref"]),
                ("Idempotency record", idem_exact["idempotencyRecordId"]),
                ("Reference flow case", "RC_FLOW_002"),
                ("Case digest", "rftrace::2e64757bd0e65fc3"),
            ),
            event_rows=row_pairs(
                ("Expected event", "intake.promotion.replay_returned"),
                ("Registry state", "bounded_gap"),
                ("New request created", "no"),
                ("New side effect created", "no"),
            ),
            blocker_rows=row_pairs(
                ("Blocker set", "none"),
                ("Closure blocked", "no"),
            ),
            replay_steps=[
                step("Initial acceptance", "The first submit owns the only authoritative settlement chain.", "safe"),
                step("Exact replay", "The same replay key and scope fingerprint return the prior settlement.", "replay"),
                step("Continuity", "The shell stays on the same request lineage instead of showing a new request.", "continuity"),
            ],
            duplicate_nodes=[
                step("Canonical request", "The original request stays canonical.", "safe"),
                step("Replay signal", "Deterministic replay authority collapses the duplicate tap.", "replay"),
                step("Auto-merge", "No merge occurs because no second request is created.", "safe"),
            ],
            fallback_stages=[
                step("Quarantine", "No quarantine trigger is opened in the exact replay path.", "safe"),
                step("Manual review", "No fallback or duplicate review work is created.", "safe"),
                step("Closure", "Closure truth remains unchanged because no new blocker is added.", "safe"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=False,
            continuity_outcome=flow_replay["shellContinuityExpectation"],
            patient_visible_state="read_only_return",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_SEMANTIC_REPLAY_RETURN",
            case_group="adapter_replay",
            case_family="semantic_replay_or_collision_review",
            title="Semantic replay returns the prior authoritative outcome without silent collapse",
            summary="Transport-only variance is tolerated, but the semantic replay still returns the prior chain rather than creating fresh business truth.",
            case_accent="replay",
            scenario_ref=replay_semantic["scenarioId"],
            route_family_ref="rf_support_replay_observe",
            audience_surface_ref="surf_support_replay_observe",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/67_replay_collision_studio.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + to_refs(replay_semantic["sourceRefs"])
                + to_refs(idem_semantic["sourceRefs"])
            ),
            evidence_refs=[
                "data/analysis/replay_collision_casebook.json#semantically_identical_transport_variance",
                "data/analysis/replay_classification_matrix.csv#semantically_identical_transport_variance",
                "data/analysis/idempotency_record_manifest.json#IDR_067_BROWSER_SEMANTIC",
            ],
            blocker_refs=[],
            gap_refs=[],
            event_expectations=[],
            summary_rows=row_pairs(
                ("Decision class", idem_semantic["decisionClass"]),
                ("Prior authoritative chain count", 1),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Browser proof state", FULL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Scenario", replay_semantic["scenarioId"]),
                ("Returned settlement ref", idem_semantic["acceptedSettlementRef"]),
                ("Raw hash relation", matrix_semantic["raw_hash_relation"]),
                ("Semantic hash relation", matrix_semantic["semantic_hash_relation"]),
                ("Timeline", " > ".join(replay_semantic["timeline"])),
            ),
            duplicate_rows=row_pairs(
                ("Replay key", idem_semantic["replayKey"]),
                ("Scope fingerprint", idem_semantic["scopeFingerprint"]),
                ("Blocked automatic mutation", matrix_semantic["blocked_automatic_mutation"]),
                ("Review state", "not_required"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "not_opened"),
                ("Continuity state", "Prior authoritative return"),
                ("Closure blocked", "no"),
                ("Patient-visible state", "unchanged"),
            ),
            evidence_rows=row_pairs(
                ("Replay matrix row", matrix_semantic["record_ref"]),
                ("Idempotency record", idem_semantic["idempotencyRecordId"]),
                ("Raw payload relation", "transport_noise_only"),
                ("Decision basis", idem_semantic["decisionBasisRef"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "none_additional"),
                ("Registry state", "not_required"),
                ("New request created", "no"),
                ("New side effect created", "no"),
            ),
            blocker_rows=row_pairs(
                ("Blocker set", "none"),
                ("Closure blocked", "no"),
            ),
            replay_steps=[
                step("Initial acceptance", "The first accepted command stays authoritative.", "safe"),
                step("Semantic replay", "Transport noise is canonicalized away and the previous chain is returned.", "replay"),
                step("No hidden merge", "The replay stays explicit instead of silently reminting request truth.", "continuity"),
            ],
            duplicate_nodes=[
                step("Canonical replay key", "The semantic payload hash still resolves to the same replay key.", "replay"),
                step("Existing chain", "The prior authoritative settlement is returned.", "safe"),
                step("Fresh mutation", "No fresh mutation or closure side effect appears.", "safe"),
            ],
            fallback_stages=[
                step("Quarantine", "No quarantine trigger is required for transport-only variance.", "safe"),
                step("Manual review", "No review case is needed when the semantic payload is unchanged.", "safe"),
                step("Closure", "Closure stays unaffected because the duplicate delta is zero.", "safe"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=False,
            continuity_outcome="Prior authoritative outcome returned after semantic replay classification.",
            patient_visible_state="unchanged",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_SOURCE_COLLISION_REVIEW",
            case_group="adapter_replay",
            case_family="semantic_replay_or_collision_review",
            title="Semantically divergent source reuse opens explicit collision review",
            summary="Reuse of the same source command id with changed semantics is blocked into explicit review instead of being collapsed or merged.",
            case_accent="review",
            scenario_ref=replay_collision["scenarioId"],
            route_family_ref="rf_support_ticket_workspace",
            audience_surface_ref="surf_support_ticket_workspace",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/67_replay_collision_studio.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + to_refs(replay_collision["sourceRefs"])
                + to_refs(idem_collision["sourceRefs"])
            ),
            evidence_refs=[
                "data/analysis/replay_collision_casebook.json#reused_source_command_id_changed_semantics",
                "data/analysis/replay_classification_matrix.csv#reused_source_command_id_changed_semantics",
                "data/analysis/idempotency_record_manifest.json#IDR_067_SOURCE_COLLISION",
            ],
            blocker_refs=[replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["replayCollisionReviewId"]],
            gap_refs=[],
            event_expectations=[],
            summary_rows=row_pairs(
                ("Decision class", idem_collision["decisionClass"]),
                ("Collision class", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["collisionClass"]),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Browser proof state", FULL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Scenario", replay_collision["scenarioId"]),
                ("Action scope", matrix_collision["action_scope"]),
                ("Scope relation", matrix_collision["scope_relation"]),
                ("Blocked automatic mutation", matrix_collision["blocked_automatic_mutation"]),
                ("Timeline", " > ".join(replay_collision["timeline"])),
            ),
            duplicate_rows=row_pairs(
                ("Replay collision review", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["replayCollisionReviewId"]),
                ("Review state", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["reviewState"]),
                ("Existing settlement ref", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["existingSettlementRef"]),
                ("Auto-merge", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "review_required"),
                ("Patient-visible continuity", "The original chain remains authoritative while review is open."),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "under_manual_review"),
            ),
            evidence_rows=row_pairs(
                ("Replay matrix row", matrix_collision["record_ref"]),
                ("Idempotency record", idem_collision["idempotencyRecordId"]),
                ("Collision review ref", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["replayCollisionReviewId"]),
                ("Existing action ref", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["existingActionRecordRef"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "review_work_opened"),
                ("Registry state", "machine-visible-only"),
                ("New request created", "no"),
                ("New side effect created", "no"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", replay_reviews_by_record[idem_collision["idempotencyRecordId"]]["replayCollisionReviewId"]),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Initial acceptance", "The first command remains authoritative.", "safe"),
                step("Semantic drift", "The reused source id carries changed semantics and cannot collapse.", "review"),
                step("Collision review", "Review opens explicitly and blocks automatic mutation.", "blocked"),
            ],
            duplicate_nodes=[
                step("Source id reuse", "The same source command id is reused.", "review"),
                step("Semantic divergence", "The payload hash diverges from the authoritative chain.", "blocked"),
                step("Review queue", "The review remains open instead of auto-merging.", "review"),
            ],
            fallback_stages=[
                step("Quarantine", "The divergent replay is quarantined into review rather than applied.", "review"),
                step("Manual review", "Operator review is required before any further mutation.", "blocked"),
                step("Closure", "Closure remains blocked until the review is resolved.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="The authoritative settlement stays visible while replay collision review remains open.",
            patient_visible_state="under_manual_review",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_CALLBACK_RECEIPT_REPLAY",
            case_group="adapter_replay",
            case_family="adapter_callback_replay_safe",
            title="Duplicate and out-of-order adapter receipts never mint a second domain mutation",
            summary="Adapter callback replay may extend the authoritative receipt chain once, but semantic replay receipts and stale receipts keep duplicate mutation and closure-side-effect deltas at zero.",
            case_accent="review",
            scenario_ref=replay_callback["scenarioId"],
            route_family_ref="rf_support_replay_observe",
            audience_surface_ref="surf_support_replay_observe",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/67_replay_collision_studio.html",
                "docs/integrations/129_adapter_validation_console.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + to_refs(replay_callback["sourceRefs"])
                + to_refs(idem_callback["sourceRefs"])
                + to_refs(callback_review["summary"])
            ),
            evidence_refs=[
                "data/analysis/replay_collision_casebook.json#duplicate_callbacks_and_out_of_order_provider_receipts",
                "data/analysis/replay_classification_matrix.csv#duplicate_callbacks_and_out_of_order_provider_receipts",
                "data/analysis/idempotency_record_manifest.json#IDR_067_CALLBACK_SCOPE_DRIFT",
                "data/analysis/idempotency_record_manifest.json#ADA_067_BOOKING_PRIMARY",
                "data/analysis/idempotency_record_manifest.json#ARC_067_ACCEPTED_NEW",
            ],
            blocker_refs=[callback_review["replayCollisionReviewId"]],
            gap_refs=[],
            event_expectations=[],
            summary_rows=row_pairs(
                ("Decision class", idem_callback["decisionClass"]),
                ("Collision class", callback_review["collisionClass"]),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Duplicate closure side-effect delta", 0),
            ),
            replay_rows=row_pairs(
                ("Scenario", replay_callback["scenarioId"]),
                ("Timeline", " > ".join(replay_callback["timeline"])),
                ("Provider correlation ref", callback_dispatch["providerCorrelationRef"]),
                ("Confirmed settlement ref", callback_dispatch["confirmedSettlementRef"]),
                ("Dispatch status", callback_dispatch["status"]),
            ),
            duplicate_rows=row_pairs(
                ("Accepted new receipt", "1"),
                ("Semantic replay receipts", "1"),
                ("Stale receipts ignored", "1"),
                ("Scope drift collision", callback_review["reviewState"]),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "review_required"),
                ("Continuity state", "Same receipt chain, no second mutation."),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "under_manual_review"),
            ),
            evidence_rows=row_pairs(
                ("Idempotency record", idem_callback["idempotencyRecordId"]),
                ("Replay collision review", callback_review["replayCollisionReviewId"]),
                ("Dispatch attempt", callback_dispatch["dispatchAttemptId"]),
                ("Expected settlement ref", callback_dispatch["confirmedSettlementRef"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "settlement_chain_only"),
                ("Registry state", "not_required"),
                ("Second authoritative mutation", "forbidden"),
                ("Second closure side effect", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", callback_review["replayCollisionReviewId"]),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("First callback", "The first accepted receipt creates the only authoritative receipt chain.", "safe"),
                step("Receipt replay", "Semantic replay receipts are deduped onto the same chain.", "replay"),
                step("Scope drift", "Out-of-order or divergent callbacks open explicit collision review.", "blocked"),
            ],
            duplicate_nodes=[
                step("Dispatch attempt", "The same effect key stays attached to one dispatch attempt.", "safe"),
                step("Receipt window", "The callback window enforces accepted-new, replay, and stale states distinctly.", "review"),
                step("No double mutation", "No second domain mutation or closure side effect is allowed.", "safe"),
            ],
            fallback_stages=[
                step("Quarantine", "Divergent callbacks route into explicit review.", "review"),
                step("Manual review", "The callback chain stays operator-visible.", "review"),
                step("Closure", "Closure stays blocked until replay review is cleared.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="The authoritative callback chain advances once and then remains explicit under replay review.",
            patient_visible_state="under_manual_review",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_OUTBOX_DUPLICATE_REUSED",
            case_group="adapter_replay",
            case_family="adapter_callback_replay_safe",
            title="Delayed duplicate outbox jobs reuse the dispatch attempt instead of re-firing effects",
            summary="A late duplicate outbox job remains visible in the replay proof, but the dispatch attempt is reused and no second effect escapes.",
            case_accent="replay",
            scenario_ref=replay_outbox["scenarioId"],
            route_family_ref="rf_support_replay_observe",
            audience_surface_ref="surf_support_replay_observe",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/67_replay_collision_studio.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + to_refs(replay_outbox["sourceRefs"])
                + to_refs(idem_outbox["sourceRefs"])
            ),
            evidence_refs=[
                "data/analysis/replay_collision_casebook.json#delayed_duplicate_jobs_from_outbox",
                "data/analysis/replay_classification_matrix.csv#delayed_duplicate_jobs_from_outbox",
                "data/analysis/idempotency_record_manifest.json#IDR_067_OUTBOX_DISTINCT",
            ],
            blocker_refs=[],
            gap_refs=[],
            event_expectations=[],
            summary_rows=row_pairs(
                ("Decision class", idem_outbox["decisionClass"]),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Dispatch attempt reuse", "required"),
                ("Browser proof state", FULL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Scenario", replay_outbox["scenarioId"]),
                ("Timeline", " > ".join(replay_outbox["timeline"])),
                ("Action scope", matrix_outbox["action_scope"]),
                ("Effect scope relation", matrix_outbox["effect_scope_relation"]),
                ("Blocked automatic mutation", matrix_outbox["blocked_automatic_mutation"]),
            ),
            duplicate_rows=row_pairs(
                ("Primary settlement ref", idem_outbox["acceptedSettlementRef"]),
                ("Dispatch attempt", "created_then_reused"),
                ("Outbox duplicate", "visible"),
                ("Fresh effect", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "not_opened"),
                ("Continuity state", "Same authoritative dispatch chain."),
                ("Closure blocked", "no"),
                ("Patient-visible state", "unchanged"),
            ),
            evidence_rows=row_pairs(
                ("Idempotency record", idem_outbox["idempotencyRecordId"]),
                ("Replay matrix row", matrix_outbox["record_ref"]),
                ("Canonicalization note", idem_outbox["canonicalizationNote"]),
                ("Effect scope label", idem_outbox["effectScopeLabel"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "dispatch_attempt_reused"),
                ("Registry state", "machine-visible-only"),
                ("Second downstream effect", "forbidden"),
                ("Second request", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker set", "none"),
                ("Closure blocked", "no"),
            ),
            replay_steps=[
                step("Primary dispatch", "The first outbox job creates the dispatch attempt.", "safe"),
                step("Late duplicate", "The delayed duplicate job is still observable in the replay ledger.", "replay"),
                step("Effect reuse", "The dispatch attempt is reused instead of firing a second effect.", "safe"),
            ],
            duplicate_nodes=[
                step("Effect scope", "The effect scope key stays unchanged.", "safe"),
                step("Duplicate job", "The duplicate outbox path remains explicit.", "replay"),
                step("Downstream side effects", "No second downstream effect escapes.", "safe"),
            ],
            fallback_stages=[
                step("Quarantine", "No quarantine or manual fallback is required.", "safe"),
                step("Manual review", "The outbox duplicate remains replay-safe without operator intervention.", "safe"),
                step("Closure", "Closure truth is unchanged.", "safe"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=False,
            continuity_outcome="The delayed outbox duplicate stays visible but reuses the same effect chain.",
            patient_visible_state="unchanged",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_DUPLICATE_CLUSTER_REVIEW_REQUIRED",
            case_group="duplicate_cluster",
            case_family="review_required_duplicate_cluster",
            title="High-similarity duplicate clusters stay visible and closure-blocking",
            summary="A review-required duplicate cluster remains explicit in the machine-readable matrix and the browser lab instead of disappearing into normal flow.",
            case_accent="review",
            scenario_ref=duplicate_review_cluster["scenarioId"],
            route_family_ref=demo_duplicate["route_family_ref"],
            audience_surface_ref=demo_duplicate["audience_surface_ref"],
            browser_proof_state=demo_duplicate["proof_posture"],
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/70_duplicate_resolution_workbench.html",
                "docs/programme/128_reference_flow_observatory.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + duplicate_review_cluster["sourceRefs"]
                + flow_duplicate["provesRuleRefs"]
            ),
            evidence_refs=[
                "data/analysis/duplicate_cluster_manifest.json#DCL_070_SAME_EPISODE",
                "data/analysis/reference_case_catalog.json#RC_FLOW_003",
                "data/analysis/foundation_demo_scenarios.csv#P0_SCN_003_COLLISION_REVIEW",
            ],
            blocker_refs=unique(
                [duplicate_review_cluster["clusterId"]] + flow_duplicate["expectedClosureBlockers"]
            ),
            gap_refs=flow_duplicate.get("gapRefs", []),
            event_expectations=[
                event_expectation(
                    "request.duplicate.review_required",
                    published_event_state("request.duplicate.review_required"),
                    "A thin-margin duplicate cluster must stay explicit review work.",
                    "The duplicate review path must never auto-merge or collapse into the ordinary new-lineage flow.",
                    [
                        "data/analysis/duplicate_cluster_manifest.json#DCL_070_SAME_EPISODE",
                        "data/analysis/reference_case_catalog.json#RC_FLOW_003",
                    ],
                ),
                event_expectation(
                    "request.closure_blockers.changed",
                    published_event_state("request.closure_blockers.changed"),
                    "Duplicate review blockers remain visible on the lineage.",
                    "Closure blocker truth must stay orthogonal to workflow milestones.",
                    [
                        "data/analysis/closure_blocker_casebook.json#defer_duplicate_review_open",
                        "data/analysis/reference_case_catalog.json#RC_FLOW_003",
                    ],
                ),
            ],
            summary_rows=row_pairs(
                ("Decision class", duplicate_review_decision["decisionClass"]),
                ("Review status", duplicate_review_cluster["reviewStatus"]),
                ("Closure blocker active", duplicate_review_cluster["closureBlockerActive"]),
                ("Auto-merge", "forbidden"),
                ("Browser proof state", demo_duplicate["proof_posture"]),
            ),
            replay_rows=row_pairs(
                ("Replay classification", "review_required_duplicate_cluster"),
                ("Settlement expectation", "review_required_same_shell_recovery"),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Reference flow case", "RC_FLOW_003"),
            ),
            duplicate_rows=row_pairs(
                ("Cluster id", duplicate_review_cluster["clusterId"]),
                ("Instability state", duplicate_review_cluster["instabilityState"]),
                ("Current decision", duplicate_review_decision["duplicateResolutionDecisionId"]),
                ("Reason codes", ", ".join(duplicate_review_decision["reasonCodes"])),
                ("Canonical request id", duplicate_review_cluster["canonicalRequestId"]),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "review_required"),
                ("Patient-visible continuity", flow_duplicate["shellContinuityExpectation"]),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "recovery_only"),
            ),
            evidence_rows=row_pairs(
                ("Duplicate cluster", duplicate_review_cluster["clusterId"]),
                ("Resolution decision", duplicate_review_decision["duplicateResolutionDecisionId"]),
                ("Reference flow blockers", ", ".join(flow_duplicate["expectedClosureBlockers"])),
                ("Foundation scenario", "P0_SCN_003_COLLISION_REVIEW"),
            ),
            event_rows=row_pairs(
                ("Expected event", "request.duplicate.review_required"),
                ("Closure blocker event", "request.closure_blockers.changed"),
                ("Registry state", "published"),
                ("Auto-merge hidden", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", duplicate_review_cluster["clusterId"]),
                ("Closure blocker ref", "command_api_duplicate_review_duplicate_cluster_0006"),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Pair scoring", "The duplicate pair is scored but remains unresolved.", "review"),
                step("Review required", "The margin is too thin to attach or separate automatically.", "blocked"),
                step("Continuity", "The same shell exposes duplicate-review debt instead of hiding it.", "continuity"),
            ],
            duplicate_nodes=[
                step("Candidate A", "One same-episode candidate remains viable.", "review"),
                step("Candidate B", "A second candidate remains too close to settle automatically.", "review"),
                step("Cluster state", "The cluster stays in review and blocks closure.", "blocked"),
            ],
            fallback_stages=[
                step("Quarantine", "The duplicate cluster is kept explicit and closure-blocking.", "review"),
                step("Manual review", "Human review is required before any merge or separation can settle.", "review"),
                step("Closure", "Closure remains blocked while the review-required cluster is open.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome=flow_duplicate["shellContinuityExpectation"],
            patient_visible_state="recovery_only",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_SAME_REQUEST_ATTACH_PROVEN",
            case_group="duplicate_cluster",
            case_family="same_request_attach_requires_proof",
            title="Same-request continuation attaches only after explicit witness",
            summary="Attach is legal only after a workflow-return witness exists, and safety reassessment remains mandatory whenever the continued facts are materially different.",
            case_accent="continuity",
            scenario_ref=duplicate_attach_cluster["scenarioId"],
            route_family_ref="rf_patient_messages",
            audience_surface_ref="surf_patient_messages",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/70_duplicate_resolution_workbench.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + duplicate_attach_cluster["sourceRefs"]
                + [
                    "docs/architecture/70_duplicate_resolution_rules.md",
                    "packages/event-contracts/src/index.ts#safety.reassessed",
                ]
            ),
            evidence_refs=[
                "data/analysis/duplicate_cluster_manifest.json#DCL_070_ATTACH",
                "data/analysis/duplicate_cluster_manifest.json#DDR_070_ATTACH_APPLIED",
            ],
            blocker_refs=[],
            gap_refs=[],
            event_expectations=[
                event_expectation(
                    "request.duplicate.attach_applied",
                    published_event_state("request.duplicate.attach_applied"),
                    "Attach may settle only after explicit continuity proof is present.",
                    "The workbench rules require a workflow-return witness before same-request attach is legal.",
                    [
                        "data/analysis/duplicate_cluster_manifest.json#DDR_070_ATTACH_APPLIED",
                        "docs/architecture/70_duplicate_resolution_rules.md",
                    ],
                ),
                event_expectation(
                    "safety.reassessed",
                    published_event_state("safety.reassessed"),
                    "Material clinical deltas on an attached continuation require new safety assessment.",
                    "The attach proof is continuity-specific; it is not permission to skip reassessment when facts materially change.",
                    [
                        "packages/event-contracts/src/index.ts",
                        "blueprint/phase-1-the-red-flag-gate.md#Replay duplicate and safety-preemption law",
                    ],
                ),
            ],
            summary_rows=row_pairs(
                ("Decision class", duplicate_attach_decision["decisionClass"]),
                ("Review status", duplicate_attach_cluster["reviewStatus"]),
                ("Continuity witness class", duplicate_attach_decision["continuityWitnessClass"]),
                ("Safety reassessment", "required_if_material_delta"),
                ("Browser proof state", FULL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Initial posture", "review_required"),
                ("Superseded decision", "DDR_070_ATTACH_REVIEW"),
                ("Applied decision", duplicate_attach_decision["duplicateResolutionDecisionId"]),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
            ),
            duplicate_rows=row_pairs(
                ("Cluster id", duplicate_attach_cluster["clusterId"]),
                ("Current decision", duplicate_attach_decision["duplicateResolutionDecisionId"]),
                ("Continuity witness", duplicate_attach_decision["continuityWitnessClass"]),
                ("Reason codes", ", ".join(duplicate_attach_decision["reasonCodes"])),
                ("Auto-attach without witness", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "attach_after_proof_only"),
                ("Continuity state", duplicate_attach_cluster["summary"]),
                ("Closure blocked", "no"),
                ("Patient-visible state", "same_lineage_continuation"),
            ),
            evidence_rows=row_pairs(
                ("Duplicate cluster", duplicate_attach_cluster["clusterId"]),
                ("Winning pair evidence", duplicate_attach_decision["winningPairEvidenceRef"]),
                ("Canonical request id", duplicate_attach_cluster["canonicalRequestId"]),
                ("Safety event contract", "safety.reassessed"),
            ),
            event_rows=row_pairs(
                ("Expected event", "request.duplicate.attach_applied"),
                ("Conditional event", "safety.reassessed"),
                ("Registry state", "published"),
                ("Auto-attach without witness", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker set", "none once witness exists"),
                ("Closure blocked", "no"),
            ),
            replay_steps=[
                step("Initial review", "Attach begins in review-required posture without a witness.", "review"),
                step("Explicit witness", "A workflow-return witness authorizes same-request attach.", "continuity"),
                step("Safety check", "Any material delta still requires safety reassessment.", "review"),
            ],
            duplicate_nodes=[
                step("Candidate request", "The current request remains canonical.", "safe"),
                step("Witness gate", "Attach is illegal until the continuity witness is present.", "continuity"),
                step("Applied attach", "The attach decision is explicit and auditable.", "safe"),
            ],
            fallback_stages=[
                step("Quarantine", "No quarantine is opened for witness-backed continuation attach.", "safe"),
                step("Manual review", "The earlier review-required posture remains visible in history.", "review"),
                step("Closure", "Closure remains unaffected unless later blockers are introduced.", "safe"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=False,
            continuity_outcome="Same-request attach settles only after witness-backed continuity proof.",
            patient_visible_state="same_lineage_continuation",
            continuity_witness_class=duplicate_attach_decision["continuityWitnessClass"],
            safety_reassessment_contract="required_if_material_delta",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_CLOSURE_BLOCKED_BY_DUPLICATE_REVIEW",
            case_group="duplicate_cluster",
            case_family="closure_blocked_while_review_open",
            title="Closure remains deferred while duplicate review is open",
            summary="Duplicate review blockers stay explicit on the closure artifact and prevent silent close even when the rest of the closure inputs are satisfied.",
            case_accent="blocked",
            scenario_ref=closure_duplicate["scenarioId"],
            route_family_ref="rf_support_ticket_workspace",
            audience_surface_ref="surf_support_ticket_workspace",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/76_closure_governance_atlas.html",
                "docs/architecture/70_duplicate_resolution_workbench.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + [
                    "data/analysis/closure_blocker_casebook.json",
                    "packages/domains/identity_access/tests/request-closure-backbone.test.ts",
                ]
            ),
            evidence_refs=[
                "data/analysis/closure_blocker_casebook.json#defer_duplicate_review_open",
                "data/analysis/duplicate_cluster_manifest.json#DCL_070_SAME_EPISODE",
            ],
            blocker_refs=["duplicate_cluster_001"],
            gap_refs=[],
            event_expectations=[
                event_expectation(
                    "request.closure_blockers.changed",
                    published_event_state("request.closure_blockers.changed"),
                    "Closure blockers must remain visible while duplicate review is open.",
                    "The closure artifact must persist the duplicate cluster blocker directly instead of deriving a quiet close.",
                    [
                        "data/analysis/closure_blocker_casebook.json#defer_duplicate_review_open",
                        "packages/domains/identity_access/tests/request-closure-backbone.test.ts",
                    ],
                )
            ],
            summary_rows=row_pairs(
                ("Closure decision", closure_duplicate["decision"]),
                ("Defer reason codes", ", ".join(closure_duplicate["deferReasonCodes"])),
                ("Closure blocked", "yes"),
                ("Duplicate review blocker", "duplicate_cluster_001"),
                ("Browser proof state", FULL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Workflow close allowed", "no"),
                ("Duplicate request delta", 0),
                ("Duplicate side-effect delta", 0),
                ("Closure side-effect delta", 0),
                ("Decision basis", "REPAIR_OR_REVIEW_OPEN"),
            ),
            duplicate_rows=row_pairs(
                ("Duplicate blocker", "duplicate_cluster_001"),
                ("Materialized blocker drift", "present"),
                ("Auto-close", "forbidden"),
                ("Cluster hidden inside normal flow", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "review_required"),
                ("Continuity state", "Same shell remains review-visible."),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "recovery_only"),
            ),
            evidence_rows=row_pairs(
                ("Closure scenario", closure_duplicate["scenarioId"]),
                ("Validator rules", "VAL_076_02_DUPLICATE_REVIEW_IS_EXPLICIT"),
                ("Decision", closure_duplicate["decision"]),
                ("Reason codes", ", ".join(closure_duplicate["deferReasonCodes"])),
            ),
            event_rows=row_pairs(
                ("Expected event", "request.closure_blockers.changed"),
                ("Registry state", "published"),
                ("Silent close", "forbidden"),
                ("Blocker hidden", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", "duplicate_cluster_001"),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Outcome satisfied", "The ordinary close prerequisites would otherwise pass.", "safe"),
                step("Duplicate review open", "A duplicate review blocker remains on the lineage.", "blocked"),
                step("Close deferred", "LifecycleCoordinator persists defer instead of close.", "blocked"),
            ],
            duplicate_nodes=[
                step("Duplicate blocker", "The duplicate cluster stays explicit on the closure artifact.", "blocked"),
                step("Normal flow", "The blocker may not hide inside the ordinary path.", "review"),
                step("Coordinator close", "Close is deferred while the blocker is present.", "blocked"),
            ],
            fallback_stages=[
                step("Quarantine", "No quarantine trigger is needed for this closure blocker.", "safe"),
                step("Manual review", "Duplicate review remains the active blocker.", "review"),
                step("Closure", "Closure remains blocked until the duplicate review clears.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="LifecycleCoordinator defers close while duplicate review remains open.",
            patient_visible_state="recovery_only",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_QUARANTINE_FALLBACK_CONTINUITY",
            case_group="quarantine_fallback",
            case_family="quarantine_opens_fallback_review",
            title="Quarantined evidence opens fallback review and preserves same-lineage continuity",
            summary="Accepted progress that later degrades opens an explicit FallbackReviewCase, keeps the lineage intact, and shows degraded continuity instead of silently clearing the request.",
            case_accent="continuity",
            scenario_ref=flow_fallback["referenceCaseId"],
            route_family_ref=demo_fallback["route_family_ref"],
            audience_surface_ref=demo_fallback["audience_surface_ref"],
            browser_proof_state=demo_fallback["proof_posture"],
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/programme/128_reference_flow_observatory.html",
                "docs/architecture/76_closure_governance_atlas.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + flow_fallback["provesRuleRefs"]
                + ["data/analysis/fallback_review_case_matrix.csv"]
            ),
            evidence_refs=[
                "data/analysis/reference_case_catalog.json#RC_FLOW_004",
                "data/analysis/foundation_demo_scenarios.csv#P0_SCN_004_QUARANTINE_FALLBACK",
                "data/analysis/fallback_review_case_matrix.csv#command_api_request_closure_fallbackReviewCase_0001",
                "data/analysis/closure_blocker_casebook.json#defer_fallback_review_after_degraded_progress",
            ],
            blocker_refs=unique(flow_fallback["expectedClosureBlockers"]),
            gap_refs=flow_fallback.get("gapRefs", []),
            event_expectations=[
                event_expectation(
                    "intake.attachment.quarantined",
                    published_event_state("intake.attachment.quarantined"),
                    "Unsafe or unreadable evidence must remain quarantined on the lineage.",
                    "Quarantine is a first-class event, not an implied logging side effect.",
                    [
                        "data/analysis/reference_case_catalog.json#RC_FLOW_004",
                        "data/analysis/artifact_quarantine_policy.json",
                    ],
                ),
                event_expectation(
                    "exception.review_case.opened",
                    published_event_state("exception.review_case.opened"),
                    "Fallback review must open explicitly when accepted progress later degrades.",
                    "The platform owes a patient-visible degraded receipt and a governed manual path.",
                    [
                        "data/analysis/fallback_review_case_matrix.csv#command_api_request_closure_fallbackReviewCase_0001",
                        "data/analysis/closure_blocker_casebook.json",
                    ],
                ),
            ],
            summary_rows=row_pairs(
                ("Fallback case", fallback_row["fallback_case_id"]),
                ("Trigger class", fallback_row["trigger_class"]),
                ("Patient-visible state", fallback_row["patient_visible_state"]),
                ("Closure blocked", "yes"),
                ("Browser proof state", demo_fallback["proof_posture"]),
            ),
            replay_rows=row_pairs(
                ("Reference flow case", "RC_FLOW_004"),
                ("Expected events", ", ".join(flow_fallback["expectedEvents"])),
                ("Prior authoritative chain count", 1),
                ("Duplicate side-effect delta", 0),
                ("Closure side-effect delta", 0),
            ),
            duplicate_rows=row_pairs(
                ("Fallback blocker ref", fallback_row["fallback_case_id"]),
                ("Additional blocker ref", "fallback_case_restore_review_001"),
                ("Lineage preserved", "yes"),
                ("Automatic clear", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback case state", fallback_row["case_state"]),
                ("Manual owner queue", fallback_row["manual_owner_queue"]),
                ("Governed recovery family", fallback_row["governed_recovery_family"]),
                ("Continuity note", "Accepted progress is preserved in-line while quarantine is cleared."),
            ),
            evidence_rows=row_pairs(
                ("Reference flow blockers", ", ".join(flow_fallback["expectedClosureBlockers"])),
                ("Quarantine queue", "q_event_replay_quarantine"),
                ("Foundation scenario", "P0_SCN_004_QUARANTINE_FALLBACK"),
                ("Dependency proof", "FallbackReviewCase with same-lineage degraded receipt"),
            ),
            event_rows=row_pairs(
                ("Expected event", "intake.attachment.quarantined"),
                ("Expected review event", "exception.review_case.opened"),
                ("Registry state", "published"),
                ("Patient-visible degraded receipt", "required"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", fallback_row["fallback_case_id"]),
                ("Additional blocker ref", "fallback_case_restore_review_001"),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Accepted progress", "The prior authoritative chain already exists.", "safe"),
                step("Quarantine", "Evidence later degrades and triggers quarantine without losing lineage.", "blocked"),
                step("Fallback continuity", "A degraded receipt and fallback review keep continuity truthful.", "continuity"),
            ],
            duplicate_nodes=[
                step("Lineage", "The original lineage remains canonical.", "safe"),
                step("Fallback case", "Fallback review opens on the same lineage.", "continuity"),
                step("Silent clear", "Automatic clearing or disappearance is forbidden.", "blocked"),
            ],
            fallback_stages=[
                step("Quarantined evidence", "The unsafe or unreadable artifact remains quarantined.", "blocked"),
                step("Fallback review case", "Manual review opens with a degraded receipt and same-lineage continuity.", "continuity"),
                step("Closure", "Closure remains blocked until recovery or governed settlement.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome=flow_fallback["shellContinuityExpectation"],
            patient_visible_state=fallback_row["patient_visible_state"],
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_FALLBACK_REVIEW_STAYS_EXPLICIT",
            case_group="quarantine_fallback",
            case_family="fallback_review_stays_explicit",
            title="Fallback review stays open and patient-visible until governed recovery is recorded",
            summary="Fallback review cannot close quietly; it remains open, degraded, and operator-owned until recovery, supersession, or another governed settlement exists.",
            case_accent="review",
            scenario_ref=fallback_row["fallback_case_id"],
            route_family_ref="rf_support_replay_observe",
            audience_surface_ref="surf_support_replay_observe",
            browser_proof_state=PARTIAL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/76_closure_governance_atlas.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + [
                    "packages/domains/identity_access/tests/request-closure-backbone.test.ts",
                    "data/analysis/fallback_review_case_matrix.csv",
                    "data/analysis/closure_blocker_casebook.json",
                ]
            ),
            evidence_refs=[
                "data/analysis/fallback_review_case_matrix.csv#command_api_request_closure_fallbackReviewCase_0001",
                "data/analysis/closure_blocker_casebook.json#defer_fallback_review_after_degraded_progress",
            ],
            blocker_refs=[fallback_row["fallback_case_id"]],
            gap_refs=[],
            event_expectations=[
                event_expectation(
                    "exception.review_case.opened",
                    published_event_state("exception.review_case.opened"),
                    "Fallback review must remain explicit while the degraded promise is open.",
                    "Open fallback cases stay visible with draft-recoverable, submitted-degraded, or manual-review states.",
                    [
                        "packages/domains/identity_access/src/request-closure-backbone.ts",
                        "data/analysis/fallback_review_case_matrix.csv",
                    ],
                )
            ],
            summary_rows=row_pairs(
                ("Fallback case", fallback_row["fallback_case_id"]),
                ("Case state", fallback_row["case_state"]),
                ("Patient-visible state", fallback_row["patient_visible_state"]),
                ("Manual owner queue", fallback_row["manual_owner_queue"]),
                ("Browser proof state", PARTIAL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Closure basis", fallback_row["closure_basis"]),
                ("Recovery recorded", "not_yet"),
                ("Quiet close", "forbidden"),
                ("Duplicate side-effect delta", 0),
                ("Closure side-effect delta", 0),
            ),
            duplicate_rows=row_pairs(
                ("Fallback blocker", fallback_row["fallback_case_id"]),
                ("Silent clear", "forbidden"),
                ("Manual owner queue", fallback_row["manual_owner_queue"]),
                ("Governed recovery", fallback_row["governed_recovery_family"]),
            ),
            fallback_rows=row_pairs(
                ("Trigger class", fallback_row["trigger_class"]),
                ("Open fallback state", fallback_row["case_state"]),
                ("Receipt issued at", fallback_row["receipt_issued_at"]),
                ("SLA anchor at", fallback_row["sla_anchor_at"]),
            ),
            evidence_rows=row_pairs(
                ("Fallback case id", fallback_row["fallback_case_id"]),
                ("Lineage scope", fallback_row["lineage_scope"]),
                ("Manual queue", fallback_row["manual_owner_queue"]),
                ("Closure basis", fallback_row["closure_basis"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "exception.review_case.opened"),
                ("Registry state", "published"),
                ("Quiet close", "forbidden"),
                ("Recovery required before close", "yes"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", fallback_row["fallback_case_id"]),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Accepted progress", "The request already carries accepted progress.", "safe"),
                step("Fallback open", "Fallback review remains open and operator-owned.", "review"),
                step("Quiet clear", "Quiet clear is forbidden until recovery or supersession is recorded.", "blocked"),
            ],
            duplicate_nodes=[
                step("Lineage continuity", "The same request lineage stays visible.", "continuity"),
                step("Fallback case", "The case remains explicit on the blocker ledger.", "review"),
                step("Closure blocker", "Closure stays blocked until recovery is recorded.", "blocked"),
            ],
            fallback_stages=[
                step("Degraded receipt", "Patient-visible degraded continuity remains active.", "continuity"),
                step("Open manual review", "Manual review stays explicit and operator-owned.", "review"),
                step("Closure", "Closure cannot settle quietly while the fallback case stays open.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="Fallback review stays explicit until governed recovery is recorded.",
            patient_visible_state=fallback_row["patient_visible_state"],
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_CLOSURE_BLOCKED_BY_FALLBACK",
            case_group="quarantine_fallback",
            case_family="closure_blocked_while_review_open",
            title="Closure stays blocked while fallback review or degraded promise blockers remain open",
            summary="Closure defers when fallback review stays open, and the materialized blocker set remains visible instead of being treated as a quiet close.",
            case_accent="blocked",
            scenario_ref=closure_fallback["scenarioId"],
            route_family_ref="rf_support_replay_observe",
            audience_surface_ref="surf_support_replay_observe",
            browser_proof_state=FULL_SURFACE_PROOF,
            machine_proof_state=EXACT_MACHINE_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/architecture/76_closure_governance_atlas.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + [
                    "data/analysis/closure_blocker_casebook.json",
                    "packages/domains/identity_access/tests/request-closure-backbone.test.ts",
                ]
            ),
            evidence_refs=[
                "data/analysis/closure_blocker_casebook.json#defer_fallback_review_after_degraded_progress",
                "data/analysis/fallback_review_case_matrix.csv#command_api_request_closure_fallbackReviewCase_0001",
            ],
            blocker_refs=unique(
                [
                    "command_api_request_closure_fallbackReviewCase_0001",
                    "fallback_case_restore_review_001",
                ]
            ),
            gap_refs=[],
            event_expectations=[
                event_expectation(
                    "request.closure_blockers.changed",
                    published_event_state("request.closure_blockers.changed"),
                    "Fallback blockers remain visible until recovery clears them.",
                    "Closure may not settle while fallback review or degraded promise blockers remain open.",
                    [
                        "data/analysis/closure_blocker_casebook.json#defer_fallback_review_after_degraded_progress",
                        "packages/domains/identity_access/src/request-closure-backbone.ts",
                    ],
                )
            ],
            summary_rows=row_pairs(
                ("Closure decision", closure_fallback["decision"]),
                ("Defer reason codes", ", ".join(closure_fallback["deferReasonCodes"])),
                ("Closure blocked", "yes"),
                ("Fallback blocker", "command_api_request_closure_fallbackReviewCase_0001"),
                ("Browser proof state", FULL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Workflow close allowed", "no"),
                ("Fallback review open", "yes"),
                ("Duplicate side-effect delta", 0),
                ("Closure side-effect delta", 0),
                ("Decision basis", "REPAIR_OR_REVIEW_OPEN"),
            ),
            duplicate_rows=row_pairs(
                ("Fallback blocker ref", "command_api_request_closure_fallbackReviewCase_0001"),
                ("Additional blocker ref", "fallback_case_restore_review_001"),
                ("Materialized blocker drift", "present"),
                ("Auto-close", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback case open", "yes"),
                ("Manual queue", "manual_exception_review"),
                ("Degraded promise open", "yes"),
                ("Patient-visible state", "submitted_degraded"),
            ),
            evidence_rows=row_pairs(
                ("Closure scenario", closure_fallback["scenarioId"]),
                ("Decision", closure_fallback["decision"]),
                ("Reason codes", ", ".join(closure_fallback["deferReasonCodes"])),
                ("Fallback case", "command_api_request_closure_fallbackReviewCase_0001"),
            ),
            event_rows=row_pairs(
                ("Expected event", "request.closure_blockers.changed"),
                ("Registry state", "published"),
                ("Silent close", "forbidden"),
                ("Fallback blocker hidden", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", "command_api_request_closure_fallbackReviewCase_0001"),
                ("Additional blocker ref", "fallback_case_restore_review_001"),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Terminal outcome", "The ordinary close prerequisites exist.", "safe"),
                step("Fallback blocker open", "Fallback review remains open on the lineage.", "blocked"),
                step("Close deferred", "LifecycleCoordinator persists defer rather than a quiet close.", "blocked"),
            ],
            duplicate_nodes=[
                step("Fallback blocker", "The blocker remains materialized on the closure artifact.", "blocked"),
                step("Degraded promise", "The degraded promise stays explicit until recovery settles.", "review"),
                step("Coordinator close", "Close is deferred while either blocker remains.", "blocked"),
            ],
            fallback_stages=[
                step("Quarantined evidence", "The evidence branch remains degraded.", "blocked"),
                step("Fallback review", "Manual review remains open and explicit.", "review"),
                step("Closure", "Closure remains blocked until recovery or governed settlement.", "blocked"),
            ],
            prior_authoritative_chain_count=1,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="LifecycleCoordinator defers close while fallback review remains open.",
            patient_visible_state="submitted_degraded",
        )
    )

    upload_fixture = seed_catalog_by_fixture["fixture_086_upload_photo_pending_scan"]
    recording_fixture = seed_catalog_by_fixture["fixture_086_call_recording_pending_scan"]

    cases.append(
        make_case(
            case_id="CASE_135_SUSPICIOUS_ARTIFACT_REMAINS_QUARANTINED",
            case_group="quarantine_fallback",
            case_family="fallback_review_stays_explicit",
            title="Suspicious artifacts stay in manual-review hold instead of disappearing",
            summary="Suspicious evidence remains quarantined under manual review and cannot collapse into calm delivery or quiet release.",
            case_accent="blocked",
            scenario_ref=suspicious_policy["policy_row_id"],
            route_family_ref="rf_support_ticket_workspace",
            audience_surface_ref="surf_support_ticket_workspace",
            browser_proof_state=PARTIAL_SURFACE_PROOF,
            machine_proof_state=BOUNDED_CONTRACT_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + [
                    "data/analysis/35_scan_and_quarantine_policy_matrix.csv",
                    "data/analysis/requirement_registry.jsonl#REQ-INV-026",
                ]
            ),
            evidence_refs=[
                "data/analysis/35_scan_and_quarantine_policy_matrix.csv#SCAN_POLICY_SUSPICIOUS_HOLD",
                "data/analysis/requirement_registry.jsonl#REQ-INV-026",
            ],
            blocker_refs=["security_review_required"],
            gap_refs=["GAP_EVIDENCE_SCANNER_RUNTIME_NOT_YET_EXECUTABLE"],
            event_expectations=[
                event_expectation(
                    "intake.attachment.quarantined",
                    published_event_state("intake.attachment.quarantined"),
                    "Suspicious artifacts remain quarantined.",
                    suspicious_policy["notes"],
                    [
                        "data/analysis/35_scan_and_quarantine_policy_matrix.csv#SCAN_POLICY_SUSPICIOUS_HOLD",
                        "data/analysis/requirement_registry.jsonl#REQ-INV-026",
                    ],
                )
            ],
            summary_rows=row_pairs(
                ("Verdict state", suspicious_policy["verdict_state"]),
                ("Quarantine action", suspicious_policy["quarantine_action"]),
                ("Fallback review action", suspicious_policy["fallback_review_action"]),
                ("Browser proof state", PARTIAL_SURFACE_PROOF),
                ("Machine proof state", BOUNDED_CONTRACT_PROOF),
            ),
            replay_rows=row_pairs(
                ("Provider family", suspicious_policy["provider_family"]),
                ("Environment", suspicious_policy["environment"]),
                ("Webhook profile", suspicious_policy["webhook_profile_ref"]),
                ("Quarantine rule", suspicious_policy["scan_policy_ref"]),
                ("Requirement", req_inv_026["expected_behavior"]),
            ),
            duplicate_rows=row_pairs(
                ("Manual review hold", suspicious_policy["quarantine_action"]),
                ("Automatic discard", "forbidden"),
                ("Automatic pass-through", "forbidden"),
                ("Security review", suspicious_policy["fallback_review_action"]),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "manual_review_hold"),
                ("Patient-visible continuity", "review-required hold"),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "under_manual_review"),
            ),
            evidence_rows=row_pairs(
                ("Scan policy row", suspicious_policy["policy_row_id"]),
                ("Requirement id", req_inv_026["requirement_id"]),
                ("Environment", suspicious_policy["environment"]),
                ("Retention policy", suspicious_policy["retention_policy_ref"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "intake.attachment.quarantined"),
                ("Registry state", "published"),
                ("Automatic discard", "forbidden"),
                ("Automatic calm release", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", suspicious_policy["fallback_review_action"]),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Suspicious verdict", "The scan policy returns suspicious rather than clean.", "blocked"),
                step("Manual review hold", "The artifact remains under manual review hold.", "review"),
                step("No quiet release", "The artifact cannot silently clear into normal flow.", "blocked"),
            ],
            duplicate_nodes=[
                step("Requirement", req_inv_026["requirement_title"], "review"),
                step("Quarantine", "The artifact remains quarantined.", "blocked"),
                step("Governed path", "Manual review remains explicit.", "continuity"),
            ],
            fallback_stages=[
                step("Quarantined artifact", "The suspicious artifact stays blocked.", "blocked"),
                step("Manual review", "Security review is required and explicit.", "review"),
                step("Closure", "Quiet close is forbidden while the review holds.", "blocked"),
            ],
            prior_authoritative_chain_count=0,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="Suspicious artifacts stay quarantined under explicit manual review.",
            patient_visible_state="under_manual_review",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_UNREADABLE_RECORDING_REACQUIRE",
            case_group="quarantine_fallback",
            case_family="quarantine_opens_fallback_review",
            title="Unreadable evidence stays distinct from hard failure and requests reacquire",
            summary="Unreadable evidence remains quarantined, requests reacquire, and does not silently vanish or settle as usable.",
            case_accent="blocked",
            scenario_ref=unreadable_policy["policy_row_id"],
            route_family_ref="rf_support_replay_observe",
            audience_surface_ref="surf_support_replay_observe",
            browser_proof_state=PARTIAL_SURFACE_PROOF,
            machine_proof_state=BOUNDED_CONTRACT_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + [
                    "data/analysis/35_scan_and_quarantine_policy_matrix.csv",
                    "data/analysis/object_storage_class_manifest.json",
                    "data/analysis/dependency_watchlist.csv#dep_malware_scanning_provider",
                    "data/analysis/requirement_registry.jsonl#REQ-INV-026",
                ]
            ),
            evidence_refs=[
                "data/analysis/35_scan_and_quarantine_policy_matrix.csv#SCAN_POLICY_UNREADABLE_RETRY",
                "data/analysis/object_storage_class_manifest.json#fixture_086_call_recording_pending_scan",
                "data/analysis/dependency_watchlist.csv#dep_malware_scanning_provider",
            ],
            blocker_refs=["request_reacquire"],
            gap_refs=["GAP_EVIDENCE_SCANNER_RUNTIME_NOT_YET_EXECUTABLE"],
            event_expectations=[
                event_expectation(
                    "intake.attachment.quarantined",
                    published_event_state("intake.attachment.quarantined"),
                    "Unreadable evidence remains quarantined and requests reacquire.",
                    unreadable_policy["notes"],
                    [
                        "data/analysis/35_scan_and_quarantine_policy_matrix.csv#SCAN_POLICY_UNREADABLE_RETRY",
                        "data/analysis/dependency_watchlist.csv#dep_malware_scanning_provider",
                    ],
                ),
                event_expectation(
                    "exception.review_case.opened",
                    published_event_state("exception.review_case.opened"),
                    "Unreadable evidence may open fallback review when the platform still owes a response.",
                    malware_dependency["fallback_strategy"],
                    [
                        "data/analysis/dependency_watchlist.csv#dep_malware_scanning_provider",
                        "data/analysis/requirement_registry.jsonl#REQ-INV-026",
                    ],
                ),
            ],
            summary_rows=row_pairs(
                ("Verdict state", unreadable_policy["verdict_state"]),
                ("Quarantine action", unreadable_policy["quarantine_action"]),
                ("Fallback review action", unreadable_policy["fallback_review_action"]),
                ("Browser proof state", PARTIAL_SURFACE_PROOF),
                ("Machine proof state", BOUNDED_CONTRACT_PROOF),
            ),
            replay_rows=row_pairs(
                ("Seed fixture", recording_fixture["fixture_ref"]),
                ("Storage class", recording_fixture["storage_class_ref"]),
                ("Requirement", req_inv_026["requirement_title"]),
                ("Degradation mode", malware_dependency["degradation_mode"]),
                ("Fallback strategy", malware_dependency["fallback_strategy"]),
            ),
            duplicate_rows=row_pairs(
                ("Unreadable distinct from failure", "yes"),
                ("Automatic discard", "forbidden"),
                ("Reacquire request", unreadable_policy["fallback_review_action"]),
                ("Object visibility", "forbidden_browser_delivery"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "request_reacquire"),
                ("Patient-visible continuity", "same-lineage degraded receipt"),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "submitted_degraded"),
            ),
            evidence_rows=row_pairs(
                ("Scan policy row", unreadable_policy["policy_row_id"]),
                ("Storage fixture", recording_fixture["fixture_ref"]),
                ("Storage class", recording_fixture["storage_class_ref"]),
                ("Object key", recording_fixture["object_key"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "intake.attachment.quarantined"),
                ("Expected review event", "exception.review_case.opened"),
                ("Registry state", "published"),
                ("Automatic discard", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Blocker ref", "request_reacquire"),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Unreadable verdict", "Unreadable stays distinct from hard failure.", "blocked"),
                step("Reacquire path", "The governed path requests reacquire instead of disappearing.", "continuity"),
                step("No calm settle", "Unreadable evidence may not settle as usable.", "blocked"),
            ],
            duplicate_nodes=[
                step("Quarantine raw", "The recording remains in quarantine_raw storage.", "blocked"),
                step("Fallback review", "The degraded path remains same-lineage and explicit.", "continuity"),
                step("Closure", "Closure stays blocked while reacquire or fallback review remains open.", "blocked"),
            ],
            fallback_stages=[
                step("Unreadable evidence", "The recording stays quarantined and browser-hidden.", "blocked"),
                step("Reacquire / review", "The response path requests reacquire or manual review.", "review"),
                step("Closure", "Quiet close is forbidden until the unreadable branch is cleared.", "blocked"),
            ],
            prior_authoritative_chain_count=0,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="Unreadable evidence stays quarantined and requests governed reacquire or fallback review.",
            patient_visible_state="submitted_degraded",
        )
    )

    cases.append(
        make_case(
            case_id="CASE_135_UNSUPPORTED_SCANNER_RUNTIME_GAP",
            case_group="quarantine_fallback",
            case_family="fallback_review_stays_explicit",
            title="Unsupported or missing scanner runtime stays an explicit blocked gap",
            summary="The malware-scanning adapter cannot imply current runtime safety. Unsupported capability rows stay visible and bound to the same fallback-review and quarantine law.",
            case_accent="review",
            scenario_ref="adp_malware_artifact_scanning::missing_runtime",
            route_family_ref="rf_support_ticket_workspace",
            audience_surface_ref="surf_support_ticket_workspace",
            browser_proof_state=PARTIAL_SURFACE_PROOF,
            machine_proof_state=BOUNDED_CONTRACT_PROOF,
            browser_surface_refs=[
                "docs/tests/135_exception_path_lab.html",
                "docs/integrations/129_adapter_validation_console.html",
            ],
            source_refs=unique(
                SOURCE_PRECEDENCE
                + [
                    "data/integration/adapter_simulator_matrix.csv",
                    "data/integration/adapter_validation_results.json",
                    "data/analysis/dependency_watchlist.csv#dep_malware_scanning_provider",
                    "data/analysis/requirement_registry.jsonl#REQ-INV-026",
                ]
            ),
            evidence_refs=[
                "data/integration/adapter_simulator_matrix.csv#adp_malware_artifact_scanning",
                "data/integration/adapter_validation_results.json#adp_malware_artifact_scanning",
                "data/analysis/dependency_watchlist.csv#dep_malware_scanning_provider",
            ],
            blocker_refs=malware_validation["gapRefs"],
            gap_refs=malware_validation["gapRefs"],
            event_expectations=[],
            summary_rows=row_pairs(
                ("Adapter id", malware_adapter["adapterId"]),
                ("Validation state", malware_validation["currentValidationState"]),
                ("Runtime coverage", malware_validation["runtimeCoverage"]),
                ("Unsupported capability visible", malware_validation["unsupportedCapabilityVisible"]),
                ("Browser proof state", PARTIAL_SURFACE_PROOF),
            ),
            replay_rows=row_pairs(
                ("Mock or actual", malware_adapter["mockOrActual"]),
                ("Degradation mode", malware_dependency["degradation_mode"]),
                ("Fallback strategy", malware_dependency["fallback_strategy"]),
                ("Gap refs", ", ".join(malware_validation["gapRefs"])),
                ("Exact replay verified", malware_validation["exactReplayVerified"]),
            ),
            duplicate_rows=row_pairs(
                ("Current validation state", malware_adapter["currentValidationState"]),
                ("Runtime surface", json.loads(malware_adapter["capabilityTuple"])["runtimeSurface"]),
                ("Unsupported capability", "visible"),
                ("Quiet green status", "forbidden"),
            ),
            fallback_rows=row_pairs(
                ("Fallback posture", "manual_review_or_reupload"),
                ("Patient-visible continuity", "same-lineage degraded receipt"),
                ("Closure blocked", "yes"),
                ("Patient-visible state", "submitted_degraded"),
            ),
            evidence_rows=row_pairs(
                ("Adapter id", malware_adapter["adapterId"]),
                ("Validation scenario", malware_validation["validationScenarios"][0]["scenarioId"]),
                ("Gap ref", malware_validation["gapRefs"][0]),
                ("Fallback strategy", malware_dependency["fallback_strategy"]),
            ),
            event_rows=row_pairs(
                ("Expected event", "none_current_runtime"),
                ("Registry state", "bounded_gap"),
                ("Unsupported capability visible", "required"),
                ("Quiet green status", "forbidden"),
            ),
            blocker_rows=row_pairs(
                ("Gap ref", malware_validation["gapRefs"][0]),
                ("Closure blocked", "yes"),
            ),
            replay_steps=[
                step("Adapter validation", "The adapter row remains blocked because no executable runtime exists.", "review"),
                step("Unsupported capability", "Unsupported capability stays visible instead of implying safety.", "blocked"),
                step("Fallback strategy", "Manual review or re-upload remains the governed path.", "continuity"),
            ],
            duplicate_nodes=[
                step("Capability tuple", "The published adapter tuple still names scan, quarantine, release, and reacquire objects.", "review"),
                step("Runtime gap", "No executable runtime means no claim of current safe delivery.", "blocked"),
                step("Fallback law", "Fallback review remains explicit and same-lineage.", "continuity"),
            ],
            fallback_stages=[
                step("Unsupported runtime", "The missing runtime stays an explicit gap.", "blocked"),
                step("Fallback strategy", "Manual review or re-upload remains the only honest path.", "review"),
                step("Closure", "Quiet close is forbidden while the gap and fallback debt remain unresolved.", "blocked"),
            ],
            prior_authoritative_chain_count=0,
            duplicate_request_delta=0,
            duplicate_side_effect_delta=0,
            duplicate_closure_side_effect_delta=0,
            closure_blocked=True,
            continuity_outcome="Unsupported scanning capability stays blocked and explicit rather than hiding fallback debt.",
            patient_visible_state="submitted_degraded",
        )
    )

    event_index: dict[str, dict[str, Any]] = {}
    for case in cases:
        for expectation in case["eventExpectations"]:
            key = expectation["eventName"]
            current = event_index.get(key)
            if current is None:
                event_index[key] = {
                    **expectation,
                    "caseIds": [case["caseId"]],
                    "caseFamilies": [case["caseFamily"]],
                }
            else:
                current["caseIds"] = unique(current["caseIds"] + [case["caseId"]])
                current["caseFamilies"] = unique(current["caseFamilies"] + [case["caseFamily"]])
                current["sourceRefs"] = unique(current["sourceRefs"] + expectation["sourceRefs"])

    event_expectations = sorted(event_index.values(), key=lambda row: row["eventName"])

    adapter_replay_rows = [
        {
            "case_id": case["caseId"],
            "case_family": case["caseFamily"],
            "title": case["title"],
            "scenario_ref": case["scenarioRef"],
            "decision_class": next(
                (row["value"] for row in case["summaryRows"] if row["label"] == "Decision class"),
                "n/a",
            ),
            "prior_authoritative_chain_count": case["priorAuthoritativeChainCount"],
            "duplicate_request_delta": case["duplicateRequestDelta"],
            "duplicate_side_effect_delta": case["duplicateSideEffectDelta"],
            "duplicate_closure_side_effect_delta": case["duplicateClosureSideEffectDelta"],
            "browser_proof_state": case["browserProofState"],
            "machine_proof_state": case["machineProofState"],
            "source_refs": " | ".join(case["sourceRefs"]),
        }
        for case in cases
        if case["caseGroup"] == "adapter_replay"
    ]

    duplicate_cluster_rows = [
        {
            "case_id": case["caseId"],
            "case_family": case["caseFamily"],
            "title": case["title"],
            "scenario_ref": case["scenarioRef"],
            "continuity_witness_class": case["continuityWitnessClass"],
            "safety_reassessment_contract": case["safetyReassessmentContract"],
            "closure_blocked": "yes" if case["closureBlocked"] else "no",
            "duplicate_side_effect_delta": case["duplicateSideEffectDelta"],
            "browser_proof_state": case["browserProofState"],
            "machine_proof_state": case["machineProofState"],
            "blocker_refs": " | ".join(case["blockerRefs"]),
            "source_refs": " | ".join(case["sourceRefs"]),
        }
        for case in cases
        if case["caseGroup"] == "duplicate_cluster"
    ]

    quarantine_fallback_rows = [
        {
            "case_id": case["caseId"],
            "case_family": case["caseFamily"],
            "title": case["title"],
            "scenario_ref": case["scenarioRef"],
            "patient_visible_state": case["patientVisibleState"],
            "continuity_outcome": case["continuityOutcome"],
            "closure_blocked": "yes" if case["closureBlocked"] else "no",
            "browser_proof_state": case["browserProofState"],
            "machine_proof_state": case["machineProofState"],
            "blocker_refs": " | ".join(case["blockerRefs"]),
            "gap_refs": " | ".join(case["gapRefs"]),
            "source_refs": " | ".join(case["sourceRefs"]),
        }
        for case in cases
        if case["caseGroup"] == "quarantine_fallback"
    ]

    summary = {
        "exception_case_count": len(cases),
        "adapter_replay_case_count": len(adapter_replay_rows),
        "duplicate_cluster_case_count": len(duplicate_cluster_rows),
        "quarantine_fallback_case_count": len(quarantine_fallback_rows),
        "required_case_family_count": len(REQUIRED_CASE_FAMILIES),
        "full_surface_proof_count": sum(
            1 for case in cases if case["browserProofState"] == FULL_SURFACE_PROOF
        ),
        "partial_surface_proof_count": sum(
            1 for case in cases if case["browserProofState"] == PARTIAL_SURFACE_PROOF
        ),
        "closure_blocked_case_count": sum(1 for case in cases if case["closureBlocked"]),
        "zero_duplicate_side_effect_case_count": sum(
            1 for case in cases if case["duplicateSideEffectDelta"] == 0
        ),
        "published_event_expectation_count": sum(
            1 for item in event_expectations if item["registryState"] == "published"
        ),
        "bounded_gap_event_expectation_count": sum(
            1 for item in event_expectations if item["registryState"] != "published"
        ),
        "quarantine_gap_count": sum(1 for case in cases if case["gapRefs"]),
    }

    bounded_gaps = [
        {
            "gapRef": gap,
            "caseIds": [case["caseId"] for case in cases if gap in case["gapRefs"]],
        }
        for gap in unique([gap for case in cases for gap in case["gapRefs"]])
    ]

    return {
        "generatedAt": iso_now(),
        "cases": cases,
        "adapterReplayRows": adapter_replay_rows,
        "duplicateClusterRows": duplicate_cluster_rows,
        "quarantineFallbackRows": quarantine_fallback_rows,
        "eventExpectations": event_expectations,
        "summary": summary,
        "boundedGaps": bounded_gaps,
    }


def build_suite_doc(payload: dict[str, Any]) -> str:
    adapter_rows = [
        [
            row["case_id"],
            row["case_family"],
            row["decision_class"],
            row["duplicate_request_delta"],
            row["duplicate_side_effect_delta"],
            row["duplicate_closure_side_effect_delta"],
            row["browser_proof_state"],
        ]
        for row in payload["adapterReplayRows"]
    ]
    duplicate_rows = [
        [
            row["case_id"],
            row["case_family"],
            row["continuity_witness_class"],
            row["safety_reassessment_contract"],
            row["closure_blocked"],
            row["browser_proof_state"],
        ]
        for row in payload["duplicateClusterRows"]
    ]
    quarantine_rows = [
        [
            row["case_id"],
            row["case_family"],
            row["patient_visible_state"],
            row["closure_blocked"],
            row["browser_proof_state"],
            row["gap_refs"] or "none",
        ]
        for row in payload["quarantineFallbackRows"]
    ]
    gap_rows = [
        [gap["gapRef"], ", ".join(gap["caseIds"])] for gap in payload["boundedGaps"]
    ]

    return textwrap.dedent(
        f"""
        # 135 Adapter Replay Duplicate Quarantine Fallback Suite

        Generated: `{payload["generatedAt"]}`

        This suite fuses replay classification, duplicate-cluster review, closure blockers, fallback-review truth, and adapter replay evidence into one unhappy-path proof harness.

        ## Summary

        - Task id: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`
        - Exception cases: `{payload["summary"]["exception_case_count"]}`
        - Full surface proof cases: `{payload["summary"]["full_surface_proof_count"]}`
        - Partial surface proof cases: `{payload["summary"]["partial_surface_proof_count"]}`
        - Closure-blocked cases: `{payload["summary"]["closure_blocked_case_count"]}`
        - Published event expectations: `{payload["summary"]["published_event_expectation_count"]}`
        - Bounded-gap event expectations: `{payload["summary"]["bounded_gap_event_expectation_count"]}`

        ## Required Case Families

        {chr(10).join(f"- `{family}`" for family in REQUIRED_CASE_FAMILIES)}

        ## Adapter Replay Matrix

        {markdown_table(
            ["Case", "Family", "Decision", "Duplicate request delta", "Duplicate side-effect delta", "Duplicate closure delta", "Browser proof"],
            adapter_rows,
        )}

        ## Duplicate Cluster Matrix

        {markdown_table(
            ["Case", "Family", "Continuity witness", "Safety reassessment", "Closure blocked", "Browser proof"],
            duplicate_rows,
        )}

        ## Quarantine And Fallback Matrix

        {markdown_table(
            ["Case", "Family", "Patient-visible state", "Closure blocked", "Browser proof", "Gap refs"],
            quarantine_rows,
        )}

        ## Bounded Gaps

        {markdown_table(["Gap ref", "Case ids"], gap_rows or [["none", "none"]])}

        ## Source Precedence

        {chr(10).join(f"- `{ref}`" for ref in SOURCE_PRECEDENCE)}
        """
    ).strip()


def build_truth_doc(payload: dict[str, Any]) -> str:
    truth_rows: list[list[Any]] = []
    for case in payload["cases"]:
        truth_rows.append(
            [
                case["caseId"],
                case["caseGroup"],
                case["caseFamily"],
                case["patientVisibleState"],
                "yes" if case["closureBlocked"] else "no",
                case["browserProofState"],
                case["machineProofState"],
                ", ".join(case["blockerRefs"]) or "none",
                ", ".join(case["gapRefs"]) or "none",
            ]
        )

    event_rows = [
        [
            item["eventName"],
            item["registryState"],
            ", ".join(item["caseIds"]),
            item["obligation"],
        ]
        for item in payload["eventExpectations"]
    ]

    return textwrap.dedent(
        f"""
        # 135 Duplicate Cluster And Fallback Truth Matrix

        Generated: `{payload["generatedAt"]}`

        The rows below keep duplicate-review, fallback-review, and closure-blocker truth explicit instead of allowing them to hide inside ordinary workflow state.

        ## Truth Rows

        {markdown_table(
            [
                "Case",
                "Group",
                "Family",
                "Patient-visible state",
                "Closure blocked",
                "Browser proof",
                "Machine proof",
                "Blocker refs",
                "Gap refs",
            ],
            truth_rows,
        )}

        ## Event Expectations

        {markdown_table(
            ["Event", "Registry state", "Case ids", "Obligation"],
            event_rows or [["none", "none", "none", "none"]],
        )}
        """
    ).strip()


def build_lab_html(suite_payload: dict[str, Any]) -> str:
    cases_json = to_script_json(suite_payload)
    return textwrap.dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Exception Path Lab</title>
            <style>
              :root {{
                --token-canvas: #F7F8FA;
                --token-shell: #EEF2F6;
                --token-panel: #FFFFFF;
                --token-inset: #E8EEF3;
                --token-line: #D6DEE6;
                --token-text-strong: #0F1720;
                --token-text-default: #24313D;
                --token-text-muted: #5E6B78;
                --token-accent-replay: #2F6FED;
                --token-accent-review: #B7791F;
                --token-accent-blocked: #B42318;
                --token-accent-continuity: #5B61F6;
                --token-accent-safe: #117A55;
                --shadow-soft: 0 18px 44px rgba(15, 23, 32, 0.08);
                --radius-xl: 28px;
                --radius-lg: 20px;
                --radius-md: 14px;
                --radius-sm: 10px;
                --font-ui: "Inter", "Segoe UI", sans-serif;
              }}

              * {{
                box-sizing: border-box;
              }}

              html,
              body {{
                margin: 0;
                padding: 0;
                min-height: 100%;
                background: var(--token-canvas);
                color: var(--token-text-default);
                font-family: var(--font-ui);
              }}

              body {{
                padding: 24px;
              }}

              .lab-shell {{
                max-width: 1580px;
                margin: 0 auto;
              }}

              .masthead {{
                min-height: 72px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                margin-bottom: 20px;
                padding: 18px 24px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(232, 238, 243, 0.92));
                border: 1px solid rgba(214, 222, 230, 0.9);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-soft);
              }}

              .brand {{
                display: flex;
                align-items: center;
                gap: 16px;
              }}

              .brand-wordmark {{
                display: flex;
                flex-direction: column;
                gap: 2px;
              }}

              .brand-wordmark strong {{
                font-size: 0.86rem;
                letter-spacing: 0.24em;
                color: var(--token-text-strong);
              }}

              .brand-wordmark span {{
                font-size: 0.92rem;
                color: var(--token-text-muted);
              }}

              .summary-strip {{
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
                min-width: 520px;
              }}

              .summary-chip {{
                padding: 10px 12px;
                border-radius: var(--radius-md);
                background: rgba(255, 255, 255, 0.72);
                border: 1px solid rgba(214, 222, 230, 0.9);
              }}

              .summary-chip span {{
                display: block;
                font-size: 0.74rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--token-text-muted);
                margin-bottom: 4px;
              }}

              .summary-chip strong {{
                font-size: 1.18rem;
                color: var(--token-text-strong);
              }}

              .lab-grid {{
                display: grid;
                grid-template-columns: 288px minmax(0, 1fr) 408px;
                gap: 20px;
                align-items: start;
              }}

              .panel {{
                min-width: 0;
                background: var(--token-panel);
                border: 1px solid rgba(214, 222, 230, 0.9);
                border-radius: var(--radius-xl);
                box-shadow: var(--shadow-soft);
              }}

              .panel-inner {{
                padding: 18px;
              }}

              .rail-panel {{
                position: sticky;
                top: 24px;
                background: var(--token-shell);
              }}

              .rail-controls {{
                display: grid;
                gap: 10px;
                margin-bottom: 16px;
              }}

              label {{
                display: grid;
                gap: 6px;
                font-size: 0.76rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--token-text-muted);
              }}

              select {{
                width: 100%;
                padding: 11px 12px;
                border-radius: var(--radius-sm);
                border: 1px solid rgba(214, 222, 230, 0.9);
                background: var(--token-panel);
                color: var(--token-text-strong);
                font: inherit;
              }}

              .case-list {{
                display: grid;
                gap: 10px;
              }}

              .case-button {{
                width: 100%;
                text-align: left;
                border: 1px solid rgba(214, 222, 230, 0.9);
                background: rgba(255, 255, 255, 0.84);
                border-radius: var(--radius-md);
                padding: 14px 14px 12px;
                color: var(--token-text-default);
                cursor: pointer;
                transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
              }}

              .case-button[data-active="true"] {{
                border-color: rgba(47, 111, 237, 0.34);
                box-shadow: inset 0 0 0 1px rgba(47, 111, 237, 0.18);
                transform: translateX(4px);
              }}

              .case-button:hover,
              .case-button:focus-visible {{
                border-color: rgba(47, 111, 237, 0.4);
                outline: none;
              }}

              .case-meta {{
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 8px;
              }}

              .case-chip {{
                border-radius: 999px;
                padding: 4px 8px;
                font-size: 0.72rem;
                line-height: 1;
                background: var(--token-inset);
                color: var(--token-text-muted);
              }}

              .case-chip[data-tone="replay"] {{
                color: var(--token-accent-replay);
              }}

              .case-chip[data-tone="review"] {{
                color: var(--token-accent-review);
              }}

              .case-chip[data-tone="blocked"] {{
                color: var(--token-accent-blocked);
              }}

              .case-chip[data-tone="continuity"] {{
                color: var(--token-accent-continuity);
              }}

              .case-chip[data-tone="safe"] {{
                color: var(--token-accent-safe);
              }}

              .case-title {{
                font-size: 0.95rem;
                line-height: 1.35;
                color: var(--token-text-strong);
                margin: 0 0 8px;
              }}

              .case-summary {{
                margin: 0;
                color: var(--token-text-muted);
                font-size: 0.84rem;
                line-height: 1.45;
              }}

              .center-column {{
                min-width: 0;
                display: grid;
                gap: 16px;
              }}

              .visual-card {{
                min-width: 0;
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 248, 250, 0.92));
              }}

              .visual-head {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 16px;
              }}

              .visual-head h2,
              .inspector-head h2,
              .table-head h2 {{
                margin: 0;
                font-size: 1rem;
                color: var(--token-text-strong);
              }}

              .visual-head p,
              .inspector-subtitle,
              .table-head p {{
                margin: 4px 0 0;
                color: var(--token-text-muted);
                font-size: 0.84rem;
              }}

              .ladder,
              .duplicate-map,
              .fallback-ribbon {{
                display: grid;
                gap: 12px;
              }}

              .ladder-step,
              .duplicate-node,
              .fallback-stage {{
                display: grid;
                gap: 6px;
                padding: 12px 14px;
                border-radius: var(--radius-md);
                border: 1px solid rgba(214, 222, 230, 0.9);
                background: rgba(232, 238, 243, 0.56);
              }}

              .step-label {{
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.88rem;
                color: var(--token-text-strong);
              }}

              .step-dot {{
                width: 12px;
                height: 12px;
                border-radius: 999px;
                flex: 0 0 auto;
                background: var(--token-line);
              }}

              .state-replay .step-dot {{ background: var(--token-accent-replay); }}
              .state-review .step-dot {{ background: var(--token-accent-review); }}
              .state-blocked .step-dot {{ background: var(--token-accent-blocked); }}
              .state-continuity .step-dot {{ background: var(--token-accent-continuity); }}
              .state-safe .step-dot {{ background: var(--token-accent-safe); }}

              .parity-grid {{
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(280px, 0.96fr);
                gap: 16px;
              }}

              table {{
                width: 100%;
                border-collapse: collapse;
              }}

              th,
              td {{
                text-align: left;
                vertical-align: top;
                padding: 10px 12px;
                border-bottom: 1px solid rgba(214, 222, 230, 0.9);
                overflow-wrap: anywhere;
              }}

              th {{
                font-size: 0.76rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--token-text-muted);
              }}

              td {{
                font-size: 0.88rem;
                color: var(--token-text-default);
              }}

              .inspector-card {{
                position: sticky;
                top: 24px;
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(238, 242, 246, 0.94));
              }}

              .inspector-stack {{
                display: grid;
                gap: 16px;
              }}

              .inspector-card .panel-inner {{
                padding: 20px;
              }}

              .inspector-title {{
                margin: 0 0 8px;
                font-size: 1.12rem;
                color: var(--token-text-strong);
              }}

              .inspector-body {{
                margin: 0;
                color: var(--token-text-default);
                line-height: 1.6;
              }}

              .mini-grid {{
                display: grid;
                gap: 10px;
              }}

              .mini-card {{
                padding: 12px 14px;
                border-radius: var(--radius-md);
                background: rgba(255, 255, 255, 0.86);
                border: 1px solid rgba(214, 222, 230, 0.9);
              }}

              .mini-card span {{
                display: block;
                font-size: 0.72rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--token-text-muted);
                margin-bottom: 4px;
              }}

              .mini-card strong {{
                color: var(--token-text-strong);
              }}

              .bottom-grid {{
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 16px;
                margin-top: 20px;
              }}

              .table-panel {{
                min-width: 0;
              }}

              .legend-line {{
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 0.8rem;
                color: var(--token-text-muted);
              }}

              .legend-line::before {{
                content: "";
                width: 24px;
                height: 2px;
                border-radius: 999px;
                background: currentColor;
              }}

              .screen-reader {{
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

              @media (max-width: 1320px) {{
                .lab-grid {{
                  grid-template-columns: 288px minmax(0, 1fr);
                }}

                .inspector-card {{
                  position: static;
                  grid-column: 1 / -1;
                }}
              }}

              @media (max-width: 1040px) {{
                .summary-strip {{
                  min-width: 0;
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }}

                .lab-grid {{
                  grid-template-columns: 1fr;
                }}

                .rail-panel {{
                  position: static;
                }}

                .parity-grid,
                .bottom-grid {{
                  grid-template-columns: 1fr;
                }}
              }}

              @media (max-width: 720px) {{
                body {{
                  padding: 14px;
                }}

                .masthead {{
                  padding: 16px;
                  flex-direction: column;
                  align-items: stretch;
                }}

                .summary-strip {{
                  width: 100%;
                  grid-template-columns: 1fr 1fr;
                }}
              }}

              @media (prefers-reduced-motion: reduce) {{
                * {{
                  animation: none !important;
                  transition: none !important;
                  scroll-behavior: auto !important;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="lab-shell" data-testid="exception-path-lab">
              <header class="masthead">
                <div class="brand">
                  <svg
                    data-testid="exception-braid-mark"
                    width="38"
                    height="38"
                    viewBox="0 0 38 38"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect x="1.5" y="1.5" width="35" height="35" rx="12" fill="#EEF2F6" stroke="#D6DEE6" />
                    <path d="M10 12C15 12 15 26 19 26C23 26 23 12 28 12" stroke="#2F6FED" stroke-width="2.4" stroke-linecap="round"/>
                    <path d="M10 19C15 19 15 30 19 30C23 30 23 8 28 8" stroke="#5B61F6" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
                    <path d="M10 26C15 26 15 12 19 12C23 12 23 26 28 26" stroke="#B7791F" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
                  </svg>
                  <div class="brand-wordmark">
                    <strong>VECELLS</strong>
                    <span>Signal Atlas Live / Exception Path Lab</span>
                  </div>
                </div>
                <div class="summary-strip" data-testid="summary-strip">
                  <div class="summary-chip">
                    <span>Cases</span>
                    <strong data-testid="summary-cases"></strong>
                  </div>
                  <div class="summary-chip">
                    <span>Full Surface</span>
                    <strong data-testid="summary-full"></strong>
                  </div>
                  <div class="summary-chip">
                    <span>Partial Surface</span>
                    <strong data-testid="summary-partial"></strong>
                  </div>
                  <div class="summary-chip">
                    <span>Blocked Close</span>
                    <strong data-testid="summary-blocked"></strong>
                  </div>
                </div>
              </header>

              <div class="lab-grid">
                <nav class="panel rail-panel" aria-label="Exception case rail" data-testid="case-family-rail">
                  <div class="panel-inner">
                    <div class="rail-controls">
                      <label>
                        Case family
                        <select data-testid="case-family-filter" id="case-family-filter"></select>
                      </label>
                      <label>
                        Browser proof
                        <select data-testid="proof-filter" id="proof-filter">
                          <option value="all">All proof states</option>
                          <option value="full_surface_proof">Full surface proof</option>
                          <option value="partial_surface_proof">Partial surface proof</option>
                        </select>
                      </label>
                    </div>
                    <div class="case-list" data-testid="case-list" id="case-list"></div>
                  </div>
                </nav>

                <main class="center-column" aria-label="Exception path canvas" data-testid="exception-canvas">
                  <section class="panel visual-card" tabindex="0" data-testid="replay-ladder">
                    <div class="panel-inner">
                      <div class="visual-head">
                        <div>
                          <h2>Replay Path Ladder</h2>
                          <p data-testid="replay-subtitle"></p>
                        </div>
                        <span class="legend-line" style="color: var(--token-accent-replay);">Deterministic return before any second effect</span>
                      </div>
                      <div class="parity-grid">
                        <div class="ladder" data-testid="replay-step-list"></div>
                        <div>
                          <table data-testid="replay-step-table">
                            <thead>
                              <tr><th>Metric</th><th>Value</th></tr>
                            </thead>
                            <tbody></tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section class="panel visual-card" tabindex="0" data-testid="duplicate-cluster-map">
                    <div class="panel-inner">
                      <div class="visual-head">
                        <div>
                          <h2>Duplicate Cluster Map</h2>
                          <p data-testid="duplicate-subtitle"></p>
                        </div>
                        <span class="legend-line" style="color: var(--token-accent-review);">Review-required clusters stay visible and blocker-bound</span>
                      </div>
                      <div class="parity-grid">
                        <div class="duplicate-map" data-testid="duplicate-node-list"></div>
                        <div>
                          <table data-testid="duplicate-truth-table">
                            <thead>
                              <tr><th>Metric</th><th>Value</th></tr>
                            </thead>
                            <tbody></tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section class="panel visual-card" tabindex="0" data-testid="fallback-continuity-ribbon">
                    <div class="panel-inner">
                      <div class="visual-head">
                        <div>
                          <h2>Fallback Continuity Ribbon</h2>
                          <p data-testid="fallback-subtitle"></p>
                        </div>
                        <span class="legend-line" style="color: var(--token-accent-continuity);">Degraded continuity remains truthful and same-lineage</span>
                      </div>
                      <div class="parity-grid">
                        <div class="fallback-ribbon" data-testid="fallback-stage-list"></div>
                        <div>
                          <table data-testid="fallback-truth-table">
                            <thead>
                              <tr><th>Metric</th><th>Value</th></tr>
                            </thead>
                            <tbody></tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </section>
                </main>

                <aside class="panel inspector-card" aria-label="Exception inspector" data-testid="exception-inspector">
                  <div class="panel-inner">
                    <div class="inspector-head">
                      <h2>Inspector</h2>
                      <p class="inspector-subtitle">Tuple, blocker, proof, and continuity basis for the selected unhappy path.</p>
                    </div>
                    <div class="inspector-stack">
                      <div>
                        <h3 class="inspector-title" data-testid="inspector-title"></h3>
                        <p class="inspector-body" data-testid="inspector-summary"></p>
                      </div>
                      <div class="mini-grid" data-testid="inspector-metrics"></div>
                      <div>
                        <table data-testid="case-summary-table">
                          <thead>
                            <tr><th>Metric</th><th>Value</th></tr>
                          </thead>
                          <tbody></tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>

              <div class="bottom-grid">
                <section class="panel table-panel" tabindex="0" data-testid="evidence-table-region">
                  <div class="panel-inner">
                    <div class="table-head">
                      <h2>Evidence</h2>
                      <p>Machine-readable proof rows and artifact refs.</p>
                    </div>
                    <table data-testid="evidence-table">
                      <thead>
                        <tr><th>Metric</th><th>Value</th></tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>
                </section>

                <section class="panel table-panel" tabindex="0" data-testid="event-table-region">
                  <div class="panel-inner">
                    <div class="table-head">
                      <h2>Events</h2>
                      <p>Canonical or bounded-gap event expectations for the selected case.</p>
                    </div>
                    <table data-testid="event-table">
                      <thead>
                        <tr><th>Metric</th><th>Value</th></tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>
                </section>

                <section class="panel table-panel" tabindex="0" data-testid="blocker-table-region">
                  <div class="panel-inner">
                    <div class="table-head">
                      <h2>Blockers</h2>
                      <p>Lineage blockers, gap refs, and closure status for the selected case.</p>
                    </div>
                    <table data-testid="blocker-table">
                      <thead>
                        <tr><th>Metric</th><th>Value</th></tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <script>
              const suiteData = {cases_json};

              const state = {{
                caseFamily: "all",
                proofFilter: "all",
                selectedCaseId: suiteData.exceptionCases[0]?.caseId ?? "",
              }};

              const familyFilter = document.getElementById("case-family-filter");
              const proofFilter = document.getElementById("proof-filter");
              const caseList = document.getElementById("case-list");

              const summaryCases = document.querySelector("[data-testid='summary-cases']");
              const summaryFull = document.querySelector("[data-testid='summary-full']");
              const summaryPartial = document.querySelector("[data-testid='summary-partial']");
              const summaryBlocked = document.querySelector("[data-testid='summary-blocked']");

              function buildFamilyOptions() {{
                const familyIds = Array.from(
                  new Set(suiteData.exceptionCases.map((entry) => entry.caseFamily)),
                );
                familyFilter.innerHTML = "";
                const allOption = document.createElement("option");
                allOption.value = "all";
                allOption.textContent = "All families";
                familyFilter.appendChild(allOption);
                for (const familyId of familyIds) {{
                  const option = document.createElement("option");
                  option.value = familyId;
                  option.textContent = familyId;
                  familyFilter.appendChild(option);
                }}
              }}

              function visibleCases() {{
                return suiteData.exceptionCases.filter((entry) => {{
                  const familyMatches = state.caseFamily === "all" || entry.caseFamily === state.caseFamily;
                  const proofMatches = state.proofFilter === "all" || entry.browserProofState === state.proofFilter;
                  return familyMatches && proofMatches;
                }});
              }}

              function ensureSelectedVisible() {{
                const visible = visibleCases();
                if (!visible.some((entry) => entry.caseId === state.selectedCaseId)) {{
                  state.selectedCaseId = visible[0]?.caseId ?? "";
                }}
              }}

              function selectedCase() {{
                ensureSelectedVisible();
                return suiteData.exceptionCases.find((entry) => entry.caseId === state.selectedCaseId);
              }}

              function accentTone(entry) {{
                return entry.caseAccent || "review";
              }}

              function renderList() {{
                const visible = visibleCases();
                caseList.innerHTML = "";
                for (const entry of visible) {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "case-button";
                  button.dataset.testid = `case-button-${{entry.slug}}`;
                  button.dataset.caseId = entry.caseId;
                  button.dataset.active = entry.caseId === state.selectedCaseId ? "true" : "false";
                  button.innerHTML = `
                    <div class="case-meta">
                      <span class="case-chip" data-tone="${{accentTone(entry)}}">${{entry.caseGroup.replace(/_/g, " ")}}</span>
                      <span class="case-chip">${{entry.browserProofState}}</span>
                    </div>
                    <h3 class="case-title">${{entry.title}}</h3>
                    <p class="case-summary">${{entry.summary}}</p>
                  `;
                  button.addEventListener("click", () => {{
                    state.selectedCaseId = entry.caseId;
                    render();
                  }});
                  caseList.appendChild(button);
                }}

                const buttons = Array.from(caseList.querySelectorAll(".case-button"));
                buttons.forEach((button, index) => {{
                  button.addEventListener("keydown", (event) => {{
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {{
                      return;
                    }}
                    event.preventDefault();
                    const delta = event.key === "ArrowDown" ? 1 : -1;
                    const next = buttons[index + delta] ?? buttons[event.key === "ArrowDown" ? 0 : buttons.length - 1];
                    next?.focus();
                  }});
                }});
              }}

              function renderTable(testId, rows) {{
                const tbody = document.querySelector(`[data-testid='${{testId}}'] tbody`);
                if (!tbody) {{
                  return;
                }}
                tbody.innerHTML = "";
                for (const row of rows) {{
                  const tr = document.createElement("tr");
                  tr.innerHTML = `<th scope="row">${{row.label}}</th><td>${{row.value}}</td>`;
                  tbody.appendChild(tr);
                }}
              }}

              function renderMetricCards(entry) {{
                const metrics = document.querySelector("[data-testid='inspector-metrics']");
                metrics.innerHTML = "";
                const topRows = entry.summaryRows.slice(0, 4);
                for (const row of topRows) {{
                  const card = document.createElement("div");
                  card.className = "mini-card";
                  card.innerHTML = `<span>${{row.label}}</span><strong>${{row.value}}</strong>`;
                  metrics.appendChild(card);
                }}
              }}

              function renderListPanel(testId, items, itemClass) {{
                const container = document.querySelector(`[data-testid='${{testId}}']`);
                container.innerHTML = "";
                for (const item of items) {{
                  const article = document.createElement("article");
                  article.className = `${{itemClass}} state-${{item.state}}`;
                  article.innerHTML = `
                    <div class="step-label">
                      <span class="step-dot" aria-hidden="true"></span>
                      <strong>${{item.label}}</strong>
                    </div>
                    <div>${{item.detail}}</div>
                  `;
                  container.appendChild(article);
                }}
              }}

              function renderSummary() {{
                summaryCases.textContent = String(suiteData.summary.exception_case_count);
                summaryFull.textContent = String(suiteData.summary.full_surface_proof_count);
                summaryPartial.textContent = String(suiteData.summary.partial_surface_proof_count);
                summaryBlocked.textContent = String(suiteData.summary.closure_blocked_case_count);
              }}

              function render() {{
                ensureSelectedVisible();
                renderList();
                renderSummary();
                const entry = selectedCase();
                if (!entry) {{
                  return;
                }}

                document.querySelector("[data-testid='replay-subtitle']").textContent = entry.continuityOutcome;
                document.querySelector("[data-testid='duplicate-subtitle']").textContent =
                  `Case family: ${{entry.caseFamily}}`;
                document.querySelector("[data-testid='fallback-subtitle']").textContent =
                  `Patient-visible state: ${{entry.patientVisibleState}}`;
                document.querySelector("[data-testid='inspector-title']").textContent = entry.title;
                document.querySelector("[data-testid='inspector-summary']").textContent = entry.summary;

                renderMetricCards(entry);
                renderListPanel("replay-step-list", entry.replaySteps, "ladder-step");
                renderListPanel("duplicate-node-list", entry.duplicateNodes, "duplicate-node");
                renderListPanel("fallback-stage-list", entry.fallbackStages, "fallback-stage");

                renderTable("case-summary-table", entry.summaryRows);
                renderTable("replay-step-table", entry.replayRows);
                renderTable("duplicate-truth-table", entry.duplicateRows);
                renderTable("fallback-truth-table", entry.fallbackRows);
                renderTable("evidence-table", entry.evidenceRows);

                renderTable(
                  "event-table",
                  entry.eventRows.concat(
                    entry.eventExpectations.map((item) => ({{
                      label: item.eventName,
                      value: `${{item.registryState}} / ${{item.obligation}}`,
                    }})),
                  ),
                );
                renderTable(
                  "blocker-table",
                  entry.blockerRows.concat([
                    {{
                      label: "Gap refs",
                      value: entry.gapRefs.length ? entry.gapRefs.join(", ") : "none",
                    }},
                    {{
                      label: "Browser surfaces",
                      value: entry.browserSurfaceRefs.join(", "),
                    }},
                  ]),
                );
              }}

              buildFamilyOptions();
              familyFilter.addEventListener("change", () => {{
                state.caseFamily = familyFilter.value;
                render();
              }});
              proofFilter.addEventListener("change", () => {{
                state.proofFilter = proofFilter.value;
                render();
              }});

              render();
            </script>
          </body>
        </html>
        """
    ).strip()


def main() -> None:
    suite_material = build_case_payloads()

    suite_payload = {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": suite_material["generatedAt"],
        "source_precedence": SOURCE_PRECEDENCE,
        "required_case_families": REQUIRED_CASE_FAMILIES,
        "summary": suite_material["summary"],
        "exceptionCases": suite_material["cases"],
        "eventExpectations": suite_material["eventExpectations"],
        "boundedGaps": suite_material["boundedGaps"],
    }

    write_csv(ADAPTER_REPLAY_CASES_PATH, suite_material["adapterReplayRows"])
    write_csv(DUPLICATE_CLUSTER_CASES_PATH, suite_material["duplicateClusterRows"])
    write_csv(QUARANTINE_FALLBACK_CASES_PATH, suite_material["quarantineFallbackRows"])
    write_json(EVENT_EXPECTATIONS_PATH, {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": suite_material["generatedAt"],
        "source_precedence": SOURCE_PRECEDENCE,
        "eventExpectations": suite_material["eventExpectations"],
    })
    write_json(SUITE_RESULTS_PATH, suite_payload)
    write_text(SUITE_DOC_PATH, build_suite_doc(suite_material))
    write_text(TRUTH_DOC_PATH, build_truth_doc(suite_material))
    write_text(LAB_HTML_PATH, build_lab_html(suite_payload))


if __name__ == "__main__":
    main()
