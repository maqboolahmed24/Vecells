# 214 Communications Preview Visibility And Receipt Controls

Task: `par_214_crosscutting_track_backend_build_communications_timeline_and_message_callback_visibility_rules`

## Control Goals

The communications stack must let patients orient themselves without leaking message bodies, callback detail, unreachable contact routes, disputed delivery evidence, or sensitive reminders to the wrong audience.

The control boundary is explicit:

- `PatientAudienceCoverageProjection` selects audience posture.
- `CommunicationVisibilityResolver` turns that posture into preview visibility.
- `PatientConversationPreviewDigest` renders placeholders with kind, reason, and next step.
- `ConversationCommandSettlement` prevents local-success language from becoming finality.

## Preview Suppression

Preview hiding uses visible placeholders, not omission. Each hidden row preserves:

- conversation kind
- why content is limited
- next step
- deterministic reason code
- safe continuation route or recovery route

Reason codes:

- `PORTAL_214_PREVIEW_SUPPRESSED_PLACEHOLDER`
- `PORTAL_214_STEP_UP_PLACEHOLDER`
- `PORTAL_214_RECOVERY_ONLY_PLACEHOLDER`

## Delivery Failure And Dispute Visibility

Failures, bounced reminders, unreachable routes, and provider disputes stay visible as timeline facts. They expose safe summaries and repair actions, not raw transport payloads. The dominant next action becomes repair-first when reachability or evidence is unsafe.

Reason codes:

- `PORTAL_214_DELIVERY_FAILURE_VISIBLE`
- `PORTAL_214_DISPUTE_VISIBLE`
- `PORTAL_214_BLOCKER_REPAIR_DOMINATES`

## Callback Truth Boundary

`ConversationCallbackCardProjection` consumes `PatientCallbackStatusProjection`. The timeline may align, order, and display the callback card, but it does not produce a second callback state machine.

Reason code:

- `PORTAL_214_CALLBACK_STATUS_COMPATIBILITY`

## Receipt Controls

`PatientReceiptEnvelope` separates:

- local acknowledgement
- provider transport acceptance
- delivery evidence
- authoritative outcome

`ConversationCommandSettlement.calmSettledLanguageAllowed` is true only when authoritative outcome is `settled` and delivery evidence is not disputed. Accepted transport or a local UI acknowledgement therefore cannot display calm final language.

Reason code:

- `PORTAL_214_LOCAL_SUCCESS_NOT_FINAL`

## Tuple Drift

Tuple drift blocks mutation affordances. The composer lease moves to `blocked` or `resume_required`, while the same shell keeps a visible placeholder and a refresh/recovery next step.

Reason code:

- `PORTAL_214_TUPLE_ALIGNMENT_DRIFT`

## Accessibility And Assurance

The atlas uses landmarks, headings, keyboard tabs, details disclosures, timestamp text, ARIA snapshots, and reduced-motion CSS. The assurance posture aligns to NHS service manual accessibility guidance, GOV.UK check-answer review patterns, Playwright ARIA snapshot testing, and WCAG 2.2 quick reference success criteria.
