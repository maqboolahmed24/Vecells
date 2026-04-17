# 211 request lineage and action routing design

Task: `par_211_crosscutting_track_backend_build_request_browsing_detail_and_typed_patient_action_routing_projections`

## Runtime surface

The request browsing stack remains inside `AuthenticatedPortalProjectionService` so the list, detail, action route, recovery, and identity-hold projections share one coverage and shell-consistency tuple.

Primary query surfaces:

- `GET /v1/me/requests` returns `PatientRequestsIndexProjection`, `PatientRequestSummaryProjection`, `PatientRequestLineageProjection`, `PatientRequestReturnBundle`, `PatientNextActionProjection`, `PatientRequestDownstreamProjection`, and safety interruption evidence.
- `GET /v1/me/requests/{requestRef}` returns the same tuple for one request plus `PatientRequestDetailProjection`, communication visibility, `PatientActionRoutingProjection`, and `PatientActionSettlementProjection`.
- `POST /v1/me/requests/{requestRef}/actions/{actionType}/route` is the route-resolution surface for typed patient mutations. The UI must resolve this envelope before posting to any domain command.

## Projection family

The production code in `services/command-api/src/authenticated-portal-projections.ts` now includes:

- `PatientRequestsIndexProjection`
- `PatientRequestSummaryProjection`
- `PatientRequestLineageProjection`
- `PatientRequestDownstreamProjection`
- `PatientRequestDetailProjection`
- `PatientRequestReturnBundle`
- `PatientNextActionProjection`
- `PatientActionRoutingProjection`
- `PatientActionSettlementProjection`
- `PatientSafetyInterruptionProjection`

`PatientRequestReturnBundle` is the same-shell return memory for a request row, detail header, child placeholder, recovery posture, and post-action settlement view. Browser history can replay it, but it cannot replace it.

## List/detail alignment

`PatientRequestLineageProjection.lineageTupleHash` is reused by the detail projection and return bundle. `PatientRequestsIndexProjection.selectedRequestReturnBundleRef` binds the selected row to the exact request return bundle, and the detail projection repeats the same `requestReturnBundleRef`.

The list and detail surfaces may degrade differently by audience, but they may not disagree about:

- request lineage ref,
- downstream ordering digest,
- selected child anchor tuple,
- placeholder refs,
- awaiting party,
- safest next action,
- continuity evidence.

## Downstream placeholders

`PatientRequestDownstreamProjection` normalizes visible child objects into one related-work grammar. It preserves child anchors even when a richer sibling projection is unavailable.

Current mock-now placeholders:

- conversation and more-info context use `PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json`
- record follow-up uses the existing records seam until task 213 owns record artifacts
- read-only, step-up, recovery, and identity-hold states remain visible as placeholders instead of disappearing

## One dominant next action

`PatientNextActionProjection` is the authority for the request-level dominant CTA. It derives the action from current coverage, safety interruption, downstream blockers, preferred action type, and request truth.

Allowed action types:

- `respond_more_info`
- `callback_response`
- `contact_route_repair`
- `record_follow_up`
- `view_request`
- `recover_session`
- `none`

Only one `dominantActionRef` can be live. List rows, detail headers, downstream cards, and placeholders consume the same next-action projection rather than inventing competing CTAs.

## Typed routing and settlement

`PatientActionRoutingProjection` binds:

- governing object ref and version,
- route family,
- route intent binding,
- capability lease,
- writable eligibility fence,
- policy bundle,
- request return bundle,
- continuity evidence,
- freshness token,
- action type,
- blocked reason or safety interruption.

`PatientActionSettlementProjection` distinguishes local acknowledgement, pending authoritative confirmation, external observation, authoritative settlement, and disputed or recovery-required posture. Calm completion is legal only when `authoritativeOutcomeState` is `authoritative_outcome_settled`.

## Safety interruption

`PatientSafetyInterruptionProjection` suppresses stale actionability without discarding the selected request anchor. If the state is `assimilation_pending`, `review_pending`, `urgent_required`, or `manual_review_required`, the next-action projection becomes blocked and the routing envelope points at the interruption reason.

## Design research borrowed

The atlas borrows four high-trust list/detail patterns:

- GOV.UK Task List and Summary List: status is brief, table-like evidence is explicit, and summary rows avoid decorative density. Sources: https://design-system.service.gov.uk/components/task-list/ and https://design-system.service.gov.uk/components/summary-list/
- NHS card guidance: cards are used only for grouped navigation or related content, not a mosaic of competing actions. Source: https://service-manual.nhs.uk/design-system/components/card
- Atlassian Jira issue view: side context should stay concise, align with issue hierarchy, and use lozenges/badges sparingly. Source: https://developer.atlassian.com/cloud/jira/platform/issue-view/
- GitHub Primer ActionList: selectable lists should support leading/trailing visual affordances without turning every row into a full dashboard. Source: https://primer.style/product/components/action-list/

## Layout contract

Live request shell:

- persistent shell band: `64px`
- left navigation rail: `240px`
- page max width: `1440px`
- row height target: `88px` to `116px`
- dominant CTA belongs in the list section header or detail header, not repeated across child cards
- mobile is one column; sticky bottom actions are allowed only when there is exactly one dominant action

Atlas:

- visual mode: `Request_Lineage_Action_Atlas`
- max width: `1580px`
- outer padding: `28px`
- left pane: request list frame, `4 / 12`
- center pane: detail frame, `5 / 12`
- right pane: routing and settlement inspector, `3 / 12`
- lower matrix shelf: full width with `3` panels

Required regions are `LineageOrderBraid`, `ActionRoutingEnvelopeMap`, `SettlementLadder`, `MockListDetailFrame`, `SafetyInterruptionStrip`, and `MatrixShelf`.
