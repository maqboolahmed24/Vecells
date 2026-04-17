#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "architecture"
DATA_DIR = ROOT / "data" / "analysis"
APP_DIR = ROOT / "apps" / "governance-console" / "src"
PLAYWRIGHT_DIR = ROOT / "tests" / "playwright"

JSON_PATH = DATA_DIR / "governance_mock_projection_examples.json"
ROUTES_CSV_PATH = DATA_DIR / "governance_route_contract_seed.csv"
SCOPE_CSV_PATH = DATA_DIR / "governance_scope_and_signoff_matrix.csv"
GALLERY_PATH = DOCS_DIR / "119_governance_shell_gallery.html"
ROUTE_MAP_PATH = DOCS_DIR / "119_governance_shell_route_map.mmd"
DOC_PATHS = [
    DOCS_DIR / "119_governance_shell_seed_routes.md",
    DOCS_DIR / "119_governance_mock_projection_strategy.md",
    DOCS_DIR / "119_governance_scope_freeze_and_review_contracts.md",
]
APP_PATHS = [
    APP_DIR / "App.tsx",
    APP_DIR / "governance-shell-seed.model.ts",
    APP_DIR / "governance-shell-seed.tsx",
    APP_DIR / "governance-shell-seed.css",
]
SPEC_PATH = PLAYWRIGHT_DIR / "governance-shell-seed-routes.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = PLAYWRIGHT_DIR / "package.json"

REQUIRED_ROUTES = {
    "/ops/governance",
    "/ops/governance/tenants",
    "/ops/governance/authority-links",
    "/ops/governance/compliance",
    "/ops/governance/records",
    "/ops/access",
    "/ops/access/users",
    "/ops/access/roles",
    "/ops/access/reviews",
    "/ops/config",
    "/ops/config/bundles",
    "/ops/config/promotions",
    "/ops/comms",
    "/ops/comms/templates",
    "/ops/release",
}
REQUIRED_GALLERY_HOOKS = {
    "governance-shell-gallery-root",
    "governance-insignia",
    "governance-route-selector",
    "governance-runtime-selector",
    "governance-gallery-stage",
    "governance-route-table",
    "governance-scope-ribbon-diagram",
    "governance-approval-diagram",
    "governance-release-diagram",
}
REQUIRED_GAP_REFS = {
    "GAP_APPROVAL_TUPLE_DETAIL_RELEASE_WATCH_V1",
    "GAP_APPROVAL_TUPLE_DETAIL_BREAK_GLASS_REVIEW_V1",
    "GAP_SCOPE_TOKEN_DETAIL_ACCESS_PREVIEW_V1",
    "GAP_SCOPE_TOKEN_DETAIL_ELEVATION_RECOVERY_V1",
    "GAP_FUTURE_GOVERNANCE_DEPTH_RECORDS_DISPOSITION_V1",
    "GAP_FUTURE_GOVERNANCE_DEPTH_TEMPLATE_FALLBACK_MATRIX_V1",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    json_payload = json.loads(read_text(JSON_PATH))
    require(json_payload.get("task_id") == "par_119", "governance mock projection JSON task_id drifted")
    require(json_payload.get("summary", {}).get("route_count") == 15, "route count drifted")
    require(json_payload.get("summary", {}).get("mock_projection_count") == 6, "projection count drifted")
    require(set(json_payload.get("gap_resolutions", [])) == REQUIRED_GAP_REFS, "gap resolution set drifted")

    route_rows = list(csv.DictReader(ROUTES_CSV_PATH.read_text(encoding="utf-8").splitlines()))
    require(len(route_rows) == 15, "governance route contract CSV must contain 15 routes")
    require({row["route_path"] for row in route_rows} == REQUIRED_ROUTES, "route CSV paths drifted")
    require(
        all(row["continuity_key"] == "governance.review" for row in route_rows),
        "continuity key drifted away from governance.review",
    )

    scope_rows = list(csv.DictReader(SCOPE_CSV_PATH.read_text(encoding="utf-8").splitlines()))
    require(len(scope_rows) >= 8, "scope and signoff matrix is unexpectedly sparse")
    require(
        {"writable", "review_only", "scope_drift", "freeze_conflict"}
        <= {row["freeze_disposition"] for row in scope_rows},
        "scope and signoff matrix lost freeze disposition coverage",
    )

    gallery_html = read_text(GALLERY_PATH)
    for hook in REQUIRED_GALLERY_HOOKS:
        require(hook in gallery_html, f"gallery hook missing: {hook}")
    require(
        "../../data/analysis/governance_mock_projection_examples.json" in gallery_html,
        "gallery machine-readable link drifted",
    )

    route_map = read_text(ROUTE_MAP_PATH)
    for route in REQUIRED_ROUTES:
        require(route in route_map, f"route map missing route: {route}")

    for doc_path in DOC_PATHS:
        doc = read_text(doc_path)
        require("scope" in doc.lower(), f"architecture doc lacks scope context: {doc_path.name}")
        require("review" in doc.lower(), f"architecture doc lacks review context: {doc_path.name}")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    require("GovernanceShellSeedApp" in app_text, "governance app does not reference GovernanceShellSeedApp")
    require("/ops/config/promotions" in app_text, "promotion route missing from governance app sources")
    require("data-testid=\"governance-shell-root\"" in app_text, "governance shell root test id missing")
    require("ScopeRibbon" in app_text, "governance shell sources do not reference ScopeRibbon")

    root_package = json.loads(read_text(ROOT_PACKAGE_PATH))
    require(
        root_package["scripts"].get("validate:governance-shell-seed-routes")
        == "python3 ./tools/analysis/validate_governance_shell_seed_routes.py",
        "root package is missing validate:governance-shell-seed-routes",
    )
    require(
        "validate:governance-shell-seed-routes" in ROOT_SCRIPT_UPDATES,
        "root_script_updates.py is missing validate:governance-shell-seed-routes",
    )

    playwright_package = json.loads(read_text(PLAYWRIGHT_PACKAGE_PATH))
    for key in ["build", "lint", "test", "e2e"]:
        require(
            "governance-shell-seed-routes.spec.js" in playwright_package["scripts"].get(key, ""),
            f"Playwright package script {key} is missing governance-shell-seed-routes.spec.js.",
        )

    require(SPEC_PATH.exists(), "Playwright governance shell spec is missing")

    print(
        json.dumps(
            {
                "task_id": "par_119",
                "validated_routes": sorted(REQUIRED_ROUTES),
                "mock_projection_count": len(json_payload["examples"]),
                "gallery_hook_count": len(REQUIRED_GALLERY_HOOKS),
                "scope_matrix_row_count": len(scope_rows),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
