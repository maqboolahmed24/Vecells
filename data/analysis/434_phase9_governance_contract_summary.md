# Phase 9 Governance Control Contract Freeze

Schema version: 434.phase9.governance-control-contracts.v1
Contract count: 32
Contract set hash: a32c9a1cf5e954a9e5c7bf82f63c6e87eafdc618051362e5ea9d64ced89a723a
Disposition assessment state: blocked
Disposition blockers: active_dependency, active_legal_hold, replay_critical_dependency, transitive_legal_hold
Transitive dependency count: 2

## Frozen Families

- Retention, legal hold, disposition, dependency, and disposition-block reasons.
- Operational readiness, restore/failover rehearsal, chaos action, recovery posture, writeback, rebuild, and dependency map.
- Incident, near-miss, triage, reportability, timeline, CAPA, just-culture, and notification obligations.
- Tenant policy, tenant config, immutable publication, dependency hygiene, standards binding, overrides, and admin settlements.

## Invariants

- retention classification bound at artifact creation and not inferred from storage paths
- legal hold and retention freeze share one preservation-first control plane
- disposition requires explicit DispositionEligibilityAssessment
- graph-critical, WORM, replay-critical, hash-chained, and assurance-pack dependencies fail closed
- artifact dependencies are transitive and can block disposition
- restore, failover, and recovery evidence writes back into the assurance graph
- incident, near-miss, and reportability records preserve audit refs and CAPA lineage
- tenant config changes are immutable, versioned, published, and auditable
- dependency inventory and risk records carry owner, scope, version, health, and evidence refs
- governance overrides require purpose, role, idempotency, audit, expiry, and rollback or supersession
