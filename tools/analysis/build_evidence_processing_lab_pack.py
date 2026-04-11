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
APP_DIR = ROOT / "apps" / "mock-evidence-gate-lab"
APP_SRC_DIR = APP_DIR / "src"
APP_PUBLIC_DIR = APP_DIR / "public"

TASK_ID = "seq_035"
CAPTURED_ON = "2026-04-10"
VISUAL_MODE = "Evidence_Gate_Lab"
MISSION = (
    "Create the transcription and malware-scanning provisioning pack with a product-grade "
    "local evidence-processing lab now and a hard-gated real provider project, webhook, "
    "retention, region, and spend strategy later."
)

REQUIRED_INPUTS = {
    "vendor_shortlist": DATA_DIR / "34_vendor_shortlist.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
}

PACK_JSON_PATH = DATA_DIR / "35_evidence_processing_lab_pack.json"
FIELD_MAP_JSON_PATH = DATA_DIR / "35_evidence_processing_field_map.json"
JOB_PROFILE_CSV_PATH = DATA_DIR / "35_transcript_job_profiles.csv"
SCAN_POLICY_CSV_PATH = DATA_DIR / "35_scan_and_quarantine_policy_matrix.csv"
LIVE_GATE_JSON_PATH = DATA_DIR / "35_evidence_processing_live_gate_checklist.json"

LOCAL_SPEC_DOC_PATH = DOCS_DIR / "35_local_evidence_processing_lab_spec.md"
FIELD_MAP_DOC_PATH = DOCS_DIR / "35_transcription_and_scanning_project_field_map.md"
WEBHOOK_DOC_PATH = DOCS_DIR / "35_webhook_retention_and_region_strategy.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "35_live_gate_and_spend_controls.md"

APP_PACK_TS_PATH = APP_SRC_DIR / "generated" / "evidenceGateLabPack.ts"
APP_PACK_JSON_PATH = APP_PUBLIC_DIR / "evidence-gate-lab-pack.json"

APP_PORT = 4202
TRANSCRIPTION_SERVICE_PORT = 4200
SCAN_SERVICE_PORT = 4201

