#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_INTEGRATION_DIR = ROOT / "data" / "integration"
DATA_RELEASE_DIR = ROOT / "data" / "release"
DATA_ASSURANCE_DIR = ROOT / "data" / "assurance"
DOCS_PROGRAMME_DIR = ROOT / "docs" / "programme"

REFERENCE_CATALOG_PATH = DATA_ANALYSIS_DIR / "reference_case_catalog.json"
TRACE_MATRIX_PATH = DATA_ANALYSIS_DIR / "reference_flow_trace_matrix.csv"
PROJECTION_SNAPSHOTS_PATH = DATA_ANALYSIS_DIR / "reference_flow_projection_snapshots.csv"
SETTLEMENT_CHAIN_PATH = DATA_ANALYSIS_DIR / "reference_flow_settlement_chain.jsonl"
SURFACE_AUTHORITY_VERDICTS_PATH = DATA_ANALYSIS_DIR / "surface_authority_verdicts.json"
SURFACE_AUTHORITY_TUPLES_PATH = DATA_ANALYSIS_DIR / "surface_authority_tuple_catalog.json"
MANIFEST_FUSION_VERDICTS_PATH = DATA_ANALYSIS_DIR / "manifest_fusion_verdicts.json"
RUNTIME_PUBLICATION_BUNDLES_PATH = DATA_ANALYSIS_DIR / "runtime_publication_bundles.json"
RELEASE_PARITY_PATH = DATA_ANALYSIS_DIR / "release_publication_parity_records.json"
RESILIENCE_BASELINE_PATH = DATA_ANALYSIS_DIR / "resilience_baseline_catalog.json"
MIGRATION_BACKFILL_PATH = DATA_ANALYSIS_DIR / "migration_backfill_control_catalog.json"
DESIGN_PUBLICATION_BUNDLE_PATH = DATA_ANALYSIS_DIR / "design_contract_publication_bundle.json"
PERSISTENT_SHELL_CONTRACTS_PATH = DATA_ANALYSIS_DIR / "persistent_shell_contracts.json"
COMPONENT_PUBLICATION_PATH = DATA_ANALYSIS_DIR / "component_primitive_publication.json"
FRONTEND_MANIFESTS_PATH = DATA_ANALYSIS_DIR / "frontend_contract_manifests.json"
AUDIENCE_SURFACE_BINDINGS_PATH = DATA_ANALYSIS_DIR / "audience_surface_runtime_bindings.json"

ADAPTER_VALIDATION_RESULTS_PATH = DATA_INTEGRATION_DIR / "adapter_validation_results.json"
ADAPTER_CONTRACT_CATALOG_PATH = DATA_INTEGRATION_DIR / "seeded_external_contract_catalog.json"
LIVE_PROVIDER_HANDOVER_PATH = DATA_INTEGRATION_DIR / "live_provider_handover_matrix.csv"

RELEASE_CANDIDATE_PATH = DATA_RELEASE_DIR / "release_candidate_tuple.json"
FREEZE_BLOCKERS_PATH = DATA_RELEASE_DIR / "freeze_blockers.json"

DCB0129_OUTLINE_PATH = DATA_ASSURANCE_DIR / "dcb0129_safety_case_outline.json"
IM1_ARTIFACT_INDEX_PATH = DATA_ASSURANCE_DIR / "im1_artifact_index.json"
PRIVACY_TRACEABILITY_PATH = DATA_ASSURANCE_DIR / "privacy_control_traceability.json"

PHASE0_EVIDENCE_INDEX_PATH = DOCS_PROGRAMME_DIR / "20_phase0_evidence_pack_index.md"
PHASE0_GATE_BLOCKERS_PATH = DOCS_PROGRAMME_DIR / "20_phase0_gate_verdict_and_blockers.md"
REFERENCE_OBSERVATORY_PATH = DOCS_PROGRAMME_DIR / "128_reference_flow_observatory.html"
MANIFEST_FUSION_ATLAS_PATH = ROOT / "docs" / "architecture" / "127_manifest_fusion_studio.html"
PARITY_BOARD_PATH = ROOT / "docs" / "architecture" / "130_audience_surface_parity_board.html"
FREEZE_BOARD_PATH = ROOT / "docs" / "release" / "131_release_candidate_freeze_board.html"

EXIT_ARTIFACT_INDEX_PATH = DATA_ANALYSIS_DIR / "phase0_exit_artifact_index.json"
FOUNDATION_DEMO_SCENARIOS_PATH = DATA_ANALYSIS_DIR / "foundation_demo_scenarios.csv"
FOUNDATION_DEMO_TRACE_INDEX_PATH = DATA_ANALYSIS_DIR / "foundation_demo_trace_index.json"
FOUNDATION_DEMO_SURFACE_MATRIX_PATH = DATA_ANALYSIS_DIR / "foundation_demo_surface_capture_matrix.csv"

EXIT_ARTIFACTS_DOC_PATH = DOCS_PROGRAMME_DIR / "132_phase0_exit_artifacts.md"
DEMO_SCRIPT_DOC_PATH = DOCS_PROGRAMME_DIR / "132_happy_unhappy_demo_script.md"
EXIT_EVIDENCE_INDEX_DOC_PATH = DOCS_PROGRAMME_DIR / "132_phase0_exit_evidence_index.md"
FOUNDATION_ATLAS_PATH = DOCS_PROGRAMME_DIR / "132_phase0_foundation_atlas.html"

TASK_ID = "seq_132"
VISUAL_MODE = "Phase0_Foundation_Atlas"
EXIT_PACK_REF = "P0_EXIT_PACK_132_V1"
EXIT_READINESS_STATE = "withheld"

SOURCE_PRECEDENCE = [
    "prompt/132.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
    "blueprint/phase-0-the-foundation-protocol.md#the-detailed-phase-0-development-algorithm",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
    "docs/programme/20_phase0_evidence_pack_index.md",
    "docs/programme/20_phase0_gate_verdict_and_blockers.md",
    "data/analysis/reference_case_catalog.json",
    "data/release/release_candidate_tuple.json",
    "data/analysis/surface_authority_verdicts.json",
]

REQUIRED_SCENARIOS = [
    "happy_path",
    "exact_replay_path",
    "collision_or_review_required_path",
    "quarantine_and_fallback_review_path",
    "identity_hold_path",
    "publication_or_recovery_drift_path",
    "confirmation_blocked_path",
]

