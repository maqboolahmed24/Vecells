# Forensic audit of the pre-patch top-level flow

This file captures defects in the former `vecells-complete-end-to-end-flow.{md,mmd}` baseline and its contract drift against the canonical phase blueprints. Several later phase documents already contain the correct invariant; the defect was that the repository's top-level algorithm either omitted it, contradicted it, or failed to make it operationally visible.

Each finding below gives a concise diagnosis with root cause and systemic impact, followed by the patch response integrated into the audited baseline flow.

## Finding 01 - Missing durable pre-submit lineage shell

**Diagnosis.** The baseline jumped from identity straight into capture and request creation without a durable pre-submit lineage object, so interrupted journeys had no stable envelope for resume, claim, continuation, or replay.

**Patch response.** Added `I_ENVELOPE` to make the canonical `SubmissionEnvelope` or call-session shell explicit before governed promotion.

## Finding 02 - Missing durable `submitted` barrier

**Diagnosis.** The original flow collapsed capture, request creation, and safety into one edge, so retries or crashes could fork state, mis-start SLA clocks, and duplicate downstream work.

**Patch response.** Added `I_SUBMIT` and `I_NORM` so governed promotion, `submitted`, and `intake_normalized` are distinct durable transitions.

## Finding 03 - Missing immutable `EvidenceSnapshot` before normalization

**Diagnosis.** Safety and triage previously consumed mutable in-flight data, which makes later replay, audit, and clinical challenge nearly impossible.

**Patch response.** Made snapshot freezing explicit in `I_SUBMIT` before normalization or routing.

## Finding 04 - No idempotency envelope on submit or replayed commands

**Diagnosis.** Repeated clicks, webhook retries, or flaky mobile networks could re-run the same command and create duplicate tasks, receipts, or bookings.

**Patch response.** Integrated idempotent command handling into `I_SUBMIT` and `I_DUP`.

## Finding 05 - No conservative duplicate and same-episode control

**Diagnosis.** The simplified baseline treated every post-capture flow as a new request, which risks silent forks for true retries and unsafe merges for near-duplicates.

**Patch response.** Added `I_DUP` with explicit retry, continuation, same-episode review, and `DuplicateCluster` control.

## Finding 06 - Identity, access scope, and claim were collapsed into one step

**Diagnosis.** Auth, caller verification, ownership claim, and public-link scope were modeled as the same action, which blurs privilege boundaries and raises wrong-patient exposure risk.

**Patch response.** Split them into `I_AUTH` and `I_ID`, with claim and scope resolution called out explicitly.

## Finding 07 - Continuation and patient-action grants were not modeled

**Diagnosis.** The baseline let patient actions flow straight back into the queue without any visible secure-link or session gate, which leaves stale-link replay and scope widening under-specified.

**Patch response.** Added `AccessGrant` handling in `I_AUTH` and grant-scoped patient actions in `PV_ACTIONS`.

## Finding 08 - Telephony evidence-readiness gate was missing

**Diagnosis.** The phone path fed directly into the same flow as web even when only partial audio or keypad evidence existed, so safety could run on unusable evidence and urgent-live callers had no explicit conservative preemption path.

**Patch response.** Added `I_READY`, `I_CONTINUE`, and the urgent-live branch into `I_URGENT_REQ` so telephony evidence must become safety-usable or be conservatively diverted before normal promotion.

## Finding 09 - Upload and audio quarantine rules were absent

**Diagnosis.** Files and call recordings were captured but not visibly scanned, promoted, or failed in a governed way, which risks malware ingress and orphaned evidence.

**Patch response.** Added `I_ATTACH` with quarantine, scan, transcript, and evidence-classification semantics.

## Finding 10 - Safety model was only binary urgent or not urgent

**Diagnosis.** Residual-risk requests were flattened into the normal path, so queue ranking and review could not distinguish medium-risk work from ordinary safe work.

**Patch response.** Expanded `I_SAFETY` to surface `screen clear`, `residual risk`, and `urgent`.

## Finding 11 - Urgent diversion required and completed were collapsed

