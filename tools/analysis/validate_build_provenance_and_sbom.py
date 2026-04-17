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
RELEASE_TOOLS_DIR = ROOT / "tools" / "release-provenance"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"
WORKFLOWS_DIR = ROOT / ".github" / "workflows"

SCHEMA_PATH = DATA_DIR / "build_provenance_record_schema.json"
POLICY_MATRIX_PATH = DATA_DIR / "provenance_policy_matrix.csv"
SBOM_SCOPE_CATALOG_PATH = DATA_DIR / "sbom_scope_catalog.json"
INTEGRITY_CATALOG_PATH = DATA_DIR / "build_provenance_integrity_catalog.json"

DESIGN_DOC_PATH = DOCS_DIR / "100_supply_chain_provenance_sbom_signature_design.md"
RULES_DOC_PATH = DOCS_DIR / "100_provenance_quarantine_revocation_and_supersession_rules.md"
COCKPIT_PATH = DOCS_DIR / "100_build_provenance_cockpit.html"
SPEC_PATH = TESTS_DIR / "build-provenance-cockpit.spec.js"

BUILD_SCRIPT_PATH = TOOLS_DIR / "build_supply_chain_provenance_and_sbom.py"
VALIDATOR_PATH = TOOLS_DIR / "validate_build_provenance_and_sbom.py"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"
FOUNDATION_GATE_PATH = TOOLS_DIR / "build_parallel_foundation_tracks_gate.py"

PACKAGE_JSON_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
CI_WORKFLOW_PATH = WORKFLOWS_DIR / "build-provenance-ci.yml"
PROMOTION_WORKFLOW_PATH = WORKFLOWS_DIR / "nonprod-provenance-promotion.yml"

RUNTIME_MODULE_PATH = RELEASE_CONTROLS_DIR / "src" / "supply-chain-provenance.ts"
INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
UNIT_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "supply-chain-provenance.test.ts"

REHEARSAL_SHARED_PATH = RELEASE_TOOLS_DIR / "shared.ts"
REHEARSAL_RUN_PATH = RELEASE_TOOLS_DIR / "run-build-provenance-rehearsal.ts"
REHEARSAL_VERIFY_PATH = RELEASE_TOOLS_DIR / "verify-build-provenance.ts"
REHEARSAL_PROMOTE_PATH = RELEASE_TOOLS_DIR / "promote-build-artifact.ts"

EXPECTED_POLICY_TRIGGERS = {
    "CANONICAL_DIGEST_DRIFT",
    "PROVENANCE_SIGNATURE_MISMATCH",
    "ATTESTATION_MISSING",
    "ATTESTATION_SIGNATURE_MISMATCH",
    "ATTESTATION_SUBJECT_MISMATCH",
    "DIRTY_SOURCE_TREE",
    "DEPENDENCY_POLICY_BLOCKED",
    "PIPELINE_GATE_BLOCKED",
    "SBOM_DIGEST_MISMATCH",
    "MATERIAL_INPUT_MISSING",
    "RUNTIME_BINDING_DRIFT",
    "REPRODUCIBILITY_BLOCKED",
    "PROVENANCE_REVOKED",
    "PROVENANCE_SUPERSEDED",
}

EXPECTED_HTML_MARKERS = [
    "Build_Provenance_Cockpit",
    'data-testid="cockpit-masthead"',
    'data-testid="scenario-grid"',
    'data-testid="scenario-table"',
    'data-testid="policy-table"',
    'data-testid="scope-table"',
    'data-testid="inspector"',
]

