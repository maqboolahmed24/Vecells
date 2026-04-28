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
PROMPT_DIR = ROOT / "prompt"

REQUIRED_INPUTS = {
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "integration_divergence_register": DATA_DIR / "integration_divergence_register.csv",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "dependency_watchlist": DATA_DIR / "dependency_watchlist.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

SCORECARDS_MD_PATH = DOCS_DIR / "22_provider_selection_scorecards.md"
MOCK_BRIEFS_MD_PATH = DOCS_DIR / "22_mock_provider_design_briefs.md"
PLAYBOOK_MD_PATH = DOCS_DIR / "22_actual_provider_due_diligence_playbook.md"
RATIONALE_MD_PATH = DOCS_DIR / "22_provider_score_weight_rationale.md"
STUDIO_HTML_PATH = DOCS_DIR / "22_provider_scorecard_studio.html"

SCORECARDS_JSON_PATH = DATA_DIR / "provider_family_scorecards.json"
WEIGHTS_CSV_PATH = DATA_DIR / "provider_dimension_weights.csv"
MOCK_BARS_CSV_PATH = DATA_DIR / "mock_provider_minimum_bars.csv"
ACTUAL_KILLS_CSV_PATH = DATA_DIR / "actual_provider_kill_switches.csv"
QUESTIONS_CSV_PATH = DATA_DIR / "provider_due_diligence_questions.csv"

MISSION = (
    "Create the definitive provider-family evaluation framework for identity, telephony, "
    "notifications, GP/IM1 booking suppliers, and pharmacy boundaries, explicitly separating "
    "mock-now quality bars from later live-provider admissibility."
)

VISUAL_MODE = "Provider_Atelier"

SOURCE_PRECEDENCE = [
    "prompt/022.md",
    "prompt/shared_operating_contract_021_to_025.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/phase-2-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-5-the-network-horizon.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/phase-9-the-assurance-ledger.md",
    "blueprint/forensic-audit-findings.md",
    "blueprint/blueprint-init.md",
    "data/analysis/external_dependencies.json",
    "data/analysis/dependency_watchlist.json",
    "data/analysis/master_risk_register.json",
    "data/analysis/integration_priority_matrix.json",
    "data/analysis/integration_divergence_register.csv",
]

ROLE_PRIORITY = {
    "baseline_mock_required": 0,
    "baseline_required": 1,
    "optional_flagged": 2,
    "deferred_channel": 3,
    "future_optional": 4,
    "prohibited": 5,
}

LANE_PRIORITY = {
    "mock_now": 0,
    "hybrid_mock_then_live": 1,
    "actual_later": 2,
    "deferred": 3,
}

ALLOWED_DIMENSION_CLASSES = {
    "capability",
    "proof_truth",
    "ambiguity_handling",
    "security",
    "privacy",
    "compliance",
    "onboarding_friction",
    "sandbox_quality",
    "test_data_quality",
    "observability",
    "operational_support",
    "cost_governance",
    "portability",
    "resilience",
    "ui_brand_constraints",
    "mock_fidelity",
}

MANDATORY_PROVIDER_FAMILIES = {
    "identity_auth",
    "telephony_voice_and_recording",
    "notifications_sms",
    "notifications_email",
    "gp_im1_and_booking_supplier",
    "pharmacy_directory",
    "pharmacy_dispatch_transport",
    "pharmacy_outcome_observation",
}

HTML_MARKERS = [
    'data-testid="provider-scorecard-shell"',
    'data-testid="provider-family-ribbon"',
    'data-testid="provider-dimension-rail"',
    'data-testid="provider-comparison-canvas"',
    'data-testid="provider-dimension-table"',
    'data-testid="provider-inspector"',
    'data-testid="provider-brief-summary"',
    'data-testid="provider-question-bank"',
    'data-testid="provider-risk-notes"',
]

SCORE_SCALE = {
    "minimum": 0,
    "maximum": 5,
    "labels": {
        "0": "not demonstrated",
        "1": "placeholder only",
        "2": "partial or unsafe",
        "3": "adequate with bounded risk",
        "4": "strong and reusable",
        "5": "blueprint-grade and proven",
    },
    "formula": {
        "qualified_mock_now": "Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.",
        "qualified_actual_later": "Every dimension must meet minimum_bar_actual_later and no actual-provider kill-switch may trip.",
        "weighted_score": "sum(provider_rating * lane_weight) / sum(lane_weight) * 100",
    },
}

DIMENSIONS = [
    {
        "dimension_id": "contract_shape",
        "dimension_title": "Capability And Tuple Coverage",
        "dimension_class": "capability",
        "mock_default_weight": 10,
        "actual_default_weight": 10,
        "mock_default_bar": 4,
        "actual_default_bar": 4,
        "mock_evidence": [
            "State and action-scope matrix for {family_title} covering {family_focus}.",
            "Contract-test pack proving Vecells reads only the adapter-bound tuple for {family_scope}.",
        ],
        "actual_evidence": [
            "Provider API or callback contract pack showing how {family_scope} maps into one Vecells adapter boundary.",
            "Evidence that unsupported states are explicit rather than inferred from supplier-local success labels.",
        ],
        "mock_kill": "Reject the mock if it collapses capability, route tuple, or actor scope into a generic success flow.",
        "actual_kill": "Reject the provider if Vecells would need supplier-specific business logic outside the published adapter contract.",
        "question": "Which exact contract artifacts prove that {family_title} can express the full Vecells capability tuple without hidden provider behavior?",
        "notes": "Capability evaluation must stay in the Vecells core and may not escape into provider-specific semantics.",
    },
    {
        "dimension_id": "authoritative_truth",
        "dimension_title": "Authoritative Truth Separation",
        "dimension_class": "proof_truth",
        "mock_default_weight": 12,
        "actual_default_weight": 12,
        "mock_default_bar": 5,
        "actual_default_bar": 5,
        "mock_evidence": [
            "Simulator evidence showing accepted transport, pending proof, disputed proof, and authoritative confirmation as separate states for {family_scope}.",
            "Replay-safe ledger trace proving patient-visible or staff-visible calmness waits for the correct proof class.",
        ],
        "actual_evidence": [
            "Provider evidence pack proving transport acceptance and authoritative truth remain distinct for {family_scope}.",
            "Operational proof showing authoritative confirmation or durable observation is available to contract tests and audits.",
        ],
        "mock_kill": "Reject the mock if provider acceptance or webhook arrival is treated as authoritative truth.",
        "actual_kill": "Reject the provider if it cannot represent authoritative truth separately from accepted transport or local acknowledgement.",
        "question": "How does the provider distinguish accepted transport, intermediate pending states, and authoritative truth for {family_scope}?",
        "notes": "No provider family may pass without explicit proof-truth semantics.",
    },
    {
        "dimension_id": "ambiguity_handling",
        "dimension_title": "Ambiguity And Partial Failure Semantics",
        "dimension_class": "ambiguity_handling",
        "mock_default_weight": 11,
        "actual_default_weight": 11,
        "mock_default_bar": 5,
        "actual_default_bar": 5,
        "mock_evidence": [
            "Fault-injection cases for stale, contradictory, duplicated, replayed, and out-of-order events within {family_scope}.",
            "Projection evidence proving ambiguous or degraded states stay open and block calm copy where required.",
        ],
        "actual_evidence": [
            "Provider docs or sandbox evidence showing duplicate, replay, delayed, contradictory, or missing events can be detected and reconciled.",
            "Evidence that operators can inspect and recover ambiguous {family_scope} states without vendor-side guesswork.",
        ],
        "mock_kill": "Reject the mock if contradictory or weak evidence collapses into silent retry or silent success.",
        "actual_kill": "Reject the provider if failure semantics are opaque or if ambiguity cannot be surfaced for review.",
        "question": "What concrete evidence shows the provider exposes partial failure, contradiction, and replay semantics for {family_scope} instead of hiding them?",
        "notes": "Opaque ambiguity handling is a hard architectural failure, not a scoring nicety.",
    },
    {
        "dimension_id": "security_replay",
        "dimension_title": "Security, Authentication, And Replay Control",
        "dimension_class": "security",
        "mock_default_weight": 9,
        "actual_default_weight": 10,
        "mock_default_bar": 4,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Threat-model and contract tests for signed callbacks, nonce or state handling, replay protection, and environment isolation around {family_scope}.",
            "Evidence that browser-to-provider direct calls are impossible for this family.",
        ],
        "actual_evidence": [
            "Security docs showing webhook authentication, key rotation, replay protection, and environment isolation for {family_scope}.",
            "Evidence that the provider does not require browser egress or client-side secrets for the protected path.",
        ],
        "mock_kill": "Reject the mock if it permits direct browser calls, token reuse, or unverified callbacks.",
        "actual_kill": "Reject the provider if replay protection, callback authenticity, or environment isolation are inadequate.",
        "question": "What evidence proves replay protection, callback authenticity, and environment isolation for {family_scope}?",
        "notes": "Security control evidence must remain compatible with future secret ownership and vault-ingest law.",
    },
    {
        "dimension_id": "privacy_residency",
        "dimension_title": "Privacy, Residency, And Subprocessor Transparency",
        "dimension_class": "privacy",
        "mock_default_weight": 7,
        "actual_default_weight": 9,
        "mock_default_bar": 3,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Synthetic-data-only fixture pack for {family_scope} with explicit PHI exclusion and redaction traces.",
            "Mock data-retention statement describing what is persisted and why.",
        ],
        "actual_evidence": [
            "UK residency, subprocessor, retention, and deletion evidence for {family_scope}.",
            "Data-flow explanation showing what patient or event data leaves Vecells and on what legal or contractual basis.",
        ],
        "mock_kill": "Reject the mock if it encourages real credentials, real patient data, or uncontrolled retention.",
        "actual_kill": "Reject the provider if residency, subprocessor scope, or deletion posture are unclear or incompatible.",
        "question": "Which evidence proves residency, retention, subprocessor scope, and minimal data disclosure for {family_scope}?",
        "notes": "Mock-now uses synthetic data, but actual-later must still preserve the same disclosure boundaries.",
    },
    {
        "dimension_id": "healthcare_compliance",
        "dimension_title": "UK Healthcare Compliance And Assurance Readiness",
        "dimension_class": "compliance",
        "mock_default_weight": 6,
        "actual_default_weight": 10,
        "mock_default_bar": 3,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Mock contract note describing which assurance or standards obligations the family must later satisfy.",
            "Evidence map linking {family_scope} to the relevant NHS or clinical-safety posture without claiming live approval.",
        ],
        "actual_evidence": [
            "Current assurance, clinical-safety, or onboarding evidence required for {family_scope}.",
            "Evidence that the provider can support the controls Vecells must later attest under NHS, DSPT, DCB, or partner law.",
        ],
        "mock_kill": "Reject the mock if it implies live approval or hides later assurance obligations.",
        "actual_kill": "Reject the provider if compliance posture is incompatible or cannot be evidenced for audit.",
        "question": "What current compliance or assurance evidence exists for {family_scope}, and what is still blocked on later approvals?",
        "notes": "Actual-provider acceptance is blocked until the compliance evidence pack exists and matches the architecture.",
    },
    {
        "dimension_id": "onboarding_and_sponsorship",
        "dimension_title": "Onboarding Friction And Sponsor Burden",
        "dimension_class": "onboarding_friction",
        "mock_default_weight": 4,
        "actual_default_weight": 9,
        "mock_default_bar": 2,
        "actual_default_bar": 3,
        "mock_evidence": [
            "Explicit statement of which onboarding steps are intentionally deferred for {family_scope}.",
            "Task linkage showing how the mock keeps engineering moving while live approval waits.",
        ],
        "actual_evidence": [
            "Named sponsor, approval, legal, and procurement prerequisites for {family_scope}.",
            "Environment, account, and credential intake checklist with manual approvals and blockers called out.",
        ],
        "mock_kill": "Reject the mock if it pretends onboarding does not matter or hides later human approvals.",
        "actual_kill": "Reject the provider if critical approvals, sponsor paths, or account prerequisites are undefined.",
        "question": "What sponsor, legal, or approval prerequisites exist before {family_scope} can move from simulator to live onboarding?",
        "notes": "Actual-provider strategy weights this heavily because onboarding latency can distort programme order if left implicit.",
    },
    {
        "dimension_id": "sandbox_depth",
        "dimension_title": "Sandbox Depth And Environment Isolation",
        "dimension_class": "sandbox_quality",
        "mock_default_weight": 12,
        "actual_default_weight": 8,
        "mock_default_bar": 5,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Simulator runbook proving every critical state, callback, and error path for {family_scope} exists in a deterministic local environment.",
            "Evidence that dev, test, and later-live behavior are separated without changing contract shape.",
        ],
        "actual_evidence": [
            "Sandbox or pre-prod evidence showing the provider can exercise the needed control-plane semantics for {family_scope}.",
            "Environment-isolation rules proving redirect URIs, sender IDs, mailboxes, or endpoints do not cross environments.",
        ],
        "mock_kill": "Reject the mock if the sandbox misses states that drive patient-visible truth, safety, or control-plane decisions.",
        "actual_kill": "Reject the provider if its sandbox is too shallow to verify the required semantics before go-live.",
        "question": "Which sandbox or simulator flows prove the family can exercise the blueprint-critical states for {family_scope} before live credentials exist?",
        "notes": "Mock-now cares about full state coverage, not a thin happy-path stub.",
    },
    {
        "dimension_id": "test_data_fidelity",
        "dimension_title": "Test Data And Synthetic Fixture Quality",
        "dimension_class": "test_data_quality",
        "mock_default_weight": 10,
        "actual_default_weight": 8,
        "mock_default_bar": 4,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Synthetic fixture set for {family_scope} covering nominal, degraded, replay, stale, and blocked paths.",
            "Contract-test evidence that fixture data preserves identifiers, timestamps, and hashes needed for Vecells logic.",
        ],
        "actual_evidence": [
            "Sandbox test-data docs showing whether the provider can reproduce the edge cases Vecells needs for {family_scope}.",
            "Evidence that test identities, records, or dispatch references can be reset or rotated safely.",
        ],
        "mock_kill": "Reject the mock if fixture data cannot reproduce the states that later drive calmness, closure, or recovery.",
        "actual_kill": "Reject the provider if test data cannot reproduce the required control-plane and failure semantics.",
        "question": "How will the provider or simulator supply deterministic test data for {family_scope}, including degraded and replay cases?",
        "notes": "Weak test data quality usually hides real integration risk until too late in the programme.",
    },
    {
        "dimension_id": "observability_and_audit",
        "dimension_title": "Observability, Audit, And Replay Support",
        "dimension_class": "observability",
        "mock_default_weight": 8,
        "actual_default_weight": 9,
        "mock_default_bar": 3,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Event trace or audit view for {family_scope} showing correlation IDs, proof upgrades, and replay handling.",
            "Evidence that the simulator preserves the same diagnostic fields later live adapters will need.",
        ],
        "actual_evidence": [
            "Provider observability or audit artifacts showing correlation IDs, delivery or callback logs, and replay-friendly evidence.",
            "Evidence that support and incident teams can inspect {family_scope} without relying on hidden provider dashboards alone.",
        ],
        "mock_kill": "Reject the mock if it removes the audit or replay evidence later diagnostics will rely on.",
        "actual_kill": "Reject the provider if audit, replay, or diagnostic support is too weak to prove control-plane behavior.",
        "question": "What logs, audit trails, and replay evidence exist for {family_scope}, and can Vecells access them when incidents occur?",
        "notes": "Observability must support both runtime diagnosis and later assurance evidence generation.",
    },
    {
        "dimension_id": "operational_support",
        "dimension_title": "Operational Support And Incident Handling",
        "dimension_class": "operational_support",
        "mock_default_weight": 7,
        "actual_default_weight": 9,
        "mock_default_bar": 3,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Runbook excerpt explaining who owns degraded or disputed {family_scope} states in the mock and how they are repaired.",
            "Simulator evidence for escalation, reset, or manual-review paths.",
        ],
        "actual_evidence": [
            "Support model, incident routing, escalation path, and recovery SLA for {family_scope}.",
            "Evidence that disputes, resets, or reconciliations can be handled without vendor lock-in to one operator workflow.",
        ],
        "mock_kill": "Reject the mock if degraded paths exist with no clear recovery owner or operator action.",
        "actual_kill": "Reject the provider if support or incident handling cannot sustain the required service posture.",
        "question": "Which operational support and incident pathways exist for {family_scope}, and how do they interact with Vecells' own recovery model?",
        "notes": "Later live-provider acceptance is not just about APIs; it is about the operational recovery contract too.",
    },
    {
        "dimension_id": "commercial_and_lock_in",
        "dimension_title": "Cost Governance And Lock-In Control",
        "dimension_class": "cost_governance",
        "mock_default_weight": 3,
        "actual_default_weight": 6,
        "mock_default_bar": 2,
        "actual_default_bar": 3,
        "mock_evidence": [
            "Statement that the simulator keeps commercial assumptions out of the core contract for {family_scope}.",
            "Evidence that the mock does not hard-code one future vendor decision.",
        ],
        "actual_evidence": [
            "Commercial model, minimum term, price-break risk, and usage assumptions for {family_scope}.",
            "Exit-cost or migration evidence showing how future replacement remains feasible.",
        ],
        "mock_kill": "Reject the mock if it bakes one vendor's commercial model into the product contract.",
        "actual_kill": "Reject the provider if lock-in or pricing posture would undermine later portability or roadmap freedom.",
        "question": "What commercial or lock-in constraints would shape how {family_scope} can evolve after onboarding?",
        "notes": "Commercial ease cannot override truth, safety, audit, or portability law.",
    },
    {
        "dimension_id": "portability_and_exit",
        "dimension_title": "Portability And Adapter Exit Posture",
        "dimension_class": "portability",
        "mock_default_weight": 6,
        "actual_default_weight": 8,
        "mock_default_bar": 3,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Adapter boundary proof showing the simulator can be swapped without changing Vecells core logic for {family_scope}.",
            "Evidence that state, hashes, or identifiers are not tied to one provider-local meaning.",
        ],
        "actual_evidence": [
            "Provider contract or docs proving identifiers, callbacks, or artifacts can be normalized without irreversible lock-in.",
            "Migration or replacement strategy showing how Vecells would exit the provider without rewriting product logic.",
        ],
        "mock_kill": "Reject the mock if identifiers, proof objects, or UX copy become inseparable from one supplier model.",
        "actual_kill": "Reject the provider if replacement would force core lifecycle logic to be rewritten.",
        "question": "What evidence proves {family_scope} remains portable and adapter-bound if the provider must later be replaced?",
        "notes": "Portability guards against direct supplier coupling and protects later provider changes.",
    },
    {
        "dimension_id": "degraded_mode_resilience",
        "dimension_title": "Resilience And Degraded-Mode Compatibility",
        "dimension_class": "resilience",
        "mock_default_weight": 9,
        "actual_default_weight": 10,
        "mock_default_bar": 4,
        "actual_default_bar": 4,
        "mock_evidence": [
            "Simulator evidence showing stale, partial, or blocked {family_scope} states degrade through the published recovery posture.",
            "Same-shell or same-control-plane recovery proof for the affected user or operator path.",
        ],
        "actual_evidence": [
            "Provider outage, latency, or partial failure evidence showing Vecells can degrade safely when {family_scope} is unhealthy.",
            "Evidence that the provider does not force silent success or bypass the declared degradation profile.",
        ],
        "mock_kill": "Reject the mock if degraded or stale states are absent or if recovery posture diverges from the blueprint.",
        "actual_kill": "Reject the provider if outage or partial-failure behavior cannot support the declared degraded mode.",
        "question": "How does {family_scope} behave under outage, latency, or partial failure, and can Vecells preserve the declared degraded-mode contract?",
        "notes": "Degraded-mode law is part of the provider scorecard, not an afterthought.",
    },
    {
        "dimension_id": "experience_and_brand_constraints",
        "dimension_title": "UI / Brand / Interaction Constraints",
        "dimension_class": "ui_brand_constraints",
        "mock_default_weight": 5,
        "actual_default_weight": 6,
        "mock_default_bar": 3,
        "actual_default_bar": 3,
        "mock_evidence": [
            "Simulator screens or artifacts showing any provider-imposed UI or message constraints for {family_scope}.",
            "Evidence that Vecells can preserve quiet, accurate copy without hiding provider-mandated interaction rules.",
        ],
        "actual_evidence": [
            "Provider UX, branding, sender, redirect, or consent constraints for {family_scope}.",
            "Evidence that provider-specific UI constraints do not force unsafe or misleading patient-facing wording.",
        ],
        "mock_kill": "Reject the mock if it hides provider-driven interaction constraints that later affect UX truth.",
        "actual_kill": "Reject the provider if required UX or branding constraints would force misleading or non-compliant flows.",
        "question": "What provider-driven UI, sender, redirect, or brand constraints exist for {family_scope}, and how will Vecells preserve truthful UX within them?",
        "notes": "Interaction constraints matter when they change calmness, redirect safety, or patient expectations.",
    },
    {
        "dimension_id": "simulator_fidelity",
        "dimension_title": "Simulator Fidelity And State Coverage",
        "dimension_class": "mock_fidelity",
        "mock_default_weight": 12,
        "actual_default_weight": 5,
        "mock_default_bar": 5,
        "actual_default_bar": 3,
        "mock_evidence": [
            "Named state inventory for {family_scope} covering happy, degraded, replayed, stale, and blocked paths.",
            "Playwright or contract-test evidence proving the simulator drives real product logic instead of a toy stub.",
        ],
        "actual_evidence": [
            "Evidence that the live-provider plan can preserve simulator parity and contract tests as onboarding advances.",
            "Mapping showing how live sandbox states compare with the already-approved simulator states for {family_scope}.",
        ],
        "mock_kill": "Reject the mock if it omits states that later drive patient-visible truth, safety, or closure behavior.",
        "actual_kill": "Reject the provider if onboarding would break simulator parity or invalidate the approved contract tests.",
        "question": "Which states must the simulator preserve for {family_scope}, and how will live onboarding maintain parity with them?",
        "notes": "This dimension exists specifically to prevent mock providers from becoming oversimplified placeholders.",
    },
]

