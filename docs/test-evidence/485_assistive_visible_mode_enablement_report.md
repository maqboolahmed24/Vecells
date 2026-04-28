# Assistive Visible Mode Enablement Report

Generated: 2026-04-28T00:00:00.000Z

## Active enablement result

- Plan: assistive_visible_mode_enablement_plan_485
- Active eligibility: approved
- Active mode: visible_insert
- Insert controls visible: true
- Settlement: applied
- Next safe action: Show summary and insert controls only to the approved narrow staff cohort.

## Scenario coverage

- visible_insert_approved: visible_insert; state=approved; blockers=0
- shadow_only_unapproved: hidden; state=hidden; blockers=1
- visible_summary_only: visible_summary; state=blocked; blockers=1
- observe_only_degraded: observe_only; state=observe_only; blockers=1
- frozen_freeze_disposition: frozen; state=frozen; blockers=1
- hidden_out_of_slice: hidden; state=hidden; blockers=1
- route_verdict_shadow_only: shadow; state=shadow_only; blockers=1
- route_contract_stale: visible_summary; state=blocked; blockers=1
- insert_evidence_missing: visible_summary; state=blocked; blockers=1
- envelope_downgrade_mid_session: observe_only; state=observe_only; blockers=1
- historical_kill_switch_clear: visible_insert; state=approved; blockers=0
- split_route_visible_insert: visible_insert; state=approved; blockers=0
- split_route_shadow_only: shadow; state=shadow_only; blockers=1
- commit_missing_human_approval: visible_commit; state=blocked; blockers=1

## Browser evidence

- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive-visible-modes.artifact-manifest.json
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_commit-gate.panel.aria.txt
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_frozen.png
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_hidden.png
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_observe-only.png
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_ops.freeze.aria.txt
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_ops.matrix.aria.txt
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_ops.png
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_shadow-only.png
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_visible-insert.panel.aria.txt
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_visible-insert.png
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_visible-insert.provenance.aria.txt
- output/playwright/485-assistive-visible-modes/assistive-visible-modes/assistive_485_visible-summary.png
- output/playwright/485-assistive-visible-modes/assistive_485_commit-gate.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_frozen.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_hidden.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_observe-only.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_ops.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_shadow-only.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_visible-insert.trace.zip
- output/playwright/485-assistive-visible-modes/assistive_485_visible-summary.trace.zip
