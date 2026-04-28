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

from root_script_updates import ROOT_SCRIPT_UPDATES


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
TESTS_DIR = ROOT / "tests" / "playwright"
INFRA_DIR = ROOT / "infra" / "data-storage"

ROOT_PACKAGE_PATH = ROOT / "package.json"
PLAYWRIGHT_PACKAGE_PATH = TESTS_DIR / "package.json"
RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
FHIR_CONTRACTS_PATH = DATA_DIR / "fhir_representation_contracts.json"
FHIR_CONTRACT_MANIFEST_PATH = DATA_DIR / "fhir_representation_contract_manifest.json"

DOMAIN_STORE_MANIFEST_PATH = DATA_DIR / "domain_store_manifest.json"
FHIR_STORE_MANIFEST_PATH = DATA_DIR / "fhir_store_manifest.json"
SEPARATION_MATRIX_PATH = DATA_DIR / "data_plane_separation_matrix.csv"

DESIGN_DOC_PATH = DOCS_DIR / "85_domain_transaction_store_and_fhir_storage_design.md"
RULES_DOC_PATH = DOCS_DIR / "85_data_plane_truth_layer_and_fhir_separation_rules.md"
ATLAS_PATH = DOCS_DIR / "85_data_storage_topology_atlas.html"
SPEC_PATH = TESTS_DIR / "data-storage-topology-atlas.spec.js"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_MAIN_PATH = INFRA_DIR / "terraform" / "main.tf"
TERRAFORM_VARIABLES_PATH = INFRA_DIR / "terraform" / "variables.tf"
TERRAFORM_OUTPUTS_PATH = INFRA_DIR / "terraform" / "outputs.tf"
DOMAIN_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "domain_transaction_store" / "main.tf"
)
DOMAIN_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "domain_transaction_store" / "variables.tf"
)
DOMAIN_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "domain_transaction_store" / "outputs.tf"
)
FHIR_MODULE_MAIN_PATH = (
    INFRA_DIR / "terraform" / "modules" / "fhir_representation_store" / "main.tf"
)
FHIR_MODULE_VARIABLES_PATH = (
    INFRA_DIR / "terraform" / "modules" / "fhir_representation_store" / "variables.tf"
)
FHIR_MODULE_OUTPUTS_PATH = (
    INFRA_DIR / "terraform" / "modules" / "fhir_representation_store" / "outputs.tf"
)

ENVIRONMENT_FILE_PATHS = {
    "local": INFRA_DIR / "environments" / "local.auto.tfvars.json",
    "ci-preview": INFRA_DIR / "environments" / "ci-preview.auto.tfvars.json",
    "integration": INFRA_DIR / "environments" / "integration.auto.tfvars.json",
    "preprod": INFRA_DIR / "environments" / "preprod.auto.tfvars.json",
    "production": INFRA_DIR / "environments" / "production.auto.tfvars.json",
}

DOMAIN_BOOTSTRAP_SQL_PATH = (
    INFRA_DIR / "bootstrap" / "001_domain_transaction_bootstrap.sql"
)
FHIR_BOOTSTRAP_SQL_PATH = (
    INFRA_DIR / "bootstrap" / "001_fhir_representation_bootstrap.sql"
)
LOCAL_COMPOSE_PATH = INFRA_DIR / "local" / "data-storage-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "connectivity-policy.json"
LOCAL_BOOTSTRAP_SCRIPT_PATH = INFRA_DIR / "local" / "bootstrap-domain-fhir-storage.mjs"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "domain-fhir-storage-smoke.test.mjs"

TASK_ID = "par_085"
VISUAL_MODE = "Data_Storage_Topology_Atlas"
GENERATED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
CAPTURED_ON = GENERATED_AT[:10]

DOMAIN_STORE_REF = "store_domain_transaction"
DOMAIN_DATA_STORE_REF = "ds_transactional_domain_authority"
FHIR_STORE_REF = "store_fhir_representation"
FHIR_DATA_STORE_REF = "ds_relational_fhir"

ENVIRONMENT_ORDER = ["local", "ci-preview", "integration", "preprod", "production"]
ENVIRONMENT_LABELS = {
    "local": "Local",
    "ci-preview": "CI preview",
    "integration": "Integration",
    "preprod": "Preprod",
    "production": "Production",
}
ROLE_ORDER = {"nonprod_local": 0, "primary": 1, "secondary": 2}

MISSION = (
    "Provision the Phase 0 data-plane split that keeps Vecells-first transactional domain truth "
    "separate from derived FHIR representation truth, while binding both stores to the runtime "
    "topology, trust-zone, encryption, and workload-identity law already frozen in Phase 0."
)

SOURCE_PRECEDENCE = [
    "prompt/085.md",
    "prompt/shared_operating_contract_076_to_085.md",
    "prompt/AGENT.md",
    "prompt/checklist.md",
    "docs/architecture/13_storage_and_persistence_baseline.md",
    "docs/architecture/13_fhir_representation_and_projection_boundary.md",
    "docs/architecture/11_region_resilience_and_failover_posture.md",
    "data/analysis/runtime_topology_manifest.json",
    "data/analysis/fhir_representation_contract_manifest.json",
    "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationContract",
    "blueprint/phase-0-the-foundation-protocol.md#FhirRepresentationSet",
    "blueprint/phase-0-the-foundation-protocol.md#FhirResourceRecord",
    "blueprint/phase-0-the-foundation-protocol.md#FhirExchangeBundle",
    "blueprint/platform-runtime-and-release-blueprint.md#Data persistence and migration contract",
    "blueprint/platform-runtime-and-release-blueprint.md#Runtime rules",
    "blueprint/forensic-audit-findings.md#Findings 43,49,50,51,52,112,113",
]

ASSUMPTIONS = [
    {
        "assumption_ref": "ASSUMPTION_085_POSTGRESQL_COMPATIBLE_LOCAL_EMULATION",
        "value": "dual_postgresql_compatible_relational_instances",
        "reason": (
            "The storage baseline is relational and provider-neutral; PostgreSQL-compatible local "
            "emulation gives realistic schema, transaction, and bootstrap behaviour without locking "
            "the repo to a vendor-managed SKU."
        ),
        "source_refs": [
            "docs/architecture/13_storage_and_persistence_baseline.md#Store Matrix",
            "prompt/085.md#Mock_now_execution",
        ],
    },
    {
        "assumption_ref": "ASSUMPTION_085_FHIR_STORE_REMAINS_RELATIONAL_NOT_VENDOR_FHIR_SERVER",
        "value": "fhir_rows_in_relational_representation_store",
        "reason": (
            "Prior tasks froze representation contracts, representation sets, resource records, and "
            "exchange bundles as relationally materialized contracts; no ADR requires a vendor FHIR "
            "server for Phase 0."
        ),
        "source_refs": [
            "data/analysis/fhir_representation_contract_manifest.json",
            "docs/architecture/13_fhir_representation_and_projection_boundary.md#Rules",
        ],
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_086_OBJECT_STORAGE_ARTIFACT_BYTE_CLASSES",
        "owning_task_ref": "par_086",
        "scope": "Artifact bytes, quarantine buckets, and retention classes stay owned by object storage.",
        "notes": "par_085 provisions only relational domain and FHIR truth layers plus explicit object-store seam refs.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_087_EVENT_SPINE_PHYSICAL_PERSISTENCE",
        "owning_task_ref": "par_087",
        "scope": "Canonical event-log, outbox, inbox, and queue durability remain separate from transactional and FHIR rows.",
        "notes": "The data-plane split records event-log seams explicitly but does not provision those queues or logs here.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_095_MIGRATION_RUNNER_AND_PROJECTION_BACKFILL",
        "owning_task_ref": "par_095",
        "scope": "Runtime execution of schema migrations and replay/backfill orchestration.",
        "notes": "par_085 publishes bootstrap SQL and connectivity law; par_095 owns ordered rollout and replay automation.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_101_BACKUP_RESTORE_JOB_EXECUTION",
        "owning_task_ref": "par_101",
        "scope": "Automated PITR, replica verification, and restore drills over these stores.",
        "notes": "This task makes backup hooks visible but does not execute recurring restore automation.",
    },
]

DOMAIN_SCHEMA_CATALOG = [
    {
        "schema_ref": "schema_request_control",
        "display_name": "Request control and lineage",
        "table_refs": [
            "submission_envelopes",
            "submission_promotion_records",
            "request_lineages",
            "episodes",
            "requests",
        ],
        "owner_task_refs": ["par_062", "par_066"],
    },
    {
        "schema_ref": "schema_identity_access",
        "display_name": "Identity bindings and access grants",
        "table_refs": [
            "identity_bindings",
            "patient_links",
            "access_grants",
            "access_grant_redemptions",
            "access_grant_supersessions",
        ],
        "owner_task_refs": ["par_068", "par_078"],
    },
    {
        "schema_ref": "schema_contact_and_duplicate",
        "display_name": "Reachability, duplicate review, and repair",
        "table_refs": [
            "contact_route_snapshots",
            "reachability_observations",
            "duplicate_clusters",
            "duplicate_pair_evidence",
        ],
        "owner_task_refs": ["par_069", "par_070", "par_080"],
    },
    {
        "schema_ref": "schema_mutation_control",
        "display_name": "Mutation gates, leases, and settlements",
        "table_refs": [
            "request_lifecycle_leases",
            "lineage_fences",
            "command_action_records",
            "command_settlement_records",
        ],
        "owner_task_refs": ["par_071", "par_072"],
    },
    {
        "schema_ref": "schema_queue_and_reservation",
        "display_name": "Queue ranking and reservation authority",
        "table_refs": [
            "queue_rank_plans",
            "queue_rank_snapshots",
            "reservation_fence_records",
            "capacity_reservations",
            "external_confirmation_gates",
        ],
        "owner_task_refs": ["par_073", "par_074", "par_081"],
    },
    {
        "schema_ref": "schema_release_and_closure",
        "display_name": "Release trust, closure, and lifecycle control",
        "table_refs": [
            "request_closure_records",
            "release_approval_freezes",
            "channel_release_freezes",
            "assurance_slice_trust_records",
        ],
        "owner_task_refs": ["par_075", "par_076", "par_077"],
    },
    {
        "schema_ref": "schema_evidence_and_safety",
        "display_name": "Evidence backbone and safety assimilation",
        "table_refs": [
            "evidence_capture_bundles",
            "evidence_derivation_packages",
            "evidence_snapshots",
            "safety_assimilation_runs",
        ],
        "owner_task_refs": ["par_063", "par_079"],
    },
    {
        "schema_ref": "schema_operational_metadata",
        "display_name": "Bootstrap metadata and migration bookkeeping",
        "table_refs": [
            "schema_migration_history",
            "runtime_store_manifest_publications",
            "tenant_slice_registry",
        ],
        "owner_task_refs": ["par_085", "par_095"],
    },
]

DOMAIN_ACCESS_POLICIES = [
    {
        "policy_ref": "ap_domain_command_writer",
        "access_posture": "command_write",
        "service_identity_ref": "sid_command_api",
        "access_mode": "read_write",
        "allowed_operations": [
            "aggregate_write",
            "settlement_persist",
            "blocker_freeze",
            "schema_bootstrap_read",
        ],
        "notes": "Command API remains the only direct writer of canonical lifecycle truth.",
    },
    {
        "policy_ref": "ap_domain_assurance_reader",
        "access_posture": "assurance_read",
        "service_identity_ref": "sid_assurance_control",
        "access_mode": "read_only",
        "allowed_operations": [
            "restore_evidence_read",
            "closure_diagnostic_read",
            "lease_drift_review",
        ],
        "notes": "Assurance surfaces may inspect truth for restore and governance evidence only.",
    },
    {
        "policy_ref": "ap_domain_projection_blocked",
        "access_posture": "internal_only",
        "service_identity_ref": "sid_projection_worker",
        "access_mode": "blocked",
        "allowed_operations": [],
        "notes": "Projection worker rebuilds from canonical events and published contracts, not direct domain-row joins.",
    },
    {
        "policy_ref": "ap_domain_integration_blocked",
        "access_posture": "internal_only",
        "service_identity_ref": "sid_integration_dispatch",
        "access_mode": "blocked",
        "allowed_operations": [],
        "notes": "Integration dispatch may not persist or read raw transactional truth outside the command seam.",
    },
]

