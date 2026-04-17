variable "environment_ring" { type = string }
variable "broker_ref" { type = string }
variable "stream_refs" { type = list(string) }
variable "queue_refs" { type = list(string) }
variable "dlq_retention_hours" { type = number }
