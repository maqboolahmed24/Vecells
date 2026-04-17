#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"

CATALOG_PATH = DATA_DIR / "canary_scenario_catalog.json"
PREVIEW_SCHEMA_PATH = DATA_DIR / "wave_action_preview_schema.json"
SETTLEMENT_SCHEMA_PATH = DATA_DIR / "wave_action_settlement_schema.json"
GUARDRAIL_MATRIX_PATH = DATA_DIR / "canary_guardrail_matrix.csv"

TASK_ID = "par_102"
VISUAL_MODE = "Canary_And_Rollback_Cockpit"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

MISSION = (
    "Publish one authoritative non-production canary and rollback harness that rehearses "
    "wave-action preview, execution, observation, settlement, rollback evidence, supersession, "
    "and kill-switch posture before any live production rollout exists."
)

SOURCE_PRECEDENCE = [
    "prompt/102.md",
    "prompt/shared_operating_contract_096_to_105.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveGuardrailSnapshot",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveActionImpactPreview",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveActionExecutionReceipt",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveActionRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveActionSettlement",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/phase-0-the-foundation-protocol.md#1.24C ReleaseWatchEvidenceCockpit",
    "blueprint/platform-admin-and-config-blueprint.md#Guarded promotion, rollback, and kill-switch expectations",
    "blueprint/operations-console-frontend-blueprint.md#Watch-surface expectations",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
    "data/analysis/release_watch_pipeline_catalog.json",
    "data/analysis/resilience_baseline_catalog.json",
    "data/analysis/build_provenance_manifest.json",
    "data/analysis/gateway_surface_manifest.json",
]

GAP_RESOLUTIONS = [
    {
        "gapId": "GAP_RESOLUTION_CANARY_RING_NONPROD",
        "summary": (
            "par_102 fixes the rehearsal ring set to local, ci-preview, integration, and preprod-like "
            "surfaces now, so later live cohort logic can harden blast-radius controls without rewriting "
            "the canonical wave-action objects."
        ),
    },
    {
        "gapId": "GAP_RECOVERY_DISPOSITION_READ_ONLY_OR_RECOVERY_ONLY",
        "summary": (
            "Where richer recovery dispositions are not yet authored, the harness narrows posture to "
            "read_only or recovery_only and still requires explicit rollback target, runbook binding, "
            "and recovery evidence before accepting the action."
        ),
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_WAVE_GOVERNANCE_APPROVALS",
        "summary": (
            "Later governance approvals may add stronger operator confirmation, incident linkage, and "
            "blast-radius authorization without changing the meaning of preview, receipt, observation, "
            "or settlement records published here."
        ),
    },
    {
        "dependencyId": "FOLLOW_ON_DEPENDENCY_103_SHELL_ROLLOUT_SURFACE_BINDING",
        "summary": (
            "The shell-facing runtime cockpit can extend presentation and handoff layers later, but it "
            "must consume the same canary scenario catalog and settled wave-action objects emitted now."
        ),
    },
]


def run_typescript_export() -> list[dict[str, Any]]:
    script = """
import { listCanaryScenarioDefinitions, buildCanaryScenario } from "./tools/runtime-canary-rollback/shared.ts";

const outputs = listCanaryScenarioDefinitions().map((definition) => {
  const output = buildCanaryScenario(definition);
  return {
    definition,
    context: output.context,
    guardrailSnapshot: output.rehearsal.guardrailSnapshot,
    impactPreview: output.rehearsal.impactPreview,
    supersededImpactPreview: output.rehearsal.supersededImpactPreview,
    actionRecord: output.rehearsal.actionRecord,
    executionReceipt: output.rehearsal.executionReceipt,
    observationWindow: output.rehearsal.observationWindow,
    settlement: output.rehearsal.settlement,
    cockpit: output.rehearsal.cockpit,
    auditTrail: output.rehearsal.auditTrail,
    history: output.rehearsal.history,
    summary: output.summary,
  };
});

console.log(JSON.stringify(outputs));
"""
    result = subprocess.run(
        ["pnpm", "exec", "tsx", "-"],
        cwd=ROOT,
        input=script,
        capture_output=True,
        check=True,
        text=True,
    )
    return json.loads(result.stdout)


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