SOURCE_PRECEDENCE = [
    "prompt/035.md",
    "prompt/034.md",
    "prompt/033.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "data/analysis/21_integration_priority_matrix.json",
    "data/analysis/23_external_account_inventory.csv",
    "data/analysis/34_vendor_shortlist.json",
    "data/analysis/provider_family_scorecards.json",
    "data/analysis/phase0_gate_verdict.json",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/34_actual_provider_shortlist_and_due_diligence.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-8-the-assistive-layer.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/forensic-audit-findings.md",
    "https://www.assemblyai.com/docs/deployment/webhooks",
    "https://www.assemblyai.com/docs/pre-recorded-audio/select-the-region",
    "https://www.assemblyai.com/docs/api-reference/transcripts/delete",
    "https://www.assemblyai.com/pricing",
    "https://developers.deepgram.com/docs/managing-projects",
    "https://developers.deepgram.com/docs/create-additional-api-keys",
    "https://developers.deepgram.com/docs/using-callbacks-to-return-transcripts-to-your-server",
    "https://developers.deepgram.com/docs/deployment-options",
    "https://deepgram.com/pricing",
    "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/monitoring-malware-protection-s3-scans-gdu.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/pricing-malware-protection-for-s3-guardduty.html",
    "https://www.opswat.com/docs/mdcloud/integrations/public-apis",
    "https://www.opswat.com/docs/mdcloud/operation/private-scanning-with-metadefender-cloud-apis",
    "https://www.opswat.com/docs/mdcloud/operation/retrieving-scan-results-via-webhooks",
    "https://www.opswat.com/docs/mdcloud/compliance/locations",
    "https://www.opswat.com/docs/mdcloud/account-management/licenses-and-usage-limits",
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
            normalized: dict[str, str] = {}
            for key in fieldnames:
                value = row.get(key, "")
                if isinstance(value, list):
                    normalized[key] = "|".join(str(item) for item in value)
                else:
                    normalized[key] = str(value)
            writer.writerow(normalized)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def dedent(content: str) -> str:
    return textwrap.dedent(content).strip()


def mono_table(headers: list[str], rows: list[list[str]]) -> str:
    divider = "| " + " | ".join(["---"] * len(headers)) + " |"
    output = ["| " + " | ".join(headers) + " |", divider]
    output.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(output)


def load_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    if missing:
        raise SystemExit("Missing seq_035 prerequisites: " + ", ".join(sorted(missing)))
    return {
        "vendor_shortlist": read_json(REQUIRED_INPUTS["vendor_shortlist"]),
        "external_account_inventory": read_csv(REQUIRED_INPUTS["external_account_inventory"]),
        "phase0_gate_verdict": read_json(REQUIRED_INPUTS["phase0_gate_verdict"]),
        "integration_priority_matrix": read_json(REQUIRED_INPUTS["integration_priority_matrix"]),
        "provider_family_scorecards": read_json(REQUIRED_INPUTS["provider_family_scorecards"]),
    }


def official_vendor_guidance() -> list[dict[str, Any]]:
    return [
        {
            "source_id": "assemblyai_webhooks",
            "vendor": "AssemblyAI",
            "provider_family": "transcription",
            "title": "Webhooks",
            "url": "https://www.assemblyai.com/docs/deployment/webhooks",
            "captured_on": CAPTURED_ON,
            "summary": "AssemblyAI supports callbacks with optional webhook-auth headers and retries callbacks for up to 24 hours.",
            "grounding": [
                "Callback delivery is asynchronous and retry-driven.",
                "Webhook authentication is configured with a custom header name and value.",
                "Callback arrival is transport evidence only until Vecells re-fetches and settles the transcript contract.",
            ],
        },
        {
            "source_id": "assemblyai_region_selection",
            "vendor": "AssemblyAI",
            "provider_family": "transcription",
            "title": "Select the EU Region for EU Data Residency",
            "url": "https://www.assemblyai.com/docs/pre-recorded-audio/select-the-region",
            "captured_on": CAPTURED_ON,
            "summary": "AssemblyAI documents explicit region selection for EU processing.",
            "grounding": [
                "Region is an explicit request configuration, not an implied default.",
                "The local pack therefore blocks real project progression without a named region posture.",
            ],
        },
        {
            "source_id": "assemblyai_delete_transcript",
            "vendor": "AssemblyAI",
            "provider_family": "transcription",
            "title": "Delete a transcript",
            "url": "https://www.assemblyai.com/docs/api-reference/transcripts/delete",
            "captured_on": CAPTURED_ON,
            "summary": "AssemblyAI exposes transcript deletion through the API.",
            "grounding": [
                "Deletion is an explicit follow-on operation.",
                "Retention cannot be assumed from job completion alone.",
            ],
        },
        {
            "source_id": "assemblyai_pricing",
            "vendor": "AssemblyAI",
            "provider_family": "transcription",
            "title": "AssemblyAI pricing",
            "url": "https://www.assemblyai.com/pricing",
            "captured_on": CAPTURED_ON,
            "summary": "AssemblyAI prices transcription usage commercially.",
            "grounding": [
                "Real project creation and live traffic are spend-bearing actions.",
                "Spend gates must therefore stay explicit and separate from mutation gates.",
            ],
        },
        {
            "source_id": "deepgram_managing_projects",
            "vendor": "Deepgram",
            "provider_family": "transcription",
            "title": "Managing Projects",
            "url": "https://developers.deepgram.com/docs/managing-projects",
            "captured_on": CAPTURED_ON,
            "summary": "Deepgram treats projects as the workspace boundary for API keys, usage, and configuration.",
            "grounding": [
                "Projects are a first-class account surface.",
                "The live pack models project identifiers as environment-bound evidence, never as canonical truth.",
            ],
        },
        {
            "source_id": "deepgram_api_keys",
            "vendor": "Deepgram",
            "provider_family": "transcription",
            "title": "Create Additional API Keys",
            "url": "https://developers.deepgram.com/docs/create-additional-api-keys",
            "captured_on": CAPTURED_ON,
            "summary": "Deepgram documents project-scoped API key creation.",
            "grounding": [
                "API keys are separable from the base account.",
                "The pack therefore models project and credential ownership independently.",
            ],
        },
        {
            "source_id": "deepgram_callbacks",
            "vendor": "Deepgram",
            "provider_family": "transcription",
            "title": "Using Callbacks to Return Transcripts to Your Server",
            "url": "https://developers.deepgram.com/docs/using-callbacks-to-return-transcripts-to-your-server",
            "captured_on": CAPTURED_ON,
            "summary": "Deepgram supports callback-based result delivery for prerecorded transcription jobs.",
            "grounding": [
                "Callbacks return after job completion and must be treated as hints.",
                "Vecells must re-fetch or reconcile job state before promotion.",
            ],
        },
        {
            "source_id": "deepgram_deployment_options",
            "vendor": "Deepgram",
            "provider_family": "transcription",
            "title": "Deployment Options",
            "url": "https://developers.deepgram.com/docs/deployment-options",
            "captured_on": CAPTURED_ON,
            "summary": "Deepgram offers hosted, on-prem, and private deployment patterns.",
            "grounding": [
                "Deployment model is a real architecture choice, not a cosmetic setting.",
                "The pack records deployment mode so region and retention drift cannot stay implicit.",
            ],
        },
        {
            "source_id": "deepgram_pricing",
            "vendor": "Deepgram",
            "provider_family": "transcription",
            "title": "Deepgram pricing",
            "url": "https://deepgram.com/pricing",
            "captured_on": CAPTURED_ON,
            "summary": "Deepgram publishes commercial pricing for speech-to-text workloads.",
            "grounding": [
                "Live use is billable.",
                "Spend controls are mandatory even when technical readiness is present.",
            ],
        },
        {
            "source_id": "guardduty_enable_plan",
            "vendor": "AWS GuardDuty Malware Protection for S3",
            "provider_family": "artifact_scanning",
            "title": "Enabling Malware Protection for Amazon S3",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
            "captured_on": CAPTURED_ON,
            "summary": "GuardDuty Malware Protection for S3 is configured as a protection plan tied to an S3 bucket scope, IAM role, and optional prefix filters.",
            "grounding": [
                "Storage scope is part of the project boundary.",
                "Prefix filtering is explicit, so the pack blocks real rollout without object-scope declaration.",
            ],
        },
        {
            "source_id": "guardduty_how_it_works",
            "vendor": "AWS GuardDuty Malware Protection for S3",
            "provider_family": "artifact_scanning",
            "title": "How Malware Protection for Amazon S3 works",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html",
            "captured_on": CAPTURED_ON,
            "summary": "GuardDuty scans new objects and writes results through control-plane events and object tagging rather than direct file-return callbacks.",
            "grounding": [
                "Scan completion is not a content-promotion permission by itself.",
                "Event and tag results stay evidence inputs until quarantine law is satisfied.",
            ],
        },
        {
            "source_id": "guardduty_eventbridge",
            "vendor": "AWS GuardDuty Malware Protection for S3",
            "provider_family": "artifact_scanning",
            "title": "Monitoring Malware Protection for S3 with EventBridge",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html",
            "captured_on": CAPTURED_ON,
            "summary": "GuardDuty publishes result states to EventBridge, including no-threat, threats-found, unsupported, and access-failure style outcomes.",
            "grounding": [
                "The result stream is multi-state.",
                "The local lab must preserve unreadable, failed, and quarantined branches rather than flatten to pass or fail.",
            ],
        },
        {
            "source_id": "guardduty_results",
            "vendor": "AWS GuardDuty Malware Protection for S3",
            "provider_family": "artifact_scanning",
            "title": "Monitoring Malware Protection for S3 scan results",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/monitoring-malware-protection-s3-scans-gdu.html",
            "captured_on": CAPTURED_ON,
            "summary": "GuardDuty documents per-object result states and scan metadata.",
            "grounding": [
                "Per-object result states are part of the evidence contract.",
                "The pack keeps those states distinct from downstream usability decisions.",
            ],
        },
        {
            "source_id": "guardduty_pricing",
            "vendor": "AWS GuardDuty Malware Protection for S3",
            "provider_family": "artifact_scanning",
            "title": "Pricing for Malware Protection for Amazon S3",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/pricing-malware-protection-for-s3-guardduty.html",
            "captured_on": CAPTURED_ON,
            "summary": "AWS prices GuardDuty Malware Protection for S3 per object and storage volume processed.",
            "grounding": [
                "Live scan enablement is billable immediately.",
                "Real plan activation remains behind explicit spend approval.",
            ],
        },
        {
            "source_id": "opswat_public_apis",
            "vendor": "OPSWAT MetaDefender Cloud",
            "provider_family": "artifact_scanning",
            "title": "Public APIs",
            "url": "https://www.opswat.com/docs/mdcloud/integrations/public-apis",
            "captured_on": CAPTURED_ON,
            "summary": "MetaDefender Cloud uses API keys tied to registered users and limited call quotas.",
            "grounding": [
                "API key ownership is user or organization scoped.",
                "Quota posture must be recorded alongside mutation controls.",
            ],
        },
        {
            "source_id": "opswat_private_processing",
            "vendor": "OPSWAT MetaDefender Cloud",
            "provider_family": "artifact_scanning",
            "title": "Private Scanning with MetaDefender Cloud APIs",
            "url": "https://www.opswat.com/docs/mdcloud/operation/private-scanning-with-metadefender-cloud-apis",
            "captured_on": CAPTURED_ON,
            "summary": "MetaDefender Cloud supports private processing so uploads are removed after analysis and only the submitting owner can access results.",
            "grounding": [
                "Private processing is an explicit flag, not a default.",
                "The pack blocks live usage until private processing posture is declared.",
            ],
        },
        {
            "source_id": "opswat_webhooks",
            "vendor": "OPSWAT MetaDefender Cloud",
            "provider_family": "artifact_scanning",
            "title": "Retrieving Scan Results Via Webhooks",
            "url": "https://www.opswat.com/docs/mdcloud/operation/retrieving-scan-results-via-webhooks",
            "captured_on": CAPTURED_ON,
            "summary": "MetaDefender Cloud supports a `callbackurl` upload header that posts results after scan completion.",
            "grounding": [
                "Webhook delivery is optional and callback-url driven.",
                "The pack models callback security and retry policy independently from the scan request itself.",
            ],
        },
        {
            "source_id": "opswat_locations",
            "vendor": "OPSWAT MetaDefender Cloud",
            "provider_family": "artifact_scanning",
            "title": "Locations",
            "url": "https://www.opswat.com/docs/mdcloud/compliance/locations",
            "captured_on": CAPTURED_ON,
            "summary": "MetaDefender Cloud publishes named regional endpoints and states that uploaded files stay in the designated server location.",
            "grounding": [
                "Region endpoint selection is explicit and material.",
                "Non-private mode can store uploaded files indefinitely, so retention posture must be frozen before live use.",
            ],
        },
        {
            "source_id": "opswat_usage_limits",
            "vendor": "OPSWAT MetaDefender Cloud",
            "provider_family": "artifact_scanning",
            "title": "Licenses and Usage Limits",
            "url": "https://www.opswat.com/docs/mdcloud/account-management/licenses-and-usage-limits",
            "captured_on": CAPTURED_ON,
            "summary": "MetaDefender Cloud enforces license and usage limits at the individual or organization boundary.",
            "grounding": [
                "Usage quotas are part of the live project model.",
                "The real-later pack therefore includes explicit spend and usage guardrails.",
            ],
        },
    ]


def build_field_rows() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    def add(
        field_id: str,
        provider_family: str,
        provider_targets: list[str],
        surface: str,
        label: str,
        requirement_class: str,
        placeholder: str,
        notes: str,
        source_ref: str,
    ) -> None:
        rows.append(
            {
                "field_id": field_id,
                "provider_family": provider_family,
                "provider_targets": provider_targets,
                "surface": surface,
                "label": label,
                "requirement_class": requirement_class,
                "placeholder": placeholder,
                "notes": notes,
                "source_ref": source_ref,
            }
        )

    shared_transcription = [
        ("FLD_TRANS_VENDOR_ID", "Provider vendor", "required", "assemblyai_transcription", "Shortlisted vendor id."),
        ("FLD_TRANS_PROJECT_SCOPE", "Project scope", "required", "transcript_nonprod_workspace", "Workspace boundary for nonprod transcript jobs."),
        ("FLD_TRANS_ENVIRONMENT", "Environment profile", "required", "provider_like_preprod", "local, preview, or provider-like environment."),
        ("FLD_TRANS_NAMED_APPROVER", "Named approver", "required_for_live", "ROLE_SECURITY_LEAD", "Required before any real mutation."),
        ("FLD_TRANS_WEBHOOK_BASE", "Webhook base URL", "required", "https://example.invalid/transcript", "Base callback URL for result delivery."),
        ("FLD_TRANS_WEBHOOK_SECRET", "Webhook secret ref", "required", "vault://evidence/transcript/webhook", "Secret class or auth-header handle."),
        ("FLD_TRANS_REGION_POLICY", "Region policy ref", "required", "REGION_EU_TRANSCRIPT_ONLY", "Must be explicit before live setup."),
        ("FLD_TRANS_RETENTION_POLICY", "Retention policy ref", "required", "RET_TRANSCRIPT_TRANSIENT_24H", "Controls deletion after assimilation."),
        ("FLD_TRANS_PARTIAL_MODE", "Partial results mode", "required", "enabled", "Partial results stay distinct from ready."),
        ("FLD_TRANS_SPEND_CAP", "Spend-cap reference", "required_for_live", "billing://speech/nonprod", "Named cost guardrail."),
        ("FLD_TRANS_DELETE_CONFIRM", "Delete confirmation sink", "required", "evidence-audit:delete-confirmation", "Deletion proof location."),
    ]
    for field_id, label, requirement_class, placeholder, notes in shared_transcription:
        add(
            field_id,
            "transcription",
            ["assemblyai_transcription", "deepgram_transcription"],
            "shared_transcription",
            label,
            requirement_class,
            placeholder,
            notes,
            "data/analysis/34_vendor_shortlist.json#shortlist_by_family.transcription",
        )

    assemblyai_fields = [
        ("FLD_AAI_API_KEY", "AssemblyAI API key ref", "required_for_live", "vault://assemblyai/api-key", "Account plus key model."),
        ("FLD_AAI_HEADER_NAME", "Webhook auth header name", "required", "x-vecells-assemblyai-auth", "Matches documented webhook-auth header support."),
        ("FLD_AAI_HEADER_VALUE", "Webhook auth header value ref", "required", "vault://assemblyai/webhook-auth", "Header value secret handle."),
        ("FLD_AAI_REGION", "Region selection", "required", "eu", "Explicit EU residency selector."),
        ("FLD_AAI_PRIVATE_MODE", "Private deployment mode", "review_required", "hosted_default", "Private deployment is a later architecture choice."),
        ("FLD_AAI_REDACTION", "Transcript redaction profile", "review_required", "synthetic_only_nonphi", "Avoids provider-side PHI drift during rehearsal."),
        ("FLD_AAI_DELETE_MODE", "Delete-after-assimilation mode", "required", "immediate_after_assimilation", "Deletion call follows successful evidence capture."),
    ]
    for field_id, label, requirement_class, placeholder, notes in assemblyai_fields:
        add(
            field_id,
            "transcription",
            ["assemblyai_transcription"],
            "assemblyai_workspace",
            label,
            requirement_class,
            placeholder,
            notes,
            "https://www.assemblyai.com/docs/deployment/webhooks",
        )

    deepgram_fields = [
        ("FLD_DG_PROJECT_ID", "Deepgram project id", "required_for_live", "dg-project-placeholder", "Project-scoped boundary."),
        ("FLD_DG_API_KEY", "Deepgram API key ref", "required_for_live", "vault://deepgram/api-key", "Project-scoped credential."),
        ("FLD_DG_API_SCOPE", "API key scope", "required", "listen:write", "Keep least privilege explicit."),
        ("FLD_DG_CALLBACK_URL", "Callback URL", "required", "https://example.invalid/deepgram/callback", "Deepgram prerecorded callback target."),
        ("FLD_DG_CALLBACK_SECRET", "Callback secret ref", "review_required", "vault://deepgram/callback", "Vecells-side callback fence."),
        ("FLD_DG_DEPLOYMENT_MODE", "Deployment mode", "required", "hosted_cloud", "Hosted, private, or self-hosted posture."),
        ("FLD_DG_RESIDENCY_MODE", "Residency mode", "required", "eu_contractual_path", "Named residency and deployment posture."),
        ("FLD_DG_USAGE_NOTIFY", "Usage-notification sink", "review_required", "alerts://speech-spend", "Spend threshold notifications."),
    ]
    for field_id, label, requirement_class, placeholder, notes in deepgram_fields:
        add(
            field_id,
            "transcription",
            ["deepgram_transcription"],
            "deepgram_workspace",
            label,
            requirement_class,
            placeholder,
            notes,
            "https://developers.deepgram.com/docs/managing-projects",
        )

    shared_scanning = [
        ("FLD_SCAN_VENDOR_ID", "Scan vendor", "required", "aws_guardduty_s3_scan", "Shortlisted scan provider id."),
        ("FLD_SCAN_PROJECT_SCOPE", "Scan project scope", "required", "scan_nonprod_workspace", "Environment-specific scan boundary."),
        ("FLD_SCAN_BUCKET_REF", "Storage bucket ref", "required", "s3://vecells-evidence-nonprod", "Object storage boundary."),
        ("FLD_SCAN_PREFIX_SCOPE", "Object prefix scope", "required", "incoming/evidence/", "Least-privilege object path."),
        ("FLD_SCAN_REGION_POLICY", "Region policy ref", "required", "REGION_AWS_EU_SCAN_PLAN", "Explicit regional processing rule."),
        ("FLD_SCAN_RETENTION_POLICY", "Retention policy ref", "required", "RET_QUARANTINE_14D", "Quarantine evidence retention policy."),
        ("FLD_SCAN_QUARANTINE_POLICY", "Quarantine policy ref", "required", "QUARANTINE_HOLD_UNTIL_CLEAN", "Canonical quarantine behavior."),
        ("FLD_SCAN_CALLBACK_BASE", "Scan callback base URL", "required", "https://example.invalid/scan", "Callback or event ingestion surface."),
        ("FLD_SCAN_CALLBACK_SECRET", "Scan callback secret ref", "required", "vault://scan/webhook", "Callback authenticity material."),
        ("FLD_SCAN_NAMED_APPROVER", "Named approver", "required_for_live", "ROLE_SECURITY_LEAD", "Human approval boundary."),
        ("FLD_SCAN_SPEND_CAP", "Spend-cap reference", "required_for_live", "billing://scan/nonprod", "Spend guardrail."),
    ]
    for field_id, label, requirement_class, placeholder, notes in shared_scanning:
        add(
            field_id,
            "artifact_scanning",
            ["aws_guardduty_s3_scan", "opswat_metadefender_cloud"],
            "shared_scanning",
            label,
            requirement_class,
            placeholder,
            notes,
            "data/analysis/34_vendor_shortlist.json#shortlist_by_family.artifact_scanning",
        )

    guardduty_fields = [
        ("FLD_GD_ACCOUNT_ID", "AWS account id", "required_for_live", "111111111111", "GuardDuty plan owner account."),
        ("FLD_GD_PLAN_NAME", "Protection plan name", "required", "vecells-nonprod-evidence", "Per-bucket protection plan label."),
        ("FLD_GD_IAM_ROLE", "IAM role ref", "required", "iam://guardduty-s3-malware-role", "Role granting scan access."),
        ("FLD_GD_EVENTBUS", "EventBridge bus ref", "required", "eventbridge://vecells-evidence", "Result ingestion bus."),
        ("FLD_GD_TAG_PREFIX", "Result tag prefix", "required", "guardduty:malware-protection", "Tag namespace for downstream reads."),
        ("FLD_GD_FINDING_SINK", "Finding export sink", "review_required", "audit://guardduty-findings", "Audit stream for findings."),
    ]
    for field_id, label, requirement_class, placeholder, notes in guardduty_fields:
        add(
            field_id,
            "artifact_scanning",
            ["aws_guardduty_s3_scan"],
            "guardduty_plan",
            label,
            requirement_class,
            placeholder,
            notes,
            "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
        )

    opswat_fields = [
        ("FLD_MD_API_KEY", "MetaDefender Cloud API key ref", "required_for_live", "vault://opswat/api-key", "API key handle."),
        ("FLD_MD_ORG_REF", "Organization or sub-org ref", "review_required", "opswat-org://vecells", "Quota and RBAC boundary."),
        ("FLD_MD_REGION_ENDPOINT", "Region endpoint", "required", "https://api-prod-eucentral1.metadefender.com", "Explicit EU endpoint."),
        ("FLD_MD_PRIVATE_PROCESSING", "Private processing flag", "required", "true", "Prevents indefinite retained uploads."),
        ("FLD_MD_CALLBACK_URL", "callbackurl header value", "required", "https://example.invalid/opswat/callback", "Async result endpoint."),
        ("FLD_MD_IP_ALLOWLIST", "IP allowlist profile", "review_required", "cidr://provider-ingest", "Optional IP allowlisting boundary."),
    ]
    for field_id, label, requirement_class, placeholder, notes in opswat_fields:
        add(
            field_id,
            "artifact_scanning",
            ["opswat_metadefender_cloud"],
            "opswat_workspace",
            label,
            requirement_class,
            placeholder,
            notes,
            "https://www.opswat.com/docs/mdcloud/operation/private-scanning-with-metadefender-cloud-apis",
        )

    return rows


def build_region_policies() -> list[dict[str, Any]]:
    return [
        {
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "label": "Local-only simulator region",
            "applies_to": ["transcription", "artifact_scanning"],
            "environment_profiles": ["local", "preview"],
            "allowed_vendor_ids": ["vecells_transcript_readiness_twin", "vecells_artifact_quarantine_twin"],
            "operator_rule": "No external provider traffic; all assets stay local to the workstation or development host.",
            "notes": "Default mock lane during seq_035 execution.",
        },
        {
            "region_policy_ref": "REGION_EU_TRANSCRIPT_ONLY",
            "label": "Explicit EU transcript processing",
            "applies_to": ["transcription"],
            "environment_profiles": ["provider_like_preprod", "actual_later"],
            "allowed_vendor_ids": ["assemblyai_transcription", "deepgram_transcription"],
            "operator_rule": "Real transcript jobs may run only when the provider project is explicitly fixed to an EU-compatible posture.",
            "notes": "AssemblyAI and Deepgram both require an explicit residency declaration in the pack.",
        },
        {
            "region_policy_ref": "REGION_AWS_EU_SCAN_PLAN",
            "label": "AWS EU bucket and event path",
            "applies_to": ["artifact_scanning"],
            "environment_profiles": ["provider_like_preprod", "actual_later"],
            "allowed_vendor_ids": ["aws_guardduty_s3_scan"],
            "operator_rule": "GuardDuty protection plans must be attached only to EU-resident buckets aligned to the target trust zone.",
            "notes": "Bucket scope and prefix scope are part of the plan contract.",
        },
        {
            "region_policy_ref": "REGION_OPSWAT_FORCED_EU",
            "label": "Forced EU MetaDefender endpoint",
            "applies_to": ["artifact_scanning"],
            "environment_profiles": ["provider_like_preprod", "actual_later"],
            "allowed_vendor_ids": ["opswat_metadefender_cloud"],
            "operator_rule": "Use the EU Central API endpoint and block non-private processing for any patient-adjacent file.",
            "notes": "MetaDefender Cloud can force a specific regional endpoint.",
        },
    ]


def build_retention_policies() -> list[dict[str, Any]]:
    return [
        {
            "retention_policy_ref": "RET_TRANSCRIPT_TRANSIENT_24H",
            "label": "Transient transcript payloads",
            "artifact_family": "transcript_payload",
            "retention_window": "24h",
            "deletion_trigger": "after_assimilation_or_failure_close",
            "notes": "Provider-held transcript payloads are deleted after local evidence assimilation or failed-job closure.",
        },
        {
            "retention_policy_ref": "RET_TRANSCRIPT_REDACTED_7D",
            "label": "Redacted transcript review bundle",
            "artifact_family": "redacted_transcript_projection",
            "retention_window": "7d",
            "deletion_trigger": "manual_review_close",
            "notes": "Redacted review material is kept only for bounded fallback review.",
        },
        {
            "retention_policy_ref": "RET_SCAN_TAGS_30D",
            "label": "Scan result tags and callback envelopes",
            "artifact_family": "scan_result_envelope",
            "retention_window": "30d",
            "deletion_trigger": "audit_window_elapsed",
            "notes": "Control-plane proof is retained longer than raw files.",
        },
        {
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "label": "Quarantined artifacts",
            "artifact_family": "quarantined_artifact",
            "retention_window": "14d",
            "deletion_trigger": "manual_release_or_destroy",
            "notes": "Unreadable, suspicious, and failed-scan items remain quarantined until an explicit operator action completes.",
        },
    ]


def build_quarantine_policies() -> list[dict[str, Any]]:
    return [
        {
            "quarantine_policy_ref": "QUARANTINE_HOLD_UNTIL_CLEAN",
            "label": "Hold until clean verdict",
            "trigger_states": ["queued", "scanning", "clean_pending_confirmation"],
            "release_rule": "release only after clean scan plus policy match",
        },
        {
            "quarantine_policy_ref": "QUARANTINE_SUSPICIOUS_MANUAL",
            "label": "Suspicious requires manual review",
            "trigger_states": ["suspicious", "heuristic_hit"],
            "release_rule": "manual review can release or destroy, never auto-pass",
        },
        {
            "quarantine_policy_ref": "QUARANTINE_UNREADABLE_REACQUIRE",
            "label": "Unreadable requires reacquire",
            "trigger_states": ["unreadable", "unsupported_format"],
            "release_rule": "request reacquire or alternate evidence path",
        },
        {
            "quarantine_policy_ref": "QUARANTINE_SCAN_FAILURE_ESCALATE",
            "label": "Scan failure escalates",
            "trigger_states": ["failed", "callback_missing", "region_mismatch"],
            "release_rule": "escalate and keep blocked until operator closes",
        },
        {
            "quarantine_policy_ref": "QUARANTINE_SUPERSEDED_EVIDENCE_REBIND",
            "label": "Superseded transcript requires rebind",
            "trigger_states": ["superseded"],
            "release_rule": "replacement transcript must be bound before any readiness promotion",
        },
    ]


def build_webhook_profiles() -> list[dict[str, Any]]:
    return [
        {
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_ASSEMBLYAI",
            "provider_family": "transcription",
            "provider_candidates": ["assemblyai_transcription"],
            "transport_model": "https_callback",
            "auth_model": "custom_header_name_value",
            "retry_model": "provider_retry_plus_trusted_refetch",
            "notes": "AssemblyAI retries callback delivery for up to 24 hours.",
        },
        {
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_DEEPGRAM",
            "provider_family": "transcription",
            "provider_candidates": ["deepgram_transcription"],
            "transport_model": "https_callback",
            "auth_model": "vecells_refetch_and_endpoint_control",
            "retry_model": "provider_callback_hint_plus_state_refetch",
            "notes": "Deepgram callbacks are hints and must be reconciled with fetched job state.",
        },
        {
            "webhook_profile_ref": "WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE",
            "provider_family": "artifact_scanning",
            "provider_candidates": ["aws_guardduty_s3_scan"],
            "transport_model": "eventbridge_event",
            "auth_model": "aws_control_plane",
            "retry_model": "event_delivery_plus_object_refetch",
            "notes": "GuardDuty results are consumed from EventBridge and object metadata, not raw file callbacks.",
        },
        {
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "provider_family": "artifact_scanning",
            "provider_candidates": ["opswat_metadefender_cloud"],
            "transport_model": "callbackurl_post",
            "auth_model": "callbackurl_plus_vecells_ingest_secret",
            "retry_model": "provider_post_or_poll_refetch",
            "notes": "MetaDefender Cloud can post results to a caller-specified callback URL.",
        },
    ]


def build_job_profiles() -> list[dict[str, Any]]:
    return [
        {
            "job_profile_id": "JOB_TRANS_VOICE_CALLBACK_LOCAL",
            "profile_label": "Voice callback, local rehearsal",
            "provider_family": "transcription",
            "environment": "local",
            "input_class": "voice_recording_wav",
            "output_state_family": "queued|partial|ready|failed|superseded",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_ASSEMBLYAI",
            "retention_policy_ref": "RET_TRANSCRIPT_TRANSIENT_24H",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "quarantine_policy_ref": "QUARANTINE_HOLD_UNTIL_CLEAN",
            "mock_now_use": "Exercise partial transcript readiness after clean artifact admission.",
            "actual_later_use": "Maps to a real nonprod project with explicit webhook and deletion posture.",
            "notes": "Local default for callback transcript rehearsal.",
        },
        {
            "job_profile_id": "JOB_TRANS_VOICE_CALLBACK_PROVIDER_PREVIEW",
            "profile_label": "Voice callback, provider-like preview",
            "provider_family": "transcription",
            "environment": "provider_like_preprod",
            "input_class": "voice_recording_m4a",
            "output_state_family": "queued|partial|ready|failed|superseded",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_DEEPGRAM",
            "retention_policy_ref": "RET_TRANSCRIPT_TRANSIENT_24H",
            "region_policy_ref": "REGION_EU_TRANSCRIPT_ONLY",
            "quarantine_policy_ref": "QUARANTINE_HOLD_UNTIL_CLEAN",
            "mock_now_use": "Validate explicit residency and callback-hint semantics.",
            "actual_later_use": "Becomes the real provider-like staging workspace.",
            "notes": "Provider-like preview does not permit real mutation during seq_035.",
        },
        {
            "job_profile_id": "JOB_TRANS_ATTACHMENT_AUDIO_PORTAL",
            "profile_label": "Portal audio attachment",
            "provider_family": "transcription",
            "environment": "preview",
            "input_class": "portal_audio_attachment",
            "output_state_family": "queued|partial|ready|failed|superseded",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_ASSEMBLYAI",
            "retention_policy_ref": "RET_TRANSCRIPT_REDACTED_7D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "quarantine_policy_ref": "QUARANTINE_SUSPICIOUS_MANUAL",
            "mock_now_use": "Exercise portal-upload transcript review without implying usable evidence.",
            "actual_later_use": "Can map to later provider ingestion after scan and quarantine pass.",
            "notes": "Transcript completion remains weaker than evidence usability.",
        },
        {
            "job_profile_id": "JOB_TRANS_RETRANSCRIBE_SUPERSEDE",
            "profile_label": "Manual re-transcribe and supersede",
            "provider_family": "transcription",
            "environment": "local",
            "input_class": "operator_selected_audio",
            "output_state_family": "queued|partial|ready|failed|superseded",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_DEEPGRAM",
            "retention_policy_ref": "RET_TRANSCRIPT_REDACTED_7D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "quarantine_policy_ref": "QUARANTINE_SUPERSEDED_EVIDENCE_REBIND",
            "mock_now_use": "Prove supersession and replacement transcript binding.",
            "actual_later_use": "Models operator-driven retry after poor transcript quality.",
            "notes": "Superseded transcript must not continue to drive readiness.",
        },
        {
            "job_profile_id": "JOB_TRANS_SCAN_DEPENDENT_HOLD",
            "profile_label": "Transcript held on scan posture",
            "provider_family": "transcription",
            "environment": "provider_like_preprod",
            "input_class": "artifact_extracted_audio",
            "output_state_family": "queued|partial|ready|failed|superseded",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_ASSEMBLYAI",
            "retention_policy_ref": "RET_TRANSCRIPT_TRANSIENT_24H",
            "region_policy_ref": "REGION_EU_TRANSCRIPT_ONLY",
            "quarantine_policy_ref": "QUARANTINE_SUSPICIOUS_MANUAL",
            "mock_now_use": "Force transcript readiness to wait on scan verdict and fallback review.",
            "actual_later_use": "Maps to production evidence gate for patient-submitted audio.",
            "notes": "A clean transcript cannot overrule a bad or unreadable scan branch.",
        },
        {
            "job_profile_id": "JOB_SCAN_PORTAL_UPLOAD_CLEAN",
            "profile_label": "Portal upload, expected clean",
            "provider_family": "artifact_scanning",
            "environment": "local",
            "input_class": "portal_document_pdf",
            "output_state_family": "clean|suspicious|quarantined|unreadable|failed",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "quarantine_policy_ref": "QUARANTINE_HOLD_UNTIL_CLEAN",
            "mock_now_use": "Exercise clean path without collapsing quarantine release law.",
            "actual_later_use": "Can map to cloud scan API or object-event scanning later.",
            "notes": "Clean does not equal clinically usable.",
        },
        {
            "job_profile_id": "JOB_SCAN_PORTAL_UPLOAD_SUSPICIOUS",
            "profile_label": "Portal upload, suspicious branch",
            "provider_family": "artifact_scanning",
            "environment": "preview",
            "input_class": "portal_image_attachment",
            "output_state_family": "clean|suspicious|quarantined|unreadable|failed",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "quarantine_policy_ref": "QUARANTINE_SUSPICIOUS_MANUAL",
            "mock_now_use": "Show operator hold and review flows.",
            "actual_later_use": "Models suspicious verdict handling for real file providers.",
            "notes": "Suspicious evidence must stay held.",
        },
        {
            "job_profile_id": "JOB_SCAN_PORTAL_UPLOAD_QUARANTINE",
            "profile_label": "Portal upload, quarantined",
            "provider_family": "artifact_scanning",
            "environment": "provider_like_preprod",
            "input_class": "patient_attachment_archive",
            "output_state_family": "clean|suspicious|quarantined|unreadable|failed",
            "webhook_profile_ref": "WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_AWS_EU_SCAN_PLAN",
            "quarantine_policy_ref": "QUARANTINE_HOLD_UNTIL_CLEAN",
            "mock_now_use": "Exercise object-scope and eventbridge-style ingestion law.",
            "actual_later_use": "Maps to GuardDuty S3 protection plans later.",
            "notes": "Real plan enablement remains gated and billable.",
        },
        {
            "job_profile_id": "JOB_SCAN_UNREADABLE_REACQUIRE",
            "profile_label": "Unreadable or unsupported artifact",
            "provider_family": "artifact_scanning",
            "environment": "local",
            "input_class": "corrupt_attachment_blob",
            "output_state_family": "clean|suspicious|quarantined|unreadable|failed",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "quarantine_policy_ref": "QUARANTINE_UNREADABLE_REACQUIRE",
            "mock_now_use": "Exercise unreadable evidence and reacquire fallback.",
            "actual_later_use": "Maps to later file-scan provider error-handling.",
            "notes": "Unreadable is distinct from failed and suspicious.",
        },
        {
            "job_profile_id": "JOB_SCAN_STORAGE_BUCKET_PROVIDER_LIKE",
            "profile_label": "Bucket-backed scan, provider-like",
            "provider_family": "artifact_scanning",
            "environment": "provider_like_preprod",
            "input_class": "s3_object_event",
            "output_state_family": "clean|suspicious|quarantined|unreadable|failed",
            "webhook_profile_ref": "WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE",
            "retention_policy_ref": "RET_SCAN_TAGS_30D",
            "region_policy_ref": "REGION_AWS_EU_SCAN_PLAN",
            "quarantine_policy_ref": "QUARANTINE_SCAN_FAILURE_ESCALATE",
            "mock_now_use": "Simulate object-event scanning with result tags and fallback hold.",
            "actual_later_use": "Becomes the real S3-backed protection-plan path.",
            "notes": "Storage plan and event bus are first-class contract fields.",
        },
    ]


def build_scan_policy_rows() -> list[dict[str, Any]]:
    return [
        {
            "policy_row_id": "SCAN_POLICY_CLEAN_LOCAL",
            "provider_family": "artifact_scanning",
            "environment": "local",
            "scan_policy_ref": "POLICY_CLEAN_LOCAL",
            "verdict_state": "clean",
            "quarantine_action": "hold_until_release_check",
            "fallback_review_action": "not_required",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_SCAN_TAGS_30D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "notes": "Even clean verdicts wait for release and evidence binding.",
        },
        {
            "policy_row_id": "SCAN_POLICY_SUSPICIOUS_HOLD",
            "provider_family": "artifact_scanning",
            "environment": "preview",
            "scan_policy_ref": "POLICY_SUSPICIOUS_REVIEW",
            "verdict_state": "suspicious",
            "quarantine_action": "manual_review_hold",
            "fallback_review_action": "security_review_required",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "notes": "Suspicious files stay blocked until an operator decides.",
        },
        {
            "policy_row_id": "SCAN_POLICY_QUARANTINED_BUCKET",
            "provider_family": "artifact_scanning",
            "environment": "provider_like_preprod",
            "scan_policy_ref": "POLICY_GUARDDUTY_BUCKET_HOLD",
            "verdict_state": "quarantined",
            "quarantine_action": "keep_in_bucket_quarantine",
            "fallback_review_action": "operator_release_or_destroy",
            "webhook_profile_ref": "WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_AWS_EU_SCAN_PLAN",
            "notes": "GuardDuty-style event plus tag flow.",
        },
        {
            "policy_row_id": "SCAN_POLICY_UNREADABLE_RETRY",
            "provider_family": "artifact_scanning",
            "environment": "local",
            "scan_policy_ref": "POLICY_UNREADABLE_REACQUIRE",
            "verdict_state": "unreadable",
            "quarantine_action": "stay_blocked",
            "fallback_review_action": "request_reacquire",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "notes": "Unreadable evidence stays distinct from hard failure.",
        },
        {
            "policy_row_id": "SCAN_POLICY_FAILED_ESCALATE",
            "provider_family": "artifact_scanning",
            "environment": "provider_like_preprod",
            "scan_policy_ref": "POLICY_FAILED_ESCALATE",
            "verdict_state": "failed",
            "quarantine_action": "block_and_raise_alert",
            "fallback_review_action": "manual_triage_required",
            "webhook_profile_ref": "WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE",
            "retention_policy_ref": "RET_SCAN_TAGS_30D",
            "region_policy_ref": "REGION_AWS_EU_SCAN_PLAN",
            "notes": "Failure never counts as implicit pass-through.",
        },
        {
            "policy_row_id": "SCAN_POLICY_OPSWAT_PRIVATE_ONLY",
            "provider_family": "artifact_scanning",
            "environment": "actual_later",
            "scan_policy_ref": "POLICY_PRIVATE_PROCESSING_ONLY",
            "verdict_state": "clean",
            "quarantine_action": "hold_until_private_processing_verified",
            "fallback_review_action": "security_review_required",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_QUARANTINE_14D",
            "region_policy_ref": "REGION_OPSWAT_FORCED_EU",
            "notes": "Blocks live MetaDefender use without private processing.",
        },
        {
            "policy_row_id": "SCAN_POLICY_CALLBACK_UNSIGNED",
            "provider_family": "artifact_scanning",
            "environment": "preview",
            "scan_policy_ref": "POLICY_CALLBACK_UNSIGNED",
            "verdict_state": "failed",
            "quarantine_action": "hold_and_refetch",
            "fallback_review_action": "webhook_retry_required",
            "webhook_profile_ref": "WEBHOOK_SCAN_OPSWAT_CALLBACK",
            "retention_policy_ref": "RET_SCAN_TAGS_30D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "notes": "Unsigned callback remains only a hint.",
        },
        {
            "policy_row_id": "SCAN_POLICY_REGION_MISMATCH",
            "provider_family": "artifact_scanning",
            "environment": "actual_later",
            "scan_policy_ref": "POLICY_REGION_MISMATCH",
            "verdict_state": "failed",
            "quarantine_action": "block_live_setup",
            "fallback_review_action": "architecture_review_required",
            "webhook_profile_ref": "WEBHOOK_SCAN_GUARDDUTY_EVENTBRIDGE",
            "retention_policy_ref": "RET_SCAN_TAGS_30D",
            "region_policy_ref": "REGION_AWS_EU_SCAN_PLAN",
            "notes": "Prevents cross-region rollout drift.",
        },
        {
            "policy_row_id": "TRANS_POLICY_PARTIAL_NEVER_SETTLE",
            "provider_family": "transcription",
            "environment": "local",
            "scan_policy_ref": "POLICY_PARTIAL_TRANSCRIPT_HOLD",
            "verdict_state": "partial",
            "quarantine_action": "retain_higher_level_hold",
            "fallback_review_action": "await_ready_or_manual_review",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_ASSEMBLYAI",
            "retention_policy_ref": "RET_TRANSCRIPT_TRANSIENT_24H",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "notes": "Partial transcript output cannot settle evidence usability.",
        },
        {
            "policy_row_id": "TRANS_POLICY_FAILED_RETRY",
            "provider_family": "transcription",
            "environment": "provider_like_preprod",
            "scan_policy_ref": "POLICY_TRANSCRIPT_FAILED_RETRY",
            "verdict_state": "failed",
            "quarantine_action": "hold_until_recovery",
            "fallback_review_action": "manual_retry_or_callback_fallback",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_DEEPGRAM",
            "retention_policy_ref": "RET_TRANSCRIPT_REDACTED_7D",
            "region_policy_ref": "REGION_EU_TRANSCRIPT_ONLY",
            "notes": "Failed transcription does not close the evidence branch.",
        },
        {
            "policy_row_id": "TRANS_POLICY_SUPERSEDED_REBIND",
            "provider_family": "transcription",
            "environment": "local",
            "scan_policy_ref": "POLICY_SUPERSEDED_REBIND",
            "verdict_state": "superseded",
            "quarantine_action": "retain_previous_hold",
            "fallback_review_action": "replacement_binding_required",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_DEEPGRAM",
            "retention_policy_ref": "RET_TRANSCRIPT_REDACTED_7D",
            "region_policy_ref": "REGION_MOCK_LOCAL_ONLY",
            "notes": "Superseded jobs cannot keep downstream readiness alive.",
        },
        {
            "policy_row_id": "TRANS_POLICY_WEBHOOK_RETRY",
            "provider_family": "transcription",
            "environment": "provider_like_preprod",
            "scan_policy_ref": "POLICY_TRANSCRIPT_WEBHOOK_RETRY",
            "verdict_state": "ready",
            "quarantine_action": "hold_until_signature_validated",
            "fallback_review_action": "retry_and_refetch",
            "webhook_profile_ref": "WEBHOOK_TRANSCRIPT_ASSEMBLYAI",
            "retention_policy_ref": "RET_TRANSCRIPT_TRANSIENT_24H",
            "region_policy_ref": "REGION_EU_TRANSCRIPT_ONLY",
            "notes": "Ready transcript is still blocked while webhook authenticity is unresolved.",
        },
    ]


def timeline_event_templates(
    rows: list[tuple[str, str, str, str, int]]
) -> list[dict[str, Any]]:
    return [
        {
            "state": state,
            "label": label,
            "tone": tone,
            "detail": detail,
            "offset_minutes": offset,
        }
        for state, label, tone, detail, offset in rows
    ]


def build_transcript_scenarios() -> list[dict[str, Any]]:
    return [
        {
            "scenario_id": "transcript_partial_ready",
            "label": "Partial then ready",
            "transcript_state": "ready",
            "readiness_state": "review_gate_open",
            "fallback_review_state": "not_required",
            "webhook_signature_state": "validated",
            "quality_band": "high",
            "coverage_class": "full_capture",
            "summary": "Transcript streams through partial results and lands ready, but still waits on evidence promotion.",
            "can_retry_webhook": False,
            "can_supersede": False,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "job accepted", "neutral", "Audio accepted into the transcript queue.", 0),
                    ("partial", "partial transcript available", "good", "Partial text is present but not yet admissible.", 1),
                    ("ready", "transcript complete", "good", "Provider marks the transcript complete.", 3),
                    ("review_gate_open", "evidence readiness still gated", "neutral", "Vecells still requires evidence binding and policy checks.", 4),
                ]
            ),
            "retry_timeline_templates": [],
            "supersede_timeline_templates": [],
        },
        {
            "scenario_id": "transcript_failed_retry",
            "label": "Failed, retry needed",
            "transcript_state": "failed",
            "readiness_state": "fallback_required",
            "fallback_review_state": "manual_retry_required",
            "webhook_signature_state": "validated",
            "quality_band": "none",
            "coverage_class": "missing",
            "summary": "Transcript processing fails and shifts the branch into bounded fallback review.",
            "can_retry_webhook": False,
            "can_supersede": False,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "job accepted", "neutral", "Job created for transcription.", 0),
                    ("processing", "provider processing", "neutral", "Provider attempts transcription.", 2),
                    ("failed", "transcript failed", "danger", "No usable transcript returned.", 5),
                    ("fallback_required", "fallback review required", "danger", "Evidence branch remains unresolved and review is mandatory.", 6),
                ]
            ),
            "retry_timeline_templates": [],
            "supersede_timeline_templates": [],
        },
        {
            "scenario_id": "transcript_superseded_replacement",
            "label": "Superseded by replacement",
            "transcript_state": "partial",
            "readiness_state": "hold_for_supersession",
            "fallback_review_state": "manual_rebind_required",
            "webhook_signature_state": "validated",
            "quality_band": "low",
            "coverage_class": "partial_capture",
            "summary": "A weak transcript remains in hold until an operator supersedes it with a replacement run.",
            "can_retry_webhook": False,
            "can_supersede": True,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "job accepted", "neutral", "Initial transcript job created.", 0),
                    ("partial", "low-confidence partial", "warn", "Transcript quality is insufficient for safe progression.", 2),
                    ("hold_for_supersession", "supersession hold", "warn", "Operator must create a replacement transcript.", 4),
                ]
            ),
            "retry_timeline_templates": [],
            "supersede_timeline_templates": timeline_event_templates(
                [
                    ("superseded", "job superseded", "warn", "Original transcript can no longer drive readiness.", 0),
                    ("replacement_requested", "replacement transcript requested", "good", "A new transcript run must replace the old binding.", 1),
                ]
            ),
        },
        {
            "scenario_id": "transcript_signature_retry",
            "label": "Ready transcript, unsigned callback",
            "transcript_state": "ready",
            "readiness_state": "hold_for_signature",
            "fallback_review_state": "not_required",
            "webhook_signature_state": "signature_failed",
            "quality_band": "high",
            "coverage_class": "full_capture",
            "summary": "Provider says the transcript is ready, but the callback authenticity failed and the branch stays held.",
            "can_retry_webhook": True,
            "can_supersede": False,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "job accepted", "neutral", "Transcript job accepted.", 0),
                    ("ready", "provider reports ready", "good", "Transcript payload looks complete.", 2),
                    ("signature_failed", "callback signature failed", "danger", "Callback trust failed; do not promote the result.", 3),
                ]
            ),
            "retry_timeline_templates": timeline_event_templates(
                [
                    ("validated", "webhook signature validated", "good", "Retry path re-established authenticity and re-fetch succeeded.", 0),
                    ("review_gate_open", "review gate reopened", "good", "Transcript is now admissible for the next evidence check.", 1),
                ]
            ),
            "supersede_timeline_templates": [],
        },
        {
            "scenario_id": "transcript_review_hold",
            "label": "Transcript complete, evidence still review-held",
            "transcript_state": "ready",
            "readiness_state": "manual_review_hold",
            "fallback_review_state": "manual_review_open",
            "webhook_signature_state": "validated",
            "quality_band": "medium",
            "coverage_class": "full_capture",
            "summary": "Transcript is available but the evidence branch remains held because the related scan branch has not cleared.",
            "can_retry_webhook": False,
            "can_supersede": False,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "job accepted", "neutral", "Transcript job accepted.", 0),
                    ("ready", "transcript ready", "good", "Transcript content is complete.", 3),
                    ("manual_review_hold", "manual review hold", "warn", "Cross-branch evidence checks still block progression.", 4),
                ]
            ),
            "retry_timeline_templates": [],
            "supersede_timeline_templates": [],
        },
    ]


