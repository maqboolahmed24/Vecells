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

## Cross-Phase Conformance Scorecard

The programme summary is no longer descriptive prose only. `phase-cards.md`, `blueprint-init.md`, runtime verification, governance proof, ops proof, and Phase 9 exit criteria must now reconcile through one `CrossPhaseConformanceScorecard` over machine-auditable `PhaseConformanceRow` rows.

- No phase summary may remain `complete` in planning, release review, or BAU sign-off while the corresponding conformance row is `stale | blocked`.
- Every row must bind the summary source, canonical blueprint refs, required `ControlStatusSnapshot` rows, required `AssuranceSliceTrustRecord` rows, required `ExperienceContinuityControlEvidence` rows, any required `OpsContinuityEvidenceSlice` rows, any required `GovernanceContinuityEvidenceBundle` rows, the exact `RuntimePublicationBundle`, the pinned `VerificationScenario`, the governing `ReleaseRecoveryDisposition` set, and the final Phase 9 proof refs for that claim.
- Programme planning may no longer flatten cross-phase controls into phase-local notes once runtime publication, continuity evidence, governance proof, or operational proof already depends on them.

## Programme Summary-Layer Alignment

High-priority summary-layer corrections required to keep delivery planning aligned with the canonical architecture:

- Phase 0 now carries the missing control services and invariants that later phases depend on.
- Phase 2 now makes append-only `IdentityBinding` versions, `IdentityBindingAuthority`, and exact-once `AccessGrant` scope, redemption, and supersession semantics explicit instead of implying direct patient binding or generic continuation links.
- Phase 3 now treats duplicate handling as governed clustering and review work, not generic merge logic.
- Phases 4 and 5 now surface reservation truth and external-confirmation gates so booking summary cards do not imply false exclusivity or premature booked states.
- Phase 7 now reflects the hardened NHS App channel design: versioned manifests, trusted embedded context, SSO scrubbing, capability-negotiated bridge behaviour, and rollout guardrails.

## Extended Summary-Layer Alignment

High-priority summary-layer corrections required to keep the programme cards aligned with later blueprint updates:

- Phase 3 now reflects the canonical workspace shell, reusable `WorkspaceTrustEnvelope`, lease-fenced actions, and next-task settlement rules.
- The end-to-end joining layer now makes shell continuity, unified truth assembly, bounded assistive staging, and watch or freeze posture explicit across patient, workspace, hub, ops, governance, and support surfaces.
- Phase 7 now carries embedded shell consistency, partial-visibility placeholders, safe outbound navigation grants, governed artifact presentation, and route-freeze behaviour.
- Phase 8 now reflects assistive surface binding, work-protection leases, bounded draft insertion, trust projections, and freeze dispositions.
- Phase 0 now also treats tenant, organisation, purpose-of-use, elevation, and break-glass posture as one shared `ActingScopeTuple` and `GovernanceScopeToken` contract rather than ambient session state split across governance and live operations.
- Phase 9 now treats degraded or quarantined assurance slices as first-class operational truth instead of flattening them into one green dashboard posture.
- Phase 9 now also treats assurance, replay, export, retention, and recovery proof as one graph-coherent system through `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` rather than separate local evidence lists.
- Phase 9 now also treats resilience readiness as one governed restore-control system through `OperationalReadinessSnapshot`, `RunbookBindingRecord`, `RecoveryControlPosture`, and authoritative restore, failover, and chaos settlement rather than loose runbook and dashboard links.
- Phase 9 now also binds `BackupSetManifest`, `RestoreRun`, `FailoverRun`, `ChaosRun`, `RecoveryEvidencePack`, and `SyntheticRecoveryCoverageRecord` into one resilience tuple so old game-day evidence cannot silently remain live after publication or watch-tuple drift.
- The platform runtime and frontend kernels now treat tokens, profile selection, state semantics, state-kernel propagation, automation anchors, telemetry vocabulary, and artifact posture as one published `DesignContractPublicationBundle` plus fail-closed `DesignContractLintVerdict`, rather than as separate token-export, theme, snapshot, and route-local convention layers.

Summary-layer corrections required to keep the programme cards aligned with the newer cross-phase control plane:

- Phase 0 now defines `RouteIntentBinding` as the canonical route-family, session, subject, and fence contract for post-submit mutation.
- Phase 0 now requires `CommandActionRecord` plus `CommandSettlementRecord` so same-shell success, pending, stale, and recovery states do not depend on optimistic UI alone.
- Phase 0 now freezes mutable channel posture through `ReleaseApprovalFreeze` and `ChannelReleaseFreezeRecord` rather than treating bundle hash, schema, and bridge capability as separate concerns.
- Phase 0 now materializes `AssuranceSliceTrustRecord` so degraded or quarantined operational truth cannot silently drive booking, dispatch, assistive writeback, or promotion decisions.
- The runtime and release summary now requires one exact `VerificationScenario` plus one exact `ReleaseContractVerificationMatrix`, so route contracts, frontend manifests, projection query and mutation contracts, cache policy, settlement schemas, continuity evidence, runtime publication, and synthetic recovery coverage are proven and promoted as one candidate tuple rather than as separate local checks.
- The programme summary now also requires one exact `CrossPhaseConformanceScorecard`, so phase cards, bootstrap summary, runtime tuples, continuity proof, governance proof, ops proof, and Phase 9 exit criteria cannot drift into competing “done” definitions.
- The end-to-end summary flow now names these route, settlement, release, and trust contracts directly so the top-level audit no longer understates them.

Summary-layer corrections required to keep the programme cards aligned with the patient-account and route-recovery contracts:

- Patient-facing summary cards now treat home and portal actionability as a governed spotlight-decision problem through `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, `PatientQuietHomeDecision`, `PatientNavUrgencyDigest`, and `PatientNavReturnContract`, not as free-standing CTA selection.
- Patient portal, request-detail, booking, records, messages, callback, pharmacy, and recovery routes now share one governed patient shell over `PatientShellConsistencyProjection`, `PatientNavReturnContract`, `PatientRequestReturnBundle`, and `RecoveryContinuationToken`; browser history and detached receipt pages no longer define continuity.
- Expired, stale, denied-scope, and blocked-policy patient actions now recover through one `PatientActionRecoveryEnvelope` and the same request or return tuple instead of per-channel expired-link handling.
- Record-origin follow-up is now summarized as a continuation-bound path that carries one `RecordOriginContinuationEnvelope` over `RecordActionContextToken` and `RecoveryContinuationToken` instead of jumping into booking or messaging with only loose lineage prose.
- Record summaries, letters, downloads, and record-shell preview now stay bound to one `RecordArtifactParityWitness` over the current source artifact, derivation package, redaction transforms, release gate, and step-up checkpoint, so a calm verified summary cannot drift away from the file or byte source it represents.
- Reachability-risk truth now resolves through versioned `ContactRouteSnapshot`, `ReachabilityObservation`, and `ReachabilityAssessmentRecord` objects, so patient, staff, and support surfaces consume one dependency posture instead of inferring healthy contact paths from stale profile state or send attempts.
- Material new evidence now routes through canonical `EvidenceAssimilationRecord` plus `MaterialDeltaAssessment`, so reply handlers, support capture, booking notes, pharmacy outcomes, and async enrichment cannot decide locally that re-safety is skippable.

Summary-layer corrections required to keep the programme cards aligned with the record-origin continuation seam:

- Record follow-up, record artifact handoff, and downstream booking or messaging entry now preserve one typed continuation witness across anchor, expanded group, release gate, visibility envelope, and continuity evidence instead of recomputing those fences independently per child route.
- Callback, reminder, and message state now resolves through one `ConversationThreadProjection` over typed `ConversationSubthreadProjection` rows and `CommunicationEnvelope` truth, with local acknowledgement, delivery truth, and authoritative outcome kept distinct through `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, and `ConversationCommandSettlement`.
- Contact-route failure is now summarized as one same-shell `ContactRouteRepairJourney` over the active `ReachabilityDependency`, selected anchor, return bundle, and verification checkpoint instead of scattered settings detours and route-local repair rules.
- The canonical route layer now requires settlement, return, continuation, and restore descriptors, so route inventory and deep-link handling no longer imply that same-shell recovery can be inferred ad hoc.
- Support replay and observe return now fail closed behind `SupportReplayRestoreSettlement`, rather than treating browser return or replay exit as enough to reopen live recovery work.

