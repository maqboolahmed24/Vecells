#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import textwrap
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
PROMPT_DIR = ROOT / "prompt"

AUDIENCE_SURFACE_PATH = DATA_DIR / "audience_surface_inventory.csv"
ROUTE_FAMILY_PATH = DATA_DIR / "route_family_inventory.csv"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
STATE_MACHINES_PATH = DATA_DIR / "state_machines.json"
EXTERNAL_DEPENDENCIES_PATH = DATA_DIR / "external_dependencies.json"
REGULATORY_WORKSTREAMS_PATH = DATA_DIR / "regulatory_workstreams.json"
REQUIREMENT_REGISTRY_PATH = DATA_DIR / "requirement_registry.jsonl"
CHECKLIST_PATH = PROMPT_DIR / "checklist.md"

CLASSIFICATION_MATRIX_PATH = DATA_DIR / "data_classification_matrix.csv"
FIELD_SENSITIVITY_PATH = DATA_DIR / "field_sensitivity_catalog.json"
REDACTION_POLICY_PATH = DATA_DIR / "redaction_policy_matrix.csv"
AUDIT_DISCLOSURE_PATH = DATA_DIR / "audit_event_disclosure_matrix.csv"
BREAK_GLASS_PATH = DATA_DIR / "break_glass_scope_rules.json"
ARTIFACT_SENSITIVITY_PATH = DATA_DIR / "artifact_sensitivity_matrix.csv"

CLASSIFICATION_DOC_PATH = DOCS_DIR / "10_data_classification_model.md"
MASKING_DOC_PATH = DOCS_DIR / "10_phi_masking_and_redaction_policy.md"
AUDIT_DOC_PATH = DOCS_DIR / "10_audit_posture_and_event_disclosure.md"
BREAK_GLASS_DOC_PATH = DOCS_DIR / "10_break_glass_and_investigation_scope_rules.md"
RETENTION_DOC_PATH = DOCS_DIR / "10_retention_and_artifact_sensitivity_matrix.md"
ATLAS_HTML_PATH = DOCS_DIR / "10_data_classification_atlas.html"

MISSION = (
    "Define the canonical Vecells data-classification, PHI masking, audit disclosure, "
    "break-glass, replay, export, and retention-sensitive artifact model so later "
    "engineering work inherits one explicit disclosure contract."
)

SOURCE_PRECEDENCE = [
    "phase-0-the-foundation-protocol.md",
    "patient-account-and-communications-blueprint.md",
    "staff-operations-and-support-blueprint.md",
    "platform-frontend-blueprint.md",
    "phase-2-identity-and-echoes.md",
    "phase-7-inside-the-nhs-app.md",
    "phase-9-the-assurance-ledger.md",
    "accessibility-and-content-system-contract.md",
    "platform-runtime-and-release-blueprint.md",
    "forensic-audit-findings.md",
]

ATLAS_MARKERS = [
    'data-testid="atlas-shell"',
    'data-testid="atlas-nav"',
    'data-testid="atlas-hero"',
    'data-testid="search-input"',
    'data-testid="audience-filter"',
    'data-testid="purpose-filter"',
    'data-testid="sensitivity-filter"',
    'data-testid="matrix-table"',
    'data-testid="field-inspector"',
    'data-testid="artifact-panel"',
    'data-testid="audit-panel"',
    'data-testid="disclosure-ladder"',
    'data-testid="synthetic-preview"',
]

ALLOWED_SENSITIVITY_CLASSES = {
    "public_safe",
    "operational_internal_non_phi",
    "patient_identifying",
    "contact_sensitive",
    "clinical_sensitive",
    "identity_proof_sensitive",
    "security_or_secret_sensitive",
    "audit_investigation_restricted",
    "retention_governance_restricted",
}

ALLOWED_PHI_FLAGS = {"yes", "no", "contextual"}

ALLOWED_PREVIEW_CEILINGS = {
    "none",
    "awareness_only",
    "summary_only",
    "masked_summary",
    "governed_preview",
    "not_applicable",
}

ALLOWED_DETAIL_CEILINGS = {
    "none",
    "summary_only",
    "bounded_detail",
    "full_detail",
    "recovery_only",
    "not_applicable",
}

ALLOWED_ARTIFACT_CEILINGS = {
    "not_applicable",
    "awareness_only",
    "summary_only",
    "governed_inline",
    "governed_download",
    "governed_handoff",
    "governed_inline_masked",
    "governed_inline_no_download",
}

ALLOWED_TELEMETRY_CEILINGS = {
    "none",
    "not_applicable",
    "descriptor_only",
    "descriptor_and_hash_only",
    "masked_scope_and_refs_only",
    "audit_reference_only",
}

ALLOWED_LOG_CEILINGS = {
    "none",
    "diagnostic_refs_only",
    "masked_scope_and_refs_only",
    "audit_reference_only",
}

ALLOWED_AUDIT_REPLAY_CEILINGS = {
    "none",
    "masked_timeline",
    "bounded_detail_with_scope",
    "full_evidence_with_scope",
    "not_applicable",
}

ALLOWED_BREAK_GLASS_BEHAVIORS = {
    "forbidden",
    "summary_only_with_scope_envelope",
    "pivot_to_governance_investigation",
    "bounded_detail_with_scope_envelope",
    "not_applicable",
}

ALLOWED_MATERIALIZATION_RULES = {"allowlisted_only"}
ALLOWED_POST_DELIVERY_WIDENING = {"forbidden"}

ALLOWED_WRONG_PATIENT_RULES = {
    "not_applicable",
    "suppress_and_demote_cached_phi",
    "hold_detail_and_keep_summary",
    "mask_timeline_and_revalidate_before_restore",
}


@dataclass(frozen=True)
class SensitivityClassSpec:
    sensitivity_class: str
    display_name: str
    phi_profile: str
    default_projection_posture: str
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class RetentionClassSpec:
    retention_class_ref: str
    display_name: str
    disposition_posture: str
    export_posture: str
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class RedactionPolicySpec:
    redaction_policy_ref: str
    family_name: str
    applies_to: tuple[str, ...]
    materialization_rule: str
    post_delivery_widening: str
    preview_rule: str
    detail_rule: str
    artifact_rule: str
    telemetry_rule: str
    log_rule: str
    replay_export_rule: str
    wrong_patient_rule: str
    embedded_channel_rule: str
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class SurfacePolicySpec:
    surface_id: str
    canonical_object_name: str
    sensitivity_class: str
    contains_phi: str
    preview_ceiling: str
    detail_ceiling: str
    artifact_ceiling: str
    telemetry_ceiling: str
    log_ceiling: str
    audit_replay_ceiling: str
    redaction_policy_ref: str
    break_glass_behavior: str
    wrong_patient_hold_behavior: str
    materialization_rule: str
    post_delivery_widening: str
    field_refs: tuple[str, ...]
    artifact_refs: tuple[str, ...]
    audit_refs: tuple[str, ...]
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class FieldSensitivitySpec:
    field_or_artifact_id: str
    canonical_object_name: str
    field_name_or_artifact_class: str
    sensitivity_class: str
    contains_phi: str
    allowed_audience_tiers: tuple[str, ...]
    allowed_purposes_of_use: tuple[str, ...]
    preview_ceiling: str
    detail_ceiling: str
    artifact_ceiling: str
    telemetry_ceiling: str
    log_ceiling: str
    audit_replay_ceiling: str
    redaction_policy_ref: str
    break_glass_behavior: str
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class ArtifactSensitivitySpec:
    field_or_artifact_id: str
    canonical_object_name: str
    field_name_or_artifact_class: str
    sensitivity_class: str
    contains_phi: str
    allowed_audience_tiers: tuple[str, ...]
    allowed_purposes_of_use: tuple[str, ...]
    preview_ceiling: str
    detail_ceiling: str
    artifact_ceiling: str
    telemetry_ceiling: str
    log_ceiling: str
    audit_replay_ceiling: str
    redaction_policy_ref: str
    break_glass_behavior: str
    retention_class_ref_if_artifact: str
    transfer_modes: tuple[str, ...]
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class AuditDisclosureSpec:
    field_or_artifact_id: str
    canonical_object_name: str
    field_name_or_artifact_class: str
    sensitivity_class: str
    contains_phi: str
    allowed_audience_tiers: tuple[str, ...]
    allowed_purposes_of_use: tuple[str, ...]
    preview_ceiling: str
    detail_ceiling: str
    artifact_ceiling: str
    telemetry_ceiling: str
    log_ceiling: str
    audit_replay_ceiling: str
    redaction_policy_ref: str
    break_glass_behavior: str
    allowed_identifiers: tuple[str, ...]
    prohibited_identifiers: tuple[str, ...]
    notes: str
    source_refs: tuple[str, ...]


@dataclass(frozen=True)
class BreakGlassRuleSpec:
    rule_id: str
    title: str
    distinct_purpose_of_use: str
    allowed_audience_tiers: tuple[str, ...]
    masking_ceiling_rule: str
    selected_anchor_rule: str
    mutation_rule: str
    expiry_rule: str
    restore_rule: str
    export_rule: str
    notes: str
    source_refs: tuple[str, ...]


SENSITIVITY_CLASSES = [
    SensitivityClassSpec(
        sensitivity_class="public_safe",
        display_name="Public-safe",
        phi_profile="no",
        default_projection_posture="Awareness-only and neutral recovery-safe copy.",
        notes="Used for non-identifying placeholders, route guidance, public receipts, and summary-first entry surfaces.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="operational_internal_non_phi",
        display_name="Operational internal non-PHI",
        phi_profile="no",
        default_projection_posture="Operational refs, hashes, trust states, and posture flags without subject payloads.",
        notes="Allows route, trust, freshness, and parity diagnostics without subject disclosure.",
        source_refs=(
            "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
            "platform-frontend-blueprint.md#UIEventVisibilityProfile",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="patient_identifying",
        display_name="Patient identifying",
        phi_profile="yes",
        default_projection_posture="Summary-first with strict audience and purpose binding.",
        notes="Includes patient identity anchors and subject references that are PHI-bearing even without clinical body detail.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="contact_sensitive",
        display_name="Contact sensitive",
        phi_profile="yes",
        default_projection_posture="Masked summaries, never raw in telemetry or ordinary logs.",
        notes="Covers phone, email, secure-link contact context, and delivery-repair detail.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "patient-account-and-communications-blueprint.md",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="clinical_sensitive",
        display_name="Clinical sensitive",
        phi_profile="yes",
        default_projection_posture="Governed preview, bounded detail, or summary-only placeholder depending audience.",
        notes="Covers request narratives, thread bodies, health-record detail, appointment meaning, and pharmacy or booking clinical context.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17A SectionVisibilityContract",
            "patient-account-and-communications-blueprint.md#Request detail contract",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="identity_proof_sensitive",
        display_name="Identity proof sensitive",
        phi_profile="yes",
        default_projection_posture="Never browser-hydrated as ordinary route detail; references and masked fragments only.",
        notes="Raw claims, telephony identifiers, consent artifacts, and proof provenance stay outside hot operational tables.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated `patientRef` as unconditional",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="security_or_secret_sensitive",
        display_name="Security or secret sensitive",
        phi_profile="no",
        default_projection_posture="Never exposed outside short-lived governed control surfaces.",
        notes="Opaque tokens, raw JWT handoff content, secrets, and destination grants are excluded from telemetry and standard logs.",
        source_refs=(
            "phase-7-inside-the-nhs-app.md",
            "phase-2-the-identity-and-echoes.md",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="audit_investigation_restricted",
        display_name="Audit and investigation restricted",
        phi_profile="contextual",
        default_projection_posture="Masked replay or bounded-detail only under InvestigationScopeEnvelope.",
        notes="Replay, break-glass, causality, and export controls bind to a selected anchor and diagnostic question.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
        ),
    ),
    SensitivityClassSpec(
        sensitivity_class="retention_governance_restricted",
        display_name="Retention governance restricted",
        phi_profile="contextual",
        default_projection_posture="Governance-only summaries or witness detail, never ordinary patient download content.",
        notes="Deletion certificates, archive manifests, and preservation-chain evidence are not ordinary documents.",
        source_refs=(
            "phase-9-the-assurance-ledger.md",
            "forensic-audit-findings.md#Finding 46 - Assurance was shown as passive reporting rather than a control plane",
        ),
    ),
]


RETENTION_CLASSES = [
    RetentionClassSpec(
        retention_class_ref="RET_PRE_SUBMIT_TRANSIENT",
        display_name="Pre-submit transient capture",
        disposition_posture="Narrower retention than submitted clinical work unless policy upgrade proves clinical materiality.",
        export_posture="Summary-first; never ordinary byte download.",
        notes="Used for incomplete drafts and pre-promotion evidence.",
        source_refs=("phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",),
    ),
    RetentionClassSpec(
        retention_class_ref="RET_CLINICAL_CASE_ARTIFACT",
        display_name="Clinical case artifact",
        disposition_posture="Governed clinical retention; deletion blocked by holds, replay-critical evidence, or active assurance graph dependency.",
        export_posture="Artifact contract, parity, and grant governed.",
        notes="Used for patient-visible records, letters, results, and governed appointment or message artifacts.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
        ),
    ),
    RetentionClassSpec(
        retention_class_ref="RET_SUPPORT_INVESTIGATION_EVIDENCE",
        display_name="Support and investigation evidence",
        disposition_posture="Preservation-first; deletion blocked while the current investigation or replay scope depends on the evidence set.",
        export_posture="Masked replay or scope-bound export only.",
        notes="Used for replay evidence bundles, checkpointed masked views, and investigation artifacts.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
        ),
    ),
    RetentionClassSpec(
        retention_class_ref="RET_WORM_AUDIT_GOVERNANCE",
        display_name="WORM audit governance",
        disposition_posture="Append-only and export-governed; ordinary delete paths forbidden.",
        export_posture="Investigation envelope or governance pack only.",
        notes="Used for immutable audit, assurance-ledger, and continuity evidence references.",
        source_refs=("phase-9-the-assurance-ledger.md#Phase 9 objective",),
    ),
    RetentionClassSpec(
        retention_class_ref="RET_RETENTION_GOVERNANCE_WITNESS",
        display_name="Retention governance witness",
        disposition_posture="Retention and legal-hold control artifacts stay in governance scope even when underlying PHI is deleted or archived.",
        export_posture="Governance summary or bounded evidence pack only.",
        notes="Used for deletion certificates and archive manifests.",
        source_refs=("phase-9-the-assurance-ledger.md#Overall Phase 9 algorithm",),
    ),
    RetentionClassSpec(
        retention_class_ref="RET_ASSURANCE_PACK_ARCHIVE",
        display_name="Assurance pack archive",
        disposition_posture="Governance archive with completeness-verdict dependency checks before disposition.",
        export_posture="Governed pack or regulator-ready export only.",
        notes="Used for assurance packs and related completeness or parity witnesses.",
        source_refs=("phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",),
    ),
]


