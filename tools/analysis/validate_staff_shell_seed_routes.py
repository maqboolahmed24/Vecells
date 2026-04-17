#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = ROOT / "data" / "analysis" / "staff_mock_projection_examples.json"
ROUTE_CSV_PATH = ROOT / "data" / "analysis" / "staff_route_contract_seed.csv"
QUEUE_CSV_PATH = ROOT / "data" / "analysis" / "staff_queue_state_and_anchor_matrix.csv"
GALLERY_PATH = ROOT / "docs" / "architecture" / "116_staff_shell_gallery.html"
ROUTE_MAP_PATH = ROOT / "docs" / "architecture" / "116_staff_shell_route_map.mmd"
DOC_PATHS = [
    ROOT / "docs" / "architecture" / "116_staff_shell_seed_routes.md",
    ROOT / "docs" / "architecture" / "116_staff_mock_projection_strategy.md",
    ROOT / "docs" / "architecture" / "116_staff_queue_and_task_continuity_contracts.md",
]
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "App.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.css",
]

REQUIRED_ROUTES = {
    "/workspace",
    "/workspace/queue/:queueKey",
    "/workspace/task/:taskId",
    "/workspace/task/:taskId/more-info",
    "/workspace/task/:taskId/decision",
    "/workspace/approvals",
    "/workspace/escalations",
    "/workspace/changed",
    "/workspace/search",
    "/workspace/support-handoff",
}
REQUIRED_GALLERY_HOOKS = {
    "staff-shell-gallery-root",
    "staff-shell-insignia",
    "staff-summary-strip",
    "staff-gallery-stage",
    "staff-route-selector",
    "staff-runtime-selector",
    "staff-seed-route-table",
    "route-adjacency-diagram",
    "queue-continuity-diagram",
    "focus-protection-diagram",
}
REQUIRED_GAP_REFS = {
    "GAP_RESOLUTION_STAFF_COPY_APPROVAL_PREVIEW",
    "GAP_BOUNDARY_SUPPORT_SHELL_READ_ONLY_STUB",
    "GAP_FUTURE_TASK_SPECIALIZATION_MORE_INFO_FRAME",
    "GAP_FUTURE_TASK_SPECIALIZATION_DECISION_FRAME",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    json_payload = json.loads(read_text(JSON_PATH))
    require(json_payload.get("task_id") == "par_116", "staff mock projection JSON task_id drifted")
    require(json_payload.get("summary", {}).get("route_count") == 10, "route count drifted")
    require(json_payload.get("summary", {}).get("mock_projection_count") == 5, "projection count drifted")
    require(json_payload.get("summary", {}).get("runtime_tuple_count") == 5, "runtime tuple count drifted")
    require(set(json_payload.get("gap_resolutions", [])) == REQUIRED_GAP_REFS, "gap resolution set drifted")

    route_rows = list(csv.DictReader(ROUTE_CSV_PATH.read_text(encoding="utf-8").splitlines()))
    require(len(route_rows) == 10, "staff route contract CSV must contain 10 routes")
    require({row["route_path"] for row in route_rows} == REQUIRED_ROUTES, "route CSV paths drifted")
    require(
        any(row["gap_resolution_ref"] == "GAP_BOUNDARY_SUPPORT_SHELL_READ_ONLY_STUB" for row in route_rows),
        "support boundary gap resolution missing from route CSV",
    )

    queue_rows = list(csv.DictReader(QUEUE_CSV_PATH.read_text(encoding="utf-8").splitlines()))
    require(len(queue_rows) == 5, "queue state matrix must contain 5 task rows")
    require(
        {row["task_id"] for row in queue_rows}
        == {"task-311", "task-208", "task-412", "task-507", "task-118"},
        "queue state matrix task set drifted",
    )

    gallery_html = read_text(GALLERY_PATH)
    for hook in REQUIRED_GALLERY_HOOKS:
      require(hook in gallery_html, f"gallery hook missing: {hook}")
    require("../../data/analysis/staff_mock_projection_examples.json" in gallery_html, "gallery data fetch path drifted")

    route_map = read_text(ROUTE_MAP_PATH)
    for route in REQUIRED_ROUTES:
        require(route in route_map, f"route map missing route: {route}")

    for doc_path in DOC_PATHS:
        doc = read_text(doc_path)
        require("shell" in doc.lower(), f"architecture doc lacks shell context: {doc_path.name}")
        require("queue" in doc.lower(), f"architecture doc lacks queue context: {doc_path.name}")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    require("StaffShellSeedApp" in app_text, "clinical workspace app does not reference StaffShellSeedApp")
    require("/workspace/support-handoff" in app_text, "bounded support handoff route missing from app sources")
    require("data-testid=\"staff-shell-root\"" in app_text, "staff shell root test id missing")

    print(
        json.dumps(
            {
                "task_id": "par_116",
                "validated_routes": sorted(REQUIRED_ROUTES),
                "mock_projection_count": len(json_payload["mock_projections"]),
                "runtime_tuple_count": len(json_payload["runtime_tuples"]),
                "gallery_hook_count": len(REQUIRED_GALLERY_HOOKS),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
