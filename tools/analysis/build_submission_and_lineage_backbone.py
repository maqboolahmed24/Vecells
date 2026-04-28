#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"

TASK_ID = "par_062"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"
VISUAL_MODE = "quiet_foundation_backbone"
MISSION = (
    "Canonical backend implementation package for SubmissionEnvelope, SubmissionPromotionRecord, "
    "RequestLineage, LineageCaseLink, Episode, and Request, including replay-safe promotion, "
    "lineage continuity, child-case ownership boundaries, persistence, and typed event seams."
)

MANIFEST_PATH = DATA_DIR / "submission_and_lineage_aggregate_manifest.json"
MATRIX_PATH = DATA_DIR / "submission_and_lineage_invariant_matrix.csv"
DESIGN_DOC_PATH = DOCS_DIR / "62_submission_and_lineage_aggregate_design.md"
RULES_DOC_PATH = DOCS_DIR / "62_submission_and_lineage_state_rules.md"

SOURCE_PRECEDENCE = [
    "prompt/062.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.0A IntakeConvergenceContract",
    "blueprint/phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
    "blueprint/phase-0-the-foundation-protocol.md#1.1A SubmissionPromotionRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
    "blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
    "blueprint/phase-0-the-foundation-protocol.md#1.2 Episode",
    "blueprint/phase-0-the-foundation-protocol.md#1.3 Request",
    "blueprint/vecells-complete-end-to-end-flow.md#Audited flow baseline",
    "blueprint/forensic-audit-findings.md#Finding-01",
    "blueprint/forensic-audit-findings.md#Finding-02",
    "blueprint/forensic-audit-findings.md#Finding-48",
    "blueprint/forensic-audit-findings.md#Finding-49",
    "blueprint/forensic-audit-findings.md#Finding-50",
    "blueprint/forensic-audit-findings.md#Finding-51",
    "blueprint/forensic-audit-findings.md#Finding-52",
    "blueprint/forensic-audit-findings.md#Finding-53",
    "blueprint/forensic-audit-findings.md#Finding-54",
    "data/analysis/domain_package_manifest.json",
    "data/analysis/parallel_track_eligibility.csv",
]

AGGREGATES = [
    {
        "aggregateId": "AGR_062_SUBMISSION_ENVELOPE",
        "name": "SubmissionEnvelope",
        "packageName": "@vecells/domain-kernel",
        "repoPath": "packages/domain-kernel/src/request-intake-backbone.ts",
        "rootType": "aggregate_root",
        "persistenceTable": "submission_envelopes",
        "authoritativeBoundary": "durable_pre_submit_shell",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "blueprint/forensic-audit-findings.md#Finding-01",
            "prompt/062.md",
        ],
    },
    {
        "aggregateId": "AGR_062_SUBMISSION_PROMOTION_RECORD",
        "name": "SubmissionPromotionRecord",
        "packageName": "@vecells/domain-identity-access",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
        "rootType": "immutable_document",
        "persistenceTable": "submission_promotion_records",
        "authoritativeBoundary": "explicit_submitted_barrier",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1A SubmissionPromotionRecord",
            "blueprint/forensic-audit-findings.md#Finding-02",
            "prompt/062.md",
        ],
    },
    {
        "aggregateId": "AGR_062_REQUEST_LINEAGE",
        "name": "RequestLineage",
        "packageName": "@vecells/domain-kernel",
        "repoPath": "packages/domain-kernel/src/request-intake-backbone.ts",
        "rootType": "aggregate_root",
        "persistenceTable": "request_lineages",
        "authoritativeBoundary": "continuity_anchor",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
            "blueprint/forensic-audit-findings.md#Finding-49",
            "prompt/062.md",
        ],
    },
    {
        "aggregateId": "AGR_062_LINEAGE_CASE_LINK",
        "name": "LineageCaseLink",
        "packageName": "@vecells/domain-kernel",
        "repoPath": "packages/domain-kernel/src/request-intake-backbone.ts",
        "rootType": "aggregate_root",
        "persistenceTable": "lineage_case_links",
        "authoritativeBoundary": "child_case_ownership_summary",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
            "blueprint/forensic-audit-findings.md#Finding-53",
            "prompt/062.md",
        ],
    },
    {
        "aggregateId": "AGR_062_EPISODE",
        "name": "Episode",
        "packageName": "@vecells/domain-identity-access",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
        "rootType": "aggregate_root",
        "persistenceTable": "episodes",
        "authoritativeBoundary": "identity_binding_episode_anchor",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.2 Episode",
            "blueprint/forensic-audit-findings.md#Finding-52",
            "prompt/062.md",
        ],
    },
    {
        "aggregateId": "AGR_062_REQUEST",
        "name": "Request",
        "packageName": "@vecells/domain-kernel",
        "repoPath": "packages/domain-kernel/src/request-intake-backbone.ts",
        "rootType": "aggregate_root",
        "persistenceTable": "requests",
        "authoritativeBoundary": "post_submit_workflow_truth",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.3 Request",
            "blueprint/forensic-audit-findings.md#Finding-50",
            "prompt/062.md",
        ],
    },
]

