#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
SOURCE = ROOT / "services" / "command-api" / "src" / "telephony-continuation-grants.ts"
MIGRATION = (
    ROOT
    / "services"
    / "command-api"
    / "migrations"
    / "107_phase2_telephony_continuation_grants.sql"
)
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT / "services" / "command-api" / "tests" / "telephony-continuation-grants.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "192_telephony_sms_continuation_grant_design.md"
API_DOC = ROOT / "docs" / "api" / "192_telephony_continuation_grant_and_redemption_contract.md"
SECURITY_DOC = ROOT / "docs" / "security" / "192_seeded_vs_challenge_continuation_controls.md"
DISPATCH_SCHEMA = ROOT / "data" / "contracts" / "192_continuation_dispatch_intent.schema.json"
MESSAGE_SCHEMA = ROOT / "data" / "contracts" / "192_continuation_message_manifest.schema.json"
REDEMPTION_SCHEMA = ROOT / "data" / "contracts" / "192_continuation_redemption_outcome.schema.json"
RECOVERY_SCHEMA = ROOT / "data" / "contracts" / "192_recovery_continuation_envelope.schema.json"
SESSION_SCHEMA = ROOT / "data" / "contracts" / "192_secure_link_session_projection.schema.json"
ELIGIBILITY_MATRIX = ROOT / "data" / "analysis" / "192_continuation_eligibility_to_grant_matrix.csv"
REDEMPTION_CASES = ROOT / "data" / "analysis" / "192_redemption_replay_and_supersession_cases.json"
RECOVERY_CASES = ROOT / "data" / "analysis" / "192_same_shell_recovery_cases.csv"
GAP_ARTIFACT = ROOT / "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_CONTINUATION.json"

GAP_FILES = [
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_GRANT_LIFETIME_AND_RESEND_POLICY.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_SEEDED_TO_CHALLENGE_DOWNGRADE.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_INTERRUPTED_RECOVERY.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_REDEEMED_AFTER_PROMOTION_OR_URGENT_DIVERSION.json",
    ROOT
    / "data"
    / "analysis"
    / "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_MESSAGE_MANIFEST_MASKING.json",
]

GAP_IDS = {
    "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_GRANT_LIFETIME_AND_RESEND_POLICY",
    "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_SEEDED_TO_CHALLENGE_DOWNGRADE",
    "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_INTERRUPTED_RECOVERY",
    "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_REDEEMED_AFTER_PROMOTION_OR_URGENT_DIVERSION",
    "GAP_RESOLVED_PHASE2_TELEPHONY_CONTINUATION_MESSAGE_MANIFEST_MASKING",
}

SOURCE_MARKERS = {
    "TelephonyContinuationGrantService",
    "TelephonyContinuationEligibility",
    "TelephonyContinuationContext",
    "ContinuationDispatchIntent",
    "ContinuationMessageManifest",
    "ContinuationRedemptionOutcome",
    "RecoveryContinuationEnvelope",
    "SecureLinkSessionProjection",
    "AccessGrantService",
    "settleContinuationEligibility",
    "issueContinuation",
    "redeemContinuation",
    "consumeRecoveryContinuation",
    "manual_only creates no redeemable grant",
    "TEL_CONT_192_EXACT_ONCE_REDEMPTION",
    "TEL_CONT_192_MESSAGE_MANIFEST_MASKED_NO_PHI",
    "TEL_CONT_192_RECOVERY_TOKEN_SAME_SHELL",
    "TEL_CONT_192_DOWNGRADE_SEEDED_TO_CHALLENGE",
}

MIGRATION_MARKERS = {
    "phase2_telephony_continuation_eligibilities",
    "phase2_telephony_continuation_contexts",
    "phase2_telephony_continuation_dispatch_intents",
    "phase2_telephony_continuation_message_manifests",
    "phase2_telephony_continuation_redemption_outcomes",
    "phase2_recovery_continuation_envelopes",
    "phase2_secure_link_session_projections",
    "TelephonyContinuationGrantService",
    "phase2-telephony-continuation-grants-192.v1",
    "phase2-telephony-continuation-message-mask-192.v1",
}

