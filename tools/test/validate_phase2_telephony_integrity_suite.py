#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

DOCS = [
    ROOT / "docs" / "tests" / "205_ivr_webhook_audio_integrity_suite.md",
    ROOT / "docs" / "tests" / "205_webhook_signature_event_and_retry_matrix.md",
    ROOT / "docs" / "tests" / "205_audio_custody_and_recording_integrity_matrix.md",
    ROOT / "docs" / "tests" / "205_continuation_access_grant_scope_and_supersession_matrix.md",
]
LAB = ROOT / "docs" / "frontend" / "205_telephony_integrity_lab.html"
WEBHOOK_CASES = ROOT / "data" / "test" / "205_webhook_event_cases.csv"
AUDIO_CASES = ROOT / "data" / "test" / "205_audio_integrity_cases.csv"
GRANT_CASES = ROOT / "data" / "test" / "205_continuation_grant_cases.csv"
EVENTS = ROOT / "data" / "test" / "205_expected_readiness_and_settlements.json"
RESULTS = ROOT / "data" / "test" / "205_suite_results.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "205_telephony_integrity_lab.spec.ts"

STATUS_VOCABULARY = ["passed", "failed", "blocked_external", "not_applicable"]
REQUIRED_COUNTERS = [
    "webhook accepted",
    "webhook rejected invalid signature",
    "webhook replay blocked",
    "call session advanced",
    "recording quarantined",
    "recording unusable",
    "readiness sufficient",
    "readiness insufficient",
    "continuation grant issued seeded",
    "continuation grant issued challenge",
    "continuation grant redeemed",
    "continuation grant replay blocked",
    "continuation grant superseded",
]

WEBHOOK_REQUIRED = {
    "TEL205_VALID_STATUS_CALLBACK",
    "TEL205_INVALID_SIGNATURE",
    "TEL205_MISSING_SIGNATURE",
    "TEL205_REPLAYED_SIGNATURE",
    "TEL205_DUPLICATE_EVENT_ID",
    "TEL205_OUT_OF_ORDER_SEQUENCE",
    "TEL205_UNKNOWN_CALL_SESSION",
    "TEL205_AFTER_TERMINAL_SESSION",
    "TEL205_MALFORMED_PAYLOAD",
    "TEL205_BURST_RETRY_BEHAVIOR",
    "TEL205_DTMF_CAPTURE",
    "TEL205_SPEECH_CAPTURE",
    "TEL205_MIXED_CAPTURE_ALLOWED",
    "TEL205_PARTIAL_ENTRY_RETRY",
    "TEL205_TIMEOUT_NO_INPUT",
    "TEL205_MENU_URGENT_PATH",
    "TEL205_MENU_NON_URGENT_PATH",
    "TEL205_CALLER_RESTARTS_MENU",
    "TEL205_HANGUP_BEFORE_COMPLETION",
    "TEL205_DUPLICATE_GATHER_SUBMISSION",
}

AUDIO_REQUIRED = {
    "TEL205_RECORDING_AVAILABLE_ON_TIME",
    "TEL205_LATE_RECORDING_STATUS_CALLBACK",
    "TEL205_DUPLICATE_RECORDING_STATUS_CALLBACK",
    "TEL205_MISSING_RECORDING_ARTIFACT",
    "TEL205_TRUNCATED_AUDIO",
    "TEL205_CORRUPT_AUDIO",
    "TEL205_UNSUPPORTED_FORMAT",
    "TEL205_HASH_MISMATCH_AFTER_FETCH",
    "TEL205_QUARANTINE_STORAGE_SUCCESS",
    "TEL205_QUARANTINE_STORAGE_FAILURE",
    "TEL205_TRANSCRIPT_RETRY_TEMP_PROVIDER_ERROR",
}

GRANT_REQUIRED = {
    "TEL205_VERIFICATION_SUFFICIENT_SEEDED_ALLOWED",
    "TEL205_INSUFFICIENT_VERIFICATION_CHALLENGE_ONLY",
    "TEL205_MANUAL_ONLY_DISPOSITION",
    "TEL205_REDEEMED_SEEDED_GRANT",
    "TEL205_REDEEMED_CHALLENGE_GRANT",
    "TEL205_REPLAY_ALREADY_USED_GRANT",
    "TEL205_SUPERSEDED_GRANT_AFTER_NEWER_ISSUANCE",
    "TEL205_EXPIRED_GRANT",
    "TEL205_WRONG_SUBJECT_REDEEM_ATTEMPT",
    "TEL205_LINEAGE_MISMATCH_REDEMPTION",
}

REQUIRED_TESTIDS = {
    "Telephony_Integrity_Grant_Lab",
    "scenario-rail",
    "central-evidence-plane",
    "detail-rail",
    "tab-strip",
    "VoiceIngressLadder",
    "AudioCustodyChain",
    "SeededVsChallengeGrantStrip",
    "TelephonyParityNote",
    "EvidenceMatrix",
    "lower-matrix-zone",
    "suite-status",
}


