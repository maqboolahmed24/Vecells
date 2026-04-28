#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

from build_scope_boundary import (
    ALLOWED_CLASSIFICATIONS,
    ALLOWED_DEPENDENCY_STATUSES,
    BASELINE_PHASES,
    DECISIONS,
    DEFERRED_PHASES,
    REQUIRED_SCOPE_CATEGORIES,
    ROWS,
)


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

JSON_PATH = DATA_DIR / "product_scope_matrix.json"
CSV_PATH = DATA_DIR / "product_scope_matrix.csv"
SCOPE_DOC_PATH = DOCS_DIR / "03_product_scope_boundary.md"
NON_GOALS_DOC_PATH = DOCS_DIR / "03_non_goals_and_explicit_exclusions.md"
BASELINE_DOC_PATH = DOCS_DIR / "03_current_delivery_baseline.md"
DEFERRED_DOC_PATH = DOCS_DIR / "03_deferred_and_conditional_scope.md"
DECISION_LOG_DOC_PATH = DOCS_DIR / "03_scope_decision_log.md"

EXPECTED_ROW_IDS = {row["capability_id"] for row in ROWS}
EXPECTED_DECISION_IDS = {decision["decision_id"] for decision in DECISIONS}
MANDATORY_ROW_IDS = {
    "cap_unified_intake_and_safety_pipeline",
    "cap_nhs_app_embedded_channel",
    "cap_optional_pds_enrichment",
    "cap_model_vendor_assistive_rollout",
    "cap_supplier_specific_capability_expansion",
    "cap_runtime_release_and_publication_control_plane",
    "cap_assurance_ledger_and_evidence_graph",
    "ng_appointments_first_product_shape",
    "ng_separate_phone_back_office_workflow",
    "ng_native_nhs_app_current_baseline",
    "ng_supplier_logic_in_core_domain",
    "ng_auth_implies_claim_or_consent",
    "ng_auto_merge_duplicates_without_review",
    "ng_direct_request_state_writes_from_child_domains",
    "ng_false_reservation_truth_from_countdown",
    "ng_optimistic_booked_reassurance",
    "ng_direct_gp_record_mutation_for_pharmacy",
    "ng_mandatory_ai_or_autonomous_decisioning",
    "ng_control_plane_as_post_hoc_add_on",
    "ng_direct_browser_to_adapter_or_internal_service_access",
}

EXPECTED_CLASSIFICATIONS = {
    "cap_nhs_app_embedded_channel": "deferred_channel_expansion",
    "cap_optional_pds_enrichment": "future_optional",
    "cap_model_vendor_assistive_rollout": "future_optional",
    "cap_supplier_specific_capability_expansion": "future_optional",
    "ng_appointments_first_product_shape": "explicitly_out_of_scope",
    "ng_native_nhs_app_current_baseline": "explicitly_out_of_scope",
    "ng_direct_gp_record_mutation_for_pharmacy": "explicitly_out_of_scope",
    "ng_mandatory_ai_or_autonomous_decisioning": "explicitly_out_of_scope",
}

ALLOWED_VISIBILITY = {"patient", "staff", "ops", "governance"}
ALLOWED_PHASES = set(BASELINE_PHASES + DEFERRED_PHASES + ["cross_phase"])


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json() -> dict:
    assert_true(JSON_PATH.exists(), f"Missing JSON artifact: {JSON_PATH}")
    return json.loads(JSON_PATH.read_text())


def load_csv() -> list[dict[str, str]]:
    assert_true(CSV_PATH.exists(), f"Missing CSV artifact: {CSV_PATH}")
    with CSV_PATH.open() as handle:
        return list(csv.DictReader(handle))