**Diagnosis.** The original urgent branch skipped the distinction between deciding a diversion is needed and durably issuing the advice or escalation, which weakens auditability and urgency assurance.

**Patch response.** Added `I_URGENT_REQ` and `I_URGENT_DONE` as separate states.

## Finding 12 - No safe fallback when ingest or safety failed

**Diagnosis.** If the engine timed out or normalization failed, the simplified diagram had no controlled fallback, so the likely runtime outcomes were silent drop, stale reassurance, or unsafe continuation.

**Patch response.** Added `I_FAIL` as a distinct safe fallback surface.

## Finding 13 - Materially new evidence bypassed canonical re-safety

**Diagnosis.** Patient replies, pharmacy returns, hub returns, and other new evidence simply looped back to the queue, which allows clinically relevant changes to bypass safety reassessment.

**Patch response.** Added `T_RESPONSE` and `T_RESAFETY`, both routing back through `I_SAFETY`.

## Finding 14 - Queue ranking had no deterministic scoring contract

**Diagnosis.** The queue node named priorities like fairness and vulnerability, but not a versioned or explainable scorer, making ordering hard to reproduce or defend.

**Patch response.** Reframed `T_QUEUE` as deterministic ranking with persistent risk, fairness, and vulnerability inputs.

## Finding 15 - Task claim and lease semantics were absent

**Diagnosis.** Multiple staff members could plausibly open or act on the same item without a visible operational owner, causing double-work and race conditions.

**Patch response.** Added `T_CLAIM` so queue entry and review are separated by explicit claim and lease semantics.

## Finding 16 - Fairness controls had no starvation counterweight

**Diagnosis.** The prior ranking node mentioned fairness but not aging or balancing, so backlog pressure could permanently starve lower-visibility cohorts.

**Patch response.** Carried fairness and vulnerability directly into the deterministic queue contract.

## Finding 17 - AI assistance was modeled as a mandatory linear stage

**Diagnosis.** The old path forced every review through AI before approval, which creates automation bias and makes AI downtime a direct care-path dependency.

**Patch response.** Converted `T_AI` into an optional sidecar with dotted assistive edges and artifact-only semantics.

## Finding 18 - More-info loop had no TTL, expiry, or escalation rule

**Diagnosis.** Requests for more information could stay open forever, leaving cases suspended without a deterministic next action.

**Patch response.** Added reply TTL semantics to `T_MOREINFO` and an expiry branch back into decisioning.

## Finding 19 - Reopen and bounce-back flows lost same-request continuity

**Diagnosis.** Return paths were modeled as generic loops to the queue, which risks context loss, duplicate downstream cases, and poor operator understanding of what changed.

**Patch response.** Made lineage preservation explicit in `T_REVIEW` and patient `PV_DETAIL` diffs, and routed returns through `T_RESPONSE` rather than blind queue re-entry.

## Finding 20 - Endpoint choice lacked a durable decision object

**Diagnosis.** The baseline jumped from review straight to pathway branches, so the system had no single provenance record for why a case became self-care, callback, pharmacy, or booking.

**Patch response.** Added `T_DECISION` with rationale, rule IDs, and provenance.

## Finding 21 - Human approval boundary was too coarse

**Diagnosis.** Everything appeared to require a generic approval step, but nothing showed which actions are actually irreversible, so either staff are over-blocked or risky actions are under-governed.

**Patch response.** Changed approval to an explicit `Irreversible clinical action?` gate with `T_SIGNOFF` only when needed.

## Finding 22 - Direct outcomes and downstream handoffs were collapsed

**Diagnosis.** The old top-level flow did not distinguish direct outcomes from downstream ownership transfer, which hides the difference between `outcome_recorded` and `handoff_active`.

**Patch response.** Split routing into `T_ROUTE`, `T_OUTCOME`, and `T_HANDOFF` so direct resolutions and downstream cases keep the correct canonical workflow meaning.

## Finding 23 - Clinician messaging had contradictory loop-and-close semantics

**Diagnosis.** The same message-reply node both returned to the queue and closed the case, creating ambiguity about whether a reply reopens work or ends it.

