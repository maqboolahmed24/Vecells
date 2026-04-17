terraform {
  required_version = ">= 1.6.0"
}

locals {
  topology_manifest = jsondecode(file("${path.module}/../../data/analysis/runtime_topology_manifest.json"))
  class_manifest    = jsondecode(file("${path.module}/../../data/analysis/object_storage_class_manifest.json"))
  key_rules         = jsondecode(file("${path.module}/../../data/analysis/object_key_manifest_rules.json"))
  retention_rows    = csvdecode(file("${path.module}/../../data/analysis/object_retention_policy_matrix.csv"))
  environment_realization = one([
    for row in local.class_manifest.environment_realizations : row
    if row.environment_ring == var.environment
  ])
  class_realizations = [
    for row in local.class_manifest.class_realizations : row
    if row.environment_ring == var.environment
  ]
}

module "object_storage_namespace" {
  source               = "./modules/object_storage_namespace"
  environment          = var.environment
  namespace_id         = local.environment_realization.namespace_id
  private_endpoint_ref = local.environment_realization.private_endpoint_ref
  kms_mode             = local.environment_realization.kms_mode
}

module "storage_class_buckets" {
  source               = "./modules/storage_class_bucket"
  for_each             = { for row in local.class_realizations : row.storage_class_ref => row }
  environment          = var.environment
  namespace_id         = local.environment_realization.namespace_id
  bucket_name          = each.value.bucket_name
  storage_class_ref    = each.value.storage_class_ref
  retention_policy_ref = each.value.retention_policy_ref
  default_retention_days = each.value.default_retention_days
  legal_hold_ready     = each.value.legal_hold_ready
  browser_delivery_posture = each.value.browser_delivery_posture
  manifest_rule_ref    = each.value.manifest_rule_ref
  private_endpoint_ref = each.value.private_endpoint_ref
  service_identity_refs = each.value.service_identity_refs
}
