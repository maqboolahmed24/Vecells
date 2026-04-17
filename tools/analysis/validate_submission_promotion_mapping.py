#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "submission_promotion_record_manifest.json"
MATRIX_PATH = DATA_DIR / "envelope_to_request_mapping_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "promotion_replay_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "66_submission_promotion_boundary_design.md"
ALGORITHM_DOC_PATH = DOCS_DIR / "66_exactly_once_promotion_algorithm.md"
ATLAS_PATH = DOCS_DIR / "66_promotion_mapping_atlas.html"
SPEC_PATH = TESTS_DIR / "submission-promotion-atlas.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


manifest = read_json(MANIFEST_PATH)
rows = read_csv(MATRIX_PATH)
casebook = read_json(CASEBOOK_PATH)
package_json = read_json(ROOT_PACKAGE_PATH)
playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

assert manifest["task_id"] == "par_066"
assert manifest["summary"]["promotion_boundary_count"] == 6
assert manifest["summary"]["committed_promotion_count"] == 5
assert manifest["summary"]["blocked_anomaly_count"] == 1
assert manifest["summary"]["replay_case_count"] == 5
assert manifest["summary"]["lookup_index_count"] == 5
assert manifest["summary"]["parallel_interface_gap_count"] == 1
assert manifest["summary"]["implementation_file_count"] == 11
assert len(manifest["promotion_boundaries"]) == 6
assert len(rows) == 6
assert casebook["summary"]["replay_case_count"] == 5
assert len(casebook["replayCases"]) == 5

assert DESIGN_DOC_PATH.exists()
assert ALGORITHM_DOC_PATH.exists()
assert ATLAS_PATH.exists()
assert SPEC_PATH.exists()
assert "## Exact-Once Homes" in DESIGN_DOC_PATH.read_text()
assert "## Compare-And-Set Boundary" in ALGORITHM_DOC_PATH.read_text()

atlas_text = ATLAS_PATH.read_text()
for token in [
    'data-testid="bridge-diagram"',
    'data-testid="continuity-ribbon"',
    'data-testid="inspector"',
    'data-testid="mapping-table"',
    'data-testid="replay-case-table"',
]:
    assert token in atlas_text, token

scripts = package_json["scripts"]
assert "build_submission_promotion_mapping.py" in scripts["codegen"]
assert "pnpm validate:submission-promotion" in scripts["bootstrap"]
assert "pnpm validate:submission-promotion" in scripts["check"]
assert (
    scripts["validate:submission-promotion"]
    == "python3 ./tools/analysis/validate_submission_promotion_mapping.py"
)

playwright_scripts = playwright_package["scripts"]
for key in ["build", "lint", "test", "typecheck", "e2e"]:
    assert "submission-promotion-atlas.spec.js" in playwright_scripts[key], key

event_source = (ROOT / "packages" / "event-contracts" / "src" / "submission-lineage-events.ts").read_text()
for token in [
    "intake.promotion.started",
    "intake.promotion.committed",
    "intake.promotion.replay_returned",
    "intake.promotion.superseded_grants_applied",
    "emitIntakePromotionStarted",
    "emitIntakePromotionCommitted",
    "emitIntakePromotionReplayReturned",
    "emitIntakePromotionSupersededGrantsApplied",
]:
    assert token in event_source, token

identity_source = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "submission-lineage-backbone.ts"
).read_text()
for token in [
    "withPromotionBoundary",
    "findSubmissionPromotionRecordBySourceLineage",
    "findSubmissionPromotionRecordByRequestLineage",
    "findSubmissionPromotionRecordByReceiptConsistencyKey",
    "findSubmissionPromotionRecordByStatusConsistencyKey",
    "applyDraftMutabilitySupersession",
    "resolveAuthoritativeRequestShell",
    "emitIntakePromotionStarted",
    "emitIntakePromotionCommitted",
    "emitIntakePromotionReplayReturned",
    "emitIntakePromotionSupersededGrantsApplied",
]:
    assert token in identity_source, token

service_source = (ROOT / "services" / "command-api" / "src" / "submission-backbone.ts").read_text()
assert "submissionBackboneMigrationPlanRefs" in service_source
assert "066_submission_promotion_exactly_once.sql" in service_source

simulator_source = (
    ROOT / "services" / "command-api" / "src" / "submission-promotion-simulator.ts"
).read_text()
assert "runAllSubmissionPromotionReplayScenarios" in simulator_source
assert "support_resume_promoted_lineage" in simulator_source

migration_source = (
    ROOT / "services" / "command-api" / "migrations" / "066_submission_promotion_exactly_once.sql"
).read_text()
for token in [
    "idx_submission_promotion_source_lineage_unique",
    "idx_submission_promotion_status_consistency_unique",
    "trg_submission_envelope_promoted_requires_promotion_refs",
]:
    assert token in migration_source, token

case_ids = {row["caseId"] for row in casebook["replayCases"]}
assert case_ids == {
    "CASE_066_SAME_TAB_DOUBLE_SUBMIT",
    "CASE_066_CROSSTAB_RACE",
    "CASE_066_AUTH_RETURN_REPLAY",
    "CASE_066_SUPPORT_RESUME",
    "CASE_066_DELAYED_NETWORK_RETRY",
}

mapping_ids = {row["promotion_mapping_id"] for row in rows}
assert "PM_066_SUPPORT_RESUME_V1" in mapping_ids
assert "PM_066_READY_NO_RECORD_ANOMALY_V1" in mapping_ids

print("par_066 submission promotion mapping validation passed")
