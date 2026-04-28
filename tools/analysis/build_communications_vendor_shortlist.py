#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "seq_031"
CAPTURED_ON = "2026-04-09"
VISUAL_MODE = "Signal_Fabric_Atlas"
MISSION = (
    "Create the communications vendor-selection dossier for telephony / IVR, SMS, and email "
    "while freezing the internal mock-now lane, the current official vendor evidence set, and "
    "the fail-closed actual-provider-later shortlist used by seq_032 and seq_033."
)

REQUIRED_INPUTS = {
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
}

UNIVERSE_CSV_PATH = DATA_DIR / "31_vendor_universe.csv"
SHORTLIST_JSON_PATH = DATA_DIR / "31_vendor_shortlist.json"
EVIDENCE_JSONL_PATH = DATA_DIR / "31_vendor_research_evidence.jsonl"
LANE_MATRIX_CSV_PATH = DATA_DIR / "31_mock_vs_actual_vendor_lane_matrix.csv"
KILL_SWITCHES_CSV_PATH = DATA_DIR / "31_vendor_kill_switches.csv"

UNIVERSE_DOC_PATH = DOCS_DIR / "31_vendor_universe_telephony_sms_email.md"
MOCK_DOC_PATH = DOCS_DIR / "31_mock_provider_lane_for_communications.md"
SHORTLIST_DOC_PATH = DOCS_DIR / "31_actual_provider_shortlist_and_due_diligence.md"
DECISION_LOG_DOC_PATH = DOCS_DIR / "31_vendor_selection_decision_log.md"
EVIDENCE_DOC_PATH = DOCS_DIR / "31_vendor_research_evidence_register.md"
ATLAS_HTML_PATH = DOCS_DIR / "31_vendor_signal_fabric_atlas.html"

SOURCE_PRECEDENCE = [
    "prompt/031.md",
    "prompt/032.md",
    "prompt/033.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "data/analysis/provider_family_scorecards.json",
    "data/analysis/integration_priority_matrix.json",
    "data/analysis/external_account_inventory.csv",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/22_actual_provider_due_diligence_playbook.md",
    "docs/external/23_actual_partner_account_governance.md",
    "https://www.twilio.com/docs/iam/test-credentials",
    "https://www.twilio.com/docs/iam/api/subaccounts",
    "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
    "https://www.twilio.com/docs/messaging/guides/track-outbound-message-status",
    "https://www.twilio.com/docs/voice/api/recording",
    "https://www.twilio.com/docs/global-infrastructure/understanding-twilio-regions",
    "https://www.twilio.com/en-us/sms/pricing/gb",
    "https://www.twilio.com/en-us/voice/pricing/gb",
    "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode/",
    "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/event",
    "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
    "https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers/",
    "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication",
    "https://www.twilio.com/docs/sendgrid/data-residency/migrate-subusers",
    "https://developer.vonage.com/en/voice/voice-api/webhook-reference",
    "https://developer.vonage.com/en/getting-started/concepts/signing-messages",
    "https://developer.vonage.com/en/getting-started/concepts/webhooks",
    "https://www.vonage.com/communications-apis/pricing/",
    "https://www.vonage.com/communications-apis/sms/pricing/",
    "https://developers.sinch.com/docs/voice/api-reference/callbacks",
    "https://developers.sinch.com/docs/voice/api-reference/authentication/callback-signed-request/",
    "https://developers.sinch.com/docs/sms/api-reference/sms/webhooks/deliveryreport",
    "https://sinch.com/pricing/sms/",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks",
    "https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts",
    "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts-features",
    "https://postmarkapp.com/developer/user-guide/send-email-with-api",
    "https://postmarkapp.com/manual",
    "https://postmarkapp.com/support/article/1115-how-do-modular-webhooks-work",
    "https://postmarkapp.com/pricing/",
]

DIMENSION_IDS = [
    "contract_shape",
    "authoritative_truth",
    "ambiguity_handling",
    "security_replay",
    "privacy_residency",
    "healthcare_compliance",
    "onboarding_and_sponsorship",
    "sandbox_depth",
    "test_data_fidelity",
    "observability_and_audit",
    "operational_support",
    "commercial_and_lock_in",
    "portability_and_exit",
    "degraded_mode_resilience",
    "experience_and_brand_constraints",
    "simulator_fidelity",
]

FAMILY_CONFIG = {
    "telephony_ivr": {
        "title": "Telephony / IVR",
        "accent": "#0E9384",
        "scorecard_family": "telephony_voice_and_recording",
        "integration_id": "int_telephony_capture_evidence_backplane",
        "dependency_family": "telephony",
        "recommended_strategy": "shortlist_two_actual_candidates_keep_mock_now_default",
        "handoff_task": "seq_032",
        "handoff_focus": "workspace, number, answer/event/fallback webhooks, recording, and spend gates",
        "page_title": "Voice_and_IVR_Shortlist",
    },
    "sms": {
        "title": "SMS",
        "accent": "#B54708",
        "scorecard_family": "notifications_sms",
        "integration_id": "int_sms_continuation_delivery",
        "dependency_family": "sms",
        "recommended_strategy": "keep_sms_optional_flagged_but_shortlist_now",
        "handoff_task": "seq_033",
        "handoff_focus": "project, sender, webhook, continuation routing, and spend gates",
        "page_title": "SMS_Shortlist",
    },
    "email": {
        "title": "Email",
        "accent": "#C11574",
        "scorecard_family": "notifications_email",
        "integration_id": "int_email_notification_delivery",
        "dependency_family": "email",
        "recommended_strategy": "shortlist_two_actual_candidates_and_reject_unsigned_callback_rails",
        "handoff_task": "seq_033",
        "handoff_focus": "project or subuser, sender/domain auth, event webhooks, and spend gates",
        "page_title": "Email_Shortlist",
    },
    "combined": {
        "title": "Combined Suite",
        "accent": "#7A5AF8",
        "recommended_strategy": "no_combined_suite_shortlisted_split_vendor_preferred",
        "handoff_task": "seq_032_and_seq_033",
        "handoff_focus": "combined-suite posture only; telephony and notification tasks stay separately gated",
        "page_title": "Decision_Log_and_Kill_Switches",
    },
}


def dims(
    contract_shape: int,
    authoritative_truth: int,
    ambiguity_handling: int,
    security_replay: int,
    privacy_residency: int,
    healthcare_compliance: int,
    onboarding_and_sponsorship: int,
    sandbox_depth: int,
    test_data_fidelity: int,
    observability_and_audit: int,
    operational_support: int,
    commercial_and_lock_in: int,
    portability_and_exit: int,
    degraded_mode_resilience: int,
    experience_and_brand_constraints: int,
    simulator_fidelity: int,
) -> dict[str, int]:
    return {
        "contract_shape": contract_shape,
        "authoritative_truth": authoritative_truth,
        "ambiguity_handling": ambiguity_handling,
        "security_replay": security_replay,
        "privacy_residency": privacy_residency,
        "healthcare_compliance": healthcare_compliance,
        "onboarding_and_sponsorship": onboarding_and_sponsorship,
        "sandbox_depth": sandbox_depth,
        "test_data_fidelity": test_data_fidelity,
        "observability_and_audit": observability_and_audit,
        "operational_support": operational_support,
        "commercial_and_lock_in": commercial_and_lock_in,
        "portability_and_exit": portability_and_exit,
        "degraded_mode_resilience": degraded_mode_resilience,
        "experience_and_brand_constraints": experience_and_brand_constraints,
        "simulator_fidelity": simulator_fidelity,
    }


