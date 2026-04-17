# 102 Wave Action Rehearsal And Rollback Rules

## Canonical Rules

1. Every rehearsal action is a first-class commanded operation with a durable preview, record, receipt, observation window, settlement, and audit trail.
2. `widen` and `rollforward` require both a fresh `OperationalReadinessSnapshot` and a satisfied `ReleaseWatchTuple` published for the same release tuple.
3. `rollback` requires an explicit rollback target publication bundle plus bound runbook and recovery evidence references before execution is accepted.
4. `kill_switch` is allowed only when severe trust, provenance, publication, or parity failure freezes the guardrail.
5. `pause` is allowed under constrained posture so the release can stop widening without inventing rollback authority.
6. Superseded tuples are surfaced as separate preview objects. The meaning of an existing action, tuple, or settlement is never rewritten in place.

## Anti-Patterns Rejected

- widening after policy or tuple drift without superseding the tuple
- rollback without explicit target tuple and recovery evidence
- settling a wave action from CI transport success alone
- treating frozen, stale, constrained, rollback-required, and superseded posture as generic failure states

## Scenario Law

### Happy-path canary start

`LOCAL_CANARY_START_HAPPY_PATH` exercises a green guardrail with accepted watch posture. The action settles `accepted_pending_observation`, not `satisfied`, because dwell proof is not yet complete.

### Widen after satisfied observation

`LOCAL_WIDEN_AFTER_SATISFIED_OBSERVATION` proves widening only after the observation window and readiness tuple are both satisfied. The action settles `satisfied`.

### Pause on constrained guardrail

`CI_PREVIEW_PAUSE_CONSTRAINED_GUARDRAIL` proves that stale rehearsal evidence, constrained continuity, and degraded trust can still produce an executable pause without implying rollback completion.

### Rollback on trigger breach

`INTEGRATION_ROLLBACK_ON_TRIGGER_BREACH` accepts rollback because the failing tuple arms rollback and the explicit rollback target is already declared. The action settles `rollback_required`.

### Kill-switch on severe failure

`PREPROD_KILL_SWITCH_ON_TRUST_OR_PARITY_FAILURE` proves kill-switch posture under frozen guardrail conditions. The action is executable, but the resulting cockpit remains constrained because the environment is still in kill-switch posture.

### Rollforward after supersession

`LOCAL_ROLLFORWARD_AFTER_SUPERSEDED_TUPLE` emits a superseded preview for the old tuple, then accepts the fresh tuple with current readiness proof and settles `satisfied`.

## Operational Notes

- `GAP_RESOLUTION_CANARY_RING_NONPROD` keeps the rehearsal ring set bounded until later live cohort logic exists.
- `GAP_RECOVERY_DISPOSITION_READ_ONLY_OR_RECOVERY_ONLY` narrows incomplete recovery postures to the safest available disposition instead of assuming a production-like live posture.
- `FOLLOW_ON_DEPENDENCY_WAVE_GOVERNANCE_APPROVALS` remains the only sanctioned path for richer operator approvals. It may not alter settled action semantics.
