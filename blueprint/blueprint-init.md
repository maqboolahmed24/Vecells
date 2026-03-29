## Core end-to-end product blueprint for Vecells

Vecells should be built as a **FHIR-native primary care access and operations layer**, not as a thin appointment-booking front end. The core product normalises demand from **web, NHS App jump-off, and phone** into one safety-gated request pipeline, then routes each case to the right endpoint: self-care/info, admin resolution, clinician message or callback, local booking, PCN hub booking, or Pharmacy First, while keeping patients updated and staff working from a single operational view. That is the through-line of the layered architecture on pages 1 to 4 and the journey diagrams on pages 6 to 8 of your PDF.

That direction still fits the current NHS integration landscape. NHS England says **GP Connect Appointment Management new supplier development is paused**; **IM1 Pairing** remains the live route for integrating with principal GP systems and currently covers **EMIS Web and TPP SystmOne**, with **no current plans to decommission IM1**; **GP Connect Update Record** is limited to registered community pharmacy professionals using assured supplier and GP-system combinations; **NHS login** remains the patient authentication rail; and **MESH** remains a supported secure messaging rail for cross-organisation workflows. ([NHS England Digital][1])

### 1. Product definition

Vecells is best understood as a **demand orchestration system for primary care**. It is the front door for patients, the control tower for staff, and the coordination layer between practices, PCN hubs, pharmacies, and patient comms. The key architectural shift in your paper is the right one: **stop designing the product around federated booking through GP Connect**, and instead make the product rely on **IM1-first local automation** plus **coordination-first network booking** for Enhanced Access and cross-site workflows.

So the product should not think in terms of "appointments first." It should think in terms of **requests first**. A patient submits a need; Vecells creates a single canonical request item; safety logic runs; triage produces a structured outcome; workflow logic chooses the right endpoint; and only some cases become appointments. That is exactly what the page 6 to 8 flows show: intake first, endpoint decision second, booking only when clinically or operationally necessary.

### 2. Core product surfaces

The **patient surface** is a single access experience with three equivalent entry points: a Vecells web portal, an NHS App jump-off experience, and telephony/IVR. "Telephony parity" is important here: the phone journey must not create a separate back-office workflow. The intake on page 6 makes clear that phone requests should be captured into the **same request model and same triage pipeline** as digital requests, including the same safety screen, ETA, and status handling. The web/NHS App flow should allow request type selection, structured details, optional file/photo upload, and contact preference capture; the phone flow should support patient identification, issue capture, optional SMS follow-up, and the same downstream status model.

For the NHS App surface, the product should be treated as a **responsive web integration**, not as a separate native app. NHS England's current guidance says NHS App web integrations surface a responsive website inside the NHS App, must follow the NHS digital service manual, and may require UI changes to meet NHS accessibility and style guidance. ([NHS England Digital][2])

The **staff surface** should be split into three focused applications, as your PDF suggests. The **Clinical Workspace** is for request review, safety review, triage, clinical messaging, and documentation. The **Operations Console** is for queue health, demand/capacity, SLA risk, waitlists, and equity controls. The **PCN Hub Desk Console** is for Enhanced Access coordination, ranked slot options, patient comms, and hub-to-practice task closure. These are not cosmetic UI splits; they reflect three distinct jobs to be done and should map cleanly to different read models, permissions, and action sets.

To prevent phase-by-phase UI drift, add a cross-cutting contract layer now: `platform-frontend-blueprint.md`, `patient-portal-experience-architecture-blueprint.md`, `patient-account-and-communications-blueprint.md`, `staff-operations-and-support-blueprint.md`, `staff-workspace-interface-architecture.md`, `pharmacy-console-frontend-architecture.md`, `operations-console-frontend-blueprint.md`, `platform-admin-and-config-blueprint.md`, `governance-admin-console-frontend-blueprint.md`, `platform-runtime-and-release-blueprint.md`, `callback-and-clinician-messaging-loop.md`, and `self-care-content-and-admin-resolution-blueprint.md`. These documents should lock route ownership, portal-level navigation and records visualization, shared IA rules, unified patient and staff entry models, the detailed Clinical Workspace route and task-execution contract, the dedicated Pharmacy Console mission frame, the macro-operations control-room contract, callback/message lifecycles, the governance/admin shell contract, admin/config governance, and the production runtime plus release control plane across phases.

### 3. The canonical request model

