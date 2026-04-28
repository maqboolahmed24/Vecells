variable "environment" {
  type = string
  validation {
    condition     = contains(["local", "ci-preview", "integration", "preprod", "production"], var.environment)
    error_message = "environment must be one of local, ci-preview, integration, preprod, or production"
  }
}