Summary-layer corrections required to keep the programme cards aligned with the continuity-evidence control loop:

- Phase 9 now treats patient-home actionability, record follow-up, more-info reply, thread settlement, hub booking-manage recovery, and replay restore as evidence-producing controls through `ExperienceContinuityControlEvidence`.
- The operations summary now includes continuity-aware diagnosis through `OpsContinuityEvidenceProjection` so degraded patient or support behavior can be explained from the same proof chain as assurance and audit.
- Operations continuity diagnostics now preserve one `continuityQuestionHash` across `ContinuityControlHealthProjection`, `OpsContinuityEvidenceSlice`, `InvestigationDrawerSession`, `OpsBoardStateSnapshot`, and `OpsReturnToken`, so fresher proof shows as delta against the same question instead of silently rebasing or re-arming intervention.
- The governance summary now requires `GovernanceContinuityEvidenceBundle` before compliance review, promotion, or watch stabilization can treat affected patient or support behavior as proven.
- The admin and release summary now treats `ContinuityControlImpactDigest` as a promotion-critical compatibility gate whenever a candidate changes those continuity-sensitive behaviors.
- The audited top-level baseline now includes the explicit `PL_CONT` continuity-proof spine, so programme planning no longer stops at continuity behavior without continuity evidence.
- The platform accessibility layer now resolves live announcements through `AssistiveAnnouncementIntent` and `AssistiveAnnouncementTruthProjection`, binding batching, dedupe, focus restore, freshness posture, timeout repair, and acknowledgement scope to the same emission checkpoint so assistive users hear one causal stream instead of repeated local or replayed cues.
- Route-family accessibility is now summarized as one published `AccessibilitySemanticCoverageProfile` over `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, `FreshnessAccessibilityContract`, `AssistiveTextPolicy`, `VisualizationFallbackContract`, and `AutomationAnchorProfile`, so calm or writable posture cannot stay live on stale semantic coverage.
- The visualization layer now resolves chart, matrix, and heat-surface meaning through `VisualizationFallbackContract`, `VisualizationTableContract`, and `VisualizationParityProjection`, so summary text, table fallback, current selection, units, filter context, and freshness posture all stay on one parity tuple and degraded visuals fail closed into table, summary, or placeholder posture.
- Patient-facing degraded mode now resolves through one `PatientDegradedModeProjection` over `PatientPortalEntryProjection`, `PatientSectionSurfaceState`, `PatientExperienceContinuityEvidenceProjection`, `ReleaseRecoveryDisposition`, `RouteFreezeDisposition`, `PatientActionRecoveryProjection`, `PatientIdentityHoldProjection`, `WritableEligibilityFence`, `PatientEmbeddedSessionProjection`, and `ArtifactFallbackDisposition`, so home, requests, records, messages, embedded routes, and artifact handoff preserve the same anchor, last safe summary, and next safe action instead of diverging into generic errors or stale CTAs.

Summary-layer corrections required to keep the programme cards aligned with the operations-to-governance handoff seam:

- The operations summary now treats governed intervention as a typed handoff through `OpsGovernanceHandoff`, `OpsReturnToken`, and authoritative `OpsInterventionSettlement`, not as a second hidden admin workflow inside the control room.
- The governance summary now requires `GovernanceOpsHandoffContext` before an ops-originated anomaly may reopen draft, approval, promotion, rollback, or stabilization posture.
- Runtime and release summaries now treat operations-to-governance writability as one published `GovernedControlHandoffBinding` over current audience bindings and exact publication parity, rather than as two separate shell-local checks.

Summary-layer corrections required to keep the programme cards aligned with the release watch tuple:

- Runtime and release summaries now treat post-promotion watch as one published `ReleaseWatchTuple` plus one `WaveObservationPolicy`, not as a bare `watchTupleHash` with adjacent dashboards and operator commentary.
- Governance and operations summaries now require the same `ReleaseWatchTuple`, `WaveActionSettlement`, and observation-window posture before widen, rollback, or stabilization can appear complete.
- Admin, governance, assurance, and release summaries now treat config approval as one immutable `ConfigCompilationRecord` plus one exact `ConfigSimulationEnvelope`, not as editable draft state with adjacent compile and simulation tabs.
- Promotion summaries now require `GovernanceReviewContext`, `ApprovalEvidenceBundle`, `ReleaseApprovalFreeze`, and `PromotionIntentEnvelope` to carry the same `compilationTupleHash`; drift invalidates approval rather than silently reusing prior evidence.

Summary-layer corrections required to keep the programme cards aligned with shell-family ownership:

- Front-end summaries now treat shell continuity as one typed ownership model through `ShellFamilyOwnershipContract` and `RouteFamilyOwnershipClaim`, not as route-prefix convention or layout resemblance.
- Patient, workspace, hub, pharmacy, operations, and governance child routes now stay inside their owning shell family as same-shell child, peer, or bounded-stage states unless a declared hard boundary is published.
- Feature domains may still contribute projections, artifacts, and child actions, but summary docs may no longer imply that those contributions create a second shell or detached workflow for the same governing object.

Summary-layer corrections required to keep the programme cards aligned with migration governance:

- Runtime and release summaries now treat schema evolution and projection rebuilds as one governed `MigrationExecutionBinding`, not as scripts or dashboard-side operations outside the product contract.
- Governance and frontend summaries now require `MigrationActionSettlement`, migration observation posture, and route-scoped `ProjectionReadinessFence` before cutover or backfill work can appear complete or routes can recover to calm live posture.

Summary-layer corrections required to keep the programme cards aligned with the expanded continuity-proof catalogue:

- Phase 0 now names `patient_nav`, `record_continuation`, `more_info_reply`, `conversation_settlement`, `support_replay_restore`, `intake_resume`, `booking_manage`, `hub_booking_manage`, `assistive_session`, `workspace_task_completion`, and `pharmacy_console_settlement` as canonical continuity-control families rather than as phase-local shell details.
- Phase 1 draft save, resume, and rebind posture are now summarized as `DraftContinuityEvidenceProjection`-governed continuity, not as calm local autosave semantics.
- Phase 4 appointment manage calmness and recovery are now summarized as `BookingContinuityEvidenceProjection`-governed continuity rather than route-local success language.
- Phase 3 and Phase 8 workspace completion plus visible assistive posture are now summarized as one linked proof chain through `WorkspaceContinuityEvidenceProjection` and `AssistiveContinuityEvidenceProjection`.
- Phase 6 pharmacy console settlement and the audited top-level baseline now treat `PharmacyConsoleContinuityEvidenceProjection` as part of the same `PL_CONT` evidence loop, so pharmacy-shell settlement no longer sits outside the assurance taxonomy.
- Phase 6 now distinguishes transport acceptance, provider acceptance, and authoritative dispatch proof through one immutable pharmacy dispatch-proof chain plus a shared patient, staff, and ops truth projection, so summary layers cannot imply `referred` calmness from mailbox delivery or weak acknowledgements alone.

## Card 1: Phase 0 - The Foundation Protocol

**Goal**  
Build the stable core before any serious feature work. Create the canonical domain objects and control primitives: `SubmissionEnvelope`, `Request`, `EvidenceSnapshot`, `EvidenceCaptureBundle`, `EvidenceDerivationPackage`, `EvidenceRedactionTransform`, `EvidenceSummaryParityRecord`, `EvidenceAssimilationRecord`, `MaterialDeltaAssessment`, `IdempotencyRecord`, `ReplayCollisionReview`, `IdentityBinding`, `AccessGrant`, `AccessGrantScopeEnvelope`, `AccessGrantRedemptionRecord`, `AccessGrantSupersessionRecord`, `ContactRouteSnapshot`, `ReachabilityObservation`, `ReachabilityAssessmentRecord`, `DuplicateCluster`, `RequestLifecycleLease`, `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `AdapterDispatchAttempt`, `AdapterReceiptCheckpoint`, `QueueRankPlan`, `QueueRankSnapshot`, `QueueRankEntry`, `QueueAssignmentSuggestionSnapshot`, `CapacityReservation`, `ExternalConfirmationGate`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, `AssuranceSliceTrustRecord`, `ReleaseWatchTuple`, `WaveObservationPolicy`, `MigrationExecutionBinding`, `Task`, `Communication`, `AuditEvent`, `RequestClosureRecord`, and the coordinator-owned `LifecycleCoordinator` boundary that alone derives canonical closure and milestone change.

