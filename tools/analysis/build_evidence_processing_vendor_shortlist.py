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

TASK_ID = "seq_034"
CAPTURED_ON = "2026-04-10"
VISUAL_MODE = "Evidence_Signal_Atlas"
MISSION = (
    "Create the evidence-processing vendor-selection dossier for transcription and "
    "artifact scanning while freezing the internal mock-now lane, the current official "
    "vendor evidence set, and the fail-closed actual-provider-later shortlist used by "
    "seq_035."
)

REQUIRED_INPUTS = {
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "external_account_inventory": DATA_DIR / "external_account_inventory.csv",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
}

UNIVERSE_CSV_PATH = DATA_DIR / "34_vendor_universe.csv"
SHORTLIST_JSON_PATH = DATA_DIR / "34_vendor_shortlist.json"
EVIDENCE_JSONL_PATH = DATA_DIR / "34_vendor_research_evidence.jsonl"
LANE_MATRIX_CSV_PATH = DATA_DIR / "34_mock_vs_actual_vendor_lane_matrix.csv"
KILL_SWITCHES_CSV_PATH = DATA_DIR / "34_vendor_kill_switches.csv"

UNIVERSE_DOC_PATH = DOCS_DIR / "34_vendor_universe_transcription_and_scanning.md"
MOCK_DOC_PATH = DOCS_DIR / "34_mock_provider_lane_for_evidence_processing.md"
SHORTLIST_DOC_PATH = DOCS_DIR / "34_actual_provider_shortlist_and_due_diligence.md"
DECISION_LOG_DOC_PATH = DOCS_DIR / "34_vendor_selection_decision_log.md"
EVIDENCE_DOC_PATH = DOCS_DIR / "34_vendor_research_evidence_register.md"
ATLAS_HTML_PATH = DOCS_DIR / "34_evidence_signal_atlas.html"

PLAYWRIGHT_SPEC_PATH = TESTS_DIR / "34_evidence_signal_atlas.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/034.md",
    "prompt/035.md",
    "prompt/shared_operating_contract_026_to_035.md",
    "prompt/AGENT.md",
    "data/analysis/provider_family_scorecards.json",
    "data/analysis/external_dependencies.json",
    "data/analysis/external_account_inventory.csv",
    "data/analysis/integration_priority_matrix.json",
    "data/analysis/phase0_gate_verdict.json",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/22_provider_selection_scorecards.md",
    "docs/external/22_actual_provider_due_diligence_playbook.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/31_actual_provider_shortlist_and_due_diligence.md",
    "https://developers.deepgram.com/docs/using-callbacks-to-return-transcripts-to-your-server",
    "https://developers.deepgram.com/docs/pre-recorded-audio",
    "https://developers.deepgram.com/docs/interim-results",
    "https://developers.deepgram.com/docs/managing-projects",
    "https://developers.deepgram.com/docs/create-additional-api-keys",
    "https://developers.deepgram.com/docs/deployment-options",
    "https://deepgram.com/pricing",
    "https://www.assemblyai.com/docs/deployment/webhooks",
    "https://www.assemblyai.com/docs/deployment/webhooks-for-streaming-speech-to-text",
    "https://www.assemblyai.com/docs/pre-recorded-audio/select-the-region",
    "https://www.assemblyai.com/docs/api-reference/transcripts/delete",
    "https://www.assemblyai.com/docs/deployment/private-deployment",
    "https://www.assemblyai.com/pricing",
    "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription-create",
    "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription",
    "https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/speech-to-text/data-privacy-security",
    "https://docs.aws.amazon.com/transcribe/latest/dg/streaming-partial-results.html",
    "https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html",
    "https://cloud.google.com/speech-to-text",
    "https://cloud.google.com/speech-to-text/pricing",
    "https://cloud.google.com/speech-to-text/docs/endpoints",
    "https://cloud.google.com/speech-to-text/v2/docs/batch-recognize",
    "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/monitoring-malware-protection-s3-scans-gdu.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html",
    "https://docs.aws.amazon.com/guardduty/latest/ug/pricing-malware-protection-for-s3-guardduty.html",
    "https://www.opswat.com/products/metadefender/cloud",
    "https://www.opswat.com/docs/mdcloud/integrations/v4-api",
    "https://www.opswat.com/docs/my/2025.1.3/home/cloud-services",
    "https://cloudmersive.com/virus-api",
    "https://api.cloudmersive.com/docs/virus.asp",
    "https://cloudmersive.com/pricing",
    "https://docs.virustotal.com/docs/private-scanning",
    "https://docs.virustotal.com/reference/files",
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


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def require(path: Path) -> Path:
    assert_true(path.exists(), f"Missing required seq_034 input: {path}")
    return path


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as handle:
        for row in rows:
            handle.write(json.dumps(row) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    header_line = "| " + " | ".join(headers) + " |"
    divider_line = "| " + " | ".join("---" for _ in headers) + " |"
    body_lines = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header_line, divider_line, *body_lines])


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


def derive_dimension_catalog(scorecards: dict[str, Any]) -> list[dict[str, Any]]:
    family = next(
        row for row in scorecards["families"] if row["provider_family"] == "telephony_voice_and_recording"
    )
    catalog = []
    for row in family["scorecard_rows"]:
        catalog.append(
            {
                "dimension_id": row["dimension_id"],
                "dimension_title": row["dimension_title"],
                "dimension_class": row["dimension_class"],
                "weight_mock_now": row["weight_mock_now"],
                "weight_actual_later": row["weight_actual_later"],
                "minimum_bar_mock_now": row["minimum_bar_mock_now"],
                "minimum_bar_actual_later": row["minimum_bar_actual_later"],
                "lane_priority": row["lane_priority"],
            }
        )
    return catalog


def weighted_score(scores: dict[str, int], dimensions: list[dict[str, Any]], lane: str) -> int:
    total = 0
    weights = 0
    for dim in dimensions:
        weight = dim["weight_mock_now"] if lane == "mock_now" else dim["weight_actual_later"]
        total += scores[dim["dimension_id"]] * weight
        weights += weight
    return round(total / weights * 20)