**Patch response.** Split the pathway into `E_MSG_DELIV` and `E_MSG_OUTCOME`, with replies re-entering via `T_RESPONSE` and closure handled separately.

## Finding 24 - Callback handling had contradictory loop-and-close semantics

**Diagnosis.** The callback retry node both fed the queue and closed the case, which makes completed, expired, and evidence-bearing outcomes indistinguishable.

**Patch response.** Split callback into `E_CALLBACK_TRY` and `E_CALLBACK_OUTCOME`.

## Finding 25 - Delivery receipts, bounce handling, and controlled resend were missing

**Diagnosis.** Communication looked like a one-way send, so lost SMS or email could disappear without any operational recovery path.

**Patch response.** Added `E_MSG_DELIV` and explicit adapter feedback via the event spine.

## Finding 26 - Support actions were not bounded by acting context

**Diagnosis.** The support desk was connected straight to patient communications and queue work without a visible replay boundary, which invites privacy drift and unsafe operational scope.

**Patch response.** Kept support in the flow but constrained it to bounded replay and resend through scoped surfaces.

## Finding 27 - Booking ignored supplier capability and actor mode

**Diagnosis.** The old booking path assumed the same search and self-service behavior for every tenant and supplier, which is false across IM1, local gateway, and staff-assisted modes.

**Patch response.** Added `E_BOOK_GATE` for capability-matrix resolution before slot search.

## Finding 28 - Slot search had no snapshot, source-version, or expiry contract

**Diagnosis.** A live list without snapshot metadata creates stale-slot exposure and makes later revalidation or audit opaque.

**Patch response.** Added `E_BOOK_SEARCH` with ranking, source version, and expiry semantics.

## Finding 29 - Booking confirmation lacked full policy-envelope revalidation

**Diagnosis.** The old commit path could confirm a slot without re-checking modality, timeframe, accessibility, continuity, or supplier restrictions against live state.

**Patch response.** Made `E_BOOK_CONFIRM` explicitly revalidate both live supplier state and the original policy envelope.

## Finding 30 - Offer and hold semantics could imply false exclusivity

**Diagnosis.** The simplified flow showed waitlists and confirmations without any canonical reservation authority, which risks fake countdowns and oversold capacity.

**Patch response.** Added `E_BOOK_OFFER` and tied it to `ReservationAuthority`.

## Finding 31 - No ambiguous confirmation or reconciliation state for bookings

**Diagnosis.** Supplier timeouts and async confirmations were not represented, so the system could emit false certainty or lose track of half-completed commits.

**Patch response.** Added `E_BOOK_PENDING` for confirmation pending and reconciliation required.

## Finding 32 - Direct closure on appointment creation was unsafe

**Diagnosis.** The old diagram closed the case as soon as an appointment appeared, even though reminders, reconciliation, or downstream exceptions could still be open.

**Patch response.** Routed appointment closure through `PL_CLOSE` instead of closing directly.

## Finding 33 - Waitlist logic lacked per-capacity exclusivity and deadline fallback

**Diagnosis.** The baseline waitlist could implicitly oversell a single released slot and offered no explicit deadline-based escalation to hub or callback fallback.

**Patch response.** Added `E_WAIT` with truthful one-offer-per-capacity-unit semantics and deadline-risk routing.

## Finding 34 - Hub coordination lacked ranked patient choice and pending confirmation

**Diagnosis.** The network path treated the hub as a simple review then confirm step, hiding cross-site ranking, patient choice, and async confirmation risk.

**Patch response.** Expanded hub handling into `E_HUB_CASE`, `E_HUB_RANK`, and `E_HUB_PENDING`.

## Finding 35 - Pharmacy eligibility was binary and unversioned

**Diagnosis.** A single eligible or not-eligible branch does not capture policy-pack versioning or later rule drift, which is a safety and audit weakness.

**Patch response.** Replaced it with `E_PHARM_ELIG` as a versioned eligibility policy gate.

## Finding 36 - Pharmacy discovery lacked live directory constraints

