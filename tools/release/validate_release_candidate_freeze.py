#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_RELEASE_DIR = ROOT / "data" / "release"
DOCS_RELEASE_DIR = ROOT / "docs" / "release"

RELEASE_CANDIDATE_TUPLE_PATH = DATA_RELEASE_DIR / "release_candidate_tuple.json"
ENVIRONMENT_COMPATIBILITY_MATRIX_PATH = DATA_RELEASE_DIR / "environment_compatibility_matrix.csv"
RELEASE_CONTRACT_MATRIX_EXPORT_PATH = DATA_RELEASE_DIR / "release_contract_verification_matrix.json"
FREEZE_BLOCKERS_PATH = DATA_RELEASE_DIR / "freeze_blockers.json"
RING_FINGERPRINT_MATRIX_PATH = DATA_RELEASE_DIR / "ring_fingerprint_matrix.csv"

BOARD_PATH = DOCS_RELEASE_DIR / "131_release_candidate_freeze_board.html"
FREEZE_DOC_PATH = DOCS_RELEASE_DIR / "131_release_candidate_freeze.md"
ENV_COMPATIBILITY_DOC_PATH = DOCS_RELEASE_DIR / "131_environment_compatibility_evidence.md"
RELEASE_CONTRACT_DOC_PATH = DOCS_RELEASE_DIR / "131_release_contract_verification_matrix.md"
BLOCKERS_DOC_PATH = DOCS_RELEASE_DIR / "131_freeze_blockers_and_recovery_rules.md"

RING_ORDER = ["local", "ci-preview", "integration", "preprod", "production"]
DIMENSIONS = {
    "runtime_publication_and_parity",
    "runtime_topology",
    "workload_families",
    "trust_zone_boundaries",
    "gateway_surfaces",
    "channel_bridge_capabilities",
    "migration_backfill_posture",
    "observability_restore_posture",
}
REQUIRED_CANDIDATE_FIELDS = [
    "releaseRef",
    "releaseApprovalFreezeRef",
    "artifactDigestRefs",
    "bundleHashRefs",
    "compilationTupleHash",
    "routeContractDigestRefs",
    "frontendContractDigestRefs",
    "designContractDigestRefs",
    "designContractLintVerdictRefs",
    "runtimePublicationBundleRef",
    "releasePublicationParityRef",
    "releaseContractVerificationMatrixRef",
    "bridgeCapabilityEvidenceRefs",
    "schemaMigrationPlanRef",
    "projectionBackfillPlanRef",
    "environmentCompatibilityEvidenceRefs",
    "ringFingerprintRefs",
    "freezeVerdict",
    "reasonRefs",
    "notes",
]


def fail(message: str) -> None:
    raise SystemExit(message)


def load_json(path: Path):
    if not path.exists():
        fail(f"Required file is missing: {path}")
    return json.loads(path.read_text())


def load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        fail(f"Required file is missing: {path}")
    with path.open() as handle:
        return list(csv.DictReader(handle))