EXPECTED_SPEC_MARKERS = [
    "filters scenarios by ring and decision state",
    "keeps inspector selection synchronized between the card grid and table",
    "renders reduced-motion and responsive layouts without dropping landmarks",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path):
    require(path.exists(), f"Missing JSON artifact: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"Missing CSV artifact: {path}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def assert_contains(path: Path, token: str) -> None:
    require(path.exists(), f"Missing file: {path}")
    source = path.read_text(encoding="utf-8")
    require(token in source, f"{path} is missing required token: {token}")


def main() -> None:
    for path in [
        SCHEMA_PATH,
        POLICY_MATRIX_PATH,
        SBOM_SCOPE_CATALOG_PATH,
        INTEGRITY_CATALOG_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        COCKPIT_PATH,
        SPEC_PATH,
        BUILD_SCRIPT_PATH,
        VALIDATOR_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        FOUNDATION_GATE_PATH,
        PACKAGE_JSON_PATH,
        PLAYWRIGHT_PACKAGE_PATH,
        CI_WORKFLOW_PATH,
        PROMOTION_WORKFLOW_PATH,
        RUNTIME_MODULE_PATH,
        INDEX_PATH,
        PUBLIC_API_TEST_PATH,
        UNIT_TEST_PATH,
        REHEARSAL_SHARED_PATH,
        REHEARSAL_RUN_PATH,
        REHEARSAL_VERIFY_PATH,
        REHEARSAL_PROMOTE_PATH,
    ]:
        require(path.exists(), f"Missing expected par_100 artifact: {path}")

    schema = read_json(SCHEMA_PATH)
    sbom_scope_catalog = read_json(SBOM_SCOPE_CATALOG_PATH)
    integrity_catalog = read_json(INTEGRITY_CATALOG_PATH)
    policy_rows = read_csv(POLICY_MATRIX_PATH)
    package_json = read_json(PACKAGE_JSON_PATH)
    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

    require(integrity_catalog["task_id"] == "par_100", "Integrity catalog task_id drifted.")
    require(
        integrity_catalog["visual_mode"] == "Build_Provenance_Cockpit",
        "Integrity cockpit visual mode drifted.",
    )
    require(
        integrity_catalog["summary"]["scenario_count"] >= 6,
        "Integrity scenario coverage is too small.",
    )
    require(
        integrity_catalog["summary"]["policy_rule_count"] == len(EXPECTED_POLICY_TRIGGERS),
        "Policy rule count drifted.",
    )
    require(
        integrity_catalog["summary"]["build_family_scope_count"] == len(sbom_scope_catalog["buildFamilies"]),
        "SBOM scope coverage drifted.",
    )
    scenario_ids = {row["scenarioId"] for row in integrity_catalog["provenanceScenarios"]}
    require(
        {
            "LOCAL_VERIFIED_BASELINE",
            "CI_PREVIEW_VERIFIED_BROWSER_SCOPE",
            "INTEGRATION_SIGNATURE_DRIFT_QUARANTINED",
            "PREPROD_BINDING_DRIFT_QUARANTINED",
            "PRODUCTION_REVOKED_WITHDRAWN",
            "PRODUCTION_SUPERSEDED_WITHDRAWN",
        }.issubset(scenario_ids),
        f"Integrity scenarios drifted: {scenario_ids}",
    )
    require(
        {"publishable", "blocked", "withdrawn"}
        == {row["publicationEligibilityState"] for row in integrity_catalog["provenanceScenarios"]},
        "Publication eligibility states drifted.",
    )
    require(
        schema["title"] == "Vecells Build Provenance Record",
        "Build provenance schema title drifted.",
    )
    require(
        set(schema["required"]) >= {
            "provenanceId",
            "builderIdentityRef",
            "sourceTreeState",
            "runtimeBindingProof",
            "attestationEnvelopeRefs",
            "verificationState",
            "runtimeConsumptionState",
            "canonicalDigest",
            "signature",
        },
        "Build provenance schema required fields drifted.",
    )
    require(
        sbom_scope_catalog["task_id"] == "par_100",
        "SBOM scope catalog task_id drifted.",
    )
    require(
        sbom_scope_catalog["sbom_format_choice"]["format"] == "CycloneDX 1.6 JSON",
        "SBOM format choice drifted.",
    )
    require(
        len(sbom_scope_catalog["buildFamilies"]) >= 8,
        "SBOM scope catalog lost build-family coverage.",
    )
    require(
        {row["trigger_ref"] for row in policy_rows} == EXPECTED_POLICY_TRIGGERS,
        "Policy matrix trigger set drifted.",
    )

    for token in EXPECTED_HTML_MARKERS:
        assert_contains(COCKPIT_PATH, token)
    for token in EXPECTED_SPEC_MARKERS:
        assert_contains(SPEC_PATH, token)

    assert_contains(RUNTIME_MODULE_PATH, "canonicalSupplyChainPolicyRules")
    assert_contains(RUNTIME_MODULE_PATH, "verifySupplyChainProvenance")
    assert_contains(RUNTIME_MODULE_PATH, "createSupplyChainVerificationSimulationHarness")
    assert_contains(REHEARSAL_SHARED_PATH, "attestation-envelopes.json")
    assert_contains(REHEARSAL_SHARED_PATH, "runtime-binding-proof.json")
    assert_contains(REHEARSAL_VERIFY_PATH, "supply-chain-audit-trail.json")
    assert_contains(REHEARSAL_PROMOTE_PATH, "runtime_consumption_")
    assert_contains(INDEX_PATH, 'export * from "./supply-chain-provenance";')
    assert_contains(PUBLIC_API_TEST_PATH, "createSupplyChainVerificationSimulationHarness")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "build_supply_chain_provenance_and_sbom.py")
    assert_contains(ROOT_SCRIPT_UPDATES_PATH, "validate:supply-chain-provenance")
    assert_contains(PACKAGE_JSON_PATH, "validate:supply-chain-provenance")
    assert_contains(FOUNDATION_GATE_PATH, "build-provenance-cockpit.spec.js")

    scripts = package_json["scripts"]
    require(
        "build_supply_chain_provenance_and_sbom.py" in scripts["codegen"],
        "Root codegen script does not include par_100 builder.",
    )
    require(
        scripts["validate:supply-chain-provenance"]
        == "python3 ./tools/analysis/validate_build_provenance_and_sbom.py",
        "validate:supply-chain-provenance script drifted.",
    )
    playwright_scripts = playwright_package["scripts"]
    require(
        "build-provenance-cockpit.spec.js" in playwright_scripts["build"],
        "Playwright build script lost par_100 cockpit coverage.",
    )
    require(
        "build-provenance-cockpit.spec.js" in playwright_scripts["test"],
        "Playwright test script lost par_100 cockpit coverage.",
    )


if __name__ == "__main__":
    main()
