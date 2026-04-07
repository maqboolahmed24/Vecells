# Phase 1 - The Red Flag Gate

**Working scope**
Digital intake V1 with synchronous safety gate.

## Phase 1 architectural rules

Before getting into sub-phases, lock four implementation rules.

**Rule 1: the intake lineage stays singular and its state axes stay explicit.**
Do not invent ad hoc intake tables or dual-write draft stores. Follow the canonical Phase 0 split: `SubmissionEnvelope` owns draft and evidence capture, and `Request` begins only when governed submit promotion succeeds. Keep `SubmissionEnvelope.state`, `Request.workflowState`, `safetyState`, and `identityState` separate so later telephony, ownership claiming, and downstream handoffs extend the same contract instead of redefining status in each phase. The envelope-to-request boundary must be represented by one immutable `SubmissionPromotionRecord`, not inferred later from a draft token, route param, or client cache.

**Rule 2: rules-first safety, not model-first safety.**
Phase 1 should use authored clinical decision tables and explicit rule IDs, not machine learning. The safeguard gate sits at the very front of the runtime flow, and DCB0129 remains the governing manufacturer-side clinical safety standard; NHS England also publishes clinical safety templates and Agile Development Implementation Guidance that should be used alongside the build. ([NHS England Digital][3])

**Rule 3: web only, but future-proof the shell.**
Even if real NHS login lands in the next phase, keep the identity seam present now. NHS login later authenticates the user and returns them to your service, but session management and logout remain partner responsibilities, so the UI and API should not be hard-wired around a throwaway auth pattern. ([NHS England Digital][4])

**Rule 4: premium UI is part of engineering, not decoration.**
Build the Phase 1 wizard with configurable chrome, not hard-coded page furniture, because later NHS App web integration uses this same responsive site in-app and may require hiding headers and footers. The NHS App process also reviews a demo environment, and the expression-of-interest flow asks whether you have a demo environment and a recent WCAG audit. ([NHS England Digital][2])

## Control priorities

The Phase 1 public intake and outcome-control layer requires five corrections:

1. live intake, receipt, and status routes must bind to one published `AudienceSurfaceRuntimeBinding`, so stale publication, parity drift, or provenance drift cannot still imply writable or trustworthy patient posture
2. patient intake and outcome shells must bind to `PatientShellConsistencyProjection`, `PatientEmbeddedSessionProjection`, `RouteFreezeDisposition`, and `ReleaseRecoveryDisposition`
3. submit and urgent-diversion transitions must chain to canonical `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, and `TransitionEnvelope`
4. attachment previews, urgent-guidance outcomes, receipts, and status views were missing governed `ArtifactPresentationContract` and `OutboundNavigationGrant` rules
5. patient and internal support surfaces for this phase must include canonical `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` requirements

## 1A. Journey contract and intake schema lock

This sub-phase turns the intake flow into hard contracts.

The digital journey is already defined by the product architecture: request type selection, detail capture, optional upload, contact preference confirmation, governed request creation, red-flag check, then either urgent advice or queue entry with receipt and ETA. Request types in the journey are explicitly Symptoms, Meds, Admin, and Results.

**Backend work**

Define the public intake contracts now and freeze them before UI logic starts to sprawl.

Use these endpoints as the first stable surface:

- `POST /v1/intake/drafts`
- `GET /v1/intake/drafts/{draftPublicId}`
- `PATCH /v1/intake/drafts/{draftPublicId}`
- `POST /v1/intake/drafts/{draftPublicId}/attachments:initiate`
- `POST /v1/intake/drafts/{draftPublicId}/submit`
- `GET /v1/intake/requests/{requestPublicId}/receipt`
- `GET /v1/intake/requests/{requestPublicId}/status`

Use separate public IDs for drafts and requests. Never expose internal aggregate IDs.

Lock the public `IntakeDraftView` contract. This is a transport and projection schema backed by the canonical `SubmissionEnvelope` in `state = draft`; it is **not** a second aggregate or a second source-of-truth table.

At minimum it should contain:

- `draftPublicId`
- `ingressChannel = self_service_form`
- `surfaceChannelProfile = browser | embedded`
- `intakeConvergenceContractRef`
- `identityContext`
- `requestType`
- `structuredAnswers`
- `freeTextNarrative`
- `attachmentRefs`
- `contactPreferences`
- `channelCapabilityCeiling`
- `draftVersion`
- `lastSavedAt`
- `resumeToken`
- `uiJourneyState`
- `draftSchemaVersion`

`IntakeDraftView` is the self-service rendering of the canonical Phase 0 intake-convergence contract, not a browser-only payload shape. Standalone browser start-request, NHS App embedded start-request, secure-link resume, and authenticated resume may differ in shell chrome, route binding, or capability ceiling, but they must bind the same canonical field meanings, duplicate semantics, and promotion boundary.

Add these route and settlement control objects now:

**IntakeSurfaceRuntimeBinding**
`intakeSurfaceRuntimeBindingId`, `routeFamilyRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `patientShellConsistencyProjectionRef`, `patientEmbeddedSessionProjectionRef`, `routeFreezeDispositionRef`, `releaseRecoveryDispositionRef`, `bindingState = live | recovery_only | blocked`, `validatedAt`

**IntakeSubmitSettlement**
`intakeSubmitSettlementId`, `draftPublicId`, `requestPublicId`, `submissionPromotionRecordRef`, `patientJourneyLineageRef`, `idempotencyRecordRef`, `routeIntentBindingRef`, `commandActionRecordRef`, `commandSettlementRecordRef`, `transitionEnvelopeRef`, `audienceSurfaceRuntimeBindingRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `releaseRecoveryDispositionRef`, `uiTransitionSettlementRecordRef`, `uiTelemetryDisclosureFenceRef`, `presentationArtifactRef`, `result = urgent_diversion | triage_ready | stale_recoverable | denied_scope | failed_safe`, `recordedAt`

**IntakeOutcomePresentationArtifact**
`intakeOutcomePresentationArtifactId`, `requestPublicId`, `artifactPresentationContractRef`, `outboundNavigationGrantPolicyRef`, `audienceSurfaceRuntimeBindingRef`, `surfaceRouteContractRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `releasePublicationParityRef`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `artifactState = summary_only | inline_renderable | external_handoff_ready | recovery_only`, `createdAt`

Rules:

- every patient-facing intake, receipt, and status route must bind one published `AudienceSurfaceRuntimeBinding`; `IntakeSurfaceRuntimeBinding` is the patient-route adapter over that exact runtime tuple
- every active intake or outcome shell must materialize under one `PatientShellConsistencyProjection`; if rendered inside NHS App, it must also validate `PatientEmbeddedSessionProjection` before writable or trustworthy posture appears
- stale publication, parity drift, embedded mismatch, or channel freeze must preserve the same shell and degrade through `RouteFreezeDisposition` or `ReleaseRecoveryDisposition`; generic failure pages are not valid steady-state behavior for the same draft or request lineage
- submit must resolve through one immutable `SubmissionPromotionRecord`; receipt, status, silent re-auth, and embedded resume may not infer the envelope-to-request boundary from local draft state alone
- self-service browser and NHS App embedded intake must share the same `IntakeConvergenceContract(ingressChannel = self_service_form)`; embedded posture may narrow delivery or shell behavior, but it may not create a second pre-submit data model or alternate request semantics
- if a draft lineage already has `SubmissionPromotionRecord`, any later draft-resume attempt must route to the authoritative request shell or bounded recovery rather than reopening a second mutable draft lane