def main() -> None:
    for path in [
        RELEASE_CANDIDATE_TUPLE_PATH,
        ENVIRONMENT_COMPATIBILITY_MATRIX_PATH,
        RELEASE_CONTRACT_MATRIX_EXPORT_PATH,
        FREEZE_BLOCKERS_PATH,
        RING_FINGERPRINT_MATRIX_PATH,
        BOARD_PATH,
        FREEZE_DOC_PATH,
        ENV_COMPATIBILITY_DOC_PATH,
        RELEASE_CONTRACT_DOC_PATH,
        BLOCKERS_DOC_PATH,
    ]:
        if not path.exists():
            fail(f"Missing seq_131 deliverable: {path}")

    release_candidate_export = load_json(RELEASE_CANDIDATE_TUPLE_PATH)
    release_contract_export = load_json(RELEASE_CONTRACT_MATRIX_EXPORT_PATH)
    blockers_export = load_json(FREEZE_BLOCKERS_PATH)
    matrix_rows = load_csv(ENVIRONMENT_COMPATIBILITY_MATRIX_PATH)
    fingerprint_rows = load_csv(RING_FINGERPRINT_MATRIX_PATH)

    candidate = release_candidate_export.get("releaseCandidateTuple")
    if not isinstance(candidate, dict):
        fail("release_candidate_tuple.json must expose releaseCandidateTuple.")

    for field in REQUIRED_CANDIDATE_FIELDS:
        if field not in candidate:
            fail(f"Release candidate tuple is missing required field: {field}")
        value = candidate[field]
        if value in ("", None) or (isinstance(value, list) and not value):
            fail(f"Release candidate tuple field must not be empty: {field}")

    if candidate["freezeVerdict"] not in {"exact", "blocked", "partial", "stale"}:
        fail("freezeVerdict must be exact, blocked, partial, or stale.")

    selected_matrix = release_contract_export.get("selected_release_contract_verification_matrix")
    if not isinstance(selected_matrix, dict):
        fail("release_contract_verification_matrix.json must publish the selected matrix.")

    if selected_matrix.get("releaseContractVerificationMatrixId") != candidate["releaseContractVerificationMatrixRef"]:
        fail("Candidate must reference the exact exported release contract verification matrix.")

    if selected_matrix.get("compilationTupleHash") != candidate["compilationTupleHash"]:
        fail("Candidate compilationTupleHash must match the exported release contract matrix.")

    if selected_matrix.get("routeContractDigestRefs") != candidate["routeContractDigestRefs"]:
        fail("Candidate routeContractDigestRefs must match the exported release contract matrix.")

    if selected_matrix.get("frontendContractDigestRefs") != candidate["frontendContractDigestRefs"]:
        fail("Candidate frontendContractDigestRefs must match the exported release contract matrix.")

    if selected_matrix.get("designContractDigestRefs") != candidate["designContractDigestRefs"]:
        fail("Candidate designContractDigestRefs must match the exported release contract matrix.")

    if selected_matrix.get("designContractLintVerdictRefs") != candidate["designContractLintVerdictRefs"]:
        fail("Candidate designContractLintVerdictRefs must match the exported release contract matrix.")

    if len(matrix_rows) != len(RING_ORDER) * len(DIMENSIONS):
        fail("environment_compatibility_matrix.csv must publish one row per ring per required dimension.")

    matrix_by_ring: dict[str, list[dict[str, str]]] = {ring: [] for ring in RING_ORDER}
    for row in matrix_rows:
        ring = row["environment_ring"]
        if ring not in matrix_by_ring:
            fail(f"Unexpected environment ring in environment compatibility matrix: {ring}")
        matrix_by_ring[ring].append(row)
        if row["dimension_code"] not in DIMENSIONS:
            fail(f"Unexpected dimension in environment compatibility matrix: {row['dimension_code']}")
        if not row["environment_baseline_fingerprint_ref"]:
            fail("Every environment compatibility row must serialize an environment baseline fingerprint ref.")
        if row["compatibility_state"] not in {"exact", "partial", "stale", "blocked"}:
            fail(f"Unexpected compatibility state: {row['compatibility_state']}")
        if not row["evidence_refs"]:
            fail(f"Compatibility row lacks evidence refs: {row['compatibility_row_id']}")

    ring_summary_refs = {summary["environmentCompatibilityRef"] for summary in release_candidate_export["environmentCompatibilitySummaries"]}
    if set(candidate["environmentCompatibilityEvidenceRefs"]) != ring_summary_refs:
        fail("Candidate must reference every published environment compatibility summary ref exactly once.")

    for ring in RING_ORDER:
        ring_rows = matrix_by_ring[ring]
        dimensions = {row["dimension_code"] for row in ring_rows}
        if dimensions != DIMENSIONS:
            fail(f"Ring {ring} must contain every required environment compatibility dimension.")

    if len(fingerprint_rows) != len(RING_ORDER):
        fail("ring_fingerprint_matrix.csv must serialize one fingerprint row per ring.")

    fingerprint_refs = {row["ring_fingerprint_ref"] for row in fingerprint_rows}
    if set(candidate["ringFingerprintRefs"]) != fingerprint_refs:
        fail("Candidate must reference every serialized ring fingerprint.")

    for row in fingerprint_rows:
        if row["environment_ring"] not in RING_ORDER:
            fail(f"Unexpected ring in ring_fingerprint_matrix.csv: {row['environment_ring']}")
        if not row["ring_fingerprint_ref"]:
            fail("Fingerprint rows must include a ring_fingerprint_ref.")

    blockers = blockers_export.get("blockers")
    if not isinstance(blockers, list) or not blockers:
        fail("freeze_blockers.json must publish at least one blocker.")

    blocker_ids = {blocker["blockerId"] for blocker in blockers}
    if not set(candidate["reasonRefs"]).issubset(blocker_ids):
        fail("Candidate reasonRefs must resolve to published blocker ids.")

    summary_blockers = [
        blocker for blocker in blockers if blocker.get("dimensionCode") == "environment_summary"
    ]
    if not summary_blockers:
        fail("freeze_blockers.json must include environment summary blockers.")

    for ring in RING_ORDER:
        ring_rows = matrix_by_ring[ring]
        non_exact_rows = [row for row in ring_rows if row["compatibility_state"] != "exact"]
        if non_exact_rows:
            if not any(blocker.get("environmentRing") == ring for blocker in summary_blockers):
                fail(f"Ring {ring} has blocked, stale, or partial rows but no summary blocker.")

    local_rows = matrix_by_ring["local"]
    local_publication_row = next(
        row for row in local_rows if row["dimension_code"] == "runtime_publication_and_parity"
    )
    local_migration_row = next(
        row for row in local_rows if row["dimension_code"] == "migration_backfill_posture"
    )
    local_restore_row = next(
        row for row in local_rows if row["dimension_code"] == "observability_restore_posture"
    )
    local_topology_row = next(row for row in local_rows if row["dimension_code"] == "runtime_topology")

    if candidate["freezeVerdict"] == "exact":
        for row in [local_publication_row, local_migration_row, local_restore_row, local_topology_row]:
            if row["compatibility_state"] != "exact":
                fail("Candidate freeze cannot be exact when the selected local tuple has stale, partial, or blocked core evidence.")

    any_blocked_rows = any(
        row["compatibility_state"] in {"blocked", "stale"} for row in matrix_rows
    )
    if candidate["freezeVerdict"] == "exact" and any_blocked_rows and not candidate["reasonRefs"]:
        fail("Blocked or stale rows may not be hidden behind an exact candidate without explicit reason refs.")

    gateway_rows = [row for row in matrix_rows if row["dimension_code"] == "gateway_surfaces"]
    if not gateway_rows:
        fail("Environment compatibility matrix must include gateway surface evidence rows.")
    for row in gateway_rows:
        if row["compatibility_state"] in {"exact", "partial"} and not row["evidence_refs"]:
            fail("A route or surface marked compatible or partial must still carry environment evidence refs.")

    missing_blocker_links = [
        row["compatibility_row_id"]
        for row in matrix_rows
        if row["compatibility_state"] != "exact" and not row["blocker_refs"]
    ]
    if missing_blocker_links:
        fail(
            "Every non-exact matrix row must bind to an explicit blocker: "
            + ", ".join(missing_blocker_links)
        )

    print("seq_131 release candidate freeze validation passed.")


if __name__ == "__main__":
    main()
