# Phase 9 - The Assurance Ledger

**Working scope**  
Operations console, assurance, resilience, and production hardening.

This is the phase where the Vecells platform stops being feature-complete and becomes operationally provable. The architecture already reserves the right primitives for this: an Operations Console, a WORM Audit Ledger, event domains that include `analytics.*` and `audit.*`, and an explicit Analytics and Assurance domain that produces live dashboards and monthly assurance packs. It also already treats break-glass and immutable audit as first-class controls, not admin afterthoughts.

Current NHS assurance expectations make this phase a core product phase, not a post-build tidy-up. The DSPT is the self-assessment tool that all organisations with access to NHS patient data and systems must use. DTAC still spans 5 areas: clinical safety, data protection, technical security, interoperability, and usability or accessibility. DCB0129 and DCB0160 remain mandatory. The newer CAF-aligned DSPT raises the bar on response-and-recovery testing and on understanding the systems and dependencies required to restore essential functions. The Records Management Code of Practice remains the retention framework and the HTML version is now explicitly the most up-to-date version. ([NHS England Digital][1])

There is also a practical platform-hygiene implication now. NHS England states that `developer.nhs.uk` and the old FHIR servers were decommissioned on 2 March 2026, and that essential content has been migrated or archived. So the final hardening phase should actively remove legacy documentation links, stale implementation references, and unsupported dependency assumptions from the product, runbooks, and support materials. ([NHS England Digital][2])

## Phase 9 objective

By the end of this phase, Vecells must be able to do all of the following as a normal part of running the service:

- derive live operational state from the same event history that runs the product
- expose queue health, breach risk, delivery health, access equity, and dependency health in one operations surface
- make every sensitive action searchable and reviewable through immutable audit
- generate monthly and on-demand assurance packs from evidence, not spreadsheets
- prove restore, failover, and incident-response capability through repeated rehearsal
- manage retention, deletion, and legal hold through policy-driven lifecycle controls
- run incident, breach, and near-miss workflows with reportability assessment and traceable follow-up
- version tenant configuration, policy packs, standards mappings, and evidence schemas so the whole platform remains governable over time

## Overall Phase 9 algorithm

1. Turn the event spine into an assurance spine.
2. Build operational projections and service-level health views from domain events.
3. Build a first-class audit and break-glass review system on top of the WORM ledger.
4. Map evidence continuously to DSPT, DTAC, DCB0129, DCB0160, and local operating controls.
5. Attach retention, deletion, archive, and legal-hold policy to every durable artifact type.
6. Define essential functions, dependencies, and recovery tiers, then rehearse restore and failover.
7. Operationalise incident handling, reportability assessment, post-incident review, and staff exercises.
8. Lock tenant config, policy versioning, dependency hygiene, and standards change control.
9. Transfer the whole platform into repeatable BAU with evidence-producing operations.

## What Phase 9 must prove before the core blueprint is considered complete

Before the core product can be considered production-complete, all of this needs to be true:

- one evidence spine exists across patient, staff, booking, hub, pharmacy, and assistive workflows
- operational dashboards and assurance packs are built from the same underlying truth
- break-glass, override, and config-change events are queryable and reviewable
- backup existence is not assumed; restore is repeatedly proven
- incidents, near misses, and reportable breaches can be handled inside a controlled workflow
- retention and deletion are policy-driven and auditable
- tenant-level variance does not create hidden config drift
- standards updates, supplier changes, and dependency changes can be absorbed without re-architecting the product

## Phase 9 implementation rules

**Rule 1: evidence comes from the system, not from retrospective narrative.**  
If a control cannot be demonstrated from the event history, signed attestation, policy register, or restore evidence, then the control is not operationally real.

**Rule 2: assurance must be continuous, not annual theatre.**  
DSPT is annual, DTAC evidence changes over time, DCB safety evidence evolves with changes, and the CAF-aligned DSPT expects stronger testing of the full response-and-recovery cycle. So evidence production should run continuously and only be packaged periodically. ([NHS England Digital][3])

**Rule 3: restore evidence matters more than backup configuration.**  
CAF-aligned DSPT now explicitly expects testing across the full incident-response cycle and understanding the restore order of dependent systems. That means backup dashboards alone are not enough; the product needs repeated clean-environment restore proof. ([NHS England Digital][4])

**Rule 4: retention is part of system design.**  
The Records Management Code of Practice explicitly covers storage, retention, and deletion, and it is meant to form the basis of organisational records policy. Phase 9 should therefore move retention out of ad hoc scripts and into the product’s metadata and lifecycle engine. ([NHS Transformation Directorate][5])

**Rule 5: standards and guidance are versioned inputs, not static assumptions.**  
NHS England refreshed DTAC guidance in March 2026, and NHS England has already commenced a review of DCB0129 and DCB0160. The assurance model should therefore carry standards-version metadata rather than hard-coding one permanent checklist. ([NHS Transformation Directorate][6])