Also lock these event contracts:

- `request.submitted`
- `intake.draft.created`
- `intake.draft.updated`
- `intake.attachment.added`
- `intake.normalized`
- `safety.screened`
- `safety.urgent_diversion.required`
- `safety.urgent_diversion.completed`
- `triage.task.created`
- `patient.receipt.issued`
- `communication.queued`

Do not emit both `request.submitted` and a second parallel `intake.submitted` event for the same state transition. The canonical submit event is `request.submitted`.

All draft events must be emitted from the canonical `SubmissionEnvelope` and its projections. They must not imply a separate `RequestDraft` persistence model.

Do not overmodel triage yet. In Phase 1, a non-urgent request becomes `workflowState = triage_ready` with `safetyState = screen_clear` or `residual_risk_flagged`, depending on the persisted safety result. Requests leave the routine path only when the canonical urgent boundary is crossed, with hard-stop rules remaining the dominant urgent trigger on the same request lineage.

**Frontend work**

Design the full journey map before building pages. Do not let page count emerge accidentally.

The cleanest Phase 1 page stack is:

1. intake landing and service explanation
2. request type
3. details
4. supporting files
5. contact preferences
6. review and submit
7. urgent advice outcome or receipt outcome
8. minimal track-my-request page

The intake landing page should establish scope and safety immediately. Put the emergency escape route right at the top, not buried in helper text.

The UI standard here should be:

- spacious layout
- single dominant action per step
- mobile-first vertical rhythm
- strong section hierarchy
- plain, non-clinical language where possible
- no decorative clutter
- no dashboard-like surfaces on the patient side

**Tests to pass before moving on**

- contract tests for every endpoint and event schema
- backward-compatibility tests proving a saved draft from yesterday can still be resumed after a frontend deploy
- route tests proving public IDs and internal IDs are never confused
- content QA sign-off on page and field naming
- no-dual-write tests proving the draft projection and the canonical `Request` remain consistent under retries and failures
- exactly-once promotion tests proving one `SubmissionPromotionRecord` and one `Request` are emitted for an envelope lineage even under duplicate submit, tab race, or auth-return race
- evidence-bundle immutability tests proving normalization, summary, or schema reruns cannot rewrite the original submit snapshot or its receipt-facing parity record

**Exit state**
The whole journey exists as a typed, versioned contract backed by one canonical intake lineage, even if it is still fed with placeholder content and simulator data.

## 1B. Draft lifecycle and autosave engine

This sub-phase gives the intake journey durability.

The draft lifecycle requires five corrections:

1. draft resume and mutation ownership now use a governed session lease instead of an ungoverned link-only model
2. autosave now writes immutable mutation records and explicit save settlements with idempotency and projection-following semantics
3. conflict handling now reconciles semantic field and step changes through an explicit merge plan instead of a generic newer-version warning
4. identity uplift, step-up, and wrong-patient suspicion now freeze PHI-bearing resume until governed rebind or recovery completes
5. draft abandonment, expiry, and degraded recovery now use first-class recovery state rather than silent link or grant failure or implicit data loss

**Backend work**

Do not create a separate temporary table outside the domain model. Keep drafts in the canonical `SubmissionEnvelope` with `state = draft`, `latestEvidenceSnapshotRef`, and a draft-scoped `AccessGrant(grantFamily = draft_resume_minimal)` plus one immutable `AccessGrantScopeEnvelope` rather than an ungoverned public draft link.

Add these draft control objects:

**DraftSessionLease**
`leaseId`, `submissionEnvelopeRef`, `accessGrantRef`, `clientInstanceRef`, `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `actorBindingState = anonymous | partial | verified | uplift_pending | identity_repair_required`, `mutationLane = foreground | background | read_only`, `lastHeartbeatAt`, `expiresAt`, `leaseState = active | superseded | recovery_required | expired`

**DraftMutationRecord**
`mutationRecordId`, `submissionEnvelopeRef`, `clientCommandId`, `idempotencyKey`, `draftVersionBefore`, `draftVersionAfter`, `fieldDeltaRef`, `stepMarkerDeltaRef`, `attachmentDeltaRef`, `identityContextDeltaRef`, `createdAt`

**DraftSaveSettlement**
`settlementId`, `mutationRecordRef`, `ackState = local_ack | server_accepted | projection_seen | merge_required | recovery_required | failed | expired`, `projectionVersionRef`, `experienceContinuityEvidenceRef`, `recoveryRouteRef`, `recordedAt`

**DraftMergePlan**
`mergePlanId`, `submissionEnvelopeRef`, `baseDraftVersion`, `serverDraftVersion`, `localDraftVersion`, `fieldResolutionRefs`, `stepResolutionRefs`, `attachmentResolutionRefs`, `reviewMode = inline_diff | rebind_required`, `createdAt`

**DraftRecoveryRecord**
`recoveryRecordId`, `submissionEnvelopeRef`, `reasonCode = lease_expired | grant_expired | identity_uplift_required | identity_repair_required | degraded_storage | superseded_resume | session_rebind_required | manifest_drift | embedded_channel_frozen`, `resumeMode = normal | diff_first | rebind_required | blocked`, `experienceContinuityEvidenceRef`, `localCacheAcceptedUntil`, `createdAt`

**DraftContinuityEvidenceProjection**
`draftContinuityEvidenceProjectionId`, `submissionEnvelopeRef`, `controlCode = intake_resume`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `shellContinuityKey`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `latestSaveSettlementRef`, `latestRecoveryRecordRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`DraftContinuityEvidenceProjection` binds autosave, resume, and rebind posture to the assurance spine. The shell may preserve local unsynced text and anchor continuity on local state alone, but it may not show authoritative `saved`, writable resume, or quiet recovery posture unless the current `ExperienceContinuityControlEvidence` still validates the same draft lineage, route family, selected-anchor tuple, and session-bound shell under the same live publication tuple.

Implement the autosave algorithm like this:

1. client requests `POST /drafts`
2. server creates `SubmissionEnvelope` in `state = draft`, issues one `draft_resume_minimal` `AccessGrant` with one current `AccessGrantScopeEnvelope`, and opens one foreground `DraftSessionLease`
3. server creates or refreshes `DraftResumeProjection`
4. server returns `draftPublicId`, `resumeToken`, `draftVersion`, route state, and `leaseId`
5. client sends debounced `PATCH` updates with `draftVersion`, `clientCommandId`, `idempotencyKey`, and `leaseId`
6. server validates the active grant, its `AccessGrantScopeEnvelope`, any newer `AccessGrantSupersessionRecord`, lease, current actor-binding state, and any bound `subjectRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, or `channelReleaseFreezeState` before writable state is loaded; stale, superseded, wrong-lane, frozen-channel, or expired resumes must fail into governed recovery rather than silently mutating the envelope
7. server writes one immutable `DraftMutationRecord`, applies optimistic concurrency to the same `SubmissionEnvelope`, and returns `DraftSaveSettlement(ackState = server_accepted | merge_required | recovery_required | failed)`
8. projection worker updates `draft_resume_projection`; the client may show `saved` only after `DraftSaveSettlement` or projection-following rules say the authoritative version is visible in the same shell, and only while `DraftContinuityEvidenceProjection` still validates the same draft anchor and resume posture

Store step-level completion markers separately from answer payloads so the UI can recover gracefully after interruption.

Treat draft conflict as a semantic merge problem, not just a version mismatch. `DraftMergePlan` must reconcile answer payload, step markers, attachments, and identity-context deltas separately so a newer progress flag does not erase a different field answer or vice versa.

Keep a lightweight local cache in the browser, but treat the server copy as authoritative. If the browser has unsynced edits and the server has a newer version, show a merge and review screen rather than silently overwriting.

Reserve `identityContext` in the draft now even if full NHS login comes later. NHS login later uses a redirect flow and your service still owns session state, so the draft lineage should already be able to move from anonymous or partial identity to authenticated identity without re-creating the accumulated intake context. ([NHS England Digital][4]) That uplift must still be governed: resume after sign-in, step-up, or wrong-patient suspicion must re-evaluate the active `AccessGrant`, update `actorBindingState`, and freeze PHI-bearing prefill or seeded data behind `DraftRecoveryRecord(resumeMode = rebind_required)` until binding is re-confirmed.

If the same draft is later resumed inside an NHS App embedded shell, the draft lease must also bind to the current embedded channel contract. A changed `manifestVersionRef`, `releaseApprovalFreezeRef`, or `channelReleaseFreezeState` may preserve the shell and local unsynced text, but it must block mutating resume and open bounded recovery until the draft is rebound to the current embedded posture.

Lifecycle rules:

- only one `DraftSessionLease` may mutate at a time in normal flow; second tabs or devices may open read-only or background leases until the foreground lane yields or a merge review is invoked
- any replacement resume token issued after sign-in uplift, rebind, second-tab takeover, or embedded-channel drift must first supersede the older draft grant through `AccessGrantSupersessionRecord`; old links may not remain live as fallback resume paths
- `SubmissionEnvelope.state = abandoned | expired` must create or refresh `DraftRecoveryRecord`; expired drafts may never mutate directly from an old token even if local cache still exists
- session-epoch, subject-binding, or embedded-channel drift must supersede the active lease and require governed rebind before PHI-bearing or mutating resume continues
- degraded storage, projection lag, or resume-token supersession must preserve local unsynced text, open recovery in the same shell, and never imply the draft was safely saved when authoritative write did not settle
- same-shell `saved`, `resume safely`, or rebind-ready posture may remain visible only while `DraftContinuityEvidenceProjection.validationState` still covers the active `DraftSaveSettlement` or `DraftRecoveryRecord`; stale or blocked continuity evidence must hold the shell in bounded recovery rather than local calm success
- when governed submit promotion succeeds, supersede all active draft resume grants through `AccessGrantSupersessionRecord`, supersede all active draft leases, persist the immutable `SubmissionPromotionRecord`, switch same-lineage recovery to the authoritative request shell, and prevent any further draft mutation on the promoted lineage

**Frontend work**

The patient should never wonder whether their work has been saved.

Build:

- autosave on field blur and timed debounce
- explicit `Saved just now` status
- resume after refresh
- cross-tab conflict warning
- Continue your request entry state
- unsaved-changes warning on hard exit
- in-place merge review when semantic conflicts occur
- explicit rebind or recovery step when sign-in uplift, wrong-patient suspicion, or draft expiry blocks ordinary resume

Make the autosave state feel calm, not noisy. It should reassure, not distract.

The stepper should never expose internal complexity. Show only meaningful progress labels, not implementation concepts.

Map the save UI to `DraftSaveSettlement`, not raw network timing:

- `saving` when local edits are queued or `ackState = local_ack`
- `saved` only after `server_accepted` and, where command-following is required, after `projection_seen`
- `review changes` when `ackState = merge_required`
- `resume safely` when `ackState = recovery_required | expired`
- local field, attachment, or rebind problems stay anchored to the affected region; they must not wipe the whole draft shell

**Tests to pass before moving on**

- optimistic concurrency tests
- resume-after-refresh tests
- two-tab conflict tests
- network-drop mid-autosave tests
- local-cache corruption recovery tests
- end-to-end tests proving a half-finished draft survives redeploys and browser restarts
- no-separate-draft-store tests proving retries cannot fork draft truth into two records
- session-lease fencing tests proving stale or background tabs cannot mutate the active draft lane
- idempotent autosave settlement tests proving retried PATCH commands reuse the prior `DraftMutationRecord`
- semantic-merge tests proving step markers, answers, and attachments reconcile independently
- identity-uplift and wrong-patient-repair tests proving PHI-bearing seeded resume freezes until governed rebind succeeds
- session-lineage and embedded-channel freeze tests proving stale draft resume cannot write through an old session epoch or frozen NHS App contract
- draft-expiry and degraded-recovery tests proving local unsynced text survives into a same-shell recovery path without false saved state
- draft continuity-evidence tests proving stale or blocked continuity proof suppresses authoritative `saved` and writable resume posture
- post-promotion stale-token tests proving a resumed draft token lands in request recovery or receipt, never a second mutable draft

**Exit state**
A patient can start, pause, return, uplift identity, recover from conflicts or expiry, and continue without losing trust in the flow, and the draft still lives on the same canonical intake lineage through `SubmissionEnvelope`.

## 1C. World-class intake frame and structured capture

This is where the real product experience appears.

The structured-capture contract requires five corrections:

1. intake experience bundles are now pinned, versioned, and compatibility-checked per draft lineage
2. every rendered question now carries typed semantic metadata, not just display copy
3. conditional answers now follow explicit supersession and review rules when visibility changes
4. step transitions, resume, and embedded-mode rendering now reuse one governed continuity shell
5. save, sync, and validation feedback now follow a deduplicated quiet-mode status algorithm with anchor preservation

**Backend work**

Build the intake frame around **server-driven step and form configuration**, not hard-coded per-page logic. Even in Phase 1, the backend should be able to drive:

- request-type-specific field groups
- required versus optional questions
- conditional questions
- content blocks
- helper messages
- review-page summaries

That allows safe iteration later without rebuilding the client.

Do not serve free-floating form JSON whose meaning can drift mid-draft. Every active intake draft must pin one `IntakeExperienceBundle` and render against that bundle until a governed migration occurs.

`IntakeExperienceBundle` should include at least:

- `bundleRef`
- `bundleVersion`
- `draftSchemaVersion`
- `questionSetVersion`
- `contentPackVersion`
- `embeddedManifestVersionRef`
- `releaseApprovalFreezeRef`
- `minimumBridgeCapabilitiesRef`
- `effectiveAt`
- `expiresAt`
- `compatibilityMode = resume_compatible | review_migration_required | blocked`
- `embeddedChromePolicy = standard | nhs_embedded_minimal`

Rules:

- draft creation pins the current `IntakeExperienceBundle`
- mid-draft config promotion may not silently swap the active question set, summary wording, or required-field meaning
- `resume_compatible` bundles may resume immediately, `review_migration_required` bundles must open a diff-first review, and `blocked` bundles must stop submission until a governed migration path exists
- when resumed inside NHS App embedded mode, the pinned bundle must also agree with the active `embeddedManifestVersionRef`, `releaseApprovalFreezeRef`, and runtime bridge-capability contract before the draft becomes writable again
- every immutable submission snapshot must record the active `bundleRef`, `bundleVersion`, and `questionSetVersion` so later replay can reconstruct what the patient actually saw

Each request type should have its own structured answer schema:

- **Symptoms:** symptom category, onset, severity clues, free narrative, relevant yes or no prompts
- **Meds:** medication query type, medicine name or unknown, issue description, urgency
- **Admin:** form, letter, results, or admin support type, plus relevant details
- **Results:** investigation or test context, if known, date window, and question asked

Do not over-ask in Phase 1. Ask only what the safety gate or triage queue genuinely needs.

Server-driven rendering is not enough on its own. Each configured question or field group must also declare typed semantics so normalization, summary rendering, and safety review do not infer meaning from UI copy.

Each question definition should carry:

- `questionKey`
- `stepKey`
- `answerType`
- `cardinality`
- `requiredWhen`
- `visibilityPredicate`
- `normalizationTarget`
- `safetyRelevance = none | triage_relevant | safety_relevant`
- `summaryRenderer`
- `supersessionPolicy`
- `helpContentRef`

Conditional-answer lifecycle must be explicit:

1. reveal dependent questions in place from the control that triggered them
2. when a controlling answer changes, recompute the visible question tree for the pinned bundle
3. mark newly hidden dependent answers as `superseded`, retain them for audit, and exclude them from the active summary and normalized payload
4. if a superseded answer was `safety_relevant`, force a review confirmation before submit so the patient sees what changed
5. if a question reappears under a new definition or version, require a fresh answer; do not silently reuse an older hidden value whose semantics may no longer match

**Frontend work**

This is the first high-visibility product surface, so build it like a premium patient product.

The design language should be:

- calm and minimal
- strong whitespace
- clear title and subtext hierarchy
- one question or decision per step
- one primary CTA per step
- secondary actions visually quiet
- sticky footer CTA on mobile
- summary content collapsed to a peek card or drawer unless the current decision genuinely needs it
- crisp validation and recovery states
- autosave and progress feedback merged into one quiet status strip rather than scattered helper chrome

Build every screen so it can later run in a more embedded context. NHS App web integrations surface a responsive website inside the NHS App and may require chrome changes such as hiding headers and footers, so those should not be hard-wired into page composition. ([NHS England Digital][2])

Treat the intake journey as one governed `PersistentShell`, not a chain of disposable step pages. For the same `SubmissionEnvelope`, derive one continuity shell and keep it through step changes, refresh, resume, sign-in uplift, and NHS App embedded rendering while the draft lineage remains unchanged.

That means:

- route and step changes within the same envelope lineage must soft-navigate and preserve shell context
- the current step, focused field group, selected recap chip, and safe scroll position must survive autosave, validation, refresh, and resume
- embedded mode may suppress outer chrome through `embeddedChromePolicy`, but it may not fork the information architecture, step order, or answer semantics
- conditional reveals, summary peeks, and helper regions must patch in place instead of replacing the whole surface or opening detached pages
- any async step commit, upload attach, or guarded continue action must create a local transition state inside the shell rather than blanking the page

Content and interaction rules should already align with NHS service-manual guidance: be inclusive, design for the full user context, write for health literacy, and keep wording easy to understand. NHS services must meet WCAG 2.2 AA, and WCAG 2.2 includes requirements such as minimum target size and accessible authentication. Do not lean on accessibility widgets; build accessible components directly. ([nhs.uk][5])

That means, in engineering terms:

- target controls and tap areas should comfortably meet WCAG sizing expectations
- headings must form a valid hierarchy
- focus order must be predictable
- validation must be announced correctly
- keyboard operation must be complete
- colour must never carry meaning alone
- inline help must be readable and not verbose
- each step should preserve the prior answer as a compact recap chip rather than a competing side panel
- reconnect, refresh, or resume should preserve the same shell, current step, and in-progress field group whenever the draft lineage is unchanged
- urgent diversion should replace the active step in place rather than opening a detached warning page
- only one shell-level status message may render at a time through the shared quiet status strip; save success, freshness, and sync acknowledgements must not duplicate as banner plus toast plus helper text
- control-level validation and upload retry state must stay local to the affected field group and must never reset the current anchor or scroll position
- in `clarityMode = essential`, only the current question, one short rationale or help region, and one next action may remain expanded; additional explanation must replace the existing helper region rather than stack beneath it
- sticky mobile chrome must never obscure the focused control, validation text, or screen-reader announcement region

**Tests to pass before moving on**

- Component-level accessibility tests
- Keyboard-only full journey tests
- Visual regression tests at mobile, tablet, and desktop widths
- Copy review against health-literacy guidance
- Manual screen-reader pass on the full journey
- Task-completion usability tests with at least the main request types
- bundle-compatibility and diff-first-resume tests proving mid-draft config promotion cannot silently drift question meaning
- question-definition contract tests proving every rendered question has one normalization target, one summary renderer, and one declared safety relevance
- conditional-answer supersession tests proving hidden answers are excluded from active payloads and safety-relevant changes force review
- shell-continuity tests proving refresh, resume, and embedded-mode chrome changes preserve the same draft shell and active step anchor
- bundle-and-embedded-contract tests proving a pinned intake bundle cannot resume mutating draft work under a stale NHS App manifest or frozen rollout tuple
- quiet-status suppression tests proving routine save and sync signals stay in the shared status strip while local validation remains local

**Exit state**
The patient intake frame is no longer a prototype. It is version-safe, semantically typed, continuity-preserving, and quiet under change, even before the later channels arrive.

---

## 1D. Attachment ingestion pipeline

Optional uploads look small on a journey map, but they are a full subsystem.

**Backend work**

Use a quarantine-first upload algorithm:

1. Client requests upload initiation.
2. Server returns signed upload target plus `attachmentPublicId`.
3. Client uploads directly to quarantine object storage.
4. Scanner validates MIME, extension, size, malware, and file integrity.
5. Safe files are promoted to durable object storage.
6. Server creates Attachment record and `DocumentReference` pointer.
7. Projection updates draft attachment list.
8. Event `intake.attachment.added` is emitted.

Never let the browser upload large binary payloads through the app server if possible.

Strip dangerous metadata where appropriate, generate preview derivatives for images, and preserve original files only in governed storage.

The attachment record should keep:

- original filename
- content type
- byte size
- checksum
- scan state
- object key
- thumbnail key if present
- linked draft ID
- linked `DocumentReference` ID

Attachment preview, retry, open, and post-submit attachment viewing must resolve through one `ArtifactPresentationContract`. If a view needs to leave the current shell or hand off to another browser or embedded context, it must consume one short-lived `OutboundNavigationGrant` bound to the current draft or request lineage, channel posture, and safe return contract rather than launching a raw storage URL.

**Frontend work**

The upload experience should feel as polished as the rest of the wizard.

Build:

- camera capture on mobile where supported
- drag-and-drop on desktop
- preview cards
- progress states
- remove and replace
- retry failed upload
- upload guidance text that is short and human

Uploads must never visually dominate the journey. They are supportive context, not the main event.

**Tests to pass before moving on**

- Malware-blocking tests
- MIME spoofing tests
- Oversized file rejection tests
- Interrupted upload retry tests
- Duplicate upload idempotency tests
- Preview generation tests
- Accessibility tests on upload controls and progress announcements

**Exit state**
Attachments are safe, durable, and cleanly referenced into the canonical request.

---

## 1E. Submit normalization and synchronous safety engine

This is the heart of Phase 1.

The safeguard gate is the front-door control point in the runtime flow, and the intake journey makes the red-flag decision explicit before the request enters the triage queue.

This section is a phase-specific application of the canonical algorithm in `phase-0-the-foundation-protocol.md` under `## Canonical lifecycle, identity, safety, reservation, access, and reconciliation algorithm`. If any Phase 1 shortcut conflicts with that section, the Phase 0 canonical section wins. `SafetyOrchestrator` owns evidence classification, preemption, and canonical re-safety.

