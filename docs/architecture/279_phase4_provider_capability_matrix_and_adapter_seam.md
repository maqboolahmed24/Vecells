# 279 Phase 4 provider capability matrix and adapter seam

This pack freezes the distinction between inventory, binding, resolution, and projection for Booking Phase 4.

- `ProviderCapabilityMatrix` is the static published capability inventory.
- `BookingProviderAdapterBinding` is the only legal compiled adapter seam for one current matrix row.
- `BookingCapabilityResolution` is the live tuple verdict for one audience, one action scope, and one governing object version.
- `BookingCapabilityProjection` is the audience-safe widening of one current resolution.

Those four authorities are intentionally separate. Later work may not collapse them into supplier labels, route-local booleans, or appointment-status shortcuts.

## Static inventory

| Supplier | Mode | Deployment | Sample scopes | Primary degradation | Confirmation policy |
| --- | --- | --- | --- | --- | --- |
| Optum EMIS Web | im1_patient_api | internet_patient_shell | search_slots, book_slot, cancel_appointment, reschedule_appointment ... | DDP_279_PATIENT_LINKAGE_AND_SUPPORT | POLICY_279_IM1_PATIENT_READ_AFTER_WRITE |
| TPP SystmOne | im1_patient_api | internet_patient_shell | search_slots, book_slot, cancel_appointment, reschedule_appointment ... | DDP_279_PATIENT_LINKAGE_AND_SUPPORT | POLICY_279_IM1_PATIENT_READ_AFTER_WRITE |
| TPP SystmOne | im1_transaction_api | practice_local_component | search_slots, view_appointment, launch_local_component, request_staff_assist | DDP_279_LOCAL_COMPONENT_RECOVERY | POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE |
| GP Connect appointment management | gp_connect_existing | hscn_direct_care_consumer | search_slots, book_slot, cancel_appointment, reschedule_appointment ... | DDP_279_ASSISTED_ONLY_HANDOFF | POLICY_279_GP_CONNECT_PROVIDER_REFERENCE |
| Vecells local gateway | local_gateway_component | practice_local_gateway | search_slots, book_slot, cancel_appointment, view_appointment ... | DDP_279_LOCAL_COMPONENT_RECOVERY | POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE |
| Manual assist network | manual_assist_only | ops_manual_assist | view_appointment, view_booking_summary, request_staff_assist | DDP_279_DEGRADED_MANUAL_RECOVERY | POLICY_279_MANUAL_CONFIRMATION_GATE |

The matrix is static. It publishes the booking ceiling for one supplier, integration mode, deployment type, practice context, and assurance posture. It is not itself the UI or mutation authority.

## Deterministic binding compilation

The binding compiler is frozen to this order:

1. resolve one exact active matrix row by `tenantId`, `practiceRef`, `supplierRef`, `integrationMode`, and `deploymentType`
2. verify that the requested `actionScope` belongs to that row
3. compile exactly one binding using the row's `primaryDependencyDegradationProfileRef`, the integration-mode-specific `AdapterContractProfile`, and the row's `authoritativeReadAndConfirmationPolicyRef`
4. hash the canonical compiled binding payload to `bindingHash`
5. reject the tuple if more than one live binding could exist for the same exact key without a more specific owner rule