def create_preview_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/wave_action_preview_schema.json",
        "title": "WaveActionImpactPreview",
        "type": "object",
        "required": [
            "waveActionImpactPreviewId",
            "releaseRef",
            "environmentRing",
            "actionType",
            "previewState",
            "expectedObservationState",
            "expectedSettlementState",
            "expectedCockpitState",
            "runtimePublicationBundleRef",
            "targetPublicationBundleRef",
            "rollbackTargetPublicationBundleRef",
            "releasePublicationParityRef",
            "releaseWatchTupleRef",
            "waveObservationPolicyRef",
            "waveControlFenceRef",
            "operationalReadinessSnapshotRef",
            "buildProvenanceRef",
            "waveGuardrailSnapshotRef",
            "rollbackRunbookBindingRefs",
            "rollbackReadinessEvidenceRefs",
            "blastRadius",
            "blockerRefs",
            "warningRefs",
            "previewHash",
            "generatedAt",
            "sourceRefs",
        ],
        "properties": {
            "waveActionImpactPreviewId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "environmentRing": {"type": "string"},
            "actionType": {
                "type": "string",
                "enum": [
                    "canary_start",
                    "widen",
                    "pause",
                    "rollback",
                    "rollforward",
                    "kill_switch",
                ],
            },
            "previewState": {
                "type": "string",
                "enum": ["preview", "blocked", "superseded"],
            },
            "expectedObservationState": {
                "type": "string",
                "enum": [
                    "pending",
                    "observed",
                    "satisfied",
                    "constrained",
                    "rollback_required",
                    "superseded",
                ],
            },
            "expectedSettlementState": {
                "type": "string",
                "enum": [
                    "accepted_pending_observation",
                    "satisfied",
                    "constrained",
                    "rollback_required",
                    "superseded",
                    "blocked",
                ],
            },
            "expectedCockpitState": {
                "type": "string",
                "enum": [
                    "preview",
                    "accepted",
                    "observed",
                    "satisfied",
                    "constrained",
                    "rollback_required",
                    "superseded",
                ],
            },
            "runtimePublicationBundleRef": {"type": "string"},
            "targetPublicationBundleRef": {"type": "string"},
            "rollbackTargetPublicationBundleRef": {"type": ["string", "null"]},
            "releasePublicationParityRef": {"type": "string"},
            "releaseWatchTupleRef": {"type": "string"},
            "waveObservationPolicyRef": {"type": "string"},
            "waveControlFenceRef": {"type": "string"},
            "operationalReadinessSnapshotRef": {"type": "string"},
            "buildProvenanceRef": {"type": "string"},
            "waveGuardrailSnapshotRef": {"type": "string"},
            "rollbackRunbookBindingRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "rollbackReadinessEvidenceRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "blastRadius": {
                "type": "object",
                "required": [
                    "affectedTenantCount",
                    "affectedOrganisationCount",
                    "affectedRouteFamilyRefs",
                    "affectedAudienceSurfaceRefs",
                    "affectedGatewaySurfaceRefs",
                    "blastRadiusClass",
                ],
                "properties": {
                    "affectedTenantCount": {"type": "integer", "minimum": 0},
                    "affectedOrganisationCount": {"type": "integer", "minimum": 0},
                    "affectedRouteFamilyRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                    },
                    "affectedAudienceSurfaceRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                    },
                    "affectedGatewaySurfaceRefs": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                    },
                    "blastRadiusClass": {
                        "type": "string",
                        "enum": ["narrow", "medium", "broad"],
                    },
                },
                "additionalProperties": False,
            },
            "blockerRefs": {"type": "array", "items": {"type": "string"}},
            "warningRefs": {"type": "array", "items": {"type": "string"}},
            "previewHash": {"type": "string"},
            "generatedAt": {"type": "string"},
            "sourceRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
        },
        "additionalProperties": False,
    }


