#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools" / "analysis"))

from root_script_updates import ROOT_SCRIPT_UPDATES


PACKAGE_JSON_PATH = ROOT / "package.json"
ROOT_SCRIPT_UPDATES_PATH = ROOT / "tools" / "analysis" / "root_script_updates.py"
CHECKLIST_PATH = ROOT / "prompt" / "checklist.md"

DRAFT_RUNTIME_PATH = ROOT / "packages" / "domains" / "identity_access" / "src" / "draft-session-autosave-backbone.ts"
INTAKE_SUBMIT_PATH = ROOT / "services" / "command-api" / "src" / "intake-submit.ts"
DRAFT_TEST_PATH = ROOT / "packages" / "domains" / "identity_access" / "tests" / "draft-session-autosave-backbone.test.ts"
INTAKE_SUBMIT_TEST_PATH = ROOT / "services" / "command-api" / "tests" / "intake-submit.integration.test.js"

CONTRACT_PATH = ROOT / "data" / "contracts" / "154_resume_blocking_and_recovery_contract.json"
MATRIX_PATH = ROOT / "data" / "analysis" / "154_stale_draft_resume_matrix.csv"
REASONS_PATH = ROOT / "data" / "analysis" / "154_supersession_reason_codes.json"
DESIGN_DOC_PATH = ROOT / "docs" / "architecture" / "154_promoted_draft_supersession_and_resume_blocking.md"
MATRIX_DOC_PATH = ROOT / "docs" / "architecture" / "154_post_promotion_resume_resolution_matrix.md"


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
        PACKAGE_JSON_PATH,
        ROOT_SCRIPT_UPDATES_PATH,
        CHECKLIST_PATH,
        DRAFT_RUNTIME_PATH,
        INTAKE_SUBMIT_PATH,
        DRAFT_TEST_PATH,
        INTAKE_SUBMIT_TEST_PATH,
        CONTRACT_PATH,
        MATRIX_PATH,
        REASONS_PATH,
        DESIGN_DOC_PATH,
        MATRIX_DOC_PATH,
    ]
    for path in required_paths:
        ensure(path.exists(), f"Missing par_154 artifact: {path}")

    package_json = read_json(PACKAGE_JSON_PATH)
    contract = read_json(CONTRACT_PATH)
    matrix_rows = read_csv_rows(MATRIX_PATH)
    reasons = read_json(REASONS_PATH)

    draft_runtime_text = DRAFT_RUNTIME_PATH.read_text(encoding="utf-8")
    intake_submit_text = INTAKE_SUBMIT_PATH.read_text(encoding="utf-8")
    draft_test_text = DRAFT_TEST_PATH.read_text(encoding="utf-8")
    intake_submit_test_text = INTAKE_SUBMIT_TEST_PATH.read_text(encoding="utf-8")
    docs_text = DESIGN_DOC_PATH.read_text(encoding="utf-8") + "\n" + MATRIX_DOC_PATH.read_text(
        encoding="utf-8"
    )
    checklist_text = CHECKLIST_PATH.read_text(encoding="utf-8")

    ensure(
        package_json["scripts"].get("validate:promoted-draft-supersession")
        == "python3 ./tools/analysis/validate_promoted_draft_supersession.py",
        "package.json is missing validate:promoted-draft-supersession.",
    )
    ensure(
        ROOT_SCRIPT_UPDATES["validate:promoted-draft-supersession"]
        == "python3 ./tools/analysis/validate_promoted_draft_supersession.py",
        "root_script_updates.py is missing validate:promoted-draft-supersession.",
    )
    ensure(
        "pnpm validate:promoted-draft-supersession" in ROOT_SCRIPT_UPDATES["bootstrap"]
        and "pnpm validate:promoted-draft-supersession" in ROOT_SCRIPT_UPDATES["check"],
        "Root script update strings must include validate:promoted-draft-supersession.",
    )

    ensure(
        contract["taskId"] == "par_154",
        "Promoted draft resume contract must declare taskId par_154.",
    )
    ensure(
        contract["contractId"] == "PHASE1_PROMOTED_DRAFT_RESUME_BLOCKING_CONTRACT_V1",
        "Promoted draft resume contract ID drifted.",
    )
    ensure(
        contract["grantSupersession"]["causeClass"] == "draft_promoted",
        "Grant supersession causeClass must stay draft_promoted.",
    )
    ensure(
        contract["leaseSupersession"]["releaseReason"] == "draft_promoted",
        "Lease supersession releaseReason must stay draft_promoted.",
    )
    ensure(
        set(contract["routeEntry"]["authorityStates"])
        == {"draft_mutable", "request_redirect", "recovery_only", "denied_scope"},
        "Route-entry authority states drifted.",
    )
    ensure(
        set(contract["routeEntry"]["targetIntents"])
        == {
            "resume_draft",
            "open_request_receipt",
            "open_request_status",
            "open_urgent_guidance",
            "resume_recovery",
            "blocked_policy",
        },
        "Route-entry target intents drifted.",
    )
    ensure(
        set(contract["routeEntry"]["proofStates"])
        == {"grant_valid", "grant_superseded_same_lineage", "lease_same_lineage", "none"},
        "Route-entry proof states drifted.",
    )
    ensure(
        contract["replayLaw"]["acceptedSubmitReplayIgnoresPostPromotionValidationDrift"] is True,
        "Replay law must explicitly ignore post-promotion validation drift.",
    )
    ensure(
        contract["replayLaw"]["rawReplayHashExcludes"] == ["validationVerdictHash"],
        "Replay law must exclude validationVerdictHash from the raw submit replay hash.",
    )
    ensure(
        contract["nonNegotiables"]["promotedLineageMayReopenMutableDraft"] is False,
        "Promoted lineage must remain permanently non-mutable.",
    )

    scenario_ids = {row["scenario_id"] for row in matrix_rows}
    ensure(
        {
            "mutable_refresh_before_promotion",
            "promoted_refresh_same_lineage_receipt",
            "promoted_stale_tab_same_lineage_receipt",
            "promoted_request_status_redirect",
            "promoted_auth_return_urgent",
            "promoted_copied_link_without_scope",
            "broken_or_missing_proof_recovery",
        }.issubset(scenario_ids),
        "Stale draft resume matrix is missing required scenarios.",
    )
    ensure(
        {row["target_intent"] for row in matrix_rows}
        >= {
            "resume_draft",
            "open_request_receipt",
            "open_request_status",
            "open_urgent_guidance",
            "resume_recovery",
            "blocked_policy",
        },
        "Resume matrix must cover every target intent family.",
    )

    reason_codes = {entry["code"] for entry in reasons["reasonCodes"]}
    ensure(
        {
            "DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY",
            "PROMOTED_REQUEST_AVAILABLE",
            "GAP_RESOLVED_POST_PROMOTION_RECOVERY_ROUTE_ENTRY_V1",
            "PROMOTED_REQUEST_VIEW_NOT_GRANTED",
            "DRAFT_ROUTE_ENTRY_RECOVERY_REQUIRED",
            "DRAFT_RESUME_GRANT_NOT_FOUND",
            "DRAFT_RESUME_SCOPE_ENVELOPE_NOT_FOUND",
            "DRAFT_RESUME_TOKEN_FORMAT_INVALID",
            "GRANT_ALREADY_SUPERSEDED",
        }.issubset(reason_codes),
        "Reason-code catalog is missing required post-promotion codes.",
    )

    for token in [
        "resolveDraftRouteEntry",
        "ensurePromotedRequestRecovery",
        "supersedeDraftForPromotion",
        '"grant_superseded_same_lineage"',
        '"open_request_receipt"',
        '"open_request_status"',
        '"open_urgent_guidance"',
        '"PROMOTED_REQUEST_AVAILABLE"',
        '"PROMOTED_REQUEST_VIEW_NOT_GRANTED"',
        '"DRAFT_ROUTE_ENTRY_RECOVERY_REQUIRED"',
    ]:
        ensure(token in draft_runtime_text, f"draft-session-autosave-backbone.ts is missing {token}.")

    raw_payload_start = intake_submit_text.index("function buildSubmitRawPayload")
    semantic_payload_start = intake_submit_text.index("function buildSubmitSemanticPayload")
    raw_payload_section = intake_submit_text[raw_payload_start:semantic_payload_start]
    ensure(
        "validationVerdictHash" not in raw_payload_section,
        "buildSubmitRawPayload must not include validationVerdictHash after promotion blocking.",
    )
    for token in [
        "drafts.supersedeDraftForPromotion",
        '"DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY"',
        '"GAP_RESOLVED_POST_PROMOTION_RECOVERY_ROUTE_ENTRY_V1"',
    ]:
        ensure(token in intake_submit_text, f"intake-submit.ts is missing {token}.")

    for token in [
        '"keeps promotion supersession exact-once and resolves stale route entry to the authoritative request shell"',
        '"routes same-lineage promoted draft re-entry to request status once the request is already active"',
        '"keeps background tabs from mutating after promotion and routes them into promoted-request recovery"',
        '"open_request_status"',
        '"promoted_request_available"',
    ]:
        ensure(token in draft_test_text, f"draft-session-autosave-backbone.test.ts is missing {token}.")

    for token in [
        'expect(replay.decisionClass).toBe("exact_replay")',
        'expect(replay.decisionClass).toBe("semantic_replay")',
        'expect(routeResolution.targetIntent).toBe("open_request_receipt")',
        'expect(routeResolution.targetIntent).toBe("open_urgent_guidance")',
    ]:
        ensure(token in intake_submit_test_text, f"intake-submit.integration.test.js is missing {token}.")

    for phrase in [
        "promoted lineage may never reopen as a mutable draft",
        "same-lineage request truth",
        "exact replay",
        "open_request_status",
    ]:
        ensure(phrase in docs_text.lower(), f"Documentation is missing phrase: {phrase}")

    ensure(
        "- [X] par_154_phase1_track_backend_build_promoted_draft_token_supersession_and_resume_blocking"
        in checklist_text,
        "Checklist row for par_154 must be marked complete.",
    )

    print("par_154 promoted draft supersession artifacts validated")


if __name__ == "__main__":
    main()
