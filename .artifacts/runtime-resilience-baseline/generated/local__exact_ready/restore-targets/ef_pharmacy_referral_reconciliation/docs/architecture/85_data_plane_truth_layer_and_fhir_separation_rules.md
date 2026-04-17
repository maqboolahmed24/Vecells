# 85 Data Plane Truth Layer And FHIR Separation Rules

        ## Non-negotiable Rules

        - Transactional domain truth and FHIR representation truth remain separate stores, access policies, and identifier namespaces.
        - `sid_command_api` is the only direct writer of transactional domain truth.
        - FHIR representation rows materialize only through published mapping contracts and compiler-owned write seams.
        - Browsers, published gateway surfaces, and shell delivery workloads remain blocked from both stores.
        - Projection rebuilds and read models stay derived from canonical events and published projection contracts, not direct domain or FHIR joins.

        ## Domain Schema Catalog

        | Schema ref | Purpose | Bootstrap tables |
        | --- | --- | --- |
        | `schema_request_control` | Request control and lineage | `submission_envelopes`, `submission_promotion_records`, `request_lineages`, `episodes`, `requests` |
| `schema_identity_access` | Identity bindings and access grants | `identity_bindings`, `patient_links`, `access_grants`, `access_grant_redemptions`, `access_grant_supersessions` |
| `schema_contact_and_duplicate` | Reachability, duplicate review, and repair | `contact_route_snapshots`, `reachability_observations`, `duplicate_clusters`, `duplicate_pair_evidence` |
| `schema_mutation_control` | Mutation gates, leases, and settlements | `request_lifecycle_leases`, `lineage_fences`, `command_action_records`, `command_settlement_records` |
| `schema_queue_and_reservation` | Queue ranking and reservation authority | `queue_rank_plans`, `queue_rank_snapshots`, `reservation_fence_records`, `capacity_reservations`, `external_confirmation_gates` |
| `schema_release_and_closure` | Release trust, closure, and lifecycle control | `request_closure_records`, `release_approval_freezes`, `channel_release_freezes`, `assurance_slice_trust_records` |
| `schema_evidence_and_safety` | Evidence backbone and safety assimilation | `evidence_capture_bundles`, `evidence_derivation_packages`, `evidence_snapshots`, `safety_assimilation_runs` |
| `schema_operational_metadata` | Bootstrap metadata and migration bookkeeping | `schema_migration_history`, `runtime_store_manifest_publications`, `tenant_slice_registry` |

        ## Access Policy Matrix

        | Policy | Service identity | Mode | Allowed operations |
        | --- | --- | --- | --- |
        | `ap_domain_command_writer` | `sid_command_api` | `read_write` | `aggregate_write`, `settlement_persist`, `blocker_freeze`, `schema_bootstrap_read` |
| `ap_domain_assurance_reader` | `sid_assurance_control` | `read_only` | `restore_evidence_read`, `closure_diagnostic_read`, `lease_drift_review` |
| `ap_domain_projection_blocked` | `sid_projection_worker` | `blocked` | `blocked` |
| `ap_domain_integration_blocked` | `sid_integration_dispatch` | `blocked` | `blocked` |
| `ap_fhir_command_materializer` | `sid_command_api` | `read_write` | `representation_set_materialize`, `resource_record_supersede`, `exchange_bundle_stage` |
| `ap_fhir_integration_bundle_reader` | `sid_integration_dispatch` | `read_only` | `exchange_bundle_read`, `representation_receipt_review` |
| `ap_fhir_assurance_reader` | `sid_assurance_control` | `read_only` | `representation_parity_review`, `bundle_audit_read` |
| `ap_fhir_projection_blocked` | `sid_projection_worker` | `blocked` | `blocked` |

        ## Separation Matrix

        | Binding | Store family | Focus area | Binding state | Access posture | Identifier namespace rule |
        | --- | --- | --- | --- | --- | --- |
        | `sep_domain_request_lifecycle_authority` | `domain` | `request_lifecycle` | `writable_authority` | `command_write` | aggregate_id and tenant tuple remain distinct from FHIR logicalId/versionId. |
| `sep_domain_identity_and_grant_authority` | `domain` | `identity_access` | `writable_authority` | `command_write` | access_grant_token_material and patient identity evidence do not become FHIR identifiers. |
| `sep_domain_settlement_and_reservation_authority` | `domain` | `settlement_and_reservation` | `writable_authority` | `command_write` | reservation keys remain Vecells internal consistency keys, never public resource identifiers. |
| `sep_domain_assurance_read_only` | `domain` | `restore_and_diagnostics` | `warm_standby` | `assurance_read` | diagnostic snapshots preserve original identifiers and tuple hashes without rewriting them. |
| `sep_domain_projection_not_source` | `domain` | `projection_boundary` | `warm_standby` | `internal_only` | projection keys and cache tuples remain derived, not authoritative. |
| `sep_fhir_mapping_contract_gate` | `fhir` | `mapping_contracts` | `derived_materialization` | `mapping_only` | FHIR logicalId and versionId remain representation identifiers, never aggregate primary keys. |
| `sep_fhir_resource_version_supersession` | `fhir` | `resource_versioning` | `derived_materialization` | `mapping_only` | contract version refs and resource version ids stay separate from aggregate version ids. |
| `sep_fhir_exchange_bundle_read_only_to_integrations` | `fhir` | `bundle_exports` | `derived_materialization` | `mapping_only` | bundle ids are export artefacts, not request or appointment identifiers. |
| `sep_fhir_assurance_parity_review` | `fhir` | `assurance_review` | `warm_standby` | `assurance_read` | parity witness ids join domain and FHIR tuples without collapsing their namespaces. |
| `sep_fhir_not_projection_query_source` | `fhir` | `projection_boundary` | `warm_standby` | `internal_only` | projection cache keys remain distinct from FHIR identifiers and bundle refs. |

        ## FHIR Store Contract Inputs

        - Persistence tables: `fhir_representation_contracts`, `fhir_representation_sets`, `fhir_resource_records`, `fhir_exchange_bundles`
        - Schema refs: `packages/fhir-mapping/schemas/fhir-representation-set.schema.json`, `packages/fhir-mapping/schemas/fhir-resource-record.schema.json`, `packages/fhir-mapping/schemas/fhir-exchange-bundle.schema.json`
        - Representation contract count: `13`
