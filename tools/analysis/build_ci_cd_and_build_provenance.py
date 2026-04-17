#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
TOOLS_ANALYSIS_DIR = ROOT / "tools" / "analysis"
WORKFLOWS_DIR = ROOT / ".github" / "workflows"
TOOLS_RELEASE_DIR = ROOT / "tools" / "release-provenance"
INFRA_DIR = ROOT / "infra" / "build-provenance"
RELEASE_CONTROLS_DIR = ROOT / "packages" / "release-controls"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
ROOT_SCRIPT_UPDATES_PATH = TOOLS_ANALYSIS_DIR / "root_script_updates.py"

VERIFICATION_SCENARIOS_PATH = DATA_DIR / "verification_scenarios.json"
VERIFICATION_MATRIX_PATH = DATA_DIR / "release_contract_verification_matrix.json"
PARITY_RULES_PATH = DATA_DIR / "release_publication_parity_rules.json"
SECRET_MANIFEST_PATH = DATA_DIR / "secret_class_manifest.json"
KEY_HIERARCHY_PATH = DATA_DIR / "key_hierarchy_manifest.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
API_REGISTRY_PATH = DATA_DIR / "api_contract_registry_manifest.json"
DESIGN_PUBLICATION_PATH = DATA_DIR / "design_contract_publication_bundles.json"
SUPPLY_CHAIN_MATRIX_PATH = DATA_DIR / "supply_chain_and_provenance_matrix.json"
DEPENDENCY_WATCHLIST_PATH = DATA_DIR / "dependency_watchlist.json"

MANIFEST_PATH = DATA_DIR / "build_provenance_manifest.json"
MATRIX_PATH = DATA_DIR / "pipeline_gate_matrix.csv"
QUARANTINE_POLICY_PATH = DATA_DIR / "artifact_quarantine_policy.json"
DESIGN_DOC_PATH = DOCS_DIR / "91_ci_cd_and_build_provenance_design.md"
RULES_DOC_PATH = DOCS_DIR / "91_artifact_signing_quarantine_and_publish_rules.md"
ATLAS_PATH = DOCS_DIR / "91_build_provenance_pipeline_atlas.html"
SPEC_PATH = TESTS_DIR / "build-provenance-pipeline-atlas.spec.js"

CI_WORKFLOW_PATH = WORKFLOWS_DIR / "build-provenance-ci.yml"
PROMOTION_WORKFLOW_PATH = WORKFLOWS_DIR / "nonprod-provenance-promotion.yml"

PACKAGE_SOURCE_PATH = RELEASE_CONTROLS_DIR / "src" / "build-provenance.ts"
PACKAGE_INDEX_PATH = RELEASE_CONTROLS_DIR / "src" / "index.ts"
PACKAGE_PUBLIC_API_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "public-api.test.ts"
PACKAGE_TEST_PATH = RELEASE_CONTROLS_DIR / "tests" / "build-provenance.test.ts"

SHARED_SCRIPT_PATH = TOOLS_RELEASE_DIR / "shared.ts"
REHEARSAL_SCRIPT_PATH = TOOLS_RELEASE_DIR / "run-build-provenance-rehearsal.ts"
VERIFY_SCRIPT_PATH = TOOLS_RELEASE_DIR / "verify-build-provenance.ts"
PROMOTE_SCRIPT_PATH = TOOLS_RELEASE_DIR / "promote-build-artifact.ts"

README_PATH = INFRA_DIR / "README.md"
DEPENDENCY_POLICY_PATH = INFRA_DIR / "local" / "dependency-policy.json"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "build-provenance-smoke.test.mjs"

TASK_ID = "par_091"
VISUAL_MODE = "Build_Provenance_Pipeline_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

SOURCE_PRECEDENCE = [
    "prompt/091.md",
    "prompt/shared_operating_contract_086_to_095.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#Security baseline contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Operational readiness contract",
    "blueprint/phase-0-the-foundation-protocol.md#1.38 RuntimePublicationBundle",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 96",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 112",
    "blueprint/forensic-audit-findings.md#Finding 113",
    "data/analysis/verification_scenarios.json",
    "data/analysis/release_contract_verification_matrix.json",
    "data/analysis/release_publication_parity_rules.json",
    "data/analysis/secret_class_manifest.json",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/api_contract_registry_manifest.json",
    "data/analysis/design_contract_publication_bundles.json",
    "data/analysis/supply_chain_and_provenance_matrix.json",
    "data/analysis/dependency_watchlist.json",
]

GATE_DEFINITIONS = [
    {
        "gateRef": "dependency_resolve",
        "sequence": 1,
        "label": "Dependency resolve",
        "category": "dependency",
        "failureDisposition": "block_pipeline",
        "publishedEvidenceType": "dependency-resolution-manifest",
    },
    {
        "gateRef": "lint_type_unit",
        "sequence": 2,
        "label": "Lint, type, and unit",
        "category": "static",
        "failureDisposition": "block_pipeline",
        "publishedEvidenceType": "foundation-gate-record",
    },
    {
        "gateRef": "build_package",
        "sequence": 3,
        "label": "Deterministic build package",
        "category": "build",
        "failureDisposition": "block_pipeline",
        "publishedEvidenceType": "artifact-bundle-manifest",
    },
    {
        "gateRef": "sbom_dependency_policy",
        "sequence": 4,
        "label": "SBOM and dependency policy",
        "category": "supply_chain",
        "failureDisposition": "quarantine_artifact",
        "publishedEvidenceType": "sbom-and-policy-verdict",
    },
    {
        "gateRef": "provenance_sign",
        "sequence": 5,
        "label": "Provenance sign",
        "category": "provenance",
        "failureDisposition": "quarantine_artifact",
        "publishedEvidenceType": "signed-provenance-record",
    },
    {
        "gateRef": "provenance_verify",
        "sequence": 6,
        "label": "Provenance verify",
        "category": "provenance",
        "failureDisposition": "quarantine_artifact",
        "publishedEvidenceType": "provenance-verification-verdict",
    },
    {
        "gateRef": "runtime_publish_gate",
        "sequence": 7,
        "label": "Runtime publication gate",
        "category": "publication",
        "failureDisposition": "block_publish",
        "publishedEvidenceType": "publish-decision-record",
    },
    {
        "gateRef": "nonprod_promotion_gate",
        "sequence": 8,
        "label": "Non-production promotion gate",
        "category": "promotion",
        "failureDisposition": "block_promotion",
        "publishedEvidenceType": "promotion-decision-record",
    },
]

BUILD_FAMILY_BLUEPRINTS = [
    {
        "buildFamilyRef": "bf_foundation_monorepo_full",
        "label": "Foundation monorepo bundle",
        "artifactKind": "workspace_bundle_manifest",
        "artifactRoots": [
            "package.json",
            "pnpm-lock.yaml",
            "pnpm-workspace.yaml",
            "nx.json",
            "tsconfig.base.json",
        ],
        "surfaceRefs": [],
        "allowedRings": ["ci-preview", "integration", "preprod"],
        "publishDescriptorRef": "pd_foundation_monorepo",
        "requiresTopologyPublish": True,
    },
    {
        "buildFamilyRef": "bf_published_gateway_bundle",
        "label": "Published gateway bundle",
        "artifactKind": "service_bundle_manifest",
        "artifactRoots": ["services/api-gateway", "packages/api-contracts", "packages/release-controls"],
        "surfaceRefs": ["gws_patient_intake_web", "gws_patient_home"],
        "allowedRings": ["ci-preview", "integration", "preprod"],
        "publishDescriptorRef": "pd_published_gateway",
        "requiresTopologyPublish": True,
    },
    {
        "buildFamilyRef": "bf_command_runtime_bundle",
        "label": "Command orchestration bundle",
        "artifactKind": "service_bundle_manifest",
        "artifactRoots": ["services/command-api", "packages/domain-kernel", "packages/release-controls"],
        "surfaceRefs": [],
        "allowedRings": ["ci-preview", "integration", "preprod"],
        "publishDescriptorRef": "pd_command_runtime",
        "requiresTopologyPublish": True,
    },
    {
        "buildFamilyRef": "bf_projection_runtime_bundle",
        "label": "Projection rebuild bundle",
        "artifactKind": "service_bundle_manifest",
        "artifactRoots": ["services/projection-worker", "packages/release-controls", "packages/fhir-mapping"],
        "surfaceRefs": [],
        "allowedRings": ["ci-preview", "integration", "preprod"],
        "publishDescriptorRef": "pd_projection_runtime",
        "requiresTopologyPublish": True,
    },
    {
        "buildFamilyRef": "bf_notification_runtime_bundle",
        "label": "Notification dispatch bundle",
        "artifactKind": "service_bundle_manifest",
        "artifactRoots": ["services/notification-worker", "packages/release-controls"],
        "surfaceRefs": [],
        "allowedRings": ["ci-preview", "integration", "preprod"],
        "publishDescriptorRef": "pd_notification_runtime",
        "requiresTopologyPublish": True,
    },
    {
        "buildFamilyRef": "bf_adapter_simulator_bundle",
        "label": "Adapter simulator bundle",
        "artifactKind": "service_bundle_manifest",
        "artifactRoots": ["services/adapter-simulators", "packages/release-controls"],
        "surfaceRefs": [],
        "allowedRings": ["local", "ci-preview", "integration"],
        "publishDescriptorRef": "pd_adapter_simulators",
        "requiresTopologyPublish": False,
    },
    {
        "buildFamilyRef": "bf_browser_contract_bundle",
        "label": "Browser contract bundle",
        "artifactKind": "contract_bundle_manifest",
        "artifactRoots": ["apps/patient-web", "apps/clinical-workspace", "packages/design-system", "packages/api-contracts"],
        "surfaceRefs": ["gws_patient_home", "gws_clinician_workspace"],
        "allowedRings": ["ci-preview", "integration", "preprod"],
        "publishDescriptorRef": "pd_browser_contracts",
        "requiresTopologyPublish": True,
    },
    {
        "buildFamilyRef": "bf_release_control_bundle",
        "label": "Release-control bundle",
        "artifactKind": "control_plane_manifest",
        "artifactRoots": ["packages/release-controls", "tools/analysis", ".github/workflows"],
        "surfaceRefs": ["gws_operations_board", "gws_governance_shell"],
        "allowedRings": ["local", "ci-preview", "integration", "preprod", "production"],
        "publishDescriptorRef": "pd_release_controls",
        "requiresTopologyPublish": True,
    },
]

PIPELINE_RUN_BLUEPRINTS = [
    {
        "runId": "run_foundation_ci_preview_verified",
        "ring": "ci-preview",
        "buildFamilyRef": "bf_foundation_monorepo_full",
        "gateRef": "nonprod_promotion_gate",
        "artifactState": "publishable",
        "provenanceState": "verified",
        "runtimeConsumptionState": "publishable",
        "decisionState": "promotable",
        "quarantineReasonRefs": [],
        "sourceBuildRef": None,
    },
    {
        "runId": "run_gateway_integration_quarantined_dependency",
        "ring": "integration",
        "buildFamilyRef": "bf_published_gateway_bundle",
        "gateRef": "sbom_dependency_policy",
        "artifactState": "quarantined",
        "provenanceState": "quarantined",
        "runtimeConsumptionState": "quarantined",
        "decisionState": "quarantined",
        "quarantineReasonRefs": ["DEPENDENCY_POLICY_BLOCKED"],
        "sourceBuildRef": None,
    },
    {
        "runId": "run_command_preprod_revoked",
        "ring": "preprod",
        "buildFamilyRef": "bf_command_runtime_bundle",
        "gateRef": "provenance_verify",
        "artifactState": "revoked",
        "provenanceState": "revoked",
        "runtimeConsumptionState": "revoked",
        "decisionState": "revoked",
        "quarantineReasonRefs": ["PROVENANCE_REVOKED"],
        "sourceBuildRef": None,
    },
    {
        "runId": "run_projection_integration_superseded",
        "ring": "integration",
        "buildFamilyRef": "bf_projection_runtime_bundle",
        "gateRef": "runtime_publish_gate",
        "artifactState": "superseded",
        "provenanceState": "superseded",
        "runtimeConsumptionState": "superseded",
        "decisionState": "superseded",
        "quarantineReasonRefs": ["PROVENANCE_SUPERSEDED"],
        "sourceBuildRef": "run_foundation_ci_preview_verified",
    },
    {
        "runId": "run_browser_ci_preview_drifted",
        "ring": "ci-preview",
        "buildFamilyRef": "bf_browser_contract_bundle",
        "gateRef": "provenance_verify",
        "artifactState": "blocked",
        "provenanceState": "drifted",
        "runtimeConsumptionState": "blocked",
        "decisionState": "blocked",
        "quarantineReasonRefs": ["SCHEMA_SET_DRIFT"],
        "sourceBuildRef": None,
    },
    {
        "runId": "run_notification_preprod_verified",
        "ring": "preprod",
        "buildFamilyRef": "bf_notification_runtime_bundle",
        "gateRef": "nonprod_promotion_gate",
        "artifactState": "publishable",
        "provenanceState": "verified",
        "runtimeConsumptionState": "publishable",
        "decisionState": "promotable",
        "quarantineReasonRefs": [],
        "sourceBuildRef": None,
    },
    {
        "runId": "run_release_controls_local_verified",
        "ring": "local",
        "buildFamilyRef": "bf_release_control_bundle",
        "gateRef": "provenance_verify",
        "artifactState": "publishable",
        "provenanceState": "verified",
        "runtimeConsumptionState": "publishable",
        "decisionState": "local_only",
        "quarantineReasonRefs": [],
        "sourceBuildRef": None,
    },
    {
        "runId": "run_release_controls_production_blocked",
        "ring": "production",
        "buildFamilyRef": "bf_release_control_bundle",
        "gateRef": "nonprod_promotion_gate",
        "artifactState": "blocked",
        "provenanceState": "verified",
        "runtimeConsumptionState": "blocked",
        "decisionState": "blocked",
        "quarantineReasonRefs": ["MANUAL_DEPLOY_BYPASS_ATTEMPT"],
        "sourceBuildRef": None,
    },
]

