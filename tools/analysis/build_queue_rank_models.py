#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_SRC_DIR = ROOT / "packages" / "api-contracts" / "src"
PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"
PACKAGE_TESTS_DIR = ROOT / "packages" / "api-contracts" / "tests"

TASK_ID = "par_073"
VISUAL_MODE = "Queue_Rank_Explanation_Studio"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "queue_rank_plan_manifest.json"
FACTOR_MATRIX_PATH = DATA_DIR / "queue_rank_entry_factor_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "assignment_suggestion_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "73_queue_rank_model_design.md"
RULES_DOC_PATH = DOCS_DIR / "73_deterministic_queue_ranking_rules.md"
STUDIO_PATH = DOCS_DIR / "73_queue_rank_explanation_studio.html"
SPEC_PATH = TESTS_DIR / "queue-rank-explanation-studio.spec.js"
PACKAGE_INDEX_PATH = PACKAGE_SRC_DIR / "index.ts"
PACKAGE_JSON_PATH = ROOT / "packages" / "api-contracts" / "package.json"
PUBLIC_API_TEST_PATH = PACKAGE_TESTS_DIR / "public-api.test.ts"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

QUEUE_PLAN_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "queue-rank-plan.schema.json"
QUEUE_SNAPSHOT_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "queue-rank-snapshot.schema.json"
QUEUE_ENTRY_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "queue-rank-entry.schema.json"
QUEUE_SUGGESTION_SCHEMA_PATH = (
    PACKAGE_SCHEMA_DIR / "queue-assignment-suggestion-snapshot.schema.json"
)

EXPORT_BLOCK_START = "// par_073_queue_ranking_exports:start"
EXPORT_BLOCK_END = "// par_073_queue_ranking_exports:end"

SCENARIOS = [
    {
        "scenario_id": "queue_triage_nominal",
        "queue_family": "triage_primary",
        "queue_label": "Triage primary",
        "queue_ref": "queue_staff_review_north",
        "overload_state": "nominal",
        "top_tier": "critical",
        "row_order_hash": "queue-row-order::073a1b9cdeff00112233445566778899",
        "plan_hash": "queue-rank-plan::073plan00112233445566778899aabbcc",
        "fairness_cycle_state_ref": "queue-fairness-cycle::073fair111122223333444455556666",
        "summary": "Normal load with one escalated task, one returned duplicate-review item, and deterministic fairness across routine bands.",
        "ordered_task_refs": ["task_norm_escalated", "task_norm_return", "task_norm_same_day"],
        "held_task_refs": [],
        "governed_auto_claim_refs": ["task_norm_escalated"],
        "suggestion_count": 3,
    },
    {
        "scenario_id": "queue_triage_overload",
        "queue_family": "triage_primary",
        "queue_label": "Triage primary",
        "queue_ref": "queue_staff_review_north",
        "overload_state": "overload_critical",
        "top_tier": "critical",
        "row_order_hash": "queue-row-order::073b2c9cdeff00112233445566778899",
        "plan_hash": "queue-rank-plan::073plan00112233445566778899aabbcc",
        "fairness_cycle_state_ref": "queue-fairness-cycle::073fair999988887777666655554444",
        "summary": "Critical utilization is above the guardrail, so fairness promises are suppressed and critical urgency dominates.",
        "ordered_task_refs": ["task_overload_1", "task_overload_2", "task_overload_3"],
        "held_task_refs": [],
        "governed_auto_claim_refs": [],
        "suggestion_count": 0,
    },
    {
        "scenario_id": "queue_duplicate_review",
        "queue_family": "triage_primary",
        "queue_label": "Triage primary",
        "queue_ref": "queue_staff_review_duplicates",
        "overload_state": "nominal",
        "top_tier": "warning",
        "row_order_hash": "queue-row-order::073c3d9cdeff00112233445566778899",
        "plan_hash": "queue-rank-plan::073plan00112233445566778899aabbcc",
        "fairness_cycle_state_ref": "queue-fairness-cycle::073fairaaaabbbbccccddddeeeeffff",
        "summary": "Open duplicate-review ambiguity lifts the durable explanation without letting reviewer preference mutate canonical order.",
        "ordered_task_refs": ["task_duplicate_a", "task_duplicate_b", "task_duplicate_hold"],
        "held_task_refs": ["task_duplicate_hold"],
        "governed_auto_claim_refs": [],
        "suggestion_count": 0,
    },
    {
        "scenario_id": "queue_reachability_hold",
        "queue_family": "communications_watch",
        "queue_label": "Reachability watch",
        "queue_ref": "queue_contact_route_recovery",
        "overload_state": "nominal",
        "top_tier": "warning",
        "row_order_hash": "queue-row-order::073d4e9cdeff00112233445566778899",
        "plan_hash": "queue-rank-plan::073plan00112233445566778899aabbcc",
        "fairness_cycle_state_ref": "queue-fairness-cycle::073fair135724680246813579135724",
        "summary": "Reachability risk can lift urgency, while stale trust and active safety holds stay visible but non-routine.",
        "ordered_task_refs": ["task_reachability_risk", "task_safety_hold", "task_trust_hold"],
        "held_task_refs": ["task_safety_hold", "task_trust_hold"],
        "governed_auto_claim_refs": [],
        "suggestion_count": 0,
    },
    {
        "scenario_id": "queue_reviewer_window",
        "queue_family": "triage_primary",
        "queue_label": "Triage primary",
        "queue_ref": "queue_staff_review_reviewer_window",
        "overload_state": "nominal",
        "top_tier": "critical",
        "row_order_hash": "queue-row-order::073e5f9cdeff00112233445566778899",
        "plan_hash": "queue-rank-plan::073plan00112233445566778899aabbcc",
        "fairness_cycle_state_ref": "queue-fairness-cycle::073fair102938475610293847561029",
        "summary": "Reviewer-fit chips are derived only over the committed top window and must carry through source ordinals and explanation refs unchanged.",
        "ordered_task_refs": [
            "task_suggest_escalated",
            "task_suggest_duplicate",
            "task_suggest_routine",
        ],
        "held_task_refs": [],
        "governed_auto_claim_refs": ["task_suggest_escalated", "task_suggest_duplicate"],
        "suggestion_count": 3,
    },
    {
        "scenario_id": "queue_service_prior_mix",
        "queue_family": "support_shared",
        "queue_label": "Support shared",
        "queue_ref": "queue_support_blended",
        "overload_state": "nominal",
        "top_tier": "routine",
        "row_order_hash": "queue-row-order::073f6a9cdeff00112233445566778899",
        "plan_hash": "queue-rank-plan::073plan00112233445566778899aabbcc",
        "fairness_cycle_state_ref": "queue-fairness-cycle::073fair564738291056473829105647",
        "summary": "Expected service-time priors remain reviewer-independent; complex work does not gain rank simply because one reviewer is faster.",
        "ordered_task_refs": ["task_prior_complex", "task_prior_return", "task_prior_fast"],
        "held_task_refs": [],
        "governed_auto_claim_refs": [],
        "suggestion_count": 0,
    },
]

