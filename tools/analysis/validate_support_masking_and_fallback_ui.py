#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CHECKLIST = ROOT / "prompt" / "checklist.md"
ROOT_PACKAGE = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"
APP = ROOT / "apps" / "clinical-workspace" / "src" / "App.tsx"
SOURCE = ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.tsx"
STYLES = ROOT / "apps" / "clinical-workspace" / "src" / "support-workspace-shell.css"
ARCH_DOC = ROOT / "docs" / "architecture" / "222_support_masking_read_only_fallback_and_contextual_panels.md"
ATLAS = ROOT / "docs" / "frontend" / "222_support_masking_and_fallback_atlas.html"
VISUAL_GRAMMAR = ROOT / "docs" / "frontend" / "222_support_disclosure_and_knowledge_visual_grammar.html"
ROUTE_MAP = ROOT / "docs" / "frontend" / "222_support_mask_scope_and_reacquire_map.mmd"
CONTRACT = ROOT / "data" / "contracts" / "222_support_masking_and_contextual_ui_contract.json"
CASE_JSON = ROOT / "data" / "analysis" / "222_support_masking_cases.json"
MATRIX = ROOT / "data" / "analysis" / "222_support_disclosure_and_fallback_matrix.csv"
GAP = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json"
PLAYWRIGHT_SPEC = ROOT / "tests" / "playwright" / "222_support_masking_read_only_fallback_and_contextual_playbook_panels.spec.js"
OUTPUT_DIR = ROOT / "output" / "playwright"

TASK = "par_222_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_masking_read_only_fallback_and_contextual_playbook_panels"
PREREQUISITES = [
    "par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries",
    "par_219_crosscutting_track_backend_build_controlled_resend_delivery_repair_and_support_replay_foundations",
    "par_221_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_support_workspace_shell_and_omnichannel_ticket_views",
]

REQUIRED_SOURCE_MARKERS = {
    "Support_Masking_Fallback_Knowledge_Atlas",
    "SupportMaskingFallbackRouteContract",
    "SupportReadOnlyFallbackProjection",
    "SupportPresentationArtifact",
    "SupportKnowledgeStackProjection",
    "SupportKnowledgeBinding",
    "SupportKnowledgeAssistLease",
    "SupportSubjectContextBinding",
    "SupportContextDisclosureRecord",
    "SupportObserveSession",
    "SupportReplaySession",
    "SupportReplayEvidenceBoundary",
    "MaskAwareTimelineCell",
    "MaskScopeBadge",
    "ReadOnlyFallbackHero",
    "FallbackArtifactAnchor",
    "ObserveReplayBreadcrumb",
    "KnowledgeStackRail",
    "PlaybookAssistCard",
    "SubjectHistorySummaryPanel",
    "DisclosureGatePrompt",
    "ReacquirePathCard",
    "SupportHistoryRoute",
    "SupportKnowledgeRoute",
    "SupportObserveRoute",
    "SupportReplayRoute",
    "/ops/support/tickets/:supportTicketId/history",
    "/ops/support/tickets/:supportTicketId/knowledge",
    "/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId",
    "/ops/support/replay/:supportReplaySessionId",
    "data-mask-scope",
    "data-fallback-active",
}

DOC_MARKERS = {
    "Support_Masking_Fallback_Knowledge_Atlas",
    "MaskAwareTimelineBoard",
    "ReadOnlyFallbackHeroBoard",
    "KnowledgeRailBoard",
    "HistoryDisclosureBoard",
    "ObserveReplayBoard",
    "MaskScopeBadge",
    "PlaybookAssistCard",
    "/ops/support/tickets/:supportTicketId/history",
    "/ops/support/tickets/:supportTicketId/knowledge",
    "/ops/support/tickets/:supportTicketId/observe/:supportObserveSessionId",
    "/ops/support/replay/:supportReplaySessionId",
}

REQUIRED_SCREENSHOTS = {
    "222-support-history-summary-desktop.png",
    "222-support-history-expanded-desktop.png",
    "222-support-knowledge-desktop.png",
    "222-support-observe-tablet.png",
    "222-support-replay-desktop.png",
    "222-support-fallback-mobile.png",
    "222-support-masking-atlas.png",
    "222-support-disclosure-visual-grammar.png",
    "222-support-reduced-motion.png",
}

REQUIRED_ARIA_FILES = {
    "222-support-history-aria.json",
    "222-support-knowledge-aria.json",
    "222-support-replay-aria.json",
}


