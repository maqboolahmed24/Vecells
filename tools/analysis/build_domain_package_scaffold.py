#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any

from build_monorepo_scaffold import (
    build_api_contracts_source as legacy_build_api_contracts_source,
    build_authz_policy_source as legacy_build_authz_policy_source,
    build_design_system_source as legacy_build_design_system_source,
    build_domain_kernel_source as legacy_build_domain_kernel_source,
    build_event_contracts_source as legacy_build_event_contracts_source,
    build_fhir_mapping_source as legacy_build_fhir_mapping_source,
    build_observability_source as legacy_build_observability_source,
    build_release_controls_source as legacy_build_release_controls_source,
    build_test_fixtures_source as legacy_build_test_fixtures_source,
    shell_contracts_from_topology,
)
from root_script_updates import ROOT_SCRIPT_UPDATES as SHARED_ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TOOLS_DIR = ROOT / "tools" / "analysis"

ROOT_PACKAGE_PATH = ROOT / "package.json"
TOPOLOGY_PATH = DATA_DIR / "repo_topology_manifest.json"
CONTEXT_CONTRACTS_PATH = DATA_DIR / "context_boundary_contracts.json"
OBJECT_CATALOG_PATH = DATA_DIR / "object_catalog.json"
MANIFEST_PATH = DATA_DIR / "domain_package_manifest.json"
MATRIX_PATH = DATA_DIR / "shared_contract_package_matrix.csv"
DOC_PATH = DOCS_DIR / "44_domain_package_contracts.md"

TASK_ID = "seq_044"
CAPTURED_ON = "2026-04-11"
VISUAL_MODE = "Domain_Package_Contract_Map"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")
MISSION = (
    "Scaffold the Vecells bounded-context domain packages and shared contract packages with "
    "deterministic package homes, typed placeholder exports, package-level ownership "
    "statements, and validator-backed boundary checks."
)

ROOT_SCRIPT_UPDATES = {
    "bootstrap": "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards",
    "check": "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && pnpm validate:domains && pnpm validate:standards",
    "codegen": "python3 ./tools/analysis/build_monorepo_scaffold.py && python3 ./tools/analysis/build_runtime_service_scaffold.py && python3 ./tools/analysis/build_domain_package_scaffold.py && python3 ./tools/analysis/build_runtime_topology_manifest.py && python3 ./tools/analysis/build_gateway_surface_map.py && python3 ./tools/analysis/build_event_registry.py && python3 ./tools/analysis/build_fhir_representation_contracts.py && python3 ./tools/analysis/build_frontend_contract_manifests.py && python3 ./tools/analysis/build_release_freeze_and_parity.py && python3 ./tools/analysis/build_design_contract_publication.py && python3 ./tools/analysis/build_audit_and_worm_strategy.py && python3 ./tools/analysis/build_engineering_standards.py && pnpm format",
    "format": "prettier --write . --ignore-unknown",
    "format:check": "prettier --check . --ignore-unknown",
    "validate:runtime-topology": "python3 ./tools/analysis/validate_runtime_topology_manifest.py",
    "validate:gateway-surface": "python3 ./tools/analysis/validate_gateway_surface_map.py",
    "validate:events": "python3 ./tools/analysis/validate_event_registry.py",
    "validate:fhir": "python3 ./tools/analysis/validate_fhir_representation_contracts.py",
    "validate:frontend": "python3 ./tools/analysis/validate_frontend_contract_manifests.py",
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
    "validate:design-publication": "python3 ./tools/analysis/validate_design_contract_publication.py",
    "validate:audit-worm": "python3 ./tools/analysis/validate_audit_and_worm_strategy.py",
    "validate:domains": "python3 ./tools/analysis/validate_domain_packages.py",
    "validate:standards": "python3 ./tools/analysis/validate_engineering_standards.py",
    "branch:check": "node ./tools/git-hooks/validate-branch-name.mjs --current",
    "commit:check": "node ./tools/git-hooks/validate-commit-message.mjs",
}
ROOT_SCRIPT_UPDATES = SHARED_ROOT_SCRIPT_UPDATES

EXTRA_PACKAGE_DEPENDENCIES = {
    "package_domains_identity_access": {
        "@vecells/api-contracts": "workspace:*",
    },
    "package_release_controls": {
        "@vecells/observability": "workspace:*",
    }
}

DOMAIN_PACKAGE_IDS = [
    "package_domains_intake_safety",
    "package_domains_identity_access",
    "package_domains_triage_workspace",
    "package_domains_booking",
    "package_domains_hub_coordination",
    "package_domains_pharmacy",
    "package_domains_communications",
    "package_domains_support",
    "package_domains_operations",
    "package_domains_governance_admin",
    "package_domains_analytics_assurance",
    "package_domains_audit_compliance",
    "package_domains_release_control",
]

SHARED_PACKAGE_IDS = [
    "package_domain_kernel",
    "package_event_contracts",
    "package_api_contracts",
    "package_fhir_mapping",
    "package_authz_policy",
    "package_design_system",
    "package_test_fixtures",
    "package_observability",
    "package_release_controls",
]

PACKAGE_ORDER = DOMAIN_PACKAGE_IDS + SHARED_PACKAGE_IDS

