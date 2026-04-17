#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TEMPLATE_DIR = ROOT / "tools" / "analysis" / "templates" / "par_081"

CASEBOOK_TEMPLATE_PATH = TEMPLATE_DIR / "reservation_queue_casebook.json"
MATRIX_TEMPLATE_PATH = TEMPLATE_DIR / "queue_rank_snapshot_matrix.csv"
MANIFEST_TEMPLATE_PATH = TEMPLATE_DIR / "reservation_fence_manifest.json"
DESIGN_TEMPLATE_PATH = TEMPLATE_DIR / "81_reservation_authority_and_queue_ranking_design.md"
RULES_TEMPLATE_PATH = TEMPLATE_DIR / "81_reservation_truth_and_queue_fairness_rules.md"
HTML_TEMPLATE_PATH = TEMPLATE_DIR / "81_reservation_queue_control_studio.html"
SPEC_TEMPLATE_PATH = TEMPLATE_DIR / "reservation-queue-control-studio.spec.js"

CASEBOOK_PATH = DATA_DIR / "reservation_queue_casebook.json"
MATRIX_PATH = DATA_DIR / "queue_rank_snapshot_matrix.csv"
MANIFEST_PATH = DATA_DIR / "reservation_fence_manifest.json"
DESIGN_DOC_PATH = DOCS_DIR / "81_reservation_authority_and_queue_ranking_design.md"
RULES_DOC_PATH = DOCS_DIR / "81_reservation_truth_and_queue_fairness_rules.md"
HTML_PATH = DOCS_DIR / "81_reservation_queue_control_studio.html"
SPEC_PATH = TESTS_DIR / "reservation-queue-control-studio.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

TASK_ID = "par_081"
VISUAL_MODE = "Reservation_Queue_Control_Studio"
GENERATED_AT = "2026-04-12T00:00:00+00:00"
CAPTURED_ON = "2026-04-12"


def read_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def copy_text(template: Path, target: Path) -> None:
    write_text(target, template.read_text(encoding="utf-8"))


def append_script_step(script: str, step: str) -> str:
    parts = [part.strip() for part in script.split("&&")]
    if step not in parts:
        parts.append(step)
    return " && ".join(parts)


def count_csv_rows(text: str) -> int:
    return len([line for line in text.splitlines()[1:] if line.strip()])


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts["build"] = append_script_step(
        scripts["build"], "node --check reservation-queue-control-studio.spec.js"
    )
    scripts["lint"] = append_script_step(
        scripts["lint"], "eslint reservation-queue-control-studio.spec.js"
    )
    scripts["test"] = append_script_step(
        scripts["test"], "node reservation-queue-control-studio.spec.js"
    )
    scripts["typecheck"] = append_script_step(
        scripts["typecheck"], "node --check reservation-queue-control-studio.spec.js"
    )
    scripts["e2e"] = append_script_step(
        scripts["e2e"], "node reservation-queue-control-studio.spec.js --run"
    )
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def write_payloads() -> None:
    casebook = read_json(CASEBOOK_TEMPLATE_PATH)
    manifest = read_json(MANIFEST_TEMPLATE_PATH)
    matrix_text = MATRIX_TEMPLATE_PATH.read_text(encoding="utf-8")

    reservation_cases = casebook["reservationCases"]
    queue_cases = casebook["queueCases"]

    casebook["task_id"] = TASK_ID
    casebook["generated_at"] = GENERATED_AT
    casebook["captured_on"] = CAPTURED_ON
    casebook["mode"] = VISUAL_MODE
    casebook["summary"] = {
        "scenario_count": len(reservation_cases) + len(queue_cases),
        "reservation_scenario_count": len(reservation_cases),
        "queue_scenario_count": len(queue_cases),
        "active_hold_count": sum(1 for row in reservation_cases if row["reservationState"] == "held"),
        "pending_confirmation_count": sum(
            1 for row in reservation_cases if row["reservationState"] == "pending_confirmation"
        ),
        "overload_critical_count": sum(
            1 for row in queue_cases if row["overloadState"] == "overload_critical"
        ),
        "conflict_blocked_count": sum(
            1 for row in reservation_cases if row["fenceState"] == "conflict_blocked"
        ),
        "assignment_ready_count": sum(1 for row in queue_cases if row["advisoryState"] == "ready"),
        "next_task_blocked_count": sum(
            1
            for row in queue_cases
            if isinstance(row["advisoryState"], str) and row["advisoryState"].startswith("blocked")
        ),
    }

    manifest["task_id"] = TASK_ID
    manifest["generated_at"] = GENERATED_AT
    manifest["captured_on"] = CAPTURED_ON
    manifest["mode"] = VISUAL_MODE
    manifest["summary"] = {
        "scenario_count": len(reservation_cases) + len(queue_cases),
        "reservation_case_count": len(reservation_cases),
        "queue_case_count": len(queue_cases),
        "active_fence_count": sum(
            1 for row in reservation_cases if row["fenceState"] in {"active", "conflict_blocked"}
        ),
        "blocked_fence_count": sum(
            1 for row in reservation_cases if row["fenceState"] == "conflict_blocked"
        ),
        "exclusive_fence_count": sum(
            1 for row in reservation_cases if row["truthState"] == "exclusive_held"
        ),
        "matrix_row_count": count_csv_rows(matrix_text),
        "canonical_event_count": len(manifest["canonical_events"]),
        "parallel_interface_gap_count": len(manifest["parallel_interface_gaps"]),
        "assignment_ready_count": sum(1 for row in queue_cases if row["advisoryState"] == "ready"),
        "next_task_blocked_count": sum(
            1
            for row in queue_cases
            if isinstance(row["advisoryState"], str) and row["advisoryState"].startswith("blocked")
        ),
    }

    write_json(CASEBOOK_PATH, casebook)
    write_json(MANIFEST_PATH, manifest)
    write_text(MATRIX_PATH, matrix_text)
    copy_text(DESIGN_TEMPLATE_PATH, DESIGN_DOC_PATH)
    copy_text(RULES_TEMPLATE_PATH, RULES_DOC_PATH)
    copy_text(HTML_TEMPLATE_PATH, HTML_PATH)
    copy_text(SPEC_TEMPLATE_PATH, SPEC_PATH)


def main() -> None:
    write_payloads()
    update_root_package()
    update_playwright_package()


if __name__ == "__main__":
    main()