**Diagnosis.** The choice step did not show opening hours, accepting state, or suitability filters, so patients could be routed to unusable services.

**Patch response.** Added `E_PHARM_FIND` as a directory snapshot with live choice constraints.

## Finding 37 - Pharmacy dispatch lacked ack, retry, and expiry behavior

**Diagnosis.** Sending a referral pack without transport state invites silent delivery failure and dangling cases.

**Patch response.** Added `E_PHARM_SEND` with acknowledgement, retry, and expiry semantics.

## Finding 38 - Resolved pharmacy outcomes were collapsed into self-care

**Diagnosis.** Mapping pharmacy resolution back into self-care loses the fact that an external pharmacy case completed and weakens downstream analytics and audit lineage.

**Patch response.** Added `E_PHARM_DONE` as a separate recorded pharmacy outcome.

## Finding 39 - Urgent pharmacy returns were lumped into generic bounce-back

**Diagnosis.** Urgent GP action and routine no-contact outcomes were previously treated as one branch, which can delay urgent escalation behind normal reopen logic.

**Patch response.** Split pharmacy returns into `E_PHARM_BOUNCE` and `E_PHARM_URGENT`.

## Finding 40 - External outcomes were modeled as UI actions instead of adapter events

**Diagnosis.** Provider confirmations, delivery receipts, and telephony callbacks were not shown feeding the event spine, making external-state reconciliation look purely synchronous.

**Patch response.** Connected `R_GP`, `R_MSG`, `R_TEL`, and `R_REF` back into `PL_BUS`.

## Finding 41 - Admin, comms, and access changes bypassed a versioned policy registry

**Diagnosis.** Runtime behavior was shown as being altered directly by admins, which hides config versioning, approval, and audit lineage.

**Patch response.** Added `PL_POLICY` and routed `AU_CONFIG`, `AU_COMMS`, and `AU_ACCESS` through it.

## Finding 42 - Governance was wired into runtime clinical approval

**Diagnosis.** The old diagram sent governance users directly into the approval gate, which mixes oversight with frontline clinical execution and creates the wrong operational boundary.

**Patch response.** Removed that coupling and attached governance to assurance instead.

## Finding 43 - Object-store artifacts were not shown entering the event spine

**Diagnosis.** Files, audio, and transcripts were stored, but the top-level flow never showed them generating canonical events, risking orphaned evidence and incomplete read models.

**Patch response.** Added `PL_OBJ --> PL_BUS`.

## Finding 44 - Projection freshness and stale-state awareness were absent

**Diagnosis.** Patient and ops surfaces appeared to consume live projections with no freshness state, which encourages action on stale data during outages or lag.

**Patch response.** Added freshness-aware labels to patient and ops surfaces and a dedicated analytics node for freshness health.

## Finding 45 - Closure lacked a no-open-lease and no-open-exception invariant

**Diagnosis.** The old `CLOSE` node was a passive terminal, not a governed decision, so any local pathway could appear to close the request prematurely.

**Patch response.** Added `PL_CLOSE` as `LifecycleCoordinator` and tightened the closure rule text.

## Finding 46 - Assurance was shown as passive reporting rather than a control plane

**Diagnosis.** Audit, analytics, and assurance appeared downstream-only, with no fail-closed ingestion or restore-proof discipline visible in the top-level design.

**Patch response.** Added `PL_ASSURE` with fail-closed assurance and restore-proof semantics.

## Finding 47 - Cross-organisation and support visibility boundaries were under-specified

**Diagnosis.** The simplified top-level flow exposed hub, ops, and support surfaces without showing scope-aware projection controls, which can lead to accidental data widening across tenants or organisations.

**Patch response.** Changed `PL_READ` to scope-aware projections and called out org boundaries in `E_HUB_RANK`.


## Finding 48 - Canonical state contract diverged between the kernel summary and the concrete `Request` schema

**Diagnosis.** The top-level kernel correctly defined four orthogonal axes, but the concrete `Request` object later reintroduced mixed-purpose states, so implementers could not tell which contract was authoritative.