High-priority foundation-card defects in this summary layer:

1. the phase goal named core objects but left `LifecycleCoordinator`, closure-blocker ownership, and canonical closure derivation implicit
2. adapter boundaries were listed by dependency only, without inbox or outbox, idempotency, capability, and degraded-mode contracts
3. shell setup was framed as scaffolding only, which could permit phase-0 page silos that violate `PersistentShell`, continuity, and projection-visibility law later
4. the algorithm proved nominal request creation but not the unhappy-path invariants later phases depend on: duplicate replay, quarantine, fallback review, repair hold, and confirmation-gate blocking
5. release hardening named provenance and rollback tools separately, but did not freeze artifacts, bundle hashes, schemas, migrations, and environment compatibility as one promotable foundation unit

**Platform work**  
Map the core cleanly to the domain-first, FHIR-integrated platform shape from the blueprint: domain transaction store plus governed FHIR representation storage, object store for files and audio, event bus, and immutable audit. Put every external dependency behind an adapter boundary:

- `IdentityAdapter`
- `GpSystemAdapter`
- `MessagingAdapter`
- `TelephonyAdapter`
- `NotificationAdapter`
- `ServiceDiscoveryAdapter`

Each adapter boundary must ship with one `AdapterContractProfile` that makes its inbox checkpointing, outbox replay, idempotency policy, supported capability matrix, auth material, and `DependencyDegradationProfile` explicit. No feature team may infer supplier or channel behavior ad hoc from transport success alone.

Stand up the runtime and release control plane in the same phase: contract registry, migration runner, preview environments, signed build provenance, published `RuntimeTopologyManifest`, typed `RuntimeWorkloadFamily` and `TrustZoneBoundary` declarations, per-audience `GatewayBffSurface`, `RuntimePublicationBundle`, per-surface `AudienceSurfaceRuntimeBinding`, exact `ReleasePublicationParityRecord`, published `ReleaseWatchTuple`, `WaveObservationPolicy`, and canary or rollback harness.

Stand up the design-contract publication plane in the same phase as well. Every live audience surface must publish one `DesignContractPublicationBundle` backed by one `DesignTokenExportArtifact`, one `TokenKernelLayeringPolicy`, one `ProfileSelectionResolution`, one `SurfaceStateKernelBinding`, and one fail-closed `DesignContractLintVerdict`, and every `FrontendContractManifest`, `AudienceSurfaceRuntimeBinding`, and `RuntimePublicationBundle` must carry those refs and digests so token lattice, shell profile selection, state semantics, automation markers, telemetry names, and artifact posture cannot drift behind code generation, CSS variables, or local test IDs.

Stand up the route and settlement substrate in the same phase as well. Every mutating route must present one `RouteIntentBinding` that pins one exact target tuple, every post-submit mutation must write one `CommandActionRecord` and `CommandSettlementRecord`, and every mutable channel or embedded surface must pin one `ReleaseApprovalFreeze` plus `ChannelReleaseFreezeRecord` before writable posture is exposed. Every browser-facing route family must also publish one `FrontendContractManifest` enumerating its allowed `ProjectionQueryContract`, `MutationCommandContract`, `LiveUpdateChannelContract`, and `ClientCachePolicy` set, and every route family must resolve one exact `ProjectionContractVersionSet` plus `projectionCompatibilityDigestRef` before live or calm read posture is trusted. Route contract, frontend manifest, surface publication, runtime bundle, provenance, recovery disposition, canonical object descriptor, current governing-object version, projection compatibility tuple, and parent anchor may not be checked piecemeal; writable posture requires one current `AudienceSurfaceRuntimeBinding` with parity still exact.

Stand up the canonical governors in the same phase as well, because later cards assume them rather than re-inventing them:

- `LifecycleCoordinator`
- `AccessGrantService`
- `EvidenceAssimilationCoordinator`
- `SafetyOrchestrator`
- `ReachabilityGovernor`
- `IdentityRepairOrchestrator`
- `AssuranceSupervisor`
- `ScopedMutationGate`
- `ExceptionOrchestrator`
- `ReservationAuthority`
- `QueueRankingCoordinator`

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

These are not throwaway shells. Phase 0 front-end scaffolding must already obey the canonical shell law: one `PersistentShell` per audience family, continuity-safe route families, shared status rendering through `AmbientStateRibbon` plus `FreshnessChip`, governed `VisibilityProjectionPolicy`, stable `CasePulse` or equivalent header truth, and `SelectedAnchor` preservation so later phases extend the same runtime shell rather than replacing prototypes.

**Phase algorithm**

1. Define the canonical intake and request contracts with explicit `SubmissionEnvelope`, workflow, safety, identity, lease, reservation, and external-confirmation state axes.
2. Implement commands, immutable evidence snapshots, immutable source bundles and derivation packages, summary-parity proof, immutable domain events, and the non-negotiable invariants around `IdempotencyRecord`, `ReplayCollisionReview`, `IdentityBinding`, `AccessGrant`, `DuplicateCluster`, `RequestLifecycleLease`, `LineageFence`, `RouteIntentBinding`, `CommandActionRecord`, `CommandSettlementRecord`, `AdapterDispatchAttempt`, `AdapterReceiptCheckpoint`, `ReleaseApprovalFreeze`, `ChannelReleaseFreezeRecord`, `AssuranceSliceTrustRecord`, `RequestClosureRecord`, and coordinator-owned blocker evaluation.
3. Build `LifecycleCoordinator`, `AccessGrantService`, `ScopedMutationGate`, `ReservationAuthority`, and projection rebuild logic before feature endpoints depend on them.
4. Create local simulators for NHS login, IM1, MESH, telephony, and notifications.
5. Mount shell UIs against seed data under the continuity and visibility laws that later audience routes will inherit.
6. Prove a synthetic request can be created, duplicate-replayed, quarantined, routed to fallback review, held behind identity or confirmation blockers, and audited end to end while canonical closure remains coordinator-owned.
7. Promote one signed `ReleaseCandidate` with a frozen `ReleaseApprovalFreeze` tuple binding artifact digests, approved bundle hashes, exact config `compilationTupleHash`, surface schemas, bridge capabilities, migration posture, projection backfill plan, and environment-compatibility evidence, then publish one `ReleaseWatchTuple` plus one `WaveObservationPolicy` for each wave step before any later phase depends on the delivery system.

**Tests that must pass**

