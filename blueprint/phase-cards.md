# Vecells Delivery Phase Cards

## Programme Baseline Update (NHS App Deferred)

For current delivery planning, NHS App integration is a deferred channel-expansion phase rather than a hard gate. The working completion line is:

- Phases 0 to 6 complete
- Phase 8 complete
- Phase 9 complete
- cross-cutting blueprint set delivered:
  - `platform-frontend-blueprint.md`
  - `patient-portal-experience-architecture-blueprint.md`
  - `patient-account-and-communications-blueprint.md`
  - `staff-operations-and-support-blueprint.md`
  - `staff-workspace-interface-architecture.md`
  - `pharmacy-console-frontend-architecture.md`
  - `operations-console-frontend-blueprint.md`
  - `platform-admin-and-config-blueprint.md`
  - `governance-admin-console-frontend-blueprint.md`
  - `platform-runtime-and-release-blueprint.md`
  - `callback-and-clinician-messaging-loop.md`
  - `self-care-content-and-admin-resolution-blueprint.md`

These cross-cutting docs close the remaining end-to-end joining layer: unified web route contract, portal-level navigation and records visualization, shared IA rules, patient account model, staff start-of-day model, the detailed Clinical Workspace route and task-execution contract, the dedicated Pharmacy Console mission frame, the macro-operations control-room contract, callback or message lifecycle completeness, the governance/admin shell route and screen model, admin/support/comms/access governance, and the runtime plus release control plane needed for production hardening.

## Card 1: Phase 0 - The Foundation Protocol

**Goal**  
Build the stable core before any serious feature work. Create the canonical domain objects: `SubmissionEnvelope`, `Request`, `EvidenceSnapshot`, `Task`, `Communication`, and `AuditEvent`.

**Platform work**  
Map the core cleanly to the FHIR-native platform shape from the blueprint: transaction store, object store for files and audio, event bus, and immutable audit. Put every external dependency behind an adapter boundary:

- `IdentityAdapter`
- `GpSystemAdapter`
- `MessagingAdapter`
- `TelephonyAdapter`
- `NotificationAdapter`
- `ServiceDiscoveryAdapter`

Stand up the runtime and release control plane in the same phase: contract registry, migration runner, preview environments, signed build provenance, and canary or rollback harness.

**Parallel assurance tracks**  
Run the long-lead assurance work in parallel with engineering:

- DCB0129 safety case and hazard log
- DSPT readiness
- IM1 prerequisites and SCAL
- NHS login onboarding

**Front-end scope**  
Only build the frame in this phase:

- patient shell
- staff shell
- operations shell
- hub desk shell
- design system
- route guards
- feature-flag plumbing
- error states
- loading states
- accessibility harness

**Phase algorithm**

1. Define the canonical intake and request contracts with explicit `SubmissionEnvelope`, workflow, safety, and identity state axes.
2. Implement commands, immutable evidence snapshots, and immutable domain events.
3. Build outbox publishing and projection rebuild logic.
4. Create local simulators for NHS login, IM1, MESH, telephony, and notifications.
5. Mount shell UIs against seed data.
6. Prove a synthetic request can be created, replayed, and audited end to end.

**Tests that must pass**

- domain transition tests
- event-schema compatibility tests
- idempotency tests for create and update commands
- authz deny-by-default tests
- audit immutability tests
- projection rebuild tests
- schema migration dry-run tests
- SBOM and signed-artifact verification
- preview environment smoke tests
- non-production canary rollback rehearsal
- backup and restore rehearsal
- automated accessibility tests on all shells

**System after Phase 0**  
A thin but stable platform exists. Nothing is smart yet, but every later phase plugs into the same spine instead of rewriting it, and the delivery system can promote or reverse change safely.

## Card 2: Phase 1 - The Red Flag Gate

**Goal**  
Build the first real patient flow from the page 6 intake journey. Start with web only.

**Patient experience**

- request type selection
- structured detail capture
- optional photo and file upload
- contact preferences
- synchronous red-flag screening
- urgent diversion
- receipt and ETA

