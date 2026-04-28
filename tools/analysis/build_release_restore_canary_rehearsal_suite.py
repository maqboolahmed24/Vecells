#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DOCS_DIR = ROOT / "docs" / "tests"
DATA_TEST_DIR = ROOT / "data" / "test"
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_RELEASE_DIR = ROOT / "data" / "release"

SUITE_DOC_PATH = DOCS_DIR / "137_release_restore_canary_rehearsal_suite.md"
TRUTH_MATRIX_DOC_PATH = DOCS_DIR / "137_release_watch_and_recovery_truth_matrix.md"
COCKPIT_PATH = DOCS_DIR / "137_release_rehearsal_cockpit.html"

REHEARSAL_CASES_PATH = DATA_TEST_DIR / "137_rehearsal_cases.csv"
WAVE_CASES_PATH = DATA_TEST_DIR / "137_wave_observation_cases.csv"
RESTORE_CASES_PATH = DATA_TEST_DIR / "137_restore_readiness_cases.csv"
EXPECTATIONS_PATH = DATA_TEST_DIR / "137_release_rehearsal_expectations.json"
RESULTS_PATH = DATA_TEST_DIR / "137_rehearsal_results.json"

PREVIEW_MANIFEST_PATH = DATA_ANALYSIS_DIR / "preview_environment_manifest.json"
TOPOLOGY_PUBLICATION_MATRIX_PATH = DATA_ANALYSIS_DIR / "runtime_topology_publication_matrix.csv"
RELEASE_WATCH_CATALOG_PATH = DATA_ANALYSIS_DIR / "release_watch_pipeline_catalog.json"
RELEASE_WATCH_EVIDENCE_PATH = DATA_ANALYSIS_DIR / "release_watch_required_evidence.csv"
ROLLBACK_TRIGGER_MATRIX_PATH = DATA_ANALYSIS_DIR / "rollback_trigger_matrix.csv"
CANARY_CATALOG_PATH = DATA_ANALYSIS_DIR / "canary_scenario_catalog.json"
RESILIENCE_CATALOG_PATH = DATA_ANALYSIS_DIR / "resilience_baseline_catalog.json"
READINESS_MATRIX_PATH = DATA_ANALYSIS_DIR / "readiness_coverage_matrix.csv"
SHELL_SUITE_RESULTS_PATH = DATA_TEST_DIR / "136_preview_environment_suite_results.json"
RELEASE_CANDIDATE_PATH = DATA_RELEASE_DIR / "release_candidate_tuple.json"
FREEZE_BLOCKERS_PATH = DATA_RELEASE_DIR / "freeze_blockers.json"

TASK_ID = "seq_137"
VISUAL_MODE = "Release_Rehearsal_Cockpit"
SUITE_VERDICT = "rehearsal_exact_live_withheld"

SOURCE_PRECEDENCE = [
    "prompt/137.md",
    "prompt/138.md",
    "prompt/shared_operating_contract_136_to_145.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#card-1-mandatory-phase-0-tests",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveActionSettlement",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchEvidenceCockpit",
    "blueprint/phase-0-the-foundation-protocol.md#ReleaseApprovalFreeze",
    "blueprint/phase-0-the-foundation-protocol.md#RecoveryControlPosture",
    "blueprint/forensic-audit-findings.md",
    "data/release/release_candidate_tuple.json",
    "data/release/freeze_blockers.json",
    "data/analysis/release_watch_pipeline_catalog.json",
    "data/analysis/release_watch_required_evidence.csv",
    "data/analysis/canary_scenario_catalog.json",
    "data/analysis/resilience_baseline_catalog.json",
    "data/analysis/readiness_coverage_matrix.csv",
    "data/analysis/preview_environment_manifest.json",
    "data/analysis/runtime_topology_publication_matrix.csv",
    "data/test/136_preview_environment_suite_results.json",
]

ORCHESTRATED_SPECS = [
    "preview-environment-control-room.spec.js",
    "release-candidate-freeze-board.spec.js",
    "release-watch-pipeline-cockpit.spec.js",
    "resilience-baseline-cockpit.spec.js",
    "canary-and-rollback-cockpit.spec.js",
]

REQUIRED_MAIN_CASE_IDS = [
    "PREVIEW_CI_PREVIEW_PATIENT_BINDING_PRESENT",
    "LOCAL_RELEASE_FREEZE_PARTIAL_GATEWAY_SURFACES",
    "PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION",
    "LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION",
    "LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION",
    "CI_PREVIEW_PAUSE_ON_CONSTRAINED_GUARDRAIL",
    "INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH",
    "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
    "LOCAL_RESTORE_REQUIRES_JOURNEY_VALIDATION_AND_FRESH_RUNBOOK",
    "INTEGRATION_RESTORE_BLOCKED_PROOF_PREVENTS_CONTROL",
    "PREPROD_TUPLE_DRIFT_KEEPS_RECOVERY_WITHHELD",
]

REQUIRED_WAVE_CASE_IDS = [
    "LOCAL_CANARY_START_HAPPY_PATH",
    "LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION",
    "CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL",
    "INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH",
    "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
    "LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE",
]