OFFICIAL_EVIDENCE = [
    {
        "evidence_id": "ev_twilio_test_credentials",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["telephony_ivr", "sms"],
        "title": "Test Credentials | Twilio",
        "url": "https://www.twilio.com/docs/iam/test-credentials",
        "captured_on": CAPTURED_ON,
        "evidence_type": "sandbox",
        "freshness": "current official docs",
        "summary": "Twilio exposes test credentials for calls, SMS, lookup, and test number purchase without charges or live-state mutation.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_twilio_subaccounts",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["telephony_ivr", "sms"],
        "title": "REST API: Subaccounts | Twilio",
        "url": "https://www.twilio.com/docs/iam/api/subaccounts",
        "captured_on": CAPTURED_ON,
        "evidence_type": "account_model",
        "freshness": "current official docs",
        "summary": "Twilio subaccounts segment calls, messages, recordings, and transcriptions under separate credentials.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_twilio_webhook_security",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["telephony_ivr", "sms"],
        "title": "Webhooks security | Twilio",
        "url": "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
        "captured_on": CAPTURED_ON,
        "evidence_type": "security",
        "freshness": "current official docs",
        "summary": "Twilio signs inbound requests with X-Twilio-Signature and requires server-side validation over the evolving full parameter set.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_twilio_sms_callbacks",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["sms"],
        "title": "Track the Message Status of Outbound Messages | Twilio",
        "url": "https://www.twilio.com/docs/messaging/guides/track-outbound-message-status",
        "captured_on": CAPTURED_ON,
        "evidence_type": "delivery_callbacks",
        "freshness": "current official docs",
        "summary": "Twilio status callbacks cover message lifecycle changes and explicitly warn that callbacks may arrive out of order.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_twilio_recording",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["telephony_ivr"],
        "title": "Recordings resource | Twilio",
        "url": "https://www.twilio.com/docs/voice/api/recording",
        "captured_on": CAPTURED_ON,
        "evidence_type": "recording",
        "freshness": "current official docs",
        "summary": "Twilio recording events expose RecordingUrl and statuses including in-progress, completed, and absent.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_twilio_regions",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["telephony_ivr", "sms"],
        "title": "Twilio Regions | Twilio",
        "url": "https://www.twilio.com/docs/global-infrastructure/understanding-twilio-regions",
        "captured_on": CAPTURED_ON,
        "evidence_type": "residency",
        "freshness": "current official docs",
        "summary": "Twilio regions support workload placement, but phone numbers and billing stay global account resources and Twilio warns regional residency is not universal yet.",
        "strength": "moderate",
    },
    {
        "evidence_id": "ev_twilio_sms_pricing",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["sms"],
        "title": "SMS Pricing in United Kingdom for Text Messaging | Twilio",
        "url": "https://www.twilio.com/en-us/sms/pricing/gb",
        "captured_on": CAPTURED_ON,
        "evidence_type": "pricing",
        "freshness": "current pricing page",
        "summary": "Twilio publishes UK SMS pricing and notes usage-based and carrier-fee components on the public pricing page.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_twilio_voice_pricing",
        "vendor_id": "twilio",
        "vendor_name": "Twilio",
        "provider_families": ["telephony_ivr"],
        "title": "Programmable Voice Pricing in United Kingdom | Twilio",
        "url": "https://www.twilio.com/en-us/voice/pricing/gb",
        "captured_on": CAPTURED_ON,
        "evidence_type": "pricing",
        "freshness": "current pricing page",
        "summary": "Twilio publishes UK voice, media-stream, and number-pricing details publicly.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sendgrid_sandbox",
        "vendor_id": "sendgrid",
        "vendor_name": "Twilio SendGrid",
        "provider_families": ["email"],
        "title": "Sandbox Mode | SendGrid Docs | Twilio",
        "url": "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "sandbox",
        "freshness": "current official docs",
        "summary": "Sandbox mode validates the request body without delivery or credit consumption, but it does not generate Event Webhook or Email Activity events.",
        "strength": "moderate",
    },
    {
        "evidence_id": "ev_sendgrid_events",
        "vendor_id": "sendgrid",
        "vendor_name": "Twilio SendGrid",
        "provider_families": ["email"],
        "title": "Event Webhook Reference | SendGrid Docs | Twilio",
        "url": "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/event",
        "captured_on": CAPTURED_ON,
        "evidence_type": "delivery_callbacks",
        "freshness": "current official docs",
        "summary": "SendGrid event webhooks expose delivery, engagement, and account events and warn not to store PII in categories or unique arguments.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sendgrid_webhook_signing",
        "vendor_id": "sendgrid",
        "vendor_name": "Twilio SendGrid",
        "provider_families": ["email"],
        "title": "Getting Started with the Event Webhook Security Features | SendGrid Docs | Twilio",
        "url": "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
        "captured_on": CAPTURED_ON,
        "evidence_type": "security",
        "freshness": "current official docs",
        "summary": "SendGrid supports signed event webhooks with generated public/private key pairs and signature verification.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sendgrid_subusers",
        "vendor_id": "sendgrid",
        "vendor_name": "Twilio SendGrid",
        "provider_families": ["email"],
        "title": "Subusers | SendGrid Docs | Twilio",
        "url": "https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "account_model",
        "freshness": "current official docs",
        "summary": "SendGrid subusers segment sending, permissions, and credit limits but require a paid account.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sendgrid_domain_auth",
        "vendor_id": "sendgrid",
        "vendor_name": "Twilio SendGrid",
        "provider_families": ["email"],
        "title": "Domain authentication | SendGrid Docs | Twilio",
        "url": "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication",
        "captured_on": CAPTURED_ON,
        "evidence_type": "identity",
        "freshness": "current official docs",
        "summary": "SendGrid requires domain authentication using DKIM, SPF, and DMARC-related setup to improve trust and sender reputation.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sendgrid_eu",
        "vendor_id": "sendgrid",
        "vendor_name": "Twilio SendGrid",
        "provider_families": ["email", "combined"],
        "title": "Migrate Subusers to EU Data Resident Subusers | SendGrid Docs | Twilio",
        "url": "https://www.twilio.com/docs/sendgrid/data-residency/migrate-subusers",
        "captured_on": CAPTURED_ON,
        "evidence_type": "residency",
        "freshness": "current official docs",
        "summary": "SendGrid offers Global and EU subusers, and EU data residency requires paid-account EU subusers with region-pinned sender authentication.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_vonage_voice_webhooks",
        "vendor_id": "vonage",
        "vendor_name": "Vonage",
        "provider_families": ["telephony_ivr"],
        "title": "Vonage Voice API Webhook Reference",
        "url": "https://developer.vonage.com/en/voice/voice-api/webhook-reference",
        "captured_on": CAPTURED_ON,
        "evidence_type": "voice_webhooks",
        "freshness": "current official docs",
        "summary": "Vonage Voice exposes answer, event, record, and fallback webhooks with retry behavior, signed callbacks by default, DTMF handling, and recording URLs.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_vonage_signing",
        "vendor_id": "vonage",
        "vendor_name": "Vonage",
        "provider_families": ["sms"],
        "title": "SMS API Signatures Guide | Vonage",
        "url": "https://developer.vonage.com/en/getting-started/concepts/signing-messages",
        "captured_on": CAPTURED_ON,
        "evidence_type": "security",
        "freshness": "current official docs",
        "summary": "Vonage SMS webhooks can be verified with signatures so the receiver can confirm integrity of incoming requests.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_vonage_webhooks",
        "vendor_id": "vonage",
        "vendor_name": "Vonage",
        "provider_families": ["telephony_ivr", "sms"],
        "title": "Webhooks | Vonage",
        "url": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "captured_on": CAPTURED_ON,
        "evidence_type": "webhooks",
        "freshness": "current official docs",
        "summary": "Vonage frames webhooks as core product contracts and documents signature-secret use for signed requests.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_vonage_pricing",
        "vendor_id": "vonage",
        "vendor_name": "Vonage",
        "provider_families": ["telephony_ivr", "sms"],
        "title": "API Pricing: Understanding Vonage Communications API Prices",
        "url": "https://www.vonage.com/communications-apis/pricing/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "pricing",
        "freshness": "current pricing page",
        "summary": "Vonage publishes pay-as-you-go voice and messaging API prices and add-on record/report controls on public pricing pages.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_vonage_sms_pricing",
        "vendor_id": "vonage",
        "vendor_name": "Vonage",
        "provider_families": ["sms"],
        "title": "SMS API pricing | Vonage",
        "url": "https://www.vonage.com/communications-apis/sms/pricing/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "pricing",
        "freshness": "current pricing page",
        "summary": "Vonage publishes SMS pricing by number class and country and notes that dashboard pricing is authoritative at purchase time.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sinch_voice_callbacks",
        "vendor_id": "sinch",
        "vendor_name": "Sinch",
        "provider_families": ["telephony_ivr"],
        "title": "Callbacks | Voice API | Sinch",
        "url": "https://developers.sinch.com/docs/voice/api-reference/callbacks",
        "captured_on": CAPTURED_ON,
        "evidence_type": "voice_webhooks",
        "freshness": "current official docs",
        "summary": "Sinch voice callbacks cover incoming, answered, and disconnected call events and allow IVR control via SVAML and REST.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sinch_voice_signing",
        "vendor_id": "sinch",
        "vendor_name": "Sinch",
        "provider_families": ["telephony_ivr"],
        "title": "Callback request signing | Voice API | Sinch",
        "url": "https://developers.sinch.com/docs/voice/api-reference/authentication/callback-signed-request/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "security",
        "freshness": "current official docs",
        "summary": "Sinch voice supports HMAC-SHA256 callback signing over a deterministic string-to-sign.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sinch_sms_delivery",
        "vendor_id": "sinch",
        "vendor_name": "Sinch",
        "provider_families": ["sms"],
        "title": "Delivery Report | Sinch SMS",
        "url": "https://developers.sinch.com/docs/sms/api-reference/sms/webhooks/deliveryreport",
        "captured_on": CAPTURED_ON,
        "evidence_type": "delivery_callbacks",
        "freshness": "current official docs",
        "summary": "Sinch SMS delivery reports support callbacks with retry rules and batch-level delivery-report modes.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_sinch_sms_pricing",
        "vendor_id": "sinch",
        "vendor_name": "Sinch",
        "provider_families": ["sms"],
        "title": "Pricing SMS | Sinch",
        "url": "https://sinch.com/pricing/sms/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "pricing",
        "freshness": "current pricing page",
        "summary": "Sinch publishes pay-as-you-go SMS pricing and number fees, but broader enterprise support and approval posture remain sales-led.",
        "strength": "moderate",
    },
    {
        "evidence_id": "ev_mailgun_webhooks",
        "vendor_id": "mailgun",
        "vendor_name": "Mailgun",
        "provider_families": ["email"],
        "title": "Webhooks | Mailgun",
        "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks",
        "captured_on": CAPTURED_ON,
        "evidence_type": "delivery_callbacks",
        "freshness": "current official docs",
        "summary": "Mailgun documents accepted, delivered, temporary_fail, permanent_fail, complained, and unsubscribed webhook events and calls out fallback-channel uses.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_mailgun_secure_webhooks",
        "vendor_id": "mailgun",
        "vendor_name": "Mailgun",
        "provider_families": ["email"],
        "title": "Secure Your Webhooks | Mailgun",
        "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks",
        "captured_on": CAPTURED_ON,
        "evidence_type": "security",
        "freshness": "current official docs",
        "summary": "Mailgun signs event requests with token, timestamp, and signature, recommends token caching for replay defense, and supports TLS client certificates.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_mailgun_api_overview",
        "vendor_id": "mailgun",
        "vendor_name": "Mailgun",
        "provider_families": ["email", "combined"],
        "title": "API Overview | Mailgun",
        "url": "https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview",
        "captured_on": CAPTURED_ON,
        "evidence_type": "residency",
        "freshness": "current official docs",
        "summary": "Mailgun supports both US and EU regions and states that message data never leaves the region where it is processed.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_mailgun_sandbox",
        "vendor_id": "mailgun",
        "vendor_name": "Mailgun",
        "provider_families": ["email"],
        "title": "Sandbox Domain | Mailgun",
        "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox",
        "captured_on": CAPTURED_ON,
        "evidence_type": "sandbox",
        "freshness": "current official docs",
        "summary": "Each Mailgun account gets a sandbox domain limited to authorized recipients for safe integration testing.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_mailgun_subaccounts",
        "vendor_id": "mailgun",
        "vendor_name": "Mailgun",
        "provider_families": ["email", "combined"],
        "title": "Subaccounts Overview | Mailgun",
        "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts",
        "captured_on": CAPTURED_ON,
        "evidence_type": "account_model",
        "freshness": "current official docs",
        "summary": "Mailgun subaccounts separate domains, IPs, API keys, and users while rolling usage into the primary account.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_mailgun_subaccount_features",
        "vendor_id": "mailgun",
        "vendor_name": "Mailgun",
        "provider_families": ["email", "combined"],
        "title": "Summary of Subaccount Features | Mailgun",
        "url": "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts-features",
        "captured_on": CAPTURED_ON,
        "evidence_type": "observability",
        "freshness": "current official docs",
        "summary": "Mailgun subaccounts expose event logs, reporting, template editing, sending domains, and webhooks at the subaccount level.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_postmark_send_api",
        "vendor_id": "postmark",
        "vendor_name": "Postmark",
        "provider_families": ["email"],
        "title": "Sending email with API | Postmark",
        "url": "https://postmarkapp.com/developer/user-guide/send-email-with-api",
        "captured_on": CAPTURED_ON,
        "evidence_type": "account_model",
        "freshness": "current official docs",
        "summary": "Postmark uses per-server API tokens, requires confirmed sender signatures, and offers a special POSTMARK_API_TEST token for test sends.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_postmark_manual",
        "vendor_id": "postmark",
        "vendor_name": "Postmark",
        "provider_families": ["email"],
        "title": "Postmark Manual",
        "url": "https://postmarkapp.com/manual",
        "captured_on": CAPTURED_ON,
        "evidence_type": "sandbox",
        "freshness": "current official docs",
        "summary": "Postmark documents sandbox mode, fake bounces, delivery webhooks, and message-stream separation for transactional versus broadcast traffic.",
        "strength": "strong",
    },
    {
        "evidence_id": "ev_postmark_webhooks",
        "vendor_id": "postmark",
        "vendor_name": "Postmark",
        "provider_families": ["email"],
        "title": "How do modular webhooks work? | Postmark",
        "url": "https://postmarkapp.com/support/article/1115-how-do-modular-webhooks-work",
        "captured_on": CAPTURED_ON,
        "evidence_type": "delivery_callbacks",
        "freshness": "current official docs",
        "summary": "Postmark modular webhooks support event-type selection, send-test, custom headers, and optional basic HTTP auth, but the cited official guidance does not expose a signed or replay-safe callback mechanism.",
        "strength": "moderate",
    },
    {
        "evidence_id": "ev_postmark_pricing",
        "vendor_id": "postmark",
        "vendor_name": "Postmark",
        "provider_families": ["email"],
        "title": "Postmark Pricing and Free Trial",
        "url": "https://postmarkapp.com/pricing/",
        "captured_on": CAPTURED_ON,
        "evidence_type": "pricing",
        "freshness": "current pricing page",
        "summary": "Postmark publishes a free developer tier, server and stream limits, and configurable data-retention tiers.",
        "strength": "strong",
    },
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    assert_true(bool(rows), f"Cannot write empty CSV: {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")


def markdown_table(columns: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join("---" for _ in columns) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header, divider, *body])


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_031 prerequisites: " + ", ".join(sorted(missing)))

    scorecards = load_json(REQUIRED_INPUTS["provider_family_scorecards"])
    integration_priority = load_json(REQUIRED_INPUTS["integration_priority_matrix"])
    external_account_inventory = load_csv(REQUIRED_INPUTS["external_account_inventory"])
    phase0_gate = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])

    assert_true(scorecards["model_id"] == "seq_022_provider_family_scorecards_v1", "Expected seq_022 scorecards input")
    assert_true(integration_priority["model_id"] == "INT_PRIORITY_021", "Expected seq_021 priority matrix input")
    assert_true(phase0_gate["decision_pack_id"] == "phase0_foundation_gate_v1", "Expected seq_020 phase 0 gate input")
    assert_true(
        phase0_gate["planning_readiness"]["state"] == "ready_for_external_readiness",
        "Phase 0 planning readiness drifted unexpectedly",
    )
    return {
        "scorecards": scorecards,
        "integration_priority": integration_priority,
        "external_account_inventory": external_account_inventory,
        "phase0_gate": phase0_gate,
    }


