#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-nhs-login-onboarding"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DELIVERABLES = [
    DATA_DIR / "nhs_login_application_field_map.json",
    DATA_DIR / "nhs_login_live_gate_conditions.json",
    DATA_DIR / "nhs_login_submission_artifact_checklist.csv",
    DOCS_DIR / "24_nhs_login_mock_onboarding_strategy.md",
    DOCS_DIR / "24_nhs_login_actual_onboarding_strategy.md",
    DOCS_DIR / "24_nhs_login_application_dossier.md",
    DOCS_DIR / "24_nhs_login_manual_checkpoint_register.md",
    DOCS_DIR / "24_nhs_login_onboarding_studio.html",
    APP_DIR / "README.md",
    APP_DIR / "src" / "generated" / "nhsLoginPack.ts",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    TESTS_DIR / "mock-nhs-login-onboarding.spec.js",
    BROWSER_AUTOMATION_DIR / "nhs-login-live-application-dry-run.spec.js",
]

MANDATORY_STAGE_IDS = {
    "application_draft",
    "product_fit_review",
    "demo_prep",
    "sandpit_request_ready",
    "sandpit_requested",
    "product_demo_pending",
    "integration_request_blocked_until_demo",
    "integration_request_ready",
    "assurance_bundle_in_progress",
    "connection_agreement_pending",
    "service_desk_registration_pending",
    "ready_for_real_submission",
}

MANDATORY_DOC_LABELS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

HTML_MARKERS = [
    'data-testid="atelier-shell"',
    'data-testid="readiness-banner"',
    'data-testid="mode-toggle"',
    'data-testid="stage-rail"',
    'data-testid="form-sections"',
    'data-testid="artifact-panel"',
    'data-testid="evidence-drawer"',
    'data-testid="process-diagram"',
    'data-testid="process-parity-table"',
    'data-testid="actual-submission-notice"',
]

APP_MARKERS = [
    "data-testid=\"stage-rail\"",
    "data-testid=\"mode-toggle\"",
    "data-testid=\"evidence-drawer\"",
    "data-testid=\"process-diagram\"",
    "data-testid=\"actual-submission-notice\"",
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
    assert_true(not missing, "Missing seq_024 prerequisites: " + ", ".join(sorted(missing)))
    return {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_024 deliverables:\n" + "\n".join(missing))


def main() -> None:
    prereqs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "nhs_login_application_field_map.json")
    gates = load_json(DATA_DIR / "nhs_login_live_gate_conditions.json")
    artifacts = load_csv(DATA_DIR / "nhs_login_submission_artifact_checklist.csv")

    assert_true(pack["task_id"] == "seq_024", "Task id drifted")
    assert_true(pack["visual_mode"] == "Partner_Access_Atelier", "Visual mode drifted")
    assert_true(pack["summary"]["phase0_verdict"] == prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"], "Phase 0 verdict drifted")
    assert_true(pack["summary"]["phase0_verdict"] == "withheld", "seq_024 should keep the real-provider posture withheld")
    assert_true(prereqs["integration_priority_matrix"]["summary"]["integration_family_count"] == 15, "Upstream seq_021 drifted")
    assert_true(prereqs["provider_family_scorecards"]["summary"]["provider_family_count"] == 8, "Upstream seq_022 drifted")
    assert_true(prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0, "Traceability gap reopened")

    stage_ids = {stage["stage_id"] for stage in pack["stages"]}
    assert_true(stage_ids == MANDATORY_STAGE_IDS, "Stage model drifted")
    assert_true(len(pack["fields"]) >= 24, "Field coverage unexpectedly shrank")
    assert_true(len(pack["artifacts"]) >= 16, "Artifact coverage unexpectedly shrank")
    assert_true(len(pack["manual_checkpoints"]) >= 8, "Checkpoint coverage unexpectedly shrank")
    assert_true(len(pack["live_gates"]) >= 8, "Live gate coverage unexpectedly shrank")
    assert_true(len(artifacts) == len(pack["artifacts"]), "Artifact CSV is out of sync with pack JSON")

    gate_ids = {gate["gate_id"] for gate in pack["live_gates"]}
    assert_true("LIVE_GATE_MUTATION_FLAG_DISABLED" in gate_ids, "Live mutation gate missing")
    assert_true("LIVE_GATE_EXTERNAL_FOUNDATION_WITHHELD" in gate_ids, "Phase 0 external gate missing")

    blocked_stage = next(stage for stage in pack["stages"] if stage["stage_id"] == "integration_request_blocked_until_demo")
    assert_true("chk_product_demo_outcome" in blocked_stage["required_checkpoint_ids"], "Integration block no longer depends on demo outcome")
    assert_true("BLOCKER_INTEGRATION_REQUEST_BLOCKED_UNTIL_PRODUCT_DEMO" in blocked_stage["hard_blockers"], "Integration block reason drifted")

    final_stage = next(stage for stage in pack["stages"] if stage["stage_id"] == "ready_for_real_submission")
    assert_true("fld_named_approver" in final_stage["required_field_ids"], "Named approver gate drifted")
    assert_true("fld_environment_target" in final_stage["required_field_ids"], "Environment gate drifted")
    assert_true("fld_live_mutation_flag" in final_stage["required_field_ids"], "Live mutation flag gate drifted")

    selector_map = gates["selector_map"]
    for selector_key in [
        "mode_toggle_mock",
        "mode_toggle_actual",
        "stage_rail",
        "field_prefix",
        "artifact_prefix",
        "next_stage_button",
        "previous_stage_button",
        "evidence_drawer",
    ]:
        assert_true(selector_key in selector_map["base_profile"], f"Missing selector map key: {selector_key}")
    assert_true(gates["dry_run_defaults"]["allow_real_provider_mutation"] is False, "Dry-run default unexpectedly allows mutation")

    for markdown_path in [
        DOCS_DIR / "24_nhs_login_mock_onboarding_strategy.md",
        DOCS_DIR / "24_nhs_login_actual_onboarding_strategy.md",
        DOCS_DIR / "24_nhs_login_application_dossier.md",
        DOCS_DIR / "24_nhs_login_manual_checkpoint_register.md",
    ]:
        content = markdown_path.read_text()
        for label in MANDATORY_DOC_LABELS:
            assert_true(label in content, f"{markdown_path.name} lost {label}")

    html = (DOCS_DIR / "24_nhs_login_onboarding_studio.html").read_text()
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Studio HTML missing marker {marker}")
    assert_true("Partner_Access_Atelier" in html, "Studio HTML lost the visual mode label")
    assert_true("Mock_Onboarding" in html, "Studio HTML lost the mock ribbon")
    assert_true("localStorage" in html, "Studio HTML lost autosave persistence")

    app = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app, f"React app missing marker {marker}")
    assert_true("ALLOW_REAL_PROVIDER_MUTATION" in (BROWSER_AUTOMATION_DIR / "nhs-login-live-application-dry-run.spec.js").read_text(), "Dry-run harness lost live mutation gate")
    assert_true("data-driven selector map" in (BROWSER_AUTOMATION_DIR / "nhs-login-live-application-dry-run.spec.js").read_text().lower(), "Dry-run harness lost selector-map note")
    assert_true("autosave" in (TESTS_DIR / "mock-nhs-login-onboarding.spec.js").read_text().lower(), "Mock Playwright spec lost autosave coverage")

    print("seq_024 validation passed")


if __name__ == "__main__":
    main()