def build_scan_scenarios() -> list[dict[str, Any]]:
    return [
        {
            "scenario_id": "scan_clean_pass",
            "label": "Clean verdict, pending release",
            "scan_state": "clean",
            "quarantine_state": "held_pending_release",
            "fallback_review_state": "not_required",
            "webhook_signature_state": "validated",
            "confidence_band": "high",
            "release_decision_state": "release_pending",
            "summary": "Scan is clean but the artifact stays held until release checks complete.",
            "can_retry_webhook": False,
            "can_review": True,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "scan requested", "neutral", "Artifact entered the scan queue.", 0),
                    ("clean", "no threat detected", "good", "Provider returned a clean verdict.", 2),
                    ("held_pending_release", "held pending release", "neutral", "Release still requires policy confirmation.", 3),
                ]
            ),
            "retry_timeline_templates": [],
            "review_timeline_templates": timeline_event_templates(
                [
                    ("released", "release approved", "good", "Operator completed the release check.", 0),
                ]
            ),
        },
        {
            "scenario_id": "scan_suspicious_review",
            "label": "Suspicious, manual review required",
            "scan_state": "suspicious",
            "quarantine_state": "quarantined",
            "fallback_review_state": "security_review_required",
            "webhook_signature_state": "validated",
            "confidence_band": "medium",
            "release_decision_state": "blocked",
            "summary": "Scan shows a suspicious result and the artifact remains quarantined until review closes.",
            "can_retry_webhook": False,
            "can_review": True,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "scan requested", "neutral", "Artifact entered the queue.", 0),
                    ("suspicious", "suspicious signal raised", "warn", "The provider reported a suspicious verdict.", 3),
                    ("quarantined", "artifact quarantined", "danger", "The artifact stays blocked until manual review.", 4),
                ]
            ),
            "retry_timeline_templates": [],
            "review_timeline_templates": timeline_event_templates(
                [
                    ("manual_review_complete", "manual review complete", "warn", "Review concluded but does not imply automatic release.", 0),
                ]
            ),
        },
        {
            "scenario_id": "scan_quarantined_blocked",
            "label": "Quarantined hard block",
            "scan_state": "quarantined",
            "quarantine_state": "quarantined",
            "fallback_review_state": "security_review_required",
            "webhook_signature_state": "validated",
            "confidence_band": "high",
            "release_decision_state": "destroy_or_escalate",
            "summary": "Artifact is quarantined and must not proceed without an explicit destroy or escalation decision.",
            "can_retry_webhook": False,
            "can_review": True,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "scan requested", "neutral", "Artifact entered the queue.", 0),
                    ("quarantined", "quarantine hard block", "danger", "Threat verdict triggered the quarantine fence.", 2),
                ]
            ),
            "retry_timeline_templates": [],
            "review_timeline_templates": timeline_event_templates(
                [
                    ("manual_review_complete", "security review complete", "warn", "Security review finished, awaiting explicit destroy or retain decision.", 0),
                ]
            ),
        },
        {
            "scenario_id": "scan_unreadable_reacquire",
            "label": "Unreadable and reacquire",
            "scan_state": "unreadable",
            "quarantine_state": "blocked_pending_reacquire",
            "fallback_review_state": "request_reacquire",
            "webhook_signature_state": "validated",
            "confidence_band": "none",
            "release_decision_state": "blocked",
            "summary": "Artifact cannot be scanned and the user or operator must reacquire it.",
            "can_retry_webhook": False,
            "can_review": True,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "scan requested", "neutral", "Artifact entered the queue.", 0),
                    ("unreadable", "artifact unreadable", "danger", "Artifact could not be parsed or scanned.", 2),
                    ("blocked_pending_reacquire", "reacquire required", "danger", "No promotion path exists until a new artifact arrives.", 3),
                ]
            ),
            "retry_timeline_templates": [],
            "review_timeline_templates": timeline_event_templates(
                [
                    ("reacquire_requested", "reacquire requested", "warn", "Operator initiated reacquire flow.", 0),
                ]
            ),
        },
        {
            "scenario_id": "scan_webhook_retry",
            "label": "Result arrived with callback trust failure",
            "scan_state": "clean",
            "quarantine_state": "held_for_signature",
            "fallback_review_state": "not_required",
            "webhook_signature_state": "signature_failed",
            "confidence_band": "medium",
            "release_decision_state": "blocked",
            "summary": "The scan result appears clean but stays held because the callback trust path failed.",
            "can_retry_webhook": True,
            "can_review": True,
            "timeline_templates": timeline_event_templates(
                [
                    ("queued", "scan requested", "neutral", "Artifact entered the queue.", 0),
                    ("clean", "result reported clean", "good", "Provider returned a clean verdict.", 2),
                    ("signature_failed", "callback trust failed", "danger", "Ingest trust failed, so the verdict cannot drive release.", 3),
                ]
            ),
            "retry_timeline_templates": timeline_event_templates(
                [
                    ("validated", "callback validated", "good", "Retry path revalidated the callback or refetch proof.", 0),
                    ("held_pending_release", "held pending release", "neutral", "Result is authentic but still needs release confirmation.", 1),
                ]
            ),
            "review_timeline_templates": timeline_event_templates(
                [
                    ("released", "release approved", "good", "Release decision completed after callback validation.", 0),
                ]
            ),
        },
    ]


