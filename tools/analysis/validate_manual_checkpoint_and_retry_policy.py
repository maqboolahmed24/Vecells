#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
TOOLS_DIR = ROOT / "tools" / "browser-automation"
SHARED_DIR = TOOLS_DIR / "shared"

CHECKPOINT_CSV_PATH = DATA_DIR / "manual_approval_checkpoints.csv"
RETRY_MATRIX_JSON_PATH = DATA_DIR / "browser_automation_retry_matrix.json"
IDEMPOTENCY_RULES_CSV_PATH = DATA_DIR / "provider_portal_action_idempotency_rules.csv"
LIVE_GATE_RULES_JSON_PATH = DATA_DIR / "live_mutation_gate_rules.json"

CHECKPOINT_DOC_PATH = DOCS_DIR / "39_manual_approval_checkpoint_register.md"
RETRY_DOC_PATH = DOCS_DIR / "39_browser_automation_retry_policy.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "39_live_mutation_gate_policy.md"
CONTROL_TOWER_HTML_PATH = DOCS_DIR / "39_provider_portal_control_tower.html"

CHECKPOINT_MODEL_JS_PATH = SHARED_DIR / "provider_checkpoint_model.js"
ACTION_GUARD_JS_PATH = SHARED_DIR / "provider_action_guard.js"

EXPECTED_RETRY_COUNTS = {
    "safe_read_retry_count": 3,
    "resume_from_checkpoint_only_count": 7,
    "human_review_before_continue_count": 4,
    "capture_evidence_then_stop_count": 3,
    "never_auto_repeat_count": 4,
    "secrets_redacted_only_count": 2,
}

REQUIRED_LIVE_GATE_INPUTS = {
    "named_approver",
    "environment_target",
    "evidence_bundle_ref",
    "evidence_freshness_days",
    "live_mutation_flag",
}

