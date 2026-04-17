#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
TESTS_DIR = ROOT / "tests" / "playwright"
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

SEED_PARITY_RULES_PATH = DATA_DIR / "release_publication_parity_rules.json"
RUNTIME_PUBLICATION_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_CATALOG_PATH = DATA_DIR / "release_publication_parity_records.json"

WATCH_TUPLE_SCHEMA_PATH = DATA_DIR / "release_watch_tuple_schema.json"
POLICY_SCHEMA_PATH = DATA_DIR / "wave_observation_policy_schema.json"
PROBE_CATALOG_PATH = DATA_DIR / "wave_observation_probe_catalog.json"
ROLLBACK_TRIGGER_MATRIX_PATH = DATA_DIR / "rollback_trigger_matrix.csv"
PIPELINE_CATALOG_PATH = DATA_DIR / "release_watch_pipeline_catalog.json"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
WORKFLOW_CI_PATH = WORKFLOWS_DIR / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = WORKFLOWS_DIR / "nonprod-provenance-promotion.yml"

TASK_ID = "par_097"
VISUAL_MODE = "Release_Watch_Pipeline_Cockpit"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

MISSION = (
    "Publish one authoritative release-watch pipeline that proves the active wave step, its "
    "observation contract, tuple drift posture, rollback trigger state, and action eligibility "
    "without reconstructing rollout authority from dashboards or operator memory."
)

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_097_RELEASE_WATCH_EVIDENCE_COCKPIT",
        "title": "Richer watch evidence cockpit layers later",
        "bounded_seam": (
            "par_097 publishes the authoritative tuple, policy, observation window, and rollback "
            "trigger engine now. A later shell-facing cockpit may extend presentation and handoff "
            "state without changing tuple hashes or observation semantics."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT",
        "title": "Operational readiness snapshots remain a later hardening lane",
        "bounded_seam": (
            "The policy and window records bind explicit readiness placeholder refs now so later "
            "readiness objects can attach without rewriting the release-watch contract."
        ),
    },
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_WAVE_POLICY_MINIMUM_SAMPLE_COUNT",
        "summary": "Wave policies default to three observed samples when no stronger threshold is yet published.",
    },
    {
        "gapId": "GAP_RESOLUTION_WAVE_POLICY_PROBE_STALENESS_BUDGET",
        "summary": "Probe readings default to a 20 minute freshness budget unless a probe definition tightens it.",
    },
]

