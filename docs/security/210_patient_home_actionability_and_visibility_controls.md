# 210 patient home actionability and visibility controls

Task: `par_210_crosscutting_track_backend_build_patient_spotlight_decision_projection_and_quiet_home_logic`

## Control boundary

`PatientHomeProjection` is assembled after `PatientAudienceCoverageProjection` and `PatientShellConsistencyProjection`. The home stack is projection-first: controllers do not broad-fetch request, message, record, or account payloads and trim them locally.

The home query surface is `GET /v1/me/home`; the returned contract family is `PatientHomeProjectionContract`. `PatientPortalHomeProjection` is an alias only.

## Candidate visibility gates

Every candidate is normalized with these gates before ranking:

- `visibilityAllowed`
- `identityHoldClear`
- `continuityClear`
- `releaseTrustClear`
- `capabilityLeaseState`
- `writableEligibilityState`
- `recoveryOnly`

Any failed gate changes the candidate to `visibilityState: "excluded"` and adds a concrete `exclusionReasons` value. Exclusion prevents accidental promotion and prevents quiet home from claiming all clear.

## Actionability controls

The one dominant action rule is enforced in `PatientSpotlightDecisionProjection`:

- selected action must belong to the selected entity,
- selected entity must have `capabilityLeaseState: "live"`,
- selected entity must have `writableEligibilityState: "writable"`,
- recovery-only and identity-hold states cannot expose PHI-bearing mutation actions,
- quiet homes expose no dominant action.

This keeps the home page from turning secondary navigation, account maintenance, or passive status content into competing calls to action.

## Quiet-home denial reasons

`PatientQuietHomeDecision` records one of:

- `all_clear`
- `candidate_present`
- `blocked_by_recovery`
- `blocked_by_identity_hold`
- `blocked_by_degraded_truth`
- `blocked_by_visibility_or_actionability`

The explicit `blocked_by_degraded_truth` case protects against empty results caused by query failure, convergence delay, or fallback data. The exact query truth state is preserved in `queryTruthState`.

## Minimum necessary display

The live home may show one spotlight, compact summary cards, urgent-help route, and quiet secondary disclosure. It must not show charts, KPI grids, carousels, dashboard filler, or multi-CTA hero blocks. Atlas-only charts have table parity in `MatrixShelf`.

The projection avoids raw identifiers, raw contact details, raw claims, local storage, cookies, and controller-local trimming. Patient-safe labels are inherited from existing request projections.

## Recovery and identity holds

Recovery and identity-hold candidates are represented as `recovery_identity_hold`. They are excluded from normal spotlight ranking, block quiet home, and route only to safe recovery surfaces:

- `/v1/me/recovery/current`
- `/v1/me/identity-hold`

The `PatientNavReturnContract` preserves continuity without exposing extra PHI. Its tuple hash binds coverage, selected candidate, and return route.

## Audit and validation

Security evidence is covered by:

- `data/analysis/210_spotlight_candidate_and_quiet_home_matrix.csv`
- `data/analysis/210_spotlight_use_window_cases.json`
- `data/analysis/210_home_projection_alias_resolution.json`
- `services/command-api/tests/patient-home-projection-stack.integration.test.js`
- `tests/playwright/210_quiet_home_state_atlas.spec.js`
- `tools/analysis/validate_patient_home_projection_stack.py`
