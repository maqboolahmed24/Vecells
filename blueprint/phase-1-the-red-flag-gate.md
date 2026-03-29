# Phase 1 - The Red Flag Gate

**Working scope**  
Digital intake V1 with synchronous safety gate.

## Phase 1 architectural rules

Before getting into sub-phases, lock four implementation rules.

**Rule 1: the intake lineage stays singular and its state axes stay explicit.**  
Do not invent ad hoc intake tables or dual-write draft stores. Follow the canonical Phase 0 split: `SubmissionEnvelope` owns draft and evidence capture, and `Request` begins only when governed submit promotion succeeds. Keep `SubmissionEnvelope.state`, `Request.workflowState`, `safetyState`, and `identityState` separate so later telephony, ownership claiming, and downstream handoffs extend the same contract instead of redefining status in each phase.

**Rule 2: rules-first safety, not model-first safety.**  
Phase 1 should use authored clinical decision tables and explicit rule IDs, not machine learning. The safeguard gate sits at the very front of the runtime flow, and DCB0129 remains the governing manufacturer-side clinical safety standard; NHS England also publishes clinical safety templates and Agile Development Implementation Guidance that should be used alongside the build. ([NHS England Digital][3])

**Rule 3: web only, but future-proof the shell.**  
Even if real NHS login lands in the next phase, keep the identity seam present now. NHS login later authenticates the user and returns them to your service, but session management and logout remain partner responsibilities, so the UI and API should not be hard-wired around a throwaway auth pattern. ([NHS England Digital][4])

**Rule 4: premium UI is part of engineering, not decoration.**  
Build the Phase 1 wizard with configurable chrome, not hard-coded page furniture, because later NHS App web integration uses this same responsive site in-app and may require hiding headers and footers. The NHS App process also reviews a demo environment, and the expression-of-interest flow asks whether you have a demo environment and a recent WCAG audit. ([NHS England Digital][2])

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
- `sourceChannel = web`
- `identityContext`
- `requestType`
- `structuredAnswers`
- `freeTextNarrative`
- `attachmentRefs`
- `contactPreferences`
- `draftVersion`
- `lastSavedAt`
- `resumeToken`
- `uiJourneyState`
- `draftSchemaVersion`

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

Do not overmodel triage yet. In Phase 1, a non-urgent request becomes `workflowState = triage_ready` with `safetyState = screen_clear` or `residual_risk_flagged`, depending on the persisted safety result. Only hard-stop urgent cases leave the routine path on the same request lineage.

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

**Exit state**  
The whole journey exists as a typed, versioned contract backed by one canonical intake lineage, even if it is still fed with placeholder content and simulator data.

## 1B. Draft lifecycle and autosave engine

This sub-phase gives the intake journey durability.

**Backend work**

Do not create a separate temporary table outside the domain model. Keep drafts in the canonical `SubmissionEnvelope` with `state = draft`, `latestEvidenceSnapshotRef`, and a draft-scoped public access token.

Implement the autosave algorithm like this:

1. client requests `POST /drafts`
2. server creates `SubmissionEnvelope` in `state = draft`
3. server creates or refreshes `DraftResumeProjection`
4. server returns `draftPublicId`, `resumeToken`, `draftVersion`, and route state
5. client sends debounced `PATCH` updates with `draftVersion`
6. server applies optimistic concurrency to the same `SubmissionEnvelope`
7. server emits `intake.draft.updated`
8. projection worker updates `draft_resume_projection`

Store step-level completion markers separately from answer payloads so the UI can recover gracefully after interruption.

Keep a lightweight local cache in the browser, but treat the server copy as authoritative. If the browser has unsynced edits and the server has a newer version, show a merge and review screen rather than silently overwriting.

Reserve `identityContext` in the draft now even if full NHS login comes later. NHS login later uses a redirect flow and your service still owns session state, so the draft lineage should already be able to move from anonymous or partial identity to authenticated identity without re-creating the accumulated intake context. ([NHS England Digital][4])

**Frontend work**

The patient should never wonder whether their work has been saved.

Build:

- autosave on field blur and timed debounce
- explicit `Saved just now` status
- resume after refresh
- cross-tab conflict warning
- Continue your request entry state
- unsaved-changes warning on hard exit

Make the autosave state feel calm, not noisy. It should reassure, not distract.

The stepper should never expose internal complexity. Show only meaningful progress labels, not implementation concepts.

**Tests to pass before moving on**

