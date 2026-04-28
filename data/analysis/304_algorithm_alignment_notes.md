# 304 Algorithm Alignment Notes

## Local contract alignment

Task `seq_304` is not allowed to redefine booking semantics. The control-plane artifacts in this task are derived from the already-frozen booking-core contracts and only add repeatable environment setup, callback registration, and verification posture.

Primary local anchors:

- `docs/architecture/279_phase4_provider_capability_matrix_and_adapter_seam.md`
- `docs/architecture/283_provider_capability_matrix_and_binding_compiler.md`
- `docs/architecture/287_booking_commit_and_confirmation_truth.md`
- `docs/architecture/292_booking_reconciliation_and_confirmation_worker.md`
- `packages/domains/booking/src/phase4-booking-capability-engine.ts`
- `services/command-api/src/replay-collision-authority.ts`

## Provider row to booking-core object map

| Provider row | Environment posture | Binding anchor | Callback / read truth path | Operational interpretation |
| --- | --- | --- | --- | --- |
| `PCM_279_OPTUM_IM1_PATIENT_V1` | `supported_test_candidate` | Current `providerAdapterBindingRef` and `providerAdapterBindingHash` derived from the capability engine | `authoritative_read_after_write` only | Patient-facing IM1 remains pairing-led. The setup system records portal prerequisites and read-after-write proof rather than claiming a supplier webhook that the local contract never promised. |
| `PCM_279_TPP_IM1_PATIENT_V1` | `supported_test_candidate` | Same binding compilation path as 279/283 | `authoritative_read_after_write` only | Patient IM1 keeps GP-linkage and pairing prerequisites explicit. No callback target is exposed because the booking truth chain still resolves through current binding plus authoritative read policy. |
| `PCM_279_TPP_IM1_TRANSACTION_V1` | `supported_test_candidate` with local component | Binding compiled for the local-component-gated row | Edge callback for the local component plus later authoritative read | The callback manifest here applies to the repo-owned local-component twin. It does not claim a generic public webhook for TPP estates. |
| `PCM_279_GP_CONNECT_EXISTING_V1` | `integration_candidate` | Binding compiled for the direct-care consumer row | Direct response and later read; no supplier callback | GP Connect is direct-care and staff-facing in local contract and official guidance. The setup manifest therefore models onboarding prerequisites, certificates, and environment labels, not a patient-facing webhook. |
| `PCM_279_LOCAL_GATEWAY_COMPONENT_V1` | `local_twin` and `sandbox_twin` | Binding compiled once per environment twin | Edge callback with replay-safe receipt checkpoints | This is the deterministic automation path. Bootstrap, verify, and reset all converge here, and Playwright proof runs against the local portal twin. |
| `PCM_279_MANUAL_ASSIST_ONLY_V1` | `ops_manual_twin` | Binding compiled for assisted-only routing | Manual settlement attestation only | The manifest makes the non-webhook posture explicit so manual assist never masquerades as automated supplier confirmation. |

## Booking-core objects the setup system must preserve

| Object | 304 responsibility |
| --- | --- |
| `ProviderCapabilityMatrixRow` | Never edited here. Used as the immutable source for supported rows and tuple identity. |
| `BookingProviderAdapterBindingSnapshot` | Re-resolved locally during materialization so every sandbox row carries the current `providerAdapterBindingRef`, `bindingHash`, and `adapterContractProfileRef`. |
| Capability tuple / route tuple | Indirectly preserved by resolving bindings through the capability engine with stable route, publication, and governing-object markers. |
| `AdapterDispatchAttempt` | Used in callback verification smoke for the supplier-callback rows. |
| `AdapterReceiptCheckpoint` | Used to prove accepted receipt, semantic replay rejection, and stale ordering rejection. |
| Confirmation policy | Carried onto every sandbox row so operators can tell whether the row is callback-led, read-after-write, or manual only. |

## External references and their effect

Official sources checked on 20 April 2026:

- [Interface Mechanism 1 API standards](https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards)
- [Interface mechanisms guidance](https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance)
- [IM1 Pairing integration](https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration)
- [GP Connect: Appointment Management - FHIR API](https://digital.nhs.uk/developer/api-catalogue/gp-connect-appointment-management-fhir)
- [FHIR R4 Appointment](https://hl7.org/fhir/r4/appointment.html)
- [FHIR R4 Slot](https://hl7.org/fhir/r4/slot.html)

What they sharpened:

- IM1 remains supplier-pairing based, with supplier-specific APIs and supported-test phases before assurance. That supports the manual-bridge posture for the real Optum and TPP rows rather than pretending CI can mutate those portals directly.
- NHS guidance says the Transaction API may require a consumer component on a local practice machine, and appointment functionality may only be available through GP Connect. Inference: the repo can automate the local-component twin and its edge callback proof, but must not overstate generic transaction-API appointment webhook support.
- GP Connect Appointment Management is not patient facing, requires HSCN access, JWT, and TLS mutual authentication, and is used by direct-care systems. That aligns with keeping the GP Connect row as an integration/onboarding manifest with no supplier callback registration claim.
- FHIR Appointment and Slot remain the normative model for booking truth, slot occupancy, and later authoritative reads, which is why read-after-write rows still bind to the same confirmation and reconciliation chain as callback rows.

## Decisions taken

1. Only the `vecells_local_gateway` twins are treated as fully automated browser-mutable environments.
2. IM1 and GP Connect real candidate rows remain source-controlled and explicit, but behind manual bridges with masked evidence only.
3. Callback verification proof is accepted only when it is simultaneously:
   - bound to the current `providerAdapterBindingHash`
   - tied to the intended environment label
   - replay-safe through the receipt-checkpoint authority
4. No row stores raw credentials, certificate bodies, or portal secrets. Only references and masked fingerprints are emitted.

## Residual risk

The remaining risk is operational rather than algorithmic: real supplier candidate tenants still need human-controlled setup until sanctioned automation access exists. The local portal twin closes the repeatability gap for configuration logic and replay-safe callback verification, but not the contractual gap of supplier-issued non-production access.
