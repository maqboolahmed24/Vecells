#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOOLS_DIR = ROOT / "tools" / "analysis"

TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
MANIFEST_PATH = DATA_DIR / "service_interface_manifest.json"
MAP_PATH = DOCS_DIR / "43_service_scaffold_map.md"
SEQUENCE_PATH = DOCS_DIR / "43_runtime_service_sequence.mmd"
ROOT_PACKAGE_PATH = ROOT / "package.json"
BUILDER_PATH = TOOLS_DIR / "build_runtime_service_scaffold.py"

REQUIRED_ROOT_SCRIPTS = {"bootstrap", "check", "codegen", "validate:services"}
REQUIRED_SERVICE_FILES = {
    "src/config.ts",
    "src/runtime.ts",
    "src/service-definition.ts",
    "src/index.ts",
    "tests/config.test.js",
    "tests/runtime.integration.test.js",
    "package.json",
    "README.md",
}
REQUIRED_PACKAGE_SCRIPTS = {"build", "lint", "test", "typecheck", "dev"}
REQUIRED_DOC_MARKERS = [
    "43 Service Scaffold Map",
    "Runtime Conventions",
    "api-gateway",
    "command-api",
    "projection-worker",
    "notification-worker",
]
REQUIRED_SEQUENCE_MARKERS = [
    "participant Gateway as API Gateway",
    "participant Command as Command API",
    "participant Projection as Projection Worker",
    "participant Notification as Notification Worker",
    "Provider-->>Notification: Delivery callback or permanent failure signal",
]
IMPORT_PATTERN = re.compile(r'from "(?P<module>@vecells/[^"]+)"')


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def load_topology() -> dict[str, dict[str, Any]]:
    topology = read_json(TOPOLOGY_PATH)
    return {artifact["artifact_id"]: artifact for artifact in topology["artifacts"]}


def rule_allows_package(rule: str, package_name: str) -> bool:
    normalized = rule.split(" (", 1)[0]
    mapping = {
        "packages/api-contracts": "@vecells/api-contracts",
        "packages/authz-policy": "@vecells/authz-policy",
        "packages/observability": "@vecells/observability",
        "packages/release-controls": "@vecells/release-controls",
        "packages/event-contracts": "@vecells/event-contracts",
        "packages/domain-kernel": "@vecells/domain-kernel",
        "packages/fhir-mapping": "@vecells/fhir-mapping",
    }
    if normalized == "packages/domains/*":
        return package_name.startswith("@vecells/domain-")
    if normalized.startswith("packages/domains/"):
        domain_slug = normalized.split("/", 2)[2].replace("_", "-")
        return package_name == f"@vecells/domain-{domain_slug}"
    return mapping.get(normalized) == package_name


def validate_root_scripts() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.get("scripts", {})
    assert_true(REQUIRED_ROOT_SCRIPTS.issubset(scripts), "Root package lost seq_043 service scripts")
    assert_true(
        "build_runtime_service_scaffold.py" in scripts["codegen"],
        "Root codegen no longer regenerates seq_043 service scaffolds",
    )


def validate_outputs_exist() -> None:
    required = [TOPOLOGY_PATH, MANIFEST_PATH, MAP_PATH, SEQUENCE_PATH, BUILDER_PATH, Path(__file__)]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_043 deliverables:\n" + "\n".join(missing))


def validate_docs() -> None:
    map_text = MAP_PATH.read_text()
    sequence_text = SEQUENCE_PATH.read_text()
    for marker in REQUIRED_DOC_MARKERS:
        assert_true(marker in map_text, f"Service scaffold map missing marker {marker}")
    for marker in REQUIRED_SEQUENCE_MARKERS:
        assert_true(marker in sequence_text, f"Runtime sequence doc missing marker {marker}")


def validate_manifest(topology_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    manifest = read_json(MANIFEST_PATH)
    assert_true(manifest["task_id"] == "seq_043", "Service scaffold manifest task id drifted")
    assert_true(manifest["summary"]["service_count"] == 4, "Service scaffold summary count drifted")
    assert_true(len(manifest["services"]) == 4, "Service manifest service list drifted")

    service_ids = {service["artifact_id"] for service in manifest["services"]}
    assert_true(
        service_ids == {
            "service_api_gateway",
            "service_command_api",
            "service_projection_worker",
            "service_notification_worker",
        },
        "Service manifest artifact coverage drifted",
    )

    for service in manifest["services"]:
        topology = topology_by_id[service["artifact_id"]]
        assert_true(
            service["owner_context_code"] == topology["owner_context_code"],
            f"Owner context drifted for {service['service_slug']}",
        )
        assert_true(
            service["forbidden_dependency_rules"] == topology["forbidden_dependencies"],
            f"Forbidden dependency rules drifted for {service['service_slug']}",
        )
        for package_name in service["dependency_packages"]:
            allowed = any(rule_allows_package(rule, package_name) for rule in service["allowed_dependency_rules"])
            assert_true(allowed, f"{service['service_slug']} dependency {package_name} violates allowed dependency rules")

    return manifest


def validate_service_workspace(service: dict[str, Any]) -> None:
    repo_root = ROOT / service["repo_path"]
    missing = [item for item in REQUIRED_SERVICE_FILES if not (repo_root / item).exists()]
    assert_true(not missing, f"Missing service scaffold files for {service['service_slug']}:\n" + "\n".join(missing))

    package_json = read_json(repo_root / "package.json")
    scripts = set(package_json.get("scripts", {}).keys())
    assert_true(REQUIRED_PACKAGE_SCRIPTS.issubset(scripts), f"Service scripts drifted for {service['service_slug']}")

    readme = (repo_root / "README.md").read_text()
    for marker in ("## Purpose", "## Truth Boundary", "## Route Catalog", "## Environment Contract"):
        assert_true(marker in readme, f"README missing {marker} for {service['service_slug']}")

    imports: set[str] = set()
    for relative_path in ("src/config.ts", "src/runtime.ts", "src/service-definition.ts", "src/index.ts"):
        text = (repo_root / relative_path).read_text()
        imports.update(match.group("module") for match in IMPORT_PATTERN.finditer(text))
        if relative_path == "src/runtime.ts":
            for marker in ('"/health"', '"/ready"', '"/manifest"'):
                assert_true(marker in text, f"Runtime source missing marker {marker} for {service['service_slug']}")
            has_literal_headers = '"x-correlation-id"' in text and '"x-trace-id"' in text
            has_serializer = "serializeCorrelationHeaders(correlation)" in text
            assert_true(
                has_literal_headers or has_serializer,
                f"Runtime source missing correlation header propagation marker for {service['service_slug']}",
            )

    assert_true(
        imports.issubset(set(service["dependency_packages"])),
        f"Service imports drifted beyond manifest dependencies for {service['service_slug']}: {sorted(imports - set(service['dependency_packages']))}",
    )
    for module_name in imports:
        assert_true(module_name.count("/") == 1, f"Deep private import detected in {service['service_slug']}: {module_name}")

    if service["service_slug"] == "notification-worker":
        definition_text = (repo_root / "src" / "service-definition.ts").read_text()
        assert_true("env-ref-only" in definition_text, "Notification worker lost env-ref-only secret boundary posture")


def main() -> None:
    validate_outputs_exist()
    validate_root_scripts()
    validate_docs()
    topology_by_id = load_topology()
    manifest = validate_manifest(topology_by_id)
    for service in manifest["services"]:
        validate_service_workspace(service)
    print("seq_043 validation passed")


if __name__ == "__main__":
    main()