- optimistic concurrency tests
- resume-after-refresh tests
- two-tab conflict tests
- network-drop mid-autosave tests
- local-cache corruption recovery tests
- end-to-end tests proving a half-finished draft survives redeploys and browser restarts
- no-separate-draft-store tests proving retries cannot fork draft truth into two records

**Exit state**  
A patient can start, pause, return, and continue without losing trust in the flow, and the draft still lives on the same canonical intake lineage through `SubmissionEnvelope`.

## 1C. World-class intake frame and structured capture

This is where the real product experience appears.

**Backend work**

Build the intake frame around **server-driven step and form configuration**, not hard-coded per-page logic. Even in Phase 1, the backend should be able to drive:

- request-type-specific field groups
- required versus optional questions
- conditional questions
- content blocks
- helper messages
- review-page summaries

That allows safe iteration later without rebuilding the client.

Each request type should have its own structured answer schema:

- **Symptoms:** symptom category, onset, severity clues, free narrative, relevant yes or no prompts
- **Meds:** medication query type, medicine name or unknown, issue description, urgency
- **Admin:** form, letter, results, or admin support type, plus relevant details
- **Results:** investigation or test context, if known, date window, and question asked

Do not over-ask in Phase 1. Ask only what the safety gate or triage queue genuinely needs.

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

**Tests to pass before moving on**

- Component-level accessibility tests
- Keyboard-only full journey tests
- Visual regression tests at mobile, tablet, and desktop widths
- Copy review against health-literacy guidance
- Manual screen-reader pass on the full journey
- Task-completion usability tests with at least the main request types

**Exit state**  
The patient intake frame is no longer a prototype. It feels like a finished core service, even before the later channels arrive.

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

1. resolve the idempotency envelope using source command ID, request lineage, and payload hash
2. if the command was previously accepted, return the prior result and do not create a new `Request`, `EvidenceSnapshot`, `TriageTask`, or duplicate projection row
3. persist a new immutable submission `EvidenceSnapshot` before normalization or state advancement
4. build `NormalizedSubmission` and derive `candidateEpisodeRelations = retry | same_episode_candidate | related_episode | new_episode`
5. if relation = `retry`, acknowledge idempotently and stop
6. if relation = `same_episode_candidate`, auto-attach to an existing request only when all of the following are true:
   - same verified patient or same high-assurance `IdentityBinding`
   - same source lineage or same continuation grant or same call session or same draft lineage
   - no divergent clinician decision, no divergent downstream lease, and no separately acknowledged patient intent exists
   - no conflicting onset, request reason, or episode timing exists
7. any other suspected duplicate becomes a separate `Request` plus a `DuplicateCluster`; it must not be silently merged
8. for a new lineage, promote exactly once from `SubmissionEnvelope.state = draft | evidence_pending | ready_to_promote` to `Request.workflowState = submitted`, then advance to `intake_normalized` after canonical normalization succeeds
9. for an existing request lineage, append the snapshot and continue through the safety-preemption path; do not recreate `submitted` or `intake_normalized`
10. classify the triggering evidence as `technical_metadata`, `operationally_material_nonclinical`, or `potentially_clinical`
11. treat only an explicit allow-list as `technical_metadata`, including `delivery_receipt`, `transport_ack`, `attachment_scan_state`, `virus_scan_state`, `template_render_state`, and `read_receipt`
12. treat contact-route changes, grant-state changes, preference changes, and delivery failures as `operationally_material_nonclinical`; version them, but do not treat them as clinically safe by default
13. treat all other new submission evidence as `potentially_clinical`
14. for any `potentially_clinical` evidence, create a `SafetyPreemptionRecord`, recompute the latest composite evidence, and rerun the canonical safety engine before routine flow continues
15. while `SafetyPreemptionRecord.status = pending`, do not close the request, auto-resume routine flow, complete a downstream handoff as final, or present stale reassurance
16. if re-safety yields urgent diversion, create the urgent path immediately, set `safetyState` accordingly, and end routine flow
17. if re-safety clears routine handling, mark the preemption cleared, persist `screen_clear` or `residual_risk_flagged`, create one `TriageTask`, move the request to `workflowState = triage_ready`, emit the canonical events, and return the receipt payload

The important safety rules are these: a request must never skip the durable `submitted` state, and routine flow must never continue while a clinically material `SafetyPreemptionRecord` is still pending.

The safety engine should be **rules-first** and explicitly versioned. Each rule must have:

- rule ID
- rule version
- human-readable name
- clinical rationale field
- owning approver
- effective date
- test fixture set