FACTOR_ROWS = [
    {
        "scenario_id": "queue_triage_nominal",
        "queue_family": "triage_primary",
        "task_ref": "task_norm_escalated",
        "ordinal": 1,
        "eligibility_state": "eligible",
        "lexicographic_tier": "critical",
        "sla_class": 3,
        "within_tier_urgency": "0.972100",
        "residual_band": "critical",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.500000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073normescalated",
        "explanation_payload_ref": "queue-explanation::073normescalated",
    },
    {
        "scenario_id": "queue_triage_nominal",
        "queue_family": "triage_primary",
        "task_ref": "task_norm_return",
        "ordinal": 2,
        "eligibility_state": "eligible",
        "lexicographic_tier": "warning",
        "sla_class": 2,
        "within_tier_urgency": "0.781200",
        "residual_band": "warn",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "1",
        "urgency_carry": "0.250000",
        "fairness_band_ref": "band_replies_and_returns",
        "fairness_credit_before": "1.750000",
        "fairness_credit_after": "0.750000",
        "canonical_tie_break_key": "queue-tiebreak::073normreturn",
        "explanation_payload_ref": "queue-explanation::073normreturn",
    },
    {
        "scenario_id": "queue_triage_nominal",
        "queue_family": "triage_primary",
        "task_ref": "task_norm_same_day",
        "ordinal": 3,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 0,
        "within_tier_urgency": "0.442100",
        "residual_band": "watch",
        "contact_risk_band": "none",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.100000",
        "fairness_band_ref": "band_same_day",
        "fairness_credit_before": "1.400000",
        "fairness_credit_after": "0.466667",
        "canonical_tie_break_key": "queue-tiebreak::073normsameday",
        "explanation_payload_ref": "queue-explanation::073normsameday",
    },
    {
        "scenario_id": "queue_triage_overload",
        "queue_family": "triage_primary",
        "task_ref": "task_overload_1",
        "ordinal": 1,
        "eligibility_state": "eligible",
        "lexicographic_tier": "critical",
        "sla_class": 3,
        "within_tier_urgency": "0.955500",
        "residual_band": "critical",
        "contact_risk_band": "warn",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.400000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073overload1",
        "explanation_payload_ref": "queue-explanation::073overload1",
    },
    {
        "scenario_id": "queue_triage_overload",
        "queue_family": "triage_primary",
        "task_ref": "task_overload_2",
        "ordinal": 2,
        "eligibility_state": "eligible",
        "lexicographic_tier": "critical",
        "sla_class": 2,
        "within_tier_urgency": "0.812300",
        "residual_band": "warn",
        "contact_risk_band": "warn",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.220000",
        "fairness_band_ref": "band_replies_and_returns",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073overload2",
        "explanation_payload_ref": "queue-explanation::073overload2",
    },
    {
        "scenario_id": "queue_triage_overload",
        "queue_family": "triage_primary",
        "task_ref": "task_overload_3",
        "ordinal": 3,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 1,
        "within_tier_urgency": "0.501200",
        "residual_band": "watch",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.050000",
        "fairness_band_ref": "band_same_day",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073overload3",
        "explanation_payload_ref": "queue-explanation::073overload3",
    },
    {
        "scenario_id": "queue_duplicate_review",
        "queue_family": "triage_primary",
        "task_ref": "task_duplicate_a",
        "ordinal": 1,
        "eligibility_state": "eligible",
        "lexicographic_tier": "warning",
        "sla_class": 2,
        "within_tier_urgency": "0.744400",
        "residual_band": "warn",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "1",
        "urgency_carry": "0.180000",
        "fairness_band_ref": "band_replies_and_returns",
        "fairness_credit_before": "1.650000",
        "fairness_credit_after": "0.650000",
        "canonical_tie_break_key": "queue-tiebreak::073duplicatea",
        "explanation_payload_ref": "queue-explanation::073duplicatea",
    },
    {
        "scenario_id": "queue_duplicate_review",
        "queue_family": "triage_primary",
        "task_ref": "task_duplicate_b",
        "ordinal": 2,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 0,
        "within_tier_urgency": "0.433300",
        "residual_band": "watch",
        "contact_risk_band": "none",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.030000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "1.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073duplicateb",
        "explanation_payload_ref": "queue-explanation::073duplicateb",
    },
    {
        "scenario_id": "queue_duplicate_review",
        "queue_family": "triage_primary",
        "task_ref": "task_duplicate_hold",
        "ordinal": 3,
        "eligibility_state": "held_preemption",
        "lexicographic_tier": "hold",
        "sla_class": 0,
        "within_tier_urgency": "0.000000",
        "residual_band": "watch",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.000000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073duplicatehold",
        "explanation_payload_ref": "queue-explanation::073duplicatehold",
    },
    {
        "scenario_id": "queue_reachability_hold",
        "queue_family": "communications_watch",
        "task_ref": "task_reachability_risk",
        "ordinal": 1,
        "eligibility_state": "eligible",
        "lexicographic_tier": "warning",
        "sla_class": 2,
        "within_tier_urgency": "0.699100",
        "residual_band": "warn",
        "contact_risk_band": "critical",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.120000",
        "fairness_band_ref": "band_replies_and_returns",
        "fairness_credit_before": "1.550000",
        "fairness_credit_after": "0.550000",
        "canonical_tie_break_key": "queue-tiebreak::073reachabilityrisk",
        "explanation_payload_ref": "queue-explanation::073reachabilityrisk",
    },
    {
        "scenario_id": "queue_reachability_hold",
        "queue_family": "communications_watch",
        "task_ref": "task_safety_hold",
        "ordinal": 2,
        "eligibility_state": "held_preemption",
        "lexicographic_tier": "hold",
        "sla_class": 3,
        "within_tier_urgency": "0.000000",
        "residual_band": "critical",
        "contact_risk_band": "warn",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.000000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073safetyhold",
        "explanation_payload_ref": "queue-explanation::073safetyhold",
    },
    {
        "scenario_id": "queue_reachability_hold",
        "queue_family": "communications_watch",
        "task_ref": "task_trust_hold",
        "ordinal": 3,
        "eligibility_state": "held_trust",
        "lexicographic_tier": "hold",
        "sla_class": 0,
        "within_tier_urgency": "0.000000",
        "residual_band": "watch",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.000000",
        "fairness_band_ref": "band_same_day",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073trusthold",
        "explanation_payload_ref": "queue-explanation::073trusthold",
    },
    {
        "scenario_id": "queue_reviewer_window",
        "queue_family": "triage_primary",
        "task_ref": "task_suggest_escalated",
        "ordinal": 1,
        "eligibility_state": "eligible",
        "lexicographic_tier": "critical",
        "sla_class": 3,
        "within_tier_urgency": "0.961000",
        "residual_band": "critical",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.380000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "0.000000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073suggestescalated",
        "explanation_payload_ref": "queue-explanation::073suggestescalated",
    },
    {
        "scenario_id": "queue_reviewer_window",
        "queue_family": "triage_primary",
        "task_ref": "task_suggest_duplicate",
        "ordinal": 2,
        "eligibility_state": "eligible",
        "lexicographic_tier": "warning",
        "sla_class": 2,
        "within_tier_urgency": "0.732000",
        "residual_band": "warn",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "1",
        "urgency_carry": "0.180000",
        "fairness_band_ref": "band_replies_and_returns",
        "fairness_credit_before": "1.600000",
        "fairness_credit_after": "0.600000",
        "canonical_tie_break_key": "queue-tiebreak::073suggestduplicate",
        "explanation_payload_ref": "queue-explanation::073suggestduplicate",
    },
    {
        "scenario_id": "queue_reviewer_window",
        "queue_family": "triage_primary",
        "task_ref": "task_suggest_routine",
        "ordinal": 3,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 0,
        "within_tier_urgency": "0.421000",
        "residual_band": "watch",
        "contact_risk_band": "none",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.040000",
        "fairness_band_ref": "band_same_day",
        "fairness_credit_before": "1.400000",
        "fairness_credit_after": "0.466667",
        "canonical_tie_break_key": "queue-tiebreak::073suggestroutine",
        "explanation_payload_ref": "queue-explanation::073suggestroutine",
    },
    {
        "scenario_id": "queue_service_prior_mix",
        "queue_family": "support_shared",
        "task_ref": "task_prior_complex",
        "ordinal": 1,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 1,
        "within_tier_urgency": "0.601000",
        "residual_band": "warn",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.120000",
        "fairness_band_ref": "band_general_routine",
        "fairness_credit_before": "1.200000",
        "fairness_credit_after": "0.000000",
        "canonical_tie_break_key": "queue-tiebreak::073priorcomplex",
        "explanation_payload_ref": "queue-explanation::073priorcomplex",
    },
    {
        "scenario_id": "queue_service_prior_mix",
        "queue_family": "support_shared",
        "task_ref": "task_prior_return",
        "ordinal": 2,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 1,
        "within_tier_urgency": "0.564000",
        "residual_band": "watch",
        "contact_risk_band": "watch",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.100000",
        "fairness_band_ref": "band_replies_and_returns",
        "fairness_credit_before": "1.100000",
        "fairness_credit_after": "0.100000",
        "canonical_tie_break_key": "queue-tiebreak::073priorreturn",
        "explanation_payload_ref": "queue-explanation::073priorreturn",
    },
    {
        "scenario_id": "queue_service_prior_mix",
        "queue_family": "support_shared",
        "task_ref": "task_prior_fast",
        "ordinal": 3,
        "eligibility_state": "eligible",
        "lexicographic_tier": "routine",
        "sla_class": 0,
        "within_tier_urgency": "0.342000",
        "residual_band": "watch",
        "contact_risk_band": "none",
        "duplicate_review_flag": "0",
        "urgency_carry": "0.020000",
        "fairness_band_ref": "band_same_day",
        "fairness_credit_before": "1.400000",
        "fairness_credit_after": "0.866667",
        "canonical_tie_break_key": "queue-tiebreak::073priorfast",
        "explanation_payload_ref": "queue-explanation::073priorfast",
    },
]

