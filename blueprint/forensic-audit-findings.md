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

**Patch response.** Added `E_WAIT` with truthful-by-default offer semantics, bounded truthful-nonexclusive exceptions only under audited policy, and one authoritative waitlist-continuation chain: `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `WaitlistContinuationTruthProjection` now decide whether local waitlist may continue, when callback or hub fallback must take over, and prevent accepted, expired, or superseded offers from silently clearing fallback debt or leaving false-hope patient copy live.

## Finding 34 - Hub coordination lacked ranked patient choice, authoritative confirmation, and practice-visibility debt

**Diagnosis.** The network path treated the hub as a simple review then confirm step, hiding cross-site ranking, patient choice, async confirmation risk, and the later generation-bound practice-visibility obligation that now blocks calm booked posture.

**Patch response.** Expanded hub handling into `E_HUB_CASE`, `E_HUB_RANK`, and `E_HUB_PENDING`, then bound `AlternativeOfferSession`, selected candidate, commit attempt, confirmation gate, appointment truth, fallback linkage, and practice-visibility debt into one monotone `HubOfferToConfirmationTruthProjection`. Hub, patient, practice, and operations surfaces now have to read that same projection, so stale offers, stale selections, weak booking evidence, or old acknowledgement generations can remain auditable but cannot silently advance calm booked posture or closure.

## Finding 35 - Pharmacy eligibility was binary and unversioned

**Diagnosis.** A single eligible or not-eligible branch does not capture policy-pack versioning or later rule drift, which is a safety and audit weakness.

**Patch response.** Replaced it with `E_PHARM_ELIG` as a versioned eligibility policy gate.

## Finding 36 - Pharmacy discovery lacked live directory constraints

**Diagnosis.** The choice step did not show opening hours, accepting state, or suitability filters, so patients could be routed to unusable services.

**Patch response.** Added `E_PHARM_FIND` as a directory snapshot with live choice constraints.

## Finding 37 - Pharmacy dispatch lacked ack, retry, and expiry behavior

**Diagnosis.** Sending a referral pack without transport state invites silent delivery failure and dangling cases.

**Patch response.** Hardened `E_PHARM_SEND` into a proof-backed dispatch chain: frozen package hash, stable outbound reference set, replay-safe `PharmacyDispatchAttempt`, explicit proof deadlines, and distinct transport-acceptance, provider-acceptance, and authoritative-proof lanes. Patient, pharmacy-console, and operations surfaces now have to read from the same dispatch-truth projection instead of inferring confirmation from weak acknowledgements or mailbox delivery alone.

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

**Patch response.** Added `currentEvidenceSnapshotRef` and `currentTriageTaskRef`, then later strengthened the old singleton handoff pointer into canonical `RequestLineage` plus `LineageCaseLink` joins so child workflow ownership can branch without losing request or episode meaning.

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

**Patch response.** Added `exception.review_case.opened` and `exception.review_case.recovered`, and required any legacy `fallback.review_case.*` producer names to normalize into that canonical namespace before downstream consumption.

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

**Patch response.** Added `confirmation.gate.created`, `confirmation.gate.confirmed`, and `confirmation.gate.disputed`, and required any legacy `external.confirmation.gate.*` producer names to normalize into that canonical namespace before downstream consumption.

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

**Patch response.** Changed booking success to emit `BookingOutcomeMilestone` plus any required `ExternalConfirmationGate` refresh, with `LifecycleCoordinator` alone deriving request-level milestone change from that evidence. Phase 4 now treats authoritative supplier success or same-commit read-after-write proof as case-local truth first, canonical request change second, so booking code may settle `BookingCase` but may not write `Request.workflowState`, closure meaning, or patient-final reassurance directly.

## Finding 75 - Phase 3 let triage-domain logic write canonical request state directly

**Diagnosis.** Triage is the busiest domain in the system; letting it write canonical request state directly multiplies race windows and weakens the control-plane model.

**Patch response.** Reframed Phase 3 so `TriageTask` owns only review-local truth, emitting `TriageMilestoneSignal`, `TriageLeaseSignal`, and `DecisionRecorded` evidence for coordinator consumption. Canonical request state is now derived from those emitted signals by `LifecycleCoordinator`, which closes the race where triage-side reopen, more-info expiry, and handoff creation could otherwise write competing request milestones directly.

## Finding 76 - Phase 5 let hub-domain logic write canonical request state directly on booked and return paths

**Diagnosis.** Hub coordination is cross-organisation and especially sensitive to stale external truth, so direct canonical writes here are high-risk.

**Patch response.** Converted hub booked and return paths into `HubCoordinationMilestone`, `HubReturnSignal`, and `HubContinuationLease` outputs that `LifecycleCoordinator` interprets. Phase 5 now records hub-native booking, confirmation-pending state, current-generation practice-visibility debt, and practice-return evidence on `HubCoordinationCase` only, while request-level milestone and closure blockers remain coordinator-owned until the hub signals settle and any confirmation gates clear.

## Finding 77 - Phase 6 let pharmacy-domain logic write canonical request state directly on resolve and reopen paths

**Diagnosis.** Pharmacy outcomes can arrive weakly correlated or asynchronously, so direct canonical writes create a serious audit and safety hazard.

**Patch response.** Converted pharmacy resolve and reopen paths into `PharmacyOutcomeMilestone`, `PharmacyReopenSignal`, and `PharmacyContinuationLease` events consumed by `LifecycleCoordinator`. Phase 6 now keeps dispatch, outcome, bounce-back, and reopen truth on `PharmacyCase`, with the coordinator deriving request-level milestone change only after source correlation, blocker evaluation, and any required re-safety or repair signals are materialized.

## Finding 78 - Phase 6 used the generic term `reconciliation_required` for pharmacy outcome ambiguity

**Diagnosis.** As with booking, the generic term blurred local case review with canonical request workflow.

**Patch response.** Renamed the case-local pharmacy state to `outcome_reconciliation_pending` and bound it to a first-class `PharmacyOutcomeReconciliationGate`. That gate is explicitly case-local, holds weakly correlated or conflicting pharmacy evidence for review, blocks closure plus patient and practice calmness until resolved, and is forbidden from mapping itself into `Request.workflowState` or any generic canonical reconciliation label.

## Finding 79 - Phase 6 weak-source matching did not clearly stop at a case-local review state

**Diagnosis.** The earlier wording implied a weak source could advance the live case to an ambiguously named reconciliation state without clearly fencing off canonical request progress.

**Patch response.** Clarified that weak sources may advance only to `outcome_reconciliation_pending`, must not mutate canonical workflow, and may not bypass, silently resolve, or downgrade the active `PharmacyOutcomeReconciliationGate`.

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

## Finding 86 - The audit still lacked a non-negotiable patient-shell continuity invariant

**Diagnosis.** The earlier fixes corrected lineage and state ownership, but the audit never made it explicit that patient-facing transitions must stay inside one continuity-preserving shell. That omission leaves room for hard reloads, detached success pages, and contradictory stale screens across request, booking, record, and messaging routes.

**Patch response.** Added an explicit audit rule that adjacent patient states for the same `entityContinuityKey` must reuse one `PersistentShell` with stable `CasePulse`, `StateBraid`, `DecisionDock`, and one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`.

