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

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
GATEWAY_SURFACES_PATH = DATA_DIR / "gateway_bff_surfaces.json"
FRONTEND_MANIFEST_PATH = DATA_DIR / "frontend_contract_manifests.json"
EVENT_CONTRACTS_PATH = DATA_DIR / "canonical_event_contracts.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
WATCHLIST_PATH = DATA_DIR / "dependency_watchlist.json"
SUPPLY_CHAIN_PATH = DATA_DIR / "supply_chain_and_provenance_matrix.json"
RELEASE_GATE_PATH = DATA_DIR / "release_gate_matrix.csv"

RELEASE_CANDIDATE_SCHEMA_PATH = DATA_DIR / "release_candidate_schema.json"
RELEASE_FREEZE_SCHEMA_PATH = DATA_DIR / "release_approval_freeze_schema.json"
PARITY_RULES_PATH = DATA_DIR / "release_publication_parity_rules.json"
FREEZE_MATRIX_PATH = DATA_DIR / "release_freeze_tuple_matrix.csv"
WATCH_EVIDENCE_PATH = DATA_DIR / "release_watch_required_evidence.csv"

FREEZE_STRATEGY_DOC_PATH = DOCS_DIR / "51_release_candidate_freeze_strategy.md"
PARITY_STRATEGY_DOC_PATH = DOCS_DIR / "51_publication_parity_strategy.md"
COCKPIT_PATH = DOCS_DIR / "51_release_parity_cockpit.html"

VALIDATOR_PATH = ROOT / "tools" / "analysis" / "validate_release_freeze_and_parity.py"
SPEC_PATH = TESTS_DIR / "release-parity-cockpit.spec.js"
ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"

TASK_ID = "seq_051"
VISUAL_MODE = "Release_Parity_Cockpit"
TIMESTAMP = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = TIMESTAMP[:10]
MISSION = (
    "Define the canonical release-candidate freeze and publication-parity strategy so promoted "
    "runtime truth stays pinned to one approval tuple, one runtime publication bundle, and one "
    "exact parity verdict before any writable or calmly trustworthy surface could remain live."
)

SOURCE_PRECEDENCE = [
    "prompt/051.md",
    "prompt/shared_operating_contract_046_to_055.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/15_release_and_supply_chain_tooling_baseline.md",
    "docs/architecture/16_release_assurance_and_resilience_architecture.md",
    "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
    "blueprint/phase-0-the-foundation-protocol.md#1.38 RuntimePublicationBundle",
    "blueprint/phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
    "blueprint/phase-0-the-foundation-protocol.md#1.39 ReleaseRecoveryDisposition",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
    "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
    "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
    "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
    "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
    "blueprint/platform-runtime-and-release-blueprint.md#CI/CD and supply-chain pipeline contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
    "blueprint/phase-cards.md#Extended Summary-Layer Alignment",
    "blueprint/forensic-audit-findings.md#Finding 91",
    "blueprint/forensic-audit-findings.md#Finding 95",
    "blueprint/forensic-audit-findings.md#Finding 103",
    "blueprint/forensic-audit-findings.md#Finding 104",
    "blueprint/forensic-audit-findings.md#Finding 118",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/gateway_bff_surfaces.json",
    "data/analysis/frontend_contract_manifests.json",
    "data/analysis/canonical_event_contracts.json",
    "data/analysis/fhir_representation_contracts.json",
    "data/analysis/dependency_watchlist.json",
    "data/analysis/supply_chain_and_provenance_matrix.json",
    "data/analysis/release_gate_matrix.csv",
]

ROOT_SCRIPT_UPDATES = {
    "bootstrap": (
        "pnpm install && node ./tools/dev-bootstrap/index.mjs && pnpm codegen && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
    ),
    "check": (
        "pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && "
        "pnpm validate:topology && pnpm validate:runtime-topology && pnpm validate:gateway-surface && "
        "pnpm validate:events && pnpm validate:fhir && pnpm validate:frontend && "
        "pnpm validate:release-parity && pnpm validate:design-publication && pnpm validate:audit-worm && pnpm validate:scaffold && pnpm validate:services && "
        "pnpm validate:domains && pnpm validate:standards"
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
    "validate:release-parity": "python3 ./tools/analysis/validate_release_freeze_and_parity.py",
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

ENVIRONMENT_ORDER = ["local", "ci-preview", "integration", "preprod", "production"]

ENVIRONMENT_PROFILES: dict[str, dict[str, Any]] = {
    "local": {
        "candidateLabel": "Local contract rehearsal",
        "parityState": "exact",
        "publicationState": "published",
        "routeExposureState": "constrained",
        "waveState": "draft",
        "watchTupleState": "proposed",
        "policyState": "armed",
        "provenanceVerificationState": "verified",
        "provenanceConsumptionState": "publishable",
        "tenantScopeMode": "platform",
        "tenantScopeRef": "scope://local/platform",
        "affectedTenantCount": 0,
        "affectedOrganisationCount": 0,
        "cohortScope": "local engineering rehearsal",
        "minimumDwellDuration": "PT15M",
        "freezeState": "active",
        "approvedBy": "ROLE_RELEASE_MANAGER",
        "bindingCeilingReasons": [
            "Design contract publication remains planned in seq_050, so exact tuple parity still resolves to non-live browser posture.",
            "Accessibility coverage remains degraded in seq_050 and therefore blocks calmly trustworthy publication.",
        ],
        "matrixStates": {
            "artifacts": "exact",
            "topology": "exact",
            "manifests": "exact",
            "design_bundles": "exact",
            "schemas": "exact",
            "migrations": "exact",
            "provenance": "exact",
            "recovery_watch": "exact",
        },
        "matrixReasons": {},
        "requiredProbeRefs": ["probe.local.contract-smoke", "probe.local.parity-refresh"],
        "rollbackTriggerRefs": ["rollback.local.tuple-drift"],
        "stabilizationCriteriaRef": "STAB_051_LOCAL_REHEARSAL",
        "rollbackReadinessState": "ready",
        "source_refs": [
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Pipeline Stage Chain",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
        ],
    },
    "ci-preview": {
        "candidateLabel": "Preview candidate",
        "parityState": "exact",
        "publicationState": "published",
        "routeExposureState": "constrained",
        "waveState": "preview_ready",
        "watchTupleState": "proposed",
        "policyState": "armed",
        "provenanceVerificationState": "verified",
        "provenanceConsumptionState": "publishable",
        "tenantScopeMode": "tenant_surface_tuple",
        "tenantScopeRef": "scope://preview/tenant-surface",
        "affectedTenantCount": 3,
        "affectedOrganisationCount": 1,
        "cohortScope": "preview tenants",
        "minimumDwellDuration": "PT30M",
        "freezeState": "active",
        "approvedBy": "ROLE_RELEASE_MANAGER",
        "bindingCeilingReasons": [
            "Exact preview parity proves tuple coherence, but design publication and complete accessibility coverage remain prerequisites for calm trust.",
        ],
        "matrixStates": {
            "artifacts": "exact",
            "topology": "exact",
            "manifests": "exact",
            "design_bundles": "exact",
            "schemas": "exact",
            "migrations": "exact",
            "provenance": "exact",
            "recovery_watch": "exact",
        },
        "matrixReasons": {},
        "requiredProbeRefs": [
            "probe.preview.browser-regression",
            "probe.preview.callback-replay",
            "probe.preview.parity-refresh",
        ],
        "rollbackTriggerRefs": ["rollback.preview.route-drift", "rollback.preview.provenance-block"],
        "stabilizationCriteriaRef": "STAB_051_PREVIEW_CONSISTENCY",
        "rollbackReadinessState": "ready",
        "source_refs": [
            "data/analysis/release_gate_matrix.csv#GATE_1_CONTRACT_AND_COMPONENT",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
        ],
    },
    "integration": {
        "candidateLabel": "Integration rehearsal",
        "parityState": "stale",
        "publicationState": "stale",
        "routeExposureState": "frozen",
        "waveState": "integration_rehearsal",
        "watchTupleState": "stale",
        "policyState": "blocked",
        "provenanceVerificationState": "verified",
        "provenanceConsumptionState": "publishable",
        "tenantScopeMode": "tenant_route_and_partner_scope",
        "tenantScopeRef": "scope://integration/tenant-route-partner",
        "affectedTenantCount": 12,
        "affectedOrganisationCount": 4,
        "cohortScope": "integration tenants and partner twins",
        "minimumDwellDuration": "PT45M",
        "freezeState": "active",
        "approvedBy": "ROLE_RELEASE_MANAGER",
        "bindingCeilingReasons": [
            "Stale route or recovery publication forces the same-shell surfaces back to read_only or recovery_only even when compiled code still exists.",
        ],
        "matrixStates": {
            "artifacts": "exact",
            "topology": "exact",
            "manifests": "exact",
            "design_bundles": "exact",
            "schemas": "stale",
            "migrations": "exact",
            "provenance": "exact",
            "recovery_watch": "stale",
        },
        "matrixReasons": {
            "schemas": ["DRIFT_051_ROUTE_CONTRACT_DIGEST_SET_STALE"],
            "recovery_watch": [
                "DRIFT_051_RECOVERY_DISPOSITION_SET_STALE",
                "DRIFT_051_WATCH_DEPENDENCIES_NOT_REFRESHED",
            ],
        },
        "requiredProbeRefs": [
            "probe.integration.browser-e2e",
            "probe.integration.callback-replay",
            "probe.integration.projection-freshness",
        ],
        "rollbackTriggerRefs": ["rollback.integration.route-drift", "rollback.integration.watch-drift"],
        "stabilizationCriteriaRef": "STAB_051_INTEGRATION_REPLAY_SAFE",
        "rollbackReadinessState": "constrained",
        "source_refs": [
            "data/analysis/release_gate_matrix.csv#GATE_2_INTEGRATION_AND_E2E",
            "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
        ],
    },
    "preprod": {
        "candidateLabel": "Pre-production approval freeze",
        "parityState": "conflict",
        "publicationState": "conflict",
        "routeExposureState": "frozen",
        "waveState": "preprod_frozen",
        "watchTupleState": "stale",
        "policyState": "blocked",
        "provenanceVerificationState": "quarantined",
        "provenanceConsumptionState": "blocked",
        "tenantScopeMode": "tenant_surface_tuple",
        "tenantScopeRef": "scope://preprod/canary-prep",
        "affectedTenantCount": 48,
        "affectedOrganisationCount": 11,
        "cohortScope": "pre-production canary rehearsal",
        "minimumDwellDuration": "PT1H",
        "freezeState": "active",
        "approvedBy": "ROLE_RELEASE_MANAGER",
        "bindingCeilingReasons": [
            "Provenance quarantine and topology conflict collapse every writable route to blocked or governed recovery posture before canary.",
        ],
        "matrixStates": {
            "artifacts": "exact",
            "topology": "conflict",
            "manifests": "exact",
            "design_bundles": "exact",
            "schemas": "exact",
            "migrations": "exact",
            "provenance": "conflict",
            "recovery_watch": "conflict",
        },
        "matrixReasons": {
            "topology": ["DRIFT_051_TOPOLOGY_TUPLE_CONFLICT"],
            "provenance": ["BLOCKER_051_PROVENANCE_QUARANTINED"],
            "recovery_watch": ["DRIFT_051_GOVERNANCE_WATCH_PARITY_CONFLICT"],
        },
        "requiredProbeRefs": [
            "probe.preprod.security-suite",
            "probe.preprod.readiness-snapshot",
            "probe.preprod.parity-refresh",
        ],
        "rollbackTriggerRefs": ["rollback.preprod.provenance-quarantine", "rollback.preprod.topology-conflict"],
        "stabilizationCriteriaRef": "STAB_051_PREPROD_SECURITY_AND_RESILIENCE",
        "rollbackReadinessState": "blocked",
        "source_refs": [
            "data/analysis/release_gate_matrix.csv#GATE_3_PERFORMANCE_AND_SECURITY",
            "docs/architecture/16_release_assurance_and_resilience_architecture.md#Release, Assurance, and Resilience Architecture",
        ],
    },
    "production": {
        "candidateLabel": "Production wave control",
        "parityState": "withdrawn",
        "publicationState": "withdrawn",
        "routeExposureState": "withdrawn",
        "waveState": "rollback_review",
        "watchTupleState": "superseded",
        "policyState": "superseded",
        "provenanceVerificationState": "verified",
        "provenanceConsumptionState": "withdrawn",
        "tenantScopeMode": "multi_tenant",
        "tenantScopeRef": "scope://production/wave-1",
        "affectedTenantCount": 320,
        "affectedOrganisationCount": 87,
        "cohortScope": "wave 1 live tenants",
        "minimumDwellDuration": "PT2H",
        "freezeState": "active",
        "approvedBy": "ROLE_RELEASE_MANAGER",
        "bindingCeilingReasons": [
            "Withdrawn publication or superseded watch tuples mean route-local cache and deploy health cannot reopen writable posture.",
        ],
        "matrixStates": {
            "artifacts": "exact",
            "topology": "exact",
            "manifests": "withdrawn",
            "design_bundles": "exact",
            "schemas": "exact",
            "migrations": "exact",
            "provenance": "withdrawn",
            "recovery_watch": "withdrawn",
        },
        "matrixReasons": {
            "manifests": ["BLOCKER_051_RUNTIME_PUBLICATION_WITHDRAWN"],
            "provenance": ["BLOCKER_051_RUNTIME_PUBLICATION_WITHDRAWN"],
            "recovery_watch": ["DRIFT_051_WATCH_TUPLE_SUPERSEDED"],
        },
        "requiredProbeRefs": [
            "probe.production.synthetic-canary",
            "probe.production.rollback-readiness",
            "probe.production.parity-refresh",
        ],
        "rollbackTriggerRefs": ["rollback.production.publication-withdrawn", "rollback.production.watch-superseded"],
        "stabilizationCriteriaRef": "STAB_051_PRODUCTION_CANARY_CLEAR",
        "rollbackReadinessState": "blocked",
        "source_refs": [
            "data/analysis/release_gate_matrix.csv#GATE_5_LIVE_WAVE_PROOF",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
        ],
    },
}

MATRIX_GROUPS = [
    {
        "matrixGroup": "artifacts",
        "label": "Artifacts",
        "summary": "Artifact digests, SBOM linkage, and approved bundle freeze must stay candidate-bound.",
        "effect": "Unsigned or drifted artifacts block promotion and rollback reuse immediately.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
        ],
    },
    {
        "matrixGroup": "topology",
        "label": "Topology",
        "summary": "Runtime topology manifest and topology tuple hash must still match the approved release.",
        "effect": "Topology drift freezes writable posture and blocks widen or resume.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
        ],
    },
    {
        "matrixGroup": "manifests",
        "label": "Manifests",
        "summary": "Frontend manifests, runtime bindings, and surface publications must publish together.",
        "effect": "Any stale or withdrawn manifest collapses browser authority to recovery or blocked posture.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "matrixGroup": "design_bundles",
        "label": "Design bundles",
        "summary": "Design contract publication bundle and lint refs remain inside the promoted tuple.",
        "effect": "Design publication drift blocks calm trust even if runtime parity still matches.",
        "source_refs": [
            "blueprint/phase-cards.md#Extended Summary-Layer Alignment",
            "blueprint/forensic-audit-findings.md#Finding 118",
        ],
    },
    {
        "matrixGroup": "schemas",
        "label": "Schemas",
        "summary": "Route digests, projection compatibility, settlement schemas, transition envelopes, event schemas, and FHIR contracts share one schema-set freeze.",
        "effect": "Schema drift invalidates parity and forces a fresh freeze before promotion.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
            "blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract",
        ],
    },
    {
        "matrixGroup": "migrations",
        "label": "Migrations",
        "summary": "Schema migration and projection backfill posture must promote and roll back as one unit.",
        "effect": "Backfill or read-path compatibility drift blocks widening and candidate reuse.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
            "blueprint/phase-cards.md#Extended Summary-Layer Alignment",
        ],
    },
    {
        "matrixGroup": "provenance",
        "label": "Provenance",
        "summary": "Build provenance and runtime consumption state are part of publication truth, not sidecar audit data.",
        "effect": "Quarantined, revoked, or withdrawn provenance freezes mutating posture before deploy calmness can lie.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
        ],
    },
    {
        "matrixGroup": "recovery_watch",
        "label": "Recovery and watch",
        "summary": "Recovery dispositions, watch tuples, and observation policy must stay aligned with parity.",
        "effect": "Watch drift or missing recovery posture blocks widening and governed handoff.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
            "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
        ],
    },
]

