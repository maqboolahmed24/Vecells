output "secret_namespace" {
  value = module.secret_namespace.namespace
}

output "key_hierarchy" {
  value = module.key_hierarchy.key_hierarchy
}

output "secret_class_bindings" {
  value = {
    for key, value in module.secret_class_binding : key => value.binding
  }
}

output "secret_access_policies" {
  value = {
    for key, value in module.secret_access_policy : key => value.policy
  }
}