def validate_rows(payload: dict, csv_rows: list[dict[str, str]]) -> None:
    rows = payload["rows"]
    row_ids = [item["capability_id"] for item in rows]

    assert_true(len(rows) == len(ROWS), f"Expected {len(ROWS)} JSON rows, found {len(rows)}.")
    assert_true(len(csv_rows) == len(ROWS), f"Expected {len(ROWS)} CSV rows, found {len(csv_rows)}.")
    assert_true(set(row_ids) == EXPECTED_ROW_IDS, "JSON row IDs do not match the expected scope matrix rows.")
    assert_true(set(row_ids) == set(item["capability_id"] for item in csv_rows), "CSV row IDs do not match JSON row IDs.")
    assert_true(MANDATORY_ROW_IDS.issubset(set(row_ids)), "One or more mandatory scope rows are missing.")

    present_categories = {item["scope_category"] for item in rows}
    assert_true(
        present_categories == set(REQUIRED_SCOPE_CATEGORIES),
        "Scope categories do not exactly match the required category inventory.",
    )

    classification_set = {item["classification"] for item in rows}
    assert_true(
        classification_set == set(ALLOWED_CLASSIFICATIONS),
        "Not every required classification is represented in the scope matrix.",
    )

    for item in rows:
        capability_id = item["capability_id"]
        classification = item["classification"]
        phases = item["phases"]
        visibility = item["visibility"]
        dependencies = item["dependencies"]

        assert_true(classification in ALLOWED_CLASSIFICATIONS, f"{capability_id} uses invalid classification {classification}.")
        assert_true(set(phases).issubset(ALLOWED_PHASES), f"{capability_id} uses unknown phases {phases}.")
        assert_true(set(visibility).issubset(ALLOWED_VISIBILITY), f"{capability_id} uses invalid visibility values {visibility}.")
        assert_true(bool(item["source_refs"]), f"{capability_id} is missing source traceability refs.")
        assert_true(bool(item["related_decision_ids"]), f"{capability_id} is missing related decision refs.")
        assert_true(bool(item["scope_statement"]), f"{capability_id} is missing a scope statement.")
        assert_true(bool(item["acceptance_implication"]), f"{capability_id} is missing an acceptance implication.")

        if classification in {"core_now", "core_enabling_control_plane"}:
            assert_true(item["baseline_required"] is True, f"{capability_id} must be baseline-required for its classification.")
            assert_true(bool(dependencies), f"{capability_id} must declare baseline dependencies.")
        else:
            assert_true(item["baseline_required"] is False, f"{capability_id} must not be baseline-required for its classification.")

        for dependency in dependencies:
            assert_true(
                dependency["status"] in ALLOWED_DEPENDENCY_STATUSES,
                f"{capability_id} has invalid dependency status {dependency['status']}.",
            )

        if capability_id in EXPECTED_CLASSIFICATIONS:
            assert_true(
                classification == EXPECTED_CLASSIFICATIONS[capability_id],
                f"{capability_id} must be classified as {EXPECTED_CLASSIFICATIONS[capability_id]}.",
            )

    deferred_phase_ids = {
        item["capability_id"]
        for item in rows
        if item["classification"] == "deferred_channel_expansion"
    }
    assert_true(
        deferred_phase_ids == {"cap_nhs_app_embedded_channel"},
        "Deferred channel expansion should map only to the NHS App embedded channel row.",
    )

    future_optional_rows = [
        item["capability_id"]
        for item in rows
        if item["classification"] == "future_optional"
    ]
    assert_true(
        set(future_optional_rows)
        == {
            "cap_optional_pds_enrichment",
            "cap_model_vendor_assistive_rollout",
            "cap_supplier_specific_capability_expansion",
        },
        "Future optional scope rows drifted from the required conditional scope inventory.",
    )


def validate_payload_metadata(payload: dict) -> None:
    assert_true(payload["matrix_id"] == "product_scope_matrix_v1", "Unexpected matrix_id.")
    assert_true(payload["baseline_phases"] == BASELINE_PHASES, "Baseline phases drifted.")
    assert_true(payload["deferred_phases"] == DEFERRED_PHASES, "Deferred phases drifted.")
    assert_true(payload["upstream_inputs"]["requirement_registry_rows"] > 0, "Upstream requirement registry metadata was not loaded.")
    assert_true(payload["upstream_inputs"]["summary_conflict_count"] > 0, "Upstream summary conflict metadata was not loaded.")
    assert_true(payload["upstream_inputs"]["conformance_seed_rows"] > 0, "Upstream conformance seed metadata was not loaded.")