**Back-end scope**  
Expose `draft`, `submit`, `upload`, `status`, and `receipt` endpoints across the canonical `SubmissionEnvelope` and `Request` lifecycle. On submit:

- promote the envelope into the canonical request exactly once
- freeze an immutable submission snapshot
- normalise free text into the canonical request shape
- persist attachments into object storage plus `DocumentReference`
- run the rule-based safety gate
- either divert to urgent advice or open a triage task

Keep the red-flag engine rules-first in this phase, and keep drafts in `SubmissionEnvelope` rather than as `Request.workflowState = draft`.

**Front-end scope**  
Turn the patient shell into a real portal built as a low-noise intake frame:

- one-question-at-a-time mission frame rather than a dense wizard
- autosave surfaced through one quiet status strip
- file upload with bounded inline evidence states
- contact preference editor
- urgent diversion state in the same shell lineage
- receipt page
- minimal `track my request` page

**Phase algorithm**

1. Patient starts or resumes a draft on the canonical `SubmissionEnvelope`.
2. UI validates required fields and uploads files.
3. Server freezes a submission snapshot, promotes the envelope once, and normalises payload into canonical request input.
4. Safety rules run synchronously.
5. If red flag, log safety event, show urgent advice, and record the outcome on the same request lineage.
6. If not red flag, move the request to `triage_ready`, create one triage task, generate ETA, and send confirmation.
7. Do not expose patient `add more detail later` until the later re-safety loop exists.

**Tests that must pass**

- full decision-table coverage for red-flag rules
- malicious upload blocking
- duplicate-submit idempotency
- no-dual-write draft consistency tests
- end-to-end tests for symptoms, meds, admin, and results
- mobile responsive tests
- keyboard-only navigation
- performance tests on request submission bursts

**System after Phase 1**  
The system can safely accept digital requests and put them into one canonical queue.

## Card 3: Phase 2 - Identity and Echoes

**Goal**  
Wire in real patient authentication and the phone channel, while keeping web and telephony on the same request pipeline.

**Identity scope**

- NHS login callback handling
- token validation
- session creation
- session expiry
- logout
- identity linkage to the patient record and matching layer
- request-claim token revocation and grant rotation

**Telephony scope**

- IVR webhook ingestion
- caller verification flow
- audio storage
- transcript stub and audio-derived safety facts
- optional SMS continuation link
- seeded versus unseeded continuation modes
- reuse of the same request creation API used by the web flow

**Front-end scope**

- real sign-in flow
- signed-in request creation
- signed-out recovery states
- status tracker
- mobile SMS continuation flow for callers adding detail after the call

**Phase algorithm**

1. User signs in through NHS login callback.
2. Service validates claims, creates local session, links patient identity, and rotates superseded public access grants when a draft is claimed.
3. Caller enters IVR, selects request type, verifies identity, records issue, and may receive a seeded or unseeded SMS link depending on confidence.
4. Phone payload is normalised into the same request schema as web, but only after telephony evidence is safety-usable.
5. Safety gate runs on the full evidence set for both channels.
6. Request enters the same triage queue and status model.
7. If duplicate evidence is merged into an open request, rerun safety before routine flow continues.

**Tests that must pass**

- auth callback replay protection
- nonce and state validation
- logout and session expiry tests
- identity mismatch handling
- IVR webhook contract tests
- duplicate webhook idempotency
- audio storage integrity tests
- stale-public-token revocation tests
- parity tests proving web and phone produce the same request structure and safety outcome
- end-to-end flows from call to request to receipt

**System after Phase 2**  
The same system now supports real patient sign-in and phone capture without splitting the workflow model or leaking seeded data to the wrong patient.

## Card 4: Phase 3 - The Human Checkpoint

**Goal**  
Make the queue usable for staff and implement the practice-team flow from page 8.

**Back-end scope**

- assignment and unassignment
- status changes
- queue ranking
- duplicate detection
- merge logic
- clinician notes
- more-info requests
- escalation routing
- endpoint selection

Keep triage deterministic first:

- rule engine
- scoring bands
- endpoint recommendation
- structured summary generation

