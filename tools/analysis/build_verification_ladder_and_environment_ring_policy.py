#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "api-contracts"
PACKAGE_SCHEMA_DIR = PACKAGE_DIR / "schemas"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.ts"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
DESIGN_BUNDLES_PATH = DATA_DIR / "design_contract_publication_bundles.json"
PARITY_RULES_PATH = DATA_DIR / "release_publication_parity_rules.json"
RELEASE_GATE_PATH = DATA_DIR / "release_gate_matrix.csv"
ADAPTER_PROFILE_PATH = DATA_DIR / "adapter_contract_profile_template.json"
DEGRADATION_PATH = DATA_DIR / "dependency_degradation_profiles.json"

ENVIRONMENT_RING_POLICY_PATH = DATA_DIR / "environment_ring_policy.json"
VERIFICATION_SCENARIOS_PATH = DATA_DIR / "verification_scenarios.json"
RELEASE_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
RING_GATE_MATRIX_PATH = DATA_DIR / "ring_gate_matrix.csv"
PROMOTION_INTENT_SCHEMA_PATH = DATA_DIR / "promotion_intent_schema.json"
SYNTHETIC_RECOVERY_MATRIX_PATH = DATA_DIR / "synthetic_recovery_coverage_matrix.csv"

POLICY_DOC_PATH = DOCS_DIR / "58_verification_ladder_and_environment_ring_policy.md"
MATRIX_DOC_PATH = DOCS_DIR / "58_release_contract_verification_matrix_strategy.md"
FENCE_DOC_PATH = DOCS_DIR / "58_promotion_intent_and_wave_fence_policy.md"
COCKPIT_PATH = DOCS_DIR / "58_verification_cockpit.html"

PACKAGE_MATRIX_SCHEMA_PATH = PACKAGE_SCHEMA_DIR / "release-contract-verification-matrix.schema.json"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_verification_ladder.py"
SPEC_PATH = TESTS_DIR / "verification-cockpit.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ENGINEERING_BUILDER_PATH = ROOT / "tools" / "analysis" / "build_engineering_standards.py"

PACKAGE_EXPORTS_START = "// seq_058_verification_ladder_exports:start"
PACKAGE_EXPORTS_END = "// seq_058_verification_ladder_exports:end"

TASK_ID = "seq_058"
VISUAL_MODE = "Verification_Ladder_Cockpit"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the Phase 0 verification ladder, ring-promotion law, and candidate-bound environment "
    "policy so compile, simulation, runtime publication, preprod rehearsal, canary, widening, "
    "pause, rollback, and recovery proof all consume the same exact release tuple."
)

SOURCE_PRECEDENCE = [
    "prompt/058.md",
    "prompt/shared_operating_contract_056_to_065.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#Environment ring and promotion contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
    "blueprint/phase-0-the-foundation-protocol.md#0A Foundation kernel, control plane, and hard invariants",
    "blueprint/phase-0-the-foundation-protocol.md#1.40 Resilience and recovery contract family",
    "blueprint/phase-cards.md#Extended Summary-Layer Alignment",
    "blueprint/platform-admin-and-config-blueprint.md#Production promotion gate",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/release_gate_matrix.csv",
    "data/analysis/adapter_contract_profile_template.json",
    "data/analysis/dependency_degradation_profiles.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:tenant-scope && pnpm validate:lifecycle && pnpm validate:mutation-gate && "
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "codegen": (
        "python3 ./tools/analysis/build_monorepo_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_service_scaffold.py && "
        "python3 ./tools/analysis/build_domain_package_scaffold.py && "
        "python3 ./tools/analysis/build_runtime_topology_manifest.py && "
        "python3 ./tools/analysis/build_gateway_surface_map.py && "
        "python3 ./tools/analysis/build_event_registry.py && "
        "python3 ./tools/analysis/build_fhir_representation_contracts.py && "
        "python3 ./tools/analysis/build_frontend_contract_manifests.py && "
        "python3 ./tools/analysis/build_release_freeze_and_parity.py && "
        "python3 ./tools/analysis/build_design_contract_publication.py && "
        "python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_tenant_scope_model.py && "
        "python3 ./tools/analysis/build_lifecycle_coordinator_rules.py && "
        "python3 ./tools/analysis/build_scoped_mutation_gate_rules.py && "
        "python3 ./tools/analysis/build_adapter_contract_profiles.py && "
        "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && "
        "python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",
    "validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

PLAYWRIGHT_SCRIPT_UPDATES = {
    "build": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js && "
        "node --check scope-isolation-atlas.spec.js && "
        "node --check lifecycle-coordinator-lab.spec.js && "
        "node --check scoped-mutation-gate-lab.spec.js && "
        "node --check adapter-contract-studio.spec.js && "
        "node --check verification-cockpit.spec.js && "
        "node --check seed-and-simulator-studio.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js "
        "audit-ledger-explorer.spec.js scope-isolation-atlas.spec.js "
        "lifecycle-coordinator-lab.spec.js scoped-mutation-gate-lab.spec.js "
        "adapter-contract-studio.spec.js verification-cockpit.spec.js seed-and-simulator-studio.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && "
        "node audit-ledger-explorer.spec.js && "
        "node scope-isolation-atlas.spec.js && "
        "node lifecycle-coordinator-lab.spec.js && "
        "node scoped-mutation-gate-lab.spec.js && "
        "node adapter-contract-studio.spec.js && "
        "node verification-cockpit.spec.js && node seed-and-simulator-studio.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && "
        "node --check audit-ledger-explorer.spec.js && "
        "node --check scope-isolation-atlas.spec.js && "
        "node --check lifecycle-coordinator-lab.spec.js && "
        "node --check scoped-mutation-gate-lab.spec.js && "
        "node --check adapter-contract-studio.spec.js && "
        "node --check verification-cockpit.spec.js && node --check seed-and-simulator-studio.spec.js && "
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && "
        "node audit-ledger-explorer.spec.js --run && "
        "node scope-isolation-atlas.spec.js --run && "
        "node lifecycle-coordinator-lab.spec.js --run && "
        "node scoped-mutation-gate-lab.spec.js --run && "
        "node adapter-contract-studio.spec.js --run && "
        "node verification-cockpit.spec.js --run && "
        "node seed-and-simulator-studio.spec.js --run"
    ),
}

ENVIRONMENT_ORDER = ["local", "ci-preview", "integration", "preprod", "production"]
GATE_ORDER = [
    "GATE_1_CONTRACT_AND_COMPONENT",
    "GATE_2_INTEGRATION_AND_E2E",
    "GATE_3_PERFORMANCE_AND_SECURITY",
    "GATE_4_RESILIENCE_AND_RECOVERY",
    "GATE_5_LIVE_WAVE_PROOF",
]
REQUIRED_GATE_REFS_BY_RING = {
    "local": ["GATE_1_CONTRACT_AND_COMPONENT"],
    "ci-preview": ["GATE_1_CONTRACT_AND_COMPONENT"],
    "integration": ["GATE_2_INTEGRATION_AND_E2E"],
    "preprod": ["GATE_3_PERFORMANCE_AND_SECURITY", "GATE_4_RESILIENCE_AND_RECOVERY"],
    "production": ["GATE_5_LIVE_WAVE_PROOF"],
}
RING_PURPOSES = {
    "local": "Compile the candidate tuple, simulate config, and freeze the initial cross-layer matrix before any preview publication.",
    "ci-preview": "Prove published preview parity against the same exact tuple and keep browser posture constrained until integration evidence is current.",
    "integration": "Exercise simulator-backed routes, callbacks, and end-to-end recovery on the pinned tuple rather than on adjacent manifests.",
    "preprod": "Rehearse performance, security, resilience, restore, and failover against the same frozen release and watch tuple.",
    "production": "Control canary, widen, halt, rollback, and resume only through the declared watch tuple, wave fence, and live proof set.",
}
RING_NOTES = {
    "local": "Local remains candidate-bound and never authorizes live-wave inference. Gate 0 stays an entry prerequisite rather than a separate promotion lane.",
    "ci-preview": "Preview proves exact publication parity but still treats calm live trust as blocked until downstream accessibility and recovery proof stay current.",
    "integration": "Integration is the first ring where simulator-backed flows, callback replay, and continuity controls become end-to-end promotion evidence.",
    "preprod": "Preprod must carry operational readiness, recovery rehearsal freshness, and restore compatibility on the same tuple as route and design proof.",
    "production": "Production wave control is fail-closed. Drift may only widen into halt, rollback, or restart semantics, never into silent continuation.",
}
ROLLBACK_MODE_BY_RING = {
    "local": "restart_from_compilation_tuple",
    "ci-preview": "withdraw_preview_and_restart",
    "integration": "restart_with_simulator_rehearsal",
    "preprod": "pause_and_rehearse_or_rollforward",
    "production": "watch_tuple_controlled_pause_or_rollback",
}
ENTRY_PREREQUISITES_BY_RING = {
    "local": [
        "Gate 0 static, unit, config compilation, config simulation, and standards watchlist proof pinned to one candidate tuple.",
        "One exact ReleaseContractVerificationMatrix assembled before any route-local checks are considered valid.",
        "One aligned EnvironmentBaselineFingerprint created from runtime topology, release freeze, and compilation tuple evidence.",
    ],
    "ci-preview": [
        "Local candidate tuple remains immutable; no rebuild-from-source is allowed between local and preview.",
        "PromotionIntentEnvelope stays live and references the same EnvironmentBaselineFingerprint and ReleaseApprovalFreeze.",
        "Preview publication binds the same frontend manifests, design bundles, and route coverage digests as the local matrix.",
    ],
    "integration": [
        "Preview parity remains exact or restart is required before integration evidence can settle.",
        "Simulator-backed adapter families and callback replay rules stay attached to the same VerificationScenario.",
        "Continuity-sensitive workflows in scope publish exact ContinuityContractCoverageRecord rows before Gate 2 may pass.",
    ],
    "preprod": [
        "Integration proof remains current and restart-on-drift semantics stay armed.",
        "OperationalReadinessSnapshot, restore runs, failover runs, and runbook bindings are captured against the same release matrix.",
        "SyntheticRecoveryCoverageRecord rows exist for every continuity-sensitive workflow touched by the rehearsal scope.",
    ],
    "production": [
        "Preprod freeze, runtime publication, and provenance state still match the pinned ReleaseContractVerificationMatrix hash.",
        "WaveEligibilitySnapshot and WaveControlFence are current for the exact watch tuple being widened or rolled back.",
        "Live wave decisions remain machine-readable and may only settle through the current watch tuple and guardrail posture.",
    ],
}
SCENARIO_STATE_BY_PARITY = {
    "exact": "armed",
    "stale": "restart_required",
    "conflict": "halted",
    "withdrawn": "rollback_required",
}
DRIFT_STATE_BY_PARITY = {
    "exact": "aligned",
    "stale": "restart_required",
    "conflict": "halted",
    "withdrawn": "rollback_required",
}
MATRIX_STATE_BY_PARITY = {
    "exact": "exact",
    "stale": "stale",
    "conflict": "blocked",
    "withdrawn": "blocked",
}
READINESS_STATE_BY_PARITY = {
    "exact": "ready",
    "stale": "constrained",
    "conflict": "blocked",
    "withdrawn": "blocked",
}

CONTINUITY_CONTROL_CATALOG = [
    {
        "code": "patient_nav",
        "label": "Patient navigation continuity",
        "routeFamilyRefs": ["rf_patient_home", "rf_patient_requests", "rf_patient_appointments"],
        "audienceScope": "patient_authenticated",
        "journeyCode": "patient_navigation",
        "requiredFromRing": "local",
        "postureType": "ordinary_live",
    },
    {
        "code": "record_continuation",
        "label": "Record continuation",
        "routeFamilyRefs": ["rf_patient_health_record"],
        "audienceScope": "patient_authenticated",
        "journeyCode": "record_continuation",
        "requiredFromRing": "local",
        "postureType": "ordinary_live",
    },
    {
        "code": "workspace_task_completion",
        "label": "Workspace task completion",
        "routeFamilyRefs": ["rf_staff_workspace", "rf_staff_workspace_child"],
        "audienceScope": "staff_workspace",
        "journeyCode": "workspace_task_completion",
        "requiredFromRing": "local",
        "postureType": "constrained",
    },
    {
        "code": "pharmacy_console_settlement",
        "label": "Pharmacy console settlement",
        "routeFamilyRefs": ["rf_pharmacy_console"],
        "audienceScope": "pharmacy_console",
        "journeyCode": "pharmacy_settlement",
        "requiredFromRing": "local",
        "postureType": "ordinary_live",
    },
    {
        "code": "more_info_reply",
        "label": "More-info reply continuity",
        "routeFamilyRefs": ["rf_patient_messages", "rf_support_ticket_workspace"],
        "audienceScope": "patient_support",
        "journeyCode": "more_info_reply",
        "requiredFromRing": "integration",
        "postureType": "constrained",
    },
    {
        "code": "conversation_settlement",
        "label": "Conversation settlement",
        "routeFamilyRefs": ["rf_patient_messages", "rf_support_replay_observe"],
        "audienceScope": "conversation_runtime",
        "journeyCode": "conversation_settlement",
        "requiredFromRing": "integration",
        "postureType": "constrained",
    },
    {
        "code": "booking_manage",
        "label": "Patient booking management",
        "routeFamilyRefs": ["rf_patient_appointments"],
        "audienceScope": "patient_authenticated",
        "journeyCode": "booking_manage",
        "requiredFromRing": "integration",
        "postureType": "constrained",
    },
    {
        "code": "support_replay_restore",
        "label": "Support replay restore",
        "routeFamilyRefs": ["rf_support_replay_observe"],
        "audienceScope": "support_workspace",
        "journeyCode": "support_replay_restore",
        "requiredFromRing": "preprod",
        "postureType": "frozen",
    },
    {
        "code": "intake_resume",
        "label": "Intake resume",
        "routeFamilyRefs": ["rf_intake_self_service", "rf_intake_telephony_capture"],
        "audienceScope": "patient_public_entry",
        "journeyCode": "intake_resume",
        "requiredFromRing": "preprod",
        "postureType": "read_only_recovery",
    },
    {
        "code": "hub_booking_manage",
        "label": "Hub booking management",
        "routeFamilyRefs": ["rf_hub_case_management", "rf_hub_queue"],
        "audienceScope": "hub_workspace",
        "journeyCode": "hub_booking_manage",
        "requiredFromRing": "preprod",
        "postureType": "constrained",
    },
    {
        "code": "assistive_session",
        "label": "Assistive session posture",
        "routeFamilyRefs": ["rf_patient_embedded_channel", "rf_patient_secure_link_recovery"],
        "audienceScope": "assistive_or_embedded",
        "journeyCode": "assistive_session",
        "requiredFromRing": "preprod",
        "postureType": "placeholder_recovery",
    },
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_058_CONFIG_COMPILATION_RECORDS_PUBLISHED_HERE",
        "summary": "ConfigCompilationRecord and ConfigSimulationEnvelope refs are published as seq_058 contract-layer objects because earlier tasks froze hashes and bundle refs but not standalone runtime records.",
    },
    {
        "assumptionId": "ASSUMPTION_058_SIMULATOR_EVIDENCE_REMAINS_PHASE0_AUTHORITY",
        "summary": "Simulator-backed adapter families remain valid promotion evidence in all Phase 0 rings, including production-wave controls, until later live-cutover tasks publish narrower provider-specific proof.",
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2))


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def sha16(*parts: Any) -> str:
    digest = hashlib.sha256()
    for part in parts:
        digest.update(str(part).encode("utf-8"))
        digest.update(b"\x1f")
    return digest.hexdigest()[:16]


def token(value: str) -> str:
    return value.upper().replace("-", "_")


def slug(value: str) -> str:
    return "".join(character if character.isalnum() else "_" for character in value).strip("_").lower()


def digest_ref(prefix: str, *parts: Any) -> str:
    return f"{prefix}::{sha16(*parts)}"


def split_semicolon(value: str) -> list[str]:
    return [item.strip() for item in value.split(";") if item.strip()]


def ring_index(ring: str) -> int:
    return ENVIRONMENT_ORDER.index(ring)


