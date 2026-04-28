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
APP_DIR = ROOT / "apps" / "mock-telephony-lab"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"
SERVICE_DIR = ROOT / "services" / "mock-telephony-carrier"
SERVICE_SRC_DIR = SERVICE_DIR / "src"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

TASK_ID = "seq_032"
CAPTURED_ON = "2026-04-09"
VISUAL_MODE = "Voice_Fabric_Lab"
MISSION = (
    "Create the telephony account-and-number provisioning pack with a high-fidelity local "
    "telephony lab and a gated real provider-later workspace, number, webhook, and recording "
    "strategy that preserves urgent-live preemption, evidence readiness, and SMS continuation law."
)

REQUIRED_INPUTS = {
    "vendor_shortlist": DATA_DIR / "31_vendor_shortlist.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
}

PACK_JSON_PATH = DATA_DIR / "32_telephony_lab_pack.json"
FIELD_MAP_PATH = DATA_DIR / "32_telephony_field_map.json"
NUMBER_INVENTORY_PATH = DATA_DIR / "32_local_test_number_inventory.csv"
WEBHOOK_MATRIX_PATH = DATA_DIR / "32_telephony_webhook_matrix.csv"
LIVE_GATE_PATH = DATA_DIR / "32_telephony_live_gate_checklist.json"

LOCAL_SPEC_DOC_PATH = DOCS_DIR / "32_local_telephony_lab_spec.md"
FIELD_MAP_DOC_PATH = DOCS_DIR / "32_telephony_account_and_number_field_map.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "32_telephony_live_gate_and_spend_controls.md"
WEBHOOK_DOC_PATH = DOCS_DIR / "32_telephony_webhook_and_recording_config_strategy.md"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "telephonyLabPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "telephony-lab-pack.json"

SOURCE_PRECEDENCE = [
    "prompt/032.md",
    "prompt/031.md",
    "prompt/033.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/31_vendor_shortlist.json",
    "data/analysis/external_account_inventory.csv",
    "data/analysis/phase0_gate_verdict.json",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/31_actual_provider_shortlist_and_due_diligence.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/patient-account-and-communications-blueprint.md",
    "blueprint/callback-and-clinician-messaging-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "https://www.twilio.com/docs/iam/api-keys",
    "https://www.twilio.com/docs/iam/api/subaccounts",
    "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
    "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
    "https://www.twilio.com/docs/phone-numbers/api/availablephonenumberlocal-resource",
    "https://www.twilio.com/docs/voice/api/recording",
    "https://www.twilio.com/en-us/voice/pricing/gb",
    "https://developer.vonage.com/en/voice/voice-api/getting-started",
    "https://developer.vonage.com/en/application/overview",
    "https://developer.vonage.com/en/getting-started/concepts/webhooks",
    "https://developer.vonage.com/de/api/numbers",
    "https://www.vonage.com/communications-apis/pricing/",
]

OFFICIAL_VENDOR_GUIDANCE = [
    {
        "source_id": "twilio_api_keys_overview",
        "vendor": "Twilio",
        "title": "API keys overview | Twilio",
        "url": "https://www.twilio.com/docs/iam/api-keys",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Twilio positions API keys as the preferred REST authentication mechanism, warns that "
            "Account SID plus Auth Token are risky in production, and documents standard and "
            "restricted key types."
        ),
        "grounding": [
            "API keys are the preferred way to authenticate with Twilio REST APIs.",
            "Twilio warns against using Account SID and Auth Token as production credentials.",
            "Restricted API keys allow minimum and specific access levels.",
            "API credentials are region-specific resources when Twilio Regions are in use.",
        ],
    },
    {
        "source_id": "twilio_subaccounts",
        "vendor": "Twilio",
        "title": "REST API: Subaccounts | Twilio",
        "url": "https://www.twilio.com/docs/iam/api/subaccounts",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Twilio subaccounts segment usage, credentials, and historical data. Closed "
            "subaccounts stay visible and are deleted after closure only under specific settings."
        ),
        "grounding": [
            "Main accounts can create and manage subaccounts for isolated workspaces.",
            "Twilio deletes closed subaccounts 30 days after closure by default.",
            "Historical data remains visible unless deletion of closed subaccounts is activated.",
        ],
    },
    {
        "source_id": "twilio_webhooks_security",
        "vendor": "Twilio",
        "title": "Webhooks security | Twilio",
        "url": "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Twilio signs inbound callbacks and requires server-side validation over the request "
            "target plus parameter set, with `X-Twilio-Signature` as the primary integrity signal."
        ),
        "grounding": [
            "Twilio sends an `X-Twilio-Signature` header on incoming webhook requests.",
            "Webhook validation must compare the full URL and request parameters with the signature.",
            "Signature validation is a transport-authenticity guard, not an authoritative business outcome.",
        ],
    },
    {
        "source_id": "twilio_incoming_phone_numbers",
        "vendor": "Twilio",
        "title": "IncomingPhoneNumber resource | Twilio",
        "url": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Provisioning is a two-step process: search available numbers, then POST to the "
            "IncomingPhoneNumbers resource. Numbers expose capability flags and per-number voice, "
            "fallback, SMS, and status callback fields."
        ),
        "grounding": [
            "Provisioning a phone number is a two-step process: find then POST to IncomingPhoneNumbers.",
            "Capabilities explicitly separate Voice, SMS, and MMS booleans.",
            "Incoming phone numbers support `VoiceUrl`, `VoiceFallbackUrl`, `SmsUrl`, and `StatusCallback`.",
            "Numbers can be deleted and released through the same resource family.",
        ],
    },
    {
        "source_id": "twilio_available_phone_numbers",
        "vendor": "Twilio",
        "title": "AvailablePhoneNumber Local resource | Twilio",
        "url": "https://www.twilio.com/docs/phone-numbers/api/availablephonenumberlocal-resource",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Twilio supports filtered local-number search by pattern, geography, and capabilities "
            "before purchase."
        ),
        "grounding": [
            "Search can filter on phone-number pattern, geography, and supported features like SMS.",
            "Available numbers publish capability booleans for Voice, SMS, and MMS.",
            "The resource explicitly leads into the purchase flow.",
        ],
    },
    {
        "source_id": "twilio_recordings_resource",
        "vendor": "Twilio",
        "title": "Recordings resource | Twilio",
        "url": "https://www.twilio.com/docs/voice/api/recording",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Twilio recordings expose status and metadata through a dedicated resource. The pack "
            "treats recording status as weaker than evidence readiness and never as submission truth."
        ),
        "grounding": [
            "Recording lifecycle is managed through a dedicated resource.",
            "Recording state is separate from request promotion or callback completion.",
            "Recording events and URLs are transport artefacts that still require Vecells evidence checks.",
        ],
    },
    {
        "source_id": "twilio_voice_pricing_gb",
        "vendor": "Twilio",
        "title": "Programmable Voice Pricing in United Kingdom | Twilio",
        "url": "https://www.twilio.com/en-us/voice/pricing/gb",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Twilio advertises UK phone-number pricing and notes that clean local numbers can be "
            "instantly provisioned through the console or number provisioning API."
        ),
        "grounding": [
            "Twilio UK pricing includes monthly charges for local numbers.",
            "Twilio documents instant provisioning through the console or number provisioning API.",
            "Commercial number creation is therefore billable and must remain behind spend gates.",
        ],
    },
    {
        "source_id": "vonage_voice_getting_started",
        "vendor": "Vonage",
        "title": "Getting Started with Voice API | Vonage",
        "url": "https://developer.vonage.com/en/voice/voice-api/getting-started",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Vonage requires an account with API key and secret, documents a demo or trial caller ID "
            "of `123456789`, and requires account credit before renting a number."
        ),
        "grounding": [
            "A Vonage account yields an API key and secret for API access.",
            "The test number `123456789` may be used as caller ID for demo or trial accounts.",
            "Renting a number requires adding credit to the account.",
            "The dashboard exposes a Buy Numbers flow with Voice capability filtering.",
        ],
    },
    {
        "source_id": "vonage_application_api_overview",
        "vendor": "Vonage",
        "title": "Application API Overview | Vonage",
        "url": "https://developer.vonage.com/en/application/overview",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Vonage applications hold security configuration, callbacks, and capability wiring for "
            "Voice, Messages, and RTC."
        ),
        "grounding": [
            "A Vonage API application contains the security and configuration information needed to connect to endpoints.",
            "Applications configure authentication and callbacks.",
            "Applications may support Voice, Messages, and RTC capabilities.",
        ],
    },
    {
        "source_id": "vonage_webhooks",
        "vendor": "Vonage",
        "title": "Webhooks | Vonage",
        "url": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Vonage documents application-level `answer_url`, `event_url`, and optional "
            "`fallback_answer_url` plus number-level status callbacks and recording event URLs."
        ),
        "grounding": [
            "Linked numbers use `answer_url` to retrieve an NCCO and `event_url` for call-status information.",
            "An optional `fallback_answer_url` is used when `answer_url` or `event_url` is unavailable.",
            "Number-level status callbacks can be configured per purchased number.",
            "Recording event URLs are separate callback endpoints.",
        ],
    },
    {
        "source_id": "vonage_numbers_api",
        "vendor": "Vonage",
        "title": "Numbers API Reference | Vonage",
        "url": "https://developer.vonage.com/de/api/numbers",
        "captured_on": CAPTURED_ON,
        "summary": (
            "The Numbers API supports listing, searching, buying, cancelling, and updating numbers. "
            "Number updates carry app binding plus voice status callback configuration."
        ),
        "grounding": [
            "The Numbers API supports search, buy, cancel, and update operations.",
            "Buy and cancel are explicit billable mutation surfaces.",
            "Number update supports `app_id`, `voiceStatusCallback`, and other callback fields.",
        ],
    },
    {
        "source_id": "vonage_pricing",
        "vendor": "Vonage",
        "title": "API Pricing | Vonage",
        "url": "https://www.vonage.com/communications-apis/pricing/",
        "captured_on": CAPTURED_ON,
        "summary": (
            "Vonage pricing confirms that voice and number provisioning are commercial actions and "
            "should stay behind named spend and procurement approval."
        ),
        "grounding": [
            "Voice and number consumption are commercial API products.",
            "Spend control must be explicit before number purchase or live enablement.",
        ],
    },
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_MOCK_NUMBERS_USE_NON_ROUTABLE_PLACEHOLDER_FORMAT",
        "summary": (
            "The lab uses `MOCK:+44-VC-XXXX` placeholders so operator screens can rehearse E.164-like "
            "handling without implying real PSTN routability."
        ),
        "consequence": "Mock numbers remain visibly non-live while still exercising formatter, routing, and selector logic.",
    },
    {
        "assumption_id": "ASSUMPTION_SERVICE_AND_APP_SHARE_ONE_PACK_BUT_KEEP_TRUTH_SEPARATION",
        "summary": (
            "The mock carrier and the Voice_Fabric_Lab read one deterministic pack, but neither may "
            "treat transport acknowledgement, recording arrival, or SMS dispatch as authoritative request truth."
        ),
        "consequence": "The local lab stays faithful to the blueprint without inventing a phone-only lifecycle.",
    },
    {
        "assumption_id": "ASSUMPTION_PHASE0_WITHHELD_KEEPS_REAL_MUTATION_DISABLED",
        "summary": (
            "Even with vendor shortlist, named approver, and environment data present, real account "
            "or number creation remains disabled while the Phase 0 external-readiness chain is withheld."
        ),
        "consequence": "The dry-run harness can validate form and source mechanics without ever mutating live vendor state.",
    },
]