def create_settlement_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/wave_action_settlement_schema.json",
        "title": "WaveActionSettlement",
        "type": "object",
        "required": [
            "waveActionSettlementId",
            "waveActionRecordRef",
            "waveActionExecutionReceiptRef",
            "waveActionObservationWindowRef",
            "impactPreviewRef",
            "releaseRef",
            "environmentRing",
            "actionType",
            "settlementState",
            "cockpitState",
            "guardrailState",
            "watchState",
            "rollbackReadinessState",
            "recoveryDispositionState",
            "blockerRefs",
            "warningRefs",
            "settledAt",
            "sourceRefs",
        ],
        "properties": {
            "waveActionSettlementId": {"type": "string"},
            "waveActionRecordRef": {"type": "string"},
            "waveActionExecutionReceiptRef": {"type": "string"},
            "waveActionObservationWindowRef": {"type": "string"},
            "impactPreviewRef": {"type": "string"},
            "releaseRef": {"type": "string"},
            "environmentRing": {"type": "string"},
            "actionType": {
                "type": "string",
                "enum": [
                    "canary_start",
                    "widen",
                    "pause",
                    "rollback",
                    "rollforward",
                    "kill_switch",
                ],
            },
            "settlementState": {
                "type": "string",
                "enum": [
                    "accepted_pending_observation",
                    "satisfied",
                    "constrained",
                    "rollback_required",
                    "superseded",
                    "blocked",
                ],
            },
            "cockpitState": {
                "type": "string",
                "enum": [
                    "preview",
                    "accepted",
                    "observed",
                    "satisfied",
                    "constrained",
                    "rollback_required",
                    "superseded",
                ],
            },
            "guardrailState": {
                "type": "string",
                "enum": ["green", "constrained", "rollback_review_required", "frozen"],
            },
            "watchState": {
                "type": "string",
                "enum": ["accepted", "blocked", "rollback_required", "satisfied", "stale"],
            },
            "rollbackReadinessState": {
                "type": "string",
                "enum": ["ready", "constrained", "stale", "blocked"],
            },
            "recoveryDispositionState": {
                "type": "string",
                "enum": ["normal", "read_only", "recovery_only", "kill_switch_active"],
            },
            "blockerRefs": {"type": "array", "items": {"type": "string"}},
            "warningRefs": {"type": "array", "items": {"type": "string"}},
            "settledAt": {"type": "string"},
            "sourceRefs": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
        },
        "additionalProperties": False,
    }


def create_history_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for record in records:
        scenario_id = record["definition"]["scenarioId"]
        context = record["context"]
        for index, entry in enumerate(record["history"], start=1):
            summary = (
                f"{record['definition']['actionType']} {entry['phase']} reached {entry['state']} "
                f"for {context['environmentRing']}."
            )
            rows.append(
                {
                    "scenarioId": scenario_id,
                    "phase": entry["phase"],
                    "state": entry["state"],
                    "ref": entry["ref"],
                    "sequence": index,
                    "recordedAt": context["now"],
                    "summary": summary,
                }
            )
    return rows


