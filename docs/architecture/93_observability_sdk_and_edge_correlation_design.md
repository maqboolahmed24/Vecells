# 93 Observability SDK And Edge Correlation Design

## Mission

`par_093` establishes one authoritative observability substrate for Vecells Phase 0:

- one immutable `edgeCorrelationId` minted at the edge
- one shared `causalToken` propagated through browser, gateway, command, event, worker, projection, UI visibility, and audit hops
- one PHI-safe telemetry SDK for logs, metrics, traces, and UI causality records
- one deterministic sink and replay path for local, CI, and preview verification

## Runtime Surface

The shared runtime implementation lives in [packages/observability/src](/Users/test/Code/V/packages/observability/src/index.ts):

- `correlation-spine.ts`
  Defines immutable edge-correlation context, propagated headers, and hop-advance helpers.
- `telemetry.ts`
  Defines typed disclosure classes, PHI-safe field wrappers, deterministic sinks, structured log helpers, trace helpers, metric helpers, and chain reconstruction.
- `ui-causality.ts`
  Defines `UIEventCausalityFrame`, `UIEventEmissionCheckpoint`, `UIProjectionVisibilityReceipt`, `UITransitionSettlementRecord`, disclosure-fence helpers, and audit joins.

The runtime services now consume that shared substrate directly:

- [api-gateway runtime](/Users/test/Code/V/services/api-gateway/src/runtime.ts)
  Mints edge correlation when browser or edge headers are absent and propagates the same headers back in the response.
- [command-api runtime](/Users/test/Code/V/services/command-api/src/runtime.ts)
  Fails closed on missing protected correlation context and never synthesizes a new internal command trace.
- [projection-worker runtime](/Users/test/Code/V/services/projection-worker/src/runtime.ts)
  Preserves the same edge chain for worker and projection transitions.
- [notification-worker runtime](/Users/test/Code/V/services/notification-worker/src/runtime.ts)
  Reuses the same edge chain for dispatch acceptance and settlement-safe delivery telemetry.

## Machine-Readable Outputs

`par_093` publishes three generated artifacts:

- [observability_event_schema_manifest.json](/Users/test/Code/V/data/analysis/observability_event_schema_manifest.json)
  Canonical schema and trace-run authority for the explorer and later runtime publication work.
- [correlation_propagation_matrix.csv](/Users/test/Code/V/data/analysis/correlation_propagation_matrix.csv)
  Hop-by-hop propagation matrix for browser, gateway, command, event, worker, projection, UI visibility, and audit paths.
- [telemetry_redaction_policy.json](/Users/test/Code/V/data/analysis/telemetry_redaction_policy.json)
  Typed disclosure-class and fail-closed redaction policy authority.

These refs are also attached to [runtime_topology_manifest.json](/Users/test/Code/V/data/analysis/runtime_topology_manifest.json) so later publication and wave-observation tasks can consume the same observability tuple.

## Enforcement Rules

- `edgeCorrelationId` is immutable after edge issuance.
- Internal protected paths fail closed if correlation context is missing.
- Raw PHI is not a logger convention; it is a blocked disclosure class.
- Restore, replay, stale, projection-visible, and settled UI states must join the same continuity frame instead of starting parallel local traces.
- Audit is the final observer in the chain, not a detached afterthought.

## Deterministic Verification

The deterministic test path now covers:

- package-level correlation reconstruction and redaction assertions
- runtime-service propagation and fail-closed correlation enforcement
- generated schema and policy validation
- browser explorer verification for missing-correlation, blocked-disclosure, reduced-motion, and accessibility posture

## Follow-On Boundaries

This task intentionally stops short of later ownership:

- `par_094` consumes this observability tuple for runtime publication bundle binding.
- `par_097` consumes these states for wave observation and watch-tuple widening policy.
- `par_102` consumes the same correlation and disclosure law for canary and rollback rehearsal depth.