SUGGESTION_CASEBOOK = {
    "task_id": TASK_ID,
    "generated_at": GENERATED_AT,
    "cases": [
        {
            "scenario_id": "queue_triage_nominal",
            "reviewer_scope_ref": "reviewer_scope_triage",
            "candidate_window_size": 3,
            "fairness_promise_state": "active",
            "governed_auto_claim_refs": ["task_norm_escalated"],
            "suggestion_rows": [
                {
                    "task_ref": "task_norm_escalated",
                    "ordinal": 1,
                    "reviewer_ref": "reviewer_ava",
                    "suggestion_score": 0.824000,
                    "governed_auto_claim_eligible": True,
                    "reason_refs": ["skill_fit", "load_headroom"],
                    "explanation_payload_ref": "queue-explanation::073normescalated",
                },
                {
                    "task_ref": "task_norm_return",
                    "ordinal": 2,
                    "reviewer_ref": "reviewer_ben",
                    "suggestion_score": 0.781000,
                    "governed_auto_claim_eligible": False,
                    "reason_refs": ["continuity_fit", "same_context"],
                    "explanation_payload_ref": "queue-explanation::073normreturn",
                },
                {
                    "task_ref": "task_norm_same_day",
                    "ordinal": 3,
                    "reviewer_ref": "reviewer_ava",
                    "suggestion_score": 0.588000,
                    "governed_auto_claim_eligible": False,
                    "reason_refs": ["skill_fit"],
                    "explanation_payload_ref": "queue-explanation::073normsameday",
                },
            ],
        },
        {
            "scenario_id": "queue_reviewer_window",
            "reviewer_scope_ref": "reviewer_scope_triage",
            "candidate_window_size": 3,
            "fairness_promise_state": "active",
            "governed_auto_claim_refs": ["task_suggest_escalated", "task_suggest_duplicate"],
            "suggestion_rows": [
                {
                    "task_ref": "task_suggest_escalated",
                    "ordinal": 1,
                    "reviewer_ref": "reviewer_ava",
                    "suggestion_score": 0.861000,
                    "governed_auto_claim_eligible": True,
                    "reason_refs": ["skill_fit", "load_headroom"],
                    "explanation_payload_ref": "queue-explanation::073suggestescalated",
                },
                {
                    "task_ref": "task_suggest_duplicate",
                    "ordinal": 2,
                    "reviewer_ref": "reviewer_ben",
                    "suggestion_score": 0.902000,
                    "governed_auto_claim_eligible": True,
                    "reason_refs": ["continuity_fit", "same_context", "skill_fit"],
                    "explanation_payload_ref": "queue-explanation::073suggestduplicate",
                },
                {
                    "task_ref": "task_suggest_routine",
                    "ordinal": 3,
                    "reviewer_ref": "reviewer_ben",
                    "suggestion_score": 0.541000,
                    "governed_auto_claim_eligible": False,
                    "reason_refs": ["skill_fit", "focus_penalty_applied"],
                    "explanation_payload_ref": "queue-explanation::073suggestroutine",
                },
            ],
        },
    ],
}
SUGGESTION_CASEBOOK["summary"] = {
    "case_count": len(SUGGESTION_CASEBOOK["cases"]),
    "suggestion_row_count": sum(
        len(case["suggestion_rows"]) for case in SUGGESTION_CASEBOOK["cases"]
    ),
    "governed_auto_claim_count": sum(
        len(case["governed_auto_claim_refs"]) for case in SUGGESTION_CASEBOOK["cases"]
    ),
}


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    ensure_parent(path)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def replace_block(source: str, start: str, end: str, block: str) -> str:
    replacement = f"{start}\n{block.rstrip()}\n{end}"
    if start in source and end in source:
        before, remainder = source.split(start, 1)
        _, after = remainder.split(end, 1)
        return before + replacement + after
    return source.rstrip() + "\n\n" + replacement + "\n"


def patch_package_index() -> None:
    source = PACKAGE_INDEX_PATH.read_text(encoding="utf-8")
    source = replace_block(
        source,
        EXPORT_BLOCK_START,
        EXPORT_BLOCK_END,
        'export * from "./queue-ranking";',
    )
    write_text(PACKAGE_INDEX_PATH, source)


def patch_public_api_test() -> None:
    source = PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    import_anchor = "  commandSettlementEnvelopeCatalog,\n  commandSettlementEnvelopeSchemas,\n"
    if "queueRankingContractCatalog" not in source:
        replacement = import_anchor + "  queueRankingContractCatalog,\n  queueRankingSchemas,\n"
        if import_anchor in source:
            source = source.replace(import_anchor, replacement, 1)
        else:
            fallback_import_anchor = "  recoveryTupleBaselineCatalog,\n  recoveryTupleBaselineSchemas,\n"
            source = source.replace(
                fallback_import_anchor,
                fallback_import_anchor + "  queueRankingContractCatalog,\n  queueRankingSchemas,\n",
                1,
            )
    test_block = dedent(
        """
          it("publishes the par_073 queue-ranking schema surface", () => {
            expect(queueRankingContractCatalog.taskId).toBe("par_073");
            expect(queueRankingContractCatalog.scenarioCount).toBe(6);
            expect(queueRankingSchemas).toHaveLength(4);

            for (const schema of queueRankingSchemas) {
              const schemaPath = path.join(ROOT, schema.artifactPath);
              expect(fs.existsSync(schemaPath)).toBe(true);
            }
          });

        """
    ).rstrip()
    if "publishes the par_073 queue-ranking schema surface" not in source:
        settlement_anchor = 'it("publishes the par_072 settlement and envelope schema surface", () => {'
        settlement_start = source.find(settlement_anchor)
        if settlement_start != -1:
            settlement_end = -1
            settlement_end_token = ""
            for candidate in ("\n});", "\n  });"):
                candidate_index = source.find(candidate, settlement_start)
                if candidate_index != -1 and (
                    settlement_end == -1 or candidate_index < settlement_end
                ):
                    settlement_end = candidate_index
                    settlement_end_token = candidate
            if settlement_end != -1:
                settlement_end += len(settlement_end_token)
                source = source[:settlement_end] + "\n\n" + test_block + source[settlement_end:]
        elif 'it("publishes the seq_060 recovery posture schema surface", () => {' in source:
            source = source.replace(
                'it("publishes the seq_060 recovery posture schema surface", () => {',
                test_block + '\n\nit("publishes the seq_060 recovery posture schema surface", () => {',
                1,
            )
        else:
            describe_end = source.rfind("\n});")
            if describe_end != -1:
                source = source[:describe_end] + "\n\n" + test_block + source[describe_end:]
            else:
                source = source.rstrip() + "\n\n" + test_block + "\n"
    write_text(PUBLIC_API_TEST_PATH, source)