def build_official_evidence() -> list[dict[str, Any]]:
    rows = [
        {
            "evidence_id": "ev_dg_callback",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Using Callbacks to Return Transcripts to Your Server | Deepgram Docs",
            "url": "https://developers.deepgram.com/docs/using-callbacks-to-return-transcripts-to-your-server",
            "captured_on": CAPTURED_ON,
            "evidence_type": "webhook",
            "summary": "Deepgram supports asynchronous transcription callbacks to a URL supplied with the transcription request.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_dg_prerecorded",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Pre-Recorded Audio | Deepgram Docs",
            "url": "https://developers.deepgram.com/docs/pre-recorded-audio",
            "captured_on": CAPTURED_ON,
            "evidence_type": "async_jobs",
            "summary": "Deepgram exposes pre-recorded transcription flows that can run synchronously or via callback for longer files.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_dg_interim",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Interim Results | Deepgram Docs",
            "url": "https://developers.deepgram.com/docs/interim-results",
            "captured_on": CAPTURED_ON,
            "evidence_type": "partial_results",
            "summary": "Deepgram streaming supports interim results so partial transcript states can remain explicit before finalization.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_dg_projects",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Managing Projects | Deepgram Docs",
            "url": "https://developers.deepgram.com/docs/managing-projects",
            "captured_on": CAPTURED_ON,
            "evidence_type": "project_model",
            "summary": "Deepgram separates usage and access through projects, which aligns with environment-scoped provisioning later on.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_dg_api_keys",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Create Additional API Keys | Deepgram Docs",
            "url": "https://developers.deepgram.com/docs/create-additional-api-keys",
            "captured_on": CAPTURED_ON,
            "evidence_type": "credentials",
            "summary": "Deepgram supports additional API keys, which helps isolate preview and live environments later.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_dg_deployment",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Deployment Options | Deepgram Docs",
            "url": "https://developers.deepgram.com/docs/deployment-options",
            "captured_on": CAPTURED_ON,
            "evidence_type": "residency",
            "summary": "Deepgram documents hosted, self-hosted, and private deployment paths, which keeps residency and portability options open.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_dg_pricing",
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_families": ["transcription"],
            "title": "Pricing | Deepgram",
            "url": "https://deepgram.com/pricing",
            "captured_on": CAPTURED_ON,
            "evidence_type": "pricing",
            "summary": "Deepgram publishes usage-based pricing tiers, making spend controls explicit for later gated onboarding.",
            "strength": "medium",
        },
        {
            "evidence_id": "ev_aa_webhooks_prerecorded",
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_families": ["transcription"],
            "title": "Webhooks for Pre-recorded Audio | AssemblyAI Docs",
            "url": "https://www.assemblyai.com/docs/deployment/webhooks",
            "captured_on": CAPTURED_ON,
            "evidence_type": "webhook",
            "summary": "AssemblyAI lets clients attach webhook URLs to transcript jobs and retries failed deliveries up to ten attempts.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aa_webhooks_streaming",
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_families": ["transcription"],
            "title": "Webhooks for Streaming Speech-to-Text | AssemblyAI Docs",
            "url": "https://www.assemblyai.com/docs/deployment/webhooks-for-streaming-speech-to-text",
            "captured_on": CAPTURED_ON,
            "evidence_type": "streaming",
            "summary": "AssemblyAI exposes webhook delivery for streaming jobs and keeps incremental transcript events explicit.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aa_region",
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_families": ["transcription"],
            "title": "Select the Region | AssemblyAI Docs",
            "url": "https://www.assemblyai.com/docs/pre-recorded-audio/select-the-region",
            "captured_on": CAPTURED_ON,
            "evidence_type": "residency",
            "summary": "AssemblyAI offers explicit region selection with US and EU endpoints for pre-recorded transcription workloads.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aa_delete",
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_families": ["transcription"],
            "title": "Delete a transcript | AssemblyAI Docs",
            "url": "https://www.assemblyai.com/docs/api-reference/transcripts/delete",
            "captured_on": CAPTURED_ON,
            "evidence_type": "deletion",
            "summary": "AssemblyAI documents transcript deletion and states that deleting a transcript also removes its uploaded files.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aa_private_deployment",
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_families": ["transcription"],
            "title": "Private Deployment | AssemblyAI Docs",
            "url": "https://www.assemblyai.com/docs/deployment/private-deployment",
            "captured_on": CAPTURED_ON,
            "evidence_type": "deployment",
            "summary": "AssemblyAI documents private deployment options, including VPC and on-prem paths, which helps portability and residency review.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aa_pricing",
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_families": ["transcription"],
            "title": "Pricing | AssemblyAI",
            "url": "https://www.assemblyai.com/pricing",
            "captured_on": CAPTURED_ON,
            "evidence_type": "pricing",
            "summary": "AssemblyAI publishes usage pricing and enterprise deployment options, which is enough to model later spend gates.",
            "strength": "medium",
        },
        {
            "evidence_id": "ev_azure_batch_create",
            "vendor_id": "azure_speech_transcription",
            "vendor_name": "Azure AI Speech",
            "provider_families": ["transcription"],
            "title": "Create a batch transcription | Azure Speech",
            "url": "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription-create",
            "captured_on": CAPTURED_ON,
            "evidence_type": "batch_jobs",
            "summary": "Azure batch transcription supports job creation, customer storage integration, and webhook registration with validation handshake rules.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_azure_batch_overview",
            "vendor_id": "azure_speech_transcription",
            "vendor_name": "Azure AI Speech",
            "provider_families": ["transcription"],
            "title": "Batch transcription | Azure Speech",
            "url": "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription",
            "captured_on": CAPTURED_ON,
            "evidence_type": "retention",
            "summary": "Azure batch transcription documents job lifecycle, content URLs, and TTL behavior that affects later retention policy design.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_azure_privacy",
            "vendor_id": "azure_speech_transcription",
            "vendor_name": "Azure AI Speech",
            "provider_families": ["transcription"],
            "title": "Speech to text data privacy and security | Microsoft Learn",
            "url": "https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/speech-to-text/data-privacy-security",
            "captured_on": CAPTURED_ON,
            "evidence_type": "privacy",
            "summary": "Microsoft documents privacy, logging, and container posture for speech-to-text workloads, which is useful but operationally heavy.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aws_transcribe_partial",
            "vendor_id": "aws_transcribe_transcription",
            "vendor_name": "Amazon Transcribe",
            "provider_families": ["transcription"],
            "title": "Streaming and partial results | Amazon Transcribe",
            "url": "https://docs.aws.amazon.com/transcribe/latest/dg/streaming-partial-results.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "partial_results",
            "summary": "Amazon Transcribe exposes partial-result stabilization for streaming transcription, which aligns with explicit partial versus final states.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_aws_transcribe_io",
            "vendor_id": "aws_transcribe_transcription",
            "vendor_name": "Amazon Transcribe",
            "provider_families": ["transcription"],
            "title": "Data input and output | Amazon Transcribe",
            "url": "https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "retention",
            "summary": "Amazon Transcribe couples batch jobs to S3 input and output paths, which is strong for audit but increases bucket and KMS coupling.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_google_overview",
            "vendor_id": "google_speech_transcription",
            "vendor_name": "Google Cloud Speech-to-Text",
            "provider_families": ["transcription"],
            "title": "Speech-to-Text | Google Cloud",
            "url": "https://cloud.google.com/speech-to-text",
            "captured_on": CAPTURED_ON,
            "evidence_type": "overview",
            "summary": "Google positions Speech-to-Text as a Cloud product but the product page also carries a caution not to enter sensitive, confidential, or personal information.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_google_endpoints",
            "vendor_id": "google_speech_transcription",
            "vendor_name": "Google Cloud Speech-to-Text",
            "provider_families": ["transcription"],
            "title": "Endpoints | Google Cloud Speech-to-Text",
            "url": "https://cloud.google.com/speech-to-text/docs/endpoints",
            "captured_on": CAPTURED_ON,
            "evidence_type": "residency",
            "summary": "Google documents global and regional endpoints, which helps environment separation but still leaves healthcare contract clarity to later review.",
            "strength": "medium",
        },
        {
            "evidence_id": "ev_google_pricing",
            "vendor_id": "google_speech_transcription",
            "vendor_name": "Google Cloud Speech-to-Text",
            "provider_families": ["transcription"],
            "title": "Pricing | Google Cloud Speech-to-Text",
            "url": "https://cloud.google.com/speech-to-text/pricing",
            "captured_on": CAPTURED_ON,
            "evidence_type": "pricing",
            "summary": "Google publishes pricing and batch versus streaming tiers, but the product posture is not strong enough here to offset the PHI caution.",
            "strength": "medium",
        },
        {
            "evidence_id": "ev_guardduty_enable",
            "vendor_id": "aws_guardduty_s3_scan",
            "vendor_name": "GuardDuty Malware Protection for S3",
            "provider_families": ["artifact_scanning"],
            "title": "Enable Malware Protection for S3 | AWS Docs",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "project_model",
            "summary": "AWS documents enabling a protection plan per bucket scope, service role, EventBridge rule, and tagging permissions.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_guardduty_how",
            "vendor_id": "aws_guardduty_s3_scan",
            "vendor_name": "GuardDuty Malware Protection for S3",
            "provider_families": ["artifact_scanning"],
            "title": "How Malware Protection for S3 works | AWS Docs",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "quarantine_states",
            "summary": "AWS describes status values, object tagging, and scan outcomes that map well to clean, suspicious, failed, and unsupported states.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_guardduty_monitoring",
            "vendor_id": "aws_guardduty_s3_scan",
            "vendor_name": "GuardDuty Malware Protection for S3",
            "provider_families": ["artifact_scanning"],
            "title": "Monitoring scans for Malware Protection for S3 | AWS Docs",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/monitoring-malware-protection-s3-scans-gdu.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "observability",
            "summary": "AWS exposes scan monitoring through tags, CloudWatch metrics, findings, and EventBridge, which is strong for audit and quarantine hooks.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_guardduty_eventbridge",
            "vendor_id": "aws_guardduty_s3_scan",
            "vendor_name": "GuardDuty Malware Protection for S3",
            "provider_families": ["artifact_scanning"],
            "title": "Monitoring with Amazon EventBridge | AWS Docs",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "webhook",
            "summary": "GuardDuty emits EventBridge events for scan lifecycle changes, which fits a replay-safe internal event-ingress pattern better than raw vendor webhooks.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_guardduty_pricing",
            "vendor_id": "aws_guardduty_s3_scan",
            "vendor_name": "GuardDuty Malware Protection for S3",
            "provider_families": ["artifact_scanning"],
            "title": "Pricing for Malware Protection for S3 | AWS Docs",
            "url": "https://docs.aws.amazon.com/guardduty/latest/ug/pricing-malware-protection-for-s3-guardduty.html",
            "captured_on": CAPTURED_ON,
            "evidence_type": "pricing",
            "summary": "AWS publishes per-object and per-GB pricing, which makes spend governance explicit enough for later gating.",
            "strength": "medium",
        },
        {
            "evidence_id": "ev_opswat_product",
            "vendor_id": "opswat_metadefender_cloud",
            "vendor_name": "OPSWAT MetaDefender Cloud",
            "provider_families": ["artifact_scanning"],
            "title": "MetaDefender Cloud | OPSWAT",
            "url": "https://www.opswat.com/products/metadefender/cloud",
            "captured_on": CAPTURED_ON,
            "evidence_type": "overview",
            "summary": "OPSWAT positions MetaDefender Cloud as a multi-engine scanning service with hash lookup, CDR, and file-analysis workflows.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_opswat_api",
            "vendor_id": "opswat_metadefender_cloud",
            "vendor_name": "OPSWAT MetaDefender Cloud",
            "provider_families": ["artifact_scanning"],
            "title": "MetaDefender Cloud v4 API | OPSWAT Docs",
            "url": "https://www.opswat.com/docs/mdcloud/integrations/v4-api",
            "captured_on": CAPTURED_ON,
            "evidence_type": "api",
            "summary": "OPSWAT documents REST API flows, API key authentication, hash lookup, and file submission patterns for cloud scanning.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_opswat_regions",
            "vendor_id": "opswat_metadefender_cloud",
            "vendor_name": "OPSWAT MetaDefender Cloud",
            "provider_families": ["artifact_scanning"],
            "title": "Cloud Services | OPSWAT Docs",
            "url": "https://www.opswat.com/docs/my/2025.1.3/home/cloud-services",
            "captured_on": CAPTURED_ON,
            "evidence_type": "residency",
            "summary": "OPSWAT documents cloud-service regions and service boundaries, which gives it a workable residency and hosting story.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_cloudmersive_product",
            "vendor_id": "cloudmersive_virus_scan",
            "vendor_name": "Cloudmersive Virus Scan API",
            "provider_families": ["artifact_scanning"],
            "title": "Virus Scan API | Cloudmersive",
            "url": "https://cloudmersive.com/virus-api",
            "captured_on": CAPTURED_ON,
            "evidence_type": "overview",
            "summary": "Cloudmersive markets a file and cloud-storage scanning API with cloud-hosted, dedicated, and on-premise deployment options.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_cloudmersive_api",
            "vendor_id": "cloudmersive_virus_scan",
            "vendor_name": "Cloudmersive Virus Scan API",
            "provider_families": ["artifact_scanning"],
            "title": "Virus Scan APIs | Cloudmersive Docs",
            "url": "https://api.cloudmersive.com/docs/virus.asp",
            "captured_on": CAPTURED_ON,
            "evidence_type": "api",
            "summary": "Cloudmersive documents API-key authentication and scan endpoints for files, archives, and S3-hosted objects.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_cloudmersive_pricing",
            "vendor_id": "cloudmersive_virus_scan",
            "vendor_name": "Cloudmersive Virus Scan API",
            "provider_families": ["artifact_scanning"],
            "title": "Pricing | Cloudmersive",
            "url": "https://cloudmersive.com/pricing",
            "captured_on": CAPTURED_ON,
            "evidence_type": "pricing",
            "summary": "Cloudmersive publishes hosted, dedicated, and private deployment pricing levers, which helps later spend control review.",
            "strength": "medium",
        },
        {
            "evidence_id": "ev_vt_private_scanning",
            "vendor_id": "virustotal_private_scanning",
            "vendor_name": "VirusTotal Private Scanning",
            "provider_families": ["artifact_scanning"],
            "title": "Private Scanning | VirusTotal Docs",
            "url": "https://docs.virustotal.com/docs/private-scanning",
            "captured_on": CAPTURED_ON,
            "evidence_type": "overview",
            "summary": "VirusTotal positions private scanning as isolated from the public corpus, but the product still remains threat-intel-centric rather than quarantine-workflow-centric.",
            "strength": "strong",
        },
        {
            "evidence_id": "ev_vt_files_api",
            "vendor_id": "virustotal_private_scanning",
            "vendor_name": "VirusTotal Private Scanning",
            "provider_families": ["artifact_scanning"],
            "title": "Files API | VirusTotal Docs",
            "url": "https://docs.virustotal.com/reference/files",
            "captured_on": CAPTURED_ON,
            "evidence_type": "api",
            "summary": "VirusTotal documents file upload and analysis APIs, but the workflow is still less aligned to private quarantine-state promotion than the stronger shortlist options.",
            "strength": "strong",
        },
    ]
    return rows


