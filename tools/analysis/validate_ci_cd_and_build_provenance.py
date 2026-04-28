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
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
TOOLS_RELEASE_DIR = ROOT / "tools" / "release-provenance"
INFRA_DIR = ROOT / "infra" / "build-provenance"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

MANIFEST_PATH = DATA_DIR / "build_provenance_manifest.json"
MATRIX_PATH = DATA_DIR / "pipeline_gate_matrix.csv"
QUARANTINE_POLICY_PATH = DATA_DIR / "artifact_quarantine_policy.json"
DESIGN_DOC_PATH = DOCS_DIR / "91_ci_cd_and_build_provenance_design.md"
RULES_DOC_PATH = DOCS_DIR / "91_artifact_signing_quarantine_and_publish_rules.md"
ATLAS_PATH = DOCS_DIR / "91_build_provenance_pipeline_atlas.html"
SPEC_PATH = TESTS_DIR / "build-provenance-pipeline-atlas.spec.js"
BUILD_SCRIPT_PATH = TOOLS_DIR / "build_ci_cd_and_build_provenance.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

CI_WORKFLOW_PATH = WORKFLOWS_DIR / "build-provenance-ci.yml"
PROMOTION_WORKFLOW_PATH = WORKFLOWS_DIR / "nonprod-provenance-promotion.yml"

PACKAGE_SOURCE_PATH = RELEASE_CONTROLS_DIR / "src" / "build-provenance.ts"
PACKAGE_INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
PACKAGE_PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
PACKAGE_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "build-provenance.test.ts"

SHARED_SCRIPT_PATH = TOOLS_RELEASE_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_RELEASE_DIR / "run-build-provenance-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_RELEASE_DIR / "verify-build-provenance.ts"
PROMOTE_SCRIPT_PATH = TOOLS_RELEASE_DIR / "promote-build-artifact.ts"

README_PATH = INFRA_DIR / "README.md"
DEPENDENCY_POLICY_PATH = INFRA_DIR / "local" / "dependency-policy.json"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "build-provenance-smoke.test.mjs"