**Backend work**

On submit, do not pass the raw draft straight into triage. Freeze a submission snapshot and normalize first.

Use this submit algorithm:

1. resolve the active `RouteIntentBinding`, `IntakeSurfaceRuntimeBinding`, current draft lineage, `h_raw`, `h_sem`, and canonical replay key `k_replay` before writable submit posture is loaded
2. if replay classification = `exact_replay` or `semantic_replay`, return the prior authoritative `IntakeSubmitSettlement` even when the underlying `CommandSettlementRecord` is still `pending | projection_pending | awaiting_external`, and do not create a new `Request`, `EvidenceSnapshot`, `TriageTask`, or duplicate projection row
3. if replay classification = `collision_review`, freeze one immutable submission `EvidenceCaptureBundle`, derive the canonical normalization package from that frozen input, persist the immutable submission `EvidenceSnapshot`, open `ReplayCollisionReview`, route to explicit review, and stop ordinary promotion flow
4. otherwise freeze one immutable submission `EvidenceCaptureBundle`, derive the canonical normalization package from that frozen input, and persist a new immutable submission `EvidenceSnapshot` before normalization or state advancement
5. build `NormalizedSubmission`, materialize the deterministic candidate-request window, persist immutable `DuplicatePairEvidence` for every plausible candidate, and derive calibrated canonical relation posteriors for `retry | same_episode_candidate | same_episode_confirmed | related_episode | new_episode` only from the frozen snapshot packages, never from mutable draft state or regenerated summaries
6. if relation = `retry`, settle one `DuplicateResolutionDecision(decisionClass = exact_retry_collapse)` from the winning pair evidence, acknowledge idempotently, and stop
7. if relation = `same_episode_candidate`, create a separate `Request` plus `DuplicateCluster(relationType = review_required)`; persist pairwise evidence, candidate competitors, and one `DuplicateResolutionDecision(decisionClass = review_required)`, and do not auto-attach
8. if relation = `same_episode_confirmed`, auto-attach only when the stricter internal `same_request_attach` class also clears the canonical attach thresholds, uncertainty bound, candidate-to-candidate competition margin, explicit-continuity-witness requirement, and no-divergence checks; if attach occurs, persist `DuplicateResolutionDecision(decisionClass = same_request_attach)`, otherwise create a separate `Request` inside the same `Episode` with `DuplicateResolutionDecision(decisionClass = same_episode_link)`
9. if relation = `related_episode` or `new_episode`, create a separate `Request` under the canonical episode-formation rules and persist the corresponding `DuplicateResolutionDecision`
10. for a new lineage, promote exactly once from `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote` to `Request.workflowState = submitted` by creating one immutable `SubmissionPromotionRecord`, superseding active draft-resume grants and `DraftSessionLease`s, binding the resulting `PatientJourneyLineage`, then advance to `intake_normalized` after canonical normalization succeeds
11. for an existing request lineage that was already proven `same_request_attach`, append the snapshot and continue through the safety-preemption path; do not recreate `submitted` or `intake_normalized`
12. settle one immutable `EvidenceClassificationDecision` over the triggering submission snapshot, carrying the dominant evidence class, dependency upgrades, classifier version, reason codes, and misclassification-risk posture
13. treat only an explicit allow-list as `technical_metadata`, including `delivery_receipt`, `transport_ack`, `attachment_scan_state`, `virus_scan_state`, `template_render_state`, and `read_receipt`
14. treat pure control-plane changes such as grant-state updates or non-critical preference changes as `operationally_material_nonclinical`; if a contact-route change, delivery failure, or preference delta threatens an active `ReachabilityDependency`, classify it as `contact_safety_relevant` instead
15. treat all other new submission evidence as `potentially_clinical`, and if attachment, transcript, OCR, or parser degradation leaves safety meaning unresolved, fail closed through `EvidenceClassificationDecision.misclassificationRiskState = fail_closed_review` rather than downgrading the batch
16. for any `potentially_clinical` or `contact_safety_relevant` dominant class, create `SafetyPreemptionRecord(openingSafetyEpoch = Request.safetyDecisionEpoch + 1)`, recompute the latest composite evidence, evaluate hard-stop rules first, rerun the canonical calibrated urgent and residual-risk functions, and append one `SafetyDecisionRecord` before routine flow continues
17. while `SafetyPreemptionRecord.status = pending | blocked_manual_review`, or while the current `SafetyDecisionRecord` or `UrgentDiversionSettlement` is still pending, do not close the request, auto-resume routine flow, complete a downstream handoff as final, or present stale reassurance
18. if re-safety yields urgent diversion or urgent contact-risk review, settle `SafetyDecisionRecord(requestedSafetyState = urgent_diversion_required)`, create the urgent path immediately, keep `safetyState = urgent_diversion_required` until one `UrgentDiversionSettlement` is issued, then move to `urgent_diverted`, and end routine flow
19. if re-safety clears routine handling, settle `SafetyDecisionRecord(requestedSafetyState = screen_clear | residual_risk_flagged)`, mark the preemption cleared, persist the contributing rule IDs, conflict vector, calibrator version, and resulting `safetyDecisionEpoch`, create one `TriageTask`, move the request to `workflowState = triage_ready`, emit the canonical events, and return the receipt payload
20. persist one canonical `CommandActionRecord` and one authoritative `CommandSettlementRecord`, bind the outcome to the route’s `TransitionEnvelope`, and derive `IntakeSubmitSettlement`
21. if publication, embedded-session, or release posture drifts before the outcome becomes authoritative, return `IntakeSubmitSettlement.result = stale_recoverable | failed_safe` and keep the same shell in the declared `ReleaseRecoveryDisposition` or `RouteFreezeDisposition` rather than implying success