**Rule 6: operations UI should feel as deliberate as the clinical UI.**  
This phase is admin-heavy, but the front end still matters. The operations console should be dense, elegant, fast, and legible, not a pile of unstructured charts.

---

## 9A. Assurance ledger, evidence graph, and operational state contracts

This sub-phase creates the formal assurance substrate for the whole platform.

The architecture already says the platform is event-driven, that it includes a WORM audit ledger, and that analytics and assurance are first-class domain services. That is the exact right starting point. Phase 9 should make that explicit by treating every operational control, evidence link, and assurance pack as a formal domain object rather than a reporting by-product.

### Backend work

Create these objects:

**AssuranceLedgerEntry**  
`assuranceLedgerEntryId`, `sourceEventRef`, `entryType`, `tenantId`, `controlRefs`, `evidenceRefs`, `hash`, `previousHash`, `createdAt`

**EvidenceArtifact**  
`evidenceArtifactId`, `artifactType`, `sourceRef`, `sourceVersion`, `integrityHash`, `retentionClassRef`, `visibilityScope`, `createdAt`

**ControlObjective**  
`controlObjectiveId`, `frameworkCode`, `controlCode`, `versionRef`, `ownerRole`, `status`, `evidenceRequirementSet`

**ControlEvidenceLink**  
`linkId`, `controlObjectiveId`, `evidenceArtifactId`, `linkType`, `validFrom`, `validTo`, `validationState`

**ProjectionHealthSnapshot**  
`projectionHealthSnapshotId`, `projectionCode`, `lagMs`, `stalenessState`, `rebuildState`, `capturedAt`

**AttestationRecord**  
`attestationId`, `controlObjectiveId`, `attestedBy`, `attestedAt`, `attestationScope`, `status`, `commentRef`

**AssurancePack**  
`assurancePackId`, `packType`, `periodStart`, `periodEnd`, `tenantScope`, `state`, `artifactRefs`, `signoffRefs`

Use this algorithm:

1. consume all domain events from `request.*`, `intake.*`, `identity.*`, `telephony.*`, `safety.*`, `triage.*`, `booking.*`, `hub.*`, `pharmacy.*`, `patient.*`, `communication.*`, `assistive.*`, `analytics.*`, and `audit.*`
2. map any legacy aliases such as `ingest.*` or `tasks.*` into that canonical namespace set before projection or assurance ingestion
3. normalize the events into typed assurance entries
4. append them to the assurance ledger with hash chaining
5. materialize evidence artifacts and control mappings
6. update operational projections and control-status views
7. build assurance packs from those evidence links rather than from separate manual data collection

All cross-organisation operational, support, and assurance views must materialize under `VisibilityProjectionPolicy` from the canonical Phase 0 section. No later projection layer may widen audience scope after materialization.

Assurance ingestion must fail closed on unknown namespaces or incompatible schema versions. It must not silently drop intake, safety, patient, communication, identity, or telephony events, because request-intake health, patient-message delivery, safety coverage, and multi-channel operational evidence all depend on complete domain coverage.

Create an assurance-pack state machine:

`collecting -> validating -> awaiting_attestation -> published -> superseded -> archived`

### Frontend work

Build the first real Operations Console route family:

- `/ops/overview`
- `/ops/queues`
- `/ops/capacity`
- `/ops/dependencies`
- `/ops/audit`
- `/ops/assurance`
- `/ops/incidents`
- `/ops/resilience`

`/ops/overview`, `/ops/queues`, `/ops/capacity`, and `/ops/dependencies` should normally reuse one `OperationsConsoleShell` keyed by scope and time horizon, with one shared masthead, one shared filter contract, and continuity-preserving drill-in semantics.

The detailed visual hierarchy, live-update, motion, and drill-down contract for this route family is defined in `operations-console-frontend-blueprint.md`.

Governed mutation handoffs from these routes should land in the Governance and Admin Shell under `/ops/governance/*`, `/ops/access/*`, `/ops/config/*`, `/ops/comms/*`, or `/ops/release/*`, not create a second independent config surface inside the Operations Console.

This should not look like a generic BI tool. It should feel like a control room for a live clinical operations platform.

### Tests that must pass before moving on

- assurance-ledger append-only tests
- hash-chain integrity tests
- evidence-link lineage tests
- projection-lag detection tests
- assurance-pack state-transition tests
- rebuild-from-raw-events tests
- tenant-scope isolation tests

### Exit state

The product now has one formal assurance spine that sits on top of the event spine rather than beside it.

---

## 9B. Live operational projections, service levels, and breach-risk engine

This sub-phase turns platform telemetry into operational truth.