REDACTION_POLICIES = [
    RedactionPolicySpec(
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        family_name="Public-safe placeholder and recovery policy",
        applies_to=("patient_public", "public_status", "secure_link_recovery"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Previews expose only neutral labels, status buckets, governed placeholders, and recovery-safe next steps.",
        detail_rule="Detail payloads are summary-only or omitted until a higher-trust row is re-materialized.",
        artifact_rule="Artifacts are awareness-only or summary-only; no raw body or browser handoff by default.",
        telemetry_rule="Emit route family, shell state, summary safety tier, and placeholder reason only.",
        log_rule="Logs keep refs, hashes, and reason codes only.",
        replay_export_rule="Replay and export stay masked or blocked outside investigation scope.",
        wrong_patient_rule="Suppress cached PHI and demote the shell to placeholder or recovery-only posture.",
        embedded_channel_rule="When embedded, stay summary-first and preserve no-store posture.",
        notes="Closes the gaps that treated UI collapse or route-local trimming as privacy controls.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "forensic-audit-findings.md#Finding 88 - The audit omitted governed placeholder rules for partial visibility",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_GRANT_RECOVERY_BOUNDARY",
        family_name="Grant-scoped recovery boundary policy",
        applies_to=("patient_grant_scoped", "secure_link_recovery"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Recovery routes may show only the selected lineage summary, current blockage, and next safe step.",
        detail_rule="No thread body, record body, or artifact body until the active grant and route intent re-prove scope.",
        artifact_rule="Artifacts stay summary-only or placeholder-only until route checks and step-up complete.",
        telemetry_rule="Use masked grant family, route family, fence state, and recovery reason only.",
        log_rule="Use grant refs, hash refs, and redemption state only.",
        replay_export_rule="Support replay or export cannot widen beyond the active grant-scoped selected anchor.",
        wrong_patient_rule="If subject drift or wrong-patient suspicion appears, drop to recovery-only and invalidate cached seeded detail.",
        embedded_channel_rule="Embedded recovery may request safe browser handoff but never widen in place.",
        notes="Binds secure-link recovery to recovery redaction fences and current grant scope.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-2-the-identity-and-echoes.md",
            "platform-frontend-blueprint.md#RecoveryRedactionFence",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        family_name="Authenticated patient summary and detail policy",
        applies_to=("patient_authenticated", "authenticated_self_service"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="List rows, home cards, and message snippets stay preview-bound and may not inherit destination detail payloads.",
        detail_rule="Detail routes may show bounded or full detail only from the policy-compiled row for the active audience and purpose.",
        artifact_rule="Artifacts remain separate from preview and detail and may degrade to summary, inline, or governed handoff independently.",
        telemetry_rule="Emit class codes, route families, hash refs, and settled posture only.",
        log_rule="Logs keep refs, parity digests, and placeholder or fence reason codes only.",
        replay_export_rule="Patient-facing replay is never ordinary route detail; investigation and export use distinct governed rows.",
        wrong_patient_rule="Wrong-patient hold suppresses cached PHI replay and preserves only summary-safe breadcrumbs.",
        embedded_channel_rule="When rendered inside embedded mode, recalculate against embedded-authenticated coverage before widening any CTA or artifact mode.",
        notes="Closes the preview/detail shared-payload gap for authenticated patient surfaces.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17B PreviewVisibilityContract",
            "patient-account-and-communications-blueprint.md#Requests browsing contract",
            "forensic-audit-findings.md#Finding 97 - The audit still let patient-home actionability float above authoritative settlement",
            "forensic-audit-findings.md#Finding 99 - Conversation state could still collapse local acknowledgement into final reassurance",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_PATIENT_ARTIFACT_GOVERNED",
        family_name="Patient artifact presentation policy",
        applies_to=("patient_authenticated", "authenticated_self_service", "artifact"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Artifact rows disclose only title class, freshness, and parity-safe summary until the mode-specific contract allows more.",
        detail_rule="Record or appointment detail stays subordinate to artifact parity, visibility, and source-authority state.",
        artifact_rule="Structured summary is the default; inline preview, download, print, and handoff each require separate contract proof.",
        telemetry_rule="Telemetry records artifact mode, parity state, transfer outcome class, and disclosure class only.",
        log_rule="Logs keep artifact refs, grant refs, hashes, and fallback reasons only.",
        replay_export_rule="Investigation and export use the same parity and redaction transforms as the active evidence graph.",
        wrong_patient_rule="Identity hold demotes artifacts to summary or placeholder; no stale body replay.",
        embedded_channel_rule="Embedded channels may degrade to summary, secure-send-later, or bounded handoff rather than raw download.",
        notes="Separates artifact posture from preview and detail posture.",
        source_refs=(
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
            "patient-account-and-communications-blueprint.md#Request detail contract",
            "forensic-audit-findings.md#Finding 101 - Same-shell confirmation still understated settlement, return, and continuation posture",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_EMBEDDED_ARTIFACT_CHANNEL",
        family_name="Embedded channel artifact and URL scrub policy",
        applies_to=("patient_embedded_authenticated", "embedded_authenticated"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Embedded previews remain summary-first and must survive narrow-host capability loss.",
        detail_rule="Embedded detail may not hydrate unsupported or stale body content just because standalone mode could show it.",
        artifact_rule="No raw PHI-bearing URLs, no conventional download dependence, and no print-first flow; use governed inline, summary, or scrubbed handoff.",
        telemetry_rule="Bridge and embedded telemetry stay PHI-safe and route-contract-bound.",
        log_rule="No asserted identity payloads, raw JWT handoff values, or host-only secrets in logs.",
        replay_export_rule="Embedded replay and export pivot to investigation scope or safe browser handoff, not widened inline scope.",
        wrong_patient_rule="Wrong-patient or session drift invalidates embedded cache and forces placeholder or recovery-only posture.",
        embedded_channel_rule="Immediate URL scrubbing, no-store, no-referrer, and destination allowlists are mandatory.",
        notes="Closes the gaps around embedded PHI-bearing URLs, download assumptions, and stale cached artifact exposure.",
        source_refs=(
            "phase-7-inside-the-nhs-app.md",
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
            "forensic-audit-findings.md#Finding 90 - The audit still omitted the hardened NHS App embedded-channel control plane",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        family_name="Operational workspace minimum-necessary policy",
        applies_to=("origin_practice_clinical", "origin_practice_operations", "hub_desk", "servicing_site", "assistive_adjunct"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Queue rows and chips show only the minimum clinically or operationally necessary context for the current task.",
        detail_rule="Workspace detail remains bounded by assigned task scope, audience coverage, and acting context; unrelated identity proof and secrets remain excluded.",
        artifact_rule="Artifacts may show inline or handoff posture only when the governing artifact contract allows the same audience and task scope.",
        telemetry_rule="Workspace telemetry uses task refs, lineage refs, stage classes, and trust or freeze posture only.",
        log_rule="Logs keep refs, hashes, and command or lease state only.",
        replay_export_rule="Workspace replay or export pivots to support or governance envelopes rather than widening ordinary task payloads.",
        wrong_patient_rule="If wrong-patient or repair freeze becomes active, keep summary provenance but suppress writable or body detail.",
        embedded_channel_rule="Assistive sidecars inherit owning-shell scope and never widen beyond it.",
        notes="Keeps workspace, hub, and pharmacy detail separate from support or governance investigation detail.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17C MinimumNecessaryContract",
            "staff-operations-and-support-blueprint.md",
            "forensic-audit-findings.md#Finding 47 - Cross-organisation and support visibility boundaries were under-specified",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        family_name="Support masked replay and restore policy",
        applies_to=("support", "support_recovery"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Support timeline previews keep chronology and actor class but mask body content and held-draft detail.",
        detail_rule="Observe and replay views stay masked and selected-anchor-bound until restore settlement re-proves live scope.",
        artifact_rule="Support presentation artifacts remain summary-first or masked-inline; export and external handoff are separately governed.",
        telemetry_rule="Support telemetry records checkpoint hash, mask scope class, restore posture, and route-intent validity only.",
        log_rule="Logs keep checkpoint refs, scope refs, settlement refs, and mask classes only.",
        replay_export_rule="Replay, diff, and export must share the same InvestigationScopeEnvelope, timeline, and masking ceiling.",
        wrong_patient_rule="Any identity-repair signal or scope drift keeps the replay shell read-only and invalidates cached body detail.",
        embedded_channel_rule="Not applicable for support surfaces; ordinary support is never an embedded patient artifact channel.",
        notes="Closes the support replay drift and restore-gate gaps.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
            "forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_OPS_AGGREGATE_DISCLOSURE",
        family_name="Operations aggregate and drilldown disclosure policy",
        applies_to=("operations_control", "operational_control"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Boards default to aggregated, slice-bound, or masked diagnostic cues rather than subject payloads.",
        detail_rule="Drilldown may show bounded-detail only when the route purpose and acting context remain exact.",
        artifact_rule="Exports and readiness artifacts are governance artifacts with their own artifact contracts.",
        telemetry_rule="Use counts, slice ids, queue ids, trust states, and severity bands only.",
        log_rule="Use incident refs, slice refs, and evidence hashes only.",
        replay_export_rule="Operator replay or export still binds InvestigationScopeEnvelope when subject detail appears.",
        wrong_patient_rule="Identity-repair and subject-scope drift demote subject-bearing drilldown to masked or blocked posture.",
        embedded_channel_rule="Not applicable.",
        notes="Operations boards stay diagnostically rich without treating internal telemetry as free PHI.",
        source_refs=(
            "phase-9-the-assurance-ledger.md",
            "forensic-audit-findings.md#Finding 96 - The audit still under-specified operations-console trust and guardrail posture",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        family_name="PHI-safe telemetry policy",
        applies_to=("telemetry", "ui_event", "browser", "embedded", "ops"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Not applicable.",
        detail_rule="Not applicable.",
        artifact_rule="Not applicable.",
        telemetry_rule="Only hashes, ids, route family codes, anchor change classes, disclosure classes, and causal tokens are allowed.",
        log_rule="Raw claims, phone numbers, JWTs, secrets, message bodies, and artifact payloads are forbidden.",
        replay_export_rule="Telemetry traces may participate in replay only through masked or hash-bound evidence chains.",
        wrong_patient_rule="Wrong-patient hold converts telemetry to repair-safe reason classes only.",
        embedded_channel_rule="Embedded telemetry must scrub asserted identity and destination hints immediately.",
        notes="Makes telemetry redaction a platform rule rather than a component convention.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "platform-frontend-blueprint.md#UIEventVisibilityProfile",
            "platform-frontend-blueprint.md#UITelemetryDisclosureFence",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_LOG_REFERENCE_ONLY",
        family_name="Reference-only structured logging policy",
        applies_to=("logs", "runtime", "workers"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Not applicable.",
        detail_rule="Not applicable.",
        artifact_rule="Not applicable.",
        telemetry_rule="Not applicable.",
        log_rule="Structured logs are limited to refs, hashes, posture, and error classes; payload fragments and raw identifiers are forbidden.",
        replay_export_rule="Exports use audit or assurance artifacts, not raw application logs.",
        wrong_patient_rule="Hold, freeze, and repair classes replace any subject-linked content in logs.",
        embedded_channel_rule="Embedded handoff values and host hints stay out of logs.",
        notes="Separates diagnostic logging from audit or export evidence.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        family_name="Investigation scope envelope policy",
        applies_to=("governance_review", "investigation_break_glass", "audit_export"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Investigation summaries remain selected-anchor-bound and mask-scope-bound.",
        detail_rule="Bounded detail requires one current InvestigationScopeEnvelope, selected anchor, diagnostic question, and active purpose-of-use row.",
        artifact_rule="Export and replay artifacts remain separately governed and may still redact underlying body detail.",
        telemetry_rule="Telemetry records envelope ids, scope member classes, and restore posture only.",
        log_rule="Logs record envelope refs, reason codes, and export state only.",
        replay_export_rule="Replay, diff, break-glass, and export must share one current InvestigationScopeEnvelope and timeline reconstruction.",
        wrong_patient_rule="Wrong-patient evidence bundles block calm detail and require the active repair envelope to remain in scope.",
        embedded_channel_rule="Not applicable.",
        notes="Makes break-glass a governed purpose row instead of a role flag or local toggle.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "forensic-audit-findings.md#Finding 103 - Governance compliance review still omitted continuity-evidence bundles",
        ),
    ),
    RedactionPolicySpec(
        redaction_policy_ref="POL_RETENTION_GOVERNED_EXPORT",
        family_name="Retention governance witness policy",
        applies_to=("retention", "deletion", "archive", "assurance_pack"),
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        preview_rule="Governance witnesses show status, artifact set hashes, hold state, and authoritative outcome class only.",
        detail_rule="Detail remains governance-bound and excludes underlying PHI body unless separately authorized through investigation scope.",
        artifact_rule="Deletion certificates, archive manifests, and assurance packs are not patient-downloadable ordinary documents.",
        telemetry_rule="Emit artifact family, disposition state, and graph hash only.",
        log_rule="Logs keep witness ids, graph refs, and hold or disposition reasons only.",
        replay_export_rule="Exports require graph completeness, legal-hold checks, and the correct witness posture.",
        wrong_patient_rule="Underlying wrong-patient evidence remains linked, but witness artifacts expose only control-safe summaries outside investigation scope.",
        embedded_channel_rule="Not applicable.",
        notes="Classifies deletion and archive witnesses separately from ordinary record artifacts.",
        source_refs=(
            "phase-9-the-assurance-ledger.md",
            "forensic-audit-findings.md#Finding 46 - Assurance was shown as passive reporting rather than a control plane",
        ),
    ),
]


SURFACE_POLICIES = [
    SurfacePolicySpec(
        surface_id="surf_patient_intake_web",
        canonical_object_name="SubmissionEnvelope",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="masked_summary",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="suppress_and_demote_cached_phi",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_SUBMISSION_RAW_DRAFT_FRAGMENT",
            "FLD_SUBMISSION_ATTACHMENT_SET",
            "FLD_RECOVERY_FENCE_MAX_VISIBLE_FIELDS",
        ),
        artifact_refs=("ART_UPLOAD_ATTACHMENT", "ART_EVIDENCE_SNAPSHOT"),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_STRUCTURED_LOG_RUNTIME"),
        notes="Anonymous intake remains public-safe until governed promotion or later identity uplift proves a richer row.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_intake_phone",
        canonical_object_name="SubmissionEnvelope",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="masked_summary",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="suppress_and_demote_cached_phi",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_SUBMISSION_RAW_DRAFT_FRAGMENT",
            "FLD_CALLSESSION_CONTACT_ROUTE",
            "FLD_RECOVERY_FENCE_MAX_VISIBLE_FIELDS",
        ),
        artifact_refs=("ART_TELEPHONY_TRANSCRIPT", "ART_EVIDENCE_SNAPSHOT"),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_CANONICAL_EVENT_BUS"),
        notes="Telephony capture is still public-status until continuation or verified uplift re-materializes the payload.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_secure_link_recovery",
        canonical_object_name="PatientActionRecoveryProjection",
        sensitivity_class="patient_identifying",
        contains_phi="contextual",
        preview_ceiling="masked_summary",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_GRANT_RECOVERY_BOUNDARY",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="suppress_and_demote_cached_phi",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_ACCESSGRANT_TOKEN_HASH",
            "FLD_IDENTITY_REPAIR_FREEZE_REASON",
            "FLD_RECOVERY_FENCE_MAX_VISIBLE_FIELDS",
        ),
        artifact_refs=("ART_EVIDENCE_SNAPSHOT",),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Grant-scoped recovery is distinct from patient_public and patient_authenticated and remains scope-bound until revalidation.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "phase-2-the-identity-and-echoes.md",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_home",
        canonical_object_name="PatientPortalEntryProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_REQUEST_PATIENT_REF",
            "FLD_PATIENTAUDIENCECOVERAGE_PREVIEW_MODE",
            "FLD_PATIENTSUMMARY_STATUS_COPY",
        ),
        artifact_refs=("ART_SUMMARY_PARITY_WITNESS",),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Home cards, quiet-home states, and promoted previews stay preview-bound and may not over-reveal the destination route.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Patient home contract",
            "forensic-audit-findings.md#Finding 97 - The audit still let patient-home actionability float above authoritative settlement",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_requests",
        canonical_object_name="PatientRequestSummaryProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_REQUEST_PATIENT_REF",
            "FLD_PATIENTSUMMARY_STATUS_COPY",
            "FLD_PATIENTDETAIL_PLACEHOLDER_SET",
        ),
        artifact_refs=("ART_SUMMARY_PARITY_WITNESS", "ART_RECORD_ARTIFACT"),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Rows, detail, and downstream chips all bind to one lineage-safe summary grammar instead of sharing a broad payload.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Requests browsing contract",
            "patient-account-and-communications-blueprint.md#Request detail contract",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_appointments",
        canonical_object_name="PatientAppointmentWorkspaceProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_ARTIFACT_GOVERNED",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_PATIENTSUMMARY_STATUS_COPY",
            "FLD_PATIENTDETAIL_PLACEHOLDER_SET",
        ),
        artifact_refs=("ART_RECORD_ARTIFACT", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Appointment manage, reminder, and artifact posture remain subordinate to confirmation truth and artifact contracts.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Request detail contract",
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_health_record",
        canonical_object_name="PatientRecordArtifactProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_download",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_ARTIFACT_GOVERNED",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_RECORD_ARTIFACT_SUMMARY_REF",
            "FLD_EVIDENCE_ARTIFACT_REDACTION_HASH",
            "FLD_OUTBOUND_NAV_DESTINATION_REF",
        ),
        artifact_refs=("ART_RECORD_ARTIFACT", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_ARTIFACT_HANDOFF_AUDIT"),
        notes="Health-record routes distinguish summary, inline preview, download, and handoff rather than assuming one shared body payload.",
        source_refs=(
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
            "patient-account-and-communications-blueprint.md",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_messages",
        canonical_object_name="ConversationThreadProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_CONVERSATION_LAST_SNIPPET",
            "FLD_PATIENT_COMMUNICATION_PREVIEW_LINE",
        ),
        artifact_refs=("ART_RECORD_ARTIFACT",),
        audit_refs=("EV_UI_TELEMETRY_PATIENT", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Thread snippets, message bodies, and acknowledgement states remain preview-safe and body-safe under separate contracts.",
        source_refs=(
            "patient-account-and-communications-blueprint.md",
            "forensic-audit-findings.md#Finding 99 - Conversation state could still collapse local acknowledgement into final reassurance",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_patient_embedded_shell",
        canonical_object_name="PatientEmbeddedSessionProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline_no_download",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_EMBEDDED_ARTIFACT_CHANNEL",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_PATIENT_EMBEDDED_ENTRY_ASSERTION",
            "FLD_OUTBOUND_NAV_DESTINATION_REF",
            "FLD_RECORD_ARTIFACT_SUMMARY_REF",
        ),
        artifact_refs=("ART_RECORD_ARTIFACT", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_UI_TELEMETRY_EMBEDDED", "EV_ARTIFACT_HANDOFF_AUDIT"),
        notes="Embedded mode narrows artifact and URL posture even when the underlying authenticated patient route remains the same lineage.",
        source_refs=(
            "phase-7-inside-the-nhs-app.md",
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_clinician_workspace",
        canonical_object_name="TaskWorkspaceProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        preview_ceiling="governed_preview",
        detail_ceiling="full_detail",
        artifact_ceiling="governed_inline",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_REQUEST_PATIENT_REF",
            "FLD_REQUEST_NARRATIVE_REF",
            "FLD_IDENTITY_REPAIR_FREEZE_REASON",
        ),
        artifact_refs=("ART_EVIDENCE_SNAPSHOT", "ART_RECORD_ARTIFACT"),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Operational clinicians can see full task detail but not raw identity-proof stores, secrets, or off-scope replay evidence.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17C MinimumNecessaryContract",
            "staff-operations-and-support-blueprint.md",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_clinician_workspace_child",
        canonical_object_name="TaskWorkspaceProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        preview_ceiling="governed_preview",
        detail_ceiling="full_detail",
        artifact_ceiling="governed_inline",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_REQUEST_NARRATIVE_REF",
            "FLD_PATIENTDETAIL_PLACEHOLDER_SET",
        ),
        artifact_refs=("ART_EVIDENCE_SNAPSHOT", "ART_RECORD_ARTIFACT"),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Child workspace states inherit the same minimum-necessary rule and do not invent broader projection shapes.",
        source_refs=(
            "platform-frontend-blueprint.md",
            "forensic-audit-findings.md#Finding 92 - The audit still lacked a canonical staff-workspace consistency and trust envelope",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_practice_ops_workspace",
        canonical_object_name="WorkspaceHomeProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_REQUEST_PATIENT_REF",
            "FLD_PATIENTSUMMARY_STATUS_COPY",
        ),
        artifact_refs=("ART_SUMMARY_PARITY_WITNESS",),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Operational practice views favor bounded detail and posture over raw proof stores.",
        source_refs=(
            "staff-operations-and-support-blueprint.md",
            "phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_hub_queue",
        canonical_object_name="HubQueueWorkbenchProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_PATIENTSUMMARY_STATUS_COPY",
            "FLD_IDENTITY_REPAIR_FREEZE_REASON",
        ),
        artifact_refs=("ART_SUMMARY_PARITY_WITNESS",),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Queue rows expose the minimum coordination detail and stay subordinate to patient-safe downstream truth.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17B PreviewVisibilityContract",
            "forensic-audit-findings.md#Finding 47 - Cross-organisation and support visibility boundaries were under-specified",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_hub_case_management",
        canonical_object_name="HubCaseConsoleProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        preview_ceiling="governed_preview",
        detail_ceiling="full_detail",
        artifact_ceiling="governed_inline",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=("FLD_REQUEST_NARRATIVE_REF", "FLD_IDENTITY_REPAIR_FREEZE_REASON"),
        artifact_refs=("ART_RECORD_ARTIFACT", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Hub coordination can access richer case detail, but break-glass still pivots to governed investigation scope.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17D AudienceVisibilityCoverage",
            "forensic-audit-findings.md#Finding 47 - Cross-organisation and support visibility boundaries were under-specified",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_pharmacy_console",
        canonical_object_name="PharmacyConsoleShell",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        preview_ceiling="governed_preview",
        detail_ceiling="full_detail",
        artifact_ceiling="governed_inline",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=("FLD_REQUEST_NARRATIVE_REF", "FLD_REQUEST_CONTACT_PREFERENCES_REF"),
        artifact_refs=("ART_RECORD_ARTIFACT", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Pharmacy delivery views need full task detail, but still exclude raw proof stores and unsupported export widening.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17C MinimumNecessaryContract",
            "platform-runtime-and-release-blueprint.md#Frontend and backend integration contract",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_support_ticket_workspace",
        canonical_object_name="SupportTicketWorkspaceProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline_masked",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="pivot_to_governance_investigation",
        wrong_patient_hold_behavior="mask_timeline_and_revalidate_before_restore",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_SUPPORT_REPLAY_MASK_SCOPE",
            "FLD_PATIENT_COMMUNICATION_PREVIEW_LINE",
            "FLD_IDENTITY_REPAIR_FREEZE_REASON",
        ),
        artifact_refs=("ART_AUDIT_REPLAY_BUNDLE", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_SUPPORT_REPLAY_VIEW", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Support casework stays minimum-necessary and replay-safe; broader investigation detail requires a separate governance purpose row.",
        source_refs=(
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
            "forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_support_replay_observe",
        canonical_object_name="SupportReplaySession",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline_masked",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="pivot_to_governance_investigation",
        wrong_patient_hold_behavior="mask_timeline_and_revalidate_before_restore",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_SUPPORT_REPLAY_MASK_SCOPE",
            "FLD_AUDITQUERY_DIAGNOSTIC_QUESTION",
            "FLD_INVESTIGATION_SELECTED_ANCHOR",
        ),
        artifact_refs=("ART_AUDIT_REPLAY_BUNDLE", "ART_SUMMARY_PARITY_WITNESS"),
        audit_refs=("EV_SUPPORT_REPLAY_VIEW", "EV_BREAK_GLASS_REVIEW", "EV_IMMUTABLE_AUDIT_LEDGER"),
        notes="Replay, diff, and observe stay mask-scope-bound and cannot silently reopen live controls or wider detail.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_support_assisted_capture",
        canonical_object_name="SupportActionWorkbenchProjection",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="pivot_to_governance_investigation",
        wrong_patient_hold_behavior="mask_timeline_and_revalidate_before_restore",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_SUBMISSION_RAW_DRAFT_FRAGMENT",
            "FLD_SUPPORT_REPLAY_MASK_SCOPE",
        ),
        artifact_refs=("ART_UPLOAD_ATTACHMENT", "ART_EVIDENCE_SNAPSHOT"),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_STRUCTURED_LOG_RUNTIME"),
        notes="Support-assisted capture remains pre-submit or recovery-safe and does not authorize broad patient-history disclosure.",
        source_refs=(
            "staff-operations-and-support-blueprint.md",
            "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_operations_board",
        canonical_object_name="OpsOverviewContextFrame",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_OPS_AGGREGATE_DISCLOSURE",
        break_glass_behavior="pivot_to_governance_investigation",
        wrong_patient_hold_behavior="not_applicable",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_ASSURANCELEDGER_CANONICAL_HASH",
            "FLD_UIEVENTVIS_ALLOWED_REFS",
            "FLD_UITELEMETRY_DISCLOSURE_CLASS",
        ),
        artifact_refs=("ART_ASSURANCE_PACK", "ART_DELETION_CERTIFICATE"),
        audit_refs=("EV_UI_TELEMETRY_OPS", "EV_ASSURANCE_LEDGER_ENTRY"),
        notes="Overview boards default to aggregate slice posture and do not hydrate subject payloads by convenience.",
        source_refs=(
            "phase-9-the-assurance-ledger.md",
            "forensic-audit-findings.md#Finding 96 - The audit still under-specified operations-console trust and guardrail posture",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_operations_drilldown",
        canonical_object_name="AuditQuerySession",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline_masked",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_AUDITQUERY_DIAGNOSTIC_QUESTION",
            "FLD_INVESTIGATION_SELECTED_ANCHOR",
            "FLD_BREAKGLASS_REASON_CODE",
        ),
        artifact_refs=("ART_AUDIT_REPLAY_BUNDLE", "ART_ASSURANCE_PACK"),
        audit_refs=("EV_ASSURANCE_LEDGER_ENTRY", "EV_BREAK_GLASS_REVIEW", "EV_INVESTIGATION_EXPORT_BUNDLE"),
        notes="Operational drilldown becomes scope-bound investigation when it needs subject-level evidence.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "forensic-audit-findings.md#Finding 102 - Operations diagnosis still lacked first-class continuity evidence",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_governance_shell",
        canonical_object_name="GovernanceSurfacePosture",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_handoff",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=(
            "FLD_INVESTIGATION_SELECTED_ANCHOR",
            "FLD_BREAKGLASS_REASON_CODE",
            "FLD_DELETION_CERTIFICATE_ARTIFACT_SET",
            "FLD_ARCHIVE_MANIFEST_ARTIFACT_SET",
        ),
        artifact_refs=("ART_AUDIT_REPLAY_BUNDLE", "ART_DELETION_CERTIFICATE", "ART_ARCHIVE_MANIFEST", "ART_ASSURANCE_PACK"),
        audit_refs=("EV_BREAK_GLASS_REVIEW", "EV_INVESTIGATION_EXPORT_BUNDLE", "EV_ASSURANCE_LEDGER_ENTRY"),
        notes="Governance routes own break-glass, export, retention witnesses, and evidence-pack posture under one investigation envelope.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "forensic-audit-findings.md#Finding 103 - Governance compliance review still omitted continuity-evidence bundles",
        ),
    ),
    SurfacePolicySpec(
        surface_id="surf_assistive_sidecar",
        canonical_object_name="AssistiveCompanionPresentationProfile",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="contextual",
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="forbidden",
        wrong_patient_hold_behavior="hold_detail_and_keep_summary",
        materialization_rule="allowlisted_only",
        post_delivery_widening="forbidden",
        field_refs=("FLD_UIEVENTVIS_ALLOWED_REFS", "FLD_UITELEMETRY_DISCLOSURE_CLASS"),
        artifact_refs=("ART_ASSURANCE_PACK",),
        audit_refs=("EV_UI_TELEMETRY_WORKSPACE", "EV_ASSURANCE_LEDGER_ENTRY"),
        notes="Assistive sidecars inherit the owning shell’s disclosure ceiling and never act as a separate broad PHI surface.",
        source_refs=(
            "platform-frontend-blueprint.md",
            "forensic-audit-findings.md#Finding 94 - The audit still treated assistive output as a generic sidecar instead of a trust-bound same-shell capability",
        ),
    ),
]


FIELD_SPECS = [
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_REQUEST_PATIENT_REF",
        canonical_object_name="Request",
        field_name_or_artifact_class="Request.patientRef",
        sensitivity_class="patient_identifying",
        contains_phi="yes",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "origin_practice_operations", "hub_desk", "servicing_site", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "coordination", "servicing_delivery", "support_recovery", "governance_review"),
        preview_ceiling="masked_summary",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Derived from verified IdentityBinding only; not lawful in patient_public or unsecured recovery payloads.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.3 Request",
            "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated `patientRef` as unconditional",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_REQUEST_NARRATIVE_REF",
        canonical_object_name="Request",
        field_name_or_artifact_class="Request.narrativeRef",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "hub_desk", "servicing_site", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "coordination", "servicing_delivery", "support_recovery", "governance_review"),
        preview_ceiling="masked_summary",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Narrative content is never lawful in public previews, raw telemetry, or wide logs.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.3 Request",
            "patient-account-and-communications-blueprint.md#Request detail contract",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_REQUEST_CONTACT_PREFERENCES_REF",
        canonical_object_name="Request",
        field_name_or_artifact_class="Request.contactPreferencesRef",
        sensitivity_class="contact_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("patient_authenticated", "origin_practice_clinical", "origin_practice_operations", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="none",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="none",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_WORKSPACE_MINIMUM_NECESSARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Contact preferences are distinct from NHS login claims and may not be overwritten or leaked through delivery telemetry.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "patient-account-and-communications-blueprint.md",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_SUBMISSION_RAW_DRAFT_FRAGMENT",
        canonical_object_name="SubmissionEnvelope",
        field_name_or_artifact_class="SubmissionEnvelope draft fragments and free text",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="masked_summary",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="none",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Incomplete or unauthenticated content keeps narrower projection and retention rules than submitted work.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "phase-1-the-red-flag-gate.md",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_SUBMISSION_ATTACHMENT_SET",
        canonical_object_name="SubmissionEnvelope",
        field_name_or_artifact_class="SubmissionEnvelope attachment refs",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="awareness_only",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="none",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Pre-submit attachment presence may be acknowledged without exposing body or filename detail.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_IDENTITYBINDING_SUBJECT_PROOF",
        canonical_object_name="IdentityBinding",
        field_name_or_artifact_class="IdentityBinding match or proof refs",
        sensitivity_class="identity_proof_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "investigation_break_glass"),
        preview_ceiling="none",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="none",
        log_ceiling="none",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Raw proof material stays outside ordinary operational tables and events.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "forensic-audit-findings.md#Finding 50 - The concrete Request schema dropped identity-binding references and treated `patientRef` as unconditional",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_AUTHTRANSACTION_CLAIM_SNAPSHOT_REF",
        canonical_object_name="AuthTransaction",
        field_name_or_artifact_class="AuthTransaction claim snapshot refs",
        sensitivity_class="identity_proof_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "investigation_break_glass"),
        preview_ceiling="none",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="none",
        log_ceiling="none",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Raw claims and callback proof are never standard browser or operator detail.",
        source_refs=("phase-2-the-identity-and-echoes.md",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_ACCESSGRANT_TOKEN_HASH",
        canonical_object_name="AccessGrant",
        field_name_or_artifact_class="AccessGrant opaque token or hash refs",
        sensitivity_class="security_or_secret_sensitive",
        contains_phi="no",
        allowed_audience_tiers=("support", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="none",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="none",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_GRANT_RECOVERY_BOUNDARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Opaque tokens are never emitted raw and remain scope-bound even in support recovery.",
        source_refs=("phase-2-the-identity-and-echoes.md",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_CALLSESSION_CONTACT_ROUTE",
        canonical_object_name="CallSession",
        field_name_or_artifact_class="CallSession caller contact or route hints",
        sensitivity_class="contact_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="none",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="none",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Telephony identifiers are contact-sensitive and stay masked or ref-only outside governed investigation context.",
        source_refs=("phase-2-the-identity-and-echoes.md",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_PATIENTAUDIENCECOVERAGE_PREVIEW_MODE",
        canonical_object_name="PatientAudienceCoverageProjection",
        field_name_or_artifact_class="PatientAudienceCoverageProjection communicationPreviewMode",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "patient_authenticated", "patient_embedded_authenticated", "support", "governance_review"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "authenticated_self_service", "embedded_authenticated", "support_recovery", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="summary_only_with_scope_envelope",
        notes="The preview mode itself is safe metadata; the payload it authorizes is separately governed.",
        source_refs=("patient-account-and-communications-blueprint.md#Patient audience coverage contract",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_PATIENTSUMMARY_STATUS_COPY",
        canonical_object_name="PatientRequestSummaryProjection",
        field_name_or_artifact_class="PatientRequestSummaryProjection status and safe CTA copy",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Even patient-facing status wording is pinned to authoritative summary evidence rather than a reused detail payload.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Requests browsing contract",
            "forensic-audit-findings.md#Finding 97 - The audit still let patient-home actionability float above authoritative settlement",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_PATIENTDETAIL_PLACEHOLDER_SET",
        canonical_object_name="PatientRequestDetailProjection",
        field_name_or_artifact_class="PatientRequestDetailProjection governed placeholders",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Partial visibility must stay explicit rather than disappearing from the shell.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Request detail contract",
            "forensic-audit-findings.md#Finding 88 - The audit omitted governed placeholder rules for partial visibility",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_CONVERSATION_LAST_SNIPPET",
        canonical_object_name="ConversationThreadProjection",
        field_name_or_artifact_class="ConversationThreadProjection last message snippet",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("patient_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="masked_summary",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Message snippets and message bodies are separate disclosure surfaces.",
        source_refs=(
            "patient-account-and-communications-blueprint.md",
            "phase-0-the-foundation-protocol.md#1.17B PreviewVisibilityContract",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_PATIENT_COMMUNICATION_PREVIEW_LINE",
        canonical_object_name="PatientCommunicationVisibilityProjection",
        field_name_or_artifact_class="PatientCommunicationVisibilityProjection preview line",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "patient_authenticated", "support", "governance_review"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "authenticated_self_service", "support_recovery", "governance_review"),
        preview_ceiling="masked_summary",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_PATIENT_AUTH_SUMMARY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Preview lines are lawful only through preview contracts, not reused thread payloads.",
        source_refs=(
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
            "forensic-audit-findings.md#Finding 99 - Conversation state could still collapse local acknowledgement into final reassurance",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_PATIENT_EMBEDDED_ENTRY_ASSERTION",
        canonical_object_name="PatientEmbeddedSessionProjection",
        field_name_or_artifact_class="PatientEmbeddedSessionProjection asserted entry or bridge refs",
        sensitivity_class="security_or_secret_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_embedded_authenticated", "governance_review"),
        allowed_purposes_of_use=("embedded_authenticated", "governance_review"),
        preview_ceiling="none",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="none",
        log_ceiling="none",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_EMBEDDED_ARTIFACT_CHANNEL",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Embedded identity assertions and bridge capability proof are scrubbed immediately and never left in URLs or logs.",
        source_refs=("phase-7-inside-the-nhs-app.md",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_RECOVERY_FENCE_MAX_VISIBLE_FIELDS",
        canonical_object_name="RecoveryRedactionFence",
        field_name_or_artifact_class="RecoveryRedactionFence maxVisibleFields and disclosure class",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "support", "governance_review"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "support_recovery", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="summary_only_with_scope_envelope",
        notes="This is the explicit no-PHI recovery contract rather than a UI convention.",
        source_refs=("platform-frontend-blueprint.md#RecoveryRedactionFence",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_SUPPORT_REPLAY_MASK_SCOPE",
        canonical_object_name="SupportReplaySession",
        field_name_or_artifact_class="SupportReplaySession maskScopeRef and checkpoint tuple",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("support", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="pivot_to_governance_investigation",
        notes="Mask scope, selected anchor, and replay checkpoint remain explicit and restore-safe.",
        source_refs=(
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_AUDITQUERY_DIAGNOSTIC_QUESTION",
        canonical_object_name="AuditQuerySession",
        field_name_or_artifact_class="AuditQuerySession diagnostic question and causality state",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_control", "governance_review", "investigation_break_glass"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Investigation routes are keyed to a diagnostic question, not open-ended broad browsing.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_INVESTIGATION_SELECTED_ANCHOR",
        canonical_object_name="InvestigationScopeEnvelope",
        field_name_or_artifact_class="InvestigationScopeEnvelope selectedAnchor and masking ceiling",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_control", "governance_review", "investigation_break_glass", "audit_export"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="The scope envelope is the single authority for replay, break-glass, and export ceiling.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_BREAKGLASS_REASON_CODE",
        canonical_object_name="BreakGlassReviewRecord",
        field_name_or_artifact_class="BreakGlassReviewRecord reasonCode and expiry",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "investigation_break_glass"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Break-glass requires a reason code, selected anchor, explicit expiry, and read-only posture.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_ASSURANCELEDGER_CANONICAL_HASH",
        canonical_object_name="AssuranceLedgerEntry",
        field_name_or_artifact_class="AssuranceLedgerEntry canonicalPayloadHash and effectKeyRef",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="no",
        allowed_audience_tiers=("operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_control", "governance_review", "investigation_break_glass"),
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="audit_reference_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_OPS_AGGREGATE_DISCLOSURE",
        break_glass_behavior="summary_only_with_scope_envelope",
        notes="Assurance and replay consumers rely on hashes, refs, and replay classes rather than body payloads.",
        source_refs=("phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_UIEVENTVIS_ALLOWED_REFS",
        canonical_object_name="UIEventVisibilityProfile",
        field_name_or_artifact_class="UIEventVisibilityProfile allowed refs and disclosure class",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("patient_public", "patient_authenticated", "patient_embedded_authenticated", "support", "operations_control", "governance_review"),
        allowed_purposes_of_use=("public_status", "authenticated_self_service", "embedded_authenticated", "support_recovery", "operational_control", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        break_glass_behavior="summary_only_with_scope_envelope",
        notes="Visibility profiles are the platform-side allowlists for UI event disclosures.",
        source_refs=("platform-frontend-blueprint.md#UIEventVisibilityProfile",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_UITELEMETRY_DISCLOSURE_CLASS",
        canonical_object_name="UITelemetryDisclosureFence",
        field_name_or_artifact_class="UITelemetryDisclosureFence disclosure class",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("patient_public", "patient_authenticated", "patient_embedded_authenticated", "support", "operations_control", "governance_review"),
        allowed_purposes_of_use=("public_status", "authenticated_self_service", "embedded_authenticated", "support_recovery", "operational_control", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="summary_only",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        break_glass_behavior="summary_only_with_scope_envelope",
        notes="Disclosure fences prove the ceiling before browser or operator telemetry leaves the shell.",
        source_refs=(
            "platform-frontend-blueprint.md#UITelemetryDisclosureFence",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_IDENTITY_REPAIR_FREEZE_REASON",
        canonical_object_name="IdentityRepairFreezeRecord",
        field_name_or_artifact_class="IdentityRepairFreezeRecord reason and release posture",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "operational_execution", "support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="masked_summary",
        detail_ceiling="bounded_detail",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Wrong-patient or subject-conflict holds preserve only the minimum safe breadcrumb until governed release.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_EVIDENCE_ARTIFACT_REDACTION_HASH",
        canonical_object_name="EvidenceArtifact",
        field_name_or_artifact_class="EvidenceArtifact redactionTransformHash and lineage refs",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="no",
        allowed_audience_tiers=("support", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "governance_review", "investigation_break_glass", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Parity and redaction hash evidence explains which transform governed the visible artifact.",
        source_refs=("phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_RECORD_ARTIFACT_SUMMARY_REF",
        canonical_object_name="PatientRecordArtifactProjection",
        field_name_or_artifact_class="PatientRecordArtifactProjection summary and mode state",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_ARTIFACT_GOVERNED",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Artifact summary and body modes are separate permissions with parity and fallback controls.",
        source_refs=(
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_OUTBOUND_NAV_DESTINATION_REF",
        canonical_object_name="OutboundNavigationGrant",
        field_name_or_artifact_class="OutboundNavigationGrant destination and return-safe tuple",
        sensitivity_class="security_or_secret_sensitive",
        contains_phi="no",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "support_recovery", "governance_review"),
        preview_ceiling="none",
        detail_ceiling="summary_only",
        artifact_ceiling="governed_handoff",
        telemetry_ceiling="none",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_EMBEDDED_ARTIFACT_CHANNEL",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="External movement uses scrubbed, short-lived grants instead of raw PHI-bearing URLs.",
        source_refs=(
            "platform-frontend-blueprint.md#OutboundNavigationGrant",
            "phase-7-inside-the-nhs-app.md",
        ),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_DELETION_CERTIFICATE_ARTIFACT_SET",
        canonical_object_name="DeletionCertificate",
        field_name_or_artifact_class="DeletionCertificate artifact-set refs and hold posture",
        sensitivity_class="retention_governance_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_RETENTION_GOVERNED_EXPORT",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Deletion witnesses are governance artifacts, not ordinary documents.",
        source_refs=("phase-9-the-assurance-ledger.md",),
    ),
    FieldSensitivitySpec(
        field_or_artifact_id="FLD_ARCHIVE_MANIFEST_ARTIFACT_SET",
        canonical_object_name="ArchiveManifest",
        field_name_or_artifact_class="ArchiveManifest artifact-set refs and archive posture",
        sensitivity_class="retention_governance_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_RETENTION_GOVERNED_EXPORT",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        notes="Archive manifests preserve retention and admissibility truth without acting as patient-downloadable bodies.",
        source_refs=("phase-9-the-assurance-ledger.md",),
    ),
]


ARTIFACT_SPECS = [
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_UPLOAD_ATTACHMENT",
        canonical_object_name="EvidenceArtifact",
        field_name_or_artifact_class="Uploads and attachments",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "patient_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "authenticated_self_service", "operational_execution", "support_recovery", "governance_review"),
        preview_ceiling="awareness_only",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PUBLIC_SAFE_PLACEHOLDER",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_PRE_SUBMIT_TRANSIENT",
        transfer_modes=("structured_summary", "governed_inline", "support_recovery"),
        notes="Attachments acknowledge presence without implying byte availability or safe preview.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
        ),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_TELEPHONY_RECORDING",
        canonical_object_name="CallSession",
        field_name_or_artifact_class="Telephony recordings",
        sensitivity_class="identity_proof_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "investigation_break_glass"),
        preview_ceiling="none",
        detail_ceiling="summary_only",
        artifact_ceiling="summary_only",
        telemetry_ceiling="none",
        log_ceiling="none",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_SUPPORT_INVESTIGATION_EVIDENCE",
        transfer_modes=("governed_inline_masked", "governed_handoff"),
        notes="Recordings are proof-sensitive evidence and never ordinary patient or support previews.",
        source_refs=("phase-2-the-identity-and-echoes.md",),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_TELEPHONY_TRANSCRIPT",
        canonical_object_name="EvidenceArtifact",
        field_name_or_artifact_class="Telephony transcripts",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("operational_execution", "support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="masked_summary",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_inline_masked",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_SUPPORT_INVESTIGATION_EVIDENCE",
        transfer_modes=("structured_summary", "governed_inline_masked", "governed_handoff"),
        notes="Transcripts remain summary-first or masked-inline and are never broad operator export by default.",
        source_refs=("phase-2-the-identity-and-echoes.md",),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_EVIDENCE_SNAPSHOT",
        canonical_object_name="EvidenceSnapshot",
        field_name_or_artifact_class="Evidence snapshots",
        sensitivity_class="clinical_sensitive",
        contains_phi="contextual",
        allowed_audience_tiers=("origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("operational_execution", "support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_SUPPORT_INVESTIGATION_EVIDENCE",
        transfer_modes=("structured_summary", "governed_inline_masked", "governed_handoff"),
        notes="Snapshots are immutable evidence anchors and not generic downloadable content.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_DERIVATION_PACKAGE",
        canonical_object_name="EvidenceArtifact",
        field_name_or_artifact_class="Derivation packages and normalization packages",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("support", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "governance_review", "investigation_break_glass", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_SUPPORT_INVESTIGATION_EVIDENCE",
        transfer_modes=("structured_summary", "governed_handoff"),
        notes="Derivation packages stay replay and export governed because they can reveal transformation lineage and payload scope.",
        source_refs=(
            "phase-1-the-red-flag-gate.md",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_SUMMARY_PARITY_WITNESS",
        canonical_object_name="RecordArtifactParityWitness",
        field_name_or_artifact_class="Summary and parity witnesses",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "support", "operations_control", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "support_recovery", "operational_control", "governance_review"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_ARTIFACT_GOVERNED",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_WORM_AUDIT_GOVERNANCE",
        transfer_modes=("structured_summary", "governed_inline_masked"),
        notes="Parity witnesses explain which summary or artifact posture was lawful without disclosing the full source body.",
        source_refs=("phase-9-the-assurance-ledger.md",),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_RECORD_ARTIFACT",
        canonical_object_name="PatientRecordArtifactProjection",
        field_name_or_artifact_class="Record artifacts, letters, and results",
        sensitivity_class="clinical_sensitive",
        contains_phi="yes",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "origin_practice_clinical", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "operational_execution", "support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="governed_preview",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_download",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_PATIENT_ARTIFACT_GOVERNED",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_CLINICAL_CASE_ARTIFACT",
        transfer_modes=("structured_summary", "governed_inline", "governed_download", "governed_handoff"),
        notes="Patient-visible records remain summary-first and mode-specific even when downloads are permitted.",
        source_refs=(
            "platform-frontend-blueprint.md#ArtifactPresentationContract",
            "patient-account-and-communications-blueprint.md",
        ),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_DELETION_CERTIFICATE",
        canonical_object_name="DeletionCertificate",
        field_name_or_artifact_class="Deletion certificates",
        sensitivity_class="retention_governance_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_RETENTION_GOVERNED_EXPORT",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_RETENTION_GOVERNANCE_WITNESS",
        transfer_modes=("structured_summary", "governed_handoff"),
        notes="These artifacts prove lifecycle control and remain distinct from the deleted PHI itself.",
        source_refs=("phase-9-the-assurance-ledger.md",),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_ARCHIVE_MANIFEST",
        canonical_object_name="ArchiveManifest",
        field_name_or_artifact_class="Archive manifests",
        sensitivity_class="retention_governance_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="summary_only",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_RETENTION_GOVERNED_EXPORT",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_RETENTION_GOVERNANCE_WITNESS",
        transfer_modes=("structured_summary", "governed_handoff"),
        notes="Archive manifests preserve the archive chain without becoming ordinary content downloads.",
        source_refs=("phase-9-the-assurance-ledger.md",),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_AUDIT_REPLAY_BUNDLE",
        canonical_object_name="InvestigationScopeEnvelope",
        field_name_or_artifact_class="Audit, replay, and investigation evidence bundles",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("support", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "governance_review", "investigation_break_glass", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_handoff",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_SUPPORT_INVESTIGATION_EVIDENCE",
        transfer_modes=("structured_summary", "governed_inline_masked", "governed_handoff"),
        notes="Replay and export bundles remain masked, selected-anchor-bound, and diagnostic-question-bound.",
        source_refs=(
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
        ),
    ),
    ArtifactSensitivitySpec(
        field_or_artifact_id="ART_ASSURANCE_PACK",
        canonical_object_name="AssurancePack",
        field_name_or_artifact_class="Assurance packs and governance evidence packs",
        sensitivity_class="retention_governance_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_control", "governance_review", "audit_export"),
        preview_ceiling="summary_only",
        detail_ceiling="bounded_detail",
        artifact_ceiling="governed_handoff",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_RETENTION_GOVERNED_EXPORT",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        retention_class_ref_if_artifact="RET_ASSURANCE_PACK_ARCHIVE",
        transfer_modes=("structured_summary", "governed_handoff"),
        notes="Assurance packs remain governance artifacts with completeness and trust dependencies.",
        source_refs=("phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",),
    ),
]


AUDIT_SPECS = [
    AuditDisclosureSpec(
        field_or_artifact_id="EV_UI_TELEMETRY_PATIENT",
        canonical_object_name="UITelemetryDisclosureFence",
        field_name_or_artifact_class="Patient and public UI telemetry",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("patient_public", "patient_grant_scoped", "patient_authenticated", "patient_embedded_authenticated"),
        allowed_purposes_of_use=("public_status", "secure_link_recovery", "authenticated_self_service", "embedded_authenticated"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        break_glass_behavior="forbidden",
        allowed_identifiers=("eventId", "edgeCorrelationId", "causalToken", "routeFamilyCode", "shellDecisionClass", "selectedAnchorChangeClass"),
        prohibited_identifiers=("raw JWT", "raw phone number", "message body", "clinical narrative", "full route params", "assertedLoginIdentity"),
        notes="Patient telemetry keeps enough determinism for replay without leaking subject detail.",
        source_refs=(
            "platform-frontend-blueprint.md#UIEventVisibilityProfile",
            "platform-frontend-blueprint.md#UITelemetryDisclosureFence",
        ),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_UI_TELEMETRY_EMBEDDED",
        canonical_object_name="UITelemetryDisclosureFence",
        field_name_or_artifact_class="Embedded NHS App UI telemetry",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("patient_embedded_authenticated",),
        allowed_purposes_of_use=("embedded_authenticated",),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        break_glass_behavior="forbidden",
        allowed_identifiers=("eventId", "edgeCorrelationId", "bridgeCapabilityClass", "routeFamilyCode", "artifactModeClass"),
        prohibited_identifiers=("assertedLoginIdentity", "JWT body", "raw destination URL", "raw document title with PHI"),
        notes="Embedded telemetry adds channel posture but still excludes PHI-bearing URL or token content.",
        source_refs=("phase-7-inside-the-nhs-app.md",),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_UI_TELEMETRY_WORKSPACE",
        canonical_object_name="UITelemetryDisclosureFence",
        field_name_or_artifact_class="Workspace, hub, pharmacy, and support UI telemetry",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("origin_practice_clinical", "origin_practice_operations", "hub_desk", "servicing_site", "support", "assistive_adjunct"),
        allowed_purposes_of_use=("operational_execution", "coordination", "servicing_delivery", "support_recovery", "assistive_companion"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        break_glass_behavior="summary_only_with_scope_envelope",
        allowed_identifiers=("eventId", "taskRef", "lineageRef", "maskScopeClass", "restoreState", "edgeCorrelationId"),
        prohibited_identifiers=("raw patient name", "raw phone number", "thread body", "artifact bytes", "raw identity claim"),
        notes="Operational telemetry remains task-safe and mask-safe.",
        source_refs=(
            "platform-frontend-blueprint.md#UITelemetryDisclosureFence",
            "staff-operations-and-support-blueprint.md",
        ),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_STRUCTURED_LOG_RUNTIME",
        canonical_object_name="AssuranceLedgerEntry",
        field_name_or_artifact_class="Structured application and worker logs",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="no",
        allowed_audience_tiers=("operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_control", "governance_review"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="not_applicable",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_LOG_REFERENCE_ONLY",
        break_glass_behavior="summary_only_with_scope_envelope",
        allowed_identifiers=("requestId ref", "lineageRef", "eventId", "effectKeyRef", "queue or worker class", "error class"),
        prohibited_identifiers=("JWT", "secret", "raw phone number", "raw claim snapshot", "clinical narrative", "message body"),
        notes="Logs are diagnostic only; they do not replace audit or evidence exports.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "phase-9-the-assurance-ledger.md",
        ),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_CANONICAL_EVENT_BUS",
        canonical_object_name="AssuranceLedgerEntry",
        field_name_or_artifact_class="Canonical domain events crossing internal boundaries",
        sensitivity_class="operational_internal_non_phi",
        contains_phi="contextual",
        allowed_audience_tiers=("origin_practice_clinical", "origin_practice_operations", "support", "operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_execution", "support_recovery", "operational_control", "governance_review"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="descriptor_and_hash_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_TELEMETRY_PHI_SAFE",
        break_glass_behavior="summary_only_with_scope_envelope",
        allowed_identifiers=("eventId", "canonicalEventContractRef", "schemaVersionRef", "tenantId", "subjectRef", "masked fragments", "hash refs"),
        prohibited_identifiers=("raw identity values", "raw phone numbers", "contact claims", "secret material"),
        notes="Events carry refs, hashes, or masked forms only; raw identity and contact values never cross the bus.",
        source_refs=("phase-2-the-identity-and-echoes.md",),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_IMMUTABLE_AUDIT_LEDGER",
        canonical_object_name="AuditQuerySession",
        field_name_or_artifact_class="Immutable audit ledger",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("support", "operations_control", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "operational_control", "governance_review", "investigation_break_glass"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="audit_reference_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        allowed_identifiers=("auditRecordId", "routeIntentRef", "commandActionRef", "commandSettlementRef", "projectionVisibilityRef", "timeline hash"),
        prohibited_identifiers=("unmasked replay body outside scope", "free-form payload dump"),
        notes="Audit is queryable and immutable, but still minimum-necessary and scope-governed at presentation time.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_ASSURANCE_LEDGER_ENTRY",
        canonical_object_name="AssuranceLedgerEntry",
        field_name_or_artifact_class="Assurance ledger and evidence graph entries",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("operations_control", "governance_review"),
        allowed_purposes_of_use=("operational_control", "governance_review", "audit_export"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="audit_reference_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_OPS_AGGREGATE_DISCLOSURE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        allowed_identifiers=("canonicalPayloadHash", "effectKeyRef", "controlRefs", "graphEdgeRefs", "replayDecisionClass"),
        prohibited_identifiers=("raw source payload", "inline clinical content", "raw secret material"),
        notes="Assurance consumers reason from hashes, refs, provenance, and replay class, not payload dumps.",
        source_refs=("phase-9-the-assurance-ledger.md#9A. Assurance ledger, evidence graph, and operational state contracts",),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_SUPPORT_REPLAY_VIEW",
        canonical_object_name="SupportReplaySession",
        field_name_or_artifact_class="Support replay and observe views",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("support", "governance_review"),
        allowed_purposes_of_use=("support_recovery", "governance_review", "investigation_break_glass"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="masked_scope_and_refs_only",
        audit_replay_ceiling="masked_timeline",
        redaction_policy_ref="POL_SUPPORT_MASKED_REPLAY",
        break_glass_behavior="pivot_to_governance_investigation",
        allowed_identifiers=("checkpoint hash", "maskScopeRef", "selectedAnchorTupleHash", "restoreState", "timelineHash"),
        prohibited_identifiers=("held drafts", "raw message body outside current mask scope", "broader anchor than the source envelope"),
        notes="Replay never widens beyond the spawned investigation envelope and restore gate.",
        source_refs=(
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
        ),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_BREAK_GLASS_REVIEW",
        canonical_object_name="BreakGlassReviewRecord",
        field_name_or_artifact_class="Break-glass review records and UI",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "investigation_break_glass"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="not_applicable",
        telemetry_ceiling="masked_scope_and_refs_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        allowed_identifiers=("breakGlassReviewRecordId", "reasonCode", "expiresAt", "selectedAnchorRef", "scope hash"),
        prohibited_identifiers=("broad unscoped timeline", "mutating command payloads"),
        notes="Break-glass is a governed review and not an always-on operator role.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_INVESTIGATION_EXPORT_BUNDLE",
        canonical_object_name="InvestigationScopeEnvelope",
        field_name_or_artifact_class="Investigation, export, and replay bundles",
        sensitivity_class="audit_investigation_restricted",
        contains_phi="contextual",
        allowed_audience_tiers=("governance_review",),
        allowed_purposes_of_use=("governance_review", "investigation_break_glass", "audit_export"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="governed_handoff",
        telemetry_ceiling="descriptor_only",
        log_ceiling="audit_reference_only",
        audit_replay_ceiling="full_evidence_with_scope",
        redaction_policy_ref="POL_INVESTIGATION_SCOPE_ENVELOPE",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        allowed_identifiers=("investigationScopeEnvelopeRef", "timeline hash", "graphHash", "selectedAnchorRef", "masking policy ref"),
        prohibited_identifiers=("scope drift", "fresher anchor than the source query", "export without redaction transform"),
        notes="Exports, replay, and audit share one scope envelope and masking ceiling.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    AuditDisclosureSpec(
        field_or_artifact_id="EV_ARTIFACT_HANDOFF_AUDIT",
        canonical_object_name="OutboundNavigationGrant",
        field_name_or_artifact_class="Artifact handoff, download, and print audit trail",
        sensitivity_class="security_or_secret_sensitive",
        contains_phi="no",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "support", "governance_review"),
        allowed_purposes_of_use=("authenticated_self_service", "embedded_authenticated", "support_recovery", "governance_review"),
        preview_ceiling="not_applicable",
        detail_ceiling="not_applicable",
        artifact_ceiling="governed_handoff",
        telemetry_ceiling="descriptor_only",
        log_ceiling="diagnostic_refs_only",
        audit_replay_ceiling="bounded_detail_with_scope",
        redaction_policy_ref="POL_EMBEDDED_ARTIFACT_CHANNEL",
        break_glass_behavior="bounded_detail_with_scope_envelope",
        allowed_identifiers=("grant id", "artifact ref", "mode class", "return-safe hash", "handoff outcome class"),
        prohibited_identifiers=("raw PHI URL", "download token", "browser history fallback only"),
        notes="Artifact movement is audited without leaking destination or token detail.",
        source_refs=(
            "platform-frontend-blueprint.md#OutboundNavigationGrant",
            "phase-7-inside-the-nhs-app.md",
        ),
    ),
]


BREAK_GLASS_REASON_CODES = [
    {
        "reason_code": "wrong_patient_investigation",
        "summary": "Investigate suspected wrong-patient binding or release.",
        "allowed_anchor_classes": ["RequestLineage", "IdentityRepairCase", "IdentityRepairFreezeRecord"],
    },
    {
        "reason_code": "clinical_safety_incident",
        "summary": "Investigate a patient-safety, urgent-diversion, booking, or pharmacy incident.",
        "allowed_anchor_classes": ["Request", "BookingCase", "PharmacyCase", "SupportReplaySession"],
    },
    {
        "reason_code": "security_incident_response",
        "summary": "Investigate a security, access, or policy violation with scope-bounded evidence.",
        "allowed_anchor_classes": ["AuditQuerySession", "AssuranceLedgerEntry", "BreakGlassReviewRecord"],
    },
    {
        "reason_code": "data_subject_trace",
        "summary": "Trace disclosures, exports, or lifecycle actions for a bounded data-subject question.",
        "allowed_anchor_classes": ["DataSubjectTrace", "DeletionCertificate", "ArchiveManifest"],
    },
    {
        "reason_code": "restore_or_degradation_investigation",
        "summary": "Investigate recovery posture, replay divergence, or continuity drift affecting safe operation.",
        "allowed_anchor_classes": ["OperationalReadinessSnapshot", "SupportReplaySession", "InvestigationScopeEnvelope"],
    },
    {
        "reason_code": "regulatory_or_legal_export",
        "summary": "Prepare a governed regulator, legal, or assurance export from the admissible evidence graph.",
        "allowed_anchor_classes": ["GovernanceReviewPackage", "AssurancePack", "InvestigationScopeEnvelope"],
    },
]


BREAK_GLASS_RULES = [
    BreakGlassRuleSpec(
        rule_id="BG_RULE_ENVELOPE_REQUIRED",
        title="Investigation scope envelope is mandatory",
        distinct_purpose_of_use="investigation_break_glass",
        allowed_audience_tiers=("governance_review",),
        masking_ceiling_rule="Every break-glass, replay, and export flow binds one current masking ceiling and disclosure ceiling before materialization.",
        selected_anchor_rule="One selected anchor and one diagnostic question remain in scope until the envelope is superseded.",
        mutation_rule="Read-only; no live mutation controls may arm under break-glass review.",
        expiry_rule="The session must carry explicit expiresAt and auto-revoke on expiry or supersession.",
        restore_rule="On exit, invalidate cached detailed payloads and require ordinary route re-materialization.",
        export_rule="Export remains separately governed and may not inherit broader detail than the current envelope allows.",
        notes="This is the core rule that stops break-glass from becoming a role flag or session-local scope drift.",
        source_refs=("phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",),
    ),
    BreakGlassRuleSpec(
        rule_id="BG_RULE_SUPPORT_PIVOT",
        title="Support replay pivots rather than widening in place",
        distinct_purpose_of_use="investigation_break_glass",
        allowed_audience_tiers=("support", "governance_review"),
        masking_ceiling_rule="Support replay stays at masked timeline detail unless a governance-governed investigation envelope supersedes it.",
        selected_anchor_rule="The pivot preserves checkpoint hash, selected anchor, and diagnostic question.",
        mutation_rule="Replay, observe, and break-glass remain read-only, mutually explicit, and restore through settlement before live work resumes.",
        expiry_rule="Support pivots inherit the envelope expiresAt and auto-revoke requirements.",
        restore_rule="Held drafts and pending mutations stay outside replay evidence and require restore settlement before re-entry.",
        export_rule="Support export is not ordinary ticket export; it uses the investigation export bundle controls.",
        notes="Prevents support restore paths from broadening scope or drifting chronology.",
        source_refs=(
            "staff-operations-and-support-blueprint.md#3. Complex investigation and replay",
            "forensic-audit-findings.md#Finding 100 - Support replay and observe return still had no authoritative restore gate",
        ),
    ),
    BreakGlassRuleSpec(
        rule_id="BG_RULE_NO_POST_HYDRATION_WIDENING",
        title="No post-hydration widening",
        distinct_purpose_of_use="investigation_break_glass",
        allowed_audience_tiers=("governance_review",),
        masking_ceiling_rule="A lower-trust materialized payload cannot be widened after browser delivery; a new purpose row must be re-materialized server-side.",
        selected_anchor_rule="Anchor and envelope hashes must change when a new scope is compiled.",
        mutation_rule="No client-side reveal or UI collapse counts as deeper lawful disclosure, and break-glass remains read-only until a new server-side row is materialized.",
        expiry_rule="Older lower-trust payloads remain stale, expire immediately, and must be invalidated when the new row is materialized.",
        restore_rule="Cache demotion is mandatory whenever the envelope or purpose row changes.",
        export_rule="Exports derive from the new envelope only; they cannot reuse a cached browser payload.",
        notes="Directly closes the payload-trimmed-after-hydration and UI-collapse-is-privacy gaps.",
        source_refs=(
            "phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
            "forensic-audit-findings.md#Finding 87 - The audit did not bind patient projections to a single visibility and consistency envelope",
        ),
    ),
    BreakGlassRuleSpec(
        rule_id="BG_RULE_WRONG_PATIENT_SUPPRESSION",
        title="Wrong-patient hold suppresses cached PHI",
        distinct_purpose_of_use="investigation_break_glass",
        allowed_audience_tiers=("patient_authenticated", "patient_embedded_authenticated", "support", "governance_review"),
        masking_ceiling_rule="When IdentityRepairFreezeRecord is active, only recovery-safe summary or governance investigation rows remain lawful.",
        selected_anchor_rule="The active lineage, repair case, and freeze record stay explicit in the scope envelope.",
        mutation_rule="All writable actions stay blocked and the route remains read-only until IdentityRepairReleaseSettlement or governed compensation completes.",
        expiry_rule="Cached PHI expires immediately on hold entry and may not revive on refresh.",
        restore_rule="Resume requires revalidation against current binding, session epoch, and repair settlement.",
        export_rule="Repair evidence exports stay envelope-bound and preserve freeze or release proof explicitly.",
        notes="Makes wrong-patient suppression explicit across browser, replay, and support restore paths.",
        source_refs=(
            "phase-2-the-identity-and-echoes.md",
            "patient-account-and-communications-blueprint.md#Patient audience coverage contract",
        ),
    ),
    BreakGlassRuleSpec(
        rule_id="BG_RULE_RETENTION_WITNESS_SEPARATION",
        title="Retention witnesses stay separate from ordinary docs",
        distinct_purpose_of_use="investigation_break_glass",
        allowed_audience_tiers=("governance_review",),
        masking_ceiling_rule="Deletion and archive witnesses expose governance-safe summaries unless the envelope explicitly needs supporting evidence detail.",
        selected_anchor_rule="Exports bind witness ids, graph hash, and scope question rather than free-form evidence browsing.",
        mutation_rule="Retention witness review is read-only in this model.",
        expiry_rule="Witness exports are bound to the active completeness verdict and expire when superseded.",
        restore_rule="Return to governance shell preserves the same evidence pack anchor and disposition state.",
        export_rule="No witness becomes a patient-downloadable artifact by convenience.",
        notes="Separates retention and deletion evidence from ordinary records UX.",
        source_refs=("phase-9-the-assurance-ledger.md",),
    ),
]


SYNTHETIC_PREVIEW_EXAMPLES = [
    {
        "example_id": "synthetic_public_message",
        "surface_id": "surf_patient_home",
        "label": "Public-safe summary preview",
        "preview_text": "[message preview withheld pending sign-in]",
        "policy_ref": "POL_PUBLIC_SAFE_PLACEHOLDER",
    },
    {
        "example_id": "synthetic_wrong_patient_hold",
        "surface_id": "surf_patient_requests",
        "label": "Wrong-patient hold placeholder",
        "preview_text": "[identity check required before this request can reopen]",
        "policy_ref": "POL_PATIENT_AUTH_SUMMARY",
    },
    {
        "example_id": "synthetic_embedded_artifact",
        "surface_id": "surf_patient_embedded_shell",
        "label": "Embedded artifact fallback",
        "preview_text": "[summary available here; full document requires approved handoff]",
        "policy_ref": "POL_EMBEDDED_ARTIFACT_CHANNEL",
    },
    {
        "example_id": "synthetic_support_replay",
        "surface_id": "surf_support_replay_observe",
        "label": "Masked replay breadcrumb",
        "preview_text": "[masked reply thread shown under current replay scope]",
        "policy_ref": "POL_SUPPORT_MASKED_REPLAY",
    },
]


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
            "workstreams",
            "objects",
            "fields",
        ):
            value = payload.get(key)
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
    if value is None:
        return ""
    if isinstance(value, bool):
        return "yes" if value else "no"
    if isinstance(value, (list, tuple)):
        return "; ".join(str(item) for item in value)
    return str(value)


def csv_rowify(rows: list[dict[str, Any]]) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for row in rows:
        result.append({key: flatten(value) for key, value in row.items()})
    return result


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    ensure_parent(path)
    csv_rows = csv_rowify(rows)
    if not csv_rows:
        raise SystemExit(f"Refusing to write empty CSV: {path}")
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(csv_rows[0].keys()))
        writer.writeheader()
        writer.writerows(csv_rows)


def escape_cell(value: Any) -> str:
    if isinstance(value, (list, tuple)):
        value = "<br>".join(str(item) for item in value)
    text = str(value)
    return text.replace("|", "\\|")


def render_table(headers: list[str], rows: list[list[Any]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(escape_cell(value) for value in row) + " |")
    return "\n".join(lines)


def assert_prerequisites() -> None:
    required_paths = [
        REQUIREMENT_REGISTRY_PATH,
        AUDIENCE_SURFACE_PATH,
        ROUTE_FAMILY_PATH,
        OBJECT_CATALOG_PATH,
        STATE_MACHINES_PATH,
        EXTERNAL_DEPENDENCIES_PATH,
        REGULATORY_WORKSTREAMS_PATH,
        CHECKLIST_PATH,
    ]
    missing = [str(path) for path in required_paths if not path.exists()]
    if missing:
        raise SystemExit("PREREQUISITE_GAP_SEQ_010: missing required upstream artifacts: " + ", ".join(missing))


def upstream_input_summary() -> dict[str, int]:
    return {
        "requirement_registry_rows": count_jsonl(REQUIREMENT_REGISTRY_PATH),
        "audience_surface_rows": len(load_csv(AUDIENCE_SURFACE_PATH)),
        "route_family_rows": len(load_csv(ROUTE_FAMILY_PATH)),
        "object_catalog_rows": count_payload_items(load_json(OBJECT_CATALOG_PATH)),
        "state_machine_rows": count_payload_items(load_json(STATE_MACHINES_PATH)),
        "external_dependency_rows": count_payload_items(load_json(EXTERNAL_DEPENDENCIES_PATH)),
        "regulatory_workstream_rows": count_payload_items(load_json(REGULATORY_WORKSTREAMS_PATH)),
    }


def object_lookup() -> dict[str, str]:
    payload = load_json(OBJECT_CATALOG_PATH)
    lookup: dict[str, str] = {}
    for row in payload["objects"]:
        lookup[row["canonical_name"]] = row["object_id"]
    return lookup


def route_lookup() -> dict[str, dict[str, str]]:
    return {row["route_family_id"]: row for row in load_csv(ROUTE_FAMILY_PATH)}


def surface_lookup() -> dict[str, dict[str, str]]:
    return {row["surface_id"]: row for row in load_csv(AUDIENCE_SURFACE_PATH)}


def retention_lookup() -> dict[str, dict[str, Any]]:
    return {row.retention_class_ref: asdict(row) for row in RETENTION_CLASSES}


def policy_lookup() -> dict[str, dict[str, Any]]:
    return {row.redaction_policy_ref: asdict(row) for row in REDACTION_POLICIES}


def resolve_object_id(name: str, objects: dict[str, str]) -> str:
    object_id = objects.get(name)
    if not object_id:
        raise SystemExit(f"PREREQUISITE_GAP_SEQ_010: canonical object missing from object catalog: {name}")
    return object_id


def build_audience_purpose_catalog(surface_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, str]] = set()
    rows: list[dict[str, str]] = []
    for row in surface_rows:
        key = (row["audience_tier"], row["purpose_of_use"])
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "audience_tier": row["audience_tier"],
                "purpose_of_use": row["purpose_of_use"],
                "surface_count": str(sum(1 for surface in surface_rows if (surface["audience_tier"], surface["purpose_of_use"]) == key)),
            }
        )
    rows.append(
        {
            "audience_tier": "governance_review",
            "purpose_of_use": "investigation_break_glass",
            "surface_count": "derived_governance_pivot",
        }
    )
    rows.append(
        {
            "audience_tier": "governance_review",
            "purpose_of_use": "audit_export",
            "surface_count": "derived_governance_export",
        }
    )
    return rows


def build_surface_rows(surface_rows: list[dict[str, str]], objects: dict[str, str]) -> list[dict[str, Any]]:
    specs_by_id = {spec.surface_id: spec for spec in SURFACE_POLICIES}
    built_rows: list[dict[str, Any]] = []
    for surface in surface_rows:
        spec = specs_by_id.get(surface["surface_id"])
        if not spec:
            raise SystemExit(f"PREREQUISITE_GAP_SEQ_010: no surface policy mapping for {surface['surface_id']}")
        built_rows.append(
            {
                "classification_row_id": f"CLS_SURFACE_{surface['surface_id'].upper()}",
                "classification_scope": "surface_projection",
                "surface_id": surface["surface_id"],
                "route_family_id": surface["route_family_id"],
                "field_or_artifact_id": surface["surface_id"],
                "canonical_object_id": resolve_object_id(spec.canonical_object_name, objects),
                "field_name_or_artifact_class": surface["surface_name"],
                "sensitivity_class": spec.sensitivity_class,
                "contains_phi": spec.contains_phi,
                "allowed_audience_tiers": [surface["audience_tier"]],
                "allowed_purposes_of_use": [surface["purpose_of_use"]],
                "preview_ceiling": spec.preview_ceiling,
                "detail_ceiling": spec.detail_ceiling,
                "artifact_ceiling": spec.artifact_ceiling,
                "telemetry_ceiling": spec.telemetry_ceiling,
                "log_ceiling": spec.log_ceiling,
                "audit_replay_ceiling": spec.audit_replay_ceiling,
                "redaction_policy_ref": spec.redaction_policy_ref,
                "break_glass_behavior": spec.break_glass_behavior,
                "retention_class_ref_if_artifact": "",
                "materialization_rule": spec.materialization_rule,
                "post_delivery_widening": spec.post_delivery_widening,
                "wrong_patient_hold_behavior": spec.wrong_patient_hold_behavior,
                "source_refs": list(spec.source_refs),
                "notes": spec.notes,
            }
        )
    extra = set(specs_by_id) - {row["surface_id"] for row in surface_rows}
    if extra:
        raise SystemExit("PREREQUISITE_GAP_SEQ_010: orphan surface policy mappings: " + ", ".join(sorted(extra)))
    return built_rows


def build_field_rows(objects: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in FIELD_SPECS:
        rows.append(
            {
                "classification_row_id": f"CLS_FIELD_{spec.field_or_artifact_id}",
                "classification_scope": "field_catalog",
                "surface_id": "",
                "route_family_id": "",
                "field_or_artifact_id": spec.field_or_artifact_id,
                "canonical_object_id": resolve_object_id(spec.canonical_object_name, objects),
                "field_name_or_artifact_class": spec.field_name_or_artifact_class,
                "sensitivity_class": spec.sensitivity_class,
                "contains_phi": spec.contains_phi,
                "allowed_audience_tiers": list(spec.allowed_audience_tiers),
                "allowed_purposes_of_use": list(spec.allowed_purposes_of_use),
                "preview_ceiling": spec.preview_ceiling,
                "detail_ceiling": spec.detail_ceiling,
                "artifact_ceiling": spec.artifact_ceiling,
                "telemetry_ceiling": spec.telemetry_ceiling,
                "log_ceiling": spec.log_ceiling,
                "audit_replay_ceiling": spec.audit_replay_ceiling,
                "redaction_policy_ref": spec.redaction_policy_ref,
                "break_glass_behavior": spec.break_glass_behavior,
                "retention_class_ref_if_artifact": "",
                "materialization_rule": "allowlisted_only",
                "post_delivery_widening": "forbidden",
                "wrong_patient_hold_behavior": "not_applicable",
                "source_refs": list(spec.source_refs),
                "notes": spec.notes,
            }
        )
    return rows


def build_artifact_rows(objects: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in ARTIFACT_SPECS:
        rows.append(
            {
                "classification_row_id": f"CLS_ARTIFACT_{spec.field_or_artifact_id}",
                "classification_scope": "artifact_family",
                "surface_id": "",
                "route_family_id": "",
                "field_or_artifact_id": spec.field_or_artifact_id,
                "canonical_object_id": resolve_object_id(spec.canonical_object_name, objects),
                "field_name_or_artifact_class": spec.field_name_or_artifact_class,
                "sensitivity_class": spec.sensitivity_class,
                "contains_phi": spec.contains_phi,
                "allowed_audience_tiers": list(spec.allowed_audience_tiers),
                "allowed_purposes_of_use": list(spec.allowed_purposes_of_use),
                "preview_ceiling": spec.preview_ceiling,
                "detail_ceiling": spec.detail_ceiling,
                "artifact_ceiling": spec.artifact_ceiling,
                "telemetry_ceiling": spec.telemetry_ceiling,
                "log_ceiling": spec.log_ceiling,
                "audit_replay_ceiling": spec.audit_replay_ceiling,
                "redaction_policy_ref": spec.redaction_policy_ref,
                "break_glass_behavior": spec.break_glass_behavior,
                "retention_class_ref_if_artifact": spec.retention_class_ref_if_artifact,
                "materialization_rule": "allowlisted_only",
                "post_delivery_widening": "forbidden",
                "wrong_patient_hold_behavior": "not_applicable",
                "source_refs": list(spec.source_refs),
                "notes": spec.notes,
            }
        )
    return rows


def build_audit_rows(objects: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in AUDIT_SPECS:
        rows.append(
            {
                "classification_row_id": f"CLS_EVENT_{spec.field_or_artifact_id}",
                "classification_scope": "event_disclosure",
                "surface_id": "",
                "route_family_id": "",
                "field_or_artifact_id": spec.field_or_artifact_id,
                "canonical_object_id": resolve_object_id(spec.canonical_object_name, objects),
                "field_name_or_artifact_class": spec.field_name_or_artifact_class,
                "sensitivity_class": spec.sensitivity_class,
                "contains_phi": spec.contains_phi,
                "allowed_audience_tiers": list(spec.allowed_audience_tiers),
                "allowed_purposes_of_use": list(spec.allowed_purposes_of_use),
                "preview_ceiling": spec.preview_ceiling,
                "detail_ceiling": spec.detail_ceiling,
                "artifact_ceiling": spec.artifact_ceiling,
                "telemetry_ceiling": spec.telemetry_ceiling,
                "log_ceiling": spec.log_ceiling,
                "audit_replay_ceiling": spec.audit_replay_ceiling,
                "redaction_policy_ref": spec.redaction_policy_ref,
                "break_glass_behavior": spec.break_glass_behavior,
                "retention_class_ref_if_artifact": "",
                "materialization_rule": "allowlisted_only",
                "post_delivery_widening": "forbidden",
                "wrong_patient_hold_behavior": "not_applicable",
                "source_refs": list(spec.source_refs),
                "notes": spec.notes,
            }
        )
    return rows


def build_break_glass_payload(objects: dict[str, str]) -> dict[str, Any]:
    return {
        "policy_id": "vecells_break_glass_scope_rules_v1",
        "governing_object_id": resolve_object_id("InvestigationScopeEnvelope", objects),
        "distinct_purpose_of_use": "investigation_break_glass",
        "reason_codes": BREAK_GLASS_REASON_CODES,
        "rules": [asdict(rule) for rule in BREAK_GLASS_RULES],
        "global_principles": [
            "Break-glass is a governed purpose-of-use row, not a role flag.",
            "The same InvestigationScopeEnvelope binds audit search, replay, break-glass review, and export.",
            "Ordinary support, ops, and patient sessions never widen an already materialized payload in place.",
            "Break-glass remains read-only and time-bound through explicit expiry and restore requirements.",
        ],
        "source_refs": [
            "phase-9-the-assurance-ledger.md#9C. Audit explorer, break-glass review, and support replay",
            "phase-0-the-foundation-protocol.md#1.17 VisibilityProjectionPolicy",
        ],
    }


def build_field_catalog_json(
    objects: dict[str, str],
    field_rows: list[dict[str, Any]],
    surface_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    fields = [row for row in field_rows]
    by_object: dict[str, list[dict[str, Any]]] = defaultdict(list)
    surface_links: dict[str, list[str]] = defaultdict(list)
    specs_by_id = {spec.surface_id: spec for spec in SURFACE_POLICIES}
    for surface_row in surface_rows:
        spec = specs_by_id[surface_row["surface_id"]]
        for field_ref in spec.field_refs:
            surface_links[field_ref].append(surface_row["surface_id"])
    for row in fields:
        by_object[row["canonical_object_id"]].append(
            {
                "field_or_artifact_id": row["field_or_artifact_id"],
                "field_name_or_artifact_class": row["field_name_or_artifact_class"],
                "sensitivity_class": row["sensitivity_class"],
                "contains_phi": row["contains_phi"],
                "allowed_audience_tiers": row["allowed_audience_tiers"],
                "allowed_purposes_of_use": row["allowed_purposes_of_use"],
                "preview_ceiling": row["preview_ceiling"],
                "detail_ceiling": row["detail_ceiling"],
                "telemetry_ceiling": row["telemetry_ceiling"],
                "log_ceiling": row["log_ceiling"],
                "audit_replay_ceiling": row["audit_replay_ceiling"],
                "redaction_policy_ref": row["redaction_policy_ref"],
                "break_glass_behavior": row["break_glass_behavior"],
                "surface_refs": sorted(surface_links.get(row["field_or_artifact_id"], [])),
                "source_refs": row["source_refs"],
                "notes": row["notes"],
            }
        )
    return {
        "catalog_id": "vecells_field_sensitivity_catalog_v1",
        "summary": {
            "field_count": len(fields),
            "object_count": len(by_object),
            "sensitivity_class_count": len(SENSITIVITY_CLASSES),
        },
        "sensitivity_classes": [asdict(item) for item in SENSITIVITY_CLASSES],
        "fields": fields,
        "grouped_by_object": dict(sorted(by_object.items())),
    }


def build_artifact_csv_rows(objects: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in ARTIFACT_SPECS:
        rows.append(
            {
                "artifact_class_id": spec.field_or_artifact_id,
                "canonical_object_id": resolve_object_id(spec.canonical_object_name, objects),
                "artifact_class": spec.field_name_or_artifact_class,
                "sensitivity_class": spec.sensitivity_class,
                "contains_phi": spec.contains_phi,
                "allowed_audience_tiers": list(spec.allowed_audience_tiers),
                "allowed_purposes_of_use": list(spec.allowed_purposes_of_use),
                "preview_ceiling": spec.preview_ceiling,
                "detail_ceiling": spec.detail_ceiling,
                "artifact_ceiling": spec.artifact_ceiling,
                "transfer_modes": list(spec.transfer_modes),
                "retention_class_ref": spec.retention_class_ref_if_artifact,
                "redaction_policy_ref": spec.redaction_policy_ref,
                "source_refs": list(spec.source_refs),
                "notes": spec.notes,
            }
        )
    return rows


def build_audit_csv_rows(objects: dict[str, str]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for spec in AUDIT_SPECS:
        rows.append(
            {
                "event_family_id": spec.field_or_artifact_id,
                "canonical_object_id": resolve_object_id(spec.canonical_object_name, objects),
                "event_family_name": spec.field_name_or_artifact_class,
                "allowed_audience_tiers": list(spec.allowed_audience_tiers),
                "allowed_purposes_of_use": list(spec.allowed_purposes_of_use),
                "telemetry_ceiling": spec.telemetry_ceiling,
                "log_ceiling": spec.log_ceiling,
                "audit_replay_ceiling": spec.audit_replay_ceiling,
                "allowed_identifiers": list(spec.allowed_identifiers),
                "prohibited_identifiers": list(spec.prohibited_identifiers),
                "redaction_policy_ref": spec.redaction_policy_ref,
                "source_refs": list(spec.source_refs),
                "notes": spec.notes,
            }
        )
    return rows


def build_redaction_csv_rows() -> list[dict[str, Any]]:
    return [asdict(policy) for policy in REDACTION_POLICIES]


def build_summary(
    matrix_rows: list[dict[str, Any]],
    surface_rows: list[dict[str, Any]],
    field_rows: list[dict[str, Any]],
    artifact_rows: list[dict[str, Any]],
    audit_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    sensitivity_counts = Counter(row["sensitivity_class"] for row in matrix_rows)
    purpose_counts = Counter(row["allowed_purposes_of_use"][0] for row in surface_rows)
    return {
        "matrix_row_count": len(matrix_rows),
        "surface_policy_count": len(surface_rows),
        "field_catalog_count": len(field_rows),
        "artifact_family_count": len(artifact_rows),
        "audit_family_count": len(audit_rows),
        "redaction_policy_count": len(REDACTION_POLICIES),
        "break_glass_rule_count": len(BREAK_GLASS_RULES),
        "retention_class_count": len(RETENTION_CLASSES),
        "phi_bearing_class_count": sum(1 for item in SENSITIVITY_CLASSES if item.phi_profile != "no"),
        "unresolved_gap_count": 0,
        "sensitivity_class_counts": dict(sorted(sensitivity_counts.items())),
        "surface_purpose_counts": dict(sorted(purpose_counts.items())),
    }


def build_bundle() -> dict[str, Any]:
    assert_prerequisites()
    objects = object_lookup()
    surfaces = list(surface_lookup().values())
    matrix_surface_rows = build_surface_rows(surfaces, objects)
    field_rows = build_field_rows(objects)
    artifact_rows = build_artifact_rows(objects)
    audit_rows = build_audit_rows(objects)
    matrix_rows = sorted(
        matrix_surface_rows + field_rows + artifact_rows + audit_rows,
        key=lambda row: row["classification_row_id"],
    )
    payload = {
        "model_id": "vecells_data_classification_model_v1",
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": upstream_input_summary(),
        "summary": build_summary(matrix_rows, matrix_surface_rows, field_rows, artifact_rows, audit_rows),
        "sensitivity_classes": [asdict(item) for item in SENSITIVITY_CLASSES],
        "retention_classes": [asdict(item) for item in RETENTION_CLASSES],
        "audience_purpose_catalog": build_audience_purpose_catalog(surfaces),
        "surface_policy_rows": matrix_surface_rows,
        "field_sensitivity_catalog": build_field_catalog_json(objects, field_rows, matrix_surface_rows),
        "redaction_policy_matrix": [asdict(item) for item in REDACTION_POLICIES],
        "audit_event_disclosure_matrix": build_audit_csv_rows(objects),
        "artifact_sensitivity_matrix": build_artifact_csv_rows(objects),
        "break_glass_scope_rules": build_break_glass_payload(objects),
        "data_classification_matrix": matrix_rows,
        "surface_spec_map": {
            spec.surface_id: {
                "field_refs": list(spec.field_refs),
                "artifact_refs": list(spec.artifact_refs),
                "audit_refs": list(spec.audit_refs),
            }
            for spec in SURFACE_POLICIES
        },
        "synthetic_preview_examples": SYNTHETIC_PREVIEW_EXAMPLES,
        "gaps": [],
    }
    return payload


def render_classification_doc(payload: dict[str, Any]) -> str:
    summary = payload["summary"]
    sensitivity_rows = [
        [
            item["display_name"],
            item["sensitivity_class"],
            item["phi_profile"],
            item["default_projection_posture"],
        ]
        for item in payload["sensitivity_classes"]
    ]
    surface_rows = [
        [
            row["surface_id"],
            row["allowed_audience_tiers"][0],
            row["allowed_purposes_of_use"][0],
            row["preview_ceiling"],
            row["detail_ceiling"],
            row["artifact_ceiling"],
            row["redaction_policy_ref"],
        ]
        for row in payload["surface_policy_rows"]
    ]
    return "\n".join(
        [
            "# 10 Data Classification Model",
            "",
            f"Vecells now has one canonical data-classification model covering {summary['matrix_row_count']} classification rows, {summary['surface_policy_count']} audience-surface policies, {summary['field_catalog_count']} field entries, {summary['artifact_family_count']} artifact families, and {summary['audit_family_count']} audit-event families.",
            "",
            "## Sensitivity Classes",
            "",
            render_table(["Display name", "Code", "PHI profile", "Default projection posture"], sensitivity_rows),
            "",
            "## Audience-Surface Coverage",
            "",
            render_table(["Surface", "Audience", "Purpose", "Preview", "Detail", "Artifact", "Policy"], surface_rows),
            "",
            "## Non-negotiable Closures",
            "",
            "- Minimum-necessary access now resolves before projection materialization, not after browser hydration.",
            "- Previews, detail sections, artifacts, telemetry, logs, replay, and export are treated as separate disclosure surfaces.",
            "- `patient_public`, `patient_grant_scoped`, `patient_authenticated`, and `patient_embedded_authenticated` now compile to distinct rows rather than one broad patient payload.",
            "- Wrong-patient hold explicitly suppresses cached PHI replay and preserves only summary-safe continuity breadcrumbs.",
            "- Break-glass and replay pivot to a separately governed investigation purpose row instead of widening ordinary operational or support sessions in place.",
        ]
    )


def render_masking_doc(payload: dict[str, Any]) -> str:
    policy_rows = [
        [
            row["redaction_policy_ref"],
            row["family_name"],
            row["preview_rule"],
            row["artifact_rule"],
            row["telemetry_rule"],
        ]
        for row in payload["redaction_policy_matrix"]
    ]
    example_rows = [
        [row["label"], row["preview_text"], row["policy_ref"]]
        for row in payload["synthetic_preview_examples"]
    ]
    return "\n".join(
        [
            "# 10 PHI Masking And Redaction Policy",
            "",
            "This pack closes the core masking gaps: no UI-collapse-as-privacy, no preview/detail shared payloads, no widening after browser delivery, and no raw claims, phone numbers, JWTs, or secrets in telemetry or standard logs.",
            "",
            "## Policy Families",
            "",
            render_table(["Policy", "Family", "Preview rule", "Artifact rule", "Telemetry rule"], policy_rows),
            "",
            "## Synthetic Preview Examples",
            "",
            render_table(["Example", "Synthetic text", "Policy"], example_rows),
            "",
            "## Required Behaviors",
            "",
            "- Allowlisted materialization is required on every row.",
            "- Wrong-patient hold demotes cached PHI and suppresses stale replay.",
            "- Embedded channels scrub URL and handoff detail rather than relying on browser capability.",
            "- Support replay remains masked and selected-anchor-bound until restore settlement re-proves live scope.",
        ]
    )


def render_audit_doc(payload: dict[str, Any]) -> str:
    rows = [
        [
            row["event_family_id"],
            row["event_family_name"],
            row["telemetry_ceiling"],
            row["log_ceiling"],
            row["audit_replay_ceiling"],
            "<br>".join(row["prohibited_identifiers"]),
        ]
        for row in payload["audit_event_disclosure_matrix"]
    ]
    return "\n".join(
        [
            "# 10 Audit Posture And Event Disclosure",
            "",
            "Audit, telemetry, and replay now follow one disclosure posture. Standard telemetry and logs keep only PHI-safe descriptors, refs, hashes, and causal identifiers; richer diagnostic evidence requires the audit or investigation scope envelope.",
            "",
            render_table(["Event family", "Name", "Telemetry", "Logs", "Audit / Replay", "Prohibited identifiers"], rows),
            "",
            "## Platform Rules",
            "",
            "- Standard telemetry is sufficient for deterministic replay only through hashes, ids, class codes, and causal tokens.",
            "- Immutable audit, assurance ledger, support replay, and investigation export each stay bound to one current scope envelope.",
            "- Structured logs remain diagnostic only and are not a substitute export surface.",
        ]
    )


def render_break_glass_doc(payload: dict[str, Any]) -> str:
    rules = payload["break_glass_scope_rules"]["rules"]
    reason_rows = [
        [row["reason_code"], row["summary"], "<br>".join(row["allowed_anchor_classes"])]
        for row in payload["break_glass_scope_rules"]["reason_codes"]
    ]
    rule_rows = [
        [
            row["rule_id"],
            row["title"],
            row["distinct_purpose_of_use"],
            row["masking_ceiling_rule"],
            row["expiry_rule"],
        ]
        for row in rules
    ]
    return "\n".join(
        [
            "# 10 Break-Glass And Investigation Scope Rules",
            "",
            "Break-glass is now a governed purpose-of-use row with one `InvestigationScopeEnvelope`, one selected anchor, one diagnostic question, explicit expiry, and read-only restore semantics.",
            "",
            "## Reason Codes",
            "",
            render_table(["Reason code", "Summary", "Allowed anchor classes"], reason_rows),
            "",
            "## Core Rules",
            "",
            render_table(["Rule", "Title", "Purpose row", "Masking ceiling rule", "Expiry rule"], rule_rows),
            "",
            "## Scope Guarantees",
            "",
            "- Ordinary support, ops, and patient sessions do not silently widen into break-glass detail.",
            "- Replay, diff, export, and break-glass share the same selected anchor and masking ceiling.",
            "- Wrong-patient hold invalidates cached PHI and forces revalidation before live resume.",
        ]
    )


def render_retention_doc(payload: dict[str, Any]) -> str:
    retention_rows = [
        [
            row["retention_class_ref"],
            row["display_name"],
            row["disposition_posture"],
            row["export_posture"],
        ]
        for row in payload["retention_classes"]
    ]
    artifact_rows = [
        [
            row["artifact_class_id"],
            row["artifact_class"],
            row["sensitivity_class"],
            row["retention_class_ref"],
            row["artifact_ceiling"],
            "<br>".join(row["transfer_modes"]),
        ]
        for row in payload["artifact_sensitivity_matrix"]
    ]
    return "\n".join(
        [
            "# 10 Retention And Artifact Sensitivity Matrix",
            "",
            "Retention, deletion, archive, and replay evidence are now separate governed artifact families rather than an ordinary document bucket.",
            "",
            "## Retention Classes",
            "",
            render_table(["Class", "Display name", "Disposition posture", "Export posture"], retention_rows),
            "",
            "## Artifact Matrix",
            "",
            render_table(["Artifact", "Name", "Sensitivity", "Retention", "Artifact ceiling", "Transfer modes"], artifact_rows),
            "",
            "## Required Closures",
            "",
            "- Uploads, recordings, transcripts, snapshots, derivation packages, parity witnesses, record artifacts, deletion certificates, archive manifests, and replay bundles each have explicit retention and disclosure posture.",
            "- Deletion certificates and archive manifests stay governance witnesses and are not treated as patient-facing ordinary docs.",
            "- Export posture depends on redaction transforms, admissibility graph completeness, and the active scope envelope.",
        ]
    )


def build_html(payload: dict[str, Any]) -> str:
    safe_json = (
        json.dumps(payload, separators=(",", ":"))
        .replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("</", "<\\/")
    )
    template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vecells Data Classification Atlas</title>
  <link rel="icon" href="data:,">
  <style>
    :root {
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
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body { min-height: 100vh; }
    a { color: inherit; }
    button, select, input {
      font: inherit;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
      color: var(--ink);
    }
    button { cursor: pointer; }
    :focus-visible { outline: var(--focus); outline-offset: 2px; }
    .shell {
      max-width: 1440px;
      margin: 0 auto;
      padding: 20px 32px 40px;
      display: grid;
      gap: 24px;
      grid-template-columns: var(--rail) minmax(0, 1fr);
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .nav {
      position: sticky;
      top: 20px;
      align-self: start;
      display: grid;
      gap: 16px;
    }
    .nav .panel, .content .panel { padding: 20px; }
    .brand {
      min-height: 72px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand svg { flex: none; }
    .brand strong { display: block; font-size: 16px; line-height: 24px; }
    .brand span { display: block; color: var(--muted); font-size: 13px; line-height: 20px; }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .hero h1 { margin: 0 0 12px; font-size: 28px; line-height: 34px; font-weight: 600; }
    .hero p { margin: 0; color: var(--muted); font-size: 14px; line-height: 22px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .stat {
      padding: 14px;
      border: 1px solid rgba(51,92,255,0.12);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(51,92,255,0.08), rgba(15,139,141,0.03));
    }
    .stat strong { display: block; font-size: 24px; line-height: 30px; }
    .stat span { color: var(--muted); font-size: 13px; line-height: 20px; }
    .filters { display: grid; gap: 10px; }
    .filters label { display: grid; gap: 6px; color: var(--muted); font-size: 13px; line-height: 20px; }
    .filters select, .filters input { min-height: 40px; padding: 0 12px; }
    .chip-list, .ladder, .mini-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: var(--chip);
      border: 1px solid var(--border);
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 12px;
      line-height: 18px;
      white-space: nowrap;
    }
    .chip.sensitivity-clinical_sensitive { background: rgba(194,65,65,0.08); color: var(--danger); border-color: rgba(194,65,65,0.22); }
    .chip.sensitivity-patient_identifying, .chip.sensitivity-contact_sensitive { background: rgba(201,137,0,0.08); color: var(--warning); border-color: rgba(201,137,0,0.22); }
    .chip.sensitivity-operational_internal_non_phi { background: rgba(51,92,255,0.08); color: var(--cobalt); border-color: rgba(51,92,255,0.22); }
    .chip.sensitivity-audit_investigation_restricted, .chip.sensitivity-retention_governance_restricted { background: rgba(110,89,217,0.08); color: var(--lavender); border-color: rgba(110,89,217,0.22); }
    .chip.sensitivity-security_or_secret_sensitive, .chip.sensitivity-identity_proof_sensitive { background: rgba(15,139,141,0.08); color: var(--teal); border-color: rgba(15,139,141,0.22); }
    .section-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
    .section-head h2 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; }
    .section-head p { margin: 4px 0 0; color: var(--muted); font-size: 14px; line-height: 22px; }
    .table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; line-height: 20px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #eaecf0; text-align: left; vertical-align: top; }
    th { position: sticky; top: 0; background: #f8fafc; color: var(--muted); font-weight: 600; }
    tbody tr:hover { background: rgba(51,92,255,0.04); }
    tbody tr.is-selected { background: rgba(51,92,255,0.08); }
    .row-button {
      all: unset;
      cursor: pointer;
      display: block;
      width: 100%;
      padding: 0;
      color: inherit;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
    }
    .ladder {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 10px;
    }
    .ladder .step {
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 12px;
      background: linear-gradient(180deg, rgba(51,92,255,0.05), rgba(255,255,255,0.85));
    }
    .ladder .step strong { display: block; font-size: 13px; line-height: 20px; margin-bottom: 6px; }
    .ladder .step span { color: var(--muted); font-size: 12px; line-height: 18px; }
    .empty-state {
      border: 1px dashed var(--border);
      border-radius: 14px;
      padding: 18px;
      color: var(--muted);
      background: #fcfcfd;
    }
    .live-region {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    .synthetic-card {
      border: 1px solid rgba(51,92,255,0.12);
      background: rgba(51,92,255,0.04);
      border-radius: 14px;
      padding: 14px;
    }
    .synthetic-card strong { display: block; font-size: 13px; line-height: 20px; margin-bottom: 8px; }
    .synthetic-card code {
      display: block;
      white-space: pre-wrap;
      background: rgba(18,24,38,0.04);
      border-radius: 10px;
      padding: 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      line-height: 18px;
    }
    @media (max-width: 1080px) {
      .shell { grid-template-columns: minmax(0, 1fr); padding: 16px 20px 28px; }
      .nav { position: static; }
      .hero, .grid-2, .detail-grid { grid-template-columns: minmax(0, 1fr); }
      .ladder { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .hero h1 { font-size: 24px; line-height: 30px; }
      .stats { grid-template-columns: minmax(0, 1fr); }
      .ladder { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media print {
      body { background: #fff; }
      .shell { max-width: none; padding: 0; grid-template-columns: minmax(0, 1fr); }
      .nav { display: none; }
      .panel { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="live-region" aria-live="polite" id="live-region"></div>
  <script type="application/json" id="atlas-data">__EMBEDDED_JSON__</script>
  <div class="shell" data-testid="atlas-shell">
    <aside class="nav" data-testid="atlas-nav">
      <div class="panel">
        <div class="brand">
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="11" cy="12" r="5" fill="#335CFF"></circle>
            <circle cx="26" cy="39" r="5" fill="#0F8B8D"></circle>
            <circle cx="41" cy="12" r="5" fill="#6E59D9"></circle>
            <path d="M14 16 L26 34 L38 16" fill="none" stroke="#121826" stroke-width="3.2" stroke-linecap="round"></path>
          </svg>
          <div>
            <strong>Vecells Masking Atlas</strong>
            <span>Classification, disclosure ladders, and replay-safe posture.</span>
          </div>
        </div>
      </div>
      <div class="panel filters">
        <label>
          Search surfaces
          <input id="search-input" data-testid="search-input" type="search" placeholder="Search by surface, audience, or route">
        </label>
        <label>
          Audience tier
          <select id="audience-filter" data-testid="audience-filter"></select>
        </label>
        <label>
          Purpose of use
          <select id="purpose-filter" data-testid="purpose-filter"></select>
        </label>
        <label>
          Sensitivity class
          <select id="sensitivity-filter" data-testid="sensitivity-filter"></select>
        </label>
      </div>
      <div class="panel">
        <div class="section-head">
          <div>
            <h2>Classes</h2>
            <p>Every class is deliberate. Nothing widens after hydration.</p>
          </div>
        </div>
        <div class="chip-list" id="class-chip-list"></div>
      </div>
    </aside>
    <main class="content">
      <section class="hero panel" data-testid="atlas-hero">
        <div>
          <h1>Disclosure ceilings are compiled, not improvised.</h1>
          <p id="hero-copy"></p>
          <div class="chip-list" id="hero-ribbon"></div>
        </div>
        <div class="stats" id="hero-stats"></div>
      </section>

      <section class="panel">
        <div class="section-head">
          <div>
            <h2>Audience × Surface Matrix</h2>
            <p>Rows are compiled from the audience inventory and one surface policy per live surface.</p>
          </div>
        </div>
        <div class="table-wrap" data-testid="matrix-table">
          <table>
            <thead>
              <tr>
                <th>Surface</th>
                <th>Audience</th>
                <th>Purpose</th>
                <th>Preview</th>
                <th>Detail</th>
                <th>Artifact</th>
                <th>Telemetry</th>
              </tr>
            </thead>
            <tbody id="matrix-body"></tbody>
          </table>
        </div>
      </section>

      <section class="detail-grid">
        <div class="panel" data-testid="field-inspector">
          <div class="section-head">
            <div>
              <h2>Field Inspector</h2>
              <p id="field-summary"></p>
            </div>
          </div>
          <div id="field-list"></div>
        </div>
        <div class="panel" data-testid="artifact-panel">
          <div class="section-head">
            <div>
              <h2>Artifact Panel</h2>
              <p id="artifact-summary"></p>
            </div>
          </div>
          <div id="artifact-list"></div>
        </div>
      </section>

      <section class="grid-2">
        <div class="panel" data-testid="audit-panel">
          <div class="section-head">
            <div>
              <h2>Audit And Replay</h2>
              <p id="audit-summary"></p>
            </div>
          </div>
          <div id="audit-list"></div>
        </div>
        <div class="panel" data-testid="disclosure-ladder">
          <div class="section-head">
            <div>
              <h2>Disclosure Ladder</h2>
              <p>The selected surface shows how disclosure changes across each surface type.</p>
            </div>
          </div>
          <div class="ladder" id="ladder"></div>
        </div>
      </section>

      <section class="panel" data-testid="synthetic-preview">
        <div class="section-head">
          <div>
            <h2>Synthetic Preview Examples</h2>
            <p>Examples use synthetic placeholders only. No live patient data is embedded in this atlas.</p>
          </div>
        </div>
        <div class="grid-2" id="synthetic-list"></div>
      </section>
    </main>
  </div>

  <script>
    const payload = JSON.parse(document.getElementById("atlas-data").textContent);
    const state = {
      search: "",
      audience: "all",
      purpose: "all",
      sensitivity: "all",
      selectedSurfaceId: null,
    };

    const surfaces = payload.surface_policy_rows.map((row) => {
      const source = row;
      const spec = payload.data_classification_matrix.find((item) => item.classification_row_id === row.classification_row_id);
      return {
        ...source,
        route_family_id: row.route_family_id,
      };
    });

    const fieldMap = new Map(payload.field_sensitivity_catalog.fields.map((row) => [row.field_or_artifact_id, row]));
    const artifactMap = new Map(payload.artifact_sensitivity_matrix.map((row) => [row.artifact_class_id, row]));
    const auditMap = new Map(payload.audit_event_disclosure_matrix.map((row) => [row.event_family_id, row]));
    const surfaceSpecMap = new Map(Object.entries(__SURFACE_SPEC_MAP__));

    const els = {
      liveRegion: document.getElementById("live-region"),
      heroCopy: document.getElementById("hero-copy"),
      heroRibbon: document.getElementById("hero-ribbon"),
      heroStats: document.getElementById("hero-stats"),
      classChipList: document.getElementById("class-chip-list"),
      matrixBody: document.getElementById("matrix-body"),
      fieldList: document.getElementById("field-list"),
      artifactList: document.getElementById("artifact-list"),
      auditList: document.getElementById("audit-list"),
      ladder: document.getElementById("ladder"),
      syntheticList: document.getElementById("synthetic-list"),
      fieldSummary: document.getElementById("field-summary"),
      artifactSummary: document.getElementById("artifact-summary"),
      auditSummary: document.getElementById("audit-summary"),
      searchInput: document.getElementById("search-input"),
      audienceFilter: document.getElementById("audience-filter"),
      purposeFilter: document.getElementById("purpose-filter"),
      sensitivityFilter: document.getElementById("sensitivity-filter"),
    };

    const heroStatConfig = [
      ["Classified rows", payload.summary.matrix_row_count],
      ["PHI-bearing classes", payload.summary.phi_bearing_class_count],
      ["Redaction policies", payload.summary.redaction_policy_count],
      ["Unresolved gaps", payload.summary.unresolved_gap_count],
    ];

    function announce(message) {
      els.liveRegion.textContent = "";
      window.setTimeout(() => {
        els.liveRegion.textContent = message;
      }, 20);
    }

    function populateSelect(select, label, values) {
      select.innerHTML = "";
      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value === "all" ? `All ${label}` : value;
        select.appendChild(option);
      });
    }

    function getFilteredSurfaces() {
      const search = state.search.trim().toLowerCase();
      return surfaces.filter((row) => {
        if (state.audience !== "all" && row.allowed_audience_tiers[0] !== state.audience) return false;
        if (state.purpose !== "all" && row.allowed_purposes_of_use[0] !== state.purpose) return false;
        if (state.sensitivity !== "all" && row.sensitivity_class !== state.sensitivity) return false;
        if (!search) return true;
        const haystack = [
          row.surface_id,
          row.field_name_or_artifact_class,
          row.allowed_audience_tiers[0],
          row.allowed_purposes_of_use[0],
          row.route_family_id,
        ].join(" ").toLowerCase();
        return haystack.includes(search);
      });
    }

    function ensureSelection(filtered) {
      if (!filtered.length) {
        state.selectedSurfaceId = null;
        return;
      }
      if (!filtered.some((row) => row.surface_id === state.selectedSurfaceId)) {
        state.selectedSurfaceId = filtered[0].surface_id;
      }
    }

    function selectedSurface(filtered) {
      return filtered.find((row) => row.surface_id === state.selectedSurfaceId) || null;
    }

    function renderHero() {
      els.heroCopy.textContent = `${payload.summary.surface_policy_count} live surfaces now resolve to explicit preview, detail, artifact, telemetry, log, and replay ceilings. Allowlisted materialization, wrong-patient cache suppression, and investigation-scope pivots are part of the compiled model.`;
      els.heroRibbon.innerHTML = "";
      [
        "No UI-collapse-as-privacy",
        "No post-hydration widening",
        "Preview/detail/artifact split",
        "Break-glass purpose row",
        "Wrong-patient cache demotion",
      ].forEach((text) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = text;
        els.heroRibbon.appendChild(chip);
      });
      els.heroStats.innerHTML = "";
      heroStatConfig.forEach(([label, value]) => {
        const card = document.createElement("div");
        card.className = "stat";
        card.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
        els.heroStats.appendChild(card);
      });
    }

    function renderClassChips() {
      els.classChipList.innerHTML = "";
      payload.sensitivity_classes.forEach((row) => {
        const chip = document.createElement("span");
        chip.className = `chip sensitivity-${row.sensitivity_class}`;
        chip.textContent = `${row.display_name} (${row.phi_profile})`;
        els.classChipList.appendChild(chip);
      });
    }

    function renderMatrix(filtered) {
      els.matrixBody.innerHTML = "";
      if (!filtered.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.innerHTML = `<div class="empty-state">No surfaces match the current filters. Try clearing one filter or broadening the search.</div>`;
        tr.appendChild(td);
        els.matrixBody.appendChild(tr);
        return;
      }
      filtered.forEach((row) => {
        const tr = document.createElement("tr");
        if (row.surface_id === state.selectedSurfaceId) tr.className = "is-selected";
        tr.innerHTML = `
          <td><button class="row-button" type="button" data-surface-id="${row.surface_id}">${row.field_name_or_artifact_class}<br><span style="color:var(--muted);font-size:12px;">${row.surface_id}</span></button></td>
          <td>${row.allowed_audience_tiers[0]}</td>
          <td>${row.allowed_purposes_of_use[0]}</td>
          <td>${row.preview_ceiling}</td>
          <td>${row.detail_ceiling}</td>
          <td>${row.artifact_ceiling}</td>
          <td>${row.telemetry_ceiling}</td>
        `;
        els.matrixBody.appendChild(tr);
      });
      els.matrixBody.querySelectorAll("button[data-surface-id]").forEach((button) => {
        button.addEventListener("click", () => {
          state.selectedSurfaceId = button.getAttribute("data-surface-id");
          render();
        });
      });
    }

    function renderFields(surface) {
      els.fieldList.innerHTML = "";
      if (!surface) {
        els.fieldSummary.textContent = "Select a surface to inspect its linked fields.";
        els.fieldList.innerHTML = `<div class="empty-state">No surface selected.</div>`;
        return;
      }
      const surfaceSpec = surfaceSpecMap.get(surface.surface_id);
      const fieldRows = (surfaceSpec?.field_refs || []).map((ref) => fieldMap.get(ref)).filter(Boolean);
      els.fieldSummary.textContent = `${fieldRows.length} linked fields for ${surface.field_name_or_artifact_class}.`;
      if (!fieldRows.length) {
        els.fieldList.innerHTML = `<div class="empty-state">No linked field entries were published for this surface.</div>`;
        return;
      }
      fieldRows.forEach((row) => {
        const div = document.createElement("div");
        div.className = "synthetic-card";
        div.innerHTML = `
          <strong>${row.field_name_or_artifact_class}</strong>
          <div class="chip-list">
            <span class="chip sensitivity-${row.sensitivity_class}">${row.sensitivity_class}</span>
            <span class="chip">Preview: ${row.preview_ceiling}</span>
            <span class="chip">Detail: ${row.detail_ceiling}</span>
            <span class="chip">Telemetry: ${row.telemetry_ceiling}</span>
          </div>
          <p style="margin:10px 0 0;color:var(--muted);font-size:13px;line-height:20px;">${row.notes}</p>
        `;
        els.fieldList.appendChild(div);
      });
    }

    function renderArtifacts(surface) {
      els.artifactList.innerHTML = "";
      if (!surface) {
        els.artifactSummary.textContent = "Select a surface to inspect its linked artifacts.";
        els.artifactList.innerHTML = `<div class="empty-state">No surface selected.</div>`;
        return;
      }
      const surfaceSpec = surfaceSpecMap.get(surface.surface_id);
      const artifactRows = (surfaceSpec?.artifact_refs || []).map((ref) => artifactMap.get(ref)).filter(Boolean);
      els.artifactSummary.textContent = `${artifactRows.length} artifact families apply to ${surface.field_name_or_artifact_class}.`;
      if (!artifactRows.length) {
        els.artifactList.innerHTML = `<div class="empty-state">This surface has no linked artifact families.</div>`;
        return;
      }
      artifactRows.forEach((row) => {
        const transferLabel = (row.transfer_modes || []).join(", ");
        const div = document.createElement("div");
        div.className = "synthetic-card";
        div.innerHTML = `
          <strong>${row.artifact_class}</strong>
          <div class="chip-list">
            <span class="chip sensitivity-${row.sensitivity_class}">${row.sensitivity_class}</span>
            <span class="chip">Surface cap: ${surface.artifact_ceiling}</span>
            <span class="chip">Family contract: ${row.artifact_ceiling}</span>
            <span class="chip">Transfer: ${transferLabel}</span>
            <span class="chip">Retention: ${row.retention_class_ref}</span>
          </div>
          <p style="margin:10px 0 0;color:var(--muted);font-size:13px;line-height:20px;">${row.notes}</p>
        `;
        els.artifactList.appendChild(div);
      });
    }

    function renderAudit(surface) {
      els.auditList.innerHTML = "";
      if (!surface) {
        els.auditSummary.textContent = "Select a surface to inspect its audit, telemetry, and replay posture.";
        els.auditList.innerHTML = `<div class="empty-state">No surface selected.</div>`;
        return;
      }
      const surfaceSpec = surfaceSpecMap.get(surface.surface_id);
      const auditRows = (surfaceSpec?.audit_refs || []).map((ref) => auditMap.get(ref)).filter(Boolean);
      els.auditSummary.textContent = `${auditRows.length} event families and disclosure fences apply to ${surface.field_name_or_artifact_class}.`;
      if (!auditRows.length) {
        els.auditList.innerHTML = `<div class="empty-state">This surface has no linked audit rows.</div>`;
        return;
      }
      auditRows.forEach((row) => {
        const div = document.createElement("div");
        div.className = "synthetic-card";
        div.innerHTML = `
          <strong>${row.event_family_name}</strong>
          <div class="chip-list">
            <span class="chip">Telemetry: ${row.telemetry_ceiling}</span>
            <span class="chip">Logs: ${row.log_ceiling}</span>
            <span class="chip">Replay: ${row.audit_replay_ceiling}</span>
          </div>
          <p style="margin:10px 0 0;color:var(--muted);font-size:13px;line-height:20px;">${row.notes}</p>
        `;
        els.auditList.appendChild(div);
      });
    }

    function renderLadder(surface) {
      els.ladder.innerHTML = "";
      if (!surface) {
        els.ladder.innerHTML = `<div class="empty-state">No ladder available without a selected surface.</div>`;
        return;
      }
      const steps = [
        ["Preview", surface.preview_ceiling],
        ["Detail", surface.detail_ceiling],
        ["Artifact", surface.artifact_ceiling],
        ["Telemetry", surface.telemetry_ceiling],
        ["Logs", surface.log_ceiling],
        ["Replay", surface.audit_replay_ceiling],
      ];
      steps.forEach(([label, value]) => {
        const div = document.createElement("div");
        div.className = "step";
        div.innerHTML = `<strong>${label}</strong><span>${value}</span>`;
        els.ladder.appendChild(div);
      });
    }

    function renderSynthetic() {
      els.syntheticList.innerHTML = "";
      payload.synthetic_preview_examples.forEach((row) => {
        const div = document.createElement("div");
        div.className = "synthetic-card";
        div.innerHTML = `<strong>${row.label}</strong><code>${row.preview_text}</code><p style="margin:10px 0 0;color:var(--muted);font-size:13px;line-height:20px;">Policy: ${row.policy_ref}</p>`;
        els.syntheticList.appendChild(div);
      });
    }

    function render() {
      const filtered = getFilteredSurfaces();
      ensureSelection(filtered);
      const surface = selectedSurface(filtered);
      renderMatrix(filtered);
      renderFields(surface);
      renderArtifacts(surface);
      renderAudit(surface);
      renderLadder(surface);
      announce(`${filtered.length} surface rows visible. ${surface ? surface.field_name_or_artifact_class + " selected." : "No surface selected."}`);
    }

    function initFilters() {
      populateSelect(els.audienceFilter, "audiences", ["all", ...new Set(surfaces.map((row) => row.allowed_audience_tiers[0]))]);
      populateSelect(els.purposeFilter, "purposes", ["all", ...new Set(surfaces.map((row) => row.allowed_purposes_of_use[0]))]);
      populateSelect(els.sensitivityFilter, "sensitivity classes", ["all", ...payload.sensitivity_classes.map((row) => row.sensitivity_class)]);
      els.searchInput.addEventListener("input", (event) => {
        state.search = event.target.value;
        render();
      });
      els.audienceFilter.addEventListener("change", (event) => {
        state.audience = event.target.value;
        render();
      });
      els.purposeFilter.addEventListener("change", (event) => {
        state.purpose = event.target.value;
        render();
      });
      els.sensitivityFilter.addEventListener("change", (event) => {
        state.sensitivity = event.target.value;
        render();
      });
    }

    renderHero();
    renderClassChips();
    renderSynthetic();
    initFilters();
    render();
  </script>
</body>
</html>
"""
    surface_spec_map = {
        spec.surface_id: {
            "field_refs": list(spec.field_refs),
            "artifact_refs": list(spec.artifact_refs),
            "audit_refs": list(spec.audit_refs),
        }
        for spec in SURFACE_POLICIES
    }
    return (
        template.replace("__EMBEDDED_JSON__", safe_json)
        .replace("__SURFACE_SPEC_MAP__", json.dumps(surface_spec_map, separators=(",", ":")))
    )


def write_outputs(payload: dict[str, Any]) -> None:
    write_csv(CLASSIFICATION_MATRIX_PATH, payload["data_classification_matrix"])
    write_json(FIELD_SENSITIVITY_PATH, payload["field_sensitivity_catalog"])
    write_csv(REDACTION_POLICY_PATH, payload["redaction_policy_matrix"])
    write_csv(AUDIT_DISCLOSURE_PATH, payload["audit_event_disclosure_matrix"])
    write_json(BREAK_GLASS_PATH, payload["break_glass_scope_rules"])
    write_csv(ARTIFACT_SENSITIVITY_PATH, payload["artifact_sensitivity_matrix"])

    write_text(CLASSIFICATION_DOC_PATH, render_classification_doc(payload))
    write_text(MASKING_DOC_PATH, render_masking_doc(payload))
    write_text(AUDIT_DOC_PATH, render_audit_doc(payload))
    write_text(BREAK_GLASS_DOC_PATH, render_break_glass_doc(payload))
    write_text(RETENTION_DOC_PATH, render_retention_doc(payload))
    write_text(ATLAS_HTML_PATH, build_html(payload))


def main() -> None:
    payload = build_bundle()
    write_outputs(payload)
    summary = payload["summary"]
    print(
        "Built seq_010 data classification model with "
        f"{summary['matrix_row_count']} matrix rows, "
        f"{summary['surface_policy_count']} surface policies, "
        f"{summary['field_catalog_count']} field entries, "
        f"{summary['artifact_family_count']} artifact families, and "
        f"{summary['audit_family_count']} audit families."
    )


if __name__ == "__main__":
    main()