SERVICE_MARKERS = {
    "telephony_continuation_eligibility_settle",
    "TelephonyContinuationEligibilityContract",
    "telephony_continuation_dispatch_create",
    "ContinuationDispatchIntentContract",
    "telephony_continuation_grant_redeem",
    "ContinuationRedemptionOutcomeContract",
    "telephony_recovery_continuation_resume",
    "RecoveryContinuationEnvelopeContract",
    "telephony_secure_link_session_projection_current",
    "SecureLinkSessionProjectionContract",
}

DOC_MARKERS = {
    "TelephonyContinuationGrantService",
    "TelephonyContinuationEligibility",
    "TelephonyContinuationContext",
    "ContinuationDispatchIntent",
    "ContinuationMessageManifest",
    "ContinuationRedemptionOutcome",
    "RecoveryContinuationToken",
    "SecureLinkSessionProjection",
    "AccessGrantService",
    "manual_only creates no redeemable grant",
    "Challenge continuation exposes no seeded patient data",
    "exactly once",
    "no PHI body",
}


def fail(message: str) -> None:
    raise SystemExit(f"[telephony-continuation-grants] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as error:
        fail(f"{path.relative_to(ROOT)} is invalid JSON: {error}")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    missing = sorted(marker for marker in markers if marker not in text)
    if missing:
        fail(f"{label} missing markers: {', '.join(missing)}")


def forbid_markers(label: str, text: str, markers: set[str]) -> None:
    present = sorted(marker for marker in markers if marker in text)
    if present:
        fail(f"{label} contains forbidden markers: {', '.join(present)}")


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(r"- \[([ Xx\-])\] ([^ ]+)")
    for line in read(CHECKLIST).splitlines():
        match = pattern.match(line.strip())
        if match and match.group(2).startswith(f"{task_prefix}_"):
            marker = match.group(1)
            return "X" if marker == "x" else marker
    fail(f"checklist row missing for {task_prefix}")


def validate_checklist() -> None:
    if checklist_state("par_191") != "X":
        fail("par_191 must be complete before par_192")
    if checklist_state("par_192") not in {"-", "X"}:
        fail("par_192 must be claimed or complete")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, SOURCE_MARKERS | GAP_IDS)
    forbid_markers(
        "source",
        source,
        {
            "rawSmsBody",
            "signedContinuationUrl",
            "Request.patientRef =",
            "Episode.patientRef =",
            "PARALLEL_INTERFACE_GAP_PHASE2_TELEPHONY_CONTINUATION.json",
        },
    )
    if source.count("AccessGrantService") < 3:
        fail("source must use canonical AccessGrantService as a first-class dependency")
    if source.count("manual_only") < 15:
        fail("source must explicitly model manual_only as no-grant routing")
    if source.count("RecoveryContinuation") < 20:
        fail("source must make interrupted recovery a first-class path")


def validate_migration() -> None:
    require_markers("migration", read(MIGRATION), MIGRATION_MARKERS)


def validate_service_definition() -> None:
    require_markers("service definition", read(SERVICE_DEFINITION), SERVICE_MARKERS)


def validate_docs() -> None:
    combined = "\n".join(read(path) for path in [ARCH_DOC, API_DOC, SECURITY_DOC])
    require_markers("docs", combined, DOC_MARKERS)


def validate_schemas() -> None:
    for path in [DISPATCH_SCHEMA, MESSAGE_SCHEMA, REDEMPTION_SCHEMA, RECOVERY_SCHEMA, SESSION_SCHEMA]:
        payload = load_json(path)
        if payload.get("type") != "object" or payload.get("additionalProperties") is not False:
            fail(f"{path.relative_to(ROOT)} must be a closed object schema")
        required = set(payload.get("required", []))
        if "recordedBy" not in required:
            fail(f"{path.relative_to(ROOT)} must require recordedBy")

    message = load_json(MESSAGE_SCHEMA)
    if message["properties"]["containsPhi"].get("const") is not False:
        fail("message manifest schema must force containsPhi=false")
    if message["properties"]["includesSignedUrl"].get("const") is not False:
        fail("message manifest schema must force includesSignedUrl=false")

    session = load_json(SESSION_SCHEMA)
    if session["properties"]["urlGrantReusable"].get("const") is not False:
        fail("secure-link session projection must block URL grant reuse")

    redemption_states = set(REDEMPTION_SCHEMA.read_text(encoding="utf-8").split('"'))
    for state in ["session_established", "step_up_interrupted", "stale_link_recovery", "superseded_recovery"]:
        if state not in redemption_states:
            fail(f"redemption outcome schema missing {state}")