def controls_for_ring(ring: str) -> list[dict[str, Any]]:
    current_index = ring_index(ring)
    selected = [
        control
        for control in CONTINUITY_CONTROL_CATALOG
        if ring_index(control["requiredFromRing"]) <= current_index
    ]
    return selected


def matrix_state_from_parity(parity_state: str) -> str:
    return MATRIX_STATE_BY_PARITY[parity_state]


def coverage_state_from_parity(parity_state: str) -> str:
    if parity_state == "exact":
        return "exact"
    if parity_state == "stale":
        return "stale"
    return "blocked"


def result_state_from_parity(parity_state: str) -> str:
    if parity_state == "exact":
        return "pass"
    if parity_state == "stale":
        return "rerun_required"
    return "blocked"


def gate_verdict(ring: str, gate_id: str, parity_state: str) -> str:
    if gate_id not in REQUIRED_GATE_REFS_BY_RING[ring]:
        if ring == "production" and gate_id in {"GATE_1_CONTRACT_AND_COMPONENT", "GATE_2_INTEGRATION_AND_E2E", "GATE_3_PERFORMANCE_AND_SECURITY", "GATE_4_RESILIENCE_AND_RECOVERY"}:
            return "carried_forward"
        if ring == "preprod" and gate_id in {"GATE_1_CONTRACT_AND_COMPONENT", "GATE_2_INTEGRATION_AND_E2E"}:
            return "carried_forward"
        return "standby"
    if parity_state == "exact":
        return "exact"
    if parity_state == "stale":
        return "restart_required"
    if parity_state == "withdrawn":
        return "rollback_required"
    return "blocked"


def choose_compiled_policy_bundle_ref(freeze: dict[str, Any], candidate: dict[str, Any]) -> str:
    if freeze.get("compiledPolicyBundleRef"):
        return freeze["compiledPolicyBundleRef"]
    for artifact in candidate["artifactDigests"]:
        if artifact.get("artifactKind") == "policy_bundle":
            return artifact["artifactId"]
    return f"CPB_{token(candidate['environmentRing'])}_V1"


def choose_route_contract_digest(route_family_ref: str, manifest: dict[str, Any]) -> str:
    return digest_ref("route-contract-digest", route_family_ref, manifest["surfaceRouteContractRef"], manifest["frontendContractDigestRef"])


