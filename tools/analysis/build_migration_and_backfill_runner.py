#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

SCHEMA_PATH = DATA_DIR / "schema_migration_plan_schema.json"
BACKFILL_SCHEMA_PATH = DATA_DIR / "projection_backfill_plan_schema.json"
MATRIX_PATH = DATA_DIR / "migration_readiness_matrix.csv"
CATALOG_PATH = DATA_DIR / "migration_backfill_control_catalog.json"
INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
WORKFLOW_CI_PATH = WORKFLOWS_DIR / "build-provenance-ci.yml"
WORKFLOW_PROMOTION_PATH = WORKFLOWS_DIR / "nonprod-provenance-promotion.yml"

RUNTIME_PUBLICATION_PATH = DATA_DIR / "runtime_publication_bundles.json"
PARITY_PATH = DATA_DIR / "release_publication_parity_records.json"
PROJECTION_CASEBOOK_PATH = DATA_DIR / "projection_rebuild_casebook.json"

TASK_ID = "par_095"
VISUAL_MODE = "Migration_And_Backfill_Control_Room"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
      writer = csv.DictWriter(handle, fieldnames=fieldnames)
      writer.writeheader()
      writer.writerows(rows)


def stable_hash(payload: Any) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def build_schemas() -> tuple[dict[str, Any], dict[str, Any]]:
    schema_migration_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schema_migration_plan_schema.json",
        "title": "SchemaMigrationPlan",
        "type": "object",
        "required": [
            "migrationPlanId",
            "storeScope",
            "changeType",
            "releaseApprovalFreezeRef",
            "sourceSchemaVersionRefs",
            "targetSchemaVersionRefs",
            "compatibilityWindow",
            "executionOrder",
            "affectedAudienceSurfaceRefs",
            "affectedRouteFamilyRefs",
            "routeContractDigestRefs",
            "sourceProjectionContractVersionSetRefs",
            "targetProjectionContractVersionSetRefs",
            "sourceProjectionCompatibilityDigestRefs",
            "targetProjectionCompatibilityDigestRefs",
            "readPathCompatibilityWindowRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "preCutoverPublicationBundleRef",
            "targetPublicationBundleRef",
            "rollbackPublicationBundleRef",
            "requiredRecoveryDispositionRefs",
            "requiredContinuityControlRefs",
            "environmentBaselineFingerprintRef",
            "compatibilityEvidenceRef",
            "contractRemovalGuardRef",
            "migrationExecutionBindingRef",
            "verificationRefs",
            "rollbackMode",
            "planState",
            "sourceRefs",
        ],
        "properties": {
            "migrationPlanId": {"type": "string"},
            "storeScope": {"type": "string"},
            "changeType": {
                "type": "string",
                "enum": ["additive", "backfill", "contractive", "rollforward_only"],
            },
            "releaseApprovalFreezeRef": {"type": "string"},
            "sourceSchemaVersionRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "targetSchemaVersionRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "compatibilityWindow": {
                "type": "object",
                "required": [
                    "migrationWindowRef",
                    "windowState",
                    "minimumObservationMinutes",
                    "minimumObservationSamples",
                    "opensAt",
                    "closesAt",
                    "sourceRefs",
                ],
                "properties": {
                    "migrationWindowRef": {"type": "string"},
                    "windowState": {
                        "type": "string",
                        "enum": [
                            "expand_only",
                            "dual_read",
                            "cutover_ready",
                            "constrained",
                            "rollback_only",
                            "blocked",
                        ],
                    },
                    "minimumObservationMinutes": {"type": "integer", "minimum": 1},
                    "minimumObservationSamples": {"type": "integer", "minimum": 1},
                    "opensAt": {"type": "string"},
                    "closesAt": {"type": "string"},
                    "sourceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
                },
            },
            "executionOrder": {
                "type": "array",
                "items": {"type": "string", "enum": ["expand", "migrate", "contract"]},
                "minItems": 3,
                "maxItems": 3,
            },
            "affectedAudienceSurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "affectedRouteFamilyRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "routeContractDigestRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "sourceProjectionContractVersionSetRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "targetProjectionContractVersionSetRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "sourceProjectionCompatibilityDigestRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "targetProjectionCompatibilityDigestRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "readPathCompatibilityWindowRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "preCutoverPublicationBundleRef": {"type": "string"},
            "targetPublicationBundleRef": {"type": "string"},
            "rollbackPublicationBundleRef": {"type": "string"},
            "requiredRecoveryDispositionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "requiredContinuityControlRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "environmentBaselineFingerprintRef": {"type": "string"},
            "compatibilityEvidenceRef": {"type": "string"},
            "contractRemovalGuardRef": {"type": "string"},
            "migrationExecutionBindingRef": {"type": "string"},
            "verificationRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "rollbackMode": {
                "type": "string",
                "enum": ["binary_safe", "flag_only", "rollforward_only"],
            },
            "planState": {"type": "string", "enum": ["draft", "ready", "blocked"]},
            "sourceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }
    backfill_schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/projection_backfill_plan_schema.json",
        "title": "GovernedProjectionBackfillPlan",
        "type": "object",
        "required": [
            "backfillPlanId",
            "backfillPlanRef",
            "projectionFamilies",
            "releaseApprovalFreezeRef",
            "sourceEventWindow",
            "expectedLagBudget",
            "rebuildStrategy",
            "affectedAudienceSurfaceRefs",
            "routeImpactRefs",
            "routeContractDigestRefs",
            "projectionContractVersionSetRefs",
            "projectionCompatibilityDigestRefs",
            "readPathCompatibilityWindowRef",
            "runtimePublicationBundleRef",
            "releasePublicationParityRef",
            "requiredRecoveryDispositionRefs",
            "stopResumeFenceRef",
            "syntheticRecoveryCoverageRefs",
            "projectionReadinessVerdictRefs",
            "lagVisibilityEvidenceRef",
            "cutoverReadinessState",
            "rollbackReadModelRef",
            "migrationExecutionBindingRef",
            "successEvidenceRef",
            "projectionFamilyRef",
            "projectionVersionRef",
            "rebuildMode",
            "checkpointStrategy",
            "compareBeforeCutover",
            "sourceRefs",
        ],
        "properties": {
            "backfillPlanId": {"type": "string"},
            "backfillPlanRef": {"type": "string"},
            "projectionFamilies": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "releaseApprovalFreezeRef": {"type": "string"},
            "sourceEventWindow": {
                "type": "object",
                "required": ["fromInclusive", "toInclusive"],
                "properties": {
                    "fromInclusive": {"type": "integer", "minimum": 0},
                    "toInclusive": {"type": "integer", "minimum": 0},
                },
            },
            "expectedLagBudget": {"type": "integer", "minimum": 0},
            "rebuildStrategy": {
                "type": "string",
                "enum": ["checkpoint_resume", "shadow_compare", "replace"],
            },
            "affectedAudienceSurfaceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "routeImpactRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "routeContractDigestRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
            "projectionContractVersionSetRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "projectionCompatibilityDigestRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "readPathCompatibilityWindowRef": {"type": "string"},
            "runtimePublicationBundleRef": {"type": "string"},
            "releasePublicationParityRef": {"type": "string"},
            "requiredRecoveryDispositionRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "stopResumeFenceRef": {"type": "string"},
            "syntheticRecoveryCoverageRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "projectionReadinessVerdictRefs": {"type": "array", "items": {"type": "string"}},
            "lagVisibilityEvidenceRef": {"type": "string"},
            "cutoverReadinessState": {
                "type": "string",
                "enum": ["not_ready", "ready", "blocked"],
            },
            "rollbackReadModelRef": {"type": "string"},
            "migrationExecutionBindingRef": {"type": "string"},
            "successEvidenceRef": {"type": "string"},
            "projectionFamilyRef": {"type": "string"},
            "projectionVersionRef": {"type": "string"},
            "rebuildMode": {"type": "string", "enum": ["rebuild", "catch_up", "dry_run"]},
            "checkpointStrategy": {"type": "string", "enum": ["per_event", "per_batch"]},
            "compareBeforeCutover": {"type": "boolean"},
            "sourceRefs": {"type": "array", "items": {"type": "string"}, "minItems": 1},
        },
    }
    return schema_migration_schema, backfill_schema


