#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-notification-studio"
SERVICE_DIR = ROOT / "services" / "mock-notification-rail"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "vendor_shortlist": DATA_DIR / "31_vendor_shortlist.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
}

DELIVERABLES = [
    DATA_DIR / "33_notification_studio_pack.json",
    DATA_DIR / "33_notification_project_field_map.json",
    DATA_DIR / "33_sender_and_domain_matrix.csv",
    DATA_DIR / "33_template_and_routing_plan_registry.csv",
    DATA_DIR / "33_notification_live_gate_checklist.json",
    DOCS_DIR / "33_local_notification_studio_spec.md",
    DOCS_DIR / "33_notification_project_field_map.md",
    DOCS_DIR / "33_sender_domain_and_webhook_strategy.md",
    DOCS_DIR / "33_notification_live_gate_and_spend_controls.md",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "notificationStudioPack.ts",
    APP_DIR / "public" / "notification-studio-pack.json",
    SERVICE_DIR / "README.md",
    SERVICE_DIR / "package.json",
    SERVICE_DIR / "src" / "railCore.js",
    SERVICE_DIR / "src" / "server.js",
    TESTS_DIR / "mock-notification-studio.spec.js",
    TESTS_DIR / "mock-notification-delivery-truth.spec.js",
    BROWSER_AUTOMATION_DIR / "notification-project-dry-run.spec.js",
    ROOT / "tools" / "analysis" / "build_notification_studio_pack.py",
]

EXPECTED_GUIDANCE_IDS = {
    "twilio_messaging_services",
    "twilio_track_outbound_status",
    "twilio_webhooks_security",
    "twilio_sms_pricing_gb",
    "vonage_sms_before_you_begin",
    "vonage_signing_messages",
    "vonage_webhooks",
    "vonage_sms_pricing",
    "mailgun_webhooks",
    "mailgun_http_signing_key",
    "mailgun_subaccounts",
    "mailgun_sandbox_domain",
    "mailgun_events_tracking",
    "sendgrid_event_webhook_security",
    "sendgrid_subusers",
    "sendgrid_domain_auth",
    "sendgrid_sandbox_mode",
    "sendgrid_email_activity",
}

EXPECTED_VENDOR_IDS = {
    "twilio_sms",
    "vonage_sms",
    "mailgun_email",
    "sendgrid_email",
}

EXPECTED_SECRET_ROWS = {
    "ACC_EMAIL_LOCAL_SIM_PRINCIPAL",
    "ID_EMAIL_LOCAL_SENDER",
    "SEC_EMAIL_CI_WEBHOOK",
    "ACC_EMAIL_PREPROD_PROJECT",
    "SEC_EMAIL_PRODUCTION_WEBHOOK",
    "ID_EMAIL_PRODUCTION_SENDER",
    "ACC_SMS_LOCAL_SIM_PRINCIPAL",
    "ID_SMS_LOCAL_SENDER",
    "SEC_SMS_CI_WEBHOOK",
    "ACC_SMS_INTEGRATION_PROJECT",
    "ID_SMS_INTEGRATION_SENDER",
}

EXPECTED_TEMPLATE_IDS = {
    "TPL_EMAIL_SECURE_LINK_SEEDED_V1",
    "TPL_EMAIL_SECURE_LINK_SEEDED_V2",
    "TPL_EMAIL_REPLY_WINDOW_V1",
    "TPL_EMAIL_MORE_INFO_REMINDER_V1",
    "TPL_EMAIL_DELIVERY_REPAIR_NOTICE_V1",
    "TPL_EMAIL_DELIVERY_REPAIR_NOTICE_V2",
    "TPL_SMS_SEEDED_CONTINUATION_V1",
    "TPL_SMS_SEEDED_CONTINUATION_V2",
    "TPL_SMS_CHALLENGE_CONTINUATION_V1",
    "TPL_SMS_CALLBACK_WINDOW_V1",
    "TPL_SMS_DELIVERY_REPAIR_NOTICE_V1",
    "TPL_DUAL_SUPPORT_RECOVERY_V1",
}

EXPECTED_LIVE_GATES = {
    "LIVE_GATE_NOTIFY_PHASE0_EXTERNAL_READY",
    "LIVE_GATE_NOTIFY_VENDOR_APPROVED",
    "LIVE_GATE_NOTIFY_PROJECT_SCOPE",
    "LIVE_GATE_NOTIFY_SENDER_OWNERSHIP",
    "LIVE_GATE_NOTIFY_DOMAIN_VERIFICATION",
    "LIVE_GATE_NOTIFY_WEBHOOK_SECURITY",
    "LIVE_GATE_NOTIFY_REPAIR_POLICY",
    "LIVE_GATE_NOTIFY_TEMPLATE_MIGRATION",
    "LIVE_GATE_NOTIFY_LOG_EXPORT",
    "LIVE_GATE_NOTIFY_APPROVER_AND_ENV",
    "LIVE_GATE_NOTIFY_MUTATION_AND_SPEND_FLAGS",
    "LIVE_GATE_NOTIFY_FINAL_POSTURE",
}