FIELD_ROWS = [
    {
        "field_id": "FLD_SHARED_VENDOR_ID",
        "provider_vendor": "shared",
        "field_group": "governance",
        "provider_field_name": "telephony_vendor_id",
        "canonical_label": "Approved telephony vendor",
        "value_kind": "enum",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "data/analysis/31_vendor_shortlist.json#shortlist_by_family.telephony_ivr",
        "notes": "Must be one of the task 031 shortlisted vendors and never a non-shortlisted suite.",
    },
    {
        "field_id": "FLD_SHARED_NAMED_APPROVER",
        "provider_vendor": "shared",
        "field_group": "governance",
        "provider_field_name": "named_approver",
        "canonical_label": "Named approver",
        "value_kind": "string",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "prompt/032.md; docs/external/23_actual_partner_account_governance.md",
        "notes": "Required before any real portal step or billable number action.",
    },
    {
        "field_id": "FLD_SHARED_TARGET_ENVIRONMENT",
        "provider_vendor": "shared",
        "field_group": "governance",
        "provider_field_name": "target_environment",
        "canonical_label": "Target environment",
        "value_kind": "enum",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "prompt/032.md; data/analysis/phase0_gate_verdict.json",
        "notes": "Values are `local_mock`, `provider_like_preprod`, or `production`; live starts blocked while Phase 0 is withheld.",
    },
    {
        "field_id": "FLD_SHARED_CALLBACK_BASE_URL",
        "provider_vendor": "shared",
        "field_group": "webhook",
        "provider_field_name": "callback_base_url",
        "canonical_label": "Callback base URL",
        "value_kind": "uri",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "prompt/032.md; blueprint/phase-2-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
        "notes": "All provider callbacks land on internal endpoints before becoming canonical telephony events.",
    },
    {
        "field_id": "FLD_SHARED_RECORDING_POLICY",
        "provider_vendor": "shared",
        "field_group": "recording",
        "provider_field_name": "recording_policy_ref",
        "canonical_label": "Recording policy",
        "value_kind": "enum",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "blueprint/phase-2-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
        "notes": "Recording policy is distinct from evidence readiness and must point to a reviewed retention posture.",
    },
    {
        "field_id": "FLD_SHARED_NUMBER_PROFILE",
        "provider_vendor": "shared",
        "field_group": "number",
        "provider_field_name": "number_profile_ref",
        "canonical_label": "Number profile",
        "value_kind": "enum",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "data/analysis/32_local_test_number_inventory.csv",
        "notes": "Ties one number choice to IVR, recording, webhook, and urgent-preemption semantics.",
    },
    {
        "field_id": "FLD_SHARED_WEBHOOK_SECRET_REF",
        "provider_vendor": "shared",
        "field_group": "security",
        "provider_field_name": "webhook_secret_ref",
        "canonical_label": "Webhook secret ref",
        "value_kind": "secret_ref",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "vault and live gate form",
        "source_refs": "data/analysis/external_account_inventory.csv#SEC_TEL_LOCAL_WEBHOOK",
        "notes": "Secret handle only. Real secrets never enter repo or traces.",
    },
    {
        "field_id": "FLD_SHARED_SPEND_CAP_GBP",
        "provider_vendor": "shared",
        "field_group": "governance",
        "provider_field_name": "spend_cap_gbp",
        "canonical_label": "Spend cap (GBP)",
        "value_kind": "decimal",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "Vecells live gate form",
        "source_refs": "prompt/032.md; https://www.twilio.com/en-us/voice/pricing/gb; https://www.vonage.com/communications-apis/pricing/",
        "notes": "A real purchase path remains blocked without an explicit spend cap and approver.",
    },
    {
        "field_id": "FLD_SHARED_ALLOW_MUTATION",
        "provider_vendor": "shared",
        "field_group": "governance",
        "provider_field_name": "ALLOW_REAL_PROVIDER_MUTATION",
        "canonical_label": "Allow real provider mutation",
        "value_kind": "boolean",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "environment variable",
        "source_refs": "prompt/032.md",
        "notes": "Hard gate for any live vendor mutation path.",
    },
    {
        "field_id": "FLD_SHARED_ALLOW_SPEND",
        "provider_vendor": "shared",
        "field_group": "governance",
        "provider_field_name": "ALLOW_SPEND",
        "canonical_label": "Allow spend",
        "value_kind": "boolean",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "environment variable",
        "source_refs": "prompt/032.md",
        "notes": "Hard gate for number purchase, reservation, or other billable actions.",
    },
    {
        "field_id": "FLD_TWILIO_SUBACCOUNT_NAME",
        "provider_vendor": "Twilio",
        "field_group": "account",
        "provider_field_name": "subaccount_name",
        "canonical_label": "Twilio subaccount name",
        "value_kind": "string",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Twilio Console or Subaccounts API",
        "source_refs": "https://www.twilio.com/docs/iam/api/subaccounts",
        "notes": "Use a bounded-purpose subaccount per environment or rehearsal lane.",
    },
    {
        "field_id": "FLD_TWILIO_API_KEY_REF",
        "provider_vendor": "Twilio",
        "field_group": "security",
        "provider_field_name": "api_key_ref",
        "canonical_label": "Twilio API key ref",
        "value_kind": "secret_ref",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Twilio Console or Key API",
        "source_refs": "https://www.twilio.com/docs/iam/api-keys",
        "notes": "Prefer restricted keys rather than long-lived Auth Token use.",
    },
    {
        "field_id": "FLD_TWILIO_AUTH_TOKEN_REF",
        "provider_vendor": "Twilio",
        "field_group": "security",
        "provider_field_name": "auth_token_ref",
        "canonical_label": "Twilio Auth Token ref",
        "value_kind": "secret_ref",
        "required_in_mock": "no",
        "required_in_live": "review_only",
        "live_surface": "Twilio Console",
        "source_refs": "https://www.twilio.com/docs/iam/api-keys",
        "notes": "Auth Token use is permitted for local testing but is not the preferred production posture.",
    },
    {
        "field_id": "FLD_TWILIO_REGION",
        "provider_vendor": "Twilio",
        "field_group": "account",
        "provider_field_name": "region_profile",
        "canonical_label": "Twilio region profile",
        "value_kind": "enum",
        "required_in_mock": "no",
        "required_in_live": "review_only",
        "live_surface": "Twilio IAM regional profile",
        "source_refs": "https://www.twilio.com/docs/iam/api-keys",
        "notes": "API credentials are region-specific when Twilio Regions are enabled.",
    },
    {
        "field_id": "FLD_TWILIO_VOICE_URL",
        "provider_vendor": "Twilio",
        "field_group": "webhook",
        "provider_field_name": "VoiceUrl",
        "canonical_label": "Twilio Voice URL",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "IncomingPhoneNumber config",
        "source_refs": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "notes": "Receives the initial TwiML or adapter callback for inbound voice.",
    },
    {
        "field_id": "FLD_TWILIO_VOICE_FALLBACK_URL",
        "provider_vendor": "Twilio",
        "field_group": "webhook",
        "provider_field_name": "VoiceFallbackUrl",
        "canonical_label": "Twilio Voice fallback URL",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "review_only",
        "live_surface": "IncomingPhoneNumber config",
        "source_refs": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "notes": "Failure posture for answer URL retrieval remains explicit rather than hidden provider behavior.",
    },
    {
        "field_id": "FLD_TWILIO_STATUS_CALLBACK",
        "provider_vendor": "Twilio",
        "field_group": "webhook",
        "provider_field_name": "StatusCallback",
        "canonical_label": "Twilio status callback",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "IncomingPhoneNumber config",
        "source_refs": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "notes": "Delivery callbacks remain transport evidence only until Vecells settlement logic runs.",
    },
    {
        "field_id": "FLD_TWILIO_RECORDING_CALLBACK",
        "provider_vendor": "Twilio",
        "field_group": "recording",
        "provider_field_name": "recording_status_callback",
        "canonical_label": "Twilio recording status callback",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Voice application or number config",
        "source_refs": "https://www.twilio.com/docs/voice/api/recording",
        "notes": "Recording availability transitions must never be flattened into call success.",
    },
    {
        "field_id": "FLD_TWILIO_AVAILABLE_FILTER",
        "provider_vendor": "Twilio",
        "field_group": "number",
        "provider_field_name": "available_phone_number_filter",
        "canonical_label": "Twilio number search filter",
        "value_kind": "object",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "AvailablePhoneNumber Local resource",
        "source_refs": "https://www.twilio.com/docs/phone-numbers/api/availablephonenumberlocal-resource",
        "notes": "Filter by geography, pattern, and capability before purchase.",
    },
    {
        "field_id": "FLD_TWILIO_NUMBER_SID",
        "provider_vendor": "Twilio",
        "field_group": "number",
        "provider_field_name": "incoming_phone_number_sid",
        "canonical_label": "Twilio number SID",
        "value_kind": "string",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "IncomingPhoneNumber resource",
        "source_refs": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "notes": "Delete or release operations key off this identifier.",
    },
    {
        "field_id": "FLD_TWILIO_CAPABILITY_FLAGS",
        "provider_vendor": "Twilio",
        "field_group": "number",
        "provider_field_name": "capabilities",
        "canonical_label": "Twilio capability flags",
        "value_kind": "object",
        "required_in_mock": "yes",
        "required_in_live": "yes",
        "live_surface": "IncomingPhoneNumber resource",
        "source_refs": "https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "notes": "Voice and SMS capabilities stay distinct so telephony and continuation are not conflated.",
    },
    {
        "field_id": "FLD_VONAGE_ACCOUNT_OWNER",
        "provider_vendor": "Vonage",
        "field_group": "account",
        "provider_field_name": "account_owner",
        "canonical_label": "Vonage account owner",
        "value_kind": "string",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Vonage dashboard",
        "source_refs": "https://developer.vonage.com/en/voice/voice-api/getting-started",
        "notes": "Vonage account creation yields API key and secret for the initial owner.",
    },
    {
        "field_id": "FLD_VONAGE_API_KEY_REF",
        "provider_vendor": "Vonage",
        "field_group": "security",
        "provider_field_name": "api_key_ref",
        "canonical_label": "Vonage API key ref",
        "value_kind": "secret_ref",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Vonage dashboard",
        "source_refs": "https://developer.vonage.com/en/voice/voice-api/getting-started",
        "notes": "Generated at account creation; never stored in repo.",
    },
    {
        "field_id": "FLD_VONAGE_API_SECRET_REF",
        "provider_vendor": "Vonage",
        "field_group": "security",
        "provider_field_name": "api_secret_ref",
        "canonical_label": "Vonage API secret ref",
        "value_kind": "secret_ref",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Vonage dashboard",
        "source_refs": "https://developer.vonage.com/en/voice/voice-api/getting-started",
        "notes": "Paired with the API key and kept under the same dual-control policy.",
    },
    {
        "field_id": "FLD_VONAGE_APPLICATION_ID",
        "provider_vendor": "Vonage",
        "field_group": "account",
        "provider_field_name": "app_id",
        "canonical_label": "Vonage application id",
        "value_kind": "string",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Application API",
        "source_refs": "https://developer.vonage.com/en/application/overview; https://developer.vonage.com/de/api/numbers",
        "notes": "Binds numbers, security config, and callbacks to one application record.",
    },
    {
        "field_id": "FLD_VONAGE_PRIVATE_KEY_REF",
        "provider_vendor": "Vonage",
        "field_group": "security",
        "provider_field_name": "private_key_ref",
        "canonical_label": "Vonage private key ref",
        "value_kind": "secret_ref",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Application API",
        "source_refs": "https://developer.vonage.com/en/application/overview",
        "notes": "Application-level voice auth depends on a private key that stays vault-backed.",
    },
    {
        "field_id": "FLD_VONAGE_ANSWER_URL",
        "provider_vendor": "Vonage",
        "field_group": "webhook",
        "provider_field_name": "answer_url",
        "canonical_label": "Vonage answer URL",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Application voice config",
        "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "notes": "Returns NCCO for inbound voice and IVR flow selection.",
    },
    {
        "field_id": "FLD_VONAGE_EVENT_URL",
        "provider_vendor": "Vonage",
        "field_group": "webhook",
        "provider_field_name": "event_url",
        "canonical_label": "Vonage event URL",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Application voice config",
        "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "notes": "Receives call status information and remains weaker than authoritative request settlement.",
    },
    {
        "field_id": "FLD_VONAGE_FALLBACK_ANSWER_URL",
        "provider_vendor": "Vonage",
        "field_group": "webhook",
        "provider_field_name": "fallback_answer_url",
        "canonical_label": "Vonage fallback answer URL",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "review_only",
        "live_surface": "Application voice config",
        "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "notes": "Required to make the fallback and degraded-mode posture explicit rather than implicit.",
    },
    {
        "field_id": "FLD_VONAGE_VOICE_STATUS_CALLBACK",
        "provider_vendor": "Vonage",
        "field_group": "webhook",
        "provider_field_name": "voiceStatusCallback",
        "canonical_label": "Vonage number status callback",
        "value_kind": "uri",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Numbers API update",
        "source_refs": "https://developer.vonage.com/de/api/numbers",
        "notes": "Configured per number to receive call-end status information.",
    },
    {
        "field_id": "FLD_VONAGE_MSISDN",
        "provider_vendor": "Vonage",
        "field_group": "number",
        "provider_field_name": "msisdn",
        "canonical_label": "Vonage MSISDN",
        "value_kind": "string",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Numbers API",
        "source_refs": "https://developer.vonage.com/de/api/numbers",
        "notes": "Referenced for buy, cancel, and update operations.",
    },
    {
        "field_id": "FLD_VONAGE_NUMBER_SEARCH",
        "provider_vendor": "Vonage",
        "field_group": "number",
        "provider_field_name": "search_available_numbers",
        "canonical_label": "Vonage number search filter",
        "value_kind": "object",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Numbers API",
        "source_refs": "https://developer.vonage.com/de/api/numbers",
        "notes": "Search precedes buy and remains a distinct, reviewable choice.",
    },
    {
        "field_id": "FLD_VONAGE_RENT_NUMBER_CREDIT",
        "provider_vendor": "Vonage",
        "field_group": "governance",
        "provider_field_name": "credit_loaded_before_number_rent",
        "canonical_label": "Vonage credit loaded",
        "value_kind": "boolean",
        "required_in_mock": "no",
        "required_in_live": "yes",
        "live_surface": "Vonage dashboard and live gate form",
        "source_refs": "https://developer.vonage.com/en/voice/voice-api/getting-started",
        "notes": "Vonage requires credit before renting a number, making spend control explicit.",
    },
]

NUMBER_ROWS = [
    {
        "number_id": "NUM_TEL_FRONTDOOR_GENERAL",
        "e164_or_placeholder": "MOCK:+44-VC-0001",
        "environment": "local_mock",
        "direction": "inbound",
        "voice_enabled": "yes",
        "sms_enabled": "no",
        "ivr_profile_ref": "ivr_frontdoor_general",
        "recording_policy_ref": "rec_default_dual_channel",
        "webhook_profile_ref": "wh_mock_inbound_stack",
        "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
        "mock_now_use": "yes",
        "actual_later_use": "reserved",
        "notes": "Primary non-routable front-door number for general call rehearsal.",
    },
    {
        "number_id": "NUM_TEL_FRONTDOOR_URGENT",
        "e164_or_placeholder": "MOCK:+44-VC-0002",
        "environment": "local_mock",
        "direction": "inbound",
        "voice_enabled": "yes",
        "sms_enabled": "no",
        "ivr_profile_ref": "ivr_frontdoor_urgent",
        "recording_policy_ref": "rec_urgent_immediate_fetch",
        "webhook_profile_ref": "wh_mock_inbound_stack",
        "urgent_preemption_mode": "immediate_urgent_live_branch",
        "mock_now_use": "yes",
        "actual_later_use": "reserved",
        "notes": "Urgent branch number where live preemption may begin before routine evidence readiness.",
    },
    {
        "number_id": "NUM_TEL_CALLBACK_OUTBOUND",
        "e164_or_placeholder": "MOCK:+44-VC-0003",
        "environment": "shared_dev",
        "direction": "outbound",
        "voice_enabled": "yes",
        "sms_enabled": "no",
        "ivr_profile_ref": "ivr_callback_return",
        "recording_policy_ref": "rec_callback_summary_only",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "urgent_preemption_mode": "route_repair_before_repeat_attempt",
        "mock_now_use": "yes",
        "actual_later_use": "reserved",
        "notes": "Used for support-driven callback replay and outbound proof rehearsal.",
    },
    {
        "number_id": "NUM_TEL_SUPPORT_REPAIR",
        "e164_or_placeholder": "MOCK:+44-VC-0004",
        "environment": "shared_dev",
        "direction": "both",
        "voice_enabled": "yes",
        "sms_enabled": "no",
        "ivr_profile_ref": "ivr_support_repair",
        "recording_policy_ref": "rec_default_dual_channel",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "urgent_preemption_mode": "manual_review_only_if_identity_or_route_drifts",
        "mock_now_use": "yes",
        "actual_later_use": "optional",
        "notes": "Support replay desk number for route-repair and stale callback handling.",
    },
    {
        "number_id": "NUM_TEL_CONTINUATION_SMS",
        "e164_or_placeholder": "MOCK:+44-VC-0005",
        "environment": "local_mock",
        "direction": "outbound",
        "voice_enabled": "no",
        "sms_enabled": "yes",
        "ivr_profile_ref": "ivr_frontdoor_general",
        "recording_policy_ref": "rec_default_dual_channel",
        "webhook_profile_ref": "wh_mock_continuation_sms",
        "urgent_preemption_mode": "continuation_only_no_live_voice",
        "mock_now_use": "yes",
        "actual_later_use": "optional",
        "notes": "Explicit SMS-only continuation rail to prevent voice and SMS number conflation.",
    },
    {
        "number_id": "NUM_TEL_DUAL_CONTINUITY",
        "e164_or_placeholder": "MOCK:+44-VC-0006",
        "environment": "provider_like_preprod",
        "direction": "both",
        "voice_enabled": "yes",
        "sms_enabled": "yes",
        "ivr_profile_ref": "ivr_frontdoor_general",
        "recording_policy_ref": "rec_default_dual_channel",
        "webhook_profile_ref": "wh_provider_like_twilio",
        "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
        "mock_now_use": "yes",
        "actual_later_use": "reserved",
        "notes": "Provider-like dual-capability number used to test the shared number but separated voice and SMS behaviours.",
    },
    {
        "number_id": "NUM_TEL_PROVIDER_TWILIO",
        "e164_or_placeholder": "MOCK:+44-VC-0007",
        "environment": "provider_like_preprod",
        "direction": "both",
        "voice_enabled": "yes",
        "sms_enabled": "yes",
        "ivr_profile_ref": "ivr_frontdoor_general",
        "recording_policy_ref": "rec_default_dual_channel",
        "webhook_profile_ref": "wh_provider_like_twilio",
        "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
        "mock_now_use": "yes",
        "actual_later_use": "reserved",
        "notes": "Twilio-shaped placeholder profile for later account and number dry runs.",
    },
    {
        "number_id": "NUM_TEL_PROVIDER_VONAGE",
        "e164_or_placeholder": "MOCK:+44-VC-0008",
        "environment": "provider_like_preprod",
        "direction": "both",
        "voice_enabled": "yes",
        "sms_enabled": "yes",
        "ivr_profile_ref": "ivr_frontdoor_general",
        "recording_policy_ref": "rec_default_dual_channel",
        "webhook_profile_ref": "wh_provider_like_vonage",
        "urgent_preemption_mode": "assess_after_menu_then_escalate_if_required",
        "mock_now_use": "yes",
        "actual_later_use": "reserved",
        "notes": "Vonage-shaped placeholder profile for later application, number, and callback dry runs.",
    },
    {
        "number_id": "NUM_TEL_RECORDING_DEGRADED",
        "e164_or_placeholder": "MOCK:+44-VC-0009",
        "environment": "local_mock",
        "direction": "inbound",
        "voice_enabled": "yes",
        "sms_enabled": "no",
        "ivr_profile_ref": "ivr_support_repair",
        "recording_policy_ref": "rec_missing_blocks_routine",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "urgent_preemption_mode": "manual_review_only_if_recording_missing",
        "mock_now_use": "yes",
        "actual_later_use": "rejected",
        "notes": "Purpose-built degraded number for recording-missing and manual-audio-review rehearsal.",
    },
    {
        "number_id": "NUM_TEL_OUTBOUND_ESCALATION",
        "e164_or_placeholder": "MOCK:+44-VC-0010",
        "environment": "shared_dev",
        "direction": "outbound",
        "voice_enabled": "yes",
        "sms_enabled": "no",
        "ivr_profile_ref": "ivr_callback_return",
        "recording_policy_ref": "rec_urgent_immediate_fetch",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "urgent_preemption_mode": "escalate_to_live_operator_if_safety_epoch_open",
        "mock_now_use": "yes",
        "actual_later_use": "optional",
        "notes": "Outbound number for urgent callback and live-handoff proof rehearsal.",
    },
]

WEBHOOK_ROWS = [
    {
        "webhook_row_id": "HOOK_MOCK_ANSWER",
        "webhook_profile_ref": "wh_mock_inbound_stack",
        "provider_vendor": "Vecells Internal Voice Twin",
        "environment": "local_mock",
        "endpoint_kind": "answer_or_route_intake",
        "configured_on": "mock carrier number profile",
        "method": "POST",
        "signature_scheme": "vecells-hmac-sha256",
        "retry_profile": "immediate_plus_15s_plus_90s",
        "out_of_order_risk": "yes",
        "replay_guard": "effect-key-plus-signature-window",
        "authoritative_truth_note": "Generates canonical telephony event only. Never implies evidence ready.",
        "source_refs": "blueprint/phase-2-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
        "notes": "Equivalent of provider answer webhook for IVR start.",
    },
    {
        "webhook_row_id": "HOOK_MOCK_STATUS",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "provider_vendor": "Vecells Internal Voice Twin",
        "environment": "shared_dev",
        "endpoint_kind": "call_status",
        "configured_on": "mock carrier event emitter",
        "method": "POST",
        "signature_scheme": "vecells-hmac-sha256",
        "retry_profile": "duplicate_and_disorder_fixture_enabled",
        "out_of_order_risk": "yes",
        "replay_guard": "adapter-receipt-checkpoint",
        "authoritative_truth_note": "Transport or call-end status does not settle callback or request truth.",
        "source_refs": "blueprint/callback-and-clinician-messaging-loop.md",
        "notes": "Used for duplicate, dropped-call, and replay tests.",
    },
    {
        "webhook_row_id": "HOOK_MOCK_RECORDING",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "provider_vendor": "Vecells Internal Voice Twin",
        "environment": "shared_dev",
        "endpoint_kind": "recording_status",
        "configured_on": "mock carrier recording policy",
        "method": "POST",
        "signature_scheme": "vecells-hmac-sha256",
        "retry_profile": "15s_plus_120s",
        "out_of_order_risk": "yes",
        "replay_guard": "recording-artifact-hash-plus-call-id",
        "authoritative_truth_note": "Recording availability is weaker than evidence readiness.",
        "source_refs": "blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
        "notes": "Feeds recording_expected to recording_available transitions.",
    },
    {
        "webhook_row_id": "HOOK_MOCK_TRANSCRIPT",
        "webhook_profile_ref": "wh_mock_status_and_recording",
        "provider_vendor": "Vecells Internal Voice Twin",
        "environment": "shared_dev",
        "endpoint_kind": "transcript_hook",
        "configured_on": "mock transcript worker",
        "method": "POST",
        "signature_scheme": "vecells-hmac-sha256",
        "retry_profile": "60s_plus_manual_replay",
        "out_of_order_risk": "yes",
        "replay_guard": "transcript-job-ref-plus-coverage-hash",
        "authoritative_truth_note": "Transcript results are derivations and never replace source audio.",
        "source_refs": "blueprint/phase-0-the-foundation-protocol.md; blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
        "notes": "Keeps transcript readiness separate from promotion readiness.",
    },
    {
        "webhook_row_id": "HOOK_MOCK_CONTINUATION",
        "webhook_profile_ref": "wh_mock_continuation_sms",
        "provider_vendor": "Vecells Internal Signal Fabric",
        "environment": "local_mock",
        "endpoint_kind": "continuation_sms_dispatch",
        "configured_on": "continuation dispatcher",
        "method": "POST",
        "signature_scheme": "vecells-hmac-sha256",
        "retry_profile": "single_retry_then_repair_queue",
        "out_of_order_risk": "no",
        "replay_guard": "access-grant-supersession-check",
        "authoritative_truth_note": "Dispatch acknowledgement does not prove patient redemption.",
        "source_refs": "blueprint/phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
        "notes": "Continuation uses AccessGrant semantics and must not reopen superseded links.",
    },
    {
        "webhook_row_id": "HOOK_TWILIO_VOICE_URL",
        "webhook_profile_ref": "wh_provider_like_twilio",
        "provider_vendor": "Twilio",
        "environment": "provider_like_preprod",
        "endpoint_kind": "voice_url",
        "configured_on": "IncomingPhoneNumber VoiceUrl",
        "method": "POST",
        "signature_scheme": "X-Twilio-Signature",
        "retry_profile": "provider-managed-plus-adapter-dedupe",
        "out_of_order_risk": "yes",
        "replay_guard": "signature-validation-plus-receipt-checkpoint",
        "authoritative_truth_note": "Twilio voice callbacks feed canonical events only after adapter validation.",
        "source_refs": "https://www.twilio.com/docs/usage/webhooks/webhooks-security; https://www.twilio.com/docs/phone-numbers/api/incomingphonenumber-resource",
        "notes": "Maps Twilio answer flow into the same internal event seam as mock mode.",
    },
    {
        "webhook_row_id": "HOOK_TWILIO_RECORDING",
        "webhook_profile_ref": "wh_provider_like_twilio",
        "provider_vendor": "Twilio",
        "environment": "provider_like_preprod",
        "endpoint_kind": "recording_status_callback",
        "configured_on": "Twilio voice config",
        "method": "POST",
        "signature_scheme": "X-Twilio-Signature",
        "retry_profile": "provider-managed-plus-adapter-dedupe",
        "out_of_order_risk": "yes",
        "replay_guard": "recording-sid-plus-call-id",
        "authoritative_truth_note": "Recording events update availability, not request completion.",
        "source_refs": "https://www.twilio.com/docs/voice/api/recording",
        "notes": "Feeds the same recording availability state machine as mock mode.",
    },
    {
        "webhook_row_id": "HOOK_VONAGE_ANSWER_EVENT",
        "webhook_profile_ref": "wh_provider_like_vonage",
        "provider_vendor": "Vonage",
        "environment": "provider_like_preprod",
        "endpoint_kind": "answer_and_event",
        "configured_on": "Application answer_url and event_url",
        "method": "POST",
        "signature_scheme": "application-signature-plus-jwt-posture",
        "retry_profile": "provider-timeout-plus-adapter-dedupe",
        "out_of_order_risk": "yes",
        "replay_guard": "request-signature-plus-causal-window",
        "authoritative_truth_note": "Answer and event callbacks remain transport observations until Vecells settlement occurs.",
        "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks; https://developer.vonage.com/en/application/overview",
        "notes": "Vonage exposes answer_url, event_url, and fallback_answer_url as distinct controls.",
    },
    {
        "webhook_row_id": "HOOK_VONAGE_NUMBER_STATUS",
        "webhook_profile_ref": "wh_provider_like_vonage",
        "provider_vendor": "Vonage",
        "environment": "provider_like_preprod",
        "endpoint_kind": "voice_status_callback",
        "configured_on": "Numbers API update",
        "method": "POST",
        "signature_scheme": "application-signature-plus-jwt-posture",
        "retry_profile": "provider-managed",
        "out_of_order_risk": "yes",
        "replay_guard": "msisdn-plus-call-id",
        "authoritative_truth_note": "Call-end status is weaker than callback resolution or intake promotion.",
        "source_refs": "https://developer.vonage.com/de/api/numbers",
        "notes": "Per-number callback configured through `voiceStatusCallback`.",
    },
    {
        "webhook_row_id": "HOOK_VONAGE_RECORD_EVENT",
        "webhook_profile_ref": "wh_provider_like_vonage",
        "provider_vendor": "Vonage",
        "environment": "provider_like_preprod",
        "endpoint_kind": "record_event_url",
        "configured_on": "Application voice capability",
        "method": "POST",
        "signature_scheme": "application-signature-plus-jwt-posture",
        "retry_profile": "provider-managed",
        "out_of_order_risk": "yes",
        "replay_guard": "recording-url-plus-call-id",
        "authoritative_truth_note": "Recording callbacks widen artefact availability but do not establish routine readiness.",
        "source_refs": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "notes": "Aligns Vonage recording events with the same internal recording state machine.",
    },
]