FAMILY_SPECS = {
    "identity_auth": {
        "title": "Identity / Authentication",
        "accent": "#335CFF",
        "integration_ids": ("int_identity_nhs_login_core",),
        "focus": "OIDC authorize/token/userinfo/logout, vector-of-trust, step-up, consent-declined recovery, redirect-URI isolation, and callback replay fences",
        "family_scope": "the NHS login identity rail",
        "extra_source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2A. Trust contract and capability gates",
            "blueprint/phase-2-the-identity-and-echoes.md#2B. NHS login bridge and local session engine",
            "blueprint/blueprint-init.md#10. Identity, consent, security, and policy",
        ],
        "mock_brief": [
            "Expose authorize, token, userinfo, and logout endpoints with frozen scope bundles and strict redirect-URI registration per environment.",
            "Model vector-of-trust, insufficient-assurance, consent-declined, replayed callback, expired transaction, and stale return-intent outcomes as first-class states.",
            "Force route-intent and session-establishment law through one simulator contract so signed-in, read-only, claim-pending, writable, and bounded-recovery states remain distinct.",
            "Keep mock claims synthetic; never let the simulator imply PDS enrichment or IM1 linkage is part of baseline identity authority.",
        ],
        "placeholder_only": [
            "real client IDs",
            "real redirect URIs",
            "real JWT signing keys",
        ],
        "never_authoritative": [
            "mock callback success alone",
            "synthetic claims outside route-intent and binding fences",
        ],
        "actual_gates": [
            "Later live submission is blocked until seq_023, seq_024, and seq_025 freeze secret ownership, partner access, and redirect-URI environment law.",
            "Live provider choice may not outrun route-intent binding, session-rotation, or insufficient-assurance recovery evidence.",
        ],
        "extra_task_refs": ("seq_023", "seq_024", "seq_025"),
    },
    "telephony_voice_and_recording": {
        "title": "Telephony / IVR / Recording",
        "accent": "#0EA5A4",
        "integration_ids": ("int_telephony_capture_evidence_backplane",),
        "focus": "call-session lifecycle, webhook ordering, recording availability, transcript readiness, evidence readiness, urgent-live preemption, and bounded SMS continuation handoff",
        "family_scope": "telephony voice capture, recording, and transcript processing",
        "extra_source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2E. Telephony edge, IVR choreography, and call-session persistence",
            "blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
            "blueprint/forensic-audit-findings.md#Finding 2 - Telephony urgent branch did not enforce evidence readiness",
        ],
        "mock_brief": [
            "Emulate call started, menu selected, recording expected, recording available, evidence pending, continuation eligible, manual review, evidence ready, and closed states.",
            "Support out-of-order webhooks, duplicate receipts, missing recordings, degraded transcript coverage, and urgent-live preemption without flattening the state machine.",
            "Keep transcript readiness separate from evidence readiness and preserve challenge versus seeded continuation paths.",
            "Make recording, transcript, and artifact-safety evidence visible to contract tests and Playwright flows before any real carrier or recorder account exists.",
        ],
        "placeholder_only": [
            "real caller numbers",
            "real recordings",
            "real provider account identifiers",
        ],
        "never_authoritative": [
            "webhook arrival alone",
            "recording available alone",
            "transcript ready alone",
        ],
        "actual_gates": [
            "Live onboarding is blocked until seq_023 plus later vendor account tasks freeze secret, account, and artifact-safety posture.",
            "Carrier or recorder procurement may not lower the evidence-readiness or urgent-preemption fidelity bar already proven in the simulator.",
        ],
        "extra_task_refs": ("seq_023", "seq_031", "seq_032", "seq_034", "seq_035"),
    },
    "notifications_sms": {
        "title": "Notifications / SMS",
        "accent": "#7C3AED",
        "integration_ids": ("int_sms_continuation_delivery",),
        "focus": "queued, delayed, bounced, disputed, expired, and wrong-recipient-sensitive SMS delivery for seeded and challenge continuation flows",
        "family_scope": "the SMS continuation delivery rail",
        "extra_source_refs": [
            "blueprint/phase-2-the-identity-and-echoes.md#2F. Caller verification, voice capture, transcript stub, and SMS continuation",
            "blueprint/forensic-audit-findings.md#Finding 27 - Notification delivery lacked acknowledgement and dispute semantics",
        ],
        "mock_brief": [
            "Simulate accepted, queued, delayed, bounced, expired, and disputed delivery results with explicit callback authenticity.",
            "Preserve seeded versus challenge continuation differences and never let provider acceptance imply grant redemption or verified reachability.",
            "Model wrong-recipient and stale-grant protection paths so the same recovery posture is exercised before real SMS spend exists.",
            "Keep SMS optional-flagged in programme terms even while the simulator preserves the full contract.",
        ],
        "placeholder_only": [
            "real sender IDs",
            "real phone numbers",
        ],
        "never_authoritative": [
            "accepted send",
            "queued provider message",
        ],
        "actual_gates": [
            "SMS remains optional-flagged and may not outrank identity or booking truth seams during live onboarding.",
            "Live sender registration and wrong-recipient governance are required before any real send path is admissible.",
        ],
        "extra_task_refs": ("seq_023", "seq_031", "seq_033", "seq_039", "seq_040"),
    },
    "notifications_email": {
        "title": "Notifications / Email",
        "accent": "#7C3AED",
        "integration_ids": ("int_email_notification_delivery",),
        "focus": "accepted, delivered, bounced, disputed, delayed, and expired email delivery for secure-link and reassurance flows",
        "family_scope": "the email and secure-link delivery rail",
        "extra_source_refs": [
            "blueprint/blueprint-init.md#6. Booking and access continuity",
            "blueprint/forensic-audit-findings.md#Finding 27 - Notification delivery lacked acknowledgement and dispute semantics",
        ],
        "mock_brief": [
            "Simulate accepted, queued, delivered, bounced, disputed, and expired delivery chains with webhook authenticity and template versioning.",
            "Keep secure-link authority separate from delivery evidence so the product never treats a sent email as a redeemed grant.",
            "Model quiet degraded posture and failed-delivery repair instead of generic success banners.",
            "Preserve sender-domain and template constraints so later provider selection cannot surprise the UX layer.",
        ],
        "placeholder_only": [
            "real sender domains",
            "real mailbox credentials",
        ],
        "never_authoritative": [
            "accepted send",
            "mailbox delivery alone",
        ],
        "actual_gates": [
            "Live onboarding waits for seq_023 plus provider account strategy and sender verification work.",
            "Delivery evidence must remain distinct from secure-link or communication truth when live providers are later compared.",
        ],
        "extra_task_refs": ("seq_023", "seq_031", "seq_033", "seq_039", "seq_040"),
    },
    "gp_im1_and_booking_supplier": {
        "title": "GP / IM1 / Booking Supplier",
        "accent": "#1456D8",
        "integration_ids": ("int_im1_pairing_and_capability_prereq", "int_local_booking_provider_truth"),
        "focus": "ProviderCapabilityMatrix, supplier and integration-mode variance, slot search snapshots, revalidation, async confirmation truth, and stale capability drift",
        "family_scope": "GP-system pairing and local booking supplier boundaries",
        "extra_source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.13A ProviderCapabilityMatrix",
            "blueprint/phase-0-the-foundation-protocol.md#1.13B BookingProviderAdapterBinding",
            "blueprint/phase-4-the-booking-engine.md#4B. Provider capability matrix and adapter seam",
            "blueprint/phase-4-the-booking-engine.md#4C. Slot search, normalisation, and availability snapshots",
            "blueprint/phase-4-the-booking-engine.md#4E. Commit path, revalidation, booking record, and compensation",
        ],
        "mock_brief": [
            "Model supplier, integration mode, deployment type, local-consumer requirement, and audience scope as first-class capability tuples.",
            "Preserve slot search partial coverage, stale snapshots, revalidation failure, truthful nonexclusive versus held reservations, and confirmation-pending versus confirmed truth.",
            "Support compensation, stale candidate rejection, and manage-freeze behavior without assuming one supplier path.",
            "Make the simulator stronger than ordinary vendor sandboxes so booking truth is proven before real pairing and portal work exists.",
        ],
        "placeholder_only": [
            "real practice identifiers",
            "real supplier credentials",
            "real patient booking records",
        ],
        "never_authoritative": [
            "search results alone",
            "provider 202-style acceptance",
            "historic feature flags",
        ],
        "actual_gates": [
            "Live onboarding stays blocked until seq_023, seq_026, and seq_036 freeze secret posture, pairing prerequisites, and provider evidence paths.",
            "No supplier may be selected if it forces ranking, fallback choice, or confirmation truth into supplier-local behavior.",
        ],
        "extra_task_refs": ("seq_023", "seq_026", "seq_036", "seq_038", "seq_039", "seq_040"),
    },
    "pharmacy_directory": {
        "title": "Pharmacy Directory / Choice",
        "accent": "#0F9D58",
        "integration_ids": ("int_pharmacy_directory_and_choice",),
        "focus": "directory snapshot freshness, opening hours, warned-choice states, no-safe-choice conditions, selection binding hashes, and consent reset on drift",
        "family_scope": "pharmacy directory and patient-choice discovery",
        "extra_source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6C. Pharmacy discovery, provider choice, and directory abstraction",
            "blueprint/forensic-audit-findings.md#Finding 36 - Pharmacy discovery lacked live directory constraints",
        ],
        "mock_brief": [
            "Simulate fresh, stale, withdrawn, and zero-provider directory states together with opening-hours and suitability filters.",
            "Preserve visible-choice-set hashes, warned-choice explanations, no-safe-choice states, and consent reset when provider or pathway drift occurs.",
            "Prevent the simulator from presenting a hidden default provider or fake full choice.",
            "Keep real pharmacy names and addresses out of the repository while preserving the exact choice contract.",
        ],
        "placeholder_only": [
            "real pharmacy names",
            "real pharmacy addresses",
        ],
        "never_authoritative": [
            "legacy lookup heuristics",
            "directory row without frozen choice proof",
        ],
        "actual_gates": [
            "Live directory access remains later work and may not be treated as a current-baseline blocker while the choice contract is being built.",
            "No provider may be admitted if the source cannot sustain real patient choice and warned-choice behavior.",
        ],
        "extra_task_refs": ("seq_037", "seq_038", "seq_039", "seq_040"),
    },
    "pharmacy_dispatch_transport": {
        "title": "Pharmacy Dispatch / Transport",
        "accent": "#0F9D58",
        "integration_ids": ("int_pharmacy_dispatch_and_urgent_return", "int_cross_org_secure_messaging"),
        "focus": "frozen referral package, dispatch plan and attempt tuples, proof envelopes, urgent-return channels, redispatch, and weak-transport ambiguity",
        "family_scope": "pharmacy referral dispatch and urgent-return transport",
        "extra_source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6D. Referral pack composer, dispatch adapters, and transport contract",
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            "blueprint/phase-5-the-network-horizon.md#5F. Native hub booking commit, practice continuity, and cross-org messaging",
            "blueprint/platform-runtime-and-release-blueprint.md#DependencyDegradationProfile",
            "blueprint/platform-runtime-and-release-blueprint.md#AdapterContractProfile",
        ],
        "mock_brief": [
            "Emulate package freeze, dispatch plan compilation, idempotent attempts, authoritative proof deadlines, disputed receipts, and stale evidence rejection.",
            "Keep urgent return separate from Update Record and require professional contact fallback paths such as monitored email or phone escalation.",
            "Preserve manual-assisted dispatch, dual review, redispatch, and recovery owner state.",
            "Treat accepted transport, mailbox delivery, and authoritative proof as separate evidence lanes at all times.",
        ],
        "placeholder_only": [
            "real mailbox addresses",
            "real professional phone numbers",
            "real transport credentials",
        ],
        "never_authoritative": [
            "transport accepted",
            "mailbox delivery alone",
            "Update Record for urgent return",
        ],
        "actual_gates": [
            "Live transport paths remain blocked until seq_037, seq_039, and seq_040 freeze access paths, manual checkpoints, and degraded defaults.",
            "No transport provider may pass if proof, contradiction, or urgent-return semantics are weaker than the approved simulator.",
        ],
        "extra_task_refs": ("seq_023", "seq_028", "seq_037", "seq_038", "seq_039", "seq_040"),
    },
    "pharmacy_outcome_observation": {
        "title": "Pharmacy Outcome Observation",
        "accent": "#0F9D58",
        "integration_ids": ("int_pharmacy_outcome_reconciliation",),
        "focus": "Update Record observation, replay-safe ingest, weak-match gates, manual review, unresolved outcomes, and reopen-for-safety branches",
        "family_scope": "pharmacy outcome observation and reconciliation",
        "extra_source_refs": [
            "blueprint/phase-6-the-pharmacy-loop.md#6F. Outcome ingest, Update Record observation, and reconciliation",
            "blueprint/phase-6-the-pharmacy-loop.md#6G. Bounce-back, urgent return, and reopen mechanics",
            "blueprint/forensic-audit-findings.md#Finding 78 - Phase 6 used the generic term reconciliation_required for pharmacy outcome ambiguity",
        ],
        "mock_brief": [
            "Simulate exact replay, semantic replay, collision review, strong match, weak match, unmatched, resolved_apply, resolved_reopen, and resolved_unmatched outcomes.",
            "Keep outcome gates and closure blockers explicit so weak evidence cannot auto-close the case.",
            "Preserve supplier-specific evidence shapes and separate urgent return from ordinary consultation summary flows.",
            "Exercise patient review placeholder, staff assurance, and reopened-for-safety branches through the same shell contracts.",
        ],
        "placeholder_only": [
            "real patient summaries",
            "real Update Record payloads",
        ],
        "never_authoritative": [
            "single inbound message without correlation proof",
            "weakly matched email or manual capture",
        ],
        "actual_gates": [
            "Later live onboarding is blocked until seq_037 and seq_039/040 freeze trusted observed-path and manual-review defaults.",
            "No provider may pass if replay-safe ingest, match confidence, or reopen-for-safety handling remain opaque.",
        ],
        "extra_task_refs": ("seq_037", "seq_038", "seq_039", "seq_040"),
    },
}

