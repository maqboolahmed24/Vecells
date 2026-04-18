# 279 Phase 4 capability tuple trust and confirmation gate rules

This pack freezes the fail-closed behaviour for booking capability.

## Trust and publication prerequisites

Dynamic resolution must evaluate at minimum:

- GP-linkage status
- required local-consumer state
- supplier degradation
- runtime publication posture
- assurance-slice trust posture
- route-intent tuple freshness
- governing-object version freshness

If those prerequisites drift, capability cannot survive on cache or route memory. The tuple must supersede.

## Confirmation gate rules

- accepted-for-processing is never equivalent to booked
- weak supplier acknowledgement must remain pending, disputed, or gate-bound until the declared confirmation policy allows durable truth
- a binding without an authoritative-read or confirmation policy is invalid when the path supports async confirmation or dispute recovery

## Least-privilege configuration

- matrix rows are static published inventory
- bindings compile exact operation contracts but may not own business meaning
- resolution owns live capability meaning
- projection owns audience-safe exposure only

This keeps adapter code from reintroducing ranking ownership, patient copy ownership, or silent self-service widening.

## Required recovery modes

- `linkage_required`: preserve anchor, route to linkage repair
- `local_component_required`: preserve anchor, route to component launch
- `degraded_manual`: freeze writable control and promote manual fallback
- `recovery_only`: preserve last safe summary and apply bounded read-only recovery
- `blocked`: hide unsupported mutation and explain the blocked reason class

## Source alignment

These rules are grounded in the local blueprint and supported by the NHS IM1, GP Connect, DCB0129, DCB0160, and HL7 sources recorded in the 279 analysis notes.