## Finding 87 - The audit did not bind patient projections to a single visibility and consistency envelope

**Diagnosis.** The top-level audit fixed canonical write ownership, but it still left read-side assembly under-specified. Without a shared projection envelope, headers, timelines, and action surfaces can drift across `bundleVersion`, audience tier, or governing-object version and still appear authoritative.

**Patch response.** Added an explicit correction that patient-facing reads must materialize under `VisibilityProjectionPolicy` and assemble beneath `PatientShellConsistencyProjection`, with stale or divergent bundles freezing mutating CTAs until the shell reconverges.

## Finding 88 - The audit omitted governed placeholder rules for partial visibility

**Diagnosis.** Delayed-release records, step-up-gated messages, wrong-patient recovery holds, and other partially visible objects were still implied to be either fully shown or absent. That gap invites PHI leakage in lightweight shells or silent omission of clinically relevant items.

**Patch response.** Added placeholder discipline requiring `releaseState`, `visibilityTier`, `summarySafetyTier`, and `placeholderContractRef` for patient-visible items that can contribute urgency without granting full detail.

## Finding 89 - Reachability, delivery, and consent blockers remained operational facts rather than dominant patient actions

**Diagnosis.** The audit added blocker refs and lifecycle events, but it still did not require patient action routing to surface those blockers as the current next step. That leaves a dangerous gap where reply, booking, callback, or pharmacy continuation can appear live while contact repair, delivery dispute, or consent renewal is actually the gating dependency.

