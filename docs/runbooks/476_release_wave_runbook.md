# Task 476 Release Wave Runbook

Manifest hash: `79ea284d24bb0a1a8e77680c98baadd55e1db7f56a69b9b1720e9c313f111f06`

## Wave Approval

1. Confirm task 473 Phase 7 reconciliation is current and that NHS App channel activation remains deferred unless a later authority record supersedes it.
2. Confirm task 474 cutover and projection evidence is current. Pharmacy dispatch must remain out of Wave 1 while pharmacy projection is stale.
3. Confirm task 475 BAU readiness, support escalation paths, training evidence, and rollback runbooks are current.
4. Review Wave 1 cohort selector, guardrail snapshot, observation policy, rollback binding, and manual fallback binding.
5. Approve the manifest plan only. Do not activate production exposure until signoff, DR smoke, promotion settlement, and observation settlement records are current.

## Pause Or Rollback

- Pause immediately on major incident, untriaged clinical safety signal, projection lag over threshold, support load above threshold, runtime tuple drift, or tenant/cohort digest mismatch.
- Roll back feature surfaces through the wave rollback binding. If reference data rollback is absent, the wave is blocked from widening.
- Disable assistive visible mode through the assistive freeze disposition and return to human review only.
- Keep NHS App routes frozen until Phase 7 channel activation authority is current and supplier obligations are met.

## Manual Fallback

- Use the task 475 support escalation paths and runbook bundle for clinical operations, support triage, release rollback, and out-of-hours coverage.
- Support staff must not use local dashboard labels, informal flags, or raw route parameters as evidence of release state.