def build_kill_switches() -> list[dict[str, Any]]:
    return [
        {
            "kill_switch_id": "KS_EVID_001",
            "provider_family": "transcription",
            "applies_to": "mock_now_and_actual_later",
            "rule": "Reject any provider or mock that cannot keep `partial`, `ready`, `failed`, and `superseded` transcript states explicit.",
            "triggered_vendor_ids": "",
        },
        {
            "kill_switch_id": "KS_EVID_002",
            "provider_family": "artifact_scanning",
            "applies_to": "mock_now_and_actual_later",
            "rule": "Reject any scan provider that cannot represent `clean`, `suspicious`, `quarantined`, `unreadable`, and `failed` outcomes separately.",
            "triggered_vendor_ids": "",
        },
        {
            "kill_switch_id": "KS_EVID_003",
            "provider_family": "transcription",
            "applies_to": "actual_later",
            "rule": "Reject any live transcription provider whose callbacks cannot be treated as hints followed by trusted state re-fetch or whose deletion posture is unclear.",
            "triggered_vendor_ids": "",
        },
        {
            "kill_switch_id": "KS_EVID_004",
            "provider_family": "artifact_scanning",
            "applies_to": "actual_later",
            "rule": "Reject any scan provider that cannot route unsafe or unreadable artifacts into explicit quarantine and fallback review.",
            "triggered_vendor_ids": "",
        },
        {
            "kill_switch_id": "KS_EVID_005",
            "provider_family": "transcription",
            "applies_to": "actual_later",
            "rule": "Reject any provider whose official product posture warns against entering sensitive or personal information without a stronger healthcare contract path.",
            "triggered_vendor_ids": "google_speech_transcription",
        },
        {
            "kill_switch_id": "KS_EVID_006",
            "provider_family": "combined",
            "applies_to": "actual_later",
            "rule": "Reject any automatic single-suite winner if it couples transcript and scan failure domains more tightly than the adapter contract requires.",
            "triggered_vendor_ids": "aws_evidence_stack",
        },
        {
            "kill_switch_id": "KS_EVID_007",
            "provider_family": "artifact_scanning",
            "applies_to": "actual_later",
            "rule": "Reject any provider where scan completion implies safety or readability without a separate Vecells readiness and quarantine decision.",
            "triggered_vendor_ids": "",
        },
        {
            "kill_switch_id": "KS_EVID_008",
            "provider_family": "transcription",
            "applies_to": "actual_later",
            "rule": "Reject any provider that makes transcript completion look like clinical usability instead of derived evidence awaiting readiness assessment.",
            "triggered_vendor_ids": "",
        },
        {
            "kill_switch_id": "KS_EVID_009",
            "provider_family": "artifact_scanning",
            "applies_to": "actual_later",
            "rule": "Reject threat-intel-oriented services when portability, file handling, or quarantine orchestration are weaker than the shortlist alternatives.",
            "triggered_vendor_ids": "virustotal_private_scanning",
        },
        {
            "kill_switch_id": "KS_EVID_010",
            "provider_family": "transcription",
            "applies_to": "actual_later",
            "rule": "Reject any provider whose onboarding burden or cloud coupling would force seq_035 to choose storage, identity, and vendor stack together before the product contract is frozen.",
            "triggered_vendor_ids": "",
        },
    ]


def build_vendor_rows(dimensions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    vendors = [
        {
            "vendor_id": "vecells_transcript_readiness_twin",
            "vendor_name": "Vecells Transcript Readiness Twin",
            "provider_family": "transcription",
            "vendor_lane": "mock_only",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "yes",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Synthetic fixtures only. Deterministic resets and explicit supersession keep replay, deletion, and audit behavior local to the repo.",
            "quarantine_fit_score": 97,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "data/analysis/external_dependencies.json#dep_transcription_processing_provider",
                "data/analysis/external_account_inventory.csv#ACC_TRANSCRIPT_SHARED_DEV_PRINCIPAL",
                "prompt/034.md#Section A — Mock_now_execution",
            ],
            "notes": "Canonical local transcription twin. It must preserve readiness, coverage class, quality band, and supersession semantics before any real provider is admissible.",
            "project_model": "repository-local simulator service plus deterministic credential seed",
            "sandbox_posture": "full-fidelity synthetic mock",
            "pricing_notes": "No external spend.",
            "portability_notes": "This is the baseline contract the real-later shortlist must match.",
            "dimension_scores": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5),
            "evidence_ids": [],
        },
        {
            "vendor_id": "deepgram_transcription",
            "vendor_name": "Deepgram",
            "provider_family": "transcription",
            "vendor_lane": "shortlisted",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "partial",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Hosted service can callback results; private and self-hosted deployment options reduce retention lock-in.",
            "quarantine_fit_score": 78,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://developers.deepgram.com/docs/using-callbacks-to-return-transcripts-to-your-server",
                "https://developers.deepgram.com/docs/interim-results",
                "https://developers.deepgram.com/docs/deployment-options",
                "https://deepgram.com/pricing",
            ],
            "notes": "Focused transcription provider with strong async and streaming support. Callback authenticity remains a bounded weakness, so Vecells must treat callbacks as hints and re-fetch job state before promotion.",
            "project_model": "project plus scoped API keys",
            "sandbox_posture": "developer project and credits",
            "pricing_notes": "Usage-priced with explicit developer and enterprise paths.",
            "portability_notes": "Private deployment options reduce lock-in risk relative to cloud-only providers.",
            "dimension_scores": dims(5, 4, 5, 3, 4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 5, 4),
            "evidence_ids": [
                "ev_dg_callback",
                "ev_dg_prerecorded",
                "ev_dg_interim",
                "ev_dg_projects",
                "ev_dg_api_keys",
                "ev_dg_deployment",
                "ev_dg_pricing",
            ],
        },
        {
            "vendor_id": "assemblyai_transcription",
            "vendor_name": "AssemblyAI",
            "provider_family": "transcription",
            "vendor_lane": "shortlisted",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "partial",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Transcript deletion removes uploaded files; region selection and private deployment reduce retention ambiguity.",
            "quarantine_fit_score": 76,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://www.assemblyai.com/docs/deployment/webhooks",
                "https://www.assemblyai.com/docs/deployment/webhooks-for-streaming-speech-to-text",
                "https://www.assemblyai.com/docs/pre-recorded-audio/select-the-region",
                "https://www.assemblyai.com/docs/api-reference/transcripts/delete",
                "https://www.assemblyai.com/docs/deployment/private-deployment",
                "https://www.assemblyai.com/pricing",
            ],
            "notes": "AssemblyAI is strong on job callbacks, EU region selection, and deletion semantics. Like Deepgram, callback trust still needs Vecells-side replay fencing and trusted re-fetch.",
            "project_model": "account plus API key",
            "sandbox_posture": "developer account with webhook flows",
            "pricing_notes": "Usage-priced with private deployment options.",
            "portability_notes": "Private deployment and explicit delete APIs keep exit posture workable.",
            "dimension_scores": dims(4, 4, 5, 4, 4, 3, 4, 4, 4, 4, 4, 3, 4, 4, 5, 4),
            "evidence_ids": [
                "ev_aa_webhooks_prerecorded",
                "ev_aa_webhooks_streaming",
                "ev_aa_region",
                "ev_aa_delete",
                "ev_aa_private_deployment",
                "ev_aa_pricing",
            ],
        },
        {
            "vendor_id": "azure_speech_transcription",
            "vendor_name": "Azure AI Speech",
            "provider_family": "transcription",
            "vendor_lane": "candidate",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "partial",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Batch jobs integrate with customer storage and TTL; data privacy posture is stronger than many focused API vendors but the environment model is heavier.",
            "quarantine_fit_score": 74,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription-create",
                "https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription",
                "https://learn.microsoft.com/en-us/legal/cognitive-services/speech-service/speech-to-text/data-privacy-security",
            ],
            "notes": "Azure is technically credible and safer on storage and privacy than a toy API, but seq_035 would inherit storage, networking, and tenant setup before the product-side adapter is ready.",
            "project_model": "Azure resource plus storage account and webhook registration",
            "sandbox_posture": "cloud subscription resources",
            "pricing_notes": "Cloud subscription pricing; more infrastructure coupling than focused vendors.",
            "portability_notes": "Containers help, but the account and storage model still couples provider choice with broader platform choices.",
            "dimension_scores": dims(4, 4, 4, 4, 5, 4, 2, 3, 3, 4, 4, 3, 3, 4, 4, 3),
            "evidence_ids": ["ev_azure_batch_create", "ev_azure_batch_overview", "ev_azure_privacy"],
        },
        {
            "vendor_id": "aws_transcribe_transcription",
            "vendor_name": "Amazon Transcribe",
            "provider_family": "transcription",
            "vendor_lane": "candidate",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "no",
            "supports_replay_protection": "n/a",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Batch output is tightly coupled to S3 input and output configuration, which is good for audit but broadens the infrastructure surface too early.",
            "quarantine_fit_score": 70,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://docs.aws.amazon.com/transcribe/latest/dg/streaming-partial-results.html",
                "https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html",
            ],
            "notes": "Amazon Transcribe has strong partial-result semantics, but the lack of first-class callback delivery and the S3/KMS coupling make it a weaker seq_035 handoff than the shortlist pair.",
            "project_model": "AWS account, IAM, S3 input/output buckets",
            "sandbox_posture": "cloud account and bucket policy driven",
            "pricing_notes": "Usage-based AWS billing with broader account guardrails needed.",
            "portability_notes": "Output-storage coupling increases exit cost relative to focused API providers.",
            "dimension_scores": dims(4, 4, 5, 3, 4, 4, 3, 3, 3, 4, 4, 3, 3, 4, 4, 3),
            "evidence_ids": ["ev_aws_transcribe_partial", "ev_aws_transcribe_io"],
        },
        {
            "vendor_id": "google_speech_transcription",
            "vendor_name": "Google Cloud Speech-to-Text",
            "provider_family": "transcription",
            "vendor_lane": "rejected",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "no",
            "supports_replay_protection": "n/a",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Regional endpoints and batch APIs exist, but the official product page warning about sensitive or personal data is not acceptable for this use case without much stronger contractual evidence.",
            "quarantine_fit_score": 55,
            "kill_switch_reason_if_any": "Official product posture warns against entering sensitive, confidential, or personal information; that is incompatible with this evidence-processing seam until clarified with stronger contract evidence.",
            "source_refs": [
                "https://cloud.google.com/speech-to-text",
                "https://cloud.google.com/speech-to-text/docs/endpoints",
                "https://cloud.google.com/speech-to-text/pricing",
            ],
            "notes": "This is not a product-capability rejection. It is a current-official-docs rejection for this healthcare evidence-processing seam.",
            "project_model": "Google Cloud project and recognizer resources",
            "sandbox_posture": "cloud project and billing account",
            "pricing_notes": "Published pricing exists, but the current product warning dominates.",
            "portability_notes": "Standard cloud portability issues plus unresolved policy fit.",
            "dimension_scores": dims(4, 4, 4, 3, 2, 2, 3, 3, 3, 4, 4, 3, 3, 3, 4, 3),
            "evidence_ids": ["ev_google_overview", "ev_google_endpoints", "ev_google_pricing"],
        },
        {
            "vendor_id": "vecells_artifact_quarantine_twin",
            "vendor_name": "Vecells Artifact Quarantine Twin",
            "provider_family": "artifact_scanning",
            "vendor_lane": "mock_only",
            "supports_async_jobs": "yes",
            "supports_partial_results": "n/a",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "yes",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Synthetic-only signature packs, explicit quarantine manifests, and deterministic resets keep unsafe evidence local and replayable.",
            "quarantine_fit_score": 99,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "data/analysis/external_dependencies.json#dep_malware_scanning_provider",
                "data/analysis/external_account_inventory.csv#ACC_SCAN_SHARED_DEV_PRINCIPAL",
                "prompt/034.md#Section A — Mock_now_execution",
            ],
            "notes": "Canonical local artifact-scan twin. It must preserve clean, suspicious, quarantined, unreadable, and failed outcomes without silently passing evidence onward.",
            "project_model": "repository-local simulator service plus signature fixture dataset",
            "sandbox_posture": "full-fidelity synthetic mock",
            "pricing_notes": "No external spend.",
            "portability_notes": "This twin is the acceptance contract for any later managed scanner.",
            "dimension_scores": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 4, 5),
            "evidence_ids": [],
        },
        {
            "vendor_id": "aws_guardduty_s3_scan",
            "vendor_name": "GuardDuty Malware Protection for S3",
            "provider_family": "artifact_scanning",
            "vendor_lane": "shortlisted",
            "supports_async_jobs": "yes",
            "supports_partial_results": "n/a",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "yes",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Results stay in AWS control planes and S3 tags/events instead of direct file round-trips through a vendor callback endpoint.",
            "quarantine_fit_score": 93,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
                "https://docs.aws.amazon.com/guardduty/latest/ug/how-malware-protection-for-s3-gdu-works.html",
                "https://docs.aws.amazon.com/guardduty/latest/ug/monitoring-malware-protection-s3-scans-gdu.html",
                "https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html",
                "https://docs.aws.amazon.com/guardduty/latest/ug/pricing-malware-protection-for-s3-guardduty.html",
            ],
            "notes": "Best fit for quarantine-first artifact handling because results are event-driven, taggable, and explicit about failure or unsupported states. The tradeoff is AWS account coupling.",
            "project_model": "AWS account plus GuardDuty protection plan, IAM role, and EventBridge",
            "sandbox_posture": "cloud account and S3 prefix-scoped plans",
            "pricing_notes": "Per-object and per-GB pricing; strong need for spend boundaries.",
            "portability_notes": "Good event semantics, but higher account and storage coupling than API-key scanners.",
            "dimension_scores": dims(5, 5, 5, 5, 5, 4, 3, 3, 3, 5, 4, 3, 3, 4, 3, 3),
            "evidence_ids": [
                "ev_guardduty_enable",
                "ev_guardduty_how",
                "ev_guardduty_monitoring",
                "ev_guardduty_eventbridge",
                "ev_guardduty_pricing",
            ],
        },
        {
            "vendor_id": "opswat_metadefender_cloud",
            "vendor_name": "OPSWAT MetaDefender Cloud",
            "provider_family": "artifact_scanning",
            "vendor_lane": "shortlisted",
            "supports_async_jobs": "yes",
            "supports_partial_results": "n/a",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "no",
            "supports_replay_protection": "n/a",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Cloud-service regions and explicit API posture are documented; file handling remains more controllable than threat-intel-first services.",
            "quarantine_fit_score": 88,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://www.opswat.com/products/metadefender/cloud",
                "https://www.opswat.com/docs/mdcloud/integrations/v4-api",
                "https://www.opswat.com/docs/my/2025.1.3/home/cloud-services",
            ],
            "notes": "Strong multi-engine scan vendor with explicit API docs and region story. It is weaker than GuardDuty on event-driven posture but stronger than lighter-weight API scanners for quarantine evidence.",
            "project_model": "tenant account plus API key",
            "sandbox_posture": "cloud API access",
            "pricing_notes": "Commercial managed service; cost governance must be explicit.",
            "portability_notes": "API posture is clear, but multi-engine semantics still need adapter-bound normalization.",
            "dimension_scores": dims(4, 4, 4, 4, 4, 3, 4, 4, 4, 4, 4, 3, 3, 4, 3, 4),
            "evidence_ids": ["ev_opswat_product", "ev_opswat_api", "ev_opswat_regions"],
        },
        {
            "vendor_id": "cloudmersive_virus_scan",
            "vendor_name": "Cloudmersive Virus Scan API",
            "provider_family": "artifact_scanning",
            "vendor_lane": "candidate",
            "supports_async_jobs": "no",
            "supports_partial_results": "n/a",
            "supports_confidence_or_quality_bands": "limited",
            "supports_webhooks": "no",
            "supports_replay_protection": "n/a",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Deployment options are flexible, but the API posture is more scan-request oriented than quarantine-workflow oriented.",
            "quarantine_fit_score": 72,
            "kill_switch_reason_if_any": "",
            "source_refs": [
                "https://cloudmersive.com/virus-api",
                "https://api.cloudmersive.com/docs/virus.asp",
                "https://cloudmersive.com/pricing",
            ],
            "notes": "Useful portable API-key scanner, but it scores below the shortlist because it is lighter on explicit asynchronous evidence states and webhook-friendly eventing.",
            "project_model": "account plus API key",
            "sandbox_posture": "cloud API or dedicated/on-prem deployment",
            "pricing_notes": "Hosted or dedicated pricing paths exist.",
            "portability_notes": "Deployment flexibility is good, but audit and state semantics are thinner than the shortlist.",
            "dimension_scores": dims(3, 4, 3, 3, 4, 3, 4, 3, 3, 3, 3, 3, 4, 3, 4, 3),
            "evidence_ids": ["ev_cloudmersive_product", "ev_cloudmersive_api", "ev_cloudmersive_pricing"],
        },
        {
            "vendor_id": "virustotal_private_scanning",
            "vendor_name": "VirusTotal Private Scanning",
            "provider_family": "artifact_scanning",
            "vendor_lane": "rejected",
            "supports_async_jobs": "yes",
            "supports_partial_results": "n/a",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "no",
            "supports_replay_protection": "n/a",
            "supports_region_controls": "limited",
            "retention_and_deletion_notes": "Private scanning is isolated from the public corpus, but the product remains oriented to threat-intel workflows rather than quarantine-first evidence promotion.",
            "quarantine_fit_score": 40,
            "kill_switch_reason_if_any": "Threat-intel-oriented scanning and weaker quarantine workflow fit make it a poor match for governed patient-evidence intake.",
            "source_refs": [
                "https://docs.virustotal.com/docs/private-scanning",
                "https://docs.virustotal.com/reference/files",
            ],
            "notes": "Rejected because the operational model fits analyst triage better than patient-evidence quarantine and bounded review.",
            "project_model": "commercial account and API",
            "sandbox_posture": "commercial service",
            "pricing_notes": "Commercial engagement required; no advantage over better shortlist options here.",
            "portability_notes": "Adapter fit is weaker than GuardDuty or OPSWAT for this seam.",
            "dimension_scores": dims(2, 2, 2, 2, 1, 1, 3, 2, 2, 3, 3, 2, 2, 2, 2, 2),
            "evidence_ids": ["ev_vt_private_scanning", "ev_vt_files_api"],
        },
        {
            "vendor_id": "vecells_evidence_signal_fabric",
            "vendor_name": "Vecells Evidence Signal Fabric",
            "provider_family": "combined",
            "vendor_lane": "mock_only",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "yes",
            "supports_replay_protection": "yes",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "Repository-local only. All transcript and scan events remain synthetic, replayable, and explicit.",
            "quarantine_fit_score": 98,
            "kill_switch_reason_if_any": "",
            "source_refs": ["prompt/034.md#Mission", "prompt/035.md#Mission"],
            "notes": "Combined internal mock lane only. It exists to prove readiness, quarantine, and fallback semantics before any live vendor is trusted.",
            "project_model": "internal twin composition",
            "sandbox_posture": "full-fidelity synthetic mock",
            "pricing_notes": "No external spend.",
            "portability_notes": "The actual-later strategy must adapt to this internal contract, not replace it.",
            "dimension_scores": dims(5, 5, 5, 5, 5, 4, 5, 5, 5, 5, 5, 5, 5, 5, 4, 5),
            "evidence_ids": [],
        },
        {
            "vendor_id": "aws_evidence_stack",
            "vendor_name": "AWS Evidence Stack",
            "provider_family": "combined",
            "vendor_lane": "rejected",
            "supports_async_jobs": "yes",
            "supports_partial_results": "yes",
            "supports_confidence_or_quality_bands": "yes",
            "supports_webhooks": "partial",
            "supports_replay_protection": "yes",
            "supports_region_controls": "yes",
            "retention_and_deletion_notes": "AWS can cover both families, but the combined stack would force shared storage, IAM, and event-plane choices too early.",
            "quarantine_fit_score": 68,
            "kill_switch_reason_if_any": "A single AWS stack would over-couple transcript and scan failure domains, storage posture, and onboarding friction before the adapter contract is frozen.",
            "source_refs": [
                "https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html",
                "https://docs.aws.amazon.com/guardduty/latest/ug/enable-malware-protection-s3-bucket.html",
                "https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html",
            ],
            "notes": "Rejected as the default suite winner. Individual AWS services remain viable where their family-specific fit is strong.",
            "project_model": "AWS account and shared control plane",
            "sandbox_posture": "cloud account and shared event/storage model",
            "pricing_notes": "Billing and operational overhead spread across multiple AWS services.",
            "portability_notes": "Suite coupling is the main reason for rejection, not the raw technical capability.",
            "dimension_scores": dims(4, 4, 4, 4, 4, 4, 2, 3, 3, 4, 4, 2, 2, 4, 3, 2),
            "evidence_ids": ["ev_aws_transcribe_io", "ev_guardduty_enable", "ev_guardduty_eventbridge"],
        },
    ]

    for vendor in vendors:
        vendor["mock_now_fit_score"] = weighted_score(vendor["dimension_scores"], dimensions, "mock_now")
        vendor["actual_later_fit_score"] = weighted_score(vendor["dimension_scores"], dimensions, "actual_later")
    return vendors