REPOSITORIES = [
    {
        "repositoryId": "REPO_062_SUBMISSION_ENVELOPE",
        "name": "SubmissionEnvelopeRepository",
        "packageName": "@vecells/domain-kernel",
        "storageAdapter": "InMemorySubmissionLineageFoundationStore",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    },
    {
        "repositoryId": "REPO_062_REQUEST",
        "name": "RequestRepository",
        "packageName": "@vecells/domain-kernel",
        "storageAdapter": "InMemorySubmissionLineageFoundationStore",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    },
    {
        "repositoryId": "REPO_062_REQUEST_LINEAGE",
        "name": "RequestLineageRepository",
        "packageName": "@vecells/domain-kernel",
        "storageAdapter": "InMemorySubmissionLineageFoundationStore",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    },
    {
        "repositoryId": "REPO_062_LINEAGE_CASE_LINK",
        "name": "LineageCaseLinkRepository",
        "packageName": "@vecells/domain-kernel",
        "storageAdapter": "InMemorySubmissionLineageFoundationStore",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    },
    {
        "repositoryId": "REPO_062_EPISODE",
        "name": "EpisodeRepository",
        "packageName": "@vecells/domain-identity-access",
        "storageAdapter": "InMemorySubmissionLineageFoundationStore",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    },
    {
        "repositoryId": "REPO_062_SUBMISSION_PROMOTION_RECORD",
        "name": "SubmissionPromotionRecordRepository",
        "packageName": "@vecells/domain-identity-access",
        "storageAdapter": "InMemorySubmissionLineageFoundationStore",
        "repoPath": "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    },
]

COMMAND_SEAMS = [
    {
        "commandId": "CMD_062_CREATE_ENVELOPE",
        "methodName": "createEnvelope",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "instantiate durable pre-submit shell",
    },
    {
        "commandId": "CMD_062_APPEND_ENVELOPE_INGRESS",
        "methodName": "appendEnvelopeIngress",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "append immutable ingress reference",
    },
    {
        "commandId": "CMD_062_ATTACH_ENVELOPE_EVIDENCE",
        "methodName": "attachEnvelopeEvidence",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "attach frozen evidence snapshot without minting a request",
    },
    {
        "commandId": "CMD_062_ATTACH_ENVELOPE_NORMALIZATION",
        "methodName": "attachEnvelopeNormalization",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "attach canonical normalized submission and candidate refs",
    },
    {
        "commandId": "CMD_062_MARK_ENVELOPE_READY",
        "methodName": "markEnvelopeReady",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "settle promotion readiness after ingress, evidence, and normalization exist",
    },
    {
        "commandId": "CMD_062_PROMOTE_ENVELOPE",
        "methodName": "promoteEnvelope",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "create exactly one Request plus SubmissionPromotionRecord and initial RequestLineage",
    },
    {
        "commandId": "CMD_062_CONTINUE_LINEAGE",
        "methodName": "continueRequestLineage",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "reuse the same lineage for same-request continuity",
    },
    {
        "commandId": "CMD_062_BRANCH_LINEAGE",
        "methodName": "branchRequestLineage",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "create same-episode or related-episode lineage branches with explicit decisions",
    },
    {
        "commandId": "CMD_062_PROPOSE_CASE_LINK",
        "methodName": "proposeLineageCaseLink",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "attach child-domain work as link-only ownership state",
    },
    {
        "commandId": "CMD_062_TRANSITION_CASE_LINK",
        "methodName": "transitionLineageCaseLink",
        "home": "@vecells/domain-identity-access::SubmissionLineageCommandService",
        "effect": "advance child-link ownership while only refreshing request and lineage summaries",
    },
]

EVENT_SEAMS = [
    {
        "eventName": "intake.draft.created",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "intake.ingress.recorded",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "request.snapshot.created",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "intake.normalized",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "intake.promotion.settled",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "request.created",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "request.submitted",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "intake.resume.continuity.updated",
        "eventClass": "canonical",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "request.lineage.branched",
        "eventClass": "parallel_interface_gap",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
    {
        "eventName": "request.lineage.case_link.changed",
        "eventClass": "parallel_interface_gap",
        "source": "packages/event-contracts/src/submission-lineage-events.ts",
    },
]

PARALLEL_INTERFACE_GAPS = [
    {
        "gapId": "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_BRANCHED_EVENT",
        "eventName": "request.lineage.branched",
        "status": "stubbed_shared_contract",
        "sourceRefs": [
            "prompt/062.md",
            "prompt/shared_operating_contract_056_to_065.md",
            "packages/event-contracts/src/submission-lineage-events.ts",
        ],
    },
    {
        "gapId": "PARALLEL_INTERFACE_GAP_062_REQUEST_LINEAGE_CASE_LINK_CHANGED_EVENT",
        "eventName": "request.lineage.case_link.changed",
        "status": "stubbed_shared_contract",
        "sourceRefs": [
            "prompt/062.md",
            "prompt/shared_operating_contract_056_to_065.md",
            "packages/event-contracts/src/submission-lineage-events.ts",
        ],
    },
]

PERSISTENCE_TABLES = [
    {
        "tableName": "submission_envelopes",
        "aggregateName": "SubmissionEnvelope",
    },
    {
        "tableName": "submission_promotion_records",
        "aggregateName": "SubmissionPromotionRecord",
    },
    {
        "tableName": "episodes",
        "aggregateName": "Episode",
    },
    {
        "tableName": "requests",
        "aggregateName": "Request",
    },
    {
        "tableName": "request_lineages",
        "aggregateName": "RequestLineage",
    },
    {
        "tableName": "lineage_case_links",
        "aggregateName": "LineageCaseLink",
    },
]

IMPLEMENTATION_FILES = [
    "packages/domain-kernel/src/request-intake-backbone.ts",
    "packages/domain-kernel/tests/request-intake-backbone.test.ts",
    "packages/domains/identity_access/src/submission-lineage-backbone.ts",
    "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
    "packages/event-contracts/src/submission-lineage-events.ts",
    "packages/event-contracts/tests/submission-lineage-events.test.ts",
    "services/command-api/src/submission-backbone.ts",
    "services/command-api/tests/submission-backbone.integration.test.js",
    "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
    "tools/analysis/build_submission_and_lineage_backbone.py",
    "tools/analysis/validate_submission_and_lineage_backbone.py",
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_062_EPISODE_TRACKS_CURRENT_IDENTITY_ONLY",
        "statement": "Episode keeps the current identity binding and patientRef only; full identity supersession history remains outside par_062 and is represented by nullable refs plus version increments.",
    },
    {
        "assumptionId": "ASSUMPTION_062_SUMMARIES_MIRROR_ACTIVE_CHILD_LINKS",
        "statement": "Request and RequestLineage summary fields expose the latest and active LineageCaseLink refs, but the child workflow remains authoritative only within the child domain.",
    },
]

INVARIANTS = [
    {
        "invariantId": "INV_062_ENVELOPE_DRAFT_BOUNDARY",
        "aggregateScope": "SubmissionEnvelope",
        "ruleClass": "promotion_boundary",
        "invariantStatement": "Draft capture, partial ingress, evidence snapshots, and normalized submission refs remain on SubmissionEnvelope until governed promotion settles.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::SubmissionEnvelopeAggregate",
        "verifiedBy": "packages/domain-kernel/tests/request-intake-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1 SubmissionEnvelope",
            "blueprint/forensic-audit-findings.md#Finding-01",
        ],
    },
    {
        "invariantId": "INV_062_REQUEST_NOT_DRAFT_STORE",
        "aggregateScope": "Request",
        "ruleClass": "workflow_truth",
        "invariantStatement": "Request never enters a draft state and begins at submitted with orthogonal workflow, safety, and identity axes.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::RequestAggregate.normalize",
        "verifiedBy": "packages/domain-kernel/tests/request-intake-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.3 Request",
            "blueprint/forensic-audit-findings.md#Finding-02",
        ],
    },
    {
        "invariantId": "INV_062_PROMOTION_EXACTLY_ONCE",
        "aggregateScope": "SubmissionEnvelope -> Request + SubmissionPromotionRecord",
        "ruleClass": "idempotent_promotion",
        "invariantStatement": "Promotion from one envelope resolves to exactly one SubmissionPromotionRecord and exactly one Request, and replays return the same records.",
        "enforcedBy": "packages/domains/identity_access/src/submission-lineage-backbone.ts::SubmissionLineageCommandService.promoteEnvelope",
        "verifiedBy": "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts; services/command-api/tests/submission-backbone.integration.test.js",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1A SubmissionPromotionRecord",
            "prompt/062.md",
        ],
    },
    {
        "invariantId": "INV_062_PRIMARY_LINEAGE_REQUIRES_PROMOTION_WITNESS",
        "aggregateScope": "RequestLineage",
        "ruleClass": "continuity_anchor",
        "invariantStatement": "Primary RequestLineage roots require envelope-promotion witness and cannot carry branch decisions.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.normalize",
        "verifiedBy": "packages/domain-kernel/tests/request-intake-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
            "blueprint/forensic-audit-findings.md#Finding-49",
        ],
    },
    {
        "invariantId": "INV_062_CONTINUATION_REUSES_EXISTING_LINEAGE",
        "aggregateScope": "RequestLineage",
        "ruleClass": "continuation_law",
        "invariantStatement": "Same-request continuation reuses the current lineage and records continuity witness updates instead of creating a new branch.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.recordContinuation",
        "verifiedBy": "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
            "prompt/062.md",
        ],
    },
    {
        "invariantId": "INV_062_BRANCH_REQUIRES_DECISION",
        "aggregateScope": "RequestLineage",
        "ruleClass": "branch_law",
        "invariantStatement": "Same-episode and related-episode branches require explicit branchDecisionRef, and related-episode branches must target a distinct episode.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.branch; packages/domains/identity_access/src/submission-lineage-backbone.ts::SubmissionLineageCommandService.branchRequestLineage",
        "verifiedBy": "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
            "blueprint/forensic-audit-findings.md#Finding-51",
        ],
    },
    {
        "invariantId": "INV_062_REQUEST_PATIENT_REF_NULLABLE_UNTIL_BINDING",
        "aggregateScope": "Request",
        "ruleClass": "identity_binding",
        "invariantStatement": "Request.patientRef may remain null and can derive only from currentIdentityBindingRef with matched or claimed identity state.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::RequestAggregate.normalize",
        "verifiedBy": "packages/domain-kernel/tests/request-intake-backbone.test.ts; packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.3 Request",
            "blueprint/forensic-audit-findings.md#Finding-54",
        ],
    },
    {
        "invariantId": "INV_062_EPISODE_PATIENT_REF_NULLABLE_UNTIL_BINDING",
        "aggregateScope": "Episode",
        "ruleClass": "identity_binding",
        "invariantStatement": "Episode.patientRef remains nullable until currentIdentityBindingRef exists and is explicitly bound.",
        "enforcedBy": "packages/domains/identity_access/src/submission-lineage-backbone.ts::EpisodeAggregate.normalize",
        "verifiedBy": "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.2 Episode",
            "blueprint/forensic-audit-findings.md#Finding-54",
        ],
    },
    {
        "invariantId": "INV_062_CHILD_LINK_CANNOT_WRITE_REQUEST_WORKFLOW",
        "aggregateScope": "LineageCaseLink -> Request",
        "ruleClass": "ownership_boundary",
        "invariantStatement": "LineageCaseLink transitions may refresh request and lineage summaries, blockers, and confirmation refs but may not mutate canonical Request.workflowState directly.",
        "enforcedBy": "packages/domains/identity_access/src/submission-lineage-backbone.ts::SubmissionLineageCommandService.transitionLineageCaseLink",
        "verifiedBy": "packages/domain-kernel/tests/request-intake-backbone.test.ts; packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
            "blueprint/forensic-audit-findings.md#Finding-53",
        ],
    },
    {
        "invariantId": "INV_062_LINEAGE_SUMMARY_TRACKS_ACTIVE_LINKS_ONLY",
        "aggregateScope": "Request + RequestLineage",
        "ruleClass": "summary_projection",
        "invariantStatement": "Latest LineageCaseLink refs must either stay active or match the previously observed link while active-link summaries are monotonically refreshed.",
        "enforcedBy": "packages/domain-kernel/src/request-intake-backbone.ts::RequestAggregate.refreshLineageSummary; packages/domain-kernel/src/request-intake-backbone.ts::RequestLineageAggregate.updateSummary",
        "verifiedBy": "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
        "sourceRefs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.1B RequestLineage",
            "blueprint/phase-0-the-foundation-protocol.md#1.1C LineageCaseLink",
        ],
    },
]

