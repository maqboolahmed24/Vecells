#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-telephony-lab"
SERVICE_DIR = ROOT / "services" / "mock-telephony-carrier"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "vendor_shortlist": DATA_DIR / "31_vendor_shortlist.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
}

DELIVERABLES = [
    DATA_DIR / "32_telephony_lab_pack.json",
    DATA_DIR / "32_telephony_field_map.json",
    DATA_DIR / "32_local_test_number_inventory.csv",
    DATA_DIR / "32_telephony_webhook_matrix.csv",
    DATA_DIR / "32_telephony_live_gate_checklist.json",
    DOCS_DIR / "32_local_telephony_lab_spec.md",
    DOCS_DIR / "32_telephony_account_and_number_field_map.md",
    DOCS_DIR / "32_telephony_live_gate_and_spend_controls.md",
    DOCS_DIR / "32_telephony_webhook_and_recording_config_strategy.md",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "telephonyLabPack.ts",
    APP_DIR / "public" / "telephony-lab-pack.json",
    SERVICE_DIR / "README.md",
    SERVICE_DIR / "package.json",
    SERVICE_DIR / "src" / "carrierCore.js",
    SERVICE_DIR / "src" / "server.js",
    TESTS_DIR / "mock-telephony-lab.spec.js",
    TESTS_DIR / "mock-telephony-call-flow.spec.js",
    BROWSER_AUTOMATION_DIR / "telephony-account-and-number-dry-run.spec.js",
    ROOT / "tools" / "analysis" / "build_telephony_lab_pack.py",
]

EXPECTED_GUIDANCE_IDS = {
    "twilio_api_keys_overview",
    "twilio_subaccounts",
    "twilio_webhooks_security",
    "twilio_incoming_phone_numbers",
    "twilio_available_phone_numbers",
    "twilio_recordings_resource",
    "twilio_voice_pricing_gb",
    "vonage_voice_getting_started",
    "vonage_application_api_overview",
    "vonage_webhooks",
    "vonage_numbers_api",
    "vonage_pricing",
}

EXPECTED_VENDOR_IDS = {"twilio_telephony_ivr", "vonage_telephony_ivr"}

EXPECTED_SECRET_ROWS = {
    "ACC_TEL_LOCAL_SIM_PRINCIPAL",
    "SEC_TEL_LOCAL_WEBHOOK",
    "NUM_TEL_SHARED_DEV_TEST_RANGE",
    "DATA_TEL_SHARED_DEV_FIXTURES",
    "ACC_TELEPHONY_PREPROD_PRINCIPAL",
    "SEC_TELEPHONY_PREPROD_WEBHOOK",
    "NUM_TELEPHONY_PRODUCTION_RANGE",
}

EXPECTED_NUMBER_IDS = {
    "NUM_TEL_FRONTDOOR_GENERAL",
    "NUM_TEL_FRONTDOOR_URGENT",
    "NUM_TEL_CALLBACK_OUTBOUND",
    "NUM_TEL_SUPPORT_REPAIR",
    "NUM_TEL_CONTINUATION_SMS",
    "NUM_TEL_DUAL_CONTINUITY",
    "NUM_TEL_PROVIDER_TWILIO",
    "NUM_TEL_PROVIDER_VONAGE",
    "NUM_TEL_RECORDING_DEGRADED",
    "NUM_TEL_OUTBOUND_ESCALATION",
}

EXPECTED_SCENARIO_IDS = {
    "inbound_standard_continuation",
    "urgent_live_preemption",
    "recording_missing_manual_review",
    "webhook_signature_retry",
    "outbound_callback_settled",
    "provider_like_vonage_disorder",
}

EXPECTED_LIVE_GATES = {
    "TEL_LIVE_GATE_PHASE0_EXTERNAL_READY",
    "TEL_LIVE_GATE_VENDOR_APPROVED",
    "TEL_LIVE_GATE_WORKSPACE_OWNERSHIP",
    "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK",
    "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED",
    "TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY",
    "TEL_LIVE_GATE_NAMED_APPROVER",
    "TEL_LIVE_GATE_ENVIRONMENT_TARGET",
    "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS",
    "TEL_LIVE_GATE_FINAL_POSTURE",
}

