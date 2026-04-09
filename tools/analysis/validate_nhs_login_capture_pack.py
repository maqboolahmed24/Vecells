#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-nhs-login"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "nhs_login_application_field_map": DATA_DIR / "nhs_login_application_field_map.json",
    "nhs_login_live_gate_conditions": DATA_DIR / "nhs_login_live_gate_conditions.json",
}

DELIVERABLES = [
    DATA_DIR / "nhs_login_capture_pack.json",
    DATA_DIR / "nhs_login_redirect_uri_matrix.csv",
    DATA_DIR / "nhs_login_scope_claim_matrix.csv",
    DATA_DIR / "nhs_login_mock_client_registry.json",
    DATA_DIR / "nhs_login_actual_credential_placeholders.json",
    DOCS_DIR / "25_nhs_login_mock_service_spec.md",
    DOCS_DIR / "25_redirect_uri_and_scope_matrix.md",
    DOCS_DIR / "25_credential_capture_and_vault_ingest_runbook.md",
    DOCS_DIR / "25_nhs_login_environment_profile_pack.md",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "nhsLoginCapturePack.ts",
    APP_DIR / "public" / "nhs-login-capture-pack.json",
    TESTS_DIR / "mock-nhs-login-user-journeys.spec.js",
    TESTS_DIR / "mock-nhs-login-admin-console.spec.js",
    BROWSER_AUTOMATION_DIR / "nhs-login-credential-intake-dry-run.spec.js",
]

MANDATORY_GUIDANCE_IDS = {
    "official_what_is_nhs_login",
    "official_how_nhs_login_works",
    "official_integrating_to_sandpit",
    "official_compare_environments",
    "official_test_data",
    "official_multiple_redirect_uris",
    "official_technical_conformance",
    "official_gp_credentials",
    "official_scopes_claims",
    "official_vectors_of_trust",
}

