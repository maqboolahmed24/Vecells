#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"

MANIFEST_PATH = DATA_DIR / "release_approval_freeze_manifest.json"
MATRIX_PATH = DATA_DIR / "assurance_slice_trust_matrix.csv"
CASEBOOK_PATH = DATA_DIR / "release_trust_freeze_casebook.json"
DESIGN_DOC_PATH = DOCS_DIR / "75_release_freeze_channel_freeze_and_assurance_trust_design.md"
RULES_DOC_PATH = DOCS_DIR / "75_release_trust_verdict_rules.md"
COMMAND_CENTER_PATH = DOCS_DIR / "75_release_trust_freeze_command_center.html"
SPEC_PATH = TESTS_DIR / "release-trust-freeze-command-center.spec.js"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
SERVICE_PACKAGE_PATH = ROOT / "services" / "command-api" / "package.json"
ANALYTICS_INDEX_PATH = (
    ROOT / "packages" / "domains" / "analytics_assurance" / "src" / "index.ts"
)
IDENTITY_INDEX_PATH = (
    ROOT / "packages" / "domains" / "identity_access" / "src" / "index.ts"
)
RELEASE_CONTROLS_SOURCE_PATH = ROOT / "packages" / "release-controls" / "src" / "index.ts"
RELEASE_CONTROLS_TEST_PATH = (
    ROOT / "packages" / "release-controls" / "tests" / "public-api.test.ts"
)

TASK_ID = "par_075"
VISUAL_MODE = "Release_Trust_Freeze_Command_Center"
CAPTURED_ON = "2026-04-12"
GENERATED_AT = "2026-04-12T00:00:00+00:00"

SOURCE_PRECEDENCE = [
    "prompt/075.md",
    "prompt/shared_operating_contract_066_to_075.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
    "blueprint/phase-0-the-foundation-protocol.md#1.24A GovernanceReviewPackage",
    "blueprint/phase-0-the-foundation-protocol.md#1.24B StandardsDependencyWatchlist",
    "blueprint/phase-0-the-foundation-protocol.md#1.25 ChannelReleaseFreezeRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.26 AssuranceSliceTrustRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.26A ReleaseTrustFreezeVerdict",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-frontend-blueprint.md#Action dispatch, acknowledgement, projection follow-through, and route-local settlement",
    "blueprint/ux-quiet-clarity-redesign.md#Conceptual redesign strategy / C1. Bounded degraded and frozen calm states",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "packages/domains/analytics_assurance/src/assurance-slice-trust-backbone.ts",
    "packages/domains/identity_access/src/release-trust-freeze-backbone.ts",
    "packages/release-controls/src/index.ts",
    "services/command-api/src/release-trust-freeze.ts",
]

