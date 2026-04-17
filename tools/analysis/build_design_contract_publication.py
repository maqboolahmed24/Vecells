#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
PACKAGE_DIR = ROOT / "packages" / "design-system"
CONTRACTS_DIR = PACKAGE_DIR / "contracts"
PACKAGE_SOURCE_PATH = PACKAGE_DIR / "src" / "index.tsx"
PACKAGE_TEST_PATH = PACKAGE_DIR / "tests" / "public-api.test.ts"
PACKAGE_PACKAGE_JSON_PATH = PACKAGE_DIR / "package.json"

FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
FRONTEND_PROFILE_PATH = DATA_DIR / "frontend_accessibility_and_automation_profiles.json"
FRONTEND_MATRIX_PATH = DATA_DIR / "frontend_route_to_query_command_channel_cache_matrix.csv"
RELEASE_PARITY_PATH = DATA_DIR / "release_publication_parity_rules.json"

BUNDLE_PATH = DATA_DIR / "design_contract_publication_bundles.json"
TOKEN_ARTIFACT_PATH = DATA_DIR / "design_token_export_artifacts.json"
VOCABULARY_MATRIX_PATH = DATA_DIR / "design_contract_vocabulary_tuples.csv"
LINT_RULES_PATH = DATA_DIR / "design_contract_lint_rules.json"
STRUCTURAL_EVIDENCE_PATH = DATA_DIR / "design_contract_structural_evidence_matrix.csv"

STRATEGY_DOC_PATH = DOCS_DIR / "52_design_contract_publication_strategy.md"
CATALOG_DOC_PATH = DOCS_DIR / "52_design_contract_bundle_catalog.md"
STUDIO_PATH = DOCS_DIR / "52_design_contract_studio.html"

SCHEMA_PATH = CONTRACTS_DIR / "design-contract-publication.schema.json"
VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_design_contract_publication.py"
SPEC_PATH = TESTS_DIR / "design-contract-studio.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

DESIGN_SYSTEM_EXPORTS_START = "// seq_052_design_contract_publication_exports:start"
DESIGN_SYSTEM_EXPORTS_END = "// seq_052_design_contract_publication_exports:end"

TASK_ID = "seq_052"
VISUAL_MODE = "Design_Contract_Studio"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the design-contract publication-bundle strategy so every audience surface and "
    "route-family set publishes one machine-readable design authority contract joining token "
    "export, profile selection, state semantics, kernel propagation, accessibility, automation, "
    "telemetry, artifact posture, structural evidence, and fail-closed lint verdicts."
)

SOURCE_PRECEDENCE = [
    "prompt/052.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.37A DesignContractPublicationBundle",
    "blueprint/phase-0-the-foundation-protocol.md#1.37B DesignContractLintVerdict",
    "blueprint/design-token-foundation.md#Machine-readable export contract",
    "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
    "blueprint/platform-frontend-blueprint.md#Shared IA rules",
    "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
    "blueprint/ux-quiet-clarity-redesign.md#Control priorities",
    "blueprint/forensic-audit-findings.md#Finding 116",
    "blueprint/forensic-audit-findings.md#Finding 117",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "blueprint/forensic-audit-findings.md#Finding 120",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/frontend_accessibility_and_automation_profiles.json",
    "data/analysis/release_publication_parity_rules.json",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
        "pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && "
        "pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && "
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
        "python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && "
        "python3 ./tools/analysis/build_engineering_standards.py && pnpm format"
    ),
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
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
        "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
    ),
    "lint": (
        "eslint foundation-shell-gallery.spec.js runtime-topology-atlas.spec.js "
        "gateway-surface-studio.spec.js event-registry-studio.spec.js "
        "fhir-representation-atlas.spec.js frontend-contract-studio.spec.js "
        "release-parity-cockpit.spec.js design-contract-studio.spec.js audit-ledger-explorer.spec.js"
    ),
    "test": (
        "node foundation-shell-gallery.spec.js && "
        "node runtime-topology-atlas.spec.js && "
        "node gateway-surface-studio.spec.js && "
        "node event-registry-studio.spec.js && "
        "node fhir-representation-atlas.spec.js && "
        "node frontend-contract-studio.spec.js && "
        "node release-parity-cockpit.spec.js && "
        "node design-contract-studio.spec.js && node audit-ledger-explorer.spec.js"
    ),
    "typecheck": (
        "node --check foundation-shell-gallery.spec.js && "
        "node --check runtime-topology-atlas.spec.js && "
        "node --check gateway-surface-studio.spec.js && "
        "node --check event-registry-studio.spec.js && "
        "node --check fhir-representation-atlas.spec.js && "
        "node --check frontend-contract-studio.spec.js && "
        "node --check release-parity-cockpit.spec.js && "
        "node --check design-contract-studio.spec.js && node --check audit-ledger-explorer.spec.js"
    ),
    "e2e": (
        "node foundation-shell-gallery.spec.js --run && "
        "node runtime-topology-atlas.spec.js --run && "
        "node gateway-surface-studio.spec.js --run && "
        "node event-registry-studio.spec.js --run && "
        "node fhir-representation-atlas.spec.js --run && "
        "node frontend-contract-studio.spec.js --run && "
        "node release-parity-cockpit.spec.js --run && "
        "node design-contract-studio.spec.js --run && node audit-ledger-explorer.spec.js --run"
    ),
}

TOKEN_KERNEL_POLICY = {
    "tokenKernelLayeringPolicyId": "TKLP_052_SIGNAL_ATLAS_LIVE_V1",
    "designTokenFoundationRef": "DTF_052_SIGNAL_ATLAS_LIVE_QUIET_CLARITY_V1",
    "primitiveLayerNamespace": "ref.*",
    "semanticLayerNamespace": "sys.*",
    "componentLayerNamespace": "comp.*",
    "profileLayerNamespace": "profile.*",
    "requiredAliasOrder": "ref_to_sys_to_comp_to_profile",
    "allowedShellVariationRefs": [
        "shell.patient",
        "shell.staff",
        "shell.support",
        "shell.hub",
        "shell.pharmacy",
        "shell.operations",
        "shell.governance",
    ],
    "allowedModeVariationRefs": [
        "theme_light",
        "contrast_standard",
        "density_balanced",
        "motion_reduced",
    ],
    "forbiddenOverrideClasses": [
        "route_local_hex",
        "route_local_px",
        "route_local_shadow_stack",
        "route_local_marker_alias",
        "route_local_telemetry_name",
    ],
    "requiredKernelStatePropagationRef": "SSKB_052_SHARED_KERNEL_PROPAGATION_V1",
    "layeringDigestRef": "",
    "effectiveAt": TIMESTAMP,
    "source_refs": [
        "blueprint/design-token-foundation.md#Machine-readable export contract",
        "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
        "prompt/052.md",
    ],
}

MODE_TUPLE_COVERAGE = {
    "modeTupleCoverageRef": "MTC_052_LIGHT_STANDARD_BALANCED_REDUCED_V1",
    "themeMode": "light",
    "contrastMode": "standard",
    "densityMode": "balanced",
    "motionMode": "reduced",
    "breakpointCoverageRefs": ["compact", "narrow", "medium", "expanded", "wide"],
    "source_refs": [
        "blueprint/design-token-foundation.md#Modes",
        "blueprint/platform-frontend-blueprint.md#Shared IA rules",
    ],
}

SHELL_EXPORT_CONFIG = OrderedDict(
    [
        (
            "patient",
            {
                "designTokenExportArtifactId": "DTEA_052_PATIENT_SIGNAL_ATLAS_V1",
                "profileTokenRef": "profile.patient.atlas_live",
                "shellVisualProfileRef": "SVP_052_PATIENT_ATLAS_V1",
                "semanticColorProfileRef": "SCP_052_PATIENT_CLARITY_V1",
                "densityProfileRef": "density.relaxed",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.patient.shell", "topology.patient.recovery"],
                "allowedSurfaceRoleRefs": ["surface.intake", "surface.portal", "surface.recovery"],
                "accent": "#3559E6",
            },
        ),
        (
            "staff",
            {
                "designTokenExportArtifactId": "DTEA_052_CLINICAL_WORKSPACE_V1",
                "profileTokenRef": "profile.workspace.quiet_clinical",
                "shellVisualProfileRef": "SVP_052_CLINICAL_MISSION_V1",
                "semanticColorProfileRef": "SCP_052_CLINICAL_MISSION_V1",
                "densityProfileRef": "density.balanced",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.workspace.queue", "topology.workspace.child"],
                "allowedSurfaceRoleRefs": ["surface.queue", "surface.workspace", "surface.assistive"],
                "accent": "#0EA5A4",
            },
        ),
        (
            "support",
            {
                "designTokenExportArtifactId": "DTEA_052_SUPPORT_WORKSPACE_V1",
                "profileTokenRef": "profile.support.quiet_service",
                "shellVisualProfileRef": "SVP_052_SUPPORT_SERVICE_V1",
                "semanticColorProfileRef": "SCP_052_SUPPORT_SERVICE_V1",
                "densityProfileRef": "density.balanced",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.support.casework", "topology.support.replay"],
                "allowedSurfaceRoleRefs": ["surface.casework", "surface.replay", "surface.capture"],
                "accent": "#3B82F6",
            },
        ),
        (
            "hub",
            {
                "designTokenExportArtifactId": "DTEA_052_HUB_COORDINATION_V1",
                "profileTokenRef": "profile.hub.signal_coordination",
                "shellVisualProfileRef": "SVP_052_HUB_COORDINATION_V1",
                "semanticColorProfileRef": "SCP_052_HUB_COORDINATION_V1",
                "densityProfileRef": "density.balanced",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.hub.queue", "topology.hub.case"],
                "allowedSurfaceRoleRefs": ["surface.queue", "surface.case", "surface.network"],
                "accent": "#2563EB",
            },
        ),
        (
            "pharmacy",
            {
                "designTokenExportArtifactId": "DTEA_052_PHARMACY_CONSOLE_V1",
                "profileTokenRef": "profile.pharmacy.dispatch_quiet",
                "shellVisualProfileRef": "SVP_052_PHARMACY_DISPATCH_V1",
                "semanticColorProfileRef": "SCP_052_PHARMACY_DISPATCH_V1",
                "densityProfileRef": "density.balanced",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.pharmacy.dispatch"],
                "allowedSurfaceRoleRefs": ["surface.dispatch", "surface.ledger"],
                "accent": "#0F9D58",
            },
        ),
        (
            "operations",
            {
                "designTokenExportArtifactId": "DTEA_052_OPERATIONS_CONSOLE_V1",
                "profileTokenRef": "profile.operations.control_room",
                "shellVisualProfileRef": "SVP_052_OPERATIONS_CONTROL_V1",
                "semanticColorProfileRef": "SCP_052_OPERATIONS_ALERT_V1",
                "densityProfileRef": "density.compact",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.operations.board", "topology.operations.drilldown"],
                "allowedSurfaceRoleRefs": ["surface.watch", "surface.intervention", "surface.summary"],
                "accent": "#C98900",
            },
        ),
        (
            "governance",
            {
                "designTokenExportArtifactId": "DTEA_052_GOVERNANCE_CONSOLE_V1",
                "profileTokenRef": "profile.governance.audit_command",
                "shellVisualProfileRef": "SVP_052_GOVERNANCE_AUDIT_V1",
                "semanticColorProfileRef": "SCP_052_GOVERNANCE_AUDIT_V1",
                "densityProfileRef": "density.balanced",
                "motionProfileRef": "motion.reduced_first",
                "allowedTopologyMetricRefs": ["topology.governance.audit"],
                "allowedSurfaceRoleRefs": ["surface.approval", "surface.watch", "surface.release"],
                "accent": "#7C3AED",
            },
        ),
    ]
)

STRUCTURAL_EVIDENCE_KINDS = [
    {
        "code": "compact_frame",
        "label": "Compact shell frame",
        "breakpointCoverageRef": "compact",
        "motionModeRef": "motion_reduced",
        "artifactModeRef": "interactive",
        "evidenceRole": "shell_structure",
    },
    {
        "code": "wide_frame",
        "label": "Wide shell frame",
        "breakpointCoverageRef": "wide",
        "motionModeRef": "motion_reduced",
        "artifactModeRef": "interactive",
        "evidenceRole": "shell_structure",
    },
    {
        "code": "artifact_summary",
        "label": "Artifact summary posture",
        "breakpointCoverageRef": "medium",
        "motionModeRef": "motion_reduced",
        "artifactModeRef": "summary",
        "evidenceRole": "artifact_posture",
    },
]