SOURCE_PRECEDENCE = [
    "prompt/097.md",
    "prompt/shared_operating_contract_096_to_105.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveGuardrailSnapshot",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#Release pipeline and watch tuple law",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/phase-0-the-foundation-protocol.md#1.24C ReleaseWatchEvidenceCockpit",
    "blueprint/phase-0-the-foundation-protocol.md#1.25 ChannelReleaseFreezeRecord",
    "blueprint/phase-0-the-foundation-protocol.md#1.26 AssuranceSliceTrustRecord",
    "blueprint/platform-admin-and-config-blueprint.md#Guarded promotion, rollback, and kill-switch expectations",
    "blueprint/operations-console-frontend-blueprint.md#Watch-surface expectations",
    "blueprint/governance-admin-console-frontend-blueprint.md#Release-watch and rollback posture",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def stable_stringify(value: Any) -> str:
    if value is None or not isinstance(value, (dict, list)):
        return json.dumps(value, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(stable_stringify(entry) for entry in value) + "]"
    entries = sorted(value.items(), key=lambda item: item[0])
    return "{" + ",".join(
        f"{json.dumps(key, separators=(',', ':'))}:{stable_stringify(entry)}"
        for key, entry in entries
    ) + "}"


def fnv64(value: str, seed: int) -> str:
    hash_value = seed
    for char in value:
        hash_value ^= ord(char)
        hash_value = (hash_value * 1099511628211) & 0xFFFFFFFFFFFFFFFF
    return format(hash_value, "016x")


def stable_hash(value: Any) -> str:
    encoded = stable_stringify(value)
    return "".join(
        [
            fnv64(encoded, 1469598103934665603),
            fnv64(f"{encoded}::vecells", 1099511628211),
            fnv64(encoded[::-1], 7809847782465536322),
            fnv64(f"sig::{len(encoded)}", 11400714785074694791),
        ]
    )


def unique_sorted(values: list[str]) -> list[str]:
    return sorted(dict.fromkeys(values))


def build_schemas() -> tuple[dict[str, Any], dict[str, Any]]:
    tuple_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/release_watch_tuple_schema.json",
        "title": "ReleaseWatchTuple",
        "type": "object",
        "required": [
            "releaseWatchTupleId",
            "releaseRef",
            "promotionIntentRef",
            "approvalEvidenceBundleRef",
            "baselineTupleHash",
            "approvalTupleHash",
            "releaseApprovalFreezeRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "waveRef",
            "waveEligibilitySnapshotRef",
            "waveGuardrailSnapshotRef",
            "waveObservationPolicyRef",
            "waveControlFenceRef",
            "tenantScopeMode",
            "tenantScopeRef",
            "affectedTenantCount",
            "affectedOrganisationCount",
            "tenantScopeTupleHash",
            "requiredAssuranceSliceRefs",
            "releaseTrustFreezeVerdictRefs",
            "requiredContinuityControlRefs",
            "continuityEvidenceDigestRefs",
            "activeChannelFreezeRefs",
            "recoveryDispositionRefs",
            "watchTupleHash",
            "tupleState",
            "supersededByReleaseWatchTupleRef",
            "staleReasonRefs",
            "publishedAt",
            "closedAt",
            "source_refs",
        ],
        "properties": {
            "releaseWatchTupleId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "promotionIntentRef": {"type": "string"},
            "approvalEvidenceBundleRef": {"type": "string"},
            "baselineTupleHash": {"type": "string"},
            "approvalTupleHash": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "waveRef": {"type": "string"},
            "waveEligibilitySnapshotRef": {"type": "string"},
            "waveGuardrailSnapshotRef": {"type": "string"},
            "waveObservationPolicyRef": {"type": "string"},
            "waveControlFenceRef": {"type": "string"},
            "tenantScopeMode": {"type": "string"},
            "tenantScopeRef": {"type": "string"},
            "affectedTenantCount": {"type": "integer", "minimum": 0},
            "affectedOrganisationCount": {"type": "integer", "minimum": 0},
            "tenantScopeTupleHash": {"type": "string"},
            "requiredAssuranceSliceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "releaseTrustFreezeVerdictRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "requiredContinuityControlRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "continuityEvidenceDigestRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "activeChannelFreezeRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "recoveryDispositionRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "watchTupleHash": {"type": "string"},
            "tupleState": {
                "type": "string",
                "enum": ["proposed", "active", "stale", "superseded", "closed"],
            },
            "supersededByReleaseWatchTupleRef": {"type": ["string", "null"]},
            "staleReasonRefs": {"type": "array", "items": {"type": "string"}},
            "publishedAt": {"type": "string"},
            "closedAt": {"type": ["string", "null"]},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }
    policy_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/wave_observation_policy_schema.json",
        "title": "WaveObservationPolicy",
        "type": "object",
        "required": [
            "waveObservationPolicyId",
            "releaseRef",
            "waveRef",
            "promotionIntentRef",
            "releaseApprovalFreezeRef",
            "waveEligibilitySnapshotRef",
            "watchTupleHash",
            "minimumDwellDuration",
            "minimumObservationSamples",
            "requiredProbeRefs",
            "requiredContinuityControlRefs",
            "requiredContinuityEvidenceDigestRefs",
            "requiredPublicationParityState",
            "requiredRoutePostureState",
            "requiredProvenanceState",
            "stabilizationCriteriaRef",
            "rollbackTriggerRefs",
            "policyHash",
            "policyState",
            "supersededByWaveObservationPolicyRef",
            "gapResolutionRefs",
            "operationalReadinessSnapshotRef",
            "publishedAt",
            "source_refs",
        ],
        "properties": {
            "waveObservationPolicyId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "waveRef": {"type": "string"},
            "promotionIntentRef": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "waveEligibilitySnapshotRef": {"type": "string"},
            "watchTupleHash": {"type": "string"},
            "minimumDwellDuration": {"type": "string"},
            "minimumObservationSamples": {"type": "integer", "minimum": 1},
            "requiredProbeRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "requiredContinuityControlRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "requiredContinuityEvidenceDigestRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "requiredPublicationParityState": {"type": "string", "enum": ["exact"]},
            "requiredRoutePostureState": {
                "type": "string",
                "enum": ["converged", "constrained", "rollback_required", "freeze_conflict"],
            },
            "requiredProvenanceState": {
                "type": "string",
                "enum": ["verified", "quarantined", "revoked", "superseded", "drifted"],
            },
            "stabilizationCriteriaRef": {"type": "string"},
            "rollbackTriggerRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "policyHash": {"type": "string"},
            "policyState": {"type": "string", "enum": ["armed", "satisfied", "blocked", "superseded"]},
            "supersededByWaveObservationPolicyRef": {"type": ["string", "null"]},
            "gapResolutionRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "operationalReadinessSnapshotRef": {"type": ["string", "null"]},
            "publishedAt": {"type": "string"},
            "source_refs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }
    return tuple_schema, policy_schema


def build_probe_catalog() -> dict[str, dict[str, Any]]:
    return {
        "probe.local.contract-smoke": {
            "probeRef": "probe.local.contract-smoke",
            "probeClass": "synthetic_user_journey",
            "label": "Local contract smoke",
            "description": "Checks one critical local journey before the tuple can close.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
                "prompt/097.md",
            ],
        },
        "probe.local.parity-refresh": {
            "probeRef": "probe.local.parity-refresh",
            "probeClass": "publication_parity",
            "label": "Local parity refresh",
            "description": "Confirms the active runtime publication bundle and parity verdict still align.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
                "prompt/097.md",
            ],
        },
        "probe.preview.browser-regression": {
            "probeRef": "probe.preview.browser-regression",
            "probeClass": "synthetic_user_journey",
            "label": "Preview browser regression",
            "description": "Exercises the preview browser shell against the published tuple.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": ["prompt/097.md"],
        },
        "probe.preview.callback-replay": {
            "probeRef": "probe.preview.callback-replay",
            "probeClass": "continuity_evidence",
            "label": "Preview callback replay",
            "description": "Checks continuity-sensitive callback and replay evidence before widen or resume.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "warning",
            "source_refs": ["prompt/097.md"],
        },
        "probe.preview.parity-refresh": {
            "probeRef": "probe.preview.parity-refresh",
            "probeClass": "publication_parity",
            "label": "Preview parity refresh",
            "description": "Re-validates parity for the preview tuple.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": ["prompt/097.md"],
        },
        "probe.integration.browser-e2e": {
            "probeRef": "probe.integration.browser-e2e",
            "probeClass": "synthetic_user_journey",
            "label": "Integration browser end-to-end",
            "description": "Exercises one critical integration path on the currently published tuple.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": ["prompt/097.md"],
        },
        "probe.integration.callback-replay": {
            "probeRef": "probe.integration.callback-replay",
            "probeClass": "continuity_evidence",
            "label": "Integration callback replay",
            "description": "Checks replay-safe callback continuity before any wave step advances.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "warning",
            "source_refs": ["prompt/097.md"],
        },
        "probe.integration.projection-freshness": {
            "probeRef": "probe.integration.projection-freshness",
            "probeClass": "route_recovery_posture",
            "label": "Integration projection freshness",
            "description": "Confirms the read-path posture remains converged for the current route family set.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "warning",
            "source_refs": ["prompt/097.md"],
        },
        "probe.preprod.security-suite": {
            "probeRef": "probe.preprod.security-suite",
            "probeClass": "synthetic_user_journey",
            "label": "Preprod security suite",
            "description": "Executes the high-signal preprod security and smoke suite for the active tuple.",
            "staleAfterMinutes": 15,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": ["prompt/097.md"],
        },
        "probe.preprod.readiness-snapshot": {
            "probeRef": "probe.preprod.readiness-snapshot",
            "probeClass": "route_recovery_posture",
            "label": "Preprod readiness snapshot",
            "description": "Checks the current readiness snapshot placeholder and recovery posture binding.",
            "staleAfterMinutes": 15,
            "requiredForSatisfaction": True,
            "failureSeverity": "warning",
            "source_refs": ["prompt/097.md"],
        },
        "probe.preprod.parity-refresh": {
            "probeRef": "probe.preprod.parity-refresh",
            "probeClass": "publication_parity",
            "label": "Preprod parity refresh",
            "description": "Re-validates preprod publication parity against the active tuple.",
            "staleAfterMinutes": 15,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": ["prompt/097.md"],
        },
        "probe.shared.provenance-verification": {
            "probeRef": "probe.shared.provenance-verification",
            "probeClass": "provenance_verification",
            "label": "Shared provenance verification",
            "description": "Checks build provenance state for the bound runtime publication bundle.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "critical",
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
                "prompt/097.md",
            ],
        },
        "probe.shared.assurance-slice-trust": {
            "probeRef": "probe.shared.assurance-slice-trust",
            "probeClass": "assurance_slice_trust",
            "label": "Shared assurance slice trust",
            "description": "Checks the required assurance slices and live trust freeze posture for the tuple.",
            "staleAfterMinutes": 20,
            "requiredForSatisfaction": True,
            "failureSeverity": "warning",
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#1.26 AssuranceSliceTrustRecord",
                "prompt/097.md",
            ],
        },
    }


