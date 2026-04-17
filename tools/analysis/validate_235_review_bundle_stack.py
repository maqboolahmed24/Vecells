#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]

CHECKLIST = ROOT / "prompt" / "checklist.md"
PACKAGE_JSON = ROOT / "package.json"
ROOT_SCRIPT_UPDATES = ROOT / "tools" / "analysis" / "root_script_updates.py"

ARCH_DOC = ROOT / "docs" / "architecture" / "235_review_bundle_assembler_and_suggestion_seam.md"
SECURITY_DOC = (
    ROOT / "docs" / "security" / "235_review_summary_parity_and_shadow_model_boundaries.md"
)
REVIEW_BUNDLE_SCHEMA = ROOT / "data" / "contracts" / "235_review_bundle.schema.json"
SUGGESTION_SCHEMA = ROOT / "data" / "contracts" / "235_suggestion_envelope.schema.json"
DELTA_SCHEMA = ROOT / "data" / "contracts" / "235_evidence_delta_packet.schema.json"
REVIEW_CASES = ROOT / "data" / "analysis" / "235_review_bundle_cases.csv"
DELTA_CASES = ROOT / "data" / "analysis" / "235_delta_packet_and_superseded_context_cases.csv"
GAP_LOG = ROOT / "data" / "analysis" / "PARALLEL_INTERFACE_GAP_PHASE3_REVIEW_BUNDLE_STACK.json"

KERNEL_INDEX = ROOT / "packages" / "domain-kernel" / "src" / "index.ts"
KERNEL_CONTRACTS = ROOT / "packages" / "domain-kernel" / "src" / "review-bundle-contracts.ts"
KERNEL_TEST = ROOT / "packages" / "domain-kernel" / "tests" / "review-bundle-contracts.test.ts"
SUPPORT_INDEX = ROOT / "packages" / "domains" / "support" / "src" / "index.ts"
COMMAND_API = ROOT / "services" / "command-api" / "src" / "review-bundle-assembler.ts"
SERVICE_DEFINITION = ROOT / "services" / "command-api" / "src" / "service-definition.ts"
INTEGRATION_TEST = ROOT / "services" / "command-api" / "tests" / "review-bundle-assembler.integration.test.js"


def fail(message: str) -> None:
    raise SystemExit(f"[235-review-bundle-stack] {message}")


def read(path: Path) -> str:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def require_text(path: Path, snippets: list[str]) -> None:
    text = read(path)
    for snippet in snippets:
        if snippet not in text:
            fail(f"{path.relative_to(ROOT)} is missing required text: {snippet}")


def load_json(path: Path):
    try:
        return json.loads(read(path))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"missing required file {path.relative_to(ROOT)}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate_checklist() -> None:
    checklist = read(CHECKLIST)
    for task_id in range(230, 235):
        pattern = rf"^- \[[Xx]\] (?:seq|par)_{task_id:03d}_"
        if task_id == 235:
            pattern = (
                r"^- \[[Xx-]\] par_235_phase3_track_backend_build_review_bundle_assembler_"
                r"deterministic_summaries_and_suggestion_seam"
            )
        if not re.search(pattern, checklist, re.MULTILINE):
            fail(f"task {task_id:03d} is not in the required state")


def validate_docs() -> None:
    require_text(
        ARCH_DOC,
        [
            "GET /v1/workspace/tasks/{taskId}/review-bundle",
            "GET /internal/v1/workspace/tasks/{taskId}/review-bundle/suggestions",
            "ReviewBundleAssembler",
            "EvidenceDeltaPacket",
            "SuggestionEnvelope",
            "DecisionEpoch",
            "shadow_model",
        ],
    )
    require_text(
        SECURITY_DOC,
        [
            "regenerated summary text may not be shown as authoritative evidence",
            "superseded judgment context",
            "`sourceType = shadow_model` must remain dark",
            "preview_unavailable",
        ],
    )


def validate_contracts() -> None:
    review_bundle = load_json(REVIEW_BUNDLE_SCHEMA)
    required_bundle_fields = set(review_bundle.get("required", []))
    for field in [
        "reviewBundleId",
        "taskId",
        "requestId",
        "publicationState",
        "summaryVisibilityState",
        "provenance",
        "deterministicSummary",
        "deltaPacketRef",
        "visibleSuggestionEnvelopeRefs",
        "hiddenSuggestionEnvelopeRefs",
    ]:
        if field not in required_bundle_fields:
            fail(f"review bundle schema missing required field {field}")

    suggestion = load_json(SUGGESTION_SCHEMA)
    required_suggestion_fields = set(suggestion.get("required", []))
    for field in [
        "suggestionEnvelopeId",
        "sourceType",
        "suggestionVersion",
        "priorityBand",
        "complexityBand",
        "candidateEndpoints",
        "recommendedQuestionSetIds",
        "visibilityState",
        "authoritativeWorkflowInfluence",
    ]:
        if field not in required_suggestion_fields:
            fail(f"suggestion schema missing required field {field}")

    delta = load_json(DELTA_SCHEMA)
    required_delta_fields = set(delta.get("required", []))
    for field in [
        "evidenceDeltaPacketId",
        "baselineSnapshotRef",
        "currentSnapshotRef",
        "deltaClass",
        "actionInvalidations",
        "supersededJudgmentContext",
        "deltaDigest",
    ]:
        if field not in required_delta_fields:
            fail(f"delta schema missing required field {field}")


