#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "docs" / "frontend" / "268_workspace_accessibility_ergonomics_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "268_workspace_accessibility_ergonomics_atlas.html"
TOPOLOGY_PATH = ROOT / "docs" / "frontend" / "268_workspace_focus_and_keyboard_topology.mmd"
COVERAGE_PATH = ROOT / "docs" / "accessibility" / "268_workspace_semantic_coverage.md"
CONTRACT_BUNDLE_PATH = ROOT / "data" / "contracts" / "268_workspace_accessibility_contract_bundle.json"
KEYBOARD_MATRIX_PATH = ROOT / "data" / "contracts" / "268_workspace_keyboard_model_matrix.json"
ANNOUNCEMENT_MATRIX_PATH = ROOT / "data" / "contracts" / "268_workspace_assistive_announcement_matrix.json"
ALIGNMENT_NOTES_PATH = ROOT / "data" / "analysis" / "268_algorithm_alignment_notes.md"
REFERENCE_NOTES_PATH = ROOT / "data" / "analysis" / "268_visual_reference_notes.json"
EDGE_CASES_PATH = ROOT / "data" / "analysis" / "268_zoom_motion_density_edge_cases.json"
PACKAGE_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
PLAYWRIGHT_PATHS = [
    ROOT / "tests" / "playwright" / "268_workspace_accessibility.spec.ts",
    ROOT / "tests" / "playwright" / "268_workspace_keyboard_and_focus.spec.ts",
    ROOT / "tests" / "playwright" / "268_workspace_zoom_motion_density.spec.ts",
    ROOT / "tests" / "playwright" / "268_workspace_visual_ergonomics.spec.ts",
]
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-accessibility.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-queue-workboard.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-active-task-shell.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-focus-continuity.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract_bundle = json.loads(read_text(CONTRACT_BUNDLE_PATH))
    require(contract_bundle["taskId"].startswith("par_268"), "268 contract bundle taskId drifted")
    require(contract_bundle["visualMode"] == "Quiet_Clinical_Ergonomic_Hardening", "268 visual mode drifted")
    require(
        set(contract_bundle["accessibilityContracts"])
        == {
            "AccessibleSurfaceContract",
            "KeyboardInteractionContract",
            "FocusTransitionContract",
            "AssistiveAnnouncementContract",
            "FreshnessAccessibilityContract",
            "AssistiveTextPolicy",
            "AccessibilitySemanticCoverageProfile",
        },
        "268 accessibility contract list drifted",
    )
    require(len(contract_bundle["routeFamilies"]) == 2, "268 route family coverage drifted")
    require(
        contract_bundle["routeFamilies"][0]["focusOrder"]
        == [
            "workspace-workboard",
            "workspace-task-canvas",
            "workspace-decision-dock",
            "workspace-context-region",
        ],
        "268 task-family focus order drifted",
    )
    require(
        contract_bundle["routeFamilies"][1]["focusOrder"] == ["workspace-peer-route"],
        "268 peer-route focus order drifted",
    )
    require(
        contract_bundle["keyboardRegionSwitching"]["cycleShortcut"]
        == "Alt+Shift+ArrowLeft / Alt+Shift+ArrowRight",
        "268 pane-cycle shortcut drifted",
    )

    keyboard_matrix = json.loads(read_text(KEYBOARD_MATRIX_PATH))
    require(
        {
            "workspace_navigation",
            "queue_workboard",
            "task_canvas",
            "decision_dock",
            "context_region",
            "peer_route",
        }
        <= {item["surfaceRef"] for item in keyboard_matrix["models"]},
        "268 keyboard matrix surface coverage drifted",
    )

    announcement_matrix = json.loads(read_text(ANNOUNCEMENT_MATRIX_PATH))
    require(
        {
            "live-surface-summary",
            "buffered-queue-digest",
            "stale-review",
            "recovery-only",
            "blocked",
            "authoritative-stage-settlement",
        }
        <= {item["caseId"] for item in announcement_matrix["cases"]},
        "268 announcement matrix drifted",
    )
    require(
        announcement_matrix["timing"]["dedupeWindowMs"] == 1200,
        "268 announcement dedupe timing drifted",
    )

    notes = read_text(ALIGNMENT_NOTES_PATH).lower()
    for token in [
        "focus-loss-on-stage-change gap",
        "live-update announcement spam gap",
        "dense-row semantic drift gap",
        "zoom-and-reflow trap gap",
        "reduced-motion meaning-loss gap",
        "pointer-target inequality gap",
        "alt+shift+arrowleft",
        "alt+shift+arrowright",
    ]:
        require(token in notes, f"268 algorithm notes lost token: {token}")

    references = json.loads(read_text(REFERENCE_NOTES_PATH))
    require(
        {
            "Welcome to the new Linear",
            "How we redesigned the Linear UI (part II)",
            "Vercel Nested Layouts",
            "Vercel Dashboard Navigation Redesign Rollout",
            "IBM Carbon Data Table",
            "NHS Accessibility Content Guidance",
            "NHS Typography Guidance",
            "WAI APG Grid Pattern",
            "WCAG 2.2 Focus Not Obscured",
            "WCAG 2.2 Target Size Minimum",
        }
        <= {item["source"] for item in references["references"]},
        "268 visual references drifted",
    )

    edge_cases = json.loads(read_text(EDGE_CASES_PATH))
    require(len(edge_cases["cases"]) >= 8, "268 edge-case coverage unexpectedly thin")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "quiet_clinical_ergonomic_hardening",
        "accessiblesurfacecontract",
        "keyboardinteractioncontract",
        "focustransitioncontract",
        "assistiveannouncementcontract",
        "freshnessaccessibilitycontract",
        "accessibilitysemanticcoverageprofile",
        "alt+shift+arrowleft",
        "alt+shift+arrowright",
    ]:
        require(token in spec, f"268 spec lost token: {token}")

    coverage = read_text(COVERAGE_PATH).lower()
    for token in [
        "workspace_shell",
        "workspace_navigation",
        "queue_workboard",
        "task_canvas",
        "decision_dock",
        "peer_route",
        "mission_stack_supported",
        "reduced_motion_outline_and_structure",
    ]:
        require(token in coverage, f"268 semantic coverage doc lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "268-workspace-accessibility-ergonomics-atlas-root",
        "Quiet_Clinical_Ergonomic_Hardening",
        "Workspace accessibility and ergonomics atlas",
        "Buffered queue digest",
        "One calm live-region message",
    ]:
        require(token in atlas, f"268 atlas lost token: {token}")

    topology = read_text(TOPOLOGY_PATH)
    for token in [
        "Workboard",
        "Task canvas",
        "Decision dock",
        "Context region",
        "AssistiveAnnouncementTruthProjection",
        "Reduced motion keeps outline and structure instead of travel",
    ]:
        require(token in topology, f"268 topology lost token: {token}")

    package_text = read_text(PACKAGE_PATH)
    root_script_updates_text = read_text(ROOT_SCRIPT_UPDATES_PATH)
    for token in ['"validate:268-workspace-accessibility-contracts": "python3 ./tools/analysis/validate_268_workspace_accessibility_contracts.py"']:
        require(token in package_text, "package.json missing 268 validator script")
        require(token in root_script_updates_text, "root_script_updates missing 268 validator script")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for token in [
        'WORKSPACE_ACCESSIBILITY_VISUAL_MODE = "Quiet_Clinical_Ergonomic_Hardening"',
        "AccessibleSurfaceContract",
        "KeyboardInteractionContract",
        "FocusTransitionContract",
        "AssistiveAnnouncementContract",
        "FreshnessAccessibilityContract",
        "AccessibilitySemanticCoverageProfile",
        "WorkspaceAnnouncementHub",
        "WorkspaceSkipLinks",
        "resolveWorkspaceFocusOrder",
        "resolveWorkspaceKeyboardModelDescription",
        'aria-describedby="workspace-shell-keyboard-model"',
        "data-keyboard-region-order",
        'surface: "workspace_navigation"',
        "Alt+Shift+ArrowLeft",
        "Alt+Shift+ArrowRight",
        "--staff-shell-bg: #eef2f7;",
        "--staff-shell-accent: #3158e0;",
        "min-height: 44px;",
        'data-testid="WorkspaceNavRail"',
    ]:
        require(token in app_text, f"app source missing 268 token: {token}")

    for path in PLAYWRIGHT_PATHS:
        require(path.exists(), f"Missing 268 Playwright proof: {path}")

    print(
        json.dumps(
            {
                "taskId": contract_bundle["taskId"],
                "routeFamilyCount": len(contract_bundle["routeFamilies"]),
                "referenceCount": len(references["references"]),
                "edgeCaseCount": len(edge_cases["cases"]),
                "playwrightSpecCount": len(PLAYWRIGHT_PATHS),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
