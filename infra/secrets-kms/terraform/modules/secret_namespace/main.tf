locals {
  namespace = {
    environment      = var.environment
    namespace_id     = var.namespace_id
    backend_ref      = var.backend_ref
    kms_root_key_ref = var.kms_root_key_ref
  }
}