- domain transition tests
- event-schema compatibility tests
- idempotency tests for create and update commands
- exact-versus-semantic replay tests
- collision-review tests for reused identifiers with divergent payload or scope
- route-intent tuple parity tests proving stale route context degrades to same-shell recovery instead of mutating a sibling or superseded governing object
- projection-freshness-envelope tests proving transport reconnect, poll success, or buffered deltas cannot masquerade as fresh truth or silently re-enable guarded actions
- adapter inbox or outbox replay and degraded-profile tests
- duplicate callback and out-of-order receipt tests proving one authoritative settlement chain per external effect
- queue-rank snapshot replay tests proving the same fact cut plus the same `QueueRankPlan` yields the same queue order and explanation payloads
- authz deny-by-default tests
- access-grant family-drift, exact-once redemption, and supersession-chain tests
- audit immutability tests
- scoped-mutation-gate tests across patient, staff, support, and operations contexts
- projection rebuild tests
- duplicate-cluster, fallback-review, and quarantine scenario-proof tests
- lease fencing and stale-action rejection tests
- closure-blocker emptiness and coordinator-owned closure derivation tests
- schema migration dry-run, observed route-convergence, and rollback-compatibility tests
- SBOM and signed-artifact verification
- release-candidate freeze, environment-compatibility, and promotion-intent tests
- release-watch-tuple, observation-policy, and wave-settlement lineage tests
- runtime-topology publication, trust-zone boundary, tenant-isolation, and egress-allowlist tests
- preview environment smoke tests
- non-production canary rollback rehearsal
- backup and restore rehearsal
- automated accessibility tests on all shells

**System after Phase 0**  
A thin but stable platform exists. Nothing is smart yet, but every later phase plugs into the same spine instead of rewriting it, and the delivery system can promote or reverse change safely.

That same spine now governs control-room escalation as well: operations diagnosis may hand off only through `OpsGovernanceHandoff`, governance review may reopen writable authority only through `GovernanceOpsHandoffContext`, and both shells remain subordinate to one published `GovernedControlHandoffBinding` plus exact publication parity.

The runtime boundary is also explicit from the start: one governed entry plane, typed workload families, published trust-zone boundaries, tenant isolation, and egress posture exist before feature teams add audience behavior on top.

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

- create one immutable `SubmissionPromotionRecord` that maps the envelope lineage to the request exactly once
- promote the envelope into the canonical request exactly once
- supersede active draft-resume grants and `DraftSessionLease`s in the same transaction as promotion
- freeze an immutable submission snapshot
- normalise free text into the canonical request shape
- persist attachments into object storage plus `DocumentReference`
- run the rule-based safety gate
- either divert to urgent advice or open a triage task

Keep the red-flag engine rules-first in this phase, and keep drafts in `SubmissionEnvelope` rather than as `Request.workflowState = draft`.

**Front-end scope**  
Turn the patient shell into a real portal built as a low-noise intake frame:

- one-question-at-a-time mission frame rather than a dense wizard
- autosave surfaced through one quiet status strip, but only as authoritative when `DraftContinuityEvidenceProjection` still validates the same lineage
- file upload with bounded inline evidence states
- contact preference editor
- urgent diversion state in the same shell lineage
- same-shell receipt surface
- minimal `track my request` page
- sign-in uplift, refresh, and resume that preserve the same shell while the `SubmissionEnvelope` lineage is unchanged

**Phase algorithm**

1. Patient starts or resumes a draft on the canonical `SubmissionEnvelope` under one active `DraftSessionLease`.
2. UI validates required fields and uploads files; authoritative `saved` or writable resume posture depends on `DraftContinuityEvidenceProjection`, not local calmness alone.
3. Server freezes one submission snapshot, creates one immutable `SubmissionPromotionRecord`, promotes the envelope once, supersedes draft-resume grants and leases, and normalises payload into canonical request input.
4. Safety rules run synchronously after one immutable `EvidenceClassificationDecision` is settled for the submitted batch.
5. If red flag, append `SafetyPreemptionRecord` plus `SafetyDecisionRecord`, show urgent advice through the same patient journey lineage, and move from `urgent_diversion_required` to `urgent_diverted` only after one `UrgentDiversionSettlement` is durably issued.
6. If not red flag, settle `SafetyDecisionRecord(requestedSafetyState = screen_clear | residual_risk_flagged)`, move the request to `triage_ready`, create one triage task, generate ETA, and send confirmation.
7. Do not expose patient `add more detail later` until the later re-safety loop exists.

**Tests that must pass**

- full decision-table coverage for red-flag rules
- malicious upload blocking
- duplicate-submit idempotency
- browser-refresh-before-settlement replay tests
- divergent-key-reuse collision-review tests
- no-dual-write draft consistency tests
- exactly-once envelope-to-request promotion mapping tests
- stale draft-token and auth-return tests proving a promoted envelope cannot reopen as a second mutable draft
- classification-decision and fail-closed degraded-artifact tests
- urgent-required-versus-urgent-issued tests
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
- frozen `AuthTransaction`, `AuthScopeBundle`, and `PostAuthReturnIntent`
- token validation
- deterministic `SessionEstablishmentDecision` and local session creation
- session expiry
- logout
- append-only `IdentityBinding` decisions through `IdentityBindingAuthority` and governed repair path
- request-claim token revocation and canonical grant scope, redemption, and supersession control

**Telephony scope**

- IVR webhook ingestion
- caller verification flow
- audio storage
- transcript stub and audio-derived safety facts
- optional SMS continuation link through canonical `AccessGrant`
- seeded versus challenge continuation modes with bounded capability ceilings
- reuse of the same request creation API used by the web flow

Use `IdentityBindingAuthority`, `IdentityBinding`, and `AccessGrantService` as the only cross-phase authorities here. Authentication, phone verification, support correction, or continuation redemption must not directly overwrite `Request.patientRef`, `Episode.patientRef`, or widen a patient grant outside the canonical Phase 0 rules, and every grant must remain bound to one immutable scope envelope plus one exact-once redemption or supersession chain. Wrong-patient suspicion must converge on one shared `IdentityRepairSignal -> IdentityRepairFreezeRecord -> IdentityRepairBranchDisposition[] -> IdentityRepairReleaseSettlement` chain so auth, support, secure-link, and downstream domains all freeze and recover from the same correction posture.

**Front-end scope**

- real sign-in flow
- signed-in request creation
- signed-out recovery states
- status tracker
- mobile SMS continuation flow for callers adding detail after the call

**Phase algorithm**

1. User signs in through NHS login callback under one frozen `AuthTransaction` and `PostAuthReturnIntent`.
2. Service validates claims, submits match evidence to `IdentityBindingAuthority`, evaluates `PatientLink` and `CapabilityDecision` against the settled binding version, settles one `SessionEstablishmentDecision`, creates or rotates the local session, and only then executes claim or writable resume through `RouteIntentBinding` plus canonical grant rotation.
3. Caller enters IVR, selects request type, verifies identity, records issue, and only receives seeded or challenge-based SMS continuation `AccessGrant` after `TelephonyContinuationEligibility` settles from the current evidence-readiness verdict and handset control.
4. Phone payload is normalised into the same request schema as web only after `TelephonyUrgentLiveAssessment`, `TelephonyTranscriptReadinessRecord`, and `TelephonyEvidenceReadinessAssessment` together prove the evidence is safety-usable for routine promotion.
5. Safety gate runs on the full evidence set for both channels.
6. Request enters the same triage queue and status model.
7. If duplicate evidence is attached into an open request only as a proven same-request continuation, append a fresh `EvidenceClassificationDecision`, rerun safety, and advance the current `safetyDecisionEpoch` before routine flow continues.

**Tests that must pass**

- auth callback replay protection
- nonce and state validation
- logout and session expiry tests
- identity mismatch handling
- IVR webhook contract tests
- duplicate webhook idempotency
- audio storage integrity tests
- stale-public-token revocation tests
- seeded-versus-challenge continuation `AccessGrant` tests
- no-direct-`patientRef`-or-binding-overwrite tests across login, support-correction, and continuation paths
- exact-once grant redemption and supersession tests across claim, secure-link, continuation, and support reissue paths
- wrong-patient repair convergence tests across auth subject conflict, support correction, secure-link conflict, and downstream branch release
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
- versioned queue ranking and explanation snapshots
- duplicate detection
- duplicate clustering and governed attach or merge review
- clinician notes
- more-info requests
- escalation routing
- endpoint selection

