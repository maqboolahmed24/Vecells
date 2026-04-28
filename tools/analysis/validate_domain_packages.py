#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOOLS_DIR = ROOT / "tools" / "analysis"

ROOT_PACKAGE_PATH = ROOT / "package.json"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
MANIFEST_PATH = DATA_DIR / "domain_package_manifest.json"
MATRIX_PATH = DATA_DIR / "shared_contract_package_matrix.csv"
DOC_PATH = DOCS_DIR / "44_domain_package_contracts.md"
BUILDER_PATH = TOOLS_DIR / "build_domain_package_scaffold.py"

DOMAIN_PACKAGE_IDS = {
    "package_domains_intake_safety",
    "package_domains_identity_access",
    "package_domains_triage_workspace",
    "package_domains_booking",
    "package_domains_hub_coordination",
    "package_domains_pharmacy",
    "package_domains_communications",
    "package_domains_support",
    "package_domains_operations",
    "package_domains_governance_admin",
    "package_domains_analytics_assurance",
    "package_domains_audit_compliance",
    "package_domains_release_control",
}
SHARED_PACKAGE_IDS = {
    "package_domain_kernel",
    "package_event_contracts",
    "package_api_contracts",
    "package_fhir_mapping",
    "package_authz_policy",
    "package_design_system",
    "package_test_fixtures",
    "package_observability",
    "package_release_controls",
}

REQUIRED_ROOT_SCRIPTS = {"bootstrap", "check", "codegen", "validate:domains"}
README_MARKERS = [
    "## Purpose",
    "## Allowed Dependencies",
    "## Forbidden Dependencies",
    "## Public API",
    "## Bootstrapping Test",
]
DOC_MARKERS = [
    "# 44 Domain Package Contracts",
    "## Gap Closures",
    "## Assumptions",
    "## Domain Packages",
    "## Shared Contract Packages",
]
IMPORT_PATTERN = re.compile(r'from "(?P<double>[^"]+)"|from \'(?P<single>[^\']+)\'')


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


def module_specifiers(text: str) -> list[str]:
    modules = []
    for match in IMPORT_PATTERN.finditer(text):
        modules.append(match.group("double") or match.group("single") or "")
    return modules


def validate_root_scripts() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.get("scripts", {})
    assert_true(REQUIRED_ROOT_SCRIPTS.issubset(scripts), "Root package lost seq_044 scripts")
    assert_true(
        "build_domain_package_scaffold.py" in scripts["codegen"],
        "Root codegen no longer regenerates seq_044 package scaffolds",
    )
    assert_true(
        scripts["validate:domains"] == "python3 ./tools/analysis/validate_domain_packages.py",
        "Root validate:domains script drifted",
    )


def validate_manifest() -> dict[str, Any]:
    manifest = read_json(MANIFEST_PATH)
    object_catalog = read_json(OBJECT_CATALOG_PATH)["objects"]
    assert_true(manifest["task_id"] == "seq_044", "Domain package manifest task id drifted")
    assert_true(len(manifest["domain_packages"]) == len(DOMAIN_PACKAGE_IDS), "Domain package count drifted")
    assert_true(len(manifest["shared_packages"]) == len(SHARED_PACKAGE_IDS), "Shared package count drifted")
    assert_true(
        manifest["summary"]["canonical_object_family_count"] == len(object_catalog),
        "Canonical object family count drifted",
    )
    assignments = manifest["object_family_assignments"]
    assert_true(len(assignments) == len(object_catalog), "Object assignment coverage drifted")

    by_name: dict[str, set[str]] = {}
    for row in assignments:
        by_name.setdefault(row["canonical_name"], set()).add(row["package_artifact_id"])
    duplicates = [name for name, owners in by_name.items() if len(owners) != 1]
    assert_true(not duplicates, "Canonical families lost single-owner discipline:\n" + "\n".join(sorted(duplicates)))

    domain_ids = {row["artifact_id"] for row in manifest["domain_packages"]}
    shared_ids = {row["artifact_id"] for row in manifest["shared_packages"]}
    assert_true(domain_ids == DOMAIN_PACKAGE_IDS, "Domain package ids drifted")
    assert_true(shared_ids == SHARED_PACKAGE_IDS, "Shared package ids drifted")

    for row in manifest["domain_packages"]:
        assert_true(row["object_family_count"] > 0, f"{row['artifact_id']} lost canonical object families")
    fixture_row = next(row for row in manifest["shared_packages"] if row["artifact_id"] == "package_test_fixtures")
    assert_true(
        fixture_row["object_family_count"] == 0,
        "packages/test-fixtures must stay non-authoritative with zero canonical object families",
    )

    contract_rows = manifest["contract_family_rows"]
    contract_ids = [row["contract_family_id"] for row in contract_rows]
    assert_true(len(contract_ids) == len(set(contract_ids)), "Shared contract families lost unique ownership")

    return manifest


