
output "network_foundation_ref" {
  value = local.environment_network.network_foundation_ref
}

output "core_network" {
  value = module.core_network.networks
}

output "workload_segments" {
  value = module.workload_segments.segment_map
}

output "private_egress" {
  value = module.private_egress.allowlist_map
}
