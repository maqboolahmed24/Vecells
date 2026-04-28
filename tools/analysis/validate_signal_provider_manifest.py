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

DOCS = [
    ROOT / "docs" / "external" / "203_signal_provider_webhook_settings.md",
    ROOT / "docs" / "external" / "203_mock_now_signal_configuration_twin.md",
    ROOT / "docs" / "external" / "203_actual_provider_strategy_and_live_gates.md",
    ROOT / "docs" / "external" / "203_webhook_signature_and_replay_runbook.md",
]
BOARD = ROOT / "docs" / "frontend" / "203_signal_edge_control_board.html"
MANIFEST = ROOT / "data" / "contracts" / "203_signal_provider_manifest.json"
SELECTORS = ROOT / "data" / "contracts" / "203_signal_provider_selector_manifests.json"
ENDPOINT_MATRIX = ROOT / "data" / "analysis" / "203_webhook_endpoint_matrix.csv"
EVENT_MATRIX = ROOT / "data" / "analysis" / "203_event_subscription_matrix.csv"
SIGNATURE_MATRIX = ROOT / "data" / "analysis" / "203_signature_rotation_and_replay_matrix.csv"
LIVE_GATE = ROOT / "data" / "analysis" / "203_live_gate_and_rollback_checklist.json"
HARNESS = ROOT / "tools" / "playwright" / "203_signal_provider_console_harness.ts"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "203_signal_edge_control_board.spec.ts"

GAP_RESOLUTIONS = [
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_EDGE_ONLY_CALLBACKS.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_SIGNATURE_AND_REPLAY_REQUIRED.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_PROVIDER_FAMILY_DIFFERENCES.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_MOCK_NOW_TWIN.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_EVENT_SUBSCRIPTION_MATRIX.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_EVIDENCE_REDACTION.json",
    ROOT / "data" / "analysis" / "GAP_RESOLVED_PHASE2_SIGNAL_PROVIDER_LIVE_MUTATION_GATES.json",
]

REQUIRED_ENVIRONMENTS = {"local", "sandbox_twin", "provider_candidate", "live_candidate"}
REQUIRED_FAMILIES = {"telephony", "sms", "email"}
REQUIRED_TABS = {"Telephony", "SMS", "Email", "Replay", "Evidence"}
REQUIRED_TESTIDS = {
    "Signal_Edge_Control_Board",
    "family-tab-rail",
    "endpoint-coverage-board",
    "evidence-drawer",
    "endpoint-provider-family-matrix",
    "endpoint-provider-family-table",
    "event-subscription-coverage-diagram",
    "event-subscription-coverage-table",
    "signature-replay-guard-board",
    "signature-replay-guard-table",
    "live-gate-checklist",
    "redacted-screenshot-list",
    "lower-endpoint-parity-strip",
    "duplicate-endpoint-warning",
}
GAP_KEYS = {
    "taskId",
    "sourceAmbiguity",
    "decisionTaken",
    "whyThisFitsTheBlueprint",
    "operationalRisk",
    "followUpIfPolicyChanges",
}
FORBIDDEN_RAW_TOKENS = [
    "client_secret",
    "plainpassword",
    "consolepassword",
    "auth_token=",
    "api_key=",
    "private_key=",
    "plain_password",
    "raw_phone_number",
    "bearer ey",
]