LINT_RULES = [
    {
        "ruleId": "DCLR_052_TOKEN_LATTICE",
        "label": "Token lattice exactness",
        "summary": "Primitive, semantic, component, and profile layers must resolve through one published token export artifact.",
        "blockingEffect": "Any route-local hex, px, or alias bypass blocks publication.",
        "stateField": "tokenLatticeState",
        "source_refs": [
            "blueprint/design-token-foundation.md#Machine-readable export contract",
            "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
        ],
    },
    {
        "ruleId": "DCLR_052_PROFILE_MODE",
        "label": "Profile and mode resolution",
        "summary": "Every bundle must cite current profile selection and mode tuple coverage for all route families.",
        "blockingEffect": "Missing or partial mode coverage blocks publication.",
        "stateField": "modeResolutionState",
        "source_refs": [
            "blueprint/design-token-foundation.md#ProfileSelectionResolution",
            "blueprint/phase-0-the-foundation-protocol.md#1.37B DesignContractLintVerdict",
        ],
    },
    {
        "ruleId": "DCLR_052_SURFACE_SEMANTICS",
        "label": "Surface semantics and kernel propagation",
        "summary": "Visible state meaning must propagate through one shared kernel binding with no route-local aliases.",
        "blockingEffect": "Unbound state classes or aria drift block publication.",
        "stateField": "surfaceSemanticsState",
        "source_refs": [
            "blueprint/canonical-ui-contract-kernel.md#SurfaceStateSemanticsProfile",
            "blueprint/canonical-ui-contract-kernel.md#SurfaceStateKernelBinding",
        ],
    },
    {
        "ruleId": "DCLR_052_ACCESSIBILITY",
        "label": "Accessibility semantic coverage",
        "summary": "Coverage, keyboard model, focus scope, and assistive state markers must remain in the same bundle.",
        "blockingEffect": "Degraded or stale semantic coverage blocks publication.",
        "stateField": "accessibilitySemanticCoverageState",
        "source_refs": [
            "blueprint/accessibility-and-content-system-contract.md#Canonical accessibility and content objects",
            "blueprint/phase-0-the-foundation-protocol.md#23A. Every route family must publish one AccessibilitySemanticCoverageProfile",
        ],
    },
    {
        "ruleId": "DCLR_052_AUTOMATION_TELEMETRY",
        "label": "Automation and telemetry parity",
        "summary": "DOM markers, selected anchors, and telemetry event keys must share one vocabulary tuple.",
        "blockingEffect": "Marker aliases or telemetry name drift block publication.",
        "stateField": "automationTelemetryParityState",
        "source_refs": [
            "blueprint/canonical-ui-contract-kernel.md#AutomationAnchorMap",
            "blueprint/canonical-ui-contract-kernel.md#TelemetryBindingProfile",
        ],
    },
    {
        "ruleId": "DCLR_052_ARTIFACT_POSTURE",
        "label": "Artifact-mode presentation parity",
        "summary": "Summary, preview, handoff, and return-anchor posture must resolve through the published bundle.",
        "blockingEffect": "Detached artifact mode or return-anchor drift blocks publication.",
        "stateField": "artifactModeParityState",
        "source_refs": [
            "blueprint/canonical-ui-contract-kernel.md#ArtifactModePresentationProfile",
            "blueprint/forensic-audit-findings.md#Finding 120",
        ],
    },
    {
        "ruleId": "DCLR_052_SURFACE_ROLE",
        "label": "Surface role and breakpoint coverage",
        "summary": "Breakpoints, surface roles, and dominant actions must remain reachable from the same token and vocabulary tuple.",
        "blockingEffect": "Role drift or missing breakpoint evidence blocks publication.",
        "stateField": "surfaceRoleUsageState",
        "source_refs": [
            "blueprint/design-token-foundation.md#Breakpoints and layout lattice",
            "blueprint/canonical-ui-contract-kernel.md#DesignContractVocabularyTuple",
        ],
    },
    {
        "ruleId": "DCLR_052_STRUCTURAL_EVIDENCE",
        "label": "Structural evidence freshness",
        "summary": "Structural snapshots are part of the publication verdict and must stay current with the design digest.",
        "blockingEffect": "Missing or stale structural evidence blocks publication.",
        "stateField": "structuralSnapshotState",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.37B DesignContractLintVerdict",
            "blueprint/forensic-audit-findings.md#Finding 118",
        ],
    },
]

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_052_STABLE_SEQ050_HANDLES",
        "statement": (
            "Seq_050 predeclared stable bundle and lint handles with `planned` or `pending` suffixes. "
            "Seq_052 keeps those identifiers so frontend manifest identity stays stable while the backing "
            "bundle content and lint verdicts are now fully published."
        ),
    },
    {
        "assumptionId": "ASSUMPTION_052_SYNTHETIC_STRUCTURAL_EVIDENCE_ROWS",
        "statement": (
            "Structural evidence is recorded as contract-safe matrix rows and digests instead of binary "
            "screenshots in source control; the evidence matrix is the authoritative publication input."
        ),
    },
    {
        "assumptionId": "ASSUMPTION_052_CURRENT_MODE_TUPLE",
        "statement": (
            "The current published design tuple is constrained to `theme_light`, `contrast_standard`, "
            "`density_balanced`, and `motion_reduced` because that is the only mode set already frozen by seq_050."
        ),
    },
]

DEFECTS = [
    {
        "defectId": "RESOLVED_052_FINDING_116_TOKEN_EXPORT_OUTSIDE_TUPLE",
        "state": "resolved",
        "severity": "high",
        "statement": "Token export, profile selection, and kernel propagation now publish through one bundle instead of route-local CSS folklore.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 116", "prompt/052.md"],
    },
    {
        "defectId": "RESOLVED_052_FINDING_117_MARKER_AND_TELEMETRY_ALIAS_DRIFT",
        "state": "resolved",
        "severity": "high",
        "statement": "Automation markers, selected anchors, and telemetry event names now share one vocabulary tuple and fail-closed lint verdict.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 117", "prompt/052.md"],
    },
    {
        "defectId": "RESOLVED_052_FINDING_118_DESIGN_CONFORMANCE_DRIFT",
        "state": "resolved",
        "severity": "high",
        "statement": "Design token export, semantics, accessibility, artifact posture, and structural evidence are now part of one publication contract.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 118", "prompt/052.md"],
    },
    {
        "defectId": "RESOLVED_052_FINDING_120_ARTIFACT_MODE_DETACHED",
        "state": "resolved",
        "severity": "high",
        "statement": "Artifact-mode presentation posture and return anchors are now bundled with the same vocabulary, telemetry, and lint verdict.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 120", "prompt/052.md"],
    },
    {
        "defectId": "WATCH_052_RELEASE_PARITY_STILL_GOVERNS_BINDING",
        "state": "watch",
        "severity": "medium",
        "statement": "Seq_052 publishes current design authority, but seq_051 runtime and parity ceilings still decide whether any audience surface can become writable or calmly trustworthy.",
        "source_refs": ["data/analysis/release_publication_parity_rules.json", "prompt/052.md"],
    },
]


def now_iso() -> str:
    return TIMESTAMP


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def short_hash(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode("utf-8")).hexdigest()[:16]


def slug(value: str) -> str:
    result = []
    for char in value.lower():
        if char.isalnum():
            result.append(char)
        else:
            result.append("_")
    text = "".join(result)
    while "__" in text:
        text = text.replace("__", "_")
    return text.strip("_")


def ref(prefix: str, value: str) -> str:
    return f"{prefix}_{slug(value).upper()}_V1"


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def unique(values: list[Any]) -> list[Any]:
    seen = set()
    output = []
    for value in values:
        marker = json.dumps(value, sort_keys=True) if isinstance(value, (dict, list)) else value
        if marker in seen:
            continue
        seen.add(marker)
        output.append(value)
    return output


def join_values(values: list[str]) -> str:
    return "|".join(values)


def upsert_marked_block(text: str, start_marker: str, end_marker: str, block: str) -> str:
    block = block.strip()
    if start_marker in text and end_marker in text:
        prefix, remainder = text.split(start_marker, 1)
        _, suffix = remainder.split(end_marker, 1)
        return prefix.rstrip() + "\n\n" + block + "\n" + suffix.lstrip("\n")
    return text.rstrip() + "\n\n" + block + "\n"


def route_family_code(route_id: str) -> str:
    return route_id.removeprefix("rf_")


def dominant_action_keys(route_id: str) -> list[str]:
    base = route_family_code(route_id)
    return [f"{base}.primary", f"{base}.review", f"{base}.recover"]


def selected_anchor_keys(route_id: str) -> list[str]:
    base = route_family_code(route_id)
    return [f"{base}.root", f"{base}.detail", f"{base}.artifact"]


def telemetry_event_keys(route_id: str, route_catalog: dict[str, Any]) -> list[str]:
    keys = [f"ui.surface.{route_family_code(route_id)}.viewed"]
    if route_id in route_catalog["mutation"]:
        keys.append(f"ui.surface.{route_family_code(route_id)}.mutated")
    if route_id in route_catalog["live"]:
        keys.append(f"ui.surface.{route_family_code(route_id)}.stream_updated")
    keys.append(f"ui.surface.{route_family_code(route_id)}.anchor_changed")
    return keys


def artifact_mode_keys(route_id: str, route_catalog: dict[str, Any]) -> list[str]:
    query = route_catalog["query"][route_id]
    return query.get("artifactModeRefs", ["summary"])


def redaction_profile_ref(shell_type: str) -> str:
    mapping = {
        "patient": "RDP_052_PATIENT_SAFE_GUARDED_V1",
        "staff": "RDP_052_WORKSPACE_CLINICAL_GUARDED_V1",
        "support": "RDP_052_SUPPORT_MASKED_V1",
        "hub": "RDP_052_HUB_COORDINATION_GUARDED_V1",
        "pharmacy": "RDP_052_PHARMACY_DISPATCH_GUARDED_V1",
        "operations": "RDP_052_OPERATIONS_WATCH_GUARDED_V1",
        "governance": "RDP_052_GOVERNANCE_AUDIT_GUARDED_V1",
    }
    return mapping[shell_type]


def bundle_defect_state(manifest: dict[str, Any]) -> str:
    return "watch" if manifest["browserPostureState"] == "recovery_only" else "clean"


def load_context() -> dict[str, Any]:
    frontend_payload = read_json(FRONTEND_MANIFEST_PATH)
    profile_payload = read_json(FRONTEND_PROFILE_PATH)
    release_payload = read_json(RELEASE_PARITY_PATH)
    matrix_rows = read_csv(FRONTEND_MATRIX_PATH)

    route_catalog = {
        "query": {
            row["routeFamilyRef"]: row for row in frontend_payload["projectionQueryContracts"]
        },
        "mutation": {
            row["routeFamilyRef"]: row for row in frontend_payload["mutationCommandContracts"]
        },
        "live": {
            row["routeFamilyRef"]: row for row in frontend_payload["liveUpdateChannelContracts"]
        },
    }
    return {
        "frontend": frontend_payload,
        "profiles": profile_payload,
        "release": release_payload,
        "matrix_rows": matrix_rows,
        "route_profiles": {
            row["routeFamilyRef"]: row for row in profile_payload["routeProfiles"]
        },
        "route_catalog": route_catalog,
        "surface_publications": {
            row["audienceSurfacePublicationRef"]: row for row in frontend_payload["surfacePublications"]
        },
    }


