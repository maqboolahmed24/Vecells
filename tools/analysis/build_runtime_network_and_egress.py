#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from textwrap import dedent
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "analysis"
DOCS_DIR = ROOT / "docs" / "architecture"
INFRA_DIR = ROOT / "infra" / "runtime-network"

RUNTIME_TOPOLOGY_PATH = DATA_DIR / "runtime_topology_manifest.json"
BOUNDARY_MATRIX_PATH = DATA_DIR / "trust_zone_boundary_matrix.csv"
ALLOWLIST_MANIFEST_PATH = DATA_DIR / "private_egress_allowlist_manifest.json"

README_PATH = INFRA_DIR / "README.md"
TERRAFORM_ROOT = INFRA_DIR / "terraform"
TERRAFORM_MAIN_PATH = TERRAFORM_ROOT / "main.tf"
TERRAFORM_VARIABLES_PATH = TERRAFORM_ROOT / "variables.tf"
TERRAFORM_OUTPUTS_PATH = TERRAFORM_ROOT / "outputs.tf"
CORE_NETWORK_MAIN_PATH = TERRAFORM_ROOT / "modules" / "core_network" / "main.tf"
CORE_NETWORK_VARIABLES_PATH = TERRAFORM_ROOT / "modules" / "core_network" / "variables.tf"
CORE_NETWORK_OUTPUTS_PATH = TERRAFORM_ROOT / "modules" / "core_network" / "outputs.tf"
WORKLOAD_SEGMENTS_MAIN_PATH = TERRAFORM_ROOT / "modules" / "workload_segments" / "main.tf"
WORKLOAD_SEGMENTS_VARIABLES_PATH = TERRAFORM_ROOT / "modules" / "workload_segments" / "variables.tf"
WORKLOAD_SEGMENTS_OUTPUTS_PATH = TERRAFORM_ROOT / "modules" / "workload_segments" / "outputs.tf"
PRIVATE_EGRESS_MAIN_PATH = TERRAFORM_ROOT / "modules" / "private_egress" / "main.tf"
PRIVATE_EGRESS_VARIABLES_PATH = TERRAFORM_ROOT / "modules" / "private_egress" / "variables.tf"
PRIVATE_EGRESS_OUTPUTS_PATH = TERRAFORM_ROOT / "modules" / "private_egress" / "outputs.tf"

LOCAL_EMULATOR_COMPOSE_PATH = INFRA_DIR / "local" / "runtime-network-emulator.compose.yaml"
LOCAL_POLICY_PATH = INFRA_DIR / "local" / "network-policy.json"
SMOKE_TEST_PATH = INFRA_DIR / "tests" / "runtime-network-smoke.test.mjs"

TASK_ID = "par_084"
VISUAL_MODE = "Runtime_Network_Trust_Atlas"
GENERATED_AT = datetime.now(timezone.utc).isoformat(timespec="seconds")

ASSUMPTIONS = [
    {
        "assumption_ref": "ASSUMPTION_IAC_TOOL_TERRAFORM_OR_OPENTOFU",
        "value": "terraform_or_opentofu",
        "reason": "No conflicting ADR pins a vendor-specific runtime IaC tool in the repository.",
        "source_refs": [
            "prompt/084.md#Execution steps",
            "docs/architecture/11_cloud_region_and_residency_decision.md#Environment Ring Binding",
        ],
    },
    {
        "assumption_ref": "ASSUMPTION_PROVIDER_NEUTRAL_NETWORK_PRIMITIVES",
        "value": "provider_neutral_vpc_equivalent_segments",
        "reason": "Task 011 froze UK region roles without binding the repo to a specific cloud SKU vocabulary.",
        "source_refs": [
            "prompt/011.md#Execution steps",
            "docs/architecture/11_cloud_region_and_residency_decision.md#Region Scorecard",
        ],
    },
]

