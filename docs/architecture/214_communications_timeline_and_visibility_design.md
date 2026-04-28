# 214 Communications Timeline And Visibility Design

Task: `par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules`

## Scope

The 214 backend adds a canonical message and callback chronology for the authenticated patient portal. The core projection is `PatientCommunicationsTimelineProjection`, assembled by `CommunicationsTimelineAssembler` and guarded by `CommunicationVisibilityResolver`.

The timeline covers secure messages, clinician replies, callback expectations and outcomes, reminder notices, delivery failures, provider disputes, repair guidance, patient receipts, and command settlements. It keeps visible chronology anchors even when body previews are hidden.

## Projection Family

- `PatientCommunicationsTimelineProjection` is the list-level object for `GET /v1/me/messages`.
- `PatientConversationCluster` is the cluster summary object for each conversation braid.
- `ConversationThreadProjection` hydrates a selected thread route.
- `ConversationSubthreadProjection` models secure-message, callback, reminder, delivery-failure, dispute, repair, receipt, and more-info strands.
- `PatientConversationPreviewDigest` owns row, masthead, callback-card, reminder-notice, composer, and receipt preview posture.
- `PatientCommunicationVisibilityProjection` remains the minimum-necessary preview gate and is produced through `CommunicationVisibilityResolver`.
- `ConversationCallbackCardProjection` consumes `PatientCallbackStatusProjection` from the 212 callback family. It does not compute a second callback truth.
- `PatientReceiptEnvelope` and `ConversationCommandSettlement` separate local acknowledgement, provider transport acceptance, delivery proof, and authoritative outcome.
- `PatientComposerLease` controls reply and callback mutation affordances.
- `ConversationTimelineAnchor` and `PatientConversationClusterSummary` provide stable ordering and list hydration anchors.

## Tuple Alignment

Every list row, thread masthead, callback card, reminder notice, composer lease, receipt summary, and cluster timeline carries the same tuple:

- `clusterRef`
- `threadId`
- `threadTupleHash`
- `receiptGrammarVersionRef`
- `monotoneRevision`
- `previewVisibilityContractRef`
- `summarySafetyTier`

The assembler computes `threadTupleHash` from the canonical cluster, thread, receipt grammar, monotone revision, preview contract, summary tier, envelope refs, and callback-status projection refs. If a source `expectedThreadTupleHash` does not match, or `forceTupleDrift` is set in simulator input, the thread enters `drifted` state, the composer lease is blocked, and `PORTAL_214_TUPLE_ALIGNMENT_DRIFT` is emitted.

## Visibility Modes

`CommunicationVisibilityResolver` maps coverage state to four preview modes:

- `public_safe_summary`: visible row and public-safe subject, but governed placeholder for body content.
- `authenticated_summary`: patient-safe row, timeline anchors, callback cards, reminder notices, and governed snippets.
- `step_up_required`: visible placeholder with kind, reason, and next step.
- `suppressed_recovery_only`: same-shell recovery placeholder and no PHI-bearing snippet refs.

Hidden previews are never omitted. The row remains present with `placeholderKind`, `placeholderReasonRefs`, and `placeholderNextStepRef`.

## Ordering

`ConversationTimelineAnchor` uses source envelope time as the causal anchor. The timeline sorts anchors chronologically and cluster summaries by `latestMeaningfulUpdateAt`. Delivery failures and disputes remain timeline events because they change patient-facing actionability even when content preview is limited.

## Callback Compatibility

The callback route `GET /v1/me/messages/{clusterId}/callback/{callbackCaseId}` hydrates `ConversationCallbackCardProjection` from `PatientCallbackStatusProjection`. The callback card copies visible state, window risk, route-repair posture, and dominant action from the 212 projection and adds only tuple and surface alignment. This closes the no-second-callback-truth gap.

## Receipt Finality

Local acknowledgements and transport acceptance are useful progress signals, not settlement truth. `PatientReceiptEnvelope` can show `localAckState=accepted_locally` and `transportAcceptanceState=accepted` while `ConversationCommandSettlement.calmSettledLanguageAllowed=false` until the authoritative outcome is `settled`.

## Routes

- `GET /v1/me/messages`
- `GET /v1/me/messages/{clusterId}`
- `GET /v1/me/messages/{clusterId}/thread/{threadId}`
- `GET /v1/me/messages/{clusterId}/callback/{callbackCaseId}`
- `GET /v1/me/messages/{clusterId}/hydrate`

Route ids: `patient_portal_messages_index`, `patient_portal_message_cluster`, `patient_portal_message_thread`, `patient_portal_message_callback_status`, `patient_portal_message_cluster_hydration`.

## Standards Notes

The atlas and route wording follow NHS service manual accessibility guidance, GOV.UK check-answer style for confirming important values, Playwright ARIA snapshot testing, and WCAG 2.2 perceivable/operable/name-role-value expectations:

- https://service-manual.nhs.uk/accessibility
- https://design-system.service.gov.uk/patterns/check-answers/
- https://playwright.dev/docs/aria-snapshots
- https://www.w3.org/WAI/WCAG22/quickref/

## Reason Code Vocabulary

- `PORTAL_214_COMMUNICATION_TIMELINE_ASSEMBLED`
- `PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER`
- `PORTAL_214_STEP_UP_PLACEHOLDER`
- `PORTAL_214_RECOVERY_ONLY_PLACEHOLDER`
- `PORTAL_214_TUPLE_ALIGNMENT_VERIFIED`
- `PORTAL_214_TUPLE_ALIGNMENT_DRIFT`
- `PORTAL_214_LOCAL_SUCCESS_NOT_FINAL`
- `PORTAL_214_DELIVERY_FAILURE_VISIBLE`
- `PORTAL_214_DISPUTE_VISIBLE`
- `PORTAL_214_BLOCKER_REPAIR_DOMINATES`
- `PORTAL_214_CALLBACK_STATUS_COMPATIBILITY`
