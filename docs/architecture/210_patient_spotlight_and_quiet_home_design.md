# 210 patient spotlight and quiet home design

Task: `par_210_crosscutting_track_backend_build_patient_spotlight_decision_projection_and_quiet_home_logic`

## Runtime surface

`GET /v1/me/home` is the patient-home query surface. It returns the canonical `PatientHomeProjection` with `projectionAlias: "PatientPortalHomeProjection"` so sibling tracks can consume either name without creating a third home contract.

The assembler is `assemblePatientHomeProjection` in `services/command-api/src/authenticated-portal-projections.ts`. It produces:

- `PatientSpotlightDecisionProjection`
- `PatientSpotlightDecisionUseWindow`
- `PatientQuietHomeDecision`
- `PatientNavUrgencyDigest`
- `PatientNavReturnContract`
- `PatientPortalNavigationProjection`

The service method is `authenticatedPortalProjectionService.getPatientHome(input)`. `resolvePortalEntry` still builds home as part of `/v1/me`, but the home-specific query is now first-class.

## Candidate ladder

Candidates are normalized into `PatientSpotlightCandidateProjection` and ranked by this tuple:

`decisionTier`, `patientSafetyBlocker`, `patientOwedAction`, `activeDependencyFailure`, `authoritativeDueAt`, `latestMeaningfulUpdateAt`, `stableEntityRef`.

The exact decision tiers are:

- `urgent_safety`
- `patient_action`
- `dependency_repair`
- `watchful_attention`
- `quiet_home`

The candidate types supported by the backend and atlas are:

- `active_request`
- `pending_patient_action`
- `dependency_repair`
- `callback_message_blocker`
- `record_results_cue`
- `contact_reachability_repair`
- `recovery_identity_hold`

Candidates are excluded before ranking when any gate fails: visibility policy, identity hold, continuity tuple, release-trust state, live capability lease, writable eligibility, or recovery-only posture. Excluded candidates remain in `candidateLadder` with `exclusionReasons`; they block quiet-home eligibility rather than disappearing into an empty set.

## Use window and hysteresis

`PatientSpotlightDecisionUseWindow` prevents equal-tier spotlight churn. The active candidate is preserved while its window is active unless a challenger has a higher decision tier. Expiration or explicit revalidation reruns the full rank tuple and emits one of:

- `new_selection`
- `preserved`
- `preempted_by_higher_tier`
- `expired_revalidated`
- `quiet_revalidated`

Every decision exposes `selectionTupleHash`, the active challenger, and the explanation string used by the atlas `TupleInspector`.

## Quiet home rules

quiet home is a positive decision, not the fallback for an empty query. `PatientQuietHomeDecision.eligible` can be true only when:

- visible candidate count is zero,
- excluded candidate count has no blockers,
- home truth state is `complete`,
- shell consistency is `consistent`,
- the coverage surface is not recovery or identity hold.

The quiet decision records why quiet was allowed or blocked and provides a gentlest safe next action. Recovery-only, identity-hold, failed-query, converging, and fallback states all block quiet home.

## One dominant action

The home projection exposes at most one `dominantActionRef`. For spotlight candidates, the action comes from the selected entity and is returned only when the capability lease is `live` and writable eligibility is `writable`. Recovery-only or blocked homes expose only safe recovery actions such as `re_authenticate_or_resume_recovery`; quiet homes have no dominant action.

## Design research borrowed

The atlas and production projection copy borrow four high-trust patterns:

- NHS service manual plain-language and action-link discipline: use direct labels, avoid vague status decoration, and put urgent routes in obvious places. Source: https://service-manual.nhs.uk/content/plain-english and https://service-manual.nhs.uk/design-system/components/action-link
- GOV.UK summary-list and warning-text patterns: expose decision evidence as key/value rows and reserve warning tone for actual blockers. Source: https://design-system.service.gov.uk/components/summary-list/ and https://design-system.service.gov.uk/components/warning-text/
- Apple privacy guidance: make privacy and permission implications explicit before exposing sensitive health context. Source: https://developer.apple.com/design/human-interface-guidelines/privacy
- Monzo writing principles: explain the user impact first and keep complex service state readable without patronising copy. Source: https://monzo.com/tone-of-voice

## Layout contract

The live patient home keeps the production shell stable:

- persistent shell band: `64px`
- left navigation: `240px`
- primary column: `minmax(720px, 1fr)`
- optional assist column: `320px`
- max width: `1440px`
- page padding: `32px`
- rhythm: `8px`

The atlas uses a diagnostic layout, not a dashboard: max width `1560px`, page padding `28px`, scenario rail `280px`, mock-home frame `minmax(760px, 1fr)`, right inspector `392px`, and a three-panel lower evidence zone. The required regions are `SpotlightCandidateLadder`, `SpotlightUseWindowStrip`, `QuietHomeEligibilityMap`, `MockHomeFrame`, `TupleInspector`, and `MatrixShelf`.

## Evidence

- Candidate and quiet-home matrix: `data/analysis/210_spotlight_candidate_and_quiet_home_matrix.csv`
- Use-window cases: `data/analysis/210_spotlight_use_window_cases.json`
- Alias resolution: `data/analysis/210_home_projection_alias_resolution.json`
- Atlas: `docs/frontend/210_quiet_home_state_atlas.html`
- Validator: `tools/analysis/validate_patient_home_projection_stack.py`
