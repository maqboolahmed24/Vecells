terraform {
  required_version = ">= 1.7.0"
}

locals {
  preview_manifest   = jsondecode(file("${path.module}/../../data/analysis/preview_environment_manifest.json"))
  seed_pack_manifest = jsondecode(file("${path.module}/../../data/analysis/preview_seed_pack_manifest.json"))
  preview_rows = [
    for row in local.preview_manifest.preview_environments : row
    if row.environmentRing == var.environment
  ]
}

module "preview_environment" {
  source = "./modules/preview_environment"

  environment            = var.environment
  preview_environment_ids = [for row in local.preview_rows : row.previewEnvironmentRef]
  runtime_tuple_hashes   = [for row in local.preview_rows : row.runtimeTupleHash]
  seed_pack_refs         = [for row in local.preview_rows : row.seedPackRef]
}

module "preview_ttl_guard" {
  source = "./modules/preview_ttl_guard"

  environment      = var.environment
  preview_ttl_hours = [for row in local.preview_rows : row.ttlHours]
  preview_states   = [for row in local.preview_rows : row.state]
}
