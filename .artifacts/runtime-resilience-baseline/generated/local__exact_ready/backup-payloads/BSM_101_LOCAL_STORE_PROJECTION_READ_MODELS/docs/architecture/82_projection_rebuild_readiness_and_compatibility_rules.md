# 82 Projection Rebuild Readiness And Compatibility Rules

## Compatibility

- `exact`: all required schema versions for the target projection version are present in the dispatch registry and the version window is exact-only.
- `dual_read`: all required schema versions are present and the version set explicitly names a compatible shadow/live pair. Shells must remain guarded until cutover is complete.
- `blocked`: any required schema version is missing from the dispatch registry or the version window is not declared. Publication and writable posture must stop.

## Readiness

- `live`: checkpoint lag is within threshold, rebuild state is completed, and compatibility is not blocked.
- `recovering`: rebuild is active or a dual-read shadow build has not been promoted yet. Shells may show summary truth only.
- `stale`: compatibility is still exact, but checkpoint lag exceeds the family threshold. Shells may not imply calm completeness.
- `blocked`: rebuild crashed, rebuild was explicitly blocked, or compatibility is blocked. Shells must not imply healthy projection truth.

## Operator Rules

- Checkpoints are per family/version/key and advance after each durable event apply.
- Apply receipts are written before replay can move past the event on restart, so repeated delivery becomes a counted duplicate instead of a duplicated mutation.
- Dry-run rebuilds do not replace live state. They emit comparison evidence and readiness posture only.
- Mixed-version publication is allowed only inside an explicit dual-read window.
- Unknown or future schema versions are not warnings. They are blockers.