def build_record(
    *,
    scenario_id: str,
    title: str,
    environment_ref: str,
    plan_state: str,
    verdict_state: str,
    rollback_mode: str,
    change_type: str,
    route_family_ref: str,
    projection_family_ref: str,
    projection_version_ref: str,
    projection_version_set_ref: str,
    audience_surface_ref: str,
    surface_runtime_binding_ref: str,
    publication_bundle: dict[str, Any],
    parity_record: dict[str, Any],
    publication_state: str,
    parity_state: str,
    route_exposure_state: str,
    observation_state: str,
    route_posture_state: str,
    allowed_surface_state: str,
    settlement_result: str,
    lag_state: str,
    coverage_state: str,
    compatibility_state: str,
    cutover_state: str,
    observed_minutes: int,
    observed_samples: int,
    comparison_matches: bool,
    rollback_mode_matches: bool,
    summary: str,
    notes: list[str],
) -> dict[str, Any]:
    route_contract_digest = f"route-contract-digest::{stable_hash(route_family_ref)[:16]}"
    projection_compat_digest = f"projection-compat-digest::{stable_hash(projection_version_set_ref)[:16]}"
    read_path_digest = stable_hash(
        {
            "routeFamilyRef": route_family_ref,
            "projectionVersionSetRef": projection_version_set_ref,
            "environmentRef": environment_ref,
        }
    )
    execution_binding_id = f"MEB_095_{scenario_id}"
    migration_plan_id = f"SMP_095_{scenario_id}"
    backfill_plan_id = f"PBP_095_{scenario_id}"
    observation_window_id = f"MOW_095_{scenario_id}"
    verdict_id = f"PRV_095_{scenario_id}"
    impact_preview_id = f"MIP_095_{scenario_id}"
    recovery_ref = f"recovery-disposition::{audience_surface_ref}"
    continuity_ref = f"continuity-control::{audience_surface_ref}"
    freeze_ref = publication_bundle["releaseApprovalFreezeRef"]
    window_ref = f"MCW_095_{scenario_id}"
    binding_tuple_hash = stable_hash(
        {
            "bundle": publication_bundle["runtimePublicationBundleId"],
            "parity": parity_record["publicationParityRecordId"],
            "projectionVersionSet": projection_version_set_ref,
            "scenario": scenario_id,
        }
    )
    projection_readiness = {
        "projectionReadinessVerdictId": verdict_id,
        "backfillPlanRef": backfill_plan_id,
        "migrationExecutionBindingRef": execution_binding_id,
        "projectionBackfillExecutionLedgerRef": f"ledger::{scenario_id}",
        "audienceSurfaceRef": audience_surface_ref,
        "routeFamilyRef": route_family_ref,
        "projectionFamilyRefs": [projection_family_ref],
        "requiredRouteContractDigestRef": route_contract_digest,
        "requiredProjectionContractVersionSetRef": projection_version_set_ref,
        "requiredProjectionCompatibilityDigestRef": projection_compat_digest,
        "readModelVersionSetRef": projection_version_set_ref,
        "coverageState": coverage_state,
        "lagState": lag_state,
        "contractCompatibilityState": compatibility_state,
        "freshnessCeilingRef": f"freshness::{projection_family_ref}::lag-budget",
        "allowedSurfaceState": allowed_surface_state,
        "lastMigrationObservationWindowRef": observation_window_id,
        "lastVerifiedAt": GENERATED_AT,
        "verdictState": verdict_state,
        "blockerRefs": [] if verdict_state != "blocked" else parity_record.get("refusalReasonRefs", []),
        "reason": summary,
    }
    plan = {
        "migrationPlanId": migration_plan_id,
        "storeScope": f"store::{projection_family_ref.lower()}",
        "changeType": change_type,
        "releaseApprovalFreezeRef": freeze_ref,
        "sourceSchemaVersionRefs": ["CESV_SOURCE_V1"],
        "targetSchemaVersionRefs": ["CESV_TARGET_V1"],
        "compatibilityWindow": {
            "migrationWindowRef": window_ref,
            "windowState": "cutover_ready" if verdict_state == "ready" else "dual_read" if verdict_state == "constrained" else "blocked",
            "minimumObservationMinutes": 30,
            "minimumObservationSamples": 3,
            "opensAt": "2026-04-13T12:00:00Z",
            "closesAt": "2026-04-13T13:30:00Z",
            "sourceRefs": [
                "prompt/095.md",
                "blueprint/platform-runtime-and-release-blueprint.md#ReadPathCompatibilityWindow",
            ],
        },
        "executionOrder": ["expand", "migrate", "contract"],
        "affectedAudienceSurfaceRefs": [audience_surface_ref],
        "affectedRouteFamilyRefs": [route_family_ref],
        "routeContractDigestRefs": [route_contract_digest],
        "sourceProjectionContractVersionSetRefs": [projection_version_set_ref],
        "targetProjectionContractVersionSetRefs": [projection_version_set_ref],
        "sourceProjectionCompatibilityDigestRefs": [projection_compat_digest],
        "targetProjectionCompatibilityDigestRefs": [projection_compat_digest],
        "readPathCompatibilityWindowRef": window_ref,
        "runtimePublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "releasePublicationParityRef": parity_record["publicationParityRecordId"],
        "preCutoverPublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "targetPublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "rollbackPublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "requiredRecoveryDispositionRefs": [recovery_ref],
        "requiredContinuityControlRefs": [continuity_ref],
        "environmentBaselineFingerprintRef": f"baseline::{environment_ref}",
        "compatibilityEvidenceRef": f"evidence::{scenario_id}::compatibility",
        "contractRemovalGuardRef": f"guard::{scenario_id}::contract-removal",
        "migrationExecutionBindingRef": execution_binding_id,
        "verificationRefs": [f"verification::{scenario_id}"],
        "rollbackMode": rollback_mode,
        "planState": plan_state,
        "sourceRefs": [
            "prompt/095.md",
            "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
        ],
    }
    backfill_plan = {
        "backfillPlanId": backfill_plan_id,
        "backfillPlanRef": backfill_plan_id,
        "projectionFamilies": [projection_family_ref],
        "releaseApprovalFreezeRef": freeze_ref,
        "sourceEventWindow": {"fromInclusive": 1, "toInclusive": 10},
        "expectedLagBudget": 0 if verdict_state == "ready" else 1,
        "rebuildStrategy": "shadow_compare" if rollback_mode != "binary_safe" else "checkpoint_resume",
        "affectedAudienceSurfaceRefs": [audience_surface_ref],
        "routeImpactRefs": [route_family_ref],
        "routeContractDigestRefs": [route_contract_digest],
        "projectionContractVersionSetRefs": [projection_version_set_ref],
        "projectionCompatibilityDigestRefs": [projection_compat_digest],
        "readPathCompatibilityWindowRef": window_ref,
        "runtimePublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "releasePublicationParityRef": parity_record["publicationParityRecordId"],
        "requiredRecoveryDispositionRefs": [recovery_ref],
        "stopResumeFenceRef": f"fence::{scenario_id}",
        "syntheticRecoveryCoverageRefs": [f"coverage::{scenario_id}::synthetic"],
        "projectionReadinessVerdictRefs": [verdict_id],
        "lagVisibilityEvidenceRef": f"evidence::{scenario_id}::lag",
        "cutoverReadinessState": "ready" if verdict_state == "ready" else "not_ready" if verdict_state == "constrained" else "blocked",
        "rollbackReadModelRef": f"read-model::{projection_family_ref}::rollback",
        "migrationExecutionBindingRef": execution_binding_id,
        "successEvidenceRef": f"evidence::{scenario_id}::success",
        "projectionFamilyRef": projection_family_ref,
        "projectionVersionRef": projection_version_ref,
        "rebuildMode": "dry_run" if verdict_state == "ready" else "rebuild",
        "checkpointStrategy": "per_event",
        "compareBeforeCutover": True,
        "sourceRefs": [
            "prompt/095.md",
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionBackfillPlan",
        ],
    }
    binding = {
        "migrationExecutionBindingId": execution_binding_id,
        "migrationPlanRef": migration_plan_id,
        "projectionBackfillPlanRef": backfill_plan_id,
        "verificationScenarioRef": f"scenario::{scenario_id}",
        "environmentBaselineFingerprintRef": f"baseline::{environment_ref}",
        "releaseApprovalFreezeRef": freeze_ref,
        "releasePublicationParityRef": parity_record["publicationParityRecordId"],
        "releaseWatchTupleRef": publication_bundle["watchTupleHash"],
        "runtimePublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "audienceSurfaceRuntimeBindingRefs": [surface_runtime_binding_ref],
        "routeContractDigestRefs": [route_contract_digest],
        "projectionContractVersionSetRefs": [projection_version_set_ref],
        "projectionCompatibilityDigestRefs": [projection_compat_digest],
        "readPathCompatibilityWindowRef": window_ref,
        "readPathCompatibilityDigestRef": read_path_digest,
        "projectionReadinessVerdictRefs": [verdict_id],
        "projectionBackfillExecutionLedgerRef": f"ledger::{scenario_id}",
        "migrationCutoverCheckpointRef": f"checkpoint::{scenario_id}",
        "preCutoverPublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "targetPublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "rollbackPublicationBundleRef": publication_bundle["runtimePublicationBundleId"],
        "requiredRecoveryDispositionRefs": [recovery_ref],
        "requiredContinuityControlRefs": [continuity_ref],
        "bindingTupleHash": binding_tuple_hash,
        "provenanceState": publication_bundle.get("provenanceVerificationState", "verified"),
        "cutoverState": cutover_state,
        "bindingState": "ready" if verdict_state != "blocked" or publication_state == "published" else "blocked",
        "lastMigrationActionSettlementRef": f"settlement::{scenario_id}",
        "validatedAt": GENERATED_AT,
        "environmentRef": environment_ref,
        "seedSetRef": f"seed-pack::{environment_ref}",
        "sourceRefs": [
            "prompt/095.md",
            "blueprint/platform-runtime-and-release-blueprint.md#MigrationExecutionBinding",
        ],
    }
    phase_lane = [
        {"phase": "expand", "state": "completed" if verdict_state != "blocked" else "blocked", "label": "Expand"},
        {"phase": "migrate", "state": "completed" if verdict_state == "ready" else "running" if verdict_state == "constrained" else "blocked", "label": "Migrate / Backfill"},
        {"phase": "observe", "state": observation_state, "label": "Observe"},
        {"phase": "contract", "state": "completed" if settlement_result == "applied" else "blocked", "label": "Contract"},
    ]
    execution_rows = [
        {
            "actionRecordId": f"action::{scenario_id}::expand",
            "phase": "expand",
            "actionType": "start_migration",
            "state": phase_lane[0]["state"],
            "notes": "Schema expansion bound to the exact runtime tuple.",
        },
        {
            "actionRecordId": f"action::{scenario_id}::migrate",
            "phase": "migrate",
            "actionType": "resume_backfill",
            "state": phase_lane[1]["state"],
            "notes": "Checkpointed projection backfill and dual-read comparison.",
        },
        {
            "actionRecordId": f"action::{scenario_id}::contract",
            "phase": "contract",
            "actionType": "complete_migration" if settlement_result == "applied" else "abort_migration",
            "state": phase_lane[3]["state"],
            "notes": "Contractive cutover remains blocked until route readiness is live.",
        },
    ]
    evidence_rows = [
        {
            "evidenceId": f"evidence::{scenario_id}::publication",
            "kind": "publication",
            "state": publication_state,
            "detail": f"bundle {publication_bundle['runtimePublicationBundleId']}",
        },
        {
            "evidenceId": f"evidence::{scenario_id}::parity",
            "kind": "parity",
            "state": parity_state,
            "detail": f"route exposure {route_exposure_state}",
        },
        {
            "evidenceId": f"evidence::{scenario_id}::observation",
            "kind": "observation",
            "state": observation_state,
            "detail": f"{observed_minutes}m / {observed_samples} probes",
        },
        {
            "evidenceId": f"evidence::{scenario_id}::rollback",
            "kind": "rollback",
            "state": "matched" if rollback_mode_matches else "mismatch",
            "detail": rollback_mode,
        },
    ]
    return {
        "scenarioId": scenario_id,
        "title": title,
        "environmentRef": environment_ref,
        "planState": plan_state,
        "verdictState": verdict_state,
        "rollbackMode": rollback_mode,
        "publicationState": publication_state,
        "parityState": parity_state,
        "routeExposureState": route_exposure_state,
        "observationState": observation_state,
        "routePostureState": route_posture_state,
        "allowedSurfaceState": allowed_surface_state,
        "settlementResult": settlement_result,
        "coverageState": coverage_state,
        "lagState": lag_state,
        "contractCompatibilityState": compatibility_state,
        "cutoverState": cutover_state,
        "observedMinutes": observed_minutes,
        "observedSamples": observed_samples,
        "comparisonMatches": comparison_matches,
        "rollbackModeMatches": rollback_mode_matches,
        "summary": summary,
        "notes": notes,
        "impactPreview": {
            "migrationImpactPreviewId": impact_preview_id,
            "migrationExecutionBindingRef": execution_binding_id,
            "affectedAudienceSurfaceRefs": [audience_surface_ref],
            "affectedRouteFamilyRefs": [route_family_ref],
            "expectedLiveRouteRefs": [route_family_ref] if verdict_state == "ready" else [],
            "expectedSummaryOnlyRouteRefs": [route_family_ref] if verdict_state == "constrained" else [],
            "expectedRecoveryOnlyRouteRefs": [route_family_ref] if allowed_surface_state == "recovery_only" else [],
            "expectedBlockedRouteRefs": [route_family_ref] if verdict_state == "blocked" else [],
            "requiredRecoveryDispositionRefs": [recovery_ref],
            "requiredContinuityControlRefs": [continuity_ref],
            "previewedAt": GENERATED_AT,
            "riskRefs": [] if verdict_state == "ready" else [f"risk::{scenario_id}"],
            "blockingReasonRefs": [] if verdict_state != "blocked" else parity_record.get("refusalReasonRefs", []),
        },
        "plan": plan,
        "backfillPlan": backfill_plan,
        "binding": binding,
        "projectionReadinessVerdict": projection_readiness,
        "observationWindow": {
            "migrationObservationWindowId": observation_window_id,
            "migrationExecutionBindingRef": execution_binding_id,
            "routePostureState": route_posture_state,
            "observationState": observation_state,
            "requiredProbeRefs": ["probe::minutes", "probe::samples", "probe::comparison"],
            "startsAt": "2026-04-13T12:00:00Z",
            "closesAt": "2026-04-13T13:30:00Z",
        },
        "phaseLane": phase_lane,
        "executionRows": execution_rows,
        "evidenceRows": evidence_rows,
    }


