variable "environment" {
  type = string
}

variable "preview_ttl_hours" {
  type = list(number)
}

variable "preview_states" {
  type = list(string)
}

locals {
  preview_ttl_states = [
    for index, ttl in var.preview_ttl_hours : {
      environment = var.environment
      ttl_hours   = ttl
      state       = var.preview_states[index]
    }
  ]
}

output "preview_ttl_states" {
  value = local.preview_ttl_states
}