def build_watch_tuple_hash(tuple_payload: dict[str, Any]) -> str:
    return stable_hash(
        {
            "baselineTupleHash": tuple_payload["baselineTupleHash"],
            "approvalTupleHash": tuple_payload["approvalTupleHash"],
            "releaseApprovalFreezeRef": tuple_payload["releaseApprovalFreezeRef"],
            "runtimePublicationBundleRef": tuple_payload["runtimePublicationBundleRef"],
            "releasePublicationParityRef": tuple_payload["releasePublicationParityRef"],
            "waveEligibilitySnapshotRef": tuple_payload["waveEligibilitySnapshotRef"],
            "waveGuardrailSnapshotRef": tuple_payload["waveGuardrailSnapshotRef"],
            "waveObservationPolicyRef": tuple_payload["waveObservationPolicyRef"],
            "waveControlFenceRef": tuple_payload["waveControlFenceRef"],
            "tenantScopeTupleHash": tuple_payload["tenantScopeTupleHash"],
            "activeChannelFreezeRefs": unique_sorted(tuple_payload["activeChannelFreezeRefs"]),
            "recoveryDispositionRefs": unique_sorted(tuple_payload["recoveryDispositionRefs"]),
            "requiredAssuranceSliceRefs": unique_sorted(tuple_payload["requiredAssuranceSliceRefs"]),
            "releaseTrustFreezeVerdictRefs": unique_sorted(tuple_payload["releaseTrustFreezeVerdictRefs"]),
            "requiredContinuityControlRefs": unique_sorted(tuple_payload["requiredContinuityControlRefs"]),
            "continuityEvidenceDigestRefs": unique_sorted(tuple_payload["continuityEvidenceDigestRefs"]),
            "tenantScopeMode": tuple_payload["tenantScopeMode"],
            "tenantScopeRef": tuple_payload["tenantScopeRef"],
            "affectedTenantCount": tuple_payload["affectedTenantCount"],
            "affectedOrganisationCount": tuple_payload["affectedOrganisationCount"],
        }
    )


def build_policy_hash(policy_payload: dict[str, Any]) -> str:
    return stable_hash(
        {
            "releaseRef": policy_payload["releaseRef"],
            "waveRef": policy_payload["waveRef"],
            "promotionIntentRef": policy_payload["promotionIntentRef"],
            "releaseApprovalFreezeRef": policy_payload["releaseApprovalFreezeRef"],
            "waveEligibilitySnapshotRef": policy_payload["waveEligibilitySnapshotRef"],
            "watchTupleHash": policy_payload["watchTupleHash"],
            "minimumDwellDuration": policy_payload["minimumDwellDuration"],
            "minimumObservationSamples": policy_payload["minimumObservationSamples"],
            "requiredProbeRefs": unique_sorted(policy_payload["requiredProbeRefs"]),
            "requiredContinuityControlRefs": unique_sorted(policy_payload["requiredContinuityControlRefs"]),
            "requiredContinuityEvidenceDigestRefs": unique_sorted(policy_payload["requiredContinuityEvidenceDigestRefs"]),
            "requiredPublicationParityState": policy_payload["requiredPublicationParityState"],
            "requiredRoutePostureState": policy_payload["requiredRoutePostureState"],
            "requiredProvenanceState": policy_payload["requiredProvenanceState"],
            "stabilizationCriteriaRef": policy_payload["stabilizationCriteriaRef"],
            "rollbackTriggerRefs": unique_sorted(policy_payload["rollbackTriggerRefs"]),
            "gapResolutionRefs": unique_sorted(policy_payload["gapResolutionRefs"]),
            "operationalReadinessSnapshotRef": policy_payload["operationalReadinessSnapshotRef"],
        }
    )


def make_probe_reading(
    probe_ref: str,
    state: str,
    observed_at: str,
    summary: str,
    severity: str = "info",
) -> dict[str, Any]:
    return {
        "probeRef": probe_ref,
        "state": state,
        "observedAt": observed_at,
        "evidenceRefs": [f"evidence::{probe_ref.replace('.', '-')}"],
        "severity": severity,
        "summary": summary,
    }