FHIR_ACCESS_POLICIES = [
    {
        "policy_ref": "ap_fhir_command_materializer",
        "access_posture": "mapping_only",
        "service_identity_ref": "sid_command_api",
        "access_mode": "read_write",
        "allowed_operations": [
            "representation_set_materialize",
            "resource_record_supersede",
            "exchange_bundle_stage",
        ],
        "notes": "Command-side mapping/compiler flows materialize FHIR only from published contracts and settled domain truth.",
    },
    {
        "policy_ref": "ap_fhir_integration_bundle_reader",
        "access_posture": "mapping_only",
        "service_identity_ref": "sid_integration_dispatch",
        "access_mode": "read_only",
        "allowed_operations": [
            "exchange_bundle_read",
            "representation_receipt_review",
        ],
        "notes": "Integration workers may read bundle/export artefacts but may not mutate representation rows directly.",
    },
    {
        "policy_ref": "ap_fhir_assurance_reader",
        "access_posture": "assurance_read",
        "service_identity_ref": "sid_assurance_control",
        "access_mode": "read_only",
        "allowed_operations": [
            "representation_parity_review",
            "bundle_audit_read",
        ],
        "notes": "Assurance reads representation rows for parity proof and restore evidence only.",
    },
    {
        "policy_ref": "ap_fhir_projection_blocked",
        "access_posture": "internal_only",
        "service_identity_ref": "sid_projection_worker",
        "access_mode": "blocked",
        "allowed_operations": [],
        "notes": "Projection reads remain derived from events and projection contracts, never from raw FHIR tables.",
    },
]

SEPARATION_RULE_ROWS = [
    {
        "binding_ref": "sep_domain_request_lifecycle_authority",
        "store_family": "domain",
        "focus_area": "request_lifecycle",
        "binding_state": "writable_authority",
        "access_posture": "command_write",
        "domain_truth_rule": "Request, Episode, RequestLineage, blocker, lease, and closure truth persist only in the transactional domain store.",
        "fhir_truth_rule": "FHIR companions may reflect lifecycle milestones but may never drive lifecycle ownership back into domain truth.",
        "identifier_namespace_rule": "aggregate_id and tenant tuple remain distinct from FHIR logicalId/versionId.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_domain_command_writer",
        "blocked_writer_refs": "sid_published_gateway; sid_projection_worker; sid_integration_dispatch",
        "source_refs": "docs/architecture/13_storage_and_persistence_baseline.md#Storage Law; docs/architecture/13_fhir_representation_and_projection_boundary.md#Rules",
    },
    {
        "binding_ref": "sep_domain_identity_and_grant_authority",
        "store_family": "domain",
        "focus_area": "identity_access",
        "binding_state": "writable_authority",
        "access_posture": "command_write",
        "domain_truth_rule": "IdentityBinding, PatientLink, and AccessGrant state live in transactional schemas under exact-once redemption and supersession law.",
        "fhir_truth_rule": "FHIR identifiers may reference patient-facing identity evidence only through published mapping or export companions.",
        "identifier_namespace_rule": "access_grant_token_material and patient identity evidence do not become FHIR identifiers.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_domain_command_writer",
        "blocked_writer_refs": "sid_published_gateway; sid_integration_dispatch",
        "source_refs": "prompt/078.md; prompt/068.md; docs/architecture/13_fhir_representation_and_projection_boundary.md#One-Way Boundary",
    },
    {
        "binding_ref": "sep_domain_settlement_and_reservation_authority",
        "store_family": "domain",
        "focus_area": "settlement_and_reservation",
        "binding_state": "writable_authority",
        "access_posture": "command_write",
        "domain_truth_rule": "CommandSettlementRecord, ReservationFenceRecord, and ExternalConfirmationGate stay in the canonical transactional store.",
        "fhir_truth_rule": "FHIR bundles may expose booking-facing outputs but never become the source of reservation finality or external confirmation truth.",
        "identifier_namespace_rule": "reservation keys remain Vecells internal consistency keys, never public resource identifiers.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_domain_command_writer",
        "blocked_writer_refs": "sid_published_gateway; sid_projection_worker; sid_integration_dispatch",
        "source_refs": "prompt/072.md; prompt/074.md; prompt/081.md",
    },
    {
        "binding_ref": "sep_domain_assurance_read_only",
        "store_family": "domain",
        "focus_area": "restore_and_diagnostics",
        "binding_state": "warm_standby",
        "access_posture": "assurance_read",
        "domain_truth_rule": "Assurance read paths may inspect transactional truth for restore proof, replay review, and governance evidence only.",
        "fhir_truth_rule": "Assurance may compare FHIR parity without widening FHIR into an operational write owner.",
        "identifier_namespace_rule": "diagnostic snapshots preserve original identifiers and tuple hashes without rewriting them.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_domain_assurance_reader",
        "blocked_writer_refs": "browser; sid_public_edge_proxy; sid_published_gateway",
        "source_refs": "docs/architecture/11_region_resilience_and_failover_posture.md#Failover Authority; prompt/063.md",
    },
    {
        "binding_ref": "sep_domain_projection_not_source",
        "store_family": "domain",
        "focus_area": "projection_boundary",
        "binding_state": "warm_standby",
        "access_posture": "internal_only",
        "domain_truth_rule": "Projection worker rebuilds from immutable events and published projection contracts, not direct transactional joins.",
        "fhir_truth_rule": "Raw FHIR rows are equally non-authoritative for browser projections and staff query read models.",
        "identifier_namespace_rule": "projection keys and cache tuples remain derived, not authoritative.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "",
        "blocked_writer_refs": "sid_projection_worker; browser",
        "source_refs": "docs/architecture/13_fhir_representation_and_projection_boundary.md#Rules; prompt/082.md",
    },
    {
        "binding_ref": "sep_fhir_mapping_contract_gate",
        "store_family": "fhir",
        "focus_area": "mapping_contracts",
        "binding_state": "derived_materialization",
        "access_posture": "mapping_only",
        "domain_truth_rule": "Settled aggregate truth is the only admissible input to FHIR materialization.",
        "fhir_truth_rule": "FhirRepresentationSet, FhirResourceRecord, and FhirExchangeBundle rows are written only through published mapping contracts and compiler-owned seams.",
        "identifier_namespace_rule": "FHIR logicalId and versionId remain representation identifiers, never aggregate primary keys.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_fhir_command_materializer",
        "blocked_writer_refs": "sid_projection_worker; browser",
        "source_refs": "data/analysis/fhir_representation_contract_manifest.json; prompt/064.md",
    },
    {
        "binding_ref": "sep_fhir_resource_version_supersession",
        "store_family": "fhir",
        "focus_area": "resource_versioning",
        "binding_state": "derived_materialization",
        "access_posture": "mapping_only",
        "domain_truth_rule": "Aggregate version advancement determines when representation supersession is allowed.",
        "fhir_truth_rule": "FHIR rows remain append-safe and superseded by new representation-set versions rather than in-place mutation.",
        "identifier_namespace_rule": "contract version refs and resource version ids stay separate from aggregate version ids.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_fhir_command_materializer",
        "blocked_writer_refs": "sid_integration_dispatch",
        "source_refs": "prompt/064.md; data/analysis/fhir_representation_contract_manifest.json",
    },
    {
        "binding_ref": "sep_fhir_exchange_bundle_read_only_to_integrations",
        "store_family": "fhir",
        "focus_area": "bundle_exports",
        "binding_state": "derived_materialization",
        "access_posture": "mapping_only",
        "domain_truth_rule": "Domain truth does not wait on partner bundle acceptance to become authoritative.",
        "fhir_truth_rule": "Integration workers may read staged bundles and receipts but may not persist raw FHIR rows or bypass compiler-owned staging.",
        "identifier_namespace_rule": "bundle ids are export artefacts, not request or appointment identifiers.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_fhir_integration_bundle_reader",
        "blocked_writer_refs": "sid_integration_dispatch(write); browser",
        "source_refs": "data/analysis/fhir_representation_contract_manifest.json; prompt/085.md#Non-negotiable rules",
    },
    {
        "binding_ref": "sep_fhir_assurance_parity_review",
        "store_family": "fhir",
        "focus_area": "assurance_review",
        "binding_state": "warm_standby",
        "access_posture": "assurance_read",
        "domain_truth_rule": "Restore, replay, and parity decisions still anchor on canonical transactional truth plus immutable evidence.",
        "fhir_truth_rule": "Assurance may read representation rows for parity proof and export admissibility without gaining write authority.",
        "identifier_namespace_rule": "parity witness ids join domain and FHIR tuples without collapsing their namespaces.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "ap_fhir_assurance_reader",
        "blocked_writer_refs": "browser; sid_published_gateway",
        "source_refs": "prompt/053.md; prompt/064.md; prompt/075.md",
    },
    {
        "binding_ref": "sep_fhir_not_projection_query_source",
        "store_family": "fhir",
        "focus_area": "projection_boundary",
        "binding_state": "warm_standby",
        "access_posture": "internal_only",
        "domain_truth_rule": "Published browser and staff projections rebuild from event and projection contracts only.",
        "fhir_truth_rule": "FHIR tables remain interoperability and governed back-office material, never a shortcut query source for shells.",
        "identifier_namespace_rule": "projection cache keys remain distinct from FHIR identifiers and bundle refs.",
        "browser_reachability_rule": "never_browser_addressable",
        "allowed_writer_policy_refs": "",
        "blocked_writer_refs": "sid_projection_worker; browser",
        "source_refs": "docs/architecture/13_fhir_representation_and_projection_boundary.md#Rules; blueprint/platform-runtime-and-release-blueprint.md#Runtime rules",
    },
]


