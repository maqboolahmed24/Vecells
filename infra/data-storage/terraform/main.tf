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
