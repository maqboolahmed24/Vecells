variable "environments" {
  type = map(object({
    broker_ref          = string
    stream_refs         = list(string)
    queue_refs          = list(string)
    dlq_retention_hours = number
  }))
}