| Binding | Matrix row | Adapter profile | Degradation profile | Confirmation policy | State |
| --- | --- | --- | --- | --- | --- |
| BIND_279_OPTUM_IM1_PATIENT_V1 | PCM_279_OPTUM_IM1_PATIENT_V1 | ACP_279_IM1_PATIENT_SELF_SERVICE | DDP_279_PATIENT_LINKAGE_AND_SUPPORT | POLICY_279_IM1_PATIENT_READ_AFTER_WRITE | live |
| BIND_279_TPP_IM1_PATIENT_V1 | PCM_279_TPP_IM1_PATIENT_V1 | ACP_279_IM1_PATIENT_SELF_SERVICE | DDP_279_PATIENT_LINKAGE_AND_SUPPORT | POLICY_279_IM1_PATIENT_READ_AFTER_WRITE | live |
| BIND_279_TPP_IM1_TRANSACTION_V1 | PCM_279_TPP_IM1_TRANSACTION_V1 | ACP_279_IM1_TRANSACTION_LOCAL_COMPONENT | DDP_279_LOCAL_COMPONENT_RECOVERY | POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE | live |
| BIND_279_GP_CONNECT_EXISTING_V1 | PCM_279_GP_CONNECT_EXISTING_V1 | ACP_279_GP_CONNECT_APPOINTMENT_MANAGEMENT | DDP_279_ASSISTED_ONLY_HANDOFF | POLICY_279_GP_CONNECT_PROVIDER_REFERENCE | live |
| BIND_279_LOCAL_GATEWAY_COMPONENT_V1 | PCM_279_LOCAL_GATEWAY_COMPONENT_V1 | ACP_279_LOCAL_GATEWAY_COMPONENT | DDP_279_LOCAL_COMPONENT_RECOVERY | POLICY_279_LOCAL_GATEWAY_EXTERNAL_GATE | live |
| BIND_279_MANUAL_ASSIST_ONLY_V1 | PCM_279_MANUAL_ASSIST_ONLY_V1 | ACP_279_MANUAL_ASSIST_ROUTER | DDP_279_DEGRADED_MANUAL_RECOVERY | POLICY_279_MANUAL_CONFIRMATION_GATE | live |

`BookingProviderAdapterBinding` remains translation-only. It may own search syntax, temporal normalization, revalidation, commit dispatch, authoritative read-after-write proof, and manage support. It may not own ranking, fallback choice, or patient-visible meaning.

## Capability tuple and drift rules

The canonical tuple binds:

- tenant, practice, organisation, supplier
- integration mode and deployment type
- audience plus requested `actionScope`
- `providerCapabilityMatrixRef` and version
- `providerAdapterBindingRef`, `providerAdapterBindingHash`, and `adapterContractProfileRef`
- GP-linkage and local-consumer checkpoints
- trust, publication, and route tuple
- governing object, governing-object version, and parent anchor

`capabilityTupleHash` is lower-hex SHA-256 over canonical JSON using the ordered field list published in the resolution schema. Any change in supplier state, matrix version, trust posture, publication posture, route tuple, or governing-object version supersedes stale capability.

## Capability states

| Capability state | Primary recovery profile | Required shell behaviour |
| --- | --- | --- |
| live_self_service | n/a | patient self-service live |
| live_staff_assist | n/a | staff-assisted live |
| assisted_only | DDP_279_ASSISTED_ONLY_HANDOFF | patient anchor preserved, assisted path promoted |
| linkage_required | DDP_279_PATIENT_LINKAGE_AND_SUPPORT | same-shell linkage repair |
| local_component_required | DDP_279_LOCAL_COMPONENT_RECOVERY | same-shell component launch |
| degraded_manual | DDP_279_DEGRADED_MANUAL_RECOVERY | manual or hub fallback |
| recovery_only | DDP_279_PUBLICATION_AND_TRUST_FREEZE | read-only recovery in place |
| blocked | n/a | summary only and explicit blocked reasons |

## Confirmation and authoritative-read law

The confirmation registry freezes one policy seam per binding:

- `durable_provider_reference` means the supplier has produced durable authoritative proof
- `read_after_write` means booking truth must be proven through immediate authoritative follow-up, not optimistic acknowledgement
- `gate_required` means weak processing acceptance is never enough by itself; the branch remains pending or gate-bound

Accepted-for-processing is not booked truth. This pack closes that gap explicitly.

## Support references

Current NHS, HL7, and frontend-reference review notes are recorded in:

- [279 external reference notes](/Users/test/Code/V/data/analysis/279_external_reference_notes.md)
- [279 visual reference notes](/Users/test/Code/V/data/analysis/279_visual_reference_notes.json)

The local blueprint remained authoritative wherever support sources were broader than the repo's control law.

## Typed gaps

Typed later-owned gaps are published in [279 capability gap log](/Users/test/Code/V/data/analysis/279_capability_gap_log.json).