def build_selected_access_rows(account_inventory: list[dict[str, str]]) -> list[dict[str, str]]:
    selected_ids = {
        "ACC_TRANSCRIPT_SHARED_DEV_PRINCIPAL",
        "SEC_TRANSCRIPT_SHARED_DEV_WEBHOOK",
        "ACC_SCAN_SHARED_DEV_PRINCIPAL",
        "DATA_SCAN_SHARED_DEV_SIGNATURE_PACK",
    }
    return [row for row in account_inventory if row["account_or_secret_id"] in selected_ids]


def build_lane_matrix() -> list[dict[str, str]]:
    return [
        {
            "provider_family": "transcription",
            "mock_provider_ids": "vecells_transcript_readiness_twin",
            "actual_shortlisted_vendor_ids": "deepgram_transcription;assemblyai_transcription",
            "recommended_strategy": "focused_transcription_pair",
            "mock_lane_summary": "Keep transcript readiness, coverage classes, quality bands, and supersession semantics internal first.",
            "actual_lane_summary": "Admit one focused STT provider later, but only behind callback-hint plus trusted re-fetch rules.",
            "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION;LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW;ALLOW_REAL_PROVIDER_MUTATION;ALLOW_SPEND",
            "seq035_handoff_focus": "project or account creation, API keys, callback endpoint prep, region choice, and retention deletion posture",
        },
        {
            "provider_family": "artifact_scanning",
            "mock_provider_ids": "vecells_artifact_quarantine_twin",
            "actual_shortlisted_vendor_ids": "aws_guardduty_s3_scan;opswat_metadefender_cloud",
            "recommended_strategy": "quarantine_first_scan_pair",
            "mock_lane_summary": "Keep artifact quarantine manifests, unsafe and unreadable outcomes, and fallback review internal first.",
            "actual_lane_summary": "Use a managed scanner later only when quarantine and audit semantics remain stronger than product convenience.",
            "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION;LIVE_GATE_TRANSCRIPT_SAFETY_REVIEW;ALLOW_REAL_PROVIDER_MUTATION;ALLOW_SPEND",
            "seq035_handoff_focus": "protection-plan or API tenant creation, eventing, region choice, retention, and quarantine policy mapping",
        },
        {
            "provider_family": "combined",
            "mock_provider_ids": "vecells_evidence_signal_fabric",
            "actual_shortlisted_vendor_ids": "",
            "recommended_strategy": "reject_single_suite_auto_win",
            "mock_lane_summary": "The internal combined mock exists only to prove end-to-end readiness and quarantine law before later provisioning.",
            "actual_lane_summary": "No combined suite is shortlisted by default; transcript and scan providers remain separable.",
            "live_gate_refs": "GATE_EXTERNAL_TO_FOUNDATION;ALLOW_REAL_PROVIDER_MUTATION;ALLOW_SPEND",
            "seq035_handoff_focus": "keep seq_035 family provisioning split even if one cloud vendor supplies multiple primitives",
        },
    ]


