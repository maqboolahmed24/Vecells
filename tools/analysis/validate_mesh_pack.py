#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
SERVICE_DIR = ROOT / "services" / "mock-mesh"
APP_DIR = ROOT / "apps" / "mock-mesh-mailroom"
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
    DATA_DIR / "mesh_execution_pack.json",
    DATA_DIR / "mesh_mailbox_field_map.json",
    DATA_DIR / "mesh_workflow_registry.csv",
    DATA_DIR / "mesh_message_route_matrix.csv",
    DATA_DIR / "mesh_live_gate_checklist.json",
    DOCS_DIR / "28_mesh_mock_mailroom_spec.md",
    DOCS_DIR / "28_mesh_mailbox_application_field_map.md",
    DOCS_DIR / "28_mesh_workflow_group_and_id_registry.md",
    DOCS_DIR / "28_mesh_message_route_and_proof_matrix.md",
    DOCS_DIR / "28_mesh_live_gate_and_approval_strategy.md",
    SERVICE_DIR / "README.md",
    SERVICE_DIR / "package.json",
    SERVICE_DIR / "src" / "meshCore.js",
    SERVICE_DIR / "src" / "server.js",
    APP_DIR / "README.md",
    APP_DIR / "package.json",
    APP_DIR / "tsconfig.json",
    APP_DIR / "vite.config.ts",
    APP_DIR / "index.html",
    APP_DIR / "src" / "App.tsx",
    APP_DIR / "src" / "main.tsx",
    APP_DIR / "src" / "styles.css",
    APP_DIR / "src" / "generated" / "meshExecutionPack.ts",
    APP_DIR / "public" / "mesh-execution-pack.json",
    TESTS_DIR / "mock-mesh-mailroom.spec.js",
    TESTS_DIR / "mock-mesh-workflow-proof.spec.js",
    BROWSER_AUTOMATION_DIR / "mesh-mailbox-dry-run.spec.js",
    ROOT / "tools" / "analysis" / "build_mesh_pack.py",
]

MANDATORY_GUIDANCE_IDS = {
    "official_mesh_service_overview",
    "official_mesh_ui_and_test_env",
    "official_mesh_mailbox_apply_form",
    "official_mesh_workflow_guidance",
    "official_mesh_workflow_request_form",
    "official_mesh_roadmap",
    "official_mesh_api_catalogue",
}

MANDATORY_WORKFLOW_IDS = {
    "VEC_HUB_BOOKING_NOTICE",
    "VEC_HUB_BOOKING_ACK",
    "VEC_PF_REFERRAL_INIT",
    "VEC_PF_REFERRAL_ACK",
    "VEC_PF_OUTCOME_RESP",
    "VEC_PF_URGENT_RETURN_RESP",
    "VEC_ATTACHMENT_QUARANTINE",
    "VEC_REPLAY_EVIDENCE_REQUEST",
    "VEC_HUB_RECOVERY_ACTION",
}

MANDATORY_ROUTE_ROWS = {
    "ROUTE_HUB_QUEUE_NOTICE",
    "ROUTE_HUB_CASE_ACK",
    "ROUTE_PHARMACY_REFERRAL_DISPATCH",
    "ROUTE_PHARMACY_OUTCOME",
    "ROUTE_SUPPORT_QUARANTINE",
    "ROUTE_SUPPORT_REPLAY",
}

MANDATORY_LIVE_GATES = {
    "MESH_LIVE_GATE_PHASE0_EXTERNAL_READY",
    "MESH_LIVE_GATE_WORKFLOW_SET_TRACEABLE",
    "MESH_LIVE_GATE_PATH_TO_LIVE_NEED_STATED",
    "MESH_LIVE_GATE_API_ONBOARDING_COMPLETE",
    "MESH_LIVE_GATE_MUTATION_AND_SPEND_ACK",
    "MESH_LIVE_GATE_FINAL_POSTURE",
}

DOC_MARKERS = [
    "Section A — `Mock_now_execution`",
    "Section B — `Actual_provider_strategy_later`",
]

APP_MARKERS = [
    'data-testid="mesh-shell"',
    'data-testid="mailbox-rail"',
    'data-testid="timeline-workbench"',
    'data-testid="proof-inspector"',
    'data-testid="lineage-strip"',
    'data-testid="mode-toggle-actual"',
    'data-testid="actual-submit-button"',
    "MOCK_MESH_MAILROOM",
    "Signal_Post_Room",
]