MANDATORY_DOC_LABELS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="bluewoven-shell"',
    'data-testid="client-registry-list"',
    'data-testid="environment-switcher"',
    'data-testid="route-map-diagram"',
    'data-testid="route-map-parity-table"',
    'data-testid="credential-intake-drawer"',
    'data-testid="consent-button-allow"',
    'data-testid="consent-button-deny"',
    'data-testid="auth-return-state"',
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_inputs() -> dict[str, Any]:
    missing = [name for name, path in REQUIRED_INPUTS.items() if not path.exists()]
    assert_true(not missing, "Missing seq_025 prerequisites: " + ", ".join(sorted(missing)))
    return {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_025 deliverables:\n" + "\n".join(missing))


def main() -> None:
    prereqs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "nhs_login_capture_pack.json")
    redirects = load_csv(DATA_DIR / "nhs_login_redirect_uri_matrix.csv")
    scopes = load_csv(DATA_DIR / "nhs_login_scope_claim_matrix.csv")
    mock_registry = load_json(DATA_DIR / "nhs_login_mock_client_registry.json")
    placeholders = load_json(DATA_DIR / "nhs_login_actual_credential_placeholders.json")

    assert_true(pack["task_id"] == "seq_025", "Task id drifted")
    assert_true(pack["visual_mode"] == "Bluewoven_Identity_Simulator", "Visual mode drifted")
    assert_true(pack["summary"]["phase0_verdict"] == "withheld", "Phase 0 verdict drifted")
    assert_true(
        pack["summary"]["phase0_verdict"] == prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
        "Phase 0 verdict no longer matches the gating baseline",
    )
    assert_true(
        prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream",
    )
    assert_true(pack["summary"]["route_binding_count"] == 10, "Route binding coverage drifted")
    assert_true(pack["summary"]["redirect_row_count"] == 54, "Redirect row coverage drifted")
    assert_true(pack["summary"]["scope_bundle_count"] == 4, "Scope bundle coverage drifted")
    assert_true(pack["summary"]["scope_row_count"] == 10, "Scope row coverage drifted")
    assert_true(pack["summary"]["environment_profile_count"] == 6, "Environment profile coverage drifted")
    assert_true(pack["summary"]["mock_client_count"] == 4, "Mock client coverage drifted")
    assert_true(pack["summary"]["test_user_count"] == 5, "Test user coverage drifted")
    assert_true(pack["summary"]["live_gate_count"] == 8, "Live gate coverage drifted")

    guidance_ids = {row["source_id"] for row in pack["official_guidance"]}
    assert_true(guidance_ids == MANDATORY_GUIDANCE_IDS, "Official guidance coverage drifted")

    redirect_counts: dict[tuple[str, str], int] = defaultdict(int)
    for row in redirects:
      redirect_counts[(row["client_id"], row["environment_profile_id"])] += 1
      assert_true(row["callback_uri"].endswith(row["callback_uri"].split("/auth/callback/")[-1]), "Unexpected callback URI structure")
      assert_true("/auth/callback/" in row["callback_uri"], "Callback URI escaped the governed route family")
    for key, count in redirect_counts.items():
        assert_true(count <= 10, f"Client/environment redirect limit exceeded for {key}")

    im1_rows = [row for row in scopes if row["im1_enabled_required"] == "true"]
    assert_true(len(im1_rows) == 1, "IM1 scope gating drifted")
    assert_true(im1_rows[0]["route_binding_id"] == "rb_gp_im1_pairing", "IM1 scope escaped its dedicated route binding")

    live_gate_ids = {row["gate_id"] for row in pack["live_gates"]}
    for gate_id in [
        "LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD",
        "LIVE_GATE_NHS_LOGIN_PARTNER_APPROVED",
        "LIVE_GATE_REDIRECT_URI_REVIEW",
        "LIVE_GATE_IDENTITY_SESSION_PARITY",
        "LIVE_GATE_ENVIRONMENT_TARGET_MISSING",
        "LIVE_GATE_MUTATION_FLAG_DISABLED",
        "LIVE_GATE_IM1_SCAL_APPROVED",
        "LIVE_GATE_TECHNICAL_CONFORMANCE_PENDING",
    ]:
        assert_true(gate_id in live_gate_ids, f"Missing live gate {gate_id}")

    assert_true(placeholders["dry_run_defaults"]["allow_real_provider_mutation"] is False, "Dry-run posture drifted")
    assert_true(
        placeholders["dry_run_defaults"]["default_target_url"] == "http://127.0.0.1:4174/?mode=actual&view=admin",
        "Dry-run target URL drifted",
    )
    assert_true(
        any(field["placeholder_id"] == "cred_live_mutation_flag" for field in placeholders["placeholder_fields"]),
        "Live mutation placeholder drifted",
    )
    assert_true(mock_registry["task_id"] == "seq_025", "Mock registry task id drifted")

    for markdown_path in [
        DOCS_DIR / "25_nhs_login_mock_service_spec.md",
        DOCS_DIR / "25_redirect_uri_and_scope_matrix.md",
        DOCS_DIR / "25_credential_capture_and_vault_ingest_runbook.md",
        DOCS_DIR / "25_nhs_login_environment_profile_pack.md",
    ]:
        content = markdown_path.read_text()
        for label in MANDATORY_DOC_LABELS:
            assert_true(label in content, f"{markdown_path.name} lost {label}")
        assert_true("Bluewoven_Identity_Simulator" in content or "Bluewoven Identity Simulator" in content, f"{markdown_path.name} lost the simulator label")

    app = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app, f"React app missing marker {marker}")
    assert_true("MOCK_NHS_LOGIN" in app, "React app lost the mock badge")
    assert_true("gp_integration_credentials" in app, "React app lost IM1 surface awareness")
    assert_true("route-intent" in app.lower(), "React app lost route-intent copy")

    styles = (APP_DIR / "src" / "styles.css").read_text()
    for token in [
        "--canvas: #f4f7fb",
        "--primary: #0b57d0",
        "--secondary: #335cff",
        "--consent: #6e59d9",
        "grid-template-columns: 280px minmax(0, 1fr) 360px",
    ]:
        assert_true(token in styles, f"Styles lost required token {token}")

    user_spec = (TESTS_DIR / "mock-nhs-login-user-journeys.spec.js").read_text()
    assert_true("consent-button-allow" in user_spec, "User journey spec lost consent coverage")
    assert_true("reduced motion" in user_spec.lower(), "User journey spec lost reduced-motion coverage")

    admin_spec = (TESTS_DIR / "mock-nhs-login-admin-console.spec.js").read_text()
    assert_true("redirect-uri-input" in admin_spec, "Admin spec lost redirect input coverage")
    assert_true("environment-switcher" in admin_spec, "Admin spec lost environment switching coverage")

    dry_run = (BROWSER_AUTOMATION_DIR / "nhs-login-credential-intake-dry-run.spec.js").read_text()
    assert_true("ALLOW_REAL_PROVIDER_MUTATION" in dry_run, "Dry-run harness lost live mutation gate")
    assert_true("data-driven selector map" in dry_run.lower(), "Dry-run harness lost selector-map note")
    assert_true("redaction" in dry_run.lower(), "Dry-run harness lost redaction posture")

    print("seq_025 validation passed")


if __name__ == "__main__":
    main()
