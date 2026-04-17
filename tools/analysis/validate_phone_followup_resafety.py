#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
SOURCE = ROOT / "services" / "command-api" / "src" / "phone-followup-resafety.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "109_phase2_phone_followup_resafety.sql"
TEST = ROOT / "services" / "command-api" / "tests" / "phone-followup-resafety.integration.test.js"
ARCH_DOC = ROOT / "docs" / "architecture" / "194_phone_followup_duplicate_and_resafety_design.md"
API_DOC = ROOT / "docs" / "api" / "194_followup_evidence_assimilation_and_duplicate_controls.md"
SECURITY_DOC = ROOT / "docs" / "security" / "194_phone_followup_resafety_and_projection_freeze_rules.md"
COMMAND_SCHEMA = ROOT / "data" / "contracts" / "194_followup_evidence_ingress_command.schema.json"
WITNESS_SCHEMA = ROOT / "data" / "contracts" / "194_followup_continuity_witness.schema.json"
PROJECTION_CONTRACT = ROOT / "data" / "contracts" / "194_phone_followup_projection_hold_contract.json"
DUPLICATE_CASES = ROOT / "data" / "analysis" / "194_followup_duplicate_cases.json"
MATERIAL_MATRIX = ROOT / "data" / "analysis" / "194_material_delta_trigger_matrix.csv"
FREEZE_STATES = ROOT / "data" / "analysis" / "194_patient_and_staff_projection_freeze_states.csv"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_CONTINUITY_WITNESS_CATALOG.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_DUPLICATE_DIGEST_STRATEGY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_PATIENT_PENDING_STATE_TRUTH.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_TRANSCRIPT_DEGRADATION_AFTER_ATTACHMENT.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_PHONE_FOLLOWUP_REQUEST_EPISODE_SPLIT_BOUNDARY.json",
]

REQUIRED_SOURCE_TOKENS = [
    "PHONE_FOLLOWUP_SCHEMA_VERSION",
    "phase2-phone-followup-resafety-194.v1",
    "phase2-phone-followup-continuity-witness-194.v1",
    "phase2-phone-followup-duplicate-digest-194.v1",
    "phase2-phone-followup-projection-hold-194.v1",
    "FollowupEvidenceIngressCommand",
    "FrozenFollowupEvidenceBatch",
    "FollowupDuplicateDigest",
    "FollowupDuplicateEvaluation",
    "PhoneFollowupProjectionHold",
    "EvidenceClassificationDecisionSnapshot",
    "MaterialDeltaAssessmentSnapshot",
    "EvidenceAssimilationRecordSnapshot",
    "SafetyPreemptionRecordSnapshot",
    "createAssimilationSafetyServices",
    "assimilateEvidence",
    "PHONE_FOLLOWUP_194_SAME_REQUEST_ATTACH_REQUIRES_CONTINUITY_WITNESS",
    "PHONE_FOLLOWUP_194_DEGRADED_TRANSCRIPT_FAIL_CLOSED",
    "PHONE_FOLLOWUP_194_NO_STALE_CALM_STATUS",
]

REQUIRED_ROUTES = [
    "phone_followup_evidence_ingest",
    "phone_followup_assimilation_current",
    "phone_followup_projection_hold_current",
    "phone_followup_duplicate_review_current",
]

REQUIRED_TEST_TOKENS = [
    "exact replay",
    "semantic replay",
    "continuity witness",
    "same-episode candidate",
    "degraded",
    "re-safety",
    "projection",
    "stale calm",
]