def build_catalog() -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    seed = load_json(SEED_PARITY_RULES_PATH)
    runtime_catalog = load_json(RUNTIME_PUBLICATION_PATH)
    parity_catalog = load_json(PARITY_CATALOG_PATH)
    tuple_schema, policy_schema = build_schemas()
    probe_catalog = build_probe_catalog()

    seed_tuple_by_release = {row["releaseRef"]: row for row in seed["releaseWatchTuples"]}
    seed_policy_by_release = {row["releaseRef"]: row for row in seed["waveObservationPolicies"]}
    runtime_by_environment = {
        row["environmentRing"]: row for row in runtime_catalog["runtimePublicationBundles"]
    }
    parity_by_environment = {
        row["environmentRing"]: row for row in parity_catalog["releasePublicationParityRecords"]
    }

    scenario_specs = [
        {
            "scenarioId": "LOCAL_SATISFIED",
            "environmentRing": "local",
            "releaseRef": "RC_LOCAL_V1",
            "watchState": "satisfied",
            "tupleState": "active",
            "policyState": "satisfied",
            "observationState": "satisfied",
            "minimumObservationSamples": 3,
            "now": "2026-04-13T12:30:00.000Z",
            "observedSamples": 3,
            "routePostureState": "converged",
            "provenanceState": "verified",
            "manualRollbackApproved": False,
            "trustFreezeLive": True,
            "assuranceHardBlock": False,
            "rollbackReadinessState": "ready",
            "rollbackTriggerRefs": [
                "rollback.local.continuity-regression",
                "rollback.local.synthetic-journey",
                "rollback.local.manual-operator",
            ],
            "probeReadings": [
                make_probe_reading(
                    "probe.local.contract-smoke",
                    "passed",
                    "2026-04-13T12:18:00.000Z",
                    "Local contract smoke stayed healthy.",
                ),
                make_probe_reading(
                    "probe.local.parity-refresh",
                    "passed",
                    "2026-04-13T12:20:00.000Z",
                    "Local parity stayed exact.",
                ),
                make_probe_reading(
                    "probe.shared.provenance-verification",
                    "passed",
                    "2026-04-13T12:21:00.000Z",
                    "Build provenance remained verified.",
                ),
                make_probe_reading(
                    "probe.shared.assurance-slice-trust",
                    "passed",
                    "2026-04-13T12:22:00.000Z",
                    "Assurance slices remained live-authoritative.",
                ),
            ],
            "lineage": None,
        },
        {
            "scenarioId": "LOCAL_ACCEPTED",
            "environmentRing": "local",
            "releaseRef": "RC_LOCAL_V1",
            "watchState": "accepted",
            "tupleState": "active",
            "policyState": "armed",
            "observationState": "open",
            "minimumObservationSamples": 3,
            "now": "2026-04-13T12:06:00.000Z",
            "observedSamples": 1,
            "routePostureState": "converged",
            "provenanceState": "verified",
            "manualRollbackApproved": False,
            "trustFreezeLive": True,
            "assuranceHardBlock": False,
            "rollbackReadinessState": "constrained",
            "rollbackTriggerRefs": [
                "rollback.local.continuity-regression",
                "rollback.local.synthetic-journey",
            ],
            "probeReadings": [
                make_probe_reading(
                    "probe.local.contract-smoke",
                    "passed",
                    "2026-04-13T12:04:00.000Z",
                    "Initial local smoke passed.",
                ),
                make_probe_reading(
                    "probe.local.parity-refresh",
                    "passed",
                    "2026-04-13T12:05:00.000Z",
                    "Initial parity refresh stayed exact.",
                ),
                make_probe_reading(
                    "probe.shared.provenance-verification",
                    "passed",
                    "2026-04-13T12:05:00.000Z",
                    "Provenance check stayed verified.",
                ),
                make_probe_reading(
                    "probe.shared.assurance-slice-trust",
                    "passed",
                    "2026-04-13T12:05:00.000Z",
                    "Assurance slices remained live-authoritative.",
                ),
            ],
            "lineage": None,
        },
        {
            "scenarioId": "LOCAL_BLOCKED",
            "environmentRing": "local",
            "releaseRef": "RC_LOCAL_V1",
            "watchState": "blocked",
            "tupleState": "active",
            "policyState": "blocked",
            "observationState": "expired",
            "minimumObservationSamples": 3,
            "now": "2026-04-13T12:40:00.000Z",
            "observedSamples": 1,
            "routePostureState": "converged",
            "provenanceState": "verified",
            "manualRollbackApproved": False,
            "trustFreezeLive": True,
            "assuranceHardBlock": False,
            "rollbackReadinessState": "constrained",
            "rollbackTriggerRefs": [
                "rollback.local.continuity-regression",
                "rollback.local.manual-operator",
            ],
            "probeReadings": [
                make_probe_reading(
                    "probe.local.contract-smoke",
                    "passed",
                    "2026-04-13T12:03:00.000Z",
                    "Local smoke passed once but sample coverage stayed incomplete.",
                ),
                make_probe_reading(
                    "probe.local.parity-refresh",
                    "passed",
                    "2026-04-13T12:04:00.000Z",
                    "Parity stayed exact while dwell proof remained incomplete.",
                ),
                make_probe_reading(
                    "probe.shared.provenance-verification",
                    "passed",
                    "2026-04-13T12:04:00.000Z",
                    "Provenance remained verified.",
                ),
                make_probe_reading(
                    "probe.shared.assurance-slice-trust",
                    "passed",
                    "2026-04-13T12:04:00.000Z",
                    "Assurance slices remained live-authoritative.",
                ),
            ],
            "lineage": None,
        },
        {
            "scenarioId": "CI_PREVIEW_STALE",
            "environmentRing": "ci-preview",
            "releaseRef": "RC_CI_PREVIEW_V1",
            "watchState": "stale",
            "tupleState": "stale",
            "policyState": "armed",
            "observationState": "open",
            "minimumObservationSamples": 2,
            "now": "2026-04-13T12:30:00.000Z",
            "observedSamples": 2,
            "routePostureState": "converged",
            "provenanceState": "verified",
            "manualRollbackApproved": False,
            "trustFreezeLive": True,
            "assuranceHardBlock": False,
            "rollbackReadinessState": "stale",
            "rollbackTriggerRefs": [
                "rollback.preview.continuity-regression",
                "rollback.preview.manual-operator",
            ],
            "probeReadings": [
                make_probe_reading(
                    "probe.preview.browser-regression",
                    "passed",
                    "2026-04-13T12:20:00.000Z",
                    "Preview browser regression stayed clean.",
                ),
                make_probe_reading(
                    "probe.preview.callback-replay",
                    "passed",
                    "2026-04-13T12:21:00.000Z",
                    "Preview callback replay stayed consistent.",
                ),
                make_probe_reading(
                    "probe.preview.parity-refresh",
                    "passed",
                    "2026-04-13T12:22:00.000Z",
                    "Seeded parity refresh was green before the upstream bundle drifted stale.",
                ),
                make_probe_reading(
                    "probe.shared.provenance-verification",
                    "passed",
                    "2026-04-13T12:22:00.000Z",
                    "Build provenance stayed verified.",
                ),
                make_probe_reading(
                    "probe.shared.assurance-slice-trust",
                    "passed",
                    "2026-04-13T12:22:00.000Z",
                    "Assurance slices remained live-authoritative.",
                ),
            ],
            "lineage": {
                "predecessorTupleRef": "RWT_CI_PREVIEW_V0",
                "predecessorPolicyRef": "WOP_CI_PREVIEW_V0",
                "supersessionReasonRefs": ["SCOPE_NARROWED", "CONTINUITY_DIGEST_REFRESHED"],
            },
        },
        {
            "scenarioId": "INTEGRATION_STALE",
            "environmentRing": "integration",
            "releaseRef": "RC_INTEGRATION_V1",
            "watchState": "stale",
            "tupleState": "stale",
            "policyState": "armed",
            "observationState": "open",
            "minimumObservationSamples": 2,
            "now": "2026-04-13T12:35:00.000Z",
            "observedSamples": 2,
            "routePostureState": "converged",
            "provenanceState": "verified",
            "manualRollbackApproved": False,
            "trustFreezeLive": True,
            "assuranceHardBlock": False,
            "rollbackReadinessState": "stale",
            "rollbackTriggerRefs": [
                "rollback.integration.continuity-regression",
                "rollback.integration.manual-operator",
            ],
            "probeReadings": [
                make_probe_reading(
                    "probe.integration.browser-e2e",
                    "passed",
                    "2026-04-13T12:22:00.000Z",
                    "Integration browser journey stayed responsive.",
                ),
                make_probe_reading(
                    "probe.integration.callback-replay",
                    "passed",
                    "2026-04-13T12:23:00.000Z",
                    "Integration callback replay stayed coherent.",
                ),
                make_probe_reading(
                    "probe.integration.projection-freshness",
                    "passed",
                    "2026-04-13T12:24:00.000Z",
                    "Projection freshness stayed within budget before tuple drift.",
                ),
                make_probe_reading(
                    "probe.shared.provenance-verification",
                    "passed",
                    "2026-04-13T12:24:00.000Z",
                    "Provenance remained verified.",
                ),
                make_probe_reading(
                    "probe.shared.assurance-slice-trust",
                    "passed",
                    "2026-04-13T12:24:00.000Z",
                    "Assurance slices remained live-authoritative.",
                ),
            ],
            "lineage": None,
            "currentTupleOverride": {
                "activeChannelFreezeRefs": ["CHFR_INTEGRATION_BROWSER_DRIFT_V2"],
            },
        },
        {
            "scenarioId": "PREPROD_ROLLBACK_REQUIRED",
            "environmentRing": "preprod",
            "releaseRef": "RC_PREPROD_V1",
            "watchState": "rollback_required",
            "tupleState": "active",
            "policyState": "blocked",
            "observationState": "expired",
            "minimumObservationSamples": 2,
            "now": "2026-04-13T12:45:00.000Z",
            "observedSamples": 3,
            "routePostureState": "rollback_required",
            "provenanceState": "verified",
            "manualRollbackApproved": True,
            "trustFreezeLive": True,
            "assuranceHardBlock": False,
            "rollbackReadinessState": "blocked",
            "rollbackTriggerRefs": [
                "rollback.preprod.parity-drift",
                "rollback.preprod.synthetic-journey",
                "rollback.preprod.manual-operator",
            ],
            "probeReadings": [
                make_probe_reading(
                    "probe.preprod.security-suite",
                    "failed",
                    "2026-04-13T12:25:00.000Z",
                    "Preprod security suite failed on the active tuple.",
                    severity="critical",
                ),
                make_probe_reading(
                    "probe.preprod.readiness-snapshot",
                    "passed",
                    "2026-04-13T12:25:00.000Z",
                    "Readiness snapshot placeholder stayed attached.",
                ),
                make_probe_reading(
                    "probe.preprod.parity-refresh",
                    "failed",
                    "2026-04-13T12:26:00.000Z",
                    "Preprod parity refresh detected withdrawn publication state.",
                    severity="critical",
                ),
                make_probe_reading(
                    "probe.shared.provenance-verification",
                    "passed",
                    "2026-04-13T12:26:00.000Z",
                    "Provenance remained verified before rollback was armed.",
                ),
                make_probe_reading(
                    "probe.shared.assurance-slice-trust",
                    "passed",
                    "2026-04-13T12:26:00.000Z",
                    "Assurance slices remained live-authoritative.",
                ),
            ],
            "lineage": None,
        },
    ]

    records: list[dict[str, Any]] = []
    trigger_rows: list[dict[str, Any]] = []
    history_rows: list[dict[str, Any]] = []

    for spec in scenario_specs:
        release_ref = spec["releaseRef"]
        environment = spec["environmentRing"]
        seed_tuple = seed_tuple_by_release[release_ref]
        seed_policy = seed_policy_by_release[release_ref]
        runtime_bundle = runtime_by_environment[environment]
        parity_record = parity_by_environment[environment]

        tuple_id = f"{seed_tuple['releaseWatchTupleId']}::{spec['scenarioId'].lower()}"
        policy_id = f"{seed_policy['waveObservationPolicyId']}::{spec['scenarioId'].lower()}"
        base_tuple = {
            "releaseWatchTupleId": tuple_id,
            "releaseRef": release_ref,
            "promotionIntentRef": seed_tuple["promotionIntentRef"],
            "approvalEvidenceBundleRef": seed_tuple["approvalEvidenceBundleRef"],
            "baselineTupleHash": seed_tuple["baselineTupleHash"],
            "approvalTupleHash": seed_tuple["approvalTupleHash"],
            "releaseApprovalFreezeRef": seed_tuple["releaseApprovalFreezeRef"],
            "runtimePublicationBundleRef": runtime_bundle["runtimePublicationBundleId"],
            "releasePublicationParityRef": parity_record["publicationParityRecordId"],
            "waveRef": seed_tuple["waveRef"],
            "waveEligibilitySnapshotRef": seed_tuple["waveEligibilitySnapshotRef"],
            "waveGuardrailSnapshotRef": seed_tuple["waveGuardrailSnapshotRef"],
            "waveObservationPolicyRef": policy_id,
            "waveControlFenceRef": seed_tuple["waveControlFenceRef"],
            "tenantScopeMode": seed_tuple["tenantScopeMode"],
            "tenantScopeRef": seed_tuple["tenantScopeRef"],
            "affectedTenantCount": seed_tuple["affectedTenantCount"],
            "affectedOrganisationCount": seed_tuple["affectedOrganisationCount"],
            "tenantScopeTupleHash": seed_tuple["tenantScopeTupleHash"],
            "requiredAssuranceSliceRefs": seed_tuple["requiredAssuranceSliceRefs"],
            "releaseTrustFreezeVerdictRefs": seed_tuple["releaseTrustFreezeVerdictRefs"],
            "requiredContinuityControlRefs": seed_tuple["requiredContinuityControlRefs"],
            "continuityEvidenceDigestRefs": parity_record["continuityEvidenceDigestRefs"],
            "activeChannelFreezeRefs": parity_record["activeChannelFreezeRefs"],
            "recoveryDispositionRefs": parity_record["recoveryDispositionRefs"],
            "tupleState": spec["tupleState"],
            "supersededByReleaseWatchTupleRef": None,
            "staleReasonRefs": [],
            "publishedAt": "2026-04-13T12:00:00.000Z",
            "closedAt": None,
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
                "prompt/097.md",
                "data/analysis/runtime_publication_bundles.json",
                "data/analysis/release_publication_parity_records.json",
            ],
        }
        base_tuple["watchTupleHash"] = build_watch_tuple_hash(base_tuple)

        required_probe_refs = unique_sorted(
            seed_policy["requiredProbeRefs"]
            + [
                "probe.shared.provenance-verification",
                "probe.shared.assurance-slice-trust",
            ]
        )
        policy_payload = {
            "waveObservationPolicyId": policy_id,
            "releaseRef": release_ref,
            "waveRef": seed_policy["waveRef"],
            "promotionIntentRef": seed_policy["promotionIntentRef"],
            "releaseApprovalFreezeRef": seed_policy["releaseApprovalFreezeRef"],
            "waveEligibilitySnapshotRef": seed_policy["waveEligibilitySnapshotRef"],
            "watchTupleHash": base_tuple["watchTupleHash"],
            "minimumDwellDuration": seed_policy["minimumDwellDuration"],
            "minimumObservationSamples": spec["minimumObservationSamples"],
            "requiredProbeRefs": required_probe_refs,
            "requiredContinuityControlRefs": seed_policy["requiredContinuityControlRefs"],
            "requiredContinuityEvidenceDigestRefs": base_tuple["continuityEvidenceDigestRefs"],
            "requiredPublicationParityState": "exact",
            "requiredRoutePostureState": "converged",
            "requiredProvenanceState": "verified",
            "stabilizationCriteriaRef": seed_policy["stabilizationCriteriaRef"],
            "rollbackTriggerRefs": spec["rollbackTriggerRefs"],
            "policyState": spec["policyState"],
            "supersededByWaveObservationPolicyRef": None,
            "gapResolutionRefs": [row["gapId"] for row in GAP_RESOLUTIONS],
            "operationalReadinessSnapshotRef": "FOLLOW_ON_DEPENDENCY_READINESS_101_OPERATIONAL_READINESS_SNAPSHOT",
            "publishedAt": "2026-04-13T12:00:00.000Z",
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
                "prompt/097.md",
            ],
        }
        policy_payload["policyHash"] = build_policy_hash(policy_payload)

        current_tuple = dict(base_tuple)
        current_tuple.pop("releaseWatchTupleId", None)
        current_tuple.pop("watchTupleHash", None)
        current_tuple.pop("tupleState", None)
        current_tuple.pop("supersededByReleaseWatchTupleRef", None)
        current_tuple.pop("staleReasonRefs", None)
        current_tuple.pop("publishedAt", None)
        current_tuple.pop("closedAt", None)
        current_tuple.pop("source_refs", None)
        for key, value in spec.get("currentTupleOverride", {}).items():
            current_tuple[key] = value

        current_policy = dict(policy_payload)
        current_policy.pop("waveObservationPolicyId", None)
        current_policy.pop("policyHash", None)
        current_policy.pop("policyState", None)
        current_policy.pop("supersededByWaveObservationPolicyRef", None)
        current_policy.pop("publishedAt", None)
        current_policy.pop("source_refs", None)

        allowed_actions = {
            "satisfied": ["widen", "pause", "resume", "close"],
            "accepted": ["pause"],
            "blocked": ["pause"],
            "stale": ["pause", "rollback"],
            "rollback_required": ["pause", "rollback"],
        }[spec["watchState"]]
        blocked_actions = [
            action
            for action in ["widen", "pause", "resume", "rollback", "close"]
            if action not in allowed_actions
        ]
        expected_triggered = {
            "satisfied": [],
            "accepted": [],
            "blocked": [],
            "stale": [],
            "rollback_required": spec["rollbackTriggerRefs"],
        }[spec["watchState"]]

        record = {
            "scenarioId": spec["scenarioId"],
            "environmentRing": environment,
            "releaseRef": release_ref,
            "tuple": base_tuple,
            "policy": policy_payload,
            "currentTuple": current_tuple,
            "currentPolicy": current_policy,
            "publicationVerdict": {
                "publishable": environment == "local",
                "publicationState": runtime_bundle["publicationState"],
                "parityState": parity_record["parityState"],
                "routeExposureState": parity_record["routeExposureState"],
            },
            "probeReadings": spec["probeReadings"],
            "routePostureState": spec["routePostureState"],
            "provenanceState": spec["provenanceState"],
            "currentContinuityEvidenceDigestRefs": current_policy["requiredContinuityEvidenceDigestRefs"],
            "currentAssuranceSliceRefs": current_tuple["requiredAssuranceSliceRefs"],
            "trustFreezeLive": spec["trustFreezeLive"],
            "assuranceHardBlock": spec["assuranceHardBlock"],
            "rollbackReadinessState": spec["rollbackReadinessState"],
            "manualRollbackApproved": spec["manualRollbackApproved"],
            "now": spec["now"],
            "observedSamples": spec["observedSamples"],
            "expected": {
                "watchState": spec["watchState"],
                "tupleState": spec["tupleState"],
                "policyState": spec["policyState"],
                "observationState": spec["observationState"],
                "allowedActions": allowed_actions,
                "blockedActions": blocked_actions,
                "triggeredTriggerRefs": expected_triggered,
            },
            "lineage": spec["lineage"],
        }
        records.append(record)

        for trigger_ref in policy_payload["rollbackTriggerRefs"]:
            trigger_class = (
                "hard_parity_drift"
                if "parity" in trigger_ref
                else "critical_synthetic_journey_failure"
                if "synthetic" in trigger_ref
                else "manual_operator_approved"
                if "manual" in trigger_ref
                else "continuity_control_regression"
            )
            trigger_state = "triggered" if trigger_ref in expected_triggered else "clear"
            trigger_rows.append(
                {
                    "scenario_id": spec["scenarioId"],
                    "environment_ring": environment,
                    "release_ref": release_ref,
                    "trigger_ref": trigger_ref,
                    "trigger_class": trigger_class,
                    "trigger_state": trigger_state,
                    "armed": "true",
                    "reason_refs": "; ".join(expected_triggered if trigger_state == "triggered" else []),
                    "source_refs": "prompt/097.md; blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
                }
            )

        history_rows.extend(
            [
                {
                    "scenarioId": spec["scenarioId"],
                    "eventType": "tuple_published",
                    "recordedAt": base_tuple["publishedAt"],
                    "summary": "ReleaseWatchTuple published for the wave step.",
                },
                {
                    "scenarioId": spec["scenarioId"],
                    "eventType": "policy_published",
                    "recordedAt": policy_payload["publishedAt"],
                    "summary": "WaveObservationPolicy published for the same watch tuple.",
                },
                {
                    "scenarioId": spec["scenarioId"],
                    "eventType": "observation_window_opened",
                    "recordedAt": base_tuple["publishedAt"],
                    "summary": "Observation window opened with tuple-bound dwell obligations.",
                },
                {
                    "scenarioId": spec["scenarioId"],
                    "eventType": "observation_evaluated",
                    "recordedAt": spec["now"],
                    "summary": f"Watch state evaluated as {spec['watchState']}.",
                },
            ]
        )
        if spec["lineage"]:
            history_rows.append(
                {
                    "scenarioId": spec["scenarioId"],
                    "eventType": "tuple_superseded",
                    "recordedAt": "2026-04-13T11:50:00.000Z",
                    "summary": "Prior preview tuple superseded after scope and continuity duty changed.",
                }
            )

    catalog = {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "followOnDependencies": FOLLOW_ON_DEPENDENCIES,
        "gapResolutions": GAP_RESOLUTIONS,
        "summary": {
            "scenario_count": len(records),
            "environment_count": len({row["environmentRing"] for row in records}),
            "release_watch_tuple_count": len(records),
            "observation_policy_count": len(records),
            "probe_catalog_count": len(probe_catalog),
            "rollback_trigger_row_count": len(trigger_rows),
            "accepted_count": sum(1 for row in records if row["expected"]["watchState"] == "accepted"),
            "satisfied_count": sum(1 for row in records if row["expected"]["watchState"] == "satisfied"),
            "blocked_count": sum(1 for row in records if row["expected"]["watchState"] == "blocked"),
            "stale_count": sum(1 for row in records if row["expected"]["watchState"] == "stale"),
            "rollback_required_count": sum(
                1 for row in records if row["expected"]["watchState"] == "rollback_required"
            ),
        },
        "records": records,
        "historyRows": history_rows,
    }
    probe_payload = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "probeCatalog": list(probe_catalog.values()),
    }
    return tuple_schema, policy_schema, trigger_rows, {
        "catalog": catalog,
        "probe_payload": probe_payload,
    }