If ML is added later, run it in shadow mode first and do not let it write authoritative outcomes.

**Front-end scope**

- queue list
- request detail panel
- summary card
- attachment viewer
- patient response thread
- more-info composer
- endpoint actions
- escalation control
- approval modal for sign, confirm, and code actions

**Phase algorithm**

1. Rank queue by priority, age, SLA, and escalation flags.
2. Staff member opens a request and reviews summary and full context.
3. If information is missing, send a structured question set and pause the task.
4. When the patient replies, capture a new evidence snapshot and rerun safety.
5. If re-safety raises urgent risk, escalate immediately instead of dropping the case back into routine review.
6. When enough information exists, select endpoint: admin, self-care, message or callback, pharmacy, or booking handoff.
7. If action is clinically irreversible, require an explicit approval step and audit it.
8. Close the task or hand it off downstream.

**Tests that must pass**

- queue ordering determinism
- concurrent assignment tests
- merge correctness
- audit completeness on overrides and approvals
- re-safety-to-urgent-escalation tests
- end-to-end paths for admin resolution, self-care resolution, callback resolution, and urgent escalation
- staff accessibility tests

**System after Phase 3**  
The intake system becomes a working practice workflow system instead of just a form receiver.

## Card 5: Phase 4 - The Booking Engine

**Goal**  
Make booking real only after triage is stable. This phase implements local slot search, patient choice, confirmation, reminders, cancel, reschedule, and waitlist entry.

**Integration approach**  
Use an IM1-first adapter design with a provider capability matrix keyed by supplier and tenant. Build around IM1 capability rather than GP Connect assumptions.

**Back-end scope**

- `SlotSearch`
- `Book`
- `Cancel`
- `Reschedule`
- `WaitlistJoin`

Additional requirements:

- attach version and timestamp metadata to slot lists
- distinguish self-service, staff-assistable, and currently non-bookable supply
- revalidate at confirm time to avoid stale booking
- create no appointment record until booking is definitively confirmed
- add compensation flows for partial failure
- issue only one active waitlist offer per released slot unless true independent capacity exists

**Front-end scope**

- patient slot picker
- confirmation page
- cancellation screens
- reschedule screens
- reminder preferences
- staff booking handoff panel

**Phase algorithm**

1. Triage outputs `appointment required`.
2. System checks the provider capability matrix for the tenant.
3. System fetches candidate slots and keeps both self-service and staff-assistable supply visible to the right audience.
4. User selects a slot and the system revalidates it.
5. System sends booking command and waits for definitive confirmation or explicit pending state.
6. Only on definitive confirmation does the system create the appointment record and send final confirmation.
7. If confirmation is ambiguous, move to reconciliation instead of retrying blindly.
8. If revalidation fails or no slots exist, offer waitlist or escalate to hub flow.

**Tests that must pass**

- provider capability matrix tests
- slot normalisation across suppliers
- stale-slot revalidation tests
- patient-versus-staff slot visibility tests
- no-appointment-record-before-confirmation tests
- waitlist race tests
- appointment lifecycle tests for cancel and reschedule
- reminder delivery tests
- load tests on slot-search bursts

**System after Phase 4**  
The same request pipeline can now resolve directly to local appointments and patient self-service management without hiding staff-assisted supply or minting phantom bookings.

## Card 6: Phase 5 - The Network Horizon

**Goal**  
Extend the booking system so local booking stays first choice and hub coordination becomes the fallback when local capacity is unavailable or network booking is needed.

**Back-end scope**

- separate `NetworkBookingRequest` from `HubAppointmentRecord`
- create hub queue projections
- rank alternative slots across sites
- add SLA timers
- add `offer alternative`, `callback`, and `urgent escalate back` branches
- notify patient and practice on each state change
- use explicit ownership, external-confirmation, and practice-acknowledgement fields so practice and hub actions are never ambiguous

**Front-end scope**

- dedicated coordination console
- timeframe filters
- need summaries
- rank-ordered option cards
- escalation banner
- patient comms panel
- clear confirmation-pending and closure actions

**Phase algorithm**