WEIGHT_ADJUSTMENTS: dict[str, dict[str, tuple[int, int, int, int]]] = {
    "identity_auth": {
        "contract_shape": (1, 1, 0, 0),
        "authoritative_truth": (0, 0, 0, 0),
        "ambiguity_handling": (1, 1, 0, 0),
        "security_replay": (3, 2, 1, 1),
        "healthcare_compliance": (2, 1, 0, 1),
        "onboarding_and_sponsorship": (1, 2, 0, 1),
        "observability_and_audit": (1, 0, 0, 0),
        "degraded_mode_resilience": (1, 0, 0, 0),
        "experience_and_brand_constraints": (4, 3, 1, 2),
    },
    "telephony_voice_and_recording": {
        "contract_shape": (1, 0, 0, 0),
        "ambiguity_handling": (1, 1, 0, 0),
        "privacy_residency": (2, 1, 1, 1),
        "healthcare_compliance": (2, 0, 1, 1),
        "test_data_fidelity": (1, 0, 0, 0),
        "observability_and_audit": (2, 1, 0, 1),
        "operational_support": (2, 0, 1, 0),
        "degraded_mode_resilience": (2, 1, 1, 1),
    },
    "notifications_sms": {
        "authoritative_truth": (-1, -1, 0, 0),
        "ambiguity_handling": (0, -1, 0, 0),
        "onboarding_and_sponsorship": (0, -2, 0, 0),
        "sandbox_depth": (-2, -1, 0, 0),
        "test_data_fidelity": (-1, -1, 0, 0),
        "commercial_and_lock_in": (1, 1, 0, 0),
        "experience_and_brand_constraints": (2, 1, 1, 1),
        "simulator_fidelity": (-1, -1, 0, 0),
    },
    "notifications_email": {
        "authoritative_truth": (-1, -1, 0, 0),
        "ambiguity_handling": (0, -1, 0, 0),
        "sandbox_depth": (-2, -1, 0, 0),
        "test_data_fidelity": (-1, -1, 0, 0),
        "experience_and_brand_constraints": (3, 1, 1, 1),
        "simulator_fidelity": (-1, -1, 0, 0),
    },
    "gp_im1_and_booking_supplier": {
        "contract_shape": (2, 2, 1, 1),
        "healthcare_compliance": (2, 1, 0, 1),
        "onboarding_and_sponsorship": (1, 3, 0, 1),
        "test_data_fidelity": (1, 1, 0, 1),
        "observability_and_audit": (1, 1, 0, 1),
        "operational_support": (1, 0, 0, 0),
        "portability_and_exit": (2, 1, 0, 1),
        "degraded_mode_resilience": (2, 1, 1, 1),
        "experience_and_brand_constraints": (-3, -3, 0, 0),
    },
    "pharmacy_directory": {
        "authoritative_truth": (-2, -2, -1, -1),
        "privacy_residency": (-2, -3, -1, -1),
        "sandbox_depth": (-1, 0, 0, 0),
        "test_data_fidelity": (0, 0, 0, 0),
        "operational_support": (-1, -1, 0, 0),
        "degraded_mode_resilience": (1, -1, 0, 0),
        "experience_and_brand_constraints": (-2, -2, 0, 0),
    },
    "pharmacy_dispatch_transport": {
        "contract_shape": (0, 1, 0, 0),
        "security_replay": (1, 0, 0, 1),
        "healthcare_compliance": (2, 0, 1, 1),
        "onboarding_and_sponsorship": (1, 1, 0, 1),
        "sandbox_depth": (-2, 0, 0, 0),
        "test_data_fidelity": (-1, 0, 0, 0),
        "observability_and_audit": (2, 2, 1, 1),
        "operational_support": (2, 1, 1, 1),
        "degraded_mode_resilience": (2, 1, 1, 1),
        "experience_and_brand_constraints": (-4, -4, -1, -1),
    },
    "pharmacy_outcome_observation": {
        "privacy_residency": (2, 1, 1, 1),
        "healthcare_compliance": (2, 0, 1, 1),
        "onboarding_and_sponsorship": (1, 1, 0, 1),
        "sandbox_depth": (-1, 0, 0, 0),
        "observability_and_audit": (2, 2, 1, 1),
        "operational_support": (2, 1, 1, 1),
        "degraded_mode_resilience": (1, 0, 0, 0),
        "experience_and_brand_constraints": (-4, -4, -1, -1),
    },
}


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2, ensure_ascii=True))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def unique_ordered(items: list[str] | tuple[str, ...]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        ordered.append(item)
    return ordered


def clip(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(value, maximum))


def md_escape(value: str) -> str:
    return value.replace("|", "\\|")


def render_md_table(headers: list[str], rows: list[list[str]]) -> str:
    out = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        out.append("| " + " | ".join(md_escape(cell) for cell in row) + " |")
    return "\n".join(out)


def role_sort_value(role: str) -> int:
    return ROLE_PRIORITY.get(role, 99)


def lane_sort_value(lane: str) -> int:
    return LANE_PRIORITY.get(lane, 99)


def ensure_prerequisites() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(
        not missing,
        "Missing seq_022 prerequisites:\n"
        + "\n".join(f"PREREQUISITE_GAP_{name.upper()}: {REQUIRED_INPUTS[name]}" for name in sorted(missing)),
    )
    integration_payload = load_json(REQUIRED_INPUTS["integration_priority_matrix"])
    phase0_gate_verdict = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    coverage_summary = load_json(REQUIRED_INPUTS["coverage_summary"])
    assert_true(
        integration_payload["summary"]["integration_family_count"] == 15,
        "PREREQUISITE_GAP_SEQ021_DRIFT: seq_021 integration-family count changed",
    )
    assert_true(
        phase0_gate_verdict["gate_verdicts"][0]["verdict"] == "withheld",
        "PREREQUISITE_GAP_GATE_DRIFT: seq_020 no longer reports Phase 0 entry withheld",
    )
    assert_true(
        coverage_summary["summary"]["requirements_with_gaps_count"] == 0,
        "PREREQUISITE_GAP_TRACEABILITY_DRIFT: current-baseline requirement coverage reopened",
    )
    return {
        "integration_priority_matrix": integration_payload,
        "integration_divergence_register": load_csv(REQUIRED_INPUTS["integration_divergence_register"]),
        "external_dependencies": load_json(REQUIRED_INPUTS["external_dependencies"]),
        "dependency_watchlist": load_json(REQUIRED_INPUTS["dependency_watchlist"]),
        "master_risk_register": load_json(REQUIRED_INPUTS["master_risk_register"]),
        "phase0_gate_verdict": phase0_gate_verdict,
        "coverage_summary": coverage_summary,
    }


def build_indexes(prereqs: dict[str, Any]) -> dict[str, Any]:
    integration_by_id = {
        row["integration_id"]: row for row in prereqs["integration_priority_matrix"]["integration_families"]
    }
    watch_by_dependency = {
        row["dependency_id"]: row for row in prereqs["dependency_watchlist"]["dependencies"]
    }
    risks_by_dependency: dict[str, list[dict[str, Any]]] = {}
    for risk in prereqs["master_risk_register"]["risks"]:
        for dependency_id in risk["affected_dependency_refs"]:
            risks_by_dependency.setdefault(dependency_id, []).append(risk)
    for dependency_id in risks_by_dependency:
        risks_by_dependency[dependency_id].sort(key=lambda row: (-row["risk_score"], row["risk_id"]))
    dependency_name_by_id = {
        row["dependency_id"]: row["dependency_name"]
        for row in prereqs["external_dependencies"]["dependencies"]
    }
    return {
        "integration_by_id": integration_by_id,
        "watch_by_dependency": watch_by_dependency,
        "risks_by_dependency": risks_by_dependency,
        "dependency_name_by_id": dependency_name_by_id,
    }


def summarize_priority(items: list[tuple[str, int]], limit: int = 4) -> str:
    ordered = sorted(items, key=lambda row: (-row[1], row[0]))
    return ", ".join(f"{name} ({score})" for name, score in ordered[:limit])


def family_summary_role(rows: list[dict[str, Any]]) -> str:
    return sorted((row["baseline_role"] for row in rows), key=role_sort_value)[0]


def family_summary_lane(rows: list[dict[str, Any]]) -> str:
    return sorted((row["recommended_lane"] for row in rows), key=lane_sort_value)[0]


def dimension_by_id() -> dict[str, dict[str, Any]]:
    return {row["dimension_id"]: row for row in DIMENSIONS}


def build_family_context(family_id: str, prereqs: dict[str, Any], indexes: dict[str, Any]) -> dict[str, Any]:
    spec = FAMILY_SPECS[family_id]
    integration_rows = [indexes["integration_by_id"][integration_id] for integration_id in spec["integration_ids"]]
    dependency_ids = unique_ordered(
        [
            dependency_id
            for row in integration_rows
            for dependency_id in row["source_dependency_ids"]
        ]
    )
    source_refs = unique_ordered(
        spec["extra_source_refs"]
        + [ref for row in integration_rows for ref in row["source_refs"]]
    )
    later_task_refs = unique_ordered(
        list(spec["extra_task_refs"]) + [task for row in integration_rows for task in row["later_task_refs"]]
    )
    risk_rows = []
    seen_risk_ids: set[str] = set()
    for dependency_id in dependency_ids:
        for risk in indexes["risks_by_dependency"].get(dependency_id, []):
            if risk["risk_id"] in seen_risk_ids:
                continue
            seen_risk_ids.add(risk["risk_id"])
            risk_rows.append(risk)
    risk_rows.sort(key=lambda row: (-row["risk_score"], row["risk_id"]))
    watch_rows = [
        indexes["watch_by_dependency"][dependency_id]
        for dependency_id in dependency_ids
        if dependency_id in indexes["watch_by_dependency"]
    ]
    return {
        "provider_family": family_id,
        "title": spec["title"],
        "accent": spec["accent"],
        "focus": spec["focus"],
        "family_scope": spec["family_scope"],
        "integration_rows": integration_rows,
        "integration_ids": list(spec["integration_ids"]),
        "integration_names": [row["integration_name"] for row in integration_rows],
        "dependency_ids": dependency_ids,
        "dependency_names": [indexes["dependency_name_by_id"][dependency_id] for dependency_id in dependency_ids],
        "baseline_role": family_summary_role(integration_rows),
        "recommended_lane": family_summary_lane(integration_rows),
        "source_refs": source_refs,
        "later_task_refs": later_task_refs,
        "risk_rows": risk_rows[:4],
        "watch_rows": watch_rows[:3],
        "spec": spec,
    }


def apply_adjustments(family_id: str, dimension_id: str, mock_weight: int, actual_weight: int, mock_bar: int, actual_bar: int) -> tuple[int, int, int, int]:
    delta_mock, delta_actual, bar_mock, bar_actual = WEIGHT_ADJUSTMENTS.get(family_id, {}).get(
        dimension_id,
        (0, 0, 0, 0),
    )
    return (
        clip(mock_weight + delta_mock, 1, 12),
        clip(actual_weight + delta_actual, 1, 12),
        clip(mock_bar + bar_mock, 1, 5),
        clip(actual_bar + bar_actual, 1, 5),
    )


def format_templates(templates: list[str], mapping: dict[str, str]) -> list[str]:
    return [template.format(**mapping) for template in templates]


def lane_priority(mock_weight: int, actual_weight: int) -> str:
    if mock_weight > actual_weight:
        return "mock_now_heavier"
    if actual_weight > mock_weight:
        return "actual_later_heavier"
    return "shared_weight"


def must_have(mock_bar: int, actual_bar: int) -> bool:
    return mock_bar >= 4 or actual_bar >= 4


def kill_switch_flag(dimension_class: str, mock_bar: int, actual_bar: int) -> bool:
    return dimension_class in {
        "capability",
        "proof_truth",
        "ambiguity_handling",
        "security",
        "sandbox_quality",
        "resilience",
        "mock_fidelity",
    } or mock_bar == 5 or actual_bar == 5


def build_scorecard_row(context: dict[str, Any], dimension: dict[str, Any]) -> dict[str, Any]:
    family_id = context["provider_family"]
    mapping = {
        "family_title": context["title"],
        "family_focus": context["focus"],
        "family_scope": context["family_scope"],
    }
    mock_weight, actual_weight, mock_bar, actual_bar = apply_adjustments(
        family_id,
        dimension["dimension_id"],
        dimension["mock_default_weight"],
        dimension["actual_default_weight"],
        dimension["mock_default_bar"],
        dimension["actual_default_bar"],
    )
    same_weight = mock_weight == actual_weight
    mock_evidence = format_templates(dimension["mock_evidence"], mapping)
    actual_evidence = format_templates(dimension["actual_evidence"], mapping)
    lane_reason = (
        "Weights stay equal because the architectural law is invariant across mock-now and actual-provider later."
        if same_weight
        else (
            "Mock-now is heavier because the simulator must prove this behavior before live onboarding exists."
            if mock_weight > actual_weight
            else "Actual-provider later is heavier because later onboarding adds approval, support, or compliance burden without lowering the proof bar."
        )
    )
    notes = (
        f"{dimension['notes']} {lane_reason} "
        f"The mapped seq_021 seams are {', '.join(context['integration_names'])}."
    )
    question_id = f"Q_{family_id.upper()}_{dimension['dimension_id'].upper()}"
    return {
        "provider_family": family_id,
        "provider_family_title": context["title"],
        "accent": context["accent"],
        "baseline_role": context["baseline_role"],
        "recommended_lane": context["recommended_lane"],
        "integration_ids": context["integration_ids"],
        "dependency_ids": context["dependency_ids"],
        "dimension_id": dimension["dimension_id"],
        "dimension_title": dimension["dimension_title"],
        "dimension_class": dimension["dimension_class"],
        "weight_mock_now": mock_weight,
        "weight_actual_later": actual_weight,
        "weight_delta_actual_minus_mock": actual_weight - mock_weight,
        "same_weight_flag": same_weight,
        "lane_priority": lane_priority(mock_weight, actual_weight),
        "minimum_bar_mock_now": mock_bar,
        "minimum_bar_actual_later": actual_bar,
        "mock_must_have": must_have(mock_bar, actual_bar),
        "kill_switch_flag": kill_switch_flag(dimension["dimension_class"], mock_bar, actual_bar),
        "evidence_required_mock_now": mock_evidence,
        "evidence_required_actual_later": actual_evidence,
        "kill_switch_if_failed_mock_now": dimension["mock_kill"],
        "kill_switch_if_failed_actual_later": dimension["actual_kill"],
        "due_diligence_question_id": question_id,
        "due_diligence_question": dimension["question"].format(**mapping),
        "source_refs": context["source_refs"],
        "notes": notes,
    }


def build_family_payload(context: dict[str, Any]) -> dict[str, Any]:
    rows = [build_scorecard_row(context, dimension) for dimension in DIMENSIONS]
    spec = context["spec"]
    mock_heavy = [row["dimension_title"] for row in rows if row["weight_mock_now"] > row["weight_actual_later"]]
    actual_heavy = [row["dimension_title"] for row in rows if row["weight_actual_later"] > row["weight_mock_now"]]
    shared = [row["dimension_title"] for row in rows if row["same_weight_flag"]]
    risk_notes = [
        {
            "risk_id": row["risk_id"],
            "risk_title": row["risk_title"],
            "risk_score": row["risk_score"],
            "problem_statement": row["problem_statement"],
        }
        for row in context["risk_rows"]
    ]
    watch_notes = [
        {
            "dependency_id": row["dependency_id"],
            "dependency_name": row["dependency_name"],
            "lifecycle_state": row["lifecycle_state"],
            "notes": row["notes"],
            "degradation_mode": row["degradation_mode"],
            "fallback_strategy": row["fallback_strategy"],
        }
        for row in context["watch_rows"]
    ]
    return {
        "provider_family": context["provider_family"],
        "title": context["title"],
        "accent": context["accent"],
        "baseline_role": context["baseline_role"],
        "recommended_lane": context["recommended_lane"],
        "integration_ids": context["integration_ids"],
        "integration_names": context["integration_names"],
        "dependency_ids": context["dependency_ids"],
        "dependency_names": context["dependency_names"],
        "source_refs": context["source_refs"],
        "later_task_refs": context["later_task_refs"],
        "focus": context["focus"],
        "family_scope": context["family_scope"],
        "lane_summary": {
            "mock_heavier_dimensions": mock_heavy,
            "actual_heavier_dimensions": actual_heavy,
            "shared_weight_dimensions": shared,
        },
        "mock_design_brief": {
            "objective": f"Build a contract-first simulator for {context['family_scope']} that preserves the full state and proof model before named vendor work begins.",
            "must_emulate": spec["mock_brief"],
            "placeholder_only": spec["placeholder_only"],
            "never_authoritative": spec["never_authoritative"],
            "acceptance_rule": "Every dimension must meet minimum_bar_mock_now and no mock kill-switch may trip.",
        },
        "actual_provider_strategy": {
            "objective": f"Admit a live provider for {context['family_scope']} only when the provider can satisfy the same truth, ambiguity, degraded-mode, and audit laws already proven in the simulator.",
            "gating_conditions": spec["actual_gates"],
            "later_task_refs": context["later_task_refs"],
            "acceptance_rule": "Every dimension must meet minimum_bar_actual_later and no actual-provider kill-switch may trip.",
        },
        "risk_notes": risk_notes,
        "watch_notes": watch_notes,
        "scorecard_rows": rows,
    }


def build_payload(prereqs: dict[str, Any]) -> dict[str, Any]:
    indexes = build_indexes(prereqs)
    families = [build_family_payload(build_family_context(family_id, prereqs, indexes)) for family_id in FAMILY_SPECS]
    all_rows = [row for family in families for row in family["scorecard_rows"]]
    return {
        "model_id": "seq_022_provider_family_scorecards_v1",
        "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "mission": MISSION,
        "visual_mode": VISUAL_MODE,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {name: str(path.relative_to(ROOT)) for name, path in REQUIRED_INPUTS.items()},
        "score_scale": SCORE_SCALE,
        "dimension_catalog": DIMENSIONS,
        "summary": {
            "provider_family_count": len(families),
            "dimension_count": len(DIMENSIONS),
            "scorecard_row_count": len(all_rows),
            "mock_must_have_count": sum(1 for row in all_rows if row["mock_must_have"]),
            "actual_kill_switch_count": len(all_rows),
            "question_count": len(all_rows),
            "lane_delta_count": sum(1 for row in all_rows if not row["same_weight_flag"]),
            "phase0_entry_verdict": prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
        },
        "assumptions": [
            "ASSUMPTION_022_SCORE_SCALE_0_TO_5: future provider evaluations will score every dimension on the shared 0-5 scale defined in this pack.",
            "ASSUMPTION_022_NO_NAMED_VENDOR_SELECTION: no named vendor research, shortlist, or procurement preference is admissible before this scorecard system is applied.",
            "ASSUMPTION_022_PDS_OPTIONAL: optional PDS enrichment remains outside the scored provider families and may not silently become baseline identity authority.",
        ],
        "families": families,
    }


def json_cell(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True)


def weight_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for family in payload["families"]:
        for row in family["scorecard_rows"]:
            rows.append(
                {
                    "provider_family": row["provider_family"],
                    "provider_family_title": row["provider_family_title"],
                    "dimension_id": row["dimension_id"],
                    "dimension_title": row["dimension_title"],
                    "dimension_class": row["dimension_class"],
                    "weight_mock_now": row["weight_mock_now"],
                    "weight_actual_later": row["weight_actual_later"],
                    "weight_delta_actual_minus_mock": row["weight_delta_actual_minus_mock"],
                    "same_weight_flag": str(row["same_weight_flag"]).lower(),
                    "minimum_bar_mock_now": row["minimum_bar_mock_now"],
                    "minimum_bar_actual_later": row["minimum_bar_actual_later"],
                    "lane_priority": row["lane_priority"],
                    "baseline_role": row["baseline_role"],
                    "recommended_lane": row["recommended_lane"],
                }
            )
    return rows


def mock_bar_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for family in payload["families"]:
        for row in family["scorecard_rows"]:
            rows.append(
                {
                    "provider_family": row["provider_family"],
                    "dimension_id": row["dimension_id"],
                    "dimension_title": row["dimension_title"],
                    "dimension_class": row["dimension_class"],
                    "minimum_bar_mock_now": row["minimum_bar_mock_now"],
                    "evidence_required_mock_now": json_cell(row["evidence_required_mock_now"]),
                    "kill_switch_if_failed_mock_now": row["kill_switch_if_failed_mock_now"],
                    "source_refs": json_cell(row["source_refs"]),
                    "notes": row["notes"],
                }
            )
    return rows


def actual_kill_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for family in payload["families"]:
        for row in family["scorecard_rows"]:
            rows.append(
                {
                    "provider_family": row["provider_family"],
                    "dimension_id": row["dimension_id"],
                    "dimension_title": row["dimension_title"],
                    "dimension_class": row["dimension_class"],
                    "minimum_bar_actual_later": row["minimum_bar_actual_later"],
                    "evidence_required_actual_later": json_cell(row["evidence_required_actual_later"]),
                    "kill_switch_if_failed_actual_later": row["kill_switch_if_failed_actual_later"],
                    "source_refs": json_cell(row["source_refs"]),
                    "notes": row["notes"],
                }
            )
    return rows


def question_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for family in payload["families"]:
        for row in family["scorecard_rows"]:
            rows.append(
                {
                    "provider_family": row["provider_family"],
                    "provider_family_title": row["provider_family_title"],
                    "question_id": row["due_diligence_question_id"],
                    "dimension_id": row["dimension_id"],
                    "dimension_title": row["dimension_title"],
                    "question": row["due_diligence_question"],
                    "evidence_expected": json_cell(row["evidence_required_actual_later"]),
                    "kill_switch_if_unproven": row["kill_switch_if_failed_actual_later"],
                    "source_refs": json_cell(row["source_refs"]),
                }
            )
    return rows


def render_family_overview_table(payload: dict[str, Any]) -> str:
    rows = []
    for family in payload["families"]:
        mock_summary = summarize_priority(
            [(row["dimension_title"], row["weight_mock_now"]) for row in family["scorecard_rows"]],
            limit=4,
        )
        actual_summary = summarize_priority(
            [(row["dimension_title"], row["weight_actual_later"]) for row in family["scorecard_rows"]],
            limit=4,
        )
        rows.append(
            [
                family["provider_family"],
                family["baseline_role"],
                ", ".join(family["integration_names"]),
                mock_summary,
                actual_summary,
            ]
        )
    return render_md_table(
        ["Family", "Baseline role", "Mapped seams", "Top mock-now weights", "Top actual-later weights"],
        rows,
    )


def render_scorecard_docs(payload: dict[str, Any]) -> None:
    family_sections = []
    for family in payload["families"]:
        rows = family["scorecard_rows"]
        family_sections.append(
            textwrap.dedent(
                f"""
                ## {family["title"]}

                - provider family: `{family["provider_family"]}`
                - baseline role: `{family["baseline_role"]}`
                - recommended lane from seq_021: `{family["recommended_lane"]}`
                - mapped seams: {", ".join(family["integration_names"])}

                **Mock_now_execution**

                {family["mock_design_brief"]["objective"]}

                **Actual_provider_strategy_later**

                {family["actual_provider_strategy"]["objective"]}

                {render_md_table(
                    ["Dimension", "Class", "Mock weight", "Mock bar", "Actual weight", "Actual bar", "Lane delta"],
                    [
                        [
                            row["dimension_title"],
                            row["dimension_class"],
                            str(row["weight_mock_now"]),
                            str(row["minimum_bar_mock_now"]),
                            str(row["weight_actual_later"]),
                            str(row["minimum_bar_actual_later"]),
                            row["lane_priority"],
                        ]
                        for row in rows
                    ],
                )}

                Mock kill-switch digest:
                {render_md_table(
                    ["Dimension", "Mock kill-switch"],
                    [[row["dimension_title"], row["kill_switch_if_failed_mock_now"]] for row in rows],
                )}

                Actual-provider kill-switch digest:
                {render_md_table(
                    ["Dimension", "Actual-provider kill-switch"],
                    [[row["dimension_title"], row["kill_switch_if_failed_actual_later"]] for row in rows],
                )}
                """
            ).strip()
        )

    write_text(
        SCORECARDS_MD_PATH,
        textwrap.dedent(
            f"""
            # 22 Provider Selection Scorecards

            This pack freezes provider-family evaluation law before any named-vendor shortlist exists. It closes the gaps where API aesthetics, cheap procurement, or toy mocks could otherwise outrank proof semantics, ambiguity handling, or adapter-bound truth.

            Summary:
            - provider families: {payload["summary"]["provider_family_count"]}
            - dimension rows: {payload["summary"]["scorecard_row_count"]}
            - mock must-have rows: {payload["summary"]["mock_must_have_count"]}
            - actual kill-switch rows: {payload["summary"]["actual_kill_switch_count"]}
            - due-diligence questions: {payload["summary"]["question_count"]}
            - Phase 0 entry posture inherited from seq_020: `{payload["summary"]["phase0_entry_verdict"]}`

            Rating scale:
            - `0`: not demonstrated
            - `1`: placeholder only
            - `2`: partial or unsafe
            - `3`: adequate with bounded risk
            - `4`: strong and reusable
            - `5`: blueprint-grade and proven

            Qualification law:
            - `Mock_now_execution`: every dimension must meet `minimum_bar_mock_now`, and no mock kill-switch may trip.
            - `Actual_provider_strategy_later`: every dimension must meet `minimum_bar_actual_later`, and no actual-provider kill-switch may trip.
            - Weighted score formula for future vendor comparison: `sum(provider_rating * lane_weight) / sum(lane_weight) * 100`.

            {render_family_overview_table(payload)}

            {"\n\n".join(family_sections)}
            """
        ),
    )


def render_mock_briefs_doc(payload: dict[str, Any]) -> None:
    sections = []
    for family in payload["families"]:
        brief = family["mock_design_brief"]
        sections.append(
            textwrap.dedent(
                f"""
                ## {family["title"]}

                **Mock_now_execution**

                Objective: {brief["objective"]}

                Mandatory simulator behaviors:
                - {"\n- ".join(brief["must_emulate"])}

                Placeholder-only areas:
                - {"\n- ".join(brief["placeholder_only"])}

                Never-authoritative states:
                - {"\n- ".join(brief["never_authoritative"])}

                Acceptance rule:
                - {brief["acceptance_rule"]}
                """
            ).strip()
        )
    write_text(
        MOCK_BRIEFS_MD_PATH,
        textwrap.dedent(
            f"""
            # 22 Mock Provider Design Briefs

            Section A — `Mock_now_execution`

            Mock providers in Vecells are not toy stubs. They are contract-first simulators that must preserve the same proof, ambiguity, degraded-mode, and fence semantics later live adapters will need.

            {"\n\n".join(sections)}
            """
        ),
    )


def render_playbook_doc(payload: dict[str, Any]) -> None:
    sections = []
    for family in payload["families"]:
        rows = family["scorecard_rows"]
        playbook = family["actual_provider_strategy"]
        sections.append(
            textwrap.dedent(
                f"""
                ## {family["title"]}

                **Actual_provider_strategy_later**

                Objective: {playbook["objective"]}

                Gating conditions:
                - {"\n- ".join(playbook["gating_conditions"])}

                Later task refs:
                - {"\n- ".join(playbook["later_task_refs"])}

                Question bank:
                {render_md_table(
                    ["Question ID", "Dimension", "Question", "Minimum bar", "Kill-switch if unproven"],
                    [
                        [
                            row["due_diligence_question_id"],
                            row["dimension_title"],
                            row["due_diligence_question"],
                            str(row["minimum_bar_actual_later"]),
                            row["kill_switch_if_failed_actual_later"],
                        ]
                        for row in rows
                    ],
                )}
                """
            ).strip()
        )
    write_text(
        PLAYBOOK_MD_PATH,
        textwrap.dedent(
            f"""
            # 22 Actual Provider Due-Diligence Playbook

            Section B — `Actual_provider_strategy_later`

            This playbook prevents named-vendor work from racing ahead of evaluation law. No provider family may pass if it weakens truth semantics, hides ambiguity, breaks adapter boundaries, or offers only shallow evidence for the control-plane behavior the product already needs.

            {"\n\n".join(sections)}
            """
        ),
    )


def render_rationale_doc(payload: dict[str, Any]) -> None:
    family_rows = []
    for family in payload["families"]:
        mock_heavy = ", ".join(family["lane_summary"]["mock_heavier_dimensions"][:5]) or "None"
        actual_heavy = ", ".join(family["lane_summary"]["actual_heavier_dimensions"][:5]) or "None"
        family_rows.append(
            [
                family["provider_family"],
                mock_heavy,
                actual_heavy,
                ", ".join(family["lane_summary"]["shared_weight_dimensions"][:4]) or "None",
            ]
        )
    write_text(
        RATIONALE_MD_PATH,
        textwrap.dedent(
            f"""
            # 22 Provider Score Weight Rationale

            The two-lane model deliberately uses different weights.

            `Mock_now_execution` is heavier on:
            - sandbox depth
            - simulator fidelity
            - test-data coverage
            - proof-truth semantics before external onboarding exists

            `Actual_provider_strategy_later` is heavier on:
            - onboarding friction and sponsor burden
            - compliance and evidence readiness
            - operational support and observability
            - portability, exit posture, and residency transparency

            Invariant dimensions:
            - proof truth
            - ambiguity handling
            - degraded-mode resilience
            - contract-shape law

            Family lane deltas:
            {render_md_table(
                ["Family", "Mock-now heavier", "Actual-later heavier", "Shared-weight anchors"],
                family_rows,
            )}

            Assumptions:
            - {"\n- ".join(payload["assumptions"])}
            """
        ),
    )


def build_html(payload: dict[str, Any]) -> str:
    safe_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=True).replace("</", "<\\/")
    template = """\
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>22 Provider Scorecard Studio</title>
          <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23335CFF'/%3E%3Cpath d='M18 18h10l8 20 8-20h10L38 46h-12z' fill='white'/%3E%3C/svg%3E">
          <style>
            :root {{
              --canvas: #F5F7FA;
              --shell: #FFFFFF;
              --inset: #EEF2F6;
              --text-strong: #111827;
              --text: #1F2937;
              --text-muted: #4B5563;
              --border-subtle: #E5E7EB;
              --border: #D1D5DB;
              --blocked: #C24141;
              --warning: #C98900;
              --accent: #335CFF;
              --shadow: 0 12px 32px rgba(17, 24, 39, 0.06);
            }}
            * {{ box-sizing: border-box; }}
            body {{
              margin: 0;
              font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: var(--canvas);
              color: var(--text);
            }}
            .page {{
              max-width: 1440px;
              margin: 0 auto;
              padding: 24px;
            }}
            .hero {{
              display: grid;
              gap: 16px;
              margin-bottom: 20px;
            }}
            .hero-card {{
              background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(238,242,246,0.95));
              border: 1px solid var(--border-subtle);
              border-radius: 24px;
              padding: 20px 24px;
              box-shadow: var(--shadow);
            }}
            .hero-top {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              flex-wrap: wrap;
            }}
            .eyebrow {{
              display: inline-flex;
              align-items: center;
              gap: 10px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              color: var(--text-muted);
            }}
            .wordmark {{
              width: 36px;
              height: 36px;
              border-radius: 12px;
              background: linear-gradient(160deg, var(--accent), rgba(255,255,255,0.9));
              color: white;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
            }}
            h1 {{
              margin: 10px 0 6px;
              font-size: clamp(30px, 4vw, 42px);
              line-height: 1.05;
              color: var(--text-strong);
            }}
            p {{
              margin: 0;
              line-height: 1.6;
            }}
            .hero-meta {{
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }}
            .meta-pill {{
              display: inline-flex;
              align-items: center;
              height: 32px;
              padding: 0 12px;
              border-radius: 999px;
              border: 1px solid var(--border);
              background: white;
              font-size: 13px;
            }}
            .family-ribbon {{
              display: flex;
              gap: 12px;
              overflow-x: auto;
              padding-bottom: 4px;
            }}
            .family-tab {{
              min-height: 44px;
              border-radius: 16px;
              border: 1px solid var(--border);
              background: white;
              color: var(--text);
              padding: 10px 14px;
              font: inherit;
              display: inline-flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
            }}
            .family-tab[aria-pressed="true"] {{
              border-color: var(--accent);
              background: rgba(255,255,255,0.96);
              box-shadow: 0 0 0 2px rgba(51,92,255,0.14);
            }}
            .family-dot {{
              width: 10px;
              height: 10px;
              border-radius: 999px;
              background: var(--accent);
            }}
            .layout {{
              display: grid;
              grid-template-columns: minmax(248px, 296px) minmax(0, 1fr) minmax(360px, 400px);
              gap: 20px;
              align-items: start;
            }}
            .panel {{
              background: var(--shell);
              border: 1px solid var(--border-subtle);
              border-radius: 24px;
              box-shadow: var(--shadow);
            }}
            .rail {{
              padding: 18px;
              position: sticky;
              top: 16px;
            }}
            .panel-header {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 14px;
            }}
            .panel-header h2,
            .panel-header h3 {{
              margin: 0;
              font-size: 16px;
            }}
            .rail select {{
              width: 100%;
              height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border);
              padding: 0 12px;
              font: inherit;
              background: white;
              color: var(--text);
            }}
            .dimension-list {{
              display: grid;
              gap: 10px;
              margin-top: 14px;
            }}
            .dimension-item {{
              width: 100%;
              text-align: left;
              border-radius: 18px;
              border: 1px solid var(--border-subtle);
              background: var(--inset);
              padding: 14px;
              color: inherit;
              cursor: pointer;
              transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
            }}
            .dimension-item[data-selected="true"] {{
              border-color: var(--accent);
              background: rgba(51, 92, 255, 0.08);
            }}
            .dimension-top,
            .dimension-bottom {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
            }}
            .dimension-title {{
              font-size: 14px;
              font-weight: 600;
              color: var(--text-strong);
            }}
            .chip-row {{
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-top: 10px;
            }}
            .chip {{
              display: inline-flex;
              align-items: center;
              min-height: 32px;
              padding: 0 10px;
              border-radius: 999px;
              background: white;
              border: 1px solid var(--border-subtle);
              font-size: 12px;
              color: var(--text-muted);
            }}
            .chip.alert {{
              border-color: rgba(194, 65, 65, 0.34);
              color: var(--blocked);
            }}
            .chip.warn {{
              border-color: rgba(201, 137, 0, 0.34);
              color: var(--warning);
            }}
            .workspace {{
              padding: 18px;
              display: grid;
              gap: 18px;
            }}
            .comparison-card {{
              min-height: 420px;
              background: linear-gradient(180deg, rgba(255,255,255,1), rgba(245,247,250,0.92));
              border: 1px solid var(--border-subtle);
              border-radius: 20px;
              padding: 16px;
            }}
            .legend {{
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 14px;
            }}
            .legend-item {{
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              color: var(--text-muted);
            }}
            .legend-swatch {{
              width: 18px;
              height: 12px;
              border-radius: 999px;
            }}
            .metric-list {{
              display: grid;
              gap: 10px;
            }}
            .metric-row {{
              border-radius: 18px;
              border: 1px solid var(--border-subtle);
              background: white;
              padding: 14px;
              cursor: pointer;
              transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
            }}
            .metric-row[data-selected="true"] {{
              border-color: var(--accent);
              background: rgba(51, 92, 255, 0.05);
            }}
            .metric-header {{
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 10px;
            }}
            .metric-title {{
              font-weight: 600;
              color: var(--text-strong);
            }}
            .bars {{
              display: grid;
              gap: 8px;
            }}
            .bar-row {{
              display: grid;
              grid-template-columns: 96px minmax(0, 1fr) 48px;
              align-items: center;
              gap: 12px;
            }}
            .bar-label {{
              font-size: 12px;
              color: var(--text-muted);
            }}
            .track {{
              position: relative;
              height: 12px;
              border-radius: 999px;
              background: var(--inset);
              overflow: hidden;
            }}
            .fill {{
              position: absolute;
              inset: 0 auto 0 0;
              height: 12px;
              border-radius: 999px;
            }}
            .fill.mock {{
              background: linear-gradient(90deg, var(--accent), rgba(51,92,255,0.45));
            }}
            .fill.actual {{
              background: linear-gradient(90deg, rgba(17,24,39,0.9), rgba(17,24,39,0.38));
            }}
            .bar-value {{
              text-align: right;
              font-size: 12px;
              color: var(--text-muted);
            }}
            .table-shell {{
              border: 1px solid var(--border-subtle);
              border-radius: 20px;
              overflow: hidden;
              background: white;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th, td {{
              padding: 12px 14px;
              border-bottom: 1px solid var(--border-subtle);
              vertical-align: top;
              text-align: left;
              font-size: 13px;
            }}
            th {{
              background: rgba(238,242,246,0.8);
              color: var(--text-muted);
              font-weight: 600;
            }}
            tr:last-child td {{
              border-bottom: none;
            }}
            .inspector {{
              padding: 18px;
              position: sticky;
              top: 16px;
              width: 100%;
              min-width: 320px;
              max-width: 420px;
              display: grid;
              gap: 16px;
            }}
            .inspector-title {{
              font-size: 24px;
              margin: 0;
              color: var(--text-strong);
            }}
            .inspector-block {{
              border: 1px solid var(--border-subtle);
              border-radius: 18px;
              padding: 14px;
              background: var(--inset);
            }}
            .inspector-block h3 {{
              margin: 0 0 10px;
              font-size: 14px;
            }}
            .inspector-block ul {{
              margin: 0;
              padding-left: 18px;
            }}
            .inspector-block li + li {{
              margin-top: 6px;
            }}
            .bottom-grid {{
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 18px;
            }}
            .bottom-card {{
              padding: 18px;
              display: grid;
              gap: 14px;
            }}
            .risk-note {{
              border-radius: 16px;
              border: 1px solid rgba(194, 65, 65, 0.18);
              background: rgba(194, 65, 65, 0.04);
              padding: 12px;
            }}
            .small {{
              font-size: 12px;
              color: var(--text-muted);
            }}
            button, select {{
              outline: none;
            }}
            button:focus-visible,
            select:focus-visible {{
              box-shadow: 0 0 0 2px rgba(51, 92, 255, 0.25), 0 0 0 4px rgba(51, 92, 255, 0.12);
            }}
            @media (max-width: 1180px) {{
              .layout {{
                grid-template-columns: minmax(240px, 296px) minmax(0, 1fr);
              }}
              .inspector {{
                grid-column: 1 / -1;
                max-width: none;
              }}
            }}
            @media (max-width: 920px) {{
              .layout {{
                grid-template-columns: 1fr;
              }}
              .rail,
              .inspector {{
                position: static;
              }}
              .bottom-grid {{
                grid-template-columns: 1fr;
              }}
            }}
            @media (prefers-reduced-motion: reduce) {{
              *, *::before, *::after {{
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
              }}
            }}
          </style>
        </head>
        <body>
          <div class="page" data-testid="provider-scorecard-shell">
            <section class="hero">
              <div class="hero-card">
                <div class="hero-top">
                  <div>
                    <div class="eyebrow"><span class="wordmark">V</span> Provider_Atelier</div>
                    <h1>Provider Scorecard Studio</h1>
                    <p>One analytical instrument for mock-now execution and actual-provider later admissibility. No named vendors, no API-aesthetics shortcuts, no toy simulators.</p>
                  </div>
                  <div class="hero-meta">
                    <div class="meta-pill">Families: __FAMILY_COUNT__</div>
                    <div class="meta-pill">Rows: __ROW_COUNT__</div>
                    <div class="meta-pill">Questions: __QUESTION_COUNT__</div>
                    <div class="meta-pill">Phase 0: __PHASE0_VERDICT__</div>
                  </div>
                </div>
              </div>
              <div class="family-ribbon" aria-label="Provider families" data-testid="provider-family-ribbon" id="familyRibbon"></div>
            </section>
            <section class="layout">
              <aside class="panel rail" data-testid="provider-dimension-rail" aria-label="Dimension rail">
                <div class="panel-header">
                  <h2>Dimensions</h2>
                  <span class="small" id="familyRole"></span>
                </div>
                <label class="small" for="classFilter">Dimension filter</label>
                <select id="classFilter" data-testid="provider-dimension-filter"></select>
                <div class="dimension-list" id="dimensionRail"></div>
              </aside>
              <main class="workspace">
                <section class="comparison-card panel" data-testid="provider-comparison-canvas">
                  <div class="panel-header">
                    <h2 id="comparisonTitle">Weight comparison</h2>
                    <span class="small">Bars show weights; chips show lane minima and evidence counts.</span>
                  </div>
                  <div class="legend">
                    <div class="legend-item"><span class="legend-swatch" style="background: var(--accent);"></span>Mock-now weight</div>
                    <div class="legend-item"><span class="legend-swatch" style="background: rgba(17,24,39,0.9);"></span>Actual-later weight</div>
                  </div>
                  <div class="metric-list" id="comparisonCanvas"></div>
                </section>
                <section class="table-shell panel" data-testid="provider-dimension-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Dimension</th>
                        <th>Class</th>
                        <th>Mock</th>
                        <th>Actual</th>
                        <th>Lane priority</th>
                      </tr>
                    </thead>
                    <tbody id="dimensionTableBody"></tbody>
                  </table>
                </section>
                <section class="bottom-grid">
                  <section class="panel bottom-card" data-testid="provider-brief-summary">
                    <div class="panel-header">
                      <h3>Mock design brief</h3>
                      <span class="small">Section A</span>
                    </div>
                    <div id="briefSummary"></div>
                  </section>
                  <section class="panel bottom-card" data-testid="provider-question-bank">
                    <div class="panel-header">
                      <h3>Actual due-diligence question bank</h3>
                      <span class="small">Section B</span>
                    </div>
                    <div class="table-shell">
                      <table>
                        <thead>
                          <tr>
                            <th>Question</th>
                            <th>Dimension</th>
                            <th>Min bar</th>
                          </tr>
                        </thead>
                        <tbody id="questionBody"></tbody>
                      </table>
                    </div>
                  </section>
                  <section class="panel bottom-card" data-testid="provider-risk-notes">
                    <div class="panel-header">
                      <h3>Risk notes</h3>
                      <span class="small">Top linked rows</span>
                    </div>
                    <div id="riskNotes"></div>
                  </section>
                </section>
              </main>
              <aside class="panel inspector" data-testid="provider-inspector" aria-live="polite">
                <div>
                  <div class="eyebrow">Inspector</div>
                  <h2 class="inspector-title" id="inspectorTitle"></h2>
                  <p id="inspectorNotes"></p>
                </div>
                <section class="inspector-block">
                  <h3>Lane posture</h3>
                  <div class="chip-row" id="laneChips"></div>
                </section>
                <section class="inspector-block">
                  <h3>Evidence expectations</h3>
                  <ul id="evidenceList"></ul>
                </section>
                <section class="inspector-block">
                  <h3>Kill-switch detail</h3>
                  <ul id="killList"></ul>
                </section>
                <section class="inspector-block">
                  <h3>Source refs</h3>
                  <ul id="sourceList"></ul>
                </section>
              </aside>
            </section>
          </div>
          <script type="application/json" id="provider-data">__PAYLOAD_JSON__</script>
          <script>
            const payload = JSON.parse(document.getElementById("provider-data").textContent);
            const families = payload.families;
            const familyById = Object.fromEntries(families.map((family) => [family.provider_family, family]));
            const classOptions = [{ id: "all", title: "All classes" }].concat(
              payload.dimension_catalog.map((dimension) => ({ id: dimension.dimension_class, title: dimension.dimension_class }))
                .filter((value, index, array) => array.findIndex((row) => row.id === value.id) === index)
            );
            const state = {
              familyId: families[0].provider_family,
              classFilter: "all",
              dimensionId: families[0].scorecard_rows[0].dimension_id,
            };

            const familyRibbon = document.getElementById("familyRibbon");
            const familyRole = document.getElementById("familyRole");
            const classFilter = document.getElementById("classFilter");
            const dimensionRail = document.getElementById("dimensionRail");
            const comparisonCanvas = document.getElementById("comparisonCanvas");
            const dimensionTableBody = document.getElementById("dimensionTableBody");
            const briefSummary = document.getElementById("briefSummary");
            const questionBody = document.getElementById("questionBody");
            const riskNotes = document.getElementById("riskNotes");
            const inspectorTitle = document.getElementById("inspectorTitle");
            const inspectorNotes = document.getElementById("inspectorNotes");
            const laneChips = document.getElementById("laneChips");
            const evidenceList = document.getElementById("evidenceList");
            const killList = document.getElementById("killList");
            const sourceList = document.getElementById("sourceList");
            const comparisonTitle = document.getElementById("comparisonTitle");

            classFilter.innerHTML = classOptions.map((option) => `
              <option value="${option.id}">${option.title}</option>
            `).join("");
            classFilter.addEventListener("change", (event) => {
              state.classFilter = event.target.value;
              render();
            });

            function rowsForCurrentFamily() {
              const family = familyById[state.familyId];
              const rows = family.scorecard_rows.filter((row) => state.classFilter === "all" || row.dimension_class === state.classFilter);
              if (!rows.find((row) => row.dimension_id === state.dimensionId)) {
                state.dimensionId = rows[0] ? rows[0].dimension_id : family.scorecard_rows[0].dimension_id;
              }
              return rows;
            }

            function renderFamilyRibbon() {
              familyRibbon.innerHTML = families.map((family) => `
                <button
                  type="button"
                  class="family-tab"
                  data-family="${family.provider_family}"
                  aria-pressed="${family.provider_family === state.familyId}"
                  data-testid="provider-family-tab-${family.provider_family}">
                  <span class="family-dot" style="background:${family.accent};"></span>
                  <span>${family.title}</span>
                </button>
              `).join("");
              familyRibbon.querySelectorAll("button").forEach((button) => {
                button.addEventListener("click", () => {
                  state.familyId = button.dataset.family;
                  state.classFilter = "all";
                  classFilter.value = "all";
                  state.dimensionId = familyById[state.familyId].scorecard_rows[0].dimension_id;
                  render();
                });
              });
            }

            function renderDimensionRail(rows, family) {
              dimensionRail.innerHTML = rows.map((row) => `
                <button
                  type="button"
                  class="dimension-item"
                  data-selected="${row.dimension_id === state.dimensionId}"
                  data-dimension="${row.dimension_id}">
                  <div class="dimension-top">
                    <div class="dimension-title">${row.dimension_title}</div>
                    <div class="chip">${row.dimension_class}</div>
                  </div>
                  <div class="chip-row">
                    <span class="chip">M ${row.weight_mock_now}/${row.minimum_bar_mock_now}</span>
                    <span class="chip">A ${row.weight_actual_later}/${row.minimum_bar_actual_later}</span>
                    ${row.mock_must_have ? '<span class="chip warn">must-have</span>' : ""}
                    ${row.kill_switch_flag ? '<span class="chip alert">kill-switch</span>' : ""}
                  </div>
                </button>
              `).join("");
              dimensionRail.querySelectorAll("button").forEach((button) => {
                button.addEventListener("click", () => {
                  state.dimensionId = button.dataset.dimension;
                  render();
                });
              });
              familyRole.textContent = `${family.baseline_role} · ${family.recommended_lane}`;
            }

            function barWidth(weight) {
              return `${(weight / 12) * 100}%`;
            }

            function renderComparison(rows, family) {
              comparisonTitle.textContent = `${family.title} · weight comparison`;
              comparisonCanvas.innerHTML = rows.map((row) => `
                <button
                  type="button"
                  class="metric-row"
                  data-selected="${row.dimension_id === state.dimensionId}"
                  data-dimension="${row.dimension_id}">
                  <div class="metric-header">
                    <div class="metric-title">${row.dimension_title}</div>
                    <div class="chip-row">
                      <span class="chip">evidence ${row.evidence_required_mock_now.length}/${row.evidence_required_actual_later.length}</span>
                      <span class="chip ${row.lane_priority === "mock_now_heavier" ? "warn" : row.lane_priority === "actual_later_heavier" ? "alert" : ""}">
                        ${row.lane_priority.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div class="bars">
                    <div class="bar-row">
                      <div class="bar-label">Mock-now</div>
                      <div class="track"><div class="fill mock" style="width:${barWidth(row.weight_mock_now)}"></div></div>
                      <div class="bar-value">${row.weight_mock_now}</div>
                    </div>
                    <div class="bar-row">
                      <div class="bar-label">Actual-later</div>
                      <div class="track"><div class="fill actual" style="width:${barWidth(row.weight_actual_later)}"></div></div>
                      <div class="bar-value">${row.weight_actual_later}</div>
                    </div>
                  </div>
                </button>
              `).join("");
              comparisonCanvas.querySelectorAll("button").forEach((button) => {
                button.addEventListener("click", () => {
                  state.dimensionId = button.dataset.dimension;
                  render();
                });
              });
            }

            function renderTable(rows) {
              dimensionTableBody.innerHTML = rows.map((row) => `
                <tr data-dimension="${row.dimension_id}">
                  <td>${row.dimension_title}</td>
                  <td>${row.dimension_class}</td>
                  <td>${row.weight_mock_now} / min ${row.minimum_bar_mock_now}</td>
                  <td>${row.weight_actual_later} / min ${row.minimum_bar_actual_later}</td>
                  <td>${row.lane_priority.replaceAll("_", " ")}</td>
                </tr>
              `).join("");
            }

            function renderBriefSummary(family) {
              const brief = family.mock_design_brief;
              briefSummary.innerHTML = `
                <p>${brief.objective}</p>
                <div class="inspector-block">
                  <h3>Must emulate</h3>
                  <ul>${brief.must_emulate.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div class="inspector-block">
                  <h3>Placeholder only</h3>
                  <ul>${brief.placeholder_only.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
                <div class="inspector-block">
                  <h3>Never authoritative</h3>
                  <ul>${brief.never_authoritative.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
              `;
            }

            function renderQuestionBank(family) {
              questionBody.innerHTML = family.scorecard_rows.map((row) => `
                <tr>
                  <td>${row.due_diligence_question}</td>
                  <td>${row.dimension_title}</td>
                  <td>${row.minimum_bar_actual_later}</td>
                </tr>
              `).join("");
            }

            function renderRiskNotes(family) {
              riskNotes.innerHTML = family.risk_notes.map((risk) => `
                <div class="risk-note">
                  <strong>${risk.risk_id}</strong>
                  <div class="small">${risk.risk_title} · score ${risk.risk_score}</div>
                  <p>${risk.problem_statement}</p>
                </div>
              `).join("") + family.watch_notes.map((watch) => `
                <div class="inspector-block">
                  <h3>${watch.dependency_name}</h3>
                  <div class="small">${watch.lifecycle_state}</div>
                  <p>${watch.notes}</p>
                  <p class="small">Fallback: ${watch.fallback_strategy}</p>
                </div>
              `).join("");
            }

            function renderInspector(family, row) {
              inspectorTitle.textContent = row.dimension_title;
              inspectorNotes.textContent = row.notes;
              laneChips.innerHTML = `
                <span class="chip">Mock weight ${row.weight_mock_now}</span>
                <span class="chip">Mock min ${row.minimum_bar_mock_now}</span>
                <span class="chip">Actual weight ${row.weight_actual_later}</span>
                <span class="chip">Actual min ${row.minimum_bar_actual_later}</span>
                <span class="chip ${row.lane_priority === "actual_later_heavier" ? "alert" : row.lane_priority === "mock_now_heavier" ? "warn" : ""}">
                  ${row.lane_priority.replaceAll("_", " ")}
                </span>
              `;
              evidenceList.innerHTML = row.evidence_required_mock_now.concat(row.evidence_required_actual_later).map((item) => `<li>${item}</li>`).join("");
              killList.innerHTML = `
                <li><strong>Mock-now:</strong> ${row.kill_switch_if_failed_mock_now}</li>
                <li><strong>Actual-later:</strong> ${row.kill_switch_if_failed_actual_later}</li>
              `;
              sourceList.innerHTML = row.source_refs.map((item) => `<li>${item}</li>`).join("");
              document.documentElement.style.setProperty("--accent", family.accent);
            }

            function render() {
              renderFamilyRibbon();
              const family = familyById[state.familyId];
              const rows = rowsForCurrentFamily();
              renderDimensionRail(rows, family);
              renderComparison(rows, family);
              renderTable(rows);
              renderBriefSummary(family);
              renderQuestionBank(family);
              renderRiskNotes(family);
              const currentRow = family.scorecard_rows.find((row) => row.dimension_id === state.dimensionId) || family.scorecard_rows[0];
              renderInspector(family, currentRow);
            }

            render();
          </script>
        </body>
        </html>
        """
    return (
        textwrap.dedent(template)
        .replace("{{", "{")
        .replace("}}", "}")
        .replace("__FAMILY_COUNT__", str(payload["summary"]["provider_family_count"]))
        .replace("__ROW_COUNT__", str(payload["summary"]["scorecard_row_count"]))
        .replace("__QUESTION_COUNT__", str(payload["summary"]["question_count"]))
        .replace("__PHASE0_VERDICT__", payload["summary"]["phase0_entry_verdict"])
        .replace("__PAYLOAD_JSON__", safe_json)
    )