def patch_root_package_json() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package_json() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    spec_name = "release-watch-pipeline-cockpit.spec.js"
    tokens = {
        "build": f"node --check {spec_name}",
        "lint": f"eslint {spec_name}",
        "test": f"node {spec_name}",
        "typecheck": f"node --check {spec_name}",
        "e2e": f"node {spec_name} --run",
    }
    for script_name, token in tokens.items():
        command = package["scripts"][script_name]
        if token not in command:
            package["scripts"][script_name] = f"{command} && {token}"
    description_suffix = "release-watch pipeline cockpit browser checks."
    if description_suffix not in package.get("description", ""):
        package["description"] = (
            package.get("description", "").rstrip(".") + ", " + description_suffix
        ).strip(", ")
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_release_controls_index() -> None:
    source = INDEX_PATH.read_text(encoding="utf-8")
    block = dedent(
        """
        // par_097_release_watch_pipeline_exports:start
        export * from "./release-watch-pipeline";
        // par_097_release_watch_pipeline_exports:end
        """
    ).strip()
    if "par_097_release_watch_pipeline_exports:start" in source:
        before, _, remainder = source.partition("// par_097_release_watch_pipeline_exports:start")
        _, _, after = remainder.partition("// par_097_release_watch_pipeline_exports:end")
        source = before.rstrip() + "\n\n" + block + "\n\n" + after.lstrip()
    elif "// par_095_migration_backfill_exports:end\n" in source:
        source = source.replace(
            "// par_095_migration_backfill_exports:end\n",
            "// par_095_migration_backfill_exports:end\n\n" + block + "\n",
            1,
        )
    elif "// par_096_browser_runtime_governor_exports:end\n" in source:
        source = source.replace(
            "// par_096_browser_runtime_governor_exports:end\n",
            "// par_096_browser_runtime_governor_exports:end\n\n" + block + "\n",
            1,
        )
    elif 'export * from "./browser-runtime-governor";\n' in source:
        source = source.replace(
            'export * from "./browser-runtime-governor";\n',
            'export * from "./browser-runtime-governor";\n\n' + block + "\n",
            1,
        )
    elif "// par_094_runtime_publication_exports:end\n" in source:
        source = source.replace(
            "// par_094_runtime_publication_exports:end\n",
            "// par_094_runtime_publication_exports:end\n\n" + block + "\n",
            1,
        )
    elif 'export * from "./runtime-publication";\n' in source:
        source = source.replace(
            'export * from "./runtime-publication";\n',
            'export * from "./runtime-publication";\n\n' + block + "\n",
            1,
        )
    else:
        raise RuntimeError("PREREQUISITE_GAP_097_RELEASE_CONTROLS_EXPORT_ANCHOR")
    write_text(INDEX_PATH, source)


