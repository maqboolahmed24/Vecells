#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


REPO_ROOT = Path("/Users/test/Code/V")


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    taxonomy_path = REPO_ROOT / "data/contracts/140_request_type_taxonomy.json"
    question_defs_path = REPO_ROOT / "data/contracts/140_question_definitions.json"
    ui_contract_path = REPO_ROOT / "data/contracts/156_progressive_question_ui_contract.json"
    visibility_matrix_path = REPO_ROOT / "data/analysis/156_question_visibility_and_supersession_matrix.csv"
    compatibility_matrix_path = REPO_ROOT / "data/analysis/156_bundle_resume_compatibility_matrix.csv"
    gallery_path = REPO_ROOT / "docs/frontend/156_request_type_and_question_flow_gallery.html"
    mermaid_path = REPO_ROOT / "docs/frontend/156_question_tree_and_anchor_continuity.mmd"
    flow_doc_path = REPO_ROOT / "docs/architecture/156_request_type_and_progressive_question_flow.md"
    rules_doc_path = REPO_ROOT / "docs/architecture/156_bundle_compatibility_and_supersession_rules.md"

    for path in [
        taxonomy_path,
        question_defs_path,
        ui_contract_path,
        visibility_matrix_path,
        compatibility_matrix_path,
        gallery_path,
        mermaid_path,
        flow_doc_path,
        rules_doc_path,
    ]:
        require(path.exists(), f"Missing required par_156 artifact: {path}")

    taxonomy = load_json(taxonomy_path)
    question_defs = load_json(question_defs_path)
    ui_contract = load_json(ui_contract_path)

    require(ui_contract["taskId"] == "par_156", "UI contract taskId drifted.")
    require(
        ui_contract["uiContractId"] == "PHASE1_PROGRESSIVE_QUESTION_UI_CONTRACT_V1",
        "UI contract id drifted.",
    )

    taxonomy_request_types = {entry["requestType"] for entry in taxonomy["requestTypes"]}
    ui_request_types = {entry["requestType"] for entry in ui_contract["requestTypeUiProfiles"]}
    require(
        taxonomy_request_types == ui_request_types,
        "Request type UI profiles no longer cover the pinned seq_140 taxonomy exactly.",
    )

    question_keys_by_request_type: dict[str, list[str]] = {
        entry["requestType"]: entry["questionKeys"] for entry in taxonomy["questionSets"]
    }
    question_def_keys = {entry["questionKey"] for entry in question_defs["questionDefinitions"]}

    summary_renderers = {entry["summaryRenderer"] for entry in question_defs["questionDefinitions"]}
    labeled_renderers = {entry["summaryRenderer"] for entry in ui_contract["summaryRendererLabels"]}
    require(
        summary_renderers <= labeled_renderers,
        "Not every seq_140 summaryRenderer has a par_156 UI label mapping.",
    )

    for profile in ui_contract["questionGroupProfiles"]:
        request_type = profile["requestType"]
        expected_keys = question_keys_by_request_type[request_type]
        root_keys = profile["rootQuestionKeys"]
        dependent_keys = [
            key
            for dependency in profile["dependencies"]
            for key in dependency["dependentQuestionKeys"]
        ]
        all_ui_keys = root_keys + dependent_keys
        require(
            sorted(all_ui_keys) == sorted(expected_keys),
            f"Question group profile for {request_type} no longer covers the pinned question set.",
        )
        require(
            len(set(all_ui_keys)) == len(all_ui_keys),
            f"Question group profile for {request_type} duplicates question keys.",
        )
        require(
            set(root_keys).isdisjoint(dependent_keys),
            f"Question group profile for {request_type} mixes root and dependent keys.",
        )

    with visibility_matrix_path.open("r", encoding="utf-8", newline="") as handle:
        visibility_rows = list(csv.DictReader(handle))
    require(
        len(visibility_rows) == len(question_defs["questionDefinitions"]),
        "Visibility matrix row count no longer matches the pinned question definition count.",
    )
    require(
        {row["question_key"] for row in visibility_rows} == question_def_keys,
        "Visibility matrix question keys drifted from the pinned question definitions.",
    )

    with compatibility_matrix_path.open("r", encoding="utf-8", newline="") as handle:
        compatibility_rows = list(csv.DictReader(handle))
    require(len(compatibility_rows) == 3, "Compatibility matrix must publish the three required modes.")
    require(
        {row["compatibility_mode"] for row in compatibility_rows}
        == {"resume_compatible", "review_migration_required", "blocked"},
        "Compatibility matrix modes drifted.",
    )

    gallery_html = gallery_path.read_text(encoding="utf-8")
    for marker in [
        'data-testid="request-type-flow-gallery"',
        'data-testid="request-type-gallery-grid"',
        'data-testid="question-frame-gallery"',
        'data-testid="question-tree-diagram"',
        'data-testid="question-tree-table"',
        'data-testid="request-type-gallery-route-grid"',
        'data-testid="supersession-gallery-notice"',
        'data-testid="compatibility-sheet-gallery"',
        "/start-request",
        "same-shell",
    ]:
        require(marker in gallery_html, f"Gallery is missing required marker: {marker}")

    mermaid_text = mermaid_path.read_text(encoding="utf-8")
    require("request-proof" in mermaid_text, "Mermaid route map lost the request-proof anchor.")
    require("/start-request" in mermaid_text, "Mermaid route map lost the implemented alias.")

    print("validate_request_type_and_progressive_flow: ok")


if __name__ == "__main__":
    main()
