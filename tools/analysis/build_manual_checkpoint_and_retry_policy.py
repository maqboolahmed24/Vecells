#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
TOOLS_DIR = ROOT / "tools" / "browser-automation"
SHARED_DIR = TOOLS_DIR / "shared"

TASK_ID = "seq_039"
VISUAL_MODE = "Provider_Control_Tower"
CAPTURED_ON = "2026-04-11"
GENERATED_AT = datetime.now(timezone.utc).isoformat()
MISSION = (
    "Create one governed checkpoint and retry framework for provider and onboarding "
    "automation so mock-now rehearsals and actual-later portal work share the same "
    "evidence law, retry vocabulary, live-mutation fence, and secret-safe capture posture."
)

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "nhs_login_capture_pack": DATA_DIR / "nhs_login_capture_pack.json",
    "im1_pairing_pack": DATA_DIR / "im1_pairing_pack.json",
    "pds_access_pack": DATA_DIR / "pds_access_pack.json",
    "mesh_execution_pack": DATA_DIR / "mesh_execution_pack.json",
    "telephony_lab_pack": DATA_DIR / "32_telephony_lab_pack.json",
    "notification_studio_pack": DATA_DIR / "33_notification_studio_pack.json",
    "evidence_processing_lab_pack": DATA_DIR / "35_evidence_processing_lab_pack.json",
    "gp_provider_decision_register": DATA_DIR / "gp_provider_decision_register.json",
    "pharmacy_referral_transport_decision_register": DATA_DIR / "pharmacy_referral_transport_decision_register.json",
    "nhs_app_live_gate_checklist": DATA_DIR / "nhs_app_live_gate_checklist.json",
}

CHECKPOINT_CSV_PATH = DATA_DIR / "manual_approval_checkpoints.csv"
RETRY_MATRIX_JSON_PATH = DATA_DIR / "browser_automation_retry_matrix.json"
IDEMPOTENCY_RULES_CSV_PATH = DATA_DIR / "provider_portal_action_idempotency_rules.csv"
LIVE_GATE_RULES_JSON_PATH = DATA_DIR / "live_mutation_gate_rules.json"

CHECKPOINT_DOC_PATH = DOCS_DIR / "39_manual_approval_checkpoint_register.md"
RETRY_DOC_PATH = DOCS_DIR / "39_browser_automation_retry_policy.md"
LIVE_GATE_DOC_PATH = DOCS_DIR / "39_live_mutation_gate_policy.md"
CONTROL_TOWER_HTML_PATH = DOCS_DIR / "39_provider_portal_control_tower.html"

CHECKPOINT_MODEL_JS_PATH = SHARED_DIR / "provider_checkpoint_model.js"
ACTION_GUARD_JS_PATH = SHARED_DIR / "provider_action_guard.js"

SOURCE_PRECEDENCE = [
    "prompt/039.md",
    "prompt/shared_operating_contract_036_to_045.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md",
    "blueprint/platform-runtime-and-release-blueprint.md",
    "blueprint/phase-2-the-identity-and-echoes.md",
    "blueprint/phase-4-the-booking-engine.md",
    "blueprint/phase-6-the-pharmacy-loop.md",
    "blueprint/phase-7-inside-the-nhs-app.md",
    "blueprint/forensic-audit-findings.md",
    "docs/external/21_integration_priority_and_execution_matrix.md",
    "docs/external/23_actual_partner_account_governance.md",
    "docs/external/24_nhs_login_actual_onboarding_strategy.md",
    "docs/external/25_nhs_login_environment_profile_pack.md",
    "docs/external/26_im1_pairing_rehearsal_strategy.md",
    "docs/external/27_pds_access_request_strategy.md",
    "docs/external/28_mesh_message_route_and_proof_matrix.md",
    "docs/external/29_nhs_app_sandpit_to_aos_progression_pack.md",
    "docs/external/32_local_telephony_lab_spec.md",
    "docs/external/33_local_notification_studio_spec.md",
    "docs/external/35_local_evidence_processing_lab_spec.md",
    "docs/external/36_gp_system_pathways_actual_strategy.md",
    "docs/external/37_pharmacy_access_paths_actual_strategy.md",
    "docs/external/38_local_adapter_simulator_backlog.md",
]

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_CHECKPOINT_OWNERSHIP_IS_LEASED",
        "summary": (
            "Manual approval checkpoints behave like short-lived ownership fences: one named "
            "operator owns the next mutation decision until explicit evidence closes or hands off the step."
        ),
        "consequence": (
            "Resume tokens, approver identity, and live intent must travel together instead of "
            "being reconstructed after the fact."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_AMBIGUOUS_PORTAL_STATE_IS_NOT_SUCCESS",
        "summary": (
            "Portal rendering, button clicks, draft saves, and redirect landings remain "
            "non-authoritative until the step emits the exact evidence object or review reference named here."
        ),
        "consequence": (
            "The control model stops on ambiguity and refuses optimistic retries for partial success."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_SECRET_CAPTURE_STAYS_EXTERNAL",
        "summary": (
            "Live credentials, webhook secrets, signer details, and DNS tokens may be referenced "
            "by approved vault or evidence handles, but never persisted in repo fixtures, raw screenshots, traces, or HAR files."
        ),
        "consequence": (
            "Secret-sensitive actions always require redaction proof and a later vault or ticket receipt."
        ),
    },
]

FAMILY_META = {
    "nhs_login": {"label": "NHS login", "accent": "var(--primary)"},
    "gp_booking": {"label": "GP systems / IM1", "accent": "var(--review)"},
    "pds": {"label": "PDS", "accent": "var(--warning)"},
    "mesh": {"label": "MESH", "accent": "var(--primary)"},
    "telephony": {"label": "Telephony", "accent": "var(--safe)"},
    "notification": {"label": "Notification", "accent": "var(--safe)"},
    "evidence_processing": {"label": "Evidence processing", "accent": "var(--blocked)"},
    "pharmacy": {"label": "Pharmacy", "accent": "var(--warning)"},
    "nhs_app": {"label": "NHS App", "accent": "var(--review)"},
}

APPROVAL_LANES = [
    {
        "lane_id": "legal_governance",
        "label": "Legal / governance",
        "description": "Legal basis, governance approval, or feature-flag review before the step can widen beyond mock posture.",
    },
    {
        "lane_id": "sponsor_commercial",
        "label": "Sponsor / commercial",
        "description": "Named sponsor, commissioner, or commercial owner confirms the bounded MVP and supplier posture.",
    },
    {
        "lane_id": "signatory",
        "label": "Signatory",
        "description": "Human-only legal or organisational signatory handoff outside the repo and outside browser automation.",
    },
    {
        "lane_id": "environment_approval",
        "label": "Environment approval",
        "description": "A named approver binds the action to sandpit, integration, preprod, or production before mutation is allowed.",
    },
    {
        "lane_id": "vendor_service_desk",
        "label": "Vendor service desk",
        "description": "Supplier-side mailbox, workflow, number, sender, or account steps need later human liaison or service-desk handling.",
    },
    {
        "lane_id": "safety_privacy_assurance",
        "label": "Safety / privacy assurance",
        "description": "Hazard logs, risk logs, minimum-necessary review, or accessibility/service evidence must be current and approved.",
    },
    {
        "lane_id": "ownership_rehearsal",
        "label": "Ownership / rehearsal",
        "description": "Operational ownership, incident path, or urgent manual fallback must be rehearsed before live widening.",
    },
]

IDEMPOTENCY_CLASSES = [
    {
        "class_id": "read_only",
        "label": "Read only",
        "description": "No external mutation. Re-running fetches or labels is safe when evidence snapshots stay fresh.",
        "rank": 1,
    },
    {
        "class_id": "draft_resume_safe",
        "label": "Draft resume safe",
        "description": "A partially completed draft can be resumed from the same checkpoint, but not blindly restarted from scratch.",
        "rank": 2,
    },
    {
        "class_id": "review_checkpoint",
        "label": "Review checkpoint",
        "description": "The step can be revisited only after a named reviewer confirms the evidence pack still matches the intended mutation.",
        "rank": 3,
    },
    {
        "class_id": "non_idempotent_mutation",
        "label": "Non-idempotent mutation",
        "description": "Submitting twice may create duplicate provider state, duplicate approvals, spend, or conflicting onboarding requests.",
        "rank": 4,
    },
    {
        "class_id": "secret_material_handling",
        "label": "Secret material",
        "description": "Secrets or vault-bound evidence are in scope, so capture and retry rules are stricter than ordinary form mutation.",
        "rank": 5,
    },
]

EVIDENCE_CLASSES = [
    {
        "class_id": "gate_snapshot",
        "label": "Gate snapshot",
        "description": "A dated evidence snapshot showing the current blocked/review/pass state for a read-only step.",
        "rank": 1,
    },
    {
        "class_id": "checkpoint_receipt",
        "label": "Checkpoint receipt",
        "description": "A draft identifier, stage receipt, or structured review note that proves the step can be resumed safely.",
        "rank": 2,
    },
    {
        "class_id": "review_reference",
        "label": "Review reference",
        "description": "A named approval, legal, signatory, or governance reference tied to the current intended mutation.",
        "rank": 3,
    },
    {
        "class_id": "provider_receipt",
        "label": "Provider receipt",
        "description": "A supplier ticket, mailbox ID, or purchase/reference proving the provider accepted the exact action once.",
        "rank": 4,
    },
    {
        "class_id": "vault_receipt",
        "label": "Vault receipt",
        "description": "A masked evidence handle proving secret capture or vault promotion without leaking the underlying secret.",
        "rank": 5,
    },
]

RETRY_CLASSES = [
    {
        "class_id": "safe_read_retry",
        "label": "Safe read retry",
        "chip_label": "safe_read_retry",
        "description": "Repeat the read-only step when the target is unchanged and the evidence snapshot is refreshed.",
        "completion_evidence_rule": "A fresh gate snapshot or official label match proves completion.",
        "insufficient_evidence_rule": "Page load, HTTP 200, or button visibility alone are insufficient.",
        "idempotent": True,
        "max_auto_retries": 2,
        "backoff_posture": "short_linear_backoff",
        "screenshot_policy": "masked_stills_allowed",
        "trace_policy": "trace_allowed_without_secrets",
        "human_confirmation_before_mutation": False,
        "later_live_rule_reuse": True,
        "rank": 1,
    },
    {
        "class_id": "resume_from_checkpoint_only",
        "label": "Resume from checkpoint only",
        "chip_label": "resume_only",
        "description": "Do not rerun the whole path. Resume from the last stable draft or checkpoint receipt.",
        "completion_evidence_rule": "A stable draft id or checkpoint receipt proves where resume may start.",
        "insufficient_evidence_rule": "Filling the same fields again without a checkpoint token is insufficient.",
        "idempotent": False,
        "max_auto_retries": 0,
        "backoff_posture": "no_blind_retry_resume_only",
        "screenshot_policy": "masked_stills_allowed_before_commit",
        "trace_policy": "trace_until_checkpoint_only",
        "human_confirmation_before_mutation": False,
        "later_live_rule_reuse": True,
        "rank": 2,
    },
    {
        "class_id": "human_review_before_continue",
        "label": "Human review before continue",
        "chip_label": "human_review",
        "description": "Stop after assembling the evidence pack and wait for a named reviewer before any further mutation.",
        "completion_evidence_rule": "A named review reference tied to the next intended mutation proves completion.",
        "insufficient_evidence_rule": "Internal confidence or green UI state without reviewer identity is insufficient.",
        "idempotent": False,
        "max_auto_retries": 0,
        "backoff_posture": "stop_and_queue_review",
        "screenshot_policy": "masked_stills_only",
        "trace_policy": "trace_disabled_by_default",
        "human_confirmation_before_mutation": True,
        "later_live_rule_reuse": True,
        "rank": 3,
    },
    {
        "class_id": "capture_evidence_then_stop",
        "label": "Capture evidence then stop",
        "chip_label": "capture_stop",
        "description": "Capture the minimum safe proof, then stop so a human completes or reviews the external action.",
        "completion_evidence_rule": "A safe evidence bundle and handoff record prove the automation did enough.",
        "insufficient_evidence_rule": "A screenshot without approval context or redaction proof is insufficient.",
        "idempotent": False,
        "max_auto_retries": 0,
        "backoff_posture": "stop_after_capture",
        "screenshot_policy": "only_masked_approved_stills",
        "trace_policy": "trace_off_har_off",
        "human_confirmation_before_mutation": True,
        "later_live_rule_reuse": True,
        "rank": 4,
    },
    {
        "class_id": "never_auto_repeat",
        "label": "Never auto repeat",
        "chip_label": "never_auto_repeat",
        "description": "Submitting again risks duplicate provider state, duplicate spend, or duplicate onboarding. Never auto-repeat.",
        "completion_evidence_rule": "Only the first provider receipt or ticket id can prove completion.",
        "insufficient_evidence_rule": "Button-click success or page refresh after submit are insufficient.",
        "idempotent": False,
        "max_auto_retries": 0,
        "backoff_posture": "manual_reconciliation_only",
        "screenshot_policy": "no_commit_screenshots_without_approval",
        "trace_policy": "trace_off_har_off",
        "human_confirmation_before_mutation": True,
        "later_live_rule_reuse": True,
        "rank": 5,
    },
    {
        "class_id": "secrets_redacted_only",
        "label": "Secrets redacted only",
        "chip_label": "redacted_only",
        "description": "The step handles secret material. Captures are allowed only when redaction is proven and approved.",
        "completion_evidence_rule": "A vault receipt or quarantined masked evidence handle proves completion.",
        "insufficient_evidence_rule": "Clipboard copies, raw traces, HAR files, or unmasked screenshots are insufficient.",
        "idempotent": False,
        "max_auto_retries": 0,
        "backoff_posture": "manual_secret_reentry_only",
        "screenshot_policy": "redaction_proven_then_masked_stills_only",
        "trace_policy": "trace_off_har_off_console_scrubbed",
        "human_confirmation_before_mutation": True,
        "later_live_rule_reuse": True,
        "rank": 6,
    },
]

LADDER_STEPS = [
    {
        "stage_id": "read",
        "title": "Read",
        "law": "Fetch or inspect current portal state. A read can retry only if it remains read-only and evidence is refreshed.",
    },
    {
        "stage_id": "fill",
        "title": "Fill",
        "law": "Populate a draft. If state might already exist, resume from the draft receipt instead of replaying the whole flow.",
    },
    {
        "stage_id": "review",
        "title": "Review",
        "law": "Bind the next mutation to a named reviewer, approver, or evidence pack before commit.",
    },
    {
        "stage_id": "commit",
        "title": "Commit",
        "law": "Submit exactly once. Non-idempotent mutations never auto-repeat and button success does not prove settlement.",
    },
    {
        "stage_id": "verify",
        "title": "Verify",
        "law": "Confirm provider receipt, vault receipt, or explicit follow-up state without leaking secrets or over-inferring success.",
    },
]