ASSUMPTIONS = [
    {
        "assumption_id": "ASSUMPTION_044_TRIAGE_SPLIT",
        "statement": (
            "The object catalog does not publish a separate intake-safety bounded_context code, so "
            "triage_human_checkpoint families containing approval, decision, endpoint, or safety "
            "vocabulary are assigned to intake_safety and the remainder stay in triage_workspace."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_044_SUPPORT_OPERATIONS_SPLIT",
        "statement": (
            "The staff_support_operations inventory is split by operating vocabulary: ops, cohort, "
            "inventory, health, readiness, and drill families land in operations, while the "
            "remaining casework and resolution families land in support."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_044_GOVERNANCE_SPLIT",
        "statement": (
            "assurance_and_governance rows are split into analytics_assurance, governance_admin, "
            "and audit_compliance using audit/archive/attestation breach markers for compliance, "
            "config/governance/CAPA vocabulary for governance_admin, and the remainder for "
            "analytics_assurance."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_044_SHARED_RUNTIME_SPLIT",
        "statement": (
            "frontend_runtime, patient_experience, foundation_runtime_experience, assistive, "
            "runtime_release, unknown, and audited_flow_gap families are routed into explicit "
            "shared packages by contract vocabulary so runtime, release, authz, design, and "
            "observability truths stop floating outside package ownership."
        ),
    },
    {
        "assumption_id": "ASSUMPTION_044_TEST_FIXTURES_NON_AUTHORITATIVE",
        "statement": (
            "packages/test-fixtures owns contract-safe fixture builders only and intentionally owns "
            "zero canonical object families so the package cannot become a shadow runtime truth."
        ),
    },
]

SHARED_CONTRACT_FAMILY_DEFINITIONS = [
    {
        "package_artifact_id": "package_domain_kernel",
        "contract_family_id": "CF_044_FOUNDATION_PRIMITIVES",
        "label": "Foundation primitives and lineage aggregates",
        "description": "Canonical shared kernel for identifiers, request lineage, and cross-context primitives.",
        "versioning_posture": "Shared-kernel public API. Additive changes only until downstream packages adopt explicit versions.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#BoundedContextDescriptor",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_event_contracts",
        "contract_family_id": "CF_044_PUBLISHED_EVENT_TRUTH",
        "label": "Published event truth",
        "description": "Single home for event envelopes, signals, milestones, and canonical event namespace ownership.",
        "versioning_posture": "Published event contract family. New events are additive; existing event semantics are append-only.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#CanonicalEventContract",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_api_contracts",
        "contract_family_id": "CF_044_BROWSER_RUNTIME_SURFACES",
        "label": "Browser and runtime surface contracts",
        "description": "Public browser/runtime contracts, route intent bindings, and shared surface descriptors.",
        "versioning_posture": "Published contract surface. Breaking contract changes require coordinated release-control review.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#FrontendContractManifest",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_api_contracts",
        "contract_family_id": "CF_044_PROJECTION_AND_PRESENTATION_CONTRACTS",
        "label": "Projection and presentation contracts",
        "description": "Projection bundles and presentation artifacts consumed by shells and workers through one public API.",
        "versioning_posture": "Published projection contract family with additive-first evolution.",
        "source_refs": [
            "blueprint/platform-frontend-blueprint.md#ProjectionContractFamily",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_api_contracts",
        "contract_family_id": "CF_044_ASSISTIVE_AND_VISUALIZATION_SURFACES",
        "label": "Assistive and visualization surfaces",
        "description": "Assistive and visualization-facing runtime surfaces that must stay outside domain package internals.",
        "versioning_posture": "Published UI-adjacent contract family with release-gated widening.",
        "source_refs": [
            "blueprint/platform-frontend-blueprint.md#Live-update, cache-policy, and route-inventory families",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_fhir_mapping",
        "contract_family_id": "CF_044_FHIR_REPRESENTATION_BOUNDARY",
        "label": "FHIR representation boundary",
        "description": "Representation-only boundary for FHIR mappings and profile keys derived from canonical truth.",
        "versioning_posture": "Derived representation contract family; no canonical write truth is allowed here.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#FhirRepresentationContract",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_authz_policy",
        "contract_family_id": "CF_044_SCOPE_AND_AUTHZ_FENCES",
        "label": "Acting scope and authorization fences",
        "description": "Published scope tuples, acting-context fences, and authorization descriptors consumed outside identity write models.",
        "versioning_posture": "Policy contract family. Scope semantics are stable and widening is explicit.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#ActingScopeTuple",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_design_system",
        "contract_family_id": "CF_044_TOKENS_AND_ACCESSIBILITY_MARKERS",
        "label": "Design tokens, accessibility vocabulary, and automation markers",
        "description": "Single shared home for design inheritance, accessibility semantics, and stable shell markers.",
        "versioning_posture": "Published design contract family with controlled additive marker growth.",
        "source_refs": [
            "blueprint/design-token-foundation.md",
            "blueprint/accessibility-and-content-system-contract.md",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_test_fixtures",
        "contract_family_id": "CF_044_CONTRACT_SAFE_FIXTURE_BUILDERS",
        "label": "Contract-safe fixture builders",
        "description": "Shared non-authoritative fixture builders used by simulators, tests, and dry-run harnesses.",
        "versioning_posture": "Fixture-only family. Must stay non-authoritative and traceable to public contracts.",
        "source_refs": [
            "prompt/038.md",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_observability",
        "contract_family_id": "CF_044_TELEMETRY_AND_TRUST_VOCABULARY",
        "label": "Telemetry and trust vocabulary",
        "description": "Published trust-slice, telemetry, and provenance language for shells, services, and release controls.",
        "versioning_posture": "Shared observability vocabulary; additive signal growth only.",
        "source_refs": [
            "prompt/015.md",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_observability",
        "contract_family_id": "CF_044_CONTINUITY_AND_LINEAGE_SIGNALS",
        "label": "Continuity and lineage signals",
        "description": "Cross-surface continuity, freshness, lineage, and evidence signals published without owning domain settlement.",
        "versioning_posture": "Shared continuity contract family with explicit signal semantics.",
        "source_refs": [
            "blueprint/platform-frontend-blueprint.md#live-update, cache-policy, and route-inventory families",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_release_controls",
        "contract_family_id": "CF_044_PUBLICATION_FREEZE_AND_PARITY",
        "label": "Publication, freeze, and parity controls",
        "description": "Shared runtime publication tuples, freeze posture, parity evidence, and route coverage controls.",
        "versioning_posture": "Published release-control family. Breaking changes require explicit release-governance review.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_release_controls",
        "contract_family_id": "CF_044_DEGRADED_MODE_AND_RECOVERY_CONTROLS",
        "label": "Degraded-mode and recovery controls",
        "description": "Fallback, degraded-mode, and recovery controls that must remain visible to shells and operators.",
        "versioning_posture": "Shared degraded-mode control family with explicit widening and rollback semantics.",
        "source_refs": [
            "prompt/040.md",
            "prompt/044.md",
        ],
    },
    {
        "package_artifact_id": "package_release_controls",
        "contract_family_id": "CF_044_ASSISTIVE_RELEASE_SAFEGUARDS",
        "label": "Assistive release safeguards",
        "description": "Assistive rollout, freeze, kill-switch, and release candidate safeguards published through one shared surface.",
        "versioning_posture": "Assistive release control family with fail-closed widening.",
        "source_refs": [
            "blueprint/phase-8-the-assistive-layer.md",
            "prompt/044.md",
        ],
    },
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def package_name_for_artifact(artifact: dict[str, Any]) -> str:
    repo_path = artifact["repo_path"]
    if repo_path.startswith("packages/domains/"):
        return f"@vecells/domain-{Path(repo_path).name.replace('_', '-')}"
    return f"@vecells/{Path(repo_path).name}"


def has_token(name: str, *tokens: str) -> bool:
    lowered = name.lower()
    return any(token.lower() in lowered for token in tokens)


def source_ref_for_object(row: dict[str, Any]) -> str:
    file_ref = row.get("canonical_source_file") or "prompt/044.md"
    heading = row.get("canonical_source_heading_or_block")
    return f"{file_ref}#{heading}" if heading else file_ref


def kind_summary(rows: list[dict[str, Any]]) -> dict[str, int]:
    return dict(Counter(row["object_kind"] for row in rows))


def top_names(rows: list[dict[str, Any]], limit: int = 8) -> list[str]:
    return [row["canonical_name"] for row in rows[:limit]]


def markdown_list(items: list[str], *, fallback: str = "- none") -> str:
    if not items:
        return fallback
    return "\n".join(f"- `{item}`" for item in items)


def load_topology_artifacts() -> dict[str, dict[str, Any]]:
    topology = read_json(TOPOLOGY_PATH)
    return {artifact["artifact_id"]: artifact for artifact in topology["artifacts"]}


def build_consumer_index(contracts: list[dict[str, Any]], topology_packages: dict[str, dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    repo_to_artifact = {artifact["repo_path"]: artifact_id for artifact_id, artifact in topology_packages.items()}
    index: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for contract in contracts:
        for selector in contract["allowed_to_selectors"]:
            artifact_id = repo_to_artifact.get(selector)
            if not artifact_id:
                continue
            index[artifact_id].append(
                {
                    "contract_id": contract["contract_id"],
                    "title": contract["title"],
                    "consumer_owner_codes": contract["from_owner_codes"],
                    "consumer_selectors": contract["allowed_from_selectors"],
                }
            )
    return index


def assign_object_family(row: dict[str, Any]) -> tuple[str, str]:
    name = row["canonical_name"]
    bounded_context = row["bounded_context"]
    object_kind = row["object_kind"]

    if object_kind == "event_contract":
        return "package_event_contracts", "event_contract_kind_rule"

    if bounded_context == "foundation_identity_access":
        if has_token(name, "scope", "auth", "actingcontext", "audiencevisibility", "audiencesurface", "invocationgrant") or object_kind == "grant":
            return "package_authz_policy", "identity_policy_split_rule"
        return "package_domains_identity_access", "identity_access_direct_rule"

    if bounded_context == "triage_human_checkpoint":
        if has_token(name, "approval", "decision", "safety", "endpoint"):
            return "package_domains_intake_safety", "triage_to_intake_safety_rule"
        return "package_domains_triage_workspace", "triage_workspace_direct_rule"

    if bounded_context == "booking":
        return "package_domains_booking", "booking_direct_rule"

    if bounded_context == "hub_coordination":
        return "package_domains_hub_coordination", "hub_coordination_direct_rule"

    if bounded_context == "pharmacy":
        return "package_domains_pharmacy", "pharmacy_direct_rule"

    if bounded_context == "callback_messaging":
        return "package_domains_communications", "communications_direct_rule"

    if bounded_context == "staff_support_operations":
        if has_token(
            name,
            "ops",
            "inventory",
            "cohort",
            "health",
            "readiness",
            "drill",
            "linecheckpoint",
            "materiality",
            "interruption",
            "nexttask",
            "decisioncommit",
            "evidencedelta",
            "operational",
            "workload",
        ):
            return "package_domains_operations", "support_operations_split_rule"
        return "package_domains_support", "support_casework_split_rule"

    if bounded_context == "self_care_admin_resolution":
        return "package_domains_support", "support_resolution_direct_rule"

    if bounded_context == "platform_configuration":
        return "package_domains_governance_admin", "governance_admin_direct_rule"

    if bounded_context == "assurance_and_governance":
        if has_token(name, "audit", "archive", "attestation", "breach", "breakglass", "accesseventindex"):
            return "package_domains_audit_compliance", "assurance_audit_split_rule"
        if has_token(name, "governance", "config", "capa", "policycompatibility", "containment", "legacyreference", "chaosexperiment"):
            return "package_domains_governance_admin", "assurance_governance_split_rule"
        return "package_domains_analytics_assurance", "assurance_analytics_split_rule"

    if bounded_context == "runtime_release":
        if has_token(name, "canonicalevent", "eventcontract", "eventnamespace"):
            return "package_event_contracts", "runtime_release_event_split_rule"
        if has_token(name, "fhir"):
            return "package_fhir_mapping", "runtime_release_fhir_split_rule"
        if has_token(name, "frontendcontract", "projectioncontract", "surfacecontract"):
            return "package_api_contracts", "runtime_release_api_split_rule"
        if has_token(name, "coverage", "baseline", "profileselection", "parity"):
            return "package_release_controls", "runtime_release_release_control_split_rule"
        return "package_domains_release_control", "runtime_release_domain_rule"

    if bounded_context == "frontend_runtime":
        if has_token(name, "accessibility", "semantic", "automationanchor", "breakpoint", "assistivetext", "motion", "contentvariant"):
            return "package_design_system", "frontend_runtime_design_rule"
        if has_token(name, "telemetry", "trust", "lineage", "signal", "freshness", "continuityevidence"):
            return "package_observability", "frontend_runtime_observability_rule"
        if has_token(name, "fallback", "degraded", "parity", "freeze", "publication", "coverage", "restore", "carryforward"):
            return "package_release_controls", "frontend_runtime_release_rule"
        return "package_api_contracts", "frontend_runtime_api_rule"

    if bounded_context == "foundation_runtime_experience":
        if has_token(name, "motion", "ambientstateribbon", "freshnesschip"):
            return "package_design_system", "runtime_experience_design_rule"
        if has_token(name, "lineage", "freshness", "projectionfreshness", "liveprojection", "evidence", "continuity", "casepulse"):
            return "package_observability", "runtime_experience_observability_rule"
        return "package_api_contracts", "runtime_experience_api_rule"

    if bounded_context == "patient_experience":
        return "package_api_contracts", "patient_experience_projection_rule"

    if bounded_context == "assistive":
        if has_token(name, "invocationgrant"):
            return "package_authz_policy", "assistive_authz_split_rule"
        if has_token(name, "freeze", "killswitch", "release", "rollout", "candidate"):
            return "package_release_controls", "assistive_release_split_rule"
        if has_token(name, "confidence", "trust", "provenance", "incident", "continuityevidence", "watch"):
            return "package_observability", "assistive_observability_split_rule"
        if has_token(name, "composition", "presentationprofile"):
            return "package_design_system", "assistive_design_split_rule"
        return "package_api_contracts", "assistive_api_split_rule"

    if bounded_context == "audited_flow_gap":
        if has_token(name, "parity", "fallback", "recovery"):
            return "package_release_controls", "audited_gap_release_rule"
        if has_token(name, "evidence"):
            return "package_observability", "audited_gap_observability_rule"
        return "package_api_contracts", "audited_gap_api_rule"

    if bounded_context == "foundation_control_plane":
        return "package_domain_kernel", "foundation_control_plane_rule"

    if bounded_context == "unknown":
        if has_token(name, "eventcontract", "eventnamespace"):
            return "package_event_contracts", "unknown_event_rule"
        if has_token(name, "fhir"):
            return "package_fhir_mapping", "unknown_fhir_rule"
        if has_token(name, "scope", "grant", "auth", "consent", "token"):
            return "package_authz_policy", "unknown_authz_rule"
        if has_token(name, "telemetry", "evidence", "audit", "lineage", "truth", "probe"):
            return "package_observability", "unknown_observability_rule"
        if has_token(name, "release", "degraded", "recovery", "draft", "fallback", "freeze", "cohort"):
            return "package_release_controls", "unknown_release_rule"
        if has_token(name, "accessibility", "content", "pageintent", "entry", "vector", "variant"):
            return "package_design_system", "unknown_design_rule"
        if has_token(name, "contract", "surface", "route", "page", "error", "channel"):
            return "package_api_contracts", "unknown_api_rule"
        return "package_domain_kernel", "unknown_kernel_rule"

    return "package_domain_kernel", "fallback_kernel_rule"


def build_object_assignments(topology_packages: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    catalog = read_json(OBJECT_CATALOG_PATH)["objects"]
    assignments: list[dict[str, Any]] = []
    for row in catalog:
        package_artifact_id, ownership_basis = assign_object_family(row)
        artifact = topology_packages[package_artifact_id]
        assignments.append(
            {
                "object_id": row["object_id"],
                "canonical_name": row["canonical_name"],
                "object_kind": row["object_kind"],
                "bounded_context": row["bounded_context"],
                "authoritative_owner": row["authoritative_owner"],
                "canonical_source_ref": source_ref_for_object(row),
                "package_artifact_id": package_artifact_id,
                "package_name": package_name_for_artifact(artifact),
                "package_role": "domain" if package_artifact_id in DOMAIN_PACKAGE_IDS else "shared",
                "owner_context_code": artifact["owner_context_code"],
                "ownership_basis": ownership_basis,
            }
        )
    return sorted(assignments, key=lambda item: (item["package_artifact_id"], item["canonical_name"]))


def group_assignments_by_package(assignments: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for assignment in assignments:
        grouped[assignment["package_artifact_id"]].append(assignment)
    return grouped


def category_rows(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    aggregates = [
        row
        for row in rows
        if row["object_kind"] in {"aggregate", "case"}
        or has_token(row["canonical_name"], "session", "transaction", "case")
    ]
    services = [
        row
        for row in rows
        if has_token(
            row["canonical_name"],
            "service",
            "governor",
            "coordinator",
            "orchestrator",
            "supervisor",
            "resolver",
            "compiler",
        )
    ]
    events = [
        row
        for row in rows
        if row["object_kind"] == "event_contract"
        or has_token(row["canonical_name"], "signal", "milestone", "event")
    ]
    policies = [
        row
        for row in rows
        if row["object_kind"] == "policy"
        or has_token(
            row["canonical_name"],
            "policy",
            "guard",
            "governor",
            "fence",
            "gate",
            "scope",
            "freeze",
            "eligibility",
            "compatibility",
        )
    ]
    projections = [
        row
        for row in rows
        if row["object_kind"] == "projection" or has_token(row["canonical_name"], "projection")
    ]
    return {
        "aggregateFamilies": aggregates,
        "domainServiceFamilies": services,
        "eventFamilies": events,
        "policyFamilies": policies,
        "projectionFamilies": projections,
    }


def ts_literal(value: Any) -> str:
    return json.dumps(value, indent=2)


def render_ts_constant(name: str, value: Any, type_name: str) -> str:
    return f"export const {name} = {ts_literal(value)} as const satisfies {type_name};"


def package_contract_payload(
    artifact: dict[str, Any],
    *,
    package_name: str,
    package_role: str,
    object_rows: list[dict[str, Any]],
    contract_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "artifactId": artifact["artifact_id"],
        "packageName": package_name,
        "packageRole": package_role,
        "ownerContextCode": artifact["owner_context_code"],
        "ownerContextLabel": artifact["owner_context_label"],
        "purpose": artifact["notes"],
        "versioningPosture": (
            "Workspace-private domain boundary. Public exports are explicit and additive-first."
            if package_role == "domain"
            else "Workspace-private published contract boundary. Public exports are explicit and versionable."
        ),
        "allowedDependencies": artifact["allowed_dependencies"],
        "forbiddenDependencies": artifact["forbidden_dependencies"],
        "dependencyContractRefs": artifact["dependency_contract_refs"],
        "objectFamilyCount": len(object_rows),
        "contractFamilyCount": len(contract_rows),
        "sourceContexts": sorted({row["bounded_context"] for row in object_rows}),
    }


def build_shared_contract_rows(
    assignments_by_package: dict[str, list[dict[str, Any]]],
    consumer_index: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for definition in SHARED_CONTRACT_FAMILY_DEFINITIONS:
        package_artifact_id = definition["package_artifact_id"]
        package_rows = assignments_by_package.get(package_artifact_id, [])
        matched_rows = [row for row in package_rows if contract_family_matches(definition["contract_family_id"], row)]
        consumer_rows = consumer_index.get(package_artifact_id, [])
        rows.append(
            {
                "package_artifact_id": package_artifact_id,
                "contract_family_id": definition["contract_family_id"],
                "label": definition["label"],
                "description": definition["description"],
                "versioning_posture": definition["versioning_posture"],
                "source_refs": definition["source_refs"],
                "consumer_contract_ids": [item["contract_id"] for item in consumer_rows],
                "consumer_owner_codes": sorted({code for item in consumer_rows for code in item["consumer_owner_codes"]}),
                "consumer_selectors": sorted({selector for item in consumer_rows for selector in item["consumer_selectors"]}),
                "owned_object_family_count": len(matched_rows),
                "owned_object_families": [row["canonical_name"] for row in matched_rows],
            }
        )
    return rows


def contract_family_matches(contract_family_id: str, row: dict[str, Any]) -> bool:
    name = row["canonical_name"]
    bounded_context = row["bounded_context"]
    package_artifact_id = row["package_artifact_id"]

    if contract_family_id == "CF_044_FOUNDATION_PRIMITIVES":
        return True
    if contract_family_id == "CF_044_PUBLISHED_EVENT_TRUTH":
        return True
    if contract_family_id == "CF_044_FHIR_REPRESENTATION_BOUNDARY":
        return True
    if contract_family_id == "CF_044_SCOPE_AND_AUTHZ_FENCES":
        return True
    if contract_family_id == "CF_044_TOKENS_AND_ACCESSIBILITY_MARKERS":
        return True
    if contract_family_id == "CF_044_CONTRACT_SAFE_FIXTURE_BUILDERS":
        return False
    if contract_family_id == "CF_044_TELEMETRY_AND_TRUST_VOCABULARY":
        return has_token(name, "telemetry", "trust", "confidence", "signal", "provenance", "watch")
    if contract_family_id == "CF_044_CONTINUITY_AND_LINEAGE_SIGNALS":
        return package_artifact_id == "package_observability"
    if contract_family_id == "CF_044_BROWSER_RUNTIME_SURFACES":
        return not (
            bounded_context in {"patient_experience", "assistive", "audited_flow_gap"}
            or has_token(name, "projection", "assistive", "visualization")
        )
    if contract_family_id == "CF_044_PROJECTION_AND_PRESENTATION_CONTRACTS":
        return bounded_context == "patient_experience" or has_token(name, "projection", "presentation", "artifact")
    if contract_family_id == "CF_044_ASSISTIVE_AND_VISUALIZATION_SURFACES":
        return bounded_context in {"assistive", "audited_flow_gap"} or has_token(name, "assistive", "visualization")
    if contract_family_id == "CF_044_PUBLICATION_FREEZE_AND_PARITY":
        return not (
            bounded_context == "assistive"
            or has_token(name, "degraded", "fallback", "recovery", "restore", "carryforward")
        )
    if contract_family_id == "CF_044_DEGRADED_MODE_AND_RECOVERY_CONTROLS":
        return has_token(name, "degraded", "fallback", "recovery", "restore", "carryforward")
    if contract_family_id == "CF_044_ASSISTIVE_RELEASE_SAFEGUARDS":
        return bounded_context == "assistive" or has_token(name, "assistive")
    return False


def object_payload(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "canonicalName": row["canonical_name"],
            "objectKind": row["object_kind"],
            "boundedContext": row["bounded_context"],
            "authoritativeOwner": row["authoritative_owner"],
            "sourceRef": row["canonical_source_ref"],
        }
        for row in rows
    ]


def contract_payload(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "contractFamilyId": row["contract_family_id"],
            "label": row["label"],
            "description": row["description"],
            "versioningPosture": row["versioning_posture"],
            "consumerContractIds": row["consumer_contract_ids"],
            "consumerOwnerCodes": row["consumer_owner_codes"],
            "consumerSelectors": row["consumer_selectors"],
            "sourceRefs": row["source_refs"],
            "ownedObjectFamilyCount": row["owned_object_family_count"],
        }
        for row in rows
    ]


def build_domain_source(
    artifact: dict[str, Any],
    package_name: str,
    object_rows: list[dict[str, Any]],
    contract_rows: list[dict[str, Any]],
) -> str:
    categories = category_rows(object_rows)
    package_contract = package_contract_payload(
        artifact,
        package_name=package_name,
        package_role="domain",
        object_rows=object_rows,
        contract_rows=contract_rows,
    )
    lines = [
        "export interface OwnedObjectFamily {",
        "  canonicalName: string;",
        "  objectKind: string;",
        "  boundedContext: string;",
        "  authoritativeOwner: string;",
        "  sourceRef: string;",
        "}",
        "",
        "export interface PackageContract {",
        "  artifactId: string;",
        "  packageName: string;",
        "  packageRole: string;",
        "  ownerContextCode: string;",
        "  ownerContextLabel: string;",
        "  purpose: string;",
        "  versioningPosture: string;",
        "  allowedDependencies: readonly string[];",
        "  forbiddenDependencies: readonly string[];",
        "  dependencyContractRefs: readonly string[];",
        "  objectFamilyCount: number;",
        "  contractFamilyCount: number;",
        "  sourceContexts: readonly string[];",
        "}",
        "",
        render_ts_constant("packageContract", package_contract, "PackageContract"),
        "",
        "export const domainModule = {",
        "  artifactId: packageContract.artifactId,",
        "  packageName: packageContract.packageName,",
        "  ownerContext: packageContract.ownerContextCode,",
        f'  posture: "{artifact["topology_status"]}",',
        "  note: packageContract.purpose,",
        "} as const;",
        "",
        render_ts_constant("ownedObjectFamilies", object_payload(object_rows), "readonly OwnedObjectFamily[]"),
        "",
        render_ts_constant("aggregateFamilies", object_payload(categories["aggregateFamilies"]), "readonly OwnedObjectFamily[]"),
        "",
        render_ts_constant("domainServiceFamilies", object_payload(categories["domainServiceFamilies"]), "readonly OwnedObjectFamily[]"),
        "",
        render_ts_constant("eventFamilies", object_payload(categories["eventFamilies"]), "readonly OwnedObjectFamily[]"),
        "",
        render_ts_constant("policyFamilies", object_payload(categories["policyFamilies"]), "readonly OwnedObjectFamily[]"),
        "",
        render_ts_constant("projectionFamilies", object_payload(categories["projectionFamilies"]), "readonly OwnedObjectFamily[]"),
        "",
        "export function bootstrapDomainModule() {",
        "  return {",
        "    packageName: packageContract.packageName,",
        "    objectFamilies: ownedObjectFamilies.length,",
        "    aggregateFamilies: aggregateFamilies.length,",
        "    domainServiceFamilies: domainServiceFamilies.length,",
        "    eventFamilies: eventFamilies.length,",
        "    policyFamilies: policyFamilies.length,",
        "    projectionFamilies: projectionFamilies.length,",
        "  };",
        "}",
    ]
    if artifact["artifact_id"] == "package_domains_identity_access":
        lines.extend(
            [
                "",
                'export * from "./identity-access-backbone";',
                'export * from "./command-settlement-backbone";',
                'export * from "./release-trust-freeze-backbone";',
                'export * from "./lease-fence-command-backbone";',
                'export * from "./lifecycle-coordinator-backbone";',
                'export * from "./request-closure-backbone";',
                'export * from "./identity-repair-backbone";',
                'export * from "./duplicate-review-backbone";',
                'export * from "./reservation-confirmation-backbone";',
                'export * from "./reservation-queue-control-backbone";',
                'export * from "./reachability-backbone";',
                'export * from "./replay-collision-backbone";',
                'export * from "./submission-lineage-backbone";',
            ]
        )
    if artifact["artifact_id"] == "package_domains_intake_safety":
        lines.extend(
            [
                "",
                'export * from "./assimilation-safety-backbone";',
                'export * from "./evidence-backbone";',
            ]
        )
    return "\n".join(lines)


def shared_helper_source(artifact_id: str) -> str:
    helpers = {
        "package_domain_kernel": dedent(
            """
            export const foundationKernelFamilies = ownedObjectFamilies;
            """
        ).strip(),
        "package_event_contracts": dedent(
            """
            export const publishedEventFamilies = ownedObjectFamilies;
            """
        ).strip(),
        "package_api_contracts": dedent(
            """
            export const publishedSurfaceContractFamilies = ownedObjectFamilies;
            """
        ).strip(),
        "package_fhir_mapping": dedent(
            """
            export const fhirRepresentationFamilies = ownedObjectFamilies;

            export function makeFhirMappingKey(resourceType: string, profile: string): string {
              return `${resourceType}::${profile}`;
            }
            """
        ).strip(),
        "package_authz_policy": dedent(
            """
            export const foundationPolicyScopeCatalog = ownedObjectFamilies;
            """
        ).strip(),
        "package_design_system": dedent(
            """
            export const designContractFamilies = ownedContractFamilies;
            export const designObjectFamilies = ownedObjectFamilies;

            export function automationMarkerForShell(shellSlug: string): string {
              return `${shellSlug}::foundation-marker`;
            }
            """
        ).strip(),
        "package_test_fixtures": dedent(
            """
            export const fixtureBuilderFamilies = ownedContractFamilies;

            export const fixtureScopeCatalog = [
              "patient-web",
              "clinical-workspace",
              "hub-desk",
              "pharmacy-console",
              "support-workspace",
              "ops-console",
              "governance-console",
            ] as const;

            export function makeFixtureHandle(scope: string, name: string): string {
              return `${scope}::${name}`;
            }
            """
        ).strip(),
        "package_observability": dedent(
            """
            export * from "./correlation-spine";
            export * from "./telemetry";
            export * from "./ui-causality";

            export const observabilitySignalFamilies = ownedObjectFamilies;

            export function makeTrustSliceKey(slice: string, signal: string): string {
              return `${slice}:${signal}`;
            }
            """
        ).strip(),
        "package_release_controls": dedent(
            """
            export const releaseControlFamilies = ownedObjectFamilies;
            export const releaseControlContractFamilies = ownedContractFamilies;

            export function makePublicationTuple(ring: string, posture: string): string {
              return `${ring}:${posture}`;
            }
            """
        ).strip(),
    }
    return helpers[artifact_id]


def build_shared_source(
    artifact: dict[str, Any],
    package_name: str,
    object_rows: list[dict[str, Any]],
    contract_rows: list[dict[str, Any]],
    compatibility_source: str,
) -> str:
    categories = category_rows(object_rows)
    package_contract = package_contract_payload(
        artifact,
        package_name=package_name,
        package_role="shared",
        object_rows=object_rows,
        contract_rows=contract_rows,
    )
    lines: list[str] = []
    lines.extend(
        [
            compatibility_source,
            "",
            "export interface OwnedObjectFamily {",
            "  canonicalName: string;",
            "  objectKind: string;",
            "  boundedContext: string;",
            "  authoritativeOwner: string;",
            "  sourceRef: string;",
            "}",
            "",
            "export interface OwnedContractFamily {",
            "  contractFamilyId: string;",
            "  label: string;",
            "  description: string;",
            "  versioningPosture: string;",
            "  consumerContractIds: readonly string[];",
            "  consumerOwnerCodes: readonly string[];",
            "  consumerSelectors: readonly string[];",
            "  sourceRefs: readonly string[];",
            "  ownedObjectFamilyCount: number;",
            "}",
            "",
            "export interface PackageContract {",
            "  artifactId: string;",
            "  packageName: string;",
            "  packageRole: string;",
            "  ownerContextCode: string;",
            "  ownerContextLabel: string;",
            "  purpose: string;",
            "  versioningPosture: string;",
            "  allowedDependencies: readonly string[];",
            "  forbiddenDependencies: readonly string[];",
            "  dependencyContractRefs: readonly string[];",
            "  objectFamilyCount: number;",
            "  contractFamilyCount: number;",
            "  sourceContexts: readonly string[];",
            "}",
            "",
            render_ts_constant("packageContract", package_contract, "PackageContract"),
            "",
            render_ts_constant("ownedObjectFamilies", object_payload(object_rows), "readonly OwnedObjectFamily[]"),
            "",
            render_ts_constant("ownedContractFamilies", contract_payload(contract_rows), "readonly OwnedContractFamily[]"),
            "",
            render_ts_constant("eventFamilies", object_payload(categories["eventFamilies"]), "readonly OwnedObjectFamily[]"),
            "",
            render_ts_constant("policyFamilies", object_payload(categories["policyFamilies"]), "readonly OwnedObjectFamily[]"),
            "",
            render_ts_constant("projectionFamilies", object_payload(categories["projectionFamilies"]), "readonly OwnedObjectFamily[]"),
            "",
            shared_helper_source(artifact["artifact_id"]),
            "",
            "export function bootstrapSharedPackage() {",
            "  return {",
            "    packageName: packageContract.packageName,",
            "    objectFamilies: ownedObjectFamilies.length,",
            "    contractFamilies: ownedContractFamilies.length,",
            "    eventFamilies: eventFamilies.length,",
            "    policyFamilies: policyFamilies.length,",
            "    projectionFamilies: projectionFamilies.length,",
            "  };",
            "}",
        ]
    )
    return "\n".join(lines)


def build_domain_test(package_name: str) -> str:
    return dedent(
        f"""
        import {{ describe, expect, it }} from "vitest";
        import {{
          aggregateFamilies,
          bootstrapDomainModule,
          domainServiceFamilies,
          eventFamilies,
          ownedObjectFamilies,
          packageContract,
          policyFamilies,
          projectionFamilies,
        }} from "../src/index.ts";
        import {{ foundationKernelFamilies }} from "@vecells/domain-kernel";
        import {{ publishedEventFamilies }} from "@vecells/event-contracts";
        import {{ foundationPolicyScopeCatalog }} from "@vecells/authz-policy";
        import {{ observabilitySignalFamilies }} from "@vecells/observability";

        describe("public package surface", () => {{
          it("boots through public dependencies only", () => {{
            expect(packageContract.packageName).toBe("{package_name}");
            expect(ownedObjectFamilies.length).toBeGreaterThan(0);
            expect(bootstrapDomainModule().objectFamilies).toBe(ownedObjectFamilies.length);
            expect(Array.isArray(aggregateFamilies)).toBe(true);
            expect(Array.isArray(domainServiceFamilies)).toBe(true);
            expect(Array.isArray(eventFamilies)).toBe(true);
            expect(Array.isArray(policyFamilies)).toBe(true);
            expect(Array.isArray(projectionFamilies)).toBe(true);
            expect(Array.isArray(foundationKernelFamilies)).toBe(true);
            expect(Array.isArray(publishedEventFamilies)).toBe(true);
            expect(Array.isArray(foundationPolicyScopeCatalog)).toBe(true);
            expect(Array.isArray(observabilitySignalFamilies)).toBe(true);
          }});
        }});
        """
    ).strip()


def build_shared_test(artifact_id: str, package_name: str, entry_file: str) -> str:
    imports = {
        "package_domain_kernel": "",
        "package_event_contracts": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\n',
        "package_api_contracts": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\nimport { publishedEventFamilies } from "@vecells/event-contracts";\n',
        "package_fhir_mapping": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\nimport { publishedEventFamilies } from "@vecells/event-contracts";\n',
        "package_authz_policy": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\nimport { publishedEventFamilies } from "@vecells/event-contracts";\n',
        "package_design_system": "",
        "package_test_fixtures": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\nimport { publishedEventFamilies } from "@vecells/event-contracts";\nimport { publishedSurfaceContractFamilies } from "@vecells/api-contracts";\n',
        "package_observability": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\n',
        "package_release_controls": 'import { foundationKernelFamilies } from "@vecells/domain-kernel";\nimport { publishedEventFamilies } from "@vecells/event-contracts";\nimport { publishedSurfaceContractFamilies } from "@vecells/api-contracts";\nimport { observabilitySignalFamilies } from "@vecells/observability";\n',
    }
    assertions = {
        "package_domain_kernel": "",
        "package_event_contracts": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n",
        "package_api_contracts": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n    expect(Array.isArray(publishedEventFamilies)).toBe(true);\n",
        "package_fhir_mapping": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n    expect(Array.isArray(publishedEventFamilies)).toBe(true);\n",
        "package_authz_policy": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n    expect(Array.isArray(publishedEventFamilies)).toBe(true);\n",
        "package_design_system": "",
        "package_test_fixtures": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n    expect(Array.isArray(publishedEventFamilies)).toBe(true);\n    expect(Array.isArray(publishedSurfaceContractFamilies)).toBe(true);\n",
        "package_observability": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n",
        "package_release_controls": "    expect(Array.isArray(foundationKernelFamilies)).toBe(true);\n    expect(Array.isArray(publishedEventFamilies)).toBe(true);\n    expect(Array.isArray(publishedSurfaceContractFamilies)).toBe(true);\n    expect(Array.isArray(observabilitySignalFamilies)).toBe(true);\n",
    }
    return dedent(
        f"""
        import {{ describe, expect, it }} from "vitest";
        import {{
          bootstrapSharedPackage,
          ownedContractFamilies,
          ownedObjectFamilies,
          packageContract,
        }} from "../src/{entry_file}";
        {imports[artifact_id].rstrip()}

        describe("public package surface", () => {{
          it("boots through documented public contracts", () => {{
            expect(packageContract.packageName).toBe("{package_name}");
            expect(bootstrapSharedPackage().contractFamilies).toBe(ownedContractFamilies.length);
            expect(Array.isArray(ownedObjectFamilies)).toBe(true);
            expect(Array.isArray(ownedContractFamilies)).toBe(true);
{assertions[artifact_id].rstrip()}
          }});
        }});
        """
    ).strip()


def domain_readme(
    artifact: dict[str, Any],
    package_name: str,
    object_rows: list[dict[str, Any]],
) -> str:
    categories = category_rows(object_rows)
    kind_counts = kind_summary(object_rows)
    return "\n".join(
        [
            f"# {artifact['display_name']}",
            "",
            "## Purpose",
            "",
            artifact["notes"],
            "",
            "## Ownership",
            "",
            f"- Package: `{package_name}`",
            f"- Artifact id: `{artifact['artifact_id']}`",
            f"- Owning context: `{artifact['owner_context_label']}` (`{artifact['owner_context_code']}`)",
            f"- Source contexts covered: {', '.join(sorted({row['bounded_context'] for row in object_rows}))}",
            f"- Canonical object families: `{len(object_rows)}`",
            "- Versioning posture: `workspace-private domain boundary with explicit public exports`",
            "",
            "## Source Refs",
            "",
            markdown_list(artifact["source_refs"]),
            "",
            "## Allowed Dependencies",
            "",
            markdown_list(artifact["allowed_dependencies"]),
            "",
            "## Forbidden Dependencies",
            "",
            markdown_list(artifact["forbidden_dependencies"]),
            "",
            "## Public API",
            "",
            "- `ownedObjectFamilies`",
            f"- `aggregateFamilies` ({len(categories['aggregateFamilies'])})",
            f"- `domainServiceFamilies` ({len(categories['domainServiceFamilies'])})",
            f"- `eventFamilies` ({len(categories['eventFamilies'])})",
            f"- `policyFamilies` ({len(categories['policyFamilies'])})",
            f"- `projectionFamilies` ({len(categories['projectionFamilies'])})",
            "- `bootstrapDomainModule()`",
            "",
            "## Family Coverage",
            "",
            f"- Dominant kinds: {', '.join(f'{kind}={count}' for kind, count in sorted(kind_counts.items()))}",
            f"- Representative families: {', '.join(top_names(object_rows, 12))}",
            "",
            "## Bootstrapping Test",
            "",
            "`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.",
        ]
    )


def shared_readme(
    artifact: dict[str, Any],
    package_name: str,
    object_rows: list[dict[str, Any]],
    contract_rows: list[dict[str, Any]],
    consumer_rows: list[dict[str, Any]],
) -> str:
    kind_counts = kind_summary(object_rows)
    consumer_contracts = [row["contract_id"] for row in consumer_rows]
    consumer_selectors = sorted({selector for row in consumer_rows for selector in row["consumer_selectors"]})
    contract_labels = [row["label"] for row in contract_rows]
    return "\n".join(
        [
            f"# {artifact['display_name']}",
            "",
            "## Purpose",
            "",
            artifact["notes"],
            "",
            "## Ownership",
            "",
            f"- Package: `{package_name}`",
            f"- Artifact id: `{artifact['artifact_id']}`",
            f"- Owner lane: `{artifact['owner_context_label']}` (`{artifact['owner_context_code']}`)",
            f"- Canonical object families: `{len(object_rows)}`",
            f"- Shared contract families: `{len(contract_rows)}`",
            "- Versioning posture: `workspace-private published contract boundary with explicit public exports`",
            "",
            "## Source Refs",
            "",
            markdown_list(artifact["source_refs"]),
            "",
            "## Consumers",
            "",
            f"- Boundary contracts: {', '.join(consumer_contracts) if consumer_contracts else 'none declared'}",
            f"- Consumer selectors: {', '.join(consumer_selectors) if consumer_selectors else 'none declared'}",
            "",
            "## Allowed Dependencies",
            "",
            markdown_list(artifact["allowed_dependencies"]),
            "",
            "## Forbidden Dependencies",
            "",
            markdown_list(artifact["forbidden_dependencies"]),
            "",
            "## Public API",
            "",
            "- `ownedContractFamilies`",
            "- `ownedObjectFamilies`",
            "- `eventFamilies`",
            "- `policyFamilies`",
            "- `projectionFamilies`",
            "- `bootstrapSharedPackage()`",
            "",
            "## Contract Families",
            "",
            markdown_list(contract_labels),
            "",
            "## Family Coverage",
            "",
            f"- Dominant kinds: {', '.join(f'{kind}={count}' for kind, count in sorted(kind_counts.items())) if kind_counts else 'none; package is contract-only'}",
            f"- Representative object families: {', '.join(top_names(object_rows, 12)) if object_rows else 'none; this package remains non-authoritative'}",
            "",
            "## Bootstrapping Test",
            "",
            "`tests/public-api.test.ts` proves the package boots through documented public package names only and never reaches through sibling internals.",
        ]
    )


def build_docs(
    topology_packages: dict[str, dict[str, Any]],
    assignments_by_package: dict[str, list[dict[str, Any]]],
    contract_rows_by_package: dict[str, list[dict[str, Any]]],
    consumer_index: dict[str, list[dict[str, Any]]],
) -> str:
    domain_table = [
        "| Context | Package | Source Contexts | Object Families | Representative Families |",
        "| --- | --- | --- | ---: | --- |",
    ]
    for package_id in DOMAIN_PACKAGE_IDS:
        artifact = topology_packages[package_id]
        object_rows = assignments_by_package.get(package_id, [])
        domain_table.append(
            "| "
            + " | ".join(
                [
                    artifact["owner_context_code"],
                    package_name_for_artifact(artifact),
                    ", ".join(sorted({row["bounded_context"] for row in object_rows})),
                    str(len(object_rows)),
                    ", ".join(top_names(object_rows, 4)),
                ]
            )
            + " |"
        )

    shared_table = [
        "| Package | Contract Families | Object Families | Consumer Seams |",
        "| --- | --- | ---: | --- |",
    ]
    for package_id in SHARED_PACKAGE_IDS:
        artifact = topology_packages[package_id]
        object_rows = assignments_by_package.get(package_id, [])
        contract_rows = contract_rows_by_package.get(package_id, [])
        shared_table.append(
            "| "
            + " | ".join(
                [
                    package_name_for_artifact(artifact),
                    ", ".join(row["label"] for row in contract_rows),
                    str(len(object_rows)),
                    ", ".join(row["contract_id"] for row in consumer_index.get(package_id, [])) or "none declared",
                ]
            )
            + " |"
        )

    lines = [
        "# 44 Domain Package Contracts",
        "",
        f"- Task: `{TASK_ID}`",
        f"- Captured on: `{CAPTURED_ON}`",
        f"- Generated at: `{GENERATED_AT}`",
        f"- Visual mode: `{VISUAL_MODE}`",
        "",
        MISSION,
        "",
        "## Gap Closures",
        "",
        "- The Phase 0 domain list now has explicit package homes for all 13 bounded contexts, including intake_safety, support, operations, governance_admin, analytics_assurance, audit_compliance, and release_control.",
        "- Frontend/runtime contract families now have first-class shared homes in `packages/api-contracts`, `packages/design-system`, `packages/observability`, and `packages/release-controls`.",
        "- The object catalog is used as the completeness check, so every canonical family from `data/analysis/object_catalog.json` has one package owner.",
        "- `packages/test-fixtures` is kept intentionally non-authoritative so it cannot drift into a shadow runtime package.",
        "",
        "## Assumptions",
        "",
        *[f"- `{item['assumption_id']}`: {item['statement']}" for item in ASSUMPTIONS],
        "",
        "## Domain Packages",
        "",
        *domain_table,
        "",
        "## Shared Contract Packages",
        "",
        *shared_table,
        "",
        "## Boundary Enforcement",
        "",
        "- Domain packages export typed placeholder families only through package root entrypoints.",
        "- Shared packages expose documented contract families only; no generic shared-utils package exists.",
        "- Package tests prove bootstrapping through package public names and never through sibling private internals.",
        "- `tools/analysis/validate_domain_packages.py` fails closed on orphaned families, multiply owned families, undocumented packages, or deep-import drift.",
    ]
    return "\n".join(lines)


def build_manifest(
    topology_packages: dict[str, dict[str, Any]],
    assignments: list[dict[str, Any]],
    contract_rows: list[dict[str, Any]],
    assignments_by_package: dict[str, list[dict[str, Any]]],
    consumer_index: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    contract_rows_by_package: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in contract_rows:
        contract_rows_by_package[row["package_artifact_id"]].append(row)

    domain_packages = []
    for package_id in DOMAIN_PACKAGE_IDS:
        artifact = topology_packages[package_id]
        object_rows = assignments_by_package.get(package_id, [])
        domain_packages.append(
            {
                "artifact_id": package_id,
                "package_name": package_name_for_artifact(artifact),
                "repo_path": artifact["repo_path"],
                "owner_context_code": artifact["owner_context_code"],
                "owner_context_label": artifact["owner_context_label"],
                "object_family_count": len(object_rows),
                "object_kind_counts": kind_summary(object_rows),
                "source_contexts": sorted({row["bounded_context"] for row in object_rows}),
                "representative_families": top_names(object_rows, 12),
                "allowed_dependencies": artifact["allowed_dependencies"],
                "forbidden_dependencies": artifact["forbidden_dependencies"],
                "dependency_contract_refs": artifact["dependency_contract_refs"],
                "source_refs": artifact["source_refs"],
            }
        )

    shared_packages = []
    for package_id in SHARED_PACKAGE_IDS:
        artifact = topology_packages[package_id]
        object_rows = assignments_by_package.get(package_id, [])
        package_contract_rows = contract_rows_by_package.get(package_id, [])
        shared_packages.append(
            {
                "artifact_id": package_id,
                "package_name": package_name_for_artifact(artifact),
                "repo_path": artifact["repo_path"],
                "owner_context_code": artifact["owner_context_code"],
                "owner_context_label": artifact["owner_context_label"],
                "object_family_count": len(object_rows),
                "object_kind_counts": kind_summary(object_rows),
                "source_contexts": sorted({row["bounded_context"] for row in object_rows}),
                "representative_families": top_names(object_rows, 12),
                "contract_families": contract_payload(package_contract_rows),
                "consumer_contract_ids": [row["contract_id"] for row in consumer_index.get(package_id, [])],
                "allowed_dependencies": artifact["allowed_dependencies"],
                "forbidden_dependencies": artifact["forbidden_dependencies"],
                "dependency_contract_refs": artifact["dependency_contract_refs"],
                "source_refs": artifact["source_refs"],
            }
        )

    return {
        "task_id": TASK_ID,
        "captured_on": CAPTURED_ON,
        "generated_at": GENERATED_AT,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": [
            "prompt/044.md",
            "prompt/043.md",
            "prompt/042.md",
            "prompt/041.md",
            "prompt/shared_operating_contract_036_to_045.md",
            "data/analysis/object_catalog.json",
            "data/analysis/context_boundary_contracts.json",
            "data/analysis/repo_topology_manifest.json",
        ],
        "summary": {
            "domain_package_count": len(DOMAIN_PACKAGE_IDS),
            "shared_package_count": len(SHARED_PACKAGE_IDS),
            "package_count": len(PACKAGE_ORDER),
            "canonical_object_family_count": len(assignments),
            "contract_family_count": len(contract_rows),
            "orphaned_family_count": 0,
            "multiply_owned_family_count": 0,
            "non_authoritative_shared_packages": ["package_test_fixtures"],
        },
        "assumptions": ASSUMPTIONS,
        "domain_packages": domain_packages,
        "shared_packages": shared_packages,
        "contract_family_rows": contract_rows,
        "object_family_assignments": assignments,
    }


def sync_root_package_json() -> None:
    package_json = read_json(ROOT_PACKAGE_PATH)
    scripts = package_json.setdefault("scripts", {})
    scripts.update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package_json)


def sync_package_manifest_description(
    package_root: Path,
    *,
    artifact_id: str,
    description: str,
) -> None:
    package_json_path = package_root / "package.json"
    package_json = read_json(package_json_path)
    package_json["description"] = description
    if artifact_id in EXTRA_PACKAGE_DEPENDENCIES:
        dependencies = package_json.setdefault("dependencies", {})
        dependencies.update(EXTRA_PACKAGE_DEPENDENCIES[artifact_id])
    write_json(package_json_path, package_json)


def write_package_outputs(
    topology_packages: dict[str, dict[str, Any]],
    assignments_by_package: dict[str, list[dict[str, Any]]],
    contract_rows_by_package: dict[str, list[dict[str, Any]]],
    consumer_index: dict[str, list[dict[str, Any]]],
    legacy_shared_sources: dict[str, str],
) -> None:
    for package_id in PACKAGE_ORDER:
        artifact = topology_packages[package_id]
        object_rows = assignments_by_package.get(package_id, [])
        package_contract_rows = contract_rows_by_package.get(package_id, [])
        package_name = package_name_for_artifact(artifact)
        package_root = ROOT / artifact["repo_path"]
        entry_file = "index.tsx" if package_id == "package_design_system" else "index.ts"

        if package_id in DOMAIN_PACKAGE_IDS:
            source = build_domain_source(artifact, package_name, object_rows, package_contract_rows)
            readme = domain_readme(artifact, package_name, object_rows)
            test_source = build_domain_test(package_name)
            description = f"{artifact['display_name']} context package with {len(object_rows)} canonical object families."
        else:
            source = build_shared_source(
                artifact,
                package_name,
                object_rows,
                package_contract_rows,
                legacy_shared_sources[package_id],
            )
            readme = shared_readme(
                artifact,
                package_name,
                object_rows,
                package_contract_rows,
                consumer_index.get(package_id, []),
            )
            test_source = build_shared_test(package_id, package_name, entry_file)
            description = f"{artifact['display_name']} shared contract package with {len(package_contract_rows)} contract families."

        write_text(package_root / "src" / entry_file, source)
        write_text(package_root / "README.md", readme)
        write_text(package_root / "tests" / "public-api.test.ts", test_source)
        sync_package_manifest_description(
            package_root,
            artifact_id=package_id,
            description=description,
        )


def build_matrix_rows(
    topology_packages: dict[str, dict[str, Any]],
    contract_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    rows = []
    for row in contract_rows:
        artifact = topology_packages[row["package_artifact_id"]]
        rows.append(
            {
                "package_artifact_id": row["package_artifact_id"],
                "package_name": package_name_for_artifact(artifact),
                "contract_family_id": row["contract_family_id"],
                "contract_family_label": row["label"],
                "versioning_posture": row["versioning_posture"],
                "consumer_contract_ids": "; ".join(row["consumer_contract_ids"]),
                "consumer_owner_codes": "; ".join(row["consumer_owner_codes"]),
                "consumer_selectors": "; ".join(row["consumer_selectors"]),
                "owned_object_family_count": row["owned_object_family_count"],
                "owned_object_family_samples": "; ".join(row["owned_object_families"][:12]),
                "source_refs": "; ".join(row["source_refs"]),
            }
        )
    return rows


def build_legacy_shared_sources(app_artifacts: list[dict[str, Any]]) -> dict[str, str]:
    shell_contracts = shell_contracts_from_topology(app_artifacts)
    return {
        "package_domain_kernel": legacy_build_domain_kernel_source(),
        "package_event_contracts": legacy_build_event_contracts_source(),
        "package_api_contracts": legacy_build_api_contracts_source(shell_contracts),
        "package_fhir_mapping": legacy_build_fhir_mapping_source(),
        "package_authz_policy": legacy_build_authz_policy_source(),
        "package_design_system": legacy_build_design_system_source(),
        "package_test_fixtures": legacy_build_test_fixtures_source(shell_contracts),
        "package_observability": legacy_build_observability_source(),
        "package_release_controls": legacy_build_release_controls_source(shell_contracts),
    }


def main() -> None:
    topology_artifacts = load_topology_artifacts()
    topology_packages = {
        artifact_id: artifact
        for artifact_id, artifact in topology_artifacts.items()
        if artifact["artifact_type"] == "package"
    }
    app_artifacts = [artifact for artifact in topology_artifacts.values() if artifact["artifact_type"] == "app"]
    context_contracts = read_json(CONTEXT_CONTRACTS_PATH)["contracts"]
    consumer_index = build_consumer_index(context_contracts, topology_packages)
    assignments = build_object_assignments(topology_packages)
    assignments_by_package = group_assignments_by_package(assignments)
    contract_rows = build_shared_contract_rows(assignments_by_package, consumer_index)
    contract_rows_by_package: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in contract_rows:
        contract_rows_by_package[row["package_artifact_id"]].append(row)

    sync_root_package_json()
    write_package_outputs(
        topology_packages,
        assignments_by_package,
        contract_rows_by_package,
        consumer_index,
        build_legacy_shared_sources(app_artifacts),
    )

    manifest = build_manifest(
        topology_packages,
        assignments,
        contract_rows,
        assignments_by_package,
        consumer_index,
    )
    write_json(MANIFEST_PATH, manifest)
    write_csv(
        MATRIX_PATH,
        build_matrix_rows(topology_packages, contract_rows),
        [
            "package_artifact_id",
            "package_name",
            "contract_family_id",
            "contract_family_label",
            "versioning_posture",
            "consumer_contract_ids",
            "consumer_owner_codes",
            "consumer_selectors",
            "owned_object_family_count",
            "owned_object_family_samples",
            "source_refs",
        ],
    )
    write_text(
        DOC_PATH,
        build_docs(
            topology_packages,
            assignments_by_package,
            contract_rows_by_package,
            consumer_index,
        ),
    )
    print("seq_044 domain package scaffold generated")


if __name__ == "__main__":
    main()