The heart of the system should be a **single canonical request object**. Every governed submitted interaction, regardless of channel, becomes one request with a stable ID and a complete audit trail. Pre-submit capture should live in a `SubmissionEnvelope`, which holds draft evidence, continuation state, and partial identity context until governed promotion occurs. At minimum the canonical request should carry patient identity status, source channel, request type, symptom or admin narrative, attachments or audio, contact preference, safety flags, triage result, priority band, assigned queue, chosen endpoint, SLA clocks, outbound communications, and closure state. The page 6 diagram is explicit that both digital and telephony paths collapse into one governed request item before triage.

I would model that request as an internal domain object that is **represented clinically through FHIR resources**, not forced into one FHIR resource only. The cleanest pattern is: **Task** for the operational work item, **ServiceRequest** when there is an external or clinical service destination, **DocumentReference** for files, audio, and transcripts, **Consent** for access and sharing controls, **Communication** for structured messaging, and **AuditEvent/Provenance** for traceability. Your PDF already anchors Task, ServiceRequest, DocumentReference, and Consent as the core pattern, and that is the right spine to keep.

<!-- Architectural correction: drafts live on `SubmissionEnvelope`, not on `Request`, so web, phone, continuation links, and wrong-patient repair all share one pre-request staging model. -->
Do not overload one status field with identity, workflow, and safety. The platform should carry four explicit state axes across intake and request lifecycle:

- `submissionEnvelopeState`: `draft -> evidence_pending -> ready_to_promote -> promoted | abandoned | expired`
- `workflowState`: `submitted -> intake_normalized -> triage_ready -> triage_active -> handoff_active -> outcome_recorded -> closed`
- `safetyState`: `not_screened -> screen_clear | residual_risk_flagged | urgent_diversion_required -> urgent_diverted`
- `identityState`: `anonymous | partial_match | matched | claimed`

`submitted` is a real durable post-submit state and must be entered at the moment governed promotion from `SubmissionEnvelope` to `Request` succeeds. It is the anchor for replay, crash recovery, dedupe, and SLA timing. `intake_normalized` is also a real durable state and must only be entered after the immutable submission snapshot has been frozen and canonical normalization has succeeded. `triage_ready` is only legal once a real triage task exists.

`triage_active` is the coarse canonical state for any live practice-side review on the same request lineage. Detailed operational states such as queued, claimed, in review, awaiting patient info, resumed review, escalated, reopened, and approval handling live on `TriageTask`, not on `Request` itself.

`residual_risk_flagged` means the request did not meet hard-stop urgent-diversion criteria, but one or more persisted residual-safety rules still apply and must influence queue priority and review behaviour. `urgent_diversion_required` means the safety engine has already determined that urgent handling is required, but the urgent advice, escalation, or callback action has not yet been durably issued. Once that action is durably issued, the safety axis must move to `urgent_diverted`.

Booking, hub, and pharmacy work should then live in dedicated downstream aggregates that reference the same request rather than forcing the request itself into every operational substate. The canonical `Request` should carry milestone states such as active triage, active handoff, definitive outcome, and final closure, while detailed downstream lifecycles stay on `BookingCase`, `HubCoordinationCase`, and `PharmacyCase`.

### 4. The end-to-end patient journey

The patient journey in the PDF is already strong and should become the canonical runtime behaviour. A patient arrives from web, NHS App, or phone, authenticates or is identified, submits a request, passes through a **red-flag safeguard gate**, and immediately receives a receipt with status/ETA if the case is not diverted to urgent care advice. The page 6 flow should be implemented almost literally because it captures the right first principles: **same pipeline, explicit safety gate, explicit urgent-diversion path, explicit acknowledgement**.

After triage, the page 7 outcome model shows the correct product shape: a case can resolve into admin completion, self-care plus safety-netting, clinician message/callback, Pharmacy First referral, or appointment flow. The key product insight is that **appointment is one endpoint, not the default**. Patients should also be able to **cancel, reschedule, or update details at any time**, because page 7 treats these as persistent capabilities rather than exceptional admin work. That means these actions should exist as first-class patient self-service operations across web, NHS App jump-off, and messaging links.

### 5. Clinical workspace and operational workflow

The page 8 staff flow is the right operating model for practices. Staff open a work queue, review the triage summary and AI suggestions, ask for more information if needed, choose the endpoint, and either resolve directly, escalate for risk, route to Pharmacy First, or hand off to booking. The most important part of that flow is the **human checkpoint before irreversible clinical action**. The system can suggest, summarise, rank, and prepare documentation, but signing, confirming, coding, or clinically irreversible action must remain human-approved.