def materialize_timeline(
    item_id: str,
    templates: list[dict[str, Any]],
    base_at: datetime,
    starting_index: int = 0,
) -> list[dict[str, Any]]:
    output = []
    for index, template in enumerate(templates):
        output.append(
            {
                "event_id": f"{item_id}-E{starting_index + index + 1}",
                "state": template["state"],
                "label": template["label"],
                "tone": template["tone"],
                "detail": template["detail"],
                "at": (base_at + timedelta(minutes=template["offset_minutes"])).isoformat(),
            }
        )
    return output


def build_seeded_transcript_jobs(
    profiles: list[dict[str, Any]], scenarios: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    profile_map = {row["job_profile_id"]: row for row in profiles}
    scenario_map = {row["scenario_id"]: row for row in scenarios}
    seeds = [
        ("TRJ-2001", "JOB_TRANS_VOICE_CALLBACK_LOCAL", "transcript_partial_ready", "voice://call/2001"),
        ("TRJ-2002", "JOB_TRANS_VOICE_CALLBACK_PROVIDER_PREVIEW", "transcript_signature_retry", "voice://call/2002"),
        ("TRJ-2003", "JOB_TRANS_ATTACHMENT_AUDIO_PORTAL", "transcript_review_hold", "portal://artifact/audio-17"),
        ("TRJ-2004", "JOB_TRANS_RETRANSCRIBE_SUPERSEDE", "transcript_superseded_replacement", "ops://replay/audio-08"),
        ("TRJ-2005", "JOB_TRANS_SCAN_DEPENDENT_HOLD", "transcript_failed_retry", "artifact://upload/scan-held-03"),
    ]
    rows = []
    for offset, (job_id, profile_id, scenario_id, asset_ref) in enumerate(seeds):
        profile = profile_map[profile_id]
        scenario = scenario_map[scenario_id]
        base_at = datetime(2026, 4, 10, 8, 0, tzinfo=timezone.utc) + timedelta(minutes=offset * 11)
        rows.append(
            {
                "job_id": job_id,
                "job_profile_id": profile_id,
                "scenario_id": scenario_id,
                "source_asset_ref": asset_ref,
                "environment": profile["environment"],
                "vendor_mode": "mock_now",
                "transcript_state": scenario["transcript_state"],
                "readiness_state": scenario["readiness_state"],
                "fallback_review_state": scenario["fallback_review_state"],
                "webhook_signature_state": scenario["webhook_signature_state"],
                "quality_band": scenario["quality_band"],
                "coverage_class": scenario["coverage_class"],
                "superseded_by_ref": "",
                "summary": scenario["summary"],
                "timeline_events": materialize_timeline(job_id, scenario["timeline_templates"], base_at),
                "can_retry_webhook": scenario["can_retry_webhook"],
                "can_supersede": scenario["can_supersede"],
            }
        )
    return rows


def build_seeded_scan_jobs(
    profiles: list[dict[str, Any]], scenarios: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    profile_map = {row["job_profile_id"]: row for row in profiles}
    scenario_map = {row["scenario_id"]: row for row in scenarios}
    seeds = [
        ("SCN-3001", "JOB_SCAN_PORTAL_UPLOAD_CLEAN", "scan_clean_pass", "upload://artifact/3001"),
        ("SCN-3002", "JOB_SCAN_PORTAL_UPLOAD_SUSPICIOUS", "scan_suspicious_review", "upload://artifact/3002"),
        ("SCN-3003", "JOB_SCAN_PORTAL_UPLOAD_QUARANTINE", "scan_quarantined_blocked", "s3://bucket/incoming/3003"),
        ("SCN-3004", "JOB_SCAN_UNREADABLE_REACQUIRE", "scan_unreadable_reacquire", "upload://artifact/3004"),
        ("SCN-3005", "JOB_SCAN_STORAGE_BUCKET_PROVIDER_LIKE", "scan_webhook_retry", "s3://bucket/incoming/3005"),
    ]
    rows = []
    for offset, (job_id, profile_id, scenario_id, object_ref) in enumerate(seeds):
        profile = profile_map[profile_id]
        scenario = scenario_map[scenario_id]
        base_at = datetime(2026, 4, 10, 9, 0, tzinfo=timezone.utc) + timedelta(minutes=offset * 9)
        rows.append(
            {
                "scan_job_id": job_id,
                "job_profile_id": profile_id,
                "scenario_id": scenario_id,
                "object_ref": object_ref,
                "environment": profile["environment"],
                "scan_state": scenario["scan_state"],
                "quarantine_state": scenario["quarantine_state"],
                "fallback_review_state": scenario["fallback_review_state"],
                "webhook_signature_state": scenario["webhook_signature_state"],
                "confidence_band": scenario["confidence_band"],
                "release_decision_state": scenario["release_decision_state"],
                "summary": scenario["summary"],
                "timeline_events": materialize_timeline(job_id, scenario["timeline_templates"], base_at),
                "can_retry_webhook": scenario["can_retry_webhook"],
                "can_review": scenario["can_review"],
            }
        )
    return rows


def build_environment_profiles() -> list[dict[str, Any]]:
    return [
        {
            "environment_profile": "local",
            "label": "Local rehearsal",
            "description": "Pure local simulator mode with no provider traffic.",
        },
        {
            "environment_profile": "preview",
            "label": "Preview UI rehearsal",
            "description": "Local simulator with preview-grade route and inspector behavior.",
        },
        {
            "environment_profile": "provider_like_preprod",
            "label": "Provider-like preprod",
            "description": "Still mock-first, but shaped around the shortlisted provider surfaces and explicit region/retention policy.",
        },
        {
            "environment_profile": "actual_later",
            "label": "Actual provider later",
            "description": "Disabled live posture blocked until gates and flags pass.",
        },
    ]


def build_project_scopes() -> list[dict[str, Any]]:
    return [
        {
            "project_scope": "transcript_nonprod_workspace",
            "provider_family": "transcription",
            "summary": "Nonprod workspace for transcript callbacks, residency, and deletion policy.",
        },
        {
            "project_scope": "scan_nonprod_workspace",
            "provider_family": "artifact_scanning",
            "summary": "Nonprod scanning boundary for bucket scope, quarantine, and callback/event wiring.",
        },
        {
            "project_scope": "evidence_gate_prod_candidate",
            "provider_family": "shared",
            "summary": "Future production candidate project boundary, kept blocked in seq_035.",
        },
    ]


def build_live_gate_pack(shortlisted_vendors: list[dict[str, Any]]) -> dict[str, Any]:
    live_gates = [
        {
            "gate_id": "LIVE_GATE_EVIDENCE_PHASE0_EXTERNAL_READY",
            "status": "blocked",
            "severity": "hard_blocker",
            "title": "Phase 0 external-readiness chain is clear",
            "reason": "Phase 0 entry remains withheld, so no real provider mutation may start.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_SHORTLIST_APPROVED",
            "status": "pass",
            "severity": "required",
            "title": "Provider is on the seq_034 shortlist",
            "reason": "Only shortlisted providers may be configured later.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_REGION_POLICY_EXPLICIT",
            "status": "review_required",
            "severity": "required",
            "title": "Region policy is explicit",
            "reason": "Provider project creation stays blocked until region posture is named.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_RETENTION_POLICY_EXPLICIT",
            "status": "review_required",
            "severity": "required",
            "title": "Retention and deletion policy is explicit",
            "reason": "Deletion or retention cannot be inferred from job completion.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_WEBHOOK_SECURITY_READY",
            "status": "review_required",
            "severity": "required",
            "title": "Webhook security and replay controls are ready",
            "reason": "Unsigned or replayed callbacks must stay non-authoritative.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_STORAGE_SCOPE_DEFINED",
            "status": "review_required",
            "severity": "required",
            "title": "Bucket or storage scope is declared",
            "reason": "Storage and prefix scope are part of the scanning contract.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_QUARANTINE_POLICY_FROZEN",
            "status": "review_required",
            "severity": "required",
            "title": "Quarantine policy is frozen",
            "reason": "Clean, suspicious, unreadable, and failed branches cannot collapse into one badge.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV",
            "status": "blocked",
            "severity": "hard_blocker",
            "title": "Named approver and target environment are present",
            "reason": "Live mutations require a named human approver and environment target.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_MUTATION_FLAG",
            "status": "blocked",
            "severity": "hard_blocker",
            "title": "ALLOW_REAL_PROVIDER_MUTATION is true",
            "reason": "Real provider changes must fail closed without the mutation flag.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_SPEND_FLAG",
            "status": "blocked",
            "severity": "hard_blocker",
            "title": "ALLOW_SPEND is true for billable actions",
            "reason": "Project creation and live traffic can incur spend immediately.",
        },
        {
            "gate_id": "LIVE_GATE_EVIDENCE_FINAL_OPERATOR_ACK",
            "status": "blocked",
            "severity": "hard_blocker",
            "title": "Final operator acknowledgement is captured",
            "reason": "Real project setup is blocked until a human acknowledges the live posture and artifact sensitivity.",
        },
    ]

    return {
        "phase0_verdict": "withheld",
        "allowed_vendor_ids": [row["vendor_id"] for row in shortlisted_vendors],
        "required_env": [
            "EVIDENCE_PROVIDER_VENDOR_ID",
            "EVIDENCE_PROJECT_SCOPE",
            "EVIDENCE_TARGET_ENVIRONMENT",
            "EVIDENCE_REGION_POLICY_REF",
            "EVIDENCE_RETENTION_POLICY_REF",
            "EVIDENCE_WEBHOOK_BASE_URL",
            "EVIDENCE_WEBHOOK_SECRET_REF",
            "EVIDENCE_STORAGE_BUCKET_REF",
            "EVIDENCE_SCAN_POLICY_REF",
            "EVIDENCE_NAMED_APPROVER",
            "ALLOW_REAL_PROVIDER_MUTATION",
            "ALLOW_SPEND",
        ],
        "live_gates": live_gates,
        "selector_map": {
            "base_profile": {
                "mode_toggle_actual": "[data-testid='mode-toggle-actual']",
                "page_tab_live_gates": "[data-testid='page-tab-Live_Gates_and_Retention_Posture']",
                "field_vendor": "[data-testid='actual-field-vendor-id']",
                "field_project_scope": "[data-testid='actual-field-project-scope']",
                "field_region_policy": "[data-testid='actual-field-region-policy']",
                "field_retention_policy": "[data-testid='actual-field-retention-policy']",
                "field_callback_base": "[data-testid='actual-field-callback-base']",
                "field_secret_ref": "[data-testid='actual-field-secret-ref']",
                "field_bucket_ref": "[data-testid='actual-field-bucket-ref']",
                "field_scan_policy": "[data-testid='actual-field-scan-policy']",
                "field_environment": "[data-testid='actual-field-target-environment']",
                "field_approver": "[data-testid='actual-field-named-approver']",
                "field_allow_mutation": "[data-testid='actual-field-allow-mutation']",
                "field_allow_spend": "[data-testid='actual-field-allow-spend']",
                "final_submit": "[data-testid='actual-submit-button']",
            }
        },
    }


def build_pack(inputs: dict[str, Any]) -> dict[str, Any]:
    vendor_shortlist = inputs["vendor_shortlist"]
    shortlisted_vendors = (
        vendor_shortlist["shortlist_by_family"]["transcription"]
        + vendor_shortlist["shortlist_by_family"]["artifact_scanning"]
    )
    selected_access_rows = vendor_shortlist["selected_access_rows"]

    field_rows = build_field_rows()
    region_policies = build_region_policies()
    retention_policies = build_retention_policies()
    quarantine_policies = build_quarantine_policies()
    webhook_profiles = build_webhook_profiles()
    job_profiles = build_job_profiles()
    scan_policy_rows = build_scan_policy_rows()
    transcript_scenarios = build_transcript_scenarios()
    scan_scenarios = build_scan_scenarios()
    seeded_transcript_jobs = build_seeded_transcript_jobs(job_profiles, transcript_scenarios)
    seeded_scan_jobs = build_seeded_scan_jobs(job_profiles, scan_scenarios)
    live_gate_pack = build_live_gate_pack(shortlisted_vendors)
    guidance = official_vendor_guidance()

    blocking_row_count = len([row for row in live_gate_pack["live_gates"] if row["status"] == "blocked"])
    review_row_count = len([row for row in live_gate_pack["live_gates"] if row["status"] == "review_required"])
    pass_row_count = len([row for row in live_gate_pack["live_gates"] if row["status"] == "pass"])

    return {
        "task_id": TASK_ID,
        "generated_at": now_iso(),
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "phase0_verdict": inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"],
        "integration_anchor_ref": "int_telephony_capture_evidence_backplane",
        "source_precedence": SOURCE_PRECEDENCE,
        "mock_service": {
            "ports": {
                "transcription_engine": TRANSCRIPTION_SERVICE_PORT,
                "artifact_scan_gateway": SCAN_SERVICE_PORT,
                "evidence_gate_lab": APP_PORT,
            },
            "base_url_default": {
                "transcription_engine": f"http://127.0.0.1:{TRANSCRIPTION_SERVICE_PORT}",
                "artifact_scan_gateway": f"http://127.0.0.1:{SCAN_SERVICE_PORT}",
            },
        },
        "environment_profiles": build_environment_profiles(),
        "project_scopes": build_project_scopes(),
        "shortlisted_vendors": shortlisted_vendors,
        "selected_access_rows": selected_access_rows,
        "official_vendor_guidance": guidance,
        "project_field_map": {
            "field_rows": field_rows,
        },
        "region_policies": region_policies,
        "retention_policies": retention_policies,
        "quarantine_policies": quarantine_policies,
        "webhook_profiles": webhook_profiles,
        "job_profiles": job_profiles,
        "scan_and_quarantine_policy_rows": scan_policy_rows,
        "transcript_scenarios": transcript_scenarios,
        "scan_scenarios": scan_scenarios,
        "seeded_transcript_jobs": seeded_transcript_jobs,
        "seeded_scan_jobs": seeded_scan_jobs,
        "live_gate_pack": live_gate_pack,
        "summary": {
            "field_count": len(field_rows),
            "job_profile_count": len(job_profiles),
            "scan_policy_count": len(scan_policy_rows),
            "live_gate_count": len(live_gate_pack["live_gates"]),
            "blocking_live_gate_count": blocking_row_count,
            "review_live_gate_count": review_row_count,
            "pass_live_gate_count": pass_row_count,
            "transcript_scenario_count": len(transcript_scenarios),
            "scan_scenario_count": len(scan_scenarios),
            "seeded_transcript_job_count": len(seeded_transcript_jobs),
            "seeded_scan_job_count": len(seeded_scan_jobs),
            "shortlisted_vendor_count": len(shortlisted_vendors),
            "selected_access_row_count": len(selected_access_rows),
            "official_guidance_count": len(guidance),
        },
    }


def render_local_spec_doc(pack: dict[str, Any]) -> str:
    environment_rows = [
        [
            row["environment_profile"],
            row["label"],
            row["description"],
        ]
        for row in pack["environment_profiles"]
    ]
    profile_rows = [
        [
            row["job_profile_id"],
            row["provider_family"],
            row["environment"],
            row["input_class"],
            row["output_state_family"],
        ]
        for row in pack["job_profiles"]
    ]
    return dedent(
        f"""
        # 35 Local Evidence Processing Lab Spec

        Task `{pack["task_id"]}` creates the `MOCK_EVIDENCE_GATE_LAB` workbench and the two local provider twins:
        `mock-transcription-engine` and `mock-artifact-scan-gateway`.

        Summary:
        - field-map rows: `{pack["summary"]["field_count"]}`
        - job profiles: `{pack["summary"]["job_profile_count"]}`
        - scan and quarantine policy rows: `{pack["summary"]["scan_policy_count"]}`
        - live gates: `{pack["summary"]["live_gate_count"]}`
        - transcript scenarios: `{pack["summary"]["transcript_scenario_count"]}`
        - scan scenarios: `{pack["summary"]["scan_scenario_count"]}`

        Section A — `Mock_now_execution`

        The local lab exists to rehearse evidence-processing law now:
        - transcript states remain differentiated across `queued`, `partial`, `ready`, `failed`, and `superseded`
        - scan states remain differentiated across `clean`, `suspicious`, `quarantined`, `unreadable`, and `failed`
        - callback or event arrival stays non-authoritative until Vecells re-checks policy, quarantine, and evidence readiness
        - local and preview profiles never require live provider credentials, accounts, or billable project creation

        Environment profiles:

        {mono_table(["Environment", "Label", "Purpose"], environment_rows)}

        Core job profiles:

        {mono_table(["Profile", "Family", "Environment", "Input", "State family"], profile_rows)}

        Section B — `Actual_provider_strategy_later`

        Real project or workspace creation stays fail-closed in this task.
        It is blocked unless all of the following remain true at execution time:
        - the chosen provider is on the seq_034 shortlist
        - region, retention, and deletion posture are explicit
        - webhook or event authenticity and replay controls are frozen
        - bucket or storage scope is explicit where relevant
        - a named approver and target environment are present
        - `ALLOW_REAL_PROVIDER_MUTATION=true`
        - `ALLOW_SPEND=true` where provider actions are billable

        The real-later pack therefore treats provider projects as evidence-processing control-plane objects rather than generic admin setup.
        """
    )


def render_field_map_doc(pack: dict[str, Any]) -> str:
    rows = pack["project_field_map"]["field_rows"]
    transcription_rows = [row for row in rows if row["provider_family"] == "transcription"][:16]
    scan_rows = [row for row in rows if row["provider_family"] == "artifact_scanning"][:16]
    return dedent(
        f"""
        # 35 Transcription And Scanning Project Field Map

        This field map joins the shortlisted providers from seq_034 to the live-gated project model used in seq_035.

        Section A — `Mock_now_execution`

        The mock lab uses the same field identifiers as the later real-provider plan so UI, dry-run harnesses, and validators stay aligned.

        Sample transcription fields:

        {mono_table(
            ["Field", "Targets", "Label", "Requirement", "Placeholder"],
            [
                [
                    row["field_id"],
                    ", ".join(row["provider_targets"]),
                    row["label"],
                    row["requirement_class"],
                    row["placeholder"],
                ]
                for row in transcription_rows
            ],
        )}

        Sample artifact-scanning fields:

        {mono_table(
            ["Field", "Targets", "Label", "Requirement", "Placeholder"],
            [
                [
                    row["field_id"],
                    ", ".join(row["provider_targets"]),
                    row["label"],
                    row["requirement_class"],
                    row["placeholder"],
                ]
                for row in scan_rows
            ],
        )}

        Section B — `Actual_provider_strategy_later`

        Real project setup remains blocked until the field map is fully populated with:
        - secret references rather than literal secrets
        - explicit region and retention policy refs
        - bucket or object-prefix scope for scan providers
        - named webhook endpoints and callback authenticity handles
        - named approver and spend owner references
        """
    )


def render_webhook_doc(pack: dict[str, Any]) -> str:
    return dedent(
        f"""
        # 35 Webhook Retention And Region Strategy

        Seq_035 treats callback, event, retention, and region posture as first-class contract objects.

        Section A — `Mock_now_execution`

        Webhook profiles:

        {mono_table(
            ["Webhook profile", "Family", "Transport", "Auth model", "Retry model"],
            [
                [
                    row["webhook_profile_ref"],
                    row["provider_family"],
                    row["transport_model"],
                    row["auth_model"],
                    row["retry_model"],
                ]
                for row in pack["webhook_profiles"]
            ],
        )}

        Region policies:

        {mono_table(
            ["Region policy", "Family", "Environments", "Rule"],
            [
                [
                    row["region_policy_ref"],
                    ", ".join(row["applies_to"]),
                    ", ".join(row["environment_profiles"]),
                    row["operator_rule"],
                ]
                for row in pack["region_policies"]
            ],
        )}

        Retention policies:

        {mono_table(
            ["Retention policy", "Artifact family", "Window", "Deletion trigger"],
            [
                [
                    row["retention_policy_ref"],
                    row["artifact_family"],
                    row["retention_window"],
                    row["deletion_trigger"],
                ]
                for row in pack["retention_policies"]
            ],
        )}

        Section B — `Actual_provider_strategy_later`

        Later real project creation is blocked until:
        - region policy is frozen and compatible with the shortlisted provider
        - retention and deletion policy are frozen and auditable
        - callback or event authenticity is wired to a secret or control-plane proof
        - quarantine policy is explicit for `suspicious`, `quarantined`, `unreadable`, and `failed`

        This closes the gap where provider admin work would otherwise be mistaken for safe evidence processing.
        """
    )


def render_live_gate_doc(pack: dict[str, Any]) -> str:
    live_gate_pack = pack["live_gate_pack"]
    return dedent(
        f"""
        # 35 Live Gate And Spend Controls

        Phase 0 is still `{pack["phase0_verdict"]}`. Real provider setup stays blocked.

        Section A — `Mock_now_execution`

        The mock lab exposes the real-later field model and selector map, but keeps submit disabled.

        Section B — `Actual_provider_strategy_later`

        Live gates:

        {mono_table(
            ["Gate", "Status", "Severity", "Reason"],
            [
                [
                    row["gate_id"],
                    row["status"],
                    row["severity"],
                    row["reason"],
                ]
                for row in live_gate_pack["live_gates"]
            ],
        )}

        Required environment variables for any future real dry run:

        {mono_table(
            ["Variable"],
            [[name] for name in live_gate_pack["required_env"]],
        )}

        A real run must still fail closed while `phase0_verdict = withheld`.
        """
    )


def write_pack_assets(pack: dict[str, Any]) -> None:
    write_json(PACK_JSON_PATH, pack)
    write_json(FIELD_MAP_JSON_PATH, pack["project_field_map"])
    write_csv(
        JOB_PROFILE_CSV_PATH,
        pack["job_profiles"],
        [
            "job_profile_id",
            "profile_label",
            "provider_family",
            "environment",
            "input_class",
            "output_state_family",
            "webhook_profile_ref",
            "retention_policy_ref",
            "region_policy_ref",
            "quarantine_policy_ref",
            "mock_now_use",
            "actual_later_use",
            "notes",
        ],
    )
    write_csv(
        SCAN_POLICY_CSV_PATH,
        pack["scan_and_quarantine_policy_rows"],
        [
            "policy_row_id",
            "provider_family",
            "environment",
            "scan_policy_ref",
            "verdict_state",
            "quarantine_action",
            "fallback_review_action",
            "webhook_profile_ref",
            "retention_policy_ref",
            "region_policy_ref",
            "notes",
        ],
    )
    write_json(LIVE_GATE_JSON_PATH, pack["live_gate_pack"])
    write_text(LOCAL_SPEC_DOC_PATH, render_local_spec_doc(pack))
    write_text(FIELD_MAP_DOC_PATH, render_field_map_doc(pack))
    write_text(WEBHOOK_DOC_PATH, render_webhook_doc(pack))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(pack))
    write_json(APP_PACK_JSON_PATH, pack)
    write_text(
        APP_PACK_TS_PATH,
        "export const evidenceGateLabPack = "
        + json.dumps(pack, indent=2)
        + " as const;\n"
        + "export type EvidenceGateLabPack = typeof evidenceGateLabPack;\n",
    )


def main() -> None:
    inputs = load_inputs()
    pack = build_pack(inputs)
    write_pack_assets(pack)
    print(
        json.dumps(
            {
                "task_id": TASK_ID,
                "phase0_verdict": pack["phase0_verdict"],
                "summary": pack["summary"],
                "pack_path": str(PACK_JSON_PATH),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
