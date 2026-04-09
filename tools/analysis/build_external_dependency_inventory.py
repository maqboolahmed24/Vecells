#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
import textwrap
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "analysis"
PROMPT_DIR = ROOT / "prompt"

REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
SOURCE_MANIFEST_PATH = DATA_DIR / "source_manifest.json"
SUMMARY_CONFLICTS_PATH = DATA_DIR / "summary_conflicts.json"
CANONICAL_ALIAS_PATH = DATA_DIR / "canonical_term_aliases.json"
PRODUCT_SCOPE_PATH = DATA_DIR / "product_scope_matrix.json"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
SHELL_MAP_PATH = DATA_DIR / "shell_ownership_map.json"
EXTERNAL_TOUCHPOINT_PATH = DATA_DIR / "external_touchpoint_matrix.csv"
REQUEST_LINEAGE_PATH = DATA_DIR / "request_lineage_transitions.json"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
STATE_MACHINES_PATH = DATA_DIR / "state_machines.json"
CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

DEPENDENCIES_JSON_PATH = DATA_DIR / "external_dependencies.json"
INVENTORY_CSV_PATH = DATA_DIR / "external_dependency_inventory.csv"
ASSURANCE_CSV_PATH = DATA_DIR / "external_assurance_obligations.csv"
TRUTH_MATRIX_CSV_PATH = DATA_DIR / "dependency_truth_and_fallback_matrix.csv"
SIMULATOR_JSON_PATH = DATA_DIR / "dependency_simulator_strategy.json"
AUTOMATION_BACKLOG_CSV_PATH = DATA_DIR / "future_browser_automation_backlog.csv"

INVENTORY_DOC_PATH = DOCS_DIR / "08_external_dependency_inventory.md"
TAXONOMY_DOC_PATH = DOCS_DIR / "08_external_dependency_taxonomy.md"
ASSURANCE_DOC_PATH = DOCS_DIR / "08_assurance_obligations_matrix.md"
TRUTH_DOC_PATH = DOCS_DIR / "08_dependency_truth_and_fallback_matrix.md"
SIMULATOR_DOC_PATH = DOCS_DIR / "08_simulator_and_local_stub_strategy.md"
BACKLOG_DOC_PATH = DOCS_DIR / "08_future_provisioning_and_browser_automation_backlog.md"
ATLAS_HTML_PATH = DOCS_DIR / "08_external_dependency_atlas.html"

MISSION = (
    "Produce the authoritative external dependency inventory, assurance obligations, "
    "truth ladder, simulator strategy, and future provisioning backlog for Vecells "
    "without provisioning any external service yet."
)

SOURCE_PRECEDENCE = [
    "phase-2-identity-and-echoes.md",
    "phase-4-the-booking-engine.md",
    "phase-5-the-network-horizon.md",
    "phase-6-the-pharmacy-loop.md",
    "phase-7-inside-the-nhs-app.md",
    "phase-8-the-assistive-layer.md",
    "phase-9-the-assurance-ledger.md",
    "platform-runtime-and-release-blueprint.md",
    "phase-cards.md",
    "forensic-audit-findings.md",
    "blueprint-init.md",
]

ATLAS_MARKERS = [
    'data-testid="atlas-shell"',
    'data-testid="atlas-nav"',
    'data-testid="hero-summary"',
    'data-testid="search-input"',
    'data-testid="baseline-toggle"',
    'data-testid="class-filter"',
    'data-testid="topology-map"',
    'data-testid="topology-table"',
    'data-testid="dependency-card-list"',
    'data-testid="truth-ladder-table"',
    'data-testid="simulator-panel"',
    'data-testid="backlog-table"',
    'data-testid="detail-panel"',
]

ALLOWED_DEPENDENCY_CLASSES = {
    "identity_auth",
    "patient_data_enrichment",
    "telephony",
    "sms",
    "email",
    "messaging_transport",
    "gp_system",
    "booking_supplier",
    "pharmacy_directory",
    "pharmacy_transport",
    "pharmacy_outcome",
    "embedded_channel",
    "model_vendor",
    "malware_scanning",
    "transcription",
    "analytics_observability",
    "security_control",
    "content_or_standards_source",
    "other",
}

ALLOWED_BASELINE_SCOPES = {
    "baseline_required",
    "optional_flagged",
    "deferred_phase7",
    "future_optional",
}

ALLOWED_LAYERS = {
    "clinical_platform_rail",
    "transport_message_rail",
    "supplier_specific_adapter",
    "channel_partner_surface",
    "security_assurance_dependency",
    "optional_feature_flagged",
    "deferred_channel_expansion",
}

MANDATORY_DEPENDENCY_IDS = {
    "dep_nhs_login_rail",
    "dep_pds_fhir_enrichment",
    "dep_telephony_ivr_recording_provider",
    "dep_transcription_processing_provider",
    "dep_sms_notification_provider",
    "dep_email_notification_provider",
    "dep_malware_scanning_provider",
    "dep_im1_pairing_programme",
    "dep_gp_system_supplier_paths",
    "dep_local_booking_supplier_adapters",
    "dep_network_capacity_partner_feeds",
    "dep_cross_org_secure_messaging_mesh",
    "dep_pharmacy_directory_dohs",
    "dep_pharmacy_referral_transport",
    "dep_pharmacy_outcome_observation",
    "dep_pharmacy_urgent_return_professional_routes",
    "dep_nhs_app_embedded_channel_ecosystem",
    "dep_assistive_model_vendor_family",
}

SCOPE_LOCKS = {
    "dep_pds_fhir_enrichment": "optional_flagged",
    "dep_nhs_app_embedded_channel_ecosystem": "deferred_phase7",
    "dep_assistive_model_vendor_family": "future_optional",
}


@dataclass(frozen=True)
class DependencySpec:
    dependency_id: str
    dependency_name: str
    dependency_class: str
    dependency_layer: str
    baseline_scope: str
    source_file_refs: tuple[str, ...]
    business_purpose: str
    bound_bounded_contexts: tuple[str, ...]
    integration_mode: str
    adapter_contract_family: str
    authoritative_success_proof: str
    non_authoritative_signals: tuple[str, ...]
    ambiguity_modes: tuple[str, ...]
    fallback_or_recovery_modes: tuple[str, ...]
    simulator_allowed: str
    local_stub_strategy: str
    assurance_or_onboarding_obligations: tuple[str, ...]
    operator_or_runbook_dependencies: tuple[str, ...]
    future_provisioning_task_refs: tuple[str, ...]
    browser_automation_task_refs: tuple[str, ...]
    future_browser_automation_required: bool
    browser_automation_candidate_portal_or_console: str
    manual_checkpoints: tuple[str, ...]
    blocked_by_prior_approval_or_contract: bool
    secrets_or_credentials_classes: tuple[str, ...]
    tenant_or_org_scope: str
    deferred_reason_if_any: str
    touchpoint_ids: tuple[str, ...]
    affects_patient_visible_truth: bool
    notes: str


@dataclass(frozen=True)
class InternalExclusionSpec:
    exclusion_id: str
    touchpoint_id: str
    summary: str
    reason: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class TouchpointResolutionSpec:
    resolution_id: str
    touchpoint_id: str
    resolution_type: str
    dependency_id: str
    exclusion_id: str
    resolution_summary: str
    source_refs: tuple[str, ...]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


def count_payload_items(payload: Any) -> int:
    if isinstance(payload, list):
        return len(payload)
    if isinstance(payload, dict):
        for key in (
            "rows",
            "sources",
            "conflicts",
            "machines",
            "dependencies",
            "touchpoint_resolution",
            "entries",
            "aliases",
        ):
            if key in payload:
                value = payload[key]
                if isinstance(value, dict):
                    return len(value)
                if isinstance(value, list):
                    return len(value)
        return len(payload)
    return 0


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def flatten(value: Any) -> str:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (list, tuple)):
        return "; ".join(str(item) for item in value)
    return str(value)


def md_cell(value: Any) -> str:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (list, tuple)):
        return "<br>".join(str(item) for item in value)
    return str(value)


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    separator_row = "| " + " | ".join(["---"] * len(headers)) + " |"
    body_rows = ["| " + " | ".join(md_cell(cell) for cell in row) + " |" for row in rows]
    return "\n".join([header_row, separator_row, *body_rows])


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: flatten(row.get(field, "")) for field in fieldnames})


def slug_to_title(slug: str) -> str:
    slug = re.sub(r"^(seq|par)_\d+_", "", slug)
    return slug.replace("_", " ")


def load_task_catalog() -> dict[str, str]:
    task_catalog: dict[str, str] = {}
    for line in CHECKLIST_PATH.read_text().splitlines():
        match = re.match(r"- \[[ X\-]\] ((?:seq|par)_\d+_[^\s]+)", line)
        if match:
            task_slug = match.group(1)
            task_id = task_slug.split("_", 2)[0] + "_" + task_slug.split("_", 2)[1]
            task_catalog[task_id] = slug_to_title(task_slug)
    return task_catalog


def ensure_prerequisites() -> dict[str, int]:
    required = {
        "requirement_registry_rows": REQUIREMENT_REGISTRY_PATH,
        "source_manifest_sources": SOURCE_MANIFEST_PATH,
        "summary_conflict_count": SUMMARY_CONFLICTS_PATH,
        "canonical_alias_entries": CANONICAL_ALIAS_PATH,
        "product_scope_rows": PRODUCT_SCOPE_PATH,
        "audience_surface_rows": AUDIENCE_SURFACE_PATH,
        "shell_map_entries": SHELL_MAP_PATH,
        "external_touchpoints": EXTERNAL_TOUCHPOINT_PATH,
        "request_lineage_rows": REQUEST_LINEAGE_PATH,
        "object_catalog_entries": OBJECT_CATALOG_PATH,
        "state_machine_count": STATE_MACHINES_PATH,
    }
    counts: dict[str, int] = {}
    for key, path in required.items():
        if not path.exists():
            raise SystemExit(f"PREREQUISITE_GAP_{key.upper()}: missing {path}")
        if path.suffix == ".jsonl":
            count = count_jsonl(path)
        elif path.suffix == ".csv":
            count = len(load_csv(path))
        else:
            count = count_payload_items(load_json(path))
        if count <= 0:
            raise SystemExit(f"PREREQUISITE_GAP_{key.upper()}: empty {path}")
        counts[key] = count
    return counts