def fail(message: str) -> None:
    raise SystemExit(f"[support-masking-fallback-ui] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required artifact: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_markers(label: str, text: str, markers: set[str]) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} missing marker: {marker}")


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for prerequisite in PREREQUISITES:
        if f"- [X] {prerequisite}" not in checklist:
            fail(f"prerequisite not complete: {prerequisite}")
    if f"- [-] {TASK}" not in checklist and f"- [X] {TASK}" not in checklist:
        fail("task 222 is not claimed or complete in checklist")


def validate_source() -> None:
    source = read(SOURCE)
    require_markers("source", source, REQUIRED_SOURCE_MARKERS)
    require_markers("app", read(APP), {"SupportWorkspaceApp", "isSupportWorkspacePath"})
    require_markers(
        "styles",
        read(STYLES),
        {
            ".support-workspace__mode-bar",
            ".support-workspace__fallback-hero",
            ".support-workspace__knowledge-rail",
            ".support-workspace__history-panel",
            ".support-workspace__mask-badge",
            "@media (prefers-reduced-motion: reduce)",
        },
    )


def validate_docs() -> None:
    combined = "\n".join([read(ARCH_DOC), read(ATLAS), read(VISUAL_GRAMMAR), read(ROUTE_MAP)])
    require_markers("docs", combined, DOC_MARKERS)
    require_markers(
        "architecture doc",
        read(ARCH_DOC),
        {
            "Support_Masking_Fallback_Knowledge_Atlas",
            "SupportReadOnlyFallbackProjection",
            "SupportKnowledgeStackProjection",
            "SupportReplayEvidenceBoundary",
            "same clinical SPA host",
            "Playwright",
        },
    )
    require_markers("atlas", read(ATLAS), {"window.__supportMaskingFallbackKnowledgeAtlasData"})
    require_markers("visual grammar", read(VISUAL_GRAMMAR), {"Visual grammar", "DisclosureGatePrompt", "PlaybookAssistCard"})


def validate_contract_and_analysis() -> None:
    contract = json.loads(read(CONTRACT))
    if contract.get("taskId") != TASK:
        fail("contract taskId drifted")
    if contract.get("visualMode") != "Support_Masking_Fallback_Knowledge_Atlas":
        fail("contract visualMode drifted")
    if contract.get("continuityKey") != "support.workspace.tickets":
        fail("contract continuity key drifted")
    if len(contract.get("routeSurfaces", [])) != 4:
        fail("contract route surface count drifted")
    if len(contract.get("fallbackModes", [])) != 5:
        fail("contract fallback mode count drifted")

    case_json = json.loads(read(CASE_JSON))
    if len(case_json.get("cases", [])) < 7:
        fail("masking case coverage is unexpectedly small")

    with MATRIX.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 8:
        fail("disclosure and fallback matrix is unexpectedly small")

    gap = json.loads(read(GAP))
    if gap.get("par222MaskingFallbackStatus") != "resolved_for_masking_fallback_history_knowledge_observe_and_replay":
        fail("support frontend gap artifact missing 222 status")


def validate_scripts() -> None:
    package_text = read(ROOT_PACKAGE)
    script_line = '"validate:support-masking-fallback-ui": "python3 ./tools/analysis/validate_support_masking_and_fallback_ui.py"'
    if script_line not in package_text:
        fail("package.json missing validate:support-masking-fallback-ui script")
    if "validate:support-masking-fallback-ui" not in read(ROOT_SCRIPT_UPDATES):
        fail("root_script_updates.py missing validate:support-masking-fallback-ui")


def validate_playwright_outputs() -> None:
    spec = read(PLAYWRIGHT_SPEC)
    require_markers(
        "playwright spec",
        spec,
        {
            "222_support_masking_read_only_fallback_and_contextual_playbook_panels",
            "SupportHistoryRoute",
            "SupportKnowledgeRoute",
            "SupportObserveRoute",
            "SupportReplayRoute",
            "ReadOnlyFallbackHero",
            "222-support-history-summary-desktop.png",
            "222-support-masking-atlas.png",
            "222-support-disclosure-visual-grammar.png",
        },
    )
    for file_name in REQUIRED_SCREENSHOTS | REQUIRED_ARIA_FILES:
        if not (OUTPUT_DIR / file_name).exists():
            fail(f"missing Playwright output: output/playwright/{file_name}")


def main() -> None:
    validate_checklist()
    validate_source()
    validate_docs()
    validate_contract_and_analysis()
    validate_scripts()
    validate_playwright_outputs()
    print("support masking and fallback UI validation passed")


if __name__ == "__main__":
    main()
