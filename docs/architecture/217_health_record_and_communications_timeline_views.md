# 217 Health Record And Communications Timeline Views

Task:
`par_217_crosscutting_track_Playwright_or_other_appropriate_tooling_frontend_build_health_record_and_communications_timeline_views`

Visual mode: `Quiet_Clinical_Correspondence`.

## Scope

This task adds production patient routes for:

- `/records`
- `/records/results/:resultId`
- `/records/documents/:documentId`
- `/messages`
- `/messages/:clusterId`
- `/messages/:clusterId/thread/:threadId`
- `/messages/:clusterId/callback/:callbackCaseId`
- `/messages/:clusterId/repair`

The production implementation lives in
`apps/patient-web/src/patient-records-communications.*`.

## Projection Contract

Records consume the validated task 213 projection family:

- `PatientRecordSurfaceContext`
- `PatientResultInterpretationProjection`
- `PatientResultInsightProjection`
- `PatientRecordArtifactProjection`
- `RecordArtifactParityWitness`
- `PatientRecordFollowUpEligibilityProjection`
- `PatientRecordContinuityState`
- `VisualizationFallbackContract`
- `VisualizationTableContract`
- `VisualizationParityProjection`

Communications consume the validated task 214 projection family:

- `PatientCommunicationsTimelineProjection`
- `PatientConversationCluster`
- `ConversationThreadProjection`
- `ConversationSubthreadProjection`
- `PatientConversationPreviewDigest`
- `PatientCommunicationVisibilityProjection`
- `ConversationCallbackCardProjection`
- `PatientCallbackStatusProjection`
- `PatientReceiptEnvelope`
- `ConversationCommandSettlement`
- `PatientComposerLease`
- `ConversationTimelineAnchor`

The route family also keeps the task 215 `PatientRequestReturnBundle` available so records and
conversation child routes can return to the governing request shell without recomputing ambient
navigation state.

## Records

`RecordOverviewSection` opens `/records` summary-first. The overview groups latest updates, test
results, medicines and allergies, conditions and care plans, letters and documents, and action
needed. Delayed, step-up, and restricted records remain visible as governed placeholders instead of
being omitted.

`ResultInterpretationHero` and the result detail body use the fixed six-part hierarchy from the
blueprint:

1. `what_this_test_is`
2. `latest_result`
3. `what_changed`
4. `patient_next_step`
5. `urgent_help`
6. `technical_details`

`TrendParitySwitcher` makes charts secondary. When `VisualizationParityProjection.parityState` is
not `visual_and_table`, the route demotes to table-first or placeholder posture while preserving
units, selection context, and the same record anchor.

`RecordArtifactPanel` keeps structured document summaries ahead of file handoff. Download or source
handoff is secondary and labelled by `PatientRecordArtifactProjection.sourceAuthorityState`.

`RecordVisibilityPlaceholder` keeps delayed-release, step-up, restricted, identity-hold, and
recovery items present with reason, anchor, continuity, and next safe action.

## Communications

`ConversationClusterList` renders `/messages` as calm grouped chronology rows rather than a generic
notification board. Each row consumes `PatientConversationPreviewDigest` and
`PatientCommunicationVisibilityProjection`.

`ConversationBraid` renders the cluster shell. It has one pinned next-action region and then a
single chronology containing clinician replies, reminders, callback cards, receipts, and repair
state. It suppresses stale live composer or callback reassurance when `PatientComposerLease` or
`PatientCallbackStatusProjection` says repair dominates.

`MessagePreviewCard`, `ReceiptStateChip`, and `DeliveryDisputeNotice` keep unread, reply-needed,
awaiting-review, callback-risk, delivery-failure, dispute, and placeholder states in the same
conversation grammar.

## Safety Notes

- Record summaries, charts, tables, document previews, downloads, and handoff copy remain
  subordinate to `RecordArtifactParityWitness` and current artifact mode truth.
- Charts are never the only path to meaning. The table is always present.
- Delayed, step-up, restricted, and recovery-only records stay visible as placeholders.
- Communications visibility degrades to governed placeholders, not omission.
- Local acknowledgements are shown as progress only; they do not become final settlement copy.
- Delivery failure and provider disputes remain visible until repaired.
- Contact-route repair stays in the conversation shell with the blocked context visible.

## Official Guidance Used

- NHS service manual content guidance: <https://service-manual.nhs.uk/content>
- NHS service manual accessibility guidance: <https://service-manual.nhs.uk/accessibility>
- NHS service manual tables: <https://service-manual.nhs.uk/design-system/components/tables>
- GOV.UK summary list: <https://design-system.service.gov.uk/components/summary-list/>
- GOV.UK table: <https://design-system.service.gov.uk/components/table/>
- WCAG 2.2 quick reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- Playwright ARIA snapshots: <https://playwright.dev/docs/aria-snapshots>
- Playwright screenshots: <https://playwright.dev/docs/screenshots>