STATE_GROUPS = [
    {
        "subject": "SubmissionEnvelope.state",
        "values": ["draft", "evidence_pending", "ready_to_promote", "promoted", "abandoned", "expired"],
        "notes": "Only SubmissionEnvelope carries pre-submit capture and promotion readiness.",
    },
    {
        "subject": "Request.workflowState",
        "values": ["submitted", "intake_normalized", "triage_ready", "triage_active", "handoff_active", "outcome_recorded", "closed"],
        "notes": "Workflow remains orthogonal to safetyState and identityState.",
    },
    {
        "subject": "Request.safetyState",
        "values": ["not_screened", "screen_clear", "residual_risk_flagged", "urgent_diversion_required", "urgent_diverted"],
        "notes": "Safety posture cannot be flattened into workflow milestones.",
    },
    {
        "subject": "Request.identityState",
        "values": ["anonymous", "partial_match", "matched", "claimed"],
        "notes": "patientRef is permitted only once matched or claimed binding settles.",
    },
    {
        "subject": "RequestLineage.branchClass",
        "values": ["primary_submission", "same_request_continuation", "same_episode_branch", "related_episode_branch"],
        "notes": "Branch decisions are explicit and only required for non-continuation branching.",
    },
    {
        "subject": "RequestLineage.lineageState",
        "values": ["active", "closure_pending", "closed", "superseded"],
        "notes": "Lineage tracks continuity status, not request workflow truth.",
    },
    {
        "subject": "LineageCaseLink.ownershipState",
        "values": ["proposed", "acknowledged", "active", "returned", "closed", "superseded", "compensated"],
        "notes": "Child links expose ownership and blocker facts without taking over request workflow.",
    },
    {
        "subject": "Episode.state",
        "values": ["open", "resolved", "archived"],
        "notes": "Episode anchors request membership and identity-bound patient linkage.",
    },
]


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def build_manifest() -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "aggregate_count": len(AGGREGATES),
            "repository_interface_count": len(REPOSITORIES),
            "command_seam_count": len(COMMAND_SEAMS),
            "event_seam_count": len(EVENT_SEAMS),
            "persistence_table_count": len(PERSISTENCE_TABLES),
            "parallel_interface_gap_count": len(PARALLEL_INTERFACE_GAPS),
            "implementation_file_count": len(IMPLEMENTATION_FILES),
            "invariant_count": len(INVARIANTS),
        },
        "assumptions": ASSUMPTIONS,
        "aggregates": AGGREGATES,
        "repositories": REPOSITORIES,
        "command_seams": COMMAND_SEAMS,
        "event_seams": EVENT_SEAMS,
        "persistence_tables": PERSISTENCE_TABLES,
        "parallel_interface_gaps": PARALLEL_INTERFACE_GAPS,
        "implementation_files": IMPLEMENTATION_FILES,
        "test_files": [
            "packages/domain-kernel/tests/request-intake-backbone.test.ts",
            "packages/domains/identity_access/tests/submission-lineage-backbone.test.ts",
            "packages/event-contracts/tests/submission-lineage-events.test.ts",
            "services/command-api/tests/submission-backbone.integration.test.js",
        ],
        "validator_ref": "tools/analysis/validate_submission_and_lineage_backbone.py",
        "migration_ref": "services/command-api/migrations/062_submission_and_lineage_backbone.sql",
    }