QUARANTINE_RULES = [
    {
        "ruleRef": "qr_signature_invalid",
        "triggerRef": "SIGNATURE_MISMATCH",
        "artifactState": "quarantined",
        "runtimeConsumptionState": "quarantined",
        "publishDecisionState": "quarantined",
        "supersessionAllowed": False,
        "operatorAction": "quarantine_and_rebuild",
    },
    {
        "ruleRef": "qr_dependency_policy_blocked",
        "triggerRef": "DEPENDENCY_POLICY_BLOCKED",
        "artifactState": "quarantined",
        "runtimeConsumptionState": "quarantined",
        "publishDecisionState": "quarantined",
        "supersessionAllowed": True,
        "operatorAction": "quarantine_and_remediate",
    },
    {
        "ruleRef": "qr_schema_set_drift",
        "triggerRef": "SCHEMA_SET_DRIFT",
        "artifactState": "blocked",
        "runtimeConsumptionState": "blocked",
        "publishDecisionState": "blocked",
        "supersessionAllowed": True,
        "operatorAction": "rebuild_after_schema_alignment",
    },
    {
        "ruleRef": "qr_provenance_revoked",
        "triggerRef": "PROVENANCE_REVOKED",
        "artifactState": "revoked",
        "runtimeConsumptionState": "revoked",
        "publishDecisionState": "revoked",
        "supersessionAllowed": False,
        "operatorAction": "revoke_and_replace",
    },
    {
        "ruleRef": "qr_provenance_superseded",
        "triggerRef": "PROVENANCE_SUPERSEDED",
        "artifactState": "superseded",
        "runtimeConsumptionState": "superseded",
        "publishDecisionState": "superseded",
        "supersessionAllowed": False,
        "operatorAction": "retain_read_only_history",
    },
    {
        "ruleRef": "qr_manual_bypass_attempt",
        "triggerRef": "MANUAL_DEPLOY_BYPASS_ATTEMPT",
        "artifactState": "blocked",
        "runtimeConsumptionState": "blocked",
        "publishDecisionState": "blocked",
        "supersessionAllowed": False,
        "operatorAction": "fail_closed_and_alert",
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependencyRef": "FOLLOW_ON_DEPENDENCY_094_RUNTIME_PUBLICATION_BUNDLE_FINAL_BINDING",
        "owningTaskRef": "par_094",
        "scope": "The mock-now promotion hook pins current runtime publication refs, but the final bundle publication and parity lift remains owned by par_094.",
    },
    {
        "dependencyRef": "FOLLOW_ON_DEPENDENCY_097_WATCH_TUPLE_WAVE_ACTIONING",
        "owningTaskRef": "par_097",
        "scope": "par_091 publishes gate evidence and promotion hooks only; live-wave widening, pause, rollback, and watch tuple actioning remains owned by par_097.",
    },
]

ROOT_SCRIPT_ADDITIONS = {
    "validate:build-provenance": "python3 ./tools/analysis/validate_ci_cd_and_build_provenance.py",
    "ci:foundation-gates": "pnpm build && pnpm check",
    "ci:rehearse-provenance": "pnpm exec tsx ./tools/release-provenance/run-build-provenance-rehearsal.ts --environment ci-preview --output-dir .artifacts/build-provenance/ci-preview",
    "ci:verify-provenance": "pnpm exec tsx ./tools/release-provenance/verify-build-provenance.ts --environment ci-preview --input-dir .artifacts/build-provenance/ci-preview",
    "ci:promote-nonprod": "pnpm exec tsx ./tools/release-provenance/promote-build-artifact.ts --target-ring integration --input-dir .artifacts/build-provenance/ci-preview",
}

