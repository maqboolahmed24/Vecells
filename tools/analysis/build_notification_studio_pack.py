#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-notification-studio"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"
SERVICE_DIR = ROOT / "services" / "mock-notification-rail"
SERVICE_SRC_DIR = SERVICE_DIR / "src"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

TASK_ID = "seq_033"
CAPTURED_ON = "2026-04-09"
VISUAL_MODE = "Quiet_Send_Studio"
MISSION = (
    "Create the SMS and email project-provisioning pack with a contract-first local "
    "notification studio now and a fail-closed provider-project, sender, domain, webhook, "
    "and spend-gated live strategy later."
)

REQUIRED_INPUTS = {
    "vendor_shortlist": DATA_DIR / "31_vendor_shortlist.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
}

PACK_JSON_PATH = DATA_DIR / "33_notification_studio_pack.json"
FIELD_MAP_JSON_PATH = DATA_DIR / "33_notification_project_field_map.json"
SENDER_MATRIX_CSV_PATH = DATA_DIR / "33_sender_and_domain_matrix.csv"
TEMPLATE_REGISTRY_CSV_PATH = DATA_DIR / "33_template_and_routing_plan_registry.csv"
LIVE_GATE_JSON_PATH = DATA_DIR / "33_notification_live_gate_checklist.json"

LOCAL_SPEC_DOC_PATH = DOCS_DIR / "33_local_notification_studio_spec.md"
FIELD_MAP_DOC_PATH = DOCS_DIR / "33_notification_project_field_map.md"
SENDER_DOC_PATH = DOCS_DIR / "33_sender_domain_and_webhook_strategy.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "33_notification_live_gate_and_spend_controls.md"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "notificationStudioPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "notification-studio-pack.json"

APP_PORT = 4191
SERVICE_PORT = 4190

SOURCE_PRECEDENCE = [
    "prompt/033.md",
    "prompt/032.md",
    "prompt/034.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/21_integration_priority_matrix.json",
    "data/analysis/23_external_account_inventory.csv",
    "data/analysis/31_vendor_shortlist.json",
    "data/analysis/provider_family_scorecards.json",
    "data/analysis/phase0_gate_verdict.json",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/31_actual_provider_shortlist_and_due_diligence.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/callback-and-clinician-messaging-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "https://www.twilio.com/docs/messaging/services",
    "https://www.twilio.com/docs/messaging/guides/track-outbound-message-status",
    "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
    "https://www.twilio.com/en-us/sms/pricing/gb",
    "https://developer.vonage.com/en/messaging/sms/code-snippets/before-you-begin",
    "https://developer.vonage.com/en/getting-started/concepts/signing-messages",
    "https://developer.vonage.com/en/getting-started/concepts/webhooks",
    "https://www.vonage.com/communications-apis/sms/pricing/",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks",
    "https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/account-management/get-v5-accounts-http_signing_key",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/events/events",
    "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
    "https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers",
    "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication",
    "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode",
    "https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/email-activity",
]


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    ensure_dir(path.parent)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    ensure_dir(path.parent)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            normalized = {}
            for key in fieldnames:
                value = row.get(key, "")
                if isinstance(value, list):
                    normalized[key] = "|".join(str(item) for item in value)
                else:
                    normalized[key] = value
            writer.writerow(normalized)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def mono_table(headers: list[str], rows: list[list[str]]) -> str:
    divider = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(headers) + " |", divider]
    for row in rows:
        body.append("| " + " | ".join(row) + " |")
    return "\n".join(body)


def summary_list(pack: dict[str, Any]) -> list[str]:
    summary = pack["summary"]
    return [
        f"field-map rows: `{summary['field_count']}`",
        f"sender/domain rows: `{summary['sender_row_count']}`",
        f"template rows: `{summary['template_count']}`",
        f"routing plans: `{summary['routing_plan_count']}`",
        f"delivery scenarios: `{summary['scenario_count']}`",
        f"seeded messages: `{summary['seeded_message_count']}`",
        f"live gates: `{summary['live_gate_count']}`",
        f"official vendor guidance rows: `{summary['official_guidance_count']}`",
    ]


def build_official_vendor_guidance() -> list[dict[str, Any]]:
    return [
        {
            "source_id": "twilio_messaging_services",
            "vendor": "Twilio",
            "channel_family": "sms",
            "title": "Messaging Services",
            "url": "https://www.twilio.com/docs/messaging/services",
            "captured_on": CAPTURED_ON,
            "summary": "Twilio Messaging Services are the top-level SMS sending container for number pools, sender policy, status callbacks, and compliance controls.",
            "grounding": [
                "Twilio positions Messaging Services as the orchestration surface for sender pools and delivery policy.",
                "Status callbacks are configured at the messaging-service layer rather than as a patient-safe delivery truth source.",
                "The provider-side project object is therefore configuration evidence, not Vecells canonical truth.",
            ],
        },
        {
            "source_id": "twilio_track_outbound_status",
            "vendor": "Twilio",
            "channel_family": "sms",
            "title": "Track outbound message status",
            "url": "https://www.twilio.com/docs/messaging/guides/track-outbound-message-status",
            "captured_on": CAPTURED_ON,
            "summary": "Twilio documents asynchronous status callbacks for message life-cycle updates and keeps provider delivery observations distinct from local send acceptance.",
            "grounding": [
                "Status callbacks are delivered asynchronously.",
                "Carrier or provider status updates arrive after the initial send request.",
                "The callback stream is evidence input only until Vecells records an evidence bundle.",
            ],
        },
        {
            "source_id": "twilio_webhooks_security",
            "vendor": "Twilio",
            "channel_family": "sms",
            "title": "Webhooks security",
            "url": "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
            "captured_on": CAPTURED_ON,
            "summary": "Twilio signs callbacks with `X-Twilio-Signature` and requires the receiver to validate the request target plus parameter set.",
            "grounding": [
                "Twilio sends an `X-Twilio-Signature` header.",
                "Webhook validation binds the callback URL and request parameters.",
                "Authentic transport does not equal authoritative delivery truth.",
            ],
        },
        {
            "source_id": "twilio_sms_pricing_gb",
            "vendor": "Twilio",
            "channel_family": "sms",
            "title": "Twilio SMS pricing in United Kingdom",
            "url": "https://www.twilio.com/en-us/sms/pricing/gb",
            "captured_on": CAPTURED_ON,
            "summary": "Twilio’s UK SMS pricing confirms that real SMS sends are billable and therefore must remain behind spend gates.",
            "grounding": [
                "Pricing varies by destination and message type.",
                "Live SMS sends incur spend even before they become patient-safe delivery truth.",
            ],
        },
        {
            "source_id": "vonage_sms_before_you_begin",
            "vendor": "Vonage",
            "channel_family": "sms",
            "title": "Before you begin with SMS",
            "url": "https://developer.vonage.com/en/messaging/sms/code-snippets/before-you-begin",
            "captured_on": CAPTURED_ON,
            "summary": "Vonage’s SMS onboarding starts from account API key and secret plus account-credit posture before live number or sender work is widened.",
            "grounding": [
                "Vonage exposes API key and secret account credentials.",
                "Live sender and number work sits behind account setup and credit posture.",
            ],
        },
        {
            "source_id": "vonage_signing_messages",
            "vendor": "Vonage",
            "channel_family": "sms",
            "title": "Signing Messages",
            "url": "https://developer.vonage.com/en/getting-started/concepts/signing-messages",
            "captured_on": CAPTURED_ON,
            "summary": "Vonage documents signature options for request validation, including HMAC workflows that support replay-safe callback handling.",
            "grounding": [
                "Vonage supports signed message verification.",
                "Request authenticity still needs Vecells replay and fence controls.",
            ],
        },
        {
            "source_id": "vonage_webhooks",
            "vendor": "Vonage",
            "channel_family": "sms",
            "title": "Webhooks",
            "url": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
            "captured_on": CAPTURED_ON,
            "summary": "Vonage treats webhooks as the transport mechanism for inbound and status updates, including per-application callback URLs.",
            "grounding": [
                "Vonage uses application-level webhook URLs.",
                "Status callbacks are configuration inputs and evidence sources only.",
            ],
        },
        {
            "source_id": "vonage_sms_pricing",
            "vendor": "Vonage",
            "channel_family": "sms",
            "title": "Vonage SMS pricing",
            "url": "https://www.vonage.com/communications-apis/sms/pricing/",
            "captured_on": CAPTURED_ON,
            "summary": "Vonage publishes regional SMS pricing, which means real project creation and test traffic can become billable immediately.",
            "grounding": [
                "SMS pricing is destination-dependent.",
                "Billable provider activity must remain behind spend and approver gates.",
            ],
        },
        {
            "source_id": "mailgun_webhooks",
            "vendor": "Mailgun",
            "channel_family": "email",
            "title": "Webhooks",
            "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks",
            "captured_on": CAPTURED_ON,
            "summary": "Mailgun exposes delivery, failure, complaint, unsubscribe, and other event webhooks, which match the delivery-truth and suppression states Vecells needs to model.",
            "grounding": [
                "Mailgun offers per-event webhook subscriptions.",
                "Unsubscribe and complaint events are first-class provider observations.",
                "Webhook coverage is necessary before real email projects are allowed to mutate.",
            ],
        },
        {
            "source_id": "mailgun_http_signing_key",
            "vendor": "Mailgun",
            "channel_family": "email",
            "title": "Get webhook signing key",
            "url": "https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/account-management/get-v5-accounts-http_signing_key",
            "captured_on": CAPTURED_ON,
            "summary": "Mailgun exposes an account-level webhook signing key, which means sender-domain onboarding and webhook authenticity need a coupled ownership model.",
            "grounding": [
                "The signing key is an account-level object.",
                "Webhook security readiness cannot be deferred until after real project creation.",
            ],
        },
        {
            "source_id": "mailgun_subaccounts",
            "vendor": "Mailgun",
            "channel_family": "email",
            "title": "Subaccounts",
            "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts",
            "captured_on": CAPTURED_ON,
            "summary": "Mailgun subaccounts provide environment or tenant segmentation for provider-side configuration and billing separation.",
            "grounding": [
                "Mailgun offers subaccounts for segmented configuration.",
                "Vecells should keep provider-side environment separation explicit rather than reusing one project across environments.",
            ],
        },
        {
            "source_id": "mailgun_sandbox_domain",
            "vendor": "Mailgun",
            "channel_family": "email",
            "title": "Sandbox Domain",
            "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox",
            "captured_on": CAPTURED_ON,
            "summary": "Mailgun sandbox domains support limited, controlled testing before a verified custom domain is ready.",
            "grounding": [
                "Sandbox domains are explicitly limited test posture.",
                "Provider test or sandbox posture does not replace a sender-domain ownership pack.",
            ],
        },
        {
            "source_id": "mailgun_events_tracking",
            "vendor": "Mailgun",
            "channel_family": "email",
            "title": "Tracking Messages",
            "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/events/events",
            "captured_on": CAPTURED_ON,
            "summary": "Mailgun’s events documentation covers delivery, opens, complaints, unsubscribes, and bounces, which map directly to Vecells delivery evidence and suppression modeling.",
            "grounding": [
                "Mailgun distinguishes hard bounces, complaints, and unsubscribes.",
                "Those outcomes must stay distinct from authoritative message settlement inside Vecells.",
            ],
        },
        {
            "source_id": "sendgrid_event_webhook_security",
            "vendor": "Twilio SendGrid",
            "channel_family": "email",
            "title": "Event Webhook Security Features",
            "url": "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
            "captured_on": CAPTURED_ON,
            "summary": "SendGrid’s Event Webhook supports signed events and integrity validation, which is compatible with the replay-safe callback boundary Vecells requires.",
            "grounding": [
                "SendGrid signs event-webhook payloads.",
                "Webhook authenticity still needs Vecells replay fences and event ordering checks.",
            ],
        },
        {
            "source_id": "sendgrid_subusers",
            "vendor": "Twilio SendGrid",
            "channel_family": "email",
            "title": "Subusers",
            "url": "https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers",
            "captured_on": CAPTURED_ON,
            "summary": "SendGrid subusers provide environment and workload segmentation, including independent credentials and usage controls.",
            "grounding": [
                "SendGrid supports subuser isolation.",
                "Provider segmentation should mirror Vecells environment separation and spend control.",
            ],
        },
        {
            "source_id": "sendgrid_domain_auth",
            "vendor": "Twilio SendGrid",
            "channel_family": "email",
            "title": "Domain authentication",
            "url": "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication",
            "captured_on": CAPTURED_ON,
            "summary": "SendGrid domain authentication is the stronger sender posture over single-sender verification and requires SPF plus DKIM-aligned DNS ownership.",
            "grounding": [
                "SendGrid domain authentication depends on DNS control.",
                "DNS ownership must be explicit before real email widening is allowed.",
            ],
        },
        {
            "source_id": "sendgrid_sandbox_mode",
            "vendor": "Twilio SendGrid",
            "channel_family": "email",
            "title": "Sandbox mode",
            "url": "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode",
            "captured_on": CAPTURED_ON,
            "summary": "SendGrid sandbox mode validates payload shape but does not deliver mail or emit normal event-webhook traffic.",
            "grounding": [
                "Sandbox mode does not deliver email.",
                "Sandbox mode does not generate normal delivery events.",
                "Provider-side test success cannot substitute for a local delivery-truth simulator.",
            ],
        },
        {
            "source_id": "sendgrid_email_activity",
            "vendor": "Twilio SendGrid",
            "channel_family": "email",
            "title": "Email Activity",
            "url": "https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/email-activity",
            "captured_on": CAPTURED_ON,
            "summary": "SendGrid’s email activity surface provides event inspection and CSV export, which shapes the later log-export and audit pack requirements.",
            "grounding": [
                "SendGrid exposes email activity history and CSV export.",
                "Log access is still operational evidence only and must be tied back to Vecells evidence bundles.",
            ],
        },
    ]


def build_environment_profiles() -> list[dict[str, str]]:
    return [
        {
            "environment_profile": "local_mock",
            "label": "Local mock",
            "mode": "mock_now",
            "sender_posture": "placeholder_only",
            "webhook_posture": "seeded_signed_mock",
            "spend_posture": "none",
            "notes": "Offline-capable seeded environment for local development and browser automation.",
        },
        {
            "environment_profile": "preview_mock",
            "label": "Preview mock",
            "mode": "mock_now",
            "sender_posture": "placeholder_or_sandbox_only",
            "webhook_posture": "seeded_signed_mock",
            "spend_posture": "none",
            "notes": "Published preview environment used for demo-safe routing and design checks.",
        },
        {
            "environment_profile": "provider_like_preprod",
            "label": "Provider-like preprod",
            "mode": "actual_later",
            "sender_posture": "verification_pack_required",
            "webhook_posture": "signed_and_replay_safe",
            "spend_posture": "named_approver_and_cap_required",
            "notes": "Later dry-run target only. Environment mirrors provider onboarding shape without live mutation by default.",
        },
        {
            "environment_profile": "actual_later",
            "label": "Actual provider later",
            "mode": "actual_later",
            "sender_posture": "verified_sender_or_domain_only",
            "webhook_posture": "signed_and_audited",
            "spend_posture": "billable",
            "notes": "Fail-closed until provider approval, sender ownership, webhook security, and spend gates all pass.",
        },
    ]