def build_catalog() -> dict[str, Any]:
    publication_catalog = load_json(RUNTIME_PUBLICATION_PATH)
    parity_catalog = load_json(PARITY_PATH)
    projection_casebook = load_json(PROJECTION_CASEBOOK_PATH)

    bundles = {row["environmentRing"]: row for row in publication_catalog["runtimePublicationBundles"]}
    parities = {row["environmentRing"]: row for row in parity_catalog["releasePublicationParityRecords"]}
    route_family_map = {
        "patient": (
            "PCF_050_RF_PATIENT_REQUESTS_V1",
            "PRCF_082_PATIENT_REQUESTS",
            "PRCV_082_PATIENT_REQUESTS_V2",
            "PRCVS_082_PATIENT_REQUESTS_DUAL_READ",
            "audsurf_patient_authenticated_portal",
            "ASRB_050_PATIENT_AUTHENTICATED_PORTAL_V1",
        ),
        "workspace": (
            "PCF_050_RF_STAFF_WORKSPACE_V1",
            "PRCF_082_STAFF_WORKSPACE",
            "PRCV_082_STAFF_WORKSPACE_V1",
            "PRCVS_082_STAFF_WORKSPACE_V1",
            "audsurf_clinical_workspace",
            "ASRB_050_CLINICAL_WORKSPACE_V1",
        ),
        "ops": (
            "PCF_050_RF_OPERATIONS_BOARD_V1",
            "PRCF_082_OPERATIONS_BOARD",
            "PRCV_082_OPERATIONS_BOARD_V1",
            "PRCVS_082_OPERATIONS_BOARD_V1",
            "audsurf_operations_console",
            "ASRB_050_OPERATIONS_CONSOLE_V1",
        ),
        "support": (
            "PCF_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
            "PRCF_082_SUPPORT_REPLAY",
            "PRCV_082_SUPPORT_REPLAY_V2",
            "PRCVS_082_SUPPORT_REPLAY_BLOCKED",
            "audsurf_support_workspace",
            "ASRB_050_SUPPORT_WORKSPACE_V1",
        ),
    }

    records = [
        build_record(
            scenario_id="LOCAL_READY",
            title="Local seeded additive migration passes dual-read and observation",
            environment_ref="local",
            plan_state="ready",
            verdict_state="ready",
            rollback_mode="flag_only",
            change_type="additive",
            route_family_ref=route_family_map["patient"][0],
            projection_family_ref=route_family_map["patient"][1],
            projection_version_ref=route_family_map["patient"][2],
            projection_version_set_ref=route_family_map["patient"][3],
            audience_surface_ref=route_family_map["patient"][4],
            surface_runtime_binding_ref=route_family_map["patient"][5],
            publication_bundle=bundles["local"],
            parity_record=parities["local"],
            publication_state="published",
            parity_state="exact",
            route_exposure_state=parities["local"]["routeExposureState"],
            observation_state="satisfied",
            route_posture_state="converged",
            allowed_surface_state="live",
            settlement_result="applied",
            lag_state="within_budget",
            coverage_state="converged",
            compatibility_state="exact",
            cutover_state="cutover_ready",
            observed_minutes=45,
            observed_samples=4,
            comparison_matches=True,
            rollback_mode_matches=True,
            summary="The local seeded tuple proves expand-migrate-contract, dual-read comparison, and contractive cutover without blocking patient request routes.",
            notes=[
                "Local rehearsal uses the same governed plan, binding, and observation semantics as later production execution.",
                "The route remains explicitly live only after convergence and observation complete.",
            ],
        ),
        build_record(
            scenario_id="LOCAL_CONSTRAINED",
            title="Local rehearsal remains summary-only while observation is still open",
            environment_ref="local",
            plan_state="ready",
            verdict_state="constrained",
            rollback_mode="flag_only",
            change_type="additive",
            route_family_ref=route_family_map["patient"][0],
            projection_family_ref=route_family_map["patient"][1],
            projection_version_ref=route_family_map["patient"][2],
            projection_version_set_ref=route_family_map["patient"][3],
            audience_surface_ref=route_family_map["patient"][4],
            surface_runtime_binding_ref=route_family_map["patient"][5],
            publication_bundle=bundles["local"],
            parity_record=parities["local"],
            publication_state="published",
            parity_state="exact",
            route_exposure_state=parities["local"]["routeExposureState"],
            observation_state="open",
            route_posture_state="constrained",
            allowed_surface_state="summary_only",
            settlement_result="accepted_pending_observation",
            lag_state="within_budget",
            coverage_state="partial",
            compatibility_state="additive_compatible",
            cutover_state="dual_read",
            observed_minutes=10,
            observed_samples=1,
            comparison_matches=True,
            rollback_mode_matches=True,
            summary="Projection rows are present, but the control room keeps the route summary-only until the observation window and probe counts satisfy the declared plan.",
            notes=[
                "This closes the green-job-implies-safety gap by showing a non-blocked but still not-live state.",
            ],
        ),
        build_record(
            scenario_id="CI_PREVIEW_BLOCKED",
            title="CI preview tuple blocks migration because publication parity is stale",
            environment_ref="ci-preview",
            plan_state="ready",
            verdict_state="blocked",
            rollback_mode="flag_only",
            change_type="backfill",
            route_family_ref=route_family_map["ops"][0],
            projection_family_ref=route_family_map["ops"][1],
            projection_version_ref=route_family_map["ops"][2],
            projection_version_set_ref=route_family_map["ops"][3],
            audience_surface_ref=route_family_map["ops"][4],
            surface_runtime_binding_ref=route_family_map["ops"][5],
            publication_bundle=bundles["ci-preview"],
            parity_record=parities["ci-preview"],
            publication_state="stale",
            parity_state="stale",
            route_exposure_state=parities["ci-preview"]["routeExposureState"],
            observation_state="stale",
            route_posture_state="freeze_conflict",
            allowed_surface_state="blocked",
            settlement_result="blocked_policy",
            lag_state="blocked",
            coverage_state="incompatible",
            compatibility_state="stale",
            cutover_state="blocked",
            observed_minutes=0,
            observed_samples=0,
            comparison_matches=False,
            rollback_mode_matches=True,
            summary="Preview remains fail-closed because the current ci-preview publication bundle is already stale and cannot authorize schema or backfill work.",
            notes=[
                "The rehearsal runner still produces a governed blocked settlement instead of falling through to ad hoc SQL or a local bypass.",
            ],
        ),
        build_record(
            scenario_id="INTEGRATION_CONFLICT",
            title="Integration conflict blocks staff workspace backfill",
            environment_ref="integration",
            plan_state="blocked",
            verdict_state="blocked",
            rollback_mode="binary_safe",
            change_type="backfill",
            route_family_ref=route_family_map["workspace"][0],
            projection_family_ref=route_family_map["workspace"][1],
            projection_version_ref=route_family_map["workspace"][2],
            projection_version_set_ref=route_family_map["workspace"][3],
            audience_surface_ref=route_family_map["workspace"][4],
            surface_runtime_binding_ref=route_family_map["workspace"][5],
            publication_bundle=bundles["integration"],
            parity_record=parities["integration"],
            publication_state="conflict",
            parity_state="conflict",
            route_exposure_state=parities["integration"]["routeExposureState"],
            observation_state="stale",
            route_posture_state="freeze_conflict",
            allowed_surface_state="blocked",
            settlement_result="blocked_policy",
            lag_state="blocked",
            coverage_state="incompatible",
            compatibility_state="incompatible",
            cutover_state="blocked",
            observed_minutes=0,
            observed_samples=0,
            comparison_matches=False,
            rollback_mode_matches=True,
            summary="Integration cannot start because the runtime tuple is in conflict and the backfill runner refuses to treat the projection worker as business truth.",
            notes=[
                "Conflict posture remains explicit at the route-family level.",
            ],
        ),
        build_record(
            scenario_id="LOCAL_ROLLBACK_MISMATCH",
            title="Local contractive cutover fails because rollback proof diverged",
            environment_ref="local",
            plan_state="ready",
            verdict_state="blocked",
            rollback_mode="binary_safe",
            change_type="contractive",
            route_family_ref=route_family_map["ops"][0],
            projection_family_ref=route_family_map["ops"][1],
            projection_version_ref=route_family_map["ops"][2],
            projection_version_set_ref=route_family_map["ops"][3],
            audience_surface_ref=route_family_map["ops"][4],
            surface_runtime_binding_ref=route_family_map["ops"][5],
            publication_bundle=bundles["local"],
            parity_record=parities["local"],
            publication_state="published",
            parity_state="exact",
            route_exposure_state=parities["local"]["routeExposureState"],
            observation_state="rollback_required",
            route_posture_state="rollback_required",
            allowed_surface_state="blocked",
            settlement_result="rollback_required",
            lag_state="within_budget",
            coverage_state="converged",
            compatibility_state="exact",
            cutover_state="rollback_only",
            observed_minutes=45,
            observed_samples=4,
            comparison_matches=True,
            rollback_mode_matches=False,
            summary="Cutover remains blocked because rollback evidence no longer matches the bound publication tuple, so the contract phase cannot start.",
            notes=[
                "This closes the rollback-posture gap: green backfill alone is not enough.",
            ],
        ),
        build_record(
            scenario_id="PREPROD_WITHDRAWN",
            title="Preprod support replay remains withdrawn until publication recovers",
            environment_ref="preprod",
            plan_state="blocked",
            verdict_state="blocked",
            rollback_mode="rollforward_only",
            change_type="rollforward_only",
            route_family_ref=route_family_map["support"][0],
            projection_family_ref=route_family_map["support"][1],
            projection_version_ref=route_family_map["support"][2],
            projection_version_set_ref=route_family_map["support"][3],
            audience_surface_ref=route_family_map["support"][4],
            surface_runtime_binding_ref=route_family_map["support"][5],
            publication_bundle=bundles["preprod"],
            parity_record=parities["preprod"],
            publication_state="withdrawn",
            parity_state="withdrawn",
            route_exposure_state=parities["preprod"]["routeExposureState"],
            observation_state="stale",
            route_posture_state="freeze_conflict",
            allowed_surface_state="blocked",
            settlement_result="blocked_policy",
            lag_state="blocked",
            coverage_state="incompatible",
            compatibility_state="incompatible",
            cutover_state="blocked",
            observed_minutes=0,
            observed_samples=0,
            comparison_matches=False,
            rollback_mode_matches=False,
            summary="Withdrawn publication authority blocks support replay migration entirely; no backfill or route live posture is inferred from historical rows.",
            notes=[
                "Rollforward-only posture remains blocked when publication itself is withdrawn.",
            ],
        ),
    ]

    matrix_rows = []
    for record in records:
        matrix_rows.append(
            {
                "scenario_id": record["scenarioId"],
                "environment": record["environmentRef"],
                "plan_state": record["planState"],
                "route_family_ref": record["plan"]["affectedRouteFamilyRefs"][0],
                "projection_family_ref": record["backfillPlan"]["projectionFamilyRef"],
                "projection_version_set_ref": record["binding"]["projectionContractVersionSetRefs"][0],
                "verdict_state": record["verdictState"],
                "allowed_surface_state": record["allowedSurfaceState"],
                "publication_state": record["publicationState"],
                "parity_state": record["parityState"],
                "route_exposure_state": record["routeExposureState"],
                "observation_state": record["observationState"],
                "settlement_result": record["settlementResult"],
                "rollback_mode": record["rollbackMode"],
                "rollback_mode_matches": str(record["rollbackModeMatches"]).lower(),
                "comparison_matches": str(record["comparisonMatches"]).lower(),
            }
        )

    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": GENERATED_AT[:10],
        "visual_mode": VISUAL_MODE,
        "source_precedence": [
            "prompt/095.md",
            "prompt/shared_operating_contract_086_to_095.md",
            "prompt/AGENT.md",
            "prompt/checklist.md",
            "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionBackfillPlan",
            "blueprint/platform-runtime-and-release-blueprint.md#ProjectionReadinessVerdict",
            "blueprint/platform-runtime-and-release-blueprint.md#MigrationExecutionBinding",
            "blueprint/platform-runtime-and-release-blueprint.md#MigrationActionSettlement",
            "data/analysis/runtime_publication_bundles.json",
            "data/analysis/release_publication_parity_records.json",
            "data/analysis/projection_checkpoint_manifest.json",
            "data/analysis/projection_rebuild_casebook.json",
        ],
        "upstream_inputs": [
            "data/analysis/runtime_publication_bundles.json",
            "data/analysis/release_publication_parity_records.json",
            "data/analysis/projection_checkpoint_manifest.json",
            "data/analysis/projection_rebuild_casebook.json",
        ],
        "follow_on_dependencies": [
            {
                "dependencyId": "FOLLOW_ON_DEPENDENCY_095_CI_PREVIEW_PUBLICATION_RECOVERY",
                "title": "ci-preview execution remains blocked until publication parity recovers",
                "bounded_seam": (
                    "The governed runner already emits blocked settlements for stale non-production tuples. "
                    "A later release/publication recovery task can switch the CI rehearsal target from local "
                    "seeded tuples to exact ci-preview tuples without changing plan or settlement semantics."
                ),
            }
        ],
        "summary": {
            "scenario_count": len(records),
            "ready_count": sum(1 for row in records if row["verdictState"] == "ready"),
            "constrained_count": sum(1 for row in records if row["verdictState"] == "constrained"),
            "blocked_count": sum(1 for row in records if row["verdictState"] == "blocked"),
            "rollforward_only_count": sum(1 for row in records if row["rollbackMode"] == "rollforward_only"),
            "rollback_required_count": sum(1 for row in records if row["settlementResult"] == "rollback_required"),
            "publication_blocked_count": sum(
                1 for row in records if row["publicationState"] in {"stale", "conflict", "withdrawn"}
            ),
            "observation_open_count": sum(1 for row in records if row["observationState"] == "open"),
        },
        "records": records,
        "matrix_rows": matrix_rows,
        "projection_casebook_summary": projection_casebook["summary"],
        "catalog_digest_ref": stable_hash(records),
    }


