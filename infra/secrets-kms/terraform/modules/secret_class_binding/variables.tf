variable "environment" {
  type = string
}

variable "secret_class_ref" {
  type = string
}

variable "key_branch_ref" {
  type = string
}

variable "access_policy_ref" {
  type = string
}

variable "rotation_row" {
  type = any
}
