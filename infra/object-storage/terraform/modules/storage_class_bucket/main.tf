locals {
  bucket_plan = {
    environment               = var.environment
    namespace_id              = var.namespace_id
    bucket_name               = var.bucket_name
    storage_class_ref         = var.storage_class_ref
    retention_policy_ref      = var.retention_policy_ref
    default_retention_days    = var.default_retention_days
    legal_hold_ready          = var.legal_hold_ready
    browser_delivery_posture  = var.browser_delivery_posture
    manifest_rule_ref         = var.manifest_rule_ref
    private_endpoint_ref      = var.private_endpoint_ref
    service_identity_refs     = var.service_identity_refs
    public_bucket             = false
  }
}
