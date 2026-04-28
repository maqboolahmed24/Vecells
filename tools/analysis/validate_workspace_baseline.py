#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from build_workspace_baseline import (
    ATLAS_HTML_PATH,
    ATLAS_MARKERS,
    BOUNDARY_DOC_PATH,
    BUILD_DECISION_DOC_PATH,
    BUILD_SCORECARD_PATH,
    CODEGEN_DOC_PATH,
    CODEGEN_MATRIX_PATH,
    CODEOWNERS_PATH,
    DX_DOC_PATH,
    IMPORT_RULES_PATH,
    LANGUAGE_DOC_PATH,
    LANGUAGE_MATRIX_PATH,
    SOURCE_PRECEDENCE,
    TESTING_DOC_PATH,
    TEST_TOOLING_PATH,
    WORKSPACE_GRAPH_PATH,
    WORKSPACE_LAYOUT_DOC_PATH,
    build_bundle,
    ensure_prerequisites,
    load_csv,
    load_json,
)


DELIVERABLES = [
    BUILD_SCORECARD_PATH,
    LANGUAGE_MATRIX_PATH,
    WORKSPACE_GRAPH_PATH,
    IMPORT_RULES_PATH,
    CODEOWNERS_PATH,
    CODEGEN_MATRIX_PATH,
    TEST_TOOLING_PATH,
    BUILD_DECISION_DOC_PATH,
    WORKSPACE_LAYOUT_DOC_PATH,
    LANGUAGE_DOC_PATH,
    CODEGEN_DOC_PATH,
    TESTING_DOC_PATH,
    DX_DOC_PATH,
    BOUNDARY_DOC_PATH,
    ATLAS_HTML_PATH,
]


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def canonicalize(value):
    return json.loads(json.dumps(value))


def load_text(path: Path) -> str:
    assert_true(path.exists(), f"Missing text artifact: {path}")
    return path.read_text()


def validate_deliverables() -> None:
    for path in DELIVERABLES:
        assert_true(path.exists(), f"Missing seq_012 deliverable: {path}")