def scorecard_lookup(scorecards: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {family["provider_family"]: family for family in scorecards["families"]}


def integration_lookup(integration_priority: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {row["integration_id"]: row for row in integration_priority["integration_families"]}


def evidence_lookup() -> dict[str, dict[str, Any]]:
    return {row["evidence_id"]: row for row in OFFICIAL_EVIDENCE}


def family_weights(scorecards_by_family: dict[str, dict[str, Any]]) -> dict[str, dict[str, dict[str, int]]]:
    weights: dict[str, dict[str, dict[str, int]]] = {}
    for public_family, config in FAMILY_CONFIG.items():
        if public_family == "combined":
            continue
        family = scorecards_by_family[config["scorecard_family"]]
        weights[public_family] = {
            "mock_now": {row["dimension_id"]: int(row["weight_mock_now"]) for row in family["scorecard_rows"]},
            "actual_later": {row["dimension_id"]: int(row["weight_actual_later"]) for row in family["scorecard_rows"]},
            "dimension_titles": {row["dimension_id"]: row["dimension_title"] for row in family["scorecard_rows"]},
        }
    combined_mock = {
        dimension_id: round(
            sum(weights[family]["mock_now"][dimension_id] for family in ("telephony_ivr", "sms", "email")) / 3
        )
        for dimension_id in DIMENSION_IDS
    }
    combined_actual = {
        dimension_id: round(
            sum(weights[family]["actual_later"][dimension_id] for family in ("telephony_ivr", "sms", "email")) / 3
        )
        for dimension_id in DIMENSION_IDS
    }
    combined_actual["commercial_and_lock_in"] += 2
    combined_actual["portability_and_exit"] += 2
    combined_actual["degraded_mode_resilience"] += 1
    weights["combined"] = {
        "mock_now": combined_mock,
        "actual_later": combined_actual,
        "dimension_titles": weights["telephony_ivr"]["dimension_titles"],
    }
    return weights


def weighted_score(ratings: dict[str, int], weights: dict[str, int]) -> int:
    numerator = sum(ratings[dimension_id] * weight for dimension_id, weight in weights.items())
    denominator = sum(weight * 5 for weight in weights.values())
    return round(100 * numerator / denominator)


def build_vendor_definitions() -> list[dict[str, Any]]:
    return [
        {
            "vendor_id": "vecells_signal_twin_voice",
            "vendor_name": "Vecells Internal Voice Twin",
            "provider_family": "telephony_ivr",
            "vendor_lane": "mock_only",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Local-only deterministic twin with UK-safe placeholder number ranges; never routable outside the lab.",
            "trust_and_compliance_evidence_refs": [],
            "cost_governance_notes": "No external spend; fixture-only local numbers and recording references.",
            "lock_in_risk": "low",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "data/analysis/external_account_inventory.csv#ACC_TEL_LOCAL_SIM_PRINCIPAL",
                "data/analysis/integration_priority_matrix.json#int_telephony_capture_evidence_backplane",
            ],
            "evidence_ids": [],
            "notes": (
                "Selected mock-now telephony twin. Must preserve call session lifecycle, IVR, recording presence vs absence, "
                "transcript readiness, urgent-live preemption, webhook retries, and continuation handoff."
            ),
            "dimension_ratings": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5),
        },
        {
            "vendor_id": "vecells_signal_twin_sms",
            "vendor_name": "Vecells Internal SMS Rail Twin",
            "provider_family": "sms",
            "vendor_lane": "mock_only",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": False,
            "uk_or_required_region_support_summary": "Local-only seeded and challenge continuation rail; never sends to real recipients.",
            "trust_and_compliance_evidence_refs": [],
            "cost_governance_notes": "No external spend; synthetic sender IDs and deterministic webhook fixtures only.",
            "lock_in_risk": "low",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "data/analysis/external_account_inventory.csv#ACC_SMS_LOCAL_SIM_PRINCIPAL",
                "data/analysis/integration_priority_matrix.json#int_sms_continuation_delivery",
            ],
            "evidence_ids": [],
            "notes": (
                "Selected mock-now SMS rail. Must preserve accepted vs delayed vs bounced vs expired delivery, "
                "wrong-recipient risk, replay-safe callbacks, and non-authoritative transport acceptance."
            ),
            "dimension_ratings": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5),
        },
        {
            "vendor_id": "vecells_signal_twin_email",
            "vendor_name": "Vecells Internal Email Rail Twin",
            "provider_family": "email",
            "vendor_lane": "mock_only",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Local-only secure-link and reassurance rail with synthetic domains, template versions, and event logs.",
            "trust_and_compliance_evidence_refs": [],
            "cost_governance_notes": "No external spend; synthetic senders and deterministic event bundles only.",
            "lock_in_risk": "low",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "data/analysis/external_account_inventory.csv#ACC_EMAIL_LOCAL_SIM_PRINCIPAL",
                "data/analysis/integration_priority_matrix.json#int_email_notification_delivery",
            ],
            "evidence_ids": [],
            "notes": (
                "Selected mock-now email rail. Must preserve accepted vs delivered vs delayed vs bounced vs complained "
                "vs disputed outcomes and controlled resend under the same authoritative chain."
            ),
            "dimension_ratings": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5),
        },
        {
            "vendor_id": "vecells_signal_fabric",
            "vendor_name": "Vecells Internal Signal Fabric",
            "provider_family": "combined",
            "vendor_lane": "mock_only",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Shared webhook-signing, dedupe, and continuity semantics across voice, SMS, and email without any live account dependency.",
            "trust_and_compliance_evidence_refs": [],
            "cost_governance_notes": "No vendor spend. This is the only selected combined lane for MVP development.",
            "lock_in_risk": "low",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "docs/external/21_integration_priority_and_execution_matrix.md#Commercial Vendor Onboarding",
                "data/analysis/external_account_inventory.csv#ACC_TEL_LOCAL_SIM_PRINCIPAL",
                "data/analysis/external_account_inventory.csv#ACC_SMS_LOCAL_SIM_PRINCIPAL",
                "data/analysis/external_account_inventory.csv#ACC_EMAIL_LOCAL_SIM_PRINCIPAL",
            ],
            "evidence_ids": [],
            "notes": (
                "Mock-now execution stays on the internal combined signal fabric even though real providers are researched now. "
                "No external vendor is allowed to become lifecycle authority during MVP buildout."
            ),
            "dimension_ratings": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5),
        },
        {
            "vendor_id": "twilio_telephony_ivr",
            "vendor_name": "Twilio",
            "provider_family": "telephony_ivr",
            "vendor_lane": "shortlisted",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": False,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Programmable Voice supports regional routing and UK pricing, but phone numbers remain global account resources.",
            "trust_and_compliance_evidence_refs": [
                "ev_twilio_regions",
                "ev_twilio_webhook_security",
            ],
            "cost_governance_notes": "Usage-based pricing is public; subaccounts and pricing APIs support governance but global number pools still need strong inventory controls.",
            "lock_in_risk": "high",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://www.twilio.com/docs/iam/test-credentials",
                "https://www.twilio.com/docs/iam/api/subaccounts",
                "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
                "https://www.twilio.com/docs/voice/api/recording",
                "https://www.twilio.com/docs/global-infrastructure/understanding-twilio-regions",
            ],
            "evidence_ids": [
                "ev_twilio_test_credentials",
                "ev_twilio_subaccounts",
                "ev_twilio_webhook_security",
                "ev_twilio_recording",
                "ev_twilio_regions",
                "ev_twilio_voice_pricing",
            ],
            "notes": (
                "Strong public sandbox and recording support, but callback authenticity relies on signature validation plus adapter-side dedupe rather than a first-class replay token."
            ),
            "dimension_ratings": dims(5, 4, 4, 4, 3, 3, 4, 5, 5, 5, 4, 3, 3, 4, 4, 4),
        },
        {
            "vendor_id": "vonage_telephony_ivr",
            "vendor_name": "Vonage",
            "provider_family": "telephony_ivr",
            "vendor_lane": "shortlisted",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Voice webhooks expose regional endpoints and public pricing, with inbound numbers and applications managed in the dashboard.",
            "trust_and_compliance_evidence_refs": [
                "ev_vonage_voice_webhooks",
                "ev_vonage_webhooks",
            ],
            "cost_governance_notes": "Public pricing is clear, but the shortlisted posture still assumes later procurement review for country-specific number and support terms.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://developer.vonage.com/en/voice/voice-api/webhook-reference",
                "https://developer.vonage.com/en/getting-started/concepts/webhooks",
                "https://www.vonage.com/communications-apis/pricing/",
            ],
            "evidence_ids": [
                "ev_vonage_voice_webhooks",
                "ev_vonage_webhooks",
                "ev_vonage_pricing",
            ],
            "notes": (
                "Vonage scores well on signed callbacks, fallback webhooks, DTMF, and recording URLs. It remains slightly behind Twilio on public test-environment depth."
            ),
            "dimension_ratings": dims(5, 4, 4, 5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4),
        },
        {
            "vendor_id": "sinch_telephony_ivr",
            "vendor_name": "Sinch",
            "provider_family": "telephony_ivr",
            "vendor_lane": "candidate",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Sinch voice offers signed callbacks and IVR control, but telephony procurement and region specifics remain more sales-led than the top two candidates.",
            "trust_and_compliance_evidence_refs": [
                "ev_sinch_voice_callbacks",
                "ev_sinch_voice_signing",
            ],
            "cost_governance_notes": "Public SMS pricing exists, but telephony commercials and support posture are less transparent in the reviewed official material.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://developers.sinch.com/docs/voice/api-reference/callbacks",
                "https://developers.sinch.com/docs/voice/api-reference/authentication/callback-signed-request/",
            ],
            "evidence_ids": [
                "ev_sinch_voice_callbacks",
                "ev_sinch_voice_signing",
            ],
            "notes": (
                "Technically capable enough to remain in the universe, but the current public evidence set is thinner on sandbox and commercial operations than Twilio or Vonage."
            ),
            "dimension_ratings": dims(4, 4, 4, 5, 3, 3, 3, 3, 3, 4, 4, 3, 4, 4, 4, 4),
        },
        {
            "vendor_id": "twilio_sms",
            "vendor_name": "Twilio",
            "provider_family": "sms",
            "vendor_lane": "shortlisted",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": False,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": False,
            "uk_or_required_region_support_summary": "Twilio publishes UK SMS pricing and global messaging support, but explicit EU SMS residency is still private beta and numbers remain global account assets.",
            "trust_and_compliance_evidence_refs": [
                "ev_twilio_webhook_security",
                "ev_twilio_regions",
            ],
            "cost_governance_notes": "Public per-message pricing is strong, but number inventory, carrier fees, and trial-to-paid transitions need procurement governance.",
            "lock_in_risk": "high",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://www.twilio.com/docs/iam/test-credentials",
                "https://www.twilio.com/docs/messaging/guides/track-outbound-message-status",
                "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
                "https://www.twilio.com/en-us/sms/pricing/gb",
            ],
            "evidence_ids": [
                "ev_twilio_test_credentials",
                "ev_twilio_webhook_security",
                "ev_twilio_sms_callbacks",
                "ev_twilio_sms_pricing",
                "ev_twilio_regions",
            ],
            "notes": (
                "High-quality API and callback coverage, but no first-class replay token in the reviewed webhook docs means the adapter must own replay defense."
            ),
            "dimension_ratings": dims(5, 4, 4, 4, 3, 3, 4, 5, 4, 5, 4, 3, 3, 4, 4, 4),
        },
        {
            "vendor_id": "vonage_sms",
            "vendor_name": "Vonage",
            "provider_family": "sms",
            "vendor_lane": "shortlisted",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": False,
            "uk_or_required_region_support_summary": "Vonage has virtual numbers, dashboard project management, signed SMS callbacks, and public pricing, with final destination specifics still tied to dashboard review.",
            "trust_and_compliance_evidence_refs": [
                "ev_vonage_signing",
                "ev_vonage_pricing",
            ],
            "cost_governance_notes": "Public pricing is visible; rate cards still require a dashboard-time check for exact route economics.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://developer.vonage.com/en/getting-started/concepts/signing-messages",
                "https://developer.vonage.com/en/getting-started/concepts/webhooks",
                "https://www.vonage.com/communications-apis/sms/pricing/",
            ],
            "evidence_ids": [
                "ev_vonage_signing",
                "ev_vonage_webhooks",
                "ev_vonage_sms_pricing",
            ],
            "notes": (
                "The strongest current SMS-specific callback security story in the reviewed public material; remains shortlisted despite lighter sandbox depth than Twilio."
            ),
            "dimension_ratings": dims(4, 4, 4, 5, 3, 3, 4, 4, 3, 4, 4, 4, 4, 4, 4, 4),
        },
        {
            "vendor_id": "sinch_sms",
            "vendor_name": "Sinch",
            "provider_family": "sms",
            "vendor_lane": "candidate",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": False,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": False,
            "uk_or_required_region_support_summary": "Sinch exposes regional APIs and public SMS pricing, but the reviewed docs stop short of the same native replay-safe callback assurance as the shortlisted providers.",
            "trust_and_compliance_evidence_refs": [
                "ev_sinch_sms_delivery",
                "ev_sinch_sms_pricing",
            ],
            "cost_governance_notes": "Pricing is public and attractive, but support and enterprise onboarding remain more account-manager-heavy.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://developers.sinch.com/docs/sms/api-reference/sms/webhooks/deliveryreport",
                "https://sinch.com/pricing/sms/",
            ],
            "evidence_ids": [
                "ev_sinch_sms_delivery",
                "ev_sinch_sms_pricing",
            ],
            "notes": (
                "Sinch remains a credible universe row because its delivery-report callbacks are detailed, but the public callback-security story is weaker for the exact SMS surface."
            ),
            "dimension_ratings": dims(4, 4, 4, 3, 3, 3, 3, 3, 3, 4, 4, 3, 4, 4, 4, 4),
        },
        {
            "vendor_id": "mailgun_email",
            "vendor_name": "Mailgun",
            "provider_family": "email",
            "vendor_lane": "shortlisted",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Mailgun supports US and EU regions and states message data stays in-region, with sandbox domains for safe testing.",
            "trust_and_compliance_evidence_refs": [
                "ev_mailgun_api_overview",
                "ev_mailgun_secure_webhooks",
            ],
            "cost_governance_notes": "Subaccounts roll billing into the parent account, so finance controls must live at the parent plus subaccount-limit layer.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/webhooks",
                "https://documentation.mailgun.com/docs/mailgun/user-manual/webhooks/securing-webhooks",
                "https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview",
                "https://documentation.mailgun.com/docs/mailgun/user-manual/domains/domains-sandbox",
                "https://documentation.mailgun.com/docs/mailgun/user-manual/subaccounts/subaccounts",
            ],
            "evidence_ids": [
                "ev_mailgun_webhooks",
                "ev_mailgun_secure_webhooks",
                "ev_mailgun_api_overview",
                "ev_mailgun_sandbox",
                "ev_mailgun_subaccounts",
                "ev_mailgun_subaccount_features",
            ],
            "notes": (
                "Best fit for authoritative delivery ambiguity, explicit replay defense, EU region control, and project-style subaccount segmentation."
            ),
            "dimension_ratings": dims(4, 4, 4, 5, 5, 4, 4, 4, 4, 5, 4, 4, 4, 4, 4, 4),
        },
        {
            "vendor_id": "sendgrid_email",
            "vendor_name": "Twilio SendGrid",
            "provider_family": "email",
            "vendor_lane": "shortlisted",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": False,
            "uk_or_required_region_support_summary": "SendGrid now supports EU data-resident subusers and EU-pinned sender authentication, but requires paid-account subusers for that posture.",
            "trust_and_compliance_evidence_refs": [
                "ev_sendgrid_webhook_signing",
                "ev_sendgrid_eu",
            ],
            "cost_governance_notes": "Subusers require a paid account; sandbox mode validates requests but cannot stand in for webhook-event testing.",
            "lock_in_risk": "high",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sandbox-mode/",
                "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/event",
                "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
                "https://www.twilio.com/docs/sendgrid/ui/account-and-settings/subusers/",
                "https://www.twilio.com/docs/sendgrid/glossary/domain-authentication",
                "https://www.twilio.com/docs/sendgrid/data-residency/migrate-subusers",
            ],
            "evidence_ids": [
                "ev_sendgrid_sandbox",
                "ev_sendgrid_events",
                "ev_sendgrid_webhook_signing",
                "ev_sendgrid_subusers",
                "ev_sendgrid_domain_auth",
                "ev_sendgrid_eu",
            ],
            "notes": (
                "Strong webhook security and EU subuser posture offset the sandbox limitation that no event webhooks fire during sandbox-mode validation."
            ),
            "dimension_ratings": dims(4, 4, 4, 5, 4, 4, 4, 3, 4, 5, 4, 3, 3, 4, 4, 4),
        },
        {
            "vendor_id": "postmark_email",
            "vendor_name": "Postmark",
            "provider_family": "email",
            "vendor_lane": "rejected",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": False,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": False,
            "uk_or_required_region_support_summary": "Postmark publishes pricing and developer tiers, but the reviewed official material does not show the same explicit region-residency controls as Mailgun or SendGrid.",
            "trust_and_compliance_evidence_refs": [
                "ev_postmark_webhooks",
            ],
            "cost_governance_notes": "Pricing and free developer usage are attractive, but security shortcomings are disqualifying for this dossier.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": (
                "Rejected because the reviewed official webhook guidance exposes custom headers and basic auth but no signed or replay-safe callback proof, "
                "which fails the seq_031 delivery-evidence bar."
            ),
            "source_refs": [
                "https://postmarkapp.com/developer/user-guide/send-email-with-api",
                "https://postmarkapp.com/manual",
                "https://postmarkapp.com/support/article/1115-how-do-modular-webhooks-work",
                "https://postmarkapp.com/pricing/",
            ],
            "evidence_ids": [
                "ev_postmark_send_api",
                "ev_postmark_manual",
                "ev_postmark_webhooks",
                "ev_postmark_pricing",
            ],
            "notes": (
                "Excellent testing ergonomics and message-stream separation, but current official docs do not meet the replay-safe callback requirement for authoritative delivery evidence."
            ),
            "dimension_ratings": dims(4, 4, 4, 2, 3, 3, 5, 5, 5, 4, 4, 4, 4, 4, 5, 4),
        },
        {
            "vendor_id": "twilio_sendgrid_suite",
            "vendor_name": "Twilio Communications + Twilio SendGrid",
            "provider_family": "combined",
            "vendor_lane": "candidate",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Strong cross-family coverage, but voice/SMS and email still operate as distinct products with different residency and callback semantics.",
            "trust_and_compliance_evidence_refs": [
                "ev_twilio_regions",
                "ev_sendgrid_eu",
            ],
            "cost_governance_notes": "Could reduce vendor count, but creates one larger commercial envelope with high failure-domain coupling and different sandbox semantics across channels.",
            "lock_in_risk": "very_high",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://www.twilio.com/docs/iam/test-credentials",
                "https://www.twilio.com/docs/sendgrid/data-residency/migrate-subusers",
                "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
            ],
            "evidence_ids": [
                "ev_twilio_test_credentials",
                "ev_twilio_webhook_security",
                "ev_sendgrid_webhook_signing",
                "ev_sendgrid_eu",
            ],
            "notes": (
                "A credible combined-suite candidate only. It is not shortlisted because split-vendor posture reduces coupling and avoids one vendor becoming hidden lifecycle authority."
            ),
            "dimension_ratings": dims(4, 4, 4, 4, 3, 3, 4, 4, 4, 5, 4, 2, 2, 4, 4, 4),
        },
        {
            "vendor_id": "sinch_mailgun_suite",
            "vendor_name": "Sinch Communications + Mailgun",
            "provider_family": "combined",
            "vendor_lane": "candidate",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Voice, SMS, and email can be covered under the wider Sinch group, with explicit EU region support on the Mailgun email side.",
            "trust_and_compliance_evidence_refs": [
                "ev_sinch_voice_signing",
                "ev_mailgun_api_overview",
            ],
            "cost_governance_notes": "Potential procurement simplicity is offset by weaker public sandbox and operational evidence on the telephony/SMS side.",
            "lock_in_risk": "high",
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://developers.sinch.com/docs/voice/api-reference/authentication/callback-signed-request/",
                "https://developers.sinch.com/docs/sms/api-reference/sms/webhooks/deliveryreport",
                "https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview",
            ],
            "evidence_ids": [
                "ev_sinch_voice_signing",
                "ev_sinch_sms_delivery",
                "ev_mailgun_api_overview",
                "ev_mailgun_secure_webhooks",
            ],
            "notes": (
                "Interesting medium-term portfolio option, but the reviewed public evidence still favors split vendors for lower coupling and clearer sandbox-to-live behavior."
            ),
            "dimension_ratings": dims(4, 4, 4, 4, 4, 3, 3, 3, 3, 4, 4, 3, 3, 4, 4, 4),
        },
        {
            "vendor_id": "vonage_single_suite",
            "vendor_name": "Vonage-only Single Suite",
            "provider_family": "combined",
            "vendor_lane": "rejected",
            "supports_test_mode": True,
            "supports_webhooks": True,
            "supports_replay_protection": True,
            "supports_delivery_callbacks": True,
            "supports_recording_or_attachment_references": True,
            "uk_or_required_region_support_summary": "Vonage covers voice and SMS strongly, but the reviewed official material does not provide a matching first-party email rail for all three families.",
            "trust_and_compliance_evidence_refs": [
                "ev_vonage_voice_webhooks",
                "ev_vonage_signing",
            ],
            "cost_governance_notes": "Rejected before commercial scoring because family coverage is incomplete for the required all-three combined posture.",
            "lock_in_risk": "medium",
            "kill_switch_reason_if_any": "Rejected because there is no reviewed first-party Vonage email rail to satisfy the all-three combined strategy.",
            "source_refs": [
                "https://developer.vonage.com/en/voice/voice-api/webhook-reference",
                "https://developer.vonage.com/en/getting-started/concepts/signing-messages",
            ],
            "evidence_ids": [
                "ev_vonage_voice_webhooks",
                "ev_vonage_signing",
            ],
            "notes": "Useful for voice-plus-SMS comparison, but not admissible as a single all-communications suite for this task.",
            "dimension_ratings": dims(3, 3, 3, 4, 3, 3, 4, 3, 3, 3, 3, 4, 4, 3, 4, 3),
        },
    ]


