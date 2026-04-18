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

ARCH_DOC = ROOT / "docs" / "architecture" / "253_self_care_outcome_analytics_and_expectation_templates.md"
CONTENT_DOC = ROOT / "docs" / "content" / "253_patient_expectation_template_policy.md"
SECURITY_DOC = ROOT / "docs" / "security" / "253_analytics_and_template_data_handling.md"
CONTRACT = ROOT / "data" / "contracts" / "253_self_care_analytics_and_expectation_template_contract.json"
WATCH_MATRIX = ROOT / "data" / "analysis" / "253_follow_up_watch_window_analytics_matrix.csv"
EXAMPLES = ROOT / "data" / "analysis" / "253_patient_expectation_template_examples.json"
SELECTION_CASES = ROOT / "data" / "analysis" / "253_template_selection_and_visibility_cases.json"
GAP_LOG = ROOT / "data" / "analysis" / "253_gap_log.json"
PARALLEL_GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_SELFCARE_WORKSPACE_ANALYTICS_AND_TEMPLATES.json"

DOMAIN_SOURCE = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "phase3-self-care-outcome-analytics-kernel.ts"
DOMAIN_INDEX = ROOT / "packages" / "domains" / "triage_workspace" / "src" / "index.ts"
DOMAIN_TEST = ROOT / "packages" / "domains" / "triage_workspace" / "tests" / "phase3-self-care-outcome-analytics-kernel.test.ts"
SERVICE_SOURCE = ROOT / "services" / "command-api" / "src" / "phase3-self-care-outcome-analytics.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
MIGRATION = ROOT / "services" / "command-api" / "migrations" / "129_phase3_self_care_outcome_analytics_and_expectation_templates.sql"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "phase3-self-care-outcome-analytics.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[253-analytics-expectation-templates] {message}")


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
        r"^- \[[Xx]\] par_253_phase3_track_backend_build_self_care_outcome_analytics_and_patient_expectation_templates",
        checklist,
        re.MULTILINE,
    ):
        fail("task 253 checklist entry must be marked complete")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "`PatientExpectationTemplate`",
            "`AdviceUsageAnalyticsRecord`",
            "analytics stay observational only",
            "`AdviceFollowUpWatchWindow.linkedAnalyticsRefs`",
            "safe downgrade to `summary_safe` or `placeholder_safe`",
        ],
    )
    require_text(
        CONTENT_DOC,
        [
            "Patient expectation wording must be versioned content",
            "Every live template version must publish:",
            "do not embed expectation copy in worker-only strings",
            "When full visibility is no longer legal",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "`253` stores patient expectation content and typed outcome analytics.",
            "analytics are observational only",
            "stale or superseded versions remain auditable",
            "must not settle:",
        ],
    )


def validate_contract_and_analysis() -> None:
    contract = load_json(CONTRACT)
    if contract.get("schemaVersion") != "253.phase3.self-care-outcome-analytics-and-expectation-templates.v1":
        fail("253 contract schemaVersion drifted")
    if contract.get("serviceName") != "Phase3SelfCareOutcomeAnalyticsApplication":
        fail("253 contract serviceName drifted")
    if len(contract.get("routeIds", [])) != 6:
        fail("253 contract routeIds drifted")
    if contract.get("deliveryModes") != ["full", "summary_safe", "placeholder_safe"]:
        fail("253 deliveryModes drifted")
    if contract.get("consequenceClasses") != [
        "self_care",
        "admin_resolution_waiting",
        "admin_resolution_completion",
    ]:
        fail("253 consequenceClasses drifted")

    rows = load_csv(WATCH_MATRIX)
    if {row["caseId"] for row in rows} != {
        "SELF_CARE_RECONTACT_WITHIN_WINDOW",
        "SELF_CARE_ESCALATION_OUTSIDE_WINDOW",
        "ADMIN_WAITING_UPDATE_NO_WINDOW",
        "ADMIN_COMPLETION_VIEWED_NO_WINDOW",
        "BLOCKED_RECOVERY_SUMMARY_ONLY",
    }:
        fail("253 watch window analytics matrix drifted")

    examples = load_json(EXAMPLES)
    if len(examples.get("examples", [])) != 3:
        fail("253 template examples drifted")

    cases = load_json(SELECTION_CASES)
    if {case["caseId"] for case in cases.get("cases", [])} != {
        "SELF_CARE_FULL_COPY_ON_CURRENT_RENDERABLE_TUPLE",
        "SELF_CARE_BLOCKED_TUPLE_DEGRADES_TO_PLACEHOLDER",
        "ADMIN_WAITING_POLICY_REF_SELECTS_WAITING_TEMPLATE",
        "ADMIN_COMPLETION_ARTIFACT_SELECTS_COMPLETION_TEMPLATE",
        "LOCALE_FALLBACK_STAYS_WITHIN_CURRENT_ACTIVE_VERSION",
    }:
        fail("253 template selection cases drifted")

    gap_log = load_json(GAP_LOG)
    if gap_log.get("status") != "accepted_gaps_only":
        fail("253 gap log must declare accepted_gaps_only")
    if len(gap_log.get("gaps", [])) != 2:
        fail("253 gap log must contain exactly two accepted gaps")

    parallel_gap = load_json(PARALLEL_GAP)
    if parallel_gap.get("taskId") != "253":
        fail("253 parallel gap taskId drifted")


