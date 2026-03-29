# Phase 2 - Identity and Echoes

**Working scope**  
Real patient identity, session control, and telephony parity.

## Phase 2 implementation rules

**Rule 1: never collapse identity into a boolean.**  
Persist the raw NHS login assurance signal and a normalized internal capability band. NHS guidance expects assurance and verification to be chosen based on product features, and it distinguishes medium verification from high verification rather than treating all signed-in users as equivalent. ([NHS England Digital][4])

**Rule 2: contact provenance matters.**  
Keep three separate sources of patient-contact truth: NHS login contact claims, patient-chosen communication preferences, and PDS or GP demographic details. NHS guidance is explicit that NHS login contact details are not linked to PDS or GP-system contact data, and the same phone number can be used on more than one NHS login. ([NHS England Digital][4])

**Rule 3: telephony parity does not mean telephony sameness.**  
Phone capture can have lower or different identity confidence than web sign-in, but it still has to produce the same canonical request object and go through the same safeguard gate and queue model. That is exactly what the intake flow requires.

**Rule 4: Phase 1 must survive this phase.**  
Do not rip out the anonymous Phase 1 intake on day one. Introduce identity as an upgrade path first, then move toward signed-in-first once the flows and telemetry are stable.

**Rule 5: keep IM1 out of the critical path for this phase.**  
Unless there is already a live IM1 patient-facing connection, do not make the identity flow depend on IM1 linkage-key retrieval. NHS guidance explicitly constrains that path. ([NHS England Digital][4])

---

## 2A. Trust contract and capability gates

This sub-phase defines the new control model for the whole product.

**Backend work**

Add a new identity kernel to the domain model. Do not bolt identity onto request metadata ad hoc.

Create these domain objects:

**IdentityContext**  
`identitySource`, `authProvider`, `authLevelRaw`, `verificationLevelRaw`, `capabilityBand`, `nhsLoginSubject`, `nhsNumber`, `gpOdsCode`, `contactClaims`, `matchingStatus`, `patientRef`, `matchConfidence`, `lastVerifiedAt`

**PatientLink**  
Maps an external identity or telephony verification outcome to an internal patient record, with provenance and confidence.

**Session**  
`sessionId`, `subjectRef`, `issuedAt`, `lastSeenAt`, `idleExpiresAt`, `absoluteExpiresAt`, `sessionState`, `assuranceBand`, `csrfSecret`, `deviceContext`

**CallSession**  
`callSessionId`, `vendorCallId`, `menuSelection`, `verificationState`, `capturedIdentifiers`, `recordingRefs`, `continuationTokenRef`, `requestSeedRef`, `callState`

**ContinuationGrant**  
Represents the signed SMS handoff between a phone call and a mobile web continuation flow.

Define a capability matrix now:

- start or continue anonymous draft
- start signed-in draft
- claim a public draft into an authenticated account
- view authenticated request status
- add attachments after sign-in
- create phone-seeded draft via SMS continuation
- future booking or records access in later phases

Capability should be derived from **identity source + verification + patient match confidence + route sensitivity**.

This is also where any tenant-specific age rule should be decided. NHS guidance says the service must implement age restrictions where the risk assessment requires them; it is not enough to assume the identity provider will solve that for you. ([NHS England Digital][4])

Lock the first event set for this phase:

- `auth.login.started`
- `auth.callback.received`
- `auth.session.created`
- `auth.session.ended`
- `identity.patient.match_attempted`
- `identity.patient.matched`
- `identity.patient.ambiguous`
- `identity.capability.changed`
- `telephony.call.started`
- `telephony.menu.selected`
- `telephony.identity.captured`
- `telephony.recording.ready`
- `telephony.evidence.pending`
- `telephony.evidence.ready`
- `telephony.sms_link.sent`
- `telephony.request.seeded`

Add new services or modules:

- `packages/identity-contracts`
- `packages/patient-matching`
- `services/auth-bridge`
- `services/patient-linker`
- `services/telephony-edge`
- `services/continuation-worker`

**Frontend work**

Add the identity-aware shells now, even before the full login flow is live.

Patient web should gain these states:

- signed out
- signing in
- signed in, not linked
- signed in, linked
- partial identity or low assurance
- session expired
- consent declined
- support required

These are not edge-case afterthoughts. They are first-class screens.

