#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "analysis"
INFRA_DIR = ROOT / "infra" / "object-storage"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
CLASS_MANIFEST_PATH = DATA_DIR / "object_storage_class_manifest.json"
RETENTION_MATRIX_PATH = DATA_DIR / "object_retention_policy_matrix.csv"
KEY_RULES_PATH = DATA_DIR / "object_key_manifest_rules.json"
DESIGN_DOC_PATH = DOCS_DIR / "86_object_storage_and_retention_design.md"
RULES_DOC_PATH = DOCS_DIR / "86_artifact_storage_classes_and_visibility_rules.md"
HTML_PATH = DOCS_DIR / "86_object_storage_retention_atlas.html"
SPEC_PATH = TESTS_DIR / "object-storage-retention-atlas.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_object_storage_and_retention.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_BUILDER_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
NAMESPACE_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "object_storage_namespace" / "main.tf"
)
NAMESPACE_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "object_storage_namespace" / "variables.tf"
)
NAMESPACE_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "object_storage_namespace" / "outputs.tf"
)
CLASS_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "storage_class_bucket" / "main.tf"
)
CLASS_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "storage_class_bucket" / "variables.tf"
)
CLASS_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "storage_class_bucket" / "outputs.tf"
)
BOOTSTRAP_CATALOG_PATH = INFRA_DIR / "bootstrap" / "object-storage-seed-catalog.json"
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "object-storage-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "object-storage-policy.json"
LOCAL_HANDOFF_PATH = INFRA_DIR / "local" / "malware-scan-handoff.json"
LOCAL_BOOTSTRAP_SCRIPT_PATH = INFRA_DIR / "local" / "bootstrap-object-storage.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "object-storage-smoke.test.mjs"

ENVIRONMENT_FILES = [
    INFRA_DIR / "environments" / "local.auto.tfvars.json",
    INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    INFRA_DIR / "environments" / "production.auto.tfvars.json",
]