Treat `same_episode_candidate` as a clustering signal, not as proof that two requests can be merged or attached. Any `DuplicateCluster(review_required)` must surface explicit review work and block silent attach or merge assumptions until resolved. Replay collapse, same-request attach, and same-episode review now use separate authorities: `IdempotencyRecord` for replay, `DuplicatePairEvidence` for immutable pair scoring, and `DuplicateResolutionDecision` for append-only attach or separate outcomes with explicit continuity witness and candidate-competition proof.

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

This phase summary now inherits the canonical staff workspace shell rather than implying a standalone queue page. Queue list, detail panel, approval modal, downstream handoff, and any later assistive stage must remain inside one `PersistentShell` with `StaffWorkspaceConsistencyProjection`, `WorkspaceSliceTrustProjection`, one current `WorkspaceTrustEnvelope`, `DecisionDock`, `CasePulse`, and `SelectedAnchor` preservation. Late evidence and urgent interruption must also stay same-shell through `WorkspaceSafetyInterruptProjection` or the equivalent patient interruption surface, so stale calmness cannot outrun the current `SafetyDecisionRecord`.

**Phase algorithm**

1. Materialize one committed `QueueRankSnapshot` from durable facts and one versioned `QueueRankPlan`, then derive row order, explanations, and reviewer suggestions from that same snapshot rather than ad hoc browser or reviewer-local sort.
2. Staff member opens a request under `StaffWorkspaceConsistencyProjection`, reviews summary and full context, and inherits the active `WorkspaceSliceTrustProjection` through one current `WorkspaceTrustEnvelope` before live actions remain enabled.
3. If information is missing, send a structured question set and pause the task.
4. If suspected duplicates exist, create or update `DuplicateCluster` review work rather than silently merging or attaching adjacent requests unless canonical replay or attach proof already exists.
5. When the patient replies, capture a new evidence snapshot and rerun safety.
6. If re-safety raises urgent risk, escalate immediately instead of dropping the case back into routine review.
7. When enough information exists, select endpoint: admin, self-care, message or callback, pharmacy, or booking handoff, but only through `ReviewActionLease` so stale queue rank, ownership, lineage, or review-version drift fails closed.
8. While the clinician is composing, comparing, confirming, or reviewing deltas, hold disruptive refresh behind `WorkspaceFocusProtectionLease`, `ProtectedCompositionState`, and `DeferredUIDelta` so the active decision posture, draft, compare target, and quiet-return posture do not churn underneath the operator.
9. If assistive guidance is enabled later, show it only as a bounded `AssistiveWorkspaceStage` inside the same shell and never as an autonomous competing rail.
10. If action is clinically irreversible, require an explicit approval step and audit it.
11. Close the task or hand it off downstream only after `TaskCompletionSettlementEnvelope` confirms authoritative downstream settlement or governed recovery; `WorkspaceTrustEnvelope` must still hold `completionCalmState != eligible` until that proof lands, and the shell must not visually launch the next task early.

**Tests that must pass**

- queue ordering determinism
- queue-snapshot replay and rebuild determinism
- concurrent assignment tests
- reviewer-suggestion isolation tests proving assignment fit cannot rewrite canonical ordinals
- workspace-consistency and trust-projection parity tests across queue, detail, and approval surfaces
- `same_episode_candidate` never auto-merges or auto-attaches without governed confirmation and the canonical attach thresholds
- duplicate-cluster review gating
- candidate-competition and continuity-witness tests proving near-equal duplicate targets fail closed into review
- review-action-lease stale-fence rejection tests
- workspace-focus-protection buffering, invalidation, and quiet-return tests during compose, compare, and approve flows
- mixed-snapshot queue, preview, and next-task recovery tests
- workspace-trust-envelope tests proving queue truth, task truth, trust posture, buffered interruption pacing, and completion calmness stay locked to one current envelope and fail closed on drift
- preview-prefetch cancellation tests proving fast scan, queue drift, and focus protection cannot warm stale next-task launch state
- authoritative delta-packet tests proving resumed review, changed-since-seen cues, and promoted evidence context all agree on the same change set
- safety-classification and safety-epoch fence tests proving late evidence freezes stale calm actions and next-task progression
- audit completeness on overrides and approvals
- re-safety-to-urgent-escalation tests
- no-next-task-launch-before-settlement tests
- stable-next-task-blocking-reason tests proving the CTA stays pinned with exact blockers instead of auto-advance or toast-only state
- superseded-judgment-context and quiet-return tests proving old decision context stays visible until recommit and promoted detail does not linger after resolution
- end-to-end paths for admin resolution, self-care resolution, callback resolution, and urgent escalation
- staff accessibility tests

**System after Phase 3**  
The intake system becomes a working practice workflow system instead of just a form receiver.

## Card 5: Phase 4 - The Booking Engine

**Goal**  
Make booking real only after triage is stable. This phase implements local slot search, patient choice, confirmation, reminders, cancel, reschedule, and waitlist entry.

**Integration approach**  
Use an IM1-first adapter design with a provider capability matrix keyed by supplier and tenant. Build around IM1 capability rather than GP Connect assumptions, compile one authoritative `BookingCapabilityResolution` plus `BookingCapabilityProjection` for patient and staff actionability, and keep all user-visible slot exclusivity behind canonical `ReservationAuthority` plus `CapacityReservation`.

**Back-end scope**

- `SlotSearch`
- `Book`
- `Cancel`
- `Reschedule`
- `WaitlistJoin`

Additional requirements:

- attach version and timestamp metadata to slot lists
- distinguish self-service, staff-assistable, and currently non-bookable supply
- bind booking, manage, and assisted-booking CTA exposure to the same current capability tuple, adapter profile, and fallback contract
- revalidate at confirm time to avoid stale booking
- create no appointment record until booking has authoritative supplier success or same-commit read-after-write proof
- create or refresh `ExternalConfirmationGate` whenever supplier truth is async, weak, or disputed
- create or refresh one `BookingConfirmationTruthProjection` so pending, reconciliation, booked summary, manage exposure, and artifact readiness all resolve through the same authoritative booking-outcome contract
- add compensation flows for partial failure
- default to one active truthful offer per released slot unless true hold support or audited bounded truthful-nonexclusive policy allows more
- create `WaitlistDeadlineEvaluation`, `WaitlistFallbackObligation`, and `WaitlistContinuationTruthProjection` so deadline safety, offer expiry, and callback or hub fallback debt stay authoritative across accepted, expired, or superseded waitlist offers

**Front-end scope**

- patient slot picker
- confirmation page
- confirmation-pending state
- cancellation screens
- reschedule screens
- reminder preferences
- staff booking handoff panel

**Phase algorithm**

1. Triage outputs `appointment required`.
2. System checks the provider capability matrix for the tenant.
3. System fetches candidate slots and keeps both self-service and staff-assistable supply visible to the right audience.
4. User selects a slot, the system creates or refreshes a focused `CapacityReservation` for that chosen `capacityUnitRef`, and then revalidates it.
5. System sends the booking command and waits for authoritative supplier success, authoritative read-after-write proof, or explicit pending state.
6. Only on authoritative supplier success or authoritative read-after-write proof, with any `ExternalConfirmationGate` cleared and either a durable provider reference or same-commit read-after-write proof present, does the system create the appointment record and send final confirmation.
7. If confirmation is ambiguous, move to reconciliation or `confirmation_pending` instead of retrying blindly.
8. If revalidation fails or no slots exist, stay in local waitlist only while the current deadline evaluation still makes that continuation safe; otherwise rotate immediately into the governed callback or hub fallback path.