def build_simulator_requirements(adapter_profiles: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for profile in adapter_profiles:
        posture = profile["currentExecutionPosture"]
        if posture not in {"simulator_backed", "watch_only"}:
            continue
        family = profile["dependencyFamily"]
        record = grouped.setdefault(
            family,
            {
                "simulatorCoverageRef": f"SIMREQ_058_{token(family)}_V1",
                "dependencyFamily": family,
                "adapterContractProfileRefs": [],
                "adapterCodes": [],
                "routeFamilyRefs": set(),
                "simulatorContractRefs": [],
                "currentExecutionPostures": set(),
                "liveCutoverPendingCount": 0,
                "watchOnlyCount": 0,
                "sourceRefs": set(),
            },
        )
        record["adapterContractProfileRefs"].append(profile["adapterContractProfileId"])
        record["adapterCodes"].append(profile["adapterCode"])
        record["routeFamilyRefs"].update(profile["routeFamilyRefs"])
        if profile.get("simulatorContractRef"):
            record["simulatorContractRefs"].append(profile["simulatorContractRef"])
        record["currentExecutionPostures"].add(posture)
        if profile.get("liveCutoverState") == "pending":
            record["liveCutoverPendingCount"] += 1
        if posture == "watch_only":
            record["watchOnlyCount"] += 1
        record["sourceRefs"].update(profile["sourceRefs"])

    rows: list[dict[str, Any]] = []
    for family in sorted(grouped):
        record = grouped[family]
        rows.append(
            {
                "simulatorCoverageRef": record["simulatorCoverageRef"],
                "dependencyFamily": family,
                "coverageLabel": family.replace("_", " ").title(),
                "adapterContractProfileRefs": sorted(record["adapterContractProfileRefs"]),
                "adapterCodes": sorted(record["adapterCodes"]),
                "routeFamilyRefs": sorted(record["routeFamilyRefs"]),
                "simulatorContractRefs": sorted(set(record["simulatorContractRefs"])),
                "currentExecutionPostures": sorted(record["currentExecutionPostures"]),
                "liveCutoverPendingCount": record["liveCutoverPendingCount"],
                "watchOnlyCount": record["watchOnlyCount"],
                "requiredRings": ENVIRONMENT_ORDER,
                "coverageState": "required",
                "source_refs": sorted(record["sourceRefs"]),
            }
        )
    return rows


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    block = block.strip()
    if start_marker in text and end_marker in text:
        prefix, remainder = text.split(start_marker, 1)
        _, suffix = remainder.split(end_marker, 1)
        return prefix.rstrip() + "\n\n" + block + "\n" + suffix.lstrip("\n")
    return text.rstrip() + "\n\n" + block + "\n"


def load_context() -> dict[str, Any]:
    parity = read_json(PARITY_RULES_PATH)
    runtime = read_json(RUNTIME_TOPOLOGY_PATH)
    frontend_pack = read_json(FRONTEND_MANIFEST_PATH)
    design_pack = read_json(DESIGN_BUNDLES_PATH)
    adapter_pack = read_json(ADAPTER_PROFILE_PATH)
    degradation_pack = read_json(DEGRADATION_PATH)
    gate_rows = [row for row in read_csv(RELEASE_GATE_PATH) if row["gate_id"] in GATE_ORDER]
    root_package = read_json(ROOT_PACKAGE_PATH)

    candidates = sorted(parity["releaseCandidates"], key=lambda item: ring_index(item["environmentRing"]))
    freezes_by_release = {item["releaseCandidateRef"]: item for item in parity["releaseApprovalFreezes"]}
    matrices_by_release = {item["releaseRef"]: item for item in parity["releaseContractVerificationMatrices"]}
    parity_by_release = {item["releaseRef"]: item for item in parity["releasePublicationParityRecords"]}
    watch_by_release = {item["releaseRef"]: item for item in parity["releaseWatchTuples"]}
    wave_by_release = {item["releaseRef"]: item for item in parity["waveObservationPolicies"]}
    env_by_ring = {item["environment_ring"]: item for item in runtime["environment_manifests"]}

    frontend_manifests = frontend_pack["frontendContractManifests"]
    design_bundles = design_pack["designContractPublicationBundles"]
    adapter_profiles = adapter_pack["adapterContractProfiles"]
    degradation_profiles = degradation_pack["profiles"]
    simulator_requirements = build_simulator_requirements(adapter_profiles)

    route_details: dict[str, dict[str, Any]] = {}
    for manifest in frontend_manifests:
        for index, route_family_ref in enumerate(manifest["routeFamilyRefs"]):
            projection_ref = manifest["projectionQueryContractRefs"][min(index, len(manifest["projectionQueryContractRefs"]) - 1)]
            mutation_ref = manifest["mutationCommandContractRefs"][min(index, len(manifest["mutationCommandContractRefs"]) - 1)]
            live_ref = (
                manifest["liveUpdateChannelContractRefs"][index]
                if index < len(manifest["liveUpdateChannelContractRefs"])
                else None
            )
            settlement_ref = manifest["commandSettlementSchemaRefs"][min(index, len(manifest["commandSettlementSchemaRefs"]) - 1)]
            transition_ref = manifest["transitionEnvelopeSchemaRefs"][min(index, len(manifest["transitionEnvelopeSchemaRefs"]) - 1)]
            route_details[route_family_ref] = {
                "manifest": manifest,
                "routeContractDigestRef": choose_route_contract_digest(route_family_ref, manifest),
                "projectionQueryContractDigestRef": digest_ref("projection-query-digest", route_family_ref, projection_ref),
                "mutationCommandContractDigestRef": digest_ref("mutation-command-digest", route_family_ref, mutation_ref),
                "liveUpdateChannelDigestRef": digest_ref("live-channel-digest", route_family_ref, live_ref or "none"),
                "clientCachePolicyDigestRef": digest_ref("cache-policy-digest", route_family_ref, manifest["clientCachePolicyRef"]),
                "projectionQueryContractRef": projection_ref,
                "mutationCommandContractRef": mutation_ref,
                "liveUpdateChannelContractRef": live_ref,
                "commandSettlementSchemaRef": settlement_ref,
                "transitionEnvelopeSchemaRef": transition_ref,
            }

    design_bundle_by_audience = {bundle["audienceSurface"]: bundle for bundle in design_bundles}
    embedded_routes = sorted(
        route_family_ref
        for route_family_ref in route_details
        if "embedded" in route_family_ref or "secure_link" in route_family_ref
    )

    return {
        "parity": parity,
        "runtime": runtime,
        "frontend_pack": frontend_pack,
        "design_pack": design_pack,
        "adapter_pack": adapter_pack,
        "degradation_pack": degradation_pack,
        "candidates": candidates,
        "freezes_by_release": freezes_by_release,
        "matrices_by_release": matrices_by_release,
        "parity_by_release": parity_by_release,
        "watch_by_release": watch_by_release,
        "wave_by_release": wave_by_release,
        "env_by_ring": env_by_ring,
        "gate_rows": gate_rows,
        "frontend_manifests": frontend_manifests,
        "design_bundles": design_bundles,
        "adapter_profiles": adapter_profiles,
        "degradation_profiles": degradation_profiles,
        "simulator_requirements": simulator_requirements,
        "route_details": route_details,
        "design_bundle_by_audience": design_bundle_by_audience,
        "embedded_routes": embedded_routes,
        "framework_versions": [
            f"typescript@{root_package['devDependencies']['typescript']}",
            f"playwright@{root_package['devDependencies']['playwright']}",
            f"nx@{root_package['devDependencies']['nx']}",
            f"vite@{root_package['devDependencies']['vite']}",
        ],
    }


def build_release_artifacts(context: dict[str, Any]) -> dict[str, Any]:
    gate_source = {row["gate_id"]: row for row in context["gate_rows"]}

    compilation_records: list[dict[str, Any]] = []
    simulation_envelopes: list[dict[str, Any]] = []
    standards_watchlists: list[dict[str, Any]] = []
    baseline_fingerprints: list[dict[str, Any]] = []
    promotion_intents: list[dict[str, Any]] = []
    wave_eligibility_snapshots: list[dict[str, Any]] = []
    wave_control_fences: list[dict[str, Any]] = []
    operational_readiness_snapshots: list[dict[str, Any]] = []
    ring_policies: list[dict[str, Any]] = []
    verification_scenarios: list[dict[str, Any]] = []
    release_matrices: list[dict[str, Any]] = []
    writable_route_records: list[dict[str, Any]] = []
    continuity_records: list[dict[str, Any]] = []
    embedded_records: list[dict[str, Any]] = []
    migration_records: list[dict[str, Any]] = []
    ring_gate_rows: list[dict[str, Any]] = []
    synthetic_recovery_rows: list[dict[str, Any]] = []
    defects: list[dict[str, Any]] = []

    route_family_refs = sorted(context["route_details"])
    frontend_manifest_refs = sorted(manifest["frontendContractManifestId"] for manifest in context["frontend_manifests"])
    frontend_digest_refs = sorted(manifest["frontendContractDigestRef"] for manifest in context["frontend_manifests"])
    projection_contract_version_set_refs = sorted(
        manifest["projectionContractVersionSetRef"] for manifest in context["frontend_manifests"]
    )
    design_bundle_refs = sorted(bundle["designContractPublicationBundleId"] for bundle in context["design_bundles"])
    design_digest_refs = sorted(bundle["designContractDigestRef"] for bundle in context["design_bundles"])
    design_lint_refs = sorted(bundle["lintVerdictRef"] for bundle in context["design_bundles"])
    route_contract_digest_refs = sorted(
        {details["routeContractDigestRef"] for details in context["route_details"].values()}
    )
    projection_query_digest_refs = sorted(
        {details["projectionQueryContractDigestRef"] for details in context["route_details"].values()}
    )
    mutation_digest_refs = sorted(
        {details["mutationCommandContractDigestRef"] for details in context["route_details"].values()}
    )
    live_channel_digest_refs = sorted(
        {
            details["liveUpdateChannelDigestRef"]
            for details in context["route_details"].values()
            if details["liveUpdateChannelContractRef"]
        }
    )
    cache_policy_digest_refs = sorted(
        {details["clientCachePolicyDigestRef"] for details in context["route_details"].values()}
    )
    simulator_coverage_refs = [row["simulatorCoverageRef"] for row in context["simulator_requirements"]]

    for candidate in context["candidates"]:
        ring = candidate["environmentRing"]
        ring_token = token(ring)
        release_ref = candidate["releaseId"]
        freeze = context["freezes_by_release"][release_ref]
        parity_record = context["parity_by_release"][release_ref]
        watch_tuple = context["watch_by_release"][release_ref]
        wave_policy = context["wave_by_release"][release_ref]
        environment_manifest = context["env_by_ring"][ring]
        upstream_matrix = context["matrices_by_release"][release_ref]
        compiled_policy_bundle_ref = choose_compiled_policy_bundle_ref(freeze, candidate)
        parity_state = candidate["parityState"]
        scenario_id = f"VS_058_{ring_token}_V1"
        matrix_id = candidate["releaseContractVerificationMatrixRef"]
        matrix_hash = candidate["releaseContractMatrixHash"]
        baseline_id = f"EBF_{ring_token}_V1"
        compilation_id = f"CCR_{ring_token}_V1"
        simulation_id = f"CSE_{ring_token}_V1"
        readiness_id = f"ORS_058_{ring_token}_V1"
        controls = controls_for_ring(ring)
        control_codes = [control["code"] for control in controls]
        continuity_ids: list[str] = []
        synthetic_ids: list[str] = []
        embedded_ids: list[str] = []
        writable_ids: list[str] = []

        compilation_record = {
            "configCompilationRecordId": compilation_id,
            "releaseRef": release_ref,
            "compiledPolicyBundleRef": compiled_policy_bundle_ref,
            "releaseApprovalFreezeRef": freeze["releaseApprovalFreezeId"],
            "artifactDigestSetHash": freeze["artifactDigestSetHash"],
            "surfaceSchemaSetHash": freeze["surfaceSchemaSetHash"],
            "compilationTupleHash": freeze["compilationTupleHash"],
            "standardsWatchlistHash": freeze["standardsWatchlistHash"],
            "schemaMigrationPlanRef": freeze["schemaMigrationPlanRef"],
            "projectionBackfillPlanRef": freeze["projectionBackfillPlanRef"],
            "frameworkVersionRefs": context["framework_versions"],
            "resultState": "exact" if parity_state == "exact" else "restart_required",
            "source_refs": [
                "blueprint/platform-admin-and-config-blueprint.md#Production promotion gate",
                "data/analysis/release_publication_parity_rules.json",
            ],
        }
        compilation_records.append(compilation_record)

        simulation_envelope = {
            "configSimulationEnvelopeId": simulation_id,
            "releaseRef": release_ref,
            "configCompilationRecordRef": compilation_id,
            "compiledPolicyBundleRef": compiled_policy_bundle_ref,
            "referenceCaseRefs": [f"RCASE_058_{ring_token}_PLATFORM_V1", f"RCASE_058_{ring_token}_RECOVERY_V1"],
            "simulatorCoverageRefs": simulator_coverage_refs,
            "requiredProbeRefs": wave_policy["requiredProbeRefs"],
            "resultState": "exact" if parity_state == "exact" else "restart_required",
            "source_refs": [
                "blueprint/platform-admin-and-config-blueprint.md#Production promotion gate",
                "data/analysis/adapter_contract_profile_template.json",
            ],
        }
        simulation_envelopes.append(simulation_envelope)

        watchlist_state = "current" if parity_state == "exact" else "restart_required" if parity_state == "stale" else "blocked"
        standards_watchlists.append(
            {
                "standardsDependencyWatchlistRef": freeze["standardsDependencyWatchlistRef"],
                "releaseRef": release_ref,
                "standardsWatchlistHash": freeze["standardsWatchlistHash"],
                "watchlistState": watchlist_state,
                "blockingReasonIds": parity_record["driftReasonIds"],
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
                    "data/analysis/release_publication_parity_rules.json",
                ],
            }
        )

        baseline_fingerprints.append(
            {
                "environmentBaselineFingerprintId": baseline_id,
                "ringCode": ring,
                "releaseRef": release_ref,
                "runtimeTopologyManifestRef": "data/analysis/runtime_topology_manifest.json",
                "releaseApprovalFreezeRef": freeze["releaseApprovalFreezeId"],
                "baselineTupleHash": freeze["baselineTupleHash"],
                "compilationTupleHash": freeze["compilationTupleHash"],
                "topologyTupleHash": candidate["topologyTupleHash"],
                "standardsWatchlistHash": freeze["standardsWatchlistHash"],
                "configCompilationRecordRef": compilation_id,
                "configSimulationEnvelopeRef": simulation_id,
                "allowedRegionRoles": environment_manifest["allowed_region_roles"],
                "defaultWriteRegionRef": environment_manifest["default_write_region_ref"],
                "runtimeWorkloadFamilyRefs": sorted(set(environment_manifest["runtime_workload_family_refs"])),
                "gatewaySurfaceRefs": sorted(environment_manifest["gateway_surface_refs"]),
                "serviceIdentityRefs": sorted(environment_manifest["service_identity_refs"]),
                "queueRefs": sorted(environment_manifest["queue_refs"]),
                "dataStoreRefs": sorted(environment_manifest["data_store_refs"]),
                "fingerprintState": "aligned" if parity_state == "exact" else "drifted",
                "notes": "The baseline fingerprint is mandatory evidence for every ring advancement; tuple drift forces restart or halt semantics.",
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#EnvironmentBaselineFingerprint",
                    "data/analysis/runtime_topology_manifest.json",
                ],
            }
        )

        promotion_intent_ref = candidate["promotionIntentRefs"][0]
        target_ring = ENVIRONMENT_ORDER[min(ring_index(ring) + 1, len(ENVIRONMENT_ORDER) - 1)]
        promotion_intents.append(
            {
                "promotionIntentEnvelopeId": promotion_intent_ref,
                "releaseRef": release_ref,
                "ringCode": ring,
                "advancementTargetRing": target_ring,
                "intentAction": "promote" if ring != "production" else "control_wave",
                "intentState": "live",
                "environmentBaselineFingerprintRef": baseline_id,
                "configCompilationRecordRef": compilation_id,
                "configSimulationEnvelopeRef": simulation_id,
                "standardsDependencyWatchlistRef": freeze["standardsDependencyWatchlistRef"],
                "releaseApprovalFreezeRef": freeze["releaseApprovalFreezeId"],
                "releaseContractVerificationMatrixRef": matrix_id,
                "releaseContractMatrixHash": matrix_hash,
                "requiredGateRefs": REQUIRED_GATE_REFS_BY_RING[ring],
                "restartOnDrift": True,
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#PromotionIntentEnvelope",
                    "data/analysis/release_publication_parity_rules.json",
                ],
            }
        )

        control_code_to_synthetic_ids: dict[str, list[str]] = {}
        if ring_index(ring) >= ring_index("integration"):
            for control in controls:
                control_token = token(control["code"])
                route_family_ref = control["routeFamilyRefs"][0]
                manifest = context["route_details"][route_family_ref]["manifest"]
                row_id = f"SRCR_058_{ring_token}_{control_token}_V1"
                coverage_state = coverage_state_from_parity(parity_state)
                row = {
                    "synthetic_recovery_coverage_record_id": row_id,
                    "release_ref": release_ref,
                    "verification_scenario_ref": scenario_id,
                    "release_contract_verification_matrix_ref": matrix_id,
                    "release_contract_matrix_hash": matrix_hash,
                    "release_watch_tuple_ref": watch_tuple["releaseWatchTupleId"],
                    "runtime_publication_bundle_ref": candidate["runtimePublicationBundleRef"],
                    "release_publication_parity_ref": candidate["publicationParityRef"],
                    "watch_tuple_hash": watch_tuple["watchTupleHash"],
                    "ring_code": ring,
                    "audience_scope": control["audienceScope"],
                    "journey_code": control["journeyCode"],
                    "route_family_ref": route_family_ref,
                    "required_continuity_control_refs": control["code"],
                    "continuity_evidence_contract_refs": f"CEC_058_{control_token}_V1",
                    "recovery_disposition_refs": "; ".join(sorted(manifest["releaseRecoveryDispositionRefs"])),
                    "route_intent_evidence_refs": f"RIB_058_{slug(route_family_ref)}_{ring}_v1",
                    "command_settlement_evidence_refs": f"CSEV_058_{slug(route_family_ref)}_{ring}_v1",
                    "posture_type": control["postureType"],
                    "coverage_state": coverage_state,
                    "evidence_ref": f"SREC_058_{ring_token}_{control_token}_V1",
                    "result_state": result_state_from_parity(parity_state),
                    "executed_at": TIMESTAMP,
                }
                synthetic_recovery_rows.append(row)
                synthetic_ids.append(row_id)
                control_code_to_synthetic_ids.setdefault(control["code"], []).append(row_id)

        for route_family_ref in route_family_refs:
            details = context["route_details"][route_family_ref]
            manifest = details["manifest"]
            record_id = f"WRCCR_058_{ring_token}_{token(route_family_ref)}_V1"
            writable_ids.append(record_id)
            writable_route_records.append(
                {
                    "writableRouteContractCoverageRecordId": record_id,
                    "releaseContractVerificationMatrixRef": matrix_id,
                    "routeFamilyRef": route_family_ref,
                    "audienceSurfaceRefs": [manifest["audienceSurface"]],
                    "routeContractDigestRef": details["routeContractDigestRef"],
                    "frontendContractDigestRef": manifest["frontendContractDigestRef"],
                    "projectionQueryContractDigestRef": details["projectionQueryContractDigestRef"],
                    "mutationCommandContractDigestRef": details["mutationCommandContractDigestRef"],
                    "clientCachePolicyDigestRef": details["clientCachePolicyDigestRef"],
                    "commandSettlementSchemaSetRef": upstream_matrix["commandSettlementSchemaSetRef"],
                    "transitionEnvelopeSchemaSetRef": upstream_matrix["transitionEnvelopeSchemaSetRef"],
                    "requiredReleaseRecoveryDispositionRefs": manifest["releaseRecoveryDispositionRefs"],
                    "requiredRouteFreezeDispositionRefs": manifest["routeFreezeDispositionRefs"],
                    "requiredRouteIntentBindingState": "verified" if parity_state == "exact" else "stale",
                    "requiredCommandSettlementState": "verified" if parity_state == "exact" else "stale",
                    "evidenceRefs": [
                        simulation_id,
                        manifest["frontendContractManifestId"],
                        details["mutationCommandContractRef"],
                        details["commandSettlementSchemaRef"],
                    ],
                    "coverageState": coverage_state_from_parity(parity_state),
                    "recordedAt": TIMESTAMP,
                }
            )

        for control in controls:
            control_token = token(control["code"])
            record_id = f"CCCR_058_{ring_token}_{control_token}_V1"
            continuity_ids.append(record_id)
            relevant_recovery_dispositions: set[str] = set()
            for route_family_ref in control["routeFamilyRefs"]:
                relevant_recovery_dispositions.update(
                    context["route_details"][route_family_ref]["manifest"]["releaseRecoveryDispositionRefs"]
                )
            continuity_records.append(
                {
                    "continuityContractCoverageRecordId": record_id,
                    "releaseContractVerificationMatrixRef": matrix_id,
                    "continuityControlCode": control["code"],
                    "routeFamilyRefs": control["routeFamilyRefs"],
                    "requiredContinuityControlRef": control["code"],
                    "continuityEvidenceContractRef": f"CEC_058_{control_token}_V1",
                    "simulationEvidenceRef": f"SIMPROOF_058_{ring_token}_{control_token}_V1",
                    "publicationEvidenceRef": f"PUBPROOF_058_{ring_token}_{control_token}_V1",
                    "syntheticRecoveryCoverageRefs": control_code_to_synthetic_ids.get(control["code"], []),
                    "recoveryDispositionRefs": sorted(relevant_recovery_dispositions),
                    "coverageState": coverage_state_from_parity(parity_state),
                    "recordedAt": TIMESTAMP,
                }
            )

        for route_family_ref in context["embedded_routes"]:
            manifest = context["route_details"][route_family_ref]["manifest"]
            record_id = f"ESCCR_058_{ring_token}_{token(route_family_ref)}_V1"
            embedded_ids.append(record_id)
            channel_family_ref = "channel_embedded_host_bridge" if "embedded" in route_family_ref else "channel_secure_link_recovery"
            embedded_records.append(
                {
                    "embeddedSurfaceContractCoverageRecordId": record_id,
                    "releaseContractVerificationMatrixRef": matrix_id,
                    "routeFamilyRef": route_family_ref,
                    "audienceSurfaceRef": manifest["audienceSurface"],
                    "channelFamilyRef": channel_family_ref,
                    "channelManifestSetRef": freeze["channelManifestSetRef"],
                    "minimumBridgeCapabilitySetRef": freeze["minimumBridgeCapabilitySetRef"],
                    "releaseRecoveryDispositionRef": manifest["releaseRecoveryDispositionRef"],
                    "routeFreezeDispositionRef": manifest["routeFreezeDispositionRef"],
                    "compatibilityEvidenceRefs": [
                        manifest["audienceSurfaceRuntimeBindingRef"],
                        freeze["minimumBridgeCapabilitySetRef"],
                        candidate["publicationParityRef"],
                    ],
                    "coverageState": coverage_state_from_parity(parity_state),
                    "recordedAt": TIMESTAMP,
                }
            )

        migration_record_id = f"MVR_058_{ring_token}_V1"
        migration_records.append(
            {
                "migrationVerificationRecordId": migration_record_id,
                "verificationScenarioRef": scenario_id,
                "releaseContractVerificationMatrixRef": matrix_id,
                "releaseContractMatrixHash": matrix_hash,
                "migrationExecutionBindingRef": f"MEB_058_{ring_token}_V1",
                "migrationPlanRef": freeze["schemaMigrationPlanRef"],
                "runtimePublicationBundleRef": candidate["runtimePublicationBundleRef"],
                "releasePublicationParityRef": candidate["publicationParityRef"],
                "commandSettlementSchemaSetRef": upstream_matrix["commandSettlementSchemaSetRef"],
                "transitionEnvelopeSchemaSetRef": upstream_matrix["transitionEnvelopeSchemaSetRef"],
                "requiredContinuityControlRefs": control_codes,
                "continuityEvidenceContractRefs": [f"CEC_058_{token(code)}_V1" for code in control_codes],
                "writableRouteContractCoverageRefs": writable_ids,
                "continuityContractCoverageRefs": continuity_ids,
                "embeddedSurfaceContractCoverageRefs": embedded_ids,
                "rollbackMode": ROLLBACK_MODE_BY_RING[ring],
                "dryRunEvidenceRef": f"DRYRUN_058_{ring_token}_V1",
                "backfillConvergenceRef": freeze["projectionBackfillPlanRef"],
                "compatibilityWindowEvidenceRef": f"COMPWIN_058_{ring_token}_V1",
                "readPathCompatibilityEvidenceRef": f"READPATH_058_{ring_token}_V1",
                "routeReadinessEvidenceRefs": [f"READY_058_{ring_token}_{index}" for index in range(1, 4)],
                "rollbackPublicationEvidenceRef": f"ROLLBACKPUB_058_{ring_token}_V1",
                "migrationObservationEvidenceRef": f"MOBS_058_{ring_token}_V1",
                "routeRecoveryEvidenceRefs": synthetic_ids,
                "restoreCompatibilityState": coverage_state_from_parity(parity_state),
                "recordedAt": TIMESTAMP,
            }
        )

        operational_readiness_snapshots.append(
            {
                "operationalReadinessSnapshotId": readiness_id,
                "releaseRef": release_ref,
                "verificationScenarioRef": scenario_id,
                "releaseContractVerificationMatrixRef": matrix_id,
                "releaseContractMatrixHash": matrix_hash,
                "runtimePublicationBundleRef": candidate["runtimePublicationBundleRef"],
                "releasePublicationParityRef": candidate["publicationParityRef"],
                "releaseWatchTupleRef": watch_tuple["releaseWatchTupleId"],
                "watchTupleHash": watch_tuple["watchTupleHash"],
                "waveObservationPolicyRef": wave_policy["waveObservationPolicyId"],
                "requiredAssuranceSliceRefs": watch_tuple["requiredAssuranceSliceRefs"],
                "releaseTrustFreezeVerdictRefs": watch_tuple["releaseTrustFreezeVerdictRefs"],
                "dashboardBundleRefs": [
                    f"DBP_058_{ring_token}_ESSENTIAL_V1",
                    f"DBP_058_{ring_token}_RECOVERY_V1",
                ],
                "runbookBindingRefs": [f"RBR_058_{ring_token}_CORE_V1"],
                "syntheticCoverageRefs": synthetic_ids,
                "essentialFunctionRefs": [
                    "ef_patient_navigation",
                    "ef_request_and_booking_continuity",
                    "ef_staff_task_completion",
                    "ef_pharmacy_settlement",
                ],
                "essentialFunctionHealthEnvelopeRefs": [
                    f"EFHE_058_{ring_token}_PATIENT_V1",
                    f"EFHE_058_{ring_token}_STAFF_V1",
                ],
                "recoveryTierRefs": [
                    "rt_platform_restore",
                    "rt_callback_replay",
                    "rt_constrained_browser_recovery",
                ],
                "backupSetManifestRefs": [f"BSM_058_{ring_token}_CORE_V1"],
                "resilienceSurfaceRuntimeBindingRefs": [
                    f"RSRB_058_{ring_token}_PATIENT_V1",
                    f"RSRB_058_{ring_token}_STAFF_V1",
                ],
                "recoveryControlPostureRefs": [f"RCP_058_{ring_token}_V1"],
                "recoveryEvidencePackRefs": [f"REP_058_{ring_token}_V1"],
                "latestRecoveryEvidencePackRef": f"REP_058_{ring_token}_V1",
                "latestRestoreRunRefs": [f"RESTORE_058_{ring_token}_V1"],
                "latestFailoverRunRefs": [f"FAILOVER_058_{ring_token}_V1"],
                "latestChaosRunRefs": [f"CHAOS_058_{ring_token}_V1"],
                "latestJourneyRecoveryProofRefs": synthetic_ids,
                "latestResilienceActionSettlementRefs": [f"RAS_058_{ring_token}_V1"],
                "resilienceTupleHash": sha16(readiness_id, watch_tuple["watchTupleHash"], matrix_hash, synthetic_ids),
                "ownerCoverageState": "covered" if parity_state == "exact" else "gap",
                "verdictCoverageState": coverage_state_from_parity(parity_state),
                "freshnessState": "fresh" if parity_state == "exact" else "stale",
                "rehearsalFreshnessState": "fresh" if parity_state == "exact" else "stale",
                "readinessState": READINESS_STATE_BY_PARITY[parity_state],
                "capturedAt": TIMESTAMP,
            }
        )

        wave_eligibility_state = "eligible" if parity_state == "exact" else "restart_required" if parity_state == "stale" else "blocked"
        wave_eligibility_snapshots.append(
            {
                "waveEligibilitySnapshotId": parity_record["waveEligibilitySnapshotRef"],
                "releaseRef": release_ref,
                "ringCode": ring,
                "promotionIntentEnvelopeRef": promotion_intent_ref,
                "environmentBaselineFingerprintRef": baseline_id,
                "releaseWatchTupleRef": watch_tuple["releaseWatchTupleId"],
                "watchTupleHash": watch_tuple["watchTupleHash"],
                "releaseContractVerificationMatrixRef": matrix_id,
                "releaseContractMatrixHash": matrix_hash,
                "requiredGateRefs": REQUIRED_GATE_REFS_BY_RING[ring],
                "requiredContinuityControlRefs": control_codes,
                "requiredSyntheticRecoveryCoverageRefs": synthetic_ids,
                "eligibilityState": wave_eligibility_state,
                "blockingReasonIds": parity_record["driftReasonIds"],
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#WaveEligibilitySnapshot",
                    "data/analysis/release_publication_parity_rules.json",
                ],
            }
        )

        if parity_state == "exact":
            allowed_action_codes = ["promote", "pause", "rollback"]
            if ring == "production":
                allowed_action_codes = ["canary", "widen", "pause", "rollback"]
        elif parity_state == "stale":
            allowed_action_codes = ["halt", "restart"]
        elif parity_state == "conflict":
            allowed_action_codes = ["halt", "rollback"]
        else:
            allowed_action_codes = ["rollback", "kill_switch"]
        wave_control_fences.append(
            {
                "waveControlFenceId": watch_tuple["waveControlFenceRef"],
                "releaseRef": release_ref,
                "ringCode": ring,
                "promotionIntentEnvelopeRef": promotion_intent_ref,
                "waveEligibilitySnapshotRef": parity_record["waveEligibilitySnapshotRef"],
                "releaseWatchTupleRef": watch_tuple["releaseWatchTupleId"],
                "watchTupleHash": watch_tuple["watchTupleHash"],
                "canaryPosture": "armed" if parity_state == "exact" and ring == "production" else "blocked",
                "widenPosture": "armed" if parity_state == "exact" and ring == "production" else "blocked",
                "haltPosture": "armed",
                "rollbackPosture": "required" if parity_state == "withdrawn" else "ready",
                "resumePosture": "armed" if parity_state == "exact" else "restart_only",
                "allowedActionCodes": allowed_action_codes,
                "haltOnDrift": True,
                "restartOnDrift": True,
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#WaveControlFence",
                    "data/analysis/release_publication_parity_rules.json",
                ],
            }
        )

        design_bundle_refs_for_scenario = sorted(
            {
                context["design_bundle_by_audience"][manifest["audienceSurface"]]["designContractPublicationBundleId"]
                for manifest in context["frontend_manifests"]
            }
        )
        design_digest_refs_for_scenario = sorted(
            {
                context["design_bundle_by_audience"][manifest["audienceSurface"]]["designContractDigestRef"]
                for manifest in context["frontend_manifests"]
            }
        )
        design_lint_refs_for_scenario = sorted(
            {
                context["design_bundle_by_audience"][manifest["audienceSurface"]]["lintVerdictRef"]
                for manifest in context["frontend_manifests"]
            }
        )

        verification_scenarios.append(
            {
                "verificationScenarioId": scenario_id,
                "releaseRef": release_ref,
                "ringCode": ring,
                "candidateBundleHash": candidate["bundleFreezeDigestRef"],
                "artifactDigests": candidate["artifactDigests"],
                "bundleHashRefs": candidate["bundleHashRefs"],
                "compiledPolicyBundleRef": compiled_policy_bundle_ref,
                "configCompilationRecordRef": compilation_id,
                "configSimulationEnvelopeRef": simulation_id,
                "standardsDependencyWatchlistRef": freeze["standardsDependencyWatchlistRef"],
                "standardsWatchlistHash": freeze["standardsWatchlistHash"],
                "approvalEvidenceBundleRef": watch_tuple["approvalEvidenceBundleRef"],
                "releaseContractVerificationMatrixRef": matrix_id,
                "releaseContractMatrixHash": matrix_hash,
                "releaseApprovalFreezeRef": freeze["releaseApprovalFreezeId"],
                "runtimeTopologyManifestRef": candidate["runtimeTopologyManifestRef"],
                "runtimePublicationBundleRef": candidate["runtimePublicationBundleRef"],
                "releasePublicationParityRef": candidate["publicationParityRef"],
                "environmentBaselineFingerprintRef": baseline_id,
                "promotionIntentEnvelopeRef": promotion_intent_ref,
                "waveEligibilitySnapshotRef": parity_record["waveEligibilitySnapshotRef"],
                "waveControlFenceRef": watch_tuple["waveControlFenceRef"],
                "operationalReadinessSnapshotRef": readiness_id,
                "designContractBundleRefs": design_bundle_refs_for_scenario,
                "designContractDigestRefs": design_digest_refs_for_scenario,
                "designContractLintVerdictRefs": design_lint_refs_for_scenario,
                "routeFamilyRefs": route_family_refs,
                "routeContractDigestRefs": route_contract_digest_refs,
                "frontendContractManifestRefs": frontend_manifest_refs,
                "frontendContractDigestRefs": frontend_digest_refs,
                "projectionContractVersionSetRefs": projection_contract_version_set_refs,
                "projectionQueryContractDigestRefs": projection_query_digest_refs,
                "mutationCommandContractDigestRefs": mutation_digest_refs,
                "liveUpdateChannelDigestRefs": live_channel_digest_refs,
                "clientCachePolicyDigestRefs": cache_policy_digest_refs,
                "commandSettlementSchemaSetRef": upstream_matrix["commandSettlementSchemaSetRef"],
                "transitionEnvelopeSchemaSetRef": upstream_matrix["transitionEnvelopeSchemaSetRef"],
                "requiredContinuityControlRefs": control_codes,
                "requiredContinuityCoverageRefs": continuity_ids,
                "requiredSyntheticRecoveryCoverageRefs": synthetic_ids,
                "requiredSimulatorCoverageRefs": simulator_coverage_refs,
                "requiredOperationalEvidenceRefs": [
                    baseline_id,
                    compilation_id,
                    simulation_id,
                    freeze["standardsDependencyWatchlistRef"],
                    readiness_id,
                ],
                "writableRouteContractCoverageRefs": writable_ids,
                "continuityContractCoverageRefs": continuity_ids,
                "embeddedSurfaceContractCoverageRefs": embedded_ids,
                "recoveryDispositionRefs": parity_record["recoveryDispositionRefs"],
                "releaseWatchTupleRef": watch_tuple["releaseWatchTupleId"],
                "watchTupleTemplateRef": watch_tuple["releaseWatchTupleId"],
                "watchTupleHash": watch_tuple["watchTupleHash"],
                "waveObservationPolicyRef": wave_policy["waveObservationPolicyId"],
                "rollbackMode": ROLLBACK_MODE_BY_RING[ring],
                "referenceCaseRefs": [f"RCASE_058_{ring_token}_PLATFORM_V1", f"RCASE_058_{ring_token}_RECOVERY_V1"],
                "frameworkVersionRefs": context["framework_versions"],
                "requiredGateSet": REQUIRED_GATE_REFS_BY_RING[ring],
                "scenarioState": SCENARIO_STATE_BY_PARITY[parity_state],
                "driftState": DRIFT_STATE_BY_PARITY[parity_state],
                "createdAt": TIMESTAMP,
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#VerificationScenario",
                    "prompt/058.md",
                ],
            }
        )

        release_matrices.append(
            {
                "releaseContractVerificationMatrixId": matrix_id,
                "releaseRef": release_ref,
                "compiledPolicyBundleRef": compiled_policy_bundle_ref,
                "configCompilationRecordRef": compilation_id,
                "configSimulationEnvelopeRef": simulation_id,
                "candidateBundleHash": candidate["bundleFreezeDigestRef"],
                "baselineTupleHash": freeze["baselineTupleHash"],
                "compilationTupleHash": freeze["compilationTupleHash"],
                "routeFamilyRefs": route_family_refs,
                "routeContractDigestRefs": route_contract_digest_refs,
                "frontendContractManifestRefs": frontend_manifest_refs,
                "frontendContractDigestRefs": frontend_digest_refs,
                "designContractPublicationBundleRefs": design_bundle_refs_for_scenario,
                "designContractDigestRefs": design_digest_refs_for_scenario,
                "designContractLintVerdictRefs": design_lint_refs_for_scenario,
                "projectionContractVersionSetRefs": projection_contract_version_set_refs,
                "projectionQueryContractDigestRefs": projection_query_digest_refs,
                "mutationCommandContractDigestRefs": mutation_digest_refs,
                "liveUpdateChannelDigestRefs": live_channel_digest_refs,
                "clientCachePolicyDigestRefs": cache_policy_digest_refs,
                "commandSettlementSchemaSetRef": upstream_matrix["commandSettlementSchemaSetRef"],
                "transitionEnvelopeSchemaSetRef": upstream_matrix["transitionEnvelopeSchemaSetRef"],
                "recoveryDispositionRefs": parity_record["recoveryDispositionRefs"],
                "requiredContinuityControlRefs": control_codes,
                "continuityEvidenceContractRefs": [f"CEC_058_{token(code)}_V1" for code in control_codes],
                "writableRouteContractCoverageRefs": writable_ids,
                "continuityContractCoverageRefs": continuity_ids,
                "embeddedSurfaceContractCoverageRefs": embedded_ids,
                "crossPhaseConformanceScorecardRef": "CPCS_058_PHASE0_PLATFORM_V1",
                "phaseConformanceRowRefs": [
                    "PCR_058_RUNTIME_PUBLICATION_V1",
                    "PCR_058_RECOVERY_READINESS_V1",
                    "PCR_058_CONTINUITY_CONTROL_V1",
                    "PCR_058_GOVERNANCE_WATCH_V1",
                ],
                "matrixState": matrix_state_from_parity(parity_state),
                "matrixHash": matrix_hash,
                "generatedAt": TIMESTAMP,
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseContractVerificationMatrix",
                    "data/analysis/release_publication_parity_rules.json",
                ],
            }
        )

        ring_policies.append(
            {
                "ringCode": ring,
                "purpose": RING_PURPOSES[ring],
                "entryPrerequisites": ENTRY_PREREQUISITES_BY_RING[ring],
                "requiredGateRefs": REQUIRED_GATE_REFS_BY_RING[ring],
                "requiredSimulatorCoverageRefs": simulator_coverage_refs,
                "requiredContinuityCoverageRefs": continuity_ids,
                "requiredRecoveryCoverageRefs": synthetic_ids,
                "requiredOperationalEvidenceRefs": [
                    baseline_id,
                    promotion_intent_ref,
                    parity_record["waveEligibilitySnapshotRef"],
                    watch_tuple["waveControlFenceRef"],
                    readiness_id,
                ],
                "promotionBlockers": (
                    parity_record["driftReasonIds"]
                    if parity_record["driftReasonIds"]
                    else [
                        "Any matrix member, watchlist hash, config simulation tuple, parity tuple, or recovery tuple drift forces restart or halt."
                    ]
                ),
                "rollbackMode": ROLLBACK_MODE_BY_RING[ring],
                "notes": RING_NOTES[ring],
            }
        )

        for gate_id in GATE_ORDER:
            source_row = gate_source[gate_id]
            verdict = gate_verdict(ring, gate_id, parity_state)
            ring_gate_rows.append(
                {
                    "ring_code": ring,
                    "gate_id": gate_id,
                    "gate_name": source_row["gate_name"],
                    "verification_scenario_id": scenario_id,
                    "release_ref": release_ref,
                    "release_contract_verification_matrix_ref": matrix_id,
                    "release_contract_matrix_hash": matrix_hash,
                    "promotion_intent_ref": promotion_intent_ref,
                    "baseline_fingerprint_ref": baseline_id,
                    "standards_dependency_watchlist_ref": freeze["standardsDependencyWatchlistRef"],
                    "standards_watchlist_hash": freeze["standardsWatchlistHash"],
                    "required_simulator_coverage_refs": "; ".join(simulator_coverage_refs),
                    "required_continuity_coverage_refs": "; ".join(continuity_ids),
                    "required_recovery_coverage_refs": "; ".join(synthetic_ids),
                    "required_operational_evidence_refs": "; ".join(
                        [baseline_id, promotion_intent_ref, parity_record["waveEligibilitySnapshotRef"], watch_tuple["waveControlFenceRef"], readiness_id]
                    ),
                    "gate_binding_state": verdict,
                    "drift_action": "continue" if verdict in {"exact", "carried_forward"} else "restart_or_halt",
                    "blocking_condition": source_row["blocking_condition"],
                    "source_refs": source_row["source_refs"],
                }
            )

        if parity_record["driftReasonIds"]:
            defects.append(
                {
                    "defectId": f"DRIFT_058_{ring_token}_TUPLE_CONTROL",
                    "ringCode": ring,
                    "releaseRef": release_ref,
                    "severity": "critical" if parity_state in {"conflict", "withdrawn"} else "high",
                    "status": "open",
                    "summary": f"{ring.title()} promotion is fail-closed because the pinned verification tuple drifted.",
                    "effect": "; ".join(parity_record["driftReasonIds"]),
                    "blockingGateRefs": REQUIRED_GATE_REFS_BY_RING[ring],
                    "source_refs": parity_record["source_refs"],
                }
            )

    environment_policy = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "ring_count": len(ring_policies),
            "gate_count": len(GATE_ORDER),
            "baseline_fingerprint_count": len(baseline_fingerprints),
            "promotion_intent_count": len(promotion_intents),
            "wave_eligibility_snapshot_count": len(wave_eligibility_snapshots),
            "wave_control_fence_count": len(wave_control_fences),
            "operational_readiness_snapshot_count": len(operational_readiness_snapshots),
            "simulator_requirement_count": len(context["simulator_requirements"]),
            "drift_defect_count": len(defects),
        },
        "gateDefinitions": [
            {
                "gateId": row["gate_id"],
                "gateName": row["gate_name"],
                "environmentRing": row["environment_ring"],
                "candidateScope": row["candidate_scope"],
                "verificationScenarioBinding": row["verification_scenario_binding"],
                "contractMatrixBinding": row["contract_matrix_binding"],
                "mustPublishObjectRefs": split_semicolon(row["must_publish_object_refs"]),
                "evidenceRefs": split_semicolon(row["evidence_refs"]),
                "continuityRule": row["continuity_rule"],
                "essentialFunctionRule": row["essential_function_rule"],
                "blockingCondition": row["blocking_condition"],
                "tenantScopeMode": row["tenant_scope_mode"],
                "trustSliceCode": row["trust_slice_code"],
                "linkedGapRefs": split_semicolon(row["linked_gap_refs"]),
                "source_refs": split_semicolon(row["source_refs"]),
            }
            for row in context["gate_rows"]
        ],
        "simulatorCoverageRequirements": context["simulator_requirements"],
        "configCompilationRecords": compilation_records,
        "configSimulationEnvelopes": simulation_envelopes,
        "standardsWatchlists": standards_watchlists,
        "environmentBaselineFingerprints": baseline_fingerprints,
        "promotionIntentEnvelopes": promotion_intents,
        "waveEligibilitySnapshots": wave_eligibility_snapshots,
        "waveControlFences": wave_control_fences,
        "operationalReadinessSnapshots": operational_readiness_snapshots,
        "ringPolicies": ring_policies,
        "assumptions": ASSUMPTIONS,
        "defects": defects,
    }

    verification_scenario_pack = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "scenario_count": len(verification_scenarios),
            "aligned_count": sum(1 for row in verification_scenarios if row["driftState"] == "aligned"),
            "restart_required_count": sum(1 for row in verification_scenarios if row["driftState"] == "restart_required"),
            "halted_count": sum(1 for row in verification_scenarios if row["driftState"] == "halted"),
            "rollback_required_count": sum(1 for row in verification_scenarios if row["driftState"] == "rollback_required"),
            "continuity_control_count": len(CONTINUITY_CONTROL_CATALOG),
            "simulator_requirement_count": len(context["simulator_requirements"]),
        },
        "continuityControlCatalog": CONTINUITY_CONTROL_CATALOG,
        "verificationScenarios": verification_scenarios,
        "assumptions": ASSUMPTIONS,
        "defects": defects,
    }

    matrix_pack = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "matrix_count": len(release_matrices),
            "writable_route_coverage_count": len(writable_route_records),
            "continuity_coverage_count": len(continuity_records),
            "embedded_surface_coverage_count": len(embedded_records),
            "migration_verification_count": len(migration_records),
            "exact_matrix_count": sum(1 for row in release_matrices if row["matrixState"] == "exact"),
            "blocked_matrix_count": sum(1 for row in release_matrices if row["matrixState"] == "blocked"),
        },
        "releaseContractVerificationMatrices": release_matrices,
        "writableRouteContractCoverageRecords": writable_route_records,
        "continuityContractCoverageRecords": continuity_records,
        "embeddedSurfaceContractCoverageRecords": embedded_records,
        "migrationVerificationRecords": migration_records,
        "defects": defects,
    }

    return {
        "environment_policy": environment_policy,
        "verification_scenario_pack": verification_scenario_pack,
        "matrix_pack": matrix_pack,
        "ring_gate_rows": ring_gate_rows,
        "synthetic_recovery_rows": synthetic_recovery_rows,
        "defects": defects,
    }


