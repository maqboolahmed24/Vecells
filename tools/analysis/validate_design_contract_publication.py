#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from build_design_contract_publication import (
    BUNDLE_PATH,
    CATALOG_DOC_PATH,
    CONTRACTS_DIR,
    DESIGN_SYSTEM_EXPORTS_END,
    DESIGN_SYSTEM_EXPORTS_START,
    FRONTEND_MANIFEST_PATH,
    FRONTEND_PROFILE_PATH,
    LINT_RULES,
    LINT_RULES_PATH,
    PACKAGE_PACKAGE_JSON_PATH,
    PACKAGE_SOURCE_PATH,
    PACKAGE_TEST_PATH,
    PLAYWRIGHT_PACKAGE_PATH,
    ROOT_PACKAGE_PATH,
    SCHEMA_PATH,
    SOURCE_PRECEDENCE,
    SPEC_PATH,
    STRATEGY_DOC_PATH,
    STUDIO_PATH,
    STRUCTURAL_EVIDENCE_PATH,
    TASK_ID,
    TOKEN_ARTIFACT_PATH,
    VALIDATOR_PATH,
    VISUAL_MODE,
    VOCABULARY_MATRIX_PATH,
    build_schema,
)


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def ensure_deliverables() -> None:
    required = [
        BUNDLE_PATH,
        TOKEN_ARTIFACT_PATH,
        VOCABULARY_MATRIX_PATH,
        LINT_RULES_PATH,
        STRUCTURAL_EVIDENCE_PATH,
        STRATEGY_DOC_PATH,
        CATALOG_DOC_PATH,
        SPEC_PATH,
        SCHEMA_PATH,
        PACKAGE_SOURCE_PATH,
        PACKAGE_TEST_PATH,
        PACKAGE_PACKAGE_JSON_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        VALIDATOR_PATH,
        CONTRACTS_DIR,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_052 deliverables:\n" + "\n".join(missing))


def validate_required_shape(row: dict[str, Any], schema: dict[str, Any], label: str) -> None:
    for key in schema["required"]:
        assert_true(key in row, f"{label} lost required property {key}")
    for key, property_schema in schema["properties"].items():
        if key not in row:
            continue
        value = row[key]
        expected_type = property_schema.get("type")
        if expected_type == "string":
            assert_true(isinstance(value, str) and value != "", f"{label} property {key} must be a non-empty string")
        elif expected_type == "array":
            assert_true(isinstance(value, list), f"{label} property {key} must be an array")
            assert_true(len(value) >= property_schema.get("minItems", 0), f"{label} property {key} fell below minItems")
        if "enum" in property_schema:
            assert_true(value in property_schema["enum"], f"{label} property {key} drifted outside enum")


def validate_payloads() -> None:
    bundle_payload = read_json(BUNDLE_PATH)
    token_payload = read_json(TOKEN_ARTIFACT_PATH)
    lint_payload = read_json(LINT_RULES_PATH)
    vocabulary_rows = read_csv(VOCABULARY_MATRIX_PATH)
    structural_rows = read_csv(STRUCTURAL_EVIDENCE_PATH)
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    profile_payload = read_json(FRONTEND_PROFILE_PATH)
    schema = read_json(SCHEMA_PATH)

    assert_true(bundle_payload["task_id"] == TASK_ID, "Bundle payload task id drifted")
    assert_true(bundle_payload["visual_mode"] == VISUAL_MODE, "Bundle payload visual mode drifted")
    assert_true(bundle_payload["source_precedence"] == SOURCE_PRECEDENCE, "Source precedence drifted")
    assert_true(schema == build_schema(), "Design contract schema drifted from generator output")

    bundle_schema = schema["$defs"]["bundle"]
    lint_schema = schema["$defs"]["lintVerdict"]

    bundles = bundle_payload["designContractPublicationBundles"]
    lint_verdicts = lint_payload["designContractLintVerdicts"]

    assert_true(bundle_payload["summary"]["bundle_count"] == len(bundles), "Bundle count summary drifted")
    assert_true(bundle_payload["summary"]["published_bundle_count"] == len([row for row in bundles if row["publicationState"] == "published"]), "Published bundle count summary drifted")
    assert_true(bundle_payload["summary"]["route_family_count"] == len(vocabulary_rows), "Vocabulary row count summary drifted")
    assert_true(bundle_payload["summary"]["structural_snapshot_count"] == len(structural_rows), "Structural evidence count summary drifted")
    assert_true(lint_payload["summary"]["lint_rule_count"] == len(LINT_RULES), "Lint rule count summary drifted")
    assert_true(lint_payload["summary"]["lint_verdict_count"] == len(lint_verdicts), "Lint verdict count summary drifted")
    assert_true(lint_payload["summary"]["lint_pass_count"] == len([row for row in lint_verdicts if row["result"] == "pass"]), "Lint pass count summary drifted")

    frontend_manifests = frontend_payload["frontendContractManifests"]
    frontend_by_bundle = {
        row["designContractPublicationBundleRef"]: row for row in frontend_manifests
    }
    route_profile_map = {row["routeFamilyRef"]: row for row in profile_payload["routeProfiles"]}
    token_export_ids = {row["designTokenExportArtifactId"] for row in token_payload["designTokenExportArtifacts"]}
    visual_profile_ids = {row["visualTokenProfileId"] for row in token_payload["visualTokenProfiles"]}
    lint_ids = {row["designContractLintVerdictId"] for row in lint_verdicts}

    vocabulary_by_bundle: dict[str, list[dict[str, str]]] = {}
    for row in vocabulary_rows:
        vocabulary_by_bundle.setdefault(row["publication_bundle_id"], []).append(row)

    structural_by_bundle: dict[str, list[dict[str, str]]] = {}
    for row in structural_rows:
        structural_by_bundle.setdefault(row["design_contract_publication_bundle_id"], []).append(row)

    assert_true(len(frontend_manifests) == len(bundles), "Seq_052 bundle count must match seq_050 active manifests")
    assert_true(all(row["result"] == "pass" for row in lint_verdicts), "All seq_052 lint verdicts must pass")
    assert_true(all(row["publicationState"] == "published" for row in bundles), "All seq_052 bundles must be published")

    seen_routes: set[str] = set()
    for bundle in bundles:
        bundle_id = bundle["designContractPublicationBundleId"]
        validate_required_shape(bundle, bundle_schema, bundle_id)
        assert_true(bundle_id in frontend_by_bundle, f"{bundle_id} is missing from seq_050 manifest refs")
        manifest = frontend_by_bundle[bundle_id]
        assert_true(bundle["routeFamilyRefs"] == manifest["routeFamilyRefs"], f"{bundle_id} route family set drifted from seq_050")
        assert_true(bundle["designContractDigestRef"] == manifest["designContractDigestRef"], f"{bundle_id} design digest drifted from seq_050")
        assert_true(bundle["lintVerdictRef"] == manifest["designContractLintVerdictRef"], f"{bundle_id} lint ref drifted from seq_050")
        assert_true(bundle["designTokenExportArtifactRef"] in token_export_ids, f"{bundle_id} points at unknown token export artifact")
        assert_true(set(bundle["visualTokenProfileRefs"]).issubset(visual_profile_ids), f"{bundle_id} points at unknown visual token profiles")
        assert_true(bundle["lintVerdictRef"] in lint_ids, f"{bundle_id} points at unknown lint verdict")
        assert_true(bundle["defectState"] in {"clean", "watch"}, f"{bundle_id} defect state drifted outside expected values")
        assert_true(bundle_id in vocabulary_by_bundle, f"{bundle_id} lost vocabulary tuple rows")
        assert_true(bundle_id in structural_by_bundle, f"{bundle_id} lost structural evidence rows")
        assert_true(
            sorted(bundle["designContractVocabularyTupleRefs"])
            == sorted(row["design_contract_vocabulary_tuple_id"] for row in vocabulary_by_bundle[bundle_id]),
            f"{bundle_id} vocabulary tuple refs drifted from the CSV matrix",
        )
        assert_true(
            sorted(bundle["structuralSnapshotRefs"])
            == sorted(row["structural_snapshot_ref"] for row in structural_by_bundle[bundle_id]),
            f"{bundle_id} structural snapshot refs drifted from the CSV matrix",
        )
        for route_ref in bundle["routeFamilyRefs"]:
            assert_true(route_ref in route_profile_map, f"{bundle_id} points at unknown route profile {route_ref}")
            assert_true(route_ref not in seen_routes, f"Route family {route_ref} appears in multiple design bundles")
            seen_routes.add(route_ref)
            assert_true(
                route_profile_map[route_ref]["automationAnchorMapRef"] in bundle["automationAnchorMapRefs"],
                f"{bundle_id} lost automation anchor map for {route_ref}",
            )
            assert_true(
                route_profile_map[route_ref]["surfaceStateSemanticsProfileRef"] in bundle["surfaceStateSemanticsProfileRefs"],
                f"{bundle_id} lost surface semantics profile for {route_ref}",
            )
            assert_true(
                route_profile_map[route_ref]["surfaceStateKernelBindingRef"] in bundle["surfaceStateKernelBindingRefs"],
                f"{bundle_id} lost kernel binding for {route_ref}",
            )
            assert_true(
                route_profile_map[route_ref]["accessibilitySemanticCoverageProfileRef"]
                in bundle["accessibilitySemanticCoverageProfileRefs"],
                f"{bundle_id} lost accessibility coverage ref for {route_ref}",
            )

    for verdict in lint_verdicts:
        verdict_id = verdict["designContractLintVerdictId"]
        validate_required_shape(verdict, lint_schema, verdict_id)
        assert_true(verdict["designContractPublicationBundleRef"] in frontend_by_bundle, f"{verdict_id} points at unknown bundle")

    assert_true(
        len(token_payload["designTokenExportArtifacts"]) == bundle_payload["summary"]["token_export_artifact_count"],
        "Token export summary drifted",
    )
    assert_true(
        len(token_payload["visualTokenProfiles"]) == bundle_payload["summary"]["visual_token_profile_count"],
        "Visual token profile summary drifted",
    )
    assert_true(
        len(token_payload["tokenKernelLayeringPolicies"]) == 1,
        "Seq_052 must publish exactly one token kernel layering policy",
    )
    assert_true(
        len(token_payload["modeTupleCoverages"]) == 1,
        "Seq_052 must publish exactly one mode tuple coverage row",
    )
    assert_true(
        all(row["evidence_state"] == "exact" for row in structural_rows),
        "Structural evidence rows must remain exact in seq_052 baseline",
    )


def validate_repo_wiring() -> None:
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    design_package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    source = PACKAGE_SOURCE_PATH.read_text()
    package_test = PACKAGE_TEST_PATH.read_text()
    strategy_doc = STRATEGY_DOC_PATH.read_text()
    catalog_doc = CATALOG_DOC_PATH.read_text()
    spec_text = SPEC_PATH.read_text()
    studio_text = Path(STUDIO_PATH).read_text()

    scripts = root_package.get("scripts", {})
    assert_true(
        "build_design_contract_publication.py" in scripts.get("codegen", ""),
        "Root codegen script no longer runs seq_052",
    )
    assert_true(
        "validate:design-publication" in scripts
        and "validate_design_contract_publication.py" in scripts["validate:design-publication"],
        "Root package lost the design publication validator script",
    )
    assert_true(
        "design-contract-studio.spec.js" in playwright_package["scripts"]["e2e"],
        "Playwright workspace lost the design contract studio e2e script",
    )
    assert_true(
        "./contracts/design-contract-publication.schema.json" in design_package.get("exports", {}),
        "Design system package lost the seq_052 schema export",
    )
    assert_true(DESIGN_SYSTEM_EXPORTS_START in source and DESIGN_SYSTEM_EXPORTS_END in source, "Design system source lost seq_052 export markers")
    assert_true("designContractPublicationCatalog" in source, "Design system source lost the seq_052 publication catalog")
    assert_true("designContractPublicationCatalog.taskId" in package_test, "Design system public API test lost seq_052 assertions")
    assert_true("# 52 Design Contract Publication Strategy" in strategy_doc, "Strategy doc marker missing")
    assert_true("# 52 Design Contract Bundle Catalog" in catalog_doc, "Catalog doc marker missing")
    for marker in [
        'data-testid="studio-masthead"',
        'data-testid="bundle-rail"',
        'data-testid="constellation-canvas"',
        'data-testid="lint-rail"',
        'data-testid="vocabulary-matrix"',
        'data-testid="inspector"',
        "prefers-reduced-motion: reduce",
    ]:
        assert_true(marker in studio_text, f"Studio lost marker {marker}")
    for marker in [
        "audience filtering",
        "bundle selection",
        "lint-state visibility",
        "matrix parity",
        "keyboard navigation",
        "reduced motion",
        "stable contract digest markers",
        "filter-audience",
        "ArrowDown",
    ]:
        assert_true(marker in spec_text, f"Spec lost marker {marker}")


def main() -> None:
    ensure_deliverables()
    validate_payloads()
    validate_repo_wiring()
    print("seq_052 design contract publication artifacts validated.")


if __name__ == "__main__":
    main()