def build_invariant_rows() -> list[dict[str, str]]:
    return [
        {
            "invariant_id": item["invariantId"],
            "aggregate_scope": item["aggregateScope"],
            "rule_class": item["ruleClass"],
            "invariant_statement": item["invariantStatement"],
            "enforced_by": item["enforcedBy"],
            "verified_by": item["verifiedBy"],
            "source_refs": "; ".join(item["sourceRefs"]),
        }
        for item in INVARIANTS
    ]


def build_design_doc() -> str:
    aggregate_rows = [
        "| Aggregate | Package | Persistence Table | Boundary | Implementation |",
        "| --- | --- | --- | --- | --- |",
    ]
    for item in AGGREGATES:
        aggregate_rows.append(
            "| "
            + " | ".join(
                [
                    item["name"],
                    item["packageName"],
                    item["persistenceTable"],
                    item["authoritativeBoundary"].replace("_", " "),
                    f"`{item['repoPath']}`",
                ]
            )
            + " |"
        )

    command_rows = [
        "| Command Seam | Home | Effect |",
        "| --- | --- | --- |",
    ]
    for item in COMMAND_SEAMS:
        command_rows.append(
            f"| `{item['methodName']}` | `{item['home']}` | {item['effect']} |"
        )

    return "\n".join(
        [
            "# 62 Submission And Lineage Aggregate Design",
            "",
            f"- Task: `{TASK_ID}`",
            f"- Captured on: `{CAPTURED_ON}`",
            f"- Generated at: `{GENERATED_AT}`",
            f"- Visual mode: `{VISUAL_MODE}`",
            "",
            MISSION,
            "",
            "## Gap Closures",
            "",
            "- The durable pre-submit shell is now a real `SubmissionEnvelopeAggregate` with immutable ingress, evidence, and normalized-submission refs.",
            "- The submitted barrier is explicit: `SubmissionPromotionRecordDocument` is created once per successful promotion and replayed on duplicate promote calls.",
            "- `RequestLineageAggregate` and `LineageCaseLinkAggregate` are persisted first-class objects rather than narrative joins.",
            "- `Request.patientRef` and `Episode.patientRef` remain nullable until explicit identity binding exists.",
            "- Child-domain work is attached through `LineageCaseLink` summaries only; canonical request workflow remains owned by `Request`.",
            "",
            "## Aggregate Homes",
            "",
            *aggregate_rows,
            "",
            "## Persistence And Replay Model",
            "",
            "- Repository interfaces live in the domain packages and are implemented by `InMemorySubmissionLineageFoundationStore` for deterministic replay-safe tests.",
            "- `saveWithCas(...)` enforces optimistic concurrency on every aggregate write and rejects non-monotone version drift.",
            "- `services/command-api/migrations/062_submission_and_lineage_backbone.sql` freezes the six-table persistence shape for later runtime adapters.",
            "- `createSubmissionBackboneApplication(...)` publishes the minimal command-api seam for later routes, idempotency services, and identity/evidence tracks.",
            "",
            "## Command Seams",
            "",
            *command_rows,
            "",
            "## Event Seams",
            "",
            "- Canonical event helpers live in `packages/event-contracts/src/submission-lineage-events.ts`.",
            "- `request.lineage.branched` and `request.lineage.case_link.changed` remain bounded `PARALLEL_INTERFACE_GAP_*` stubs until sibling parallel tracks publish the permanent registry rows.",
            "",
            "## Assumptions",
            "",
            *[f"- `{item['assumptionId']}`: {item['statement']}" for item in ASSUMPTIONS],
            "",
            "## Source Refs",
            "",
            *[f"- `{item}`" for item in SOURCE_PRECEDENCE],
        ]
    )


