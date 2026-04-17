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
INFRA_DIR = ROOT / "infra" / "data-storage"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
FHIR_CONTRACT_MANIFEST_PATH = DATA_DIR / "fhir_representation_contract_manifest.json"
DOMAIN_STORE_MANIFEST_PATH = DATA_DIR / "domain_store_manifest.json"
FHIR_STORE_MANIFEST_PATH = DATA_DIR / "fhir_store_manifest.json"
SEPARATION_MATRIX_PATH = DATA_DIR / "data_plane_separation_matrix.csv"

DESIGN_DOC_PATH = DOCS_DIR / "85_domain_transaction_store_and_fhir_storage_design.md"
RULES_DOC_PATH = DOCS_DIR / "85_data_plane_truth_layer_and_fhir_separation_rules.md"
HTML_PATH = DOCS_DIR / "85_data_storage_topology_atlas.html"
SPEC_PATH = TESTS_DIR / "data-storage-topology-atlas.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_domain_and_fhir_storage.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
PLAYWRIGHT_PACKAGE_BUILDER_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
DOMAIN_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "domain_transaction_store" / "main.tf"
)
DOMAIN_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "domain_transaction_store" / "variables.tf"
)
DOMAIN_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "domain_transaction_store" / "outputs.tf"
)
FHIR_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "fhir_representation_store" / "main.tf"
)
FHIR_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "fhir_representation_store" / "variables.tf"
)
FHIR_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "fhir_representation_store" / "outputs.tf"
)

ENVIRONMENT_FILE_PATHS = [
    INFRA_DIR / "environments" / "local.auto.tfvars.json",
    INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    INFRA_DIR / "environments" / "production.auto.tfvars.json",
]

DOMAIN_BOOTSTRAP_SQL_PATH = (
    INFRA_DIR / "bootstrap" / "001_domain_transaction_bootstrap.sql"
)
FHIR_BOOTSTRAP_SQL_PATH = (
    INFRA_DIR / "bootstrap" / "001_fhir_representation_bootstrap.sql"
)
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "data-storage-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "connectivity-policy.json"
LOCAL_BOOTSTRAP_SCRIPT_PATH = INFRA_DIR / "local" / "bootstrap-domain-fhir-storage.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "domain-fhir-storage-smoke.test.mjs"

EXPECTED_ENVIRONMENTS = {"local", "ci-preview", "integration", "preprod", "production"}
EXPECTED_SEPARATION_REFS = {
    "sep_domain_request_lifecycle_authority",
    "sep_domain_identity_and_grant_authority",
    "sep_domain_settlement_and_reservation_authority",
    "sep_domain_assurance_read_only",
    "sep_domain_projection_not_source",
    "sep_fhir_mapping_contract_gate",
    "sep_fhir_resource_version_supersession",
    "sep_fhir_exchange_bundle_read_only_to_integrations",
    "sep_fhir_assurance_parity_review",
    "sep_fhir_not_projection_query_source",
}
EXPECTED_HTML_MARKERS = [
    "Data_Storage_Topology_Atlas",
    'data-testid="topology-diagram"',
    'data-testid="binding-matrix"',
    'data-testid="representation-strip"',
    'data-testid="store-table"',
    'data-testid="binding-table"',
    'data-testid="inspector"',
]
EXPECTED_SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
]


def is_authoritative_role(role: str) -> bool:
    return role in {"nonprod_local", "primary"}


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


def assert_contains(path: Path, needle: str) -> None:
    source = path.read_text(encoding="utf-8")
    require(needle in source, f"{path} is missing required token: {needle}")