def build_summary(
    vendor_rows: list[dict[str, Any]],
    external_account_inventory: list[dict[str, str]],
    integration_rows: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    by_lane: dict[str, int] = {}
    by_family: dict[str, int] = {}
    for row in vendor_rows:
        by_lane[row["vendor_lane"]] = by_lane.get(row["vendor_lane"], 0) + 1
        by_family[row["provider_family"]] = by_family.get(row["provider_family"], 0) + 1
    account_rows = [row for row in external_account_inventory if row["dependency_family"] in {"telephony", "sms", "email"}]
    return {
        "vendor_rows": len(vendor_rows),
        "family_counts": by_family,
        "lane_counts": by_lane,
        "official_evidence_rows": len(OFFICIAL_EVIDENCE),
        "communications_account_rows": len(account_rows),
        "mock_selected_vendor_count": len([row for row in vendor_rows if row["vendor_lane"] == "mock_only"]),
        "actual_shortlisted_vendor_count": len([row for row in vendor_rows if row["vendor_lane"] == "shortlisted"]),
        "current_gate_state": "withheld",
        "telephony_priority_rank": integration_rows["int_telephony_capture_evidence_backplane"]["mock_now_execution_rank"],
        "sms_priority_rank": integration_rows["int_sms_continuation_delivery"]["mock_now_execution_rank"],
        "email_priority_rank": integration_rows["int_email_notification_delivery"]["mock_now_execution_rank"],
    }


def enrich_vendors(
    vendor_rows: list[dict[str, Any]],
    weights: dict[str, dict[str, dict[str, int]]],
    scorecards_by_family: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    enriched: list[dict[str, Any]] = []
    for row in vendor_rows:
        family = row["provider_family"]
        row = dict(row)
        row["mock_now_fit_score"] = weighted_score(row["dimension_ratings"], weights[family]["mock_now"])
        row["actual_later_fit_score"] = weighted_score(row["dimension_ratings"], weights[family]["actual_later"])
        row["dimension_titles"] = weights[family]["dimension_titles"]
        if family != "combined":
            scorecard = scorecards_by_family[FAMILY_CONFIG[family]["scorecard_family"]]
            row["risk_notes"] = scorecard["risk_notes"]
            row["watch_notes"] = scorecard["watch_notes"]
        else:
            row["risk_notes"] = []
            row["watch_notes"] = []
        enriched.append(row)
    return enriched


def build_lane_matrix(vendor_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    shortlist_by_family = {
        family: [row for row in vendor_rows if row["provider_family"] == family and row["vendor_lane"] == "shortlisted"]
        for family in FAMILY_CONFIG
    }
    mock_by_family = {
        family: [row for row in vendor_rows if row["provider_family"] == family and row["vendor_lane"] == "mock_only"]
        for family in FAMILY_CONFIG
    }
    lane_rows: list[dict[str, Any]] = []
    for family, config in FAMILY_CONFIG.items():
        lane_rows.append(
            {
                "lane_row_id": f"lane_{family}",
                "provider_family": family,
                "family_title": config["title"],
                "mock_provider_id": mock_by_family[family][0]["vendor_id"],
                "mock_provider_name": mock_by_family[family][0]["vendor_name"],
                "mock_selected_state": "selected_now",
                "actual_strategy": config["recommended_strategy"],
                "shortlisted_vendor_ids": ";".join(row["vendor_id"] for row in shortlist_by_family[family]),
                "shortlisted_vendor_names": ";".join(row["vendor_name"] for row in shortlist_by_family[family]),
                "shortlist_order": ";".join(
                    row["vendor_id"]
                    for row in sorted(shortlist_by_family[family], key=lambda item: (-item["actual_later_fit_score"], item["vendor_name"]))
                ),
                "handoff_task": config["handoff_task"],
                "handoff_focus": config["handoff_focus"],
                "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION; ALLOW_REAL_PROVIDER_MUTATION; ALLOW_SPEND",
                "notes": mock_by_family[family][0]["notes"],
            }
        )
    return lane_rows


def build_kill_switches() -> list[dict[str, Any]]:
    rows = [
        {
            "kill_switch_id": "KS_COMMS_001",
            "provider_family": "telephony_ivr",
            "lane_scope": "actual_later",
            "dimension_id": "security_replay",
            "trigger": "Reject any telephony vendor that lacks callback authenticity proof or forces blind trust in unsigned voice events.",
            "effect": "Not shortlistable for seq_032 handoff.",
            "impacted_vendor_ids": "twilio_telephony_ivr; vonage_telephony_ivr; sinch_telephony_ivr",
            "source_refs": "prompt/031.md; data/analysis/provider_family_scorecards.json#telephony_voice_and_recording",
        },
        {
            "kill_switch_id": "KS_COMMS_002",
            "provider_family": "telephony_ivr",
            "lane_scope": "actual_later",
            "dimension_id": "authoritative_truth",
            "trigger": "Reject any telephony vendor if call accepted or callback arrival would be mistaken for settled contact truth.",
            "effect": "Not shortlistable for seq_032 handoff.",
            "impacted_vendor_ids": "twilio_telephony_ivr; vonage_telephony_ivr; sinch_telephony_ivr",
            "source_refs": "prompt/031.md; docs/external/22_provider_selection_scorecards.md",
        },
        {
            "kill_switch_id": "KS_COMMS_003",
            "provider_family": "sms",
            "lane_scope": "actual_later",
            "dimension_id": "ambiguity_handling",
            "trigger": "Reject any SMS vendor that cannot surface queued, delayed, bounced, expired, or wrong-recipient states separately.",
            "effect": "Not shortlistable for seq_033 handoff.",
            "impacted_vendor_ids": "twilio_sms; vonage_sms; sinch_sms",
            "source_refs": "prompt/031.md; data/analysis/integration_priority_matrix.json#int_sms_continuation_delivery",
        },
        {
            "kill_switch_id": "KS_COMMS_004",
            "provider_family": "sms",
            "lane_scope": "actual_later",
            "dimension_id": "security_replay",
            "trigger": "Reject any SMS vendor whose callback channel cannot be authenticated or made replay-safe with documented provider signals.",
            "effect": "Not shortlistable for seq_033 handoff.",
            "impacted_vendor_ids": "twilio_sms; vonage_sms; sinch_sms",
            "source_refs": "prompt/031.md; docs/external/22_provider_selection_scorecards.md",
        },
        {
            "kill_switch_id": "KS_COMMS_005",
            "provider_family": "email",
            "lane_scope": "actual_later",
            "dimension_id": "security_replay",
            "trigger": "Reject any email vendor that lacks signed or replay-safe webhook proof for delivery, bounce, and complaint events.",
            "effect": "Not shortlistable for seq_033 handoff.",
            "impacted_vendor_ids": "mailgun_email; sendgrid_email; postmark_email",
            "source_refs": "prompt/031.md; data/analysis/provider_family_scorecards.json#notifications_email",
        },
        {
            "kill_switch_id": "KS_COMMS_006",
            "provider_family": "email",
            "lane_scope": "actual_later",
            "dimension_id": "contract_shape",
            "trigger": "Reject any email vendor that cannot preserve sender/domain verification, event webhook setup, and environment separation cleanly.",
            "effect": "Not shortlistable for seq_033 handoff.",
            "impacted_vendor_ids": "mailgun_email; sendgrid_email; postmark_email",
            "source_refs": "prompt/031.md; prompt/033.md",
        },
        {
            "kill_switch_id": "KS_COMMS_007",
            "provider_family": "combined",
            "lane_scope": "actual_later",
            "dimension_id": "commercial_and_lock_in",
            "trigger": "Reject any combined-suite option that wins only by procurement simplicity while increasing lock-in and failure-domain coupling.",
            "effect": "Not shortlistable as a cross-family default.",
            "impacted_vendor_ids": "twilio_sendgrid_suite; sinch_mailgun_suite; vonage_single_suite",
            "source_refs": "prompt/031.md",
        },
        {
            "kill_switch_id": "KS_COMMS_008",
            "provider_family": "combined",
            "lane_scope": "actual_later",
            "dimension_id": "contract_shape",
            "trigger": "Reject any combined-suite option that does not cover telephony, SMS, and email together in current reviewed official docs.",
            "effect": "Combined row marked rejected.",
            "impacted_vendor_ids": "vonage_single_suite",
            "source_refs": "prompt/031.md",
        },
        {
            "kill_switch_id": "KS_COMMS_009",
            "provider_family": "mock_lane",
            "lane_scope": "mock_now",
            "dimension_id": "simulator_fidelity",
            "trigger": "Reject any internal twin that skips IVR branches, urgent preemption, webhook disorder, bounce/dispute, or route-repair semantics.",
            "effect": "Mock lane not selectable for MVP execution.",
            "impacted_vendor_ids": "vecells_signal_twin_voice; vecells_signal_twin_sms; vecells_signal_twin_email; vecells_signal_fabric",
            "source_refs": "prompt/031.md; data/analysis/integration_priority_matrix.json",
        },
        {
            "kill_switch_id": "KS_COMMS_010",
            "provider_family": "email",
            "lane_scope": "actual_later",
            "dimension_id": "security_replay",
            "trigger": "Explicit seq_031 rejection: Postmark current official guidance exposes custom headers/basic auth but no signed replay-safe callback proof.",
            "effect": "postmark_email stays rejected.",
            "impacted_vendor_ids": "postmark_email",
            "source_refs": "https://postmarkapp.com/support/article/1115-how-do-modular-webhooks-work",
        },
        {
            "kill_switch_id": "KS_COMMS_011",
            "provider_family": "combined",
            "lane_scope": "actual_later",
            "dimension_id": "portability_and_exit",
            "trigger": "Reject any combined-suite proposal if seq_032 or seq_033 would be unable to swap vendors per family without lifecycle rewrites.",
            "effect": "No combined suite may be defaulted now.",
            "impacted_vendor_ids": "twilio_sendgrid_suite; sinch_mailgun_suite; vonage_single_suite",
            "source_refs": "prompt/031.md; docs/external/22_provider_selection_scorecards.md",
        },
    ]
    return rows


def vendor_sort_key(row: dict[str, Any]) -> tuple[Any, ...]:
    lane_order = {"mock_only": 0, "shortlisted": 1, "candidate": 2, "rejected": 3}
    return (
        row["provider_family"],
        lane_order[row["vendor_lane"]],
        -row["actual_later_fit_score"],
        -row["mock_now_fit_score"],
        row["vendor_name"],
    )


def build_universe_csv_rows(vendor_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in sorted(vendor_rows, key=vendor_sort_key):
        rows.append(
            {
                "vendor_id": row["vendor_id"],
                "vendor_name": row["vendor_name"],
                "provider_family": row["provider_family"],
                "vendor_lane": row["vendor_lane"],
                "supports_test_mode": "yes" if row["supports_test_mode"] else "no",
                "supports_webhooks": "yes" if row["supports_webhooks"] else "no",
                "supports_replay_protection": "yes" if row["supports_replay_protection"] else "no",
                "supports_delivery_callbacks": "yes" if row["supports_delivery_callbacks"] else "no",
                "supports_recording_or_attachment_references": "yes" if row["supports_recording_or_attachment_references"] else "no",
                "uk_or_required_region_support_summary": row["uk_or_required_region_support_summary"],
                "trust_and_compliance_evidence_refs": ";".join(row["trust_and_compliance_evidence_refs"]),
                "cost_governance_notes": row["cost_governance_notes"],
                "lock_in_risk": row["lock_in_risk"],
                "mock_now_fit_score": row["mock_now_fit_score"],
                "actual_later_fit_score": row["actual_later_fit_score"],
                "kill_switch_reason_if_any": row["kill_switch_reason_if_any"],
                "source_refs": ";".join(row["source_refs"]),
                "notes": row["notes"],
            }
        )
    return rows


def build_shortlist_payload(
    vendor_rows: list[dict[str, Any]],
    lane_matrix: list[dict[str, Any]],
    phase0_gate: dict[str, Any],
    summary: dict[str, Any],
) -> dict[str, Any]:
    by_family = {family: [row for row in vendor_rows if row["provider_family"] == family] for family in FAMILY_CONFIG}
    shortlisted = {family: [row for row in rows if row["vendor_lane"] == "shortlisted"] for family, rows in by_family.items()}
    candidates = {family: [row for row in rows if row["vendor_lane"] == "candidate"] for family, rows in by_family.items()}
    rejected = {family: [row for row in rows if row["vendor_lane"] == "rejected"] for family, rows in by_family.items()}
    mocks = {family: [row for row in rows if row["vendor_lane"] == "mock_only"] for family, rows in by_family.items()}

    return {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "phase0_gate_posture": {
            "verdict": phase0_gate["gate_verdicts"][0]["verdict"],
            "planning_readiness": phase0_gate["planning_readiness"]["state"],
            "external_gate": "withheld",
            "procurement_posture": "no_purchase_no_signup_no_spend",
        },
        "recommended_strategy": {
            "strategy_id": "split_vendor_preferred",
            "label": "Split-vendor posture preferred",
            "summary": (
                "Keep telephony and notifications independently selectable. Do not shortlist any combined suite as the default because "
                "family-specific truth, fallback, and callback semantics outweigh procurement simplicity."
            ),
        },
        "lane_matrix": lane_matrix,
        "mock_selected": {
            family: {
                "vendor_id": mocks[family][0]["vendor_id"],
                "vendor_name": mocks[family][0]["vendor_name"],
                "notes": mocks[family][0]["notes"],
            }
            for family in FAMILY_CONFIG
        },
        "shortlist_by_family": {
            family: [
                {
                    "vendor_id": row["vendor_id"],
                    "vendor_name": row["vendor_name"],
                    "actual_later_fit_score": row["actual_later_fit_score"],
                    "mock_now_fit_score": row["mock_now_fit_score"],
                    "top_note": row["notes"],
                    "source_refs": row["source_refs"],
                    "handoff_task": FAMILY_CONFIG[family]["handoff_task"],
                    "handoff_focus": FAMILY_CONFIG[family]["handoff_focus"],
                }
                for row in sorted(rows, key=lambda item: (-item["actual_later_fit_score"], item["vendor_name"]))
            ]
            for family, rows in shortlisted.items()
        },
        "candidate_by_family": {
            family: [
                {
                    "vendor_id": row["vendor_id"],
                    "vendor_name": row["vendor_name"],
                    "actual_later_fit_score": row["actual_later_fit_score"],
                    "notes": row["notes"],
                }
                for row in sorted(rows, key=lambda item: (-item["actual_later_fit_score"], item["vendor_name"]))
            ]
            for family, rows in candidates.items()
        },
        "rejected_by_family": {
            family: [
                {
                    "vendor_id": row["vendor_id"],
                    "vendor_name": row["vendor_name"],
                    "kill_switch_reason_if_any": row["kill_switch_reason_if_any"],
                }
                for row in rows
            ]
            for family, rows in rejected.items()
        },
        "next_tasks": {
            "seq_032": {
                "focus": "telephony account, workspace, number, webhook, recording, and spend controls",
                "approved_vendor_candidates": [row["vendor_id"] for row in shortlisted["telephony_ivr"]],
            },
            "seq_033": {
                "focus": "SMS and email project, sender/domain, webhook, and spend controls",
                "approved_vendor_candidates": [row["vendor_id"] for row in shortlisted["sms"] + shortlisted["email"]],
            },
        },
    }


def build_dimension_table(row: dict[str, Any]) -> list[list[str]]:
    rows: list[list[str]] = []
    for dimension_id in DIMENSION_IDS:
        rows.append(
            [
                row["dimension_titles"][dimension_id],
                str(row["dimension_ratings"][dimension_id]),
            ]
        )
    return rows


def build_docs(
    vendor_rows: list[dict[str, Any]],
    shortlist: dict[str, Any],
    lane_matrix: list[dict[str, Any]],
    kill_switch_rows: list[dict[str, Any]],
    integration_rows: dict[str, dict[str, Any]],
) -> None:
    by_family = {family: [row for row in vendor_rows if row["provider_family"] == family] for family in FAMILY_CONFIG}
    universe_sections: list[str] = []
    for family, config in FAMILY_CONFIG.items():
        rows = sorted(by_family[family], key=lambda item: (-item["actual_later_fit_score"], item["vendor_name"]))
        table_rows = [
            [
                row["vendor_name"],
                row["vendor_lane"],
                str(row["mock_now_fit_score"]),
                str(row["actual_later_fit_score"]),
                "yes" if row["supports_replay_protection"] else "no",
                row["lock_in_risk"],
                row["notes"],
            ]
            for row in rows
        ]
        universe_sections.append(
            "\n".join(
                [
                    f"## {config['title']}",
                    markdown_table(
                        ["Vendor", "Lane", "Mock fit", "Actual fit", "Replay-safe", "Lock-in", "Notes"],
                        table_rows,
                    ),
                ]
            )
        )

    write_text(
        UNIVERSE_DOC_PATH,
        "\n".join(
            [
                "# 31 Vendor Universe Telephony SMS Email",
                "",
                '`seq_031` turns the communications provider question into a family-by-family dossier instead of a single generic "communications vendor" choice. The current recommendation is explicit:',
                "",
                "- selected mock-now combined lane: `Vecells Internal Signal Fabric`",
                "- real-later default posture: `split_vendor_preferred`",
                f"- current shortlist count: {shortlist['summary']['actual_shortlisted_vendor_count']}",
                f"- rejected rows: {shortlist['summary']['lane_counts'].get('rejected', 0)}",
                f"- official evidence rows: {shortlist['summary']['official_evidence_rows']}",
                "- current gate posture: `withheld`",
                "",
                "The shortlist preserves the blueprint rule that transport success never becomes lifecycle authority. Telephony, SMS, and email are scored independently, then compared against combined-suite options only after lock-in and failure-domain penalties are applied.",
                "",
                "## Family Posture",
                "",
                "\n\n".join(universe_sections),
            ]
        ),
    )

    mock_sections = []
    for family in ("telephony_ivr", "sms", "email"):
        row = next(item for item in vendor_rows if item["vendor_id"] == shortlist["mock_selected"][family]["vendor_id"])
        mock_sections.append(
            "\n".join(
                [
                    f"## {FAMILY_CONFIG[family]['title']}",
                    row["notes"],
                    "",
                    markdown_table(["Dimension", "Rating"], build_dimension_table(row)),
                ]
            )
        )

    write_text(
        MOCK_DOC_PATH,
        "\n".join(
            [
                "# 31 Mock Provider Lane For Communications",
                "",
                "The mock-now lane is selected first and remains the only executable combined provider lane in the current baseline:",
                "",
                "- selected combined lane: `vecells_signal_fabric`",
                "- telephony twin: `vecells_signal_twin_voice`",
                "- sms twin: `vecells_signal_twin_sms`",
                "- email twin: `vecells_signal_twin_email`",
                "- shared webhook model: HMAC-signed fixtures plus deterministic event IDs and adapter-owned replay caches",
                "- evidence rule: transport acceptance, callback arrival, and authoritative outcome remain separate states",
                "",
                "The mock lane is product-grade only if it preserves:",
                "",
                "- telephony call lifecycle, IVR/DTMF, urgent-live preemption, recording-present vs recording-absent, transcript-ready vs transcript-degraded",
                "- SMS continuation, wrong-recipient risk, delayed/bounced/expired deliveries, and callback repair",
                "- email accepted/delivered/delayed/bounced/complained/disputed flows with controlled resend under one authoritative chain",
                "- route repair, callback fallback, degraded guidance, and replay-safe callback ingestion across all families",
                "",
                "\n\n".join(mock_sections),
            ]
        ),
    )

    shortlist_sections: list[str] = []
    for family in ("telephony_ivr", "sms", "email"):
        rows = shortlist["shortlist_by_family"][family]
        shortlist_sections.append(
            "\n".join(
                [
                    f"## {FAMILY_CONFIG[family]['title']}",
                    markdown_table(
                        ["Vendor", "Actual fit", "Next task", "Why"],
                        [
                            [
                                row["vendor_name"],
                                str(row["actual_later_fit_score"]),
                                row["handoff_task"],
                                row["top_note"],
                            ]
                            for row in rows
                        ],
                    ),
                ]
            )
        )

    decision_note = markdown_table(
        ["Family", "Mock provider", "Actual shortlist", "Handoff"],
        [
            [
                row["family_title"],
                row["mock_provider_name"],
                row["shortlisted_vendor_names"] or "none",
                f"{row['handoff_task']} ({row['handoff_focus']})",
            ]
            for row in lane_matrix
        ],
    )

    write_text(
        SHORTLIST_DOC_PATH,
        "\n".join(
            [
                "# 31 Actual Provider Shortlist And Due Diligence",
                "",
                "The actual-provider-later output is deliberately fail-closed:",
                "",
                "- no purchase, number reservation, sender verification, or spend is allowed in seq_031",
                "- current external posture remains `withheld`",
                "- combined suites are evaluated, but none are shortlisted as the default",
                "- seq_032 must only work from the telephony shortlist",
                "- seq_033 must only work from the SMS and email shortlists",
                "",
                "## Recommended Strategy",
                "",
                "`split_vendor_preferred`",
                "",
                "The evidence set shows that one vendor may cover multiple families, but split-vendor posture remains safer because it:",
                "",
                "- keeps telephony evidence and urgent-live semantics independent from notification sender/domain concerns",
                "- prevents one commercial platform from becoming hidden lifecycle authority",
                "- makes later exit and per-family swap decisions viable",
                "- keeps email replay-safe callback quality from being diluted by a voice/SMS bundle",
                "",
                "\n\n".join(shortlist_sections),
                "",
                "## Handoff Matrix",
                "",
                decision_note,
                "",
                "## Rejected Or Non-Shortlisted Calls",
                "",
                "- `postmark_email` is rejected because the reviewed official webhook guidance exposes custom headers/basic auth but not signed replay-safe callbacks.",
                "- `twilio_sendgrid_suite` and `sinch_mailgun_suite` remain candidates only because combined-suite coupling is still too high for the default posture.",
                "- `vonage_single_suite` is rejected because the reviewed official material does not provide a first-party all-three-family suite.",
            ]
        ),
    )

    decision_rows = [
        [
            "DEC_31_001",
            "accepted",
            "Keep the internal signal fabric as the only selected mock-now lane.",
            "Mock-first remains mandatory and seq_032/033 must not be blocked by live accounts.",
        ],
        [
            "DEC_31_002",
            "accepted",
            "Shortlist Twilio and Vonage for telephony.",
            "They have the strongest current public evidence for voice callbacks, fallback routing, IVR, recording references, and governance mechanics.",
        ],
        [
            "DEC_31_003",
            "accepted",
            "Shortlist Vonage and Twilio for SMS.",
            "Both publish strong callback evidence; Vonage edges ahead on signed webhook posture while Twilio remains strong on sandbox depth and market maturity.",
        ],
        [
            "DEC_31_004",
            "accepted",
            "Shortlist Mailgun and SendGrid for email.",
            "They publish the clearest current official webhook security and region/residency guidance.",
        ],
        [
            "DEC_31_005",
            "accepted",
            "Reject Postmark from the actual shortlist.",
            "The reviewed official webhook guidance does not show signed or replay-safe callbacks, which fails the seq_031 evidence bar.",
        ],
        [
            "DEC_31_006",
            "accepted",
            "Do not shortlist any combined suite.",
            "Coupling risk and portability penalties outweigh procurement simplification right now.",
        ],
        [
            "DEC_31_007",
            "accepted",
            "Carry account/project field-map work into seq_032 and seq_033 only.",
            "This task must prepare the handoff, not mutate real accounts.",
        ],
    ]
    write_text(
        DECISION_LOG_DOC_PATH,
        "\n".join(
            [
                "# 31 Vendor Selection Decision Log",
                "",
                markdown_table(["Decision", "Status", "Choice", "Rationale"], decision_rows),
                "",
                "## Family Priority Context",
                "",
                f"- telephony mock rank: {integration_rows['int_telephony_capture_evidence_backplane']['mock_now_execution_rank']}",
                f"- sms mock rank: {integration_rows['int_sms_continuation_delivery']['mock_now_execution_rank']}",
                f"- email mock rank: {integration_rows['int_email_notification_delivery']['mock_now_execution_rank']}",
                "- external gate posture: `withheld`",
            ]
        ),
    )

    evidence_rows = []
    for row in OFFICIAL_EVIDENCE:
        evidence_rows.append(
            [
                row["vendor_name"],
                ", ".join(row["provider_families"]),
                row["captured_on"],
                row["title"],
                row["url"],
                row["summary"],
            ]
        )
    write_text(
        EVIDENCE_DOC_PATH,
        "\n".join(
            [
                "# 31 Vendor Research Evidence Register",
                "",
                "Current vendor facts are temporally unstable, so seq_031 stores the official evidence set explicitly.",
                "",
                markdown_table(["Vendor", "Families", "Captured", "Title", "URL", "Summary"], evidence_rows),
            ]
        ),
    )

    kill_switch_table = markdown_table(
        ["Kill switch", "Family", "Trigger", "Effect"],
        [[row["kill_switch_id"], row["provider_family"], row["trigger"], row["effect"]] for row in kill_switch_rows],
    )
    write_text(
        DOCS_DIR / "31_vendor_selection_decision_log.md",
        DECISION_LOG_DOC_PATH.read_text().rstrip()
        + "\n\n## Kill Switches\n\n"
        + kill_switch_table
        + "\n",
    )


def build_atlas_payload(
    vendor_rows: list[dict[str, Any]],
    shortlist: dict[str, Any],
    kill_switch_rows: list[dict[str, Any]],
    lane_matrix: list[dict[str, Any]],
) -> dict[str, Any]:
    display_rows = []
    for row in vendor_rows:
        display_rows.append(
            {
                "vendor_id": row["vendor_id"],
                "vendor_name": row["vendor_name"],
                "provider_family": row["provider_family"],
                "vendor_lane": row["vendor_lane"],
                "mock_now_fit_score": row["mock_now_fit_score"],
                "actual_later_fit_score": row["actual_later_fit_score"],
                "lock_in_risk": row["lock_in_risk"],
                "supports_replay_protection": row["supports_replay_protection"],
                "supports_test_mode": row["supports_test_mode"],
                "supports_webhooks": row["supports_webhooks"],
                "supports_delivery_callbacks": row["supports_delivery_callbacks"],
                "supports_recording_or_attachment_references": row["supports_recording_or_attachment_references"],
                "notes": row["notes"],
                "cost_governance_notes": row["cost_governance_notes"],
                "kill_switch_reason_if_any": row["kill_switch_reason_if_any"],
                "uk_or_required_region_support_summary": row["uk_or_required_region_support_summary"],
                "source_refs": row["source_refs"],
                "evidence_ids": row["evidence_ids"],
                "dimension_ratings": row["dimension_ratings"],
                "dimension_titles": row["dimension_titles"],
                "trust_and_compliance_evidence_refs": row["trust_and_compliance_evidence_refs"],
            }
        )

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "summary": shortlist["summary"],
        "phase0_gate_posture": shortlist["phase0_gate_posture"],
        "tabs": [
            {"tab_id": "telephony_ivr", "label": "Telephony_IVR", "page_title": "Voice_and_IVR_Shortlist"},
            {"tab_id": "sms", "label": "SMS", "page_title": "SMS_Shortlist"},
            {"tab_id": "email", "label": "Email", "page_title": "Email_Shortlist"},
            {"tab_id": "mock_lane", "label": "Mock_Lane", "page_title": "Mock_Lane_Fidelity"},
            {"tab_id": "actual_lane", "label": "Actual_Lane", "page_title": "Decision_Log_and_Kill_Switches"},
        ],
        "families": FAMILY_CONFIG,
        "lane_matrix": lane_matrix,
        "vendors": display_rows,
        "evidence": OFFICIAL_EVIDENCE,
        "kill_switches": kill_switch_rows,
    }


def build_atlas_html(payload: dict[str, Any]) -> str:
    tab_markup = "\n".join(
        f'<button class="tab-button" type="button" data-testid="tab-{tab["tab_id"]}" aria-pressed="false"><span style="width:10px;height:10px;border-radius:999px;background:{FAMILY_CONFIG.get(tab["tab_id"], {}).get("accent", "#7A5AF8")};"></span><span>{tab["label"]}</span></button>'
        for tab in payload["tabs"]
    )
    template = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>31 Vendor Signal Fabric Atlas</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%231D4ED8'/%3E%3Cpath d='M16 16h12l4 16 8-16h8L36 48h-8z' fill='white'/%3E%3C/svg%3E">
  <style>
    :root {
      --canvas: #F6F8FB;
      --panel: #FFFFFF;
      --inset: #EEF3F8;
      --text-strong: #101828;
      --text: #1D2939;
      --text-muted: #667085;
      --border-subtle: #E4E7EC;
      --border: #D0D5DD;
      --primary: #1D4ED8;
      --secondary: #7A5AF8;
      --telephony: #0E9384;
      --sms: #B54708;
      --email: #C11574;
      --blocked: #C24141;
      --shadow: 0 18px 44px rgba(16, 24, 40, 0.08);
      --radius: 24px;
    }
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    body {
      margin: 0;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--canvas);
      color: var(--text);
    }
    body[data-reduced-motion="true"] * {
      animation-duration: 0ms !important;
      transition-duration: 0ms !important;
      scroll-behavior: auto !important;
    }
    .page {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px;
    }
    .sticky-shell {
      position: sticky;
      top: 0;
      z-index: 20;
      padding-top: 12px;
      background: linear-gradient(180deg, rgba(246,248,251,0.96), rgba(246,248,251,0.88) 72%, rgba(246,248,251,0));
      backdrop-filter: blur(8px);
    }
    .hero {
      min-height: 72px;
      display: grid;
      gap: 14px;
      padding: 18px 20px;
      background: linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,243,248,0.92));
      border: 1px solid var(--border-subtle);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
      flex-wrap: wrap;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      font-size: 12px;
      color: var(--text-muted);
    }
    .mark {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      background: linear-gradient(160deg, var(--primary), rgba(122,90,248,0.92));
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    h1 {
      margin: 8px 0 6px;
      font-size: clamp(28px, 4vw, 40px);
      line-height: 1.02;
      color: var(--text-strong);
    }
    p {
      margin: 0;
      line-height: 1.6;
    }
    .hero-metrics {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .metric-pill {
      min-height: 36px;
      padding: 8px 12px;
      border-radius: 999px;
      background: white;
      border: 1px solid var(--border);
      display: inline-flex;
      gap: 8px;
      align-items: center;
      font-size: 13px;
    }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .tab-rail {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      width: 100%;
    }
    .tab-button {
      min-height: 44px;
      padding: 10px 14px;
      border-radius: 18px;
      border: 1px solid var(--border);
      background: white;
      color: var(--text);
      font: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }
    .tab-button[aria-pressed="true"] {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.12);
      background: rgba(255,255,255,0.98);
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 20px;
      margin-top: 22px;
    }
    .main-column {
      display: grid;
      gap: 20px;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .panel-pad { padding: 18px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .section-header h2,
    .section-header h3 {
      margin: 0;
      font-size: 17px;
      color: var(--text-strong);
    }
    .control-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .select,
    .toggle,
    .chip-button {
      min-height: 44px;
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 0 12px;
      background: white;
      color: var(--text);
      font: inherit;
    }
    .toggle {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .chip-button {
      cursor: pointer;
      min-height: 28px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      background: var(--inset);
    }
    .chip-button[data-active="true"] {
      border-color: var(--primary);
      background: rgba(29, 78, 216, 0.1);
    }
    .chip-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .provider-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }
    .provider-card {
      min-height: 180px;
      border: 1px solid var(--border-subtle);
      border-radius: 22px;
      padding: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,1), rgba(246,248,251,0.96));
      display: grid;
      gap: 12px;
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }
    .provider-card:hover,
    .provider-card:focus-visible {
      transform: translateY(-1px);
      border-color: var(--primary);
      box-shadow: 0 14px 34px rgba(16,24,40,0.08);
      outline: none;
    }
    .provider-card[data-selected="true"] {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.12);
    }
    .provider-top {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: start;
    }
    .provider-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-strong);
    }
    .provider-meta {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .badge {
      min-height: 28px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      background: white;
      color: var(--text-muted);
    }
    .badge.blocked {
      border-color: rgba(194, 65, 65, 0.35);
      color: var(--blocked);
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .score-cell {
      border-radius: 18px;
      background: var(--inset);
      border: 1px solid var(--border-subtle);
      padding: 12px;
    }
    .score-label {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .score-value {
      margin-top: 6px;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-strong);
    }
    .note {
      font-size: 14px;
      color: var(--text);
    }
    .diagram-strip,
    .chart-strip {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 16px;
    }
    .mini-panel {
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 14px;
      background: linear-gradient(180deg, rgba(255,255,255,1), rgba(238,243,248,0.7));
    }
    .diagram-grid {
      display: grid;
      gap: 12px;
    }
    .diagram-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 12px;
      align-items: center;
    }
    .diagram-bar {
      height: 18px;
      border-radius: 999px;
      background: var(--inset);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
    }
    .diagram-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      width: 0%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      text-align: left;
      padding: 10px 8px;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: top;
    }
    th { color: var(--text-muted); font-weight: 600; }
    .drawer {
      position: sticky;
      top: 92px;
      max-height: calc(100vh - 108px);
      overflow: auto;
      padding: 18px;
      display: grid;
      gap: 16px;
    }
    .drawer h2 { margin: 0; font-size: 18px; }
    .evidence-list,
    .decision-list {
      display: grid;
      gap: 12px;
    }
    .evidence-card,
    .decision-card {
      border-radius: 18px;
      border: 1px solid var(--border-subtle);
      padding: 14px;
      background: var(--inset);
    }
    .link {
      color: var(--primary);
      text-decoration: none;
    }
    .link:hover,
    .link:focus-visible { text-decoration: underline; }
    .muted { color: var(--text-muted); }
    .hidden { display: none !important; }
    .footer-note {
      font-size: 12px;
      color: var(--text-muted);
    }
    @media (max-width: 1100px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .drawer { position: static; max-height: none; }
      .diagram-strip,
      .chart-strip { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .page { padding: 14px; }
      .provider-grid { grid-template-columns: 1fr; }
      .score-grid { grid-template-columns: 1fr; }
      .diagram-row { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="page" data-testid="vendor-atlas-shell">
    <div class="sticky-shell">
      <header class="hero" data-testid="sticky-header">
        <div class="hero-top">
          <div>
            <div class="eyebrow"><span class="mark">V</span><span>COMMUNICATIONS_VENDOR_ATLAS</span><span class="mono" data-testid="visual-mode">Signal_Fabric_Atlas</span></div>
            <h1>Signal Fabric Atlas</h1>
            <p>Current official vendor evidence with family-specific scoring, mock-now lane freeze, and fail-closed actual-later shortlist.</p>
          </div>
          <div class="hero-metrics">
            <div class="metric-pill" data-testid="metric-shortlisted"><strong id="metric-shortlisted-value"></strong><span>shortlisted</span></div>
            <div class="metric-pill" data-testid="metric-rejected"><strong id="metric-rejected-value"></strong><span>rejected</span></div>
            <div class="metric-pill" data-testid="metric-mock"><strong id="metric-mock-value"></strong><span>mock lane</span></div>
            <div class="metric-pill" data-testid="metric-freshness"><strong class="mono" id="metric-freshness-value"></strong><span>freshness</span></div>
            <div class="metric-pill" data-testid="reduced-motion-indicator"><strong id="motion-value"></strong><span>motion</span></div>
          </div>
        </div>
        <div class="tab-rail" data-testid="tab-rail">__TABS__</div>
      </header>
    </div>

    <div class="layout">
      <main class="main-column">
        <section class="panel panel-pad" data-testid="comparison-workspace">
          <div class="section-header">
            <div>
              <h2 id="workspace-title"></h2>
              <p class="muted" id="workspace-summary"></p>
            </div>
            <div class="control-row">
              <label>
                <span class="muted">Sort</span><br>
                <select id="sort-select" class="select" data-testid="sort-select">
                  <option value="actual_later_fit_score">Actual score</option>
                  <option value="mock_now_fit_score">Mock score</option>
                  <option value="lock_in_risk">Lock-in risk</option>
                  <option value="vendor_name">Vendor</option>
                </select>
              </label>
              <label>
                <span class="muted">Dimension focus</span><br>
                <select id="dimension-filter" class="select" data-testid="dimension-filter"></select>
              </label>
              <button id="lane-toggle" class="toggle" type="button" data-testid="lane-toggle" aria-pressed="false">Lane: actual_later</button>
            </div>
          </div>
          <div class="chip-row" id="lane-chip-row" data-testid="lane-chip-row"></div>
          <div class="provider-grid" id="provider-grid" data-testid="provider-grid"></div>
        </section>

        <section class="panel panel-pad">
          <div class="section-header">
            <h2>Family Coverage Diagram</h2>
            <p class="muted">Diagram/table parity for shortlist coverage and lane state.</p>
          </div>
          <div class="diagram-strip">
            <div class="mini-panel">
              <div class="diagram-grid" id="coverage-diagram" data-testid="coverage-diagram"></div>
            </div>
            <div class="mini-panel">
              <table data-testid="coverage-table">
                <thead>
                  <tr><th>Family</th><th>Shortlist</th><th>Mock lane</th></tr>
                </thead>
                <tbody id="coverage-table-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="panel panel-pad">
          <div class="section-header">
            <h2>Score By Dimension</h2>
            <p class="muted">Selected vendor chart with adjacent table parity.</p>
          </div>
          <div class="chart-strip">
            <div class="mini-panel">
              <div id="dimension-chart" data-testid="dimension-chart"></div>
            </div>
            <div class="mini-panel">
              <table data-testid="dimension-table">
                <thead><tr><th>Dimension</th><th>Score</th></tr></thead>
                <tbody id="dimension-table-body"></tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <aside class="panel drawer" data-testid="evidence-drawer">
        <div>
          <div class="eyebrow"><span class="mono">drawer</span><span>due diligence</span></div>
          <h2 id="drawer-title"></h2>
          <p class="note" id="drawer-notes"></p>
        </div>
        <div class="score-grid">
          <div class="score-cell" data-testid="drawer-score-actual"><div class="score-label">actual fit</div><div class="score-value" id="drawer-actual-score"></div></div>
          <div class="score-cell" data-testid="drawer-score-mock"><div class="score-label">mock fit</div><div class="score-value" id="drawer-mock-score"></div></div>
        </div>
        <div class="panel" style="box-shadow:none;border-radius:20px;">
          <div class="panel-pad">
            <h3>Evidence</h3>
            <div id="evidence-list" class="evidence-list"></div>
          </div>
        </div>
        <div class="panel" style="box-shadow:none;border-radius:20px;">
          <div class="panel-pad">
            <h3>Decision Log / Kill Switches</h3>
            <div id="decision-list" class="decision-list"></div>
          </div>
        </div>
        <div class="footer-note">Offline complete. No remote assets are required after initial local load.</div>
      </aside>
    </div>
  </div>

  <script type="application/json" id="atlas-data">__DATA__</script>
  <script>
    const payload = JSON.parse(document.getElementById("atlas-data").textContent);
    const state = {
      tab: "telephony_ivr",
      lane: "actual_later",
      dimensionFilter: "all",
      sortBy: "actual_later_fit_score",
      selectedVendorId: null,
    };
    const riskOrder = { low: 1, medium: 2, high: 3, very_high: 4 };
    const tabRail = document.querySelector("[data-testid='tab-rail']");
    const providerGrid = document.getElementById("provider-grid");
    const laneChipRow = document.getElementById("lane-chip-row");
    const dimensionFilter = document.getElementById("dimension-filter");
    const sortSelect = document.getElementById("sort-select");
    const laneToggle = document.getElementById("lane-toggle");

    function reducedMotionEnabled() {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function vendorRowsForCurrentTab() {
      if (state.tab === "mock_lane") {
        return payload.vendors.filter((row) => row.vendor_lane === "mock_only");
      }
      if (state.tab === "actual_lane") {
        return payload.vendors.filter((row) => row.provider_family === "combined" || row.vendor_lane === "rejected");
      }
      return payload.vendors.filter((row) => row.provider_family === state.tab);
    }

    function activeRows() {
      const rows = vendorRowsForCurrentTab().filter((row) => {
        if (state.tab === "mock_lane") {
          return true;
        }
        if (state.lane === "mock_now") {
          return row.vendor_lane === "mock_only" || row.provider_family === state.tab;
        }
        if (state.tab === "actual_lane") {
          return row.vendor_lane !== "mock_only";
        }
        return row.vendor_lane !== "mock_only";
      });
      if (state.dimensionFilter === "all") return rows;
      return rows.filter((row) => row.dimension_ratings[state.dimensionFilter] >= 4);
    }

    function currentAccent(tabId) {
      if (tabId === "sms") return "var(--sms)";
      if (tabId === "email") return "var(--email)";
      if (tabId === "telephony_ivr") return "var(--telephony)";
      return "var(--secondary)";
    }

    function renderTabs() {
      tabRail.innerHTML = "";
      payload.tabs.forEach((tab) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tab-button";
        button.dataset.testid = `tab-${tab.tab_id}`;
        button.setAttribute("data-testid", `tab-${tab.tab_id}`);
        button.setAttribute("aria-pressed", String(state.tab === tab.tab_id));
        button.innerHTML = `<span style="width:10px;height:10px;border-radius:999px;background:${currentAccent(tab.tab_id)};"></span><span>${tab.label}</span>`;
        button.addEventListener("click", () => {
          state.tab = tab.tab_id;
          state.dimensionFilter = "all";
          state.selectedVendorId = null;
          render();
        });
        tabRail.appendChild(button);
      });
    }

    function renderMetrics() {
      const shortlisted = payload.vendors.filter((row) => row.vendor_lane === "shortlisted").length;
      const rejected = payload.vendors.filter((row) => row.vendor_lane === "rejected").length;
      const mockCount = payload.vendors.filter((row) => row.vendor_lane === "mock_only").length;
      document.getElementById("metric-shortlisted-value").textContent = String(shortlisted);
      document.getElementById("metric-rejected-value").textContent = String(rejected);
      document.getElementById("metric-mock-value").textContent = String(mockCount);
      document.getElementById("metric-freshness-value").textContent = payload.captured_on;
      document.getElementById("motion-value").textContent = reducedMotionEnabled() ? "reduced" : "standard";
      document.body.dataset.reducedMotion = String(reducedMotionEnabled());
    }

    function renderWorkspaceMeta() {
      const map = {
        telephony_ivr: "Telephony / IVR shortlist with explicit callback, recording, and region tradeoffs.",
        sms: "SMS shortlist with wrong-recipient risk, delivery callbacks, and sender-governance tradeoffs.",
        email: "Email shortlist with bounce/complaint callback evidence, domain verification, and residency posture.",
        mock_lane: "Selected mock-now lane preserving delivery truth and replay-safe callback semantics across all families.",
        actual_lane: "Combined-suite comparison, rejection log, and kill-switch posture for later procurement review.",
      };
      const currentTab = payload.tabs.find((tab) => tab.tab_id === state.tab);
      document.getElementById("workspace-title").textContent = currentTab.page_title;
      document.getElementById("workspace-summary").textContent = map[state.tab];
    }

    function renderFilters() {
      sortSelect.value = state.sortBy;
      dimensionFilter.innerHTML = "";
      const optionAll = document.createElement("option");
      optionAll.value = "all";
      optionAll.textContent = "All dimensions";
      dimensionFilter.appendChild(optionAll);
      const dimensionTitles = payload.vendors[0].dimension_titles;
      Object.entries(dimensionTitles).forEach(([dimensionId, title]) => {
        const option = document.createElement("option");
        option.value = dimensionId;
        option.textContent = title;
        dimensionFilter.appendChild(option);
      });
      dimensionFilter.value = state.dimensionFilter;
      laneToggle.setAttribute("aria-pressed", String(state.lane === "mock_now"));
      laneToggle.textContent = `Lane: ${state.lane}`;

      laneChipRow.innerHTML = "";
      ["shortlisted", "candidate", "rejected", "mock_only"].forEach((lane) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chip-button";
        button.setAttribute("data-testid", `lane-chip-${lane}`);
        button.dataset.active = String(state.tab === "mock_lane" ? lane === "mock_only" : true);
        button.textContent = lane;
        button.addEventListener("click", () => {
          state.selectedVendorId = null;
          if (lane === "mock_only") {
            state.tab = "mock_lane";
          } else {
            state.tab = "actual_lane";
          }
          render();
        });
        laneChipRow.appendChild(button);
      });
    }

    function compareRows(a, b) {
      if (state.sortBy === "lock_in_risk") {
        return (riskOrder[a.lock_in_risk] || 0) - (riskOrder[b.lock_in_risk] || 0);
      }
      if (state.sortBy === "vendor_name") {
        return a.vendor_name.localeCompare(b.vendor_name);
      }
      return b[state.sortBy] - a[state.sortBy];
    }

    function ensureSelected(rows) {
      if (!rows.length) {
        state.selectedVendorId = null;
        return;
      }
      if (!rows.find((row) => row.vendor_id === state.selectedVendorId)) {
        state.selectedVendorId = rows[0].vendor_id;
      }
    }

    function renderProviders() {
      const rows = activeRows().sort(compareRows);
      ensureSelected(rows);
      providerGrid.innerHTML = "";
      rows.forEach((row) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "provider-card";
        card.setAttribute("data-testid", `provider-row-${row.vendor_id}`);
        card.dataset.selected = String(row.vendor_id === state.selectedVendorId);
        card.innerHTML = `
          <div class="provider-top">
            <div>
              <div class="provider-meta mono">${row.vendor_id}</div>
              <div class="provider-title">${row.vendor_name}</div>
            </div>
            <span class="badge ${row.vendor_lane === "rejected" ? "blocked" : ""}">${row.vendor_lane}</span>
          </div>
          <div class="score-grid">
            <div class="score-cell">
              <div class="score-label">Actual fit</div>
              <div class="score-value" data-testid="score-cell-${row.vendor_id}-actual_later_fit_score">${row.actual_later_fit_score}</div>
            </div>
            <div class="score-cell">
              <div class="score-label">Mock fit</div>
              <div class="score-value" data-testid="score-cell-${row.vendor_id}-mock_now_fit_score">${row.mock_now_fit_score}</div>
            </div>
          </div>
          <div class="chip-row">
            <span class="badge">replay ${row.supports_replay_protection ? "yes" : "no"}</span>
            <span class="badge">test ${row.supports_test_mode ? "yes" : "no"}</span>
            <span class="badge">lock-in ${row.lock_in_risk}</span>
          </div>
          <p class="note">${row.notes}</p>
        `;
        card.addEventListener("click", () => {
          state.selectedVendorId = row.vendor_id;
          renderDrawer();
          renderDimensionView();
        });
        providerGrid.appendChild(card);
      });
    }

    function selectedVendor() {
      return payload.vendors.find((row) => row.vendor_id === state.selectedVendorId) || payload.vendors[0];
    }

    function renderDrawer() {
      const row = selectedVendor();
      document.getElementById("drawer-title").textContent = row.vendor_name;
      document.getElementById("drawer-notes").textContent = row.uk_or_required_region_support_summary;
      document.getElementById("drawer-actual-score").textContent = String(row.actual_later_fit_score);
      document.getElementById("drawer-mock-score").textContent = String(row.mock_now_fit_score);
      const evidenceRows = payload.evidence.filter((item) => row.evidence_ids.includes(item.evidence_id));
      const evidenceList = document.getElementById("evidence-list");
      evidenceList.innerHTML = "";
      evidenceRows.forEach((item) => {
        const card = document.createElement("article");
        card.className = "evidence-card";
        card.setAttribute("data-testid", `evidence-card-${item.evidence_id}`);
        card.innerHTML = `
          <div class="provider-meta">${item.evidence_type}</div>
          <strong>${item.title}</strong>
          <p class="note">${item.summary}</p>
          <p class="muted"><span class="mono">${item.captured_on}</span> · ${item.freshness}</p>
          <a class="link" href="${item.url}">${item.url}</a>
        `;
        evidenceList.appendChild(card);
      });
      const decisionList = document.getElementById("decision-list");
      decisionList.innerHTML = "";
      payload.kill_switches
        .filter((item) => item.provider_family === row.provider_family || item.impacted_vendor_ids.includes(row.vendor_id))
        .forEach((item) => {
          const card = document.createElement("article");
          card.className = "decision-card";
          card.innerHTML = `
            <div class="provider-meta mono">${item.kill_switch_id}</div>
            <strong>${item.provider_family}</strong>
            <p class="note">${item.trigger}</p>
            <p class="muted">${item.effect}</p>
          `;
          decisionList.appendChild(card);
        });
      if (row.kill_switch_reason_if_any) {
        const alert = document.createElement("article");
        alert.className = "decision-card";
        alert.innerHTML = `<div class="provider-meta mono">rejection</div><strong>Vendor-specific decision</strong><p class="note">${row.kill_switch_reason_if_any}</p>`;
        decisionList.prepend(alert);
      }
    }

    function renderCoverage() {
      const coverageDiagram = document.getElementById("coverage-diagram");
      const coverageTableBody = document.getElementById("coverage-table-body");
      coverageDiagram.innerHTML = "";
      coverageTableBody.innerHTML = "";
      payload.lane_matrix.forEach((row) => {
        const shortlistCount = row.shortlisted_vendor_ids ? row.shortlisted_vendor_ids.split(";").filter(Boolean).length : 0;
        const wrap = document.createElement("div");
        wrap.className = "diagram-row";
        wrap.innerHTML = `
          <div><strong>${row.family_title}</strong><div class="muted mono">${row.mock_provider_id}</div></div>
          <div class="diagram-bar"><div class="diagram-fill" style="width:${Math.max(12, shortlistCount * 28)}%"></div></div>
        `;
        coverageDiagram.appendChild(wrap);

        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.family_title}</td><td>${row.shortlisted_vendor_names || "none"}</td><td>${row.mock_provider_name}</td>`;
        coverageTableBody.appendChild(tr);
      });
    }

    function renderDimensionView() {
      const row = selectedVendor();
      const dimensionChart = document.getElementById("dimension-chart");
      const dimensionTableBody = document.getElementById("dimension-table-body");
      dimensionChart.innerHTML = "";
      dimensionTableBody.innerHTML = "";
      Object.entries(row.dimension_titles).forEach(([dimensionId, title]) => {
        const score = row.dimension_ratings[dimensionId];
        const band = document.createElement("div");
        band.className = "diagram-row";
        band.innerHTML = `
          <div>${title}</div>
          <div class="diagram-bar"><div class="diagram-fill" style="width:${score * 20}%"></div></div>
        `;
        band.setAttribute("data-testid", `score-band-${row.vendor_id}-${dimensionId}`);
        dimensionChart.appendChild(band);

        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${title}</td><td data-testid="score-cell-${row.vendor_id}-${dimensionId}">${score}</td>`;
        dimensionTableBody.appendChild(tr);
      });
    }

    function render() {
      renderTabs();
      renderMetrics();
      renderWorkspaceMeta();
      renderFilters();
      renderProviders();
      renderCoverage();
      renderDrawer();
      renderDimensionView();
    }

    sortSelect.addEventListener("change", (event) => {
      state.sortBy = event.target.value;
      renderProviders();
    });
    dimensionFilter.addEventListener("change", (event) => {
      state.dimensionFilter = event.target.value;
      renderProviders();
    });
    laneToggle.addEventListener("click", () => {
      state.lane = state.lane === "actual_later" ? "mock_now" : "actual_later";
      render();
    });
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", () => renderMetrics());
    render();
  </script>
