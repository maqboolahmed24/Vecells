output "broker_namespace_refs" {
  value = { for key, module_ref in module.broker_namespace : key => module_ref.namespace_ref }
}

output "subscription_refs" {
  value = { for key, module_ref in module.subscription_group : key => module_ref.subscription_ref }
}