def patch_public_api_test() -> None:
    source = PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    source = source.replace(
        'expect(harness.backfillPlan.backfillPlanId).toBe("PBP_095_PATIENT_REQUESTS_V2");',
        'expect(harness.backfillPlan.backfillPlanId).toBe("PBP_095_PATIENT_REQUESTS_DUAL_READ");',
    )
    import_anchor = "  createProjectionRebuildSimulationHarness,\n"
    if "createMigrationBackfillSimulationHarness," not in source:
        if import_anchor not in source:
            raise RuntimeError("PREREQUISITE_GAP_095_PUBLIC_API_IMPORT_ANCHOR")
        source = source.replace(
            import_anchor,
            import_anchor + "  createMigrationBackfillSimulationHarness,\n",
            1,
        )
    if 'it("runs the migration and backfill simulation harness"' not in source:
        block_anchor = 'it("runs the projection rebuild simulation harness", () => {'
        anchor_index = source.find(block_anchor)
        if anchor_index == -1:
            raise RuntimeError("PREREQUISITE_GAP_095_PUBLIC_API_BLOCK_ANCHOR")
        addition = dedent(
            """
              it("runs the migration and backfill simulation harness", () => {
                const harness = createMigrationBackfillSimulationHarness();
                expect(harness.plan.migrationPlanId).toBe("SMP_095_PATIENT_REQUESTS_ADDITIVE");
                expect(harness.backfillPlan.backfillPlanId).toBe("PBP_095_PATIENT_REQUESTS_DUAL_READ");
                expect(typeof harness.runner.execute).toBe("function");
              });

            """
        )
        source = source[:anchor_index] + addition + source[anchor_index:]
    write_text(PUBLIC_API_TEST_PATH, source)


