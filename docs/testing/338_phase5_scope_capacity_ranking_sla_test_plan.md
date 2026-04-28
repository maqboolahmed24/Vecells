# 338 Phase 5 Scope, Capacity, Ranking, and SLA Test Plan

This plan binds the first final release-grade Phase 5 proof battery to the pre-commit trust surfaces that can still widen unsafe hub behavior before commit even begins: organisation boundaries, acting-context drift, minimum-necessary visibility, capacity admission, candidate ranking, queue continuity, SLA posture, and responsive `mission_stack` parity.

## Scope

- Organisation boundary and acting-context truth: `StaffIdentityContext`, `ActingContext`, `CrossOrganisationVisibilityEnvelope`, scope drift, read-only posture, denied posture, and minimum-necessary placeholder law.
- Capacity-feed admission truth: trusted, degraded, and quarantined `HubCapacityAdapter` inputs; `NetworkCandidateSnapshot`; `CrossSiteDecisionPlan`; and `CapacityRankProof`.
- Queue and candidate ranking truth: `HubQueueWorkbenchProjection`, `HubConsoleConsistencyProjection`, queue change batching, selected-anchor continuity, and `DecisionDock` authority.
- SLA and breach-risk truth: queue timers, escalation banners, posture summaries, and the browser-visible urgency surface across desktop and `mission_stack`.
- Evidence publication: one machine-readable bundle plus a synchronized reviewer lab for scope, capacity, ranking, SLA, and unsupported-gap evidence.

## Suite Map

| Suite | Files | Governing objects | Failure modes closed |
| --- | --- | --- | --- |
| Acting-context and minimum-necessary truth | `tests/integration/338_acting_context_and_visibility_truth.spec.ts` | `StaffIdentityContext`, `ActingContext`, `CrossOrganisationVisibilityEnvelope` | Scope drift leaves writable mutation alive, audience tier leaks withheld fields, placeholder counts drift away from governing visibility law |
| Capacity-feed admission and quarantine | `tests/integration/338_capacity_feed_admission_and_quarantine.spec.ts` | `NetworkCandidateSnapshot`, `CrossSiteDecisionPlan`, `CapacityRankProof` | Degraded or quarantined supply leaks into ordinary patient frontiers, collision ranking lifts degraded supply above trusted supply, quarantine stops being explicit |
| Candidate ranking and queue projection | `tests/integration/338_candidate_ranking_and_queue_projection.spec.ts` | `HubQueueWorkbenchProjection`, queue change batches, replay validation | Browser-visible order drifts from authoritative rank entries, inserted critical work steals the selected anchor, replay no longer reproduces the stored queue order |
| SLA timer and breach posture | `tests/integration/338_sla_timer_and_breach_posture.spec.ts` | queue timers, escalation banners, posture summaries | SLA chips become decorative, no-trusted supply hides behind ordinary queue wording, urgency ordering drifts from authoritative timer facts |
| Ranking and visibility properties | `tests/property/338_ranking_and_visibility_properties.spec.ts` | visible-field contracts, queue-order permutation stability | Audience-tier exposure shifts across seeds, publication order changes ranking semantics, hidden fields drift back into visible payloads |
| Org boundary and scope switcher browser proof | `tests/playwright/338_org_boundary_and_scope_switcher.spec.ts` | shell root acting-context markers, organisation drawer, denied state | One browser session bleeds acting-context state into another, scope switch preserves writable posture when it should freeze or deny, placeholder counts drift from the governing audience tier |
| Queue ranking and SLA browser proof | `tests/playwright/338_hub_queue_ranking_and_sla.spec.ts` | queue workbench, `DecisionDock`, queue change batch, urgency rows | Browser-visible queue order diverges from authoritative rows, buffered/apply flow steals the selected option anchor, urgency copy no longer matches the row projection |
| `mission_stack` browser proof | `tests/playwright/338_hub_mission_stack_responsive.spec.ts` | `HubMissionStackLayout`, `HubDecisionDockBar`, continuity binder | Narrow-screen shell changes the active case meaning, support-drawer travel or reload loses the selected anchor, 400% zoom creates horizontal overflow or motion drift |
| Degraded and quarantined browser proof | `tests/playwright/338_capacity_degraded_and_quarantined_visuals.spec.ts` | degraded queue filter, supplier-drift saved view, callback fallback | Degraded filter becomes a cosmetic view, quarantined candidates regain live direct-commit affordances, callback fallback collapses into ranked offer UI |

