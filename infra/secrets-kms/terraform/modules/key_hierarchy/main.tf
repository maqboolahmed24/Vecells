locals {
  key_hierarchy = {
    environment      = var.environment
    kms_root_key_ref = var.kms_root_key_ref
    branch_keys      = var.branch_keys
  }
}