REQUIRED_RESTORE_CASE_IDS = [
    "LOCAL_EXACT_READY",
    "LOCAL_STALE_REHEARSAL",
    "CI_PREVIEW_MISSING_BACKUP_MANIFEST",
    "INTEGRATION_BLOCKED_RESTORE_PROOF",
    "PREPROD_TUPLE_DRIFT",
    "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def load_json(path: Path) -> Any:
    require(path.exists(), f"PREREQUISITE_GAP_137_MISSING::{path.name}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    require(path.exists(), f"PREREQUISITE_GAP_137_MISSING::{path.name}")
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def join_refs(values: list[str] | tuple[str, ...] | set[str]) -> str:
    flattened = [value for value in values if value]
    return "; ".join(flattened)


def md_table(headers: list[str], rows: list[list[str]]) -> str:
    header_row = "| " + " | ".join(headers) + " |"
    divider = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows]
    return "\n".join([header_row, divider, *body])


def slug_case(case_id: str) -> str:
    return case_id.lower().replace("_", "-")


def posture_from_recovery(recovery_state: str) -> str:
    return {
        "normal": "diagnostic_only_nonprod",
        "read_only": "read_only_revalidation",
        "recovery_only": "recovery_only",
        "kill_switch_active": "kill_switch_only",
    }.get(recovery_state, "control_withheld")


def restore_posture_from_readiness(readiness_state: str) -> str:
    return {
        "exact_and_ready": "rehearsed_nonprod_only",
        "stale_rehearsal_evidence": "revalidation_required",
        "missing_backup_manifest": "restore_blocked_missing_manifest",
        "blocked_restore_proof": "restore_blocked",
        "tuple_drift": "tuple_drift_recovery_only",
        "assurance_or_freeze_blocked": "freeze_or_assurance_read_only",
    }[readiness_state]


def control_state_from_outcome(outcome_state: str) -> str:
    return {
        "withheld": "preview_only",
        "blocked": "suppressed",
        "accepted_pending_observation": "diagnostic_only",
        "satisfied_but_live_withheld": "diagnostic_only",
        "constrained": "suppressed",
        "rollback_required": "suppressed",
        "kill_switch_active": "suppressed",
        "restore_verified_live_withheld": "diagnostic_only",
        "restore_blocked": "suppressed",
        "tuple_drift_blocked": "recovery_only",
    }[outcome_state]


def brief_hash(value: str) -> str:
    return value[:12]


def first(items: list[dict[str, Any]], **conditions: str) -> dict[str, Any]:
    for item in items:
        if all(item.get(key) == value for key, value in conditions.items()):
            return item
    raise RuntimeError(f"PREREQUISITE_GAP_137_LOOKUP::{conditions}")


def build_main_cases(
    release_candidate_export: dict[str, Any],
    preview_manifest: dict[str, Any],
    topology_rows: list[dict[str, str]],
    watch_catalog: dict[str, Any],
    watch_evidence_rows: list[dict[str, str]],
    trigger_rows: list[dict[str, str]],
    canary_catalog: dict[str, Any],
    resilience_catalog: dict[str, Any],
    shell_suite_results: dict[str, Any],
    blockers_export: dict[str, Any],
) -> list[dict[str, Any]]:
    ring_by_ref = {
        row["environmentRing"]: row
        for row in release_candidate_export["environmentCompatibilitySummaries"]
    }
    preview_by_ref = {
        row["previewEnvironmentRef"]: row for row in preview_manifest["preview_environments"]
    }
    topology_by_id = {row["scenarioId"]: row for row in topology_rows}
    watch_by_id = {row["scenarioId"]: row for row in watch_catalog["records"]}
    canary_by_id = {row["scenarioId"]: row for row in canary_catalog["records"]}
    resilience_by_id = {row["scenarioId"]: row for row in resilience_catalog["scenarios"]}
    resilience_details_by_id = {
        row["scenarioId"]: row for row in resilience_catalog["scenarioDetails"]
    }
    shell_by_family = {
        row["shellFamily"]: row for row in shell_suite_results["shellFamilyResults"]
    }
    blocker_by_id = {row["blockerId"]: row for row in blockers_export["blockers"]}

    candidate = release_candidate_export["releaseCandidateTuple"]
    local_ring = ring_by_ref["local"]
    ci_preview_ring = ring_by_ref["ci-preview"]
    integration_ring = ring_by_ref["integration"]
    preprod_ring = ring_by_ref["preprod"]

    patient_preview = preview_by_ref["pev_branch_patient_care"]
    patient_shell = shell_by_family["patient"]
    ci_preview_topology = topology_by_id["CI_PREVIEW_AUTHORITATIVE_ALIGNMENT"]
    local_watch_satisfied = watch_by_id["LOCAL_SATISFIED"]
    local_watch_accepted = watch_by_id["LOCAL_ACCEPTED"]
    ci_preview_watch_stale = watch_by_id["CI_PREVIEW_STALE"]

    local_start = canary_by_id["LOCAL_CANARY_START_HAPPY_PATH"]
    local_widen = canary_by_id["LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION"]
    ci_preview_pause = canary_by_id["CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL"]
    integration_rollback = canary_by_id["INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH"]
    preprod_kill_switch = canary_by_id["PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE"]

    local_restore = resilience_details_by_id["LOCAL_EXACT_READY"]
    integration_restore = resilience_details_by_id["INTEGRATION_BLOCKED_RESTORE_PROOF"]
    preprod_tuple_drift = resilience_details_by_id["PREPROD_TUPLE_DRIFT"]
    preprod_freeze_blocked = resilience_details_by_id["PREPROD_ASSURANCE_OR_FREEZE_BLOCKED"]

    local_trigger_refs = [
        row["trigger_ref"]
        for row in trigger_rows
        if row["environment_ring"] == "local" and row["armed"] == "true"
    ]
    local_watch_evidence_refs = [
        row["evidence_ref"]
        for row in watch_evidence_rows
        if row["environment_ring"] == "local" and row["current_state"] == row["required_state"]
    ]

    local_surface_summary = release_candidate_export["summary"]["localSurfaceSummary"]

    cases = [
        {
            "caseId": "PREVIEW_CI_PREVIEW_PATIENT_BINDING_PRESENT",
            "phase": "preview",
            "actionClass": "preview_route_truth",
            "environmentRing": "ci-preview",
            "title": "CI preview tuple is present before any patient shell truth is advertised.",
            "requiredPublicationTuple": join_refs(
                [
                    ci_preview_ring["runtimePublicationBundleRef"],
                    ci_preview_ring["releasePublicationParityRef"],
                    patient_preview["previewEnvironmentRef"],
                    ci_preview_topology["scenarioId"],
                ]
            ),
            "requiredFreezeTuple": "preview_banner_only::no_release_reopen",
            "requiredReadinessEvidence": join_refs(
                [
                    f"publicationBindingState={patient_preview['publicationBindingState']}",
                    "seq_136::patient_shell_smoke_withheld",
                    "seq_136::publishable_live_count_zero",
                ]
            ),
            "requiredObservationDuty": "none",
            "allowedShellPostureBefore": "preview_banner_only",
            "allowedShellPostureAfter": "preview_banner_only",
            "tupleState": ci_preview_ring["overallCompatibilityState"],
            "freezeState": "preview_only",
            "trustState": patient_preview["publicationBindingState"],
            "outcomeState": "withheld",
            "interactiveControlState": control_state_from_outcome("withheld"),
            "rollbackTrigger": "preview publication drift or runtime binding mismatch withdraws shell proof immediately.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/preview_environment_manifest.json",
                    "data/analysis/runtime_topology_publication_matrix.csv",
                    "data/test/136_preview_environment_suite_results.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [
                    patient_preview["previewEnvironmentRef"],
                    ci_preview_topology["scenarioId"],
                    patient_shell["shellFamily"],
                ]
            ),
            "notes": "Preview posture is verified for preview, but the patient shell remains withheld because no publishable live shell tuple exists in the Phase 0 local surface summary.",
        },
        {
            "caseId": "LOCAL_RELEASE_FREEZE_PARTIAL_GATEWAY_SURFACES",
            "phase": "freeze",
            "actionClass": "freeze_control",
            "environmentRing": "local",
            "title": "The local release candidate stays frozen and non-writable while gateway surface compatibility remains partial.",
            "requiredPublicationTuple": join_refs(
                [
                    local_ring["runtimePublicationBundleRef"],
                    local_ring["releasePublicationParityRef"],
                    candidate["releaseRef"],
                ]
            ),
            "requiredFreezeTuple": candidate["releaseApprovalFreezeRef"],
            "requiredReadinessEvidence": join_refs(
                [
                    resilience_by_id["LOCAL_EXACT_READY"]["snapshotId"],
                    *local_watch_evidence_refs[:4],
                ]
            ),
            "requiredObservationDuty": local_watch_satisfied["expected"]["observationState"],
            "allowedShellPostureBefore": "diagnostic_only_nonprod",
            "allowedShellPostureAfter": "diagnostic_only_nonprod",
            "tupleState": local_ring["overallCompatibilityState"],
            "freezeState": candidate["freezeVerdict"],
            "trustState": "aligned",
            "outcomeState": "blocked",
            "interactiveControlState": control_state_from_outcome("blocked"),
            "rollbackTrigger": blocker_by_id["FZB_131_LOCAL_GATEWAY_SURFACES"]["summary"],
            "machineEvidenceRefs": join_refs(
                [
                    "data/release/release_candidate_tuple.json",
                    "data/release/freeze_blockers.json",
                    "data/analysis/release_watch_required_evidence.csv",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [candidate["releaseRef"], local_watch_satisfied["scenarioId"], "LOCAL_EXACT_READY"]
            ),
            "notes": f"Local publication and restore tuples are exact, but gateway surfaces stay partial and the local surface summary still reports writable_allowed_count={local_surface_summary['writable_allowed_count']}.",
        },
        {
            "caseId": "PREPROD_CHANNEL_FREEZE_BLOCKS_PROMOTION",
            "phase": "freeze",
            "actionClass": "freeze_control",
            "environmentRing": "preprod",
            "title": "Preprod channel-freeze and assurance drift suppress promotional actions even when restore artifacts exist.",
            "requiredPublicationTuple": join_refs(
                [
                    preprod_ring["runtimePublicationBundleRef"],
                    preprod_ring["releasePublicationParityRef"],
                    preprod_ring["environmentCompatibilityRef"],
                ]
            ),
            "requiredFreezeTuple": join_refs(preprod_freeze_blocked["snapshot"]["activeFreezeRefs"]),
            "requiredReadinessEvidence": join_refs(
                [
                    resilience_by_id["PREPROD_ASSURANCE_OR_FREEZE_BLOCKED"]["snapshotId"],
                    *preprod_freeze_blocked["snapshot"]["blockerRefs"],
                ]
            ),
            "requiredObservationDuty": "resume and promotion stay blocked until freeze and assurance blockers clear.",
            "allowedShellPostureBefore": "read_only_revalidation",
            "allowedShellPostureAfter": "read_only_revalidation",
            "tupleState": preprod_ring["overallCompatibilityState"],
            "freezeState": "frozen",
            "trustState": "assurance_or_freeze_blocked",
            "outcomeState": "blocked",
            "interactiveControlState": control_state_from_outcome("blocked"),
            "rollbackTrigger": "freeze::wave_pause or assurance::restore_block keeps all mutating controls suppressed.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/release/release_candidate_tuple.json",
                    "data/analysis/resilience_baseline_catalog.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [
                    preprod_ring["environmentCompatibilityRef"],
                    "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
                ]
            ),
            "notes": "This closes the gap where freeze is treated as operator convention; active freeze refs and readiness blockers directly drive read-only posture.",
        },
        {
            "caseId": "LOCAL_CANARY_START_ACCEPTED_PENDING_OBSERVATION",
            "phase": "canary",
            "actionClass": "canary_start",
            "environmentRing": "local",
            "title": "Canary start creates a fresh watch tuple and observation policy but does not report applied success.",
            "requiredPublicationTuple": join_refs(
                [
                    local_start["releaseWatchTupleRef"],
                    local_start["waveObservationPolicyRef"],
                    local_start["runtimePublicationBundleRef"],
                ]
            ),
            "requiredFreezeTuple": join_refs(local_start["cockpit"]["activeChannelFreezeRefs"]),
            "requiredReadinessEvidence": join_refs(
                [
                    local_start["operationalReadinessSnapshotRef"],
                    local_start["buildProvenanceRef"],
                    *local_start["cockpit"]["rollbackReadinessEvidenceRefs"][:2],
                ]
            ),
            "requiredObservationDuty": "Observation window must stay open until probe minimums, parity, continuity, and provenance remain exact.",
            "allowedShellPostureBefore": posture_from_recovery(local_start["context"]["recoveryDispositionState"]),
            "allowedShellPostureAfter": posture_from_recovery(local_start["context"]["recoveryDispositionState"]),
            "tupleState": local_ring["overallCompatibilityState"],
            "freezeState": "accepted_pending_observation",
            "trustState": local_start["context"]["trustState"],
            "outcomeState": "accepted_pending_observation",
            "interactiveControlState": control_state_from_outcome("accepted_pending_observation"),
            "rollbackTrigger": join_refs(local_trigger_refs[:3]),
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/canary_scenario_catalog.json",
                    "data/analysis/release_watch_pipeline_catalog.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [local_start["scenarioId"], local_watch_accepted["scenarioId"]]
            ),
            "notes": "Accepted is not applied. The start action is machine-bound to a fresh tuple and policy, but live shell reopening is still withheld.",
        },
        {
            "caseId": "LOCAL_WIDEN_RESUME_ONLY_AFTER_SATISFIED_OBSERVATION",
            "phase": "canary",
            "actionClass": "widen_resume",
            "environmentRing": "local",
            "title": "Widen and resume remain gated on satisfied observation, exact parity, and non-reopened shell truth.",
            "requiredPublicationTuple": join_refs(
                [
                    local_widen["releaseWatchTupleRef"],
                    local_widen["waveObservationPolicyRef"],
                    local_widen["runtimePublicationBundleRef"],
                ]
            ),
            "requiredFreezeTuple": candidate["releaseApprovalFreezeRef"],
            "requiredReadinessEvidence": join_refs(
                [
                    local_widen["operationalReadinessSnapshotRef"],
                    local_widen["buildProvenanceRef"],
                    local_watch_satisfied["policy"]["waveObservationPolicyId"],
                ]
            ),
            "requiredObservationDuty": "satisfied observation is mandatory, but applied success still stays impossible while the local ring remains partial.",
            "allowedShellPostureBefore": "diagnostic_only_nonprod",
            "allowedShellPostureAfter": "diagnostic_only_nonprod",
            "tupleState": local_ring["overallCompatibilityState"],
            "freezeState": "observation_satisfied",
            "trustState": local_widen["context"]["trustState"],
            "outcomeState": "satisfied_but_live_withheld",
            "interactiveControlState": control_state_from_outcome("satisfied_but_live_withheld"),
            "rollbackTrigger": "Any gateway-surface drift, continuity regression, or provenance change forces rollback or read-only recovery instead of applied success.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/release/release_candidate_tuple.json",
                    "data/analysis/canary_scenario_catalog.json",
                    "data/analysis/release_watch_pipeline_catalog.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [local_widen["scenarioId"], local_watch_satisfied["scenarioId"]]
            ),
            "notes": "Observation is satisfied here, yet the action still does not become applied because the selected local compatibility summary remains partial and shell publication is withheld.",
        },
        {
            "caseId": "CI_PREVIEW_PAUSE_ON_CONSTRAINED_GUARDRAIL",
            "phase": "canary",
            "actionClass": "pause",
            "environmentRing": "ci-preview",
            "title": "Stale preview tuple or constrained guardrail pauses rollout and suppresses writable controls immediately.",
            "requiredPublicationTuple": join_refs(
                [
                    ci_preview_pause["releaseWatchTupleRef"],
                    ci_preview_pause["waveObservationPolicyRef"],
                    ci_preview_ring["runtimePublicationBundleRef"],
                ]
            ),
            "requiredFreezeTuple": join_refs(ci_preview_pause["cockpit"]["activeChannelFreezeRefs"]),
            "requiredReadinessEvidence": join_refs(
                [
                    ci_preview_pause["operationalReadinessSnapshotRef"],
                    "stale_rehearsal_evidence",
                ]
            ),
            "requiredObservationDuty": ci_preview_watch_stale["expected"]["observationState"],
            "allowedShellPostureBefore": posture_from_recovery(ci_preview_pause["context"]["recoveryDispositionState"]),
            "allowedShellPostureAfter": posture_from_recovery(ci_preview_pause["context"]["recoveryDispositionState"]),
            "tupleState": ci_preview_ring["overallCompatibilityState"],
            "freezeState": ci_preview_pause["guardrailSnapshot"]["guardrailState"],
            "trustState": ci_preview_pause["context"]["trustState"],
            "outcomeState": "constrained",
            "interactiveControlState": control_state_from_outcome("constrained"),
            "rollbackTrigger": "Stale rehearsal evidence or constrained continuity downgrades preview posture to read-only revalidation.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/canary_scenario_catalog.json",
                    "data/analysis/release_watch_pipeline_catalog.json",
                    "data/analysis/preview_environment_manifest.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [ci_preview_pause["scenarioId"], ci_preview_watch_stale["scenarioId"]]
            ),
            "notes": "This closes the gap where preview environments are treated as inherently safe. Preview posture uses the same tuple discipline as later canary decisions.",
        },
        {
            "caseId": "INTEGRATION_ROLLBACK_ON_GUARDRAIL_PARITY_PROVENANCE_BREACH",
            "phase": "rollback",
            "actionClass": "rollback",
            "environmentRing": "integration",
            "title": "Rollback becomes authoritative when guardrails, parity, provenance, and restore readiness drift together.",
            "requiredPublicationTuple": join_refs(
                [
                    integration_rollback["releaseWatchTupleRef"],
                    integration_rollback["waveObservationPolicyRef"],
                    integration_ring["runtimePublicationBundleRef"],
                ]
            ),
            "requiredFreezeTuple": join_refs(integration_rollback["context"]["activeChannelFreezeRefs"]),
            "requiredReadinessEvidence": join_refs(
                [
                    integration_rollback["operationalReadinessSnapshotRef"],
                    integration_rollback["buildProvenanceRef"],
                    *integration_rollback["cockpit"]["rollbackRunbookBindingRefs"][:2],
                ]
            ),
            "requiredObservationDuty": "Expired observation, parity conflict, and quarantined provenance force rollback-required settlement.",
            "allowedShellPostureBefore": posture_from_recovery(integration_rollback["context"]["recoveryDispositionState"]),
            "allowedShellPostureAfter": posture_from_recovery(integration_rollback["context"]["recoveryDispositionState"]),
            "tupleState": integration_ring["overallCompatibilityState"],
            "freezeState": integration_rollback["guardrailSnapshot"]["guardrailState"],
            "trustState": integration_rollback["context"]["trustState"],
            "outcomeState": "rollback_required",
            "interactiveControlState": control_state_from_outcome("rollback_required"),
            "rollbackTrigger": "Publication conflict, parity conflict, blocked restore proof, and quarantined provenance generate rollback-required lineage.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/canary_scenario_catalog.json",
                    "data/analysis/rollback_trigger_matrix.csv",
                    "data/analysis/resilience_baseline_catalog.json",
                ]
            ),
            "sourceScenarioRefs": integration_rollback["scenarioId"],
            "notes": "Rollback truth is no longer shell-side affordance only; the settlement chain is explicit and machine-readable.",
        },
        {
            "caseId": "PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE",
            "phase": "rollback",
            "actionClass": "kill_switch",
            "environmentRing": "preprod",
            "title": "Kill-switch posture freezes the ring when trust, parity, or provenance are withdrawn.",
            "requiredPublicationTuple": join_refs(
                [
                    preprod_kill_switch["releaseWatchTupleRef"],
                    preprod_kill_switch["waveObservationPolicyRef"],
                    preprod_ring["runtimePublicationBundleRef"],
                ]
            ),
            "requiredFreezeTuple": join_refs(preprod_kill_switch["cockpit"]["activeChannelFreezeRefs"]),
            "requiredReadinessEvidence": join_refs(
                [
                    preprod_kill_switch["operationalReadinessSnapshotRef"],
                    preprod_kill_switch["buildProvenanceRef"],
                    *preprod_freeze_blocked["snapshot"]["activeFreezeRefs"],
                ]
            ),
            "requiredObservationDuty": "None. The ring is frozen and quarantined until a fresh tuple is promoted and verified.",
            "allowedShellPostureBefore": posture_from_recovery(preprod_kill_switch["context"]["recoveryDispositionState"]),
            "allowedShellPostureAfter": posture_from_recovery(preprod_kill_switch["context"]["recoveryDispositionState"]),
            "tupleState": preprod_ring["overallCompatibilityState"],
            "freezeState": preprod_kill_switch["guardrailSnapshot"]["guardrailState"],
            "trustState": preprod_kill_switch["context"]["trustState"],
            "outcomeState": "kill_switch_active",
            "interactiveControlState": control_state_from_outcome("kill_switch_active"),
            "rollbackTrigger": "Revoked provenance, withdrawn parity, and kill-switch recovery disposition freeze the entire ring.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/canary_scenario_catalog.json",
                    "data/analysis/resilience_baseline_catalog.json",
                    "data/release/release_candidate_tuple.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                [
                    preprod_kill_switch["scenarioId"],
                    "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED",
                ]
            ),
            "notes": "This closes the gap where rollback appears only as an operator affordance; kill-switch lineage is an authoritative release-control outcome.",
        },
        {
            "caseId": "LOCAL_RESTORE_REQUIRES_JOURNEY_VALIDATION_AND_FRESH_RUNBOOK",
            "phase": "restore",
            "actionClass": "restore_validation",
            "environmentRing": "local",
            "title": "Restore is not done when data loads; journey validation, runbook freshness, and parity still have to hold.",
            "requiredPublicationTuple": join_refs(
                [
                    local_restore["snapshot"]["runtimePublicationBundleRef"],
                    local_restore["snapshot"]["releasePublicationParityRef"],
                    local_restore["snapshot"]["releaseWatchTupleRef"],
                ]
            ),
            "requiredFreezeTuple": candidate["releaseApprovalFreezeRef"],
            "requiredReadinessEvidence": join_refs(
                [
                    local_restore["snapshot"]["operationalReadinessSnapshotId"],
                    local_restore["runbookBindings"][0]["runbookBindingRecordId"],
                    local_restore["restoreRuns"][0]["restoreRunId"],
                ]
            ),
            "requiredObservationDuty": "Journey validation and readiness compilation must remain fresh before any shell claims calm recovery.",
            "allowedShellPostureBefore": "diagnostic_only_nonprod",
            "allowedShellPostureAfter": "diagnostic_only_nonprod",
            "tupleState": local_ring["overallCompatibilityState"],
            "freezeState": candidate["freezeVerdict"],
            "trustState": "verified",
            "outcomeState": "restore_verified_live_withheld",
            "interactiveControlState": control_state_from_outcome("restore_verified_live_withheld"),
            "rollbackTrigger": "Any runbook freshness, gateway compatibility, or parity drift keeps restore in bounded non-production rehearsal only.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/resilience_baseline_catalog.json",
                    "data/release/release_candidate_tuple.json",
                ]
            ),
            "sourceScenarioRefs": "LOCAL_EXACT_READY",
            "notes": "Even the exact ready restore case does not reopen live control because the selected local ring remains partial and Phase 0 shell exposure is still withheld.",
        },
        {
            "caseId": "INTEGRATION_RESTORE_BLOCKED_PROOF_PREVENTS_CONTROL",
            "phase": "restore",
            "actionClass": "restore_blocked",
            "environmentRing": "integration",
            "title": "Blocked restore proof prevents calm recovery claims even when some backup manifests are current.",
            "requiredPublicationTuple": join_refs(
                [
                    integration_restore["snapshot"]["runtimePublicationBundleRef"],
                    integration_restore["snapshot"]["releasePublicationParityRef"],
                    integration_restore["snapshot"]["releaseWatchTupleRef"],
                ]
            ),
            "requiredFreezeTuple": "restore_proof_must_be_unblocked_before_control_reopens",
            "requiredReadinessEvidence": join_refs(
                [
                    integration_restore["snapshot"]["operationalReadinessSnapshotId"],
                    "BLOCKED_RESTORE_PROOF",
                    integration_restore["restoreRuns"][0]["restoreRunId"],
                ]
            ),
            "requiredObservationDuty": "Restore verification stays blocked until journey proof and evidence packs are both current.",
            "allowedShellPostureBefore": "recovery_only",
            "allowedShellPostureAfter": "recovery_only",
            "tupleState": integration_ring["overallCompatibilityState"],
            "freezeState": "restore_blocked",
            "trustState": "degraded",
            "outcomeState": "restore_blocked",
            "interactiveControlState": control_state_from_outcome("restore_blocked"),
            "rollbackTrigger": "Blocked restore proof keeps recovery posture bounded and prevents any calm or writable reopening.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/resilience_baseline_catalog.json",
                    "data/analysis/readiness_coverage_matrix.csv",
                ]
            ),
            "sourceScenarioRefs": "INTEGRATION_BLOCKED_RESTORE_PROOF",
            "notes": "This closes the gap where restore was treated as complete once data rehydrated. Journey-level proof remains mandatory.",
        },
        {
            "caseId": "PREPROD_TUPLE_DRIFT_KEEPS_RECOVERY_WITHHELD",
            "phase": "restore",
            "actionClass": "restore_drift",
            "environmentRing": "preprod",
            "title": "Tuple drift downgrades recovery posture and keeps calm recovery claims withheld.",
            "requiredPublicationTuple": join_refs(
                [
                    preprod_tuple_drift["snapshot"]["runtimePublicationBundleRef"],
                    preprod_tuple_drift["snapshot"]["releasePublicationParityRef"],
                    preprod_tuple_drift["snapshot"]["releaseWatchTupleRef"],
                ]
            ),
            "requiredFreezeTuple": join_refs(preprod_freeze_blocked["snapshot"]["activeFreezeRefs"]),
            "requiredReadinessEvidence": join_refs(
                [
                    preprod_tuple_drift["snapshot"]["operationalReadinessSnapshotId"],
                    "RESILIENCE_TUPLE_DRIFT",
                    preprod_tuple_drift["restoreRuns"][0]["restoreRunId"],
                ]
            ),
            "requiredObservationDuty": "Fresh tuple issuance, parity revalidation, and restore evidence regeneration are required before any recovery claim can relax.",
            "allowedShellPostureBefore": "recovery_only",
            "allowedShellPostureAfter": "recovery_only",
            "tupleState": preprod_ring["overallCompatibilityState"],
            "freezeState": "tuple_drift",
            "trustState": "drifted",
            "outcomeState": "tuple_drift_blocked",
            "interactiveControlState": control_state_from_outcome("tuple_drift_blocked"),
            "rollbackTrigger": "Tuple drift downgrades RecoveryControlPosture and keeps shell authority withheld until a governed rebind succeeds.",
            "machineEvidenceRefs": join_refs(
                [
                    "data/analysis/resilience_baseline_catalog.json",
                    "data/analysis/readiness_coverage_matrix.csv",
                    "data/release/release_candidate_tuple.json",
                ]
            ),
            "sourceScenarioRefs": join_refs(
                ["PREPROD_TUPLE_DRIFT", preprod_ring["environmentCompatibilityRef"]]
            ),
            "notes": "This explicitly closes the restore-succeeded-because-data-loaded gap by keeping calm recovery false until tuple drift is resolved.",
        },
    ]

    case_ids = [row["caseId"] for row in cases]
    require(case_ids == REQUIRED_MAIN_CASE_IDS, "PREREQUISITE_GAP_137_MAIN_CASE_ORDER_DRIFT")
    return cases


