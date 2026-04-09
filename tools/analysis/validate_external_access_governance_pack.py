#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"

REQUIRED_INPUTS = {
    "integration_priority_matrix": DATA_DIR / "integration_priority_matrix.json",
    "mock_live_lane_assignments": DATA_DIR / "mock_live_lane_assignments.json",
    "provider_family_scorecards": DATA_DIR / "provider_family_scorecards.json",
    "runtime_workload_families": DATA_DIR / "runtime_workload_families.json",
    "master_risk_register": DATA_DIR / "master_risk_register.json",
    "phase0_gate_verdict": DATA_DIR / "phase0_gate_verdict.json",
    "coverage_summary": DATA_DIR / "coverage_summary.json",
}

DELIVERABLES = [
    DOCS_DIR / "23_sandbox_account_strategy.md",
    DOCS_DIR / "23_secret_ownership_and_rotation_model.md",
    DOCS_DIR / "23_mock_account_bootstrap_plan.md",
    DOCS_DIR / "23_actual_partner_account_governance.md",
    DOCS_DIR / "23_credential_ingest_and_redaction_runbook.md",
    DOCS_DIR / "23_external_access_governance_cockpit.html",
    DATA_DIR / "external_account_inventory.csv",
    DATA_DIR / "secret_classification_matrix.csv",
    DATA_DIR / "secret_ownership_map.json",
    DATA_DIR / "mock_account_seed_plan.json",
    DATA_DIR / "credential_capture_checklist.csv",
]

MANDATORY_FAMILIES = {
    "identity_auth",
    "patient_data_enrichment",
    "telephony",
    "transcription",
    "sms",
    "email",
    "malware_scanning",
    "gp_system",
    "booking_supplier",
    "network_capacity",
    "messaging_transport",
    "pharmacy_directory",
    "pharmacy_transport",
    "pharmacy_outcome",
    "embedded_channel",
    "model_vendor",
}

MANDATORY_RECORD_CLASSES = {
    "account",
    "test_user",
    "service_principal",
    "client_registration",
    "client_secret",
    "private_key",
    "public_key",
    "webhook_secret",
    "mailbox_credential",
    "phone_number",
    "sender_identity",
    "sandbox_dataset",
    "other",
}

