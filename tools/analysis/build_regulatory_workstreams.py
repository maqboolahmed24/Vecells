#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import Counter
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
PRODUCT_SCOPE_PATH = DATA_DIR / "product_scope_matrix.json"
AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
REQUEST_LINEAGE_PATH = DATA_DIR / "request_lineage_transitions.json"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
STATE_MACHINES_PATH = DATA_DIR / "state_machines.json"
EXTERNAL_DEPENDENCIES_PATH = DATA_DIR / "external_dependencies.json"
CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

WORKSTREAMS_JSON_PATH = DATA_DIR / "regulatory_workstreams.json"
FRAMEWORK_MAPPING_CSV_PATH = DATA_DIR / "framework_control_mapping.csv"
EVIDENCE_SCHEDULE_CSV_PATH = DATA_DIR / "evidence_artifact_schedule.csv"
HAZARD_REGISTER_CSV_PATH = DATA_DIR / "safety_hazard_register_seed.csv"
CHANGE_TRIGGER_CSV_PATH = DATA_DIR / "change_control_trigger_matrix.csv"

REGULATORY_DOC_PATH = DOCS_DIR / "09_regulatory_workstreams.md"
CLINICAL_SAFETY_DOC_PATH = DOCS_DIR / "09_clinical_safety_workstreams.md"
FRAMEWORK_DOC_PATH = DOCS_DIR / "09_framework_control_mapping.md"
EVIDENCE_DOC_PATH = DOCS_DIR / "09_evidence_artifact_schedule.md"
HAZARD_DOC_PATH = DOCS_DIR / "09_hazard_change_control_and_signoff_model.md"
BOARD_HTML_PATH = DOCS_DIR / "09_regulatory_workstream_board.html"

MISSION = (
    "Define the explicit regulatory, clinical-safety, privacy, accessibility, assurance, "
    "records, resilience, and change-control operating model that must run alongside "
    "Vecells implementation without flattening the corpus into a timeless checklist."
)

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "phase-1-the-red-flag-gate.md",
    "phase-2-identity-and-echoes.md",
    "phase-7-inside-the-nhs-app.md",
    "phase-8-the-assistive-layer.md",
    "phase-9-the-assurance-ledger.md",
    "accessibility-and-content-system-contract.md",
    "platform-runtime-and-release-blueprint.md",
    "platform-admin-and-config-blueprint.md",
    "governance-admin-console-frontend-blueprint.md",
    "phase-cards.md",
    "forensic-audit-findings.md",
    "blueprint-init.md",
]

ATLAS_MARKERS = [
    'data-testid="board-shell"',
    'data-testid="board-nav"',
    'data-testid="board-hero"',
    'data-testid="phase-baseline-ribbon"',
    'data-testid="scope-filters"',
    'data-testid="search-input"',
    'data-testid="lane-list"',
    'data-testid="evidence-view"',
    'data-testid="signoff-map"',
    'data-testid="trigger-matrix"',
    'data-testid="hazard-panel"',
    'data-testid="detail-panel"',
]

ALLOWED_WORKSTREAM_SCOPES = {
    "baseline_required",
    "deferred_phase7",
    "assistive_optional",
    "partner_specific",
    "ongoing_bau",
}

ALLOWED_SCHEDULE_CLASSES = {
    "creation_time",
    "phase_exit",
    "pre_release",
    "continuous_operational",
    "periodic_publication",
}

ALLOWED_TRIGGER_FLAGS = {"yes", "no", "conditional"}

MANDATORY_WORKSTREAM_IDS = {
    "WS_CLINICAL_MANUFACTURER",
    "WS_CLINICAL_DEPLOYMENT_USE",
    "WS_DATA_PROTECTION_PRIVACY",
    "WS_TECHNICAL_SECURITY_ASSURANCE",
    "WS_INTEROPERABILITY_EVIDENCE",
    "WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD",
    "WS_RECORDS_RETENTION_GOVERNANCE",
    "WS_INCIDENT_NEAR_MISS_REPORTABILITY",
    "WS_PARTNER_ONBOARDING_EVIDENCE",
    "WS_NHS_APP_SCAL_CHANNEL",
    "WS_ASSISTIVE_AI_GOVERNANCE",
    "WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
    "WS_OPERATIONAL_RESILIENCE_RESTORE",
}

MANDATORY_FRAMEWORK_CODES = {
    "FW_DCB0129",
    "FW_DCB0160",
    "FW_DTAC",
    "FW_DSPT",
    "FW_RECORDS_MGMT_CODE",
    "FW_WCAG_22_AA",
    "FW_NHS_SERVICE_STANDARD",
    "FW_GDPR",
    "FW_PECR",
    "FW_NHS_LOGIN_ONBOARDING",
    "FW_IM1_PAIRING_AND_RFC",
    "FW_NHS_APP_WEB_INTEGRATION",
    "FW_SCAL",
    "FW_AI_AMBIENT_GUIDANCE",
    "FW_MHRA_MEDICAL_DEVICE_BOUNDARY",
    "FW_RUNTIME_PARITY_AND_WATCHLIST",
}

MANDATORY_ASSISTIVE_TRIGGER_IDS = {
    "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
    "CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT",
    "CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
    "CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE",
}


@dataclass(frozen=True)
class FrameworkContextSpec:
    framework_code: str
    framework_name: str
    governance_class: str
    source_version_context: str
    source_date_context: str
    baseline_relevance: str
    source_refs: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class WorkstreamSpec:
    workstream_id: str
    workstream_name: str
    workstream_family: str
    framework_or_governance_basis: tuple[str, ...]
    baseline_scope: str
    source_file_refs: tuple[str, ...]
    standards_version_context: tuple[str, ...]
    why_it_exists: str
    affected_phases: tuple[str, ...]
    triggering_changes: tuple[str, ...]
    required_artifacts: tuple[str, ...]
    required_reviews_or_signoffs: tuple[str, ...]
    required_test_or_rehearsal_classes: tuple[str, ...]
    blocking_release_conditions: tuple[str, ...]
    cadence: str
    primary_owner_role: str
    secondary_owner_roles: tuple[str, ...]
    dependency_refs: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class ControlMappingSpec:
    mapping_id: str
    framework_code: str
    workstream_id: str
    control_code: str
    control_summary: str
    required_evidence_artifacts: tuple[str, ...]
    source_phase_refs: tuple[str, ...]
    source_object_refs: tuple[str, ...]
    release_gates: tuple[str, ...]
    operational_gates: tuple[str, ...]
    baseline_scope: str
    mapping_state: str
    source_refs: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class EvidenceArtifactSpec:
    artifact_schedule_id: str
    artifact_name: str
    artifact_family: str
    workstream_id: str
    trigger_class: str
    schedule_class: str
    cadence: str
    baseline_scope: str
    source_phase_refs: tuple[str, ...]
    primary_owner_role: str
    independent_signoff_roles: tuple[str, ...]
    release_or_operational_gate: tuple[str, ...]
    freshness_expectation: str
    source_refs: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class HazardSpec:
    hazard_id: str
    hazard_title: str
    hazard_family: str
    baseline_scope: str
    description: str
    initiating_change_classes: tuple[str, ...]
    potential_harms: tuple[str, ...]
    required_controls: tuple[str, ...]
    required_evidence: tuple[str, ...]
    primary_workstream_ids: tuple[str, ...]
    required_independent_signoff: tuple[str, ...]
    source_refs: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class ChangeTriggerSpec:
    change_trigger_id: str
    change_class: str
    baseline_scope: str
    impacted_workstreams: tuple[str, ...]
    impacted_frameworks: tuple[str, ...]
    trigger_hazard_log_update: str
    trigger_safety_case_delta: str
    trigger_dpia_rerun: str
    trigger_dtac_delta: str
    trigger_release_freeze: str
    trigger_partner_rfc_or_scal_update: str
    required_signoff_classes: tuple[str, ...]
    required_rehearsal_classes: tuple[str, ...]
    blocking_condition: str
    source_refs: tuple[str, ...]
    notes: str


@dataclass(frozen=True)
class SignoffNodeSpec:
    role_code: str
    role_name: str
    approval_domain: str
    independence_group: str
    notes: str


@dataclass(frozen=True)
class SignoffEdgeSpec:
    edge_id: str
    from_role_code: str
    to_role_code: str
    applies_to: tuple[str, ...]
    independence_rule: str
    approval_artifacts: tuple[str, ...]
    notes: str


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def count_jsonl(path: Path) -> int:
    return sum(1 for line in path.read_text().splitlines() if line.strip())


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


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: flatten(row.get(key, "")) for key in fieldnames})


def title_case_scope(scope: str) -> str:
    return scope.replace("_", " ").title()


def ensure_prerequisites() -> dict[str, int]:
    required = {
        "requirement_registry_rows": REQUIREMENT_REGISTRY_PATH,
        "source_manifest_sources": SOURCE_MANIFEST_PATH,
        "summary_conflict_rows": SUMMARY_CONFLICTS_PATH,
        "scope_matrix_rows": PRODUCT_SCOPE_PATH,
        "audience_surface_rows": AUDIENCE_SURFACE_PATH,
        "route_family_rows": ROUTE_FAMILY_PATH,
        "request_lineage_stages": REQUEST_LINEAGE_PATH,
        "object_rows": OBJECT_CATALOG_PATH,
        "state_machine_count": STATE_MACHINES_PATH,
        "external_dependency_count": EXTERNAL_DEPENDENCIES_PATH,
    }
    missing = [key for key, path in required.items() if not path.exists()]
    if missing:
        raise SystemExit(
            json.dumps(
                {
                    "prerequisite_gaps": [
                        {
                            "issue_id": f"PREREQUISITE_GAP_{key.upper()}",
                            "missing_path": str(required[key]),
                        }
                        for key in missing
                    ]
                },
                indent=2,
            )
        )

    summary_conflicts = load_json(SUMMARY_CONFLICTS_PATH)
    scope_payload = load_json(PRODUCT_SCOPE_PATH)
    lineage_payload = load_json(REQUEST_LINEAGE_PATH)
    object_payload = load_json(OBJECT_CATALOG_PATH)
    state_payload = load_json(STATE_MACHINES_PATH)
    dependency_payload = load_json(EXTERNAL_DEPENDENCIES_PATH)
    counts = {
        "requirement_registry_rows": count_jsonl(REQUIREMENT_REGISTRY_PATH),
        "source_manifest_sources": len(load_json(SOURCE_MANIFEST_PATH)["sources"]),
        "summary_conflict_rows": len(summary_conflicts["rows"]),
        "scope_matrix_rows": len(scope_payload["rows"]),
        "audience_surface_rows": len(load_csv(AUDIENCE_SURFACE_PATH)),
        "route_family_rows": len(load_csv(ROUTE_FAMILY_PATH)),
        "request_lineage_stages": len(lineage_payload["lineage_stages"]),
        "object_rows": len(object_payload["objects"]),
        "state_machine_count": len(state_payload["machines"]),
        "external_dependency_count": len(dependency_payload["dependencies"]),
    }
    for key, count in counts.items():
        if count <= 0:
            raise SystemExit(f"PREREQUISITE_GAP_{key.upper()}: empty prerequisite payload")
    if len(dependency_payload["dependencies"]) < 18:
        raise SystemExit("PREREQUISITE_GAP_SEQ_008: external dependency inventory looks incomplete.")
    return counts


def external_dependency_ids() -> set[str]:
    return {row["dependency_id"] for row in load_json(EXTERNAL_DEPENDENCIES_PATH)["dependencies"]}


def build_framework_catalog() -> list[FrameworkContextSpec]:
    return [
        FrameworkContextSpec(
            framework_code="FW_DCB0129",
            framework_name="DCB0129 manufacturer clinical risk management",
            governance_class="clinical_safety_standard",
            source_version_context="The corpus treats DCB0129 as the governing manufacturer-side clinical safety frame and explicitly ties it to templates, agile implementation guidance, and incremental evidence updates.",
            source_date_context="Phase 9 notes the DCB standards are under review in the March 2026-era corpus and should therefore stay version-aware rather than timeless.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-1-the-red-flag-gate.md#Rule 2: rules-first safety, not model-first safety",
                "phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-8-the-assistive-layer.md#Phase 8 implementation rules",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
            ),
            notes="The hazard log and safety case must update on material changes; safety is not a final-stage paperwork batch.",
        ),
        FrameworkContextSpec(
            framework_code="FW_DCB0160",
            framework_name="DCB0160 deployment and use clinical risk management",
            governance_class="clinical_safety_standard",
            source_version_context="The corpus positions DCB0160 as the deployment-and-use counterpart to DCB0129, especially once live identity, telephony, assistive, and operational rollout are in scope.",
            source_date_context="Phase 9 notes DCB0160 is under review in the same March 2026-era corpus context and therefore remains a versioned input.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
            ),
            notes="Deployment-side signoff and live safety monitoring stay distinct from manufacturer signoff.",
        ),
        FrameworkContextSpec(
            framework_code="FW_DTAC",
            framework_name="DTAC",
            governance_class="assurance_framework",
            source_version_context="The corpus treats DTAC as spanning clinical safety, data protection, technical security, interoperability, and usability or accessibility rather than a single evidence upload.",
            source_date_context="Phase 9 explicitly says DTAC guidance was refreshed in March 2026 and must be tracked through version metadata and standards watchlists.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-9-the-assurance-ledger.md#Working scope",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
            ),
            notes="The change-control model must route specific deltas into DTAC evidence refresh instead of assuming annual resubmission only.",
        ),
        FrameworkContextSpec(
            framework_code="FW_DSPT",
            framework_name="Data Security and Protection Toolkit",
            governance_class="assurance_framework",
            source_version_context="The corpus ties DSPT to continuous evidence production, incident reporting capability, and operational proof rather than a once-a-year spreadsheet exercise.",
            source_date_context="Phase 9 explicitly references the 2024-25 CAF-aligned DSPT guidance and its stronger response-and-recovery posture.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-9-the-assurance-ledger.md#Working scope",
                "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",
            ),
            notes="Restore, failover, and reportability rehearsals are evidence-bearing DSPT controls in this corpus.",
        ),
        FrameworkContextSpec(
            framework_code="FW_RECORDS_MGMT_CODE",
            framework_name="Records Management Code of Practice",
            governance_class="records_governance_framework",
            source_version_context="The corpus elevates retention, deletion, archive, and legal-hold control into first-class product objects rather than after-the-fact storage policy.",
            source_date_context="Phase 9 states the HTML version is the most up-to-date source and should therefore be carried as source metadata, not flattened into an undated policy label.",
            baseline_relevance="ongoing_bau",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Working scope",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "blueprint-init.md#The same summary discipline now extends to records lifecycle and preservation",
            ),
            notes="Deletion certificates, archive manifests, and legal holds are governed evidence families, not ordinary exports.",
        ),
        FrameworkContextSpec(
            framework_code="FW_WCAG_22_AA",
            framework_name="WCAG 2.2 AA",
            governance_class="accessibility_standard",
            source_version_context="Phase 1 already treats WCAG 2.2 AA and accessible-authentication patterns as architectural input; Phase 7 raises that to NHS App channel gating.",
            source_date_context="The corpus explicitly references WCAG 2.2 and recent audit expectations, including NHS App expression-of-interest wording around recent WCAG 2.1 or 2.2 audits.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-1-the-red-flag-gate.md#Control priorities",
                "phase-7-inside-the-nhs-app.md#Phase 7 implementation rules",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "accessibility-and-content-system-contract.md#Purpose",
            ),
            notes="Accessibility is an engineering and assurance workstream, not optional polish.",
        ),
        FrameworkContextSpec(
            framework_code="FW_NHS_SERVICE_STANDARD",
            framework_name="NHS service standard and content guidance",
            governance_class="service_design_standard",
            source_version_context="The corpus treats the 17-point NHS service standard, simple-health-content guidance, and joined-up channel experience as release-shaping controls.",
            source_date_context="Phase 7 frames the service standard as part of the current NHS App standards pack rather than a later UX tidy-up.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3B. The web experience, not a form dump",
                "phase-1-the-red-flag-gate.md#3F. Submission, receipt, and graceful fallback",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "accessibility-and-content-system-contract.md#Content clarity and calm-task completion",
            ),
            notes="Content QA, route-family semantic coverage, and calm repair grammar are all part of the evidence model.",
        ),
        FrameworkContextSpec(
            framework_code="FW_GDPR",
            framework_name="GDPR",
            governance_class="privacy_framework",
            source_version_context="The corpus binds privacy to identity, contact provenance, telemetry minimization, embedded-channel restrictions, and explicit data-flow evidence rather than generic legal boilerplate.",
            source_date_context="Phase 7 lists GDPR explicitly inside the NHS App standards posture; the workstream model therefore carries it as a source-era requirement rather than an external refresh.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-9-the-assurance-ledger.md#Working scope",
                "blueprint-init.md#10. Identity, consent, security, and policy",
            ),
            notes="DPIA reruns are explicit change-control outputs for identity, embedded, and assistive deltas.",
        ),
        FrameworkContextSpec(
            framework_code="FW_PECR",
            framework_name="PECR",
            governance_class="privacy_framework",
            source_version_context="The corpus places PECR in the same standards bundle as channel onboarding and privacy evidence, especially for patient messaging and notification behavior.",
            source_date_context="Phase 7 cites PECR as part of the current NHS App standards set carried through SCAL and channel approval.",
            baseline_relevance="baseline_required",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "phase-1-the-red-flag-gate.md#3F. Submission, receipt, and graceful fallback",
                "phase-2-identity-and-echoes.md#Rule 2: contact provenance matters",
            ),
            notes="Notification channels, contact-route repair, and consent-provenance changes must route into privacy review rather than sit outside engineering.",
        ),
        FrameworkContextSpec(
            framework_code="FW_NHS_LOGIN_ONBOARDING",
            framework_name="NHS login onboarding and assurance",
            governance_class="partner_onboarding_framework",
            source_version_context="The corpus treats NHS login onboarding as including redirect inventory, scope decisions, clinical-safety evidence, and local-session ownership rather than simple credential setup.",
            source_date_context="Phase 2 references current NHS login partner guidance and mock-auth flows; the corpus does not treat this as timeless.",
            baseline_relevance="partner_specific",
            source_refs=(
                "phase-2-identity-and-echoes.md#Rule 1: never collapse identity into a boolean",
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "blueprint-init.md#10. Identity, consent, security, and policy",
            ),
            notes="NHS login proves identity, not clinical authorization; local session and subject binding remain partner responsibilities.",
        ),
        FrameworkContextSpec(
            framework_code="FW_IM1_PAIRING_AND_RFC",
            framework_name="IM1 pairing and material-change RFC routing",
            governance_class="partner_onboarding_framework",
            source_version_context="The corpus treats IM1 pairing as a whole-product documentation review lane and states that material AI enhancement routes through formal RFC plus updated SCAL and related documents.",
            source_date_context="Phase 8 describes current IM1 guidance for AI-containing products and explicitly ties it to material-change routing rather than initial timeless pairing only.",
            baseline_relevance="partner_specific",
            source_refs=(
                "phase-2-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",
                "phase-8-the-assistive-layer.md#Working scope",
                "blueprint-init.md#9. AI and automation",
            ),
            notes="IM1 is not the critical path for Phase 2 baseline, but it becomes a partner-specific evidence lane when capabilities or pairing posture change.",
        ),
        FrameworkContextSpec(
            framework_code="FW_NHS_APP_WEB_INTEGRATION",
            framework_name="NHS App web integration onboarding",
            governance_class="channel_onboarding_framework",
            source_version_context="The corpus treats the NHS App channel as one portal with embedded shell, manifest, jump-off, and demo/onboarding obligations rather than a separate product.",
            source_date_context="Phase 7 preserves the current onboarding sequence of expression of interest, product assessment, Sandpit, AOS, limited release, and full release.",
            baseline_relevance="deferred_phase7",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#Working scope",
                "phase-7-inside-the-nhs-app.md#Overall Phase 7 algorithm",
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
            ),
            notes="Deferred from the current programme baseline unless Phase 7 is explicitly pulled forward.",
        ),
        FrameworkContextSpec(
            framework_code="FW_SCAL",
            framework_name="SCAL submission and evidence bundle",
            governance_class="channel_onboarding_framework",
            source_version_context="The corpus treats SCAL as an evidence bundle tied to exact manifest, telemetry, safety, accessibility, and release tuples rather than a detached upload.",
            source_date_context="Phase 7 routes SCAL after Sandpit, AOS, demo, and incident rehearsal in the current NHS App process.",
            baseline_relevance="deferred_phase7",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
            ),
            notes="SCAL also reappears as a material-change artifact for assistive or partner-sensitive product evolution.",
        ),
        FrameworkContextSpec(
            framework_code="FW_AI_AMBIENT_GUIDANCE",
            framework_name="NHS AI-enabled ambient scribing and documentation guidance",
            governance_class="assistive_governance_framework",
            source_version_context="The corpus uses current NHS guidance on ambient scribing and documentation support to require human oversight, training, audit, bias monitoring, and bounded intended use.",
            source_date_context="Phase 8 explicitly cites current NHS guidance as the closest operating basis for assistive capabilities and uses it as a live change-control reference.",
            baseline_relevance="assistive_optional",
            source_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-8-the-assistive-layer.md#Phase 8 implementation rules",
                "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate",
            ),
            notes="Assistive outputs remain assistive, bounded, auditable, and never autonomously final.",
        ),
        FrameworkContextSpec(
            framework_code="FW_MHRA_MEDICAL_DEVICE_BOUNDARY",
            framework_name="Medical-device boundary and intended-use reassessment",
            governance_class="assistive_governance_framework",
            source_version_context="The corpus distinguishes verified transcription from higher-function generative processing and uses that split to drive intended-use freeze and medical-purpose reassessment.",
            source_date_context="Phase 8 frames this through current NHS guidance and MHRA-regulated device boundary language rather than fixed timeless classification.",
            baseline_relevance="assistive_optional",
            source_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
            ),
            notes="Visible capability expansion, intended-use wording changes, and clinical-decision-support drift must route here.",
        ),
        FrameworkContextSpec(
            framework_code="FW_RUNTIME_PARITY_AND_WATCHLIST",
            framework_name="Release/runtime/publication parity and standards watchlist governance",
            governance_class="internal_governance_basis",
            source_version_context="The corpus treats runtime publication bundles, parity records, continuity evidence, release watch tuples, and standards dependency watchlists as first-class regulated-delivery controls.",
            source_date_context="Phase 9 explicitly notes March 2026 DTAC refresh and the 2 March 2026 decommissioning of legacy developer and FHIR documentation endpoints, so standards and dependency hygiene remain time-sensitive.",
            baseline_relevance="baseline_required",
            source_refs=(
                "platform-runtime-and-release-blueprint.md#Purpose",
                "platform-runtime-and-release-blueprint.md#Release pipeline and watch tuple law",
                "platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
                "phase-9-the-assurance-ledger.md#9H. Tenant configuration, standards watch, and long-term governance",
                "phase-9-the-assurance-ledger.md#Working scope",
            ),
            notes="Release/publication/runtime parity is part of the assured product, not separate DevOps housekeeping.",
        ),
    ]