EXPECTED_CLASSES = {
    "quarantine_raw",
    "evidence_source_immutable",
    "derived_internal",
    "redacted_presentation",
    "outbound_ephemeral",
    "ops_recovery_staging",
}
EXPECTED_ENVIRONMENTS = {"local", "ci-preview", "integration", "preprod", "production"}
EXPECTED_HTML_MARKERS = [
    "Object_Storage_Retention_Atlas",
    'data-testid="flow-diagram"',
    'data-testid="lifecycle-ribbon"',
    'data-testid="access-matrix"',
    'data-testid="manifest-table"',
    'data-testid="retention-table"',
    'data-testid="inspector"',
]
EXPECTED_SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
    "verification that quarantine and trusted classes are visually and semantically distinct",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path):
    if not path.exists():
        fail(f"Missing JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Missing CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, token: str) -> None:
    source = path.read_text(encoding="utf-8")
    require(token in source, f"{path} is missing required token: {token}")


def main() -> None:
    for path in [
        RUNTIME_TOPOLOGY_PATH,
        CLASS_MANIFEST_PATH,
        RETENTION_MATRIX_PATH,
        KEY_RULES_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        HTML_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        PLAYWRIGHT_PACKAGE_BUILDER_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        README_PATH,
        TERRAFORM_MAIN_PATH,
        TERRAFORM_VARIABLES_PATH,
        TERRAFORM_OUTPUTS_PATH,
        NAMESPACE_MODULE_MAIN_PATH,
        NAMESPACE_MODULE_VARIABLES_PATH,
        NAMESPACE_MODULE_OUTPUTS_PATH,
        CLASS_MODULE_MAIN_PATH,
        CLASS_MODULE_VARIABLES_PATH,
        CLASS_MODULE_OUTPUTS_PATH,
        BOOTSTRAP_CATALOG_PATH,
        LOCAL_COMPOSE_PATH,
        LOCAL_POLICY_PATH,
        LOCAL_HANDOFF_PATH,
        LOCAL_BOOTSTRAP_SCRIPT_PATH,
        SMOKE_TEST_PATH,
        *ENVIRONMENT_FILES,
    ]:
        require(path.exists(), f"Missing expected par_086 artifact: {path}")

    manifest = read_json(CLASS_MANIFEST_PATH)
    topology = read_json(RUNTIME_TOPOLOGY_PATH)
    key_rules = read_json(KEY_RULES_PATH)
    local_policy = read_json(LOCAL_POLICY_PATH)
    handoff = read_json(LOCAL_HANDOFF_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    retention_rows = read_csv(RETENTION_MATRIX_PATH)
    seed_catalog = read_json(BOOTSTRAP_CATALOG_PATH)

    require(manifest["task_id"] == "par_086", "Object storage manifest task_id drifted.")
    require(
        manifest["visual_mode"] == "Object_Storage_Retention_Atlas",
        "Object storage visual_mode drifted.",
    )
    require(
        manifest["summary"]["storage_class_count"] == 6,
        "Object storage class count drifted.",
    )
    require(
        manifest["summary"]["class_realization_count"] == 30,
        "Object storage class realization count drifted.",
    )
    require(
        manifest["summary"]["seed_fixture_count"] == 8,
        "Object storage seed fixture count drifted.",
    )

    class_refs = {row["storage_class_ref"] for row in manifest["storage_classes"]}
    require(class_refs == EXPECTED_CLASSES, f"Storage class set drifted: {class_refs}")

    environments = {row["environment_ring"] for row in manifest["environment_realizations"]}
    require(environments == EXPECTED_ENVIRONMENTS, f"Environment set drifted: {environments}")
    require(len(retention_rows) == 30, "Retention policy matrix must cover 30 rows.")
    require(
        {row["environment_ring"] for row in retention_rows} == EXPECTED_ENVIRONMENTS,
        "Retention policy environments drifted.",
    )
    require(
        {row["storage_class_ref"] for row in retention_rows} == EXPECTED_CLASSES,
        "Retention policy class coverage drifted.",
    )

    require(
        topology["object_storage_class_manifest_ref"] == "data/analysis/object_storage_class_manifest.json",
        "Runtime topology object storage class manifest ref drifted.",
    )
    require(
        topology["object_retention_policy_matrix_ref"] == "data/analysis/object_retention_policy_matrix.csv",
        "Runtime topology retention matrix ref drifted.",
    )
    require(
        topology["object_key_manifest_rules_ref"] == "data/analysis/object_key_manifest_rules.json",
        "Runtime topology object key rules ref drifted.",
    )
    data_store_catalog = {
        row["data_store_ref"]: row for row in topology["data_store_catalog"]
    }
    require("ds_object_artifact_store" in data_store_catalog, "Runtime topology lost ds_object_artifact_store.")
    require(
        data_store_catalog["ds_object_artifact_store"]["browser_reachability"] == "never",
        "Object storage browser reachability drifted.",
    )

    require(
        "nhs_number" in key_rules["prohibited_key_material"],
        "Object key rules lost PHI prohibition for nhs_number.",
    )
    require(
        key_rules["signed_access_pattern"]["pattern_ref"]
        == "short_lived_manifest_bound_download_ticket",
        "Signed access pattern drifted.",
    )
    require(
        local_policy["browser_addressable_services"] == [],
        "Local policy should not expose browser-addressable object storage services.",
    )
    require(
        handoff["source_storage_class_ref"] == "quarantine_raw",
        "Malware-scan handoff drifted.",
    )
    require(len(seed_catalog) == 8, "Seed catalog drifted.")

    for token in EXPECTED_HTML_MARKERS:
        assert_contains(HTML_PATH, token)
    for token in EXPECTED_SPEC_MARKERS:
        assert_contains(SPEC_PATH, token)

    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "build_object_storage_and_retention.py")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "validate:object-storage-retention")
    assert_contains(PLAYWRIGHT_PACKAGE_BUILDER_PATH, "object-storage-retention-atlas.spec.js")
    assert_contains(LOCAL_COMPOSE_PATH, "minio/minio")
    assert_contains(LOCAL_BOOTSTRAP_SCRIPT_PATH, "--seed-dir")
    assert_contains(SMOKE_TEST_PATH, "bootstrap script seeds deterministic object fixtures")

    scripts = root_package["scripts"]
    require(
        "build_object_storage_and_retention.py" in scripts["codegen"],
        "Root codegen script does not include par_086 builder.",
    )
    require(
        scripts["validate:object-storage-retention"]
        == "python3 ./tools/analysis/validate_object_storage_and_retention.py",
        "Root validate:object-storage-retention script drifted.",
    )
    require(
        "object-storage-retention-atlas.spec.js" in playwright_package["scripts"]["e2e"],
        "Packaged Playwright e2e script lost par_086 atlas.",
    )


if __name__ == "__main__":
    main()