**Patch response.** Normalized Phase 0 so the concrete `Request` schema matches the milestone-only workflow contract and keeps blocker facts orthogonal.

## Finding 49 - The concrete `Request` schema dropped the persisted safety axis

**Diagnosis.** The summary kernel expected durable safety state, but the later `Request` field list omitted it, which makes replay, audit, and queue routing nondeterministic after a restart.

**Patch response.** Added explicit `safetyState` back onto `Request`.

## Finding 50 - The concrete `Request` schema dropped identity-binding references and treated `patientRef` as unconditional

**Diagnosis.** The later schema implied the request always had a stable patient binding, even though the algorithm supports anonymous, partial, and matched-but-unclaimed states.

**Patch response.** Restored `identityState`, added `currentIdentityBindingRef`, and clarified that `patientRef` is nullable and derived from verified binding.

## Finding 51 - The concrete `Request` schema omitted current evidence, triage, and handoff pointers

**Diagnosis.** Without authoritative references to the latest snapshot, task, and handoff, recovery logic must infer state from projections or event history, which is brittle under failure.

**Patch response.** Added `currentEvidenceSnapshotRef`, `currentTriageTaskRef`, and `currentHandoffRef` to `Request`.

## Finding 52 - The concrete `Request` schema had no first-class confirmation-gate or closure-blocker references

**Diagnosis.** Ambiguous external truth, duplicate review, repair holds, and fallback recovery had nowhere canonical to live except overloaded workflow states or informal prose.

**Patch response.** Added `currentConfirmationGateRefs[]` and `currentClosureBlockerRefs[]` to `Request`, plus episode-level blocker references.

## Finding 53 - `Episode.state` incorrectly mixed lifecycle with identity repair hold semantics

**Diagnosis.** Treating `identity_hold` as an episode lifecycle value makes a temporary safety and privacy freeze look like a terminal or operational episode state.

**Patch response.** Removed `identity_hold` from `Episode.state` and modeled repair hold through `activeIdentityRepairCaseRef` and blocker refs instead.

## Finding 54 - `Request.workflowState` incorrectly mixed workflow milestones with reconciliation states

**Diagnosis.** Encoding `reconciliation_required` in canonical workflow blurs milestone progress with unresolved external truth and encourages downstream services to write canonical state directly.

**Patch response.** Reduced canonical `workflowState` back to milestone states only.

## Finding 55 - `ownershipState` diverged from the canonical `identityState` vocabulary

**Diagnosis.** A one-off field name in the concrete schema creates needless translation logic and invites inconsistent API and projection payloads.

**Patch response.** Renamed the field back to `identityState` in the canonical model.

## Finding 56 - The blueprint lacked an explicit rule that blockers must remain orthogonal to workflow milestones

**Diagnosis.** Even where prose implied this separation, the absence of a hard invariant let later phases quietly encode blockers as workflow states.

**Patch response.** Added a non-negotiable invariant forbidding blockers from becoming `Request.workflowState` values.

## Finding 57 - `RequestClosureRecord` omitted duplicate-cluster blockers

**Diagnosis.** Closure evaluation could defer for generic reasons, but the persisted record could not precisely explain that unresolved duplicate review was the blocking cause.

**Patch response.** Added `blockingDuplicateClusterRefs[]`.

## Finding 58 - `RequestClosureRecord` omitted fallback-review blockers

**Diagnosis.** Degraded accepted progress is safety-significant, but the closure artifact had no dedicated place to record open fallback work.

**Patch response.** Added `blockingFallbackCaseRefs[]`.

## Finding 59 - `RequestClosureRecord` omitted identity-repair blockers

**Diagnosis.** Wrong-patient repair is one of the strongest closure blockers in the whole system, yet it was not explicitly represented in the persisted closure artifact.

**Patch response.** Added `blockingIdentityRepairRefs[]`.

## Finding 60 - `RequestClosureRecord` omitted PHI-grant and reachability blockers

**Diagnosis.** Closure safety depends on grant revocation and contact-route repair, but those hazards were not first-class in the deferred-close record.