def build_workstreams() -> list[WorkstreamSpec]:
    return [
        WorkstreamSpec(
            workstream_id="WS_CLINICAL_MANUFACTURER",
            workstream_name="Manufacturer clinical safety workstream",
            workstream_family="manufacturer_clinical_safety",
            framework_or_governance_basis=("FW_DCB0129", "FW_DTAC"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",
                "phase-2-identity-and-echoes.md#2G. Convergence into one request model and one workflow",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
            ),
            standards_version_context=(
                "Carry DCB0129 as the governing manufacturer-side safety basis with source-era review status preserved.",
                "Treat safety evidence as incremental per rule, identity, telephony, booking, pharmacy, and assistive deltas.",
            ),
            why_it_exists="Vecells changes patient safety posture whenever rule packs, identity binding, telephony evidence, booking confirmation, pharmacy outcomes, or assistive workflow effects change. The corpus requires those deltas to update the hazard log and safety case incrementally.",
            affected_phases=(
                "phase_1_red_flag_gate",
                "phase_2_identity_and_echoes",
                "phase_3_human_checkpoint",
                "phase_4_booking_engine",
                "phase_5_network_horizon",
                "phase_6_pharmacy_loop",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_SAFETY_RULE_PACK",
                "CHG_IDENTITY_BINDING_OR_SESSION",
                "CHG_TELEPHONY_CAPTURE_OR_CONTINUATION",
                "CHG_BOOKING_CONFIRMATION_OR_WAITLIST",
                "CHG_HUB_COORDINATION_OR_ACK",
                "CHG_PHARMACY_DISPATCH_OR_OUTCOME",
                "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
                "CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT",
            ),
            required_artifacts=(
                "ClinicalRiskManagementPlan baseline and delta log",
                "HazardLog delta packet",
                "SafetyCase delta packet",
                "MaterialDeltaAssessment-linked re-safety evidence",
                "ReleaseCandidate safety gate summary",
            ),
            required_reviews_or_signoffs=(
                "Independent manufacturer Clinical Safety Officer signoff",
                "Clinical safety engineering review",
                "Release approval evidence bundle linkage",
            ),
            required_test_or_rehearsal_classes=(
                "same_facts_same_safety_outcome regression",
                "urgent diversion decision-versus-settlement proof",
                "wrong-patient freeze and release suites",
                "assistive no-autonomous-write safety suites",
            ),
            blocking_release_conditions=(
                "Missing hazard-log or safety-case delta for a material clinical change",
                "Unresolved safety preemption or urgent-diversion drift",
                "Safety signoff attached to the wrong release candidate or stale evidence tuple",
            ),
            cadence="Creation-time baseline, then per material safety-affecting change and before any release candidate that changes clinical behavior.",
            primary_owner_role="ROLE_MANUFACTURER_CSO",
            secondary_owner_roles=("ROLE_SERVICE_OWNER", "ROLE_RELEASE_MANAGER", "ROLE_INTEROPERABILITY_LEAD"),
            dependency_refs=("WS_RELEASE_RUNTIME_PUBLICATION_PARITY", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            notes="This closes the gap where safety evidence was treated as final-stage paperwork instead of phase-triggered engineering output.",
        ),
        WorkstreamSpec(
            workstream_id="WS_CLINICAL_DEPLOYMENT_USE",
            workstream_name="Deployment and use clinical risk workstream",
            workstream_family="deployment_use_clinical_risk",
            framework_or_governance_basis=("FW_DCB0160", "FW_DSPT"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
                "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",
            ),
            standards_version_context=(
                "Carry DCB0160 as deployment/use safety authority rather than folding it into DCB0129.",
                "Preserve CAF-aligned DSPT recovery expectations in the same operating model.",
            ),
            why_it_exists="Live rollout, local session ownership, telephony capture, embedded-channel behavior, and assistive visibility all change the deployment-side risk picture. The corpus requires a separate deployment/use safety burden rather than only manufacturer documentation.",
            affected_phases=(
                "phase_2_identity_and_echoes",
                "phase_7_inside_the_nhs_app",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_IDENTITY_BINDING_OR_SESSION",
                "CHG_TELEPHONY_CAPTURE_OR_CONTINUATION",
                "CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER",
                "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS",
                "CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE",
            ),
            required_artifacts=(
                "DeploymentSafetyCase annex",
                "Go-live clinical risk assessment delta",
                "Operational safety monitoring pack",
                "Rollback and recovery clinical impact review",
            ),
            required_reviews_or_signoffs=(
                "Deployment/use Clinical Safety Lead signoff",
                "Release Manager readiness signoff",
                "Service Owner deployment approval",
            ),
            required_test_or_rehearsal_classes=(
                "rollback rehearsal with safety observations",
                "canary guardrail review",
                "incident and near-miss drill linkage to safety follow-up",
            ),
            blocking_release_conditions=(
                "Live rollout changes without deployment-side safety review",
                "Material incident learnings not reflected in deployment safety posture",
                "Rollback or recovery posture not clinically reviewed for changed flows",
            ),
            cadence="Before new live rollout classes, before channel expansion, and after any incident or deployment posture change that alters clinical risk.",
            primary_owner_role="ROLE_DEPLOYMENT_CSO",
            secondary_owner_roles=("ROLE_SERVICE_OWNER", "ROLE_INCIDENT_MANAGER", "ROLE_RELEASE_MANAGER"),
            dependency_refs=("WS_INCIDENT_NEAR_MISS_REPORTABILITY", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            notes="This keeps deployment/use safety independent from manufacturer signoff while still bound to the same release tuple.",
        ),
        WorkstreamSpec(
            workstream_id="WS_DATA_PROTECTION_PRIVACY",
            workstream_name="Data protection and privacy workstream",
            workstream_family="data_protection_privacy",
            framework_or_governance_basis=("FW_GDPR", "FW_PECR", "FW_DTAC"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#Rule 2: contact provenance matters",
                "phase-7-inside-the-nhs-app.md#NHS App channel priorities",
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-9-the-assurance-ledger.md#Working scope",
                "blueprint-init.md#10. Identity, consent, security, and policy",
            ),
            standards_version_context=(
                "Preserve GDPR and PECR as named channel and privacy obligations in the corpus instead of collapsing them into generic information governance.",
                "DPIA reruns remain explicit triggered outputs for identity, embedded, assistive, and telemetry changes.",
            ),
            why_it_exists="Identity evidence, contact provenance, notification delivery, embedded-channel handling, telemetry, and assistive subprocessors all change personal-data exposure. The corpus requires explicit privacy routing tied to engineering artifacts and release proof.",
            affected_phases=(
                "phase_1_red_flag_gate",
                "phase_2_identity_and_echoes",
                "phase_7_inside_the_nhs_app",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_IDENTITY_BINDING_OR_SESSION",
                "CHG_NOTIFICATION_COPY_OR_CHANNEL_POLICY",
                "CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE",
                "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
                "CHG_RETENTION_POLICY_OR_ARTIFACT_CLASS",
                "CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
                "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
            ),
            required_artifacts=(
                "DPIA baseline and delta packet",
                "Data-flow and disclosure map",
                "Privacy and consent decision log",
                "Subprocessor assurance snapshot",
                "Telemetry disclosure review",
            ),
            required_reviews_or_signoffs=(
                "Data Protection Officer signoff",
                "Caldicott or privacy governance review",
                "Release bundle privacy attestation",
            ),
            required_test_or_rehearsal_classes=(
                "PHI-safe telemetry and logging tests",
                "wrong-patient hold and placeholder suppression tests",
                "embedded artifact and outbound URL restriction tests",
            ),
            blocking_release_conditions=(
                "No current DPIA for a material identity, embedded, or assistive change",
                "Telemetry or message delivery path leaks raw identifiers or PHI-bearing URLs",
                "Patient-public, authenticated, and grant-scoped disclosure postures are not separated",
            ),
            cadence="Creation-time baseline, then per disclosure-changing delta and before any release that changes audience, channel, telemetry, or subprocessor posture.",
            primary_owner_role="ROLE_DPO",
            secondary_owner_roles=("ROLE_SECURITY_LEAD", "ROLE_SERVICE_OWNER", "ROLE_PARTNER_ONBOARDING_LEAD"),
            dependency_refs=(
                "dep_nhs_login_rail",
                "dep_sms_notification_provider",
                "dep_email_notification_provider",
                "dep_nhs_app_embedded_channel_ecosystem",
                "dep_assistive_model_vendor_family",
            ),
            notes="This closes the gap where partner onboarding evidence and privacy proof sat outside engineering artifacts.",
        ),
        WorkstreamSpec(
            workstream_id="WS_TECHNICAL_SECURITY_ASSURANCE",
            workstream_name="Technical security and assurance workstream",
            workstream_family="technical_security_assurance",
            framework_or_governance_basis=("FW_DTAC", "FW_DSPT"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#High-priority trust gaps in this layer",
                "phase-7-inside-the-nhs-app.md#NHS App channel priorities",
                "phase-9-the-assurance-ledger.md#Working scope",
                "platform-runtime-and-release-blueprint.md#Runtime topology contract",
            ),
            standards_version_context=(
                "Preserve DTAC and DSPT technical-security expectations as live framework inputs with refreshed guidance context.",
                "Treat trust zones, service identities, and PHI-safe telemetry as assurance evidence rather than infra folklore.",
            ),
            why_it_exists="Identity/session controls, channel detection, secrets, webhook ingest, partner dependencies, and runtime trust boundaries all change the technical security burden. The corpus expects those deltas to surface as evidence and release blockers.",
            affected_phases=(
                "phase_0_foundation",
                "phase_2_identity_and_echoes",
                "phase_7_inside_the_nhs_app",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_IDENTITY_BINDING_OR_SESSION",
                "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS",
                "CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER",
                "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
                "CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
            ),
            required_artifacts=(
                "Threat model delta",
                "Secrets and key-rotation posture proof",
                "Trust-zone and gateway surface manifest",
                "Vendor assurance freshness record",
                "Security test and incident readiness bundle",
            ),
            required_reviews_or_signoffs=(
                "Security Lead signoff",
                "Release Manager security gate confirmation",
                "Independent evidence freshness review for partner/vendor changes",
            ),
            required_test_or_rehearsal_classes=(
                "auth replay and session expiry suites",
                "webhook and callback hardening suites",
                "logging redaction tests",
                "recovery activation runbook rehearsal",
            ),
            blocking_release_conditions=(
                "Trust-zone, gateway, or secrets changes without updated technical-security evidence",
                "Supplier assurance freshness drift unresolved",
                "Required assurance slices degraded or quarantined without bounded recovery posture",
            ),
            cadence="Before release-candidate approval for security-affecting changes and continuously for vendor freshness and active trust slices.",
            primary_owner_role="ROLE_SECURITY_LEAD",
            secondary_owner_roles=("ROLE_RELEASE_MANAGER", "ROLE_DPO", "ROLE_SERVICE_OWNER"),
            dependency_refs=(
                "dep_nhs_login_rail",
                "dep_cross_org_secure_messaging_mesh",
                "dep_telephony_ivr_recording_provider",
                "dep_assistive_model_vendor_family",
            ),
            notes="Technical security stays tied to the same release tuple and watch posture as clinical and privacy evidence.",
        ),
        WorkstreamSpec(
            workstream_id="WS_INTEROPERABILITY_EVIDENCE",
            workstream_name="Interoperability evidence workstream",
            workstream_family="interoperability_evidence",
            framework_or_governance_basis=("FW_DTAC", "FW_NHS_LOGIN_ONBOARDING", "FW_IM1_PAIRING_AND_RFC"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",
                "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack",
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-9-the-assurance-ledger.md#9H. Tenant configuration, standards watch, and long-term governance",
            ),
            standards_version_context=(
                "The corpus treats interoperability as proof-bearing across NHS login, IM1, booking, hub, messaging, pharmacy, and future partner channels.",
                "Source-era onboarding packs and RFC routes remain attached to specific partner and release tuples.",
            ),
            why_it_exists="Vecells must prove adapter contracts, authoritative proof-vs-transport semantics, supplier capability evidence, and partner onboarding readiness across external dependencies. The corpus does not allow partner evidence to sit outside engineering.",
            affected_phases=(
                "phase_2_identity_and_echoes",
                "phase_4_booking_engine",
                "phase_5_network_horizon",
                "phase_6_pharmacy_loop",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS",
                "CHG_BOOKING_CONFIRMATION_OR_WAITLIST",
                "CHG_HUB_COORDINATION_OR_ACK",
                "CHG_PHARMACY_DISPATCH_OR_OUTCOME",
                "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
            ),
            required_artifacts=(
                "AdapterContractProfile evidence set",
                "Supplier capability or sandbox proof",
                "Interop conformance matrix",
                "Partner onboarding dossier",
                "Proof-versus-transport reconciliation pack",
            ),
            required_reviews_or_signoffs=(
                "Interoperability Lead signoff",
                "Partner Onboarding Lead review where external approval is needed",
                "Release tuple compatibility review",
            ),
            required_test_or_rehearsal_classes=(
                "simulator-backed adapter contract tests",
                "proof-versus-transport regression tests",
                "partner config parity checks",
            ),
            blocking_release_conditions=(
                "Supplier or partner proof chain is weaker than the declared authoritative evidence model",
                "Adapter contract changed without updated conformance packet",
                "Partner onboarding evidence required by the corpus is missing or stale",
            ),
            cadence="At integration creation-time, on material adapter or supplier changes, and before releases that widen external surface behavior.",
            primary_owner_role="ROLE_INTEROPERABILITY_LEAD",
            secondary_owner_roles=("ROLE_PARTNER_ONBOARDING_LEAD", "ROLE_RELEASE_MANAGER", "ROLE_MANUFACTURER_CSO"),
            dependency_refs=(
                "dep_nhs_login_rail",
                "dep_im1_pairing_programme",
                "dep_local_booking_supplier_adapters",
                "dep_cross_org_secure_messaging_mesh",
                "dep_pharmacy_referral_transport",
            ),
            notes="This keeps proof-vs-transport discipline explicit across booking, messaging, hub, and pharmacy rails.",
        ),
        WorkstreamSpec(
            workstream_id="WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD",
            workstream_name="Accessibility, content, and service-standard workstream",
            workstream_family="accessibility_content_service_standard",
            framework_or_governance_basis=("FW_WCAG_22_AA", "FW_NHS_SERVICE_STANDARD"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-1-the-red-flag-gate.md#3B. The web experience, not a form dump",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "accessibility-and-content-system-contract.md#Route-family semantic coverage",
                "blueprint-init.md#10. Identity, consent, security, and policy",
            ),
            standards_version_context=(
                "Preserve WCAG 2.2 AA as explicit source-era guidance, especially for target size and accessible authentication.",
                "Keep NHS service-standard and content obligations tied to real route and shell coverage rather than generic intent.",
            ),
            why_it_exists="The corpus repeatedly states that accessibility, content clarity, and service-standard compliance are architectural and assurance-bearing. Mobile embedded mode intensifies this, but the baseline web product already depends on it.",
            affected_phases=(
                "phase_1_red_flag_gate",
                "phase_2_identity_and_echoes",
                "phase_7_inside_the_nhs_app",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE",
                "CHG_NOTIFICATION_COPY_OR_CHANNEL_POLICY",
                "CHG_NHS_APP_MANIFEST_OR_CHANNEL_EXPOSURE",
                "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
            ),
            required_artifacts=(
                "Accessibility audit pack",
                "AccessibilitySemanticCoverageProfile set",
                "Content QA and health-literacy review",
                "Service-standard evidence pack",
                "Visualization parity verification evidence",
            ),
            required_reviews_or_signoffs=(
                "Accessibility Lead signoff",
                "Content Design Lead signoff",
                "Service Owner acceptance of route-level evidence",
            ),
            required_test_or_rehearsal_classes=(
                "keyboard-only end-to-end suites",
                "screen reader smoke tests",
                "reduced-motion equivalence checks",
                "chart and table parity tests",
                "embedded mobile recovery-path checks",
            ),
            blocking_release_conditions=(
                "Route or shell change without updated accessibility coverage and content review",
                "Visual-dominant surface lacks parity-safe fallback evidence",
                "Embedded or public recovery copy fails same-shell accessible repair posture",
            ),
            cadence="Per route-family or shell change, before release, and again for embedded-channel onboarding when Phase 7 becomes active.",
            primary_owner_role="ROLE_ACCESSIBILITY_CONTENT_LEAD",
            secondary_owner_roles=("ROLE_SERVICE_OWNER", "ROLE_RELEASE_MANAGER"),
            dependency_refs=("WS_RELEASE_RUNTIME_PUBLICATION_PARITY",),
            notes="This closes the gap where accessibility or content could be treated as cosmetic or post-build work.",
        ),
        WorkstreamSpec(
            workstream_id="WS_RECORDS_RETENTION_GOVERNANCE",
            workstream_name="Records management and retention governance workstream",
            workstream_family="records_retention_governance",
            framework_or_governance_basis=("FW_RECORDS_MGMT_CODE", "FW_RUNTIME_PARITY_AND_WATCHLIST"),
            baseline_scope="ongoing_bau",
            source_file_refs=(
                "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "blueprint-init.md#The same summary discipline now extends to records lifecycle and preservation",
            ),
            standards_version_context=(
                "Retain the Records Management Code as the active retention source, including the HTML-version-is-current note from the corpus.",
                "Treat retention and deletion as governed lifecycle evidence, not storage leftovers.",
            ),
            why_it_exists="Evidence artifacts, recordings, transcripts, deletion certificates, archive manifests, and legal holds all need governed retention classes and auditable disposition behavior. The corpus says this is part of system design.",
            affected_phases=(
                "phase_2_identity_and_echoes",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_RETENTION_POLICY_OR_ARTIFACT_CLASS",
                "CHG_TELEPHONY_CAPTURE_OR_CONTINUATION",
                "CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
                "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
            ),
            required_artifacts=(
                "Retention schedule and artifact class map",
                "RetentionDecision and DispositionEligibility evidence",
                "DeletionCertificate and ArchiveManifest proofs",
                "LegalHold and preservation-chain evidence",
            ),
            required_reviews_or_signoffs=(
                "Records Governance Lead signoff",
                "Data Protection Officer review for disposition changes",
                "Governance approval for new artifact classes",
            ),
            required_test_or_rehearsal_classes=(
                "retention dry-run tests",
                "delete-versus-hold conflict tests",
                "archive and export policy verification",
            ),
            blocking_release_conditions=(
                "New durable artifact without retention class and disposition path",
                "Delete or archive behavior not bound to the current evidence graph",
                "Legal-hold or preservation flow not auditable for affected artifact families",
            ),
            cadence="Creation-time for new artifact families, continuously for lifecycle changes, and in periodic governance packs.",
            primary_owner_role="ROLE_RECORDS_GOVERNANCE_LEAD",
            secondary_owner_roles=("ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            dependency_refs=("WS_DATA_PROTECTION_PRIVACY", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            notes="This closes the gap where retention and deletion could be treated as operational leftovers.",
        ),
        WorkstreamSpec(
            workstream_id="WS_INCIDENT_NEAR_MISS_REPORTABILITY",
            workstream_name="Incident, near-miss, and reportability workstream",
            workstream_family="incident_near_miss_reportability",
            framework_or_governance_basis=("FW_DSPT", "FW_DCB0160"),
            baseline_scope="ongoing_bau",
            source_file_refs=(
                "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "platform-admin-and-config-blueprint.md#Deep links into /ops/incidents",
            ),
            standards_version_context=(
                "The corpus uses CAF-aligned DSPT reporting and just-culture language as a live operating model for incidents and near misses.",
                "Incident and reportability proof feeds assurance packs and deployment/use safety; it is not a side-channel.",
            ),
            why_it_exists="The programme needs one governed workflow for incidents, reportability assessment, near misses, CAPA, and drills. The corpus explicitly rejects passive incident handling and hidden operational learning.",
            affected_phases=("phase_9_assurance_ledger",),
            triggering_changes=(
                "CHG_OPERATIONAL_INCIDENT_OR_NEAR_MISS_LEARNING",
                "CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER",
                "CHG_IDENTITY_BINDING_OR_SESSION",
                "CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE",
            ),
            required_artifacts=(
                "SecurityIncident or NearMissReport record",
                "ReportabilityAssessment",
                "Containment timeline",
                "PostIncidentReview and CAPA bundle",
                "Training drill record",
            ),
            required_reviews_or_signoffs=(
                "Incident Manager review",
                "Service Owner follow-up approval",
                "Clinical or privacy review where the incident affects those domains",
            ),
            required_test_or_rehearsal_classes=(
                "incident drill",
                "reportability drill",
                "evidence preservation tests",
            ),
            blocking_release_conditions=(
                "Active severe incident or unassessed reportable event on the same release or domain slice",
                "Incident learnings not routed into safety, privacy, or resilience follow-up when required",
                "No evidence-preservation path for the incident class under review",
            ),
            cadence="Continuous operational use with periodic drill cadence and release blocking when unresolved incidents materially affect the changed area.",
            primary_owner_role="ROLE_INCIDENT_MANAGER",
            secondary_owner_roles=("ROLE_SERVICE_OWNER", "ROLE_DPO", "ROLE_DEPLOYMENT_CSO"),
            dependency_refs=("WS_OPERATIONAL_RESILIENCE_RESTORE", "WS_CLINICAL_DEPLOYMENT_USE"),
            notes="Near miss is a first-class governed object in this operating model, not informal team memory.",
        ),
        WorkstreamSpec(
            workstream_id="WS_PARTNER_ONBOARDING_EVIDENCE",
            workstream_name="NHS login, IM1, and partner onboarding evidence workstream",
            workstream_family="partner_onboarding_evidence",
            framework_or_governance_basis=("FW_NHS_LOGIN_ONBOARDING", "FW_IM1_PAIRING_AND_RFC"),
            baseline_scope="partner_specific",
            source_file_refs=(
                "phase-2-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-8-the-assistive-layer.md#Working scope",
                "blueprint-init.md#9. AI and automation",
            ),
            standards_version_context=(
                "Preserve partner-onboarding obligations as source-era process work tied to exact redirect, scope, and product documentation sets.",
                "Keep IM1 AI-change routing as material-change evidence, not as a generic future note.",
            ),
            why_it_exists="The corpus says partner onboarding evidence is related to engineering artifacts, runtime proof, and safety documentation. Redirect URIs, scopes, pairing packs, and RFC bundles are therefore explicit workstream outputs.",
            affected_phases=(
                "phase_2_identity_and_echoes",
                "phase_8_assistive_layer",
                "external_onboarding_sequence",
            ),
            triggering_changes=(
                "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS",
                "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
                "CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT",
            ),
            required_artifacts=(
                "NHS login partner onboarding pack",
                "Redirect and scope inventory",
                "IM1 pairing dossier",
                "Material-change RFC bundle",
                "Environment configuration parity evidence",
            ),
            required_reviews_or_signoffs=(
                "Partner Onboarding Lead signoff",
                "Security Lead review for redirect and secret posture",
                "Clinical Safety Officer review where the partner pack names safety evidence",
            ),
            required_test_or_rehearsal_classes=(
                "sandbox or mock-auth walkthrough",
                "redirect parity validation",
                "onboarding evidence completeness review",
            ),
            blocking_release_conditions=(
                "Partner-facing configuration changes without current onboarding pack or RFC as applicable",
                "Live partner launch attempted on stale scope, redirect, or evidence inventory",
                "Product documentation diverges from the exact release candidate or channel tuple",
            ),
            cadence="Whenever partner configuration, product documentation burden, or material change routing changes; not every release, but always when the corpus says the partner pack must move.",
            primary_owner_role="ROLE_PARTNER_ONBOARDING_LEAD",
            secondary_owner_roles=("ROLE_SECURITY_LEAD", "ROLE_MANUFACTURER_CSO", "ROLE_RELEASE_MANAGER"),
            dependency_refs=("dep_nhs_login_rail", "dep_im1_pairing_programme"),
            notes="This closes the gap where partner onboarding evidence was treated as outside engineering.",
        ),
        WorkstreamSpec(
            workstream_id="WS_NHS_APP_SCAL_CHANNEL",
            workstream_name="Deferred NHS App SCAL and channel onboarding workstream",
            workstream_family="nhs_app_scal_channel",
            framework_or_governance_basis=("FW_NHS_APP_WEB_INTEGRATION", "FW_SCAL", "FW_WCAG_22_AA", "FW_NHS_SERVICE_STANDARD"),
            baseline_scope="deferred_phase7",
            source_file_refs=(
                "phase-7-inside-the-nhs-app.md#Working scope",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
                "phase-cards.md",
            ),
            standards_version_context=(
                "Preserve the current NHS App sequence of manifest, demo, Sandpit, AOS, SCAL, limited release, and full release as deferred channel work.",
                "Do not relabel deferred Phase 7 obligations as baseline blockers unless that phase is explicitly opened.",
            ),
            why_it_exists="The channel is real and its obligations are explicit in the corpus, but the current programme baseline defers this phase. The operating model therefore keeps the workstream visible, structured, and non-baseline until Phase 7 activates.",
            affected_phases=("phase_7_inside_the_nhs_app",),
            triggering_changes=(
                "CHG_NHS_APP_MANIFEST_OR_CHANNEL_EXPOSURE",
                "CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE",
                "CHG_NOTIFICATION_COPY_OR_CHANNEL_POLICY",
            ),
            required_artifacts=(
                "NHSAppIntegrationManifest",
                "ManifestPromotionBundle",
                "SCALBundle",
                "Sandpit and AOS sign-off packs",
                "Embedded accessibility and incident rehearsal evidence",
            ),
            required_reviews_or_signoffs=(
                "NHS App Integration Lead signoff",
                "Accessibility and content signoff",
                "Clinical safety and privacy signoff before SCAL submission",
            ),
            required_test_or_rehearsal_classes=(
                "Sandpit checklist",
                "AOS checklist",
                "embedded webview recovery suites",
                "incident rehearsal",
            ),
            blocking_release_conditions=(
                "Only when Phase 7 is active: no embedded release without current manifest parity, accessibility evidence, rehearsal proof, and SCAL bundle",
                "Embedded route exposure or cohort widening drift from the approved release tuple",
            ),
            cadence="Deferred until Phase 7, then creation-time onboarding plus pre-release and channel-widening evidence cycles.",
            primary_owner_role="ROLE_PARTNER_ONBOARDING_LEAD",
            secondary_owner_roles=("ROLE_ACCESSIBILITY_CONTENT_LEAD", "ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            dependency_refs=("dep_nhs_app_embedded_channel_ecosystem",),
            notes="This row exists to keep deferred obligations explicit without turning them into baseline blockers.",
        ),
        WorkstreamSpec(
            workstream_id="WS_ASSISTIVE_AI_GOVERNANCE",
            workstream_name="Assistive and AI governance plus change-control workstream",
            workstream_family="assistive_ai_governance",
            framework_or_governance_basis=(
                "FW_AI_AMBIENT_GUIDANCE",
                "FW_DCB0129",
                "FW_DCB0160",
                "FW_DTAC",
                "FW_IM1_PAIRING_AND_RFC",
                "FW_MHRA_MEDICAL_DEVICE_BOUNDARY",
                "FW_GDPR",
            ),
            baseline_scope="assistive_optional",
            source_file_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
                "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate",
            ),
            standards_version_context=(
                "Preserve source-era guidance that differentiates transcription from higher-function generative processing and ties material AI changes into DTAC, DCB, DPIA, SCAL, and RFC routing.",
                "Assistive governance is conditional scope, but once active it has full release-blocking and signoff burden.",
            ),
            why_it_exists="The corpus rejects the idea that assistive regulation is only model QA. Intended-use wording, medical-purpose boundary, visible workflow effect, supplier freshness, rollout slices, and rollback evidence all belong to one governed workstream.",
            affected_phases=("phase_8_assistive_layer", "phase_9_assurance_ledger"),
            triggering_changes=(
                "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
                "CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT",
                "CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
                "CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE",
                "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
            ),
            required_artifacts=(
                "IntendedUseProfile and capability manifest set",
                "MedicalDeviceAssessment record",
                "AssistiveReleaseCandidate and ChangeImpactAssessment",
                "RFCBundle and SCAL delta where required",
                "RollbackReadinessBundle and supplier assurance snapshot",
            ),
            required_reviews_or_signoffs=(
                "AI Governance Lead signoff",
                "Independent manufacturer Clinical Safety Officer signoff",
                "Data Protection Officer signoff",
                "Release Manager approval after independent approvals complete",
            ),
            required_test_or_rehearsal_classes=(
                "shadow-versus-human comparison suites",
                "drift and fairness alert validation",
                "no-autonomous-write proof",
                "freeze disposition and rollback rehearsal",
            ),
            blocking_release_conditions=(
                "Visible or widened assistive capability without frozen intended use and current regulatory routing assessment",
                "Supplier assurance freshness drift unresolved",
                "Required RFC, SCAL delta, DTAC delta, DPIA rerun, or safety-case delta not completed for the change class",
            ),
            cadence="Optional until assistive rollout starts; then at creation-time, every material change, every visible rollout step, and continuously for supplier and trust freshness.",
            primary_owner_role="ROLE_AI_GOVERNANCE_LEAD",
            secondary_owner_roles=("ROLE_MANUFACTURER_CSO", "ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            dependency_refs=("dep_assistive_model_vendor_family", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            notes="This closes the gap where intended-use change, medical-device boundary, and supplier assurance freshness could drift apart.",
        ),
        WorkstreamSpec(
            workstream_id="WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            workstream_name="Release, runtime, publication parity, and standards watchlist workstream",
            workstream_family="release_runtime_publication_parity",
            framework_or_governance_basis=("FW_RUNTIME_PARITY_AND_WATCHLIST", "FW_DTAC"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "platform-runtime-and-release-blueprint.md#Purpose",
                "platform-runtime-and-release-blueprint.md#Release pipeline and watch tuple law",
                "platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
                "phase-9-the-assurance-ledger.md#9H. Tenant configuration, standards watch, and long-term governance",
                "forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight",
            ),
            standards_version_context=(
                "Preserve refreshed standards metadata and legacy-doc decommissioning context as inputs to the watchlist, not background noise.",
                "Carry runtime publication parity, continuity evidence, and release watch tuples as first-class assurance artifacts.",
            ),
            why_it_exists="The corpus says route contracts, runtime publication bundles, parity records, trust slices, continuity evidence, and standards watchlists are all release controls. Governance, runtime, and operations must read the same tuple.",
            affected_phases=(
                "phase_0_foundation",
                "phase_7_inside_the_nhs_app",
                "phase_8_assistive_layer",
                "phase_9_assurance_ledger",
            ),
            triggering_changes=(
                "CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER",
                "CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE",
                "CHG_NHS_APP_MANIFEST_OR_CHANNEL_EXPOSURE",
                "CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE",
                "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
            ),
            required_artifacts=(
                "ReleaseApprovalFreeze",
                "RuntimePublicationBundle",
                "ReleasePublicationParityRecord",
                "ReleaseWatchTuple and WaveGuardrailSnapshot",
                "StandardsDependencyWatchlist and exceptions register",
                "Continuity evidence bundle for affected routes",
            ),
            required_reviews_or_signoffs=(
                "Release Manager signoff",
                "Governance approval bundle review",
                "Independent domain approvers as routed by the changed surface",
            ),
            required_test_or_rehearsal_classes=(
                "publication parity tests",
                "route-contract and runtime-binding verification",
                "stale-watchlist and exception-expiry checks",
                "continuity-evidence convergence checks",
            ),
            blocking_release_conditions=(
                "Approved release tuple and published runtime tuple do not match",
                "Standards blockers or expired exceptions remain open",
                "Affected routes lack current continuity or recovery disposition evidence",
            ),
            cadence="Every release candidate and continuously while standards or dependency posture drifts.",
            primary_owner_role="ROLE_RELEASE_MANAGER",
            secondary_owner_roles=("ROLE_SERVICE_OWNER", "ROLE_SECURITY_LEAD", "ROLE_ACCESSIBILITY_CONTENT_LEAD"),
            dependency_refs=("WS_OPERATIONAL_RESILIENCE_RESTORE", "WS_CLINICAL_MANUFACTURER"),
            notes="This closes the gap where release/publication/runtime parity looked like DevOps housekeeping instead of regulated delivery proof.",
        ),
        WorkstreamSpec(
            workstream_id="WS_OPERATIONAL_RESILIENCE_RESTORE",
            workstream_name="Operational resilience, restore, and recovery rehearsal workstream",
            workstream_family="operational_resilience_restore",
            framework_or_governance_basis=("FW_DSPT", "FW_RUNTIME_PARITY_AND_WATCHLIST"),
            baseline_scope="baseline_required",
            source_file_refs=(
                "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "platform-runtime-and-release-blueprint.md#Operational readiness and resilience",
            ),
            standards_version_context=(
                "Preserve the CAF-aligned DSPT response-and-recovery emphasis and the corpus rule that restore proof matters more than backup configuration alone.",
                "Recovery order of dependent systems remains explicit source metadata, not a hidden operational assumption.",
            ),
            why_it_exists="The corpus treats restore, failover, chaos proof, runbook binding, and critical-function recovery as release and assurance evidence. Backups alone do not satisfy the operating model.",
            affected_phases=("phase_9_assurance_ledger",),
            triggering_changes=(
                "CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER",
                "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS",
                "CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE",
                "CHG_OPERATIONAL_INCIDENT_OR_NEAR_MISS_LEARNING",
            ),
            required_artifacts=(
                "RecoveryEvidencePack",
                "RestoreRun, FailoverRun, and ChaosRun reports",
                "OperationalReadinessSnapshot",
                "RunbookBundle with current resilience tuple",
                "SyntheticRecoveryCoverageRecord set",
            ),
            required_reviews_or_signoffs=(
                "Resilience and operations approval through Release Manager",
                "Service Owner signoff on essential-function readiness",
                "Independent review when recovery posture changes materially",
            ),
            required_test_or_rehearsal_classes=(
                "clean-environment restore rehearsal",
                "failover rehearsal",
                "chaos run",
                "constrained recovery synthetic journeys",
            ),
            blocking_release_conditions=(
                "Restore evidence stale for the current runtime tuple",
                "Runbooks or recovery coverage not bound to the exact release watch tuple",
                "Dependency recovery order changed without fresh rehearsal proof",
            ),
            cadence="Pre-release for every material topology or dependency-order change, then continuously as rehearsal freshness decays.",
            primary_owner_role="ROLE_RELEASE_MANAGER",
            secondary_owner_roles=("ROLE_SERVICE_OWNER", "ROLE_INCIDENT_MANAGER", "ROLE_SECURITY_LEAD"),
            dependency_refs=(
                "dep_nhs_login_rail",
                "dep_cross_org_secure_messaging_mesh",
                "dep_local_booking_supplier_adapters",
                "dep_pharmacy_referral_transport",
            ),
            notes="This closes the gap where restore and recovery were treated as ops leftovers instead of governed evidence.",
        ),
    ]


def build_control_mappings() -> list[ControlMappingSpec]:
    return [
        ControlMappingSpec(
            mapping_id="CM_DCB0129_INCREMENTAL_GATE",
            framework_code="FW_DCB0129",
            workstream_id="WS_CLINICAL_MANUFACTURER",
            control_code="DCB0129_INCREMENTAL_GATE",
            control_summary="Every material change to red-flag rules, evidence assimilation, or urgent handling updates the hazard log, safety case, and sprint-time evidence incrementally.",
            required_evidence_artifacts=("HazardLog delta packet", "SafetyCase delta packet", "Rule-pack regression evidence"),
            source_phase_refs=("phase_1_red_flag_gate", "phase_2_identity_and_echoes"),
            source_object_refs=("SafetyDecisionRecord", "UrgentDiversionSettlement", "SafetyPreemptionRecord"),
            release_gates=("release_candidate_safety_gate",),
            operational_gates=("post_incident_capa_followup",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",
                "phase-1-the-red-flag-gate.md#5A. Hardening, metrics, and launch readiness",
            ),
            notes="This explicitly closes the final-stage-safety gap.",
        ),
        ControlMappingSpec(
            mapping_id="CM_DCB0129_CROSS_CHANNEL_RESAFETY",
            framework_code="FW_DCB0129",
            workstream_id="WS_CLINICAL_MANUFACTURER",
            control_code="DCB0129_CROSS_CHANNEL_RESAFETY",
            control_summary="Late detail, phone continuation, duplicate review, booking ambiguity, and pharmacy outcome drift all route back through canonical re-safety before calm routine flow resumes.",
            required_evidence_artifacts=("MaterialDeltaAssessment record", "SafetyPreemptionRecord", "SafetyDecisionRecord evidence"),
            source_phase_refs=("phase_2_identity_and_echoes", "phase_4_booking_engine", "phase_6_pharmacy_loop"),
            source_object_refs=("MaterialDeltaAssessment", "EvidenceAssimilationRecord", "BookingConfirmationTruthProjection", "PharmacyOutcomeRecord"),
            release_gates=("cross_channel_safety_regression",),
            operational_gates=("safety_epoch_monitoring",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-2-identity-and-echoes.md#2G. Convergence into one request model and one workflow",
                "forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state",
            ),
            notes="Safety proof remains authoritative across web, phone, pharmacy, and later assistive paths.",
        ),
        ControlMappingSpec(
            mapping_id="CM_DCB0160_LIVE_DEPLOYMENT",
            framework_code="FW_DCB0160",
            workstream_id="WS_CLINICAL_DEPLOYMENT_USE",
            control_code="DCB0160_DEPLOYMENT_MONITORING",
            control_summary="Deployment-side safety evidence must bind live configuration, local session ownership, telephony readiness, and post-release monitoring to the release tuple.",
            required_evidence_artifacts=("DeploymentSafetyCase annex", "Operational safety monitoring pack", "Rollback rehearsal evidence"),
            source_phase_refs=("phase_2_identity_and_echoes", "phase_9_assurance_ledger"),
            source_object_refs=("OperationalReadinessSnapshot", "WaveGuardrailSnapshot"),
            release_gates=("go_live_safety_gate", "canary_widen_gate"),
            operational_gates=("incident_followup_gate",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-9-the-assurance-ledger.md#What Phase 9 must prove before the core blueprint is considered complete",
            ),
            notes="Deployment/use safety is separate from manufacturer signoff.",
        ),
        ControlMappingSpec(
            mapping_id="CM_GDPR_DPIA_AND_MINIMISATION",
            framework_code="FW_GDPR",
            workstream_id="WS_DATA_PROTECTION_PRIVACY",
            control_code="GDPR_DPIA_MINIMISATION",
            control_summary="Identity, embedded, notification, telemetry, and assistive deltas must route through DPIA, disclosure maps, and minimum-necessary engineering proof.",
            required_evidence_artifacts=("DPIA packet", "Data-flow map", "Telemetry disclosure review"),
            source_phase_refs=("phase_2_identity_and_echoes", "phase_7_inside_the_nhs_app", "phase_8_assistive_layer"),
            source_object_refs=("IdentityEvidenceEnvelope", "UITelemetryDisclosureFence", "InvestigationScopeEnvelope"),
            release_gates=("privacy_gate",),
            operational_gates=("subprocessor_freshness_review",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-2-identity-and-echoes.md#High-priority trust gaps in this layer",
                "phase-7-inside-the-nhs-app.md#NHS App channel priorities",
                "phase-8-the-assistive-layer.md#Working scope",
            ),
            notes="Privacy evidence is attached to real engineering surfaces and artifacts.",
        ),
        ControlMappingSpec(
            mapping_id="CM_PECR_CONTACT_AND_MESSAGE_GOVERNANCE",
            framework_code="FW_PECR",
            workstream_id="WS_DATA_PROTECTION_PRIVACY",
            control_code="PECR_CHANNEL_AND_CONSENT_CONTROL",
            control_summary="Contact provenance, message route, and controlled resend or repair posture remain governed and auditable rather than inferred from transport acceptance.",
            required_evidence_artifacts=("Consent and contact-route evidence", "Notification repair policy evidence"),
            source_phase_refs=("phase_1_red_flag_gate", "phase_2_identity_and_echoes"),
            source_object_refs=("ContactRouteSnapshot", "ReachabilityAssessmentRecord", "AdapterReceiptCheckpoint"),
            release_gates=("channel_policy_gate",),
            operational_gates=("delivery_repair_review",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3F. Submission, receipt, and graceful fallback",
                "phase-2-identity-and-echoes.md#Rule 2: contact provenance matters",
            ),
            notes="Delivery rail truth and privacy proof are related but not interchangeable.",
        ),
        ControlMappingSpec(
            mapping_id="CM_DTAC_TECHNICAL_SECURITY",
            framework_code="FW_DTAC",
            workstream_id="WS_TECHNICAL_SECURITY_ASSURANCE",
            control_code="DTAC_TECHNICAL_SECURITY_PROOF",
            control_summary="Trust zones, service identities, service boundaries, secrets posture, and vendor freshness must publish as current evidence for the active runtime tuple.",
            required_evidence_artifacts=("Threat model delta", "RuntimeTopologyManifest", "Vendor assurance freshness record"),
            source_phase_refs=("phase_0_foundation", "phase_9_assurance_ledger"),
            source_object_refs=("RuntimeTopologyManifest", "TrustZoneBoundary", "AssuranceSliceTrustRecord"),
            release_gates=("security_gate", "runtime_tuple_gate"),
            operational_gates=("assurance_slice_freshness_gate",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "platform-runtime-and-release-blueprint.md#Runtime topology contract",
                "phase-9-the-assurance-ledger.md#Working scope",
            ),
            notes="Refreshed DTAC guidance is carried as source metadata, not assumed away.",
        ),
        ControlMappingSpec(
            mapping_id="CM_DSPT_RESPONSE_AND_RECOVERY",
            framework_code="FW_DSPT",
            workstream_id="WS_OPERATIONAL_RESILIENCE_RESTORE",
            control_code="DSPT_RESPONSE_RECOVERY_PROOF",
            control_summary="Restore, failover, dependency ordering, and incident-response proof must be rehearsed against the current runtime tuple and essential-function set.",
            required_evidence_artifacts=("RecoveryEvidencePack", "RestoreRun report", "OperationalReadinessSnapshot"),
            source_phase_refs=("phase_9_assurance_ledger",),
            source_object_refs=("RecoveryEvidenceArtifact", "OperationalReadinessSnapshot", "RunbookBundle"),
            release_gates=("pre_canary_readiness_gate", "widen_resume_gate"),
            operational_gates=("rehearsal_freshness_gate",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "platform-runtime-and-release-blueprint.md#Operational readiness and resilience",
            ),
            notes="Restore evidence is evidence, not preference.",
        ),
        ControlMappingSpec(
            mapping_id="CM_DTAC_INTEROPERABILITY",
            framework_code="FW_DTAC",
            workstream_id="WS_INTEROPERABILITY_EVIDENCE",
            control_code="DTAC_INTEROP_PROOF_CHAIN",
            control_summary="Adapters and partner channels must prove authoritative success semantics, proof-versus-transport discipline, and supplier capability freshness.",
            required_evidence_artifacts=("AdapterContractProfile evidence set", "Interop conformance matrix", "Proof-versus-transport reconciliation pack"),
            source_phase_refs=("phase_4_booking_engine", "phase_5_network_horizon", "phase_6_pharmacy_loop"),
            source_object_refs=("ExternalConfirmationGate", "PharmacyDispatchAttempt", "HubOfferToConfirmationTruthProjection"),
            release_gates=("interop_gate",),
            operational_gates=("supplier_capability_review",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-6-the-pharmacy-loop.md",
                "phase-5-the-network-horizon.md",
                "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly",
            ),
            notes="This control closes the false-transport-success gap across external rails.",
        ),
        ControlMappingSpec(
            mapping_id="CM_NHS_LOGIN_ONBOARDING",
            framework_code="FW_NHS_LOGIN_ONBOARDING",
            workstream_id="WS_PARTNER_ONBOARDING_EVIDENCE",
            control_code="NHS_LOGIN_PARTNER_PACK",
            control_summary="Redirect inventories, scopes, subject-binding proof, and local-session ownership evidence must stay attached to the live NHS login partner pack.",
            required_evidence_artifacts=("NHS login partner onboarding pack", "Redirect and scope inventory", "Environment parity evidence"),
            source_phase_refs=("phase_2_identity_and_echoes",),
            source_object_refs=("Session", "SessionEstablishmentRecord", "IdentityBinding"),
            release_gates=("partner_readiness_gate",),
            operational_gates=("redirect_parity_review",),
            baseline_scope="partner_specific",
            mapping_state="active",
            source_refs=(
                "phase-2-identity-and-echoes.md#Rule 1: never collapse identity into a boolean",
                "blueprint-init.md#10. Identity, consent, security, and policy",
            ),
            notes="NHS login evidence is engineering evidence, not procurement admin.",
        ),
        ControlMappingSpec(
            mapping_id="CM_IM1_MATERIAL_CHANGE_RFC",
            framework_code="FW_IM1_PAIRING_AND_RFC",
            workstream_id="WS_PARTNER_ONBOARDING_EVIDENCE",
            control_code="IM1_RFC_MATERIAL_CHANGE",
            control_summary="AI-containing or materially expanded products route through IM1 pairing evidence refresh and formal RFC rather than informal release notes.",
            required_evidence_artifacts=("IM1 pairing dossier", "RFC bundle", "Updated safety and privacy attachments"),
            source_phase_refs=("phase_8_assistive_layer",),
            source_object_refs=("RFCBundle", "AssistiveReleaseCandidate"),
            release_gates=("partner_material_change_gate",),
            operational_gates=("supplier_refresh_review",),
            baseline_scope="partner_specific",
            mapping_state="active",
            source_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "blueprint-init.md#9. AI and automation",
            ),
            notes="IM1 remains partner-specific, not a blanket baseline blocker.",
        ),
        ControlMappingSpec(
            mapping_id="CM_WCAG_ROUTE_COVERAGE",
            framework_code="FW_WCAG_22_AA",
            workstream_id="WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD",
            control_code="WCAG_ROUTE_SEMANTIC_COVERAGE",
            control_summary="Every route family publishes current semantic coverage, repair grammar, visualization parity, and reduced-motion equivalence before it may remain calm and interactive.",
            required_evidence_artifacts=("AccessibilitySemanticCoverageProfile set", "Accessibility audit pack", "Visualization parity evidence"),
            source_phase_refs=("phase_1_red_flag_gate", "phase_7_inside_the_nhs_app"),
            source_object_refs=("AccessibilitySemanticCoverageProfile", "VisualizationParityProjection"),
            release_gates=("accessibility_gate",),
            operational_gates=("route_semantic_drift_review",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3B. The web experience, not a form dump",
                "accessibility-and-content-system-contract.md#Route-family semantic coverage",
            ),
            notes="Accessibility is enforced against real routes and surfaces, not generic intent.",
        ),
        ControlMappingSpec(
            mapping_id="CM_SERVICE_STANDARD_CONTENT",
            framework_code="FW_NHS_SERVICE_STANDARD",
            workstream_id="WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD",
            control_code="SERVICE_STANDARD_AND_CONTENT_EVIDENCE",
            control_summary="Content clarity, health literacy, same-shell recovery wording, and mobile embedded usability remain part of release evidence.",
            required_evidence_artifacts=("Content QA pack", "Service-standard evidence pack"),
            source_phase_refs=("phase_1_red_flag_gate", "phase_7_inside_the_nhs_app"),
            source_object_refs=("AssistiveAnnouncementContract", "TimeoutRecoveryContract"),
            release_gates=("content_and_service_gate",),
            operational_gates=("copy_change_review",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3F. Submission, receipt, and graceful fallback",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
            ),
            notes="Accessibility/content is treated as architectural and assured delivery work.",
        ),
        ControlMappingSpec(
            mapping_id="CM_RECORDS_RETENTION",
            framework_code="FW_RECORDS_MGMT_CODE",
            workstream_id="WS_RECORDS_RETENTION_GOVERNANCE",
            control_code="RETENTION_AND_DISPOSITION_CONTROL",
            control_summary="Every durable artifact family carries a retention class, disposition path, preservation chain, and evidence-graph admissibility before delete or archive is allowed.",
            required_evidence_artifacts=("Retention schedule", "DeletionCertificate proof", "ArchiveManifest proof"),
            source_phase_refs=("phase_9_assurance_ledger",),
            source_object_refs=("RetentionDecision", "ArchiveManifest", "DeletionCertificate", "LegalHoldRecord"),
            release_gates=("new_artifact_class_gate",),
            operational_gates=("disposition_eligibility_gate",),
            baseline_scope="ongoing_bau",
            mapping_state="active",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
                "blueprint-init.md#The same summary discipline now extends to records lifecycle and preservation",
            ),
            notes="Retention and deletion remain governed evidence families.",
        ),
        ControlMappingSpec(
            mapping_id="CM_INCIDENT_REPORTABILITY",
            framework_code="FW_DSPT",
            workstream_id="WS_INCIDENT_NEAR_MISS_REPORTABILITY",
            control_code="INCIDENT_REPORTABILITY_AND_CAPA",
            control_summary="Incidents and near misses must preserve evidence, assess reportability, generate CAPA, and flow back into the assurance ledger and training loop.",
            required_evidence_artifacts=("SecurityIncident record", "ReportabilityAssessment", "PostIncidentReview", "TrainingDrillRecord"),
            source_phase_refs=("phase_9_assurance_ledger",),
            source_object_refs=("SecurityIncident", "NearMissReport", "ReportabilityAssessment", "PostIncidentReview"),
            release_gates=("release_hold_on_open_critical_incident",),
            operational_gates=("incident_command_gate",),
            baseline_scope="ongoing_bau",
            mapping_state="active",
            source_refs=(
                "phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",
            ),
            notes="Near miss is first-class and feeds follow-up controls.",
        ),
        ControlMappingSpec(
            mapping_id="CM_NHS_APP_INTEGRATION",
            framework_code="FW_NHS_APP_WEB_INTEGRATION",
            workstream_id="WS_NHS_APP_SCAL_CHANNEL",
            control_code="NHS_APP_MANIFEST_AND_CHANNEL_GATE",
            control_summary="Embedded route exposure, demo readiness, environment parity, and manifest promotion remain pinned to exact release and continuity tuples.",
            required_evidence_artifacts=("NHSAppIntegrationManifest", "ManifestPromotionBundle", "Demo readiness pack"),
            source_phase_refs=("phase_7_inside_the_nhs_app",),
            source_object_refs=("NHSAppIntegrationManifest", "ManifestPromotionBundle", "NHSAppContinuityEvidenceBundle"),
            release_gates=("phase7_channel_gate",),
            operational_gates=("sandpit_aos_env_parity_gate",),
            baseline_scope="deferred_phase7",
            mapping_state="deferred",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#7A. Journey inventory, integration manifest, and onboarding pack",
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
            ),
            notes="This remains visible but explicitly deferred from current baseline completeness.",
        ),
        ControlMappingSpec(
            mapping_id="CM_SCAL_CHANNEL_EVIDENCE",
            framework_code="FW_SCAL",
            workstream_id="WS_NHS_APP_SCAL_CHANNEL",
            control_code="SCAL_BUNDLE_AND_REHEARSAL",
            control_summary="SCAL submission binds accessibility, safety, privacy, manifest, telemetry, and incident rehearsal evidence to the exact embedded release tuple.",
            required_evidence_artifacts=("SCALBundle", "Sandpit/AOS sign-off packs", "Incident rehearsal evidence"),
            source_phase_refs=("phase_7_inside_the_nhs_app",),
            source_object_refs=("SCALBundle", "ReleaseApprovalFreeze", "ManifestPromotionBundle"),
            release_gates=("phase7_scal_submission_gate",),
            operational_gates=("channel_widening_gate",),
            baseline_scope="deferred_phase7",
            mapping_state="deferred",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",
            ),
            notes="Deferred Phase 7 obligation, not a baseline blocker before that phase.",
        ),
        ControlMappingSpec(
            mapping_id="CM_AI_HUMAN_OVERSIGHT",
            framework_code="FW_AI_AMBIENT_GUIDANCE",
            workstream_id="WS_ASSISTIVE_AI_GOVERNANCE",
            control_code="AI_HUMAN_OVERSIGHT_AND_MONITORING",
            control_summary="Assistive outputs stay reviewable, attributable, shadow-first, bias-monitored, and overrideable with explicit training and governance evidence.",
            required_evidence_artifacts=("Evaluation corpus results", "Training pack", "Assistive rollout verdict evidence"),
            source_phase_refs=("phase_8_assistive_layer",),
            source_object_refs=("AssistiveRolloutSliceContract", "AssistiveCapabilityRolloutVerdict"),
            release_gates=("assistive_visible_rollout_gate",),
            operational_gates=("assistive_trust_degradation_gate",),
            baseline_scope="assistive_optional",
            mapping_state="conditional",
            source_refs=(
                "phase-8-the-assistive-layer.md#Phase 8 implementation rules",
                "phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate",
            ),
            notes="Assistive capability is governed as optional scope until activated.",
        ),
        ControlMappingSpec(
            mapping_id="CM_MHRA_INTENDED_USE_BOUNDARY",
            framework_code="FW_MHRA_MEDICAL_DEVICE_BOUNDARY",
            workstream_id="WS_ASSISTIVE_AI_GOVERNANCE",
            control_code="INTENDED_USE_AND_MEDICAL_BOUNDARY",
            control_summary="Capability expansion, visible endpoint suggestion changes, or medical-purpose drift force intended-use review and medical-device boundary reassessment.",
            required_evidence_artifacts=("IntendedUseProfile", "MedicalDeviceAssessment record", "ChangeImpactAssessment"),
            source_phase_refs=("phase_8_assistive_layer",),
            source_object_refs=("IntendedUseProfile", "ChangeImpactAssessment"),
            release_gates=("assistive_boundary_gate",),
            operational_gates=("supplier_and_rollout_drift_gate",),
            baseline_scope="assistive_optional",
            mapping_state="conditional",
            source_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
            ),
            notes="This closes the gap where assistive regulation could be reduced to model QA.",
        ),
        ControlMappingSpec(
            mapping_id="CM_RUNTIME_PUBLICATION_PARITY",
            framework_code="FW_RUNTIME_PARITY_AND_WATCHLIST",
            workstream_id="WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            control_code="RUNTIME_PUBLICATION_AND_PARITY",
            control_summary="Release approval, runtime publication, frontend contract publication, continuity evidence, and watch tuples must all resolve to one exact parity-bound release tuple.",
            required_evidence_artifacts=("ReleasePublicationParityRecord", "RuntimePublicationBundle", "ReleaseWatchTuple"),
            source_phase_refs=("phase_0_foundation", "phase_9_assurance_ledger"),
            source_object_refs=("ReleaseApprovalFreeze", "RuntimePublicationBundle", "ReleasePublicationParityRecord", "ReleaseWatchTuple"),
            release_gates=("release_tuple_gate", "watch_tuple_gate"),
            operational_gates=("governance_watch_parity_gate",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "platform-runtime-and-release-blueprint.md#Release pipeline and watch tuple law",
                "forensic-audit-findings.md#Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight",
            ),
            notes="Release parity is part of regulated delivery, not separate deployment hygiene.",
        ),
        ControlMappingSpec(
            mapping_id="CM_STANDARDS_VERSION_WATCHLIST",
            framework_code="FW_RUNTIME_PARITY_AND_WATCHLIST",
            workstream_id="WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            control_code="STANDARDS_VERSION_METADATA_AND_HYGIENE",
            control_summary="Standards refreshes, legacy-document retirement, dependency lifecycle posture, and exception expiry are tracked in a candidate-bound watchlist with version metadata.",
            required_evidence_artifacts=("StandardsDependencyWatchlist", "StandardsExceptionRecord set"),
            source_phase_refs=("phase_9_assurance_ledger",),
            source_object_refs=("StandardsDependencyWatchlist", "StandardsExceptionRecord"),
            release_gates=("watchlist_clean_gate",),
            operational_gates=("exception_expiry_gate",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "phase-9-the-assurance-ledger.md#Working scope",
                "platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
            ),
            notes="This is where the March 2026 DTAC refresh and 2 March 2026 legacy-doc retirement stay visible.",
        ),
        ControlMappingSpec(
            mapping_id="CM_RESTORE_RECOVERY_EVIDENCE",
            framework_code="FW_DSPT",
            workstream_id="WS_OPERATIONAL_RESILIENCE_RESTORE",
            control_code="RESTORE_AND_RECOVERY_REHEARSAL",
            control_summary="The release cannot widen without current clean-environment restore proof, dependency-order rehearsal, and synthetic recovery coverage bound to the live tuple.",
            required_evidence_artifacts=("RestoreRun report", "RecoveryEvidencePack", "SyntheticRecoveryCoverageRecord set"),
            source_phase_refs=("phase_9_assurance_ledger",),
            source_object_refs=("RestoreRun", "RecoveryEvidencePack", "SyntheticRecoveryCoverageRecord"),
            release_gates=("restore_freshness_gate", "widen_resume_gate"),
            operational_gates=("recovery_activation_gate",),
            baseline_scope="baseline_required",
            mapping_state="active",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "platform-runtime-and-release-blueprint.md#Operational readiness and resilience",
            ),
            notes="This closes the gap where restore was treated as ops preference rather than governed evidence.",
        ),
    ]


