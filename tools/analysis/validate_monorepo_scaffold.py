#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOOLS_DIR = ROOT / "tools" / "analysis"
TESTS_DIR = ROOT / "tests" / "playwright"

TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
SCAFFOLD_MANIFEST_PATH = DATA_DIR / "monorepo_scaffold_manifest.json"
PLAN_PATH = DOCS_DIR / "42_monorepo_scaffold_plan.md"
GALLERY_PATH = DOCS_DIR / "42_foundation_shell_gallery.html"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PNPM_WORKSPACE_PATH = ROOT / "pnpm-workspace.yaml"
NX_PATH = ROOT / "nx.json"
ROOT_TSCONFIG_PATH = ROOT / "tsconfig.base.json"
ESLINT_PATH = ROOT / "eslint.config.mjs"
VITEST_WORKSPACE_PATH = ROOT / "vitest.workspace.ts"
ENV_EXAMPLE_PATH = ROOT / ".env.example"
DEV_BOOTSTRAP_PATH = ROOT / "tools" / "dev-bootstrap" / "index.mjs"
SPEC_PATH = TESTS_DIR / "foundation-shell-gallery.spec.js"

REQUIRED_ROOT_SCRIPTS = {
    "bootstrap",
    "build",
    "lint",
    "typecheck",
    "test",
    "dev",
    "check",
    "codegen",
    "test:e2e",
    "verify:release",
    "validate:topology",
    "validate:scaffold",
}

