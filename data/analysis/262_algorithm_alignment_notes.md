# 262 Algorithm Alignment Notes

- `WorkspaceFocusProtectionLease` drives visible protection state. Route-local flags may not restore calmness or writability.
- `ProtectedCompositionState` maps to visible protected modes: `composing`, `confirming`, `delta_review`, and `dispute_review`.
- `QueueChangeBatch` remains explicit and buffered. The shell shows queue churn but does not apply it under protected work.
- `TaskCompletionSettlementEnvelope` and `WorkspaceContinuityEvidenceProjection` gate whether completion calmness is provisional or authoritative.
- `NextTaskPrefetchWindow` may warm summary-only next work, but `NextTaskLaunchLease` is the only launch authority.
- `no auto-advance` stays hard-coded through `data-auto-advance="forbidden"`.
- Drift handling stays fail-closed:
  - `stale_review` -> stale-recoverable hold
  - `read_only` or `recovery_only` -> recovery-only hold
  - `blocked` -> blocked calmness and blocked launch
- Mixed snapshot law:
  - queued batch pending => launch blocked
  - next-task suggestion may still be visible as warmed or blocked
  - the shell keeps the current anchor and quiet-return target until explicit apply or recovery
