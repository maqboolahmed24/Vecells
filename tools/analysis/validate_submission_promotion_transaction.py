#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


def ensure(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    package_json_path = ROOT / "package.json"
    root_script_updates_path = ROOT / "tools" / "analysis" / "root_script_updates.py"
    command_api_package_path = ROOT / "services" / "command-api" / "package.json"
    domain_index_path = ROOT / "packages" / "domains" / "intake_request" / "src" / "index.ts"
    domain_runtime_path = (
        ROOT / "packages" / "domains" / "intake_request" / "src" / "submission-promotion-transaction.ts"
    )
    domain_public_api_test_path = (
        ROOT / "packages" / "domains" / "intake_request" / "tests" / "public-api.test.ts"
    )
    domain_test_path = (
        ROOT
        / "packages"
        / "domains"
        / "intake_request"
        / "tests"
        / "submission-promotion-transaction.test.ts"
    )
    command_api_path = ROOT / "services" / "command-api" / "src" / "intake-submit.ts"
    command_api_test_path = (
        ROOT / "services" / "command-api" / "tests" / "intake-submit.integration.test.js"
    )
    migration_path = (
        ROOT
        / "services"
        / "command-api"
        / "migrations"
        / "085_phase1_submission_snapshot_freeze_and_promotion.sql"
    )
    contract_path = ROOT / "data" / "contracts" / "148_intake_submit_settlement_contract.json"
    matrix_path = ROOT / "data" / "analysis" / "148_submit_replay_classification_matrix.csv"
    cases_path = ROOT / "data" / "analysis" / "148_promotion_transaction_cases.json"
    design_doc_path = ROOT / "docs" / "architecture" / "148_submission_promotion_transaction_design.md"
    rules_doc_path = ROOT / "docs" / "architecture" / "148_replay_and_collision_review_rules.md"

    required_paths = [
      package_json_path,
      root_script_updates_path,
      command_api_package_path,
      domain_index_path,
      domain_runtime_path,
      domain_public_api_test_path,
      domain_test_path,
      command_api_path,
      command_api_test_path,
      migration_path,
      contract_path,
      matrix_path,
      cases_path,
      design_doc_path,
      rules_doc_path,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_148 artifact: {path}")

    package_json = read_json(package_json_path)
    command_api_package = read_json(command_api_package_path)
    contract = read_json(contract_path)
    cases = read_json(cases_path)
    matrix_rows = read_csv_rows(matrix_path)

    domain_index_text = domain_index_path.read_text(encoding="utf-8")
    domain_runtime_text = domain_runtime_path.read_text(encoding="utf-8")
    domain_public_api_test_text = domain_public_api_test_path.read_text(encoding="utf-8")
    domain_test_text = domain_test_path.read_text(encoding="utf-8")
    command_api_text = command_api_path.read_text(encoding="utf-8")
    command_api_test_text = command_api_test_path.read_text(encoding="utf-8")
    migration_text = migration_path.read_text(encoding="utf-8")
    docs_text = design_doc_path.read_text(encoding="utf-8") + "\n" + rules_doc_path.read_text(
        encoding="utf-8"
    )

    ensure(
        package_json["scripts"].get("validate:submission-promotion-transaction")
        == "python3 ./tools/analysis/validate_submission_promotion_transaction.py",
        "package.json is missing validate:submission-promotion-transaction.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:submission-promotion-transaction"]
        == "python3 ./tools/analysis/validate_submission_promotion_transaction.py",
        "root_script_updates.py is missing validate:submission-promotion-transaction.",
    )
    ensure(
        "pnpm validate:submission-promotion-transaction" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:submission-promotion-transaction" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings do not include validate:submission-promotion-transaction.",
    )
    ensure(
        command_api_package["dependencies"].get("@vecells/domain-intake-request") == "workspace:*",
        "services/command-api/package.json must depend on @vecells/domain-intake-request.",
    )

    ensure(
        'export * from "./submission-promotion-transaction";' in domain_index_text,
        "Domain package index must export submission-promotion-transaction.",
    )
    for token in [
        "SubmissionSnapshotFreezeDocument",
        "SubmitNormalizationSeedDocument",
        "IntakeSubmitSettlementDocument",
        "createSubmissionPromotionTransactionStore",
        "buildSubmitReplaySemanticFingerprint",
    ]:
        ensure(token in domain_runtime_text, f"submission-promotion-transaction.ts is missing {token}.")

    for token in [
        "withPromotionBoundary",
        "resolveInboundCommand",
        "createEvidenceSnapshot",
        "promoteEnvelope",
        "supersedeGrants",
        "saveDraftLease",
        "IntakeSubmitSettlementDocument.create",
        "collision_review",
        "semantic_replay",
        "stale_recoverable",
    ]:
        ensure(token in command_api_text, f"intake-submit.ts is missing {token}.")

    ensure(
        "createSubmissionPromotionTransactionStore" in domain_public_api_test_text
        and "IntakeSubmitSettlementDocument.create" in domain_public_api_test_text,
        "Public API test must assert submission-promotion exports.",
    )
    for token in [
        "append-only",
        "buildSubmitReplaySemanticFingerprint",
        "IMMUTABLE_SUBMISSIONSNAPSHOTFREEZE_REWRITE_FORBIDDEN",
    ]:
        ensure(token in domain_test_text, f"Domain tests lost {token}.")

    for token in [
        "exact_replay",
        "semantic_replay",
        "collision_review",
        "stale_recoverable",
        "Promise.all",
        "withSystemAttachmentRefs",
    ]:
        ensure(token in command_api_test_text, f"Integration tests lost {token}.")

    for required_table in [
        "phase1_submission_snapshot_freezes",
        "phase1_submit_normalization_seeds",
        "phase1_intake_submit_settlements",
    ]:
        ensure(required_table in migration_text, f"Migration must create {required_table}.")

    ensure(contract["taskId"] == "par_148", "Submit settlement contract must declare taskId par_148.")
    ensure(
        contract["contractId"] == "PHASE1_INTAKE_SUBMIT_SETTLEMENT_V1",
        "Submit settlement contract ID drifted.",
    )
    ensure(
        contract["submitBoundaryRules"]["immutableEvidenceFreezeRequiredBeforeNormalization"] is True,
        "Contract must require immutable evidence freeze before normalization.",
    )
    ensure(
        set(contract["decisionClasses"])
        == {
            "new_lineage",
            "exact_replay",
            "semantic_replay",
            "collision_review",
            "stale_recoverable",
            "submit_blocked",
        },
        "Decision-class catalog drifted.",
    )
    ensure(
        "Request" in contract["authoritativeReferences"]["requiredOnNewLineage"]
        and "SubmissionPromotionRecord"
        in contract["authoritativeReferences"]["requiredOnNewLineage"],
        "New-lineage references are incomplete.",
    )

    ensure(matrix_rows, "Replay classification matrix must contain rows.")
    matrix_decisions = {row["decision_class"] for row in matrix_rows}
    ensure(
        matrix_decisions
        == {
            "new_lineage",
            "exact_replay",
            "semantic_replay",
            "collision_review",
            "stale_recoverable",
            "submit_blocked",
        },
        "Replay classification matrix drifted.",
    )

    case_ids = {case["caseId"] for case in cases["cases"]}
    ensure(
        case_ids
        == {
            "submit_new_lineage_browser_ready",
            "submit_exact_replay_same_payload",
            "submit_semantic_replay_raw_only_projection_drift",
            "submit_collision_review_changed_semantics_same_command_identity",
            "submit_stale_recoverable_bad_resume_token",
        },
        "Promotion transaction case catalog drifted.",
    )

    for token in [
        "submitted",
        "SubmissionPromotionRecord",
        "IntakeSubmitSettlement",
        "collision_review",
        "same-request-attach",
    ]:
        ensure(token in docs_text, f"par_148 docs are missing {token}.")

    print("validate_submission_promotion_transaction: ok")


if __name__ == "__main__":
    main()