The architecture already expects live dashboards and an Ops Console, and earlier phases already created queueing, booking, network coordination, pharmacy, and assistive workflows. Phase 9 now needs to turn those into a single live operational view. The most important design choice here is to measure essential functions, not vanity metrics. That aligns with the CAF-aligned DSPT emphasis on identifying essential functions and understanding the data, systems, and dependencies that support them. ([NHS England Digital][7])

### Backend work

Create these objects:

**SLOProfile**  
`sloProfileId`, `functionCode`, `availabilityTarget`, `latencyTarget`, `freshnessTarget`, `restoreTarget`, `alertThresholds`

**OperationalMetricDefinition**  
`metricDefinitionId`, `metricCode`, `sourceProjection`, `aggregationWindow`, `tenantScope`, `ownerRole`

**BreachRiskRecord**  
`breachRiskRecordId`, `entityType`, `entityRef`, `riskType`, `severity`, `predictedAt`, `windowCloseAt`, `supportingMetricRefs`

**QueueHealthSnapshot**  
`queueHealthSnapshotId`, `queueCode`, `depth`, `medianAge`, `breachRiskCount`, `escalationCount`, `capturedAt`

**DependencyHealthRecord**  
`dependencyHealthRecordId`, `dependencyCode`, `healthState`, `latency`, `errorRate`, `fallbackState`, `capturedAt`

**EquitySliceMetric**  
`equitySliceMetricId`, `sliceDefinition`, `metricSetRef`, `periodWindow`, `varianceState`

Build projections for:

- request intake health
- triage queue health
- more-info loop latency
- booking search and commit success
- waitlist conversion
- hub coordination delays
- pharmacy dispatch and outcome latency
- patient message delivery
- assistive capability health
- audit and projection staleness

Use the event history to compute both current state and forward risk. The breach-risk engine should be explicit and reproducible.

For active entity `i` at time `t`, define:

- `d_i(t) = workingMinutesBetween(t, targetWindowCloseAt_i)` as remaining working-minute slack to the governing target
- `rank_i(t)` under the deterministic queue or workflow ordering for the responsible service
- `e_j(t)` as the class-conditioned robust expected handling workload for upstream item `j`
- `B_i(t) = sum_{j \prec i} e_j(t)` as effective workload minutes ahead of `i`
- `mu_eff(t)` as the effective staffed service capacity in workload-minutes cleared per working minute
- `W_i(t) = B_i(t) / mu_eff(t)` as expected wait-to-start
- `S_i` as the random in-service handling time for `i`, modelled from the active class distribution
- `D_i` as any extra external-dependency delay random variable for states waiting on supplier, hub, pharmacy, or patient response; set `D_i = 0` when none applies
- `T_i(t) = W_i(t) + S_i + D_i` as total time-to-safe-resolution
- `m_i = E[T_i(t)]` and `v_i = Var[T_i(t)]`, adding covariance terms only when a validated dependence model exists
- moment-matched Gamma parameters `k_i = m_i^2 / max(1e-6, v_i)` and `theta_i = v_i / max(1e-6, m_i)`
- `P_breach_i(t) = 1 - F_Gamma(d_i(t); k_i, theta_i)` when `d_i(t) > 0`, otherwise `1`

This formulation is computationally cheap enough for live boards because queue prefix workloads make `W_i(t)` `O(1)` per item after an `O(n)` pass, while the Gamma approximation keeps the risk calculation closed-form and monotone.

A good breach-risk algorithm is therefore:

1. identify active work items and timers
2. derive `B_i(t)`, `mu_eff(t)`, and dependency-delay distributions from queue speed and dependency health
3. compute `P_breach_i(t)`
4. rank and surface intervention candidates by severity, `P_breach_i(t)`, remaining slack `d_i(t)`, and stable entity key
5. attach explanation fields so operators can act, not just look

### Frontend work

The operations overview should have six disciplined surfaces:

- `NorthStarBand`
- `BottleneckRadar`
- `CapacityAllocator`
- `ServiceHealthGrid`
- `CohortImpactMatrix`
- `InterventionWorkbench`

`InvestigationDrawer` should be the canonical drill-down surface across all six so operators can move from macro health to queue, dependency, cohort, and entity detail without losing board context.

The visual style should be premium but operational: quiet enough to scan all day, but not gimmicky.

Operational boards must use the canonical live-projection rules from Phase 0: in-place tile updates, visible `FreshnessChip` state, `ProjectionSubscription`-driven patching, operator-controlled pause-live behavior, and no viewport hijack when thresholds breach or backlog shifts. The detailed composition and motion rules are defined in `operations-console-frontend-blueprint.md`.

### Tests that must pass before moving on

- metric-calculation determinism tests
- breach-risk reproducibility tests
- large-volume event ingestion tests
- projection freshness tests
- stale dependency feed tests
- UI performance tests on live dashboards
- filter and slice consistency tests

### Exit state

Ops users can now see the service as one live operational system rather than a set of disconnected feature dashboards.

---

## 9C. Audit explorer, break-glass review, and support replay

