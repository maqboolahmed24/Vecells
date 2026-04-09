#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-im1-pairing-studio"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
}

DELIVERABLES = [
    DATA_DIR / "im1_pairing_pack.json",
    DATA_DIR / "im1_pairing_stage_matrix.csv",
    DATA_DIR / "im1_prerequisites_field_map.json",
    DATA_DIR / "im1_scal_artifact_matrix.csv",
    DATA_DIR / "im1_provider_supplier_register.json",
    DATA_DIR / "im1_live_gate_checklist.json",
    DOCS_DIR / "26_im1_pairing_rehearsal_strategy.md",
    DOCS_DIR / "26_im1_pairing_prerequisites_field_map.md",
    DOCS_DIR / "26_im1_scal_artifact_matrix.md",
    DOCS_DIR / "26_im1_provider_supplier_and_licence_register.md",
    DOCS_DIR / "26_im1_change_control_and_rfc_strategy.md",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "im1PairingPack.ts",
    APP_DIR / "public" / "im1-pairing-pack.json",
    TESTS_DIR / "mock-im1-pairing-studio.spec.js",
    TESTS_DIR / "mock-im1-pairing-form-validation.spec.js",
    BROWSER_AUTOMATION_DIR / "im1-prerequisites-dry-run.spec.js",
    ROOT / "tools" / "analysis" / "build_im1_pairing_pack.py",
]

MANDATORY_STAGE_IDS = {
    "product_profile_defined",
    "prerequisites_drafted",
    "stage_one_scal_stub_ready",
    "provider_supplier_targeting_ready",
    "compatibility_claim_ready",
    "model_interface_licence_placeholder_ready",
    "provider_mock_api_rehearsal_ready",
    "supported_test_readiness_blocked",
    "assurance_pack_in_progress",
    "rfc_watch_registered",
    "ready_for_real_im1_submission",
}

MANDATORY_GUIDANCE_IDS = {
    "official_im1_pairing_process",
    "official_im1_prerequisites_form",
    "official_scal_process",
    "official_im1_api_standards",
}

