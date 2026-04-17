locals {
  policy = {
    environment       = var.environment
    access_policy_ref = var.access_policy_ref
    actor_ref         = var.actor_ref
    audit_stream_ref  = var.audit_stream_ref
    break_glass_mode  = var.break_glass_mode
  }
}