That operating model should be backed by a prioritisation engine that combines **clinical priority, time-to-breach, queue aging, vulnerability/equity markers, continuity preferences, and practice-configured routing rules**. Your PDF mentions duplicate suppression, merge logic, fairness floors, and queue controls; those should be implemented as core platform behaviour, not as dashboard analytics. In other words, Vecells does not merely show the queue; it actively **shapes the queue**.

The **Operations Console** should therefore be powered by denormalised read models built from the event stream: live queue state, upcoming SLA breaches, volume by pathway, waitlist conversion, pharmacy bounce-backs, unresolved high-risk items, and access inequity signals by channel and cohort. That is exactly consistent with the "analytics and assurance" plus "operations console" definition in the PDF.

### 6. Booking and access continuity

Booking should be implemented as **two coordinated capabilities**. First is the **Local Booking Orchestrator**, which uses IM1 where supplier and permission scope allow creation, update, and synchronisation of booking artefacts inside GP systems. Second is the **Network Coordination Desk**, which handles cases that need cross-site or hub coordination with structured tasks, ranked options, timers, and patient updates. That split is already described in your architecture and the page 7/8 flows show how it should behave in practice.

Official IM1 guidance supports this direction. IM1 standards are active, currently pair to EMIS Web and TPP SystmOne, and the patient-facing/API capabilities include appointment view, booking, amend/cancel, repeat medication, patient communications, record access, and transaction-level filing of data and documents, subject to pairing and supplier permissions. Because supplier functionality varies and detailed interface packs arrive after feasibility/pairing, Vecells should hide every GP-system interaction behind a **supplier capability matrix and adapter interface**, not hard-code business logic to one vendor's API behaviour. ([NHS England Digital][3])

For Enhanced Access, the page 8 hub desk flow should become a dedicated coordination workflow: open request, evaluate window and needs, book in the hub's native system if suitable, otherwise offer alternatives or escalate back to the duty clinician if urgency outruns capacity. NHS England's published Enhanced Access expectation remains weekday **6:30pm to 8pm** and Saturday **9am to 5pm**, so those windows should be treated as policy-configurable defaults inside the hub coordination rules. ([NHS England][4])

The **Smart Waitlist** should be a real transactional subsystem, not a nice-to-have add-on. It should support opt-in state, ranked candidate generation, offer expiry, confirmation windows, anti-duplicate rules, and local or hub-level auto-fill. In product terms, booking becomes a controlled workflow of **offer, provisional hold, confirm, commit, notify**, with a fallback to hub desk or callback when commitment fails.

### 7. Pharmacy First pathway

The Pharmacy First part of Vecells should work as a **structured referral and closure loop**, not as direct GP record mutation by Vecells. Your PDF is correct that the product should enforce pathway eligibility, red-flag checks, and age/sex gating, create a referral pack for the patient and pharmacy, dispatch it through an approved operational route, and then capture the outcome back into GP workflow without trying to impersonate a community pharmacy system.

That remains aligned with the current NHS position. NHS England still describes Pharmacy First as including the **7 clinical pathways**, and GP Connect Update Record is still only for registered community pharmacy professionals using assured pharmacy and GP-system combinations. Update Record is for structured consultation summaries; it is **not** for urgent actions or referrals back to general practice, which must still use local processes such as NHSmail or telephone. So Vecells' core design should be: **eligibility engine + referral composer + pharmacy discovery + dispatch + outcome reconciliation**, not direct Update Record submission. ([NHS England][5])

For service discovery, I would now make **Directory of Healthcare Services (Service Search)** the main lookup rail for pharmacy and service routing, because NHS England describes it as the **strategic API** for service lookup and is guiding legacy dispenser lookup use cases toward it. In other words, the product's core should not depend on older, fragmented dispenser-search patterns when the strategic direction is already clearer. ([NHS England Digital][6])

Operationally, the Pharmacy First module should support patient choice, nearest-suitable ranking, opening-hours checks, referral expiry, pharmacy bounce-back handling, and outcome ingestion. A bounce-back should reopen the original case with increased visibility in the clinical queue, exactly as the page 8 staff flow suggests.

### 8. Data and platform architecture

The platform layer in your PDF is strong and should remain intact: **FHIR Transaction Store** as the authoritative system of record, **Event Bus** for orchestration, **Object Store** for binary artefacts, **Feature Store** for longitudinal model features, and a **WORM Audit Ledger** for tamper-evident audit. That combination gives you one place for clinical truth, one place for async process coordination, one place for large artefacts, one place for machine features, and one place for immutable traceability.

