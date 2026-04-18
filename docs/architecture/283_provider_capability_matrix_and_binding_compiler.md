# 283 Provider Capability Matrix And Binding Compiler

`par_283` implements the executable Phase 4 capability engine against the contracts frozen in `279`, the parallel gate in `281`, and the durable booking-case lineage landed in `282`.

## Four-layer ownership

This slice keeps the four-layer model explicit:

- `ProviderCapabilityMatrix` is static published inventory
- `BookingProviderAdapterBinding` is the compiled translation seam for the exact provider tuple
- `BookingCapabilityResolution` is the current dynamic tuple verdict
- `BookingCapabilityProjection` is the audience-safe action surface

BookingCapabilityResolution is the current dynamic tuple verdict.

Only the compiled binding may choose the adapter path.
Supplier name alone may not choose the adapter path.

## Exact matrix and binding law

The engine supports the frozen integration-mode vocabulary exactly:

- `im1_patient_api`
- `im1_transaction_api`
- `gp_connect_existing`
- `local_gateway_component`
- `manual_assist_only`

For any legal live tuple the compiler produces exactly one current:

- matrix row
- adapter contract profile
- dependency degradation profile
- authoritative-read and confirmation policy seam
- binding hash

Ambiguous or unsupported tuples fail closed instead of compiling multiple partial truths.

## Dynamic resolution

`BookingCapabilityResolution` evaluates the exact runtime tuple:

- tenant, practice, organisation, and supplier context
- integration mode and deployment type
- audience and requested action scope
- matrix version and compiled binding hash
- GP-linkage and local-consumer checkpoints
- supplier degradation, publication, and trust posture
- route tuple
- governing object, governing-object version, and parent anchor

The result uses the frozen capability-state vocabulary:

- `live_self_service`
- `live_staff_assist`
- `assisted_only`
- `linkage_required`
- `local_component_required`
- `degraded_manual`
- `recovery_only`
- `blocked`

## Drift and supersession

Tuple drift supersedes the old resolution aggressively. The engine invalidates currentness when:

- matrix version changes
- binding hash changes
- publication or assurance trust drifts
- GP linkage or local component posture drifts
- governing object or parent-anchor tuple drifts

The resolver keeps current and superseded refs separate, so consumers can inspect stale evidence without mutating through it.

## Projection boundary

`BookingCapabilityProjection` may vary only by audience-safe action exposure.
Patient and staff consumers do not get to disagree on matrix row, binding, confirmation policy seam, or tuple hash.

Patient exposure stays narrow:

- patient controls are live only from `live_self_service`
- staff exposure may widen to `live_staff_assist`
- patient requests on non-self-service rows degrade to `assisted_only`, `linkage_required`, `local_component_required`, `degraded_manual`, `recovery_only`, or `blocked`

## Confirmation and booking truth

The capability engine does not claim booked truth.
accepted-for-processing is never equivalent to booked.
Authoritative-read and confirmation policy refs stay explicit so later slot, commit, confirmation, and manage tracks cannot infer calm booking truth from adapter acknowledgements alone.

## Event ownership

`booking.capability.resolved` remains the public settlement event for capability evaluation.
booking.capability.resolved remains the public settlement event for capability evaluation.
The event is emitted only when a new current tuple is persisted. Exact-tuple replay returns the stored current resolution and projection without duplicating the event.

## Later-owned seams

This slice intentionally does not own:

- slot search normalization
- ranking and offer orchestration
- reservation or hold truth
- booking commit and compensation
- manage command execution
- waitlist, reminder, or assisted-booking runtime flows

Those later seams are recorded in [PHASE4_PARALLEL_INTERFACE_GAP_CAPABILITY_ENGINE.json](/Users/test/Code/V/data/analysis/PHASE4_PARALLEL_INTERFACE_GAP_CAPABILITY_ENGINE.json).
