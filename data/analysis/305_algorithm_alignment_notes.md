# 305 Algorithm Alignment Notes

## Local source-of-truth order

`seq_305` does not create new provider behavior. It binds observable evidence to the already-frozen booking capability model.

Primary local sources used:

1. `blueprint/phase-4-the-booking-engine.md`
2. `blueprint/phase-0-the-foundation-protocol.md`
3. `docs/architecture/283_provider_capability_matrix_and_binding_compiler.md`
4. `docs/architecture/291_staff_assisted_booking_api.md`
5. `ops/providers/304_provider_sandbox_registry.yaml`
6. `ops/providers/304_provider_callback_manifest.yaml`

## Claim-to-evidence mapping

| Capability dimension | Evidence source | Why it is sufficient |
| --- | --- | --- |
| action support (`search`, `book`, `cancel`, `reschedule`, `view`, `manage`, `request_staff_assist`, `launch_local_component`) | resolved `BookingCapabilityResolution` plus dated sandbox observation row | proves the active matrix row, binding hash, tuple hash, audience, and action scope stay aligned |
| patient self-service vs staff-assisted posture | provider capability row plus environment observation method | prevents self-service leakage from staff-only or degraded rows |
| async confirmation posture | capability row plus callback verification mode | shows whether confirmation is callback-led, read-after-write, or later proof only |
| GP linkage and local component requirements | prerequisite registry | keeps gating facts explicit instead of tribal knowledge |
| credential readiness | masked credential manifest | shows owner, expiry, and environment binding without exposing secrets |
| manual-bridge providers | provider-specific gap artifacts | keeps unsupported automation explicit and review-controlled |

## Evidence posture rules

- `browser_observed` is used only for the fully automated local-gateway twins.
- `document_observed` is used for supplier rows that remain behind a narrow manual bridge.
- `manual_attested` is used for the manual-assist network, where no supplier callback or portal mutation exists.

- `current` implies `verified`.
- `review_required` implies the evidence exists but cannot be treated as fully automated or silently current.
- `manual_attested` is reserved for the manual-assist row and never widened into self-service.

## Why tuple-level linkage matters

Every evidence row stores:

- `providerAdapterBindingRef`
- `providerAdapterBindingHash`
- `bookingCapabilityResolutionRef`
- `capabilityTupleHash`

That prevents evidence drift when a provider binding changes but a human still has an older screenshot or spreadsheet. If the binding hash changes, the evidence must be refreshed.

## Credential governance rules

- raw secret material is forbidden in tracked artifacts
- secret references are allowed only in the credential manifest
- browser proof shows masked fingerprints only
- expiry review is part of capability confidence, not an afterthought

## External reference support

Secondary support came from the same official references already relied on by the surrounding provider work:

- Interface Mechanism 1 API standards
- GP Connect: Appointment Management - FHIR API
- HL7 FHIR R4 Appointment
- HL7 FHIR R4 Slot
- NHS England directly bookable appointments guidance

These references inform capture discipline and environment posture. They do not override the local booking blueprint or the repository-owned capability matrix.