## Case IDs

- `SCOPE338_001`: current aligned scope stays `allowed`; organisation drift freezes to `stale` instead of leaving mutation authority live.
- `SCOPE338_002`: `hub_desk_visibility`, `origin_practice_visibility`, and `servicing_site_visibility` expose only their governed visible-field sets.
- `CAP338_001`: trusted, degraded, and quarantined source admissions produce the correct patient-facing frontier suppression.
- `CAP338_002`: trusted-vs-degraded collisions preserve the trusted candidate at the authoritative rank head.
- `RANK338_001`: workbench rows stay in the same order as authoritative rank entries.
- `RANK338_002`: buffered queue changes preserve the selected anchor and replay cleanly.
- `SLA338_001`: urgency timers, escalation banners, and posture summaries derive from authoritative queue facts.
- `PROP338_001`: visibility field sets stay stable across repeated seeds.
- `PROP338_002`: queue-order permutations stay stable for the same pre-commit fact cut.
- `BROWSER338_001`: multi-context org switching preserves isolation and emits read-only then denied shell postures explicitly.
- `BROWSER338_002`: desktop queue order and `DecisionDock` selection match the authoritative applied and unapplied snapshots.
- `BROWSER338_003`: mobile and tablet `mission_stack` keep the same case and option anchors through reload, support-drawer travel, 320px reflow, and reduced motion.
- `BROWSER338_004`: degraded filter and supplier-drift review expose degraded and quarantined trust without leaking ordinary direct-commit affordances.
- `UNSUPPORTED338_001`: patient-choice-expiry timer claims remain explicitly unsupported because the frozen upstream seam `PHASE5_BATCH_316_323_INTERFACE_GAP_QUEUE_PATIENT_CHOICE_EXPIRY.json` still blocks a truthful end-to-end proof.

## Environment Labels

- `hub_scope_truth_local`
- `capacity_admission_local_twin`
- `hub_queue_projection_local`
- `hub_sla_projection_local`
- `hub_shell_desktop_local`
- `hub_shell_mission_stack_mobile`
- `hub_shell_mission_stack_tablet`
- `hub_shell_capacity_visual_local`

## Evidence Lab

`docs/testing/338_phase5_scope_capacity_ranking_sla_lab.html` is the reviewer-facing evidence surface for this battery. It synchronizes one scenario rail, one central queue/candidate canvas, one right-side inspector, and one lower evidence table so reviewers can inspect the current scenario, its authoritative tuple, its browser proof, and its artifact links without relying on hover-only disclosure.

## Reviewer Scenarios

- Scope drift freeze
- Degraded capacity filter
- Supplier drift quarantine
- Queue delta continuity
- Mission stack parity
- `UNSUPPORTED338_001` for the patient-choice-expiry upstream gap

## Run Commands

```bash
pnpm --dir /Users/test/Code/V/apps/hub-desk build
pnpm --dir /Users/test/Code/V/apps/hub-desk test
pnpm exec vitest run \
  /Users/test/Code/V/tests/integration/338_acting_context_and_visibility_truth.spec.ts \
  /Users/test/Code/V/tests/integration/338_capacity_feed_admission_and_quarantine.spec.ts \
  /Users/test/Code/V/tests/integration/338_candidate_ranking_and_queue_projection.spec.ts \
  /Users/test/Code/V/tests/integration/338_sla_timer_and_breach_posture.spec.ts \
  /Users/test/Code/V/tests/property/338_ranking_and_visibility_properties.spec.ts
pnpm exec tsx /Users/test/Code/V/tests/playwright/338_org_boundary_and_scope_switcher.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/338_hub_queue_ranking_and_sla.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/338_hub_mission_stack_responsive.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/338_capacity_degraded_and_quarantined_visuals.spec.ts --run
pnpm validate:338-scope-capacity-ranking-sla
```

## Evidence Bundle Requirements

The machine-readable bundle in `data/test-reports/338_scope_capacity_ranking_sla_results.json` must record, for every suite and case:

- `providerRef`
- `environmentId`
- `seed`
- `artifactRefs`
- `status` from `passed`, `failed`, `blocked`, or `unsupported`

The companion `data/test-reports/338_scope_capacity_ranking_sla_failure_clusters.json` must preserve unsupported or blocked seams explicitly instead of hiding them inside the passing result set. For 338 that includes the patient-choice-expiry upstream gap until the seam owner lands a truthful timer projection.
