# Patient portal experience architecture blueprint

## Purpose

Define the patient portal as a calm, task-first, accessibility-maximal experience for three high-value jobs:

- booking and managing appointments
- viewing and understanding personal health records
- communicating directly with the care team

This document specializes `platform-frontend-blueprint.md`, `patient-account-and-communications-blueprint.md`, `callback-and-clinician-messaging-loop.md`, and `phase-4-the-booking-engine.md` so the patient portal behaves like one coherent service rather than a collection of adjacent workflows.

It complements rather than replaces the typed request-lineage and child-route contracts already defined elsewhere. The portal remains one signed-in patient shell with stable navigation, while request, booking, message, callback, and record entities keep their existing canonical ownership.

## Executive evaluation

### Strengths to preserve

- durable request lineage and shell continuity
- strong typed child-route ownership for booking, callback, and messaging
- explicit trust, freshness, and audit semantics
- a calm-by-default front-end philosophy through `PersistentShell`, `CasePulse`, `DecisionDock`, and `AttentionBudget`

### Gaps to close

1. The current information architecture is lineage-strong but portal-light, so navigation still needs a patient-facing task model.
2. Secure health record access is mentioned as a capability, but record visualization is not yet a first-class patient surface.
3. Booking flows are operationally mature, but appointment tasks still need a more explicit portal entry contract.
4. Messaging lifecycles are modeled, but the portal still needs an inbox-level conversation contract that shows `reply needed`, `awaiting review`, and `closed` states clearly.
5. Accessibility is cross-cutting, but the patient portal still needs component-level rules for navigation, charts, tables, documents, focus order, timeout recovery, and plain-language translation of clinical data.

## Overarching conceptual design strategy

### Design promise

The portal should make patients feel four things in order:

1. I know where I am.
2. I understand what needs my attention.
3. I can do the next safe thing.
4. I can open more detail only if I need it.

The governing design law is:

**reassure first, orient second, act third, explain always**

### Primary navigation model

Use one stable primary navigation with no more than five task-first sections:

- `Home`
- `Requests`
- `Appointments`
- `Health record`
- `Messages`

Keep `Help and account`, `Accessibility settings`, and `Language or communication preferences` in utility navigation.

Rules:

- navigation stays stable across desktop, mobile web, and NHS App embedded webview
- each destination opens with one dominant action and one short orientation summary
- badges may show unread or action-needed counts, but never as the only urgency cue
- the portal always exposes a route back to the active request, appointment, record item, or message thread
- global search is optional; task-first navigation is mandatory

### Home surface contract

`Home` should behave like a calm personal triage board, not a generic dashboard.

Render only:

- one `TaskSpotlightCard` for the single most important next action
- a compact `UpcomingAppointmentsCard`
- a compact `LatestRecordUpdatesCard`
- a compact `UnreadMessagesCard`
- one persistent `Need help right now?` safety route for urgent or inappropriate-to-message concerns

Do not start with dense metrics, multiple banners, or full historical feeds.

### Accessibility and empathy contract

The portal must treat accessibility and empathy as structural rules.

1. Build to WCAG 2.2 AA as the minimum release bar for all patient surfaces.[1][2]
2. Follow NHS accessibility and content guidance so page titles, headings, links, forms, and health language remain understandable for people with different cognitive, visual, motor, and technical needs.[2][3]
3. Default every patient view to `clarityMode = essential` with one dominant action and one expanded support region at most.
4. Use plain language before medical language. When technical terms are needed, pair them with a short explanation on first use.
5. Never rely on color alone to communicate abnormality, urgency, success, or selection.
6. Charts and visual trends must always have an equivalent data table, summary sentence, and screen-reader-compatible narrative.
7. Any timeout, lock, expired link, or step-up authentication boundary must preserve the current context and explain what happens next.
8. If the source content is a PDF or uploaded document, provide an accessible HTML summary first whenever the content is patient-visible; downloadable files are secondary, not primary.[4]
9. In the NHS App webview, keep the same task model and accessibility quality while respecting embedded navigation and header rules.[5]

## Frontend architectural blueprint

### 1. Shell and route map

Use `Patient Web Shell` as the single portal shell, with these canonical route families:

- `/home`
- `/requests`
- `/requests/:requestId`
- `/requests/:requestId/messages`
- `/appointments`
- `/bookings/:bookingCaseId`
- `/bookings/:bookingCaseId/select`
- `/bookings/:bookingCaseId/confirm`
- `/appointments/:appointmentId`
- `/appointments/:appointmentId/manage`
- `/records`
- `/records/results`
- `/records/results/:resultId`
- `/records/medications`
- `/records/documents`
- `/records/documents/:documentId`
- `/messages`
- `/messages/:threadId`

Deep-link aliases may exist, but they must resolve into the owning shell and preserve the same `entityContinuityKey` when the active entity is unchanged.

### 2. Required patient projections

Add these read models so portal navigation and summary surfaces do not over-fetch unrelated detail:

