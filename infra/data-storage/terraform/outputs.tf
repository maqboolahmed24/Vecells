output "domain_store_realizations" {
  value = module.domain_transaction_store.store_realizations
}

output "fhir_store_realizations" {
  value = module.fhir_representation_store.store_realizations
}

output "domain_store_access" {
  value = module.domain_transaction_store.access_policies
}

output "fhir_store_access" {
  value = module.fhir_representation_store.access_policies
}
