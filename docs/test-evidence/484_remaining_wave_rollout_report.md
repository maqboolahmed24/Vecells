# Remaining Wave Rollout Report

Generated: 2026-04-28T00:00:00.000Z

## Active canary result

- Plan: canary_wave_plan_484_completed
- Active decision: completed
- Active settlement: applied
- Action permitted: true
- Next safe action: First guarded canary has settled. Remaining waves stay gated by their own selectors.

## Scenario coverage

- completed: completed; blockers=0
- ready: approved; blockers=0
- active: active_observation; blockers=0
- previous_stability_not_exact: blocked; blockers=1
- support_capacity_constrained: blocked; blockers=1
- channel_scope_blocked: blocked; blockers=2
- selector_expanded: blocked; blockers=2
- guardrail_breach_after_settlement: pause_required; blockers=1
- rollback_channel_gap: rollback_required; blockers=3
- conflicting_scope: blocked; blockers=2
- policy_changed_after_approval: stale; blockers=1

## Browser evidence

- output/playwright/484-canary-rollout/canary-rollout/canary-rollout.artifact-manifest.json
- output/playwright/484-canary-rollout/canary-rollout/canary_484_active.ladder.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_active.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_blocked.controls.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_blocked.mobile.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_blocked.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_channel_ready.confirmation.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_completed.node.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_completed.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_paused.controls.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_paused.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_ready.confirmation.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_ready.controls.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_ready.ladder.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_ready.node.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_ready.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_ready.scope.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_rollback.controls.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_rollback.mobile.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_rollback.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_selector_expanded.png
- output/playwright/484-canary-rollout/canary-rollout/canary_484_selector_expanded.scope.aria.txt
- output/playwright/484-canary-rollout/canary-rollout/canary_484_tenant_ready.confirmation.aria.txt
- output/playwright/484-canary-rollout/canary_484_active.trace.zip
- output/playwright/484-canary-rollout/canary_484_blocked.trace.zip
- output/playwright/484-canary-rollout/canary_484_completed.trace.zip
- output/playwright/484-canary-rollout/canary_484_paused.trace.zip
- output/playwright/484-canary-rollout/canary_484_ready.trace.zip
- output/playwright/484-canary-rollout/canary_484_rollback.trace.zip
- output/playwright/484-canary-rollout/canary_484_selector_expanded.trace.zip
- output/playwright/484-canary-rollout/canary_484_tenant_channel_confirmations.trace.zip
