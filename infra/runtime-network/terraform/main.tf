
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
