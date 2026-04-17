#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from hashlib import sha256
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

TASK_ID = "par_070"
VISUAL_MODE = "Duplicate_Resolution_Workbench"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

MANIFEST_PATH = DATA_DIR / "duplicate_cluster_manifest.json"
MATRIX_PATH = DATA_DIR / "duplicate_pair_evidence_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "duplicate_resolution_casebook.json"

DESIGN_DOC_PATH = DOCS_DIR / "70_duplicate_cluster_and_pair_evidence_design.md"
RULES_DOC_PATH = DOCS_DIR / "70_duplicate_resolution_rules.md"
WORKBENCH_PATH = DOCS_DIR / "70_duplicate_resolution_workbench.html"
SPEC_PATH = TESTS_DIR / "duplicate-resolution-workbench.spec.js"

SOURCE_PRECEDENCE = [
    "prompt/070.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.7 DuplicateCluster",
    "blueprint/phase-0-the-foundation-protocol.md#1.7A DuplicatePairEvidence",
    "blueprint/phase-0-the-foundation-protocol.md#1.7B DuplicateResolutionDecision",
    "blueprint/phase-1-the-red-flag-gate.md",
    "blueprint/vecells-complete-end-to-end-flow.md#I_DUP",
    "blueprint/forensic-audit-findings.md#Finding 05 - No conservative duplicate and same-episode control",
    "blueprint/forensic-audit-findings.md#Finding 19 - Reopen and bounce-back flows lost same-request continuity",
    "blueprint/forensic-audit-findings.md#Finding 35 - Pharmacy eligibility was binary and unversioned",
    "blueprint/forensic-audit-findings.md#Finding 57 - `RequestClosureRecord` omitted duplicate-cluster blockers",
    "blueprint/forensic-audit-findings.md#Finding 65 - The event catalogue lacked duplicate-review lifecycle events",
    "packages/domains/identity_access/src/duplicate-review-backbone.ts",
    "services/command-api/src/duplicate-review.ts",
]

THRESHOLD_POLICY = {
    "thresholdPolicyRef": "duplicate_threshold_policy::2026-04-12",
    "retryAutoMin": 0.93,
    "sameRequestAttachAutoMin": 0.58,
    "sameEpisodeCandidateMin": 0.40,
    "sameEpisodeLinkAutoMin": 0.60,
    "relatedEpisodeAutoMin": 0.65,
    "separateRequestMin": 0.65,
    "maxAutoUncertainty": 0.16,
    "minClassMargin": 0.12,
    "minCandidateMargin": 0.10,
    "canonicalConflictDelta": 0.05,
}

PARALLEL_INTERFACE_GAPS = [
    {
        "gapId": "PARALLEL_INTERFACE_GAP_070_DUPLICATE_LINEAGE_SETTLEMENT_PORT",
        "stubInterface": "DuplicateLineageSettlementPort",
        "lifecycleState": "stubbed_parallel_interface_gap",
        "rationale": "The duplicate backbone now owns evidence, clustering, and decision truth, but the later lineage/triage orchestrator that materializes downstream attach or branch side effects is still a sibling track. This gap keeps settlement handoff explicit instead of leaking ad hoc merge heuristics.",
        "sourceRefs": [
            "prompt/070.md",
            "prompt/shared_operating_contract_066_to_075.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.7B DuplicateResolutionDecision",
        ],
    }
]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    ensure_parent(path)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: object) -> None:
    ensure_parent(path)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    ensure_parent(path)
    fieldnames = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def feature_hash(seed: str) -> str:
    return sha256(seed.encode("utf-8")).hexdigest()