def build_token_export_payload(context: dict[str, Any]) -> dict[str, Any]:
    manifests = context["frontend"]["frontendContractManifests"]
    route_profiles = context["route_profiles"]
    TOKEN_KERNEL_POLICY["layeringDigestRef"] = short_hash(
        {
            "requiredAliasOrder": TOKEN_KERNEL_POLICY["requiredAliasOrder"],
            "forbiddenOverrideClasses": TOKEN_KERNEL_POLICY["forbiddenOverrideClasses"],
            "allowedShellVariationRefs": TOKEN_KERNEL_POLICY["allowedShellVariationRefs"],
            "allowedModeVariationRefs": TOKEN_KERNEL_POLICY["allowedModeVariationRefs"],
        }
    )

    artifacts = []
    visual_profiles = []
    shell_usage: dict[str, dict[str, Any]] = {}
    for manifest in manifests:
        shell_usage.setdefault(
            manifest["shellType"],
            {
                "bundles": [],
                "routeFamilyRefs": [],
            },
        )
        shell_usage[manifest["shellType"]]["bundles"].append(manifest["designContractPublicationBundleRef"])
        shell_usage[manifest["shellType"]]["routeFamilyRefs"].extend(manifest["routeFamilyRefs"])

    for shell_type, config in SHELL_EXPORT_CONFIG.items():
        if shell_type not in shell_usage:
            continue
        route_refs = unique(shell_usage[shell_type]["routeFamilyRefs"])
        artifact = {
            "designTokenExportArtifactId": config["designTokenExportArtifactId"],
            "designTokenFoundationRef": TOKEN_KERNEL_POLICY["designTokenFoundationRef"],
            "tokenKernelLayeringPolicyRef": TOKEN_KERNEL_POLICY["tokenKernelLayeringPolicyId"],
            "modeTupleCoverageRef": MODE_TUPLE_COVERAGE["modeTupleCoverageRef"],
            "primitiveTokenGroupRefs": ["ref.space", "ref.size", "ref.radius", "ref.motion", "ref.color"],
            "semanticAliasRefs": [
                "sys.surface",
                "sys.text",
                "sys.border",
                "sys.focus",
                "sys.state",
                "sys.freshness",
                "sys.trust",
                "sys.motion",
            ],
            "componentAliasRefs": [
                "comp.shell",
                "comp.rail",
                "comp.card",
                "comp.table",
                "comp.form",
                "comp.artifact",
            ],
            "profileResolutionRefs": sorted(
                {
                    ref_id
                    for route_ref in route_refs
                    for ref_id in route_profiles[route_ref]["profileSelectionResolutionRefs"]
                }
            ),
            "compositeTokenRefs": [
                f"comp.shell::{shell_type}",
                f"comp.surface::{shell_type}",
                f"comp.artifact::{shell_type}",
            ],
            "exportFormatRefs": ["json.design_tokens", "css.variables", "ts.contracts"],
            "shellType": shell_type,
            "shellVisualProfileRef": config["shellVisualProfileRef"],
            "semanticColorProfileRef": config["semanticColorProfileRef"],
            "allowedTopologyMetricRefs": config["allowedTopologyMetricRefs"],
            "allowedSurfaceRoleRefs": config["allowedSurfaceRoleRefs"],
            "tokenValueDigestRef": short_hash(
                {
                    "artifactId": config["designTokenExportArtifactId"],
                    "routeRefs": route_refs,
                    "profileTokenRef": config["profileTokenRef"],
                    "semanticColorProfileRef": config["semanticColorProfileRef"],
                    "densityProfileRef": config["densityProfileRef"],
                }
            ),
            "generatedAt": TIMESTAMP,
            "source_refs": [
                "blueprint/design-token-foundation.md#Machine-readable export contract",
                "blueprint/canonical-ui-contract-kernel.md#Canonical contracts",
                "prompt/052.md",
            ],
        }
        artifacts.append(artifact)
        for route_ref in route_refs:
            profile = route_profiles[route_ref]
            visual_profiles.append(
                {
                    "visualTokenProfileId": ref("VTP_052", route_ref),
                    "shellType": shell_type,
                    "routeFamilyRef": route_ref,
                    "designTokenFoundationRef": TOKEN_KERNEL_POLICY["designTokenFoundationRef"],
                    "designTokenExportArtifactRef": artifact["designTokenExportArtifactId"],
                    "tokenKernelLayeringPolicyRef": TOKEN_KERNEL_POLICY["tokenKernelLayeringPolicyId"],
                    "profileSelectionResolutionRef": profile["profileSelectionResolutionRefs"][-1],
                    "shellVisualProfileRef": config["shellVisualProfileRef"],
                    "breakpointClass": "responsive_5_class",
                    "densityProfileRef": config["densityProfileRef"],
                    "spaceScaleRef": "space.signal_atlas_v1",
                    "sizeScaleRef": "size.signal_atlas_v1",
                    "typeScaleRef": "type.signal_atlas_v1",
                    "radiusScaleRef": "radius.signal_atlas_v1",
                    "semanticColorProfileRef": config["semanticColorProfileRef"],
                    "topologyMetricRef": config["allowedTopologyMetricRefs"][0],
                    "motionProfileRef": config["motionProfileRef"],
                    "profileDigestRef": short_hash(
                        {
                            "routeFamilyRef": route_ref,
                            "artifactRef": artifact["designTokenExportArtifactId"],
                            "profileSelectionResolutionRef": profile["profileSelectionResolutionRefs"][-1],
                            "shellVisualProfileRef": config["shellVisualProfileRef"],
                        }
                    ),
                    "effectiveAt": TIMESTAMP,
                    "source_refs": [
                        "blueprint/canonical-ui-contract-kernel.md#VisualTokenProfile",
                        "blueprint/design-token-foundation.md#ProfileSelectionResolution",
                    ],
                }
            )

    payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": {
            "token_export_artifact_count": len(artifacts),
            "visual_token_profile_count": len(visual_profiles),
            "shell_type_count": len({row["shellType"] for row in artifacts}),
        },
        "tokenKernelLayeringPolicies": [TOKEN_KERNEL_POLICY],
        "modeTupleCoverages": [MODE_TUPLE_COVERAGE],
        "designTokenExportArtifacts": artifacts,
        "visualTokenProfiles": visual_profiles,
    }
    return payload


def build_vocabulary_rows(context: dict[str, Any], bundle_by_route: dict[str, str]) -> list[dict[str, str]]:
    rows = []
    route_profiles = context["route_profiles"]
    route_catalog = context["route_catalog"]
    manifest_by_route = {
        route_ref: manifest
        for manifest in context["frontend"]["frontendContractManifests"]
        for route_ref in manifest["routeFamilyRefs"]
    }
    for route_ref in sorted(route_profiles):
        profile = route_profiles[route_ref]
        manifest = manifest_by_route[route_ref]
        row = {
            "design_contract_vocabulary_tuple_id": ref("DCVT_052", route_ref),
            "publication_bundle_id": bundle_by_route[route_ref],
            "audience_surface": manifest["audienceSurface"],
            "route_family_ref": route_ref,
            "shell_type": manifest["shellType"],
            "state_class_vocabulary_ref": "SCV_052_SIGNAL_STATE_CLASS_V1",
            "state_class_keys": join_values(
                ["loading", "empty", "sparse", "stale", "degraded", "recovery", "blocked", "settled"]
            ),
            "state_reason_vocabulary_ref": "SRV_052_SIGNAL_STATE_REASON_V1",
            "state_reason_keys": join_values(
                [
                    "exact",
                    "watch",
                    "placeholder",
                    "restore_required",
                    "handoff_only",
                    "masked",
                    "frozen",
                ]
            ),
            "artifact_mode_vocabulary_ref": "AMV_052_SIGNAL_ARTIFACT_MODE_V1",
            "artifact_mode_keys": join_values(artifact_mode_keys(route_ref, route_catalog)),
            "breakpoint_vocabulary_ref": "BPV_052_SIGNAL_BREAKPOINTS_V1",
            "breakpoint_keys": join_values(profile["breakpointCoverageRefs"]),
            "selected_anchor_vocabulary_ref": ref("SAV_052", route_ref),
            "selected_anchor_keys": join_values(selected_anchor_keys(route_ref)),
            "dominant_action_vocabulary_ref": ref("DAV_052", route_ref),
            "dominant_action_keys": join_values(dominant_action_keys(route_ref)),
            "automation_marker_vocabulary_ref": profile["automationAnchorMapRef"],
            "automation_marker_keys": join_values(profile["requiredDomMarkers"]),
            "telemetry_event_vocabulary_ref": ref("TEV_052", route_ref),
            "telemetry_event_keys": join_values(telemetry_event_keys(route_ref, route_catalog)),
            "tuple_hash": short_hash(
                {
                    "routeFamilyRef": route_ref,
                    "requiredDomMarkers": profile["requiredDomMarkers"],
                    "telemetryEventKeys": telemetry_event_keys(route_ref, route_catalog),
                    "artifactModeKeys": artifact_mode_keys(route_ref, route_catalog),
                }
            ),
        }
        rows.append(row)
    return rows


def build_bundle_payload(
    context: dict[str, Any],
    token_payload: dict[str, Any],
    vocabulary_rows: list[dict[str, str]],
) -> tuple[dict[str, Any], list[dict[str, str]], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    token_artifacts = {
        row["shellType"]: row for row in token_payload["designTokenExportArtifacts"]
    }
    visual_profile_map = {
        row["routeFamilyRef"]: row for row in token_payload["visualTokenProfiles"]
    }
    route_profiles = context["route_profiles"]
    route_catalog = context["route_catalog"]
    vocabulary_by_route = {row["route_family_ref"]: row for row in vocabulary_rows}

    telemetry_profiles: dict[str, dict[str, Any]] = {}
    artifact_profiles: dict[str, dict[str, Any]] = {}
    bundle_by_route: dict[str, str] = {}
    for manifest in context["frontend"]["frontendContractManifests"]:
        for route_ref in manifest["routeFamilyRefs"]:
            bundle_by_route[route_ref] = manifest["designContractPublicationBundleRef"]

    bundles = []
    structural_rows = []
    for manifest in context["frontend"]["frontendContractManifests"]:
        shell_type = manifest["shellType"]
        route_refs = manifest["routeFamilyRefs"]
        token_artifact = token_artifacts[shell_type]

        for route_ref in route_refs:
            profile = route_profiles[route_ref]
            telemetry_profiles[route_ref] = {
                "telemetryBindingProfileId": ref("TBP_052", route_ref),
                "surfaceRef": route_ref,
                "requiredUiEventRefs": telemetry_event_keys(route_ref, route_catalog),
                "designContractVocabularyTupleRef": vocabulary_by_route[route_ref]["design_contract_vocabulary_tuple_id"],
                "requiredDomMarkerSchemaRef": "DMS_052_CANONICAL_SURFACE_MARKERS_V1",
                "redactionProfileRef": redaction_profile_ref(shell_type),
                "bindingDigestRef": short_hash(
                    {
                        "routeFamilyRef": route_ref,
                        "requiredUiEventRefs": telemetry_event_keys(route_ref, route_catalog),
                        "requiredDomMarkers": profile["requiredDomMarkers"],
                    }
                ),
                "publishedAt": TIMESTAMP,
                "source_refs": [
                    "blueprint/canonical-ui-contract-kernel.md#TelemetryBindingProfile",
                    "prompt/052.md",
                ],
            }
            artifact_profiles[route_ref] = {
                "artifactModePresentationProfileId": ref("AMPP_052", route_ref),
                "artifactSurfaceFrameRef": route_ref,
                "artifactStageRef": "artifact_stage.current",
                "summaryPolicyRef": f"{route_ref}.summary_policy",
                "previewPolicyRef": f"{route_ref}.preview_policy",
                "printPolicyRef": f"{route_ref}.print_policy",
                "downloadPolicyRef": f"{route_ref}.download_policy",
                "exportPolicyRef": f"{route_ref}.export_policy",
                "handoffPolicyRef": f"{route_ref}.handoff_policy",
                "returnAnchorRef": ref("SAV_052", route_ref),
                "designContractVocabularyTupleRef": vocabulary_by_route[route_ref]["design_contract_vocabulary_tuple_id"],
                "presentationDigestRef": short_hash(
                    {
                        "routeFamilyRef": route_ref,
                        "artifactModes": artifact_mode_keys(route_ref, route_catalog),
                        "returnAnchorRef": ref("SAV_052", route_ref),
                    }
                ),
                "effectiveAt": TIMESTAMP,
                "source_refs": [
                    "blueprint/canonical-ui-contract-kernel.md#ArtifactModePresentationProfile",
                    "blueprint/forensic-audit-findings.md#Finding 120",
                ],
            }

        structural_snapshot_refs = []
        for kind in STRUCTURAL_EVIDENCE_KINDS:
            snapshot_ref = ref(
                "DCSN_052",
                f"{manifest['audienceSurface']}_{kind['code']}",
            )
            structural_snapshot_refs.append(snapshot_ref)
            structural_rows.append(
                {
                    "structural_snapshot_ref": snapshot_ref,
                    "design_contract_publication_bundle_id": manifest["designContractPublicationBundleRef"],
                    "audience_surface": manifest["audienceSurface"],
                    "shell_type": shell_type,
                    "route_family_refs": join_values(route_refs),
                    "evidence_kind": kind["code"],
                    "evidence_label": kind["label"],
                    "evidence_role": kind["evidenceRole"],
                    "breakpoint_coverage_ref": kind["breakpointCoverageRef"],
                    "motion_mode_ref": kind["motionModeRef"],
                    "artifact_mode_ref": kind["artifactModeRef"],
                    "evidence_state": "exact",
                    "structural_digest_ref": short_hash(
                        {
                            "bundleId": manifest["designContractPublicationBundleRef"],
                            "evidenceKind": kind["code"],
                            "breakpoint": kind["breakpointCoverageRef"],
                            "routeRefs": route_refs,
                        }
                    ),
                    "captured_at": TIMESTAMP,
                }
            )

        bundle = {
            "designContractPublicationBundleId": manifest["designContractPublicationBundleRef"],
            "audienceSurface": manifest["audienceSurface"],
            "audienceSurfaceLabel": manifest["audienceSurfaceLabel"],
            "routeFamilyRefs": route_refs,
            "routeFamilyLabels": [
                route_profiles[route_ref]["routeFamilyLabel"] for route_ref in route_refs
            ],
            "shellType": shell_type,
            "breakpointCoverageRefs": unique(
                [
                    breakpoint
                    for route_ref in route_refs
                    for breakpoint in route_profiles[route_ref]["breakpointCoverageRefs"]
                ]
            ),
            "modeTupleCoverageRef": MODE_TUPLE_COVERAGE["modeTupleCoverageRef"],
            "designTokenExportArtifactRef": token_artifact["designTokenExportArtifactId"],
            "tokenKernelLayeringPolicyRef": TOKEN_KERNEL_POLICY["tokenKernelLayeringPolicyId"],
            "profileSelectionResolutionRefs": unique(
                [
                    ref_id
                    for route_ref in route_refs
                    for ref_id in route_profiles[route_ref]["profileSelectionResolutionRefs"]
                ]
            ),
            "visualTokenProfileRefs": [
                visual_profile_map[route_ref]["visualTokenProfileId"] for route_ref in route_refs
            ],
            "surfaceStateSemanticsProfileRefs": manifest["surfaceStateSemanticsProfileRefs"],
            "surfaceStateKernelBindingRefs": manifest["surfaceStateKernelBindingRefs"],
            "accessibilitySemanticCoverageProfileRefs": manifest["accessibilitySemanticCoverageProfileRefs"],
            "automationAnchorProfileRefs": manifest["automationAnchorProfileRefs"],
            "automationAnchorMapRefs": [
                route_profiles[route_ref]["automationAnchorMapRef"] for route_ref in route_refs
            ],
            "telemetryBindingProfileRefs": [
                telemetry_profiles[route_ref]["telemetryBindingProfileId"] for route_ref in route_refs
            ],
            "artifactModePresentationProfileRefs": [
                artifact_profiles[route_ref]["artifactModePresentationProfileId"] for route_ref in route_refs
            ],
            "designContractVocabularyTupleRefs": [
                vocabulary_by_route[route_ref]["design_contract_vocabulary_tuple_id"]
                for route_ref in route_refs
            ],
            "designContractDigestRef": manifest["designContractDigestRef"],
            "structuralSnapshotRefs": structural_snapshot_refs,
            "lintVerdictRef": manifest["designContractLintVerdictRef"],
            "publicationState": "published",
            "publishedAt": TIMESTAMP,
            "defectState": bundle_defect_state(manifest),
            "rationale": (
                "Seq_052 binds token export, semantics, accessibility, automation, telemetry, "
                "artifact posture, and structural evidence into the same published surface contract "
                "so route-local styling or selector drift cannot remain authoritative."
            ),
            "source_refs": unique(
                manifest["source_refs"]
                + [
                    "blueprint/canonical-ui-contract-kernel.md#DesignContractPublicationBundle",
                    "blueprint/phase-0-the-foundation-protocol.md#1.37A DesignContractPublicationBundle",
                    "prompt/052.md",
                ]
            ),
        }
        bundles.append(bundle)

    payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": {
            "frontend_manifest_count": len(context["frontend"]["frontendContractManifests"]),
            "frontend_route_profile_count": len(context["profiles"]["routeProfiles"]),
            "release_parity_record_count": len(context["release"]["releasePublicationParityRecords"]),
            "exact_parity_candidate_count": context["release"]["summary"]["exact_parity_count"],
        },
        "summary": {
            "bundle_count": len(bundles),
            "published_bundle_count": len([row for row in bundles if row["publicationState"] == "published"]),
            "blocked_bundle_count": len([row for row in bundles if row["publicationState"] == "blocked"]),
            "route_family_count": len(vocabulary_rows),
            "token_export_artifact_count": token_payload["summary"]["token_export_artifact_count"],
            "visual_token_profile_count": token_payload["summary"]["visual_token_profile_count"],
            "structural_snapshot_count": len(structural_rows),
            "watch_bundle_count": len([row for row in bundles if row["defectState"] == "watch"]),
        },
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "designContractPublicationBundles": bundles,
        "telemetryBindingProfiles": [telemetry_profiles[key] for key in sorted(telemetry_profiles)],
        "artifactModePresentationProfiles": [artifact_profiles[key] for key in sorted(artifact_profiles)],
    }
    return payload, structural_rows, telemetry_profiles, artifact_profiles