HTML_MARKERS = [
    'data-testid="tower-shell"',
    'data-testid="rail"',
    'data-testid="register"',
    'data-testid="retry-matrix"',
    'data-testid="inspector"',
    'data-testid="live-gate-strip"',
    'data-testid="filter-family"',
    'data-testid="filter-action-class"',
    'data-testid="filter-live-gate"',
    'data-testid="sort-idempotency"',
    'data-testid="sort-evidence"',
    'data-testid="parity-table"',
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        CHECKPOINT_CSV_PATH,
        RETRY_MATRIX_JSON_PATH,
        IDEMPOTENCY_RULES_CSV_PATH,
        LIVE_GATE_RULES_JSON_PATH,
        CHECKPOINT_DOC_PATH,
        RETRY_DOC_PATH,
        LIVE_GATE_DOC_PATH,
        CONTROL_TOWER_HTML_PATH,
        CHECKPOINT_MODEL_JS_PATH,
        ACTION_GUARD_JS_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_039 deliverables:\n" + "\n".join(missing))


def validate_retry_matrix() -> dict[str, Any]:
    payload = load_json(RETRY_MATRIX_JSON_PATH)
    assert_true(payload["task_id"] == "seq_039", "Retry matrix task id drifted")
    assert_true(payload["visual_mode"] == "Provider_Control_Tower", "Retry matrix visual mode drifted")
    summary = payload["summary"]
    assert_true(summary["checkpoint_count"] == 23, "Checkpoint count drifted")
    assert_true(summary["retry_class_count"] == 6, "Retry-class count drifted")
    for key, value in EXPECTED_RETRY_COUNTS.items():
        assert_true(summary[key] == value, f"Retry count drifted for {key}")
    assert_true(summary["blocked_action_count"] == 12, "Blocked action count drifted")
    assert_true(summary["review_required_action_count"] == 8, "Review-required action count drifted")
    assert_true(summary["pass_action_count"] == 3, "Pass action count drifted")

    class_ids = {row["class_id"] for row in payload["retry_classes"]}
    assert_true(
        class_ids
        == {
            "safe_read_retry",
            "resume_from_checkpoint_only",
            "human_review_before_continue",
            "capture_evidence_then_stop",
            "never_auto_repeat",
            "secrets_redacted_only",
        },
        "Retry-class set drifted",
    )

    action_rows = payload["action_rows"]
    assert_true(len(action_rows) == 23, "Action-row count drifted")
    action_ids = {row["action_key"] for row in action_rows}
    assert_true(len(action_ids) == 23, "Action keys lost uniqueness")
    return payload


def validate_checkpoint_csv(retry_matrix: dict[str, Any]) -> list[dict[str, str]]:
    rows = load_csv(CHECKPOINT_CSV_PATH)
    assert_true(len(rows) == retry_matrix["summary"]["checkpoint_count"], "Checkpoint CSV row count drifted")
    csv_action_ids = {row["action_key"] for row in rows}
    matrix_action_ids = {row["action_key"] for row in retry_matrix["action_rows"]}
    assert_true(csv_action_ids == matrix_action_ids, "Checkpoint CSV action ids drifted from retry matrix")
    return rows


def validate_idempotency_rules(retry_matrix: dict[str, Any]) -> None:
    rows = load_csv(IDEMPOTENCY_RULES_CSV_PATH)
    assert_true(len(rows) == retry_matrix["summary"]["checkpoint_count"], "Idempotency rule row count drifted")

    rows_by_action = {row["action_key"]: row for row in rows}
    for action in retry_matrix["action_rows"]:
        rule = rows_by_action[action["action_key"]]
        assert_true(rule["retry_class"] == action["retry_class"], f"Retry class drifted for {action['action_key']}")

        if rule["idempotency_class"] == "read_only":
            assert_true(rule["retry_class"] == "safe_read_retry", f"Read-only action lost safe retry posture: {action['action_key']}")
            assert_true(rule["blind_resubmit_allowed"] == "yes", f"Read-only action lost blind-read posture: {action['action_key']}")
        elif rule["idempotency_class"] == "draft_resume_safe":
            assert_true(
                rule["retry_class"] == "resume_from_checkpoint_only",
                f"Draft-resume action lost checkpoint-only retry posture: {action['action_key']}",
            )
            assert_true(rule["blind_resubmit_allowed"] == "no", f"Draft-resume action became blind-resubmittable: {action['action_key']}")
        else:
            assert_true(rule["blind_resubmit_allowed"] == "no", f"Non-idempotent action became blind-resubmittable: {action['action_key']}")
            assert_true(
                rule["retry_class"]
                in {
                    "human_review_before_continue",
                    "capture_evidence_then_stop",
                    "never_auto_repeat",
                    "secrets_redacted_only",
                },
                f"Non-idempotent action lost safe stop posture: {action['action_key']}",
            )

        if rule["retry_class"] == "never_auto_repeat":
            assert_true(rule["max_auto_retries"] == "0", f"Never-repeat action gained auto retries: {action['action_key']}")
            assert_true(
                rule["human_confirmation_before_mutation"] == "yes",
                f"Never-repeat action lost human confirmation: {action['action_key']}",
            )


def validate_live_gate_rules() -> dict[str, Any]:
    payload = load_json(LIVE_GATE_RULES_JSON_PATH)
    assert_true(payload["task_id"] == "seq_039", "Live gate rules task id drifted")
    assert_true(payload["visual_mode"] == "Provider_Control_Tower", "Live gate rules visual mode drifted")
    summary = payload["summary"]
    assert_true(summary["provider_profile_count"] == 10, "Provider profile count drifted")
    assert_true(summary["blocked_gate_count"] == 57, "Blocked gate total drifted")
    assert_true(summary["review_gate_count"] == 36, "Review gate total drifted")
    assert_true(summary["pass_gate_count"] == 13, "Pass gate total drifted")

    profiles = payload["provider_profiles"]
    assert_true(len(profiles) == 10, "Live gate provider profile count drifted")
    for profile in profiles:
        required_inputs = set(profile["required_gate_inputs"])
        assert_true(
            REQUIRED_LIVE_GATE_INPUTS.issubset(required_inputs),
            f"Provider profile lost required live-gate inputs: {profile['provider_family']}",
        )
        env_bindings = profile["env_bindings"]
        assert_true("named_approver" in env_bindings, f"Named approver env binding missing: {profile['provider_family']}")
        assert_true("environment_target" in env_bindings, f"Environment env binding missing: {profile['provider_family']}")
        assert_true("live_mutation_flag" in env_bindings, f"Live flag env binding missing: {profile['provider_family']}")
        assert_true(profile["max_evidence_age_days"] > 0, f"Evidence freshness window missing: {profile['provider_family']}")
        for harness_path in profile["dry_run_harnesses"]:
            assert_true(Path(harness_path).exists(), f"Referenced harness is missing: {harness_path}")
    return payload


def validate_docs_and_html() -> None:
    for path in [CHECKPOINT_DOC_PATH, RETRY_DOC_PATH, LIVE_GATE_DOC_PATH]:
        text = path.read_text()
        assert_true("Mock_now_execution" in text, f"{path.name} lost Mock_now_execution section")
        assert_true("Actual_provider_strategy_later" in text, f"{path.name} lost Actual_provider_strategy_later section")

    html = CONTROL_TOWER_HTML_PATH.read_text()
    assert_true("Provider Control Tower" in html, "Control tower title drifted")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Missing HTML marker: {marker}")
    assert_true("safe_read_retry" in html, "Control tower lost retry chips")
    assert_true("Read → Fill → Review → Commit → Verify" in html, "Control tower lost ladder heading")


def validate_shared_modules() -> None:
    model_text = CHECKPOINT_MODEL_JS_PATH.read_text()
    guard_text = ACTION_GUARD_JS_PATH.read_text()

    assert_true("export function getCheckpointRule" in model_text, "Checkpoint model lost getCheckpointRule export")
    assert_true("export function nextRetryClassDecision" in model_text, "Checkpoint model lost retry decision export")
    assert_true("export function buildLiveMutationContext" in guard_text, "Action guard lost buildLiveMutationContext export")
    assert_true("export function assertProviderActionAllowed" in guard_text, "Action guard lost assertProviderActionAllowed export")
    assert_true("export function nextRetryDecision" in guard_text, "Action guard lost nextRetryDecision export")


def main() -> None:
    ensure_deliverables()
    retry_matrix = validate_retry_matrix()
    validate_checkpoint_csv(retry_matrix)
    validate_idempotency_rules(retry_matrix)
    validate_live_gate_rules()
    validate_docs_and_html()
    validate_shared_modules()
    print("seq_039 validation passed")


if __name__ == "__main__":
    main()
