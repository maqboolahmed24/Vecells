#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

MANIFEST_PATH = DATA_DIR / "submission_and_lineage_aggregate_manifest.json"
MATRIX_PATH = DATA_DIR / "submission_and_lineage_invariant_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "62_submission_and_lineage_aggregate_design.md"
RULES_DOC_PATH = DOCS_DIR / "62_submission_and_lineage_state_rules.md"
ROOT_PACKAGE_PATH = ROOT / "package.json"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


manifest = read_json(MANIFEST_PATH)
rows = read_csv(MATRIX_PATH)
package_json = read_json(ROOT_PACKAGE_PATH)

assert manifest["task_id"] == "par_062"
assert manifest["summary"]["aggregate_count"] == 6
assert manifest["summary"]["repository_interface_count"] == 6
assert manifest["summary"]["command_seam_count"] == 10
assert manifest["summary"]["event_seam_count"] == 10
assert manifest["summary"]["persistence_table_count"] == 6
assert manifest["summary"]["parallel_interface_gap_count"] == 2
assert manifest["summary"]["implementation_file_count"] == 11
assert manifest["summary"]["invariant_count"] == 10
assert len(manifest["aggregates"]) == 6
assert len(manifest["repositories"]) == 6
assert len(manifest["command_seams"]) == 10
assert len(manifest["event_seams"]) == 10
assert len(manifest["parallel_interface_gaps"]) == 2
assert len(rows) == 10

aggregate_names = {row["name"] for row in manifest["aggregates"]}
assert aggregate_names == {
    "SubmissionEnvelope",
    "SubmissionPromotionRecord",
    "RequestLineage",
    "LineageCaseLink",
    "Episode",
    "Request",
}

event_names = {row["eventName"] for row in manifest["event_seams"]}
assert "intake.resume.continuity.updated" in event_names
assert "request.lineage.branched" in event_names
assert "request.lineage.case_link.changed" in event_names

gap_ids = {row["gapId"] for row in manifest["parallel_interface_gaps"]}
assert gap_ids == {
    "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_BRANCHED_EVENT",
    "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_CASE_LINK_CHANGED_EVENT",
}

for rel_path in manifest["implementation_files"]:
    assert (ROOT / rel_path).exists(), rel_path

assert DESIGN_DOC_PATH.exists()
assert RULES_DOC_PATH.exists()
assert "## Aggregate Homes" in DESIGN_DOC_PATH.read_text()
assert "## Invariant Matrix" in RULES_DOC_PATH.read_text()

scripts = package_json["scripts"]
assert "build_submission_and_lineage_backbone.py" in scripts["codegen"]
assert "pnpm validate:submission-lineage" in scripts["check"]
assert "pnpm validate:submission-lineage" in scripts["bootstrap"]
assert scripts["validate:submission-lineage"] == "python3 ./tools/analysis/validate_submission_and_lineage_backbone.py"

domain_kernel_index = (ROOT / "packages" / "domain-kernel" / "src" / "index.ts").read_text()
identity_index = (ROOT / "packages" / "domains" / "identity_access" / "src" / "index.ts").read_text()
event_index = (ROOT / "packages" / "event-contracts" / "src" / "index.ts").read_text()

assert 'export * from "./request-intake-backbone";' in domain_kernel_index
assert 'export * from "./submission-lineage-backbone";' in identity_index
assert 'export * from "./submission-lineage-events";' in event_index

build_monorepo = (ROOT / "tools" / "analysis" / "build_monorepo_scaffold.py").read_text()
build_domain_packages = (ROOT / "tools" / "analysis" / "build_domain_package_scaffold.py").read_text()
build_events = (ROOT / "tools" / "analysis" / "build_event_registry.py").read_text()

assert 'export * from "./request-intake-backbone";' in build_monorepo
assert 'export * from "./submission-lineage-backbone";' in build_domain_packages
assert 'export * from "./submission-lineage-events";' in build_events

event_helper_source = (ROOT / "packages" / "event-contracts" / "src" / "submission-lineage-events.ts").read_text()
assert "intake.resume.continuity.updated" in event_helper_source
assert "emitIntakeResumeContinuityUpdated" in event_helper_source
assert "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_BRANCHED_EVENT" in event_helper_source
assert "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_CASE_LINK_CHANGED_EVENT" in event_helper_source

identity_backbone_source = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "submission-lineage-backbone.ts"
).read_text()
for token in [
    "class SubmissionLineageCommandService",
    "async promoteEnvelope",
    "async continueRequestLineage",
    "async branchRequestLineage",
    "async proposeLineageCaseLink",
    "async transitionLineageCaseLink",
    "emitRequestLineageBranched",
    "emitRequestLineageCaseLinkChanged",
]:
    assert token in identity_backbone_source, token

migration_source = (
    ROOT / "services" / "command-api" / "migrations" / "062_submission_and_lineage_backbone.sql"
).read_text()
for table_name in [
    "submission_envelopes",
    "submission_promotion_records",
    "episodes",
    "requests",
    "request_lineages",
    "lineage_case_links",
]:
    assert table_name in migration_source, table_name

invariant_ids = {row["invariant_id"] for row in rows}
assert "INV_062_ENVELOPE_DRAFT_BOUNDARY" in invariant_ids
assert "INV_062_PROMOTION_EXACTLY_ONCE" in invariant_ids
assert "INV_062_CHILD_LINK_CANNOT_WRITE_REQUEST_WORKFLOW" in invariant_ids

print("par_062 submission and lineage backbone validation passed")