Build the visual language for identity around calm reassurance, not security theatre. The page should feel premium and minimal: generous spacing, clear hierarchy, no overloaded auth copy, and no system-ish wording.

**Tests that must pass before moving on**

- capability matrix tests for every state combination
- forbidden-route tests for every protected page
- serialization tests for identity and session objects
- event-schema tests for new identity and telephony events
- migration tests proving old Phase 1 requests remain readable without identity data

**Exit state**  
The platform now understands who the user might be, how confident it is, and what they are allowed to do, without changing the core request model.

---

## 2B. NHS login bridge and local session engine

This is the real sign-in implementation.

**Backend work**

Build `auth-bridge` as a dedicated service or isolated module inside the gateway. Do not spread OIDC logic across route handlers.

Use a standard server-side OIDC authorization-code flow with strict transaction tracking. NHS login is an OIDC integration for patient and public services, and NHS England provides both the integration toolkit and mock authorisation and testing guidance. ([NHS England Digital][1])

The runtime algorithm should be:

1. user clicks the NHS login button
2. backend creates `AuthTransaction` with `state`, `nonce`, code-verifier, requested scopes, return path, and capability intent
3. browser is redirected to NHS login
4. callback receives `code` or error result
5. backend validates `state`, exchanges code, validates ID token and claims
6. backend stores immutable claim snapshot
7. backend runs patient-link attempt
8. backend creates local application session
9. backend redirects the user to the correct next state: home, draft resume, status page, or continuation flow

Handle these callback outcomes explicitly:

- success
- consent declined
- insufficient assurance for requested route
- expired auth transaction
- replayed callback
- token-validation failure
- linkage unavailable
- internal fallback

NHS guidance says the user must agree to share the requested information the first time they use the product with NHS login, and if they do not, that response must be handled. It also says you should not ask for more information than you need. That makes scope selection and consent-denied UX product decisions, not just security configuration. ([NHS England Digital][5])

For sessions, keep the session local to Vecells. NHS guidance is explicit that session management and logout are partner responsibilities. Use secure HTTP-only cookies, server-side session storage, explicit idle timeout, absolute timeout, CSRF protection, and route-level re-auth requirements for sensitive actions. ([NHS England Digital][5])

Build a `SessionProjection` so the patient UI can quickly render:

- signed-in state
- session warning countdown
- linked patient state
- available capabilities
- session reason for downgrade or expiry

**Frontend work**

The sign-in entry must look refined and trustworthy.

Build:

- NHS login button on landing and resume pages
- callback holding screen
- we-are-confirming-your-details interstitial
- consent-declined recovery page
- session-expired recovery page
- account badge or identity chip in the header
- clean sign-out entry

NHS guidance says the NHS login button must be visible and up front and is not customisable. Do not redesign it. Design around it. Make the surrounding page premium, but keep the button standard. ([NHS England Digital][4])

Signed-in UX should feel simpler than signed-out UX. Once authenticated, remove unnecessary explanation and let the user get straight to start request, continue request, or track requests.

**Tests that must pass before moving on**

- state and nonce validation tests
- callback replay protection
- token signature and issuer validation
- clock-skew tolerance tests
- consent-declined flow tests
- session fixation and CSRF tests
- logout and timeout tests
- automated auth tests against the official NHS login mock auth approach or equivalent integration harness ([NHS England Digital][6])

**Exit state**  
Patients can now sign in with NHS login and establish a real Vecells session without breaking the Phase 1 platform.

---

## 2C. Patient linkage, demographic confidence, and optional PDS enrichment

This is where authentication becomes patient identity, which is not the same thing.

**Backend work**

Do not assume a valid NHS login callback automatically means you have a safely linked patient record. Build a dedicated patient-linking algorithm.

Use `IdentityBinding`, not direct `Request.patientRef` mutation, as the cross-phase identity authority.

This section specializes the canonical identity and ownership algorithm in `phase-0-the-foundation-protocol.md` under `## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm`. `IdentityBinding` owns patient-binding decisions, `AccessGrantService` owns patient-access grants, and any conflicting local shortcut is invalid.

Recommended linking sequence:

1. accept the NHS login claim envelope and create or refresh `IdentityBinding`
2. build the local candidate search using NHS number if present, otherwise a governed demographic set
3. map `Request.identityState` from `IdentityBinding`:
   - `anonymous` when no verified subject or patient binding exists
   - `partial_match` when a subject is verified or a patient candidate exists, but a safe unique bind does not yet exist
   - `matched` when a patient is uniquely verified, but request ownership is not yet established
   - `claimed` when patient binding and request ownership are both established under policy
4. score every candidate patient with a calibrated posterior rather than a raw threshold:
   - build feature vector `phi(p)` from exact NHS-number agreement, date-of-birth agreement, name similarity, postcode similarity, phone or email agreement with provenance penalty, address-token similarity, source-reliability indicators, and missingness flags
   - compute `z(p) = beta_0 + sum_k beta_k * phi_k(p)`
   - compute `P_link(p) = Cal_link_version(z(p))`, where `Cal_link_version` is a versioned probability calibrator fitted on adjudicated match outcomes so the value is interpretable as a probability rather than an arbitrary score
5. let `p_star = argmax_p P_link(p)`, let `p_2` be the runner-up candidate or a null candidate with `P_link(p_2) = 0`, and define the separation in log-odds space as `gap_logit = log((P_link(p_star) + eps) / (1 - P_link(p_star) + eps)) - log((P_link(p_2) + eps) / (1 - P_link(p_2) + eps))`, with `eps = 1e-6` for numerical stability
6. auto-link only when all of the following are true:
   - `P_link(p_star) >= tau_high(routeSensitivity)`
   - `P_link(p_2) <= tau_runner_up(routeSensitivity)` and `gap_logit >= delta_logit(routeSensitivity)` so the winning candidate is not only high-probability but materially separated from the runner-up
   - subject-to-patient proof `P_subject >= tau_subject(routeSensitivity)`
   - the action is permitted by policy for automatic linking
7. a single demographic candidate without step-up remains `partial_match`, not `matched`, unless the calibrated absolute and separation tests above pass
8. if binding remains ambiguous, require manual confirmation or restricted capability rather than treating a small raw probability gap as evidence of uniqueness
9. if no candidate exists, keep a provisional `IdentityBinding` and allow only safe next actions
10. `Request.patientRef` becomes write-once after first verified bind; any later correction requires an explicit governed repair action, supervisor approval, immediate grant revocation, and full audit
11. persist both the raw match evidence and the calibrated decision record, including feature values, calibrator version, absolute-threshold version, runner-up threshold version, `gap_logit`, challenge, and human-review state

If a tenant does not yet have a validated calibration set for automatic linking, keep thresholds conservative and disable auto-link rather than treating an uncalibrated score as a probability.

NHS guidance is clear on two design points here. First, NHS login does not replace PDS. Second, PDS access requires a legal basis and appropriate onboarding, and the PDS FHIR API is the newest and simplest integration route. The clean engineering move is to build the matching provider seam now, ship with local matching first, and enable PDS lookup behind a separate flag only when onboarding and legal basis are complete. ([NHS England Digital][4])

Also keep `contactClaims`, `pdsDemographics`, and `patientPreferredComms` separate. Never overwrite communication preferences just because a login claim contains an email address or phone number. NHS guidance explicitly warns those contact details are distinct domains. ([NHS England Digital][4])

If there is any temptation to use NHS login for IM1 linkage-key retrieval at this stage, keep that feature disabled unless the IM1 PFS connection is already live. NHS guidance says GP surgery information scope for linkage-key benefits requires a live IM1 PFS connection and is not approved as a one-time key retrieval shortcut. ([NHS England Digital][4])

**Frontend work**

Build the account-linking states as polished, not apologetic.

The patient may need to see:

- you are signed in and ready
- we found your details
- we need one more confirmation
- we could not confidently match your record
- you can still continue in limited mode or please contact the practice

If a one-step confirmation screen is needed, keep it elegant and low friction. Never show raw matching jargon.

If sign-in occurs in the middle of a Phase 1 draft, the user should feel that the draft simply became safer and more personalized, not that they have entered a second system.

**Tests that must pass before moving on**

- exact-match auto-link tests
- ambiguous-match tests
- no-match provisional-mode tests
- PDS-disabled fallback tests
- PDS-enabled enrichment tests
- wrong-patient-link prevention tests
- proof that contact-preference data is not overwritten by auth claims

