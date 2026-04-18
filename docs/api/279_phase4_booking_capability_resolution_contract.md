# 279 Phase 4 booking capability resolution contract

This contract defines how patient and staff booking surfaces must consume one current capability verdict.

## Contract split

1. `ProviderCapabilityMatrix`: static inventory only
2. `BookingProviderAdapterBinding`: one compiled adapter seam
3. `BookingCapabilityResolution`: live tuple verdict
4. `BookingCapabilityProjection`: audience-safe actionability

Patient and staff shells must render actionability only from `BookingCapabilityProjection`. Supplier names, remembered slot state, appointment status, or copied feature flags may not keep controls armed.

## Mandatory tuple fields

- `tenantId`
- `practiceRef`
- `organisationRef`
- `supplierRef`
- `integrationMode`
- `deploymentType`
- `selectionAudience`
- `requestedActionScope`
- `providerCapabilityMatrixRef`
- `capabilityMatrixVersionRef`
- `providerAdapterBindingRef`
- `providerAdapterBindingHash`
- `adapterContractProfileRef`
- `gpLinkageCheckpointRef`
- `localConsumerCheckpointRef`
- `routeTuple.*`
- `governingObjectDescriptorRef`
- `governingObjectRef`
- `governingObjectVersionRef`
- `parentAnchorRef`
- `capabilityTupleHash`

## Projection rules

- patient and staff projections are allowed to differ only by audience-safe action exposure
- they may not disagree on matrix row, binding, policy seam, or tuple hash
- patient controls may be live only when the underlying resolution is `live_self_service`
- staff controls may widen to `live_staff_assist`, but that does not upgrade patient posture
- `assisted_only`, `linkage_required`, and `local_component_required` must preserve the selected anchor and promote the declared fallback instead of a generic failure view
- `recovery_only` resolves to projection `surfaceState = recovery_required`

## Blocked and fallback classes

Blocked-action reason codes and fallback actions are machine-readable in the resolution and projection schemas. Unsupported or drifted paths therefore degrade intentionally rather than disappearing accidentally.

## One current authoritative seam

The resolution must point at:

- one `providerCapabilityMatrixRef`
- one `providerAdapterBindingRef`
- one `adapterContractProfileRef`
- one `dependencyDegradationProfileRef`
- one `authoritativeReadAndConfirmationPolicyRef`

If any of those refs drift, the capability tuple is stale.

## Confirmation gate requirements

Async or dispute-capable paths must always name a confirmation policy. Missing policy seams are invalid by contract.