def validate_analysis() -> None:
    with ELIGIBILITY_MATRIX.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    grant_families = {row["grant_family"] for row in rows}
    if {"continuation_seeded_verified", "continuation_challenge", "manual_only"} - grant_families:
        fail("eligibility matrix must cover seeded, challenge, and manual_only")
    if not any("TEL_CONT_192_DOWNGRADE_SEEDED_TO_CHALLENGE" in row["reason_codes"] for row in rows):
        fail("eligibility matrix must cover seeded-to-challenge downgrade")

    replay_cases = load_json(REDEMPTION_CASES)
    case_ids = {case.get("caseId") for case in replay_cases.get("cases", [])}
    expected = {
        "first_seeded_redemption",
        "replayed_click",
        "resend_supersedes_prior_link",
        "expired_link_same_lineage_recovery",
        "promotion_or_urgent_diversion_after_send",
        "scope_or_lineage_drift",
    }
    if expected - case_ids:
        fail("redemption casebook missing replay or supersession cases")

    with RECOVERY_CASES.open(newline="", encoding="utf-8") as handle:
        recovery_rows = list(csv.DictReader(handle))
    interruptions = {row["interruption"] for row in recovery_rows}
    for interruption in ["step_up_required", "nhs_login_uplift", "contact_route_repair", "subject_conflict", "session_expiry"]:
        if interruption not in interruptions:
            fail(f"same-shell recovery matrix missing {interruption}")


def validate_gap_resolutions() -> None:
    for path in GAP_FILES:
        payload = load_json(path)
        if payload.get("gapId") not in GAP_IDS:
            fail(f"{path.relative_to(ROOT)} has unexpected gapId")
        for key in (
            "taskId",
            "sourceAmbiguity",
            "decisionTaken",
            "whyThisFitsTheBlueprint",
            "operationalRisk",
            "followUpIfPolicyChanges",
        ):
            if not payload.get(key):
                fail(f"{path.relative_to(ROOT)} missing {key}")


def validate_tests() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "backend tests",
        test,
        {
            "issues seeded continuation",
            "downgrades seeded to challenge",
            "manual_only without creating a redeemable grant",
            "redeems exact-once",
            "replayed clicks",
            "supersedes older resend links",
            "step-up interrupts challenge redemption",
            "stale-link recovery",
            "same-shell continuity after interruption",
            "expectNoSmsPhiOrTokenLeak",
        },
    )


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/analysis/validate_telephony_continuation_grants.py"
    if scripts.get("validate:telephony-continuation-grants") != expected_script:
        fail("package.json missing validate:telephony-continuation-grants script")
    if ROOT_SCRIPT_UPDATES.get("validate:telephony-continuation-grants") != expected_script:
        fail("root_script_updates missing validate:telephony-continuation-grants")
    expected_chain = (
        "pnpm validate:identity-audit-and-masking && "
        "pnpm validate:telephony-edge-ingestion && "
        "pnpm validate:call-session-state-machine && "
        "pnpm validate:telephony-verification-pipeline && "
        "pnpm validate:recording-ingest-pipeline && "
        "pnpm validate:telephony-readiness-pipeline && "
        "pnpm validate:telephony-continuation-grants && "
        "pnpm validate:telephony-convergence && "
        "pnpm validate:phone-followup-resafety && "
        "pnpm validate:195-auth-frontend && "
        "pnpm validate:audit-worm"
    )
    for name in ("bootstrap", "check"):
        if expected_chain not in scripts.get(name, ""):
            fail(f"package.json {name} chain missing telephony continuation validator")
        if expected_chain not in ROOT_SCRIPT_UPDATES.get(name, ""):
            fail(f"root_script_updates {name} chain missing telephony continuation validator")


def validate_gap_artifact_absent() -> None:
    if GAP_ARTIFACT.exists():
        fail("unexpected fallback gap artifact exists; coherent sibling seams were available")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_migration()
    validate_service_definition()
    validate_docs()
    validate_schemas()
    validate_analysis()
    validate_gap_resolutions()
    validate_tests()
    validate_scripts()
    validate_gap_artifact_absent()
    print("[telephony-continuation-grants] validation passed")


if __name__ == "__main__":
    main()