RECORDING_POLICIES = [
    {
        "recording_policy_ref": "rec_default_dual_channel",
        "label": "Default dual-channel recording",
        "retention_class": "telephony_sensitive_audio_nonprod_30d",
        "fetch_profile": "provider_callback_then_fetch",
        "transcript_floor": "keyword_or_partial_then_manual_if_needed",
        "manual_review_trigger": "contradictory_capture_or_identity_drift",
        "notes": "Default for front-door rehearsal. Recording availability is expected but not sufficient for routine promotion.",
    },
    {
        "recording_policy_ref": "rec_urgent_immediate_fetch",
        "label": "Urgent immediate fetch",
        "retention_class": "urgent_live_audio_locked_until_review",
        "fetch_profile": "priority_fetch_worker",
        "transcript_floor": "partial_allowed_but_urgent_live_can_open_first",
        "manual_review_trigger": "recording_missing_or_live_handoff_gap",
        "notes": "Used when urgent-live preemption can begin before routine evidence readiness.",
    },
    {
        "recording_policy_ref": "rec_callback_summary_only",
        "label": "Callback summary only",
        "retention_class": "support_callback_audio_short_retention",
        "fetch_profile": "callback_outcome_bound",
        "transcript_floor": "summary_stub_only",
        "manual_review_trigger": "outcome_dispute_or_route_repair",
        "notes": "For outbound callback confirmation and support replay lanes.",
    },
    {
        "recording_policy_ref": "rec_missing_blocks_routine",
        "label": "Missing recording blocks routine",
        "retention_class": "missing_recording_incident_register",
        "fetch_profile": "simulate_timeout",
        "transcript_floor": "none",
        "manual_review_trigger": "recording_missing",
        "notes": "Purpose-built degraded policy that fails closed into manual audio review and blocks routine promotion.",
    },
]

IVR_PROFILES = [
    {
        "ivr_profile_ref": "ivr_frontdoor_general",
        "label": "Front door general",
        "menu_path": "symptoms -> meds -> admin -> results",
        "dtmf_expectations": "single_digit_route_then_identity_fragment_capture",
        "urgent_live_branch": "enabled_after_menu_and_signal_assessment",
        "continuation_policy": "bounded_seeded_or_challenge_sms_when_eligible",
        "notes": "Primary intake IVR for normal call entry.",
    },
    {
        "ivr_profile_ref": "ivr_frontdoor_urgent",
        "label": "Front door urgent",
        "menu_path": "urgent -> confirm -> live_handoff",
        "dtmf_expectations": "single_digit_then_confirmatory_digit",
        "urgent_live_branch": "immediate",
        "continuation_policy": "blocked_until_urgent_live_branch_resolved",
        "notes": "Urgent path exercises SafetyPreemptionRecord and live-transfer branch semantics.",
    },
    {
        "ivr_profile_ref": "ivr_support_repair",
        "label": "Support repair",
        "menu_path": "repair -> callback -> evidence_review",
        "dtmf_expectations": "support-controlled",
        "urgent_live_branch": "manual_if_contact_safety_relevant",
        "continuation_policy": "manual_route_repair_before_sms_if_needed",
        "notes": "Used for support replay, route repair, and degraded recording handling.",
    },
    {
        "ivr_profile_ref": "ivr_callback_return",
        "label": "Callback return",
        "menu_path": "identity_confirm -> callback_outcome -> close_or_retry",
        "dtmf_expectations": "identity_confirmation_then_outcome",
        "urgent_live_branch": "manual_if_signal_rises",
        "continuation_policy": "not_default",
        "notes": "Used for outbound callback proof and return-call handling.",
    },
]

SCENARIOS = [
    {
        "scenario_id": "inbound_standard_continuation",
        "label": "Inbound call with continuation eligibility",
        "direction": "inbound",
        "number_id": "NUM_TEL_FRONTDOOR_GENERAL",
        "summary": "Patient completes menu selection, partial identity, recording, and becomes continuation-eligible before routine evidence is ready.",
        "state_path": [
            "initiated",
            "menu_selected",
            "identity_in_progress",
            "identity_partial",
            "recording_expected",
            "recording_available",
            "evidence_preparing",
            "evidence_pending",
            "continuation_eligible",
            "continuation_sent",
        ],
        "terminal_state": "continuation_sent",
        "urgent_state": "routine_review",
        "recording_state": "available",
        "transcript_state": "partial",
        "continuation_state": "eligible_then_sent",
        "webhook_state": "healthy",
    },
    {
        "scenario_id": "urgent_live_preemption",
        "label": "Urgent live preemption",
        "direction": "inbound",
        "number_id": "NUM_TEL_FRONTDOOR_URGENT",
        "summary": "Urgent-live assessment opens immediately after menu selection while recording and transcript processing continue in the background.",
        "state_path": [
            "initiated",
            "menu_selected",
            "urgent_live_only",
            "recording_expected",
            "recording_available",
            "evidence_preparing",
            "manual_followup_required",
            "closed",
        ],
        "terminal_state": "closed",
        "urgent_state": "urgent_live_required",
        "recording_state": "available",
        "transcript_state": "queued",
        "continuation_state": "blocked",
        "webhook_state": "healthy",
    },
    {
        "scenario_id": "recording_missing_manual_review",
        "label": "Recording missing, manual review only",
        "direction": "inbound",
        "number_id": "NUM_TEL_RECORDING_DEGRADED",
        "summary": "Provider promises a recording that never arrives, forcing a manual-audio-review disposition and blocking routine promotion.",
        "state_path": [
            "initiated",
            "menu_selected",
            "identity_resolved",
            "recording_expected",
            "recording_missing",
            "manual_audio_review_required",
        ],
        "terminal_state": "manual_audio_review_required",
        "urgent_state": "routine_review",
        "recording_state": "missing",
        "transcript_state": "not_started",
        "continuation_state": "blocked",
        "webhook_state": "healthy",
    },
    {
        "scenario_id": "webhook_signature_retry",
        "label": "Webhook signature retry",
        "direction": "inbound",
        "number_id": "NUM_TEL_PROVIDER_TWILIO",
        "summary": "A provider-like callback lands with a failed signature check, then recovers on replay-safe retry.",
        "state_path": [
            "initiated",
            "menu_selected",
            "identity_partial",
            "recording_expected",
            "recording_available",
            "evidence_preparing",
            "webhook_signature_failed",
            "webhook_retry_pending",
        ],
        "terminal_state": "webhook_retry_pending",
        "urgent_state": "routine_review",
        "recording_state": "available",
        "transcript_state": "queued",
        "continuation_state": "blocked",
        "webhook_state": "signature_failed",
    },
    {
        "scenario_id": "outbound_callback_settled",
        "label": "Outbound callback settled",
        "direction": "outbound",
        "number_id": "NUM_TEL_CALLBACK_OUTBOUND",
        "summary": "Support-owned callback reaches a durable outcome with recording present and no continuation needed.",
        "state_path": [
            "initiated",
            "identity_in_progress",
            "identity_resolved",
            "recording_expected",
            "recording_available",
            "evidence_preparing",
            "evidence_ready",
            "submitted",
            "closed",
        ],
        "terminal_state": "closed",
        "urgent_state": "routine_review",
        "recording_state": "verified",
        "transcript_state": "ready",
        "continuation_state": "not_needed",
        "webhook_state": "healthy",
    },
    {
        "scenario_id": "provider_like_vonage_disorder",
        "label": "Provider-like disorder with Vonage fallback",
        "direction": "inbound",
        "number_id": "NUM_TEL_PROVIDER_VONAGE",
        "summary": "Vonage-shaped answer and event callbacks arrive out of order, with fallback answer handling still feeding the same canonical call session.",
        "state_path": [
            "initiated",
            "menu_selected",
            "identity_partial",
            "recording_expected",
            "provider_error",
            "recording_available",
            "evidence_preparing",
            "evidence_pending",
        ],
        "terminal_state": "evidence_pending",
        "urgent_state": "routine_review",
        "recording_state": "available",
        "transcript_state": "running",
        "continuation_state": "under_review",
        "webhook_state": "fallback_recovered",
    },
]

SEEDED_CALLS = [
    {
        "call_id": "CALL-LAB-4101",
        "scenario_id": "inbound_standard_continuation",
        "number_id": "NUM_TEL_FRONTDOOR_GENERAL",
        "direction": "inbound",
        "caller_ref": "synthetic-caller-alpha",
        "created_at": "2026-04-09T08:20:00Z",
        "status": "continuation_sent",
        "summary": "Standard front-door call with bounded continuation grant.",
    },
    {
        "call_id": "CALL-LAB-4102",
        "scenario_id": "urgent_live_preemption",
        "number_id": "NUM_TEL_FRONTDOOR_URGENT",
        "direction": "inbound",
        "caller_ref": "synthetic-caller-bravo",
        "created_at": "2026-04-09T08:34:00Z",
        "status": "closed",
        "summary": "Urgent live branch opened before routine readiness.",
    },
    {
        "call_id": "CALL-LAB-4103",
        "scenario_id": "recording_missing_manual_review",
        "number_id": "NUM_TEL_RECORDING_DEGRADED",
        "direction": "inbound",
        "caller_ref": "synthetic-caller-charlie",
        "created_at": "2026-04-09T09:02:00Z",
        "status": "manual_audio_review_required",
        "summary": "Recording timed out and blocked routine promotion.",
    },
    {
        "call_id": "CALL-LAB-4104",
        "scenario_id": "webhook_signature_retry",
        "number_id": "NUM_TEL_PROVIDER_TWILIO",
        "direction": "inbound",
        "caller_ref": "synthetic-caller-delta",
        "created_at": "2026-04-09T09:19:00Z",
        "status": "webhook_retry_pending",
        "summary": "Signature failure waiting for retry-safe replay.",
    },
    {
        "call_id": "CALL-LAB-4105",
        "scenario_id": "outbound_callback_settled",
        "number_id": "NUM_TEL_CALLBACK_OUTBOUND",
        "direction": "outbound",
        "caller_ref": "synthetic-caller-echo",
        "created_at": "2026-04-09T10:01:00Z",
        "status": "closed",
        "summary": "Support callback settled with durable recording proof.",
    },
    {
        "call_id": "CALL-LAB-4106",
        "scenario_id": "provider_like_vonage_disorder",
        "number_id": "NUM_TEL_PROVIDER_VONAGE",
        "direction": "inbound",
        "caller_ref": "synthetic-caller-foxtrot",
        "created_at": "2026-04-09T10:21:00Z",
        "status": "evidence_pending",
        "summary": "Out-of-order provider-like callbacks preserved through one canonical event chain.",
    },
]

SELECTED_RISKS = [
    {
        "risk_id": "HZ_TELEPHONY_EVIDENCE_INADEQUACY",
        "title": "Telephony evidence inadequacy",
        "severity": "high",
        "current_status": "open",
        "trigger_summary": "Recording, transcript, or structured capture is insufficient for routine promotion.",
        "linked_tasks": "seq_032; phase2_telephony_tracks",
        "linked_gates": "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED; TEL_LIVE_GATE_FINAL_POSTURE",
    },
    {
        "risk_id": "HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE",
        "title": "Urgent diversion under or over triage",
        "severity": "high",
        "current_status": "open",
        "trigger_summary": "Urgent-live routing opens too late or too early relative to the current evidence and menu signal.",
        "linked_tasks": "seq_032; phase2_telephony_tracks",
        "linked_gates": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK; TEL_LIVE_GATE_FINAL_POSTURE",
    },
    {
        "risk_id": "RISK_EXT_COMMS_VENDOR_DELAY",
        "title": "Communications vendor delay",
        "severity": "medium",
        "current_status": "tracked",
        "trigger_summary": "Real provider onboarding or number creation lags the internal simulator schedule.",
        "linked_tasks": "seq_031; seq_032; seq_033",
        "linked_gates": "TEL_LIVE_GATE_VENDOR_APPROVED; TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY",
    },
    {
        "risk_id": "RISK_MUTATION_003",
        "title": "Premature provider mutation",
        "severity": "high",
        "current_status": "open",
        "trigger_summary": "A real account, workspace, or number mutation is attempted before spend or security gates pass.",
        "linked_tasks": "seq_023; seq_031; seq_032",
        "linked_gates": "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS; TEL_LIVE_GATE_FINAL_POSTURE",
    },
    {
        "risk_id": "RISK_STATE_004",
        "title": "Transport success mistaken for authoritative truth",
        "severity": "high",
        "current_status": "open",
        "trigger_summary": "Provider status or recording callbacks are misread as routine request readiness or callback completion.",
        "linked_tasks": "seq_005; seq_007; seq_032",
        "linked_gates": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK; TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED",
    },
    {
        "risk_id": "RISK_MUTATION_001",
        "title": "Identifier or route mutation bypass",
        "severity": "medium",
        "current_status": "open",
        "trigger_summary": "Caller verification or continuation rails overwrite a superseded binding or stale route without guard checks.",
        "linked_tasks": "seq_023; seq_032; phase2_identity_tracks",
        "linked_gates": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK; TEL_LIVE_GATE_FINAL_POSTURE",
    },
]

