# 350 Dispatch Transport And Retry Expiry Logic

`par_350` lands the executable Phase 6 dispatch layer. One frozen `PharmacyReferralPackage` now resolves to one governed `PharmacyDispatchPlan`, one current `PharmacyDispatchAttempt` family, one `DispatchProofEnvelope`, one `PharmacyDispatchSettlement`, and one `PharmacyDispatchTruthProjection`.

## Runtime shape

- `TransportAssuranceProfile` is seeded from the frozen `343` registry and is the only source of truth for proof deadlines, contradiction thresholds, confidence thresholds, and manual-review posture.
- `DispatchAdapterBinding` is compiled from `transportMode`, the selected `PharmacyProviderCapabilitySnapshot`, the public adapter version, and the allowed artifact classes for that transport family.
- `ReferralArtifactManifest` is compiled from the frozen package artifacts plus the persisted governance decisions from `349`; the hash is now independent of transient plan ids so retries stay on the same governed family.
- `PharmacyDispatchPlan` hashes only the frozen package tuple, payload, transport profile, binding, and route tuple. That keeps transport drift from silently widening retries into a new effect scope.
- `PharmacyDispatchAttempt` binds the plan to the canonical `IdempotencyRecord`, `AdapterDispatchAttempt`, and current `ExternalConfirmationGate`.

## Send and proof law

1. Resolve the current frozen package, selected provider, current choice tuple, and consent checkpoint.
2. Reject transport execution unless the current consent checkpoint still matches the frozen package fingerprint and selection binding.
3. Compile one plan and one manifest from the frozen package.
4. Reuse the current live attempt family when the plan hash, package hash, and route tuple hash are unchanged.
5. Open a fresh attempt only when the governing tuple changes.
6. Record immediate transport acknowledgement separately from provider acceptance and authoritative proof.
7. Keep the case in `dispatch_pending` and the truth in `pending_ack` until authoritative proof satisfies the current `DispatchProofEnvelope`.

## Proof envelope

The envelope keeps four distinct evidence lanes:

- `transport_acceptance`
- `provider_acceptance`
- `delivery`
- `authoritative`

The state machine is:

- `pending`: there is no satisfying authoritative proof yet.
- `satisfied`: authoritative proof exists for the current attempt, the active thresholds pass, and the current `ExternalConfirmationGate` confirms.
- `disputed`: contradiction threshold breached or contradictory evidence exists.
- `expired`: proof deadline elapsed without satisfying authoritative proof.

The derived risk and settlement mapping is intentionally fail-closed:

- `pending` -> `pending_ack`
- `satisfied` -> `live_referral_confirmed`
- `disputed` or `expired` -> `reconciliation_required`
- tuple or consent drift -> `stale_choice_or_consent`

## Retry and resend

- identical submit commands replay onto the same live attempt without a second provider-side send
- explicit resend commands stay on the same governed attempt family and widen the outbound reference set instead of inventing a parallel calm truth
- retries do not claim success from send acknowledgement alone
- expiry does not close the case as calm referral truth; it widens to recovery posture only

## Integration points

- `phase6-pharmacy-case-kernel.ts`
  dispatch is now lawful from `dispatch_pending` as well as `package_ready` or `consent_pending`, which is required for governed resend on the same live family
- `phase6-pharmacy-referral-package-engine.ts`
  dispatch reads the frozen package, artifact set, and seeded `PharmacyCorrelationRecord` from `349`
- `packages/domains/identity_access/src/index.ts`
  dispatch consumes the public replay-collision and reservation-confirmation backbones only through the public export surface
