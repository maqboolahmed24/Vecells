locals {
  realizations = {
    for placement in var.region_placements :
    placement.store_realization_id => {
      endpoint_ref      = placement.endpoint_ref
      network_ref       = placement.network_ref
      subnet_cidr       = placement.subnet_cidr
      binding_state     = placement.binding_state
      access_posture    = placement.access_posture
      bootstrap_sql_ref = one(placement.bootstrap_sql_refs)
    }
  }
}