def build_promotion_intent_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/promotion-intent-envelope.schema.json",
        "title": "PromotionIntentEnvelope",
        "type": "object",
        "required": [
            "promotionIntentEnvelopeId",
            "releaseRef",
            "ringCode",
            "advancementTargetRing",
            "intentAction",
            "intentState",
            "environmentBaselineFingerprintRef",
            "releaseContractVerificationMatrixRef",
            "releaseContractMatrixHash",
            "requiredGateRefs",
        ],
        "properties": {
            "promotionIntentEnvelopeId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "ringCode": {"enum": ENVIRONMENT_ORDER},
            "advancementTargetRing": {"enum": ENVIRONMENT_ORDER},
            "intentAction": {"type": "string"},
            "intentState": {"enum": ["live", "paused", "superseded", "withdrawn"]},
            "environmentBaselineFingerprintRef": {"type": "string"},
            "configCompilationRecordRef": {"type": "string"},
            "configSimulationEnvelopeRef": {"type": "string"},
            "standardsDependencyWatchlistRef": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "releaseContractVerificationMatrixRef": {"type": "string"},
            "releaseContractMatrixHash": {"type": "string"},
            "requiredGateRefs": {"type": "array", "items": {"type": "string"}},
            "restartOnDrift": {"type": "boolean"},
        },
        "$defs": {
            "EnvironmentBaselineFingerprint": {
                "type": "object",
                "required": [
                    "environmentBaselineFingerprintId",
                    "ringCode",
                    "releaseRef",
                    "baselineTupleHash",
                    "compilationTupleHash",
                    "topologyTupleHash",
                    "fingerprintState",
                ],
                "properties": {
                    "environmentBaselineFingerprintId": {"type": "string"},
                    "ringCode": {"enum": ENVIRONMENT_ORDER},
                    "releaseRef": {"type": "string"},
                    "baselineTupleHash": {"type": "string"},
                    "compilationTupleHash": {"type": "string"},
                    "topologyTupleHash": {"type": "string"},
                    "fingerprintState": {"enum": ["aligned", "drifted"]},
                },
            },
            "WaveEligibilitySnapshot": {
                "type": "object",
                "required": [
                    "waveEligibilitySnapshotId",
                    "releaseRef",
                    "ringCode",
                    "releaseContractVerificationMatrixRef",
                    "releaseContractMatrixHash",
                    "eligibilityState",
                ],
                "properties": {
                    "waveEligibilitySnapshotId": {"type": "string"},
                    "releaseRef": {"type": "string"},
                    "ringCode": {"enum": ENVIRONMENT_ORDER},
                    "releaseContractVerificationMatrixRef": {"type": "string"},
                    "releaseContractMatrixHash": {"type": "string"},
                    "eligibilityState": {
                        "enum": ["eligible", "restart_required", "blocked"]
                    },
                },
            },
            "WaveControlFence": {
                "type": "object",
                "required": [
                    "waveControlFenceId",
                    "releaseRef",
                    "ringCode",
                    "allowedActionCodes",
                    "haltOnDrift",
                    "restartOnDrift",
                ],
                "properties": {
                    "waveControlFenceId": {"type": "string"},
                    "releaseRef": {"type": "string"},
                    "ringCode": {"enum": ENVIRONMENT_ORDER},
                    "allowedActionCodes": {"type": "array", "items": {"type": "string"}},
                    "haltOnDrift": {"type": "boolean"},
                    "restartOnDrift": {"type": "boolean"},
                },
            },
        },
    }