def build_dependencies() -> list[DependencySpec]:
    return [
        DependencySpec(
            dependency_id="dep_nhs_login_rail",
            dependency_name="NHS login authentication rail",
            dependency_class="identity_auth",
            dependency_layer="channel_partner_surface",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#2B. NHS login bridge and local session engine",
                "blueprint-init.md#10. Identity, consent, security, and policy",
                "platform-runtime-and-release-blueprint.md#AdapterContractProfile",
            ),
            business_purpose="Authenticate patients and step up authority before writable portal or recovery actions continue.",
            bound_bounded_contexts=("identity_access", "patient_portal", "support_recovery"),
            integration_mode="Server-side OIDC authorization-code flow via gateway or BFF; callbacks and token exchange stay behind integration workloads and never in the browser.",
            adapter_contract_family="nhs_login_oidc_bridge",
            authoritative_success_proof="Current SessionEstablishmentDecision plus current Session, IdentityBinding, and RouteIntentBinding showing writable authority for the same subject and lineage.",
            non_authoritative_signals=(
                "NHS login callback arrived",
                "Token exchange completed",
                "Subject claim exists without settled writable authority",
            ),
            ambiguity_modes=(
                "ConsentNotGiven or access_denied returns",
                "Subject mismatch or stale subject binding version",
                "claim_pending or auth_read_only posture after successful auth",
            ),
            fallback_or_recovery_modes=(
                "bounded_recovery with explicit post-auth next step",
                "auth_read_only or claim_pending shell posture",
                "secure-link or support-assisted recovery without pretending writable ownership",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use the official mock-authorisation style harness and local callback fixtures; keep final redirect URI, consent, and live subject-binding proof for later onboarding.",
            assurance_or_onboarding_obligations=(
                "Complete NHS login partner onboarding and freeze redirect-URI inventory before live use.",
                "Store scope selection, consent-denied handling, and clinical-safety evidence as part of the onboarding pack.",
                "Publish one adapter contract for auth redirect, callback correlation, and subject-binding proof upgrades.",
            ),
            operator_or_runbook_dependencies=(
                "Auth outage and redirect mismatch runbook",
                "Subject-conflict and identity-repair escalation runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_024", "seq_025", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_024", "seq_025"),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="NHS login partner onboarding and OIDC application configuration portals",
            manual_checkpoints=(
                "Partner approval before non-mock credentials are issued",
                "Redirect-URI and scope review against live environment inventory",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("oidc_client_id", "oidc_client_secret", "private_key_or_jwks", "redirect_uri_allowlist"),
            tenant_or_org_scope="Shared partner registration with environment-specific redirect and scope configuration.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_nhs_login",),
            affects_patient_visible_truth=True,
            notes="NHS login remains an authentication rail only; it does not replace patient linkage, PDS, or claim ownership.",
        ),
        DependencySpec(
            dependency_id="dep_pds_fhir_enrichment",
            dependency_name="Optional PDS enrichment seam",
            dependency_class="patient_data_enrichment",
            dependency_layer="optional_feature_flagged",
            baseline_scope="optional_flagged",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#2C. Patient linkage, demographic confidence, and optional PDS enrichment",
                "blueprint-init.md#10. Identity, consent, security, and policy",
                "phase-cards.md#Phase 2 - Identity and Echoes",
            ),
            business_purpose="Optionally enrich patient-linking evidence with governed PDS demographics after legal basis and onboarding are complete.",
            bound_bounded_contexts=("identity_access", "governance", "support_operations"),
            integration_mode="Feature-flagged enrichment adapter behind IdentityBindingAuthority; no route may depend on PDS before legal basis and onboarding complete.",
            adapter_contract_family="pds_enrichment_adapter",
            authoritative_success_proof="A legally permitted PDS lookup correlated to the current linkage candidate set and accepted as supporting evidence by IdentityBindingAuthority.",
            non_authoritative_signals=(
                "NHS login contact claim",
                "Single local demographic candidate without sufficient confidence",
                "Stale demographic cache",
            ),
            ambiguity_modes=(
                "Legal basis or onboarding still incomplete",
                "PDS response conflicts with local or telephony evidence",
                "Feature flag disabled for the current tenant or route",
            ),
            fallback_or_recovery_modes=(
                "Local matching only with partial_match or review posture",
                "Support-assisted correction without widening identity truth",
                "Keep enrichment fully off while preserving baseline identity flow",
            ),
            simulator_allowed="yes",
            local_stub_strategy="Use synthetic PDS response fixtures and fail-closed enrichment toggles; keep real credentials and legal-basis proof out of this task.",
            assurance_or_onboarding_obligations=(
                "Document the legal basis, onboarding state, and tenant flag plan before enabling PDS.",
                "Keep PDS evidence subordinate to IdentityBindingAuthority rather than direct patientRef writes.",
                "Treat PDS enablement as a reversible, audited capability toggle with route-level blast-radius awareness.",
            ),
            operator_or_runbook_dependencies=(
                "PDS-disabled fallback runbook",
                "Identity conflict and repair escalation runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_027", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_027",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="PDS FHIR sandbox access request and onboarding portals",
            manual_checkpoints=(
                "Legal basis and governance approval before sandbox or live access",
                "Tenant feature-flag review before any patient-visible enrichment",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_client_credentials", "client_certificate", "organisation_identity"),
            tenant_or_org_scope="Tenant and organisation specific; optional per rollout cohort.",
            deferred_reason_if_any="Optional enrichment only. Baseline identity completeness must work without PDS.",
            touchpoint_ids=(),
            affects_patient_visible_truth=True,
            notes="Optional by corpus law: PDS is an enrichment seam, not a baseline blocker and not a substitute for NHS login or local binding governance.",
        ),
        DependencySpec(
            dependency_id="dep_telephony_ivr_recording_provider",
            dependency_name="Telephony, IVR, and call-recording provider",
            dependency_class="telephony",
            dependency_layer="transport_message_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#2E. Telephony call-session ingestion, evidence readiness, and convergence",
                "phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
                "callback-and-clinician-messaging-loop.md#Callback domain",
            ),
            business_purpose="Capture phone-origin demand, callback attempts, IVR routing, voicemail, and recording availability inside the same governed request lineage.",
            bound_bounded_contexts=("telephony", "callback_messaging", "identity_access"),
            integration_mode="Webhook- and fetch-driven telephony adapters behind telephony-edge and recording workers; browser surfaces never talk to carrier APIs directly.",
            adapter_contract_family="telephony_ingress_and_callback_adapter",
            authoritative_success_proof="Current CallSession evidence or CallbackOutcomeEvidenceBundle linked to AdapterReceiptCheckpoint and the current lineage-bound callback or intake objects.",
            non_authoritative_signals=(
                "Carrier accepted a call leg",
                "Callback queued or dial started",
                "Recording promised but not yet fetched or verified",
            ),
            ambiguity_modes=(
                "recording_missing or transcript_degraded",
                "Duplicate or contradictory callback outcomes",
                "urgent_live_only posture without routine evidence readiness",
            ),
            fallback_or_recovery_modes=(
                "Callback retry or governed manual escalation",
                "Secure-link continuation where route authority allows",
                "Manual review of audio or urgent live diversion without false routine progress",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Run local webhook simulators, seeded call sessions, and fake recording objects; reserve real number provisioning and live carrier proof for later tasks.",
            assurance_or_onboarding_obligations=(
                "Select a provider that supports webhook correlation, recording availability, and callback evidence capture under stable adapter contracts.",
                "Bind telephony retention, masking, and clinical-safety hazards into the rollout pack before live use.",
                "Document failover for recording lag, callback-route repair, and urgent live diversion.",
            ),
            operator_or_runbook_dependencies=(
                "Telephony outage and callback degradation runbook",
                "Recording lag and evidence-readiness manual review runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_031", "seq_032", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_032",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="Telephony vendor admin console for account creation, phone numbers, IVR flows, and webhook endpoints",
            manual_checkpoints=(
                "Contract and regulated-recording review before live call handling",
                "Number ownership and urgent escalation path sign-off",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("account_api_token", "webhook_secret", "phone_number_inventory", "sip_or_voice_credentials"),
            tenant_or_org_scope="Tenant-specific numbers and routing with environment-separated credentials.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_telephony_and_ivr_provider",),
            affects_patient_visible_truth=True,
            notes="Telephony parity is baseline, but carrier acceptance or callback initiation never equals completed clinical contact.",
        ),
        DependencySpec(
            dependency_id="dep_transcription_processing_provider",
            dependency_name="Transcript and derived-facts processing provider",
            dependency_class="transcription",
            dependency_layer="supplier_specific_adapter",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#2E. Telephony call-session ingestion, evidence readiness, and convergence",
                "phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
                "forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
            ),
            business_purpose="Produce transcript readiness and derived facts from recordings while keeping original audio authoritative.",
            bound_bounded_contexts=("telephony", "evidence_classification", "assurance"),
            integration_mode="Queued transcript and fact-extraction jobs against quarantined recording artifacts; output stays as derivation packages rather than source truth.",
            adapter_contract_family="transcription_readiness_adapter",
            authoritative_success_proof="TelephonyTranscriptReadinessRecord with clinically sufficient coverage accepted by TelephonyEvidenceReadinessAssessment(usabilityState = safety_usable).",
            non_authoritative_signals=(
                "Transcript job queued or running",
                "Keyword-only or partial utterance output",
                "Model returned text without a matching readiness assessment",
            ),
            ambiguity_modes=(
                "Coverage is partial or clinically insufficient",
                "Contradictory transcript reruns or stale derivation packages",
                "Manual review still required before routine promotion",
            ),
            fallback_or_recovery_modes=(
                "Manual transcription or audio review",
                "continuation_challenge or manual_only posture",
                "Keep the lineage blocked on evidence readiness rather than guessing safety-usable meaning",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use repository-local fixtures for transcript states and derivation packages; keep vendor-specific latency and quality proof for later onboarding.",
            assurance_or_onboarding_obligations=(
                "Version transcript and derivation outputs so readiness decisions stay replayable.",
                "Demonstrate that original audio remains authoritative and that degraded transcripts fail closed to review.",
                "Document supplier data-processing and retention boundaries before live transcription starts.",
            ),
            operator_or_runbook_dependencies=(
                "Transcript lag and manual-transcription backlog runbook",
                "Coverage downgrade and contradiction review runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_034", "seq_035", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_035",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="Transcription vendor admin console or project workspace",
            manual_checkpoints=(
                "Clinical-safety review of derived-facts use before any automated promotion depends on the provider",
                "Retention and masking checks for recorded audio and transcript artifacts",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_key", "webhook_secret", "project_or_workspace_identifier"),
            tenant_or_org_scope="Usually shared infrastructure with tenant-scoped tagging and evidence segregation.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_artifact_store_and_scan",),
            affects_patient_visible_truth=True,
            notes="Transcript completion is never enough by itself; the readiness assessment is the governing proof.",
        ),
        DependencySpec(
            dependency_id="dep_sms_notification_provider",
            dependency_name="SMS delivery provider",
            dependency_class="sms",
            dependency_layer="optional_feature_flagged",
            baseline_scope="optional_flagged",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
                "callback-and-clinician-messaging-loop.md#Delivery, callback-window, and settlement confidence model",
                "phase-0-the-foundation-protocol.md#Command and adapter effect ledger",
            ),
            business_purpose="Deliver seeded telephony continuation links and selected patient prompts through a controlled outbound SMS rail.",
            bound_bounded_contexts=("telephony", "patient_communications", "callback_messaging"),
            integration_mode="Outbox-backed SMS adapter bound to AccessGrant issuance and delivery evidence checkpoints; links and grants remain internal.",
            adapter_contract_family="sms_delivery_adapter",
            authoritative_success_proof="Current AdapterReceiptCheckpoint plus the governing AccessGrant or CommunicationEnvelope still current for the same route and visibility tuple.",
            non_authoritative_signals=(
                "Send request accepted by provider",
                "Link issued but not redeemed",
                "Carrier handoff without delivery evidence",
            ),
            ambiguity_modes=(
                "Wrong-recipient or stale-number risk",
                "Bounced, expired, or disputed delivery",
                "Link redemption fenced by subject or session drift",
            ),
            fallback_or_recovery_modes=(
                "Email or support reissue",
                "Challenge continuation instead of seeded continuation",
                "Same-shell bounded recovery without reusing stale grant assumptions",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use a local notification sink with deterministic receipt states and opaque grant fixtures; reserve real sender registration and delivery truth for later provisioning.",
            assurance_or_onboarding_obligations=(
                "Freeze SMS templates, TTL, and wrong-recipient controls before seeded continuation is enabled.",
                "Keep send acceptance, delivery evidence, and grant redemption semantically separate in audit and UI.",
                "Route disputed delivery into support repair rather than silent reminder drift.",
            ),
            operator_or_runbook_dependencies=(
                "SMS delivery dispute and wrong-recipient incident runbook",
                "Grant supersession and resend-control runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_031", "seq_033", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_033",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="SMS notification vendor console for sender, webhook, and template setup",
            manual_checkpoints=(
                "Sender registration and regulated messaging review before live traffic",
                "Wrong-recipient hazard sign-off for seeded continuation cohorts",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_key", "sender_identifier", "webhook_secret"),
            tenant_or_org_scope="Tenant-specific sender and template configuration.",
            deferred_reason_if_any="Feature-flagged for seeded continuation and selected prompts; core workflow must still recover safely without SMS.",
            touchpoint_ids=("ext_secure_link_and_notification_rail", "ext_message_delivery_provider"),
            affects_patient_visible_truth=True,
            notes="SMS is external only for delivery. Secure-link issuance and AccessGrant semantics remain internal control-plane behavior.",
        ),
        DependencySpec(
            dependency_id="dep_email_notification_provider",
            dependency_name="Email and notification delivery provider",
            dependency_class="email",
            dependency_layer="transport_message_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "callback-and-clinician-messaging-loop.md#Clinician message domain",
                "phase-5-the-network-horizon.md#Reminder and communication publication",
                "phase-0-the-foundation-protocol.md#Command and adapter effect ledger",
            ),
            business_purpose="Deliver clinician messages, reminders, secure-link emails, and patient-facing receipts through a governed email rail.",
            bound_bounded_contexts=("patient_communications", "callback_messaging", "support_operations"),
            integration_mode="Outbox-backed email adapter with delivery evidence checkpoints and same-shell recovery when delivery truth is disputed.",
            adapter_contract_family="email_delivery_adapter",
            authoritative_success_proof="Current MessageDeliveryEvidenceBundle or AdapterReceiptCheckpoint for the live CommunicationEnvelope and route tuple.",
            non_authoritative_signals=(
                "Provider accepted the send",
                "SMTP or API returned queued state",
                "Template rendered without current delivery truth",
            ),
            ambiguity_modes=(
                "Delivery failed, disputed, expired, or suppressed",
                "Message thread closed locally while delivery truth is still unresolved",
                "Reachability repair overrides the intended communication route",
            ),
            fallback_or_recovery_modes=(
                "Controlled resend under the same authoritative chain",
                "Support repair or callback escalation",
                "Same-shell read-only or recovery posture while delivery truth is unresolved",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use a local sink and deterministic receipt fixtures; reserve real sender-domain verification and inbox routing for later provisioning.",
            assurance_or_onboarding_obligations=(
                "Verify sender domains and delivery-webhook correlation before live use.",
                "Separate transport acceptance from durable delivery evidence in projections and runbooks.",
                "Bind email delivery to controlled resend and support repair rather than silent success assumptions.",
            ),
            operator_or_runbook_dependencies=(
                "Email bounce, dispute, and resend-control runbook",
                "Reachability repair and patient notification fallback runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_031", "seq_033", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_033",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="Email or notification vendor console for sender-domain, templates, and webhook setup",
            manual_checkpoints=(
                "Sender-domain verification and security review",
                "Support ownership for bounced or disputed delivery chains",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_key", "smtp_or_api_credentials", "sender_domain_records", "webhook_secret"),
            tenant_or_org_scope="Tenant and organisation specific sender and policy configuration.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_secure_link_and_notification_rail", "ext_message_delivery_provider"),
            affects_patient_visible_truth=True,
            notes="Transport accepted is never equal to delivered; patient or staff calmness must wait for current delivery evidence or explicit fallback.",
        ),
        DependencySpec(
            dependency_id="dep_malware_scanning_provider",
            dependency_name="Malware and artifact scanning provider",
            dependency_class="malware_scanning",
            dependency_layer="security_assurance_dependency",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
                "phase-2-identity-and-echoes.md#2E. Telephony call-session ingestion, evidence readiness, and convergence",
                "forensic-audit-findings.md#Finding 12 - No safe fallback when ingest or safety failed",
            ),
            business_purpose="Scan uploads and recordings before they leave quarantine or become available to downstream review and promotion.",
            bound_bounded_contexts=("artifact_quarantine", "identity_access", "assurance"),
            integration_mode="Asynchronous scanning boundary from private object storage into artifact quarantine outcomes; no browser or shell reads from raw scan engines.",
            adapter_contract_family="artifact_scanning_adapter",
            authoritative_success_proof="Current artifact quarantine outcome showing the capture bundle or recording is safe, readable enough, or explicitly quarantined with governed next action.",
            non_authoritative_signals=(
                "Object stored successfully",
                "Scan job started",
                "Raw file metadata available",
            ),
            ambiguity_modes=(
                "Scan timed out or returned unsupported",
                "File is quarantined or unreadable",
                "Conflicting scan evidence across retries",
            ),
            fallback_or_recovery_modes=(
                "FallbackReviewCase with same-lineage degraded receipt",
                "Manual review or re-upload request",
                "Fail closed rather than silently dropping the artifact",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use deterministic pass, quarantine, and timeout fixtures in place of real scanner projects; reserve live signatures, latency, and vendor attestation for later tasks.",
            assurance_or_onboarding_obligations=(
                "Document quarantine policy, scanner revision, and operator response before live artifact intake.",
                "Prove that unsafe or unreadable evidence routes to fallback review rather than disappearing.",
                "Track scanning as an explicit dependency-health signal for restore and fail-soft posture.",
            ),
            operator_or_runbook_dependencies=(
                "Artifact quarantine and malware escalation runbook",
                "Scanner timeout and manual-review routing runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_034", "seq_035", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_035",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="Artifact scanning vendor console or cloud project setup",
            manual_checkpoints=(
                "Security review of scanner placement and quarantine policy",
                "Known-bad test evidence before live acceptance is enabled",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_key", "project_identifier", "storage_access_binding"),
            tenant_or_org_scope="Shared infrastructure with environment-separated credentials and tenant tags.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_artifact_store_and_scan",),
            affects_patient_visible_truth=False,
            notes="Private object storage is an internal platform surface; the external dependency here is the scanning service, not the storage bucket.",
        ),
        DependencySpec(
            dependency_id="dep_im1_pairing_programme",
            dependency_name="IM1 Pairing programme and prerequisite path",
            dependency_class="gp_system",
            dependency_layer="security_assurance_dependency",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-4-the-booking-engine.md#4B Provider capability matrix and adapter seam",
                "phase-4-the-booking-engine.md#4E Commit path",
                "blueprint-init.md#1. Product definition",
            ),
            business_purpose="Secure the prerequisites, SCAL, mock API, supported test, assurance, and rollout gates required before GP supplier integrations become live.",
            bound_bounded_contexts=("booking", "identity_access", "assurance"),
            integration_mode="Human-governed onboarding programme whose outputs gate supplier adapter publication and live route capability resolution.",
            adapter_contract_family="im1_pairing_governance_boundary",
            authoritative_success_proof="Current pairing evidence pack showing the exact supplier, organisation, and environment have cleared the required IM1 stage for the targeted capability set.",
            non_authoritative_signals=(
                "Prerequisite forms submitted",
                "Supplier conversation started",
                "Mock documentation received without supported-test or assurance completion",
            ),
            ambiguity_modes=(
                "SCAL or model-interface prerequisites still pending",
                "Supported-test or assurance incomplete for the selected supplier path",
                "Live rollout not yet approved for the supplier or organisation pair",
            ),
            fallback_or_recovery_modes=(
                "Stay on simulator or supported-test path only",
                "Keep the related route in assisted-only, recovery-only, or blocked posture",
                "Use hub fallback or manual handling where booking policy allows",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use deterministic supplier simulators and mock API fixtures while treating pairing approval, SCAL, and live rollout as non-simulatable gates.",
            assurance_or_onboarding_obligations=(
                "Track prerequisites, SCAL, supported test, assurance, and live rollout as explicit blockers rather than prose assumptions.",
                "Bind pairing stage to supplier-specific capability resolution and adapter publication.",
                "Keep IM1 out of the Phase 2 identity critical path even though it is baseline for later booking scope.",
            ),
            operator_or_runbook_dependencies=(
                "Supplier-pairing stall and escalation runbook",
                "Live rollout freeze and simulator fallback runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_026", "seq_036", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_026",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="IM1 Pairing prerequisite forms, supplier prerequisite portals, and SCAL evidence trackers",
            manual_checkpoints=(
                "Commercial and assurance approval before live supplier access",
                "SCAL and supported-test evidence review before route capability goes live",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("supplier_programme_credentials", "organisation_identifiers", "certificate_material"),
            tenant_or_org_scope="Organisation and supplier pair specific, with environment-ring separation.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_booking_supplier_adapter",),
            affects_patient_visible_truth=True,
            notes="IM1 remains baseline for local booking reach, but the corpus is explicit that it stays out of the Phase 2 identity critical path.",
        ),
        DependencySpec(
            dependency_id="dep_gp_system_supplier_paths",
            dependency_name="Principal GP-system supplier integration paths",
            dependency_class="gp_system",
            dependency_layer="supplier_specific_adapter",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-4-the-booking-engine.md#4B Provider capability matrix and adapter seam",
                "phase-4-the-booking-engine.md#4C Slot search",
                "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
            ),
            business_purpose="Reach supplier-specific GP-system booking and outcome pathways through published provider bindings rather than code-local vendor assumptions.",
            bound_bounded_contexts=("booking", "pharmacy", "assurance"),
            integration_mode="Supplier-specific adapter bindings with explicit capability, local-consumer, and authoritative-read contracts under integration workloads.",
            adapter_contract_family="gp_supplier_adapter_family",
            authoritative_success_proof="Current supplier binding and authoritative read or outcome observation path accepted for the same supplier, organisation, action scope, and transport assurance profile.",
            non_authoritative_signals=(
                "Supplier name matches a supported family",
                "Static docs suggest support without current binding proof",
                "Outcome transport observed without current policy acceptance",
            ),
            ambiguity_modes=(
                "linkage_required or local_component_required capability states",
                "Supplier-specific action support withdrawn or stale",
                "Outcome evidence shape does not match the live supplier path",
            ),
            fallback_or_recovery_modes=(
                "Assisted-only handling or hub fallback",
                "Simulator and contract-test path while supplier access remains incomplete",
                "Reconciliation-required posture instead of false booking or outcome calmness",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use supplier-specific mocks and capability fixtures while treating live bindings, local consumers, and assured outcome paths as later tasks.",
            assurance_or_onboarding_obligations=(
                "Publish supplier capability matrices and binding hashes before exposing supplier-specific CTAs.",
                "Separate linkage, local-consumer, and authoritative-read prerequisites from UI assumptions.",
                "Keep supplier variability explicit in both booking and pharmacy outcome ingest.",
            ),
            operator_or_runbook_dependencies=(
                "Supplier outage and unsupported-capability runbook",
                "Binding drift and local-consumer prerequisite runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_026", "seq_036", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Supplier sandbox and capability evidence review",
                "Environment-specific binding publication before patient-visible actions widen",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_credentials", "mutual_tls_material", "supplier_environment_identifiers"),
            tenant_or_org_scope="Supplier and organisation pair specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_booking_supplier_adapter",),
            affects_patient_visible_truth=True,
            notes="This row captures live supplier paths; the separate IM1 pairing row captures the programme gates that must exist before these paths are usable.",
        ),
        DependencySpec(
            dependency_id="dep_local_booking_supplier_adapters",
            dependency_name="Local booking supplier adapter family",
            dependency_class="booking_supplier",
            dependency_layer="supplier_specific_adapter",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-4-the-booking-engine.md#4C Slot search",
                "phase-4-the-booking-engine.md#4E Commit path",
                "phase-4-the-booking-engine.md#4F Manage flows",
            ),
            business_purpose="Search, revalidate, commit, and manage local appointments through supplier-specific adapter bindings while preserving honest confirmation truth.",
            bound_bounded_contexts=("booking", "patient_portal", "staff_operations"),
            integration_mode="BookingProviderAdapterBinding per supplier, integration mode, audience, and action scope under the canonical adapter and command ledgers.",
            adapter_contract_family="booking_provider_adapter_binding",
            authoritative_success_proof="BookingConfirmationTruthProjection(confirmationTruthState = confirmed) backed by a durable provider reference or same-commit read-after-write proof for the same BookingTransaction.",
            non_authoritative_signals=(
                "Slot list rendered from a frozen snapshot",
                "Local click acknowledgement",
                "Supplier accepted for processing or callback arrived without authoritative confirmation",
            ),
            ambiguity_modes=(
                "confirmation_pending posture after async acceptance",
                "supplier_reconciliation_pending due to disputed or stale supplier truth",
                "waitlist, callback fallback, or hub fallback still open",
            ),
            fallback_or_recovery_modes=(
                "Stay in confirmation_pending with explicit truth posture",
                "Route to waitlist, callback, or hub fallback under current policy",
                "Freeze stale manage actions until capability resolution is recomputed",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use local supplier simulators and deterministic confirmation ladders; reserve real search and commit credentials for later selection and provisioning work.",
            assurance_or_onboarding_obligations=(
                "Require published provider capability matrices and adapter bindings before routes expose book, cancel, or reschedule controls.",
                "Keep authoritative read-after-write proof separate from transport or provider processing acceptance.",
                "Bind waitlist, callback, and hub fallback to the same confirmation truth rather than supplier optimism.",
            ),
            operator_or_runbook_dependencies=(
                "Confirmation-pending and reconciliation review runbook",
                "Supplier outage and manual-assisted booking fallback runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_036", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Supplier-selection scorecard and simulation evidence before live booking exposure",
                "Per-supplier fallback and manage-capability review",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_credentials", "supplier_binding_identifiers", "webhook_or_callback_shared_secret"),
            tenant_or_org_scope="Supplier, practice, and audience-context specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_booking_supplier_adapter",),
            affects_patient_visible_truth=True,
            notes="No supplier queue acceptance, webhook arrival, or worker dequeue may be projected as booked truth.",
        ),
        DependencySpec(
            dependency_id="dep_network_capacity_partner_feeds",
            dependency_name="Network and hub partner capacity feeds",
            dependency_class="booking_supplier",
            dependency_layer="supplier_specific_adapter",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion",
                "phase-5-the-network-horizon.md#Network coordination contract, case model, and state machine",
                "phase-9-the-assurance-ledger.md#9B. Essential-functions health, queues, and assurance operations boards",
            ),
            business_purpose="Ingest network partner availability and native hub booking context so hub coordination can reason about trusted, degraded, or quarantined supply.",
            bound_bounded_contexts=("hub_coordination", "operations", "assurance"),
            integration_mode="Capacity ingestion adapters feeding candidate snapshots and policy evaluation; patient or staff shells consume only projected trust posture.",
            adapter_contract_family="network_capacity_ingestion_adapter",
            authoritative_success_proof="Current CandidateSnapshot admitted as trusted_offerable by NetworkCoordinationPolicyEvaluation for the same policy tuple and source set.",
            non_authoritative_signals=(
                "Manual site list or stale spreadsheet",
                "Partial supplier coverage without trust admission",
                "Diagnostic-only feed returned a candidate",
            ),
            ambiguity_modes=(
                "degraded_diagnostic_only or quarantined_hidden source posture",
                "Snapshot expiry or stale source version",
                "Offer session drift after candidate snapshot changes",
            ),
            fallback_or_recovery_modes=(
                "callback fallback or return_to_practice",
                "read_only_provenance or callback_only recovery in the same shell",
                "Operational escalation when partner feeds are stale or quarantined",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use deterministic partner-feed snapshots and trust states locally; treat live partner availability and native hub system proof as later work.",
            assurance_or_onboarding_obligations=(
                "Bind every feed to a capacity-ingestion policy that can admit, degrade, or quarantine it.",
                "Keep patient-visible alternatives subordinate to current trusted frontier proof.",
                "Expose partner-feed staleness and dependency health on the assurance surface before live rollout.",
            ),
            operator_or_runbook_dependencies=(
                "Stale capacity feed and quarantine-response runbook",
                "No-slot callback or return-to-practice escalation runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Partner data-sharing and source-freshness review",
                "Policy-tuple sign-off for trusted vs degraded capacity admission",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("feed_service_credentials", "network_partner_identifiers"),
            tenant_or_org_scope="PCN or hub organisation specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_network_booking_adapter",),
            affects_patient_visible_truth=True,
            notes="Network offers may not become patient-visible or closable while the current feed posture is degraded or quarantined.",
        ),
        DependencySpec(
            dependency_id="dep_cross_org_secure_messaging_mesh",
            dependency_name="Cross-organisation secure messaging rail including MESH",
            dependency_class="messaging_transport",
            dependency_layer="transport_message_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "blueprint-init.md#1. Product definition",
                "phase-5-the-network-horizon.md#Hub commit algorithm",
                "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            ),
            business_purpose="Carry secure cross-organisation messages and larger payloads where direct APIs are unavailable for practice visibility or pharmacy dispatch.",
            bound_bounded_contexts=("hub_coordination", "pharmacy", "support_operations"),
            integration_mode="Outbox and inbox adapters on secure message rails such as MESH, always behind AdapterContractProfile and transport assurance policies.",
            adapter_contract_family="secure_message_transport_adapter",
            authoritative_success_proof="Current delivery evidence or other allowed proof class accepted by the live transport assurance profile for the exact outbound effect chain.",
            non_authoritative_signals=(
                "Transport accepted or checksum acknowledged",
                "Mailbox queued or message handed off",
                "Duplicate callback or replay observed",
            ),
            ambiguity_modes=(
                "Delivery evidence still pending or disputed",
                "Transport-only evidence without current-generation acknowledgement",
                "Duplicate or stale message correlation against superseded tuples",
            ),
            fallback_or_recovery_modes=(
                "Retry through the same idempotent effect chain",
                "Monitored mailbox or telephone escalation where policy allows",
                "Keep patient or practice posture in explicit pending or recovery state",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use local secure-message simulators with deterministic receipt and replay states; keep real mailbox requests and certificates for later onboarding tasks.",
            assurance_or_onboarding_obligations=(
                "Request secure mailbox or message access before enabling real cross-organisation transport.",
                "Separate transport acceptance, delivery evidence, and current-generation acknowledgement facts.",
                "Bind every transport route to data-minimisation and retry-safe correlation rules.",
            ),
            operator_or_runbook_dependencies=(
                "Secure messaging outage and replay reconciliation runbook",
                "Mailbox credential rotation and dead-letter review runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_028", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_028",),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="MESH or equivalent secure-message onboarding portal and mailbox administration surfaces",
            manual_checkpoints=(
                "Cross-organisation access approval before live mailbox use",
                "Transport assurance and minimum-necessary payload review",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("mailbox_identifier", "transport_certificate", "endpoint_credentials"),
            tenant_or_org_scope="Organisation or network specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_practice_ack_delivery_rail", "ext_pharmacy_dispatch_transport"),
            affects_patient_visible_truth=True,
            notes="The rail may carry practice visibility or pharmacy payloads, but transport acceptance alone never settles either business truth.",
        ),
        DependencySpec(
            dependency_id="dep_origin_practice_ack_rail",
            dependency_name="Origin-practice acknowledgement rail",
            dependency_class="messaging_transport",
            dependency_layer="transport_message_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-5-the-network-horizon.md#PracticeAcknowledgementRecord",
                "phase-5-the-network-horizon.md#Hub commit algorithm",
                "phase-5-the-network-horizon.md#Manage, reminders, and practice visibility after hub booking",
            ),
            business_purpose="Send continuity deltas to the origin practice and collect generation-bound acknowledgement evidence for hub bookings and later material changes.",
            bound_bounded_contexts=("hub_coordination", "practice_visibility", "operations"),
            integration_mode="PracticeContinuityMessage plus PracticeAcknowledgementRecord on top of secure-message, API, or monitored-mailbox transports.",
            adapter_contract_family="practice_acknowledgement_transport_adapter",
            authoritative_success_proof="Current-generation PracticeAcknowledgementRecord matching the live truthTupleHash and ackGeneration for the active hub visibility duty.",
            non_authoritative_signals=(
                "Transport accepted or delivered",
                "Origin practice viewed an older message",
                "A stale-generation acknowledgement exists",
            ),
            ambiguity_modes=(
                "Acknowledgement overdue or disputed",
                "Generation drift after cancellation, reschedule, or supplier-drift update",
                "Policy exception still pending for no-ack-required posture",
            ),
            fallback_or_recovery_modes=(
                "Operational escalation and overdue timers",
                "Recovery-required practice visibility posture",
                "Explicit exception handling rather than silent debt clearance",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Simulate generation-bound acknowledgement cycles locally while reserving real mailbox or API acknowledgements for later provisioning work.",
            assurance_or_onboarding_obligations=(
                "Keep acknowledgement debt explicit and generation-bound in every practice-visibility flow.",
                "Map transport rails to the current hub practice-visibility policy and truth tuple.",
                "Document escalation when current-generation acknowledgement is overdue or disputed.",
            ),
            operator_or_runbook_dependencies=(
                "Practice-acknowledgement overdue escalation runbook",
                "Generation drift and duplicate-ack reconciliation runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_028", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Policy review for which changes require renewed acknowledgement",
                "Origin-practice escalation path sign-off",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("service_mailbox_credentials", "organisation_endpoint_identifiers"),
            tenant_or_org_scope="Origin practice and hub organisation pair specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_practice_ack_delivery_rail",),
            affects_patient_visible_truth=True,
            notes="Transport acceptance, delivery evidence, and explicit acknowledgement are distinct facts and must stay distinct in the inventory and UI.",
        ),
        DependencySpec(
            dependency_id="dep_pharmacy_directory_dohs",
            dependency_name="Pharmacy directory and discovery dependency",
            dependency_class="pharmacy_directory",
            dependency_layer="clinical_platform_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
                "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
                "blueprint-init.md#7. Pharmacy First pathway",
            ),
            business_purpose="Discover eligible pharmacies, current opening posture, capability, and safe provider choice while preserving full patient choice.",
            bound_bounded_contexts=("pharmacy", "patient_portal", "operations"),
            integration_mode="Directory adapter and cached snapshots feeding PharmacyChoiceProof and provider capability snapshots; never browser-side search against partner systems.",
            adapter_contract_family="pharmacy_directory_adapter",
            authoritative_success_proof="Current PharmacyDirectorySnapshot and PharmacyChoiceProof over the visible choice set and selected provider explanation.",
            non_authoritative_signals=(
                "Cached provider list without current snapshot age",
                "Convenience ranking or open-now signal alone",
                "Deprecated EPS DoS response without current policy acceptance",
            ),
            ambiguity_modes=(
                "Stale or partial directory snapshot",
                "Unsafe timing or capability drift",
                "Visible-choice set changed materially after prior selection",
            ),
            fallback_or_recovery_modes=(
                "Same-shell directory regeneration",
                "Warned choice or clinician fallback when no safe provider remains",
                "Consent renewal or fresh choice before dispatch if the choice set drifted",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use frozen provider snapshots and deterministic stale, suppressed, and safe-choice fixtures; keep live API access and deprecation handling for later tasks.",
            assurance_or_onboarding_obligations=(
                "Track Service Search / DoHS as the strategic source and watch EPS DoS deprecation risk explicitly.",
                "Prove full-choice and warning posture before live patient exposure.",
                "Keep provider capability snapshots explicit rather than inferred from ranking hints.",
            ),
            operator_or_runbook_dependencies=(
                "Zero-provider anomaly and stale-directory runbook",
                "Provider-choice regeneration and consent-supersession runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_037", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Directory access-path selection and deprecation watch review",
                "Patient-choice compliance sign-off before live rollout",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_key_or_certificate", "service_registration_identifiers"),
            tenant_or_org_scope="Shared national directory feed with tenant policy overlays.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_pharmacy_directory",),
            affects_patient_visible_truth=True,
            notes="Discovery truth must remain separate from later dispatch and outcome truth; no hidden-default provider path is allowed.",
        ),
        DependencySpec(
            dependency_id="dep_pharmacy_referral_transport",
            dependency_name="Pharmacy referral transport dependency",
            dependency_class="pharmacy_transport",
            dependency_layer="transport_message_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
                "phase-6-the-pharmacy-loop.md#Pharmacy contract, case model, and state machine",
                "phase-0-the-foundation-protocol.md#Pharmacy dispatch and confirmation gate algorithm",
            ),
            business_purpose="Dispatch frozen pharmacy referral packages through approved transport routes while keeping proof, contradiction, and consent posture explicit.",
            bound_bounded_contexts=("pharmacy", "operations", "support_operations"),
            integration_mode="PharmacyDispatchPlan and PharmacyDispatchAttempt under canonical command, idempotency, outbox, and confirmation-gate contracts.",
            adapter_contract_family="pharmacy_dispatch_transport_adapter",
            authoritative_success_proof="Current DispatchProofEnvelope(authoritative proof satisfied) accepted by the live TransportAssuranceProfile and current ExternalConfirmationGate for the same dispatch attempt.",
            non_authoritative_signals=(
                "adapter_dispatched",
                "transport_accepted",
                "provider_accepted",
                "shared-mailbox delivery observed",
            ),
            ambiguity_modes=(
                "proof_pending at or near deadline",
                "contradiction score above threshold",
                "consent or package drift after the outbound attempt",
            ),
            fallback_or_recovery_modes=(
                "Keep same-shell pending or reconciliation posture",
                "Controlled redispatch only under a fresh tuple",
                "manual_assisted_dispatch with attestation and secondary review where policy requires it",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use transport simulators and deterministic proof envelopes for happy and degraded cases; reserve live BaRS, mailbox, or supplier transport configuration for later tasks.",
            assurance_or_onboarding_obligations=(
                "Publish transport assurance profiles and proof thresholds before any live dispatch.",
                "Bind every dispatch attempt to the exact provider, package, consent checkpoint, and route tuple.",
                "Keep transport acceptance, provider acceptance, and authoritative proof as separate evidence lanes.",
            ),
            operator_or_runbook_dependencies=(
                "Dispatch-proof stale or disputed runbook",
                "Post-dispatch consent revocation and redispatch runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_037", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Transport-path selection and data-sharing review",
                "Manual-assisted dispatch attestation policy sign-off",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("transport_credentials", "mailbox_credentials", "webhook_secret", "provider_endpoint_identifiers"),
            tenant_or_org_scope="Tenant and provider pair specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_pharmacy_dispatch_transport",),
            affects_patient_visible_truth=True,
            notes="Vecells may dispatch through several transports, but no transport-only evidence may project calm referred truth.",
        ),
        DependencySpec(
            dependency_id="dep_pharmacy_outcome_observation",
            dependency_name="Pharmacy outcome observation and reconciliation path",
            dependency_class="pharmacy_outcome",
            dependency_layer="supplier_specific_adapter",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
                "forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state",
                "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            ),
            business_purpose="Observe consultation outcomes, bounce-backs, and no-contact returns through Update Record or agreed local channels without confusing transport with resolved care truth.",
            bound_bounded_contexts=("pharmacy", "triage", "operations"),
            integration_mode="Replay-safe inbox ingestion, parser normalisation, and case-local reconciliation gate; no direct Vecells control of community-pharmacy record systems.",
            adapter_contract_family="pharmacy_outcome_ingest_adapter",
            authoritative_success_proof="Current PharmacyOutcomeRecord or PharmacyBounceBackRecord correlated to the active PharmacyCase and, where needed, resolved through PharmacyOutcomeReconciliationGate.",
            non_authoritative_signals=(
                "Update Record transport observed",
                "Email or inbox delivery received",
                "Manual capture drafted but not reconciled",
            ),
            ambiguity_modes=(
                "Weak or conflicting match against the active case",
                "Duplicate or replayed outcome evidence",
                "No message arrived yet, which cannot prove completion",
            ),
            fallback_or_recovery_modes=(
                "outcome_reconciliation_pending with explicit review placeholder",
                "Reopen for safety when the outcome is urgent or materially different",
                "Manual structured capture or clarification without auto-closing the request",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use synthetic Update Record, email-ingest, and manual-capture fixtures with strong, weak, unmatched, and replay cases; reserve live assured combinations for later tasks.",
            assurance_or_onboarding_obligations=(
                "Respect supplier-specific evidence shapes and assured system combinations for Update Record observation.",
                "Keep weak-match review case-local and closure-blocking until explicitly resolved.",
                "Treat absence of Update Record or email as no evidence, not as completion proof.",
            ),
            operator_or_runbook_dependencies=(
                "Outcome reconciliation backlog and weak-match review runbook",
                "Urgent bounce-back reopen and no-contact return runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_022", "seq_023", "seq_037", "seq_038", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Outcome source acceptance policy review",
                "Parser and reconciliation quality review before auto-apply is allowed",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("mailbox_credentials", "parser_service_credentials", "supplier_source_identifiers"),
            tenant_or_org_scope="Supplier-system, organisation, and tenant policy specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_pharmacy_outcome_ingest",),
            affects_patient_visible_truth=True,
            notes="Outcome ingest is an observation boundary only; it cannot behave like direct pharmacy-system control or auto-close on weak evidence.",
        ),
        DependencySpec(
            dependency_id="dep_pharmacy_urgent_return_professional_routes",
            dependency_name="Pharmacy urgent-return and professional-contact routes",
            dependency_class="messaging_transport",
            dependency_layer="transport_message_rail",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
                "phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
                "blueprint-init.md#7. Pharmacy First pathway",
            ),
            business_purpose="Provide the dedicated monitored email, professional number, or equivalent local route for urgent and unsupported pharmacy returns.",
            bound_bounded_contexts=("pharmacy", "triage", "support_operations"),
            integration_mode="Human-operated safety-net routes declared in UrgentReturnChannelConfig and linked to the same case-local evidence chain as bounce-back and reopen.",
            adapter_contract_family="pharmacy_urgent_return_route_config",
            authoritative_success_proof="Current urgent-return or bounce-back evidence acknowledged on the configured route and bound to the active PharmacyCase or reopened request lineage.",
            non_authoritative_signals=(
                "Email sent to the safety-net mailbox",
                "Voicemail or phone transfer attempted",
                "Mailbox accepted without operator acknowledgement",
            ),
            ambiguity_modes=(
                "Urgent return not yet acknowledged on the current route",
                "Stale or misconfigured monitored email or professional number",
                "Contact-route repair blocks the expected return channel",
            ),
            fallback_or_recovery_modes=(
                "Immediate duty-task reopen or supervisor escalation",
                "Phone escalation if mailbox or digital route is unavailable",
                "No use of Update Record for urgent return semantics",
            ),
            simulator_allowed="no",
            local_stub_strategy="Configuration can be stubbed, but the actual human acknowledgement and urgent return path cannot be truthfully simulated as live-authoritative.",
            assurance_or_onboarding_obligations=(
                "Record the practice professional number and dedicated monitored email or equivalent safety-net route per tenant.",
                "Keep urgent-return handling separate from Update Record and ordinary outcome observation.",
                "Document how overdue or unacknowledged urgent returns escalate immediately.",
            ),
            operator_or_runbook_dependencies=(
                "Urgent-return acknowledgement and missed-safety-net runbook",
                "Mailbox failover and duty-clinician escalation runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_037", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Practice-level route ownership sign-off",
                "Urgent-return rehearsal before the route is treated as live",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("service_mailbox_credentials", "professional_contact_directory_entry"),
            tenant_or_org_scope="Practice specific.",
            deferred_reason_if_any="",
            touchpoint_ids=("ext_pharmacy_outcome_ingest",),
            affects_patient_visible_truth=True,
            notes="Urgent return is a human-operated safety net and therefore cannot be downgraded into a simulated healthy dependency.",
        ),
        DependencySpec(
            dependency_id="dep_nhs_app_embedded_channel_ecosystem",
            dependency_name="NHS App embedded-channel ecosystem",
            dependency_class="embedded_channel",
            dependency_layer="deferred_channel_expansion",
            baseline_scope="deferred_phase7",
            source_file_refs=(
                "phase-7-inside-the-nhs-app.md#7A. Integration manifest and route inventory",
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
                "phase-cards.md#Phase 7 - Inside the NHS App",
            ),
            business_purpose="Expose the same patient journeys inside NHS App through embedded shell, SSO handoff, site links, and governed bridge capability negotiation.",
            bound_bounded_contexts=("patient_portal", "identity_access", "release_control"),
            integration_mode="Responsive web integration with manifest-pinned embedded routes, NHS login handoff, route-scoped bridge eligibility, and NHS App JS bridge wrapping.",
            adapter_contract_family="nhs_app_embedded_channel_boundary",
            authoritative_success_proof="Current NHSAppIntegrationManifest, PatientEmbeddedNavEligibility, and PatientEmbeddedSessionProjection under the approved manifest, release, and bridge-capability tuple.",
            non_authoritative_signals=(
                "User-agent or query hint suggests embedded mode",
                "Raw bridge object is present",
                "Manifest file exists without current eligibility and continuity proof",
            ),
            ambiguity_modes=(
                "Manifest drift across Sandpit, AOS, and live",
                "Bridge capability mismatch or stale embedded continuity evidence",
                "Consent denial or auth return that fails silent handoff",
            ),
            fallback_or_recovery_modes=(
                "Safe browser handoff",
                "read_only or placeholder-only embedded posture",
                "Bounded recovery inside the same patient shell rather than silent route fork",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use embedded-preview mode, manifest fixtures, and simulated bridge capabilities locally; reserve Sandpit, AOS, site links, and SCAL for later tasks.",
            assurance_or_onboarding_obligations=(
                "Treat Sandpit, AOS, SCAL, accessibility audit, and demo-environment readiness as explicit onboarding gates.",
                "Version manifest, route exposure, and bridge capabilities under the same release tuple as the wider platform.",
                "Keep NHS App entry, standalone web entry, and secure-link recovery on the same backend contracts.",
            ),
            operator_or_runbook_dependencies=(
                "Embedded auth failure and manifest drift runbook",
                "Bridge capability downgrade and safe-browser-handoff runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_029", "seq_030", "seq_039", "seq_040"),
            browser_automation_task_refs=("seq_029", "seq_030"),
            future_browser_automation_required=True,
            browser_automation_candidate_portal_or_console="NHS App Sandpit, AOS, SCAL, and site-link onboarding portals",
            manual_checkpoints=(
                "NHS App suitability and demo-environment review before Sandpit or AOS access",
                "Accessibility, service-standard, and incident-rehearsal evidence before release widening",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("site_link_metadata", "embedded_manifest_configuration", "bridge_script_versioning_controls"),
            tenant_or_org_scope="National-channel integration with route-family and environment-ring controls.",
            deferred_reason_if_any="Phase 7 is explicitly deferred from the current baseline; inventory it now but do not treat it as a current baseline blocker.",
            touchpoint_ids=("ext_embedded_host_bridge",),
            affects_patient_visible_truth=True,
            notes="Deferred channel expansion only. The inventory keeps the onboarding and downgrade rules ready without rebasing current scope.",
        ),
        DependencySpec(
            dependency_id="dep_assistive_model_vendor_family",
            dependency_name="Assistive model vendor and subprocessor family",
            dependency_class="model_vendor",
            dependency_layer="optional_feature_flagged",
            baseline_scope="future_optional",
            source_file_refs=(
                "phase-8-the-assistive-layer.md#8H",
                "phase-8-the-assistive-layer.md#AssistiveCapabilityTrustEnvelope",
                "phase-cards.md#Phase 8 - The Assistive Layer",
            ),
            business_purpose="Optionally provide bounded assistive inference and drafting services without making core workflow correctness depend on model vendors.",
            bound_bounded_contexts=("assistive", "staff_workspace", "assurance"),
            integration_mode="Trust-bound assistive sidecar behind AssistiveCapabilityTrustEnvelope and route-scoped rollout verdicts; no direct UI dependency on raw vendor output.",
            adapter_contract_family="assistive_vendor_boundary",
            authoritative_success_proof="Current AssistiveCapabilityTrustEnvelope plus AssistiveCapabilityRolloutVerdict and supplier-assurance freshness for the exact route, cohort, and watch tuple.",
            non_authoritative_signals=(
                "Model returned output successfully",
                "Vendor status page looks healthy",
                "Watch tuple or rollout rung appears green without current trust envelope",
            ),
            ambiguity_modes=(
                "trustState = degraded, quarantined, shadow_only, or frozen",
                "Supplier assurance drifted, suspended, or stale",
                "Route-family or cohort rollout evidence is missing or blocked",
            ),
            fallback_or_recovery_modes=(
                "observe_only, provenance_only, placeholder_only, or hidden posture",
                "Shadow-only or frozen rollout without widening assistive actionability",
                "Keep core clinical and operational workflow fully complete without model dependency",
            ),
            simulator_allowed="partial",
            local_stub_strategy="Use local deterministic draft and suggestion fixtures with trust-state toggles; reserve real vendor credentials and subprocessor evidence for future optional rollout work.",
            assurance_or_onboarding_obligations=(
                "Track model version, prompt bundle, subprocessor set, and rollback proof as explicit release inputs.",
                "Keep supplier-assurance freshness and freeze posture visible in the same shell.",
                "Do not let assistive vendors become baseline blockers for core functional completeness.",
            ),
            operator_or_runbook_dependencies=(
                "Assistive freeze, kill-switch, and rollback runbook",
                "Vendor incident and trust-downgrade runbook",
            ),
            future_provisioning_task_refs=("seq_021", "seq_023", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Subprocessor and assurance review before any live visible cohort",
                "Rollback and kill-switch proof before widening beyond shadow or observe-only",
            ),
            blocked_by_prior_approval_or_contract=True,
            secrets_or_credentials_classes=("api_key", "model_deployment_credentials", "subprocessor_inventory_reference"),
            tenant_or_org_scope="Route-family, cohort, and tenant specific.",
            deferred_reason_if_any="Model-vendor onboarding is bounded optional rollout scope even though assistive control posture exists in the baseline architecture.",
            touchpoint_ids=(),
            affects_patient_visible_truth=False,
            notes="The assistive control plane is in scope, but live model vendors remain optional and must fail to shadow, observe-only, or hidden posture.",
        ),
        DependencySpec(
            dependency_id="dep_nhs_assurance_and_standards_sources",
            dependency_name="NHS standards and assurance source set",
            dependency_class="content_or_standards_source",
            dependency_layer="security_assurance_dependency",
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-9-the-assurance-ledger.md#9D. Assurance pack factory and standards evidence pipeline",
                "phase-9-the-assurance-ledger.md#9H. Tenant governance, config immutability, and dependency hygiene",
                "phase-7-inside-the-nhs-app.md#What Phase 7 must prove before Phase 8 starts",
            ),
            business_purpose="Version the external standards, guidance, and supplier-assurance inputs that gate release, onboarding, and evidence admissibility.",
            bound_bounded_contexts=("assurance", "release_control", "governance"),
            integration_mode="Human-governed standards watchlist, evidence mapping, and dependency hygiene process rather than a runtime data plane.",
            adapter_contract_family="standards_watch_and_assurance_boundary",
            authoritative_success_proof="Current StandardsVersionMap and StandardsDependencyWatchlist bound to the same assurance-evidence graph and release candidate under review.",
            non_authoritative_signals=(
                "Static checklist copied into local notes",
                "Legacy documentation link still resolves somewhere",
                "Evidence PDF exists without current standards-version mapping",
            ),
            ambiguity_modes=(
                "Standards version moved, refreshed, or decommissioned",
                "Supplier assurance evidence is stale or suspended",
                "Dependency hygiene scan still reports legacy references",
            ),
            fallback_or_recovery_modes=(
                "Freeze affected onboarding or release step until review completes",
                "Open explicit standards exception or evidence gap",
                "Keep live dependency assumptions constrained to current watchlist evidence",
            ),
            simulator_allowed="no",
            local_stub_strategy="No truthful simulator. The local system can model watchlist rows, but the authoritative external standards posture still requires human review and current source authority.",
            assurance_or_onboarding_obligations=(
                "Keep standards updates and supplier-drift semantics versioned rather than hard-coded.",
                "Bind onboarding, release, and assurance packs to the same standards-version map and evidence graph.",
                "Continuously remove stale legacy documentation assumptions and unsupported dependency links.",
            ),
            operator_or_runbook_dependencies=(
                "Standards change review and evidence-refresh runbook",
                "Legacy dependency hygiene and release-freeze runbook",
            ),
            future_provisioning_task_refs=("seq_009", "seq_015", "seq_018", "seq_039", "seq_040"),
            browser_automation_task_refs=(),
            future_browser_automation_required=False,
            browser_automation_candidate_portal_or_console="",
            manual_checkpoints=(
                "Governance sign-off on refreshed standards baselines",
                "Evidence-pack refresh before release or partner onboarding widens",
            ),
            blocked_by_prior_approval_or_contract=False,
            secrets_or_credentials_classes=(),
            tenant_or_org_scope="Platform wide.",
            deferred_reason_if_any="",
            touchpoint_ids=(),
            affects_patient_visible_truth=False,
            notes="This row captures source-of-law dependency, not a live API. It is still operationally real because stale standards can block release and onboarding.",
        ),
    ]


def build_internal_exclusions() -> list[InternalExclusionSpec]:
    return [
        InternalExclusionSpec(
            exclusion_id="excl_secure_link_tokens_internal",
            touchpoint_id="ext_secure_link_and_notification_rail",
            summary="Secure-link token issuance is internal",
            reason="The external dependency here is delivery via SMS or email. AccessGrant issuance, secure-link redemption, and route-authority fencing stay on the internal command plane.",
            source_refs=(
                "phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
                "phase-0-the-foundation-protocol.md#Command and adapter effect ledger",
            ),
        ),
        InternalExclusionSpec(
            exclusion_id="excl_private_artifact_storage_internal",
            touchpoint_id="ext_artifact_store_and_scan",
            summary="Private object storage remains an internal platform service",
            reason="The touchpoint includes storage, scanning, and readiness processing, but this inventory treats only scanning and transcription as external dependencies. Private quarantine storage stays inside the platform trust boundary.",
            source_refs=(
                "platform-runtime-and-release-blueprint.md#runtime topology",
                "phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",
            ),
        ),
    ]


def build_touchpoint_resolutions() -> list[TouchpointResolutionSpec]:
    return [
        TouchpointResolutionSpec(
            resolution_id="tp_res_001",
            touchpoint_id="ext_nhs_login",
            resolution_type="dependency",
            dependency_id="dep_nhs_login_rail",
            exclusion_id="",
            resolution_summary="NHS login touchpoint resolves to the NHS login auth rail dependency.",
            source_refs=("phase-2-identity-and-echoes.md#2B. NHS login bridge and local session engine",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_002",
            touchpoint_id="ext_secure_link_and_notification_rail",
            resolution_type="dependency",
            dependency_id="dep_sms_notification_provider",
            exclusion_id="",
            resolution_summary="SMS delivery is one external leg of the secure-link and prompt rail.",
            source_refs=("phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_003",
            touchpoint_id="ext_secure_link_and_notification_rail",
            resolution_type="dependency",
            dependency_id="dep_email_notification_provider",
            exclusion_id="",
            resolution_summary="Email delivery is the other baseline external leg of the secure-link and prompt rail.",
            source_refs=("callback-and-clinician-messaging-loop.md#Clinician message domain",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_004",
            touchpoint_id="ext_secure_link_and_notification_rail",
            resolution_type="internal_exclusion",
            dependency_id="",
            exclusion_id="excl_secure_link_tokens_internal",
            resolution_summary="Token issuance remains internal even though delivery channels are external.",
            source_refs=("phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_005",
            touchpoint_id="ext_telephony_and_ivr_provider",
            resolution_type="dependency",
            dependency_id="dep_telephony_ivr_recording_provider",
            exclusion_id="",
            resolution_summary="Telephony ingress, callbacks, IVR, and recordings resolve to the telephony provider dependency.",
            source_refs=("phase-2-identity-and-echoes.md#2E. Telephony call-session ingestion, evidence readiness, and convergence",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_006",
            touchpoint_id="ext_artifact_store_and_scan",
            resolution_type="dependency",
            dependency_id="dep_malware_scanning_provider",
            exclusion_id="",
            resolution_summary="Scanning and quarantine proof resolve to the malware scanning provider dependency.",
            source_refs=("phase-0-the-foundation-protocol.md#4.3A Artifact quarantine and fallback review",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_007",
            touchpoint_id="ext_artifact_store_and_scan",
            resolution_type="dependency",
            dependency_id="dep_transcription_processing_provider",
            exclusion_id="",
            resolution_summary="Transcript readiness processing resolves to the transcription provider dependency.",
            source_refs=("phase-2-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_008",
            touchpoint_id="ext_artifact_store_and_scan",
            resolution_type="internal_exclusion",
            dependency_id="",
            exclusion_id="excl_private_artifact_storage_internal",
            resolution_summary="Private object storage stays inside the platform trust boundary.",
            source_refs=("platform-runtime-and-release-blueprint.md#runtime topology",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_009",
            touchpoint_id="ext_message_delivery_provider",
            resolution_type="dependency",
            dependency_id="dep_sms_notification_provider",
            exclusion_id="",
            resolution_summary="SMS may carry reminders or message-linked prompts in the external message-delivery rail.",
            source_refs=("callback-and-clinician-messaging-loop.md#Clinician message domain",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_010",
            touchpoint_id="ext_message_delivery_provider",
            resolution_type="dependency",
            dependency_id="dep_email_notification_provider",
            exclusion_id="",
            resolution_summary="Email is the baseline external message-delivery provider for reminders and threaded communication.",
            source_refs=("callback-and-clinician-messaging-loop.md#Clinician message domain",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_011",
            touchpoint_id="ext_booking_supplier_adapter",
            resolution_type="dependency",
            dependency_id="dep_im1_pairing_programme",
            exclusion_id="",
            resolution_summary="Supplier availability depends on the IM1 pairing and assurance path before live use.",
            source_refs=("phase-4-the-booking-engine.md#4B Provider capability matrix and adapter seam",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_012",
            touchpoint_id="ext_booking_supplier_adapter",
            resolution_type="dependency",
            dependency_id="dep_gp_system_supplier_paths",
            exclusion_id="",
            resolution_summary="Supplier-specific GP-system paths remain a separate dependency from the pairing programme itself.",
            source_refs=("phase-4-the-booking-engine.md#4B Provider capability matrix and adapter seam",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_013",
            touchpoint_id="ext_booking_supplier_adapter",
            resolution_type="dependency",
            dependency_id="dep_local_booking_supplier_adapters",
            exclusion_id="",
            resolution_summary="Local booking search and confirmation truth resolve to the supplier adapter family.",
            source_refs=("phase-4-the-booking-engine.md#4E Commit path",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_014",
            touchpoint_id="ext_network_booking_adapter",
            resolution_type="dependency",
            dependency_id="dep_network_capacity_partner_feeds",
            exclusion_id="",
            resolution_summary="Hub and cross-site booking depend on current trusted capacity and partner feed posture.",
            source_refs=("phase-5-the-network-horizon.md#5C. Enhanced Access policy engine and network capacity ingestion",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_015",
            touchpoint_id="ext_practice_ack_delivery_rail",
            resolution_type="dependency",
            dependency_id="dep_cross_org_secure_messaging_mesh",
            exclusion_id="",
            resolution_summary="Practice visibility messages often rely on secure cross-organisation rails such as MESH.",
            source_refs=("phase-5-the-network-horizon.md#Hub commit algorithm",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_016",
            touchpoint_id="ext_practice_ack_delivery_rail",
            resolution_type="dependency",
            dependency_id="dep_origin_practice_ack_rail",
            exclusion_id="",
            resolution_summary="The explicit acknowledgement debt is a distinct dependency from the transport rail underneath it.",
            source_refs=("phase-5-the-network-horizon.md#PracticeAcknowledgementRecord",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_017",
            touchpoint_id="ext_pharmacy_directory",
            resolution_type="dependency",
            dependency_id="dep_pharmacy_directory_dohs",
            exclusion_id="",
            resolution_summary="Pharmacy provider choice resolves to the strategic directory and capability snapshot dependency.",
            source_refs=("phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_018",
            touchpoint_id="ext_pharmacy_dispatch_transport",
            resolution_type="dependency",
            dependency_id="dep_cross_org_secure_messaging_mesh",
            exclusion_id="",
            resolution_summary="Some pharmacy dispatch routes rely on secure message rails or large-file transport under the same effect-ledger rules.",
            source_refs=("phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_019",
            touchpoint_id="ext_pharmacy_dispatch_transport",
            resolution_type="dependency",
            dependency_id="dep_pharmacy_referral_transport",
            exclusion_id="",
            resolution_summary="The governing pharmacy referral transport dependency owns proof, contradiction, and redispatch posture.",
            source_refs=("phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_020",
            touchpoint_id="ext_pharmacy_outcome_ingest",
            resolution_type="dependency",
            dependency_id="dep_pharmacy_outcome_observation",
            exclusion_id="",
            resolution_summary="Structured outcome observation resolves to the replay-safe outcome ingest and reconciliation path.",
            source_refs=("phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_021",
            touchpoint_id="ext_pharmacy_outcome_ingest",
            resolution_type="dependency",
            dependency_id="dep_pharmacy_urgent_return_professional_routes",
            exclusion_id="",
            resolution_summary="Urgent returns and unsupported bounce-backs use separate professional-contact routes and cannot be collapsed into ordinary outcome observation.",
            source_refs=("phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",),
        ),
        TouchpointResolutionSpec(
            resolution_id="tp_res_022",
            touchpoint_id="ext_embedded_host_bridge",
            resolution_type="dependency",
            dependency_id="dep_nhs_app_embedded_channel_ecosystem",
            exclusion_id="",
            resolution_summary="Embedded host bridge semantics resolve to the deferred NHS App embedded-channel ecosystem dependency.",
            source_refs=("phase-7-inside-the-nhs-app.md#7E. NHS App bridge API, navigation model, and embedded behaviours",),
        ),
    ]


def infer_obligation_type(text: str) -> str:
    lowered = text.lower()
    if "legal basis" in lowered or "governance" in lowered:
        return "governance"
    if "clinical-safety" in lowered or "safety" in lowered:
        return "clinical_safety"
    if "runbook" in lowered or "escalation" in lowered:
        return "operations"
    if "approve" in lowered or "approval" in lowered or "onboarding" in lowered:
        return "onboarding"
    if "template" in lowered or "publish" in lowered or "version" in lowered:
        return "contract_and_release"
    if "track" in lowered or "watch" in lowered:
        return "assurance_watch"
    return "assurance"


def build_assurance_rows(dependencies: list[DependencySpec]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for dependency in dependencies:
        for index, obligation in enumerate(dependency.assurance_or_onboarding_obligations, start=1):
            rows.append(
                {
                    "obligation_id": f"{dependency.dependency_id}_obl_{index:02d}",
                    "dependency_id": dependency.dependency_id,
                    "dependency_name": dependency.dependency_name,
                    "dependency_class": dependency.dependency_class,
                    "baseline_scope": dependency.baseline_scope,
                    "obligation_type": infer_obligation_type(obligation),
                    "obligation_statement": obligation,
                    "manual_blocker": "yes" if dependency.blocked_by_prior_approval_or_contract else "no",
                    "future_task_refs": list(dependency.future_provisioning_task_refs),
                    "browser_automation_required": dependency.future_browser_automation_required,
                    "candidate_portal_or_console": dependency.browser_automation_candidate_portal_or_console,
                    "source_refs": list(dependency.source_file_refs),
                }
            )
    return rows


def build_truth_rows(dependencies: list[DependencySpec]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for dependency in dependencies:
        rows.append(
            {
                "dependency_id": dependency.dependency_id,
                "dependency_name": dependency.dependency_name,
                "dependency_class": dependency.dependency_class,
                "baseline_scope": dependency.baseline_scope,
                "authoritative_success_proof": dependency.authoritative_success_proof,
                "accepted_or_observed_only_signals": list(dependency.non_authoritative_signals),
                "ambiguity_modes": list(dependency.ambiguity_modes),
                "degraded_patient_or_staff_posture": list(dependency.fallback_or_recovery_modes),
                "simulator_allowed": dependency.simulator_allowed,
                "touchpoint_ids": list(dependency.touchpoint_ids),
                "source_refs": list(dependency.source_file_refs),
            }
        )
    return rows


def build_backlog_rows(dependencies: list[DependencySpec], task_catalog: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for dependency in dependencies:
        for task_ref in dependency.browser_automation_task_refs:
            rows.append(
                {
                    "backlog_id": f"{dependency.dependency_id}_{task_ref}",
                    "dependency_id": dependency.dependency_id,
                    "dependency_name": dependency.dependency_name,
                    "task_ref": task_ref,
                    "task_title": task_catalog.get(task_ref, task_ref),
                    "candidate_portal_or_console": dependency.browser_automation_candidate_portal_or_console,
                    "manual_checkpoints": list(dependency.manual_checkpoints),
                    "credential_or_secret_classes": list(dependency.secrets_or_credentials_classes),
                    "blocked_by_contract_or_approval": dependency.blocked_by_prior_approval_or_contract,
                    "notes": dependency.notes,
                }
            )
    return rows


def build_simulator_payload(dependencies: list[DependencySpec]) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = {"yes": [], "partial": [], "no": []}
    for dependency in dependencies:
        grouped[dependency.simulator_allowed].append(
            {
                "dependency_id": dependency.dependency_id,
                "dependency_name": dependency.dependency_name,
                "simulator_allowed": dependency.simulator_allowed,
                "local_stub_strategy": dependency.local_stub_strategy,
                "prohibited_shortcuts": dependency.ambiguity_modes if dependency.simulator_allowed != "yes" else (),
                "source_refs": dependency.source_file_refs,
            }
        )
    return {
        "strategy_id": "vecells_dependency_simulator_strategy_v1",
        "global_rules": [
            "No browser may call partner systems directly; simulators sit behind the same internal adapter boundaries.",
            "Simulator success must never be projected as live external confirmation.",
            "Any dependency blocked on contracting, account creation, SCAL, Sandpit, AOS, or other partner approval stays partial or non-simulatable until that gate is real.",
        ],
        "groups": grouped,
    }


def build_summary(dependencies: list[DependencySpec], resolutions: list[TouchpointResolutionSpec], exclusions: list[InternalExclusionSpec], assurance_rows: list[dict[str, Any]], backlog_rows: list[dict[str, Any]]) -> dict[str, Any]:
    class_counts = Counter(dependency.dependency_class for dependency in dependencies)
    scope_counts = Counter(dependency.baseline_scope for dependency in dependencies)
    layer_counts = Counter(dependency.dependency_layer for dependency in dependencies)
    simulator_counts = Counter(dependency.simulator_allowed for dependency in dependencies)
    return {
        "dependency_count": len(dependencies),
        "touchpoint_resolution_count": len(resolutions),
        "internal_exclusion_count": len(exclusions),
        "assurance_obligation_count": len(assurance_rows),
        "browser_automation_backlog_count": len(backlog_rows),
        "class_counts": dict(sorted(class_counts.items())),
        "baseline_scope_counts": dict(sorted(scope_counts.items())),
        "layer_counts": dict(sorted(layer_counts.items())),
        "simulator_counts": dict(sorted(simulator_counts.items())),
    }


def build_inventory_payload(
    dependencies: list[DependencySpec],
    touchpoints: list[dict[str, str]],
    resolutions: list[TouchpointResolutionSpec],
    exclusions: list[InternalExclusionSpec],
    assurance_rows: list[dict[str, Any]],
    truth_rows: list[dict[str, Any]],
    simulator_payload: dict[str, Any],
    backlog_rows: list[dict[str, Any]],
    upstream: dict[str, int],
) -> dict[str, Any]:
    dependency_dicts = [asdict(dependency) for dependency in dependencies]
    resolution_dicts = [asdict(resolution) for resolution in resolutions]
    exclusion_dicts = [asdict(exclusion) for exclusion in exclusions]
    return {
        "inventory_id": "vecells_external_dependency_inventory_v1",
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream,
        "summary": build_summary(dependencies, resolutions, exclusions, assurance_rows, backlog_rows),
        "touchpoints": touchpoints,
        "internal_exclusions": exclusion_dicts,
        "touchpoint_resolution": resolution_dicts,
        "dependencies": dependency_dicts,
        "assurance_obligations": assurance_rows,
        "truth_and_fallback_matrix": truth_rows,
        "simulator_strategy": simulator_payload,
        "future_browser_automation_backlog": backlog_rows,
    }


def render_inventory_doc(payload: dict[str, Any]) -> str:
    dependencies = payload["dependencies"]
    summary = payload["summary"]
    rows = [
        [
            dependency["dependency_id"],
            dependency["dependency_name"],
            dependency["dependency_class"],
            dependency["baseline_scope"],
            dependency["dependency_layer"],
            ", ".join(dependency["touchpoint_ids"]) or "inventory_only",
            "yes" if dependency["future_browser_automation_required"] else "no",
        ]
        for dependency in dependencies
    ]
    table = render_table(
        ["Dependency ID", "Name", "Class", "Scope", "Layer", "Touchpoints", "Browser Automation"],
        rows,
    )
    return textwrap.dedent(
        f"""
        # 08 External Dependency Inventory

        Vecells now has one authoritative external-dependency inventory covering {summary["dependency_count"]} dependencies, {summary["touchpoint_resolution_count"]} touchpoint resolutions, {summary["internal_exclusion_count"]} explicit internal exclusions, and {summary["browser_automation_backlog_count"]} browser-automation backlog rows.

        ## Inventory Summary

        - Baseline-required dependencies: {summary["baseline_scope_counts"].get("baseline_required", 0)}
        - Optional-flagged dependencies: {summary["baseline_scope_counts"].get("optional_flagged", 0)}
        - Deferred Phase 7 dependencies: {summary["baseline_scope_counts"].get("deferred_phase7", 0)}
        - Future-optional dependencies: {summary["baseline_scope_counts"].get("future_optional", 0)}
        - Browser-automation candidates: {sum(1 for dependency in dependencies if dependency["future_browser_automation_required"])}

        ## Inventory Table

        {table}

        ## Required Closures

        - Supplier, messaging, pharmacy, and embedded-channel dependencies are now in one stable inventory instead of scattered prose.
        - Every dependency names authoritative proof, non-authoritative signals, ambiguity modes, and degraded fallback posture.
        - Optional and deferred boundaries are explicit: optional PDS enrichment, optional assistive model vendors, and deferred NHS App embedded-channel scope are separated from current baseline blockers.
        - Future provisioning is prepared without provisioning any service in this task.
        """
    ).strip()


def render_taxonomy_doc(payload: dict[str, Any]) -> str:
    dependencies = payload["dependencies"]
    resolutions = payload["touchpoint_resolution"]
    exclusions = payload["internal_exclusions"]
    class_rows = [
        [dep_class, count]
        for dep_class, count in sorted(payload["summary"]["class_counts"].items())
    ]
    layer_rows = [
        [layer, count]
        for layer, count in sorted(payload["summary"]["layer_counts"].items())
    ]
    by_touchpoint: dict[str, list[str]] = defaultdict(list)
    for resolution in resolutions:
        if resolution["resolution_type"] == "dependency":
            by_touchpoint[resolution["touchpoint_id"]].append(resolution["dependency_id"])
        else:
            by_touchpoint[resolution["touchpoint_id"]].append(resolution["exclusion_id"])
    touchpoint_rows = [
        [touchpoint["touchpoint_id"], touchpoint["dependency_name"], "<br>".join(by_touchpoint[touchpoint["touchpoint_id"]])]
        for touchpoint in payload["touchpoints"]
    ]
    exclusion_rows = [
        [exclusion["exclusion_id"], exclusion["touchpoint_id"], exclusion["summary"], exclusion["reason"]]
        for exclusion in exclusions
    ]
    return textwrap.dedent(
        f"""
        # 08 External Dependency Taxonomy

        ## Class Summary

        {render_table(["Dependency Class", "Count"], class_rows)}

        ## Layer Summary

        {render_table(["Layer", "Count"], layer_rows)}

        ## Touchpoint Resolution

        {render_table(["Touchpoint", "Touchpoint Name", "Resolved Dependencies / Exclusions"], touchpoint_rows)}

        ## Internal Exclusions

        {render_table(["Exclusion ID", "Touchpoint", "Summary", "Reason"], exclusion_rows)}

        ## Scope Alignment

        - `dep_pds_fhir_enrichment` is locked to `optional_flagged`.
        - `dep_nhs_app_embedded_channel_ecosystem` is locked to `deferred_phase7`.
        - `dep_assistive_model_vendor_family` is locked to `future_optional`.
        - No dependency is allowed to bypass `AdapterContractProfile` or the browser-termination rules from the runtime blueprint.
        """
    ).strip()


def render_assurance_doc(assurance_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["dependency_id"],
            row["obligation_id"],
            row["obligation_type"],
            row["obligation_statement"],
            "<br>".join(row["future_task_refs"]),
            row["manual_blocker"],
        ]
        for row in assurance_rows
    ]
    return textwrap.dedent(
        f"""
        # 08 Assurance Obligations Matrix

        This matrix turns dependency assurances into machine-readable obligations. Every row names the dependency, burden type, later task references, and whether manual approval or contracting remains a blocker.

        {render_table(["Dependency", "Obligation ID", "Type", "Obligation", "Future Tasks", "Manual Blocker"], rows)}
        """
    ).strip()


def render_truth_doc(truth_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["dependency_id"],
            row["authoritative_success_proof"],
            "<br>".join(row["accepted_or_observed_only_signals"]),
            "<br>".join(row["ambiguity_modes"]),
            "<br>".join(row["degraded_patient_or_staff_posture"]),
            row["simulator_allowed"],
        ]
        for row in truth_rows
    ]
    return textwrap.dedent(
        f"""
        # 08 Dependency Truth And Fallback Matrix

        This table closes the “transport accepted versus real truth” gap across every inventoried dependency.

        {render_table(["Dependency", "Authoritative Proof", "Accepted / Observed Only", "Ambiguity Modes", "Fallback / Recovery", "Simulator"], rows)}
        """
    ).strip()


def render_simulator_doc(simulator_payload: dict[str, Any]) -> str:
    group_sections = []
    for posture in ("yes", "partial", "no"):
        entries = simulator_payload["groups"][posture]
        rows = [
            [entry["dependency_id"], entry["dependency_name"], entry["local_stub_strategy"]]
            for entry in entries
        ]
        group_sections.append(
            "\n".join(
                [
                    f"## Simulator Posture: `{posture}`",
                    "",
                    render_table(["Dependency", "Name", "Local Stub Strategy"], rows) if rows else "_None._",
                ]
            )
        )
    return textwrap.dedent(
        f"""
        # 08 Simulator And Local Stub Strategy

        {" ".join(simulator_payload["global_rules"])}

        {"\n\n".join(group_sections)}
        """
    ).strip()


def render_backlog_doc(backlog_rows: list[dict[str, Any]]) -> str:
    rows = [
        [
            row["task_ref"],
            row["task_title"],
            row["dependency_id"],
            row["candidate_portal_or_console"],
            "<br>".join(row["manual_checkpoints"]),
            "<br>".join(row["credential_or_secret_classes"]),
            "yes" if row["blocked_by_contract_or_approval"] else "no",
        ]
        for row in backlog_rows
    ]
    return textwrap.dedent(
        f"""
        # 08 Future Provisioning And Browser Automation Backlog

        This backlog names the later tasks that must request access, create accounts, or configure partner consoles without doing any of that work in seq_008.

        {render_table(["Task", "Task Title", "Dependency", "Portal / Console", "Manual Checkpoints", "Credential Classes", "Blocked By Approval"], rows)}
        """
    ).strip()


def build_topology_rows(dependencies: list[dict[str, Any]]) -> list[dict[str, str]]:
    rows = []
    for dependency in dependencies:
        rows.append(
            {
                "dependency_id": dependency["dependency_id"],
                "dependency_name": dependency["dependency_name"],
                "dependency_class": dependency["dependency_class"],
                "dependency_layer": dependency["dependency_layer"],
                "baseline_scope": dependency["baseline_scope"],
            }
        )
    return rows


def build_html(payload: dict[str, Any]) -> str:
    embedded_json = json.dumps(payload, separators=(",", ":"))
    safe_json = (
        embedded_json.replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("</", "<\\/")
    )
    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vecells External Dependency Atlas</title>
  <link rel="icon" href="data:,">
  <style>
    :root {{
      --bg: #F5F7FA;
      --surface: #FFFFFF;
      --ink: #121826;
      --muted: #475467;
      --border: #D0D5DD;
      --cobalt: #335CFF;
      --teal: #0F8B8D;
      --success: #0F9D58;
      --warning: #C98900;
      --danger: #C24141;
      --lavender: #6E59D9;
      --neutral: #98A2B3;
      --shadow: 0 8px 24px rgba(18,24,38,0.06);
      --radius: 16px;
      --chip: 999px;
      --focus: 2px solid #335CFF;
      --rail: 280px;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
    body {{ min-height: 100vh; }}
    a {{ color: inherit; }}
    button, select, input {{
      font: inherit;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--ink);
    }}
    button {{ cursor: pointer; }}
    :focus-visible {{ outline: var(--focus); outline-offset: 2px; }}
    .shell {{
      max-width: 1440px;
      margin: 0 auto;
      padding: 20px 32px 40px;
      display: grid;
      grid-template-columns: var(--rail) minmax(0, 1fr);
      gap: 32px;
    }}
    .nav {{
      position: sticky;
      top: 20px;
      align-self: start;
      display: grid;
      gap: 16px;
    }}
    .panel {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }}
    .nav .panel, .content .panel {{ padding: 20px; }}
    .brand {{
      height: 72px;
      display: flex;
      align-items: center;
      gap: 14px;
    }}
    .brand svg {{ flex: none; }}
    .brand strong {{ font-size: 16px; line-height: 24px; }}
    .brand span {{ display: block; color: var(--muted); font-size: 13px; line-height: 20px; }}
    .nav h2, .section h2 {{ margin: 0 0 12px; font-size: 20px; line-height: 28px; font-weight: 600; }}
    .hero {{
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
      gap: 20px;
      margin-bottom: 20px;
    }}
    .hero h1 {{ margin: 0 0 12px; font-size: 28px; line-height: 34px; font-weight: 600; }}
    .hero p {{ margin: 0; color: var(--muted); font-size: 14px; line-height: 22px; }}
    .ribbon {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }}
    .chip {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: var(--chip);
      border: 1px solid var(--border);
      background: #f9fafb;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
    }}
    .chip.scope-baseline_required {{ background: rgba(15,157,88,0.08); color: var(--success); border-color: rgba(15,157,88,0.22); }}
    .chip.scope-optional_flagged {{ background: rgba(201,137,0,0.08); color: var(--warning); border-color: rgba(201,137,0,0.22); }}
    .chip.scope-deferred_phase7 {{ background: rgba(110,89,217,0.08); color: var(--lavender); border-color: rgba(110,89,217,0.22); }}
    .chip.scope-future_optional {{ background: rgba(152,162,179,0.16); color: var(--muted); border-color: rgba(152,162,179,0.24); }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }}
    .stat {{
      padding: 14px;
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(51,92,255,0.04), rgba(15,139,141,0.02));
      border: 1px solid rgba(51,92,255,0.08);
    }}
    .stat strong {{ display: block; font-size: 24px; line-height: 30px; }}
    .stat span {{ color: var(--muted); font-size: 13px; line-height: 20px; }}
    .content {{
      display: grid;
      gap: 20px;
    }}
    .filters {{
      display: grid;
      gap: 12px;
    }}
    .filters label {{
      display: grid;
      gap: 6px;
      font-size: 13px;
      line-height: 20px;
      color: var(--muted);
    }}
    .filters input, .filters select, .filters button {{
      min-height: 40px;
      padding: 0 12px;
    }}
    .toggle-group {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .toggle-group button[aria-pressed="true"] {{
      border-color: rgba(51,92,255,0.35);
      color: var(--cobalt);
      background: rgba(51,92,255,0.08);
    }}
    .section-head {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }}
    .section-head p {{
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 22px;
    }}
    .topology-layout {{
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 16px;
    }}
    .map-wrap {{
      border-radius: 14px;
      border: 1px solid var(--border);
      background: radial-gradient(circle at top, rgba(51,92,255,0.08), rgba(255,255,255,0.4) 40%, rgba(255,255,255,1));
      padding: 12px;
      min-height: 420px;
      overflow: auto;
    }}
    svg text {{ font-family: inherit; font-size: 12px; fill: var(--ink); }}
    .table-wrap {{
      overflow: auto;
      border-radius: 14px;
      border: 1px solid var(--border);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      line-height: 20px;
    }}
    th, td {{
      padding: 10px 12px;
      border-bottom: 1px solid #eaecf0;
      text-align: left;
      vertical-align: top;
    }}
    th {{
      background: #f8fafc;
      color: var(--muted);
      font-weight: 600;
      position: sticky;
      top: 0;
    }}
    .card-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }}
    .dep-card {{
      text-align: left;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow);
      display: grid;
      gap: 12px;
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }}
    .dep-card:hover {{ transform: translateY(-1px); border-color: rgba(51,92,255,0.28); }}
    .dep-card.active {{ border-color: rgba(51,92,255,0.35); box-shadow: 0 12px 28px rgba(51,92,255,0.12); }}
    .dep-card h3 {{
      margin: 0;
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
    }}
    .dep-card p {{
      margin: 0;
      color: var(--muted);
      font-size: 14px;
      line-height: 22px;
    }}
    .detail-grid {{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
      gap: 16px;
    }}
    .detail-list {{
      display: grid;
      gap: 14px;
    }}
    .detail-item strong {{
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 20px;
      color: var(--muted);
    }}
    .detail-item p, .detail-item ul {{
      margin: 0;
      font-size: 14px;
      line-height: 22px;
    }}
    .detail-item ul {{
      padding-left: 18px;
    }}
    .muted {{
      color: var(--muted);
    }}
    .hidden {{ display: none !important; }}
    .live-region {{
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }}
    @media (max-width: 1100px) {{
      .shell {{
        grid-template-columns: 1fr;
      }}
      .nav {{
        position: static;
      }}
      .hero,
      .topology-layout,
      .detail-grid {{
        grid-template-columns: 1fr;
      }}
    }}
    @media (max-width: 720px) {{
      .shell {{
        padding: 16px;
        gap: 16px;
      }}
      .nav .panel, .content .panel {{
        padding: 16px;
      }}
      .stats {{
        grid-template-columns: 1fr 1fr;
      }}
    }}
  </style>
</head>
<body>
  <script id="atlas-data" type="application/json">__EMBEDDED_JSON__</script>
  <div class="live-region" aria-live="polite" id="live-region"></div>
  <div class="shell" data-testid="atlas-shell">
    <aside class="nav" data-testid="atlas-nav">
      <div class="panel brand">
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="10" cy="10" r="4.5" fill="#335CFF"></circle>
          <circle cx="22" cy="32" r="4.5" fill="#0F8B8D"></circle>
          <circle cx="34" cy="10" r="4.5" fill="#6E59D9"></circle>
          <path d="M10 10 L22 32 L34 10" fill="none" stroke="#121826" stroke-width="2.5" stroke-linecap="round"></path>
        </svg>
        <div>
          <strong>Vecells Dependency Atlas</strong>
          <span>External dependency constellation</span>
        </div>
      </div>
      <div class="panel filters">
        <h2>Filters</h2>
        <label>
          Search
          <input type="search" id="search" placeholder="Search dependency, class, task, or touchpoint" data-testid="search-input">
        </label>
        <div data-testid="baseline-toggle">
          <label>Baseline Ribbon</label>
          <div class="toggle-group" id="scope-toggle-group" role="group" aria-label="Baseline and deferred filter">
            <button type="button" data-scope="all" aria-pressed="true">All</button>
            <button type="button" data-scope="baseline_required">Baseline</button>
            <button type="button" data-scope="nonbaseline">Deferred / Optional</button>
          </div>
        </div>
        <label>
          Class
          <select id="class-filter" data-testid="class-filter">
            <option value="all">All classes</option>
          </select>
        </label>
      </div>
      <div class="panel">
        <h2>Atlas Notes</h2>
        <p class="muted">No browser may call partner systems directly. Every card here describes an adapter or governed partner boundary, not a front-end shortcut.</p>
      </div>
    </aside>
    <main class="content">
      <section class="hero" data-testid="hero-summary">
        <div class="panel">
          <h1>Dependency Constellation</h1>
          <p id="hero-text"></p>
          <div class="ribbon" id="baseline-ribbon"></div>
        </div>
        <div class="panel">
          <div class="stats" id="stats-grid"></div>
        </div>
      </section>
      <section class="panel section">
        <div class="section-head">
          <div>
            <h2>Layered Topology</h2>
            <p>Product core, integration boundary, partner layer, and assurance layer stay visually separate so truth, fallback, and onboarding debt are easy to inspect.</p>
          </div>
        </div>
        <div class="topology-layout">
          <div class="map-wrap" data-testid="topology-map">
            <svg id="topology-svg" width="860" height="520" role="img" aria-label="Dependency topology map"></svg>
          </div>
          <div class="table-wrap" data-testid="topology-table">
            <table>
              <thead>
                <tr><th>Dependency</th><th>Class</th><th>Layer</th><th>Scope</th></tr>
              </thead>
              <tbody id="topology-table-body"></tbody>
            </table>
          </div>
        </div>
      </section>
      <section class="panel section">
        <div class="section-head">
          <div>
            <h2>Dependency Cards</h2>
            <p>Cards group the inventory by class and keep baseline, deferred, and future-optional posture visible at a glance.</p>
          </div>
        </div>
        <div class="card-grid" id="dependency-card-list" data-testid="dependency-card-list"></div>
      </section>
      <section class="panel section" data-testid="detail-panel">
        <div class="section-head">
          <div>
            <h2>Selected Dependency</h2>
            <p id="detail-subtitle">Choose a dependency card or use a deep link to inspect proof, ambiguity, simulator posture, and future provisioning debt.</p>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-list" id="detail-list"></div>
          <div class="detail-list">
            <div class="table-wrap" data-testid="truth-ladder-table">
              <table>
                <thead>
                  <tr><th>Truth Tier</th><th>Meaning</th></tr>
                </thead>
                <tbody id="truth-table-body"></tbody>
              </table>
            </div>
            <div class="panel" data-testid="simulator-panel">
              <h2>Simulator Posture</h2>
              <div id="simulator-body" class="muted"></div>
            </div>
            <div class="table-wrap" data-testid="backlog-table">
              <table>
                <thead>
                  <tr><th>Task</th><th>Portal / Console</th><th>Manual Checkpoints</th></tr>
                </thead>
                <tbody id="backlog-table-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
  <script>
    const payload = JSON.parse(document.getElementById('atlas-data').textContent);
    const dependencies = payload.dependencies.slice().sort((a, b) => a.dependency_name.localeCompare(b.dependency_name));
    const backlog = payload.future_browser_automation_backlog;
    const liveRegion = document.getElementById('live-region');
    const searchInput = document.getElementById('search');
    const classFilter = document.getElementById('class-filter');
    const scopeButtons = Array.from(document.querySelectorAll('#scope-toggle-group button'));
    const heroText = document.getElementById('hero-text');
    const baselineRibbon = document.getElementById('baseline-ribbon');
    const statsGrid = document.getElementById('stats-grid');
    const cardList = document.getElementById('dependency-card-list');
    const topologyTableBody = document.getElementById('topology-table-body');
    const topologySvg = document.getElementById('topology-svg');
    const detailList = document.getElementById('detail-list');
    const truthTableBody = document.getElementById('truth-table-body');
    const simulatorBody = document.getElementById('simulator-body');
    const backlogTableBody = document.getElementById('backlog-table-body');
    const state = {{
      search: '',
      classFilter: 'all',
      scope: 'all',
      selectedId: dependencies[0] ? dependencies[0].dependency_id : null,
    }};

    const scopeLabel = {{
      baseline_required: 'Baseline',
      optional_flagged: 'Optional',
      deferred_phase7: 'Deferred Phase 7',
      future_optional: 'Future Optional',
    }};

    function uniqueClasses() {{
      return Array.from(new Set(dependencies.map(dep => dep.dependency_class))).sort();
    }}

    function populateClassFilter() {{
      uniqueClasses().forEach(depClass => {{
        const option = document.createElement('option');
        option.value = depClass;
        option.textContent = depClass.replaceAll('_', ' ');
        classFilter.appendChild(option);
      }});
    }}

    function matches(dep) {{
      const needle = state.search.trim().toLowerCase();
      const searchable = [
        dep.dependency_id,
        dep.dependency_name,
        dep.dependency_class,
        dep.dependency_layer,
        dep.baseline_scope,
        ...(dep.touchpoint_ids || []),
        ...(dep.future_provisioning_task_refs || []),
      ].join(' ').toLowerCase();
      const scopeMatch = state.scope === 'all'
        ? true
        : state.scope === 'baseline_required'
          ? dep.baseline_scope === 'baseline_required'
          : dep.baseline_scope !== 'baseline_required';
      const classMatch = state.classFilter === 'all' || dep.dependency_class === state.classFilter;
      const searchMatch = !needle || searchable.includes(needle);
      return scopeMatch && classMatch && searchMatch;
    }}

    function visibleDependencies() {{
      return dependencies.filter(matches);
    }}

    function ensureSelection(visible) {{
      if (!visible.length) {{
        state.selectedId = null;
        return;
      }}
      if (!visible.some(dep => dep.dependency_id === state.selectedId)) {{
        state.selectedId = visible[0].dependency_id;
      }}
    }}

    function selectedDependency(visible) {{
      return visible.find(dep => dep.dependency_id === state.selectedId) || null;
    }}

    function setHash(id) {{
      if (!id) return;
      history.replaceState(null, '', `#${{id}}`);
    }}

    function announce(message) {{
      liveRegion.textContent = '';
      window.requestAnimationFrame(() => {{
        liveRegion.textContent = message;
      }});
    }}

    function renderHero(visible) {{
      const summary = payload.summary;
      heroText.textContent = `Grounded in ${summary.dependency_count} dependencies, this atlas separates current baseline rails from deferred or optional dependencies while keeping authoritative proof, fallback, simulator posture, and future provisioning debt on one page.`;
      baselineRibbon.innerHTML = '';
      [
        ['Current baseline', summary.baseline_scope_counts.baseline_required || 0, 'baseline_required'],
        ['Optional flagged', summary.baseline_scope_counts.optional_flagged || 0, 'optional_flagged'],
        ['Deferred Phase 7', summary.baseline_scope_counts.deferred_phase7 || 0, 'deferred_phase7'],
        ['Future optional', summary.baseline_scope_counts.future_optional || 0, 'future_optional'],
      ].forEach(([label, count, scope]) => {{
        const chip = document.createElement('span');
        chip.className = `chip scope-${{scope}}`;
        chip.textContent = `${{label}}: ${{count}}`;
        baselineRibbon.appendChild(chip);
      }});
      statsGrid.innerHTML = '';
      [
        ['Visible dependencies', visible.length],
        ['Browser backlog rows', payload.summary.browser_automation_backlog_count],
        ['Touchpoint resolutions', payload.summary.touchpoint_resolution_count],
        ['Internal exclusions', payload.summary.internal_exclusion_count],
      ].forEach(([label, value]) => {{
        const card = document.createElement('div');
        card.className = 'stat';
        card.innerHTML = `<strong>${{value}}</strong><span>${{label}}</span>`;
        statsGrid.appendChild(card);
      }});
    }}

    function buildCard(dep) {{
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dep-card' + (dep.dependency_id === state.selectedId ? ' active' : '');
      button.dataset.id = dep.dependency_id;
      button.setAttribute('aria-pressed', dep.dependency_id === state.selectedId ? 'true' : 'false');
      button.innerHTML = `
        <div>
          <div class="ribbon">
            <span class="chip scope-${{dep.baseline_scope}}">${{scopeLabel[dep.baseline_scope] || dep.baseline_scope}}</span>
            <span class="chip">${{dep.dependency_class.replaceAll('_', ' ')}}</span>
          </div>
        </div>
        <div>
          <h3>${{dep.dependency_name}}</h3>
          <p>${{dep.business_purpose}}</p>
        </div>
        <div class="muted">${{dep.touchpoint_ids.length ? dep.touchpoint_ids.join(', ') : 'inventory only'}}</div>
      `;
      button.addEventListener('click', () => {{
        state.selectedId = dep.dependency_id;
        setHash(dep.dependency_id);
        render();
      }});
      return button;
    }}

    function renderCards(visible) {{
      cardList.innerHTML = '';
      visible.forEach(dep => cardList.appendChild(buildCard(dep)));
    }}

    function renderTopology(visible) {{
      topologyTableBody.innerHTML = '';
      visible.forEach(dep => {{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a href="#${{dep.dependency_id}}">${{dep.dependency_name}}</a></td>
          <td>${{dep.dependency_class.replaceAll('_', ' ')}}</td>
          <td>${{dep.dependency_layer.replaceAll('_', ' ')}}</td>
          <td>${{scopeLabel[dep.baseline_scope] || dep.baseline_scope}}</td>
        `;
        topologyTableBody.appendChild(tr);
      }});
      const width = 860;
      const height = 520;
      const centerX = width / 2;
      const centerY = height / 2;
      const ringMap = {{
        clinical_platform_rail: 120,
        transport_message_rail: 185,
        supplier_specific_adapter: 250,
        channel_partner_surface: 315,
        security_assurance_dependency: 380,
        optional_feature_flagged: 315,
        deferred_channel_expansion: 380,
      }};
      const angleStep = visible.length ? (Math.PI * 2) / visible.length : 0;
      const nodes = visible.map((dep, index) => {{
        const radius = ringMap[dep.dependency_layer] || 220;
        const angle = (index * angleStep) - Math.PI / 2;
        return {{
          dep,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        }};
      }});
      const nodeMarkup = nodes.map(node => {{
        const active = node.dep.dependency_id === state.selectedId;
        const stroke = active ? '#335CFF' : '#D0D5DD';
        const fill = active ? 'rgba(51,92,255,0.12)' : '#FFFFFF';
        return `
          <g tabindex="0" role="button" aria-label="${{node.dep.dependency_name}}" data-id="${{node.dep.dependency_id}}" class="topology-node">
            <line x1="${{centerX}}" y1="${{centerY}}" x2="${{node.x}}" y2="${{node.y}}" stroke="rgba(152,162,179,0.55)" stroke-width="1.5"></line>
            <circle cx="${{node.x}}" cy="${{node.y}}" r="34" fill="${{fill}}" stroke="${{stroke}}" stroke-width="2"></circle>
            <text x="${{node.x}}" y="${{node.y - 6}}" text-anchor="middle">${{node.dep.dependency_class.replaceAll('_', ' ')}}</text>
            <text x="${{node.x}}" y="${{node.y + 12}}" text-anchor="middle">${{node.dep.dependency_name.slice(0, 16)}}</text>
          </g>
        `;
      }}).join('');
      topologySvg.innerHTML = `
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(18,24,38,0.08)"></feDropShadow>
          </filter>
        </defs>
        <circle cx="${{centerX}}" cy="${{centerY}}" r="52" fill="#FFFFFF" stroke="#121826" stroke-width="2.5" filter="url(#shadow)"></circle>
        <text x="${{centerX}}" y="${{centerY - 6}}" text-anchor="middle" style="font-size: 15px; font-weight: 600;">Vecells core</text>
        <text x="${{centerX}}" y="${{centerY + 14}}" text-anchor="middle" style="fill:#475467;">integration boundary</text>
        ${nodeMarkup}
      `;
      topologySvg.querySelectorAll('.topology-node').forEach(node => {{
        node.addEventListener('click', () => {{
          state.selectedId = node.dataset.id;
          setHash(node.dataset.id);
          render();
        }});
        node.addEventListener('keydown', event => {{
          if (event.key === 'Enter' || event.key === ' ') {{
            event.preventDefault();
            state.selectedId = node.dataset.id;
            setHash(node.dataset.id);
            render();
          }}
        }});
      }});
    }}

    function renderDetails(selected) {{
      if (!selected) {{
        detailList.innerHTML = '<p class="muted">No dependency matches the current filters.</p>';
        truthTableBody.innerHTML = '';
        simulatorBody.textContent = '';
        backlogTableBody.innerHTML = '';
        return;
      }}
      detailList.innerHTML = `
        <div class="detail-item">
          <strong>${{selected.dependency_name}}</strong>
          <p>${{selected.business_purpose}}</p>
        </div>
        <div class="detail-item">
          <strong>Integration mode</strong>
          <p>${{selected.integration_mode}}</p>
        </div>
        <div class="detail-item">
          <strong>Bounded contexts</strong>
          <p>${{selected.bound_bounded_contexts.join(', ')}}</p>
        </div>
        <div class="detail-item">
          <strong>Assurance and onboarding obligations</strong>
          <ul>${{selected.assurance_or_onboarding_obligations.map(item => `<li>${{item}}</li>`).join('')}}</ul>
        </div>
        <div class="detail-item">
          <strong>Operator and runbook dependencies</strong>
          <ul>${{selected.operator_or_runbook_dependencies.map(item => `<li>${{item}}</li>`).join('')}}</ul>
        </div>
        <div class="detail-item">
          <strong>Source refs</strong>
          <ul>${{selected.source_file_refs.map(item => `<li>${{item}}</li>`).join('')}}</ul>
        </div>
      `;
      truthTableBody.innerHTML = `
        <tr><td>Accepted / observed</td><td>${{selected.non_authoritative_signals.join('<br>')}}</td></tr>
        <tr><td>Confirmed</td><td>${{selected.authoritative_success_proof}}</td></tr>
        <tr><td>Ambiguous</td><td>${{selected.ambiguity_modes.join('<br>')}}</td></tr>
        <tr><td>Failed / degraded</td><td>${{selected.fallback_or_recovery_modes.join('<br>')}}</td></tr>
      `;
      simulatorBody.innerHTML = `
        <p><strong>Allowed:</strong> ${{selected.simulator_allowed}}</p>
        <p>${{selected.local_stub_strategy}}</p>
      `;
      const dependencyBacklog = backlog.filter(item => item.dependency_id === selected.dependency_id);
      backlogTableBody.innerHTML = dependencyBacklog.length
        ? dependencyBacklog.map(item => `
            <tr>
              <td><a href="#${{selected.dependency_id}}">${{item.task_ref}}<br><span class="muted">${{item.task_title}}</span></a></td>
              <td>${{item.candidate_portal_or_console}}</td>
              <td>${{item.manual_checkpoints.join('<br>')}}</td>
            </tr>
          `).join('')
        : '<tr><td colspan="3" class="muted">No browser-automation backlog rows for the selected dependency.</td></tr>';
    }}

    function render() {{
      const visible = visibleDependencies();
      ensureSelection(visible);
      renderHero(visible);
      renderCards(visible);
      renderTopology(visible);
      renderDetails(selectedDependency(visible));
      announce(`${{visible.length}} dependency cards shown.`);
    }}

    scopeButtons.forEach(button => {{
      button.addEventListener('click', () => {{
        state.scope = button.dataset.scope;
        scopeButtons.forEach(item => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
        render();
      }});
    }});

    searchInput.addEventListener('input', () => {{
      state.search = searchInput.value;
      render();
    }});

    classFilter.addEventListener('change', () => {{
      state.classFilter = classFilter.value;
      render();
    }});

    window.addEventListener('hashchange', () => {{
      const requested = window.location.hash.replace('#', '');
      if (requested && dependencies.some(dep => dep.dependency_id === requested)) {{
        state.selectedId = requested;
        render();
      }}
    }});

    populateClassFilter();
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && dependencies.some(dep => dep.dependency_id === initialHash)) {{
      state.selectedId = initialHash;
    }}
    render();
  </script>
</body>
</html>
"""
    html_template = html_template.replace("{{", "{").replace("}}", "}")
    return html_template.replace("__EMBEDDED_JSON__", safe_json)


def build_bundle() -> dict[str, Any]:
    upstream = ensure_prerequisites()
    dependencies = build_dependencies()
    touchpoints = load_csv(EXTERNAL_TOUCHPOINT_PATH)
    resolutions = build_touchpoint_resolutions()
    exclusions = build_internal_exclusions()
    task_catalog = load_task_catalog()
    assurance_rows = build_assurance_rows(dependencies)
    truth_rows = build_truth_rows(dependencies)
    simulator_payload = build_simulator_payload(dependencies)
    backlog_rows = build_backlog_rows(dependencies, task_catalog)
    inventory_payload = build_inventory_payload(
        dependencies=dependencies,
        touchpoints=touchpoints,
        resolutions=resolutions,
        exclusions=exclusions,
        assurance_rows=assurance_rows,
        truth_rows=truth_rows,
        simulator_payload=simulator_payload,
        backlog_rows=backlog_rows,
        upstream=upstream,
    )
    return {
        "inventory_payload": inventory_payload,
        "inventory_csv_rows": [asdict(dependency) for dependency in dependencies],
        "assurance_rows": assurance_rows,
        "truth_rows": truth_rows,
        "simulator_payload": simulator_payload,
        "backlog_rows": backlog_rows,
        "inventory_doc": render_inventory_doc(inventory_payload),
        "taxonomy_doc": render_taxonomy_doc(inventory_payload),
        "assurance_doc": render_assurance_doc(assurance_rows),
        "truth_doc": render_truth_doc(truth_rows),
        "simulator_doc": render_simulator_doc(simulator_payload),
        "backlog_doc": render_backlog_doc(backlog_rows),
        "atlas_html": build_html(inventory_payload),
    }


def main() -> None:
    bundle = build_bundle()
    write_json(DEPENDENCIES_JSON_PATH, bundle["inventory_payload"])
    write_json(SIMULATOR_JSON_PATH, bundle["simulator_payload"])
    write_csv(
        INVENTORY_CSV_PATH,
        [
            "dependency_id",
            "dependency_name",
            "dependency_class",
            "dependency_layer",
            "baseline_scope",
            "source_file_refs",
            "business_purpose",
            "bound_bounded_contexts",
            "integration_mode",
            "adapter_contract_family",
            "authoritative_success_proof",
            "non_authoritative_signals",
            "ambiguity_modes",
            "fallback_or_recovery_modes",
            "simulator_allowed",
            "local_stub_strategy",
            "assurance_or_onboarding_obligations",
            "operator_or_runbook_dependencies",
            "future_provisioning_task_refs",
            "browser_automation_task_refs",
            "future_browser_automation_required",
            "browser_automation_candidate_portal_or_console",
            "manual_checkpoints",
            "blocked_by_prior_approval_or_contract",
            "secrets_or_credentials_classes",
            "tenant_or_org_scope",
            "deferred_reason_if_any",
            "touchpoint_ids",
            "affects_patient_visible_truth",
            "notes",
        ],
        bundle["inventory_csv_rows"],
    )
    write_csv(
        ASSURANCE_CSV_PATH,
        [
            "obligation_id",
            "dependency_id",
            "dependency_name",
            "dependency_class",
            "baseline_scope",
            "obligation_type",
            "obligation_statement",
            "manual_blocker",
            "future_task_refs",
            "browser_automation_required",
            "candidate_portal_or_console",
            "source_refs",
        ],
        bundle["assurance_rows"],
    )
    write_csv(
        TRUTH_MATRIX_CSV_PATH,
        [
            "dependency_id",
            "dependency_name",
            "dependency_class",
            "baseline_scope",
            "authoritative_success_proof",
            "accepted_or_observed_only_signals",
            "ambiguity_modes",
            "degraded_patient_or_staff_posture",
            "simulator_allowed",
            "touchpoint_ids",
            "source_refs",
        ],
        bundle["truth_rows"],
    )
    write_csv(
        AUTOMATION_BACKLOG_CSV_PATH,
        [
            "backlog_id",
            "dependency_id",
            "dependency_name",
            "task_ref",
            "task_title",
            "candidate_portal_or_console",
            "manual_checkpoints",
            "credential_or_secret_classes",
            "blocked_by_contract_or_approval",
            "notes",
        ],
        bundle["backlog_rows"],
    )
    write_text(INVENTORY_DOC_PATH, bundle["inventory_doc"])
    write_text(TAXONOMY_DOC_PATH, bundle["taxonomy_doc"])
    write_text(ASSURANCE_DOC_PATH, bundle["assurance_doc"])
    write_text(TRUTH_DOC_PATH, bundle["truth_doc"])
    write_text(SIMULATOR_DOC_PATH, bundle["simulator_doc"])
    write_text(BACKLOG_DOC_PATH, bundle["backlog_doc"])
    write_text(ATLAS_HTML_PATH, bundle["atlas_html"])
    print(
        f"Built seq_008 dependency inventory with {bundle['inventory_payload']['summary']['dependency_count']} dependencies, "
        f"{bundle['inventory_payload']['summary']['assurance_obligation_count']} assurance rows, and "
        f"{bundle['inventory_payload']['summary']['browser_automation_backlog_count']} browser backlog rows."
    )


if __name__ == "__main__":
    main()