REQUIRED_PROOF_FAMILIES = [
    "current_release_candidate_dossier",
    "runtime_publication_and_surface_truth",
    "synthetic_reference_flow",
    "adapter_and_simulator_validation",
    "recovery_resilience_and_migration",
    "assurance_and_compliance_foundation",
    "shell_contract_and_design_foundation",
    "phase0_gate_context",
    "phase0_exit_pack_validation",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def load_jsonl_rows(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n")


def dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def short_hash(*parts: str) -> str:
    digest = hashlib.sha256("||".join(parts).encode("utf8")).hexdigest()
    return digest[:16]


def proof_posture_from_states(binding_state: str | None, writability_state: str | None) -> str:
    if binding_state == "blocked" or writability_state == "blocked":
        return "blocked_proof"
    if binding_state == "partial":
        return "partial_surface_proof"
    if binding_state == "recovery_only" or writability_state == "recovery_only":
        return "recovery_only_proof"
    return "exact_proof"


def scenario_accent(required_code: str) -> str:
    return {
        "happy_path": "happy",
        "exact_replay_path": "replay",
        "collision_or_review_required_path": "recovery",
        "quarantine_and_fallback_review_path": "recovery",
        "identity_hold_path": "blocked",
        "publication_or_recovery_drift_path": "trace",
        "confirmation_blocked_path": "blocked",
    }[required_code]


def scenario_disposition(required_code: str) -> str:
    return "happy" if required_code == "happy_path" else "unhappy"


def parse_axis_transition(transition: str) -> dict[str, str]:
    axis, states = transition.split(":", 1)
    origin, target = states.split("->", 1)
    owner = {
        "submission": "SubmissionBackbone",
        "promotion": "SubmissionBackbone",
        "workflow": "LifecycleCoordinator",
        "same_shell": "AudienceSurfaceRuntimeBinding",
        "duplicate": "DuplicateReviewCoordinator",
        "lineage": "LifecycleCoordinator",
        "closure": "LifecycleCoordinator",
        "operator_posture": "ReleaseRecoveryDisposition",
        "progress": "CommandSettlementRecord",
        "fallback": "FallbackReviewCase",
        "subject_binding": "IdentityBindingAuthority",
        "identity": "IdentityRepairGovernor",
        "support": "ReleaseRecoveryDisposition",
        "restore": "SupportReplayRestoreSettlement",
        "booking": "ExternalConfirmationGate",
        "confirmation_gate": "ExternalConfirmationGate",
        "hub_shell": "AudienceSurfaceRuntimeBinding",
    }.get(axis, "Phase0Foundation")
    return {
        "axis": axis,
        "origin": origin,
        "target": target,
        "label": transition,
        "owner": owner,
    }


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    def escape_cell(value: str) -> str:
        return value.replace("|", "\\|")

    output = [
        "| " + " | ".join(escape_cell(header) for header in headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        output.append("| " + " | ".join(escape_cell(cell) for cell in row) + " |")
    return "\n".join(output)


def classify_family_state(states: list[str]) -> str:
    if any(state == "blocked" for state in states):
        return "blocked"
    if any(state == "partial" for state in states):
        return "partial"
    return "current"


def main() -> None:
    generated_at = now_iso()
    captured_on = generated_at[:10]

    reference_catalog = load_json(REFERENCE_CATALOG_PATH)
    surface_verdicts = load_json(SURFACE_AUTHORITY_VERDICTS_PATH)
    surface_tuples = load_json(SURFACE_AUTHORITY_TUPLES_PATH)
    manifest_fusion = load_json(MANIFEST_FUSION_VERDICTS_PATH)
    runtime_publication = load_json(RUNTIME_PUBLICATION_BUNDLES_PATH)
    release_parity = load_json(RELEASE_PARITY_PATH)
    resilience_baseline = load_json(RESILIENCE_BASELINE_PATH)
    migration_backfill = load_json(MIGRATION_BACKFILL_PATH)
    adapter_validation = load_json(ADAPTER_VALIDATION_RESULTS_PATH)
    release_candidate_export = load_json(RELEASE_CANDIDATE_PATH)
    freeze_blockers_export = load_json(FREEZE_BLOCKERS_PATH)
    dcb0129_outline = load_json(DCB0129_OUTLINE_PATH)
    im1_artifacts = load_json(IM1_ARTIFACT_INDEX_PATH)
    privacy_traceability = load_json(PRIVACY_TRACEABILITY_PATH)
    trace_matrix_rows = load_csv_rows(TRACE_MATRIX_PATH)
    projection_rows = load_csv_rows(PROJECTION_SNAPSHOTS_PATH)
    settlement_rows = load_jsonl_rows(SETTLEMENT_CHAIN_PATH)

    reference_cases_by_id = {
        case["referenceCaseId"]: case for case in reference_catalog["referenceCases"]
    }
    flow_cases_by_id = {
        case["referenceCaseId"]: case for case in reference_catalog["referenceFlowCases"]
    }
    surface_rows_by_surface = {
        row["inventorySurfaceRef"]: row
        for row in surface_verdicts["rows"]
        if row["inventorySurfaceRef"]
    }
    surface_tuples_by_surface = {
        row["inventorySurfaceRef"]: row
        for row in surface_tuples["surfaceAuthorityTuples"]
        if row["inventorySurfaceRef"]
    }
    blockers_by_id = {
        row["blockerId"]: row for row in freeze_blockers_export["blockers"]
    }
    settlement_rows_by_case: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in settlement_rows:
        settlement_rows_by_case[row["referenceCaseId"]].append(row)
    trace_rows_by_case: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in trace_matrix_rows:
        trace_rows_by_case[row["referenceCaseId"]].append(row)
    projection_rows_by_case: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in projection_rows:
        projection_rows_by_case[row["referenceCaseId"]].append(row)

    release_candidate = release_candidate_export["releaseCandidateTuple"]
    local_ring_summary = next(
        row
        for row in release_candidate_export["environmentCompatibilitySummaries"]
        if row["environmentRing"] == release_candidate_export["selectedEnvironmentRing"]
    )
    local_gateway_blocker = blockers_by_id["FZB_131_LOCAL_GATEWAY_SURFACES"]
    support_surface_row = surface_rows_by_surface["surf_support_replay_observe"]
    support_surface_tuple = surface_tuples_by_surface["surf_support_replay_observe"]

    scenario_specs = [
        {
            "scenarioId": "P0_SCN_001_HAPPY_PATH",
            "requiredScenarioCode": "happy_path",
            "displayLabel": "Happy path",
            "flowId": "RC_FLOW_001",
        },
        {
            "scenarioId": "P0_SCN_002_EXACT_REPLAY",
            "requiredScenarioCode": "exact_replay_path",
            "displayLabel": "Exact replay",
            "flowId": "RC_FLOW_002",
        },
        {
            "scenarioId": "P0_SCN_003_COLLISION_REVIEW",
            "requiredScenarioCode": "collision_or_review_required_path",
            "displayLabel": "Collision review",
            "flowId": "RC_FLOW_003",
        },
        {
            "scenarioId": "P0_SCN_004_QUARANTINE_FALLBACK",
            "requiredScenarioCode": "quarantine_and_fallback_review_path",
            "displayLabel": "Fallback review",
            "flowId": "RC_FLOW_004",
        },
        {
            "scenarioId": "P0_SCN_005_IDENTITY_HOLD",
            "requiredScenarioCode": "identity_hold_path",
            "displayLabel": "Identity hold",
            "flowId": "RC_FLOW_005",
        },
        {
            "scenarioId": "P0_SCN_006_PUBLICATION_DRIFT",
            "requiredScenarioCode": "publication_or_recovery_drift_path",
            "displayLabel": "Publication drift",
            "legacyCaseId": "RC_059_SUPPORT_REPLAY_RESTORE_V1",
        },
        {
            "scenarioId": "P0_SCN_007_CONFIRMATION_BLOCKED",
            "requiredScenarioCode": "confirmation_blocked_path",
            "displayLabel": "Confirmation blocked",
            "flowId": "RC_FLOW_006",
        },
    ]

    scenario_rows: list[dict[str, Any]] = []
    trace_index_rows: list[dict[str, Any]] = []
    surface_capture_rows: list[dict[str, Any]] = []

    for spec in scenario_specs:
        required_code = spec["requiredScenarioCode"]
        accent = scenario_accent(required_code)
        disposition = scenario_disposition(required_code)

        if "flowId" in spec:
            flow = flow_cases_by_id[spec["flowId"]]
            legacy = reference_cases_by_id[flow["legacyReferenceCaseId"]]
            shell = flow["actualTrace"]["shell"]
            surface_row = surface_rows_by_surface[shell["audienceSurface"]]
            settlement_ladder = [
                {
                    "stepIndex": row["stepIndex"],
                    "layer": row["layer"],
                    "state": row["state"],
                    "summary": row["summary"],
                    "authoritative": bool(row["authoritative"]),
                    "settlementRef": row["settlementRef"],
                    "causalRef": row["causalRef"],
                }
                for row in settlement_rows_by_case[flow["referenceCaseId"]]
            ]
            proof_posture = proof_posture_from_states(
                shell["bindingVerdict"], shell["writabilityState"]
            )
            trace_refs = [
                f"data/analysis/reference_case_catalog.json#{flow['referenceCaseId']}",
                f"data/analysis/reference_flow_trace_matrix.csv#{flow['referenceCaseId']}",
                f"data/analysis/reference_flow_projection_snapshots.csv#{flow['referenceCaseId']}",
                f"data/analysis/reference_flow_settlement_chain.jsonl#{flow['referenceCaseId']}",
                f"data/release/release_candidate_tuple.json#{release_candidate['releaseRef']}",
                f"data/analysis/surface_authority_verdicts.json#{surface_row['surfaceAuthorityVerdictId']}",
            ]
            evidence_refs = dedupe(
                trace_refs
                + [
                    f"data/analysis/reference_case_catalog.json#{legacy['referenceCaseId']}",
                    "docs/programme/128_reference_flow_observatory.html",
                ]
            )
            source_rule_refs = dedupe(flow["provesRuleRefs"] + legacy["source_refs"])
            upstream_task_refs = dedupe(
                flow["dependencyTaskRefs"] + ["seq_128", "seq_130", "seq_131"]
            )
            state_axis_rows = [
                parse_axis_transition(value)
                for value in legacy["expectedStateAxisTransitions"]
            ]
            event_refs = dedupe(
                flow["expectedEvents"] + flow["actualTrace"]["domain"]["eventNames"]
            )
            blocker_refs = dedupe(
                flow["expectedClosureBlockers"]
                + flow["actualTrace"]["domain"]["closureBlockerRefs"]
                + legacy["expectedClosureBlockerRefs"]
            )
            recovery_refs = dedupe(
                legacy["expectedRecoveryEnvelopeRefs"]
                + surface_row["recoveryDispositionRefs"]
            )
            scenario_summary = flow["title"]
            notes = dedupe([flow["notes"], legacy["notes"]])
            route_family_ref = flow["routeFamilyRef"]
            audience_surface_ref = shell["audienceSurface"]
            shell_slug = shell["shellSlug"]
            shell_type = shell["shellType"]
            surface_binding_state = shell["bindingVerdict"]
            surface_writability_state = shell["writabilityState"]
            surface_calm_state = shell["calmState"]
            continuity_expectation = shell["continuityExpectation"]
            trace_digest_ref = flow["traceDigestRef"]
            supporting_projection_refs = [
                row["projectionName"] for row in projection_rows_by_case[flow["referenceCaseId"]]
            ]
        else:
            legacy = reference_cases_by_id[spec["legacyCaseId"]]
            settlement_ladder = [
                {
                    "stepIndex": 1,
                    "layer": "release_candidate",
                    "state": release_candidate["freezeVerdict"],
                    "summary": "The exact release candidate remains frozen and provenance-bound.",
                    "authoritative": True,
                    "settlementRef": release_candidate["releaseApprovalFreezeRef"],
                    "causalRef": release_candidate["candidateTupleHash"],
                },
                {
                    "stepIndex": 2,
                    "layer": "environment_compatibility",
                    "state": local_ring_summary["overallCompatibilityState"],
                    "summary": "Local compatibility stays non-exact because gateway-backed surfaces remain bounded.",
                    "authoritative": True,
                    "settlementRef": local_ring_summary["environmentCompatibilityRef"],
                    "causalRef": local_ring_summary["environmentBaselineFingerprintRef"],
                },
                {
                    "stepIndex": 3,
                    "layer": "freeze_blocker",
                    "state": local_gateway_blocker["compatibilityState"],
                    "summary": local_gateway_blocker["summary"],
                    "authoritative": True,
                    "settlementRef": local_gateway_blocker["blockerId"],
                    "causalRef": local_gateway_blocker["relatedMatrixRowId"],
                },
                {
                    "stepIndex": 4,
                    "layer": "surface_authority",
                    "state": support_surface_row["bindingState"],
                    "summary": "Support replay stays same-shell but recovery-only; writable posture is frozen behind governed recovery dispositions.",
                    "authoritative": True,
                    "settlementRef": support_surface_row["surfaceAuthorityVerdictId"],
                    "causalRef": support_surface_tuple["tupleId"],
                },
            ]
            proof_posture = proof_posture_from_states(
                support_surface_row["bindingState"], support_surface_row["writableTruthState"]
            )
            trace_refs = [
                f"data/release/release_candidate_tuple.json#{release_candidate['releaseRef']}",
                f"data/release/freeze_blockers.json#{local_gateway_blocker['blockerId']}",
                f"data/analysis/surface_authority_verdicts.json#{support_surface_row['surfaceAuthorityVerdictId']}",
                f"data/analysis/surface_authority_tuple_catalog.json#{support_surface_tuple['tupleId']}",
                f"data/analysis/reference_case_catalog.json#{legacy['referenceCaseId']}",
            ]
            evidence_refs = dedupe(
                trace_refs
                + [
                    "docs/release/131_release_candidate_freeze_board.html",
                    "docs/architecture/130_audience_surface_parity_board.html",
                    "docs/programme/128_reference_flow_observatory.html",
                ]
            )
            source_rule_refs = dedupe(
                legacy["source_refs"]
                + release_candidate["source_refs"]
                + support_surface_tuple["sourceRefs"]
            )
            upstream_task_refs = dedupe(["seq_127", "seq_128", "seq_130", "seq_131"])
            state_axis_rows = [
                parse_axis_transition(value)
                for value in legacy["expectedStateAxisTransitions"]
            ] + [
                {
                    "axis": "release_surface_truth",
                    "origin": "writable_candidate",
                    "target": "recovery_only_surface",
                    "label": "release_surface_truth:writable_candidate->recovery_only_surface",
                    "owner": "ReleaseApprovalFreeze",
                }
            ]
            event_refs = []
            blocker_refs = dedupe(
                legacy["expectedClosureBlockerRefs"]
                + [local_gateway_blocker["blockerId"]]
                + local_ring_summary["blockerRefs"]
            )
            recovery_refs = dedupe(
                legacy["expectedRecoveryEnvelopeRefs"]
                + support_surface_row["recoveryDispositionRefs"]
                + [release_candidate["recoveryDispositionSetRef"]]
            )
            scenario_summary = (
                "Current local publication stays same-shell and source-traceable, but writable posture "
                "remains frozen behind the release candidate's gateway-surface blocker and recovery-only support surface."
            )
            notes = dedupe([legacy["notes"], local_gateway_blocker["summary"]])
            route_family_ref = support_surface_row["routeFamilyRef"]
            audience_surface_ref = support_surface_row["inventorySurfaceRef"]
            shell_slug = support_surface_tuple["shellSlug"]
            shell_type = support_surface_tuple["shellType"]
            surface_binding_state = support_surface_row["bindingState"]
            surface_writability_state = support_surface_row["writableTruthState"]
            surface_calm_state = support_surface_row["calmTruthState"]
            continuity_expectation = (
                "The support workspace remains in the same shell and keeps evidence visible, "
                "but writable recovery is governed by release and surface authority tuples."
            )
            trace_digest_ref = f"p0trace::{short_hash(spec['scenarioId'], local_gateway_blocker['blockerId'])}"
            supporting_projection_refs = [support_surface_tuple["projectionContractVersionSetRef"]]

        row = {
            "scenario_id": spec["scenarioId"],
            "required_scenario_code": required_code,
            "display_label": spec["displayLabel"],
            "scenario_disposition": disposition,
            "scenario_accent": accent,
            "source_proof_kind": "reference_flow" if "flowId" in spec else "release_candidate_surface_drift",
            "proof_posture": proof_posture,
            "release_ref": release_candidate["releaseRef"],
            "environment_ring": release_candidate_export["selectedEnvironmentRing"],
            "route_family_ref": route_family_ref,
            "audience_surface_ref": audience_surface_ref,
            "shell_slug": shell_slug,
            "shell_type": shell_type,
            "surface_binding_state": surface_binding_state,
            "surface_writability_state": surface_writability_state,
            "surface_calm_state": surface_calm_state,
            "trace_digest_ref": trace_digest_ref,
            "legacy_reference_case_ref": legacy["referenceCaseId"],
            "reference_flow_case_ref": flow["referenceCaseId"] if "flowId" in spec else "",
            "settlement_step_count": len(settlement_ladder),
            "blocker_refs": " | ".join(blocker_refs),
            "recovery_refs": " | ".join(recovery_refs),
            "evidence_refs": " | ".join(evidence_refs),
            "source_rule_refs": " | ".join(source_rule_refs),
            "upstream_task_refs": " | ".join(upstream_task_refs),
            "notes": " | ".join(notes),
        }
        scenario_rows.append(row)

        trace_index_rows.append(
            {
                "scenarioId": spec["scenarioId"],
                "requiredScenarioCode": required_code,
                "displayLabel": spec["displayLabel"],
                "scenarioDisposition": disposition,
                "scenarioAccent": accent,
                "summary": scenario_summary,
                "proofPosture": proof_posture,
                "sourceProofKind": row["source_proof_kind"],
                "releaseRef": release_candidate["releaseRef"],
                "releaseApprovalFreezeRef": release_candidate["releaseApprovalFreezeRef"],
                "environmentRing": release_candidate_export["selectedEnvironmentRing"],
                "legacyReferenceCaseRef": legacy["referenceCaseId"],
                "referenceFlowCaseRef": row["reference_flow_case_ref"] or None,
                "routeFamilyRef": route_family_ref,
                "audienceSurfaceRef": audience_surface_ref,
                "shellSlug": shell_slug,
                "shellType": shell_type,
                "surfaceBindingState": surface_binding_state,
                "surfaceWritabilityState": surface_writability_state,
                "surfaceCalmState": surface_calm_state,
                "continuityExpectation": continuity_expectation,
                "stateAxisTransitions": state_axis_rows,
                "settlementLadder": settlement_ladder,
                "supportingEvents": event_refs,
                "supportingProjectionRefs": supporting_projection_refs,
                "closureBlockerRefs": blocker_refs,
                "recoveryDispositionRefs": recovery_refs,
                "traceArtifactRefs": trace_refs,
                "evidenceRefs": evidence_refs,
                "sourceRuleRefs": source_rule_refs,
                "upstreamTaskRefs": upstream_task_refs,
                "notes": notes,
            }
        )

        surface_capture_rows.append(
            {
                "scenario_id": spec["scenarioId"],
                "audience_surface_ref": audience_surface_ref,
                "route_family_ref": route_family_ref,
                "shell_slug": shell_slug,
                "shell_type": shell_type,
                "binding_verdict": surface_binding_state,
                "writability_state": surface_writability_state,
                "calm_state": surface_calm_state,
                "proof_posture": proof_posture,
                "continuity_expectation": continuity_expectation,
                "recovery_disposition_refs": " | ".join(recovery_refs),
                "release_ref": release_candidate["releaseRef"],
                "release_freeze_verdict": release_candidate["freezeVerdict"],
                "source_trace_refs": " | ".join(trace_refs),
                "notes": scenario_summary,
            }
        )

    proof_families = [
        {
            "familyId": "current_release_candidate_dossier",
            "label": "Current release candidate dossier",
            "familyClass": "release_control",
            "state": "partial",
            "summary": "RC_LOCAL_V1 is exact as a freeze tuple, while local gateway surfaces remain explicitly partial.",
            "artifactRefs": [
                "data/release/release_candidate_tuple.json",
                "data/release/environment_compatibility_matrix.csv",
                "data/release/release_contract_verification_matrix.json",
                "data/release/freeze_blockers.json",
                "docs/release/131_release_candidate_freeze.md",
                "docs/release/131_release_candidate_freeze_board.html",
            ],
            "blockerRefs": ["FZB_131_LOCAL_GATEWAY_SURFACES", "FZB_131_LOCAL_SUMMARY"],
            "sourceRuleRefs": [
                "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
            ],
            "upstreamTaskRefs": ["seq_131"],
        },
        {
            "familyId": "runtime_publication_and_surface_truth",
            "label": "Runtime publication and surface truth",
            "familyClass": "publication_truth",
            "state": "partial",
            "summary": "Publication, parity, and audience-surface truth are published, but multiple surfaces remain recovery-only or blocked.",
            "artifactRefs": [
                "data/analysis/runtime_publication_bundles.json",
                "data/analysis/release_publication_parity_records.json",
                "data/analysis/surface_authority_verdicts.json",
                "data/analysis/surface_authority_tuple_catalog.json",
                "data/analysis/manifest_fusion_verdicts.json",
                "data/analysis/audience_surface_runtime_bindings.json",
                "docs/architecture/127_manifest_fusion_studio.html",
                "docs/architecture/130_audience_surface_parity_board.html",
            ],
            "blockerRefs": ["MFV_127_BROWSER_POSTURE_RECOVERY_ONLY", "MFV_127_DESIGN_LINT_PENDING"],
            "sourceRuleRefs": [
                "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
                "blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm",
            ],
            "upstreamTaskRefs": ["seq_127", "seq_130"],
        },
        {
            "familyId": "synthetic_reference_flow",
            "label": "Synthetic reference flow traces",
            "familyClass": "operational_demo",
            "state": "current",
            "summary": "Six deterministic reference-flow scenarios already prove canonical request, replay, duplicate, quarantine, identity hold, and confirmation debt paths.",
            "artifactRefs": [
                "data/analysis/reference_case_catalog.json",
                "data/analysis/reference_flow_trace_matrix.csv",
                "data/analysis/reference_flow_projection_snapshots.csv",
                "data/analysis/reference_flow_settlement_chain.jsonl",
                "docs/programme/128_reference_flow_observatory.html",
            ],
            "blockerRefs": [],
            "sourceRuleRefs": [
                "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
                "blueprint/phase-1-the-red-flag-gate.md",
            ],
            "upstreamTaskRefs": ["seq_128"],
        },
        {
            "familyId": "adapter_and_simulator_validation",
            "label": "Adapter and simulator validation",
            "familyClass": "dependency_truth",
            "state": "partial",
            "summary": "Most adapters validate against real local paths; malware scanning remains an explicit blocked simulator gap.",
            "artifactRefs": [
                "data/integration/adapter_validation_results.json",
                "data/integration/seeded_external_contract_catalog.json",
                "data/integration/live_provider_handover_matrix.csv",
                "docs/integrations/129_adapter_validation_console.html",
            ],
            "blockerRefs": ["GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1"],
            "sourceRuleRefs": [
                "blueprint/phase-0-the-foundation-protocol.md#The detailed Phase 0 development algorithm",
            ],
            "upstreamTaskRefs": ["seq_129"],
        },
        {
            "familyId": "recovery_resilience_and_migration",
            "label": "Recovery, resilience, and migration posture",
            "familyClass": "operational_readiness",
            "state": "current",
            "summary": "Migration, release-watch, and resilience packs are present and still bind the local candidate.",
            "artifactRefs": [
                "data/analysis/migration_backfill_control_catalog.json",
                "data/analysis/release_watch_pipeline_catalog.json",
                "data/analysis/resilience_baseline_catalog.json",
                "docs/architecture/95_migration_and_backfill_control_room.html",
                "docs/architecture/97_release_watch_pipeline_cockpit.html",
                "docs/architecture/101_resilience_baseline_cockpit.html",
            ],
            "blockerRefs": [],
            "sourceRuleRefs": [
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
                "blueprint/phase-0-the-foundation-protocol.md#The detailed Phase 0 development algorithm",
            ],
            "upstreamTaskRefs": ["par_095", "par_097", "par_101"],
        },
        {
            "familyId": "assurance_and_compliance_foundation",
            "label": "Assurance and compliance foundation",
            "familyClass": "assurance",
            "state": "partial",
            "summary": "Clinical safety, IM1 readiness, and privacy proof are published, while prerequisite gaps remain explicit instead of hidden.",
            "artifactRefs": [
                "data/assurance/dcb0129_safety_case_outline.json",
                "data/assurance/im1_artifact_index.json",
                "data/assurance/privacy_control_traceability.json",
                "docs/assurance/126_privacy_threat_model.md",
                "docs/assurance/123_im1_prerequisite_readiness_pack.md",
            ],
            "blockerRefs": [
                "PREREQUISITE_GAP_125_CLINICAL_SIGNOFF_PACK_PENDING",
                "PREREQUISITE_GAP_122_DSPT_READINESS_PACK_PENDING",
            ],
            "sourceRuleRefs": [
                "blueprint/forensic-audit-findings.md#Finding-120",
            ],
            "upstreamTaskRefs": ["par_121", "par_123", "par_126"],
        },
        {
            "familyId": "shell_contract_and_design_foundation",
            "label": "Shell contract and design foundation",
            "familyClass": "frontend_foundation",
            "state": "partial",
            "summary": "Persistent shell, frontend manifests, and design publication are in place, but design lint and accessibility ceilings still constrain multiple surfaces.",
            "artifactRefs": [
                "data/analysis/persistent_shell_contracts.json",
                "data/analysis/frontend_contract_manifests.json",
                "data/analysis/design_contract_publication_bundle.json",
                "data/analysis/component_primitive_publication.json",
                "docs/architecture/106_shell_specimen_gallery.html",
                "docs/architecture/104_ui_kernel_studio.html",
            ],
            "blockerRefs": ["MFV_127_ACCESSIBILITY_DEGRADED", "MFV_127_DESIGN_LINT_PENDING"],
            "sourceRuleRefs": [
                "blueprint/platform-frontend-blueprint.md",
                "blueprint/phase-0-the-foundation-protocol.md#Where-this-segment-overlaps-with-platform-frontend-blueprintmd",
            ],
            "upstreamTaskRefs": ["par_103", "par_104", "par_105", "par_106", "par_111", "par_113", "par_114", "par_115", "par_117", "par_118"],
        },
        {
            "familyId": "phase0_gate_context",
            "label": "Phase 0 gate context",
            "familyClass": "programme_control",
            "state": "blocked",
            "summary": "The programme-level Phase 0 gate remains withheld even though the exit pack is now consolidated.",
            "artifactRefs": [
                "docs/programme/20_phase0_evidence_pack_index.md",
                "docs/programme/20_phase0_gate_verdict_and_blockers.md",
            ],
            "blockerRefs": ["BLOCKER_P0_EXT_GATE_BLOCKED", "BLOCKER_P0_IDENTITY_AND_WRONG_PATIENT_PROOF"],
            "sourceRuleRefs": [
                "blueprint/phase-cards.md#card-1-phase-0-the-foundation-protocol",
            ],
            "upstreamTaskRefs": ["seq_020"],
        },
        {
            "familyId": "phase0_exit_pack_validation",
            "label": "Phase 0 exit pack validation",
            "familyClass": "verification",
            "state": "current",
            "summary": "This task binds the current candidate, scenario atlas, and verification surfaces into one proof pack.",
            "artifactRefs": [
                "data/analysis/phase0_exit_artifact_index.json",
                "data/analysis/foundation_demo_scenarios.csv",
                "data/analysis/foundation_demo_trace_index.json",
                "data/analysis/foundation_demo_surface_capture_matrix.csv",
                "docs/programme/132_phase0_foundation_atlas.html",
                "tests/playwright/phase0-foundation-atlas.spec.js",
                "tools/analysis/validate_phase0_exit_pack.py",
            ],
            "blockerRefs": [],
            "sourceRuleRefs": [
                "prompt/132.md",
            ],
            "upstreamTaskRefs": ["seq_132"],
        },
    ]

    test_suite_packs = [
        {
            "packId": "phase0_release_candidate_pack",
            "label": "Release candidate freeze checks",
            "state": "current",
            "artifactRefs": [
                "tools/release/validate_release_candidate_freeze.py",
                "tests/playwright/release-candidate-freeze-board.spec.js",
            ],
            "validatedArtifactRefs": [
                "data/release/release_candidate_tuple.json",
                "docs/release/131_release_candidate_freeze_board.html",
            ],
        },
        {
            "packId": "phase0_reference_flow_pack",
            "label": "Synthetic reference flow checks",
            "state": "current",
            "artifactRefs": [
                "tools/analysis/validate_reference_flow.py",
                "tests/playwright/synthetic-reference-flow-observatory.spec.js",
            ],
            "validatedArtifactRefs": [
                "data/analysis/reference_case_catalog.json",
                "docs/programme/128_reference_flow_observatory.html",
            ],
        },
        {
            "packId": "phase0_adapter_validation_pack",
            "label": "Adapter simulator validation checks",
            "state": "partial",
            "artifactRefs": [
                "tools/analysis/validate_adapter_simulators.py",
                "tests/playwright/adapter-validation-console.spec.js",
            ],
            "validatedArtifactRefs": [
                "data/integration/adapter_validation_results.json",
                "docs/integrations/129_adapter_validation_console.html",
            ],
        },
        {
            "packId": "phase0_exit_atlas_pack",
            "label": "Phase 0 foundation atlas checks",
            "state": "current",
            "artifactRefs": [
                "tools/analysis/validate_phase0_exit_pack.py",
                "tests/playwright/phase0-foundation-atlas.spec.js",
            ],
            "validatedArtifactRefs": [
                "data/analysis/phase0_exit_artifact_index.json",
                "docs/programme/132_phase0_foundation_atlas.html",
            ],
        },
    ]

    phase0_exit_index = {
        "task_id": TASK_ID,
        "generated_at": generated_at,
        "captured_on": captured_on,
        "visual_mode": VISUAL_MODE,
        "mission": "Bind the Phase 0 exit proof into one current candidate-bound atlas without hiding unhappy or partial surfaces.",
        "phase0ExitPackRef": EXIT_PACK_REF,
        "exitPackVerdict": "exact",
        "phase0ExitClaimState": EXIT_READINESS_STATE,
        "selectedReleaseRef": release_candidate["releaseRef"],
        "selectedEnvironmentRing": release_candidate_export["selectedEnvironmentRing"],
        "source_precedence": SOURCE_PRECEDENCE,
        "requiredScenarioCodes": REQUIRED_SCENARIOS,
        "proofFamilies": proof_families,
        "testSuitePacks": test_suite_packs,
        "scenarioRefs": [row["scenario_id"] for row in scenario_rows],
        "summary": {
            "proofFamilyCount": len(proof_families),
            "blockedFamilyCount": sum(1 for row in proof_families if row["state"] == "blocked"),
            "partialFamilyCount": sum(1 for row in proof_families if row["state"] == "partial"),
            "currentFamilyCount": sum(1 for row in proof_families if row["state"] == "current"),
            "scenarioCount": len(scenario_rows),
            "unhappyScenarioCount": sum(
                1 for row in scenario_rows if row["scenario_disposition"] == "unhappy"
            ),
            "referenceFlowScenarioCount": sum(
                1 for row in scenario_rows if row["source_proof_kind"] == "reference_flow"
            ),
            "artifactAdapterBlockedCount": adapter_validation["summary"]["blockedCount"],
            "releaseFreezeVerdict": release_candidate["freezeVerdict"],
            "environmentCompatibilityState": local_ring_summary["overallCompatibilityState"],
        },
    }

    trace_index_export = {
        "task_id": TASK_ID,
        "generated_at": generated_at,
        "captured_on": captured_on,
        "visual_mode": VISUAL_MODE,
        "phase0ExitPackRef": EXIT_PACK_REF,
        "selectedReleaseRef": release_candidate["releaseRef"],
        "selectedEnvironmentRing": release_candidate_export["selectedEnvironmentRing"],
        "source_precedence": SOURCE_PRECEDENCE,
        "scenarios": trace_index_rows,
        "summary": {
            "scenarioCount": len(trace_index_rows),
            "requiredScenarioCount": len(REQUIRED_SCENARIOS),
            "partialSurfaceProofCount": sum(
                1 for row in trace_index_rows if row["proofPosture"] == "partial_surface_proof"
            ),
            "recoveryOnlyProofCount": sum(
                1 for row in trace_index_rows if row["proofPosture"] == "recovery_only_proof"
            ),
            "blockedProofCount": sum(
                1 for row in trace_index_rows if row["proofPosture"] == "blocked_proof"
            ),
        },
    }

    write_json(EXIT_ARTIFACT_INDEX_PATH, phase0_exit_index)
    write_json(FOUNDATION_DEMO_TRACE_INDEX_PATH, trace_index_export)
    write_csv(
        FOUNDATION_DEMO_SCENARIOS_PATH,
        scenario_rows,
        [
            "scenario_id",
            "required_scenario_code",
            "display_label",
            "scenario_disposition",
            "scenario_accent",
            "source_proof_kind",
            "proof_posture",
            "release_ref",
            "environment_ring",
            "route_family_ref",
            "audience_surface_ref",
            "shell_slug",
            "shell_type",
            "surface_binding_state",
            "surface_writability_state",
            "surface_calm_state",
            "trace_digest_ref",
            "legacy_reference_case_ref",
            "reference_flow_case_ref",
            "settlement_step_count",
            "blocker_refs",
            "recovery_refs",
            "evidence_refs",
            "source_rule_refs",
            "upstream_task_refs",
            "notes",
        ],
    )
    write_csv(
        FOUNDATION_DEMO_SURFACE_MATRIX_PATH,
        surface_capture_rows,
        [
            "scenario_id",
            "audience_surface_ref",
            "route_family_ref",
            "shell_slug",
            "shell_type",
            "binding_verdict",
            "writability_state",
            "calm_state",
            "proof_posture",
            "continuity_expectation",
            "recovery_disposition_refs",
            "release_ref",
            "release_freeze_verdict",
            "source_trace_refs",
            "notes",
        ],
    )

    scenario_table_rows = [
        [
            row["display_label"],
            row["scenario_disposition"],
            row["proof_posture"],
            row["route_family_ref"],
            row["audience_surface_ref"],
            row["notes"],
        ]
        for row in scenario_rows
    ]
    family_table_rows = [
        [
            family["label"],
            family["state"],
            family["familyClass"],
            str(len(family["artifactRefs"])),
            family["summary"],
        ]
        for family in proof_families
    ]
    pack_table_rows = [
        [pack["label"], pack["state"], str(len(pack["artifactRefs"])), ", ".join(pack["validatedArtifactRefs"])]
        for pack in test_suite_packs
    ]

    exit_artifacts_doc = f"""
# 132 Phase 0 Exit Artifacts

## Exit Pack State

- Exit pack ref: `{EXIT_PACK_REF}`
- Exit pack verdict: `exact`
- Current Phase 0 exit claim: `{EXIT_READINESS_STATE}`
- Selected release candidate: `{release_candidate["releaseRef"]}`
- Selected ring: `{release_candidate_export["selectedEnvironmentRing"]}`
- Candidate freeze verdict: `{release_candidate["freezeVerdict"]}`
- Current environment compatibility: `{local_ring_summary["overallCompatibilityState"]}`

The repository now has one exact, current-candidate-bound Phase 0 exit pack. That does **not** mean Phase 0 is approved. The programme gate remains withheld, and the local candidate still carries explicit surface ceilings through `{local_gateway_blocker["blockerId"]}`.

## Proof Families

{markdown_table(["Family", "State", "Class", "Artifacts", "Summary"], family_table_rows)}

## Demonstration Scenarios

{markdown_table(["Scenario", "Disposition", "Proof posture", "Route family", "Surface", "Notes"], scenario_table_rows)}

## Mock Now Execution

- The atlas binds to the real current simulator-backed candidate rather than a presentation-only demo model.
- Six scenarios reuse the deterministic `seq_128` trace corpus.
- The publication-drift scenario is artifact-backed from the current release candidate, freeze blocker set, and audience-surface truth.

## Actual Production Strategy Later

- Keep the same scenario ids and proof semantics.
- Swap simulator-backed evidence for live ring evidence only under the same tuple structure.
- Do not replace the exit pack with a new release narrative or environment-specific slideware.
""".strip()

    demo_script_doc = f"""
# 132 Happy And Unhappy Demo Script

## Demonstration Order

1. `P0_SCN_001_HAPPY_PATH`: open the happy-path scenario and verify the canonical request, settlement ladder, and same-lineage shell return.
2. `P0_SCN_002_EXACT_REPLAY`: switch to the replay scenario and confirm the reused authoritative outcome with no second request.
3. `P0_SCN_003_COLLISION_REVIEW`: inspect duplicate review, closure blockers, and review-required posture.
4. `P0_SCN_004_QUARANTINE_FALLBACK`: show the fallback-review case, same-lineage continuity, and quarantined evidence handling.
5. `P0_SCN_005_IDENTITY_HOLD`: move to identity hold and verify blocked continuation plus repair-governed recovery.
6. `P0_SCN_006_PUBLICATION_DRIFT`: inspect the current release-candidate blocker and recovery-only support surface instead of a generic failure page.
7. `P0_SCN_007_CONFIRMATION_BLOCKED`: finish on confirmation debt and verify same-lineage continuity without fake calm completion.

## Reviewer Cues

- Keep the evidence tab open when switching scenarios to prove the atlas stays bound to current artifacts.
- Use the source tab to show the exact blueprint and task refs behind each scenario.
- Call out `proof_posture` explicitly whenever the visible surface is still partial, recovery-only, or blocked.

## Current Exit Honesty

- The atlas is exact as a proof surface.
- The candidate is exact as a release tuple.
- The current browser-facing estate is **not** exact; the atlas keeps that visible rather than smoothing it away.
""".strip()

    exit_evidence_doc = f"""
# 132 Phase 0 Exit Evidence Index

## Proof Families

{markdown_table(["Family", "State", "Class", "Artifacts", "Summary"], family_table_rows)}

## Test Suite Packs

{markdown_table(["Pack", "State", "Harness count", "Validated artifacts"], pack_table_rows)}

## Source Trace Anchors

- Current release candidate: `data/release/release_candidate_tuple.json#{release_candidate["releaseRef"]}`
- Local compatibility summary: `data/release/release_candidate_tuple.json#{local_ring_summary["environmentCompatibilityRef"]}`
- Current local gateway blocker: `data/release/freeze_blockers.json#{local_gateway_blocker["blockerId"]}`
- Synthetic flow catalog: `data/analysis/reference_case_catalog.json`
- Surface truth: `data/analysis/surface_authority_verdicts.json`
""".strip()

    atlas_board_data = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "exitPackRef": EXIT_PACK_REF,
        "exitPackVerdict": "exact",
        "phase0ExitClaimState": EXIT_READINESS_STATE,
        "selectedReleaseRef": release_candidate["releaseRef"],
        "selectedEnvironmentRing": release_candidate_export["selectedEnvironmentRing"],
        "summary": {
            "scenarioCount": len(trace_index_rows),
            "unhappyCount": sum(
                1 for row in trace_index_rows if row["scenarioDisposition"] == "unhappy"
            ),
            "proofFamilyCount": len(proof_families),
            "candidateFreezeVerdict": release_candidate["freezeVerdict"],
            "environmentCompatibilityState": local_ring_summary["overallCompatibilityState"],
        },
        "proofFamilies": proof_families,
        "scenarios": trace_index_rows,
        "stateBadges": {
            "exact": "Exact",
            "partial": "Partial",
            "blocked": "Blocked",
            "current": "Current",
            "recovery_only": "Recovery only",
            "withheld": "Withheld",
        },
    }

    atlas_html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>132 Phase 0 Foundation Atlas</title>
    <style>
      :root {{
        --canvas: #F7F8FA;
        --shell: #EEF2F6;
        --panel: #FFFFFF;
        --inset: #E8EEF3;
        --border: rgba(36, 49, 61, 0.12);
        --text-strong: #0F1720;
        --text: #24313D;
        --text-muted: #5E6B78;
        --accent-happy: #117A55;
        --accent-replay: #2F6FED;
        --accent-recovery: #B7791F;
        --accent-blocked: #B42318;
        --accent-trace: #5B61F6;
        --shadow: 0 22px 50px rgba(15, 23, 32, 0.08);
        --radius-xl: 24px;
        --radius-lg: 18px;
        --radius-md: 14px;
        --radius-sm: 12px;
      }}
      * {{ box-sizing: border-box; }}
      html {{ background: var(--canvas); }}
      body {{
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(91, 97, 246, 0.08), transparent 22%),
          radial-gradient(circle at top right, rgba(17, 122, 85, 0.06), transparent 20%),
          linear-gradient(180deg, var(--canvas), #f0f3f7);
        color: var(--text);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }}
      body.reduced-motion * {{
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }}
      .page,
      .page > *,
      .masthead > *,
      .layout > *,
      .center-stack,
      .panel,
      .table-scroll {{
        min-width: 0;
      }}
      .page {{ max-width: 1580px; margin: 0 auto; padding: 0 20px 40px; }}
      .masthead {{
        position: sticky;
        top: 0;
        z-index: 20;
        height: 72px;
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) repeat(3, minmax(0, 210px));
        gap: 14px;
        align-items: center;
        padding: 12px 0;
        background: rgba(247, 248, 250, 0.94);
        backdrop-filter: blur(14px);
      }}
      .brand,
      .summary-pill,
      .panel,
      .rail,
      .inspector {{
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
      }}
      .brand,
      .summary-pill {{
        min-height: 48px;
        border-radius: 999px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }}
      .wordmark {{
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: 20px;
      }}
      .atlas-mark {{
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(91, 97, 246, 0.16), rgba(47, 111, 237, 0.12));
      }}
      .brand-copy,
      .summary-copy {{ display: grid; gap: 2px; }}
      .meta-label {{
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-muted);
      }}
      .brand-title,
      .summary-value {{
        font-size: 18px;
        color: var(--text-strong);
        font-weight: 700;
      }}
      .layout {{
        display: grid;
        grid-template-columns: 296px minmax(0, 1fr) 408px;
        gap: 20px;
        margin-top: 20px;
        align-items: start;
      }}
      .rail,
      .inspector {{
        position: sticky;
        top: 92px;
        border-radius: var(--radius-xl);
        padding: 18px;
      }}
      .rail {{ display: grid; gap: 14px; }}
      .rail-caption,
      .caption {{
        margin: 0;
        color: var(--text-muted);
        line-height: 1.55;
      }}
      .scenario-button,
      .tab-button {{
        width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: linear-gradient(180deg, rgba(238, 242, 246, 0.7), rgba(255, 255, 255, 0.98));
        color: var(--text);
        text-align: left;
        padding: 14px;
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
      }}
      .scenario-button:hover,
      .scenario-button:focus-visible,
      .tab-button:hover,
      .tab-button:focus-visible {{
        transform: translateY(-1px);
        border-color: rgba(91, 97, 246, 0.48);
        outline: none;
      }}
      .scenario-button[data-selected="true"],
      .tab-button[aria-selected="true"] {{
        border-color: rgba(91, 97, 246, 0.62);
        box-shadow: 0 18px 32px rgba(91, 97, 246, 0.14);
      }}
      .scenario-button strong,
      .panel h2,
      .inspector h2 {{
        color: var(--text-strong);
      }}
      .badge {{
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }}
      .accent-happy {{ background: rgba(17, 122, 85, 0.14); color: var(--accent-happy); }}
      .accent-replay {{ background: rgba(47, 111, 237, 0.14); color: var(--accent-replay); }}
      .accent-recovery {{ background: rgba(183, 121, 31, 0.14); color: var(--accent-recovery); }}
      .accent-blocked {{ background: rgba(180, 35, 24, 0.14); color: var(--accent-blocked); }}
      .accent-trace {{ background: rgba(91, 97, 246, 0.14); color: var(--accent-trace); }}
      .mono {{
        font-family: "SFMono-Regular", "SF Mono", "Menlo", monospace;
        font-size: 12px;
        overflow-wrap: anywhere;
        word-break: break-word;
      }}
      .center-stack {{
        display: grid;
        gap: 20px;
      }}
      .panel {{
        border-radius: var(--radius-xl);
        padding: 18px;
      }}
      .panel-header {{
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: baseline;
        margin-bottom: 14px;
      }}
      .panel h2,
      .inspector h2 {{
        margin: 0;
        font-size: 20px;
      }}
      .constellation-grid,
      .state-ribbon,
      .settlement-ladder,
      .evidence-stack {{
        display: grid;
        gap: 12px;
      }}
      .constellation-card,
      .ribbon-pill,
      .ladder-step,
      .stack-card,
      .list-item {{
        border-radius: var(--radius-md);
        background: rgba(232, 238, 243, 0.56);
        padding: 12px 14px;
      }}
      .constellation-card {{
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
      }}
      .ribbon-pill {{
        display: grid;
        gap: 6px;
      }}
      .ladder-step {{
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }}
      .step-index {{
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: rgba(91, 97, 246, 0.12);
        color: var(--accent-trace);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }}
      .tabs {{
        display: inline-flex;
        gap: 10px;
        flex-wrap: wrap;
      }}
      .tab-panel[hidden] {{ display: none; }}
      .table-scroll {{ overflow-x: auto; }}
      table {{ width: 100%; border-collapse: collapse; }}
      th,
      td {{
        padding: 11px 12px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }}
      th {{
        text-align: left;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }}
      tr[data-selected="true"] {{ background: rgba(91, 97, 246, 0.08); }}
      .inspector {{
        display: grid;
        gap: 12px;
      }}
      .inspector dl {{
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin: 0;
      }}
      .inspector dd {{
        margin: 0;
        color: var(--text-strong);
      }}
      .list {{
        display: grid;
        gap: 8px;
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
      @media (max-width: 1320px) {{
        .layout {{
          grid-template-columns: minmax(0, 1fr);
        }}
        .rail,
        .inspector {{
          position: static;
        }}
        .masthead {{
          grid-template-columns: minmax(0, 1fr);
          height: auto;
        }}
      }}
    </style>
  </head>
  <body>
    <div class="page">
      <header class="masthead">
        <div class="brand">
          <div class="wordmark">
            <span class="atlas-mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="5" cy="5" r="2" fill="#117A55"></circle>
                <circle cx="13" cy="5" r="2" fill="#2F6FED"></circle>
                <circle cx="9" cy="13" r="2" fill="#5B61F6"></circle>
                <path d="M6.5 6.2L11.5 6.2M6 6.8L8.3 11.2M12 6.8L9.7 11.2" stroke="#5B61F6" stroke-width="1.4" stroke-linecap="round"></path>
              </svg>
            </span>
            <div class="brand-copy">
              <span class="meta-label">Vecells - Phase0_Foundation_Atlas</span>
              <span class="brand-title">Phase 0 Proof Dossier</span>
            </div>
          </div>
          <span class="badge accent-trace" data-testid="exit-pack-badge">Exact pack</span>
        </div>
        <div class="summary-pill">
          <div class="summary-copy">
            <span class="meta-label">Release Candidate</span>
            <span class="summary-value" data-testid="summary-release-ref"></span>
          </div>
          <span class="badge accent-happy" data-testid="summary-freeze-verdict"></span>
        </div>
        <div class="summary-pill">
          <div class="summary-copy">
            <span class="meta-label">Exit Claim</span>
            <span class="summary-value" data-testid="summary-exit-state"></span>
          </div>
          <span class="mono" data-testid="summary-environment-ring"></span>
        </div>
        <div class="summary-pill">
          <div class="summary-copy">
            <span class="meta-label">Scenario Mix</span>
            <span class="summary-value" data-testid="summary-scenario-count"></span>
          </div>
          <span class="mono" data-testid="summary-unhappy-count"></span>
        </div>
      </header>
      <div class="layout">
        <nav class="rail" aria-label="Scenario navigation">
          <div>
            <h2 style="margin:0 0 8px;">Scenarios</h2>
            <p class="rail-caption">Happy and unhappy paths carry equal weight. Each card binds the same release candidate, shell truth, and source-trace evidence.</p>
          </div>
          <div id="scenario-rail" data-testid="scenario-rail" class="list"></div>
        </nav>
        <main class="center-stack">
          <section class="panel">
            <div class="panel-header">
              <h2>Scenario Constellation</h2>
              <span class="meta-label">All seven required proofs</span>
            </div>
            <div class="constellation-grid" data-testid="constellation"></div>
            <div class="table-scroll">
              <table data-testid="scenario-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Disposition</th>
                    <th>Proof posture</th>
                    <th>Surface</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>State Axis Ribbon</h2>
              <span class="meta-label">Canonical transitions</span>
            </div>
            <div class="state-ribbon" data-testid="state-ribbon"></div>
            <div class="table-scroll">
              <table data-testid="state-table">
                <thead>
                  <tr>
                    <th>Axis</th>
                    <th>Transition</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>Settlement Ladder</h2>
              <span class="meta-label">Artifact-backed progression</span>
            </div>
            <div class="settlement-ladder" data-testid="settlement-ladder"></div>
            <div class="table-scroll">
              <table data-testid="settlement-table">
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Layer</th>
                    <th>State</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>Evidence And Source Trace</h2>
              <div class="tabs" data-testid="evidence-tabs" role="tablist" aria-label="Evidence tabs">
                <button type="button" class="tab-button" data-testid="tab-evidence" role="tab" aria-selected="true" aria-controls="panel-evidence" id="tab-evidence-btn">Evidence</button>
                <button type="button" class="tab-button" data-testid="tab-sources" role="tab" aria-selected="false" aria-controls="panel-sources" id="tab-sources-btn">Source trace</button>
              </div>
            </div>
            <div id="panel-evidence" class="tab-panel" role="tabpanel" aria-labelledby="tab-evidence-btn">
              <div class="evidence-stack" data-testid="evidence-stack"></div>
              <div class="table-scroll">
                <table data-testid="evidence-table">
                  <thead>
                    <tr>
                      <th>Kind</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
            <div id="panel-sources" class="tab-panel" role="tabpanel" aria-labelledby="tab-sources-btn" hidden>
              <div class="list" data-testid="source-list"></div>
              <div class="table-scroll">
                <table data-testid="source-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
        <aside class="inspector" data-testid="inspector" tabindex="0">
          <h2>Inspector</h2>
          <p class="caption">Scenario selection keeps the constellation, state ribbon, settlement ladder, and evidence tabs on one current proof object.</p>
          <div id="inspector-title"></div>
          <div id="inspector-summary"></div>
          <dl id="inspector-refs"></dl>
          <div class="list" id="inspector-blockers"></div>
        </aside>
      </div>
    </div>
    <script>
      const atlasData = {json.dumps(atlas_board_data)};
      const stateBadges = atlasData.stateBadges;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {{
        document.body.classList.add("reduced-motion");
      }}

      const scenarioRail = document.querySelector("[data-testid='scenario-rail']");
      const constellation = document.querySelector("[data-testid='constellation']");
      const scenarioTableBody = document.querySelector("[data-testid='scenario-table'] tbody");
      const stateRibbon = document.querySelector("[data-testid='state-ribbon']");
      const stateTableBody = document.querySelector("[data-testid='state-table'] tbody");
      const settlementLadder = document.querySelector("[data-testid='settlement-ladder']");
      const settlementTableBody = document.querySelector("[data-testid='settlement-table'] tbody");
      const evidenceStack = document.querySelector("[data-testid='evidence-stack']");
      const evidenceTableBody = document.querySelector("[data-testid='evidence-table'] tbody");
      const sourceList = document.querySelector("[data-testid='source-list']");
      const sourceTableBody = document.querySelector("[data-testid='source-table'] tbody");
      const inspectorTitle = document.getElementById("inspector-title");
      const inspectorSummary = document.getElementById("inspector-summary");
      const inspectorRefs = document.getElementById("inspector-refs");
      const inspectorBlockers = document.getElementById("inspector-blockers");
      const tabEvidence = document.querySelector("[data-testid='tab-evidence']");
      const tabSources = document.querySelector("[data-testid='tab-sources']");
      const panelEvidence = document.getElementById("panel-evidence");
      const panelSources = document.getElementById("panel-sources");

      document.querySelector("[data-testid='summary-release-ref']").textContent = atlasData.selectedReleaseRef;
      document.querySelector("[data-testid='summary-freeze-verdict']").textContent = stateBadges[atlasData.summary.candidateFreezeVerdict] || atlasData.summary.candidateFreezeVerdict;
      document.querySelector("[data-testid='summary-exit-state']").textContent = atlasData.phase0ExitClaimState;
      document.querySelector("[data-testid='summary-environment-ring']").textContent = atlasData.selectedEnvironmentRing;
      document.querySelector("[data-testid='summary-scenario-count']").textContent = String(atlasData.summary.scenarioCount);
      document.querySelector("[data-testid='summary-unhappy-count']").textContent = `${{atlasData.summary.unhappyCount}} unhappy`;

      const selectedState = {{
        scenarioId: atlasData.scenarios[0].scenarioId,
        tab: "evidence",
      }};

      function accentClass(accent) {{
        return `accent-${{accent}}`;
      }}

      function renderScenarioRail() {{
        scenarioRail.innerHTML = "";
        atlasData.scenarios.forEach((scenario, index) => {{
          const button = document.createElement("button");
          button.type = "button";
          button.className = "scenario-button";
          button.dataset.testid = `scenario-button-${{scenario.scenarioId}}`;
          button.dataset.focusIndex = String(index);
          button.dataset.selected = String(selectedState.scenarioId === scenario.scenarioId);
          button.innerHTML = `
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
              <strong>${{scenario.displayLabel}}</strong>
              <span class="badge ${{accentClass(scenario.scenarioAccent)}}">${{scenario.scenarioDisposition}}</span>
            </div>
            <div class="list" style="margin-top:10px;">
              <div class="list-item"><span class="meta-label">Proof posture</span><div>${{scenario.proofPosture}}</div></div>
              <div class="list-item"><span class="meta-label">Surface</span><div class="mono">${{scenario.audienceSurfaceRef}}</div></div>
            </div>
          `;
          button.addEventListener("click", () => selectScenario(scenario.scenarioId));
          button.addEventListener("keydown", handleScenarioArrows);
          scenarioRail.append(button);
        }});
      }}

      function renderConstellation() {{
        constellation.innerHTML = "";
        scenarioTableBody.innerHTML = "";
        atlasData.scenarios.forEach((scenario) => {{
          const card = document.createElement("div");
          card.className = "constellation-card";
          card.dataset.testid = `constellation-card-${{scenario.scenarioId}}`;
          card.dataset.selected = String(selectedState.scenarioId === scenario.scenarioId);
          card.innerHTML = `
            <div>
              <strong>${{scenario.displayLabel}}</strong>
              <p class="caption" style="margin-top:6px;">${{scenario.summary}}</p>
            </div>
            <div style="display:grid;gap:8px;justify-items:end;">
              <span class="badge ${{accentClass(scenario.scenarioAccent)}}">${{scenario.proofPosture}}</span>
              <span class="mono">${{scenario.traceArtifactRefs.length}} refs</span>
            </div>
          `;
          constellation.append(card);

          const tr = document.createElement("tr");
          tr.dataset.testid = `scenario-table-row-${{scenario.scenarioId}}`;
          tr.dataset.selected = String(selectedState.scenarioId === scenario.scenarioId);
          tr.innerHTML = `
            <td>${{scenario.displayLabel}}</td>
            <td>${{scenario.scenarioDisposition}}</td>
            <td>${{scenario.proofPosture}}</td>
            <td class="mono">${{scenario.audienceSurfaceRef}}</td>
          `;
          scenarioTableBody.append(tr);
        }});
      }}

      function renderStateRibbon(scenario) {{
        stateRibbon.innerHTML = "";
        stateTableBody.innerHTML = "";
        scenario.stateAxisTransitions.forEach((transition, index) => {{
          const pill = document.createElement("div");
          pill.className = "ribbon-pill";
          pill.dataset.testid = `state-pill-${{index}}`;
          pill.innerHTML = `
            <strong>${{transition.axis}}</strong>
            <div class="mono">${{transition.origin}} -> ${{transition.target}}</div>
            <span class="meta-label">${{transition.owner}}</span>
          `;
          stateRibbon.append(pill);

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${{transition.axis}}</td>
            <td class="mono">${{transition.origin}} -> ${{transition.target}}</td>
            <td>${{transition.owner}}</td>
          `;
          stateTableBody.append(tr);
        }});
      }}

      function renderSettlementLadder(scenario) {{
        settlementLadder.innerHTML = "";
        settlementTableBody.innerHTML = "";
        scenario.settlementLadder.forEach((step) => {{
          const item = document.createElement("div");
          item.className = "ladder-step";
          item.dataset.testid = `settlement-step-${{step.stepIndex}}`;
          item.innerHTML = `
            <div class="step-index">${{step.stepIndex}}</div>
            <div>
              <strong>${{step.layer}}</strong>
              <div class="mono" style="margin:6px 0;">${{step.state}}</div>
              <p class="caption">${{step.summary}}</p>
            </div>
          `;
          settlementLadder.append(item);

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${{step.stepIndex}}</td>
            <td>${{step.layer}}</td>
            <td class="mono">${{step.state}}</td>
            <td>${{step.summary}}</td>
          `;
          settlementTableBody.append(tr);
        }});
      }}

      function renderEvidenceTab(scenario) {{
        evidenceStack.innerHTML = "";
        evidenceTableBody.innerHTML = "";
        const rows = [
          ["traceDigestRef", scenario.traceArtifactRefs[0] ? scenario.traceArtifactRefs[0] : scenario.scenarioId],
          ["routeFamilyRef", scenario.routeFamilyRef],
          ["audienceSurfaceRef", scenario.audienceSurfaceRef],
          ["proofPosture", scenario.proofPosture],
          ["releaseRef", scenario.releaseRef],
          ["traceDigest", scenario.referenceFlowCaseRef || scenario.scenarioId],
          ["supportingEvents", scenario.supportingEvents.join(", ") || "artifact-backed scenario"],
          ["closureBlockerRefs", scenario.closureBlockerRefs.join(", ") || "none"],
        ];
        rows.forEach(([label, value]) => {{
          const card = document.createElement("div");
          card.className = "stack-card";
          card.dataset.testid = `evidence-card-${{label}}`;
          card.innerHTML = `<span class="meta-label">${{label}}</span><div class="mono">${{value}}</div>`;
          evidenceStack.append(card);

          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${{label}}</td><td class="mono">${{value}}</td>`;
          evidenceTableBody.append(tr);
        }});
      }}

      function renderSourceTab(scenario) {{
        sourceList.innerHTML = "";
        sourceTableBody.innerHTML = "";
        scenario.sourceRuleRefs.forEach((source, index) => {{
          const item = document.createElement("div");
          item.className = "list-item mono";
          item.dataset.testid = `source-item-${{index}}`;
          item.textContent = source;
          sourceList.append(item);

          const tr = document.createElement("tr");
          tr.innerHTML = `<td class="mono">${{source}}</td>`;
          sourceTableBody.append(tr);
        }});
      }}

      function renderInspector(scenario) {{
        inspectorTitle.innerHTML = `<strong>${{scenario.displayLabel}}</strong> <span class="badge ${{accentClass(scenario.scenarioAccent)}}">${{scenario.proofPosture}}</span>`;
        inspectorSummary.innerHTML = `<p class="caption">${{scenario.summary}}</p>`;
        inspectorRefs.innerHTML = "";
        [
          ["scenarioId", scenario.scenarioId],
          ["releaseRef", scenario.releaseRef],
          ["routeFamilyRef", scenario.routeFamilyRef],
          ["audienceSurfaceRef", scenario.audienceSurfaceRef],
          ["shellSlug", scenario.shellSlug],
          ["proofPosture", scenario.proofPosture],
        ].forEach(([label, value]) => {{
          inspectorRefs.innerHTML += `<dt class="meta-label">${{label}}</dt><dd class="mono">${{value}}</dd>`;
        }});
        inspectorBlockers.innerHTML = "";
        const blockerItems = scenario.closureBlockerRefs.length
          ? scenario.closureBlockerRefs
          : scenario.recoveryDispositionRefs;
        blockerItems.forEach((value, index) => {{
          const item = document.createElement("div");
          item.className = "list-item mono";
          item.dataset.testid = `inspector-item-${{index}}`;
          item.textContent = value;
          inspectorBlockers.append(item);
        }});
      }}

      function renderTabs(scenario) {{
        renderEvidenceTab(scenario);
        renderSourceTab(scenario);
        const evidenceSelected = selectedState.tab === "evidence";
        tabEvidence.setAttribute("aria-selected", String(evidenceSelected));
        tabSources.setAttribute("aria-selected", String(!evidenceSelected));
        panelEvidence.hidden = !evidenceSelected;
        panelSources.hidden = evidenceSelected;
      }}

      function syncSelection() {{
        document.querySelectorAll(".scenario-button").forEach((button) => {{
          button.dataset.selected = String(button.dataset.testid === `scenario-button-${{selectedState.scenarioId}}`);
        }});
        renderConstellation();
      }}

      function selectScenario(scenarioId) {{
        selectedState.scenarioId = scenarioId;
        const scenario = atlasData.scenarios.find((item) => item.scenarioId === scenarioId);
        syncSelection();
        renderStateRibbon(scenario);
        renderSettlementLadder(scenario);
        renderInspector(scenario);
        renderTabs(scenario);
      }}

      function selectTab(tab) {{
        selectedState.tab = tab;
        const scenario = atlasData.scenarios.find((item) => item.scenarioId === selectedState.scenarioId);
        renderTabs(scenario);
      }}

      function handleScenarioArrows(event) {{
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const buttons = [...document.querySelectorAll(".scenario-button")];
        const currentIndex = buttons.indexOf(event.currentTarget);
        if (currentIndex === -1) return;
        event.preventDefault();
        let nextIndex = currentIndex;
        if (event.key === "ArrowDown") nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
        if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = buttons.length - 1;
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      }}

      function handleTabArrows(event) {{
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        const tabs = [tabEvidence, tabSources];
        const currentIndex = tabs.indexOf(event.currentTarget);
        if (currentIndex === -1) return;
        event.preventDefault();
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight") nextIndex = Math.min(tabs.length - 1, currentIndex + 1);
        if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }}

      tabEvidence.addEventListener("click", () => selectTab("evidence"));
      tabSources.addEventListener("click", () => selectTab("sources"));
      tabEvidence.addEventListener("keydown", handleTabArrows);
      tabSources.addEventListener("keydown", handleTabArrows);

      renderScenarioRail();
      selectScenario(atlasData.scenarios[0].scenarioId);
    </script>
  </body>
</html>
"""

    write_text(EXIT_ARTIFACTS_DOC_PATH, exit_artifacts_doc)
    write_text(DEMO_SCRIPT_DOC_PATH, demo_script_doc)
    write_text(EXIT_EVIDENCE_INDEX_DOC_PATH, exit_evidence_doc)
    write_text(FOUNDATION_ATLAS_PATH, atlas_html)


if __name__ == "__main__":
    main()