In development terms, the cleanest implementation is a **CQRS-style architecture**. The write side commits clinical and operational changes into the FHIR-centric transaction model and publishes domain events through an outbox. The read side builds fast projections for the patient status tracker, staff queues, hub desk board, waitlist engine, and analytics dashboards. That lets the GP-system integration layer stay slow and variable while the product UX remains responsive.

The event taxonomy must be one explicit cross-phase contract, not a phase-local convention. Adopt these namespaces as canonical across the whole blueprint: `request.*`, `intake.*`, `identity.*`, `telephony.*`, `safety.*`, `triage.*`, `booking.*`, `hub.*`, `pharmacy.*`, `patient.*`, `communication.*`, `assistive.*`, `analytics.*`, and `audit.*`.

Use them consistently. For example: `request.created`, `request.submitted`, `request.workflow.changed`, `intake.draft.created`, `intake.normalized`, `safety.screened`, `safety.urgent_diversion.required`, `safety.urgent_diversion.completed`, `triage.task.created`, `booking.commit.confirmed`, `hub.offer.created`, `pharmacy.outcome.received`, `patient.receipt.issued`, `communication.queued`, and `audit.break_glass.used`.

Do not let `ingest.*` or `tasks.*` survive as parallel canonical namespaces. If a legacy producer or adapter still emits those names, map them into the canonical namespace set before the events reach projections, analytics, or assurance.

### 9. AI and automation

The AI layer in Vecells should be **assistive, bounded, and auditable**. Its job is to perform intent classification, acuity scoring, red-flag extraction, complexity scoring, summarisation, suggested endpointing, transcript drafting, and documentation prefill. Its output should always resolve into a structured operational artefact: priority band, risk markers, proposed queue, and a drafted **Task/ServiceRequest** combination ready for human review. That is directly aligned with the "clinical intelligence" and "documentation automation" services in the paper.

Two control rules should be non-negotiable. First, **no irreversible clinical action without human approval**; that is exactly what page 8 encodes. Second, every model output must be **versioned, attributable, replayable, and overrideable**. Store the model version, prompt/template version where relevant, input snapshot, output, confidence bands, and the human decision that accepted, amended, or rejected it.

Current NHS guidance around IM1 is relevant here. NHS England says the IM1 onboarding process will review whole-product documentation for AI-containing products, including the **DCB0129 clinical safety case, hazard log, DPIA, and related documentation**, but also says IM1 pairing does **not** provide AI-specific technical assurance of the models or algorithms themselves. So Vecells must carry its own model governance: offline evaluation, thresholding, shadow mode where needed, drift monitoring, clinician feedback capture, rollback, and clear fallback-to-manual behaviour. ([NHS England Digital][7])

### 10. Identity, consent, security, and policy

For patients, the identity rail should be **NHS login**. But the architecture has to respect what NHS login is and is not. NHS England states that NHS login allows patients to access services and handle identity verification, but it **does not provide clinical authorisation**, and **session management/logout remain partner responsibilities**. So patient authentication, application session management, consent capture, contact preference management, and feature authorisation must remain explicit Vecells responsibilities. ([NHS England Digital][8])

For staff, use organisation-controlled SSO and enforce **RBAC plus ABAC** inside Vecells. The key policy controls from your PDF should remain central: **purpose-of-use checks, FHIR Consent enforcement, break-glass access, and immutable audit capture**. Break-glass should require a reason code, force heightened audit visibility, and be included automatically in assurance packs and governance review workflows.

If the patient experience is surfaced inside the NHS App, build the web portal to **NHS service standard and WCAG 2.2 AA** from day one. NHS England's current guidance makes those requirements explicit for NHS App integrations. That means accessibility, content design, error handling, and assisted-digital behaviour are not polishing tasks; they are core product architecture. ([NHS England Digital][2])

### 11. Analytics and assurance

The analytics layer should do two jobs simultaneously. First, it should run the service in real time: live volumes, queue health, demand by request type, triage distribution, booking outcomes, hub utilisation, waitlist fill, pharmacy referral outcomes, red-flag incidents, and patient comms status. Second, it should produce **assurance artefacts**: monthly packs for safety, access, equity, and operational performance, which your PDF explicitly calls out.

