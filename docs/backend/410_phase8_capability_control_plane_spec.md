# 410 Phase 8 Capability Control Plane

## Scope

Task 410 builds the backend control plane that decides whether an assistive capability may run, which upstream artifacts and downstream consumers are legal, whether current release and kill-switch posture allows execution, and how produced assistive artifacts settle.

The control plane is not a renderer and not a workflow mutator. It admits, blocks, downgrades, or settles assistive runs. It does not create `EndpointDecision`, `AppointmentRecord`, `PharmacyCase`, or `TaskClosure` records.

## Runtime Package

Package: `@vecells/domain-assistive-control-plane`

Source root: `packages/domains/assistive_control_plane/src`

Factory: `createAssistiveCapabilityControlPlane`

Services:

- `AssistiveCapabilityManifestService`
- `IntendedUseProfileService`
- `InvocationEligibilityService`
- `AssistiveInvocationGrantIssuer`
- `AssistiveCompositionPolicyEngine`
- `AssistiveReleaseStateResolver`
- `AssistiveKillSwitchService`
- `AssistiveRunSettlementService`

## Persisted Objects

- `AssistiveCapabilityManifest`: capability code, family, intended-use profile, allowed contexts, allowed inputs, allowed outputs, composition policy, visibility policy, surface policy, route contract policy, publication policy, rollout policy, recovery disposition policy, telemetry policy, required trust slices, release cohort, medical-device assessment, and kill-switch policy.
- `IntendedUseProfile`: clinical and non-clinical purpose, medical-purpose state, permitted roles, permitted subject scopes, forbidden actions, forbidden downstream consumers, evidence requirement, and human review requirement.
- `AssistiveCompositionPolicy`: allowed upstream capabilities, allowed derived artifact types, blocked downstream object types, max chain depth, and loop detection mode.
- `AssistiveReleaseState`: current capability release posture for tenant and cohort, including mode, compiled policy bundle, rollout verdict, runtime publication bundle, and recovery disposition.
- `AssistiveKillSwitchState`: current materialized kill-switch truth for capability, tenant, and environment ring.
- `AssistiveInvocationGrant`: per-run grant binding route, actor, subject scope, evidence classes, visibility ceiling, policy bundle, review fence, lineage fence, entity continuity, surface binding, rollout verdict, publication refs, telemetry disclosure fence, expiry, and grant state.
- `AssistiveRunSettlement`: authoritative run settlement with renderable and blocked artifact partitions, schema state, policy bundle, publication refs, transition refs, trust-envelope ref, recovery disposition, and settlement state.
- `AssistiveControlAuditRecord`: actor, route intent, purpose of use, outcome, reason codes, and audit correlation.

## Invocation Flow

1. `IntendedUseProfileService.registerProfile` stores the frozen purpose and human-review boundaries.
2. `AssistiveCompositionPolicyEngine.registerPolicy` stores the allowed composition graph.
3. `AssistiveCapabilityManifestService.registerManifest` binds capability family, intended-use policy, composition policy, visibility, route, publication, rollout, recovery, telemetry, release cohort, and kill-switch policy refs.
4. `AssistiveReleaseStateResolver.publishReleaseState` materializes current release posture for the capability, tenant, and cohort.
5. `AssistiveKillSwitchService.setKillSwitchState` materializes current live kill-switch truth.
6. `InvocationEligibilityService.evaluateInvocationEligibility` resolves every required surface and fails closed on missing or stale truth.
7. `AssistiveInvocationGrantIssuer.issueInvocationGrant` mints the per-run grant only when the decision is eligible.
8. `AssistiveRunSettlementService.settleRun` partitions output artifacts and records renderable, shadow-only, observe-only, abstained, quarantined, or blocked-by-policy posture.

## Fail-Closed Rules

Invocation is blocked when any of the following cannot be proven:

- active capability manifest
- active intended-use profile
- current release state
- current kill-switch state
- permitted route family
- permitted actor role
- permitted subject scope
- accepted evidence class
- surface binding or surface policy
- published surface route contract
- current runtime publication bundle
- valid composition path

Shadow-only release can admit a run, but it mints a `shadow_only` grant and settlement. Local feature flags may narrow posture below release state; they may not widen it.

## Composition Rules

Composition is explicit. The runtime rejects:

- upstream capability codes outside `allowedUpstreamCapabilityCodes`
- derived artifact types outside `allowedDerivedArtifactTypes`
- recursive self-consumption when loop detection is `block`
- chain depth greater than `maxChainDepth`
- downstream consumers listed in `blockedDownstreamObjectTypes`

Blocked composition returns reason codes and cannot receive an invocation grant.

## Release And Kill Switch

`AssistiveReleaseState` is current release truth for capability, tenant, cohort, compiled policy bundle, rollout verdict, runtime publication, and recovery disposition.

`AssistiveKillSwitchState` is current kill-switch truth and current live safety truth. Historical operator command records are not enough for invocation decisions; the runtime consumes materialized state. Later state wins when two states share the same timestamp.

## Run Settlement

`AssistiveRunSettlement` is required for every assistive run output. It records `renderableArtifactRefs` and `blockedArtifactRefs`.

Settlement behavior:

- valid visible grant plus valid schema and policy settles as `renderable`
- valid observe-only grant settles as `observe_only`
- valid shadow-only grant settles as `shadow_only`
- schema invalid output settles as `quarantined`
- policy invalid output settles as `blocked_by_policy`
- expired or revoked grant settles as `blocked_by_policy`

Renderable is necessary but not sufficient for visible UI. Task 411 projects final surface posture from the grant, settlement, trust envelope, publication posture, kill switch, and same-shell continuity inputs.

## Verification

Primary verification commands:

```bash
pnpm --filter @vecells/domain-assistive-control-plane typecheck
pnpm exec vitest run tests/unit/410_invocation_eligibility_and_composition.spec.ts tests/integration/410_kill_switch_release_state_and_run_settlement.spec.ts tests/integration/410_per_run_grant_scope_and_expiry.spec.ts
pnpm validate:410-phase8-capability-control-plane
```
