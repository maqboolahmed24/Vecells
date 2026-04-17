#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

ARCH_DOC = ROOT / "docs" / "architecture" / "231_triage_task_state_machine_and_lease_fencing.md"
SECURITY_DOC = ROOT / "docs" / "security" / "231_lease_fencing_and_stale_owner_recovery.md"
TRANSITION_CASES = ROOT / "data" / "analysis" / "231_transition_cases.csv"
STALE_OWNER_CASES = ROOT / "data" / "analysis" / "231_stale_owner_and_takeover_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_TRIAGE_KERNEL.json"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "110_phase3_triage_task_kernel.sql"
DOMAIN_KERNEL = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-triage-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
COMMAND_API = ROOT / "services" / "command-api" / "src" / "phase3-triage-kernel.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-triage-kernel.test.ts"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "triage-task-state-machine.integration.test.js"
DOMAIN_KERNEL_SHARED = ROOT / "packages" / "domain-kernel" / "src" / "phase3-triage-fencing.ts"


def fail(message: str) -> None:
    raise SystemExit(f"[231-triage-kernel] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(220, 231):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} must be complete before 231")
    if not re.search(
        r"^- \[[Xx-]\] par_231_phase3_track_backend_build_triage_task_state_machine_and_lease_fencing",
        checklist,
        re.MULTILINE,
    ):
        fail("task 231 must be claimed or complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "Phase 3 triage kernel",
            "RequestLifecycleLease",
            "synthetic command witnesses",
            "phase3_task_transition_journal",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "ownershipEpoch",
            "fencingToken",
            "lineageFenceEpoch",
            "StaleOwnershipRecoveryRecord",
            "LeaseTakeoverRecord",
        ],
    )


def validate_analysis() -> None:
    transitions = load_csv(TRANSITION_CASES)
    if len(transitions) != 21:
        fail("231_transition_cases.csv must enumerate all 21 frozen legal transitions")
    stale_cases = load_csv(STALE_OWNER_CASES)
    if len(stale_cases) < 4:
        fail("231_stale_owner_and_takeover_cases.csv must cover release, break, takeover, and stale-write cases")
    gap_log = load_json(GAP_LOG)
    gap_ids = {entry["gapId"] for entry in gap_log.get("gaps", [])}
    expected = {
        "GAP_231_SYNTHETIC_COMMAND_WITNESS_FOR_UNOWNED_STATES",
        "GAP_231_INTERNAL_ACTION_SCOPE_EXTENSION",
    }
    if gap_ids != expected:
        fail("PARALLEL_INTERFACE_GAP_PHASE3_TRIAGE_KERNEL.json drifted from the expected seam set")


def validate_source_files() -> None:
    require_text(
        DOMAIN_KERNEL,
        [
            "assertPresentedTaskTuple",
            "nextLineageFenceEpoch",
            "takeOverStaleTask",
            "buildTransitionJournalEntry",
            "Phase3TriageTransitionGuard",
        ],
    )
    require_text(DOMAIN_INDEX, ['export * from "./phase3-triage-kernel";'])
    require_text(
        DOMAIN_KERNEL_SHARED,
        [
            "Phase3LeaseFenceTuple",
            "Phase3CommandWitness",
            "assertPhase3FenceAdvance",
        ],
    )
    require_text(
        COMMAND_API,
        [
            "createPhase3TriageKernelApplication",
            "issueSettledCommand",
            "buildSyntheticCommandWitness",
            "markStaleOwnerDetected",
            "takeOverStaleTask",
        ],
    )
    require_text(
        MIGRATION,
        [
            "CREATE TABLE IF NOT EXISTS phase3_triage_tasks",
            "CREATE TABLE IF NOT EXISTS phase3_review_sessions",
            "CREATE TABLE IF NOT EXISTS phase3_task_launch_contexts",
            "CREATE TABLE IF NOT EXISTS phase3_task_command_settlements",
            "CREATE TABLE IF NOT EXISTS phase3_task_transition_journal",
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "rejects stale ownership epochs and stale fencing tokens on claim",
            "does not allow heartbeat to silently revive a released review session",
            "keeps release audit append-only",
            "stale-owner recovery explicit and traceable",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase 3 triage kernel application seam",
            "release through lease and settlement backbones",
            "stale-owner recovery and takeover records explicitly",
        ],
    )


def validate_script_registry() -> None:
    require_text(PACKAGE_JSON, ['"validate:231-triage-kernel": "python3 ./tools/analysis/validate_231_triage_kernel.py"'])
    require_text(ROOT_SCRIPT_UPDATES, ['"validate:231-triage-kernel": "python3 ./tools/analysis/validate_231_triage_kernel.py"'])


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_analysis()
    validate_source_files()
    validate_script_registry()
    print("231 triage kernel validation passed.")


if __name__ == "__main__":
    main()