WATCH_EVIDENCE_KINDS = [
    {
        "evidenceKind": "release_approval_freeze",
        "label": "Approval freeze",
        "requiredState": "active",
        "blockingEffect": "Promotion, resume, and writable posture stop if the approved freeze expires or drifts.",
        "source_refs": ["blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze"],
    },
    {
        "evidenceKind": "runtime_publication_bundle",
        "label": "Runtime publication bundle",
        "requiredState": "published",
        "blockingEffect": "No runtime publication means no live authority, regardless of deployment dashboards.",
        "source_refs": ["blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle"],
    },
    {
        "evidenceKind": "publication_parity_record",
        "label": "Publication parity verdict",
        "requiredState": "exact",
        "blockingEffect": "Wave widening and calm trust block unless parity remains exact.",
        "source_refs": ["blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord"],
    },
    {
        "evidenceKind": "wave_guardrail_snapshot",
        "label": "Wave guardrail snapshot",
        "requiredState": "current",
        "blockingEffect": "Scope and guardrail drift supersede the tuple and force a fresh wave publication.",
        "source_refs": ["blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple"],
    },
    {
        "evidenceKind": "wave_observation_policy",
        "label": "Observation policy",
        "requiredState": "armed",
        "blockingEffect": "Operators cannot shorten, extend, or replace dwell obligations from memory or chat.",
        "source_refs": ["blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy"],
    },
    {
        "evidenceKind": "rollback_readiness_pack",
        "label": "Rollback readiness",
        "requiredState": "ready",
        "blockingEffect": "Resume, widen, and recovery activation halt on constrained or blocked rollback readiness.",
        "source_refs": [
            "docs/architecture/16_release_assurance_and_resilience_architecture.md#Release, Assurance, and Resilience Architecture"
        ],
    },
]

REASON_LIBRARY = {
    "DRIFT_051_ROUTE_CONTRACT_DIGEST_SET_STALE": {
        "title": "Route contract digest set drifted",
        "summary": "The published route-contract digest set no longer matches the matrix frozen at approval.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
            "blueprint/forensic-audit-findings.md#Finding 91",
        ],
    },
    "DRIFT_051_RECOVERY_DISPOSITION_SET_STALE": {
        "title": "Recovery disposition set drifted",
        "summary": "Route recovery posture no longer matches the approved release tuple, so watch and browser truth cannot stay green.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseRecoveryDisposition",
            "blueprint/forensic-audit-findings.md#Finding 104",
        ],
    },
    "DRIFT_051_WATCH_DEPENDENCIES_NOT_REFRESHED": {
        "title": "Watch evidence was not refreshed",
        "summary": "Observation policy or continuity evidence still points at an older parity generation.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
            "blueprint/phase-cards.md#Extended Summary-Layer Alignment",
        ],
    },
    "DRIFT_051_TOPOLOGY_TUPLE_CONFLICT": {
        "title": "Topology tuple conflicts with approval",
        "summary": "The runtime publication bundle resolved a different topology tuple hash than the one approved in the freeze.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
        ],
    },
    "BLOCKER_051_PROVENANCE_QUARANTINED": {
        "title": "Build provenance is quarantined",
        "summary": "Quarantined provenance blocks runtime consumption even if the bundle still exists.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
        ],
    },
    "DRIFT_051_GOVERNANCE_WATCH_PARITY_CONFLICT": {
        "title": "Governance watch parity conflicts",
        "summary": "Governance and operations are no longer reading the same parity and recovery tuple.",
        "source_refs": [
            "blueprint/forensic-audit-findings.md#Finding 95",
            "blueprint/forensic-audit-findings.md#Finding 104",
        ],
    },
    "BLOCKER_051_RUNTIME_PUBLICATION_WITHDRAWN": {
        "title": "Runtime publication was withdrawn",
        "summary": "A withdrawn runtime publication bundle cannot remain the source of truth for browser or wave posture.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
        ],
    },
    "DRIFT_051_WATCH_TUPLE_SUPERSEDED": {
        "title": "Watch tuple was superseded",
        "summary": "The current wave depends on a newer watch tuple, so prior rollout evidence is no longer authoritative.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
            "blueprint/phase-cards.md#Extended Summary-Layer Alignment",
        ],
    },
}

ASSUMPTIONS = [
    {
        "assumptionId": "ASSUMPTION_051_ONE_RELEASE_CANDIDATE_PER_ENVIRONMENT_RING",
        "state": "watch",
        "statement": "Seq_051 publishes one canonical candidate per environment ring until later wave-cohort tasks mint tenant-specific release manifests.",
        "source_refs": ["prompt/051.md", "data/analysis/runtime_topology_manifest.json"],
    },
    {
        "assumptionId": "ASSUMPTION_051_EXACT_PARITY_DOES_NOT_BYPASS_SEQ_050_BROWSER_CEILINGS",
        "state": "current",
        "statement": "Exact publication parity proves tuple coherence only. Seq_050 design-publication and accessibility ceilings still prevent publishable_live browser posture.",
        "source_refs": [
            "prompt/051.md",
            "data/analysis/frontend_contract_manifests.json",
            "blueprint/platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding",
        ],
    },
    {
        "assumptionId": "ASSUMPTION_051_CHANNEL_MANIFESTS_REUSE_SEQ_046_PLACEHOLDER_REFS",
        "state": "current",
        "statement": "Environment-scoped channel manifest refs from seq_046 remain the authoritative bridge-floor anchors until dedicated channel release tasks publish richer channel manifests.",
        "source_refs": ["data/analysis/runtime_topology_manifest.json", "prompt/051.md"],
    },
]

DEFECTS = [
    {
        "defectId": "RESOLVED_FINDING_091_RELEASE_AND_TRUST_CONTROLS_NOW_SHARE_ONE_TUPLE",
        "state": "resolved",
        "severity": "high",
        "title": "Release, settlement, and trust controls no longer float as phase-local conventions",
        "summary": "Seq_051 binds release candidate, approval freeze, runtime publication, parity, and watch posture into one machine-readable tuple lineage.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 91"],
    },
    {
        "defectId": "RESOLVED_FINDING_095_GOVERNANCE_WATCH_SURFACES_NOW_BIND_PARITY",
        "state": "resolved",
        "severity": "high",
        "title": "Governance watch surfaces now bind parity and recovery posture",
        "summary": "Watch tuples and observation policies now consume the exact parity verdict and recovery set instead of dashboard commentary.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 95"],
    },
    {
        "defectId": "RESOLVED_FINDING_103_FREEZE_TUPLE_NOW_BINDS_REVIEW_AND_WATCHLIST",
        "state": "resolved",
        "severity": "high",
        "title": "Freeze tuple now binds reviewed baseline and standards watchlist",
        "summary": "Governance review package hash, standards watchlist hash, and compilation tuple all ride inside one approval freeze.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 103"],
    },
    {
        "defectId": "RESOLVED_FINDING_104_WATCH_TUPLES_NOW_REQUIRE_RECOVERY_POSTURE",
        "state": "resolved",
        "severity": "high",
        "title": "Watch tuples now require recovery and continuity posture",
        "summary": "Wave control is no longer allowed to widen on parity-only or dashboard-only evidence.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 104"],
    },
    {
        "defectId": "RESOLVED_FINDING_118_DESIGN_PUBLICATION_REMAINS_INSIDE_RELEASE_TUPLE",
        "state": "resolved",
        "severity": "high",
        "title": "Design publication cannot drift outside the release tuple",
        "summary": "Design bundle refs and lint verdict refs are now part of the freeze and runtime publication comparisons.",
        "source_refs": ["blueprint/forensic-audit-findings.md#Finding 118"],
    },
    {
        "defectId": "WATCH_051_SEQ050_DESIGN_AND_A11Y_CEILINGS_STILL_BLOCK_CALM_TRUST",
        "state": "watch",
        "severity": "medium",
        "title": "Seq_050 browser ceilings still constrain live posture",
        "summary": "Exact parity is now machine-readable, but design publication and accessibility completeness still need later closure before calm live browser posture is legal.",
        "source_refs": ["data/analysis/frontend_contract_manifests.json", "prompt/051.md"],
    },
]

PARITY_RULES = [
    {
        "ruleId": "RULE_051_RELEASE_CANDIDATE_IS_ONE_APPROVAL_UNIT",
        "summary": "Artifacts, policies, schemas, bridge capabilities, migration posture, immutable baseline, review package, and standards watchlist promote and roll back as one tuple.",
        "blockingEffect": "If any member drifts, approval freeze expires and the candidate cannot advance.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
            "prompt/051.md",
        ],
    },
    {
        "ruleId": "RULE_051_RUNTIME_PUBLICATION_AND_PARITY_PUBLISH_TOGETHER",
        "summary": "Runtime publication, surface publications, runtime bindings, provenance, and parity are published together as one runtime truth bundle.",
        "blockingEffect": "Hidden CI-only state, ad hoc dashboard joins, or route-local cache cannot replace published parity.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
            "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
        ],
    },
    {
        "ruleId": "RULE_051_EXACT_PARITY_IS_MANDATORY_FOR_WRITABLE_OR_CALM_TRUST",
        "summary": "ReleasePublicationParityRecord(parityState = exact) is mandatory before writable or calmly trustworthy posture may remain live.",
        "blockingEffect": "Stale, conflict, withdrawn, or missing parity suppresses mutation before any local cache or deploy-green signal can reopen it.",
        "source_refs": [
            "blueprint/phase-0-the-foundation-protocol.md#1.38A AudienceSurfaceRuntimeBinding",
            "prompt/051.md",
        ],
    },
    {
        "ruleId": "RULE_051_WAVE_CONTROL_READS_WATCH_TUPLES_NOT_DASHBOARDS",
        "summary": "Watch, widen, pause, rollback, and recovery decisions must read ReleaseWatchTuple and WaveObservationPolicy rather than operator memory or dashboard interpretation.",
        "blockingEffect": "Stale or superseded watch tuples block widening, calm watch posture, and governed handoff.",
        "source_refs": [
            "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
            "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
        ],
    },
]


def fail(message: str) -> None:
    raise SystemExit(message)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text())


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open() as handle:
        return list(csv.DictReader(handle))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n")


def slug(value: str) -> str:
    cleaned = []
    for char in value.lower():
        cleaned.append(char if char.isalnum() else "_")
    output = "".join(cleaned)
    while "__" in output:
        output = output.replace("__", "_")
    return output.strip("_")


def ref(prefix: str, token: str) -> str:
    return f"{prefix}_{slug(token).upper()}_V1"


def short_hash(value: Any) -> str:
    serialized = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def unique(items: list[str]) -> list[str]:
    return list(OrderedDict.fromkeys(items))


def now_iso() -> str:
    return TIMESTAMP


def relative(path: Path) -> str:
    return str(path.relative_to(ROOT))


def load_context() -> dict[str, Any]:
    required = [
        RUNTIME_TOPOLOGY_PATH,
        GATEWAY_SURFACES_PATH,
        FRONTEND_MANIFEST_PATH,
        EVENT_CONTRACTS_PATH,
        FHIR_CONTRACTS_PATH,
        WATCHLIST_PATH,
        SUPPLY_CHAIN_PATH,
        RELEASE_GATE_PATH,
    ]
    missing = [str(path) for path in required if not path.exists()]
    assert_true(not missing, "Missing seq_051 prerequisites:\n" + "\n".join(missing))

    runtime = read_json(RUNTIME_TOPOLOGY_PATH)
    gateway = read_json(GATEWAY_SURFACES_PATH)
    frontend = read_json(FRONTEND_MANIFEST_PATH)
    event_contracts = read_json(EVENT_CONTRACTS_PATH)
    fhir_contracts = read_json(FHIR_CONTRACTS_PATH)
    watchlist = read_json(WATCHLIST_PATH)
    supply_chain = read_json(SUPPLY_CHAIN_PATH)
    release_gates = read_csv(RELEASE_GATE_PATH)

    assert_true(runtime["task_id"] == "seq_046", "PREREQUISITE_GAP_SEQ046: runtime topology payload drifted")
    assert_true(gateway["task_id"] == "seq_047", "PREREQUISITE_GAP_SEQ047: gateway surface payload drifted")
    assert_true(frontend["task_id"] == "seq_050", "PREREQUISITE_GAP_SEQ050: frontend manifest payload drifted")
    assert_true(event_contracts["task_id"] == "seq_048", "PREREQUISITE_GAP_SEQ048: event registry payload drifted")
    assert_true(fhir_contracts["task_id"] == "seq_049", "PREREQUISITE_GAP_SEQ049: fhir contract payload drifted")

    environment_map = {row["environment_ring"]: row for row in runtime["environment_manifests"]}
    assert_true(
        all(ring in environment_map for ring in ENVIRONMENT_ORDER),
        "PREREQUISITE_GAP_ENVIRONMENT_RINGS: runtime topology lost one of the required environment rings",
    )
    gateway_map = {row["surfaceId"]: row for row in gateway["gateway_surfaces"]}

    return {
        "runtime": runtime,
        "gateway": gateway,
        "frontend": frontend,
        "events": event_contracts,
        "fhir": fhir_contracts,
        "watchlist": watchlist,
        "supply_chain": supply_chain,
        "release_gates": release_gates,
        "environment_map": environment_map,
        "gateway_map": gateway_map,
    }