def build_project_field_map() -> list[dict[str, Any]]:
    shared = [
        ("FLD_SHARED_PROJECT_NAME", "shared", "project", "project_name", "Project label", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["prompt/033.md", "docs/external/31_actual_provider_shortlist_and_due_diligence.md"], "Human-readable configuration scope for the notification workspace."),
        ("FLD_SHARED_ENVIRONMENT_PROFILE", "shared", "project", "environment_profile", "Environment profile", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["prompt/033.md", "docs/external/23_actual_partner_account_governance.md"], "Environment label used to block accidental cross-environment reuse."),
        ("FLD_SHARED_VENDOR_ID", "shared", "project", "vendor_id", "Approved vendor id", "no", "yes", ["provider_like_preprod", "actual_later"], ["data/analysis/31_vendor_shortlist.json"], "Must be one of the seq_031 shortlisted notification vendors."),
        ("FLD_SHARED_OWNER_ROLE", "shared", "project", "owner_role", "Owner role", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["data/analysis/external_account_inventory.csv"], "Primary owner for the workspace or project."),
        ("FLD_SHARED_BACKUP_OWNER_ROLE", "shared", "project", "backup_owner_role", "Backup owner role", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["data/analysis/external_account_inventory.csv"], "Backup owner for continuity and rotation."),
        ("FLD_SHARED_NAMED_APPROVER", "shared", "governance", "named_approver", "Named approver", "no", "yes", ["provider_like_preprod", "actual_later"], ["prompt/shared_operating_contract_026_to_035.md"], "Required before any live or billable mutation."),
        ("FLD_SHARED_PROJECT_SCOPE", "shared", "project", "project_scope", "Project scope", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["prompt/033.md"], "Scope is split into email, SMS, or repair-only workloads."),
        ("FLD_SHARED_CALLBACK_BASE_URL", "shared", "webhook", "callback_base_url", "Callback base URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["blueprint/platform-runtime-and-release-blueprint.md"], "Base URL for provider callback ingress."),
        ("FLD_SHARED_WEBHOOK_SECRET_REF", "shared", "webhook", "webhook_secret_ref", "Webhook secret ref", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["docs/external/23_secret_ownership_and_rotation_model.md"], "Vault or seeded secret handle only."),
        ("FLD_SHARED_REPLAY_WINDOW_SECONDS", "shared", "webhook", "replay_window_seconds", "Replay window seconds", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["blueprint/phase-0-the-foundation-protocol.md"], "Replay-safe window for callback acceptance."),
        ("FLD_SHARED_TEMPLATE_REGISTRY_VERSION", "shared", "template", "template_registry_version", "Template registry version", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["prompt/033.md"], "Provider-side configuration must point back to the canonical Vecells template registry version."),
        ("FLD_SHARED_SPEND_CAP_GBP", "shared", "billing", "spend_cap_gbp", "Spend cap GBP", "no", "yes", ["provider_like_preprod", "actual_later"], ["prompt/shared_operating_contract_026_to_035.md"], "Spend guard for billable provider actions."),
    ]
    twilio = [
        ("FLD_TWILIO_SUBACCOUNT_NAME", "twilio_sms", "project", "subaccount_name", "Twilio subaccount name", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/messaging/services", "https://www.twilio.com/docs/iam/api/subaccounts"], "Dedicated provider workspace for the target environment."),
        ("FLD_TWILIO_API_KEY_REF", "twilio_sms", "credential", "api_key_ref", "Twilio API key ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/usage/webhooks/webhooks-security"], "Reference to a restricted API key."),
        ("FLD_TWILIO_MESSAGING_SERVICE_NAME", "twilio_sms", "project", "messaging_service_name", "Messaging Service name", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/messaging/services"], "Per-environment messaging-service label."),
        ("FLD_TWILIO_MESSAGING_SERVICE_SID", "twilio_sms", "project", "messaging_service_sid_placeholder", "Messaging Service SID placeholder", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/messaging/services"], "Mock placeholder locally; real SID later."),
        ("FLD_TWILIO_STATUS_CALLBACK_URL", "twilio_sms", "webhook", "status_callback_url", "Status callback URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/messaging/guides/track-outbound-message-status"], "Callback endpoint for asynchronous delivery observations."),
        ("FLD_TWILIO_INBOUND_WEBHOOK_URL", "twilio_sms", "webhook", "inbound_webhook_url", "Inbound webhook URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/usage/webhooks/webhooks-security"], "Used for inbound reply or route-repair handling."),
        ("FLD_TWILIO_TEST_CREDENTIAL_PROFILE", "twilio_sms", "test", "test_credential_profile", "Test credential profile", "yes", "no", ["local_mock", "preview_mock"], ["https://www.twilio.com/docs/messaging/guides/track-outbound-message-status"], "Used only to document dry-run posture and simulation parity."),
        ("FLD_TWILIO_COST_CENTER_TAG", "twilio_sms", "billing", "cost_center_tag", "Cost center tag", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/en-us/sms/pricing/gb"], "Required for spend attribution."),
    ]
    vonage = [
        ("FLD_VONAGE_API_KEY_REF", "vonage_sms", "credential", "api_key_ref", "Vonage API key ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/messaging/sms/code-snippets/before-you-begin"], "Reference handle for the API key."),
        ("FLD_VONAGE_API_SECRET_REF", "vonage_sms", "credential", "api_secret_ref", "Vonage API secret ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/messaging/sms/code-snippets/before-you-begin"], "Secret handle only."),
        ("FLD_VONAGE_APPLICATION_NAME", "vonage_sms", "project", "application_name", "Application name", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/getting-started/concepts/webhooks"], "Provider-side application container for callbacks."),
        ("FLD_VONAGE_APPLICATION_ID", "vonage_sms", "project", "application_id_placeholder", "Application id placeholder", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/getting-started/concepts/webhooks"], "Mock placeholder locally; real application id later."),
        ("FLD_VONAGE_SIGNATURE_SECRET_REF", "vonage_sms", "webhook", "signature_secret_ref", "Signature secret ref", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/getting-started/concepts/signing-messages"], "Callback authenticity secret."),
        ("FLD_VONAGE_STATUS_CALLBACK_URL", "vonage_sms", "webhook", "status_callback_url", "Status callback URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/getting-started/concepts/webhooks"], "Delivery callback target."),
        ("FLD_VONAGE_INBOUND_WEBHOOK_URL", "vonage_sms", "webhook", "inbound_webhook_url", "Inbound webhook URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://developer.vonage.com/en/getting-started/concepts/webhooks"], "Inbound route for replies or repair escalation."),
        ("FLD_VONAGE_SPEND_PROFILE", "vonage_sms", "billing", "spend_profile_ref", "Spend profile ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.vonage.com/communications-apis/sms/pricing/"], "Named spend profile for billable SMS use."),
    ]
    mailgun = [
        ("FLD_MAILGUN_PARENT_ACCOUNT_REF", "mailgun_email", "project", "parent_account_ref", "Mailgun parent account ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts"], "Top-level provider account that owns subaccounts."),
        ("FLD_MAILGUN_SUBACCOUNT_NAME", "mailgun_email", "project", "subaccount_name", "Mailgun subaccount name", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts"], "Environment-specific Mailgun subaccount."),
        ("FLD_MAILGUN_DOMAIN_NAME", "mailgun_email", "sender", "domain_name", "Domain name", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox"], "Sandbox locally, verified custom domain later."),
        ("FLD_MAILGUN_DOMAIN_MODE", "mailgun_email", "sender", "domain_mode", "Domain mode", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox"], "Either sandbox or verified custom domain."),
        ("FLD_MAILGUN_HTTP_SIGNING_KEY_REF", "mailgun_email", "webhook", "http_signing_key_ref", "HTTP signing key ref", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/account-management/get-v5-accounts-http_signing_key"], "Account-level webhook signing key reference."),
        ("FLD_MAILGUN_EVENT_ENDPOINT_URL", "mailgun_email", "webhook", "event_endpoint_url", "Event endpoint URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks"], "Event endpoint for delivered, failed, complaint, and unsubscribe observations."),
        ("FLD_MAILGUN_TEMPLATE_NAMESPACE", "mailgun_email", "template", "template_namespace", "Template namespace", "yes", "yes", ["local_mock", "preview_mock", "provider_like_preprod", "actual_later"], ["prompt/033.md"], "Maps internal template families to provider-side labels when later needed."),
        ("FLD_MAILGUN_EVENT_EXPORT_WINDOW", "mailgun_email", "audit", "event_export_window_days", "Event export window days", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://documentation.mailgun.com/docs/mailgun/user-manual/events/events"], "Export horizon for audit and reconciliation."),
    ]
    sendgrid = [
        ("FLD_SENDGRID_PARENT_ACCOUNT_REF", "sendgrid_email", "project", "parent_account_ref", "SendGrid parent account ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers"], "Parent account owning subusers."),
        ("FLD_SENDGRID_SUBUSER_NAME", "sendgrid_email", "project", "subuser_name", "Subuser name", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers"], "Dedicated subuser for the environment."),
        ("FLD_SENDGRID_API_KEY_REF", "sendgrid_email", "credential", "api_key_ref", "SendGrid API key ref", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers"], "Credential handle for the subuser or parent account."),
        ("FLD_SENDGRID_SENDER_MODE", "sendgrid_email", "sender", "sender_mode", "Sender mode", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/glossary/domain-authentication"], "Either single sender verification or domain authentication."),
        ("FLD_SENDGRID_DOMAIN_AUTH_REF", "sendgrid_email", "sender", "domain_auth_ref", "Domain auth ref", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/glossary/domain-authentication"], "Reference to the verified domain-auth configuration."),
        ("FLD_SENDGRID_EVENT_WEBHOOK_URL", "sendgrid_email", "webhook", "event_webhook_url", "Event webhook URL", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features"], "Event webhook endpoint URL."),
        ("FLD_SENDGRID_WEBHOOK_PUBLIC_KEY_REF", "sendgrid_email", "webhook", "webhook_public_key_ref", "Webhook public key ref", "yes", "yes", ["preview_mock", "provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features"], "Signature verification key reference."),
        ("FLD_SENDGRID_ACTIVITY_EXPORT_POLICY", "sendgrid_email", "audit", "activity_export_policy", "Activity export policy", "no", "yes", ["provider_like_preprod", "actual_later"], ["https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/email-activity"], "Defines CSV export cadence and retention handling."),
    ]

    rows: list[tuple[str, str, str, str, str, str, str, list[str], list[str], str]] = shared + twilio + vonage + mailgun + sendgrid
    return [
        {
            "field_id": field_id,
            "provider_scope": provider_scope,
            "resource_kind": resource_kind,
            "field_name": field_name,
            "label": label,
            "required_for_mock": required_for_mock,
            "required_for_actual": required_for_actual,
            "environment_profiles": environments,
            "source_refs": source_refs,
            "notes": notes,
        }
        for field_id, provider_scope, resource_kind, field_name, label, required_for_mock, required_for_actual, environments, source_refs, notes in rows
    ]


def build_sender_and_domain_rows() -> list[dict[str, Any]]:
    return [
        {
            "identity_ref": "SND_SMS_LOCAL_PLACEHOLDER",
            "channel": "sms",
            "provider_scope": "shared",
            "environment_profile": "local_mock",
            "identity_kind": "sender_identity",
            "verification_posture": "seeded_placeholder",
            "routing_eligible": "yes",
            "webhook_profile_ref": "WH_SMS_LOCAL_SIGNED",
            "lane": "mock_now",
            "source_refs": ["data/analysis/external_account_inventory.csv#ACC_SMS_LOCAL_SIM_PRINCIPAL"],
            "notes": "Synthetic local sender used for seeded-continuation and repair drills.",
        },
        {
            "identity_ref": "SND_SMS_PREVIEW_PLACEHOLDER",
            "channel": "sms",
            "provider_scope": "shared",
            "environment_profile": "preview_mock",
            "identity_kind": "sender_identity",
            "verification_posture": "placeholder_preview",
            "routing_eligible": "yes",
            "webhook_profile_ref": "WH_SMS_PREVIEW_SIGNED",
            "lane": "mock_now",
            "source_refs": ["prompt/033.md"],
            "notes": "Preview-only sender alias; never a live sender.",
        },
        {
            "identity_ref": "SND_SMS_TWILIO_PROVIDER",
            "channel": "sms",
            "provider_scope": "twilio_sms",
            "environment_profile": "provider_like_preprod",
            "identity_kind": "sender_identity",
            "verification_posture": "messaging_service_config_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_SMS_TWILIO_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://www.twilio.com/docs/messaging/services"],
            "notes": "Twilio sender profile must bind to a messaging service and callback pack.",
        },
        {
            "identity_ref": "SND_SMS_VONAGE_PROVIDER",
            "channel": "sms",
            "provider_scope": "vonage_sms",
            "environment_profile": "provider_like_preprod",
            "identity_kind": "sender_identity",
            "verification_posture": "application_and_sender_registration_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_SMS_VONAGE_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://developer.vonage.com/en/getting-started/concepts/webhooks"],
            "notes": "Vonage SMS sender and callback surfaces stay behind application creation and spend gates.",
        },
        {
            "identity_ref": "SND_SMS_SUPPORT_REPAIR",
            "channel": "sms",
            "provider_scope": "shared",
            "environment_profile": "actual_later",
            "identity_kind": "sender_identity",
            "verification_posture": "governed_manual_only",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_SMS_REPAIR_SIGNED",
            "lane": "actual_later",
            "source_refs": ["blueprint/callback-and-clinician-messaging-loop.md"],
            "notes": "Dedicated sender for support-authorized controlled resend and wrong-recipient repair.",
        },
        {
            "identity_ref": "SND_EMAIL_LOCAL_PLACEHOLDER",
            "channel": "email",
            "provider_scope": "shared",
            "environment_profile": "local_mock",
            "identity_kind": "sender_identity",
            "verification_posture": "seeded_placeholder",
            "routing_eligible": "yes",
            "webhook_profile_ref": "WH_EMAIL_LOCAL_SIGNED",
            "lane": "mock_now",
            "source_refs": ["data/analysis/external_account_inventory.csv#ACC_EMAIL_LOCAL_SIM_PRINCIPAL"],
            "notes": "Synthetic local email sender used for secure-link and reply-needed drills.",
        },
        {
            "identity_ref": "SND_EMAIL_PREVIEW_PLACEHOLDER",
            "channel": "email",
            "provider_scope": "shared",
            "environment_profile": "preview_mock",
            "identity_kind": "sender_identity",
            "verification_posture": "placeholder_preview",
            "routing_eligible": "yes",
            "webhook_profile_ref": "WH_EMAIL_PREVIEW_SIGNED",
            "lane": "mock_now",
            "source_refs": ["prompt/033.md"],
            "notes": "Preview-only sender alias for browser evidence and no-spend demos.",
        },
        {
            "identity_ref": "DOM_EMAIL_MAILGUN_SANDBOX",
            "channel": "email",
            "provider_scope": "mailgun_email",
            "environment_profile": "preview_mock",
            "identity_kind": "domain",
            "verification_posture": "sandbox_domain_only",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_EMAIL_MAILGUN_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox"],
            "notes": "Mailgun sandbox domain is useful for staged validation but not for patient-safe production widening.",
        },
        {
            "identity_ref": "DOM_EMAIL_MAILGUN_VERIFIED",
            "channel": "email",
            "provider_scope": "mailgun_email",
            "environment_profile": "actual_later",
            "identity_kind": "domain",
            "verification_posture": "dns_verification_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_EMAIL_MAILGUN_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks"],
            "notes": "Verified domain candidate for later patient-facing email.",
        },
        {
            "identity_ref": "WH_EMAIL_MAILGUN_SIGNED",
            "channel": "email",
            "provider_scope": "mailgun_email",
            "environment_profile": "actual_later",
            "identity_kind": "webhook",
            "verification_posture": "http_signing_key_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_EMAIL_MAILGUN_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/account-management/get-v5-accounts-http_signing_key"],
            "notes": "Mailgun event webhook profile bound to signing-key validation and replay checks.",
        },
        {
            "identity_ref": "SND_EMAIL_SENDGRID_SINGLE_SENDER",
            "channel": "email",
            "provider_scope": "sendgrid_email",
            "environment_profile": "preview_mock",
            "identity_kind": "sender_identity",
            "verification_posture": "single_sender_verification_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_EMAIL_SENDGRID_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode"],
            "notes": "Single-sender verification path for low-volume staged testing only.",
        },
        {
            "identity_ref": "DOM_EMAIL_SENDGRID_AUTH",
            "channel": "email",
            "provider_scope": "sendgrid_email",
            "environment_profile": "actual_later",
            "identity_kind": "domain",
            "verification_posture": "domain_auth_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_EMAIL_SENDGRID_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://www.twilio.com/docs/sendgrid/glossary/domain-authentication"],
            "notes": "Preferred SendGrid sender posture once DNS ownership is explicit.",
        },
        {
            "identity_ref": "WH_EMAIL_SENDGRID_SIGNED",
            "channel": "email",
            "provider_scope": "sendgrid_email",
            "environment_profile": "actual_later",
            "identity_kind": "webhook",
            "verification_posture": "signed_event_webhook_required",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_EMAIL_SENDGRID_SIGNED",
            "lane": "actual_later",
            "source_refs": ["https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features"],
            "notes": "Signed event-webhook profile with public-key validation and replay fence.",
        },
        {
            "identity_ref": "SND_DUAL_SUPPORT_FALLBACK",
            "channel": "dual_if_supported",
            "provider_scope": "shared",
            "environment_profile": "actual_later",
            "identity_kind": "sender_identity",
            "verification_posture": "support_repair_only",
            "routing_eligible": "conditional",
            "webhook_profile_ref": "WH_DUAL_SUPPORT_SIGNED",
            "lane": "actual_later",
            "source_refs": ["blueprint/phase-0-the-foundation-protocol.md"],
            "notes": "Shared fallback identity for support-led repair when the same authoritative chain has already moved to repair route.",
        },
    ]


def build_routing_plans() -> list[dict[str, Any]]:
    return [
        {
            "routing_plan_ref": "RPL_EMAIL_SECURE_LINK_PRIMARY",
            "title": "Email secure-link primary",
            "primary_channel": "email",
            "fallback_channel": "dual_if_supported",
            "sender_identity_ref": "DOM_EMAIL_MAILGUN_VERIFIED",
            "delivery_callback_required": "yes",
            "repair_entry_rule": "controlled_resend_after_failed_or_disputed_evidence_only",
            "validation_checks": [
                {"title": "Verified sender or domain", "status": "review_required", "detail": "Real widening requires explicit domain ownership."},
                {"title": "Signed event webhook", "status": "review_required", "detail": "Webhook authenticity must be ready before live project creation."},
                {"title": "Transport-vs-truth separation", "status": "pass", "detail": "Delivery callbacks feed evidence bundles instead of patient-visible success directly."},
            ],
            "notes": "Default email secure-link route for baseline callback and message reassurance.",
        },
        {
            "routing_plan_ref": "RPL_EMAIL_REPLY_AND_REVIEW",
            "title": "Email reply and review",
            "primary_channel": "email",
            "fallback_channel": "support_only",
            "sender_identity_ref": "DOM_EMAIL_SENDGRID_AUTH",
            "delivery_callback_required": "yes",
            "repair_entry_rule": "repair_route_or_reopen_before_resend",
            "validation_checks": [
                {"title": "Reply-capable sender", "status": "review_required", "detail": "Reply routing stays tied to the same thread chain."},
                {"title": "Dispute visibility", "status": "pass", "detail": "Disputed receipts widen repair guidance instead of closing the thread."},
                {"title": "Suppression awareness", "status": "pass", "detail": "Unsubscribe and complaint events block quiet resend."},
            ],
            "notes": "Used for clinician-message and more-info reminder flows where reply posture matters.",
        },
        {
            "routing_plan_ref": "RPL_SMS_SEEDED_CONTINUATION",
            "title": "SMS seeded continuation",
            "primary_channel": "sms",
            "fallback_channel": "challenge_or_email",
            "sender_identity_ref": "SND_SMS_TWILIO_PROVIDER",
            "delivery_callback_required": "yes",
            "repair_entry_rule": "wrong_recipient_or_expired_link_forces_repair",
            "validation_checks": [
                {"title": "Wrong-recipient guard", "status": "review_required", "detail": "Provider delivery acceptance may not imply verified reachability."},
                {"title": "Continuation grant fencing", "status": "pass", "detail": "Grant redemption stays independent from provider send acceptance."},
                {"title": "Signed callback validation", "status": "review_required", "detail": "SMS status events must be authenticated and replay-safe."},
            ],
            "notes": "Optional-flagged route for seeded continuation only after sender ownership and wrong-recipient governance are frozen.",
        },
        {
            "routing_plan_ref": "RPL_SMS_CHALLENGE_CONTINUATION",
            "title": "SMS challenge continuation",
            "primary_channel": "sms",
            "fallback_channel": "support_only",
            "sender_identity_ref": "SND_SMS_VONAGE_PROVIDER",
            "delivery_callback_required": "yes",
            "repair_entry_rule": "challenge_only_reissue_until_route_clear",
            "validation_checks": [
                {"title": "Challenge posture preserved", "status": "pass", "detail": "Challenge continuation remains separate from seeded continuation."},
                {"title": "Delayed or expired handling", "status": "pass", "detail": "Expiry widens repair guidance instead of pretending delivery succeeded."},
                {"title": "Spend guard", "status": "blocked", "detail": "Billable SMS path is blocked until spend and approver gates pass."},
            ],
            "notes": "More conservative SMS route for challenge-based continuation or reissue flows.",
        },
        {
            "routing_plan_ref": "RPL_DELIVERY_REPAIR_SAME_CHAIN",
            "title": "Delivery repair same chain",
            "primary_channel": "dual_if_supported",
            "fallback_channel": "support_only",
            "sender_identity_ref": "SND_DUAL_SUPPORT_FALLBACK",
            "delivery_callback_required": "yes",
            "repair_entry_rule": "must_reuse_same_authoritative_chain",
            "validation_checks": [
                {"title": "Resolution-gate authorization", "status": "pass", "detail": "Resend only occurs after repair route or reopen."},
                {"title": "Expectation refresh", "status": "pass", "detail": "Patient-facing repair copy must publish a fresh expectation envelope."},
                {"title": "Calm-success freeze", "status": "pass", "detail": "Thread stays pending or repair-required until evidence settles."},
            ],
            "notes": "Used when the active send chain has already failed, expired, or disputed and a controlled resend is permitted.",
        },
        {
            "routing_plan_ref": "RPL_SUPPORT_RECOVERY_ONLY",
            "title": "Support recovery only",
            "primary_channel": "dual_if_supported",
            "fallback_channel": "none",
            "sender_identity_ref": "SND_DUAL_SUPPORT_FALLBACK",
            "delivery_callback_required": "no",
            "repair_entry_rule": "support_manual_handoff_only",
            "validation_checks": [
                {"title": "Same-shell recovery", "status": "pass", "detail": "Recovery keeps the current anchor visible while controls degrade."},
                {"title": "No direct provider mutation", "status": "pass", "detail": "Support-only route never creates a hidden provider-side success cue."},
                {"title": "Attachment and channel repair", "status": "pass", "detail": "Repair stays governed even when the channel changes."},
            ],
            "notes": "Last-resort recovery route when delivery truth is unresolved and the shell must stay bounded.",
        },
    ]


def build_template_registry() -> list[dict[str, Any]]:
    rows = [
        ("TPL_EMAIL_SECURE_LINK_SEEDED_V1", "TF_EMAIL_SECURE_LINK", "v1", "email", "secure_link_seeded", ["patient_given_name", "secure_link_url", "expires_at", "reply_window"], "RPL_EMAIL_SECURE_LINK_PRIMARY", "DOM_EMAIL_MAILGUN_VERIFIED", "yes", "rich_copy_allowed", "baseline secure-link delivery", "provider-domain verified", "First secure-link email variant."),
        ("TPL_EMAIL_SECURE_LINK_SEEDED_V2", "TF_EMAIL_SECURE_LINK", "v2", "email", "secure_link_seeded", ["patient_given_name", "secure_link_url", "expires_at", "reply_window", "support_number"], "RPL_EMAIL_SECURE_LINK_PRIMARY", "DOM_EMAIL_MAILGUN_VERIFIED", "yes", "rich_copy_allowed", "baseline secure-link delivery", "provider-domain verified", "Adds bounded support fallback copy."),
        ("TPL_EMAIL_REPLY_WINDOW_V1", "TF_EMAIL_REPLY_WINDOW", "v1", "email", "reply_needed", ["patient_given_name", "reply_deadline", "thread_entry_url"], "RPL_EMAIL_REPLY_AND_REVIEW", "DOM_EMAIL_SENDGRID_AUTH", "yes", "rich_copy_allowed", "thread reply reminder", "reply-capable provider later", "Thread reply-needed reminder."),
        ("TPL_EMAIL_MORE_INFO_REMINDER_V1", "TF_EMAIL_MORE_INFO_REMINDER", "v1", "email", "more_info_reminder", ["patient_given_name", "reply_deadline", "thread_entry_url", "support_number"], "RPL_EMAIL_REPLY_AND_REVIEW", "DOM_EMAIL_SENDGRID_AUTH", "yes", "rich_copy_allowed", "more-info reminder", "reply-capable provider later", "Reminder with explicit due-window language."),
        ("TPL_EMAIL_DELIVERY_REPAIR_NOTICE_V1", "TF_EMAIL_DELIVERY_REPAIR", "v1", "email", "delivery_repair_notice", ["patient_given_name", "repair_guidance", "support_number"], "RPL_DELIVERY_REPAIR_SAME_CHAIN", "SND_DUAL_SUPPORT_FALLBACK", "yes", "plain_or_rich", "repair guidance", "repair route only", "Email repair notice for failed or disputed sends."),
        ("TPL_EMAIL_DELIVERY_REPAIR_NOTICE_V2", "TF_EMAIL_DELIVERY_REPAIR", "v2", "email", "delivery_repair_notice", ["patient_given_name", "repair_guidance", "support_number", "callback_window"], "RPL_DELIVERY_REPAIR_SAME_CHAIN", "SND_DUAL_SUPPORT_FALLBACK", "yes", "plain_or_rich", "repair guidance", "repair route only", "Adds callback fallback window."),
        ("TPL_SMS_SEEDED_CONTINUATION_V1", "TF_SMS_SEEDED_CONTINUATION", "v1", "sms", "secure_link_seeded", ["secure_link_url", "expires_at"], "RPL_SMS_SEEDED_CONTINUATION", "SND_SMS_TWILIO_PROVIDER", "yes", "plain_copy_only", "optional seeded continuation", "optional flagged live use", "Baseline seeded-continuation SMS."),
        ("TPL_SMS_SEEDED_CONTINUATION_V2", "TF_SMS_SEEDED_CONTINUATION", "v2", "sms", "secure_link_seeded", ["secure_link_url", "expires_at", "support_number"], "RPL_SMS_SEEDED_CONTINUATION", "SND_SMS_TWILIO_PROVIDER", "yes", "plain_copy_only", "optional seeded continuation", "optional flagged live use", "Adds support fallback line for delay or dispute."),
        ("TPL_SMS_CHALLENGE_CONTINUATION_V1", "TF_SMS_CHALLENGE_CONTINUATION", "v1", "sms", "secure_link_challenge", ["challenge_code", "expires_at"], "RPL_SMS_CHALLENGE_CONTINUATION", "SND_SMS_VONAGE_PROVIDER", "yes", "plain_copy_only", "challenge continuation", "optional flagged live use", "Challenge-code SMS that avoids seeded grant claims."),
        ("TPL_SMS_CALLBACK_WINDOW_V1", "TF_SMS_CALLBACK_WINDOW", "v1", "sms", "callback_window", ["window_upper_at", "support_number"], "RPL_SMS_CHALLENGE_CONTINUATION", "SND_SMS_VONAGE_PROVIDER", "yes", "plain_copy_only", "callback reassurance", "review-only live use", "Short callback window reassurance SMS."),
        ("TPL_SMS_DELIVERY_REPAIR_NOTICE_V1", "TF_SMS_DELIVERY_REPAIR", "v1", "sms", "delivery_repair_notice", ["support_number", "repair_guidance"], "RPL_DELIVERY_REPAIR_SAME_CHAIN", "SND_DUAL_SUPPORT_FALLBACK", "yes", "plain_copy_only", "repair guidance", "repair route only", "SMS repair notice when the same authoritative chain needs recovery."),
        ("TPL_DUAL_SUPPORT_RECOVERY_V1", "TF_DUAL_SUPPORT_RECOVERY", "v1", "dual_if_supported", "support_recovery_notice", ["support_number", "next_step"], "RPL_SUPPORT_RECOVERY_ONLY", "SND_DUAL_SUPPORT_FALLBACK", "no", "plain_or_rich", "same-shell recovery", "support-only later", "Shared support-recovery fallback notice."),
    ]
    return [
        {
            "template_id": template_id,
            "template_family_ref": family_ref,
            "version_label": version_label,
            "channel": channel,
            "message_intent": message_intent,
            "personalisation_fields": personalisation_fields,
            "routing_plan_ref": routing_plan_ref,
            "sender_identity_ref": sender_identity_ref,
            "delivery_callback_required": delivery_callback_required,
            "supports_markdown_or_rich_copy_rules": copy_rules,
            "mock_now_use": mock_now_use,
            "actual_later_use": actual_later_use,
            "notes": notes,
            "preview_subject": notes if channel == "email" else "",
            "preview_body": f"{message_intent.replace('_', ' ').title()} via {channel} using {version_label}.",
        }
        for template_id, family_ref, version_label, channel, message_intent, personalisation_fields, routing_plan_ref, sender_identity_ref, delivery_callback_required, copy_rules, mock_now_use, actual_later_use, notes in rows
    ]


def build_live_gate_pack(allowed_vendor_ids: list[str]) -> dict[str, Any]:
    live_gates = [
        {
            "gate_id": "LIVE_GATE_NOTIFY_PHASE0_EXTERNAL_READY",
            "title": "Phase 0 external readiness",
            "status": "blocked",
            "gate_class": "blocker",
            "source_refs": ["data/analysis/phase0_gate_verdict.json#GATE_EXTERNAL_TO_FOUNDATION"],
            "notes": "Phase 0 entry remains withheld, so no live provider mutation is allowed.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_VENDOR_APPROVED",
            "title": "Shortlisted vendor selected",
            "status": "pass",
            "gate_class": "governance",
            "source_refs": ["data/analysis/31_vendor_shortlist.json"],
            "notes": "Only the seq_031 shortlisted notification vendors are permitted for later dry runs.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_PROJECT_SCOPE",
            "title": "Project scope and environment split",
            "status": "review_required",
            "gate_class": "configuration",
            "source_refs": ["prompt/033.md", "docs/external/23_actual_partner_account_governance.md"],
            "notes": "Project scope must stay split by environment and workload family.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_SENDER_OWNERSHIP",
            "title": "Sender ownership pack",
            "status": "blocked",
            "gate_class": "ownership",
            "source_refs": ["prompt/033.md", "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication"],
            "notes": "Real sender or domain work is blocked until ownership, DNS, and support recovery posture are explicit.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_DOMAIN_VERIFICATION",
            "title": "Domain or sender verification evidence",
            "status": "blocked",
            "gate_class": "ownership",
            "source_refs": ["https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox", "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication"],
            "notes": "Email widening needs sender-domain evidence; SMS widening needs explicit sender posture and wrong-recipient policy.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_WEBHOOK_SECURITY",
            "title": "Signed webhook and replay fence pack",
            "status": "blocked",
            "gate_class": "security",
            "source_refs": ["https://www.twilio.com/docs/usage/webhooks/webhooks-security", "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features"],
            "notes": "No real project creation before callback authenticity and replay handling are ready.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_REPAIR_POLICY",
            "title": "Controlled resend and repair policy",
            "status": "review_required",
            "gate_class": "product_law",
            "source_refs": ["blueprint/callback-and-clinician-messaging-loop.md"],
            "notes": "Repair and resend must reuse the same authoritative chain until resolution gate authorizes a new send.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_TEMPLATE_MIGRATION",
            "title": "Template migration plan",
            "status": "review_required",
            "gate_class": "configuration",
            "source_refs": ["prompt/033.md"],
            "notes": "Provider-side templates, when used, must map back to the canonical Vecells registry.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_LOG_EXPORT",
            "title": "Log export and retention policy",
            "status": "review_required",
            "gate_class": "assurance",
            "source_refs": ["https://documentation.mailgun.com/docs/mailgun/user-manual/events/events", "https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/email-activity"],
            "notes": "Activity logs and event history must be tied to retention and disclosure posture.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_APPROVER_AND_ENV",
            "title": "Named approver and target environment",
            "status": "review_required",
            "gate_class": "governance",
            "source_refs": ["prompt/shared_operating_contract_026_to_035.md"],
            "notes": "Dry runs require explicit approver identity and environment target even when mutation stays blocked.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_MUTATION_AND_SPEND_FLAGS",
            "title": "Mutation and spend flags",
            "status": "blocked",
            "gate_class": "spend",
            "source_refs": ["prompt/shared_operating_contract_026_to_035.md"],
            "notes": "Both `ALLOW_REAL_PROVIDER_MUTATION=true` and `ALLOW_SPEND=true` are required for any live mutation attempt.",
        },
        {
            "gate_id": "LIVE_GATE_NOTIFY_FINAL_POSTURE",
            "title": "Final live posture",
            "status": "blocked",
            "gate_class": "final",
            "source_refs": ["data/analysis/phase0_gate_verdict.json"],
            "notes": "Current final posture remains blocked and fail-closed.",
        },
    ]
    return {
        "phase0_verdict": "withheld",
        "required_env": [
            "NOTIFICATION_VENDOR_ID",
            "NOTIFICATION_NAMED_APPROVER",
            "NOTIFICATION_TARGET_ENVIRONMENT",
            "NOTIFICATION_PROJECT_SCOPE",
            "NOTIFICATION_CALLBACK_BASE_URL",
            "NOTIFICATION_WEBHOOK_SECRET_REF",
            "NOTIFICATION_SENDER_REF",
            "ALLOW_REAL_PROVIDER_MUTATION",
            "ALLOW_SPEND",
        ],
        "allowed_vendor_ids": allowed_vendor_ids,
        "live_gates": live_gates,
        "selector_map": {
            "base_profile": {
                "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                "page_tab_live_gates": "[data-testid='page-tab-Live_Gates_and_Sender_Readiness']",
                "field_vendor": "[data-testid='actual-field-vendor-id']",
                "field_project_scope": "[data-testid='actual-field-project-scope']",
                "field_sender_ref": "[data-testid='actual-field-sender-ref']",
                "field_domain_ref": "[data-testid='actual-field-domain-ref']",
                "field_callback_base": "[data-testid='actual-field-callback-base']",
                "field_secret_ref": "[data-testid='actual-field-webhook-secret']",
                "field_environment": "[data-testid='actual-field-environment']",
                "field_approver": "[data-testid='actual-field-named-approver']",
                "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
                "field_allow_spend": "[data-testid='actual-field-allow-spend']",
                "final_submit": "[data-testid='actual-submit-button']",
            }
        },
        "official_label_checks": {
            "twilio_sms_pricing": {
                "url": "https://www.twilio.com/en-us/sms/pricing/gb",
                "expected": ["SMS pricing", "destination"],
            },
            "mailgun_sandbox_domain": {
                "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox",
                "expected": ["Sandbox Domain", "authorized recipients"],
            },
            "sendgrid_sandbox_mode": {
                "url": "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode",
                "expected": ["will never be delivered", "will not generate events"],
            },
            "sendgrid_email_activity": {
                "url": "https://www.twilio.com/docs/sendgrid/ui/analytics-and-reporting/email-activity",
                "expected": ["up to 30 days", "CSV"],
            },
        },
        "spend_controls": [
            "No real sender, domain, or subaccount creation without named approver and spend flags.",
            "Preview and provider-like dry runs may capture placeholders but may not execute real creation.",
            "All billable provider actions stay outside repo traces and screenshots.",
        ],
    }


def build_delivery_scenarios() -> list[dict[str, Any]]:
    return [
        {
            "scenario_id": "email_happy_delivery",
            "label": "Email accepted then delivered",
            "channel": "email",
            "default_template_id": "TPL_EMAIL_SECURE_LINK_SEEDED_V2",
            "routing_plan_ref": "RPL_EMAIL_SECURE_LINK_PRIMARY",
            "sender_identity_ref": "DOM_EMAIL_MAILGUN_VERIFIED",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "delivered",
            "delivery_risk_state": "on_track",
            "authoritative_outcome_state": "awaiting_delivery_truth",
            "repair_state": "none",
            "webhook_signature_state": "validated",
            "dispute_state": "none",
            "summary": "Baseline secure-link email with explicit transport, evidence, and later settlement split.",
            "timeline_templates": [
                {"state": "composed", "label": "composed", "tone": "default", "detail": "Template rendered from the canonical registry.", "offset_minutes": 0},
                {"state": "route_bound", "label": "route bound", "tone": "default", "detail": "Route intent and sender binding locked to the active chain.", "offset_minutes": 1},
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "Provider accepted the send request, but no patient-safe success is implied.", "offset_minutes": 2},
                {"state": "delivery_evidence_delivered", "label": "delivery evidence delivered", "tone": "success", "detail": "A delivery evidence bundle can now be recorded.", "offset_minutes": 6},
            ],
            "repair_timeline_templates": [],
            "settle_timeline_templates": [
                {"state": "delivery_evidence_bundled", "label": "delivery evidence bundled", "tone": "success", "detail": "MessageDeliveryEvidenceBundle stored for the active fence.", "offset_minutes": 7},
                {"state": "thread_expectation_refreshed", "label": "thread expectation refreshed", "tone": "success", "detail": "Patient-facing expectation envelope published from current evidence.", "offset_minutes": 8},
                {"state": "authoritative_settled", "label": "authoritative settled", "tone": "success", "detail": "The conversation remains truthful without collapsing transport into outcome.", "offset_minutes": 9},
            ],
            "can_retry_webhook": False,
            "can_repair": False,
            "can_settle": True,
        },
        {
            "scenario_id": "email_bounce_repair_required",
            "label": "Email bounced and repair required",
            "channel": "email",
            "default_template_id": "TPL_EMAIL_DELIVERY_REPAIR_NOTICE_V2",
            "routing_plan_ref": "RPL_DELIVERY_REPAIR_SAME_CHAIN",
            "sender_identity_ref": "SND_DUAL_SUPPORT_FALLBACK",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "failed",
            "delivery_risk_state": "likely_failed",
            "authoritative_outcome_state": "recovery_required",
            "repair_state": "repair_required",
            "webhook_signature_state": "validated",
            "dispute_state": "none",
            "summary": "Hard bounce triggered repair guidance and blocked quiet success until a controlled resend is authorized.",
            "timeline_templates": [
                {"state": "composed", "label": "composed", "tone": "default", "detail": "Repair notice draft anchored to the current thread.", "offset_minutes": 0},
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "The provider accepted the send request.", "offset_minutes": 1},
                {"state": "provider_bounced", "label": "provider bounced", "tone": "blocked", "detail": "The provider reported a hard bounce.", "offset_minutes": 4},
                {"state": "delivery_evidence_failed", "label": "delivery evidence failed", "tone": "blocked", "detail": "Failure evidence was recorded for the active dispatch fence.", "offset_minutes": 5},
                {"state": "expectation_repair_required", "label": "expectation repair required", "tone": "review", "detail": "Patient-visible copy widens to repair guidance instead of disappearing.", "offset_minutes": 6},
            ],
            "repair_timeline_templates": [
                {"state": "resolution_gate_repair_route", "label": "resolution gate repair route", "tone": "review", "detail": "ThreadResolutionGate authorized a repair route.", "offset_minutes": 7},
                {"state": "controlled_resend_authorized", "label": "controlled resend authorized", "tone": "review", "detail": "The same authoritative chain opened a controlled resend.", "offset_minutes": 8},
                {"state": "repair_send_delivered", "label": "repair send delivered", "tone": "success", "detail": "Repair send produced fresh delivery evidence.", "offset_minutes": 12},
            ],
            "settle_timeline_templates": [],
            "can_retry_webhook": False,
            "can_repair": True,
            "can_settle": False,
        },
        {
            "scenario_id": "email_disputed_delivery",
            "label": "Email disputed after contradictory signals",
            "channel": "email",
            "default_template_id": "TPL_EMAIL_REPLY_WINDOW_V1",
            "routing_plan_ref": "RPL_EMAIL_REPLY_AND_REVIEW",
            "sender_identity_ref": "DOM_EMAIL_SENDGRID_AUTH",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "disputed",
            "delivery_risk_state": "disputed",
            "authoritative_outcome_state": "recovery_required",
            "repair_state": "repair_required",
            "webhook_signature_state": "validated",
            "dispute_state": "same_fence_contradiction",
            "summary": "Contradictory same-fence evidence froze calm success and forced a repair or review branch.",
            "timeline_templates": [
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "Transport acceptance arrived.", "offset_minutes": 0},
                {"state": "delivery_signal_positive", "label": "positive delivery signal", "tone": "review", "detail": "A positive provider observation appeared for the active fence.", "offset_minutes": 2},
                {"state": "delivery_signal_contradiction", "label": "delivery contradiction", "tone": "blocked", "detail": "A contradictory terminal signal arrived for the same fence.", "offset_minutes": 5},
                {"state": "delivery_evidence_disputed", "label": "delivery evidence disputed", "tone": "blocked", "detail": "Quiet-success posture is now frozen until review or repair.", "offset_minutes": 6},
            ],
            "repair_timeline_templates": [
                {"state": "support_review_started", "label": "support review started", "tone": "review", "detail": "Support opened the repair lane against the same chain.", "offset_minutes": 7},
                {"state": "repair_route_selected", "label": "repair route selected", "tone": "review", "detail": "Recovery stays inside the same shell and thread context.", "offset_minutes": 8},
            ],
            "settle_timeline_templates": [],
            "can_retry_webhook": False,
            "can_repair": True,
            "can_settle": False,
        },
        {
            "scenario_id": "email_unsubscribe_suppressed",
            "label": "Email suppressed after unsubscribe",
            "channel": "email",
            "default_template_id": "TPL_DUAL_SUPPORT_RECOVERY_V1",
            "routing_plan_ref": "RPL_SUPPORT_RECOVERY_ONLY",
            "sender_identity_ref": "SND_DUAL_SUPPORT_FALLBACK",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "suppressed",
            "delivery_risk_state": "likely_failed",
            "authoritative_outcome_state": "suppressed",
            "repair_state": "manual_support_only",
            "webhook_signature_state": "validated",
            "dispute_state": "none",
            "summary": "Suppression events remain explicit and block invisible resend or false reassurance.",
            "timeline_templates": [
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "Provider accepted the request.", "offset_minutes": 0},
                {"state": "unsubscribe_recorded", "label": "unsubscribe recorded", "tone": "blocked", "detail": "Recipient is on a suppression path.", "offset_minutes": 3},
                {"state": "delivery_suppressed", "label": "delivery suppressed", "tone": "blocked", "detail": "The thread must degrade to support guidance.", "offset_minutes": 4},
            ],
            "repair_timeline_templates": [],
            "settle_timeline_templates": [],
            "can_retry_webhook": False,
            "can_repair": False,
            "can_settle": False,
        },
        {
            "scenario_id": "sms_delayed_then_delivered",
            "label": "SMS delayed then delivered",
            "channel": "sms",
            "default_template_id": "TPL_SMS_SEEDED_CONTINUATION_V2",
            "routing_plan_ref": "RPL_SMS_SEEDED_CONTINUATION",
            "sender_identity_ref": "SND_SMS_TWILIO_PROVIDER",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "delivered",
            "delivery_risk_state": "at_risk",
            "authoritative_outcome_state": "awaiting_delivery_truth",
            "repair_state": "none",
            "webhook_signature_state": "validated",
            "dispute_state": "none",
            "summary": "Delayed SMS widened guidance without implying that continuation was redeemed or verified.",
            "timeline_templates": [
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "SMS send accepted by provider.", "offset_minutes": 0},
                {"state": "delivery_delay_detected", "label": "delivery delay detected", "tone": "review", "detail": "Delay widened risk without upgrading success.", "offset_minutes": 4},
                {"state": "delivery_evidence_delivered", "label": "delivery evidence delivered", "tone": "success", "detail": "Delivery evidence arrived for the active SMS fence.", "offset_minutes": 9},
            ],
            "repair_timeline_templates": [],
            "settle_timeline_templates": [
                {"state": "delivery_evidence_bundled", "label": "delivery evidence bundled", "tone": "success", "detail": "Evidence bundle recorded without claiming grant redemption.", "offset_minutes": 10},
                {"state": "expectation_still_pending_redemption", "label": "expectation still pending redemption", "tone": "review", "detail": "Grant redemption remains a separate truth lane.", "offset_minutes": 11},
            ],
            "can_retry_webhook": False,
            "can_repair": False,
            "can_settle": True,
        },
        {
            "scenario_id": "sms_wrong_recipient_disputed",
            "label": "SMS wrong-recipient suspicion",
            "channel": "sms",
            "default_template_id": "TPL_SMS_DELIVERY_REPAIR_NOTICE_V1",
            "routing_plan_ref": "RPL_DELIVERY_REPAIR_SAME_CHAIN",
            "sender_identity_ref": "SND_DUAL_SUPPORT_FALLBACK",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "disputed",
            "delivery_risk_state": "disputed",
            "authoritative_outcome_state": "recovery_required",
            "repair_state": "repair_required",
            "webhook_signature_state": "validated",
            "dispute_state": "wrong_recipient_suspected",
            "summary": "Wrong-recipient suspicion blocks reuse of the route until support or policy clears the path.",
            "timeline_templates": [
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "Provider accepted the SMS request.", "offset_minutes": 0},
                {"state": "delivery_observed", "label": "delivery observed", "tone": "review", "detail": "A delivery observation arrived, but route trust is still pending.", "offset_minutes": 2},
                {"state": "wrong_recipient_suspected", "label": "wrong recipient suspected", "tone": "blocked", "detail": "Reachability and identity confidence now dispute the route.", "offset_minutes": 4},
                {"state": "delivery_evidence_disputed", "label": "delivery evidence disputed", "tone": "blocked", "detail": "The chain stays repair-required until a fresh route is authorized.", "offset_minutes": 5},
            ],
            "repair_timeline_templates": [
                {"state": "support_route_repair", "label": "support route repair", "tone": "review", "detail": "Support initiated contact-route repair in the same shell.", "offset_minutes": 6},
                {"state": "challenge_fallback_selected", "label": "challenge fallback selected", "tone": "review", "detail": "Challenge continuation replaces seeded assumptions until trust clears.", "offset_minutes": 7},
            ],
            "settle_timeline_templates": [],
            "can_retry_webhook": False,
            "can_repair": True,
            "can_settle": False,
        },
        {
            "scenario_id": "email_webhook_signature_retry",
            "label": "Webhook signature retry then recovery",
            "channel": "email",
            "default_template_id": "TPL_EMAIL_MORE_INFO_REMINDER_V1",
            "routing_plan_ref": "RPL_EMAIL_REPLY_AND_REVIEW",
            "sender_identity_ref": "DOM_EMAIL_SENDGRID_AUTH",
            "environment_profile": "local_mock",
            "transport_state": "provider_accepted",
            "delivery_evidence_state": "pending",
            "delivery_risk_state": "at_risk",
            "authoritative_outcome_state": "awaiting_delivery_truth",
            "repair_state": "none",
            "webhook_signature_state": "signature_failed",
            "dispute_state": "none",
            "summary": "A callback authenticity failure held the delivery chain in provisional posture until a replay-safe retry succeeded.",
            "timeline_templates": [
                {"state": "provider_accepted", "label": "provider accepted", "tone": "default", "detail": "Provider accepted the email send.", "offset_minutes": 0},
                {"state": "webhook_signature_failed", "label": "webhook signature failed", "tone": "blocked", "detail": "Callback authenticity failed and the event stayed provisional.", "offset_minutes": 2},
                {"state": "delivery_truth_held", "label": "delivery truth held", "tone": "review", "detail": "Delivery truth cannot advance until the callback is trusted.", "offset_minutes": 3},
            ],
            "repair_timeline_templates": [],
            "settle_timeline_templates": [
                {"state": "webhook_signature_validated", "label": "webhook signature validated", "tone": "success", "detail": "Replay-safe retry succeeded.", "offset_minutes": 4},
                {"state": "delivery_evidence_delivered", "label": "delivery evidence delivered", "tone": "success", "detail": "Trusted callback now feeds the evidence bundle path.", "offset_minutes": 6},
            ],
            "can_retry_webhook": True,
            "can_repair": False,
            "can_settle": False,
        },
    ]


