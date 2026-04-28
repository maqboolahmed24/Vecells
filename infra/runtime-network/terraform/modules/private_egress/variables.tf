
variable "environment" {
  type = string
}

variable "allowlists" {
  type = list(any)
}

variable "environment_overlays" {
  type = list(any)
}