**Patch response.** Added an explicit patient-surface correction that blocked actions must morph in place to `PatientReachabilitySummaryProjection`, `PatientContactRepairProjection`, or `PatientConsentCheckpointProjection`, and no success or mutation CTA may remain live while those dependencies are unresolved.

## Finding 90 - The audit still omitted the hardened NHS App embedded-channel control plane

**Diagnosis.** The top-level audit treated embedded access as ordinary web continuation, even though the hardened channel design requires manifest-pinned routes, trusted context resolution, negotiated bridge capabilities, and safe downgrade behavior. Without that contract, unsupported or unauthorized embedded actions can slip through under the same route label as normal web.

**Patch response.** Added an explicit audit correction binding NHS App entry to approved `manifestVersion`, trusted `ChannelContext`, route-level `minimumBridgeCapabilitiesRef`, and governed downgrade to supported browser or read-only posture when embedded guarantees do not hold.

## Finding 91 - The audit still treated route, settlement, release, and trust controls as phase-local conventions

**Diagnosis.** The audited top-level flow showed policy checks, action binding, and same-shell results, but it still did not name the canonical primitives that make those controls enforceable across phases. Without explicit Phase 0 grounding for route intent, authoritative command settlement, release freeze, and assurance-slice trust, downstream teams could still implement those behaviors as ad hoc per-feature conventions and drift apart.

