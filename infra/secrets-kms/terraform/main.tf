terraform {
  required_version = ">= 1.6.0"
}

locals {
  secret_manifest = jsondecode(file("${path.module}/../../data/analysis/secret_class_manifest.json"))
  key_manifest    = jsondecode(file("${path.module}/../../data/analysis/key_hierarchy_manifest.json"))
  rotation_rows   = csvdecode(file("${path.module}/../../data/analysis/rotation_policy_matrix.csv"))

  environment_backend = one([
    for row in local.secret_manifest.environment_backends : row
    if row.environment_ring == var.environment
  ])
  environment_keys = one([
    for row in local.key_manifest.environments : row
    if row.environment_ring == var.environment
  ])
  secret_classes = [
    for row in local.secret_manifest.secret_classes : row
    if contains(row.allowed_environment_rings, var.environment)
  ]
  access_policies = local.secret_manifest.access_policies
}

module "secret_namespace" {
  source          = "./modules/secret_namespace"
  environment     = var.environment
  namespace_id    = local.environment_backend.namespace_id
  backend_ref     = local.environment_backend.backend_ref
  kms_root_key_ref = local.environment_backend.kms_root_key_ref
}

module "key_hierarchy" {
  source           = "./modules/key_hierarchy"
  environment      = var.environment
  kms_root_key_ref = local.environment_keys.kms_root_key_ref
  branch_keys      = local.key_manifest.branch_keys
}

module "secret_class_binding" {
  source            = "./modules/secret_class_binding"
  for_each          = { for row in local.secret_classes : row.secret_class_ref => row }
  environment       = var.environment
  secret_class_ref  = each.value.secret_class_ref
  key_branch_ref    = each.value.key_branch_ref
  access_policy_ref = each.value.access_policy_ref
  rotation_row = one([
    for row in local.rotation_rows : row
    if row.secret_class_ref == each.value.secret_class_ref
  ])
}

module "secret_access_policy" {
  source            = "./modules/secret_access_policy"
  for_each          = { for row in local.access_policies : row.access_policy_ref => row }
  environment       = var.environment
  access_policy_ref = each.value.access_policy_ref
  actor_ref         = each.value.actor_ref
  audit_stream_ref  = each.value.audit_stream_ref
  break_glass_mode  = each.value.break_glass_mode
}