The important safety rules are these: a request must never skip the durable `submitted` state, and routine flow must never continue while a clinically or contact-safety material `SafetyPreemptionRecord` is still pending.

The replay rules are equally strict: exact or semantic browser retries, refreshes, double taps, and transport repeats must always return the same authoritative settlement chain for the same draft lineage and submit intent, while reused identifiers with divergent payload or scope must always stop in `ReplayCollisionReview` rather than silently deduping or creating a second request.

The safety engine should be **rules-first** and explicitly versioned. Each rule must have:

- rule ID
- rule version
- human-readable name
- clinical rationale field
- owning approver
- effective date
- test fixture set
- `severityClass = hard_stop | urgent_contributor | residual_contributor | reachability_contributor`
- `dependencyGroupRef` so correlated findings are capped rather than double-counted
- `logLikelihoodWeight` for the soft-score layer
- `criticalFeatureRefs[]`
- `missingnessMode = ignore | conservative_hold | urgent_review`
- `contradictionMode = require_resolution | clinician_override_only | latest_highest_assurance`
- `calibrationStratumRef` and `validityWindowRef`

Store which rules fired on every submission snapshot. That gives replayability, auditability, and safe future iteration.

For frozen submission snapshot `S`, the synchronous gate must execute in four passes:

1. derive tri-state clinical features, `c_crit(S)`, and `m_crit(S)` from the canonical composite-evidence lattice in Phase 0
2. evaluate all `hard_stop` rules
3. compute the soft urgent and residual scores
   - `z_U(S) = beta_U + sum_g min(C_g^U, sum_{r in G_g^U} I_r(S) * lambda_r) + beta_kU * kappa_U(S) + beta_mU * m_crit(S)`
   - `z_R(S) = beta_R + sum_g min(C_g^R, sum_{r in G_g^R} I_r(S) * lambda_r) + beta_kR * kappa_R(S) + beta_cR * c_crit(S) + beta_mR * m_crit(S)`
   - `p_U(S) = g_U(sigma(z_U(S)))`
   - `p_R(S) = g_R(sigma(z_R(S)))`