def fail(message: str) -> None:
    raise SystemExit(f"[203-signal-provider-manifest] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
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
    if checklist_state("seq_202") != "X":
        fail("seq_202 must be complete before seq_203")
    if checklist_state("seq_203") not in {"-", "X"}:
        fail("seq_203 must be claimed or complete")


def validate_docs_and_board() -> None:
    for path in DOCS:
        text = read(path)
        for token in ["203", "edge", "signature", "replay", "redact"]:
            if token not in text.lower():
                fail(f"{path.relative_to(ROOT)} missing token {token}")

    board = read(BOARD)
    board_lower = board.lower()
    for testid in REQUIRED_TESTIDS:
        if testid not in board:
            fail(f"control board missing data-testid {testid}")
    for tab in REQUIRED_TABS:
        if f'data-config-tab="{tab}"' not in board:
            fail(f"control board missing tab {tab}")
    for token in [
        "Signal_Edge_Control_Board",
        "min(1480px",
        "min-height: 72px",
        "grid-template-columns: minmax(0, 1fr) 360px",
        "#f6f8fb",
        "#ffffff",
        "#eef3f8",
        "#101828",
        "#1d2939",
        "#667085",
        "#e4e7ec",
        "#d0d5dd",
        "#1d4ed8",
        "#0e9384",
        "#b54708",
        "#c11574",
        "#b7791f",
        "#b42318",
        "#117a65",
        "120ms",
        "180ms",
        "220ms",
        "prefers-reduced-motion: reduce",
        "endpoint-provider-family-matrix",
        "endpoint-provider-family-table",
        "event-subscription-coverage-diagram",
        "event-subscription-coverage-table",
        "signature-replay-guard-board",
        "signature-replay-guard-table",
    ]:
        if token.lower() not in board_lower:
            fail(f"control board missing required visual token {token}")


def validate_manifest() -> None:
    manifest = load_json(MANIFEST)
    if manifest.get("taskId") != "seq_203":
        fail("manifest has wrong taskId")
    if manifest.get("visualMode") != "Signal_Edge_Control_Board":
        fail("manifest has wrong visual mode")

    env_ids = {env["environmentId"] for env in manifest.get("environmentSet", [])}
    if REQUIRED_ENVIRONMENTS.difference(env_ids):
        fail(f"manifest missing environments {sorted(REQUIRED_ENVIRONMENTS.difference(env_ids))}")
    for env in manifest["environmentSet"]:
        if env.get("providerMutationAllowed") is not False:
            fail(f"{env['environmentId']} must default to no provider mutation")

    families = {family["family"] for family in manifest.get("providerFamilies", [])}
    if families != REQUIRED_FAMILIES:
        fail(f"manifest families mismatch: {sorted(families)}")

    raw_text = read(MANIFEST).lower()
    for forbidden in FORBIDDEN_RAW_TOKENS:
        if forbidden in raw_text:
            fail(f"manifest contains forbidden raw credential token {forbidden}")

    official_refs = {ref.get("provider") for ref in manifest.get("officialGuidanceRefs", [])}
    for provider in ["twilio", "vonage", "mailgun", "sendgrid"]:
        if provider not in official_refs:
            fail(f"manifest missing official guidance ref for {provider}")

    for target in manifest.get("callbackTargets", []):
        if target.get("endpointScope") != "edge":
            fail(f"{target.get('endpointId')} is not edge scoped")
        path = target.get("callbackUrlPath", "")
        if not path.startswith("/edge/signal/"):
            fail(f"{target.get('endpointId')} does not use /edge/signal path")
        for forbidden in ["/worker", "/queue", "/admin", "/private"]:
            if forbidden in path:
                fail(f"{target.get('endpointId')} uses forbidden path segment {forbidden}")
        if target.get("signatureVerificationRequired") is not True:
            fail(f"{target.get('endpointId')} missing signature requirement")
        if target.get("replayProtectionRequired") is not True:
            fail(f"{target.get('endpointId')} missing replay requirement")
        if target.get("providerPayloadLeaksPastEdge") is not False:
            fail(f"{target.get('endpointId')} leaks provider payload semantics")

    for family in manifest.get("providerFamilies", []):
        signature = family.get("signatureVerification", {})
        replay = family.get("replayProtection", {})
        if signature.get("required") is not True:
            fail(f"{family['family']} signature verification is not required")
        if len(signature.get("providerSchemes", [])) < 2:
            fail(f"{family['family']} missing provider signature schemes")
        if replay.get("required") is not True:
            fail(f"{family['family']} replay protection is not required")
        if int(replay.get("replayWindowSeconds", 0)) <= 0:
            fail(f"{family['family']} replay window is missing")
        events = {event["eventKey"] for event in family.get("eventSubscriptions", [])}
        if family["family"] == "telephony":
            for required in ["call_status_completed", "recording_status_available", "ivr_gather_completed"]:
                if required not in events:
                    fail(f"telephony event coverage missing {required}")
        if family["family"] == "sms":
            for required in ["sms_status_delivered", "sms_status_failed", "sms_status_expired"]:
                if required not in events:
                    fail(f"sms event coverage missing {required}")
        if family["family"] == "email":
            for required in ["email_event_delivered", "email_event_bounced", "email_event_complained"]:
                if required not in events:
                    fail(f"email event coverage missing {required}")

    gate = manifest.get("liveMutationGate", {})
    if gate.get("liveMutationAllowedByDefault") is not False:
        fail("live mutation must default to false")
    for required in [
        "explicit_live_mutation_flag_true",
        "target_environment_declared",
        "provider_family_declared",
        "credential_refs_resolve_from_approved_secret_manager",
        "named_approver_recorded",
        "signature_preflight_passed",
        "replay_preflight_passed",
        "rollback_snapshot_captured",
        "redaction_plan_enabled",
    ]:
        if required not in gate.get("requiredPreconditions", []):
            fail(f"live gate missing precondition {required}")


def validate_matrices_and_gaps() -> None:
    endpoint_rows = csv_rows(ENDPOINT_MATRIX)
    if len(endpoint_rows) < 12:
        fail("endpoint matrix does not cover family/provider/environment rows")
    for row in endpoint_rows:
        if row["task_id"] != "203":
            fail("endpoint matrix row missing task id 203")
        if row["endpoint_scope"] != "edge":
            fail(f"endpoint matrix row {row['endpoint_id']} is not edge scoped")
        if not row["callback_url_path"].startswith("/edge/signal/"):
            fail(f"endpoint matrix row {row['endpoint_id']} is not an edge signal path")
        if row["signature_scheme"] in {"", "none", "unsigned"}:
            fail(f"endpoint matrix row {row['endpoint_id']} is unsigned")
        if not row["replay_key"]:
            fail(f"endpoint matrix row {row['endpoint_id']} missing replay key")

    event_rows = csv_rows(EVENT_MATRIX)
    row_families = {row["family"] for row in event_rows}
    if REQUIRED_FAMILIES.difference(row_families):
        fail(f"event matrix missing families {sorted(REQUIRED_FAMILIES.difference(row_families))}")
    required_events = {
        "telephony": {"call_status_completed", "recording_status_available", "ivr_gather_completed"},
        "sms": {"sms_status_delivered", "sms_status_failed", "sms_status_expired"},
        "email": {"email_event_delivered", "email_event_bounced", "email_event_complained"},
    }
    for family, events in required_events.items():
        present = {row["event_key"] for row in event_rows if row["family"] == family}
        missing = events.difference(present)
        if missing:
            fail(f"event matrix {family} missing {sorted(missing)}")
    for row in event_rows:
        if row["subscription_required"] not in {"true", "false"}:
            fail(f"event row {row['event_key']} has ambiguous subscription_required")
        if row["mandatory_or_optional"] not in {"mandatory", "optional"}:
            fail(f"event row {row['event_key']} has ambiguous mandatory flag")

    signature_rows = csv_rows(SIGNATURE_MATRIX)
    if len(signature_rows) < 9:
        fail("signature matrix missing provider rows")
    for row in signature_rows:
        if int(row["replay_window_seconds"]) <= 0:
            fail(f"signature row {row['provider']} missing replay window")
        if not row["credential_ref"].startswith("credential://"):
            fail(f"signature row {row['provider']} must use credential:// ref")
        if "reject" not in row["missing_signature_outcome"]:
            fail(f"signature row {row['provider']} does not reject missing signatures")

    gates = load_json(LIVE_GATE)
    if gates.get("defaultLiveMutationPosture") != "blocked":
        fail("live gate checklist must default to blocked")
    if "register_non_edge_callback" not in gates.get("blockedActions", []):
        fail("live gate checklist does not block non-edge callback registration")

    for path in GAP_RESOLUTIONS:
        gap = load_json(path)
        missing = GAP_KEYS.difference(gap)
        if missing:
            fail(f"{path.relative_to(ROOT)} missing gap keys {sorted(missing)}")
        if gap.get("taskId") != "seq_203":
            fail(f"{path.relative_to(ROOT)} has wrong taskId")


def validate_selectors_and_playwright() -> None:
    selectors = load_json(SELECTORS)
    local = selectors.get("localTwinSelectors", {})
    for name in [
        "root",
        "familyTabRail",
        "endpointProviderFamilyMatrix",
        "eventSubscriptionCoverageDiagram",
        "signatureReplayGuardBoard",
        "evidenceDrawer",
        "liveGateChecklist",
        "duplicateEndpointWarning",
    ]:
        if name not in local:
            fail(f"selector manifest missing local selector {name}")

    provider_selectors = selectors.get("providerConsoleSelectors", [])
    providers = {item["provider"] for item in provider_selectors}
    for provider in ["twilio_voice", "vonage_voice", "twilio_sms", "vonage_sms", "mailgun_email", "sendgrid_email"]:
        if provider not in providers:
            fail(f"selector manifest missing provider {provider}")
    for item in provider_selectors:
        if item.get("mutationAllowedByDefault") is not False:
            fail(f"provider selector {item['provider']} allows mutation by default")
        if not item.get("selectors"):
            fail(f"provider selector {item['provider']} has no selectors")

    harness = read(HARNESS)
    for token in [
        "ALLOW_SIGNAL_PROVIDER_MUTATION",
        "203-signal-provider-console-harness.png",
        "203-signal-provider-console-harness-evidence.json",
        "203-signal-provider-selector-snapshot.json",
        "redact",
        "providerMutationAllowed",
        "getByRole",
        "page.screenshot",
    ]:
        if token not in harness:
            fail(f"harness missing token {token}")

    spec = read(PLAYWRIGHT_SPEC)
    for token in [
        "Signal_Edge_Control_Board",
        "Telephony",
        "SMS",
        "Email",
        "Replay",
        "Evidence",
        "duplicate-endpoint-warning",
        "event-subscription-coverage-table",
        "signature-replay-guard-board",
        "203-signal-edge-control-board.png",
        "reducedMotion",
    ]:
        if token not in spec:
            fail(f"Playwright spec missing token {token}")


def validate_package_chain() -> None:
    package = load_json(PACKAGE_JSON)
    scripts = package.get("scripts", {})
    if scripts.get("validate:signal-provider-manifest") != "python3 ./tools/analysis/validate_signal_provider_manifest.py":
        fail("package.json missing validate:signal-provider-manifest script")
    expected_chain = (
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
    for script_name in ["bootstrap", "check"]:
        script = scripts.get(script_name, "")
        if expected_chain not in script:
            fail(f"package.json {script_name} does not include signal validator in phase2 chain")
    root_updates = read(ROOT_SCRIPT_UPDATES)
    if expected_chain not in root_updates:
        fail("root_script_updates.py does not include signal validator in phase2 chain")


def validate_no_raw_sensitive_artifacts() -> None:
    for path in [MANIFEST, SELECTORS, LIVE_GATE, *DOCS, BOARD, HARNESS, PLAYWRIGHT_SPEC]:
        text = read(path).lower()
        for forbidden in FORBIDDEN_RAW_TOKENS:
            if forbidden in text:
                fail(f"{path.relative_to(ROOT)} contains forbidden token {forbidden}")


def main() -> None:
    validate_checklist()
    validate_docs_and_board()
    validate_manifest()
    validate_matrices_and_gaps()
    validate_selectors_and_playwright()
    validate_package_chain()
    validate_no_raw_sensitive_artifacts()
    print("203 signal provider manifest validation passed")


if __name__ == "__main__":
    main()
