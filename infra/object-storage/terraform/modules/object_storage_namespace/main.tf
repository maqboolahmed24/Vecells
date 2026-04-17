locals {
  namespace_plan = {
    namespace_id         = var.namespace_id
    environment          = var.environment
    private_endpoint_ref = var.private_endpoint_ref
    kms_mode             = var.kms_mode
    public_access        = "forbidden"
  }
}
