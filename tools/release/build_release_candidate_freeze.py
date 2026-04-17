#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_ANALYSIS_DIR = ROOT / "data" / "analysis"
DATA_RELEASE_DIR = ROOT / "data" / "release"
DOCS_RELEASE_DIR = ROOT / "docs" / "release"

RUNTIME_PUBLICATION_BUNDLES_PATH = DATA_ANALYSIS_DIR / "runtime_publication_bundles.json"
RELEASE_PUBLICATION_PARITY_PATH = DATA_ANALYSIS_DIR / "release_publication_parity_records.json"
RELEASE_CONTRACT_MATRIX_PATH = DATA_ANALYSIS_DIR / "release_contract_verification_matrix.json"
ENVIRONMENT_RING_POLICY_PATH = DATA_ANALYSIS_DIR / "environment_ring_policy.json"
RUNTIME_TOPOLOGY_PATH = DATA_ANALYSIS_DIR / "runtime_topology_manifest.json"
RESILIENCE_BASELINE_PATH = DATA_ANALYSIS_DIR / "resilience_baseline_catalog.json"
MIGRATION_BACKFILL_PATH = DATA_ANALYSIS_DIR / "migration_backfill_control_catalog.json"
RELEASE_WATCH_PATH = DATA_ANALYSIS_DIR / "release_watch_pipeline_catalog.json"
PROVENANCE_INTEGRITY_PATH = DATA_ANALYSIS_DIR / "build_provenance_integrity_catalog.json"
SURFACE_AUTHORITY_VERDICTS_PATH = DATA_ANALYSIS_DIR / "surface_authority_verdicts.json"
REGION_RESILIENCE_PATH = DATA_ANALYSIS_DIR / "region_resilience_matrix.json"
PHASE_CARDS_PATH = ROOT / "blueprint" / "phase-cards.md"
PROMPT_PATH = ROOT / "prompt" / "131.md"

RELEASE_CANDIDATE_TUPLE_PATH = DATA_RELEASE_DIR / "release_candidate_tuple.json"
ENVIRONMENT_COMPATIBILITY_MATRIX_PATH = DATA_RELEASE_DIR / "environment_compatibility_matrix.csv"
RELEASE_CONTRACT_MATRIX_EXPORT_PATH = DATA_RELEASE_DIR / "release_contract_verification_matrix.json"
FREEZE_BLOCKERS_PATH = DATA_RELEASE_DIR / "freeze_blockers.json"
RING_FINGERPRINT_MATRIX_PATH = DATA_RELEASE_DIR / "ring_fingerprint_matrix.csv"

FREEZE_DOC_PATH = DOCS_RELEASE_DIR / "131_release_candidate_freeze.md"
ENV_COMPATIBILITY_DOC_PATH = DOCS_RELEASE_DIR / "131_environment_compatibility_evidence.md"
RELEASE_CONTRACT_DOC_PATH = DOCS_RELEASE_DIR / "131_release_contract_verification_matrix.md"
BLOCKERS_DOC_PATH = DOCS_RELEASE_DIR / "131_freeze_blockers_and_recovery_rules.md"
BOARD_PATH = DOCS_RELEASE_DIR / "131_release_candidate_freeze_board.html"

TASK_ID = "seq_131"
VISUAL_MODE = "Release_Candidate_Freeze_Board"
MISSION = (
    "Finalize the Phase 0 release-candidate freeze tuple and environment-compatibility evidence "
    "so the simulator-backed foundation exposes one exact frozen candidate dossier and explicit "
    "ring-by-ring promotion blockers instead of assuming ring equivalence."
)

RING_ORDER = ["local", "ci-preview", "integration", "preprod", "production"]
RING_LABELS = {
    "local": "Local",
    "ci-preview": "CI Preview",
    "integration": "Integration",
    "preprod": "Preprod",
    "production": "Production",
}
STATE_BADGES = {
    "exact": "Exact",
    "partial": "Partial",
    "stale": "Stale",
    "blocked": "Blocked",
}
DIMENSIONS = [
    ("runtime_publication_and_parity", "Runtime publication and parity"),
    ("runtime_topology", "Runtime topology"),
    ("workload_families", "Workload families"),
    ("trust_zone_boundaries", "Trust-zone boundaries"),
    ("gateway_surfaces", "Gateway surfaces"),
    ("channel_bridge_capabilities", "Channel and bridge assumptions"),
    ("migration_backfill_posture", "Migration and backfill posture"),
    ("observability_restore_posture", "Observability and restore posture"),
]
SOURCE_PRECEDENCE = [
    "prompt/131.md",
    "prompt/shared_operating_contract_126_to_135.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-cards.md#Phase algorithm",
    "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
    "blueprint/platform-runtime-and-release-blueprint.md#Environment ring and promotion contract",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 119",
    "data/analysis/runtime_publication_bundles.json",
    "data/analysis/release_publication_parity_records.json",
    "data/analysis/release_contract_verification_matrix.json",
    "data/analysis/environment_ring_policy.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/migration_backfill_control_catalog.json",
    "data/analysis/release_watch_pipeline_catalog.json",
    "data/analysis/build_provenance_integrity_catalog.json",
    "data/analysis/resilience_baseline_catalog.json",
    "data/analysis/surface_authority_verdicts.json",
]


def utc_now() -> tuple[str, str]:
    now = datetime.now(timezone.utc).replace(microsecond=0)
    return now.isoformat(), now.date().isoformat()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def stable_hash(payload: Any) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf8")
    return hashlib.sha256(encoded).hexdigest()


def slug(value: str) -> str:
    return value.replace("-", "_").replace(" ", "_").upper()


def state_rank(state: str) -> int:
    return {"blocked": 4, "stale": 3, "partial": 2, "exact": 1}.get(state, 0)