def patch_public_api_test() -> None:
    source = PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    if "createReleaseWatchPipelineSimulationHarness," not in source:
        if "createMigrationBackfillSimulationHarness,\n" in source:
            source = source.replace(
                "  createMigrationBackfillSimulationHarness,\n",
                "  createMigrationBackfillSimulationHarness,\n"
                "  createReleaseWatchPipelineSimulationHarness,\n",
                1,
            )
        elif "createProjectionRebuildSimulationHarness,\n" in source:
            source = source.replace(
                "  createProjectionRebuildSimulationHarness,\n",
                "  createProjectionRebuildSimulationHarness,\n"
                "  createReleaseWatchPipelineSimulationHarness,\n",
                1,
            )
        else:
            raise RuntimeError("PREREQUISITE_GAP_097_PUBLIC_API_IMPORT_ANCHOR")
    if 'it("runs the release watch pipeline simulation harness"' not in source:
        block_anchor = 'it("runs the projection rebuild simulation harness", () => {'
        anchor_index = source.find(block_anchor)
        if anchor_index == -1:
            raise RuntimeError("PREREQUISITE_GAP_097_PUBLIC_API_BLOCK_ANCHOR")
        addition = dedent(
            """
              it("runs the release watch pipeline simulation harness", () => {
                const harness = createReleaseWatchPipelineSimulationHarness();
                expect(harness.evaluation.watchState).toBe("satisfied");
                expect(harness.evaluation.observationWindow.observationState).toBe("satisfied");
                expect(harness.evaluation.triggerEvaluations).toHaveLength(2);
              });

            """
        )
        source = source[:anchor_index] + addition + source[anchor_index:]
    write_text(PUBLIC_API_TEST_PATH, source)