def build_catalog(records: list[dict[str, Any]]) -> dict[str, Any]:
    history_rows = create_history_rows(records)
    scenario_rows = []
    for record in records:
        summary = record["summary"]
        context = record["context"]
        scenario_rows.append(
            {
                "scenarioId": summary["scenarioId"],
                "title": summary["title"],
                "description": summary["description"],
                "environmentRing": summary["environmentRing"],
                "actionType": summary["actionType"],
                "releaseRef": context["releaseRef"],
                "runtimePublicationBundleRef": context["runtimePublicationBundleRef"],
                "targetPublicationBundleRef": context["targetPublicationBundleRef"],
                "rollbackTargetPublicationBundleRef": summary["rollbackTargetPublicationBundleRef"],
                "releasePublicationParityRef": context["releasePublicationParityRef"],
                "releaseWatchTupleRef": context["releaseWatchTupleRef"],
                "waveObservationPolicyRef": context["waveObservationPolicyRef"],
                "waveControlFenceRef": context["waveControlFenceRef"],
                "operationalReadinessSnapshotRef": context["operationalReadinessSnapshotRef"],
                "buildProvenanceRef": context["buildProvenanceRef"],
                "context": context,
                "guardrailSnapshot": record["guardrailSnapshot"],
                "impactPreview": record["impactPreview"],
                "supersededImpactPreview": record["supersededImpactPreview"],
                "actionRecord": record["actionRecord"],
                "executionReceipt": record["executionReceipt"],
                "observationWindow": record["observationWindow"],
                "settlement": record["settlement"],
                "cockpit": record["cockpit"],
                "auditTrail": record["auditTrail"],
                "history": record["history"],
                "summary": summary,
            }
        )

    cockpit_states = [row["settlement"]["cockpitState"] for row in scenario_rows]
    guardrail_states = [row["guardrailSnapshot"]["guardrailState"] for row in scenario_rows]

    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "gap_resolutions": GAP_RESOLUTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "summary": {
            "scenario_count": len(scenario_rows),
            "environment_count": len({row["environmentRing"] for row in scenario_rows}),
            "action_count": len({row["actionType"] for row in scenario_rows}),
            "green_guardrail_count": guardrail_states.count("green"),
            "constrained_guardrail_count": guardrail_states.count("constrained"),
            "frozen_guardrail_count": guardrail_states.count("frozen"),
            "accepted_count": cockpit_states.count("accepted"),
            "satisfied_count": cockpit_states.count("satisfied"),
            "constrained_count": cockpit_states.count("constrained"),
            "rollback_required_count": cockpit_states.count("rollback_required"),
            "superseded_preview_count": sum(
                1 for row in scenario_rows if row["supersededImpactPreview"] is not None
            ),
            "history_row_count": len(history_rows),
        },
        "records": scenario_rows,
        "history_rows": history_rows,
    }


def build_guardrail_rows(catalog: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for row in catalog["records"]:
        context = row["context"]
        summary = row["summary"]
        rows.append(
            {
                "scenario_id": row["scenarioId"],
                "environment_ring": row["environmentRing"],
                "action_type": row["actionType"],
                "release_ref": row["releaseRef"],
                "blast_radius_class": row["impactPreview"]["blastRadius"]["blastRadiusClass"],
                "guardrail_state": row["guardrailSnapshot"]["guardrailState"],
                "preview_state": row["impactPreview"]["previewState"],
                "execution_state": row["executionReceipt"]["executionState"],
                "observation_state": row["observationWindow"]["observationState"],
                "settlement_state": row["settlement"]["settlementState"],
                "cockpit_state": row["settlement"]["cockpitState"],
                "watch_state": summary["watchState"],
                "readiness_state": summary["readinessState"],
                "rollback_readiness_state": summary["rollbackReadinessState"],
                "trust_state": context["trustState"],
                "continuity_state": context["continuityState"],
                "tuple_freshness_state": context["tupleFreshnessState"],
                "recovery_disposition_state": context["recoveryDispositionState"],
                "rollback_target_publication_bundle_ref": summary[
                    "rollbackTargetPublicationBundleRef"
                ]
                or "",
                "superseded_preview_present": "yes"
                if row["supersededImpactPreview"] is not None
                else "no",
                "blocker_refs": "|".join(row["settlement"]["blockerRefs"]),
                "warning_refs": "|".join(row["settlement"]["warningRefs"]),
            }
        )
    return rows


def main() -> None:
    records = run_typescript_export()
    catalog = build_catalog(records)
    preview_schema = create_preview_schema()
    settlement_schema = create_settlement_schema()
    guardrail_rows = build_guardrail_rows(catalog)

    write_json(CATALOG_PATH, catalog)
    write_json(PREVIEW_SCHEMA_PATH, preview_schema)
    write_json(SETTLEMENT_SCHEMA_PATH, settlement_schema)
    write_csv(
        GUARDRAIL_MATRIX_PATH,
        guardrail_rows,
        [
            "scenario_id",
            "environment_ring",
            "action_type",
            "release_ref",
            "blast_radius_class",
            "guardrail_state",
            "preview_state",
            "execution_state",
            "observation_state",
            "settlement_state",
            "cockpit_state",
            "watch_state",
            "readiness_state",
            "rollback_readiness_state",
            "trust_state",
            "continuity_state",
            "tuple_freshness_state",
            "recovery_disposition_state",
            "rollback_target_publication_bundle_ref",
            "superseded_preview_present",
            "blocker_refs",
            "warning_refs",
        ],
    )


if __name__ == "__main__":
    main()