def build_release_candidate_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/release-candidate.schema.json",
        "title": "ReleaseCandidate",
        "type": "object",
        "required": [
            "releaseId",
            "releaseLabel",
            "environmentRing",
            "gitRef",
            "artifactDigests",
            "bundleHashRefs",
            "bundleFreezeDigestRef",
            "behaviorContractSetRef",
            "surfaceSchemaSetRef",
            "releaseContractVerificationMatrixRef",
            "releaseContractMatrixHash",
            "environmentCompatibilityRef",
            "schemaMigrationPlanRef",
            "projectionBackfillPlanRef",
            "compatibilityEvidenceRef",
            "runtimeTopologyManifestRef",
            "topologyTupleHash",
            "releaseApprovalFreezeRef",
            "channelManifestSetRef",
            "minimumBridgeCapabilitySetRef",
            "requiredAssuranceSliceRefs",
            "watchTupleHash",
            "publicationParityRef",
            "activeReleaseWatchTupleRefs",
            "recoveryDispositionSetRef",
            "continuityEvidenceContractRefs",
            "runtimePublicationBundleRef",
            "promotionIntentRefs",
            "sbomRef",
            "provenanceRef",
            "approvalRefs",
            "waveState",
        ],
        "properties": {
            "releaseId": {"type": "string"},
            "releaseLabel": {"type": "string"},
            "environmentRing": {"type": "string", "enum": ENVIRONMENT_ORDER},
            "gitRef": {"type": "string"},
            "artifactDigests": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["artifactId", "artifactPath", "artifactKind", "sha256Ref"],
                    "properties": {
                        "artifactId": {"type": "string"},
                        "artifactPath": {"type": "string"},
                        "artifactKind": {"type": "string"},
                        "sha256Ref": {"type": "string"},
                    },
                },
            },
            "bundleHashRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "bundleFreezeDigestRef": {"type": "string"},
            "behaviorContractSetRef": {"type": "string"},
            "surfaceSchemaSetRef": {"type": "string"},
            "releaseContractVerificationMatrixRef": {"type": "string"},
            "releaseContractMatrixHash": {"type": "string"},
            "environmentCompatibilityRef": {"type": "string"},
            "schemaMigrationPlanRef": {"type": "string"},
            "projectionBackfillPlanRef": {"type": "string"},
            "compatibilityEvidenceRef": {"type": "string"},
            "runtimeTopologyManifestRef": {"type": "string"},
            "topologyTupleHash": {"type": "string"},
            "releaseApprovalFreezeRef": {"type": "string"},
            "channelManifestSetRef": {"type": "string"},
            "minimumBridgeCapabilitySetRef": {"type": "string"},
            "requiredAssuranceSliceRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "watchTupleHash": {"type": "string"},
            "publicationParityRef": {"type": "string"},
            "activeReleaseWatchTupleRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "recoveryDispositionSetRef": {"type": "string"},
            "continuityEvidenceContractRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "runtimePublicationBundleRef": {"type": "string"},
            "promotionIntentRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "sbomRef": {"type": "string"},
            "provenanceRef": {"type": "string"},
            "emergencyExceptionRef": {"type": ["string", "null"]},
            "approvalRefs": {"type": "array", "minItems": 1, "items": {"type": "string"}},
            "waveState": {"type": "string"},
        },
        "additionalProperties": True,
    }


def build_release_approval_freeze_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://vecells.local/schemas/release-approval-freeze.schema.json",
        "title": "ReleaseApprovalFreeze",
        "type": "object",
        "required": [
            "releaseApprovalFreezeId",
            "releaseCandidateRef",
            "governanceReviewPackageRef",
            "standardsDependencyWatchlistRef",
            "compiledPolicyBundleRef",
            "baselineTupleHash",
            "scopeTupleHash",
            "compilationTupleHash",
            "approvalTupleHash",
            "reviewPackageHash",
            "standardsWatchlistHash",
            "artifactDigestSetHash",
            "surfaceSchemaSetHash",
            "bridgeCapabilitySetHash",
            "migrationPlanHash",
            "compatibilityEvidenceRef",
            "approvedBy",
            "approvedAt",
            "freezeState",
        ],
        "properties": {
            "releaseApprovalFreezeId": {"type": "string"},
            "releaseCandidateRef": {"type": "string"},
            "governanceReviewPackageRef": {"type": "string"},
            "standardsDependencyWatchlistRef": {"type": "string"},
            "compiledPolicyBundleRef": {"type": "string"},
            "baselineTupleHash": {"type": "string"},
            "scopeTupleHash": {"type": "string"},
            "compilationTupleHash": {"type": "string"},
            "approvalTupleHash": {"type": "string"},
            "reviewPackageHash": {"type": "string"},
            "standardsWatchlistHash": {"type": "string"},
            "artifactDigestSetHash": {"type": "string"},
            "surfaceSchemaSetHash": {"type": "string"},
            "bridgeCapabilitySetHash": {"type": "string"},
            "migrationPlanHash": {"type": "string"},
            "compatibilityEvidenceRef": {"type": "string"},
            "approvedBy": {"type": "string"},
            "approvedAt": {"type": "string"},
            "freezeState": {"type": "string", "enum": ["active", "superseded", "expired"]},
        },
        "additionalProperties": True,
    }


def build_shared_sets(context: dict[str, Any]) -> dict[str, Any]:
    frontend = context["frontend"]
    events = context["events"]
    fhir = context["fhir"]

    manifests = frontend["frontendContractManifests"]
    route_contracts = frontend["surfaceRouteContracts"]
    publications = frontend["surfacePublications"]
    bindings = frontend["audienceSurfaceRuntimeBindings"]
    version_sets = frontend["projectionContractVersionSets"]
    query_contracts = frontend["projectionQueryContracts"]
    mutation_contracts = frontend["mutationCommandContracts"]
    live_contracts = frontend["liveUpdateChannelContracts"]
    cache_policies = frontend["clientCachePolicies"]

    cache_digest_refs = [
        f"cache-digest::{row['clientCachePolicyId']}::{short_hash([row['clientCachePolicyId'], row['freshnessModel'], row['storageMode']])}"
        for row in cache_policies
    ]
    event_schema_refs = [row["schemaVersionRef"] for row in events["contracts"]]
    fhir_contract_refs = [row["contractVersionRef"] for row in fhir["contracts"]]
    surface_schema_refs = unique(
        sorted({row["commandSettlementSchemaRef"] for row in mutation_contracts})
        + sorted({row["transitionEnvelopeSchemaRef"] for row in mutation_contracts})
        + sorted(event_schema_refs)
        + sorted(fhir_contract_refs)
    )

    continuity_contract_refs = sorted({row["continuityContractRef"] for row in route_contracts})
    continuity_digest_refs = [f"continuity-digest::{short_hash(ref_name)}" for ref_name in continuity_contract_refs]

    route_digests = sorted({row["routeContractDigestRef"] for row in version_sets})
    projection_compatibility_digests = sorted({row["projectionCompatibilityDigestRef"] for row in version_sets})
    projection_family_refs = sorted(
        {
            family_ref
            for row in version_sets
            for family_ref in row["projectionContractFamilyRefs"]
        }
    )
    projection_version_set_refs = [row["projectionContractVersionSetId"] for row in version_sets]
    projection_version_refs = sorted({row["projectionContractVersionRef"] for row in query_contracts})
    query_digests = sorted({row["contractDigestRef"] for row in query_contracts})
    mutation_digests = sorted({row["contractDigestRef"] for row in mutation_contracts})
    live_digests = sorted({row["contractDigestRef"] for row in live_contracts})
    route_family_refs = unique(
        sorted({route_ref for manifest in manifests for route_ref in manifest["routeFamilyRefs"]})
    )

    shared = {
        "frontendManifestRefs": [row["frontendContractManifestId"] for row in manifests],
        "frontendContractDigestRefs": [row["frontendContractDigestRef"] for row in manifests],
        "designContractPublicationBundleRefs": sorted(
            {row["designContractPublicationBundleRef"] for row in manifests}
        ),
        "designContractDigestRefs": sorted({row["designContractDigestRef"] for row in manifests}),
        "designContractLintVerdictRefs": sorted(
            {row["designContractLintVerdictRef"] for row in publications}
        ),
        "surfacePublicationRefs": [row["audienceSurfacePublicationRef"] for row in publications],
        "surfaceRuntimeBindingRefs": [row["audienceSurfaceRuntimeBindingId"] for row in bindings],
        "routeContractDigestRefs": route_digests,
        "projectionContractFamilyRefs": projection_family_refs,
        "projectionContractVersionRefs": projection_version_refs,
        "projectionContractVersionSetRefs": projection_version_set_refs,
        "projectionCompatibilityDigestRefs": projection_compatibility_digests,
        "projectionQueryContractDigestRefs": query_digests,
        "mutationCommandContractDigestRefs": mutation_digests,
        "liveUpdateChannelDigestRefs": live_digests,
        "clientCachePolicyDigestRefs": cache_digest_refs,
        "commandSettlementSchemaRefs": sorted({row["commandSettlementSchemaRef"] for row in mutation_contracts}),
        "transitionEnvelopeSchemaRefs": sorted({row["transitionEnvelopeSchemaRef"] for row in mutation_contracts}),
        "releaseRecoveryDispositionRefs": unique(
            sorted({ref_name for row in manifests for ref_name in row["releaseRecoveryDispositionRefs"]})
        ),
        "routeFreezeDispositionRefs": unique(
            sorted({ref_name for row in manifests for ref_name in row["routeFreezeDispositionRefs"]})
        ),
        "continuityEvidenceContractRefs": continuity_contract_refs,
        "continuityEvidenceDigestRefs": continuity_digest_refs,
        "routeFamilyRefs": route_family_refs,
        "audienceSurfaceRefs": sorted({row["audienceSurface"] for row in manifests}),
        "eventSchemaVersionRefs": event_schema_refs,
        "fhirContractVersionRefs": fhir_contract_refs,
        "surfaceSchemaRefs": surface_schema_refs,
        "browserVisibleRouteFamilyCount": frontend["summary"]["browser_visible_route_family_count"],
        "frontendManifestSetHash": short_hash(
            [[row["frontendContractManifestId"], row["frontendContractDigestRef"]] for row in manifests]
        ),
        "designBundleSetHash": short_hash(
            [
                [row["frontendContractManifestId"], row["designContractPublicationBundleRef"], row["designContractDigestRef"]]
                for row in manifests
            ]
        ),
        "routeContractSetHash": short_hash(route_digests),
        "surfaceSchemaSetHash": short_hash(surface_schema_refs),
        "eventSchemaSetHash": short_hash(event_schema_refs),
        "fhirContractSetHash": short_hash(fhir_contract_refs),
        "behaviorContractSetHash": short_hash(
            {
                "routeFamilyRefs": route_family_refs,
                "eventNames": events["requiredMinimumEventNames"],
                "fhirRepresentationContracts": [row["fhirRepresentationContractId"] for row in fhir["contracts"]],
            }
        ),
    }
    return shared