def build_wave_cases(
    canary_catalog: dict[str, Any],
    release_candidate_export: dict[str, Any],
) -> list[dict[str, Any]]:
    ring_by_ref = {
        row["environmentRing"]: row
        for row in release_candidate_export["environmentCompatibilitySummaries"]
    }
    rows = []
    for record in canary_catalog["records"]:
        scenario_id = record["scenarioId"]
        require(
            scenario_id in REQUIRED_WAVE_CASE_IDS,
            f"PREREQUISITE_GAP_137_UNEXPECTED_WAVE_CASE::{scenario_id}",
        )
        ring_summary = ring_by_ref[record["environmentRing"]]
        observation_state = record["context"]["observationState"]
        applied_allowed = (
            observation_state == "satisfied"
            and ring_summary["overallCompatibilityState"] == "exact"
            and record["context"]["buildProvenanceState"] == "verified"
            and record["context"]["parityState"] == "exact"
            and record["context"]["continuityState"] == "healthy"
            and record["context"]["recoveryDispositionState"] == "normal"
        )
        rows.append(
            {
                "observationCaseId": scenario_id,
                "environmentRing": record["environmentRing"],
                "actionType": record["actionType"],
                "watchState": record["settlement"]["watchState"],
                "observationState": observation_state,
                "guardrailState": record["guardrailSnapshot"]["guardrailState"],
                "tupleState": ring_summary["overallCompatibilityState"],
                "requiredObservationDuty": {
                    "canary_start": "Open observation and collect dwell proof before any widen, resume, or applied claim.",
                    "widen": "Observation must be satisfied and parity or provenance must stay exact.",
                    "pause": "Pause until constrained guardrail blockers clear.",
                    "rollback": "Emit rollback evidence and preserve lineage to the rollback target tuple.",
                    "kill_switch": "Freeze the ring and block all re-entry until a new governed tuple is promoted.",
                    "rollforward": "Supersede the prior tuple before satisfied settlement is accepted.",
                }[record["actionType"]],
                "appliedAllowed": "yes" if applied_allowed else "no",
                "appliedBlocker": "current ring compatibility and Phase 0 shell exposure still withhold applied success",
                "settlementState": record["settlement"]["settlementState"],
                "proofRefs": join_refs(
                    [
                        "data/analysis/canary_scenario_catalog.json",
                        "data/analysis/release_watch_pipeline_catalog.json",
                    ]
                ),
            }
        )
    rows.sort(key=lambda row: REQUIRED_WAVE_CASE_IDS.index(row["observationCaseId"]))
    return rows


