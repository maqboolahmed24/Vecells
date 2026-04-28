# Phase 9 Restore, Failover, Chaos Action Settlement Alignment

Task 445 consumes the task 444 readiness tuple and turns restore, failover, chaos, and recovery-pack attestation into settled command outcomes. Local run completion is retained as evidence only; live authority comes from ResilienceActionSettlement.

Every command carries an idempotency key, role, purpose, reason, expected posture hash, expected readiness hash, expected tuple hash, and tenant-bound scope token. Publication, trust, freeze, readiness, guardrail, and tuple drift all fail closed before controls can be treated as live.

Recovery evidence is summary-first and graph-pinned. The generated artifacts use governed presentation, transfer, fallback, masking, outbound-navigation policy, and return-intent references; raw object-store refs are rejected.