**Patch response.** Added explicit baseline references to `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, and `AssuranceSliceTrustRecord`, and synced the Phase 0, phase-card, and bootstrap summaries so these controls are now treated as shared foundation contracts rather than optional local hardening.

## Finding 92 - The audit still lacked a canonical staff-workspace consistency and trust envelope

**Diagnosis.** The forensic pass corrected queue ranking, claim, and pathway ownership, but it still did not require queue, task, interruption, status, and dock surfaces to assemble under one operator truth envelope. Without explicit `StaffWorkspaceConsistencyProjection` and `WorkspaceSliceTrustProjection`, degraded or divergent queue, attachment, assistive, or dependency slices can still appear actionable inside the same review shell.

**Patch response.** Added an explicit audit correction that staff work must materialize beneath `StaffWorkspaceConsistencyProjection` and `WorkspaceSliceTrustProjection`, freezing mutating controls when bundle, audience, governing-object version, or trust posture diverges and keeping degraded or quarantined slices visible instead of flattening them into healthy workspace chrome.

## Finding 93 - The audit did not require live review and focus leases for staff mutations

**Diagnosis.** The top-level audit named task claim and queue ownership, but it still stopped short of the stronger rule that every operator mutation must bind to the exact review context currently on screen. That omission leaves start-review, compose, send, decide, and next-task actions vulnerable to stale queue rank, review-version drift, lineage-fence advance, or disruptive deltas arriving mid-decision.

**Patch response.** Added an explicit audit correction that staff mutations must hold a live `ReviewActionLease`, and composition, compare, confirm, and highlighted-delta moments must open `WorkspaceFocusProtectionLease` plus `ProtectedCompositionState`, preserving draft, compare-target, selected-anchor, and quiet-return context while disruptive updates buffer through `DeferredUIDelta` or `QueueChangeBatch` until the protected action settles or the user reacquires context.

## Finding 94 - The audit still treated assistive output as a generic sidecar instead of a trust-bound same-shell capability

**Diagnosis.** The earlier audit fixed AI overreach by making assistance optional, but it still did not state that visible assistive artifacts must stay bound to the active shell, selected anchor, and capability trust posture. Without explicit assistive bindings, suggestions and generated drafts can survive review drift, jump route families, or remain writable while the capability is degraded, quarantined, or frozen.

**Patch response.** Added an explicit audit correction binding visible assistive artifacts to `AssistiveSurfaceBinding`, `SuggestionDraftInsertionLease`, and `AssistiveWorkProtectionLease`, with capability state governed by `AssistiveCapabilityWatchTuple` and `AssistiveFreezeDisposition` so degraded or frozen assistive slices fall back to provenance, placeholder, or hidden posture in the same shell instead of leaving stale accept or insert actions live.

## Finding 95 - The audit still omitted governance watch-tuple parity and recovery posture from release oversight

**Diagnosis.** The audit now names release freezes and assurance trust, but it still did not require governance oversight surfaces to serialize the same guardrail tuple, runtime publication state, and audience recovery posture that runtime and operations consumers actually enforce. That gap allows release review or post-promotion watch screens to look healthier or more writable than the live wave, especially when channel freezes, route-contract publication drift, or bounded recovery modes are active.

**Patch response.** Added an explicit audit correction that governance release oversight must assemble beneath `GovernanceShellConsistencyProjection` and expose `ReleaseFreezeTupleCard`, `WaveGuardrailSnapshotProjection`, `ReleaseRecoveryDispositionProjection`, and `WaveActionDecisionCommand`, ensuring promotion and watch decisions operate on the exact tuple enforced by runtime and release control.

## Finding 96 - The audit still under-specified operations-console trust and guardrail posture

**Diagnosis.** The forensic pass already introduced projection freshness and scope-aware reads, but it still did not require the operations console to render essential-function trust, active rollout freezes, and bounded mitigation posture directly in health and intervention surfaces. Without that explicit rule, `/ops/*` views can still present cells greener than the least-trusted input or leave mitigation actions writable while diagnostics are the only safe posture.

**Patch response.** Added an explicit audit correction requiring `ServiceHealthCellProjection` and `HealthActionPosture` to serialize the governing `AssuranceSliceTrustRecord`, active `ChannelReleaseFreezeRecord`, and fallback sufficiency state into board snapshots, return tokens, and route intents so operators preserve context while affected cells degrade to bounded diagnostic or governance-handoff posture rather than generic healthy actionability.

## Finding 97 - The audit still let patient-home actionability float above authoritative settlement

**Diagnosis.** Even after the patient-shell and route hardening passes, the audited top-level flow still showed `PV_HOME` as a simple summary surface with a next action, not as a governed digest tied to current settlement and same-shell return posture. That gap leaves room for home and request-list CTAs to remain live after pending review, stale recovery, or read-only downgrade should already have frozen them.

**Patch response.** Added `PV_NAV` and bound patient-entry actionability to `PatientNavUrgencyDigest` plus `PatientNavReturnContract`, with same-shell refresh returning through that digest before live CTAs can reappear.

## Finding 98 - Record-origin follow-up still lacked a continuation-safe patient anchor

**Diagnosis.** The previous audit improved record visibility and placeholders, but it still did not show how a patient leaves a result or document view for booking, messaging, or recovery without losing the current record anchor when release, step-up, or session posture drifts. That omission risks reopening child routes as if the original record context were still valid.

**Patch response.** Added `PV_RECORD` and explicit `RecordActionContextToken` plus `RecoveryContinuationToken` semantics so record-origin follow-up returns to the same record anchor when downstream child routes stale or recover.

## Finding 99 - Conversation state could still collapse local acknowledgement into final reassurance

**Diagnosis.** The audited flow already showed message delivery and callback work, but it still lacked a distinct patient-visible digest or receipt chain separating local acknowledgement, delivery evidence truth, and authoritative outcome. Without that split, unread, reply-needed, reviewed, or settled states can still advance from transport acceptance or draft-local feedback rather than from real domain settlement.

**Patch response.** Added `PV_THREAD` and bound conversation status to `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`, with same-shell settlement returning through that chain instead of toast-only or delivery-only cues.

## Finding 100 - Support replay and observe return still had no authoritative restore gate

**Diagnosis.** The earlier audit bounded support replay conceptually, but it still did not show how replay or observe exit proves ticket freshness, mask scope, lease posture, and awaiting-external confirmation evidence before reopening live work. That omission lets browser return or replay exit masquerade as safe restore.

**Patch response.** Added `SU_REPLAY` and `SU_RESTORE`, with `SupportReplayRestoreSettlement` as the explicit authority for `live_restored`, awaiting-external hold, stale reacquire, or read-only recovery before support actions become live again.

## Finding 101 - Same-shell confirmation still understated settlement, return, and continuation posture

**Diagnosis.** The earlier `A_CONFIRM` node described command receipt and recovery guidance, but it still behaved like a generic same-shell acknowledgement point. That left the top-level audit under-specific about the need to preserve settlement contracts, same-shell return bindings, and continuation posture across patient and support recoveries.

**Patch response.** Recast `A_CONFIRM` as a settlement, return, and continuation record, and rewired patient-home refresh, patient-thread refresh, and support replay restore paths through that stronger same-shell contract.

## Finding 102 - Operations diagnosis still lacked first-class continuity evidence

**Diagnosis.** The operations shell already serialized trust, freezes, and return tokens, but it still had no dedicated slice for the continuity controls that now govern patient-home CTA state, record follow-up recovery, thread settlement, or support replay restore. That gap meant `/ops/*` could explain producer or queue health without proving why a user-facing shell was read-only, stale, or recovery-bound.

**Patch response.** Added `OpsContinuityEvidenceProjection`, `OpsContinuityEvidenceSlice`, and `ContinuityEvidenceDrillPath`, and bound `OpsBoardStateSnapshot`, `OpsReturnToken`, `OpsRouteIntent`, and intervention posture to visible `ExperienceContinuityControlEvidence` so diagnostics preserve the same continuity question across assurance, audit, and handoff pivots.

## Finding 103 - Governance compliance review still omitted continuity-evidence bundles

**Diagnosis.** Governance and compliance surfaces already showed assurance trust, release tuples, and watch state, but they still did not package the new continuity controls into one approval-visible evidence set. Without that bundle, reviewers could approve or stabilize changes affecting patient or support shells without seeing the exact proof for navigation, continuation, conversation settlement, or replay restore behavior.

**Patch response.** Added `GovernanceContinuityEvidenceBundle`, wired it into `GovernanceShell`, `GovernanceShellConsistencyProjection`, compliance review, and promotion/watch flows, and required affected drafts or releases to surface those continuity proofs before approval or stabilization can advance.

## Finding 104 - The admin control plane still treated continuity proof as optional release commentary

**Diagnosis.** The domain-level admin blueprint already froze bundles, schemas, and guardrails, but it still did not state that continuity controls themselves are promotion-critical compatibility inputs. That omission let a candidate pass as long as generic simulation and release proof existed, even if the affected patient-nav, record, thread, or replay-restore controls lacked fresh evidence.

**Patch response.** Added `ContinuityControlImpactDigest`, extended `ConfigSimulationEnvelope` with continuity evidence references, and made production promotion fail closed when affected continuity controls lack complete and trusted `ExperienceContinuityControlEvidence`.

## Finding 105 - The audited top-level flow still had no explicit continuity-evidence spine

**Diagnosis.** The top-level flow now showed the continuity contracts themselves, but it still did not show how those visible shell decisions become evidence inside the platform and assurance spine. That gap made the audited system picture stop one step short of the new Phase 9 assurance contract.

**Patch response.** Added an explicit platform node for `ExperienceContinuityControlEvidence`, routed patient and support shells into it, and connected operations and governance consumers to that evidence lane so the end-to-end baseline now shows continuity proof, not just continuity behavior.

## Finding 106 - Ops and governance watch surfaces still lacked a shared continuity-proof loop

**Diagnosis.** Even after the shell-level fixes, the audit still did not state that operations diagnosis and governance watch must consume the same continuity-proof feed when a release or incident changes patient or support behavior. That omission risks split-brain review, where ops sees a degraded experience symptom and governance sees only release guardrails or approval artifacts.

**Patch response.** Bound the audited flow and supporting shell docs to one shared continuity-evidence loop, so `/ops/assurance`, `/ops/audit`, compliance review, promotion watch, and rollback posture all reference the same evidence family before they can claim stabilization or safe mitigation.

## Finding 107 - The foundation protocol still omitted the newer continuity-control families

**Diagnosis.** The feature and control-plane blueprints now define `intake_resume`, `booking_manage`, `assistive_session`, `workspace_task_completion`, and `pharmacy_console_settlement`, but the canonical Phase 0 catalogue still named only the older patient and support continuity controls. That made the newer families look phase-local instead of platform obligations.

**Patch response.** Added continuity-update events, named the five newer continuity producers directly beside the existing patient and support producers, and extended the Phase 0 invariants so local autosave, booking-manage calmness, assistive posture, workspace completion, and pharmacy-console settlement can no longer masquerade as authoritative without continuity proof.

## Finding 108 - Programme phase cards still summarized only the older continuity-proof loop

**Diagnosis.** The delivery cards already reflected the first continuity-evidence spine, but they still summarized only patient-home, record, thread, and replay-restore proof. That lagged the actual blueprint set and understated the newer cross-phase controls teams now need to deliver.

**Patch response.** Extended `phase-cards.md` so the programme summary now names the five newer continuity families and ties them back to the relevant phase summaries and the audited `PL_CONT` spine.

## Finding 109 - The bootstrap summary still scoped continuity proof too narrowly

**Diagnosis.** `blueprint-init.md` already routed patient and support continuity into assurance, ops, governance, and release control, but it still did not state that draft resume, booking manage, assistive session, workspace completion, and pharmacy-console settlement are governed by the same proof model. That left the repo bootstrap one abstraction layer behind the actual architecture.

**Patch response.** Expanded the bootstrap summary so those five newer families are now explicitly described as authoritative shell-level producers and are no longer treated as local UX detail.

## Finding 110 - The audited markdown baseline still routed only patient/support continuity sources into `PL_CONT`

**Diagnosis.** The top-level audited flow showed the continuity-proof spine, but only patient-nav, record, thread, and support replay visibly fed it. The newer continuity-sensitive workflow families therefore remained invisible in the system-level diagram even after the control plane had promoted them.

**Patch response.** Added explicit continuity-source nodes for intake resume, booking manage, assistive session, workspace task completion, and pharmacy-console settlement, then routed them into `PL_CONT` in the audited markdown baseline.

## Finding 111 - The standalone Mermaid source still risked drifting from the audited continuity baseline

**Diagnosis.** Even when the markdown baseline was correct, the repository still carried a separate Mermaid source file that could drift back to the older continuity taxonomy. That would recreate the exact summary-versus-source mismatch the audit is meant to prevent.

**Patch response.** Synced `vecells-complete-end-to-end-flow.mmd` with the audited markdown baseline so the standalone source now carries the same expanded continuity-source set and `PL_CONT` semantics.

## Finding 112 - Resilience restore authority still depended on loose runbooks and dashboards

**Diagnosis.** The Phase 9 and release blueprints already named restore proof, runbook bindings, and readiness snapshots, but they still left restore-control authority fragmented across separate dashboards, runbook links, and operational history. That gap meant `/ops/resilience` or release handoff could look ready because artifacts existed, even when the current publication tuple, latest rehearsal proof, or live recovery posture had drifted away from one another.

**Patch response.** Added a canonical restore-control system across the foundation, Phase 9, runtime-release, and operations shell: `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `ResilienceSurfaceRuntimeBinding`, `RecoveryControlPosture`, tuple-bound `RestoreRun`/`FailoverRun`/`ChaosRun`, authoritative `ResilienceActionSettlement`, and governed `RecoveryEvidenceArtifact` now share one runtime truth model so stale runbooks, superseded exercises, or detached evidence can no longer masquerade as live recovery authority.

## Finding 113 - Assurance evidence could still exist without one authoritative graph proving admissibility

**Diagnosis.** The assurance ledger already named ledger entries, evidence artifacts, control links, continuity sections, incidents, CAPA items, retention artifacts, and exports, but those pieces still stopped short of one shared graph-completeness contract. That gap left room for pack generation, replay, deletion, archive, or governance export to reuse technically present evidence even when the relationship set was stale, cross-scope, or missing required edges.

**Patch response.** Added `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` as the canonical admissibility layer, bound control status, pack generation, replay, retention, governance evidence artifacts, config simulation, and recovery evidence to that same graph, and made sign-off, export, replay, deletion, and archive actions fail closed whenever the current graph is incomplete, orphaned, or drifted.

## Finding 114 - Tenant and acting context could still drift between governance scope and live cross-organisation work

**Diagnosis.** Governance review had a local `GovernanceScopeToken`, and hub or support work had local `ActingContext`, but the architecture still lacked one shared tuple proving tenant scope, organisation scope, environment, purpose-of-use, elevation, break-glass posture, visibility coverage, and blast radius together. That left room for approvals, access review, release watch, or cross-organisation coordination to stay writable after organisation switching, purpose change, or multi-tenant blast-radius drift.

**Patch response.** Added the shared `ActingScopeTuple` and `ActingContextDriftRecord` contracts in Phase 0, made governance scope tokens and config workspaces derive from that tuple, threaded the same tuple through access preview, hub cross-organisation visibility, support coverage, and release watch blast radius, and required organisation-switch, purpose-of-use, elevation, or scope drift to freeze work in place until revalidated under a fresh tuple.

## Finding 115 - Artifact preview and handoff still lacked one live mode-truth contract for constrained channels

**Diagnosis.** The artifact model already named presentation contracts, transfer settlement, and fallback, but it still left preview, byte delivery, print, and browser or app handoff too dependent on static contract permission and route-local channel logic. That gap meant a patient, governance, or recovery artifact surface could still look richer than current parity, bridge capability, byte-grant viability, masking scope, or return-safe continuity actually allowed, especially inside the NHS App webview.

**Patch response.** Added the shared `ArtifactModeTruthProjection` as the single live artifact-mode authority, then threaded it through Phase 0, the platform frontend, Phase 7 embedded delivery, patient record artifacts, governance evidence packs, runtime readiness artifacts, and recovery evidence artifacts. Preview, download, print, and handoff now stay live only while the same truth tuple still validates parity, channel viability, masking posture, grants, and return-safe continuity; otherwise every surface degrades in place to governed summary, secure-send-later, placeholder, or bounded recovery instead of probing browser behavior or relying on raw URLs.

## Finding 116 - Accessibility announcements could still spam, replay stale cues, or blur provisional and authoritative meaning

**Diagnosis.** The accessibility contract already required bounded live regions, but the platform still lacked one typed announcement-truth layer joining surface summary, status acknowledgement scope, focus restore, freshness actionability, timeout repair, form errors, and `UIEventEmissionCheckpoint` order. That left room for autosave churn, queue flush, reconnect, bridge return, local acknowledgement, transport acceptance, and authoritative settlement to emit duplicate wording, wrong urgency, or replayed cues that sounded like fresh user activity.

**Patch response.** Added `AssistiveAnnouncementIntent` plus `AssistiveAnnouncementTruthProjection` as the shared arbitration layer, expanded `AssistiveAnnouncementContract` to carry settlement class, scope, anchor, dominant action, and emission-checkpoint binding, and threaded that same contract through Phase 0, the platform frontend, patient communications, workspace, operations, governance, and embedded NHS App surfaces. Live narration now deduplicates on causal tuple rather than text alone, restore and replay emit only one current-state summary, timeout and validation surfaces batch correctly, and local acknowledgement, processing acceptance, blocker, recovery, and authoritative settlement remain semantically distinct.

## Finding 117 - Visualizations could still carry meaning that the table fallback and summary sentence did not prove

**Diagnosis.** The accessibility and patient-portal layers already required charts to have tables, but the architecture still lacked one parity truth proving that visual, summary, and tabular views shared the same row set, units, filter context, sort state, selection, and freshness posture. That left room for patient result trends, operations heat surfaces, and governance matrices to preserve extra meaning in color, hover, intensity, or layout even when the fallback table, summary sentence, or degraded-state posture no longer matched.

**Patch response.** Expanded `VisualizationFallbackContract`, added `VisualizationTableContract` plus `VisualizationParityProjection`, and threaded them through Phase 0, the platform frontend, patient record visualization, operations boards, governance matrices, and embedded NHS App surfaces. Chart, matrix, and heat-surface views now fail closed into `table_only`, `summary_only`, or placeholder posture whenever release, visibility, masking, trust, or freshness drift breaks parity, and the downgraded view becomes the authoritative meaning surface instead of the visual.

## Finding 118 - Token export and design-contract conformance could still drift outside the published runtime tuple

**Diagnosis.** The platform already named canonical token, state, automation, telemetry, and artifact contracts, but those layers still stopped short of one machine-readable publication bundle and one fail-closed lint verdict binding them together. That left room for route families to consume the right token graph while still shipping route-local px or hex overrides, bespoke marker aliases, stale telemetry names, or snapshot-only proof that never entered the release tuple.

**Patch response.** Added `DesignTokenExportArtifact`, `DesignContractVocabularyTuple`, `DesignContractPublicationBundle`, and `DesignContractLintVerdict`, then threaded them through the canonical UI kernel, platform frontend registry, Phase 0 runtime publication spine, release verification ladder, and summary-layer audit. Token export, state semantics, automation anchors, telemetry vocabulary, and artifact posture now publish as one contract bundle, structural snapshot evidence is part of the lint verdict, and runtime publication or writable posture fails closed whenever the bundle, digest, or lint result drifts.

## Finding 119 - Operations continuity incidents could still be diagnosed from generic symptoms and silently rebase to fresher proof

**Diagnosis.** The assurance layer already named `ExperienceContinuityControlEvidence`, `ContinuityControlHealthProjection`, and `InvestigationDrawerSession`, and the operations shell already exposed a continuity-evidence slice. But the handoff between them was still weak: board snapshots and return tokens preserved raw evidence refs without one stable continuity question, generic queue or delivery metrics could still dominate the operator's explanation path, and open investigation drawers could silently rebase to fresher continuity proof instead of showing delta against the preserved base. That left room for `InterventionWorkbench` to look calmer than the actual continuity proof basis when trust, settlement, or restore posture had already drifted.

**Patch response.** Hardened the continuity-proof diagnostic path across Phase 0, Phase 9, and the operations console. `ContinuityControlHealthProjection` now carries required trust rows, `continuitySetHash`, and supporting symptoms explicitly; `InvestigationDrawerSession` now binds the preserved continuity question, continuity set, trust basis, and base settlement chain; and `OpsBoardStateSnapshot`, `OpsReturnToken`, `OpsDrillContextAnchor`, and `OpsContinuityEvidenceSlice` now preserve the same continuity question and proof basis across drill-down, child-route pivots, and return. Operations diagnosis must now surface continuity proof as a first-class lens, render newer proof as diff against the preserved base, and downgrade intervention posture immediately when the continuity question or proof basis drifts.

## Finding 120 - Patient-facing degraded mode could still fragment across entry, section, recovery, embedded, and artifact shells

**Diagnosis.** The patient platform already named `ReleaseRecoveryDisposition`, `RouteFreezeDisposition`, `PatientActionRecoveryProjection`, `PatientIdentityHoldProjection`, `PatientEmbeddedSessionProjection`, `PatientSectionSurfaceState`, `PatientPortalEntryProjection`, `PatientExperienceContinuityEvidenceProjection`, `WritableEligibilityFence`, and `ArtifactFallbackDisposition`, but those contracts still composed degraded posture locally. That left room for one route to preserve the last safe summary while another fell to a generic error, for embedded or artifact routes to keep stale CTAs or browser handoffs visible after the writable fence had fallen, and for recovery, identity hold, section entry, and quiet-home copy to describe the same failure class in contradictory ways.

**Patch response.** Added `PatientDegradedModeProjection` in Phase 0 as the single patient-facing degraded-mode authority, then threaded it through patient portal entry and section posture, patient account recovery and identity-hold shells, and NHS App embedded and artifact fallback flows. Patient entry, section, repair, identity hold, embedded mismatch, and artifact fallback now normalize to one governed set of modes, preserve the same anchor and last safe summary, and withdraw stale writable or reassuring posture the moment continuity evidence, release or channel posture, binding lineage, or artifact viability drifts.