Visible reservation language must come from one current `ReservationTruthProjection`. Selection TTL, offer expiry, or pending UI state alone may not imply exclusivity; only a real held reservation may do that.

Booked reassurance, reminder readiness, appointment-manage actionability, and receipt or export readiness must come from one current `BookingConfirmationTruthProjection`. Local acknowledgement, provider 202-style acceptance, detached appointment rows, or reminder queueing alone may not imply confirmed booking truth.

Local booking order and patient slot cues must come from one current `CapacityRankProof` plus candidate `CapacityRankExplanation` rows under the appropriate `CapacityRankDisclosurePolicy`. Grouped-by-day presentation, compare mode, or local filters may not re-score, renumber, or invent new `soonest` or `best match` language.

**Tests that must pass**

- provider capability matrix tests
- booking capability projection and wrong-adapter rejection tests
- slot normalisation across suppliers
- stale-slot revalidation tests
- patient-versus-staff slot visibility tests
- no-implied-exclusivity-without-held-reservation tests
- reservation-truth projection tests for booking and waitlist surfaces
- booking-confirmation-truth projection tests for booking-in-progress, confirmation-pending, reconciliation-required, confirmed, and no-premature manage or artifact exposure
- no-appointment-record-before-confirmation tests
- confirmation-pending and external-confirmation-gate tests
- waitlist race tests
- waitlist deadline-evaluation and fallback-obligation preservation tests
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
- compile hub coordination policy as one explicit tuple over routing, variance-window, service-obligation, practice-visibility, and capacity-ingestion packs
- rank alternative slots across sites and solve one optimized open-choice offer set instead of a raw top-`K`
- add SLA timers
- add `offer alternative`, `callback`, and `urgent escalate back` branches
- emit state-accurate patient and practice continuity messages on each material state change, with evidence-bound delivery and generation-bound acknowledgement
- reuse the same canonical `ReservationAuthority`, `capacityUnitRef`, and `ExternalConfirmationGate` model as local booking
- bind local-booking and network-hub ordering, reason cues, staff explanation, support replay, and operations drill paths to one persisted `CapacityRankProof` plus `CapacityRankExplanation` and `CapacityRankDisclosurePolicy`
- bind `AlternativeOfferSession`, selected candidate, commit attempt, confirmation gate, appointment truth, fallback linkage, and practice visibility to one monotone `HubOfferToConfirmationTruthProjection`
- keep callback as a separate fallback card and preserve regenerated or expired offer sets as read-only provenance rather than covertly funneling the patient into a new single path
- use explicit ownership, external-confirmation, transport-acceptance, delivery-evidence, and generation-bound practice-acknowledgement fields so practice and hub actions are never ambiguous

**Front-end scope**

- dedicated coordination console
- timeframe filters
- need summaries
- rank-ordered option cards
- escalation banner
- patient comms panel
- clear confirmation-pending, practice-ack, and closure-blocker actions

**Phase algorithm**

1. Local booking fails or is bypassed by a routing rule.
2. System creates `NetworkBookingRequest` with priority, timeframe, and constraints.
3. System loads one compiled hub policy tuple and records one `NetworkCoordinationPolicyEvaluation` that separates routing, approved variance, service obligations, practice visibility, and capacity-ingestion decisions.
4. Hub console ranks options across network sites using only the routing, variance, and capacity-admission outputs from that frozen policy tuple.
5. If a suitable slot exists, coordinator solves one diverse open-choice alternative set with one separate callback fallback card, or starts hub booking against the same canonical reservation model used locally and records evidence.
6. Manual or weakly evidenced hub entry moves the case to `confirmation_pending`; it does not create a booked state, satisfy practice visibility, or final patient assurance text by itself.
7. Only after authoritative confirmation, gate clearance, and a still-current `HubOfferToConfirmationTruthProjection.truthTupleHash` does the system create booked truth, open the current-generation practice visibility obligation, and notify patient and practice with wording that matches the actual confirmation and acknowledgement state.
8. The case remains open until the current-generation origin-practice visibility obligation, any callback or return linkage debt, and any superseded-offer or stale-selection blockers named by `HubOfferToConfirmationTruthProjection` have been satisfied or explicitly governed; stale-generation, stale-tuple, policy-stale, or transport-only evidence may not silently clear that debt.
9. If no suitable slot exists but alternatives are acceptable, present the next-best option.
10. If the case is too urgent, bounce back to the duty clinician path immediately.

**Tests that must pass**

- cross-site access control tests
- timer escalation tests
- no-orphan-booking-request tests
- ranking correctness tests
- hub-policy-family replay and drift tests
- shared-slot oversubscription protection across local, waitlist, and hub flows
- no-booked-state-before-independent-confirmation tests
- no-final-patient-assurance-before-gate-clearance tests
- no-stale-offer-or-selection tests across patient choice, commit, practice acknowledgement, and closure
- no-close-before-practice-ack tests
- no-transport-only-practice-ack-clearance tests
- no-stale-generation-practice-ack-clearance tests
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
- pharmacy discovery through directory source snapshots and provider-capability snapshots
- transport-neutral referral pack generation
- transport-bound dispatch plan, proof chain, and adapter binding
- outcome ingest
- bounce-back reopen logic

Service discovery should rank on:

- opening state
- service suitability
- geography
- organisational validity

Keep dispatch idempotent because endpoints and message routes can retry. Keep full provider choice visible unless a provider is truly invalid for the referral, and do not let transport fallback or adapter preference silently reshape the patient-visible order.
Persist one `PharmacyChoiceProof` plus `PharmacyChoiceDisclosurePolicy` so patient and staff surfaces reuse the same visible order, recommended frontier, warned-choice explanation, and suppressed-unsafe summary.

**Front-end scope**

- patient pharmacy choice
- same-shell consent renewal and withdrawal reconciliation checkpoint
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
5. If eligible, discover valid pharmacies through one frozen directory tuple, mint one transparent choice proof and explanation set, rank them, and still preserve full patient choice.
6. Patient selects a pharmacy.
7. If the selected provider is warned or policy-overridden, system captures one explicit warned-choice acknowledgement and binds it to the later consent and dispatch path.
8. System captures provider-, pathway-, scope-, and selection-binding-aware referral consent through one authoritative checkpoint and preserves the chosen pharmacy in place if renewal or withdrawal reconciliation is required.
9. System freezes one transport-neutral referral package, resolves one transport-bound dispatch plan, and dispatches only while the current consent checkpoint, selected-provider binding, and dispatch-plan tuple remain satisfied.
10. Await outcome. High-confidence resolved outcomes may close the case only when no active `PharmacyOutcomeReconciliationGate` remains; low-confidence, contradictory, or unmatched outcomes must open or refresh that gate and block closure until resolved, while no-contact, urgent, onward-referral, or post-dispatch consent revocation paths reopen or queue review instead of auto-closing.

**Tests that must pass**

- full decision-table tests for all pathway rules
- no-unsafe-downgrade tests
- dispatch idempotency tests
- service discovery contract tests
- full-choice exposure tests
- patient-staff choice-explanation parity tests
- warned-choice acknowledgement binding tests
- consent-checkpoint expiry, supersession, and withdrawal-reconciliation tests
- outcome reconciliation tests
- reconciliation-gate and no-false-completion tests
- no-auto-close-on-no-contact tests
- reopen and bounce-back tests
- end-to-end flows for eligible referral, ineligible fallback, and failed dispatch recovery

**System after Phase 6**  
The triage system now resolves a real subset of cases through pharmacy without forcing every case into GP appointment demand, leaking stale pharmacy consent into dispatch or reassurance, or silently burying unresolved pharmacy returns.

## Cross-cutting work package: End-to-end joining layer

**Goal**  
Close the product-level gaps that sit across phases without rewriting core domain phases.

**Scope**

