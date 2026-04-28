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
SOURCE = ROOT / "services" / "command-api" / "src" / "telephony-convergence-pipeline.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
NORMALIZER = ROOT / "packages" / "domains" / "intake_request" / "src" / "normalized-submission.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "108_phase2_telephony_convergence_pipeline.sql"
TEST = ROOT / "services" / "command-api" / "tests" / "telephony-convergence-pipeline.integration.test.js"
ARCH_DOC = ROOT / "docs" / "architecture" / "193_telephony_to_canonical_submission_convergence.md"
API_DOC = ROOT / "docs" / "api" / "193_submission_ingress_and_normalized_submission_contract.md"
OPS_DOC = ROOT / "docs" / "operations" / "193_exact_once_promotion_and_receipt_parity.md"
COMMAND_SCHEMA = ROOT / "data" / "contracts" / "193_telephony_convergence_command.schema.json"
MAPPING_CONTRACT = ROOT / "data" / "contracts" / "193_ingress_channel_mapping.schema.json"
RECEIPT_CONTRACT = ROOT / "data" / "contracts" / "193_receipt_consistency_key_contract.json"
PARITY_CONTRACT = ROOT / "data" / "contracts" / "193_channel_parity_projection_contract.json"
CHANNEL_MATRIX = ROOT / "data" / "analysis" / "193_channel_convergence_matrix.csv"
DUPLICATE_CASES = ROOT / "data" / "analysis" / "193_duplicate_relation_policy_cases.json"
PARITY_CASES = ROOT / "data" / "analysis" / "193_same_facts_same_safety_parity_cases.json"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_INGRESS_CHANNEL_SURFACE_PROFILE_MAPPING.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_RECEIPT_CONSISTENCY_KEY_SERIALIZATION.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_PHONE_CONTINUATION_FIELD_PRECEDENCE.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_CROSS_CHANNEL_CALIBRATION_BOUNDARY.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_TELEPHONY_CONVERGENCE_LATE_READINESS_RESUME.json",
]

REQUIRED_SOURCE_TOKENS = [
    "TELEPHONY_CONVERGENCE_SCHEMA_VERSION",
    "phase2-telephony-convergence-193.v1",
    "phase2-ingress-channel-mapping-193.v1",
    "phase2-receipt-consistency-193.v1",
    "phase2-field-precedence-193.v1",
    "phase2-cross-channel-duplicate-calibration-193.v1",
    "phase2-late-readiness-resume-193.v1",
    "FrozenTelephonyCaptureBundle",
    "TelephonyEvidenceSnapshot",
    "SubmissionIngressRecord",
    "NormalizedSubmissionSnapshot",
    "ConvergenceDuplicatePairEvidence",
    "ConvergenceDuplicateResolutionDecision",
    "ReceiptConsistencyKeyContract",
    "ChannelParityProjection",
    "submitConvergenceCommand",
    "resumePausedIngress",
    "createSubmissionBackboneApplication",
    "createNormalizedSubmissionApplication",
    "TEL_CONV_193_FREEZE_BEFORE_NORMALIZE",
    "TEL_CONV_193_CROSS_CHANNEL_CALIBRATION_FAIL_CLOSED",
    "TEL_CONV_193_SAME_REQUEST_ATTACH_REQUIRES_WITNESS",
    "TEL_CONV_193_LATE_READINESS_RESUMED_FROM_FROZEN_INGRESS",
]

REQUIRED_ROUTES = [
    "telephony_convergence_command_submit",
    "telephony_convergence_current_projection",
    "telephony_convergence_receipt_status",
    "telephony_convergence_readiness_resume",
]

REQUIRED_TEST_TOKENS = [
    "exact replay",
    "collision review",
    "duplicate relation classes",
    "same-request attach",
    "same facts",
    "receipt",
    "support-assisted",
    "second receipt",
    "resumePausedIngress",
]


def fail(message: str) -> None:
    raise SystemExit(f"[telephony-convergence] {message}")


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
    if checklist_state("par_192") != "X":
        fail("par_192 must be complete before validating telephony convergence")
    if checklist_state("par_193") not in {"-", "X"}:
        fail("par_193 must be claimed or complete")


def validate_source() -> None:
    text = read(SOURCE)
    normalizer = read(NORMALIZER)
    for token in REQUIRED_SOURCE_TOKENS:
        if token not in text:
            fail(f"source missing {token}")
    for state in [
        "evidence_pending",
        "urgent_live_only",
        "manual_review_only",
        "unusable_terminal",
        "safety_usable",
    ]:
        if state not in text:
            fail(f"source missing readiness state {state}")
    for relation in [
        "retry",
        "same_episode_candidate",
        "same_episode_confirmed",
        "related_episode",
        "new_episode",
    ]:
        if relation not in text:
            fail(f"source missing duplicate relation {relation}")
    for widened in [
        "type SubmissionSourceChannel",
        "type SurfaceChannelProfile",
        "audioRefs?: readonly string[]",
        "evidenceReadinessStateOverride",
        "support_attested",
    ]:
        if widened not in normalizer:
            fail(f"normalizer missing additive convergence support {widened}")
    if "channelSpecificRequestModel: false" not in text:
        fail("channel parity projection must explicitly prevent channel-specific request models")


