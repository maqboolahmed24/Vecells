variable "environment" {
  type = string
}

variable "preview_environment_ids" {
  type = list(string)
}

variable "runtime_tuple_hashes" {
  type = list(string)
}

variable "seed_pack_refs" {
  type = list(string)
}

locals {
  environments = [
    for index, preview_id in var.preview_environment_ids : {
      preview_environment_id = preview_id
      runtime_tuple_hash     = var.runtime_tuple_hashes[index]
      seed_pack_ref          = var.seed_pack_refs[index]
      environment            = var.environment
    }
  ]
}

output "preview_environment_ids" {
  value = [for row in local.environments : row.preview_environment_id]
}
