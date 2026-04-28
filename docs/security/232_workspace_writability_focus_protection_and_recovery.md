# 232 Workspace Writability, Focus Protection, And Recovery

## Security posture

The workspace projector is deny-by-default.

No task route is writable merely because it rendered. Mutation stays legal only when the current:

- `StaffWorkspaceConsistencyProjection`
- `WorkspaceSliceTrustProjection`
- `WorkspaceTrustEnvelope`
- review action lease
- lifecycle lease
- selected-anchor tuple
- publication tuple

still agree.

## Lease and ownership controls

The projector blocks or recovers on these tuple failures:

- missing review lease
- expired review lease
- missing lifecycle lease
- expired lifecycle lease
- ownership epoch mismatch
- fencing token mismatch
- lineage fence drift
- stale-owner recovery already open

The recovery action is explicit:

- `reacquire_lease` when the operator can safely reclaim
- `supervised_takeover` when stale-owner recovery is already authoritative

## Protected composition

The server now preserves composition-sensitive work through `ProtectedCompositionState`.

Protected work keeps:

- draft refs
- anchor refs
- compare refs
- reading target
- quiet return target

When trust, publication, anchor, or settlement drift invalidates the focus-protection lease, the state becomes `stale_recoverable` and the shell freezes the active work in place. Ownership or lineage invalidation raises the state to `recovery_only`.

This closes the composition-loss gap: the operator keeps the exact frozen context while recovery is explained, instead of silently losing draft or compare state.

## Same-shell recovery

The envelope never solves drift by implicitly ejecting the operator. It degrades in place and emits deterministic machine-readable reasons such as:

- `WORKSPACE_232_REVIEW_ACTION_LEASE_MISSING`
- `WORKSPACE_232_REQUEST_LIFECYCLE_LEASE_EXPIRED`
- `WORKSPACE_232_SELECTED_ANCHOR_REMAPPABLE`
- `WORKSPACE_232_SELECTED_ANCHOR_LOST`
- `WORKSPACE_232_CONSEQUENCE_SUPERSEDED`
- `WORKSPACE_232_RUNTIME_PUBLICATION_DRIFT`

Those reasons are safe to emit to UI and telemetry because they describe posture, not PHI or draft content.

## Visibility vs actionability

The projector keeps these concerns separate:

- consistency
- trust
- continuity
- actionability

The operator may still see summary or frozen provenance while mutation is blocked. This is deliberate: degraded visibility can remain useful for orientation, while actionability must fail closed.

## Logging and disclosure

The `232` seam records only refs, tuple hashes, and reason codes. It does not emit draft body text, rendered evidence payloads, or raw identifiers. Downstream observability should use the published reason codes and tuple hashes rather than reconstructing sensitive state from logs.