This sub-phase turns immutable audit into a usable operational surface.

The architecture makes break-glass and immutable audit part of the core identity and policy layer, not a logging detail. The WORM audit ledger is also already explicit in the platform design. Phase 9 should therefore create an audit experience that is actually usable for governance, support, and investigation.

### Backend work

Create these objects:

**AuditQuerySession**  
`auditQuerySessionId`, `openedBy`, `filtersRef`, `purposeOfUse`, `createdAt`, `expiresAt`

**AccessEventIndex**  
`accessEventIndexId`, `actorRef`, `subjectRef`, `entityType`, `entityRef`, `actionType`, `eventTime`, `breakGlassState`

**BreakGlassReviewRecord**  
`breakGlassReviewRecordId`, `eventRef`, `reviewerRef`, `reviewState`, `reasonAdequacy`, `followUpRequired`

**SupportReplaySession**  
`supportReplaySessionId`, `operatorRef`, `targetJourneyRef`, `timelineRefs`, `maskingPolicyRef`

**DataSubjectTrace**  
`dataSubjectTraceId`, `subjectRef`, `relatedEventRefs`, `crossSystemRefs`, `traceWindow`

Build a searchable audit model that can answer questions like:

- who opened this request, task, appointment, or pharmacy case
- when was break-glass used
- what changed between two versions
- which outbound messages were sent and when
- which config version was active when the decision happened
- what the user saw at the time of an incident

Support replay must stay safe. Operators should be able to reconstruct the timeline without re-performing actions or viewing data outside role scope.

### Frontend work

Build an Audit Explorer with:

- global search by request, patient, task, appointment, pharmacy case, or actor
- timeline view
- diff view between versions
- break-glass review queue
- support replay mode
- exportable investigation bundle for approved users

Add an operational support desk surface that can run controlled recovery actions such as secure-link reissue, communication replay, and attachment-access recovery under explicit policy and audit controls. Define those actions in `staff-operations-and-support-blueprint.md`.

Audit Explorer and the support desk should reuse the same `OperationsConsoleShell` masthead, filter semantics, freshness strip, and return-to-board behavior defined in `operations-console-frontend-blueprint.md`.

This screen must be extremely legible. Dense data is fine. Confusing data is not.

### Tests that must pass before moving on

- WORM tamper-detection tests
- audit-search correctness tests
- break-glass review workflow tests
- support replay masking tests
- actor and subject scoping tests
- investigation-bundle export integrity tests
- full cross-journey trace tests

### Exit state

Sensitive actions are now operationally reviewable, not just theoretically logged.

---

## 9D. Assurance pack factory and standards evidence pipeline

This sub-phase turns raw evidence into structured assurance output.

This is where the current standards landscape matters most. DSPT is annual and mandatory for organisations with access to NHS patient data and systems. DTAC remains the framework across 5 core areas and applies alongside other approvals rather than replacing them. DCB0129 and DCB0160 remain mandatory, but NHS England has already begun a review of them to keep pace with newer workflows and technologies. DTAC guidance was also refreshed in March 2026. The engineering implication is that Vecells needs a versioned standards map, not a static checklist baked into code. ([NHS England Digital][1])

### Backend work

Create these objects:

**StandardsVersionMap**  
`standardsVersionMapId`, `frameworkCode`, `frameworkVersion`, `effectiveFrom`, `effectiveTo`, `controlSetRef`

**AssuranceControlRecord**  
`controlRecordId`, `frameworkCode`, `controlCode`, `tenantId`, `state`, `evidenceCoverage`, `ownerRef`

**EvidenceGapRecord**  
`evidenceGapRecordId`, `controlRecordId`, `gapType`, `severity`, `dueAt`, `remediationRef`

**FrameworkPackGenerator**  
`generatorId`, `frameworkCode`, `versionRef`, `querySetRef`, `renderTemplateRef`

**MonthlyAssurancePack**  
`monthlyAssurancePackId`, `tenantId`, `month`, `controlStatusRefs`, `incidentRefs`, `exceptionRefs`, `signoffState`

**CAPAAction**  
`capaActionId`, `sourceRef`, `rootCauseRef`, `ownerRef`, `targetDate`, `status`

Build pack generators for at least:

- DSPT operational evidence pack
- DTAC evidence refresh pack
- DCB0129 manufacturer safety pack delta
- DCB0160 deployment handoff pack
- NHS App post-live monthly operational pack
- IM1 and NHS-integrated change pack deltas where required

Use this algorithm:

1. resolve the active framework version
2. map control records to evidence queries
3. generate a draft pack with completeness scoring
4. attach incidents, exceptions, and CAPA items
5. validate missing or stale evidence
6. require attestation and sign-off
7. publish internally and export externally in a controlled format

### Frontend work

Build an Assurance Center with:

- framework selector
- control heat map
- evidence completeness status
- evidence-gap queue
- attestation workflow
- pack preview and export
- CAPA tracker

The design should feel like a productized governance system, not a filing cabinet. Assurance Center should remain a child lens of the same operations shell rather than a visually disconnected admin product.

### Tests that must pass before moving on

- framework-version mapping tests
- evidence-completeness calculation tests
- pack-generation determinism tests
- export redaction tests
- CAPA lifecycle tests
- stale-evidence alert tests
- sign-off workflow tests

### Exit state

Vecells can now generate credible assurance packs from live evidence rather than rebuilding the service in PowerPoint every month.

---

## 9E. Records lifecycle, retention, legal hold, and deletion engine

This sub-phase gives the platform a governed data lifecycle.

The Records Management Code of Practice is explicit that it covers storage, retention, and deletion, and that different classes of records should be kept for different periods. It also explicitly says the HTML version is the most up-to-date version. For recorded media and derived outputs, NHS England’s information-governance guidance also says transcripts or summaries of recordings should be retained in line with the Records Management Code as appropriate, and anything not covered should be decided case by case with the records-management or IG lead. ([NHS Transformation Directorate][5])

### Backend work

Create these objects:

**RetentionClass**  
`retentionClassId`, `recordType`, `basisRef`, `minimumRetention`, `reviewPoint`, `disposalMode`, `immutabilityMode`, `dependencyCheckPolicyRef`, `sourcePolicyRef`

**RetentionDecision**  
`retentionDecisionId`, `artifactRef`, `retentionClassRef`, `decisionDate`, `deleteAfter`, `archiveAfter`, `legalHoldState`

**ArtifactDependencyLink**  
`dependencyLinkId`, `artifactRef`, `dependentArtifactRef`, `dependencyType`, `activeState`

**LegalHoldRecord**  
`legalHoldRecordId`, `scopeRef`, `reasonCode`, `placedBy`, `placedAt`, `reviewDate`

**DispositionJob**  
`dispositionJobId`, `artifactRefs`, `actionType`, `scheduledAt`, `executedAt`, `resultState`

**DeletionCertificate**  
`deletionCertificateId`, `artifactRef`, `hashAtDeletion`, `deletedAt`, `deletedBySystemVersion`

**ArchiveManifest**  
`archiveManifestId`, `artifactRefs`, `archiveLocationRef`, `checksumBundleRef`, `createdAt`

Every durable object created in prior phases should now carry a lifecycle class at creation time, but those classes must distinguish ordinary records from immutable evidence:

**Policy-driven archive or delete classes**

- request snapshots
- task timelines
- appointment records
- hub case records
- pharmacy case records
- transcripts
- draft-note artifacts
- incident records

**Archive-only or immutable classes**

- audit entries
- assurance ledger entries
- hash-chain records
- deletion certificates
- archive manifests

**Replay-critical classes**

- config history
- prompt versions
- model traces and evaluation artifacts
- assistive input and output evidence snapshots that are linked to patient-specific decisions, release cohorts, assurance packs, incidents, or safety cases

WORM and hash-chained artifacts must never be scheduled for deletion. Replay-critical artifacts may be archived, but they must not be deleted while any active dependency link exists.

Use this algorithm:

1. classify on creation and assign immutability mode
2. attach retention decision and dependency links
3. check for legal hold before any archival or deletion
4. before any delete action, evaluate dependency graph and immutability mode
5. if an artifact is WORM, hash-chained, or replay-critical with active dependencies, archive only and preserve integrity hashes
6. only execute deletion where the retention class permits deletion and no legal hold or dependency rule blocks it
7. issue deletion certificate or archive manifest
8. append lifecycle events to the assurance ledger

### Frontend work

Build a restricted Records Governance surface with:

- retention class browser
- legal hold queue
- upcoming disposition jobs
- disposition exceptions
- deletion certificate lookup
- archive manifest viewer
- dependency and immutability explainer for blocked deletions

This UI should be quiet and precise. No casual destructive actions.

### Tests that must pass before moving on

- retention-class assignment tests
- legal-hold override tests
- deletion-certificate integrity tests
- archive-manifest checksum tests
- transcript-retention policy tests
- policy-change propagation tests
- WORM-exclusion tests proving audit and assurance-ledger entries never enter delete jobs
- replay-critical dependency protection tests for model traces, config history, and evidence snapshots
- disposition safety tests in non-production and production-like environments

### Exit state

Data retention and deletion are now controlled by policy and evidence without breaking the WORM audit promise or the replayability of assistive decisions.

## 9F. Resilience architecture, restore orchestration, and chaos programme

This sub-phase proves the service can survive failure.

CAF-aligned DSPT now expects a higher bar for testing the incident-response cycle, and it explicitly says organisations should test all parts of the response cycle so they can restore business operations. The resilience guidance also says organisations should understand which systems matter most to restoring essential functions and the order in which interdependent systems can be brought back online. NHS England’s cyber incident response exercise framework is also now a live source of reusable health-and-care-specific scenarios for rehearsing incident response. ([NHS England Digital][4])