PAIR_EVIDENCES = [
    {
        "pairEvidenceId": "DPE_070_RETRY",
        "scenarioId": "exact_retry_collapse",
        "incomingLineageRef": "lineage_070_retry",
        "incomingSnapshotRef": "snapshot_070_retry",
        "candidateRequestRef": "request_070_retry_target",
        "candidateEpisodeRef": "episode_070_retry",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_web_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_RETRY"),
        "piRetry": 0.96,
        "piSameRequestAttach": 0.02,
        "piSameEpisode": 0.01,
        "piRelatedEpisode": 0.00,
        "piNewEpisode": 0.01,
        "classMargin": 0.88,
        "candidateMargin": 0.74,
        "uncertaintyScore": 0.01,
        "uncertaintyBand": "low",
        "hardBlockerRefs": [],
        "replaySignalRefs": ["replay_signal_070_retry"],
        "continuitySignalRefs": [],
        "conflictSignalRefs": [],
        "dominantRelation": "retry",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:00:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_ATTACH",
        "scenarioId": "same_request_continuation_with_witness",
        "incomingLineageRef": "lineage_070_attach",
        "incomingSnapshotRef": "snapshot_070_attach",
        "candidateRequestRef": "request_070_attach_target",
        "candidateEpisodeRef": "episode_070_attach",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_browser_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_ATTACH"),
        "piRetry": 0.04,
        "piSameRequestAttach": 0.63,
        "piSameEpisode": 0.20,
        "piRelatedEpisode": 0.05,
        "piNewEpisode": 0.08,
        "classMargin": 0.22,
        "candidateMargin": 0.31,
        "uncertaintyScore": 0.09,
        "uncertaintyBand": "low",
        "hardBlockerRefs": [],
        "replaySignalRefs": [],
        "continuitySignalRefs": ["workflow_return_signal_070"],
        "conflictSignalRefs": [],
        "dominantRelation": "same_request_attach",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:05:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_SAME_EPISODE_A",
        "scenarioId": "same_episode_candidate_high_similarity",
        "incomingLineageRef": "lineage_070_same_episode",
        "incomingSnapshotRef": "snapshot_070_same_episode",
        "candidateRequestRef": "request_070_same_episode_a",
        "candidateEpisodeRef": "episode_070_same_episode",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_browser_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_SAME_EPISODE_A"),
        "piRetry": 0.02,
        "piSameRequestAttach": 0.15,
        "piSameEpisode": 0.44,
        "piRelatedEpisode": 0.14,
        "piNewEpisode": 0.25,
        "classMargin": 0.07,
        "candidateMargin": 0.03,
        "uncertaintyScore": 0.22,
        "uncertaintyBand": "high",
        "hardBlockerRefs": [],
        "replaySignalRefs": [],
        "continuitySignalRefs": ["continuity_hint_070_a"],
        "conflictSignalRefs": [],
        "dominantRelation": "same_episode_candidate",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:10:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_SAME_EPISODE_B",
        "scenarioId": "same_episode_candidate_high_similarity",
        "incomingLineageRef": "lineage_070_same_episode",
        "incomingSnapshotRef": "snapshot_070_same_episode",
        "candidateRequestRef": "request_070_same_episode_b",
        "candidateEpisodeRef": "episode_070_same_episode",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_browser_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_SAME_EPISODE_B"),
        "piRetry": 0.02,
        "piSameRequestAttach": 0.13,
        "piSameEpisode": 0.42,
        "piRelatedEpisode": 0.16,
        "piNewEpisode": 0.27,
        "classMargin": 0.05,
        "candidateMargin": 0.02,
        "uncertaintyScore": 0.24,
        "uncertaintyBand": "high",
        "hardBlockerRefs": [],
        "replaySignalRefs": [],
        "continuitySignalRefs": ["continuity_hint_070_b"],
        "conflictSignalRefs": [],
        "dominantRelation": "same_episode_candidate",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:10:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_RELATED",
        "scenarioId": "related_episode_link",
        "incomingLineageRef": "lineage_070_related",
        "incomingSnapshotRef": "snapshot_070_related",
        "candidateRequestRef": "request_070_related_target",
        "candidateEpisodeRef": "episode_070_related_target",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_phone_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_RELATED"),
        "piRetry": 0.03,
        "piSameRequestAttach": 0.05,
        "piSameEpisode": 0.10,
        "piRelatedEpisode": 0.71,
        "piNewEpisode": 0.11,
        "classMargin": 0.19,
        "candidateMargin": 0.28,
        "uncertaintyScore": 0.08,
        "uncertaintyBand": "low",
        "hardBlockerRefs": [],
        "replaySignalRefs": [],
        "continuitySignalRefs": [],
        "conflictSignalRefs": ["separate_safety_epoch_070"],
        "dominantRelation": "related_episode",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:15:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_SEPARATE",
        "scenarioId": "clear_separate_request",
        "incomingLineageRef": "lineage_070_separate",
        "incomingSnapshotRef": "snapshot_070_separate",
        "candidateRequestRef": "request_070_separate_candidate",
        "candidateEpisodeRef": "episode_070_separate_candidate",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_portal_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_SEPARATE"),
        "piRetry": 0.02,
        "piSameRequestAttach": 0.07,
        "piSameEpisode": 0.09,
        "piRelatedEpisode": 0.08,
        "piNewEpisode": 0.74,
        "classMargin": 0.33,
        "candidateMargin": 0.30,
        "uncertaintyScore": 0.06,
        "uncertaintyBand": "low",
        "hardBlockerRefs": [],
        "replaySignalRefs": [],
        "continuitySignalRefs": [],
        "conflictSignalRefs": [],
        "dominantRelation": "new_episode",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:20:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_CONFLICT_A",
        "scenarioId": "conflicting_candidates_low_margin",
        "incomingLineageRef": "lineage_070_conflict",
        "incomingSnapshotRef": "snapshot_070_conflict",
        "candidateRequestRef": "request_070_conflict_a",
        "candidateEpisodeRef": "episode_070_conflict",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_voice_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_CONFLICT_A"),
        "piRetry": 0.03,
        "piSameRequestAttach": 0.06,
        "piSameEpisode": 0.32,
        "piRelatedEpisode": 0.29,
        "piNewEpisode": 0.30,
        "classMargin": 0.03,
        "candidateMargin": 0.01,
        "uncertaintyScore": 0.34,
        "uncertaintyBand": "high",
        "hardBlockerRefs": ["parallel_competitor"],
        "replaySignalRefs": [],
        "continuitySignalRefs": [],
        "conflictSignalRefs": ["different_actor_mode_070"],
        "dominantRelation": "review_required",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:25:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
    {
        "pairEvidenceId": "DPE_070_CONFLICT_B",
        "scenarioId": "conflicting_candidates_low_margin",
        "incomingLineageRef": "lineage_070_conflict",
        "incomingSnapshotRef": "snapshot_070_conflict",
        "candidateRequestRef": "request_070_conflict_b",
        "candidateEpisodeRef": "episode_070_conflict",
        "relationModelVersionRef": "duplicate_model_070_v1",
        "channelCalibrationRef": "duplicate_calibration_voice_v1",
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "featureVectorHash": feature_hash("DPE_070_CONFLICT_B"),
        "piRetry": 0.03,
        "piSameRequestAttach": 0.05,
        "piSameEpisode": 0.31,
        "piRelatedEpisode": 0.30,
        "piNewEpisode": 0.31,
        "classMargin": 0.02,
        "candidateMargin": 0.01,
        "uncertaintyScore": 0.36,
        "uncertaintyBand": "high",
        "hardBlockerRefs": ["parallel_competitor"],
        "replaySignalRefs": [],
        "continuitySignalRefs": [],
        "conflictSignalRefs": ["different_actor_mode_070"],
        "dominantRelation": "review_required",
        "evidenceState": "active",
        "createdAt": "2026-04-12T16:25:00Z",
        "sourceRefs": SOURCE_PRECEDENCE[:6],
    },
]

DECISIONS = [
    {
        "duplicateResolutionDecisionId": "DDR_070_RETRY",
        "duplicateClusterRef": "DCL_070_RETRY",
        "incomingLineageRef": "lineage_070_retry",
        "incomingSnapshotRef": "snapshot_070_retry",
        "targetRequestRef": "request_070_retry_target",
        "targetEpisodeRef": "episode_070_retry",
        "winningPairEvidenceRef": "DPE_070_RETRY",
        "competingPairEvidenceRefs": [],
        "decisionClass": "exact_retry_collapse",
        "continuityWitnessClass": "deterministic_replay",
        "continuityWitnessRef": "replay_signal_070_retry",
        "reviewMode": "replay_authority",
        "reasonCodes": ["REPLAY_SIGNAL_PRESENT", "RETRY_THRESHOLD_MET"],
        "decisionState": "applied",
        "supersedesDecisionRef": None,
        "downstreamInvalidationRefs": [],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:00:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
    {
        "duplicateResolutionDecisionId": "DDR_070_ATTACH_REVIEW",
        "duplicateClusterRef": "DCL_070_ATTACH",
        "incomingLineageRef": "lineage_070_attach",
        "incomingSnapshotRef": "snapshot_070_attach",
        "targetRequestRef": "request_070_attach_target",
        "targetEpisodeRef": "episode_070_attach",
        "winningPairEvidenceRef": "DPE_070_ATTACH",
        "competingPairEvidenceRefs": [],
        "decisionClass": "review_required",
        "continuityWitnessClass": "human_review",
        "continuityWitnessRef": None,
        "reviewMode": "human_review",
        "reasonCodes": ["CONTINUITY_WITNESS_REQUIRED", "ATTACH_THRESHOLD_MET"],
        "decisionState": "superseded",
        "supersedesDecisionRef": None,
        "downstreamInvalidationRefs": [],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:04:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
    {
        "duplicateResolutionDecisionId": "DDR_070_ATTACH_APPLIED",
        "duplicateClusterRef": "DCL_070_ATTACH",
        "incomingLineageRef": "lineage_070_attach",
        "incomingSnapshotRef": "snapshot_070_attach",
        "targetRequestRef": "request_070_attach_target",
        "targetEpisodeRef": "episode_070_attach",
        "winningPairEvidenceRef": "DPE_070_ATTACH",
        "competingPairEvidenceRefs": [],
        "decisionClass": "same_request_attach",
        "continuityWitnessClass": "workflow_return",
        "continuityWitnessRef": "witness_070_workflow_return",
        "reviewMode": "auto",
        "reasonCodes": ["CONTINUITY_WITNESS_PRESENT", "ATTACH_THRESHOLD_MET"],
        "decisionState": "applied",
        "supersedesDecisionRef": "DDR_070_ATTACH_REVIEW",
        "downstreamInvalidationRefs": ["invalidate_projection_request_shell_v3"],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:05:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
    {
        "duplicateResolutionDecisionId": "DDR_070_SAME_EPISODE_REVIEW",
        "duplicateClusterRef": "DCL_070_SAME_EPISODE",
        "incomingLineageRef": "lineage_070_same_episode",
        "incomingSnapshotRef": "snapshot_070_same_episode",
        "targetRequestRef": "request_070_same_episode_a",
        "targetEpisodeRef": "episode_070_same_episode",
        "winningPairEvidenceRef": "DPE_070_SAME_EPISODE_A",
        "competingPairEvidenceRefs": ["DPE_070_SAME_EPISODE_B"],
        "decisionClass": "review_required",
        "continuityWitnessClass": "human_review",
        "continuityWitnessRef": None,
        "reviewMode": "human_review",
        "reasonCodes": ["CANDIDATE_MARGIN_TOO_LOW", "CLASS_MARGIN_TOO_LOW", "UNCERTAINTY_TOO_HIGH"],
        "decisionState": "applied",
        "supersedesDecisionRef": None,
        "downstreamInvalidationRefs": [],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:10:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
    {
        "duplicateResolutionDecisionId": "DDR_070_RELATED",
        "duplicateClusterRef": "DCL_070_RELATED",
        "incomingLineageRef": "lineage_070_related",
        "incomingSnapshotRef": "snapshot_070_related",
        "targetRequestRef": "request_070_related_target",
        "targetEpisodeRef": "episode_070_related_target",
        "winningPairEvidenceRef": "DPE_070_RELATED",
        "competingPairEvidenceRefs": [],
        "decisionClass": "related_episode_link",
        "continuityWitnessClass": "human_review",
        "continuityWitnessRef": None,
        "reviewMode": "auto",
        "reasonCodes": ["RELATED_EPISODE_THRESHOLD_MET"],
        "decisionState": "applied",
        "supersedesDecisionRef": None,
        "downstreamInvalidationRefs": [],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:15:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
    {
        "duplicateResolutionDecisionId": "DDR_070_SEPARATE",
        "duplicateClusterRef": "DCL_070_SEPARATE",
        "incomingLineageRef": "lineage_070_separate",
        "incomingSnapshotRef": "snapshot_070_separate",
        "targetRequestRef": "request_070_separate_candidate",
        "targetEpisodeRef": "episode_070_separate_candidate",
        "winningPairEvidenceRef": "DPE_070_SEPARATE",
        "competingPairEvidenceRefs": [],
        "decisionClass": "separate_request",
        "continuityWitnessClass": "none",
        "continuityWitnessRef": None,
        "reviewMode": "auto",
        "reasonCodes": ["SEPARATE_REQUEST_THRESHOLD_MET"],
        "decisionState": "applied",
        "supersedesDecisionRef": None,
        "downstreamInvalidationRefs": [],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:20:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
    {
        "duplicateResolutionDecisionId": "DDR_070_CONFLICT_REVIEW",
        "duplicateClusterRef": "DCL_070_CONFLICT",
        "incomingLineageRef": "lineage_070_conflict",
        "incomingSnapshotRef": "snapshot_070_conflict",
        "targetRequestRef": "request_070_conflict_a",
        "targetEpisodeRef": "episode_070_conflict",
        "winningPairEvidenceRef": "DPE_070_CONFLICT_A",
        "competingPairEvidenceRefs": ["DPE_070_CONFLICT_B"],
        "decisionClass": "review_required",
        "continuityWitnessClass": "human_review",
        "continuityWitnessRef": None,
        "reviewMode": "human_review",
        "reasonCodes": ["HARD_BLOCKER_PRESENT", "CANDIDATE_MARGIN_TOO_LOW", "CANONICAL_CENTER_CONFLICT"],
        "decisionState": "applied",
        "supersedesDecisionRef": None,
        "downstreamInvalidationRefs": [],
        "decidedByRef": "duplicate_governor_070",
        "decidedAt": "2026-04-12T16:25:00Z",
        "revertedAt": None,
        "sourceRefs": SOURCE_PRECEDENCE[:7],
    },
]

CLUSTERS = [
    {
        "clusterId": "DCL_070_RETRY",
        "scenarioId": "exact_retry_collapse",
        "title": "Exact retry collapses to prior accepted request shell",
        "episodeId": "episode_070_retry",
        "canonicalRequestId": "request_070_retry_target",
        "memberRequestRefs": ["request_070_retry_target"],
        "memberSnapshotRefs": ["snapshot_070_retry"],
        "candidateRequestRefs": ["request_070_retry_target"],
        "pairwiseEvidenceRefs": ["DPE_070_RETRY"],
        "currentResolutionDecisionRef": "DDR_070_RETRY",
        "resolutionDecisionRefs": ["DDR_070_RETRY"],
        "relationType": "retry",
        "reviewStatus": "resolved_retry",
        "decisionRef": "DDR_070_RETRY",
        "clusterConfidence": 0.96,
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "channelCalibrationRef": "duplicate_calibration_web_v1",
        "instabilityState": "stable",
        "uncertaintyBand": "low",
        "lastRecomputedAt": "2026-04-12T16:00:00Z",
        "createdAt": "2026-04-12T16:00:00Z",
        "updatedAt": "2026-04-12T16:00:00Z",
        "summary": "Replay signal plus dominant retry posterior return the prior authoritative settlement instead of minting a second request.",
        "operatorGuidance": "No human review. Reuse the original acceptance path and preserve the original request anchor.",
        "closureBlockerActive": False,
        "sourceRefs": SOURCE_PRECEDENCE[:8],
    },
    {
        "clusterId": "DCL_070_ATTACH",
        "scenarioId": "same_request_continuation_with_witness",
        "title": "Same-request continuation only attaches after explicit witness",
        "episodeId": "episode_070_attach",
        "canonicalRequestId": "request_070_attach_target",
        "memberRequestRefs": ["request_070_attach_target"],
        "memberSnapshotRefs": ["snapshot_070_attach"],
        "candidateRequestRefs": ["request_070_attach_target"],
        "pairwiseEvidenceRefs": ["DPE_070_ATTACH"],
        "currentResolutionDecisionRef": "DDR_070_ATTACH_APPLIED",
        "resolutionDecisionRefs": ["DDR_070_ATTACH_REVIEW", "DDR_070_ATTACH_APPLIED"],
        "relationType": "same_episode_confirmed",
        "reviewStatus": "resolved_confirmed",
        "decisionRef": "DDR_070_ATTACH_APPLIED",
        "clusterConfidence": 0.63,
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "channelCalibrationRef": "duplicate_calibration_browser_v1",
        "instabilityState": "stable",
        "uncertaintyBand": "low",
        "lastRecomputedAt": "2026-04-12T16:05:00Z",
        "createdAt": "2026-04-12T16:04:00Z",
        "updatedAt": "2026-04-12T16:05:00Z",
        "summary": "The pair score was not enough by itself. The attach settled only after a workflow-return witness superseded the earlier review-required posture.",
        "operatorGuidance": "Verify the continuity witness before allowing same-request continuation to reuse the original shell.",
        "closureBlockerActive": False,
        "sourceRefs": SOURCE_PRECEDENCE[:8],
    },
    {
        "clusterId": "DCL_070_SAME_EPISODE",
        "scenarioId": "same_episode_candidate_high_similarity",
        "title": "High similarity stays explicit review work when the margin is thin",
        "episodeId": "episode_070_same_episode",
        "canonicalRequestId": "request_070_same_episode_a",
        "memberRequestRefs": ["request_070_same_episode_a"],
        "memberSnapshotRefs": ["snapshot_070_same_episode"],
        "candidateRequestRefs": ["request_070_same_episode_a", "request_070_same_episode_b"],
        "pairwiseEvidenceRefs": ["DPE_070_SAME_EPISODE_A", "DPE_070_SAME_EPISODE_B"],
        "currentResolutionDecisionRef": "DDR_070_SAME_EPISODE_REVIEW",
        "resolutionDecisionRefs": ["DDR_070_SAME_EPISODE_REVIEW"],
        "relationType": "same_episode_candidate",
        "reviewStatus": "in_review",
        "decisionRef": "DDR_070_SAME_EPISODE_REVIEW",
        "clusterConfidence": 0.44,
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "channelCalibrationRef": "duplicate_calibration_browser_v1",
        "instabilityState": "oscillating",
        "uncertaintyBand": "high",
        "lastRecomputedAt": "2026-04-12T16:10:30Z",
        "createdAt": "2026-04-12T16:10:00Z",
        "updatedAt": "2026-04-12T16:10:30Z",
        "summary": "Two same-episode candidates remain too close to auto-attach or auto-separate, so the cluster stays visible and closure-blocking.",
        "operatorGuidance": "Review canonical evidence side by side. Do not infer same-request continuation from high similarity alone.",
        "closureBlockerActive": True,
        "sourceRefs": SOURCE_PRECEDENCE[:8],
    },
    {
        "clusterId": "DCL_070_RELATED",
        "scenarioId": "related_episode_link",
        "title": "Related episode linkage stays auditable without same-request reuse",
        "episodeId": "episode_070_related_target",
        "canonicalRequestId": "request_070_related_target",
        "memberRequestRefs": ["request_070_related_target"],
        "memberSnapshotRefs": ["snapshot_070_related"],
        "candidateRequestRefs": ["request_070_related_target"],
        "pairwiseEvidenceRefs": ["DPE_070_RELATED"],
        "currentResolutionDecisionRef": "DDR_070_RELATED",
        "resolutionDecisionRefs": ["DDR_070_RELATED"],
        "relationType": "related_episode",
        "reviewStatus": "resolved_related",
        "decisionRef": "DDR_070_RELATED",
        "clusterConfidence": 0.71,
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "channelCalibrationRef": "duplicate_calibration_phone_v1",
        "instabilityState": "stable",
        "uncertaintyBand": "low",
        "lastRecomputedAt": "2026-04-12T16:15:00Z",
        "createdAt": "2026-04-12T16:15:00Z",
        "updatedAt": "2026-04-12T16:15:00Z",
        "summary": "The incoming work belongs with prior history, but not as the same request. The settlement preserves linkage without collapsing chronology.",
        "operatorGuidance": "Attach only the cross-episode relationship. Do not reuse request-local workflow states.",
        "closureBlockerActive": False,
        "sourceRefs": SOURCE_PRECEDENCE[:8],
    },
    {
        "clusterId": "DCL_070_SEPARATE",
        "scenarioId": "clear_separate_request",
        "title": "A clear new request remains separately auditable",
        "episodeId": "episode_070_separate_candidate",
        "canonicalRequestId": "request_070_separate_candidate",
        "memberRequestRefs": ["request_070_separate_candidate"],
        "memberSnapshotRefs": ["snapshot_070_separate"],
        "candidateRequestRefs": ["request_070_separate_candidate"],
        "pairwiseEvidenceRefs": ["DPE_070_SEPARATE"],
        "currentResolutionDecisionRef": "DDR_070_SEPARATE",
        "resolutionDecisionRefs": ["DDR_070_SEPARATE"],
        "relationType": "review_required",
        "reviewStatus": "resolved_separate",
        "decisionRef": "DDR_070_SEPARATE",
        "clusterConfidence": 0.74,
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "channelCalibrationRef": "duplicate_calibration_portal_v1",
        "instabilityState": "stable",
        "uncertaintyBand": "low",
        "lastRecomputedAt": "2026-04-12T16:20:00Z",
        "createdAt": "2026-04-12T16:20:00Z",
        "updatedAt": "2026-04-12T16:20:00Z",
        "summary": "The candidate window was still recorded, but the dominant posterior clearly favored a new request rather than attach or review.",
        "operatorGuidance": "Keep the new request separate and preserve the candidate audit trail for later challenge or replay review.",
        "closureBlockerActive": False,
        "sourceRefs": SOURCE_PRECEDENCE[:8],
    },
    {
        "clusterId": "DCL_070_CONFLICT",
        "scenarioId": "conflicting_candidates_low_margin",
        "title": "Conflicting candidates stay open until a human settles the ambiguity",
        "episodeId": "episode_070_conflict",
        "canonicalRequestId": "request_070_conflict_a",
        "memberRequestRefs": ["request_070_conflict_a"],
        "memberSnapshotRefs": ["snapshot_070_conflict"],
        "candidateRequestRefs": ["request_070_conflict_a", "request_070_conflict_b"],
        "pairwiseEvidenceRefs": ["DPE_070_CONFLICT_A", "DPE_070_CONFLICT_B"],
        "currentResolutionDecisionRef": "DDR_070_CONFLICT_REVIEW",
        "resolutionDecisionRefs": ["DDR_070_CONFLICT_REVIEW"],
        "relationType": "review_required",
        "reviewStatus": "open",
        "decisionRef": "DDR_070_CONFLICT_REVIEW",
        "clusterConfidence": 0.32,
        "thresholdPolicyRef": THRESHOLD_POLICY["thresholdPolicyRef"],
        "channelCalibrationRef": "duplicate_calibration_voice_v1",
        "instabilityState": "blocked_conflict",
        "uncertaintyBand": "high",
        "lastRecomputedAt": "2026-04-12T16:25:00Z",
        "createdAt": "2026-04-12T16:25:00Z",
        "updatedAt": "2026-04-12T16:25:00Z",
        "summary": "Near-equal competitors plus a hard blocker mean pairwise edges cannot become transitive proof. The ambiguity remains explicit and closure-blocking.",
        "operatorGuidance": "Keep review open. A later decision may supersede this posture, but only through a new DuplicateResolutionDecision.",
        "closureBlockerActive": True,
        "sourceRefs": SOURCE_PRECEDENCE[:8],
    },
]

CASES = [
    {
        "scenarioId": cluster["scenarioId"],
        "clusterId": cluster["clusterId"],
        "title": cluster["title"],
        "patientEffect": summary,
        "operatorPosture": guidance,
        "decisionHistoryRefs": cluster["resolutionDecisionRefs"],
        "closureBlockerActive": cluster["closureBlockerActive"],
        "sourceRefs": cluster["sourceRefs"],
    }
    for cluster, summary, guidance in [
        (
            CLUSTERS[0],
            "Return the earlier accepted result without creating a second request.",
            "No review required. Preserve the original request shell and audit trail.",
        ),
        (
            CLUSTERS[1],
            "Continue on the same request only after a witness-backed attach decision is settled.",
            "Confirm the witness and retain the supersession history.",
        ),
        (
            CLUSTERS[2],
            "Hold the patient-visible closure path because the same-episode candidate is still unresolved.",
            "Review candidate competition and do not auto-attach.",
        ),
        (
            CLUSTERS[3],
            "Link to related history without reusing the existing request workflow.",
            "Keep the linkage explicit and separately auditable.",
        ),
        (
            CLUSTERS[4],
            "Open a separate request while preserving the candidate review proof.",
            "Separation is settled, but the evidence remains inspectable.",
        ),
        (
            CLUSTERS[5],
            "Keep the ambiguity open until a human chooses between conflicting candidates or separation.",
            "This remains a calm-but-hard closure blocker.",
        ),
    ]
]


MANIFEST = {
    "task_id": TASK_ID,
    "generated_at": GENERATED_AT,
    "visual_mode": VISUAL_MODE,
    "source_precedence": SOURCE_PRECEDENCE,
    "threshold_policy": THRESHOLD_POLICY,
    "parallel_interface_gaps": PARALLEL_INTERFACE_GAPS,
    "summary": {
        "cluster_count": len(CLUSTERS),
        "pair_evidence_count": len(PAIR_EVIDENCES),
        "decision_count": len(DECISIONS),
        "review_required_count": sum(
            1
            for cluster in CLUSTERS
            if cluster["reviewStatus"] in {"open", "in_review"}
        ),
        "in_review_count": sum(1 for cluster in CLUSTERS if cluster["reviewStatus"] == "in_review"),
        "resolved_count": sum(1 for cluster in CLUSTERS if cluster["reviewStatus"].startswith("resolved")),
        "closure_blocking_count": sum(1 for cluster in CLUSTERS if cluster["closureBlockerActive"]),
        "parallel_interface_gap_count": len(PARALLEL_INTERFACE_GAPS),
        "superseded_decision_count": sum(1 for decision in DECISIONS if decision["decisionState"] == "superseded"),
    },
    "clusters": CLUSTERS,
    "pair_evidences": PAIR_EVIDENCES,
    "decisions": DECISIONS,
}

CASEBOOK = {
    "task_id": TASK_ID,
    "generated_at": GENERATED_AT,
    "summary": {
        "case_count": len(CASES),
        "blocking_case_count": sum(1 for case in CASES if case["closureBlockerActive"]),
        "supersession_history_count": 1,
    },
    "cases": CASES,
}

MATRIX_ROWS = [
    {
        "scenario_id": evidence["scenarioId"],
        "pair_evidence_id": evidence["pairEvidenceId"],
        "candidate_request_ref": evidence["candidateRequestRef"],
        "candidate_episode_ref": evidence["candidateEpisodeRef"],
        "dominant_relation": evidence["dominantRelation"],
        "relation_model_version_ref": evidence["relationModelVersionRef"],
        "threshold_policy_ref": evidence["thresholdPolicyRef"],
        "feature_vector_hash": evidence["featureVectorHash"],
        "pi_retry": evidence["piRetry"],
        "pi_same_request_attach": evidence["piSameRequestAttach"],
        "pi_same_episode": evidence["piSameEpisode"],
        "pi_related_episode": evidence["piRelatedEpisode"],
        "pi_new_episode": evidence["piNewEpisode"],
        "class_margin": evidence["classMargin"],
        "candidate_margin": evidence["candidateMargin"],
        "uncertainty_score": evidence["uncertaintyScore"],
        "uncertainty_band": evidence["uncertaintyBand"],
        "hard_blocker_refs": ";".join(evidence["hardBlockerRefs"]),
        "continuity_signal_refs": ";".join(evidence["continuitySignalRefs"]),
        "replay_signal_refs": ";".join(evidence["replaySignalRefs"]),
        "conflict_signal_refs": ";".join(evidence["conflictSignalRefs"]),
        "source_refs": ";".join(evidence["sourceRefs"]),
    }
    for evidence in PAIR_EVIDENCES
]


def build_design_doc() -> str:
    return dedent(
        f"""
        # 70 Duplicate Cluster And Pair Evidence Design

        ## Core law
        `DuplicateCluster` is the review container, not the settlement. `DuplicatePairEvidence` is immutable pairwise proof for one incoming snapshot against one candidate request. `DuplicateResolutionDecision` is the only legal settlement for retry collapse, same-request attach, same-episode linkage, related-episode linkage, separation, or explicit review requirement.

        ## Canonical objects
        - `DuplicatePairEvidence` freezes relation probabilities, class margin, candidate margin, uncertainty, blockers, model version, calibration ref, and threshold policy for each candidate comparison.
        - `DuplicateCluster` keeps candidate refs, pair evidence refs, confidence, instability, review posture, and the full decision chain without pretending the cluster itself is the final meaning.
        - `DuplicateResolutionDecision` settles duplicate meaning explicitly and keeps reversibility visible through `supersedesDecisionRef` and decision state.

        ## Attach law
        - `same_request_attach` requires an explicit continuity witness. Similarity alone is never sufficient.
        - `same_episode_candidate` is clustering signal only. It may open review work, but it may not settle attach or merge by itself.
        - Pairwise edges are not transitive proof. Auto settlement requires a canonical center and conflict-free competition margins.

        ## Closure posture
        Unresolved duplicate review remains closure-blocking. The frozen {TASK_ID} baseline currently carries `2` closure-blocking clusters: one `in_review` same-episode candidate and one `open` blocked-conflict cluster.

        ## Parallel block note
        The lineage side-effect bridge is intentionally still a bounded parallel gap: `PARALLEL_INTERFACE_GAP_070_DUPLICATE_LINEAGE_SETTLEMENT_PORT`. The duplicate backbone now publishes durable decisions; later tracks will consume them through the named settlement port instead of reconstructing truth from pair scores.
        """
    ).strip()


def build_rules_doc() -> str:
    return dedent(
        """
        # 70 Duplicate Resolution Rules

        ## Fail-closed rules
        - `same_request_attach` requires explicit continuity witness.
        - `same_episode_candidate` never settles by itself.
        - Pairwise candidate edges are not transitive proof.
        - Low candidate margin, high uncertainty, or hard blockers force `review_required`.
        - Unresolved duplicate review remains closure-blocking until a later `DuplicateResolutionDecision` settles it.

        ## Settlement classes
        - `exact_retry_collapse` returns the prior accepted request shell.
        - `same_request_attach` reuses the same request only when witness-backed continuity is explicit.
        - `same_episode_link` keeps work in the same episode but not as the same request.
        - `related_episode_link` preserves lineage relationship without same-request reuse.
        - `separate_request` records that the candidate window was inspected and rejected.
        - `review_required` keeps the ambiguity explicit and operator-visible.

        ## Supersession rules
        - A later decision may supersede an earlier review-required posture.
        - Reversal must create or reference new decision truth. It may not rewrite lineage history in place.
        - Supersession history must remain visible in both the machine-readable manifest and the workbench history table.

        ## Simulator contract
        The simulator path freezes the same pair-evidence and cluster contracts production will use later. Live calibration may update model versions or threshold refs, but it may not bypass explicit `DuplicateResolutionDecision` or continuity witness requirements.
        """
    ).strip()


def build_workbench_html() -> str:
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Duplicate Resolution Workbench</title>
            <style>
              :root {{
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F8;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #667085;
                --border: #E2E8F0;
                --evidence: #3559E6;
                --cluster: #0EA5A4;
                --review: #7C3AED;
                --warning: #C98900;
                --blocked: #C24141;
                --shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
                --radius-lg: 24px;
                --radius-md: 18px;
                --radius-sm: 14px;
                --transition-fast: 120ms ease;
                --transition-mid: 180ms ease;
                --transition-slow: 220ms ease;
              }}

              * {{ box-sizing: border-box; }}

              body {{
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: radial-gradient(circle at top left, rgba(53, 89, 230, 0.10), transparent 34%),
                  radial-gradient(circle at top right, rgba(14, 165, 164, 0.10), transparent 28%),
                  var(--canvas);
                color: var(--text-default);
              }}

              body[data-reduced-motion="true"] * {{
                animation: none !important;
                transition: none !important;
                scroll-behavior: auto !important;
              }}

              .shell {{
                max-width: 1500px;
                margin: 0 auto;
                padding: 24px;
              }}

              .masthead {{
                min-height: 72px;
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) repeat(4, minmax(120px, 1fr));
                gap: 16px;
                align-items: stretch;
              }}

              .panel {{
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
              }}

              .brand {{
                padding: 18px 22px;
                display: flex;
                align-items: center;
                gap: 14px;
              }}

              .brand svg {{
                width: 42px;
                height: 42px;
                flex: none;
              }}

              .metric {{
                padding: 16px 18px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 6px;
              }}

              .metric strong {{
                font-size: 1.9rem;
                line-height: 1;
                color: var(--text-strong);
              }}

              .layout {{
                margin-top: 20px;
                display: grid;
                grid-template-columns: 304px minmax(0, 1fr) 408px;
                gap: 18px;
                align-items: start;
              }}

              .rail {{
                padding: 18px;
                background: var(--rail);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border);
                position: sticky;
                top: 20px;
              }}

              .rail label {{
                display: grid;
                gap: 8px;
                margin-bottom: 16px;
                color: var(--text-muted);
                font-size: 0.92rem;
              }}

              select {{
                width: 100%;
                height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text-strong);
                padding: 0 14px;
              }}

              .canvas {{
                display: grid;
                gap: 18px;
              }}

              .canvas-section {{
                padding: 20px;
              }}

              .constellation {{
                min-height: 260px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                gap: 14px;
                align-items: stretch;
              }}

              .cluster-card,
              .pair-card,
              .decision-card,
              .table-button {{
                border: 1px solid var(--border);
                background: linear-gradient(180deg, #FFFFFF, #F9FBFF);
                color: inherit;
                border-radius: var(--radius-md);
                padding: 14px 16px;
                text-align: left;
                min-height: 172px;
                cursor: pointer;
                transition: transform var(--transition-fast), box-shadow var(--transition-mid), border-color var(--transition-mid);
              }}

              .pair-card,
              .decision-card {{
                min-height: 172px;
              }}

              .cluster-card:hover,
              .pair-card:hover,
              .decision-card:hover,
              .table-button:hover,
              .cluster-card:focus-visible,
              .pair-card:focus-visible,
              .decision-card:focus-visible,
              .table-button:focus-visible {{
                transform: translateY(-2px);
                box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
                outline: none;
              }}

              [data-selected="true"] {{
                border-color: var(--evidence);
                box-shadow: 0 0 0 3px rgba(53, 89, 230, 0.14);
              }}

              .tag-row {{
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 10px 0;
              }}

              .tag {{
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 5px 10px;
                font-size: 0.78rem;
                border: 1px solid var(--border);
                background: var(--inset);
                color: var(--text-muted);
              }}

              .tag.review {{ color: var(--review); border-color: rgba(124, 58, 237, 0.24); }}
              .tag.blocked {{ color: var(--blocked); border-color: rgba(194, 65, 65, 0.22); }}
              .tag.cluster {{ color: var(--cluster); border-color: rgba(14, 165, 164, 0.22); }}
              .tag.warning {{ color: var(--warning); border-color: rgba(201, 137, 0, 0.24); }}

              .comparison-lane,
              .decision-timeline {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 14px;
              }}

              .inspector {{
                padding: 20px;
                position: sticky;
                top: 20px;
                transition: transform var(--transition-slow), opacity var(--transition-slow);
              }}

              .inspector pre,
              .mono {{
                font-family: "SFMono-Regular", ui-monospace, monospace;
                font-size: 0.82rem;
                white-space: pre-wrap;
                word-break: break-word;
              }}

              .lower-grid {{
                margin-top: 18px;
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 18px;
              }}

              table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 0.88rem;
              }}

              th, td {{
                padding: 10px 8px;
                border-bottom: 1px solid var(--border);
                vertical-align: top;
              }}

              th {{
                text-align: left;
                color: var(--text-muted);
                font-weight: 600;
              }}

              .table-button {{
                min-height: 0;
                padding: 0;
                border: 0;
                background: transparent;
                box-shadow: none;
                width: 100%;
              }}

              .parity {{
                margin-top: 10px;
                color: var(--text-muted);
                font-size: 0.9rem;
              }}

              .empty {{
                padding: 24px;
                border-radius: var(--radius-md);
                background: var(--inset);
                color: var(--text-muted);
                border: 1px dashed var(--border);
              }}

              @media (max-width: 1180px) {{
                .layout {{
                  grid-template-columns: 1fr;
                }}

                .rail, .inspector {{
                  position: static;
                }}
              }}

              @media (max-width: 760px) {{
                .shell {{
                  padding: 16px;
                }}

                .masthead {{
                  grid-template-columns: 1fr 1fr;
                }}

                .brand {{
                  grid-column: 1 / -1;
                }}

                .lower-grid {{
                  grid-template-columns: 1fr;
                }}
              }}
            </style>
          </head>
          <body>
            <div class="shell">
              <header class="masthead" aria-label="Workbench summary">
                <div class="panel brand">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    <rect x="3" y="3" width="42" height="42" rx="14" fill="#0F172A"></rect>
                    <path d="M15 34V14h9.4c5.7 0 9.1 3 9.1 8.1 0 5.2-3.5 8.4-9.3 8.4h-4.6V34H15Zm4.6-7.1h4.1c3.4 0 5.1-1.5 5.1-4.7 0-3.1-1.7-4.6-5.1-4.6h-4.1v9.3Z" fill="#F7F9FC"></path>
                    <path d="M33 34 26.6 24l5.8-10h5L31.6 24 38 34h-5Z" fill="#3559E6"></path>
                  </svg>
                  <div>
                    <div style="font-size:0.82rem; color:#667085; text-transform:uppercase; letter-spacing:0.08em;">Vecells</div>
                    <div style="font-size:1.25rem; color:#0F172A; font-weight:700;">Duplicate Resolution Workbench</div>
                    <div style="color:#667085;">Quiet review desk for cluster evidence, settlement posture, and supersession chains.</div>
                  </div>
                </div>
                <div class="panel metric"><span>Open Clusters</span><strong data-testid="metric-open-clusters">0</strong></div>
                <div class="panel metric"><span>Resolved Clusters</span><strong data-testid="metric-resolved-clusters">0</strong></div>
                <div class="panel metric"><span>Review Required</span><strong data-testid="metric-review-required">0</strong></div>
                <div class="panel metric"><span>Unstable Clusters</span><strong data-testid="metric-unstable-clusters">0</strong></div>
              </header>

              <div class="layout">
                <aside class="rail" aria-label="Workbench filters">
                  <label>
                    Relation type
                    <select id="relation-filter" data-testid="relation-filter">
                      <option value="all">All relations</option>
                    </select>
                  </label>
                  <label>
                    Review state
                    <select id="review-status-filter" data-testid="review-status-filter">
                      <option value="all">All review states</option>
                    </select>
                  </label>
                  <label>
                    Uncertainty band
                    <select id="uncertainty-filter" data-testid="uncertainty-filter">
                      <option value="all">All uncertainty bands</option>
                    </select>
                  </label>
                </aside>

                <main class="canvas">
                  <section class="panel canvas-section">
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                      <div>
                        <h2 style="margin:0; color:#0F172A;">Cluster constellation</h2>
                        <p style="margin:8px 0 0; color:#667085;">Each card is one persisted `DuplicateCluster`. The cluster stays a review container even when a later decision settles meaning.</p>
                      </div>
                    </div>
                    <div class="constellation" data-testid="constellation"></div>
                    <div class="parity" data-testid="constellation-parity"></div>
                  </section>

                  <section class="panel canvas-section">
                    <h2 style="margin:0; color:#0F172A;">Pair evidence comparison lane</h2>
                    <p style="margin:8px 0 14px; color:#667085;">The winning pair never becomes transitive proof. Competitors remain visible whenever the margin is thin or blocked.</p>
                    <div class="comparison-lane" data-testid="comparison-lane"></div>
                    <div class="parity" data-testid="comparison-parity"></div>
                  </section>

                  <section class="panel canvas-section">
                    <h2 style="margin:0; color:#0F172A;">Resolution decision timeline</h2>
                    <p style="margin:8px 0 14px; color:#667085;">Only `DuplicateResolutionDecision` settles retry, attach, linkage, separation, or review requirement.</p>
                    <div class="decision-timeline" data-testid="decision-timeline"></div>
                    <div class="parity" data-testid="timeline-parity"></div>
                  </section>

                  <div class="lower-grid">
                    <section class="panel canvas-section">
                      <h2 style="margin:0; color:#0F172A;">Evidence table</h2>
                      <table data-testid="evidence-table">
                        <thead>
                          <tr>
                            <th>Pair evidence</th>
                            <th>Dominant relation</th>
                            <th>Margins</th>
                            <th>Uncertainty</th>
                          </tr>
                        </thead>
                        <tbody id="evidence-table-body"></tbody>
                      </table>
                    </section>
                    <section class="panel canvas-section">
                      <h2 style="margin:0; color:#0F172A;">Supersession history</h2>
                      <table data-testid="supersession-history">
                        <thead>
                          <tr>
                            <th>Decision</th>
                            <th>Class</th>
                            <th>State</th>
                            <th>Witness / supersession</th>
                          </tr>
                        </thead>
                        <tbody id="history-table-body"></tbody>
                      </table>
                    </section>
                  </div>
                </main>

                <aside class="panel inspector" data-testid="inspector" aria-live="polite"></aside>
              </div>
            </div>

            <script>
              const manifestUrl = "../../data/analysis/duplicate_cluster_manifest.json";
              const casebookUrl = "../../data/analysis/duplicate_resolution_casebook.json";
              const matrixUrl = "../../data/analysis/duplicate_pair_evidence_matrix.csv";

              const state = {{
                manifest: null,
                casebook: null,
                matrixRows: [],
                selectedClusterId: null,
                selectedPairEvidenceId: null,
                selectedDecisionId: null,
                relationFilter: "all",
                reviewStatusFilter: "all",
                uncertaintyFilter: "all",
              }};

              function parseCsv(text) {{
                const lines = text.trim().split(/\\r?\\n/);
                const headers = lines.shift().split(",");
                return lines.map((line) => {{
                  const cells = [];
                  let current = "";
                  let inQuotes = false;
                  for (let i = 0; i < line.length; i += 1) {{
                    const char = line[i];
                    if (char === '"') {{
                      inQuotes = !inQuotes;
                    }} else if (char === "," && !inQuotes) {{
                      cells.push(current);
                      current = "";
                    }} else {{
                      current += char;
                    }}
                  }}
                  cells.push(current);
                  return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
                }});
              }}

              function byId(rows, idField) {{
                return Object.fromEntries(rows.map((row) => [row[idField], row]));
              }}

              function selectedCluster() {{
                return state.manifest.clusters.find((cluster) => cluster.clusterId === state.selectedClusterId) ?? null;
              }}

              function visibleClusters() {{
                return state.manifest.clusters.filter((cluster) => {{
                  const relationPass = state.relationFilter === "all" || cluster.relationType === state.relationFilter;
                  const reviewPass = state.reviewStatusFilter === "all" || cluster.reviewStatus === state.reviewStatusFilter;
                  const uncertaintyPass = state.uncertaintyFilter === "all" || cluster.uncertaintyBand === state.uncertaintyFilter;
                  return relationPass && reviewPass && uncertaintyPass;
                }});
              }}

              function clusterDecisionHistory(cluster) {{
                const decisions = byId(state.manifest.decisions, "duplicateResolutionDecisionId");
                return cluster.resolutionDecisionRefs.map((decisionId) => decisions[decisionId]).filter(Boolean);
              }}

              function clusterEvidenceRows(cluster) {{
                const evidence = byId(state.manifest.pair_evidences, "pairEvidenceId");
                return cluster.pairwiseEvidenceRefs.map((pairEvidenceId) => evidence[pairEvidenceId]).filter(Boolean);
              }}

              function updateSelection() {{
                const visible = visibleClusters();
                if (!visible.length) {{
                  state.selectedClusterId = null;
                  state.selectedPairEvidenceId = null;
                  state.selectedDecisionId = null;
                  return;
                }}
                if (!visible.some((cluster) => cluster.clusterId === state.selectedClusterId)) {{
                  state.selectedClusterId = visible[0].clusterId;
                }}
                const cluster = selectedCluster();
                const evidenceRows = clusterEvidenceRows(cluster);
                if (!evidenceRows.some((row) => row.pairEvidenceId === state.selectedPairEvidenceId)) {{
                  state.selectedPairEvidenceId = evidenceRows[0]?.pairEvidenceId ?? null;
                }}
                const decisions = clusterDecisionHistory(cluster);
                if (!decisions.some((row) => row.duplicateResolutionDecisionId === state.selectedDecisionId)) {{
                  state.selectedDecisionId =
                    cluster.currentResolutionDecisionRef ??
                    decisions[decisions.length - 1]?.duplicateResolutionDecisionId ??
                    null;
                }}
              }}

              function renderMetrics() {{
                const clusters = state.manifest.clusters;
                document.querySelector("[data-testid='metric-open-clusters']").textContent = String(
                  clusters.filter((cluster) => cluster.reviewStatus === "open").length,
                );
                document.querySelector("[data-testid='metric-resolved-clusters']").textContent = String(
                  clusters.filter((cluster) => cluster.reviewStatus.startsWith("resolved")).length,
                );
                document.querySelector("[data-testid='metric-review-required']").textContent = String(
                  clusters.filter((cluster) => ["open", "in_review"].includes(cluster.reviewStatus)).length,
                );
                document.querySelector("[data-testid='metric-unstable-clusters']").textContent = String(
                  clusters.filter((cluster) => cluster.instabilityState !== "stable").length,
                );
              }}

              function renderFilters() {{
                const relationSelect = document.querySelector("[data-testid='relation-filter']");
                const reviewSelect = document.querySelector("[data-testid='review-status-filter']");
                const uncertaintySelect = document.querySelector("[data-testid='uncertainty-filter']");

                if (relationSelect.options.length === 1) {{
                  [...new Set(state.manifest.clusters.map((cluster) => cluster.relationType))]
                    .sort()
                    .forEach((value) => relationSelect.add(new Option(value, value)));
                }}
                if (reviewSelect.options.length === 1) {{
                  [...new Set(state.manifest.clusters.map((cluster) => cluster.reviewStatus))]
                    .sort()
                    .forEach((value) => reviewSelect.add(new Option(value, value)));
                }}
                if (uncertaintySelect.options.length === 1) {{
                  [...new Set(state.manifest.clusters.map((cluster) => cluster.uncertaintyBand))]
                    .sort()
                    .forEach((value) => uncertaintySelect.add(new Option(value, value)));
                }}
              }}

              function selectCluster(clusterId) {{
                state.selectedClusterId = clusterId;
                updateSelection();
                render();
              }}

              function moveClusterSelectionFrom(currentClusterId, step) {{
                const visible = visibleClusters();
                const index = visible.findIndex((cluster) => cluster.clusterId === currentClusterId);
                if (index === -1) return;
                const next = visible[index + step];
                if (next) {{
                  selectCluster(next.clusterId);
                }}
              }}

              function renderConstellation() {{
                const root = document.querySelector("[data-testid='constellation']");
                const visible = visibleClusters();
                root.innerHTML = "";
                if (!visible.length) {{
                  root.innerHTML = '<div class="empty">No clusters match the current filter set.</div>';
                  document.querySelector("[data-testid='constellation-parity']").textContent = "0 visible clusters.";
                  return;
                }}
                for (const cluster of visible) {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "cluster-card";
                  button.dataset.testid = `cluster-card-${{cluster.clusterId}}`;
                  button.dataset.selected = String(cluster.clusterId === state.selectedClusterId);
                  button.setAttribute("data-testid", `cluster-card-${{cluster.clusterId}}`);
                  button.innerHTML = `
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                      <strong class="mono" style="color:#0F172A;">${{cluster.clusterId}}</strong>
                      <span class="tag cluster">${{cluster.relationType}}</span>
                    </div>
                    <div style="margin-top:10px; font-size:1rem; color:#0F172A; font-weight:600;">${{cluster.title}}</div>
                    <div class="tag-row">
                      <span class="tag review">${{cluster.reviewStatus}}</span>
                      <span class="tag ${{cluster.instabilityState === "blocked_conflict" ? "blocked" : cluster.instabilityState === "oscillating" ? "warning" : "cluster"}}">${{cluster.instabilityState}}</span>
                      <span class="tag">${{cluster.uncertaintyBand}}</span>
                    </div>
                    <div style="color:#667085; line-height:1.45;">${{cluster.summary}}</div>
                  `;
                  button.addEventListener("click", () => selectCluster(cluster.clusterId));
                  button.addEventListener("keydown", (event) => {{
                    if (event.key === "ArrowDown") {{
                      event.preventDefault();
                      moveClusterSelectionFrom(cluster.clusterId, 1);
                    }}
                    if (event.key === "ArrowUp") {{
                      event.preventDefault();
                      moveClusterSelectionFrom(cluster.clusterId, -1);
                    }}
                  }});
                  root.appendChild(button);
                }}
                const unstable = visible.filter((cluster) => cluster.instabilityState !== "stable").length;
                document.querySelector("[data-testid='constellation-parity']").textContent =
                  `${{visible.length}} visible clusters, ${{visible.filter((cluster) => ["open", "in_review"].includes(cluster.reviewStatus)).length}} review-required, ${{unstable}} unstable.`;
              }}

              function renderComparisonLane(cluster) {{
                const evidenceRows = cluster ? clusterEvidenceRows(cluster) : [];
                const root = document.querySelector("[data-testid='comparison-lane']");
                root.innerHTML = "";
                if (!evidenceRows.length) {{
                  root.innerHTML = '<div class="empty">Select a cluster to compare pair evidence.</div>';
                  document.querySelector("[data-testid='comparison-parity']").textContent = "No pair evidence visible.";
                  return;
                }}
                for (const row of evidenceRows) {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "pair-card";
                  button.setAttribute("data-testid", `pair-card-${{row.pairEvidenceId}}`);
                  button.dataset.selected = String(row.pairEvidenceId === state.selectedPairEvidenceId);
                  button.innerHTML = `
                    <div style="display:flex; justify-content:space-between; gap:10px;">
                      <strong class="mono">${{row.pairEvidenceId}}</strong>
                      <span class="tag ${{row.uncertaintyBand === "high" ? "blocked" : row.uncertaintyBand === "guarded" ? "warning" : "cluster"}}">${{row.uncertaintyBand}}</span>
                    </div>
                    <div style="margin-top:10px; color:#0F172A; font-weight:600;">${{row.candidateRequestRef}}</div>
                    <div class="tag-row">
                      <span class="tag cluster">${{row.dominantRelation}}</span>
                      <span class="tag">class ${{
                        Number(row.classMargin).toFixed(2)
                      }}</span>
                      <span class="tag">candidate ${{
                        Number(row.candidateMargin).toFixed(2)
                      }}</span>
                    </div>
                    <div style="color:#667085;">Hard blockers: ${{
                      row.hardBlockerRefs.length ? row.hardBlockerRefs.join(", ") : "none"
                    }}</div>
                  `;
                  button.addEventListener("click", () => {{
                    state.selectedPairEvidenceId = row.pairEvidenceId;
                    renderInspector(cluster);
                    renderTables(cluster);
                    renderComparisonLane(cluster);
                  }});
                  root.appendChild(button);
                }}
                document.querySelector("[data-testid='comparison-parity']").textContent =
                  `${{evidenceRows.length}} pair evidence rows back the selected cluster.`;
              }}

              function renderTimeline(cluster) {{
                const decisions = cluster ? clusterDecisionHistory(cluster) : [];
                const root = document.querySelector("[data-testid='decision-timeline']");
                root.innerHTML = "";
                if (!decisions.length) {{
                  root.innerHTML = '<div class="empty">No duplicate decision history is available.</div>';
                  document.querySelector("[data-testid='timeline-parity']").textContent = "No decisions visible.";
                  return;
                }}
                for (const decision of decisions) {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "decision-card";
                  button.setAttribute("data-testid", `decision-card-${{decision.duplicateResolutionDecisionId}}`);
                  button.dataset.selected = String(
                    decision.duplicateResolutionDecisionId === state.selectedDecisionId,
                  );
                  button.innerHTML = `
                    <div style="display:flex; justify-content:space-between; gap:10px;">
                      <strong class="mono">${{decision.duplicateResolutionDecisionId}}</strong>
                      <span class="tag review">${{decision.decisionState}}</span>
                    </div>
                    <div style="margin-top:10px; color:#0F172A; font-weight:600;">${{decision.decisionClass}}</div>
                    <div class="tag-row">
                      <span class="tag">${{decision.reviewMode}}</span>
                      <span class="tag">${{decision.continuityWitnessClass}}</span>
                    </div>
                    <div style="color:#667085;">${{decision.reasonCodes.join(", ")}}</div>
                  `;
                  button.addEventListener("click", () => {{
                    state.selectedDecisionId = decision.duplicateResolutionDecisionId;
                    renderInspector(cluster);
                    renderTimeline(cluster);
                    renderTables(cluster);
                  }});
                  root.appendChild(button);
                }}
                document.querySelector("[data-testid='timeline-parity']").textContent =
                  `${{decisions.length}} decision rows preserve the settlement history for the selected cluster.`;
              }}

              function renderInspector(cluster) {{
                const inspector = document.querySelector("[data-testid='inspector']");
                if (!cluster) {{
                  inspector.innerHTML = '<div class="empty">No cluster matches the current filters.</div>';
                  return;
                }}
                const pair = clusterEvidenceRows(cluster).find((row) => row.pairEvidenceId === state.selectedPairEvidenceId);
                const decision = clusterDecisionHistory(cluster).find(
                  (row) => row.duplicateResolutionDecisionId === state.selectedDecisionId,
                );
                const caseEntry = state.casebook.cases.find((entry) => entry.clusterId === cluster.clusterId);
                inspector.innerHTML = `
                  <h2 style="margin:0; color:#0F172A;">Selected cluster</h2>
                  <div class="mono" style="margin-top:10px;">${{cluster.clusterId}}</div>
                  <p style="margin:12px 0; color:#667085; line-height:1.5;">${{cluster.summary}}</p>
                  <div class="tag-row">
                    <span class="tag cluster">${{cluster.relationType}}</span>
                    <span class="tag review">${{cluster.reviewStatus}}</span>
                    <span class="tag ${{cluster.instabilityState === "blocked_conflict" ? "blocked" : cluster.instabilityState === "oscillating" ? "warning" : "cluster"}}">${{cluster.instabilityState}}</span>
                  </div>
                  <h3 style="margin:20px 0 8px; color:#0F172A;">Current pair evidence</h3>
                  <div class="mono">${{pair?.pairEvidenceId ?? "none"}}</div>
                  <div style="color:#667085; margin-top:8px;">${{pair ? `request=${{pair.candidateRequestRef}} | dominant=${{pair.dominantRelation}} | uncertainty=${{pair.uncertaintyBand}}` : "No selected pair evidence."}}</div>
                  <h3 style="margin:20px 0 8px; color:#0F172A;">Current decision</h3>
                  <div class="mono">${{decision?.duplicateResolutionDecisionId ?? "none"}}</div>
                  <div style="color:#667085; margin-top:8px;">${{decision ? `class=${{decision.decisionClass}} | witness=${{decision.continuityWitnessClass}} | state=${{decision.decisionState}}` : "No selected decision."}}</div>
                  <h3 style="margin:20px 0 8px; color:#0F172A;">Case posture</h3>
                  <div style="color:#667085; line-height:1.5;">${{caseEntry?.patientEffect ?? ""}}</div>
                  <div style="margin-top:8px; color:#0F172A;">${{caseEntry?.operatorPosture ?? ""}}</div>
                  <h3 style="margin:20px 0 8px; color:#0F172A;">Operator guidance</h3>
                  <div style="color:#667085; line-height:1.5;">${{cluster.operatorGuidance}}</div>
                `;
              }}

              function moveTableSelection(collection, currentId, key, step) {{
                const index = collection.findIndex((row) => row[key] === currentId);
                if (index === -1) return currentId;
                return collection[index + step]?.[key] ?? currentId;
              }}

              function renderTables(cluster) {{
                const evidenceRows = cluster ? clusterEvidenceRows(cluster) : [];
                const decisionRows = cluster ? clusterDecisionHistory(cluster) : [];
                const evidenceBody = document.querySelector("#evidence-table-body");
                const historyBody = document.querySelector("#history-table-body");
                evidenceBody.innerHTML = "";
                historyBody.innerHTML = "";

                if (!evidenceRows.length) {{
                  evidenceBody.innerHTML = '<tr><td colspan="4" class="empty">No evidence rows.</td></tr>';
                }} else {{
                  for (const row of evidenceRows) {{
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                      <td>
                        <button type="button" class="table-button" data-testid="evidence-row-${{row.pairEvidenceId}}" data-selected="${{row.pairEvidenceId === state.selectedPairEvidenceId}}" aria-label="${{row.pairEvidenceId}}">
                          <div class="mono">${{row.pairEvidenceId}}</div>
                          <div style="color:#667085;">${{row.candidateRequestRef}}</div>
                        </button>
                      </td>
                      <td>${{row.dominantRelation}}</td>
                      <td>class ${{Number(row.classMargin).toFixed(2)}} / candidate ${{Number(row.candidateMargin).toFixed(2)}}</td>
                      <td>${{row.uncertaintyBand}} (${{Number(row.uncertaintyScore).toFixed(2)}})</td>
                    `;
                    const button = tr.querySelector("button");
                    button.addEventListener("click", () => {{
                      state.selectedPairEvidenceId = row.pairEvidenceId;
                      renderComparisonLane(cluster);
                      renderInspector(cluster);
                      renderTables(cluster);
                    }});
                    button.addEventListener("keydown", (event) => {{
                      if (event.key === "ArrowDown") {{
                        event.preventDefault();
                        state.selectedPairEvidenceId = moveTableSelection(evidenceRows, row.pairEvidenceId, "pairEvidenceId", 1);
                        renderComparisonLane(cluster);
                        renderInspector(cluster);
                        renderTables(cluster);
                      }}
                      if (event.key === "ArrowUp") {{
                        event.preventDefault();
                        state.selectedPairEvidenceId = moveTableSelection(evidenceRows, row.pairEvidenceId, "pairEvidenceId", -1);
                        renderComparisonLane(cluster);
                        renderInspector(cluster);
                        renderTables(cluster);
                      }}
                    }});
                    evidenceBody.appendChild(tr);
                  }}
                }}

                if (!decisionRows.length) {{
                  historyBody.innerHTML = '<tr><td colspan="4" class="empty">No decision history.</td></tr>';
                }} else {{
                  for (const row of decisionRows) {{
                    const supersessionLabel = row.supersedesDecisionRef ?? row.continuityWitnessRef ?? "none";
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                      <td>
                        <button type="button" class="table-button" data-testid="history-row-${{row.duplicateResolutionDecisionId}}" data-selected="${{row.duplicateResolutionDecisionId === state.selectedDecisionId}}" aria-label="${{row.duplicateResolutionDecisionId}}">
                          <div class="mono">${{row.duplicateResolutionDecisionId}}</div>
                          <div style="color:#667085;">${{row.decidedAt}}</div>
                        </button>
                      </td>
                      <td>${{row.decisionClass}}</td>
                      <td>${{row.decisionState}}</td>
                      <td class="mono">${{supersessionLabel}}</td>
                    `;
                    const button = tr.querySelector("button");
                    button.addEventListener("click", () => {{
                      state.selectedDecisionId = row.duplicateResolutionDecisionId;
                      renderTimeline(cluster);
                      renderInspector(cluster);
                      renderTables(cluster);
                    }});
                    button.addEventListener("keydown", (event) => {{
                      if (event.key === "ArrowDown") {{
                        event.preventDefault();
                        state.selectedDecisionId = moveTableSelection(decisionRows, row.duplicateResolutionDecisionId, "duplicateResolutionDecisionId", 1);
                        renderTimeline(cluster);
                        renderInspector(cluster);
                        renderTables(cluster);
                      }}
                      if (event.key === "ArrowUp") {{
                        event.preventDefault();
                        state.selectedDecisionId = moveTableSelection(decisionRows, row.duplicateResolutionDecisionId, "duplicateResolutionDecisionId", -1);
                        renderTimeline(cluster);
                        renderInspector(cluster);
                        renderTables(cluster);
                      }}
                    }});
                    historyBody.appendChild(tr);
                  }}
                }}
              }}

              function render() {{
                updateSelection();
                renderMetrics();
                renderFilters();
                renderConstellation();
                const cluster = selectedCluster();
                renderComparisonLane(cluster);
                renderTimeline(cluster);
                renderInspector(cluster);
                renderTables(cluster);
              }}

              async function boot() {{
                const [manifest, casebook, matrixCsv] = await Promise.all([
                  fetch(manifestUrl).then((response) => response.json()),
                  fetch(casebookUrl).then((response) => response.json()),
                  fetch(matrixUrl).then((response) => response.text()),
                ]);
                state.manifest = manifest;
                state.casebook = casebook;
                state.matrixRows = parseCsv(matrixCsv);

                document.body.dataset.reducedMotion = String(
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches,
                );

                document.querySelector("[data-testid='relation-filter']").addEventListener("change", (event) => {{
                  state.relationFilter = event.target.value;
                  render();
                }});
                document.querySelector("[data-testid='review-status-filter']").addEventListener("change", (event) => {{
                  state.reviewStatusFilter = event.target.value;
                  render();
                }});
                document.querySelector("[data-testid='uncertainty-filter']").addEventListener("change", (event) => {{
                  state.uncertaintyFilter = event.target.value;
                  render();
                }});

                render();
              }}

              boot().catch((error) => {{
                document.querySelector("[data-testid='inspector']").innerHTML = `<div class="empty">${{error.message}}</div>`;
              }});
            </script>
          </body>
        </html>
        """
    ).strip()


def build_spec() -> str:
    return dedent(
        f"""
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import {{ fileURLToPath }} from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "70_duplicate_resolution_workbench.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "duplicate_cluster_manifest.json");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "duplicate_resolution_casebook.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "duplicate_pair_evidence_matrix.csv");

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));
        const MATRIX = fs.readFileSync(MATRIX_PATH, "utf8").trim().split(/\\r?\\n/).slice(1);

        function assertCondition(condition, message) {{
          if (!condition) {{
            throw new Error(message);
          }}
        }}

        async function importPlaywright() {{
          try {{
            return await import("playwright");
          }} catch {{
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }}
        }}

        function startStaticServer() {{
          return new Promise((resolve, reject) => {{
            const server = http.createServer((req, res) => {{
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/70_duplicate_resolution_workbench.html"
                  : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(ROOT, safePath);
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {{
                res.writeHead(404);
                res.end("Not found");
                return;
              }}
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : filePath.endsWith(".json")
                  ? "application/json; charset=utf-8"
                  : filePath.endsWith(".csv")
                    ? "text/csv; charset=utf-8"
                    : "text/plain; charset=utf-8";
              res.writeHead(200, {{ "Content-Type": contentType }});
              res.end(body);
            }});
            server.once("error", reject);
            server.listen(4371, "127.0.0.1", () => resolve(server));
          }});
        }}

        async function run() {{
          assertCondition(fs.existsSync(HTML_PATH), `Missing workbench HTML: ${{HTML_PATH}}`);
          const {{ chromium }} = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({{ headless: true }});
          const page = await browser.newPage({{ viewport: {{ width: 1480, height: 1120 }} }});
          const url =
            process.env.DUPLICATE_WORKBENCH_URL ??
            "http://127.0.0.1:4371/docs/architecture/70_duplicate_resolution_workbench.html";

          try {{
            await page.goto(url, {{ waitUntil: "networkidle" }});
            await page.locator("[data-testid='constellation']").waitFor();
            await page.locator("[data-testid='comparison-lane']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='evidence-table']").waitFor();
            await page.locator("[data-testid='supersession-history']").waitFor();

            const clusterCards = await page.locator("button[data-testid^='cluster-card-']").count();
            assertCondition(
              clusterCards === MANIFEST.summary.cluster_count,
              `Expected ${{MANIFEST.summary.cluster_count}} cluster cards, found ${{clusterCards}}.`,
            );

            await page.locator("[data-testid='relation-filter']").selectOption("same_episode_candidate");
            const sameEpisodeCards = await page.locator("button[data-testid^='cluster-card-']").count();
            assertCondition(sameEpisodeCards === 1, `Expected 1 same_episode_candidate cluster, found ${{sameEpisodeCards}}.`);

            await page.locator("[data-testid='relation-filter']").selectOption("all");
            await page.locator("[data-testid='review-status-filter']").selectOption("in_review");
            const inReviewCards = await page.locator("button[data-testid^='cluster-card-']").count();
            assertCondition(inReviewCards === 1, `Expected 1 in-review cluster, found ${{inReviewCards}}.`);

            await page.locator("[data-testid='review-status-filter']").selectOption("all");
            await page.locator("[data-testid='uncertainty-filter']").selectOption("high");
            const highUncertaintyCards = await page.locator("button[data-testid^='cluster-card-']").count();
            assertCondition(highUncertaintyCards === 2, `Expected 2 high-uncertainty clusters, found ${{highUncertaintyCards}}.`);

            await page.locator("[data-testid='uncertainty-filter']").selectOption("all");
            await page.locator("[data-testid='cluster-card-DCL_070_ATTACH']").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("DCL_070_ATTACH") &&
                inspectorText.includes("DDR_070_ATTACH_APPLIED") &&
                inspectorText.includes("DPE_070_ATTACH"),
              "Inspector lost cluster, decision, or pair synchronization.",
            );

            const historyRows = await page.locator("[data-testid^='history-row-']").count();
            assertCondition(historyRows === 2, `Expected 2 attach history rows, found ${{historyRows}}.`);

            const parityText = await page.locator("[data-testid='constellation-parity']").textContent();
            assertCondition(parityText.includes("6 visible clusters"), "Constellation parity drifted.");

            const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
            assertCondition(evidenceRows === 1, `Expected 1 attach evidence row, found ${{evidenceRows}}.`);

            await page.locator("[data-testid='cluster-card-DCL_070_RETRY']").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='cluster-card-DCL_070_ATTACH']")
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance cluster selection.");

            await page.locator("[data-testid='history-row-DDR_070_ATTACH_REVIEW']").focus();
            await page.keyboard.press("ArrowDown");
            const nextDecisionSelected = await page
              .locator("[data-testid='history-row-DDR_070_ATTACH_APPLIED']")
              .getAttribute("data-selected");
            assertCondition(
              nextDecisionSelected === "true",
              "History keyboard navigation did not advance selection.",
            );

            await page.setViewportSize({{ width: 390, height: 844 }});
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

            const motionPage = await browser.newPage({{ viewport: {{ width: 1280, height: 900 }} }});
            try {{
              await motionPage.emulateMedia({{ reducedMotion: "reduce" }});
              await motionPage.goto(url, {{ waitUntil: "networkidle" }});
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            }} finally {{
              await motionPage.close();
            }}

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${{landmarks}}.`);
            assertCondition(CASEBOOK.summary.case_count === 6, "Casebook summary drifted.");
            assertCondition(MATRIX.length === MANIFEST.summary.pair_evidence_count, "Matrix row count drifted.");
          }} finally {{
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }}
        }}

        if (process.argv.includes("--run")) {{
          run().catch((error) => {{
            console.error(error);
            process.exitCode = 1;
          }});
        }}

        export const duplicateResolutionWorkbenchManifest = {{
          task: MANIFEST.task_id,
          clusters: MANIFEST.summary.cluster_count,
          pairEvidence: MANIFEST.summary.pair_evidence_count,
          decisions: MANIFEST.summary.decision_count,
          coverage: [
            "relation and status filtering",
            "cluster selection synchronization",
            "diagram and table parity",
            "keyboard navigation",
            "reduced motion",
            "responsive layout",
          ],
        }};
        """
    ).strip()


def main() -> None:
    write_json(MANIFEST_PATH, MANIFEST)
    write_csv(MATRIX_PATH, MATRIX_ROWS)
    write_json(CASEBOOK_PATH, CASEBOOK)
    write_text(DESIGN_DOC_PATH, build_design_doc())
    write_text(RULES_DOC_PATH, build_rules_doc())
    write_text(WORKBENCH_PATH, build_workbench_html())
    write_text(SPEC_PATH, build_spec())


if __name__ == "__main__":
    main()
