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

ARCH_DOC = ROOT / "docs" / "architecture" / "251_admin_resolution_case_and_policy_kernel.md"
SECURITY_DOC = ROOT / "docs" / "security" / "251_admin_resolution_case_waiting_and_completion_controls.md"
OPERATIONS_DOC = ROOT / "docs" / "operations" / "251_admin_resolution_subtype_and_completion_runbook.md"
CONTRACT = ROOT / "data" / "contracts" / "251_admin_resolution_policy_contract.json"
MATRIX = ROOT / "data" / "analysis" / "251_subtype_waiting_and_completion_matrix.csv"
ROUTED_CASES = ROOT / "data" / "analysis" / "251_routed_admin_task_reclassification_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "251_gap_log.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_ADMIN_EXPECTATION_TEMPLATES.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-admin-resolution-policy-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-admin-resolution-policy-kernel.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-admin-resolution-policy.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "127_phase3_admin_resolution_case_policy_kernel.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-admin-resolution-policy.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[251-admin-resolution-policy-kernel] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    if not re.search(
        r"^- \[[Xx-]\] par_251_phase3_track_backend_build_admin_resolution_case_profiles_waiting_reason_and_completion_artifact_policies",
        checklist,
        re.MULTILINE,
    ):
        fail("task 251 checklist entry is missing")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "`AdminResolutionCase`",
            "`AdminResolutionSubtypeProfile` is a first-class registry row.",
            "`routed_admin_task` is a bounded ingress bucket.",
            "`AdminResolutionCompletionArtifact` is typed proof",
            "`254` still owns final settlement",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "Generic waiting and generic completion are forbidden.",
            "The current boundary tuple is the sole authority",
            "No typed artifact means no valid completion.",
            "Raw artifact URLs are forbidden.",
            "Patient expectation template bodies are intentionally not inlined here.",
        ],
    )
    require_text(
        OPERATIONS_DOC,
        [
            "fetch subtype policy",
            "open case through `workspace_task_open_admin_resolution_case`",
            "reclassify subtype if the ingress bucket is `routed_admin_task`",
            "record completion artifact with typed evidence",
            "The completion artifact does not settle the overall case.",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "251.phase3.admin-resolution-case-policy.v1":
        fail("251 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3AdminResolutionPolicyApplication":
        fail("251 contract serviceName drifted")
    if len(contract.get("routeIds", [])) != 7:
        fail("251 contract routeIds drifted")
    if contract.get("downstreamConsumers") != [
        "252_dependency_and_reopen_evaluation",
        "253_patient_expectation_templates",
        "254_admin_resolution_settlement",
    ]:
        fail("251 contract downstreamConsumers drifted")

    rows = load_csv(MATRIX)
    if {row["caseId"] for row in rows} != {
        "REGISTRATION_IDENTITY_WAIT",
        "FORM_PATIENT_RETURN",
        "RESULT_NOTICE_DELIVERY",
        "DOCUMENT_INTERNAL_WORK",
        "MEDICATION_EXTERNAL_DEPENDENCY",
        "ROUTED_RECLASSIFY_WINDOW",
    }:
        fail("251 subtype matrix drifted from required cases")

    routed_cases = load_json(ROUTED_CASES)
    if {case["caseId"] for case in routed_cases.get("cases", [])} != {
        "ROUTED_OPEN_WITH_SOURCE",
        "ROUTED_RECLASSIFY_TO_CANONICAL_SUBTYPE",
        "ROUTED_WINDOW_ELAPSED_FREEZES",
        "BOUNDARY_DRIFT_FREEZES_ADMIN_CONSEQUENCE",
    }:
        fail("251 routed cases drifted from required set")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("251 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("251 gap log must contain exactly two accepted gaps")

    parallel_gap = load_json(PARALLEL_GAP)
    if parallel_gap.get("taskId") != "251":
        fail("251 parallel interface gap taskId drifted")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "createCanonicalSubtypeProfiles()",
            "openAdminResolutionCase(",
            "reclassifyAdminResolutionSubtype(",
            "enterAdminResolutionWaitingState(",
            "recordAdminResolutionCompletionArtifact(",
            "evaluateCaseContinuity(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "AdminResolutionCase"',
            'canonicalName: "AdminResolutionSubtypeProfile"',
            'canonicalName: "AdminResolutionCompletionArtifact"',
            'canonicalName: "Phase3AdminResolutionPolicyKernelService"',
            'export * from "./phase3-admin-resolution-policy-kernel"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "accepts only legal bounded-admin case opening tuples",
            "publishes the canonical initial subtype set and reuses idempotent open on the same tuple",
            "requires owner, dependency shape, sla clock, and expiry or repair rules for waiting state transitions",
            "rejects generic done and requires typed completion artifacts",
            "freezes routed_admin_task after the governed reclassification window elapses",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_ADMIN_RESOLUTION_POLICY_SERVICE_NAME",
            "queryTaskAdminResolution(",
            "querySubtypePolicy(",
            "openAdminResolutionCase(",
            "normalizeSubtypeRef(",
            "assertCurrentCaseIsMutable(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_admin_resolution_current",
            "workspace_admin_resolution_subtype_policy_current",
            "workspace_task_open_admin_resolution_case",
            "workspace_task_reclassify_admin_resolution_subtype",
            "workspace_task_enter_admin_resolution_waiting_state",
            "workspace_task_cancel_admin_resolution_wait",
            "workspace_task_record_admin_resolution_completion_artifact",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_admin_resolution_subtype_profiles",
            "phase3_admin_resolution_cases",
            "phase3_admin_resolution_completion_artifacts",
            "idx_phase3_admin_resolution_cases_epoch_boundary",
            "idx_phase3_admin_resolution_completion_artifacts_type_state",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 251 admin-resolution routes in the command-api route catalog",
            "opens bounded admin work from the live 249 boundary tuple and normalizes legacy subtype labels",
            "rejects admin case opening when the current decision epoch has drifted from the stored starter tuple",
            "freezes further admin consequence when the upstream 249 boundary drifts out of bounded-admin posture",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:251-admin-resolution-policy-kernel": "python3 ./tools/analysis/validate_251_admin_resolution_policy_kernel.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:251-admin-resolution-policy-kernel": "python3 ./tools/analysis/validate_251_admin_resolution_policy_kernel.py"'
        ],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()
    validate_scripts()


if __name__ == "__main__":
    main()