def build_restore_cases(
    resilience_catalog: dict[str, Any],
    release_candidate_export: dict[str, Any],
) -> list[dict[str, Any]]:
    ring_by_ref = {
        row["environmentRing"]: row
        for row in release_candidate_export["environmentCompatibilitySummaries"]
    }
    scenario_by_id = {row["scenarioId"]: row for row in resilience_catalog["scenarios"]}
    details_by_id = {row["scenarioId"]: row for row in resilience_catalog["scenarioDetails"]}
    rows: list[dict[str, Any]] = []
    for scenario_id in REQUIRED_RESTORE_CASE_IDS:
        summary_row = scenario_by_id[scenario_id]
        detail = details_by_id[scenario_id]
        readiness_state = summary_row["actualReadinessState"]
        restore_states = {row["restoreState"] for row in detail["restoreRuns"]}
        journey_validation_state = (
            "blocked" if "blocked" in restore_states else "journey_validated"
        )
        runbook_states = {row["bindingState"] for row in detail["runbookBindings"]}
        runbook_state = "current" if runbook_states == {"current"} else "stale"
        ring_summary = ring_by_ref[summary_row["environmentRing"]]
        live_authority_restored = (
            readiness_state == "exact_and_ready"
            and ring_summary["overallCompatibilityState"] == "exact"
            and release_candidate_export["summary"]["localSurfaceSummary"]["publishable_live_count"] > 0
        )
        rows.append(
            {
                "restoreCaseId": scenario_id,
                "environmentRing": summary_row["environmentRing"],
                "readinessState": readiness_state,
                "publicationTupleState": ring_summary["overallCompatibilityState"],
                "journeyValidationState": journey_validation_state,
                "runbookBindingState": runbook_state,
                "recoveryControlPosture": restore_posture_from_readiness(readiness_state),
                "liveAuthorityRestored": "yes" if live_authority_restored else "no",
                "shellPostureAfter": (
                    "calm_live"
                    if live_authority_restored
                    else posture_from_recovery("normal")
                    if readiness_state == "exact_and_ready"
                    else "read_only_revalidation"
                    if readiness_state in {"stale_rehearsal_evidence", "assurance_or_freeze_blocked"}
                    else "recovery_only"
                ),
                "blockerRefs": join_refs(summary_row["blockerRefs"]),
                "proofRefs": join_refs(
                    [
                        "data/analysis/resilience_baseline_catalog.json",
                        "data/analysis/readiness_coverage_matrix.csv",
                        "data/release/release_candidate_tuple.json",
                    ]
                ),
            }
        )
    return rows