def build_matrix_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/release-contract-verification-matrix.schema.json",
        "title": "ReleaseContractVerificationMatrix",
        "type": "object",
        "required": [
            "releaseContractVerificationMatrixId",
            "releaseRef",
            "compiledPolicyBundleRef",
            "configCompilationRecordRef",
            "configSimulationEnvelopeRef",
            "candidateBundleHash",
            "baselineTupleHash",
            "compilationTupleHash",
            "routeFamilyRefs",
            "routeContractDigestRefs",
            "frontendContractManifestRefs",
            "frontendContractDigestRefs",
            "designContractPublicationBundleRefs",
            "designContractDigestRefs",
            "designContractLintVerdictRefs",
            "projectionContractVersionSetRefs",
            "projectionQueryContractDigestRefs",
            "mutationCommandContractDigestRefs",
            "clientCachePolicyDigestRefs",
            "commandSettlementSchemaSetRef",
            "transitionEnvelopeSchemaSetRef",
            "requiredContinuityControlRefs",
            "continuityEvidenceContractRefs",
            "writableRouteContractCoverageRefs",
            "continuityContractCoverageRefs",
            "embeddedSurfaceContractCoverageRefs",
            "matrixState",
            "matrixHash",
            "generatedAt",
        ],
        "properties": {
            "releaseContractVerificationMatrixId": {"type": "string"},
            "releaseRef": {"type": "string"},
            "compiledPolicyBundleRef": {"type": "string"},
            "configCompilationRecordRef": {"type": "string"},
            "configSimulationEnvelopeRef": {"type": "string"},
            "candidateBundleHash": {"type": "string"},
            "baselineTupleHash": {"type": "string"},
            "compilationTupleHash": {"type": "string"},
            "routeFamilyRefs": {"type": "array", "items": {"type": "string"}},
            "routeContractDigestRefs": {"type": "array", "items": {"type": "string"}},
            "frontendContractManifestRefs": {"type": "array", "items": {"type": "string"}},
            "frontendContractDigestRefs": {"type": "array", "items": {"type": "string"}},
            "designContractPublicationBundleRefs": {"type": "array", "items": {"type": "string"}},
            "designContractDigestRefs": {"type": "array", "items": {"type": "string"}},
            "designContractLintVerdictRefs": {"type": "array", "items": {"type": "string"}},
            "projectionContractVersionSetRefs": {"type": "array", "items": {"type": "string"}},
            "projectionQueryContractDigestRefs": {"type": "array", "items": {"type": "string"}},
            "mutationCommandContractDigestRefs": {"type": "array", "items": {"type": "string"}},
            "liveUpdateChannelDigestRefs": {"type": "array", "items": {"type": "string"}},
            "clientCachePolicyDigestRefs": {"type": "array", "items": {"type": "string"}},
            "commandSettlementSchemaSetRef": {"type": "string"},
            "transitionEnvelopeSchemaSetRef": {"type": "string"},
            "recoveryDispositionRefs": {"type": "array", "items": {"type": "string"}},
            "requiredContinuityControlRefs": {"type": "array", "items": {"type": "string"}},
            "continuityEvidenceContractRefs": {"type": "array", "items": {"type": "string"}},
            "writableRouteContractCoverageRefs": {"type": "array", "items": {"type": "string"}},
            "continuityContractCoverageRefs": {"type": "array", "items": {"type": "string"}},
            "embeddedSurfaceContractCoverageRefs": {"type": "array", "items": {"type": "string"}},
            "matrixState": {"enum": ["exact", "stale", "blocked"]},
            "matrixHash": {"type": "string"},
            "generatedAt": {"type": "string"},
        },
    }


def build_policy_doc(environment_policy: dict[str, Any]) -> str:
    ring_rows = []
    for row in environment_policy["ringPolicies"]:
        ring_rows.append(
            "| {ring} | {purpose} | {gates} | {continuity} | {recovery} | {rollback} |".format(
                ring=row["ringCode"],
                purpose=row["purpose"],
                gates=", ".join(row["requiredGateRefs"]),
                continuity=len(row["requiredContinuityCoverageRefs"]),
                recovery=len(row["requiredRecoveryCoverageRefs"]),
                rollback=row["rollbackMode"],
            )
        )
    return dedent(
        f"""
        # 58 Verification Ladder And Environment Ring Policy

        Seq `058` publishes the Phase 0 verification ladder as one exact candidate-bound contract rather than a loose collection of preview checks, route smoke tests, resilience rehearsals, and live-wave folklore.

        ## Summary

        - Generated at: `{environment_policy["generated_at"]}`
        - Rings: `{environment_policy["summary"]["ring_count"]}`
        - Promotion intents: `{environment_policy["summary"]["promotion_intent_count"]}`
        - Baseline fingerprints: `{environment_policy["summary"]["baseline_fingerprint_count"]}`
        - Wave fences: `{environment_policy["summary"]["wave_control_fence_count"]}`
        - Simulator evidence groups: `{environment_policy["summary"]["simulator_requirement_count"]}`

        ## Ring Table

        | Ring | Purpose | Gate refs | Continuity rows | Synthetic recovery rows | Rollback mode |
        | --- | --- | --- | ---: | ---: | --- |
        {"\n".join(ring_rows)}

        ## Governing Law

        1. Every ring advancement carries one live `PromotionIntentEnvelope` plus one aligned `EnvironmentBaselineFingerprint`.
        2. Every gate consumes one exact `VerificationScenario` plus one exact `ReleaseContractVerificationMatrix`.
        3. Standards watch drift, config simulation drift, freeze drift, parity drift, or recovery drift force restart or halt semantics.
        4. Simulator-backed adapter families remain first-class evidence in every Phase 0 ring.
        5. Continuity-sensitive workflows and synthetic recovery rows are gate-critical, not advisory.

        ## Required Gap Closures

        - `EnvironmentBaselineFingerprint` closes the “rings are assumed equivalent” gap.
        - `ReleaseContractVerificationMatrix` closes the “release proof assembled from local subsets” gap.
        - `PromotionIntentEnvelope` plus `WaveControlFence` close the “pause / resume / rollback is folklore” gap.
        - `ContinuityContractCoverageRecord` plus `SyntheticRecoveryCoverageRecord` close the “continuity and recovery are afterthoughts” gap.

        ## Source Order

        {chr(10).join(f"- `{item}`" for item in SOURCE_PRECEDENCE)}
        """
    ).strip()


def build_matrix_doc(matrix_pack: dict[str, Any]) -> str:
    matrix_rows = []
    for row in matrix_pack["releaseContractVerificationMatrices"]:
        matrix_rows.append(
            "| {release} | {state} | {routes} | {manifests} | {continuity} | {hash_value} |".format(
                release=row["releaseRef"],
                state=row["matrixState"],
                routes=len(row["routeFamilyRefs"]),
                manifests=len(row["frontendContractManifestRefs"]),
                continuity=len(row["requiredContinuityControlRefs"]),
                hash_value=row["matrixHash"],
            )
        )
    return dedent(
        f"""
        # 58 Release Contract Verification Matrix Strategy

        `ReleaseContractVerificationMatrix` is the machine-readable cross-layer tuple for one release candidate. It freezes route contracts, frontend manifests, projection contracts, mutation contracts, cache policy, settlement schemas, recovery dispositions, and continuity proof into one exact artifact set.

        ## Summary

        - Matrices: `{matrix_pack["summary"]["matrix_count"]}`
        - Writable route coverage rows: `{matrix_pack["summary"]["writable_route_coverage_count"]}`
        - Continuity coverage rows: `{matrix_pack["summary"]["continuity_coverage_count"]}`
        - Embedded coverage rows: `{matrix_pack["summary"]["embedded_surface_coverage_count"]}`
        - Migration verification rows: `{matrix_pack["summary"]["migration_verification_count"]}`

        ## Matrix Inventory

        | Release | Matrix state | Route families | Frontend manifests | Continuity controls | Matrix hash |
        | --- | --- | ---: | ---: | ---: | --- |
        {"\n".join(matrix_rows)}

        ## Enforcement

        - A candidate cannot pass if the matrix is incomplete or tuple-mismatched.
        - Writable route coverage must prove route-intent, command-settlement, transition-envelope, cache-policy, and recovery-disposition alignment for the same matrix.
        - Embedded or channel-specific surfaces cannot pass on separate bridge or channel tuples.
        - Migration and backfill proof must stay bound to the same matrix and watch tuple as live-wave evidence.
        """
    ).strip()


def build_fence_doc(environment_policy: dict[str, Any], scenario_pack: dict[str, Any]) -> str:
    scenario_rows = []
    for row in scenario_pack["verificationScenarios"]:
        scenario_rows.append(
            "| {ring} | {scenario} | {state} | {drift} | {controls} | {synthetic} |".format(
                ring=row["ringCode"],
                scenario=row["verificationScenarioId"],
                state=row["scenarioState"],
                drift=row["driftState"],
                controls=len(row["requiredContinuityControlRefs"]),
                synthetic=len(row["requiredSyntheticRecoveryCoverageRefs"]),
            )
        )
    return dedent(
        f"""
        # 58 Promotion Intent And Wave Fence Policy

        Promotion, pause, resume, and rollback are explicit control-plane actions, not operator folklore. Seq `058` binds those actions to one `PromotionIntentEnvelope`, one `WaveEligibilitySnapshot`, one `WaveControlFence`, and one exact watch tuple.

        ## Scenario Inventory

        | Ring | Scenario | State | Drift state | Continuity controls | Synthetic recovery refs |
        | --- | --- | --- | --- | ---: | ---: |
        {"\n".join(scenario_rows)}

        ## Wave-Control Rules

        - Canary, widen, halt, rollback, and resume are legal only while the declared `WaveControlFence` and watch tuple still match the pinned matrix hash.
        - `haltOnDrift` and `restartOnDrift` remain mandatory in every ring.
        - Production wave posture is understandable without color alone because the cockpit renders text labels for canary, widen, halt, rollback, and resume posture.

        ## Assumptions

        {chr(10).join(f"- `{item['assumptionId']}`: {item['summary']}" for item in environment_policy["assumptions"])}
        """
    ).strip()