EXPECTED_BUILD_FAMILIES = {
    "bf_foundation_monorepo_full",
    "bf_published_gateway_bundle",
    "bf_command_runtime_bundle",
    "bf_projection_runtime_bundle",
    "bf_notification_runtime_bundle",
    "bf_adapter_simulator_bundle",
    "bf_browser_contract_bundle",
    "bf_release_control_bundle",
}
EXPECTED_PROVENANCE_STATES = {"verified", "quarantined", "revoked", "superseded", "drifted"}
EXPECTED_ARTIFACT_STATES = {"publishable", "quarantined", "revoked", "superseded", "blocked"}
EXPECTED_HTML_MARKERS = [
    "Build_Provenance_Pipeline_Atlas",
    'data-testid="pipeline-lane"',
    'data-testid="provenance-card-wall"',
    'data-testid="decision-timeline"',
    'data-testid="run-table"',
    'data-testid="policy-table"',
    'data-testid="inspector"',
]
EXPECTED_SPEC_MARKERS = [
    "filter behavior and synchronized selection",
    "keyboard navigation and focus management",
    "reduced-motion handling",
    "responsive layout at desktop and tablet widths",
    "accessibility smoke checks and landmark verification",
    "verification that quarantined, revoked, and published states are visually and semantically distinct",
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
    require(path.exists(), f"Missing file: {path}")
    source = path.read_text(encoding="utf-8")
    require(token in source, f"{path} is missing required token: {token}")


def main() -> None:
    for path in [
        MANIFEST_PATH,
        MATRIX_PATH,
        QUARANTINE_POLICY_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        ATLAS_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        ROOT_PACKAGE_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        CI_WORKFLOW_PATH,
        PROMOTION_WORKFLOW_PATH,
        PACKAGE_SOURCE_PATH,
        PACKAGE_INDEX_PATH,
        PACKAGE_PUBLIC_API_TEST_PATH,
        PACKAGE_TEST_PATH,
        SHARED_SCRIPT_PATH,
        REHEARSAL_SCRIPT_PATH,
        VERIFY_SCRIPT_PATH,
        PROMOTE_SCRIPT_PATH,
        README_PATH,
        DEPENDENCY_POLICY_PATH,
        SMOKE_TEST_PATH,
    ]:
        require(path.exists(), f"Missing expected par_091 artifact: {path}")

    manifest = read_json(MANIFEST_PATH)
    policy = read_json(QUARANTINE_POLICY_PATH)
    dependency_policy = read_json(DEPENDENCY_POLICY_PATH)
    root_package = read_json(ROOT_PACKAGE_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    matrix_rows = read_csv(MATRIX_PATH)

    require(manifest["task_id"] == "par_091", "Build provenance manifest task_id drifted.")
    require(
        manifest["visual_mode"] == "Build_Provenance_Pipeline_Atlas",
        "Build provenance visual mode drifted.",
    )
    require(
        manifest["summary"]["build_family_count"] == 8,
        "Build provenance family count drifted.",
    )
    require(
        manifest["summary"]["pipeline_run_count"] == 8,
        "Build provenance pipeline run count drifted.",
    )
    require(manifest["summary"]["gate_count"] == 8, "Gate count drifted.")
    require(manifest["summary"]["gate_evidence_count"] == 64, "Gate evidence count drifted.")
    require(
        manifest["summary"]["quarantine_rule_count"] == 6,
        "Quarantine rule count drifted.",
    )
    require(
        manifest["summary"]["publish_hook_count"] == 16,
        "Publish hook count drifted.",
    )

    build_family_refs = {row["buildFamilyRef"] for row in manifest["buildFamilies"]}
    require(
        build_family_refs == EXPECTED_BUILD_FAMILIES,
        f"Build family refs drifted: {build_family_refs}",
    )
    require(
        {row["provenanceState"] for row in manifest["pipelineRuns"]} == EXPECTED_PROVENANCE_STATES,
        "Pipeline provenance states drifted.",
    )
    require(
        {row["artifactState"] for row in manifest["pipelineRuns"]} == EXPECTED_ARTIFACT_STATES,
        "Pipeline artifact states drifted.",
    )
    require(
        len(manifest["buildProvenanceRecords"]) == 8,
        "Build provenance record count drifted.",
    )
    require(len(matrix_rows) == 40, "Pipeline gate matrix row count drifted.")
    require(
        {row["environment_ring"] for row in matrix_rows}
        == {"local", "ci-preview", "integration", "preprod", "production"},
        "Pipeline gate matrix environment coverage drifted.",
    )
    require(
        {row["gate_ref"] for row in matrix_rows}
        == {
            "dependency_resolve",
            "lint_type_unit",
            "build_package",
            "sbom_dependency_policy",
            "provenance_sign",
            "provenance_verify",
            "runtime_publish_gate",
            "nonprod_promotion_gate",
        },
        "Pipeline gate refs drifted.",
    )
    require(policy["policyId"] == "artifact_quarantine_policy_v1", "Quarantine policy id drifted.")
    require(len(policy["rules"]) == 6, "Quarantine policy rule count drifted.")
    require(
        dependency_policy["policyId"] == "dependency_policy_091_foundation_v1",
        "Dependency policy id drifted.",
    )
    require(
        dependency_policy["requiredRootPackageManager"] == "pnpm@10.23.0",
        "Dependency policy package manager drifted.",
    )

    for token in EXPECTED_HTML_MARKERS:
        assert_contains(ATLAS_PATH, token)
    for token in EXPECTED_SPEC_MARKERS:
        assert_contains(SPEC_PATH, token)

    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "build_ci_cd_and_build_provenance.py")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "validate:build-provenance")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "ci:foundation-gates")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "ci:rehearse-provenance")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "ci:verify-provenance")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "ci:promote-nonprod")

    scripts = root_package["scripts"]
    require(
        "build_ci_cd_and_build_provenance.py" in scripts["codegen"],
        "Root codegen script does not include par_091 builder.",
    )
    require(
        scripts["validate:build-provenance"]
        == "python3 ./tools/analysis/validate_ci_cd_and_build_provenance.py",
        "validate:build-provenance script drifted.",
    )
    require(
        scripts["ci:foundation-gates"] == "pnpm build && pnpm check",
        "ci:foundation-gates script drifted.",
    )
    require(
        "run-build-provenance-rehearsal.ts" in scripts["ci:rehearse-provenance"],
        "ci:rehearse-provenance script drifted.",
    )
    require(
        "verify-build-provenance.ts" in scripts["ci:verify-provenance"],
        "ci:verify-provenance script drifted.",
    )
    require(
        "promote-build-artifact.ts" in scripts["ci:promote-nonprod"],
        "ci:promote-nonprod script drifted.",
    )

    playwright_scripts = playwright_package["scripts"]
    require(
        "build-provenance-pipeline-atlas.spec.js" in playwright_scripts["build"],
        "Playwright build script lost par_091 atlas coverage.",
    )
    require(
        "build-provenance-pipeline-atlas.spec.js" in playwright_scripts["lint"],
        "Playwright lint script lost par_091 atlas coverage.",
    )
    require(
        "build-provenance-pipeline-atlas.spec.js" in playwright_scripts["test"],
        "Playwright test script lost par_091 atlas coverage.",
    )
    require(
        "build-provenance-pipeline-atlas.spec.js" in playwright_scripts["typecheck"],
        "Playwright typecheck script lost par_091 atlas coverage.",
    )
    require(
        "build-provenance-pipeline-atlas.spec.js --run" in playwright_scripts["e2e"],
        "Playwright e2e script lost par_091 atlas coverage.",
    )

    assert_contains(PACKAGE_INDEX_PATH, 'export * from "./build-provenance";')
    assert_contains(PACKAGE_PUBLIC_API_TEST_PATH, "createBuildProvenanceSimulationHarness")
    assert_contains(PACKAGE_PUBLIC_API_TEST_PATH, "runs the build provenance simulation harness")
    assert_contains(PACKAGE_SOURCE_PATH, "revokeBuildProvenanceRecord")
    assert_contains(PACKAGE_SOURCE_PATH, "supersedeBuildProvenanceRecord")
    assert_contains(PACKAGE_SOURCE_PATH, "createBuildProvenanceSimulationHarness")
    require(
        "node:crypto" not in PACKAGE_SOURCE_PATH.read_text(encoding="utf-8"),
        "Release-controls build provenance surface must remain browser-safe.",
    )
    assert_contains(PACKAGE_TEST_PATH, "quarantines a tampered signature")
    assert_contains(PACKAGE_TEST_PATH, "revokes build publication when provenance is revoked")

    assert_contains(SHARED_SCRIPT_PATH, "RELEASE_PROVENANCE_SIGNING_KEY_REF")
    assert_contains(REHEARSAL_SCRIPT_PATH, "--build-family")
    assert_contains(VERIFY_SCRIPT_PATH, "verification-result.json")
    assert_contains(PROMOTE_SCRIPT_PATH, "TARGET_RING_NOT_NONPROD")

    assert_contains(CI_WORKFLOW_PATH, "pnpm ci:foundation-gates")
    assert_contains(CI_WORKFLOW_PATH, "pnpm ci:rehearse-provenance")
    assert_contains(CI_WORKFLOW_PATH, "pnpm ci:verify-provenance")
    assert_contains(PROMOTION_WORKFLOW_PATH, "pnpm ci:promote-nonprod")
    assert_contains(README_PATH, "build-provenance-ci.yml")
    assert_contains(SMOKE_TEST_PATH, "Tampered provenance unexpectedly verified.")

    print(
        "par_091 validation passed: "
        "manifest, workflows, release-controls surface, rehearsal scripts, and atlas coverage are coherent."
    )


if __name__ == "__main__":
    main()