def write_outputs(payload: dict[str, Any]) -> None:
    write_json(SCORECARDS_JSON_PATH, payload)
    write_csv(
        WEIGHTS_CSV_PATH,
        weight_rows(payload),
        [
            "provider_family",
            "provider_family_title",
            "dimension_id",
            "dimension_title",
            "dimension_class",
            "weight_mock_now",
            "weight_actual_later",
            "weight_delta_actual_minus_mock",
            "same_weight_flag",
            "minimum_bar_mock_now",
            "minimum_bar_actual_later",
            "lane_priority",
            "baseline_role",
            "recommended_lane",
        ],
    )
    write_csv(
        MOCK_BARS_CSV_PATH,
        mock_bar_rows(payload),
        [
            "provider_family",
            "dimension_id",
            "dimension_title",
            "dimension_class",
            "minimum_bar_mock_now",
            "evidence_required_mock_now",
            "kill_switch_if_failed_mock_now",
            "source_refs",
            "notes",
        ],
    )
    write_csv(
        ACTUAL_KILLS_CSV_PATH,
        actual_kill_rows(payload),
        [
            "provider_family",
            "dimension_id",
            "dimension_title",
            "dimension_class",
            "minimum_bar_actual_later",
            "evidence_required_actual_later",
            "kill_switch_if_failed_actual_later",
            "source_refs",
            "notes",
        ],
    )
    write_csv(
        QUESTIONS_CSV_PATH,
        question_rows(payload),
        [
            "provider_family",
            "provider_family_title",
            "question_id",
            "dimension_id",
            "dimension_title",
            "question",
            "evidence_expected",
            "kill_switch_if_unproven",
            "source_refs",
        ],
    )
    render_scorecard_docs(payload)
    render_mock_briefs_doc(payload)
    render_playbook_doc(payload)
    render_rationale_doc(payload)
    write_text(STUDIO_HTML_PATH, build_html(payload))


def main() -> None:
    prereqs = ensure_prerequisites()
    payload = build_payload(prereqs)
    assert_true(
        {family["provider_family"] for family in payload["families"]} == MANDATORY_PROVIDER_FAMILIES,
        "Provider family set drifted while building seq_022 payload",
    )
    assert_true(
        {dimension["dimension_class"] for dimension in DIMENSIONS} == ALLOWED_DIMENSION_CLASSES,
        "Dimension catalog no longer covers the allowed dimension classes exactly",
    )
    write_outputs(payload)


if __name__ == "__main__":
    main()