def materialize_events(message_id: str, templates: list[dict[str, Any]], base_at: datetime) -> list[dict[str, Any]]:
    rows = []
    for index, row in enumerate(templates, start=1):
        at = base_at + timedelta(minutes=int(row["offset_minutes"]))
        rows.append(
            {
                "event_id": f"{message_id}-E{index}",
                "state": row["state"],
                "label": row["label"],
                "tone": row["tone"],
                "detail": row["detail"],
                "at": at.replace(microsecond=0).isoformat(),
            }
        )
    return rows


def build_seeded_messages(scenarios: list[dict[str, Any]], templates: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    seeded = []
    base = datetime(2026, 4, 9, 9, 0, tzinfo=timezone.utc)
    scenario_ids = [
        "email_happy_delivery",
        "email_bounce_repair_required",
        "email_disputed_delivery",
        "email_unsubscribe_suppressed",
        "sms_delayed_then_delivered",
        "sms_wrong_recipient_disputed",
    ]
    scenario_map = {row["scenario_id"]: row for row in scenarios}
    for index, scenario_id in enumerate(scenario_ids, start=1):
        scenario = scenario_map[scenario_id]
        template = templates[scenario["default_template_id"]]
        message_id = f"MSG-LAB-{1000 + index}"
        created_at = base + timedelta(minutes=index * 9)
        seeded.append(
            {
                "message_id": message_id,
                "scenario_id": scenario["scenario_id"],
                "template_id": template["template_id"],
                "template_family_ref": template["template_family_ref"],
                "template_version_label": template["version_label"],
                "channel": template["channel"],
                "message_intent": template["message_intent"],
                "routing_plan_ref": template["routing_plan_ref"],
                "sender_identity_ref": template["sender_identity_ref"],
                "environment_profile": scenario["environment_profile"],
                "recipient_ref": f"synthetic:recipient:{index}",
                "created_at": created_at.replace(microsecond=0).isoformat(),
                "transport_state": scenario["transport_state"],
                "delivery_evidence_state": scenario["delivery_evidence_state"],
                "delivery_risk_state": scenario["delivery_risk_state"],
                "authoritative_outcome_state": scenario["authoritative_outcome_state"],
                "repair_state": scenario["repair_state"],
                "webhook_signature_state": scenario["webhook_signature_state"],
                "dispute_state": scenario["dispute_state"],
                "summary": scenario["summary"],
                "timeline_events": materialize_events(message_id, scenario["timeline_templates"], created_at),
                "can_retry_webhook": scenario["can_retry_webhook"],
                "can_repair": scenario["can_repair"],
                "can_settle": scenario["can_settle"],
            }
        )
    return seeded


def build_assumptions() -> list[dict[str, str]]:
    return [
        {
            "assumption_id": "ASSUMPTION_033_PROVIDER_TEMPLATES_ARE_SECONDARY",
            "statement": "Provider-side template or project labels are secondary configuration evidence; the Vecells template registry remains the authoritative content contract.",
        },
        {
            "assumption_id": "ASSUMPTION_033_EMAIL_DOMAIN_BARS_ARE_HIGHER",
            "statement": "Email sender-domain ownership and signed event webhooks are treated as a higher readiness bar than SMS sender placeholders.",
        },
        {
            "assumption_id": "ASSUMPTION_033_REPAIR_STAYS_IN_THE_SAME_CHAIN",
            "statement": "Controlled resend and repair stay inside the same authoritative chain until a resolution gate explicitly authorizes otherwise.",
        },
    ]


def build_pack() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("Missing seq_033 prerequisites: " + ", ".join(sorted(missing)))

    vendor_shortlist = read_json(REQUIRED_INPUTS["vendor_shortlist"])
    external_account_inventory = read_csv(REQUIRED_INPUTS["external_account_inventory"])
    phase0_gate = read_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    integration_priority = read_json(REQUIRED_INPUTS["integration_priority_matrix"])
    provider_scorecards = read_json(REQUIRED_INPUTS["provider_family_scorecards"])

    phase0_verdict = phase0_gate["summary"]["phase0_entry_verdict"]
    if phase0_verdict != "withheld":
        raise SystemExit("seq_033 expects Phase 0 to remain withheld.")

    shortlisted_vendors = vendor_shortlist["shortlist_by_family"]["sms"] + vendor_shortlist["shortlist_by_family"]["email"]
    rejected_vendors = vendor_shortlist["rejected_by_family"]["email"]
    selected_secret_rows = [row for row in external_account_inventory if row["dependency_family"] in {"email", "sms"}]
    official_vendor_guidance = build_official_vendor_guidance()
    field_map_rows = build_project_field_map()
    sender_rows = build_sender_and_domain_rows()
    routing_plans = build_routing_plans()
    template_rows = build_template_registry()
    template_map = {row["template_id"]: row for row in template_rows}
    delivery_scenarios = build_delivery_scenarios()
    seeded_messages = build_seeded_messages(delivery_scenarios, template_map)
    live_gate_pack = build_live_gate_pack([row["vendor_id"] for row in shortlisted_vendors])
    environment_profiles = build_environment_profiles()

    integration_rows = [
        row
        for row in integration_priority["integration_families"]
        if row["integration_id"] in {"int_sms_continuation_delivery", "int_email_notification_delivery"}
    ]
    scorecard_rows = [
        row
        for row in provider_scorecards["families"]
        if row["provider_family"] in {"notifications_sms", "notifications_email"}
    ]

    return {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "phase0_verdict": phase0_verdict,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "field_count": len(field_map_rows),
            "sender_row_count": len(sender_rows),
            "template_count": len(template_rows),
            "routing_plan_count": len(routing_plans),
            "scenario_count": len(delivery_scenarios),
            "seeded_message_count": len(seeded_messages),
            "live_gate_count": len(live_gate_pack["live_gates"]),
            "blocked_live_gate_count": sum(1 for row in live_gate_pack["live_gates"] if row["status"] == "blocked"),
            "review_live_gate_count": sum(1 for row in live_gate_pack["live_gates"] if row["status"] == "review_required"),
            "pass_live_gate_count": sum(1 for row in live_gate_pack["live_gates"] if row["status"] == "pass"),
            "selected_secret_count": len(selected_secret_rows),
            "selected_vendor_count": len(shortlisted_vendors),
            "rejected_vendor_count": len(rejected_vendors),
            "official_guidance_count": len(official_vendor_guidance),
        },
        "environment_profiles": environment_profiles,
        "project_scopes": [
            {"project_scope": "email_notification_workspace", "title": "Email notification workspace", "channel": "email"},
            {"project_scope": "sms_continuation_workspace", "title": "SMS continuation workspace", "channel": "sms"},
            {"project_scope": "support_repair_workspace", "title": "Support repair workspace", "channel": "dual_if_supported"},
        ],
        "official_vendor_guidance": official_vendor_guidance,
        "shortlisted_vendors": shortlisted_vendors,
        "rejected_vendors": rejected_vendors,
        "selected_secret_rows": selected_secret_rows,
        "field_map_rows": field_map_rows,
        "sender_and_domain_rows": sender_rows,
        "routing_plans": routing_plans,
        "template_registry": template_rows,
        "delivery_scenarios": delivery_scenarios,
        "seeded_messages": seeded_messages,
        "live_gate_pack": live_gate_pack,
        "integration_rows": integration_rows,
        "scorecard_rows": scorecard_rows,
        "assumptions": build_assumptions(),
        "mock_service": {
            "base_url_default": f"http://127.0.0.1:{SERVICE_PORT}",
            "ports": {"notification_rail": SERVICE_PORT, "studio_preview": APP_PORT},
            "http_endpoints": [
                "GET /api/health",
                "GET /api/registry",
                "GET /api/messages",
                "POST /api/messages/simulate",
                "POST /api/messages/:id/retry-webhook",
                "POST /api/messages/:id/repair",
                "POST /api/messages/:id/settle",
            ],
        },
    }