- freeze one web route and shell contract for patient, workspace, hub, and ops surfaces
- define one unified patient account and communication timeline model
- define one unified staff inbox and start-of-day model
- define full callback and clinician-message lifecycle contracts
- define governed self-care content and admin-resolution lifecycle contracts around `SelfCareBoundaryDecision`, `SelfCareExperienceProjection`, and `AdminResolutionExperienceProjection`
- define platform admin/config/comms/access governance surfaces
- define support-desk action model for safe recovery workflows

This joining layer must now also freeze one shared shell-truth contract across all audiences: `PersistentShell`, `VisibilityProjectionPolicy`, continuity-safe route families, watch or freeze posture, and bounded assistive staging. Patient, workspace, hub, ops, governance, and support shells must all assemble from their governing consistency projections rather than phase-local reads, and each surface must expose degraded, stale, or frozen state explicitly instead of silently dropping capability.

**Exit state**  
Phase outputs behave as one coherent product system instead of a set of adjacent workflows.

## Card 8: Phase 7 - Inside the NHS App (Deferred channel expansion)

**Goal**  
Integrate the existing web portal into the NHS App after the core web platform and cross-cutting joining layer are complete.

**Back-end scope**

- versioned route manifest and jump-off control
- signed channel-context and trusted embedded detection
- SSO bridge and session continuity
- embedded layout policy and bridge capability negotiation
- environment config for Sandpit and AOS pinned to manifest fingerprint
- privacy-safe telemetry for NHS App entry journeys plus release guardrails
- embedded shell-consistency, placeholder, outbound-navigation, artifact-presentation, and route-freeze contracts
- route-scoped `PatientEmbeddedNavEligibility`, negotiated `BridgeCapabilityMatrix`, and lease-cleared `BridgeActionLease` for all bridge-backed embedded actions
- channel-bound `BinaryArtifactDelivery`, `ArtifactByteGrant`, and one live `ArtifactModeTruthProjection` for webview-safe preview, byte delivery, and fallback posture

**Front-end scope**

- headerless embedded mode
- responsive breakpoints
- focus management
- error recovery when handoff state is missing or SSO is denied
- clean back-navigation
- capability-negotiated app bridge and byte-safe document delivery
- secure-link behaviour that works inside embedded web
- polished mobile-first patient flows
- same-shell truth rendering through `EmbeddedShellConsistencyProjection`, route-scoped placeholders, and governed route-freeze recovery

**Phase algorithm**

1. NHS App launches only approved manifest routes for the current environment.
2. Service validates signed embedded context, resolves trusted-versus-hint-only channel state, and strips `assertedLoginIdentity` from the URL before normal browsing continues.
3. Entry resolves through `EmbeddedShellConsistencyProjection`, so request, status, booking, and recovery routes inherit one same-shell truth envelope and freeze live CTA state when bundle or audience posture is stale.
4. SSO bridge establishes or recovers the right local session through fenced single-redemption handoff state and safe replay controls.
5. Deep-link resolution applies route-level `visibilityTierRef`, `summarySafetyTier`, and `placeholderContractRef` so delayed-release, step-up, wrong-patient, or recovery-held states degrade to governed placeholders rather than over-exposing or vanishing.
6. UI opens to the intended path in embedded mode through a capability-negotiated app bridge, and any external exit, overlay, browser handoff, native back override, or app-page navigation must resolve through route-scoped `PatientEmbeddedNavEligibility`, `BridgeActionLease`, and `OutboundNavigationGrant` with scrubbed destination and return-route binding.
7. Document and artifact journeys use `ArtifactPresentationContract`, `ArtifactSurfaceBinding`, `ArtifactModeTruthProjection`, `ArtifactTransferSettlement`, `ArtifactFallbackDisposition`, `BinaryArtifactDelivery`, `ArtifactByteGrant`, and `OutboundNavigationGrant`, remaining summary-first, parity-honest, byte-safe, continuity-safe, and return-safe before any preview, byte delivery, or external handoff is attempted.
8. User completes the journey without duplicate headers, duplicate footers, broken navigation, unsupported download behaviour, or generic hard-fail on frozen cohorts because `RouteFreezeDisposition` can degrade the route to placeholder, read-only, or safe-route recovery.
9. Telemetry records privacy-safe events for limited-release assurance, and rollout guardrails can freeze or disable cohorts without redeploy.
10. NHS App and standard web continue to use the same backend contracts.

**Tests that must pass**

- manifest-fingerprint parity across Sandpit and AOS
- trusted-embedded-context and spoofed-query tests
- no raw `assertedLoginIdentity` in logs, analytics, or browser history
- embedded-shell-consistency and stale-CTA freeze tests
- placeholder-contract tests for delayed-release, step-up, and recovery-held entry
- embedded-mode regression tests
- outbound-navigation-grant allowlist and return-binding tests
- runtime app-bridge capability tests
- artifact-presentation fallback tests
- artifact-mode truth tests for oversize delivery, stale return tuple, parity drift, and unsupported print or browser-only preview
- WCAG 2.2 AA audit
- Sandpit demo sign-off
- AOS demo sign-off
- limited-release telemetry-contract and guardrail verification
- route-freeze-disposition tests
- incident rehearsal
- full regression on all patient journeys

**System after Phase 7**  
The same patient portal now works as a standalone web product and as an NHS App-integrated channel.

---

## Card 9: Phase 8 - The Assistive Layer

**Goal**  
Add assistive AI to staff workflow while keeping the human approval boundary absolute.

High-priority summary-card defects in this phase:

1. the card describes capabilities, but not the per-run invocation gate, policy bundle, and kill-switch controls that decide whether a model may run or render at all
2. summary, suggestion, and note-draft outputs are listed, but their allowed composition paths and render-surface visibility boundaries are not defined
3. shadow mode is named, but the promotion path from shadow to visible use is not tied to explicit evaluation, drift, and degraded-trust controls
4. clinician interaction is described as edit or approve, but not as a lineage-fenced session that must freeze or regenerate when evidence or policy changes
5. the phase card omits the formal release and safety change-control needed before assistive capability can move from experiment to NHS-assured deployment

**Back-end scope**

- transcription pipeline
- summarisation
- endpoint suggestion
- note draft generation
- compiled policy bundle, invocation-grant, and tenant or environment kill-switch control plane
- capability-family composition policy and assistive visibility policy
- prompt and model version store
- evaluation store
- feature store integration
- suggestion envelopes and assistive sessions bound to review version, policy bundle, and lineage fence
- `AssistiveFeedbackChain`, `AssistiveArtifactActionRecord`, `OverrideRecord`, `HumanApprovalGateAssessment`, `FinalHumanArtifact`, and `FeedbackEligibilityFlag` bound to one settled human-review chain
- human override capture
- replayable inference logs
- replay-critical evidence policy
- drift, fairness, and degraded-trust monitoring
- immutable release candidate, safety-case delta, and regulatory change-control for visible assistive use
- `AssistiveSurfaceBinding`, `AssistiveWorkProtectionLease`, `SuggestionDraftInsertionLease`, `AssistiveCapabilityTrustProjection`, `AssistiveCapabilityTrustEnvelope`, `AssistiveCapabilityWatchTuple`, `AssistiveRolloutLadderPolicy`, `AssistiveRolloutSliceContract`, `AssistiveCapabilityRolloutVerdict`, and `AssistiveFreezeDisposition` control contracts

Start in shadow mode. Expose suggestions only to staff. Never let AI directly commit final clinical actions or final coded outcomes.

**Front-end scope**

- suggestion side panel
- diffable note draft
- approve controls
- reject controls
- explicit `edited by clinician` trail
- confidence and rationale display
- override-reason capture
- shadow, renderable, quarantined, or blocked provenance state
- `AssistiveCapabilityTrustEnvelope` posture for `shadow_only`, `degraded`, `quarantined`, `frozen`, `observe_only`, and `blocked_by_policy`
- stale-session freeze with regenerate-in-place recovery
- bounded recovery when policy freshness, trust, or visibility rules fail
- same-shell assistive staging with frozen and degraded capability posture rendered explicitly