def validate_payload(payload: dict[str, object], expected_payload: dict[str, object]) -> None:
    assert_true(payload["workspace_baseline_id"] == "vecells_workspace_baseline_v1", "Unexpected workspace_baseline_id.")
    assert_true(payload["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted.")
    assert_true(payload["upstream_inputs"] == ensure_prerequisites(), "Upstream prerequisite summary drifted.")
    assert_true(canonicalize(payload) == canonicalize(expected_payload), "Generated workspace payload drifted from build output.")

    summary = payload["summary"]
    nodes = payload["workspace_packages"]
    edges = payload["import_edges"]
    codegen_flows = payload["contract_codegen_flows"]
    rules = payload["import_boundary_rules"]["rules"]
    owners = payload["owner_domains"]

    assert_true(summary["unresolved_gap_count"] == 0, "Unexpected workspace gaps present.")
    assert_true(summary["app_count"] == 8, "Unexpected app count.")
    assert_true(summary["baseline_app_count"] == 7, "Unexpected baseline app count.")
    assert_true(summary["service_count"] == 8, "Unexpected service count.")
    assert_true(summary["generated_contract_set_count"] == len(codegen_flows), "Generated contract set count mismatch.")
    assert_true(summary["illegal_edge_count"] == len([edge for edge in edges if edge["violation_state"] == "forbidden"]), "Illegal edge summary mismatch.")
    assert_true(payload["chosen_build_system"]["option_id"] == "OPT_PNPM_NX", "Build-system choice drifted.")
    assert_true(payload["chosen_language_posture"]["posture_id"] == "LANG_TS_RUNTIME_PY_TOOLING", "Language posture choice drifted.")

    owner_ids = {owner["owner_domain_id"] for owner in owners}
    node_ids = {node["package_id"] for node in nodes}
    rule_ids = {rule["rule_id"] for rule in rules}

    assert_true(len(node_ids) == len(nodes), "Package ids are not unique.")
    assert_true(len(owners) == summary["owner_domain_count"], "Owner-domain summary mismatch.")
    assert_true(len(rule_ids) == summary["boundary_rule_count"], "Boundary-rule summary mismatch.")
    assert_true("RULE_NO_REMOTE_ASSETS_OR_SOURCE_SECRETS" in rule_ids, "Remote-asset / secrets rule missing.")

    for node in nodes:
        assert_true(node["owner_domain_id"] in owner_ids, f"Unknown owner domain: {node['package_id']}")
        assert_true(node["package_tag_class"], f"Missing package_tag_class: {node['package_id']}")
        assert_true(node["bounded_context_ref"], f"Missing bounded_context_ref: {node['package_id']}")
        assert_true(node["public_entrypoints"], f"Missing public entrypoints: {node['package_id']}")
        assert_true(node["source_refs"], f"Missing source refs: {node['package_id']}")
        if node["primary_language"] == "Python":
            assert_true(node["path"].startswith("tools/"), f"Python escaped tooling boundary: {node['package_id']}")
        if node["package_tag_class"] == "app_shell":
            assert_true(node["truth_role"] == "shell_projection_only", f"App owns truth illegally: {node['package_id']}")
            if node["workspace_status"] == "baseline_required":
                assert_true(len(node["surface_refs"]) > 0, f"Baseline app missing surface coverage: {node['package_id']}")
        if node["package_tag_class"] == "domain_context":
            assert_true(node["truth_role"] == "domain_truth_boundary", f"Domain package truth role drifted: {node['package_id']}")
            assert_true(node["primary_language"] == "TypeScript", f"Domain package language drifted: {node['package_id']}")
        if node["package_tag_class"] == "generated_contract_package":
            assert_true(node["truth_role"] == "generated_derivative_only", f"Generated package truth role drifted: {node['package_id']}")
            assert_true(node["path"].startswith("packages/generated/"), f"Generated package moved outside packages/generated: {node['package_id']}")
        if node["package_tag_class"] == "delivery_control_artifact":
            assert_true(node["primary_language"] in {"YAML", "Markdown"}, f"Unexpected delivery-control language: {node['package_id']}")

    conditional_apps = [node for node in nodes if node["package_tag_class"] == "app_shell" and node["workspace_status"] != "baseline_required"]
    assert_true(len(conditional_apps) == 1 and conditional_apps[0]["package_id"] == "app_assistive_control", "Conditional app posture drifted.")

    edge_pairs = {(edge["from_package_id"], edge["to_package_id"], edge["violation_state"]) for edge in edges}
    assert_true(("app_patient_web", "pkg_dom_booking", "forbidden") in edge_pairs, "Expected forbidden app->domain edge missing.")
    assert_true(("svc_api_gateway", "pkg_api_contracts", "allowed") in edge_pairs, "Expected gateway contract edge missing.")
    assert_true(("pkg_design_contracts", "pkg_design_system", "allowed") in edge_pairs, "Expected design-system edge missing.")
    assert_true(("tool_codegen", "pkg_api_contracts", "allowed") in edge_pairs, "Expected codegen source edge missing.")

    for edge in edges:
        assert_true(edge["from_package_id"] in node_ids, f"Edge source missing: {edge['edge_id']}")
        assert_true(edge["to_package_id"] in node_ids, f"Edge target missing: {edge['edge_id']}")
        assert_true(edge["rule_ref"] in rule_ids, f"Edge references unknown rule: {edge['edge_id']}")
        assert_true(edge["source_refs"], f"Edge missing source refs: {edge['edge_id']}")

    classes_by_id = {node["package_id"]: node["package_tag_class"] for node in nodes}
    for edge in edges:
        source_class = classes_by_id[edge["from_package_id"]]
        target_class = classes_by_id[edge["to_package_id"]]
        if edge["violation_state"] == "allowed":
            if source_class == "app_shell":
                assert_true(
                    target_class in {"contract_package", "design_contract_package", "platform_shared_package", "generated_contract_package"},
                    f"App allowed edge violates shell boundary law: {edge['edge_id']}",
                )
            if source_class == "service_gateway":
                assert_true(
                    target_class in {"contract_package", "platform_shared_package", "generated_contract_package"},
                    f"Gateway allowed edge violates boundary law: {edge['edge_id']}",
                )
            if source_class == "domain_context":
                assert_true(
                    target_class in {"contract_package", "platform_shared_package"},
                    f"Domain allowed edge violates sibling isolation: {edge['edge_id']}",
                )
        else:
            if source_class == "tooling_package":
                assert_true(target_class != "tooling_package" or edge["to_package_id"] != "tool_analysis", f"Unexpected tooling violation example: {edge['edge_id']}")

    flow_ids = {row["codegen_flow_id"] for row in codegen_flows}
    assert_true(len(flow_ids) == 6, "Unexpected codegen flow count.")
    generated_ids = {row["generated_package_id"] for row in codegen_flows if row["generated_package_id"]}
    assert_true(generated_ids == {"pkg_gen_api_clients", "pkg_gen_live_channel_clients", "pkg_gen_event_bindings", "pkg_gen_design_contract_bindings", "pkg_gen_migration_fixtures"}, "Generated package mapping drifted.")
    for row in codegen_flows:
        assert_true(row["source_package_id"] in node_ids, f"Codegen flow references missing source package: {row['codegen_flow_id']}")
        if row["generated_package_id"]:
            assert_true(row["generated_package_id"] in node_ids, f"Codegen flow references missing generated package: {row['codegen_flow_id']}")
        assert_true(row["drift_gate"], f"Codegen flow missing drift gate: {row['codegen_flow_id']}")
        assert_true(row["publication_artifact"], f"Codegen flow missing publication artifact: {row['codegen_flow_id']}")


def validate_csv_and_json_outputs(payload: dict[str, object]) -> None:
    build_scorecard = load_csv(BUILD_SCORECARD_PATH)
    language_matrix = load_csv(LANGUAGE_MATRIX_PATH)
    codeowners = load_csv(CODEOWNERS_PATH)
    codegen = load_csv(CODEGEN_MATRIX_PATH)
    tests = load_csv(TEST_TOOLING_PATH)
    import_rules = load_json(IMPORT_RULES_PATH)

    assert_true(len(build_scorecard) == len(payload["build_system_scorecard"]), "Build scorecard row count mismatch.")
    assert_true(len(language_matrix) == len(payload["language_posture_scorecard"]), "Language matrix row count mismatch.")
    assert_true(len(codeowners) == len(payload["workspace_packages"]), "CODEOWNERS row count mismatch.")
    assert_true(len(codegen) == len(payload["contract_codegen_flows"]), "Codegen matrix row count mismatch.")
    assert_true(len(tests) == len(payload["test_tooling_matrix"]), "Test tooling matrix row count mismatch.")
    assert_true(canonicalize(import_rules) == canonicalize(payload["import_boundary_rules"]), "Import rule JSON drifted.")

    chosen_build = [row for row in build_scorecard if row["decision"] == "chosen"]
    assert_true(len(chosen_build) == 1 and chosen_build[0]["option_id"] == "OPT_PNPM_NX", "Chosen build scorecard row drifted.")
    chosen_language = [row for row in language_matrix if row["decision"] == "chosen"]
    assert_true(len(chosen_language) == 1 and chosen_language[0]["posture_id"] == "LANG_TS_RUNTIME_PY_TOOLING", "Chosen language row drifted.")

    for row in codeowners:
        assert_true(row["owner_domain_id"], f"CODEOWNERS row missing owner: {row['path']}")
        assert_true(row["package_tag_class"], f"CODEOWNERS row missing package class: {row['path']}")
        assert_true(row["approval_policy"] == "mandatory_owner_review", f"CODEOWNERS approval policy drifted: {row['path']}")

    for row in tests:
        if row["coverage_kind"] == "shell-level end-to-end":
            assert_true(row["primary_toolchain"] == "Playwright", "Playwright row drifted.")


def validate_docs_and_atlas(payload: dict[str, object]) -> None:
    docs = [
        BUILD_DECISION_DOC_PATH,
        WORKSPACE_LAYOUT_DOC_PATH,
        LANGUAGE_DOC_PATH,
        CODEGEN_DOC_PATH,
        TESTING_DOC_PATH,
        DX_DOC_PATH,
        BOUNDARY_DOC_PATH,
    ]
    for path in docs:
        text = load_text(path)
        assert_true(text.startswith("# "), f"Documentation file missing heading: {path}")
        assert_true("Vecells" in text or "workspace" in text.lower() or "contract" in text.lower(), f"Documentation file looks empty: {path}")

    html_text = load_text(ATLAS_HTML_PATH)
    for marker in ATLAS_MARKERS:
        assert_true(marker in html_text, f"Missing atlas marker: {marker}")
    assert_true("__EMBEDDED_JSON__" not in html_text, "Atlas still contains unresolved JSON placeholder.")
    assert_true("Vecells Workspace Graph Atlas" in html_text, "Atlas title missing.")
    assert_true(payload["workspace_baseline_id"] in html_text, "Atlas does not embed the payload.")
    assert_true('data-selected-package' in html_text, "Atlas missing selected-package DOM marker.")
    assert_true('data-selected-owner' in html_text, "Atlas missing selected-owner DOM marker.")
    assert_true('data-selected-language' in html_text, "Atlas missing selected-language DOM marker.")
    assert_true('data-selected-edge-class' in html_text, "Atlas missing selected-edge-class DOM marker.")
    assert_true('data-selected-violation-state' in html_text, "Atlas missing selected-violation-state DOM marker.")
    forbidden_asset_markers = [
        'src="http://',
        'src="https://',
        'href="http://',
        'href="https://',
        "url(http://",
        "url(https://",
    ]
    assert_true(not any(marker in html_text for marker in forbidden_asset_markers), "Atlas references remote assets.")


def main() -> None:
    validate_deliverables()
    payload = load_json(WORKSPACE_GRAPH_PATH)
    expected_payload = build_bundle()
    validate_payload(payload, expected_payload)
    validate_csv_and_json_outputs(payload)
    validate_docs_and_atlas(payload)


if __name__ == "__main__":
    main()
