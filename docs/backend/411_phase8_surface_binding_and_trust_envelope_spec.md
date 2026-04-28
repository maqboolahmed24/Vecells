# 411 Phase 8 Surface Binding And Trust Envelope

## Scope

Task 411 builds the backend authority that tells staff-workspace consumers how an assistive artifact may appear, whether any action is currently safe, and why the posture has widened or narrowed.

The package is not a renderer and not a monitoring pipeline. It consumes invocation grants, run settlements, publication truth, kill-switch state, same-shell continuity, and available trust inputs, then projects one `AssistiveCapabilityTrustEnvelope`.

## Runtime Package

Package: `@vecells/domain-assistive-trust-envelope`

Source root: `packages/domains/assistive_trust_envelope/src`

Factory: `createAssistiveTrustEnvelopeProjectionPlane`

Services:

- `AssistiveSurfaceBindingResolver`
- `AssistivePresentationContractResolver`
- `AssistiveProvenanceEnvelopeService`
- `AssistiveConfidenceDigestService`
- `AssistiveFreezeFrameService`
- `AssistiveTrustEnvelopeProjector`
- `AssistiveSurfacePostureResolver`

## Persisted Objects

- `AssistiveSurfaceBinding`: binds capability, artifact, entity continuity key, staff route family, staff workspace shell, visibility policy, rollout verdict, route contract, publication refs, runtime bundle, same-shell workspace projections, selected anchor requirement, placeholder contract, and binding state.
- `AssistivePresentationContract`: controls `summary_stub`, `inline_side_stage`, `bounded_drawer`, or `control_workbench` posture, provenance disclosure, confidence disclosure, expansion rules, reduced motion, companion-only dominance, and one dominant safe action.
- `AssistiveProvenanceEnvelope`: binds input evidence snapshot hashes, capture bundle, derivation packages, summary parity, evidence map set, model version, prompt version, output schema, calibration bundle, policy bundle, publication tuple, freshness, trust, continuity, masking, and disclosure level.
- `AssistiveConfidenceDigest`: exposes a conservative display band, support probability ref, evidence coverage, epistemic uncertainty, expected harm band, calibration version, display mode, and suppression reasons. It does not expose raw confidence as live truth.
- `AssistiveFreezeFrame`: preserves same-shell visible text refs, evidence anchors, provenance, recovery action, route, selected anchor, and entity continuity while suppressing write affordances.
- `AssistiveCapabilityTrustEnvelope`: combines surface binding, invocation grant, run settlement, watch tuple, trust projection, rollout verdict, provenance refs, confidence digest refs, freeze frame, kill switch, publication posture, workspace trust refs, selected anchor, entity continuity, trust state, surface posture, actionability, confidence posture, completion adjacency, and blocking reasons.
- `AssistiveTrustEnvelopeAuditRecord`: records actor context, service action, outcome, and reason codes without PHI-bearing text.

## Projection Flow

1. `AssistiveSurfaceBindingResolver.resolveSurfaceBinding` creates one staff-only same-shell binding per artifact.
2. `AssistivePresentationContractResolver.registerPresentationContract` stores conservative presentation defaults and blocks over-dominant rails.
3. `AssistiveProvenanceEnvelopeService.createProvenanceEnvelope` stores evidence hashes and immutable derivation refs.
4. `AssistiveConfidenceDigestService.createConfidenceDigest` computes a conservative band and suppresses confidence when calibration, trust, publication, or continuity is not good enough.
5. `AssistiveFreezeFrameService.materializeFreezeFrame` freezes artifacts in place for drift or invalidation.
6. `AssistiveSurfacePostureResolver.resolvePosture` separates visibility, actionability, confidence posture, and completion adjacency.
7. `AssistiveTrustEnvelopeProjector.projectTrustEnvelope` publishes the single authoritative envelope for later UI, rollout, and monitoring consumers.

## Fail-Closed Rules

The projector must fail closed when any required future trust input is missing:

- missing watch tuple
- missing trust projection
- missing rollout verdict
- missing required freeze record

It also fails closed when invocation grants, run settlements, kill-switch state, publication posture, runtime publication, route family, entity continuity, selected anchor, or workspace continuity drift. The artifact remains in the same shell and degrades to observe-only, provenance-only, placeholder-only, hidden, regenerate-only, blocked-by-policy, or blocked posture.

## Same-Shell Recovery

Publication drift, runtime publication drift, selected-anchor drift, route drift, entity-continuity drift, release freeze, and kill-switch activation materialize `AssistiveFreezeFrame` where policy allows. The freeze frame retains the current route family, selected anchor, entity continuity key, evidence anchors, and provenance envelope while suppressing accept, insert, regenerate, export, browser-handoff, and completion affordances.

The envelope carries `sameShellRecoveryRequired = true` and exact blocking reasons such as `selected_anchor_drift_freeze_frame_required` and `same_shell_recovery_required`. It never silently retargets the artifact to a different shell.

## Browser Consumer Rule

`AssistiveCapabilityTrustEnvelope.browserClientActionabilityRecomputeForbidden = true`.

Later frontend tasks must render from `surfacePostureState`, `actionabilityState`, `confidencePostureState`, and `completionAdjacencyState`. Browser code may narrow presentation for local layout or accessibility, but it may not widen actionability from local state.

## Verification

Primary verification commands:

```bash
pnpm --filter @vecells/domain-assistive-trust-envelope typecheck
pnpm exec vitest run tests/unit/411_surface_binding_and_presentation_contract.spec.ts tests/integration/411_trust_envelope_posture_and_freeze_frame.spec.ts tests/integration/411_same_shell_recovery_and_fail_closed_projection.spec.ts
pnpm validate:411-phase8-trust-envelope-projection
```