def build_decision_log() -> list[dict[str, Any]]:
    return [
        {
            "decision_id": "DEC_EVID_001",
            "title": "Split providers remain the default actual-later posture",
            "status": "accepted",
            "summary": "Transcription and artifact scanning are kept independently selectable to prevent one vendor stack from becoming silent product truth.",
            "impacted_vendor_ids": ["deepgram_transcription", "assemblyai_transcription", "aws_guardduty_s3_scan", "opswat_metadefender_cloud", "aws_evidence_stack"],
        },
        {
            "decision_id": "DEC_EVID_002",
            "title": "The internal mock lane stays authoritative for simulator fidelity",
            "status": "accepted",
            "summary": "The transcript and scan twins are the development baseline, not disposable placeholders.",
            "impacted_vendor_ids": ["vecells_transcript_readiness_twin", "vecells_artifact_quarantine_twin", "vecells_evidence_signal_fabric"],
        },
        {
            "decision_id": "DEC_EVID_003",
            "title": "Callback deliveries are hints, not proof",
            "status": "accepted",
            "summary": "Even shortlisted providers may only advance readiness through Vecells-side job-state re-fetch and governed evidence assimilation.",
            "impacted_vendor_ids": ["deepgram_transcription", "assemblyai_transcription", "azure_speech_transcription"],
        },
        {
            "decision_id": "DEC_EVID_004",
            "title": "Google Cloud Speech-to-Text is rejected on current official posture",
            "status": "accepted",
            "summary": "The current official product warning about sensitive or personal information is too strong to ignore for this seam.",
            "impacted_vendor_ids": ["google_speech_transcription"],
        },
        {
            "decision_id": "DEC_EVID_005",
            "title": "Threat-intel-first scanning is not enough for patient evidence quarantine",
            "status": "accepted",
            "summary": "VirusTotal Private Scanning is rejected because quarantine workflow fit is weaker than the shortlist alternatives.",
            "impacted_vendor_ids": ["virustotal_private_scanning"],
        },
        {
            "decision_id": "DEC_EVID_006",
            "title": "Local or self-hosted scanning still remains preferable in some deployments",
            "status": "accepted_with_guardrails",
            "summary": "If binary evidence cannot leave the platform trust boundary or a regulator demands deterministic quarantine control, keep scanning local and treat managed vendors as optional later augmentation.",
            "impacted_vendor_ids": ["vecells_artifact_quarantine_twin", "opswat_metadefender_cloud", "cloudmersive_virus_scan", "aws_guardduty_s3_scan"],
        },
    ]


def render_vendor_universe_doc(shortlist: dict[str, Any], vendors: list[dict[str, Any]]) -> str:
    family_rows = []
    for family in ("transcription", "artifact_scanning", "combined"):
        matching = [row for row in vendors if row["provider_family"] == family]
        family_rows.append(
            [
                family,
                str(len(matching)),
                ",".join(sorted({row["vendor_lane"] for row in matching})),
                ",".join(row["vendor_id"] for row in matching if row["vendor_lane"] == "shortlisted") or "none",
            ]
        )

    universe_rows = []
    for row in vendors:
        universe_rows.append(
            [
                row["vendor_id"],
                row["vendor_name"],
                row["provider_family"],
                row["vendor_lane"],
                str(row["actual_later_fit_score"]),
                str(row["quarantine_fit_score"]),
                row["supports_webhooks"],
                row["supports_region_controls"],
                row["notes"],
            ]
        )

    return textwrap.dedent(
        f"""
        # 34 Vendor Universe Transcription And Scanning

        This pack freezes the vendor universe for the evidence-processing seam before seq_035 attempts any real project provisioning. It keeps transcript readiness, artifact quarantine, fallback review, and audit export as product contracts rather than provider conveniences.

        ## Summary

        - vendor rows: {shortlist["summary"]["vendor_rows"]}
        - lane counts: {json.dumps(shortlist["summary"]["lane_counts"])}
        - evidence rows: {shortlist["summary"]["evidence_rows"]}
        - selected mock rows: {shortlist["summary"]["lane_counts"]["mock_only"]}
        - Phase 0 entry posture inherited from seq_020: `{shortlist["phase0_gate_posture"]["verdict"]}`
        - recommended strategy: `{shortlist["recommended_strategy"]["strategy_id"]}`

        ## Family Coverage

        {markdown_table(["Family", "Rows", "Lanes", "Shortlisted"], family_rows)}

        ## Vendor Universe

        {markdown_table(
            ["Vendor ID", "Vendor", "Family", "Lane", "Actual score", "Quarantine score", "Webhooks", "Region controls", "Notes"],
            universe_rows,
        )}
        """
    ).strip()


def render_mock_doc(shortlist: dict[str, Any], selected_access_rows: list[dict[str, str]]) -> str:
    access_rows = [
        [
            row["account_or_secret_id"],
            row["dependency_family"],
            row["record_class"],
            row["current_lane"],
            row["notes"],
        ]
        for row in selected_access_rows
    ]

    return textwrap.dedent(
        f"""
        # 34 Mock Provider Lane For Evidence Processing

        The mock-now lane is intentionally stronger than a toy stub. Its job is to prove evidence-processing semantics before any real provider is allowed to shape product truth.

        ## Selected Mock Lane

        - transcription twin: `vecells_transcript_readiness_twin`
        - artifact-scan twin: `vecells_artifact_quarantine_twin`
        - combined mock signal fabric: `vecells_evidence_signal_fabric`
        - shared callback law: provider callbacks are hints only; Vecells re-fetches trusted job state before readiness or quarantine promotion
        - Phase 0 posture: `{shortlist["phase0_gate_posture"]["verdict"]}`

        ## Fidelity Law

        The mock lane must preserve:

        - transcript states: `not_started | queued | running | partial | ready | failed | superseded`
        - transcript quality bands: `fragmentary | reviewable | safety_usable`
        - coverage classes: `identity_phrase | symptom_phrase | medication_phrase | callback_number | freeform_narrative`
        - scan outcomes: `clean | suspicious | quarantined | unreadable | failed`
        - artifact-hash and provenance hooks
        - fallback review whenever transcript or scan meaning is insufficient
        - no direct elevation from processing success to clinical truth

        ## Selected Access Rows

        {markdown_table(["Row", "Dependency", "Class", "Lane", "Notes"], access_rows)}

        ## Why Internal Mock First

        - provider completion does not equal evidence readiness
        - scan completion does not equal safety or readability
        - replay, supersession, contradiction, and quarantine promotion need deterministic local fixtures before live services are safe to evaluate
        - seq_035 must provision later from this contract, not replace it
        """
    ).strip()


def render_shortlist_doc(shortlist: dict[str, Any]) -> str:
    family_tables = []
    for family, rows in shortlist["shortlist_by_family"].items():
        if family == "combined":
            continue
        table_rows = [
            [
                row["vendor_id"],
                row["vendor_name"],
                str(row["actual_later_fit_score"]),
                row["supports_webhooks"],
                row["supports_region_controls"],
                row["retention_and_deletion_notes"],
            ]
            for row in rows
        ]
        family_tables.append(
            f"### {family.replace('_', ' ').title()}\n\n"
            + markdown_table(
                ["Vendor ID", "Vendor", "Actual score", "Webhooks", "Region", "Retention and deletion notes"],
                table_rows,
            )
        )

    candidate_rows = []
    for family in ("transcription", "artifact_scanning"):
        for row in shortlist["candidate_by_family"][family]:
            candidate_rows.append([row["vendor_id"], row["vendor_name"], family, row["notes"]])

    rejected_rows = []
    for family in ("transcription", "artifact_scanning", "combined"):
        for row in shortlist["rejected_by_family"][family]:
            rejected_rows.append(
                [row["vendor_id"], row["vendor_name"], family, row["kill_switch_reason_if_any"]]
            )

    return textwrap.dedent(
        f"""
        # 34 Actual Provider Shortlist And Due Diligence

        Real-provider work remains gated, but the market research and ranking are current enough to drive seq_035 deliberately instead of guessing later.

        ## Recommended Strategy

        - strategy: `{shortlist["recommended_strategy"]["strategy_id"]}`
        - label: {shortlist["recommended_strategy"]["label"]}
        - summary: {shortlist["recommended_strategy"]["summary"]}
        - no-purchase rule: this task does not authorize any real sign-up, project creation, spend, or PHI upload

        ## Shortlisted Providers

        {'\n\n'.join(family_tables)}

        ## Candidates Kept For Reference

        {markdown_table(["Vendor ID", "Vendor", "Family", "Why not shortlisted"], candidate_rows)}

        ## Rejections

        {markdown_table(["Vendor ID", "Vendor", "Family", "Kill switch"], rejected_rows)}

        ## Seq_035 Handoff

        - transcription provisioning should prepare project or account creation, API keys, callback endpoints, region choice, and retention deletion posture
        - artifact-scanning provisioning should prepare either protection-plan onboarding or API-tenant setup, quarantine event hooks, region choice, and spend limits
        - combined-suite provisioning is intentionally out of scope
        """
    ).strip()


def render_decision_log_doc(decision_log: list[dict[str, Any]], kill_switches: list[dict[str, Any]]) -> str:
    decision_rows = [
        [row["decision_id"], row["status"], row["title"], row["summary"]] for row in decision_log
    ]
    kill_rows = [
        [row["kill_switch_id"], row["provider_family"], row["applies_to"], row["rule"], row["triggered_vendor_ids"] or "n/a"]
        for row in kill_switches
    ]
    return textwrap.dedent(
        f"""
        # 34 Vendor Selection Decision Log

        {markdown_table(["Decision ID", "Status", "Title", "Summary"], decision_rows)}

        ## Kill Switch Register

        {markdown_table(["Kill switch", "Family", "Applies to", "Rule", "Triggered vendors"], kill_rows)}
        """
    ).strip()


def render_evidence_doc(evidence_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["evidence_id"],
            row["vendor_name"],
            row["evidence_type"],
            row["captured_on"],
            f"[source]({row['url']})",
            row["summary"],
        ]
        for row in evidence_rows
    ]
    return textwrap.dedent(
        f"""
        # 34 Vendor Research Evidence Register

        This register records the official sources used during seq_034. Retrieval date is `{CAPTURED_ON}` for every row unless a later recrawl is needed.

        {markdown_table(["Evidence ID", "Vendor", "Type", "Captured on", "Link", "Summary"], rows)}
        """
    ).strip()


