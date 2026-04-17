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

ARCH_DOC = ROOT / "docs" / "architecture" / "250_advice_render_settlement_and_content_approval.md"
SECURITY_DOC = ROOT / "docs" / "security" / "250_advice_content_release_and_artifact_controls.md"
OPERATIONS_DOC = ROOT / "docs" / "operations" / "250_advice_content_review_and_rollout_runbook.md"
CONTRACT = ROOT / "data" / "contracts" / "250_advice_render_contract.json"
VARIANT_MATRIX = ROOT / "data" / "analysis" / "250_variant_selection_and_render_state_matrix.csv"
DRIFT_CASES = ROOT / "data" / "analysis" / "250_content_approval_and_publication_drift_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "250_gap_log.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_ADVICE_RENDER_RELEASE_WATCH.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-advice-render-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-advice-render-kernel.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-advice-render-settlement.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "126_phase3_advice_render_settlement_and_content_approval.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-advice-render-settlement.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[250-advice-render-content-approval] {message}")


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
        r"^- \[[Xx-]\] par_250_phase3_track_backend_build_advice_render_settlement_and_content_approval_binding",
        checklist,
        re.MULTILINE,
    ):
        fail("task 250 checklist entry is missing")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "`AdviceRenderSettlement` is the sole authority",
            "`ClinicalContentApprovalRecord`",
            "`ContentReviewSchedule`",
            "A live `AdviceEligibilityGrant` is not proof of renderable advice.",
            "`251` admin-resolution opening consumes the same bounded `249` tuple",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "Raw URLs and uncontrolled downloads are forbidden",
            "Every visible settlement must bind one explicit `ClinicalContentApprovalRecord`",
            "`releaseTrustState = quarantined`",
            "Fallback transforms may not change clinical meaning.",
            "A live `AdviceEligibilityGrant` is not proof of renderable advice.",
        ],
    )
    require_text(
        OPERATIONS_DOC,
        [
            "register `ClinicalContentApprovalRecord`",
            "register `AdviceBundleVersion`",
            "review due or approval drift: settle `withheld`",
            "boundary or grant drift: settle `invalidated`",
            "The current release-watch and channel-freeze posture is still simulator-backed input",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "250.phase3.advice-render-settlement.v1":
        fail("250 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3AdviceRenderSettlementApplication":
        fail("250 contract serviceName drifted")
    if len(contract.get("routeIds", [])) != 9:
        fail("250 contract routeIds drifted")

    rows = load_csv(VARIANT_MATRIX)
    if {row["caseId"] for row in rows} != {
        "EXACT_VARIANT_RENDERABLE",
        "LOCALE_FALLBACK_RENDERABLE",
        "READING_LEVEL_DEFAULT_RENDERABLE",
        "REVIEW_DUE_WITHHELD",
        "GRANT_DRIFT_INVALIDATED",
        "TRUST_QUARANTINE_QUARANTINED",
    }:
        fail("250 variant matrix drifted from required cases")

    cases = load_json(DRIFT_CASES)
    if {case["caseId"] for case in cases.get("cases", [])} != {
        "UNAPPROVED_CONTENT_WITHHELD",
        "EXPIRED_REVIEW_WITHHELD",
        "GRANT_INVALIDATED_INVALIDATED",
        "PUBLICATION_DRIFT_WITHHELD",
        "PUBLICATION_STALE_QUARANTINED",
        "TRUST_QUARANTINE_QUARANTINED",
        "RAW_ARTIFACT_REJECTED",
    }:
        fail("250 drift cases drifted from required set")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("250 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("250 gap log must contain exactly two accepted gaps")

    parallel_gap = load_json(PARALLEL_GAP)
    if parallel_gap.get("taskId") != "250":
        fail("250 parallel interface gap taskId drifted")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "registerClinicalContentApprovalRecord(",
            "registerContentReviewSchedule(",
            "registerAdviceBundleVersion(",
            "registerAdviceVariantSet(",
            "evaluateAdviceRenderCandidate(",
            "settleAdviceRender(",
            "transitionAdviceRender(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "AdviceBundleVersion"',
            'canonicalName: "AdviceVariantSet"',
            'canonicalName: "ClinicalContentApprovalRecord"',
            'canonicalName: "ContentReviewSchedule"',
            'canonicalName: "AdviceRenderSettlement"',
            'canonicalName: "Phase3AdviceRenderKernelService"',
            'export * from "./phase3-advice-render-kernel"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "selects the exact approved variant and reuses an idempotent render settlement",
            "falls back to a governed locale-transform variant when an exact variant is unavailable",
            "withholds advice when content review cadence is due and quarantines when release trust is quarantined",
            "rejects raw external artifact references in advice variants",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_ADVICE_RENDER_SERVICE_NAME",
            "queryTaskAdviceRender(",
            "renderAdvice(",
            "invalidateAdviceRender(",
            "evaluateCurrentCandidate(",
            "toSettleAdviceRenderInput(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_advice_render_current",
            "workspace_advice_content_approval_register",
            "workspace_advice_content_review_schedule_register",
            "workspace_advice_bundle_version_register",
            "workspace_advice_variant_set_register",
            "workspace_task_render_advice",
            "workspace_task_invalidate_advice_render",
            "workspace_task_supersede_advice_render",
            "workspace_task_quarantine_advice_render",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_clinical_content_approval_records",
            "phase3_content_review_schedules",
            "phase3_advice_bundle_versions",
            "phase3_advice_variant_sets",
            "phase3_advice_render_settlements",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes the 250 advice-render routes in the command-api route catalog",
            "renders live advice from the current 249 boundary and grant tuple",
            "invalidates the effective render posture when the upstream 249 tuple drifts after render",
            "quarantines render settlement on release-trust quarantine and rejects raw artifact refs",
        ],
    )


def validate_scripts() -> None:
    require_text(
        PACKAGE_JSON,
        [
            '"validate:250-advice-render-content-approval": "python3 ./tools/analysis/validate_250_advice_render_and_content_approval.py"'
        ],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        [
            '"validate:250-advice-render-content-approval": "python3 ./tools/analysis/validate_250_advice_render_and_content_approval.py"'
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