def field_map_json(pack: dict[str, Any]) -> dict[str, Any]:
    rows = pack["field_map_rows"]
    breakdown = {
        "shared": sum(1 for row in rows if row["provider_scope"] == "shared"),
        "twilio_sms": sum(1 for row in rows if row["provider_scope"] == "twilio_sms"),
        "vonage_sms": sum(1 for row in rows if row["provider_scope"] == "vonage_sms"),
        "mailgun_email": sum(1 for row in rows if row["provider_scope"] == "mailgun_email"),
        "sendgrid_email": sum(1 for row in rows if row["provider_scope"] == "sendgrid_email"),
    }
    return {
        "task_id": TASK_ID,
        "generated_at": pack["generated_at"],
        "summary": {
            "field_count": len(rows),
            "provider_breakdown": breakdown,
            "live_required_count": sum(1 for row in rows if row["required_for_actual"] == "yes"),
            "mock_required_count": sum(1 for row in rows if row["required_for_mock"] == "yes"),
        },
        "fields": rows,
    }


def render_local_notification_studio_spec(pack: dict[str, Any]) -> str:
    page_rows = [
        ["Project_and_Environment_Setup", "Project scopes, environment split, ownership, and later dry-run field pack."],
        ["Template_Gallery", "Version-aware template preview with canonical variables and copy rules."],
        ["Routing_Plan_Studio", "Route previews, validation checks, and sender separation."],
        ["Delivery_Truth_Inspector", "Transport, evidence, dispute, repair, and settlement timeline view."],
        ["Live_Gates_and_Sender_Readiness", "Fail-closed live posture, sender readiness, and spend gates."],
    ]
    scenario_rows = [
        [row["scenario_id"], row["label"], row["delivery_evidence_state"], row["authoritative_outcome_state"]]
        for row in pack["delivery_scenarios"]
    ]
    summary = "\n".join(f"- {item}" for item in summary_list(pack))
    return textwrap.dedent(
        f"""
        # 33 Local Notification Studio Spec

        Generated: `{pack["generated_at"]}`
        Visual mode: `{pack["visual_mode"]}`
        Phase 0 posture: `{pack["phase0_verdict"]}`

        ## Mission

        {MISSION}

        ## Coverage

        {summary}

        ## Section A — `Mock_now_execution`

        The local implementation has two coordinated surfaces:

        - `services/mock-notification-rail` is the contract-first SMS and email rail twin.
        - `apps/mock-notification-studio` is the premium internal control-plane studio.

        The studio keeps the blueprint split explicit:

        - transport acceptance is not authoritative success
        - delivery evidence can be `delivered`, `failed`, `disputed`, `expired`, or `suppressed`
        - patient-visible repair posture flows through the same authoritative chain
        - controlled resend is a governed recovery path, not a second silent send

        ### Page Set

        {mono_table(["Page", "Responsibility"], page_rows)}

        ### Scenario Coverage

        {mono_table(["Scenario", "Label", "Delivery Evidence", "Authoritative Outcome"], scenario_rows)}

        The mock rail supports:

        - template rendering and version switching
        - sender and domain placeholder separation
        - signed webhook success and signature-failure retry
        - bounce, dispute, suppression, wrong-recipient suspicion, and repair flows
        - environment separation across `local_mock`, `preview_mock`, and `provider_like_preprod`

        ## Section B — `Actual_provider_strategy_later`

        Later live onboarding is intentionally gated:

        - only seq_031 shortlisted vendors are allowed
        - sender and domain ownership must be explicit before real mutation
        - signed webhooks plus replay fences must exist before provider projects are created
        - named approver, target environment, `ALLOW_REAL_PROVIDER_MUTATION=true`, and `ALLOW_SPEND=true` are all mandatory
        - Phase 0 external readiness remains blocked, so the real posture is still fail-closed

        The live-later plan keeps provider project setup downstream of product truth:

        - templates stay canonical inside Vecells and project outward only as configuration mirrors
        - sender-domain verification is separate from transport or project existence
        - delivery callbacks remain evidence inputs until Vecells records the matching proof bundle
        - resend and repair remain governed product actions rather than provider-console shortcuts
        """
    ).strip()