Store which rules fired on every submission snapshot. That gives replayability, auditability, and safe future iteration.

Any later patient-added detail, channel merge, or duplicate merge that changes safety-relevant evidence must create a new immutable snapshot and rerun the same safety logic before the request continues.

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

**Tests to pass before moving on**

- full rule decision-table coverage
- boundary tests for every red-flag threshold
- mutation tests to catch accidental logic drift
- replay tests proving the same input returns the same rule hits for a given rule version
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

If `safetyState = residual_risk_flagged`, the task must carry the persisted residual-risk rule IDs into queue ranking and workspace review. Residual-risk cases still get a normal receipt, but they are not ordinary `screen_clear` items.

The ETA algorithm in Phase 1 should be deliberately simple, conservative, monotone, and cheap to recompute. Do not promise exact timestamps. Compute an internal working-minutes estimate from one deterministic queue snapshot, then map it to a coarse patient bucket.

For request `i` at queue snapshot `t`, define:

- `rank_i(t)` as the 1-based queue position of `i` under the deterministic queue order active at `t`
- `h_hat_j(t)` as the robust handling-minutes estimate attached to queue item `j`; use a per-band rolling `q_0.8` with shrinkage to the tenant-wide prior when the local sample is small
- `W_k(t) = sum_{m = 1}^{k} h_hat_m(t)` as the prefix workload array, materialized once per snapshot, with `W_0(t) = 0`
- `B_i(t) = W_{rank_i(t)-1}(t)` as the effective backlog minutes ahead of `i`
- `mu_live(t) = sum_r availability_r(t) * mu_r(t)` as the live staffed service capacity in handling-minutes cleared per working minute
- `mu_cfg` as the conservative tenant fallback service capacity from configuration
- `mu_eff(t) = max(1e-6, min(mu_cfg, alpha * mu_live(t) + (1 - alpha) * mu_cfg))` with `0 <= alpha <= 0.5` in Phase 1 so temporary live spikes cannot make the ETA over-optimistic
- `s_hat_i(t) = B_i(t) / mu_eff(t)` as expected wait-to-start in working minutes
- `c_hat_i(t) = s_hat_i(t) + q_0.8(H_band(i)) + buffer_tenant` as conservative completion time using the 80th-percentile handling time for the request band plus an explicit fixed buffer

Calendarize `c_hat_i(t)` against tenant working hours and then map it to patient buckets:

- `same_day` if the calendarized completion time lands before the end of the current working day
- `next_working_day` if it lands before the end of the next working day
- `within_2_working_days` otherwise

Mathematical guardrails:

- `B_i(t)` must be monotone in queue position because it is derived from the same prefix workload array; a lower-ranked task may never receive a shorter ETA bucket than a higher-ranked task under the same snapshot unless both map to the same bucket
- compute `W_k(t)` once per snapshot and reuse it, giving `O(n)` work for the queue snapshot and `O(1)` ETA lookup per request instead of repeated prefix scans
- use robust service-time estimates such as rolling median or `q_0.8`, not mean alone, because handling-time distributions are heavy-tailed
- freeze the bucket on the issued receipt and only improve it on later status views when a fresher projection justifies the change; do not oscillate buckets on small throughput noise

Base ETA on tenant-configured throughput assumptions and live queue projection, not on speculative ML.

Status should also stay coarse in Phase 1, but patient-facing top-level state must use the canonical macro-state mapping from the real-time interaction section in Phase 0. In this phase, the valid top-level patient states are:

- `received`
- `in_review`
- `we_need_you`
- `completed`
- `urgent_action`

Keep status public views separate from staff internal queue detail. A patient does not need internal routing metadata.

Do **not** expose patient-initiated `add more detail later` in Phase 1. Reserve the route contract only. It may be enabled no earlier than Phase 3’s more-info and re-safety workflow, where every newly added patient detail becomes a new evidence snapshot and reruns safety before it affects triage.

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

This is also where notification copy quality matters. NHS guidance on writing health content and NHS messages emphasises clarity, inclusivity, and wording patients understand across channels. ([nhs.uk][6])

**Tests to pass before moving on**

- ETA bucket consistency tests
- projection lag tests
- receipt and status token security tests
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
- Urgent-diverted submissions never create triage-ready requests
- Projection rebuild from raw events reproduces receipt and status views correctly
- Alerting, dashboards, and runbooks are live
- Clinical safety artefacts are updated for the shipped ruleset
- Rollback has been rehearsed successfully

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