4. apply the decision boundary
   - urgent diversion if any `hard_stop` rule fires or `p_U(S) >= theta_U`
   - `residual_risk_flagged` if urgent diversion is false and (`p_R(S) >= theta_R` or `c_crit(S) >= theta_conf` or `m_crit(S) >= theta_miss`)
   - `screen_clear` otherwise

`g_U` and `g_R` are monotone calibrators tied to the rule-pack version; isotonic regression is appropriate once there are enough adjudicated challenge cases for the pathway, otherwise the identity map is mandatory. Hard-stop rules always dominate the calibrators and may never be softened away by probability smoothing. Thresholds must be derived from explicit harm ratios, not intuition alone: `theta_U = C_FP^U / (C_FP^U + C_FN^U)` and `theta_R = C_FP^R / (C_FP^R + C_FN^R)`. That keeps urgent diversion and review-trigger thresholds aligned with clinical decision theory while preserving authored rule control. ([Pauker and Kassirer][9]; [Zadrozny and Elkan][10])

Every promoted rule pack must publish calibration diagnostics on the held-out challenge set for each sufficiently populated request-type stratum: urgent sensitivity at `theta_U`, review capture at `theta_R`, Brier score, calibration intercept, and calibration slope. ([Murphy][11])

Any later patient-added detail, channel continuation, or duplicate-resolution attach or same-episode linkage that changes safety-relevant evidence must first settle one canonical `EvidenceAssimilationRecord` and one `MaterialDeltaAssessment`, then create a new immutable snapshot, append a new `EvidenceClassificationDecision`, and rerun the same safety logic before the request continues. Contradictory low-assurance evidence may open `unresolved` conflict, but it may not clear a previously supported urgent antecedent without an explicit clinician-resolution event or higher-assurance governed override.

If the safety engine itself fails, do not silently continue. Preserve the draft and fail into a safe fallback outcome such as `we could not process this online right now` with clear onward action.

NHS England still frames DCB0129 as the manufacturer-side clinical risk management standard, and the clinical safety documentation page provides templates plus Agile Development Implementation Guidance. That should shape how this sub-phase runs: each rule-set change should update the hazard log, safety case, and test evidence incrementally, not as an afterthought. NHS also provides a DFOCVC generic hazard log as a reference source. ([NHS England Digital][3])

**Frontend work**

The submit moment should feel controlled and trustworthy.

Build three distinct outcome experiences:

**Normal safe submission**
Clean confirmation state, clear next step, reference code, ETA, status link.

**Urgent diversion**
High-clarity urgent guidance, visually distinct from ordinary errors, no ambiguity about what to do next, and no passive `we’ll review this later` language.

**Safety processing failure**
Rare fallback state, clearly different from urgent diversion, preserves patient progress, and offers the next best action.

Do not make the urgent diversion screen look like a validation error. It is a pathway change, not a field issue.

Urgent diversion, safe receipt, and safety-processing failure must each render through one `IntakeOutcomePresentationArtifact` and one `ArtifactPresentationContract`. If the safest next step requires external browser or cross-app handoff, that handoff must consume one `OutboundNavigationGrant` and remain visibly governed by the same outcome lineage rather than launching a detached raw URL.

**Tests to pass before moving on**

- full rule decision-table coverage
- boundary tests for every red-flag threshold
- mutation tests to catch accidental logic drift
- replay tests proving the same input returns the same rule hits for a given rule version
- in-flight submit replay tests proving refresh or retry returns the same live authoritative settlement instead of a second optimistic path
- collision-review tests proving reused identifiers with divergent payload never create a second request or silently collapse into the first
- dependency-group cap tests proving correlated symptoms cannot double-count past the configured group ceiling
- contradiction-monotonicity tests proving low-assurance conflicting evidence cannot clear a fired hard-stop rule
- critical-missingness tests proving unresolved required features hold the case at `residual_risk_flagged` or escalate according to rule policy rather than falling through to `screen_clear`
- classification-decision tests proving degraded attachments, partial transcripts, or extractor disagreement fail closed to review instead of being downgraded to nonclinical metadata
- safety-decision-epoch race tests proving late evidence invalidates stale routine submit or booking-completion posture before calm UI can advance
- urgent-required-versus-urgent-issued tests proving `urgent_diversion_required` cannot present as `urgent_diverted` before one `UrgentDiversionSettlement` is durably issued
- calibration regression tests proving urgent sensitivity, review capture, Brier score, calibration intercept, and calibration slope remain within signed-off tolerances for the active rule pack
- idempotent submit tests
- safety-engine timeout and failure tests
- clinical sign-off on the initial ruleset and challenge dataset
- re-safety-on-new-snapshot tests for later detail additions and evidence merges

**Exit state**
Submission is now a controlled, clinically safe transition on the canonical request, not just a form POST.

## 1F. Triage handoff, receipt, ETA, and minimal status tracking

Once a request clears the safety gate, it must become operational immediately.

The intake journey ends with send into triage queue and patient sees receipt plus ETA, so this sub-phase is required for Phase 1 to be complete.

**Backend work**

For non-urgent submissions:

- keep the canonical `Request` in `workflowState = submitted` until normalization succeeds
- move the request to `workflowState = intake_normalized` once the immutable submission snapshot and canonical normalization are complete
- create one `TriageTask`
- only after the `TriageTask` exists, move the canonical `Request` to `workflowState = triage_ready`
- set `safetyState = screen_clear` or `safetyState = residual_risk_flagged`, depending on the persisted safety result
- create patient-facing receipt projection
- create patient-facing status projection
- enqueue confirmation communication
- emit `triage.task.created`, `patient.receipt.issued`, and `communication.queued`

