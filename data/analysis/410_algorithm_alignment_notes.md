# 410 Algorithm Alignment Notes

## Blueprint Alignment

The implementation follows Phase 8A and the Phase 8 implementation rules in `blueprint/phase-8-the-assistive-layer.md`:

- `AssistiveCapabilityManifest` and `IntendedUseProfile` are first-class runtime objects.
- `InvocationEligibilityService` evaluates route family, actor role, subject scope, evidence class, intended-use policy, release state, kill-switch state, publication state, runtime bundle, and composition policy before a grant can be minted.
- `AssistiveInvocationGrant` is per-run and binds capability, route, actor, subject scope, acting context, evidence classes, visibility ceiling, compiled policy bundle, review version, lineage fence, entity continuity key, surface binding, rollout verdict, publication refs, recovery disposition, telemetry fence, expiry, and grant state.
- `AssistiveCompositionPolicyEngine` enforces allowed upstream capabilities, allowed derived artifact types, blocked downstream object types, loop detection, and max chain depth.
- `AssistiveReleaseStateResolver` is the release-mode truth for shadow, visible summary, visible insert, observe-only, blocked, and withdrawn posture.
- `AssistiveKillSwitchService` materializes current `AssistiveKillSwitchState`; runtime decisions do not infer live safety posture from historical operator commands.
- `AssistiveRunSettlementService` partitions renderable and blocked artifacts and fails closed on schema or policy validation errors.

## Invocation Gate

The implemented admission algorithm is:

1. validate frozen route, actor, subject-scope, evidence-class, surface, publication, policy, review, and lineage refs
2. resolve `AssistiveCapabilityManifest`
3. resolve `IntendedUseProfile`
4. resolve current `AssistiveReleaseState`
5. resolve current `AssistiveKillSwitchState`
6. enforce route, actor, subject scope, evidence class, forbidden action, and forbidden downstream consumer rules
7. enforce `AssistiveCompositionPolicy`
8. require published surface and current runtime publication state
9. compute monotonic `rolloutRung` and `renderPosture`
10. issue `AssistiveInvocationGrant` only when the decision is eligible

Missing manifest, intended-use profile, release state, kill-switch state, surface binding, publication state, or runtime bundle blocks invocation. Shadow-only release may admit a run, but the grant stays `shadow_only`; it does not widen to visible behavior.

## Composition Law

The policy graph is explicit. `documentation_draft`, `message_draft`, and `pharmacy_or_booking_handoff_draft` cannot be laundered into endpoint or closure logic unless a policy permits that path. `EndpointDecision`, `AppointmentRecord`, `PharmacyCase`, and `TaskClosure` are blocked downstream object types.

Loop detection and chain-depth checks are code-enforced. A blocked path returns reason codes such as `blocked_downstream_consumer`, `composition_loop_detected`, or `composition_chain_depth_exceeded`.

## Settlement Law

`AssistiveRunSettlement` is required before downstream consumers may reason about output posture. It records:

- `renderableArtifactRefs`
- `blockedArtifactRefs`
- `schemaValidationState`
- `policyBundleRef`
- `surfacePublicationRef`
- `runtimePublicationBundleRef`
- `transitionEnvelopeRef`
- `uiTransitionSettlementRecordRef`
- `releaseRecoveryDispositionRef`

Schema-invalid output settles to `quarantined`. Policy-invalid output settles to `blocked_by_policy`. Expired or revoked grants also settle to `blocked_by_policy`. A valid run under a `shadow_only` grant remains `shadow_only` with no renderable visible artifacts.

## Relationship To 409

Task 409 can create review-only suggestion envelopes and draft insertion leases. Task 410 controls whether that capability may be invoked at all, which derived inputs are legal, and whether a produced assistive artifact is renderable, observe-only, shadow-only, quarantined, or blocked. 410 does not create suggestions itself and does not mutate workflow state.

## Interface Gap Handling

`data/contracts/403_phase8_track_readiness_registry.json` still records 410 as blocked with no launch packet because it was generated before tasks 404-409 materialized their contracts. This implementation therefore publishes `data/analysis/PHASE8_BATCH_404_411_INTERFACE_GAP_INVOCATION_AND_COMPOSITION.json` and uses the shared batch fallback order: Phase 8 blueprint, 405 release contracts, 409 suggestion contract, and completed checklist state.

## Non-Goals Kept Out

- No workspace rendering.
- No final endpoint commitment.
- No autonomous task routing or closure.
- No local feature flag widening beyond release state.
- No raw grant secret in audit logs.
- No client-side recomputation of composition or kill-switch truth.
