# 216 More-Info, Callback, and Contact Repair Views

## Scope

Task:
`par_216_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_more_info_response_callback_status_and_contact_repair_views`

This task adds patient-facing views for:

- `/requests/:requestId/more-info`
- `/requests/:requestId/more-info/step-2`
- `/requests/:requestId/more-info/check`
- `/requests/:requestId/more-info/confirmation`
- `/requests/:requestId/more-info/late-review`
- `/requests/:requestId/more-info/expired`
- `/requests/:requestId/more-info/read-only`
- `/requests/:requestId/callback`
- `/requests/:requestId/callback/at-risk`
- `/requests/:requestId/consent-checkpoint`
- `/contact-repair/:repairCaseId`
- `/contact-repair/:repairCaseId/applied`

The visual mode is `Precision_Reassurance_Workflow`. The production code lives in
`apps/patient-web/src/patient-more-info-callback-contact-repair.*`.

## Projection Contract

The UI consumes these projection families from task 212 and the request-shell return bundle from
task 215:

- `PatientMoreInfoStatusProjection`
- `PatientMoreInfoResponseThreadProjection`
- `PatientCallbackStatusProjection`
- `PatientReachabilitySummaryProjection`
- `PatientContactRepairProjection`
- `PatientConsentCheckpointProjection`
- `PatientRequestReturnBundle`

The route never treats secure-link expiry, browser-local timers, or the last successful send as
authoritative truth. It renders state from projection fixture objects that mirror the backend
contract and preserve:

- `cycleRef`
- `replyWindowCheckpointRef`
- `latestResponseDispositionRef`
- `experienceContinuityEvidenceRef`
- `selectedAnchorRef`
- `requestReturnBundleRef`

## UI Structure

### More-Info Child Surface

`MoreInfoThreadFrame` keeps the owning request visible through a request summary capsule and a
`ContinuityPreservedPanel`. The active prompt is the main work unit. For this seeded cycle the
thread has two focused steps:

1. photo timing
2. symptom change since request

The patient sees one focused prompt at a time. The `CheckAnswersPanel` appears before send so the
patient can review the answers that will be submitted. `SubmissionReceiptPanel` explains that the
reply was received and is awaiting review.

Validation uses a top error summary plus inline field errors. It preserves entered values and moves
focus to the error summary after a blocked submit.

### Callback Status

`CallbackStatusRail` presents callback truth as a labelled rail. It has no animated countdown and no
browser-local promise copy. When reachability is clear, the current state stays calm. When the route
is at risk, the dominant action switches to repair and stale callback controls stay suppressed.

### Contact Repair

`ContactRepairBridge` keeps the blocked action visible through `BlockedActionSummaryCard`. Repair
does not reopen response controls by itself. The applied state returns to the same more-info shell
only after the repair journey and reachability assessment are represented as rebound-pending.

### Consent Checkpoint

`PatientConsentCheckpointProjection` freezes dependent callback or response actions in place. The
view describes what is blocked, exposes `renew_consent` as the dominant action, and keeps the
request return bundle visible.

## Accessibility And Safety

The implementation follows the shared accessibility and content contract:

- one `main` landmark
- semantic `fieldset` and `legend` for answer steps
- top error summary on validation failure
- inline errors with `aria-invalid` and `aria-errormessage`
- keyboard-only completion for validation, check answers, confirmation, callback, and repair states
- reduced-motion mode removes decorative transitions
- confirmation explains what happens next
- blocker states use text, structure, and action changes, not color alone

Official references used:

- GOV.UK Question pages: <https://design-system.service.gov.uk/patterns/question-pages/>
- GOV.UK Check answers: <https://design-system.service.gov.uk/patterns/check-answers/>
- GOV.UK Confirmation pages: <https://design-system.service.gov.uk/patterns/confirmation-pages/>
- GOV.UK Error summary: <https://design-system.service.gov.uk/components/error-summary/>
- WCAG 2.2 quick reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- Playwright ARIA snapshots: <https://playwright.dev/docs/aria-snapshots>

## Safety Notes

- More-info is a same-shell, same-object child route of request detail, not a detached form.
- Callback status derives from `CallbackExpectationEnvelope`, `CallbackOutcomeEvidenceBundle`, and
  `CallbackResolutionGate` references, not from UI timers.
- Contact repair preserves the blocked context and selected anchor.
- Read-only and expired states keep the last safe summary and suppress live reply controls.
- Consent checkpoint suppresses dependent quiet-success copy until renewal or recovery settles.
