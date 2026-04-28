# 98 Dependency Degradation Engine Design

## Mission

Publish one executable degradation engine so dependency failure, audience fallback, assurance impact, and recovery clearance all resolve from the same profile row instead of service-local error handling.

## Runtime Shape

- `DependencyDegradationProfile` remains the source contract and now carries `failureModeClass`, `routeFamilyRefs`, `gatewaySurfaceRefs`, `audienceFallbacks`, `recoveryRequirements`, and `engineBinding`.
- `@vecells/release-controls` owns the compiler and execution engine in `dependency-degradation.ts`.
- `api-gateway`, `command-api`, `projection-worker`, and `notification-worker` consume the engine instead of inferring degradation from local transport or route code.
- Browser and route recovery posture stays bound to the existing browser runtime governor; par_098 overlays bounded fallback on top of that published tuple.

## Execution Law

- `maximumEscalationFamilyRefs[]` stays the ceiling for widened backend consequence.
- Directly impacted backend families remain executable even when the ceiling only names the broader blast-radius boundary.
- Audience-safe placeholder and read-only posture remain presentation overlays and do not widen backend authority.
- Recovery clears only when runtime publication, parity, route exposure, trust freeze, and assurance hard-block conditions all return to the published legal state.

## Published Modes

- `gateway_read_only`
- `command_halt`
- `projection_stale`
- `integration_queue_only`
- `local_placeholder`

## Service Bindings

- Gateway read resolution returns deterministic `gatewayReadMode`, `browserReadPosture`, and `primaryAudienceFallback`.
- Browser mutation refusal is explicit through `browserMutationMode`.
- Projection degradation publishes `projection_stale` rather than generic freshness debt.
- Integration degradation publishes `queue_only` or `halt_dispatch` instead of generic delivery failure.

## Bounded Gaps

- `FOLLOW_ON_DEPENDENCY_CONTENT_PATIENT_SAFE_PLACEHOLDER_V1`
- `FOLLOW_ON_DEPENDENCY_CONTENT_WORKSPACE_FALLBACK_COPY_V1`
- `FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_DIAGNOSTIC_COPY_V1`
- `GAP_RESOLUTION_ESCALATION_CEILING_RUNTIME_BOUNDARY_V1`
- `GAP_RESOLUTION_ESCALATION_CEILING_AUDIENCE_OVERLAY_V1`