SOURCE_PACK_SPECS = {
    "nhs_login": {
        "input_key": "nhs_login_capture_pack",
        "family": "nhs_login",
        "label": "NHS login",
        "required_env": [
            "NHS_LOGIN_NAMED_APPROVER",
            "NHS_LOGIN_ENVIRONMENT_TARGET",
            "ALLOW_REAL_PROVIDER_MUTATION",
        ],
        "env_bindings": {
            "named_approver": "NHS_LOGIN_NAMED_APPROVER",
            "environment_target": "NHS_LOGIN_ENVIRONMENT_TARGET",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
        },
        "harness_paths": [
            str(TOOLS_DIR / "nhs-login-live-application-dry-run.spec.js"),
            str(TOOLS_DIR / "nhs-login-credential-intake-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gates"],
        "selector_hint_accessor": lambda payload: payload.get("field_dependencies", {}),
        "max_evidence_age_days": 21,
    },
    "gp": {
        "input_key": "gp_provider_decision_register",
        "family": "gp_booking",
        "label": "GP systems / IM1",
        "required_env": None,
        "env_bindings": {
            "named_approver": "GP_PROVIDER_NAMED_APPROVER",
            "environment_target": "GP_PROVIDER_ENVIRONMENT_TARGET",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
        },
        "harness_paths": [
            str(TOOLS_DIR / "gp-provider-path-discovery-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gates"],
        "selector_hint_accessor": lambda payload: payload.get("dry_run_harness", {}),
        "max_evidence_age_days": 30,
    },
    "im1": {
        "input_key": "im1_pairing_pack",
        "family": "gp_booking",
        "label": "IM1 rehearsal",
        "required_env": None,
        "env_bindings": {
            "named_approver": "IM1_NAMED_APPROVER",
            "environment_target": "IM1_ENVIRONMENT_TARGET",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
        },
        "harness_paths": [
            str(TOOLS_DIR / "im1-prerequisites-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gate_pack"]["live_gates"],
        "selector_hint_accessor": lambda payload: payload["live_gate_pack"].get("selector_map", {}),
        "max_evidence_age_days": 30,
    },
    "pds": {
        "input_key": "pds_access_pack",
        "family": "pds",
        "label": "PDS",
        "required_env": None,
        "env_bindings": {
            "named_approver": "PDS_NAMED_APPROVER",
            "environment_target": "PDS_ENVIRONMENT_TARGET",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
        },
        "harness_paths": [
            str(TOOLS_DIR / "pds-digital-onboarding-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gate_pack"]["live_gates"],
        "selector_hint_accessor": lambda payload: payload["live_gate_pack"].get("selector_map", {}),
        "max_evidence_age_days": 30,
    },
    "mesh": {
        "input_key": "mesh_execution_pack",
        "family": "mesh",
        "label": "MESH",
        "required_env": None,
        "env_bindings": {
            "named_approver": "MESH_NAMED_APPROVER",
            "environment_target": "MESH_ENVIRONMENT_TARGET",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
            "spend_flag": "ALLOW_SPEND",
        },
        "harness_paths": [
            str(TOOLS_DIR / "mesh-mailbox-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gate_pack"]["live_gates"],
        "selector_hint_accessor": lambda payload: payload["live_gate_pack"].get("selector_map", {}),
        "max_evidence_age_days": 30,
    },
    "telephony": {
        "input_key": "telephony_lab_pack",
        "family": "telephony",
        "label": "Telephony",
        "required_env": None,
        "env_bindings": {
            "named_approver": "TELEPHONY_NAMED_APPROVER",
            "environment_target": "TELEPHONY_TARGET_ENVIRONMENT",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
            "spend_flag": "ALLOW_SPEND",
        },
        "harness_paths": [
            str(TOOLS_DIR / "telephony-account-and-number-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gate_pack"]["live_gates"],
        "selector_hint_accessor": lambda payload: payload["live_gate_pack"].get("selector_map", {}),
        "max_evidence_age_days": 14,
    },
    "notification": {
        "input_key": "notification_studio_pack",
        "family": "notification",
        "label": "Notification",
        "required_env": None,
        "env_bindings": {
            "named_approver": "NOTIFICATION_NAMED_APPROVER",
            "environment_target": "NOTIFICATION_TARGET_ENVIRONMENT",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
            "spend_flag": "ALLOW_SPEND",
        },
        "harness_paths": [
            str(TOOLS_DIR / "notification-project-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gate_pack"]["live_gates"],
        "selector_hint_accessor": lambda payload: payload["live_gate_pack"].get("selector_map", {}),
        "max_evidence_age_days": 14,
    },
    "evidence": {
        "input_key": "evidence_processing_lab_pack",
        "family": "evidence_processing",
        "label": "Evidence processing",
        "required_env": None,
        "env_bindings": {
            "named_approver": "EVIDENCE_NAMED_APPROVER",
            "environment_target": "EVIDENCE_TARGET_ENVIRONMENT",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
            "spend_flag": "ALLOW_SPEND",
        },
        "harness_paths": [
            str(TOOLS_DIR / "evidence-processing-project-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gate_pack"]["live_gates"],
        "selector_hint_accessor": lambda payload: payload["live_gate_pack"].get("selector_map", {}),
        "max_evidence_age_days": 14,
    },
    "pharmacy": {
        "input_key": "pharmacy_referral_transport_decision_register",
        "family": "pharmacy",
        "label": "Pharmacy",
        "required_env": None,
        "env_bindings": {
            "named_approver": "PHARMACY_NAMED_APPROVER",
            "environment_target": "PHARMACY_TARGET_ENVIRONMENT",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
        },
        "harness_paths": [
            str(TOOLS_DIR / "pharmacy-access-path-discovery-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gates"],
        "selector_hint_accessor": lambda payload: payload.get("dry_run_harness", {}),
        "max_evidence_age_days": 14,
    },
    "nhs_app": {
        "input_key": "nhs_app_live_gate_checklist",
        "family": "nhs_app",
        "label": "NHS App",
        "required_env": [
            "NHS_APP_NAMED_APPROVER",
            "NHS_APP_ENVIRONMENT_TARGET",
            "ALLOW_REAL_PROVIDER_MUTATION",
        ],
        "env_bindings": {
            "named_approver": "NHS_APP_NAMED_APPROVER",
            "environment_target": "NHS_APP_ENVIRONMENT_TARGET",
            "live_mutation_flag": "ALLOW_REAL_PROVIDER_MUTATION",
        },
        "harness_paths": [
            str(TOOLS_DIR / "nhs-app-eoi-and-environment-dry-run.spec.js"),
            str(TOOLS_DIR / "site-link-registration-dry-run.spec.js"),
        ],
        "live_gate_accessor": lambda payload: payload["live_gates"],
        "selector_hint_accessor": lambda payload: payload.get("selector_map", {}),
        "max_evidence_age_days": 30,
    },
}

ACTION_SPECS = [
    {
        "action_key": "act_nhs_login_partner_application_review",
        "action_label": "Review NHS login partner application route",
        "provider_family": "nhs_login",
        "source_pack_key": "nhs_login",
        "dependency_ids": ["dep_nhs_login_rail"],
        "task_refs": ["seq_024", "seq_025"],
        "stage": "read",
        "retry_class": "safe_read_retry",
        "idempotency_class": "read_only",
        "evidence_class": "gate_snapshot",
        "approval_lane_ids": ["environment_approval"],
        "live_gate_ids": ["LIVE_GATE_IDENTITY_SESSION_PARITY"],
        "selector_refs": [
            "field_dependencies.application_dossier_fields",
            "field_dependencies.named_approver_field_id",
        ],
        "summary": (
            "Re-open the rehearsal field pack, verify the current official labels, and capture a fresh gate snapshot without mutating the provider route."
        ),
        "mock_now_execution": "Read labels and gate posture only. Stop before any real submission affordance.",
        "actual_provider_strategy_later": "Use the same gate snapshot before the real partner request so later runs start from current evidence rather than stale assumptions.",
        "completion_evidence": [
            "Fresh gate snapshot stamped with the capture date",
            "Official label checks still match the current NHS login guidance",
        ],
        "insufficient_evidence": [
            "Landing on the page",
            "A visible submit button or populated draft fields without a dated snapshot",
        ],
        "redaction_policy": "Masked stills only. Never expose redirect URIs, emails, or client identifiers in raw captures.",
        "human_checkpoints": [
            "Human review still decides when the rehearsal pack may widen into a real partner submission.",
        ],
    },
    {
        "action_key": "act_nhs_login_redirect_registration_review",
        "action_label": "Approve redirect and scope registration pack",
        "provider_family": "nhs_login",
        "source_pack_key": "nhs_login",
        "dependency_ids": ["dep_nhs_login_rail"],
        "task_refs": ["seq_024", "seq_025"],
        "stage": "review",
        "retry_class": "human_review_before_continue",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["environment_approval", "safety_privacy_assurance"],
        "live_gate_ids": ["LIVE_GATE_REDIRECT_URI_REVIEW", "LIVE_GATE_TECHNICAL_CONFORMANCE_PENDING"],
        "selector_refs": [
            "cred_redirect_review_ref",
            "cred_scope_approval_ref",
        ],
        "summary": "Bind the redirect URI and scope pack to a named reviewer before any real registration step can proceed.",
        "mock_now_execution": "Assemble the redirect matrix and review checklist, then stop for named approval.",
        "actual_provider_strategy_later": "Later sandpit or live registration must reuse the same review reference and reject blind reruns.",
        "completion_evidence": [
            "Named redirect review reference linked to the active route family",
            "Scope approval reference tied to the same environment target",
        ],
        "insufficient_evidence": [
            "A locally generated redirect list without reviewer identity",
            "A button click that never yields a review reference",
        ],
        "redaction_policy": "Allow masked stills of the review pack only after route-specific identifiers are obscured.",
        "human_checkpoints": [
            "Human review approves any real redirect registration or scope widening.",
        ],
    },
    {
        "action_key": "act_nhs_login_credential_promotion",
        "action_label": "Promote NHS login credentials into vault-handled storage",
        "provider_family": "nhs_login",
        "source_pack_key": "nhs_login",
        "dependency_ids": ["dep_nhs_login_rail"],
        "task_refs": ["seq_025"],
        "stage": "verify",
        "retry_class": "secrets_redacted_only",
        "idempotency_class": "secret_material_handling",
        "evidence_class": "vault_receipt",
        "approval_lane_ids": ["environment_approval", "safety_privacy_assurance"],
        "live_gate_ids": [
            "LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED",
            "LIVE_GATE_ENVIRONMENT_TARGET_MISSING",
            "LIVE_GATE_MUTATION_FLAG_DISABLED",
        ],
        "selector_refs": [
            "cred_named_approver",
            "cred_environment_target",
            "cred_live_mutation_flag",
        ],
        "summary": "Handle client credentials or secret material only through masked capture and later vault receipts.",
        "mock_now_execution": "Use placeholders and quarantine-first handling only; never store real secret values in repo outputs.",
        "actual_provider_strategy_later": "The live step stays blocked until partner approval, environment target, and mutation approval are explicit.",
        "completion_evidence": [
            "Vault or quarantine receipt for the secret material",
            "Named approver bound to the same environment target",
            "Redaction approval reference for any still capture",
        ],
        "insufficient_evidence": [
            "Clipboard copies",
            "Raw screenshots, traces, HAR files, or logs containing secret material",
        ],
        "redaction_policy": "Traces and HAR are off. Only masked stills with an explicit redaction approval reference are allowed.",
        "human_checkpoints": [
            "Dual review approves secret promotion before any preprod or production vault write.",
        ],
    },
    {
        "action_key": "act_gp_provider_path_review",
        "action_label": "Review GP provider path evidence and shortlist posture",
        "provider_family": "gp_booking",
        "source_pack_key": "gp",
        "dependency_ids": ["dep_gp_system_supplier_paths", "dep_local_booking_supplier_adapters"],
        "task_refs": ["seq_036"],
        "stage": "read",
        "retry_class": "safe_read_retry",
        "idempotency_class": "read_only",
        "evidence_class": "gate_snapshot",
        "approval_lane_ids": ["sponsor_commercial"],
        "live_gate_ids": ["LIVE_GATE_PROVIDER_PATH_EVIDENCE_PUBLISHED", "LIVE_GATE_APPROVED_PROVIDER_SCORECARDS"],
        "selector_refs": ["row_im1_optum", "row_gpc", "row_bars"],
        "summary": "Inspect the provider pathfinder and official label checks without opening a real supplier path.",
        "mock_now_execution": "Use the pathfinder as a read-only proof surface and keep the live route closed.",
        "actual_provider_strategy_later": "Re-run the same evidence review before any supplier claim so later automation starts from the current shortlist and path evidence.",
        "completion_evidence": [
            "Fresh path evidence snapshot",
            "Official supplier labels still match the current provider guidance",
        ],
        "insufficient_evidence": [
            "A remembered shortlist with no capture date",
            "A locally sorted table with no source snapshot",
        ],
        "redaction_policy": "Screenshots may be taken because no secret fields are involved, but route-specific tickets must still be masked.",
        "human_checkpoints": [
            "Programme ownership still decides which supplier path is worth later onboarding effort.",
        ],
    },
    {
        "action_key": "act_im1_prerequisite_pack_draft",
        "action_label": "Resume IM1 prerequisite dossier drafting",
        "provider_family": "gp_booking",
        "source_pack_key": "im1",
        "dependency_ids": ["dep_im1_pairing_programme", "dep_gp_system_supplier_paths"],
        "task_refs": ["seq_026"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["sponsor_commercial", "signatory", "safety_privacy_assurance"],
        "live_gate_ids": ["LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN", "LIVE_GATE_SAFETY_PRIVACY_ARCHITECTURE_CURRENT"],
        "selector_refs": ["actual-field-sponsor-name", "actual-field-commercial-owner", "actual-field-named-approver"],
        "summary": "Draft the prerequisite dossier only from the last saved checkpoint so sponsor placeholders and supplier evidence do not drift.",
        "mock_now_execution": "Resume the mock dossier from the current placeholder-backed stage receipt.",
        "actual_provider_strategy_later": "Later live drafting must use the same checkpoint model so supplier and assurance evidence stays versioned instead of retyped.",
        "completion_evidence": [
            "Draft checkpoint receipt tied to the active supplier pair",
            "Current capability and architecture evidence refs attached to the same draft",
        ],
        "insufficient_evidence": [
            "Re-entering the form from scratch",
            "A screenshot of completed fields with no draft receipt",
        ],
        "redaction_policy": "Allow masked draft screenshots only before commit and only when legal placeholders are still synthetic.",
        "human_checkpoints": [
            "Named sponsor and commercial owner still approve when placeholders are replaced with real details.",
        ],
    },
    {
        "action_key": "act_im1_supported_test_admissibility_review",
        "action_label": "Review IM1 supported-test admissibility",
        "provider_family": "gp_booking",
        "source_pack_key": "im1",
        "dependency_ids": ["dep_im1_pairing_programme", "dep_gp_system_supplier_paths"],
        "task_refs": ["seq_026"],
        "stage": "review",
        "retry_class": "human_review_before_continue",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["sponsor_commercial", "safety_privacy_assurance"],
        "live_gate_ids": ["LIVE_GATE_CREDIBLE_MVP_AND_BOUNDED_USE_CASE", "LIVE_GATE_PROVIDER_CAPABILITY_MODEL_FROZEN"],
        "selector_refs": ["supported_test_request_review"],
        "summary": "Stop after assembling the supported-test request and wait for an admissibility review rather than replaying the flow.",
        "mock_now_execution": "Compile the request pack and capture the evidence ladder that proves why the request is bounded and admissible.",
        "actual_provider_strategy_later": "A live supported-test request must not proceed unless the same review reference is current.",
        "completion_evidence": [
            "Named admissibility review reference",
            "Bounded MVP statement and supplier capability evidence linked to the same review",
        ],
        "insufficient_evidence": [
            "A completed request form with no reviewer identity",
            "A provider portal login with no bounded-use-case sign-off",
        ],
        "redaction_policy": "Masked stills only. Legal names and supplier identifiers stay outside raw captures.",
        "human_checkpoints": [
            "Human review confirms the supported-test request is admissible.",
        ],
    },
    {
        "action_key": "act_im1_license_signatory_handoff",
        "action_label": "Capture IM1 signatory handoff evidence and stop",
        "provider_family": "gp_booking",
        "source_pack_key": "im1",
        "dependency_ids": ["dep_im1_pairing_programme"],
        "task_refs": ["seq_026"],
        "stage": "verify",
        "retry_class": "capture_evidence_then_stop",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["signatory", "sponsor_commercial"],
        "live_gate_ids": ["LIVE_GATE_NAMED_SPONSOR_AND_COMMERCIAL_OWNER", "LIVE_GATE_NAMED_APPROVER_PRESENT"],
        "selector_refs": ["ROLE_COMMERCIAL_OWNER", "provider_supplier_signatory"],
        "summary": "Collect the minimum masked proof that the legal handoff is ready, then stop before any signatory or legal mutation.",
        "mock_now_execution": "Track signatory readiness and placeholder ownership only.",
        "actual_provider_strategy_later": "A human-owned signatory chain completes the real handoff outside browser automation.",
        "completion_evidence": [
            "Legal handoff reference or ticket id",
            "Named sponsor, commercial owner, and approver identities stored outside the repo",
        ],
        "insufficient_evidence": [
            "Unapproved legal names in draft fields",
            "A screenshot of signatory slots without a handoff reference",
        ],
        "redaction_policy": "Only masked stills of role labels are allowed. No real legal names or signatory details appear in captures.",
        "human_checkpoints": [
            "Named signatories complete the legal path outside browser automation.",
        ],
    },
    {
        "action_key": "act_im1_submission_commit",
        "action_label": "Submit IM1 provider request once",
        "provider_family": "gp_booking",
        "source_pack_key": "im1",
        "dependency_ids": ["dep_im1_pairing_programme", "dep_gp_system_supplier_paths"],
        "task_refs": ["seq_026"],
        "stage": "commit",
        "retry_class": "never_auto_repeat",
        "idempotency_class": "non_idempotent_mutation",
        "evidence_class": "provider_receipt",
        "approval_lane_ids": ["signatory", "environment_approval", "sponsor_commercial"],
        "live_gate_ids": [
            "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
            "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "LIVE_GATE_MUTATION_FLAG_ENABLED",
        ],
        "selector_refs": ["actual-submit-button"],
        "summary": "A real IM1 submission is a one-shot commit. Any ambiguity after submit goes to reconciliation, not replay.",
        "mock_now_execution": "Dry-run stops before the final submit and records why the commit remains blocked.",
        "actual_provider_strategy_later": "Later live submission requires a fresh provider receipt and never allows blind resubmission.",
        "completion_evidence": [
            "Provider ticket or receipt id for the exact submission",
            "Named approver, environment target, and explicit live flag bound to the same commit",
        ],
        "insufficient_evidence": [
            "A clicked button with no provider receipt",
            "Refreshing the page and assuming the request landed",
        ],
        "redaction_policy": "Commit-phase screenshots are disabled by default. If a still is required, it must be masked and approved before capture.",
        "human_checkpoints": [
            "Named approver explicitly authorises the live submission against a current environment target.",
        ],
    },
    {
        "action_key": "act_pds_use_case_pack_draft",
        "action_label": "Resume PDS use-case and risk-pack drafting",
        "provider_family": "pds",
        "source_pack_key": "pds",
        "dependency_ids": ["dep_pds_fhir_enrichment"],
        "task_refs": ["seq_027"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["legal_governance", "safety_privacy_assurance"],
        "live_gate_ids": ["PDS_LIVE_GATE_ACCESS_MODE_SELECTED", "PDS_LIVE_GATE_HAZARD_LOG_CURRENT", "PDS_LIVE_GATE_RISK_LOGS_CURRENT"],
        "selector_refs": ["field_approver", "field_environment", "hazard_row", "risk_row"],
        "summary": "Resume the route-bound PDS use-case pack from its last checkpoint rather than replaying the onboarding form.",
        "mock_now_execution": "Keep the route flags default-off and resume the mock pack only from the current draft receipt.",
        "actual_provider_strategy_later": "Later onboarding must reuse the checkpoint receipt so the legal basis, hazard log, and risk log stay aligned.",
        "completion_evidence": [
            "Draft receipt linked to the chosen access mode",
            "Current hazard and risk log references attached to the same draft",
        ],
        "insufficient_evidence": [
            "A restated use case without route binding",
            "A green UI with no hazard or risk evidence refs",
        ],
        "redaction_policy": "Masked draft captures are allowed, but patient-like identifiers and organisation details must stay synthetic or obscured.",
        "human_checkpoints": [
            "Governance review still approves which PDS access mode may proceed later.",
        ],
    },
    {
        "action_key": "act_pds_legal_basis_review",
        "action_label": "Review PDS legal basis and feature-flag approval",
        "provider_family": "pds",
        "source_pack_key": "pds",
        "dependency_ids": ["dep_pds_fhir_enrichment"],
        "task_refs": ["seq_027"],
        "stage": "review",
        "retry_class": "human_review_before_continue",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["legal_governance", "environment_approval"],
        "live_gate_ids": ["LIVE_GATE_PDS_LEGAL_BASIS_APPROVED", "PDS_LIVE_GATE_ROLLBACK_REHEARSED"],
        "selector_refs": ["page-tab-Use_Case_and_Legal_Basis", "page-tab-Rollback_and_Kill_Switches"],
        "summary": "Legal basis, feature-flag scope, and rollback posture require named review before any real PDS access can open.",
        "mock_now_execution": "Model the legal basis and rollback questions, then stop for approval.",
        "actual_provider_strategy_later": "Live access later reuses the same review posture and refuses any shortcut around legal sign-off.",
        "completion_evidence": [
            "Named legal or governance approval reference",
            "Rollback rehearsal evidence tied to the same route-bound access mode",
        ],
        "insufficient_evidence": [
            "A draft legal basis paragraph with no approver identity",
            "An assumed rollback plan with no rehearsal reference",
        ],
        "redaction_policy": "Only masked stills of approval metadata are allowed. No patient or operator identifiers in captures.",
        "human_checkpoints": [
            "Legal basis and governance approval must exist before sandbox or live access.",
        ],
    },
    {
        "action_key": "act_mesh_mailbox_application_draft",
        "action_label": "Resume MESH mailbox application drafting",
        "provider_family": "mesh",
        "source_pack_key": "mesh",
        "dependency_ids": ["dep_cross_org_secure_messaging_mesh"],
        "task_refs": ["seq_028"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["vendor_service_desk", "safety_privacy_assurance"],
        "live_gate_ids": ["MESH_LIVE_GATE_OWNER_ODS_KNOWN", "MESH_LIVE_GATE_MANAGER_MODE_DECIDED", "MESH_LIVE_GATE_MINIMUM_NECESSARY_REVIEW"],
        "selector_refs": ["mailbox_button", "field_owner_ods", "field_manager_mode", "field_workflow_contact"],
        "summary": "Resume the mailbox application from its last checkpoint so owner ODS and manager mode stay consistent.",
        "mock_now_execution": "Populate the mock application pack and preserve the current receipt for safe resume.",
        "actual_provider_strategy_later": "Live mailbox setup later must continue from the same bounded draft rather than replaying the whole application blindly.",
        "completion_evidence": [
            "Application draft receipt linked to the mailbox row",
            "Current owner ODS and minimum-necessary review refs on the same draft",
        ],
        "insufficient_evidence": [
            "Re-entering owner details with no checkpoint receipt",
            "A filled form with no proof of liaison or minimum-necessary review",
        ],
        "redaction_policy": "Masked stills allowed before commit. ODS identifiers may appear only if the pack is still synthetic or approved.",
        "human_checkpoints": [
            "Mailbox owner ODS and managing-party posture must be explicitly reviewed before live submission.",
        ],
    },
    {
        "action_key": "act_mesh_workflow_request_submit",
        "action_label": "Submit MESH workflow request once",
        "provider_family": "mesh",
        "source_pack_key": "mesh",
        "dependency_ids": ["dep_cross_org_secure_messaging_mesh"],
        "task_refs": ["seq_028"],
        "stage": "commit",
        "retry_class": "never_auto_repeat",
        "idempotency_class": "non_idempotent_mutation",
        "evidence_class": "provider_receipt",
        "approval_lane_ids": ["vendor_service_desk", "environment_approval"],
        "live_gate_ids": [
            "MESH_LIVE_GATE_PHASE0_EXTERNAL_READY",
            "MESH_LIVE_GATE_API_ONBOARDING_COMPLETE",
            "MESH_LIVE_GATE_NAMED_APPROVER_PRESENT",
            "MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK",
            "MESH_LIVE_GATE_FINAL_POSTURE",
        ],
        "selector_refs": ["workflow_row", "final_submit"],
        "summary": "A MESH workflow request is a non-idempotent provider mutation. Submit exactly once or escalate to human reconciliation.",
        "mock_now_execution": "Dry-run completes the draft and stops before final request submission.",
        "actual_provider_strategy_later": "The real request later must capture one workflow receipt and must never be replayed automatically.",
        "completion_evidence": [
            "Workflow request or mailbox ticket id",
            "Named approver and environment target bound to the same attempt",
        ],
        "insufficient_evidence": [
            "A clicked submit button with no request id",
            "A page refresh implying the workflow already exists",
        ],
        "redaction_policy": "Commit-phase capture is disabled unless a masked still is explicitly approved for the evidence pack.",
        "human_checkpoints": [
            "Supplier liaison and operator acknowledgement remain mandatory before any real workflow request.",
        ],
    },
    {
        "action_key": "act_telephony_account_project_draft",
        "action_label": "Resume telephony account and number plan drafting",
        "provider_family": "telephony",
        "source_pack_key": "telephony",
        "dependency_ids": ["dep_telephony_ivr_recording_provider"],
        "task_refs": ["seq_032"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["environment_approval", "safety_privacy_assurance"],
        "live_gate_ids": ["TEL_LIVE_GATE_WEBHOOK_SECURITY_PACK", "TEL_LIVE_GATE_RECORDING_REVIEW_APPROVED", "TEL_LIVE_GATE_ENVIRONMENT_TARGET"],
        "selector_refs": ["field_vendor", "field_recording_policy", "field_number_profile", "field_secret_ref"],
        "summary": "Resume telephony project setup from the last draft so webhook, recording, and spend posture stay in one evidence bundle.",
        "mock_now_execution": "Populate the dry-run form and keep the real submit button disabled.",
        "actual_provider_strategy_later": "Later real setup continues from the checkpoint receipt and still requires the same recording and webhook pack.",
        "completion_evidence": [
            "Draft receipt for the chosen vendor and number profile",
            "Current recording policy and webhook security refs attached to the same draft",
        ],
        "insufficient_evidence": [
            "Re-filling the vendor console from scratch",
            "A selected vendor with no recording or webhook evidence refs",
        ],
        "redaction_policy": "Masked draft captures only. Secret refs may appear only as vault handles, never raw secrets.",
        "human_checkpoints": [
            "Recording policy and environment target still need later approval before any spend-bearing mutation.",
        ],
    },
    {
        "action_key": "act_telephony_number_purchase",
        "action_label": "Purchase or bind a telephony number once",
        "provider_family": "telephony",
        "source_pack_key": "telephony",
        "dependency_ids": ["dep_telephony_ivr_recording_provider"],
        "task_refs": ["seq_032"],
        "stage": "commit",
        "retry_class": "never_auto_repeat",
        "idempotency_class": "non_idempotent_mutation",
        "evidence_class": "provider_receipt",
        "approval_lane_ids": ["environment_approval", "vendor_service_desk"],
        "live_gate_ids": ["TEL_LIVE_GATE_PROCUREMENT_AND_SPEND_AUTHORITY", "TEL_LIVE_GATE_NAMED_APPROVER", "TEL_LIVE_GATE_MUTATION_AND_SPEND_FLAGS", "TEL_LIVE_GATE_FINAL_POSTURE"],
        "selector_refs": ["field_spend_cap", "final_submit"],
        "summary": "Buying or binding a number can create spend and external state. Never auto-repeat after commit.",
        "mock_now_execution": "The dry-run script must stop with the provider submit disabled while Phase 0 remains withheld.",
        "actual_provider_strategy_later": "A live number purchase later requires one provider receipt and explicit spend authority.",
        "completion_evidence": [
            "Provider number or purchase receipt",
            "Spend approval reference and named approver tied to the same action",
        ],
        "insufficient_evidence": [
            "Seeing a candidate number in the console",
            "Assuming success because the page stayed open after submit",
        ],
        "redaction_policy": "No unapproved commit-phase captures. Any evidence still must mask account identifiers and numbers until the receipt is archived safely.",
        "human_checkpoints": [
            "Procurement and spend authority must be explicit before buying or binding numbers.",
        ],
    },
    {
        "action_key": "act_notification_project_draft",
        "action_label": "Resume notification project and sender draft",
        "provider_family": "notification",
        "source_pack_key": "notification",
        "dependency_ids": ["dep_sms_notification_provider", "dep_email_notification_provider"],
        "task_refs": ["seq_033"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["environment_approval", "vendor_service_desk"],
        "live_gate_ids": ["LIVE_GATE_NOTIFY_PROJECT_SCOPE", "LIVE_GATE_NOTIFY_REPAIR_POLICY", "LIVE_GATE_NOTIFY_TEMPLATE_MIGRATION"],
        "selector_refs": ["field_vendor", "field_project_scope", "field_sender_ref", "field_domain_ref"],
        "summary": "Resume the notification project draft from the last stable checkpoint so scope, repair posture, and sender identity stay aligned.",
        "mock_now_execution": "Use the dry-run studio to rehearse scope and sender choices while leaving the live posture blocked.",
        "actual_provider_strategy_later": "Real account or project work later must reuse the same checkpoint and environment split.",
        "completion_evidence": [
            "Project draft receipt for the chosen provider family",
            "Current repair, migration, and scope references bound to the same draft",
        ],
        "insufficient_evidence": [
            "Re-entering project details with no checkpoint receipt",
            "A chosen sender identity with no environment or repair posture",
        ],
        "redaction_policy": "Masked draft captures only. Sender refs may appear as identity handles, never raw credentials or tokens.",
        "human_checkpoints": [
            "Environment split and repair posture still need human confirmation before live widening.",
        ],
    },
    {
        "action_key": "act_notification_sender_domain_verification",
        "action_label": "Capture sender or domain verification evidence and stop",
        "provider_family": "notification",
        "source_pack_key": "notification",
        "dependency_ids": ["dep_sms_notification_provider", "dep_email_notification_provider"],
        "task_refs": ["seq_033"],
        "stage": "verify",
        "retry_class": "capture_evidence_then_stop",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["ownership_rehearsal", "vendor_service_desk"],
        "live_gate_ids": ["LIVE_GATE_NOTIFY_SENDER_OWNERSHIP", "LIVE_GATE_NOTIFY_DOMAIN_VERIFICATION", "LIVE_GATE_NOTIFY_WEBHOOK_SECURITY"],
        "selector_refs": ["field_sender_ref", "field_domain_ref"],
        "summary": "Capture the minimum evidence that sender or domain verification is ready, then stop for manual DNS or ownership work.",
        "mock_now_execution": "Rehearse sender/domain readiness without trying to complete real verification.",
        "actual_provider_strategy_later": "Later DNS or sender verification completes outside the repo and must not be replayed from browser automation.",
        "completion_evidence": [
            "Ownership or DNS handoff reference",
            "Signed webhook security reference for the same sender or domain identity",
        ],
        "insufficient_evidence": [
            "A pending verification badge with no ownership ticket",
            "A screenshot of DNS tokens with no approval or masking",
        ],
        "redaction_policy": "Only masked stills are allowed. DNS tokens, webhook secrets, and raw sender identifiers must be obscured.",
        "human_checkpoints": [
            "Sender or domain ownership remains a human-owned approval path before live widening.",
        ],
    },
    {
        "action_key": "act_evidence_vendor_project_draft",
        "action_label": "Resume evidence-processing provider draft",
        "provider_family": "evidence_processing",
        "source_pack_key": "evidence",
        "dependency_ids": ["dep_transcription_processing_provider", "dep_malware_scanning_provider"],
        "task_refs": ["seq_035"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["safety_privacy_assurance", "environment_approval"],
        "live_gate_ids": [
            "LIVE_GATE_EVIDENCE_REGION_POLICY_EXPLICIT",
            "LIVE_GATE_EVIDENCE_RETENTION_POLICY_EXPLICIT",
            "LIVE_GATE_EVIDENCE_STORAGE_SCOPE_DEFINED",
            "LIVE_GATE_EVIDENCE_QUARANTINE_POLICY_FROZEN",
        ],
        "selector_refs": ["EVIDENCE_REGION_POLICY_REF", "EVIDENCE_RETENTION_POLICY_REF", "EVIDENCE_STORAGE_BUCKET_REF", "EVIDENCE_SCAN_POLICY_REF"],
        "summary": "Resume provider project setup from the current checkpoint so region, retention, storage, and quarantine posture stay bound together.",
        "mock_now_execution": "Fill the evidence-processing project draft and stop before any live create action.",
        "actual_provider_strategy_later": "Later live setup must resume from the stored draft receipt and reuse the same evidence bundle.",
        "completion_evidence": [
            "Draft receipt for the chosen provider and project scope",
            "Current region, retention, storage, and quarantine references",
        ],
        "insufficient_evidence": [
            "A provider selection with no policy refs",
            "A draft screenshot with no checkpoint receipt",
        ],
        "redaction_policy": "Masked draft captures only. Storage names and project identifiers may appear only when approved and non-secret.",
        "human_checkpoints": [
            "Retention, deletion, and quarantine posture must be reviewed before any live mutation.",
        ],
    },
    {
        "action_key": "act_evidence_webhook_secret_capture",
        "action_label": "Capture evidence-processing webhook secret handling safely",
        "provider_family": "evidence_processing",
        "source_pack_key": "evidence",
        "dependency_ids": ["dep_transcription_processing_provider", "dep_malware_scanning_provider"],
        "task_refs": ["seq_035"],
        "stage": "verify",
        "retry_class": "secrets_redacted_only",
        "idempotency_class": "secret_material_handling",
        "evidence_class": "vault_receipt",
        "approval_lane_ids": ["safety_privacy_assurance", "environment_approval"],
        "live_gate_ids": ["LIVE_GATE_EVIDENCE_WEBHOOK_SECURITY_READY", "LIVE_GATE_EVIDENCE_NAMED_APPROVER_AND_ENV", "LIVE_GATE_EVIDENCE_MUTATION_FLAG"],
        "selector_refs": ["EVIDENCE_WEBHOOK_SECRET_REF", "EVIDENCE_WEBHOOK_BASE_URL"],
        "summary": "Treat webhook-secret entry and secret-backed callback wiring as a redaction-first evidence capture step.",
        "mock_now_execution": "Use placeholder secret refs and keep traces, HAR, and console output scrubbed.",
        "actual_provider_strategy_later": "Later live setup may proceed only with a vault receipt, current evidence bundle, and explicit live approval.",
        "completion_evidence": [
            "Vault receipt for the webhook secret reference",
            "Current replay-control and callback security evidence",
        ],
        "insufficient_evidence": [
            "A raw secret visible in the console, trace, or screenshot",
            "An unmasked callback URL capture with embedded secret material",
        ],
        "redaction_policy": "Traces and HAR stay off. Console logs must be scrubbed. Masked stills are allowed only with redaction proof.",
        "human_checkpoints": [
            "Webhook security and replay controls require human review before any live provider project is activated.",
        ],
    },
    {
        "action_key": "act_pharmacy_directory_route_review",
        "action_label": "Review pharmacy directory and access path evidence",
        "provider_family": "pharmacy",
        "source_pack_key": "pharmacy",
        "dependency_ids": ["dep_pharmacy_directory_dohs", "dep_pharmacy_referral_transport"],
        "task_refs": ["seq_037"],
        "stage": "read",
        "retry_class": "safe_read_retry",
        "idempotency_class": "read_only",
        "evidence_class": "gate_snapshot",
        "approval_lane_ids": ["ownership_rehearsal"],
        "live_gate_ids": ["LIVE_GATE_PHARMACY_PROVIDER_SCORECARDS_APPROVED", "LIVE_GATE_PHARMACY_TRANSPORT_SCORECARDS_APPROVED"],
        "selector_refs": ["row_service_search", "row_update_record", "row_manual_fallback"],
        "summary": "Review directory, Update Record, and manual fallback evidence without trying to open a live pharmacy route.",
        "mock_now_execution": "Use the route observatory to inspect transport and fallback posture only.",
        "actual_provider_strategy_later": "The same read-only evidence review runs before any later provider claim so route selection starts from current facts.",
        "completion_evidence": [
            "Fresh route snapshot showing the current preferred, fallback, and manual paths",
            "Official label checks still match current pharmacy guidance",
        ],
        "insufficient_evidence": [
            "A remembered preferred route with no snapshot",
            "A visual table with no captured evidence date",
        ],
        "redaction_policy": "Masked stills are allowed; route data is not secret, but practice-specific identifiers still need masking if present.",
        "human_checkpoints": [
            "Patient-choice and live tuple evidence still need later sign-off before a live route opens.",
        ],
    },
    {
        "action_key": "act_pharmacy_dispatch_route_commit",
        "action_label": "Commit a pharmacy dispatch route once",
        "provider_family": "pharmacy",
        "source_pack_key": "pharmacy",
        "dependency_ids": ["dep_pharmacy_referral_transport", "dep_origin_practice_ack_rail"],
        "task_refs": ["seq_037"],
        "stage": "commit",
        "retry_class": "never_auto_repeat",
        "idempotency_class": "non_idempotent_mutation",
        "evidence_class": "provider_receipt",
        "approval_lane_ids": ["environment_approval", "ownership_rehearsal"],
        "live_gate_ids": [
            "LIVE_GATE_PHARMACY_MVP_APPROVED",
            "LIVE_GATE_PHARMACY_NAMED_APPROVER_AND_ENVIRONMENT",
            "LIVE_GATE_PHARMACY_MUTATION_FLAG_ENABLED",
            "LIVE_GATE_PHARMACY_WATCH_REGISTER_CLEAR",
            "LIVE_GATE_PHARMACY_UPDATE_RECORD_COMBINATION_NAMED",
        ],
        "selector_refs": ["route_commit_dispatch"],
        "summary": "Choosing and opening a live dispatch route is a non-idempotent mutation that must never be replayed automatically.",
        "mock_now_execution": "Keep the dispatch route in mock-only or watch posture and stop before any live claim.",
        "actual_provider_strategy_later": "A live route commit later must capture one transport tuple receipt and escalates to human reconciliation on ambiguity.",
        "completion_evidence": [
            "Named transport route tuple or provider receipt",
            "Current dispatch proof thresholds and approver evidence bound to the same attempt",
        ],
        "insufficient_evidence": [
            "Transport acceptance alone",
            "A clicked route-claim button with no tuple receipt or proof threshold record",
        ],
        "redaction_policy": "Commit-phase screenshots are disabled unless an explicitly approved masked still is required for audit.",
        "human_checkpoints": [
            "Named approver and route-specific assurance evidence must exist before a live dispatch route opens.",
        ],
    },
    {
        "action_key": "act_pharmacy_manual_urgent_return_rehearsal",
        "action_label": "Capture urgent-return rehearsal evidence and stop",
        "provider_family": "pharmacy",
        "source_pack_key": "pharmacy",
        "dependency_ids": ["dep_pharmacy_urgent_return_professional_routes"],
        "task_refs": ["seq_037"],
        "stage": "verify",
        "retry_class": "capture_evidence_then_stop",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["ownership_rehearsal", "safety_privacy_assurance"],
        "live_gate_ids": ["LIVE_GATE_PHARMACY_URGENT_RETURN_OWNERSHIP_REHEARSED", "LIVE_GATE_PHASE0_EXTERNAL_FOUNDATION"],
        "selector_refs": ["row_manual_fallback"],
        "summary": "Collect proof that the urgent-return safety net is owned and rehearsed, then stop without trying to automate the manual path itself.",
        "mock_now_execution": "Model the manual urgent-return lane and store rehearsal references only.",
        "actual_provider_strategy_later": "Later live widening still depends on the manual safety net staying current and human-owned.",
        "completion_evidence": [
            "Urgent-return ownership or rehearsal reference",
            "Current manual recovery proof linked to the active route attempt",
        ],
        "insufficient_evidence": [
            "A runbook mention with no rehearsal date",
            "A screenshot of the manual fallback row with no owner or rehearsal reference",
        ],
        "redaction_policy": "Only masked stills of rehearsal metadata are allowed. No patient, clinician, or mailbox content belongs in captures.",
        "human_checkpoints": [
            "Urgent return ownership and rehearsal evidence must be current before any live route claim.",
        ],
    },
    {
        "action_key": "act_nhs_app_scope_and_eoi_draft",
        "action_label": "Resume NHS App EOI and environment pack drafting",
        "provider_family": "nhs_app",
        "source_pack_key": "nhs_app",
        "dependency_ids": ["dep_nhs_app_embedded_channel_ecosystem"],
        "task_refs": ["seq_029", "seq_030"],
        "stage": "fill",
        "retry_class": "resume_from_checkpoint_only",
        "idempotency_class": "draft_resume_safe",
        "evidence_class": "checkpoint_receipt",
        "approval_lane_ids": ["sponsor_commercial", "environment_approval"],
        "live_gate_ids": ["LIVE_GATE_NHS_LOGIN_READY_ENOUGH", "LIVE_GATE_PATIENT_ELIGIBILITY_EXPLICIT", "LIVE_GATE_DEMO_ENVIRONMENT_READY"],
        "selector_refs": ["stage_rail", "mode_toggle_actual", "release_page_tab"],
        "summary": "Resume the NHS App EOI and environment pack from the last stable checkpoint so scope, demo, and eligibility evidence stay aligned.",
        "mock_now_execution": "Use the stage progression studio and stop before any real submit path.",
        "actual_provider_strategy_later": "A live EOI later must continue from the same scope-bound draft rather than being rebuilt from memory.",
        "completion_evidence": [
            "Draft receipt for the current NHS App stage pack",
            "Current NHS login readiness, eligibility, and demo references",
        ],
        "insufficient_evidence": [
            "A completed form with no stage receipt",
            "A design preview with no scope or demo evidence references",
        ],
        "redaction_policy": "Masked draft captures only. Any service identifiers or unpublished scope text must be obscured.",
        "human_checkpoints": [
            "Scope wording and environment posture still need sponsor-owned review before later live motion.",
        ],
    },
    {
        "action_key": "act_nhs_app_commissioning_gate_review",
        "action_label": "Review NHS App commissioning and assurance gate",
        "provider_family": "nhs_app",
        "source_pack_key": "nhs_app",
        "dependency_ids": ["dep_nhs_app_embedded_channel_ecosystem", "dep_nhs_assurance_and_standards_sources"],
        "task_refs": ["seq_029", "seq_030"],
        "stage": "review",
        "retry_class": "human_review_before_continue",
        "idempotency_class": "review_checkpoint",
        "evidence_class": "review_reference",
        "approval_lane_ids": ["sponsor_commercial", "safety_privacy_assurance", "environment_approval"],
        "live_gate_ids": [
            "LIVE_GATE_COMMISSIONING_EXPLICIT",
            "LIVE_GATE_ACCESSIBILITY_EVIDENCE_READY",
            "LIVE_GATE_DESIGN_READINESS_READY",
            "LIVE_GATE_SERVICE_DESK_READY",
            "LIVE_GATE_NAMED_APPROVER_PRESENT",
            "LIVE_GATE_ENVIRONMENT_TARGET_PRESENT",
            "LIVE_GATE_MUTATION_FLAG_ENABLED",
        ],
        "selector_refs": ["gate_board", "actual-field-named-approver", "actual-field-environment-target", "actual-submit-button"],
        "summary": "Commissioning, accessibility, design readiness, and service posture require named review before the NHS App path can widen.",
        "mock_now_execution": "Model the gate board and capture the evidence gaps, then stop for review.",
        "actual_provider_strategy_later": "Later real onboarding must reject blind progression unless commissioning and assurance evidence are current and explicitly approved.",
        "completion_evidence": [
            "Named commissioning or sponsor approval reference",
            "Current accessibility, design, and service evidence refs",
            "Named approver and environment target for the same path",
        ],
        "insufficient_evidence": [
            "A green-looking preview with no sponsor-approved wording",
            "A filled approver field with no assurance evidence pack",
        ],
        "redaction_policy": "Only masked stills of the gate board are allowed. No unpublished service data or live credentials belong in captures.",
        "human_checkpoints": [
            "Commissioning, accessibility, service support, and named approver posture all remain explicit human gates.",
        ],
    },
]

CHECKPOINT_CSV_COLUMNS = [
    "checkpoint_id",
    "action_key",
    "action_label",
    "provider_family",
    "provider_family_label",
    "source_pack_key",
    "task_refs",
    "stage",
    "retry_class",
    "retry_chip_label",
    "idempotency_class",
    "evidence_class",
    "live_gate_status",
    "approval_lanes",
    "required_env",
    "harness_paths",
    "selector_refs",
    "completion_evidence",
    "insufficient_evidence",
    "human_checkpoints",
    "redaction_policy",
    "mock_now_execution",
    "actual_provider_strategy_later",
    "source_refs",
]

IDEMPOTENCY_CSV_COLUMNS = [
    "action_key",
    "action_label",
    "provider_family",
    "stage",
    "retry_class",
    "idempotency_class",
    "blind_resubmit_allowed",
    "max_auto_retries",
    "human_confirmation_before_mutation",
    "completion_evidence_class",
    "live_gate_required",
    "guard_usage",
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], columns: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def slug(value: str) -> str:
    return value.replace(" ", "_").replace("/", "_").replace("-", "_").lower()


def join_list(values: list[str]) -> str:
    return "; ".join(values)


def humanise_gate(gate: dict[str, Any]) -> dict[str, Any]:
    return {
        "gate_id": gate["gate_id"],
        "status": gate["status"],
        "title": gate.get("title") or gate.get("gate_title") or gate.get("label") or gate["gate_id"],
        "summary": gate.get("summary") or gate.get("reason") or gate.get("notes") or "",
        "source_refs": gate.get("source_refs") or gate.get("evidence_refs") or [],
        "required_env": gate.get("required_env") or gate.get("env_refs") or [],
    }


def gate_status_rank(status: str) -> int:
    return {"blocked": 3, "review_required": 2, "pass": 1}.get(status, 0)


def resolve_live_gate_status(gates: list[dict[str, Any]]) -> str:
    if not gates:
        return "review_required"
    return max(gates, key=lambda gate: gate_status_rank(gate["status"]))["status"]


def render_markdown_table(columns: list[str], rows: list[list[str]]) -> str:
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join(["---"] * len(columns)) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header, divider, *body])


def ensure_inputs() -> None:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_039 prerequisites: " + ", ".join(sorted(missing)))
    verdict = load_json(REQUIRED_INPUTS["phase0_gate_verdict"])
    assert_true(
        verdict["summary"]["phase0_entry_verdict"] == "withheld",
        "Seq_039 expects the Phase 0 entry verdict to remain `withheld`.",
    )


def build_source_contexts() -> tuple[dict[str, Any], dict[str, Any]]:
    external_dependencies = load_json(REQUIRED_INPUTS["external_dependencies"])
    dependency_index = {
        dependency["dependency_id"]: dependency for dependency in external_dependencies["dependencies"]
    }

    source_contexts: dict[str, Any] = {}
    for source_key, spec in SOURCE_PACK_SPECS.items():
        payload = load_json(REQUIRED_INPUTS[spec["input_key"]])
        gates = [humanise_gate(gate) for gate in spec["live_gate_accessor"](payload)]
        gate_index = {gate["gate_id"]: gate for gate in gates}
        required_env = spec["required_env"]
        if required_env is None:
            if "live_gate_pack" in payload:
                required_env = payload["live_gate_pack"].get("required_env", [])
            else:
                required_env = payload.get("dry_run_harness", {}).get("required_env", [])
        source_contexts[source_key] = {
            "source_key": source_key,
            "family": spec["family"],
            "label": spec["label"],
            "payload_path": str(REQUIRED_INPUTS[spec["input_key"]]),
            "task_id": payload.get("task_id"),
            "visual_mode": payload.get("visual_mode"),
            "required_env": required_env,
            "env_bindings": spec["env_bindings"],
            "gate_rows": gates,
            "gate_index": gate_index,
            "blocked_gate_ids": [gate["gate_id"] for gate in gates if gate["status"] == "blocked"],
            "review_gate_ids": [gate["gate_id"] for gate in gates if gate["status"] == "review_required"],
            "pass_gate_ids": [gate["gate_id"] for gate in gates if gate["status"] == "pass"],
            "selector_hints": spec["selector_hint_accessor"](payload),
            "harness_paths": spec["harness_paths"],
            "max_evidence_age_days": spec["max_evidence_age_days"],
        }
    return source_contexts, dependency_index


def build_checkpoint_rows(source_contexts: dict[str, Any], dependency_index: dict[str, Any]) -> list[dict[str, Any]]:
    retry_index = {row["class_id"]: row for row in RETRY_CLASSES}
    family_label_map = {key: value["label"] for key, value in FAMILY_META.items()}
    approval_label_map = {row["lane_id"]: row["label"] for row in APPROVAL_LANES}

    rows: list[dict[str, Any]] = []
    for index, spec in enumerate(ACTION_SPECS, start=1):
        source = source_contexts[spec["source_pack_key"]]
        retry_rule = retry_index[spec["retry_class"]]
        gate_rows = [source["gate_index"][gate_id] for gate_id in spec["live_gate_ids"]]
        live_gate_status = resolve_live_gate_status(gate_rows)
        dependency_rows = [dependency_index[dependency_id] for dependency_id in spec["dependency_ids"]]
        dependency_manual_checkpoints: list[str] = []
        source_refs: list[str] = [source["payload_path"]]
        for dependency in dependency_rows:
            dependency_manual_checkpoints.extend(dependency.get("manual_checkpoints", []))
            source_refs.extend(dependency.get("source_file_refs", []))
        source_refs.extend(spec["task_refs"])
        source_refs.extend(hint for hint in spec.get("selector_refs", []))
        source_refs = list(dict.fromkeys(source_refs))

        row = {
            "checkpoint_id": f"CHK_{index:03d}",
            "action_key": spec["action_key"],
            "action_label": spec["action_label"],
            "provider_family": spec["provider_family"],
            "provider_family_label": family_label_map[spec["provider_family"]],
            "source_pack_key": spec["source_pack_key"],
            "source_pack_label": source["label"],
            "task_refs": spec["task_refs"],
            "stage": spec["stage"],
            "retry_class": spec["retry_class"],
            "retry_chip_label": retry_rule["chip_label"],
            "idempotency_class": spec["idempotency_class"],
            "evidence_class": spec["evidence_class"],
            "approval_lane_ids": spec["approval_lane_ids"],
            "approval_lanes": [approval_label_map[lane_id] for lane_id in spec["approval_lane_ids"]],
            "live_gate_status": live_gate_status,
            "live_gate_ids": spec["live_gate_ids"],
            "live_gate_titles": [gate["title"] for gate in gate_rows],
            "required_env": source["required_env"],
            "env_bindings": source["env_bindings"],
            "harness_paths": source["harness_paths"],
            "selector_refs": spec.get("selector_refs", []),
            "summary": spec["summary"],
            "mock_now_execution": spec["mock_now_execution"],
            "actual_provider_strategy_later": spec["actual_provider_strategy_later"],
            "completion_evidence": spec["completion_evidence"],
            "insufficient_evidence": spec["insufficient_evidence"],
            "human_checkpoints": list(dict.fromkeys(spec["human_checkpoints"] + dependency_manual_checkpoints)),
            "redaction_policy": spec["redaction_policy"],
            "max_auto_retries": retry_rule["max_auto_retries"],
            "backoff_posture": retry_rule["backoff_posture"],
            "screenshot_policy": retry_rule["screenshot_policy"],
            "trace_policy": retry_rule["trace_policy"],
            "human_confirmation_before_mutation": retry_rule["human_confirmation_before_mutation"],
            "later_live_rule_reuse": retry_rule["later_live_rule_reuse"],
            "completion_evidence_rule": retry_rule["completion_evidence_rule"],
            "insufficient_evidence_rule": retry_rule["insufficient_evidence_rule"],
            "idempotent": retry_rule["idempotent"],
            "source_refs": source_refs,
            "evidence_freshness_window_days": source["max_evidence_age_days"],
            "live_gate_required": spec["retry_class"] != "safe_read_retry",
        }
        rows.append(row)
    return rows


def build_retry_matrix(checkpoint_rows: list[dict[str, Any]]) -> dict[str, Any]:
    retry_index = {row["class_id"]: row for row in RETRY_CLASSES}
    counts = {row["class_id"]: 0 for row in RETRY_CLASSES}
    status_counts = {"blocked": 0, "review_required": 0, "pass": 0}
    for checkpoint in checkpoint_rows:
        counts[checkpoint["retry_class"]] += 1
        status_counts[checkpoint["live_gate_status"]] += 1

    action_rows = []
    for checkpoint in checkpoint_rows:
        retry_rule = retry_index[checkpoint["retry_class"]]
        action_rows.append(
            {
                "checkpoint_id": checkpoint["checkpoint_id"],
                "action_key": checkpoint["action_key"],
                "action_label": checkpoint["action_label"],
                "provider_family": checkpoint["provider_family"],
                "provider_family_label": checkpoint["provider_family_label"],
                "stage": checkpoint["stage"],
                "retry_class": checkpoint["retry_class"],
                "retry_chip_label": checkpoint["retry_chip_label"],
                "idempotency_class": checkpoint["idempotency_class"],
                "evidence_class": checkpoint["evidence_class"],
                "live_gate_status": checkpoint["live_gate_status"],
                "approval_lanes": checkpoint["approval_lanes"],
                "max_auto_retries": retry_rule["max_auto_retries"],
                "backoff_posture": retry_rule["backoff_posture"],
                "screenshot_policy": retry_rule["screenshot_policy"],
                "trace_policy": retry_rule["trace_policy"],
                "human_confirmation_before_mutation": retry_rule["human_confirmation_before_mutation"],
                "later_live_rule_reuse": retry_rule["later_live_rule_reuse"],
                "completion_evidence": checkpoint["completion_evidence"],
                "insufficient_evidence": checkpoint["insufficient_evidence"],
                "redaction_policy": checkpoint["redaction_policy"],
                "summary": checkpoint["summary"],
                "live_gate_titles": checkpoint["live_gate_titles"],
            }
        )

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "summary": {
            "checkpoint_count": len(checkpoint_rows),
            "retry_class_count": len(RETRY_CLASSES),
            "safe_read_retry_count": counts["safe_read_retry"],
            "resume_from_checkpoint_only_count": counts["resume_from_checkpoint_only"],
            "human_review_before_continue_count": counts["human_review_before_continue"],
            "capture_evidence_then_stop_count": counts["capture_evidence_then_stop"],
            "never_auto_repeat_count": counts["never_auto_repeat"],
            "secrets_redacted_only_count": counts["secrets_redacted_only"],
            "blocked_action_count": status_counts["blocked"],
            "review_required_action_count": status_counts["review_required"],
            "pass_action_count": status_counts["pass"],
        },
        "retry_classes": [
            {
                **row,
                "action_count": counts[row["class_id"]],
            }
            for row in RETRY_CLASSES
        ],
        "action_rows": action_rows,
    }


def build_live_gate_rules(source_contexts: dict[str, Any], checkpoint_rows: list[dict[str, Any]]) -> dict[str, Any]:
    family_rows: dict[str, list[dict[str, Any]]] = {}
    for checkpoint in checkpoint_rows:
        family_rows.setdefault(checkpoint["provider_family"], []).append(checkpoint)

    provider_profiles = []
    for context in source_contexts.values():
        family = context["family"]
        checkpoints = family_rows.get(family, [])
        provider_profiles.append(
            {
                "provider_family": family,
                "provider_family_label": FAMILY_META[family]["label"],
                "source_pack_key": context["source_key"],
                "source_pack_label": context["label"],
                "payload_path": context["payload_path"],
                "required_env": context["required_env"],
                "env_bindings": context["env_bindings"],
                "required_gate_inputs": [
                    "named_approver",
                    "environment_target",
                    "evidence_bundle_ref",
                    "evidence_freshness_days",
                    "live_mutation_flag",
                ],
                "max_evidence_age_days": context["max_evidence_age_days"],
                "blocked_gate_ids": context["blocked_gate_ids"],
                "review_gate_ids": context["review_gate_ids"],
                "pass_gate_ids": context["pass_gate_ids"],
                "blocked_gate_count": len(context["blocked_gate_ids"]),
                "review_gate_count": len(context["review_gate_ids"]),
                "pass_gate_count": len(context["pass_gate_ids"]),
                "dry_run_harnesses": context["harness_paths"],
                "selector_hints": context["selector_hints"],
                "sensitive_action_keys": [
                    checkpoint["action_key"]
                    for checkpoint in checkpoints
                    if checkpoint["retry_class"] != "safe_read_retry"
                ],
                "approval_lanes": list(
                    dict.fromkeys(
                        lane
                        for checkpoint in checkpoints
                        for lane in checkpoint["approval_lanes"]
                    )
                ),
                "evidence_bundle_examples": list(
                    dict.fromkeys(
                        ref
                        for checkpoint in checkpoints
                        for ref in checkpoint["completion_evidence"]
                    )
                )[:4],
            }
        )

    unresolved_live_blockers = sum(profile["blocked_gate_count"] for profile in provider_profiles)
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "provider_profile_count": len(provider_profiles),
            "blocked_gate_count": unresolved_live_blockers,
            "review_gate_count": sum(profile["review_gate_count"] for profile in provider_profiles),
            "pass_gate_count": sum(profile["pass_gate_count"] for profile in provider_profiles),
        },
        "common_gate_rules": [
            {
                "rule_id": "LIVE_GATE_COMMON_NAMED_APPROVER",
                "summary": "Every live mutation requires a named approver bound to the exact environment target.",
            },
            {
                "rule_id": "LIVE_GATE_COMMON_ENVIRONMENT_TARGET",
                "summary": "Every live mutation declares sandpit, integration, preprod, or production explicitly. Blank targets fail closed.",
            },
            {
                "rule_id": "LIVE_GATE_COMMON_EVIDENCE_FRESHNESS",
                "summary": "Architecture, hazard, risk, procurement, or ownership evidence must be current within the provider profile freshness window.",
            },
            {
                "rule_id": "LIVE_GATE_COMMON_EXPLICIT_LIVE_FLAG",
                "summary": "ALLOW_REAL_PROVIDER_MUTATION=true is mandatory for any real portal mutation.",
            },
            {
                "rule_id": "LIVE_GATE_COMMON_NO_BLIND_RESUBMIT",
                "summary": "Non-idempotent mutations never auto-repeat. Ambiguity routes to reconciliation, not replay.",
            },
            {
                "rule_id": "LIVE_GATE_COMMON_SECRET_SAFE_CAPTURE",
                "summary": "Screenshots, traces, HAR files, and logs stay blocked for secret-sensitive actions unless masking is proven and approved.",
            },
        ],
        "provider_profiles": provider_profiles,
    }


def build_checkpoint_csv_rows(checkpoint_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for checkpoint in checkpoint_rows:
        rows.append(
            {
                "checkpoint_id": checkpoint["checkpoint_id"],
                "action_key": checkpoint["action_key"],
                "action_label": checkpoint["action_label"],
                "provider_family": checkpoint["provider_family"],
                "provider_family_label": checkpoint["provider_family_label"],
                "source_pack_key": checkpoint["source_pack_key"],
                "task_refs": join_list(checkpoint["task_refs"]),
                "stage": checkpoint["stage"],
                "retry_class": checkpoint["retry_class"],
                "retry_chip_label": checkpoint["retry_chip_label"],
                "idempotency_class": checkpoint["idempotency_class"],
                "evidence_class": checkpoint["evidence_class"],
                "live_gate_status": checkpoint["live_gate_status"],
                "approval_lanes": join_list(checkpoint["approval_lanes"]),
                "required_env": join_list(checkpoint["required_env"]),
                "harness_paths": join_list(checkpoint["harness_paths"]),
                "selector_refs": join_list(checkpoint["selector_refs"]),
                "completion_evidence": join_list(checkpoint["completion_evidence"]),
                "insufficient_evidence": join_list(checkpoint["insufficient_evidence"]),
                "human_checkpoints": join_list(checkpoint["human_checkpoints"]),
                "redaction_policy": checkpoint["redaction_policy"],
                "mock_now_execution": checkpoint["mock_now_execution"],
                "actual_provider_strategy_later": checkpoint["actual_provider_strategy_later"],
                "source_refs": join_list(checkpoint["source_refs"]),
            }
        )
    return rows


def build_idempotency_csv_rows(checkpoint_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for checkpoint in checkpoint_rows:
        rows.append(
            {
                "action_key": checkpoint["action_key"],
                "action_label": checkpoint["action_label"],
                "provider_family": checkpoint["provider_family"],
                "stage": checkpoint["stage"],
                "retry_class": checkpoint["retry_class"],
                "idempotency_class": checkpoint["idempotency_class"],
                "blind_resubmit_allowed": "yes" if checkpoint["retry_class"] == "safe_read_retry" else "no",
                "max_auto_retries": checkpoint["max_auto_retries"],
                "human_confirmation_before_mutation": "yes"
                if checkpoint["human_confirmation_before_mutation"]
                else "no",
                "completion_evidence_class": checkpoint["evidence_class"],
                "live_gate_required": "yes" if checkpoint["live_gate_required"] else "no",
                "guard_usage": "assertProviderActionAllowed(actionKey, context)",
            }
        )
    return rows


def build_summary_payload(
    checkpoint_rows: list[dict[str, Any]],
    retry_matrix: dict[str, Any],
    live_gate_rules: dict[str, Any],
) -> dict[str, Any]:
    family_counts: dict[str, int] = {}
    for checkpoint in checkpoint_rows:
        family_counts[checkpoint["provider_family"]] = family_counts.get(checkpoint["provider_family"], 0) + 1

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "summary": {
            "checkpoint_count": len(checkpoint_rows),
            "human_review_count": retry_matrix["summary"]["human_review_before_continue_count"],
            "never_auto_repeat_count": retry_matrix["summary"]["never_auto_repeat_count"],
            "unresolved_live_blocker_count": live_gate_rules["summary"]["blocked_gate_count"],
            "family_counts": family_counts,
        },
        "retry_classes": RETRY_CLASSES,
        "approval_lanes": APPROVAL_LANES,
        "idempotency_classes": IDEMPOTENCY_CLASSES,
        "evidence_classes": EVIDENCE_CLASSES,
        "ladder_steps": LADDER_STEPS,
        "checkpoints": checkpoint_rows,
        "provider_profiles": live_gate_rules["provider_profiles"],
    }


def render_checkpoint_doc(checkpoint_rows: list[dict[str, Any]], summary: dict[str, Any]) -> str:
    priority_table = render_markdown_table(
        ["Checkpoint", "Family", "Class", "Evidence", "Live posture"],
        [
            [
                row["checkpoint_id"],
                row["provider_family_label"],
                row["retry_chip_label"],
                row["evidence_class"],
                row["live_gate_status"],
            ]
            for row in checkpoint_rows
        ],
    )

    lanes_table = render_markdown_table(
        ["Lane", "Meaning"],
        [[row["label"], row["description"]] for row in APPROVAL_LANES],
    )

    return dedent(
        f"""\
        # 39 Manual Approval Checkpoint Register

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`
        - Captured on: `{CAPTURED_ON}`
        - Mission: {MISSION}

        ## Mock_now_execution

        The executable-now control model treats every provider and onboarding step as a bounded checkpoint with named evidence, retry posture, and redaction rules. The authoritative register lives in:

        - `{CHECKPOINT_CSV_PATH}`
        - `{RETRY_MATRIX_JSON_PATH}`
        - `{IDEMPOTENCY_RULES_CSV_PATH}`
        - `{LIVE_GATE_RULES_JSON_PATH}`

        Current coverage:

        - Checkpoints: `{summary["summary"]["checkpoint_count"]}`
        - Human-review checkpoints: `{summary["summary"]["human_review_count"]}`
        - Never-auto-repeat checkpoints: `{summary["summary"]["never_auto_repeat_count"]}`
        - Unresolved live blockers across provider packs: `{summary["summary"]["unresolved_live_blocker_count"]}`

        Each row below closes the "manual approval exists somewhere else" gap by naming the evidence, retry class, and live posture explicitly.

        {priority_table}

        ## Actual_provider_strategy_later

        The live-provider lane keeps one shared human approval taxonomy for all current provider and onboarding work. Every live mutation stays fail-closed until named approver, environment target, fresh evidence, and explicit live intent exist together.

        {lanes_table}

        Live-provider later rules:

        - No checkpoint may infer completion from page navigation or button-click success alone.
        - Non-idempotent steps route to reconciliation, not blind re-submission.
        - Signatory, legal, sponsor, commissioner, and vendor-service-desk steps remain human-owned even when a browser script prepared the pack.
        - Secret-sensitive steps require vault or quarantine receipts instead of raw screenshots, traces, HAR files, or logs.
        """
    )


def render_retry_doc(checkpoint_rows: list[dict[str, Any]], retry_matrix: dict[str, Any]) -> str:
    class_table = render_markdown_table(
        [
            "Class",
            "Completion evidence",
            "Insufficient evidence",
            "Max auto retries",
            "Capture posture",
            "Live reuse",
        ],
        [
            [
                row["chip_label"],
                row["completion_evidence_rule"],
                row["insufficient_evidence_rule"],
                str(row["max_auto_retries"]),
                f'{row["screenshot_policy"]} / {row["trace_policy"]}',
                "yes" if row["later_live_rule_reuse"] else "no",
            ]
            for row in RETRY_CLASSES
        ],
    )

    action_table = render_markdown_table(
        ["Action", "Stage", "Retry", "Idempotency", "Blind resubmit"],
        [
            [
                row["action_label"],
                row["stage"],
                row["retry_chip_label"],
                row["idempotency_class"],
                "yes" if row["retry_class"] == "safe_read_retry" else "no",
            ]
            for row in checkpoint_rows
        ],
    )

    return dedent(
        f"""\
        # 39 Browser Automation Retry Policy

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`

        ## Mock_now_execution

        The retry matrix defines six canonical classes. They close the "retry equals rerun" gap by separating read-only retry, checkpoint resume, review-gated continuation, capture-and-stop, never-repeat mutation, and secret-safe handling.

        {class_table}

        ## Actual_provider_strategy_later

        The same vocabulary governs later live-provider scripts. Any non-idempotent action is either human-gated, capture-and-stop, secret-handled, or never-auto-repeat. No live mutation may quietly downgrade into a generic rerun.

        {action_table}

        Additional live-provider rules:

        - `safe_read_retry` is the only class that permits automatic retry.
        - `resume_from_checkpoint_only` requires a stable draft or checkpoint receipt; replay from the beginning is forbidden.
        - `human_review_before_continue`, `capture_evidence_then_stop`, `never_auto_repeat`, and `secrets_redacted_only` all require stop-and-review posture before the next mutation.
        - Secret-sensitive classes keep trace and HAR capture off by default and treat vault receipts as the only acceptable completion proof.
        """
    )


def render_live_gate_doc(live_gate_rules: dict[str, Any]) -> str:
    profile_table = render_markdown_table(
        ["Family", "Blocked gates", "Review gates", "Required env", "Freshness window"],
        [
            [
                row["provider_family_label"],
                str(row["blocked_gate_count"]),
                str(row["review_gate_count"]),
                ", ".join(row["required_env"]) if row["required_env"] else "n/a",
                f'{row["max_evidence_age_days"]} days',
            ]
            for row in live_gate_rules["provider_profiles"]
        ],
    )

    common_rules = "\n".join(
        f"- `{rule['rule_id']}`: {rule['summary']}" for rule in live_gate_rules["common_gate_rules"]
    )

    return dedent(
        f"""\
        # 39 Live Mutation Gate Policy

        - Task: `{TASK_ID}`
        - Visual mode: `{VISUAL_MODE}`

        ## Mock_now_execution

        Mock and dry-run browser automation use the live gate as a fail-closed rehearsal object. The same helper calls validate approver, environment, evidence freshness, and live intent even when the script stops before commit.

        ## Actual_provider_strategy_later

        Live-provider later execution must satisfy all of the following common rules before any sensitive action can proceed:

        {common_rules}

        Provider family profiles:

        {profile_table}

        Guard-library contract:

        - `buildLiveMutationContext(profile, env, overrides)` normalises provider-specific environment bindings into one live-gate object.
        - `assertProviderActionAllowed(actionKey, context)` blocks unsafe retries, stale evidence, missing approval, or unapproved capture posture.
        - `nextRetryDecision(actionKey, attempt, outcome)` returns `retry`, `resume_from_checkpoint`, `human_review`, or `stop` so later scripts cannot collapse all failure modes into rerun.
        """
    )


def render_html(summary: dict[str, Any]) -> str:
    payload_json = json.dumps(summary).replace("</script>", "<\\/script>")
    return dedent(
        f"""\
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>39 Provider Portal Control Tower</title>
          <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='18' fill='%232563EB'/%3E%3Cpath d='M18 48V16h10l8 10V16h10v32H36V34h-8v14z' fill='white'/%3E%3C/svg%3E">
          <style>
            :root {{
              --canvas: #F7F8FC;
              --rail: #EEF2F7;
              --panel: #FFFFFF;
              --inset: #F3F5FA;
              --text-strong: #101828;
              --text: #1D2939;
              --text-muted: #667085;
              --border-subtle: #E4E7EC;
              --border-default: #D0D5DD;
              --primary: #2563EB;
              --review: #7C3AED;
              --safe: #0F9D58;
              --warning: #C98900;
              --blocked: #C24141;
              --shadow: 0 28px 64px rgba(16, 24, 40, 0.08);
              --radius-xl: 26px;
              --radius-lg: 18px;
              --radius-md: 14px;
              --rail-width: 296px;
              --inspector-width: 360px;
              --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              --sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }}
            * {{ box-sizing: border-box; }}
            html {{ color-scheme: light; }}
            body {{
              margin: 0;
              font-family: var(--sans);
              color: var(--text);
              background:
                radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 26%),
                radial-gradient(circle at top right, rgba(124, 58, 237, 0.08), transparent 28%),
                linear-gradient(180deg, #FBFCFF, var(--canvas));
            }}
            body[data-reduced-motion="true"] * {{
              animation-duration: 0ms !important;
              transition-duration: 0ms !important;
              scroll-behavior: auto !important;
            }}
            .page {{
              max-width: 1440px;
              margin: 0 auto;
              padding: 14px;
            }}
            .panel {{
              background: rgba(255, 255, 255, 0.98);
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-xl);
              box-shadow: var(--shadow);
            }}
            .masthead-shell {{
              position: sticky;
              top: 0;
              z-index: 40;
              padding-top: 6px;
              backdrop-filter: blur(12px);
              background: linear-gradient(180deg, rgba(247,248,252,0.97), rgba(247,248,252,0.9) 78%, rgba(247,248,252,0));
            }}
            .masthead {{
              min-height: 72px;
              display: grid;
              gap: 14px;
              padding: 16px 18px;
            }}
            .masthead-top {{
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 18px;
              flex-wrap: wrap;
            }}
            .brand {{
              display: flex;
              gap: 14px;
              align-items: center;
              max-width: 82ch;
            }}
            .brand-copy {{
              display: grid;
              gap: 8px;
            }}
            .eyebrow {{
              font-size: 12px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            h1 {{
              margin: 0;
              font-size: clamp(32px, 4vw, 48px);
              line-height: 0.96;
              letter-spacing: -0.045em;
              color: var(--text-strong);
            }}
            .subtitle {{
              margin: 0;
              font-size: 15px;
              line-height: 1.55;
              color: var(--text-muted);
            }}
            .brand svg {{
              width: 84px;
              height: 84px;
              flex: none;
            }}
            .metric-row {{
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 12px;
            }}
            .metric {{
              min-height: 44px;
              padding: 12px 14px;
              border: 1px solid var(--border-default);
              border-radius: 999px;
              background: rgba(243,245,250,0.86);
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              font-size: 13px;
            }}
            .metric strong {{
              font-size: 20px;
              color: var(--text-strong);
            }}
            .layout {{
              display: grid;
              grid-template-columns: var(--rail-width) minmax(0, 1fr) var(--inspector-width);
              gap: 16px;
              margin-top: 16px;
              align-items: start;
            }}
            .rail, .workspace, .inspector {{
              padding: 18px;
            }}
            .workspace {{
              display: grid;
              gap: 16px;
            }}
            .section-label {{
              margin: 0 0 10px;
              font-size: 12px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            .field-grid {{
              display: grid;
              gap: 12px;
              margin-bottom: 18px;
            }}
            .field {{
              display: grid;
              gap: 6px;
            }}
            label {{
              font-size: 11px;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: var(--text-muted);
            }}
            select, button.sort-button {{
              min-height: 44px;
              border-radius: 14px;
              border: 1px solid var(--border-default);
              background: white;
              color: var(--text);
              padding: 0 12px;
              font: inherit;
            }}
            button.sort-button {{
              cursor: pointer;
              transition: background-color 120ms ease, border-color 120ms ease, transform 120ms ease;
            }}
            .rail-list {{
              display: grid;
              gap: 10px;
            }}
            .family-card {{
              min-height: 96px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.96));
              display: grid;
              gap: 8px;
            }}
            .family-card strong {{
              color: var(--text-strong);
              font-size: 15px;
            }}
            .family-card span {{
              color: var(--text-muted);
              font-size: 12px;
              line-height: 1.45;
            }}
            .card {{
              border: 1px solid var(--border-subtle);
              border-radius: var(--radius-lg);
              padding: 16px;
              background: rgba(255,255,255,0.98);
            }}
            .register-header, .matrix-header {{
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 12px;
            }}
            .register-grid {{
              overflow: auto;
              border: 1px solid var(--border-subtle);
              border-radius: 18px;
            }}
            table {{
              width: 100%;
              border-collapse: collapse;
            }}
            th, td {{
              text-align: left;
              padding: 12px 8px;
              border-bottom: 1px solid var(--border-subtle);
              vertical-align: top;
              line-height: 1.45;
            }}
            th {{
              font-size: 11px;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--text-muted);
              background: rgba(243,245,250,0.78);
              position: sticky;
              top: 0;
              z-index: 1;
            }}
            tbody tr {{
              min-height: 52px;
              cursor: pointer;
              transition: background-color 180ms ease, transform 180ms ease;
            }}
            tbody tr:hover,
            tbody tr[data-selected="true"] {{
              background: rgba(37, 99, 235, 0.06);
            }}
            tbody tr:focus-visible,
            button:focus-visible,
            select:focus-visible {{
              outline: 2px solid var(--primary);
              outline-offset: 2px;
            }}
            .chip-row {{
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }}
            .chip {{
              display: inline-flex;
              align-items: center;
              min-height: 28px;
              padding: 0 10px;
              border-radius: 999px;
              border: 1px solid var(--border-default);
              background: rgba(243,245,250,0.92);
              font-size: 12px;
              color: var(--text);
            }}
            .chip[data-tone="safe_read_retry"] {{
              border-color: rgba(15,157,88,0.35);
              background: rgba(15,157,88,0.12);
              color: #0B6D3C;
            }}
            .chip[data-tone="resume_only"] {{
              border-color: rgba(37,99,235,0.28);
              background: rgba(37,99,235,0.1);
              color: #1D4ED8;
            }}
            .chip[data-tone="human_review"] {{
              border-color: rgba(124,58,237,0.28);
              background: rgba(124,58,237,0.11);
              color: #6D28D9;
            }}
            .chip[data-tone="capture_stop"] {{
              border-color: rgba(201,137,0,0.32);
              background: rgba(201,137,0,0.12);
              color: #8A5F00;
            }}
            .chip[data-tone="never_auto_repeat"] {{
              border-color: rgba(194,65,65,0.32);
              background: rgba(194,65,65,0.1);
              color: #A32929;
            }}
            .chip[data-tone="redacted_only"] {{
              border-color: rgba(16,24,40,0.22);
              background: rgba(16,24,40,0.08);
              color: var(--text-strong);
            }}
            .mono {{
              font-family: var(--mono);
              font-size: 12px;
            }}
            .matrix-grid {{
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              gap: 12px;
            }}
            .matrix-card {{
              min-height: 96px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,245,250,0.95));
              display: grid;
              gap: 8px;
            }}
            .ladder {{
              display: grid;
              grid-template-columns: repeat(5, minmax(0, 1fr));
              gap: 10px;
              margin-top: 10px;
            }}
            .ladder-step {{
              min-height: 96px;
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: rgba(243,245,250,0.96);
              display: grid;
              gap: 8px;
            }}
            .lower-grid {{
              display: grid;
              grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
              gap: 16px;
            }}
            .live-strip {{
              display: grid;
              gap: 10px;
            }}
            .live-card {{
              padding: 14px;
              border-radius: 18px;
              border: 1px solid var(--border-default);
              background: rgba(255,255,255,0.98);
              display: grid;
              gap: 6px;
            }}
            .inspector {{
              display: grid;
              gap: 14px;
              position: sticky;
              top: 102px;
              transition: transform 240ms ease, opacity 240ms ease;
            }}
            .inspector h2 {{
              margin: 0;
              font-size: 24px;
              line-height: 1.1;
              letter-spacing: -0.03em;
            }}
            .inspector p {{
              margin: 0;
              color: var(--text-muted);
              line-height: 1.55;
            }}
            .inspector-list {{
              display: grid;
              gap: 10px;
            }}
            .inspector-list strong {{
              display: block;
              margin-bottom: 4px;
              color: var(--text-strong);
            }}
            .muted {{
              color: var(--text-muted);
            }}
            .status-pill {{
              display: inline-flex;
              align-items: center;
              min-height: 30px;
              padding: 0 10px;
              border-radius: 999px;
              font-size: 12px;
              border: 1px solid var(--border-default);
            }}
            .status-pill[data-status="blocked"] {{
              color: var(--blocked);
              background: rgba(194,65,65,0.08);
              border-color: rgba(194,65,65,0.24);
            }}
            .status-pill[data-status="review_required"] {{
              color: var(--review);
              background: rgba(124,58,237,0.08);
              border-color: rgba(124,58,237,0.2);
            }}
            .status-pill[data-status="pass"] {{
              color: var(--safe);
              background: rgba(15,157,88,0.08);
              border-color: rgba(15,157,88,0.2);
            }}
            @media (max-width: 1180px) {{
              .layout {{
                grid-template-columns: 1fr;
              }}
              .inspector {{
                position: static;
              }}
              .lower-grid {{
                grid-template-columns: 1fr;
              }}
              .metric-row {{
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }}
            }}
            @media (max-width: 720px) {{
              .page {{
                padding: 10px;
              }}
              .metric-row {{
                grid-template-columns: 1fr;
              }}
              .ladder {{
                grid-template-columns: 1fr;
              }}
              .matrix-grid {{
                grid-template-columns: 1fr;
              }}
            }}
          </style>
        </head>
        <body>
          <main class="page" data-testid="tower-shell">
            <div class="masthead-shell">
              <section class="panel masthead">
                <div class="masthead-top">
                  <div class="brand">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      <defs>
                        <linearGradient id="towerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#2563EB"></stop>
                          <stop offset="100%" stop-color="#7C3AED"></stop>
                        </linearGradient>
                      </defs>
                      <rect x="8" y="8" width="104" height="104" rx="30" fill="url(#towerGradient)"></rect>
                      <path d="M34 82V38h16l10 12V38h16v44H60V64H50v18z" fill="#fff"></path>
                      <text x="60" y="106" fill="#D6E4FF" font-size="12" text-anchor="middle" font-family="system-ui, sans-serif" letter-spacing="2">CTRL_TOWER</text>
                    </svg>
                    <div class="brand-copy">
                      <div class="eyebrow">Vecells Control Surface</div>
                      <h1>Provider Control Tower</h1>
                      <p class="subtitle">One calm reliability surface for manual approvals, checkpoint ownership, safe retry posture, and later live-provider fail-closed rules.</p>
                    </div>
                  </div>
                  <div class="chip-row" aria-label="Visible retry chips">
                    <span class="chip" data-tone="safe_read_retry">safe_read_retry</span>
                    <span class="chip" data-tone="resume_only">resume_only</span>
                    <span class="chip" data-tone="human_review">human_review</span>
                    <span class="chip" data-tone="never_auto_repeat">never_auto_repeat</span>
                  </div>
                </div>
                <div class="metric-row">
                  <div class="metric"><span>Checkpoint count</span><strong id="metric-checkpoint-count">0</strong></div>
                  <div class="metric"><span>Human-review count</span><strong id="metric-human-review-count">0</strong></div>
                  <div class="metric"><span>Never-repeat count</span><strong id="metric-never-repeat-count">0</strong></div>
                  <div class="metric"><span>Unresolved live blockers</span><strong id="metric-live-blocker-count">0</strong></div>
                </div>
              </section>
            </div>

            <div class="layout">
              <aside class="panel rail" data-testid="rail">
                <div class="section-label">Filters</div>
                <div class="field-grid">
                  <div class="field">
                    <label for="filter-family">Provider family</label>
                    <select id="filter-family" data-testid="filter-family"></select>
                  </div>
                  <div class="field">
                    <label for="filter-action-class">Action class</label>
                    <select id="filter-action-class" data-testid="filter-action-class"></select>
                  </div>
                  <div class="field">
                    <label for="filter-live-gate">Live-gate status</label>
                    <select id="filter-live-gate" data-testid="filter-live-gate"></select>
                  </div>
                </div>
                <div class="section-label">Families</div>
                <div class="rail-list" id="family-summary"></div>
              </aside>

              <section class="panel workspace">
                <section class="card" data-testid="register">
                  <div class="register-header">
                    <div>
                      <div class="section-label">Checkpoint register</div>
                      <p class="muted">Every row binds an external action to evidence, retry class, and live gate posture.</p>
                    </div>
                    <div class="chip-row">
                      <button class="sort-button" type="button" data-testid="sort-idempotency">Sort idempotency</button>
                      <button class="sort-button" type="button" data-testid="sort-evidence">Sort evidence</button>
                    </div>
                  </div>
                  <div class="register-grid">
                    <table>
                      <thead>
                        <tr>
                          <th>Checkpoint</th>
                          <th>Action</th>
                          <th>Class</th>
                          <th>Idempotency</th>
                          <th>Evidence</th>
                          <th>Live gate</th>
                        </tr>
                      </thead>
                      <tbody id="register-body"></tbody>
                    </table>
                  </div>
                </section>

                <section class="card" data-testid="retry-matrix">
                  <div class="matrix-header">
                    <div>
                      <div class="section-label">Retry matrix</div>
                      <p class="muted">One explicit vocabulary for safe read retry, checkpoint resume, review-gated continuation, evidence-only capture, never-repeat mutation, and secret-safe handling.</p>
                    </div>
                  </div>
                  <div class="matrix-grid" id="retry-matrix-grid"></div>
                  <div class="section-label" style="margin-top: 14px;">Read → Fill → Review → Commit → Verify</div>
                  <div class="ladder" id="risk-ladder"></div>
                </section>

                <section class="lower-grid">
                  <section class="card">
                    <div class="section-label">Table parity</div>
                    <table data-testid="parity-table">
                      <thead>
                        <tr>
                          <th>Step</th>
                          <th>Control law</th>
                        </tr>
                      </thead>
                      <tbody id="parity-body"></tbody>
                    </table>
                  </section>
                  <section class="card live-strip" data-testid="live-gate-strip">
                    <div class="section-label">Live-gate summary</div>
                    <div id="live-strip-body"></div>
                  </section>
                </section>
              </section>

              <aside class="panel inspector" data-testid="inspector">
                <div class="section-label">Selected action</div>
                <h2 id="inspector-title">Select a checkpoint</h2>
                <div class="chip-row" id="inspector-chips"></div>
                <p id="inspector-summary">The right-hand inspector shows evidence rules, redaction posture, live gates, and required handoff details for the selected action.</p>
                <div class="inspector-list" id="inspector-details"></div>
              </aside>
            </div>
          </main>

          <script>
            const PAYLOAD = {payload_json};
            const FAMILY_META = new Map(PAYLOAD.provider_profiles.map((profile) => [profile.provider_family, profile]));
            const IDEMPOTENCY_RANK = new Map(PAYLOAD.idempotency_classes.map((item) => [item.class_id, item.rank]));
            const EVIDENCE_RANK = new Map(PAYLOAD.evidence_classes.map((item) => [item.class_id, item.rank]));
            const RETRY_LABELS = new Map(PAYLOAD.retry_classes.map((item) => [item.class_id, item.chip_label]));
            const state = {{
              family: "all",
              actionClass: "all",
              liveGate: "all",
              sortKey: "checkpoint",
              sortDirection: "asc",
              selectedActionKey: PAYLOAD.checkpoints[0]?.action_key ?? null,
            }};

            const registerBody = document.getElementById("register-body");
            const familySummary = document.getElementById("family-summary");
            const retryGrid = document.getElementById("retry-matrix-grid");
            const parityBody = document.getElementById("parity-body");
            const liveStripBody = document.getElementById("live-strip-body");
            const ladderRoot = document.getElementById("risk-ladder");
            const inspectorTitle = document.getElementById("inspector-title");
            const inspectorChips = document.getElementById("inspector-chips");
            const inspectorSummary = document.getElementById("inspector-summary");
            const inspectorDetails = document.getElementById("inspector-details");
            const familyFilter = document.getElementById("filter-family");
            const actionClassFilter = document.getElementById("filter-action-class");
            const liveGateFilter = document.getElementById("filter-live-gate");
            const checkpointCount = document.getElementById("metric-checkpoint-count");
            const humanReviewCount = document.getElementById("metric-human-review-count");
            const neverRepeatCount = document.getElementById("metric-never-repeat-count");
            const liveBlockerCount = document.getElementById("metric-live-blocker-count");

            function setReducedMotionFlag() {{
              const media = window.matchMedia("(prefers-reduced-motion: reduce)");
              const apply = () => document.body.setAttribute("data-reduced-motion", media.matches ? "true" : "false");
              apply();
              if (media.addEventListener) media.addEventListener("change", apply);
            }}

            function option(label, value) {{
              const node = document.createElement("option");
              node.value = value;
              node.textContent = label;
              return node;
            }}

            function fillFilters() {{
              familyFilter.append(option("All families", "all"));
              for (const family of Object.keys(PAYLOAD.summary.family_counts).sort()) {{
                const label = PAYLOAD.checkpoints.find((row) => row.provider_family === family)?.provider_family_label ?? family;
                familyFilter.append(option(label, family));
              }}

              actionClassFilter.append(option("All action classes", "all"));
              for (const rule of PAYLOAD.retry_classes) {{
                actionClassFilter.append(option(rule.chip_label, rule.class_id));
              }}

              liveGateFilter.append(option("All live-gate states", "all"));
              liveGateFilter.append(option("blocked", "blocked"));
              liveGateFilter.append(option("review_required", "review_required"));
              liveGateFilter.append(option("pass", "pass"));
            }}

            function filteredCheckpoints() {{
              const rows = PAYLOAD.checkpoints.filter((row) => {{
                if (state.family !== "all" && row.provider_family !== state.family) return false;
                if (state.actionClass !== "all" && row.retry_class !== state.actionClass) return false;
                if (state.liveGate !== "all" && row.live_gate_status !== state.liveGate) return false;
                return true;
              }});

              rows.sort((left, right) => {{
                const direction = state.sortDirection === "asc" ? 1 : -1;
                if (state.sortKey === "idempotency") {{
                  return direction * ((IDEMPOTENCY_RANK.get(left.idempotency_class) ?? 0) - (IDEMPOTENCY_RANK.get(right.idempotency_class) ?? 0));
                }}
                if (state.sortKey === "evidence") {{
                  return direction * ((EVIDENCE_RANK.get(left.evidence_class) ?? 0) - (EVIDENCE_RANK.get(right.evidence_class) ?? 0));
                }}
                return direction * left.checkpoint_id.localeCompare(right.checkpoint_id);
              }});
              return rows;
            }}

            function createChip(text, tone) {{
              const chip = document.createElement("span");
              chip.className = "chip";
              chip.dataset.tone = tone;
              chip.textContent = text;
              return chip;
            }}

            function renderMetrics() {{
              checkpointCount.textContent = String(PAYLOAD.summary.checkpoint_count);
              humanReviewCount.textContent = String(PAYLOAD.summary.human_review_count);
              neverRepeatCount.textContent = String(PAYLOAD.summary.never_auto_repeat_count);
              liveBlockerCount.textContent = String(PAYLOAD.summary.unresolved_live_blocker_count);
            }}

            function renderFamilySummary() {{
              familySummary.innerHTML = "";
              const checkpointsByFamily = new Map();
              for (const checkpoint of PAYLOAD.checkpoints) {{
                const list = checkpointsByFamily.get(checkpoint.provider_family) ?? [];
                list.push(checkpoint);
                checkpointsByFamily.set(checkpoint.provider_family, list);
              }}

              for (const [family, checkpoints] of Array.from(checkpointsByFamily.entries()).sort()) {{
                const profile = FAMILY_META.get(family);
                const node = document.createElement("article");
                node.className = "family-card";
                node.innerHTML = `
                  <strong>${{checkpoints[0].provider_family_label}}</strong>
                  <span>${{checkpoints.length}} checkpoints / ${{profile.blocked_gate_count}} blocked gates / ${{profile.review_gate_count}} review gates</span>
                  <span class="mono">${{profile.source_pack_key}}</span>
                `;
                familySummary.append(node);
              }}
            }}

            function renderRetryMatrix() {{
              retryGrid.innerHTML = "";
              for (const rule of PAYLOAD.retry_classes) {{
                const node = document.createElement("article");
                node.className = "matrix-card";
                node.innerHTML = `
                  <div class="chip-row"><span class="chip" data-tone="${{rule.chip_label}}">${{rule.chip_label}}</span></div>
                  <strong>${{rule.label}}</strong>
                  <span class="muted">${{rule.description}}</span>
                  <span class="muted">Evidence: ${{rule.completion_evidence_rule}}</span>
                  <span class="muted">Retries: ${{rule.max_auto_retries}} / ${{rule.backoff_posture}}</span>
                `;
                retryGrid.append(node);
              }}
            }}

            function renderLadder() {{
              ladderRoot.innerHTML = "";
              parityBody.innerHTML = "";
              for (const step of PAYLOAD.ladder_steps) {{
                const card = document.createElement("article");
                card.className = "ladder-step";
                card.innerHTML = `
                  <div class="section-label">${{step.title}}</div>
                  <div class="muted">${{step.law}}</div>
                `;
                ladderRoot.append(card);

                const row = document.createElement("tr");
                row.innerHTML = `<td class="mono">${{step.title}}</td><td>${{step.law}}</td>`;
                parityBody.append(row);
              }}
            }}

            function renderLiveStrip() {{
              liveStripBody.innerHTML = "";
              for (const profile of PAYLOAD.provider_profiles) {{
                const node = document.createElement("article");
                node.className = "live-card";
                node.innerHTML = `
                  <strong>${{profile.source_pack_label}}</strong>
                  <span class="muted">${{profile.provider_family_label}}</span>
                  <span class="muted">${{profile.blocked_gate_count}} blocked / ${{profile.review_gate_count}} review / ${{profile.pass_gate_count}} pass</span>
                  <span class="mono">${{profile.required_env.join(", ") || "n/a"}}</span>
                `;
                liveStripBody.append(node);
              }}
            }}

            function ensureSelectedVisible(rows) {{
              if (!rows.some((row) => row.action_key === state.selectedActionKey)) {{
                state.selectedActionKey = rows[0]?.action_key ?? null;
              }}
            }}

            function renderRegister() {{
              const rows = filteredCheckpoints();
              ensureSelectedVisible(rows);
              registerBody.innerHTML = "";

              rows.forEach((row, index) => {{
                const tr = document.createElement("tr");
                tr.dataset.testid = `checkpoint-row-${{row.action_key}}`;
                tr.setAttribute("data-testid", `checkpoint-row-${{row.action_key}}`);
                tr.setAttribute("data-action-key", row.action_key);
                tr.setAttribute("tabindex", "0");
                tr.setAttribute("data-selected", row.action_key === state.selectedActionKey ? "true" : "false");
                tr.setAttribute("aria-selected", row.action_key === state.selectedActionKey ? "true" : "false");
                tr.innerHTML = `
                  <td class="mono">${{row.checkpoint_id}}</td>
                  <td>
                    <strong>${{row.action_label}}</strong>
                    <div class="muted">${{row.provider_family_label}} / ${{row.stage}}</div>
                  </td>
                  <td><span class="chip" data-tone="${{row.retry_chip_label}}" data-testid="chip-${{row.action_key}}-${{row.retry_class}}">${{row.retry_chip_label}}</span></td>
                  <td class="mono">${{row.idempotency_class}}</td>
                  <td class="mono">${{row.evidence_class}}</td>
                  <td><span class="status-pill" data-status="${{row.live_gate_status}}">${{row.live_gate_status}}</span></td>
                `;
                tr.addEventListener("click", () => {{
                  state.selectedActionKey = row.action_key;
                  renderRegister();
                  renderInspector();
                }});
                tr.addEventListener("keydown", (event) => {{
                  if (event.key === "ArrowDown") {{
                    event.preventDefault();
                    const next = rows[index + 1] ?? row;
                    state.selectedActionKey = next.action_key;
                    renderRegister();
                    renderInspector();
                    requestAnimationFrame(() => document.querySelector(`[data-testid="checkpoint-row-${{next.action_key}}"]`)?.focus());
                  }}
                  if (event.key === "ArrowUp") {{
                    event.preventDefault();
                    const prev = rows[index - 1] ?? row;
                    state.selectedActionKey = prev.action_key;
                    renderRegister();
                    renderInspector();
                    requestAnimationFrame(() => document.querySelector(`[data-testid="checkpoint-row-${{prev.action_key}}"]`)?.focus());
                  }}
                  if (event.key === "Enter" || event.key === " ") {{
                    event.preventDefault();
                    state.selectedActionKey = row.action_key;
                    renderRegister();
                    renderInspector();
                  }}
                }});
                registerBody.append(tr);
              }});
            }}

            function renderInspector() {{
              const row = PAYLOAD.checkpoints.find((entry) => entry.action_key === state.selectedActionKey);
              if (!row) {{
                inspectorTitle.textContent = "No checkpoint in view";
                inspectorSummary.textContent = "Adjust the filters to bring a checkpoint back into view.";
                inspectorChips.innerHTML = "";
                inspectorDetails.innerHTML = "";
                return;
              }}

              inspectorTitle.textContent = row.action_label;
              inspectorSummary.textContent = row.summary;
              inspectorChips.innerHTML = "";
              inspectorChips.append(createChip(row.retry_chip_label, row.retry_chip_label));
              inspectorChips.append(createChip(row.live_gate_status, row.live_gate_status === "pass" ? "safe_read_retry" : row.live_gate_status === "blocked" ? "never_auto_repeat" : "human_review"));
              inspectorChips.append(createChip(row.provider_family_label, "resume_only"));

              const items = [
                ["Checkpoint", row.checkpoint_id],
                ["Stage", row.stage],
                ["Required evidence", row.completion_evidence.join("; ")],
                ["Insufficient evidence", row.insufficient_evidence.join("; ")],
                ["Redaction policy", row.redaction_policy],
                ["Human checkpoints", row.human_checkpoints.join("; ")],
                ["Harnesses", row.harness_paths.join("; ")],
                ["Selectors", row.selector_refs.join("; ") || "n/a"],
                ["Live gates", row.live_gate_titles.join("; ")],
              ];

              inspectorDetails.innerHTML = "";
              for (const [label, value] of items) {{
                const node = document.createElement("div");
                node.innerHTML = `<strong>${{label}}</strong><div class="${{label === "Checkpoint" || label === "Selectors" ? "mono muted" : "muted"}}">${{value}}</div>`;
                inspectorDetails.append(node);
              }}
            }}

            function bindEvents() {{
              familyFilter.addEventListener("change", (event) => {{
                state.family = event.target.value;
                renderRegister();
                renderInspector();
              }});
              actionClassFilter.addEventListener("change", (event) => {{
                state.actionClass = event.target.value;
                renderRegister();
                renderInspector();
              }});
              liveGateFilter.addEventListener("change", (event) => {{
                state.liveGate = event.target.value;
                renderRegister();
                renderInspector();
              }});

              document.querySelector("[data-testid='sort-idempotency']").addEventListener("click", () => {{
                state.sortDirection = state.sortKey === "idempotency" && state.sortDirection === "asc" ? "desc" : "asc";
                state.sortKey = "idempotency";
                renderRegister();
                renderInspector();
              }});

              document.querySelector("[data-testid='sort-evidence']").addEventListener("click", () => {{
                state.sortDirection = state.sortKey === "evidence" && state.sortDirection === "asc" ? "desc" : "asc";
                state.sortKey = "evidence";
                renderRegister();
                renderInspector();
              }});
            }}

            setReducedMotionFlag();
            fillFilters();
            renderMetrics();
            renderFamilySummary();
            renderRetryMatrix();
            renderLadder();
            renderLiveStrip();
            renderRegister();
            renderInspector();
            bindEvents();
          </script>
        </body>
        </html>
        """
    )


def render_checkpoint_model_js(
    checkpoint_rows: list[dict[str, Any]],
    retry_matrix: dict[str, Any],
    live_gate_rules: dict[str, Any],
) -> str:
    payload = {
        "task_id": TASK_ID,
        "retry_classes": RETRY_CLASSES,
        "idempotency_classes": IDEMPOTENCY_CLASSES,
        "evidence_classes": EVIDENCE_CLASSES,
        "approval_lanes": APPROVAL_LANES,
        "checkpoints": checkpoint_rows,
        "provider_profiles": live_gate_rules["provider_profiles"],
    }
    payload_json = json.dumps(payload, indent=2).replace("</script>", "<\\/script>")
    return dedent(
        f"""\
        const MODEL = {payload_json};

        export const providerCheckpointModel = MODEL;
        export const retryClassRows = MODEL.retry_classes;
        export const providerCheckpointRows = MODEL.checkpoints;
        export const providerProfileRows = MODEL.provider_profiles;
        export const idempotencyClassRows = MODEL.idempotency_classes;
        export const evidenceClassRows = MODEL.evidence_classes;
        export const approvalLaneRows = MODEL.approval_lanes;

        const retryIndex = new Map(MODEL.retry_classes.map((row) => [row.class_id, row]));
        const checkpointIndex = new Map(MODEL.checkpoints.map((row) => [row.action_key, row]));
        const providerIndex = new Map(MODEL.provider_profiles.map((row) => [row.provider_family, row]));

        export function getRetryRule(classId) {{
          return retryIndex.get(classId) ?? null;
        }}

        export function getCheckpointRule(actionKey) {{
          return checkpointIndex.get(actionKey) ?? null;
        }}

        export function getProviderProfile(providerFamily) {{
          return providerIndex.get(providerFamily) ?? null;
        }}

        export function requiresHumanConfirmation(actionKey) {{
          const rule = getCheckpointRule(actionKey);
          if (!rule) return false;
          return Boolean(rule.human_confirmation_before_mutation);
        }}

        export function isBlindResubmitAllowed(actionKey) {{
          const rule = getCheckpointRule(actionKey);
          if (!rule) return false;
          return rule.retry_class === "safe_read_retry";
        }}

        export function nextRetryClassDecision(actionKey, attemptCount) {{
          const rule = getCheckpointRule(actionKey);
          if (!rule) {{
            return {{ decision: "stop", reason: "unknown_action_key" }};
          }}
          if (rule.retry_class === "safe_read_retry" && attemptCount < rule.max_auto_retries) {{
            return {{ decision: "retry", reason: "read_only_refresh_allowed" }};
          }}
          if (rule.retry_class === "resume_from_checkpoint_only") {{
            return {{ decision: "resume_from_checkpoint", reason: "checkpoint_receipt_required" }};
          }}
          if (rule.retry_class === "human_review_before_continue") {{
            return {{ decision: "human_review", reason: "named_review_required" }};
          }}
          if (rule.retry_class === "capture_evidence_then_stop") {{
            return {{ decision: "stop", reason: "capture_then_handoff" }};
          }}
          if (rule.retry_class === "never_auto_repeat") {{
            return {{ decision: "stop", reason: "non_idempotent_mutation" }};
          }}
          if (rule.retry_class === "secrets_redacted_only") {{
            return {{ decision: "stop", reason: "secret_material_requires_manual_reentry" }};
          }}
          return {{ decision: "stop", reason: "fallback_stop" }};
        }}
        """
    )


def render_action_guard_js() -> str:
    return dedent(
        """\
        import {
          getCheckpointRule,
          getProviderProfile,
          nextRetryClassDecision,
          requiresHumanConfirmation,
        } from "./provider_checkpoint_model.js";

        function invariant(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        export function buildLiveMutationContext(providerFamily, env = {}, overrides = {}) {
          const profile = getProviderProfile(providerFamily);
          invariant(profile, `Unknown provider family: ${providerFamily}`);
          return {
            providerFamily,
            namedApprover: overrides.namedApprover ?? env[profile.env_bindings.named_approver] ?? null,
            environmentTarget: overrides.environmentTarget ?? env[profile.env_bindings.environment_target] ?? null,
            liveMutationFlag:
              overrides.liveMutationFlag ??
              (profile.env_bindings.live_mutation_flag
                ? env[profile.env_bindings.live_mutation_flag] === "true"
                : false),
            spendFlag:
              overrides.spendFlag ??
              (profile.env_bindings.spend_flag ? env[profile.env_bindings.spend_flag] === "true" : false),
            evidenceBundleRef: overrides.evidenceBundleRef ?? null,
            evidenceFreshnessDays: overrides.evidenceFreshnessDays ?? null,
            humanConfirmed: overrides.humanConfirmed ?? false,
            capturePlan: overrides.capturePlan ?? {
              screenshotEnabled: false,
              traceEnabled: false,
              harEnabled: false,
              redactionProven: false,
            },
          };
        }

        export function assertCapturePlanAllowed(actionRule, capturePlan) {
          const classId = actionRule.retry_class;
          if (classId === "safe_read_retry" || classId === "resume_from_checkpoint_only") {
            return;
          }
          if (classId === "secrets_redacted_only") {
            invariant(
              capturePlan.redactionProven === true,
              `Action ${actionRule.action_key} handles secrets and requires proven redaction before still capture.`,
            );
            invariant(
              capturePlan.traceEnabled !== true && capturePlan.harEnabled !== true,
              `Action ${actionRule.action_key} forbids trace and HAR capture while secret material is in scope.`,
            );
            return;
          }
          if (classId === "never_auto_repeat" || classId === "capture_evidence_then_stop") {
            invariant(
              capturePlan.traceEnabled !== true && capturePlan.harEnabled !== true,
              `Action ${actionRule.action_key} forbids trace and HAR capture after the commit boundary.`,
            );
          }
        }

        export function assertLiveMutationGate(actionRule, context) {
          const profile = getProviderProfile(actionRule.provider_family);
          invariant(profile, `Missing provider profile for ${actionRule.provider_family}`);
          invariant(context.liveMutationFlag === true, `Action ${actionRule.action_key} is blocked until ALLOW_REAL_PROVIDER_MUTATION=true.`);
          invariant(Boolean(context.namedApprover), `Action ${actionRule.action_key} requires a named approver.`);
          invariant(Boolean(context.environmentTarget), `Action ${actionRule.action_key} requires an explicit environment target.`);
          invariant(Boolean(context.evidenceBundleRef), `Action ${actionRule.action_key} requires an evidence bundle reference.`);
          invariant(
            Number.isFinite(context.evidenceFreshnessDays),
            `Action ${actionRule.action_key} requires an evidence freshness age in days.`,
          );
          invariant(
            context.evidenceFreshnessDays <= profile.max_evidence_age_days,
            `Action ${actionRule.action_key} is blocked because evidence is older than ${profile.max_evidence_age_days} days.`,
          );
        }

        export function assertProviderActionAllowed(actionKey, context) {
          const actionRule = getCheckpointRule(actionKey);
          invariant(actionRule, `Unknown action key: ${actionKey}`);

          assertCapturePlanAllowed(actionRule, context.capturePlan ?? {});

          if (actionRule.live_gate_required) {
            assertLiveMutationGate(actionRule, context);
          }

          if (requiresHumanConfirmation(actionKey)) {
            invariant(
              context.humanConfirmed === true,
              `Action ${actionKey} requires an explicit human confirmation before the next mutation.`,
            );
          }

          return {
            actionKey,
            retryClass: actionRule.retry_class,
            liveGateStatus: actionRule.live_gate_status,
            allowed: true,
          };
        }

        export function nextRetryDecision(actionKey, attemptCount) {
          return nextRetryClassDecision(actionKey, attemptCount);
        }
        """
    )


def main() -> None:
    ensure_inputs()
    source_contexts, dependency_index = build_source_contexts()
    checkpoint_rows = build_checkpoint_rows(source_contexts, dependency_index)
    retry_matrix = build_retry_matrix(checkpoint_rows)
    live_gate_rules = build_live_gate_rules(source_contexts, checkpoint_rows)
    summary_payload = build_summary_payload(checkpoint_rows, retry_matrix, live_gate_rules)

    write_csv(CHECKPOINT_CSV_PATH, build_checkpoint_csv_rows(checkpoint_rows), CHECKPOINT_CSV_COLUMNS)
    write_json(RETRY_MATRIX_JSON_PATH, retry_matrix)
    write_csv(IDEMPOTENCY_RULES_CSV_PATH, build_idempotency_csv_rows(checkpoint_rows), IDEMPOTENCY_CSV_COLUMNS)
    write_json(LIVE_GATE_RULES_JSON_PATH, live_gate_rules)

    write_text(CHECKPOINT_DOC_PATH, render_checkpoint_doc(checkpoint_rows, summary_payload))
    write_text(RETRY_DOC_PATH, render_retry_doc(checkpoint_rows, retry_matrix))
    write_text(LIVE_GATE_DOC_PATH, render_live_gate_doc(live_gate_rules))
    write_text(CONTROL_TOWER_HTML_PATH, render_html(summary_payload))
    write_text(CHECKPOINT_MODEL_JS_PATH, render_checkpoint_model_js(checkpoint_rows, retry_matrix, live_gate_rules))
    write_text(ACTION_GUARD_JS_PATH, render_action_guard_js())

    print(f"{TASK_ID}: generated manual checkpoint register, retry matrix, live gate rules, control tower, and shared guard modules.")


if __name__ == "__main__":
    main()