def build_evidence_schedule() -> list[EvidenceArtifactSpec]:
    return [
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CREATION_CLINICAL_RISK_PLAN",
            artifact_name="ClinicalRiskManagementPlan baseline",
            artifact_family="clinical_safety",
            workstream_id="WS_CLINICAL_MANUFACTURER",
            trigger_class="initial capability activation",
            schedule_class="creation_time",
            cadence="Once per new clinical capability family, then supersede on formal restructuring.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_1_red_flag_gate",),
            primary_owner_role="ROLE_MANUFACTURER_CSO",
            independent_signoff_roles=("ROLE_SERVICE_OWNER",),
            release_or_operational_gate=("initial_capability_gate",),
            freshness_expectation="Current for the active rule and evidence architecture.",
            source_refs=("phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",),
            notes="Creation-time artifact; later deltas do not replace the baseline without supersession trace.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CONT_HAZARD_LOG_DELTA",
            artifact_name="HazardLog delta packet",
            artifact_family="clinical_safety",
            workstream_id="WS_CLINICAL_MANUFACTURER",
            trigger_class="material clinical behavior change",
            schedule_class="continuous_operational",
            cadence="On every material change to rules, identity, telephony, booking, hub, pharmacy, or assistive behavior.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_1_red_flag_gate", "phase_2_identity_and_echoes", "phase_8_assistive_layer"),
            primary_owner_role="ROLE_MANUFACTURER_CSO",
            independent_signoff_roles=("ROLE_DEPLOYMENT_CSO",),
            release_or_operational_gate=("release_candidate_safety_gate", "incident_followup_gate"),
            freshness_expectation="Must be current for the candidate or incident being reviewed.",
            source_refs=(
                "phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
            ),
            notes="Closes the corpus gap that treated safety evidence as final-stage activity.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_SAFETY_CASE_DELTA",
            artifact_name="SafetyCase delta packet",
            artifact_family="clinical_safety",
            workstream_id="WS_CLINICAL_MANUFACTURER",
            trigger_class="release candidate with changed clinical behavior",
            schedule_class="pre_release",
            cadence="Before any candidate that changes clinical behavior can move to release approval.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_1_red_flag_gate", "phase_8_assistive_layer"),
            primary_owner_role="ROLE_MANUFACTURER_CSO",
            independent_signoff_roles=("ROLE_RELEASE_MANAGER",),
            release_or_operational_gate=("release_candidate_safety_gate",),
            freshness_expectation="Candidate-bound and hash-stable.",
            source_refs=(
                "phase-1-the-red-flag-gate.md#5A. Hardening, metrics, and launch readiness",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
            ),
            notes="Release cannot rely on a stale safety-case packet.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PHASE_EXIT_DEPLOYMENT_SAFETY_PACK",
            artifact_name="Deployment safety and go-live pack",
            artifact_family="clinical_safety",
            workstream_id="WS_CLINICAL_DEPLOYMENT_USE",
            trigger_class="phase exit or new live rollout class",
            schedule_class="phase_exit",
            cadence="At Phase 2 exit, at channel expansions, and before assistive visible rollout.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_2_identity_and_echoes", "phase_7_inside_the_nhs_app", "phase_8_assistive_layer"),
            primary_owner_role="ROLE_DEPLOYMENT_CSO",
            independent_signoff_roles=("ROLE_SERVICE_OWNER", "ROLE_RELEASE_MANAGER"),
            release_or_operational_gate=("go_live_safety_gate",),
            freshness_expectation="Current for the live rollout class in scope.",
            source_refs=("phase-2-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",),
            notes="Separates deployment/use safety from manufacturer proof.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CREATION_DPIA_BASELINE",
            artifact_name="DPIA baseline packet",
            artifact_family="privacy",
            workstream_id="WS_DATA_PROTECTION_PRIVACY",
            trigger_class="new personal-data processing capability",
            schedule_class="creation_time",
            cadence="At first activation of a new identity, embedded, messaging, or assistive data-processing pattern.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_2_identity_and_echoes", "phase_8_assistive_layer"),
            primary_owner_role="ROLE_DPO",
            independent_signoff_roles=("ROLE_SERVICE_OWNER",),
            release_or_operational_gate=("privacy_gate",),
            freshness_expectation="Current for the active processing pattern.",
            source_refs=(
                "phase-2-identity-and-echoes.md#High-priority trust gaps in this layer",
                "phase-8-the-assistive-layer.md#Working scope",
            ),
            notes="The baseline carries the first full data-flow and disclosure view.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_DPIA_DELTA",
            artifact_name="DPIA delta packet",
            artifact_family="privacy",
            workstream_id="WS_DATA_PROTECTION_PRIVACY",
            trigger_class="identity, telemetry, embedded, or assistive change",
            schedule_class="pre_release",
            cadence="Before any release that changes identity proof, messaging, embedded delivery, telemetry, or assistive subprocessor posture.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_2_identity_and_echoes", "phase_7_inside_the_nhs_app", "phase_8_assistive_layer"),
            primary_owner_role="ROLE_DPO",
            independent_signoff_roles=("ROLE_SECURITY_LEAD", "ROLE_RELEASE_MANAGER"),
            release_or_operational_gate=("privacy_gate", "partner_material_change_gate"),
            freshness_expectation="Candidate-bound and specific to the changed flow.",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#NHS App channel priorities",
                "phase-8-the-assistive-layer.md#Working scope",
            ),
            notes="DPIA reruns are explicit outputs of the change matrix, not optional if the team thinks risk is low.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CONT_VENDOR_ASSURANCE",
            artifact_name="Vendor and subprocessor assurance freshness snapshot",
            artifact_family="security_assurance",
            workstream_id="WS_TECHNICAL_SECURITY_ASSURANCE",
            trigger_class="supplier or subprocessor drift",
            schedule_class="continuous_operational",
            cadence="Continuously monitored with release-time freshness checks for affected dependencies.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_8_assistive_layer", "phase_9_assurance_ledger"),
            primary_owner_role="ROLE_SECURITY_LEAD",
            independent_signoff_roles=("ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            release_or_operational_gate=("security_gate", "assistive_visible_rollout_gate"),
            freshness_expectation="Fresh for every affected release candidate and active live slice.",
            source_refs=(
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
                "phase-9-the-assurance-ledger.md#Working scope",
            ),
            notes="Supplier freshness is explicitly part of the assistive and partner control model.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PHASE_EXIT_INTEROP_PACK",
            artifact_name="Interoperability conformance packet",
            artifact_family="interoperability",
            workstream_id="WS_INTEROPERABILITY_EVIDENCE",
            trigger_class="phase capability exit or new external rail",
            schedule_class="phase_exit",
            cadence="At phase exits that open new partner or adapter rails, then on material conformance drift.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_2_identity_and_echoes", "phase_4_booking_engine", "phase_6_pharmacy_loop"),
            primary_owner_role="ROLE_INTEROPERABILITY_LEAD",
            independent_signoff_roles=("ROLE_RELEASE_MANAGER",),
            release_or_operational_gate=("interop_gate",),
            freshness_expectation="Current for the exact adapter and proof semantics in use.",
            source_refs=("phase-2-identity-and-echoes.md#Rule 5: keep IM1 out of the critical path for this phase",),
            notes="Makes partner and adapter proof explicit at phase boundaries.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_ACCESSIBILITY_AUDIT",
            artifact_name="Accessibility audit and semantic coverage pack",
            artifact_family="accessibility",
            workstream_id="WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD",
            trigger_class="route, shell, or embedded behavior change",
            schedule_class="pre_release",
            cadence="Before any release changing patient, embedded, or governance-facing routes that carry new semantics or recovery posture.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_1_red_flag_gate", "phase_7_inside_the_nhs_app"),
            primary_owner_role="ROLE_ACCESSIBILITY_CONTENT_LEAD",
            independent_signoff_roles=("ROLE_SERVICE_OWNER",),
            release_or_operational_gate=("accessibility_gate",),
            freshness_expectation="Current for each materially changed route family.",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3B. The web experience, not a form dump",
                "phase-7-inside-the-nhs-app.md#7G. Accessibility, service-standard, and mobile embedded UX hardening",
            ),
            notes="Pairs formal audits with route-family semantic coverage proof.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CONT_CONTENT_REVIEW",
            artifact_name="Content QA and service-standard review pack",
            artifact_family="accessibility",
            workstream_id="WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD",
            trigger_class="copy or patient guidance change",
            schedule_class="continuous_operational",
            cadence="On every patient-facing copy, error, recovery, or channel-specific content delta.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_1_red_flag_gate", "phase_7_inside_the_nhs_app"),
            primary_owner_role="ROLE_ACCESSIBILITY_CONTENT_LEAD",
            independent_signoff_roles=("ROLE_SERVICE_OWNER",),
            release_or_operational_gate=("content_and_service_gate",),
            freshness_expectation="Current for the rendered copy and route inventory in scope.",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3F. Submission, receipt, and graceful fallback",
                "accessibility-and-content-system-contract.md#Content clarity and calm-task completion",
            ),
            notes="Content changes are governed evidence, not informal copy edits.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CREATION_RETENTION_SCHEDULE",
            artifact_name="Retention schedule and artifact class map",
            artifact_family="records_governance",
            workstream_id="WS_RECORDS_RETENTION_GOVERNANCE",
            trigger_class="new durable artifact family",
            schedule_class="creation_time",
            cadence="At creation of any new durable artifact family.",
            baseline_scope="ongoing_bau",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_RECORDS_GOVERNANCE_LEAD",
            independent_signoff_roles=("ROLE_DPO",),
            release_or_operational_gate=("new_artifact_class_gate",),
            freshness_expectation="Current for all live artifact families.",
            source_refs=("phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",),
            notes="No durable artifact family is allowed to enter service without this map.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PERIODIC_RETENTION_PACK",
            artifact_name="Disposition, archive, and deletion governance pack",
            artifact_family="records_governance",
            workstream_id="WS_RECORDS_RETENTION_GOVERNANCE",
            trigger_class="periodic governance review",
            schedule_class="periodic_publication",
            cadence="Monthly governance pack with additional publication before major retention-rule changes.",
            baseline_scope="ongoing_bau",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_RECORDS_GOVERNANCE_LEAD",
            independent_signoff_roles=("ROLE_DPO", "ROLE_SERVICE_OWNER"),
            release_or_operational_gate=("governance_pack_gate",),
            freshness_expectation="Current for the latest completed period.",
            source_refs=("phase-9-the-assurance-ledger.md#Working scope",),
            notes="Periodic pack publication is separate from creation-time policy capture.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CONT_INCIDENT_RECORD",
            artifact_name="Incident, near-miss, and CAPA evidence chain",
            artifact_family="incident_governance",
            workstream_id="WS_INCIDENT_NEAR_MISS_REPORTABILITY",
            trigger_class="incident or near-miss occurrence",
            schedule_class="continuous_operational",
            cadence="On every incident, near miss, and reportability assessment.",
            baseline_scope="ongoing_bau",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_INCIDENT_MANAGER",
            independent_signoff_roles=("ROLE_SERVICE_OWNER", "ROLE_DPO"),
            release_or_operational_gate=("incident_command_gate",),
            freshness_expectation="Immediate and current while incident handling remains open.",
            source_refs=("phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",),
            notes="Feeds both release holds and periodic assurance packs.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PERIODIC_DRILL_RECORD",
            artifact_name="Training drill and reportability rehearsal record",
            artifact_family="incident_governance",
            workstream_id="WS_INCIDENT_NEAR_MISS_REPORTABILITY",
            trigger_class="scheduled operational rehearsal",
            schedule_class="periodic_publication",
            cadence="Quarterly drills or faster when incident debt or risk posture demands.",
            baseline_scope="ongoing_bau",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_INCIDENT_MANAGER",
            independent_signoff_roles=("ROLE_SERVICE_OWNER",),
            release_or_operational_gate=("operational_readiness_gate",),
            freshness_expectation="Fresh enough for the active operational readiness tuple.",
            source_refs=("phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",),
            notes="The corpus expects drills and staff willingness to report, not only ticket logging.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_NHS_LOGIN_PACK",
            artifact_name="NHS login partner onboarding pack",
            artifact_family="partner_onboarding",
            workstream_id="WS_PARTNER_ONBOARDING_EVIDENCE",
            trigger_class="partner configuration or live onboarding movement",
            schedule_class="pre_release",
            cadence="Before non-mock onboarding, redirect changes, or live partner expansion.",
            baseline_scope="partner_specific",
            source_phase_refs=("phase_2_identity_and_echoes",),
            primary_owner_role="ROLE_PARTNER_ONBOARDING_LEAD",
            independent_signoff_roles=("ROLE_SECURITY_LEAD", "ROLE_MANUFACTURER_CSO"),
            release_or_operational_gate=("partner_readiness_gate",),
            freshness_expectation="Current for the exact redirect inventory, scope set, and environment tuple.",
            source_refs=("phase-2-the-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",),
            notes="Partner onboarding evidence remains engineering-owned.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_IM1_RFC_PACK",
            artifact_name="IM1 pairing and material-change RFC bundle",
            artifact_family="partner_onboarding",
            workstream_id="WS_PARTNER_ONBOARDING_EVIDENCE",
            trigger_class="material product or AI change affecting IM1 posture",
            schedule_class="pre_release",
            cadence="Before any IM1-relevant material change reaches the paired product surface.",
            baseline_scope="partner_specific",
            source_phase_refs=("phase_8_assistive_layer",),
            primary_owner_role="ROLE_PARTNER_ONBOARDING_LEAD",
            independent_signoff_roles=("ROLE_AI_GOVERNANCE_LEAD", "ROLE_MANUFACTURER_CSO"),
            release_or_operational_gate=("partner_material_change_gate",),
            freshness_expectation="Candidate-bound and materially current.",
            source_refs=("phase-8-the-assistive-layer.md#Working scope",),
            notes="The RFC bundle is only needed when the change class requires it; the trigger matrix makes that explicit.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PHASE_EXIT_SCAL_BUNDLE",
            artifact_name="SCAL bundle and NHS App channel evidence pack",
            artifact_family="channel_onboarding",
            workstream_id="WS_NHS_APP_SCAL_CHANNEL",
            trigger_class="Phase 7 channel activation",
            schedule_class="phase_exit",
            cadence="Only when Phase 7 becomes active, then before Sandpit, AOS, limited release, and full release transitions.",
            baseline_scope="deferred_phase7",
            source_phase_refs=("phase_7_inside_the_nhs_app",),
            primary_owner_role="ROLE_PARTNER_ONBOARDING_LEAD",
            independent_signoff_roles=("ROLE_ACCESSIBILITY_CONTENT_LEAD", "ROLE_DPO", "ROLE_MANUFACTURER_CSO"),
            release_or_operational_gate=("phase7_scal_submission_gate",),
            freshness_expectation="Current for the exact embedded manifest and release tuple.",
            source_refs=("phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",),
            notes="Deferred workstream artifact; not a current baseline blocker.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CREATION_ASSISTIVE_INTENDED_USE",
            artifact_name="Assistive intended-use and boundary baseline",
            artifact_family="assistive_governance",
            workstream_id="WS_ASSISTIVE_AI_GOVERNANCE",
            trigger_class="first assistive capability activation",
            schedule_class="creation_time",
            cadence="Once per capability family before shadow or visible rollout begins.",
            baseline_scope="assistive_optional",
            source_phase_refs=("phase_8_assistive_layer",),
            primary_owner_role="ROLE_AI_GOVERNANCE_LEAD",
            independent_signoff_roles=("ROLE_MANUFACTURER_CSO", "ROLE_DPO"),
            release_or_operational_gate=("assistive_boundary_gate",),
            freshness_expectation="Current for the declared capability family and intended-use wording.",
            source_refs=("phase-8-the-assistive-layer.md#8A. Assistive capability contract, intended-use boundaries, and policy envelope",),
            notes="Freezes intended use before visible rollout.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_ASSISTIVE_RELEASE_CANDIDATE",
            artifact_name="Assistive release candidate and regulatory routing pack",
            artifact_family="assistive_governance",
            workstream_id="WS_ASSISTIVE_AI_GOVERNANCE",
            trigger_class="assistive material change or visible rollout step",
            schedule_class="pre_release",
            cadence="Before every visible rollout step and any material assistive change.",
            baseline_scope="assistive_optional",
            source_phase_refs=("phase_8_assistive_layer",),
            primary_owner_role="ROLE_AI_GOVERNANCE_LEAD",
            independent_signoff_roles=("ROLE_MANUFACTURER_CSO", "ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            release_or_operational_gate=("assistive_visible_rollout_gate",),
            freshness_expectation="Candidate-bound and pinned to supplier, rollout, and rollback tuples.",
            source_refs=("phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",),
            notes="Bundles intended use, vendor freshness, RFC/SCAL routing, and rollback readiness together.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CONT_ASSISTIVE_SUPPLIER_FRESHNESS",
            artifact_name="Assistive supplier assurance freshness snapshot",
            artifact_family="assistive_governance",
            workstream_id="WS_ASSISTIVE_AI_GOVERNANCE",
            trigger_class="vendor or subprocessor freshness drift",
            schedule_class="continuous_operational",
            cadence="Continuously monitored and checked before widening or resume.",
            baseline_scope="assistive_optional",
            source_phase_refs=("phase_8_assistive_layer",),
            primary_owner_role="ROLE_AI_GOVERNANCE_LEAD",
            independent_signoff_roles=("ROLE_SECURITY_LEAD", "ROLE_DPO"),
            release_or_operational_gate=("assistive_trust_degradation_gate",),
            freshness_expectation="Fresh enough for every live visible slice.",
            source_refs=("phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",),
            notes="Supplier freshness is explicitly release-blocking when drifted or suspended.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_RELEASE_PARITY_RECORD",
            artifact_name="Release publication parity record",
            artifact_family="release_governance",
            workstream_id="WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            trigger_class="release candidate creation",
            schedule_class="pre_release",
            cadence="For every release candidate before canary or channel exposure.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_0_foundation", "phase_9_assurance_ledger"),
            primary_owner_role="ROLE_RELEASE_MANAGER",
            independent_signoff_roles=("ROLE_SERVICE_OWNER",),
            release_or_operational_gate=("release_tuple_gate",),
            freshness_expectation="Hash-stable and current for the candidate under review.",
            source_refs=("platform-runtime-and-release-blueprint.md#Release pipeline and watch tuple law",),
            notes="Keeps runtime, route, contract, and continuity proof aligned.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_CONT_STANDARDS_WATCHLIST",
            artifact_name="Standards and dependency watchlist snapshot",
            artifact_family="release_governance",
            workstream_id="WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            trigger_class="standards refresh or dependency lifecycle drift",
            schedule_class="continuous_operational",
            cadence="Continuously regenerated when standards or dependency posture changes.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_RELEASE_MANAGER",
            independent_signoff_roles=("ROLE_SECURITY_LEAD",),
            release_or_operational_gate=("watchlist_clean_gate",),
            freshness_expectation="Current for every active candidate and live watch tuple.",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "platform-admin-and-config-blueprint.md#StandardsDependencyWatchlist",
            ),
            notes="Carries March 2026 DTAC refresh and 2 March 2026 legacy-doc retirement context.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PRE_RECOVERY_PACK",
            artifact_name="Recovery evidence and readiness pack",
            artifact_family="resilience",
            workstream_id="WS_OPERATIONAL_RESILIENCE_RESTORE",
            trigger_class="pre-release readiness review",
            schedule_class="pre_release",
            cadence="Before canary, before widening on materially changed tuples, and before live recovery activation on changed domains.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_RELEASE_MANAGER",
            independent_signoff_roles=("ROLE_SERVICE_OWNER", "ROLE_SECURITY_LEAD"),
            release_or_operational_gate=("pre_canary_readiness_gate", "widen_resume_gate"),
            freshness_expectation="Fresh for the exact runtime publication and watch tuple in scope.",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
                "platform-runtime-and-release-blueprint.md#Operational readiness and resilience",
            ),
            notes="This is required baseline evidence, not a future ops nice-to-have.",
        ),
        EvidenceArtifactSpec(
            artifact_schedule_id="EV_PERIODIC_ASSURANCE_PACK",
            artifact_name="Monthly assurance pack",
            artifact_family="assurance_publication",
            workstream_id="WS_RELEASE_RUNTIME_PUBLICATION_PARITY",
            trigger_class="period close",
            schedule_class="periodic_publication",
            cadence="Monthly, with additional on-demand packs after major incidents or regulatory changes.",
            baseline_scope="baseline_required",
            source_phase_refs=("phase_9_assurance_ledger",),
            primary_owner_role="ROLE_RELEASE_MANAGER",
            independent_signoff_roles=("ROLE_SERVICE_OWNER", "ROLE_DPO", "ROLE_MANUFACTURER_CSO"),
            release_or_operational_gate=("governance_pack_gate",),
            freshness_expectation="Current for the closed period and linked to the current evidence graph snapshot.",
            source_refs=("phase-9-the-assurance-ledger.md#Working scope",),
            notes="Periodic publication is distinct from continuous evidence generation.",
        ),
    ]


