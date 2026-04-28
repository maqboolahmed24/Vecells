#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
PACKAGE_SCHEMA_DIR = ROOT / "packages" / "api-contracts" / "schemas"

PROFILE_PATH = DATA_DIR / "adapter_contract_profile_template.json"
DEGRADATION_PATH = DATA_DIR / "dependency_degradation_profiles.json"
EFFECT_MATRIX_PATH = DATA_DIR / "adapter_effect_family_matrix.csv"
SIMULATOR_MATRIX_PATH = DATA_DIR / "simulator_vs_live_adapter_matrix.csv"
PROFILE_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "adapter-contract-profile.schema.json"
DEGRADATION_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "dependency-degradation-profile.schema.json"
DEGRADED_DEFAULTS_PATH = DATA_DIR / "degraded_mode_defaults.json"
RUNTIME_WORKLOADS_PATH = DATA_DIR / "runtime_workload_families.json"
TRUST_BOUNDARIES_PATH = DATA_DIR / "trust_zone_boundaries.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
RETRY_MATRIX_PATH = DATA_DIR / "browser_automation_retry_matrix.json"


def read_json(path: Path):
    return json.loads(path.read_text())


def read_csv(path: Path):
    with path.open() as handle:
        return list(csv.DictReader(handle))


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    profile_pack = read_json(PROFILE_PATH)
    degradation_pack = read_json(DEGRADATION_PATH)
    effect_rows = read_csv(EFFECT_MATRIX_PATH)
    simulator_rows = read_csv(SIMULATOR_MATRIX_PATH)
    profile_schema = read_json(PROFILE_SCHEMA_PATH)
    degradation_schema = read_json(DEGRADATION_SCHEMA_PATH)
    degraded_defaults = read_json(DEGRADED_DEFAULTS_PATH)
    runtime = read_json(RUNTIME_WORKLOADS_PATH)
    trust = read_json(TRUST_BOUNDARIES_PATH)
    fhir = read_json(FHIR_CONTRACTS_PATH)
    retry = read_json(RETRY_MATRIX_PATH)

    profiles = profile_pack["adapterContractProfiles"]
    degradation_rows = degradation_pack["profiles"]
    dependency_ids = {row["dependency_id"] for row in degraded_defaults["dependencies"]}
    runtime_family_refs = {row["runtime_workload_family_ref"] for row in runtime["runtime_workload_families"]}
    trust_boundary_ids = {row["trustZoneBoundaryId"] for row in trust["trust_zone_boundaries"]}
    fhir_contract_ids = {row["fhirRepresentationContractId"] for row in fhir["contracts"]}
    retry_class_ids = {row["class_id"] for row in retry["retry_classes"]}

    require(profile_pack["task_id"] == "seq_057", "Adapter profile task id drifted.")
    require(degradation_pack["task_id"] == "seq_057", "Degradation profile task id drifted.")
    require(profile_schema["task_id"] == "seq_057", "Profile schema task id drifted.")
    require(degradation_schema["task_id"] == "seq_057", "Degradation schema task id drifted.")
    require(len(profiles) == len(dependency_ids) == 20, "Seq_057 must publish one adapter profile per dependency.")
    require(len(degradation_rows) == len(dependency_ids) == 20, "Seq_057 must publish one degradation profile per dependency.")
    require(len(effect_rows) == 20, "Effect-family matrix row count drifted.")
    require(len(simulator_rows) == 20, "Simulator/live matrix row count drifted.")

    adapter_ids = set()
    dependency_to_profile = {}
    effect_to_owner = {}
    degradation_by_dependency = {row["dependencyCode"]: row for row in degradation_rows}
    required_profile_fields = set(profile_schema["required"])
    required_degradation_fields = set(degradation_schema["required"])

    for field in [
        "adapterContractProfileId",
        "adapterCode",
        "dependencyCode",
        "effectFamilies",
        "supportedActionScopes",
        "retryPolicyRef",
        "simulatorContractRef",
    ]:
        require(field in required_profile_fields, f"Profile schema lost required field {field}.")

    for field in [
        "profileId",
        "dependencyCode",
        "failureMode",
        "maximumEscalationFamilyRefs",
        "topologyFallbackMode",
    ]:
        require(field in required_degradation_fields, f"Degradation schema lost required field {field}.")

    for profile in profiles:
        dependency_code = profile["dependencyCode"]
        require(dependency_code in dependency_ids, f"Unknown dependency code {dependency_code}.")
        require(profile["adapterContractProfileId"] not in adapter_ids, "Adapter profile ids must stay unique.")
        adapter_ids.add(profile["adapterContractProfileId"])
        require(dependency_code not in dependency_to_profile, f"Dependency {dependency_code} lost one-to-one profile ownership.")
        dependency_to_profile[dependency_code] = profile
        require(profile["integrationWorkloadFamilyRef"] in runtime_family_refs, f"{dependency_code} references unknown workload family.")
        require(profile["requiredTrustZoneBoundaryRef"] in trust_boundary_ids, f"{dependency_code} references unknown trust boundary.")
        require(profile["retryPolicyRef"] in retry_class_ids, f"{dependency_code} references unknown retry policy.")
        require(profile["transportAcceptanceTruth"] == "supporting_only", f"{dependency_code} widened transport acceptance into business truth.")
        require(profile["effectFamilies"], f"{dependency_code} lost effect family ownership.")
        require(profile["sourceRefs"], f"{dependency_code} lost source refs.")
        require(
            len(profile["proofLadder"]) == 4 and profile["proofLadder"][-1]["stage"] == "settlement",
            f"{dependency_code} proof ladder drifted.",
        )
        for effect in profile["effectFamilies"]:
            owner = effect_to_owner.setdefault(effect["effectFamilyId"], profile["adapterContractProfileId"])
            require(
                owner == profile["adapterContractProfileId"],
                f"Effect family {effect['effectFamilyId']} lost single-owner authority.",
            )
        for contract_id in profile["allowedFhirRepresentationContractRefs"]:
            require(contract_id in fhir_contract_ids, f"{dependency_code} references unknown FHIR contract {contract_id}.")

    for row in degradation_rows:
        dependency_code = row["dependencyCode"]
        require(dependency_code in dependency_ids, f"Unknown degradation dependency {dependency_code}.")
        require(row["retryPolicyRef"] in retry_class_ids, f"{dependency_code} degradation lost retry class parity.")
        require(row["sourceRefs"], f"{dependency_code} degradation lost source refs.")
        require(row["impactedWorkloadFamilyRefs"], f"{dependency_code} must name impacted workloads.")
        require(row["maximumEscalationFamilyRefs"], f"{dependency_code} must bound escalation.")
        require(
            len(row["maximumEscalationFamilyRefs"]) <= 3,
            f"{dependency_code} escalation widened beyond the bounded policy ceiling.",
        )
        require(
            set(row["maximumEscalationFamilyRefs"]).issubset(runtime_family_refs),
            f"{dependency_code} escalation references unknown workload families.",
        )

    for profile in profiles:
        degradation = degradation_by_dependency[profile["dependencyCode"]]
        require(
            profile["dependencyDegradationProfileRef"] == degradation["profileId"],
            f"{profile['dependencyCode']} profile drifted from degradation ref.",
        )
        require(
            profile["mockNowExecution"]["orderingAndReplayBehavior"] == profile["receiptOrderingPolicyRef"],
            f"{profile['dependencyCode']} simulator replay semantics drifted from profile law.",
        )
        require(
            "Replay" in " ".join(profile["actualProviderStrategyLater"]["contractDifferencesMustRemainBounded"])
            or "replay" in " ".join(profile["actualProviderStrategyLater"]["contractDifferencesMustRemainBounded"]).lower(),
            f"{profile['dependencyCode']} actual-later plan lost replay parity.",
        )
        require(
            profile["actualProviderStrategyLater"]["rollbackToSimulatorSafeMode"],
            f"{profile['dependencyCode']} lost rollback-to-simulator guidance.",
        )

    explicit_boundaries = {
        "adp_nhs_login_auth_bridge",
        "adp_local_booking_supplier",
        "adp_mesh_secure_message",
        "adp_telephony_ivr_recording",
        "adp_sms_notification_delivery",
        "adp_email_notification_delivery",
        "adp_pharmacy_referral_transport",
        "adp_pharmacy_directory_lookup",
    }
    published_codes = {row["adapterCode"] for row in profiles}
    require(explicit_boundaries.issubset(published_codes), "Seq_057 lost one or more mandatory explicit adapter rows.")

    for row in effect_rows:
        require(row["adapterContractProfileId"] in adapter_ids, f"Effect row {row['effectFamilyId']} references unknown profile.")
        require(row["requiredTrustZoneBoundaryRef"] in trust_boundary_ids, f"Effect row {row['effectFamilyId']} references unknown trust boundary.")

    for row in simulator_rows:
        require(row["adapterContractProfileId"] in adapter_ids, f"Simulator row for {row['adapterCode']} references unknown profile.")
        require(row["mockExecutionWorkloadFamilyRef"] in runtime_family_refs, f"Simulator row {row['adapterCode']} has unknown mock workload family.")
        require(row["actualProviderWorkloadFamilyRef"] in runtime_family_refs, f"Simulator row {row['adapterCode']} has unknown live workload family.")
        require(
            row["blockedLiveGateCount"].isdigit() and row["reviewLiveGateCount"].isdigit(),
            f"Simulator row {row['adapterCode']} lost gate counts.",
        )

    print("seq_057 adapter contract profiles validation passed")


if __name__ == "__main__":
    main()