1. Local booking fails or is bypassed by a routing rule.
2. System creates `NetworkBookingRequest` with priority, timeframe, and constraints.
3. Hub console ranks options across network sites.
4. If a suitable slot exists, coordinator starts hub booking and records evidence.
5. Manual hub entry moves the case to `confirmation_pending`; it does not create a booked state by itself.
6. Only after independent confirmation does the system mark the appointment booked and notify patient and practice accordingly.
7. The case remains open until the origin practice has acknowledged visibility or an audited policy exception applies.
8. If no suitable slot exists but alternatives are acceptable, present the next-best option.
9. If the case is too urgent, bounce back to the duty clinician path immediately.

**Tests that must pass**

- cross-site access control tests
- timer escalation tests
- no-orphan-booking-request tests
- ranking correctness tests
- no-booked-state-before-independent-confirmation tests
- no-close-before-practice-ack tests
- audit trail tests across practice and hub ownership changes
- end-to-end flows for local-fail to hub-confirm, local-fail to alternative, and local-fail to urgent bounce-back

**System after Phase 5**  
The booking system becomes network-capable without losing the local-first behaviour or leaving the origin practice blind.

## Card 7: Phase 6 - The Pharmacy Loop

**Goal**  
Add Pharmacy First as a real closed-loop workflow: eligibility, routing, dispatch, outcome handling, and bounce-back reopening.

**Back-end scope**

- age and sex eligibility rules
- exclusion rules
- red flags
- pathway mapping
- pharmacy discovery
- referral pack generation
- dispatch adapter
- outcome ingest
- bounce-back reopen logic

Service discovery should rank on:

- opening state
- service suitability
- geography
- organisational validity

Keep dispatch idempotent because endpoints and message routes can retry. Keep full provider choice visible unless a provider is truly invalid for the referral.

**Front-end scope**

- patient pharmacy choice
- instructions view
- referral status tracker
- outcome and next-step messages
- staff bounce-back queue
- reopened-case banner

**Phase algorithm**

1. Triage outputs `Pharmacy First candidate`.
2. Eligibility engine checks pathway, age and sex, exclusions, and red flags.
3. Red flags or global exclusions return immediately to non-pharmacy endpointing.
4. Only pathway-specific non-red-flag failures may fall back to minor illness, and only when policy explicitly allows it.
5. If eligible, discover valid pharmacies, rank them, and still preserve full patient choice.
6. Patient selects a pharmacy.
7. System generates the referral pack and dispatches it through the agreed messaging path.
8. Await outcome. High-confidence resolved outcomes may close the case; no-contact, urgent, onward-referral, or low-confidence outcomes reopen or queue review instead of auto-closing.

**Tests that must pass**

- full decision-table tests for all pathway rules
- no-unsafe-downgrade tests
- dispatch idempotency tests
- service discovery contract tests
- full-choice exposure tests
- outcome reconciliation tests
- no-auto-close-on-no-contact tests
- reopen and bounce-back tests
- end-to-end flows for eligible referral, ineligible fallback, and failed dispatch recovery

**System after Phase 6**  
The triage system now resolves a real subset of cases through pharmacy without forcing every case into GP appointment demand or silently burying unresolved pharmacy returns.

## Cross-cutting work package: End-to-end joining layer

**Goal**  
Close the product-level gaps that sit across phases without rewriting core domain phases.

**Scope**

- freeze one web route and shell contract for patient, workspace, hub, and ops surfaces
- define one unified patient account and communication timeline model
- define one unified staff inbox and start-of-day model
- define full callback and clinician-message lifecycle contracts
- define governed self-care content and admin-resolution lifecycle contracts
- define platform admin/config/comms/access governance surfaces
- define support-desk action model for safe recovery workflows

**Exit state**  
Phase outputs behave as one coherent product system instead of a set of adjacent workflows.

## Card 8: Phase 7 - Inside the NHS App (Deferred channel expansion)

**Goal**  
Integrate the existing web portal into the NHS App after the core web platform and cross-cutting joining layer are complete.

**Back-end scope**

- deep-link entry points
- journey context handling
- embedded layout flags
- session continuity
- environment config for sandpit and AOS
- telemetry for NHS App entry journeys