def render_field_map_doc(pack: dict[str, Any], field_map: dict[str, Any]) -> str:
    rows = []
    for row in field_map["fields"]:
        rows.append(
            [
                row["field_id"],
                row["provider_scope"],
                row["field_name"],
                row["required_for_mock"],
                row["required_for_actual"],
            ]
        )
    return textwrap.dedent(
        f"""
        # 33 Notification Project Field Map

        Generated: `{pack["generated_at"]}`

        The field map keeps provider-specific creation mechanics behind a common project contract so the studio and later dry-run harness share one schema.

        ## Coverage Summary

        - total rows: `{field_map["summary"]["field_count"]}`
        - shared rows: `{field_map["summary"]["provider_breakdown"]["shared"]}`
        - Twilio SMS rows: `{field_map["summary"]["provider_breakdown"]["twilio_sms"]}`
        - Vonage SMS rows: `{field_map["summary"]["provider_breakdown"]["vonage_sms"]}`
        - Mailgun rows: `{field_map["summary"]["provider_breakdown"]["mailgun_email"]}`
        - SendGrid rows: `{field_map["summary"]["provider_breakdown"]["sendgrid_email"]}`

        ## Section A — `Mock_now_execution`

        The mock studio consumes the shared rows plus placeholder sender/domain fields. Those rows are enough to render environment posture, route validation, webhook readiness, and live-gate explanations without touching a real provider.

        ## Section B — `Actual_provider_strategy_later`

        Provider-specific rows become active only when the live gates pass. That includes subaccounts, messaging-service names, application ids, verified domains, signed event-webhook references, and spend controls.

        ## Field Inventory

        {mono_table(["Field Id", "Scope", "Field", "Mock", "Actual"], rows[:24])}

        The full machine-readable inventory is in `data/analysis/33_notification_project_field_map.json`.
        """
    ).strip()


def render_sender_doc(pack: dict[str, Any]) -> str:
    rows = [
        [
            row["identity_ref"],
            row["channel"],
            row["provider_scope"],
            row["verification_posture"],
            row["lane"],
        ]
        for row in pack["sender_and_domain_rows"]
    ]
    guidance_rows = [
        [row["vendor"], row["channel_family"], row["title"], row["url"]]
        for row in pack["official_vendor_guidance"]
        if row["vendor"] in {"Twilio", "Vonage", "Mailgun", "Twilio SendGrid"}
    ]
    return textwrap.dedent(
        f"""
        # 33 Sender Domain And Webhook Strategy

        Generated: `{pack["generated_at"]}`

        Sender identity, domain posture, and webhook authenticity are separated deliberately:

        - SMS senders do not share the same ownership pack as email domains
        - email domain verification, suppression, and reply posture stay explicit
        - webhook authenticity and replay fences are designed before any live provider project is allowed to mutate

        ## Section A — `Mock_now_execution`

        The local studio uses placeholder senders and signed mock webhooks to exercise:

        - bounce and dispute rendering
        - suppression and unsubscribe handling
        - controlled resend and repair notice issuance
        - sender and route validation warnings without touching a real provider

        ## Section B — `Actual_provider_strategy_later`

        The live-later strategy keeps four distinct provider mechanics visible:

        - Twilio SMS: messaging services plus status callbacks
        - Vonage SMS: application-level callbacks plus signed requests
        - Mailgun email: subaccounts, sandbox or verified domains, and event webhooks
        - SendGrid email: subusers, domain authentication, signed event webhooks, and sandbox-mode limitations

        ### Sender And Domain Matrix

        {mono_table(["Identity Ref", "Channel", "Provider", "Verification", "Lane"], rows)}

        ### Current Official Guidance

        {mono_table(["Vendor", "Family", "Title", "URL"], guidance_rows[:12])}
        """
    ).strip()


def render_live_gate_doc(pack: dict[str, Any]) -> str:
    rows = [
        [row["gate_id"], row["title"], row["status"], row["gate_class"]]
        for row in pack["live_gate_pack"]["live_gates"]
    ]
    return textwrap.dedent(
        f"""
        # 33 Notification Live Gate And Spend Controls

        Generated: `{pack["generated_at"]}`
        Current live posture: `blocked`

        ## Section A — `Mock_now_execution`

        The mock studio exposes the full live gate model even though no real provider mutation is allowed. The operator can fill the dry-run fields, inspect required env vars, and see why the live submit button remains disabled.

        ## Section B — `Actual_provider_strategy_later`

        Real provider mutation must stay blocked unless all of the following are true:

        - provider is on the seq_031 shortlist
        - sender or domain ownership posture is explicit
        - signed webhook plus replay controls are ready
        - named approver and environment target are present
        - `ALLOW_REAL_PROVIDER_MUTATION=true`
        - `ALLOW_SPEND=true`

        The current live posture is still blocked because `phase0_entry_verdict = withheld`.

        ### Live Gates

        {mono_table(["Gate Id", "Title", "Status", "Class"], rows)}

        ### Required Environment Variables

        - `{"`\n- `".join(pack["live_gate_pack"]["required_env"])}``
        """
    ).strip()


def render_app_readme(pack: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""
        # mock-notification-studio

        Premium local notification operations studio for `seq_033`.

        Visual mode: `{pack["visual_mode"]}`

        ## Run

        ```bash
        pnpm install
        pnpm dev --host 127.0.0.1 --port {APP_PORT}
        ```

        Optional notification rail base URL:

        ```text
        http://127.0.0.1:{APP_PORT}/?notificationBaseUrl=http://127.0.0.1:{SERVICE_PORT}
        ```

        The app embeds seeded data and still loads without the rail service. When the rail is present it uses the HTTP API for simulation, webhook retry, repair, and settlement actions.
        """
    ).strip()


def render_service_readme() -> str:
    return textwrap.dedent(
        f"""
        # mock-notification-rail

        Local notification rail twin for `seq_033`.

        ## Run

        ```bash
        pnpm start
        ```

        Defaults:

        - Host: `127.0.0.1`
        - Port: `{SERVICE_PORT}`

        ## HTTP surfaces

        - `GET /api/health`
        - `GET /api/registry`
        - `GET /api/messages`
        - `POST /api/messages/simulate`
        - `POST /api/messages/:id/retry-webhook`
        - `POST /api/messages/:id/repair`
        - `POST /api/messages/:id/settle`

        The service keeps transport acceptance, delivery evidence, dispute posture, repair, and authoritative settlement distinct on purpose.
        """
    ).strip()


def render_package_json(name: str, app: bool) -> str:
    if app:
        payload = {
            "name": name,
            "private": True,
            "version": "0.0.0",
            "type": "module",
            "scripts": {"dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview"},
            "dependencies": {"react": "^18.3.1", "react-dom": "^18.3.1"},
            "devDependencies": {
                "@types/react": "^18.3.12",
                "@types/react-dom": "^18.3.1",
                "@vitejs/plugin-react": "^4.3.1",
                "typescript": "^5.6.2",
                "vite": "^5.4.8",
            },
        }
    else:
        payload = {
            "name": name,
            "private": True,
            "version": "0.0.0",
            "type": "module",
            "scripts": {"start": "node src/server.js"},
        }
    return json.dumps(payload, indent=2)


def render_tsconfig() -> str:
    return textwrap.dedent(
        """
        {
          "compilerOptions": {
            "target": "ES2020",
            "useDefineForClassFields": true,
            "lib": ["DOM", "DOM.Iterable", "ES2020"],
            "allowJs": false,
            "skipLibCheck": true,
            "esModuleInterop": true,
            "allowSyntheticDefaultImports": true,
            "strict": true,
            "forceConsistentCasingInFileNames": true,
            "module": "ESNext",
            "moduleResolution": "Node",
            "resolveJsonModule": true,
            "isolatedModules": true,
            "noEmit": true,
            "jsx": "react-jsx"
          },
          "include": ["src"],
          "references": []
        }
        """
    ).strip()


def render_vite_config() -> str:
    return textwrap.dedent(
        """
        import { defineConfig } from "vite";
        import react from "@vitejs/plugin-react";

        export default defineConfig({
          plugins: [react()],
        });
        """
    ).strip()


def render_index_html(title: str) -> str:
    return textwrap.dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" href="data:," />
            <title>{title}</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
        """
    ).strip()


def render_main_tsx() -> str:
    return textwrap.dedent(
        """
        import React from "react";
        import ReactDOM from "react-dom/client";

        import App from "./App";
        import "./styles.css";

        ReactDOM.createRoot(document.getElementById("root")!).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>,
        );
        """
    ).strip()


def render_pack_ts(pack: dict[str, Any]) -> str:
    return "export const notificationStudioPack = " + json.dumps(pack, indent=2) + ";\n"


def render_app_styles() -> str:
    return textwrap.dedent(
        """
        :root {
          --canvas: #f7f8fa;
          --panel: #ffffff;
          --inset: #eff2f6;
          --text-strong: #101828;
          --text-default: #1d2939;
          --text-muted: #667085;
          --border-subtle: #e4e7ec;
          --border-default: #d0d5dd;
          --primary: #2457f5;
          --secondary: #c11574;
          --sms: #b54708;
          --email: #7a5af8;
          --success: #12b76a;
          --blocked: #c24141;
          --shadow-soft: 0 20px 56px rgba(16, 24, 40, 0.08);
          --shadow-strong: 0 28px 88px rgba(36, 87, 245, 0.12);
          --radius: 24px;
          --button-height: 44px;
          --chip-height: 28px;
          --header-height: 72px;
          --transition-fast: 120ms ease;
          --transition-medium: 180ms ease;
          --transition-slow: 240ms ease;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          min-height: 100%;
        }

        body {
          margin: 0;
          color: var(--text-default);
          font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(36, 87, 245, 0.12), transparent 26%),
            radial-gradient(circle at top right, rgba(193, 21, 116, 0.08), transparent 20%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(247, 248, 250, 0.98)),
            var(--canvas);
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        [role="tab"]:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-subtle);
          text-align: left;
          vertical-align: top;
        }

        thead th {
          color: var(--text-muted);
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        input,
        select,
        textarea {
          min-height: var(--button-height);
          border-radius: 16px;
          border: 1px solid var(--border-default);
          background: rgba(255, 255, 255, 0.96);
          color: var(--text-default);
          padding: 0 14px;
        }

        textarea {
          min-height: 132px;
          padding: 14px;
          resize: vertical;
        }

        .studio-shell {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px;
        }

        .top-banner,
        .panel,
        .metric-card,
        .template-button,
        .page-tab,
        .message-button,
        .event-card,
        .flow-card {
          border: 1px solid rgba(208, 213, 221, 0.96);
          border-radius: var(--radius);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: var(--shadow-soft);
          backdrop-filter: blur(14px);
        }

        .top-banner {
          position: sticky;
          top: 0;
          z-index: 9;
          min-height: var(--header-height);
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 420px);
          gap: 20px;
          margin-bottom: 20px;
          padding: 18px;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 360px;
          gap: 20px;
          align-items: start;
        }

        .left-column,
        .center-column,
        .right-column,
        .panel-stack,
        .page-tabs,
        .template-list,
        .message-list,
        .event-list,
        .detail-list,
        .form-grid,
        .metric-grid,
        .flow-track {
          display: grid;
          gap: 16px;
        }

        .brand-row,
        .ribbon-row,
        .chip-row,
        .summary-row,
        .button-row,
        .page-tabs,
        .mode-toggle,
        .header-row,
        .version-row,
        .flow-strip,
        .inspector-list {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .brand-row,
        .header-row {
          justify-content: space-between;
        }

        .wordmark {
          width: 48px;
          height: 48px;
          flex: none;
        }

        .brand-copy {
          display: grid;
          gap: 8px;
        }

        .mock-ribbon,
        .mono-chip,
        .status-chip,
        .tone-chip,
        .metric-pill {
          display: inline-flex;
          align-items: center;
          min-height: var(--chip-height);
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 12px;
        }

        .mock-ribbon {
          color: var(--primary);
          background: rgba(36, 87, 245, 0.1);
          letter-spacing: 0.08em;
        }

        .mono-chip,
        .mono,
        code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .mono-chip {
          color: var(--text-strong);
          background: rgba(16, 24, 40, 0.06);
        }

        .status-chip {
          background: rgba(36, 87, 245, 0.08);
          color: var(--primary);
        }

        .tone-success {
          background: rgba(18, 183, 106, 0.12);
          color: var(--success);
        }

        .tone-review {
          background: rgba(122, 90, 248, 0.12);
          color: var(--email);
        }

        .tone-blocked {
          background: rgba(194, 65, 65, 0.12);
          color: var(--blocked);
        }

        .tone-sms {
          background: rgba(181, 71, 8, 0.12);
          color: var(--sms);
        }

        .tone-email {
          background: rgba(122, 90, 248, 0.12);
          color: var(--email);
        }

        .metric-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .metric-card,
        .panel,
        .flow-card {
          padding: 18px;
        }

        .metric-card strong {
          display: block;
          margin-top: 10px;
          color: var(--text-strong);
          font-size: 24px;
        }

        .page-tab,
        .template-button,
        .message-button,
        .mode-button,
        .action-button {
          min-height: var(--button-height);
          border: 1px solid var(--border-default);
          border-radius: 18px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.92);
          color: var(--text-default);
          transition:
            transform var(--transition-fast),
            border-color var(--transition-fast),
            background-color var(--transition-fast);
        }

        .page-tab:hover,
        .template-button:hover,
        .message-button:hover,
        .mode-button:hover,
        .action-button:hover {
          transform: translateY(-1px);
          border-color: rgba(36, 87, 245, 0.32);
        }

        .page-tab.active,
        .template-button.active,
        .message-button.active,
        .mode-button.active {
          border-color: transparent;
          color: #fff;
          background: linear-gradient(135deg, var(--primary), #4f7cff);
          box-shadow: var(--shadow-strong);
        }

        .template-button {
          display: grid;
          justify-items: start;
          gap: 8px;
          min-height: 92px;
          padding: 16px;
          text-align: left;
        }

        .message-button {
          display: grid;
          justify-items: start;
          gap: 8px;
          min-height: 90px;
          padding: 16px;
          text-align: left;
        }

        .version-chip {
          border: 1px solid var(--border-default);
          border-radius: 999px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.88);
          color: var(--text-default);
        }

        .version-chip.active {
          border-color: transparent;
          background: rgba(36, 87, 245, 0.12);
          color: var(--primary);
        }

        .preview-pane,
        .timeline-pane,
        .inspector-pane,
        .table-pane {
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          background: var(--panel);
          padding: 18px;
        }

        .preview-body {
          min-height: 180px;
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          background: var(--inset);
          padding: 18px;
          white-space: pre-wrap;
        }

        .event-card {
          padding: 14px 16px;
          background: rgba(239, 242, 246, 0.74);
        }

        .event-card strong {
          display: block;
          margin-bottom: 4px;
          color: var(--text-strong);
        }

        .detail-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .detail-card {
          min-height: 160px;
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          background: rgba(239, 242, 246, 0.72);
          padding: 16px;
        }

        .form-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .caption {
          color: var(--text-muted);
          font-size: 12px;
        }

        .button-row {
          justify-content: flex-start;
        }

        .action-button.primary {
          border-color: transparent;
          color: #fff;
          background: linear-gradient(135deg, var(--primary), #4f7cff);
        }

        .action-button.secondary {
          border-color: transparent;
          color: #fff;
          background: linear-gradient(135deg, var(--secondary), #dc4e94);
        }

        .action-button.ghost {
          background: rgba(255, 255, 255, 0.8);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .flow-card {
          margin-top: 20px;
        }

        .flow-strip {
          justify-content: space-between;
          gap: 8px;
        }

        .flow-node {
          flex: 1;
          min-height: 72px;
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          background: rgba(239, 242, 246, 0.7);
          padding: 14px;
          text-align: center;
        }

        .flow-arrow {
          flex: none;
          color: var(--text-muted);
        }

        .inspector-list {
          align-items: flex-start;
          justify-content: flex-start;
        }

        .inspector-row {
          width: 100%;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
          margin-bottom: 12px;
        }

        .empty-state {
          min-height: 180px;
          display: grid;
          place-items: center;
          border: 1px dashed var(--border-default);
          border-radius: 20px;
          color: var(--text-muted);
          background: rgba(239, 242, 246, 0.7);
        }

        @media (max-width: 1180px) {
          .top-banner {
            grid-template-columns: 1fr;
          }

          .workspace-grid {
            grid-template-columns: 1fr;
          }

          .metric-grid,
          .detail-list,
          .form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .studio-shell {
            padding: 16px;
          }

          .metric-grid,
          .detail-list,
          .form-grid {
            grid-template-columns: 1fr;
          }

          .flow-strip {
            flex-direction: column;
          }

          .flow-arrow {
            transform: rotate(90deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        """
    ).strip()