REQUIRED_WORKSPACE_SCRIPTS = {"build", "lint", "test", "typecheck"}
EXPECTED_NON_WORKSPACE_IDS = {"docs_architecture", "tool_analysis", "tool_architecture"}
HTML_MARKERS = [
    'data-testid="gallery-shell"',
    'data-testid="shell-rail"',
    'data-testid="ownership-strip"',
    'data-testid="shell-preview"',
    'data-testid="parity-table"',
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def legacy_noncanonical_paths(topology_paths: set[str]) -> list[str]:
    results: list[str] = []
    for parent in (ROOT / "apps", ROOT / "services"):
        if not parent.exists():
            continue
        for child in sorted(parent.iterdir()):
            if child.is_dir():
                repo_path = str(child.relative_to(ROOT))
                if repo_path not in topology_paths:
                    results.append(repo_path)
    return results


def ensure_deliverables() -> None:
    required = [
        TOPOLOGY_PATH,
        SCAFFOLD_MANIFEST_PATH,
        PLAN_PATH,
        GALLERY_PATH,
        ROOT_PACKAGE_PATH,
        PNPM_WORKSPACE_PATH,
        NX_PATH,
        ROOT_TSCONFIG_PATH,
        ESLINT_PATH,
        VITEST_WORKSPACE_PATH,
        ENV_EXAMPLE_PATH,
        DEV_BOOTSTRAP_PATH,
        SPEC_PATH,
        ROOT / "services" / "adapter-simulators" / "manifests" / "README.md",
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_042 deliverables:\n" + "\n".join(missing))


def validate_root_scripts() -> None:
    package_json = load_json(ROOT_PACKAGE_PATH)
    scripts = package_json.get("scripts", {})
    assert_true(package_json["packageManager"] == "pnpm@10.23.0", "Root package manager drifted")
    assert_true(REQUIRED_ROOT_SCRIPTS.issubset(scripts), "Root package lost canonical scripts")

    pnpm_workspace = PNPM_WORKSPACE_PATH.read_text()
    assert_true("mock-" not in pnpm_workspace, "pnpm workspace should not include legacy mock directories")
    assert_true("packages/domains/*" in pnpm_workspace, "pnpm workspace lost domain package glob")


def validate_manifest() -> dict[str, Any]:
    topology = load_json(TOPOLOGY_PATH)
    manifest = load_json(SCAFFOLD_MANIFEST_PATH)

    assert_true(manifest["task_id"] == "seq_042", "Scaffold manifest task id drifted")
    assert_true(manifest["visual_mode"] == "Foundations_Gallery", "Scaffold manifest visual mode drifted")

    topology_paths = {artifact["repo_path"] for artifact in topology["artifacts"]}
    expected_legacy = legacy_noncanonical_paths(topology_paths)
    assert_true(manifest["legacy_exclusions"] == expected_legacy, "Legacy exclusion inventory drifted")
    assert_true(manifest["summary"]["legacy_exclusion_count"] == len(expected_legacy), "Legacy exclusion count drifted")

    workspace_entries = manifest["workspace_entries"]
    non_workspace_entries = manifest["non_workspace_entries"]

    expected_workspace_count = (
        topology["summary"]["app_count"]
        + topology["summary"]["service_count"]
        + topology["summary"]["package_count"]
        + 2
    )
    assert_true(manifest["summary"]["workspace_enabled_count"] == expected_workspace_count, "Workspace count drifted")
    assert_true(len(workspace_entries) == expected_workspace_count, "Workspace entry length drifted")
    assert_true(len(non_workspace_entries) == 3, "Non-workspace entry count drifted")
    assert_true({entry["artifact_id"] for entry in non_workspace_entries} == EXPECTED_NON_WORKSPACE_IDS, "Non-workspace ids drifted")
    assert_true(manifest["summary"]["shell_gallery_count"] == 7, "Shell gallery count drifted")

    return manifest


def validate_workspace_entries(manifest: dict[str, Any]) -> None:
    for entry in manifest["workspace_entries"]:
        repo_root = ROOT / entry["repo_path"]
        package_json_path = repo_root / "package.json"
        project_json_path = repo_root / "project.json"
        readme_path = repo_root / "README.md"

        assert_true(package_json_path.exists(), f"Missing package.json for {entry['repo_path']}")
        assert_true(project_json_path.exists(), f"Missing project.json for {entry['repo_path']}")
        assert_true(readme_path.exists(), f"Missing README for {entry['repo_path']}")

        package_json = load_json(package_json_path)
        scripts = set(package_json.get("scripts", {}).keys())
        assert_true(REQUIRED_WORKSPACE_SCRIPTS.issubset(scripts), f"Workspace scripts drifted for {entry['repo_path']}")

        if entry["artifact_type"] == "app":
            app_source = (repo_root / "src" / "App.tsx").read_text()
            marker = entry["root_marker"]
            assert_true(marker in app_source, f"App source lost root marker {marker}")
            assert_true('@vecells/design-system' in app_source, f"App source lost design-system import for {entry['repo_path']}")
            assert_true('@vecells/api-contracts' in app_source, f"App source lost api-contracts import for {entry['repo_path']}")

        if entry["repo_path"] == "packages/design-system":
            package_json = load_json(package_json_path)
            exports = package_json.get("exports", {})
            assert_true(exports.get(".") == "./src/index.tsx", "Design system export drifted")
            assert_true(exports.get("./foundation.css") == "./src/foundation.css", "Design system CSS export drifted")
            assert_true((repo_root / "src" / "index.tsx").exists(), "Design system JSX entry missing")
            assert_true((repo_root / "src" / "foundation.css").exists(), "Design system CSS missing")


def validate_docs_and_gallery(manifest: dict[str, Any]) -> None:
    plan_text = PLAN_PATH.read_text()
    html = GALLERY_PATH.read_text()

    assert_true("pnpm + Nx" in plan_text, "Scaffold plan lost toolchain statement")
    assert_true("Legacy directories intentionally excluded" in plan_text, "Scaffold plan lost exclusion section")
    assert_true("Foundations_Gallery" in html, "Gallery lost visual mode label")
    assert_true("<title>42 Foundation Shell Gallery</title>" in html, "Gallery title drifted")
    for marker in HTML_MARKERS:
        assert_true(marker in html, f"Gallery missing HTML marker {marker}")

    shell_slugs = [shell["slug"] for shell in manifest["shell_gallery"]["shells"]]
    for slug in shell_slugs:
        assert_true(slug in html, f"Gallery lost shell slug payload for {slug}")
        assert_true(f'{slug}-shell-root' in html, f"Gallery lost preview root marker for {slug}")


def main() -> None:
    ensure_deliverables()
    validate_root_scripts()
    manifest = validate_manifest()
    validate_workspace_entries(manifest)
    validate_docs_and_gallery(manifest)
    print("seq_042 validation passed")


if __name__ == "__main__":
    main()