SERVICE_MARKERS = [
    'data-testid="mesh-sandbox-shell"',
    'data-testid="dispatch-button"',
    'data-testid="message-json"',
    "MOCK_MESH_SANDBOX",
    "/api/dispatch",
    "/api/messages",
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
    assert_true(not missing, "Missing seq_028 prerequisites: " + ", ".join(sorted(missing)))
    inputs = {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}
    assert_true(
        inputs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0,
        "Traceability gaps reopened upstream.",
    )
    assert_true(
        inputs["phase0_gate_verdict"]["summary"]["phase0_entry_verdict"] == "withheld",
        "seq_028 expects Phase 0 to remain withheld.",
    )
    return inputs


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_028 deliverables:\n" + "\n".join(missing))


def main() -> None:
    inputs = ensure_inputs()
    ensure_deliverables()

    pack = load_json(DATA_DIR / "mesh_execution_pack.json")
    field_map = load_json(DATA_DIR / "mesh_mailbox_field_map.json")
    workflow_rows = load_csv(DATA_DIR / "mesh_workflow_registry.csv")
    route_rows = load_csv(DATA_DIR / "mesh_message_route_matrix.csv")
    live_gates = load_json(DATA_DIR / "mesh_live_gate_checklist.json")

    assert_true(pack["task_id"] == "seq_028", "Task id drifted.")
    assert_true(pack["visual_mode"] == "Signal_Post_Room", "Visual mode drifted.")
    assert_true(pack["phase0_verdict"] == "withheld", "Phase 0 verdict drifted.")
    assert_true(pack["summary"]["mailbox_count"] == 5, "Mailbox count drifted.")
    assert_true(pack["summary"]["workflow_group_count"] == 4, "Workflow-group count drifted.")
    assert_true(pack["summary"]["workflow_row_count"] == 9, "Workflow-row count drifted.")
    assert_true(pack["summary"]["route_row_count"] == 10, "Route-row count drifted.")
    assert_true(pack["summary"]["field_count"] == 41, "Field count drifted.")
    assert_true(pack["summary"]["live_gate_count"] == 11, "Live-gate count drifted.")
    assert_true(pack["summary"]["blocked_live_gate_count"] == 5, "Blocked live-gate count drifted.")
    assert_true(pack["summary"]["review_live_gate_count"] == 4, "Review live-gate count drifted.")
    assert_true(pack["summary"]["pass_live_gate_count"] == 2, "Pass live-gate count drifted.")
    assert_true(pack["summary"]["scenario_count"] == 6, "Scenario count drifted.")
    assert_true(pack["summary"]["seeded_message_count"] == 6, "Seeded-message count drifted.")
    assert_true(pack["summary"]["selected_risk_count"] == 6, "Selected-risk count drifted.")
    assert_true(pack["summary"]["selected_secret_count"] == 5, "Selected-secret count drifted.")
    assert_true(pack["summary"]["selected_touchpoint_count"] == 3, "Selected-touchpoint count drifted.")

    guidance_ids = {row["source_id"] for row in pack["official_guidance"]}
    assert_true(guidance_ids == MANDATORY_GUIDANCE_IDS, "Official guidance coverage drifted.")

    assert_true(field_map["summary"]["field_count"] == 41, "Field-map count drifted.")
    assert_true(field_map["summary"]["official_mailbox_field_count"] == 22, "Mailbox-field count drifted.")
    assert_true(
        field_map["summary"]["official_workflow_request_field_count"] == 8,
        "Workflow-request field count drifted.",
    )
    assert_true(field_map["summary"]["derived_field_count"] == 11, "Derived-field count drifted.")
    assert_true(len(field_map["fields"]) == 41, "Field rows drifted.")

    workflow_ids = {row["workflow_id"] for row in workflow_rows}
    assert_true(workflow_ids == MANDATORY_WORKFLOW_IDS, "Workflow registry coverage drifted.")
    for row in workflow_rows:
        for key in [
            "workflow_group",
            "workflow_id",
            "message_family",
            "bounded_context_ref",
            "business_flow_summary",
            "proof_required_after_send",
            "acceptance_vs_authoritative_truth_note",
            "mailbox_direction",
            "path_to_live_need",
            "live_mailbox_need",
            "mock_now_support_level",
            "fallback_if_missing",
            "notes",
        ]:
            assert_true(bool(row[key]), f"Workflow row {row['workflow_id']} lost field {key}")

    route_ids = {row["route_row_id"] for row in route_rows}
    assert_true(MANDATORY_ROUTE_ROWS.issubset(route_ids), "Route proof coverage drifted.")
    for row in route_rows:
        assert_true(
            "Transport acceptance" not in row["authoritative_downstream_proof"],
            "Route rows must not treat transport acceptance as authoritative proof.",
        )

    assert_true(live_gates["summary"]["live_gate_count"] == 11, "Live-gate summary drifted.")
    assert_true(live_gates["summary"]["blocked_count"] == 5, "Blocked count drifted.")
    assert_true(live_gates["summary"]["review_required_count"] == 4, "Review count drifted.")
    assert_true(live_gates["summary"]["pass_count"] == 2, "Pass count drifted.")
    assert_true(live_gates["summary"]["current_submission_posture"] == "blocked", "Submission posture drifted.")
    assert_true(
        MANDATORY_LIVE_GATES.issubset({row["gate_id"] for row in live_gates["live_gates"]}),
        "Live gate coverage drifted.",
    )
    for env_var in [
        "MESH_NAMED_APPROVER",
        "MESH_ENVIRONMENT_TARGET",
        "MESH_MAILBOX_OWNER_ODS",
        "MESH_MANAGING_PARTY_MODE",
        "MESH_WORKFLOW_TEAM_CONTACT",
        "MESH_API_ONBOARDING_COMPLETE",
        "MESH_MINIMUM_NECESSARY_REVIEW_REF",
        "ALLOW_REAL_PROVIDER_MUTATION",
        "ALLOW_SPEND",
    ]:
        assert_true(env_var in live_gates["required_env"], f"Missing required env var {env_var}")

    for markdown_path in [
        DOCS_DIR / "28_mesh_mock_mailroom_spec.md",
        DOCS_DIR / "28_mesh_mailbox_application_field_map.md",
        DOCS_DIR / "28_mesh_workflow_group_and_id_registry.md",
        DOCS_DIR / "28_mesh_message_route_and_proof_matrix.md",
        DOCS_DIR / "28_mesh_live_gate_and_approval_strategy.md",
    ]:
        content = markdown_path.read_text()
        for marker in DOC_MARKERS:
            assert_true(marker in content, f"{markdown_path.name} lost marker {marker}")

    app = (APP_DIR / "src" / "App.tsx").read_text()
    for marker in APP_MARKERS:
        assert_true(marker in app, f"App lost marker {marker}")

    styles = (APP_DIR / "src" / "styles.css").read_text()
    for token in [
        "--canvas: #f6f7f9",
        "--primary: #155eef",
        "--secondary: #0e9384",
        "--delivery: #7a5af8",
        "--caution: #b54708",
        "--blocked: #c24141",
        "grid-template-columns: 280px minmax(0, 1fr) 360px",
        "max-width: 1440px",
        "min-height: 140px",
    ]:
        assert_true(token in styles, f"Styles lost required token {token}")

    service = (SERVICE_DIR / "src" / "server.js").read_text()
    for marker in SERVICE_MARKERS:
        assert_true(marker in service, f"Service lost marker {marker}")

    mesh_core = (SERVICE_DIR / "src" / "meshCore.js").read_text()
    for token in [
        "duplicate_delivery",
        "quarantine_attachment",
        "expired_pickup",
        "replay_guard",
        "proof_pending",
        "settled_or_recovered",
    ]:
        assert_true(token in mesh_core, f"meshCore.js lost scenario token {token}")

    dry_run = (BROWSER_AUTOMATION_DIR / "mesh-mailbox-dry-run.spec.js").read_text()
    for token in [
        "ALLOW_REAL_PROVIDER_MUTATION",
        "ALLOW_SPEND",
        "MESH_NAMED_APPROVER",
        "MESH_ENVIRONMENT_TARGET",
    ]:
        assert_true(token in dry_run, f"Dry-run harness lost env gate {token}")

    readme = (SERVICE_DIR / "README.md").read_text()
    assert_true("mock-mesh" in readme, "Service README drifted.")
    assert_true("127.0.0.1:4178" in readme, "Service README lost port contract.")

    app_readme = (APP_DIR / "README.md").read_text()
    assert_true("Signal_Post_Room" in app_readme, "App README lost visual mode.")
    assert_true("127.0.0.1:4179" in app_readme, "App README lost port contract.")

    print(
        json.dumps(
            {
                "task_id": pack["task_id"],
                "workflow_rows": len(workflow_rows),
                "route_rows": len(route_rows),
                "field_rows": len(field_map["fields"]),
                "live_gates": live_gates["summary"]["live_gate_count"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
