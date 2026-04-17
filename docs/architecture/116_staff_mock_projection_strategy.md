# 116 Staff Mock Projection Strategy

## Mock-Now Goal

The seed staff shell is implemented now with typed mock projections and typed runtime tuples so later Phase 3 work deepens the same shell rather than replacing it. The mock layer proves:

- queue scanning remains low-noise under realistic task diversity
- child routes keep the same shell and task context
- runtime posture changes demote the current shell honestly instead of showing stale writable UI
- downstream domains can appear as bounded task states without pretending the downstream workflow is already complete

## Mock Projection Families

The shell seeds five concrete task families:

| Seed family | Task | Why it exists now |
| --- | --- | --- |
| returned patient evidence | `task-311` | proves decisive delta and superseded-context rendering |
| booking-intent seed | `task-208` | proves approval preview posture without full booking engine depth |
| callback follow-up | `task-412` | proves escalation posture and bounded support handoff |
| pharmacy-intent seed | `task-507` | proves blocker state and duplicate-route freeze |
| reopened admin resolution | `task-118` | proves changed-since-seen and quiet return posture |

Each seed is typed into the same task anatomy:

- patient/patient-ref identity
- queue membership
- route launch target
- queue preview digest
- summary points
- decisive or contextual delta packet
- structured evidence
- structured consequences
- bounded decision options
- quick-capture configuration

## Runtime Tuple Strategy

The shell publishes five runtime tuples:

| Runtime scenario | Effective posture | Shell behavior |
| --- | --- | --- |
| `live` | `live` | queue and dock remain writable |
| `stale_review` | `read_only` | task stays visible while review is required |
| `read_only` | `read_only` | same-shell preserve, writable posture fenced |
| `recovery_only` | `recovery_only` | protected composition freezes in place |
| `blocked` | `blocked` | release truth blocks live action but preserves context |

This separation matters because the staff shell must never infer writability from stale local state. The runtime tuple decides the shell posture; the shell only localizes how that posture is presented.

## Production Swap Later

Production hardening can replace mock data with live projections, but it must preserve:

- `rf_staff_workspace` and `rf_staff_workspace_child`
- queue preview behavior
- selected-anchor preservation
- protected composition ribbon and delta buffering
- task-plane anatomy
- explicit support boundary

Later work may add richer summaries, streaming updates, and deeper child workflows. It must not replace the current shell with detached pages or generic list/detail routing.
