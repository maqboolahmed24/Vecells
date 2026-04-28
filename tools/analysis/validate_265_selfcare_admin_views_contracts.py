#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT_PATH = ROOT / "data" / "contracts" / "265_selfcare_admin_views_contract.json"
SPEC_PATH = ROOT / "docs" / "frontend" / "265_selfcare_admin_views_spec.md"
ATLAS_PATH = ROOT / "docs" / "frontend" / "265_selfcare_admin_views_atlas.html"
DIAGRAM_PATH = ROOT / "docs" / "frontend" / "265_selfcare_admin_views_topology.mmd"
TOKENS_PATH = ROOT / "docs" / "frontend" / "265_selfcare_admin_views_design_tokens.json"
A11Y_PATH = ROOT / "docs" / "accessibility" / "265_selfcare_admin_views_a11y_notes.md"
NOTES_PATH = ROOT / "data" / "analysis" / "265_algorithm_alignment_notes.md"
MATRIX_PATH = ROOT / "data" / "analysis" / "265_selfcare_admin_views_state_matrix.csv"
REFERENCES_PATH = ROOT / "data" / "analysis" / "265_visual_reference_notes.json"
CASES_PATH = ROOT / "data" / "analysis" / "265_boundary_dependency_and_reopen_cases.json"
GAP_PATH = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_SELFCARE_ADMIN_VIEWS.json"
APP_PATHS = [
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-selfcare-admin.tsx",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-selfcare-admin.data.ts",
    ROOT / "apps" / "clinical-workspace" / "src" / "workspace-shell.css",
    ROOT / "apps" / "clinical-workspace" / "src" / "staff-shell-seed.tsx",
]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_text(path: Path) -> str:
    require(path.exists(), f"Missing required file: {path}")
    return path.read_text(encoding="utf-8")