HTML_MARKERS = [
    'data-testid="access-gov-shell"',
    'data-testid="access-posture-banner"',
    'data-testid="access-family-filter"',
    'data-testid="access-environment-filter"',
    'data-testid="access-inventory-table"',
    'data-testid="secret-class-matrix"',
    'data-testid="rotation-schedule-strip"',
    'data-testid="access-inspector"',
    'data-testid="credential-flow-diagram"',
    'data-testid="credential-flow-parity-table"',
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
    assert_true(not missing, "Missing seq_023 prerequisites: " + ", ".join(sorted(missing)))
    return {name: load_json(path) for name, path in REQUIRED_INPUTS.items()}


def ensure_deliverables() -> None:
    missing = [str(path) for path in DELIVERABLES if not path.exists()]
    assert_true(not missing, "Missing seq_023 deliverables:\n" + "\n".join(missing))


def validate_payload(prereqs: dict[str, Any]) -> None:
    inventory = load_csv(DATA_DIR / "external_account_inventory.csv")
    classifications = load_csv(DATA_DIR / "secret_classification_matrix.csv")
    ownership = load_json(DATA_DIR / "secret_ownership_map.json")
    seed_plan = load_json(DATA_DIR / "mock_account_seed_plan.json")
    capture_checklist = load_csv(DATA_DIR / "credential_capture_checklist.csv")
    html = (DOCS_DIR / "23_external_access_governance_cockpit.html").read_text()

    assert_true(ownership["visual_mode"] == "Credential_Observatory", "Visual mode drifted")
    assert_true(ownership["summary"]["phase0_entry_verdict"] == "withheld", "Phase 0 verdict drifted")
    assert_true(prereqs["phase0_gate_verdict"]["gate_verdicts"][0]["verdict"] == "withheld", "Upstream seq_020 verdict drifted")
    assert_true(prereqs["integration_priority_matrix"]["summary"]["integration_family_count"] == 15, "Seq_021 prerequisite drifted")
    assert_true(prereqs["provider_family_scorecards"]["summary"]["provider_family_count"] == 8, "Seq_022 prerequisite drifted")
    assert_true(prereqs["coverage_summary"]["summary"]["requirements_with_gaps_count"] == 0, "Traceability gaps reopened")

    assert_true(len(inventory) == ownership["summary"]["inventory_row_count"], "Inventory CSV row count drifted")
    assert_true(len(classifications) == len(ownership["secret_classification_matrix"]) == 14, "Classification row count drifted")
    assert_true(len(capture_checklist) == ownership["summary"]["actual_later_count"] + ownership["summary"]["hybrid_count"], "Capture checklist no longer covers all non-mock rows")

    family_ids = {row["dependency_family"] for row in inventory}
    assert_true(family_ids == MANDATORY_FAMILIES, "Mandatory dependency families are missing or extra")
    record_classes = {row["record_class"] for row in inventory}
    assert_true(MANDATORY_RECORD_CLASSES.issubset(record_classes), "Mandatory record classes are missing")

    assert_true(ownership["summary"]["inventory_row_count"] >= 60, "Inventory unexpectedly shrank below the expected coverage floor")
    assert_true(ownership["summary"]["mock_now_count"] >= 25, "Mock coverage unexpectedly shrank")
    assert_true(ownership["summary"]["actual_later_count"] >= 25, "Actual-later coverage unexpectedly shrank")
    assert_true(ownership["summary"]["dual_control_count"] >= 20, "Dual-control coverage unexpectedly shrank")
    assert_true(ownership["summary"]["manual_checkpoint_count"] >= 25, "Manual-checkpoint coverage unexpectedly shrank")
    assert_true(ownership["summary"]["missing_owner_count"] == 0, "Missing owner rows appeared")

    ids = set()
    for row in inventory:
        assert_true(row["account_or_secret_id"] not in ids, f"Duplicate inventory id {row['account_or_secret_id']}")
        ids.add(row["account_or_secret_id"])
        assert_true(row["owner_role"], f"{row['account_or_secret_id']} missing owner_role")
        assert_true(row["backup_owner_role"], f"{row['account_or_secret_id']} missing backup_owner_role")
        assert_true(row["creator_role"], f"{row['account_or_secret_id']} missing creator_role")
        assert_true(row["approver_role"], f"{row['account_or_secret_id']} missing approver_role")
        assert_true(row["storage_backend"], f"{row['account_or_secret_id']} missing storage backend")
        assert_true(row["distribution_method"], f"{row['account_or_secret_id']} missing distribution method")
        assert_true(row["rotation_policy"], f"{row['account_or_secret_id']} missing rotation policy")
        assert_true(row["revocation_policy"], f"{row['account_or_secret_id']} missing revocation policy")
        assert_true(row["audit_sink"], f"{row['account_or_secret_id']} missing audit sink")
        assert_true(row["exposure_constraints"], f"{row['account_or_secret_id']} missing exposure constraints")
        assert_true(row["allowed_usage_surfaces"], f"{row['account_or_secret_id']} missing usage surfaces")
        if row["current_lane"] == "mock_now":
            assert_true(row["manual_checkpoint_required"] == "no", f"{row['account_or_secret_id']} mock row unexpectedly requires manual checkpoint")
            assert_true(
                row["storage_backend"] in {"local_ephemeral_secret_store", "ci_ephemeral_secret_store", "shared_nonprod_fixture_registry", "shared_nonprod_vault", "nonprod_hsm_keyring"},
                f"{row['account_or_secret_id']} mock row uses a live backend",
            )
        else:
            assert_true(row["manual_checkpoint_required"] == "yes", f"{row['account_or_secret_id']} live or hybrid row lost manual checkpoint")
            assert_true(row["live_gate_refs"], f"{row['account_or_secret_id']} live or hybrid row missing gate refs")
        if row["environment"] == "production" and row["record_class"] in {"client_secret", "private_key", "service_principal", "webhook_secret", "mailbox_credential", "phone_number", "sender_identity"}:
            assert_true(row["dual_control_required"] == "yes", f"{row['account_or_secret_id']} production row lost dual control")

    def row(row_id: str) -> dict[str, str]:
        return next(item for item in inventory if item["account_or_secret_id"] == row_id)

    assert_true(row("ACC_NHS_LOGIN_LOCAL_CLIENT_REG")["current_lane"] == "mock_now", "Local NHS login client registry lost mock lane")
    assert_true(row("SEC_NHS_LOGIN_PRODUCTION_CLIENT_SECRET")["environment"] == "production", "Production NHS login client secret drifted")
    assert_true(row("SEC_NHS_LOGIN_PRODUCTION_CLIENT_SECRET")["dual_control_required"] == "yes", "Production NHS login secret lost dual-control requirement")
    assert_true(row("ACC_PRACTICE_ACK_INTEGRATION_MAILBOX")["record_class"] == "mailbox_credential", "Practice acknowledgement mailbox row drifted")
    assert_true(row("ACC_NETWORK_FEED_INTEGRATION_PRINCIPAL")["dependency_family"] == "network_capacity", "Network feed row drifted")
    assert_true(row("ACC_NHS_APP_SANDPIT_SITE_LINK")["dependency_family"] == "embedded_channel", "Deferred NHS App placeholder row drifted")
    assert_true(row("SEC_ASSISTIVE_PREPROD_VENDOR_KEY")["dependency_family"] == "model_vendor", "Assistive placeholder row drifted")
    assert_true(row("ACC_SMS_INTEGRATION_PROJECT")["dependency_family"] == "sms", "SMS project row drifted")
    assert_true(row("ACC_SMS_INTEGRATION_PROJECT")["current_lane"] == "actual_later", "SMS project row lost actual-later posture")
    assert_true(row("ACC_EMAIL_LOCAL_SIM_PRINCIPAL")["current_lane"] == "mock_now", "Email simulator row lost mock posture")
    assert_true(row("KEY_MESH_PRODUCTION_TRANSPORT_CERT")["dual_control_required"] == "yes", "Production MESH key lost dual control")

    classification_index = {entry["record_class"]: entry for entry in classifications}
    assert_true(classification_index["client_secret"]["secret_presence"] == "yes", "Client secret classification drifted")
    assert_true(classification_index["client_registration"]["secret_presence"] == "no", "Client registration classification drifted")
    assert_true(classification_index["phone_number"]["production_allowed"] == "yes", "Phone number classification drifted")
    assert_true(classification_index["sandbox_dataset"]["production_allowed"] == "no", "Sandbox dataset classification drifted")

    assert_true(seed_plan["summary"]["seed_family_count"] >= 10, "Seed plan family coverage shrank")
    assert_true(seed_plan["summary"]["local_mock_rows"] > 0, "Seed plan lost local mock coverage")
    assert_true(seed_plan["summary"]["ci_mock_rows"] > 0, "Seed plan lost CI mock coverage")
    assert_true(seed_plan["summary"]["shared_dev_rows"] > 0, "Seed plan lost shared-dev coverage")

    risks = {risk["risk_id"] for risk in prereqs["master_risk_register"]["risks"]}
    for item in ownership["account_inventory"]:
        for risk_id in item["risk_refs"]:
            assert_true(risk_id in risks, f"Unknown risk ref {risk_id} on {item['account_or_secret_id']}")

    md_strategy = (DOCS_DIR / "23_sandbox_account_strategy.md").read_text()
    md_rotation = (DOCS_DIR / "23_secret_ownership_and_rotation_model.md").read_text()
    md_mock = (DOCS_DIR / "23_mock_account_bootstrap_plan.md").read_text()
    md_governance = (DOCS_DIR / "23_actual_partner_account_governance.md").read_text()
    md_runbook = (DOCS_DIR / "23_credential_ingest_and_redaction_runbook.md").read_text()

    for content, label in [
        (md_strategy, "strategy"),
        (md_mock, "mock"),
        (md_governance, "governance"),
        (md_runbook, "runbook"),
    ]:
        assert_true("Section A — `Mock_now_execution`" in content, f"{label} markdown lost Section A label")
        assert_true("Section B — `Actual_provider_strategy_later`" in content, f"{label} markdown lost Section B label")

    assert_true("Rotation law:" in md_rotation, "Rotation markdown lost rotation law section")
    assert_true("Browser-automation redaction law:" in md_runbook, "Runbook lost browser redaction section")
    assert_true("dual-control" in md_strategy.lower(), "Strategy markdown lost dual-control emphasis")

    for marker in HTML_MARKERS:
        assert_true(marker in html, f"HTML missing marker {marker}")
    assert_true("Credential_Observatory" in html, "Cockpit HTML lost visual mode label")
    assert_true("@media (prefers-reduced-motion: reduce)" in html, "Cockpit HTML lacks reduced-motion support")
    remote_asset_tokens = ['src="http://', 'src="https://', "src='http://", "src='https://", 'href="http://', 'href="https://', "href='http://", "href='https://", "url(http://", "url(https://"]
    assert_true(not any(token in html for token in remote_asset_tokens), "Cockpit HTML pulls remote assets")


def main() -> None:
    prereqs = ensure_inputs()
    ensure_deliverables()
    validate_payload(prereqs)


if __name__ == "__main__":
    main()