EXPECTED_ENV_VARS = {
    "TELEPHONY_VENDOR_ID",
    "TELEPHONY_NAMED_APPROVER",
    "TELEPHONY_TARGET_ENVIRONMENT",
    "TELEPHONY_CALLBACK_BASE_URL",
    "TELEPHONY_RECORDING_POLICY_REF",
    "TELEPHONY_NUMBER_PROFILE_REF",
    "TELEPHONY_SPEND_CAP_GBP",
    "TELEPHONY_WEBHOOK_SECRET_REF",
    "ALLOW_REAL_PROVIDER_MUTATION",
    "ALLOW_SPEND",
}

DOC_MARKERS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="telephony-shell"',
    'data-testid="number-rail"',
    'data-testid="flow-editor"',
    'data-testid="event-stream"',
    'data-testid="inspector-panel"',
    'data-testid="mode-toggle-actual"',
    'data-testid="actual-submit-button"',
    "Voice Fabric Lab",
    "Real account or number creation blocked",
]

SERVICE_MARKERS = [
    'data-testid="telephony-sandbox-shell"',
    'data-testid="simulate-button"',
    'data-testid="call-json"',
    "MOCK_TELEPHONY_SANDBOX",
    "/api/calls/simulate",
    "/api/health",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_032 prerequisites: " + ", ".join(sorted(missing)))
    inputs = {
        "phase0_gate_verdict": load_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "coverage_summary": load_json(REQUIRED_INPUTS["coverage_summary"]),
        "integration_priority_matrix": load_json(REQUIRED_INPUTS["integration_priority_matrix"]),
        "vendor_shortlist": load_json(REQUIRED_INPUTS["vendor_shortlist"]),
        "external_account_inventory": load_csv(REQUIRED_INPUTS["external_account_inventory"]),
    }
    assert_true(
        inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream.",
    )
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_032 expects Phase 0 to remain withheld.",
    )
    return inputs


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_032 deliverables:\n" + "\n".join(missing))


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "32_telephony_lab_pack.json")
    field_map = load_json(DATA_DIR / "32_telephony_field_map.json")
    number_rows = load_csv(DATA_DIR / "32_local_test_number_inventory.csv")
    webhook_rows = load_csv(DATA_DIR / "32_telephony_webhook_matrix.csv")
    live_gate_pack = load_json(DATA_DIR / "32_telephony_live_gate_checklist.json")

    assert_true(pack["task_id"] == "seq_032", "Task id drifted.")
    assert_true(pack["visual_mode"] == "Voice_Fabric_Lab", "Visual mode drifted.")
    assert_true(pack["phase0_verdict"] == "withheld", "Phase 0 verdict drifted.")
    assert_true(pack["summary"]["number_count"] == 10, "Number count drifted.")
    assert_true(pack["summary"]["field_count"] == 33, "Field count drifted.")
    assert_true(pack["summary"]["webhook_row_count"] == 10, "Webhook row count drifted.")
    assert_true(pack["summary"]["recording_policy_count"] == 4, "Recording-policy count drifted.")
    assert_true(pack["summary"]["ivr_profile_count"] == 4, "IVR profile count drifted.")
    assert_true(pack["summary"]["live_gate_count"] == 10, "Live-gate count drifted.")
    assert_true(pack["summary"]["blocked_live_gate_count"] == 5, "Blocked live-gate count drifted.")
    assert_true(pack["summary"]["review_live_gate_count"] == 4, "Review live-gate count drifted.")
    assert_true(pack["summary"]["pass_live_gate_count"] == 1, "Pass live-gate count drifted.")
    assert_true(pack["summary"]["scenario_count"] == 6, "Scenario count drifted.")
    assert_true(pack["summary"]["seeded_call_count"] == 6, "Seeded-call count drifted.")
    assert_true(pack["summary"]["selected_secret_count"] == 7, "Selected secret count drifted.")
    assert_true(pack["summary"]["selected_vendor_count"] == 2, "Selected vendor count drifted.")
    assert_true(pack["summary"]["selected_risk_count"] == 6, "Selected risk count drifted.")
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == pack["phase0_verdict"],
        "Phase-0 verdict no longer matches the gating baseline.",
    )

    assert_true(pack["mock_service"]["ports"]["carrier"] == 4180, "Carrier port drifted.")
    assert_true(pack["mock_service"]["ports"]["lab_preview"] == 4181, "Lab preview port drifted.")
    assert_true(pack["mock_service"]["base_url_default"] == "http://127.0.0.1:4180", "Base URL drifted.")

    guidance_ids = {row["source_id"] for row in pack["official_vendor_guidance"]}
    assert_true(guidance_ids == EXPECTED_GUIDANCE_IDS, "Official vendor guidance coverage drifted.")

    shortlisted_vendor_ids = {row["vendor_id"] for row in pack["shortlisted_vendors"]}
    assert_true(shortlisted_vendor_ids == EXPECTED_VENDOR_IDS, "Shortlisted vendor ids drifted.")
    assert_true(
        shortlisted_vendor_ids
        == {
            row["vendor_id"]
            for row in inputs["vendor_shortlist"]["shortlist_by_family"]["telephony_ivr"]
        },
        "seq_031 shortlist no longer matches seq_032 vendor gating.",
    )

    selected_secret_ids = {row["account_or_secret_id"] for row in pack["selected_secret_rows"]}
    assert_true(selected_secret_ids == EXPECTED_SECRET_ROWS, "Selected telephony secret rows drifted.")
    assert_true(
        selected_secret_ids.issubset({row["account_or_secret_id"] for row in inputs["external_account_inventory"]}),
        "Selected telephony secret rows no longer exist in the external account inventory.",
    )

    assert_true(field_map["summary"]["field_count"] == 33, "Field-map count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["shared"] == 10, "Shared-field count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["Twilio"] == 11, "Twilio-field count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["Vonage"] == 12, "Vonage-field count drifted.")
    assert_true(field_map["summary"]["live_required_count"] == 29, "Live-required field count drifted.")
    assert_true(field_map["summary"]["mock_required_count"] == 7, "Mock-required field count drifted.")
    assert_true(len(field_map["fields"]) == 33, "Field rows drifted.")
    assert_true(
        any(row["field_id"] == "FLD_SHARED_ALLOW_MUTATION" for row in field_map["fields"]),
        "Live mutation gate field is missing.",
    )
    assert_true(
        any(row["field_id"] == "FLD_TWILIO_API_KEY_REF" for row in field_map["fields"]),
        "Twilio API-key field is missing.",
    )
    assert_true(
        any(row["field_id"] == "FLD_VONAGE_APPLICATION_ID" for row in field_map["fields"]),
        "Vonage application field is missing.",
    )

    number_ids = {row["number_id"] for row in number_rows}
    assert_true(number_ids == EXPECTED_NUMBER_IDS, "Number inventory coverage drifted.")
    assert_true(len(number_rows) == 10, "Number inventory row count drifted.")
    assert_true(
        any(row["number_id"] == "NUM_TEL_DUAL_CONTINUITY" and row["sms_enabled"] == "yes" for row in number_rows),
        "Dual continuity number lost SMS capability.",
    )
    assert_true(
        any(
            row["number_id"] == "NUM_TEL_FRONTDOOR_URGENT"
            and row["urgent_preemption_mode"] == "immediate_urgent_live_branch"
            for row in number_rows
        ),
        "Urgent front-door number lost immediate preemption posture.",
    )

    assert_true(len(webhook_rows) == 10, "Webhook matrix row count drifted.")
    for row in webhook_rows:
        note = row["authoritative_truth_note"].lower()
        assert_true(
            any(
                phrase in note
                for phrase in [
                    "never implies evidence ready",
                    "transport",
                    "weaker than",
                    "derivations",
                    "does not prove",
                    "do not establish",
                    "after adapter validation",
                    "until vecells settlement occurs",
                    "not request completion",
                    "canonical events only",
                ]
            ),
            f"Webhook row {row['webhook_row_id']} lost transport-vs-truth separation.",
        )
    assert_true(
        any(row["webhook_row_id"] == "HOOK_TWILIO_VOICE_URL" for row in webhook_rows),
        "Twilio status callback coverage drifted.",
    )
    assert_true(
        any(row["webhook_row_id"] == "HOOK_VONAGE_RECORD_EVENT" for row in webhook_rows),
        "Vonage recording callback coverage drifted.",
    )

    assert_true(live_gate_pack["task_id"] == "seq_032", "Live-gate task id drifted.")
    assert_true(live_gate_pack["phase0_verdict"] == "withheld", "Live-gate Phase 0 verdict drifted.")
    assert_true(live_gate_pack["current_creation_posture"] == "blocked", "Creation posture drifted.")
    assert_true(live_gate_pack["current_spend_posture"] == "blocked", "Spend posture drifted.")
    assert_true(live_gate_pack["summary"]["live_gate_count"] == 10, "Live-gate summary drifted.")
    assert_true(live_gate_pack["summary"]["blocked_count"] == 5, "Blocked live-gate summary drifted.")
    assert_true(live_gate_pack["summary"]["review_required_count"] == 4, "Review live-gate summary drifted.")
    assert_true(live_gate_pack["summary"]["pass_count"] == 1, "Pass live-gate summary drifted.")
    assert_true(
        set(live_gate_pack["required_env"]) == EXPECTED_ENV_VARS,
        "Required live env vars drifted.",
    )
    assert_true(
        set(live_gate_pack["allowed_vendor_ids"]) == EXPECTED_VENDOR_IDS,
        "Allowed live vendors drifted.",
    )
    assert_true(
        {row["gate_id"] for row in live_gate_pack["live_gates"]} == EXPECTED_LIVE_GATES,
        "Live-gate coverage drifted.",
    )
    assert_true(
        live_gate_pack["selector_map"]["base_profile"]["final_submit"]
        == "[data-testid='actual-submit-button']",
        "Final submit selector drifted.",
    )
    assert_true(
        set(live_gate_pack["official_label_checks"].keys())
        == {
            "twilio_subaccounts",
            "twilio_webhooks",
            "twilio_number_pricing",
            "vonage_voice_getting_started",
            "vonage_webhooks",
            "vonage_numbers_api",
        },
        "Official label checks drifted.",
    )

    scenario_ids = {row["scenario_id"] for row in pack["call_scenarios"]}
    assert_true(scenario_ids == EXPECTED_SCENARIO_IDS, "Call-scenario coverage drifted.")
    assert_true(len(pack["seeded_calls"]) == 6, "Seeded-call payload drifted.")
    assert_true(
        any(row["scenario_id"] == "urgent_live_preemption" and row["status"] == "closed" for row in pack["seeded_calls"]),
        "Urgent live seeded call drifted.",
    )
    assert_true(
        any(row["scenario_id"] == "recording_missing_manual_review" and row["status"] == "manual_audio_review_required" for row in pack["seeded_calls"]),
        "Recording-missing seeded call drifted.",
    )

    for markdown_path in [
        DOCS_DIR / "32_local_telephony_lab_spec.md",
        DOCS_DIR / "32_telephony_account_and_number_field_map.md",
        DOCS_DIR / "32_telephony_live_gate_and_spend_controls.md",
        DOCS_DIR / "32_telephony_webhook_and_recording_config_strategy.md",
    ]:
        content = markdown_path.read_text()
        for marker in DOC_MARKERS:
            assert_true(marker in content, f"{markdown_path.name} lost marker {marker}")

    app = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app, f"App lost marker {marker}")

    styles = (APP_DIR / "src" / "styles.css").read_text()
    for token in [
        "--canvas:",
        "--primary:",
        "--voice:",
        ".voice-shell",
        ".workspace-grid",
        ".diagram-line",
    ]:
        assert_true(token in styles, f"Styles lost token {token}")

    service = (SERVICE_DIR / "src" / "server.js").read_text()
    for marker in SERVICE_MARKERS:
        assert_true(marker in service, f"Service lost marker {marker}")

    for js_path in [
        TESTS_DIR / "mock-telephony-lab.spec.js",
        TESTS_DIR / "mock-telephony-call-flow.spec.js",
        BROWSER_AUTOMATION_DIR / "telephony-account-and-number-dry-run.spec.js",
    ]:
        content = js_path.read_text()
        assert_true("--run" in content, f"{js_path.name} lost the opt-in run guard.")
        assert_true("playwright" in content, f"{js_path.name} no longer references Playwright.")


if __name__ == "__main__":
    main()
