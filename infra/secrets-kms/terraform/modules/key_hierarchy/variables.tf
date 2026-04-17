variable "environment" {
  type = string
}

variable "kms_root_key_ref" {
  type = string
}

variable "branch_keys" {
  type = list(any)
}