def validate_manifest_common(
    manifest: dict,
    *,
    expected_store_class: str,
    expected_store_ref: str,
    expected_data_store_ref: str,
    expected_count: int,
) -> None:
    require(manifest["task_id"] == "par_085", f"{expected_store_ref} task_id drifted.")
    require(
        manifest["visual_mode"] == "Data_Storage_Topology_Atlas",
        f"{expected_store_ref} visual_mode drifted.",
    )
    require(
        manifest["captured_on"] == manifest["generated_at"][:10],
        f"{expected_store_ref} captured_on no longer matches generated_at.",
    )
    require(
        manifest["store_descriptor"]["store_ref"] == expected_store_ref,
        f"{expected_store_ref} store_ref drifted.",
    )
    require(
        manifest["store_descriptor"]["data_store_ref"] == expected_data_store_ref,
        f"{expected_store_ref} data_store_ref drifted.",
    )
    require(
        manifest["store_descriptor"]["store_class"] == expected_store_class,
        f"{expected_store_ref} store_class drifted.",
    )
    require(
        manifest["store_descriptor"]["browser_reachability"] == "never",
        f"{expected_store_ref} browser reachability drifted.",
    )
    require(
        manifest["summary"]["environment_realization_count"]
        == len(manifest["environment_realizations"]),
        f"{expected_store_ref} environment realization summary drifted.",
    )
    require(
        manifest["summary"]["store_realization_count"] == len(manifest["store_realizations"]),
        f"{expected_store_ref} store realization summary drifted.",
    )
    require(
        manifest["summary"]["store_realization_count"] == expected_count,
        f"{expected_store_ref} no longer covers every stateful data workload.",
    )

    environments = {row["environment_ring"] for row in manifest["environment_realizations"]}
    require(environments == EXPECTED_ENVIRONMENTS, f"{expected_store_ref} environment rings drifted: {environments}")


def validate_environment_footprint(
    manifest: dict,
    expected_counts: dict[str, int],
    *,
    primary_binding: str,
    secondary_binding: str,
) -> None:
    actual_counts = {
        row["environment_ring"]: len(row["region_placements"])
        for row in manifest["environment_realizations"]
    }
    require(actual_counts == expected_counts, f"{manifest['store_descriptor']['store_ref']} footprint drifted.")
    for row in manifest["store_realizations"]:
        expected_binding = (
            primary_binding if is_authoritative_role(row["uk_region_role"]) else secondary_binding
        )
        require(
            row["binding_state"] == expected_binding,
            f"{row['store_realization_id']} binding state drifted.",
        )
        require(
            row["connectivity_mode"] == "private_identity_ready_tls",
            f"{row['store_realization_id']} connectivity mode drifted.",
        )
        require(
            row["trust_zone_ref"] == "tz_stateful_data",
            f"{row['store_realization_id']} trust zone drifted.",
        )
        require(
            "browser" in row["blocked_service_identity_refs"],
            f"{row['store_realization_id']} lost browser blocking.",
        )