**Patch response.** Added `blockingGrantRefs[]` and `blockingReachabilityRefs[]`.

## Finding 61 - The event catalogue lacked attachment-quarantine events

**Diagnosis.** Unsafe or unreadable evidence could enter quarantine without a canonical event, creating blind spots in audit, replay, and alerting.

**Patch response.** Added `intake.attachment.quarantined`.

## Finding 62 - The event catalogue lacked degraded receipt events

**Diagnosis.** The algorithm promises honest degraded acknowledgements, but without a dedicated event those receipts are hard to trace and impossible to replay deterministically.

**Patch response.** Added `patient.receipt.degraded`.

## Finding 63 - The event catalogue lacked fallback-review lifecycle events

**Diagnosis.** `FallbackReviewCase` existed as an object but not as a first-class event stream participant, so exception recovery could disappear from event-driven consumers.

**Patch response.** Added `fallback.review_case.opened` and `fallback.review_case.recovered`.

## Finding 64 - The event catalogue lacked identity-repair lifecycle events

**Diagnosis.** Wrong-patient correction affects access, visibility, compensation, and audit, yet no canonical events signaled when repair work opened or completed.

**Patch response.** Added `identity.repair_case.opened`, `identity.repair_case.corrected`, and `identity.repair_case.closed`.

## Finding 65 - The event catalogue lacked duplicate-review lifecycle events

**Diagnosis.** A review-required duplicate cluster is closure-blocking work, not just metadata, but there was no dedicated event for it.

**Patch response.** Added `request.duplicate.review_required` and `request.duplicate.resolved`.

## Finding 66 - The event catalogue lacked reachability failure and repair events

**Diagnosis.** Contact-route failure can materially alter safety handling, but the event spine could not express that transition explicitly.

**Patch response.** Added `reachability.dependency.created`, `reachability.dependency.failed`, and `reachability.dependency.repaired`.

## Finding 67 - The event catalogue lacked external confirmation-gate lifecycle events

**Diagnosis.** Ambiguous provider truth is central to booking and referral safety, but there were no explicit events for gate creation or resolution.

**Patch response.** Added `external.confirmation.gate.created`, `external.confirmation.gate.confirmed`, and `external.confirmation.gate.disputed`.

## Finding 68 - The event catalogue lacked closure-blocker change events

**Diagnosis.** Without a single event announcing blocker-set mutations, projections must reverse-engineer effective closure state from unrelated domain events.

**Patch response.** Added `request.closure_blockers.changed`.

## Finding 69 - Wrong-patient correction rewrote canonical workflow state instead of attaching repair metadata

**Diagnosis.** The old algorithm pushed `identity_hold` directly into episode and request state fields, which corrupts lifecycle semantics and makes reopened work look like a new workflow stage.

**Patch response.** Reworked the repair algorithm to attach repair blockers and lineage-level identity-hold metadata without rewriting workflow milestones.

## Finding 70 - Required workflow semantics still described repair and reconciliation as workflow states

**Diagnosis.** Even after the state-axis section introduced the right model, the later semantics section contradicted it and would steer implementers back toward overloaded status fields.

**Patch response.** Rewrote the semantics section so unresolved confirmation and repair live in blocker sets, not `Request.workflowState`.

## Finding 71 - Closure evaluation did not explicitly assert empty coordinator-materialized blocker sets

**Diagnosis.** The coordinator checked classes of blockers in prose, but never required the computed blocker refs themselves to be empty, leaving room for stale materialized blocker state.

**Patch response.** Added an explicit emptiness check for request-level and episode-level blocker refs.

## Finding 72 - The booking commit path did not bind ambiguous supplier truth to canonical confirmation gates strongly enough

**Diagnosis.** The prose said closure should block, but it did not explicitly require the request lineage to carry a gate reference that other domains can see.

**Patch response.** Made ambiguous booking commits create or refresh `ExternalConfirmationGate` and hold closure until it clears.

## Finding 73 - Phase 4 used the generic term `reconciliation_required` for booking-case ambiguity

**Diagnosis.** Reusing the same label across case-local and canonical state machines invites implementers to mirror that value into `Request.workflowState`.