def validate_decision_log(payload: dict) -> None:
    decisions = payload["decision_log"]
    decision_ids = [item["decision_id"] for item in decisions]
    assert_true(len(decisions) == len(DECISIONS), f"Expected {len(DECISIONS)} decisions, found {len(decisions)}.")
    assert_true(set(decision_ids) == EXPECTED_DECISION_IDS, "Decision log IDs do not match the expected set.")

    for item in decisions:
        assert_true(bool(item["source_refs"]), f"{item['decision_id']} is missing source refs.")
        assert_true(bool(item["affected_capability_ids"]), f"{item['decision_id']} is missing affected capability IDs.")
        if item["assumption"]:
            assert_true(
                item["assumption"].startswith("ASSUMPTION_"),
                f"{item['decision_id']} assumption must use ASSUMPTION_ prefix.",
            )
        if item["risk"]:
            assert_true(
                item["risk"].startswith("RISK_"),
                f"{item['decision_id']} risk must use RISK_ prefix.",
            )


def validate_docs() -> None:
    for path in [
        SCOPE_DOC_PATH,
        NON_GOALS_DOC_PATH,
        BASELINE_DOC_PATH,
        DEFERRED_DOC_PATH,
        DECISION_LOG_DOC_PATH,
    ]:
        assert_true(path.exists(), f"Missing documentation artifact: {path}")

    scope_doc = SCOPE_DOC_PATH.read_text()
    baseline_doc = BASELINE_DOC_PATH.read_text()
    deferred_doc = DEFERRED_DOC_PATH.read_text()
    non_goals_doc = NON_GOALS_DOC_PATH.read_text()
    decision_doc = DECISION_LOG_DOC_PATH.read_text()

    for token in [
        "Vecells is a demand orchestration system for primary care",
        "The current delivery baseline is Phases 0 to 6, Phase 8, and Phase 9",
        "Phase 7",
        "Capability Matrix",
    ]:
        assert_true(token in scope_doc, f"Scope boundary doc missing token: {token}")

    for token in [
        "Phase 0: The Foundation Protocol",
        "Phase 6: The Pharmacy Loop",
        "Phase 8: The Assistive Layer",
        "Phase 9: The Assurance Ledger",
    ]:
        assert_true(token in baseline_doc, f"Baseline doc missing token: {token}")

    for token in [
        "cap_nhs_app_embedded_channel",
        "cap_optional_pds_enrichment",
        "cap_model_vendor_assistive_rollout",
        "cap_supplier_specific_capability_expansion",
    ]:
        assert_true(token in deferred_doc, f"Deferred scope doc missing token: {token}")

    for token in [
        "ng_appointments_first_product_shape",
        "ng_separate_phone_back_office_workflow",
        "ng_native_nhs_app_current_baseline",
        "ng_supplier_logic_in_core_domain",
        "ng_auth_implies_claim_or_consent",
        "ng_auto_merge_duplicates_without_review",
        "ng_direct_request_state_writes_from_child_domains",
        "ng_false_reservation_truth_from_countdown",
        "ng_optimistic_booked_reassurance",
        "ng_direct_gp_record_mutation_for_pharmacy",
        "ng_mandatory_ai_or_autonomous_decisioning",
        "ng_control_plane_as_post_hoc_add_on",
    ]:
        assert_true(token in non_goals_doc, f"Non-goals doc missing mandatory exclusion: {token}")

    for decision_id in EXPECTED_DECISION_IDS:
        assert_true(decision_id in decision_doc, f"Decision log doc missing section for {decision_id}.")


def main() -> None:
    payload = load_json()
    csv_rows = load_csv()
    validate_rows(payload, csv_rows)
    validate_payload_metadata(payload)
    validate_decision_log(payload)
    validate_docs()
    print(
        json.dumps(
            {
                "matrix_id": payload["matrix_id"],
                "validated_rows": len(payload["rows"]),
                "validated_decisions": len(payload["decision_log"]),
                "validated_docs": 5,
            },
            indent=2,
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