def main() -> None:
    contract = json.loads(read_text(CONTRACT_PATH))
    require(contract["taskId"].startswith("par_265"), "265 contract taskId drifted")
    require(contract["visualMode"] == "Bounded_Consequence_Studio", "265 visual mode drifted")
    require(
        set(contract["components"])
        == {
            "SelfCareIssueStage",
            "SelfCarePreviewSummary",
            "AdminResolutionStage",
            "AdminDependencyPanel",
            "PatientExpectationPreview",
            "BoundaryDriftRecovery",
        },
        "265 component contract drifted",
    )
    require(
        set(contract["domMarkers"])
        == {
            "data-boundary-mode",
            "data-boundary-tuple",
            "data-admin-dependency-state",
            "data-advice-settlement",
            "data-admin-settlement",
        },
        "265 DOM marker contract drifted",
    )

    notes = read_text(NOTES_PATH).lower()
    for token in [
        "selfcareboundarydecision",
        "advicerendersettlement",
        "adviceadmindependencyset",
        "adminresolutionsettlement",
        "wording-reclassifies-work gap",
        "hidden-dependency-blocker gap",
        "stale-boundary-send gap",
        "patient-staff-mismatch gap",
        "detached-success-gap",
    ]:
        require(token in notes, f"265 notes lost token: {token}")

    matrix = list(csv.DictReader(read_text(MATRIX_PATH).splitlines()))
    require(len(matrix) >= 8, "265 matrix unexpectedly thin")
    require(
        {"self_care", "admin_resolution", "clinician_review_required"}
        <= {row["boundary_mode"] for row in matrix},
        "265 boundary-mode coverage drifted",
    )
    require(
        {"live", "stale_recoverable", "recovery_only", "blocked"}
        <= {row["mutation_state"] for row in matrix},
        "265 mutation-state coverage drifted",
    )

    references = json.loads(read_text(REFERENCES_PATH))
    require(
        {
            "Linear UI refresh",
            "Welcome to the new Linear",
            "Vercel Nested Layouts",
            "Vercel Dashboard Navigation",
            "IBM Carbon Data Table",
            "NHS Content Guide",
            "NHS Typography Guidance",
        }
        <= {item["source"] for item in references["references"]},
        "265 visual references drifted",
    )

    cases = json.loads(read_text(CASES_PATH))
    require(len(cases["cases"]) >= 8, "265 case coverage unexpectedly thin")
    require(
        {
            "same-shell-self-care-selection-keeps-consequence-route",
            "admin-waiting-blocker-stays-dominant",
            "completed-admin-stays-in-shell",
            "boundary-drift-freezes-action-and-preserves-context",
            "patient-preview-freezes-with-reopened-boundary",
            "reload-preserves-selected-row-and-anchor",
        }
        <= {item["id"] for item in cases["cases"]},
        "265 cases drifted",
    )

    gap = json.loads(read_text(GAP_PATH))
    require(gap["expectedOwnerTask"] == "par_266", "265 gap owner drifted")

    spec = read_text(SPEC_PATH).lower()
    for token in [
        "bounded_consequence_studio",
        "selfcareissuestage",
        "selfcarepreviewsummary",
        "adminresolutionstage",
        "admindependencypanel",
        "patientexpectationpreview",
        "boundarydriftrecovery",
        "completion stays in-shell",
    ]:
        require(token in spec, f"265 spec lost token: {token}")

    atlas = read_text(ATLAS_PATH)
    for token in [
        "selfcare-admin-views-atlas-root",
        "SelfCarePreviewSummary",
        "SelfCareIssueStage",
        "AdminResolutionStage",
        "AdminDependencyPanel",
        "PatientExpectationPreview",
        "BoundaryDriftRecovery",
    ]:
        require(token in atlas, f"265 atlas lost token: {token}")

    diagram = read_text(DIAGRAM_PATH)
    for token in [
        "SelfCareBoundaryDecision",
        "AdviceRenderSettlement",
        "AdviceAdminDependencySet",
        "AdminResolutionSettlement",
        "PatientExpectationTemplate",
        "same-shell re-entry",
    ]:
        require(token in diagram, f"265 diagram lost token: {token}")

    tokens = json.loads(read_text(TOKENS_PATH))
    require(
        tokens["tokens"]["desktop"]["mainPlaneWidth"] == "minmax(820px, 1fr)",
        "265 main plane width token drifted",
    )
    require(tokens["tokens"]["motion"]["laneMorph"] == "180ms", "265 motion token drifted")

    a11y = read_text(A11Y_PATH).lower()
    require("keyboard" in a11y, "265 a11y notes lost keyboard guidance")
    require("reduced motion" in a11y, "265 a11y notes lost reduced-motion guidance")
    require("patient expectation preview" in a11y, "265 a11y notes lost expectation guidance")

    app_text = "\n".join(read_text(path) for path in APP_PATHS)
    for component_name in contract["components"]:
        require(app_text.count(component_name) >= 1, f"app source missing 265 component: {component_name}")
    for token in [
        "WorkspaceConsequencesRoute",
        'data-testid="SelfCareAdminViewsRoute"',
        'data-testid="SelfCarePreviewSummary"',
        'data-testid="SelfCareIssueStage"',
        'data-testid="AdminResolutionStage"',
        'data-testid="AdminDependencyPanel"',
        'data-testid="PatientExpectationPreview"',
        'data-testid="BoundaryDriftRecovery"',
        "Bounded_Consequence_Studio",
        "/workspace/consequences",
        "data-boundary-mode",
        "data-boundary-tuple",
        "data-admin-dependency-state",
        "data-advice-settlement",
        "data-admin-settlement",
    ]:
        require(token in app_text, f"app source missing 265 token: {token}")

    print(
        json.dumps(
            {
                "taskId": contract["taskId"],
                "componentCount": len(contract["components"]),
                "caseCount": len(cases["cases"]),
                "referenceCount": len(references["references"]),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