FOLLOW_ON_DEPENDENCIES = [
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_086_OBJECT_STORAGE_PRIVATE_ENDPOINTS",
        "owning_task_ref": "par_086",
        "scope": "Object storage private endpoints and retention bucket pathing.",
        "notes": "par_084 publishes the data-plane network seam only; bucket resources remain owned by par_086.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_087_EVENT_BUS_PRIVATE_DISPATCH",
        "owning_task_ref": "par_087",
        "scope": "Queueing, outbox/inbox brokers, and integration dispatch private connectivity.",
        "notes": "par_084 preserves route domains and workload-family segmentation for these paths without provisioning the bus.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_088_CACHE_LIVE_UPDATE_SEGMENTS",
        "owning_task_ref": "par_088",
        "scope": "Cache plane and live-update transport overlays.",
        "notes": "The stateful-data trust zone stays explicit, but cache and live channel resources remain owned by par_088.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_089_SECRETS_KMS_WORKLOAD_IDENTITY",
        "owning_task_ref": "par_089",
        "scope": "Secret broker, KMS custody, and concrete workload-identity credential minting.",
        "notes": "par_084 marks every service as workload-identity-ready; par_089 owns real credential issuance and rotation.",
    },
    {
        "dependency_ref": "FOLLOW_ON_DEPENDENCY_090_PUBLISHED_GATEWAY_EDGE_ATTACHMENTS",
        "owning_task_ref": "par_090",
        "scope": "Audience-specific gateway ingress attachments and public origin publication.",
        "notes": "par_084 provisions only the published-gateway trust boundary and browser bridge law.",
    },
]

ENVIRONMENT_REGION_CIDRS = {
    "local": {"local_nonprod": "10.240.0.0/16"},
    "ci-preview": {"uk_primary_region": "10.24.0.0/16"},
    "integration": {"uk_primary_region": "10.25.0.0/16"},
    "preprod": {
        "uk_primary_region": "10.26.0.0/16",
        "uk_secondary_region": "10.27.0.0/16",
    },
    "production": {
        "uk_primary_region": "10.28.0.0/16",
        "uk_secondary_region": "10.29.0.0/16",
    },
}

SEGMENT_SUFFIXES = {
    "wf_public_edge_ingress": 10,
    "wf_shell_delivery_static_publication": 20,
    "wf_shell_delivery_published_gateway": 30,
    "wf_command_orchestration": 40,
    "wf_projection_read_models": 50,
    "wf_integration_dispatch": 60,
    "wf_integration_simulation_lab": 70,
    "wf_data_stateful_plane": 80,
    "wf_assurance_security_control": 90,
}

EGRESS_SCOPE_CLASS = {
    "eal_public_edge_internal_only": "internal_only",
    "eal_shell_publication_none": "no_runtime_egress",
    "eal_gateway_internal_only": "internal_only",
    "eal_command_to_internal_planes_only": "internal_only",
    "eal_projection_to_internal_planes_only": "internal_only",
    "eal_declared_external_dependencies_only": "declared_external_dependencies",
    "eal_integration_simulator_internal_only": "internal_only",
    "eal_data_internal_only": "internal_only",
    "eal_assurance_to_internal_planes_only": "internal_only",
}