def fail(message: str) -> None:
    raise SystemExit(f"[205-phase2-telephony-integrity-suite] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def checklist_state(task_prefix: str) -> str:
    pattern = re.compile(rf"^- \[([ Xx-])\] {re.escape(task_prefix)}", re.MULTILINE)
    match = pattern.search(read(CHECKLIST))
    if not match:
        fail(f"checklist row missing for {task_prefix}")
    return match.group(1).upper()


def validate_checklist() -> None:
    if checklist_state("seq_204") != "X":
        fail("seq_204 must be complete before seq_205")
    if checklist_state("seq_205") not in {"-", "X"}:
        fail("seq_205 must be claimed or complete")


def validate_docs() -> None:
    suite_doc = read(DOCS[0])
    for ref in [
        "https://www.twilio.com/docs/usage/security#validating-requests",
        "https://www.twilio.com/docs/voice/api/call-resource#statuscallback",
        "https://www.twilio.com/docs/voice/api/recording#recordingstatuscallback",
        "https://developer.vonage.com/en/getting-started/concepts/webhooks",
        "https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features",
        "https://v10.carbondesignsystem.com/data-visualization/dashboards/",
        "https://v10.carbondesignsystem.com/patterns/status-indicator-pattern/",
        "https://design-system.service.gov.uk/styles/type-scale/",
        "https://service-manual.nhs.uk/design-system/styles/typography",
    ]:
        if ref not in suite_doc:
            fail(f"suite doc missing reference {ref}")

    for path in DOCS:
        text = read(path).lower()
        for token in [
            "205",
            "mock-now",
            "live-provider-later",
            "playwright",
            "webhook",
            "recording",
            "continuation",
            "grant",
        ]:
            if token not in text:
                fail(f"{path.relative_to(ROOT)} missing token {token}")


def validate_csv(path: Path, required_cases: set[str], minimum_rows: int) -> list[dict[str, str]]:
    rows = csv_rows(path)
    if len(rows) < minimum_rows:
        fail(f"{path.relative_to(ROOT)} expected at least {minimum_rows} rows")
    case_ids = {row.get("case_id", "") for row in rows}
    missing = required_cases.difference(case_ids)
    if missing:
        fail(f"{path.relative_to(ROOT)} missing cases {sorted(missing)}")
    for row in rows:
        if row.get("status") != "passed":
            fail(f"{path.relative_to(ROOT)} case {row.get('case_id')} is not passed")
    return rows


def validate_fixtures() -> None:
    webhook_rows = validate_csv(WEBHOOK_CASES, WEBHOOK_REQUIRED, 20)
    audio_rows = validate_csv(AUDIO_CASES, AUDIO_REQUIRED, 11)
    grant_rows = validate_csv(GRANT_CASES, GRANT_REQUIRED, 10)
    if len(webhook_rows) + len(audio_rows) + len(grant_rows) < 41:
        fail("fixture matrix must cover at least 41 cases")

    webhook_text = read(WEBHOOK_CASES).lower()
    for token in ["invalid_signature", "missing_signature", "replay", "out_of_order", "duplicate_gather"]:
        if token not in webhook_text:
            fail(f"webhook fixtures missing {token}")

    audio_text = read(AUDIO_CASES).lower()
    for token in ["corrupt", "unsupported", "hash_mismatch", "quarantine_storage_failure", "transcript_worker_retry"]:
        if token not in audio_text:
            fail(f"audio fixtures missing {token}")

    grant_text = read(GRANT_CASES).lower()
    for token in ["continuation_seeded_verified", "continuation_challenge", "replay_blocked", "superseded", "lineage_mismatch"]:
        if token not in grant_text:
            fail(f"grant fixtures missing {token}")


def validate_events_and_results() -> None:
    events = load_json(EVENTS)
    if events.get("taskId") != "seq_205":
        fail("events file has wrong taskId")
    if events.get("schemaVersion") != "phase2-telephony-integrity-suite-v1":
        fail("events file has wrong schema version")
    if events.get("requiredCounters") != REQUIRED_COUNTERS:
        fail("events requiredCounters must exactly match prompt vocabulary")
    expected_events = events.get("expectedEvents", [])
    if len(expected_events) != len(REQUIRED_COUNTERS):
        fail("events file must map each required counter to an event")
    for event in expected_events:
        if event.get("mustDuplicateWork") is not False:
            fail(f"{event.get('eventName')} may not duplicate work")

    results = load_json(RESULTS)
    if results.get("taskId") != "seq_205":
        fail("results file has wrong taskId")
    if results.get("overallStatus") != "passed":
        fail("overall suite status must be passed")
    if results.get("visualMode") != "Telephony_Integrity_Grant_Lab":
        fail("results visual mode drifted")
    if results.get("statusVocabulary") != STATUS_VOCABULARY:
        fail("results status vocabulary must distinguish passed, failed, blocked_external, not_applicable")
    if results.get("liveProviderEvidenceStatus") != "not_applicable":
        fail("live provider evidence status must be not_applicable for mock-now")
    if results.get("repositoryOwnedDefectFinding") != "absent_for_205_telephony_integrity_boundary":
        fail("repository defect finding must record absence for 205 boundary")
    service = results.get("targetedServiceResult", {})
    if service.get("status") != "passed" or service.get("testFilesPassed") != 7 or service.get("testsPassed") != 55:
        fail("targeted service evidence must record 7 files and 55 tests passed")
    case_results = results.get("caseResults", [])
    if any(row.get("status") == "failed" for row in case_results):
        fail("case results contain active failed status")
    statuses = {row.get("status") for row in case_results}
    if not {"passed", "blocked_external", "not_applicable"}.issubset(statuses):
        fail("case results must include passed, blocked_external, and not_applicable rows")


def validate_lab() -> None:
    lab = read(LAB)
    lab_lower = lab.lower()
    for testid in REQUIRED_TESTIDS:
        if testid not in lab:
            fail(f"lab missing data-testid or region {testid}")
    for token in [
        "Telephony_Integrity_Grant_Lab",
        "max-width: 1560px",
        "padding: 28px",
        "min-height: 72px",
        "grid-template-columns: 280px minmax(760px, 1fr) 392px",
        "repeat(3, minmax(240px, 1fr))",
        "#f5f7fb",
        "#ffffff",
        "#eef2f7",
        "#0f172a",
        "#334155",
        "#64748b",
        "#d7dfea",
        "#3158e0",
        "#0f766e",
        "#b7791f",
        "#b42318",
        "28px",
        "34px",
        "13px",
        "18px",
        "12px",
        "0.08em",
        "19px",
        "JetBrains Mono",
        "translateY(-1px)",
        "160ms",
        "prefers-reduced-motion: reduce",
        "role=\"tablist\"",
        "aria-selected",
        "data-parity",
        "blocked_external",
        "not_applicable",
        "failed: 0",
        "bad-signature",
        "bad-audio",
        "superseded-grant",
    ]:
        if token.lower() not in lab_lower:
            fail(f"lab missing required visual or accessibility token {token}")
    for tab in ["Webhook", "IVR", "Recording", "Readiness", "Grant"]:
        if f'data-tab="{tab}"' not in lab:
            fail(f"lab missing tab {tab}")


def validate_playwright_spec() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Telephony_Integrity_Grant_Lab",
        "205-telephony-integrity-lab.png",
        "205-telephony-tab-webhook.png",
        "205-telephony-tab-ivr.png",
        "205-telephony-tab-recording.png",
        "205-telephony-tab-readiness.png",
        "205-telephony-tab-grant.png",
        "205-telephony-bad-signature.png",
        "205-telephony-bad-audio.png",
        "205-telephony-superseded-grant.png",
        "205-telephony-mobile.png",
        "205-telephony-reduced-motion.png",
        "205-telephony-zoom.png",
        "reducedMotion",
        "ariaSnapshot",
        "ArrowRight",
        "focus",
        "data-parity",
        "assertNoOverflow",
        "EvidenceMatrix",
        "blocked_external",
        "not_applicable",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_package_chain() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    expected_script = "python3 ./tools/test/validate_phase2_telephony_integrity_suite.py"
    if scripts.get("validate:phase2-telephony-integrity-suite") != expected_script:
        fail("package.json missing validate:phase2-telephony-integrity-suite script")

    expected_chain = (
        "pnpm validate:contact-truth-preference-ui && "
        "pnpm validate:cross-channel-receipt-status-parity && "
        "pnpm validate:nhs-login-client-config && "
        "pnpm validate:signal-provider-manifest && "
        "pnpm validate:phase2-auth-session-suite && "
        "pnpm validate:phase2-telephony-integrity-suite && "
        "pnpm validate:phase2-parity-repair-suite && "
        "pnpm validate:phase2-enrichment-resafety-suite && "
        "pnpm validate:phase2-exit-gate && "
        "pnpm validate:audit-worm"
    )
    for script_name in ["bootstrap", "check"]:
        if expected_chain not in scripts.get(script_name, ""):
            fail(f"package.json {script_name} missing 205 validator chain")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if '"validate:phase2-telephony-integrity-suite": "python3 ./tools/test/validate_phase2_telephony_integrity_suite.py"' not in root_updates:
        fail("root_script_updates.py missing 205 validator script")
    if expected_chain not in root_updates:
        fail("root_script_updates.py missing 205 validator chain")


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_fixtures()
    validate_events_and_results()
    validate_lab()
    validate_playwright_spec()
    validate_package_chain()
    print("205 phase2 telephony integrity suite validation passed")


if __name__ == "__main__":
    main()