def build_channel_manifest_set(
    ring: str,
    environment_row: dict[str, Any],
    gateway_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    gateway_surface_refs = unique(environment_row["gateway_surface_refs"])
    channel_entries = []
    for surface_ref in gateway_surface_refs:
        gateway = gateway_map[surface_ref]
        channel_entries.append(
            {
                "surfaceRef": surface_ref,
                "channelProfile": gateway["channelProfile"],
                "sessionPolicyRef": gateway["sessionPolicyRef"],
                "asyncChannelRef": gateway["asyncChannelRef"],
                "tenantScopeMode": gateway["tenantScopeMode"],
                "requiredAssuranceSliceRefs": gateway["requiredAssuranceSliceRefs"],
            }
        )
    return {
        "channelManifestSetId": ref("CMS", ring),
        "environmentRing": ring,
        "gatewaySurfaceRefs": gateway_surface_refs,
        "channelEntries": channel_entries,
        "channelManifestSetHash": short_hash(channel_entries),
        "source_refs": [
            relative(RUNTIME_TOPOLOGY_PATH),
            relative(GATEWAY_SURFACES_PATH),
            "prompt/051.md",
        ],
    }


def build_bridge_capability_set(ring: str, channel_manifest_set: dict[str, Any]) -> dict[str, Any]:
    profiles = {row["channelProfile"] for row in channel_manifest_set["channelEntries"]}
    capabilities = ["cap.browser_tls", "cap.same_shell_recovery", "cap.scoped_release_freeze_check"]
    if "constrained_browser" in profiles:
        capabilities.append("cap.constrained_capture_proxy")
    if "embedded" in profiles:
        capabilities.append("cap.embedded_session_bridge")
    if ring in {"local", "ci-preview", "integration"}:
        capabilities.append("cap.nonprod_simulator_bridge")
    return {
        "minimumBridgeCapabilitySetId": ref("MBCS", ring),
        "environmentRing": ring,
        "capabilityRefs": sorted(capabilities),
        "bridgeCapabilitySetHash": short_hash(sorted(capabilities)),
        "source_refs": [
            "prompt/051.md",
            "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
            relative(GATEWAY_SURFACES_PATH),
        ],
    }


def build_artifact_digests(
    ring: str,
    environment_row: dict[str, Any],
    runtime: dict[str, Any],
    shared: dict[str, Any],
) -> list[dict[str, str]]:
    allowed_service_identity_refs = set(environment_row["service_identity_refs"])
    digests = []
    for binding in runtime["service_runtime_bindings"]:
        if binding["service_identity_ref"] not in allowed_service_identity_refs:
            continue
        digests.append(
            {
                "artifactId": binding["artifact_id"],
                "artifactPath": binding["repo_path"],
                "artifactKind": "service",
                "sha256Ref": short_hash(
                    {
                        "ring": ring,
                        "artifactId": binding["artifact_id"],
                        "routeIds": binding["route_ids"],
                        "topicPublishRefs": binding["topic_publish_refs"],
                    }
                ),
            }
        )
    digests.append(
        {
            "artifactId": f"artifact_browser_shell_bundle_{slug(ring)}",
            "artifactPath": "apps",
            "artifactKind": "shell_bundle",
            "sha256Ref": short_hash(
                {
                    "ring": ring,
                    "frontendManifestSetHash": shared["frontendManifestSetHash"],
                    "routeFamilyRefs": shared["routeFamilyRefs"],
                }
            ),
        }
    )
    digests.append(
        {
            "artifactId": f"artifact_compiled_policy_bundle_{slug(ring)}",
            "artifactPath": "packages/release-controls",
            "artifactKind": "policy_bundle",
            "sha256Ref": short_hash(
                {
                    "ring": ring,
                    "surfaceSchemaSetHash": shared["surfaceSchemaSetHash"],
                    "behaviorContractSetHash": shared["behaviorContractSetHash"],
                }
            ),
        }
    )
    return digests


def stateful_hash(base_hash: str, state: str, token: str) -> str:
    if state == "exact":
        return base_hash
    if state == "withdrawn":
        return "withdrawn"
    return short_hash({"base": base_hash, "state": state, "token": token})


def matrix_rule(group_code: str) -> dict[str, Any]:
    return next(row for row in MATRIX_GROUPS if row["matrixGroup"] == group_code)


def build_release_payload(context: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, str]], list[dict[str, str]]]:
    runtime = context["runtime"]
    watchlist = context["watchlist"]
    supply_chain = context["supply_chain"]
    release_gates = context["release_gates"]
    environment_map = context["environment_map"]
    gateway_map = context["gateway_map"]
    shared = build_shared_sets(context)

    release_candidates: list[dict[str, Any]] = []
    governance_review_packages: list[dict[str, Any]] = []
    channel_manifest_sets: list[dict[str, Any]] = []
    bridge_capability_sets: list[dict[str, Any]] = []
    environment_compatibility_records: list[dict[str, Any]] = []
    schema_migration_plans: list[dict[str, Any]] = []
    projection_backfill_plans: list[dict[str, Any]] = []
    release_contract_verification_matrices: list[dict[str, Any]] = []
    build_provenance_records: list[dict[str, Any]] = []
    release_approval_freezes: list[dict[str, Any]] = []
    runtime_publication_bundles: list[dict[str, Any]] = []
    release_publication_parity_records: list[dict[str, Any]] = []
    release_watch_tuples: list[dict[str, Any]] = []
    wave_observation_policies: list[dict[str, Any]] = []
    surface_binding_outcomes: list[dict[str, Any]] = []

    matrix_rows: list[dict[str, str]] = []
    watch_evidence_rows: list[dict[str, str]] = []

    for ring in ENVIRONMENT_ORDER:
        environment_row = environment_map[ring]
        profile = ENVIRONMENT_PROFILES[ring]

        release_id = ref("RC", ring)
        governance_review_package_id = ref("GRP", ring)
        release_approval_freeze_id = ref("RAF", ring)
        release_contract_matrix_id = ref("RCVM", ring)
        environment_compatibility_id = ref("ECE", ring)
        schema_migration_plan_id = ref("SMP", ring)
        projection_backfill_plan_id = ref("PBP", ring)
        runtime_publication_bundle_id = ref("RPB", ring)
        publication_parity_id = ref("RPP", ring)
        release_watch_tuple_id = ref("RWT", ring)
        wave_observation_policy_id = ref("WOP", ring)
        promotion_intent_id = ref("PIE", ring)
        approval_evidence_bundle_id = ref("AEB", ring)
        wave_ref = ref("WAVE", ring)
        wave_eligibility_snapshot_ref = ref("WES", ring)
        wave_guardrail_snapshot_ref = ref("WGS", ring)
        wave_control_fence_ref = ref("WCF", ring)
        compiled_policy_bundle_ref = ref("CPB", ring)

        channel_manifest_set = build_channel_manifest_set(ring, environment_row, gateway_map)
        bridge_capability_set = build_bridge_capability_set(ring, channel_manifest_set)
        artifact_digests = build_artifact_digests(ring, environment_row, runtime, shared)
        artifact_digest_set_hash = short_hash(artifact_digests)

        behavior_contract_set_ref = ref("BCS", "platform")
        surface_schema_set_ref = ref("SSS", "platform")
        bundle_hash_refs = [
            f"bundle::topology::{environment_row['topology_tuple_hash']}",
            f"bundle::frontend::{shared['frontendManifestSetHash']}",
            f"bundle::design::{shared['designBundleSetHash']}",
            f"bundle::schemas::{shared['surfaceSchemaSetHash']}",
            f"bundle::events::{shared['eventSchemaSetHash']}",
            f"bundle::fhir::{shared['fhirContractSetHash']}",
        ]
        bundle_freeze_digest_ref = short_hash(bundle_hash_refs)

        environment_compatibility = {
            "environmentCompatibilityId": environment_compatibility_id,
            "releaseRef": release_id,
            "environmentRing": ring,
            "defaultWriteRegionRef": environment_row["default_write_region_ref"],
            "allowedRegionRoles": unique(environment_row["allowed_region_roles"]),
            "requiredWorkloadFamilyRefs": unique(environment_row["runtime_workload_family_refs"]),
            "requiredGatewaySurfaceRefs": unique(environment_row["gateway_surface_refs"]),
            "requiredServiceIdentityRefs": unique(environment_row["service_identity_refs"]),
            "requiredQueueRefs": unique(environment_row["queue_refs"]),
            "requiredDataStoreRefs": unique(environment_row["data_store_refs"]),
            "compatibilityState": "exact" if profile["parityState"] == "exact" else "constrained",
            "compatibilityDigestRef": short_hash(
                {
                    "ring": ring,
                    "defaultWriteRegionRef": environment_row["default_write_region_ref"],
                    "requiredGatewaySurfaceRefs": unique(environment_row["gateway_surface_refs"]),
                    "requiredServiceIdentityRefs": unique(environment_row["service_identity_refs"]),
                }
            ),
            "source_refs": [relative(RUNTIME_TOPOLOGY_PATH), "prompt/051.md"],
        }
        environment_compatibility_records.append(environment_compatibility)

        schema_migration_plan = {
            "schemaMigrationPlanId": schema_migration_plan_id,
            "releaseRef": release_id,
            "storeScope": "relational_fhir_and_projection_read_store",
            "changeType": "additive",
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "sourceSchemaVersionRefs": [
                "db.schema.current.v1",
                shared["eventSchemaVersionRefs"][0],
                shared["fhirContractVersionRefs"][0],
            ],
            "targetSchemaVersionRefs": [
                "db.schema.next.v1",
                shared["eventSchemaVersionRefs"][-1],
                shared["fhirContractVersionRefs"][-1],
            ],
            "compatibilityWindow": "expand_then_backfill_then_contract",
            "executionOrder": ["expand", "publish", "backfill", "verify", "contract"],
            "affectedAudienceSurfaceRefs": shared["audienceSurfaceRefs"],
            "affectedRouteFamilyRefs": shared["routeFamilyRefs"],
            "routeContractDigestRefs": shared["routeContractDigestRefs"],
            "sourceProjectionContractVersionSetRefs": shared["projectionContractVersionSetRefs"],
            "targetProjectionContractVersionSetRefs": shared["projectionContractVersionSetRefs"],
            "sourceProjectionCompatibilityDigestRefs": shared["projectionCompatibilityDigestRefs"],
            "targetProjectionCompatibilityDigestRefs": shared["projectionCompatibilityDigestRefs"],
            "readPathCompatibilityWindowRef": ref("RPW", ring),
            "runtimePublicationBundleRef": runtime_publication_bundle_id,
            "releasePublicationParityRef": publication_parity_id,
            "preCutoverPublicationBundleRef": ref("RPB_PRE", ring),
            "targetPublicationBundleRef": runtime_publication_bundle_id,
            "rollbackPublicationBundleRef": ref("RPB_ROLLBACK", ring),
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#SchemaMigrationPlan",
                "prompt/051.md",
            ],
        }
        schema_migration_plans.append(schema_migration_plan)
        migration_plan_hash = short_hash(schema_migration_plan)

        projection_backfill_plan = {
            "projectionBackfillPlanId": projection_backfill_plan_id,
            "releaseRef": release_id,
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "projectionContractVersionSetRefs": shared["projectionContractVersionSetRefs"],
            "readPathCompatibilityWindowRef": ref("RPW", ring),
            "backfillWindowRef": ref("BWF", ring),
            "requiredEvidenceRefs": [
                "projection.freshness.report",
                "projection.backfill.execution.receipt",
                "projection.recovery.smoke",
            ],
            "backfillState": "planned" if profile["parityState"] == "exact" else "blocked_pending_parity",
            "planHash": short_hash(
                {
                    "ring": ring,
                    "projectionVersionSetRefs": shared["projectionContractVersionSetRefs"],
                    "requiredEvidenceRefs": [
                        "projection.freshness.report",
                        "projection.backfill.execution.receipt",
                        "projection.recovery.smoke",
                    ],
                }
            ),
            "source_refs": [
                "prompt/051.md",
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseCandidate",
            ],
        }
        projection_backfill_plans.append(projection_backfill_plan)

        release_contract_verification_matrix = {
            "releaseContractVerificationMatrixId": release_contract_matrix_id,
            "releaseRef": release_id,
            "routeContractDigestRefs": shared["routeContractDigestRefs"],
            "frontendContractDigestRefs": shared["frontendContractDigestRefs"],
            "projectionCompatibilityDigestRefs": shared["projectionCompatibilityDigestRefs"],
            "projectionQueryContractDigestRefs": shared["projectionQueryContractDigestRefs"],
            "mutationCommandContractDigestRefs": shared["mutationCommandContractDigestRefs"],
            "liveUpdateChannelDigestRefs": shared["liveUpdateChannelDigestRefs"],
            "clientCachePolicyDigestRefs": shared["clientCachePolicyDigestRefs"],
            "commandSettlementSchemaSetRef": ref("CSS", "platform"),
            "transitionEnvelopeSchemaSetRef": ref("TESS", "platform"),
            "recoveryDispositionSetRef": ref("RDS", ring),
            "continuityEvidenceContractRefs": shared["continuityEvidenceContractRefs"],
            "matrixState": "exact" if profile["parityState"] == "exact" else "constrained",
            "matrixHash": short_hash(
                {
                    "routeContractDigestRefs": shared["routeContractDigestRefs"],
                    "frontendContractDigestRefs": shared["frontendContractDigestRefs"],
                    "projectionCompatibilityDigestRefs": shared["projectionCompatibilityDigestRefs"],
                    "clientCachePolicyDigestRefs": shared["clientCachePolicyDigestRefs"],
                    "continuityEvidenceContractRefs": shared["continuityEvidenceContractRefs"],
                }
            ),
            "source_refs": [
                "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Required Object Bindings",
                "prompt/051.md",
            ],
        }
        release_contract_verification_matrices.append(release_contract_verification_matrix)

        baseline_tuple_hash = short_hash(
            {
                "chosenReleaseBaselineId": supply_chain["chosen_release_baseline_id"],
                "runtimeManifestRef": relative(RUNTIME_TOPOLOGY_PATH),
                "topologyTupleHash": environment_row["topology_tuple_hash"],
            }
        )
        scope_tuple_hash = short_hash(
            {
                "ring": ring,
                "tenantScopeMode": profile["tenantScopeMode"],
                "tenantScopeRef": profile["tenantScopeRef"],
                "gatewaySurfaceRefs": unique(environment_row["gateway_surface_refs"]),
            }
        )
        compilation_tuple_hash = short_hash(
            {
                "compiledPolicyBundleRef": compiled_policy_bundle_ref,
                "surfaceSchemaSetHash": shared["surfaceSchemaSetHash"],
                "releaseContractMatrixHash": release_contract_verification_matrix["matrixHash"],
                "channelManifestSetHash": channel_manifest_set["channelManifestSetHash"],
            }
        )

        governance_review_package = {
            "governanceReviewPackageId": governance_review_package_id,
            "scopeTokenRef": ref("SCOPE", ring),
            "actingScopeTupleRef": ref("AST", ring),
            "scopeTupleHash": scope_tuple_hash,
            "changeEnvelopeRef": ref("CE", ring),
            "baselineSnapshotRef": ref("BSN", ring),
            "baselineTupleHash": baseline_tuple_hash,
            "configWorkspaceContextRef": ref("CWC", ring),
            "configCompilationRecordRef": ref("CCR", ring),
            "configSimulationEnvelopeRef": ref("CSE", ring),
            "standardsDependencyWatchlistRef": watchlist["watchlist_id"],
            "communicationsGovernanceWorkspaceRef": ref("CGW", ring),
            "communicationsSimulationEnvelopeRef": ref("COMMSE", ring),
            "releaseContractVerificationMatrixRef": release_contract_matrix_id,
            "releaseContractMatrixHash": release_contract_verification_matrix["matrixHash"],
            "runtimeTopologyManifestRef": relative(RUNTIME_TOPOLOGY_PATH),
            "topologyTupleHash": environment_row["topology_tuple_hash"],
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#1.24A GovernanceReviewPackage",
                "prompt/051.md",
            ],
        }
        governance_review_packages.append(governance_review_package)
        review_package_hash = short_hash(governance_review_package)
        standards_watchlist_hash = short_hash(watchlist["dependencies"])

        approval_tuple_hash = short_hash(
            {
                "baselineTupleHash": baseline_tuple_hash,
                "scopeTupleHash": scope_tuple_hash,
                "compilationTupleHash": compilation_tuple_hash,
                "reviewPackageHash": review_package_hash,
                "standardsWatchlistHash": standards_watchlist_hash,
                "artifactDigestSetHash": artifact_digest_set_hash,
                "surfaceSchemaSetHash": shared["surfaceSchemaSetHash"],
                "bridgeCapabilitySetHash": bridge_capability_set["bridgeCapabilitySetHash"],
                "migrationPlanHash": migration_plan_hash,
            }
        )

        release_approval_freeze = {
            "releaseApprovalFreezeId": release_approval_freeze_id,
            "releaseCandidateRef": release_id,
            "governanceReviewPackageRef": governance_review_package_id,
            "standardsDependencyWatchlistRef": watchlist["watchlist_id"],
            "compiledPolicyBundleRef": compiled_policy_bundle_ref,
            "baselineTupleHash": baseline_tuple_hash,
            "scopeTupleHash": scope_tuple_hash,
            "compilationTupleHash": compilation_tuple_hash,
            "approvalTupleHash": approval_tuple_hash,
            "reviewPackageHash": review_package_hash,
            "standardsWatchlistHash": standards_watchlist_hash,
            "artifactDigestSetHash": artifact_digest_set_hash,
            "surfaceSchemaSetHash": shared["surfaceSchemaSetHash"],
            "bridgeCapabilitySetHash": bridge_capability_set["bridgeCapabilitySetHash"],
            "migrationPlanHash": migration_plan_hash,
            "compatibilityEvidenceRef": environment_compatibility_id,
            "approvedBy": profile["approvedBy"],
            "approvedAt": now_iso(),
            "freezeState": profile["freezeState"],
            "runtimeTopologyManifestRef": relative(RUNTIME_TOPOLOGY_PATH),
            "releaseContractVerificationMatrixRef": release_contract_matrix_id,
            "channelManifestSetRef": channel_manifest_set["channelManifestSetId"],
            "minimumBridgeCapabilitySetRef": bridge_capability_set["minimumBridgeCapabilitySetId"],
            "schemaMigrationPlanRef": schema_migration_plan_id,
            "projectionBackfillPlanRef": projection_backfill_plan_id,
            "sbomRef": ref("SBOM", ring),
            "provenanceRef": ref("BPR", ring),
            "source_refs": [
                "blueprint/phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze",
                "prompt/051.md",
            ],
        }
        release_approval_freezes.append(release_approval_freeze)

        channel_manifest_sets.append(channel_manifest_set)
        bridge_capability_sets.append(bridge_capability_set)

        bundle_hash_map = {
            "artifacts": artifact_digest_set_hash,
            "topology": environment_row["topology_tuple_hash"],
            "manifests": shared["frontendManifestSetHash"],
            "design_bundles": shared["designBundleSetHash"],
            "schemas": shared["surfaceSchemaSetHash"],
            "migrations": migration_plan_hash,
            "provenance": short_hash([ref("SBOM", ring), ref("BPR", ring), artifact_digest_set_hash]),
            "recovery_watch": short_hash(
                {
                    "recoveryDispositionRefs": shared["releaseRecoveryDispositionRefs"],
                    "continuityEvidenceDigestRefs": shared["continuityEvidenceDigestRefs"],
                    "approvalTupleHash": approval_tuple_hash,
                }
            ),
        }

        parity_reason_ids: list[str] = []
        release_matrix_rows: list[dict[str, Any]] = []
        for group in MATRIX_GROUPS:
            state = profile["matrixStates"][group["matrixGroup"]]
            reason_ids = profile["matrixReasons"].get(group["matrixGroup"], [])
            parity_reason_ids.extend(reason_ids)
            approved_hash = bundle_hash_map[group["matrixGroup"]]
            release_matrix_rows.append(
                {
                    "releaseId": release_id,
                    "environmentRing": ring,
                    "matrixGroup": group["matrixGroup"],
                    "label": group["label"],
                    "approvedMemberRef": f"approved::{group['matrixGroup']}::{slug(ring)}",
                    "approvedHash": approved_hash,
                    "publishedMemberRef": f"published::{group['matrixGroup']}::{slug(ring)}",
                    "publishedHash": stateful_hash(approved_hash, state, f"{ring}:{group['matrixGroup']}"),
                    "comparisonState": state,
                    "summary": group["summary"],
                    "failClosedEffect": group["effect"],
                    "reasonIds": reason_ids,
                    "source_refs": group["source_refs"],
                }
            )
        parity_reason_ids = unique(parity_reason_ids)

        build_provenance_record = {
            "buildProvenanceRecordId": ref("BPR", ring),
            "releaseRef": release_id,
            "artifactDigestSetHash": artifact_digest_set_hash,
            "sbomRef": ref("SBOM", ring),
            "signatureBundleRef": ref("SIG", ring),
            "verificationDigestRef": short_hash(
                {
                    "artifactDigestSetHash": artifact_digest_set_hash,
                    "sbomRef": ref("SBOM", ring),
                    "ring": ring,
                }
            ),
            "provenanceVerificationState": profile["provenanceVerificationState"],
            "runtimeConsumptionState": profile["provenanceConsumptionState"],
            "verifiedAt": now_iso(),
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#BuildProvenanceRecord",
                "docs/architecture/15_release_and_supply_chain_tooling_baseline.md#Supply Chain Law",
            ],
        }
        build_provenance_records.append(build_provenance_record)

        watch_tuple_hash = short_hash(
            {
                "baselineTupleHash": baseline_tuple_hash,
                "approvalTupleHash": approval_tuple_hash,
                "releaseApprovalFreezeRef": release_approval_freeze_id,
                "runtimePublicationBundleRef": runtime_publication_bundle_id,
                "releasePublicationParityRef": publication_parity_id,
                "waveEligibilitySnapshotRef": wave_eligibility_snapshot_ref,
                "waveGuardrailSnapshotRef": wave_guardrail_snapshot_ref,
                "waveObservationPolicyRef": wave_observation_policy_id,
                "waveControlFenceRef": wave_control_fence_ref,
                "tenantScopeRef": profile["tenantScopeRef"],
                "requiredAssuranceSliceRefs": environment_row["required_assurance_slice_refs"],
                "continuityEvidenceDigestRefs": shared["continuityEvidenceDigestRefs"],
                "releaseTrustFreezeVerdictRefs": [ref("RTFV", f"{ring}_live"), ref("RTFV", f"{ring}_rollback")],
            }
        )

        runtime_publication_bundle = {
            "runtimePublicationBundleId": runtime_publication_bundle_id,
            "releaseRef": release_id,
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "watchTupleHash": watch_tuple_hash,
            "runtimeTopologyManifestRef": relative(RUNTIME_TOPOLOGY_PATH),
            "workloadFamilyRefs": unique(environment_row["runtime_workload_family_refs"]),
            "trustZoneBoundaryRefs": unique(environment_row["trust_zone_boundary_refs"]),
            "gatewaySurfaceRefs": unique(environment_row["gateway_surface_refs"]),
            "routeContractDigestRefs": [row["publishedHash"] for row in release_matrix_rows if row["matrixGroup"] == "schemas"],
            "frontendContractManifestRefs": shared["frontendManifestRefs"],
            "frontendContractDigestRefs": shared["frontendContractDigestRefs"],
            "designContractPublicationBundleRefs": shared["designContractPublicationBundleRefs"],
            "designContractDigestRefs": shared["designContractDigestRefs"],
            "designContractLintVerdictRefs": shared["designContractLintVerdictRefs"],
            "projectionContractFamilyRefs": shared["projectionContractFamilyRefs"],
            "projectionContractVersionRefs": shared["projectionContractVersionRefs"],
            "projectionContractVersionSetRefs": shared["projectionContractVersionSetRefs"],
            "projectionCompatibilityDigestRefs": shared["projectionCompatibilityDigestRefs"],
            "projectionQueryContractDigestRefs": shared["projectionQueryContractDigestRefs"],
            "mutationCommandContractDigestRefs": shared["mutationCommandContractDigestRefs"],
            "liveUpdateChannelDigestRefs": shared["liveUpdateChannelDigestRefs"],
            "clientCachePolicyDigestRefs": shared["clientCachePolicyDigestRefs"],
            "releaseContractVerificationMatrixRef": release_contract_matrix_id,
            "releaseContractMatrixHash": release_contract_verification_matrix["matrixHash"],
            "commandSettlementSchemaSetRef": ref("CSS", "platform"),
            "transitionEnvelopeSchemaSetRef": ref("TESS", "platform"),
            "recoveryDispositionSetRef": ref("RDS", ring),
            "routeFreezeDispositionRefs": shared["routeFreezeDispositionRefs"],
            "continuityEvidenceContractRefs": shared["continuityEvidenceContractRefs"],
            "surfacePublicationRefs": shared["surfacePublicationRefs"],
            "surfaceRuntimeBindingRefs": shared["surfaceRuntimeBindingRefs"],
            "publicationParityRef": publication_parity_id,
            "topologyTupleHash": environment_row["topology_tuple_hash"],
            "bundleTupleHash": short_hash(release_matrix_rows),
            "buildProvenanceRef": build_provenance_record["buildProvenanceRecordId"],
            "provenanceVerificationState": profile["provenanceVerificationState"],
            "provenanceConsumptionState": profile["provenanceConsumptionState"],
            "publicationState": profile["publicationState"],
            "publishedAt": now_iso(),
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#RuntimePublicationBundle",
                "prompt/051.md",
            ],
        }
        runtime_publication_bundles.append(runtime_publication_bundle)

        release_publication_parity = {
            "publicationParityRecordId": publication_parity_id,
            "releaseRef": release_id,
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "promotionIntentRef": promotion_intent_id,
            "watchTupleHash": watch_tuple_hash,
            "waveEligibilitySnapshotRef": wave_eligibility_snapshot_ref,
            "runtimePublicationBundleRef": runtime_publication_bundle_id,
            "releaseContractVerificationMatrixRef": release_contract_matrix_id,
            "releaseContractMatrixHash": release_contract_verification_matrix["matrixHash"],
            "routeContractDigestRefs": shared["routeContractDigestRefs"],
            "frontendContractDigestRefs": shared["frontendContractDigestRefs"],
            "projectionCompatibilityDigestRefs": shared["projectionCompatibilityDigestRefs"],
            "surfacePublicationRefs": shared["surfacePublicationRefs"],
            "surfaceRuntimeBindingRefs": shared["surfaceRuntimeBindingRefs"],
            "activeChannelFreezeRefs": [
                ref("CHFR", f"{ring}_browser"),
                ref("CHFR", f"{ring}_partner_callback"),
            ],
            "recoveryDispositionRefs": shared["releaseRecoveryDispositionRefs"],
            "continuityEvidenceDigestRefs": shared["continuityEvidenceDigestRefs"],
            "provenanceVerificationState": profile["provenanceVerificationState"],
            "provenanceConsumptionState": profile["provenanceConsumptionState"],
            "bundleTupleHash": runtime_publication_bundle["bundleTupleHash"],
            "parityState": profile["parityState"],
            "routeExposureState": profile["routeExposureState"],
            "evaluatedAt": now_iso(),
            "driftReasonIds": parity_reason_ids,
            "bindingCeilingReasons": profile["bindingCeilingReasons"],
            "matrixGroupStates": {
                row["matrixGroup"]: row["comparisonState"] for row in release_matrix_rows
            },
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord",
                "prompt/051.md",
            ],
        }
        release_publication_parity_records.append(release_publication_parity)

        wave_observation_policy = {
            "waveObservationPolicyId": wave_observation_policy_id,
            "releaseRef": release_id,
            "waveRef": wave_ref,
            "promotionIntentRef": promotion_intent_id,
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "waveEligibilitySnapshotRef": wave_eligibility_snapshot_ref,
            "watchTupleHash": watch_tuple_hash,
            "minimumDwellDuration": profile["minimumDwellDuration"],
            "requiredProbeRefs": profile["requiredProbeRefs"],
            "requiredContinuityControlRefs": [
                "patient_nav",
                "record_continuation",
                "workspace_task_completion",
                "pharmacy_console_settlement",
            ],
            "requiredContinuityEvidenceDigestRefs": shared["continuityEvidenceDigestRefs"],
            "requiredPublicationParityState": "exact",
            "requiredRoutePostureState": "converged",
            "requiredProvenanceState": "verified",
            "stabilizationCriteriaRef": profile["stabilizationCriteriaRef"],
            "rollbackTriggerRefs": profile["rollbackTriggerRefs"],
            "policyState": profile["policyState"],
            "publishedAt": now_iso(),
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#WaveObservationPolicy",
                "prompt/051.md",
            ],
        }
        wave_observation_policies.append(wave_observation_policy)

        release_watch_tuple = {
            "releaseWatchTupleId": release_watch_tuple_id,
            "releaseRef": release_id,
            "promotionIntentRef": promotion_intent_id,
            "approvalEvidenceBundleRef": approval_evidence_bundle_id,
            "baselineTupleHash": baseline_tuple_hash,
            "approvalTupleHash": approval_tuple_hash,
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "runtimePublicationBundleRef": runtime_publication_bundle_id,
            "releasePublicationParityRef": publication_parity_id,
            "waveRef": wave_ref,
            "waveEligibilitySnapshotRef": wave_eligibility_snapshot_ref,
            "waveGuardrailSnapshotRef": wave_guardrail_snapshot_ref,
            "waveObservationPolicyRef": wave_observation_policy_id,
            "waveControlFenceRef": wave_control_fence_ref,
            "tenantScopeMode": profile["tenantScopeMode"],
            "tenantScopeRef": profile["tenantScopeRef"],
            "affectedTenantCount": profile["affectedTenantCount"],
            "affectedOrganisationCount": profile["affectedOrganisationCount"],
            "tenantScopeTupleHash": short_hash(
                [profile["tenantScopeMode"], profile["tenantScopeRef"], profile["affectedTenantCount"], profile["affectedOrganisationCount"]]
            ),
            "requiredAssuranceSliceRefs": environment_row["required_assurance_slice_refs"],
            "releaseTrustFreezeVerdictRefs": [ref("RTFV", f"{ring}_live"), ref("RTFV", f"{ring}_rollback")],
            "requiredContinuityControlRefs": [
                "patient_nav",
                "record_continuation",
                "workspace_task_completion",
                "pharmacy_console_settlement",
            ],
            "continuityEvidenceDigestRefs": shared["continuityEvidenceDigestRefs"],
            "activeChannelFreezeRefs": [
                ref("CHFR", f"{ring}_browser"),
                ref("CHFR", f"{ring}_partner_callback"),
            ],
            "recoveryDispositionRefs": shared["releaseRecoveryDispositionRefs"],
            "watchTupleHash": watch_tuple_hash,
            "tupleState": profile["watchTupleState"],
            "publishedAt": now_iso(),
            "source_refs": [
                "blueprint/platform-runtime-and-release-blueprint.md#ReleaseWatchTuple",
                "prompt/051.md",
            ],
        }
        release_watch_tuples.append(release_watch_tuple)

        release_candidate = {
            "releaseId": release_id,
            "releaseLabel": profile["candidateLabel"],
            "environmentRing": ring,
            "gitRef": f"refs/tags/vecells-2026-04-11-{slug(ring)}",
            "artifactDigests": artifact_digests,
            "bundleHashRefs": bundle_hash_refs,
            "bundleFreezeDigestRef": bundle_freeze_digest_ref,
            "behaviorContractSetRef": behavior_contract_set_ref,
            "surfaceSchemaSetRef": surface_schema_set_ref,
            "releaseContractVerificationMatrixRef": release_contract_matrix_id,
            "releaseContractMatrixHash": release_contract_verification_matrix["matrixHash"],
            "environmentCompatibilityRef": environment_compatibility_id,
            "schemaMigrationPlanRef": schema_migration_plan_id,
            "projectionBackfillPlanRef": projection_backfill_plan_id,
            "compatibilityEvidenceRef": environment_compatibility_id,
            "runtimeTopologyManifestRef": relative(RUNTIME_TOPOLOGY_PATH),
            "topologyTupleHash": environment_row["topology_tuple_hash"],
            "releaseApprovalFreezeRef": release_approval_freeze_id,
            "channelManifestSetRef": channel_manifest_set["channelManifestSetId"],
            "minimumBridgeCapabilitySetRef": bridge_capability_set["minimumBridgeCapabilitySetId"],
            "requiredAssuranceSliceRefs": environment_row["required_assurance_slice_refs"],
            "watchTupleHash": watch_tuple_hash,
            "publicationParityRef": publication_parity_id,
            "activeReleaseWatchTupleRefs": [release_watch_tuple_id],
            "recoveryDispositionSetRef": ref("RDS", ring),
            "continuityEvidenceContractRefs": shared["continuityEvidenceContractRefs"],
            "runtimePublicationBundleRef": runtime_publication_bundle_id,
            "promotionIntentRefs": [promotion_intent_id],
            "sbomRef": ref("SBOM", ring),
            "provenanceRef": build_provenance_record["buildProvenanceRecordId"],
            "emergencyExceptionRef": None,
            "approvalRefs": [governance_review_package_id, approval_evidence_bundle_id],
            "waveState": profile["waveState"],
            "routeExposureState": profile["routeExposureState"],
            "parityState": profile["parityState"],
            "publicationState": profile["publicationState"],
            "source_refs": profile["source_refs"],
        }
        release_candidates.append(release_candidate)

        for manifest in context["frontend"]["frontendContractManifests"]:
            if profile["parityState"] == "exact":
                binding_state = manifest["browserPostureState"]
            elif profile["parityState"] == "stale":
                binding_state = "recovery_only" if manifest["browserPostureState"] == "recovery_only" else "read_only"
            else:
                binding_state = "recovery_only" if manifest["browserPostureState"] == "recovery_only" else "blocked"
            surface_binding_outcomes.append(
                {
                    "releaseRef": release_id,
                    "environmentRing": ring,
                    "frontendContractManifestRef": manifest["frontendContractManifestId"],
                    "audienceSurface": manifest["audienceSurface"],
                    "parityState": profile["parityState"],
                    "bindingState": binding_state,
                    "governingRecoveryDispositionRef": manifest["releaseRecoveryDispositionRef"],
                    "reasonCodes": parity_reason_ids or ["NONE"],
                }
            )

        for row in release_matrix_rows:
            matrix_rows.append(
                {
                    "release_id": row["releaseId"],
                    "environment_ring": row["environmentRing"],
                    "matrix_group": row["matrixGroup"],
                    "label": row["label"],
                    "approved_member_ref": row["approvedMemberRef"],
                    "approved_hash": row["approvedHash"],
                    "published_member_ref": row["publishedMemberRef"],
                    "published_hash": row["publishedHash"],
                    "comparison_state": row["comparisonState"],
                    "fail_closed_effect": row["failClosedEffect"],
                    "reason_ids": "; ".join(row["reasonIds"]),
                    "source_refs": "; ".join(row["source_refs"]),
                }
            )

        watch_evidence_state_map = {
            "release_approval_freeze": release_approval_freeze["freezeState"],
            "runtime_publication_bundle": runtime_publication_bundle["publicationState"],
            "publication_parity_record": release_publication_parity["parityState"],
            "wave_guardrail_snapshot": "current" if profile["parityState"] == "exact" else "stale",
            "wave_observation_policy": wave_observation_policy["policyState"],
            "rollback_readiness_pack": profile["rollbackReadinessState"],
        }
        watch_evidence_ref_map = {
            "release_approval_freeze": release_approval_freeze_id,
            "runtime_publication_bundle": runtime_publication_bundle_id,
            "publication_parity_record": publication_parity_id,
            "wave_guardrail_snapshot": wave_guardrail_snapshot_ref,
            "wave_observation_policy": wave_observation_policy_id,
            "rollback_readiness_pack": ref("RRP", ring),
        }
        for evidence in WATCH_EVIDENCE_KINDS:
            watch_evidence_rows.append(
                {
                    "watch_evidence_id": ref("WE", f"{ring}_{evidence['evidenceKind']}"),
                    "release_watch_tuple_id": release_watch_tuple_id,
                    "release_id": release_id,
                    "environment_ring": ring,
                    "wave_state": profile["waveState"],
                    "evidence_kind": evidence["evidenceKind"],
                    "evidence_label": evidence["label"],
                    "evidence_ref": watch_evidence_ref_map[evidence["evidenceKind"]],
                    "required_state": evidence["requiredState"],
                    "current_state": watch_evidence_state_map[evidence["evidenceKind"]],
                    "blocking_effect": evidence["blockingEffect"],
                    "source_refs": "; ".join(evidence["source_refs"]),
                }
            )

    exact_count = sum(1 for row in release_publication_parity_records if row["parityState"] == "exact")
    stale_conflict_count = sum(1 for row in release_publication_parity_records if row["parityState"] != "exact")
    active_watch_tuple_count = len(release_watch_tuples)
    publishable_live_binding_count = sum(1 for row in surface_binding_outcomes if row["bindingState"] == "publishable_live")
    summary = {
        "candidate_count": len(release_candidates),
        "release_approval_freeze_count": len(release_approval_freezes),
        "runtime_publication_bundle_count": len(runtime_publication_bundles),
        "publication_parity_record_count": len(release_publication_parity_records),
        "exact_parity_count": exact_count,
        "stale_conflict_count": stale_conflict_count,
        "watch_tuple_count": active_watch_tuple_count,
        "observation_policy_count": len(wave_observation_policies),
        "matrix_row_count": len(matrix_rows),
        "watch_required_evidence_count": len(watch_evidence_rows),
        "binding_outcome_count": len(surface_binding_outcomes),
        "publishable_live_binding_count": publishable_live_binding_count,
        "read_only_binding_count": sum(1 for row in surface_binding_outcomes if row["bindingState"] == "read_only"),
        "recovery_only_binding_count": sum(1 for row in surface_binding_outcomes if row["bindingState"] == "recovery_only"),
        "blocked_binding_count": sum(1 for row in surface_binding_outcomes if row["bindingState"] == "blocked"),
    }

    payload = {
        "task_id": TASK_ID,
        "generated_at": TIMESTAMP,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "source_precedence": SOURCE_PRECEDENCE,
        "upstream_inputs": [
            relative(RUNTIME_TOPOLOGY_PATH),
            relative(GATEWAY_SURFACES_PATH),
            relative(FRONTEND_MANIFEST_PATH),
            relative(EVENT_CONTRACTS_PATH),
            relative(FHIR_CONTRACTS_PATH),
            relative(WATCHLIST_PATH),
            relative(SUPPLY_CHAIN_PATH),
            relative(RELEASE_GATE_PATH),
        ],
        "summary": summary,
        "tupleStripStages": [
            {"stageId": "candidate", "label": "Candidate", "summary": "Frozen git ref plus artifact digests"},
            {"stageId": "freeze", "label": "Freeze", "summary": "Approved review, baseline, policy, schema, and bridge tuple"},
            {"stageId": "publication", "label": "Publication", "summary": "Runtime bundle plus provenance and surface publication refs"},
            {"stageId": "parity", "label": "Parity", "summary": "Exact or fail-closed comparison against the approved tuple"},
            {"stageId": "watch", "label": "Watch", "summary": "Published watch tuple and observation policy for every wave step"},
        ],
        "parityRules": PARITY_RULES,
        "assumptions": ASSUMPTIONS,
        "defects": DEFECTS,
        "reasonCatalog": [
            {"reasonId": reason_id, **reason}
            for reason_id, reason in sorted(REASON_LIBRARY.items())
        ],
        "releaseCandidates": release_candidates,
        "governanceReviewPackages": governance_review_packages,
        "channelManifestSets": channel_manifest_sets,
        "bridgeCapabilitySets": bridge_capability_sets,
        "environmentCompatibilityRecords": environment_compatibility_records,
        "schemaMigrationPlans": schema_migration_plans,
        "projectionBackfillPlans": projection_backfill_plans,
        "releaseContractVerificationMatrices": release_contract_verification_matrices,
        "buildProvenanceRecords": build_provenance_records,
        "releaseApprovalFreezes": release_approval_freezes,
        "runtimePublicationBundles": runtime_publication_bundles,
        "releasePublicationParityRecords": release_publication_parity_records,
        "releaseWatchTuples": release_watch_tuples,
        "waveObservationPolicies": wave_observation_policies,
        "surfaceBindingOutcomes": surface_binding_outcomes,
        "freezeTupleMatrix": matrix_rows,
        "watchRequiredEvidence": watch_evidence_rows,
    }
    return payload, matrix_rows, watch_evidence_rows