def build_expectations(results: dict[str, Any]) -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "suite_verdict": SUITE_VERDICT,
        "required_case_ids": REQUIRED_MAIN_CASE_IDS,
        "required_wave_observation_case_ids": REQUIRED_WAVE_CASE_IDS,
        "required_restore_case_ids": REQUIRED_RESTORE_CASE_IDS,
        "required_filters": {
            "environment": ["all", "local", "ci-preview", "integration", "preprod"],
            "tupleState": ["all", "partial", "blocked"],
            "actionClass": [
                "all",
                "preview_route_truth",
                "freeze_control",
                "canary_start",
                "widen_resume",
                "pause",
                "rollback",
                "kill_switch",
                "restore_validation",
                "restore_blocked",
                "restore_drift",
            ],
            "outcomeState": [
                "all",
                "withheld",
                "blocked",
                "accepted_pending_observation",
                "satisfied_but_live_withheld",
                "constrained",
                "rollback_required",
                "kill_switch_active",
                "restore_verified_live_withheld",
                "restore_blocked",
                "tuple_drift_blocked",
            ],
        },
        "orchestrated_spec_refs": ORCHESTRATED_SPECS,
        "active_release_ref": results["releaseContext"]["releaseRef"],
        "active_tuple_hash": results["releaseContext"]["compilationTupleHash"],
        "blocked_action_count": results["summary"]["blocked_action_count"],
        "live_control_reopened_count": results["summary"]["live_control_reopened_count"],
    }


def build_suite_results(
    release_candidate_export: dict[str, Any],
    main_cases: list[dict[str, Any]],
    wave_cases: list[dict[str, Any]],
    restore_cases: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = {
        "rehearsal_case_count": len(main_cases),
        "wave_observation_case_count": len(wave_cases),
        "restore_readiness_case_count": len(restore_cases),
        "blocked_action_count": sum(
            1 for row in main_cases if row["outcomeState"] in {"blocked", "constrained", "restore_blocked"}
        ),
        "accepted_pending_observation_count": sum(
            1 for row in main_cases if row["outcomeState"] == "accepted_pending_observation"
        ),
        "satisfied_but_live_withheld_count": sum(
            1 for row in main_cases if row["outcomeState"] == "satisfied_but_live_withheld"
        ),
        "rollback_required_count": sum(
            1 for row in main_cases if row["outcomeState"] == "rollback_required"
        ),
        "kill_switch_count": sum(
            1 for row in main_cases if row["outcomeState"] == "kill_switch_active"
        ),
        "restore_blocked_count": sum(
            1
            for row in main_cases
            if row["outcomeState"] in {"restore_blocked", "tuple_drift_blocked"}
        ),
        "applied_allowed_case_count": sum(
            1 for row in wave_cases if row["appliedAllowed"] == "yes"
        ),
        "live_control_reopened_count": sum(
            1 for row in restore_cases if row["liveAuthorityRestored"] == "yes"
        ),
        "preview_live_advertisement_count": sum(
            1 for row in main_cases if row["actionClass"] == "preview_route_truth" and row["outcomeState"] != "withheld"
        ),
    }
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "generated_at": now_iso(),
        "captured_on": datetime.now(timezone.utc).date().isoformat(),
        "suiteVerdict": SUITE_VERDICT,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "releaseContext": {
            "releaseRef": release_candidate_export["releaseCandidateTuple"]["releaseRef"],
            "releaseApprovalFreezeRef": release_candidate_export["releaseCandidateTuple"]["releaseApprovalFreezeRef"],
            "compilationTupleHash": release_candidate_export["releaseCandidateTuple"]["compilationTupleHash"],
            "freezeVerdict": release_candidate_export["releaseCandidateTuple"]["freezeVerdict"],
            "selectedWatchScenarioId": release_candidate_export["summary"]["selectedWatchScenarioId"],
            "selectedResilienceScenarioId": release_candidate_export["summary"]["selectedResilienceScenarioId"],
            "selectedMigrationScenarioId": release_candidate_export["summary"]["selectedMigrationScenarioId"],
            "localSurfaceSummary": release_candidate_export["summary"]["localSurfaceSummary"],
        },
        "prerequisite_gaps": [],
        "orchestratedSpecRefs": ORCHESTRATED_SPECS,
        "cases": main_cases,
        "waveObservationCases": wave_cases,
        "restoreReadinessCases": restore_cases,
    }


def build_suite_doc(results: dict[str, Any]) -> str:
    summary = results["summary"]
    context = results["releaseContext"]
    case_rows = [
        [
            row["caseId"],
            row["environmentRing"],
            row["actionClass"],
            row["outcomeState"],
            row["allowedShellPostureAfter"],
            row["requiredPublicationTuple"],
        ]
        for row in results["cases"]
    ]
    return dedent(
        f"""
        # 137 Release Restore Canary Rehearsal Suite

        Current suite verdict: `{results["suiteVerdict"]}`

        This suite fuses the current Phase 0 release candidate freeze, preview publication parity, release-watch pipeline, non-production canary harness, and resilience baseline into one exact rehearsal matrix. It proves that preview banners, canary start, widen or resume, rollback, kill-switch, and restore claims all stay tuple-bound and fail closed when parity, provenance, observation, freeze, or recovery evidence drift.

        ## Active Context

        - Release ref: `{context["releaseRef"]}`
        - Release approval freeze ref: `{context["releaseApprovalFreezeRef"]}`
        - Active tuple hash: `{brief_hash(context["compilationTupleHash"])}`
        - Freeze verdict: `{context["freezeVerdict"]}`
        - Blocked action count: `{summary["blocked_action_count"]}`
        - Applied-allowed wave count: `{summary["applied_allowed_case_count"]}`
        - Live-control reopened count: `{summary["live_control_reopened_count"]}`

        ## What The Harness Proves

        1. Preview environments carry tuple proof, but shell truth still stays bounded when live publication and route authority are not exact.
        2. Release freeze and channel-freeze posture directly suppress mutating controls instead of relying on operator memory.
        3. Canary start generates accepted-pending-observation truth, and widen or resume still does not imply applied success under the current Phase 0 compatibility ceiling.
        4. Rollback and kill-switch outcomes are authoritative settlement results with machine-readable lineage.
        5. Restore is not complete when data loads. Journey proof, runbook freshness, readiness compilation, and tuple parity still gate shell posture.

        ## Rehearsal Matrix

        {md_table(
            ["Case", "Ring", "Action", "Outcome", "Shell After", "Required Publication Tuple"],
            case_rows,
        )}
        """
    ).strip()


def build_truth_matrix_doc(results: dict[str, Any]) -> str:
    matrix_rows = [
        [
            row["caseId"],
            row["requiredReadinessEvidence"],
            row["requiredObservationDuty"],
            row["rollbackTrigger"],
        ]
        for row in results["cases"]
    ]
    restore_rows = [
        [
            row["restoreCaseId"],
            row["readinessState"],
            row["recoveryControlPosture"],
            row["liveAuthorityRestored"],
            row["blockerRefs"] or "none",
        ]
        for row in results["restoreReadinessCases"]
    ]
    return dedent(
        f"""
        # 137 Release Watch And Recovery Truth Matrix

        Restore is not complete when data loads. Journey proof, runbook freshness, readiness compilation, and tuple parity still gate shell posture.

        ## Action Truth Matrix

        {md_table(
            ["Case", "Readiness Evidence", "Observation Duty", "Rollback Trigger"],
            matrix_rows,
        )}

        ## Restore Readiness Matrix

        {md_table(
            ["Restore Case", "Readiness", "Recovery Control Posture", "Live Authority Restored", "Blockers"],
            restore_rows,
        )}
        """
    ).strip()


