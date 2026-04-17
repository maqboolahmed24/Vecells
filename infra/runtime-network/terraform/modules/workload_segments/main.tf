
locals {
  segment_map = merge([
    for placement in var.region_placements : {
      for segment in placement.workload_segments :
      segment.runtime_workload_family_id => merge(segment, {
        region_ref     = placement.region_ref
        uk_region_role = placement.uk_region_role
        network_ref    = placement.network_ref
      })
    }
  ]...)
}
