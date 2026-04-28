# 215 Patient Home, Requests, and Request Detail Routes

## Scope

Task:
`par_215_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_patient_home_requests_and_request_detail_routes`

This implementation publishes the production patient shell routes `/home`, `/requests`, and
`/requests/:requestId` in `apps/patient-web`. The route family uses
`Quiet_Casework_Premium` and renders only from the shared projection language:

- `PatientSpotlightDecisionProjection`
- `PatientQuietHomeDecision`
- `PatientNavUrgencyDigest`
- `PatientNavReturnContract`
- `PatientRequestsIndexProjection`
- `PatientRequestSummaryProjection`
- `PatientRequestLineageProjection`
- `PatientRequestDetailProjection`
- `PatientRequestDownstreamProjection`
- `PatientNextActionProjection`
- `PatientActionRoutingProjection`
- `PatientActionSettlementProjection`
- `PatientSafetyInterruptionProjection`
- `PatientRequestReturnBundle`

The frontend owns presentation and same-shell view continuity. It does not create new request truth,
join missing child surfaces locally, or promote dashboard filler.

## Route Contract

### `/home`

`/home` renders a governed home surface with exactly one promoted spotlight when
`PatientSpotlightDecisionProjection.selectedActionRef` is present. If the home projection resolves
to quiet mode, `/home?mode=quiet` demonstrates the quiet variant and uses
`PatientQuietHomeDecision` as a positive decision, not an empty state.

Home has:

- one `HomeSpotlightCard` in attention mode, or one `QuietHomePanel` in quiet mode
- one compact 2x2 grid with active requests, appointments, record updates, and unread messages
- governed placeholder states for appointments, records, and communications
- no charts, KPIs, feed filler, or synthetic dashboard counts

### `/requests`

`/requests` renders `PatientRequestsIndexProjection` as a filter rail with needs-attention,
in-progress, and complete buckets. `RequestSummaryRow` exposes row selection separately from focus:
Tab enters the list and arrow keys move between rows. Enter or Space opens detail.

The index stores the current filter and selected anchor in `PatientRequestReturnBundle`. Browser
back, refresh replay, and soft navigation all restore the same row focus target when policy allows.

### `/requests/:requestId`

The detail route renders the same request lineage in top-to-bottom order:

1. `RequestLineageStrip` shows lineage, tuple, and freshness.
2. `RequestDetailHero` shows title, status, and patient-safe detail.
3. `GovernedPlaceholderCard` instances show future child surfaces.
4. `DecisionDock` carries the single dominant action for the current detail.
5. `CasePulsePanel` and trust summaries describe freshness, receipt, and return context.

The detail route preserves `selectedAnchorRef`, `selectedFilterRef`, `lineageTupleHash`, and
`continuityEvidenceRef` through the return bundle. Future child routes such as more information,
callback status, record follow-up, and communications thread are represented as governed
placeholders rather than omitted or simulated.

## Visual Grammar

The style system is `Quiet_Casework_Premium`.

- Canvas: `#F6F8FB`
- Panel: `#FFFFFF`
- Tint: `#EEF3F9`
- Strong text: `#102033`
- Default text: `#425466`
- Border: `#D9E1EA`
- Accent: `#495FEA`
- Teal: `#0E8C87`
- Amber: `#B7791F`
- Red: `#B42318`
- Green: `#127A5A`

Route geometry follows the shared prompt:

- top shell band: `64px`
- production max width: `1240px`
- desktop detail grid: `minmax(0, 1fr) 304px`
- desktop gutter: `32px`
- rhythm token: `8px`
- mobile page padding: `16px`
- mobile sticky top: `56px`

Motion is limited to a 150ms opacity and translate route transition. `prefers-reduced-motion:
reduce` removes the transition and keeps the same content order.

## Accessibility And Safety

The shell follows the NHS service manual principle that services must be accessible and usable,
GOV.UK task review patterns for summary/context rows, WCAG 2.2 reflow and focus visibility checks,
and Playwright `ariaSnapshot` coverage for semantic regression tests.

Applied rules:

- one `main` landmark per route
- named navigation, rail, detail, and complementary regions
- heading order follows the visible route hierarchy
- one dominant CTA on the active surface
- focus returns to the selected request row after detail-to-index navigation
- live-region messages describe current route and selected request without replaying old events
- placeholder cards state the governing projection and reason, but do not expose staff-only or
  clinical-private data
- color supports scanning but labels carry the status meaning
- 400% zoom and mobile layouts collapse to a single column without horizontal scroll

Official references used:

- NHS service manual accessibility: <https://service-manual.nhs.uk/accessibility>
- GOV.UK Check answers pattern: <https://design-system.service.gov.uk/patterns/check-answers/>
- GOV.UK Confirmation pages pattern: <https://design-system.service.gov.uk/patterns/confirmation-pages/>
- WCAG 2.2 quick reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- Playwright ARIA snapshots: <https://playwright.dev/docs/aria-snapshots>
- Playwright screenshots: <https://playwright.dev/docs/screenshots>

## Boundary Notes

This task intentionally does not implement the future child surfaces owned by later tasks. It
creates visible, focusable, governed placeholders for:

- more information response
- callback status
- record follow-up
- communications thread

Those placeholders carry `PatientRequestDownstreamProjection` and gap references so integration can
replace them without changing the route shell, row selection model, or return bundle structure.