**Exit state**  
The platform can now distinguish authenticated user from safely linked patient, and it can do that in a controlled, auditable way.

---

## 2D. Signed-in portal uplift and authenticated request ownership

Now the patient portal should become meaningfully better when the user is signed in.

**Backend work**

Add authenticated request ownership without creating a second request store.

Implement:

- `GET /v1/me`
- `GET /v1/me/requests`
- `POST /v1/drafts/{publicId}/claim`
- `POST /v1/session/logout`
- authenticated status endpoints
- ownership enforcement on request details, attachments, and status
- public-access grant rotation and revocation on claim

The key algorithm here is **draft claiming and draft upgrading through `AccessGrant` and `IdentityBinding`**:

All claim, rotation, redemption, revocation, and replacement-grant behavior in this phase must run through `AccessGrantService` from the canonical Phase 0 section. Controllers and page flows may not mint, widen, or preserve grants independently.

1. anonymous Phase 1 draft or request exists with a scoped `AccessGrant`
2. supported grant types are:
   - `public_draft_resume`
   - `public_receipt_status`
   - `claim_upgrade`
   - `continuation_seeded_verified`
   - `continuation_unseeded_identity_challenge`
   - `support_reissue_minimal`
3. every grant is short-lived, and every PHI-bearing grant is one-time and subject-bound unless policy explicitly states otherwise
4. `public_receipt_status` may expose only minimal receipt state and no narrative, attachments, or clinical detail
5. `continuation_unseeded_identity_challenge` may expose no pre-existing patient data before challenge success
6. `support_reissue_minimal` may never widen scope beyond the immediately prior authorized scope
7. on claim, redeem `claim_upgrade` or the authenticated claim request and verify the grant is live, not replayed, and bound to the same request lineage
8. evaluate `IdentityBinding`; if no high-assurance patient bind exists, perform step-up challenge before any claim
9. if claim succeeds, attach authenticated ownership to the same `Request`, rebuild projections under the new scope, and continue the same journey without forcing a restart
10. revoke all superseded public or continuation grants before issuing any replacement grant
11. if the request is already claimed by a different subject, deny normal claim and route to governed support workflow

Build request-ownership rules carefully:

- authentication and grant redemption must not directly overwrite `Request.patientRef`
- old public links can remain only for requests that were never claimed
- once a draft or request is claimed, any old public draft link must be revoked immediately
- once a request is claimed, any remaining public status link must either be revoked or reduced to a minimal receipt-only scope by policy
- sensitive states may never be exposed through superseded or replayed public tokens

NHS guidance says you should request only the data you need and choose assurance based on the transaction. Use that principle to decide what the signed-in home, request list, and status views should show. ([NHS England Digital][4])

**Frontend work**

This is the moment where the portal starts to feel like a real account-based product.

Within the same request lineage, sign-in, claim, and ownership uplift should preserve the current `PersistentShell` and `AnchorCard` wherever possible. Newly authorized detail should reveal progressively after verification succeeds rather than through a disruptive redirect, and request-centered communications should converge into the canonical `ConversationThreadProjection`.

Add:

- signed-in home
- start a request
- continue a draft
- track your requests
- contact preference editor
- account summary or linked-patient summary
- session-expiry warning banner or modal
- clean sign-out flow

Also lock the cross-phase patient account contract now using `patient-account-and-communications-blueprint.md`. The signed-in home should be backed by explicit projections for next action, active requests, communication thread summary, callback status, and manage-capability visibility across booking, hub, and pharmacy paths.

Design-wise, this should be very polished. The signed-in home should feel quieter than the landing page, because trust has already been established. Use strong hierarchy, generous spacing, and only a few clear top-level actions.

Also keep the page chrome flexible for later NHS App embedding. NHS App web integration is still a responsive web integration and may require header or footer changes, so the current portal chrome should not be hard-wired into every template. ([NHS England Digital][3])

**Tests that must pass before moving on**

- anonymous-draft claim tests
- wrong-user access-denied tests
- old-public-link transition tests
- stale-public-token revocation tests after claim
- session-expiry warning tests
- keyboard-only and screen-reader tests on signed-in pages
- deep-link recovery tests after callback and refresh

**Exit state**  
The existing Phase 1 portal has now become an authenticated portal without losing the original request model or leaving stale public links behind.

