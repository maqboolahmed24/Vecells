#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
INFRA_DIR = ROOT / "infra" / "secrets-kms"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"
TOOLS_DIR = ROOT / "tools" / "analysis"

MANIFEST_PATH = DATA_DIR / "secret_class_manifest.json"
KEY_HIERARCHY_PATH = DATA_DIR / "key_hierarchy_manifest.json"
ROTATION_MATRIX_PATH = DATA_DIR / "rotation_policy_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "89_secrets_kms_and_rotation_design.md"
RULES_DOC_PATH = DOCS_DIR / "89_secret_class_and_access_boundary_rules.md"
ATLAS_PATH = DOCS_DIR / "89_secret_and_key_rotation_atlas.html"
BOOTSTRAP_SCRIPT_PATH = INFRA_DIR / "local" / "bootstrap-secrets-kms.mjs"
BREAK_GLASS_POLICY_PATH = INFRA_DIR / "local" / "break-glass-policy.json"
ACCESS_LOG_POLICY_PATH = INFRA_DIR / "local" / "access-log-policy.json"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "secrets-kms-smoke.test.mjs"
SPEC_PATH = PLAYWRIGHT_DIR / "secret-and-key-rotation-atlas.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_DIR / "root_script_updates.py"

REQUIRED_HTML_MARKERS = {
    "hierarchy-diagram",
    "access-matrix",
    "rotation-timeline",
    "manifest-table",
    "policy-table",
    "inspector",
}

REQUIRED_SERVICE_BINDINGS = {
    "api-gateway",
    "command-api",
    "projection-worker",
    "notification-worker",
    "adapter-simulators",
}

FORBIDDEN_LEAK_PATTERNS = [
    "BEGIN PRIVATE KEY",
    "synthetic:",
    "master_key_b64",
]


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    manifest = read_json(MANIFEST_PATH)
    key_hierarchy = read_json(KEY_HIERARCHY_PATH)
    rotation_rows = read_csv(ROTATION_MATRIX_PATH)
    atlas = ATLAS_PATH.read_text()

    require(manifest["task_id"] == "par_089", "Secret class manifest task_id drifted.")
    require(key_hierarchy["task_id"] == "par_089", "Key hierarchy manifest task_id drifted.")
    require(manifest["summary"]["secret_class_count"] == len(manifest["secret_classes"]), "Secret class summary drifted.")
    require(manifest["summary"]["service_binding_count"] == len(manifest["service_secret_bindings"]), "Service binding summary drifted.")
    require(manifest["summary"]["environment_backend_count"] == len(manifest["environment_backends"]), "Environment backend summary drifted.")
    require(manifest["summary"]["access_policy_count"] == len(manifest["access_policies"]), "Access policy summary drifted.")
    require(key_hierarchy["summary"]["root_key_count"] == len(key_hierarchy["root_keys"]), "Root key summary drifted.")
    require(key_hierarchy["summary"]["branch_key_count"] == len(key_hierarchy["branch_keys"]), "Branch key summary drifted.")
    require(len(rotation_rows) == len(manifest["secret_classes"]), "Rotation policy rows no longer match secret class count.")

    service_names = {row["service_name"] for row in manifest["service_secret_bindings"]}
    require(service_names == REQUIRED_SERVICE_BINDINGS, "Service secret bindings drifted.")

    secret_refs = {row["secret_class_ref"] for row in manifest["secret_classes"]}
    rotation_refs = {row["secret_class_ref"] for row in rotation_rows}
    require(secret_refs == rotation_refs, "Rotation matrix secret refs drifted from the manifest.")

    key_refs = {row["key_ref"] for row in key_hierarchy["branch_keys"]}
    for secret in manifest["secret_classes"]:
        require(secret["key_branch_ref"] in key_refs, f"Unknown key branch ref for {secret['secret_class_ref']}.")
        require(secret["browser_exposure"] == "never", f"{secret['secret_class_ref']} became browser-exposed.")
        require(secret["build_exposure"] == "never", f"{secret['secret_class_ref']} became build-exposed.")

    for marker in REQUIRED_HTML_MARKERS:
        require(marker in atlas, f"Atlas lost required data-testid marker {marker}.")

    spec_source = SPEC_PATH.read_text()
    for probe in [
        "filter behavior and synchronized selection",
        "keyboard navigation and focus management",
        "reduced-motion handling",
        "responsive layout at desktop and tablet widths",
        "accessibility smoke checks and landmark verification",
        "verified, overdue, revoked, and break-glass states stay distinct",
    ]:
        require(probe in spec_source, f"Spec is missing expected coverage text: {probe}")

    for path in [
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        ATLAS_PATH,
        BOOTSTRAP_SCRIPT_PATH,
        BREAK_GLASS_POLICY_PATH,
        ACCESS_LOG_POLICY_PATH,
        SMOKE_TEST_PATH,
        SPEC_PATH,
    ]:
        require(path.exists(), f"Missing required 089 deliverable: {path}")

    combined = "\n".join(
        [
            MANIFEST_PATH.read_text(),
            KEY_HIERARCHY_PATH.read_text(),
            ROTATION_MATRIX_PATH.read_text(),
            DESIGN_DOC_PATH.read_text(),
            RULES_DOC_PATH.read_text(),
            ATLAS_PATH.read_text(),
        ]
    )
    for pattern in FORBIDDEN_LEAK_PATTERNS:
        require(pattern not in combined, f"Detected forbidden secret leak pattern: {pattern}")

    root_script_updates = ROOT_SCRIPT_UPDATES_PATH.read_text()
    for token in [
        "validate:secrets-kms-and-rotation",
        "validate_secrets_kms_and_rotation.py",
    ]:
        require(token in root_script_updates, f"root_script_updates.py is missing required token: {token}")

    root_package = read_json(ROOT_PACKAGE_PATH)
    scripts = root_package["scripts"]
    require(
        "pnpm validate:secrets-kms-and-rotation" in scripts["bootstrap"],
        "Root bootstrap script is missing validate:secrets-kms-and-rotation.",
    )
    require(
        "pnpm validate:secrets-kms-and-rotation" in scripts["check"],
        "Root check script is missing validate:secrets-kms-and-rotation.",
    )
    require(
        scripts["validate:secrets-kms-and-rotation"]
        == "python3 ./tools/analysis/validate_secrets_kms_and_rotation.py",
        "Root validate:secrets-kms-and-rotation script drifted.",
    )

    playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    playwright_scripts = playwright_package["scripts"]
    for key, token in {
        "build": "node --check secret-and-key-rotation-atlas.spec.js",
        "lint": "eslint secret-and-key-rotation-atlas.spec.js",
        "test": "node secret-and-key-rotation-atlas.spec.js",
        "typecheck": "node --check secret-and-key-rotation-atlas.spec.js",
        "e2e": "node secret-and-key-rotation-atlas.spec.js --run",
    }.items():
        require(token in playwright_scripts[key], f"Playwright package script {key} is missing {token}.")

    print("par_089 secrets, kms, and rotation validation passed")


if __name__ == "__main__":
    main()
