#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
SOURCE = ROOT / "services" / "command-api" / "src" / "support-lineage-ticket-subject-history.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
BACKEND_TEST = (
    ROOT
    / "services"
    / "command-api"
    / "tests"
    / "support-lineage-ticket-subject-history.integration.test.js"
)
ARCH_DOC = ROOT / "docs" / "architecture" / "218_support_lineage_binding_and_subject_history_design.md"
SECURITY_DOC = ROOT / "docs" / "security" / "218_support_lineage_masking_and_subject_history_controls.md"
HTML_ATLAS = ROOT / "docs" / "frontend" / "218_support_lineage_and_subject_history_atlas.html"
MERMAID = ROOT / "docs" / "frontend" / "218_support_lineage_binding_and_ticket_anatomy.mmd"
CONTRACT = ROOT / "data" / "contracts" / "218_support_lineage_ticket_subject_history_contract.json"
MATRIX = ROOT / "data" / "analysis" / "218_support_scope_member_and_subject_history_matrix.csv"
ALIAS = ROOT / "data" / "analysis" / "218_support_lineage_alias_and_gap_resolution.json"
GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "218_support_lineage_and_subject_history_atlas.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries"

PREREQUISITES = [
    "seq_209_crosscutting_open_patient_account_and_support_surface_tracks_gate",
    "par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections",
    "par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules",
    "par_217_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_health_record_and_communications_timeline_views",
]

REQUIRED_OBJECTS = {
    "SupportTicket",
    "SupportLineageBinding",
    "SupportLineageScopeMember",
    "SupportLineageArtifactBinding",
    "SupportTicketWorkspaceProjection",
    "SupportSubject360Projection",
    "SupportSubjectContextBinding",
    "SupportContextDisclosureRecord",
    "SupportSubjectHistoryQuery",
    "SupportSubjectHistoryProjection",
    "SupportReadOnlyFallbackProjection",
}

REQUIRED_ROUTES = {
    "GET /ops/support/tickets/:supportTicketId",
    "GET /ops/support/tickets/:supportTicketId/subject-history",
    "GET /ops/support/tickets/:supportTicketId/subject-360",
    "GET /internal/ops/support/tickets/:supportTicketId/lineage/scope-members",
    "GET /internal/ops/support/tickets/:supportTicketId/lineage/artifacts",
}

REQUIRED_ROUTE_IDS = {
    "support_ticket_workspace_current",
    "support_ticket_subject_history",
    "support_ticket_subject_360",
    "support_ticket_lineage_scope_members",
    "support_ticket_artifact_provenance",
}

REQUIRED_REGIONS = {
    "Support_Lineage_Atlas",
    "TicketAnatomyBoard",
    "LineageBindingBoard",
    "ScopeMemberBoard",
    "Subject360Board",
    "SubjectHistoryDisclosureBoard",
    "ProvenanceArtifactBindingBoard",
    "ReadOnlyFallbackBoard",
}

REQUIRED_SCREENSHOTS = {
    "218-atlas-ticket-anatomy.png",
    "218-atlas-lineage-binding.png",
    "218-atlas-scope-members.png",
    "218-atlas-subject-360.png",
    "218-atlas-subject-history.png",
    "218-atlas-provenance.png",
    "218-atlas-read-only-fallback.png",
    "218-atlas-mobile.png",
    "218-atlas-reduced-motion.png",
    "218-atlas.png",
}