### Backend work

Create these objects:

**EssentialFunctionMap**  
`essentialFunctionMapId`, `functionCode`, `businessOwnerRef`, `supportingSystemRefs`, `dataRefs`, `dependencyOrderRef`

**RecoveryTier**  
`recoveryTierId`, `functionCode`, `rto`, `rpo`, `degradedModeDefinition`, `restorePriority`

**BackupSetManifest**  
`backupSetManifestId`, `datasetScope`, `snapshotTime`, `immutabilityState`, `restoreTestState`, `checksumBundleRef`

**RestoreRun**  
`restoreRunId`, `environment`, `backupSetRef`, `initiatedAt`, `completedAt`, `resultState`, `evidenceRefs`

**FailoverScenario**  
`failoverScenarioId`, `targetFunction`, `triggerType`, `degradedModeRef`, `successCriteriaRef`

**ChaosExperiment**  
`chaosExperimentId`, `blastRadiusRef`, `hypothesisRef`, `resultState`, `guardrailRefs`

**RecoveryEvidencePack**  
`recoveryEvidencePackId`, `periodWindow`, `restoreRuns`, `failoverRuns`, `chaosRuns`, `attestationState`

Start by mapping essential functions, not infrastructure components. For Vecells those are likely:

- digital intake
- safety gate
- triage queue
- patient status and secure links
- local booking
- hub coordination
- pharmacy referral loop
- outbound comms
- audit search
- assistive layer downgrade path

Then map dependencies in restore order.

Use this resilience algorithm:

1. define essential functions and recovery tiers
2. map systems, data, and dependency ordering
3. create backup manifests with immutability and checksum verification
4. restore into clean environments on a regular schedule
5. validate functional restore, not just database restore
6. run failover and degraded-mode exercises
7. run chaos experiments within approved blast radius
8. write recovery evidence into the assurance ledger

### Frontend work

Build a Resilience Board inside the operations console with:

- essential function map
- dependency graph
- backup freshness
- latest restore result
- next scheduled exercise
- degraded-mode readiness
- open recovery risks

This should feel serious and concise. Resilience Board should reuse the same command masthead, scope filters, freshness semantics, and drill-down patterns defined in `operations-console-frontend-blueprint.md` so operators do not have to learn a second console. Operators should know within seconds whether the platform can recover and what is currently weak.

### Tests that must pass before moving on

- clean-environment restore tests
- cross-service dependency restore tests
- degraded-mode activation tests
- notification fallback tests
- failover timing tests
- chaos guardrail tests
- recovery-evidence pack generation tests
- full restore of at least one end-to-end patient journey and one staff journey

### Exit state

The platform can now demonstrate recovery, not just claim it.

---

## 9G. Security operations, incident workflow, and just-culture reporting

This sub-phase makes operational security a routine workflow instead of a side-channel panic path.

DSPT now includes an incident-reporting capability, and NHS England states that reportable data-security and protection incidents must be notified through that reporting tool. CAF-aligned DSPT guidance also emphasises a positive information-assurance culture, leadership attention, and staff willingness to report breaches, near misses, and problem processes rather than hide them. ([NHS England Digital][1])

### Backend work

Create these objects:

**SecurityIncident**  
`securityIncidentId`, `incidentType`, `sourceRef`, `detectedAt`, `severity`, `impactScope`, `status`, `reportabilityAssessmentRef`

**NearMissReport**  
`nearMissReportId`, `reportedBy`, `contextRef`, `summaryRef`, `investigationState`, `linkedIncidentRef`

**ReportabilityAssessment**  
`assessmentId`, `incidentRef`, `frameworkRef`, `decision`, `supportingFactsRef`, `reportedAt`

**ContainmentAction**  
`containmentActionId`, `incidentRef`, `actionType`, `initiatedBy`, `initiatedAt`, `resultState`

**PostIncidentReview**  
`reviewId`, `incidentRef`, `rootCauseRef`, `capaRefs`, `lessonsLearnedRef`, `ownerRef`

**TrainingDrillRecord**  
`trainingDrillRecordId`, `scenarioRef`, `audienceRef`, `runAt`, `findingsRef`, `followUpRefs`

Use this incident algorithm:

1. detect from telemetry, operator report, or near miss
2. classify and triage severity
3. preserve evidence and timeline
4. execute containment playbook
5. assess reportability
6. submit reportable incidents through the appropriate route
7. perform post-incident review
8. generate CAPA actions and training updates
9. write all outcomes back into the assurance ledger

Treat near miss as a first-class object. The cultural guidance is very clear that operators need to feel able to surface near misses and unacceptable behaviour early rather than wait for a major breach. ([NHS England Digital][8])

