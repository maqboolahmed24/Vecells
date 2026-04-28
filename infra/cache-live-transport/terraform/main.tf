terraform {
  required_version = ">= 1.7.0"
}

locals {
  cache_manifest = jsondecode(file("${path.module}/../../data/analysis/cache_namespace_manifest.json"))
  live_manifest  = jsondecode(file("${path.module}/../../data/analysis/live_transport_topology_manifest.json"))
}

module "cache_plane" {
  source = "./modules/cache_plane"

  cache_namespace_refs = [for row in local.cache_manifest.cacheNamespaces : row.namespaceRef]
}

module "live_transport_gateway" {
  source = "./modules/live_transport_gateway"

  connection_registry_refs = [for row in local.live_manifest.connectionRegistries : row.connectionRegistryRef]
  transport_channel_refs   = [for row in local.live_manifest.liveChannels : row.transportChannelRef]
}