MANDATORY_DOC_LABELS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="im1-shell"',
    'data-testid="stage-rail"',
    'data-testid="mode-toggle"',
    'data-testid="evidence-drawer"',
    'data-testid="provider-matrix"',
    'data-testid="flow-diagram"',
    'data-testid="flow-parity-table"',
    'data-testid="dry-run-submit"',
    "MOCK_IM1_PAIRING",
    "Interface_Proof_Atelier",
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
    assert_true(not missing, "Missing seq_026 prerequisites: " + ", ".join(sorted(missing)))
    inputs = {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}
    assert_true(
        inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream",
    )
    assert_true(
        inputs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"] == "withheld",
        "seq_026 expects the Phase 0 verdict to remain withheld",
    )
    return inputs


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_026 deliverables:\n" + "\n".join(missing))


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "im1_pairing_pack.json")
    stage_rows = load_csv(DATA_DIR / "im1_pairing_stage_matrix.csv")
    field_map = load_json(DATA_DIR / "im1_prerequisites_field_map.json")
    scal_rows = load_csv(DATA_DIR / "im1_scal_artifact_matrix.csv")
    provider_register = load_json(DATA_DIR / "im1_provider_supplier_register.json")
    live_gates = load_json(DATA_DIR / "im1_live_gate_checklist.json")

    assert_true(pack["task_id"] == "seq_026", "Task id drifted")
    assert_true(pack["visual_mode"] == "Interface_Proof_Atelier", "Visual mode drifted")
    assert_true(pack["summary"]["stage_count"] == 21, "Stage count drifted")
    assert_true(pack["summary"]["rehearsal_stage_count"] == 9, "Rehearsal stage count drifted")
    assert_true(pack["summary"]["exact_public_field_count"] == 16, "Exact public field count drifted")
    assert_true(pack["summary"]["field_count"] == 25, "Field count drifted")
    assert_true(pack["summary"]["artifact_count"] == 15, "Artifact count drifted")
    assert_true(pack["summary"]["provider_supplier_count"] == 2, "Provider count drifted")
    assert_true(pack["summary"]["route_family_matrix_count"] == 12, "Route-family matrix count drifted")
    assert_true(pack["summary"]["live_gate_count"] == 10, "Live gate count drifted")
    assert_true(pack["summary"]["blocked_live_gate_count"] == 7, "Blocked live-gate count drifted")
    assert_true(pack["summary"]["rfc_watch_count"] == 7, "RFC watch count drifted")
    assert_true(
        pack["phase0_verdict"] == inputs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"],
        "Phase 0 verdict no longer matches the gating baseline",
    )

    stage_ids = {row["stage_id"] for row in pack["stage_rows"]}
    assert_true(MANDATORY_STAGE_IDS.issubset(stage_ids), "Mandatory IM1 stages are missing")
    assert_true(len(stage_rows) == 21, "Stage CSV row count drifted")
    assert_true(
        {row["stage_class"] for row in stage_rows}
        == {
            "internal_rehearsal",
            "official_process",
            "blocked_until_mvp",
            "provider_supplier_specific",
        },
        "Stage classes drifted",
    )

    guidance_ids = {row["source_id"] for row in pack["official_guidance"]}
    assert_true(guidance_ids == MANDATORY_GUIDANCE_IDS, "Official guidance coverage drifted")

    assert_true(field_map["summary"]["field_count"] == 25, "Field-map summary drifted")
    assert_true(field_map["summary"]["exact_public_field_count"] == 16, "Exact public field summary drifted")
    assert_true(len(field_map["fields"]) == 25, "Field-map rows drifted")
    assert_true(
        len([row for row in field_map["fields"] if row["origin_class"] == "exact_public_form"]) == 16,
        "Exact public field rows drifted",
    )

    assert_true(len(scal_rows) == 15, "SCAL artifact rows drifted")

    assert_true(provider_register["summary"]["provider_supplier_count"] == 2, "Provider register summary drifted")
    assert_true(provider_register["summary"]["route_family_matrix_count"] == 12, "Provider matrix summary drifted")
    assert_true(
        provider_register["roster_refresh"]["known_provider_suppliers_on_capture"] == ["Optum (EMISWeb)", "TPP (SystmOne)"],
        "Provider roster snapshot drifted",
    )

    assert_true(live_gates["summary"]["live_gate_count"] == 10, "Live-gate summary drifted")
    assert_true(live_gates["summary"]["blocked_count"] == 7, "Live-gate blocked count drifted")
    assert_true(live_gates["summary"]["review_required_count"] == 2, "Live-gate review count drifted")
    assert_true(live_gates["summary"]["pass_count"] == 1, "Live-gate pass count drifted")
    assert_true(live_gates["summary"]["current_submission_posture"] == "blocked", "Submission posture drifted")

    for env_var in [
        "IM1_NAMED_APPROVER",
        "IM1_ENVIRONMENT_TARGET",
        "IM1_SPONSOR_NAME",
        "IM1_COMMERCIAL_OWNER",
        "ALLOW_REAL_PROVIDER_MUTATION",
    ]:
        assert_true(env_var in live_gates["required_env"], f"Missing live env requirement {env_var}")

    app = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app, f"App lost marker {marker}")

    styles = (APP_DIR / "src" / "styles.css").read_text()
    for token in [
        "--canvas: #f5f7fa",
        "--primary: #2457f5",
        "--secondary: #0e9384",
        "--progress: #12b76a",
        "--watch: #b54708",
        "--blocked: #c24141",
        "grid-template-columns: 288px minmax(0, 1fr) 360px",
    ]:
        assert_true(token in styles, f"Styles lost required token {token}")

    for markdown_path in [
        DOCS_DIR / "26_im1_pairing_rehearsal_strategy.md",
        DOCS_DIR / "26_im1_pairing_prerequisites_field_map.md",
        DOCS_DIR / "26_im1_scal_artifact_matrix.md",
        DOCS_DIR / "26_im1_provider_supplier_and_licence_register.md",
        DOCS_DIR / "26_im1_change_control_and_rfc_strategy.md",
    ]:
        content = markdown_path.read_text()
        for label in MANDATORY_DOC_LABELS:
            assert_true(label in content, f"{markdown_path.name} lost {label}")

    studio_spec = (TESTS_DIR / "mock-im1-pairing-studio.spec.js").read_text()
    assert_true("stage-button-supported_test_readiness_blocked" in studio_spec, "Studio spec lost blocked-stage coverage")
    assert_true("reduced motion" in studio_spec.lower(), "Studio spec lost reduced-motion coverage")

    form_spec = (TESTS_DIR / "mock-im1-pairing-form-validation.spec.js").read_text()
    assert_true("actual-field-named-approver" in form_spec, "Form spec lost actual-mode approver coverage")
    assert_true("dry-run-submit" in form_spec, "Form spec lost dry-run button coverage")

    harness = (BROWSER_AUTOMATION_DIR / "im1-prerequisites-dry-run.spec.js").read_text()
    assert_true("ALLOW_REAL_PROVIDER_MUTATION" in harness, "Dry-run harness lost mutation gate")
    assert_true("fetchCurrentProviderRoster" in harness, "Dry-run harness lost runtime roster refresh")
    assert_true("data-driven" in harness.lower(), "Dry-run harness lost selector-map note")

    print("seq_026 validation passed")


if __name__ == "__main__":
    main()