def overall_state(states: list[str]) -> str:
    if any(state == "blocked" for state in states):
        return "blocked"
    if any(state == "stale" for state in states):
        return "stale"
    if any(state == "partial" for state in states):
        return "partial"
    return "exact"


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    head = "| " + " | ".join(headers) + " |"
    divider = "| " + " | ".join(["---"] * len(headers)) + " |"
    body = "\n".join("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join([head, divider, body])


def map_publication_state(raw_parity: str, raw_publication: str, raw_provenance: str) -> str:
    if raw_parity == "exact" and raw_publication == "published" and raw_provenance == "publishable":
        return "exact"
    if raw_parity == "stale" or raw_publication == "stale":
        return "stale"
    return "blocked"


def map_migration_state(record: dict[str, Any] | None) -> tuple[str, str]:
    if not record:
        return "blocked", "No governed migration or backfill evidence is published for this ring."
    verdict = record.get("verdictState")
    publication = record.get("publicationState")
    parity = record.get("parityState")
    if verdict == "ready" and publication == "published" and parity == "exact":
        return "exact", record["summary"]
    if verdict == "constrained":
        return "partial", record["summary"]
    if verdict == "blocked" and publication == "stale":
        return "stale", record["summary"]
    return "blocked", record["summary"]


def map_resilience_state(record: dict[str, Any] | None, watch_record: dict[str, Any] | None) -> tuple[str, str]:
    if not record:
        return (
            "blocked",
            "No ring-specific restore rehearsal or operational readiness snapshot is published for this environment.",
        )
    readiness = record.get("actualReadinessState")
    if readiness == "exact_and_ready":
        if watch_record and watch_record.get("policy", {}).get("policyState") == "satisfied":
            return "exact", "Release-watch probes and restore evidence are both satisfied for the selected ring."
        return "partial", "Restore evidence is ready but wave observation is not yet satisfied."
    if readiness == "stale_rehearsal_evidence":
        return "stale", "Restore evidence exists but rehearsal freshness has already decayed."
    return "blocked", (
        "Restore authority is blocked by missing manifests, blocked proof, tuple drift, or assurance freeze posture."
    )


def prefer_record(records: list[dict[str, Any]], preferred_ids: list[str]) -> dict[str, Any] | None:
    for preferred_id in preferred_ids:
        for record in records:
            if record.get("scenarioId") == preferred_id:
                return record
    return records[0] if records else None


def build() -> None:
    generated_at, captured_on = utc_now()
    DATA_RELEASE_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_RELEASE_DIR.mkdir(parents=True, exist_ok=True)

    runtime_publication = load_json(RUNTIME_PUBLICATION_BUNDLES_PATH)
    parity_catalog = load_json(RELEASE_PUBLICATION_PARITY_PATH)
    release_contracts = load_json(RELEASE_CONTRACT_MATRIX_PATH)
    environment_ring_policy = load_json(ENVIRONMENT_RING_POLICY_PATH)
    runtime_topology = load_json(RUNTIME_TOPOLOGY_PATH)
    resilience_catalog = load_json(RESILIENCE_BASELINE_PATH)
    migration_catalog = load_json(MIGRATION_BACKFILL_PATH)
    release_watch_catalog = load_json(RELEASE_WATCH_PATH)
    provenance_catalog = load_json(PROVENANCE_INTEGRITY_PATH)
    surface_authority = load_json(SURFACE_AUTHORITY_VERDICTS_PATH)
    region_resilience = load_json(REGION_RESILIENCE_PATH)

    candidate_by_ring = {
        row["environmentRing"]: row for row in runtime_publication["releaseCandidates"]
    }
    runtime_bundle_by_ring = {
        row["environmentRing"]: row for row in runtime_publication["runtimePublicationBundles"]
    }
    parity_by_ring = {
        row["environmentRing"]: row for row in parity_catalog["releasePublicationParityRecords"]
    }
    contract_by_release = {
        row["releaseRef"]: row for row in release_contracts["releaseContractVerificationMatrices"]
    }
    fingerprint_by_ring = {
        row["ringCode"]: row for row in environment_ring_policy["environmentBaselineFingerprints"]
    }
    env_manifest_by_ring = {
        row["environment_ring"]: row for row in runtime_topology["environment_manifests"]
    }

    resilience_by_ring: dict[str, dict[str, Any] | None] = {}
    for ring in RING_ORDER:
        ring_rows = [row for row in resilience_catalog["scenarios"] if row["environmentRing"] == ring]
        resilience_by_ring[ring] = prefer_record(
            ring_rows,
            {
                "local": ["LOCAL_EXACT_READY"],
                "ci-preview": ["CI_PREVIEW_MISSING_BACKUP_MANIFEST"],
                "integration": ["INTEGRATION_BLOCKED_RESTORE_PROOF"],
                "preprod": ["PREPROD_TUPLE_DRIFT", "PREPROD_ASSURANCE_OR_FREEZE_BLOCKED"],
                "production": [],
            }[ring],
        )

    migration_by_ring: dict[str, dict[str, Any] | None] = {}
    for ring in RING_ORDER:
        ring_rows = [row for row in migration_catalog["records"] if row["environmentRef"] == ring]
        migration_by_ring[ring] = prefer_record(
            ring_rows,
            {
                "local": ["LOCAL_READY"],
                "ci-preview": ["CI_PREVIEW_BLOCKED"],
                "integration": ["INTEGRATION_CONFLICT"],
                "preprod": ["PREPROD_WITHDRAWN"],
                "production": [],
            }[ring],
        )

    watch_by_ring: dict[str, dict[str, Any] | None] = {}
    for ring in RING_ORDER:
        ring_rows = [row for row in release_watch_catalog["records"] if row["environmentRing"] == ring]
        watch_by_ring[ring] = prefer_record(
            ring_rows,
            {
                "local": ["LOCAL_SATISFIED"],
                "ci-preview": ["CI_PREVIEW_STALE"],
                "integration": ["INTEGRATION_STALE"],
                "preprod": ["PREPROD_ROLLBACK_REQUIRED"],
                "production": [],
            }[ring],
        )

    provenance_by_ring: dict[str, dict[str, Any] | None] = {}
    for ring in RING_ORDER:
        ring_rows = [row for row in provenance_catalog["provenanceScenarios"] if row["environmentRing"] == ring]
        provenance_by_ring[ring] = prefer_record(
            ring_rows,
            {
                "local": ["LOCAL_VERIFIED_BASELINE"],
                "ci-preview": ["CI_PREVIEW_VERIFIED_BROWSER_SCOPE"],
                "integration": ["INTEGRATION_SIGNATURE_DRIFT_QUARANTINED"],
                "preprod": ["PREPROD_BINDING_DRIFT_QUARANTINED"],
                "production": ["PRODUCTION_REVOKED_WITHDRAWN", "PRODUCTION_SUPERSEDED_WITHDRAWN"],
            }[ring],
        )

    local_candidate = candidate_by_ring["local"]
    local_contract = contract_by_release["RC_LOCAL_V1"]
    local_parity = parity_by_ring["local"]
    local_watch = watch_by_ring["local"]
    local_resilience = resilience_by_ring["local"]
    local_migration = migration_by_ring["local"]
    local_fingerprint = fingerprint_by_ring["local"]

    matrix_rows: list[dict[str, Any]] = []
    blockers: list[dict[str, Any]] = []
    blocker_lookup: dict[str, dict[str, Any]] = {}
    ring_summaries: list[dict[str, Any]] = []
    ring_summary_blocker_ids: list[str] = []

    for ring in RING_ORDER:
        candidate = candidate_by_ring[ring]
        parity = parity_by_ring[ring]
        runtime_bundle = runtime_bundle_by_ring[ring]
        fingerprint = fingerprint_by_ring[ring]
        env_manifest = env_manifest_by_ring[ring]
        migration_record = migration_by_ring[ring]
        resilience_record = resilience_by_ring[ring]
        watch_record = watch_by_ring[ring]
        provenance_record = provenance_by_ring[ring]

        ring_rows: list[dict[str, Any]] = []

        publication_state = map_publication_state(
            parity["parityState"],
            runtime_bundle["publicationState"],
            parity["provenanceConsumptionState"],
        )
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_RUNTIME_PUBLICATION_AND_PARITY",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "runtime_publication_and_parity",
                "dimension_label": "Runtime publication and parity",
                "compatibility_state": publication_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": runtime_bundle["runtimePublicationBundleId"],
                "subject_label": RING_LABELS[ring],
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/runtime_publication_bundles.json",
                    "data/analysis/release_publication_parity_records.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": (
                    "Published runtime truth stays exact only while parity, publication, and provenance "
                    "consumption stay aligned."
                ),
            }
        )

        topology_state = "exact" if fingerprint["fingerprintState"] == "aligned" else "blocked"
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_RUNTIME_TOPOLOGY",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "runtime_topology",
                "dimension_label": "Runtime topology",
                "compatibility_state": topology_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": env_manifest["topology_tuple_hash"],
                "subject_label": f"{len(env_manifest['runtime_workload_family_refs'])} workload families",
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/runtime_topology_manifest.json",
                    "data/analysis/environment_ring_policy.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": (
                    "EnvironmentBaselineFingerprint alignment is mandatory before a ring can claim it still "
                    "matches the approved runtime shape."
                ),
            }
        )

        workload_state = "exact" if topology_state == "exact" and env_manifest["runtime_workload_family_refs"] else "blocked"
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_WORKLOAD_FAMILIES",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "workload_families",
                "dimension_label": "Workload families",
                "compatibility_state": workload_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": ";".join(env_manifest["runtime_workload_family_refs"]),
                "subject_label": f"{len(env_manifest['runtime_workload_family_refs'])} workload families",
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/runtime_topology_manifest.json",
                    "data/analysis/environment_ring_policy.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": "Every ring must preserve the same declared workload-family estate and service-identity map.",
            }
        )

        trust_state = "exact" if topology_state == "exact" and env_manifest["trust_zone_boundary_refs"] else "blocked"
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_TRUST_ZONE_BOUNDARIES",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "trust_zone_boundaries",
                "dimension_label": "Trust-zone boundaries",
                "compatibility_state": trust_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": ";".join(env_manifest["trust_zone_boundary_refs"]),
                "subject_label": f"{len(env_manifest['trust_zone_boundary_refs'])} trust boundaries",
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/runtime_topology_manifest.json",
                    "data/analysis/region_resilience_matrix.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": "Ring equivalence is invalid if the trust-zone and boundary inventory drifts.",
            }
        )

        if ring == "local":
            gateway_state = "partial"
            gateway_notes = (
                "The local ring keeps one exact tuple but current gateway-backed surfaces remain bounded by "
                "design lint, accessibility, and browser posture ceilings."
            )
        else:
            gateway_state = "blocked"
            gateway_notes = (
                "No non-local ring can expose gateway surfaces as compatible while runtime publication, "
                "restore, or parity evidence is blocked."
            )
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_GATEWAY_SURFACES",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "gateway_surfaces",
                "dimension_label": "Gateway surfaces",
                "compatibility_state": gateway_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": ";".join(env_manifest["gateway_surface_refs"]),
                "subject_label": f"{len(env_manifest['gateway_surface_refs'])} gateway surfaces",
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/surface_authority_verdicts.json",
                    "data/analysis/release_publication_parity_records.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": gateway_notes,
            }
        )

        bridge_state = "exact" if topology_state == "exact" else "blocked"
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_CHANNEL_BRIDGE_CAPABILITIES",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "channel_bridge_capabilities",
                "dimension_label": "Channel and bridge assumptions",
                "compatibility_state": bridge_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": candidate["minimumBridgeCapabilitySetRef"],
                "subject_label": candidate["channelManifestSetRef"],
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/runtime_topology_manifest.json",
                    "data/analysis/runtime_publication_bundles.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": "Channel manifests and minimum bridge floors are part of the environment baseline, not optional sidecars.",
            }
        )

        migration_state, migration_notes = map_migration_state(migration_record)
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_MIGRATION_BACKFILL_POSTURE",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "migration_backfill_posture",
                "dimension_label": "Migration and backfill posture",
                "compatibility_state": migration_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": candidate["schemaMigrationPlanRef"],
                "subject_label": candidate["projectionBackfillPlanRef"],
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/migration_backfill_control_catalog.json",
                    "data/analysis/release_publication_parity_records.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": migration_notes,
            }
        )

        resilience_state, resilience_notes = map_resilience_state(resilience_record, watch_record)
        ring_rows.append(
            {
                "compatibility_row_id": f"ECM_131_{slug(ring)}_OBSERVABILITY_RESTORE_POSTURE",
                "environment_compatibility_ref": f"ECE_131_{slug(ring)}",
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "dimension_code": "observability_restore_posture",
                "dimension_label": "Observability and restore posture",
                "compatibility_state": resilience_state,
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "subject_ref": provenance_record["scenarioId"] if provenance_record else "missing_provenance_scenario",
                "subject_label": resilience_record["snapshotId"] if resilience_record else "missing_readiness_snapshot",
                "environment_baseline_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "evidence_refs": [
                    "data/analysis/build_provenance_integrity_catalog.json",
                    "data/analysis/release_watch_pipeline_catalog.json",
                    "data/analysis/resilience_baseline_catalog.json",
                ],
                "recovery_obligation_refs": [candidate["recoveryDispositionSetRef"]],
                "notes": resilience_notes,
            }
        )

        for row in ring_rows:
            if row["compatibility_state"] != "exact":
                blocker_id = f"FZB_131_{slug(ring)}_{slug(row['dimension_code'])}"
                blocker = {
                    "blockerId": blocker_id,
                    "environmentRing": ring,
                    "releaseRef": candidate["releaseId"],
                    "dimensionCode": row["dimension_code"],
                    "dimensionLabel": row["dimension_label"],
                    "compatibilityState": row["compatibility_state"],
                    "severity": "warning" if row["compatibility_state"] == "partial" else "blocked",
                    "title": f"{RING_LABELS[ring]} {row['dimension_label']} {row['compatibility_state']}",
                    "summary": row["notes"],
                    "relatedMatrixRowId": row["compatibility_row_id"],
                    "evidenceRefs": row["evidence_refs"],
                    "recoveryObligationRefs": row["recovery_obligation_refs"],
                    "rawPublicationState": row["raw_publication_state"],
                    "rawParityState": row["raw_parity_state"],
                }
                row["blocker_refs"] = [blocker_id]
                blockers.append(blocker)
                blocker_lookup[blocker_id] = blocker
            else:
                row["blocker_refs"] = []
            matrix_rows.append(row)

        ring_state = overall_state([row["compatibility_state"] for row in ring_rows])
        summary_ref = f"ECE_131_{slug(ring)}"
        summary_blockers = [row["blocker_refs"][0] for row in ring_rows if row["blocker_refs"]]
        summary = {
            "environmentCompatibilityRef": summary_ref,
            "environmentRing": ring,
            "releaseRef": candidate["releaseId"],
            "overallCompatibilityState": ring_state,
            "runtimePublicationBundleRef": runtime_bundle["runtimePublicationBundleId"],
            "releasePublicationParityRef": parity["publicationParityRecordId"],
            "environmentBaselineFingerprintRef": fingerprint["environmentBaselineFingerprintId"],
            "ringFingerprintState": fingerprint["fingerprintState"],
            "dimensionStates": {row["dimension_code"]: row["compatibility_state"] for row in ring_rows},
            "blockerRefs": summary_blockers,
            "notes": (
                "This ring summary is derived from the exact matrix rows below and is allowed to stay non-exact "
                "only if the blockers remain explicit."
            ),
        }
        ring_summaries.append(summary)
        if ring_state != "exact":
            blocker_id = f"FZB_131_{slug(ring)}_SUMMARY"
            blockers.append(
                {
                    "blockerId": blocker_id,
                    "environmentRing": ring,
                    "releaseRef": candidate["releaseId"],
                    "dimensionCode": "environment_summary",
                    "dimensionLabel": "Environment summary",
                    "compatibilityState": ring_state,
                    "severity": "warning" if ring_state == "partial" else "blocked",
                    "title": f"{RING_LABELS[ring]} compatibility summary {ring_state}",
                    "summary": (
                        f"{RING_LABELS[ring]} remains {ring_state} because one or more ring dimensions are "
                        "not exact. Promotion cannot treat the ring as equivalent until those rows recover."
                    ),
                    "relatedMatrixRowId": None,
                    "evidenceRefs": [summary_ref, "data/release/environment_compatibility_matrix.csv"],
                    "recoveryObligationRefs": [candidate["recoveryDispositionSetRef"]],
                    "blockingReasonRefs": summary_blockers,
                }
            )
            ring_summary_blocker_ids.append(blocker_id)

    ci_preview_candidate = candidate_by_ring["ci-preview"]
    ci_preview_parity = parity_by_ring["ci-preview"]
    if ci_preview_candidate["parityState"] == "exact" and ci_preview_parity["parityState"] != "exact":
        legacy_blocker_id = "FZB_131_CI_PREVIEW_LEGACY_RELEASE_ROW_DRIFT"
        blockers.append(
            {
                "blockerId": legacy_blocker_id,
                "environmentRing": "ci-preview",
                "releaseRef": ci_preview_candidate["releaseId"],
                "dimensionCode": "legacy_release_candidate_drift",
                "dimensionLabel": "Legacy release-candidate drift",
                "compatibilityState": "blocked",
                "severity": "blocked",
                "title": "CI preview release row overruns later parity truth",
                "summary": (
                    "The earlier release-candidate row still reports ci-preview as exact while the published "
                    "parity record, runtime bundle, migration runner, and resilience pack all treat the ring "
                    "as stale or blocked. The freeze pack binds to the later published truth."
                ),
                "relatedMatrixRowId": "ECM_131_CI_PREVIEW_RUNTIME_PUBLICATION_AND_PARITY",
                "evidenceRefs": [
                    "data/analysis/runtime_publication_bundles.json",
                    "data/analysis/release_publication_parity_records.json",
                    "data/analysis/migration_backfill_control_catalog.json",
                    "data/analysis/resilience_baseline_catalog.json",
                ],
                "recoveryObligationRefs": [ci_preview_candidate["recoveryDispositionSetRef"]],
            }
        )
        ring_summary_blocker_ids.append(legacy_blocker_id)

    freeze_verdict = "exact"
    if local_parity["parityState"] != "exact" or local_fingerprint["fingerprintState"] != "aligned":
        freeze_verdict = "blocked"
    elif local_resilience["actualReadinessState"] != "exact_and_ready":
        freeze_verdict = "partial"

    artifact_digest_refs = [
        f"artifact::{artifact['artifactId']}::sha256::{artifact['sha256Ref']}"
        for artifact in local_candidate["artifactDigests"]
    ]
    release_contract_matrix_hash = local_contract.get(
        "releaseContractMatrixHash", stable_hash(local_contract)
    )[:16]

    selected_candidate = {
        "releaseRef": local_candidate["releaseId"],
        "releaseApprovalFreezeRef": local_candidate["releaseApprovalFreezeRef"],
        "artifactDigestRefs": artifact_digest_refs,
        "artifactDigestEntries": local_candidate["artifactDigests"],
        "bundleHashRefs": local_candidate["bundleHashRefs"],
        "bundleFreezeDigestRef": local_candidate["bundleFreezeDigestRef"],
        "compilationTupleHash": local_contract["compilationTupleHash"],
        "routeContractDigestRefs": local_contract["routeContractDigestRefs"],
        "frontendContractDigestRefs": local_contract["frontendContractDigestRefs"],
        "designContractDigestRefs": local_contract["designContractDigestRefs"],
        "designContractLintVerdictRefs": local_contract["designContractLintVerdictRefs"],
        "runtimePublicationBundleRef": local_parity["runtimePublicationBundleRef"],
        "releasePublicationParityRef": local_parity["publicationParityRecordId"],
        "releaseContractVerificationMatrixRef": local_contract["releaseContractVerificationMatrixId"],
        "releaseContractMatrixHash": release_contract_matrix_hash,
        "bridgeCapabilityEvidenceRefs": [
            local_candidate["minimumBridgeCapabilitySetRef"],
            local_candidate["channelManifestSetRef"],
            *local_watch["currentTuple"]["activeChannelFreezeRefs"],
        ],
        "schemaMigrationPlanRef": local_candidate["schemaMigrationPlanRef"],
        "projectionBackfillPlanRef": local_candidate["projectionBackfillPlanRef"],
        "environmentCompatibilityEvidenceRefs": [
            summary["environmentCompatibilityRef"] for summary in ring_summaries
        ],
        "ringFingerprintRefs": [
            fingerprint_by_ring[ring]["environmentBaselineFingerprintId"] for ring in RING_ORDER
        ],
        "freezeVerdict": freeze_verdict,
        "reasonRefs": ring_summary_blocker_ids,
        "notes": [
            "The frozen candidate is exact for the current local simulator-backed tuple: parity, runtime publication, baseline fingerprint, migration posture, release watch, and restore posture all agree.",
            "The environment evidence remains intentionally non-equivalent above local; higher rings stay blocked or stale until the published parity, baseline fingerprint, migration, and restore rows recover.",
            "Gateway-facing browser posture stays bounded even under an exact tuple because seq_130 still publishes accessibility, design-lint, and browser-posture ceilings instead of publishable-live truth.",
        ],
        "gitRef": local_candidate["gitRef"],
        "behaviorContractSetRef": local_candidate["behaviorContractSetRef"],
        "surfaceSchemaSetRef": local_candidate["surfaceSchemaSetRef"],
        "runtimeTopologyManifestRef": local_candidate["runtimeTopologyManifestRef"],
        "topologyTupleHash": local_candidate["topologyTupleHash"],
        "environmentBaselineFingerprintRef": local_fingerprint["environmentBaselineFingerprintId"],
        "baselineTupleHash": local_fingerprint["baselineTupleHash"],
        "approvalTupleHash": local_watch["currentTuple"]["approvalTupleHash"],
        "watchTupleHash": local_watch["tuple"]["watchTupleHash"],
        "activeReleaseWatchTupleRefs": local_candidate["activeReleaseWatchTupleRefs"],
        "releaseWatchScenarioId": local_watch["scenarioId"],
        "requiredAssuranceSliceRefs": local_candidate["requiredAssuranceSliceRefs"],
        "recoveryDispositionSetRef": local_candidate["recoveryDispositionSetRef"],
        "continuityEvidenceContractRefs": local_candidate["continuityEvidenceContractRefs"],
        "continuityEvidenceDigestRefs": local_watch["currentTuple"]["continuityEvidenceDigestRefs"],
        "provenanceRef": local_candidate["provenanceRef"],
        "provenanceScenarioId": provenance_by_ring["local"]["scenarioId"],
        "sbomRef": local_candidate["sbomRef"],
        "promotionIntentRefs": local_candidate["promotionIntentRefs"],
        "channelManifestSetRef": local_candidate["channelManifestSetRef"],
        "minimumBridgeCapabilitySetRef": local_candidate["minimumBridgeCapabilitySetRef"],
        "waveState": local_candidate["waveState"],
        "routeExposureState": local_parity["routeExposureState"],
        "publicationState": local_candidate["publicationState"],
        "candidateTupleHash": stable_hash(
            {
                "releaseRef": local_candidate["releaseId"],
                "bundleFreezeDigestRef": local_candidate["bundleFreezeDigestRef"],
                "compilationTupleHash": local_contract["compilationTupleHash"],
                "runtimePublicationBundleRef": local_parity["runtimePublicationBundleRef"],
                "releasePublicationParityRef": local_parity["publicationParityRecordId"],
                "environmentCompatibilityEvidenceRefs": [
                    summary["environmentCompatibilityRef"] for summary in ring_summaries
                ],
            }
        ),
        "source_refs": [
            "data/analysis/runtime_publication_bundles.json#RC_LOCAL_V1",
            "data/analysis/release_publication_parity_records.json#RC_LOCAL_V1",
            "data/analysis/release_contract_verification_matrix.json#RCVM_LOCAL_V1",
            "data/analysis/environment_ring_policy.json#EBF_LOCAL_V1",
            "data/analysis/release_watch_pipeline_catalog.json#LOCAL_SATISFIED",
            "data/analysis/resilience_baseline_catalog.json#LOCAL_EXACT_READY",
            "data/analysis/migration_backfill_control_catalog.json#LOCAL_READY",
        ],
    }

    ring_fingerprint_rows = []
    for ring in RING_ORDER:
        candidate = candidate_by_ring[ring]
        parity = parity_by_ring[ring]
        runtime_bundle = runtime_bundle_by_ring[ring]
        fingerprint = fingerprint_by_ring[ring]
        env_manifest = env_manifest_by_ring[ring]
        ring_fingerprint_rows.append(
            {
                "ring_fingerprint_ref": fingerprint["environmentBaselineFingerprintId"],
                "environment_ring": ring,
                "release_ref": candidate["releaseId"],
                "fingerprint_state": fingerprint["fingerprintState"],
                "baseline_tuple_hash": fingerprint["baselineTupleHash"],
                "compilation_tuple_hash": fingerprint["compilationTupleHash"],
                "topology_tuple_hash": fingerprint["topologyTupleHash"],
                "runtime_topology_manifest_ref": fingerprint["runtimeTopologyManifestRef"],
                "allowed_region_roles": ";".join(fingerprint["allowedRegionRoles"]),
                "default_write_region_ref": fingerprint["defaultWriteRegionRef"],
                "trust_zone_boundary_count": len(env_manifest["trust_zone_boundary_refs"]),
                "workload_family_count": len(env_manifest["runtime_workload_family_refs"]),
                "gateway_surface_count": len(env_manifest["gateway_surface_refs"]),
                "service_identity_count": len(env_manifest["service_identity_refs"]),
                "egress_allowlist_count": len(env_manifest["egress_allowlist_refs"]),
                "release_approval_freeze_ref": fingerprint["releaseApprovalFreezeRef"],
                "channel_manifest_set_ref": candidate["channelManifestSetRef"],
                "minimum_bridge_capability_set_ref": candidate["minimumBridgeCapabilitySetRef"],
                "runtime_publication_bundle_ref": runtime_bundle["runtimePublicationBundleId"],
                "release_publication_parity_ref": parity["publicationParityRecordId"],
                "raw_publication_state": runtime_bundle["publicationState"],
                "raw_parity_state": parity["parityState"],
                "source_refs": ";".join(
                    ["data/analysis/environment_ring_policy.json", "data/analysis/runtime_topology_manifest.json"]
                ),
            }
        )

    release_contract_matrix_export = {
        "task_id": TASK_ID,
        "generated_at": generated_at,
        "captured_on": captured_on,
        "selected_release_ref": "RC_LOCAL_V1",
        "selected_release_contract_verification_matrix_id": local_contract[
            "releaseContractVerificationMatrixId"
        ],
        "selected_release_contract_verification_matrix": local_contract,
        "source_precedence": SOURCE_PRECEDENCE,
    }

    release_candidate_export = {
        "task_id": TASK_ID,
        "generated_at": generated_at,
        "captured_on": captured_on,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "selectedEnvironmentRing": "local",
        "selectedReleaseRef": "RC_LOCAL_V1",
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            str(path.relative_to(ROOT))
            for path in [
                RUNTIME_PUBLICATION_BUNDLES_PATH,
                RELEASE_PUBLICATION_PARITY_PATH,
                RELEASE_CONTRACT_MATRIX_PATH,
                ENVIRONMENT_RING_POLICY_PATH,
                RUNTIME_TOPOLOGY_PATH,
                MIGRATION_BACKFILL_PATH,
                RELEASE_WATCH_PATH,
                RESILIENCE_BASELINE_PATH,
                PROVENANCE_INTEGRITY_PATH,
                SURFACE_AUTHORITY_VERDICTS_PATH,
            ]
        ],
        "releaseCandidateTuple": selected_candidate,
        "environmentCompatibilitySummaries": ring_summaries,
        "summary": {
            "freezeVerdict": freeze_verdict,
            "ringCount": len(RING_ORDER),
            "exactRingCount": sum(1 for summary in ring_summaries if summary["overallCompatibilityState"] == "exact"),
            "partialRingCount": sum(
                1 for summary in ring_summaries if summary["overallCompatibilityState"] == "partial"
            ),
            "blockedOrStaleRingCount": sum(
                1
                for summary in ring_summaries
                if summary["overallCompatibilityState"] in {"blocked", "stale"}
            ),
            "blockerCount": len(blockers),
            "localSurfaceSummary": surface_authority["summary"],
            "selectedWatchScenarioId": local_watch["scenarioId"],
            "selectedResilienceScenarioId": local_resilience["scenarioId"],
            "selectedMigrationScenarioId": local_migration["scenarioId"],
        },
    }

    freeze_blockers_export = {
        "task_id": TASK_ID,
        "generated_at": generated_at,
        "captured_on": captured_on,
        "selected_release_ref": "RC_LOCAL_V1",
        "freeze_verdict": freeze_verdict,
        "blockers": blockers,
        "summary": {
            "active_count": len(blockers),
            "blocked_count": sum(1 for blocker in blockers if blocker["severity"] == "blocked"),
            "warning_count": sum(1 for blocker in blockers if blocker["severity"] == "warning"),
            "environment_summary_blocker_count": sum(
                1 for blocker in blockers if blocker["dimensionCode"] == "environment_summary"
            ),
        },
    }

    board_data = {
        "taskId": TASK_ID,
        "visualMode": VISUAL_MODE,
        "generatedAt": generated_at,
        "releaseCandidate": selected_candidate,
        "ringSummaries": ring_summaries,
        "matrixRows": matrix_rows,
        "blockers": blockers,
        "summary": release_candidate_export["summary"],
        "stateBadges": STATE_BADGES,
    }

    write_json(RELEASE_CANDIDATE_TUPLE_PATH, release_candidate_export)
    write_json(RELEASE_CONTRACT_MATRIX_EXPORT_PATH, release_contract_matrix_export)
    write_json(FREEZE_BLOCKERS_PATH, freeze_blockers_export)
    write_csv(
        ENVIRONMENT_COMPATIBILITY_MATRIX_PATH,
        [
            "compatibility_row_id",
            "environment_compatibility_ref",
            "environment_ring",
            "release_ref",
            "dimension_code",
            "dimension_label",
            "compatibility_state",
            "raw_publication_state",
            "raw_parity_state",
            "subject_ref",
            "subject_label",
            "environment_baseline_fingerprint_ref",
            "runtime_publication_bundle_ref",
            "release_publication_parity_ref",
            "evidence_refs",
            "blocker_refs",
            "recovery_obligation_refs",
            "notes",
        ],
        [
            {
                **row,
                "evidence_refs": ";".join(row["evidence_refs"]),
                "blocker_refs": ";".join(row["blocker_refs"]),
                "recovery_obligation_refs": ";".join(row["recovery_obligation_refs"]),
            }
            for row in matrix_rows
        ],
    )
    write_csv(
        RING_FINGERPRINT_MATRIX_PATH,
        [
            "ring_fingerprint_ref",
            "environment_ring",
            "release_ref",
            "fingerprint_state",
            "baseline_tuple_hash",
            "compilation_tuple_hash",
            "topology_tuple_hash",
            "runtime_topology_manifest_ref",
            "allowed_region_roles",
            "default_write_region_ref",
            "trust_zone_boundary_count",
            "workload_family_count",
            "gateway_surface_count",
            "service_identity_count",
            "egress_allowlist_count",
            "release_approval_freeze_ref",
            "channel_manifest_set_ref",
            "minimum_bridge_capability_set_ref",
            "runtime_publication_bundle_ref",
            "release_publication_parity_ref",
            "raw_publication_state",
            "raw_parity_state",
            "source_refs",
        ],
        ring_fingerprint_rows,
    )

    FREEZE_DOC_PATH.write_text(
        dedent(
            f"""\
            # 131 Release Candidate Freeze

            Generated: `{generated_at}`  
            Candidate: `{selected_candidate["releaseRef"]}`  
            Verdict: `{selected_candidate["freezeVerdict"]}`

            This pack freezes one exact Phase 0 simulator-backed release candidate and binds it to explicit
            environment-compatibility evidence instead of assuming every ring is equivalent.

            ## Frozen Tuple

            {markdown_table(
                ["Field", "Value"],
                [
                    ["releaseRef", selected_candidate["releaseRef"]],
                    ["releaseApprovalFreezeRef", selected_candidate["releaseApprovalFreezeRef"]],
                    ["gitRef", selected_candidate["gitRef"]],
                    ["bundleFreezeDigestRef", selected_candidate["bundleFreezeDigestRef"]],
                    ["compilationTupleHash", selected_candidate["compilationTupleHash"]],
                    ["runtimePublicationBundleRef", selected_candidate["runtimePublicationBundleRef"]],
                    ["releasePublicationParityRef", selected_candidate["releasePublicationParityRef"]],
                    ["releaseContractVerificationMatrixRef", selected_candidate["releaseContractVerificationMatrixRef"]],
                    ["environmentBaselineFingerprintRef", selected_candidate["environmentBaselineFingerprintRef"]],
                    ["watchTupleHash", selected_candidate["watchTupleHash"]],
                ],
            )}

            ## Why The Tuple Is Still Exact

            - Local runtime publication, parity, baseline fingerprint, migration posture, watch evidence, and restore posture all resolve exact.
            - The tuple keeps later ring blockers explicit instead of suppressing them behind a soft “promotion later” claim.
            - Local gateway posture remains bounded by browser, accessibility, and design-lint ceilings; that does not reopen live writability.

            ## Bound Promotion Blockers

            {markdown_table(
                ["Ring", "Overall state", "Fingerprint", "Runtime/parity"],
                [
                    [
                        summary["environmentRing"],
                        summary["overallCompatibilityState"],
                        summary["ringFingerprintState"],
                        summary["dimensionStates"]["runtime_publication_and_parity"],
                    ]
                    for summary in ring_summaries
                ],
            )}
            """
        )
        + "\n"
    )

    ENV_COMPATIBILITY_DOC_PATH.write_text(
        dedent(
            f"""\
            # 131 Environment Compatibility Evidence

            The environment matrix publishes one explicit score for every ring and every required dimension.

            ## Ring Summary

            {markdown_table(
                ["Ring", "Overall", "Topology", "Gateway surfaces", "Migration", "Restore"],
                [
                    [
                        summary["environmentRing"],
                        summary["overallCompatibilityState"],
                        summary["dimensionStates"]["runtime_topology"],
                        summary["dimensionStates"]["gateway_surfaces"],
                        summary["dimensionStates"]["migration_backfill_posture"],
                        summary["dimensionStates"]["observability_restore_posture"],
                    ]
                    for summary in ring_summaries
                ],
            )}

            ## Matrix Policy

            - `runtime_publication_and_parity` proves the live bundle still matches the approved tuple.
            - `runtime_topology`, `workload_families`, and `trust_zone_boundaries` are driven by serialized ring fingerprints.
            - `gateway_surfaces` remains partial in local and blocked elsewhere until the published browser posture actually recovers.
            - `migration_backfill_posture` and `observability_restore_posture` fail closed when ring-specific evidence is stale, blocked, or missing.
            """
        )
        + "\n"
    )

    RELEASE_CONTRACT_DOC_PATH.write_text(
        dedent(
            f"""\
            # 131 Release Contract Verification Matrix

            The freeze pack republishes the exact verification matrix consumed by the selected candidate.

            ## Matrix Summary

            {markdown_table(
                ["Field", "Value"],
                [
                    ["releaseContractVerificationMatrixId", local_contract["releaseContractVerificationMatrixId"]],
                    ["releaseRef", local_contract["releaseRef"]],
                    ["candidateBundleHash", local_contract["candidateBundleHash"]],
                    ["baselineTupleHash", local_contract["baselineTupleHash"]],
                    ["compilationTupleHash", local_contract["compilationTupleHash"]],
                    ["releaseContractMatrixHash", release_contract_matrix_hash],
                    ["route digest count", str(len(local_contract["routeContractDigestRefs"]))],
                    ["frontend digest count", str(len(local_contract["frontendContractDigestRefs"]))],
                    ["design digest count", str(len(local_contract["designContractDigestRefs"]))],
                    ["design lint verdict count", str(len(local_contract["designContractLintVerdictRefs"]))],
                ],
            )}

            ## Rule

            Later promotion work must consume `data/release/release_contract_verification_matrix.json` directly.
            It may not reconstruct a softer matrix from subset artifacts.
            """
        )
        + "\n"
    )

    BLOCKERS_DOC_PATH.write_text(
        dedent(
            f"""\
            # 131 Freeze Blockers And Recovery Rules

            ## Active Blockers

            {markdown_table(
                ["Blocker", "Ring", "Dimension", "State"],
                [
                    [
                        blocker["blockerId"],
                        blocker["environmentRing"],
                        blocker["dimensionLabel"],
                        blocker["compatibilityState"],
                    ]
                    for blocker in blockers[:20]
                ],
            )}

            ## Recovery Rules

            - A blocked or stale ring may not inherit compatibility from a signed artifact or an aligned local tuple.
            - Every blocker remains attached to explicit recovery obligations through the corresponding `recoveryDispositionSetRef`.
            - The candidate dossier stays exact only while those blocker rows remain visible and machine-readable.
            """
        )
        + "\n"
    )

    html = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Release Candidate Freeze Board</title>
    <style>
      :root {
        --canvas: #F7F8FA;
        --panel: #FFFFFF;
        --inset: #E8EEF3;
        --border: rgba(36, 49, 61, 0.12);
        --text-strong: #0F1720;
        --text: #24313D;
        --text-muted: #5E6B78;
        --accent-frozen: #5B61F6;
        --accent-compatible: #117A55;
        --accent-review: #B7791F;
        --accent-blocked: #B42318;
        --shadow: 0 22px 50px rgba(15, 23, 32, 0.08);
        --radius-xl: 24px;
        --radius-lg: 18px;
        --radius-md: 14px;
        --radius-sm: 12px;
      }
      * { box-sizing: border-box; }
      html { background: var(--canvas); }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at right top, rgba(91, 97, 246, 0.08), transparent 30%),
          radial-gradient(circle at left 18%, rgba(17, 122, 85, 0.06), transparent 24%),
          linear-gradient(180deg, var(--canvas), #f1f4f8);
        color: var(--text);
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }
      body[data-reduced-motion="true"] * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      h1, h2, h3, .wordmark {
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
      }
      button, select { font: inherit; }
      .page { max-width: 1560px; margin: 0 auto; padding: 0 20px 40px; }
      .page,
      .page > *,
      .masthead > *,
      .layout > *,
      .stack,
      .panel,
      .table-scroll {
        min-width: 0;
      }
      .masthead {
        position: sticky;
        top: 0;
        z-index: 20;
        height: 72px;
        display: grid;
        grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 220px));
        gap: 14px;
        align-items: center;
        padding: 12px 0;
        background: rgba(247, 248, 250, 0.94);
        backdrop-filter: blur(14px);
      }
      .brand,
      .summary-pill,
      .panel,
      .rail,
      .inspector {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
      }
      .brand,
      .summary-pill {
        min-height: 48px;
        border-radius: 999px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .wordmark {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
      }
      .frozen-mark {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(91, 97, 246, 0.16), rgba(17, 122, 85, 0.12));
      }
      .brand-copy,
      .summary-copy { display: grid; gap: 2px; }
      .brand-mode,
      .summary-label,
      .meta-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-muted);
      }
      .brand-title,
      .summary-value {
        font-size: 18px;
        color: var(--text-strong);
        font-weight: 700;
      }
      .layout {
        display: grid;
        grid-template-columns: 272px minmax(0, 1fr) 404px;
        gap: 20px;
        margin-top: 20px;
        align-items: start;
      }
      .rail,
      .inspector {
        position: sticky;
        top: 92px;
        border-radius: var(--radius-xl);
        padding: 18px;
      }
      .rail { display: grid; gap: 18px; }
      .rail-group {
        display: grid;
        gap: 10px;
      }
      .rail select {
        min-height: 44px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        background: var(--panel);
        padding: 0 12px;
      }
      .stack {
        display: grid;
        gap: 20px;
      }
      .panel {
        border-radius: var(--radius-xl);
        padding: 18px;
      }
      .panel-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: baseline;
        margin-bottom: 14px;
      }
      .panel-header h2,
      .inspector h2 {
        margin: 0;
        font-size: 20px;
        color: var(--text-strong);
      }
      .caption,
      .inspector-note {
        margin: 0;
        color: var(--text-muted);
        line-height: 1.55;
      }
      .tuple-braid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }
      .tuple-button,
      .ring-button,
      .blocker-button {
        width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: linear-gradient(180deg, rgba(232, 238, 243, 0.52), rgba(255, 255, 255, 0.98));
        color: var(--text);
        text-align: left;
        padding: 14px;
        transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
      }
      .tuple-button:hover,
      .ring-button:hover,
      .blocker-button:hover,
      .tuple-button:focus-visible,
      .ring-button:focus-visible,
      .blocker-button:focus-visible {
        transform: translateY(-1px);
        border-color: rgba(91, 97, 246, 0.48);
        outline: none;
      }
      .tuple-button[data-selected="true"],
      .ring-button[data-selected="true"],
      .blocker-button[data-selected="true"] {
        border-color: rgba(91, 97, 246, 0.62);
        box-shadow: 0 18px 32px rgba(91, 97, 246, 0.14);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }
      .state-exact { background: rgba(17, 122, 85, 0.14); color: var(--accent-compatible); }
      .state-partial { background: rgba(183, 121, 31, 0.14); color: var(--accent-review); }
      .state-stale,
      .state-blocked { background: rgba(180, 35, 24, 0.14); color: var(--accent-blocked); }
      .mono {
        font-family: "SFMono-Regular", "SF Mono", "Menlo", monospace;
        font-size: 12px;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .ring-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 11px 12px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      th {
        text-align: left;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }
      tr[data-selected="true"] { background: rgba(91, 97, 246, 0.08); }
      .table-scroll {
        overflow-x: auto;
      }
      .inspector dl {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        margin: 0;
      }
      .inspector dd {
        margin: 0;
        color: var(--text-strong);
      }
      .inspector-block {
        display: grid;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid var(--border);
      }
      .list {
        display: grid;
        gap: 8px;
      }
      .list-item {
        padding: 10px 12px;
        border-radius: var(--radius-sm);
        background: rgba(232, 238, 243, 0.48);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      @media (max-width: 1280px) {
        .layout {
          grid-template-columns: minmax(0, 1fr);
        }
        .rail,
        .inspector {
          position: static;
        }
        .masthead {
          grid-template-columns: minmax(0, 1fr);
          height: auto;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="masthead">
        <div class="brand">
          <div class="wordmark">
            <span class="frozen-mark" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 5h10M4 9h10M4 13h10" stroke="#5B61F6" stroke-width="1.6" stroke-linecap="round"/>
                <circle cx="6" cy="5" r="1.5" fill="#117A55"/>
                <circle cx="12" cy="9" r="1.5" fill="#5B61F6"/>
                <circle cx="8" cy="13" r="1.5" fill="#B42318"/>
              </svg>
            </span>
            <div class="brand-copy">
              <span class="brand-mode">Vecells • Release_Candidate_Freeze_Board</span>
              <span class="brand-title">Frozen Tuple Dossier</span>
            </div>
          </div>
          <span class="badge state-exact" data-testid="candidate-verdict-badge">Exact</span>
        </div>
        <div class="summary-pill">
          <div class="summary-copy">
            <span class="summary-label">Candidate</span>
            <span class="summary-value" data-testid="summary-release-ref"></span>
          </div>
          <span class="mono" data-testid="summary-tuple-hash"></span>
        </div>
        <div class="summary-pill">
          <div class="summary-copy">
            <span class="summary-label">Ring States</span>
            <span class="summary-value" data-testid="summary-ring-counts"></span>
          </div>
        </div>
        <div class="summary-pill">
          <div class="summary-copy">
            <span class="summary-label">Active Blockers</span>
            <span class="summary-value" data-testid="summary-blocker-count"></span>
          </div>
        </div>
      </header>
      <div class="layout">
        <nav class="rail" aria-label="Release candidate filters">
          <div class="rail-group">
            <div class="meta-label">Candidate</div>
            <button class="tuple-button" type="button" data-testid="candidate-entry" data-focus-group="candidate"></button>
          </div>
          <div class="rail-group">
            <label class="meta-label" for="ring-filter">Ring focus</label>
            <select id="ring-filter" data-testid="filter-ring">
              <option value="all">All rings</option>
            </select>
          </div>
          <div class="rail-group">
            <label class="meta-label" for="blocker-filter">Blocker state</label>
            <select id="blocker-filter" data-testid="filter-blocker-state">
              <option value="all">All states</option>
              <option value="blocked">Blocked</option>
              <option value="stale">Stale</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <p class="caption">The frozen tuple is exact. Ring compatibility is not. Select a ring or blocker to inspect why the current Phase 0 candidate still cannot claim equivalence outside local.</p>
        </nav>
        <main class="stack">
          <section class="panel">
            <div class="panel-header">
              <h2>Tuple Braid</h2>
              <span class="meta-label">One exact dossier</span>
            </div>
            <div class="tuple-braid" data-testid="tuple-braid"></div>
            <div class="table-scroll">
              <table data-testid="tuple-table">
                <thead>
                  <tr><th>Frozen member</th><th>Reference</th><th>State</th></tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>Environment Ring Ladder</h2>
              <span class="meta-label">Fingerprint-bound</span>
            </div>
            <div class="ring-grid" data-testid="ring-ladder"></div>
            <div class="table-scroll">
              <table data-testid="ring-table">
                <thead>
                  <tr><th>Ring</th><th>Overall</th><th>Fingerprint</th><th>Publication/parity</th></tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>Compatibility Matrix</h2>
              <span class="meta-label">Diagram and table parity</span>
            </div>
            <div class="table-scroll">
              <table data-testid="compatibility-table">
                <thead>
                  <tr><th>Dimension</th><th>State</th><th>Subject</th><th>Evidence</th></tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>Blocker Matrix</h2>
              <span class="meta-label">Machine-readable and explicit</span>
            </div>
            <div class="table-scroll">
              <table data-testid="blocker-matrix">
                <thead>
                  <tr><th>Blocker</th><th>Ring</th><th>Dimension</th><th>State</th></tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <h2>Evidence Table</h2>
              <span class="meta-label">Inspectable basis</span>
            </div>
            <div class="table-scroll">
              <table data-testid="evidence-table">
                <thead>
                  <tr><th>Kind</th><th>Reference</th></tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>
          </section>
        </main>
        <aside class="inspector" data-testid="inspector" tabindex="0">
          <h2>Inspector</h2>
          <p class="inspector-note">Selection sync keeps the tuple braid, ring ladder, blocker matrix, and evidence table on one exact current object.</p>
          <div class="inspector-block">
            <span class="meta-label">Selected object</span>
            <div id="inspector-title"></div>
          </div>
          <div class="inspector-block">
            <span class="meta-label">Summary</span>
            <div id="inspector-summary"></div>
          </div>
          <div class="inspector-block">
            <span class="meta-label">Key refs</span>
            <dl id="inspector-refs"></dl>
          </div>
          <div class="inspector-block">
            <span class="meta-label">Reason refs</span>
            <div class="list" id="inspector-reasons"></div>
          </div>
        </aside>
      </div>
    </div>
    <script>
      const boardData = __BOARD_DATA__;
      const ringFilter = document.querySelector("[data-testid='filter-ring']");
      const blockerFilter = document.querySelector("[data-testid='filter-blocker-state']");
      const candidateEntry = document.querySelector("[data-testid='candidate-entry']");
      const tupleBraid = document.querySelector("[data-testid='tuple-braid']");
      const tupleTableBody = document.querySelector("[data-testid='tuple-table'] tbody");
      const ringGrid = document.querySelector("[data-testid='ring-ladder']");
      const ringTableBody = document.querySelector("[data-testid='ring-table'] tbody");
      const compatibilityTableBody = document.querySelector("[data-testid='compatibility-table'] tbody");
      const blockerTableBody = document.querySelector("[data-testid='blocker-matrix'] tbody");
      const evidenceTableBody = document.querySelector("[data-testid='evidence-table'] tbody");
      const inspectorTitle = document.getElementById("inspector-title");
      const inspectorSummary = document.getElementById("inspector-summary");
      const inspectorRefs = document.getElementById("inspector-refs");
      const inspectorReasons = document.getElementById("inspector-reasons");

      const releaseCandidate = boardData.releaseCandidate;
      const ringSummaries = boardData.ringSummaries;
      const matrixRows = boardData.matrixRows;
      const blockers = boardData.blockers;
      const selectedState = { kind: "candidate", id: releaseCandidate.releaseRef };

      const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const syncReducedMotion = () => {
        document.body.dataset.reducedMotion = reducedMotionQuery.matches ? "true" : "false";
      };
      syncReducedMotion();
      reducedMotionQuery.addEventListener("change", syncReducedMotion);

      document.querySelector("[data-testid='summary-release-ref']").textContent = releaseCandidate.releaseRef;
      document.querySelector("[data-testid='summary-tuple-hash']").textContent = releaseCandidate.candidateTupleHash.slice(0, 12);
      document.querySelector("[data-testid='summary-blocker-count']").textContent = String(blockers.length);
      candidateEntry.innerHTML = `
        <div class="meta-label">Selected candidate</div>
        <div style="display:grid;gap:8px;">
          <strong>${releaseCandidate.releaseRef}</strong>
          <span class="mono">${releaseCandidate.releaseApprovalFreezeRef}</span>
        </div>
      `;
      candidateEntry.addEventListener("click", () => selectCandidate());

      const ringCountCopy = ringSummaries.reduce((acc, ring) => {
        acc[ring.overallCompatibilityState] = (acc[ring.overallCompatibilityState] || 0) + 1;
        return acc;
      }, {});
      document.querySelector("[data-testid='summary-ring-counts']").textContent =
        `${ringCountCopy.exact || 0} exact / ${ringCountCopy.partial || 0} partial / ${(ringCountCopy.blocked || 0) + (ringCountCopy.stale || 0)} blocked`;

      for (const ring of ringSummaries) {
        const option = document.createElement("option");
        option.value = ring.environmentRing;
        option.textContent = ring.environmentRing;
        ringFilter.append(option);
      }

      const tupleStages = [
        {
          id: "candidate",
          title: "Candidate",
          summary: releaseCandidate.releaseRef,
          detail: releaseCandidate.gitRef,
        },
        {
          id: "freeze",
          title: "Freeze",
          summary: releaseCandidate.releaseApprovalFreezeRef,
          detail: releaseCandidate.compilationTupleHash,
        },
        {
          id: "publication",
          title: "Publication",
          summary: releaseCandidate.runtimePublicationBundleRef,
          detail: releaseCandidate.releasePublicationParityRef,
        },
        {
          id: "verification",
          title: "Verification",
          summary: releaseCandidate.releaseContractVerificationMatrixRef,
          detail: releaseCandidate.releaseContractMatrixHash,
        },
        {
          id: "promotion",
          title: "Ring evidence",
          summary: `${ringSummaries.length} rings`,
          detail: releaseCandidate.environmentCompatibilityEvidenceRefs.length + " refs",
        },
      ];

      tupleStages.forEach((stage, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tuple-button";
        button.dataset.testid = `tuple-button-${stage.id}`;
        button.dataset.focusGroup = "tuple";
        button.dataset.focusIndex = String(index);
        button.innerHTML = `
          <div class="meta-label">${stage.title}</div>
          <div style="display:grid;gap:8px;">
            <strong>${stage.summary}</strong>
            <span class="mono">${stage.detail}</span>
          </div>
        `;
        button.addEventListener("click", () => selectCandidate(stage.id));
        button.addEventListener("keydown", (event) => handleGroupArrows(event, ".tuple-button"));
        tupleBraid.append(button);
      });

      const tupleTableRows = [
        ["releaseRef", releaseCandidate.releaseRef, releaseCandidate.freezeVerdict],
        ["releaseApprovalFreezeRef", releaseCandidate.releaseApprovalFreezeRef, "exact"],
        ["runtimePublicationBundleRef", releaseCandidate.runtimePublicationBundleRef, "exact"],
        ["releasePublicationParityRef", releaseCandidate.releasePublicationParityRef, "exact"],
        ["environmentCompatibilityEvidenceRefs", String(releaseCandidate.environmentCompatibilityEvidenceRefs.length), "mixed"],
      ];
      tupleTableRows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row[0]}</td><td class="mono">${row[1]}</td><td>${row[2]}</td>`;
        tupleTableBody.append(tr);
      });

      function renderRingRows() {
        ringGrid.innerHTML = "";
        ringTableBody.innerHTML = "";
        const activeRingFilter = ringFilter.value;
        for (const [index, ring] of ringSummaries.entries()) {
          if (activeRingFilter !== "all" && activeRingFilter !== ring.environmentRing) continue;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ring-button";
          button.dataset.focusGroup = "ring";
          button.dataset.focusIndex = String(index);
          button.dataset.testid = `ring-row-${ring.environmentRing}`;
          button.innerHTML = `
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
              <strong>${ring.environmentRing}</strong>
              <span class="badge state-${ring.overallCompatibilityState}">${ring.overallCompatibilityState}</span>
            </div>
            <div class="list" style="margin-top:10px;">
              <div class="list-item"><span class="meta-label">Fingerprint</span><div class="mono">${ring.environmentBaselineFingerprintRef}</div></div>
              <div class="list-item"><span class="meta-label">Publication</span><div>${ring.dimensionStates.runtime_publication_and_parity}</div></div>
            </div>
          `;
          button.addEventListener("click", () => selectRing(ring.environmentRing));
          button.addEventListener("keydown", (event) => handleGroupArrows(event, ".ring-button"));
          ringGrid.append(button);

          const tr = document.createElement("tr");
          tr.dataset.testid = `ring-table-row-${ring.environmentRing}`;
          tr.innerHTML = `
            <td>${ring.environmentRing}</td>
            <td>${ring.overallCompatibilityState}</td>
            <td class="mono">${ring.ringFingerprintState}</td>
            <td>${ring.dimensionStates.runtime_publication_and_parity}</td>
          `;
          ringTableBody.append(tr);
        }
      }

      function renderCompatibilityRows() {
        compatibilityTableBody.innerHTML = "";
        const rows = matrixRows.filter((row) => {
          const activeRingFilter = ringFilter.value;
          if (activeRingFilter !== "all" && row.environment_ring !== activeRingFilter) return false;
          if (selectedState.kind === "ring" && row.environment_ring !== selectedState.id) return false;
          if (selectedState.kind === "blocker") {
            const blocker = blockers.find((item) => item.blockerId === selectedState.id);
            return blocker ? row.compatibility_row_id === blocker.relatedMatrixRowId : false;
          }
          return selectedState.kind === "candidate" ? row.environment_ring === "local" : true;
        });
        rows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.dataset.selected = selectedState.kind === "blocker"
            ? String(blockers.find((item) => item.blockerId === selectedState.id)?.relatedMatrixRowId === row.compatibility_row_id)
            : String(selectedState.kind === "ring" && selectedState.id === row.environment_ring);
          tr.innerHTML = `
            <td>${row.dimension_label}</td>
            <td><span class="badge state-${row.compatibility_state}">${row.compatibility_state}</span></td>
            <td class="mono">${row.subject_ref}</td>
            <td>${row.evidence_refs.join("<br />")}</td>
          `;
          compatibilityTableBody.append(tr);
        });
      }

      function renderBlockers() {
        blockerTableBody.innerHTML = "";
        const activeRingFilter = ringFilter.value;
        const activeStateFilter = blockerFilter.value;
        blockers
          .filter((blocker) => {
            if (activeRingFilter !== "all" && blocker.environmentRing !== activeRingFilter) return false;
            if (activeStateFilter !== "all" && blocker.compatibilityState !== activeStateFilter) return false;
            if (selectedState.kind === "ring" && blocker.environmentRing !== selectedState.id) return false;
            return true;
          })
          .forEach((blocker, index) => {
            const tr = document.createElement("tr");
            tr.dataset.testid = `blocker-table-row-${blocker.blockerId}`;
            tr.dataset.selected = String(selectedState.kind === "blocker" && selectedState.id === blocker.blockerId);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "blocker-button";
            button.dataset.testid = `blocker-row-${blocker.blockerId}`;
            button.dataset.focusGroup = "blocker";
            button.dataset.focusIndex = String(index);
            button.innerHTML = `
              <div style="display:grid;gap:8px;">
                <strong>${blocker.blockerId}</strong>
                <span>${blocker.title}</span>
              </div>
            `;
            button.addEventListener("click", () => selectBlocker(blocker.blockerId));
            button.addEventListener("keydown", (event) => handleGroupArrows(event, ".blocker-button"));
            const blockerCell = document.createElement("td");
            blockerCell.append(button);
            tr.append(blockerCell);
            const ringCell = document.createElement("td");
            ringCell.textContent = blocker.environmentRing;
            tr.append(ringCell);
            const dimensionCell = document.createElement("td");
            dimensionCell.textContent = blocker.dimensionLabel;
            tr.append(dimensionCell);
            const stateCell = document.createElement("td");
            stateCell.innerHTML = `<span class="badge state-${blocker.compatibilityState}">${blocker.compatibilityState}</span>`;
            tr.append(stateCell);
            blockerTableBody.append(tr);
          });
      }

      function renderEvidenceRows(kind, item) {
        evidenceTableBody.innerHTML = "";
        let rows = [];
        if (kind === "candidate") {
          rows = [
            ["releaseRef", releaseCandidate.releaseRef],
            ["releaseApprovalFreezeRef", releaseCandidate.releaseApprovalFreezeRef],
            ["runtimePublicationBundleRef", releaseCandidate.runtimePublicationBundleRef],
            ["releasePublicationParityRef", releaseCandidate.releasePublicationParityRef],
            ["releaseContractVerificationMatrixRef", releaseCandidate.releaseContractVerificationMatrixRef],
            ["environmentCompatibilityEvidenceRefs", releaseCandidate.environmentCompatibilityEvidenceRefs.join(", ")],
          ];
        } else if (kind === "ring") {
          rows = [
            ["environmentCompatibilityRef", item.environmentCompatibilityRef],
            ["environmentBaselineFingerprintRef", item.environmentBaselineFingerprintRef],
            ["runtimePublicationBundleRef", item.runtimePublicationBundleRef],
            ["releasePublicationParityRef", item.releasePublicationParityRef],
            ["blockerRefs", item.blockerRefs.join(", ") || "none"],
          ];
        } else if (kind === "blocker") {
          rows = [
            ["blockerId", item.blockerId],
            ["dimension", item.dimensionLabel],
            ["evidenceRefs", item.evidenceRefs.join(", ")],
            ["recoveryObligationRefs", (item.recoveryObligationRefs || []).join(", ") || "none"],
          ];
        }
        rows.forEach((row) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${row[0]}</td><td class="mono">${row[1]}</td>`;
          evidenceTableBody.append(tr);
        });
      }

      function renderInspector(kind, item) {
        inspectorTitle.innerHTML = "";
        inspectorSummary.innerHTML = "";
        inspectorRefs.innerHTML = "";
        inspectorReasons.innerHTML = "";

        if (kind === "candidate") {
          inspectorTitle.innerHTML = `<strong>${releaseCandidate.releaseRef}</strong> <span class="badge state-${releaseCandidate.freezeVerdict}">${releaseCandidate.freezeVerdict}</span>`;
          inspectorSummary.innerHTML = `<p>${releaseCandidate.notes[0]}</p>`;
          [
            ["releaseApprovalFreezeRef", releaseCandidate.releaseApprovalFreezeRef],
            ["runtimePublicationBundleRef", releaseCandidate.runtimePublicationBundleRef],
            ["releasePublicationParityRef", releaseCandidate.releasePublicationParityRef],
            ["compilationTupleHash", releaseCandidate.compilationTupleHash],
          ].forEach(([label, value]) => {
            inspectorRefs.innerHTML += `<dt class="meta-label">${label}</dt><dd class="mono">${value}</dd>`;
          });
          releaseCandidate.reasonRefs.forEach((reason) => {
            inspectorReasons.innerHTML += `<div class="list-item mono">${reason}</div>`;
          });
        }
        if (kind === "ring") {
          inspectorTitle.innerHTML = `<strong>${item.environmentRing}</strong> <span class="badge state-${item.overallCompatibilityState}">${item.overallCompatibilityState}</span>`;
          inspectorSummary.innerHTML = `<p>${item.notes}</p>`;
          [
            ["environmentCompatibilityRef", item.environmentCompatibilityRef],
            ["environmentBaselineFingerprintRef", item.environmentBaselineFingerprintRef],
            ["runtimePublicationBundleRef", item.runtimePublicationBundleRef],
            ["releasePublicationParityRef", item.releasePublicationParityRef],
          ].forEach(([label, value]) => {
            inspectorRefs.innerHTML += `<dt class="meta-label">${label}</dt><dd class="mono">${value}</dd>`;
          });
          item.blockerRefs.forEach((reason) => {
            inspectorReasons.innerHTML += `<div class="list-item mono">${reason}</div>`;
          });
        }
        if (kind === "blocker") {
          inspectorTitle.innerHTML = `<strong>${item.blockerId}</strong> <span class="badge state-${item.compatibilityState}">${item.compatibilityState}</span>`;
          inspectorSummary.innerHTML = `<p>${item.summary}</p>`;
          [
            ["environmentRing", item.environmentRing],
            ["dimensionLabel", item.dimensionLabel],
            ["relatedMatrixRowId", item.relatedMatrixRowId || "summary-only"],
          ].forEach(([label, value]) => {
            inspectorRefs.innerHTML += `<dt class="meta-label">${label}</dt><dd class="mono">${value}</dd>`;
          });
          (item.blockingReasonRefs || []).forEach((reason) => {
            inspectorReasons.innerHTML += `<div class="list-item mono">${reason}</div>`;
          });
          if (!item.blockingReasonRefs || !item.blockingReasonRefs.length) {
            inspectorReasons.innerHTML = `<div class="list-item mono">${item.blockerId}</div>`;
          }
        }
      }

      function syncSelectionState() {
        document.querySelectorAll(".tuple-button").forEach((button) => {
          button.dataset.selected = String(selectedState.kind === "candidate");
        });
        candidateEntry.dataset.selected = String(selectedState.kind === "candidate");
        document.querySelectorAll(".ring-button").forEach((button) => {
          const testid = button.dataset.testid.replace("ring-row-", "");
          button.dataset.selected = String(selectedState.kind === "ring" && selectedState.id === testid);
        });
        document.querySelectorAll("[data-testid^='ring-table-row-']").forEach((row) => {
          const testid = row.dataset.testid.replace("ring-table-row-", "");
          row.dataset.selected = String(
            (selectedState.kind === "ring" && selectedState.id === testid) ||
            (selectedState.kind === "blocker" && blockers.find((item) => item.blockerId === selectedState.id)?.environmentRing === testid)
          );
        });
        document.querySelectorAll(".blocker-button").forEach((button) => {
          const blockerId = button.dataset.testid.replace("blocker-row-", "");
          button.dataset.selected = String(selectedState.kind === "blocker" && selectedState.id === blockerId);
        });
      }

      function selectCandidate() {
        selectedState.kind = "candidate";
        selectedState.id = releaseCandidate.releaseRef;
        syncSelectionState();
        renderCompatibilityRows();
        renderBlockers();
        renderEvidenceRows("candidate", releaseCandidate);
        renderInspector("candidate", releaseCandidate);
      }

      function selectRing(ring) {
        selectedState.kind = "ring";
        selectedState.id = ring;
        const item = ringSummaries.find((entry) => entry.environmentRing === ring);
        syncSelectionState();
        renderCompatibilityRows();
        renderBlockers();
        renderEvidenceRows("ring", item);
        renderInspector("ring", item);
      }

      function selectBlocker(blockerId) {
        selectedState.kind = "blocker";
        selectedState.id = blockerId;
        const blocker = blockers.find((entry) => entry.blockerId === blockerId);
        syncSelectionState();
        renderCompatibilityRows();
        renderBlockers();
        renderEvidenceRows("blocker", blocker);
        renderInspector("blocker", blocker);
      }

      function handleGroupArrows(event, selector) {
        const keys = ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"];
        if (!keys.includes(event.key)) return;
        const buttons = [...document.querySelectorAll(selector)];
        const currentIndex = buttons.indexOf(event.currentTarget);
        if (currentIndex === -1) return;
        event.preventDefault();
        const delta = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
        const nextIndex = Math.min(buttons.length - 1, Math.max(0, currentIndex + delta));
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      }

      ringFilter.addEventListener("change", () => {
        renderRingRows();
        renderCompatibilityRows();
        renderBlockers();
      });
      blockerFilter.addEventListener("change", renderBlockers);

      renderRingRows();
      selectCandidate();
    </script>
  </body>
</html>
"""
    BOARD_PATH.write_text(html.replace("__BOARD_DATA__", json.dumps(board_data)))


if __name__ == "__main__":
    build()