**Phase algorithm**

1. Collect request context, history, attachments, and current queue state through `AssistiveSurfaceBinding` under the active review version and compiled policy bundle.
2. Resolve invocation eligibility, capability composition, visibility policy, and any tenant or environment kill-switch before minting an assistive run.
3. Run assistive models in shadow mode first and settle each run explicitly to shadow-only, renderable, quarantined, abstained, or blocked.
4. Compare model outputs against human decisions, build an evaluation set, and promote capabilities to visible staff use only when calibration, drift, fairness, and degraded-trust gates remain inside policy.
5. Expose summary, endpoint suggestion, and note draft through suggestion envelopes and assistive sessions bound to review version, policy bundle, lineage fence, one current `WorkspaceTrustEnvelope`, and one current `AssistiveCapabilityTrustEnvelope`.
6. While the clinician is editing, comparing, confirming, or reviewing deltas, hold disruptive assistive refresh behind `AssistiveWorkProtectionLease` so the rail cannot churn the active decision context.
7. Any one-click suggestion insertion must pass through `SuggestionDraftInsertionLease`, landing only as a bounded draft inside the active `DecisionDock` and failing closed on stale review, policy, or lineage fences.
8. If new evidence, duplicate resolution, identity repair, policy promotion, or release watch posture changes the allowed suggestion set, refresh the current `AssistiveCapabilityTrustEnvelope`, freeze stale assistive actions, and shift the surface through `AssistiveFreezeDisposition` to shadow-only, read-only, placeholder, or hidden mode as required.
9. Clinician edits, approves, rejects, regenerates, dismisses, or abstains through one `AssistiveFeedbackChain`; every visible gesture persists one authoritative `AssistiveArtifactActionRecord`, and materially reviewed artifacts also settle one `OverrideRecord` plus any required `HumanApprovalGateAssessment`.
10. Only the final human artifact may commit to workflow state, and trainability may turn green only after `FinalHumanArtifact` plus `FeedbackEligibilityFlag` settle on that same chain with no incident, supersession, or exclusion hold.
11. Persist the final human decision plus immutable model, prompt, input, output, settlement, trust posture, approval, override, and feedback-eligibility evidence for audit and replay.
11. Before any visible release widens, move the assistive bundle through immutable release-candidate, safety-case, and regulatory change control.

**Tests that must pass**

- offline evaluation thresholds on curated datasets
- regression tests on all red-flag cases
- hallucination and unsafe recommendation review
- invocation-grant, kill-switch, and surface-visibility tests
- blocked-composition and quarantined-settlement tests
- prompt snapshot replay tests
- no-autonomous-write tests
- assistive-surface-binding and audience-scope tests
- assistive-work-protection lease tests
- suggestion-draft-insertion stale-fence rejection tests
- fairness, drift, and degraded-trust dashboards
- stale-session fence and regenerate-in-place tests
- assistive-capability-trust-envelope tests across `shadow_only`, `degraded`, `quarantined`, `frozen`, `observe_only`, and `blocked_by_policy`
- human-approval audit tests
- one-gesture action-capture and feedback-chain supersession tests
- replay-linkage tests for all visible assistive artifacts
- trust-projection and freeze-disposition tests
- release-candidate and safety-change-control tests for visible assistive rollout

**System after Phase 8**  
The same staff workflow becomes faster and better documented, but still remains human-led, policy-gated, lineage-fenced, safety-controlled, and replayable.

## Card 10: Phase 9 - The Assurance Ledger

**Goal**  
Make the system operationally strong with live dashboards, assurance pack generation, tuple-bound restore-control, WORM audit, and policy controls such as break-glass.

**Back-end scope**

- stream domain events into operational projections
- build breach detection
- build queue health views
- track waitlist conversion
- track pharmacy bounce-back stats
- track notification delivery stats
- add break-glass audit queries
- bind audit explorer, break-glass review, and support replay to one `InvestigationScopeEnvelope` plus one `InvestigationTimelineReconstruction`
- generate monthly assurance packs
- materialize `AssuranceEvidenceGraphSnapshot` and `AssuranceGraphCompletenessVerdict` across standards, controls, continuity sections, incidents, CAPA, retention, replay, export, and recovery evidence
- add backup and restore automation
- materialize `OperationalReadinessSnapshot` and tuple-bound `RunbookBindingRecord`
- bind restore, failover, and chaos controls to `RecoveryControlPosture` and authoritative settlement
- add projection rebuild tools
- add chaos hooks
- write recovery evidence back into the assurance ledger and readiness state
- add one preservation-first lifecycle engine with `RetentionLifecycleBinding`, `RetentionDecision`, `LegalHoldScopeManifest`, `DispositionEligibilityAssessment`, and `DispositionBlockExplainer`
- validate tenant-level config
- compute `AssuranceSliceTrustRecord`, watch-tuple, and degraded-or-quarantined slice posture for every operational projection and release-facing assurance export

**Front-end scope**

- operations console
- resilience board with readiness, runbook, and recovery-proof posture
- audit search
- audit explorer with deterministic timeline, break-glass review burden, support replay pivot, and safe return-to-board semantics
- breach views
- queue heat maps
- assurance export screen
- governance records-lifecycle surface with hold review, disposition queue, and certificate or manifest lookup
- incident runbook links for support staff
- explicit degraded, stale, frozen, or quarantined assurance slice visibility instead of aggregate-green masking

**Phase algorithm**

1. Consume domain events into live projections.
2. Compute operational KPIs, breach risk, one `AssuranceSliceTrustRecord` per assurance slice, and one current assurance-evidence graph completeness verdict per exportable or replayable scope continuously.
3. Surface dashboards and alert conditions with degraded, stale, frozen, or quarantined slices rendered explicitly; do not flatten impaired evidence posture into one green status.
4. Generate assurance packs from the same event history, watch tuples, trust records, and current assurance-evidence graph, not from a separate spreadsheet process.
5. Materialize one `OperationalReadinessSnapshot` and published `RunbookBindingRecord` set for the live runtime tuple before restore, failover, chaos, or recovery activation may appear live.
6. Enforce one preservation-first lifecycle engine: classify every artifact at creation time, converge freeze and legal-hold scope before disposition, exclude WORM and replay-critical evidence from ordinary delete jobs, and block deletion whenever the current assurance graph or dependency chain still depends on that evidence.
7. Rehearse failure, rebuild, restore, failover, chaos, and slice-quarantine scenarios so operators can prove degraded visibility without losing audit continuity, and write the resulting evidence back into the same assurance spine.
8. Lock final production runbooks, alert routes, recovery posture, and release-watch links against the same assurance tuple used for export, restore authority, and freeze decisions.

**Tests that must pass**

- load tests
- soak tests
- chaos and failover tests
- projection rebuild from raw events
- backup restore into a clean environment
- `OperationalReadinessSnapshot` and `RunbookBindingRecord` tuple-drift tests
- `RecoveryControlPosture` downgrade tests for stale publication, stale rehearsal, and expired restore validation
- authoritative settlement tests for restore, failover, and chaos controls
- penetration testing
- authz matrix tests
- audit tamper tests
- WORM exclusion tests
- replay-critical dependency protection tests
- assurance-evidence-graph completeness and orphan-edge tests
- assurance-slice-trust and degraded-visibility tests
- watch-tuple and assurance-export parity tests
- graph-hash drift invalidation tests for pack export, replay, and retention
- quarantine and freeze-behaviour tests for impaired slices
- alert-fire drills
- full end-to-end regression across all patient and staff flows

**System after Phase 9**  
The platform is operationally strong without deleting the very evidence it needs for audit, replay, assurance, or preserved investigations.