def build_cockpit_html() -> str:
    return dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Verification Ladder Cockpit</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #f6f8fb;
                --rail: #eef2f7;
                --panel: #ffffff;
                --inset: #f3f5fa;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #667085;
                --border-subtle: #e2e8f0;
                --border-default: #cbd5e1;
                --primary: #3559e6;
                --gate: #0ea5a4;
                --verification: #7c3aed;
                --wave: #0f9d58;
                --warning: #c98900;
                --blocked: #c24141;
                --radius-lg: 22px;
                --radius-md: 16px;
                --radius-sm: 12px;
                --shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
              }

              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: linear-gradient(180deg, #fbfcfe 0%, var(--canvas) 100%);
                color: var(--text-default);
              }

              body[data-reduced-motion="true"] * {
                animation-duration: 0ms !important;
                scroll-behavior: auto !important;
                transition-duration: 0ms !important;
              }

              button,
              select {
                font: inherit;
              }

              .app-shell {
                max-width: 1500px;
                margin: 0 auto;
                padding: 20px;
              }

              .masthead {
                position: sticky;
                top: 0;
                z-index: 20;
                min-height: 72px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                padding: 14px 20px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(226, 232, 240, 0.95);
                border-radius: 24px;
                box-shadow: var(--shadow);
              }

              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
                min-width: 0;
              }

              .monogram {
                width: 38px;
                height: 38px;
                border-radius: 14px;
                background: linear-gradient(135deg, rgba(53, 89, 230, 0.15), rgba(124, 58, 237, 0.12));
                border: 1px solid rgba(53, 89, 230, 0.18);
                display: grid;
                place-items: center;
              }

              .brand h1 {
                margin: 0;
                font-size: 1.04rem;
                color: var(--text-strong);
                letter-spacing: 0.01em;
              }

              .brand p {
                margin: 2px 0 0;
                color: var(--text-muted);
                font-size: 0.86rem;
              }

              .metrics {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 140px));
                gap: 12px;
              }

              .metric {
                background: var(--inset);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                padding: 10px 12px;
              }

              .metric span {
                display: block;
                font-size: 0.76rem;
                color: var(--text-muted);
              }

              .metric strong {
                display: block;
                margin-top: 6px;
                font-size: 1.16rem;
                color: var(--text-strong);
              }

              .layout {
                display: grid;
                grid-template-columns: 300px minmax(0, 1fr) 396px;
                gap: 20px;
                margin-top: 20px;
              }

              .rail,
              .inspector,
              .panel,
              .cards-panel {
                background: var(--panel);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow);
              }

              .rail {
                padding: 18px;
                position: sticky;
                top: 104px;
                align-self: start;
                background: linear-gradient(180deg, #f9fbfe 0%, var(--rail) 100%);
              }

              .rail h2,
              .panel h2,
              .cards-panel h2,
              .inspector h2 {
                margin: 0 0 12px;
                font-size: 0.92rem;
                color: var(--text-strong);
              }

              .filter-grid {
                display: grid;
                gap: 12px;
              }

              .field {
                display: grid;
                gap: 6px;
              }

              .field label {
                font-size: 0.76rem;
                color: var(--text-muted);
              }

              .field select {
                min-height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border-default);
                background: #fff;
                padding: 0 12px;
                color: var(--text-default);
              }

              .scenario-list {
                display: grid;
                gap: 10px;
                margin-top: 18px;
              }

              .scenario-list button,
              .scenario-card,
              .ring-node,
              .gate-chip,
              .matrix-row-button {
                transition:
                  transform 180ms ease,
                  border-color 180ms ease,
                  box-shadow 180ms ease,
                  background 180ms ease;
              }

              .scenario-list button {
                text-align: left;
                background: rgba(255, 255, 255, 0.84);
                border: 1px solid var(--border-default);
                border-radius: 16px;
                padding: 12px 14px;
                cursor: pointer;
              }

              .scenario-list button[data-selected="true"],
              .scenario-card[data-selected="true"],
              .ring-node[data-active="true"],
              .gate-chip[data-active="true"],
              .matrix-row-button[data-selected="true"] {
                border-color: rgba(53, 89, 230, 0.55);
                box-shadow: 0 0 0 3px rgba(53, 89, 230, 0.12);
                background: rgba(53, 89, 230, 0.08);
              }

              .scenario-list button:hover,
              .scenario-card:hover,
              .matrix-row-button:hover {
                transform: translateY(-1px);
              }

              .scenario-list strong,
              .scenario-card strong {
                display: block;
                color: var(--text-strong);
              }

              .scenario-list span,
              .scenario-card span {
                display: block;
                margin-top: 4px;
                font-size: 0.82rem;
                color: var(--text-muted);
              }

              .center {
                display: grid;
                gap: 20px;
                min-height: 620px;
              }

              .panel {
                padding: 18px;
              }

              .diagram-grid {
                display: grid;
                gap: 14px;
              }

              .ring-diagram {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 10px;
              }

              .ring-node {
                border: 1px solid var(--border-default);
                border-radius: 18px;
                background: var(--inset);
                padding: 14px;
                cursor: pointer;
              }

              .ring-node .code,
              .gate-chip .code,
              .mono {
                font-family: "SFMono-Regular", ui-monospace, monospace;
              }

              .ring-node .status,
              .gate-chip .status,
              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                border-radius: 999px;
                font-size: 0.72rem;
                border: 1px solid var(--border-default);
                background: #fff;
              }

              .gate-strip {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 10px;
              }

              .gate-chip {
                border: 1px solid var(--border-default);
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(14, 165, 164, 0.07), rgba(124, 58, 237, 0.05));
                padding: 12px;
                cursor: pointer;
              }

              .parity-table-wrapper {
                overflow: auto;
                border: 1px solid var(--border-subtle);
                border-radius: 16px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              th,
              td {
                padding: 11px 12px;
                border-bottom: 1px solid var(--border-subtle);
                text-align: left;
                font-size: 0.84rem;
                vertical-align: top;
              }

              th {
                background: rgba(243, 245, 250, 0.9);
                color: var(--text-muted);
                font-weight: 600;
              }

              .cards-panel {
                padding: 18px;
              }

              .scenario-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 14px;
              }

              .scenario-card {
                min-height: 160px;
                border: 1px solid var(--border-default);
                border-radius: 20px;
                padding: 14px;
                background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 245, 250, 0.88));
                cursor: pointer;
              }

              .watch-fence-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 10px;
              }

              .watch-fence-card {
                border: 1px solid var(--border-default);
                border-radius: 16px;
                padding: 12px;
                background: var(--inset);
              }

              .watch-fence-card strong {
                display: block;
                font-size: 0.82rem;
                color: var(--text-strong);
              }

              .watch-fence-card span {
                display: block;
                margin-top: 6px;
                color: var(--text-muted);
                font-size: 0.8rem;
              }

              .lower-grid {
                display: grid;
                gap: 20px;
              }

              .matrix-row-button {
                display: block;
                width: 100%;
                text-align: inherit;
                border: 1px solid transparent;
                border-radius: 12px;
                background: transparent;
                padding: 0;
                cursor: pointer;
              }

              .inspector {
                padding: 20px;
                position: sticky;
                top: 104px;
                align-self: start;
              }

              .inspector-block {
                display: grid;
                gap: 8px;
                padding-bottom: 14px;
                margin-bottom: 14px;
                border-bottom: 1px solid var(--border-subtle);
              }

              .inspector dt {
                color: var(--text-muted);
                font-size: 0.76rem;
              }

              .inspector dd {
                margin: 0;
                color: var(--text-default);
                font-size: 0.88rem;
              }

              .defect-strip {
                display: grid;
                gap: 10px;
              }

              .defect-card {
                border: 1px solid rgba(194, 65, 65, 0.24);
                border-radius: 16px;
                background: rgba(194, 65, 65, 0.06);
                padding: 12px 14px;
              }

              .legend {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }

              .tone-aligned {
                border-color: rgba(15, 157, 88, 0.28);
                color: var(--wave);
              }

              .tone-restart {
                border-color: rgba(201, 137, 0, 0.28);
                color: var(--warning);
              }

              .tone-halt,
              .tone-rollback,
              .tone-blocked {
                border-color: rgba(194, 65, 65, 0.28);
                color: var(--blocked);
              }

              @media (max-width: 1180px) {
                .layout {
                  grid-template-columns: 1fr;
                }

                .rail,
                .inspector {
                  position: static;
                }
              }

              @media (max-width: 820px) {
                .metrics {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }

                .ring-diagram,
                .gate-strip,
                .watch-fence-grid {
                  grid-template-columns: 1fr;
                }

                .masthead {
                  flex-direction: column;
                  align-items: stretch;
                }
              }

              @media (prefers-reduced-motion: reduce) {
                body {
                  scroll-behavior: auto;
                }
              }
            </style>
          </head>
          <body>
            <div class="app-shell">
              <header class="masthead" data-testid="cockpit-masthead">
                <div class="brand">
                  <div class="monogram" aria-hidden="true">
                    <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
                      <path d="M9 9h7l4 16 4-16h7L23 31h-6L9 9Z" fill="#3559E6"></path>
                      <path d="M24 9h7l-8 22h-6l7-22Z" fill="#7C3AED"></path>
                    </svg>
                  </div>
                  <div>
                    <h1>Vecells Verification Ladder</h1>
                    <p>Exact tuple governance for promotion, pause, rollback, and recovery.</p>
                  </div>
                </div>
                <div class="metrics">
                  <div class="metric"><span>Verification scenarios</span><strong data-testid="metric-scenarios">0</strong></div>
                  <div class="metric"><span>Rings in view</span><strong data-testid="metric-rings">0</strong></div>
                  <div class="metric"><span>Gate exact / blocked</span><strong data-testid="metric-gates">0 / 0</strong></div>
                  <div class="metric"><span>Synthetic recovery rows</span><strong data-testid="metric-recovery">0</strong></div>
                </div>
              </header>

              <main class="layout">
                <aside class="rail" data-testid="filter-rail">
                  <h2>Filters</h2>
                  <div class="filter-grid">
                    <div class="field">
                      <label for="ring-filter">Ring</label>
                      <select id="ring-filter" data-testid="ring-filter"></select>
                    </div>
                    <div class="field">
                      <label for="gate-filter">Gate</label>
                      <select id="gate-filter" data-testid="gate-filter"></select>
                    </div>
                    <div class="field">
                      <label for="scenario-state-filter">Scenario state</label>
                      <select id="scenario-state-filter" data-testid="scenario-state-filter"></select>
                    </div>
                    <div class="field">
                      <label for="drift-filter">Drift state</label>
                      <select id="drift-filter" data-testid="drift-filter"></select>
                    </div>
                  </div>

                  <div class="scenario-list" id="scenario-list" data-testid="scenario-list"></div>
                </aside>

                <section class="center">
                  <section class="panel">
                    <h2>Ring Progression Diagram</h2>
                    <div class="diagram-grid">
                      <div class="ring-diagram" id="ring-diagram" data-testid="ring-diagram"></div>
                      <div class="parity-table-wrapper">
                        <table data-testid="ring-parity-table">
                          <thead>
                            <tr>
                              <th>Ring</th>
                              <th>State</th>
                              <th>Promotion blockers</th>
                            </tr>
                          </thead>
                          <tbody id="ring-parity-body"></tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section class="panel">
                    <h2>Gate Ladder Strip</h2>
                    <div class="diagram-grid">
                      <div class="gate-strip" id="gate-strip" data-testid="gate-strip"></div>
                      <div class="parity-table-wrapper">
                        <table data-testid="gate-parity-table">
                          <thead>
                            <tr>
                              <th>Gate</th>
                              <th>Verdict</th>
                              <th>Drift action</th>
                            </tr>
                          </thead>
                          <tbody id="gate-parity-body"></tbody>
                        </table>
                      </div>
                    </div>
                  </section>

                  <section class="cards-panel">
                    <h2>Curated Verification Scenarios</h2>
                    <div class="scenario-cards" id="scenario-cards" data-testid="scenario-cards"></div>
                  </section>

                  <section class="panel">
                    <h2>Wave Fence Panel</h2>
                    <div class="watch-fence-grid" id="watch-fence-grid" data-testid="watch-fence-panel"></div>
                    <div class="legend" id="legend"></div>
                  </section>

                  <section class="lower-grid">
                    <section class="panel">
                      <h2>Ring Gate Matrix</h2>
                      <div class="parity-table-wrapper">
                        <table data-testid="ring-gate-matrix">
                          <thead>
                            <tr>
                              <th>Gate</th>
                              <th>Verdict</th>
                              <th>Operational evidence</th>
                            </tr>
                          </thead>
                          <tbody id="ring-gate-body"></tbody>
                        </table>
                      </div>
                    </section>

                    <section class="panel">
                      <h2>Continuity And Recovery Coverage</h2>
                      <div class="parity-table-wrapper">
                        <table data-testid="coverage-table">
                          <thead>
                            <tr>
                              <th>Journey</th>
                              <th>Posture</th>
                              <th>Coverage</th>
                              <th>Evidence</th>
                            </tr>
                          </thead>
                          <tbody id="coverage-body"></tbody>
                        </table>
                      </div>
                    </section>

                    <section class="panel">
                      <h2>Defect Strip</h2>
                      <div class="defect-strip" id="defect-strip" data-testid="defect-strip"></div>
                    </section>
                  </section>
                </section>

                <aside class="inspector" data-testid="inspector">
                  <h2>Scenario Inspector</h2>
                  <div id="inspector-content"></div>
                </aside>
              </main>
            </div>

            <script type="module">
              const POLICY_PATH = "/data/analysis/environment_ring_policy.json";
              const SCENARIO_PATH = "/data/analysis/verification_scenarios.json";
              const MATRIX_PATH = "/data/analysis/release_contract_verification_matrix.json";
              const RING_GATE_PATH = "/data/analysis/ring_gate_matrix.csv";
              const RECOVERY_PATH = "/data/analysis/synthetic_recovery_coverage_matrix.csv";

              const state = {
                ringFilter: "all",
                gateFilter: "all",
                scenarioStateFilter: "all",
                driftFilter: "all",
                selectedScenarioId: null,
                selectedGateId: null,
                data: null,
              };

              const elements = {
                ringFilter: document.querySelector("[data-testid='ring-filter']"),
                gateFilter: document.querySelector("[data-testid='gate-filter']"),
                scenarioStateFilter: document.querySelector("[data-testid='scenario-state-filter']"),
                driftFilter: document.querySelector("[data-testid='drift-filter']"),
                scenarioList: document.querySelector("[data-testid='scenario-list']"),
                scenarioCards: document.querySelector("[data-testid='scenario-cards']"),
                ringDiagram: document.querySelector("[data-testid='ring-diagram']"),
                ringParityBody: document.querySelector("#ring-parity-body"),
                gateStrip: document.querySelector("[data-testid='gate-strip']"),
                gateParityBody: document.querySelector("#gate-parity-body"),
                watchFenceGrid: document.querySelector("[data-testid='watch-fence-panel']"),
                legend: document.querySelector("#legend"),
                ringGateBody: document.querySelector("#ring-gate-body"),
                coverageBody: document.querySelector("#coverage-body"),
                defectStrip: document.querySelector("[data-testid='defect-strip']"),
                inspectorContent: document.querySelector("#inspector-content"),
                metricScenarios: document.querySelector("[data-testid='metric-scenarios']"),
                metricRings: document.querySelector("[data-testid='metric-rings']"),
                metricGates: document.querySelector("[data-testid='metric-gates']"),
                metricRecovery: document.querySelector("[data-testid='metric-recovery']"),
              };

              function escapeHtml(value) {
                return String(value)
                  .replaceAll("&", "&amp;")
                  .replaceAll("<", "&lt;")
                  .replaceAll(">", "&gt;")
                  .replaceAll('"', "&quot;");
              }

              function parseCsv(text) {
                const rows = [];
                let current = "";
                let row = [];
                let inQuotes = false;
                for (let index = 0; index < text.length; index += 1) {
                  const character = text[index];
                  if (character === '"') {
                    const next = text[index + 1];
                    if (inQuotes && next === '"') {
                      current += '"';
                      index += 1;
                    } else {
                      inQuotes = !inQuotes;
                    }
                  } else if (character === "," && !inQuotes) {
                    row.push(current);
                    current = "";
                  } else if ((character === "\\n" || character === "\\r") && !inQuotes) {
                    if (character === "\\r" && text[index + 1] === "\\n") {
                      index += 1;
                    }
                    row.push(current);
                    current = "";
                    if (row.some((cell) => cell.length > 0)) {
                      rows.push(row);
                    }
                    row = [];
                  } else {
                    current += character;
                  }
                }
                if (current.length > 0 || row.length > 0) {
                  row.push(current);
                  rows.push(row);
                }
                const [header, ...values] = rows;
                return values.map((valueRow) =>
                  Object.fromEntries(header.map((column, index) => [column, valueRow[index] ?? ""])),
                );
              }

              function toneClass(value) {
                if (["aligned", "exact", "eligible", "ready", "armed", "continue", "carried_forward"].includes(value)) {
                  return "tone-aligned";
                }
                if (["restart_required", "restart_only", "rerun_required", "constrained"].includes(value)) {
                  return "tone-restart";
                }
                if (["rollback_required", "rollback", "withdrawn"].includes(value)) {
                  return "tone-rollback";
                }
                if (["halted", "blocked", "conflict"].includes(value)) {
                  return "tone-halt";
                }
                return "";
              }

              function distinct(values) {
                return [...new Set(values)];
              }

              function scenarioLookup() {
                return new Map(state.data.scenarios.verificationScenarios.map((row) => [row.verificationScenarioId, row]));
              }

              function filteredScenarios() {
                return state.data.scenarios.verificationScenarios.filter((scenario) => {
                  if (state.ringFilter !== "all" && scenario.ringCode !== state.ringFilter) {
                    return false;
                  }
                  if (state.gateFilter !== "all" && !scenario.requiredGateSet.includes(state.gateFilter)) {
                    return false;
                  }
                  if (state.scenarioStateFilter !== "all" && scenario.scenarioState !== state.scenarioStateFilter) {
                    return false;
                  }
                  if (state.driftFilter !== "all" && scenario.driftState !== state.driftFilter) {
                    return false;
                  }
                  return true;
                });
              }

              function selectedScenario(filtered = filteredScenarios()) {
                if (!filtered.length) {
                  return null;
                }
                const current = filtered.find((scenario) => scenario.verificationScenarioId === state.selectedScenarioId);
                if (current) {
                  return current;
                }
                state.selectedScenarioId = filtered[0].verificationScenarioId;
                return filtered[0];
              }

              function selectedGateRows(scenario) {
                return state.data.ringGateRows.filter(
                  (row) => row.verification_scenario_id === scenario.verificationScenarioId,
                );
              }

              function selectedRecoveryRows(scenario) {
                return state.data.syntheticRecoveryRows.filter(
                  (row) => row.verification_scenario_ref === scenario.verificationScenarioId,
                );
              }

              function selectedMatrix(scenario) {
                return state.data.matrices.releaseContractVerificationMatrices.find(
                  (row) => row.releaseContractVerificationMatrixId === scenario.releaseContractVerificationMatrixRef,
                );
              }

              function defectRowsForScenario(scenario) {
                return state.data.policy.defects.filter((row) => row.releaseRef === scenario.releaseRef);
              }

              function updateMetrics(filtered, gateRows, recoveryRows) {
                const exactCount = gateRows.filter((row) => row.gate_binding_state === "exact").length;
                const blockedCount = gateRows.filter((row) =>
                  ["blocked", "restart_required", "rollback_required"].includes(row.gate_binding_state),
                ).length;
                elements.metricScenarios.textContent = String(filtered.length);
                elements.metricRings.textContent = String(distinct(filtered.map((row) => row.ringCode)).length);
                elements.metricGates.textContent = `${exactCount} / ${blockedCount}`;
                elements.metricRecovery.textContent = String(recoveryRows.length);
              }

              function renderFilters() {
                const rings = ["all", ...state.data.policy.ringPolicies.map((row) => row.ringCode)];
                const gates = ["all", ...state.data.policy.gateDefinitions.map((row) => row.gateId)];
                const scenarioStates = ["all", ...distinct(state.data.scenarios.verificationScenarios.map((row) => row.scenarioState))];
                const driftStates = ["all", ...distinct(state.data.scenarios.verificationScenarios.map((row) => row.driftState))];

                function fillSelect(element, options, value) {
                  element.innerHTML = options
                    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
                    .join("");
                  element.value = value;
                }

                fillSelect(elements.ringFilter, rings, state.ringFilter);
                fillSelect(elements.gateFilter, gates, state.gateFilter);
                fillSelect(elements.scenarioStateFilter, scenarioStates, state.scenarioStateFilter);
                fillSelect(elements.driftFilter, driftStates, state.driftFilter);
              }

              function renderScenarioRail(filtered, selected) {
                elements.scenarioList.innerHTML = filtered
                  .map(
                    (scenario) => `
                      <button
                        type="button"
                        data-testid="scenario-list-${escapeHtml(scenario.verificationScenarioId)}"
                        data-selected="${scenario.verificationScenarioId === selected.verificationScenarioId}"
                        data-scenario-id="${escapeHtml(scenario.verificationScenarioId)}"
                      >
                        <strong>${escapeHtml(scenario.ringCode)}</strong>
                        <span>${escapeHtml(scenario.scenarioState)} | ${escapeHtml(scenario.driftState)}</span>
                        <span class="mono">${escapeHtml(scenario.releaseContractMatrixHash)}</span>
                      </button>
                    `,
                  )
                  .join("");
              }

              function renderScenarioCards(filtered, selected) {
                elements.scenarioCards.innerHTML = filtered
                  .map(
                    (scenario) => `
                      <article
                        class="scenario-card"
                        tabindex="0"
                        role="button"
                        aria-label="Select ${escapeHtml(scenario.verificationScenarioId)}"
                        data-testid="scenario-card-${escapeHtml(scenario.verificationScenarioId)}"
                        data-selected="${scenario.verificationScenarioId === selected.verificationScenarioId}"
                        data-scenario-id="${escapeHtml(scenario.verificationScenarioId)}"
                      >
                        <div class="badge ${toneClass(scenario.driftState)}">${escapeHtml(scenario.driftState)}</div>
                        <strong>${escapeHtml(scenario.verificationScenarioId)}</strong>
                        <span>${escapeHtml(scenario.releaseRef)}</span>
                        <span>${escapeHtml(scenario.scenarioState)}</span>
                        <span>${scenario.requiredContinuityControlRefs.length} continuity controls</span>
                        <span>${scenario.requiredSyntheticRecoveryCoverageRefs.length} synthetic recovery refs</span>
                      </article>
                    `,
                  )
                  .join("");
              }

              function renderRingDiagram(selected) {
                elements.ringDiagram.innerHTML = state.data.policy.ringPolicies
                  .map((ringPolicy) => {
                    const scenario = state.data.scenarios.verificationScenarios.find(
                      (row) => row.ringCode === ringPolicy.ringCode,
                    );
                    return `
                      <article
                        class="ring-node"
                        tabindex="0"
                        role="button"
                        aria-label="Select ${escapeHtml(ringPolicy.ringCode)}"
                        data-testid="ring-node-${escapeHtml(ringPolicy.ringCode)}"
                        data-ring-code="${escapeHtml(ringPolicy.ringCode)}"
                        data-active="${ringPolicy.ringCode === selected.ringCode}"
                      >
                        <div class="code">${escapeHtml(ringPolicy.ringCode)}</div>
                        <strong>${escapeHtml(ringPolicy.purpose)}</strong>
                        <div class="status ${toneClass(scenario.driftState)}">${escapeHtml(scenario.driftState)}</div>
                      </article>
                    `;
                  })
                  .join("");

                elements.ringParityBody.innerHTML = state.data.policy.ringPolicies
                  .map((ringPolicy) => {
                    const scenario = state.data.scenarios.verificationScenarios.find(
                      (row) => row.ringCode === ringPolicy.ringCode,
                    );
                    const blockers = ringPolicy.promotionBlockers.slice(0, 2).join("; ");
                    return `
                      <tr>
                        <td class="mono">${escapeHtml(ringPolicy.ringCode)}</td>
                        <td><span class="badge ${toneClass(scenario.driftState)}">${escapeHtml(scenario.driftState)}</span></td>
                        <td>${escapeHtml(blockers)}</td>
                      </tr>
                    `;
                  })
                  .join("");
              }

              function renderGateStrip(selected) {
                const gateRows = selectedGateRows(selected);
                elements.gateStrip.innerHTML = gateRows
                  .map(
                    (row) => `
                      <article
                        class="gate-chip"
                        tabindex="0"
                        role="button"
                        aria-label="Focus ${escapeHtml(row.gate_id)}"
                        data-testid="gate-chip-${escapeHtml(row.gate_id)}"
                        data-gate-id="${escapeHtml(row.gate_id)}"
                        data-active="${row.gate_id === state.selectedGateId}"
                      >
                        <div class="code">${escapeHtml(row.gate_id)}</div>
                        <strong>${escapeHtml(row.gate_name)}</strong>
                        <div class="status ${toneClass(row.gate_binding_state)}">${escapeHtml(row.gate_binding_state)}</div>
                      </article>
                    `,
                  )
                  .join("");

                elements.gateParityBody.innerHTML = gateRows
                  .map(
                    (row) => `
                      <tr>
                        <td class="mono">${escapeHtml(row.gate_id)}</td>
                        <td><span class="badge ${toneClass(row.gate_binding_state)}">${escapeHtml(row.gate_binding_state)}</span></td>
                        <td>${escapeHtml(row.drift_action)}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }

              function renderWatchFence(selected) {
                const fence = state.data.policy.waveControlFences.find(
                  (row) => row.waveControlFenceId === selected.waveControlFenceRef,
                );
                const cards = [
                  { label: "Canary", value: fence.canaryPosture },
                  { label: "Widen", value: fence.widenPosture },
                  { label: "Halt", value: fence.haltPosture },
                  { label: "Rollback", value: fence.rollbackPosture },
                  { label: "Resume", value: fence.resumePosture },
                ];
                elements.watchFenceGrid.innerHTML = cards
                  .map(
                    (card) => `
                      <article class="watch-fence-card">
                        <strong>${escapeHtml(card.label)}</strong>
                        <span class="badge ${toneClass(card.value)}">${escapeHtml(card.value)}</span>
                      </article>
                    `,
                  )
                  .join("");

                elements.legend.innerHTML = cards
                  .map(
                    (card) =>
                      `<span class="badge ${toneClass(card.value)}">${escapeHtml(card.label)}: ${escapeHtml(card.value)}</span>`,
                  )
                  .join("");
              }

              function renderMatrix(selected) {
                const gateRows = selectedGateRows(selected);
                elements.ringGateBody.innerHTML = gateRows
                  .map(
                    (row) => `
                      <tr>
                        <td colspan="3">
                          <button
                            type="button"
                            class="matrix-row-button"
                            tabindex="0"
                            data-testid="matrix-row-${escapeHtml(row.gate_id)}"
                            data-gate-id="${escapeHtml(row.gate_id)}"
                            data-selected="${row.gate_id === state.selectedGateId}"
                          >
                            <table aria-hidden="true">
                              <tbody>
                                <tr>
                                  <td class="mono">${escapeHtml(row.gate_id)}</td>
                                  <td><span class="badge ${toneClass(row.gate_binding_state)}">${escapeHtml(row.gate_binding_state)}</span></td>
                                  <td>${escapeHtml(row.required_operational_evidence_refs)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </button>
                        </td>
                      </tr>
                    `,
                  )
                  .join("");
              }

              function renderCoverage(selected) {
                const rows = selectedRecoveryRows(selected);
                elements.coverageBody.innerHTML = rows
                  .map(
                    (row) => `
                      <tr data-testid="coverage-row-${escapeHtml(row.synthetic_recovery_coverage_record_id)}">
                        <td>${escapeHtml(row.journey_code)}</td>
                        <td><span class="badge ${toneClass(row.posture_type)}">${escapeHtml(row.posture_type)}</span></td>
                        <td><span class="badge ${toneClass(row.coverage_state)}">${escapeHtml(row.coverage_state)}</span></td>
                        <td class="mono">${escapeHtml(row.evidence_ref)}</td>
                      </tr>
                    `,
                  )
                  .join("");
              }

              function renderDefects(selected) {
                const rows = defectRowsForScenario(selected);
                elements.defectStrip.innerHTML = rows.length
                  ? rows
                      .map(
                        (row) => `
                          <article class="defect-card" data-testid="defect-card-${escapeHtml(row.defectId)}">
                            <strong>${escapeHtml(row.defectId)}</strong>
                            <div>${escapeHtml(row.summary)}</div>
                            <div>${escapeHtml(row.effect)}</div>
                          </article>
                        `,
                      )
                      .join("")
                  : `<article class="defect-card" data-testid="defect-card-none"><strong>No active tuple defects</strong><div>Selected scenario is currently aligned.</div></article>`;
              }

              function renderInspector(selected) {
                const matrix = selectedMatrix(selected);
                const fence = state.data.policy.waveControlFences.find(
                  (row) => row.waveControlFenceId === selected.waveControlFenceRef,
                );
                const readiness = state.data.policy.operationalReadinessSnapshots.find(
                  (row) => row.operationalReadinessSnapshotId === selected.operationalReadinessSnapshotRef,
                );
                const focusedGate = selectedGateRows(selected).find((row) => row.gate_id === state.selectedGateId);
                elements.inspectorContent.innerHTML = `
                  <section class="inspector-block">
                    <div class="badge ${toneClass(selected.driftState)}">${escapeHtml(selected.driftState)}</div>
                    <strong>${escapeHtml(selected.verificationScenarioId)}</strong>
                    <div class="mono">${escapeHtml(selected.releaseContractMatrixHash)}</div>
                  </section>
                  <dl class="inspector-block">
                    <dt>Release</dt>
                    <dd>${escapeHtml(selected.releaseRef)}</dd>
                    <dt>Compiled policy bundle</dt>
                    <dd class="mono">${escapeHtml(selected.compiledPolicyBundleRef)}</dd>
                    <dt>Baseline fingerprint</dt>
                    <dd class="mono">${escapeHtml(selected.environmentBaselineFingerprintRef)}</dd>
                    <dt>Promotion intent</dt>
                    <dd class="mono">${escapeHtml(selected.promotionIntentEnvelopeRef)}</dd>
                    <dt>Wave control fence</dt>
                    <dd class="mono">${escapeHtml(fence.waveControlFenceId)}</dd>
                  </dl>
                  <dl class="inspector-block">
                    <dt>Matrix state</dt>
                    <dd><span class="badge ${toneClass(matrix.matrixState)}">${escapeHtml(matrix.matrixState)}</span></dd>
                    <dt>Route families</dt>
                    <dd>${matrix.routeFamilyRefs.length}</dd>
                    <dt>Continuity controls</dt>
                    <dd>${selected.requiredContinuityControlRefs.join(", ")}</dd>
                    <dt>Synthetic recovery refs</dt>
                    <dd>${selected.requiredSyntheticRecoveryCoverageRefs.length}</dd>
                  </dl>
                  <dl class="inspector-block">
                    <dt>Focused gate</dt>
                    <dd>${focusedGate ? `${focusedGate.gate_id} | ${focusedGate.gate_binding_state}` : "none"}</dd>
                    <dt>Readiness state</dt>
                    <dd><span class="badge ${toneClass(readiness.readinessState)}">${escapeHtml(readiness.readinessState)}</span></dd>
                    <dt>Rollback posture</dt>
                    <dd>${escapeHtml(fence.rollbackPosture)}</dd>
                    <dt>Allowed actions</dt>
                    <dd>${escapeHtml(fence.allowedActionCodes.join(", "))}</dd>
                  </dl>
                `;
              }

              function render() {
                const filtered = filteredScenarios();
                const selected = selectedScenario(filtered);
                if (!selected) {
                  return;
                }
                const gateRows = selectedGateRows(selected);
                const recoveryRows = selectedRecoveryRows(selected);
                if (!state.selectedGateId || !gateRows.some((row) => row.gate_id === state.selectedGateId)) {
                  state.selectedGateId = gateRows[0]?.gate_id ?? null;
                }
                updateMetrics(filtered, gateRows, recoveryRows);
                renderScenarioRail(filtered, selected);
                renderScenarioCards(filtered, selected);
                renderRingDiagram(selected);
                renderGateStrip(selected);
                renderWatchFence(selected);
                renderMatrix(selected);
                renderCoverage(selected);
                renderDefects(selected);
                renderInspector(selected);
              }

              function moveScenarioSelection(delta) {
                const filtered = filteredScenarios();
                const currentIndex = filtered.findIndex((row) => row.verificationScenarioId === state.selectedScenarioId);
                const nextIndex = Math.min(Math.max(currentIndex + delta, 0), filtered.length - 1);
                if (filtered[nextIndex]) {
                  state.selectedScenarioId = filtered[nextIndex].verificationScenarioId;
                  render();
                }
              }

              function moveGateSelection(delta) {
                const selected = selectedScenario();
                const rows = selected ? selectedGateRows(selected) : [];
                const currentIndex = rows.findIndex((row) => row.gate_id === state.selectedGateId);
                const nextIndex = Math.min(Math.max(currentIndex + delta, 0), rows.length - 1);
                if (rows[nextIndex]) {
                  state.selectedGateId = rows[nextIndex].gate_id;
                  render();
                }
              }

              function bindEvents() {
                elements.ringFilter.addEventListener("change", (event) => {
                  state.ringFilter = event.target.value;
                  render();
                });
                elements.gateFilter.addEventListener("change", (event) => {
                  state.gateFilter = event.target.value;
                  render();
                });
                elements.scenarioStateFilter.addEventListener("change", (event) => {
                  state.scenarioStateFilter = event.target.value;
                  render();
                });
                elements.driftFilter.addEventListener("change", (event) => {
                  state.driftFilter = event.target.value;
                  render();
                });

                document.addEventListener("click", (event) => {
                  const scenarioTarget = event.target.closest("[data-scenario-id]");
                  if (scenarioTarget) {
                    state.selectedScenarioId = scenarioTarget.dataset.scenarioId;
                    render();
                    return;
                  }
                  const ringTarget = event.target.closest("[data-ring-code]");
                  if (ringTarget) {
                    const scenario = state.data.scenarios.verificationScenarios.find(
                      (row) => row.ringCode === ringTarget.dataset.ringCode,
                    );
                    if (scenario) {
                      state.selectedScenarioId = scenario.verificationScenarioId;
                      render();
                    }
                    return;
                  }
                  const gateTarget = event.target.closest("[data-gate-id]");
                  if (gateTarget) {
                    state.selectedGateId = gateTarget.dataset.gateId;
                    render();
                  }
                });

                document.addEventListener("keydown", (event) => {
                  const withinScenario = event.target.closest("[data-scenario-id]");
                  const withinGate = event.target.closest("[data-gate-id]");
                  if (withinScenario && event.key === "ArrowDown") {
                    event.preventDefault();
                    state.selectedScenarioId = withinScenario.dataset.scenarioId;
                    moveScenarioSelection(1);
                  } else if (withinScenario && event.key === "ArrowUp") {
                    event.preventDefault();
                    state.selectedScenarioId = withinScenario.dataset.scenarioId;
                    moveScenarioSelection(-1);
                  } else if (withinGate && event.key === "ArrowDown") {
                    event.preventDefault();
                    state.selectedGateId = withinGate.dataset.gateId;
                    moveGateSelection(1);
                  } else if (withinGate && event.key === "ArrowUp") {
                    event.preventDefault();
                    state.selectedGateId = withinGate.dataset.gateId;
                    moveGateSelection(-1);
                  }
                });
              }

              async function loadData() {
                document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "true"
                  : "false";
                const [policy, scenarios, matrices, ringGateText, recoveryText] = await Promise.all([
                  fetch(POLICY_PATH).then((response) => response.json()),
                  fetch(SCENARIO_PATH).then((response) => response.json()),
                  fetch(MATRIX_PATH).then((response) => response.json()),
                  fetch(RING_GATE_PATH).then((response) => response.text()),
                  fetch(RECOVERY_PATH).then((response) => response.text()),
                ]);
                state.data = {
                  policy,
                  scenarios,
                  matrices,
                  ringGateRows: parseCsv(ringGateText),
                  syntheticRecoveryRows: parseCsv(recoveryText),
                };
                renderFilters();
                bindEvents();
                render();
              }

              loadData().catch((error) => {
                document.body.innerHTML = `<pre>${escapeHtml(error.stack || String(error))}</pre>`;
              });
            </script>
          </body>
        </html>
        """
    ).strip()


def build_package_source_block(recovery_rows: list[dict[str, Any]], matrix_pack: dict[str, Any]) -> str:
    return dedent(
        f"""
        {PACKAGE_EXPORTS_START}
        export const releaseVerificationLadderCatalog = {{
          taskId: "{TASK_ID}",
          visualMode: "{VISUAL_MODE}",
          ringCount: 5,
          verificationScenarioCount: 5,
          verificationMatrixCount: {matrix_pack["summary"]["matrix_count"]},
          gateCount: 5,
          syntheticRecoveryCoverageCount: {len(recovery_rows)},
          schemaArtifactPaths: ["packages/api-contracts/schemas/release-contract-verification-matrix.schema.json"],
        }} as const;

        export const releaseVerificationLadderSchemas = [
          {{
            schemaId: "ReleaseContractVerificationMatrix",
            artifactPath: "packages/api-contracts/schemas/release-contract-verification-matrix.schema.json",
            generatedByTask: "{TASK_ID}",
          }},
        ] as const;
        {PACKAGE_EXPORTS_END}
        """
    ).strip()


def build_package_public_api_test() -> str:
    return (
        dedent(
            """
            import fs from "node:fs";
            import path from "node:path";
            import { fileURLToPath } from "node:url";
            import { describe, expect, it } from "vitest";
            import {
              adapterContractProfileCatalog,
              adapterContractProfileSchemas,
              bootstrapSharedPackage,
              frontendContractManifestCatalog,
              frontendContractManifestSchemas,
              ownedContractFamilies,
              ownedObjectFamilies,
              packageContract,
              releaseVerificationLadderCatalog,
              releaseVerificationLadderSchemas,
              scopedMutationGateCatalog,
              scopedMutationGateSchemas,
            } from "../src/index.ts";
            import { foundationKernelFamilies } from "@vecells/domain-kernel";
            import { publishedEventFamilies } from "@vecells/event-contracts";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..", "..");

            describe("public package surface", () => {
              it("boots through documented public contracts", () => {
                expect(packageContract.packageName).toBe("@vecells/api-contracts");
                expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
                expect(Array.isArray(ownedObjectFamilies)).toBe(true);
                expect(Array.isArray(ownedContractFamilies)).toBe(true);
                expect(Array.isArray(foundationKernelFamilies)).toBe(true);
                expect(Array.isArray(publishedEventFamilies)).toBe(true);
              });

              it("publishes the seq_050 frontend manifest schema surface", () => {
                expect(frontendContractManifestCatalog.taskId).toBe("seq_050");
                expect(frontendContractManifestCatalog.manifestCount).toBe(9);
                expect(frontendContractManifestSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, frontendContractManifestSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });

              it("publishes the seq_056 scoped mutation schema surface", () => {
                expect(scopedMutationGateCatalog.taskId).toBe("seq_056");
                expect(scopedMutationGateCatalog.routeIntentRowCount).toBe(16);
                expect(scopedMutationGateSchemas).toHaveLength(2);

                for (const schema of scopedMutationGateSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the seq_057 adapter contract schema surface", () => {
                expect(adapterContractProfileCatalog.taskId).toBe("seq_057");
                expect(adapterContractProfileCatalog.adapterProfileCount).toBe(20);
                expect(adapterContractProfileCatalog.degradationProfileCount).toBe(20);
                expect(adapterContractProfileSchemas).toHaveLength(2);

                for (const schema of adapterContractProfileSchemas) {
                  const schemaPath = path.join(ROOT, schema.artifactPath);
                  expect(fs.existsSync(schemaPath)).toBe(true);
                }
              });

              it("publishes the seq_058 verification ladder schema surface", () => {
                expect(releaseVerificationLadderCatalog.taskId).toBe("seq_058");
                expect(releaseVerificationLadderCatalog.verificationScenarioCount).toBe(5);
                expect(releaseVerificationLadderCatalog.syntheticRecoveryCoverageCount).toBeGreaterThan(0);
                expect(releaseVerificationLadderSchemas).toHaveLength(1);

                const schemaPath = path.join(ROOT, releaseVerificationLadderSchemas[0].artifactPath);
                expect(fs.existsSync(schemaPath)).toBe(true);
              });
            });
            """
        ).strip()
        + "\n"
    )


def update_api_contract_package(recovery_rows: list[dict[str, Any]], matrix_pack: dict[str, Any]) -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        PACKAGE_EXPORTS_START,
        PACKAGE_EXPORTS_END,
        build_package_source_block(recovery_rows, matrix_pack),
    )
    write_text(PACKAGE_SOURCE_PATH, source)
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())
    package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    exports = package.setdefault("exports", {})
    exports["./schemas/release-contract-verification-matrix.schema.json"] = "./schemas/release-contract-verification-matrix.schema.json"
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, audit ledger, scope/isolation, lifecycle coordinator, scoped mutation gate, "
        "adapter contract, verification ladder, and seed/simulator browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def patch_engineering_builder() -> None:
    text = ENGINEERING_BUILDER_PATH.read_text()
    text = text.replace(
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:scaffold",
        "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:scaffold",
    )
    if "pnpm validate:verification-ladder" not in text:
        text = text.replace(
            "pnpm validate:adapter-contracts && pnpm validate:scaffold",
            "pnpm validate:adapter-contracts && pnpm validate:verification-ladder && pnpm validate:seed-simulators && pnpm validate:scaffold",
        )
    if "build_verification_ladder_and_environment_ring_policy.py" not in text:
        text = text.replace(
            "python3 ./tools/analysis/build_adapter_contract_profiles.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
            "python3 ./tools/analysis/build_adapter_contract_profiles.py && "
            "python3 ./tools/analysis/build_verification_ladder_and_environment_ring_policy.py && "
            "python3 ./tools/analysis/build_seed_data_and_simulator_strategy.py && "
            "python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
        )
    if '"validate:seed-simulators"' not in text:
        text = text.replace(
            '"validate:adapter-contracts": "python3 ./tools/analysis/validate_adapter_contract_profiles.py",\n'
            '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
            '"validate:adapter-contracts": "python3 ./tools/analysis/validate_adapter_contract_profiles.py",\n'
            '    "validate:verification-ladder": "python3 ./tools/analysis/validate_verification_ladder.py",\n'
            '    "validate:seed-simulators": "python3 ./tools/analysis/validate_seed_and_simulator_strategy.py",\n'
            '    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",',
        )
    write_text(ENGINEERING_BUILDER_PATH, text)


def build_validator() -> str:
    return (
        dedent(
            """
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
            """
        ).strip()
        + "\n"
    )


def build_spec() -> str:
    return (
        dedent(
            """
            import fs from "node:fs";
            import http from "node:http";
            import path from "node:path";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..");
            const HTML_PATH = path.join(ROOT, "docs", "architecture", "58_verification_cockpit.html");
            const POLICY_PATH = path.join(ROOT, "data", "analysis", "environment_ring_policy.json");
            const SCENARIO_PATH = path.join(ROOT, "data", "analysis", "verification_scenarios.json");

            const POLICY_PAYLOAD = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));
            const SCENARIO_PAYLOAD = JSON.parse(fs.readFileSync(SCENARIO_PATH, "utf8"));

            export const verificationCockpitCoverage = [
              "ring filtering",
              "gate filtering",
              "scenario selection",
              "diagram and matrix and inspector synchronization",
              "keyboard navigation",
              "responsive layout",
              "reduced motion",
              "accessibility smoke checks",
              "table parity",
            ];

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
                    rawUrl === "/" ? "/docs/architecture/58_verification_cockpit.html" : rawUrl.split("?")[0];
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
                    : filePath.endsWith(".json")
                      ? "application/json; charset=utf-8"
                      : filePath.endsWith(".csv")
                        ? "text/csv; charset=utf-8"
                        : "text/plain; charset=utf-8";
                  res.writeHead(200, { "Content-Type": contentType });
                  res.end(body);
                });
                server.once("error", reject);
                server.listen(4358, "127.0.0.1", () => resolve(server));
              });
            }

            async function run() {
              assertCondition(fs.existsSync(HTML_PATH), `Missing cockpit HTML: ${HTML_PATH}`);
              const { chromium } = await importPlaywright();
              const server = await startStaticServer();
              const browser = await chromium.launch({ headless: true });
              const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
              const url =
                process.env.VERIFICATION_COCKPIT_URL ??
                "http://127.0.0.1:4358/docs/architecture/58_verification_cockpit.html";

              try {
                await page.goto(url, { waitUntil: "networkidle" });
                await page.locator("[data-testid='ring-diagram']").waitFor();
                await page.locator("[data-testid='gate-strip']").waitFor();
                await page.locator("[data-testid='inspector']").waitFor();

                const initialCards = await page.locator("[data-testid^='scenario-card-']").count();
                assertCondition(
                  initialCards === SCENARIO_PAYLOAD.verificationScenarios.length,
                  `Scenario count drifted: expected ${SCENARIO_PAYLOAD.verificationScenarios.length}, found ${initialCards}`,
                );

                await page.locator("[data-testid='ring-filter']").selectOption("integration");
                const integrationCards = await page.locator("[data-testid^='scenario-card-']").count();
                assertCondition(integrationCards === 1, `Expected 1 integration scenario, found ${integrationCards}`);

                await page.locator("[data-testid='ring-filter']").selectOption("all");
                await page.locator("[data-testid='gate-filter']").selectOption("GATE_4_RESILIENCE_AND_RECOVERY");
                const gateCards = await page.locator("[data-testid^='scenario-card-']").count();
                assertCondition(gateCards === 1, `Expected 1 Gate 4 scenario, found ${gateCards}`);

                await page.locator("[data-testid='gate-filter']").selectOption("all");
                await page.locator("[data-testid='drift-filter']").selectOption("rollback_required");
                const rollbackCards = await page.locator("[data-testid^='scenario-card-']").count();
                assertCondition(rollbackCards === 1, `Expected 1 rollback-required scenario, found ${rollbackCards}`);

                await page.locator("[data-testid='drift-filter']").selectOption("all");
                await page.locator("[data-testid='scenario-card-VS_058_PRODUCTION_V1']").click();
                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes("VS_058_PRODUCTION_V1") &&
                    inspectorText.includes("rollback_required") &&
                    inspectorText.includes("WCF_PRODUCTION_V1"),
                  "Inspector lost the expected production rollback posture.",
                );

                await page.locator("[data-testid='matrix-row-GATE_5_LIVE_WAVE_PROOF']").click();
                const selectedMatrix = await page
                  .locator("[data-testid='matrix-row-GATE_5_LIVE_WAVE_PROOF']")
                  .getAttribute("data-selected");
                assertCondition(selectedMatrix === "true", "Gate 5 matrix row did not stay selected.");
                const gateInspector = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  gateInspector.includes("GATE_5_LIVE_WAVE_PROOF"),
                  "Inspector did not synchronize with the selected gate row.",
                );

                await page.locator("[data-testid='scenario-card-VS_058_LOCAL_V1']").focus();
                await page.keyboard.press("ArrowDown");
                const secondScenarioSelected = await page
                  .locator("[data-testid='scenario-card-VS_058_CI_PREVIEW_V1']")
                  .getAttribute("data-selected");
                assertCondition(
                  secondScenarioSelected === "true",
                  "Arrow-down navigation no longer advances scenario selection.",
                );

                const ringNodes = await page.locator("[data-testid^='ring-node-']").count();
                const ringParityRows = await page.locator("[data-testid='ring-parity-table'] tbody tr").count();
                assertCondition(ringNodes === 5 && ringParityRows === 5, "Ring diagram and parity table drifted.");

                const gateNodes = await page.locator("[data-testid^='gate-chip-']").count();
                const gateParityRows = await page.locator("[data-testid='gate-parity-table'] tbody tr").count();
                assertCondition(gateNodes === 5 && gateParityRows === 5, "Gate strip and parity table drifted.");

                await page.setViewportSize({ width: 390, height: 844 });
                await page.locator("[data-testid='inspector']").waitFor();

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
                assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}`);
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

            export const verificationCockpitManifest = {
              task: POLICY_PAYLOAD.task_id,
              rings: POLICY_PAYLOAD.summary.ring_count,
              scenarios: SCENARIO_PAYLOAD.summary.scenario_count,
              gates: POLICY_PAYLOAD.summary.gate_count,
            };
            """
        ).strip()
        + "\n"
    )


def main() -> None:
    context = load_context()
    artifacts = build_release_artifacts(context)

    environment_policy = artifacts["environment_policy"]
    scenario_pack = artifacts["verification_scenario_pack"]
    matrix_pack = artifacts["matrix_pack"]
    ring_gate_rows = artifacts["ring_gate_rows"]
    synthetic_recovery_rows = artifacts["synthetic_recovery_rows"]

    write_json(ENVIRONMENT_RING_POLICY_PATH, environment_policy)
    write_json(VERIFICATION_SCENARIOS_PATH, scenario_pack)
    write_json(RELEASE_MATRIX_PATH, matrix_pack)
    write_csv(RING_GATE_MATRIX_PATH, list(ring_gate_rows[0].keys()), ring_gate_rows)
    write_json(PROMOTION_INTENT_SCHEMA_PATH, build_promotion_intent_schema())
    write_csv(SYNTHETIC_RECOVERY_MATRIX_PATH, list(synthetic_recovery_rows[0].keys()), synthetic_recovery_rows)
    write_json(PACKAGE_MATRIX_SCHEMA_PATH, build_matrix_schema())
    write_text(POLICY_DOC_PATH, build_policy_doc(environment_policy))
    write_text(MATRIX_DOC_PATH, build_matrix_doc(matrix_pack))
    write_text(FENCE_DOC_PATH, build_fence_doc(environment_policy, scenario_pack))
    write_text(COCKPIT_PATH, build_cockpit_html())
    write_text(VALIDATOR_PATH, build_validator())
    VALIDATOR_PATH.chmod(0o755)
    write_text(SPEC_PATH, build_spec())

    update_api_contract_package(synthetic_recovery_rows, matrix_pack)
    update_root_package()
    update_playwright_package()
    patch_engineering_builder()

    print(
        "seq_058 verification ladder artifacts generated: "
        f"{environment_policy['summary']['ring_count']} rings, "
        f"{scenario_pack['summary']['scenario_count']} scenarios, "
        f"{matrix_pack['summary']['matrix_count']} matrices, "
        f"{len(ring_gate_rows)} gate rows, "
        f"{len(synthetic_recovery_rows)} synthetic recovery rows."
    )


if __name__ == "__main__":
    main()
