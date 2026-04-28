# 484 Algorithm Alignment Notes

Task: seq_484
Generated: 2026-04-28T00:00:00.000Z

## Implemented source authority

- Wave 1 stability is loaded from data/release/483_wave1_stability_verdict.json and must be stable before a canary action is permitted.
- Each canary step publishes a CanaryScopeSelector, CanaryBlastRadiusProof, CanaryWideningDecision, CanaryWaveActionRecord, CanaryWaveSettlement, and RemainingWaveObservationPolicy.
- Widening does not jump directly from Wave 1 to all tenants. The active completed path settles only the next guarded staff/pharmacy canary and leaves remaining tenant, NHS App, and assistive scope gated.
- Channel and assistive scopes remain fail-closed where current evidence belongs to tasks 485 and 486.

## Edge cases covered

- edge_484_wave1_stable_but_support_rota_capacity_constrained
- edge_484_tenant_core_web_eligible_but_channel_scope_blocked
- edge_484_canary_selector_expands_due_to_dynamic_membership
- edge_484_guardrail_breach_after_settlement_before_dwell_complete
- edge_484_rollback_route_ready_but_channel_embedding_missing
- edge_484_same_tenant_conflicting_scopes_across_canaries
- edge_484_observation_policy_changed_after_canary_approval