### Frontend work

Build an Incident Desk with:

- incident queue
- near-miss intake
- severity board
- containment timeline
- reportability checklist
- DSPT and reporting handoff status
- post-incident review panel
- runbook and exercise links

The UX should feel fast, serious, and calm under pressure.

### Tests that must pass before moving on

- incident-timeline integrity tests
- evidence-preservation tests
- reportability-decision tests
- near-miss workflow tests
- CAPA generation tests
- incident-to-assurance-pack propagation tests
- operator drill and tabletop exercise tests

### Exit state

Vecells can now detect, investigate, report, and learn from incidents within a controlled operational system.

---

## 9H. Tenant governance, config immutability, and dependency hygiene

This sub-phase makes the platform governable across multiple tenants and over time.

This matters more now than earlier in the programme. DTAC has just been refreshed, DCB clinical-safety standards are under review, and the legacy `developer.nhs.uk` and FHIR servers have now been decommissioned. So the product needs configuration and dependency governance that assumes standards, documentation locations, and integration envelopes will continue to move. ([NHS Transformation Directorate][6])

This section is an implementation of the canonical configuration compilation and promotion algorithm in `phase-0-the-foundation-protocol.md`. If any tenant-local promotion shortcut conflicts with that section, the canonical Phase 0 section wins.

### Backend work

Create these objects:

**TenantBaselineProfile**  
`tenantBaselineProfileId`, `tenantId`, `enabledCapabilities`, `policyPackRefs`, `integrationRefs`, `standardsVersionRefs`, `approvalState`

**ConfigVersion**  
`configVersionId`, `scope`, `hash`, `parentVersionRef`, `changedBy`, `changedAt`, `changeType`, `attestationRef`

**PolicyPackVersion**  
`policyPackVersionId`, `packType`, `effectiveFrom`, `effectiveTo`, `changeSummaryRef`, `compatibilityRefs`

**DependencyRegistryEntry**  
`dependencyRegistryEntryId`, `dependencyCode`, `sourceAuthority`, `currentVersion`, `supportState`, `legacyRiskState`, `replacementPathRef`

**LegacyReferenceFinding**  
`findingId`, `scopeRef`, `legacyType`, `findingTextRef`, `severity`, `status`

**StandardsChangeNotice**  
`noticeId`, `frameworkCode`, `currentVersionRef`, `newVersionRef`, `impactAssessmentRef`, `ownerRef`

**CompiledPolicyBundle**  
`bundleId`, `tenantId`, `policyPackRefs`, `configVersionRefs`, `compiledHash`, `compatibilityState`, `simulationEvidenceRef`, `approvedBy`, `approvedAt`

Use this algorithm:

1. compile routing rules, SLA or ETA policy, identity and grant policy, duplicate policy, provider overrides, waitlist and booking policy, hub coordination policy, callback and messaging policy, pharmacy rule packs, communications policy, access policy, visibility policy, provider capability matrices, and tenant overrides into one `CompiledPolicyBundle`
2. reject any bundle that permits PHI exposure through a public or superseded grant
3. reject any bundle that permits automatic patient binding below the required assurance level
4. reject any bundle that permits automatic duplicate merge without same-episode proof
5. reject any bundle that permits closure with any active lease, pending preemption, or unresolved reconciliation
6. reject any bundle that permits exclusive slot language without a real `CapacityReservation.state = held`
7. reject any bundle that permits pharmacy auto-close from weakly correlated evidence
8. reject any bundle that permits callback, message, hub, booking, or pharmacy paths to bypass the universal re-safety rule
9. reject any bundle that permits a projection to include fields outside the audience-tier visibility policy
10. after compile success, version every tenant config and policy pack, diff tenant baselines continuously, scan for legacy or deprecated references, and map standards changes to required evidence updates
11. allow promotion only after compile success, reference-case simulation, and immutable audit of the approved bundle hash

This is also where you formally purge stale references to retired NHS endpoints and archived documentation.

### Frontend work

Build a Tenant Governance surface with:

- tenant baseline matrix
- config diff viewer
- policy-pack history
- standards version map
- legacy-reference findings
- promotion approval status

Extend this surface using `platform-admin-and-config-blueprint.md` so routing rules, SLA or ETA settings, waitlist policies, callback policies, pharmacy policy overrides, communications governance, and access-role administration are managed as versioned and auditable configuration domains.

This page should make it impossible to pretend the platform is identical everywhere when it is not.

### Tests that must pass before moving on

- config-immutability tests
- tenant-drift detection tests
- policy-pack compatibility tests
- legacy-reference scanner tests
- standards-change impact workflow tests
- approval-gate bypass prevention tests

### Exit state

The platform can now evolve safely across tenants, suppliers, and changing NHS control frameworks.

---

## 9I. Full-program exercises, BAU transfer, and formal exit gate