## 2E. Telephony edge, IVR choreography, and call-session persistence

This is the telephony half of the phase.

**Backend work**

The required phone behaviour is explicit: patient calls the practice or Vecells number, chooses Symptoms, Meds, Admin, or Results in IVR, identifies themselves using NHS number and DOB or caller ID plus confirmation, records up to 60 seconds of issue detail, can receive an optional SMS link to add more information, and still ends up in the same single request pipeline as web.

Build telephony as an adapter-driven subsystem, not as special-case controller code.

Create:

- `services/telephony-edge`
- `services/telephony-webhook-worker`
- `services/recording-fetch-worker`
- `services/continuation-dispatcher`

Define a `CallSession` state machine:

`initiated -> menu_selected -> identity_in_progress -> identity_resolved | identity_partial -> recording_captured -> evidence_preparing -> evidence_pending -> evidence_ready -> continuation_sent | request_seeded -> submitted -> closed`

with side branches:

- `identity_failed`
- `abandoned`
- `provider_error`
- `manual_followup_required`
- `manual_audio_review_required`

`evidence_pending` is the durable holding state for phone captures that have a recording or partial keypad evidence, but are not yet safety-usable. It may exit only to `evidence_ready`, `manual_audio_review_required`, `manual_followup_required`, `provider_error`, or `abandoned`.

A telephony request must not be seeded or submitted into the normal intake path from `recording_captured`, `evidence_preparing`, or `evidence_pending`. It may only proceed once the evidence is genuinely safety-usable.

All provider callbacks should land on internal webhook endpoints and immediately become canonical telephony events. Vendor payloads should not leak deeper into the system.

Persist these artefacts:

- call metadata
- menu path
- caller-number snapshot
- verification attempts
- audio object reference
- transcript job reference
- audio-safety-facts reference
- SMS link reference
- linked request or draft reference

Because the architecture already places audio and documents into object storage with `DocumentReference` pointers, the call recording subsystem should reuse that same model.

A telephony request must not move from `recording_captured` to normal submission until its evidence is safety-usable. That means the call session needs either transcript-derived facts, structured keypad answers that satisfy the rules, or explicit manual audio review before it reaches `evidence_ready`.

**Frontend work**

There are two front-end surfaces in this sub-phase.

First is the patient-facing mobile continuation page, which starts from an SMS link and should feel extremely lightweight: direct, mobile-first, no clutter, and one obvious action.

Second is the internal support or ops surface, where staff can inspect:

- current call session state
- verification outcome
- recording or transcript status
- audio evidence-readiness status
- linked request status
- continuation redemption status

This internal screen does not need to be beautiful yet, but it must be comprehensible at a glance.

**Tests that must pass before moving on**

- webhook contract tests for each vendor event type
- duplicate webhook idempotency tests
- out-of-order event tests
- dropped-call tests
- recording retrieval integrity tests
- call-session rebuild tests from raw events
- no-orphan-recording tests
- no-submit-before-evidence-ready tests

**Exit state**  
The platform can now accept phone interactions as real input, not as offline admin work, and it has an explicit evidence-readiness step before telephony enters the shared safety pipeline.

## 2F. Caller verification, voice capture, transcript stub, and SMS continuation

This is where telephony becomes usable rather than just connected.

**Backend work**

Design caller verification as a **confidence-scored process** with separate identity and handset-route probabilities, not a binary verified or unverified switch.

For telephony candidate `p`, compute:

- `z_id(p) = gamma_0 + sum_k gamma_k * psi_k(p)`
- `P_id(p) = Cal_id_version(z_id(p))`
- `p_star = argmax_p P_id(p)`, with `p_2` the runner-up candidate or a null candidate with `P_id(p_2) = 0`
- `gap_id = log((P_id(p_star) + eps) / (1 - P_id(p_star) + eps)) - log((P_id(p_2) + eps) / (1 - P_id(p_2) + eps))`, with `eps = 1e-6`

where `psi_k` includes date-of-birth agreement, surname similarity, postcode fragment match, verified callback success, IVR-consistency checks, and caller-ID hint. Caller ID may contribute only as a weak bounded feature and must never be sufficient on its own.

Compute destination safety separately:

- `z_dest = eta_0 + eta_1 * verified_number_on_patient + eta_2 * handset_step_up_success + eta_3 * fresh_channel_control_proof`
- `P_dest = Cal_dest_version(z_dest)`
- `P_seed = P_id(p_star) * P_dest`

Treat `P_seed` as the conservative seeded-continuation score: seeded delivery requires both the identity hypothesis and the handset-control hypothesis to hold, so `min(P_id, P_dest)` can overstate safety.

A practical algorithm is:

1. capture IVR selection
2. capture identifying fields in a controlled order
3. resolve local candidate set
4. compute `P_id` for the best candidate, `gap_id` against the runner-up, and `P_dest` for the target handset
5. if `P_id(p_star) >= tau_id(routeSensitivity)`, `gap_id >= delta_id(routeSensitivity)`, `P_dest >= tau_dest(routeSensitivity)`, and `P_seed >= tau_seeded(routeSensitivity)`, mark `telephony_verified_seeded`
6. if `P_id(p_star) >= tau_challenge(routeSensitivity)` and `gap_id >= delta_challenge(routeSensitivity)` but `P_dest < tau_dest(routeSensitivity)`, allow only unseeded continuation with fresh identity challenge
7. if identity ambiguity or destination safety remains poor, create a manual follow-up path rather than blocking entirely

If the route lacks a validated calibration set for seeded continuation, default to manual or unseeded continuation rather than optimistic seeding.

Do not rely on caller ID alone. It can help with candidate narrowing, but it should not be treated as proof of patient identity or proof that an SMS destination is safe for seeded data.

This is also where the NHS login contact-data warning becomes relevant. Because NHS login contact details and GP or PDS contact data are not equivalent, and phone numbers can be reused across multiple accounts, continuation-SMS logic must be explicit about which number it is using and why. ([NHS England Digital][4])

Build voice capture like this:

1. telephony provider marks recording available
2. recording-fetch worker pulls or receives the asset
3. asset is quarantined, scanned, and moved to governed object storage
4. `DocumentReference` is created
5. asynchronous rapid transcript and keyword-extraction job is enqueued
6. extracted `TelephonySafetyFacts` are attached or the call is marked `manual_audio_review_required`
7. transcript result is attached as a secondary artefact, not as source truth

Do not wait for perfect transcription in this phase. A rapid transcript stub is enough so long as original audio remains the authoritative artefact and the call does not enter the shared submit path until evidence is safety-usable.

For SMS continuation, use `AccessGrant` rather than a telephony-only token model. The continuation flow should use explicit grant types:

All continuation-link issuance, redemption, rotation, and revocation must run through `AccessGrantService` as defined by the canonical Phase 0 section. NHS login uplift, telephony continuation, and support reissue may not each invent their own grant semantics.

- `continuation_seeded_verified`
- `continuation_unseeded_identity_challenge`
- `manual_only`

Recommended SMS continuation algorithm:

1. phone call captures menu, identity fragments, and recording
2. system issues the correct `AccessGrant`
3. only if the grant is `continuation_seeded_verified`, the destination number is verified for that patient, and a high-assurance `IdentityBinding` exists may the SMS link open a seeded flow
4. if the grant is `continuation_unseeded_identity_challenge`, the link opens a minimal flow that shows no existing patient data and re-challenges identity before any detail is displayed
5. if confidence is insufficient for either safe seeded or safe challenge flow, route to `manual_only`
6. on redemption, verify the grant is live, one-time, bound to the same request lineage, and not replayed
7. patient adds detail, files, and confirms preferences
8. revoke superseded continuation grants before issuing any replacement grant
9. continuation flow submits into the same request lineage and the same safety-preemption rules
10. call session closes or transitions to linked status

**Frontend work**

The SMS continuation page should feel like the best part of the entire phone experience.

The continuation flow must stay inside one mobile-first `PersistentShell`. Use `AmbientStateRibbon` for save and sync feedback and `TransitionEnvelope` for submit or verification progress; do not drop the user into a blank receipt or a full-page spinner when the same request entity is already known.

Design it as:

- one-column mobile flow
- minimal chrome
- neutral identity language until seeded access is confirmed
- clear `we have already captured some details` messaging only for verified seeded continuation
- one primary action per screen
- very short copy
- obvious upload option
- visible progress
- visible save state