The most useful product stance is to treat analytics as an **operational subsystem**, not a BI afterthought. Queue routing, waitlist filling, fairness floors, and capacity shaping all need current state plus event history. So the analytics service should own both real-time projections and scheduled assurance outputs, with drill-down links back to the underlying request and audit evidence.

### 12. Practical engineering shape

A practical engineering shape for Vecells is a **modular platform with clear bounded contexts**, not a pile of tightly coupled microservices and not a single unstructured monolith. Keep the logical domains separate even if some are deployed together: intake/safety, triage intelligence, workflow/prioritisation, booking, pharmacy, documentation, patient comms, analytics, and audit. The GP-system adapters, MESH adapter, telephony adapter, and messaging adapter should be isolated behind stable internal contracts because those are the parts most exposed to variability and external change. That fits both the paper's layered model and the current reality that IM1 details vary by supplier and pairing pack. ([NHS England Digital][9])

Infrastructure-wise, the product should run on **UK-hosted cloud infrastructure**, keep binary artefacts in object storage, keep transactional clinical data in a FHIR-capable relational store, use an event bus plus outbox for reliable publishing, use a workflow/timer engine for long-running waits and escalations, and maintain an append-only audit store that cannot be silently rewritten. For developer documentation and conformance assets, do not anchor internal runbooks to the old `developer.nhs.uk` and legacy FHIR servers; NHS England decommissioned those on **2 March 2026** and points teams to maintained content on Digital pages, GitHub Pages, and Simplifier-hosted conformance assets. ([NHS England Digital][10])

A critical missing piece is the production runtime and release contract. The lifecycle, safety, and workflow logic are already unusually mature, but the blueprint still needs one cross-cutting source of truth for trust-zone topology, browser-to-gateway boundaries, environment rings, zero-downtime schema change rules, artifact provenance, and canary or rollback evidence. Without that, a correct domain model can still ship as an operationally brittle system. Add `platform-runtime-and-release-blueprint.md` as a first-class delivery artifact rather than treating deployment and release engineering as leftover DevOps detail.

### 13. The finished core product, in one line

When this core blueprint is implemented correctly, Vecells becomes **one access layer where every patient request enters once, is safety-screened once, becomes one canonical work object, is resolved through the correct endpoint, is reflected back into practice workflows through approved NHS rails, and is fully auditable end to end**. That is exactly what your layered architecture plus the page 6, 7, and 8 flows are pointing toward.

### 14. Programme Baseline With NHS App Deferred

NHS App integration can be deferred as a channel-expansion phase without breaking the current end-to-end plan. The near-term completion line should be: Phases 0 through 6 complete, Phases 8 and 9 complete, and the twelve cross-cutting front-end, lifecycle, and runtime blueprints above implemented as first-class programme deliverables. In that baseline, callback/message loops and self-care/admin-resolution loops must be treated as explicit domains, not thin endpoint labels.

[1]: https://digital.nhs.uk/services/gp-connect?utm_source=chatgpt.com "GP Connect"
[2]: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration "NHS App web integration - NHS England Digital"
[3]: https://digital.nhs.uk/developer/api-catalogue/interface-mechanism-1-standards "Interface Mechanism 1 API standards - NHS England Digital"
[4]: https://www.england.nhs.uk/gp/investment/gp-contract/network-contract-directed-enhanced-service-des/enhanced-access-faqs/?utm_source=chatgpt.com "Enhanced Access to General Practice services through the ..."
[5]: https://www.england.nhs.uk/primary-care/pharmacy/pharmacy-services/pharmacy-first/ "https://www.england.nhs.uk/primary-care/pharmacy/pharmacy-services/pharmacy-first/"
[6]: https://digital.nhs.uk/developer/api-catalogue/electronic-transmission-of-prescriptions-web-services-soap/migrating-from-the-etp-web-services-soap-api-to-the-service-search-api "Migrating from the ETP Web Services SOAP API to the Directory of Healthcare Services (Service Search) API - NHS England Digital"
[7]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration "IM1 Pairing integration - NHS England Digital"
[8]: https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integration-toolkit/how-nhs-login-works "How NHS login works - NHS England Digital"
[9]: https://digital.nhs.uk/services/digital-services-for-integrated-care/im1-pairing-integration/interface-mechanisms-guidance?utm_source=chatgpt.com "Interface mechanisms guidance"
[10]: https://digital.nhs.uk/developer/decommissioning-developer.nhs.uk-and-fhir-servers?utm_source=chatgpt.com "Decommissioning developer.nhs.uk and FHIR servers"