This final sub-phase turns the whole programme into a stable service.

By this point, the product has intake, identity, telephony, clinical workflow, local booking, network coordination, pharmacy loop, NHS App channel, and assistive features. Phase 9 now has to prove those parts can be operated together, evidenced together, restored together, and governed together. That is exactly what the architecture’s analytics-and-assurance layer was reserving from the beginning.

### Backend work

Run a final integrated programme of exercises:

1. full load and soak across patient and staff flows
2. projection rebuild from raw event history
3. backup restore into clean environment
4. failover rehearsal
5. security incident rehearsal
6. reportable-incident drill
7. monthly assurance-pack generation
8. retention and deletion dry run
9. tenant baseline diff and approval audit
10. full end-to-end regression across all phase-delivered journeys

Create these objects:

**BAUReadinessPack**  
`bauReadinessPackId`, `tenantScope`, `sloRefs`, `runbookRefs`, `exerciseRefs`, `openRiskRefs`, `signoffState`

**OnCallMatrix**  
`onCallMatrixId`, `serviceScope`, `rotaRefs`, `escalationPaths`, `contactValidationState`

**RunbookBundle**  
`runbookBundleId`, `scope`, `versionRef`, `dependencyRefs`, `lastRehearsedAt`

**ReleaseToBAURecord**  
`releaseToBAURecordId`, `effectiveDate`, `supportModelRef`, `acceptanceRefs`, `rollbackPlanRef`

### Frontend work

Before final sign-off, the operations surfaces should feel finished:

- overview that works for service owners
- audit and break-glass views that work for governance
- incident desk that works for support and security
- resilience board that works for engineering and operations
- assurance center that works for safety and compliance
- tenant governance views that work for platform leadership

This phase should not ship with temporary admin screens. It is the final product layer that makes the rest survivable.

### Tests that must all pass before the blueprint is considered complete

- no Sev-1 or Sev-2 defects in operations, audit, restore, or incident paths
- full projection rebuild from raw events is proven
- immutable audit integrity is proven
- break-glass review workflow is proven
- monthly assurance-pack generation is proven
- retention and deletion workflow is proven
- full restore and failover exercises are proven
- incident and near-miss workflows are proven
- config drift and legacy dependency scanning are proven
- full end-to-end regression across all patient and staff journeys is green
- BAU runbooks, owners, and on-call paths are signed off

### Exit state

The platform is no longer just feature-rich. It is operationally defensible.

---

## Recommended rollout slices inside Phase 9

Ship this phase in five slices:

**Slice 9.1**  
Assurance ledger, control mapping, and read-only operations overview.

**Slice 9.2**  
Audit explorer, break-glass review, and live queue and breach-risk views.

**Slice 9.3**  
Assurance pack generation, records lifecycle controls, and tenant config governance.

**Slice 9.4**  
Restore orchestration, resilience board, chaos programme, and incident desk.

**Slice 9.5**  
Full BAU transfer, recurring exercise schedule, automated monthly packs, and final sign-off.

## System after Phase 9

After this phase, Vecells becomes the full core product the architecture was aiming at from the start: a FHIR-native, event-driven primary-care access and operations layer with one shared event spine, one shared audit spine, one live operations surface, one evidence-producing assurance layer, policy-driven retention, proven restore and incident handling, and standards-aware governance wrapped around every major workflow. The patient and staff capabilities from Phases 1 to 8 still matter, but Phase 9 is what makes them sustainable in real NHS deployment conditions. ([NHS England Digital][1])

[1]: https://digital.nhs.uk/services/data-security-and-protection-toolkit "Data Security and Protection Toolkit - NHS England Digital"
[2]: https://digital.nhs.uk/developer/decommissioning-developer.nhs.uk-and-fhir-servers "Decommissioning developer.nhs.uk and FHIR servers - NHS England Digital"
[3]: https://digital.nhs.uk/services/data-access-request-service-dars/process/data-access-request-service-dars-pre-application-checklist "Data Access Request Service (DARS): pre-application checklist - NHS England Digital"
[4]: https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/2024-25-caf-aligned-dspt-guidance/objective-d/principle-d1-response-and-recovery-planning "Principle: D1 Response and recovery planning - NHS England Digital"
[5]: https://transform.england.nhs.uk/information-governance/guidance/records-management-code/ "Records Management Code of Practice - NHS Transformation Directorate"
[6]: https://transform.england.nhs.uk/innovation-lab/ "Innovation Service - NHS Transformation Directorate"
[7]: https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/2024-25-caf-aligned-dspt-guidance/objective-b/principle-b3-data-security "Principle: B3 Data security - NHS England Digital"
[8]: https://digital.nhs.uk/cyber-and-data-security/guidance-and-assurance/caf-aligned-dspt-guidance/objective-b/principle-b6-staff-awareness-and-training "Principle: B6 Staff awareness and training - NHS England Digital"
