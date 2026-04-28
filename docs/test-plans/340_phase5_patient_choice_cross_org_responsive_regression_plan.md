# 340 Phase 5 Browser Regression Plan

## Objective

`seq_340` is the final browser-proof battery for the human-facing Phase 5 release. The suite is only valid if it proves truthful patient choice, minimum-necessary cross-organisation visibility, acting-context drift freezes, responsive continuity, and accessibility/content integrity together.

## Route Inventory

| Surface family | Audience | Primary route or shell | Acting context | Visibility tier | Responsive forms | Dominant action | Truth contract | Evidence source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Patient choice visible frontier | Patient | `/network/alternatives/:offerSessionId` | patient authenticated | patient-safe | wide, mobile, high-zoom, WebKit, Firefox | select or acknowledge an alternative offer | visible frontier, warning posture, callback separation, selected-anchor continuity | `340_patient_choice_truth_and_continuity.spec.ts` |
| Hub-assisted alternatives | Hub operator | `/hub/queue` with alternatives or callback recovery state | hub operator authenticated | hub operator full visibility | wide desktop | keep offerable and diagnostic options visible without collapsing callback into the ranked stack | advisory ranking, callback fallback separation, bounded recovery | `340_patient_choice_truth_and_continuity.spec.ts` |
| Cross-org visibility posture | Hub operator, origin practice, servicing site | `/hub/case/:hubCoordinationCaseId` | organisation/site/purpose tuple | origin-practice visibility, servicing-site visibility, no visibility | wide desktop | inspect or continue a case without hidden-field leakage | minimum-necessary placeholders, denied posture, same-shell continuity | `340_cross_org_visibility_and_scope_drift.spec.ts` |
| Cross-org patient-safe follow-on | Patient | `/network/confirmation/:appointmentId`, `/network/manage/:appointmentId` | patient authenticated | patient-safe | wide desktop | read truthful confirmation or manage posture without hub-only leakage | confirmation and manage truth remain patient-safe across DOM and accessibility tree | `340_cross_org_visibility_and_scope_drift.spec.ts` |
| Hub responsive continuity | Hub operator | `hub-desk-shell` family from `326`, `327`, `331`, `332`, `333` | hub operator authenticated | role-appropriate | wide, narrow desktop, tablet portrait, tablet landscape, reduced-motion | preserve selected case and dominant action through layout collapse | same-shell anchor continuity, decision dock continuity, focus return | `340_responsive_same_shell_continuity.spec.ts` |
| Patient responsive continuity | Patient | alternatives, appointment family, and waitlist follow-on surfaces | patient authenticated | patient-safe | mobile portrait, high-zoom reflow | keep sticky actions, return anchors, and readable status hierarchy intact | mission-stack continuity, reflow, no stale actionability | `340_responsive_same_shell_continuity.spec.ts` |
| Accessibility and content regression | Patient and hub | patient choice, confirmation, manage, appointment family, acting-context drawer, break-glass modal | mixed | mixed | wide desktop and mobile WebKit | preserve durable semantics and truthful wording | landmarks, status messages, focus order, focus trap, plain-language copy | `340_accessibility_content_and_regression.spec.ts` |

## Risk Class Mapping

- Risk class: patient choice truth
  Covered by `CHOICE340_001`, `CHOICE340_002`, `CHOICE340_004`, `CHOICE340_007`.
- Risk class: cross-org leakage
  Covered by `VIS340_001`, `VIS340_002`, `VIS340_005`, plus ARIA snapshots on patient-safe and hub-only regions.
- Risk class: stale-scope mutation
  Covered by `VIS340_003`, `VIS340_004`, `A11Y340_004`.
- Risk class: responsive anchor loss
  Covered by `RESP340_001` to `RESP340_006`.
- Risk class: accessibility regression
  Covered by `A11Y340_001` to `A11Y340_005`.
- Risk class: wording overclaim
  Covered by `A11Y340_002`, `A11Y340_003`, `CHOICE340_006`.
- Risk class: evidence continuity failure
  Covered by all four matrix-emitting Playwright specs and the aggregation bundle produced by `aggregate_340_phase5_browser_results.ts`.

## Deterministic Fixture Controls

- Recommended visible frontier
  `offer_session_328_live` is fixed so the recommended entry and the visible frontier are derived from the same authoritative choice proof.
- Warned choice and callback separation
  Firefox, Chromium, and hub-assisted flows pin the warned provider, diagnostic-only options, and callback fallback into known fixtures.
- Cross-org minimum-necessary
  `hub-case-104` and `hub-case-031` force origin-practice, servicing-site, denied, break-glass, and purpose-drift states with stable hidden-field expectations.
- Responsive continuity
  The hub queue selection is fixed to `hub-case-052` and `opt-052-variance`; patient high-zoom flows pin `family_waitlist_fallback_due`.
- Reduced-motion and high-zoom
  Dedicated projects force `prefers-reduced-motion: reduce` and a `320px` / `400%` proxy without changing the functional truth.
- Accessibility semantics
  ARIA snapshots are captured only for high-risk regions: appointment family, hub acting-context posture, and mobile artifact/timeline disclosure states.

## Project Matrix

- `hub_operator_wide_chromium`
- `hub_operator_narrow_chromium`
- `hub_operator_tablet_portrait_chromium`
- `hub_operator_tablet_landscape_chromium`
- `hub_operator_reduced_motion_chromium`
- `cross_org_scope_variation_chromium`
- `patient_authenticated_chromium_wide`
- `patient_wide_desktop_firefox`
- `patient_mobile_portrait_chromium`
- `patient_mobile_portrait_webkit`
- `patient_high_zoom_reflow_chromium`

## Mandatory Gap Closures

- Patient choice visible frontier
  The suite proves that the recommended provider stays inside the visible frontier and that warned or diagnostic providers remain visible when the policy proof still permits them.
- Cross-org minimum-necessary
  The suite checks DOM, accessibility snapshots, and same-shell denied posture instead of trusting hidden client state.
- Responsive continuity
  Proof includes interaction, keyboard, focus, and selected-anchor continuity rather than screenshots alone.
- Reduced-motion and high-zoom
  Reduced-motion and high-zoom are treated as first-class release conditions, not polish.

## Repository-Owned Defects Closed By 340

- `patient_mission_stack_sticky_primary_visibility_webkit`
  `/Users/test/Code/V/apps/patient-web/src/patient-booking-responsive.css` now pins the folded patient sticky tray correctly in the Safari-equivalent posture.
- `hub_minimum_necessary_internal_field_token_leak`
  `/Users/test/Code/V/apps/hub-desk/src/hub-desk-shell.tsx` now renders safe human labels instead of raw hidden-field identifiers.
- `hub_break_glass_focus_trap_and_drawer_focus_return`
  `/Users/test/Code/V/apps/hub-desk/src/hub-desk-shell.tsx` now traps modal focus and returns it to `HubActingContextChip` after close.

## Evidence Outputs

- Raw Playwright matrices live under `/Users/test/Code/V/output/playwright/340-*.json`.
- Aggregated machine-readable outputs land in `/Users/test/Code/V/data/test-results/340_*`.
- Reviewer-facing evidence lands in `/Users/test/Code/V/docs/testing/340_phase5_browser_evidence_board.html`.
- Cross-cutting CSV matrices land in `/Users/test/Code/V/data/analysis/340_*_matrix.csv`.
