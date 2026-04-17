#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_CONTRACTS_DIR = ROOT / "data" / "contracts"
DOCS_ARCHITECTURE_DIR = ROOT / "docs" / "architecture"
DOMAIN_SRC_DIR = ROOT / "packages" / "domains" / "identity_access" / "src"
DOMAIN_TESTS_DIR = ROOT / "packages" / "domains" / "identity_access" / "tests"
COMMAND_API_SRC_DIR = ROOT / "services" / "command-api" / "src"
COMMAND_API_TESTS_DIR = ROOT / "services" / "command-api" / "tests"
MIGRATIONS_DIR = ROOT / "services" / "command-api" / "migrations"
EVENT_CONTRACTS_DIR = ROOT / "packages" / "event-contracts" / "src"

PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"

DRAFT_BACKBONE_PATH = DOMAIN_SRC_DIR / "draft-session-autosave-backbone.ts"
DOMAIN_INDEX_PATH = DOMAIN_SRC_DIR / "index.ts"
DOMAIN_TEST_PATH = DOMAIN_TESTS_DIR / "draft-session-autosave-backbone.test.ts"
DOMAIN_PUBLIC_API_TEST_PATH = DOMAIN_TESTS_DIR / "public-api.test.ts"
COMMAND_API_PATH = COMMAND_API_SRC_DIR / "draft-autosave.ts"
COMMAND_API_TEST_PATH = COMMAND_API_TESTS_DIR / "draft-autosave.integration.test.js"
MIGRATION_PATH = MIGRATIONS_DIR / "082_draft_session_lease_and_autosave.sql"
EVENT_HELPERS_PATH = EVENT_CONTRACTS_DIR / "submission-lineage-events.ts"