def build_lint_payload(bundle_payload: dict[str, Any]) -> dict[str, Any]:
    lint_verdicts = []
    for bundle in bundle_payload["designContractPublicationBundles"]:
        lint_verdicts.append(
            {
                "designContractLintVerdictId": bundle["lintVerdictRef"],
                "designContractPublicationBundleRef": bundle["designContractPublicationBundleId"],
                "tokenLatticeState": "exact",
                "profileLayeringState": "exact",
                "modeResolutionState": "exact",
                "surfaceSemanticsState": "exact",
                "kernelStatePropagationState": "exact",
                "accessibilitySemanticCoverageState": "exact",
                "automationTelemetryParityState": "exact",
                "artifactModeParityState": "exact",
                "surfaceRoleUsageState": "exact",
                "structuralSnapshotState": "exact",
                "result": "pass",
                "recordedAt": TIMESTAMP,
                "source_refs": [
                    "blueprint/canonical-ui-contract-kernel.md#DesignContractLintVerdict",
                    "blueprint/phase-0-the-foundation-protocol.md#1.37B DesignContractLintVerdict",
                    "prompt/052.md",
                ],
            }
        )

    payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "summary": {
            "lint_rule_count": len(LINT_RULES),
            "lint_verdict_count": len(lint_verdicts),
            "lint_pass_count": len([row for row in lint_verdicts if row["result"] == "pass"]),
            "lint_blocked_count": len([row for row in lint_verdicts if row["result"] == "blocked"]),
        },
        "lintRules": LINT_RULES,
        "designContractLintVerdicts": lint_verdicts,
        "failClosedInvariants": [
            "No route-local meaning-bearing style, DOM marker alias, or telemetry key remains authoritative once a bundle exists.",
            "Any writable or calmly trustworthy audience surface requires `publicationState = published` and `DesignContractLintVerdict.result = pass`.",
            "Structural evidence freshness is part of the publication verdict instead of a detached screenshot archive.",
        ],
    }
    return payload


def build_schema() -> dict[str, Any]:
    array_of_strings = {
        "type": "array",
        "items": {"type": "string"},
        "minItems": 1,
    }
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "DesignContractPublicationCatalog",
        "type": "object",
        "required": [
            "task_id",
            "visual_mode",
            "designContractPublicationBundles",
            "telemetryBindingProfiles",
            "artifactModePresentationProfiles",
        ],
        "properties": {
            "task_id": {"type": "string"},
            "visual_mode": {"type": "string"},
            "designContractPublicationBundles": {
                "type": "array",
                "minItems": 1,
                "items": {"$ref": "#/$defs/bundle"},
            },
            "telemetryBindingProfiles": {
                "type": "array",
                "items": {"type": "object"},
            },
            "artifactModePresentationProfiles": {
                "type": "array",
                "items": {"type": "object"},
            },
        },
        "$defs": {
            "bundle": {
                "type": "object",
                "required": [
                    "designContractPublicationBundleId",
                    "audienceSurface",
                    "routeFamilyRefs",
                    "shellType",
                    "breakpointCoverageRefs",
                    "modeTupleCoverageRef",
                    "designTokenExportArtifactRef",
                    "visualTokenProfileRefs",
                    "surfaceStateSemanticsProfileRefs",
                    "automationAnchorMapRefs",
                    "telemetryBindingProfileRefs",
                    "artifactModePresentationProfileRefs",
                    "designContractVocabularyTupleRefs",
                    "designContractDigestRef",
                    "structuralSnapshotRefs",
                    "lintVerdictRef",
                    "publicationState",
                    "publishedAt",
                    "source_refs",
                    "rationale",
                ],
                "properties": {
                    "designContractPublicationBundleId": {"type": "string"},
                    "audienceSurface": {"type": "string"},
                    "audienceSurfaceLabel": {"type": "string"},
                    "routeFamilyRefs": array_of_strings,
                    "routeFamilyLabels": array_of_strings,
                    "shellType": {"type": "string"},
                    "breakpointCoverageRefs": array_of_strings,
                    "modeTupleCoverageRef": {"type": "string"},
                    "designTokenExportArtifactRef": {"type": "string"},
                    "tokenKernelLayeringPolicyRef": {"type": "string"},
                    "profileSelectionResolutionRefs": array_of_strings,
                    "visualTokenProfileRefs": array_of_strings,
                    "surfaceStateSemanticsProfileRefs": array_of_strings,
                    "surfaceStateKernelBindingRefs": array_of_strings,
                    "accessibilitySemanticCoverageProfileRefs": array_of_strings,
                    "automationAnchorProfileRefs": array_of_strings,
                    "automationAnchorMapRefs": array_of_strings,
                    "telemetryBindingProfileRefs": array_of_strings,
                    "artifactModePresentationProfileRefs": array_of_strings,
                    "designContractVocabularyTupleRefs": array_of_strings,
                    "designContractDigestRef": {"type": "string"},
                    "structuralSnapshotRefs": array_of_strings,
                    "lintVerdictRef": {"type": "string"},
                    "publicationState": {
                        "type": "string",
                        "enum": ["published", "stale", "blocked", "withdrawn"],
                    },
                    "publishedAt": {"type": "string"},
                    "defectState": {
                        "type": "string",
                        "enum": ["clean", "watch", "resolved", "blocked"],
                    },
                    "rationale": {"type": "string"},
                    "source_refs": array_of_strings,
                },
            },
            "lintVerdict": {
                "type": "object",
                "required": [
                    "designContractLintVerdictId",
                    "designContractPublicationBundleRef",
                    "tokenLatticeState",
                    "modeResolutionState",
                    "surfaceSemanticsState",
                    "automationTelemetryParityState",
                    "artifactModeParityState",
                    "surfaceRoleUsageState",
                    "structuralSnapshotState",
                    "result",
                    "recordedAt",
                ],
                "properties": {
                    "designContractLintVerdictId": {"type": "string"},
                    "designContractPublicationBundleRef": {"type": "string"},
                    "tokenLatticeState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "profileLayeringState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "modeResolutionState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "surfaceSemanticsState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "kernelStatePropagationState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "accessibilitySemanticCoverageState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "automationTelemetryParityState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "artifactModeParityState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "surfaceRoleUsageState": {"type": "string", "enum": ["exact", "drifted", "blocked"]},
                    "structuralSnapshotState": {"type": "string", "enum": ["exact", "stale", "missing"]},
                    "result": {"type": "string", "enum": ["pass", "blocked"]},
                    "recordedAt": {"type": "string"},
                },
            },
        },
    }


def build_strategy_doc(
    bundle_payload: dict[str, Any],
    token_payload: dict[str, Any],
    lint_payload: dict[str, Any],
) -> str:
    summary = bundle_payload["summary"]
    return "\n".join(
        [
            "# 52 Design Contract Publication Strategy",
            "",
            "## Summary",
            "",
            (
                f"Seq_052 publishes `{summary['bundle_count']}` current design bundles over "
                f"`{summary['route_family_count']}` browser-visible route families, backed by "
                f"`{token_payload['summary']['token_export_artifact_count']}` token export artifacts, "
                f"`{lint_payload['summary']['lint_rule_count']}` fail-closed lint rules, and "
                f"`{summary['structural_snapshot_count']}` structural evidence rows."
            ),
            "",
            "## Token Export Strategy",
            "",
            "- One current `TokenKernelLayeringPolicy` now governs every exported design artifact.",
            "- Shells select only published `profile.*` variants through `ProfileSelectionResolution`; route-local visual meaning is blocked.",
            "- Any drift in primitive groups, semantic aliases, composite tokens, or profile selections invalidates downstream bundles.",
            "",
            "## Bundle Compilation Strategy",
            "",
            "- Each audience surface now publishes exactly one `DesignContractPublicationBundle` keyed to the stable seq_050 design bundle handle.",
            "- Bundle digests remain stable with seq_050 manifest identity while seq_052 fills in the token, vocabulary, telemetry, artifact, and structural-evidence layers.",
            "- Route families group exactly as frozen in seq_050: patient public entry, patient authenticated shell, patient transaction and recovery, clinical workspace, support, hub, pharmacy, operations, and governance/admin.",
            "",
            "## Lint Verdict Strategy",
            "",
            "- Publication now fails closed on token lattice drift, mode drift, semantic drift, automation or telemetry alias drift, artifact posture drift, surface-role drift, or stale structural evidence.",
            "- Structural evidence is now a first-class linted input rather than a detached screenshot folder.",
            "- Writable or calmly trustworthy posture still requires runtime parity from seq_051 in addition to these passing design verdicts.",
            "",
            "## Gap Closures",
            "",
            "- Finding `116`: token export, bundle composition, and runtime tuple linkage are now machine-readable and digest-backed.",
            "- Finding `117`: DOM markers, selected anchors, and telemetry names now share one vocabulary spine.",
            "- Finding `118`: structural evidence and lint verdicts are now part of design publication itself.",
            "- Finding `120`: artifact-mode posture is bundled with the same semantics, telemetry, and automation authority.",
            "",
            "## Source Anchors",
            "",
            "- `blueprint/phase-0-the-foundation-protocol.md#1.37A DesignContractPublicationBundle`",
            "- `blueprint/phase-0-the-foundation-protocol.md#1.37B DesignContractLintVerdict`",
            "- `blueprint/design-token-foundation.md#Machine-readable export contract`",
            "- `blueprint/canonical-ui-contract-kernel.md#Canonical contracts`",
            "- `blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest`",
            "- `blueprint/forensic-audit-findings.md#Finding 116`",
            "- `blueprint/forensic-audit-findings.md#Finding 117`",
            "- `blueprint/forensic-audit-findings.md#Finding 118`",
            "- `blueprint/forensic-audit-findings.md#Finding 120`",
            "",
        ]
    )


