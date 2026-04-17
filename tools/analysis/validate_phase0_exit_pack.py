#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DOCS_PROGRAMME_DIR = ROOT / "docs" / "programme"

EXIT_INDEX_PATH = DATA_ANALYSIS_DIR / "phase0_exit_artifact_index.json"
SCENARIOS_PATH = DATA_ANALYSIS_DIR / "foundation_demo_scenarios.csv"
TRACE_INDEX_PATH = DATA_ANALYSIS_DIR / "foundation_demo_trace_index.json"
SURFACE_MATRIX_PATH = DATA_ANALYSIS_DIR / "foundation_demo_surface_capture_matrix.csv"
ATLAS_PATH = DOCS_PROGRAMME_DIR / "132_phase0_foundation_atlas.html"
EXIT_DOC_PATH = DOCS_PROGRAMME_DIR / "132_phase0_exit_artifacts.md"
SCRIPT_DOC_PATH = DOCS_PROGRAMME_DIR / "132_happy_unhappy_demo_script.md"
EVIDENCE_DOC_PATH = DOCS_PROGRAMME_DIR / "132_phase0_exit_evidence_index.md"

REQUIRED_SCENARIOS = {
    "happy_path",
    "exact_replay_path",
    "collision_or_review_required_path",
    "quarantine_and_fallback_review_path",
    "identity_hold_path",
    "publication_or_recovery_drift_path",
    "confirmation_blocked_path",
}

REQUIRED_PROOF_FAMILIES = {
    "current_release_candidate_dossier",
    "runtime_publication_and_surface_truth",
    "synthetic_reference_flow",
    "adapter_and_simulator_validation",
    "recovery_resilience_and_migration",
    "assurance_and_compliance_foundation",
    "shell_contract_and_design_foundation",
    "phase0_gate_context",
    "phase0_exit_pack_validation",
}


def read_json(path: Path) -> dict:
    return json.loads(path.read_text())


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="") as handle:
        return list(csv.DictReader(handle))


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def resolve_ref(ref: str) -> Path:
    ref_path = ref.split("#", 1)[0]
    return ROOT / ref_path


def validate_refs(refs: list[str], context: str) -> None:
    for ref in refs:
        ensure(ref, f"{context} contains an empty ref.")
        path = resolve_ref(ref)
        ensure(path.exists(), f"{context} points to missing artifact: {ref}")


def expected_proof_posture(binding_state: str, writability_state: str) -> str:
    if binding_state == "blocked" or writability_state == "blocked":
        return "blocked_proof"
    if binding_state == "partial":
        return "partial_surface_proof"
    if binding_state == "recovery_only" or writability_state == "recovery_only":
        return "recovery_only_proof"
    return "exact_proof"


def main() -> None:
    for path in [
        EXIT_INDEX_PATH,
        SCENARIOS_PATH,
        TRACE_INDEX_PATH,
        SURFACE_MATRIX_PATH,
        ATLAS_PATH,
        EXIT_DOC_PATH,
        SCRIPT_DOC_PATH,
        EVIDENCE_DOC_PATH,
    ]:
        ensure(path.exists(), f"Missing required seq_132 artifact: {path}")

    exit_index = read_json(EXIT_INDEX_PATH)
    trace_index = read_json(TRACE_INDEX_PATH)
    scenario_rows = read_csv_rows(SCENARIOS_PATH)
    surface_rows = read_csv_rows(SURFACE_MATRIX_PATH)
    atlas_html = ATLAS_PATH.read_text()

    ensure(exit_index["phase0ExitPackRef"] == "P0_EXIT_PACK_132_V1", "Unexpected exit pack ref.")
    ensure(exit_index["exitPackVerdict"] == "exact", "Exit pack must remain exact.")
    ensure(
        exit_index["phase0ExitClaimState"] == "withheld",
        "The exit pack must not imply a Phase 0 approval beyond the current candidate.",
    )

    family_ids = {row["familyId"] for row in exit_index["proofFamilies"]}
    ensure(
        family_ids == REQUIRED_PROOF_FAMILIES,
        f"Proof family set drifted: {sorted(family_ids)}",
    )
    for family in exit_index["proofFamilies"]:
        ensure(family["artifactRefs"], f"Proof family {family['familyId']} has no artifact refs.")
        validate_refs(family["artifactRefs"], f"proof family {family['familyId']}")

    scenario_codes = {row["required_scenario_code"] for row in scenario_rows}
    ensure(scenario_codes == REQUIRED_SCENARIOS, "Scenario coverage is incomplete or drifted.")
    ensure(len(scenario_rows) == len(REQUIRED_SCENARIOS), "Scenario row count drifted.")
    ensure(
        sum(1 for row in scenario_rows if row["scenario_disposition"] == "unhappy") == 6,
        "Unhappy paths are not fully represented in machine-readable scenario rows.",
    )

    trace_rows = trace_index["scenarios"]
    ensure(len(trace_rows) == len(REQUIRED_SCENARIOS), "Trace index scenario count drifted.")
    trace_by_id = {row["scenarioId"]: row for row in trace_rows}
    surface_by_id = {row["scenario_id"]: row for row in surface_rows}

    for scenario in scenario_rows:
        trace = trace_by_id.get(scenario["scenario_id"])
        surface = surface_by_id.get(scenario["scenario_id"])
        ensure(trace is not None, f"Missing trace index row for {scenario['scenario_id']}")
        ensure(surface is not None, f"Missing surface capture row for {scenario['scenario_id']}")
        ensure(trace["traceArtifactRefs"], f"{scenario['scenario_id']} has no trace artifacts.")
        ensure(trace["sourceRuleRefs"], f"{scenario['scenario_id']} has no source rules.")
        ensure(trace["settlementLadder"], f"{scenario['scenario_id']} has no settlement ladder.")
        validate_refs(trace["traceArtifactRefs"], scenario["scenario_id"])
        validate_refs(trace["evidenceRefs"], f"{scenario['scenario_id']} evidence")
        expected = expected_proof_posture(
            scenario["surface_binding_state"], scenario["surface_writability_state"]
        )
        ensure(
            scenario["proof_posture"] == expected,
            f"{scenario['scenario_id']} proof posture drifted from current surface truth.",
        )

    publication_drift = trace_by_id["P0_SCN_006_PUBLICATION_DRIFT"]
    ensure(
        "FZB_131_LOCAL_GATEWAY_SURFACES" in publication_drift["closureBlockerRefs"],
        "Publication drift scenario lost the current local gateway blocker.",
    )
    ensure(
        publication_drift["sourceProofKind"] == "release_candidate_surface_drift",
        "Publication drift scenario must remain candidate-bound rather than flow-only.",
    )

    for marker in [
        "data-testid=\"constellation\"",
        "data-testid=\"state-ribbon\"",
        "data-testid=\"settlement-ladder\"",
        "data-testid=\"inspector\"",
        "data-testid=\"evidence-tabs\"",
        "data-testid=\"tab-evidence\"",
        "data-testid=\"tab-sources\"",
    ]:
        ensure(marker in atlas_html, f"Atlas is missing required marker: {marker}")

    ensure("P0_SCN_001_HAPPY_PATH" in atlas_html, "Atlas is missing the happy-path scenario.")
    ensure("P0_SCN_006_PUBLICATION_DRIFT" in atlas_html, "Atlas is missing the drift scenario.")

    print("seq_132 Phase 0 exit pack validation passed.")


if __name__ == "__main__":
    main()