- `PatientPortalHomeProjection`
- `PatientPortalNavigationProjection`
- `PatientTaskSpotlightProjection`
- `PatientAppointmentWorkspaceProjection`
- `PatientAppointmentManageProjection`
- `PatientRecordOverviewProjection`
- `PatientResultInsightProjection`
- `PatientMedicationProjection`
- `PatientDocumentLibraryProjection`
- `PatientMessageCenterProjection`
- `PatientThreadSummaryProjection`
- `PatientAccessibilityPreferenceProjection`

Every projection must carry `lastMeaningfulUpdateAt`, `freshnessState`, and `actionRequiredState`.

### 3. Appointment scheduling workspace

The booking experience should feel like a guided decision, not a scheduling system.

Entry from `Home`, `Requests`, or `Appointments` must converge into one `PatientAppointmentWorkspaceProjection` with appointment purpose, timeframe, modality, accessibility needs, travel preferences, continuity preference, and fallback routes.

The default slot surface is a ranked list grouped by day. Each card should show only day and date, time, location or remote label, clinician type or name where appropriate, accessibility or travel hints, and one short reason cue such as `soonest` or `best match`.

In `clarityMode = essential`:

- only one slot card may expand at a time
- only one compare surface may be open at a time
- filters belong in a `Refine options` drawer
- the selected slot stays pinned during confirm and recovery states

The confirmation surface must always answer what was chosen, what happens after confirmation, how the patient will be contacted, and what to do if the slot no longer works.

`Manage appointment` should foreground appointment summary, attendance instructions, reminder settings, cancel, reschedule, update details, and a visible assisted path. Destructive actions should use short, consequence-aware confirmation copy and preserve a visible route back to the booked state.

### 4. Secure health record visualization

The records area should translate medical data into safe understanding without flattening clinical truth.

`/records` opens with a summary-first overview grouped into latest updates, test results, medicines and allergies, conditions and care plans, letters and documents, and action-needed follow-up.

Every result detail view must present information in this order:

1. what this test is
2. what the latest result says
3. what changed since last time
4. what the patient may need to do next
5. when to get urgent help
6. technical details

`PatientResultInsightProjection` must include a patient-safe title, plain-language summary, measured value, unit, reference range, specimen date, comparison against prior result when available, abnormal or borderline explanation in words, source metadata, and related actions such as message, follow-up, or book.

Charts are optional. The equivalent table and screen-reader summary are required. Users must be able to switch to a table-first view without losing context.

Sensitive or delayed-release results must still show that the record exists, why detail is not yet visible, when or how access becomes available, and the safest next action. Letters and documents should prefer structured in-browser summaries, with file download as a secondary action.

### 5. Direct communication with providers

The message center should feel like one calm correspondence system.

`/messages` groups conversation summaries by care episode or provider relationship and surfaces unread, `reply needed`, `awaiting review`, and `closed` states before the full thread is opened.

Inside a thread:

- show one pinned `next action` area
- keep only the active composer or the most recent history cluster expanded in essential mode
- preserve callback expectations, clinician replies, and instruction acknowledgements in the same conversation grammar
- show delivery and reply receipts in-thread instead of toast-only confirmation
- keep urgent diversion guidance visible whenever asynchronous messaging is not appropriate for the concern being described

### 6. Security, privacy, and trust presentation

- show source system and last update time on records and appointments
- explain step-up requests before triggering them
- preserve non-sensitive shell context during re-authentication
- suppress PHI in notification previews, recovery routes, and expired-link surfaces
- keep audit-heavy details behind secondary disclosure unless they change the next action
- never mix patients, households, or proxies in one visible shell without an explicit subject switch and renewed context statement

### 7. Validation and release gate

The redesign is not ready until all of the following are true:

- keyboard-only users can complete booking, review a result, and reply to a message
- screen-reader users receive equivalent orientation, change, and action cues across all three journeys
- 200% zoom, narrow mobile width, and reduced-motion modes preserve full task completion
- abnormal, delayed, or gated results remain understandable without color, hover, or chart literacy
- no patient journey requires raw medical codes to understand the next action
- booking, records, and messages preserve shell continuity through sign-in recovery, stale-link recovery, and asynchronous updates
- NHS App embedded mode preserves the same portal IA and task outcomes as the normal browser experience

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `patient-account-and-communications-blueprint.md`
- `callback-and-clinician-messaging-loop.md`
- `phase-4-the-booking-engine.md`
- `ux-quiet-clarity-redesign.md`

## References

[1]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
[2]: https://service-manual.nhs.uk/accessibility "NHS digital service manual accessibility guidance"
[3]: https://service-manual.nhs.uk/accessibility/content "NHS digital service manual content accessibility guidance"
[4]: https://service-manual.nhs.uk/content/pdfs-and-other-non-html-documents "NHS guidance on PDFs and other non-HTML documents"
[5]: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/ "NHS App web integration guidance"
