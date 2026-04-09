#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "external"
APP_DIR = ROOT / "apps" / "mock-nhs-app-site-link-studio"
INFRA_DIR = ROOT / "infra" / "site-links"


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def load_json(path: Path):
    return json.loads(path.read_text())


def load_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(path: Path) -> Path:
    assert_true(path.exists(), f"Missing required seq_030 output: {path}")
    return path


def validate_pack() -> None:
    allowlist_csv = require(DATA_DIR / "site_link_route_allowlist.csv")
    env_matrix_json = require(DATA_DIR / "site_link_environment_matrix.json")
    placeholders_json = require(DATA_DIR / "site_link_placeholder_values.json")

    require(DOCS_DIR / "30_site_link_placeholder_strategy.md")
    require(DOCS_DIR / "30_assetlinks_and_aasa_generation_spec.md")
    require(DOCS_DIR / "30_route_path_allowlist_and_return_rules.md")
    require(DOCS_DIR / "30_real_registration_and_hosting_strategy.md")

    require(INFRA_DIR / "assetlinks.template.json")
    require(INFRA_DIR / "apple-app-site-association.template.json")

    require(APP_DIR / "README.md")
    require(APP_DIR / "src" / "generated" / "siteLinkPack.ts")
    require(APP_DIR / "public" / "site-link-environment-matrix.json")
    require(APP_DIR / "public" / ".well-known" / "assetlinks.json")
    require(APP_DIR / "public" / ".well-known" / "apple-app-site-association")

    rows = load_csv(allowlist_csv)
    pack = load_json(env_matrix_json)
    placeholders = load_json(placeholders_json)
    local_assetlinks = load_json(APP_DIR / "public" / ".well-known" / "assetlinks.json")
    local_aasa = load_json(APP_DIR / "public" / ".well-known" / "apple-app-site-association")

    assert_true(pack["task_id"] == "seq_030", "Unexpected task_id in seq_030 pack")
    assert_true(pack["visual_mode"] == "Linkloom_Metadata_Studio", "Unexpected visual mode")
    assert_true(pack["summary"]["route_count"] >= 14, "Expected at least 14 allowlist rows")
    assert_true(pack["summary"]["rejected_count"] >= 2, "Expected explicit rejected rows")
    assert_true(pack["summary"]["environment_count"] == 4, "Expected four environment variants")
    assert_true(pack["summary"]["live_gate_count"] >= 8, "Expected at least eight live gates")

    required_columns = {
        "path_id",
        "allowlist_decision",
        "route_family_ref",
        "path_pattern",
        "patient_visible_purpose",
        "embedded_safe",
        "requires_outbound_navigation_grant",
        "requires_authenticated_session",
        "allows_secure_link_entry",
        "allows_from_nhs_app_query_marker",
        "placeholder_in_mock",
        "real_registration_gate_refs",
        "notes",
    }
    assert_true(required_columns.issubset(rows[0].keys()), "Allowlist CSV is missing required columns")

    decisions = {row["allowlist_decision"] for row in rows}
    assert_true(decisions == {"approved", "conditional", "rejected"}, "Allowlist decisions must include approved, conditional, and rejected")

    route_ids = {row["route_family_ref"] for row in rows}
    assert_true(
        {
            "rf_intake_self_service",
            "rf_patient_secure_link_recovery",
            "rf_patient_requests",
            "rf_patient_appointments",
            "rf_patient_health_record",
            "rf_patient_messages",
        }.issubset(route_ids),
        "Allowlist rows must cover the required patient route families",
    )

    row_map = {row["path_id"]: row for row in rows}
    assert_true(row_map["sl_raw_document_download"]["allowlist_decision"] == "rejected", "Raw document download path must stay rejected")
    assert_true(row_map["sl_detached_message_alias"]["placeholder_in_mock"] == "no", "Detached message alias cannot appear in mock metadata")
    assert_true(row_map["sl_secure_recovery"]["allows_secure_link_entry"] == "yes", "Secure recovery must remain the secure-link entry path")

    env_ids = {env["env_id"] for env in pack["environment_profiles"]}
    assert_true(env_ids == {"local_mock", "sandpit_like", "aos_like", "live_placeholder"}, "Unexpected environment ids")
    for env in pack["environment_profiles"]:
        assert_true(env["official_values_supplied"] is False, f"{env['env_id']} should remain placeholder-only")

    gate_rows = pack["live_gate_pack"]["live_gates"]
    blocked_gate_ids = {row["gate_id"] for row in gate_rows if row["status"] == "blocked"}
    assert_true("LIVE_GATE_ENVIRONMENT_VALUES_SUPPLIED" in blocked_gate_ids, "Environment values gate must stay blocked")
    assert_true("LIVE_GATE_MUTATION_FLAG_ENABLED" in blocked_gate_ids, "Mutation flag gate must stay blocked")
    assert_true(pack["live_gate_pack"]["verdict"] == "blocked", "seq_030 live path must remain blocked")

    assert_true(placeholders["task_id"] == "seq_030", "Placeholder registry drifted")
    assert_true("ANDROID_PACKAGE_NAME" in placeholders["template_tokens"], "Missing Android package template token")
    assert_true("IOS_APP_ID" in placeholders["template_tokens"], "Missing iOS appID template token")

    local_details = local_aasa["applinks"]["details"][0]
    assert_true(local_details["appID"] == "__NHS_APP_IOS_APP_ID_LOCAL_MOCK__", "Local hosted AASA should stay placeholder-only")
    assert_true("/requests/*" in local_details["paths"], "Local hosted AASA must include request paths")
    assert_true("/records/documents/*" in local_details["paths"], "Local hosted AASA must include record document paths")

    asset_target = local_assetlinks[0]["target"]
    assert_true(asset_target["package_name"] == "__NHS_APP_ANDROID_PACKAGE_LOCAL_MOCK__", "Local hosted assetlinks should stay placeholder-only")
    assert_true(
        asset_target["sha256_cert_fingerprints"] == ["__NHS_APP_ANDROID_SHA256_LOCAL_MOCK__"],
        "Local hosted assetlinks fingerprint drifted",
    )

    print(
        json.dumps(
            {
                "task_id": pack["task_id"],
                "route_count": pack["summary"]["route_count"],
                "environment_count": pack["summary"]["environment_count"],
                "rejected_count": pack["summary"]["rejected_count"],
                "live_gate_count": len(gate_rows),
                "verdict": pack["live_gate_pack"]["verdict"],
            }
        )
    )


if __name__ == "__main__":
    validate_pack()