def build_atlas_html(model: dict[str, Any]) -> str:
    payload = json.dumps(model, separators=(",", ":"))
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>34 Evidence Signal Atlas</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23155EEF'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='34' fill='white'%3EV%3C/text%3E%3C/svg%3E" />
  <style>
    :root {{
      color-scheme: light;
      --canvas: #F6F8FB;
      --panel: #FFFFFF;
      --inset: #EEF3F8;
      --text-strong: #101828;
      --text-default: #1D2939;
      --text-muted: #667085;
      --border-subtle: #E4E7EC;
      --border-default: #D0D5DD;
      --primary: #155EEF;
      --secondary: #7A5AF8;
      --transcript: #0E9384;
      --scan: #B54708;
      --blocked: #C24141;
      --success: #12B76A;
      --shadow: 0 18px 38px rgba(16, 24, 40, 0.08);
      --radius-lg: 22px;
      --radius-md: 16px;
      --radius-sm: 999px;
      --header-height: 72px;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(21, 94, 239, 0.08), transparent 35%),
        radial-gradient(circle at top right, rgba(122, 90, 248, 0.08), transparent 32%),
        var(--canvas);
      color: var(--text-default);
    }}
    .shell {{
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px;
    }}
    .sticky-header {{
      position: sticky;
      top: 0;
      z-index: 20;
      min-height: var(--header-height);
      display: grid;
      grid-template-columns: 1.4fr 1fr auto;
      gap: 16px;
      align-items: center;
      padding: 16px 20px;
      border: 1px solid rgba(255,255,255,0.45);
      border-radius: 24px;
      backdrop-filter: blur(18px);
      background: rgba(246, 248, 251, 0.86);
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .mark {{
      width: 40px;
      height: 40px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      color: white;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
    }}
    .eyebrow {{
      font-size: 12px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 4px;
    }}
    h1 {{
      margin: 0;
      font-size: 24px;
      line-height: 1.2;
      color: var(--text-strong);
    }}
    .header-metrics {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }}
    .metric {{
      background: rgba(255,255,255,0.9);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 12px 14px;
    }}
    .metric-label {{
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }}
    .metric-value {{
      font-size: 19px;
      font-weight: 700;
      color: var(--text-strong);
    }}
    .controls {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }}
    .segmented,
    .chip-row {{
      display: inline-flex;
      gap: 8px;
      flex-wrap: wrap;
    }}
    button,
    select {{
      font: inherit;
    }}
    .chip,
    .toggle button,
    .tab {{
      min-height: 44px;
      padding: 0 16px;
      border-radius: 999px;
      border: 1px solid var(--border-default);
      background: var(--panel);
      color: var(--text-default);
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease, background 120ms ease, color 120ms ease;
    }}
    .chip:hover,
    .toggle button:hover,
    .tab:hover,
    .provider-card:hover {{
      transform: translateY(-1px);
    }}
    .chip.is-active,
    .toggle button.is-active,
    .tab.is-active {{
      background: var(--text-strong);
      border-color: var(--text-strong);
      color: white;
    }}
    .toolbar {{
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 18px;
    }}
    .search {{
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      border-radius: 18px;
      background: var(--panel);
      border: 1px solid var(--border-subtle);
      padding: 0 14px;
    }}
    .search input {{
      border: 0;
      background: transparent;
      width: 100%;
      font: inherit;
      color: var(--text-default);
      outline: none;
    }}
    .panel-grid {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 20px;
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }}
    .panel-header {{
      padding: 18px 20px 0;
    }}
    .panel-title {{
      margin: 0;
      font-size: 18px;
      color: var(--text-strong);
    }}
    .panel-subtitle {{
      margin: 8px 0 0;
      color: var(--text-muted);
      font-size: 14px;
    }}
    .provider-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      padding: 20px;
    }}
    .provider-card {{
      min-height: 180px;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid var(--border-subtle);
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(238,243,248,0.9));
      display: grid;
      gap: 12px;
      cursor: pointer;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }}
    .provider-card.is-selected {{
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(21, 94, 239, 0.14);
    }}
    .provider-top {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }}
    .provider-name {{
      font-size: 18px;
      font-weight: 700;
      color: var(--text-strong);
      margin-bottom: 2px;
    }}
    .mono {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      color: var(--text-muted);
    }}
    .lane-pill {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 0 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid var(--border-default);
    }}
    .lane-shortlisted {{ color: var(--success); border-color: rgba(18, 183, 106, 0.24); background: rgba(18, 183, 106, 0.08); }}
    .lane-candidate {{ color: var(--primary); border-color: rgba(21, 94, 239, 0.24); background: rgba(21, 94, 239, 0.08); }}
    .lane-rejected {{ color: var(--blocked); border-color: rgba(194, 65, 65, 0.26); background: rgba(194, 65, 65, 0.08); }}
    .lane-mock_only {{ color: var(--secondary); border-color: rgba(122, 90, 248, 0.24); background: rgba(122, 90, 248, 0.08); }}
    .score-strip {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }}
    .score-box {{
      background: rgba(255,255,255,0.92);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 10px 12px;
    }}
    .score-label {{
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }}
    .score-value {{
      font-size: 18px;
      font-weight: 700;
      color: var(--text-strong);
    }}
    .tags {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }}
    .tag {{
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--inset);
      color: var(--text-default);
      font-size: 12px;
    }}
    .drawer {{
      padding: 20px;
      display: grid;
      gap: 18px;
      align-content: start;
    }}
    .drawer-section {{
      display: grid;
      gap: 10px;
      padding: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(238,243,248,0.92));
      border: 1px solid var(--border-subtle);
      border-radius: 18px;
    }}
    .drawer-section h3 {{
      margin: 0;
      font-size: 15px;
      color: var(--text-strong);
    }}
    .drawer-list {{
      display: grid;
      gap: 10px;
    }}
    .evidence-item {{
      padding: 12px;
      border-radius: 14px;
      background: var(--panel);
      border: 1px solid var(--border-subtle);
    }}
    .evidence-item a {{
      color: var(--primary);
      text-decoration: none;
    }}
    .lower-strip {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 20px;
      margin-top: 20px;
    }}
    .viz {{
      padding: 20px;
    }}
    .coverage-grid {{
      display: grid;
      gap: 12px;
    }}
    .coverage-row {{
      display: grid;
      grid-template-columns: 160px 1fr;
      gap: 12px;
      align-items: center;
    }}
    .coverage-track {{
      min-height: 18px;
      border-radius: 999px;
      background: var(--inset);
      overflow: hidden;
      position: relative;
    }}
    .coverage-fill {{
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: 999px;
    }}
    .bar-chart {{
      display: grid;
      gap: 10px;
    }}
    .bar-row {{
      display: grid;
      grid-template-columns: 1fr 120px;
      gap: 12px;
      align-items: center;
    }}
    .bar-track {{
      height: 12px;
      border-radius: 999px;
      background: var(--inset);
      overflow: hidden;
    }}
    .bar-fill {{
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      border-radius: 999px;
    }}
    .table-wrap {{
      overflow: auto;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }}
    th, td {{
      padding: 10px 8px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
      vertical-align: top;
    }}
    th {{
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }}
    .empty {{
      padding: 28px 20px;
      color: var(--text-muted);
    }}
    @media (max-width: 1120px) {{
      .sticky-header,
      .toolbar,
      .panel-grid,
      .lower-strip {{
        grid-template-columns: 1fr;
      }}
      .controls {{
        justify-content: flex-start;
      }}
      .header-metrics {{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
    }}
    @media (max-width: 720px) {{
      .shell {{
        padding: 14px;
      }}
      .sticky-header {{
        padding: 14px;
      }}
      .provider-grid {{
        grid-template-columns: 1fr;
        padding: 14px;
      }}
      .drawer,
      .viz {{
        padding: 14px;
      }}
      .coverage-row {{
        grid-template-columns: 1fr;
      }}
    }}
    @media (prefers-reduced-motion: reduce) {{
      *,
      *::before,
      *::after {{
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }}
    }}
  </style>
</head>
<body>
  <main class="shell" data-testid="vendor-atlas-shell">
    <section class="sticky-header" data-testid="sticky-header">
      <div class="brand">
        <div class="mark">V</div>
        <div>
          <div class="eyebrow">Evidence_Signal_Atlas · EVIDENCE_PROCESSING_ATLAS</div>
          <h1>Evidence Signal Atlas</h1>
        </div>
      </div>
      <div class="header-metrics">
        <div class="metric"><div class="metric-label">Shortlisted</div><div class="metric-value" id="metric-shortlisted"></div></div>
        <div class="metric"><div class="metric-label">Rejected</div><div class="metric-value" id="metric-rejected"></div></div>
        <div class="metric"><div class="metric-label">Mock lane</div><div class="metric-value" id="metric-mock"></div></div>
        <div class="metric"><div class="metric-label">Freshness</div><div class="metric-value" id="metric-freshness"></div></div>
      </div>
      <div class="controls">
        <div class="segmented" role="tablist" aria-label="Provider family tabs">
          <button class="tab is-active" id="tab-transcription" data-testid="tab-transcription" data-family="transcription" role="tab" aria-selected="true">Transcription</button>
          <button class="tab" id="tab-artifact_scanning" data-testid="tab-artifact_scanning" data-family="artifact_scanning" role="tab" aria-selected="false">Artifact Scanning</button>
          <button class="tab" id="tab-mock_lane" data-testid="tab-mock_lane" data-family="mock_lane" role="tab" aria-selected="false">Mock Lane</button>
          <button class="tab" id="tab-actual_lane" data-testid="tab-actual_lane" data-family="actual_lane" role="tab" aria-selected="false">Actual Lane</button>
        </div>
      </div>
    </section>

    <section class="toolbar">
      <label class="search">
        <span>Search</span>
        <input id="search-input" type="search" placeholder="Vendor, note, or reason" />
      </label>
      <div class="toggle" data-testid="lane-toggle">
        <button id="lane-mock" type="button">Mock lane</button>
        <button id="lane-actual" type="button" class="is-active">Actual lane</button>
      </div>
      <select id="sort-select" aria-label="Sort vendors">
        <option value="actual_later_fit_score">Sort by actual score</option>
        <option value="mock_now_fit_score">Sort by mock score</option>
        <option value="quarantine_fit_score">Sort by quarantine fit</option>
        <option value="vendor_name">Sort by name</option>
      </select>
      <div class="chip-row" aria-label="Dimension filters">
        <button class="chip is-active" type="button" data-filter="all">All</button>
        <button class="chip" type="button" data-filter="webhooks">Webhooks</button>
        <button class="chip" type="button" data-filter="regions">Regions</button>
        <button class="chip" type="button" data-filter="quarantine">High quarantine fit</button>
      </div>
    </section>

    <section class="panel-grid">
      <section class="panel">
        <div class="panel-header">
          <h2 class="panel-title" id="panel-title">Transcription Shortlist</h2>
          <p class="panel-subtitle" id="panel-subtitle">Focused STT providers ranked against readiness, ambiguity, and portability law.</p>
        </div>
        <div class="provider-grid" id="provider-grid" data-testid="provider-grid"></div>
        <div class="empty" id="provider-empty" hidden>No vendors match the current filter set.</div>
      </section>

      <aside class="panel drawer" data-testid="evidence-drawer">
        <section class="drawer-section">
          <h3 id="drawer-title">Select a vendor</h3>
          <div id="drawer-summary" class="panel-subtitle">Open a provider card to inspect due-diligence evidence, fit scores, and kill switches.</div>
        </section>
        <section class="drawer-section">
          <h3>Provider posture</h3>
          <div id="drawer-posture" class="drawer-list"></div>
        </section>
        <section class="drawer-section">
          <h3>Official evidence</h3>
          <div id="drawer-evidence" class="drawer-list"></div>
        </section>
        <section class="drawer-section">
          <h3>Why this lane</h3>
          <div id="drawer-notes" class="drawer-list"></div>
        </section>
      </aside>
    </section>

    <section class="lower-strip">
      <section class="panel viz">
        <div class="panel-header">
          <h2 class="panel-title">Family Coverage Diagram</h2>
          <p class="panel-subtitle">Shortlisted, candidate, mock-only, and rejected counts stay visible per family.</p>
        </div>
        <div class="coverage-grid" id="coverage-diagram" data-testid="coverage-diagram"></div>
      </section>
      <section class="panel viz">
        <div class="panel-header">
          <h2 class="panel-title">Dimension Score Parity</h2>
          <p class="panel-subtitle">The chart and table must always agree for the selected vendor.</p>
        </div>
        <div class="bar-chart" id="dimension-chart" data-testid="dimension-chart"></div>
        <div class="table-wrap" data-testid="dimension-table">
          <table>
            <thead>
              <tr><th>Dimension</th><th>Score</th><th>Actual weight</th><th>Lane priority</th></tr>
            </thead>
            <tbody id="dimension-table-body"></tbody>
          </table>
        </div>
      </section>
    </section>
  </main>

  <script id="atlas-data" type="application/json">{payload}</script>
  <script>
    const model = JSON.parse(document.getElementById('atlas-data').textContent);
    const state = {{
      tab: 'transcription',
      lane: 'actual',
      sort: 'actual_later_fit_score',
      filter: 'all',
      search: '',
      selectedVendorId: null,
    }};

    const providerGrid = document.getElementById('provider-grid');
    const providerEmpty = document.getElementById('provider-empty');
    const coverageDiagram = document.getElementById('coverage-diagram');
    const dimensionChart = document.getElementById('dimension-chart');
    const dimensionTableBody = document.getElementById('dimension-table-body');
    const drawerTitle = document.getElementById('drawer-title');
    const drawerSummary = document.getElementById('drawer-summary');
    const drawerPosture = document.getElementById('drawer-posture');
    const drawerEvidence = document.getElementById('drawer-evidence');
    const drawerNotes = document.getElementById('drawer-notes');
    const panelTitle = document.getElementById('panel-title');
    const panelSubtitle = document.getElementById('panel-subtitle');

    document.getElementById('metric-shortlisted').textContent = model.summary.actual_shortlisted_vendor_count;
    document.getElementById('metric-rejected').textContent = model.summary.lane_counts.rejected;
    document.getElementById('metric-mock').textContent = model.summary.lane_counts.mock_only;
    document.getElementById('metric-freshness').textContent = model.captured_on;

    function familyAccent(family) {{
      if (family === 'transcription') return 'var(--transcript)';
      if (family === 'artifact_scanning') return 'var(--scan)';
      return 'var(--secondary)';
    }}

    function summarizeTab() {{
      const map = {{
        transcription: ['Transcription Shortlist', 'Focused STT providers ranked against readiness, ambiguity, and portability law.'],
        artifact_scanning: ['Artifact Scanning Shortlist', 'Managed scanners compared against quarantine fidelity, audit hooks, and portability.'],
        mock_lane: ['Mock Lane Fidelity', 'Internal twins remain the contract baseline for seq_035.'],
        actual_lane: ['Actual Lane Due Diligence', 'Shortlist, candidates, and rejections across both families with explicit kill switches.'],
      }};
      const [title, subtitle] = map[state.tab];
      panelTitle.textContent = title;
      panelSubtitle.textContent = subtitle;
    }}

    function visibleVendors() {{
      let rows = model.vendors.slice();
      if (state.tab === 'transcription' || state.tab === 'artifact_scanning') {{
        rows = rows.filter((row) => row.provider_family === state.tab);
        rows = rows.filter((row) => state.lane === 'mock' ? row.vendor_lane === 'mock_only' : row.vendor_lane !== 'mock_only');
      }} else if (state.tab === 'mock_lane') {{
        rows = rows.filter((row) => row.vendor_lane === 'mock_only');
      }} else if (state.tab === 'actual_lane') {{
        rows = rows.filter((row) => row.vendor_lane !== 'mock_only');
      }}

      if (state.filter === 'webhooks') {{
        rows = rows.filter((row) => row.supports_webhooks === 'yes');
      }} else if (state.filter === 'regions') {{
        rows = rows.filter((row) => row.supports_region_controls === 'yes');
      }} else if (state.filter === 'quarantine') {{
        rows = rows.filter((row) => row.quarantine_fit_score >= 85);
      }}

      if (state.search) {{
        const q = state.search.toLowerCase();
        rows = rows.filter((row) => (row.vendor_name + ' ' + row.vendor_id + ' ' + row.notes + ' ' + row.kill_switch_reason_if_any).toLowerCase().includes(q));
      }}

      rows.sort((left, right) => {{
        if (state.sort === 'vendor_name') {{
          return left.vendor_name.localeCompare(right.vendor_name);
        }}
        return Number(right[state.sort]) - Number(left[state.sort]);
      }});
      return rows;
    }}

    function ensureSelection(rows) {{
      if (!rows.length) {{
        state.selectedVendorId = null;
        return;
      }}
      if (!state.selectedVendorId || !rows.some((row) => row.vendor_id === state.selectedVendorId)) {{
        state.selectedVendorId = rows[0].vendor_id;
      }}
    }}

    function renderProviders(rows) {{
      providerGrid.innerHTML = '';
      providerEmpty.hidden = rows.length > 0;
      rows.forEach((row) => {{
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'provider-card' + (row.vendor_id === state.selectedVendorId ? ' is-selected' : '');
        card.dataset.testid = `provider-row-${{row.vendor_id}}`;
        card.setAttribute('data-testid', `provider-row-${{row.vendor_id}}`);
        card.setAttribute('aria-pressed', row.vendor_id === state.selectedVendorId ? 'true' : 'false');
        card.innerHTML = `
          <div class="provider-top">
            <div>
              <div class="provider-name">${{row.vendor_name}}</div>
              <div class="mono">${{row.vendor_id}}</div>
            </div>
            <div class="lane-pill lane-${{row.vendor_lane}}">${{row.vendor_lane.replace('_', ' ')}}</div>
          </div>
          <div class="score-strip">
            <div class="score-box"><div class="score-label">Actual</div><div class="score-value" data-testid="score-cell-${{row.vendor_id}}-actual">${{row.actual_later_fit_score}}</div></div>
            <div class="score-box"><div class="score-label">Mock</div><div class="score-value" data-testid="score-cell-${{row.vendor_id}}-mock">${{row.mock_now_fit_score}}</div></div>
            <div class="score-box"><div class="score-label">Quarantine</div><div class="score-value" data-testid="score-cell-${{row.vendor_id}}-quarantine">${{row.quarantine_fit_score}}</div></div>
          </div>
          <div>${{row.notes}}</div>
          <div class="tags">
            <span class="tag">Webhooks: ${{row.supports_webhooks}}</span>
            <span class="tag">Replay: ${{row.supports_replay_protection}}</span>
            <span class="tag">Region: ${{row.supports_region_controls}}</span>
          </div>
        `;
        card.addEventListener('click', () => {{
          state.selectedVendorId = row.vendor_id;
          render();
        }});
        providerGrid.appendChild(card);
      }});
    }}

    function renderDrawer(selected) {{
      if (!selected) {{
        drawerTitle.textContent = 'Select a vendor';
        drawerSummary.textContent = 'Open a provider card to inspect due-diligence evidence, fit scores, and kill switches.';
        drawerPosture.innerHTML = '';
        drawerEvidence.innerHTML = '';
        drawerNotes.innerHTML = '';
        return;
      }}
      drawerTitle.textContent = selected.vendor_name;
      drawerSummary.textContent = selected.vendor_id + ' · ' + selected.provider_family.replace('_', ' ') + ' · ' + selected.vendor_lane.replace('_', ' ');
      drawerPosture.innerHTML = `
        <div class="evidence-item"><strong>Project model</strong><div>${{selected.project_model}}</div></div>
        <div class="evidence-item"><strong>Retention and deletion</strong><div>${{selected.retention_and_deletion_notes}}</div></div>
        <div class="evidence-item"><strong>Sandbox posture</strong><div>${{selected.sandbox_posture}}</div></div>
        <div class="evidence-item"><strong>Portability</strong><div>${{selected.portability_notes}}</div></div>
      `;
      const evidence = model.evidence.filter((row) => selected.evidence_ids.includes(row.evidence_id));
      drawerEvidence.innerHTML = evidence.map((row) => `
        <div class="evidence-item">
          <div class="mono">${{row.evidence_id}} · ${{row.captured_on}}</div>
          <div><a href="${{row.url}}">${{row.title}}</a></div>
          <div>${{row.summary}}</div>
        </div>
      `).join('');
      drawerNotes.innerHTML = `
        <div class="evidence-item"><strong>Notes</strong><div>${{selected.notes}}</div></div>
        <div class="evidence-item"><strong>Kill switch</strong><div>${{selected.kill_switch_reason_if_any || 'No vendor-specific kill switch currently tripped.'}}</div></div>
      `;
    }}

    function renderCoverage() {{
      coverageDiagram.innerHTML = '';
      model.coverage_rows.forEach((row) => {{
        const total = row.total || 1;
        const el = document.createElement('div');
        el.className = 'coverage-row';
        el.innerHTML = `
          <div><strong>${{row.family_label}}</strong><div class="mono">${{row.shortlisted}} shortlisted · ${{row.candidate}} candidate · ${{row.mock_only}} mock · ${{row.rejected}} rejected</div></div>
          <div class="coverage-track">
            <div class="coverage-fill" style="width:${{row.shortlisted / total * 100}}%; background:${{familyAccent(row.family)}}"></div>
            <div class="coverage-fill" style="left:${{row.shortlisted / total * 100}}%; width:${{row.candidate / total * 100}}%; background:rgba(21, 94, 239, 0.35)"></div>
            <div class="coverage-fill" style="left:${{(row.shortlisted + row.candidate) / total * 100}}%; width:${{row.mock_only / total * 100}}%; background:rgba(122, 90, 248, 0.35)"></div>
            <div class="coverage-fill" style="left:${{(row.shortlisted + row.candidate + row.mock_only) / total * 100}}%; width:${{row.rejected / total * 100}}%; background:rgba(194, 65, 65, 0.35)"></div>
          </div>
        `;
        coverageDiagram.appendChild(el);
      }});
    }}

    function renderDimensionParity(selected) {{
      dimensionChart.innerHTML = '';
      dimensionTableBody.innerHTML = '';
      if (!selected) return;
      model.dimensions.forEach((dim) => {{
        const score = selected.dimension_scores[dim.dimension_id];
        const bar = document.createElement('div');
        bar.className = 'bar-row';
        bar.innerHTML = `
          <div>
            <div><strong>${{dim.dimension_title}}</strong></div>
            <div class="bar-track"><div class="bar-fill" style="width:${{score * 20}}%"></div></div>
          </div>
          <div class="mono">${{score}} / 5</div>
        `;
        dimensionChart.appendChild(bar);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${{dim.dimension_title}}</td>
          <td data-testid="score-cell-${{selected.vendor_id}}-${{dim.dimension_id}}">${{score}} / 5</td>
          <td>${{dim.weight_actual_later}}</td>
          <td>${{dim.lane_priority.replace('_', ' ')}}</td>
        `;
        dimensionTableBody.appendChild(tr);
      }});
    }}

    function render() {{
      summarizeTab();
      const rows = visibleVendors();
      ensureSelection(rows);
      renderProviders(rows);
      const selected = model.vendors.find((row) => row.vendor_id === state.selectedVendorId) || null;
      renderDrawer(selected);
      renderCoverage();
      renderDimensionParity(selected);

      document.querySelectorAll('.tab').forEach((button) => {{
        const active = button.dataset.family === state.tab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      }});
      document.querySelectorAll('.chip').forEach((button) => {{
        button.classList.toggle('is-active', button.dataset.filter === state.filter);
      }});
      document.getElementById('lane-mock').classList.toggle('is-active', state.lane === 'mock');
      document.getElementById('lane-actual').classList.toggle('is-active', state.lane === 'actual');
    }}

    document.querySelectorAll('.tab').forEach((button) => {{
      button.addEventListener('click', () => {{
        state.tab = button.dataset.family;
        render();
      }});
    }});
    document.querySelectorAll('.chip').forEach((button) => {{
      button.addEventListener('click', () => {{
        state.filter = button.dataset.filter;
        render();
      }});
    }});
    document.getElementById('lane-mock').addEventListener('click', () => {{
      state.lane = 'mock';
      render();
    }});
    document.getElementById('lane-actual').addEventListener('click', () => {{
      state.lane = 'actual';
      render();
    }});
    document.getElementById('sort-select').addEventListener('change', (event) => {{
      state.sort = event.target.value;
      render();
    }});
    document.getElementById('search-input').addEventListener('input', (event) => {{
      state.search = event.target.value.trim();
      render();
    }});

    render();
  </script>
</body>
</html>
"""


def build_playwright_spec() -> str:
    return textwrap.dedent(
        """
        const { test, expect } = require('@playwright/test');

        test.describe('34 evidence signal atlas', () => {
          test('supports tab switching, lane toggles, and evidence drawer rendering', async ({ page }) => {
            await page.goto('http://127.0.0.1:4192/34_evidence_signal_atlas.html');

            await expect(page.getByTestId('vendor-atlas-shell')).toBeVisible();
            await page.getByTestId('tab-artifact_scanning').click();
            await expect(page.getByTestId('provider-grid')).toContainText('GuardDuty Malware Protection for S3');

            await page.getByTestId('lane-toggle').getByRole('button', { name: 'Mock lane' }).click();
            await expect(page.getByTestId('provider-grid')).toContainText('Vecells Artifact Quarantine Twin');

            await page.getByTestId('lane-toggle').getByRole('button', { name: 'Actual lane' }).click();
            await page.getByTestId('provider-row-aws_guardduty_s3_scan').click();
            await expect(page.getByTestId('evidence-drawer')).toContainText('GuardDuty Malware Protection for S3');
          });

          test('keeps chart and table parity for the selected provider', async ({ page }) => {
            await page.goto('http://127.0.0.1:4192/34_evidence_signal_atlas.html');

            await page.getByTestId('provider-row-deepgram_transcription').click();
            await expect(page.getByTestId('dimension-chart')).toBeVisible();
            await expect(page.getByTestId('dimension-table')).toContainText('Contract Shape');
            await expect(page.getByTestId('score-cell-deepgram_transcription-contract_shape')).toBeVisible();
          });
        });
        """
    ).strip()


def build_pack() -> dict[str, Any]:
    inputs = {name: require(path) for name, path in REQUIRED_INPUTS.items()}
    scorecards = read_json(inputs["provider_family_scorecards"])
    external_dependencies = read_json(inputs["external_dependencies"])
    account_inventory = read_csv(inputs["external_account_inventory"])
    phase0 = read_json(inputs["phase0_gate_verdict"])
    integration_priority = read_json(inputs["integration_priority_matrix"])

    dimensions = derive_dimension_catalog(scorecards)
    evidence_rows = build_official_evidence()
    kill_switches = build_kill_switches()
    vendors = build_vendor_rows(dimensions)
    selected_access_rows = build_selected_access_rows(account_inventory)
    lane_matrix = build_lane_matrix()
    decision_log = build_decision_log()

    evidence_by_id = {row["evidence_id"]: row for row in evidence_rows}
    for vendor in vendors:
        vendor["evidence_urls"] = [evidence_by_id[eid]["url"] for eid in vendor["evidence_ids"]]

    by_family: dict[str, dict[str, list[dict[str, Any]]]] = {
        family: {"shortlisted": [], "candidate": [], "rejected": [], "mock_only": []}
        for family in ("transcription", "artifact_scanning", "combined")
    }
    for vendor in vendors:
        by_family[vendor["provider_family"]][vendor["vendor_lane"]].append(vendor)

    for family_rows in by_family.values():
        for lane_rows in family_rows.values():
            lane_rows.sort(key=lambda row: (-row["actual_later_fit_score"], row["vendor_id"]))

    shortlist_by_family = {family: rows["shortlisted"] for family, rows in by_family.items()}
    candidate_by_family = {family: rows["candidate"] for family, rows in by_family.items()}
    rejected_by_family = {family: rows["rejected"] for family, rows in by_family.items()}
    mock_by_family = {family: rows["mock_only"] for family, rows in by_family.items()}

    lane_counts = {
        "shortlisted": sum(1 for row in vendors if row["vendor_lane"] == "shortlisted"),
        "candidate": sum(1 for row in vendors if row["vendor_lane"] == "candidate"),
        "mock_only": sum(1 for row in vendors if row["vendor_lane"] == "mock_only"),
        "rejected": sum(1 for row in vendors if row["vendor_lane"] == "rejected"),
    }

    phase0_gate = next(
        row for row in phase0["gate_verdicts"] if row["gate_id"] == "GATE_P0_FOUNDATION_ENTRY"
    )
    integration_family = next(
        row
        for row in integration_priority["integration_families"]
        if row["integration_id"] == "int_telephony_capture_evidence_backplane"
    )

    recommended_strategy = {
        "strategy_id": "split_vendor_preferred_with_local_scan_bias",
        "label": "Split providers, keep local scan bias available",
        "summary": (
            "Use a focused transcription provider and a separate artifact-scanning provider later. "
            "Keep the canonical mock lane internal, reject any automatic single-suite winner, and "
            "prefer self-hosted or local scanning when quarantine and residency constraints outweigh procurement simplicity."
        ),
    }

    summary = {
        "vendor_rows": len(vendors),
        "actual_shortlisted_vendor_count": lane_counts["shortlisted"],
        "lane_counts": lane_counts,
        "evidence_rows": len(evidence_rows),
        "kill_switch_count": len(kill_switches),
        "selected_access_row_count": len(selected_access_rows),
    }

    shortlist = {
        "task_id": TASK_ID,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "phase0_gate_posture": {
            "verdict": phase0["summary"]["phase0_entry_verdict"],
            "planning_state": phase0["planning_readiness"]["state"],
            "blocking_gate_id": phase0_gate["gate_id"],
            "reason": phase0_gate["reason"],
        },
        "integration_context": {
            "integration_id": integration_family["integration_id"],
            "integration_name": integration_family["integration_name"],
            "current_lane": integration_family["recommended_lane"],
            "baseline_role": integration_family["baseline_role"],
        },
        "recommended_strategy": recommended_strategy,
        "lane_matrix": lane_matrix,
        "mock_selected": {
            "transcription": "vecells_transcript_readiness_twin",
            "artifact_scanning": "vecells_artifact_quarantine_twin",
            "combined": "vecells_evidence_signal_fabric",
            "shared_webhook_rule": "callback_hint_plus_trusted_refetch",
        },
        "selected_access_rows": selected_access_rows,
        "shortlist_by_family": shortlist_by_family,
        "candidate_by_family": candidate_by_family,
        "rejected_by_family": rejected_by_family,
        "mock_by_family": mock_by_family,
        "decision_log": decision_log,
        "next_tasks": ["seq_035", "seq_038", "seq_039", "seq_040"],
    }

    coverage_rows = []
    for family in ("transcription", "artifact_scanning", "combined"):
        rows = [row for row in vendors if row["provider_family"] == family]
        coverage_rows.append(
            {
                "family": family,
                "family_label": family.replace("_", " ").title(),
                "total": len(rows),
                "shortlisted": len([row for row in rows if row["vendor_lane"] == "shortlisted"]),
                "candidate": len([row for row in rows if row["vendor_lane"] == "candidate"]),
                "mock_only": len([row for row in rows if row["vendor_lane"] == "mock_only"]),
                "rejected": len([row for row in rows if row["vendor_lane"] == "rejected"]),
            }
        )

    atlas_model = {
        "summary": shortlist["summary"],
        "captured_on": CAPTURED_ON,
        "vendors": [
            {
                key: value
                for key, value in row.items()
                if key
                not in {
                    "source_refs",
                    "evidence_urls",
                }
            }
            for row in vendors
        ],
        "evidence": evidence_rows,
        "dimensions": dimensions,
        "coverage_rows": coverage_rows,
    }

    universe_fieldnames = [
        "vendor_id",
        "vendor_name",
        "provider_family",
        "vendor_lane",
        "supports_async_jobs",
        "supports_partial_results",
        "supports_confidence_or_quality_bands",
        "supports_webhooks",
        "supports_replay_protection",
        "supports_region_controls",
        "retention_and_deletion_notes",
        "quarantine_fit_score",
        "mock_now_fit_score",
        "actual_later_fit_score",
        "kill_switch_reason_if_any",
        "source_refs",
        "notes",
    ]
    universe_rows = []
    for row in vendors:
        universe_rows.append(
            {
                **{field: row[field] for field in universe_fieldnames if field not in {"source_refs"}},
                "source_refs": ";".join(row["source_refs"]),
            }
        )

    write_csv(UNIVERSE_CSV_PATH, universe_rows, universe_fieldnames)
    write_json(SHORTLIST_JSON_PATH, shortlist)
    write_jsonl(EVIDENCE_JSONL_PATH, evidence_rows)
    write_csv(
        LANE_MATRIX_CSV_PATH,
        lane_matrix,
        [
            "provider_family",
            "mock_provider_ids",
            "actual_shortlisted_vendor_ids",
            "recommended_strategy",
            "mock_lane_summary",
            "actual_lane_summary",
            "live_gate_refs",
            "seq035_handoff_focus",
        ],
    )
    write_csv(
        KILL_SWITCHES_CSV_PATH,
        kill_switches,
        ["kill_switch_id", "provider_family", "applies_to", "rule", "triggered_vendor_ids"],
    )
    write_text(UNIVERSE_DOC_PATH, render_vendor_universe_doc(shortlist, vendors))
    write_text(MOCK_DOC_PATH, render_mock_doc(shortlist, selected_access_rows))
    write_text(SHORTLIST_DOC_PATH, render_shortlist_doc(shortlist))
    write_text(DECISION_LOG_DOC_PATH, render_decision_log_doc(decision_log, kill_switches))
    write_text(EVIDENCE_DOC_PATH, render_evidence_doc(evidence_rows))
    write_text(ATLAS_HTML_PATH, build_atlas_html(atlas_model))
    write_text(PLAYWRIGHT_SPEC_PATH, build_playwright_spec())
    return shortlist


def main() -> None:
    shortlist = build_pack()
    print(
        json.dumps(
            {
                "task_id": shortlist["task_id"],
                "vendors": shortlist["summary"]["vendor_rows"],
                "shortlisted": shortlist["summary"]["actual_shortlisted_vendor_count"],
                "rejected": shortlist["summary"]["lane_counts"]["rejected"],
                "evidence_rows": shortlist["summary"]["evidence_rows"],
                "strategy": shortlist["recommended_strategy"]["strategy_id"],
            }
        )
    )


if __name__ == "__main__":
    main()