LIVE_GATES = [
    {
        "gate_id": "TEL_LIVE_GATE_PHASE0_EXTERNAL_READY",
        "status": "blocked",
        "class": "programme",
        "summary": "Phase 0 external-readiness chain is still withheld.",
        "reason": "Current baseline verdict remains withheld, so no live telephony mutation may start.",
        "required_evidence": "data/analysis/phase0_gate_verdict.json",
    },
    {
        "gate_id": "TEL_LIVE_GATE_VENDOR_APPROVED",
        "status": "review_required",
        "class": "vendor",
        "summary": "The target vendor must be one of the task 031 telephony shortlist entries.",
        "reason": "Shortlist exists, but a live target vendor has not been selected for mutation.",
        "required_evidence": "data/analysis/31_vendor_shortlist.json",
    },
    {
        "gate_id": "TEL_LIVE_GATE_WORKSPACE_OWNERSHIP",
        "status": "pass",
        "class": "governance",
        "summary": "Owner and backup owner roles are already defined for telephony accounts and numbers.",
        "reason": "Task 023 established owner and backup-owner roles for telephony secrets and number ranges.",
        "required_evidence": "data/analysis/external_account_inventory.csv",
    },
    {
        "gate_id": "TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK",
        "status": "review_required",
        "class": "security",
        "summary": "Webhook base URLs, signature validation, replay defense, and endpoint mapping must be explicit.",
        "reason": "The pack defines the model, but no live callback base URL or vault-backed secret set is yet approved.",
        "required_evidence": "data/analysis/32_telephony_webhook_matrix.csv",
    },
    {
        "gate_id": "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED",
        "status": "review_required",
        "class": "safety",
        "summary": "Recording retention, transcript floor, and missing-recording posture must be reviewed.",
        "reason": "The retention and evidence-readiness model is defined but not approved for a real vendor environment.",
        "required_evidence": "docs/external/32_telephony_webhook_and_recording_config_strategy.md",
    },
    {
        "gate_id": "TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY",
        "status": "blocked",
        "class": "commercial",
        "summary": "Spend authority and procurement posture must be explicit before account or number creation.",
        "reason": "Both shortlisted vendors make number creation a commercial action.",
        "required_evidence": "docs/external/32_telephony_live_gate_and_spend_controls.md",
    },
    {
        "gate_id": "TEL_LIVE_GATE_NAMED_APPROVER",
        "status": "blocked",
        "class": "governance",
        "summary": "A named approver is required before any real mutation path.",
        "reason": "No named approver is currently bound to the telephony lane.",
        "required_evidence": "runtime env TELEPHONY_NAMED_APPROVER",
    },
    {
        "gate_id": "TEL_LIVE_GATE_ENVIRONMENT_TARGET",
        "status": "review_required",
        "class": "environment",
        "summary": "The target environment must be explicit and not inferred from provider defaults.",
        "reason": "The pack supports provider-like preprod and production, but no live target is approved.",
        "required_evidence": "runtime env TELEPHONY_TARGET_ENVIRONMENT",
    },
    {
        "gate_id": "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS",
        "status": "blocked",
        "class": "runtime_guard",
        "summary": "Live mutation and spend flags remain false by default.",
        "reason": "Real provider mutation stays fail-closed until explicit env gates are true.",
        "required_evidence": "ALLOW_REAL_PROVIDER_MUTATION=true; ALLOW_SPEND=true",
    },
    {
        "gate_id": "TEL_LIVE_GATE_FINAL_POSTURE",
        "status": "blocked",
        "class": "final",
        "summary": "Current real account and number creation posture is blocked.",
        "reason": "The local lab is ready now, but live account creation remains blocked until all gates pass.",
        "required_evidence": "All prior gates plus final governance acknowledgement.",
    },
]

