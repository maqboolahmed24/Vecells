# 11 Region Resilience And Failover Posture

Failover is now explicit: the primary region owns normal writes, the secondary UK region stays warm and promotable, and no restore or failover step may leave calm writable posture live while tuple truth drifts.

## Store-Class Resilience

| Store class | Name | Primary posture | Secondary posture | User posture during failover |
| --- | --- | --- | --- | --- |
| STORE_RELATIONAL_FHIR | FHIR-capable relational store | Primary-region writable, tenant-partitioned logical schemas or keys. | Warm replica in secondary UK region; promotion requires restore proof, publication parity, and scope-tuple refresh. | command_halt then read_only until tuple refresh and projection readiness converge |
| STORE_OBJECT_ARTIFACT | Object and artifact storage | Primary-region writes with immutable object manifests and malware posture. | Cross-region UK replication with manifest parity verification before promotion. | summary_only or governed handoff until artifact parity recovers |
| STORE_EVENT_BUS_OUTBOX | Event bus, queue, and outbox checkpoints | Primary-region active dispatch and callback correlation. | Checkpointed durable mirror; replay from durable checkpoints only. | integration_queue_only and command_halt for affected routes |
| STORE_PROJECTION_READ | Projection read store | Primary-region live audience projections. | Warm or rebuildable copy; readiness verdict required before live claims. | projection_stale, summary_only, or recovery_only |
| STORE_APPEND_ONLY_AUDIT | Append-only audit and assurance ledger | Primary-region append and query. | Replicated or dual-written UK evidence path with continuity verification. | diagnostic_copy_only until resilience tuple becomes exact |
| STORE_CACHE | Ephemeral cache and shell continuity cache | Region-local disposable cache keyed by tenant tuple. | Cold or disposable; never authoritative during failover. | recompute from projection or drop to recovery_only |

## Failover Authority

| Authority | Role |
| --- | --- |
| AUTH_RESILIENCE_ORCHESTRATOR | ResilienceOrchestrator proposes restore or failover posture from exact runtime truth. |
| AUTH_OPERATIONS_DRILLDOWN | Operations drilldown may execute declared actions only while the resilience tuple and watch tuple remain exact. |
| AUTH_GOVERNANCE_SCOPE | Governance must approve platform or multi-tenant blast-radius widening, rollback stand-down, and exceptional recovery scope. |

## Degraded User Posture

| Surface class | Posture | Reason |
| --- | --- | --- |
| patient | same-shell read_only, placeholder_only, or redirect_safe_route | PatientDegradedModeProjection and ReleaseRecoveryDisposition stay authoritative. |
| staff_workspace | same-shell read_only or queue placeholder | ScopedMutationGate freezes mutation on tuple or runtime drift. |
| support_replay | masked replay visible, restore controls frozen | InvestigationScopeEnvelope remains visible, but restore authority halts on drift. |
| operations_and_governance | diagnostic evidence visible, controls frozen | ReleaseWatchTuple and resilience tuple decide authority, not dashboard-local state. |

## Required Closures

- Queue and outbox replay happens only from durable checkpoints.
- Restore proof, runtime publication parity, and scope-tuple refresh must all be exact before writable posture returns.
- Operations and governance shells may preserve evidence under drift, but they may not imply live authority until the resilience tuple is exact again.