EXTERNAL_DESTINATIONS = {
    "eal_declared_external_dependencies_only": [
        {
            "destination_ref": "dest_nhs_login_sandbox",
            "service_class": "identity_and_auth_provider",
            "environment_modes": {
                "local": "simulator_only",
                "ci-preview": "simulator_or_sandbox",
                "integration": "sandbox_required",
                "preprod": "follow_on_cutover_required",
                "production": "follow_on_cutover_required",
            },
        },
        {
            "destination_ref": "dest_im1_pairing_sandbox",
            "service_class": "gp_record_and_pairing_adapter",
            "environment_modes": {
                "local": "simulator_only",
                "ci-preview": "simulator_or_sandbox",
                "integration": "sandbox_required",
                "preprod": "follow_on_cutover_required",
                "production": "follow_on_cutover_required",
            },
        },
        {
            "destination_ref": "dest_mesh_mailbox",
            "service_class": "mesh_dispatch",
            "environment_modes": {
                "local": "simulator_only",
                "ci-preview": "simulator_or_sandbox",
                "integration": "sandbox_required",
                "preprod": "follow_on_cutover_required",
                "production": "follow_on_cutover_required",
            },
        },
        {
            "destination_ref": "dest_telephony_vendor",
            "service_class": "telephony_and_callback",
            "environment_modes": {
                "local": "simulator_only",
                "ci-preview": "simulator_only",
                "integration": "sandbox_required",
                "preprod": "follow_on_cutover_required",
                "production": "follow_on_cutover_required",
            },
        },
        {
            "destination_ref": "dest_notifications_vendor",
            "service_class": "email_and_sms_notifications",
            "environment_modes": {
                "local": "simulator_only",
                "ci-preview": "simulator_only",
                "integration": "sandbox_required",
                "preprod": "follow_on_cutover_required",
                "production": "follow_on_cutover_required",
            },
        },
    ]
}


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
        writer.writerows(rows)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def subnet_cidr(base_cidr: str, third_octet: int) -> str:
    prefix = base_cidr.split("/")[0]
    first, second, _, _ = prefix.split(".")
    return f"{first}.{second}.{third_octet}.0/24"


def join_refs(values: list[str]) -> str:
    return ";".join(values)