SELECTOR_MAP = {
    "base_profile": {
        "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
        "page_tab_live_gates": "[data-testid='page-tab-Live_Gates_and_Spend_Controls']",
        "field_vendor": "[data-testid='actual-field-telephony-vendor-id']",
        "field_approver": "[data-testid='actual-field-named-approver']",
        "field_environment": "[data-testid='actual-field-target-environment']",
        "field_callback_base": "[data-testid='actual-field-callback-base-url']",
        "field_recording_policy": "[data-testid='actual-field-recording-policy-ref']",
        "field_number_profile": "[data-testid='actual-field-number-profile-ref']",
        "field_spend_cap": "[data-testid='actual-field-spend-cap-gbp']",
        "field_secret_ref": "[data-testid='actual-field-webhook-secret-ref']",
        "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
        "field_allow_spend": "[data-testid='actual-field-allow-spend']",
        "final_submit": "[data-testid='actual-submit-button']",
    }
}


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
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    assert_true(bool(rows), f"Cannot write empty CSV for {path.name}")
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def to_markdown_table(rows: list[dict[str, Any]], columns: list[str]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join(["---"] * len(columns)) + " |"
    body = [
        "| " + " | ".join(str(row.get(column, "")).replace("\n", "<br>") for column in columns) + " |"
        for row in rows
    ]
    return "\n".join([header, divider, *body])


def ts_export(name: str, payload: Any) -> str:
    return textwrap.dedent(
        f"""\
        export const {name} = {json.dumps(payload, indent=2)};
        export type {name[0].upper() + name[1:]} = typeof {name};
        """
    )


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_032 prerequisites: " + ", ".join(sorted(missing)))
    vendor_shortlist = load_json(REQUIRED_INPUTS["vendor_shortlist"])
    external_account_inventory = load_csv(REQUIRED_INPUTS["external_account_inventory"])
    phase0_gate_verdict = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    integration_priority_matrix = load_json(REQUIRED_INPUTS["integration_priority_matrix"])

    telephony_shortlist = vendor_shortlist["shortlist_by_family"]["telephony_ivr"]
    telephony_vendor_ids = [row["vendor_id"] for row in telephony_shortlist]
    assert_true(
        telephony_vendor_ids == ["twilio_telephony_ivr", "vonage_telephony_ivr"],
        "seq_032 expects Twilio and Vonage as the telephony shortlist.",
    )
    assert_true(
        phase0_gate_verdict["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_032 expects the Phase 0 entry verdict to remain withheld.",
    )
    return {
        "vendor_shortlist": vendor_shortlist,
        "external_account_inventory": external_account_inventory,
        "phase0_gate_verdict": phase0_gate_verdict,
        "integration_priority_matrix": integration_priority_matrix,
    }


def telephony_secret_rows(account_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    rows = [row for row in account_rows if row["dependency_family"] == "telephony"]
    assert_true(len(rows) == 7, "Expected 7 telephony secret and account rows from task 023.")
    return rows


def scenario_by_id(scenario_id: str) -> dict[str, Any]:
    return next(row for row in SCENARIOS if row["scenario_id"] == scenario_id)


def event_tone(state: str) -> str:
    if state in {"closed", "submitted", "evidence_ready"}:
        return "success"
    if state in {"urgent_live_only", "manual_audio_review_required", "recording_missing"}:
        return "blocked"
    if state in {"webhook_signature_failed", "webhook_retry_pending", "provider_error"}:
        return "caution"
    if state in {"continuation_eligible", "continuation_sent", "evidence_pending"}:
        return "review"
    return "default"


def event_label(state: str) -> str:
    return state.replace("_", " ")


def event_detail(scenario: dict[str, Any], state: str) -> str:
    mapping = {
        "initiated": "Call session created and the telephony lineage opened.",
        "menu_selected": "IVR route selected and urgent-live assessment refreshed.",
        "identity_in_progress": "Identity fragments are still being captured.",
        "identity_resolved": "Identity threshold cleared for this call session.",
        "identity_partial": "Identity confidence is bounded but not final.",
        "recording_expected": "Provider or mock carrier promised a recording artefact.",
        "recording_available": "Recording artefact landed and can feed transcript readiness.",
        "recording_missing": "Recording promise timed out or returned unusable media.",
        "evidence_preparing": "Transcript and structured fact extraction are running.",
        "evidence_pending": "Raw evidence exists but no safety-usable verdict is settled.",
        "continuation_eligible": "SMS continuation may open, but routine promotion is still blocked.",
        "continuation_sent": "A bounded continuation AccessGrant was issued.",
        "urgent_live_only": "Urgent-live handling opened while routine promotion remains blocked.",
        "webhook_signature_failed": "Incoming callback failed signature validation and opened replay-safe recovery.",
        "webhook_retry_pending": "Webhook replay window is open but unsettled.",
        "manual_audio_review_required": "Manual review is required before the normal intake path may continue.",
        "submitted": "Call evidence entered the canonical intake convergence path after readiness.",
        "provider_error": "Provider-like callback sequence degraded and invoked fallback behavior.",
        "closed": "The current branch is closed without implying broader request closure authority.",
    }
    return mapping.get(state, scenario["summary"])


def build_events(call_id: str, scenario: dict[str, Any], created_at: str) -> list[dict[str, str]]:
    base = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    events: list[dict[str, str]] = []
    for index, state in enumerate(scenario["state_path"], start=1):
        event_time = base.replace(microsecond=0) + (index - 1) * __import__("datetime").timedelta(minutes=2)
        events.append(
            {
                "event_id": f"{call_id}-{index}",
                "state": state,
                "label": event_label(state),
                "tone": event_tone(state),
                "detail": event_detail(scenario, state),
                "at": event_time.isoformat().replace("+00:00", "Z"),
            }
        )
    return events


def build_seeded_calls() -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []
    for seed in SEEDED_CALLS:
        scenario = scenario_by_id(seed["scenario_id"])
        calls.append(
            {
                **seed,
                "ivr_profile_ref": next(row["ivr_profile_ref"] for row in NUMBER_ROWS if row["number_id"] == seed["number_id"]),
                "recording_policy_ref": next(
                    row["recording_policy_ref"] for row in NUMBER_ROWS if row["number_id"] == seed["number_id"]
                ),
                "webhook_profile_ref": next(
                    row["webhook_profile_ref"] for row in NUMBER_ROWS if row["number_id"] == seed["number_id"]
                ),
                "urgent_state": scenario["urgent_state"],
                "recording_state": scenario["recording_state"],
                "transcript_state": scenario["transcript_state"],
                "continuation_state": scenario["continuation_state"],
                "webhook_state": scenario["webhook_state"],
                "events": build_events(seed["call_id"], scenario, seed["created_at"]),
                "can_advance": scenario["terminal_state"]
                not in {"closed", "manual_audio_review_required", "continuation_sent"},
                "can_retry_webhook": scenario["webhook_state"] == "signature_failed",
            }
        )
    return calls


def build_field_map() -> dict[str, Any]:
    provider_breakdown = {
        vendor: len([row for row in FIELD_ROWS if row["provider_vendor"] == vendor])
        for vendor in sorted({row["provider_vendor"] for row in FIELD_ROWS})
    }
    return {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "captured_on": CAPTURED_ON,
        "summary": {
            "field_count": len(FIELD_ROWS),
            "provider_breakdown": provider_breakdown,
            "live_required_count": len([row for row in FIELD_ROWS if row["required_in_live"] == "yes"]),
            "mock_required_count": len([row for row in FIELD_ROWS if row["required_in_mock"] == "yes"]),
        },
        "fields": FIELD_ROWS,
    }


def build_live_gate_pack(inputs: dict[str, Any], shortlist: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "captured_on": CAPTURED_ON,
        "phase0_verdict": inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        "current_creation_posture": "blocked",
        "current_spend_posture": "blocked",
        "required_env": [
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
        ],
        "allowed_vendor_ids": [row["vendor_id"] for row in shortlist],
        "selector_map": SELECTOR_MAP,
        "official_label_checks": {
            "twilio_subaccounts": {
                "url": "https://www.twilio.com/docs/iam/api/subaccounts",
                "expected": ["Twilio deletes closed subaccounts 30 days after closure."],
            },
            "twilio_webhooks": {
                "url": "https://www.twilio.com/docs/usage/webhooks/webhooks-security",
                "expected": ["X-Twilio-Signature"],
            },
            "twilio_number_pricing": {
                "url": "https://www.twilio.com/en-us/voice/pricing/gb",
                "expected": ["instantly provisioned via Twilio console or number provisioning API"],
            },
            "vonage_voice_getting_started": {
                "url": "https://developer.vonage.com/en/voice/voice-api/getting-started",
                "expected": ["123456789", "add credit to your account"],
            },
            "vonage_webhooks": {
                "url": "https://developer.vonage.com/en/getting-started/concepts/webhooks",
                "expected": ["answer_url", "event_url", "fallback_answer_url"],
            },
            "vonage_numbers_api": {
                "url": "https://developer.vonage.com/de/api/numbers",
                "expected": ["Search available numbers", "Buy a number", "Cancel a number", "Update a number"],
            },
        },
        "live_gates": LIVE_GATES,
        "summary": {
            "live_gate_count": len(LIVE_GATES),
            "blocked_count": len([row for row in LIVE_GATES if row["status"] == "blocked"]),
            "review_required_count": len([row for row in LIVE_GATES if row["status"] == "review_required"]),
            "pass_count": len([row for row in LIVE_GATES if row["status"] == "pass"]),
        },
    }


def build_pack(inputs: dict[str, Any]) -> dict[str, Any]:
    telephony_rows = telephony_secret_rows(inputs["external_account_inventory"])
    shortlist = inputs["vendor_shortlist"]["shortlist_by_family"]["telephony_ivr"]
    seeded_calls = build_seeded_calls()
    live_gate_pack = build_live_gate_pack(inputs, shortlist)
    pack = {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "phase0_verdict": inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        "source_precedence": SOURCE_PRECEDENCE,
        "assumptions": ASSUMPTIONS,
        "official_vendor_guidance": OFFICIAL_VENDOR_GUIDANCE,
        "shortlisted_vendors": shortlist,
        "selected_secret_rows": telephony_rows,
        "selected_risks": SELECTED_RISKS,
        "number_inventory": NUMBER_ROWS,
        "webhook_matrix": WEBHOOK_ROWS,
        "recording_policies": RECORDING_POLICIES,
        "ivr_profiles": IVR_PROFILES,
        "call_scenarios": SCENARIOS,
        "seeded_calls": seeded_calls,
        "live_gate_pack": live_gate_pack,
        "mock_service": {
            "base_url_default": "http://127.0.0.1:4180",
            "sandbox_path_default": "http://127.0.0.1:4180/",
            "non_routable_namespace": "MOCK:+44-VC-XXXX",
            "ports": {
                "carrier": 4180,
                "lab_preview": 4181,
            },
        },
        "summary": {
            "number_count": len(NUMBER_ROWS),
            "field_count": len(FIELD_ROWS),
            "webhook_row_count": len(WEBHOOK_ROWS),
            "recording_policy_count": len(RECORDING_POLICIES),
            "ivr_profile_count": len(IVR_PROFILES),
            "live_gate_count": len(LIVE_GATES),
            "blocked_live_gate_count": len([row for row in LIVE_GATES if row["status"] == "blocked"]),
            "review_live_gate_count": len([row for row in LIVE_GATES if row["status"] == "review_required"]),
            "pass_live_gate_count": len([row for row in LIVE_GATES if row["status"] == "pass"]),
            "scenario_count": len(SCENARIOS),
            "seeded_call_count": len(seeded_calls),
            "selected_secret_count": len(telephony_rows),
            "selected_vendor_count": len(shortlist),
            "selected_risk_count": len(SELECTED_RISKS),
        },
    }
    return pack


def render_local_spec_doc(pack: dict[str, Any]) -> str:
    stats = pack["summary"]
    scenario_table = to_markdown_table(
        [
            {
                "scenario_id": row["scenario_id"],
                "label": row["label"],
                "terminal_state": row["terminal_state"],
                "urgent_state": row["urgent_state"],
                "recording_state": row["recording_state"],
                "continuation_state": row["continuation_state"],
            }
            for row in SCENARIOS
        ],
        ["scenario_id", "label", "terminal_state", "urgent_state", "recording_state", "continuation_state"],
    )
    return textwrap.dedent(
        f"""\
        # 32 Local Telephony Lab Spec

        ## Mission

        {MISSION}

        ## Summary

        - Visual mode: `{VISUAL_MODE}`
        - Number inventory rows: `{stats["number_count"]}`
        - Webhook rows: `{stats["webhook_row_count"]}`
        - Seeded calls: `{stats["seeded_call_count"]}`
        - Current real-provider posture: `blocked`

        ## Section A — `Mock_now_execution`

        The local telephony twin is made of two coordinated artefacts:

        - `services/mock-telephony-carrier` exposes the carrier-like API, event disorder, signature checks, number assignment, and replay-safe call progression.
        - `apps/mock-telephony-lab` exposes the premium `Voice_Fabric_Lab` operator surface for number inventory, IVR flow rehearsal, recording posture, continuation, and live-gate review.

        The mock lane preserves the blueprint's non-negotiable telephony truths:

        - urgent-live preemption opens before routine promotion when the menu path or live signal demands it
        - recording availability is weaker than evidence readiness
        - transcript output is derivative, not source truth
        - SMS continuation may open a bounded grant, but never routine submission on its own
        - webhook transport success is never authoritative request or callback truth

        The lab uses a deliberately non-routable namespace, `MOCK:+44-VC-XXXX`, so number handling remains realistic without implying live PSTN reachability.

        ### Mock scenario matrix

        {scenario_table}

        ### Voice_Fabric_Lab surface

        The lab UI follows the required shell:

        - sticky `72px` posture banner
        - left number rail at `280px`
        - center flow and event workspace
        - right inspector at `360px`
        - lower strip showing `inbound_call -> ivr -> verification -> recording -> transcript_hook -> continuation_or_triage`

        ## Section B — `Actual_provider_strategy_later`

        The live path stays fail-closed. Real telephony account, workspace, or number mutation is blocked until:

        - one shortlisted vendor from task `031` is explicitly selected
        - named approver, target environment, callback base URL, number profile, recording policy, and spend cap are present
        - webhook security and replay posture are approved
        - `ALLOW_REAL_PROVIDER_MUTATION=true` and `ALLOW_SPEND=true` are set
        - the withheld Phase 0 external-readiness chain is cleared

        Shortlisted vendors for later execution:

        - `Twilio`
        - `Vonage`

        The later path stays a provider-plan handoff only. Workspace success, purchased numbers, or recording callbacks still do not imply product readiness or routine request truth.
        """
    )


def render_field_map_doc(field_map: dict[str, Any]) -> str:
    shared = [row for row in FIELD_ROWS if row["provider_vendor"] == "shared"]
    twilio = [row for row in FIELD_ROWS if row["provider_vendor"] == "Twilio"]
    vonage = [row for row in FIELD_ROWS if row["provider_vendor"] == "Vonage"]
    return textwrap.dedent(
        f"""\
        # 32 Telephony Account And Number Field Map

        ## Summary

        - Total fields: `{field_map["summary"]["field_count"]}`
        - Mock-required fields: `{field_map["summary"]["mock_required_count"]}`
        - Live-required fields: `{field_map["summary"]["live_required_count"]}`

        ## Section A — `Mock_now_execution`

        Shared mock-now controls still matter because the mock lab is not a toy stub. The same number profile, recording policy, webhook base, and secret-ref surfaces must exist locally so the lab preserves the eventual live contract shape.

        ### Shared telephony fields

        {to_markdown_table(shared, ["field_id", "canonical_label", "value_kind", "required_in_mock", "required_in_live", "notes"])}

        ## Section B — `Actual_provider_strategy_later`

        ### Twilio-later field map

        {to_markdown_table(twilio, ["field_id", "provider_field_name", "canonical_label", "required_in_live", "live_surface", "notes"])}

        ### Vonage-later field map

        {to_markdown_table(vonage, ["field_id", "provider_field_name", "canonical_label", "required_in_live", "live_surface", "notes"])}
        """
    )


def render_live_gate_doc(live_gate_pack: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""\
        # 32 Telephony Live Gate And Spend Controls

        ## Summary

        - Current creation posture: `{live_gate_pack["current_creation_posture"]}`
        - Gate rows: `{live_gate_pack["summary"]["live_gate_count"]}`
        - Blocked gates: `{live_gate_pack["summary"]["blocked_count"]}`
        - Review-required gates: `{live_gate_pack["summary"]["review_required_count"]}`
        - Pass gates: `{live_gate_pack["summary"]["pass_count"]}`

        ## Section A — `Mock_now_execution`

        The mock lane exposes the future live-gate fields in read/write form, but it never mutates an external provider. Cost and spend controls are still visible so the team rehearses governance before live procurement begins.

        ## Section B — `Actual_provider_strategy_later`

        ### Required live env

        {to_markdown_table([{"env": item} for item in live_gate_pack["required_env"]], ["env"])}

        ### Gate checklist

        {to_markdown_table(live_gate_pack["live_gates"], ["gate_id", "status", "class", "summary", "reason"])}
        """
    )


def render_webhook_doc(pack: dict[str, Any]) -> str:
    guidance_rows = [
        {
            "source_id": row["source_id"],
            "vendor": row["vendor"],
            "title": row["title"],
            "url": row["url"],
        }
        for row in OFFICIAL_VENDOR_GUIDANCE
    ]
    return textwrap.dedent(
        f"""\
        # 32 Telephony Webhook And Recording Config Strategy

        ## Summary

        - Webhook rows: `{len(WEBHOOK_ROWS)}`
        - Recording policies: `{len(RECORDING_POLICIES)}`
        - IVR profiles: `{len(IVR_PROFILES)}`

        ## Section A — `Mock_now_execution`

        The local carrier keeps answer, status, recording, transcript, and continuation hooks as separate rows so transport acceptance, recording arrival, transcript derivation, and SMS dispatch never collapse into one generic success badge.

        ### Webhook matrix

        {to_markdown_table(WEBHOOK_ROWS, ["webhook_row_id", "provider_vendor", "endpoint_kind", "signature_scheme", "retry_profile", "authoritative_truth_note"])}

        ### Recording policies

        {to_markdown_table(RECORDING_POLICIES, ["recording_policy_ref", "label", "retention_class", "transcript_floor", "manual_review_trigger"])}

        ## Section B — `Actual_provider_strategy_later`

        Official provider grounding used for later execution:

        {to_markdown_table(guidance_rows, ["source_id", "vendor", "title", "url"])}

        Twilio-later posture:

        - use subaccounts or equivalent bounded workspace segmentation
        - configure `VoiceUrl`, `VoiceFallbackUrl`, `StatusCallback`, and recording callbacks before any number purchase
        - prefer API keys over raw Auth Token for long-lived automation

        Vonage-later posture:

        - create one application that carries security plus callback configuration
        - wire `answer_url`, `event_url`, optional `fallback_answer_url`, and number-level `voiceStatusCallback`
        - treat `Buy a number` and `Cancel a number` as spend-bearing live mutations
        """
    )


def render_app_readme(pack: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""\
        # mock-telephony-lab

        Premium local telephony operations lab for seq_032.

        Visual mode: `{VISUAL_MODE}`

        ## Run

        ```bash
        pnpm install
        pnpm dev --host 127.0.0.1 --port 4181
        ```

        Optional carrier base URL:

        ```text
        http://127.0.0.1:4181/?telephonyBaseUrl=http://127.0.0.1:4180
        ```

        The app ships with embedded seeded data and still loads without the carrier service. When the carrier is available it uses the HTTP API for number assignment, call simulation, lifecycle advance, and webhook retry.
        """
    )


def render_service_readme(pack: dict[str, Any]) -> str:
    return textwrap.dedent(
        f"""\
        # mock-telephony-carrier

        Local carrier twin for seq_032.

        ## Run

        ```bash
        pnpm start
        ```

        Defaults:

        - Host: `127.0.0.1`
        - Port: `4180`

        ## HTTP surfaces

        - `GET /api/health`
        - `GET /api/registry`
        - `GET /api/numbers`
        - `POST /api/numbers/assign`
        - `POST /api/numbers/release`
        - `GET /api/calls`
        - `POST /api/calls/simulate`
        - `POST /api/calls/:id/advance`
        - `POST /api/calls/:id/retry-webhook`

        The service preserves the same truth split as the blueprint: call transport, recording availability, transcript derivation, continuation dispatch, and routine-promotion readiness remain separate states.
        """
    )


def app_package_json() -> str:
    return textwrap.dedent(
        """\
        {
          "name": "mock-telephony-lab",
          "private": true,
          "version": "0.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "tsc -b && vite build",
            "preview": "vite preview"
          },
          "dependencies": {
            "react": "^18.3.1",
            "react-dom": "^18.3.1"
          },
          "devDependencies": {
            "@types/react": "^18.3.12",
            "@types/react-dom": "^18.3.1",
            "@vitejs/plugin-react": "^4.3.1",
            "typescript": "^5.6.2",
            "vite": "^5.4.8"
          }
        }
        """
    )


def app_tsconfig() -> str:
    return textwrap.dedent(
        """\
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
    )


def app_vite_config() -> str:
    return textwrap.dedent(
        """\
        import { defineConfig } from "vite";
        import react from "@vitejs/plugin-react";

        export default defineConfig({
          plugins: [react()],
        });
        """
    )


def app_index_html() -> str:
    return textwrap.dedent(
        """\
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" href="data:," />
            <title>Vecells MOCK_TELEPHONY_LAB</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
        """
    )


def app_main_tsx() -> str:
    return textwrap.dedent(
        """\
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
    )


def app_styles_css() -> str:
    return textwrap.dedent(
        """\
        :root {
          --canvas: #f5f7fa;
          --panel: #ffffff;
          --inset: #eef2f6;
          --text-strong: #101828;
          --text-default: #1d2939;
          --text-muted: #667085;
          --border-subtle: #e4e7ec;
          --border-default: #d0d5dd;
          --primary: #0b57d0;
          --secondary: #0e9384;
          --voice: #7a5af8;
          --caution: #b54708;
          --blocked: #c24141;
          --success: #12b76a;
          --shadow-soft: 0 22px 64px rgba(16, 24, 40, 0.08);
          --shadow-strong: 0 32px 88px rgba(11, 87, 208, 0.12);
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
            radial-gradient(circle at top left, rgba(11, 87, 208, 0.12), transparent 28%),
            radial-gradient(circle at top right, rgba(122, 90, 248, 0.1), transparent 24%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(245, 247, 250, 0.98)),
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
        [role="tab"]:focus-visible,
        [role="button"]:focus-visible {
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
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        tbody tr {
          transition: background-color var(--transition-fast);
        }

        tbody tr:hover {
          background: rgba(11, 87, 208, 0.04);
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
          min-height: 110px;
          padding: 14px;
          resize: vertical;
        }

        .voice-shell {
          max-width: 1440px;
          margin: 0 auto;
          padding: 24px;
        }

        .panel,
        .metric-card,
        .number-button,
        .page-tab,
        .call-card,
        .event-card,
        .fact-card,
        .flow-card {
          border: 1px solid rgba(208, 213, 221, 0.96);
          border-radius: var(--radius);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: var(--shadow-soft);
          backdrop-filter: blur(16px);
        }

        .panel,
        .metric-card,
        .fact-card,
        .flow-card {
          padding: 18px;
        }

        .posture-banner {
          position: sticky;
          top: 0;
          z-index: 9;
          min-height: var(--header-height);
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(320px, 420px);
          gap: 20px;
          margin-bottom: 20px;
        }

        .workspace-grid {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 360px;
          gap: 20px;
          align-items: start;
        }

        .center-column,
        .panel-stack,
        .page-tabs,
        .number-list,
        .call-list,
        .event-list,
        .fact-list,
        .form-stack,
        .flow-grid,
        .diagram-strip {
          display: grid;
          gap: 16px;
        }

        .brand-panel,
        .guard-panel {
          display: grid;
          gap: 16px;
        }

        .brand-row,
        .ribbon-row,
        .chip-row,
        .panel-header,
        .summary-row,
        .button-row,
        .mode-toggle,
        .call-card-header,
        .flow-track,
        .diagram-line,
        .metrics-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-row,
        .panel-header,
        .call-card-header {
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
        .tone-chip {
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
          background: rgba(11, 87, 208, 0.1);
          letter-spacing: 0.08em;
        }

        .mono-chip,
        .number-meta,
        .code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .mono-chip {
          color: var(--text-strong);
          background: rgba(16, 24, 40, 0.06);
        }

        .status-chip {
          color: var(--secondary);
          background: rgba(14, 147, 132, 0.12);
        }

        .tone-success {
          color: var(--success);
          background: rgba(18, 183, 106, 0.12);
        }

        .tone-review {
          color: var(--voice);
          background: rgba(122, 90, 248, 0.12);
        }

        .tone-caution {
          color: var(--caution);
          background: rgba(181, 71, 8, 0.12);
        }

        .tone-blocked {
          color: var(--blocked);
          background: rgba(194, 65, 65, 0.12);
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .metric-card strong {
          display: block;
          color: var(--text-strong);
          font-size: 26px;
          line-height: 1.1;
        }

        .metric-card span {
          display: block;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .page-tabs {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .page-tab,
        .number-button,
        .ghost-button,
        .primary-button,
        .secondary-button {
          min-height: var(--button-height);
          border: 1px solid rgba(208, 213, 221, 0.96);
          transition:
            transform var(--transition-medium),
            box-shadow var(--transition-medium),
            background-color var(--transition-fast),
            border-color var(--transition-fast);
        }

        .page-tab,
        .number-button,
        .ghost-button,
        .secondary-button {
          background: rgba(255, 255, 255, 0.92);
          color: var(--text-default);
        }

        .page-tab,
        .number-button {
          text-align: left;
          padding: 12px 14px;
        }

        .page-tab:hover,
        .number-button:hover,
        .ghost-button:hover,
        .secondary-button:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-soft);
        }

        .page-tab.active,
        .number-button.active {
          border-color: rgba(11, 87, 208, 0.36);
          background: linear-gradient(135deg, rgba(11, 87, 208, 0.08), rgba(122, 90, 248, 0.1));
          box-shadow: var(--shadow-strong);
        }

        .primary-button {
          color: #fff;
          border-color: transparent;
          background: linear-gradient(135deg, var(--primary), #3478ff);
          padding: 0 18px;
        }

        .secondary-button {
          padding: 0 18px;
        }

        .ghost-button {
          padding: 0 18px;
        }

        .primary-button:disabled,
        .secondary-button:disabled,
        .ghost-button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
          box-shadow: none;
        }

        .number-button small,
        .fact-card small,
        .call-card small {
          display: block;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .number-capability-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .call-card {
          padding: 16px;
        }

        .event-card {
          padding: 14px 16px;
        }

        .event-card strong,
        .fact-card strong {
          display: block;
          color: var(--text-strong);
          margin-bottom: 4px;
        }

        .flow-card {
          min-height: 160px;
        }

        .flow-track {
          flex-wrap: wrap;
          row-gap: 10px;
        }

        .flow-node {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 36px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-default);
          background: var(--inset);
        }

        .flow-arrow {
          color: var(--text-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .diagram-strip {
          margin-top: 20px;
        }

        .diagram-line {
          justify-content: space-between;
          flex-wrap: wrap;
          row-gap: 10px;
        }

        .diagram-node {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(122, 90, 248, 0.2);
          background: rgba(122, 90, 248, 0.08);
          color: var(--text-strong);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .legend-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .muted {
          color: var(--text-muted);
        }

        .subhead {
          color: var(--text-muted);
          margin-top: 6px;
        }

        .inline-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .form-stack label {
          display: grid;
          gap: 8px;
          color: var(--text-strong);
        }

        .table-wrap {
          overflow: auto;
        }

        @media (max-width: 1220px) {
          .workspace-grid {
            grid-template-columns: 1fr;
          }

          .page-tabs,
          .metric-grid,
          .inline-grid,
          .posture-banner {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .voice-shell {
            padding: 16px;
          }

          .page-tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        """
    )


def app_tsx() -> str:
    return textwrap.dedent(
        """\
        import { useEffect, useMemo, useState } from "react";

        import { telephonyLabPack } from "./generated/telephonyLabPack";

        type Pack = typeof telephonyLabPack;
        type NumberRow = Pack["number_inventory"][number];
        type CallRow = Pack["seeded_calls"][number];
        type ScenarioRow = Pack["call_scenarios"][number];
        type GateRow = Pack["live_gate_pack"]["live_gates"][number];
        type Page =
          | "Number_Inventory"
          | "IVR_Flow_Studio"
          | "Webhook_and_Signature_Map"
          | "Recording_and_Continuation"
          | "Live_Gates_and_Spend_Controls";
        type Mode = "mock" | "actual";

        type AppState = {
          mode: Mode;
          page: Page;
          selectedNumberId: string;
          selectedScenarioId: string;
          selectedCallId: string;
          serviceBaseUrl: string;
          actualInputs: {
            telephonyVendorId: string;
            namedApprover: string;
            targetEnvironment: string;
            callbackBaseUrl: string;
            recordingPolicyRef: string;
            numberProfileRef: string;
            spendCapGbp: string;
            webhookSecretRef: string;
            allowMutation: string;
            allowSpend: string;
          };
          reducedMotion: boolean;
        };

        type LiveNumber = NumberRow & {
          assignment_state: "available" | "assigned";
          assigned_to: string;
        };

        type LiveCall = CallRow;

        const STORAGE_KEY = "voice-fabric-lab-state";
        const PAGE_ORDER: readonly Page[] = [
          "Number_Inventory",
          "IVR_Flow_Studio",
          "Webhook_and_Signature_Map",
          "Recording_and_Continuation",
          "Live_Gates_and_Spend_Controls",
        ];

        function scenarioById(id: string): ScenarioRow {
          return telephonyLabPack.call_scenarios.find((row) => row.scenario_id === id)!;
        }

        function numberById(id: string): NumberRow {
          return telephonyLabPack.number_inventory.find((row) => row.number_id === id)!;
        }

        function initialNumbers(): LiveNumber[] {
          return telephonyLabPack.number_inventory.map((row, index) => ({
            ...row,
            assignment_state: index < 4 ? "assigned" : "available",
            assigned_to: index < 4 ? "voice_lab" : "",
          }));
        }

        function seededCalls(): LiveCall[] {
          return telephonyLabPack.seeded_calls.map((row) => ({ ...row }));
        }

        function defaultState(): AppState {
          const params = new URLSearchParams(window.location.search);
          const firstNumber = telephonyLabPack.number_inventory[0];
          const firstScenario = telephonyLabPack.call_scenarios[0];
          const firstCall = telephonyLabPack.seeded_calls[0];
          return {
            mode: params.get("mode") === "actual" ? "actual" : "mock",
            page:
              (params.get("page") as Page | null) ??
              "Number_Inventory",
            selectedNumberId: firstNumber.number_id,
            selectedScenarioId: firstScenario.scenario_id,
            selectedCallId: firstCall.call_id,
            serviceBaseUrl:
              params.get("telephonyBaseUrl") ?? telephonyLabPack.mock_service.base_url_default,
            actualInputs: {
              telephonyVendorId: "twilio_telephony_ivr",
              namedApprover: "",
              targetEnvironment: "provider_like_preprod",
              callbackBaseUrl: "https://example.invalid/telephony",
              recordingPolicyRef: firstNumber.recording_policy_ref,
              numberProfileRef: firstNumber.number_id,
              spendCapGbp: "0",
              webhookSecretRef: "vault://telephony/webhook",
              allowMutation: "false",
              allowSpend: "false",
            },
            reducedMotion: false,
          };
        }

        function initialState(): AppState {
          const base = defaultState();
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

        function nextCallId(currentCalls: readonly LiveCall[]): string {
          const nextOrdinal =
            currentCalls
              .map((row) => Number(row.call_id.split("-").pop()))
              .filter((value) => Number.isFinite(value))
              .sort((a, b) => b - a)[0] + 1;
          return `CALL-LAB-${String(nextOrdinal || 5000)}`;
        }

        function eventLabel(state: string): string {
          return state.replace(/_/g, " ");
        }

        function eventTone(state: string): string {
          if (["closed", "submitted", "evidence_ready"].includes(state)) {
            return "tone-success";
          }
          if (["urgent_live_only", "manual_audio_review_required", "recording_missing"].includes(state)) {
            return "tone-blocked";
          }
          if (["webhook_signature_failed", "webhook_retry_pending", "provider_error"].includes(state)) {
            return "tone-caution";
          }
          if (["continuation_eligible", "continuation_sent", "evidence_pending"].includes(state)) {
            return "tone-review";
          }
          return "";
        }

        function localEventsForScenario(callId: string, scenario: ScenarioRow): LiveCall["events"] {
          return scenario.state_path.map((state, index) => ({
            event_id: `${callId}-${index + 1}`,
            state,
            label: eventLabel(state),
            tone:
              state === "closed" || state === "submitted" || state === "evidence_ready"
                ? "success"
                : state === "urgent_live_only" || state === "manual_audio_review_required" || state === "recording_missing"
                  ? "blocked"
                  : state === "webhook_signature_failed" || state === "webhook_retry_pending" || state === "provider_error"
                    ? "caution"
                    : state === "continuation_eligible" || state === "continuation_sent" || state === "evidence_pending"
                      ? "review"
                      : "default",
            detail: scenario.summary,
            at: new Date(Date.now() + index * 120000).toISOString(),
          }));
        }

        function buildLocalCall(callId: string, scenario: ScenarioRow, numberId: string): LiveCall {
          const numberRow = numberById(numberId);
          return {
            call_id: callId,
            scenario_id: scenario.scenario_id,
            number_id: numberId,
            direction: scenario.direction,
            caller_ref: "synthetic-live-run",
            created_at: new Date().toISOString(),
            status: scenario.terminal_state,
            summary: scenario.summary,
            ivr_profile_ref: numberRow.ivr_profile_ref,
            recording_policy_ref: numberRow.recording_policy_ref,
            webhook_profile_ref: numberRow.webhook_profile_ref,
            urgent_state: scenario.urgent_state,
            recording_state: scenario.recording_state,
            transcript_state: scenario.transcript_state,
            continuation_state: scenario.continuation_state,
            webhook_state: scenario.webhook_state,
            events: localEventsForScenario(callId, scenario),
            can_advance: !["closed", "manual_audio_review_required", "continuation_sent"].includes(
              scenario.terminal_state,
            ),
            can_retry_webhook: scenario.webhook_state === "signature_failed",
          };
        }

        function nextAdvanceState(call: LiveCall): LiveCall {
          if (!call.can_advance) {
            return call;
          }
          return {
            ...call,
            can_advance: false,
            status: call.status === "evidence_pending" ? "submitted" : call.status,
            events: call.events.concat({
              event_id: `${call.call_id}-${call.events.length + 1}`,
              state: call.status === "evidence_pending" ? "submitted" : "closed",
              label: call.status === "evidence_pending" ? "submitted" : "closed",
              tone: call.status === "evidence_pending" ? "success" : "success",
              detail: call.status === "evidence_pending"
                ? "The call is now ready to feed the canonical intake convergence path."
                : "The scenario reached its terminal mock posture.",
              at: new Date().toISOString(),
            }),
          };
        }

        function nextRetryState(call: LiveCall): LiveCall {
          if (!call.can_retry_webhook) {
            return call;
          }
          return {
            ...call,
            can_retry_webhook: false,
            webhook_state: "recovered",
            events: call.events.concat(
              {
                event_id: `${call.call_id}-${call.events.length + 1}`,
                state: "webhook_signature_validated",
                label: "webhook signature validated",
                tone: "success",
                detail: "Replay-safe retry succeeded after callback signature validation.",
                at: new Date().toISOString(),
              },
              {
                event_id: `${call.call_id}-${call.events.length + 2}`,
                state: "webhook_dispatch_recovered",
                label: "webhook dispatch recovered",
                tone: "success",
                detail: "Recovered callback remains transport evidence only until Vecells settlement runs.",
                at: new Date(Date.now() + 60000).toISOString(),
              },
            ),
          };
        }

        function App() {
          const [appState, setAppState] = useState<AppState>(initialState);
          const [numbers, setNumbers] = useState<LiveNumber[]>(initialNumbers);
          const [calls, setCalls] = useState<LiveCall[]>(seededCalls);
          const [serviceStatus, setServiceStatus] = useState("checking");

          useEffect(() => {
            const media = window.matchMedia("(prefers-reduced-motion: reduce)");
            const apply = () => {
              setAppState((current) => ({ ...current, reducedMotion: media.matches }));
            };
            apply();
            media.addEventListener("change", apply);
            return () => media.removeEventListener("change", apply);
          }, []);

          useEffect(() => {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
            const params = new URLSearchParams(window.location.search);
            params.set("mode", appState.mode);
            params.set("page", appState.page);
            params.set("telephonyBaseUrl", appState.serviceBaseUrl);
            const nextUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, "", nextUrl);
          }, [appState]);

          useEffect(() => {
            let active = true;
            async function refresh() {
              try {
                const [health, numberRows, callRows] = await Promise.all([
                  fetch(`${appState.serviceBaseUrl}/api/health`).then((response) => response.json()),
                  fetch(`${appState.serviceBaseUrl}/api/numbers`).then((response) => response.json()),
                  fetch(`${appState.serviceBaseUrl}/api/calls`).then((response) => response.json()),
                ]);
                if (!active) {
                  return;
                }
                if (Array.isArray(numberRows.numbers)) {
                  setNumbers(numberRows.numbers);
                }
                if (Array.isArray(callRows.calls)) {
                  setCalls(callRows.calls);
                }
                setServiceStatus(health.status ?? "healthy");
              } catch {
                if (active) {
                  setServiceStatus("offline-fallback");
                }
              }
            }
            refresh();
            return () => {
              active = false;
            };
          }, [appState.serviceBaseUrl]);

          const selectedNumber = useMemo(
            () => numbers.find((row) => row.number_id === appState.selectedNumberId) ?? numbers[0],
            [numbers, appState.selectedNumberId],
          );
          const selectedCall = useMemo(
            () => calls.find((row) => row.call_id === appState.selectedCallId) ?? calls[0],
            [calls, appState.selectedCallId],
          );
          const selectedScenario = scenarioById(appState.selectedScenarioId);

          async function tryCarrierMutation(path: string, body: object): Promise<any | null> {
            try {
              const response = await fetch(`${appState.serviceBaseUrl}${path}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
              });
              const payload = await response.json();
              if (!response.ok) {
                throw new Error(payload.error || "Request failed");
              }
              return payload;
            } catch {
              return null;
            }
          }

          async function assignNumber() {
            const remote = await tryCarrierMutation("/api/numbers/assign", {
              number_id: selectedNumber.number_id,
              assigned_to: "voice_lab",
            });
            if (remote?.numbers) {
              setNumbers(remote.numbers);
              return;
            }
            setNumbers((current) =>
              current.map((row) =>
                row.number_id === selectedNumber.number_id
                  ? { ...row, assignment_state: "assigned", assigned_to: "voice_lab" }
                  : row,
              ),
            );
          }

          async function releaseNumber() {
            const remote = await tryCarrierMutation("/api/numbers/release", {
              number_id: selectedNumber.number_id,
            });
            if (remote?.numbers) {
              setNumbers(remote.numbers);
              return;
            }
            setNumbers((current) =>
              current.map((row) =>
                row.number_id === selectedNumber.number_id
                  ? { ...row, assignment_state: "available", assigned_to: "" }
                  : row,
              ),
            );
          }

          async function simulateCall() {
            const remote = await tryCarrierMutation("/api/calls/simulate", {
              number_id: selectedNumber.number_id,
              scenario_id: selectedScenario.scenario_id,
              direction: selectedScenario.direction,
            });
            if (remote?.call) {
              setCalls((current) => [remote.call, ...current]);
              setAppState((current) => ({ ...current, selectedCallId: remote.call.call_id }));
              return;
            }
            const call = buildLocalCall(nextCallId(calls), selectedScenario, selectedNumber.number_id);
            setCalls((current) => [call, ...current]);
            setAppState((current) => ({ ...current, selectedCallId: call.call_id }));
          }

          async function advanceCall() {
            if (!selectedCall) {
              return;
            }
            const remote = await tryCarrierMutation(`/api/calls/${selectedCall.call_id}/advance`, {});
            if (remote?.call) {
              setCalls((current) =>
                current.map((row) => (row.call_id === remote.call.call_id ? remote.call : row)),
              );
              return;
            }
            const next = nextAdvanceState(selectedCall);
            setCalls((current) => current.map((row) => (row.call_id === next.call_id ? next : row)));
          }

          async function retryWebhook() {
            if (!selectedCall) {
              return;
            }
            const remote = await tryCarrierMutation(`/api/calls/${selectedCall.call_id}/retry-webhook`, {});
            if (remote?.call) {
              setCalls((current) =>
                current.map((row) => (row.call_id === remote.call.call_id ? remote.call : row)),
              );
              return;
            }
            const next = nextRetryState(selectedCall);
            setCalls((current) => current.map((row) => (row.call_id === next.call_id ? next : row)));
          }

          function updateActualInput(
            key: keyof AppState["actualInputs"],
            value: string,
          ) {
            setAppState((current) => ({
              ...current,
              actualInputs: {
                ...current.actualInputs,
                [key]: value,
              },
            }));
          }

          const actualSubmitDisabled =
            telephonyLabPack.phase0_verdict === "withheld" ||
            appState.actualInputs.allowMutation !== "true" ||
            appState.actualInputs.allowSpend !== "true" ||
            !appState.actualInputs.namedApprover.trim() ||
            !appState.actualInputs.callbackBaseUrl.trim() ||
            !appState.actualInputs.spendCapGbp.trim();

          const activeCalls = calls.filter((row) => !["closed"].includes(row.status)).length;
          const assignedNumbers = numbers.filter((row) => row.assignment_state === "assigned").length;
          const webhookAlerts = calls.filter((row) =>
            ["signature_failed", "fallback_recovered"].includes(row.webhook_state),
          ).length;
          const reducedMotionLabel = appState.reducedMotion ? "Reduced motion on" : "Reduced motion off";

          return (
            <main className="voice-shell" data-testid="telephony-shell">
              <header className="posture-banner">
                <section className="panel brand-panel">
                  <div className="brand-row">
                    <svg className="wordmark" viewBox="0 0 64 64" aria-hidden="true">
                      <defs>
                        <linearGradient id="voiceMark" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0B57D0" />
                          <stop offset="100%" stopColor="#7A5AF8" />
                        </linearGradient>
                      </defs>
                      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#voiceMark)" />
                      <path d="M18 23h8l6 12 6-18 8 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="brand-copy">
                      <div className="ribbon-row">
                        <span className="mock-ribbon">MOCK_TELEPHONY_LAB</span>
                        <span className="mono-chip">{telephonyLabPack.visual_mode}</span>
                      </div>
                      <div>
                        <h1>Voice Fabric Lab</h1>
                        <p className="subhead">
                          High-fidelity telephony rehearsal for IVR, recording, urgent-live preemption, and SMS continuation.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="metric-grid">
                    <article className="metric-card">
                      <strong>{activeCalls}</strong>
                      <span>Active calls</span>
                    </article>
                    <article className="metric-card">
                      <strong>{assignedNumbers}</strong>
                      <span>Assigned numbers</span>
                    </article>
                    <article className="metric-card">
                      <strong>{webhookAlerts}</strong>
                      <span>Webhook alerts</span>
                    </article>
                    <article className="metric-card">
                      <strong>{serviceStatus}</strong>
                      <span>Carrier status</span>
                    </article>
                  </div>
                </section>

                <aside className="panel guard-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Mode and posture</h2>
                      <p className="subhead">Current real-provider posture stays blocked while the foundation gate is withheld.</p>
                    </div>
                    <span className="status-chip" data-testid="reduced-motion-indicator">{reducedMotionLabel}</span>
                  </div>
                  <div className="mode-toggle" role="tablist" aria-label="mode switch">
                    <button
                      className={`page-tab ${appState.mode === "mock" ? "active" : ""}`}
                      data-testid="mode-toggle-mock"
                      onClick={() => setAppState((current) => ({ ...current, mode: "mock" }))}
                      type="button"
                    >
                      Mock mode
                    </button>
                    <button
                      className={`page-tab ${appState.mode === "actual" ? "active" : ""}`}
                      data-testid="mode-toggle-actual"
                      onClick={() => setAppState((current) => ({ ...current, mode: "actual", page: "Live_Gates_and_Spend_Controls" }))}
                      type="button"
                    >
                      Actual-later
                    </button>
                  </div>
                  <div className="legend-row">
                    <span className="tone-chip tone-success">call settled</span>
                    <span className="tone-chip tone-review">continuation or review</span>
                    <span className="tone-chip tone-caution">retry or disorder</span>
                    <span className="tone-chip tone-blocked">blocked</span>
                  </div>
                </aside>
              </header>

              <section className="workspace-grid">
                <aside className="panel panel-stack" data-testid="number-rail">
                  <div className="panel-header">
                    <div>
                      <h2>Number inventory</h2>
                      <p className="subhead">Voice and SMS capabilities stay explicit per number.</p>
                    </div>
                    <span className="mono-chip">{numbers.length} rows</span>
                  </div>
                  <div className="number-list">
                    {numbers.map((row) => (
                      <button
                        key={row.number_id}
                        className={`number-button ${row.number_id === selectedNumber.number_id ? "active" : ""}`}
                        data-testid={`number-button-${row.number_id}`}
                        onClick={() => setAppState((current) => ({ ...current, selectedNumberId: row.number_id }))}
                        type="button"
                      >
                        <strong>{row.number_id}</strong>
                        <small className="number-meta">{row.e164_or_placeholder}</small>
                        <div className="number-capability-row">
                          <span className="mono-chip">{row.environment}</span>
                          <span className="mono-chip">{row.direction}</span>
                          <span className={`tone-chip ${row.voice_enabled === "yes" ? "tone-success" : "tone-blocked"}`}>
                            voice {row.voice_enabled}
                          </span>
                          <span className={`tone-chip ${row.sms_enabled === "yes" ? "tone-review" : "tone-blocked"}`}>
                            sms {row.sms_enabled}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </aside>

                <section className="center-column">
                  <nav className="page-tabs">
                    {PAGE_ORDER.map((page) => (
                      <button
                        key={page}
                        className={`page-tab ${appState.page === page ? "active" : ""}`}
                        data-testid={`page-tab-${page}`}
                        onClick={() => setAppState((current) => ({ ...current, page }))}
                        role="tab"
                        type="button"
                      >
                        {page.replace(/_/g, " ")}
                      </button>
                    ))}
                  </nav>

                  <section className="panel panel-stack" data-testid="flow-editor">
                    <div className="panel-header">
                      <div>
                        <h2>{appState.page.replace(/_/g, " ")}</h2>
                        <p className="subhead">{selectedNumber.notes}</p>
                      </div>
                      <span className="mono-chip">{selectedNumber.webhook_profile_ref}</span>
                    </div>

                    {appState.page === "Number_Inventory" && (
                      <>
                        <div className="button-row">
                          <button className="secondary-button" data-testid="assign-number-button" onClick={assignNumber} type="button">
                            Assign number
                          </button>
                          <button className="ghost-button" data-testid="release-number-button" onClick={releaseNumber} type="button">
                            Release number
                          </button>
                        </div>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Profile</th>
                                <th>Value</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>IVR</td>
                                <td>{selectedNumber.ivr_profile_ref}</td>
                                <td>Menu and DTMF choreography stay bound to the number profile.</td>
                              </tr>
                              <tr>
                                <td>Recording</td>
                                <td>{selectedNumber.recording_policy_ref}</td>
                                <td>Recording remains weaker than evidence readiness.</td>
                              </tr>
                              <tr>
                                <td>Webhook</td>
                                <td>{selectedNumber.webhook_profile_ref}</td>
                                <td>Transport callbacks always land on internal endpoints first.</td>
                              </tr>
                              <tr>
                                <td>Urgent preemption</td>
                                <td>{selectedNumber.urgent_preemption_mode}</td>
                                <td>The number carries the urgent-live contract, not just routing metadata.</td>
                              </tr>
                              <tr>
                                <td>Assignment</td>
                                <td>{selectedNumber.assignment_state}</td>
                                <td>{selectedNumber.assigned_to || "Unassigned in the local lab."}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {appState.page === "IVR_Flow_Studio" && (
                      <>
                        <div className="inline-grid">
                          <label>
                            Scenario
                            <select
                              data-testid="scenario-select"
                              value={appState.selectedScenarioId}
                              onChange={(event) =>
                                setAppState((current) => ({ ...current, selectedScenarioId: event.target.value }))
                              }
                            >
                              {telephonyLabPack.call_scenarios.map((row) => (
                                <option key={row.scenario_id} value={row.scenario_id}>
                                  {row.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Carrier base URL
                            <input
                              data-testid="carrier-base-url"
                              value={appState.serviceBaseUrl}
                              onChange={(event) =>
                                setAppState((current) => ({ ...current, serviceBaseUrl: event.target.value }))
                              }
                            />
                          </label>
                        </div>
                        <div className="button-row">
                          <button className="primary-button" data-testid="simulate-call-button" onClick={simulateCall} type="button">
                            Simulate call
                          </button>
                          <button className="secondary-button" data-testid="advance-call-button" onClick={advanceCall} disabled={!selectedCall?.can_advance} type="button">
                            Advance lifecycle
                          </button>
                          <button className="ghost-button" data-testid="retry-webhook-button" onClick={retryWebhook} disabled={!selectedCall?.can_retry_webhook} type="button">
                            Retry webhook
                          </button>
                        </div>
                        <article className="flow-card">
                          <div className="panel-header">
                            <div>
                              <h3>{selectedScenario.label}</h3>
                              <p className="subhead">{selectedScenario.summary}</p>
                            </div>
                            <span className={`tone-chip ${eventTone(selectedScenario.terminal_state)}`}>
                              {selectedScenario.terminal_state}
                            </span>
                          </div>
                          <div className="flow-track" style={{ marginTop: 16 }}>
                            {selectedScenario.state_path.map((state, index) => (
                              <div key={state} className="flow-track">
                                <span className={`flow-node ${eventTone(state)}`}>{state.replace(/_/g, " ")}</span>
                                {index < selectedScenario.state_path.length - 1 ? (
                                  <span className="flow-arrow">-&gt;</span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </article>
                      </>
                    )}

                    {appState.page === "Webhook_and_Signature_Map" && (
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Webhook</th>
                              <th>Vendor</th>
                              <th>Signature</th>
                              <th>Replay guard</th>
                            </tr>
                          </thead>
                          <tbody>
                            {telephonyLabPack.webhook_matrix.map((row) => (
                              <tr key={row.webhook_row_id}>
                                <td>{row.endpoint_kind}</td>
                                <td>{row.provider_vendor}</td>
                                <td>{row.signature_scheme}</td>
                                <td>{row.replay_guard}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {appState.page === "Recording_and_Continuation" && (
                      <div className="flow-grid">
                        <article className="fact-card">
                          <strong>Recording state</strong>
                          <p>{selectedCall?.recording_state ?? "n/a"}</p>
                          <small>Recording availability must never be mistaken for evidence readiness.</small>
                        </article>
                        <article className="fact-card">
                          <strong>Transcript state</strong>
                          <p>{selectedCall?.transcript_state ?? "n/a"}</p>
                          <small>Transcript remains derivative, not source truth.</small>
                        </article>
                        <article className="fact-card">
                          <strong>Continuation state</strong>
                          <p>{selectedCall?.continuation_state ?? "n/a"}</p>
                          <small>Continuation may be eligible or sent without routine submit being safe.</small>
                        </article>
                        <article className="fact-card">
                          <strong>Urgent state</strong>
                          <p>{selectedCall?.urgent_state ?? "n/a"}</p>
                          <small>Urgent-live posture stays independent from routine promotion readiness.</small>
                        </article>
                      </div>
                    )}

                    {appState.page === "Live_Gates_and_Spend_Controls" && (
                      <div className="form-stack">
                        <div className="inline-grid">
                          <label>
                            Approved vendor
                            <select
                              data-testid="actual-field-telephony-vendor-id"
                              value={appState.actualInputs.telephonyVendorId}
                              onChange={(event) => updateActualInput("telephonyVendorId", event.target.value)}
                            >
                              {telephonyLabPack.shortlisted_vendors.map((row) => (
                                <option key={row.vendor_id} value={row.vendor_id}>
                                  {row.vendor_name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Named approver
                            <input
                              data-testid="actual-field-named-approver"
                              value={appState.actualInputs.namedApprover}
                              onChange={(event) => updateActualInput("namedApprover", event.target.value)}
                            />
                          </label>
                          <label>
                            Target environment
                            <select
                              data-testid="actual-field-target-environment"
                              value={appState.actualInputs.targetEnvironment}
                              onChange={(event) => updateActualInput("targetEnvironment", event.target.value)}
                            >
                              <option value="provider_like_preprod">provider_like_preprod</option>
                              <option value="production">production</option>
                            </select>
                          </label>
                          <label>
                            Callback base URL
                            <input
                              data-testid="actual-field-callback-base-url"
                              value={appState.actualInputs.callbackBaseUrl}
                              onChange={(event) => updateActualInput("callbackBaseUrl", event.target.value)}
                            />
                          </label>
                          <label>
                            Recording policy
                            <select
                              data-testid="actual-field-recording-policy-ref"
                              value={appState.actualInputs.recordingPolicyRef}
                              onChange={(event) => updateActualInput("recordingPolicyRef", event.target.value)}
                            >
                              {telephonyLabPack.recording_policies.map((row) => (
                                <option key={row.recording_policy_ref} value={row.recording_policy_ref}>
                                  {row.recording_policy_ref}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Number profile
                            <select
                              data-testid="actual-field-number-profile-ref"
                              value={appState.actualInputs.numberProfileRef}
                              onChange={(event) => updateActualInput("numberProfileRef", event.target.value)}
                            >
                              {telephonyLabPack.number_inventory.map((row) => (
                                <option key={row.number_id} value={row.number_id}>
                                  {row.number_id}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Spend cap GBP
                            <input
                              data-testid="actual-field-spend-cap-gbp"
                              value={appState.actualInputs.spendCapGbp}
                              onChange={(event) => updateActualInput("spendCapGbp", event.target.value)}
                            />
                          </label>
                          <label>
                            Webhook secret ref
                            <input
                              data-testid="actual-field-webhook-secret-ref"
                              value={appState.actualInputs.webhookSecretRef}
                              onChange={(event) => updateActualInput("webhookSecretRef", event.target.value)}
                            />
                          </label>
                          <label>
                            Allow real mutation
                            <select
                              data-testid="actual-field-allow-mutation"
                              value={appState.actualInputs.allowMutation}
                              onChange={(event) => updateActualInput("allowMutation", event.target.value)}
                            >
                              <option value="false">false</option>
                              <option value="true">true</option>
                            </select>
                          </label>
                          <label>
                            Allow spend
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
                        <button className="primary-button" data-testid="actual-submit-button" disabled={actualSubmitDisabled} type="button">
                          Real account or number creation blocked
                        </button>
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Gate</th>
                                <th>Status</th>
                                <th>Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {telephonyLabPack.live_gate_pack.live_gates.map((row) => (
                                <tr key={row.gate_id}>
                                  <td>{row.gate_id}</td>
                                  <td>{row.status}</td>
                                  <td>{row.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="panel panel-stack" data-testid="event-stream">
                    <div className="panel-header">
                      <div>
                        <h2>Event stream</h2>
                        <p className="subhead">One canonical call timeline, even when provider callbacks arrive out of order.</p>
                      </div>
                      <span className="mono-chip">{selectedCall?.call_id ?? "no-call"}</span>
                    </div>
                    <div className="call-list">
                      {calls.map((row) => (
                        <button
                          key={row.call_id}
                          className={`number-button ${selectedCall?.call_id === row.call_id ? "active" : ""}`}
                          data-testid={`call-card-${row.call_id}`}
                          onClick={() => setAppState((current) => ({ ...current, selectedCallId: row.call_id }))}
                          type="button"
                        >
                          <strong>{row.call_id}</strong>
                          <small>{row.summary}</small>
                          <div className="number-capability-row">
                            <span className="mono-chip">{row.status}</span>
                            <span className={`tone-chip ${eventTone(row.webhook_state)}`}>{row.webhook_state}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="event-list">
                      {(selectedCall?.events ?? []).map((event) => (
                        <article key={event.event_id} className="event-card">
                          <div className="call-card-header">
                            <strong>{event.label}</strong>
                            <span className={`tone-chip ${eventTone(event.state)}`}>{event.state}</span>
                          </div>
                          <p>{event.detail}</p>
                          <small className="muted">{event.at}</small>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="panel diagram-strip">
                    <div className="panel-header">
                      <div>
                        <h2>Continuity line</h2>
                        <p className="subhead">The lower strip keeps the same request-lineage truth visible.</p>
                      </div>
                    </div>
                    <div className="diagram-line" data-testid="lower-diagram">
                      {["inbound_call", "ivr", "verification", "recording", "transcript_hook", "continuation_or_triage"].map((label, index, array) => (
                        <div key={label} className="flow-track">
                          <span className="diagram-node">{label}</span>
                          {index < array.length - 1 ? <span className="flow-arrow">-&gt;</span> : null}
                        </div>
                      ))}
                    </div>
                  </section>
                </section>

                <aside className="panel panel-stack" data-testid="inspector-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Inspector</h2>
                      <p className="subhead">Recording, continuation, and security posture for the current selection.</p>
                    </div>
                    <span className="mono-chip">{selectedNumber.number_id}</span>
                  </div>
                  <article className="fact-card">
                    <strong>Webhook profile</strong>
                    <p>{selectedNumber.webhook_profile_ref}</p>
                    <small>{selectedNumber.notes}</small>
                  </article>
                  <article className="fact-card">
                    <strong>Recording policy</strong>
                    <p>{selectedNumber.recording_policy_ref}</p>
                    <small>{telephonyLabPack.recording_policies.find((row) => row.recording_policy_ref === selectedNumber.recording_policy_ref)?.notes}</small>
                  </article>
                  <article className="fact-card">
                    <strong>Continuation and urgent posture</strong>
                    <p>{selectedNumber.urgent_preemption_mode}</p>
                    <small>Continuation remains bounded and separate from routine submission.</small>
                  </article>
                  <article className="fact-card">
                    <strong>Current call states</strong>
                    <p>recording `{selectedCall?.recording_state ?? "n/a"}`</p>
                    <p>transcript `{selectedCall?.transcript_state ?? "n/a"}`</p>
                    <p>continuation `{selectedCall?.continuation_state ?? "n/a"}`</p>
                    <p>webhook `{selectedCall?.webhook_state ?? "n/a"}`</p>
                  </article>
                  <article className="fact-card">
                    <strong>Selected risks</strong>
                    <div className="fact-list">
                      {telephonyLabPack.selected_risks.map((row) => (
                        <div key={row.risk_id}>
                          <div className="call-card-header">
                            <span className="mono-chip">{row.risk_id}</span>
                            <span className={`tone-chip ${row.severity === "high" ? "tone-blocked" : "tone-caution"}`}>{row.severity}</span>
                          </div>
                          <small>{row.trigger_summary}</small>
                        </div>
                      ))}
                    </div>
                  </article>
                </aside>
              </section>
            </main>
          );
        }

        export default App;
        """
    )


def service_package_json() -> str:
    return textwrap.dedent(
        """\
        {
          "name": "mock-telephony-carrier",
          "private": true,
          "version": "0.0.0",
          "type": "module",
          "scripts": {
            "start": "node src/server.js"
          }
        }
        """
    )


def service_core_js() -> str:
    return textwrap.dedent(
        """\
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
        );

        const numberMap = new Map(PACK.number_inventory.map((row) => [row.number_id, row]));
        const scenarioMap = new Map(PACK.call_scenarios.map((row) => [row.scenario_id, row]));

        let numbers = PACK.number_inventory.map((row, index) => ({
          ...row,
          assignment_state: index < 4 ? "assigned" : "available",
          assigned_to: index < 4 ? "voice_lab" : "",
        }));
        let calls = PACK.seeded_calls.map((row) => JSON.parse(JSON.stringify(row)));
        let nextCallOrdinal = 5000;

        function clone(value) {
          return JSON.parse(JSON.stringify(value));
        }

        function eventTone(state) {
          if (["closed", "submitted", "evidence_ready"].includes(state)) {
            return "success";
          }
          if (["urgent_live_only", "manual_audio_review_required", "recording_missing"].includes(state)) {
            return "blocked";
          }
          if (["webhook_signature_failed", "webhook_retry_pending", "provider_error"].includes(state)) {
            return "caution";
          }
          if (["continuation_eligible", "continuation_sent", "evidence_pending"].includes(state)) {
            return "review";
          }
          return "default";
        }

        function scenarioById(id) {
          return scenarioMap.get(id);
        }

        function numberById(id) {
          return numberMap.get(id);
        }

        function localEventsForScenario(callId, scenario) {
          return scenario.state_path.map((state, index) => ({
            event_id: `${callId}-${index + 1}`,
            state,
            label: state.replace(/_/g, " "),
            tone: eventTone(state),
            detail: scenario.summary,
            at: new Date(Date.now() + index * 120000).toISOString(),
          }));
        }

        function buildCall(callId, scenario, numberId) {
          const numberRow = numberById(numberId);
          return {
            call_id: callId,
            scenario_id: scenario.scenario_id,
            number_id: numberId,
            direction: scenario.direction,
            caller_ref: "synthetic-live-run",
            created_at: new Date().toISOString(),
            status: scenario.terminal_state,
            summary: scenario.summary,
            ivr_profile_ref: numberRow.ivr_profile_ref,
            recording_policy_ref: numberRow.recording_policy_ref,
            webhook_profile_ref: numberRow.webhook_profile_ref,
            urgent_state: scenario.urgent_state,
            recording_state: scenario.recording_state,
            transcript_state: scenario.transcript_state,
            continuation_state: scenario.continuation_state,
            webhook_state: scenario.webhook_state,
            events: localEventsForScenario(callId, scenario),
            can_advance: !["closed", "manual_audio_review_required", "continuation_sent"].includes(
              scenario.terminal_state,
            ),
            can_retry_webhook: scenario.webhook_state === "signature_failed",
          };
        }

        function listNumbers() {
          return clone(numbers);
        }

        function listCalls() {
          return clone(calls).sort((a, b) => b.created_at.localeCompare(a.created_at));
        }

        function getCall(callId) {
          const call = calls.find((row) => row.call_id === callId);
          return call ? clone(call) : null;
        }

        function health() {
          return {
            status: "healthy",
            active_calls: calls.filter((row) => row.status !== "closed").length,
            assigned_numbers: numbers.filter((row) => row.assignment_state === "assigned").length,
            webhook_alerts: calls.filter((row) =>
              ["signature_failed", "fallback_recovered"].includes(row.webhook_state),
            ).length,
          };
        }

        function registry() {
          return {
            task_id: PACK.task_id,
            visual_mode: PACK.visual_mode,
            number_inventory: listNumbers(),
            call_scenarios: PACK.call_scenarios,
            live_gate_pack: PACK.live_gate_pack,
            official_vendor_guidance: PACK.official_vendor_guidance,
          };
        }

        function assignNumber(payload) {
          const number = numbers.find((row) => row.number_id === payload.number_id);
          if (!number) {
            return { ok: false, status: 422, error: "Unknown number." };
          }
          number.assignment_state = "assigned";
          number.assigned_to = payload.assigned_to || "voice_lab";
          return { ok: true, status: 200, numbers: listNumbers() };
        }

        function releaseNumber(payload) {
          const number = numbers.find((row) => row.number_id === payload.number_id);
          if (!number) {
            return { ok: false, status: 422, error: "Unknown number." };
          }
          const activeCall = calls.find(
            (row) => row.number_id === number.number_id && !["closed"].includes(row.status),
          );
          if (activeCall) {
            return {
              ok: false,
              status: 422,
              error: "Cannot release a number with an active call scenario still open.",
            };
          }
          number.assignment_state = "available";
          number.assigned_to = "";
          return { ok: true, status: 200, numbers: listNumbers() };
        }

        function simulateCall(payload) {
          const scenario = scenarioById(payload.scenario_id);
          const number = numbers.find((row) => row.number_id === payload.number_id);
          if (!scenario) {
            return { ok: false, status: 422, error: "Unknown scenario." };
          }
          if (!number) {
            return { ok: false, status: 422, error: "Unknown number." };
          }
          if (number.voice_enabled !== "yes") {
            return { ok: false, status: 422, error: "Selected number is not voice enabled." };
          }
          nextCallOrdinal += 1;
          const callId = `CALL-LAB-${nextCallOrdinal}`;
          const call = buildCall(callId, scenario, number.number_id);
          calls.unshift(call);
          return { ok: true, status: 201, call: clone(call), calls: listCalls() };
        }

        function advanceCall(callId) {
          const call = calls.find((row) => row.call_id === callId);
          if (!call) {
            return { ok: false, status: 404, error: "Call not found." };
          }
          if (!call.can_advance) {
            return { ok: false, status: 422, error: "Call cannot advance further." };
          }
          call.can_advance = false;
          call.status = call.status === "evidence_pending" ? "submitted" : call.status;
          call.events.push({
            event_id: `${call.call_id}-${call.events.length + 1}`,
            state: call.status === "submitted" ? "submitted" : "closed",
            label: call.status === "submitted" ? "submitted" : "closed",
            tone: "success",
            detail:
              call.status === "submitted"
                ? "Call evidence is ready to feed the canonical intake convergence path."
                : "The scenario reached its terminal mock posture.",
            at: new Date().toISOString(),
          });
          return { ok: true, status: 200, call: clone(call), calls: listCalls() };
        }

        function retryWebhook(callId) {
          const call = calls.find((row) => row.call_id === callId);
          if (!call) {
            return { ok: false, status: 404, error: "Call not found." };
          }
          if (!call.can_retry_webhook) {
            return { ok: false, status: 422, error: "Call has no retryable webhook fault." };
          }
          call.can_retry_webhook = false;
          call.webhook_state = "recovered";
          call.events.push(
            {
              event_id: `${call.call_id}-${call.events.length + 1}`,
              state: "webhook_signature_validated",
              label: "webhook signature validated",
              tone: "success",
              detail: "Replay-safe retry succeeded after callback signature validation.",
              at: new Date().toISOString(),
            },
            {
              event_id: `${call.call_id}-${call.events.length + 2}`,
              state: "webhook_dispatch_recovered",
              label: "webhook dispatch recovered",
              tone: "success",
              detail: "Recovered callback remains transport evidence only until Vecells settlement runs.",
              at: new Date(Date.now() + 60000).toISOString(),
            },
          );
          return { ok: true, status: 200, call: clone(call), calls: listCalls() };
        }

        export {
          PACK,
          advanceCall,
          assignNumber,
          getCall,
          health,
          listCalls,
          listNumbers,
          registry,
          releaseNumber,
          retryWebhook,
          simulateCall,
        };
        """
    )


def service_server_js() -> str:
    return textwrap.dedent(
        """\
        import http from "node:http";
        import { URL } from "node:url";

        import {
          PACK,
          advanceCall,
          assignNumber,
          getCall,
          health,
          listCalls,
          listNumbers,
          registry,
          releaseNumber,
          retryWebhook,
          simulateCall,
        } from "./carrierCore.js";

        const HOST = process.env.MOCK_TELEPHONY_HOST ?? "127.0.0.1";
        const PORT = Number(process.env.MOCK_TELEPHONY_PORT ?? "4180");

        function writeJson(response, status, payload) {
          response.writeHead(status, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "content-type",
          });
          response.end(JSON.stringify(payload, null, 2));
        }

        function writeHtml(response, html) {
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
          });
          response.end(html);
        }

        function readBody(request) {
          return new Promise((resolve, reject) => {
            let body = "";
            request.on("data", (chunk) => {
              body += chunk;
              if (body.length > 2_000_000) {
                reject(new Error("Request body too large."));
              }
            });
            request.on("end", () => {
              if (!body.trim()) {
                resolve({});
                return;
              }
              try {
                resolve(JSON.parse(body));
              } catch {
                reject(new Error("Request body must be valid JSON."));
              }
            });
            request.on("error", reject);
          });
        }

        function playgroundHtml() {
          const numberOptions = PACK.number_inventory
            .filter((row) => row.voice_enabled === "yes")
            .map((row) => `<option value="${row.number_id}">${row.number_id} · ${row.e164_or_placeholder}</option>`)
            .join("");
          const scenarioOptions = PACK.call_scenarios
            .map((row) => `<option value="${row.scenario_id}">${row.label}</option>`)
            .join("");
          return `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="data:," />
            <title>Vecells MOCK_TELEPHONY_SANDBOX</title>
            <style>
              :root {
                --canvas: #f5f7fa;
                --panel: #ffffff;
                --text: #1d2939;
                --muted: #667085;
                --line: #d0d5dd;
                --primary: #0b57d0;
                --voice: #7a5af8;
                --secondary: #0e9384;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                color: var(--text);
                font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at top left, rgba(11, 87, 208, 0.12), transparent 30%),
                  radial-gradient(circle at top right, rgba(122, 90, 248, 0.1), transparent 24%),
                  var(--canvas);
              }
              h1, h2, p, pre { margin: 0; }
              button, select {
                font: inherit;
                min-height: 44px;
                border: 1px solid var(--line);
                border-radius: 16px;
                padding: 0 14px;
                background: #fff;
              }
              button { cursor: pointer; }
              .shell {
                max-width: 1440px;
                margin: 0 auto;
                padding: 24px;
              }
              .header, .panel, .event {
                border: 1px solid rgba(208, 213, 221, 0.96);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.94);
                box-shadow: 0 20px 48px rgba(16, 24, 40, 0.08);
              }
              .header {
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
              }
              .brand { display: flex; align-items: center; gap: 14px; }
              .mark {
                width: 44px;
                height: 44px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                color: #fff;
                font-weight: 700;
                background: linear-gradient(135deg, var(--primary), var(--voice));
              }
              .ribbon, .chip {
                display: inline-flex;
                align-items: center;
                min-height: 28px;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 12px;
              }
              .ribbon { color: var(--primary); background: rgba(11, 87, 208, 0.1); }
              .chip { background: rgba(14, 147, 132, 0.1); }
              .layout {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(340px, 420px);
                gap: 20px;
              }
              .panel { padding: 18px; }
              .controls, .facts, .actions { display: flex; gap: 12px; flex-wrap: wrap; }
              .actions { margin-top: 16px; }
              .actions button.primary {
                color: #fff;
                border-color: transparent;
                background: linear-gradient(135deg, var(--primary), #3478ff);
              }
              .event-list { display: grid; gap: 12px; margin-top: 16px; }
              .event {
                padding: 14px;
                background: rgba(239, 242, 246, 0.72);
              }
              .event strong { display: block; margin-bottom: 4px; }
              .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
              pre {
                overflow: auto;
                max-height: 520px;
                padding: 16px;
                border-radius: 18px;
                background: #0f1728;
                color: #dce7f6;
              }
              @media (max-width: 980px) {
                .layout { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <main class="shell" data-testid="telephony-sandbox-shell">
              <header class="header">
                <div class="brand">
                  <div class="mark">V</div>
                  <div>
                    <div class="ribbon">MOCK_TELEPHONY_SANDBOX</div>
                    <h1>Carrier twin sandbox</h1>
                  </div>
                </div>
                <div class="facts" id="health-facts"></div>
              </header>
              <section class="layout">
                <article class="panel">
                  <h2>Simulate a call</h2>
                  <p>Exercise the carrier seam while preserving transport-vs-truth separation.</p>
                  <div class="controls" style="margin-top:16px">
                    <select id="number-id">${numberOptions}</select>
                    <select id="scenario-id">${scenarioOptions}</select>
                  </div>
                  <div class="actions">
                    <button class="primary" data-testid="simulate-button" id="simulate-button">Simulate call</button>
                    <button id="advance-button">Advance lifecycle</button>
                    <button id="retry-button">Retry webhook</button>
                  </div>
                  <div class="event-list" id="call-list"></div>
                </article>
                <aside class="panel">
                  <h2>Selected call</h2>
                  <p class="mono" id="selected-call-id">No call selected</p>
                  <pre data-testid="call-json" id="call-json">Select or simulate a call to inspect it here.</pre>
                </aside>
              </section>
            </main>
            <script type="module">
              const state = { selectedCallId: null, calls: [] };

              async function fetchJson(url, options) {
                const response = await fetch(url, options);
                const payload = await response.json();
                if (!response.ok) {
                  throw new Error(payload.error || "Request failed");
                }
                return payload;
              }

              function renderFacts(health) {
                const facts = document.getElementById("health-facts");
                facts.innerHTML = "";
                [
                  "active calls: " + health.active_calls,
                  "assigned numbers: " + health.assigned_numbers,
                  "webhook alerts: " + health.webhook_alerts,
                ].forEach((text) => {
                  const chip = document.createElement("span");
                  chip.className = "chip";
                  chip.textContent = text;
                  facts.appendChild(chip);
                });
              }

              function renderCallList() {
                const list = document.getElementById("call-list");
                list.innerHTML = "";
                state.calls.forEach((call) => {
                  const card = document.createElement("button");
                  card.type = "button";
                  card.className = "event";
                  card.dataset.callId = call.call_id;
                  card.innerHTML =
                    "<strong>" +
                    call.call_id +
                    '</strong><span class="mono">' +
                    call.status +
                    "</span><p>" +
                    call.summary +
                    "</p>";
                  card.addEventListener("click", () => selectCall(call.call_id));
                  list.appendChild(card);
                });
              }

              function selectCall(callId) {
                state.selectedCallId = callId;
                const call = state.calls.find((row) => row.call_id === callId);
                document.getElementById("selected-call-id").textContent = callId;
                document.getElementById("call-json").textContent = JSON.stringify(call, null, 2);
              }

              async function refreshAll(selectNewest = false) {
                const [health, numberRows, callRows] = await Promise.all([
                  fetchJson("/api/health"),
                  fetchJson("/api/numbers"),
                  fetchJson("/api/calls"),
                ]);
                renderFacts(health);
                state.calls = callRows.calls;
                renderCallList();
                if (selectNewest && state.calls[0]) {
                  selectCall(state.calls[0].call_id);
                } else if (state.selectedCallId) {
                  selectCall(state.selectedCallId);
                }
              }

              document.getElementById("simulate-button").addEventListener("click", async () => {
                const numberId = document.getElementById("number-id").value;
                const scenarioId = document.getElementById("scenario-id").value;
                await fetchJson("/api/calls/simulate", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ number_id: numberId, scenario_id: scenarioId }),
                });
                await refreshAll(true);
              });

              document.getElementById("advance-button").addEventListener("click", async () => {
                if (!state.selectedCallId) {
                  return;
                }
                await fetchJson("/api/calls/" + state.selectedCallId + "/advance", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: "{}",
                });
                await refreshAll(false);
              });

              document.getElementById("retry-button").addEventListener("click", async () => {
                if (!state.selectedCallId) {
                  return;
                }
                await fetchJson("/api/calls/" + state.selectedCallId + "/retry-webhook", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: "{}",
                });
                await refreshAll(false);
              });

              refreshAll(true);
            </script>
          </body>
        </html>`;
        }

        const server = http.createServer(async (request, response) => {
          if (request.method === "OPTIONS") {
            response.writeHead(204, {
              "access-control-allow-origin": "*",
              "access-control-allow-methods": "GET,POST,OPTIONS",
              "access-control-allow-headers": "content-type",
            });
            response.end();
            return;
          }

          const url = new URL(request.url ?? "/", `http://${request.headers.host || `${HOST}:${PORT}`}`);
          try {
            if (request.method === "GET" && url.pathname === "/") {
              writeHtml(response, playgroundHtml());
              return;
            }
            if (request.method === "GET" && url.pathname === "/api/health") {
              writeJson(response, 200, health());
              return;
            }
            if (request.method === "GET" && url.pathname === "/api/registry") {
              writeJson(response, 200, registry());
              return;
            }
            if (request.method === "GET" && url.pathname === "/api/numbers") {
              writeJson(response, 200, { numbers: listNumbers() });
              return;
            }
            if (request.method === "GET" && url.pathname === "/api/calls") {
              writeJson(response, 200, { calls: listCalls() });
              return;
            }
            if (request.method === "GET" && url.pathname.startsWith("/api/calls/")) {
              const callId = url.pathname.split("/").pop();
              const call = getCall(callId);
              if (!call) {
                writeJson(response, 404, { error: "Call not found." });
                return;
              }
              writeJson(response, 200, { call });
              return;
            }
            if (request.method === "POST" && url.pathname === "/api/numbers/assign") {
              const payload = await readBody(request);
              const result = assignNumber(payload);
              writeJson(response, result.status, result.ok ? result : { error: result.error });
              return;
            }
            if (request.method === "POST" && url.pathname === "/api/numbers/release") {
              const payload = await readBody(request);
              const result = releaseNumber(payload);
              writeJson(response, result.status, result.ok ? result : { error: result.error });
              return;
            }
            if (request.method === "POST" && url.pathname === "/api/calls/simulate") {
              const payload = await readBody(request);
              const result = simulateCall(payload);
              writeJson(response, result.status, result.ok ? result : { error: result.error });
              return;
            }
            if (request.method === "POST" && url.pathname.startsWith("/api/calls/") && url.pathname.endsWith("/advance")) {
              const callId = url.pathname.split("/")[3];
              const result = advanceCall(callId);
              writeJson(response, result.status, result.ok ? result : { error: result.error });
              return;
            }
            if (request.method === "POST" && url.pathname.startsWith("/api/calls/") && url.pathname.endsWith("/retry-webhook")) {
              const callId = url.pathname.split("/")[3];
              const result = retryWebhook(callId);
              writeJson(response, result.status, result.ok ? result : { error: result.error });
              return;
            }
            writeJson(response, 404, { error: "Not found." });
          } catch (error) {
            writeJson(response, 500, { error: error instanceof Error ? error.message : "Unexpected error." });
          }
        });

        server.listen(PORT, HOST, () => {
          console.log(`mock-telephony-carrier listening at http://${HOST}:${PORT}`);
        });
        """
    )


def lab_spec_js() -> str:
    return textwrap.dedent(
        """\
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
        );

        export const telephonyLabCoverage = [
          "number switching",
          "IVR flow simulation",
          "recording and continuation inspector",
          "mock vs actual gating",
          "keyboard navigation",
          "reduced motion",
          "responsive behavior",
        ];

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
            process.env.MOCK_TELEPHONY_LAB_URL ??
            "http://127.0.0.1:4181/?telephonyBaseUrl=http://127.0.0.1:4180";

          await page.goto(baseUrl, { waitUntil: "networkidle" });

          await page.locator("[data-testid='telephony-shell']").waitFor();
          await page.locator("[data-testid='number-button-NUM_TEL_DUAL_CONTINUITY']").click();
          await page.locator("text=MOCK:+44-VC-0006").waitFor();

          await page.locator("[data-testid='page-tab-IVR_Flow_Studio']").click();
          await page.locator("[data-testid='scenario-select']").selectOption("urgent_live_preemption");
          await page.locator("[data-testid='simulate-call-button']").click();
          await page.locator("text=urgent live only").waitFor();

          await page.locator("[data-testid='page-tab-Recording_and_Continuation']").click();
          await page.locator("text=Continuation remains bounded").waitFor();

          await page.locator("[data-testid='page-tab-Live_Gates_and_Spend_Controls']").click();
          await page.locator("[data-testid='mode-toggle-actual']").click();
          await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
          await page.locator("[data-testid='actual-field-allow-mutation']").selectOption("false");
          await page.locator("[data-testid='actual-field-allow-spend']").selectOption("false");
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
          await page.locator("[data-testid='number-rail']").waitFor();
          await page.setViewportSize({ width: 390, height: 844 });
          await page.locator("[data-testid='lower-diagram']").waitFor();

          const headings = await page.locator("h1, h2, h3").count();
          if (headings < 10) {
            throw new Error("Accessibility smoke failed: expected multiple headings in the telephony lab.");
          }

          await browser.close();
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const telephonyLabManifest = {
          task: PACK.task_id,
          visualMode: PACK.visual_mode,
          numbers: PACK.summary.number_count,
          scenarios: PACK.summary.scenario_count,
        };
        """
    )


def call_flow_spec_js() -> str:
    return textwrap.dedent(
        """\
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
        );

        export const telephonyCallFlowCoverage = [
          "webhook retry and signature failure",
          "recording-missing blocking",
          "urgent-live flow",
          "carrier sandbox selection and inspection",
        ];

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
          const baseUrl = process.env.MOCK_TELEPHONY_CARRIER_URL ?? "http://127.0.0.1:4180/";

          await page.goto(baseUrl, { waitUntil: "networkidle" });
          await page.locator("[data-testid='telephony-sandbox-shell']").waitFor();

          await page.locator("#scenario-id").selectOption("webhook_signature_retry");
          await page.locator("[data-testid='simulate-button']").click();
          await page.locator("text=webhook_retry_pending").waitFor();
          await page.locator("#retry-button").click();
          await page.locator("text=webhook_dispatch_recovered").waitFor();

          await page.locator("#scenario-id").selectOption("recording_missing_manual_review");
          await page.locator("[data-testid='simulate-button']").click();
          await page.locator("text=manual_audio_review_required").waitFor();

          await page.locator("#scenario-id").selectOption("urgent_live_preemption");
          await page.locator("[data-testid='simulate-button']").click();
          await page.locator("text=urgent_live_only").waitFor();

          await page.locator("#advance-button").click();
          await page.locator("text=closed").waitFor();

          const jsonText = await page.locator("[data-testid='call-json']").textContent();
          if (!jsonText || !jsonText.includes("call_id")) {
            throw new Error("Expected selected call JSON to render in carrier sandbox.");
          }

          await browser.close();
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const telephonyCallFlowManifest = {
          task: PACK.task_id,
          seededCalls: PACK.summary.seeded_call_count,
          webhooks: PACK.summary.webhook_row_count,
        };
        """
    )


def dry_run_harness_js() -> str:
    return textwrap.dedent(
        """\
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const PACK = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
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
            PACK.live_gate_pack.allowed_vendor_ids.includes(process.env.TELEPHONY_VENDOR_ID),
            "Chosen telephony vendor is not on the task 031 shortlist.",
          );
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This harness needs the `playwright` package when run with --run.");
          }
        }

        async function verifyOfficialSource(url, expectedSnippets) {
          const response = await fetch(url, {
            headers: { "user-agent": "vecells-seq032-dry-run" },
          });
          assertCondition(response.ok, `Failed to fetch official source ${url}`);
          const html = await response.text();
          for (const snippet of expectedSnippets) {
            assertCondition(html.includes(snippet), `Official source ${url} no longer contains: ${snippet}`);
          }
        }

        async function verifyOfficialMechanics() {
          for (const entry of Object.values(PACK.live_gate_pack.official_label_checks)) {
            await verifyOfficialSource(entry.url, entry.expected);
          }
        }

        async function run() {
          const targetUrl =
            process.env.MOCK_TELEPHONY_LAB_URL ??
            "http://127.0.0.1:4181/?mode=actual&page=Live_Gates_and_Spend_Controls&telephonyBaseUrl=http://127.0.0.1:4180";
          const selectorProfile = PACK.live_gate_pack.selector_map.base_profile;
          const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

          await verifyOfficialMechanics();

          if (realMutationRequested) {
            validateLiveGateInputs();
          }

          const { chromium } = await importPlaywright();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

          await page.goto(targetUrl, { waitUntil: "networkidle" });
          await page.locator(selectorProfile.mode_toggle_actual).click();
          await page.locator(selectorProfile.page_tab_live_gates).click();
          await page.locator(selectorProfile.field_vendor).selectOption(
            process.env.TELEPHONY_VENDOR_ID ?? "twilio_telephony_ivr",
          );
          await page.locator(selectorProfile.field_approver).fill(
            process.env.TELEPHONY_NAMED_APPROVER ?? "dry-run approver",
          );
          await page.locator(selectorProfile.field_environment).selectOption(
            process.env.TELEPHONY_TARGET_ENVIRONMENT ?? "provider_like_preprod",
          );
          await page.locator(selectorProfile.field_callback_base).fill(
            process.env.TELEPHONY_CALLBACK_BASE_URL ?? "https://example.invalid/telephony",
          );
          await page.locator(selectorProfile.field_recording_policy).selectOption(
            process.env.TELEPHONY_RECORDING_POLICY_REF ?? "rec_default_dual_channel",
          );
          await page.locator(selectorProfile.field_number_profile).selectOption(
            process.env.TELEPHONY_NUMBER_PROFILE_REF ?? "NUM_TEL_PROVIDER_TWILIO",
          );
          await page.locator(selectorProfile.field_spend_cap).fill(
            process.env.TELEPHONY_SPEND_CAP_GBP ?? "25",
          );
          await page.locator(selectorProfile.field_secret_ref).fill(
            process.env.TELEPHONY_WEBHOOK_SECRET_REF ?? "vault://telephony/webhook",
          );
          await page.locator(selectorProfile.field_allow_mutation).selectOption(
            realMutationRequested ? "true" : "false",
          );
          await page.locator(selectorProfile.field_allow_spend).selectOption(
            process.env.ALLOW_SPEND === "true" ? "true" : "false",
          );

          const buttonDisabled = await page.locator(selectorProfile.final_submit).isDisabled();
          assertCondition(
            buttonDisabled,
            "Dry-run posture drifted: real submit must stay disabled while Phase 0 remains withheld.",
          );

          await browser.close();
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const telephonyDryRunManifest = {
          task: PACK.task_id,
          requiredLiveEnv: requiredLiveEnv(),
          allowedVendors: PACK.live_gate_pack.allowed_vendor_ids,
        };
        """
    )


def main() -> None:
    inputs = ensure_inputs()
    field_map = build_field_map()
    pack = build_pack(inputs)
    live_gate_pack = pack["live_gate_pack"]

    write_json(PACK_JSON_PATH, pack)
    write_json(FIELD_MAP_PATH, field_map)
    write_csv(NUMBER_INVENTORY_PATH, NUMBER_ROWS)
    write_csv(WEBHOOK_MATRIX_PATH, WEBHOOK_ROWS)
    write_json(LIVE_GATE_PATH, live_gate_pack)

    write_text(LOCAL_SPEC_DOC_PATH, render_local_spec_doc(pack))
    write_text(FIELD_MAP_DOC_PATH, render_field_map_doc(field_map))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(live_gate_pack))
    write_text(WEBHOOK_DOC_PATH, render_webhook_doc(pack))

    write_text(APP_DIR / "README.md", render_app_readme(pack))
    write_text(APP_DIR / "package.json", app_package_json())
    write_text(APP_DIR / "tsconfig.json", app_tsconfig())
    write_text(APP_DIR / "vite.config.ts", app_vite_config())
    write_text(APP_DIR / "index.html", app_index_html())
    write_text(APP_SRC_DIR / "main.tsx", app_main_tsx())
    write_text(APP_SRC_DIR / "styles.css", app_styles_css())
    write_text(APP_SRC_DIR / "App.tsx", app_tsx())
    write_text(APP_PACK_TS_PATH, ts_export("telephonyLabPack", pack))
    write_json(APP_PACK_JSON_PATH, pack)

    write_text(SERVICE_DIR / "README.md", render_service_readme(pack))
    write_text(SERVICE_DIR / "package.json", service_package_json())
    write_text(SERVICE_SRC_DIR / "carrierCore.js", service_core_js())
    write_text(SERVICE_SRC_DIR / "server.js", service_server_js())

    write_text(TESTS_DIR / "mock-telephony-lab.spec.js", lab_spec_js())
    write_text(TESTS_DIR / "mock-telephony-call-flow.spec.js", call_flow_spec_js())
    write_text(
        BROWSER_AUTOMATION_DIR / "telephony-account-and-number-dry-run.spec.js",
        dry_run_harness_js(),
    )


if __name__ == "__main__":
    main()
