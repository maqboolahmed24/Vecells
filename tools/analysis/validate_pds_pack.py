#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
SERVICE_DIR = ROOT / "services" / "mock-pds-fhir"
APP_DIR = ROOT / "apps" / "mock-pds-access-studio"
TESTS_DIR = ROOT / "tests" / "playwright"
BROWSER_AUTOMATION_DIR = ROOT / "tools" / "browser-automation"

REQUIRED_INPUTS = {
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "external_dependencies": DATA_DIR / "external_dependencies.json",
    "secret_ownership_map": DATA_DIR / "secret_ownership_map.json",
}

DELIVERABLES = [
    DATA_DIR / "pds_access_pack.json",
    DATA_DIR / "pds_access_mode_matrix.csv",
    DATA_DIR / "pds_feature_flag_registry.json",
    DATA_DIR / "pds_onboarding_field_map.json",
    DATA_DIR / "pds_hazard_risk_artifact_matrix.csv",
    DOCS_DIR / "27_pds_feature_flag_strategy.md",
    DOCS_DIR / "27_pds_digital_onboarding_field_map.md",
    DOCS_DIR / "27_pds_access_mode_and_route_family_matrix.md",
    DOCS_DIR / "27_pds_hazard_and_risk_log_strategy.md",
    DOCS_DIR / "27_pds_live_gate_and_rollback_plan.md",
    SERVICE_DIR / "README.md",
    SERVICE_DIR / "package.json",
    SERVICE_DIR / "src" / "pdsCore.js",
    SERVICE_DIR / "src" / "server.js",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "pdsAccessPack.ts",
    APP_DIR / "public" / "pds-access-pack.json",
    TESTS_DIR / "mock-pds-access-studio.spec.js",
    TESTS_DIR / "mock-pds-fhir-sandbox.spec.js",
    BROWSER_AUTOMATION_DIR / "pds-digital-onboarding-dry-run.spec.js",
    ROOT / "tools" / "analysis" / "build_pds_access_pack.py",
]

EXPECTED_GUIDANCE_IDS = {
    "official_pds_onboarding_support_info",
    "official_pds_fhir_api_catalogue",
    "official_access_data_on_pds",
    "official_pds_integration_guidance",
    "official_pds_integrated_products",
    "official_scal_process",
    "official_partner_onboarding_operations",
}

MANDATORY_USE_CASES = {
    "PDS_UC_SECURE_LINK_TRACE",
    "PDS_UC_PATIENT_HOME_CONTACT_REFRESH",
    "PDS_UC_PATIENT_HOME_NOMINATED_PHARMACY",
    "PDS_UC_STAFF_DIRECT_CARE_TRACE",
    "PDS_UC_SUPPORT_IDENTITY_REVIEW",
    "PDS_UC_SUPPORT_CONTACT_CORRECTION",
    "PDS_UC_GOVERNANCE_TRACE",
    "PDS_UC_GOVERNANCE_UPDATE",
    "PDS_UC_REQUESTS_PHARMACY_COMPARE",
}

MANDATORY_ARTIFACT_IDS = {
    "ART_PDS_HAZARD_LOG",
    "ART_PDS_RISKLOG_APPLICATION_RESTRICTED",
    "ART_PDS_RISKLOG_HEALTHCARE_WORKER",
    "ART_PDS_RISKLOG_HEALTHCARE_WORKER_UPDATE",
    "ART_PDS_RISKLOG_PATIENT_ACCESS",
    "ART_PDS_WRONG_PATIENT_MITIGATION_PLAN",
    "ART_PDS_ROLLBACK_REHEARSAL",
}

DOC_SECTION_MARKERS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="pds-shell"',
    'data-testid="route-rail"',
    'data-testid="identity-inspector"',
    'data-testid="lineage-strip"',
    'data-testid="run-trace-button"',
    'data-testid="actual-submit-button"',
    "MOCK_PDS_SANDBOX",
    "pdsAccessPack.visual_mode",
]