def build_cockpit_html(results: dict[str, Any], expectations: dict[str, Any]) -> str:
    results_json = json.dumps(results).replace("</", "<\\/")
    expectations_json = json.dumps(expectations).replace("</", "<\\/")
    template = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>137 Release Rehearsal Cockpit</title>
    <style>
      :root {
        color-scheme: light;
        --canvas: #F7F8FA;
        --shell: #EEF2F6;
        --panel: #FFFFFF;
        --inset: #E8EEF3;
        --text-strong: #0F1720;
        --text-default: #24313D;
        --text-muted: #5E6B78;
        --border: #D8E0E8;
        --accent-canary: #2F6FED;
        --accent-observation: #5B61F6;
        --accent-restore: #117A55;
        --accent-constrained: #B7791F;
        --accent-blocked: #B42318;
        --shadow: 0 18px 40px rgba(15, 23, 32, 0.08);
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: var(--canvas); color: var(--text-default); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { min-height: 100vh; }
      button, select { font: inherit; }
      button { cursor: pointer; }
      .page-shell { max-width: 1620px; margin: 0 auto; padding: 0 20px 28px; }
      .masthead {
        position: sticky; top: 0; z-index: 10; height: 72px; display: flex; align-items: center; justify-content: space-between;
        gap: 16px; padding: 14px 20px; margin: 0 -20px 18px; background: rgba(247, 248, 250, 0.94); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(216, 224, 232, 0.8);
      }
      .brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
      .brand-mark { width: 34px; height: 34px; border-radius: 12px; background: linear-gradient(135deg, rgba(47,111,237,0.18), rgba(91,97,246,0.12)); display: grid; place-items: center; }
      .brand-label { display: grid; gap: 2px; }
      .brand-label strong { color: var(--text-strong); font-size: 15px; letter-spacing: 0.01em; }
      .brand-label span { color: var(--text-muted); font-size: 12px; }
      .masthead-summary { display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
      .summary-pill {
        min-width: 156px; padding: 10px 12px; background: var(--panel); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow);
      }
      .summary-pill small { display: block; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
      .summary-pill strong { color: var(--text-strong); font-size: 14px; word-break: break-all; }
      .layout { display: grid; grid-template-columns: 300px minmax(0, 1fr) 416px; gap: 18px; align-items: start; }
      .layout > * { min-width: 0; }
      .rail, .canvas, .inspector, .panel { min-width: 0; background: var(--panel); border: 1px solid var(--border); border-radius: 24px; box-shadow: var(--shadow); }
      .rail, .inspector { position: sticky; top: 92px; }
      .rail { padding: 18px; display: grid; gap: 16px; }
      .rail h2, .canvas h2, .inspector h2, .panel h2 { margin: 0; color: var(--text-strong); font-size: 15px; }
      .filter-group { display: grid; gap: 8px; min-width: 0; }
      .filter-group label { color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      .filter-group select {
        width: 100%; max-width: 100%; border: 1px solid var(--border); background: var(--shell); color: var(--text-default); border-radius: 14px; padding: 10px 12px;
      }
      .case-rail { display: grid; gap: 8px; max-height: calc(100vh - 240px); overflow: auto; padding-right: 4px; }
      .case-button {
        width: 100%; text-align: left; border: 1px solid var(--border); background: var(--panel); border-radius: 18px; padding: 12px 14px; display: grid; gap: 6px;
        transition: border-color 120ms ease, transform 120ms ease, background 120ms ease;
      }
      .case-button:hover, .case-button:focus-visible { border-color: rgba(47,111,237,0.42); outline: none; transform: translateY(-1px); }
      .case-button[data-selected="true"] { border-color: rgba(47,111,237,0.5); background: linear-gradient(180deg, rgba(47,111,237,0.09), rgba(255,255,255,0.98)); }
      .case-meta { display: flex; gap: 8px; flex-wrap: wrap; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
      .case-button strong { color: var(--text-strong); font-size: 13px; line-height: 1.35; }
      .case-button span { color: var(--text-default); font-size: 12px; }
      .canvas { padding: 18px; display: grid; gap: 18px; }
      .ribbon {
        display: grid; gap: 12px; padding: 16px; border-radius: 22px; background: linear-gradient(135deg, rgba(238,242,246,0.8), rgba(255,255,255,0.98)); border: 1px solid var(--border);
      }
      .badge-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .badge {
        display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 999px; background: var(--inset); color: var(--text-strong); font-size: 12px; font-weight: 600;
      }
      .badge[data-tone="canary"] { background: rgba(47,111,237,0.12); color: var(--accent-canary); }
      .badge[data-tone="observation"] { background: rgba(91,97,246,0.12); color: var(--accent-observation); }
      .badge[data-tone="restore"] { background: rgba(17,122,85,0.12); color: var(--accent-restore); }
      .badge[data-tone="blocked"] { background: rgba(180,35,24,0.12); color: var(--accent-blocked); }
      .badge[data-tone="constrained"] { background: rgba(183,121,31,0.12); color: var(--accent-constrained); }
      .diagram-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
      .diagram { border: 1px solid var(--border); border-radius: 22px; padding: 16px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,248,250,0.98)); display: grid; gap: 14px; min-width: 0; }
      .diagram p { margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.45; }
      .ladder { display: grid; gap: 10px; }
      .ladder-step {
        border: 1px solid var(--border); border-radius: 18px; padding: 12px; background: var(--panel); display: grid; gap: 4px;
      }
      .ladder-step[data-active="true"] { border-color: rgba(47,111,237,0.45); box-shadow: inset 0 0 0 1px rgba(47,111,237,0.12); }
      .ladder-step small { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
      .ladder-step strong { color: var(--text-strong); font-size: 13px; }
      .observation-bars, .restore-bars { display: grid; gap: 10px; }
      .bar-row { display: grid; gap: 6px; }
      .bar-row header { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; }
      .bar-track { height: 10px; border-radius: 999px; background: var(--shell); overflow: hidden; }
      .bar-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent-canary), var(--accent-observation)); }
      .bar-fill[data-tone="restore"] { background: linear-gradient(90deg, var(--accent-restore), #53b08a); }
      .bar-fill[data-tone="blocked"] { background: linear-gradient(90deg, var(--accent-blocked), #de665d); }
      .table-shell { overflow: auto; border: 1px solid var(--border); border-radius: 18px; background: var(--panel); }
      table { width: 100%; border-collapse: collapse; min-width: 100%; }
      th, td { padding: 11px 12px; border-bottom: 1px solid rgba(216,224,232,0.82); text-align: left; vertical-align: top; font-size: 12px; }
      th { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; background: rgba(238,242,246,0.74); position: sticky; top: 0; }
      tbody tr[data-selected="true"] { background: rgba(47,111,237,0.08); }
      tbody tr:hover { background: rgba(238,242,246,0.78); }
      tbody tr button { all: unset; display: block; width: 100%; cursor: pointer; }
      .lower-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 18px; }
      .inspector { padding: 18px; display: grid; gap: 14px; }
      .inspector-block { border: 1px solid var(--border); border-radius: 18px; padding: 14px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,248,250,0.98)); display: grid; gap: 8px; }
      .inspector-block small { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; }
      .inspector-block strong { color: var(--text-strong); font-size: 13px; }
      .inspector-list { display: grid; gap: 6px; font-size: 12px; }
      .mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; word-break: break-all; }
      @media (max-width: 1380px) {
        .layout { grid-template-columns: 280px minmax(0, 1fr); }
        .inspector { position: static; grid-column: 1 / -1; }
      }
      @media (max-width: 1100px) {
        .page-shell { padding-inline: 16px; }
        .masthead { margin-inline: -16px; height: auto; min-height: 72px; align-items: start; flex-direction: column; }
        .layout { grid-template-columns: 1fr; }
        .rail { position: static; }
        .diagram-grid, .lower-grid { grid-template-columns: 1fr; }
        .summary-pill { min-width: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
      }
    </style>
  </head>
  <body data-testid="release-rehearsal-cockpit">
    <div class="page-shell">
      <header class="masthead" data-testid="cockpit-masthead">
        <div class="brand">
          <div class="brand-mark" aria-hidden="true">
            <svg data-testid="watch-tuple-mark" width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="#2F6FED" stroke-width="1.5"></circle>
              <path d="M6 11h4l2-4 4 8h-4" stroke="#5B61F6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <div class="brand-label">
            <strong>Vecells Release Rehearsal</strong>
            <span>Release_Rehearsal_Cockpit</span>
          </div>
        </div>
        <div class="masthead-summary">
          <div class="summary-pill">
            <small>Verdict</small>
            <strong data-testid="masthead-verdict"></strong>
          </div>
          <div class="summary-pill">
            <small>Active Tuple Hash</small>
            <strong class="mono" data-testid="tuple-hash-badge"></strong>
          </div>
          <div class="summary-pill">
            <small>Blocked Actions</small>
            <strong data-testid="blocked-action-count"></strong>
          </div>
        </div>
      </header>

      <div class="layout">
        <nav class="rail" aria-label="Rehearsal filters" data-testid="control-rail">
          <div class="filter-group">
            <label for="filter-environment">Environment</label>
            <select id="filter-environment" data-testid="filter-environment"></select>
          </div>
          <div class="filter-group">
            <label for="filter-tuple-state">Tuple State</label>
            <select id="filter-tuple-state" data-testid="filter-tuple-state"></select>
          </div>
          <div class="filter-group">
            <label for="filter-action-class">Action Class</label>
            <select id="filter-action-class" data-testid="filter-action-class"></select>
          </div>
          <div class="filter-group">
            <label for="filter-outcome-state">Outcome State</label>
            <select id="filter-outcome-state" data-testid="filter-outcome-state"></select>
          </div>
          <section>
            <h2>Cases</h2>
            <div class="case-rail" data-testid="case-rail"></div>
          </section>
        </nav>

        <main class="canvas" data-testid="cockpit-canvas">
          <section class="ribbon" data-testid="freeze-trust-ribbon">
            <div class="badge-row" data-testid="tuple-badge-row"></div>
            <div class="table-shell" data-testid="freeze-trust-table-shell">
              <table data-testid="freeze-trust-table">
                <thead><tr><th>Tuple</th><th>Freeze</th><th>Trust</th><th>Control</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </section>

          <div class="diagram-grid">
            <section class="diagram" data-testid="wave-ladder">
              <div>
                <h2>Wave Ladder</h2>
                <p>Action lineage is rendered from the machine-generated case matrix and keeps applied success separate from accepted or satisfied settlements.</p>
              </div>
              <div class="ladder" data-testid="wave-ladder-steps"></div>
              <div class="table-shell">
                <table data-testid="wave-ladder-table">
                  <thead><tr><th>Step</th><th>Status</th><th>Evidence</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="diagram" data-testid="observation-window-chart">
              <div>
                <h2>Observation Window</h2>
                <p>Observation remains a first-class release duty. The chart and table below stay synchronized with the selected action case and the active environment filter.</p>
              </div>
              <div class="observation-bars" data-testid="observation-bars"></div>
              <div class="table-shell">
                <table data-testid="observation-window-table">
                  <thead><tr><th>Observation Case</th><th>State</th><th>Applied Allowed</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="diagram" data-testid="restore-timeline">
              <div>
                <h2>Restore Timeline</h2>
                <p>Restore stays incomplete until journey validation, runbook freshness, publication parity, and recovery posture all remain exact enough for the ring.</p>
              </div>
              <div class="restore-bars" data-testid="restore-bars"></div>
              <div class="table-shell">
                <table data-testid="restore-timeline-table">
                  <thead><tr><th>Restore Case</th><th>Readiness</th><th>Live Authority Restored</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>
          </div>

          <div class="lower-grid">
            <section class="panel" style="padding:16px;" data-testid="action-results-panel">
              <h2>Action Results</h2>
              <div class="table-shell" style="margin-top:12px;">
                <table data-testid="action-results-table">
                  <thead><tr><th>Case</th><th>Ring</th><th>Action</th><th>Outcome</th><th>Shell After</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>

            <section class="panel" style="padding:16px;" data-testid="restore-readiness-panel">
              <h2>Restore Readiness</h2>
              <div class="table-shell" style="margin-top:12px;">
                <table data-testid="restore-readiness-table">
                  <thead><tr><th>Restore Case</th><th>Readiness</th><th>Recovery Posture</th><th>Live Authority</th></tr></thead>
                  <tbody></tbody>
                </table>
              </div>
            </section>
          </div>
        </main>

        <aside class="inspector" aria-label="Selected rehearsal case" data-testid="inspector">
          <div class="inspector-block" data-testid="inspector-action-preview">
            <small>Selected Case</small>
            <strong id="inspector-title"></strong>
            <div class="inspector-list" id="inspector-summary"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-tuple-refs">
            <small>Tuple Refs</small>
            <div class="inspector-list mono" id="inspector-tuples"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-readiness">
            <small>Readiness Evidence</small>
            <div class="inspector-list" id="inspector-readiness-list"></div>
          </div>
          <div class="inspector-block" data-testid="inspector-settlement-chain">
            <small>Settlement Chain</small>
            <div class="inspector-list" id="inspector-settlement"></div>
          </div>
        </aside>
      </div>
    </div>

    <script id="release-rehearsal-results" type="application/json">__RESULTS_JSON__</script>
    <script id="release-rehearsal-expectations" type="application/json">__EXPECTATIONS_JSON__</script>
    <script>
      const results = JSON.parse(document.getElementById("release-rehearsal-results").textContent);
      const expectations = JSON.parse(document.getElementById("release-rehearsal-expectations").textContent);
      const state = {
        environment: "all",
        tupleState: "all",
        actionClass: "all",
        outcomeState: "all",
        selectedCaseId: results.cases[0]?.caseId ?? null,
      };
      const body = document.body;
      body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";

      function optionize(select, values) {
        select.innerHTML = "";
        for (const value of values) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          select.append(option);
        }
      }

      optionize(document.querySelector("[data-testid='filter-environment']"), expectations.required_filters.environment);
      optionize(document.querySelector("[data-testid='filter-tuple-state']"), expectations.required_filters.tupleState);
      optionize(document.querySelector("[data-testid='filter-action-class']"), expectations.required_filters.actionClass);
      optionize(document.querySelector("[data-testid='filter-outcome-state']"), expectations.required_filters.outcomeState);

      document.querySelector("[data-testid='masthead-verdict']").textContent = results.suiteVerdict;
      document.querySelector("[data-testid='tuple-hash-badge']").textContent = expectations.active_tuple_hash;
      document.querySelector("[data-testid='blocked-action-count']").textContent = String(results.summary.blocked_action_count);

      for (const [name, key] of [
        ["environment", "filter-environment"],
        ["tupleState", "filter-tuple-state"],
        ["actionClass", "filter-action-class"],
        ["outcomeState", "filter-outcome-state"],
      ]) {
        document.querySelector(`[data-testid='${key}']`).addEventListener("change", (event) => {
          state[name] = event.target.value;
          render();
        });
      }

      function getVisibleCases() {
        return results.cases.filter((row) => {
          return (
            (state.environment === "all" || row.environmentRing === state.environment) &&
            (state.tupleState === "all" || row.tupleState === state.tupleState) &&
            (state.actionClass === "all" || row.actionClass === state.actionClass) &&
            (state.outcomeState === "all" || row.outcomeState === state.outcomeState)
          );
        });
      }

      function getSelectedCase() {
        const visible = getVisibleCases();
        if (!visible.some((row) => row.caseId === state.selectedCaseId)) {
          state.selectedCaseId = visible[0]?.caseId ?? null;
        }
        return results.cases.find((row) => row.caseId === state.selectedCaseId) ?? visible[0] ?? null;
      }

      function selectCase(caseId) {
        state.selectedCaseId = caseId;
        render();
      }

      function renderCaseRail() {
        const rail = document.querySelector("[data-testid='case-rail']");
        const visible = getVisibleCases();
        rail.innerHTML = "";
        visible.forEach((row, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "case-button";
          button.dataset.selected = String(row.caseId === state.selectedCaseId);
          button.dataset.testid = `case-button-${row.caseId}`;
          button.setAttribute("data-testid", `case-button-${row.caseId}`);
          button.innerHTML = `
            <div class="case-meta"><span>${row.environmentRing}</span><span>${row.actionClass}</span><span>${row.outcomeState}</span></div>
            <strong>${row.title}</strong>
            <span>${row.allowedShellPostureAfter}</span>
          `;
          button.addEventListener("click", () => selectCase(row.caseId));
          button.addEventListener("keydown", (event) => {
            const buttons = [...rail.querySelectorAll(".case-button")];
            const currentIndex = buttons.indexOf(button);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              buttons[Math.min(currentIndex + 1, buttons.length - 1)]?.focus();
              buttons[Math.min(currentIndex + 1, buttons.length - 1)]?.click();
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              buttons[Math.max(currentIndex - 1, 0)]?.focus();
              buttons[Math.max(currentIndex - 1, 0)]?.click();
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              button.click();
            }
          });
          rail.append(button);
          if (index === 0 && !state.selectedCaseId) {
            state.selectedCaseId = row.caseId;
          }
        });
      }

      function renderRibbon(selected) {
        const row = document.querySelector("[data-testid='tuple-badge-row']");
        row.innerHTML = "";
        const badges = [
          ["Tuple", selected.tupleState, selected.tupleState === "blocked" ? "blocked" : selected.tupleState === "partial" ? "constrained" : "canary"],
          ["Freeze", selected.freezeState, selected.freezeState === "frozen" || selected.freezeState === "blocked" ? "blocked" : selected.freezeState.includes("satisfied") ? "observation" : "constrained"],
          ["Trust", selected.trustState, selected.trustState.includes("degraded") || selected.trustState.includes("drift") ? "constrained" : selected.trustState.includes("quarantined") ? "blocked" : "restore"],
          ["Control", selected.interactiveControlState, selected.interactiveControlState === "suppressed" ? "blocked" : selected.interactiveControlState === "preview_only" ? "observation" : "restore"],
        ];
        badges.forEach(([label, value, tone]) => {
          const span = document.createElement("span");
          span.className = "badge";
          span.dataset.tone = tone;
          span.textContent = `${label}: ${value}`;
          row.append(span);
        });
        const tbody = document.querySelector("[data-testid='freeze-trust-table'] tbody");
        tbody.innerHTML = `<tr><td>${selected.requiredPublicationTuple}</td><td>${selected.requiredFreezeTuple}</td><td>${selected.trustState}</td><td>${selected.interactiveControlState}</td></tr>`;
      }

      function renderWave(selected) {
        const steps = [
          { label: "Preview tuple", state: selected.phase === "preview" ? selected.outcomeState : selected.tupleState, evidence: selected.requiredPublicationTuple },
          { label: "Freeze gate", state: selected.freezeState, evidence: selected.requiredFreezeTuple },
          { label: "Action issue", state: selected.actionClass, evidence: selected.requiredReadinessEvidence },
          { label: "Observe", state: selected.requiredObservationDuty, evidence: selected.rollbackTrigger },
          { label: "Settle", state: selected.outcomeState, evidence: selected.machineEvidenceRefs },
        ];
        const ladder = document.querySelector("[data-testid='wave-ladder-steps']");
        ladder.innerHTML = "";
        const tbody = document.querySelector("[data-testid='wave-ladder-table'] tbody");
        tbody.innerHTML = "";
        steps.forEach((step, index) => {
          const article = document.createElement("article");
          article.className = "ladder-step";
          article.dataset.active = String(index === 4 || index === 2);
          article.innerHTML = `<small>Step ${index + 1}</small><strong>${step.label}</strong><div>${step.state}</div>`;
          ladder.append(article);
          tbody.insertAdjacentHTML("beforeend", `<tr><td>${step.label}</td><td>${step.state}</td><td>${step.evidence}</td></tr>`);
        });
      }

      function renderObservation(selected) {
        const rows = results.waveObservationCases.filter((row) => state.environment === "all" || row.environmentRing === state.environment);
        const bars = document.querySelector("[data-testid='observation-bars']");
        const tbody = document.querySelector("[data-testid='observation-window-table'] tbody");
        bars.innerHTML = "";
        tbody.innerHTML = "";
        rows.forEach((row) => {
          const intensity = row.observationState === "satisfied" ? 100 : row.observationState === "open" ? 64 : 26;
          const item = document.createElement("div");
          item.className = "bar-row";
          item.innerHTML = `
            <header><strong>${row.observationCaseId}</strong><span>${row.observationState}</span></header>
            <div class="bar-track"><div class="bar-fill" style="width:${intensity}%"></div></div>
          `;
          bars.append(item);
          const selectedAttr = String(selected.sourceScenarioRefs.includes(row.observationCaseId));
          tbody.insertAdjacentHTML(
            "beforeend",
            `<tr data-selected="${selectedAttr}"><td>${row.observationCaseId}</td><td>${row.observationState}</td><td>${row.appliedAllowed}</td></tr>`,
          );
        });
      }

      function renderRestore(selected) {
        const rows = results.restoreReadinessCases.filter((row) => state.environment === "all" || row.environmentRing === state.environment);
        const bars = document.querySelector("[data-testid='restore-bars']");
        const tbody = document.querySelector("[data-testid='restore-timeline-table'] tbody");
        bars.innerHTML = "";
        tbody.innerHTML = "";
        rows.forEach((row) => {
          const tone = row.liveAuthorityRestored === "yes" ? "restore" : row.readinessState.includes("blocked") || row.readinessState.includes("drift") || row.readinessState.includes("missing") ? "blocked" : "restore";
          const width = row.liveAuthorityRestored === "yes" ? 100 : row.readinessState === "exact_and_ready" ? 74 : row.readinessState === "stale_rehearsal_evidence" ? 54 : 26;
          const item = document.createElement("div");
          item.className = "bar-row";
          item.innerHTML = `
            <header><strong>${row.restoreCaseId}</strong><span>${row.recoveryControlPosture}</span></header>
            <div class="bar-track"><div class="bar-fill" data-tone="${tone}" style="width:${width}%"></div></div>
          `;
          bars.append(item);
          const selectedAttr = String(selected.sourceScenarioRefs.includes(row.restoreCaseId));
          tbody.insertAdjacentHTML(
            "beforeend",
            `<tr data-selected="${selectedAttr}"><td>${row.restoreCaseId}</td><td>${row.readinessState}</td><td>${row.liveAuthorityRestored}</td></tr>`,
          );
        });
      }

      function renderTables(selected) {
        const visible = getVisibleCases();
        const actionBody = document.querySelector("[data-testid='action-results-table'] tbody");
        actionBody.innerHTML = "";
        visible.forEach((row) => {
          actionBody.insertAdjacentHTML(
            "beforeend",
            `<tr data-selected="${String(row.caseId === selected.caseId)}"><td><button type="button" data-testid="action-row-${row.caseId}">${row.caseId}</button></td><td>${row.environmentRing}</td><td>${row.actionClass}</td><td>${row.outcomeState}</td><td>${row.allowedShellPostureAfter}</td></tr>`,
          );
        });
        actionBody.querySelectorAll("button").forEach((button) => {
          button.addEventListener("click", () => selectCase(button.textContent));
        });

        const restoreBody = document.querySelector("[data-testid='restore-readiness-table'] tbody");
        restoreBody.innerHTML = "";
        results.restoreReadinessCases
          .filter((row) => state.environment === "all" || row.environmentRing === state.environment)
          .forEach((row) => {
            restoreBody.insertAdjacentHTML(
              "beforeend",
              `<tr data-selected="${String(selected.sourceScenarioRefs.includes(row.restoreCaseId))}"><td>${row.restoreCaseId}</td><td>${row.readinessState}</td><td>${row.recoveryControlPosture}</td><td>${row.liveAuthorityRestored}</td></tr>`,
            );
          });
      }

      function renderInspector(selected) {
        document.getElementById("inspector-title").textContent = selected.title;
        document.getElementById("inspector-summary").innerHTML = `
          <div data-testid="inspector-case-summary"><strong>${selected.caseId}</strong></div>
          <div>Environment: ${selected.environmentRing}</div>
          <div>Action: ${selected.actionClass}</div>
          <div>Outcome: ${selected.outcomeState}</div>
          <div>Interactive controls: ${selected.interactiveControlState}</div>
        `;
        document.getElementById("inspector-tuples").innerHTML = `
          <div>${selected.requiredPublicationTuple}</div>
          <div>${selected.requiredFreezeTuple}</div>
        `;
        document.getElementById("inspector-readiness-list").innerHTML = `
          <div>${selected.requiredReadinessEvidence}</div>
          <div>${selected.allowedShellPostureBefore} -> ${selected.allowedShellPostureAfter}</div>
        `;
        document.getElementById("inspector-settlement").innerHTML = `
          <div>${selected.requiredObservationDuty}</div>
          <div>${selected.rollbackTrigger}</div>
          <div class="mono">${selected.machineEvidenceRefs}</div>
        `;
      }

      function render() {
        const visible = getVisibleCases();
        if (!visible.length) {
          state.selectedCaseId = results.cases[0]?.caseId ?? null;
        }
        renderCaseRail();
        const selected = getSelectedCase();
        if (!selected) return;
        renderRibbon(selected);
        renderWave(selected);
        renderObservation(selected);
        renderRestore(selected);
        renderTables(selected);
        renderInspector(selected);
      }

      render();
    </script>
  </body>