EXPECTED_ENV_VARS = {
    "NOTIFICATION_VENDOR_ID",
    "NOTIFICATION_NAMED_APPROVER",
    "NOTIFICATION_TARGET_ENVIRONMENT",
    "NOTIFICATION_PROJECT_SCOPE",
    "NOTIFICATION_CALLBACK_BASE_URL",
    "NOTIFICATION_WEBHOOK_SECRET_REF",
    "NOTIFICATION_SENDER_REF",
    "ALLOW_REAL_PROVIDER_MUTATION",
    "ALLOW_SPEND",
}

DOC_MARKERS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="template-rail"',
    'data-testid="workspace"',
    'data-testid="delivery-timeline"',
    'data-testid="inspector-panel"',
    'data-testid="mode-toggle-actual"',
    'data-testid="actual-submit-button"',
    "Quiet Send Studio",
    "Real project or sender mutation blocked",
]

SERVICE_MARKERS = [
    'data-testid="notification-sandbox-shell"',
    'data-testid="simulate-button"',
    'data-testid="message-json"',
    "MOCK_NOTIFICATION_RAIL",
    "/api/messages/simulate",
    "retry-webhook",
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
    assert_true(not missing, "Missing seq_033 prerequisites: " + ", ".join(sorted(missing)))
    inputs = {
        "vendor_shortlist": load_json(REQUIRED_INPUTS["vendor_shortlist"]),
        "external_account_inventory": load_csv(REQUIRED_INPUTS["external_account_inventory"]),
        "phase0_gate_verdict": load_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "integration_priority_matrix": load_json(REQUIRED_INPUTS["integration_priority_matrix"]),
        "provider_family_scorecards": load_json(REQUIRED_INPUTS["provider_family_scorecards"]),
    }
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_033 expects Phase 0 to remain withheld.",
    )
    return inputs


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_033 deliverables:\n" + "\n".join(missing))


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "33_notification_studio_pack.json")
    field_map = load_json(DATA_DIR / "33_notification_project_field_map.json")
    sender_rows = load_csv(DATA_DIR / "33_sender_and_domain_matrix.csv")
    template_rows = load_csv(DATA_DIR / "33_template_and_routing_plan_registry.csv")
    live_gate_pack = load_json(DATA_DIR / "33_notification_live_gate_checklist.json")

    assert_true(pack["task_id"] == "seq_033", "Task id drifted.")
    assert_true(pack["visual_mode"] == "Quiet_Send_Studio", "Visual mode drifted.")
    assert_true(pack["phase0_verdict"] == "withheld", "Phase 0 verdict drifted.")
    assert_true(pack["summary"]["field_count"] == 44, "Field count drifted.")
    assert_true(pack["summary"]["sender_row_count"] == 14, "Sender-row count drifted.")
    assert_true(pack["summary"]["template_count"] == 12, "Template count drifted.")
    assert_true(pack["summary"]["routing_plan_count"] == 6, "Routing-plan count drifted.")
    assert_true(pack["summary"]["scenario_count"] == 7, "Scenario count drifted.")
    assert_true(pack["summary"]["seeded_message_count"] == 6, "Seeded-message count drifted.")
    assert_true(pack["summary"]["live_gate_count"] == 12, "Live-gate count drifted.")
    assert_true(pack["summary"]["blocked_live_gate_count"] == 6, "Blocked live-gate count drifted.")
    assert_true(pack["summary"]["review_live_gate_count"] == 5, "Review live-gate count drifted.")
    assert_true(pack["summary"]["pass_live_gate_count"] == 1, "Pass live-gate count drifted.")
    assert_true(pack["summary"]["selected_secret_count"] == 11, "Selected secret count drifted.")
    assert_true(pack["summary"]["selected_vendor_count"] == 4, "Selected vendor count drifted.")
    assert_true(pack["summary"]["rejected_vendor_count"] == 1, "Rejected vendor count drifted.")
    assert_true(pack["summary"]["official_guidance_count"] == 18, "Official guidance count drifted.")

    assert_true(pack["mock_service"]["ports"]["notification_rail"] == 4190, "Rail port drifted.")
    assert_true(pack["mock_service"]["ports"]["studio_preview"] == 4191, "Studio preview port drifted.")
    assert_true(
        pack["mock_service"]["base_url_default"] == "http://127.0.0.1:4190",
        "Base URL drifted.",
    )

    guidance_ids = {row["source_id"] for row in pack["official_vendor_guidance"]}
    assert_true(guidance_ids == EXPECTED_GUIDANCE_IDS, "Official vendor guidance coverage drifted.")

    shortlisted_vendor_ids = {row["vendor_id"] for row in pack["shortlisted_vendors"]}
    assert_true(shortlisted_vendor_ids == EXPECTED_VENDOR_IDS, "Shortlisted vendor ids drifted.")
    assert_true(
        shortlisted_vendor_ids
        == {
            row["vendor_id"]
            for row in inputs["vendor_shortlist"]["shortlist_by_family"]["sms"]
            + inputs["vendor_shortlist"]["shortlist_by_family"]["email"]
        },
        "seq_031 shortlist no longer matches seq_033 vendor gating.",
    )

    selected_secret_ids = {row["account_or_secret_id"] for row in pack["selected_secret_rows"]}
    assert_true(selected_secret_ids == EXPECTED_SECRET_ROWS, "Selected notification secret rows drifted.")
    assert_true(
        selected_secret_ids.issubset(
            {row["account_or_secret_id"] for row in inputs["external_account_inventory"]}
        ),
        "Selected notification secret rows no longer exist in the external account inventory.",
    )

    assert_true(field_map["summary"]["field_count"] == 44, "Field-map count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["shared"] == 12, "Shared-field count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["twilio_sms"] == 8, "Twilio-field count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["vonage_sms"] == 8, "Vonage-field count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["mailgun_email"] == 8, "Mailgun-field count drifted.")
    assert_true(field_map["summary"]["provider_breakdown"]["sendgrid_email"] == 8, "SendGrid-field count drifted.")
    assert_true(field_map["summary"]["live_required_count"] == 43, "Live-required field count drifted.")
    assert_true(field_map["summary"]["mock_required_count"] == 26, "Mock-required field count drifted.")

    assert_true(len(sender_rows) == 14, "Sender CSV row count drifted.")
    assert_true(len(template_rows) == 12, "Template CSV row count drifted.")
    assert_true(
        {row["template_id"] for row in template_rows} == EXPECTED_TEMPLATE_IDS,
        "Template ids drifted.",
    )
    for row in template_rows:
        for field in (
            "template_id",
            "channel",
            "message_intent",
            "personalisation_fields",
            "routing_plan_ref",
            "sender_identity_ref",
            "delivery_callback_required",
            "supports_markdown_or_rich_copy_rules",
            "mock_now_use",
            "actual_later_use",
            "notes",
        ):
            assert_true(bool(row[field]), f"Template row {row['template_id']} is missing {field}.")

    gate_ids = {row["gate_id"] for row in live_gate_pack["live_gates"]}
    assert_true(gate_ids == EXPECTED_LIVE_GATES, "Live-gate ids drifted.")
    assert_true(
        set(live_gate_pack["required_env"]) == EXPECTED_ENV_VARS,
        "Required live env vars drifted.",
    )
    assert_true(
        set(live_gate_pack["allowed_vendor_ids"]) == EXPECTED_VENDOR_IDS,
        "Allowed notification vendor ids drifted.",
    )

    integration_ids = {row["integration_id"] for row in pack["integration_rows"]}
    assert_true(
        integration_ids == {"int_sms_continuation_delivery", "int_email_notification_delivery"},
        "Upstream integration coverage drifted.",
    )
    provider_families = {row["provider_family"] for row in pack["scorecard_rows"]}
    assert_true(
        provider_families == {"notifications_sms", "notifications_email"},
        "Upstream provider-scorecard coverage drifted.",
    )

    for doc_path in (
        DOCS_DIR / "33_local_notification_studio_spec.md",
        DOCS_DIR / "33_notification_project_field_map.md",
        DOCS_DIR / "33_sender_domain_and_webhook_strategy.md",
        DOCS_DIR / "33_notification_live_gate_and_spend_controls.md",
    ):
        content = doc_path.read_text()
        for marker in DOC_MARKERS:
            assert_true(marker in content, f"Missing doc marker {marker} in {doc_path.name}.")

    app_content = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app_content, f"Missing app marker {marker}.")

    service_content = (SERVICE_DIR / "src" / "server.js").read_text()
    for marker in SERVICE_MARKERS:
        assert_true(marker in service_content, f"Missing service marker {marker}.")

    for path in (
        TESTS_DIR / "mock-notification-studio.spec.js",
        TESTS_DIR / "mock-notification-delivery-truth.spec.js",
        BROWSER_AUTOMATION_DIR / "notification-project-dry-run.spec.js",
    ):
        content = path.read_text()
        assert_true("--run" in content, f"{path.name} must support --run execution.")

    print(
        json.dumps(
            {
                "task_id": "seq_033",
                "validated": True,
                "field_count": pack["summary"]["field_count"],
                "template_count": pack["summary"]["template_count"],
                "sender_row_count": pack["summary"]["sender_row_count"],
                "scenario_count": pack["summary"]["scenario_count"],
                "live_gate_count": pack["summary"]["live_gate_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