def patch_package_json() -> None:
    payload = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    exports = payload.setdefault("exports", {})
    exports["./schemas/queue-rank-plan.schema.json"] = "./schemas/queue-rank-plan.schema.json"
    exports["./schemas/queue-rank-snapshot.schema.json"] = (
        "./schemas/queue-rank-snapshot.schema.json"
    )
    exports["./schemas/queue-rank-entry.schema.json"] = "./schemas/queue-rank-entry.schema.json"
    exports["./schemas/queue-assignment-suggestion-snapshot.schema.json"] = (
        "./schemas/queue-assignment-suggestion-snapshot.schema.json"
    )
    write_json(PACKAGE_JSON_PATH, payload)


def append_script_step(script: str, step: str) -> str:
    return script if step in script else script + " && " + step


def patch_playwright_package_json() -> None:
    payload = json.loads(PLAYWRIGHT_PACKAGE_PATH.read_text(encoding="utf-8"))
    scripts = payload.setdefault("scripts", {})
    scripts["build"] = append_script_step(
        scripts["build"], "node --check queue-rank-explanation-studio.spec.js"
    )
    scripts["lint"] = append_script_step(
        scripts["lint"], "eslint queue-rank-explanation-studio.spec.js"
    )
    scripts["test"] = append_script_step(
        scripts["test"], "node queue-rank-explanation-studio.spec.js"
    )
    scripts["typecheck"] = append_script_step(
        scripts["typecheck"], "node --check queue-rank-explanation-studio.spec.js"
    )
    scripts["e2e"] = append_script_step(
        scripts["e2e"], "node queue-rank-explanation-studio.spec.js --run"
    )
    write_json(PLAYWRIGHT_PACKAGE_PATH, payload)


def build_manifest() -> dict[str, object]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Publish replayable queue plan, snapshot, entry, and suggestion artifacts so later staff workspaces, operations boards, and next-task consumers stop recomputing queue truth ad hoc.",
        "source_precedence": [
            "prompt/073.md",
            "prompt/shared_operating_contract_066_to_075.md",
            "prompt/AGENT.md",
            "prompt/checklist.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.11A QueueRankPlan",
            "blueprint/phase-0-the-foundation-protocol.md#1.11B QueueRankSnapshot",
            "blueprint/phase-0-the-foundation-protocol.md#1.11C QueueRankEntry",
            "blueprint/phase-0-the-foundation-protocol.md#1.11D QueueAssignmentSuggestionSnapshot",
            "blueprint/phase-3-the-human-checkpoint.md#3B. Deterministic queue engine, assignment, and fairness controls",
            "blueprint/staff-workspace-interface-architecture.md#Queue snapshot consistency law",
            "blueprint/operations-console-frontend-blueprint.md#Ranked queue entities and bottlenecks",
            "blueprint/forensic-audit-findings.md#Finding 14",
            "blueprint/forensic-audit-findings.md#Finding 16",
            "blueprint/forensic-audit-findings.md#Finding 92",
            "blueprint/forensic-audit-findings.md#Finding 93",
            "packages/api-contracts/src/queue-ranking.ts",
            "services/command-api/src/queue-ranking.ts",
        ],
        "summary": {
            "scenario_count": len(SCENARIOS),
            "factor_row_count": len(FACTOR_ROWS),
            "suggestion_case_count": SUGGESTION_CASEBOOK["summary"]["case_count"],
            "suggestion_row_count": SUGGESTION_CASEBOOK["summary"]["suggestion_row_count"],
            "governed_auto_claim_count": SUGGESTION_CASEBOOK["summary"][
                "governed_auto_claim_count"
            ],
            "schema_count": 4,
            "validator_count": 6,
        },
        "validators": [
            "queue rows and next-task candidates must bind one committed rank snapshot",
            "mixed-freshness facts may not become eligible queue rows",
            "suggestion snapshots may not mutate ordinals or explanation refs",
            "overload-critical posture must suppress fairness promises",
            "canonical tie-break keys must remain deterministic",
            "browser and supervisor views may not resort stale rows client-side",
        ],
        "scenarios": SCENARIOS,
    }


def build_design_doc() -> str:
    return dedent(
        f"""
        # 73 Queue Rank Model Design

        `par_073` implements the shared queue-ordering substrate for later staff workspace, next-task, and operations drill-down work. The core law is now published through `QueueRankPlan`, `QueueRankSnapshot`, `QueueRankEntry`, and downstream `QueueAssignmentSuggestionSnapshot`.

        ## Core law

        - `QueueRankPlan` is the only versioned source of canonical queue ordering.
        - `QueueRankSnapshot` is the replayable canonical ordering cut and must exist before queue rows, preview, or next-task candidates are published.
        - `QueueRankEntry` is the authoritative explanation for one ordinal.
        - `QueueAssignmentSuggestionSnapshot` is derived after canonical order is committed and may not rewrite ordinals or explanation payload refs.

        ## Snapshot discipline

        Every scenario in the frozen manifest carries one `rowOrderHash`, one `sourceFactCutRef`, one fairness-cycle reference, and one overload posture. Held rows stay explicit through `eligibilityState` rather than disappearing into browser-local heuristics.

        ## Downstream consequences

        - later staff launch, prefetch, and completion work can bind one committed snapshot ref
        - operations queue views can show pressure honestly without re-sorting stale rows
        - reviewer fit can optimize assignment windows without corrupting shared queue truth
        """
    ).strip()


def build_rules_doc() -> str:
    return dedent(
        """
        # 73 Deterministic Queue Ranking Rules

        ## Ranking law

        Canonical order is not one unconstrained weighted sum. The frozen plan separates:

        1. lexicographic precedence for escalations, SLA class, priority, maximum risk band, duplicate-review ambiguity, and urgency carry
        2. normalized within-tier urgency for time pressure and patient-risk dimensions
        3. deterministic fair merge for routine non-critical bands

        ## Suggestion isolation

        Reviewer-fit and governed auto-claim logic execute only over the committed top window from a source `QueueRankSnapshot`. Suggestion rows must repeat source ordinals, tie-break keys, and explanation refs unchanged.

        ## Overload honesty

        When `overloadState = overload_critical`, fairness promises are suppressed. The studio and validators must surface that posture explicitly instead of leaving stale starvation guarantees visible.

        ## Mixed-snapshot prohibition

        Queue rows, queue preview, next-task candidates, and continuity evidence must agree on the same committed queue snapshot ref unless the consumer degrades explicitly to stale or recovery posture.
        """
    ).strip()