**Front-end scope**

- headerless embedded mode
- responsive breakpoints
- focus management
- error recovery when handoff state is missing
- clean back-navigation
- link behaviour that works inside embedded web
- polished mobile-first patient flows

**Phase algorithm**

1. NHS App launches the Vecells web journey.
2. Service validates handoff context and establishes or recovers session.
3. UI opens to the intended request, status, or booking path in embedded mode.
4. User completes the journey without duplicate headers, duplicate footers, or broken navigation.
5. Telemetry records the path for limited-release assurance.
6. NHS App and standard web continue to use the same backend contracts.

**Tests that must pass**

- Responsive viewport matrix
- Embedded-mode regression tests
- WCAG 2.2 AA audit
- Sandpit demo sign-off
- AOS demo sign-off
- Limited-release telemetry verification
- Incident rehearsal
- Full regression on all patient journeys

**System after Phase 7**  
The same patient portal now works as a standalone web product and as an NHS App-integrated channel.

---

## Card 9: Phase 8 - The Assistive Layer

**Goal**  
Add assistive AI to staff workflow while keeping the human approval boundary absolute.

**Back-end scope**

- transcription pipeline
- summarisation
- endpoint suggestion
- note draft generation
- prompt and model version store
- evaluation store
- feature store integration
- human override capture
- replayable inference logs
- replay-critical evidence policy

Start in shadow mode. Expose suggestions only to staff. Never let AI directly commit final clinical actions or final coded outcomes.

**Front-end scope**

- suggestion side panel
- diffable note draft
- approve controls
- reject controls
- explicit `edited by clinician` trail
- confidence and rationale display
- override-reason capture

**Phase algorithm**

1. Collect request context, history, attachments, and current queue state.
2. Run assistive models in shadow mode first.
3. Compare model outputs against human decisions and build an evaluation set.
4. When stable, expose summary, endpoint suggestion, and note draft to staff.
5. Clinician edits, approves, or rejects.
6. Persist the final human decision plus immutable model, prompt, input, and output evidence for audit and replay.

**Tests that must pass**

- offline evaluation thresholds on curated datasets
- regression tests on all red-flag cases
- hallucination and unsafe recommendation review
- prompt snapshot replay tests
- no-autonomous-write tests
- fairness and drift dashboards
- human-approval audit tests
- replay-linkage tests for all visible assistive artifacts

**System after Phase 8**  
The same staff workflow becomes faster and better documented, but still remains human-led and replayable.

## Card 10: Phase 9 - The Assurance Ledger

**Goal**  
Make the system operationally strong with live dashboards, assurance pack generation, WORM audit, and policy controls such as break-glass.

**Back-end scope**

- stream domain events into operational projections
- build breach detection
- build queue health views
- track waitlist conversion
- track pharmacy bounce-back stats
- track notification delivery stats
- add break-glass audit queries
- generate monthly assurance packs
- add backup and restore automation
- add projection rebuild tools
- add chaos hooks
- add retention jobs with immutability and dependency checks
- validate tenant-level config

**Front-end scope**

- operations console
- audit search
- breach views
- queue heat maps
- assurance export screen
- incident runbook links for support staff

**Phase algorithm**

1. Consume domain events into live projections.
2. Compute operational KPIs and breach risk continuously.
3. Surface dashboards and alert conditions.
4. Generate assurance packs from the same event history, not from a separate spreadsheet process.
5. Enforce retention policy while excluding WORM and replay-critical evidence from ordinary delete jobs.
6. Rehearse failure, rebuild, and restore scenarios.
7. Lock final production runbooks and alert routes.

**Tests that must pass**

- load tests
- soak tests
- chaos and failover tests
- projection rebuild from raw events
- backup restore into a clean environment
- penetration testing
- authz matrix tests
- audit tamper tests
- WORM exclusion tests
- replay-critical dependency protection tests
- alert-fire drills
- full end-to-end regression across all patient and staff flows

**System after Phase 9**  
The platform is operationally strong without deleting the very evidence it needs for audit, replay, and assurance.