def patch_workflows() -> None:
    ci_workflow = WORKFLOW_CI_PATH.read_text(encoding="utf-8")
    if "pnpm ci:rehearse-release-watch" not in ci_workflow:
        anchor = "      - run: pnpm ci:verify-runtime-publication\n"
        if anchor not in ci_workflow:
            raise RuntimeError("PREREQUISITE_GAP_097_CI_WORKFLOW_ANCHOR")
        ci_workflow = ci_workflow.replace(
            anchor,
            anchor
            + "      - run: pnpm ci:rehearse-release-watch\n"
            + "      - run: pnpm ci:verify-release-watch\n",
            1,
        )
    write_text(WORKFLOW_CI_PATH, ci_workflow)

    promotion_workflow = WORKFLOW_PROMOTION_PATH.read_text(encoding="utf-8")
    if "pnpm ci:rehearse-release-watch" not in promotion_workflow:
        anchor = "      - run: pnpm ci:verify-runtime-publication -- --environment ci-preview\n"
        if anchor not in promotion_workflow:
            raise RuntimeError("PREREQUISITE_GAP_097_PROMOTION_WORKFLOW_ANCHOR")
        promotion_workflow = promotion_workflow.replace(
            anchor,
            anchor
            + "      - run: pnpm ci:rehearse-release-watch -- --environment local\n"
            + "      - run: pnpm ci:verify-release-watch -- --environment local\n",
            1,
        )
    write_text(WORKFLOW_PROMOTION_PATH, promotion_workflow)


def main() -> None:
    tuple_schema, policy_schema, trigger_rows, payloads = build_catalog()
    write_json(WATCH_TUPLE_SCHEMA_PATH, tuple_schema)
    write_json(POLICY_SCHEMA_PATH, policy_schema)
    write_json(PROBE_CATALOG_PATH, payloads["probe_payload"])
    write_json(PIPELINE_CATALOG_PATH, payloads["catalog"])
    write_csv(
        ROLLBACK_TRIGGER_MATRIX_PATH,
        trigger_rows,
        [
            "scenario_id",
            "environment_ring",
            "release_ref",
            "trigger_ref",
            "trigger_class",
            "trigger_state",
            "armed",
            "reason_refs",
            "source_refs",
        ],
    )
    patch_root_package_json()
    patch_playwright_package_json()
    patch_release_controls_index()
    patch_public_api_test()
    patch_workflows()
    print("release watch pipeline artifacts generated")


if __name__ == "__main__":
    main()