def validate_matrix(manifest: dict[str, Any]) -> None:
    rows = read_csv(MATRIX_PATH)
    assert_true(
        len(rows) == manifest["summary"]["contract_family_count"],
        "Shared contract package matrix count drifted",
    )
    matrix_ids = {row["contract_family_id"] for row in rows}
    manifest_ids = {row["contract_family_id"] for row in manifest["contract_family_rows"]}
    assert_true(matrix_ids == manifest_ids, "Shared contract package matrix ids drifted")


def validate_docs() -> None:
    text = DOC_PATH.read_text()
    for marker in DOC_MARKERS:
        assert_true(marker in text, f"Domain package doc missing marker {marker}")


def validate_package_workspace(entry: dict[str, Any]) -> None:
    repo_root = ROOT / entry["repo_path"]
    source_file = repo_root / "src" / ("index.tsx" if entry["artifact_id"] == "package_design_system" else "index.ts")
    test_file = repo_root / "tests" / "public-api.test.ts"
    readme_path = repo_root / "README.md"
    package_json_path = repo_root / "package.json"

    for path in (source_file, test_file, readme_path, package_json_path):
        assert_true(path.exists(), f"Missing seq_044 package artifact {path}")

    readme_text = readme_path.read_text()
    for marker in README_MARKERS:
        assert_true(marker in readme_text, f"README missing marker {marker} for {entry['artifact_id']}")

    package_json = read_json(package_json_path)
    assert_true("description" in package_json and package_json["description"], f"Package description missing for {entry['artifact_id']}")

    source_text = source_file.read_text()
    expected_bootstrap = "bootstrapDomainModule" if entry["artifact_id"] in DOMAIN_PACKAGE_IDS else "bootstrapSharedPackage"
    assert_true(expected_bootstrap in source_text, f"Source lost {expected_bootstrap} for {entry['artifact_id']}")

    for text in (source_text, test_file.read_text()):
        for module_name in module_specifiers(text):
            if module_name.startswith("@vecells/"):
                assert_true(
                    module_name.count("/") == 1,
                    f"Deep import detected in {entry['artifact_id']}: {module_name}",
                )
            if module_name.startswith("../") and not module_name.startswith("../src/"):
                fail(f"Relative import escaped public test seam in {entry['artifact_id']}: {module_name}")


def main() -> None:
    for path in (ROOT_PACKAGE_PATH, OBJECT_CATALOG_PATH, MANIFEST_PATH, MATRIX_PATH, DOC_PATH, BUILDER_PATH, Path(__file__)):
        assert_true(path.exists(), f"Missing seq_044 deliverable {path}")
    validate_root_scripts()
    manifest = validate_manifest()
    validate_matrix(manifest)
    validate_docs()
    for entry in manifest["domain_packages"] + manifest["shared_packages"]:
        validate_package_workspace(entry)
    print("seq_044 validation passed")


if __name__ == "__main__":
    main()