HTML_MARKERS = [
    'data-testid="pipeline-lane"',
    'data-testid="provenance-card-wall"',
    'data-testid="decision-timeline"',
    'data-testid="run-table"',
    'data-testid="policy-table"',
    'data-testid="inspector"',
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        raise SystemExit(f"Cannot write empty CSV: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def stable_digest(value: Any) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def append_script(script: str, command: str) -> str:
    if not script:
        return command
    if command in script:
        return script
    return f"{script} && {command}"


def with_root_script_updates() -> dict[str, str]:
    scripts = dict(ROOT_SCRIPT_UPDATES)
    scripts["bootstrap"] = append_script(
        scripts["bootstrap"],
        "pnpm validate:build-provenance",
    )
    scripts["check"] = append_script(
        scripts["check"],
        "pnpm validate:build-provenance",
    )
    scripts["codegen"] = scripts["codegen"].replace(
        "python3 ./tools/analysis/build_release_trust_models.py && python3 ./tools/analysis/build_access_grant_service.py && pnpm format",
        "python3 ./tools/analysis/build_release_trust_models.py && python3 ./tools/analysis/build_ci_cd_and_build_provenance.py && python3 ./tools/analysis/build_access_grant_service.py && pnpm format",
    )
    scripts.update(ROOT_SCRIPT_ADDITIONS)
    return scripts


def load_upstreams() -> dict[str, Any]:
    verification = load_json(VERIFICATION_SCENARIOS_PATH)
    matrix = load_json(VERIFICATION_MATRIX_PATH)
    parity = load_json(PARITY_RULES_PATH)
    secrets = load_json(SECRET_MANIFEST_PATH)
    key_hierarchy = load_json(KEY_HIERARCHY_PATH)
    runtime_topology = load_json(RUNTIME_TOPOLOGY_PATH)
    gateway_surfaces = load_json(GATEWAY_SURFACES_PATH)
    api_registry = load_json(API_REGISTRY_PATH)
    design_publication = load_json(DESIGN_PUBLICATION_PATH)
    supply_chain = load_json(SUPPLY_CHAIN_MATRIX_PATH)
    watchlist = load_json(DEPENDENCY_WATCHLIST_PATH)
    return {
        "verification": verification,
        "matrix": matrix,
        "parity": parity,
        "secrets": secrets,
        "key_hierarchy": key_hierarchy,
        "runtime_topology": runtime_topology,
        "gateway_surfaces": gateway_surfaces,
        "api_registry": api_registry,
        "design_publication": design_publication,
        "supply_chain": supply_chain,
        "watchlist": watchlist,
    }


def select_verification_scenario(verification: dict[str, Any], ring: str) -> dict[str, Any]:
    for scenario in verification["verificationScenarios"]:
        if scenario["ringCode"] == ring:
            return scenario
    raise SystemExit(f"PREREQUISITE_GAP_091_NO_VERIFICATION_SCENARIO_FOR_{ring.upper().replace('-', '_')}")


def lookup_surface(gateway_surfaces: dict[str, Any], surface_id: str) -> dict[str, Any]:
    for surface in gateway_surfaces["gateway_surfaces"]:
        if surface["surfaceId"] == surface_id:
            return surface
    raise SystemExit(f"PREREQUISITE_GAP_091_NO_GATEWAY_SURFACE_{surface_id}")


def build_build_families(upstreams: dict[str, Any]) -> list[dict[str, Any]]:
    verification = upstreams["verification"]
    gateway_surfaces = upstreams["gateway_surfaces"]
    secrets = upstreams["secrets"]
    signing_secret = next(
        row
        for row in secrets["secret_classes"]
        if row["secret_class_ref"] == "RELEASE_PROVENANCE_SIGNING_KEY_REF"
    )

    families: list[dict[str, Any]] = []
    for blueprint in BUILD_FAMILY_BLUEPRINTS:
        default_ring = "ci-preview" if "ci-preview" in blueprint["allowedRings"] else blueprint["allowedRings"][0]
        scenario = select_verification_scenario(verification, default_ring)
        families.append(
            {
                "buildFamilyRef": blueprint["buildFamilyRef"],
                "label": blueprint["label"],
                "artifactKind": blueprint["artifactKind"],
                "artifactRoots": blueprint["artifactRoots"],
                "surfaceRefs": blueprint["surfaceRefs"],
                "surfaceLabels": [
                    lookup_surface(gateway_surfaces, surface_id)["surfaceName"]
                    for surface_id in blueprint["surfaceRefs"]
                ],
                "allowedEnvironmentRings": blueprint["allowedRings"],
                "requiredGateRefs": [gate["gateRef"] for gate in GATE_DEFINITIONS],
                "verificationScenarioRef": scenario["verificationScenarioId"],
                "releaseRef": scenario["releaseRef"],
                "releaseContractVerificationMatrixRef": scenario["releaseContractVerificationMatrixRef"],
                "runtimePublicationBundleRef": scenario["runtimePublicationBundleRef"],
                "releasePublicationParityRef": f"parity::{scenario['releaseRef'].lower()}",
                "releaseApprovalFreezeRef": f"raf::{scenario['releaseRef'].lower()}",
                "signingSecretClassRef": signing_secret["secret_class_ref"],
                "signingAccessPolicyRef": signing_secret["access_policy_ref"],
                "publishDescriptorRef": blueprint["publishDescriptorRef"],
                "requiresTopologyPublish": blueprint["requiresTopologyPublish"],
                "source_refs": [
                    "prompt/091.md#Implementation deliverables to create",
                    "data/analysis/verification_scenarios.json",
                    "data/analysis/secret_class_manifest.json",
                    "data/analysis/gateway_bff_surfaces.json",
                ],
            }
        )
    return families


def build_pipeline_runs(
    upstreams: dict[str, Any],
    build_families: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    verification = upstreams["verification"]
    run_rows: list[dict[str, Any]] = []
    gate_evidence_rows: list[dict[str, Any]] = []
    family_by_ref = {row["buildFamilyRef"]: row for row in build_families}
    gate_by_ref = {row["gateRef"]: row for row in GATE_DEFINITIONS}
    for blueprint in PIPELINE_RUN_BLUEPRINTS:
        family = family_by_ref[blueprint["buildFamilyRef"]]
        scenario = select_verification_scenario(verification, blueprint["ring"])
        artifact_digest = stable_digest(
            {
                "ring": blueprint["ring"],
                "buildFamilyRef": family["buildFamilyRef"],
                "artifactRoots": family["artifactRoots"],
            }
        )
        sbom_digest = stable_digest(
            {
                "buildFamilyRef": family["buildFamilyRef"],
                "releaseRef": scenario["releaseRef"],
                "ring": blueprint["ring"],
            }
        )
        build_record_ref = f"bpr::{blueprint['runId']}"
        dominant_gate = gate_by_ref[blueprint["gateRef"]]
        gate_refs: list[str] = []
        for gate in GATE_DEFINITIONS:
            state = "passed"
            if gate["gateRef"] == dominant_gate["gateRef"]:
                state = "blocked" if blueprint["artifactState"] in {"blocked", "publishable"} else "quarantined"
                if blueprint["provenanceState"] == "verified" and blueprint["decisionState"] in {"promotable", "local_only"}:
                    state = "passed"
                if blueprint["artifactState"] == "revoked":
                    state = "blocked"
                if blueprint["artifactState"] == "superseded":
                    state = "blocked"
            evidence_ref = f"gate-evidence::{blueprint['runId']}::{gate['gateRef']}"
            gate_refs.append(evidence_ref)
            gate_evidence_rows.append(
                {
                    "gateEvidenceRef": evidence_ref,
                    "pipelineExecutionRef": blueprint["runId"],
                    "environmentRing": blueprint["ring"],
                    "buildFamilyRef": family["buildFamilyRef"],
                    "gateRef": gate["gateRef"],
                    "gateLabel": gate["label"],
                    "state": state,
                    "evidenceDigest": stable_digest(
                        {
                            "runId": blueprint["runId"],
                            "gate": gate["gateRef"],
                            "state": state,
                        }
                    ),
                    "recordedAt": GENERATED_AT,
                }
            )
        run_rows.append(
            {
                "pipelineExecutionRef": blueprint["runId"],
                "buildProvenanceRecordRef": build_record_ref,
                "environmentRing": blueprint["ring"],
                "buildFamilyRef": family["buildFamilyRef"],
                "releaseRef": scenario["releaseRef"],
                "verificationScenarioRef": scenario["verificationScenarioId"],
                "releaseContractVerificationMatrixRef": scenario["releaseContractVerificationMatrixRef"],
                "runtimePublicationBundleRef": scenario["runtimePublicationBundleRef"],
                "releasePublicationParityRef": f"parity::{scenario['releaseRef'].lower()}",
                "releaseApprovalFreezeRef": f"raf::{scenario['releaseRef'].lower()}",
                "artifactSetDigest": artifact_digest,
                "sbomDigest": sbom_digest,
                "artifactState": blueprint["artifactState"],
                "provenanceState": blueprint["provenanceState"],
                "runtimeConsumptionState": blueprint["runtimeConsumptionState"],
                "decisionState": blueprint["decisionState"],
                "dominantGateRef": dominant_gate["gateRef"],
                "gateEvidenceRefs": gate_refs,
                "quarantineReasonRefs": blueprint["quarantineReasonRefs"],
                "supersedesBuildProvenanceRecordRef": (
                    f"bpr::{blueprint['sourceBuildRef']}" if blueprint["sourceBuildRef"] else None
                ),
                "artifactDigests": [
                    {
                        "artifactId": f"{family['buildFamilyRef']}::bundle",
                        "artifactKind": family["artifactKind"],
                        "artifactDigest": artifact_digest,
                        "artifactRoots": family["artifactRoots"],
                    }
                ],
                "source_refs": [
                    "prompt/091.md#At minimum, implement these authoritative capabilities",
                    "data/analysis/verification_scenarios.json",
                ],
            }
        )
    return run_rows, gate_evidence_rows


def build_provenance_records(
    runs: list[dict[str, Any]],
    build_families: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    family_by_ref = {row["buildFamilyRef"]: row for row in build_families}
    records: list[dict[str, Any]] = []
    for run in runs:
        family = family_by_ref[run["buildFamilyRef"]]
        canonical_digest = stable_digest(
            {
                "buildFamilyRef": run["buildFamilyRef"],
                "releaseRef": run["releaseRef"],
                "artifactSetDigest": run["artifactSetDigest"],
                "environmentRing": run["environmentRing"],
                "runtimePublicationBundleRef": run["runtimePublicationBundleRef"],
                "gateEvidenceRefs": run["gateEvidenceRefs"],
            }
        )
        signature = stable_digest(
            {
                "canonicalDigest": canonical_digest,
                "signingSecretClassRef": family["signingSecretClassRef"],
            }
        )
        records.append(
            {
                "buildProvenanceRecordId": run["buildProvenanceRecordRef"],
                "buildFamilyRef": run["buildFamilyRef"],
                "releaseRef": run["releaseRef"],
                "verificationScenarioRef": run["verificationScenarioRef"],
                "environmentRing": run["environmentRing"],
                "runtimeTopologyManifestRef": "data/analysis/runtime_topology_manifest.json",
                "runtimePublicationBundleRef": run["runtimePublicationBundleRef"],
                "releasePublicationParityRef": run["releasePublicationParityRef"],
                "artifactDigests": run["artifactDigests"],
                "artifactSetDigest": run["artifactSetDigest"],
                "sbomDigest": run["sbomDigest"],
                "sbomRef": f"sbom::{run['pipelineExecutionRef']}",
                "dependencyPolicyVerdictRef": f"dep-policy::{run['pipelineExecutionRef']}",
                "gateEvidenceRefs": run["gateEvidenceRefs"],
                "signingSecretClassRef": family["signingSecretClassRef"],
                "signatureAlgorithm": "hmac-sha256-mock-safe-v1",
                "canonicalDigest": canonical_digest,
                "signature": signature,
                "provenanceState": run["provenanceState"],
                "runtimeConsumptionState": run["runtimeConsumptionState"],
                "artifactState": run["artifactState"],
                "quarantineReasonRefs": run["quarantineReasonRefs"],
                "revokedAt": GENERATED_AT if run["artifactState"] == "revoked" else None,
                "revocationReasonRef": (
                    run["quarantineReasonRefs"][0] if run["artifactState"] == "revoked" else None
                ),
                "supersededByBuildProvenanceRecordRef": run["supersedesBuildProvenanceRecordRef"],
                "signedAt": GENERATED_AT,
                "source_refs": [
                    "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
                    "prompt/091.md#Implementation deliverables to create",
                ],
            }
        )
    return records


def build_publish_hooks(build_families: list[dict[str, Any]]) -> list[dict[str, Any]]:
    hooks: list[dict[str, Any]] = []
    for family in build_families:
        for target_ring in ("integration", "preprod"):
            hooks.append(
                {
                    "publishHookRef": f"{family['publishDescriptorRef']}::{target_ring}",
                    "buildFamilyRef": family["buildFamilyRef"],
                    "targetRing": target_ring,
                    "requiresProvenanceState": "verified",
                    "requiresRuntimeConsumptionState": "publishable",
                    "requiresParityState": "exact",
                    "requiresGateRef": "nonprod_promotion_gate",
                    "notes": (
                        "Mock-now hook writes machine-readable promotion decisions now; "
                        "par_094 later binds the final RuntimePublicationBundle publication records."
                    ),
                }
            )
    return hooks


def build_pipeline_gate_matrix(
    build_families: list[dict[str, Any]],
    secrets: dict[str, Any],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    rings = [row["environment_ring"] for row in secrets["environment_backends"]]
    families_scope = "|".join(row["buildFamilyRef"] for row in build_families)
    for ring in rings:
        for gate in GATE_DEFINITIONS:
            rows.append(
                {
                    "row_id": f"{ring}::{gate['gateRef']}",
                    "environment_ring": ring,
                    "gate_ref": gate["gateRef"],
                    "gate_sequence": gate["sequence"],
                    "gate_label": gate["label"],
                    "gate_category": gate["category"],
                    "build_family_scope": families_scope,
                    "failure_disposition": gate["failureDisposition"],
                    "published_evidence_type": gate["publishedEvidenceType"],
                    "signing_secret_class_ref": "RELEASE_PROVENANCE_SIGNING_KEY_REF",
                    "quarantine_policy_ref": "artifact_quarantine_policy_v1",
                    "source_refs": "prompt/091.md|blueprint/platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
                }
            )
    return rows


def build_dependency_policy(upstreams: dict[str, Any]) -> dict[str, Any]:
    watchlist = upstreams["watchlist"]
    return {
        "policyId": "dependency_policy_091_foundation_v1",
        "requiredRootPackageManager": "pnpm@10.23.0",
        "requiredLockfilePath": "pnpm-lock.yaml",
        "requiredWorkspaceInternalSpecifier": "workspace:*",
        "blockedExternalSpecPatterns": ["latest", "*", "^*", "~*"],
        "requiresStandardsWatchlistHash": True,
        "watchlistRef": "data/analysis/dependency_watchlist.json",
        "watchlistHash": stable_digest(watchlist["summary"]),
        "policyNotes": [
            "Dependency policy remains fail-closed for unsigned, stale, or manually bypassed publication attempts.",
            "The mock-now policy operates against workspace package manifests and the pinned pnpm lockfile; production may add registry attestation and CVE feeds later without changing the refusal shape.",
        ],
    }


def build_manifest(
    upstreams: dict[str, Any],
    build_families: list[dict[str, Any]],
    runs: list[dict[str, Any]],
    gate_evidence_rows: list[dict[str, Any]],
    provenance_records: list[dict[str, Any]],
    publish_hooks: list[dict[str, Any]],
) -> dict[str, Any]:
    counters = Counter(run["provenanceState"] for run in runs)
    artifact_counters = Counter(run["artifactState"] for run in runs)
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": "Provision the Vecells CI/CD, signed build provenance, quarantine, and non-production promotion baseline so artifact trust is machine-readable and fail closed.",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "workflow_count": 2,
            "build_family_count": len(build_families),
            "pipeline_run_count": len(runs),
            "gate_count": len(GATE_DEFINITIONS),
            "gate_evidence_count": len(gate_evidence_rows),
            "quarantine_rule_count": len(QUARANTINE_RULES),
            "publish_hook_count": len(publish_hooks),
            "verified_count": counters["verified"],
            "quarantined_count": counters["quarantined"],
            "revoked_count": counters["revoked"],
            "superseded_count": counters["superseded"],
            "drifted_count": counters["drifted"],
            "publishable_artifact_count": artifact_counters["publishable"],
            "blocked_artifact_count": artifact_counters["blocked"],
        },
        "release_contract_verification_matrix_ref": "data/analysis/release_contract_verification_matrix.json",
        "release_publication_parity_rules_ref": "data/analysis/release_publication_parity_rules.json",
        "secret_class_manifest_ref": "data/analysis/secret_class_manifest.json",
        "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "gateway_surface_manifest_ref": "data/analysis/gateway_bff_surfaces.json",
        "design_contract_publication_ref": "data/analysis/design_contract_publication_bundles.json",
        "buildFamilies": build_families,
        "gateDefinitions": GATE_DEFINITIONS,
        "pipelineRuns": runs,
        "gateEvidence": gate_evidence_rows,
        "buildProvenanceRecords": provenance_records,
        "publishHooks": publish_hooks,
        "resolved_findings": [
            {
                "findingRef": "Finding 91",
                "closure": "Build provenance, parity, and publish gating now stay on one machine-readable release tuple.",
            },
            {
                "findingRef": "Finding 95",
                "closure": "Promotion hooks bind parity and recovery posture rather than green-job folklore.",
            },
            {
                "findingRef": "Finding 96",
                "closure": "Operations and governance builds now publish explicit blocked, quarantined, and revoked provenance states.",
            },
            {
                "findingRef": "Finding 103",
                "closure": "Dependency and standards watch evidence now ride inside the provenance and promotion record shape.",
            },
            {
                "findingRef": "Finding 104",
                "closure": "Continuity-proof and gate evidence are published as records, not commentary.",
            },
            {
                "findingRef": "Finding 112",
                "closure": "Promotion and publish decisions are machine-readable and fail closed when provenance or readiness drifts.",
            },
            {
                "findingRef": "Finding 113",
                "closure": "Assurance admissibility is anchored through immutable provenance, SBOM, and gate-evidence records.",
            },
        ],
        "assumptions": [
            {
                "assumptionRef": "ASSUMPTION_091_MOCK_SIGNING_IS_HMAC_SHAPED_LIKE_LIVE_ATTESTATION",
                "statement": "The mock-now rehearsal uses HMAC signing backed by the CI attestation secret class, while keeping the same canonical digest, quarantine, revocation, and publish-decision record shape that production KMS or HSM attestation will preserve later.",
            },
            {
                "assumptionRef": "ASSUMPTION_091_WORKSPACE_MANIFEST_PACKAGING_STANDS_IN_FOR_LATER_OCI_PACKAGES",
                "statement": "The local rehearsal packages deterministic workspace bundle manifests now; later OCI or regional registry packaging may swap transport format without changing artifact identity, provenance, or publish-decision law.",
            },
        ],
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
    }


def build_design_doc(manifest: dict[str, Any], dependency_policy: dict[str, Any]) -> str:
    summary = manifest["summary"]
    return dedent(
        f"""
        # 91 CI/CD And Build Provenance Design

        - Task: `{TASK_ID}`
        - Captured on: `{CAPTURED_ON}`
        - Generated at: `{GENERATED_AT}`
        - Visual mode: `{VISUAL_MODE}`

        `par_091` provisions the release-control delivery spine for deterministic build packaging, SBOM generation, dependency-policy checks, signed provenance, quarantine, revocation, supersession, and non-production promotion hooks.

        ## Frozen Outcomes

        - Workflows: `{summary['workflow_count']}`
        - Build families: `{summary['build_family_count']}`
        - Pipeline runs in the atlas: `{summary['pipeline_run_count']}`
        - Gate definitions: `{summary['gate_count']}`
        - Gate evidence rows: `{summary['gate_evidence_count']}`
        - Quarantine rules: `{summary['quarantine_rule_count']}`
        - Publish hooks: `{summary['publish_hook_count']}`

        ## Delivery Law

        - The active CI attestation secret class is `RELEASE_PROVENANCE_SIGNING_KEY_REF` from `par_089`. The rehearsal path loads it through `@vecells/runtime-secrets`; it is never checked into source or emitted into browser payloads.
        - `BuildProvenanceRecord.runtimeConsumptionState` is authoritative for publish eligibility. `verified + publishable` is required before publication or non-production promotion may proceed.
        - Quarantine, revocation, and supersession are first-class artifact states with machine-readable triggers and operator actions.
        - The release-control package exports deterministic signing, verification, and publish-decision helpers so workflows and local rehearsal code read the same law.

        ## Build Families

        {"".join(f"- `{row['buildFamilyRef']}`: {row['label']} ({', '.join(row['allowedEnvironmentRings'])})\\n" for row in manifest['buildFamilies'])}

        ## Dependency Policy

        - Policy id: `{dependency_policy['policyId']}`
        - Root package manager: `{dependency_policy['requiredRootPackageManager']}`
        - Lockfile: `{dependency_policy['requiredLockfilePath']}`
        - Internal dependency specifier: `{dependency_policy['requiredWorkspaceInternalSpecifier']}`

        ## Gap Closures

        - Green CI is no longer treated as publishable by itself; publication requires verified provenance plus the machine-readable publish decision.
        - Signing is no longer a timestamp-only gesture; provenance now has signature digest, quarantine triggers, revocation handling, and supersession history.
        - Manual deployment bypass is modeled explicitly and fails closed to `blocked`.
        - Dependency policy drift is bound to SBOM generation and publish gating instead of living as advisory commentary.
        - Local rehearsal uses the same secret class, gate sequence, record shape, and publish refusal logic the CI workflows use.

        ## Follow-on Boundaries

        {"".join(f"- `{row['dependencyRef']}` owned by `{row['owningTaskRef']}`: {row['scope']}\\n" for row in manifest['follow_on_dependencies'])}
        """
    ).strip()


def build_rules_doc(quarantine_policy: dict[str, Any]) -> str:
    return dedent(
        f"""
        # 91 Artifact Signing, Quarantine, And Publish Rules

        ## Non-negotiable rules

        - Unverified artifacts may not be published or promoted.
        - Quarantined, revoked, superseded, or blocked artifacts fail closed for runtime consumption.
        - Provenance verification state, quarantine reasons, and publish decisions must remain machine-readable.
        - Manual deployment or environment promotion may not bypass the provenance verifier.
        - Dependency policy and SBOM drift are publish blockers, not dashboard notes.

        ## Quarantine rules

        {"".join(f"- `{row['triggerRef']}` -> `{row['artifactState']}` / `{row['runtimeConsumptionState']}` / `{row['operatorAction']}`\\n" for row in quarantine_policy['rules'])}

        ## Workflow posture

        - `build-provenance-ci.yml` runs deterministic install, build, check, provenance rehearsal, and provenance verification.
        - `nonprod-provenance-promotion.yml` only promotes into `integration` or `preprod`, and only after provenance verification and publish decision approval succeed.
        - The local rehearsal scripts generate the same record set and decision states without requiring a dashboard, managed registry, or manual environment toggles.

        ## Production hardening later

        - Replace HMAC signing with managed KMS or HSM attestation without changing `BuildProvenanceRecord` identity, digest, state transitions, or quarantine law.
        - Replace workspace bundle manifests with OCI or regional registry packaging without changing artifact digests, publish decisions, or supersession semantics.
        - Bind final `RuntimePublicationBundle` publication and live watch tuple actioning through `par_094` and `par_097` without weakening the fail-closed contract created here.
        """
    ).strip()


def build_atlas_html(
    manifest: dict[str, Any],
    matrix_rows: list[dict[str, Any]],
    quarantine_policy: dict[str, Any],
) -> str:
    pack = {
        "manifest": manifest,
        "matrixRows": matrix_rows,
        "quarantinePolicy": quarantine_policy,
    }
    data_json = json.dumps(pack, separators=(",", ":"))
    return dedent(
        f"""
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Build Provenance Pipeline Atlas</title>
            <style>
              :root {{
                --canvas: #F7F9FC;
                --panel: #FFFFFF;
                --rail: #EEF2F7;
                --inset: #F4F7FB;
                --text-strong: #0F172A;
                --text: #1E293B;
                --muted: #64748B;
                --border: #E2E8F0;
                --build: #2563EB;
                --provenance: #0EA5A4;
                --quarantine: #C24141;
                --warning: #D97706;
                --published: #059669;
                --revoked: #7C3AED;
                --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
              }}
              * {{
                box-sizing: border-box;
              }}
              body {{
                margin: 0;
                background: linear-gradient(180deg, var(--canvas), #eef4fb);
                color: var(--text);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              }}
              body[data-reduced-motion="true"] * {{
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
              }}
              .page {{
                max-width: 1580px;
                margin: 0 auto;
                padding: 24px;
              }}
              header {{
                position: sticky;
                top: 0;
                z-index: 4;
                display: grid;
                grid-template-columns: 1.2fr repeat(4, minmax(0, 1fr));
                gap: 16px;
                min-height: 76px;
                padding: 16px 20px;
                background: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(16px);
                border-bottom: 1px solid var(--border);
              }}
              .wordmark {{
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 700;
                color: var(--text-strong);
              }}
              .monogram {{
                width: 40px;
                height: 40px;
                border-radius: 12px;
                background: linear-gradient(135deg, var(--build), var(--provenance));
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 14px;
                letter-spacing: 0.08em;
              }}
              .stat {{
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 12px 14px;
                box-shadow: var(--shadow);
              }}
              .stat-label {{
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }}
              .stat-value {{
                display: block;
                margin-top: 6px;
                color: var(--text-strong);
                font-size: 24px;
                font-weight: 700;
              }}
              .layout {{
                display: grid;
                grid-template-columns: 324px minmax(0, 1fr) 420px;
                gap: 20px;
                align-items: start;
                margin-top: 20px;
              }}
              nav, .canvas-panel, aside, .table-panel {{
                background: var(--panel);
                border: 1px solid var(--border);
                border-radius: 20px;
                box-shadow: var(--shadow);
              }}
              nav {{
                padding: 18px;
                position: sticky;
                top: 92px;
              }}
              .filter-group {{
                display: grid;
                gap: 10px;
                margin-bottom: 14px;
              }}
              .filter-group label {{
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }}
              select {{
                height: 44px;
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 0 12px;
                background: var(--inset);
                color: var(--text);
              }}
              main {{
                display: grid;
                gap: 20px;
              }}
              .canvas-panel {{
                padding: 18px;
                min-height: 320px;
              }}
              .panel-title {{
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: 12px;
                margin-bottom: 14px;
              }}
              .panel-title h2 {{
                margin: 0;
                font-size: 18px;
                color: var(--text-strong);
              }}
              .panel-title span {{
                color: var(--muted);
                font-size: 12px;
              }}
              .lane {{
                display: grid;
                grid-template-columns: repeat(8, minmax(0, 1fr));
                gap: 12px;
              }}
              .lane-step {{
                padding: 14px;
                border-radius: 16px;
                background: linear-gradient(180deg, var(--inset), #fff);
                border: 1px solid var(--border);
              }}
              .lane-step strong {{
                display: block;
                color: var(--text-strong);
                margin-bottom: 6px;
              }}
              .card-wall {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 14px;
              }}
              .run-card, .timeline-button, .row-button {{
                width: 100%;
                text-align: left;
                border: 1px solid var(--border);
                background: #fff;
                border-radius: 16px;
                cursor: pointer;
                color: inherit;
                transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
              }}
              .run-card:hover, .timeline-button:hover, .row-button:hover,
              .run-card:focus-visible, .timeline-button:focus-visible, .row-button:focus-visible {{
                outline: none;
                transform: translateY(-1px);
                box-shadow: 0 12px 24px rgba(37, 99, 235, 0.12);
                border-color: var(--build);
              }}
              .run-card[data-selected="true"], .timeline-button[data-selected="true"], tr[data-selected="true"] .row-button {{
                border-color: var(--build);
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
              }}
              .run-card {{
                padding: 16px;
                display: grid;
                gap: 10px;
              }}
              .card-top {{
                display: flex;
                justify-content: space-between;
                gap: 12px;
              }}
              .card-mono {{
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                font-size: 12px;
                color: var(--muted);
              }}
              .badge {{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 88px;
                padding: 6px 10px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                color: #fff;
              }}
              .badge-publishable, .badge-verified {{
                background: var(--published);
              }}
              .badge-quarantined {{
                background: var(--quarantine);
              }}
              .badge-revoked {{
                background: var(--revoked);
              }}
              .badge-superseded {{
                background: var(--warning);
              }}
              .badge-blocked, .badge-drifted {{
                background: var(--build);
              }}
              .timeline {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 12px;
              }}
              .timeline-button {{
                padding: 14px;
                background: linear-gradient(180deg, #fff, var(--inset));
              }}
              aside {{
                padding: 18px;
                position: sticky;
                top: 92px;
              }}
              .inspector-grid {{
                display: grid;
                gap: 12px;
              }}
              .inspector-block {{
                background: var(--inset);
                border: 1px solid var(--border);
                border-radius: 16px;
                padding: 14px;
              }}
              .inspector-block h3 {{
                margin: 0 0 8px;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--muted);
              }}
              .lower-grid {{
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 20px;
              }}
              .table-panel {{
                padding: 18px;
              }}
              table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
              }}
              th, td {{
                padding: 10px 8px;
                border-bottom: 1px solid var(--border);
                vertical-align: top;
              }}
              th {{
                text-align: left;
                color: var(--muted);
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }}
              .sr-only {{
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
              }}
              @media (max-width: 1240px) {{
                .layout {{
                  grid-template-columns: 280px minmax(0, 1fr);
                }}
                aside {{
                  grid-column: 1 / -1;
                  position: static;
                }}
                .lower-grid {{
                  grid-template-columns: 1fr;
                }}
                .lane {{
                  grid-template-columns: repeat(4, minmax(0, 1fr));
                }}
              }}
              @media (max-width: 860px) {{
                header {{
                  grid-template-columns: 1fr 1fr;
                }}
                .layout {{
                  grid-template-columns: 1fr;
                }}
                nav {{
                  position: static;
                }}
                .lane {{
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }}
              }}
            </style>
          </head>
          <body>
            <div class="page">
              <header>
                <div class="wordmark">
                  <div class="monogram" aria-hidden="true">BP</div>
                  <div>
                    <div>Vecells</div>
                    <div class="card-mono">Build_Provenance_Pipeline_Atlas</div>
                  </div>
                </div>
                <div class="stat">
                  <span class="stat-label">Active Build</span>
                  <span class="stat-value" id="stat-active-build">-</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Quarantined Artifacts</span>
                  <span class="stat-value" id="stat-quarantined">-</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Revoked Artifacts</span>
                  <span class="stat-value" id="stat-revoked">-</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Gate Failure Alerts</span>
                  <span class="stat-value" id="stat-alerts">-</span>
                </div>
              </header>
              <div class="layout">
                <nav aria-label="Pipeline filters">
                  <div class="filter-group">
                    <label for="filter-environment">Environment</label>
                    <select id="filter-environment" data-testid="filter-environment"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-gate">Gate</label>
                    <select id="filter-gate" data-testid="filter-gate"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-artifact-state">Artifact state</label>
                    <select id="filter-artifact-state" data-testid="filter-artifact-state"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-provenance-state">Provenance state</label>
                    <select id="filter-provenance-state" data-testid="filter-provenance-state"></select>
                  </div>
                  <div class="filter-group">
                    <label for="filter-build-family">Build family</label>
                    <select id="filter-build-family" data-testid="filter-build-family"></select>
                  </div>
                </nav>
                <main>
                  <section class="canvas-panel" data-testid="pipeline-lane" aria-labelledby="lane-title">
                    <div class="panel-title">
                      <h2 id="lane-title">Pipeline lane</h2>
                      <span id="lane-parity">0 visible gates</span>
                    </div>
                    <div class="lane" id="lane"></div>
                    <div class="sr-only" id="lane-text-parity"></div>
                  </section>
                  <section class="canvas-panel" data-testid="provenance-card-wall" aria-labelledby="card-title">
                    <div class="panel-title">
                      <h2 id="card-title">Provenance state cards</h2>
                      <span id="card-parity">0 visible builds</span>
                    </div>
                    <div class="card-wall" id="card-wall"></div>
                    <div class="sr-only" id="card-text-parity"></div>
                  </section>
                  <section class="canvas-panel" data-testid="decision-timeline" aria-labelledby="timeline-title">
                    <div class="panel-title">
                      <h2 id="timeline-title">Quarantine and publish timeline</h2>
                      <span id="timeline-parity">0 visible decisions</span>
                    </div>
                    <div class="timeline" id="timeline"></div>
                    <div class="sr-only" id="timeline-text-parity"></div>
                  </section>
                  <div class="lower-grid">
                    <section class="table-panel" data-testid="run-table">
                      <div class="panel-title">
                        <h2>Pipeline runs</h2>
                        <span id="run-table-parity">0 rows</span>
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Run</th>
                            <th>Ring</th>
                            <th>State</th>
                            <th>Gate</th>
                          </tr>
                        </thead>
                        <tbody id="run-table-body"></tbody>
                      </table>
                    </section>
                    <section class="table-panel" data-testid="policy-table">
                      <div class="panel-title">
                        <h2>Provenance and policy</h2>
                        <span id="policy-table-parity">0 rules</span>
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Trigger</th>
                            <th>Artifact</th>
                            <th>Runtime</th>
                            <th>Decision</th>
                          </tr>
                        </thead>
                        <tbody id="policy-table-body"></tbody>
                      </table>
                    </section>
                  </div>
                </main>
                <aside data-testid="inspector" aria-labelledby="inspector-title">
                  <div class="panel-title">
                    <h2 id="inspector-title">Inspector</h2>
                    <span id="inspector-subtitle">Select a build</span>
                  </div>
                  <div class="inspector-grid" id="inspector-grid"></div>
                </aside>
              </div>
            </div>
            <script>
              const PACK = {data_json};
              const RUNS = PACK.manifest.pipelineRuns;
              const GATES = PACK.manifest.gateDefinitions;
              const RULES = PACK.quarantinePolicy.rules;
              const FAMILY_MAP = Object.fromEntries(PACK.manifest.buildFamilies.map((row) => [row.buildFamilyRef, row]));
              const GATE_MAP = Object.fromEntries(GATES.map((row) => [row.gateRef, row]));
              const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              document.body.setAttribute("data-reduced-motion", REDUCED_MOTION ? "true" : "false");

              const filters = {{
                environment: document.querySelector("[data-testid='filter-environment']"),
                gate: document.querySelector("[data-testid='filter-gate']"),
                artifactState: document.querySelector("[data-testid='filter-artifact-state']"),
                provenanceState: document.querySelector("[data-testid='filter-provenance-state']"),
                buildFamily: document.querySelector("[data-testid='filter-build-family']"),
              }};

              const lane = document.getElementById("lane");
              const cardWall = document.getElementById("card-wall");
              const timeline = document.getElementById("timeline");
              const runTableBody = document.getElementById("run-table-body");
              const policyTableBody = document.getElementById("policy-table-body");
              const inspectorGrid = document.getElementById("inspector-grid");

              let selectedRunId = RUNS[0]?.pipelineExecutionRef ?? null;

              function uniqueValues(items, key) {{
                return [...new Set(items.map((item) => item[key]).filter(Boolean))];
              }}

              function buildOptions(select, values) {{
                select.innerHTML = "";
                const all = document.createElement("option");
                all.value = "all";
                all.textContent = "All";
                select.appendChild(all);
                values.forEach((value) => {{
                  const option = document.createElement("option");
                  option.value = value;
                  option.textContent = value;
                  select.appendChild(option);
                }});
              }}

              function filteredRuns() {{
                return RUNS.filter((run) => {{
                  return (
                    (filters.environment.value === "all" || run.environmentRing === filters.environment.value) &&
                    (filters.gate.value === "all" || run.dominantGateRef === filters.gate.value) &&
                    (filters.artifactState.value === "all" || run.artifactState === filters.artifactState.value) &&
                    (filters.provenanceState.value === "all" || run.provenanceState === filters.provenanceState.value) &&
                    (filters.buildFamily.value === "all" || run.buildFamilyRef === filters.buildFamily.value)
                  );
                }});
              }}

              function makeBadge(value) {{
                const span = document.createElement("span");
                span.className = `badge badge-${{value}}`;
                span.textContent = value;
                return span;
              }}

              function ensureSelection(rows) {{
                if (!rows.some((row) => row.pipelineExecutionRef === selectedRunId)) {{
                  selectedRunId = rows[0]?.pipelineExecutionRef ?? null;
                }}
              }}

              function renderLane(rows) {{
                lane.innerHTML = "";
                GATES.forEach((gate) => {{
                  const count = rows.filter((row) => row.dominantGateRef === gate.gateRef).length;
                  const blocked = rows.filter(
                    (row) => row.dominantGateRef === gate.gateRef && row.provenanceState !== "verified",
                  ).length;
                  const card = document.createElement("div");
                  card.className = "lane-step";
                  card.innerHTML = `<strong>${{gate.label}}</strong><div>${{count}} visible builds</div><div class="card-mono">${{blocked}} non-green states</div>`;
                  lane.appendChild(card);
                }});
                document.getElementById("lane-parity").textContent = `${{GATES.length}} visible gates`;
                document.getElementById("lane-text-parity").textContent = `Visible gate count ${{GATES.length}}.`;
              }}

              function renderCards(rows) {{
                cardWall.innerHTML = "";
                rows.forEach((row) => {{
                  const family = FAMILY_MAP[row.buildFamilyRef];
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "run-card";
                  button.dataset.testid = `provenance-card-${{row.pipelineExecutionRef}}`;
                  button.dataset.selected = String(row.pipelineExecutionRef === selectedRunId);
                  button.innerHTML = `
                    <div class="card-top">
                      <div>
                        <div><strong>${{family.label}}</strong></div>
                        <div class="card-mono">${{row.pipelineExecutionRef}}</div>
                      </div>
                      <span class="badge badge-${{row.provenanceState}}">${{row.provenanceState}}</span>
                    </div>
                    <div>${{row.environmentRing}} · ${{GATE_MAP[row.dominantGateRef].label}}</div>
                    <div class="card-top">
                      <span class="badge badge-${{row.artifactState}}">${{row.artifactState}}</span>
                      <span class="card-mono">${{row.buildProvenanceRecordRef}}</span>
                    </div>
                  `;
                  button.addEventListener("click", () => {{
                    selectedRunId = row.pipelineExecutionRef;
                    render();
                  }});
                  cardWall.appendChild(button);
                }});
                document.getElementById("card-parity").textContent = `${{rows.length}} visible builds`;
                document.getElementById("card-text-parity").textContent = `Visible build count ${{rows.length}}.`;
              }}

              function renderTimeline(rows) {{
                timeline.innerHTML = "";
                rows.forEach((row) => {{
                  const button = document.createElement("button");
                  button.type = "button";
                  button.className = "timeline-button";
                  button.dataset.testid = `timeline-item-${{row.pipelineExecutionRef}}`;
                  button.dataset.selected = String(row.pipelineExecutionRef === selectedRunId);
                  button.innerHTML = `
                    <div><strong>${{row.environmentRing}}</strong></div>
                    <div>${{row.decisionState}}</div>
                    <div class="card-mono">${{row.quarantineReasonRefs.join(", ") || "clean publish path"}}</div>
                  `;
                  button.addEventListener("click", () => {{
                    selectedRunId = row.pipelineExecutionRef;
                    render();
                  }});
                  timeline.appendChild(button);
                }});
                document.getElementById("timeline-parity").textContent = `${{rows.length}} visible decisions`;
                document.getElementById("timeline-text-parity").textContent = `Visible decision count ${{rows.length}}.`;
              }}

              function moveSelection(fromRunId, delta, rows) {{
                const index = rows.findIndex((row) => row.pipelineExecutionRef === fromRunId);
                const next = rows[index + delta];
                if (next) {{
                  selectedRunId = next.pipelineExecutionRef;
                  render();
                  const button = document.querySelector(`[data-testid="run-row-${{next.pipelineExecutionRef}}"] .row-button`);
                  if (button) {{
                    button.focus();
                  }}
                }}
              }}

              function renderRunTable(rows) {{
                runTableBody.innerHTML = "";
                rows.forEach((row) => {{
                  const tr = document.createElement("tr");
                  tr.dataset.testid = `run-row-${{row.pipelineExecutionRef}}`;
                  tr.dataset.selected = String(row.pipelineExecutionRef === selectedRunId);
                  tr.innerHTML = `
                    <td>
                      <button type="button" class="row-button">
                        <strong>${{row.pipelineExecutionRef}}</strong>
                      </button>
                    </td>
                    <td>${{row.environmentRing}}</td>
                    <td></td>
                    <td>${{GATE_MAP[row.dominantGateRef].label}}</td>
                  `;
                  const cell = tr.children[2];
                  cell.appendChild(makeBadge(row.provenanceState));
                  const button = tr.querySelector(".row-button");
                  button.addEventListener("click", () => {{
                    selectedRunId = row.pipelineExecutionRef;
                    render();
                  }});
                  button.addEventListener("keydown", (event) => {{
                    if (event.key === "ArrowDown") {{
                      event.preventDefault();
                      moveSelection(row.pipelineExecutionRef, 1, rows);
                    }}
                    if (event.key === "ArrowUp") {{
                      event.preventDefault();
                      moveSelection(row.pipelineExecutionRef, -1, rows);
                    }}
                  }});
                  runTableBody.appendChild(tr);
                }});
                document.getElementById("run-table-parity").textContent = `${{rows.length}} rows`;
              }}

              function renderPolicyTable() {{
                policyTableBody.innerHTML = "";
                RULES.forEach((rule) => {{
                  const tr = document.createElement("tr");
                  tr.innerHTML = `
                    <td>${{rule.triggerRef}}</td>
                    <td>${{rule.artifactState}}</td>
                    <td>${{rule.runtimeConsumptionState}}</td>
                    <td>${{rule.publishDecisionState}}</td>
                  `;
                  policyTableBody.appendChild(tr);
                }});
                document.getElementById("policy-table-parity").textContent = `${{RULES.length}} rules`;
              }}

              function renderInspector(rows) {{
                const selected = rows.find((row) => row.pipelineExecutionRef === selectedRunId) ?? rows[0];
                if (!selected) {{
                  inspectorGrid.innerHTML = "<div class='inspector-block'><h3>No build selected</h3><div>Filter combinations hid every build.</div></div>";
                  return;
                }}
                const family = FAMILY_MAP[selected.buildFamilyRef];
                const reasons = selected.quarantineReasonRefs.length
                  ? selected.quarantineReasonRefs.join(", ")
                  : "No quarantine or block reasons.";
                document.getElementById("inspector-subtitle").textContent = selected.pipelineExecutionRef;
                inspectorGrid.innerHTML = `
                  <div class="inspector-block">
                    <h3>Build identity</h3>
                    <div><strong>${{family.label}}</strong></div>
                    <div class="card-mono">${{selected.buildProvenanceRecordRef}}</div>
                    <div>${{selected.environmentRing}} · ${{selected.releaseRef}}</div>
                  </div>
                  <div class="inspector-block">
                    <h3>State</h3>
                    <div>${{selected.artifactState}} artifact</div>
                    <div>${{selected.provenanceState}} provenance</div>
                    <div>${{selected.runtimeConsumptionState}} runtime consumption</div>
                  </div>
                  <div class="inspector-block">
                    <h3>Gate and decision</h3>
                    <div>${{GATE_MAP[selected.dominantGateRef].label}}</div>
                    <div>${{selected.decisionState}}</div>
                    <div class="card-mono">${{reasons}}</div>
                  </div>
                  <div class="inspector-block">
                    <h3>Tuple refs</h3>
                    <div class="card-mono">${{selected.runtimePublicationBundleRef}}</div>
                    <div class="card-mono">${{selected.releasePublicationParityRef}}</div>
                    <div class="card-mono">${{selected.releaseContractVerificationMatrixRef}}</div>
                  </div>
                `;
              }}

              function renderStats(rows) {{
                const active = rows.find((row) => row.provenanceState === "verified") ?? rows[0];
                document.getElementById("stat-active-build").textContent = active ? active.pipelineExecutionRef : "none";
                document.getElementById("stat-quarantined").textContent = rows.filter((row) => row.artifactState === "quarantined").length;
                document.getElementById("stat-revoked").textContent = rows.filter((row) => row.artifactState === "revoked").length;
                document.getElementById("stat-alerts").textContent = rows.filter((row) => row.provenanceState !== "verified").length;
              }}

              function render() {{
                const rows = filteredRuns();
                ensureSelection(rows);
                renderLane(rows);
                renderCards(rows);
                renderTimeline(rows);
                renderRunTable(rows);
                renderPolicyTable();
                renderInspector(rows);
                renderStats(rows);
              }}

              buildOptions(filters.environment, uniqueValues(RUNS, "environmentRing"));
              buildOptions(filters.gate, uniqueValues(RUNS, "dominantGateRef"));
              buildOptions(filters.artifactState, uniqueValues(RUNS, "artifactState"));
              buildOptions(filters.provenanceState, uniqueValues(RUNS, "provenanceState"));
              buildOptions(filters.buildFamily, uniqueValues(RUNS, "buildFamilyRef"));
              Object.values(filters).forEach((select) => select.addEventListener("change", render));
              renderPolicyTable();
              render();
            </script>
          </body>
        </html>
        """
    ).strip()


def build_spec_js(manifest: dict[str, Any], matrix_rows: list[dict[str, Any]]) -> str:
    expected_runs = manifest["summary"]["pipeline_run_count"]
    expected_rules = len(QUARANTINE_RULES)
    return dedent(
        f"""
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import {{ fileURLToPath }} from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "91_build_provenance_pipeline_atlas.html");
        const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "build_provenance_manifest.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "pipeline_gate_matrix.csv");
        const POLICY_PATH = path.join(ROOT, "data", "analysis", "artifact_quarantine_policy.json");

        export const buildProvenancePipelineAtlasCoverage = [
          "filter behavior and synchronized selection",
          "keyboard navigation and focus management",
          "reduced-motion handling",
          "responsive layout at desktop and tablet widths",
          "accessibility smoke checks and landmark verification",
          "verification that quarantined, revoked, and published states are visually and semantically distinct",
        ];

        function assertCondition(condition, message) {{
          if (!condition) {{
            throw new Error(message);
          }}
        }}

        function parseCsv(text) {{
          const rows = [];
          let row = [];
          let cell = "";
          let inQuotes = false;
          for (let index = 0; index < text.length; index += 1) {{
            const char = text[index];
            const next = text[index + 1];
            if (char === '"' && inQuotes && next === '"') {{
              cell += '"';
              index += 1;
              continue;
            }}
            if (char === '"') {{
              inQuotes = !inQuotes;
              continue;
            }}
            if (char === "," && !inQuotes) {{
              row.push(cell);
              cell = "";
              continue;
            }}
            if ((char === "\\n" || char === "\\r") && !inQuotes) {{
              if (char === "\\r" && next === "\\n") {{
                index += 1;
              }}
              row.push(cell);
              if (row.some((value) => value.length > 0)) {{
                rows.push(row);
              }}
              row = [];
              cell = "";
              continue;
            }}
            cell += char;
          }}
          if (cell.length || row.length) {{
            row.push(cell);
            rows.push(row);
          }}
          const [headers, ...body] = rows;
          return body.map((values) =>
            Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
          );
        }}

        async function importPlaywright() {{
          try {{
            return await import("playwright");
          }} catch {{
            throw new Error("This spec needs the `playwright` package when run with --run.");
          }}
        }}

        function serve(rootDir) {{
          const server = http.createServer((request, response) => {{
            const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
            let pathname = decodeURIComponent(requestUrl.pathname);
            if (pathname === "/") {{
              pathname = "/docs/architecture/91_build_provenance_pipeline_atlas.html";
            }}
            const filePath = path.join(rootDir, pathname);
            if (!filePath.startsWith(rootDir)) {{
              response.writeHead(403);
              response.end("forbidden");
              return;
            }}
            fs.readFile(filePath, (error, buffer) => {{
              if (error) {{
                response.writeHead(404);
                response.end("not found");
                return;
              }}
              const extension = path.extname(filePath);
              const type =
                extension === ".html"
                  ? "text/html"
                  : extension === ".json"
                    ? "application/json"
                    : extension === ".csv"
                      ? "text/csv"
                      : "text/plain";
              response.writeHead(200, {{ "Content-Type": type }});
              response.end(buffer);
            }});
          }});
          return new Promise((resolve, reject) => {{
            server.listen(0, "127.0.0.1", () => {{
              const address = server.address();
              if (!address || typeof address === "string") {{
                reject(new Error("Unable to bind local server."));
                return;
              }}
              resolve({{
                server,
                url: `http://127.0.0.1:${{address.port}}/docs/architecture/91_build_provenance_pipeline_atlas.html`,
              }});
            }});
          }});
        }}

        export async function run() {{
          assertCondition(fs.existsSync(HTML_PATH), "Build provenance atlas HTML is missing.");
          const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
          const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
          const policy = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));

          assertCondition(
            manifest.summary.pipeline_run_count === {expected_runs},
            "Pipeline run count drifted.",
          );
          assertCondition(matrix.length === {len(matrix_rows)}, "Pipeline gate matrix count drifted.");
          assertCondition(policy.rules.length === {expected_rules}, "Quarantine rule count drifted.");

          const {{ chromium }} = await importPlaywright();
          const {{ server, url }} = await serve(ROOT);
          const browser = await chromium.launch({{ headless: true }});

          try {{
            const page = await browser.newPage({{ viewport: {{ width: 1480, height: 1180 }} }});
            await page.goto(url, {{ waitUntil: "networkidle" }});

            await page.locator("[data-testid='pipeline-lane']").waitFor();
            await page.locator("[data-testid='provenance-card-wall']").waitFor();
            await page.locator("[data-testid='decision-timeline']").waitFor();
            await page.locator("[data-testid='run-table']").waitFor();
            await page.locator("[data-testid='policy-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            assertCondition(
              (await page.locator("[data-testid^='run-row-']").count()) === manifest.summary.pipeline_run_count,
              "Initial run-table row count drifted.",
            );

            await page.locator("[data-testid='filter-environment']").selectOption("integration");
            await page.locator("[data-testid='filter-provenance-state']").selectOption("quarantined");
            assertCondition(
              (await page.locator("[data-testid^='run-row-']").count()) === 1,
              "Environment + provenance filter drifted.",
            );

            await page.locator("[data-testid='filter-environment']").selectOption("all");
            await page.locator("[data-testid='filter-provenance-state']").selectOption("all");
            await page.locator("[data-testid='filter-artifact-state']").selectOption("revoked");
            assertCondition(
              (await page.locator("[data-testid^='run-row-']").count()) === 1,
              "Artifact-state filter drifted.",
            );

            await page.locator("[data-testid='filter-artifact-state']").selectOption("all");
            await page.locator("[data-testid='filter-gate']").selectOption("provenance_verify");
            const provenanceVerifyRows = await page.locator("[data-testid^='run-row-']").count();
            assertCondition(provenanceVerifyRows === 3, "Gate filter drifted.");

            await page.locator("[data-testid='filter-gate']").selectOption("all");
            await page.locator("[data-testid='filter-build-family']").selectOption("bf_release_control_bundle");
            assertCondition(
              (await page.locator("[data-testid^='run-row-']").count()) === 2,
              "Build-family filter drifted.",
            );

            await page.locator("[data-testid='filter-build-family']").selectOption("all");
            await page
              .locator("[data-testid='run-row-run_gateway_integration_quarantined_dependency'] .row-button")
              .click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(
              inspectorText.includes("run_gateway_integration_quarantined_dependency") &&
                inspectorText.includes("DEPENDENCY_POLICY_BLOCKED"),
              "Inspector lost synchronized selection detail.",
            );
            const cardSelected = await page
              .locator("[data-testid='provenance-card-run_gateway_integration_quarantined_dependency']")
              .getAttribute("data-selected");
            assertCondition(cardSelected === "true", "Card selection did not synchronize.");
            const timelineSelected = await page
              .locator("[data-testid='timeline-item-run_gateway_integration_quarantined_dependency']")
              .getAttribute("data-selected");
            assertCondition(timelineSelected === "true", "Timeline selection did not synchronize.");

            const publishedColor = await page.evaluate(() => {{
              const node = document.querySelector(
                "[data-testid='provenance-card-run_foundation_ci_preview_verified'] .badge-verified",
              );
              return node ? getComputedStyle(node).backgroundColor : "";
            }});
            const quarantinedColor = await page.evaluate(() => {{
              const card = document.querySelector(
                "[data-testid='provenance-card-run_gateway_integration_quarantined_dependency']",
              );
              const node = card?.querySelector(".badge-quarantined");
              return node ? getComputedStyle(node).backgroundColor : "";
            }});
            const revokedColor = await page.evaluate(() => {{
              const card = document.querySelector(
                "[data-testid='provenance-card-run_command_preprod_revoked']",
              );
              const node = card?.querySelector(".badge-revoked");
              return node ? getComputedStyle(node).backgroundColor : "";
            }});
            assertCondition(
              publishedColor !== quarantinedColor && quarantinedColor !== revokedColor,
              "Published, quarantined, and revoked states are no longer visually distinct.",
            );

            await page.locator("[data-testid='run-row-run_foundation_ci_preview_verified'] .row-button").focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator("[data-testid='run-row-run_gateway_integration_quarantined_dependency']")
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance visible selection.");

            await page.setViewportSize({{ width: 980, height: 900 }});
            assertCondition(
              await page.locator("[data-testid='inspector']").isVisible(),
              "Inspector disappeared on tablet width.",
            );

            const motionPage = await browser.newPage({{ viewport: {{ width: 1280, height: 900 }} }});
            try {{
              await motionPage.emulateMedia({{ reducedMotion: "reduce" }});
              await motionPage.goto(url, {{ waitUntil: "networkidle" }});
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            }} finally {{
              await motionPage.close();
            }}

            const landmarks = await page.locator("header, nav, main, aside, section").count();
            assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${{landmarks}}.`);
          }} finally {{
            await browser.close();
            await new Promise((resolve, reject) =>
              server.close((error) => (error ? reject(error) : resolve())),
            );
          }}
        }}

        if (process.argv.includes("--run")) {{
          run().catch((error) => {{
            console.error(error);
            process.exitCode = 1;
          }});
        }}
        """
    ).strip()


def build_release_controls_source() -> str:
    return dedent(
        """
        export type ProvenanceArtifactState =
          | "packaged"
          | "publishable"
          | "quarantined"
          | "revoked"
          | "superseded"
          | "blocked";

        export type BuildProvenanceState =
          | "verified"
          | "quarantined"
          | "revoked"
          | "superseded"
          | "drifted";

        export type RuntimeConsumptionState =
          | "publishable"
          | "quarantined"
          | "revoked"
          | "superseded"
          | "blocked";

        export type BuildGateState = "passed" | "blocked" | "quarantined";
        export type PublishDecisionState =
          | "approved"
          | "quarantined"
          | "revoked"
          | "superseded"
          | "blocked";

        export interface BuildArtifactDescriptor {
          artifactId: string;
          artifactKind: string;
          artifactDigest: string;
          artifactRoots: readonly string[];
        }

        export interface BuildGateEvidenceRecord {
          gateEvidenceRef: string;
          gateRef: string;
          gateLabel: string;
          state: BuildGateState;
          evidenceDigest: string;
        }

        export interface DependencyPolicyVerdictRecord {
          dependencyPolicyVerdictId: string;
          policyRef: string;
          decisionState: "passed" | "blocked";
          blockedReasonRefs: readonly string[];
          watchlistHash: string;
          evaluatedAt: string;
        }

        export interface ArtifactQuarantineRule {
          ruleRef: string;
          triggerRef: string;
          artifactState: ProvenanceArtifactState;
          runtimeConsumptionState: RuntimeConsumptionState;
          publishDecisionState: PublishDecisionState;
          supersessionAllowed: boolean;
          operatorAction: string;
        }

        export interface UnsignedBuildProvenanceRecord {
          buildProvenanceRecordId: string;
          buildFamilyRef: string;
          releaseRef: string;
          verificationScenarioRef: string;
          environmentRing: string;
          runtimeTopologyManifestRef: string;
          runtimePublicationBundleRef: string;
          releasePublicationParityRef: string;
          artifactDigests: readonly BuildArtifactDescriptor[];
          artifactSetDigest: string;
          sbomDigest: string;
          sbomRef: string;
          dependencyPolicyVerdictRef: string;
          gateEvidenceRefs: readonly string[];
          signingSecretClassRef: string;
          provenanceState: BuildProvenanceState;
          runtimeConsumptionState: RuntimeConsumptionState;
          artifactState: ProvenanceArtifactState;
          quarantineReasonRefs: readonly string[];
          revokedAt: string | null;
          revocationReasonRef: string | null;
          supersededByBuildProvenanceRecordRef: string | null;
          signedAt: string;
        }

        export interface SignedBuildProvenanceRecord extends UnsignedBuildProvenanceRecord {
          signatureAlgorithm: "hmac-sha256-mock-safe-v1";
          canonicalDigest: string;
          signature: string;
        }

        export interface BuildProvenanceVerificationResult {
          verified: boolean;
          canonicalDigest: string;
          issues: readonly { code: string; message: string }[];
          artifactState: ProvenanceArtifactState;
          runtimeConsumptionState: RuntimeConsumptionState;
        }

        export interface ArtifactPublishDecision {
          decisionState: PublishDecisionState;
          artifactState: ProvenanceArtifactState;
          runtimeConsumptionState: RuntimeConsumptionState;
          blockerRefs: readonly string[];
          quarantineRuleRef: string | null;
        }

        function stableStringify(value: unknown): string {
          if (value === null || typeof value !== "object") {
            return JSON.stringify(value);
          }
          if (Array.isArray(value)) {
            return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
          }
          const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
            left.localeCompare(right),
          );
          return `{${entries
            .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
            .join(",")}}`;
        }

        function fnv64(value: string, seed: bigint): string {
          let hash = seed;
          for (let index = 0; index < value.length; index += 1) {
            hash ^= BigInt(value.charCodeAt(index));
            hash = (hash * 1099511628211n) & 0xffffffffffffffffn;
          }
          return hash.toString(16).padStart(16, "0");
        }

        export function stableDigest(value: unknown): string {
          const encoded = stableStringify(value);
          return [
            fnv64(encoded, 1469598103934665603n),
            fnv64(`${encoded}::vecells`, 1099511628211n),
            fnv64(encoded.split("").reverse().join(""), 7809847782465536322n),
            fnv64(`sig::${encoded.length}`, 11400714785074694791n),
          ].join("");
        }

        function createMockSignature(signingKey: string, canonicalDigest: string): string {
          return stableDigest({
            signingKey,
            canonicalDigest,
            purpose: "vecells-build-provenance",
          });
        }

        function timingSafeCompare(left: string, right: string): boolean {
          if (left.length !== right.length) {
            return false;
          }
          let difference = 0;
          for (let index = 0; index < left.length; index += 1) {
            difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
          }
          return difference === 0;
        }

        function toUnsignedBuildProvenanceRecord(
          record: UnsignedBuildProvenanceRecord | SignedBuildProvenanceRecord,
        ): UnsignedBuildProvenanceRecord {
          return {
            buildProvenanceRecordId: record.buildProvenanceRecordId,
            buildFamilyRef: record.buildFamilyRef,
            releaseRef: record.releaseRef,
            verificationScenarioRef: record.verificationScenarioRef,
            environmentRing: record.environmentRing,
            runtimeTopologyManifestRef: record.runtimeTopologyManifestRef,
            runtimePublicationBundleRef: record.runtimePublicationBundleRef,
            releasePublicationParityRef: record.releasePublicationParityRef,
            artifactDigests: record.artifactDigests,
            artifactSetDigest: record.artifactSetDigest,
            sbomDigest: record.sbomDigest,
            sbomRef: record.sbomRef,
            dependencyPolicyVerdictRef: record.dependencyPolicyVerdictRef,
            gateEvidenceRefs: record.gateEvidenceRefs,
            signingSecretClassRef: record.signingSecretClassRef,
            provenanceState: record.provenanceState,
            runtimeConsumptionState: record.runtimeConsumptionState,
            artifactState: record.artifactState,
            quarantineReasonRefs: record.quarantineReasonRefs,
            revokedAt: record.revokedAt,
            revocationReasonRef: record.revocationReasonRef,
            supersededByBuildProvenanceRecordRef: record.supersededByBuildProvenanceRecordRef,
            signedAt: record.signedAt,
          };
        }

        export function signBuildProvenanceRecord(input: {
          record: UnsignedBuildProvenanceRecord | SignedBuildProvenanceRecord;
          signingKey: string;
        }): SignedBuildProvenanceRecord {
          const unsignedRecord = toUnsignedBuildProvenanceRecord(input.record);
          const canonicalDigest = stableDigest(unsignedRecord);
          const signature = createMockSignature(input.signingKey, canonicalDigest);
          return {
            ...unsignedRecord,
            signatureAlgorithm: "hmac-sha256-mock-safe-v1",
            canonicalDigest,
            signature,
          };
        }

        export function verifyBuildProvenanceRecord(input: {
          record: SignedBuildProvenanceRecord;
          signingKey: string;
          dependencyPolicyVerdict: DependencyPolicyVerdictRecord;
          gateEvidence: readonly BuildGateEvidenceRecord[];
        }): BuildProvenanceVerificationResult {
          const unsignedRecord = toUnsignedBuildProvenanceRecord(input.record);
          const canonicalDigest = stableDigest(unsignedRecord);
          const expectedSignature = createMockSignature(input.signingKey, canonicalDigest);
          const issues: { code: string; message: string }[] = [];

          if (input.record.canonicalDigest !== canonicalDigest) {
            issues.push({
              code: "CANONICAL_DIGEST_DRIFT",
              message: "Canonical digest drifted from the unsigned record.",
            });
          }

          if (!timingSafeCompare(expectedSignature, input.record.signature)) {
            issues.push({
              code: "SIGNATURE_MISMATCH",
              message: "Build provenance signature verification failed.",
            });
          }

          if (input.dependencyPolicyVerdict.decisionState !== "passed") {
            issues.push({
              code: "DEPENDENCY_POLICY_BLOCKED",
              message: "Dependency policy verdict is not passed.",
            });
          }

          if (input.gateEvidence.some((row) => row.state !== "passed")) {
            issues.push({
              code: "PIPELINE_GATE_BLOCKED",
              message: "One or more pipeline gates are not passed.",
            });
          }

          if (input.record.artifactState === "revoked" || input.record.provenanceState === "revoked") {
            issues.push({
              code: "PROVENANCE_REVOKED",
              message: "The build provenance record has been revoked.",
            });
          }

          if (
            input.record.artifactState === "superseded" ||
            input.record.provenanceState === "superseded"
          ) {
            issues.push({
              code: "PROVENANCE_SUPERSEDED",
              message: "The build provenance record has been superseded.",
            });
          }

          if (
            input.record.artifactState === "blocked" ||
            input.record.provenanceState === "drifted" ||
            input.record.runtimeConsumptionState === "blocked"
          ) {
            issues.push({
              code: "SCHEMA_SET_DRIFT",
              message: "The build provenance record is blocked by drift or blocked runtime posture.",
            });
          }

          let artifactState: ProvenanceArtifactState = input.record.artifactState;
          let runtimeConsumptionState: RuntimeConsumptionState = input.record.runtimeConsumptionState;

          if (issues.some((issue) => issue.code === "SIGNATURE_MISMATCH")) {
            artifactState = "quarantined";
            runtimeConsumptionState = "quarantined";
          } else if (issues.some((issue) => issue.code === "DEPENDENCY_POLICY_BLOCKED")) {
            artifactState = "quarantined";
            runtimeConsumptionState = "quarantined";
          } else if (issues.some((issue) => issue.code === "PROVENANCE_REVOKED")) {
            artifactState = "revoked";
            runtimeConsumptionState = "revoked";
          } else if (issues.some((issue) => issue.code === "PROVENANCE_SUPERSEDED")) {
            artifactState = "superseded";
            runtimeConsumptionState = "superseded";
          } else if (issues.some((issue) => issue.code === "SCHEMA_SET_DRIFT")) {
            artifactState = "blocked";
            runtimeConsumptionState = "blocked";
          }

          return {
            verified: issues.length === 0,
            canonicalDigest,
            issues,
            artifactState,
            runtimeConsumptionState,
          };
        }

        export function evaluateArtifactPublication(input: {
          verification: BuildProvenanceVerificationResult;
          quarantineRules: readonly ArtifactQuarantineRule[];
        }): ArtifactPublishDecision {
          if (input.verification.verified) {
            return {
              decisionState: "approved",
              artifactState: "publishable",
              runtimeConsumptionState: "publishable",
              blockerRefs: [],
              quarantineRuleRef: null,
            };
          }

          const issueCode = input.verification.issues[0]?.code ?? "PIPELINE_GATE_BLOCKED";
          const matchedRule = input.quarantineRules.find((rule) => rule.triggerRef === issueCode);
          if (!matchedRule) {
            return {
              decisionState: "blocked",
              artifactState: input.verification.artifactState,
              runtimeConsumptionState: input.verification.runtimeConsumptionState,
              blockerRefs: input.verification.issues.map((issue) => issue.code),
              quarantineRuleRef: null,
            };
          }

          return {
            decisionState: matchedRule.publishDecisionState,
            artifactState: matchedRule.artifactState,
            runtimeConsumptionState: matchedRule.runtimeConsumptionState,
            blockerRefs: input.verification.issues.map((issue) => issue.code),
            quarantineRuleRef: matchedRule.ruleRef,
          };
        }

        export function revokeBuildProvenanceRecord(input: {
          record: SignedBuildProvenanceRecord;
          reasonRef: string;
          revokedAt: string;
        }): SignedBuildProvenanceRecord {
          return {
            ...input.record,
            artifactState: "revoked",
            provenanceState: "revoked",
            runtimeConsumptionState: "revoked",
            revokedAt: input.revokedAt,
            revocationReasonRef: input.reasonRef,
            quarantineReasonRefs: Array.from(
              new Set([...input.record.quarantineReasonRefs, input.reasonRef]),
            ),
          };
        }

        export function supersedeBuildProvenanceRecord(input: {
          record: SignedBuildProvenanceRecord;
          supersededByBuildProvenanceRecordRef: string;
        }): SignedBuildProvenanceRecord {
          return {
            ...input.record,
            artifactState: "superseded",
            provenanceState: "superseded",
            runtimeConsumptionState: "superseded",
            supersededByBuildProvenanceRecordRef: input.supersededByBuildProvenanceRecordRef,
            quarantineReasonRefs: Array.from(
              new Set([...input.record.quarantineReasonRefs, "PROVENANCE_SUPERSEDED"]),
            ),
          };
        }

        export function createBuildProvenanceSimulationHarness() {
          const dependencyPolicyVerdict: DependencyPolicyVerdictRecord = {
            dependencyPolicyVerdictId: "dep-policy::simulated",
            policyRef: "dependency_policy_091_foundation_v1",
            decisionState: "passed",
            blockedReasonRefs: [],
            watchlistHash: stableDigest({ watchlist: "current" }),
            evaluatedAt: "2026-04-12T00:00:00+00:00",
          };
          const gateEvidence: BuildGateEvidenceRecord[] = [
            {
              gateEvidenceRef: "gate::build",
              gateRef: "build_package",
              gateLabel: "Deterministic build package",
              state: "passed",
              evidenceDigest: stableDigest({ gate: "build_package", state: "passed" }),
            },
            {
              gateEvidenceRef: "gate::verify",
              gateRef: "provenance_verify",
              gateLabel: "Provenance verify",
              state: "passed",
              evidenceDigest: stableDigest({ gate: "provenance_verify", state: "passed" }),
            },
          ];
          const record = signBuildProvenanceRecord({
            signingKey: "mock-safe-provenance-key",
            record: {
              buildProvenanceRecordId: "bpr::simulated",
              buildFamilyRef: "bf_release_control_bundle",
              releaseRef: "RC_CI_PREVIEW_V1",
              verificationScenarioRef: "VS_058_CI_PREVIEW_V1",
              environmentRing: "ci-preview",
              runtimeTopologyManifestRef: "data/analysis/runtime_topology_manifest.json",
              runtimePublicationBundleRef: "RPB_CI_PREVIEW_V1",
              releasePublicationParityRef: "parity::rc_ci_preview_v1",
              artifactDigests: [
                {
                  artifactId: "bf_release_control_bundle::bundle",
                  artifactKind: "control_plane_manifest",
                  artifactDigest: stableDigest("bf_release_control_bundle"),
                  artifactRoots: ["packages/release-controls", ".github/workflows"],
                },
              ],
              artifactSetDigest: stableDigest("bf_release_control_bundle::artifact-set"),
              sbomDigest: stableDigest("bf_release_control_bundle::sbom"),
              sbomRef: "sbom::simulated",
              dependencyPolicyVerdictRef: dependencyPolicyVerdict.dependencyPolicyVerdictId,
              gateEvidenceRefs: gateEvidence.map((row) => row.gateEvidenceRef),
              signingSecretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
              provenanceState: "verified",
              runtimeConsumptionState: "publishable",
              artifactState: "publishable",
              quarantineReasonRefs: [],
              revokedAt: null,
              revocationReasonRef: null,
              supersededByBuildProvenanceRecordRef: null,
              signedAt: "2026-04-12T00:00:00+00:00",
            },
          });
          const quarantineRules: ArtifactQuarantineRule[] = [
            {
              ruleRef: "qr_signature_invalid",
              triggerRef: "SIGNATURE_MISMATCH",
              artifactState: "quarantined",
              runtimeConsumptionState: "quarantined",
              publishDecisionState: "quarantined",
              supersessionAllowed: false,
              operatorAction: "quarantine_and_rebuild",
            },
          ];
          const verification = verifyBuildProvenanceRecord({
            record,
            signingKey: "mock-safe-provenance-key",
            dependencyPolicyVerdict,
            gateEvidence,
          });
          return {
            record,
            verification,
            publishDecision: evaluateArtifactPublication({ verification, quarantineRules }),
          };
        }
        """
    ).strip()


def build_release_controls_test() -> str:
    return dedent(
        """
        import { describe, expect, it } from "vitest";
        import {
          createBuildProvenanceSimulationHarness,
          evaluateArtifactPublication,
          signBuildProvenanceRecord,
          verifyBuildProvenanceRecord,
          type ArtifactQuarantineRule,
          type DependencyPolicyVerdictRecord,
          type BuildGateEvidenceRecord,
        } from "../src/build-provenance.ts";

        const dependencyPolicyVerdict: DependencyPolicyVerdictRecord = {
          dependencyPolicyVerdictId: "dep-policy::test",
          policyRef: "dependency_policy_091_foundation_v1",
          decisionState: "passed",
          blockedReasonRefs: [],
          watchlistHash: "hash",
          evaluatedAt: "2026-04-12T00:00:00+00:00",
        };

        const gateEvidence: BuildGateEvidenceRecord[] = [
          {
            gateEvidenceRef: "gate::package",
            gateRef: "build_package",
            gateLabel: "build",
            state: "passed",
            evidenceDigest: "gatehash",
          },
        ];

        const quarantineRules: ArtifactQuarantineRule[] = [
          {
            ruleRef: "qr_signature_invalid",
            triggerRef: "SIGNATURE_MISMATCH",
            artifactState: "quarantined",
            runtimeConsumptionState: "quarantined",
            publishDecisionState: "quarantined",
            supersessionAllowed: false,
            operatorAction: "quarantine",
          },
          {
            ruleRef: "qr_revoked",
            triggerRef: "PROVENANCE_REVOKED",
            artifactState: "revoked",
            runtimeConsumptionState: "revoked",
            publishDecisionState: "revoked",
            supersessionAllowed: false,
            operatorAction: "revoke",
          },
        ];

        describe("build provenance controls", () => {
          it("signs and verifies a record round-trip", () => {
            const harness = createBuildProvenanceSimulationHarness();
            expect(harness.verification.verified).toBe(true);
            expect(harness.publishDecision.decisionState).toBe("approved");
          });

          it("quarantines a tampered signature", () => {
            const harness = createBuildProvenanceSimulationHarness();
            const tampered = { ...harness.record, signature: `${harness.record.signature}tampered` };
            const verification = verifyBuildProvenanceRecord({
              record: tampered,
              signingKey: "mock-safe-provenance-key",
              dependencyPolicyVerdict,
              gateEvidence,
            });
            const decision = evaluateArtifactPublication({ verification, quarantineRules });
            expect(verification.issues[0]?.code).toBe("SIGNATURE_MISMATCH");
            expect(decision.decisionState).toBe("quarantined");
          });

          it("revokes build publication when provenance is revoked", () => {
            const harness = createBuildProvenanceSimulationHarness();
            const revokedRecord = signBuildProvenanceRecord({
              signingKey: "mock-safe-provenance-key",
              record: {
                ...harness.record,
                provenanceState: "revoked",
                artifactState: "revoked",
                runtimeConsumptionState: "revoked",
                revokedAt: "2026-04-12T01:00:00+00:00",
                revocationReasonRef: "PROVENANCE_REVOKED",
              },
            });
            const verification = verifyBuildProvenanceRecord({
              record: revokedRecord,
              signingKey: "mock-safe-provenance-key",
              dependencyPolicyVerdict,
              gateEvidence,
            });
            const decision = evaluateArtifactPublication({ verification, quarantineRules });
            expect(decision.decisionState).toBe("revoked");
          });
        });
        """
    ).strip()


def build_shared_script() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import {
          FileSecretStoreBackend,
          bootstrapSecretStore,
          loadSecretClassManifest,
          type EnvironmentRing,
        } from "../../packages/runtime-secrets/src/index.ts";
        import {
          evaluateArtifactPublication,
          signBuildProvenanceRecord,
          stableDigest,
          verifyBuildProvenanceRecord,
          type ArtifactQuarantineRule,
          type BuildArtifactDescriptor,
          type BuildGateEvidenceRecord,
          type DependencyPolicyVerdictRecord,
          type SignedBuildProvenanceRecord,
        } from "../../packages/release-controls/src/build-provenance.ts";

        export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");

        export interface CliArgs {
          [key: string]: string;
        }

        export interface RehearsalOutputs {
          record: SignedBuildProvenanceRecord;
          gateEvidence: BuildGateEvidenceRecord[];
          dependencyPolicyVerdict: DependencyPolicyVerdictRecord;
          publishDecision: ReturnType<typeof evaluateArtifactPublication>;
          quarantineRules: ArtifactQuarantineRule[];
          artifactDigests: BuildArtifactDescriptor[];
          sbom: Record<string, unknown>;
        }

        export function parseArgs(argv: readonly string[]): CliArgs {
          const args: CliArgs = {};
          for (let index = 2; index < argv.length; index += 2) {
            const key = argv[index];
            if (!key) {
              continue;
            }
            args[key] = argv[index + 1] ?? "true";
          }
          return args;
        }

        export function readJson<TValue>(filePath: string): TValue {
          return JSON.parse(fs.readFileSync(filePath, "utf8")) as TValue;
        }

        export function writeJson(filePath: string, payload: unknown): void {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\\n`, "utf8");
        }

        export function loadQuarantineRules(): ArtifactQuarantineRule[] {
          const policy = readJson<{ rules: ArtifactQuarantineRule[] }>(
            path.join(ROOT, "data", "analysis", "artifact_quarantine_policy.json"),
          );
          return policy.rules;
        }

        export function ensureSecretState(environmentRing: EnvironmentRing, stateDir: string): string {
          const masterKeyBase64 = Buffer.alloc(32, environmentRing.length + 17).toString("base64");
          bootstrapSecretStore({
            environmentRing,
            stateDir,
            masterKeyBase64,
          });
          return path.join(stateDir, "master-key.json");
        }

        export function loadSigningKey(environmentRing: EnvironmentRing, stateDir: string): string {
          const masterKeyPath = ensureSecretState(environmentRing, stateDir);
          const backend = new FileSecretStoreBackend({
            environmentRing,
            env: {
              VECELLS_SECRET_STATE_DIR: stateDir,
              VECELLS_KMS_MASTER_KEY_PATH: masterKeyPath,
            },
          });
          return backend.loadSecret({
            secretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
            actorRef: "ci_release_attestation",
          }).value;
        }

        function listFiles(rootPath: string): string[] {
          const entries: string[] = [];
          const stack = [rootPath];
          while (stack.length > 0) {
            const current = stack.pop();
            if (!current || !fs.existsSync(current)) {
              continue;
            }
            const stat = fs.statSync(current);
            if (stat.isFile()) {
              entries.push(current);
              continue;
            }
            if (stat.isDirectory()) {
              const names = fs.readdirSync(current).filter((name) => !name.startsWith(".tmp"));
              names.sort().reverse().forEach((name) => stack.push(path.join(current, name)));
            }
          }
          return entries
            .filter((filePath) =>
              /\\.(ts|tsx|js|mjs|json|yaml|yml|md|sql|css|html)$/i.test(filePath) ||
              /package\\.json$/.test(filePath) ||
              /pnpm-lock\\.yaml$/.test(filePath),
            )
            .sort();
        }

        export function collectArtifactDigests(buildFamilyRef: string, roots: readonly string[]) {
          const artifactId = `${buildFamilyRef}::bundle`;
          const fileDigests = roots.flatMap((relativeRoot) => {
            const absoluteRoot = path.join(ROOT, relativeRoot);
            return listFiles(absoluteRoot).map((filePath) => {
              const relativePath = path.relative(ROOT, filePath);
              const digest = stableDigest(fs.readFileSync(filePath, "utf8"));
              return { relativePath, digest };
            });
          });
          return {
            artifactDigests: [
              {
                artifactId,
                artifactKind: "workspace_bundle_manifest",
                artifactDigest: stableDigest(fileDigests),
                artifactRoots: roots,
              },
            ] satisfies BuildArtifactDescriptor[],
            fileDigests,
          };
        }

        function parsePackageJson(filePath: string) {
          if (!fs.existsSync(filePath)) {
            return null;
          }
          return JSON.parse(fs.readFileSync(filePath, "utf8")) as {
            name?: string;
            version?: string;
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
          };
        }

        export function generateSbom(buildFamilyRef: string, roots: readonly string[]) {
          const components: Array<Record<string, unknown>> = [];
          const seen = new Set<string>();
          roots.forEach((relativeRoot) => {
            const packageJsonPath = path.join(ROOT, relativeRoot, "package.json");
            const maybePackage = parsePackageJson(packageJsonPath);
            if (!maybePackage?.name) {
              return;
            }
            if (!seen.has(maybePackage.name)) {
              seen.add(maybePackage.name);
              components.push({
                type: "application",
                name: maybePackage.name,
                version: maybePackage.version ?? "0.0.0",
                scope: "required",
              });
            }
            const dependencies = {
              ...(maybePackage.dependencies ?? {}),
              ...(maybePackage.devDependencies ?? {}),
            };
            Object.entries(dependencies)
              .sort(([left], [right]) => left.localeCompare(right))
              .forEach(([name, version]) => {
                if (seen.has(`${name}@${version}`)) {
                  return;
                }
                seen.add(`${name}@${version}`);
                components.push({
                  type: name.startsWith("@vecells/") ? "framework" : "library",
                  name,
                  version,
                  scope: name.startsWith("@vecells/") ? "required" : "optional",
                });
              });
          });
          return {
            bomFormat: "CycloneDX",
            specVersion: "1.6",
            serialNumber: `urn:vecells:${buildFamilyRef}:${stableDigest(components)}`,
            metadata: {
              component: {
                type: "application",
                name: buildFamilyRef,
                version: "0.0.0",
              },
            },
            components,
          };
        }

        export function evaluateDependencyPolicy(): DependencyPolicyVerdictRecord {
          const policy = readJson<{
            policyId: string;
            requiredRootPackageManager: string;
            requiredLockfilePath: string;
            requiredWorkspaceInternalSpecifier: string;
            watchlistHash: string;
          }>(path.join(ROOT, "infra", "build-provenance", "local", "dependency-policy.json"));
          const rootPackage = readJson<{ packageManager?: string }>(path.join(ROOT, "package.json"));
          const lockfileExists = fs.existsSync(path.join(ROOT, policy.requiredLockfilePath));
          const blockedReasonRefs: string[] = [];
          if (rootPackage.packageManager !== policy.requiredRootPackageManager) {
            blockedReasonRefs.push("ROOT_PACKAGE_MANAGER_DRIFT");
          }
          if (!lockfileExists) {
            blockedReasonRefs.push("LOCKFILE_MISSING");
          }
          const secretManifest = loadSecretClassManifest(ROOT);
          if (
            !secretManifest.secret_classes.some(
              (row) => row.secret_class_ref === "RELEASE_PROVENANCE_SIGNING_KEY_REF",
            )
          ) {
            blockedReasonRefs.push("CI_SIGNING_SECRET_CLASS_MISSING");
          }
          return {
            dependencyPolicyVerdictId: "dep-policy::runtime",
            policyRef: policy.policyId,
            decisionState: blockedReasonRefs.length === 0 ? "passed" : "blocked",
            blockedReasonRefs,
            watchlistHash: policy.watchlistHash,
            evaluatedAt: new Date().toISOString(),
          };
        }

        export function createGateEvidence(runId: string, failedGateRef?: string): BuildGateEvidenceRecord[] {
          const gates = readJson<{ gateDefinitions: Array<{ gateRef: string; label: string }> }>(
            path.join(ROOT, "data", "analysis", "build_provenance_manifest.json"),
          ).gateDefinitions;
          return gates.map((gate) => {
            const state =
              failedGateRef && gate.gateRef === failedGateRef
                ? "blocked"
                : "passed";
            return {
              gateEvidenceRef: `gate-evidence::${runId}::${gate.gateRef}`,
              gateRef: gate.gateRef,
              gateLabel: gate.label,
              state,
              evidenceDigest: stableDigest({ runId, gate: gate.gateRef, state }),
            } satisfies BuildGateEvidenceRecord;
          });
        }

        export function buildRecord(input: {
          buildFamilyRef: string;
          environmentRing: EnvironmentRing;
          artifactRoots: readonly string[];
          outputDir: string;
          failedGateRef?: string;
        }): RehearsalOutputs {
          const signingKey = loadSigningKey(input.environmentRing, path.join(input.outputDir, "secret-store"));
          const verificationScenarios = readJson<{
            verificationScenarios: Array<{
              ringCode: string;
              verificationScenarioId: string;
              releaseRef: string;
              runtimePublicationBundleRef: string;
              releaseContractVerificationMatrixRef: string;
            }>;
          }>(path.join(ROOT, "data", "analysis", "verification_scenarios.json"));
          const scenario = verificationScenarios.verificationScenarios.find(
            (row) => row.ringCode === input.environmentRing,
          );
          if (!scenario) {
            throw new Error(`Missing verification scenario for ${input.environmentRing}.`);
          }
          const artifactBundle = collectArtifactDigests(input.buildFamilyRef, input.artifactRoots);
          const sbom = generateSbom(input.buildFamilyRef, input.artifactRoots);
          const dependencyPolicyVerdict = evaluateDependencyPolicy();
          const gateEvidence = createGateEvidence(
            `${input.buildFamilyRef}:${input.environmentRing}`,
            input.failedGateRef,
          );
          const baseUnsignedRecord = {
            buildProvenanceRecordId: `bpr::${input.buildFamilyRef}::${input.environmentRing}`,
            buildFamilyRef: input.buildFamilyRef,
            releaseRef: scenario.releaseRef,
            verificationScenarioRef: scenario.verificationScenarioId,
            environmentRing: input.environmentRing,
            runtimeTopologyManifestRef: "data/analysis/runtime_topology_manifest.json",
            runtimePublicationBundleRef: scenario.runtimePublicationBundleRef,
            releasePublicationParityRef: `parity::${scenario.releaseRef.toLowerCase()}`,
            artifactDigests: artifactBundle.artifactDigests,
            artifactSetDigest: stableDigest(artifactBundle.fileDigests),
            sbomDigest: stableDigest(sbom),
            sbomRef: "sbom::runtime",
            dependencyPolicyVerdictRef: dependencyPolicyVerdict.dependencyPolicyVerdictId,
            gateEvidenceRefs: gateEvidence.map((row) => row.gateEvidenceRef),
            signingSecretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
            provenanceState: "verified",
            runtimeConsumptionState: "publishable",
            artifactState: "publishable",
            quarantineReasonRefs: [],
            revokedAt: null,
            revocationReasonRef: null,
            supersededByBuildProvenanceRecordRef: null,
            signedAt: new Date().toISOString(),
          } as const;
          const provisionalRecord = signBuildProvenanceRecord({
            record: baseUnsignedRecord,
            signingKey,
          });
          const quarantineRules = loadQuarantineRules();
          const verification = verifyBuildProvenanceRecord({
            record: provisionalRecord,
            signingKey,
            dependencyPolicyVerdict,
            gateEvidence,
          });
          const publishDecision = evaluateArtifactPublication({
            verification,
            quarantineRules,
          });
          const finalizedRecord = signBuildProvenanceRecord({
            signingKey,
            record: {
              ...baseUnsignedRecord,
              artifactState: publishDecision.artifactState,
              runtimeConsumptionState: publishDecision.runtimeConsumptionState,
              provenanceState:
                publishDecision.decisionState === "quarantined"
                  ? "quarantined"
                  : publishDecision.decisionState === "revoked"
                    ? "revoked"
                    : publishDecision.decisionState === "superseded"
                      ? "superseded"
                      : publishDecision.decisionState === "blocked"
                        ? "drifted"
                        : baseUnsignedRecord.provenanceState,
              quarantineReasonRefs: publishDecision.blockerRefs,
              revokedAt:
                publishDecision.decisionState === "revoked" ? new Date().toISOString() : null,
              revocationReasonRef:
                publishDecision.decisionState === "revoked"
                  ? publishDecision.blockerRefs[0] ?? null
                  : null,
            },
          });
          return {
            record: finalizedRecord,
            gateEvidence,
            dependencyPolicyVerdict,
            publishDecision,
            quarantineRules,
            artifactDigests: artifactBundle.artifactDigests,
            sbom,
          };
        }

        export function writeRehearsalOutputs(outputDir: string, outputs: RehearsalOutputs) {
          writeJson(path.join(outputDir, "build-provenance-record.json"), outputs.record);
          writeJson(path.join(outputDir, "gate-evidence.json"), outputs.gateEvidence);
          writeJson(
            path.join(outputDir, "dependency-policy-verdict.json"),
            outputs.dependencyPolicyVerdict,
          );
          writeJson(path.join(outputDir, "publish-decision.json"), outputs.publishDecision);
          writeJson(path.join(outputDir, "quarantine-rules.json"), outputs.quarantineRules);
          writeJson(path.join(outputDir, "artifact-manifest.json"), outputs.artifactDigests);
          writeJson(path.join(outputDir, "sbom.cdx.json"), outputs.sbom);
        }
        """
    ).strip()


def build_rehearsal_script() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { parseArgs, buildRecord, writeRehearsalOutputs } from "./shared";

        const args = parseArgs(process.argv);
        const environment = (args["--environment"] ?? "ci-preview") as
          | "local"
          | "ci-preview"
          | "integration"
          | "preprod"
          | "production";
        const outputDir = path.resolve(args["--output-dir"] ?? path.join(".artifacts", "build-provenance", environment));
        const buildFamilyRef = args["--build-family"] ?? "bf_release_control_bundle";
        const manifest = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), "data", "analysis", "build_provenance_manifest.json"), "utf8"),
        );
        const family = manifest.buildFamilies.find((row) => row.buildFamilyRef === buildFamilyRef);
        if (!family) {
          throw new Error(`Unknown build family ${buildFamilyRef}.`);
        }
        const outputs = buildRecord({
          buildFamilyRef,
          environmentRing: environment,
          artifactRoots: family.artifactRoots,
          outputDir,
          failedGateRef: args["--failed-gate"],
        });
        writeRehearsalOutputs(outputDir, outputs);
        process.stdout.write(`${JSON.stringify({ outputDir, buildFamilyRef, environment, decision: outputs.publishDecision.decisionState }, null, 2)}\\n`);
        """
    ).strip()


def build_verify_script() -> str:
    return dedent(
        """
        import path from "node:path";
        import { FileSecretStoreBackend } from "../../packages/runtime-secrets/src/index.ts";
        import {
          evaluateArtifactPublication,
          verifyBuildProvenanceRecord,
        } from "../../packages/release-controls/src/build-provenance.ts";
        import { parseArgs, readJson, writeJson, loadQuarantineRules } from "./shared";

        const args = parseArgs(process.argv);
        const environment = (args["--environment"] ?? "ci-preview") as
          | "local"
          | "ci-preview"
          | "integration"
          | "preprod"
          | "production";
        const inputDir = path.resolve(args["--input-dir"] ?? path.join(".artifacts", "build-provenance", environment));
        const record = readJson(path.join(inputDir, "build-provenance-record.json"));
        const gateEvidence = readJson(path.join(inputDir, "gate-evidence.json"));
        const dependencyPolicyVerdict = readJson(path.join(inputDir, "dependency-policy-verdict.json"));
        const backend = new FileSecretStoreBackend({
          environmentRing: environment,
          env: {
            VECELLS_SECRET_STATE_DIR: path.join(inputDir, "secret-store"),
            VECELLS_KMS_MASTER_KEY_PATH: path.join(inputDir, "secret-store", "master-key.json"),
          },
        });
        const signingKey = backend.loadSecret({
          secretClassRef: "RELEASE_PROVENANCE_SIGNING_KEY_REF",
          actorRef: "ci_release_attestation",
        }).value;
        const verification = verifyBuildProvenanceRecord({
          record,
          signingKey,
          dependencyPolicyVerdict,
          gateEvidence,
        });
        const decision = evaluateArtifactPublication({
          verification,
          quarantineRules: loadQuarantineRules(),
        });
        writeJson(path.join(inputDir, "verification-result.json"), { verification, decision });
        if (!verification.verified || decision.decisionState !== "approved") {
          process.stderr.write(`${JSON.stringify({ verification, decision }, null, 2)}\\n`);
          process.exitCode = 1;
        }
        """
    ).strip()


def build_promote_script() -> str:
    return dedent(
        """
        import path from "node:path";
        import { parseArgs, readJson, writeJson } from "./shared";

        const args = parseArgs(process.argv);
        const targetRing = args["--target-ring"] ?? "integration";
        const inputDir = path.resolve(args["--input-dir"] ?? path.join(".artifacts", "build-provenance", "ci-preview"));
        const verificationResult = readJson(path.join(inputDir, "verification-result.json"));
        const record = readJson(path.join(inputDir, "build-provenance-record.json"));
        const allowedTargets = new Set(["integration", "preprod"]);
        const decision = {
          promotionDecisionId: `promotion::${record.buildFamilyRef}::${targetRing}`,
          buildProvenanceRecordRef: record.buildProvenanceRecordId,
          targetRing,
          runtimePublicationBundleRef: record.runtimePublicationBundleRef,
          releasePublicationParityRef: record.releasePublicationParityRef,
          decisionState:
            verificationResult.decision.decisionState === "approved" && allowedTargets.has(targetRing)
              ? "approved"
              : "blocked",
          blockerRefs:
            verificationResult.decision.decisionState === "approved" && allowedTargets.has(targetRing)
              ? []
              : [...verificationResult.decision.blockerRefs, ...(allowedTargets.has(targetRing) ? [] : ["TARGET_RING_NOT_NONPROD"])],
        };
        writeJson(path.join(inputDir, "promotion-decision.json"), decision);
        if (decision.decisionState !== "approved") {
          process.stderr.write(`${JSON.stringify(decision, null, 2)}\\n`);
          process.exitCode = 1;
        }
        """
    ).strip()


def build_dependency_policy_json(policy: dict[str, Any]) -> str:
    return json.dumps(policy, indent=2)


def build_readme(manifest: dict[str, Any]) -> str:
    return dedent(
        f"""
        # Build Provenance And CI/CD Baseline

        This directory contains the provider-neutral Phase 0 delivery-control substrate for `{TASK_ID}`.

        - `.github/workflows/build-provenance-ci.yml` runs deterministic install, build, check, provenance rehearsal, and provenance verification.
        - `.github/workflows/nonprod-provenance-promotion.yml` reuses the same records and only approves promotion into non-production rings.
        - `local/dependency-policy.json` is the machine-readable dependency-policy baseline consumed by the rehearsal scripts.
        - `tests/build-provenance-smoke.test.mjs` proves that signed provenance verifies cleanly and that tampering fails closed.

        Frozen counts:

        - build families: `{manifest['summary']['build_family_count']}`
        - pipeline runs: `{manifest['summary']['pipeline_run_count']}`
        - quarantine rules: `{manifest['summary']['quarantine_rule_count']}`
        - publish hooks: `{manifest['summary']['publish_hook_count']}`
        """
    ).strip()


def build_smoke_test() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import os from "node:os";
        import path from "node:path";
        import { spawnSync } from "node:child_process";

        const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..", "..");

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        function run(command, args, options = {}) {
          const result = spawnSync(command, args, {
            cwd: ROOT,
            encoding: "utf8",
            ...options,
          });
          if (result.status !== 0) {
            throw new Error(result.stderr || result.stdout || `Command failed: ${command} ${args.join(" ")}`);
          }
          return result;
        }

        const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-build-provenance-"));
        try {
          run("pnpm", [
            "exec",
            "tsx",
            "./tools/release-provenance/run-build-provenance-rehearsal.ts",
            "--environment",
            "ci-preview",
            "--output-dir",
            outputDir,
            "--build-family",
            "bf_release_control_bundle",
          ]);

          assertCondition(
            fs.existsSync(path.join(outputDir, "build-provenance-record.json")),
            "Missing build provenance record output.",
          );

          run("pnpm", [
            "exec",
            "tsx",
            "./tools/release-provenance/verify-build-provenance.ts",
            "--environment",
            "ci-preview",
            "--input-dir",
            outputDir,
          ]);

          run("pnpm", [
            "exec",
            "tsx",
            "./tools/release-provenance/promote-build-artifact.ts",
            "--target-ring",
            "integration",
            "--input-dir",
            outputDir,
          ]);

          const recordPath = path.join(outputDir, "build-provenance-record.json");
          const tampered = JSON.parse(fs.readFileSync(recordPath, "utf8"));
          tampered.signature = `${tampered.signature}tampered`;
          fs.writeFileSync(recordPath, `${JSON.stringify(tampered, null, 2)}\\n`, "utf8");

          const result = spawnSync(
            "pnpm",
            [
              "exec",
              "tsx",
              "./tools/release-provenance/verify-build-provenance.ts",
              "--environment",
              "ci-preview",
              "--input-dir",
              outputDir,
            ],
            {
              cwd: ROOT,
              encoding: "utf8",
            },
          );
          assertCondition(result.status !== 0, "Tampered provenance unexpectedly verified.");
        } finally {
          fs.rmSync(outputDir, { recursive: true, force: true });
        }
        """
    ).strip()


def build_ci_workflow() -> str:
    return dedent(
        """
        name: build-provenance-ci

        on:
          push:
            branches:
              - main
              - codex/**
          pull_request:

        jobs:
          foundation:
            runs-on: ubuntu-latest
            env:
              CI: "1"
              NX_TUI: "false"
            steps:
              - uses: actions/checkout@v4
              - uses: pnpm/action-setup@v4
                with:
                  version: 10.23.0
              - uses: actions/setup-node@v4
                with:
                  node-version: 24
                  cache: pnpm
              - run: pnpm install --frozen-lockfile
              - run: pnpm ci:foundation-gates
              - run: pnpm ci:rehearse-provenance -- --build-family bf_foundation_monorepo_full
              - run: pnpm ci:verify-provenance
              - uses: actions/upload-artifact@v4
                with:
                  name: build-provenance-ci-preview
                  path: .artifacts/build-provenance/ci-preview
        """
    ).strip()


def build_promotion_workflow() -> str:
    return dedent(
        """
        name: nonprod-provenance-promotion

        on:
          workflow_dispatch:
            inputs:
              target_ring:
                description: Target non-production ring
                required: true
                default: integration
                type: choice
                options:
                  - integration
                  - preprod

        jobs:
          promote:
            runs-on: ubuntu-latest
            env:
              CI: "1"
              NX_TUI: "false"
            steps:
              - uses: actions/checkout@v4
              - uses: pnpm/action-setup@v4
                with:
                  version: 10.23.0
              - uses: actions/setup-node@v4
                with:
                  node-version: 24
                  cache: pnpm
              - run: pnpm install --frozen-lockfile
              - run: pnpm ci:rehearse-provenance -- --build-family bf_release_control_bundle
              - run: pnpm ci:verify-provenance
              - run: pnpm ci:promote-nonprod -- --target-ring ${{ inputs.target_ring }}
              - uses: actions/upload-artifact@v4
                with:
                  name: nonprod-promotion-decision
                  path: .artifacts/build-provenance/ci-preview
        """
    ).strip()


def patch_release_controls_index() -> None:
    source = PACKAGE_INDEX_PATH.read_text(encoding="utf-8")
    marker_start = "// par_091_build_provenance_exports:start"
    marker_end = "// par_091_build_provenance_exports:end"
    block = dedent(
        """
        // par_091_build_provenance_exports:start
        export * from "./build-provenance";
        // par_091_build_provenance_exports:end
        """
    ).rstrip()
    if marker_start in source and marker_end in source:
        before, _marker, remainder = source.partition(marker_start)
        _old, _marker_end, after = remainder.partition(marker_end)
        source = before.rstrip() + "\n\n" + block + "\n\n" + after.lstrip()
    else:
        anchor = 'export * from "./projection-rebuild";\n'
        require(anchor in source, "PREREQUISITE_GAP_091_RELEASE_CONTROLS_EXPORT_ANCHOR")
        source = source.replace(anchor, anchor + "\n" + block + "\n", 1)
    write_text(PACKAGE_INDEX_PATH, source)


def patch_release_controls_public_api_test() -> None:
    source = PACKAGE_PUBLIC_API_TEST_PATH.read_text(encoding="utf-8")
    import_anchor = "  bootstrapSharedPackage,\n"
    if "createBuildProvenanceSimulationHarness," not in source:
        require(import_anchor in source, "PREREQUISITE_GAP_091_RELEASE_CONTROLS_TEST_IMPORT_ANCHOR")
        source = source.replace(
            import_anchor,
            import_anchor + "  createBuildProvenanceSimulationHarness,\n",
            1,
        )
    if "runs the build provenance simulation harness" not in source:
        insert_anchor = "  it(\"runs the projection rebuild simulation harness\", () => {\n"
        require(insert_anchor in source, "PREREQUISITE_GAP_091_RELEASE_CONTROLS_TEST_BLOCK_ANCHOR")
        addition = dedent(
            """
              it("runs the build provenance simulation harness", () => {
                const harness = createBuildProvenanceSimulationHarness();
                expect(harness.verification.verified).toBe(true);
                expect(harness.publishDecision.decisionState).toBe("approved");
              });

            """
        )
        source = source.replace(insert_anchor, addition + insert_anchor, 1)
    write_text(PACKAGE_PUBLIC_API_TEST_PATH, source)


def patch_root_package_json() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package["scripts"].update(with_root_script_updates())
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package_json() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    for script_name in ("build", "lint", "test", "typecheck", "e2e"):
        command = package["scripts"][script_name]
        spec_name = "build-provenance-pipeline-atlas.spec.js"
        token = (
            f"node --check {spec_name}"
            if script_name in {"build", "typecheck"}
            else f"eslint {spec_name}"
            if script_name == "lint"
            else f"node {spec_name} --run"
            if script_name == "e2e"
            else f"node {spec_name}"
        )
        if token in command:
            continue
        package["scripts"][script_name] = f"{command} && {token}"
    package["description"] = (
        package.get("description", "").rstrip(".")
        + ", build provenance pipeline atlas browser checks."
    ).strip(", ")
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def write_artifacts() -> None:
    upstreams = load_upstreams()
    dependency_policy = build_dependency_policy(upstreams)
    build_families = build_build_families(upstreams)
    runs, gate_evidence_rows = build_pipeline_runs(upstreams, build_families)
    provenance_records = build_provenance_records(runs, build_families)
    publish_hooks = build_publish_hooks(build_families)
    matrix_rows = build_pipeline_gate_matrix(build_families, upstreams["secrets"])
    quarantine_policy = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "policyId": "artifact_quarantine_policy_v1",
        "rules": QUARANTINE_RULES,
        "source_refs": [
            "prompt/091.md#Mandatory gap closures you must perform",
            "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
            "blueprint/platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
        ],
    }
    manifest = build_manifest(
        upstreams,
        build_families,
        runs,
        gate_evidence_rows,
        provenance_records,
        publish_hooks,
    )

    write_json(MANIFEST_PATH, manifest)
    write_csv(MATRIX_PATH, matrix_rows)
    write_json(QUARANTINE_POLICY_PATH, quarantine_policy)
    write_text(DESIGN_DOC_PATH, build_design_doc(manifest, dependency_policy))
    write_text(RULES_DOC_PATH, build_rules_doc(quarantine_policy))
    write_text(ATLAS_PATH, build_atlas_html(manifest, matrix_rows, quarantine_policy))
    write_text(SPEC_PATH, build_spec_js(manifest, matrix_rows))

    write_text(PACKAGE_SOURCE_PATH, build_release_controls_source())
    patch_release_controls_index()
    patch_release_controls_public_api_test()
    write_text(PACKAGE_TEST_PATH, build_release_controls_test())

    write_text(SHARED_SCRIPT_PATH, build_shared_script())
    write_text(REHEARSAL_SCRIPT_PATH, build_rehearsal_script())
    write_text(VERIFY_SCRIPT_PATH, build_verify_script())
    write_text(PROMOTE_SCRIPT_PATH, build_promote_script())

    write_text(README_PATH, build_readme(manifest))
    write_text(DEPENDENCY_POLICY_PATH, build_dependency_policy_json(dependency_policy))
    write_text(SMOKE_TEST_PATH, build_smoke_test())

    write_text(CI_WORKFLOW_PATH, build_ci_workflow())
    write_text(PROMOTION_WORKFLOW_PATH, build_promotion_workflow())

    patch_root_package_json()
    patch_playwright_package_json()

    print(
        "par_091 ci/cd and build provenance artifacts generated: "
        f"{manifest['summary']['build_family_count']} build families, "
        f"{manifest['summary']['pipeline_run_count']} pipeline runs, "
        f"{manifest['summary']['quarantine_rule_count']} quarantine rules."
    )


if __name__ == "__main__":
    write_artifacts()