</body>
</html>
"""
    return template.replace("__TABS__", tab_markup).replace("__DATA__", json.dumps(payload))


def build() -> None:
    inputs = ensure_inputs()
    scorecards_by_family = scorecard_lookup(inputs["scorecards"])
    integration_rows = integration_lookup(inputs["integration_priority"])
    weights = family_weights(scorecards_by_family)
    vendor_rows = enrich_vendors(build_vendor_definitions(), weights, scorecards_by_family)
    kill_switch_rows = build_kill_switches()
    lane_matrix = build_lane_matrix(vendor_rows)
    summary = build_summary(vendor_rows, inputs["external_account_inventory"], integration_rows)
    shortlist = build_shortlist_payload(vendor_rows, lane_matrix, inputs["phase0_gate"], summary)
    atlas_payload = build_atlas_payload(vendor_rows, shortlist, kill_switch_rows, lane_matrix)

    write_csv(UNIVERSE_CSV_PATH, build_universe_csv_rows(vendor_rows))
    write_json(SHORTLIST_JSON_PATH, shortlist)
    write_jsonl(EVIDENCE_JSONL_PATH, OFFICIAL_EVIDENCE)
    write_csv(LANE_MATRIX_CSV_PATH, lane_matrix)
    write_csv(KILL_SWITCHES_CSV_PATH, kill_switch_rows)
    build_docs(vendor_rows, shortlist, lane_matrix, kill_switch_rows, integration_rows)
    write_text(ATLAS_HTML_PATH, build_atlas_html(atlas_payload))

    print(
        json.dumps(
            {
                "task_id": TASK_ID,
                "vendor_rows": summary["vendor_rows"],
                "shortlisted": summary["actual_shortlisted_vendor_count"],
                "rejected": summary["lane_counts"].get("rejected", 0),
                "evidence_rows": summary["official_evidence_rows"],
                "visual_mode": VISUAL_MODE,
            }
        )
    )


if __name__ == "__main__":
    build()