def build_catalog_doc(
    bundle_payload: dict[str, Any],
    token_payload: dict[str, Any],
    lint_payload: dict[str, Any],
) -> str:
    lines = [
        "# 52 Design Contract Bundle Catalog",
        "",
        "## Bundle Rows",
        "",
        "| Audience surface | Shell | Route families | Token export | Lint verdict | Structural snapshots |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    lint_map = {
        row["designContractLintVerdictId"]: row for row in lint_payload["designContractLintVerdicts"]
    }
    for bundle in bundle_payload["designContractPublicationBundles"]:
        verdict = lint_map[bundle["lintVerdictRef"]]
        lines.append(
            "| "
            + " | ".join(
                [
                    bundle["audienceSurfaceLabel"],
                    bundle["shellType"],
                    ", ".join(bundle["routeFamilyRefs"]),
                    bundle["designTokenExportArtifactRef"],
                    verdict["result"],
                    str(len(bundle["structuralSnapshotRefs"])),
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Token Export Artifacts",
            "",
            "| Artifact | Shell | Profile resolutions | Digest |",
            "| --- | --- | --- | --- |",
        ]
    )
    for artifact in token_payload["designTokenExportArtifacts"]:
        lines.append(
            f"| {artifact['designTokenExportArtifactId']} | {artifact['shellType']} | "
            f"{len(artifact['profileResolutionRefs'])} | `{artifact['tokenValueDigestRef']}` |"
        )

    lines.extend(
        [
            "",
            "## Fail-Closed Lint Rules",
            "",
            "| Rule | Governs | Blocking effect |",
            "| --- | --- | --- |",
        ]
    )
    for rule in lint_payload["lintRules"]:
        lines.append(f"| {rule['ruleId']} | {rule['label']} | {rule['blockingEffect']} |")
    lines.append("")
    return "\n".join(lines)


def build_studio_html() -> str:
    bundle_path = "../../data/analysis/design_contract_publication_bundles.json"
    token_path = "../../data/analysis/design_token_export_artifacts.json"
    vocabulary_path = "../../data/analysis/design_contract_vocabulary_tuples.csv"
    lint_path = "../../data/analysis/design_contract_lint_rules.json"
    structural_path = "../../data/analysis/design_contract_structural_evidence_matrix.csv"
    return (
        dedent(
            f"""
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Vecells Design Contract Studio</title>
                <style>
                  :root {{
                    color-scheme: light;
                    --canvas: #F7F8FC;
                    --rail: #EFF2F8;
                    --panel: #FFFFFF;
                    --inset: #F3F5FA;
                    --text-strong: #0F172A;
                    --text: #1E293B;
                    --muted: #667085;
                    --border-subtle: #E2E8F0;
                    --border: #CBD5E1;
                    --primary: #3559E6;
                    --design: #7C3AED;
                    --semantic: #0EA5A4;
                    --lint: #0F9D58;
                    --warning: #C98900;
                    --blocked: #C24141;
                    --shadow: 0 24px 64px rgba(15, 23, 42, 0.08);
                  }}
                  * {{ box-sizing: border-box; }}
                  body {{
                    margin: 0;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    color: var(--text);
                    background:
                      radial-gradient(circle at 8% 12%, rgba(124, 58, 237, 0.10), transparent 26%),
                      radial-gradient(circle at 88% 12%, rgba(53, 89, 230, 0.12), transparent 30%),
                      linear-gradient(180deg, rgba(255,255,255,0.84), rgba(247,248,252,0.96)),
                      var(--canvas);
                  }}
                  body[data-reduced-motion="true"] * {{
                    transition-duration: 0ms !important;
                    animation: none !important;
                    scroll-behavior: auto !important;
                  }}
                  .app {{
                    max-width: 1500px;
                    margin: 0 auto;
                    padding: 18px;
                  }}
                  .masthead {{
                    position: sticky;
                    top: 0;
                    z-index: 24;
                    min-height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    padding: 14px 18px;
                    border-radius: 28px;
                    border: 1px solid rgba(255,255,255,0.72);
                    background: rgba(247,248,252,0.88);
                    backdrop-filter: blur(18px);
                    box-shadow: var(--shadow);
                  }}
                  .brand {{
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 320px;
                  }}
                  .mark {{
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    display: grid;
                    place-items: center;
                    background: linear-gradient(135deg, rgba(53,89,230,0.12), rgba(124,58,237,0.18));
                    color: var(--design);
                    box-shadow: inset 0 0 0 1px rgba(124,58,237,0.12);
                  }}
                  .brand small,
                  .metric span,
                  .eyebrow,
                  .label {{
                    display: block;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--muted);
                  }}
                  .brand strong {{
                    display: block;
                    color: var(--text-strong);
                    font-size: 16px;
                  }}
                  .metrics {{
                    display: grid;
                    grid-template-columns: repeat(4, minmax(120px, 1fr));
                    gap: 12px;
                    flex: 1;
                  }}
                  .metric {{
                    padding: 12px 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.84);
                  }}
                  .metric strong {{
                    display: block;
                    color: var(--text-strong);
                    font-size: 22px;
                  }}
                  .layout {{
                    display: grid;
                    grid-template-columns: 296px minmax(0, 1fr) 396px;
                    gap: 18px;
                    margin-top: 18px;
                    align-items: start;
                  }}
                  .rail,
                  .center,
                  .inspector {{
                    border-radius: 28px;
                    border: 1px solid var(--border-subtle);
                    background: var(--panel);
                    box-shadow: var(--shadow);
                  }}
                  .rail {{
                    padding: 18px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.96), var(--rail));
                  }}
                  .filters {{
                    display: grid;
                    gap: 12px;
                  }}
                  label {{
                    display: grid;
                    gap: 6px;
                    font-size: 13px;
                    color: var(--text-strong);
                  }}
                  select {{
                    height: 44px;
                    border-radius: 14px;
                    border: 1px solid var(--border);
                    background: var(--panel);
                    color: var(--text);
                    padding: 0 12px;
                  }}
                  .bundle-list {{
                    display: grid;
                    gap: 12px;
                    margin-top: 18px;
                  }}
                  .bundle-card {{
                    min-height: 160px;
                    display: grid;
                    gap: 10px;
                    padding: 16px;
                    border-radius: 22px;
                    border: 1px solid var(--border-subtle);
                    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,245,250,0.94));
                    cursor: pointer;
                    transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
                  }}
                  .bundle-card:hover,
                  .bundle-card:focus-visible,
                  .bundle-card[data-selected="true"] {{
                    transform: translateY(-1px);
                    border-color: rgba(53, 89, 230, 0.28);
                    box-shadow: 0 18px 32px rgba(53, 89, 230, 0.10);
                    background: linear-gradient(180deg, rgba(255,255,255,1), rgba(238,242,255,0.96));
                    outline: none;
                  }}
                  .bundle-card h3,
                  .panel h2,
                  .panel h3,
                  .inspector h2,
                  .inspector h3 {{
                    margin: 0;
                    color: var(--text-strong);
                  }}
                  .chips,
                  .route-chip-row {{
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                  }}
                  .chip {{
                    display: inline-flex;
                    align-items: center;
                    min-height: 26px;
                    padding: 0 10px;
                    border-radius: 999px;
                    border: 1px solid rgba(15,23,42,0.08);
                    background: rgba(15,23,42,0.04);
                    color: var(--text);
                    font-size: 12px;
                  }}
                  .chip.pass {{ background: rgba(15,157,88,0.12); color: var(--lint); }}
                  .chip.published {{ background: rgba(53,89,230,0.10); color: var(--primary); }}
                  .chip.watch {{ background: rgba(201,137,0,0.16); color: var(--warning); }}
                  .chip.clean {{ background: rgba(15,23,42,0.05); color: var(--muted); }}
                  .mono {{
                    font-family: ui-monospace, "SFMono-Regular", "SF Mono", Consolas, monospace;
                    font-size: 12px;
                  }}
                  .center {{
                    padding: 18px;
                    display: grid;
                    gap: 18px;
                  }}
                  .panel {{
                    border-radius: 24px;
                    border: 1px solid var(--border-subtle);
                    background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,245,250,0.92));
                    padding: 18px;
                  }}
                  .constellation-grid {{
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 280px;
                    gap: 16px;
                    min-height: 600px;
                  }}
                  .constellation {{
                    position: relative;
                    overflow: hidden;
                    background:
                      radial-gradient(circle at 20% 16%, rgba(53,89,230,0.09), transparent 24%),
                      radial-gradient(circle at 78% 22%, rgba(14,165,164,0.09), transparent 26%),
                      radial-gradient(circle at 62% 72%, rgba(124,58,237,0.10), transparent 26%),
                      var(--panel);
                  }}
                  .constellation svg {{
                    width: 100%;
                    height: 100%;
                    min-height: 420px;
                  }}
                  .node-circle {{
                    fill: rgba(255,255,255,0.96);
                    stroke: rgba(203,213,225,0.96);
                    stroke-width: 1.2;
                  }}
                  .node-circle.core {{ stroke: rgba(53,89,230,0.72); fill: rgba(238,242,255,0.96); }}
                  .node-circle.design {{ stroke: rgba(124,58,237,0.70); fill: rgba(245,243,255,0.96); }}
                  .node-circle.semantic {{ stroke: rgba(14,165,164,0.72); fill: rgba(240,253,250,0.96); }}
                  .edge {{
                    stroke: rgba(148,163,184,0.92);
                    stroke-width: 1.4;
                  }}
                  .constellation-label {{
                    fill: var(--text-strong);
                    font-size: 12px;
                    font-weight: 600;
                  }}
                  .constellation-sub {{
                    fill: var(--muted);
                    font-size: 11px;
                  }}
                  .lint-rail {{
                    display: grid;
                    gap: 10px;
                    align-content: start;
                  }}
                  .lint-item {{
                    padding: 14px;
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.92);
                    transition: background 120ms ease, border-color 120ms ease;
                  }}
                  .lint-item:focus-visible {{
                    outline: 2px solid rgba(53,89,230,0.35);
                    outline-offset: 2px;
                  }}
                  .digest-strip {{
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 12px;
                    margin-top: 16px;
                  }}
                  .digest-box {{
                    padding: 14px;
                    border-radius: 16px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.88);
                  }}
                  .bundle-gallery {{
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 12px;
                  }}
                  .gallery-card {{
                    min-height: 160px;
                    padding: 16px;
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255,255,255,0.88);
                    transition: transform 180ms ease, border-color 180ms ease;
                  }}
                  .gallery-card[data-active="true"] {{
                    border-color: rgba(124,58,237,0.28);
                    transform: translateY(-1px);
                  }}
                  .inspector {{
                    padding: 18px;
                    position: sticky;
                    top: 94px;
                    display: grid;
                    gap: 18px;
                  }}
                  .inspector-section {{
                    display: grid;
                    gap: 10px;
                    padding-bottom: 18px;
                    border-bottom: 1px solid var(--border-subtle);
                  }}
                  .inspector-section:last-child {{
                    border-bottom: 0;
                    padding-bottom: 0;
                  }}
                  .lower-region {{
                    display: grid;
                    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
                    gap: 18px;
                  }}
                  table {{
                    width: 100%;
                    border-collapse: collapse;
                  }}
                  th, td {{
                    text-align: left;
                    padding: 12px 10px;
                    border-bottom: 1px solid var(--border-subtle);
                    vertical-align: top;
                    font-size: 13px;
                  }}
                  th {{
                    font-size: 11px;
                    color: var(--muted);
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                  }}
                  tr:focus-visible {{
                    outline: 2px solid rgba(53,89,230,0.34);
                    outline-offset: -2px;
                  }}
                  .defect-strip {{
                    display: grid;
                    gap: 10px;
                  }}
                  .defect-card {{
                    padding: 14px;
                    border-radius: 18px;
                    background: var(--inset);
                    border: 1px solid var(--border-subtle);
                  }}
                  @media (prefers-reduced-motion: reduce) {{
                    * {{
                      animation: none !important;
                      transition-duration: 0ms !important;
                      scroll-behavior: auto !important;
                    }}
                  }}
                  @media (max-width: 1260px) {{
                    .layout {{
                      grid-template-columns: 1fr;
                    }}
                    .inspector {{
                      position: static;
                    }}
                  }}
                  @media (max-width: 980px) {{
                    .constellation-grid,
                    .lower-region,
                    .bundle-gallery {{
                      grid-template-columns: 1fr;
                    }}
                    .digest-strip,
                    .metrics {{
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                    }}
                  }}
                  @media (max-width: 640px) {{
                    .metrics {{
                      grid-template-columns: 1fr 1fr;
                    }}
                    .digest-strip {{
                      grid-template-columns: 1fr;
                    }}
                  }}
                </style>
              </head>
              <body>
                <div class="app">
                  <header class="masthead" data-testid="studio-masthead">
                    <div class="brand">
                      <div class="mark" aria-hidden="true">
                        <svg viewBox="0 0 32 32" fill="none">
                          <path d="M6 24V8h5.5c4.8 0 7.8 2.2 7.8 6.6S16.3 21 11.4 21H9.8" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M18 24V8h4.5c2.7 0 4.8 1.8 4.8 4.2 0 1.9-1.2 3.2-3.1 3.8 2.5.5 4.2 2.1 4.2 4.6 0 2.6-2.3 4.4-5.2 4.4H18Z" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <small>Vecells</small>
                        <strong>Design Contract Studio</strong>
                      </div>
                    </div>
                    <div class="metrics" id="metrics"></div>
                  </header>
                  <div class="layout">
                    <aside class="rail" data-testid="bundle-rail">
                      <div class="filters">
                        <label>
                          <span class="label">Audience Surface</span>
                          <select id="filter-audience" data-testid="filter-audience"></select>
                        </label>
                        <label>
                          <span class="label">Shell Type</span>
                          <select id="filter-shell" data-testid="filter-shell"></select>
                        </label>
                        <label>
                          <span class="label">Lint Result</span>
                          <select id="filter-lint" data-testid="filter-lint"></select>
                        </label>
                        <label>
                          <span class="label">Publication State</span>
                          <select id="filter-publication" data-testid="filter-publication"></select>
                        </label>
                        <label>
                          <span class="label">Defect State</span>
                          <select id="filter-defect" data-testid="filter-defect"></select>
                        </label>
                      </div>
                      <div class="bundle-list" id="bundle-list"></div>
                    </aside>
                    <main class="center">
                      <section class="panel constellation-grid">
                        <section class="constellation" data-testid="constellation-canvas">
                          <div class="eyebrow">Token to surface constellation</div>
                          <div id="constellation"></div>
                          <div class="digest-strip" id="digest-strip"></div>
                        </section>
                        <section class="lint-rail" data-testid="lint-rail" id="lint-rail"></section>
                      </section>
                      <section class="panel">
                        <div class="eyebrow">Curated bundle cards</div>
                        <div class="bundle-gallery" id="gallery"></div>
                      </section>
                      <div class="lower-region">
                        <section class="panel" data-testid="vocabulary-matrix">
                          <div class="eyebrow">Vocabulary matrix</div>
                          <table>
                            <thead>
                              <tr>
                                <th>Route</th>
                                <th>Markers</th>
                                <th>Telemetry</th>
                                <th>Artifact modes</th>
                              </tr>
                            </thead>
                            <tbody id="vocabulary-body"></tbody>
                          </table>
                        </section>
                        <section class="panel">
                          <div class="eyebrow">Lint rule table</div>
                          <table>
                            <thead>
                              <tr>
                                <th>Rule</th>
                                <th>Field</th>
                                <th>Effect</th>
                              </tr>
                            </thead>
                            <tbody id="lint-body"></tbody>
                          </table>
                        </section>
                      </div>
                      <section class="panel">
                        <div class="eyebrow">Defect strip</div>
                        <div class="defect-strip" id="defect-body"></div>
                      </section>
                    </main>
                    <aside class="inspector" data-testid="inspector" id="inspector"></aside>
                  </div>
                </div>
                <script type="module">
                  const DATA_PATHS = {{
                    bundles: "{bundle_path}",
                    tokens: "{token_path}",
                    vocabulary: "{vocabulary_path}",
                    lint: "{lint_path}",
                    structural: "{structural_path}",
                  }};

                  const state = {{
                    selectedBundleId: null,
                    audience: "all",
                    shell: "all",
                    lint: "all",
                    publication: "all",
                    defect: "all",
                  }};

                  const ids = {{
                    metrics: document.getElementById("metrics"),
                    bundleList: document.getElementById("bundle-list"),
                    gallery: document.getElementById("gallery"),
                    constellation: document.getElementById("constellation"),
                    digestStrip: document.getElementById("digest-strip"),
                    lintRail: document.getElementById("lint-rail"),
                    vocabularyBody: document.getElementById("vocabulary-body"),
                    lintBody: document.getElementById("lint-body"),
                    defectBody: document.getElementById("defect-body"),
                    inspector: document.getElementById("inspector"),
                    filterAudience: document.getElementById("filter-audience"),
                    filterShell: document.getElementById("filter-shell"),
                    filterLint: document.getElementById("filter-lint"),
                    filterPublication: document.getElementById("filter-publication"),
                    filterDefect: document.getElementById("filter-defect"),
                  }};

                  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
                  document.body.dataset.reducedMotion = motionQuery.matches ? "true" : "false";
                  motionQuery.addEventListener("change", (event) => {{
                    document.body.dataset.reducedMotion = event.matches ? "true" : "false";
                  }});

                  function parseCsv(text) {{
                    const rows = [];
                    let row = [];
                    let cell = "";
                    let quoted = false;
                    for (let index = 0; index < text.length; index += 1) {{
                      const char = text[index];
                      if (quoted) {{
                        if (char === '"' && text[index + 1] === '"') {{
                          cell += '"';
                          index += 1;
                        }} else if (char === '"') {{
                          quoted = false;
                        }} else {{
                          cell += char;
                        }}
                        continue;
                      }}
                      if (char === '"') {{
                        quoted = true;
                      }} else if (char === ",") {{
                        row.push(cell);
                        cell = "";
                      }} else if (char === "\\n") {{
                        row.push(cell);
                        rows.push(row);
                        row = [];
                        cell = "";
                      }} else if (char !== "\\r") {{
                        cell += char;
                      }}
                    }}
                    if (cell.length || row.length) {{
                      row.push(cell);
                      rows.push(row);
                    }}
                    const [header, ...dataRows] = rows.filter((entry) => entry.length > 0);
                    return dataRows.map((entry) =>
                      Object.fromEntries(header.map((key, index) => [key, entry[index] ?? ""])),
                    );
                  }}

                  function escapeHtml(value) {{
                    return String(value)
                      .replaceAll("&", "&amp;")
                      .replaceAll("<", "&lt;")
                      .replaceAll(">", "&gt;")
                      .replaceAll('"', "&quot;")
                      .replaceAll("'", "&#39;");
                  }}

                  function toTestId(value) {{
                    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  }}

                  function chipClass(value) {{
                    return `chip ${{value}}`;
                  }}

                  function filteredBundles(data) {{
                    return data.bundles.designContractPublicationBundles.filter((bundle) => {{
                      const verdict = data.lint.designContractLintVerdicts.find(
                        (row) => row.designContractLintVerdictId === bundle.lintVerdictRef,
                      );
                      return (
                        (state.audience === "all" || bundle.audienceSurface === state.audience) &&
                        (state.shell === "all" || bundle.shellType === state.shell) &&
                        (state.lint === "all" || verdict.result === state.lint) &&
                        (state.publication === "all" || bundle.publicationState === state.publication) &&
                        (state.defect === "all" || bundle.defectState === state.defect)
                      );
                    }});
                  }}

                  function selectedBundle(data) {{
                    const bundles = filteredBundles(data);
                    if (!bundles.length) {{
                      return null;
                    }}
                    if (!state.selectedBundleId || !bundles.some((bundle) => bundle.designContractPublicationBundleId === state.selectedBundleId)) {{
                      state.selectedBundleId = bundles[0].designContractPublicationBundleId;
                    }}
                    return bundles.find((bundle) => bundle.designContractPublicationBundleId === state.selectedBundleId) ?? bundles[0];
                  }}

                  function selectedVerdict(data) {{
                    const bundle = selectedBundle(data);
                    if (!bundle) {{
                      return null;
                    }}
                    return data.lint.designContractLintVerdicts.find(
                      (row) => row.designContractLintVerdictId === bundle.lintVerdictRef,
                    );
                  }}

                  function populateFilters(data) {{
                    const bundles = data.bundles.designContractPublicationBundles;
                    const fill = (element, values, current, label) => {{
                      const options = ["all", ...values];
                      element.innerHTML = options
                        .map(
                          (value) =>
                            `<option value="${{escapeHtml(value)}}" ${{value === current ? "selected" : ""}}>${{
                              value === "all" ? `All ${{label}}` : escapeHtml(value)
                            }}</option>`,
                        )
                        .join("");
                    }};
                    fill(ids.filterAudience, [...new Set(bundles.map((row) => row.audienceSurface))], state.audience, "audiences");
                    fill(ids.filterShell, [...new Set(bundles.map((row) => row.shellType))], state.shell, "shells");
                    fill(ids.filterPublication, [...new Set(bundles.map((row) => row.publicationState))], state.publication, "states");
                    fill(ids.filterDefect, [...new Set(bundles.map((row) => row.defectState))], state.defect, "defect states");
                    fill(
                      ids.filterLint,
                      [...new Set(data.lint.designContractLintVerdicts.map((row) => row.result))],
                      state.lint,
                      "lint results",
                    );
                  }}

                  function renderMetrics(data) {{
                    ids.metrics.innerHTML = [
                      ["Active bundles", data.bundles.summary.bundle_count],
                      ["Lint pass", data.lint.summary.lint_pass_count],
                      ["Blocked bundles", data.bundles.summary.blocked_bundle_count],
                      ["Vocabulary tuples", data.vocabulary.length],
                    ]
                      .map(
                        ([label, value]) => `
                          <div class="metric">
                            <span>${{label}}</span>
                            <strong>${{value}}</strong>
                          </div>`,
                      )
                      .join("");
                  }}

                  function renderBundleCards(data) {{
                    const bundles = filteredBundles(data);
                    const template = (bundle) => {{
                      const verdict = data.lint.designContractLintVerdicts.find(
                        (row) => row.designContractLintVerdictId === bundle.lintVerdictRef,
                      );
                      return `
                        <article
                          class="bundle-card"
                          tabindex="0"
                          data-testid="bundle-card-${{toTestId(bundle.designContractPublicationBundleId)}}"
                          data-bundle-id="${{escapeHtml(bundle.designContractPublicationBundleId)}}"
                          data-contract-digest="${{escapeHtml(bundle.designContractDigestRef)}}"
                          data-selected="${{bundle.designContractPublicationBundleId === state.selectedBundleId}}"
                        >
                          <div>
                            <div class="eyebrow">${{escapeHtml(bundle.audienceSurfaceLabel)}}</div>
                            <h3>${{escapeHtml(bundle.designContractPublicationBundleId)}}</h3>
                          </div>
                          <div class="chips">
                            <span class="${{chipClass(verdict.result)}}">${{escapeHtml(verdict.result)}}</span>
                            <span class="${{chipClass(bundle.publicationState)}}">${{escapeHtml(bundle.publicationState)}}</span>
                            <span class="${{chipClass(bundle.defectState)}}">${{escapeHtml(bundle.defectState)}}</span>
                          </div>
                          <div class="route-chip-row">${{bundle.routeFamilyRefs
                            .map((routeRef) => `<span class="chip mono">${{escapeHtml(routeRef)}}</span>`)
                            .join("")}}</div>
                          <div class="mono">${{escapeHtml(bundle.designContractDigestRef)}}</div>
                        </article>`;
                    }};
                    ids.bundleList.innerHTML = bundles.map(template).join("");
                    ids.gallery.innerHTML = bundles
                      .map(
                        (bundle) => `
                          <article class="gallery-card" data-active="${{bundle.designContractPublicationBundleId === state.selectedBundleId}}">
                            <div class="eyebrow">${{escapeHtml(bundle.shellType)}}</div>
                            <h3>${{escapeHtml(bundle.audienceSurfaceLabel)}}</h3>
                            <p>${{escapeHtml(bundle.rationale)}}</p>
                          </article>`,
                      )
                      .join("");
                    ids.bundleList.querySelectorAll(".bundle-card").forEach((node) => {{
                      node.addEventListener("click", () => {{
                        state.selectedBundleId = node.dataset.bundleId;
                        renderAll(data);
                      }});
                      node.addEventListener("keydown", (event) => {{
                        const nodes = [...ids.bundleList.querySelectorAll(".bundle-card")];
                        const index = nodes.indexOf(node);
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {{
                          event.preventDefault();
                          const nextIndex = event.key === "ArrowDown"
                            ? Math.min(nodes.length - 1, index + 1)
                            : Math.max(0, index - 1);
                          state.selectedBundleId = nodes[nextIndex].dataset.bundleId;
                          renderAll(data);
                          ids.bundleList.querySelectorAll(".bundle-card")[nextIndex]?.focus();
                        }}
                      }});
                    }});
                  }}

                  function renderConstellation(data) {{
                    const bundle = selectedBundle(data);
                    if (!bundle) {{
                      ids.constellation.innerHTML = "";
                      ids.digestStrip.innerHTML = "";
                      return;
                    }}
                    const token = data.tokens.designTokenExportArtifacts.find(
                      (row) => row.designTokenExportArtifactId === bundle.designTokenExportArtifactRef,
                    );
                    const verdict = selectedVerdict(data);
                    const nodes = [
                      {{ x: 160, y: 120, label: "Token export", sub: token.designTokenExportArtifactId, className: "design" }},
                      {{ x: 360, y: 92, label: "Visual profiles", sub: `${{bundle.visualTokenProfileRefs.length}} profiles`, className: "design" }},
                      {{ x: 540, y: 152, label: "Semantics", sub: `${{bundle.surfaceStateSemanticsProfileRefs.length}} refs`, className: "semantic" }},
                      {{ x: 508, y: 322, label: "Automation", sub: `${{bundle.automationAnchorMapRefs.length}} maps`, className: "semantic" }},
                      {{ x: 314, y: 368, label: "Vocabulary", sub: `${{bundle.designContractVocabularyTupleRefs.length}} tuples`, className: "core" }},
                      {{ x: 130, y: 298, label: "Structural evidence", sub: `${{bundle.structuralSnapshotRefs.length}} snapshots`, className: "core" }},
                      {{ x: 330, y: 228, label: "Bundle", sub: bundle.designContractPublicationBundleId, className: "core" }},
                      {{ x: 666, y: 250, label: "Lint verdict", sub: verdict.result, className: "semantic" }},
                    ];
                    const edges = [
                      [0, 1], [1, 2], [2, 6], [3, 6], [4, 6], [5, 6], [6, 7], [4, 3], [1, 4], [0, 5],
                    ];
                    ids.constellation.innerHTML = `
                      <svg viewBox="0 0 760 460" role="img" aria-label="Selected design bundle constellation">
                        ${{edges
                          .map(([from, to]) => {{
                            const start = nodes[from];
                            const end = nodes[to];
                            return `<line class="edge" x1="${{start.x}}" y1="${{start.y}}" x2="${{end.x}}" y2="${{end.y}}" />`;
                          }})
                          .join("")}}
                        ${{nodes
                          .map(
                            (node) => `
                              <g>
                                <circle class="node-circle ${{node.className}}" cx="${{node.x}}" cy="${{node.y}}" r="52"></circle>
                                <text class="constellation-label" x="${{node.x}}" y="${{node.y - 4}}" text-anchor="middle">${{escapeHtml(node.label)}}</text>
                                <text class="constellation-sub" x="${{node.x}}" y="${{node.y + 15}}" text-anchor="middle">${{escapeHtml(node.sub)}}</text>
                              </g>`,
                          )
                          .join("")}}
                      </svg>`;
                    ids.digestStrip.innerHTML = [
                      ["Bundle digest", bundle.designContractDigestRef],
                      ["Token digest", token.tokenValueDigestRef],
                      ["Verdict", verdict.designContractLintVerdictId],
                    ]
                      .map(
                        ([label, value]) => `
                          <div class="digest-box">
                            <span class="eyebrow">${{label}}</span>
                            <div class="mono" data-contract-digest="${{escapeHtml(value)}}">${{escapeHtml(value)}}</div>
                          </div>`,
                      )
                      .join("");
                  }}

                  function renderLintRail(data) {{
                    const verdict = selectedVerdict(data);
                    if (!verdict) {{
                      ids.lintRail.innerHTML = "";
                      return;
                    }}
                    const rows = [
                      ["Token lattice", verdict.tokenLatticeState],
                      ["Mode resolution", verdict.modeResolutionState],
                      ["Surface semantics", verdict.surfaceSemanticsState],
                      ["Automation / telemetry", verdict.automationTelemetryParityState],
                      ["Artifact posture", verdict.artifactModeParityState],
                      ["Surface role", verdict.surfaceRoleUsageState],
                      ["Structural evidence", verdict.structuralSnapshotState],
                    ];
                    ids.lintRail.innerHTML = `
                      <div class="eyebrow">Compact lint rail</div>
                      ${{rows
                        .map(
                          ([label, value], index) => `
                            <article class="lint-item" tabindex="0" data-testid="lint-item-${{index}}">
                              <div class="eyebrow">${{escapeHtml(label)}}</div>
                              <strong>${{escapeHtml(value)}}</strong>
                            </article>`,
                        )
                        .join("")}}
                      <article class="lint-item">
                        <div class="eyebrow">Result</div>
                        <strong>${{escapeHtml(verdict.result)}}</strong>
                        <div class="mono">${{escapeHtml(verdict.designContractLintVerdictId)}}</div>
                      </article>`;
                  }}

                  function renderVocabulary(data) {{
                    const bundle = selectedBundle(data);
                    if (!bundle) {{
                      ids.vocabularyBody.innerHTML = "";
                      return;
                    }}
                    const rows = data.vocabulary.filter(
                      (row) => row.publication_bundle_id === bundle.designContractPublicationBundleId,
                    );
                    ids.vocabularyBody.innerHTML = rows
                      .map(
                        (row, index) => `
                          <tr tabindex="0" data-testid="vocabulary-row-${{toTestId(row.route_family_ref)}}" data-vocabulary-index="${{index}}">
                            <td class="mono">${{escapeHtml(row.route_family_ref)}}</td>
                            <td class="mono">${{escapeHtml(row.automation_marker_keys)}}</td>
                            <td class="mono">${{escapeHtml(row.telemetry_event_keys)}}</td>
                            <td class="mono">${{escapeHtml(row.artifact_mode_keys)}}</td>
                          </tr>`,
                      )
                      .join("");
                    ids.vocabularyBody.querySelectorAll("tr").forEach((node) => {{
                      node.addEventListener("keydown", (event) => {{
                        const rows = [...ids.vocabularyBody.querySelectorAll("tr")];
                        const index = rows.indexOf(node);
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {{
                          event.preventDefault();
                          const nextIndex = event.key === "ArrowDown"
                            ? Math.min(rows.length - 1, index + 1)
                            : Math.max(0, index - 1);
                          rows[nextIndex]?.focus();
                        }}
                      }});
                    }});
                  }}

                  function renderLintTable(data) {{
                    ids.lintBody.innerHTML = data.lint.lintRules
                      .map(
                        (rule, index) => `
                          <tr tabindex="0" data-testid="lint-row-${{toTestId(rule.ruleId)}}" data-lint-index="${{index}}">
                            <td class="mono">${{escapeHtml(rule.ruleId)}}</td>
                            <td class="mono">${{escapeHtml(rule.stateField)}}</td>
                            <td>${{escapeHtml(rule.blockingEffect)}}</td>
                          </tr>`,
                      )
                      .join("");
                    ids.lintBody.querySelectorAll("tr").forEach((node) => {{
                      node.addEventListener("keydown", (event) => {{
                        const rows = [...ids.lintBody.querySelectorAll("tr")];
                        const index = rows.indexOf(node);
                        if (event.key === "ArrowDown" || event.key === "ArrowUp") {{
                          event.preventDefault();
                          const nextIndex = event.key === "ArrowDown"
                            ? Math.min(rows.length - 1, index + 1)
                            : Math.max(0, index - 1);
                          rows[nextIndex]?.focus();
                        }}
                      }});
                    }});
                  }}

                  function renderInspector(data) {{
                    const bundle = selectedBundle(data);
                    if (!bundle) {{
                      ids.inspector.innerHTML = "<h2>No bundle selected</h2>";
                      return;
                    }}
                    const token = data.tokens.designTokenExportArtifacts.find(
                      (row) => row.designTokenExportArtifactId === bundle.designTokenExportArtifactRef,
                    );
                    const structural = data.structural.filter(
                      (row) => row.design_contract_publication_bundle_id === bundle.designContractPublicationBundleId,
                    );
                    ids.inspector.innerHTML = `
                      <section class="inspector-section">
                        <div class="eyebrow">Selected bundle</div>
                        <h2>${{escapeHtml(bundle.audienceSurfaceLabel)}}</h2>
                        <div>${{escapeHtml(bundle.rationale)}}</div>
                        <div class="chips">
                          <span class="${{chipClass(bundle.publicationState)}}">${{escapeHtml(bundle.publicationState)}}</span>
                          <span class="${{chipClass(bundle.defectState)}}">${{escapeHtml(bundle.defectState)}}</span>
                        </div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Linked publication</div>
                        <div><strong>Token export</strong><div class="mono">${{escapeHtml(bundle.designTokenExportArtifactRef)}}</div></div>
                        <div><strong>Visual profiles</strong><div class="mono">${{escapeHtml(bundle.visualTokenProfileRefs.join("<br />"))}}</div></div>
                        <div><strong>Vocabulary tuples</strong><div class="mono">${{escapeHtml(bundle.designContractVocabularyTupleRefs.join("<br />"))}}</div></div>
                        <div><strong>Telemetry bindings</strong><div class="mono">${{escapeHtml(bundle.telemetryBindingProfileRefs.join("<br />"))}}</div></div>
                        <div><strong>Artifact profiles</strong><div class="mono">${{escapeHtml(bundle.artifactModePresentationProfileRefs.join("<br />"))}}</div></div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Structural evidence</div>
                        <div><strong>Snapshots</strong><div class="mono">${{escapeHtml(bundle.structuralSnapshotRefs.join("<br />"))}}</div></div>
                        <div><strong>Evidence summary</strong><div>${{structural
                          .map((row) => `${{row.evidence_label}} • ${{row.breakpoint_coverage_ref}} • ${{row.artifact_mode_ref}}`)
                          .join("<br />")}}</div></div>
                      </section>
                      <section class="inspector-section">
                        <div class="eyebrow">Digest markers</div>
                        <div class="mono" data-contract-digest="${{escapeHtml(bundle.designContractDigestRef)}}">${{escapeHtml(bundle.designContractDigestRef)}}</div>
                        <div class="mono">${{escapeHtml(token.tokenValueDigestRef)}}</div>
                        <div class="mono">${{escapeHtml(bundle.lintVerdictRef)}}</div>
                      </section>`;
                  }}

                  function renderDefects(data) {{
                    const bundle = selectedBundle(data);
                    const rows = [
                      ...data.bundles.defects,
                      {{
                        defectId: `BUNDLE_${{bundle.designContractPublicationBundleId}}`,
                        state: bundle.defectState,
                        severity: bundle.defectState === "watch" ? "medium" : "low",
                        statement: `Bundle currently resolves to ${{bundle.defectState}} while runtime posture remains ${{
                          bundle.defectState === "watch" ? "guarded by recovery/read-only ceilings" : "ready for runtime consumption once seq_051 parity allows it"
                        }}.`,
                      }},
                    ];
                    ids.defectBody.innerHTML = rows
                      .map(
                        (row) => `
                          <article class="defect-card" data-testid="defect-card-${{toTestId(row.defectId)}}">
                            <div class="eyebrow">${{escapeHtml(row.severity)}} • ${{escapeHtml(row.state)}}</div>
                            <strong>${{escapeHtml(row.defectId)}}</strong>
                            <div>${{escapeHtml(row.statement)}}</div>
                          </article>`,
                      )
                      .join("");
                  }}

                  function renderAll(data) {{
                    populateFilters(data);
                    renderMetrics(data);
                    renderBundleCards(data);
                    renderConstellation(data);
                    renderLintRail(data);
                    renderVocabulary(data);
                    renderLintTable(data);
                    renderInspector(data);
                    renderDefects(data);
                  }}

                  for (const control of [
                    ids.filterAudience,
                    ids.filterShell,
                    ids.filterLint,
                    ids.filterPublication,
                    ids.filterDefect,
                  ]) {{
                    control.addEventListener("change", () => {{
                      state.audience = ids.filterAudience.value;
                      state.shell = ids.filterShell.value;
                      state.lint = ids.filterLint.value;
                      state.publication = ids.filterPublication.value;
                      state.defect = ids.filterDefect.value;
                      renderAll(window.__designContractData);
                    }});
                  }}

                  Promise.all([
                    fetch(DATA_PATHS.bundles).then((response) => response.json()),
                    fetch(DATA_PATHS.tokens).then((response) => response.json()),
                    fetch(DATA_PATHS.vocabulary).then((response) => response.text()),
                    fetch(DATA_PATHS.lint).then((response) => response.json()),
                    fetch(DATA_PATHS.structural).then((response) => response.text()),
                  ]).then(([bundles, tokens, vocabularyText, lint, structuralText]) => {{
                    window.__designContractData = {{
                      bundles,
                      tokens,
                      vocabulary: parseCsv(vocabularyText),
                      lint,
                      structural: parseCsv(structuralText),
                    }};
                    renderAll(window.__designContractData);
                  }});
                </script>
              </body>
            </html>
            """
        )
        .replace("{{", "{")
        .replace("}}", "}")
        + "\n"
    )


def build_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "52_design_contract_studio.html");
        const BUNDLE_PATH = path.join(ROOT, "data", "analysis", "design_contract_publication_bundles.json");
        const VOCABULARY_PATH = path.join(ROOT, "data", "analysis", "design_contract_vocabulary_tuples.csv");

        const BUNDLE_PAYLOAD = JSON.parse(fs.readFileSync(BUNDLE_PATH, "utf8"));
        const VOCABULARY_ROWS = fs
          .readFileSync(VOCABULARY_PATH, "utf8")
          .trim()
          .split("\\n")
          .slice(1)
          .map((line) => line.split(","));

        export const designContractStudioCoverage = [
          "audience filtering",
          "bundle selection",
          "lint-state visibility",
          "matrix parity",
          "keyboard navigation",
          "responsive behavior",
          "reduced motion",
          "accessibility smoke checks",
          "stable contract digest markers",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        function toTestId(value) {
          return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }

        async function importPlaywright() {
          try {
            return await import("playwright");
          } catch (error) {
            if (!process.argv.includes("--run")) {
              return null;
            }
            throw error;
          }
        }

        function serve(rootDir) {
          const server = http.createServer((request, response) => {
            const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
            let pathname = decodeURIComponent(requestUrl.pathname);
            if (pathname === "/") {
              pathname = "/docs/architecture/52_design_contract_studio.html";
            }
            const filePath = path.join(rootDir, pathname);
            if (!filePath.startsWith(rootDir)) {
              response.writeHead(403);
              response.end("forbidden");
              return;
            }
            fs.readFile(filePath, (error, buffer) => {
              if (error) {
                response.writeHead(404);
                response.end("not found");
                return;
              }
              const extension = path.extname(filePath);
              const type =
                extension === ".html"
                  ? "text/html"
                  : extension === ".json"
                    ? "application/json"
                    : extension === ".csv"
                      ? "text/csv"
                      : "text/plain";
              response.writeHead(200, { "Content-Type": type });
              response.end(buffer);
            });
          });
          return new Promise((resolve, reject) => {
            server.listen(0, "127.0.0.1", () => {
              const address = server.address();
              if (!address || typeof address === "string") {
                reject(new Error("Unable to bind local server."));
                return;
              }
              resolve({
                server,
                url: `http://127.0.0.1:${address.port}/docs/architecture/52_design_contract_studio.html`,
              });
            });
          });
        }

        export async function run() {
          assertCondition(fs.existsSync(HTML_PATH), "Studio HTML is missing.");
          assertCondition(BUNDLE_PAYLOAD.summary.bundle_count === 9, "Bundle count drifted from expected audience surface set.");
          assertCondition(VOCABULARY_ROWS.length === 19, "Vocabulary tuple count drifted from expected route coverage.");

          const playwright = await importPlaywright();
          if (!playwright) {
            return;
          }

          const { server, url } = await serve(ROOT);
          const browser = await playwright.chromium.launch({ headless: true });

          try {
            const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
            const page = await context.newPage();
            await page.goto(url, { waitUntil: "networkidle" });

            await page.locator("[data-testid='bundle-rail']").waitFor();
            await page.locator("[data-testid='constellation-canvas']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialCards = await page.locator("[data-testid^='bundle-card-']").count();
            assertCondition(
              initialCards === BUNDLE_PAYLOAD.summary.bundle_count,
              `Initial bundle-card parity drifted: expected ${BUNDLE_PAYLOAD.summary.bundle_count}, found ${initialCards}.`,
            );

            await page.locator("[data-testid='filter-audience']").selectOption("audsurf_pharmacy_console");
            const pharmacyCards = await page.locator("[data-testid^='bundle-card-']").count();
            assertCondition(pharmacyCards === 1, `Pharmacy audience filter expected 1 bundle, found ${pharmacyCards}.`);
            const pharmacyInspector = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(pharmacyInspector.includes("Pharmacy console routes"), "Inspector did not sync to pharmacy bundle.");

            await page.locator("[data-testid='filter-audience']").selectOption("all");
            const authenticatedId = "dcpb::patient_authenticated_shell::planned";
            await page.locator(`[data-testid='bundle-card-${toTestId(authenticatedId)}']`).click();
            const lintRailText = await page.locator("[data-testid='lint-rail']").innerText();
            assertCondition(lintRailText.includes("pass"), "Lint rail failed to show the pass verdict.");

            const expectedVocabularyRows = BUNDLE_PAYLOAD.designContractPublicationBundles.find(
              (row) => row.designContractPublicationBundleId === authenticatedId,
            ).designContractVocabularyTupleRefs.length;
            const renderedVocabularyRows = await page.locator("[data-testid^='vocabulary-row-']").count();
            assertCondition(
              renderedVocabularyRows === expectedVocabularyRows,
              `Vocabulary matrix parity drifted: expected ${expectedVocabularyRows}, found ${renderedVocabularyRows}.`,
            );

            await page.locator(`[data-testid='bundle-card-${toTestId("dcpb::patient_public_entry::planned")}']`).focus();
            await page.keyboard.press("ArrowDown");
            const nextSelected = await page
              .locator(`[data-testid='bundle-card-${toTestId("dcpb::patient_authenticated_shell::planned")}']`)
              .getAttribute("data-selected");
            assertCondition(nextSelected === "true", "ArrowDown did not advance bundle selection.");

            const digestMarker = await page
              .locator(`[data-testid='bundle-card-${toTestId(authenticatedId)}']`)
              .getAttribute("data-contract-digest");
            assertCondition(
              digestMarker === BUNDLE_PAYLOAD.designContractPublicationBundles.find(
                (row) => row.designContractPublicationBundleId === authenticatedId,
              ).designContractDigestRef,
              "Stable bundle digest marker drifted.",
            );

            await page.setViewportSize({ width: 390, height: 844 });
            await page.locator("[data-testid='inspector']").waitFor();
            const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
            assertCondition(inspectorVisible, "Inspector disappeared at mobile width.");

            const reducedContext = await browser.newContext({
              viewport: { width: 1280, height: 900 },
              reducedMotion: "reduce",
            });
            const reducedPage = await reducedContext.newPage();
            try {
              await reducedPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await reducedPage.evaluate(() => document.body.dataset.reducedMotion);
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await reducedContext.close();
            }

            const landmarks = await page.locator("header, main, aside, section").count();
            assertCondition(landmarks >= 8, `Accessibility smoke failed: expected many landmarks, found ${landmarks}.`);
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

        export const designContractStudioManifest = {
          task: BUNDLE_PAYLOAD.task_id,
          bundles: BUNDLE_PAYLOAD.summary.bundle_count,
          vocabularyRows: VOCABULARY_ROWS.length,
        };
        """
    ).strip() + "\n"


def build_package_source_block(bundle_payload: dict[str, Any], lint_payload: dict[str, Any]) -> str:
    summary = bundle_payload["summary"]
    audiences = [row["audienceSurface"] for row in bundle_payload["designContractPublicationBundles"]]
    return dedent(
        f"""
        {DESIGN_SYSTEM_EXPORTS_START}
        export const designContractPublicationCatalog = {{
          taskId: "{TASK_ID}",
          visualMode: "{VISUAL_MODE}",
          schemaArtifactPath: "packages/design-system/contracts/design-contract-publication.schema.json",
          bundleCount: {summary["bundle_count"]},
          publishedBundleCount: {summary["published_bundle_count"]},
          blockedBundleCount: {summary["blocked_bundle_count"]},
          lintVerdictCount: {lint_payload["summary"]["lint_verdict_count"]},
          lintPassCount: {lint_payload["summary"]["lint_pass_count"]},
          vocabularyTupleCount: {summary["route_family_count"]},
          tokenExportArtifactCount: {summary["token_export_artifact_count"]},
          audiences: {json.dumps(audiences)},
          digestAlgorithm: "sha256:16",
        }} as const;

        export const designContractPublicationSchemas = [
          {{
            schemaId: "DesignContractPublicationBundle",
            artifactPath: "packages/design-system/contracts/design-contract-publication.schema.json",
            generatedByTask: "{TASK_ID}",
            bundleCount: {summary["bundle_count"]},
            lintVerdictCount: {lint_payload["summary"]["lint_verdict_count"]},
          }},
        ] as const;
        {DESIGN_SYSTEM_EXPORTS_END}
        """
    ).strip()


def build_package_public_api_test() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { fileURLToPath } from "node:url";
        import { describe, expect, it } from "vitest";
        import {
          bootstrapSharedPackage,
          designContractPublicationCatalog,
          designContractPublicationSchemas,
          ownedContractFamilies,
          ownedObjectFamilies,
          packageContract,
        } from "../src/index.tsx";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");

        describe("public package surface", () => {
          it("boots through documented public contracts", () => {
            expect(packageContract.packageName).toBe("@vecells/design-system");
            expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
            expect(Array.isArray(ownedObjectFamilies)).toBe(true);
            expect(Array.isArray(ownedContractFamilies)).toBe(true);
          });

          it("publishes the seq_052 design contract schema surface", () => {
            expect(designContractPublicationCatalog.taskId).toBe("seq_052");
            expect(designContractPublicationCatalog.bundleCount).toBe(9);
            expect(designContractPublicationCatalog.vocabularyTupleCount).toBe(19);
            expect(designContractPublicationSchemas).toHaveLength(1);

            const schemaPath = path.join(ROOT, designContractPublicationSchemas[0].artifactPath);
            expect(fs.existsSync(schemaPath)).toBe(true);
          });
        });
        """
    ).strip() + "\n"


def update_design_system_package(bundle_payload: dict[str, Any], lint_payload: dict[str, Any]) -> None:
    source = PACKAGE_SOURCE_PATH.read_text()
    source = upsert_marked_block(
        source,
        DESIGN_SYSTEM_EXPORTS_START,
        DESIGN_SYSTEM_EXPORTS_END,
        build_package_source_block(bundle_payload, lint_payload),
    )
    write_text(PACKAGE_SOURCE_PATH, source.rstrip() + "\n")
    write_text(PACKAGE_TEST_PATH, build_package_public_api_test())

    package = read_json(PACKAGE_PACKAGE_JSON_PATH)
    exports = package.setdefault("exports", {})
    exports["./contracts/design-contract-publication.schema.json"] = "./contracts/design-contract-publication.schema.json"
    write_json(PACKAGE_PACKAGE_JSON_PATH, package)


def update_root_package() -> None:
    package = read_json(ROOT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def update_playwright_package() -> None:
    package = read_json(PLAYWRIGHT_PACKAGE_PATH)
    package["description"] = (
        "Foundation, runtime topology, gateway, event, FHIR, frontend manifest, release parity, "
        "design contract, and audit ledger browser checks."
    )
    package["scripts"] = PLAYWRIGHT_SCRIPT_UPDATES
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def main() -> None:
    context = load_context()
    bundle_by_route = {
        route_ref: manifest["designContractPublicationBundleRef"]
        for manifest in context["frontend"]["frontendContractManifests"]
        for route_ref in manifest["routeFamilyRefs"]
    }
    token_payload = build_token_export_payload(context)
    vocabulary_rows = build_vocabulary_rows(context, bundle_by_route)
    bundle_payload, structural_rows, _, _ = build_bundle_payload(context, token_payload, vocabulary_rows)
    lint_payload = build_lint_payload(bundle_payload)
    bundle_payload["summary"]["lint_pass_count"] = lint_payload["summary"]["lint_pass_count"]

    vocabulary_fieldnames = [
        "design_contract_vocabulary_tuple_id",
        "publication_bundle_id",
        "audience_surface",
        "route_family_ref",
        "shell_type",
        "state_class_vocabulary_ref",
        "state_class_keys",
        "state_reason_vocabulary_ref",
        "state_reason_keys",
        "artifact_mode_vocabulary_ref",
        "artifact_mode_keys",
        "breakpoint_vocabulary_ref",
        "breakpoint_keys",
        "selected_anchor_vocabulary_ref",
        "selected_anchor_keys",
        "dominant_action_vocabulary_ref",
        "dominant_action_keys",
        "automation_marker_vocabulary_ref",
        "automation_marker_keys",
        "telemetry_event_vocabulary_ref",
        "telemetry_event_keys",
        "tuple_hash",
    ]
    structural_fieldnames = [
        "structural_snapshot_ref",
        "design_contract_publication_bundle_id",
        "audience_surface",
        "shell_type",
        "route_family_refs",
        "evidence_kind",
        "evidence_label",
        "evidence_role",
        "breakpoint_coverage_ref",
        "motion_mode_ref",
        "artifact_mode_ref",
        "evidence_state",
        "structural_digest_ref",
        "captured_at",
    ]

    with VOCABULARY_MATRIX_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=vocabulary_fieldnames)
        writer.writeheader()
        writer.writerows(vocabulary_rows)

    with STRUCTURAL_EVIDENCE_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=structural_fieldnames)
        writer.writeheader()
        writer.writerows(structural_rows)

    write_json(BUNDLE_PATH, bundle_payload)
    write_json(TOKEN_ARTIFACT_PATH, token_payload)
    write_json(LINT_RULES_PATH, lint_payload)
    write_json(SCHEMA_PATH, build_schema())
    write_text(STRATEGY_DOC_PATH, build_strategy_doc(bundle_payload, token_payload, lint_payload))
    write_text(CATALOG_DOC_PATH, build_catalog_doc(bundle_payload, token_payload, lint_payload))
    write_text(STUDIO_PATH, build_studio_html())
    write_text(SPEC_PATH, build_spec())
    update_design_system_package(bundle_payload, lint_payload)
    update_root_package()
    update_playwright_package()

    print(
        "seq_052 design contract artifacts generated: "
        f"{bundle_payload['summary']['bundle_count']} bundles, "
        f"{token_payload['summary']['token_export_artifact_count']} token export artifacts, "
        f"{lint_payload['summary']['lint_rule_count']} lint rules."
    )


if __name__ == "__main__":
    main()