def build_freeze_strategy_doc(payload: dict[str, Any]) -> str:
    lines = [
        "# 51 Release Candidate Freeze Strategy",
        "",
        "## Summary",
        "",
        (
            f"`seq_051` publishes `{payload['summary']['candidate_count']}` environment-scoped release candidates and "
            f"`{payload['summary']['release_approval_freeze_count']}` approval freezes so release, provenance, watch, "
            "and browser authority no longer float as separate conventions."
        ),
        "",
        "## Candidate Matrix",
        "",
        "| Release | Environment | Parity | Wave | Publication | Freeze |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for row in payload["releaseCandidates"]:
        freeze = next(
            item for item in payload["releaseApprovalFreezes"] if item["releaseCandidateRef"] == row["releaseId"]
        )
        lines.append(
            "| "
            + " | ".join(
                [
                    row["releaseId"],
                    row["environmentRing"],
                    row["parityState"],
                    row["waveState"],
                    row["publicationState"],
                    freeze["freezeState"],
                ]
            )
            + " |"
        )
    lines.extend(
        [
            "",
            "## Freeze Law",
            "",
            "- Release candidates freeze git ref, artifact digests, bundle hashes, runtime topology, schemas, migration posture, and bridge floors together.",
            "- Release approval freeze also pins the governance review package hash, standards dependency watchlist hash, compilation tuple hash, and approval tuple hash.",
            "- Promotion and rollback reuse the same approval unit. If any member drifts, the freeze is no longer valid.",
            "",
            "## Frozen Member Groups",
            "",
            "| Group | What is frozen | Why it cannot drift |",
            "| --- | --- | --- |",
        ]
    )
    for group in MATRIX_GROUPS:
        lines.append(f"| {group['label']} | {group['summary']} | {group['effect']} |")
    lines.extend(
        [
            "",
            "## Gap Closures",
            "",
            "- Provenance and rollback are no longer frozen separately; they now bind to the same approval tuple.",
            "- Governance review, standards watchlist, and compiled policy bundle all stay candidate-bound instead of becoming sidecar evidence.",
            "- Design publication remains inside the release tuple instead of drifting into token or frontend-only sidecars.",
            "",
            "## Source Anchors",
            "",
            "- `phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze`",
            "- `platform-runtime-and-release-blueprint.md#ReleaseCandidate`",
            "- `platform-runtime-and-release-blueprint.md#RuntimePublicationBundle`",
            "- `phase-cards.md#Extended Summary-Layer Alignment`",
            "- `forensic-audit-findings.md#Finding 91`",
            "- `forensic-audit-findings.md#Finding 103`",
            "- `forensic-audit-findings.md#Finding 118`",
        ]
    )
    return "\n".join(lines) + "\n"


def build_parity_strategy_doc(payload: dict[str, Any]) -> str:
    lines = [
        "# 51 Publication Parity Strategy",
        "",
        "## Summary",
        "",
        (
            f"The parity model currently reports `{payload['summary']['exact_parity_count']}` exact candidates and "
            f"`{payload['summary']['stale_conflict_count']}` non-exact candidates. Exact parity is necessary for live "
            "authority, but it still does not bypass seq_050 browser ceilings around design publication and accessibility completeness."
        ),
        "",
        "## Fail-Closed Rules",
        "",
    ]
    for rule in payload["parityRules"]:
        lines.append(f"- `{rule['ruleId']}`: {rule['summary']} {rule['blockingEffect']}")
    lines.extend(
        [
            "",
            "## Watch Evidence Requirements",
            "",
            "| Evidence | Required state | Blocking effect |",
            "| --- | --- | --- |",
        ]
    )
    for row in WATCH_EVIDENCE_KINDS:
        lines.append(f"| {row['label']} | {row['requiredState']} | {row['blockingEffect']} |")
    lines.extend(
        [
            "",
            "## Parity Outcomes",
            "",
            "| State | Meaning | Writable / calm trust outcome |",
            "| --- | --- | --- |",
            "| exact | Published tuple matches the approved freeze | Still subject to design publication, accessibility, and route-specific runtime binding ceilings |",
            "| stale | Published digests or watch evidence are out of date | Freeze mutation and reduce to read_only or recovery_only |",
            "| conflict | Topology, provenance, or governance watch facts disagree with approval | Block promotion and hold surfaces at blocked or governed recovery posture |",
            "| withdrawn | Publication or watch tuple was withdrawn or superseded | Treat the prior tuple as non-authoritative and require a fresh publication |",
            "",
            "## Mandatory Source Anchors",
            "",
            "- `platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord`",
            "- `platform-runtime-and-release-blueprint.md#ReleaseWatchTuple`",
            "- `platform-runtime-and-release-blueprint.md#WaveObservationPolicy`",
            "- `platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding`",
            "- `forensic-audit-findings.md#Finding 95`",
            "- `forensic-audit-findings.md#Finding 104`",
        ]
    )
    return "\n".join(lines) + "\n"


def build_cockpit_html() -> str:
    data_path = "../../data/analysis/release_publication_parity_rules.json"
    return (
        dedent(
            f"""
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Vecells Release Parity Cockpit</title>
                <style>
                  :root {{
                    color-scheme: light;
                    --canvas: #F6F8FB;
                    --rail: #EEF2F7;
                    --panel: #FFFFFF;
                    --inset: #F4F6FB;
                    --text-strong: #0F172A;
                    --text: #1E293B;
                    --muted: #667085;
                    --border-subtle: #E2E8F0;
                    --border: #CBD5E1;
                    --primary: #3559E6;
                    --parity: #0EA5A4;
                    --governance: #6E59D9;
                    --warning: #C98900;
                    --blocked: #C24141;
                    --radius: 24px;
                    --radius-sm: 16px;
                    --shadow: 0 20px 56px rgba(15, 23, 42, 0.08);
                  }}
                  * {{ box-sizing: border-box; }}
                  body {{
                    margin: 0;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    color: var(--text);
                    background:
                      radial-gradient(circle at top right, rgba(53, 89, 230, 0.12), transparent 32%),
                      radial-gradient(circle at left 12%, rgba(110, 89, 217, 0.08), transparent 26%),
                      var(--canvas);
                  }}
                  body[data-reduced-motion="true"] * {{
                    animation: none !important;
                    transition-duration: 0ms !important;
                    scroll-behavior: auto !important;
                  }}
                  .app {{
                    max-width: 1500px;
                    margin: 0 auto;
                    padding: 18px;
                  }}
                  header {{
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    min-height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    padding: 16px 18px;
                    border-radius: 26px;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    background: rgba(246, 248, 251, 0.9);
                    backdrop-filter: blur(20px);
                    box-shadow: var(--shadow);
                  }}
                  .brand {{
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-width: 290px;
                  }}
                  .mark {{
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: grid;
                    place-items: center;
                    background: linear-gradient(135deg, rgba(53, 89, 230, 0.14), rgba(110, 89, 217, 0.16));
                    color: var(--governance);
                  }}
                  .brand small,
                  .metric span,
                  .eyebrow {{
                    display: block;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--muted);
                  }}
                  .brand strong {{
                    display: block;
                    color: var(--text-strong);
                    font-size: 16px;
                  }}
                  .metrics {{
                    display: grid;
                    grid-template-columns: repeat(4, minmax(110px, 1fr));
                    gap: 12px;
                    flex: 1;
                  }}
                  .metric {{
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: rgba(255, 255, 255, 0.84);
                    padding: 12px 14px;
                  }}
                  .metric strong {{
                    display: block;
                    font-size: 22px;
                    color: var(--text-strong);
                  }}
                  .layout {{
                    display: grid;
                    grid-template-columns: 296px minmax(0, 1fr) 392px;
                    gap: 18px;
                    margin-top: 18px;
                    align-items: start;
                  }}
                  aside,
                  main,
                  .inspector {{
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius);
                    background: var(--panel);
                    box-shadow: var(--shadow);
                  }}
                  aside {{
                    padding: 18px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.94), var(--rail));
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
                    padding: 0 12px;
                    color: var(--text);
                    background: var(--panel);
                  }}
                  .candidate-list {{
                    display: grid;
                    gap: 12px;
                    margin-top: 18px;
                  }}
                  .candidate-card {{
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                    padding: 16px;
                    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,246,251,0.94));
                    transition: transform 180ms ease, border-color 120ms ease, box-shadow 180ms ease;
                    outline: none;
                    cursor: pointer;
                  }}
                  .candidate-card:hover,
                  .candidate-card:focus-visible,
                  .candidate-card[data-selected="true"] {{
                    transform: translateY(-1px);
                    border-color: rgba(53, 89, 230, 0.45);
                    box-shadow: 0 18px 36px rgba(53, 89, 230, 0.12);
                  }}
                  .chip-row,
                  .legend {{
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                  }}
                  .chip {{
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 10px;
                    border-radius: 999px;
                    font-size: 12px;
                    background: rgba(53, 89, 230, 0.08);
                    color: var(--primary);
                  }}
                  .chip.exact {{
                    background: rgba(14, 165, 164, 0.12);
                    color: var(--parity);
                  }}
                  .chip.stale,
                  .chip.conflict {{
                    background: rgba(201, 137, 0, 0.14);
                    color: var(--warning);
                  }}
                  .chip.withdrawn {{
                    background: rgba(194, 65, 65, 0.14);
                    color: var(--blocked);
                  }}
                  main {{
                    display: grid;
                    gap: 18px;
                    min-height: 560px;
                    padding: 18px;
                  }}
                  .tuple-strip {{
                    border-radius: var(--radius);
                    border: 1px solid rgba(53, 89, 230, 0.15);
                    background: linear-gradient(135deg, rgba(53, 89, 230, 0.1), rgba(14, 165, 164, 0.08));
                    padding: 18px;
                  }}
                  .tuple-diagram {{
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                    align-items: center;
                  }}
                  .tuple-stage {{
                    min-height: 132px;
                    border-radius: 18px;
                    border: 1px solid rgba(203, 213, 225, 0.88);
                    background: rgba(255,255,255,0.9);
                    padding: 16px;
                  }}
                  .tuple-table-wrap,
                  .panel {{
                    border-radius: var(--radius);
                    border: 1px solid var(--border-subtle);
                    background: var(--panel);
                    padding: 18px;
                  }}
                  table {{
                    width: 100%;
                    border-collapse: collapse;
                  }}
                  th,
                  td {{
                    padding: 12px 10px;
                    text-align: left;
                    border-bottom: 1px solid var(--border-subtle);
                    vertical-align: top;
                    font-size: 13px;
                  }}
                  th {{
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--muted);
                  }}
                  tr:last-child td {{
                    border-bottom: none;
                  }}
                  .mono {{
                    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                    font-size: 12px;
                    color: var(--text-strong);
                    word-break: break-all;
                  }}
                  .state {{
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 9px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 600;
                  }}
                  .state.exact {{
                    background: rgba(14, 165, 164, 0.12);
                    color: var(--parity);
                  }}
                  .state.stale,
                  .state.conflict {{
                    background: rgba(201, 137, 0, 0.14);
                    color: var(--warning);
                  }}
                  .state.withdrawn,
                  .state.blocked {{
                    background: rgba(194, 65, 65, 0.14);
                    color: var(--blocked);
                  }}
                  .inspector {{
                    padding: 18px;
                    transition: transform 220ms ease, box-shadow 220ms ease;
                  }}
                  .inspector-grid {{
                    display: grid;
                    gap: 16px;
                  }}
                  .bullet-list {{
                    display: grid;
                    gap: 8px;
                    padding-left: 18px;
                    margin: 0;
                  }}
                  .defect-strip {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 12px;
                  }}
                  .defect-card {{
                    border-radius: 18px;
                    border: 1px solid var(--border-subtle);
                    background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,246,251,0.94));
                    padding: 14px;
                  }}
                  .nav-row {{
                    outline: none;
                    transition: background-color 120ms ease;
                  }}
                  .nav-row:focus-visible {{
                    background: rgba(53, 89, 230, 0.08);
                  }}
                  .empty-state {{
                    border-radius: 20px;
                    border: 1px dashed var(--border);
                    background: var(--inset);
                    padding: 22px;
                    color: var(--muted);
                  }}
                  @media (max-width: 1240px) {{
                    .layout {{
                      grid-template-columns: 296px minmax(0, 1fr);
                    }}
                    .inspector {{
                      grid-column: 1 / -1;
                    }}
                  }}
                  @media (max-width: 940px) {{
                    header {{
                      flex-direction: column;
                      align-items: stretch;
                    }}
                    .metrics {{
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                    }}
                    .layout {{
                      grid-template-columns: 1fr;
                    }}
                    .tuple-diagram {{
                      grid-template-columns: 1fr;
                    }}
                  }}
                  @media (prefers-reduced-motion: reduce) {{
                    * {{
                      animation: none !important;
                      transition-duration: 0ms !important;
                    }}
                  }}
                </style>
              </head>
              <body>
                <div class="app">
                  <header data-testid="cockpit-masthead">
                    <div class="brand">
                      <div class="mark" aria-hidden="true">
                        <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4">
                          <rect x="10" y="10" width="44" height="44" rx="12"></rect>
                          <path d="M22 22h20M22 32h14M22 42h10"></path>
                        </svg>
                      </div>
                      <div>
                        <small>Vecells</small>
                        <strong>Release Parity Cockpit</strong>
                        <small>FREEZE monogram • governed tuple integrity</small>
                      </div>
                    </div>
                    <div class="metrics">
                      <div class="metric"><span>Candidates</span><strong id="metric-candidates">0</strong></div>
                      <div class="metric"><span>Exact parity</span><strong id="metric-exact">0</strong></div>
                      <div class="metric"><span>Stale / conflict</span><strong id="metric-nonexact">0</strong></div>
                      <div class="metric"><span>Watch tuples</span><strong id="metric-watch">0</strong></div>
                    </div>
                  </header>

                  <div class="layout">
                    <aside data-testid="candidate-rail">
                      <div class="eyebrow">Filters</div>
                      <div class="filters">
                        <label>Environment
                          <select id="filter-environment" data-testid="filter-environment"></select>
                        </label>
                        <label>Parity state
                          <select id="filter-parity" data-testid="filter-parity"></select>
                        </label>
                        <label>Wave state
                          <select id="filter-wave" data-testid="filter-wave"></select>
                        </label>
                        <label>Candidate
                          <select id="filter-candidate" data-testid="filter-candidate"></select>
                        </label>
                      </div>
                      <div class="candidate-list" id="candidate-list" data-testid="candidate-list"></div>
                    </aside>

                    <main>
                      <section class="tuple-strip" data-testid="tuple-strip">
                        <div class="eyebrow">Tuple Strip</div>
                        <div class="tuple-diagram" id="tuple-diagram"></div>
                        <div class="tuple-table-wrap" style="margin-top:16px;">
                          <div class="eyebrow">Diagram parity table</div>
                          <table data-testid="tuple-table">
                            <thead>
                              <tr>
                                <th>Stage</th>
                                <th>Ref</th>
                                <th>State</th>
                              </tr>
                            </thead>
                            <tbody id="tuple-table-body"></tbody>
                          </table>
                        </div>
                      </section>

                      <section class="panel" data-testid="parity-matrix">
                        <div class="eyebrow">Publication parity matrix</div>
                        <table>
                          <thead>
                            <tr>
                              <th>Group</th>
                              <th>Approved hash</th>
                              <th>Published hash</th>
                              <th>State</th>
                              <th>Fail-closed effect</th>
                            </tr>
                          </thead>
                          <tbody id="matrix-body"></tbody>
                        </table>
                      </section>

                      <section class="panel">
                        <div class="eyebrow">Watch and observation evidence</div>
                        <table data-testid="evidence-table">
                          <thead>
                            <tr>
                              <th>Evidence</th>
                              <th>Required</th>
                              <th>Current</th>
                              <th>Blocking effect</th>
                            </tr>
                          </thead>
                          <tbody id="evidence-body"></tbody>
                        </table>
                      </section>

                      <section class="panel" data-testid="defect-strip">
                        <div class="eyebrow">Defect strip</div>
                        <div class="defect-strip" id="defect-strip-body"></div>
                      </section>
                    </main>

                    <aside class="inspector" data-testid="inspector">
                      <div class="inspector-grid" id="inspector-content"></div>
                    </aside>
                  </div>
                </div>

                <script type="module">
                  const DATA_PATH = "{data_path}";
                  const state = {{
                    data: null,
                    filters: {{
                      environment: "all",
                      parity: "all",
                      wave: "all",
                      candidate: "all",
                    }},
                    selectedCandidateId: null,
                  }};

                  const byId = (items, key) => Object.fromEntries(items.map((item) => [item[key], item]));
                  const escapeHtml = (value) =>
                    String(value)
                      .replaceAll("&", "&amp;")
                      .replaceAll("<", "&lt;")
                      .replaceAll(">", "&gt;")
                      .replaceAll('"', "&quot;");

                  function stateBadgeClass(value) {{
                    if (["exact", "active", "ready", "published"].includes(value)) return "exact";
                    if (["stale", "conflict", "constrained", "superseded"].includes(value)) return value === "conflict" ? "conflict" : "stale";
                    return "withdrawn";
                  }}

                  function compareValues(values) {{
                    return ["all", ...new Set(values)].filter(Boolean);
                  }}

                  function filteredCandidates() {{
                    return state.data.releaseCandidates.filter((candidate) => {{
                      if (state.filters.environment !== "all" && candidate.environmentRing !== state.filters.environment) return false;
                      if (state.filters.parity !== "all" && candidate.parityState !== state.filters.parity) return false;
                      if (state.filters.wave !== "all" && candidate.waveState !== state.filters.wave) return false;
                      if (state.filters.candidate !== "all" && candidate.releaseId !== state.filters.candidate) return false;
                      return true;
                    }});
                  }}

                  function syncSelection() {{
                    const visible = filteredCandidates();
                    if (!visible.length) {{
                      state.selectedCandidateId = null;
                      return;
                    }}
                    if (!visible.some((candidate) => candidate.releaseId === state.selectedCandidateId)) {{
                      state.selectedCandidateId = visible[0].releaseId;
                    }}
                  }}

                  function selectedCandidate() {{
                    return filteredCandidates().find((candidate) => candidate.releaseId === state.selectedCandidateId) ?? null;
                  }}

                  function setSelectOptions(id, values) {{
                    const select = document.getElementById(id);
                    const current = state.filters[id.replace("filter-", "")];
                    select.innerHTML = values
                      .map((value) => `<option value="${{escapeHtml(value)}}">${{value === "all" ? "All" : escapeHtml(value)}}</option>`)
                      .join("");
                    select.value = current;
                  }}

                  function populateFilters() {{
                    const candidates = state.data.releaseCandidates;
                    setSelectOptions("filter-environment", compareValues(candidates.map((candidate) => candidate.environmentRing)));
                    setSelectOptions("filter-parity", compareValues(candidates.map((candidate) => candidate.parityState)));
                    setSelectOptions("filter-wave", compareValues(candidates.map((candidate) => candidate.waveState)));
                    const candidateValues = ["all", ...candidates.map((candidate) => candidate.releaseId)];
                    const candidateSelect = document.getElementById("filter-candidate");
                    candidateSelect.innerHTML = candidateValues
                      .map((value) => {{
                        if (value === "all") return `<option value="all">All</option>`;
                        const row = candidates.find((candidate) => candidate.releaseId === value);
                        return `<option value="${{escapeHtml(value)}}">${{escapeHtml(row.releaseLabel)}} · ${{escapeHtml(value)}}</option>`;
                      }})
                      .join("");
                    candidateSelect.value = state.filters.candidate;
                  }}

                  function renderMetrics() {{
                    document.getElementById("metric-candidates").textContent = state.data.summary.candidate_count;
                    document.getElementById("metric-exact").textContent = state.data.summary.exact_parity_count;
                    document.getElementById("metric-nonexact").textContent = state.data.summary.stale_conflict_count;
                    document.getElementById("metric-watch").textContent = state.data.summary.watch_tuple_count;
                  }}

                  function renderCandidateRail() {{
                    const container = document.getElementById("candidate-list");
                    const visible = filteredCandidates();
                    if (!visible.length) {{
                      container.innerHTML = `<div class="empty-state">No release candidates match the current filter set.</div>`;
                      return;
                    }}
                    container.innerHTML = visible
                      .map((candidate) => {{
                        const selected = candidate.releaseId === state.selectedCandidateId;
                        return `
                          <article
                            class="candidate-card"
                            tabindex="0"
                            data-candidate-id="${{escapeHtml(candidate.releaseId)}}"
                            data-testid="candidate-card-${{escapeHtml(candidate.releaseId)}}"
                            data-selected="${{selected ? "true" : "false"}}"
                          >
                            <div class="eyebrow">${{escapeHtml(candidate.environmentRing)}}</div>
                            <h3 style="margin:6px 0 8px;">${{escapeHtml(candidate.releaseLabel)}}</h3>
                            <div class="chip-row">
                              <span class="chip ${{stateBadgeClass(candidate.parityState)}}">${{escapeHtml(candidate.parityState)}}</span>
                              <span class="chip">${{escapeHtml(candidate.waveState)}}</span>
                            </div>
                            <p style="margin:12px 0 6px;color:var(--muted);font-size:13px;">
                              ${{escapeHtml(candidate.releaseId)}}<br />
                              <span class="mono">${{escapeHtml(candidate.gitRef)}}</span>
                            </p>
                          </article>
                        `;
                      }})
                      .join("");
                  }}

                  function renderTupleStrip(candidate) {{
                    const freeze = state.data.releaseApprovalFreezes.find((row) => row.releaseCandidateRef === candidate.releaseId);
                    const publication = state.data.runtimePublicationBundles.find((row) => row.releaseRef === candidate.releaseId);
                    const parity = state.data.releasePublicationParityRecords.find((row) => row.releaseRef === candidate.releaseId);
                    const watchTuple = state.data.releaseWatchTuples.find((row) => row.releaseRef === candidate.releaseId);
                    const stages = [
                      {{ label: "Candidate", ref: candidate.releaseId, state: candidate.waveState, summary: "Git ref, artifacts, bundles" }},
                      {{ label: "Freeze", ref: freeze.releaseApprovalFreezeId, state: freeze.freezeState, summary: "Review, watchlist, schemas, bridge floors" }},
                      {{ label: "Publication", ref: publication.runtimePublicationBundleId, state: publication.publicationState, summary: "Runtime bundle and surface publication refs" }},
                      {{ label: "Parity", ref: parity.publicationParityRecordId, state: parity.parityState, summary: "Exact or fail-closed comparison" }},
                      {{ label: "Watch", ref: watchTuple.releaseWatchTupleId, state: watchTuple.tupleState, summary: "Watch tuple and observation policy" }},
                    ];
                    document.getElementById("tuple-diagram").innerHTML = stages
                      .map((stage, index) => `
                        <div class="tuple-stage" data-testid="tuple-stage-${{stage.label.toLowerCase()}}">
                          <div class="eyebrow">Stage ${{index + 1}}</div>
                          <h3 style="margin:6px 0;">${{escapeHtml(stage.label)}}</h3>
                          <div class="mono">${{escapeHtml(stage.ref)}}</div>
                          <div style="margin-top:10px;"><span class="state ${{stateBadgeClass(stage.state)}}">${{escapeHtml(stage.state)}}</span></div>
                          <p style="margin:10px 0 0;color:var(--muted);font-size:13px;">${{escapeHtml(stage.summary)}}</p>
                        </div>
                      `)
                      .join("");
                    document.getElementById("tuple-table-body").innerHTML = stages
                      .map((stage) => `
                        <tr>
                          <td>${{escapeHtml(stage.label)}}</td>
                          <td class="mono">${{escapeHtml(stage.ref)}}</td>
                          <td><span class="state ${{stateBadgeClass(stage.state)}}">${{escapeHtml(stage.state)}}</span></td>
                        </tr>
                      `)
                      .join("");
                  }}

                  function renderMatrix(candidate) {{
                    const rows = state.data.freezeTupleMatrix.filter((row) => row.release_id === candidate.releaseId);
                    document.getElementById("matrix-body").innerHTML = rows
                      .map((row, index) => `
                        <tr
                          class="nav-row"
                          tabindex="0"
                          data-nav-group="matrix"
                          data-nav-index="${{index}}"
                          data-testid="matrix-row-${{escapeHtml(row.matrix_group)}}"
                        >
                          <td><strong>${{escapeHtml(row.label)}}</strong><div style="color:var(--muted);margin-top:4px;">${{escapeHtml(row.reason_ids || "no drift reason")}}</div></td>
                          <td class="mono">${{escapeHtml(row.approved_hash)}}</td>
                          <td class="mono">${{escapeHtml(row.published_hash)}}</td>
                          <td><span class="state ${{stateBadgeClass(row.comparison_state)}}">${{escapeHtml(row.comparison_state)}}</span></td>
                          <td>${{escapeHtml(row.fail_closed_effect)}}</td>
                        </tr>
                      `)
                      .join("");
                  }}

                  function renderEvidence(candidate) {{
                    const rows = state.data.watchRequiredEvidence.filter((row) => row.release_id === candidate.releaseId);
                    document.getElementById("evidence-body").innerHTML = rows
                      .map((row, index) => `
                        <tr
                          class="nav-row"
                          tabindex="0"
                          data-nav-group="evidence"
                          data-nav-index="${{index}}"
                          data-testid="evidence-row-${{escapeHtml(row.watch_evidence_id)}}"
                        >
                          <td><strong>${{escapeHtml(row.evidence_label)}}</strong><div class="mono">${{escapeHtml(row.evidence_ref)}}</div></td>
                          <td><span class="state exact">${{escapeHtml(row.required_state)}}</span></td>
                          <td><span class="state ${{stateBadgeClass(row.current_state)}}">${{escapeHtml(row.current_state)}}</span></td>
                          <td>${{escapeHtml(row.blocking_effect)}}</td>
                        </tr>
                      `)
                      .join("");
                  }}

                  function renderInspector(candidate) {{
                    const freeze = state.data.releaseApprovalFreezes.find((row) => row.releaseCandidateRef === candidate.releaseId);
                    const parity = state.data.releasePublicationParityRecords.find((row) => row.releaseRef === candidate.releaseId);
                    const publication = state.data.runtimePublicationBundles.find((row) => row.releaseRef === candidate.releaseId);
                    const watchTuple = state.data.releaseWatchTuples.find((row) => row.releaseRef === candidate.releaseId);
                    const observationPolicy = state.data.waveObservationPolicies.find((row) => row.releaseRef === candidate.releaseId);
                    const bindingRows = state.data.surfaceBindingOutcomes.filter((row) => row.releaseRef === candidate.releaseId);
                    const reasonMap = byId(state.data.reasonCatalog, "reasonId");
                    const reasonItems = parity.driftReasonIds.length
                      ? parity.driftReasonIds.map((reasonId) => `<li><strong>${{escapeHtml(reasonId)}}</strong>: ${{escapeHtml(reasonMap[reasonId].summary)}}</li>`).join("")
                      : "<li>No drift reasons. Candidate remains tuple-coherent.</li>";
                    const freezeMembers = [
                      ["Approval tuple hash", freeze.approvalTupleHash],
                      ["Baseline tuple hash", freeze.baselineTupleHash],
                      ["Scope tuple hash", freeze.scopeTupleHash],
                      ["Compilation tuple hash", freeze.compilationTupleHash],
                      ["Artifact digest set hash", freeze.artifactDigestSetHash],
                      ["Surface schema set hash", freeze.surfaceSchemaSetHash],
                      ["Bridge capability set hash", freeze.bridgeCapabilitySetHash],
                      ["Migration plan hash", freeze.migrationPlanHash],
                    ];
                    const bindingSummary = {{
                      read_only: bindingRows.filter((row) => row.bindingState === "read_only").length,
                      recovery_only: bindingRows.filter((row) => row.bindingState === "recovery_only").length,
                      blocked: bindingRows.filter((row) => row.bindingState === "blocked").length,
                    }};
                    document.getElementById("inspector-content").innerHTML = `
                      <section>
                        <div class="eyebrow">Selected candidate</div>
                        <h2 style="margin:6px 0 8px;">${{escapeHtml(candidate.releaseLabel)}}</h2>
                        <div class="legend">
                          <span class="chip ${{stateBadgeClass(candidate.parityState)}}">${{escapeHtml(candidate.parityState)}}</span>
                          <span class="chip">${{escapeHtml(candidate.waveState)}}</span>
                          <span class="chip">${{escapeHtml(candidate.environmentRing)}}</span>
                        </div>
                        <p class="mono" style="margin:12px 0 0;">${{escapeHtml(candidate.releaseId)}}<br />${{escapeHtml(candidate.gitRef)}}</p>
                        <ul class="bullet-list" style="margin-top:12px;">
                          <li><strong>Publication state</strong>: ${{escapeHtml(publication.publicationState)}}</li>
                          <li><strong>Provenance verification</strong>: ${{escapeHtml(parity.provenanceVerificationState)}}</li>
                          <li><strong>Runtime consumption</strong>: ${{escapeHtml(parity.provenanceConsumptionState)}}</li>
                        </ul>
                      </section>
                      <section>
                        <div class="eyebrow">Drift reasons</div>
                        <ul class="bullet-list">${{reasonItems}}</ul>
                        <div style="margin-top:12px;color:var(--muted);font-size:13px;">${{escapeHtml(parity.bindingCeilingReasons.join(" "))}}</div>
                      </section>
                      <section>
                        <div class="eyebrow">Freeze members</div>
                        <table>
                          <tbody>
                            ${{freezeMembers.map(([label, value]) => `<tr><td>${{escapeHtml(label)}}</td><td class="mono">${{escapeHtml(value)}}</td></tr>`).join("")}}
                          </tbody>
                        </table>
                      </section>
                      <section>
                        <div class="eyebrow">Watch dependencies</div>
                        <ul class="bullet-list">
                          <li><strong>Watch tuple</strong>: <span class="mono">${{escapeHtml(watchTuple.releaseWatchTupleId)}}</span></li>
                          <li><strong>Observation policy</strong>: <span class="mono">${{escapeHtml(observationPolicy.waveObservationPolicyId)}}</span></li>
                          <li><strong>Required parity</strong>: ${{escapeHtml(observationPolicy.requiredPublicationParityState)}}</li>
                          <li><strong>Rollback triggers</strong>: ${{escapeHtml(observationPolicy.rollbackTriggerRefs.join(", "))}}</li>
                        </ul>
                      </section>
                      <section>
                        <div class="eyebrow">Surface ceiling</div>
                        <ul class="bullet-list">
                          <li><strong>Read only</strong>: ${{bindingSummary.read_only}}</li>
                          <li><strong>Recovery only</strong>: ${{bindingSummary.recovery_only}}</li>
                          <li><strong>Blocked</strong>: ${{bindingSummary.blocked}}</li>
                        </ul>
                      </section>
                    `;
                  }}

                  function renderDefects() {{
                    document.getElementById("defect-strip-body").innerHTML = state.data.defects
                      .map((defect) => `
                        <article class="defect-card" data-testid="defect-card-${{escapeHtml(defect.defectId)}}">
                          <div class="eyebrow">${{escapeHtml(defect.state)}}</div>
                          <h3 style="margin:6px 0 8px;">${{escapeHtml(defect.title)}}</h3>
                          <p style="margin:0;color:var(--muted);font-size:13px;">${{escapeHtml(defect.summary)}}</p>
                        </article>
                      `)
                      .join("");
                  }}

                  function moveRovingFocus(target, delta) {{
                    const group = target.getAttribute("data-nav-group");
                    if (!group) return;
                    const rows = Array.from(document.querySelectorAll(`[data-nav-group="${{group}}"]`));
                    const currentIndex = Number(target.getAttribute("data-nav-index") || "0");
                    const nextIndex = Math.min(rows.length - 1, Math.max(0, currentIndex + delta));
                    rows[nextIndex]?.focus();
                  }}

                  function wireEvents() {{
                    ["environment", "parity", "wave", "candidate"].forEach((key) => {{
                      document.getElementById(`filter-${{key}}`).addEventListener("change", (event) => {{
                        state.filters[key] = event.target.value;
                        if (key === "candidate" && event.target.value !== "all") {{
                          state.selectedCandidateId = event.target.value;
                        }}
                        syncSelection();
                        render();
                      }});
                    }});

                    document.body.addEventListener("click", (event) => {{
                      const card = event.target.closest("[data-candidate-id]");
                      if (!card) return;
                      state.selectedCandidateId = card.getAttribute("data-candidate-id");
                      state.filters.candidate = "all";
                      render();
                    }});

                    document.body.addEventListener("keydown", (event) => {{
                      const card = event.target.closest("[data-candidate-id]");
                      if (card && ["ArrowDown", "ArrowUp"].includes(event.key)) {{
                        event.preventDefault();
                        const visible = Array.from(document.querySelectorAll("[data-candidate-id]"));
                        const index = visible.findIndex((item) => item === card);
                        const delta = event.key === "ArrowDown" ? 1 : -1;
                        const next = visible[Math.min(visible.length - 1, Math.max(0, index + delta))];
                        if (next) {{
                          state.selectedCandidateId = next.getAttribute("data-candidate-id");
                          render();
                          requestAnimationFrame(() => next.focus());
                        }}
                        return;
                      }}
                      if (["ArrowDown", "ArrowUp"].includes(event.key) && event.target.matches("[data-nav-group]")) {{
                        event.preventDefault();
                        moveRovingFocus(event.target, event.key === "ArrowDown" ? 1 : -1);
                      }}
                    }});
                  }}

                  function render() {{
                    syncSelection();
                    renderMetrics();
                    populateFilters();
                    renderCandidateRail();
                    renderDefects();
                    const candidate = selectedCandidate();
                    if (!candidate) {{
                      document.getElementById("tuple-diagram").innerHTML = `<div class="empty-state">No candidate selected.</div>`;
                      document.getElementById("tuple-table-body").innerHTML = "";
                      document.getElementById("matrix-body").innerHTML = "";
                      document.getElementById("evidence-body").innerHTML = "";
                      document.getElementById("inspector-content").innerHTML = `<div class="empty-state">Inspector will appear here once a candidate matches the filter set.</div>`;
                      return;
                    }}
                    renderTupleStrip(candidate);
                    renderMatrix(candidate);
                    renderEvidence(candidate);
                    renderInspector(candidate);
                  }}

                  async function main() {{
                    document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "true" : "false";
                    state.data = await fetch(DATA_PATH).then((response) => response.json());
                    state.selectedCandidateId = state.data.releaseCandidates[0]?.releaseId ?? null;
                    render();
                    wireEvents();
                    window.__releaseParityData = state.data;
                  }}

                  main().catch((error) => {{
                    console.error(error);
                    document.getElementById("inspector-content").innerHTML = `<div class="empty-state">Failed to load cockpit data.</div>`;
                  }});
                </script>
              </body>
            </html>
            """
        ).strip()
        + "\n"
    )


def build_spec() -> str:
    return (
        dedent(
            f"""
            import fs from "node:fs";
            import http from "node:http";
            import path from "node:path";
            import {{ fileURLToPath }} from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..");
            const HTML_PATH = path.join(ROOT, "docs", "architecture", "51_release_parity_cockpit.html");
            const RULES_PATH = path.join(ROOT, "data", "analysis", "release_publication_parity_rules.json");

            const RULES_PAYLOAD = JSON.parse(fs.readFileSync(RULES_PATH, "utf8"));

            export const releaseParityCockpitCoverage = [
              "candidate filtering",
              "candidate selection",
              "matrix and inspector parity",
              "drift-state visibility",
              "keyboard navigation",
              "responsive behavior",
              "reduced motion",
              "accessibility smoke checks",
            ];

            function assertCondition(condition, message) {{
              if (!condition) {{
                throw new Error(message);
              }}
            }}

            async function importPlaywright() {{
              try {{
                return await import("playwright");
              }} catch {{
                throw new Error("This spec needs the `playwright` package when run with --run.");
              }}
            }}

            function startStaticServer() {{
              return new Promise((resolve, reject) => {{
                const server = http.createServer((req, res) => {{
                  const rawUrl = req.url ?? "/";
                  const urlPath =
                    rawUrl === "/"
                      ? "/docs/architecture/51_release_parity_cockpit.html"
                      : rawUrl.split("?")[0];
                  const safePath = decodeURIComponent(urlPath).replace(/^\\/+/, "");
                  const filePath = path.join(ROOT, safePath);
                  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {{
                    res.writeHead(404);
                    res.end("Not found");
                    return;
                  }}
                  const body = fs.readFileSync(filePath);
                  const contentType = filePath.endsWith(".html")
                    ? "text/html; charset=utf-8"
                    : filePath.endsWith(".json")
                      ? "application/json; charset=utf-8"
                      : "text/plain; charset=utf-8";
                  res.writeHead(200, {{ "Content-Type": contentType }});
                  res.end(body);
                }});
                server.once("error", reject);
                server.listen(4351, "127.0.0.1", () => resolve(server));
              }});
            }}

            async function run() {{
              assertCondition(fs.existsSync(HTML_PATH), `Missing cockpit HTML: ${{HTML_PATH}}`);
              const {{ chromium }} = await importPlaywright();
              const server = await startStaticServer();
              const browser = await chromium.launch({{ headless: true }});
              const page = await browser.newPage({{ viewport: {{ width: 1460, height: 1180 }} }});
              const url =
                process.env.RELEASE_PARITY_COCKPIT_URL ??
                "http://127.0.0.1:4351/docs/architecture/51_release_parity_cockpit.html";

              try {{
                await page.goto(url, {{ waitUntil: "networkidle" }});
                await page.locator("[data-testid='candidate-rail']").waitFor();
                await page.locator("[data-testid='parity-matrix']").waitFor();
                await page.locator("[data-testid='inspector']").waitFor();

                const initialCards = await page.locator("[data-testid^='candidate-card-']").count();
                assertCondition(
                  initialCards === RULES_PAYLOAD.releaseCandidates.length,
                  `Candidate count drifted: expected ${{RULES_PAYLOAD.releaseCandidates.length}}, found ${{initialCards}}`,
                );

                await page.locator("[data-testid='filter-parity']").selectOption("exact");
                const exactCards = await page.locator("[data-testid^='candidate-card-']").count();
                assertCondition(
                  exactCards === RULES_PAYLOAD.summary.exact_parity_count,
                  `Exact parity filtering drifted: expected ${{RULES_PAYLOAD.summary.exact_parity_count}}, found ${{exactCards}}`,
                );

                await page.locator("[data-testid='filter-parity']").selectOption("all");
                await page.locator("[data-testid='filter-environment']").selectOption("preprod");
                const preprodCards = await page.locator("[data-testid^='candidate-card-']").count();
                assertCondition(preprodCards === 1, `Expected 1 preprod candidate, found ${{preprodCards}}`);

                const inspectorText = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  inspectorText.includes("Pre-production approval freeze") &&
                    inspectorText.includes("conflict") &&
                    inspectorText.includes("quarantined"),
                  "Inspector lost expected preprod conflict detail.",
                );

                const matrixRows = await page.locator("[data-testid^='matrix-row-']").count();
                assertCondition(matrixRows === 8, `Expected 8 matrix rows, found ${{matrixRows}}`);

                await page.locator("[data-testid='filter-environment']").selectOption("all");
                await page.locator("[data-testid='filter-candidate']").selectOption("RC_INTEGRATION_V1");
                const integrationInspector = await page.locator("[data-testid='inspector']").innerText();
                assertCondition(
                  integrationInspector.includes("Integration rehearsal") &&
                    integrationInspector.includes("DRIFT_051_ROUTE_CONTRACT_DIGEST_SET_STALE"),
                  "Integration drift reasons are no longer visible in the inspector.",
                );

                const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
                assertCondition(evidenceRows === 6, `Expected 6 watch evidence rows, found ${{evidenceRows}}`);

                await page.locator("[data-testid='filter-candidate']").selectOption("all");
                await page.locator("[data-testid='candidate-card-RC_LOCAL_V1']").focus();
                await page.keyboard.press("ArrowDown");
                const secondSelected = await page
                  .locator("[data-testid='candidate-card-RC_CI_PREVIEW_V1']")
                  .getAttribute("data-selected");
                assertCondition(
                  secondSelected === "true",
                  "Arrow-down navigation no longer advances candidate selection.",
                );

                await page.setViewportSize({{ width: 390, height: 844 }});
                await page.locator("[data-testid='inspector']").waitFor();

                const motionPage = await browser.newPage({{ viewport: {{ width: 1280, height: 900 }} }});
                try {{
                  await motionPage.emulateMedia({{ reducedMotion: "reduce" }});
                  await motionPage.goto(url, {{ waitUntil: "networkidle" }});
                  const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
                  assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
                }} finally {{
                  await motionPage.close();
                }}

                const landmarks = await page.locator("header, main, aside, section").count();
                assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${{landmarks}}`);
              }} finally {{
                await browser.close();
                await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
              }}
            }}

            if (process.argv.includes("--run")) {{
              run().catch((error) => {{
                console.error(error);
                process.exitCode = 1;
              }});
            }}

            export const releaseParityCockpitManifest = {{
              task: RULES_PAYLOAD.task_id,
              candidates: RULES_PAYLOAD.summary.candidate_count,
              exactParity: RULES_PAYLOAD.summary.exact_parity_count,
              watchTuples: RULES_PAYLOAD.summary.watch_tuple_count,
            }};
            """
        ).strip()
        + "\n"
    )


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
    payload, matrix_rows, watch_rows = build_release_payload(context)

    with FREEZE_MATRIX_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "release_id",
                "environment_ring",
                "matrix_group",
                "label",
                "approved_member_ref",
                "approved_hash",
                "published_member_ref",
                "published_hash",
                "comparison_state",
                "fail_closed_effect",
                "reason_ids",
                "source_refs",
            ],
        )
        writer.writeheader()
        writer.writerows(matrix_rows)

    with WATCH_EVIDENCE_PATH.open("w", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "watch_evidence_id",
                "release_watch_tuple_id",
                "release_id",
                "environment_ring",
                "wave_state",
                "evidence_kind",
                "evidence_label",
                "evidence_ref",
                "required_state",
                "current_state",
                "blocking_effect",
                "source_refs",
            ],
        )
        writer.writeheader()
        writer.writerows(watch_rows)

    write_json(RELEASE_CANDIDATE_SCHEMA_PATH, build_release_candidate_schema())
    write_json(RELEASE_FREEZE_SCHEMA_PATH, build_release_approval_freeze_schema())
    write_json(PARITY_RULES_PATH, payload)
    write_text(FREEZE_STRATEGY_DOC_PATH, build_freeze_strategy_doc(payload))
    write_text(PARITY_STRATEGY_DOC_PATH, build_parity_strategy_doc(payload))
    write_text(COCKPIT_PATH, build_cockpit_html())
    write_text(SPEC_PATH, build_spec())
    update_root_package()
    update_playwright_package()
    print(
        "seq_051 release freeze and parity artifacts generated: "
        f"{payload['summary']['candidate_count']} candidates, "
        f"{payload['summary']['exact_parity_count']} exact parity records, "
        f"{payload['summary']['watch_tuple_count']} watch tuples."
    )


if __name__ == "__main__":
    main()