def build_rules_doc() -> str:
    state_rows = [
        "| Subject | Values | Rule Note |",
        "| --- | --- | --- |",
    ]
    for item in STATE_GROUPS:
        state_rows.append(
            "| "
            + " | ".join(
                [
                    f"`{item['subject']}`",
                    ", ".join(f"`{value}`" for value in item["values"]),
                    item["notes"],
                ]
            )
            + " |"
        )

    invariant_rows = [
        "| Invariant Id | Scope | Rule | Enforcement |",
        "| --- | --- | --- | --- |",
    ]
    for item in INVARIANTS:
        invariant_rows.append(
            "| "
            + " | ".join(
                [
                    f"`{item['invariantId']}`",
                    item["aggregateScope"],
                    item["invariantStatement"],
                    f"`{item['enforcedBy']}`",
                ]
            )
            + " |"
        )

    return "\n".join(
        [
            "# 62 Submission And Lineage State Rules",
            "",
            f"- Task: `{TASK_ID}`",
            f"- Captured on: `{CAPTURED_ON}`",
            f"- Generated at: `{GENERATED_AT}`",
            "",
            "## State Axes",
            "",
            *state_rows,
            "",
            "## Promotion Law",
            "",
            "- `SubmissionEnvelope` may only cross into `promoted` from `ready_to_promote`.",
            "- Promotion replay is legal only when the existing promoted request and promotion record refs match exactly.",
            "- `Request` begins at `submitted`; it never acts as a draft or partial-capture container.",
            "",
            "## Lineage And Branching Law",
            "",
            "- Primary lineages must carry `continuityWitnessClass=envelope_promotion` and no `branchDecisionRef`.",
            "- Same-request continuation reuses the current lineage and records continuity witness updates.",
            "- Same-episode and related-episode branches require explicit `branchDecisionRef`; related-episode branching must target a distinct episode.",
            "",
            "## Child-Case Ownership Law",
            "",
            "- `LineageCaseLink` can carry milestones, blockers, confirmation gates, returns, supersessions, and compensations.",
            "- `LineageCaseLink` may only refresh request and lineage summaries; it cannot write canonical request workflow or closure truth directly.",
            "",
            "## Identity Law",
            "",
            "- `Request.patientRef` and `Episode.patientRef` may remain null indefinitely until explicit identity binding settles.",
            "- When `patientRef` exists, the governing binding ref must also exist and the request identity state must be `matched` or `claimed`.",
            "",
            "## Invariant Matrix",
            "",
            *invariant_rows,
            "",
            "## Parallel Interface Gaps",
            "",
            *[
                f"- `{item['gapId']}` keeps `{item['eventName']}` available to par_062 without depending on unpublished sibling-track internals."
                for item in PARALLEL_INTERFACE_GAPS
            ],
        ]
    )


def main() -> None:
    write_json(MANIFEST_PATH, build_manifest())
    write_csv(
        MATRIX_PATH,
        build_invariant_rows(),
        [
            "invariant_id",
            "aggregate_scope",
            "rule_class",
            "invariant_statement",
            "enforced_by",
            "verified_by",
            "source_refs",
        ],
    )
    write_text(DESIGN_DOC_PATH, build_design_doc())
    write_text(RULES_DOC_PATH, build_rules_doc())
    print(f"{TASK_ID} submission and lineage backbone artifacts generated")


if __name__ == "__main__":
    main()