def patch_release_controls_index() -> None:
    source = INDEX_PATH.read_text(encoding="utf-8")
    block = dedent(
        """
        // par_095_migration_backfill_exports:start
        export * from "./migration-backfill";
        // par_095_migration_backfill_exports:end
        """
    ).strip()
    if "par_095_migration_backfill_exports:start" in source:
        before, _, remainder = source.partition("// par_095_migration_backfill_exports:start")
        _, _, after = remainder.partition("// par_095_migration_backfill_exports:end")
        source = before.rstrip() + "\n\n" + block + "\n\n" + after.lstrip()
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
        raise RuntimeError("PREREQUISITE_GAP_095_RELEASE_CONTROLS_EXPORT_ANCHOR")
    write_text(INDEX_PATH, source)


def patch_workflows() -> None:
    ci_workflow = WORKFLOW_CI_PATH.read_text(encoding="utf-8")
    if "pnpm ci:rehearse-migration-backfill" not in ci_workflow:
        anchor = "      - run: pnpm ci:verify-runtime-publication\n"
        if anchor not in ci_workflow:
            raise RuntimeError("PREREQUISITE_GAP_095_CI_WORKFLOW_ANCHOR")
        ci_workflow = ci_workflow.replace(
            anchor,
            anchor
            + "      - run: pnpm ci:rehearse-migration-backfill\n"
            + "      - run: pnpm ci:verify-migration-backfill\n",
            1,
        )
    write_text(WORKFLOW_CI_PATH, ci_workflow)

    promotion_workflow = WORKFLOW_PROMOTION_PATH.read_text(encoding="utf-8")
    if "pnpm ci:rehearse-migration-backfill" not in promotion_workflow:
        anchor = "      - run: pnpm ci:verify-runtime-publication -- --environment ci-preview\n"
        if anchor not in promotion_workflow:
            raise RuntimeError("PREREQUISITE_GAP_095_PROMOTION_WORKFLOW_ANCHOR")
        promotion_workflow = promotion_workflow.replace(
            anchor,
            anchor
            + "      - run: pnpm ci:rehearse-migration-backfill\n"
            + "      - run: pnpm ci:verify-migration-backfill\n",
            1,
        )
    write_text(WORKFLOW_PROMOTION_PATH, promotion_workflow)


def main() -> None:
    schema_migration_schema, backfill_schema = build_schemas()
    catalog = build_catalog()
    write_json(SCHEMA_PATH, schema_migration_schema)
    write_json(BACKFILL_SCHEMA_PATH, backfill_schema)
    write_json(CATALOG_PATH, catalog)
    write_csv(
        MATRIX_PATH,
        [
            "scenario_id",
            "environment",
            "plan_state",
            "route_family_ref",
            "projection_family_ref",
            "projection_version_set_ref",
            "verdict_state",
            "allowed_surface_state",
            "publication_state",
            "parity_state",
            "route_exposure_state",
            "observation_state",
            "settlement_result",
            "rollback_mode",
            "rollback_mode_matches",
            "comparison_matches",
        ],
        catalog["matrix_rows"],
    )
    patch_release_controls_index()
    patch_public_api_test()
    patch_workflows()


if __name__ == "__main__":
    main()