def build_hazards() -> list[HazardSpec]:
    return [
        HazardSpec(
            hazard_id="HZ_WRONG_PATIENT_BINDING",
            hazard_title="Wrong-patient binding or correction failure",
            hazard_family="identity_safety",
            baseline_scope="baseline_required",
            description="Identity binding, secure-link redemption, or correction flow could expose or act on the wrong patient if freezes, evidence, and release ordering fail.",
            initiating_change_classes=("CHG_IDENTITY_BINDING_OR_SESSION", "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS"),
            potential_harms=("privacy breach", "clinical action on wrong patient", "wrong-patient reassurance"),
            required_controls=("HazardLog delta packet", "Identity repair evidence bundle", "DPIA delta packet"),
            required_evidence=("SafetyCase delta packet", "Session and binding regression suites"),
            primary_workstream_ids=("WS_CLINICAL_MANUFACTURER", "WS_DATA_PROTECTION_PRIVACY", "WS_CLINICAL_DEPLOYMENT_USE"),
            required_independent_signoff=("ROLE_MANUFACTURER_CSO", "ROLE_DPO"),
            source_refs=(
                "phase-2-the-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",
                "phase-9-the-assurance-ledger.md#IdentityRepairEvidenceBundle",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_URGENT_DIVERSION_UNDER_OR_OVER_TRIAGE",
            hazard_title="Urgent diversion under-triage or over-triage",
            hazard_family="clinical_decision",
            baseline_scope="baseline_required",
            description="Rule or evidence changes could request urgent diversion too late, too early, or settle it inaccurately across channels.",
            initiating_change_classes=("CHG_SAFETY_RULE_PACK", "CHG_TELEPHONY_CAPTURE_OR_CONTINUATION"),
            potential_harms=("missed urgent care", "unnecessary escalation", "stale reassurance"),
            required_controls=("HazardLog delta packet", "SafetyDecisionRecord regression", "Deployment safety monitoring pack"),
            required_evidence=("same_facts_same_safety_outcome regression", "urgent diversion decision-versus-settlement proof"),
            primary_workstream_ids=("WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE"),
            required_independent_signoff=("ROLE_MANUFACTURER_CSO", "ROLE_DEPLOYMENT_CSO"),
            source_refs=(
                "phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",
                "forensic-audit-findings.md#Finding 11 - Urgent diversion required and completed were collapsed",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_TELEPHONY_EVIDENCE_INADEQUACY",
            hazard_title="Telephony evidence inadequacy",
            hazard_family="evidence_readiness",
            baseline_scope="baseline_required",
            description="Recording, transcript, or structured capture failure could leave clinically material phone evidence unresolved while the workflow appears routine.",
            initiating_change_classes=("CHG_TELEPHONY_CAPTURE_OR_CONTINUATION",),
            potential_harms=("missed safety signals", "wrong route intent", "incomplete audit trail"),
            required_controls=("DeploymentSafetyCase annex", "Telephony evidence readiness gate", "Operational safety monitoring pack"),
            required_evidence=("telephony-evidence-readiness gating tests", "recording and transcript readiness proof"),
            primary_workstream_ids=("WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE", "WS_INTEROPERABILITY_EVIDENCE"),
            required_independent_signoff=("ROLE_MANUFACTURER_CSO", "ROLE_DEPLOYMENT_CSO"),
            source_refs=("phase-2-the-identity-and-echoes.md#2G. Convergence into one request model and one workflow",),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_DUPLICATE_SUPPRESSION_OR_MERGE",
            hazard_title="Duplicate suppression or merge hazard",
            hazard_family="lineage_integrity",
            baseline_scope="baseline_required",
            description="Cross-channel duplicate handling or same-request attach could inappropriately merge clinically distinct evidence or hide replay collisions.",
            initiating_change_classes=("CHG_IDENTITY_BINDING_OR_SESSION", "CHG_TELEPHONY_CAPTURE_OR_CONTINUATION"),
            potential_harms=("lost or misattributed evidence", "wrong clinical route", "audit ambiguity"),
            required_controls=("HazardLog delta packet", "Interop conformance matrix", "Policy-watch compatibility review"),
            required_evidence=("duplicate-resolution tests", "cross-channel candidate competition tests"),
            primary_workstream_ids=("WS_CLINICAL_MANUFACTURER", "WS_INTEROPERABILITY_EVIDENCE"),
            required_independent_signoff=("ROLE_MANUFACTURER_CSO",),
            source_refs=("phase-2-the-identity-and-echoes.md#2G. Convergence into one request model and one workflow",),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_STALE_PROJECTION_FALSE_REASSURANCE",
            hazard_title="Stale projection or false reassurance",
            hazard_family="continuity_and_truth",
            baseline_scope="baseline_required",
            description="Stale projections, drifted publication tuples, or degraded assurance slices could leave the UI or operations surface calmer than the current truth.",
            initiating_change_classes=("CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER", "CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE", "CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE"),
            potential_harms=("false reassurance", "unsafe actionability", "delayed mitigation"),
            required_controls=("Release publication parity record", "Continuity evidence bundle", "Recovery evidence pack"),
            required_evidence=("continuity-evidence convergence checks", "route-contract parity tests"),
            primary_workstream_ids=("WS_RELEASE_RUNTIME_PUBLICATION_PARITY", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            required_independent_signoff=("ROLE_RELEASE_MANAGER",),
            source_refs=(
                "phase-9-the-assurance-ledger.md#ExperienceContinuityControlEvidence",
                "forensic-audit-findings.md#Finding 102 - Ops continuity evidence was still not a first-class operational slice",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_FALSE_BOOKING_CONFIRMATION",
            hazard_title="False booking confirmation",
            hazard_family="booking_truth",
            baseline_scope="baseline_required",
            description="Local booking, network booking, or practice acknowledgement drift could render a booked reassurance state without authoritative confirmation proof.",
            initiating_change_classes=("CHG_BOOKING_CONFIRMATION_OR_WAITLIST", "CHG_HUB_COORDINATION_OR_ACK"),
            potential_harms=("false patient reassurance", "missed appointment", "incorrect closure"),
            required_controls=("Interop conformance matrix", "HazardLog delta packet", "Release publication parity record"),
            required_evidence=("booking confirmation ambiguity regression", "practice acknowledgement debt proof"),
            primary_workstream_ids=("WS_CLINICAL_MANUFACTURER", "WS_INTEROPERABILITY_EVIDENCE", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            required_independent_signoff=("ROLE_MANUFACTURER_CSO", "ROLE_INTEROPERABILITY_LEAD"),
            source_refs=(
                "forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly",
                "forensic-audit-findings.md#Finding 34 - Hub coordination lacked ranked patient choice, authoritative confirmation, and practice-visibility debt",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_PHARMACY_DISPATCH_OR_OUTCOME_AMBIGUITY",
            hazard_title="Pharmacy dispatch or outcome ambiguity",
            hazard_family="external_confirmation",
            baseline_scope="baseline_required",
            description="Dispatch, acceptance, or weakly matched outcome evidence could imply completion or closure without governed proof.",
            initiating_change_classes=("CHG_PHARMACY_DISPATCH_OR_OUTCOME",),
            potential_harms=("missed clinical follow-up", "false closure", "patient safety delay"),
            required_controls=("Interop conformance matrix", "HazardLog delta packet", "Recovery evidence pack"),
            required_evidence=("pharmacy outcome reconciliation tests", "proof-versus-transport regression"),
            primary_workstream_ids=("WS_CLINICAL_MANUFACTURER", "WS_INTEROPERABILITY_EVIDENCE"),
            required_independent_signoff=("ROLE_MANUFACTURER_CSO", "ROLE_INTEROPERABILITY_LEAD"),
            source_refs=(
                "phase-6-the-pharmacy-loop.md",
                "forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_CROSS_ORG_VISIBILITY_WIDENING",
            hazard_title="Cross-organisation visibility widening",
            hazard_family="privacy_and_governance",
            baseline_scope="baseline_required",
            description="Hub, support, governance, or embedded changes could widen data visibility beyond the allowed acting scope or published audience tier.",
            initiating_change_classes=("CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE", "CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA", "CHG_PARTNER_CONFIGURATION_OR_REDIRECTS"),
            potential_harms=("privacy breach", "regulatory non-compliance", "unsafe support or hub action"),
            required_controls=("DPIA delta packet", "Standards and dependency watchlist snapshot", "Retention and disclosure review"),
            required_evidence=("visibility and masking tests", "acting-scope drift freeze proof"),
            primary_workstream_ids=("WS_DATA_PROTECTION_PRIVACY", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            required_independent_signoff=("ROLE_DPO",),
            source_refs=(
                "forensic-audit-findings.md#Finding 47 - Cross-organisation and support visibility boundaries were under-specified",
                "forensic-audit-findings.md#Finding 114 - Tenant and acting context could still drift between governance scope and live cross-organisation work",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_ASSISTIVE_HALLUCINATION_OR_OVERREACH",
            hazard_title="Assistive hallucination, overreach, or silent degradation",
            hazard_family="assistive_governance",
            baseline_scope="assistive_optional",
            description="Assistive outputs could expand beyond intended use, drift silently, or stay visible after trust, supplier, or policy degradation.",
            initiating_change_classes=(
                "CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
                "CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT",
                "CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
                "CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE",
            ),
            potential_harms=("unsafe clinical suggestion", "regulatory breach", "false operator confidence"),
            required_controls=("Assistive release candidate and regulatory routing pack", "Intended-use baseline", "Supplier assurance freshness snapshot"),
            required_evidence=("shadow-versus-human comparison suites", "freeze disposition and rollback rehearsal"),
            primary_workstream_ids=("WS_ASSISTIVE_AI_GOVERNANCE", "WS_CLINICAL_MANUFACTURER", "WS_DATA_PROTECTION_PRIVACY"),
            required_independent_signoff=("ROLE_AI_GOVERNANCE_LEAD", "ROLE_MANUFACTURER_CSO", "ROLE_DPO"),
            source_refs=(
                "phase-8-the-assistive-layer.md#Working scope",
                "phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_RETENTION_OR_DELETION_OF_REQUIRED_ARTIFACTS",
            hazard_title="Retention or deletion of still-required artifacts",
            hazard_family="records_governance",
            baseline_scope="ongoing_bau",
            description="Evidence, recordings, transcripts, deletion certificates, or investigation artifacts could be deleted, archived, or hidden before legal, safety, or assurance obligations are complete.",
            initiating_change_classes=("CHG_RETENTION_POLICY_OR_ARTIFACT_CLASS", "CHG_OPERATIONAL_INCIDENT_OR_NEAR_MISS_LEARNING"),
            potential_harms=("loss of evidence", "inability to investigate", "regulatory breach"),
            required_controls=("Retention schedule", "Disposition eligibility evidence", "Evidence graph completeness review"),
            required_evidence=("retention dry-run tests", "delete-versus-hold conflict tests"),
            primary_workstream_ids=("WS_RECORDS_RETENTION_GOVERNANCE", "WS_INCIDENT_NEAR_MISS_REPORTABILITY"),
            required_independent_signoff=("ROLE_RECORDS_GOVERNANCE_LEAD", "ROLE_DPO"),
            source_refs=(
                "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
                "blueprint-init.md#The same summary discipline now extends to records lifecycle and preservation",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
        HazardSpec(
            hazard_id="HZ_RESTORE_FAILURE_OR_DEPENDENCY_RECOVERY_ORDER",
            hazard_title="Restore failure or dependency recovery-order defect",
            hazard_family="operational_resilience",
            baseline_scope="baseline_required",
            description="Backup presence without proven restore order could leave essential functions unavailable or misleadingly partial after recovery or incident response.",
            initiating_change_classes=("CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER", "CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE"),
            potential_harms=("extended outage", "unsafe degraded service", "irreproducible recovery"),
            required_controls=("Recovery evidence and readiness pack", "Standards watchlist snapshot"),
            required_evidence=("clean-environment restore rehearsal", "synthetic constrained recovery journeys"),
            primary_workstream_ids=("WS_OPERATIONAL_RESILIENCE_RESTORE", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            required_independent_signoff=("ROLE_RELEASE_MANAGER", "ROLE_SERVICE_OWNER"),
            source_refs=(
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "platform-runtime-and-release-blueprint.md#Operational readiness and resilience",
            ),
            notes="Mandatory seed hazard from the prompt.",
        ),
    ]


def build_change_triggers() -> list[ChangeTriggerSpec]:
    return [
        ChangeTriggerSpec(
            change_trigger_id="CHG_SAFETY_RULE_PACK",
            change_class="Safety rules, clinical thresholds, or red-flag policy change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE"),
            impacted_frameworks=("FW_DCB0129", "FW_DCB0160", "FW_DTAC"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_MANUFACTURER_CSO", "ROLE_DEPLOYMENT_CSO", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("same_facts_same_safety_outcome regression", "urgent diversion suites"),
            blocking_condition="No release until the candidate-bound hazard log, safety case, and regression evidence reflect the changed rule set.",
            source_refs=(
                "phase-1-the-red-flag-gate.md#Safety engine and red-flag logic",
                "phase-1-the-red-flag-gate.md#5A. Hardening, metrics, and launch readiness",
            ),
            notes="Phase 1 explicitly requires incremental hazard and safety updates for rule changes.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_IDENTITY_BINDING_OR_SESSION",
            change_class="Identity binding, NHS login callback, secure-link, or local session ownership change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE", "WS_DATA_PROTECTION_PRIVACY", "WS_TECHNICAL_SECURITY_ASSURANCE"),
            impacted_frameworks=("FW_DCB0129", "FW_DCB0160", "FW_GDPR", "FW_DTAC", "FW_NHS_LOGIN_ONBOARDING"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="yes",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_MANUFACTURER_CSO", "ROLE_DPO", "ROLE_SECURITY_LEAD"),
            required_rehearsal_classes=("wrong-patient freeze and release suites", "auth replay and session expiry suites"),
            blocking_condition="No release until wrong-patient, subject-switch, and disclosure-safe recovery behavior are re-proved for the changed identity/session tuple.",
            source_refs=("phase-2-the-identity-and-echoes.md#High-priority trust gaps in this layer",),
            notes="Phase 2 explicitly links identity changes to safety, privacy, and assurance evidence.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_TELEPHONY_CAPTURE_OR_CONTINUATION",
            change_class="Telephony capture, recording, transcript, continuation, or callback-flow change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE", "WS_INTEROPERABILITY_EVIDENCE", "WS_DATA_PROTECTION_PRIVACY"),
            impacted_frameworks=("FW_DCB0129", "FW_DCB0160", "FW_DTAC", "FW_GDPR"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_MANUFACTURER_CSO", "ROLE_DEPLOYMENT_CSO", "ROLE_INTEROPERABILITY_LEAD"),
            required_rehearsal_classes=("telephony evidence readiness gating tests", "callback repair suites"),
            blocking_condition="No release until transcript readiness, callback truth, continuation fencing, and safety rerun paths are re-proved.",
            source_refs=("phase-2-the-identity-and-echoes.md#2G. Convergence into one request model and one workflow",),
            notes="Telephony is a named safety and deployment trigger class in the corpus.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_BOOKING_CONFIRMATION_OR_WAITLIST",
            change_class="Local booking confirmation, waitlist, or supplier reconciliation change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_CLINICAL_MANUFACTURER", "WS_INTEROPERABILITY_EVIDENCE"),
            impacted_frameworks=("FW_DCB0129", "FW_DTAC"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="no",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_MANUFACTURER_CSO", "ROLE_INTEROPERABILITY_LEAD"),
            required_rehearsal_classes=("booking confirmation ambiguity regression", "proof-versus-transport regression"),
            blocking_condition="No release until false-booked reassurance and waitlist fallback truth remain explicit under the changed supplier behavior.",
            source_refs=("forensic-audit-findings.md#Finding 74 - Phase 4 let booking-domain logic write canonical request state directly",),
            notes="Booking truth is authoritative proof, not transport acceptance.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_HUB_COORDINATION_OR_ACK",
            change_class="Hub coordination, practice visibility, or acknowledgement behavior change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_CLINICAL_MANUFACTURER", "WS_INTEROPERABILITY_EVIDENCE"),
            impacted_frameworks=("FW_DCB0129", "FW_DTAC"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="no",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_MANUFACTURER_CSO", "ROLE_INTEROPERABILITY_LEAD"),
            required_rehearsal_classes=("practice acknowledgement debt proof", "hub confirmation ambiguity suites"),
            blocking_condition="No release until hub confirmation and practice acknowledgement debt remain explicit and non-collapsible.",
            source_refs=("forensic-audit-findings.md#Finding 34 - Hub coordination lacked ranked patient choice, authoritative confirmation, and practice-visibility debt",),
            notes="Hub change remains a clinical-safety and interoperability issue.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_PHARMACY_DISPATCH_OR_OUTCOME",
            change_class="Pharmacy dispatch, provider choice, or outcome-reconciliation change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_CLINICAL_MANUFACTURER", "WS_INTEROPERABILITY_EVIDENCE"),
            impacted_frameworks=("FW_DCB0129", "FW_DTAC"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="no",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_MANUFACTURER_CSO", "ROLE_INTEROPERABILITY_LEAD"),
            required_rehearsal_classes=("pharmacy outcome reconciliation tests", "dispatch proof-chain suites"),
            blocking_condition="No release until dispatch proof, consent scope, and weak-outcome reconciliation behavior are re-proved.",
            source_refs=("forensic-audit-findings.md#Finding 79 - weak-source matching did not clearly stop at a case-local review state",),
            notes="Pharmacy change remains safety-affecting even if transport wiring seems narrow.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_NOTIFICATION_COPY_OR_CHANNEL_POLICY",
            change_class="Notification copy, reminder policy, or channel-specific recovery behavior change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_DATA_PROTECTION_PRIVACY", "WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD"),
            impacted_frameworks=("FW_PECR", "FW_GDPR", "FW_NHS_SERVICE_STANDARD"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="no",
            trigger_release_freeze="conditional",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_DPO", "ROLE_ACCESSIBILITY_CONTENT_LEAD"),
            required_rehearsal_classes=("content QA review", "delivery repair and wrong-recipient tests"),
            blocking_condition="Patient-facing communication changes cannot release without privacy, consent, clarity, and repair posture review.",
            source_refs=(
                "phase-1-the-red-flag-gate.md#3F. Submission, receipt, and graceful fallback",
                "phase-7-inside-the-nhs-app.md#7F. Webview-safe documents, handoff, error, and recovery design",
            ),
            notes="Channel copy is part of the governed communication and privacy posture.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_PUBLIC_EMBEDDED_SURFACE_OR_ROUTE",
            change_class="Public, patient, embedded, or governance surface route and shell behavior change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_DATA_PROTECTION_PRIVACY", "WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            impacted_frameworks=("FW_GDPR", "FW_WCAG_22_AA", "FW_NHS_SERVICE_STANDARD", "FW_RUNTIME_PARITY_AND_WATCHLIST"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_ACCESSIBILITY_CONTENT_LEAD", "ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("route semantic coverage tests", "continuity-evidence convergence checks"),
            blocking_condition="No release until route publication, accessibility coverage, disclosure posture, and continuity evidence remain tuple-aligned.",
            source_refs=(
                "accessibility-and-content-system-contract.md#Route-family semantic coverage",
                "platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            ),
            notes="Accessibility/content remains architectural; route changes are release-governed.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_RUNTIME_TOPOLOGY_OR_DEPENDENCY_ORDER",
            change_class="Runtime topology, trust-zone, workload family, or dependency recovery-order change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_TECHNICAL_SECURITY_ASSURANCE", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY", "WS_OPERATIONAL_RESILIENCE_RESTORE", "WS_CLINICAL_DEPLOYMENT_USE"),
            impacted_frameworks=("FW_DTAC", "FW_DSPT", "FW_DCB0160", "FW_RUNTIME_PARITY_AND_WATCHLIST"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="yes",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_SECURITY_LEAD", "ROLE_RELEASE_MANAGER", "ROLE_DEPLOYMENT_CSO"),
            required_rehearsal_classes=("clean-environment restore rehearsal", "failover rehearsal", "runtime tuple parity tests"),
            blocking_condition="No release until trust-zone, parity, and restore proof all match the new topology and dependency order.",
            source_refs=(
                "platform-runtime-and-release-blueprint.md#Runtime topology contract",
                "platform-runtime-and-release-blueprint.md#Operational readiness and resilience",
            ),
            notes="Restore and release parity are explicit blockers here.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_RETENTION_POLICY_OR_ARTIFACT_CLASS",
            change_class="Retention rule, legal-hold behavior, or durable artifact-class change",
            baseline_scope="ongoing_bau",
            impacted_workstreams=("WS_RECORDS_RETENTION_GOVERNANCE", "WS_DATA_PROTECTION_PRIVACY"),
            impacted_frameworks=("FW_RECORDS_MGMT_CODE", "FW_GDPR"),
            trigger_hazard_log_update="no",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="no",
            trigger_release_freeze="conditional",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_RECORDS_GOVERNANCE_LEAD", "ROLE_DPO"),
            required_rehearsal_classes=("retention dry-run tests", "delete-versus-hold conflict tests"),
            blocking_condition="No release or lifecycle activation until the new artifact or rule has retention class, hold behavior, and admissible evidence-graph linkage.",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
                "blueprint-init.md#The same summary discipline now extends to records lifecycle and preservation",
            ),
            notes="Retention changes can affect release if they alter live artifact behavior.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_TELEMETRY_OR_DISCLOSURE_SCHEMA",
            change_class="Telemetry, disclosure fence, or audit/export schema change",
            baseline_scope="baseline_required",
            impacted_workstreams=("WS_DATA_PROTECTION_PRIVACY", "WS_TECHNICAL_SECURITY_ASSURANCE", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            impacted_frameworks=("FW_GDPR", "FW_DTAC", "FW_RUNTIME_PARITY_AND_WATCHLIST"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="yes",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_DPO", "ROLE_SECURITY_LEAD", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("PHI-safe telemetry and logging tests", "continuity-evidence convergence checks"),
            blocking_condition="No release until PHI-safe disclosure ceilings, audit/export behavior, and published telemetry contracts are current.",
            source_refs=(
                "phase-7-inside-the-nhs-app.md#NHS App channel priorities",
                "phase-9-the-assurance-ledger.md#Working scope",
            ),
            notes="Telemetry and export shapes are product contracts, not local logging choices.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_ASSISTIVE_INTENDED_USE_OR_BOUNDARY",
            change_class="Assistive intended-use wording, medical-purpose boundary, or capability-family change",
            baseline_scope="assistive_optional",
            impacted_workstreams=("WS_ASSISTIVE_AI_GOVERNANCE", "WS_CLINICAL_MANUFACTURER", "WS_DATA_PROTECTION_PRIVACY", "WS_PARTNER_ONBOARDING_EVIDENCE"),
            impacted_frameworks=("FW_AI_AMBIENT_GUIDANCE", "FW_MHRA_MEDICAL_DEVICE_BOUNDARY", "FW_DCB0129", "FW_GDPR", "FW_IM1_PAIRING_AND_RFC", "FW_SCAL"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="yes",
            trigger_dtac_delta="yes",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="yes",
            required_signoff_classes=("ROLE_AI_GOVERNANCE_LEAD", "ROLE_MANUFACTURER_CSO", "ROLE_DPO", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("assistive boundary review", "rollback rehearsal", "shadow-versus-human comparison suites"),
            blocking_condition="No assistive release until intended-use freeze, safety-case delta, DPIA, DTAC delta, and partner RFC/SCAL routing are complete where required.",
            source_refs=("phase-8-the-assistive-layer.md#Working scope",),
            notes="Mandatory assistive trigger class from the prompt.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_ASSISTIVE_VISIBLE_WORKFLOW_EFFECT",
            change_class="Assistive visible summary, insertion, endpoint suggestion, or workflow-effect change",
            baseline_scope="assistive_optional",
            impacted_workstreams=("WS_ASSISTIVE_AI_GOVERNANCE", "WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE"),
            impacted_frameworks=("FW_AI_AMBIENT_GUIDANCE", "FW_DCB0129", "FW_DCB0160", "FW_DTAC"),
            trigger_hazard_log_update="yes",
            trigger_safety_case_delta="yes",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="yes",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_AI_GOVERNANCE_LEAD", "ROLE_MANUFACTURER_CSO", "ROLE_DEPLOYMENT_CSO"),
            required_rehearsal_classes=("shadow-versus-human comparison suites", "no-autonomous-write proof"),
            blocking_condition="No assistive visible rollout until changed workflow effects and human-review gates are re-proved.",
            source_refs=("phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",),
            notes="Mandatory assistive trigger class from the prompt.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_ASSISTIVE_VENDOR_MODEL_OR_SUBPROCESSOR",
            change_class="Assistive model, prompt, supplier, or subprocessor change",
            baseline_scope="assistive_optional",
            impacted_workstreams=("WS_ASSISTIVE_AI_GOVERNANCE", "WS_DATA_PROTECTION_PRIVACY", "WS_TECHNICAL_SECURITY_ASSURANCE"),
            impacted_frameworks=("FW_AI_AMBIENT_GUIDANCE", "FW_DTAC", "FW_GDPR"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="yes",
            trigger_dtac_delta="yes",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_AI_GOVERNANCE_LEAD", "ROLE_DPO", "ROLE_SECURITY_LEAD"),
            required_rehearsal_classes=("supplier freshness review", "drift and fairness alert validation"),
            blocking_condition="No rollout or widen action until supplier freshness, privacy review, and technical-security evidence are current for the new supplier/model tuple.",
            source_refs=("phase-8-the-assistive-layer.md#8H. Release administration, regulatory routing, and rollback readiness",),
            notes="Mandatory assistive trigger class from the prompt.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_ASSISTIVE_ROLLOUT_OR_SLICE_EXPOSURE",
            change_class="Assistive rollout rung, cohort exposure, or slice-contract change",
            baseline_scope="assistive_optional",
            impacted_workstreams=("WS_ASSISTIVE_AI_GOVERNANCE", "WS_CLINICAL_DEPLOYMENT_USE", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            impacted_frameworks=("FW_AI_AMBIENT_GUIDANCE", "FW_DCB0160", "FW_DSPT", "FW_RUNTIME_PARITY_AND_WATCHLIST"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_AI_GOVERNANCE_LEAD", "ROLE_DEPLOYMENT_CSO", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("freeze disposition and rollback rehearsal", "slice parity and watch-tuple checks"),
            blocking_condition="No visible widen or resume until slice-contract evidence, trust freshness, and rollback proof are current.",
            source_refs=("phase-8-the-assistive-layer.md#8I. Pilot rollout, controlled slices, and formal exit gate",),
            notes="Mandatory assistive trigger class from the prompt.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_PARTNER_CONFIGURATION_OR_REDIRECTS",
            change_class="Partner redirect, scope, sandbox, or approved-portal configuration change",
            baseline_scope="partner_specific",
            impacted_workstreams=("WS_PARTNER_ONBOARDING_EVIDENCE", "WS_TECHNICAL_SECURITY_ASSURANCE", "WS_CLINICAL_DEPLOYMENT_USE"),
            impacted_frameworks=("FW_NHS_LOGIN_ONBOARDING", "FW_IM1_PAIRING_AND_RFC", "FW_DTAC"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="yes",
            required_signoff_classes=("ROLE_PARTNER_ONBOARDING_LEAD", "ROLE_SECURITY_LEAD", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("redirect parity validation", "partner onboarding completeness review"),
            blocking_condition="No live partner move until config, secrets, evidence pack, and runtime tuple all agree.",
            source_refs=("phase-2-the-identity-and-echoes.md#2H. Hardening, safety evidence, and the formal Phase 2 exit gate",),
            notes="Partner-specific but release-blocking when that configuration changes.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_NHS_APP_MANIFEST_OR_CHANNEL_EXPOSURE",
            change_class="NHS App manifest, route exposure, Sandpit/AOS profile, or SCAL-related channel change",
            baseline_scope="deferred_phase7",
            impacted_workstreams=("WS_NHS_APP_SCAL_CHANNEL", "WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            impacted_frameworks=("FW_NHS_APP_WEB_INTEGRATION", "FW_SCAL", "FW_WCAG_22_AA", "FW_NHS_SERVICE_STANDARD"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="yes",
            required_signoff_classes=("ROLE_PARTNER_ONBOARDING_LEAD", "ROLE_ACCESSIBILITY_CONTENT_LEAD", "ROLE_RELEASE_MANAGER"),
            required_rehearsal_classes=("Sandpit checklist", "AOS checklist", "incident rehearsal"),
            blocking_condition="Only if Phase 7 is active: no release until manifest, SCAL, accessibility, and environment-parity evidence are current.",
            source_refs=("phase-7-inside-the-nhs-app.md#7H. Sandpit, AOS, SCAL, and operational delivery pipeline",),
            notes="Deferred Phase 7 trigger class kept explicit, not silently relabelled as current baseline.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_POLICY_OR_STANDARDS_BASELINE_UPDATE",
            change_class="Standards refresh, watchlist finding, or dependency/documentation baseline change",
            baseline_scope="ongoing_bau",
            impacted_workstreams=("WS_RELEASE_RUNTIME_PUBLICATION_PARITY", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            impacted_frameworks=("FW_RUNTIME_PARITY_AND_WATCHLIST", "FW_DTAC", "FW_DSPT"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="yes",
            trigger_release_freeze="yes",
            trigger_partner_rfc_or_scal_update="conditional",
            required_signoff_classes=("ROLE_RELEASE_MANAGER", "ROLE_SECURITY_LEAD", "ROLE_SERVICE_OWNER"),
            required_rehearsal_classes=("watchlist clean review", "runtime tuple parity tests", "restore proof refresh if impacted"),
            blocking_condition="No release or widen action until refreshed standards, exceptions, and dependent recovery evidence are reconciled to the active tuple.",
            source_refs=(
                "phase-9-the-assurance-ledger.md#Phase 9 implementation rules",
                "phase-9-the-assurance-ledger.md#Working scope",
            ),
            notes="Preserves March 2026-era standards refresh context instead of flattening it away.",
        ),
        ChangeTriggerSpec(
            change_trigger_id="CHG_OPERATIONAL_INCIDENT_OR_NEAR_MISS_LEARNING",
            change_class="Incident learning or near-miss-driven control update",
            baseline_scope="ongoing_bau",
            impacted_workstreams=("WS_INCIDENT_NEAR_MISS_REPORTABILITY", "WS_CLINICAL_DEPLOYMENT_USE", "WS_RECORDS_RETENTION_GOVERNANCE", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            impacted_frameworks=("FW_DSPT", "FW_DCB0160", "FW_RECORDS_MGMT_CODE"),
            trigger_hazard_log_update="conditional",
            trigger_safety_case_delta="conditional",
            trigger_dpia_rerun="conditional",
            trigger_dtac_delta="conditional",
            trigger_release_freeze="conditional",
            trigger_partner_rfc_or_scal_update="no",
            required_signoff_classes=("ROLE_INCIDENT_MANAGER", "ROLE_SERVICE_OWNER"),
            required_rehearsal_classes=("post-incident drill", "CAPA verification"),
            blocking_condition="Affected release or live slice remains blocked until required CAPA or safety/privacy/resilience follow-up is complete.",
            source_refs=("phase-9-the-assurance-ledger.md#9G. Security operations, incident workflow, and just-culture reporting",),
            notes="Operational learning explicitly feeds the regulated workstreams.",
        ),
    ]


def build_signoff_nodes() -> list[SignoffNodeSpec]:
    return [
        SignoffNodeSpec("ROLE_SERVICE_OWNER", "Service Owner", "service_accountability", "governance", "Owns service consequence and phase signoff burden."),
        SignoffNodeSpec("ROLE_MANUFACTURER_CSO", "Manufacturer Clinical Safety Officer", "clinical_safety", "clinical_safety_manufacturer", "Independent safety approval for manufacturer-side changes."),
        SignoffNodeSpec("ROLE_DEPLOYMENT_CSO", "Deployment and Use Clinical Safety Lead", "clinical_safety", "clinical_safety_deployment", "Independent deployment/use safety approval for live rollout changes."),
        SignoffNodeSpec("ROLE_DPO", "Data Protection Officer", "privacy", "privacy", "Approves DPIA and privacy-impactful changes."),
        SignoffNodeSpec("ROLE_SECURITY_LEAD", "Security Lead", "technical_security", "security", "Approves trust-zone, secrets, and supplier-security posture."),
        SignoffNodeSpec("ROLE_INTEROPERABILITY_LEAD", "Interoperability Lead", "interop", "interoperability", "Approves adapter and proof-chain conformance."),
        SignoffNodeSpec("ROLE_ACCESSIBILITY_CONTENT_LEAD", "Accessibility and Content Lead", "experience_assurance", "experience", "Approves route-level accessibility and content evidence."),
        SignoffNodeSpec("ROLE_RECORDS_GOVERNANCE_LEAD", "Records Governance Lead", "records", "records", "Approves retention and disposition controls."),
        SignoffNodeSpec("ROLE_INCIDENT_MANAGER", "Incident Manager", "incident", "incident", "Owns incident and near-miss workflow decisions."),
        SignoffNodeSpec("ROLE_PARTNER_ONBOARDING_LEAD", "Partner Onboarding Lead", "partner", "partner", "Owns partner-specific onboarding evidence and RFC routing."),
        SignoffNodeSpec("ROLE_AI_GOVERNANCE_LEAD", "AI Governance Lead", "assistive", "assistive", "Owns intended-use freeze, assistive rollout, and model-governance review."),
        SignoffNodeSpec("ROLE_RELEASE_MANAGER", "Release Manager", "release", "release", "Final release approver after independent domain approvals complete."),
    ]


def build_signoff_edges() -> list[SignoffEdgeSpec]:
    return [
        SignoffEdgeSpec(
            edge_id="EDGE_SAFETY_TO_RELEASE",
            from_role_code="ROLE_MANUFACTURER_CSO",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_CLINICAL_MANUFACTURER", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            independence_rule="The release approver must not treat engineering authorship as a substitute for independent safety signoff.",
            approval_artifacts=("SafetyCase delta packet", "HazardLog delta packet"),
            notes="Manufacturer clinical safety is an upstream gate for safety-affecting releases.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_DEPLOYMENT_TO_RELEASE",
            from_role_code="ROLE_DEPLOYMENT_CSO",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_CLINICAL_DEPLOYMENT_USE", "WS_OPERATIONAL_RESILIENCE_RESTORE"),
            independence_rule="Deployment/use safety approval must be distinct from runtime implementation ownership.",
            approval_artifacts=("Deployment safety and go-live pack", "Recovery evidence and readiness pack"),
            notes="Live rollout and recovery posture must carry independent review.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_PRIVACY_TO_RELEASE",
            from_role_code="ROLE_DPO",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_DATA_PROTECTION_PRIVACY", "WS_RECORDS_RETENTION_GOVERNANCE"),
            independence_rule="Privacy approval cannot be implied by security or product signoff alone.",
            approval_artifacts=("DPIA packet", "Retention schedule"),
            notes="Privacy and records reviews attach to candidate-bound artifacts.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_SECURITY_TO_RELEASE",
            from_role_code="ROLE_SECURITY_LEAD",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_TECHNICAL_SECURITY_ASSURANCE", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            independence_rule="Security review must remain independent of the team authoring the runtime or dependency change.",
            approval_artifacts=("Threat model delta", "RuntimeTopologyManifest", "Standards and dependency watchlist snapshot"),
            notes="Security and runtime tuple parity converge here.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_INTEROP_TO_RELEASE",
            from_role_code="ROLE_INTEROPERABILITY_LEAD",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_INTEROPERABILITY_EVIDENCE",),
            independence_rule="Adapter owners cannot self-approve changed proof semantics without interoperability review.",
            approval_artifacts=("Interop conformance packet",),
            notes="Partner proof chains stay explicit.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_EXPERIENCE_TO_RELEASE",
            from_role_code="ROLE_ACCESSIBILITY_CONTENT_LEAD",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_ACCESSIBILITY_CONTENT_SERVICE_STANDARD", "WS_NHS_APP_SCAL_CHANNEL"),
            independence_rule="Accessibility/content evidence cannot be collapsed into visual QA or product intent alone.",
            approval_artifacts=("Accessibility audit pack", "Content QA pack", "SCAL bundle and NHS App channel evidence pack"),
            notes="Route and channel changes require independent experience assurance.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_PARTNER_TO_RELEASE",
            from_role_code="ROLE_PARTNER_ONBOARDING_LEAD",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_PARTNER_ONBOARDING_EVIDENCE", "WS_NHS_APP_SCAL_CHANNEL"),
            independence_rule="Partner-pack completeness must be checked by the owner of the onboarding lane, not inferred from deployment readiness alone.",
            approval_artifacts=("NHS login partner onboarding pack", "IM1 pairing and material-change RFC bundle", "SCAL bundle and NHS App channel evidence pack"),
            notes="External onboarding evidence and internal release evidence are related but not interchangeable.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_AI_TO_RELEASE",
            from_role_code="ROLE_AI_GOVERNANCE_LEAD",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_ASSISTIVE_AI_GOVERNANCE",),
            independence_rule="Assistive rollout cannot self-approve intended-use changes, visible workflow effects, or supplier drift.",
            approval_artifacts=("Assistive release candidate and regulatory routing pack", "Assistive intended-use and boundary baseline"),
            notes="Assistive governance adds a distinct independent lane before release.",
        ),
        SignoffEdgeSpec(
            edge_id="EDGE_SERVICE_OWNER_FINAL_ACCOUNTABILITY",
            from_role_code="ROLE_SERVICE_OWNER",
            to_role_code="ROLE_RELEASE_MANAGER",
            applies_to=("WS_CLINICAL_MANUFACTURER", "WS_DATA_PROTECTION_PRIVACY", "WS_OPERATIONAL_RESILIENCE_RESTORE", "WS_RELEASE_RUNTIME_PUBLICATION_PARITY"),
            independence_rule="Service accountability is required, but it does not replace independent domain approvals.",
            approval_artifacts=("Monthly assurance pack", "Release publication parity record"),
            notes="Service owner confirms consequence ownership after domain approvals exist.",
        ),
    ]


def framework_lookup() -> dict[str, FrameworkContextSpec]:
    return {row.framework_code: row for row in build_framework_catalog()}


def workstream_lookup() -> dict[str, WorkstreamSpec]:
    return {row.workstream_id: row for row in build_workstreams()}


def serialize_rows(rows: list[Any]) -> list[dict[str, Any]]:
    return [json.loads(json.dumps(asdict(row))) for row in rows]


def build_payload(
    frameworks: list[FrameworkContextSpec],
    workstreams: list[WorkstreamSpec],
    mappings: list[ControlMappingSpec],
    evidence_rows: list[EvidenceArtifactSpec],
    hazards: list[HazardSpec],
    triggers: list[ChangeTriggerSpec],
    nodes: list[SignoffNodeSpec],
    edges: list[SignoffEdgeSpec],
    upstream: dict[str, int],
) -> dict[str, Any]:
    scope_counts = Counter(row.baseline_scope for row in workstreams)
    schedule_counts = Counter(row.schedule_class for row in evidence_rows)
    framework_counts = Counter(code for row in workstreams for code in row.framework_or_governance_basis)
    high_risk_triggers = [
        row.change_trigger_id
        for row in triggers
        if row.trigger_release_freeze == "yes"
    ]
    return {
        "inventory_id": "vecells_regulatory_workstreams_v1",
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream,
        "summary": {
            "framework_count": len(frameworks),
            "workstream_count": len(workstreams),
            "control_mapping_count": len(mappings),
            "evidence_artifact_count": len(evidence_rows),
            "hazard_seed_count": len(hazards),
            "change_trigger_count": len(triggers),
            "signoff_role_count": len(nodes),
            "signoff_edge_count": len(edges),
            "scope_counts": dict(sorted(scope_counts.items())),
            "schedule_counts": dict(sorted(schedule_counts.items())),
            "framework_usage_counts": dict(sorted(framework_counts.items())),
            "high_risk_change_trigger_ids": high_risk_triggers,
            "gap_count": 0,
        },
        "framework_catalog": serialize_rows(frameworks),
        "workstreams": serialize_rows(workstreams),
        "framework_control_mapping": serialize_rows(mappings),
        "evidence_artifact_schedule": serialize_rows(evidence_rows),
        "safety_hazard_register_seed": serialize_rows(hazards),
        "change_control_trigger_matrix": serialize_rows(triggers),
        "signoff_topology": {
            "nodes": serialize_rows(nodes),
            "edges": serialize_rows(edges),
        },
        "gaps": [],
    }


def render_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def render_regulatory_doc(payload: dict[str, Any]) -> str:
    frameworks = payload["framework_catalog"]
    workstreams = payload["workstreams"]
    framework_rows = render_table(
        ["Framework", "Scope", "Source-era context", "Why it matters"],
        [
            [
                row["framework_name"],
                title_case_scope(row["baseline_relevance"]),
                row["source_date_context"],
                row["source_version_context"],
            ]
            for row in frameworks
        ],
    )
    workstream_rows = render_table(
        ["Workstream", "Scope", "Framework basis", "Owner", "Cadence"],
        [
            [
                row["workstream_name"],
                title_case_scope(row["baseline_scope"]),
                ", ".join(row["framework_or_governance_basis"]),
                row["primary_owner_role"],
                row["cadence"],
            ]
            for row in workstreams
        ],
    )
    baseline_rows = [row for row in workstreams if row["baseline_scope"] in {"baseline_required", "ongoing_bau"}]
    deferred_rows = [row for row in workstreams if row["baseline_scope"] not in {"baseline_required", "ongoing_bau"}]
    return "\n".join(
        [
            "# 09 Regulatory Workstreams",
            "",
            "Vecells needs one explicit operating model for safety, privacy, partner evidence, records governance, resilience, and release assurance. This pack preserves source-era version context rather than flattening the corpus into a timeless checklist.",
            "",
            f"- Frameworks: {payload['summary']['framework_count']}",
            f"- Workstreams: {payload['summary']['workstream_count']}",
            f"- Baseline-required or ongoing workstreams: {len(baseline_rows)}",
            f"- Deferred or conditional workstreams: {len(deferred_rows)}",
            "",
            "## Framework Context",
            "",
            framework_rows,
            "",
            "## Workstream Inventory",
            "",
            workstream_rows,
            "",
            "## Baseline posture",
            "",
            "Baseline workstreams include manufacturer safety, deployment/use safety, privacy, security, interoperability, accessibility/content, release/runtime parity, records governance, incident handling, and resilience. These are part of the build and release model, not post-build overlay work.",
            "",
            "## Deferred and conditional posture",
            "",
            "NHS App onboarding and SCAL remain explicit but deferred to Phase 7. Assistive and AI governance remains optional scope until Phase 8 work is activated, but becomes fully release-blocking once visible rollout starts.",
        ]
    )


def render_clinical_safety_doc(payload: dict[str, Any]) -> str:
    workstreams = {
        row["workstream_id"]: row
        for row in payload["workstreams"]
        if row["workstream_id"] in {"WS_CLINICAL_MANUFACTURER", "WS_CLINICAL_DEPLOYMENT_USE", "WS_ASSISTIVE_AI_GOVERNANCE"}
    }
    hazards = payload["safety_hazard_register_seed"]
    safety_hazards = [
        row for row in hazards if any(code in row["primary_workstream_ids"] for code in workstreams)
    ]
    workstream_sections: list[str] = []
    for row in workstreams.values():
        workstream_sections.extend(
            [
                f"### {row['workstream_name']}",
                "",
                f"- Scope: {title_case_scope(row['baseline_scope'])}",
                f"- Why it exists: {row['why_it_exists']}",
                f"- Triggering changes: {', '.join(row['triggering_changes'])}",
                f"- Required artifacts: {', '.join(row['required_artifacts'])}",
                f"- Independent review path: {', '.join(row['required_reviews_or_signoffs'])}",
                f"- Blocking conditions: {', '.join(row['blocking_release_conditions'])}",
                "",
            ]
        )
    hazard_table = render_table(
        ["Hazard", "Change classes", "Controls", "Independent signoff"],
        [
            [
                row["hazard_title"],
                ", ".join(row["initiating_change_classes"]),
                ", ".join(row["required_controls"]),
                ", ".join(row["required_independent_signoff"]),
            ]
            for row in safety_hazards
        ],
    )
    return "\n".join(
        [
            "# 09 Clinical Safety Workstreams",
            "",
            "The corpus separates manufacturer-side safety, deployment/use safety, and optional assistive safety governance. Those approvals intersect, but they do not collapse into one generic approval state.",
            "",
            "## Safety workstreams",
            "",
            *workstream_sections,
            "## Seed hazards",
            "",
            hazard_table,
            "",
            "## Signoff rule",
            "",
            "Manufacturer safety approval, deployment/use approval, privacy review, and release approval are adjacent but independent. A single implementation owner cannot self-certify the whole chain.",
        ]
    )


def render_framework_doc(payload: dict[str, Any], framework_rows: list[ControlMappingSpec]) -> str:
    lookup = framework_lookup()
    rows = render_table(
        ["Framework", "Control", "Workstream", "Evidence", "Release gate"],
        [
            [
                lookup[row.framework_code].framework_name,
                row.control_summary,
                row.workstream_id,
                ", ".join(row.required_evidence_artifacts),
                ", ".join(row.release_gates),
            ]
            for row in framework_rows
        ],
    )
    return "\n".join(
        [
            "# 09 Framework Control Mapping",
            "",
            "This matrix maps the named frameworks and governance bases from the corpus to concrete controls, evidence, and release or operational gates.",
            "",
            rows,
        ]
    )


def render_evidence_doc(evidence_rows: list[EvidenceArtifactSpec]) -> str:
    grouped: dict[str, list[EvidenceArtifactSpec]] = {}
    for row in evidence_rows:
        grouped.setdefault(row.schedule_class, []).append(row)
    sections: list[str] = ["# 09 Evidence Artifact Schedule", "", "The evidence model is intentionally multi-temporal: creation-time, phase-exit, pre-release, continuous operational, and periodic publication evidence are distinct obligations.", ""]
    for schedule_class in (
        "creation_time",
        "phase_exit",
        "pre_release",
        "continuous_operational",
        "periodic_publication",
    ):
        rows = grouped.get(schedule_class, [])
        sections.extend(
            [
                f"## {title_case_scope(schedule_class)}",
                "",
                render_table(
                    ["Artifact", "Workstream", "Trigger", "Cadence", "Gate"],
                    [
                        [
                            row.artifact_name,
                            row.workstream_id,
                            row.trigger_class,
                            row.cadence,
                            ", ".join(row.release_or_operational_gate),
                        ]
                        for row in rows
                    ],
                ),
                "",
            ]
        )
    return "\n".join(sections)


def render_hazard_doc(
    hazards: list[HazardSpec],
    triggers: list[ChangeTriggerSpec],
    nodes: list[SignoffNodeSpec],
    edges: list[SignoffEdgeSpec],
) -> str:
    hazard_table = render_table(
        ["Hazard", "Scope", "Change classes", "Controls", "Evidence"],
        [
            [
                row.hazard_title,
                title_case_scope(row.baseline_scope),
                ", ".join(row.initiating_change_classes),
                ", ".join(row.required_controls),
                ", ".join(row.required_evidence),
            ]
            for row in hazards
        ],
    )
    trigger_table = render_table(
        ["Change class", "Hazard log", "Safety case", "DPIA", "DTAC", "Release freeze", "Partner RFC/SCAL"],
        [
            [
                row.change_class,
                row.trigger_hazard_log_update,
                row.trigger_safety_case_delta,
                row.trigger_dpia_rerun,
                row.trigger_dtac_delta,
                row.trigger_release_freeze,
                row.trigger_partner_rfc_or_scal_update,
            ]
            for row in triggers
        ],
    )
    role_table = render_table(
        ["Role", "Domain", "Independence group", "Notes"],
        [
            [row.role_name, row.approval_domain, row.independence_group, row.notes]
            for row in nodes
        ],
    )
    edge_table = render_table(
        ["From", "To", "Applies to", "Independence rule", "Artifacts"],
        [
            [
                row.from_role_code,
                row.to_role_code,
                ", ".join(row.applies_to),
                row.independence_rule,
                ", ".join(row.approval_artifacts),
            ]
            for row in edges
        ],
    )
    return "\n".join(
        [
            "# 09 Hazard, Change Control, and Signoff Model",
            "",
            "The change-control model routes concrete implementation deltas into hazard-log updates, safety-case deltas, privacy review, DTAC refresh, release freezes, and partner-specific RFC or SCAL work where the corpus requires them.",
            "",
            "## Hazard seed",
            "",
            hazard_table,
            "",
            "## Change-trigger matrix",
            "",
            trigger_table,
            "",
            "## Signoff roles",
            "",
            role_table,
            "",
            "## Signoff topology",
            "",
            edge_table,
        ]
    )


def build_html(payload: dict[str, Any]) -> str:
    safe_json = (
        json.dumps(payload)
        .replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("</", "<\\/")
    )
    return (
        """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vecells Regulatory Workstream Board</title>
  <link rel="icon" href="data:,">
  <style>
    :root {
      --bg: #F5F7FA;
      --surface: #FFFFFF;
      --ink: #121826;
      --ink-soft: #475467;
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
      --nav-width: 280px;
      --focus: 2px solid #335CFF;
      --grid-gap: 24px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top left, rgba(51,92,255,0.08), transparent 28%), var(--bg);
      color: var(--ink);
      line-height: 1.55;
    }
    a { color: inherit; }
    button, input {
      font: inherit;
    }
    :focus-visible {
      outline: var(--focus);
      outline-offset: 2px;
    }
    .shell {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 32px 48px;
      display: grid;
      grid-template-columns: var(--nav-width) minmax(0, 1fr);
      gap: var(--grid-gap);
    }
    .header {
      grid-column: 1 / -1;
      min-height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 0 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .monogram {
      width: 44px;
      height: 44px;
    }
    .brand-meta small {
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 12px;
    }
    .brand-meta h1 {
      margin: 2px 0 0;
      font-size: 28px;
      line-height: 34px;
      font-weight: 600;
    }
    .hero {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, rgba(51,92,255,0.10), rgba(15,139,141,0.08) 48%, rgba(110,89,217,0.07));
      border: 1px solid rgba(51,92,255,0.14);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 24px;
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      gap: 20px;
    }
    .hero h2 {
      margin: 0 0 8px;
      font-size: 20px;
      line-height: 28px;
      font-weight: 600;
    }
    .hero p {
      margin: 0;
      color: var(--ink-soft);
    }
    .hero-counters {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .counter {
      background: rgba(255,255,255,0.78);
      border: 1px solid rgba(18,24,38,0.08);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .counter strong {
      display: block;
      font-size: 24px;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .counter span {
      color: var(--ink-soft);
      font-size: 13px;
    }
    .sidebar {
      position: sticky;
      top: 16px;
      align-self: start;
      display: grid;
      gap: 16px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .panel h3 {
      margin: 0;
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
    }
    .panel-header {
      padding: 18px 20px 8px;
    }
    .panel-body {
      padding: 0 20px 18px;
    }
    .nav-list, .legend-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .nav-list button {
      width: 100%;
      border: 1px solid var(--border);
      background: #fff;
      border-radius: 12px;
      padding: 12px 14px;
      text-align: left;
      cursor: pointer;
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
    }
    .nav-list button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 18px rgba(18,24,38,0.06);
      border-color: rgba(51,92,255,0.28);
    }
    .nav-list button[aria-current="true"] {
      border-color: rgba(51,92,255,0.4);
      background: rgba(51,92,255,0.05);
    }
    .mini {
      display: block;
      color: var(--ink-soft);
      font-size: 12px;
    }
    .content {
      display: grid;
      gap: 20px;
      min-width: 0;
    }
    .ribbon {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 18px 20px 20px;
    }
    .phase-chip, .scope-chip, .evidence-chip, .risk-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 32px;
      padding: 7px 12px;
      border-radius: var(--chip);
      border: 1px solid var(--border);
      background: #fff;
      font-size: 13px;
      color: var(--ink-soft);
    }
    .phase-chip.deferred,
    .scope-chip.deferred_phase7 {
      border-color: rgba(201,137,0,0.4);
      background: rgba(201,137,0,0.08);
      color: #7A5400;
    }
    .scope-chip.assistive_optional {
      border-color: rgba(110,89,217,0.32);
      background: rgba(110,89,217,0.08);
      color: #503EA6;
    }
    .scope-chip.partner_specific {
      border-color: rgba(15,139,141,0.32);
      background: rgba(15,139,141,0.08);
      color: #0B6668;
    }
    .scope-chip.ongoing_bau {
      border-color: rgba(152,162,179,0.45);
      background: rgba(152,162,179,0.12);
      color: #475467;
    }
    .scope-chip.baseline_required {
      border-color: rgba(15,157,88,0.36);
      background: rgba(15,157,88,0.08);
      color: #0B7C45;
    }
    .toolbar {
      padding: 18px 20px 20px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    .scope-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .scope-buttons button {
      border: 1px solid var(--border);
      background: #fff;
      border-radius: var(--chip);
      padding: 8px 12px;
      cursor: pointer;
    }
    .scope-buttons button[data-active="true"] {
      border-color: rgba(51,92,255,0.4);
      background: rgba(51,92,255,0.06);
      color: var(--cobalt);
    }
    .toolbar input {
      min-width: 240px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: #fff;
    }
    .lane-list {
      display: grid;
      gap: 14px;
      padding: 0 20px 20px;
    }
    .lane {
      border: 1px solid var(--border);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,247,250,0.98));
      overflow: hidden;
    }
    .lane button {
      width: 100%;
      border: 0;
      padding: 18px 18px 16px;
      text-align: left;
      background: transparent;
      cursor: pointer;
    }
    .lane button[aria-pressed="true"] {
      background: rgba(51,92,255,0.05);
    }
    .lane-top {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: flex-start;
    }
    .lane h4 {
      margin: 0;
      font-size: 16px;
      line-height: 24px;
      font-weight: 600;
    }
    .lane p {
      margin: 8px 0 0;
      color: var(--ink-soft);
      font-size: 14px;
    }
    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .layout-two {
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
      gap: 20px;
    }
    .detail-wrap {
      position: sticky;
      top: 16px;
      align-self: start;
    }
    .detail-meta {
      display: grid;
      gap: 12px;
    }
    .detail-meta section {
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
    .detail-meta section:first-of-type {
      border-top: 0;
      padding-top: 0;
    }
    .detail-meta ul {
      margin: 8px 0 0;
      padding-left: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--ink-soft);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    tr:last-child td {
      border-bottom: 0;
    }
    .table-wrap {
      overflow: auto;
      padding: 0 20px 20px;
    }
    .trigger-table button {
      border: 0;
      background: transparent;
      color: inherit;
      width: 100%;
      text-align: left;
      padding: 0;
      cursor: pointer;
    }
    .trigger-table tr[data-selected="true"] {
      background: rgba(51,92,255,0.05);
    }
    .signoff-grid {
      position: relative;
      min-height: 360px;
      margin: 0 20px 20px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,247,250,0.96));
      overflow: hidden;
    }
    .signoff-grid svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .signoff-node {
      position: absolute;
      transform: translate(-50%, -50%);
      min-width: 130px;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.94);
      text-align: center;
      box-shadow: 0 10px 18px rgba(18,24,38,0.05);
      font-size: 13px;
    }
    .signoff-node strong {
      display: block;
      color: var(--ink);
    }
    .signoff-node small {
      color: var(--ink-soft);
      font-size: 11px;
    }
    .legend-list li {
      border-top: 1px solid var(--border);
      padding-top: 10px;
      margin-top: 10px;
    }
    .legend-list li:first-child {
      border-top: 0;
      margin-top: 0;
      padding-top: 0;
    }
    .status {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
    .empty-state {
      padding: 20px;
      color: var(--ink-soft);
    }
    @media (max-width: 1080px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .sidebar,
      .detail-wrap {
        position: static;
      }
      .hero,
      .layout-two {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 720px) {
      .shell {
        padding: 0 16px 36px;
      }
      .header {
        padding-top: 16px;
      }
      .hero-counters {
        grid-template-columns: 1fr 1fr;
      }
      .toolbar input {
        min-width: 100%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      html { scroll-behavior: auto; }
      * {
        transition: none !important;
        animation: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="shell" data-testid="board-shell">
    <header class="header">
      <div class="brand">
        <svg class="monogram" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="16" cy="16" r="6" fill="#335CFF"></circle>
          <circle cx="32" cy="48" r="6" fill="#0F8B8D"></circle>
          <circle cx="48" cy="16" r="6" fill="#6E59D9"></circle>
          <path d="M16 16 L32 48 L48 16" fill="none" stroke="#121826" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        <div class="brand-meta">
          <small>Vecells command board</small>
          <h1>Regulatory and clinical-safety workstreams</h1>
        </div>
      </div>
    </header>

    <section class="hero" data-testid="board-hero">
      <div>
        <h2>Editorial operating model, not a checklist</h2>
        <p id="hero-summary-copy"></p>
      </div>
      <div class="hero-counters" id="hero-counters"></div>
    </section>

    <aside class="sidebar">
      <section class="panel" data-testid="board-nav">
        <div class="panel-header"><h3>Workstream index</h3></div>
        <div class="panel-body">
          <ul class="nav-list" id="nav-list"></ul>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header"><h3>Scope legend</h3></div>
        <div class="panel-body">
          <ul class="legend-list">
            <li><strong>Baseline required</strong><div class="mini">Current programme and release-blocking work.</div></li>
            <li><strong>Ongoing BAU</strong><div class="mini">Continuous governed operations still tied to release and assurance.</div></li>
            <li><strong>Partner specific</strong><div class="mini">Triggered when partner onboarding or approved portals move.</div></li>
            <li><strong>Deferred Phase 7</strong><div class="mini">Explicit but not part of current baseline completeness.</div></li>
            <li><strong>Assistive optional</strong><div class="mini">Conditional until assistive rollout activates.</div></li>
          </ul>
        </div>
      </section>
    </aside>

    <main class="content">
      <section class="panel" data-testid="phase-baseline-ribbon">
        <div class="panel-header"><h3>Programme baseline markers</h3></div>
        <div class="ribbon" id="phase-ribbon"></div>
      </section>

      <section class="panel" data-testid="scope-filters">
        <div class="panel-header"><h3>Swimlanes</h3></div>
        <div class="toolbar">
          <div class="scope-buttons" id="scope-buttons"></div>
          <input id="search-input" data-testid="search-input" type="search" placeholder="Search workstreams, artifacts, triggers, or frameworks">
        </div>
        <div class="layout-two">
          <div>
            <div class="lane-list" id="lane-list" data-testid="lane-list"></div>
            <div class="empty-state" id="lane-empty" hidden>No workstreams match the current scope and search filter.</div>
          </div>
          <div class="detail-wrap">
            <section class="panel" data-testid="detail-panel">
              <div class="panel-header"><h3>Selected workstream</h3></div>
              <div class="panel-body detail-meta" id="detail-panel-body"></div>
            </section>
          </div>
        </div>
      </section>

      <section class="panel" data-testid="evidence-view">
        <div class="panel-header"><h3>Evidence cadence view</h3></div>
        <div class="table-wrap">
          <table aria-label="Evidence schedule">
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Workstream</th>
                <th>Schedule</th>
                <th>Trigger</th>
                <th>Gate</th>
              </tr>
            </thead>
            <tbody id="evidence-body"></tbody>
          </table>
        </div>
      </section>

      <section class="panel" data-testid="signoff-map">
        <div class="panel-header"><h3>Signoff dependency map</h3></div>
        <div class="signoff-grid" id="signoff-grid" aria-label="Signoff dependency map"></div>
        <div class="panel-body">
          <div class="mini">Independent role groups are preserved. Release approval sits at the end of the chain; it does not replace domain approvals.</div>
        </div>
      </section>

      <section class="layout-two">
        <section class="panel" data-testid="trigger-matrix">
          <div class="panel-header"><h3>Trigger matrix explorer</h3></div>
          <div class="table-wrap">
            <table class="trigger-table" aria-label="Change trigger matrix">
              <thead>
                <tr>
                  <th>Change class</th>
                  <th>Scope</th>
                  <th>Hazard</th>
                  <th>Safety</th>
                  <th>DPIA</th>
                  <th>DTAC</th>
                  <th>Freeze</th>
                </tr>
              </thead>
              <tbody id="trigger-body"></tbody>
            </table>
          </div>
        </section>
        <section class="panel" data-testid="hazard-panel">
          <div class="panel-header"><h3>Hazard spotlight</h3></div>
          <div class="panel-body" id="hazard-panel-body"></div>
        </section>
      </section>
    </main>
  </div>

  <div class="status" aria-live="polite" id="announcement"></div>
  <script id="regulatory-data" type="application/json">__EMBEDDED_JSON__</script>
  <script>
    const payload = JSON.parse(document.getElementById('regulatory-data').textContent);
    const workstreams = payload.workstreams;
    const evidenceRows = payload.evidence_artifact_schedule;
    const hazardRows = payload.safety_hazard_register_seed;
    const triggerRows = payload.change_control_trigger_matrix;
    const frameworkRows = payload.framework_catalog;
    const nodeRows = payload.signoff_topology.nodes;
    const edgeRows = payload.signoff_topology.edges;
    const frameworkMap = new Map(frameworkRows.map((row) => [row.framework_code, row]));
    const workstreamMap = new Map(workstreams.map((row) => [row.workstream_id, row]));

    const scopeLabels = {
      all: 'All',
      baseline_required: 'Baseline',
      ongoing_bau: 'Ongoing BAU',
      partner_specific: 'Partner',
      deferred_phase7: 'Deferred P7',
      assistive_optional: 'Assistive',
    };

    const summary = payload.summary;
    const heroCounters = document.getElementById('hero-counters');
    const heroSummaryCopy = document.getElementById('hero-summary-copy');
    const navList = document.getElementById('nav-list');
    const phaseRibbon = document.getElementById('phase-ribbon');
    const scopeButtons = document.getElementById('scope-buttons');
    const searchInput = document.getElementById('search-input');
    const laneList = document.getElementById('lane-list');
    const laneEmpty = document.getElementById('lane-empty');
    const detailPanelBody = document.getElementById('detail-panel-body');
    const evidenceBody = document.getElementById('evidence-body');
    const triggerBody = document.getElementById('trigger-body');
    const hazardPanelBody = document.getElementById('hazard-panel-body');
    const signoffGrid = document.getElementById('signoff-grid');
    const announcement = document.getElementById('announcement');

    const state = {
      scope: 'all',
      search: '',
      selectedWorkstreamId: workstreams[0] ? workstreams[0].workstream_id : null,
      selectedTriggerId: triggerRows[0] ? triggerRows[0].change_trigger_id : null,
    };

    function announce(message) {
      announcement.textContent = '';
      window.requestAnimationFrame(() => {
        announcement.textContent = message;
      });
    }

    function phaseLabel(code) {
      return code
        .replace(/^phase_/, 'Phase ')
        .replace(/_/g, ' ')
        .replace(/\b[a-z]/g, (char) => char.toUpperCase());
    }

    function scopeClass(scope) {
      return scope;
    }

    function renderHero() {
      heroSummaryCopy.textContent = `${summary.workstream_count} workstreams, ${summary.framework_count} framework contexts, ${summary.change_trigger_count} trigger classes, and ${summary.hazard_seed_count} seeded hazards. Deferred NHS App obligations stay visually separate from the current baseline.`;
      heroCounters.innerHTML = '';
      const counters = [
        { label: 'Baseline + BAU', value: (summary.scope_counts.baseline_required || 0) + (summary.scope_counts.ongoing_bau || 0) },
        { label: 'Deferred Phase 7', value: summary.scope_counts.deferred_phase7 || 0 },
        { label: 'Assistive optional', value: summary.scope_counts.assistive_optional || 0 },
        { label: 'Partner specific', value: summary.scope_counts.partner_specific || 0 },
      ];
      counters.forEach((item) => {
        const el = document.createElement('div');
        el.className = 'counter';
        el.innerHTML = `<strong>${item.value}</strong><span>${item.label}</span>`;
        heroCounters.appendChild(el);
      });
    }

    function renderPhaseRibbon() {
      const phases = [
        ['Phase 1', 'baseline'],
        ['Phase 2', 'baseline'],
        ['Phase 3', 'baseline'],
        ['Phase 4', 'baseline'],
        ['Phase 5', 'baseline'],
        ['Phase 6', 'baseline'],
        ['Phase 7 NHS App', 'deferred'],
        ['Phase 8 Assistive', 'baseline'],
        ['Phase 9 Assurance', 'baseline'],
      ];
      phases.forEach(([label, mode]) => {
        const chip = document.createElement('span');
        chip.className = `phase-chip ${mode === 'deferred' ? 'deferred' : ''}`;
        chip.textContent = label;
        phaseRibbon.appendChild(chip);
      });
    }

    function renderScopeButtons() {
      scopeButtons.innerHTML = '';
      Object.entries(scopeLabels).forEach(([key, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.dataset.scope = key;
        button.dataset.active = key === state.scope ? 'true' : 'false';
        button.addEventListener('click', () => {
          state.scope = key;
          renderScopeButtons();
          renderLaneList();
          announce(`Scope filter set to ${label}.`);
        });
        scopeButtons.appendChild(button);
      });
    }

    function renderNav() {
      navList.innerHTML = '';
      workstreams.forEach((row) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-current', row.workstream_id === state.selectedWorkstreamId ? 'true' : 'false');
        button.innerHTML = `<strong>${row.workstream_name}</strong><span class="mini">${scopeLabels[row.baseline_scope] || row.baseline_scope}</span>`;
        button.addEventListener('click', () => selectWorkstream(row.workstream_id, true));
        li.appendChild(button);
        navList.appendChild(li);
      });
    }

    function getFilteredWorkstreams() {
      const query = state.search.trim().toLowerCase();
      return workstreams.filter((row) => {
        const scopeMatch = state.scope === 'all' || row.baseline_scope === state.scope;
        if (!scopeMatch) {
          return false;
        }
        if (!query) {
          return true;
        }
        const frameworkNames = row.framework_or_governance_basis
          .map((code) => frameworkMap.get(code)?.framework_name || code)
          .join(' ');
        const haystack = [
          row.workstream_name,
          row.workstream_family,
          row.why_it_exists,
          row.triggering_changes.join(' '),
          row.required_artifacts.join(' '),
          frameworkNames,
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    function workstreamHash(id) {
      return `#${id.toLowerCase()}`;
    }

    function selectWorkstream(workstreamId, pushHash = false) {
      state.selectedWorkstreamId = workstreamId;
      renderLaneList();
      renderDetailPanel();
      Array.from(navList.querySelectorAll('button')).forEach((button, index) => {
        const row = workstreams[index];
        button.setAttribute('aria-current', row.workstream_id === workstreamId ? 'true' : 'false');
      });
      if (pushHash) {
        history.replaceState(null, '', workstreamHash(workstreamId));
      }
      const row = workstreamMap.get(workstreamId);
      if (row) {
        announce(`Selected ${row.workstream_name}.`);
      }
    }

    function renderLaneList() {
      const filtered = getFilteredWorkstreams();
      laneList.innerHTML = '';
      laneEmpty.hidden = filtered.length !== 0;
      if (!filtered.length) {
        return;
      }
      if (!filtered.some((row) => row.workstream_id === state.selectedWorkstreamId)) {
        state.selectedWorkstreamId = filtered[0].workstream_id;
      }
      filtered.forEach((row) => {
        const lane = document.createElement('article');
        lane.className = 'lane';
        lane.dataset.scope = row.baseline_scope;
        lane.dataset.testid = `lane-${row.workstream_id.toLowerCase()}`;
        lane.setAttribute('data-testid', `lane-${row.workstream_id.toLowerCase()}`);
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', row.workstream_id === state.selectedWorkstreamId ? 'true' : 'false');
        button.addEventListener('click', () => selectWorkstream(row.workstream_id, true));
        const frameworks = row.framework_or_governance_basis.map((code) => frameworkMap.get(code)?.framework_name || code);
        button.innerHTML = `
          <div class="lane-top">
            <div>
              <h4>${row.workstream_name}</h4>
              <p>${row.why_it_exists}</p>
            </div>
            <span class="scope-chip ${scopeClass(row.baseline_scope)}">${scopeLabels[row.baseline_scope] || row.baseline_scope}</span>
          </div>
          <div class="chip-row">
            ${row.affected_phases.map((phase) => `<span class="phase-chip">${phaseLabel(phase)}</span>`).join('')}
          </div>
          <div class="chip-row">
            ${frameworks.slice(0, 4).map((name) => `<span class="evidence-chip">${name}</span>`).join('')}
            ${row.required_artifacts.slice(0, 3).map((name) => `<span class="risk-chip">${name}</span>`).join('')}
          </div>
        `;
        lane.appendChild(button);
        laneList.appendChild(lane);
      });
      renderDetailPanel();
    }

    function renderDetailPanel() {
      const row = workstreamMap.get(state.selectedWorkstreamId);
      if (!row) {
        detailPanelBody.innerHTML = '<p class="mini">No workstream selected.</p>';
        return;
      }
      const frameworks = row.framework_or_governance_basis
        .map((code) => frameworkMap.get(code)?.framework_name || code)
        .join(', ');
      detailPanelBody.innerHTML = `
        <div>
          <span class="scope-chip ${scopeClass(row.baseline_scope)}">${scopeLabels[row.baseline_scope] || row.baseline_scope}</span>
          <h3 style="margin:10px 0 0;font-size:20px;line-height:28px;">${row.workstream_name}</h3>
          <p style="margin:8px 0 0;color:var(--ink-soft);">${row.why_it_exists}</p>
        </div>
        <section>
          <strong>Framework basis</strong>
          <p class="mini">${frameworks}</p>
        </section>
        <section>
          <strong>Triggering changes</strong>
          <ul>${row.triggering_changes.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <strong>Required artifacts</strong>
          <ul>${row.required_artifacts.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <strong>Signoff path</strong>
          <ul>${row.required_reviews_or_signoffs.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <strong>Blocking release conditions</strong>
          <ul>${row.blocking_release_conditions.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
      `;
    }

    function renderEvidence() {
      evidenceRows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${row.artifact_name}</td>
          <td>${workstreamMap.get(row.workstream_id)?.workstream_name || row.workstream_id}</td>
          <td>${row.schedule_class.replace(/_/g, ' ')}</td>
          <td>${row.trigger_class}</td>
          <td>${row.release_or_operational_gate.join(', ')}</td>
        `;
        evidenceBody.appendChild(tr);
      });
    }

    function relatedHazards(triggerId) {
      return hazardRows.filter((row) => row.initiating_change_classes.includes(triggerId));
    }

    function renderHazardPanel() {
      const trigger = triggerRows.find((row) => row.change_trigger_id === state.selectedTriggerId);
      const hazards = relatedHazards(state.selectedTriggerId);
      if (!trigger) {
        hazardPanelBody.innerHTML = '<p class="mini">No trigger selected.</p>';
        return;
      }
      hazardPanelBody.innerHTML = `
        <div class="scope-chip ${scopeClass(trigger.baseline_scope)}">${scopeLabels[trigger.baseline_scope] || trigger.baseline_scope}</div>
        <h3 style="margin:12px 0 8px;font-size:20px;line-height:28px;">${trigger.change_class}</h3>
        <p style="margin:0 0 12px;color:var(--ink-soft);">${trigger.blocking_condition}</p>
        <section>
          <strong>Required signoff classes</strong>
          <ul>${trigger.required_signoff_classes.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <strong>Required rehearsal classes</strong>
          <ul>${trigger.required_rehearsal_classes.map((item) => `<li>${item}</li>`).join('')}</ul>
        </section>
        <section>
          <strong>Hazards in scope</strong>
          <ul>${hazards.map((item) => `<li>${item.hazard_title}</li>`).join('') || '<li>No seeded hazards linked.</li>'}</ul>
        </section>
      `;
    }

    function renderTriggers() {
      triggerRows.forEach((row) => {
        const tr = document.createElement('tr');
        tr.dataset.selected = row.change_trigger_id === state.selectedTriggerId ? 'true' : 'false';
        const flags = [
          row.trigger_hazard_log_update,
          row.trigger_safety_case_delta,
          row.trigger_dpia_rerun,
          row.trigger_dtac_delta,
          row.trigger_release_freeze,
        ];
        tr.innerHTML = `
          <td><button type="button">${row.change_class}</button></td>
          <td>${scopeLabels[row.baseline_scope] || row.baseline_scope}</td>
          <td>${row.trigger_hazard_log_update}</td>
          <td>${row.trigger_safety_case_delta}</td>
          <td>${row.trigger_dpia_rerun}</td>
          <td>${row.trigger_dtac_delta}</td>
          <td>${row.trigger_release_freeze}</td>
        `;
        tr.querySelector('button').addEventListener('click', () => {
          state.selectedTriggerId = row.change_trigger_id;
          Array.from(triggerBody.querySelectorAll('tr')).forEach((el) => {
            el.dataset.selected = el === tr ? 'true' : 'false';
          });
          renderHazardPanel();
          announce(`Trigger selected: ${row.change_class}.`);
        });
        triggerBody.appendChild(tr);
      });
    }

    function renderSignoffMap() {
      const positions = {
        ROLE_RELEASE_MANAGER: [50, 50],
        ROLE_SERVICE_OWNER: [18, 18],
        ROLE_MANUFACTURER_CSO: [50, 16],
        ROLE_DEPLOYMENT_CSO: [82, 18],
        ROLE_DPO: [18, 50],
        ROLE_SECURITY_LEAD: [82, 50],
        ROLE_INTEROPERABILITY_LEAD: [18, 82],
        ROLE_ACCESSIBILITY_CONTENT_LEAD: [50, 84],
        ROLE_PARTNER_ONBOARDING_LEAD: [82, 82],
        ROLE_AI_GOVERNANCE_LEAD: [33, 68],
        ROLE_RECORDS_GOVERNANCE_LEAD: [67, 68],
        ROLE_INCIDENT_MANAGER: [50, 32],
      };
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      edgeRows.forEach((edge) => {
        const from = positions[edge.from_role_code];
        const to = positions[edge.to_role_code];
        if (!from || !to) {
          return;
        }
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from[0]);
        line.setAttribute('y1', from[1]);
        line.setAttribute('x2', to[0]);
        line.setAttribute('y2', to[1]);
        line.setAttribute('stroke', '#D0D5DD');
        line.setAttribute('stroke-width', '0.5');
        svg.appendChild(line);
      });
      signoffGrid.appendChild(svg);
      nodeRows.forEach((row) => {
        const pos = positions[row.role_code];
        if (!pos) {
          return;
        }
        const node = document.createElement('div');
        node.className = 'signoff-node';
        node.style.left = `${pos[0]}%`;
        node.style.top = `${pos[1]}%`;
        node.innerHTML = `<strong>${row.role_name}</strong><small>${row.independence_group}</small>`;
        signoffGrid.appendChild(node);
      });
    }

    function handleHashSelection() {
      const hash = window.location.hash.replace(/^#/, '').toUpperCase();
      if (!hash) {
        return false;
      }
      const matched = workstreams.find((row) => row.workstream_id === hash);
      if (matched) {
        state.selectedWorkstreamId = matched.workstream_id;
        return true;
      }
      return false;
    }

    searchInput.addEventListener('input', (event) => {
      state.search = event.target.value;
      renderLaneList();
      announce(`Search updated. ${getFilteredWorkstreams().length} workstreams visible.`);
    });

    window.addEventListener('hashchange', () => {
      handleHashSelection();
      renderNav();
      renderLaneList();
      renderDetailPanel();
    });

    renderHero();
    renderPhaseRibbon();
    renderScopeButtons();
    handleHashSelection();
    renderNav();
    renderLaneList();
    renderEvidence();
    renderTriggers();
    renderHazardPanel();
    renderSignoffMap();
  </script>
</body>
</html>
"""
        .replace("__EMBEDDED_JSON__", safe_json)
    )


def build_bundle() -> dict[str, Any]:
    upstream = ensure_prerequisites()
    frameworks = build_framework_catalog()
    workstreams = build_workstreams()
    mappings = build_control_mappings()
    evidence_rows = build_evidence_schedule()
    hazards = build_hazards()
    triggers = build_change_triggers()
    nodes = build_signoff_nodes()
    edges = build_signoff_edges()
    payload = build_payload(frameworks, workstreams, mappings, evidence_rows, hazards, triggers, nodes, edges, upstream)
    return {
        "payload": payload,
        "framework_rows": serialize_rows(frameworks),
        "workstream_rows": serialize_rows(workstreams),
        "mapping_rows": serialize_rows(mappings),
        "evidence_rows": serialize_rows(evidence_rows),
        "hazard_rows": serialize_rows(hazards),
        "trigger_rows": serialize_rows(triggers),
        "regulatory_doc": render_regulatory_doc(payload),
        "clinical_safety_doc": render_clinical_safety_doc(payload),
        "framework_doc": render_framework_doc(payload, mappings),
        "evidence_doc": render_evidence_doc(evidence_rows),
        "hazard_doc": render_hazard_doc(hazards, triggers, nodes, edges),
        "board_html": build_html(payload),
    }


def main() -> None:
    bundle = build_bundle()
    write_json(WORKSTREAMS_JSON_PATH, bundle["payload"])
    write_csv(
        FRAMEWORK_MAPPING_CSV_PATH,
        [
            "mapping_id",
            "framework_code",
            "workstream_id",
            "control_code",
            "control_summary",
            "required_evidence_artifacts",
            "source_phase_refs",
            "source_object_refs",
            "release_gates",
            "operational_gates",
            "baseline_scope",
            "mapping_state",
            "source_refs",
            "notes",
        ],
        bundle["mapping_rows"],
    )
    write_csv(
        EVIDENCE_SCHEDULE_CSV_PATH,
        [
            "artifact_schedule_id",
            "artifact_name",
            "artifact_family",
            "workstream_id",
            "trigger_class",
            "schedule_class",
            "cadence",
            "baseline_scope",
            "source_phase_refs",
            "primary_owner_role",
            "independent_signoff_roles",
            "release_or_operational_gate",
            "freshness_expectation",
            "source_refs",
            "notes",
        ],
        bundle["evidence_rows"],
    )
    write_csv(
        HAZARD_REGISTER_CSV_PATH,
        [
            "hazard_id",
            "hazard_title",
            "hazard_family",
            "baseline_scope",
            "description",
            "initiating_change_classes",
            "potential_harms",
            "required_controls",
            "required_evidence",
            "primary_workstream_ids",
            "required_independent_signoff",
            "source_refs",
            "notes",
        ],
        bundle["hazard_rows"],
    )
    write_csv(
        CHANGE_TRIGGER_CSV_PATH,
        [
            "change_trigger_id",
            "change_class",
            "baseline_scope",
            "impacted_workstreams",
            "impacted_frameworks",
            "trigger_hazard_log_update",
            "trigger_safety_case_delta",
            "trigger_dpia_rerun",
            "trigger_dtac_delta",
            "trigger_release_freeze",
            "trigger_partner_rfc_or_scal_update",
            "required_signoff_classes",
            "required_rehearsal_classes",
            "blocking_condition",
            "source_refs",
            "notes",
        ],
        bundle["trigger_rows"],
    )
    write_text(REGULATORY_DOC_PATH, bundle["regulatory_doc"])
    write_text(CLINICAL_SAFETY_DOC_PATH, bundle["clinical_safety_doc"])
    write_text(FRAMEWORK_DOC_PATH, bundle["framework_doc"])
    write_text(EVIDENCE_DOC_PATH, bundle["evidence_doc"])
    write_text(HAZARD_DOC_PATH, bundle["hazard_doc"])
    write_text(BOARD_HTML_PATH, bundle["board_html"])
    print(
        f"Built seq_009 regulatory workstream bundle with "
        f"{bundle['payload']['summary']['workstream_count']} workstreams, "
        f"{bundle['payload']['summary']['framework_count']} frameworks, and "
        f"{bundle['payload']['summary']['change_trigger_count']} change triggers."
    )


if __name__ == "__main__":
    main()
