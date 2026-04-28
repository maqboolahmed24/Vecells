# Task 469 Incident, Tenant Governance, And Dependency Hygiene Test Plan

## Scope

This suite hardens Phase 9 incident response, reportability, near-miss learning, tenant config immutability, standards watchlist behavior, dependency lifecycle hygiene, legacy reference handling, exception expiry, and promotion approval gates.

## Integration Coverage

- `469_incident_workflow_contract.test.ts` checks telemetry/operator/near-miss intake, severity triage, impact scope, evidence preservation, investigation timelines, containment blocking, settlement, and idempotent replay.
- `469_reportability_capa_assurance_writeback.test.ts` checks blocked/pending/superseded/reported assessments, task 463 reportability destinations, fake receiver payload redaction, PIR/root cause/CAPA ownership, training drills, assurance pack propagation, telemetry fencing, and ledger writeback.
- `469_tenant_config_immutability.test.ts` checks root/child ConfigVersion parent refs, immutable hashes, tenant baseline drift, policy pack history, compiled policy bundle gates, visibility blockers, stale pharmacy dispatch rejection, stale assistive invalidation, simulation readiness, and approval bypass blocking.
- `469_standards_dependency_watchlist.test.ts` checks StandardsBaselineMap, candidate-bound watchlist hashes, dependency lifecycle owners/replacements/remediation, affected routes/simulations, compile/promotion gates, and standards drift invalidation.
- `469_legacy_reference_and_exception_expiry.test.ts` checks legacy reference blast radius, policy compatibility enforcement, expired exception reopening, standards exception permanence prevention, and stale approval invalidation.

## Playwright Coverage

- `469_incident_desk_flow.spec.ts` exercises the Incident Desk queue, near-miss intake, severity board, containment timeline, reportability checklist, evidence drawer, PIR, CAPA links, and required incident screenshots.
- `469_tenant_governance_hygiene_flow.spec.ts` exercises the tenant baseline matrix, config diff, policy pack history, standards watchlist, legacy findings, exception expiry, and promotion gates.
- `469_incident_tenant_accessibility.spec.ts` captures accessibility snapshots, keyboard focus, error summaries, ARIA status names, permission-denied states, and redaction checks across both shells.

## Safety Gates

The browser suites do not persist traces. DOM, ARIA snapshots, screenshots, and fake destinations are checked for PHI markers, raw incident details, route params, artifact fragments, investigation keys, access tokens, secret refs, and raw export URLs.