def render_app_tsx() -> str:
    return textwrap.dedent(
        """
        import { useEffect, useState } from "react";

        import { notificationStudioPack } from "./generated/notificationStudioPack";

        type Pack = typeof notificationStudioPack;
        type TemplateRow = Pack["template_registry"][number];
        type SenderRow = Pack["sender_and_domain_rows"][number];
        type RoutingPlanRow = Pack["routing_plans"][number];
        type MessageRow = Pack["seeded_messages"][number];
        type ScenarioRow = Pack["delivery_scenarios"][number];
        type GateRow = Pack["live_gate_pack"]["live_gates"][number];
        type Page =
          | "Project_and_Environment_Setup"
          | "Template_Gallery"
          | "Routing_Plan_Studio"
          | "Delivery_Truth_Inspector"
          | "Live_Gates_and_Sender_Readiness";
        type Mode = "mock" | "actual";

        type AppState = {
          mode: Mode;
          page: Page;
          selectedTemplateId: string;
          selectedMessageId: string;
          selectedScenarioId: string;
          serviceBaseUrl: string;
          actualInputs: {
            vendorId: string;
            projectScope: string;
            senderRef: string;
            domainRef: string;
            callbackBaseUrl: string;
            webhookSecretRef: string;
            targetEnvironment: string;
            namedApprover: string;
            allowMutation: string;
            allowSpend: string;
          };
          reducedMotion: boolean;
        };

        const STORAGE_KEY = "quiet-send-studio-state";
        const PAGE_ORDER: readonly Page[] = [
          "Project_and_Environment_Setup",
          "Template_Gallery",
          "Routing_Plan_Studio",
          "Delivery_Truth_Inspector",
          "Live_Gates_and_Sender_Readiness",
        ];

        function clone<T>(value: T): T {
          return JSON.parse(JSON.stringify(value)) as T;
        }

        function templateById(id: string): TemplateRow {
          return (
            notificationStudioPack.template_registry.find((row) => row.template_id === id) ??
            notificationStudioPack.template_registry[0]
          );
        }

        function routingPlanById(id: string): RoutingPlanRow {
          return (
            notificationStudioPack.routing_plans.find((row) => row.routing_plan_ref === id) ??
            notificationStudioPack.routing_plans[0]
          );
        }

        function scenarioById(id: string): ScenarioRow {
          return (
            notificationStudioPack.delivery_scenarios.find((row) => row.scenario_id === id) ??
            notificationStudioPack.delivery_scenarios[0]
          );
        }

        function materializeTimeline(
          messageId: string,
          templates: readonly { state: string; label: string; tone: string; detail: string; offset_minutes: number }[],
          baseAt: Date,
          startingIndex = 0,
        ) {
          return templates.map((event, index) => ({
            event_id: `${messageId}-E${startingIndex + index + 1}`,
            state: event.state,
            label: event.label,
            tone: event.tone,
            detail: event.detail,
            at: new Date(baseAt.getTime() + event.offset_minutes * 60_000).toISOString(),
          }));
        }

        function nextMessageId(messages: readonly MessageRow[]): string {
          const highest =
            messages
              .map((row) => Number(row.message_id.split("-").pop()))
              .filter((value) => Number.isFinite(value))
              .sort((a, b) => b - a)[0] ?? 1000;
          return `MSG-LAB-${highest + 1}`;
        }

        function buildLocalMessage(messageId: string, scenario: ScenarioRow, template: TemplateRow): MessageRow {
          const createdAt = new Date();
          return {
            message_id: messageId,
            scenario_id: scenario.scenario_id,
            template_id: template.template_id,
            template_family_ref: template.template_family_ref,
            template_version_label: template.version_label,
            channel: template.channel,
            message_intent: template.message_intent,
            routing_plan_ref: template.routing_plan_ref,
            sender_identity_ref: template.sender_identity_ref,
            environment_profile: scenario.environment_profile,
            recipient_ref: `synthetic:runtime:${messageId.toLowerCase()}`,
            created_at: createdAt.toISOString(),
            transport_state: scenario.transport_state,
            delivery_evidence_state: scenario.delivery_evidence_state,
            delivery_risk_state: scenario.delivery_risk_state,
            authoritative_outcome_state: scenario.authoritative_outcome_state,
            repair_state: scenario.repair_state,
            webhook_signature_state: scenario.webhook_signature_state,
            dispute_state: scenario.dispute_state,
            summary: scenario.summary,
            timeline_events: materializeTimeline(messageId, scenario.timeline_templates, createdAt),
            can_retry_webhook: scenario.can_retry_webhook,
            can_repair: scenario.can_repair,
            can_settle: scenario.can_settle,
          };
        }

        function localRetryWebhook(message: MessageRow, scenario: ScenarioRow): MessageRow {
          const appended = materializeTimeline(
            message.message_id,
            scenario.settle_timeline_templates,
            new Date(),
            message.timeline_events.length,
          );
          return {
            ...message,
            webhook_signature_state: "validated",
            delivery_evidence_state: "delivered",
            delivery_risk_state: "on_track",
            can_retry_webhook: false,
            can_settle: true,
            timeline_events: message.timeline_events.concat(appended),
          };
        }

        function localRepairMessage(message: MessageRow, scenario: ScenarioRow): MessageRow {
          const appended = materializeTimeline(
            message.message_id,
            scenario.repair_timeline_templates,
            new Date(),
            message.timeline_events.length,
          );
          return {
            ...message,
            delivery_evidence_state: "delivered",
            delivery_risk_state: "on_track",
            authoritative_outcome_state: "recovery_required",
            repair_state: "repaired",
            can_repair: false,
            can_settle: true,
            timeline_events: message.timeline_events.concat(appended),
          };
        }

        function localSettleMessage(message: MessageRow, scenario: ScenarioRow): MessageRow {
          const appended = materializeTimeline(
            message.message_id,
            scenario.settle_timeline_templates,
            new Date(),
            message.timeline_events.length,
          );
          return {
            ...message,
            authoritative_outcome_state:
              message.delivery_evidence_state === "suppressed" ? "suppressed" : "settled",
            can_settle: false,
            timeline_events: message.timeline_events.concat(appended),
          };
        }

        function initialState(): AppState {
          const params = new URLSearchParams(window.location.search);
          const base: AppState = {
            mode: params.get("mode") === "actual" ? "actual" : "mock",
            page:
              (params.get("page") as Page | null) ??
              "Project_and_Environment_Setup",
            selectedTemplateId: notificationStudioPack.template_registry[0].template_id,
            selectedMessageId: notificationStudioPack.seeded_messages[0].message_id,
            selectedScenarioId: notificationStudioPack.delivery_scenarios[0].scenario_id,
            serviceBaseUrl:
              params.get("notificationBaseUrl") ??
              notificationStudioPack.mock_service.base_url_default,
            actualInputs: {
              vendorId: notificationStudioPack.live_gate_pack.allowed_vendor_ids[0] ?? "mailgun_email",
              projectScope: notificationStudioPack.project_scopes[0].project_scope,
              senderRef: notificationStudioPack.sender_and_domain_rows[0].identity_ref,
              domainRef: "placeholder.vecells.example",
              callbackBaseUrl: "https://example.invalid/notification",
              webhookSecretRef: "vault://notifications/webhook",
              targetEnvironment: "provider_like_preprod",
              namedApprover: "",
              allowMutation: "false",
              allowSpend: "false",
            },
            reducedMotion: false,
          };
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (!raw) {
            return base;
          }
          try {
            const parsed = JSON.parse(raw) as Partial<AppState>;
            return {
              ...base,
              ...parsed,
              actualInputs: {
                ...base.actualInputs,
                ...(parsed.actualInputs ?? {}),
              },
            };
          } catch {
            return base;
          }
        }

        function App() {
          const [appState, setAppState] = useState<AppState>(initialState);
          const [messages, setMessages] = useState<MessageRow[]>(clone(notificationStudioPack.seeded_messages));
          const [serviceStatus, setServiceStatus] = useState("checking");

          useEffect(() => {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
          }, [appState]);

          useEffect(() => {
            const media = window.matchMedia("(prefers-reduced-motion: reduce)");
            const sync = () =>
              setAppState((current) => ({
                ...current,
                reducedMotion: media.matches,
              }));
            sync();
            media.addEventListener("change", sync);
            return () => media.removeEventListener("change", sync);
          }, []);

          useEffect(() => {
            let cancelled = false;
            async function syncRemote() {
              try {
                const [healthResponse, messagesResponse] = await Promise.all([
                  fetch(`${appState.serviceBaseUrl}/api/health`, { cache: "no-store" }),
                  fetch(`${appState.serviceBaseUrl}/api/messages`, { cache: "no-store" }),
                ]);
                if (!healthResponse.ok || !messagesResponse.ok) {
                  throw new Error("Service unavailable");
                }
                const health = await healthResponse.json();
                const messagePayload = await messagesResponse.json();
                if (!cancelled) {
                  setServiceStatus(health.status);
                  setMessages(messagePayload.messages);
                }
              } catch {
                if (!cancelled) {
                  setServiceStatus("offline");
                }
              }
            }
            syncRemote();
            return () => {
              cancelled = true;
            };
          }, [appState.serviceBaseUrl]);

          const selectedTemplate = templateById(appState.selectedTemplateId);
          const selectedScenario = scenarioById(appState.selectedScenarioId);
          const selectedMessage =
            messages.find((row) => row.message_id === appState.selectedMessageId) ?? messages[0];
          const selectedRoutingPlan = routingPlanById(selectedTemplate.routing_plan_ref);
          const versionRows = notificationStudioPack.template_registry.filter(
            (row) => row.template_family_ref === selectedTemplate.template_family_ref,
          );
          const familyRows = notificationStudioPack.template_registry.filter(
            (row, index, all) =>
              all.findIndex((candidate) => candidate.template_family_ref === row.template_family_ref) === index,
          );
          const senderRows = notificationStudioPack.sender_and_domain_rows.filter(
            (row) =>
              row.identity_ref === selectedTemplate.sender_identity_ref ||
              row.provider_scope === selectedRoutingPlan.primary_channel ||
              row.provider_scope === "shared",
          );
          const blockedGates = notificationStudioPack.live_gate_pack.live_gates.filter(
            (row) => row.status === "blocked",
          );
          const readinessCount = notificationStudioPack.sender_and_domain_rows.filter(
            (row) => row.routing_eligible === "yes",
          ).length;
          const webhookIssues = messages.filter((row) => row.webhook_signature_state === "signature_failed").length;

          async function simulateScenario() {
            const template = templateById(appState.selectedTemplateId);
            if (
              template.channel !== "dual_if_supported" &&
              template.channel !== selectedScenario.channel
            ) {
              return;
            }
            try {
              const response = await fetch(`${appState.serviceBaseUrl}/api/messages/simulate`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  scenario_id: selectedScenario.scenario_id,
                  template_id: template.template_id,
                }),
              });
              if (!response.ok) {
                throw new Error("Remote simulate failed");
              }
              const payload = await response.json();
              setMessages(payload.messages);
              setAppState((current) => ({ ...current, selectedMessageId: payload.message.message_id }));
              setServiceStatus("healthy");
            } catch {
              const messageId = nextMessageId(messages);
              const message = buildLocalMessage(messageId, selectedScenario, template);
              setMessages((current) => [message, ...current]);
              setAppState((current) => ({ ...current, selectedMessageId: messageId }));
            }
          }

          async function retryWebhook() {
            if (!selectedMessage) {
              return;
            }
            try {
              const response = await fetch(
                `${appState.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/retry-webhook`,
                {
                  method: "POST",
                },
              );
              if (!response.ok) {
                throw new Error("Remote retry failed");
              }
              const payload = await response.json();
              setMessages(payload.messages);
            } catch {
              const scenario = scenarioById(selectedMessage.scenario_id);
              setMessages((current) =>
                current.map((row) =>
                  row.message_id === selectedMessage.message_id ? localRetryWebhook(row, scenario) : row,
                ),
              );
            }
          }

          async function repairMessage() {
            if (!selectedMessage) {
              return;
            }
            try {
              const response = await fetch(
                `${appState.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/repair`,
                {
                  method: "POST",
                },
              );
              if (!response.ok) {
                throw new Error("Remote repair failed");
              }
              const payload = await response.json();
              setMessages(payload.messages);
            } catch {
              const scenario = scenarioById(selectedMessage.scenario_id);
              setMessages((current) =>
                current.map((row) =>
                  row.message_id === selectedMessage.message_id ? localRepairMessage(row, scenario) : row,
                ),
              );
            }
          }

          async function settleMessage() {
            if (!selectedMessage) {
              return;
            }
            try {
              const response = await fetch(
                `${appState.serviceBaseUrl}/api/messages/${selectedMessage.message_id}/settle`,
                {
                  method: "POST",
                },
              );
              if (!response.ok) {
                throw new Error("Remote settle failed");
              }
              const payload = await response.json();
              setMessages(payload.messages);
            } catch {
              const scenario = scenarioById(selectedMessage.scenario_id);
              setMessages((current) =>
                current.map((row) =>
                  row.message_id === selectedMessage.message_id ? localSettleMessage(row, scenario) : row,
                ),
              );
            }
          }

          function updateActualInput<K extends keyof AppState["actualInputs"]>(
            key: K,
            value: AppState["actualInputs"][K],
          ) {
            setAppState((current) => ({
              ...current,
              actualInputs: {
                ...current.actualInputs,
                [key]: value,
              },
            }));
          }

          const actualSubmitEnabled =
            notificationStudioPack.phase0_verdict !== "withheld" &&
            blockedGates.length === 0 &&
            appState.actualInputs.allowMutation === "true" &&
            appState.actualInputs.allowSpend === "true" &&
            appState.actualInputs.namedApprover.trim().length > 0;

          return (
            <main className="studio-shell" data-testid="notification-studio-shell">
              <header className="top-banner">
                <section className="brand-row">
                  <div className="brand-row">
                    <svg className="wordmark" viewBox="0 0 48 48" aria-hidden="true">
                      <defs>
                        <linearGradient id="quietSendGradient" x1="0%" x2="100%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#2457F5" />
                          <stop offset="100%" stopColor="#C11574" />
                        </linearGradient>
                      </defs>
                      <rect width="48" height="48" rx="16" fill="url(#quietSendGradient)" />
                      <path d="M15 16h6.5l7 9 7-9H42L28 33h-8z" fill="white" />
                    </svg>
                    <div className="brand-copy">
                      <div className="ribbon-row">
                        <span className="mock-ribbon">MOCK_NOTIFICATION_STUDIO</span>
                        <span className="mono-chip">{notificationStudioPack.visual_mode}</span>
                        <span className="status-chip">{serviceStatus === "healthy" ? "rail connected" : "local only"}</span>
                      </div>
                      <div>
                        <h1>Quiet Send Studio</h1>
                        <p>Calm, exact notification design work that keeps project setup downstream of delivery truth.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mode-toggle" data-testid="mode-toggle">
                    <button
                      type="button"
                      className={`mode-button ${appState.mode === "mock" ? "active" : ""}`}
                      onClick={() => setAppState((current) => ({ ...current, mode: "mock" }))}
                    >
                      Mock
                    </button>
                    <button
                      type="button"
                      data-testid="mode-toggle-actual"
                      className={`mode-button ${appState.mode === "actual" ? "active" : ""}`}
                      onClick={() => setAppState((current) => ({ ...current, mode: "actual", page: "Live_Gates_and_Sender_Readiness" }))}
                    >
                      Actual later
                    </button>
                  </div>
                </section>
                <section className="metric-grid">
                  <article className="metric-card">
                    <span className="caption">Active templates</span>
                    <strong>{notificationStudioPack.summary.template_count}</strong>
                    <p>Canonical registry rows with sender and route bindings.</p>
                  </article>
                  <article className="metric-card">
                    <span className="caption">Sender readiness</span>
                    <strong>{readinessCount}/{notificationStudioPack.summary.sender_row_count}</strong>
                    <p>Rows already usable in mock or preview posture.</p>
                  </article>
                  <article className="metric-card">
                    <span className="caption">Webhook health</span>
                    <strong>{webhookIssues === 0 ? "clean" : `${webhookIssues} review`}</strong>
                    <p>Signed callback issues stay explicit and block quiet success.</p>
                  </article>
                  <article className="metric-card">
                    <span className="caption">Live posture</span>
                    <strong>{notificationStudioPack.phase0_verdict}</strong>
                    <p>Real project or sender mutation stays fail-closed.</p>
                  </article>
                </section>
              </header>

              <section className="workspace-grid">
                <aside className="left-column panel" data-testid="template-rail">
                  <div className="panel-stack">
                    <div className="header-row">
                      <div>
                        <h2>Template rail</h2>
                        <p>Select the canonical family, then switch versions in the workspace.</p>
                      </div>
                    </div>
                    <div className="page-tabs" aria-label="Studio pages">
                      {PAGE_ORDER.map((page) => (
                        <button
                          key={page}
                          type="button"
                          role="tab"
                          data-testid={`page-tab-${page}`}
                          className={`page-tab ${appState.page === page ? "active" : ""}`}
                          onClick={() => setAppState((current) => ({ ...current, page }))}
                        >
                          {page.replace(/_/g, " ")}
                        </button>
                      ))}
                    </div>
                    <div className="template-list">
                      {familyRows.map((row) => (
                        <button
                          key={row.template_family_ref}
                          type="button"
                          data-testid={`template-button-${row.template_family_ref}`}
                          className={`template-button ${
                            selectedTemplate.template_family_ref === row.template_family_ref ? "active" : ""
                          }`}
                          onClick={() =>
                            setAppState((current) => ({
                              ...current,
                              selectedTemplateId: row.template_id,
                            }))
                          }
                        >
                          <strong>{row.template_family_ref.replace(/^TF_/, "").replace(/_/g, " ")}</strong>
                          <span className={`tone-chip ${row.channel === "sms" ? "tone-sms" : row.channel === "email" ? "tone-email" : "tone-review"}`}>
                            {row.channel}
                          </span>
                          <span>{row.notes}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                <section className="center-column" data-testid="workspace">
                  <article className="panel">
                    <div className="header-row">
                      <div>
                        <h2>{appState.page.replace(/_/g, " ")}</h2>
                        <p>{selectedTemplate.notes}</p>
                      </div>
                      <div className="version-row">
                        {versionRows.map((row) => (
                          <button
                            key={row.template_id}
                            type="button"
                            className={`version-chip ${row.template_id === selectedTemplate.template_id ? "active" : ""}`}
                            onClick={() =>
                              setAppState((current) => ({ ...current, selectedTemplateId: row.template_id }))
                            }
                          >
                            {row.version_label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {appState.page === "Project_and_Environment_Setup" && (
                      <div className="panel-stack">
                        <div className="detail-list">
                          {notificationStudioPack.environment_profiles.map((row) => (
                            <article key={row.environment_profile} className="detail-card">
                              <span className="mono-chip">{row.environment_profile}</span>
                              <h3>{row.label}</h3>
                              <p>{row.notes}</p>
                              <div className="panel-stack">
                                <span className="caption">Sender posture: {row.sender_posture}</span>
                                <span className="caption">Webhook posture: {row.webhook_posture}</span>
                                <span className="caption">Spend posture: {row.spend_posture}</span>
                              </div>
                            </article>
                          ))}
                        </div>
                        <div className="table-pane">
                          <h3>Selected project scopes</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Scope</th>
                                <th>Title</th>
                                <th>Channel</th>
                              </tr>
                            </thead>
                            <tbody>
                              {notificationStudioPack.project_scopes.map((scope) => (
                                <tr key={scope.project_scope}>
                                  <td className="mono">{scope.project_scope}</td>
                                  <td>{scope.title}</td>
                                  <td>{scope.channel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {appState.page === "Template_Gallery" && (
                      <div className="panel-stack">
                        <div className="preview-pane">
                          <div className="header-row">
                            <div>
                              <h3>{selectedTemplate.template_id}</h3>
                              <p>{selectedTemplate.message_intent.replace(/_/g, " ")}</p>
                            </div>
                            <div className="chip-row">
                              <span className="mono-chip">{selectedTemplate.channel}</span>
                              <span className="status-chip">{selectedTemplate.routing_plan_ref}</span>
                            </div>
                          </div>
                          <div className="preview-body">
                            {selectedTemplate.preview_subject ? `${selectedTemplate.preview_subject}\\n\\n` : ""}
                            {selectedTemplate.preview_body}
                          </div>
                        </div>
                        <div className="detail-list">
                          <article className="detail-card">
                            <h3>Personalisation fields</h3>
                            <p>{selectedTemplate.personalisation_fields.join(", ")}</p>
                          </article>
                          <article className="detail-card">
                            <h3>Copy rules</h3>
                            <p>{selectedTemplate.supports_markdown_or_rich_copy_rules}</p>
                          </article>
                          <article className="detail-card">
                            <h3>Mock use</h3>
                            <p>{selectedTemplate.mock_now_use}</p>
                          </article>
                          <article className="detail-card">
                            <h3>Actual later</h3>
                            <p>{selectedTemplate.actual_later_use}</p>
                          </article>
                        </div>
                      </div>
                    )}

                    {appState.page === "Routing_Plan_Studio" && (
                      <div className="panel-stack">
                        <div className="detail-list">
                          <article className="detail-card">
                            <h3>Primary channel</h3>
                            <p>{selectedRoutingPlan.primary_channel}</p>
                          </article>
                          <article className="detail-card">
                            <h3>Fallback channel</h3>
                            <p>{selectedRoutingPlan.fallback_channel}</p>
                          </article>
                          <article className="detail-card">
                            <h3>Sender binding</h3>
                            <p className="mono">{selectedRoutingPlan.sender_identity_ref}</p>
                          </article>
                          <article className="detail-card">
                            <h3>Repair rule</h3>
                            <p>{selectedRoutingPlan.repair_entry_rule.replace(/_/g, " ")}</p>
                          </article>
                        </div>
                        <div className="table-pane">
                          <h3>Validation checks</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Check</th>
                                <th>Status</th>
                                <th>Detail</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRoutingPlan.validation_checks.map((check) => (
                                <tr key={check.title}>
                                  <td>{check.title}</td>
                                  <td>{check.status}</td>
                                  <td>{check.detail}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {appState.page === "Delivery_Truth_Inspector" && (
                      <div className="panel-stack">
                        <div className="header-row">
                          <div>
                            <h3>Scenario simulation</h3>
                            <p>Simulate transport, evidence, dispute, repair, and settlement without live providers.</p>
                          </div>
                          <div className="button-row">
                            <select
                              data-testid="scenario-select"
                              value={appState.selectedScenarioId}
                              onChange={(event) =>
                                setAppState((current) => ({ ...current, selectedScenarioId: event.target.value }))
                              }
                            >
                              {notificationStudioPack.delivery_scenarios.map((row) => (
                                <option key={row.scenario_id} value={row.scenario_id}>
                                  {row.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="action-button primary"
                              data-testid="simulate-message-button"
                              onClick={simulateScenario}
                            >
                              Simulate message
                            </button>
                          </div>
                        </div>
                        <div className="message-list">
                          {messages.map((row) => (
                            <button
                              key={row.message_id}
                              type="button"
                              className={`message-button ${selectedMessage?.message_id === row.message_id ? "active" : ""}`}
                              onClick={() =>
                                setAppState((current) => ({ ...current, selectedMessageId: row.message_id }))
                              }
                            >
                              <strong>{row.message_id}</strong>
                              <span>{row.summary}</span>
                              <span className="mono-chip">{row.delivery_evidence_state}</span>
                            </button>
                          ))}
                        </div>
                        <div className="timeline-pane" data-testid="delivery-timeline">
                          {selectedMessage ? (
                            <>
                              <div className="header-row">
                                <div>
                                  <h3>{selectedMessage.message_id}</h3>
                                  <p>{selectedMessage.summary}</p>
                                </div>
                                <div className="button-row">
                                  <button
                                    type="button"
                                    className="action-button ghost"
                                    data-testid="retry-webhook-button"
                                    onClick={retryWebhook}
                                    disabled={!selectedMessage.can_retry_webhook}
                                  >
                                    Retry webhook
                                  </button>
                                  <button
                                    type="button"
                                    className="action-button secondary"
                                    data-testid="repair-message-button"
                                    onClick={repairMessage}
                                    disabled={!selectedMessage.can_repair}
                                  >
                                    Authorize repair
                                  </button>
                                  <button
                                    type="button"
                                    className="action-button primary"
                                    data-testid="settle-message-button"
                                    onClick={settleMessage}
                                    disabled={!selectedMessage.can_settle}
                                  >
                                    Settle chain
                                  </button>
                                </div>
                              </div>
                              <div className="detail-list" style={{ marginBottom: "16px" }}>
                                <article className="detail-card">
                                  <h3>Transport</h3>
                                  <p>{selectedMessage.transport_state}</p>
                                </article>
                                <article className="detail-card">
                                  <h3>Delivery evidence</h3>
                                  <p>{selectedMessage.delivery_evidence_state}</p>
                                </article>
                                <article className="detail-card">
                                  <h3>Risk</h3>
                                  <p>{selectedMessage.delivery_risk_state}</p>
                                </article>
                                <article className="detail-card">
                                  <h3>Authoritative outcome</h3>
                                  <p>{selectedMessage.authoritative_outcome_state}</p>
                                </article>
                              </div>
                              <div className="event-list">
                                {selectedMessage.timeline_events.map((event) => (
                                  <article key={event.event_id} className="event-card">
                                    <div className="header-row">
                                      <strong>{event.label}</strong>
                                      <span className={`tone-chip tone-${event.tone}`}>{event.state}</span>
                                    </div>
                                    <p>{event.detail}</p>
                                    <p className="caption mono">{event.at}</p>
                                  </article>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="empty-state">No message selected.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {appState.page === "Live_Gates_and_Sender_Readiness" && (
                      <div className="panel-stack">
                        <div className="form-grid">
                          <label className="field">
                            <span>Vendor</span>
                            <select
                              data-testid="actual-field-vendor-id"
                              value={appState.actualInputs.vendorId}
                              onChange={(event) => updateActualInput("vendorId", event.target.value)}
                            >
                              {notificationStudioPack.live_gate_pack.allowed_vendor_ids.map((vendorId) => (
                                <option key={vendorId} value={vendorId}>
                                  {vendorId}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Project scope</span>
                            <select
                              data-testid="actual-field-project-scope"
                              value={appState.actualInputs.projectScope}
                              onChange={(event) => updateActualInput("projectScope", event.target.value)}
                            >
                              {notificationStudioPack.project_scopes.map((scope) => (
                                <option key={scope.project_scope} value={scope.project_scope}>
                                  {scope.project_scope}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Sender ref</span>
                            <select
                              data-testid="actual-field-sender-ref"
                              value={appState.actualInputs.senderRef}
                              onChange={(event) => updateActualInput("senderRef", event.target.value)}
                            >
                              {notificationStudioPack.sender_and_domain_rows.map((row) => (
                                <option key={row.identity_ref} value={row.identity_ref}>
                                  {row.identity_ref}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Domain ref</span>
                            <input
                              data-testid="actual-field-domain-ref"
                              value={appState.actualInputs.domainRef}
                              onChange={(event) => updateActualInput("domainRef", event.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>Callback base URL</span>
                            <input
                              data-testid="actual-field-callback-base"
                              value={appState.actualInputs.callbackBaseUrl}
                              onChange={(event) => updateActualInput("callbackBaseUrl", event.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>Webhook secret ref</span>
                            <input
                              data-testid="actual-field-webhook-secret"
                              value={appState.actualInputs.webhookSecretRef}
                              onChange={(event) => updateActualInput("webhookSecretRef", event.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>Target environment</span>
                            <select
                              data-testid="actual-field-environment"
                              value={appState.actualInputs.targetEnvironment}
                              onChange={(event) => updateActualInput("targetEnvironment", event.target.value)}
                            >
                              {notificationStudioPack.environment_profiles.map((row) => (
                                <option key={row.environment_profile} value={row.environment_profile}>
                                  {row.environment_profile}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="field">
                            <span>Named approver</span>
                            <input
                              data-testid="actual-field-named-approver"
                              value={appState.actualInputs.namedApprover}
                              onChange={(event) => updateActualInput("namedApprover", event.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>ALLOW_REAL_PROVIDER_MUTATION</span>
                            <select
                              data-testid="actual-field-allow-mutation"
                              value={appState.actualInputs.allowMutation}
                              onChange={(event) => updateActualInput("allowMutation", event.target.value)}
                            >
                              <option value="false">false</option>
                              <option value="true">true</option>
                            </select>
                          </label>
                          <label className="field">
                            <span>ALLOW_SPEND</span>
                            <select
                              data-testid="actual-field-allow-spend"
                              value={appState.actualInputs.allowSpend}
                              onChange={(event) => updateActualInput("allowSpend", event.target.value)}
                            >
                              <option value="false">false</option>
                              <option value="true">true</option>
                            </select>
                          </label>
                        </div>
                        <div className="button-row">
                          <button
                            type="button"
                            className="action-button primary"
                            data-testid="actual-submit-button"
                            disabled={!actualSubmitEnabled}
                          >
                            Real project or sender mutation blocked
                          </button>
                        </div>
                        <div className="table-pane">
                          <h3>Live gates</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Gate</th>
                                <th>Status</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {notificationStudioPack.live_gate_pack.live_gates.map((gate) => (
                                <tr key={gate.gate_id}>
                                  <td className="mono">{gate.gate_id}</td>
                                  <td>{gate.status}</td>
                                  <td>{gate.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </article>

                  <article className="flow-card" data-testid="lower-diagram">
                    <div className="header-row">
                      <div>
                        <h2>Compose to settle</h2>
                        <p>The studio keeps one restrained flow diagram with adjacent table and timeline parity.</p>
                      </div>
                      {appState.reducedMotion && (
                        <span data-testid="reduced-motion-indicator" className="status-chip">
                          reduced motion
                        </span>
                      )}
                    </div>
                    <div className="flow-strip">
                      <div className="flow-node">compose</div>
                      <div className="flow-arrow">→</div>
                      <div className="flow-node">route</div>
                      <div className="flow-arrow">→</div>
                      <div className="flow-node">accepted</div>
                      <div className="flow-arrow">→</div>
                      <div className="flow-node">delivered or bounced</div>
                      <div className="flow-arrow">→</div>
                      <div className="flow-node">repair or settle</div>
                    </div>
                  </article>
                </section>

                <aside className="right-column panel" data-testid="inspector-panel">
                  <div className="panel-stack">
                    <div className="header-row">
                      <div>
                        <h2>Inspector</h2>
                        <p>Sender, domain, route, and truth settings for the current selection.</p>
                      </div>
                      <span className="mono-chip">{selectedTemplate.template_id}</span>
                    </div>
                    <div className="inspector-pane">
                      <div className="inspector-row">
                        <span className="caption">Routing plan</span>
                        <strong>{selectedRoutingPlan.title}</strong>
                        <p>{selectedRoutingPlan.notes}</p>
                      </div>
                      <div className="inspector-row">
                        <span className="caption">Sender ref</span>
                        <strong className="mono">{selectedTemplate.sender_identity_ref}</strong>
                      </div>
                      <div className="inspector-row">
                        <span className="caption">Current message truth</span>
                        <p>
                          {selectedMessage
                            ? `${selectedMessage.transport_state} / ${selectedMessage.delivery_evidence_state} / ${selectedMessage.authoritative_outcome_state}`
                            : "No message selected"}
                        </p>
                      </div>
                      <div className="inspector-list">
                        {senderRows.slice(0, 6).map((row: SenderRow) => (
                          <div key={row.identity_ref} className="detail-card">
                            <span className="mono-chip">{row.identity_ref}</span>
                            <h3>{row.verification_posture.replace(/_/g, " ")}</h3>
                            <p>{row.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="table-pane">
                      <h3>Gate snapshot</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Gate</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notificationStudioPack.live_gate_pack.live_gates.slice(0, 6).map((gate: GateRow) => (
                            <tr key={gate.gate_id}>
                              <td className="mono">{gate.gate_id}</td>
                              <td>{gate.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </aside>
              </section>
            </main>
          );
        }

        export default App;
        """
    ).strip()