Receipt and status projections must materialize beneath the active `IntakeSurfaceRuntimeBinding`. A public web receipt, authenticated receipt, and NHS App embedded receipt are different route contracts even when they share the same visual shell. If publication, embedded posture, or release posture becomes stale, the patient shell must preserve the same request anchor and degrade through the declared `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` instead of showing falsely live status affordances.

Those route contracts must still bind the same promoted `NormalizedSubmission`, `SubmissionPromotionRecord.receiptConsistencyKey`, and `PatientReceiptConsistencyEnvelope`. Web, authenticated, embedded, secure-link, and telephony-origin request views may differ in access path or helpful provenance copy, but they may not publish different ETA buckets, receipt semantics, or patient-facing status truth for the same request lineage.

If `safetyState = residual_risk_flagged`, the task must carry the persisted residual-risk rule IDs into queue ranking and workspace review. Residual-risk cases still get a normal receipt, but they are not ordinary `screen_clear` items.

The ETA algorithm in Phase 1 should remain conservative, monotone, and cheap, but it must expose uncertainty honestly. Do not publish a patient promise from a single point estimate. Compute a calibrated finish-time interval from one deterministic queue snapshot, then expose only the smallest patient bucket whose calibrated on-time probability clears policy.

For request `i` at queue snapshot `t`, define:

- `rank_i(t)` as the 1-based queue position of `i` under the deterministic queue order active at `t`
- `band(i)` as the service band or pathway class for `i`
- `G_b^local` as the recent empirical handling-time distribution for service band `b`
- `G^global` as the tenant-wide handling-time prior
- `w_b = n_b / (n_b + kappa_shrink)` and `G_b = w_b * G_b^local + (1 - w_b) * G^global` as the shrunken handling-time distribution for band `b`
- `M_t` as the recent empirical distribution of effective staffed service capacity in handled-minutes cleared per working minute, truncated to `[m_floor, mu_cfg]` so temporary live spikes cannot make the forecast over-optimistic
- for Monte Carlo draw `r = 1..R`, sample `H_j^{(r)} ~ G_{band(j)}` for each queued item `j` up to and including `i`, sample `Mu^{(r)} ~ M_t`, and compute:
  - `S_i^{(r)}(t) = sum_{m = 1}^{rank_i(t)-1} H_m^{(r)} / max(1e-6, Mu^{(r)})`
  - `C_i^{(r)}(t) = S_i^{(r)}(t) + H_i^{(r)} / max(1e-6, Mu^{(r)}) + buffer_tenant`
- raw predictive quantiles `q_i^lo(t) = Q_{0.1}({C_i^{(r)}(t)}_r)`, `q_i^md(t) = Q_{0.5}({C_i^{(r)}(t)}_r)`, and `q_i^hi(t) = Q_{0.9}({C_i^{(r)}(t)}_r)`
- for recently resolved requests `ell` from the same tenant and compatible band, define interval nonconformity `rho_ell = max(q_ell^lo(t_ell) - y_ell, y_ell - q_ell^hi(t_ell), 0)` where `y_ell` is realized completion time in working minutes
- `delta_t = weightedQuantile_{1-alpha_cov}({rho_ell}, weights_ell)` as the recency-weighted conformal padding, falling back to a tenant-global conservative padding when the local calibration set is thin
- calibrated bounds `L_i(t) = max(0, q_i^lo(t) - delta_t)` and `U_i(t) = q_i^hi(t) + delta_t`

Calendarize `L_i(t)`, `q_i^md(t)`, and `U_i(t)` against tenant working hours. For patient-facing promise buckets with deadlines `d_same_day`, `d_next_day`, and `d_two_days`, define:

- `same_day` if `calendarize(U_i(t)) <= d_same_day`
- `next_working_day` if `calendarize(U_i(t)) <= d_next_day`
- `within_2_working_days` if `calendarize(U_i(t)) <= d_two_days`
- `after_2_working_days` otherwise

Also compute bucket probabilities from the same simulated completion distribution:

- `p_raw_i(b,t) = (1 / R) * sum_r 1{calendarize(C_i^{(r)}(t)) <= d_b}`
- `p_cal_i(b,t) = Cal_eta,b(p_raw_i(b,t))`, where `Cal_eta,b` is a versioned isotonic or beta calibrator fitted on resolved requests for bucket `b`

Treat bucket `b` as admissible only when `calendarize(U_i(t)) <= d_b`. Issue the smallest admissible bucket `b` with `p_cal_i(b,t) >= theta_promise`. If no standard bucket is admissible and calibrated, issue `after_2_working_days` or the configured broader fallback bucket; never over-promise by collapsing longer waits into `within_2_working_days`.

Mathematical guardrails:

- enforce monotonicity in queue rank by applying isotonic regression or pool-adjacent-violators to `q_i^md(t)` and `U_i(t)` across the sorted queue before any bucket is published; a lower-ranked task may not receive an earlier patient promise than a higher-ranked task under the same snapshot
- reuse the same simulated snapshot across all requests, materializing per-draw prefix sums once, giving `O(nR)` forecast assembly for the queue snapshot and `O(1)` ETA lookup per request afterward
- if freshness, staffing coverage, or queue completeness drops below the policy floor, freeze the last authoritative promise and set the envelope to `at_risk` or `recovery_required`; do not silently recompute from partial telemetry
- the issued receipt promise may improve only after a fresher authoritative projection clears both `theta_promise` and the configured hysteresis margin for two consecutive snapshots or one materially better snapshot; it may worsen only through an explicit promise-revision or recovery state, never through silent bucket oscillation
- evaluate the model on both interval coverage and bucket calibration. Median absolute error alone is insufficient because patient truthfulness depends on upper-tail coverage and calibrated bucket probabilities

Base ETA on governed queue simulation plus calibrated uncertainty, not on raw mean throughput or speculative exact timestamps.

Status should also stay coarse in Phase 1, but patient-facing top-level state must use the canonical macro-state mapping from the real-time interaction section in Phase 0. In this phase, the valid top-level patient states are:

- `received`
- `in_review`
- `we_need_you`
- `completed`
- `urgent_action`

Keep status public views separate from staff internal queue detail. A patient does not need internal routing metadata.

Do **not** expose patient-initiated `add more detail later` in Phase 1. Reserve the route contract only. It may be enabled no earlier than Phase 3’s more-info and re-safety workflow, where every newly added patient detail becomes a new evidence snapshot backed by its own frozen capture bundle and parity proof and reruns safety before it affects triage.

**Frontend work**

The receipt view should feel reassuring and premium. It should show:

- a clean confirmation title
- reference code
- what happens next
- ETA bucket
- contact preference summary
- link to track status

Submission success should morph the draft review surface into this receipt view inside the same `PersistentShell`. Use `TransitionEnvelope`, `AmbientStateRibbon`, `AnchorCard`, and `LiveTimeline` rather than a blank reset, hard reload, or spinner-led handoff to a disconnected page.

The status page should be intentionally minimal. One timeline, one current state, one next-step message.