def validate_service_definition() -> None:
    text = read(SERVICE_DEFINITION)
    for route in REQUIRED_ROUTES:
        if route not in text:
            fail(f"service-definition missing route {route}")


def validate_contracts() -> None:
    command = load_json(COMMAND_SCHEMA)
    ingress_channels = command["properties"]["ingressChannel"]["enum"]
    for channel in [
        "self_service_form",
        "telephony_capture",
        "secure_link_continuation",
        "support_assisted_capture",
    ]:
        if channel not in ingress_channels:
            fail(f"command schema missing ingress channel {channel}")
    mapping = load_json(MAPPING_CONTRACT)
    if len(mapping.get("mappings", [])) < 4:
        fail("ingress mapping contract must cover all four channel families")
    if any(row.get("channelSpecificRequestModel") is not False for row in mapping["mappings"]):
        fail("mapping contract must forbid channel-specific request models")
    receipt = load_json(RECEIPT_CONTRACT)
    if "phase2-receipt-consistency-193.v1" not in receipt.get("contractId", ""):
        fail("receipt contract has wrong version")
    for state in ["attached_no_new_receipt", "retry_collapsed", "collision_review"]:
        if state not in receipt.get("promiseStates", []):
            fail(f"receipt contract missing promise state {state}")
    parity = load_json(PARITY_CONTRACT)
    for invariant in [
        "provenanceVisible=true",
        "channelSpecificRequestModel=false",
        "receipt grammar does not branch by channel",
    ]:
        if invariant not in parity.get("invariants", []):
            fail(f"parity contract missing invariant {invariant}")


def validate_analysis() -> None:
    with CHANNEL_MATRIX.open() as handle:
        rows = list(csv.DictReader(handle))
    if {row["ingress_channel"] for row in rows} != {
        "self_service_form",
        "telephony_capture",
        "secure_link_continuation",
        "support_assisted_capture",
    }:
        fail("channel matrix must cover self-service, telephony, continuation, and support")
    duplicate = load_json(DUPLICATE_CASES)
    classes = {entry["relationClass"] for entry in duplicate.get("classes", [])}
    if classes != {
        "retry",
        "same_episode_candidate",
        "same_episode_confirmed",
        "related_episode",
        "new_episode",
    }:
        fail("duplicate cases must cover all canonical relation classes")
    parity = load_json(PARITY_CASES)
    if len(parity.get("cases", [])) < 4:
        fail("same-facts parity cases are incomplete")
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
                fail(f"{path.name} missing {key}")


def validate_docs_and_migration() -> None:
    for path in [ARCH_DOC, API_DOC, OPS_DOC, MIGRATION]:
        text = read(path)
        for token in ["SubmissionIngressRecord", "NormalizedSubmission"]:
            if path.suffix == ".sql":
                continue
            if token not in text:
                fail(f"{path.relative_to(ROOT)} missing {token}")
    migration = read(MIGRATION)
    for table in [
        "phase2_telephony_frozen_capture_bundles",
        "phase2_telephony_evidence_snapshots",
        "phase2_submission_ingress_records",
        "phase2_telephony_duplicate_resolution_decisions",
        "phase2_receipt_status_consistency_projections",
    ]:
        if table not in migration:
            fail(f"migration missing {table}")


def validate_tests() -> None:
    text = read(TEST)
    for token in REQUIRED_TEST_TOKENS:
        if token not in text:
            fail(f"test missing coverage token {token}")
    if text.count("it(") < 8:
        fail("integration test must include at least eight prompt-required cases")


def validate_scripts() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected = "python3 ./tools/analysis/validate_telephony_convergence.py"
    if scripts.get("validate:telephony-convergence") != expected:
        fail("package.json missing validate:telephony-convergence script")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:telephony-convergence": "python3 ./tools/analysis/validate_telephony_convergence.py"' not in root_updates:
        fail("root_script_updates missing validate:telephony-convergence")
    expected_chain = (
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:audit-worm"
    )
    for name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(name, ""):
            fail(f"package.json {name} chain missing telephony convergence validator")
        if expected_chain not in root_updates:
            fail(f"root_script_updates {name} chain missing telephony convergence validator")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_contracts()
    validate_analysis()
    validate_docs_and_migration()
    validate_tests()
    validate_scripts()
    print("[telephony-convergence] validation passed")


if __name__ == "__main__":
    main()