SERVICE_MARKERS = [
    'data-testid="sandbox-shell"',
    'data-testid="result-json"',
    'data-testid="audit-log"',
    "MOCK_PDS_SANDBOX",
    "/Patient",
    "/audit",
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
    assert_true(not missing, "Missing seq_027 prerequisites: " + ", ".join(sorted(missing)))
    inputs = {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}
    assert_true(
        inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream.",
    )
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_027 expects Phase 0 to remain withheld.",
    )
    return inputs


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_027 deliverables:\n" + "\n".join(missing))


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "pds_access_pack.json")
    access_rows = load_csv(DATA_DIR / "pds_access_mode_matrix.csv")
    feature_flags = load_json(DATA_DIR / "pds_feature_flag_registry.json")
    field_map = load_json(DATA_DIR / "pds_onboarding_field_map.json")
    artifact_rows = load_csv(DATA_DIR / "pds_hazard_risk_artifact_matrix.csv")

    assert_true(pack["task_id"] == "seq_027", "Task id drifted.")
    assert_true(pack["visual_mode"] == "Identity_Trace_Studio", "Visual mode drifted.")
    assert_true(pack["phase0_verdict"] == "withheld", "Phase 0 verdict drifted.")
    assert_true(pack["summary"]["access_row_count"] == 9, "Access-row count drifted.")
    assert_true(pack["summary"]["feature_flag_count"] == 10, "Feature-flag count drifted.")
    assert_true(pack["summary"]["field_count"] == 25, "Field count drifted.")
    assert_true(pack["summary"]["official_guidance_field_count"] == 11, "Official field count drifted.")
    assert_true(pack["summary"]["derived_field_count"] == 14, "Derived field count drifted.")
    assert_true(pack["summary"]["hazard_artifact_count"] == 13, "Hazard artifact count drifted.")
    assert_true(pack["summary"]["live_gate_count"] == 13, "Live gate count drifted.")
    assert_true(pack["summary"]["blocked_live_gate_count"] == 5, "Blocked live-gate count drifted.")
    assert_true(pack["summary"]["review_live_gate_count"] == 6, "Review live-gate count drifted.")
    assert_true(pack["summary"]["pass_live_gate_count"] == 2, "Pass live-gate count drifted.")
    assert_true(pack["summary"]["mock_patient_count"] == 6, "Mock patient count drifted.")
    assert_true(pack["summary"]["scenario_count"] == 9, "Scenario count drifted.")
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == pack["phase0_verdict"],
        "Phase-0 verdict no longer matches the gating baseline.",
    )

    guidance_ids = {row["source_id"] for row in pack["official_guidance"]}
    assert_true(guidance_ids == EXPECTED_GUIDANCE_IDS, "Official guidance coverage drifted.")

    access_ids = {row["pds_use_case_id"] for row in pack["access_rows"]}
    assert_true(access_ids == MANDATORY_USE_CASES, "PDS use-case coverage drifted.")
    assert_true(len(access_rows) == 9, "CSV access row count drifted.")

    allowed_modes = {
        "application_restricted",
        "healthcare_worker",
        "healthcare_worker_with_update",
        "patient_access",
        "other_if_officially_supported",
    }
    allowed_defaults = {"off", "internal_only", "cohort_limited", "ready_for_live"}
    for row in access_rows:
        assert_true(row["access_mode"] in allowed_modes, f"Unexpected access mode: {row['access_mode']}")
        assert_true(row["default_state"] in allowed_defaults, f"Unexpected flag default: {row['default_state']}")
        assert_true(bool(row["route_family_ref"]), f"Missing route family for {row['pds_use_case_id']}")
        assert_true(bool(row["feature_flag_name"]), f"Missing flag for {row['pds_use_case_id']}")
        assert_true(bool(row["required_hazard_log_refs"]), f"Missing hazard refs for {row['pds_use_case_id']}")
        assert_true(bool(row["required_risk_log_refs"]), f"Missing risk-log refs for {row['pds_use_case_id']}")
        assert_true(bool(row["identity_binding_impact"]), f"Identity impact note missing in {row['pds_use_case_id']}")

    assert_true(feature_flags["summary"]["feature_flag_count"] == 10, "Feature-flag summary drifted.")
    assert_true(
        any(row["flag_name"] == "pds.global.kill_switch" for row in feature_flags["feature_flags"]),
        "Global kill switch is missing.",
    )
    assert_true(
        len({row["flag_name"] for row in feature_flags["feature_flags"]}) == len(feature_flags["feature_flags"]),
        "Feature-flag names must stay unique.",
    )

    assert_true(field_map["summary"]["field_count"] == 25, "Field-map summary drifted.")
    assert_true(field_map["summary"]["official_guidance_field_count"] == 11, "Official field-map count drifted.")
    assert_true(len(field_map["fields"]) == 25, "Field-map rows drifted.")
    assert_true(
        any(row["field_id"] == "fld_hazard_log_ref" for row in field_map["fields"]),
        "Hazard-log field is missing.",
    )
    assert_true(
        any(row["field_id"] == "fld_secret_capture_plan" for row in field_map["fields"]),
        "Secret-capture field is missing.",
    )

    assert_true(len(artifact_rows) == 13, "Hazard/risk artifact rows drifted.")
    assert_true(
        MANDATORY_ARTIFACT_IDS.issubset({row["artifact_id"] for row in artifact_rows}),
        "Hazard/risk artifact coverage drifted.",
    )

    live_gates = pack["live_gate_pack"]["live_gates"]
    assert_true(len(live_gates) == 13, "Live gate payload drifted.")
    assert_true(pack["live_gate_pack"]["current_submission_posture"] == "blocked", "Submission posture drifted.")
    for env_var in [
        "PDS_NAMED_APPROVER",
        "PDS_ENVIRONMENT_TARGET",
        "PDS_ORGANISATION_ODS",
        "PDS_USE_CASE_OWNER",
        "ALLOW_REAL_PROVIDER_MUTATION",
    ]:
        assert_true(env_var in pack["live_gate_pack"]["required_env"], f"Missing live env requirement {env_var}")

    assert_true(
        pack["live_gate_pack"]["selector_map"]["base_profile"]["final_submit"]
        == "[data-testid='actual-submit-button']",
        "Dry-run selector map drifted.",
    )

    app = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app, f"App lost marker {marker}")

    styles = (APP_DIR / "src" / "styles.css").read_text()
    for token in [
        "--canvas: #f4f7fb",
        "--primary: #0f5cc0",
        "--secondary: #127a6a",
        "--identity: #6941c6",
        "--blocked: #c24141",
        "grid-template-columns: 280px minmax(0, 1fr) 380px",
    ]:
        assert_true(token in styles, f"Styles lost required token {token}")

    service = (SERVICE_DIR / "src" / "server.js").read_text()
    for marker in SERVICE_MARKERS:
        assert_true(marker in service, f"Service lost marker {marker}")

    for markdown_path in [
        DOCS_DIR / "27_pds_feature_flag_strategy.md",
        DOCS_DIR / "27_pds_digital_onboarding_field_map.md",
        DOCS_DIR / "27_pds_access_mode_and_route_family_matrix.md",
        DOCS_DIR / "27_pds_hazard_and_risk_log_strategy.md",
        DOCS_DIR / "27_pds_live_gate_and_rollback_plan.md",
    ]:
        text = markdown_path.read_text()
        for marker in DOC_SECTION_MARKERS:
            assert_true(marker in text, f"{markdown_path.name} lost section marker {marker}")

    print(
        "Validated seq_027 pack: "
        f"{pack['summary']['access_row_count']} access rows, "
        f"{pack['summary']['feature_flag_count']} flags, "
        f"{pack['summary']['field_count']} onboarding fields, "
        f"{pack['summary']['hazard_artifact_count']} hazard/risk artifacts, "
        f"{pack['summary']['live_gate_count']} live gates."
    )


if __name__ == "__main__":
    main()