def fail(message: str) -> None:
    raise SystemExit(f"[support-lineage-ticket-subject-history] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str] | list[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for prerequisite in PREREQUISITES:
        if f"- [X] {prerequisite}" not in checklist:
            fail(f"prerequisite not complete: {prerequisite}")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 218 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers(
        "source",
        source,
        REQUIRED_OBJECTS
        | {
            "SupportLineageAssembler",
            "SupportTicketWorkspaceAssembler",
            "SupportSubjectHistoryQueryService",
            "SupportSubjectContextDisclosureService",
            "Support_Lineage_Atlas",
            "createSupportLineageTicketSubjectHistoryApplication",
            "getSupportTicketWorkspace",
            "getSupportSubjectHistory",
            "getSupportSubject360",
            "getSupportLineageArtifactProvenance",
            "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
            "SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED",
            "SUPPORT_218_READ_ONLY_FALLBACK_SAME_SHELL",
            "ticket_local_linked_refs_as_authority",
        },
    )
    for forbidden in (
        "raw_adapter_payload_subject_history = true",
        "ticket_local_linked_refs_as_authority = true",
        "subject_only_clustering_as_scope = true",
        "window.localStorage",
        "document.cookie",
    ):
        if forbidden in source:
            fail(f"source contains forbidden marker: {forbidden}")


def validate_service_definition() -> None:
    service_definition = read(SERVICE_DEFINITION)
    require_markers(
        "service definition",
        service_definition,
        REQUIRED_ROUTE_IDS
        | REQUIRED_OBJECTS
        | {
            "/ops/support/tickets/{supportTicketId}",
            "/ops/support/tickets/{supportTicketId}/subject-history",
            "/ops/support/tickets/{supportTicketId}/subject-360",
        },
    )


def validate_backend_test() -> None:
    test = read(BACKEND_TEST)
    require_markers(
        "backend test",
        test,
        REQUIRED_OBJECTS
        | REQUIRED_ROUTE_IDS
        | {
            "createSupportLineageTicketSubjectHistoryApplication",
            "single active mutation authority",
            "summary-first subject history",
            "same-shell read-only fallback",
            "SupportLineageArtifactBinding provenance",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(SECURITY_DOC), read(MERMAID)])
    require_markers(
        "docs",
        combined,
        REQUIRED_OBJECTS
        | REQUIRED_ROUTES
        | {
            "Support_Lineage_Atlas",
            "same-shell",
            "masked summary",
            "summary-first",
            "NHS service manual",
            "WCAG 2.2",
            "OWASP Authorization",
            "OWASP Logging",
            "Playwright ARIA snapshots",
            "Playwright screenshots",
        },
    )


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Support_Lineage_Atlas":
        fail("contract visual mode drifted")
    require_markers("contract", json.dumps(contract), REQUIRED_OBJECTS | REQUIRED_ROUTES)
    for forbidden in (
        "ticket_local_linked_refs_as_authority",
        "subject_only_clustering_as_scope",
        "copied_thread_excerpt_without_SupportLineageArtifactBinding",
        "raw_adapter_payload_subject_history",
        "support_local_contact_route_health_copy",
        "browser_history_state_as_restore_authority",
    ):
        if forbidden not in contract.get("forbiddenTruthSources", []):
            fail(f"contract missing forbidden truth source {forbidden}")

    with MATRIX.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 12:
        fail("matrix needs at least twelve rows")
    for column in {
        "case_id",
        "source_object",
        "scope_member_role",
        "visibility_mode",
        "actionability",
        "subject_history_default",
        "detail_requires_disclosure",
        "artifact_binding_required",
        "atlas_region",
        "read_only_fallback",
    }:
        if column not in rows[0]:
            fail(f"matrix missing column {column}")
    roles = {row["scope_member_role"] for row in rows}
    for role in {
        "primary_action_target",
        "communication_context",
        "artifact_provenance",
        "identity_repair_dependency",
    }:
        if role not in roles:
            fail(f"matrix missing scope role {role}")
    regions = {row["atlas_region"] for row in rows}
    if not REQUIRED_REGIONS - {"Support_Lineage_Atlas", "LineageBindingBoard"} <= regions:
        fail("matrix missing atlas regions")

    alias = json.loads(read(ALIAS))
    if alias.get("taskId") != TASK:
        fail("alias taskId drifted")
    require_markers(
        "alias",
        json.dumps(alias),
        {
            "SupportLineageBinding",
            "SupportSubjectHistoryQuery",
            "SupportLineageArtifactBinding",
            "SupportSubject360Projection",
            "SupportReadOnlyFallbackProjection",
            "par_219",
            "par_220_to_par_222",
        },
    )

    gap = json.loads(read(GAP))
    for field in {
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    }:
        if not gap.get(field):
            fail(f"gap artifact missing {field}")
    require_markers("gap", json.dumps(gap), {"SupportLineageBinding", "par_219"})


def validate_atlas_and_tests() -> None:
    atlas = read(HTML_ATLAS)
    require_markers(
        "atlas",
        atlas,
        REQUIRED_REGIONS
        | REQUIRED_OBJECTS
        | REQUIRED_ROUTES
        | {
            "window.__supportLineageAtlasData",
            "prefers-reduced-motion",
            "data-scenario-button",
            "aria-label",
            "SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED",
            "SUPPORT_218_ARTIFACT_PROVENANCE_BOUND",
            "SUPPORT_218_READ_ONLY_FALLBACK_SAME_SHELL",
        },
    )

    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        REQUIRED_REGIONS
        | REQUIRED_OBJECTS
        | {
            "ariaSnapshot",
            "reducedMotion",
            "assertNoOverflow",
            "ArrowRight",
            "218-atlas-ticket-anatomy.png",
            "218-atlas-read-only-fallback.png",
        },
    )

    missing = sorted(
        screenshot
        for screenshot in REQUIRED_SCREENSHOTS
        if not (OUTPUT_DIR / screenshot).exists()
    )
    if missing:
        fail(f"missing Playwright screenshots: {', '.join(missing)}")


def validate_scripts() -> None:
    package = json.loads(read(ROOT_PACKAGE))
    script = package.get("scripts", {}).get("validate:support-lineage-ticket-subject-history")
    expected = "python3 ./tools/analysis/validate_support_lineage_ticket_subject_history.py"
    if script != expected:
        fail("root package missing validate:support-lineage-ticket-subject-history script")
    require_markers(
        "root_script_updates",
        read(ROOT_SCRIPT_UPDATES),
        {"validate:support-lineage-ticket-subject-history", expected},
    )


def main() -> None:
    validate_checklist()
    validate_source()
    validate_service_definition()
    validate_backend_test()
    validate_docs()
    validate_contract_and_analysis()
    validate_atlas_and_tests()
    validate_scripts()
    print("[support-lineage-ticket-subject-history] validation passed")


if __name__ == "__main__":
    main()