def main() -> None:
    for path in [
        RUNTIME_TOPOLOGY_PATH,
        FHIR_CONTRACTS_PATH,
        FHIR_CONTRACT_MANIFEST_PATH,
        DOMAIN_STORE_MANIFEST_PATH,
        FHIR_STORE_MANIFEST_PATH,
        SEPARATION_MATRIX_PATH,
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
        DOMAIN_MODULE_MAIN_PATH,
        DOMAIN_MODULE_VARIABLES_PATH,
        DOMAIN_MODULE_OUTPUTS_PATH,
        FHIR_MODULE_MAIN_PATH,
        FHIR_MODULE_VARIABLES_PATH,
        FHIR_MODULE_OUTPUTS_PATH,
        DOMAIN_BOOTSTRAP_SQL_PATH,
        FHIR_BOOTSTRAP_SQL_PATH,
        LOCAL_COMPOSE_PATH,
        LOCAL_POLICY_PATH,
        LOCAL_BOOTSTRAP_SCRIPT_PATH,
        SMOKE_TEST_PATH,
        *ENVIRONMENT_FILE_PATHS,
    ]:
        require(path.exists(), f"Missing par_085 artifact: {path}")

    topology = read_json(RUNTIME_TOPOLOGY_PATH)
    fhir_contract_manifest = read_json(FHIR_CONTRACT_MANIFEST_PATH)
    fhir_contracts = read_json(FHIR_CONTRACTS_PATH)
    fhir_contract_rows = fhir_contracts["contracts"]
    domain_manifest = read_json(DOMAIN_STORE_MANIFEST_PATH)
    fhir_manifest = read_json(FHIR_STORE_MANIFEST_PATH)
    separation_rows = read_csv(SEPARATION_MATRIX_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    local_policy = read_json(LOCAL_POLICY_PATH)

    stateful_rows = [
        row
        for row in topology["runtime_workload_families"]
        if row["runtime_workload_family_ref"] == "wf_data_stateful_plane"
    ]
    expected_realization_count = len(stateful_rows)
    expected_counts = {
        environment: sum(1 for row in stateful_rows if row["environment_ring"] == environment)
        for environment in EXPECTED_ENVIRONMENTS
    }

    validate_manifest_common(
        domain_manifest,
        expected_store_class="transactional_domain",
        expected_store_ref="store_domain_transaction",
        expected_data_store_ref="ds_transactional_domain_authority",
        expected_count=expected_realization_count,
    )
    validate_manifest_common(
        fhir_manifest,
        expected_store_class="fhir_representation",
        expected_store_ref="store_fhir_representation",
        expected_data_store_ref="ds_relational_fhir",
        expected_count=expected_realization_count,
    )

    validate_environment_footprint(
        domain_manifest,
        expected_counts,
        primary_binding="writable_authority",
        secondary_binding="warm_standby",
    )
    validate_environment_footprint(
        fhir_manifest,
        expected_counts,
        primary_binding="derived_materialization",
        secondary_binding="warm_standby",
    )

    require(
        domain_manifest["summary"]["schema_count"]
        == len(domain_manifest["store_descriptor"]["schema_catalog"]),
        "Domain schema summary drifted.",
    )
    require(
        domain_manifest["summary"]["access_policy_count"] == len(domain_manifest["access_policies"]),
        "Domain access policy summary drifted.",
    )
    require(
        fhir_manifest["summary"]["access_policy_count"] == len(fhir_manifest["access_policies"]),
        "FHIR access policy summary drifted.",
    )
    require(
        fhir_manifest["store_descriptor"]["persistence_tables"]
        == fhir_contract_manifest["persistence_tables"],
        "FHIR persistence table wiring drifted.",
    )
    require(
        fhir_manifest["store_descriptor"]["schema_refs"] == fhir_contract_manifest["schemas"],
        "FHIR schema refs drifted.",
    )
    require(
        fhir_manifest["summary"]["representation_contract_count"] == len(fhir_contract_rows),
        "FHIR representation contract count drifted.",
    )

    require(
        topology["domain_store_manifest_ref"] == "data/analysis/domain_store_manifest.json",
        "Runtime topology lost domain_store_manifest_ref.",
    )
    require(
        topology["fhir_store_manifest_ref"] == "data/analysis/fhir_store_manifest.json",
        "Runtime topology lost fhir_store_manifest_ref.",
    )
    require(
        topology["data_plane_separation_matrix_ref"] == "data/analysis/data_plane_separation_matrix.csv",
        "Runtime topology lost data_plane_separation_matrix_ref.",
    )
    data_store_catalog = {row["data_store_ref"]: row for row in topology["data_store_catalog"]}
    require(
        data_store_catalog["ds_transactional_domain_authority"]["store_class"] == "transactional_domain",
        "Runtime topology transactional domain catalog entry drifted.",
    )
    require(
        data_store_catalog["ds_relational_fhir"]["store_class"] == "fhir_representation",
        "Runtime topology FHIR catalog entry drifted.",
    )

    require(len(separation_rows) == len(EXPECTED_SEPARATION_REFS), "Separation matrix row count drifted.")
    require(
        {row["binding_ref"] for row in separation_rows} == EXPECTED_SEPARATION_REFS,
        "Separation matrix binding coverage drifted.",
    )
    require(
        sum(1 for row in separation_rows if row["store_family"] == "domain") == 5,
        "Domain separation row count drifted.",
    )
    require(
        sum(1 for row in separation_rows if row["store_family"] == "fhir") == 5,
        "FHIR separation row count drifted.",
    )
    require(
        {"command_write", "mapping_only", "assurance_read", "internal_only"}
        <= {row["access_posture"] for row in separation_rows},
        "Separation matrix access postures drifted.",
    )

    require(local_policy["task_id"] == "par_085", "Local connectivity policy task id drifted.")
    require(local_policy["visual_mode"] == "Data_Storage_Topology_Atlas", "Local connectivity policy mode drifted.")
    require(local_policy["browser_addressable_services"] == [], "Local connectivity policy exposed browser services.")
    require(
        set(local_policy["blocked_browser_targets"])
        == {
            "ds_transactional_domain_authority",
            "ds_relational_fhir",
            "wf_data_stateful_plane",
        },
        "Local connectivity policy browser blocking drifted.",
    )
    require(
        local_policy["allowed_service_identity_access"]["ds_transactional_domain_authority"]
        == ["sid_command_api", "sid_assurance_control"],
        "Domain local access allowlist drifted.",
    )
    require(
        local_policy["allowed_service_identity_access"]["ds_relational_fhir"]
        == ["sid_command_api", "sid_integration_dispatch", "sid_assurance_control"],
        "FHIR local access allowlist drifted.",
    )

    for environment_path in ENVIRONMENT_FILE_PATHS:
        payload = read_json(environment_path)
        require(
            payload["environment"] in EXPECTED_ENVIRONMENTS,
            f"Environment tfvars drifted in {environment_path}.",
        )

    root_scripts = root_package["scripts"]
    require(
        "python3 ./tools/analysis/build_domain_and_fhir_storage.py" in root_scripts["codegen"],
        "Root codegen script lost the par_085 builder.",
    )
    require(
        "pnpm validate:domain-fhir-storage" in root_scripts["bootstrap"],
        "Root bootstrap script lost validate:domain-fhir-storage.",
    )
    require(
        "pnpm validate:domain-fhir-storage" in root_scripts["check"],
        "Root check script lost validate:domain-fhir-storage.",
    )
    require(
        root_scripts["validate:domain-fhir-storage"]
        == "python3 ./tools/analysis/validate_domain_and_fhir_storage.py",
        "Root validate:domain-fhir-storage command drifted.",
    )

    playwright_scripts = playwright_package["scripts"]
    require(
        "data-storage-topology-atlas.spec.js" in playwright_scripts["build"],
        "Playwright build inventory lost the par_085 spec.",
    )
    require(
        "data-storage-topology-atlas.spec.js" in playwright_scripts["lint"],
        "Playwright lint inventory lost the par_085 spec.",
    )
    require(
        "data-storage-topology-atlas.spec.js" in playwright_scripts["test"],
        "Playwright test inventory lost the par_085 spec.",
    )
    require(
        "data-storage-topology-atlas.spec.js" in playwright_scripts["typecheck"],
        "Playwright typecheck inventory lost the par_085 spec.",
    )
    require(
        "data-storage-topology-atlas.spec.js --run" in playwright_scripts["e2e"],
        "Playwright e2e inventory lost the par_085 spec.",
    )

    for marker in EXPECTED_HTML_MARKERS:
        assert_contains(HTML_PATH, marker)
    for marker in EXPECTED_SPEC_MARKERS:
        assert_contains(SPEC_PATH, marker)

    for path, marker in [
        (DESIGN_DOC_PATH, "## Domain Store Summary"),
        (DESIGN_DOC_PATH, "## FHIR Store Summary"),
        (RULES_DOC_PATH, "## Non-negotiable Rules"),
        (RULES_DOC_PATH, "## Separation Matrix"),
        (README_PATH, "transactional domain store"),
        (TERRAFORM_MAIN_PATH, 'module "domain_transaction_store"'),
        (TERRAFORM_MAIN_PATH, 'module "fhir_representation_store"'),
        (DOMAIN_MODULE_MAIN_PATH, "bootstrap_sql_ref"),
        (FHIR_MODULE_MAIN_PATH, "bootstrap_sql_ref"),
        (DOMAIN_BOOTSTRAP_SQL_PATH, "vecells_request.requests"),
        (DOMAIN_BOOTSTRAP_SQL_PATH, "vecells_identity.identity_bindings"),
        (FHIR_BOOTSTRAP_SQL_PATH, "vecells_fhir.fhir_representation_sets"),
        (FHIR_BOOTSTRAP_SQL_PATH, "vecells_fhir.fhir_exchange_bundles"),
        (LOCAL_COMPOSE_PATH, "domain-store"),
        (LOCAL_COMPOSE_PATH, "fhir-store"),
        (LOCAL_BOOTSTRAP_SCRIPT_PATH, "VECELLS_DOMAIN_STORE_DSN"),
        (LOCAL_BOOTSTRAP_SCRIPT_PATH, "VECELLS_FHIR_STORE_DSN"),
        (SMOKE_TEST_PATH, "runtime topology binds the two store manifests"),
        (BUILD_SCRIPT_PATH, "patch_runtime_topology_manifest"),
        (ROOT_SCRIPT_UPDATES_PATH, '"validate:domain-fhir-storage"'),
        (PLAYWRIGHT_PACKAGE_BUILDER_PATH, "data-storage-topology-atlas.spec.js"),
    ]:
        assert_contains(path, marker)


if __name__ == "__main__":
    main()