def render_service_core() -> str:
    return textwrap.dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
        );

        const scenarioMap = new Map(PACK.delivery_scenarios.map((row) => [row.scenario_id, row]));
        const templateMap = new Map(PACK.template_registry.map((row) => [row.template_id, row]));

        let messages = PACK.seeded_messages.map((row) => JSON.parse(JSON.stringify(row)));
        let nextMessageOrdinal = 4000;

        function clone(value) {
          return JSON.parse(JSON.stringify(value));
        }

        function materializeTimeline(messageId, templates, baseAt, startingIndex = 0) {
          return templates.map((event, index) => ({
            event_id: `${messageId}-E${startingIndex + index + 1}`,
            state: event.state,
            label: event.label,
            tone: event.tone,
            detail: event.detail,
            at: new Date(baseAt.getTime() + event.offset_minutes * 60_000).toISOString(),
          }));
        }

        function buildMessage(messageId, scenario, template) {
          const createdAt = new Date();
          return {
            message_id: messageId,
            scenario_id: scenario.scenario_id,
            template_id: template.template_id,
            template_family_ref: template.template_family_ref,
            template_version_label: template.version_label,
            channel: template.channel,
            message_intent: template.message_intent,
            routing_plan_ref: template.routing_plan_ref,
            sender_identity_ref: template.sender_identity_ref,
            environment_profile: scenario.environment_profile,
            recipient_ref: `synthetic:runtime:${messageId.toLowerCase()}`,
            created_at: createdAt.toISOString(),
            transport_state: scenario.transport_state,
            delivery_evidence_state: scenario.delivery_evidence_state,
            delivery_risk_state: scenario.delivery_risk_state,
            authoritative_outcome_state: scenario.authoritative_outcome_state,
            repair_state: scenario.repair_state,
            webhook_signature_state: scenario.webhook_signature_state,
            dispute_state: scenario.dispute_state,
            summary: scenario.summary,
            timeline_events: materializeTimeline(messageId, scenario.timeline_templates, createdAt),
            can_retry_webhook: scenario.can_retry_webhook,
            can_repair: scenario.can_repair,
            can_settle: scenario.can_settle,
          };
        }

        function listMessages() {
          return clone(messages).sort((a, b) => b.created_at.localeCompare(a.created_at));
        }

        function health() {
          return {
            status: "healthy",
            message_count: messages.length,
            repair_open_count: messages.filter((row) => row.can_repair).length,
            webhook_alert_count: messages.filter((row) => row.webhook_signature_state === "signature_failed").length,
          };
        }

        function registry() {
          return {
            task_id: PACK.task_id,
            visual_mode: PACK.visual_mode,
            template_registry: PACK.template_registry,
            routing_plans: PACK.routing_plans,
            sender_and_domain_rows: PACK.sender_and_domain_rows,
            delivery_scenarios: PACK.delivery_scenarios,
            live_gate_pack: PACK.live_gate_pack,
          };
        }

        function simulateMessage(payload) {
          const scenario = scenarioMap.get(payload.scenario_id);
          const template = templateMap.get(payload.template_id);
          if (!scenario) {
            return { ok: false, status: 422, error: "Unknown scenario." };
          }
          if (!template) {
            return { ok: false, status: 422, error: "Unknown template." };
          }
          if (template.channel !== "dual_if_supported" && template.channel !== scenario.channel) {
            return { ok: false, status: 422, error: "Template channel is incompatible with the chosen scenario." };
          }
          nextMessageOrdinal += 1;
          const messageId = `MSG-LAB-${nextMessageOrdinal}`;
          const message = buildMessage(messageId, scenario, template);
          messages.unshift(message);
          return { ok: true, status: 201, message: clone(message), messages: listMessages() };
        }

        function retryWebhook(messageId) {
          const message = messages.find((row) => row.message_id === messageId);
          if (!message) {
            return { ok: false, status: 404, error: "Message not found." };
          }
          if (!message.can_retry_webhook) {
            return { ok: false, status: 422, error: "Message has no retryable webhook fault." };
          }
          const scenario = scenarioMap.get(message.scenario_id);
          const appended = materializeTimeline(
            message.message_id,
            scenario.settle_timeline_templates,
            new Date(),
            message.timeline_events.length,
          );
          message.webhook_signature_state = "validated";
          message.delivery_evidence_state = "delivered";
          message.delivery_risk_state = "on_track";
          message.can_retry_webhook = false;
          message.can_settle = true;
          message.timeline_events.push(...appended);
          return { ok: true, status: 200, message: clone(message), messages: listMessages() };
        }

        function repairMessage(messageId) {
          const message = messages.find((row) => row.message_id === messageId);
          if (!message) {
            return { ok: false, status: 404, error: "Message not found." };
          }
          if (!message.can_repair) {
            return { ok: false, status: 422, error: "Message is not currently repairable." };
          }
          const scenario = scenarioMap.get(message.scenario_id);
          const appended = materializeTimeline(
            message.message_id,
            scenario.repair_timeline_templates,
            new Date(),
            message.timeline_events.length,
          );
          message.delivery_evidence_state = "delivered";
          message.delivery_risk_state = "on_track";
          message.authoritative_outcome_state = "recovery_required";
          message.repair_state = "repaired";
          message.can_repair = false;
          message.can_settle = true;
          message.timeline_events.push(...appended);
          return { ok: true, status: 200, message: clone(message), messages: listMessages() };
        }

        function settleMessage(messageId) {
          const message = messages.find((row) => row.message_id === messageId);
          if (!message) {
            return { ok: false, status: 404, error: "Message not found." };
          }
          if (!message.can_settle) {
            return { ok: false, status: 422, error: "Message is not ready for settlement." };
          }
          const scenario = scenarioMap.get(message.scenario_id);
          const appended = materializeTimeline(
            message.message_id,
            scenario.settle_timeline_templates,
            new Date(),
            message.timeline_events.length,
          );
          message.authoritative_outcome_state =
            message.delivery_evidence_state === "suppressed" ? "suppressed" : "settled";
          message.can_settle = false;
          message.timeline_events.push(...appended);
          return { ok: true, status: 200, message: clone(message), messages: listMessages() };
        }

        export {
          PACK,
          health,
          listMessages,
          registry,
          repairMessage,
          retryWebhook,
          settleMessage,
          simulateMessage,
        };
        """
    ).strip()


def render_service_server() -> str:
    return textwrap.dedent(
        f"""
        import http from "node:http";
        import {{ URL }} from "node:url";

        import {{
          PACK,
          health,
          listMessages,
          registry,
          repairMessage,
          retryWebhook,
          settleMessage,
          simulateMessage,
        }} from "./railCore.js";

        const HOST = process.env.MOCK_NOTIFICATION_HOST ?? "127.0.0.1";
        const PORT = Number(process.env.MOCK_NOTIFICATION_PORT ?? "{SERVICE_PORT}");

        function writeJson(response, status, payload) {{
          response.writeHead(status, {{
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "content-type",
          }});
          response.end(JSON.stringify(payload, null, 2));
        }}

        function writeHtml(response, html) {{
          response.writeHead(200, {{
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
          }});
          response.end(html);
        }}

        function readBody(request) {{
          return new Promise((resolve, reject) => {{
            let body = "";
            request.on("data", (chunk) => {{
              body += chunk;
              if (body.length > 2_000_000) {{
                reject(new Error("Request body too large."));
              }}
            }});
            request.on("end", () => {{
              if (!body.trim()) {{
                resolve({{}});
                return;
              }}
              try {{
                resolve(JSON.parse(body));
              }} catch {{
                reject(new Error("Request body must be valid JSON."));
              }}
            }});
            request.on("error", reject);
          }});
        }}

        function playgroundHtml() {{
          const templateOptions = PACK.template_registry
            .map((row) => `<option value="${{row.template_id}}">${{row.template_id}} · ${{row.channel}}</option>`)
            .join("");
          const scenarioOptions = PACK.delivery_scenarios
            .map((row) => `<option value="${{row.scenario_id}}">${{row.label}}</option>`)
            .join("");
          return `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="data:," />
            <title>Vecells MOCK_NOTIFICATION_RAIL</title>
            <style>
              :root {{
                --canvas: #f7f8fa;
                --panel: #fff;
                --text: #1d2939;
                --muted: #667085;
                --line: #d0d5dd;
                --primary: #2457f5;
                --secondary: #c11574;
                --email: #7a5af8;
              }}
              * {{ box-sizing: border-box; }}
              body {{
                margin: 0;
                color: var(--text);
                font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at top left, rgba(36, 87, 245, 0.12), transparent 32%),
                  radial-gradient(circle at top right, rgba(193, 21, 116, 0.08), transparent 22%),
                  var(--canvas);
              }}
              h1, h2, p, pre {{ margin: 0; }}
              button, select {{
                font: inherit;
                min-height: 44px;
                border: 1px solid var(--line);
                border-radius: 16px;
                padding: 0 14px;
                background: #fff;
              }}
              button {{ cursor: pointer; }}
              .shell {{
                max-width: 1440px;
                margin: 0 auto;
                padding: 24px;
              }}
              .header, .panel, .event {{
                border: 1px solid rgba(208, 213, 221, 0.96);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.95);
                box-shadow: 0 20px 48px rgba(16, 24, 40, 0.08);
              }}
              .header {{
                position: sticky;
                top: 0;
                z-index: 4;
                min-height: 72px;
                padding: 18px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 20px;
              }}
              .brand {{ display: flex; align-items: center; gap: 14px; }}
              .mark {{
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                color: #fff;
                font-weight: 700;
                background: linear-gradient(135deg, var(--primary), var(--secondary));
              }}
              .ribbon, .chip {{
                display: inline-flex;
                align-items: center;
                min-height: 28px;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 12px;
              }}
              .ribbon {{ color: var(--primary); background: rgba(36, 87, 245, 0.1); }}
              .chip {{ background: rgba(122, 90, 248, 0.1); color: var(--email); }}
              .layout {{
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(360px, 420px);
                gap: 20px;
              }}
              .panel {{ padding: 18px; }}
              .controls, .actions, .facts {{ display: flex; gap: 12px; flex-wrap: wrap; }}
              .actions {{ margin-top: 16px; }}
              .actions .primary {{
                color: #fff;
                border-color: transparent;
                background: linear-gradient(135deg, var(--primary), #4f7cff);
              }}
              .actions .secondary {{
                color: #fff;
                border-color: transparent;
                background: linear-gradient(135deg, var(--secondary), #dc4e94);
              }}
              .message-list {{ display: grid; gap: 12px; margin-top: 16px; }}
              .event {{
                padding: 14px;
                background: rgba(239, 242, 246, 0.72);
              }}
              .event strong {{ display: block; margin-bottom: 4px; }}
              .mono {{ font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }}
              pre {{
                overflow: auto;
                max-height: 560px;
                padding: 16px;
                border-radius: 18px;
                background: #0f1728;
                color: #dce7f6;
              }}
              @media (max-width: 980px) {{
                .layout {{ grid-template-columns: 1fr; }}
              }}
            </style>
          </head>
          <body>
            <main class="shell" data-testid="notification-sandbox-shell">
              <header class="header">
                <div class="brand">
                  <div class="mark">V</div>
                  <div>
                    <div class="ribbon">MOCK_NOTIFICATION_RAIL</div>
                    <h1>Notification rail sandbox</h1>
                  </div>
                </div>
                <div class="facts" id="health-facts"></div>
              </header>
              <section class="layout">
                <article class="panel">
                  <h2>Simulate a notification</h2>
                  <p>Exercise provider acceptance, delivery evidence, dispute, and repair semantics without using live providers.</p>
                  <div class="controls" style="margin-top:16px">
                    <select id="template-id">${{templateOptions}}</select>
                    <select id="scenario-id">${{scenarioOptions}}</select>
                  </div>
                  <div class="actions">
                    <button class="primary" data-testid="simulate-button" id="simulate-button">Simulate</button>
                    <button class="secondary" id="retry-button">Retry webhook</button>
                    <button id="repair-button">Repair</button>
                    <button id="settle-button">Settle</button>
                  </div>
                  <div class="message-list" id="message-list"></div>
                </article>
                <aside class="panel">
                  <h2>Selected message</h2>
                  <p class="mono" id="selected-message-id">No message selected</p>
                  <pre data-testid="message-json" id="message-json">Select or simulate a message to inspect it here.</pre>
                </aside>
              </section>
            </main>
            <script type="module">
              const state = {{ selectedMessageId: null, messages: [] }};

              async function fetchJson(url, options) {{
                const response = await fetch(url, options);
                const payload = await response.json();
                if (!response.ok) {{
                  throw new Error(payload.error || "Request failed");
                }}
                return payload;
              }}

              function renderFacts(health) {{
                const facts = document.getElementById("health-facts");
                facts.innerHTML = "";
                [
                  "messages: " + health.message_count,
                  "repair open: " + health.repair_open_count,
                  "webhook alerts: " + health.webhook_alert_count,
                ].forEach((label) => {{
                  const chip = document.createElement("span");
                  chip.className = "chip";
                  chip.textContent = label;
                  facts.appendChild(chip);
                }});
              }}

              function renderSelection() {{
                const message = state.messages.find((row) => row.message_id === state.selectedMessageId);
                document.getElementById("selected-message-id").textContent = message ? message.message_id : "No message selected";
                document.getElementById("message-json").textContent = message
                  ? JSON.stringify(message, null, 2)
                  : "Select or simulate a message to inspect it here.";
              }}

              function renderMessages(messages) {{
                state.messages = messages;
                if (!state.selectedMessageId && messages.length) {{
                  state.selectedMessageId = messages[0].message_id;
                }}
                const root = document.getElementById("message-list");
                root.innerHTML = "";
                messages.forEach((message) => {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "event";
                  button.innerHTML =
                    "<strong>" + message.message_id + "</strong>" +
                    "<div>" + message.summary + "</div>" +
                    "<div class='mono'>" + message.delivery_evidence_state + " / " + message.authoritative_outcome_state + "</div>";
                  button.addEventListener("click", () => {{
                    state.selectedMessageId = message.message_id;
                    renderSelection();
                  }});
                  root.appendChild(button);
                }});
                renderSelection();
              }}

              async function refresh() {{
                const [healthPayload, messagesPayload] = await Promise.all([
                  fetchJson("/api/health"),
                  fetchJson("/api/messages"),
                ]);
                renderFacts(healthPayload);
                renderMessages(messagesPayload.messages);
              }}

              async function mutate(url, body) {{
                const payload = await fetchJson(url, {{
                  method: "POST",
                  headers: {{ "content-type": "application/json" }},
                  body: body ? JSON.stringify(body) : undefined,
                }});
                renderMessages(payload.messages);
                renderSelection();
                const healthPayload = await fetchJson("/api/health");
                renderFacts(healthPayload);
              }}

              document.getElementById("simulate-button").addEventListener("click", () => {{
                mutate("/api/messages/simulate", {{
                  template_id: document.getElementById("template-id").value,
                  scenario_id: document.getElementById("scenario-id").value,
                }}).catch((error) => window.alert(error.message));
              }});

              document.getElementById("retry-button").addEventListener("click", () => {{
                if (!state.selectedMessageId) return;
                mutate("/api/messages/" + state.selectedMessageId + "/retry-webhook").catch((error) => window.alert(error.message));
              }});

              document.getElementById("repair-button").addEventListener("click", () => {{
                if (!state.selectedMessageId) return;
                mutate("/api/messages/" + state.selectedMessageId + "/repair").catch((error) => window.alert(error.message));
              }});

              document.getElementById("settle-button").addEventListener("click", () => {{
                if (!state.selectedMessageId) return;
                mutate("/api/messages/" + state.selectedMessageId + "/settle").catch((error) => window.alert(error.message));
              }});

              refresh().catch((error) => {{
                document.getElementById("message-json").textContent = error.message;
              }});
            </script>
          </body>
        </html>`;
        }}

        async function handleMutatingRequest(response, request, handler, messageId = null) {{
          try {{
            const body = await readBody(request);
            const result = handler(messageId ?? body, body);
            if (!result.ok) {{
              writeJson(response, result.status, {{ error: result.error }});
              return;
            }}
            writeJson(response, result.status, result);
          }} catch (error) {{
            writeJson(response, 400, {{ error: error instanceof Error ? error.message : "Request failed." }});
          }}
        }}

        const server = http.createServer(async (request, response) => {{
          const method = request.method ?? "GET";
          const url = new URL(request.url ?? "/", `http://${{request.headers.host ?? `${{HOST}}:${{PORT}}`}}`);
          const pathname = url.pathname;

          if (method === "OPTIONS") {{
            response.writeHead(204, {{
              "access-control-allow-origin": "*",
              "access-control-allow-methods": "GET,POST,OPTIONS",
              "access-control-allow-headers": "content-type",
            }});
            response.end();
            return;
          }}

          if (method === "GET" && pathname === "/") {{
            writeHtml(response, playgroundHtml());
            return;
          }}
          if (method === "GET" && pathname === "/api/health") {{
            writeJson(response, 200, health());
            return;
          }}
          if (method === "GET" && pathname === "/api/registry") {{
            writeJson(response, 200, registry());
            return;
          }}
          if (method === "GET" && pathname === "/api/messages") {{
            writeJson(response, 200, {{ messages: listMessages() }});
            return;
          }}
          if (method === "POST" && pathname === "/api/messages/simulate") {{
            await handleMutatingRequest(response, request, (_unused, body) => simulateMessage(body));
            return;
          }}

          const retryMatch = pathname.match(/^\\/api\\/messages\\/([^/]+)\\/retry-webhook$/);
          if (method === "POST" && retryMatch) {{
            await handleMutatingRequest(response, request, (messageId) => retryWebhook(messageId), retryMatch[1]);
            return;
          }}

          const repairMatch = pathname.match(/^\\/api\\/messages\\/([^/]+)\\/repair$/);
          if (method === "POST" && repairMatch) {{
            await handleMutatingRequest(response, request, (messageId) => repairMessage(messageId), repairMatch[1]);
            return;
          }}

          const settleMatch = pathname.match(/^\\/api\\/messages\\/([^/]+)\\/settle$/);
          if (method === "POST" && settleMatch) {{
            await handleMutatingRequest(response, request, (messageId) => settleMessage(messageId), settleMatch[1]);
            return;
          }}

          writeJson(response, 404, {{ error: "Not found." }});
        }});

        server.listen(PORT, HOST, () => {{
          console.log(`mock-notification-rail listening on http://${{HOST}}:${{PORT}}`);
        }});
        """
    ).strip()


def render_studio_spec_test() -> str:
    return textwrap.dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
        );

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        async function run() {
          const { chromium } = await importPlaywright();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
          const baseUrl =
            process.env.MOCK_NOTIFICATION_STUDIO_URL ??
            "http://127.0.0.1:4191/?notificationBaseUrl=http://127.0.0.1:4190";

          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("[data-testid='notification-studio-shell']").waitFor();
          await page.locator("[data-testid='template-button-TF_EMAIL_DELIVERY_REPAIR']").click();
          await page.locator("text=delivery repair notice").waitFor();

          await page.locator("[data-testid='page-tab-Routing_Plan_Studio']").click();
          await page.locator("text=Validation checks").waitFor();

          await page.locator("[data-testid='page-tab-Delivery_Truth_Inspector']").click();
          await page.locator("[data-testid='scenario-select']").selectOption("email_bounce_repair_required");
          await page.locator("[data-testid='simulate-message-button']").click();
          await page.locator("text=repair required").waitFor();

          await page.locator("[data-testid='page-tab-Live_Gates_and_Sender_Readiness']").click();
          await page.locator("[data-testid='mode-toggle-actual']").click();
          await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
          const disabled = await page.locator("[data-testid='actual-submit-button']").isDisabled();
          if (!disabled) {
            throw new Error("Actual submit must stay disabled while Phase 0 remains withheld.");
          }

          await page.keyboard.press("Tab");
          await page.keyboard.press("Tab");
          await page.keyboard.press("Tab");

          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.reload({ waitUntil: "networkidle" });
          await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

          await page.setViewportSize({ width: 1024, height: 1100 });
          await page.locator("[data-testid='inspector-panel']").waitFor();
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.locator("[data-testid='template-rail']").waitFor();
          await page.setViewportSize({ width: 390, height: 844 });
          await page.locator("[data-testid='lower-diagram']").waitFor();

          const headings = await page.locator("h1, h2, h3").count();
          if (headings < 10) {
            throw new Error("Accessibility smoke failed: expected multiple headings in the notification studio.");
          }

          await browser.close();
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const notificationStudioManifest = {
          task: PACK.task_id,
          visualMode: PACK.visual_mode,
          templates: PACK.summary.template_count,
          scenarios: PACK.summary.scenario_count,
        };
        """
    ).strip()


