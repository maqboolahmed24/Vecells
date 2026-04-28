# 283 Capability Tuple Trust And Confirmation Gate Rules

This slice freezes the runtime safety law for booking capability evaluation.

## Fail-closed prerequisites

Capability evaluation must check at minimum:

- GP-linkage posture
- required local-consumer posture
- supplier degradation posture
- runtime publication posture
- assurance trust posture
- route tuple freshness
- governing object version and parent anchor

linkage or local-component drift may not degrade into generic no-appointments copy.

## Stale cache posture

stale capability cache must fall to `recovery_only` or `blocked`.
Writable browser or worker state may not survive tuple drift on cache memory alone.

## Confirmation and booking truth

accepted-for-processing is never equivalent to booked.
Capability and manage exposure may reference confirmation policy seams, but they may not silently upgrade acknowledgement into booked truth.

## Adapter boundary

translation is adapter-owned; booking meaning is booking-core-owned.
The binding may normalize protocols, declare manage support, and name confirmation posture, but it may not emit patient-facing ranking, reassurance, or calm booking semantics.

## Structured diagnostics

Blocked reasons and fallback ids are persisted machine-readably so later UI, support, and booking-flow tracks can explain degraded posture without PHI leakage.

## Least-privilege publication

The matrix row is static inventory.
The binding is compiled translation-only.
The resolution owns live tuple meaning.
The projection owns audience-safe exposure.