def build_schema_payloads() -> dict[Path, dict[str, object]]:
    plan_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/queue-rank-plan.schema.json",
        "task_id": TASK_ID,
        "title": "QueueRankPlan",
        "type": "object",
        "required": [
            "queueRankPlanId",
            "queueFamilyRef",
            "eligibilityRuleSetRef",
            "lexicographicTierPolicyRef",
            "withinTierWeightSetRef",
            "fairnessMergePolicyRef",
            "overloadGuardPolicyRef",
            "assignmentSuggestionPolicyRef",
            "explanationSchemaRef",
            "canonicalTieBreakPolicyRef",
            "planHash",
            "effectiveAt",
        ],
        "properties": {
            "queueRankPlanId": {"type": "string"},
            "queueFamilyRef": {"type": "string"},
            "eligibilityRuleSetRef": {"type": "string"},
            "lexicographicTierPolicyRef": {"type": "string"},
            "withinTierWeightSetRef": {"type": "string"},
            "fairnessMergePolicyRef": {"type": "string"},
            "overloadGuardPolicyRef": {"type": "string"},
            "assignmentSuggestionPolicyRef": {"type": "string"},
            "explanationSchemaRef": {"type": "string"},
            "canonicalTieBreakPolicyRef": {"type": "string"},
            "planHash": {"type": "string"},
            "effectiveAt": {"type": "string", "format": "date-time"},
        },
    }
    snapshot_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/queue-rank-snapshot.schema.json",
        "task_id": TASK_ID,
        "title": "QueueRankSnapshot",
        "type": "object",
        "required": [
            "rankSnapshotId",
            "queueRef",
            "queueRankPlanRef",
            "asOfAt",
            "sourceFactCutRef",
            "trustInputRefs",
            "eligibleTaskRefs",
            "excludedTaskRefs",
            "overloadState",
            "fairnessCycleStateRef",
            "rowOrderHash",
            "generatedAt",
        ],
        "properties": {
            "rankSnapshotId": {"type": "string"},
            "queueRef": {"type": "string"},
            "queueRankPlanRef": {"type": "string"},
            "asOfAt": {"type": "string", "format": "date-time"},
            "sourceFactCutRef": {"type": "string"},
            "trustInputRefs": {"type": "array", "items": {"type": "string"}},
            "eligibleTaskRefs": {"type": "array", "items": {"type": "string"}},
            "excludedTaskRefs": {"type": "array", "items": {"type": "string"}},
            "overloadState": {
                "type": "string",
                "enum": ["nominal", "overload_critical"],
            },
            "fairnessCycleStateRef": {"type": "string"},
            "rowOrderHash": {"type": "string"},
            "generatedAt": {"type": "string", "format": "date-time"},
        },
    }
    entry_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/queue-rank-entry.schema.json",
        "task_id": TASK_ID,
        "title": "QueueRankEntry",
        "type": "object",
        "required": [
            "rankEntryId",
            "rankSnapshotRef",
            "taskRef",
            "ordinal",
            "eligibilityState",
            "lexicographicTier",
            "urgencyScore",
            "residualBand",
            "contactRiskBand",
            "duplicateReviewFlag",
            "urgencyCarry",
            "fairnessBandRef",
            "fairnessCreditBefore",
            "fairnessCreditAfter",
            "canonicalTieBreakKey",
            "explanationPayloadRef",
            "generatedAt",
        ],
        "properties": {
            "rankEntryId": {"type": "string"},
            "rankSnapshotRef": {"type": "string"},
            "taskRef": {"type": "string"},
            "ordinal": {"type": "integer", "minimum": 1},
            "eligibilityState": {
                "type": "string",
                "enum": ["eligible", "held_preemption", "held_trust", "excluded_scope"],
            },
            "lexicographicTier": {"type": "string"},
            "urgencyScore": {"type": "number"},
            "residualBand": {"type": "string"},
            "contactRiskBand": {"type": "string"},
            "duplicateReviewFlag": {"type": "boolean"},
            "urgencyCarry": {"type": "number"},
            "fairnessBandRef": {"type": "string"},
            "fairnessCreditBefore": {"type": "number"},
            "fairnessCreditAfter": {"type": "number"},
            "canonicalTieBreakKey": {"type": "string"},
            "explanationPayloadRef": {"type": "string"},
            "generatedAt": {"type": "string", "format": "date-time"},
        },
    }
    suggestion_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/queue-assignment-suggestion-snapshot.schema.json",
        "task_id": TASK_ID,
        "title": "QueueAssignmentSuggestionSnapshot",
        "type": "object",
        "required": [
            "suggestionSnapshotId",
            "rankSnapshotRef",
            "reviewerScopeRef",
            "candidateWindowSize",
            "suggestionRows",
            "governedAutoClaimRefs",
            "generatedAt",
        ],
        "properties": {
            "suggestionSnapshotId": {"type": "string"},
            "rankSnapshotRef": {"type": "string"},
            "reviewerScopeRef": {"type": "string"},
            "candidateWindowSize": {"type": "integer", "minimum": 1},
            "suggestionRows": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": [
                        "taskRef",
                        "ordinal",
                        "reviewerRef",
                        "suggestionScore",
                        "governedAutoClaimEligible",
                        "canonicalTieBreakKey",
                        "explanationPayloadRef",
                    ],
                    "properties": {
                        "taskRef": {"type": "string"},
                        "ordinal": {"type": "integer", "minimum": 1},
                        "reviewerRef": {"type": ["string", "null"]},
                        "suggestionScore": {"type": "number"},
                        "governedAutoClaimEligible": {"type": "boolean"},
                        "canonicalTieBreakKey": {"type": "string"},
                        "explanationPayloadRef": {"type": "string"},
                    },
                },
            },
            "governedAutoClaimRefs": {"type": "array", "items": {"type": "string"}},
            "generatedAt": {"type": "string", "format": "date-time"},
        },
    }
    return {
        QUEUE_PLAN_SCHEMA_PATH: plan_schema,
        QUEUE_SNAPSHOT_SCHEMA_PATH: snapshot_schema,
        QUEUE_ENTRY_SCHEMA_PATH: entry_schema,
        QUEUE_SUGGESTION_SCHEMA_PATH: suggestion_schema,
    }