def main() -> None:
    manifest = load_json(RUNTIME_TOPOLOGY_PATH)
    require(manifest["task_id"] == "seq_046", "runtime_topology_manifest.json is no longer owned by seq_046.")

    family_catalog = {
        row["runtime_workload_family_ref"]: row for row in manifest["workload_family_catalog"]
    }
    boundary_list = manifest["trust_zone_boundaries"]
    blocked_crossings = manifest["blocked_crossings"]
    egress_allowlists = manifest["egress_allowlists"]
    service_bindings = manifest["service_runtime_bindings"]
    environment_manifests = {
        row["environment_ring"]: row for row in manifest["environment_manifests"]
    }

    service_identity_catalog = []
    for family_ref, family_row in family_catalog.items():
        bound_services = [
            binding["artifact_id"]
            for binding in service_bindings
            if binding["runtime_workload_family_ref"] == family_ref
        ]
        service_identity_catalog.append(
            {
                "service_identity_ref": family_row["service_identity_ref"],
                "runtime_workload_family_ref": family_ref,
                "family_code": family_row["family_code"],
                "bound_artifact_ids": bound_services,
                "identity_mode": "workload_identity_mtls_ready",
                "certificate_authority_ref": "ca_vecells_internal_mesh",
                "token_ttl_seconds": 900,
                "rotation_owner_follow_on_ref": "FOLLOW_ON_DEPENDENCY_089_SECRETS_KMS_WORKLOAD_IDENTITY",
            }
        )

    runtime_rows = manifest["runtime_workload_families"]
    grouped_by_env_and_region: dict[str, dict[str, list[dict[str, Any]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for row in runtime_rows:
        grouped_by_env_and_region[row["environment_ring"]][row["region_ref"]].append(row)

    environment_network_realizations = []
    for environment_ring, region_map in grouped_by_env_and_region.items():
        env_manifest = environment_manifests[environment_ring]
        region_placements = []
        for region_ref, rows in sorted(region_map.items()):
            base_cidr = ENVIRONMENT_REGION_CIDRS[environment_ring][region_ref]
            placements = []
            for row in sorted(
                rows,
                key=lambda entry: (
                    entry["trust_zone_ref"],
                    entry["family_code"],
                    entry["runtime_workload_family_ref"],
                ),
            ):
                family_ref = row["runtime_workload_family_ref"]
                family_row = family_catalog[family_ref]
                segment_ref = (
                    f"seg_{environment_ring}_{region_ref}_{family_ref.replace('wf_', '')}"
                )
                placements.append(
                    {
                        "segment_ref": segment_ref,
                        "runtime_workload_family_id": row["runtime_workload_family_id"],
                        "runtime_workload_family_ref": family_ref,
                        "family_code": row["family_code"],
                        "display_name": row["display_name"],
                        "trust_zone_ref": row["trust_zone_ref"],
                        "service_identity_ref": family_row["service_identity_ref"],
                        "egress_allowlist_ref": family_row["egress_allowlist_ref"],
                        "browser_reachable": family_row["browser_reachable"],
                        "subnet_cidr": subnet_cidr(base_cidr, SEGMENT_SUFFIXES[family_ref]),
                        "route_domain_ref": f"rd_{row['trust_zone_ref'].replace('tz_', '')}",
                        "network_policy_ref": f"np_{family_ref.replace('wf_', '')}",
                    }
                )
            region_placements.append(
                {
                    "region_ref": region_ref,
                    "uk_region_role": rows[0]["uk_region_role"],
                    "network_ref": f"net_{environment_ring}_{region_ref}",
                    "cidr_block": base_cidr,
                    "nat_egress_broker_ref": f"nat_{environment_ring}_{region_ref}",
                    "workload_segments": placements,
                }
            )

        environment_network_realizations.append(
            {
                "environment_ring": environment_ring,
                "network_foundation_ref": f"net_foundation_{environment_ring}",
                "cloud_provider_profile_ref": "provider_neutral_dual_uk_region",
                "iac_tool_ref": "terraform_or_opentofu",
                "topology_tuple_hash": env_manifest["topology_tuple_hash"],
                "publication_state": env_manifest["publication_state"],
                "region_placements": region_placements,
                "trust_zone_boundary_refs": env_manifest["trust_zone_boundary_refs"],
                "gateway_surface_refs": env_manifest["gateway_surface_refs"],
                "service_identity_refs": env_manifest["service_identity_refs"],
                "egress_allowlist_refs": env_manifest["egress_allowlist_refs"],
                "browser_bridge_rule": "published_gateway_only",
                "drift_action": "mark_stale_and_freeze_writable",
                "local_emulation_mode": (
                    "docker_compose_parity" if environment_ring == "local" else "manifest_contract_only"
                ),
            }
        )

    allowlist_rows = []
    allowlist_overlay_rows = []
    for allowlist in egress_allowlists:
        scope_class = EGRESS_SCOPE_CLASS[allowlist["egress_allowlist_ref"]]
        external_destinations = EXTERNAL_DESTINATIONS.get(allowlist["egress_allowlist_ref"], [])
        allowlist_rows.append(
            {
                "egress_allowlist_ref": allowlist["egress_allowlist_ref"],
                "display_name": allowlist["display_name"],
                "family_refs": allowlist["family_refs"],
                "default_action": "deny",
                "scope_class": scope_class,
                "allowed_internal_target_refs": allowlist["allowed_targets"],
                "blocked_internal_target_refs": allowlist["blocked_targets"],
                "external_destinations": external_destinations,
                "enforcement_refs": [
                    "terraform_private_egress_policy",
                    "trust_zone_boundary_matrix",
                    "local_network_policy_manifest",
                ],
                "drift_action": "mark_stale_and_freeze_writable",
                "source_refs": allowlist["source_refs"],
            }
        )
        for environment_ring in environment_manifests:
            allowlist_overlay_rows.append(
                {
                    "environment_ring": environment_ring,
                    "egress_allowlist_ref": allowlist["egress_allowlist_ref"],
                    "scope_class": scope_class,
                    "mode": (
                        "simulator_internal_only"
                        if environment_ring == "local" and scope_class == "internal_only"
                        else "simulator_or_sandbox"
                        if environment_ring in {"ci-preview", "integration"}
                        and scope_class == "declared_external_dependencies"
                        else "follow_on_cutover_required"
                        if scope_class == "declared_external_dependencies"
                        else "no_runtime_egress"
                        if scope_class == "no_runtime_egress"
                        else "internal_only"
                    ),
                    "egress_broker_ref": (
                        "docker_compose_bridge"
                        if environment_ring == "local"
                        else f"nat_{environment_ring}_broker"
                    ),
                }
            )

    allowlist_manifest = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "mode": VISUAL_MODE,
        "assumptions": ASSUMPTIONS,
        "summary": {
            "allowlist_count": len(allowlist_rows),
            "environment_overlay_count": len(allowlist_overlay_rows),
            "family_coverage_count": sum(len(row["family_refs"]) for row in allowlist_rows),
            "external_destination_count": sum(
                len(row["external_destinations"]) for row in allowlist_rows
            ),
            "follow_on_dependency_count": len(FOLLOW_ON_DEPENDENCIES),
        },
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "allowlists": allowlist_rows,
        "environment_overlays": allowlist_overlay_rows,
    }

    boundary_rows = []
    for environment_ring in environment_manifests:
        for boundary in boundary_list:
            source_families = boundary["source_workload_family_refs"]
            target_families = boundary["target_workload_family_refs"]
            boundary_rows.append(
                {
                    "environment_ring": environment_ring,
                    "boundary_ref": boundary["boundary_id"],
                    "boundary_class": "declared_boundary",
                    "boundary_state": boundary["boundary_state"],
                    "source_trust_zone_ref": boundary["source_trust_zone_ref"],
                    "target_trust_zone_ref": boundary["target_trust_zone_ref"],
                    "source_family_refs": join_refs(source_families),
                    "target_family_refs": join_refs(target_families),
                    "allowed_protocol_refs": join_refs(boundary["allowed_protocol_refs"]),
                    "allowed_identity_refs": join_refs(boundary["allowed_identity_refs"]),
                    "tenant_transfer_mode": boundary["tenant_transfer_mode"],
                    "assurance_trust_transfer_mode": boundary["assurance_trust_transfer_mode"],
                    "egress_allowlist_ref": boundary["egress_allowlist_ref"],
                    "browser_path_state": (
                        "published_gateway_only"
                        if any(
                            family_catalog[family_ref]["browser_reachable"] == "yes"
                            for family_ref in source_families
                        )
                        else "internal_only"
                    ),
                    "enforcement_refs": join_refs(
                        [
                            "terraform_core_network",
                            "terraform_workload_segments",
                            "terraform_private_egress_policy",
                        ]
                    ),
                    "notes": boundary["notes"],
                }
            )
        for blocked in blocked_crossings:
            source_family = blocked["source_family_ref"]
            target_family = blocked["target_family_ref"]
            boundary_rows.append(
                {
                    "environment_ring": environment_ring,
                    "boundary_ref": blocked["crossing_id"],
                    "boundary_class": "blocked_crossing",
                    "boundary_state": "blocked",
                    "source_trust_zone_ref": family_catalog[source_family]["trust_zone_ref"],
                    "target_trust_zone_ref": family_catalog[target_family]["trust_zone_ref"],
                    "source_family_refs": source_family,
                    "target_family_refs": target_family,
                    "allowed_protocol_refs": "none",
                    "allowed_identity_refs": "none",
                    "tenant_transfer_mode": "forbidden",
                    "assurance_trust_transfer_mode": "forbidden",
                    "egress_allowlist_ref": family_catalog[source_family]["egress_allowlist_ref"],
                    "browser_path_state": "forbidden",
                    "enforcement_refs": join_refs(
                        [
                            "terraform_core_network",
                            "trust_zone_boundary_matrix",
                            "local_network_policy_manifest",
                        ]
                    ),
                    "notes": blocked["reason"],
                }
            )

    network_foundation = {
        "task_id": TASK_ID,
        "generated_at": GENERATED_AT,
        "mode": VISUAL_MODE,
        "iac_tool_ref": "terraform_or_opentofu",
        "cloud_provider_profile_ref": "provider_neutral_dual_uk_region",
        "summary": {
            "environment_realization_count": len(environment_network_realizations),
            "region_placement_count": sum(
                len(row["region_placements"]) for row in environment_network_realizations
            ),
            "segment_realization_count": sum(
                len(placement["workload_segments"])
                for row in environment_network_realizations
                for placement in row["region_placements"]
            ),
            "service_identity_count": len(service_identity_catalog),
            "allowlist_count": len(allowlist_rows),
            "boundary_matrix_row_count": len(boundary_rows),
            "follow_on_dependency_count": len(FOLLOW_ON_DEPENDENCIES),
        },
        "assumptions": ASSUMPTIONS,
        "follow_on_dependencies": FOLLOW_ON_DEPENDENCIES,
        "service_identity_catalog": service_identity_catalog,
        "environment_network_realizations": environment_network_realizations,
        "local_topology_emulation": {
            "local_emulation_ref": "local_runtime_network_emulator",
            "compose_file_ref": str(LOCAL_EMULATOR_COMPOSE_PATH.relative_to(ROOT)),
            "policy_file_ref": str(LOCAL_POLICY_PATH.relative_to(ROOT)),
            "browser_addressable_services": [
                "public-edge",
                "shell-delivery",
                "published-gateway",
            ],
            "blocked_direct_browser_services": [
                "command-api",
                "projection-worker",
                "integration-dispatch",
                "data-plane",
                "assurance-control",
            ],
            "ci_reuse_mode": "same_manifest_same_workload_families",
        },
        "artifact_refs": {
            "boundary_matrix_ref": str(BOUNDARY_MATRIX_PATH.relative_to(ROOT)),
            "private_egress_allowlist_manifest_ref": str(
                ALLOWLIST_MANIFEST_PATH.relative_to(ROOT)
            ),
            "terraform_root_ref": str(TERRAFORM_ROOT.relative_to(ROOT)),
        },
    }

    manifest["generated_at"] = GENERATED_AT
    manifest["network_foundation"] = network_foundation
    manifest["trust_zone_boundary_matrix_ref"] = str(BOUNDARY_MATRIX_PATH.relative_to(ROOT))
    manifest["private_egress_allowlist_manifest_ref"] = str(
        ALLOWLIST_MANIFEST_PATH.relative_to(ROOT)
    )

    write_json(RUNTIME_TOPOLOGY_PATH, manifest)
    write_csv(BOUNDARY_MATRIX_PATH, boundary_rows)
    write_json(ALLOWLIST_MANIFEST_PATH, allowlist_manifest)

    write_text(
        README_PATH,
        dedent(
            """
            # Runtime Network Foundation

            This directory contains the provider-neutral Phase 0 runtime network baseline for par_084.

            - `terraform/` publishes the core-network, workload-segment, and private-egress modules.
            - `local/` mirrors the same workload-family and trust-boundary law for developer and CI use.
            - `tests/` contains smoke checks that fail when browser reachability or egress posture drifts.
            """
        ),
    )

    write_text(
        TERRAFORM_MAIN_PATH,
        dedent(
            """
            terraform {
              required_version = ">= 1.6.0"
            }

            locals {
              topology_manifest   = jsondecode(file("${path.module}/../../data/analysis/runtime_topology_manifest.json"))
              network_foundation  = local.topology_manifest.network_foundation
              egress_manifest     = jsondecode(file("${path.module}/../../data/analysis/private_egress_allowlist_manifest.json"))
              environment_network = one([
                for item in local.network_foundation.environment_network_realizations : item
                if item.environment_ring == var.environment
              ])
            }

            module "core_network" {
              source          = "./modules/core_network"
              environment     = var.environment
              region_placements = local.environment_network.region_placements
              trust_zone_refs = [for zone in local.topology_manifest.trust_zones : zone.trust_zone_ref]
            }

            module "workload_segments" {
              source            = "./modules/workload_segments"
              environment       = var.environment
              region_placements = local.environment_network.region_placements
            }

            module "private_egress" {
              source              = "./modules/private_egress"
              environment         = var.environment
              allowlists          = local.egress_manifest.allowlists
              environment_overlays = [
                for row in local.egress_manifest.environment_overlays : row
                if row.environment_ring == var.environment
              ]
            }
            """
        ),
    )

    write_text(
        TERRAFORM_VARIABLES_PATH,
        dedent(
            """
            variable "environment" {
              description = "Environment ring to realize for the provider-neutral network baseline."
              type        = string
            }
            """
        ),
    )

    write_text(
        TERRAFORM_OUTPUTS_PATH,
        dedent(
            """
            output "network_foundation_ref" {
              value = local.environment_network.network_foundation_ref
            }

            output "core_network" {
              value = module.core_network.networks
            }

            output "workload_segments" {
              value = module.workload_segments.segment_map
            }

            output "private_egress" {
              value = module.private_egress.allowlist_map
            }
            """
        ),
    )

    write_text(
        CORE_NETWORK_MAIN_PATH,
        dedent(
            """
            locals {
              networks = {
                for placement in var.region_placements :
                placement.region_ref => {
                  network_ref       = placement.network_ref
                  uk_region_role    = placement.uk_region_role
                  cidr_block        = placement.cidr_block
                  nat_egress_ref    = placement.nat_egress_broker_ref
                  trust_zone_refs   = var.trust_zone_refs
                }
              }
            }
            """
        ),
    )

    write_text(
        CORE_NETWORK_VARIABLES_PATH,
        dedent(
            """
            variable "environment" {
              type = string
            }

            variable "region_placements" {
              type = list(object({
                region_ref            = string
                uk_region_role        = string
                network_ref           = string
                cidr_block            = string
                nat_egress_broker_ref = string
                workload_segments     = list(any)
              }))
            }

            variable "trust_zone_refs" {
              type = list(string)
            }
            """
        ),
    )

    write_text(
        CORE_NETWORK_OUTPUTS_PATH,
        dedent(
            """
            output "networks" {
              value = local.networks
            }
            """
        ),
    )

    write_text(
        WORKLOAD_SEGMENTS_MAIN_PATH,
        dedent(
            """
            locals {
              segment_map = merge([
                for placement in var.region_placements : {
                  for segment in placement.workload_segments :
                  segment.runtime_workload_family_id => merge(segment, {
                    region_ref     = placement.region_ref
                    uk_region_role = placement.uk_region_role
                    network_ref    = placement.network_ref
                  })
                }
              ]...)
            }
            """
        ),
    )

    write_text(
        WORKLOAD_SEGMENTS_VARIABLES_PATH,
        dedent(
            """
            variable "environment" {
              type = string
            }

            variable "region_placements" {
              type = list(object({
                region_ref            = string
                uk_region_role        = string
                network_ref           = string
                cidr_block            = string
                nat_egress_broker_ref = string
                workload_segments     = list(any)
              }))
            }
            """
        ),
    )

    write_text(
        WORKLOAD_SEGMENTS_OUTPUTS_PATH,
        dedent(
            """
            output "segment_map" {
              value = local.segment_map
            }
            """
        ),
    )

    write_text(
        PRIVATE_EGRESS_MAIN_PATH,
        dedent(
            """
            locals {
              allowlist_map = {
                for row in var.allowlists :
                row.egress_allowlist_ref => merge(row, {
                  overlay = one([
                    for overlay in var.environment_overlays : overlay
                    if overlay.egress_allowlist_ref == row.egress_allowlist_ref
                  ])
                })
              }
            }
            """
        ),
    )

    write_text(
        PRIVATE_EGRESS_VARIABLES_PATH,
        dedent(
            """
            variable "environment" {
              type = string
            }

            variable "allowlists" {
              type = list(any)
            }

            variable "environment_overlays" {
              type = list(any)
            }
            """
        ),
    )

    write_text(
        PRIVATE_EGRESS_OUTPUTS_PATH,
        dedent(
            """
            output "allowlist_map" {
              value = local.allowlist_map
            }
            """
        ),
    )

    for environment_ring in ENVIRONMENT_REGION_CIDRS:
        write_json(
            INFRA_DIR / "environments" / f"{environment_ring}.auto.tfvars.json",
            {
                "environment": environment_ring,
            },
        )

    write_text(
        LOCAL_EMULATOR_COMPOSE_PATH,
        dedent(
            """
            services:
              public-edge:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                ports: ["8080:8080"]
                networks: ["public_edge"]
              shell-delivery:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                ports: ["8081:8081"]
                networks: ["shell_delivery"]
              published-gateway:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                ports: ["8082:8082"]
                networks: ["published_gateway", "application_core", "assurance_security"]
              command-api:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                networks: ["application_core", "stateful_data", "integration_perimeter", "assurance_security"]
              projection-worker:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                networks: ["application_core", "stateful_data", "assurance_security"]
              integration-dispatch:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                networks: ["integration_perimeter", "stateful_data", "assurance_security"]
              adapter-simulators:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                networks: ["integration_perimeter"]
              data-plane:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                networks: ["stateful_data"]
              assurance-control:
                image: busybox:1.36
                command: ["sh", "-c", "sleep infinity"]
                networks: ["assurance_security", "stateful_data"]

            networks:
              public_edge: {}
              shell_delivery:
                internal: true
              published_gateway:
                internal: true
              application_core:
                internal: true
              integration_perimeter:
                internal: true
              stateful_data:
                internal: true
              assurance_security:
                internal: true
            """
        ),
    )

    write_json(
        LOCAL_POLICY_PATH,
        {
            "task_id": TASK_ID,
            "mode": VISUAL_MODE,
            "default_policy": "deny",
            "browser_addressable_services": [
                "public-edge",
                "shell-delivery",
                "published-gateway",
            ],
            "blocked_direct_browser_services": [
                "command-api",
                "projection-worker",
                "integration-dispatch",
                "adapter-simulators",
                "data-plane",
                "assurance-control",
            ],
            "allowed_internal_bridges": [
                "public-edge->shell-delivery",
                "public-edge->published-gateway",
                "published-gateway->command-api",
                "published-gateway->projection-worker",
                "published-gateway->assurance-control",
                "command-api->data-plane",
                "command-api->integration-dispatch",
                "command-api->assurance-control",
                "projection-worker->data-plane",
                "projection-worker->assurance-control",
                "integration-dispatch->data-plane",
                "integration-dispatch->assurance-control",
            ],
        },
    )

    write_text(
        SMOKE_TEST_PATH,
        dedent(
            """
            import fs from "node:fs";
            import path from "node:path";
            import test from "node:test";
            import assert from "node:assert/strict";
            import { fileURLToPath } from "node:url";

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const ROOT = path.resolve(__dirname, "..", "..", "..");
            const topology = JSON.parse(
              fs.readFileSync(path.join(ROOT, "data", "analysis", "runtime_topology_manifest.json"), "utf8"),
            );
            const allowlists = JSON.parse(
              fs.readFileSync(path.join(ROOT, "data", "analysis", "private_egress_allowlist_manifest.json"), "utf8"),
            );
            const localPolicy = JSON.parse(
              fs.readFileSync(path.join(ROOT, "infra", "runtime-network", "local", "network-policy.json"), "utf8"),
            );

            test("network foundation covers every runtime workload instance", () => {
              const foundation = topology.network_foundation;
              const segmentCount = foundation.environment_network_realizations
                .flatMap((environment) => environment.region_placements)
                .flatMap((placement) => placement.workload_segments).length;
              assert.equal(
                segmentCount,
                topology.runtime_workload_families.length,
                "every runtime workload instance should have a segment realization",
              );
            });

            test("browser reachability stays limited to the published bridge", () => {
              assert.deepEqual(localPolicy.blocked_direct_browser_services.includes("data-plane"), true);
              assert.deepEqual(localPolicy.blocked_direct_browser_services.includes("integration-dispatch"), true);
              assert.deepEqual(localPolicy.browser_addressable_services.includes("published-gateway"), true);
            });

            test("every workload family remains covered by one default-deny allowlist", () => {
              const coveredFamilies = new Set(
                allowlists.allowlists.flatMap((row) => row.family_refs),
              );
              const familyRefs = topology.workload_family_catalog.map((row) => row.runtime_workload_family_ref);
              assert.equal(coveredFamilies.size, familyRefs.length);
              for (const familyRef of familyRefs) {
                assert.equal(coveredFamilies.has(familyRef), true, familyRef);
              }
              for (const allowlist of allowlists.allowlists) {
                assert.equal(allowlist.default_action, "deny");
              }
            });
            """
        ),
    )


if __name__ == "__main__":
    main()
