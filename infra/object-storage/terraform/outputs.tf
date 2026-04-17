output "namespace_plan" {
  value = module.object_storage_namespace.namespace_plan
}

output "bucket_plans" {
  value = {
    for storage_class_ref, module_ref in module.storage_class_buckets :
    storage_class_ref => module_ref.bucket_plan
  }
}