</html>
"""
    return (
        template.replace("__RESULTS_JSON__", results_json).replace(
            "__EXPECTATIONS_JSON__", expectations_json
        )
    )


def main() -> None:
    release_candidate_export = load_json(RELEASE_CANDIDATE_PATH)
    preview_manifest = load_json(PREVIEW_MANIFEST_PATH)
    topology_rows = load_csv(TOPOLOGY_PUBLICATION_MATRIX_PATH)
    watch_catalog = load_json(RELEASE_WATCH_CATALOG_PATH)
    watch_evidence_rows = load_csv(RELEASE_WATCH_EVIDENCE_PATH)
    trigger_rows = load_csv(ROLLBACK_TRIGGER_MATRIX_PATH)
    canary_catalog = load_json(CANARY_CATALOG_PATH)
    resilience_catalog = load_json(RESILIENCE_CATALOG_PATH)
    shell_suite_results = load_json(SHELL_SUITE_RESULTS_PATH)
    blockers_export = load_json(FREEZE_BLOCKERS_PATH)

    require(
        release_candidate_export["task_id"] == "seq_131",
        "PREREQUISITE_GAP_137_RELEASE_CANDIDATE_NOT_SEQ_131",
    )
    require(
        watch_catalog["task_id"] == "par_097",
        "PREREQUISITE_GAP_137_RELEASE_WATCH_NOT_PAR_097",
    )
    require(
        canary_catalog["task_id"] == "par_102",
        "PREREQUISITE_GAP_137_CANARY_NOT_PAR_102",
    )
    require(
        resilience_catalog["task_id"] == "par_101",
        "PREREQUISITE_GAP_137_RESILIENCE_NOT_PAR_101",
    )
    require(
        shell_suite_results["task_id"] == "seq_136",
        "PREREQUISITE_GAP_137_SHELL_SUITE_NOT_SEQ_136",
    )

    main_cases = build_main_cases(
        release_candidate_export,
        preview_manifest,
        topology_rows,
        watch_catalog,
        watch_evidence_rows,
        trigger_rows,
        canary_catalog,
        resilience_catalog,
        shell_suite_results,
        blockers_export,
    )
    wave_cases = build_wave_cases(canary_catalog, release_candidate_export)
    restore_cases = build_restore_cases(resilience_catalog, release_candidate_export)
    results = build_suite_results(release_candidate_export, main_cases, wave_cases, restore_cases)
    expectations = build_expectations(results)

    write_csv(
        REHEARSAL_CASES_PATH,
        [
            "caseId",
            "phase",
            "actionClass",
            "environmentRing",
            "title",
            "requiredPublicationTuple",
            "requiredFreezeTuple",
            "requiredReadinessEvidence",
            "requiredObservationDuty",
            "allowedShellPostureBefore",
            "allowedShellPostureAfter",
            "tupleState",
            "freezeState",
            "trustState",
            "outcomeState",
            "interactiveControlState",
            "rollbackTrigger",
            "machineEvidenceRefs",
            "sourceScenarioRefs",
            "notes",
        ],
        main_cases,
    )
    write_csv(
        WAVE_CASES_PATH,
        [
            "observationCaseId",
            "environmentRing",
            "actionType",
            "watchState",
            "observationState",
            "guardrailState",
            "tupleState",
            "requiredObservationDuty",
            "appliedAllowed",
            "appliedBlocker",
            "settlementState",
            "proofRefs",
        ],
        wave_cases,
    )
    write_csv(
        RESTORE_CASES_PATH,
        [
            "restoreCaseId",
            "environmentRing",
            "readinessState",
            "publicationTupleState",
            "journeyValidationState",
            "runbookBindingState",
            "recoveryControlPosture",
            "liveAuthorityRestored",
            "shellPostureAfter",
            "blockerRefs",
            "proofRefs",
        ],
        restore_cases,
    )
    write_json(EXPECTATIONS_PATH, expectations)
    write_json(RESULTS_PATH, results)
    write_text(SUITE_DOC_PATH, build_suite_doc(results))
    write_text(TRUTH_MATRIX_DOC_PATH, build_truth_matrix_doc(results))
    write_text(COCKPIT_PATH, build_cockpit_html(results, expectations))


if __name__ == "__main__":
    main()
