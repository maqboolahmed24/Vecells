locals {
  binding = {
    environment       = var.environment
    secret_class_ref  = var.secret_class_ref
    key_branch_ref    = var.key_branch_ref
    access_policy_ref = var.access_policy_ref
    rotation_window_days = var.rotation_row.rotation_window_days
    maximum_ttl_days  = var.rotation_row.maximum_ttl_days
    stale_action      = var.rotation_row.stale_action
    revoked_action    = var.rotation_row.revoked_action
  }
}
