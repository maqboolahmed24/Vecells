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

ARCH_DOC = ROOT / "docs" / "architecture" / "249_self_care_boundary_and_advice_grant_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "249_boundary_decision_and_advice_grant_controls.md"
CONTRACT = ROOT / "data" / "contracts" / "249_self_care_boundary_and_grant_contract.json"
CLASSIFICATION_MATRIX = ROOT / "data" / "analysis" / "249_boundary_classification_matrix.csv"
CASE_FILE = ROOT / "data" / "analysis" / "249_grant_supersession_and_expiry_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "249_gap_log.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-self-care-boundary-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-self-care-boundary-kernel.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-self-care-boundary-grants.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "125_phase3_self_care_boundary_and_advice_grants.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-self-care-boundary-grants.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[249-self-care-boundary-grants] {message}")


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
        r"^- \[[Xx-]\] par_249_phase3_track_backend_build_self_care_boundary_decision_and_advice_eligibility_grants",
        checklist,
        re.MULTILINE,
    ):
        fail("task 249 checklist entry is missing")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "`SelfCareBoundaryDecision` is the sole classifier",
            "`AdviceEligibilityGrant` is a narrow tuple-bound authority",
            "This task keeps boundary decision and grant separate from render settlement.",
            "`250` advice render consumes",
            "`251` admin-resolution opening consumes",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "A surviving link or cached payload is not proof of a live `AdviceEligibilityGrant`.",
            "Decision epoch drift, evidence drift, subject drift, session drift, publication drift, and trust drift all fail closed.",
            "`decisionState = self_care` is legal only while `clinicalMeaningState = informational_only`",
            "`decisionState = admin_resolution` is legal only while `clinicalMeaningState = bounded_admin_only`",
            "Reopen or safety drift must supersede the prior boundary.",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "249.phase3.self-care-boundary-and-grants.v1":
        fail("249 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3SelfCareBoundaryAndAdviceGrantApplication":
        fail("249 contract serviceName drifted")
    if contract.get("downstreamConsumers") != [
        "250_advice_render",
        "251_admin_resolution_open",
    ]:
        fail("249 contract downstreamConsumers drifted")

    rows = load_csv(CLASSIFICATION_MATRIX)
    if {row["caseId"] for row in rows} != {
        "SELF_CARE_LIVE",
        "ADMIN_BOUNDARY_NO_GRANT",
        "CLINICIAN_REVIEW_ON_SAFETY_DRIFT",
        "DECISION_EPOCH_DRIFT_BLOCKS_GRANT",
        "EVIDENCE_DRIFT_INVALIDATES_GRANT",
        "SESSION_DRIFT_INVALIDATES_GRANT",
        "PUBLICATION_DRIFT_INVALIDATES_GRANT",
    }:
        fail("249 boundary classification matrix drifted from required cases")

    cases = load_json(CASE_FILE)
    if {case["caseId"] for case in cases.get("cases", [])} != {
        "REPLACEMENT_GRANT_SUPERSEDES_PRIOR",
        "TTL_EXPIRY_TRANSITIONS_TO_EXPIRED",
        "EVIDENCE_DRIFT_INVALIDATES_LIVE_GRANT",
        "SESSION_DRIFT_INVALIDATES_LIVE_GRANT",
        "PUBLICATION_DRIFT_INVALIDATES_LIVE_GRANT",
        "REOPEN_OR_SAFETY_DRIFT_SUPERSEDES_BOUNDARY",
    }:
        fail("249 grant cases drifted from required set")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("249 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("249 gap log must contain exactly two accepted gaps")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "buildBoundaryTupleHash(",
            "buildAdviceGrantTupleHash(",
            "validateBoundaryDecisionTuple(",
            "classifyBoundaryDecision(",
            "issueAdviceEligibilityGrant(",
            "expireDueAdviceEligibilityGrants(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "SelfCareBoundaryDecision"',
            'canonicalName: "AdviceEligibilityGrant"',
            'canonicalName: "Phase3SelfCareBoundaryKernelService"',
            'export * from "./phase3-self-care-boundary-kernel"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "accepts only the legal self-care, bounded-admin, and clinician-review tuples",
            "reuses idempotent boundary replay and writes one supersession record when the tuple drifts",
            "deduplicates grant replay, supersedes replaced grants, and expires due live grants",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_SELF_CARE_BOUNDARY_SERVICE_NAME",
            "classifySelfCareBoundary(",
            "issueAdviceEligibilityGrant(",
            "invalidateAdviceEligibilityGrant(",
            "deriveBoundaryClassification(",
            "assessGrantEffectiveness(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_self_care_boundary_current",
            "workspace_task_classify_self_care_boundary",
            "workspace_task_issue_advice_eligibility_grant",
            "workspace_task_supersede_self_care_boundary",
            "workspace_task_invalidate_advice_eligibility_grant",
            "workspace_task_expire_advice_eligibility_grant",
            "workspace_self_care_boundary_expire_due_grants",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_self_care_boundary_decisions",
            "phase3_self_care_boundary_supersession_records",
            "phase3_advice_eligibility_grants",
            "phase3_advice_eligibility_grant_transition_records",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 249 self-care-boundary routes in the command-api route catalog",
            "classifies one authoritative informational self-care tuple and issues one live grant that 250 can consume",
            "classifies bounded admin-resolution without inventing a live advice grant so 251 can consume one stable boundary tuple",
            "blocks advice grant issuance when the current decision epoch has drifted from the stored boundary tuple",
            "invalidates a live advice grant when the evidence snapshot drifts",
            "invalidates a live advice grant when the session epoch drifts",
            "invalidates a live advice grant when the publication tuple drifts",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:249-self-care-boundary-grants": "python3 ./tools/analysis/validate_249_self_care_boundary_and_grants.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:249-self-care-boundary-grants": "python3 ./tools/analysis/validate_249_self_care_boundary_and_grants.py"'
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
