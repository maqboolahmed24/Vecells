# 196 Authenticated Patient Home And Status Tracker Uplift

`par_196` implements the signed-in patient home and request-status tracker as a projection-driven portal surface. It consumes the task 185 portal visibility vocabulary and keeps the live app under `/portal/*` so the older seed shell can continue to exist while the phase 2 authenticated experience moves forward.

## Projection Contract

The frontend resolves one `PatientPortalEntryProjection` for every `/portal/*` path. That entry carries the current `PatientHomeProjection`, `PatientPortalNavigationProjection`, `PatientRequestsIndexProjection`, optional `PatientRequestDetailProjection`, and the `PatientRequestReturnBundle` required to preserve the selected request anchor across soft navigation, browser back, refresh, and bounded recovery.

The home spotlight is not a dashboard widget. It is selected by exactly one `PatientSpotlightDecisionProjection`. Supporting cards for active requests, callbacks/messages, and account details remain compact and secondary. Contact-preference copy is promoted only when `PatientIdentityHoldProjection.blocksCurrentAction` is true for the current path.

Task 185 is treated as the upstream visibility contract:

| 185 state | 196 implementation |
| --- | --- |
| `PORTAL185_HOME_READY` | `/portal/home` renders one dominant request spotlight plus compact secondary cards. |
| `PORTAL185_REQUESTS_INDEX_FULL` | `/portal/requests` groups request rows into Needs attention, In progress, and Complete. |
| `PORTAL185_DETAIL_FULL` | `/portal/requests/REQ-4219` renders CasePulse identity, StateBraid timeline, DecisionDock, and freshness ribbon. |
| `PORTAL185_DETAIL_SUMMARY_ONLY` | `/portal/requests/REQ-4219/narrowed` suppresses detail beyond `PatientAudienceCoverageProjection.maxVisibleDetail`. |
| `PORTAL185_IDENTITY_HOLD` | `/portal/reachability-blocker` promotes contact-route repair only because it blocks the current reply. |
| `PORTAL185_RECOVERY_STALE_SESSION` | `/portal/session-expiring` and `/portal/session-expired` keep same-shell bounded recovery. |

## Route Law

The route resolver does not use query parameters, URL fragments, or local card scores to decide the patient state. It maps the path to a `PatientPortalEntryProjection` and then renders the current projection. The selected anchor is written as a `PatientRequestReturnBundle` in session storage so refresh replay can restore focus to the exact request row without exposing extra clinical detail.

The request detail shell preserves the same portal chrome as home and index. It narrows detail when audience or hold posture changes, but it still keeps the selected request summary, status truth, and return bundle visible. Generic home redirects are forbidden while recovery can preserve the selected anchor.

## Layout

The production route uses the `Quiet_Portal_Atlas` mode:

| Slot | Contract |
| --- | --- |
| Top shell band | 64px persistent band with masked identity and coverage posture. |
| Left nav | 240px desktop rail using `aria-current`. |
| Center | `minmax(720px, 1fr)` within max width 1440px and 32px page padding. |
| Optional right | Reserved 320px slot, unused on live home to avoid dashboard filler. |
| Desktop home | Spotlight spans 8/12, compact cards span 4/12, tracker below, quiet disclosure after. |
| Mobile/tablet | One-column layout with nav wrapping before content. |

## User-Facing States

| State | Path | Primary proof |
| --- | --- | --- |
| Attention home | `/portal/home` | `PatientSpotlightDecisionProjection.reason = reply_needed`; one primary action. |
| Quiet home | `/portal/quiet` | No action outranks quiet threshold; no chart, carousel, or filler is introduced. |
| Requests index | `/portal/requests` | Needs attention, In progress, Complete groups derive from `PatientRequestsIndexProjection`. |
| Detail full | `/portal/requests/REQ-4219` | Same shell plus CasePulse identity, StateBraid, DecisionDock, AmbientStateRibbon. |
| Detail narrowed | `/portal/requests/REQ-4219/narrowed` | `PatientAudienceCoverageProjection.maxVisibleDetail = summary_only`. |
| Reachability blocker | `/portal/reachability-blocker` | Contact route promoted because it blocks the current reply action. |
| Session warning | `/portal/session-expiring` | Pre-expiry banner offers bounded same-shell recovery. |
| Session expired | `/portal/session-expired` | Post-expiry recovery preserves the return bundle for 10 minutes. |

## Safety Decisions

The live home avoids charts, meters, carousels, dense widgets, and generic dashboard cards. Diagrams and matrices are restricted to documentation artifacts. List rows and detail cards both render `AudienceCoverageBadge` so row/detail parity is visible and machine-testable.

The UI suppresses staff internal notes, raw identifiers, clinical reasoning, and message or attachment content whenever `PatientAudienceCoverageProjection.maxVisibleDetail` is `summary_only`. It also keeps NHS login identity, Vecells contact preferences, and PDS or GP contact routes separate in wording and data shape.

## Validation

Validation is handled by `tools/analysis/validate_authenticated_home_and_status_tracker.py`. Runtime coverage is handled by `tests/playwright/196_authenticated_patient_home_and_status_tracker_uplift.spec.ts`, including desktop, tablet, mobile, reduced motion, keyboard traversal, ARIA assertions, session expiry, reachability blocker promotion, audience narrowing, and selected-anchor restore.
