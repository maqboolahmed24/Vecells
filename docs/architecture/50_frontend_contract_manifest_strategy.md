# 50 Frontend Contract Manifest Strategy

## Purpose

Define the canonical FrontendContractManifest strategy so every browser-visible Vecells surface consumes one generated authority tuple for route, runtime, design, projection, cache, accessibility, automation, and recovery posture.

## Summary

- Active manifests: `9`
- Browser-visible route families covered exactly once: `19`
- Projection query contracts: `19`
- Mutation command contracts: `19`
- Live update channel contracts: `15`

## Manifest Generation Law

- One active manifest row groups exactly one audience-surface class plus one declared browser-visible route-family set.
- Each browser-visible route family may appear in exactly one active manifest row.
- Grouped manifests may bind multiple gateway surfaces, but only one primary gatewaySurfaceRef is exposed as the manifest anchor.

## Gap Closures

- Browser authority is now generated from one manifest tuple instead of reconstructed from route files, gateway code, and cache conventions.
- Accessibility and automation coverage now travel with the manifest tuple instead of route-local ARIA or brittle selectors.
- Projection version compatibility is explicit at the route-family set level through one generated `ProjectionContractVersionSet`.
- Cache behavior is published as manifest authority, not a client-side convenience.
- Design publication and lint refs are bound into each manifest so seq_052 can harden bundle publication without changing manifest identity.

## Browser Posture Law

- `publishable_live` requires exact runtime publication, exact projection compatibility, a published design bundle, passing design lint, and complete accessibility coverage.
- `read_only` preserves summary truth while mutating or calm-trust posture is frozen.
- `recovery_only` preserves same-shell repair, replay, re-entry, or watch posture while live mutation remains frozen.
- `blocked` is reserved for deferred or withdrawn channel posture and missing required runtime/design tuples.

## Manifest Groups

| Audience Surface | Route Families | Primary Gateway | Browser Posture | Drift State |
| --- | --- | --- | --- | --- |
| Patient public entry | rf_intake_self_service, rf_intake_telephony_capture | gws_patient_intake_web | recovery_only | planned_publication_gap |
| Authenticated patient portal | rf_patient_home, rf_patient_requests, rf_patient_appointments, rf_patient_health_record, rf_patient_messages | gws_patient_home | read_only | design_publication_pending |
| Grant-scoped patient transaction and recovery | rf_patient_secure_link_recovery, rf_patient_embedded_channel | gws_patient_secure_link_recovery | recovery_only | deferred_channel_mixed |
| Clinical workspace | rf_staff_workspace, rf_staff_workspace_child | gws_clinician_workspace | read_only | planned_exactness_gap |
| Support routes | rf_support_ticket_workspace, rf_support_replay_observe | gws_support_ticket_workspace | recovery_only | replay_restore_guarded |
| Hub desk routes | rf_hub_queue, rf_hub_case_management | gws_hub_queue | read_only | planned_exactness_gap |
| Pharmacy console routes | rf_pharmacy_console | gws_pharmacy_console | read_only | planned_exactness_gap |
| Operations console routes | rf_operations_board, rf_operations_drilldown | gws_operations_board | recovery_only | watch_tuple_guarded |
| Governance and admin routes | rf_governance_shell | gws_governance_shell | read_only | release_parity_pending |

## Assumptions

- `ASSUMPTION_050_RUNTIME_PUBLICATION_REMAINS_PLACEHOLDER_UNTIL_SEQ_051`: Seq_050 binds every manifest to a stable RuntimePublicationBundle ref and AudienceSurfaceRuntimeBinding ref, but exact freeze and parity publication remains deferred to seq_051.
- `ASSUMPTION_050_DESIGN_BUNDLE_REFS_PREDECLARE_SEQ_052_GROUPING`: Seq_050 publishes stable design bundle and lint refs per audience-surface group so seq_052 can harden the bundle content without changing manifest identity.

## Generated Artifacts

- `data/analysis/frontend_contract_manifests.json`
- `data/analysis/frontend_route_to_query_command_channel_cache_matrix.csv`
- `data/analysis/frontend_accessibility_and_automation_profiles.json`
- `data/analysis/frontend_manifest_generation_rules.json`
- `packages/api-contracts/schemas/frontend-contract-manifest.schema.json`
- `docs/architecture/50_frontend_contract_studio.html`