def build_studio_html() -> str:
    scenarios_json = json.dumps(SCENARIOS, indent=2)
    factor_rows_json = json.dumps(FACTOR_ROWS, indent=2)
    casebook_json = json.dumps(SUGGESTION_CASEBOOK, indent=2)
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>73 Queue Rank Explanation Studio</title>
          <style>
            :root {{
              color-scheme: light;
              --canvas: #F7F9FC;
              --panel: #FFFFFF;
              --rail: #EEF2F8;
              --inset: #F4F6FB;
              --text-strong: #0F172A;
              --text-default: #1E293B;
              --text-muted: #667085;
              --border: #E2E8F0;
              --rank: #3559E6;
              --fairness: #0EA5A4;
              --suggestion: #7C3AED;
              --overload: #C98900;
              --blocked: #C24141;
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: radial-gradient(circle at top left, #ffffff 0%, var(--canvas) 55%, #edf2fb 100%);
              color: var(--text-default);
            }}
            body[data-reduced-motion="true"] * {{
              transition-duration: 0ms !important;
              animation-duration: 0ms !important;
              scroll-behavior: auto !important;
            }}
            .shell {{
              max-width: 1500px;
              margin: 0 auto;
              min-height: 100vh;
              padding: 24px 20px 32px;
            }}
            header {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              min-height: 72px;
              padding: 16px 18px;
              background: rgba(255, 255, 255, 0.85);
              border: 1px solid var(--border);
              border-radius: 22px;
              backdrop-filter: blur(16px);
            }}
            .brand {{
              display: flex;
              align-items: center;
              gap: 14px;
            }}
            .brand svg {{
              width: 42px;
              height: 42px;
            }}
            .wordmark {{
              font-size: 0.78rem;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            .headline {{
              font-size: 1.2rem;
              font-weight: 700;
              color: var(--text-strong);
            }}
            .stat-strip {{
              display: grid;
              grid-template-columns: repeat(4, minmax(120px, 1fr));
              gap: 10px;
              flex: 1;
            }}
            .stat {{
              background: var(--inset);
              border: 1px solid var(--border);
              border-radius: 16px;
              padding: 10px 12px;
            }}
            .stat-label {{
              font-size: 0.72rem;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }}
            .stat-value {{
              font-size: 1.15rem;
              font-weight: 700;
              color: var(--text-strong);
            }}
            main {{
              display: grid;
              grid-template-columns: 304px minmax(0, 1fr) 408px;
              gap: 18px;
              margin-top: 18px;
            }}
            .panel {{
              background: var(--panel);
              border: 1px solid var(--border);
              border-radius: 22px;
              padding: 18px;
              box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
            }}
            .rail {{
              background: linear-gradient(180deg, var(--rail) 0%, #f8fbff 100%);
            }}
            .filters {{
              display: grid;
              gap: 12px;
            }}
            label {{
              display: grid;
              gap: 6px;
              font-size: 0.82rem;
              color: var(--text-muted);
            }}
            select {{
              height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border);
              background: #fff;
              padding: 0 12px;
              color: var(--text-strong);
              transition: border-color 120ms ease, box-shadow 120ms ease;
            }}
            select:focus,
            button:focus {{
              outline: none;
              border-color: var(--rank);
              box-shadow: 0 0 0 3px rgba(53, 89, 230, 0.16);
            }}
            .scenario-list {{
              margin-top: 18px;
              display: grid;
              gap: 10px;
            }}
            .scenario-card {{
              text-align: left;
              width: 100%;
              border: 1px solid var(--border);
              background: #fff;
              border-radius: 18px;
              padding: 14px;
              transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
            }}
            .scenario-card[data-selected="true"] {{
              border-color: var(--rank);
              box-shadow: 0 12px 32px rgba(53, 89, 230, 0.12);
              transform: translateY(-1px);
            }}
            .scenario-meta {{
              display: flex;
              justify-content: space-between;
              gap: 12px;
              color: var(--text-muted);
              font-size: 0.78rem;
            }}
            .scenario-title {{
              margin: 8px 0 6px;
              font-size: 0.98rem;
              font-weight: 700;
              color: var(--text-strong);
            }}
            .scenario-summary {{
              margin: 0;
              font-size: 0.84rem;
              color: var(--text-muted);
            }}
            .canvas {{
              display: grid;
              gap: 18px;
            }}
            .diagram {{
              min-height: 260px;
              border: 1px solid var(--border);
              border-radius: 20px;
              padding: 16px;
              background: linear-gradient(180deg, #ffffff 0%, #f7f9ff 100%);
            }}
            .diagram-heading {{
              display: flex;
              align-items: baseline;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 12px;
            }}
            .diagram-title {{
              font-size: 1rem;
              font-weight: 700;
              color: var(--text-strong);
            }}
            .diagram-parity {{
              font-size: 0.82rem;
              color: var(--text-muted);
            }}
            .ladder-list {{
              display: grid;
              gap: 10px;
            }}
            .ladder-row {{
              display: grid;
              grid-template-columns: 52px 1fr 144px;
              gap: 12px;
              align-items: center;
            }}
            .ladder-rank {{
              font-weight: 700;
              color: var(--rank);
            }}
            .ladder-track {{
              height: 14px;
              border-radius: 999px;
              background: var(--rail);
              overflow: hidden;
            }}
            .ladder-fill {{
              height: 100%;
              border-radius: 999px;
              background: linear-gradient(90deg, var(--rank), #6d84ef);
            }}
            .ladder-flags {{
              font-size: 0.78rem;
              color: var(--text-muted);
            }}
            .fairness-ribbon {{
              display: grid;
              gap: 12px;
            }}
            .fairness-chip {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 12px 14px;
              border-radius: 16px;
              background: var(--inset);
              border: 1px solid var(--border);
            }}
            .fairness-chip strong {{
              color: var(--text-strong);
            }}
            .fairness-chip span {{
              color: var(--text-muted);
              font-size: 0.82rem;
            }}
            .accent-rank {{ color: var(--rank); }}
            .accent-fairness {{ color: var(--fairness); }}
            .accent-suggestion {{ color: var(--suggestion); }}
            .accent-overload {{ color: var(--overload); }}
            .accent-blocked {{ color: var(--blocked); }}
            .inspector-grid {{
              display: grid;
              gap: 12px;
            }}
            .kv {{
              display: grid;
              grid-template-columns: 132px 1fr;
              gap: 10px;
              font-size: 0.84rem;
            }}
            .kv dt {{
              color: var(--text-muted);
            }}
            .kv dd {{
              margin: 0;
              color: var(--text-strong);
            }}
            code {{
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
              font-size: 0.8rem;
            }}
            .tables {{
              margin-top: 18px;
              display: grid;
              grid-template-columns: minmax(0, 1fr) minmax(0, 360px);
              gap: 18px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
              font-size: 0.82rem;
            }}
            th, td {{
              text-align: left;
              padding: 10px 8px;
              border-bottom: 1px solid var(--border);
              vertical-align: top;
            }}
            th {{
              color: var(--text-muted);
              font-weight: 600;
            }}
            .empty-state {{
              padding: 20px 4px;
              color: var(--text-muted);
              font-size: 0.84rem;
            }}
            @media (max-width: 1180px) {{
              main {{
                grid-template-columns: 1fr;
              }}
              .tables {{
                grid-template-columns: 1fr;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="shell">
            <header>
              <div class="brand">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <rect x="4" y="4" width="56" height="56" rx="18" fill="#EEF2F8" stroke="#3559E6" />
                  <path d="M20 20h11c8 0 13 5 13 12 0 8-6 13-14 13h-3v8H20V20zm7 6v13h3c4 0 7-2 7-7 0-4-2-6-7-6h-3z" fill="#0F172A"/>
                  <path d="M39 18h6v28h-6z" fill="#3559E6"/>
                </svg>
                <div>
                  <div class="wordmark">Vecells Queue Truth</div>
                  <div class="headline">Queue Rank Explanation Studio</div>
                </div>
              </div>
              <div class="stat-strip">
                <div class="stat">
                  <div class="stat-label">Active Plans</div>
                  <div class="stat-value">1</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Snapshots</div>
                  <div class="stat-value">{len(SCENARIOS)}</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Overloaded</div>
                  <div class="stat-value">1</div>
                </div>
                <div class="stat">
                  <div class="stat-label">Suggestion Windows</div>
                  <div class="stat-value">{SUGGESTION_CASEBOOK["summary"]["case_count"]}</div>
                </div>
              </div>
            </header>

            <main>
              <aside class="panel rail">
                <div class="filters">
                  <label>Queue family
                    <select data-testid="queue-family-filter" id="queue-family-filter">
                      <option value="all">All queue families</option>
                    </select>
                  </label>
                  <label>Overload state
                    <select data-testid="overload-filter" id="overload-filter">
                      <option value="all">All overload states</option>
                      <option value="nominal">Nominal</option>
                      <option value="overload_critical">Overload critical</option>
                    </select>
                  </label>
                  <label>Lexicographic tier
                    <select data-testid="tier-filter" id="tier-filter">
                      <option value="all">All tiers</option>
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="routine">Routine</option>
                      <option value="hold">Hold</option>
                    </select>
                  </label>
                </div>
                <div class="scenario-list" data-testid="scenario-list"></div>
              </aside>

              <div class="canvas">
                <section class="panel diagram" aria-labelledby="ladder-title">
                  <div class="diagram-heading">
                    <div class="diagram-title" id="ladder-title">Rank ladder</div>
                    <div class="diagram-parity" data-testid="ladder-parity"></div>
                  </div>
                  <div class="ladder-list" data-testid="ladder"></div>
                  <p class="diagram-parity" data-testid="ladder-textual-parity"></p>
                </section>

                <section class="panel diagram" aria-labelledby="fairness-title">
                  <div class="diagram-heading">
                    <div class="diagram-title" id="fairness-title">Fairness merge ribbon</div>
                    <div class="diagram-parity" data-testid="fairness-parity"></div>
                  </div>
                  <div class="fairness-ribbon" data-testid="fairness-ribbon"></div>
                  <p class="diagram-parity" data-testid="fairness-textual-parity"></p>
                </section>

                <div class="tables">
                  <section class="panel">
                    <div class="diagram-heading">
                      <div class="diagram-title">Factor table</div>
                      <div class="diagram-parity" data-testid="factor-parity"></div>
                    </div>
                    <table data-testid="factor-table">
                      <thead>
                        <tr>
                          <th>Ordinal</th>
                          <th>Task</th>
                          <th>Tier</th>
                          <th>Eligibility</th>
                          <th>Urgency</th>
                          <th>Fairness</th>
                        </tr>
                      </thead>
                      <tbody id="factor-body"></tbody>
                    </table>
                  </section>

                  <section class="panel">
                    <div class="diagram-heading">
                      <div class="diagram-title">Suggestion window</div>
                      <div class="diagram-parity" data-testid="suggestion-parity"></div>
                    </div>
                    <table data-testid="suggestion-table">
                      <thead>
                        <tr>
                          <th>Ordinal</th>
                          <th>Task</th>
                          <th>Reviewer</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody id="suggestion-body"></tbody>
                    </table>
                  </section>
                </div>
              </div>

              <aside class="panel">
                <div class="diagram-heading">
                  <div class="diagram-title">Inspector</div>
                  <div class="diagram-parity">Committed snapshot truth only</div>
                </div>
                <div class="inspector-grid" data-testid="inspector"></div>
              </aside>
            </main>
          </div>

          <script id="scenario-data" type="application/json">{scenarios_json}</script>
          <script id="factor-data" type="application/json">{factor_rows_json}</script>
          <script id="casebook-data" type="application/json">{casebook_json}</script>
          <script>
            const scenarios = JSON.parse(document.getElementById("scenario-data").textContent);
            const factorRows = JSON.parse(document.getElementById("factor-data").textContent);
            const casebook = JSON.parse(document.getElementById("casebook-data").textContent);

            const state = {{
              queueFamily: "all",
              overload: "all",
              tier: "all",
              selectedScenarioId: scenarios[0]?.scenario_id ?? null,
            }};

            const body = document.body;
            const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            const applyReducedMotion = () => {{
              body.setAttribute("data-reduced-motion", reduceMotionQuery.matches ? "true" : "false");
            }};
            applyReducedMotion();
            if (typeof reduceMotionQuery.addEventListener === "function") {{
              reduceMotionQuery.addEventListener("change", applyReducedMotion);
            }}

            const familyFilter = document.getElementById("queue-family-filter");
            const overloadFilter = document.getElementById("overload-filter");
            const tierFilter = document.getElementById("tier-filter");
            const list = document.querySelector("[data-testid='scenario-list']");
            const ladder = document.querySelector("[data-testid='ladder']");
            const inspector = document.querySelector("[data-testid='inspector']");
            const factorBody = document.getElementById("factor-body");
            const suggestionBody = document.getElementById("suggestion-body");

            const families = [...new Set(scenarios.map((scenario) => scenario.queue_family))];
            for (const family of families) {{
              const option = document.createElement("option");
              option.value = family;
              option.textContent = family.replaceAll("_", " ");
              familyFilter.appendChild(option);
            }}

            function visibleScenarios() {{
              return scenarios.filter((scenario) => {{
                if (state.queueFamily !== "all" && scenario.queue_family !== state.queueFamily) return false;
                if (state.overload !== "all" && scenario.overload_state !== state.overload) return false;
                if (state.tier !== "all" && scenario.top_tier !== state.tier) return false;
                return true;
              }});
            }}

            function selectedScenario() {{
              const visible = visibleScenarios();
              if (!visible.some((scenario) => scenario.scenario_id === state.selectedScenarioId)) {{
                state.selectedScenarioId = visible[0]?.scenario_id ?? null;
              }}
              return visible.find((scenario) => scenario.scenario_id === state.selectedScenarioId) ?? null;
            }}

            function renderScenarioList() {{
              const visible = visibleScenarios();
              list.innerHTML = "";
              if (visible.length === 0) {{
                const empty = document.createElement("div");
                empty.className = "empty-state";
                empty.textContent = "No queue snapshots match the current filters.";
                list.appendChild(empty);
                return;
              }}
              visible.forEach((scenario, index) => {{
                const button = document.createElement("button");
                button.type = "button";
                button.className = "scenario-card";
                button.dataset.testid = `scenario-card-${{scenario.scenario_id}}`;
                button.dataset.selected = String(scenario.scenario_id === state.selectedScenarioId);
                button.dataset.index = String(index);
                button.innerHTML = `
                  <div class="scenario-meta">
                    <span>${{scenario.queue_label}}</span>
                    <span class="${{scenario.overload_state === "overload_critical" ? "accent-overload" : "accent-fairness"}}">${{scenario.overload_state.replaceAll("_", " ")}}</span>
                  </div>
                  <div class="scenario-title">${{scenario.scenario_id.replaceAll("_", " ")}}</div>
                  <p class="scenario-summary">${{scenario.summary}}</p>
                `;
                button.addEventListener("click", () => {{
                  state.selectedScenarioId = scenario.scenario_id;
                  render();
                }});
                button.addEventListener("keydown", (event) => {{
                  const visibleCards = [...document.querySelectorAll(".scenario-card")];
                  const currentIndex = visibleCards.indexOf(button);
                  if (event.key === "ArrowDown") {{
                    event.preventDefault();
                    const next = visibleCards[Math.min(visibleCards.length - 1, currentIndex + 1)];
                    if (next) {{
                      state.selectedScenarioId = next.dataset.testid.replace("scenario-card-", "");
                      render();
                      next.focus();
                    }}
                  }}
                  if (event.key === "ArrowUp") {{
                    event.preventDefault();
                    const previous = visibleCards[Math.max(0, currentIndex - 1)];
                    if (previous) {{
                      state.selectedScenarioId = previous.dataset.testid.replace("scenario-card-", "");
                      render();
                      previous.focus();
                    }}
                  }}
                }});
                list.appendChild(button);
              }});
            }}

            function renderLadder(scenario) {{
              const rows = factorRows.filter((row) => row.scenario_id === scenario.scenario_id);
              ladder.innerHTML = "";
              rows.forEach((row) => {{
                const wrapper = document.createElement("div");
                wrapper.className = "ladder-row";
                wrapper.dataset.testid = `ladder-row-${{row.task_ref}}`;
                const urgencyWidth = Math.max(10, Math.round(Number(row.within_tier_urgency) * 100));
                wrapper.innerHTML = `
                  <div class="ladder-rank">#${{row.ordinal}}</div>
                  <div class="ladder-track"><div class="ladder-fill" style="width:${{urgencyWidth}}%"></div></div>
                  <div class="ladder-flags">${{row.task_ref}} · ${{row.lexicographic_tier}} · ${{row.eligibility_state}}</div>
                `;
                ladder.appendChild(wrapper);
              }});
              document.querySelector("[data-testid='ladder-parity']").textContent =
                `${{rows.length}} visible rank rows`;
              document.querySelector("[data-testid='ladder-textual-parity']").textContent =
                `The committed row-order hash for this scenario is ${{scenario.row_order_hash}}. Browser-local resort is forbidden.`;
            }}

            function renderFairness(scenario) {{
              const rows = factorRows.filter((row) => row.scenario_id === scenario.scenario_id);
              const target = document.querySelector("[data-testid='fairness-ribbon']");
              target.innerHTML = "";
              rows.forEach((row) => {{
                const chip = document.createElement("div");
                chip.className = "fairness-chip";
                chip.innerHTML = `
                  <div>
                    <strong>${{row.fairness_band_ref}}</strong>
                    <span>${{row.eligibility_state === "eligible" ? "routine merge visible" : "held outside routine queue"}}</span>
                  </div>
                  <span class="${{scenario.overload_state === "overload_critical" ? "accent-overload" : "accent-fairness"}}">
                    ${{row.fairness_credit_before}} → ${{row.fairness_credit_after}}
                  </span>
                `;
                target.appendChild(chip);
              }});
              document.querySelector("[data-testid='fairness-parity']").textContent =
                scenario.overload_state === "overload_critical"
                  ? "fairness promises suppressed"
                  : "fairness merge active";
              document.querySelector("[data-testid='fairness-textual-parity']").textContent =
                `Fairness cycle ref: ${{scenario.fairness_cycle_state_ref}}. Reviewer-fit stays downstream of canonical order.`;
            }}

            function renderInspector(scenario) {{
              inspector.innerHTML = `
                <dl class="kv">
                  <dt>Scenario</dt><dd>${{scenario.scenario_id}}</dd>
                  <dt>Queue family</dt><dd>${{scenario.queue_family}}</dd>
                  <dt>Queue ref</dt><dd><code>${{scenario.queue_ref}}</code></dd>
                  <dt>Overload</dt><dd>${{scenario.overload_state}}</dd>
                  <dt>Top tier</dt><dd>${{scenario.top_tier}}</dd>
                  <dt>Plan hash</dt><dd><code>${{scenario.plan_hash}}</code></dd>
                  <dt>Row hash</dt><dd><code>${{scenario.row_order_hash}}</code></dd>
                  <dt>Held rows</dt><dd>${{scenario.held_task_refs.length ? scenario.held_task_refs.join(", ") : "None"}}</dd>
                  <dt>Auto-claim</dt><dd>${{scenario.governed_auto_claim_refs.length ? scenario.governed_auto_claim_refs.join(", ") : "None"}}</dd>
                </dl>
                <p>${{scenario.summary}}</p>
              `;
            }}

            function renderFactorTable(scenario) {{
              const rows = factorRows.filter((row) => row.scenario_id === scenario.scenario_id);
              factorBody.innerHTML = rows.map((row) => `
                <tr data-testid="factor-row-${{row.task_ref}}">
                  <td>${{row.ordinal}}</td>
                  <td><code>${{row.task_ref}}</code></td>
                  <td>${{row.lexicographic_tier}}</td>
                  <td>${{row.eligibility_state}}</td>
                  <td>${{row.within_tier_urgency}}</td>
                  <td><span class="accent-fairness">${{row.fairness_credit_before}} → ${{row.fairness_credit_after}}</span></td>
                </tr>
              `).join("");
              document.querySelector("[data-testid='factor-parity']").textContent =
                `${{rows.length}} factor rows bound to one snapshot`;
            }}

            function renderSuggestionTable(scenario) {{
              const caseRow = casebook.cases.find((item) => item.scenario_id === scenario.scenario_id);
              if (!caseRow) {{
                suggestionBody.innerHTML = '<tr><td colspan="4" class="empty-state">No downstream suggestion window is published for this snapshot.</td></tr>';
                document.querySelector("[data-testid='suggestion-parity']").textContent = "No suggestion window";
                return;
              }}
              suggestionBody.innerHTML = caseRow.suggestion_rows.map((row) => `
                <tr data-testid="suggestion-row-${{row.task_ref}}">
                  <td>${{row.ordinal}}</td>
                  <td><code>${{row.task_ref}}</code></td>
                  <td>${{row.reviewer_ref}}</td>
                  <td>${{row.suggestion_score.toFixed(3)}}</td>
                </tr>
              `).join("");
              document.querySelector("[data-testid='suggestion-parity']").textContent =
                `${{caseRow.candidate_window_size}}-row candidate window`;
            }}

            function render() {{
              renderScenarioList();
              const scenario = selectedScenario();
              if (!scenario) {{
                ladder.innerHTML = "";
                inspector.innerHTML = '<div class="empty-state">Select a visible scenario.</div>';
                factorBody.innerHTML = "";
                suggestionBody.innerHTML = "";
                return;
              }}
              renderLadder(scenario);
              renderFairness(scenario);
              renderInspector(scenario);
              renderFactorTable(scenario);
              renderSuggestionTable(scenario);
            }}

            familyFilter.addEventListener("change", (event) => {{
              state.queueFamily = event.target.value;
              render();
            }});
            overloadFilter.addEventListener("change", (event) => {{
              state.overload = event.target.value;
              render();
            }});
            tierFilter.addEventListener("change", (event) => {{
              state.tier = event.target.value;
              render();
            }});

            render();
          </script>
        </body>
        </html>
        """
    ).strip()


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "73_queue_rank_explanation_studio.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "queue_rank_plan_manifest.json");
        const FACTOR_MATRIX_PATH = path.join(ROOT, "data", "analysis", "queue_rank_entry_factor_matrix.csv");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "assignment_suggestion_casebook.json");

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
        const FACTOR_ROWS = fs.readFileSync(FACTOR_MATRIX_PATH, "utf8").trim().split(/\\r?\\n/).slice(1);

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/73_queue_rank_explanation_studio.html"
                  : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(ROOT, safePath);
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Not found");
                return;
              }
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : filePath.endsWith(".json")
                  ? "application/json; charset=utf-8"
                  : filePath.endsWith(".csv")
                    ? "text/csv; charset=utf-8"
                    : "text/plain; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4373, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing studio HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
          const url =
            process.env.QUEUE_RANK_STUDIO_URL ??
            "http://127.0.0.1:4373/docs/architecture/73_queue_rank_explanation_studio.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='queue-family-filter']").waitFor();
            await page.locator("[data-testid='overload-filter']").waitFor();
            await page.locator("[data-testid='tier-filter']").waitFor();
            await page.locator("[data-testid='ladder']").waitFor();
            await page.locator("[data-testid='fairness-ribbon']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='factor-table']").waitFor();
            await page.locator("[data-testid='suggestion-table']").waitFor();

            const initialCards = await page.locator(".scenario-card").count();
            assertCondition(
              initialCards === MANIFEST.summary.scenario_count,
              `Expected ${MANIFEST.summary.scenario_count} scenario cards, found ${initialCards}.`,
            );

            await page.locator("[data-testid='queue-family-filter']").selectOption("triage_primary");
            const triageCards = await page.locator(".scenario-card").count();
            assertCondition(triageCards === 4, `Expected 4 triage cards, found ${triageCards}.`);

            await page.locator("[data-testid='overload-filter']").selectOption("overload_critical");
            const overloadCards = await page.locator(".scenario-card").count();
            assertCondition(overloadCards === 1, `Expected 1 overload card, found ${overloadCards}.`);

            await page.locator("[data-testid='overload-filter']").selectOption("all");
            await page.locator("[data-testid='tier-filter']").selectOption("critical");
            const criticalCards = await page.locator(".scenario-card").count();
            assertCondition(criticalCards === 3, `Expected 3 critical-tier cards, found ${criticalCards}.`);

            await page.locator("[data-testid='tier-filter']").selectOption("all");
            await page.locator("[data-testid='scenario-card-queue_reviewer_window']").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("queue_reviewer_window") &&
                inspectorText.includes("task_suggest_escalated") &&
                inspectorText.includes("queue-row-order::073e5f9cdeff00112233445566778899"),
              "Inspector lost scenario selection synchronization.",
            );

            const suggestionRows = await page.locator("[data-testid^='suggestion-row-']").count();
            assertCondition(suggestionRows === 3, `Expected 3 suggestion rows, found ${suggestionRows}.`);
            const factorRows = await page.locator("[data-testid^='factor-row-']").count();
            assertCondition(factorRows === 3, `Expected 3 factor rows, found ${factorRows}.`);

            await page.locator("[data-testid='scenario-card-queue_triage_nominal']").focus();
            await page.keyboard.press("ArrowDown");
            const selected = await page
              .locator("[data-testid='scenario-card-queue_triage_overload']")
              .getAttribute("data-selected");
            assertCondition(selected === "true", "ArrowDown did not advance to the next visible scenario.");

            const ladderParity = await page.locator("[data-testid='ladder-parity']").textContent();
            assertCondition(
              ladderParity.includes("3 visible rank rows"),
              "Ladder parity text drifted.",
            );
            assertCondition(
              FACTOR_ROWS.length === MANIFEST.summary.factor_row_count,
              "Factor matrix row count drifted from manifest summary.",
            );
            assertCondition(
              CASEBOOK.summary.case_count === 2,
              "Suggestion casebook summary drifted.",
            );

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
          } finally {
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const queueRankExplanationStudioManifest = {
          task: MANIFEST.task_id,
          scenarios: MANIFEST.summary.scenario_count,
          coverage: [
            "queue-family and tier filtering",
            "row and card selection synchronization",
            "diagram and table parity",
            "keyboard navigation",
            "reduced motion",
            "responsive layout",
          ],
        };
        """
    ).strip()


def main() -> None:
    patch_package_index()
    patch_public_api_test()
    patch_package_json()
    patch_playwright_package_json()

    write_json(MANIFEST_PATH, build_manifest())
    write_csv(FACTOR_MATRIX_PATH, FACTOR_ROWS)
    write_json(CASEBOOK_PATH, SUGGESTION_CASEBOOK)
    write_text(DESIGN_DOC_PATH, build_design_doc())
    write_text(RULES_DOC_PATH, build_rules_doc())
    write_text(STUDIO_PATH, build_studio_html())
    write_text(SPEC_PATH, build_spec())

    for path, payload in build_schema_payloads().items():
      write_json(path, payload)

    print(
        "par_073 queue-ranking artifacts generated: "
        "manifest, factor matrix, suggestion casebook, studio, spec, and schema pack"
    )


if __name__ == "__main__":
    main()
