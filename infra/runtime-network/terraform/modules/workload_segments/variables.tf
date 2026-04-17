
variable "environment" {
  type = string
}

variable "region_placements" {
  type = list(object({
    region_ref            = string
    uk_region_role        = string
    network_ref           = string
    cidr_block            = string
    nat_egress_broker_ref = string
    workload_segments     = list(any)
  }))
}