Receipt cards, track-status summaries, urgent-diversion guidance, and any attachment or document references shown after submit must render summary-first through `IntakeOutcomePresentationArtifact` plus `ArtifactPresentationContract`. Any external browser, embedded downgrade, or cross-app handoff from these surfaces must consume one `OutboundNavigationGrant`.

This is also where notification copy quality matters. NHS guidance on writing health content and NHS messages emphasises clarity, inclusivity, and wording patients understand across channels. ([nhs.uk][6])

**Tests to pass before moving on**

- ETA interval coverage, bucket calibration, and monotone-rank tests
- explicit promise-revision and stale-telemetry recovery tests
- projection lag tests
- receipt and status token security tests
- cross-channel receipt-equivalence tests proving browser, embedded, secure-link, and telephony-origin views resolve the same bucket, promise state, and recovery posture for the same authoritative request snapshot
- notification idempotency tests
- status-page stale data tests
- feature-flag-off tests proving add-more-detail-later cannot surface before re-safety exists
- end-to-end tests from submit to receipt to status

**Exit state**
A safe submission now becomes a visible, trackable work item for both the platform and the patient, without opening an unsafe post-submit detail path before re-safety exists.

## 1G. Safety instrumentation, observability, and evidence pack

Phase 1 is not finished when the form works. It is finished when the team can operate it safely.

**Backend work**

Instrument the whole journey.

Minimum metrics:

- draft starts
- per-step abandon rate
- autosave latency
- upload failure rate
- submit success rate
- submit p95 latency
- red-flag rate by request type
- urgent-diversion rule-hit distribution
- triage-task creation rate
- receipt issue failures
- confirmation delivery success rate

Add alerts for:

- safety engine timeout
- spike in urgent-diversion outcomes
- projection lag
- upload scanner failure
- notification queue blockage
- abnormal abandonment increase on any step

Build one internal safety and ops dashboard just for this phase. It does not need to be beautiful yet, but it does need to be accurate.

Update the DCB0129 artefacts as part of the sprint, not at the end. NHS England’s clinical safety pages provide templates for the clinical safety case, clinical risk management plan, and hazard log, plus Agile Development Implementation Guidance. ([NHS England Digital][7])

**Frontend work**

Add internal-only debug panels and support tools:

- request event timeline
- rule-hit viewer
- draft replay view
- attachment scan state viewer
- receipt and status projection viewer

Do not ship these to patients. Keep them behind internal roles.

All patient-facing and internal Phase 1 transitions must emit canonical UI observability:

- one `UIEventEnvelope`
- one `UITransitionSettlementRecord` whenever local acknowledgement can diverge from authoritative submit, receipt, urgent-diversion, or recovery posture
- one `UITelemetryDisclosureFence` proving that public IDs, route params, free text, rule-hit detail, and artifact fragments were redacted to the permitted disclosure class

Internal debug views may inspect route posture, rule hits, and settlement evidence, but they may not leak protected content into traces, selectors, or analytics payloads.

**Tests to pass before moving on**

- Synthetic monitoring of the full submit path
- Audit-log completeness tests for every safety-relevant action
- Alert fire-drill tests
- Projection rebuild tests using Phase 1 events only
- Runbook rehearsal for a safety-engine outage

**Exit state**
The team can now see, explain, and evidence what the phase is doing in production-like conditions.

---

## 1H. Hardening, internal beta, and formal phase-exit gate

This final sub-phase proves that the phase is releasable.

**Backend work**

Run a controlled internal beta with feature flags.

The hardening algorithm should be:

1. Deploy behind tenant and environment flags.
2. Run scripted synthetic submissions hourly.
3. Open internal test cohort.
4. Replay known challenge cases through the safety engine.
5. Monitor abandon rates, red-flag rates, and latency.
6. Fix issues without changing contracts casually.
7. Freeze the initial rule pack and content pack.
8. Tag the release as the Phase 1 baseline.

**Frontend work**

Before sign-off, the patient experience must be demo-grade, not just functionally complete. That matters beyond product quality: later NHS App integration uses a demo environment during assessment, and the expression-of-interest flow explicitly asks about demo access and recent accessibility auditing. ([NHS England Digital][2])

The final Phase 1 patient web experience should already be:

- polished
- responsive
- accessibility-tested
- content-reviewed
- visually consistent
- stable under demo conditions

**Tests that must all pass before Phase 2**

- No Sev-1 or Sev-2 defects in the submit and safety path
- 100% decision-table coverage for the initial ruleset
- All patient steps pass keyboard-only and screen-reader checks
- Uploads are malware-scanned and safely promoted every time
- No duplicate triage tasks from repeated submit attempts
- candidate-competition duplicate tests prove near-equal target requests fail closed into `DuplicateCluster(review_required)` instead of silent attach
- explicit-continuity-witness tests prove same-request attach never occurs from score alone
- Urgent-diverted submissions never create triage-ready requests
- classification and safety-decision artifacts replay the same settled outcome for the same immutable snapshot and rule pack
- Projection rebuild from raw events reproduces receipt and status views correctly
- Alerting, dashboards, and runbooks are live
- Clinical safety artefacts are updated for the shipped ruleset
- Rollback has been rehearsed successfully
- route-contract publication and `RouteFreezeDisposition` or `ReleaseRecoveryDisposition` behavior are proven for intake, receipt, status, and embedded outcome routes
- canonical action-settlement behavior is proven for submit, urgent diversion, safe receipt, and failed-safe recovery flows
- `ArtifactPresentationContract` and `OutboundNavigationGrant` behavior are proven for attachment preview, urgent-guidance handoff, receipt artifacts, and status-linked documents
- `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` emission and redaction are proven for critical patient and internal Phase 1 journeys

**Exit state**
You now have a real, safe digital intake product. It is not a prototype form, and not yet a full access platform, but it is a trustworthy intake front door that cleanly hands work into the rest of Vecells.

[1]: https://digital.nhs.uk/services/gp-connect?utm_source=chatgpt.com "GP Connect"
[2]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration?utm_source=chatgpt.com "NHS App web integration"
[3]: https://digital.nhs.uk/data-and-information/information-standards/information-standards-and-data-collections-including-extractions/publications-and-notifications/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems?utm_source=chatgpt.com "DCB0129: Clinical Risk Management: its Application in the ..."
[4]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works?utm_source=chatgpt.com "How NHS login works"
[5]: https://service-manual.nhs.uk/design-system/design-principles?utm_source=chatgpt.com "Design principles"
[6]: https://service-manual.nhs.uk/content?utm_source=chatgpt.com "Content guide"
[7]: https://digital.nhs.uk/services/clinical-safety/documentation?utm_source=chatgpt.com "Clinical Safety documentation"
[8]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration?utm_source=chatgpt.com "IM1 Pairing integration"
[9]: https://www.nejm.org/doi/abs/10.1056/NEJM198005153022003 "The Threshold Approach to Clinical Decision Making"
[10]: https://dl.acm.org/doi/pdf/10.1145/775047.775151 "Transforming classifier scores into accurate multiclass probability estimates"
[11]: https://journals.ametsoc.org/view/journals/mwre/114/12/1520-0493_1986_114_2671_andotb_2_0_co_2.pdf "A New Decomposition of the Brier Score"