If the patient later signs in with NHS login from the continuation flow, that sign-in should feel like a smooth upgrade, not a detour.

**Tests that must pass before moving on**

- caller-verification confidence tests
- wrong-patient SMS prevention tests
- seeded-versus-unseeded continuation tests
- continuation-token expiry and replay tests
- transcript job timeout tests
- upload-after-call tests
- partial-identity continuation tests
- end-to-end call to SMS to mobile completion flow tests

**Exit state**  
Phone capture now has a clean path into richer digital detail capture without leaking seeded data to an unsafe destination or skipping evidence preparation.

## 2G. One-pipeline convergence, safety parity, and duplicate control

This is the sub-phase that actually makes telephony parity real.

**Backend work**

At this point, there are two upstream channel shapes:

- web Phase 1 draft and submission
- telephony call session plus optional continuation draft

Now force both into one normalized intake contract before safety.

This shared pipeline is subordinate to the canonical ingest, duplicate, and safety-preemption algorithm in `phase-0-the-foundation-protocol.md`. `SafetyOrchestrator` owns evidence classification and preemption, and any local duplicate shortcut that conflicts with the canonical rules is invalid.

Create a shared `NormalizedSubmission` object containing:

- request type
- narrative
- structured answers
- channel metadata
- identity context
- attachment refs
- audio refs
- contact preferences
- submission source timestamp
- patient-match confidence
- dedupe fingerprint
- evidence-readiness state

Then make both channels use the same submit pipeline:

1. on any evidence-bearing command, resolve the idempotency envelope using source command ID, transport correlation, source lineage, and payload hash
2. if idempotency resolves to a previously accepted command, return the prior result and do not create a new `Request`, `EvidenceSnapshot`, `TriageTask`, or duplicate projection row
3. otherwise persist a new immutable `EvidenceSnapshot` before normalization or state advancement
4. build `NormalizedSubmission` and derive `candidateEpisodeRelations = retry | same_episode_candidate | related_episode | new_episode`
5. if relation = `retry`, acknowledge idempotently and stop
6. if relation = `same_episode_candidate`, auto-attach to an existing request only when all of the following are true:
   - same verified patient or same high-assurance `IdentityBinding`
   - same source lineage or same continuation grant or same call session or same draft lineage
   - no divergent clinician decision, no divergent downstream lease, and no separately acknowledged patient intent exists
   - no conflicting onset, request reason, or episode timing exists
7. any other suspected duplicate becomes a separate `Request` plus a `DuplicateCluster`; it must not be silently merged
8. if evidence is not yet safety-usable, hold in `evidence_pending` or route to manual follow-up; do not enter the normal triage path
9. for a new lineage, promote exactly once from `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote` to `Request.workflowState = submitted`, then advance to `intake_normalized` after canonical normalization succeeds
10. for an existing request lineage, append the snapshot and continue through the safety-preemption and reopen path; do not recreate `submitted` or `intake_normalized`
11. classify inbound evidence as `technical_metadata`, `operationally_material_nonclinical`, or `potentially_clinical`
12. only an explicit allow-list may be treated as `technical_metadata`; contact-route changes, grant-state changes, preference changes, and delivery failures are `operationally_material_nonclinical`; everything else defaults to `potentially_clinical`
13. for any `potentially_clinical` evidence, create `SafetyPreemptionRecord`, recompute the latest composite evidence, and rerun the canonical safety engine before routine flow continues
14. while `SafetyPreemptionRecord.status = pending`, do not close the request, auto-resume routine flow, or present stale reassurance
15. if re-safety yields urgent diversion, create the urgent handling path immediately and end the routine flow
16. if routine handling clears, create or refresh the single operational owner, issue one receipt, update one status projection, and emit the same canonical events as web for equivalent state changes

The phone path must never run a pre-request safety shortcut, and suspected duplicates must be clustered rather than silently merged unless they are proven retries or proven same-episode continuations.

If a patient adds new detail through SMS continuation before triage, or if any merged same-episode evidence adds materially new clinical detail during later workflow, create a new immutable snapshot, create a `SafetyPreemptionRecord`, and rerun the same canonical safety engine before routine flow continues.

**Frontend work**

The patient should never see channel fragmentation.

Status should look the same whether the request started on web or phone. The only visible difference should be helpful context like `you added more detail after your call` if that actually benefits understanding.