LEASE_SCHEMA_PATH = DATA_CONTRACTS_DIR / "144_draft_session_lease.schema.json"
PATCH_SCHEMA_PATH = DATA_CONTRACTS_DIR / "144_draft_autosave_patch_envelope.schema.json"
TOKEN_STATE_SCHEMA_PATH = DATA_CONTRACTS_DIR / "144_draft_resume_token_state.schema.json"
STATE_MATRIX_PATH = DATA_ANALYSIS_DIR / "144_draft_autosave_state_matrix.csv"
RECOVERY_CASES_PATH = DATA_ANALYSIS_DIR / "144_draft_resume_and_recovery_cases.json"
DESIGN_DOC_PATH = DOCS_ARCHITECTURE_DIR / "144_draft_session_lease_and_autosave_design.md"
RULES_DOC_PATH = DOCS_ARCHITECTURE_DIR / "144_draft_merge_and_recovery_rules.md"


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    required_paths = [
        DRAFT_BACKBONE_PATH,
        DOMAIN_INDEX_PATH,
        DOMAIN_TEST_PATH,
        DOMAIN_PUBLIC_API_TEST_PATH,
        COMMAND_API_PATH,
        COMMAND_API_TEST_PATH,
        MIGRATION_PATH,
        EVENT_HELPERS_PATH,
        LEASE_SCHEMA_PATH,
        PATCH_SCHEMA_PATH,
        TOKEN_STATE_SCHEMA_PATH,
        STATE_MATRIX_PATH,
        RECOVERY_CASES_PATH,
        DESIGN_DOC_PATH,
        RULES_DOC_PATH,
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_144 artifact: {path}")

    draft_backbone_text = DRAFT_BACKBONE_PATH.read_text(encoding="utf-8")
    domain_index_text = DOMAIN_INDEX_PATH.read_text(encoding="utf-8")
    command_api_text = COMMAND_API_PATH.read_text(encoding="utf-8")
    command_api_test_text = COMMAND_API_TEST_PATH.read_text(encoding="utf-8")
    domain_test_text = DOMAIN_TEST_PATH.read_text(encoding="utf-8")
    event_helpers_text = EVENT_HELPERS_PATH.read_text(encoding="utf-8")
    migration_text = MIGRATION_PATH.read_text(encoding="utf-8")
    package_json = read_json(PACKAGE_JSON_PATH)
    lease_schema = read_json(LEASE_SCHEMA_PATH)
    patch_schema = read_json(PATCH_SCHEMA_PATH)
    token_state_schema = read_json(TOKEN_STATE_SCHEMA_PATH)
    state_matrix_rows = read_csv_rows(STATE_MATRIX_PATH)
    recovery_cases = read_json(RECOVERY_CASES_PATH)
    docs_text = DESIGN_DOC_PATH.read_text(encoding="utf-8") + "\n" + RULES_DOC_PATH.read_text(
        encoding="utf-8"
    )

    for token in [
        "DraftSessionLeaseDocument",
        "DraftMutationRecordDocument",
        "DraftSaveSettlementDocument",
        "DraftMergePlanDocument",
        "DraftRecoveryRecordDocument",
        "DraftContinuityEvidenceProjectionDocument",
        "createDraftSessionAutosaveService",
        "BACKGROUND_LEASE_MUTATION_FORBIDDEN",
        "supersedeDraftForPromotion",
    ]:
        ensure(token in draft_backbone_text, f"Draft backbone lost required token {token}.")

    ensure(
        'export * from "./draft-session-autosave-backbone";' in domain_index_text,
        "Domain package index does not export the draft autosave backbone.",
    )
    ensure(
        "emitIntakeDraftUpdated" in event_helpers_text
        and '"intake.draft.updated"' in event_helpers_text,
        "Submission lineage event helpers no longer publish intake.draft.updated.",
    )

    for token in [
        "createDraftAutosaveApplication",
        "draftAutosavePersistenceTables",
        "draftAutosaveMigrationPlanRefs",
        "082_draft_session_lease_and_autosave.sql",
    ]:
        ensure(token in command_api_text, f"Command API seam lost required token {token}.")

    for table_name in [
        "draft_session_leases",
        "draft_mutation_records",
        "draft_save_settlements",
        "draft_merge_plans",
        "draft_recovery_records",
        "draft_continuity_evidence_projections",
    ]:
        ensure(table_name in migration_text, f"Migration is missing table {table_name}.")

    ensure(
        package_json["scripts"].get("validate:draft-autosave-backend")
        == "python3 ./tools/analysis/validate_draft_autosave_backend.py",
        "package.json is missing validate:draft-autosave-backend.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:draft-autosave-backend"]
        == "python3 ./tools/analysis/validate_draft_autosave_backend.py",
        "root_script_updates.py is missing validate:draft-autosave-backend.",
    )
    ensure(
        "pnpm validate:draft-autosave-backend" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:draft-autosave-backend" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings do not include validate:draft-autosave-backend.",
    )

    ensure(lease_schema["title"] == "DraftSessionLease", "DraftSessionLease schema title drifted.")
    ensure(
        lease_schema["properties"]["leaseMode"]["enum"] == ["foreground_mutating", "background_read_only"],
        "DraftSessionLease schema no longer freezes the lease modes.",
    )
    ensure(
        patch_schema["title"] == "DraftAutosavePatchEnvelope",
        "DraftAutosavePatchEnvelope schema title drifted.",
    )
    ensure(
        set(patch_schema["required"])
        >= {"draftVersion", "clientCommandId", "idempotencyKey", "leaseId", "resumeToken", "recordedAt"},
        "DraftAutosavePatchEnvelope schema lost required fields.",
    )
    ensure(
        token_state_schema["title"] == "DraftResumeTokenState",
        "DraftResumeTokenState schema title drifted.",
    )
    ensure(
        {"stable_writable", "stable_read_only", "recovery_only", "blocked"}
        == set(token_state_schema["properties"]["continuityState"]["enum"]),
        "DraftResumeTokenState continuity grammar drifted.",
    )

    matrix_state_cases = {row["state_case"] for row in state_matrix_rows}
    for case in [
        "authoritative_save",
        "background_read_only_resume",
        "background_mutation_blocked",
        "stale_version_conflict",
        "resume_token_or_runtime_drift",
        "promotion_superseded",
    ]:
        ensure(case in matrix_state_cases, f"Draft autosave state matrix is missing {case}.")

    case_ids = {case["caseId"] for case in recovery_cases["cases"]}
    for case in [
        "PAR144_CREATE_AND_AUTOSAVE_REPLAY",
        "PAR144_BACKGROUND_TAB_MUTATION_BLOCKED",
        "PAR144_STALE_VERSION_MERGE_PLAN",
        "PAR144_RUNTIME_OR_TOKEN_DRIFT",
        "PAR144_PROMOTED_DRAFT_SUPERSESSION",
    ]:
        ensure(case in case_ids, f"Draft recovery cases are missing {case}.")

    for token in [
        "SEAM_143_DRAFT_AUTOSAVE_AND_RESUME_STATE",
        "SubmissionEnvelope",
        "DraftContinuityEvidenceProjection",
        "Mock_now_execution",
        "Actual_production_strategy_later",
        "BACKGROUND_LEASE_MUTATION_FORBIDDEN",
        "PROMOTED_REQUEST_AVAILABLE",
    ]:
        ensure(token in docs_text, f"Draft autosave docs lost required token {token}.")

    for token in [
        "BACKGROUND_LEASE_MUTATION_FORBIDDEN",
        "DRAFT_VERSION_CONFLICT",
        "promoted_request_available",
    ]:
        ensure(token in domain_test_text, f"Domain tests no longer cover {token}.")

    ensure(
        "background_read_only" in command_api_test_text
        and "BACKGROUND_LEASE_MUTATION_FORBIDDEN" in command_api_test_text,
        "Command API integration test no longer proves background lease fencing.",
    )


if __name__ == "__main__":
    main()