def render_delivery_truth_test() -> str:
    return textwrap.dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
        );

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        async function run() {
          const { chromium } = await importPlaywright();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1280, height: 1080 } });
          const baseUrl = process.env.MOCK_NOTIFICATION_RAIL_URL ?? "http://127.0.0.1:4190/";

          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("[data-testid='notification-sandbox-shell']").waitFor();

          await page.locator("#scenario-id").selectOption("email_webhook_signature_retry");
          await page.locator("[data-testid='simulate-button']").click();
          await page.locator("text=delivery truth held").waitFor();
          await page.locator("#retry-button").click();
          await page.locator("text=webhook signature validated").waitFor();

          await page.locator("#scenario-id").selectOption("sms_wrong_recipient_disputed");
          await page.locator("[data-testid='simulate-button']").click();
          await page.locator("text=wrong recipient suspected").waitFor();
          await page.locator("#repair-button").click();
          await page.locator("text=challenge fallback selected").waitFor();

          await browser.close();
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const deliveryTruthCoverage = {
          task: PACK.task_id,
          seededMessages: PACK.summary.seeded_message_count,
          coversDisputeAndRepair: true,
        };
        """
    ).strip()


def render_dry_run_harness() -> str:
    return textwrap.dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
        );

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        function requiredLiveEnv() {
          return PACK.live_gate_pack.required_env;
        }

        function validateLiveGateInputs() {
          for (const envVar of requiredLiveEnv()) {
            assertCondition(process.env[envVar], `Missing required live gate input: ${envVar}`);
          }
          assertCondition(
            PACK.phase0_verdict === "withheld",
            "This harness expects the live posture to remain blocked while Phase 0 is withheld.",
          );
          assertCondition(
            PACK.live_gate_pack.allowed_vendor_ids.includes(process.env.NOTIFICATION_VENDOR_ID),
            "Chosen notification vendor is not on the task 031 shortlist.",
          );
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This harness needs the `playwright` package when run with --run.");
          }
        }

        async function run() {
          const targetUrl =
            process.env.MOCK_NOTIFICATION_STUDIO_URL ??
            "http://127.0.0.1:4191/?mode=actual&page=Live_Gates_and_Sender_Readiness&notificationBaseUrl=http://127.0.0.1:4190";
          const selectors = PACK.live_gate_pack.selector_map.base_profile;
          const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

          if (realMutationRequested) {
            validateLiveGateInputs();
          }

          const { chromium } = await importPlaywright();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

          await page.goto(targetUrl, { waitUntil: "networkidle" });
          await page.locator(selectors.mode_toggle_actual).click();
          await page.locator(selectors.page_tab_live_gates).click();
          await page.locator(selectors.field_vendor).selectOption(
            process.env.NOTIFICATION_VENDOR_ID ?? PACK.live_gate_pack.allowed_vendor_ids[0],
          );
          await page.locator(selectors.field_project_scope).selectOption(
            process.env.NOTIFICATION_PROJECT_SCOPE ?? PACK.project_scopes[0].project_scope,
          );
          await page.locator(selectors.field_sender_ref).selectOption(
            process.env.NOTIFICATION_SENDER_REF ?? PACK.sender_and_domain_rows[0].identity_ref,
          );
          await page.locator(selectors.field_domain_ref).fill(
            process.env.NOTIFICATION_DOMAIN_REF ?? "placeholder.vecells.example",
          );
          await page.locator(selectors.field_callback_base).fill(
            process.env.NOTIFICATION_CALLBACK_BASE_URL ?? "https://example.invalid/notification",
          );
          await page.locator(selectors.field_secret_ref).fill(
            process.env.NOTIFICATION_WEBHOOK_SECRET_REF ?? "vault://notifications/webhook",
          );
          await page.locator(selectors.field_environment).selectOption(
            process.env.NOTIFICATION_TARGET_ENVIRONMENT ?? "provider_like_preprod",
          );
          await page.locator(selectors.field_approver).fill(
            process.env.NOTIFICATION_NAMED_APPROVER ?? "dry-run approver",
          );
          await page.locator(selectors.field_allow_mutation).selectOption(
            realMutationRequested ? "true" : "false",
          );
          await page.locator(selectors.field_allow_spend).selectOption(
            process.env.ALLOW_SPEND === "true" ? "true" : "false",
          );

          const buttonDisabled = await page.locator(selectors.final_submit).isDisabled();
          assertCondition(
            buttonDisabled,
            "Dry-run posture drifted: actual submit must stay disabled while Phase 0 remains withheld.",
          );

          await browser.close();
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const notificationDryRunManifest = {
          task: PACK.task_id,
          requiredLiveEnv: requiredLiveEnv(),
          allowedVendors: PACK.live_gate_pack.allowed_vendor_ids,
        };
        """
    ).strip()


def generate_outputs(pack: dict[str, Any]) -> None:
    field_map = field_map_json(pack)

    write_json(PACK_JSON_PATH, pack)
    write_json(FIELD_MAP_JSON_PATH, field_map)
    write_csv(
        SENDER_MATRIX_CSV_PATH,
        pack["sender_and_domain_rows"],
        [
            "identity_ref",
            "channel",
            "provider_scope",
            "environment_profile",
            "identity_kind",
            "verification_posture",
            "routing_eligible",
            "webhook_profile_ref",
            "lane",
            "source_refs",
            "notes",
        ],
    )
    write_csv(
        TEMPLATE_REGISTRY_CSV_PATH,
        pack["template_registry"],
        [
            "template_id",
            "template_family_ref",
            "version_label",
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
            "preview_subject",
            "preview_body",
        ],
    )
    write_json(LIVE_GATE_JSON_PATH, pack["live_gate_pack"])

    write_text(LOCAL_SPEC_DOC_PATH, render_local_notification_studio_spec(pack))
    write_text(FIELD_MAP_DOC_PATH, render_field_map_doc(pack, field_map))
    write_text(SENDER_DOC_PATH, render_sender_doc(pack))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(pack))

    ensure_dir(APP_DIR)
    ensure_dir(APP_SRC_DIR / "generated")
    ensure_dir(APP_PUBLIC_DIR)
    write_text(APP_DIR / "README.md", render_app_readme(pack))
    write_text(APP_DIR / "package.json", render_package_json("mock-notification-studio", app=True))
    write_text(APP_DIR / "tsconfig.json", render_tsconfig())
    write_text(APP_DIR / "vite.config.ts", render_vite_config())
    write_text(APP_DIR / "index.html", render_index_html("Vecells Quiet Send Studio"))
    write_text(APP_SRC_DIR / "main.tsx", render_main_tsx())
    write_text(APP_SRC_DIR / "styles.css", render_app_styles())
    write_text(APP_SRC_DIR / "App.tsx", render_app_tsx())
    write_text(APP_PACK_TS_PATH, render_pack_ts(pack))
    write_json(APP_PACK_JSON_PATH, pack)

    ensure_dir(SERVICE_DIR)
    ensure_dir(SERVICE_SRC_DIR)
    write_text(SERVICE_DIR / "README.md", render_service_readme())
    write_text(SERVICE_DIR / "package.json", render_package_json("mock-notification-rail", app=False))
    write_text(SERVICE_SRC_DIR / "railCore.js", render_service_core())
    write_text(SERVICE_SRC_DIR / "server.js", render_service_server())

    ensure_dir(TESTS_DIR)
    write_text(TESTS_DIR / "mock-notification-studio.spec.js", render_studio_spec_test())
    write_text(TESTS_DIR / "mock-notification-delivery-truth.spec.js", render_delivery_truth_test())

    ensure_dir(BROWSER_AUTOMATION_DIR)
    write_text(BROWSER_AUTOMATION_DIR / "notification-project-dry-run.spec.js", render_dry_run_harness())


def main() -> None:
    pack = build_pack()
    generate_outputs(pack)
    print(
        json.dumps(
            {
                "task_id": TASK_ID,
                "generated_at": pack["generated_at"],
                "summary": pack["summary"],
                "phase0_verdict": pack["phase0_verdict"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