def fail(message: str) -> None:
    raise SystemExit(f"[phone-followup-resafety] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text()


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(rf"^- \[([ X-])\] {re.escape(task_prefix)}", re.MULTILINE)
    match = pattern.search(read(CHECKLIST))
    if not match:
        fail(f"checklist row missing for {task_prefix}")
    return match.group(1)


def validate_checklist() -> None:
    if checklist_state("par_193") != "X":
        fail("par_193 must be complete before validating phone follow-up re-safety")
    if checklist_state("par_194") not in {"-", "X"}:
        fail("par_194 must be claimed or complete")


def validate_source() -> None:
    text = read(SOURCE)
    for token in REQUIRED_SOURCE_TOKENS:
        if token not in text:
            fail(f"source missing {token}")
    for witness in [
        "active_continuation_lineage",
        "telephony_lineage_authority",
        "operator_confirmed_case_id",
        "same_request_convergence_outcome",
        "human_review_override",
    ]:
        if witness not in text:
            fail(f"source missing witness class {witness}")
    for state in [
        "review_pending",
        "detail_received_being_checked",
        "urgent_review_opened",
        "blocked_by_degraded_followup_evidence",
        "separate_request_created_continuity_not_proven",
        "detail_added_no_resafety",
    ]:
        if state not in text:
            fail(f"source missing projection hold state {state}")
    if "createdReceipt: false" not in text:
        fail("source must explicitly prevent duplicate receipt creation")


def validate_service_definition() -> None:
    text = read(SERVICE_DEFINITION)
    for route in REQUIRED_ROUTES:
        if route not in text:
            fail(f"service-definition missing route {route}")


def validate_contracts() -> None:
    command = load_json(COMMAND_SCHEMA)
    channels = set(command["properties"]["followupChannel"]["enum"])
    expected_channels = {
        "post_submit_phone_call",
        "sms_continuation",
        "support_transcribed_followup",
        "duplicate_attachment",
    }
    if channels != expected_channels:
        fail("command schema must cover all follow-up channels")
    relation_classes = set(
        command["properties"]["duplicateProbe"]["properties"]["relationClass"]["enum"]
    )
    for relation in [
        "retry",
        "duplicate_attachment",
        "same_request_attach",
        "same_episode_candidate",
        "same_episode_link",
        "separate_request",
    ]:
        if relation not in relation_classes:
            fail(f"command schema missing duplicate relation {relation}")
    witness = load_json(WITNESS_SCHEMA)
    witness_classes = set(witness["properties"]["witnessClass"]["enum"])
    for witness_class in [
        "active_continuation_lineage",
        "telephony_lineage_authority",
        "operator_confirmed_case_id",
        "same_request_convergence_outcome",
        "human_review_override",
    ]:
        if witness_class not in witness_classes:
            fail(f"witness schema missing {witness_class}")
    projection = load_json(PROJECTION_CONTRACT)
    states = {entry["holdState"] for entry in projection.get("holdStates", [])}
    expected_states = {
        "review_pending",
        "detail_received_being_checked",
        "urgent_review_opened",
        "blocked_by_degraded_followup_evidence",
        "separate_request_created_continuity_not_proven",
        "detail_added_no_resafety",
    }
    if states != expected_states:
        fail("projection hold contract has incomplete hold state coverage")
    unsafe_states = [
        entry
        for entry in projection["holdStates"]
        if entry["holdState"] != "detail_added_no_resafety"
        and entry["patientVisibleCalmStatusAllowed"] is not False
    ]
    if unsafe_states:
        fail("projection hold contract allows calm status during unsafe states")


def validate_analysis() -> None:
    duplicate = load_json(DUPLICATE_CASES)
    relations = {entry["relationClass"] for entry in duplicate.get("cases", [])}
    for relation in [
        "retry",
        "duplicate_attachment",
        "same_request_attach",
        "same_episode_candidate",
        "same_episode_link",
        "separate_request",
    ]:
        if relation not in relations:
            fail(f"duplicate cases missing relation {relation}")
    if "same-request attach by score alone" not in duplicate.get("forbidden", []):
        fail("duplicate cases must forbid score-only attachment")

    with MATERIAL_MATRIX.open() as handle:
        material_rows = list(csv.DictReader(handle))
    if len(material_rows) < 7:
        fail("material delta matrix must cover replay, clinical, contact, and degraded cases")
    degraded = [row for row in material_rows if row["evidence_case"] == "degraded_late_transcript"]
    if not degraded or degraded[0]["trigger_decision"] != "blocked_manual_review":
        fail("material matrix must fail closed for degraded late transcript")

    with FREEZE_STATES.open() as handle:
        freeze_rows = list(csv.DictReader(handle))
    if len(freeze_rows) != 6:
        fail("projection freeze states must enumerate six hold states")
    if any(
        row["hold_state"] != "detail_added_no_resafety"
        and row["patient_visible_calm_status_allowed"] != "false"
        for row in freeze_rows
    ):
        fail("freeze state matrix allows stale calm status during reassessment")

    for path in GAP_RESOLUTIONS:
        gap = load_json(path)
        for key in [
            "taskId",
            "sourceAmbiguity",
            "decisionTaken",
            "whyThisFitsTheBlueprint",
            "operationalRisk",
            "followUpIfPolicyChanges",
        ]:
            if key not in gap:
                fail(f"{path.relative_to(ROOT)} missing {key}")


def validate_docs_and_migration() -> None:
    for path in [ARCH_DOC, API_DOC, SECURITY_DOC, MIGRATION]:
        text = read(path)
        if "194" not in text:
            fail(f"{path.relative_to(ROOT)} does not reference task 194")
    migration = read(MIGRATION)
    for table in [
        "phase2_phone_followup_frozen_evidence_batches",
        "phase2_phone_followup_duplicate_digests",
        "phase2_phone_followup_duplicate_evaluations",
        "phase2_phone_followup_projection_holds",
        "phase2_phone_followup_assimilation_outcomes",
    ]:
        if table not in migration:
            fail(f"migration missing table {table}")


def validate_tests() -> None:
    text = read(TEST).lower()
    for token in REQUIRED_TEST_TOKENS:
        if token not in text:
            fail(f"tests missing coverage token {token}")


def validate_scripts() -> None:
    scripts = load_json(PACKAGE_JSON).get("scripts", {})
    expected = "python3 ./tools/analysis/validate_phone_followup_resafety.py"
    if scripts.get("validate:phone-followup-resafety") != expected:
        fail("package.json missing validate:phone-followup-resafety script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phone-followup-resafety": "python3 ./tools/analysis/validate_phone_followup_resafety.py"' not in root_updates:
        fail("root_script_updates missing validate:phone-followup-resafety")
    required_chain = (
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:authenticated-home-status-tracker && "
        "pnpm validate:claim-resume-identity-hold && "
        "pnpm validate:mobile-sms-continuation-flow && "
        "pnpm validate:signed-in-request-start-restore && "
        "pnpm validate:contact-truth-preference-ui && "
        "pnpm validate:cross-channel-receipt-status-parity && "
        "pnpm validate:nhs-login-client-config && "
        "pnpm validate:signal-provider-manifest && "
        "pnpm validate:phase2-auth-session-suite && "
        "pnpm validate:phase2-telephony-integrity-suite && "
        "pnpm validate:phase2-parity-repair-suite && "
        "pnpm validate:phase2-enrichment-resafety-suite && "
        "pnpm validate:audit-worm"
    )
    if required_chain not in scripts.get("bootstrap", ""):
        fail("bootstrap script missing phone-followup validator in telephony chain")
    if required_chain not in scripts.get("check", ""):
        fail("check script missing phone-followup validator in telephony chain")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_contracts()
    validate_analysis()
    validate_docs_and_migration()
    validate_tests()
    validate_scripts()
    print("[phone-followup-resafety] validation passed")


if __name__ == "__main__":
    main()
