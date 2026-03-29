# Patient account and communications blueprint

## Purpose

Define one unified patient account model across triage, callback, booking, records, hub, and pharmacy flows.

All patient projections in this document must be materialized under the canonical `VisibilityProjectionPolicy` from `phase-0-the-foundation-protocol.md`. `patient_public` and `patient_authenticated` are different audience tiers, and any claim, booking, pharmacy outcome, closure, or patient-binding correction that requires `command_following` consistency must use the causal-read rules from the canonical Phase 0 section.

Adjacent patient states for the same request must render within one `PersistentShell` using a stable `CasePulse` (`AnchorCard` compatibility), `StateBraid` (`LiveTimeline` compatibility), `DecisionDock` (`ActionDock` compatibility), and one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`. Hard page reloads are not a valid way to communicate ordinary state progression.

## Core projections

The patient account should be built from these projections:

- `PatientHomeProjection`
- `PatientPortalNavigationProjection`
- `PatientNextActionProjection`
- `PatientRequestSummaryProjection`
- `PatientTimelineProjection`
- `ConversationThreadProjection`
- `PatientCallbackStatusProjection`
- `PatientManageCapabilitiesProjection`
- `PatientActionRoutingProjection`
- `PatientContactRepairProjection`
- `PatientActionRecoveryProjection`
- `PatientIdentityHoldProjection`
- `PatientConsentCheckpointProjection`
- `PatientRecordOverviewProjection`
- `PatientResultInsightProjection`
- `PatientMedicationProjection`
- `PatientDocumentLibraryProjection`

## Patient home contract

The signed-in home should show:

- one spotlight card for the request, appointment, result, or message that most needs attention now
- a compact list of other active requests and appointments
- one clear next action
- the latest meaningful update with timestamp
- safe self-service actions only
- recent communications or record-update summary for the spotlight item only by default
- contact preference summary behind secondary disclosure such as `Account details`

## Request detail contract

Request detail pages should unify:

- request summary
- current status
- next expected step
- last meaningful update
- allowed patient actions
- timeline under secondary disclosure or a clearly labeled history section
- linked downstream objects under a related-details disclosure
- patient-visible communications sent

Request detail, downstream continuity, and reply actions should be adjacent child views inside the same request shell, not silo pages that reset context.

## Health record contract

Patient record surfaces should turn dense medical information into an explanation-first workspace.

The records area should include:

- record overview with latest updates, medicines, allergies, conditions, and documents
- result detail with patient-safe summary, value, range, comparison, and source metadata
- action-needed follow-up cards linking to message, appointment, or instructions where policy allows
- document and letter summaries with a clear route to the full structured view or file download

Rules:

- plain-language summary first, technical detail second
- no result status may rely on color alone; use text labels and iconography as well
- trend views must expose an accessible table or equivalent textual summary
- in `clarityMode = essential`, expand one result card or one document summary at a time
- delayed-release, step-up-required, or otherwise gated record items must show a governed placeholder with next-step explanation rather than silent omission
- documents and letters should prefer structured in-browser summaries with file download as a secondary action

## Communications timeline contract

Patient communications should be threaded and source-aware.

- appointment confirmations and reminders
- callback expectation messages
- clinician message thread events
- pharmacy instruction and outcome messages
- hub alternative and callback notifications

Default to the latest relevant entries with a clear way to open full history. Each entry should include channel, send state, and visible template name where allowed.

## Callback and message visibility

Patient pages should include:

- callback expectation state
- callback outcome state
- clinician message thread with reply controls where enabled
- clear wording for what happens next

## Manage capabilities contract

Manage actions should be explicit and policy-driven.

- cancel
- reschedule
- update details
- request callback
- respond to more-info
- message reply where enabled
- accept or decline waitlist or network alternatives where active
- review or renew pharmacy referral consent where dispatch is blocked on consent
- repair contact route when an active dependency has failed

Capability exposure must be derived from policy and provider route, not hard-coded by page.

## Typed patient action routing contract

<!-- Architectural correction: patient actions are typed commands bound to live governing objects. This closes the baseline gap where booking, callback, messaging, and pharmacy actions could otherwise be over-routed back into generic triage. -->

Every action emitted by `PatientManageCapabilitiesProjection` must carry:

- `actionScope`
- `governingObjectRef`
- `owningRouteFamily`
- `requiresStepUp`
- `preemptionPolicy`
- `expiryAt` where relevant

Routing matrix:

- `respond_more_info` -> request detail child surface -> active `MoreInfoCycle`
- `message_reply` -> message thread child surface -> `ClinicianMessageThread`
- `callback_response` -> callback status child surface -> `CallbackCase`
- `waitlist_offer` -> appointment-manage child surface -> `WaitlistOffer`
- `alternative_offer` -> request detail or appointment child surface -> `AlternativeOfferSession`
- `appointment_manage_entry` -> appointment-manage child surface -> `BookingCase` or `HubCoordinationCase`
- `pharmacy_status_entry` -> pharmacy child surface -> `PharmacyCase`, including consent checkpoint when dispatch is blocked on valid referral consent
- `contact_route_repair` -> contact-repair child surface -> active `ReachabilityDependency`

Rules:

- no CTA may omit `governingObjectRef`
- no fallback mutation route may post directly to the generic triage queue when a governing object exists
- if submitted payload becomes `potentially_clinical` or `contact_safety_relevant`, keep the user in the same request shell, show an explicit review-in-progress state, and let `SafetyOrchestrator` preempt behind that shell
- expired or superseded actions must morph to recovery guidance in place rather than disappearing after tap
- if booking, hub, or pharmacy work is disputed, reconciliation-bound, or identity-held, morph the same shell into a calm recovery or pending state instead of emitting false final assurance

## Recovery and identity-hold contract

<!-- Architectural correction: expired links, wrong-patient holds, consent expiry, and disputed downstream states must recover inside the same request shell. They must not dump the patient to generic errors, blank pages, or false-success confirmations. -->

`PatientActionRecoveryProjection` and `PatientIdentityHoldProjection` should render through the same `PersistentShell` as the originating request, callback, booking, hub, or pharmacy flow.

Recovery surfaces should show:

- why the original action is blocked: expired, superseded, already used, wrong patient, lineage-level identity hold, consent expired, or external confirmation disputed
- the safest next step: re-authenticate, step up, renew consent, restore contact route, or resume the current child flow
- zero PHI beyond the current audience tier
- timeline evidence that the case is under review, paused, or awaiting confirmation where applicable

Rules:

- no expired or superseded action may hard-fail to 404 or to a generic home redirect when lineage can still be recovered
- lineage-level identity-hold metadata suppresses PHI-bearing detail and dominant transactional CTAs until `IdentityRepairCase` resolves
- pharmacy consent expiry must render a consent-renewal checkpoint in place rather than silently cancelling the referral
- disputed booking or hub confirmation must stay in a provisional or recovery state until authoritative resolution lands
- recovery completion must re-enter the typed routing table and the causal-read rules before any final reassurance text is shown

## Route families

Patient route families should include:

- intake and submit
- signed-in home
- requests list
- request detail
- respond to more-info
- waitlist offer and alternative-offer review
- appointments list and appointment manage
- health record overview
- result detail
- medications and allergies
- documents and letters
- pharmacy choice, consent, and status
- callback status and callback response
- message center, thread, and reply
- contact-route repair
- action recovery and identity-hold recovery
- contact settings
- secure-link landing and recovery

## Quality rules

- no contradictory statuses across pages
- no PHI on unauthenticated fallback pages
- no PHI-bearing request detail while lineage-level identity-hold metadata is active
- no hidden state transitions without timeline evidence
- no more than one dominant primary CTA in the patient spotlight or request header
- no typed patient action may mutate one domain and silently reopen another without timeline evidence
- no booking, callback, or pharmacy CTA may land on a generic triage confirmation page when a governing child flow exists
- no expired or superseded action may terminate in a blank or generic error state when recovery is possible
- no false final assurance while confirmation, reconciliation, consent, or identity repair is still open
- no action CTA shown unless policy allows that action now
- no patient-facing result view may lead with raw codes, acronyms, or chart-only meaning before a plain-language explanation
- no result, medication, or document state may rely on color alone for urgency or abnormality
- no patient-visible document may be file-download-only when a safe structured summary can be rendered in the shell
