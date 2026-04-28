#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "idempotency_record_manifest.json"
MATRIX_PATH = DATA_DIR / "replay_classification_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "replay_collision_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "67_idempotency_and_collision_review_design.md"
ALGORITHM_DOC_PATH = DOCS_DIR / "67_replay_classification_algorithm.md"
STUDIO_PATH = DOCS_DIR / "67_replay_collision_studio.html"
SPEC_PATH = TESTS_DIR / "replay-collision-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


manifest = read_json(MANIFEST_PATH)
matrix_rows = read_csv(MATRIX_PATH)
casebook = read_json(CASEBOOK_PATH)
package_json = read_json(ROOT_PACKAGE_PATH)
playwright_package = read_json(PLAYWRIGHT_PACKAGE_PATH)

assert manifest["task_id"] == "par_067"
assert manifest["summary"]["idempotency_record_count"] == 5
assert manifest["summary"]["exact_replay_count"] == 1
assert manifest["summary"]["semantic_replay_count"] == 1
assert manifest["summary"]["collision_review_count"] == 2
assert manifest["summary"]["distinct_count"] == 1
assert manifest["summary"]["replay_collision_review_count"] == 2
assert manifest["summary"]["dispatch_attempt_count"] == 2
assert manifest["summary"]["receipt_checkpoint_count"] == 4
assert manifest["summary"]["casebook_count"] == 5
assert manifest["summary"]["implementation_file_count"] == 11
assert len(manifest["idempotencyRecords"]) == 5
assert len(manifest["replayCollisionReviews"]) == 2
assert len(manifest["adapterDispatchAttempts"]) == 2
assert len(manifest["adapterReceiptCheckpoints"]) == 4
assert len(matrix_rows) == 5
assert casebook["summary"]["replay_case_count"] == 5
assert casebook["summary"]["blocked_case_count"] == 2

assert DESIGN_DOC_PATH.exists()
assert ALGORITHM_DOC_PATH.exists()
assert STUDIO_PATH.exists()
assert SPEC_PATH.exists()
assert "## Authority Split" in DESIGN_DOC_PATH.read_text()
assert "## Classification Order" in ALGORITHM_DOC_PATH.read_text()

studio_text = STUDIO_PATH.read_text()
for token in [
    'data-testid="diff-pane"',
    'data-testid="decision-timeline"',
    'data-testid="inspector"',
    'data-testid="checkpoint-table"',
    'data-testid="validator-rail"',
    'data-testid="classification-matrix"',
]:
    assert token in studio_text, token

scripts = package_json["scripts"]
assert "build_idempotency_and_collision_review.py" in scripts["codegen"]
assert "pnpm validate:replay-classification" in scripts["bootstrap"]
assert "pnpm validate:replay-classification" in scripts["check"]
assert (
    scripts["validate:replay-classification"]
    == "python3 ./tools/analysis/validate_replay_classification.py"
)

playwright_scripts = playwright_package["scripts"]
for key in ["build", "lint", "test", "typecheck", "e2e"]:
    assert "replay-collision-studio.spec.js" in playwright_scripts[key], key

identity_index = (ROOT / "packages" / "domains" / "identity_access" / "src" / "index.ts").read_text()
assert 'export * from "./replay-collision-backbone";' in identity_index

domain_source = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "replay-collision-backbone.ts"
).read_text()
for token in [
    "buildCanonicalReplayHashes",
    "ReplayCollisionAuthorityService",
    "recordAdapterReceiptCheckpoint",
    "ensureAdapterDispatchAttempt",
    "validateReplayLedgerState",
]:
    assert token in domain_source, token

kernel_source = (ROOT / "packages" / "domain-kernel" / "src" / "request-intake-backbone.ts").read_text()
for token in [
    '"idempotencyRecord"',
    '"replayCollisionReview"',
    '"adapterDispatchAttempt"',
    '"adapterReceiptCheckpoint"',
]:
    assert token in kernel_source, token

command_api_source = (
    ROOT / "services" / "command-api" / "src" / "replay-collision-authority.ts"
).read_text()
assert "replayCollisionMigrationPlanRefs" in command_api_source
assert "067_idempotency_and_replay_collision.sql" in command_api_source

simulator_source = (
    ROOT / "services" / "command-api" / "src" / "replay-collision-simulator.ts"
).read_text()
for token in [
    "runAllReplayCollisionScenarios",
    "duplicate_callbacks_and_out_of_order_provider_receipts",
    "delayed_duplicate_jobs_from_outbox",
]:
    assert token in simulator_source, token

migration_source = (
    ROOT / "services" / "command-api" / "migrations" / "067_idempotency_and_replay_collision.sql"
).read_text()
for token in [
    "idx_idempotency_records_replay_composite",
    "idx_adapter_dispatch_attempts_effect_key",
    "idx_adapter_receipt_checkpoints_canonical_key",
    "trg_idempotency_collision_review_requires_review_ref",
]:
    assert token in migration_source, token

case_ids = {row["caseId"] for row in casebook["replayCases"]}
assert case_ids == {
    "CASE_067_IDENTICAL_BROWSER_TAPS",
    "CASE_067_TRANSPORT_VARIANCE",
    "CASE_067_SOURCE_ID_COLLISION",
    "CASE_067_CALLBACK_SCOPE_DRIFT",
    "CASE_067_OUTBOX_DUPLICATE_JOB",
}

print("par_067 replay classification validation passed")