SCENARIO_BLUEPRINTS = [
    {
        "scenario_id": "live_exact_parity_trusted_slices",
        "title": "Exact tuple with trusted slices keeps calm truth and mutation live.",
        "audience_surface": "patient-web",
        "route_family_ref": "rf_patient_home",
        "channel_family": "browser_web",
        "channel_state": "monitoring",
        "freeze_state": "active",
        "watchlist_state": "current",
        "watch_tuple_state": "active",
        "guardrail_state": "green",
        "runtime_publication_state": "published",
        "parity_state": "exact",
        "provenance_state": "publishable",
        "surface_authority_state": "live",
        "calm_truth_state": "allowed",
        "mutation_authority_state": "enabled",
        "recovery_disposition_ref": "recovery_live_patient_home",
        "blocker_refs": [],
        "summary": "The approved release tuple, watch tuple, browser channel, and both required trust slices stay exact and current.",
        "slices": [
            {
                "slice_namespace": "patient.surface",
                "producer_scope_ref": "producer_patient_surface",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.968,
                "trust_lower_bound": 0.914,
                "freshness_score": 0.971,
                "coverage_score": 1.0,
                "lineage_score": 1.0,
                "replay_score": 1.0,
                "consistency_score": 0.964,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
            {
                "slice_namespace": "patient.continuity",
                "producer_scope_ref": "producer_patient_continuity",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.953,
                "trust_lower_bound": 0.891,
                "freshness_score": 0.963,
                "coverage_score": 1.0,
                "lineage_score": 0.979,
                "replay_score": 0.984,
                "consistency_score": 0.947,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
        ],
        "validators": [
            {
                "validator_id": "freeze_tuple_integrity",
                "status": "pass",
                "detail": "The active release freeze still matches the reviewed package hash and current watchlist hash.",
            },
            {
                "validator_id": "verdict_live_authority",
                "status": "pass",
                "detail": "All required slices remain trusted and the browser channel stays in monitoring posture only.",
            },
        ],
    },
    {
        "scenario_id": "diagnostic_only_degraded_slice",
        "title": "Partial trust evidence keeps the surface diagnostic only.",
        "audience_surface": "ops-console",
        "route_family_ref": "rf_ops_overview",
        "channel_family": "embedded_webview",
        "channel_state": "monitoring",
        "freeze_state": "active",
        "watchlist_state": "current",
        "watch_tuple_state": "active",
        "guardrail_state": "green",
        "runtime_publication_state": "published",
        "parity_state": "exact",
        "provenance_state": "publishable",
        "surface_authority_state": "diagnostic_only",
        "calm_truth_state": "suppressed",
        "mutation_authority_state": "observe_only",
        "recovery_disposition_ref": "recovery_ops_diagnostic",
        "blocker_refs": [
            "BLOCKER_ASSURANCE_DEGRADED_OPS.SURFACE",
            "BLOCKER_CALM_OR_WRITABLE_POSTURE_SUPPRESSED",
        ],
        "summary": "One required operational slice remains partial, so the board can explain and observe but not imply calm or arm live controls.",
        "slices": [
            {
                "slice_namespace": "ops.surface",
                "producer_scope_ref": "producer_ops_surface",
                "trust_state": "degraded",
                "completeness_state": "partial",
                "trust_score": 0.821,
                "trust_lower_bound": 0.641,
                "freshness_score": 0.952,
                "coverage_score": 0.958,
                "lineage_score": 0.938,
                "replay_score": 0.925,
                "consistency_score": 0.811,
                "hard_block_state": False,
                "reason_code": "partial_evidence",
            },
            {
                "slice_namespace": "ops.continuity",
                "producer_scope_ref": "producer_ops_continuity",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.945,
                "trust_lower_bound": 0.881,
                "freshness_score": 0.964,
                "coverage_score": 1.0,
                "lineage_score": 0.972,
                "replay_score": 0.978,
                "consistency_score": 0.934,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
        ],
        "validators": [
            {
                "validator_id": "slice_threshold_guard",
                "status": "pass",
                "detail": "The degraded slice stays below the trusted floor while remaining diagnostically visible.",
            },
            {
                "validator_id": "calm_truth_suppression",
                "status": "pass",
                "detail": "The verdict suppresses calm language and writable posture outside the live state.",
            },
        ],
    },
    {
        "scenario_id": "recovery_only_active_channel_freeze",
        "title": "Rollback-recommended channel freeze forces governed recovery only.",
        "audience_surface": "governance-console",
        "route_family_ref": "rf_governance_release",
        "channel_family": "browser_web",
        "channel_state": "rollback_recommended",
        "freeze_state": "active",
        "watchlist_state": "current",
        "watch_tuple_state": "active",
        "guardrail_state": "green",
        "runtime_publication_state": "published",
        "parity_state": "exact",
        "provenance_state": "publishable",
        "surface_authority_state": "recovery_only",
        "calm_truth_state": "suppressed",
        "mutation_authority_state": "governed_recovery",
        "recovery_disposition_ref": "recovery_governance_channel_freeze",
        "blocker_refs": [
            "BLOCKER_CHANNEL_FREEZE_ROLLBACK_RECOMMENDED",
            "BLOCKER_CALM_OR_WRITABLE_POSTURE_SUPPRESSED",
        ],
        "summary": "The release tuple is still exact, but the active channel freeze makes governed rollback posture the only legal authority.",
        "slices": [
            {
                "slice_namespace": "governance.surface",
                "producer_scope_ref": "producer_governance_surface",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.959,
                "trust_lower_bound": 0.903,
                "freshness_score": 0.968,
                "coverage_score": 1.0,
                "lineage_score": 0.987,
                "replay_score": 0.981,
                "consistency_score": 0.943,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
            {
                "slice_namespace": "governance.continuity",
                "producer_scope_ref": "producer_governance_continuity",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.948,
                "trust_lower_bound": 0.889,
                "freshness_score": 0.958,
                "coverage_score": 1.0,
                "lineage_score": 0.975,
                "replay_score": 0.979,
                "consistency_score": 0.932,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
        ],
        "validators": [
            {
                "validator_id": "channel_freeze_authority",
                "status": "pass",
                "detail": "An active rollback recommendation prevents live mutation despite exact parity and trusted slices.",
            },
            {
                "validator_id": "recovery_route_binding",
                "status": "pass",
                "detail": "The verdict preserves one explicit recovery disposition instead of falling back to detached error posture.",
            },
        ],
    },
    {
        "scenario_id": "blocked_missing_inputs",
        "title": "Missing watch and publication inputs fail closed to blocked.",
        "audience_surface": "support-workspace",
        "route_family_ref": "rf_support_queue",
        "channel_family": "governance_console_bridge",
        "channel_state": "monitoring",
        "freeze_state": "active",
        "watchlist_state": "current",
        "watch_tuple_state": "missing",
        "guardrail_state": "green",
        "runtime_publication_state": "missing",
        "parity_state": "missing",
        "provenance_state": "publishable",
        "surface_authority_state": "blocked",
        "calm_truth_state": "suppressed",
        "mutation_authority_state": "blocked",
        "recovery_disposition_ref": None,
        "blocker_refs": [
            "BLOCKER_RELEASE_WATCH_TUPLE_NOT_ACTIVE",
            "BLOCKER_RUNTIME_PUBLICATION_NOT_PUBLISHED",
            "BLOCKER_RELEASE_PARITY_NOT_EXACT",
            "BLOCKER_ASSURANCE_HARD_SUPPORT-WORKSPACE.AUTHORITY",
        ],
        "summary": "The simulator withholds the watch tuple and publication parity, and one slice has not completed a policy-legal evaluation pass.",
        "slices": [
            {
                "slice_namespace": "support-workspace.authority",
                "producer_scope_ref": "producer_support_authority",
                "trust_state": "unknown",
                "completeness_state": "blocked",
                "trust_score": 0.0,
                "trust_lower_bound": 0.0,
                "freshness_score": 0.0,
                "coverage_score": 0.0,
                "lineage_score": 0.0,
                "replay_score": 0.0,
                "consistency_score": 0.0,
                "hard_block_state": True,
                "reason_code": "missing_inputs",
            },
            {
                "slice_namespace": "support-workspace.continuity",
                "producer_scope_ref": "producer_support_continuity",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.942,
                "trust_lower_bound": 0.886,
                "freshness_score": 0.955,
                "coverage_score": 1.0,
                "lineage_score": 0.976,
                "replay_score": 0.971,
                "consistency_score": 0.929,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
        ],
        "validators": [
            {
                "validator_id": "missing_input_block",
                "status": "pass",
                "detail": "Absent watch-tuple and publication inputs stop verdict generation from degrading into guesswork.",
            },
            {
                "validator_id": "verdict_fail_closed",
                "status": "pass",
                "detail": "The blocked verdict suppresses both calm truth and governed recovery because no bounded recovery path is published.",
            },
        ],
    },
    {
        "scenario_id": "blocked_standards_watchlist_drift",
        "title": "Standards watchlist drift supersedes an otherwise valid freeze.",
        "audience_surface": "clinical-workspace",
        "route_family_ref": "rf_clinical_workspace",
        "channel_family": "clinical_workspace_bridge",
        "channel_state": "monitoring",
        "freeze_state": "active",
        "watchlist_state": "stale",
        "watch_tuple_state": "active",
        "guardrail_state": "green",
        "runtime_publication_state": "published",
        "parity_state": "exact",
        "provenance_state": "publishable",
        "surface_authority_state": "blocked",
        "calm_truth_state": "suppressed",
        "mutation_authority_state": "blocked",
        "recovery_disposition_ref": None,
        "blocker_refs": [
            "DRIFT_STANDARDS_WATCHLIST_NOT_CURRENT",
            "DRIFT_STANDARDS_PROMOTION_GATE",
        ],
        "summary": "The freeze tuple stays immutable, but the linked standards watchlist has drifted stale and reopens the approval block.",
        "slices": [
            {
                "slice_namespace": "clinical.surface",
                "producer_scope_ref": "producer_clinical_surface",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.958,
                "trust_lower_bound": 0.905,
                "freshness_score": 0.966,
                "coverage_score": 1.0,
                "lineage_score": 0.984,
                "replay_score": 0.98,
                "consistency_score": 0.944,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
            {
                "slice_namespace": "clinical.continuity",
                "producer_scope_ref": "producer_clinical_continuity",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.949,
                "trust_lower_bound": 0.887,
                "freshness_score": 0.959,
                "coverage_score": 1.0,
                "lineage_score": 0.977,
                "replay_score": 0.973,
                "consistency_score": 0.935,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
        ],
        "validators": [
            {
                "validator_id": "watchlist_drift_guard",
                "status": "pass",
                "detail": "The stale watchlist supersedes the freeze even though publication and trust rows still look green in isolation.",
            },
            {
                "validator_id": "fragment_authority_forbidden",
                "status": "pass",
                "detail": "The simulator refuses to reconstruct live writability from fragments once the verdict exists.",
            },
        ],
    },
    {
        "scenario_id": "recovery_only_parity_or_provenance_drift",
        "title": "Parity or provenance drift suppresses calm truth and writable posture.",
        "audience_surface": "patient-web",
        "route_family_ref": "rf_patient_messages",
        "channel_family": "embedded_webview",
        "channel_state": "monitoring",
        "freeze_state": "active",
        "watchlist_state": "current",
        "watch_tuple_state": "active",
        "guardrail_state": "green",
        "runtime_publication_state": "published",
        "parity_state": "drifted",
        "provenance_state": "blocked",
        "surface_authority_state": "recovery_only",
        "calm_truth_state": "suppressed",
        "mutation_authority_state": "governed_recovery",
        "recovery_disposition_ref": "recovery_patient_messages",
        "blocker_refs": [
            "BLOCKER_RELEASE_PARITY_NOT_EXACT",
            "BLOCKER_PROVENANCE_NOT_PUBLISHABLE",
            "BLOCKER_CALM_OR_WRITABLE_POSTURE_SUPPRESSED",
        ],
        "summary": "The frozen tuple is still present, but parity drift and blocked provenance force a governed recovery path instead of calm success or write access.",
        "slices": [
            {
                "slice_namespace": "patient.messages",
                "producer_scope_ref": "producer_patient_messages",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.956,
                "trust_lower_bound": 0.901,
                "freshness_score": 0.965,
                "coverage_score": 1.0,
                "lineage_score": 0.983,
                "replay_score": 0.979,
                "consistency_score": 0.941,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
            {
                "slice_namespace": "patient.messages.continuity",
                "producer_scope_ref": "producer_patient_messages_continuity",
                "trust_state": "trusted",
                "completeness_state": "complete",
                "trust_score": 0.947,
                "trust_lower_bound": 0.885,
                "freshness_score": 0.957,
                "coverage_score": 1.0,
                "lineage_score": 0.975,
                "replay_score": 0.971,
                "consistency_score": 0.934,
                "hard_block_state": False,
                "reason_code": "healthy",
            },
        ],
        "validators": [
            {
                "validator_id": "parity_drift_suppression",
                "status": "pass",
                "detail": "Publication or provenance drift suppresses calm truth even when the required slices remain trusted.",
            },
            {
                "validator_id": "governed_recovery_binding",
                "status": "pass",
                "detail": "The verdict keeps one governed recovery route visible instead of silently blocking the same shell.",
            },
        ],
    },
]

RELEASE_CONTROLS_BLOCK = dedent(
    """
    // par_075_release_trust_contracts:start
    export type ReleaseApprovalFreezeState = "active" | "superseded" | "expired";
    export type ChannelReleaseState =
      | "monitoring"
      | "frozen"
      | "kill_switch_active"
      | "rollback_recommended"
      | "released";
    export type AssuranceTrustState = "trusted" | "degraded" | "quarantined" | "unknown";
    export type AssuranceCompletenessState = "complete" | "partial" | "blocked";
    export type ReleaseTrustSurfaceAuthorityState =
      | "live"
      | "diagnostic_only"
      | "recovery_only"
      | "blocked";
    export type ReleaseTrustCalmTruthState = "allowed" | "suppressed";
    export type ReleaseTrustMutationAuthorityState =
      | "enabled"
      | "governed_recovery"
      | "observe_only"
      | "blocked";

    export interface ReleaseApprovalFreezeContract {
      releaseApprovalFreezeId: string;
      releaseCandidateRef: string;
      governanceReviewPackageRef: string;
      standardsDependencyWatchlistRef: string;
      reviewPackageHash: string;
      standardsWatchlistHash: string;
      freezeState: ReleaseApprovalFreezeState;
      approvedAt: string;
    }

    export interface ChannelReleaseFreezeRecordContract {
      channelFreezeId: string;
      channelFamily: string;
      releaseApprovalFreezeRef: string;
      channelState: ChannelReleaseState;
      effectiveAt: string;
      updatedAt: string;
    }

    export interface AssuranceSliceTrustRecordContract {
      sliceTrustId: string;
      sliceNamespace: string;
      trustState: AssuranceTrustState;
      completenessState: AssuranceCompletenessState;
      trustLowerBound: number;
      hardBlockState: boolean;
    }

    export interface ReleaseTrustFreezeVerdictContract {
      releaseTrustFreezeVerdictId: string;
      audienceSurface: string;
      routeFamilyRef: string;
      releaseApprovalFreezeRef: string;
      requiredChannelFreezeRefs: readonly string[];
      requiredAssuranceSliceTrustRefs: readonly string[];
      surfaceAuthorityState: ReleaseTrustSurfaceAuthorityState;
      calmTruthState: ReleaseTrustCalmTruthState;
      mutationAuthorityState: ReleaseTrustMutationAuthorityState;
      blockerRefs: readonly string[];
      evaluatedAt: string;
    }

    export function isLiveReleaseTrustVerdict(
      verdict: Pick<ReleaseTrustFreezeVerdictContract, "surfaceAuthorityState">,
    ): boolean {
      return verdict.surfaceAuthorityState === "live";
    }

    export function releaseTrustAllowsCalmTruth(
      verdict: Pick<ReleaseTrustFreezeVerdictContract, "surfaceAuthorityState" | "calmTruthState">,
    ): boolean {
      return verdict.surfaceAuthorityState === "live" && verdict.calmTruthState === "allowed";
    }

    export function releaseTrustAllowsMutation(
      verdict: Pick<
        ReleaseTrustFreezeVerdictContract,
        "surfaceAuthorityState" | "mutationAuthorityState"
      >,
    ): boolean {
      return verdict.surfaceAuthorityState === "live" && verdict.mutationAuthorityState === "enabled";
    }
    // par_075_release_trust_contracts:end
    """
).strip()


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


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json_file(path: Path, payload: dict[str, object]) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def append_script_step(script: str, step: str) -> str:
    return script if step in script else script + " && " + step


def build_cases() -> list[dict[str, object]]:
    cases: list[dict[str, object]] = []
    for blueprint in SCENARIO_BLUEPRINTS:
        scenario_id = blueprint["scenario_id"]
        governance_review_package_id = f"grp::{scenario_id}"
        standards_watchlist_id = f"watch::{scenario_id}"
        release_approval_freeze_id = f"freeze::{scenario_id}"
        channel_freeze_id = f"channel::{scenario_id}"
        verdict_id = f"verdict::{scenario_id}"
        slices = []
        for index, slice_blueprint in enumerate(blueprint["slices"], start=1):
            slices.append(
                {
                    "sliceTrustId": f"slice::{scenario_id}::{index}",
                    "sliceNamespace": slice_blueprint["slice_namespace"],
                    "producerScopeRef": slice_blueprint["producer_scope_ref"],
                    "trustState": slice_blueprint["trust_state"],
                    "completenessState": slice_blueprint["completeness_state"],
                    "trustScore": slice_blueprint["trust_score"],
                    "trustLowerBound": slice_blueprint["trust_lower_bound"],
                    "freshnessScore": slice_blueprint["freshness_score"],
                    "coverageScore": slice_blueprint["coverage_score"],
                    "lineageScore": slice_blueprint["lineage_score"],
                    "replayScore": slice_blueprint["replay_score"],
                    "consistencyScore": slice_blueprint["consistency_score"],
                    "hardBlockState": slice_blueprint["hard_block_state"],
                    "blockingProducerRefs": [],
                    "blockingNamespaceRefs": [],
                    "evaluationModelRef": "assurance_slice_trust_model::par_075_v1",
                    "evaluationInputHash": f"hash::{scenario_id}::{index}",
                    "evidenceRef": f"evidence::{scenario_id}::{index}",
                    "effectiveAt": "2026-04-12T22:03:00Z",
                    "reviewDueAt": "2026-04-12T23:00:00Z",
                    "updatedAt": "2026-04-12T22:05:00Z",
                    "reasonCode": slice_blueprint["reason_code"],
                }
            )
        case = {
            "scenarioId": scenario_id,
            "title": blueprint["title"],
            "audienceSurface": blueprint["audience_surface"],
            "routeFamilyRef": blueprint["route_family_ref"],
            "channelFamily": blueprint["channel_family"],
            "summary": blueprint["summary"],
            "sourceRefs": SOURCE_PRECEDENCE,
            "governanceReviewPackage": {
                "governanceReviewPackageId": governance_review_package_id,
                "scopeTupleHash": f"scope_hash::{scenario_id}",
                "baselineTupleHash": f"baseline_hash::{scenario_id}",
                "compiledPolicyBundleRef": f"compiled_policy::{scenario_id}",
                "releaseWatchTupleRef": f"watch_tuple::{scenario_id}",
                "watchTupleHash": f"watch_tuple_hash::{scenario_id}",
                "compilationTupleHash": f"compilation_hash::{scenario_id}",
                "approvalTupleHash": f"approval_hash::{scenario_id}",
                "standardsWatchlistHash": f"watchlist_hash::{scenario_id}",
                "settlementLineageRef": f"settlement_lineage::{scenario_id}",
                "reviewPackageHash": f"review_hash::{scenario_id}",
                "packageState": "current",
                "assembledAt": "2026-04-12T22:00:00Z",
            },
            "standardsWatchlist": {
                "standardsDependencyWatchlistId": standards_watchlist_id,
                "candidateBundleHash": f"candidate_bundle::{scenario_id}",
                "liveBundleHash": f"live_bundle::{scenario_id}",
                "environmentRef": "staging",
                "tenantScopeRef": f"tenant_scope::{scenario_id}",
                "scopeTupleHash": f"scope_hash::{scenario_id}",
                "reviewPackageHash": f"review_hash::{scenario_id}",
                "blockingFindingRefs": [],
                "advisoryFindingRefs": [],
                "compileGateState": "pass",
                "promotionGateState": "review_required"
                if scenario_id == "blocked_standards_watchlist_drift"
                else "pass",
                "watchlistState": blueprint["watchlist_state"],
                "watchlistHash": f"watchlist_hash::{scenario_id}",
                "generatedAt": "2026-04-12T22:01:00Z",
            },
            "releaseApprovalFreeze": {
                "releaseApprovalFreezeId": release_approval_freeze_id,
                "releaseCandidateRef": f"release_candidate::{scenario_id}",
                "governanceReviewPackageRef": governance_review_package_id,
                "standardsDependencyWatchlistRef": standards_watchlist_id,
                "compiledPolicyBundleRef": f"compiled_policy::{scenario_id}",
                "baselineTupleHash": f"baseline_hash::{scenario_id}",
                "scopeTupleHash": f"scope_hash::{scenario_id}",
                "compilationTupleHash": f"compilation_hash::{scenario_id}",
                "approvalTupleHash": f"approval_hash::{scenario_id}",
                "reviewPackageHash": f"review_hash::{scenario_id}",
                "standardsWatchlistHash": f"watchlist_hash::{scenario_id}",
                "artifactDigestSetHash": f"artifact_digest::{scenario_id}",
                "surfaceSchemaSetHash": f"surface_schema::{scenario_id}",
                "bridgeCapabilitySetHash": f"bridge_capability::{scenario_id}",
                "migrationPlanHash": f"migration_plan::{scenario_id}",
                "compatibilityEvidenceRef": f"compatibility_evidence::{scenario_id}",
                "approvedBy": f"approver::{scenario_id}",
                "approvedAt": "2026-04-12T22:02:00Z",
                "freezeState": blueprint["freeze_state"],
            },
            "channelFreeze": {
                "channelFreezeId": channel_freeze_id,
                "channelFamily": blueprint["channel_family"],
                "manifestVersionRef": f"manifest_version::{scenario_id}",
                "releaseApprovalFreezeRef": release_approval_freeze_id,
                "minimumBridgeCapabilitiesRef": f"bridge_floor::{scenario_id}",
                "channelState": blueprint["channel_state"],
                "effectiveAt": "2026-04-12T22:03:00Z",
                "updatedAt": "2026-04-12T22:04:00Z",
            },
            "assuranceSlices": slices,
            "verdict": {
                "releaseTrustFreezeVerdictId": verdict_id,
                "audienceSurface": blueprint["audience_surface"],
                "routeFamilyRef": blueprint["route_family_ref"],
                "releaseApprovalFreezeRef": release_approval_freeze_id,
                "releaseWatchTupleRef": f"watch_tuple::{scenario_id}",
                "releaseWatchTupleState": blueprint["watch_tuple_state"],
                "waveGuardrailSnapshotRef": f"guardrail::{scenario_id}",
                "waveGuardrailState": blueprint["guardrail_state"],
                "runtimePublicationBundleRef": f"runtime_bundle::{scenario_id}",
                "runtimePublicationState": blueprint["runtime_publication_state"],
                "releasePublicationParityRef": f"release_parity::{scenario_id}",
                "releasePublicationParityState": blueprint["parity_state"],
                "requiredChannelFreezeRefs": [channel_freeze_id],
                "requiredAssuranceSliceTrustRefs": [slice["sliceTrustId"] for slice in slices],
                "provenanceConsumptionState": blueprint["provenance_state"],
                "surfaceAuthorityState": blueprint["surface_authority_state"],
                "calmTruthState": blueprint["calm_truth_state"],
                "mutationAuthorityState": blueprint["mutation_authority_state"],
                "governingRecoveryDispositionRef": blueprint["recovery_disposition_ref"],
                "blockerRefs": blueprint["blocker_refs"],
                "evaluatedAt": "2026-04-12T22:05:00Z",
            },
            "validators": blueprint["validators"],
        }
        cases.append(case)
    return cases


def build_manifest(cases: list[dict[str, object]]) -> dict[str, object]:
    verdict_counts = {
        "live": 0,
        "diagnostic_only": 0,
        "recovery_only": 0,
        "blocked": 0,
    }
    trust_state_count = 0
    validator_row_count = 0
    for case in cases:
        verdict_counts[case["verdict"]["surfaceAuthorityState"]] += 1
        trust_state_count += len(case["assuranceSlices"])
        validator_row_count += len(case["validators"])
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Publish immutable release-freeze, channel-freeze, slice-trust, and verdict authority artifacts so later runtime and frontend work consume one machine-readable posture contract instead of re-deriving authority from fragments.",
        "source_precedence": SOURCE_PRECEDENCE,
        "parallel_interface_gaps": [
            "PARALLEL_INTERFACE_GAP_075_RELEASE_WATCH_TUPLE_PORT",
            "PARALLEL_INTERFACE_GAP_075_RUNTIME_PARITY_AND_PROVENANCE_PORT",
        ],
        "summary": {
            "scenario_count": len(cases),
            "release_freeze_count": len(cases),
            "channel_freeze_count": len(cases),
            "assurance_slice_count": trust_state_count,
            "verdict_count": len(cases),
            "validator_row_count": validator_row_count,
            "live_count": verdict_counts["live"],
            "diagnostic_only_count": verdict_counts["diagnostic_only"],
            "recovery_only_count": verdict_counts["recovery_only"],
            "blocked_count": verdict_counts["blocked"],
        },
        "scenarios": [
            {
                "scenario_id": case["scenarioId"],
                "title": case["title"],
                "audience_surface": case["audienceSurface"],
                "route_family_ref": case["routeFamilyRef"],
                "channel_family": case["channelFamily"],
                "watchlist_state": case["standardsWatchlist"]["watchlistState"],
                "surface_authority_state": case["verdict"]["surfaceAuthorityState"],
                "calm_truth_state": case["verdict"]["calmTruthState"],
                "mutation_authority_state": case["verdict"]["mutationAuthorityState"],
                "blocker_count": len(case["verdict"]["blockerRefs"]),
            }
            for case in cases
        ],
    }


def build_matrix_rows(cases: list[dict[str, object]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for case in cases:
        verdict = case["verdict"]
        channel = case["channelFreeze"]
        for slice_row in case["assuranceSlices"]:
            rows.append(
                {
                    "scenario_id": case["scenarioId"],
                    "audience_surface": case["audienceSurface"],
                    "route_family_ref": case["routeFamilyRef"],
                    "channel_family": channel["channelFamily"],
                    "channel_state": channel["channelState"],
                    "slice_trust_id": slice_row["sliceTrustId"],
                    "slice_namespace": slice_row["sliceNamespace"],
                    "producer_scope_ref": slice_row["producerScopeRef"],
                    "trust_state": slice_row["trustState"],
                    "completeness_state": slice_row["completenessState"],
                    "trust_score": f'{slice_row["trustScore"]:.3f}',
                    "trust_lower_bound": f'{slice_row["trustLowerBound"]:.3f}',
                    "freshness_score": f'{slice_row["freshnessScore"]:.3f}',
                    "coverage_score": f'{slice_row["coverageScore"]:.3f}',
                    "lineage_score": f'{slice_row["lineageScore"]:.3f}',
                    "replay_score": f'{slice_row["replayScore"]:.3f}',
                    "consistency_score": f'{slice_row["consistencyScore"]:.3f}',
                    "hard_block_state": str(slice_row["hardBlockState"]).lower(),
                    "surface_authority_state": verdict["surfaceAuthorityState"],
                    "calm_truth_state": verdict["calmTruthState"],
                    "mutation_authority_state": verdict["mutationAuthorityState"],
                    "evaluation_model_ref": slice_row["evaluationModelRef"],
                    "evaluation_input_hash": slice_row["evaluationInputHash"],
                    "effective_at": slice_row["effectiveAt"],
                    "review_due_at": slice_row["reviewDueAt"],
                    "updated_at": slice_row["updatedAt"],
                }
            )
    return rows


def build_casebook(cases: list[dict[str, object]], manifest: dict[str, object]) -> dict[str, object]:
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "case_count": len(cases),
            "trust_slice_count": sum(len(case["assuranceSlices"]) for case in cases),
            "validator_row_count": sum(len(case["validators"]) for case in cases),
            "live_count": manifest["summary"]["live_count"],
            "diagnostic_only_count": manifest["summary"]["diagnostic_only_count"],
            "recovery_only_count": manifest["summary"]["recovery_only_count"],
            "blocked_count": manifest["summary"]["blocked_count"],
        },
        "cases": cases,
    }


def build_design_doc(manifest: dict[str, object]) -> str:
    return dedent(
        f"""
        # 75 Release Freeze, Channel Freeze, and Assurance Trust Design

        ## Core law
        `ReleaseApprovalFreeze` is the immutable approved release tuple, `ChannelReleaseFreezeRecord` is the channel-specific write gate, `AssuranceSliceTrustRecord` is the per-slice trust authority, and `ReleaseTrustFreezeVerdict` is the only legal live-authority decision once published.

        ## Model set
        This pack freezes {manifest["summary"]["release_freeze_count"]} release freezes, {manifest["summary"]["channel_freeze_count"]} channel-freeze rows, {manifest["summary"]["assurance_slice_count"]} assurance-slice rows, and {manifest["summary"]["verdict_count"]} published verdicts across the Phase 0 control-plane cases required by prompt `075`.

        The supporting objects remain explicit:
        - `GovernanceReviewPackage` carries the reviewed baseline, compilation, approval, watch, and settlement lineage hashes.
        - `StandardsDependencyWatchlist` carries candidate-bound hygiene and drift state.
        - `ReleaseApprovalFreeze` binds those exact reviewed rows rather than relying on floating bundle or schema hashes.
        - `ReleaseTrustFreezeVerdict` joins watch tuple, guardrail, publication, parity, provenance, channel freeze, and slice trust into one publishable posture.

        ## Simulation scenarios
        The simulator now covers:
        - exact live authority with trusted slices
        - degraded slice posture forcing `diagnostic_only`
        - active channel freeze forcing `recovery_only`
        - missing inputs forcing `blocked`
        - standards watchlist drift superseding an otherwise exact freeze
        - parity or provenance drift suppressing calm truth and writable posture

        ## Persistence and shared contract surface
        The authoritative rows persist through the command-api seam and are republished for downstream consumers through `@vecells/release-controls`, so later gateways and shells do not depend on private domain-package internals to interpret release trust.
        """
    ).strip()


def build_rules_doc() -> str:
    return dedent(
        """
        # 75 Release Trust Verdict Rules

        ## Verdict rules
        `ReleaseTrustFreezeVerdict` is the single machine-readable live-authority decision.

        The verdict is `live` only when:
        - the linked `ReleaseApprovalFreeze` remains active
        - the linked `GovernanceReviewPackage` remains current
        - the linked `StandardsDependencyWatchlist` remains current and pass/pass
        - the release watch tuple is active
        - the guardrail snapshot is green
        - runtime publication is published
        - release parity is exact
        - provenance remains publishable
        - every required channel freeze remains in monitoring or released posture
        - every required assurance slice remains `trusted` with `completenessState = complete`

        `diagnostic_only` is mandatory when the tuple is still exact enough for bounded diagnostics but one required slice is merely degraded or partial.

        `recovery_only` is mandatory when a channel freeze activates, parity drifts, provenance blocks, or another governed recovery path is the only safe posture that preserves same-shell continuity.

        `blocked` is mandatory when required verdict inputs are stale, missing, contradictory, or when no bounded recovery path remains.

        ## Fail-closed rules
        `ReleaseApprovalFreeze` may not be reused after hash drift, watchlist drift, supersession, or expiry.

        `ChannelReleaseFreezeRecord` may not be bypassed for channel-specific or embedded write posture.

        `AssuranceSliceTrustRecord` is per-slice, scored, and thresholded; degraded or unknown slices may not silently inherit live authority from healthier neighbors.

        Calm truth may remain allowed only while the verdict is `live`. `diagnostic_only`, `recovery_only`, and `blocked` must suppress calm success and writable affordances even when local projections still look green.

        ## Simulator contract
        The local simulator must emit the same raw freeze rows, channel rows, trust rows, and final verdicts that later CI/CD, governance, canary, parity, and provenance inputs will enrich in production.
        """
    ).strip()


def build_html(casebook: dict[str, object], matrix_rows: list[dict[str, object]], manifest: dict[str, object]) -> str:
    html = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Release Trust Freeze Command Center</title>
            <style>
              :root {
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F8;
                --inset: #F4F6FB;
                --text-strong: #0F172A;
                --text-default: #1E293B;
                --text-muted: #667085;
                --border-subtle: #E2E8F0;
                --freeze: #3559E6;
                --trust: #0EA5A4;
                --verdict: #7C3AED;
                --caution: #C98900;
                --blocked: #C24141;
                --shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
              }

              * { box-sizing: border-box; }
              body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                color: var(--text-default);
                background:
                  radial-gradient(circle at top left, rgba(53, 89, 230, 0.08), transparent 28%),
                  radial-gradient(circle at top right, rgba(14, 165, 164, 0.08), transparent 22%),
                  var(--canvas);
              }

              body[data-reduced-motion="true"] * { transition: none !important; }

              .shell {
                max-width: 1520px;
                margin: 0 auto;
                padding: 24px;
                display: grid;
                gap: 20px;
              }

              .masthead {
                min-height: 72px;
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: 24px;
                box-shadow: var(--shadow);
                padding: 18px 24px;
                display: grid;
                gap: 14px;
              }

              .brand-row, .metric-strip, .workspace {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                flex-wrap: wrap;
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }

              .monogram {
                width: 42px;
                height: 42px;
                border-radius: 14px;
                background: linear-gradient(145deg, rgba(53, 89, 230, 0.16), rgba(124, 58, 237, 0.16));
                display: grid;
                place-items: center;
                border: 1px solid rgba(53, 89, 230, 0.18);
              }

              .brand h1 {
                margin: 0;
                font-size: 1.15rem;
                color: var(--text-strong);
              }

              .brand p {
                margin: 2px 0 0;
                color: var(--text-muted);
                font-size: 0.92rem;
              }

              .metric-strip { gap: 12px; }

              .metric {
                min-width: 152px;
                padding: 12px 14px;
                border-radius: 18px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
              }

              .metric span {
                display: block;
                color: var(--text-muted);
                font-size: 0.78rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }

              .metric strong {
                display: block;
                margin-top: 6px;
                font-size: 1.3rem;
                color: var(--text-strong);
              }

              .workspace {
                align-items: stretch;
              }

              .left-rail, .inspector, .panel {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: 24px;
                box-shadow: var(--shadow);
              }

              .workspace {
                display: grid;
                grid-template-columns: 308px minmax(0, 1fr) 410px;
                gap: 20px;
              }

              .left-rail {
                padding: 20px;
                display: grid;
                gap: 16px;
                align-content: start;
                min-width: 0;
              }

              .rail-heading h2,
              .panel h2,
              .inspector h2 {
                margin: 0;
                color: var(--text-strong);
                font-size: 1rem;
              }

              .rail-heading p,
              .panel p,
              .inspector p {
                margin: 6px 0 0;
                color: var(--text-muted);
                line-height: 1.45;
              }

              .filters {
                display: grid;
                gap: 12px;
              }

              label {
                display: grid;
                gap: 8px;
                font-size: 0.86rem;
                color: var(--text-muted);
              }

              select {
                height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-subtle);
                background: var(--inset);
                color: var(--text-strong);
                padding: 0 14px;
              }

              .main-column {
                display: grid;
                gap: 20px;
                min-width: 0;
                position: relative;
                z-index: 1;
              }

              .panel {
                padding: 18px;
                display: grid;
                gap: 14px;
              }

              .verdict-rail {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 12px;
              }

              .card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 14px;
                min-height: 240px;
              }

              .card, .verdict-card {
                min-height: 172px;
                border-radius: 20px;
                border: 1px solid var(--border-subtle);
                background: linear-gradient(180deg, rgba(244, 246, 251, 0.85), rgba(255,255,255,0.98));
                padding: 16px;
                text-align: left;
                cursor: pointer;
                transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }

              .card:hover, .card:focus-visible, .verdict-card:hover, .verdict-card:focus-visible {
                transform: translateY(-1px);
                border-color: rgba(53, 89, 230, 0.35);
                box-shadow: 0 16px 28px rgba(15, 23, 42, 0.12);
                outline: none;
              }

              .card[data-selected="true"],
              .verdict-card[data-selected="true"] {
                border-color: rgba(124, 58, 237, 0.36);
                box-shadow: 0 18px 30px rgba(124, 58, 237, 0.12);
              }

              .eyebrow {
                font-size: 0.74rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--text-muted);
              }

              .state-chip {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 5px 10px;
                font-size: 0.76rem;
                font-weight: 600;
                background: rgba(124, 58, 237, 0.08);
                color: var(--verdict);
              }

              .state-chip.live { background: rgba(53, 89, 230, 0.1); color: var(--freeze); }
              .state-chip.diagnostic_only { background: rgba(201, 137, 0, 0.12); color: var(--caution); }
              .state-chip.recovery_only { background: rgba(14, 165, 164, 0.14); color: var(--trust); }
              .state-chip.blocked { background: rgba(194, 65, 65, 0.12); color: var(--blocked); }

              .matrix-table, .detail-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.89rem;
              }

              .matrix-table th,
              .matrix-table td,
              .detail-table th,
              .detail-table td {
                padding: 11px 10px;
                border-bottom: 1px solid var(--border-subtle);
                vertical-align: top;
              }

              .matrix-table th, .detail-table th {
                text-align: left;
                color: var(--text-muted);
                font-size: 0.76rem;
                letter-spacing: 0.06em;
                text-transform: uppercase;
              }

              .matrix-table tr[data-selected="true"],
              .detail-table tr[data-selected="true"] {
                background: rgba(124, 58, 237, 0.05);
              }

              .mono {
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 0.83rem;
              }

              .inspector {
                padding: 20px;
                display: grid;
                gap: 14px;
                align-content: start;
                min-width: 0;
                position: relative;
                z-index: 0;
              }

              .inspector-block {
                padding: 14px;
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                border-radius: 18px;
              }

              .lower-region {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
                gap: 20px;
              }

              .parity {
                font-size: 0.84rem;
                color: var(--text-muted);
              }

              @media (max-width: 1200px) {
                .workspace {
                  grid-template-columns: 1fr;
                }
              }

              @media (max-width: 800px) {
                .lower-region {
                  grid-template-columns: 1fr;
                }

                .shell {
                  padding: 14px;
                }
              }
            </style>
          </head>
          <body>
            <div class="shell">
              <header class="masthead">
                <div class="brand-row">
                  <div class="brand">
                    <div class="monogram" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3 15V3h6.4c2.4 0 4 1.4 4 3.4 0 1.8-1.1 3-2.8 3.3L15 15h-2.8l-4.1-5H5.4v5H3Zm2.4-7h3.5c1.3 0 2.1-.6 2.1-1.6 0-1.1-.8-1.7-2.1-1.7H5.4V8Z" fill="#3559E6"/>
                      </svg>
                    </div>
                    <div>
                      <h1>Vecells Release Trust Command Center</h1>
                      <p>Premium release-control instrument for freeze tuples, slice trust, and one published authority verdict.</p>
                    </div>
                  </div>
                  <div class="parity" data-testid="masthead-parity"></div>
                </div>
                <div class="metric-strip" data-testid="masthead-metrics"></div>
              </header>

              <div class="workspace">
                <aside class="left-rail" aria-label="Filters and release verdict scopes">
                  <div class="rail-heading">
                    <h2>Filter Rail</h2>
                    <p>Filter by verdict, trust posture, audience surface, and channel family.</p>
                  </div>
                  <div class="filters">
                    <label>
                      Verdict state
                      <select data-testid="verdict-filter" id="verdict-filter"></select>
                    </label>
                    <label>
                      Trust state
                      <select data-testid="trust-filter" id="trust-filter"></select>
                    </label>
                    <label>
                      Audience surface
                      <select data-testid="surface-filter" id="surface-filter"></select>
                    </label>
                    <label>
                      Channel family
                      <select data-testid="channel-filter" id="channel-filter"></select>
                    </label>
                  </div>
                  <div class="inspector-block">
                    <strong class="eyebrow">Visible parity</strong>
                    <p data-testid="filter-parity" class="parity"></p>
                  </div>
                </aside>

                <main class="main-column">
                  <section class="panel">
                    <div>
                      <h2>Verdict Rail</h2>
                      <p>All live-authority decisions are rendered as published verdict cards. Selection governs the tuple stack, trust matrix, linkage table, and inspector.</p>
                    </div>
                    <div class="parity" data-testid="verdict-rail-parity"></div>
                    <div class="verdict-rail" data-testid="verdict-rail"></div>
                  </section>

                  <section class="panel">
                    <div>
                      <h2>Release Tuple Stack</h2>
                      <p>Each tuple card binds the reviewed package, standards watchlist, approval freeze, and final verdict state for one audience surface and route family.</p>
                    </div>
                    <div class="card-grid" data-testid="tuple-stack"></div>
                  </section>

                  <section class="panel">
                    <div>
                      <h2>Slice Trust Matrix</h2>
                      <p>Every row is one required assurance slice. Diagnostic and blocked posture stay visible at row level instead of collapsing into one platform boolean.</p>
                    </div>
                    <div class="parity" data-testid="trust-matrix-parity"></div>
                    <table class="matrix-table" data-testid="trust-matrix">
                      <thead>
                        <tr>
                          <th>Scenario</th>
                          <th>Slice</th>
                          <th>Trust</th>
                          <th>Completeness</th>
                          <th>Lower bound</th>
                          <th>Freshness</th>
                        </tr>
                      </thead>
                      <tbody data-testid="trust-matrix-body"></tbody>
                    </table>
                  </section>

                  <div class="lower-region">
                    <section class="panel">
                      <div>
                        <h2>Standards and Linkage</h2>
                        <p>The lower table keeps the reviewed package, watchlist state, and freeze state visible beside the verdict so drift stays explicit.</p>
                      </div>
                      <table class="detail-table" data-testid="watchlist-linkage-table">
                        <thead>
                          <tr>
                            <th>Scenario</th>
                            <th>Review package</th>
                            <th>Watchlist</th>
                            <th>Freeze</th>
                            <th>Verdict</th>
                          </tr>
                        </thead>
                        <tbody data-testid="watchlist-linkage-body"></tbody>
                      </table>
                    </section>

                    <section class="panel">
                      <div>
                        <h2>Validator Table</h2>
                        <p>Validator rows show why the scenario stayed live, diagnostic, recovery-only, or blocked.</p>
                      </div>
                      <table class="detail-table" data-testid="validator-table">
                        <thead>
                          <tr>
                            <th>Validator</th>
                            <th>Status</th>
                            <th>Detail</th>
                          </tr>
                        </thead>
                        <tbody data-testid="validator-body"></tbody>
                      </table>
                    </section>
                  </div>
                </main>

                <aside class="inspector" data-testid="inspector" aria-live="polite"></aside>
              </div>
            </div>

            <script id="casebook-data" type="application/json">__CASEBOOK__</script>
            <script id="matrix-data" type="application/json">__MATRIX__</script>
            <script id="manifest-data" type="application/json">__MANIFEST__</script>
            <script>
              const casebook = JSON.parse(document.getElementById("casebook-data").textContent);
              const matrixRows = JSON.parse(document.getElementById("matrix-data").textContent);
              const manifest = JSON.parse(document.getElementById("manifest-data").textContent);
              const cases = casebook.cases;

              const state = {
                verdict: "all",
                trust: "all",
                surface: "all",
                channel: "all",
                selectedScenarioId: cases[0]?.scenarioId ?? null,
              };

              const verdictFilter = document.getElementById("verdict-filter");
              const trustFilter = document.getElementById("trust-filter");
              const surfaceFilter = document.getElementById("surface-filter");
              const channelFilter = document.getElementById("channel-filter");
              const verdictRail = document.querySelector("[data-testid='verdict-rail']");
              const tupleStack = document.querySelector("[data-testid='tuple-stack']");
              const trustMatrixBody = document.querySelector("[data-testid='trust-matrix-body']");
              const linkageBody = document.querySelector("[data-testid='watchlist-linkage-body']");
              const validatorBody = document.querySelector("[data-testid='validator-body']");
              const inspector = document.querySelector("[data-testid='inspector']");
              const mastheadMetrics = document.querySelector("[data-testid='masthead-metrics']");
              const mastheadParity = document.querySelector("[data-testid='masthead-parity']");
              const verdictRailParity = document.querySelector("[data-testid='verdict-rail-parity']");
              const trustMatrixParity = document.querySelector("[data-testid='trust-matrix-parity']");
              const filterParity = document.querySelector("[data-testid='filter-parity']");

              document.body.dataset.reducedMotion = String(
                window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
              );

              function toOptionValues(values) {
                return ["all", ...Array.from(new Set(values)).sort()];
              }

              function buildSelect(select, values) {
                select.innerHTML = "";
                values.forEach((value) => {
                  const option = document.createElement("option");
                  option.value = value;
                  option.textContent = value === "all" ? "All" : value;
                  select.appendChild(option);
                });
              }

              function visibleCases() {
                return cases.filter((entry) => {
                  if (state.verdict !== "all" && entry.verdict.surfaceAuthorityState !== state.verdict) return false;
                  if (state.surface !== "all" && entry.audienceSurface !== state.surface) return false;
                  if (state.channel !== "all" && entry.channelFamily !== state.channel) return false;
                  if (
                    state.trust !== "all" &&
                    !entry.assuranceSlices.some((slice) => slice.trustState === state.trust)
                  ) return false;
                  return true;
                });
              }

              function selectedCase(visible) {
                if (!visible.some((entry) => entry.scenarioId === state.selectedScenarioId)) {
                  state.selectedScenarioId = visible[0]?.scenarioId ?? null;
                }
                return visible.find((entry) => entry.scenarioId === state.selectedScenarioId) ?? null;
              }

              function metricCard(label, value) {
                return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
              }

              function renderMasthead() {
                mastheadMetrics.innerHTML = [
                  metricCard("Live", manifest.summary.live_count),
                  metricCard("Diagnostic", manifest.summary.diagnostic_only_count),
                  metricCard("Recovery", manifest.summary.recovery_only_count),
                  metricCard("Blocked", manifest.summary.blocked_count),
                ].join("");
                mastheadParity.textContent =
                  `${manifest.summary.scenario_count} verdicts, ${manifest.summary.assurance_slice_count} trust rows, ${manifest.summary.validator_row_count} validator rows.`;
              }

              function renderVerdictRail(visible, selected) {
                verdictRailParity.textContent = `${visible.length} visible verdict cards.`;
                verdictRail.innerHTML = visible
                  .map((entry) => {
                    const selectedAttr = String(entry.scenarioId === selected?.scenarioId);
                    return `
                      <button
                        type="button"
                        class="verdict-card"
                        data-testid="verdict-card-${entry.scenarioId}"
                        data-scenario-id="${entry.scenarioId}"
                        data-selected="${selectedAttr}"
                      >
                        <div class="eyebrow">${entry.audienceSurface}</div>
                        <h3>${entry.title}</h3>
                        <p>${entry.summary}</p>
                        <span class="state-chip ${entry.verdict.surfaceAuthorityState}">${entry.verdict.surfaceAuthorityState}</span>
                      </button>
                    `;
                  })
                  .join("");
                bindSelectionNavigation(verdictRail, visible);
              }

              function renderTupleStack(visible, selected) {
                tupleStack.innerHTML = visible
                  .map((entry) => {
                    const freeze = entry.releaseApprovalFreeze;
                    return `
                      <button
                        type="button"
                        class="card"
                        data-testid="tuple-card-${entry.scenarioId}"
                        data-scenario-id="${entry.scenarioId}"
                        data-selected="${String(entry.scenarioId === selected?.scenarioId)}"
                      >
                        <div class="eyebrow">${freeze.releaseApprovalFreezeId}</div>
                        <h3>${entry.routeFamilyRef}</h3>
                        <p>${entry.channelFamily} · watchlist ${entry.standardsWatchlist.watchlistState} · freeze ${freeze.freezeState}</p>
                        <div class="mono">${freeze.reviewPackageHash}</div>
                        <p class="parity">approved by ${freeze.approvedBy} at ${freeze.approvedAt}</p>
                      </button>
                    `;
                  })
                  .join("");
                bindSelectionNavigation(tupleStack, visible);
              }

              function renderTrustMatrix(visible, selected) {
                const visibleIds = new Set(visible.map((entry) => entry.scenarioId));
                const rows = matrixRows.filter((row) => visibleIds.has(row.scenario_id));
                trustMatrixParity.textContent = `${rows.length} visible trust rows across ${visible.length} scenarios.`;
                trustMatrixBody.innerHTML = rows
                  .map((row) => `
                    <tr
                      data-testid="trust-row-${row.scenario_id}-${row.slice_namespace.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}"
                      data-selected="${String(row.scenario_id === selected?.scenarioId)}"
                    >
                      <td>${row.scenario_id}</td>
                      <td><span class="mono">${row.slice_namespace}</span></td>
                      <td>${row.trust_state}</td>
                      <td>${row.completeness_state}</td>
                      <td>${row.trust_lower_bound}</td>
                      <td>${row.freshness_score}</td>
                    </tr>
                  `)
                  .join("");
              }

              function renderLinkageTable(visible, selected) {
                linkageBody.innerHTML = visible
                  .map((entry) => `
                    <tr
                      data-testid="linkage-row-${entry.scenarioId}"
                      data-selected="${String(entry.scenarioId === selected?.scenarioId)}"
                    >
                      <td>${entry.scenarioId}</td>
                      <td class="mono">${entry.governanceReviewPackage.governanceReviewPackageId}</td>
                      <td>${entry.standardsWatchlist.watchlistState}</td>
                      <td>${entry.releaseApprovalFreeze.freezeState}</td>
                      <td>${entry.verdict.surfaceAuthorityState}</td>
                    </tr>
                  `)
                  .join("");
              }

              function renderValidatorTable(selected) {
                validatorBody.innerHTML = (selected?.validators ?? [])
                  .map((row) => `
                    <tr data-testid="validator-row-${row.validator_id}">
                      <td class="mono">${row.validator_id}</td>
                      <td>${row.status}</td>
                      <td>${row.detail}</td>
                    </tr>
                  `)
                  .join("");
              }

              function renderInspector(selected) {
                if (!selected) {
                  inspector.innerHTML = `<div class="inspector-block"><h2>No matching verdict</h2><p>Adjust filters to restore one visible release-trust scenario.</p></div>`;
                  return;
                }
                inspector.innerHTML = `
                  <div>
                    <h2>${selected.title}</h2>
                    <p>${selected.summary}</p>
                  </div>
                  <div class="inspector-block">
                    <strong class="eyebrow">Published verdict</strong>
                    <p class="mono">${selected.verdict.releaseTrustFreezeVerdictId}</p>
                    <p>${selected.verdict.surfaceAuthorityState} · calm ${selected.verdict.calmTruthState} · mutation ${selected.verdict.mutationAuthorityState}</p>
                  </div>
                  <div class="inspector-block">
                    <strong class="eyebrow">Freeze tuple</strong>
                    <p class="mono">${selected.releaseApprovalFreeze.releaseApprovalFreezeId}</p>
                    <p>${selected.releaseApprovalFreeze.releaseCandidateRef}</p>
                    <p class="mono">${selected.releaseApprovalFreeze.reviewPackageHash}</p>
                  </div>
                  <div class="inspector-block">
                    <strong class="eyebrow">Watch and parity</strong>
                    <p>${selected.verdict.releaseWatchTupleState} watch · ${selected.verdict.runtimePublicationState} publication · ${selected.verdict.releasePublicationParityState} parity</p>
                    <p>${selected.verdict.provenanceConsumptionState} provenance</p>
                  </div>
                  <div class="inspector-block">
                    <strong class="eyebrow">Blockers</strong>
                    <p>${selected.verdict.blockerRefs.length ? selected.verdict.blockerRefs.join(", ") : "None"}</p>
                  </div>
                `;
              }

              function bindSelectionNavigation(container, visible) {
                container.querySelectorAll("[data-scenario-id]").forEach((button) => {
                  button.addEventListener("click", () => {
                    state.selectedScenarioId = button.dataset.scenarioId;
                    render();
                  });
                  button.addEventListener("keydown", (event) => {
                    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                    event.preventDefault();
                    const ids = visible.map((entry) => entry.scenarioId);
                    const index = ids.indexOf(button.dataset.scenarioId);
                    const nextIndex =
                      event.key === "ArrowDown"
                        ? Math.min(ids.length - 1, index + 1)
                        : Math.max(0, index - 1);
                    state.selectedScenarioId = ids[nextIndex];
                    render();
                    const nextButton = container.querySelector(
                      `[data-scenario-id="${ids[nextIndex]}"]`,
                    );
                    nextButton?.focus();
                  });
                });
              }

              function render() {
                const visible = visibleCases();
                const selected = selectedCase(visible);
                filterParity.textContent = `${visible.length} scenarios remain visible after filtering.`;
                renderVerdictRail(visible, selected);
                renderTupleStack(visible, selected);
                renderTrustMatrix(visible, selected);
                renderLinkageTable(visible, selected);
                renderValidatorTable(selected);
                renderInspector(selected);
              }

              buildSelect(verdictFilter, toOptionValues(cases.map((entry) => entry.verdict.surfaceAuthorityState)));
              buildSelect(trustFilter, toOptionValues(matrixRows.map((row) => row.trust_state)));
              buildSelect(surfaceFilter, toOptionValues(cases.map((entry) => entry.audienceSurface)));
              buildSelect(channelFilter, toOptionValues(cases.map((entry) => entry.channelFamily)));

              verdictFilter.addEventListener("change", (event) => {
                state.verdict = event.target.value;
                render();
              });
              trustFilter.addEventListener("change", (event) => {
                state.trust = event.target.value;
                render();
              });
              surfaceFilter.addEventListener("change", (event) => {
                state.surface = event.target.value;
                render();
              });
              channelFilter.addEventListener("change", (event) => {
                state.channel = event.target.value;
                render();
              });

              renderMasthead();
              render();
            </script>
          </body>
        </html>
        """
    ).strip()
    return (
        html.replace("__CASEBOOK__", json.dumps(casebook))
        .replace("__MATRIX__", json.dumps(matrix_rows))
        .replace("__MANIFEST__", json.dumps(manifest))
    )


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(
          ROOT,
          "docs",
          "architecture",
          "75_release_trust_freeze_command_center.html",
        );
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "release_approval_freeze_manifest.json");
        const CASEBOOK_PATH = path.join(ROOT, "data", "analysis", "release_trust_freeze_casebook.json");

        const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
        const CASEBOOK = JSON.parse(fs.readFileSync(CASEBOOK_PATH, "utf8"));

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch {
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }
        }

        function startStaticServer() {
          return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
              const rawUrl = req.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/75_release_trust_freeze_command_center.html"
                  : rawUrl.split("?")[0];
              const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
              const filePath = path.join(ROOT, safePath);
              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Not found");
                return;
              }
              const body = fs.readFileSync(filePath);
              const contentType = filePath.endsWith(".html")
                ? "text/html; charset=utf-8"
                : "application/json; charset=utf-8";
              res.writeHead(200, { "Content-Type": contentType });
              res.end(body);
            });
            server.once("error", reject);
            server.listen(4375, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing command center HTML: ${HTML_PATH}`);
          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1180 } });
          const url =
            process.env.RELEASE_TRUST_COMMAND_CENTER_URL ??
            "http://127.0.0.1:4375/docs/architecture/75_release_trust_freeze_command_center.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='verdict-filter']").waitFor();
            await page.locator("[data-testid='trust-filter']").waitFor();
            await page.locator("[data-testid='surface-filter']").waitFor();
            await page.locator("[data-testid='channel-filter']").waitFor();
            await page.locator("[data-testid='verdict-rail']").waitFor();
            await page.locator("[data-testid='tuple-stack']").waitFor();
            await page.locator("[data-testid='trust-matrix']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();
            await page.locator("[data-testid='validator-table']").waitFor();

            const initialCards = await page.locator("button[data-testid^='verdict-card-']").count();
            assertCondition(
              initialCards === MANIFEST.summary.scenario_count,
              `Expected ${MANIFEST.summary.scenario_count} visible verdict cards, found ${initialCards}.`,
            );

            await page.locator("[data-testid='verdict-filter']").selectOption("diagnostic_only");
            const diagnosticCards = await page.locator("button[data-testid^='verdict-card-']").count();
            assertCondition(diagnosticCards === 1, `Expected 1 diagnostic card, found ${diagnosticCards}.`);

            await page.locator("[data-testid='verdict-filter']").selectOption("all");
            await page.locator("[data-testid='trust-filter']").selectOption("degraded");
            const degradedCards = await page.locator("button[data-testid^='verdict-card-']").count();
            assertCondition(degradedCards === 1, `Expected 1 degraded-trust card, found ${degradedCards}.`);

            await page.locator("[data-testid='trust-filter']").selectOption("all");
            await page.locator("[data-testid='surface-filter']").selectOption("patient-web");
            const patientCards = await page.locator("button[data-testid^='verdict-card-']").count();
            assertCondition(patientCards === 2, `Expected 2 patient-web cards, found ${patientCards}.`);

            await page.locator("[data-testid='surface-filter']").selectOption("all");
            await page.locator("[data-testid='channel-filter']").selectOption("embedded_webview");
            const embeddedCards = await page.locator("button[data-testid^='verdict-card-']").count();
            assertCondition(embeddedCards === 2, `Expected 2 embedded-webview cards, found ${embeddedCards}.`);

            await page.locator("[data-testid='channel-filter']").selectOption("all");
            const recoveryCard = page.locator(
              "[data-testid='verdict-card-recovery_only_parity_or_provenance_drift']",
            );
            await recoveryCard.click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("recovery_only_parity_or_provenance_drift") &&
                inspectorText.includes("BLOCKER_RELEASE_PARITY_NOT_EXACT"),
              "Inspector lost selection synchronization for the parity-drift scenario.",
            );
            const tupleSelected = await page
              .locator("[data-testid='tuple-card-recovery_only_parity_or_provenance_drift']")
              .getAttribute("data-selected");
            assertCondition(tupleSelected === "true", "Tuple stack did not synchronize to the selected verdict.");
            const linkageSelected = await page
              .locator("[data-testid='linkage-row-recovery_only_parity_or_provenance_drift']")
              .getAttribute("data-selected");
            assertCondition(linkageSelected === "true", "Linkage table did not synchronize to the selected verdict.");

            const trustMatrixParity = await page.locator("[data-testid='trust-matrix-parity']").textContent();
            assertCondition(
              trustMatrixParity.includes("12 visible trust rows"),
              "Trust matrix parity text drifted from the frozen casebook.",
            );
            assertCondition(CASEBOOK.summary.case_count === 6, "Casebook summary drifted from par_075.");

            const firstCard = page.locator("[data-testid='verdict-card-live_exact_parity_trusted_slices']");
            await firstCard.focus();
            await page.keyboard.press("ArrowDown");
            const secondSelected = await page
              .locator("[data-testid='verdict-card-diagnostic_only_degraded_slice']")
              .getAttribute("data-selected");
            assertCondition(secondSelected === "true", "ArrowDown did not advance to the next verdict card.");

            await page.setViewportSize({ width: 390, height: 844 });
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}.`);
          } finally {
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }
        }

        if (process.argv.includes("--run")) {
          run().catch((error) => {
            console.error(error);
            process.exitCode = 1;
          });
        }

        export const releaseTrustFreezeCommandCenterManifest = {
          task: MANIFEST.task_id,
          scenarios: MANIFEST.summary.scenario_count,
          coverage: [
            "verdict and trust filtering",
            "selection synchronization",
            "chart and table parity",
            "keyboard navigation",
            "reduced motion",
            "responsive layout",
            "accessibility smoke checks",
          ],
        };
        """
    ).strip()


def patch_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    scripts = package["scripts"]
    if "python3 ./tools/analysis/build_release_trust_models.py" not in scripts["codegen"]:
        scripts["codegen"] = scripts["codegen"].replace(
            "&& pnpm format",
            "&& python3 ./tools/analysis/build_release_trust_models.py && pnpm format",
        )
    scripts["validate:release-trust"] = "python3 ./tools/analysis/validate_release_trust_models.py"
    for script_name in ("bootstrap", "check"):
        if "pnpm validate:release-trust" not in scripts[script_name]:
            scripts[script_name] = scripts[script_name].replace(
                "pnpm validate:evidence-backbone",
                "pnpm validate:release-trust && pnpm validate:evidence-backbone",
            )
    write_json_file(ROOT_PACKAGE_PATH, package)


def patch_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    scripts = package["scripts"]
    step_map = {
        "build": "node --check release-trust-freeze-command-center.spec.js",
        "lint": "eslint release-trust-freeze-command-center.spec.js",
        "test": "node release-trust-freeze-command-center.spec.js",
        "typecheck": "node --check release-trust-freeze-command-center.spec.js",
        "e2e": "node release-trust-freeze-command-center.spec.js --run",
    }
    for key, step in step_map.items():
        scripts[key] = append_script_step(scripts[key], step)
    description = package.get("description", "")
    if "release-trust-freeze" not in description:
        package["description"] = (
            description.rstrip(".")
            + ", release-trust-freeze command-center browser checks."
        ).strip(", ")
    write_json_file(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_service_package() -> None:
    package = read_json(SERVICE_PACKAGE_PATH)
    package.setdefault("dependencies", {})["@vecells/domain-analytics-assurance"] = "workspace:*"
    write_json_file(SERVICE_PACKAGE_PATH, package)


def patch_domain_indexes() -> None:
    analytics_index = ANALYTICS_INDEX_PATH.read_text(encoding="utf-8")
    analytics_export = 'export * from "./assurance-slice-trust-backbone";'
    if analytics_export not in analytics_index:
        analytics_index = analytics_index.rstrip() + "\n" + analytics_export + "\n"
        write_text(ANALYTICS_INDEX_PATH, analytics_index)

    identity_index = IDENTITY_INDEX_PATH.read_text(encoding="utf-8")
    identity_export = 'export * from "./release-trust-freeze-backbone";'
    if identity_export not in identity_index:
        identity_index = identity_index.replace(
            'export * from "./command-settlement-backbone";',
            'export * from "./command-settlement-backbone";\n' + identity_export,
        )
        write_text(IDENTITY_INDEX_PATH, identity_index)


def patch_release_controls_source() -> None:
    source = RELEASE_CONTROLS_SOURCE_PATH.read_text(encoding="utf-8")
    start = "// par_075_release_trust_contracts:start"
    end = "// par_075_release_trust_contracts:end"
    if start in source and end in source:
        prefix, _rest = source.split(start, 1)
        _old, suffix = _rest.split(end, 1)
        source = prefix + RELEASE_CONTROLS_BLOCK + suffix
    elif start not in source:
        anchor_candidates = [
            (
                "export type ReleasePosture =\n"
                "  (typeof foundationReleasePosture)[keyof typeof foundationReleasePosture];"
            ),
            "export type ReleasePosture = (typeof foundationReleasePosture)[keyof typeof foundationReleasePosture];",
            "        export type ReleasePosture = (typeof foundationReleasePosture)[keyof typeof foundationReleasePosture];",
        ]
        for anchor in anchor_candidates:
            if anchor in source:
                source = source.replace(anchor, anchor + "\n\n" + RELEASE_CONTROLS_BLOCK, 1)
                break
        else:
            raise RuntimeError("release-controls source anchor drifted for par_075 patch.")
    write_text(RELEASE_CONTROLS_SOURCE_PATH, source)


def patch_release_controls_test() -> None:
    source = RELEASE_CONTROLS_TEST_PATH.read_text(encoding="utf-8")
    import_block = (
        "import {\n"
        "  bootstrapSharedPackage,\n"
        "  createProjectionRebuildSimulationHarness,\n"
        "  isLiveReleaseTrustVerdict,\n"
        "  ownedContractFamilies,\n"
        "  ownedObjectFamilies,\n"
        "  packageContract,\n"
        "  releaseTrustAllowsCalmTruth,\n"
        "  releaseTrustAllowsMutation,\n"
        "} from \"../src/index.ts\";"
    )
    if (
        "isLiveReleaseTrustVerdict," not in source
        or "createProjectionRebuildSimulationHarness," not in source
    ):
        source, replacements = re.subn(
            r'^\s*import \{\n(?:\s+[^\n]+,\n)+\s*\} from "\.\./src/index\.ts";',
            import_block,
            source,
            count=1,
            flags=re.MULTILINE,
        )
        if replacements == 0:
            raise RuntimeError("release-controls test import anchor drifted for par_075 patch.")
    if "expect(isLiveReleaseTrustVerdict({ surfaceAuthorityState: \"live\" })).toBe(true);" not in source:
        source, replacements = re.subn(
            r"(^\s*expect\(Array\.isArray\(observabilitySignalFamilies\)\)\.toBe\(true\);\n)",
            "\\1"
            "    expect(isLiveReleaseTrustVerdict({ surfaceAuthorityState: \"live\" })).toBe(true);\n"
            "    expect(\n"
            "      releaseTrustAllowsCalmTruth({\n"
            "        surfaceAuthorityState: \"live\",\n"
            "        calmTruthState: \"allowed\",\n"
            "      }),\n"
            "    ).toBe(true);\n"
            "    expect(\n"
            "      releaseTrustAllowsMutation({\n"
            "        surfaceAuthorityState: \"live\",\n"
            "        mutationAuthorityState: \"enabled\",\n"
            "      }),\n"
            "    ).toBe(true);\n",
            source,
            count=1,
            flags=re.MULTILINE,
        )
        if replacements == 0:
            raise RuntimeError("release-controls test assertion anchor drifted for par_075 patch.")
    if "runs the projection rebuild simulation harness" not in source:
        source, replacements = re.subn(
            r"\n\s*\}\);\s*$",
            "\n\n"
            "  it(\"runs the projection rebuild simulation harness\", () => {\n"
            "    const harness = createProjectionRebuildSimulationHarness();\n"
            "    expect(harness.eventStream.length).toBeGreaterThan(0);\n"
            "    expect(typeof harness.worker.run).toBe(\"function\");\n"
            "  });\n"
            "});\n",
            source,
            count=1,
        )
        if replacements == 0:
            raise RuntimeError("release-controls test closing anchor drifted for par_075 patch.")
    write_text(RELEASE_CONTROLS_TEST_PATH, source)


def main() -> None:
    cases = build_cases()
    manifest = build_manifest(cases)
    matrix_rows = build_matrix_rows(cases)
    casebook = build_casebook(cases, manifest)

    write_json(MANIFEST_PATH, manifest)
    write_csv(MATRIX_PATH, matrix_rows)
    write_json(CASEBOOK_PATH, casebook)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest))
    write_text(RULES_DOC_PATH, build_rules_doc())
    write_text(COMMAND_CENTER_PATH, build_html(casebook, matrix_rows, manifest))
    write_text(SPEC_PATH, build_spec())

    patch_root_package()
    patch_playwright_package()
    patch_service_package()
    patch_domain_indexes()
    patch_release_controls_source()
    patch_release_controls_test()

    print(
        "par_075 release-trust artifacts generated: "
        f"{manifest['summary']['scenario_count']} scenarios, "
        f"{manifest['summary']['assurance_slice_count']} trust rows, "
        f"{manifest['summary']['validator_row_count']} validator rows."
    )


if __name__ == "__main__":
    main()
