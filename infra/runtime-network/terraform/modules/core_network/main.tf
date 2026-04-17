
locals {
  networks = {
    for placement in var.region_placements :
    placement.region_ref => {
      network_ref       = placement.network_ref
      uk_region_role    = placement.uk_region_role
      cidr_block        = placement.cidr_block
      nat_egress_ref    = placement.nat_egress_broker_ref
      trust_zone_refs   = var.trust_zone_refs
    }
  }
}
