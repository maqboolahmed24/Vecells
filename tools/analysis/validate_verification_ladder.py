#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"

POLICY_PATH = DATA_DIR / "environment_ring_policy.json"
SCENARIO_PATH = DATA_DIR / "verification_scenarios.json"
MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
RING_GATE_PATH = DATA_DIR / "ring_gate_matrix.csv"
RECOVERY_PATH = DATA_DIR / "synthetic_recovery_coverage_matrix.csv"
MATRIX_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "release-contract-verification-matrix.schema.json"

EXPECTED_RINGS = ["local", "ci-preview", "integration", "preprod", "production"]


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    policy = read_json(POLICY_PATH)
    scenarios = read_json(SCENARIO_PATH)
    matrix_pack = read_json(MATRIX_PATH)
    ring_gate_rows = read_csv(RING_GATE_PATH)
    recovery_rows = read_csv(RECOVERY_PATH)
    schema = read_json(MATRIX_SCHEMA_PATH)

    ring_policies = policy["ringPolicies"]
    scenario_rows = scenarios["verificationScenarios"]
    matrices = matrix_pack["releaseContractVerificationMatrices"]

    require([row["ringCode"] for row in ring_policies] == EXPECTED_RINGS, "Ring order drifted from the required five-ring ladder.")
    require(policy["summary"]["ring_count"] == 5, "Policy summary lost the fixed ring count.")
    require(policy["summary"]["gate_count"] == 5, "Policy summary lost the fixed gate count.")
    require(len(scenario_rows) == 5, "VerificationScenario count drifted.")
    require(len(matrices) == 5, "ReleaseContractVerificationMatrix count drifted.")
    require(len(ring_gate_rows) == 25, "Ring gate matrix must contain five rings by five gates.")

    baseline_ids = {row["environmentBaselineFingerprintId"] for row in policy["environmentBaselineFingerprints"]}
    promotion_ids = {row["promotionIntentEnvelopeId"] for row in policy["promotionIntentEnvelopes"]}
    wave_eligibility_ids = {row["waveEligibilitySnapshotId"] for row in policy["waveEligibilitySnapshots"]}
    fence_ids = {row["waveControlFenceId"] for row in policy["waveControlFences"]}
    readiness_ids = {row["operationalReadinessSnapshotId"] for row in policy["operationalReadinessSnapshots"]}
    matrix_by_id = {row["releaseContractVerificationMatrixId"]: row for row in matrices}

    require(schema["title"] == "ReleaseContractVerificationMatrix", "Package schema title drifted.")
    require("releaseContractVerificationMatrixId" in schema["required"], "Matrix schema no longer requires the matrix id.")
    require("routeContractDigestRefs" in schema["required"], "Matrix schema no longer requires route contract digests.")

    recovery_by_scenario = {}
    for row in recovery_rows:
        recovery_by_scenario.setdefault(row["verification_scenario_ref"], []).append(row)

    continuity_by_id = {
        row["continuityContractCoverageRecordId"]: row
        for row in matrix_pack["continuityContractCoverageRecords"]
    }

    for policy_row in ring_policies:
        require(policy_row["ringCode"] in EXPECTED_RINGS, f"Unknown ring code {policy_row['ringCode']}.")
        require(policy_row["requiredGateRefs"], f"Ring {policy_row['ringCode']} lost requiredGateRefs.")
        require(policy_row["requiredSimulatorCoverageRefs"], f"Ring {policy_row['ringCode']} lost simulator evidence refs.")
        require(policy_row["requiredOperationalEvidenceRefs"], f"Ring {policy_row['ringCode']} lost operational evidence refs.")
        require(
            any(ref in baseline_ids for ref in policy_row["requiredOperationalEvidenceRefs"]),
            f"Ring {policy_row['ringCode']} must require one EnvironmentBaselineFingerprint.",
        )
        require(
            any(ref in promotion_ids for ref in policy_row["requiredOperationalEvidenceRefs"]),
            f"Ring {policy_row['ringCode']} must require one live PromotionIntentEnvelope.",
        )
        require(
            any(ref in wave_eligibility_ids for ref in policy_row["requiredOperationalEvidenceRefs"]),
            f"Ring {policy_row['ringCode']} must require one WaveEligibilitySnapshot.",
        )
        require(
            any(ref in fence_ids for ref in policy_row["requiredOperationalEvidenceRefs"]),
            f"Ring {policy_row['ringCode']} must require one WaveControlFence.",
        )
        require(
            any(ref in readiness_ids for ref in policy_row["requiredOperationalEvidenceRefs"]),
            f"Ring {policy_row['ringCode']} must require one OperationalReadinessSnapshot.",
        )

    for scenario in scenario_rows:
        require(
            scenario["environmentBaselineFingerprintRef"] in baseline_ids,
            f"Scenario {scenario['verificationScenarioId']} references an unknown baseline fingerprint.",
        )
        require(
            scenario["promotionIntentEnvelopeRef"] in promotion_ids,
            f"Scenario {scenario['verificationScenarioId']} references an unknown promotion intent.",
        )
        require(
            scenario["waveEligibilitySnapshotRef"] in wave_eligibility_ids,
            f"Scenario {scenario['verificationScenarioId']} references an unknown wave eligibility snapshot.",
        )
        require(
            scenario["waveControlFenceRef"] in fence_ids,
            f"Scenario {scenario['verificationScenarioId']} references an unknown wave fence.",
        )
        require(
            scenario["operationalReadinessSnapshotRef"] in readiness_ids,
            f"Scenario {scenario['verificationScenarioId']} references an unknown readiness snapshot.",
        )
        require(
            scenario["releaseContractVerificationMatrixRef"] in matrix_by_id,
            f"Scenario {scenario['verificationScenarioId']} references an unknown matrix.",
        )
        matrix = matrix_by_id[scenario["releaseContractVerificationMatrixRef"]]
        require(
            matrix["matrixHash"] == scenario["releaseContractMatrixHash"],
            f"Scenario {scenario['verificationScenarioId']} drifted from its matrix hash.",
        )
        require(matrix["routeFamilyRefs"], f"Matrix {matrix['releaseContractVerificationMatrixId']} lost route families.")
        require(matrix["frontendContractManifestRefs"], f"Matrix {matrix['releaseContractVerificationMatrixId']} lost manifest refs.")
        require(matrix["projectionQueryContractDigestRefs"], f"Matrix {matrix['releaseContractVerificationMatrixId']} lost projection digests.")
        require(matrix["mutationCommandContractDigestRefs"], f"Matrix {matrix['releaseContractVerificationMatrixId']} lost mutation digests.")
        require(matrix["clientCachePolicyDigestRefs"], f"Matrix {matrix['releaseContractVerificationMatrixId']} lost cache digests.")
        require(matrix["continuityEvidenceContractRefs"], f"Matrix {matrix['releaseContractVerificationMatrixId']} lost continuity evidence refs.")

        for continuity_ref in scenario["requiredContinuityCoverageRefs"]:
            require(
                continuity_ref in continuity_by_id,
                f"Scenario {scenario['verificationScenarioId']} references missing continuity coverage {continuity_ref}.",
            )

        if scenario["ringCode"] in {"integration", "preprod", "production"}:
            require(
                scenario["requiredSyntheticRecoveryCoverageRefs"],
                f"Scenario {scenario['verificationScenarioId']} must require synthetic recovery rows.",
            )
            scenario_recovery_rows = recovery_by_scenario.get(scenario["verificationScenarioId"], [])
            require(
                len(scenario_recovery_rows) == len(scenario["requiredSyntheticRecoveryCoverageRefs"]),
                f"Scenario {scenario['verificationScenarioId']} synthetic recovery refs drifted from the CSV.",
            )
            for recovery_row in scenario_recovery_rows:
                require(
                    recovery_row["release_contract_verification_matrix_ref"] == scenario["releaseContractVerificationMatrixRef"],
                    f"Recovery row {recovery_row['synthetic_recovery_coverage_record_id']} drifted from the scenario matrix.",
                )
                require(
                    recovery_row["release_watch_tuple_ref"] == scenario["releaseWatchTupleRef"],
                    f"Recovery row {recovery_row['synthetic_recovery_coverage_record_id']} drifted from the scenario watch tuple.",
                )

        if scenario["driftState"] != "aligned":
            gate_rows = [
                row for row in ring_gate_rows if row["verification_scenario_id"] == scenario["verificationScenarioId"]
            ]
            require(
                any(row["gate_binding_state"] in {"restart_required", "blocked", "rollback_required"} for row in gate_rows),
                f"Scenario {scenario['verificationScenarioId']} drifted but did not force restart or halt semantics.",
            )

    print("seq_058 verification ladder validation passed")


if __name__ == "__main__":
    main()