**Patch response.** Renamed the booking-case state to `supplier_reconciliation_pending` and documented that it is case-local only.

## Finding 74 - Phase 4 let booking-domain logic write canonical request state directly on success

**Diagnosis.** Direct cross-domain writes bypass the coordinator that Phase 0 says owns milestone derivation and closure control.

**Patch response.** Changed booking success to emit an outcome milestone that `LifecycleCoordinator` derives into canonical request state.

## Finding 75 - Phase 3 let triage-domain logic write canonical request state directly

**Diagnosis.** Triage is the busiest domain in the system; letting it write canonical request state directly multiplies race windows and weakens the control-plane model.

**Patch response.** Reframed Phase 3 so active leases and emitted milestones drive coordinator-owned request-state derivation.

## Finding 76 - Phase 5 let hub-domain logic write canonical request state directly on booked and return paths

**Diagnosis.** Hub coordination is cross-organisation and especially sensitive to stale external truth, so direct canonical writes here are high-risk.

**Patch response.** Converted those updates into milestone or lease signals that `LifecycleCoordinator` interprets.

## Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths

**Diagnosis.** Pharmacy outcomes can arrive weakly correlated or asynchronously, so direct canonical writes create a serious audit and safety hazard.

**Patch response.** Converted pharmacy resolution and reopen paths into milestone or lease signals consumed by `LifecycleCoordinator`.

## Finding 78 - Phase 6 used the generic term `reconciliation_required` for pharmacy outcome ambiguity

**Diagnosis.** As with booking, the generic term blurred local case review with canonical request workflow.

**Patch response.** Renamed the case-local pharmacy state to `outcome_reconciliation_pending`.

## Finding 79 - Phase 6 weak-source matching did not clearly stop at a case-local review state

**Diagnosis.** The earlier wording implied a weak source could advance the live case to an ambiguously named reconciliation state without clearly fencing off canonical request progress.

**Patch response.** Clarified that weak sources may advance only to `outcome_reconciliation_pending` and must not mutate canonical workflow.

## Finding 80 - The top-level Mermaid source lagged behind the audited markdown baseline

**Diagnosis.** The repository had two supposedly authoritative top-level flow sources, but the `.mmd` file was missing several fixes already present in the markdown copy.

**Patch response.** Synchronized the standalone Mermaid source with the audited markdown baseline.

## Finding 81 - The standalone Mermaid source lacked an explicit quarantine path for unsafe or unreadable evidence

**Diagnosis.** The graph implied all uploaded evidence proceeds through the same path, which hides malicious-file and unreadable-artifact recovery behavior.

**Patch response.** Added `I_QUAR` and a dedicated unsafe-evidence branch.

## Finding 82 - The standalone Mermaid source could route engine or ingest failure without a degraded receipt

**Diagnosis.** That path violates the promise that accepted progress always yields patient-visible continuity.

**Patch response.** Routed ingest and safety failure through `FallbackReviewCase` and back to receipt issuance.

## Finding 83 - The standalone Mermaid source collapsed review-required duplicate clusters into the normal new-lineage path

**Diagnosis.** The graph visually suggested duplicate review and routine new-request creation were the same branch, which hides a key closure-blocking distinction.

**Patch response.** Split review-required duplicate clusters into `X_DUP` and routed them to explicit review work.

## Finding 84 - The standalone Mermaid source understated manual fallback semantics in the evidence-readiness gate

**Diagnosis.** The earlier `I_READY` label described only urgent-live and ready-to-promote behavior, leaving manual fallback invisible in the top-level diagram.

**Patch response.** Expanded the readiness gate text to include manual fallback explicitly.

## Finding 85 - The top-level flow notes described `identity_hold` as if it were a canonical workflow state

**Diagnosis.** Even with better internals, the summary notes still phrased repair as a state transition rather than a lineage-level repair hold, perpetuating the same misunderstanding for readers.

**Patch response.** Reworded the summary flow and source comments to describe a lineage-level identity hold instead of a workflow-state mutation.