def validate_sources() -> None:
    require_text(
        DOMAIN_SOURCE,
        [
            "export class PatientExpectationTemplateResolver",
            "export class AdviceOutcomeAnalyticsIngestor",
            "export class WatchWindowAnalyticsLinker",
            "publishPatientExpectationTemplateVersion(",
            "recordAdviceOutcomeAnalytics(",
            "recordAdminOutcomeAnalytics(",
        ],
    )
    require_text(
        DOMAIN_INDEX,
        [
            'canonicalName: "PatientExpectationTemplate"',
            'canonicalName: "AdviceUsageAnalyticsRecord"',
            'canonicalName: "Phase3SelfCareOutcomeAnalyticsKernelService"',
            'export * from "./phase3-self-care-outcome-analytics-kernel"',
        ],
    )
    require_text(
        DOMAIN_TEST,
        [
            "publishes a versioned template registry row and resolves full delivery when coverage exists",
            "falls back from full to summary-safe copy when only safer delivery is allowed",
            "keeps analytics observational and links typed records onto the watch window",
            "supersedes the previous active template version instead of mutating history in place",
        ],
    )
    require_text(
        SERVICE_SOURCE,
        [
            "PHASE3_SELF_CARE_OUTCOME_ANALYTICS_SERVICE_NAME",
            "queryTaskSelfCareOutcomeAnalytics(",
            "resolvePatientExpectationTemplate(",
            "recordAdviceOutcomeAnalytics(",
            "recordAdminOutcomeAnalytics(",
            "buildCanonicalTemplateVersionInput(",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_self_care_outcome_analytics_current",
            "workspace_task_follow_up_watch_analytics_current",
            "workspace_publish_patient_expectation_template_version",
            "workspace_task_resolve_patient_expectation_template",
            "workspace_task_record_advice_outcome_analytics",
            "workspace_task_record_admin_outcome_analytics",
        ],
    )
    require_text(
        MIGRATION,
        [
            "phase3_patient_expectation_templates",
            "phase3_patient_expectation_template_versions",
            "phase3_patient_expectation_template_variants",
            "phase3_advice_follow_up_watch_windows",
            "phase3_advice_usage_analytics_records",
            "idx_phase3_advice_usage_analytics_records_locale_channel_template",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "publishes a lazy canonical template and resolves the current self-care expectation",
            "records advice outcome analytics and links the typed record onto the current watch window",
            "resolves bounded admin completion through the completion artifact template ref",
            "publishes the expected route contract and service metadata",
        ],
    )
    require_text(
        PACKAGE_JSON,
        ['"validate:253-analytics-expectation-templates": "python3 ./tools/analysis/validate_253_analytics_and_expectation_templates.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:253-analytics-expectation-templates": "python3 ./tools/analysis/validate_253_analytics_and_expectation_templates.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contract_and_analysis()
    validate_sources()


if __name__ == "__main__":
    main()