Internal ops and staff screens should display channel provenance clearly, but without turning it into a separate workflow.

**Tests that must pass before moving on**

- web-versus-phone normalization parity tests
- same-facts same-safety-outcome tests
- telephony-evidence-readiness gating tests
- duplicate-merge tests
- duplicate-flag tests
- merge-reruns-safety tests for safety-relevant evidence
- one-request one-triage-task tests
- late-detail snapshot rerun tests
- no-double-receipt tests

**Exit state**  
Web and telephony are now different entry methods into the same operational system, and any clinically relevant merged evidence still re-enters the same safety discipline.

## 2H. Hardening, safety evidence, and the formal Phase 2 exit gate

This is where the phase becomes releasable rather than merely functional.

**Backend work**

Instrument the identity and telephony paths thoroughly.

Minimum metrics:

- NHS login start rate
- callback success rate
- consent-declined rate
- insufficient-assurance rate
- session expiry rate
- patient-match confidence distribution
- ambiguous-link rate
- call start rate
- IVR completion rate
- caller-verification failure rate
- recording availability latency
- SMS continuation redemption rate
- channel-parity divergence rate
- duplicate-detection rate
- safety rerun rate after continuation

Add alerting for:

- callback validation failures
- session-store instability
- sharp increase in ambiguous patient matches
- telephony provider webhook failure
- recording ingest lag
- SMS continuation failures
- parity drift between web and phone normalization

Build internal tools for support and safety review:

- auth transaction inspector
- identity match explainer
- call session timeline
- recording and transcript status viewer
- continuation redemption viewer
- linked-request timeline

This phase also needs its safety and assurance evidence updated as part of the engineering work. NHS England says DCB0129 is the manufacturer clinical risk management standard, DCB0160 applies to deployment and use, and organisations with access to NHS patient data and systems must use the DSPT. NHS login onboarding also expects clinical safety evidence as part of its assurance documentation. ([NHS England Digital][7])

The Phase 2 hazard set should explicitly include:

- wrong-patient linkage
- stale or mismatched contact source
- callback replay or session confusion
- duplicate cross-channel request creation
- caller misidentification
- SMS continuation to the wrong recipient
- telephony capture failure after patient expectation has been set
- safety-screen result changing after late detail arrives

**Frontend work**

Before sign-off, the identity and telephony-adjacent UI needs to feel product-grade:

- landing page with proper sign-in affordance
- account states polished
- callback recovery polished
- continuation flow polished
- session expiry and sign-out polished
- accessibility pass on all auth and continuation states

The whole thing should feel deliberate, clean, and premium. In this kind of product, trust is part of the functional outcome.

**Tests that must all pass before Phase 3**

- no Sev-1 or Sev-2 defects in sign-in, session, or phone capture paths
- state, nonce, and callback replay protections proven
- wrong-user and wrong-patient access controls proven
- ambiguous-link handling proven
- old Phase 1 requests remain accessible under transitional rules
- telephony webhook and recording pipeline stable under retry and disorder
- SMS continuation tokens cannot be replayed or widened in scope
- same web and phone facts produce the same safety outcome
- audit trail complete for login, linking, continuation, and request creation
- Phase 2 hazard log and safety evidence updated
- rollback rehearsal completed

**Exit state**  
Phase 2 is done when the system can authenticate real patients, link them safely, accept phone capture as a first-class input, and still produce one canonical request and one queue.

[1]: https://digital.nhs.uk/developer/api-catalogue/nhs-login?utm_source=chatgpt.com "NHS login"
[2]: https://digital.nhs.uk/services/personal-demographics-service/access-data-on-the-personal-demographics-service "Access data on the Personal Demographics Service - NHS England Digital"
[3]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration?utm_source=chatgpt.com "NHS App web integration"
[4]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works?utm_source=chatgpt.com "How NHS login works"
[5]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works "How NHS login works - NHS England Digital"
[6]: https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/testing-with-our-mock-authorisation-service-using-nhs-login---separate-authentication?utm_source=chatgpt.com "Testing with our mock authorisation service using NHS login"
[7]: https://digital.nhs.uk/services/clinical-safety/clinical-risk-management-standards?utm_source=chatgpt.com "Clinical risk management standards"