def sha256_snippet(payload: Any) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:16]


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
        raise SystemExit(f"Cannot write empty CSV to {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames: list[str] = []
    for row in rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def append_script_step(script: str, step: str) -> str:
    return script if step in script else script + " && " + step


def relative_to_root(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sort_runtime_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        rows,
        key=lambda row: (
            ENVIRONMENT_ORDER.index(row["environment_ring"]),
            ROLE_ORDER[row["uk_region_role"]],
            row["region_ref"],
        ),
    )


def is_authoritative_role(role: str) -> bool:
    return role in {"nonprod_local", "primary"}


def build_segment_lookup(topology: dict[str, Any]) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for environment in topology["network_foundation"]["environment_network_realizations"]:
        for placement in environment["region_placements"]:
            for segment in placement["workload_segments"]:
                lookup[segment["runtime_workload_family_id"]] = {
                    "environment_ring": environment["environment_ring"],
                    "network_ref": placement["network_ref"],
                    "cidr_block": placement["cidr_block"],
                    "segment_ref": segment["segment_ref"],
                    "subnet_cidr": segment["subnet_cidr"],
                    "network_policy_ref": segment["network_policy_ref"],
                    "route_domain_ref": segment["route_domain_ref"],
                    "service_identity_ref": segment["service_identity_ref"],
                    "egress_allowlist_ref": segment["egress_allowlist_ref"],
                }
    return lookup


def build_store_realizations(
    topology: dict[str, Any],
    store_family: str,
) -> list[dict[str, Any]]:
    segment_lookup = build_segment_lookup(topology)
    data_rows = sort_runtime_rows(
        [
            row
            for row in topology["runtime_workload_families"]
            if row["runtime_workload_family_ref"] == "wf_data_stateful_plane"
        ]
    )
    realizations: list[dict[str, Any]] = []
    for row in data_rows:
        segment = segment_lookup[row["runtime_workload_family_id"]]
        authoritative = is_authoritative_role(row["uk_region_role"])
        if store_family == "domain":
            store_realization_id = f"domain-{row['environment_ring']}-{row['uk_region_role']}"
            binding_state = "writable_authority" if authoritative else "warm_standby"
            access_posture = "command_write" if authoritative else "internal_only"
            endpoint_ref = f"domain-{row['environment_ring']}-{row['uk_region_role']}.internal.vecells"
            bootstrap_sql_refs = [relative_to_root(DOMAIN_BOOTSTRAP_SQL_PATH)]
            allowed_policy_refs = [
                "ap_domain_command_writer",
                "ap_domain_assurance_reader",
            ]
            blocked_service_identity_refs = [
                "sid_public_edge_proxy",
                "sid_published_gateway",
                "sid_projection_worker",
                "sid_integration_dispatch",
                "browser",
            ]
            display_name = (
                f"{ENVIRONMENT_LABELS[row['environment_ring']]} {row['uk_region_role']} domain authority"
            )
            continuity_posture = (
                "canonical_write_authority"
                if authoritative
                else "warm_replica_read_only_until_restore_tuple_exact"
            )
            bootstrap_health = "bootstrap_ready"
        else:
            store_realization_id = f"fhir-{row['environment_ring']}-{row['uk_region_role']}"
            binding_state = "derived_materialization" if authoritative else "warm_standby"
            access_posture = "mapping_only" if authoritative else "internal_only"
            endpoint_ref = f"fhir-{row['environment_ring']}-{row['uk_region_role']}.internal.vecells"
            bootstrap_sql_refs = [relative_to_root(FHIR_BOOTSTRAP_SQL_PATH)]
            allowed_policy_refs = [
                "ap_fhir_command_materializer",
                "ap_fhir_integration_bundle_reader",
                "ap_fhir_assurance_reader",
            ]
            blocked_service_identity_refs = [
                "sid_public_edge_proxy",
                "sid_published_gateway",
                "sid_projection_worker",
                "browser",
            ]
            display_name = (
                f"{ENVIRONMENT_LABELS[row['environment_ring']]} {row['uk_region_role']} FHIR representation"
            )
            continuity_posture = (
                "derived_materialization_ready"
                if authoritative
                else "warm_replica_for_bundle_rebuild_only"
            )
            bootstrap_health = "mapping_bootstrap_ready"

        realizations.append(
            {
                "store_realization_id": store_realization_id,
                "store_family": store_family,
                "environment_ring": row["environment_ring"],
                "environment_label": ENVIRONMENT_LABELS[row["environment_ring"]],
                "region_ref": row["region_ref"],
                "uk_region_role": row["uk_region_role"],
                "runtime_workload_family_id": row["runtime_workload_family_id"],
                "runtime_workload_family_ref": row["runtime_workload_family_ref"],
                "trust_zone_ref": row["trust_zone_ref"],
                "network_ref": segment["network_ref"],
                "segment_ref": segment["segment_ref"],
                "subnet_cidr": segment["subnet_cidr"],
                "network_policy_ref": segment["network_policy_ref"],
                "route_domain_ref": segment["route_domain_ref"],
                "service_identity_ref": row["service_identity_ref"],
                "egress_allowlist_ref": row["egress_allowlist_ref"],
                "binding_state": binding_state,
                "access_posture": access_posture,
                "display_name": display_name,
                "endpoint_ref": endpoint_ref,
                "bootstrap_sql_refs": bootstrap_sql_refs,
                "allowed_policy_refs": allowed_policy_refs,
                "blocked_service_identity_refs": blocked_service_identity_refs,
                "tenant_isolation_mode": row["tenant_isolation_mode"],
                "encryption_profile_ref": "enc_postgresql_kms_ready_at_rest",
                "connectivity_mode": "private_identity_ready_tls",
                "continuity_posture": continuity_posture,
                "bootstrap_health": bootstrap_health,
                "source_refs": row["source_refs"],
            }
        )
    return realizations


def build_environment_realizations(
    store_realizations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in store_realizations:
        grouped[row["environment_ring"]].append(row)

    environment_realizations = []
    for environment_ring in ENVIRONMENT_ORDER:
        env_rows = sort_runtime_rows(grouped[environment_ring])
        region_placements = [
            {
                "region_ref": row["region_ref"],
                "uk_region_role": row["uk_region_role"],
                "store_realization_id": row["store_realization_id"],
                "network_ref": row["network_ref"],
                "segment_ref": row["segment_ref"],
                "subnet_cidr": row["subnet_cidr"],
                "endpoint_ref": row["endpoint_ref"],
                "binding_state": row["binding_state"],
                "access_posture": row["access_posture"],
                "bootstrap_sql_refs": row["bootstrap_sql_refs"],
            }
            for row in env_rows
        ]
        environment_realizations.append(
            {
                "environment_ring": environment_ring,
                "environment_label": ENVIRONMENT_LABELS[environment_ring],
                "publication_state": "simulator_safe_and_private",
                "region_placements": region_placements,
            }
        )
    return environment_realizations


def build_domain_manifest(topology: dict[str, Any]) -> dict[str, Any]:
    realizations = build_store_realizations(topology, "domain")
    environment_realizations = build_environment_realizations(realizations)
    descriptor = {
        "store_ref": DOMAIN_STORE_REF,
        "data_store_ref": DOMAIN_DATA_STORE_REF,
        "display_name": "Transactional domain authority store",
        "store_class": "transactional_domain",
        "engine_family": "postgresql_compatible_relational",
        "runtime_workload_family_ref": "wf_data_stateful_plane",
        "trust_zone_ref": "tz_stateful_data",
        "identifier_namespace_ref": "ns_vecells_domain_aggregate",
        "tenant_partition_rule": "tenant_tuple_on_every_key_or_record",
        "browser_reachability": "never",
        "encryption_posture": {
            "at_rest": "platform_managed_kms_ready",
            "in_transit": "private_tls_and_workload_identity_ready",
        },
        "bootstrap_sql_refs": [relative_to_root(DOMAIN_BOOTSTRAP_SQL_PATH)],
        "schema_catalog": DOMAIN_SCHEMA_CATALOG,
        "source_refs": [
            "docs/architecture/13_storage_and_persistence_baseline.md#Store Matrix",
            "docs/architecture/13_fhir_representation_and_projection_boundary.md#Rules",
            "prompt/085.md#At minimum, implement these authoritative capabilities",
        ],
    }
    summary = {
        "schema_count": len(DOMAIN_SCHEMA_CATALOG),
        "access_policy_count": len(DOMAIN_ACCESS_POLICIES),
        "environment_realization_count": len(environment_realizations),
        "store_realization_count": len(realizations),
        "follow_on_dependency_count": len(FOLLOW_ON_DEPENDENCIES),
        "bootstrap_sql_ref_count": len(descriptor["bootstrap_sql_refs"]),
    }
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "fhir_store_manifest_ref": "data/analysis/fhir_store_manifest.json",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "assumptions": ASSUMPTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "store_descriptor": descriptor,
        "access_policies": DOMAIN_ACCESS_POLICIES,
        "environment_realizations": environment_realizations,
        "store_realizations": realizations,
        "store_tuple_hash": sha256_snippet(summary),
    }


def build_fhir_manifest(
    topology: dict[str, Any],
    fhir_contract_manifest: dict[str, Any],
    fhir_contracts: dict[str, Any],
) -> dict[str, Any]:
    contract_rows = fhir_contracts["contracts"]
    realizations = build_store_realizations(topology, "fhir")
    environment_realizations = build_environment_realizations(realizations)
    descriptor = {
        "store_ref": FHIR_STORE_REF,
        "data_store_ref": FHIR_DATA_STORE_REF,
        "display_name": "FHIR representation store",
        "store_class": "fhir_representation",
        "engine_family": "postgresql_compatible_relational",
        "runtime_workload_family_ref": "wf_data_stateful_plane",
        "trust_zone_ref": "tz_stateful_data",
        "identifier_namespace_ref": "ns_vecells_fhir_representation",
        "tenant_partition_rule": "tenant_tuple_on_every_representation_set",
        "browser_reachability": "never",
        "encryption_posture": {
            "at_rest": "platform_managed_kms_ready",
            "in_transit": "private_tls_and_workload_identity_ready",
        },
        "bootstrap_sql_refs": [relative_to_root(FHIR_BOOTSTRAP_SQL_PATH)],
        "persistence_tables": fhir_contract_manifest["persistence_tables"],
        "schema_refs": fhir_contract_manifest["schemas"],
        "representation_contract_refs": [
            row["fhirRepresentationContractId"] for row in contract_rows
        ],
        "source_refs": [
            "data/analysis/fhir_representation_contract_manifest.json",
            "prompt/085.md#Mission",
            "docs/architecture/13_fhir_representation_and_projection_boundary.md#One-Way Boundary",
        ],
    }
    summary = {
        "representation_contract_count": len(descriptor["representation_contract_refs"]),
        "persistence_table_count": len(descriptor["persistence_tables"]),
        "schema_ref_count": len(descriptor["schema_refs"]),
        "access_policy_count": len(FHIR_ACCESS_POLICIES),
        "environment_realization_count": len(environment_realizations),
        "store_realization_count": len(realizations),
        "follow_on_dependency_count": len(FOLLOW_ON_DEPENDENCIES),
        "bootstrap_sql_ref_count": len(descriptor["bootstrap_sql_refs"]),
    }
    return {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "captured_on": CAPTURED_ON,
        "visual_mode": VISUAL_MODE,
        "mission": MISSION,
        "runtime_topology_manifest_ref": "data/analysis/runtime_topology_manifest.json",
        "domain_store_manifest_ref": "data/analysis/domain_store_manifest.json",
        "source_precedence": SOURCE_PRECEDENCE,
        "summary": summary,
        "assumptions": ASSUMPTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "store_descriptor": descriptor,
        "access_policies": FHIR_ACCESS_POLICIES,
        "environment_realizations": environment_realizations,
        "store_realizations": realizations,
        "store_tuple_hash": sha256_snippet(summary),
    }


def build_atlas_bundle(
    domain_manifest: dict[str, Any],
    fhir_manifest: dict[str, Any],
    separation_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    stores = domain_manifest["store_realizations"] + fhir_manifest["store_realizations"]
    policy_directory = {
        row["policy_ref"]: row
        for row in (domain_manifest["access_policies"] + fhir_manifest["access_policies"])
    }
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "summary": {
            "store_realization_count": len(stores),
            "binding_row_count": len(separation_rows),
            "domain_store_realization_count": len(domain_manifest["store_realizations"]),
            "fhir_store_realization_count": len(fhir_manifest["store_realizations"]),
        },
        "filters": {
            "environments": ["all", *ENVIRONMENT_ORDER],
            "storeFamilies": ["all", "domain", "fhir"],
            "bindingStates": [
                "all",
                "writable_authority",
                "derived_materialization",
                "warm_standby",
            ],
            "accessPostures": [
                "all",
                "command_write",
                "mapping_only",
                "assurance_read",
                "internal_only",
            ],
        },
        "stores": stores,
        "bindings": separation_rows,
        "policy_directory": policy_directory,
        "representation_flow": [
            {
                "flow_step_ref": "flow_domain_aggregate_settlement",
                "label": "Canonical aggregate settlement",
                "store_family": "domain",
                "tone": "domain",
            },
            {
                "flow_step_ref": "flow_mapping_contract_gate",
                "label": "Published FHIR mapping contract",
                "store_family": "fhir",
                "tone": "manifest",
            },
            {
                "flow_step_ref": "flow_representation_set_materialization",
                "label": "FhirRepresentationSet materialization",
                "store_family": "fhir",
                "tone": "fhir",
            },
            {
                "flow_step_ref": "flow_resource_record_versions",
                "label": "FhirResourceRecord versions",
                "store_family": "fhir",
                "tone": "fhir",
            },
            {
                "flow_step_ref": "flow_exchange_bundle_stage",
                "label": "FhirExchangeBundle staging and export",
                "store_family": "fhir",
                "tone": "warning",
            },
        ],
    }


def build_design_doc(
    domain_manifest: dict[str, Any],
    fhir_manifest: dict[str, Any],
    separation_rows: list[dict[str, Any]],
) -> str:
    domain_table = "\n".join(
        f"| `{row['store_realization_id']}` | `{row['environment_ring']}` | `{row['region_ref']}` | "
        f"`{row['binding_state']}` | `{row['service_identity_ref']}` | `{row['endpoint_ref']}` |"
        for row in domain_manifest["store_realizations"]
    )
    fhir_table = "\n".join(
        f"| `{row['store_realization_id']}` | `{row['environment_ring']}` | `{row['region_ref']}` | "
        f"`{row['binding_state']}` | `{row['service_identity_ref']}` | `{row['endpoint_ref']}` |"
        for row in fhir_manifest["store_realizations"]
    )
    follow_on_table = "\n".join(
        f"| `{row['dependency_ref']}` | `{row['owning_task_ref']}` | {row['scope']} |"
        for row in FOLLOW_ON_DEPENDENCIES
    )
    return dedent(
        f"""
        # 85 Domain Transaction Store And FHIR Storage Design

        Generated by `tools/analysis/build_domain_and_fhir_storage.py`.

        ## Mission

        {MISSION}

        ## Domain Store Summary

        - Store ref: `{domain_manifest['store_descriptor']['store_ref']}`
        - Data store ref: `{domain_manifest['store_descriptor']['data_store_ref']}`
        - Engine family: `{domain_manifest['store_descriptor']['engine_family']}`
        - Store realizations: `{domain_manifest['summary']['store_realization_count']}`
        - Access policies: `{domain_manifest['summary']['access_policy_count']}`

        | Store realization | Environment | Region | Binding state | Service identity | Endpoint |
        | --- | --- | --- | --- | --- | --- |
        {domain_table}

        ## FHIR Store Summary

        - Store ref: `{fhir_manifest['store_descriptor']['store_ref']}`
        - Data store ref: `{fhir_manifest['store_descriptor']['data_store_ref']}`
        - Engine family: `{fhir_manifest['store_descriptor']['engine_family']}`
        - Representation contracts: `{fhir_manifest['summary']['representation_contract_count']}`
        - Persistence tables: `{fhir_manifest['summary']['persistence_table_count']}`

        | Store realization | Environment | Region | Binding state | Service identity | Endpoint |
        | --- | --- | --- | --- | --- | --- |
        {fhir_table}

        ## Separation Matrix Summary

        - Binding rows: `{len(separation_rows)}`
        - Domain-authority rows: `{sum(1 for row in separation_rows if row['store_family'] == 'domain')}`
        - FHIR-derived rows: `{sum(1 for row in separation_rows if row['store_family'] == 'fhir')}`

        ## Follow-on Dependencies

        | Dependency | Owning task | Scope |
        | --- | --- | --- |
        {follow_on_table}
        """
    ).strip()


def build_rules_doc(
    domain_manifest: dict[str, Any],
    fhir_manifest: dict[str, Any],
    separation_rows: list[dict[str, Any]],
) -> str:
    matrix_table = "\n".join(
        f"| `{row['binding_ref']}` | `{row['store_family']}` | `{row['focus_area']}` | "
        f"`{row['binding_state']}` | `{row['access_posture']}` | {row['identifier_namespace_rule']} |"
        for row in separation_rows
    )
    schema_table = "\n".join(
        f"| `{row['schema_ref']}` | {row['display_name']} | {', '.join(f'`{table}`' for table in row['table_refs'])} |"
        for row in domain_manifest["store_descriptor"]["schema_catalog"]
    )
    policy_table = "\n".join(
        f"| `{row['policy_ref']}` | `{row['service_identity_ref']}` | `{row['access_mode']}` | "
        f"{', '.join(f'`{op}`' for op in row['allowed_operations']) or '`blocked`'} |"
        for row in (DOMAIN_ACCESS_POLICIES + FHIR_ACCESS_POLICIES)
    )
    return dedent(
        f"""
        # 85 Data Plane Truth Layer And FHIR Separation Rules

        ## Non-negotiable Rules

        - Transactional domain truth and FHIR representation truth remain separate stores, access policies, and identifier namespaces.
        - `sid_command_api` is the only direct writer of transactional domain truth.
        - FHIR representation rows materialize only through published mapping contracts and compiler-owned write seams.
        - Browsers, published gateway surfaces, and shell delivery workloads remain blocked from both stores.
        - Projection rebuilds and read models stay derived from canonical events and published projection contracts, not direct domain or FHIR joins.

        ## Domain Schema Catalog

        | Schema ref | Purpose | Bootstrap tables |
        | --- | --- | --- |
        {schema_table}

        ## Access Policy Matrix

        | Policy | Service identity | Mode | Allowed operations |
        | --- | --- | --- | --- |
        {policy_table}

        ## Separation Matrix

        | Binding | Store family | Focus area | Binding state | Access posture | Identifier namespace rule |
        | --- | --- | --- | --- | --- | --- |
        {matrix_table}

        ## FHIR Store Contract Inputs

        - Persistence tables: {", ".join(f"`{row}`" for row in fhir_manifest["store_descriptor"]["persistence_tables"])}
        - Schema refs: {", ".join(f"`{row}`" for row in fhir_manifest["store_descriptor"]["schema_refs"])}
        - Representation contract count: `{fhir_manifest['summary']['representation_contract_count']}`
        """
    ).strip()


def build_html(bundle: dict[str, Any]) -> str:
    payload = json.dumps(bundle, separators=(",", ":"))
    template = dedent(
        """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>85 Data Storage Topology Atlas</title>
            <style>
              :root {
                color-scheme: light;
                --canvas: #f7f9fc;
                --panel: #ffffff;
                --rail: #eef2f7;
                --inset: #f4f7fb;
                --text-strong: #0f172a;
                --text-default: #1e293b;
                --text-muted: #64748b;
                --border: #e2e8f0;
                --domain: #2563eb;
                --fhir: #0ea5a4;
                --manifest: #7c3aed;
                --warning: #d97706;
                --blocked: #c24141;
                --ready: #059669;
                --shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
                --radius: 22px;
              }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background:
                  radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 24rem),
                  radial-gradient(circle at top right, rgba(14, 165, 164, 0.08), transparent 20rem),
                  var(--canvas);
                color: var(--text-default);
              }
              body[data-reduced-motion="true"] * {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
                scroll-behavior: auto !important;
              }
              .page {
                max-width: 1580px;
                margin: 0 auto;
                padding: 20px 24px 48px;
              }
              .masthead {
                position: sticky;
                top: 0;
                z-index: 20;
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 18px;
                align-items: center;
                min-height: 76px;
                padding: 18px 22px;
                margin-bottom: 18px;
                border: 1px solid rgba(226, 232, 240, 0.9);
                border-radius: var(--radius);
                background: rgba(255, 255, 255, 0.94);
                box-shadow: var(--shadow);
                backdrop-filter: blur(16px);
              }
              .brand {
                display: flex;
                align-items: center;
                gap: 14px;
              }
              .monogram {
                width: 42px;
                height: 42px;
                border-radius: 14px;
                display: grid;
                place-items: center;
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(124, 58, 237, 0.16));
                color: var(--text-strong);
                font-weight: 700;
                letter-spacing: 0.08em;
              }
              .brand-copy h1 {
                margin: 0;
                font-size: 1.1rem;
                color: var(--text-strong);
              }
              .brand-copy p {
                margin: 4px 0 0;
                color: var(--text-muted);
                font-size: 0.92rem;
              }
              .masthead-metrics {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
              }
              .metric {
                min-width: 132px;
                padding: 10px 12px;
                border-radius: 16px;
                background: var(--inset);
                border: 1px solid var(--border);
              }
              .metric strong {
                display: block;
                font-size: 1rem;
                color: var(--text-strong);
              }
              .metric span {
                color: var(--text-muted);
                font-size: 0.78rem;
              }
              .layout {
                display: grid;
                grid-template-columns: 324px minmax(0, 1fr) 420px;
                gap: 18px;
                align-items: start;
              }
              .panel {
                border: 1px solid var(--border);
                border-radius: var(--radius);
                background: var(--panel);
                box-shadow: var(--shadow);
              }
              .rail,
              .inspector {
                position: sticky;
                top: 92px;
              }
              .rail {
                padding: 18px;
                background: var(--rail);
              }
              .rail h2,
              .canvas h2,
              .inspector h2,
              .tables h2 {
                margin: 0;
                font-size: 0.96rem;
                color: var(--text-strong);
              }
              .filter-group {
                margin-top: 16px;
                display: grid;
                gap: 12px;
              }
              label {
                display: grid;
                gap: 6px;
                font-size: 0.82rem;
                color: var(--text-muted);
              }
              select {
                height: 44px;
                border-radius: 14px;
                border: 1px solid var(--border);
                background: var(--panel);
                color: var(--text-default);
                padding: 0 12px;
                transition: border-color 180ms ease, box-shadow 180ms ease;
              }
              select:focus-visible,
              button:focus-visible,
              .interactive:focus-visible {
                outline: none;
                border-color: var(--domain);
                box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
              }
              .canvas {
                display: grid;
                gap: 18px;
              }
              .visual {
                min-height: 320px;
                padding: 20px;
              }
              .visual-header {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: center;
                margin-bottom: 14px;
              }
              .visual-header p {
                margin: 6px 0 0;
                color: var(--text-muted);
                font-size: 0.84rem;
              }
              .badge-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              .badge {
                border-radius: 999px;
                padding: 6px 10px;
                border: 1px solid var(--border);
                background: var(--inset);
                font-size: 0.76rem;
                color: var(--text-default);
              }
              .topology-grid,
              .binding-grid,
              .flow-grid {
                display: grid;
                gap: 12px;
              }
              .topology-grid {
                grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
              }
              .binding-grid {
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
              }
              .flow-grid {
                grid-template-columns: repeat(5, minmax(0, 1fr));
              }
              .node,
              .binding-card,
              .flow-step {
                border-radius: 18px;
                border: 1px solid var(--border);
                background: var(--inset);
                padding: 16px;
                transition: transform 120ms ease, border-color 180ms ease, box-shadow 180ms ease;
              }
              .interactive {
                cursor: pointer;
              }
              .interactive:hover {
                transform: translateY(-1px);
              }
              .node[data-family="domain"],
              .flow-step[data-family="domain"] {
                box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.12);
              }
              .node[data-family="fhir"],
              .flow-step[data-family="fhir"] {
                box-shadow: inset 0 0 0 1px rgba(14, 165, 164, 0.14);
              }
              .binding-card[data-family="fhir"] {
                box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.14);
              }
              .node[data-selected="true"],
              .binding-card[data-selected="true"],
              .flow-step[data-selected="true"] {
                border-color: var(--domain);
                box-shadow: 0 12px 28px rgba(37, 99, 235, 0.16);
              }
              .node h3,
              .binding-card h3,
              .flow-step h3 {
                margin: 0 0 8px;
                font-size: 0.94rem;
                color: var(--text-strong);
              }
              .node dl,
              .binding-card dl {
                margin: 0;
                display: grid;
                gap: 6px;
              }
              .node dt,
              .binding-card dt {
                color: var(--text-muted);
                font-size: 0.74rem;
              }
              .node dd,
              .binding-card dd {
                margin: 0;
                font-size: 0.84rem;
              }
              .flow-step p {
                margin: 0;
                color: var(--text-muted);
                font-size: 0.82rem;
              }
              .inspector {
                padding: 18px;
              }
              .inspector pre {
                margin: 0;
                padding: 14px;
                border-radius: 16px;
                background: var(--inset);
                border: 1px solid var(--border);
                font-size: 0.76rem;
                line-height: 1.55;
                white-space: pre-wrap;
                color: var(--text-default);
              }
              .tables {
                margin-top: 18px;
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                gap: 18px;
              }
              .table-panel {
                padding: 18px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.83rem;
              }
              th,
              td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--border);
                vertical-align: top;
                text-align: left;
              }
              th {
                color: var(--text-muted);
                font-weight: 600;
              }
              tbody tr[data-selected="true"] {
                background: rgba(37, 99, 235, 0.08);
              }
              .row-select {
                width: 100%;
                text-align: left;
                border: 0;
                background: transparent;
                color: inherit;
                padding: 0;
                font: inherit;
                cursor: pointer;
              }
              code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                font-size: 0.78rem;
              }
              .state-pill {
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                padding: 4px 8px;
                font-size: 0.72rem;
                border: 1px solid var(--border);
                background: var(--panel);
              }
              .state-pill.domain { color: var(--domain); }
              .state-pill.fhir { color: var(--fhir); }
              .state-pill.standby { color: var(--warning); }
              @media (max-width: 1280px) {
                .layout {
                  grid-template-columns: 300px minmax(0, 1fr);
                }
                .inspector {
                  grid-column: 1 / -1;
                  position: static;
                }
                .tables {
                  grid-template-columns: 1fr;
                }
              }
              @media (max-width: 980px) {
                .page { padding: 12px; }
                .masthead {
                  position: static;
                  grid-template-columns: 1fr;
                }
                .masthead-metrics {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .layout {
                  grid-template-columns: 1fr;
                }
                .rail {
                  position: static;
                }
                .flow-grid {
                  grid-template-columns: 1fr;
                }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <header class="masthead panel">
                <div class="brand">
                  <div class="monogram" aria-hidden="true">DS</div>
                  <div class="brand-copy">
                    <h1>Vecells Data Storage Topology Atlas</h1>
                    <p>Transactional domain authority and derived FHIR representation truth remain separate, private, and contract-bound.</p>
                  </div>
                </div>
                <div class="masthead-metrics">
                  <div class="metric"><strong data-testid="metric-store-count">0</strong><span>Store realizations</span></div>
                  <div class="metric"><strong data-testid="metric-binding-count">0</strong><span>Binding rules</span></div>
                  <div class="metric"><strong data-testid="metric-domain-count">0</strong><span>Domain placements</span></div>
                  <div class="metric"><strong data-testid="metric-fhir-count">0</strong><span>FHIR placements</span></div>
                </div>
              </header>

              <div class="layout">
                <aside class="rail panel">
                  <h2>Filters</h2>
                  <div class="filter-group">
                    <label>Environment
                      <select data-testid="filter-environment" id="filter-environment"></select>
                    </label>
                    <label>Store family
                      <select data-testid="filter-store-family" id="filter-store-family"></select>
                    </label>
                    <label>Binding state
                      <select data-testid="filter-binding-state" id="filter-binding-state"></select>
                    </label>
                    <label>Access posture
                      <select data-testid="filter-access-posture" id="filter-access-posture"></select>
                    </label>
                  </div>
                </aside>

                <main class="canvas">
                  <section class="visual panel">
                    <div class="visual-header">
                      <div>
                        <h2>Truth-layer topology</h2>
                        <p>Each node is one environment and region realization of either the domain authority or the FHIR representation store.</p>
                      </div>
                      <div class="badge-row">
                        <span class="badge">No browser reachability</span>
                        <span class="badge">Private identity-ready TLS</span>
                        <span class="badge">Tenant tuple partitioning</span>
                      </div>
                    </div>
                    <div class="topology-grid" data-testid="topology-diagram" id="topology-diagram"></div>
                  </section>

                  <section class="visual panel">
                    <div class="visual-header">
                      <div>
                        <h2>Store-binding matrix</h2>
                        <p>These bindings freeze which layer owns lifecycle truth, who may write it, and where identifiers must stay separate.</p>
                      </div>
                    </div>
                    <div class="binding-grid" data-testid="binding-matrix" id="binding-matrix"></div>
                  </section>

                  <section class="visual panel">
                    <div class="visual-header">
                      <div>
                        <h2>Representation flow strip</h2>
                        <p>FHIR output remains one-way derived from canonical settlements and published mapping contracts.</p>
                      </div>
                    </div>
                    <div class="flow-grid" data-testid="representation-strip" id="representation-strip"></div>
                  </section>
                </main>

                <aside class="inspector panel" data-testid="inspector" id="inspector">
                  <h2>Inspector</h2>
                  <pre id="inspector-body">No selection.</pre>
                </aside>
              </div>

              <section class="tables">
                <div class="table-panel panel">
                  <div class="visual-header">
                    <div>
                      <h2>Store manifest table</h2>
                      <p>Tabular fallback for the topology diagram.</p>
                    </div>
                  </div>
                  <table data-testid="store-table">
                    <thead>
                      <tr>
                        <th>Store</th>
                        <th>Environment</th>
                        <th>Binding</th>
                        <th>Access</th>
                      </tr>
                    </thead>
                    <tbody id="store-table-body"></tbody>
                  </table>
                </div>

                <div class="table-panel panel">
                  <div class="visual-header">
                    <div>
                      <h2>Binding table</h2>
                      <p>Tabular fallback for the separation matrix.</p>
                    </div>
                  </div>
                  <table data-testid="binding-table">
                    <thead>
                      <tr>
                        <th>Binding</th>
                        <th>Family</th>
                        <th>Focus</th>
                        <th>Access</th>
                      </tr>
                    </thead>
                    <tbody id="binding-table-body"></tbody>
                  </table>
                </div>
              </section>
            </div>

            <script id="atlas-data" type="application/json">__ATLAS_DATA__</script>
            <script>
              const DATA = JSON.parse(document.getElementById("atlas-data").textContent);
              const state = {
                environment: "local",
                storeFamily: "all",
                bindingState: "all",
                accessPosture: "all",
                selectedStoreId: null,
                selectedBindingId: null,
              };

              const filterEnvironment = document.getElementById("filter-environment");
              const filterStoreFamily = document.getElementById("filter-store-family");
              const filterBindingState = document.getElementById("filter-binding-state");
              const filterAccessPosture = document.getElementById("filter-access-posture");
              const topologyDiagram = document.getElementById("topology-diagram");
              const bindingMatrix = document.getElementById("binding-matrix");
              const representationStrip = document.getElementById("representation-strip");
              const storeTableBody = document.getElementById("store-table-body");
              const bindingTableBody = document.getElementById("binding-table-body");
              const inspector = document.getElementById("inspector");
              const inspectorBody = document.getElementById("inspector-body");

              document.body.dataset.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "true"
                : "false";

              function escapeHtml(value) {
                return String(value)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#39;");
              }

              function setMetric(testId, value) {
                document.querySelector(`[data-testid="${testId}"]`).textContent = String(value);
              }

              function populateSelect(select, values) {
                select.innerHTML = values
                  .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
                  .join("");
              }

              function filteredStores() {
                return DATA.stores.filter((row) => {
                  if (state.environment !== "all" && row.environment_ring !== state.environment) return false;
                  if (state.storeFamily !== "all" && row.store_family !== state.storeFamily) return false;
                  if (state.bindingState !== "all" && row.binding_state !== state.bindingState) return false;
                  if (state.accessPosture !== "all" && row.access_posture !== state.accessPosture) return false;
                  return true;
                });
              }

              function filteredBindings() {
                return DATA.bindings.filter((row) => {
                  if (state.storeFamily !== "all" && row.store_family !== state.storeFamily) return false;
                  if (state.accessPosture !== "all" && row.access_posture !== state.accessPosture) return false;
                  return true;
                });
              }

              function currentSelectionFamily() {
                const selectedStore = DATA.stores.find((row) => row.store_realization_id === state.selectedStoreId);
                if (selectedStore) return selectedStore.store_family;
                const selectedBinding = DATA.bindings.find((row) => row.binding_ref === state.selectedBindingId);
                return selectedBinding ? selectedBinding.store_family : "all";
              }

              function ensureSelection(stores, bindings) {
                const storeVisible = stores.some((row) => row.store_realization_id === state.selectedStoreId);
                const bindingVisible = bindings.some((row) => row.binding_ref === state.selectedBindingId);
                if (!storeVisible) state.selectedStoreId = stores[0]?.store_realization_id ?? null;
                if (!bindingVisible) state.selectedBindingId = bindings[0]?.binding_ref ?? null;
              }

              function storeInspectorText(store) {
                const allowedPolicyDetails = store.allowed_policy_refs
                  .map((policyRef) => DATA.policy_directory[policyRef])
                  .filter(Boolean);
                return [
                  `Store: ${store.display_name}`,
                  `Store family: ${store.store_family}`,
                  `Binding state: ${store.binding_state}`,
                  `Access posture: ${store.access_posture}`,
                  `Environment: ${store.environment_label}`,
                  `Region: ${store.region_ref} (${store.uk_region_role})`,
                  `Endpoint: ${store.endpoint_ref}`,
                  `Service identity: ${store.service_identity_ref}`,
                  `Network: ${store.network_ref}`,
                  `Subnet: ${store.subnet_cidr}`,
                  `Network policy: ${store.network_policy_ref}`,
                  `Bootstrap SQL: ${store.bootstrap_sql_refs.join(", ")}`,
                  `Allowed policy refs: ${store.allowed_policy_refs.join(", ")}`,
                  `Allowed policy identities: ${allowedPolicyDetails.map((row) => row.service_identity_ref + "(" + row.access_mode + ")").join(", ") || "none"}`,
                  `Tenant isolation: ${store.tenant_isolation_mode}`,
                  `Continuity posture: ${store.continuity_posture}`,
                  `Blocked identities: ${store.blocked_service_identity_refs.join(", ")}`,
                ].join("\\n");
              }

              function bindingInspectorText(binding) {
                return [
                  `Binding: ${binding.binding_ref}`,
                  `Store family: ${binding.store_family}`,
                  `Focus area: ${binding.focus_area}`,
                  `Binding state: ${binding.binding_state}`,
                  `Access posture: ${binding.access_posture}`,
                  `Domain rule: ${binding.domain_truth_rule}`,
                  `FHIR rule: ${binding.fhir_truth_rule}`,
                  `Identifier namespace rule: ${binding.identifier_namespace_rule}`,
                  `Allowed policy refs: ${binding.allowed_writer_policy_refs || "none"}`,
                  `Blocked writers: ${binding.blocked_writer_refs}`,
                ].join("\\n");
              }

              function moveSelection(kind, direction) {
                if (kind === "store") {
                  const rows = Array.from(storeTableBody.querySelectorAll("tr"));
                  const ids = rows.map((row) => row.dataset.storeId);
                  const currentIndex = Math.max(ids.indexOf(state.selectedStoreId), 0);
                  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), ids.length - 1);
                  state.selectedStoreId = ids[nextIndex] ?? state.selectedStoreId;
                } else {
                  const rows = Array.from(bindingTableBody.querySelectorAll("tr"));
                  const ids = rows.map((row) => row.dataset.bindingId);
                  const currentIndex = Math.max(ids.indexOf(state.selectedBindingId), 0);
                  const nextIndex = Math.min(Math.max(currentIndex + direction, 0), ids.length - 1);
                  state.selectedBindingId = ids[nextIndex] ?? state.selectedBindingId;
                }
                render();
              }

              function render() {
                const stores = filteredStores();
                const bindings = filteredBindings();
                ensureSelection(stores, bindings);
                const selectedFamily = currentSelectionFamily();

                setMetric("metric-store-count", stores.length);
                setMetric("metric-binding-count", bindings.length);
                setMetric(
                  "metric-domain-count",
                  stores.filter((row) => row.store_family === "domain").length,
                );
                setMetric(
                  "metric-fhir-count",
                  stores.filter((row) => row.store_family === "fhir").length,
                );

                topologyDiagram.dataset.selectedFamily = selectedFamily;
                bindingMatrix.dataset.selectedBinding = state.selectedBindingId ?? "";
                representationStrip.dataset.selectedBinding = state.selectedBindingId ?? "";
                representationStrip.dataset.selectedFamily = selectedFamily;
                inspector.dataset.selectedStore = state.selectedStoreId ?? "";
                inspector.dataset.selectedBinding = state.selectedBindingId ?? "";

                topologyDiagram.innerHTML = stores
                  .map((row) => {
                    const selected = row.store_realization_id === state.selectedStoreId ? "true" : "false";
                    return `
                      <article
                        class="node interactive"
                        tabindex="0"
                        data-testid="topology-node-${escapeHtml(row.store_realization_id)}"
                        data-selected="${selected}"
                        data-family="${escapeHtml(row.store_family)}"
                      >
                        <h3>${escapeHtml(row.display_name)}</h3>
                        <div class="badge-row">
                          <span class="state-pill ${row.store_family === "domain" ? "domain" : "fhir"}">${escapeHtml(row.binding_state)}</span>
                        </div>
                        <dl>
                          <div><dt>Access</dt><dd>${escapeHtml(row.access_posture)}</dd></div>
                          <div><dt>Identity</dt><dd><code>${escapeHtml(row.service_identity_ref)}</code></dd></div>
                          <div><dt>Subnet</dt><dd><code>${escapeHtml(row.subnet_cidr)}</code></dd></div>
                        </dl>
                      </article>
                    `;
                  })
                  .join("");

                bindingMatrix.innerHTML = bindings
                  .map((row) => {
                    const selected = row.binding_ref === state.selectedBindingId ? "true" : "false";
                    return `
                      <article
                        class="binding-card interactive"
                        tabindex="0"
                        data-testid="binding-card-${escapeHtml(row.binding_ref)}"
                        data-selected="${selected}"
                        data-family="${escapeHtml(row.store_family)}"
                      >
                        <h3>${escapeHtml(row.focus_area.replaceAll("_", " "))}</h3>
                        <dl>
                          <div><dt>Binding</dt><dd><code>${escapeHtml(row.binding_ref)}</code></dd></div>
                          <div><dt>Access</dt><dd>${escapeHtml(row.access_posture)}</dd></div>
                          <div><dt>State</dt><dd>${escapeHtml(row.binding_state)}</dd></div>
                        </dl>
                      </article>
                    `;
                  })
                  .join("");

                representationStrip.innerHTML = DATA.representation_flow
                  .map((step) => {
                    const selected = step.store_family === selectedFamily ? "true" : "false";
                    return `
                      <article
                        class="flow-step"
                        data-testid="representation-step-${escapeHtml(step.flow_step_ref)}"
                        data-selected="${selected}"
                        data-family="${escapeHtml(step.store_family)}"
                      >
                        <h3>${escapeHtml(step.label)}</h3>
                        <p>${step.store_family === "domain" ? "Vecells-first authority" : "Derived interoperability layer"}</p>
                      </article>
                    `;
                  })
                  .join("");

                storeTableBody.innerHTML = stores
                  .map((row) => {
                    const selected = row.store_realization_id === state.selectedStoreId ? "true" : "false";
                    return `
                      <tr
                        data-testid="store-row-${escapeHtml(row.store_realization_id)}"
                        data-store-id="${escapeHtml(row.store_realization_id)}"
                        data-selected="${selected}"
                      >
                        <td>
                          <button class="row-select interactive" type="button">${escapeHtml(row.display_name)}</button>
                        </td>
                        <td>${escapeHtml(row.environment_label)}<br /><code>${escapeHtml(row.region_ref)}</code></td>
                        <td>${escapeHtml(row.binding_state)}</td>
                        <td>${escapeHtml(row.access_posture)}</td>
                      </tr>
                    `;
                  })
                  .join("");

                bindingTableBody.innerHTML = bindings
                  .map((row) => {
                    const selected = row.binding_ref === state.selectedBindingId ? "true" : "false";
                    return `
                      <tr
                        data-testid="binding-row-${escapeHtml(row.binding_ref)}"
                        data-binding-id="${escapeHtml(row.binding_ref)}"
                        data-selected="${selected}"
                      >
                        <td><button class="row-select interactive" type="button">${escapeHtml(row.binding_ref)}</button></td>
                        <td>${escapeHtml(row.store_family)}</td>
                        <td>${escapeHtml(row.focus_area.replaceAll("_", " "))}</td>
                        <td>${escapeHtml(row.access_posture)}</td>
                      </tr>
                    `;
                  })
                  .join("");

                const selectedStore = stores.find((row) => row.store_realization_id === state.selectedStoreId);
                const selectedBinding = bindings.find((row) => row.binding_ref === state.selectedBindingId);
                inspectorBody.textContent = selectedStore
                  ? storeInspectorText(selectedStore)
                  : selectedBinding
                    ? bindingInspectorText(selectedBinding)
                    : "No visible selection.";

                topologyDiagram.querySelectorAll(".node").forEach((node) => {
                  node.addEventListener("click", () => {
                    state.selectedStoreId = node.dataset.testid?.replace("topology-node-", "") || node.getAttribute("data-testid").replace("topology-node-", "");
                    render();
                  });
                  node.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      state.selectedStoreId = node.getAttribute("data-testid").replace("topology-node-", "");
                      render();
                    }
                  });
                });

                storeTableBody.querySelectorAll("tr").forEach((row) => {
                  row.addEventListener("click", () => {
                    state.selectedStoreId = row.dataset.storeId;
                    render();
                  });
                  row.addEventListener("keydown", (event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      moveSelection("store", 1);
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      moveSelection("store", -1);
                    }
                  });
                  row.tabIndex = 0;
                });

                bindingMatrix.querySelectorAll(".binding-card").forEach((card) => {
                  card.addEventListener("click", () => {
                    state.selectedBindingId = card.getAttribute("data-testid").replace("binding-card-", "");
                    render();
                  });
                  card.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      state.selectedBindingId = card.getAttribute("data-testid").replace("binding-card-", "");
                      render();
                    }
                  });
                });

                bindingTableBody.querySelectorAll("tr").forEach((row) => {
                  row.addEventListener("click", () => {
                    state.selectedBindingId = row.dataset.bindingId;
                    render();
                  });
                  row.addEventListener("keydown", (event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      moveSelection("binding", 1);
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      moveSelection("binding", -1);
                    }
                  });
                  row.tabIndex = 0;
                });
              }

              populateSelect(filterEnvironment, DATA.filters.environments);
              populateSelect(filterStoreFamily, DATA.filters.storeFamilies);
              populateSelect(filterBindingState, DATA.filters.bindingStates);
              populateSelect(filterAccessPosture, DATA.filters.accessPostures);

              filterEnvironment.value = state.environment;
              filterStoreFamily.value = state.storeFamily;
              filterBindingState.value = state.bindingState;
              filterAccessPosture.value = state.accessPosture;

              [filterEnvironment, filterStoreFamily, filterBindingState, filterAccessPosture].forEach((select) => {
                select.addEventListener("change", () => {
                  state.environment = filterEnvironment.value;
                  state.storeFamily = filterStoreFamily.value;
                  state.bindingState = filterBindingState.value;
                  state.accessPosture = filterAccessPosture.value;
                  render();
                });
              });

              render();
            </script>
          </body>
        </html>
        """
    ).strip()
    return template.replace("__ATLAS_DATA__", payload)


def build_playwright_spec() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import http from "node:http";
        import path from "node:path";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..");
        const HTML_PATH = path.join(ROOT, "docs", "architecture", "85_data_storage_topology_atlas.html");
        const DOMAIN_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "domain_store_manifest.json");
        const FHIR_MANIFEST_PATH = path.join(ROOT, "data", "analysis", "fhir_store_manifest.json");
        const MATRIX_PATH = path.join(ROOT, "data", "analysis", "data_plane_separation_matrix.csv");

        export const dataStorageTopologyAtlasCoverage = [
          "filter behavior and synchronized selection",
          "keyboard navigation and focus management",
          "reduced-motion handling",
          "responsive layout at desktop and tablet widths",
          "accessibility smoke checks and landmark verification",
        ];

        function assertCondition(condition, message) {
          if (!condition) {
            throw new Error(message);
          }
        }

        function parseCsv(text) {
          const rows = [];
          let row = [];
          let cell = "";
          let inQuotes = false;
          for (let index = 0; index < text.length; index += 1) {
            const char = text[index];
            const next = text[index + 1];
            if (char === '"' && inQuotes && next === '"') {
              cell += '"';
              index += 1;
              continue;
            }
            if (char === '"') {
              inQuotes = !inQuotes;
              continue;
            }
            if (char === "," && !inQuotes) {
              row.push(cell);
              cell = "";
              continue;
            }
            if ((char === "\\n" || char === "\\r") && !inQuotes) {
              if (char === "\\r" && next === "\\n") {
                index += 1;
              }
              row.push(cell);
              if (row.some((value) => value.length > 0)) {
                rows.push(row);
              }
              row = [];
              cell = "";
              continue;
            }
            cell += char;
          }
          if (cell.length || row.length) {
            row.push(cell);
            rows.push(row);
          }
          const [headers, ...body] = rows;
          return body.map((values) =>
            Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
          );
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
            const server = http.createServer((request, response) => {
              const rawUrl = request.url ?? "/";
              const urlPath =
                rawUrl === "/"
                  ? "/docs/architecture/85_data_storage_topology_atlas.html"
                  : rawUrl.split("?")[0];
              const filePath = path.join(ROOT, decodeURIComponent(urlPath).replace(/^\\/+/, ""));

              if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
                response.writeHead(404);
                response.end("Not found");
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
              response.writeHead(200, { "Content-Type": contentType });
              response.end(body);
            });
            server.once("error", reject);
            server.listen(4385, "127.0.0.1", () => resolve(server));
          });
        }

        async function run() {
          assertCondition(fs.existsSync(HTML_PATH), `Missing data storage atlas HTML: ${HTML_PATH}`);
          const domainManifest = JSON.parse(fs.readFileSync(DOMAIN_MANIFEST_PATH, "utf8"));
          const fhirManifest = JSON.parse(fs.readFileSync(FHIR_MANIFEST_PATH, "utf8"));
          const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
          assertCondition(domainManifest.summary.store_realization_count === 7, "Domain store count drifted.");
          assertCondition(fhirManifest.summary.store_realization_count === 7, "FHIR store count drifted.");
          assertCondition(matrix.length === 10, "Separation matrix row count drifted.");

          const { chromium } = await importPlaywright();
          const server = await startStaticServer();
          const browser = await chromium.launch({ headless: true });
          const page = await browser.newPage({ viewport: { width: 1480, height: 1100 } });
          const url =
            process.env.DATA_STORAGE_TOPOLOGY_ATLAS_URL ??
            "http://127.0.0.1:4385/docs/architecture/85_data_storage_topology_atlas.html";

          try {
            await page.goto(url, { waitUntil: "networkidle" });
            await page.locator("[data-testid='topology-diagram']").waitFor();
            await page.locator("[data-testid='binding-matrix']").waitFor();
            await page.locator("[data-testid='representation-strip']").waitFor();
            await page.locator("[data-testid='store-table']").waitFor();
            await page.locator("[data-testid='binding-table']").waitFor();
            await page.locator("[data-testid='inspector']").waitFor();

            const initialStoreCount = await page.locator("[data-testid^='store-row-']").count();
            const initialTopologyCount = await page.locator("[data-testid^='topology-node-']").count();
            assertCondition(initialStoreCount === 2, `Expected 2 local store rows, found ${initialStoreCount}`);
            assertCondition(initialTopologyCount === 2, `Expected 2 local topology nodes, found ${initialTopologyCount}`);

            await page.locator("[data-testid='filter-environment']").selectOption("production");
            const productionStoreCount = await page.locator("[data-testid^='store-row-']").count();
            assertCondition(productionStoreCount === 4, `Expected 4 production store rows, found ${productionStoreCount}`);

            await page.locator("[data-testid='filter-store-family']").selectOption("domain");
            const domainStoreCount = await page.locator("[data-testid^='store-row-']").count();
            assertCondition(domainStoreCount === 2, `Expected 2 production domain rows, found ${domainStoreCount}`);

            await page.locator("[data-testid='filter-binding-state']").selectOption("warm_standby");
            const standbyDomainCount = await page.locator("[data-testid^='store-row-']").count();
            assertCondition(standbyDomainCount === 1, `Expected 1 standby domain row, found ${standbyDomainCount}`);

            await page.locator("[data-testid='filter-binding-state']").selectOption("all");
            await page.locator("[data-testid='filter-access-posture']").selectOption("command_write");
            const commandWritableCount = await page.locator("[data-testid^='store-row-']").count();
            assertCondition(commandWritableCount === 1, `Expected 1 command-write row, found ${commandWritableCount}`);

            await page.locator("[data-testid='store-row-domain-production-primary'] .row-select").click();
            const inspectorText = await page.locator("[data-testid='inspector']").innerText();
            assertCondition(inspectorText.includes("sid_command_api"), "Inspector lost command identity detail.");
            assertCondition(
              inspectorText.includes("001_domain_transaction_bootstrap.sql"),
              "Inspector lost bootstrap SQL reference.",
            );
            const selectedTopology = await page
              .locator("[data-testid='topology-node-domain-production-primary']")
              .getAttribute("data-selected");
            assertCondition(selectedTopology === "true", "Store selection did not synchronize topology state.");

            await page.locator("[data-testid='filter-access-posture']").selectOption("all");
            await page.locator("[data-testid='filter-store-family']").selectOption("fhir");
            await page.locator("[data-testid='filter-binding-state']").selectOption("derived_materialization");
            const derivedFhirCount = await page.locator("[data-testid^='store-row-']").count();
            assertCondition(derivedFhirCount === 1, `Expected 1 derived FHIR row, found ${derivedFhirCount}`);

            await page.locator("[data-testid='binding-row-sep_fhir_mapping_contract_gate'] .row-select").click();
            const stripSelected = await page
              .locator("[data-testid='representation-strip']")
              .getAttribute("data-selected-binding");
            const topologyFamily = await page
              .locator("[data-testid='topology-diagram']")
              .getAttribute("data-selected-family");
            assertCondition(
              stripSelected === "sep_fhir_mapping_contract_gate",
              "Binding selection did not synchronize the representation strip.",
            );
            assertCondition(
              topologyFamily === "fhir",
              "Binding selection did not synchronize topology family highlighting.",
            );

            await page.locator("[data-testid='filter-store-family']").selectOption("domain");
            await page.locator("[data-testid='filter-binding-state']").selectOption("all");
            await page.locator("[data-testid='filter-access-posture']").selectOption("all");
            const firstStoreRow = page.locator("[data-testid='store-row-domain-production-primary']");
            await firstStoreRow.focus();
            await page.keyboard.press("ArrowDown");
            const keyboardSelected = await page
              .locator("[data-testid='store-row-domain-production-secondary']")
              .getAttribute("data-selected");
            assertCondition(
              keyboardSelected === "true",
              "Arrow navigation did not move selection to the next store row.",
            );

            await page.setViewportSize({ width: 940, height: 980 });
            assertCondition(await page.locator("[data-testid='inspector']").isVisible(), "Inspector disappeared at tablet width.");

            const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
            try {
              await motionPage.emulateMedia({ reducedMotion: "reduce" });
              await motionPage.goto(url, { waitUntil: "networkidle" });
              const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
              assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
            } finally {
              await motionPage.close();
            }

            const landmarkCount = await page.locator("header, main, aside, section").count();
            assertCondition(landmarkCount >= 5, `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`);
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
        """
    ).strip()


def build_readme() -> str:
    return dedent(
        """
        # Data Storage Foundation

        This directory contains the provider-neutral Phase 0 storage baseline for `par_085`.

        - `terraform/` publishes the transactional domain store and FHIR representation store realizations.
        - `bootstrap/` contains deterministic bootstrap SQL for the two store classes.
        - `local/` mirrors the same split for developer and CI use, including compose and dry-run bootstrap planning.
        - `tests/` contains smoke checks that fail when the truth-layer split, browser block, or bootstrap plan drifts.
        """
    ).strip()


def build_terraform_main() -> str:
    return dedent(
        """
        terraform {
          required_version = ">= 1.6.0"
        }

        locals {
          runtime_topology = jsondecode(file("${path.module}/../../data/analysis/runtime_topology_manifest.json"))
          domain_manifest  = jsondecode(file("${path.module}/../../data/analysis/domain_store_manifest.json"))
          fhir_manifest    = jsondecode(file("${path.module}/../../data/analysis/fhir_store_manifest.json"))
          domain_env       = one([
            for item in local.domain_manifest.environment_realizations : item
            if item.environment_ring == var.environment
          ])
          fhir_env = one([
            for item in local.fhir_manifest.environment_realizations : item
            if item.environment_ring == var.environment
          ])
        }

        module "domain_transaction_store" {
          source          = "./modules/domain_transaction_store"
          environment     = var.environment
          store_descriptor = local.domain_manifest.store_descriptor
          access_policies = local.domain_manifest.access_policies
          region_placements = local.domain_env.region_placements
        }

        module "fhir_representation_store" {
          source          = "./modules/fhir_representation_store"
          environment     = var.environment
          store_descriptor = local.fhir_manifest.store_descriptor
          access_policies = local.fhir_manifest.access_policies
          region_placements = local.fhir_env.region_placements
        }
        """
    ).strip()


def build_terraform_variables() -> str:
    return dedent(
        """
        variable "environment" {
          type        = string
          description = "Environment ring to realize."
        }
        """
    ).strip()


def build_terraform_outputs() -> str:
    return dedent(
        """
        output "domain_store_realizations" {
          value = module.domain_transaction_store.store_realizations
        }

        output "fhir_store_realizations" {
          value = module.fhir_representation_store.store_realizations
        }

        output "domain_store_access" {
          value = module.domain_transaction_store.access_policies
        }

        output "fhir_store_access" {
          value = module.fhir_representation_store.access_policies
        }
        """
    ).strip()


def build_domain_module_main() -> str:
    return dedent(
        """
        locals {
          realizations = {
            for placement in var.region_placements :
            placement.store_realization_id => {
              endpoint_ref      = placement.endpoint_ref
              network_ref       = placement.network_ref
              subnet_cidr       = placement.subnet_cidr
              binding_state     = placement.binding_state
              access_posture    = placement.access_posture
              bootstrap_sql_ref = one(placement.bootstrap_sql_refs)
            }
          }
        }
        """
    ).strip()


def build_domain_module_variables() -> str:
    return dedent(
        """
        variable "environment" {
          type = string
        }

        variable "store_descriptor" {
          type = any
        }

        variable "access_policies" {
          type = any
        }

        variable "region_placements" {
          type = any
        }
        """
    ).strip()


def build_domain_module_outputs() -> str:
    return dedent(
        """
        output "store_realizations" {
          value = local.realizations
        }

        output "access_policies" {
          value = var.access_policies
        }
        """
    ).strip()


def build_fhir_module_main() -> str:
    return dedent(
        """
        locals {
          realizations = {
            for placement in var.region_placements :
            placement.store_realization_id => {
              endpoint_ref      = placement.endpoint_ref
              network_ref       = placement.network_ref
              subnet_cidr       = placement.subnet_cidr
              binding_state     = placement.binding_state
              access_posture    = placement.access_posture
              bootstrap_sql_ref = one(placement.bootstrap_sql_refs)
            }
          }
        }
        """
    ).strip()


def build_fhir_module_variables() -> str:
    return build_domain_module_variables()


def build_fhir_module_outputs() -> str:
    return build_domain_module_outputs()


def build_environment_tfvars(environment_ring: str) -> dict[str, str]:
    return {"environment": environment_ring}


def build_domain_bootstrap_sql() -> str:
    return dedent(
        """
        BEGIN;

        CREATE SCHEMA IF NOT EXISTS vecells_control;
        CREATE SCHEMA IF NOT EXISTS vecells_request;
        CREATE SCHEMA IF NOT EXISTS vecells_identity;
        CREATE SCHEMA IF NOT EXISTS vecells_evidence;
        CREATE SCHEMA IF NOT EXISTS vecells_reservation;
        CREATE SCHEMA IF NOT EXISTS vecells_release;

        CREATE TABLE IF NOT EXISTS vecells_control.schema_migration_history (
          migration_id text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now(),
          applied_by text NOT NULL,
          checksum text NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vecells_control.tenant_slice_registry (
          tenant_tuple_ref text PRIMARY KEY,
          data_partition_ref text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_request.requests (
          request_id text PRIMARY KEY,
          tenant_tuple_ref text NOT NULL,
          workflow_state text NOT NULL,
          current_lineage_ref text NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_request.request_lineages (
          request_lineage_ref text PRIMARY KEY,
          request_id text NOT NULL,
          parent_request_lineage_ref text,
          continuity_mode text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_identity.identity_bindings (
          identity_binding_ref text PRIMARY KEY,
          request_lineage_ref text NOT NULL,
          subject_binding_mode text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_evidence.evidence_snapshots (
          evidence_snapshot_ref text PRIMARY KEY,
          request_lineage_ref text NOT NULL,
          parity_state text NOT NULL,
          captured_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_reservation.reservation_fences (
          reservation_fence_ref text PRIMARY KEY,
          governing_object_ref text NOT NULL,
          fence_state text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_release.release_approval_freezes (
          release_approval_freeze_ref text PRIMARY KEY,
          environment_ring text NOT NULL,
          freeze_state text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        );

        COMMIT;
        """
    ).strip()


def build_fhir_bootstrap_sql() -> str:
    return dedent(
        """
        BEGIN;

        CREATE SCHEMA IF NOT EXISTS vecells_fhir;

        CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_representation_contracts (
          fhir_representation_contract_id text PRIMARY KEY,
          governing_aggregate_type text NOT NULL,
          representation_purpose text NOT NULL,
          contract_version_ref text NOT NULL,
          published_at timestamptz NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_representation_sets (
          fhir_representation_set_ref text PRIMARY KEY,
          fhir_representation_contract_id text NOT NULL,
          governing_aggregate_ref text NOT NULL,
          aggregate_version integer NOT NULL,
          materialized_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_resource_records (
          fhir_resource_record_ref text PRIMARY KEY,
          fhir_representation_set_ref text NOT NULL,
          resource_type text NOT NULL,
          logical_id text NOT NULL,
          version_id text NOT NULL,
          materialized_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS vecells_fhir.fhir_exchange_bundles (
          fhir_exchange_bundle_ref text PRIMARY KEY,
          fhir_representation_set_ref text NOT NULL,
          bundle_purpose text NOT NULL,
          export_state text NOT NULL,
          staged_at timestamptz NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_fhir_resource_records_logical
          ON vecells_fhir.fhir_resource_records (resource_type, logical_id, version_id);

        COMMIT;
        """
    ).strip()


def build_local_compose() -> str:
    return dedent(
        """
        services:
          domain-store:
            image: postgres:16-alpine
            container_name: vecells-domain-store-local
            environment:
              POSTGRES_DB: vecells_domain
              POSTGRES_USER: vecells
              POSTGRES_PASSWORD: vecells
            ports:
              - "6543:5432"
            networks:
              - stateful_data
            volumes:
              - domain_store:/var/lib/postgresql/data

          fhir-store:
            image: postgres:16-alpine
            container_name: vecells-fhir-store-local
            environment:
              POSTGRES_DB: vecells_fhir
              POSTGRES_USER: vecells
              POSTGRES_PASSWORD: vecells
            ports:
              - "6544:5432"
            networks:
              - stateful_data
            volumes:
              - fhir_store:/var/lib/postgresql/data

        volumes:
          domain_store: {}
          fhir_store: {}

        networks:
          stateful_data:
            internal: true
        """
    ).strip()


def build_local_policy() -> dict[str, Any]:
    return {
        "task_id": TASK_ID,
        "visual_mode": VISUAL_MODE,
        "browser_addressable_services": [],
        "blocked_browser_targets": [
            DOMAIN_DATA_STORE_REF,
            FHIR_DATA_STORE_REF,
            "wf_data_stateful_plane",
        ],
        "allowed_service_identity_access": {
            DOMAIN_DATA_STORE_REF: [
                "sid_command_api",
                "sid_assurance_control",
            ],
            FHIR_DATA_STORE_REF: [
                "sid_command_api",
                "sid_integration_dispatch",
                "sid_assurance_control",
            ],
        },
        "blocked_service_identity_access": {
            DOMAIN_DATA_STORE_REF: [
                "sid_published_gateway",
                "sid_public_edge_proxy",
                "sid_projection_worker",
            ],
            FHIR_DATA_STORE_REF: [
                "sid_published_gateway",
                "sid_public_edge_proxy",
                "sid_projection_worker",
            ],
        },
    }


def build_local_bootstrap_script() -> str:
    return dedent(
        """
        import fs from "node:fs";
        import path from "node:path";
        import { spawnSync } from "node:child_process";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");

        const domainManifest = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "domain_store_manifest.json"), "utf8"),
        );
        const fhirManifest = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "fhir_store_manifest.json"), "utf8"),
        );

        const plan = {
          taskId: "par_085",
          mode: "Data_Storage_Topology_Atlas",
          stores: [
            {
              storeRef: domainManifest.store_descriptor.store_ref,
              bootstrapSqlRefs: domainManifest.store_descriptor.bootstrap_sql_refs,
              defaultDsnEnv: "VECELLS_DOMAIN_STORE_DSN",
            },
            {
              storeRef: fhirManifest.store_descriptor.store_ref,
              bootstrapSqlRefs: fhirManifest.store_descriptor.bootstrap_sql_refs,
              defaultDsnEnv: "VECELLS_FHIR_STORE_DSN",
            },
          ],
        };

        function resolveSql(ref) {
          return path.join(ROOT, ref);
        }

        function emitPlan() {
          process.stdout.write(JSON.stringify(plan, null, 2));
          process.stdout.write("\\n");
        }

        if (process.argv.includes("--emit-plan")) {
          const index = process.argv.indexOf("--emit-plan");
          const outputPath = process.argv[index + 1];
          if (!outputPath) {
            throw new Error("Missing path after --emit-plan");
          }
          fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2) + "\\n", "utf8");
        }

        if (process.argv.includes("--dry-run") || !process.argv.includes("--apply")) {
          emitPlan();
          process.exit(0);
        }

        for (const store of plan.stores) {
          const dsn = process.env[store.defaultDsnEnv];
          if (!dsn) {
            throw new Error(`Missing ${store.defaultDsnEnv} for --apply`);
          }
          for (const sqlRef of store.bootstrapSqlRefs) {
            const sqlPath = resolveSql(sqlRef);
            const result = spawnSync("psql", [dsn, "-f", sqlPath], { stdio: "inherit" });
            if (result.status !== 0) {
              process.exit(result.status ?? 1);
            }
          }
        }
        """
    ).strip()


def build_smoke_test() -> str:
    return dedent(
        """
        import assert from "node:assert/strict";
        import fs from "node:fs";
        import path from "node:path";
        import test from "node:test";
        import { spawnSync } from "node:child_process";
        import { fileURLToPath } from "node:url";

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const ROOT = path.resolve(__dirname, "..", "..", "..");

        const runtimeTopology = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
        );
        const domainManifest = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "domain_store_manifest.json"), "utf8"),
        );
        const fhirManifest = JSON.parse(
          fs.readFileSync(path.join(ROOT, "data", "analysis", "fhir_store_manifest.json"), "utf8"),
        );
        const localPolicy = JSON.parse(
          fs.readFileSync(path.join(ROOT, "infra", "data-storage", "local", "connectivity-policy.json"), "utf8"),
        );

        test("runtime topology binds the two store manifests", () => {
          assert.equal(runtimeTopology.domain_store_manifest_ref, "data/analysis/domain_store_manifest.json");
          assert.equal(runtimeTopology.fhir_store_manifest_ref, "data/analysis/fhir_store_manifest.json");
          const dataStoreRefs = runtimeTopology.data_store_catalog.map((row) => row.data_store_ref);
          assert.equal(dataStoreRefs.includes("ds_transactional_domain_authority"), true);
          assert.equal(dataStoreRefs.includes("ds_relational_fhir"), true);
        });

        test("domain and FHIR manifests keep the same regional footprint but separate authority modes", () => {
          assert.equal(domainManifest.summary.store_realization_count, 7);
          assert.equal(fhirManifest.summary.store_realization_count, 7);
          const domainStates = new Set(domainManifest.store_realizations.map((row) => row.binding_state));
          const fhirStates = new Set(fhirManifest.store_realizations.map((row) => row.binding_state));
          assert.equal(domainStates.has("writable_authority"), true);
          assert.equal(fhirStates.has("derived_materialization"), true);
        });

        test("local policy keeps browsers out of both stores", () => {
          assert.deepEqual(localPolicy.browser_addressable_services, []);
          assert.equal(localPolicy.blocked_browser_targets.includes("ds_transactional_domain_authority"), true);
          assert.equal(localPolicy.blocked_browser_targets.includes("ds_relational_fhir"), true);
        });

        test("bootstrap SQL keeps domain and FHIR tables separate", () => {
          const domainSql = fs.readFileSync(
            path.join(ROOT, "infra", "data-storage", "bootstrap", "001_domain_transaction_bootstrap.sql"),
            "utf8",
          );
          const fhirSql = fs.readFileSync(
            path.join(ROOT, "infra", "data-storage", "bootstrap", "001_fhir_representation_bootstrap.sql"),
            "utf8",
          );
          assert.equal(domainSql.includes("vecells_request.requests"), true);
          assert.equal(domainSql.includes("vecells_identity.identity_bindings"), true);
          assert.equal(fhirSql.includes("vecells_fhir.fhir_representation_sets"), true);
          assert.equal(fhirSql.includes("vecells_fhir.fhir_exchange_bundles"), true);
        });

        test("local bootstrap script emits a deterministic dry-run plan", () => {
          const scriptPath = path.join(
            ROOT,
            "infra",
            "data-storage",
            "local",
            "bootstrap-domain-fhir-storage.mjs",
          );
          const result = spawnSync(process.execPath, [scriptPath, "--dry-run"], {
            encoding: "utf8",
          });
          assert.equal(result.status, 0, result.stderr);
          const plan = JSON.parse(result.stdout);
          assert.equal(plan.stores.length, 2);
          assert.equal(plan.stores[0].defaultDsnEnv, "VECELLS_DOMAIN_STORE_DSN");
          assert.equal(plan.stores[1].defaultDsnEnv, "VECELLS_FHIR_STORE_DSN");
        });
        """
    ).strip()


def patch_runtime_topology_manifest() -> None:
    topology = load_json(RUNTIME_TOPOLOGY_PATH)
    catalog = []
    domain_entry = {
        "data_store_ref": DOMAIN_DATA_STORE_REF,
        "display_name": "Transactional domain authority store",
        "store_class": "transactional_domain",
        "family_ref": "wf_data_stateful_plane",
        "source_refs": [
            "docs/architecture/13_storage_and_persistence_baseline.md#Store Matrix",
            "prompt/085.md#Mission",
        ],
    }
    domain_added = False
    for row in topology["data_store_catalog"]:
        if row["data_store_ref"] == DOMAIN_DATA_STORE_REF:
            catalog.append(domain_entry)
            domain_added = True
            continue
        if row["data_store_ref"] == FHIR_DATA_STORE_REF:
            catalog.append(
                {
                    **row,
                    "display_name": "FHIR representation store",
                    "store_class": "fhir_representation",
                }
            )
            continue
        catalog.append(row)
    if not domain_added:
        catalog.insert(0, domain_entry)

    topology["data_store_catalog"] = catalog
    topology["domain_store_manifest_ref"] = "data/analysis/domain_store_manifest.json"
    topology["fhir_store_manifest_ref"] = "data/analysis/fhir_store_manifest.json"
    topology["data_plane_separation_matrix_ref"] = "data/analysis/data_plane_separation_matrix.csv"
    write_json(RUNTIME_TOPOLOGY_PATH, topology)


def patch_root_package() -> None:
    package = load_json(ROOT_PACKAGE_PATH)
    package.setdefault("scripts", {}).update(ROOT_SCRIPT_UPDATES)
    write_json(ROOT_PACKAGE_PATH, package)


def patch_playwright_package() -> None:
    package = load_json(PLAYWRIGHT_PACKAGE_PATH)
    scripts = package.setdefault("scripts", {})
    scripts["build"] = append_script_step(
        scripts.get("build", ""), "node --check data-storage-topology-atlas.spec.js"
    )
    if "eslint data-storage-topology-atlas.spec.js" not in scripts.get("lint", ""):
        scripts["lint"] = scripts.get("lint", "") + " && eslint data-storage-topology-atlas.spec.js"
        scripts["lint"] = scripts["lint"].lstrip(" &&")
    scripts["test"] = append_script_step(
        scripts.get("test", ""), "node data-storage-topology-atlas.spec.js"
    )
    scripts["typecheck"] = append_script_step(
        scripts.get("typecheck", ""), "node --check data-storage-topology-atlas.spec.js"
    )
    scripts["e2e"] = append_script_step(
        scripts.get("e2e", ""), "node data-storage-topology-atlas.spec.js --run"
    )
    description = package.get("description", "")
    if "data-storage topology atlas" not in description:
        package["description"] = (description.rstrip(".") + ", data-storage topology atlas browser checks.").strip(", ")
    write_json(PLAYWRIGHT_PACKAGE_PATH, package)


def main() -> None:
    topology = load_json(RUNTIME_TOPOLOGY_PATH)
    fhir_contract_manifest = load_json(FHIR_CONTRACT_MANIFEST_PATH)
    fhir_contracts = load_json(FHIR_CONTRACTS_PATH)

    domain_manifest = build_domain_manifest(topology)
    fhir_manifest = build_fhir_manifest(topology, fhir_contract_manifest, fhir_contracts)
    atlas_bundle = build_atlas_bundle(domain_manifest, fhir_manifest, SEPARATION_RULE_ROWS)

    write_json(DOMAIN_STORE_MANIFEST_PATH, domain_manifest)
    write_json(FHIR_STORE_MANIFEST_PATH, fhir_manifest)
    write_csv(SEPARATION_MATRIX_PATH, SEPARATION_RULE_ROWS)
    write_text(DESIGN_DOC_PATH, build_design_doc(domain_manifest, fhir_manifest, SEPARATION_RULE_ROWS))
    write_text(RULES_DOC_PATH, build_rules_doc(domain_manifest, fhir_manifest, SEPARATION_RULE_ROWS))
    write_text(ATLAS_PATH, build_html(atlas_bundle))
    write_text(SPEC_PATH, build_playwright_spec())

    write_text(README_PATH, build_readme())
    write_text(TERRAFORM_MAIN_PATH, build_terraform_main())
    write_text(TERRAFORM_VARIABLES_PATH, build_terraform_variables())
    write_text(TERRAFORM_OUTPUTS_PATH, build_terraform_outputs())
    write_text(DOMAIN_MODULE_MAIN_PATH, build_domain_module_main())
    write_text(DOMAIN_MODULE_VARIABLES_PATH, build_domain_module_variables())
    write_text(DOMAIN_MODULE_OUTPUTS_PATH, build_domain_module_outputs())
    write_text(FHIR_MODULE_MAIN_PATH, build_fhir_module_main())
    write_text(FHIR_MODULE_VARIABLES_PATH, build_fhir_module_variables())
    write_text(FHIR_MODULE_OUTPUTS_PATH, build_fhir_module_outputs())

    for environment_ring, path in ENVIRONMENT_FILE_PATHS.items():
        write_json(path, build_environment_tfvars(environment_ring))

    write_text(DOMAIN_BOOTSTRAP_SQL_PATH, build_domain_bootstrap_sql())
    write_text(FHIR_BOOTSTRAP_SQL_PATH, build_fhir_bootstrap_sql())
    write_text(LOCAL_COMPOSE_PATH, build_local_compose())
    write_json(LOCAL_POLICY_PATH, build_local_policy())
    write_text(LOCAL_BOOTSTRAP_SCRIPT_PATH, build_local_bootstrap_script())
    write_text(SMOKE_TEST_PATH, build_smoke_test())

    patch_runtime_topology_manifest()
    patch_root_package()
    patch_playwright_package()


if __name__ == "__main__":
    main()