def validate_analysis() -> None:
    review_rows = load_csv(REVIEW_CASES)
    expected_review_cases = {
        "VERIFIED_PARITY_AUTHORITATIVE_SUMMARY",
        "STALE_PARITY_PROVISIONAL_ONLY",
        "BLOCKED_PARITY_SUPPRESSES_REGENERATED_SUMMARY",
        "RULES_SUGGESTION_VISIBLE_SHADOW_SILENT",
        "TRANSCRIPT_ABSENT_PLACEHOLDER_STABLE",
        "LARGE_ATTACHMENT_PREVIEW_UNAVAILABLE",
    }
    if {row["caseId"] for row in review_rows} != expected_review_cases:
        fail("235_review_bundle_cases.csv drifted from the expected case set")

    delta_rows = load_csv(DELTA_CASES)
    expected_delta_cases = {
        "CHANGED_SINCE_SEEN_DERIVES_FROM_ONE_PACKET",
        "DUPLICATE_REVERSAL_REQUIRES_RECOMMIT",
        "DECISION_EPOCH_SUPERSESSION_INVALIDATES_PREVIEW",
        "APPROVAL_POSTURE_CHANGE_PROMOTES_CONSEQUENTIAL_DELTA",
        "OWNERSHIP_CHANGE_REMAINS_VISIBLE",
    }
    if {row["caseId"] for row in delta_rows} != expected_delta_cases:
        fail("235_delta_packet_and_superseded_context_cases.csv drifted from the expected case set")

    gap_log = load_json(GAP_LOG)
    gaps = gap_log.get("gaps", [])
    if len(gaps) != 1:
        fail("PARALLEL_INTERFACE_GAP_PHASE3_REVIEW_BUNDLE_STACK.json must contain one gap")
    for key in [
        "taskId",
        "missingSurface",
        "expectedOwnerTask",
        "temporaryFallback",
        "riskIfUnresolved",
        "followUpAction",
    ]:
        if not gaps[0].get(key):
            fail(f"review bundle gap entry missing {key}")


def validate_source_files() -> None:
    require_text(
        KERNEL_INDEX,
        ['export * from "./review-bundle-contracts";'],
    )
    require_text(
        KERNEL_CONTRACTS,
        [
            "export interface ReviewBundleSnapshot",
            "export interface SuggestionEnvelopeSnapshot",
            "export interface EvidenceDeltaPacketSnapshot",
            "renderDeterministicReviewSummary",
            "resolveReviewSummaryVisibility",
            "classifyReviewDeltaPacket",
        ],
    )
    require_text(
        KERNEL_TEST,
        [
            "renders the same deterministic summary for equivalent authoritative evidence",
            "suppresses authoritative regenerated copy when parity is not safe",
            "classifies duplicate and decision supersession as decisive delta",
        ],
    )
    require_text(
        SUPPORT_INDEX,
        [
            "ReviewBundleAssembler",
            "DeterministicReviewSummaryService",
            "EvidenceDeltaPacketBuilder",
            "SuggestionEnvelopeBuilder",
        ],
    )
    require_text(
        COMMAND_API,
        [
            "PHASE3_REVIEW_BUNDLE_ASSEMBLER_SERVICE_NAME",
            "workspace_task_review_bundle_current",
            "workspace_task_review_bundle_suggestions_current",
            "queryTaskReviewBundle",
            "queryTaskReviewSuggestions",
            "decision_epoch_supersession",
            "shadow_model",
        ],
    )
    require_text(
        SERVICE_DEFINITION,
        [
            "workspace_task_review_bundle_current",
            "/v1/workspace/tasks/{taskId}/review-bundle",
            "workspace_task_review_bundle_suggestions_current",
            "/internal/v1/workspace/tasks/{taskId}/review-bundle/suggestions",
        ],
    )
    require_text(
        INTEGRATION_TEST,
        [
            "phase 3 review bundle assembler seam",
            "invalidates stale bundle assumptions and forces a rebuild when duplicate truth reverses",
            "invalidates preview-coupled suggestion output when DecisionEpoch supersession appears",
            "transcript_absent_and_large_attachments_degrade_safely",
        ],
    )


def validate_script_registry() -> None:
    require_text(
        PACKAGE_JSON,
        ['"validate:235-review-bundle-stack": "python3 ./tools/analysis/validate_235_review_bundle_stack.py"'],
    )
    require_text(
        ROOT_SCRIPT_UPDATES,
        ['"validate:235-review-bundle-stack": "python3 ./tools/analysis/validate_235_review_bundle_stack.py"'],
    )


def main() -> None:
    validate_checklist()
    validate_docs()
    validate_contracts()
    validate_analysis()
    validate_source_files()
    validate_script_registry()
    print("[235-review-bundle-stack] ok")


if __name__ == "__main__":
    main()
