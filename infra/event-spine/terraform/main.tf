terraform {
  required_version = ">= 1.7.0"
}

locals {
  broker_manifest = jsondecode(file("${path.module}/../../data/analysis/event_broker_topology_manifest.json"))
}

module "broker_namespace" {
  for_each = var.environments
  source = "./modules/broker_namespace"

  environment_ring = each.key
  broker_ref        = each.value.broker_ref
  stream_refs       = each.value.stream_refs
  queue_refs        = each.value.queue_refs
  dlq_retention_hours = each.value.dlq_retention_hours
}

module "subscription_group" {
  for_each = {
    for binding in local.broker_manifest.subscriptionBindings :
    binding.subscriptionRef => binding
  }
  source = "./modules/subscription_group"

  subscription_ref = each.value.subscriptionRef
  stream_ref       = each.value.streamRef
  queue_ref        = each.value.queueRef
  consumer_group_ref = each.value.consumerGroupRef
  retry_posture    = each.value.retryPosture
  dlq_ref          = each.value.dlqRef
  matched_event_count = each.value.matchedEventCount
}
