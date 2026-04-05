# Patient account and communications blueprint

## Purpose

Define one unified patient account model across triage, callback, booking, records, hub, and pharmacy flows.

All patient projections in this document must be materialized under the canonical `VisibilityProjectionPolicy` from `phase-0-the-foundation-protocol.md`. `patient_public` and `patient_authenticated` are different audience tiers, and any claim, booking, pharmacy outcome, closure, or patient-binding correction that requires `command_following` consistency must use the causal-read rules from the canonical Phase 0 section.

Any patient-visible mutation in this blueprint must resolve one live `RouteIntentBinding`, persist one immutable `CommandActionRecord`, and advance durable success, pending, or recovery posture only from authoritative `CommandSettlementRecord` or command-following projection truth. Any embedded, channel-specific, or release-constrained patient route must also validate the pinned `ReleaseApprovalFreeze`, any active `ChannelReleaseFreezeRecord`, and the required `AssuranceSliceTrustRecord` rows before writable posture is exposed.

Patient-visible continuity in this blueprint must also be provable, not inferred. Home actionability, record-origin recovery, and conversation-settlement posture must each materialize the relevant `ExperienceContinuityControlEvidence` from `phase-9-the-assurance-ledger.md` so the patient shell never appears calmer, fresher, or more actionable than the current assurance spine can justify.

Adjacent patient states for the same request must render within one `PersistentShell` using a stable `CasePulse` (`AnchorCard` compatibility), `StateBraid` (`LiveTimeline` compatibility), `DecisionDock` (`ActionDock` compatibility), and one shared status strip implemented through `AmbientStateRibbon` plus `FreshnessChip`. Hard page reloads are not a valid way to communicate ordinary state progression.

## Core projections

The patient account should be built from these projections:

- `PatientPortalEntryProjection`
- `PatientHomeProjection`
- `PatientSpotlightDecisionProjection`
- `PatientPortalNavigationProjection`
- `PatientNextActionProjection`
- `PatientRequestSummaryProjection`
- `PatientRequestsIndexProjection`
- `PatientRequestLineageProjection`
- `PatientRequestDetailProjection`
- `PatientRequestDownstreamProjection`
- `PatientRequestReturnBundle`
- `PatientShellConsistencyProjection`
- `PatientTimelineProjection`
- `PatientConversationCluster`
- `PatientCommunicationVisibilityProjection`
- `PatientMoreInfoStatusProjection`
- `ConversationThreadProjection`
- `ConversationSubthreadProjection`
- `PatientCallbackStatusProjection`
- `PatientAppointmentListProjection`
- `PatientAppointmentWorkspaceProjection`
- `PatientAppointmentManageProjection`
- `PatientAppointmentArtifactProjection`
- `PatientManageCapabilitiesProjection`
- `PatientActionRoutingProjection`
- `PatientActionSettlementProjection`
- `PatientSafetyInterruptionProjection`
- `PatientSecureLinkSessionProjection`
- `PatientEmbeddedSessionProjection`
- `PatientEmbeddedNavEligibility`
- `PatientReachabilitySummaryProjection`
- `PatientContactRepairProjection`
- `PatientExperienceContinuityEvidenceProjection`
- `PatientDegradedModeProjection`
- `PatientActionRecoveryProjection`
- `PatientIdentityHoldProjection`
- `PatientConsentCheckpointProjection`
- `PatientRecordOverviewProjection`
- `PatientResultInsightProjection`
- `PatientMedicationProjection`
- `PatientDocumentLibraryProjection`

Request-shell, callback-status, repair, consent, and recovery-specific shapes are specialized below. `PatientConversationCluster` is specialized in [callback-and-clinician-messaging-loop.md](/Users/test/Code/V/blueprint/callback-and-clinician-messaging-loop.md), and the appointment list, workspace, manage, and artifact shapes are specialized in [phase-4-the-booking-engine.md](/Users/test/Code/V/blueprint/phase-4-the-booking-engine.md) so the portal and booking engine share one patient-side contract.

**PatientExperienceContinuityEvidenceProjection**
`patientExperienceContinuityEvidenceProjectionId`, `patientShellConsistencyRef`, `controlCode = patient_nav | record_continuation | conversation_settlement | more_info_reply | booking_manage`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `governingContractRef`, `governingEntityContinuityKeyRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `decisionTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `sourceSettlementOrContinuationRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`PatientExperienceContinuityEvidenceProjection` is the patient-facing bridge into the assurance spine. Home, record, conversation, more-info reply, and appointment-manage shells may not improvise continuity truth from local projection freshness alone; they must bind the visible action or recovery posture to the current ledgered `ExperienceContinuityControlEvidence`, the same governing entity, the same selected-anchor tuple, the same spotlight-decision tuple where `controlCode = patient_nav`, and the same live publication tuple.

`PatientDegradedModeProjection` is the same-shell patient adapter over `PatientExperienceContinuityEvidenceProjection`, `ReleaseRecoveryDisposition`, `RouteFreezeDisposition`, `PatientEmbeddedSessionProjection`, `PatientActionRecoveryProjection`, `PatientIdentityHoldProjection`, `WritableEligibilityFence`, and any active `ArtifactFallbackDisposition`. If those contributors disagree, the patient shell must render the stricter degraded posture rather than letting route-family copy improvise a calmer state.

## Patient audience coverage contract

`patient_public` and `patient_authenticated` cannot share one over-broad patient payload. Before the shell chooses preview depth, thread visibility, record detail, artifact mode, or writable posture, it must resolve one audience-coverage projection tied to the active `AudienceVisibilityCoverage` rows from Phase 0.

**PatientAudienceCoverageProjection**
`patientAudienceCoverageProjectionId`, `subjectScopeRef`, `audienceTier`, `purposeOfUse = public_status | authenticated_self_service | secure_link_recovery | embedded_authenticated`, `projectionFamilyRefs[]`, `routeFamilyRefs[]`, `communicationPreviewMode = public_safe_summary | authenticated_summary | step_up_required | suppressed_recovery_only`, `timelineVisibilityMode = awareness_only | summary_only | message_safe | full_patient_thread`, `artifactVisibilityMode = summary_only | governed_inline | governed_download | placeholder_only`, `mutationAuthority = none | step_up_only | route_bound_mutation`, `minimumNecessaryContractRef`, `requiredVisibilityPolicyRef`, `requiredCoverageRowRefs[]`, `requiredSectionContractRefs[]`, `requiredPreviewContractRefs[]`, `requiredArtifactContractRefs[]`, `requiredRedactionPolicyRefs[]`, `requiredPlaceholderContractRef`, `requiredRouteIntentRefs[]`, `requiredEmbeddedSessionRef`, `computedAt`

`PatientAudienceCoverageProjection` is the patient-shell adapter over the canonical audience matrix. It binds the active patient tier and purpose of use to the exact projection families, minimum-necessary contract, preview modes, section contracts, artifact contracts, and mutation ceiling the shell may render for the current subject and route family.

Rules:

- `patient_public` is limited to `PatientPortalEntryProjection`, public-safe `PatientCommunicationVisibilityProjection`, neutral request or receipt summaries, `PatientActionRecoveryProjection`, and secure-link or claim recovery shells; it may not render thread bodies, record fields, document previews, or appointment-manage detail before session-bound proof or authenticated uplift is complete
- `patient_authenticated` may render request detail, conversation thread, record overview, document library, and appointment-manage surfaces only through coverage rows distinct from public shapes; authenticated preview depth may still fall back to placeholder or summary when release, identity, step-up, or trust posture narrows scope
- any receipt, reminder, callback expectation, or thread preview promoted into home, requests, or spotlight surfaces must carry the same `PatientAudienceCoverageProjection` or a stricter one; list summaries may not over-reveal detail that the destination route cannot lawfully show, and preview rows may not substitute for route-local trimming
- public-to-authenticated uplift, secure-link rebound, and embedded downgrade must recompute `PatientAudienceCoverageProjection` before a CTA, preview mode, or artifact mode changes; route labels and cached components may not widen scope in place

## Patient home contract

High-priority shell gaps in this layer:

1. make spotlight selection deterministic so the home shell cannot oscillate between unrelated urgent entities
2. bind home, detail, and timeline views to one consistency envelope so contradictory projections do not render as if they were current
3. tier communications previews by audience, release state, and step-up requirements so lightweight shells do not leak sensitive content
4. lease every patient-manage capability against policy and governing-object version so stale CTAs cannot mutate the wrong state
5. surface reachability and delivery-health failures as first-class blockers when callbacks, messages, reminders, or consent flows depend on them

The signed-in home should show:

- one spotlight card for the request, appointment, result, or message that most needs attention now
- one compact `Active requests` summary card
- one compact `Appointments` summary card
- one compact `Messages` summary card
- one compact `Health record updates` summary card
- one persistent urgent-help or inappropriate-for-messaging route
- contact preference summary behind secondary disclosure such as `Account details`

Compact cards may show only a short state label, the latest meaningful update, one localized trust cue, and one safe CTA. Inline timelines, charts, multi-action toolbars, and carousel rotation are not valid home-shell patterns.

**PatientSpotlightDecisionProjection**
`patientSpotlightDecisionProjectionId`, `patientShellConsistencyRef`, `candidateDigestRefs[]`, `candidateSetHash`, `selectedEntityContinuityKey`, `selectedAnchorRef`, `selectedCapabilityLeaseRef`, `selectedWritableEligibilityFenceRef`, `releaseTrustFreezeVerdictRef`, `experienceContinuityEvidenceRef`, `selectedReturnContractRef`, `decisionTier = urgent_safety | patient_action | dependency_repair | watchful_attention | quiet_home`, `decisionUseWindowRef`, `selectionTupleHash`, `decisionState = live | pinned_pending | pinned_recovery | read_only | quiet_home | blocked`, `computedAt`, `staleAt`

**PatientSpotlightDecisionUseWindow**
`patientSpotlightDecisionUseWindowId`, `patientShellConsistencyRef`, `selectedEntityContinuityKey`, `candidateSetHash`, `enteredAt`, `revalidateAt`, `expiresAt`, `supersedingTriggerRefs[]`, `windowState = live | revalidate_only | expired | superseded`

**PatientQuietHomeDecision**
`patientQuietHomeDecisionId`, `patientShellConsistencyRef`, `eligibilityGateRef`, `supportingCandidateDigestRefs[]`, `highestSuppressedTier = none | watchful_attention | quiet_only`, `gentleNextActionRef`, `blockedByRecoveryRefs[]`, `decisionState = eligible | recovery_only | blocked`, `computedAt`

`PatientSpotlightDecisionProjection` is the only authority for which request, appointment, record, message, or repair path owns the home spotlight. `PatientSpotlightDecisionUseWindow` is the bounded hysteresis lease that keeps equivalent or lower-tier challengers from stealing spotlight ownership just because one projection refreshed first. `PatientQuietHomeDecision` is the only legal source of calm empty-home posture; an empty candidate list, partial hydration gap, or generic dashboard default is not enough.

`PatientHomeProjection` must be assembled under one `PatientShellConsistencyProjection` carrying:

- `bundleVersion`
- `audienceTier`
- `computedAt`
- `staleAt`
- `governingObjectRefs`
- `entityVersionRefs`
- `causalConsistencyState`
- `releaseApprovalFreezeRef`
- `channelReleaseFreezeState`
- `requiredAssuranceSliceTrustRefs[]`
- `releaseRecoveryDispositionRef`

`PatientHomeProjection` must also carry `spotlightDecisionRef`, `quietHomeDecisionRef`, `requiredReleaseTrustFreezeVerdictRef`, and a deterministic `secondaryCardOrderingHash` derived from the same candidate set after the spotlight entity is removed.

The home shell may render live CTAs only when `causalConsistencyState = consistent`. If child projections are still converging, the same shell must show an updating, pending-confirmation, or recovery posture rather than contradictory reassurance.

If any required assurance slice is `degraded` or `quarantined`, or the current release or channel freeze posture no longer permits mutable access, the same spotlight card, compact summary card, and request header must remain visible but degrade through `releaseRecoveryDispositionRef` to read-only, placeholder, or safe-route guidance. Fresh projections alone may not override a frozen release tuple or untrusted slice.

`PatientPortalNavigationProjection` must also carry the current `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, `PatientNavUrgencyDigest`, `PatientNavReturnContract`, `selectedCapabilityLeaseRef`, `selectedWritableEligibilityFenceRef`, `routeIntentBindingRef`, `requiredReleaseApprovalFreezeRef`, `requiredReleaseTrustFreezeVerdictRef`, `channelReleaseFreezeState`, and `requiredAssuranceSliceTrustRefs[]` for the spotlight entity and any compact secondary cards shown on home. The spotlight CTA, requests list CTA, and any promoted record or message CTA may resolve as live only while the corresponding digest is `settlementState = live`, still points at the current lineage anchor, the current spotlight decision still owns the same `selectionTupleHash`, and the bound route intent plus release or trust posture still allow writable state.

The same spotlight and compact-row posture must also bind to `PatientExperienceContinuityEvidenceProjection` with `controlCode = patient_nav`. If the linked `experienceContinuityEvidenceRef` is stale, blocked, or degraded below the route's allowed trust posture, the home shell must keep the card pinned against the same `selectionTupleHash` but morph it to bounded pending, placeholder, or recovery guidance instead of implying that the last known patient action is still safe to launch.

If the latest authoritative digest or settlement for the spotlight is pending, stale, blocked for repair, or downgraded to read-only, the same home card must keep its place, preserve the `PatientNavReturnContract`, and morph into bounded pending or recovery guidance instead of re-offering the last optimistic book, reply, or view action. The card may change owner only when the active decision-use window expires or an explicit higher-tier superseding trigger invalidates the current spotlight tuple.

`PatientSpotlightDecisionProjection` must choose the spotlight deterministically:

1. discard entities that fail current visibility, identity-hold, continuity, release-trust, or capability-lease rules
2. map the remaining entities into one decision tier: `urgent_safety`, `patient_action`, `dependency_repair`, `watchful_attention`, or `quiet_home`
3. rank remaining entities lexicographically by decision tier, patient-safety blocker, patient-owed action, active dependency failure, authoritative due time, latest meaningful update, and stable entity reference
4. preserve the current spotlight inside the active `PatientSpotlightDecisionUseWindow` unless a challenger wins on a higher decision tier or the current spotlight tuple is explicitly superseded
5. after window expiry or revalidation, recompute from the full candidate tuple and break final ties by earliest due time, latest authoritative update, then stable entity reference
6. derive the single home CTA from the selected entity's live capability lease and writable-eligibility fence; if the lease or fence downgrades, keep the same card pinned and downgrade its posture in place

The single clear next action on home must be derived from the spotlight's live capability lease, not chosen independently by another projection. Compact summary cards may expose only section-level or governed detail-entry actions; they may not seize spotlight ownership or surface a second competing transactional CTA while the same spotlight tuple remains active.

If an active callback, reminder, consent checkpoint, or message reply is blocked by reachability failure, unverified route, or delivery dispute, that dependency must move out of secondary disclosure and become visible in the home shell as the dominant recovery path.

If no request, appointment, result, message, or repair path currently outranks the quiet threshold, the same shell must render one governed quiet-home state from `PatientQuietHomeDecision` instead of dashboard filler. That state must explain why home is quiet now, what usually appears here, and the fastest safe next action; it must still derive from `PatientNavUrgencyDigest`, `QuietClarityEligibilityGate`, and `MissionStackFoldPlan`. If continuity evidence, reachability repair, step-up, delayed release, or embedded freeze blocks ordinary action, the dominant card becomes repair or recovery guidance rather than a generic wellness or marketing panel.

## Requests browsing contract

High-priority request-browsing gaps in this layer:

1. the route family includes `requests list`, but the browse surface is not yet governed by one typed index projection and bucket model
2. request rows do not yet guarantee `awaiting party`, `next safe action`, and localized freshness in one scan line
3. downstream booking, callback, pharmacy, and message lineage can still disappear into detail pages instead of remaining visible at list level
4. filter and regroup operations are not yet explicitly required to preserve the selected request anchor
5. request-list calmness is not yet bound to the same one-CTA, one-expanded-row discipline used elsewhere in the patient shell
6. list rows and request detail still do not prove they are reading the same downstream lineage order, placeholder posture, and child-anchor tuple for the same request

Build the requests index around these projections:

**PatientRequestsIndexProjection**
`patientRequestsIndexProjectionId`, `patientRef`, `defaultBucket = needs_attention`, `visibleBuckets[]`, `activeFilterSetRef`, `selectedAnchorRef`, `selectedAnchorTupleHash`, `dominantActionRef`, `trustCueRef`, `requestSummaryRefs[]`, `requestLineageRefs[]`, `bucketMembershipDigestRef`, `lineageOrderingDigestRef`, `computedAt`

**PatientRequestLineageProjection**
`patientRequestLineageProjectionId`, `requestRef`, `requestLineageRef`, `summaryProjectionRef`, `detailProjectionRef`, `currentStageRef`, `lineageCaseLinkRefs[]`, `downstreamProjectionRefs[]`, `childObjects[]`, `latestLineageCaseLinkRef`, `visiblePlaceholderRefs[]`, `awaitingParty`, `safestNextActionRef`, `nextExpectedStepRef`, `lastConfirmedStepAt`, `selectedChildAnchorRef`, `selectedChildAnchorTupleHash`, `lineageTupleHash`, `visibilityState = full | partial | placeholder_only`, `computedAt`

The requests area should open with three mutually exclusive buckets:

- `Needs attention`
- `In progress`
- `Complete`

Each request row must show:

- patient-safe request label
- current status text
- who is waiting on whom
- latest meaningful update with timestamp
- next safe action or `No action needed`
- localized trust or freshness cue
- lineage chips for downstream booking, callback, pharmacy, self-care, message, or admin-resolution children
- one dominant CTA

Rules:

- `PatientRequestsIndexProjection` is the only allowed source of bucket counts, default bucket selection, and pinned request ordering
- `PatientRequestsIndexProjection.bucketMembershipDigestRef` and `lineageOrderingDigestRef` must be derived from the same `PatientRequestSummaryProjection` and `PatientRequestLineageProjection` set shown on screen; local regroup, pagination, or stale cache may not silently reorder rows or hide lineage chips for the same request lineage
- `PatientRequestLineageProjection` must derive booking, callback, messaging, pharmacy, self-care, admin-resolution, and support-child visibility from canonical `RequestLineage` plus `LineageCaseLink`; child cards may soften or redact detail, but they may not invent or hide branch existence from route-local joins
- `PatientRequestLineageProjection` is the single lineage grammar for list rows and request detail. Awaiting-party wording, next safe action, downstream chip order, governed placeholders, and selected child anchor must all derive from it instead of from separate row-local and detail-local joins
- persistent filters are limited to `Status`, `Care type`, and `Updated`; any broader refinement belongs in secondary disclosure
- rows sort lexicographically by blocker severity, patient-owed action, authoritative due time, and latest meaningful update
- list, row, and detail CTA truth must bind to `PatientNavUrgencyDigest`, `PatientNavReturnContract`, and `PatientExperienceContinuityEvidenceProjection(controlCode = patient_nav)`; stale rows may stay readable but must downgrade to `View details` or recovery posture in place
- `PatientRequestLineageProjection` must stay visible in the list row and directly beneath the request headline on detail pages. Child states that are delayed, step-up-gated, read-only, or partially visible must render as governed placeholder chips rather than disappearing
- selecting a request preserves `SelectedAnchor` through refresh, filter, regroup, and same-shell return; if the row reorders while open, the anchor stays on the same request and `selectedAnchorTupleHash` plus `selectedChildAnchorTupleHash` may not silently switch to a sibling child object
- in `clarityMode = essential`, mobile may expand only one row summary or one filter drawer at a time; desktop may pin the selected request detail beside the list only while the same `entityContinuityKey` remains active

## Request detail contract

Request detail pages should unify:

- request summary with visible lineage strip
- current status
- who is waiting on whom
- next expected step
- last meaningful update
- allowed patient actions
- timeline under secondary disclosure or a clearly labeled history section
- linked downstream objects under a related-details disclosure
- patient-visible communications sent

Request detail, downstream continuity, and reply actions should be adjacent child views inside the same request shell, not silo pages that reset context.

The request header, status strip, timeline, and `DecisionDock` must share the same `bundleVersion` and governing-object version. If the header is newer than the timeline or action dock, mutating CTAs freeze and the shell shows a bounded refresh or recovery state until the projections reconverge.

Every request detail view must expose the governing object's current confirmation and reconciliation posture. A request may be `managed`, `under review`, `awaiting confirmation`, `identity-held`, or `delivery blocked`, but it must never show a final-success header while a downstream child object remains provisional.

The request summary region must place `PatientRequestLineageProjection` immediately beneath the headline and above the timeline or related-details disclosure. Booking, callback, pharmacy, self-care, admin-resolution, message, and support-child states must remain visible there even when the child route is read-only, delayed, or step-up-gated; governed placeholders replace detail, not existence.

Close five high-priority request-detail defects before treating this shell as canonical:

1. request summary rows, full detail, and downstream child objects are still implied to share truth, but not yet bound to one explicit request-detail projection family
2. pending-confirmation booking, callback, and pharmacy child states can still read like final request success because request-level quiet copy is not yet subordinate to child settlement
3. downstream objects are linked conceptually, but not normalized into one related-work digest that can preserve placeholder, freshness, and repair posture
4. leaving request detail for booking, callback, records, or recovery is not yet bound to one same-shell return bundle, so cross-route return can still drift back to generic list state
5. blocker precedence is described in prose, but not yet promoted into a dedicated next-action contract that can suppress unsafe CTAs while repair or consent gates are active
6. request detail still does not prove that its downstream cards, lineage strip, and list-row chips are reading the same lineage tuple and child ordering as the request index

Add the request-detail contracts:

**PatientRequestSummaryProjection**
`requestSummaryProjectionId`, `requestRef`, `requestVersionRef`, `patientShellConsistencyRef`, `lineageProjectionRef`, `lineageTupleHash`, `downstreamOrderingDigestRef`, `evidenceSnapshotRef`, `evidenceSummaryParityRef`, `requestTypeLabelRef`, `headlineRef`, `statusLabelRef`, `macroState`, `patientVisibleOutcomeState = received | in_review | action_needed | awaiting_confirmation | managed | closed | recovery_required`, `summaryState = action_needed | waiting | blocked | read_only | complete`, `awaitingParty = patient | clinic | external_service | nobody`, `pendingConfirmationState = none | external_confirmation | delivery_confirmation | reconciliation_required`, `blockedByRefs[]`, `lastMeaningfulUpdateAt`, `safestNextActionRef`, `trustCueRef`, `requestLineageRef`, `latestLineageCaseLinkRef`, `governedPlaceholderRefs[]`, `returnContractRef`, `routeIntentBindingRef`, `requiredReleaseApprovalFreezeRef`, `channelReleaseFreezeState`, `requiredAssuranceSliceTrustRefs[]`, `placeholderContractRef`, `computedAt`

`PatientRequestSummaryProjection` is the compact truth object for home cards, request-list rows, and related-request summaries. It may not claim `managed` or `closed` calmness while a downstream booking, callback, pharmacy, or repair object is still pending confirmation, disputed, identity-held, or blocked by an open `PharmacyOutcomeReconciliationGate`, and it must keep awaiting-party, trust-cue, and lineage context visible without forcing the patient into full detail first. Any evidence-derived summary copy in this projection must stay pinned to the cited snapshot and `EvidenceSummaryParityRecord`; mutable latest-request joins are not sufficient. The list row must also prove the same `lineageTupleHash`, placeholder set, and downstream ordering digest that request detail uses for the same request.

**PatientRequestDetailProjection**
`requestDetailProjectionId`, `requestRef`, `requestVersionRef`, `patientShellConsistencyRef`, `summaryProjectionRef`, `lineageProjectionRef`, `lineageTupleHash`, `downstreamOrderingDigestRef`, `evidenceSnapshotRef`, `evidenceSummaryParityRef`, `timelineProjectionRef`, `communicationsProjectionRefs[]`, `downstreamProjectionRefs[]`, `selectedAnchorRef`, `selectedChildAnchorRef`, `selectedChildAnchorTupleHash`, `requestReturnBundleRef`, `dominantActionRef`, `placeholderContractRef`, `surfaceState = ready | pending_confirmation | under_review | repair_required | read_only | recovery_required`, `experienceContinuityEvidenceRef`, `renderedAt`

`PatientRequestDetailProjection` is the full-shell read model for `/requests/:requestId`. Header, status strip, history, downstream cards, and action rail must all derive from it rather than from independently fetched fragments, and request-level evidence wording must stay subordinate to the cited snapshot and parity record. Detail may disclose more than the list row, but it may not contradict the row’s lineage tuple, child ordering, awaiting-party posture, or governed placeholder set.

**PatientRequestDownstreamProjection**
`requestDownstreamProjectionId`, `requestRef`, `requestLineageRef`, `lineageCaseLinkRef`, `childType = more_info_cycle | booking_case | appointment | callback_case | conversation_cluster | pharmacy_case | hub_case | self_care_advice | admin_resolution_case | record_follow_up | admin_repair`, `childRef`, `patientLabelRef`, `authoritativeState`, `awaitingParty`, `nextSafeActionRef`, `confirmationState`, `repairState`, `choiceTruthRef`, `dispatchTruthRef`, `outcomeTruthRef`, `boundaryDecisionRef`, `boundaryTupleHash`, `clinicalMeaningState`, `operationalFollowUpScope`, `boundaryReopenState`, `childAnchorRef`, `childAnchorTupleHash`, `lastMeaningfulUpdateAt`, `visibilityTier`, `summarySafetyTier`, `placeholderContractRef`, `returnContractRef`, `projectionState = live | placeholder | recovery_only`, `sortKey`

`PatientRequestDownstreamProjection` normalizes every patient-visible child object into one related-work grammar. More-info loops, booking, callback, records follow-up, pharmacy continuation, self-care advice, admin-resolution, and repair can therefore render beside each other without inventing route-local status words or leaking gated detail. Its `sortKey`, `awaitingParty`, `nextSafeActionRef`, placeholder posture, and `childAnchorTupleHash` are the only authorities for downstream chip order, awaiting-party language, next-step wording, and selected child continuity across list row, detail header, related-work disclosure, and return flows. When `childType = booking_case | appointment`, `confirmationState`, secondary status copy, provisional-receipt wording, and any booked or manage-ready reassurance must derive from the current `BookingConfirmationTruthProjection` rather than from local success toasts, raw `BookingTransaction` phases, `AppointmentRecord` presence, or reminder schedule state. If that projection remains `confirmation_pending | reconciliation_required | failed | expired`, the downstream card must stay in pending, recovery, or placeholder posture instead of implying a confirmed appointment. When the downstream child is hub-managed, including `childType = hub_case` or a network `appointment`, offer expiry, selected-slot provenance, provisional booking copy, callback fallback, patient-confirmed wording, and any `practice informed` or `practice acknowledged` disclosure must derive from the current `HubOfferToConfirmationTruthProjection` rather than from `AlternativeOfferSession`, `HubCommitSettlement`, `HubAppointmentRecord`, or `PracticeAcknowledgementRecord` in isolation. If that projection reports `offerState = expired | superseded`, `confirmationTruthState = confirmation_pending | disputed | expired`, `practiceVisibilityState = continuity_pending | ack_pending | recovery_required`, or `fallbackLinkState = callback_pending_link | return_pending_link`, the downstream card must stay in pending, recovery, or provenance-only posture instead of implying a calmer network appointment state. When the downstream child is `pharmacy_case`, provider order, recommended chips, warning or suppression summary, selected-provider provenance, and any choose or change-pharmacy CTA must derive from the current `PharmacyChoiceTruthProjection` rather than from cached list order, local filters, or convenience-only labels. If that projection reports `projectionState = read_only_provenance | recovery_required`, the downstream card must preserve the last safe chosen-provider summary but suppress live choice or change controls. `confirmationState`, secondary status copy, and any `referred` wording must derive from the current `PharmacyDispatchTruthProjection` rather than from transport acknowledgements, stale settlement text, or local navigation history. Pharmacy child calm completion, managed posture, and closed copy must derive from `PharmacyOutcomeTruthProjection`; if an open `PharmacyOutcomeReconciliationGate` leaves `outcomeTruthState = review_required | unmatched | reopened_for_safety`, the downstream card must stay in review-placeholder or recovery posture instead of implying quiet resolution. When `childType = self_care_advice | admin_resolution_case`, patient wording, next safe action, and recovery posture must derive from the current `SelfCareBoundaryDecision`, `SelfCareExperienceProjection`, and `AdminResolutionExperienceProjection` on the same `boundaryTupleHash`. If `clinicalMeaningState = clinician_reentry_required`, `boundaryReopenState != stable`, or the current boundary tuple is missing on either child surface, the downstream card must preserve the last safe summary but freeze admin follow-up, completion reassurance, and ordinary self-care calmness into review or recovery posture instead of relabeling the work through softer copy. Open self-care and admin-resolution child routes must also keep the same `PatientRequestReturnBundle`, `selectedChildAnchorTupleHash`, and published route tuple; if shell consistency, boundary tuple, or embedded posture drifts, the child must fall to bounded same-shell recovery instead of quietly staying writable.

**PatientRequestReturnBundle**
`requestReturnBundleId`, `requestRef`, `patientShellContinuityKey`, `sourceSectionRef`, `sourceRouteFamilyRef`, `selectedAnchorRef`, `selectedAnchorTupleHash`, `selectedChildAnchorRef`, `selectedChildAnchorTupleHash`, `expandedDisclosureRef`, `filterStateRef`, `scrollStateRef`, `lastSafeSurfacePostureRef`, `lastSafeSummaryRef`, `lastSafeLineageTupleHash`, `summarySafetyTier`, `returnRouteRef`, `patientShellConsistencyRef`, `continuityEvidenceRef`, `recordOriginContinuationRef`, `recoveryContinuationRef`, `patientActionRecoveryEnvelopeRef`, `recoveryTupleHash`, `lineageFenceEpoch`, `restoreState = ready | degraded | recovery_only | blocked`, `issuedAt`, `expiresAt`

`PatientRequestReturnBundle` preserves the exact request-shell return target when the patient leaves for child work. It carries the request shell's section, route family, anchor, child anchor, disclosure state, filter state, scroll state, last safe posture, last safe summary, last safe lineage tuple, and continuity proof so downstream booking, callback, records, message, consent, or repair routes must return through this bundle rather than by recomputing the nearest request row or default bucket.

**PatientNextActionProjection**
`nextActionProjectionId`, `requestRef`, `governingCapabilityRef`, `blockingDependencyRefs[]`, `routeIntentBindingRef`, `settlementRef`, `requestReturnBundleRef`, `actionState = live | pending | repair_required | read_only | recovery_required`, `computedAt`

`PatientNextActionProjection` is the only source for the dominant request-detail CTA. It must subordinate book, reply, callback, pharmacy, and record-follow-up actions to current repair, consent, identity-hold, and pending-confirmation posture.

Rules:

- request-list rows and home spotlight cards may only render compact request truth from `PatientRequestSummaryProjection`; request detail, child-route continuity, and recovery copy must come from `PatientRequestDetailProjection` plus `PatientRequestReturnBundle`
- request rows, request detail, and any evidence-derived copy shared between them must agree on `evidenceSnapshotRef` and `evidenceSummaryParityRef`; if parity is stale, blocked, or superseded, the shell keeps the last safe summary and lineage context visible but downgrades detail to provisional or recovery posture instead of silently regenerating calm copy
- request rows, request detail, and request-return restore must also agree on `lineageTupleHash`, downstream ordering digest, governed placeholder set, and selected child anchor tuple; if any of those drift, the same shell must preserve the last safe lineage strip and downgrade to bounded recovery instead of silently switching child lineage
- `PatientRequestDownstreamProjection` must serialize linked more-info, booking, callback, conversation, pharmacy, hub, self-care, admin-resolution, record-follow-up, and repair work in the order of current blocker severity, patient-owed action, pending confirmation, and freshest authoritative update
- request-level `managed` or `closed` copy is legal only when every visible `PatientRequestDownstreamProjection` is terminal or placeholder-only and none remain in confirmation, review, or repair posture
- request-level `managed` or `closed` copy is also illegal while any visible self-care or admin-resolution child carries `clinicalMeaningState = clinician_reentry_required`, `boundaryReopenState != stable`, or a mismatched `boundaryTupleHash`; the request must stay under review, recovery, or pending posture until the boundary settles again
- if a pharmacy child carries `PharmacyOutcomeTruthProjection.outcomeTruthState = review_required | unmatched | reopened_for_safety` or any open `PharmacyOutcomeReconciliationGate`, request-level copy must stay in review, recovery, or pending posture rather than collapsing to `managed` or `closed`
- any patient action leaving request detail must mint or refresh `PatientRequestReturnBundle`, preserve `selectedAnchorRef`, and issue or reuse `RecoveryContinuationToken` before the child route becomes live
- `PatientRequestReturnBundle` must remain aligned with the active `PatientNavReturnContract`; while the same request lineage is still active, request child work may not return to a different section, filter, or generic `/requests` landing
- if request detail was entered from record follow-up, `PatientRequestReturnBundle.recordOriginContinuationRef` must stay attached and any downstream repair or child-route return must revalidate that same record-origin continuation before live follow-up controls return
- if child-route settlement, continuity evidence, release posture, or identity binding drifts before the child work settles, the patient must recover back into the same request shell with the prior anchor, last safe downstream summary, and bounded next-step guidance rather than a generic requests landing page
- if `PatientNextActionProjection.blockingDependencyRefs[]` is non-empty, the dominant request action becomes repair, consent renewal, or recovery in place; the shell may not keep a stale book, reply, or callback CTA visible beside the blocker
- if a downstream child is step-up-gated, delayed, read-only, or disclosure-narrowed, request list and detail must still preserve the child’s existence, sequence, awaiting-party posture, and next safe action through governed placeholder chips; placeholder posture may hide detail, but it may not collapse lineage

## More-info response contract

More-info must not behave like a detached secure-link form, a local countdown, or a stale request-row badge. It is a first-class patient child route with one authoritative reply window and one explicit post-submit disposition.

Close five high-priority more-info defects before treating this shell as canonical:

1. request rows, request detail, and the `respond to more-info` route can still imply reply posture from stale summary copy instead of one cycle-specific projection
2. secure-link entry and authenticated entry are described as equivalent, but not yet bound to one shared answer about whether the reply window is open, late-review only, expired, or superseded
3. late replies are acknowledged conceptually, but not yet split into accepted-late-review, expired, superseded, and repair-blocked patient states
4. reminder wording, callback fallback, and contact-route repair cues are referenced separately, but not yet unified into the same reply-status surface
5. post-expiry recovery is governed broadly, but the more-info route does not yet name the exact child-route contract that preserves the current question summary and next safe action in place

Add the more-info contract:

**PatientMoreInfoStatusProjection**
`moreInfoStatusProjectionId`, `cycleRef`, `requestRef`, `patientShellConsistencyRef`, `questionSummaryRef`, `replyWindowCheckpointRef`, `reminderScheduleRef`, `latestResponseDispositionRef`, `latestSecureLinkSessionRef`, `reachabilityDependencyRef`, `reachabilityAssessmentRef`, `contactRepairJourneyRef`, `requestReturnBundleRef`, `selectedAnchorRef`, `dueAt`, `lateReplyReviewUntilAt`, `surfaceState = reply_needed | reply_submitted | awaiting_review | late_review | expired | superseded | repair_required | read_only`, `dominantActionRef`, `placeholderContractRef`, `experienceContinuityEvidenceRef`, `renderedAt`

`PatientMoreInfoStatusProjection` is the child-route truth object for `respond to more-info` and any request-row, request-detail, spotlight, or secure-link entry posture that advertises reply actionability. Due copy, reminder state, late-review grace, expiry recovery, and post-submit receipts must derive from this projection rather than from secure-link TTL, stale request-summary joins, or browser-local time.

Rules:

- request rows, request detail, secure-link entry, and the open more-info child route for the same cycle must share `cycleRef`, `replyWindowCheckpointRef`, `latestResponseDispositionRef`, and `experienceContinuityEvidenceRef`; if they drift, the shell must keep the last safe question summary visible and freeze live reply controls into pending, read-only, or recovery posture
- live reply posture is legal only while the current checkpoint says `open | reminder_due | late_review` and the linked continuity evidence still validates the same request anchor; `late_review` must render explicit review-pending wording rather than the ordinary on-time `reply needed` copy
- if a secure-link session, uplift token, or embedded session expires while the checkpoint is still `open | late_review`, the same shell must recover to the current cycle summary and rebind or step-up path instead of declaring the cycle itself expired; if the checkpoint is `expired | superseded | settled`, the composer must stay suppressed even if an older link still exists
- if current reachability posture blocks reminders or policy selects callback fallback, `PatientMoreInfoStatusProjection` must surface `PatientReachabilitySummaryProjection` or `PatientContactRepairProjection` in the same shell instead of keeping a stale `Reply now` CTA visible beside a broken route
- `accepted_late_review` may acknowledge receipt, but it must say the team will review the update and may not imply that the response arrived inside the original reply window
- `expired_rejected` and `superseded_duplicate` must explain why the older reply no longer changes live workflow, keep the last safe request summary visible, and expose the next safe action through `PatientActionRecoveryProjection` or the current request detail shell

## Callback status, contact repair, and consent checkpoint contract

Callback status must not behave like a detached phone log. It is a patient promise surface with explicit repair, return, and confirmation posture.

Close five high-priority callback-status defects before treating this shell as canonical:

1. callback promise, active route health, and last settled outcome are still described separately, but not yet projected into one patient-facing status object
2. reachability failure and contact repair are referenced operationally, but not yet promoted into a first-class patient repair surface with safe resume semantics
3. consent expiry can block downstream callback, pharmacy, or response work, but is not yet modeled as a checkpoint that can hold the same patient shell without silent cancellation
4. callback status deep links can still reopen as detached status pages because no explicit request-shell or conversation-shell return bundle is named
5. callback reassurance can still collapse on local acknowledgement or a widened window because quiet-success suppression is not yet bound to expectation, evidence, and resolution truth together

Add the callback and repair contracts:

**PatientCallbackStatusProjection**
`callbackStatusProjectionId`, `callbackCaseRef`, `requestRef`, `patientShellConsistencyRef`, `callbackExpectationEnvelopeRef`, `latestOutcomeEvidenceRef`, `resolutionGateRef`, `reachabilityDependencyRef`, `reachabilitySummaryRef`, `reachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairProjectionRef`, `contactRepairJourneyRef`, `consentCheckpointRef`, `selectedAnchorRef`, `requestReturnBundleRef`, `patientVisibleState = queued | scheduled | attempting_now | retry_planned | route_repair_required | escalated | closed`, `windowRiskState = on_track | at_risk | missed_window | repair_required`, `surfaceState = ready | pending_confirmation | repair_required | read_only | recovery_required`, `dominantActionRef`, `placeholderContractRef`, `experienceContinuityEvidenceRef`, `renderedAt`

`PatientCallbackStatusProjection` is the callback-child truth object for request and conversation shells. Promise window, retry posture, route repair, and closed-state reassurance must all derive from this projection, not from local timers or telephony events.

**PatientReachabilitySummaryProjection**
`reachabilitySummaryProjectionId`, `patientRef`, `activeDependencyRefs[]`, `dominantDependencyRef`, `currentContactRouteSnapshotRef`, `currentReachabilityAssessmentRef`, `reachabilityEpoch`, `contactRepairJourneyRef`, `preferredContactRouteRef`, `selectedAnchorRef`, `resumeContinuationRef`, `verificationState`, `routeAuthorityState = current | stale_verification | stale_demographics | stale_preferences | disputed | superseded`, `deliveryRiskState = clear | at_risk | likely_failed | disputed`, `repairRequiredState`, `dominantRepairActionRef`, `summaryState = clear | at_risk | blocked | recovering | rebound_pending`, `computedAt`

`PatientReachabilitySummaryProjection` lifts contact-route truth out of settings and into the active patient journey. If a callback promise, reminder, or message reply depends on a degraded route, this projection must become visible in the owning shell. Its summary posture must come from the current `ReachabilityAssessmentRecord`, not from the last successful send, stale demographics, or stale preference state.

**PatientContactRepairProjection**
`contactRepairProjectionId`, `repairCaseRef`, `reachabilityDependencyRef`, `contactRepairJourneyRef`, `blockedAssessmentRef`, `governingObjectRef`, `patientShellConsistencyRef`, `blockedActionRefs[]`, `dominantBlockedActionRef`, `selectedAnchorRef`, `currentRouteRef`, `currentContactRouteSnapshotRef`, `allowedRepairPathRefs[]`, `stepUpRequirementRef`, `verificationCheckpointRef`, `resultingReachabilityAssessmentRef`, `resumeContinuationRef`, `requestReturnBundleRef`, `patientRecoveryLoopRef`, `repairState = ready | submitting | awaiting_verification | rebound_pending | applied | recovery_required`, `renderedAt`

`PatientContactRepairProjection` is the repair shell for broken or disputed contact routes. It must preserve the blocked callback, reminder, offer, pharmacy, or thread anchor, keep the dominant blocked action visible, and reopen the owning shell only through the bound continuation, verification checkpoint, resulting reachability assessment, and return bundle once repair truly settles.

**PatientConsentCheckpointProjection**
`consentCheckpointProjectionId`, `governingObjectRef`, `checkpointClass = callback | pharmacy | other`, `consentScope`, `boundProviderRef`, `boundPathwayCode`, `boundScopeHash`, `pharmacyChoiceTruthRef`, `selectedProviderExplanationRef`, `overrideAcknowledgementRef`, `latestGrantRef`, `latestPharmacyDispatchSettlementRef`, `latestPharmacyDispatchTruthRef`, `latestConsentRevocationRef`, `selectionBindingHash`, `expiryAt`, `blockedActionRefs[]`, `renewalRouteRef`, `resumeContinuationRef`, `requestReturnBundleRef`, `experienceContinuityEvidenceRef`, `surfaceState = current | expiring | expired | renewal_pending | withdrawal_reconciliation | recovery_required`, `renderedAt`

`PatientConsentCheckpointProjection` is the same-shell consent hold for patient-visible actions that cannot continue without renewed permission. Expired, superseded, or revoked consent must freeze the dependent action in place and keep the blocked context visible until renewal, withdrawal reconciliation, or recovery is chosen.

Rules:

- `PatientCallbackStatusProjection.patientVisibleState` and `windowRiskState` may advance only from `CallbackExpectationEnvelope`, `CallbackOutcomeEvidenceBundle`, and `CallbackResolutionGate`; telephony acceptance, optimistic timers, or browser return may not manufacture calmer callback truth
- `PatientReachabilitySummaryProjection.summaryState`, `routeAuthorityState`, `deliveryRiskState`, and `PatientCallbackStatusProjection.windowRiskState` must derive from the current `ReachabilityAssessmentRecord` and `ContactRouteSnapshot`; stale demographic rows, stale preferences, or the last successful send attempt are not valid substitutes
- callback status, contact repair, and consent renewal must preserve `selectedAnchorRef` plus `PatientRequestReturnBundle` or the active conversation-cluster return target before the patient leaves the current shell, and any route-repair return must remain bound to the same `ContactRouteRepairJourney`
- if `PatientReachabilitySummaryProjection.summaryState = blocked | recovering | rebound_pending` or `PatientContactRepairProjection.repairState != applied`, the dominant callback CTA becomes repair or recovery; the shell may not keep `reply`, `reschedule callback`, or other live promise-mutating controls visible beside the blocker
- applying a new contact path may not reopen callback response on its own; `ReachabilityDependency`, `ContactRouteRepairJourney`, the resulting `ReachabilityAssessmentRecord`, current return target, and current continuity evidence must all revalidate before ordinary callback actionability returns
- `PatientConsentCheckpointProjection.surfaceState = expired | renewal_pending | withdrawal_reconciliation` must suppress callback completion, pharmacy continuation, or other dependent quiet-success copy until renewal or withdrawal settlement settles under the current route intent and audience tier
- when `PatientConsentCheckpointProjection.checkpointClass = pharmacy`, the projection must preserve the selected provider, pathway, latest safe dispatch summary, and return target in place; provider change, scope drift, or post-dispatch revocation may not silently reuse an older consent grant or calm `referred` copy
- when `PatientConsentCheckpointProjection.checkpointClass = pharmacy`, the preserved selected-provider explanation, warned-choice acknowledgement, and `selectionBindingHash` must come from the current `PharmacyChoiceTruthProjection`; generic `best option` copy or hidden local resort is forbidden
- when `PatientConsentCheckpointProjection.checkpointClass = pharmacy`, `latest safe dispatch summary` must come from `latestPharmacyDispatchTruthRef`; transport acceptance, provider acceptance, or shared-mailbox delivery may widen pending guidance, but they may not render calm `referred` copy until `authoritativeProofState = satisfied`
- callback child routes may preserve the last safe expectation summary and latest settled outcome while pending, but they may not render a final `resolved` or quiet-success state until `CallbackResolutionGate.decision = complete | cancel | expire` and the current continuity evidence still validates the shell posture

## Health record contract

Patient record surfaces should turn dense medical information into an explanation-first workspace.

High-priority record-experience defects in this layer:

1. overview cards, record detail, and document actions are described functionally, but not yet bound to one patient-facing surface context derived from the active release, visibility, and shell consistency contracts
2. result comparison and trend rendering do not yet require normalized interpretation provenance, so unit drift, source drift, or incompatible reference ranges can be shown as if they were directly comparable
3. structured summaries and downloadable artifacts are not yet required to share one source-artifact bundle, so the patient can be shown a summary that no longer matches the underlying letter or file
4. action-needed follow-up cards are linked conceptually, but not yet governed by a live action-eligibility digest and record-scoped action context token
5. delayed-release, step-up, and identity-hold placeholders are required, but the section does not yet define same-shell anchor continuity and bounded recovery when a gated item refreshes or reopens

Build the health record experience around these patient-facing projections:

**PatientRecordSurfaceContext**
`recordSurfaceContextId`, `recordRef`, `recordVersionRef`, `patientShellConsistencyRef`, `recordVisibilityEnvelopeRef`, `recordReleaseGateRef`, `recordStepUpCheckpointRef`, `recordArtifactProjectionRefs[]`, `artifactParityDigestRefs[]`, `recordArtifactParityWitnessRefs[]`, `summarySafetyTier`, `renderMode = overview | detail | trend | document_summary | attachment`, `selectedAnchorRef`, `oneExpandedItemGroupRef`, `recordOriginContinuationRef`, `experienceContinuityEvidenceRef`, `surfaceTupleHash`, `continuationState = aligned | stale | blocked`, `surfaceState = visible | gated_placeholder | stale_recovery | read_only`

`PatientRecordSurfaceContext` materializes the lower-level route contracts into one patient-facing truth. Health-record UI may not improvise from mismatched overview and detail payloads.

**PatientResultInterpretationProjection**
`resultInterpretationId`, `recordRef`, `observationRef`, `displayValue`, `displayUnit`, `originalValue`, `originalUnit`, `referenceRangeRef`, `comparatorBasisRef`, `trendWindowRef`, `specimenRef`, `sourceOrganisationRef`, `abnormalityBasisRef`, `interpretationSummary`, `comparisonState = comparable | not_comparable | stale_source | partial_history`

`PatientResultInterpretationProjection` is the only allowed basis for result comparison, trend wording, and abnormality explanation.

**PatientRecordArtifactProjection**
`recordArtifactProjectionId`, `recordRef`, `recordVersionRef`, `structuredSummaryRef`, `structuredSummaryHash`, `summaryDerivationPackageRef`, `summaryRedactionTransformRef`, `sourceArtifactRef`, `sourceArtifactBundleRef`, `sourceArtifactHash`, `sourceRedactionTransformRef`, `extractVersionRef`, `artifactPresentationContractRef`, `artifactSurfaceBindingRef`, `artifactSurfaceContextRef`, `artifactSurfaceFrameRef`, `artifactModeTruthProjectionRef`, `binaryArtifactDeliveryRef`, `artifactByteGrantRef`, `artifactParityDigestRef`, `recordArtifactParityWitnessRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `recordVisibilityEnvelopeRef`, `recordReleaseGateRef`, `recordStepUpCheckpointRef`, `recordOriginContinuationRef`, `recoveryContinuationTokenRef`, `presentationMode = structured_summary | governed_preview | governed_download | external_handoff | placeholder_only | recovery_only`, `downloadEligibilityState`, `embeddedNavigationGrantRef`, `summaryParityState = verified | provisional | stale | extraction_failed | source_only | download_only | recovery_only`, `sourceAuthorityState = source_authoritative | summary_verified | summary_provisional | source_only | recovery_only`, `parityTupleHash`, `generatedAt`

`PatientRecordArtifactProjection` keeps structured summaries, letters, downloads, and any channel handoff aligned to one source artifact bundle plus one current `RecordArtifactParityWitness`, same-shell parity, transfer, fallback, and live `ArtifactModeTruthProjection`. The source artifact remains authoritative; a verified summary is a faithful derivative for the current tuple, not a second source of truth.

**PatientRecordFollowUpEligibilityProjection**
`recordFollowUpEligibilityId`, `recordRef`, `recordVersionRef`, `recordActionContextTokenRef`, `recordOriginContinuationRef`, `requiredVisibilityEnvelopeRef`, `requiredReleaseGateRef`, `requiredStepUpCheckpointRef`, `capabilityRef`, `capabilityLeaseExpiresAt`, `releaseState`, `visibilityTier`, `allowedNextActionRefs[]`, `blockingDependencyRefs[]`, `eligibilityFenceState = aligned | stale | blocked`, `eligibilityState = available | gated | recovery_only | unavailable`

`PatientRecordFollowUpEligibilityProjection` governs whether a record-origin action card may render as live, gated, or recovery-only.

**PatientRecordContinuityState**
`recordContinuityStateId`, `recordRef`, `recordVersionRef`, `selectedAnchorRef`, `expandedChildRef`, `oneExpandedItemGroupRef`, `recordVisibilityEnvelopeRef`, `recordStepUpCheckpointRef`, `recordReleaseGateRef`, `recordOriginContinuationRef`, `recoveryContinuationTokenRef`, `summarySafetyTier`, `placeholderContractRef`, `continuationState = stable | child_route_active | awaiting_step_up | delayed_release | identity_hold | recovering | blocked`

`PatientRecordContinuityState` preserves the patient's place while gated items step up, refresh, or recover in the same shell.

The records area should include:

- record overview with latest updates, medicines, allergies, conditions, and documents
- result detail with patient-safe summary, value, range, comparison, abnormality basis, and source metadata from `PatientResultInterpretationProjection`
- action-needed follow-up cards linking to message, appointment, or instructions only when `PatientRecordFollowUpEligibilityProjection` is live
- document and letter summaries with a clear route to the full structured view or file download, both backed by the same `PatientRecordArtifactProjection`

Rules:

- plain-language summary first, technical detail second
- no result status may rely on color alone; use text labels and iconography as well
- trend views must expose an accessible table or equivalent textual summary
- in `clarityMode = essential`, expand one result card or one document summary at a time
- every record card, result detail, trend view, document summary, and attachment view must render from one current `PatientRecordSurfaceContext`; if `recordVersionRef`, `recordReleaseGateRef`, or `recordVisibilityEnvelopeRef` drifts across child surfaces, live expansion and download controls freeze and the shell morphs to bounded recovery in place
- result comparison, reference-range explanation, and trend language must come only from `PatientResultInterpretationProjection`; if units, source organisation, specimen, or reference basis are incompatible, the UI must say the result is not directly comparable rather than implying a false trend
- structured summaries and file downloads must stay in parity through `PatientRecordArtifactProjection` plus `RecordArtifactParityWitness`; `ArtifactSurfaceFrame` plus `ArtifactParityDigest` must expose whether the summary is verified, provisional, source-only, or recovery-only, and if extraction is stale, gate posture drifts, or parity is not verified, the structured summary must degrade to provisional, source-only, or recovery copy while any still-allowed download remains explicitly labeled as the source artifact
- overview cards, result detail, document summaries, attachment views, and artifact actions for the same record version must share one `recordArtifactParityWitnessRef` plus one `parityTupleHash`; if the witness or tuple drifts between surfaces, the shell must keep the last safe summary visible and degrade in place rather than mixing a newer source artifact with an older extracted summary
- preview, byte delivery, and browser or overlay handoff copy must also derive from `PatientRecordArtifactProjection.artifactModeTruthProjectionRef`; parity, byte-grant validity, embedded bridge capability, masking scope, or return continuity drift must demote the surface to `structured_summary | placeholder_only | recovery_only` in place rather than leaving richer artifact posture live
- `PatientRecordArtifactProjection.sourceAuthorityState = summary_verified` is legal only while `summaryParityState = verified`, the current `RecordArtifactParityWitness.sourceAuthorityState = summary_verified`, `RecordArtifactParityWitness.recordGateState = visible`, the current `ArtifactParityDigest` still points at the same `sourceArtifactRef`, `structuredSummaryRef`, `recordVisibilityEnvelopeRef`, `recordReleaseGateRef`, and `recordStepUpCheckpointRef`, and the current `ArtifactModeTruthProjection.currentSafeMode` still permits the visible presentation
- every letter, document, attachment, or result-origin file action must resolve through `ArtifactPresentationContract`; if the contract allows only summary, placeholder, or read-only posture, the shell may not synthesize a richer body preview or deep-link raw bytes directly
- any browser download, overlay, or external handoff for a patient-visible artifact must require a short-lived route-bound delivery grant, one live `ArtifactTransferSettlement`, the current `ArtifactModeTruthProjection`, and the active `recordOriginContinuationRef`. In embedded mode that grant must be `OutboundNavigationGrant` bound to the current route family, `manifestVersionRef`, `sessionEpochRef`, `subjectBindingVersionRef`, lineage fence, and the same artifact-mode `truthTupleHash`. Stale or mismatched grants fail closed back into the same record shell with bounded recovery instead of opening a detached artifact route
- if the current `RecordArtifactParityWitness.recordGateState != visible`, the shell must preserve the same record anchor and last safe summary or placeholder while demoting preview, download, print, or browser handoff to governed placeholder or recovery posture; delayed-release and step-up drift may not hide behind a stale `summary_verified` label
- patient-visible artifact handoff may look locally acknowledged, but download readiness, external availability, safe return, or recovery posture must follow `artifactTransferSettlementRef` and `artifactFallbackDispositionRef` rather than a browser event or detached handoff page
- no patient-visible artifact preview may remain calm, complete, or full-fidelity after `ArtifactModeTruthProjection.previewTruthState != preview_ready` or `returnTruthState = stale | blocked`, even if cached bytes or a browser tab still exists
- record-origin follow-up cards may render as live actions only while `PatientRecordFollowUpEligibilityProjection.eligibilityState = available`, `eligibilityFenceState = aligned`, and the referenced `recordActionContextTokenRef` plus `recordOriginContinuationRef` remain active under the current release and visibility posture
- any record-origin follow-up into booking, messaging, callback, request-detail recovery, or artifact handoff must preserve `selectedAnchorRef` and `oneExpandedItemGroupRef`, carry the active `RecordOriginContinuationEnvelope`, and issue or reuse one `RecoveryContinuationToken` through `PatientRecordContinuityState.recoveryContinuationTokenRef` before the patient leaves the record shell
- any record-origin follow-up, gated-result recovery, delayed-release resume, or artifact recovery must also bind one `PatientExperienceContinuityEvidenceProjection` with `controlCode = record_continuation`; if the linked `experienceContinuityEvidenceRef` is stale, blocked, or no longer points at the current continuation envelope and anchor set, live follow-up controls freeze and the shell keeps the current record anchor visible until same-shell recovery is revalidated
- if `recordActionContextTokenRef`, `recordOriginContinuationRef`, `recordReleaseGateRef`, `recordStepUpCheckpointRef`, or session lineage drifts before the child route settles, the portal must recover back into the same record shell with the prior anchor and bounded next-step guidance rather than reopening the child route as if the old record context were still valid
- delayed-release, step-up-required, identity-held, or otherwise gated record items must preserve the current `selectedAnchorRef` and `oneExpandedItemGroupRef` through `PatientRecordContinuityState`; refresh, reconnect, or re-entry must not silently collapse the record and drop the patient into a different item
- delayed-release, step-up-required, or otherwise gated record items must show a governed placeholder with next-step explanation rather than silent omission
- documents and letters should prefer structured in-browser summaries with file download as a secondary action
- any result, document, or letter promoted into the patient home spotlight must carry `releaseState`, `visibilityTier`, and `summarySafetyTier`; unreleased or step-up-gated items may contribute urgency, but they may only render a governed placeholder and next step in the home shell

## Communications timeline contract

Patient communications should be threaded and source-aware.

- appointment confirmations and reminders
- callback expectation messages
- clinician message thread events
- pharmacy instruction and outcome messages
- hub alternative and callback notifications

Default to the latest relevant entries with a clear way to open full history. Each entry should include channel, transport state, visible template name where allowed, `visibilityTier`, `previewMode`, `transportAckState`, `deliveryEvidenceState`, `deliveryRiskState`, `authoritativeOutcomeState`, and `reachabilityDependencyRef` where applicable.

`PatientCommunicationVisibilityProjection` must govern preview depth and must reference the active `PatientAudienceCoverageProjection`:

- `public_safe_summary`: neutral subject line, generic status, no PHI-bearing body preview
- `authenticated_summary`: patient-safe preview where release and identity policy allow
- `step_up_required`: placeholder plus reason and next step
- `suppressed_recovery_only`: recovery or dispute notice with no sensitive content

**PatientCommunicationVisibilityProjection**
`communicationVisibilityProjectionId`, `clusterOrThreadRef`, `patientShellConsistencyRef`, `audienceTier`, `releaseState`, `stepUpRequirementRef`, `visibilityTier`, `summarySafetyTier`, `minimumNecessaryContractRef`, `previewVisibilityContractRef`, `visibleSnippetRefs[]`, `previewMode = public_safe_summary | authenticated_summary | step_up_required | suppressed_recovery_only`, `placeholderContractRef`, `hiddenContentReasonRefs[]`, `redactionPolicyRef`, `safeContinuationRef`, `latestReceiptEnvelopeRef`, `latestSettlementRef`, `experienceContinuityEvidenceRef`, `computedAt`

`PatientCommunicationVisibilityProjection` is the visibility envelope for conversation list rows, thread mastheads, callback cards, and inline receipts. If richer content cannot be shown, the same cluster must remain present as a governed placeholder with safe continuation guidance; the shell may not hide the work item entirely or leak content beyond the current audience tier, current preview contract, or current summary tier.

Communications entries may only preview content at or below the current audience tier, step-up state, and `previewVisibilityContractRef`. If a thread, result notice, or booking reminder exceeds that threshold, the shell must show why the preview is limited and how to continue safely.

`ConversationThreadProjection`, `PatientReceiptEnvelope`, `PatientRequestSummaryProjection`, and `PatientDocumentLibraryProjection` must each bind the same `PatientAudienceCoverageProjection` or a stricter one. Public-safe digests may not hydrate themselves into authenticated bodies, attachment previews, or richer timeline copy after the shell mounts.

Delivery failures, bounces, unreachable contact routes, or provider-channel disputes must remain visible in the timeline until resolved; they are operational facts, not hidden transport details.

## Callback and message visibility

Patient pages should include:

- callback expectation state
- callback outcome state
- clinician message thread with reply controls where enabled
- clear wording for what happens next

Callback and message views must also expose:

- route health for the active contact path
- whether the latest outbound message is still being checked, at risk, delivered, bounced, expired, or disputed
- whether the patient can safely reply now or must first repair identity, consent, or contact route

If the active contact route is degraded and blocks a clinically relevant callback or reply path, the same shell must surface `PatientReachabilitySummaryProjection` with a dominant repair CTA instead of quietly hiding the dependency inside account settings.

If a waitlist offer, alternative offer, reminder, pharmacy contact path, or admin-resolution follow-up is blocked on contact-route truth, the same shell must surface the linked `PatientContactRepairProjection` and preserve the blocked action context instead of routing the patient to detached account maintenance.

Conversation list-state, open thread posture, and cluster-level reassurance must materialize from `ConversationThreadProjection`, typed `ConversationSubthreadProjection` rows, `PatientConversationPreviewDigest`, `PatientComposerLease`, `PatientReceiptEnvelope`, and the latest `ConversationCommandSettlement`, not from local draft state, transient toasts, or delivery callbacks alone.

The same summary and cluster posture must also bind one `PatientExperienceContinuityEvidenceProjection` with `controlCode = conversation_settlement`. If conversation continuity evidence is stale, blocked, or degraded, the shell may still show the active cluster and the latest safe receipt copy, but it must not collapse into `reviewed`, `settled`, or quiet-success posture until the current `experienceContinuityEvidenceRef` validates the governing settlement chain.

Rules:

- unread, `reply needed`, `awaiting review`, `reviewed`, and `settled` cues may advance only from the authoritative receipt and settlement chain for the current cluster or callback case; `deliveryRiskState` may widen pending or repair guidance, but it may not manufacture delivery or closure
- `ConversationThreadProjection`, `ConversationSubthreadProjection`, `CommunicationEnvelope`, `PatientCommunicationVisibilityProjection`, `PatientConversationPreviewDigest`, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, `PatientCallbackStatusProjection`, and `PatientExperienceContinuityEvidenceProjection(controlCode = conversation_settlement)` must share one current `clusterRef`, one `threadId`, `threadTupleHash`, `receiptGrammarVersionRef`, `monotoneRevision`, `previewVisibilityContractRef`, and `summarySafetyTier`; if any of them drift, the list row, thread masthead, callback card, reminder notice, and composer affordance must freeze into bounded pending, placeholder, or recovery posture rather than diverging
- if `PatientCommunicationVisibilityProjection.previewMode = step_up_required | suppressed_recovery_only`, the same cluster must render through `placeholderContractRef` with next-step guidance; governed preview limits may not hide a valid thread from the patient
- `replyNeededState`, `awaitingReviewState`, `repairRequiredState`, and `dominantNextActionRef` must stay identical between the preview digest and the open cluster for the same revision; if they disagree, the shell must trust the last safe authoritative tuple and suppress mutating controls until rebuilt
- each visible message, callback, reminder, more-info cycle, or actionable instruction in the open cluster must retain one typed `ConversationSubthreadProjection`; the patient shell may collapse quiet history, but it may not merge subthreads whose owner, `replyTargetRef`, `replyWindowRef`, or workflow branch differs
- `PatientComposerLease` must keep the same selected anchor and draft context visible while a reply, acknowledgement, repair, or callback response command is pending; review, repair, or stale-route outcomes freeze or resume the existing composer instead of reopening a fresh live form
- patient-visible `delivered`, `reviewed`, or `settled` language requires the current evidence and settlement chain for the active cluster; `transportAckState` and `deliveryRiskState` may explain pending or repair posture, but they may not manufacture calm success
- `PatientReceiptEnvelope.localAckState` and `deliveryEvidenceState` may acknowledge progress, but they may not collapse the same shell into final reassurance before authoritative conversation settlement or callback expectation refresh lands
- reminder notices, reminder delivery failures, and callback fallback must stay in the same cluster through `ConversationSubthreadProjection(subthreadType = reminder)` and the current `CommunicationEnvelope`; appointment banners or reminder chips may summarize that subthread, but they may not replace thread truth
- thread, callback, and repair announcements must resolve through one `AssistiveAnnouncementTruthProjection` bound to the active cluster anchor, `PatientReceiptEnvelope`, `ConversationCommandSettlement`, `PatientActionSettlementProjection`, and the current `UIEventEmissionCheckpoint`; autosave, resend, reconnect, or support replay may emit one current-state digest, but they may not replay historical send acknowledgements or delivery cues as fresh activity
- support-triggered resend, channel change, attachment recovery, or reissue may widen pending or repair guidance only through the current receipt and settlement chain for the same cluster; support-local acknowledgement or provisional workbench state may not mark the cluster sent, delivered, reviewed, or settled
- if support repair is still `awaiting_external` or `stale_recoverable`, the same cluster must keep its selected anchor, latest safe receipt copy, and recovery guidance visible; the preview digest may not become calmer than the linked support settlement, delivery evidence, and continuity evidence justify
- if step-up, reachability repair, or stale-link recovery interrupts the thread, the shell must consume `RecoveryContinuationToken` and reopen the same cluster and typed subthread anchor rather than dropping the patient back to a generic message-center landing page
- route repair may not reopen live reply or callback controls until the linked verification checkpoint rebounds and the active `ContactRouteRepairJourney` still matches the current cluster anchor and continuity evidence

Migration and rollout rules:

- rebuild existing preview digests from the current authoritative receipt and settlement chain before enabling `reviewed`, `settled`, or quiet-success list posture
- any live cluster missing `threadId`, `threadTupleHash`, `visibilityProjectionRef`, `latestReceiptEnvelopeRef`, `latestSettlementRef`, `experienceContinuityEvidenceRef`, or `receiptGrammarVersionRef` must downgrade to placeholder, pending, or recovery posture rather than inferred calmness

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

**PatientManageCapabilitiesProjection**
`manageCapabilitiesProjectionId`, `subjectSurfaceRef`, `governingObjectRef`, `patientShellConsistencyRef`, `dominantCapabilityRef`, `secondaryCapabilityRefs[]`, `blockingDependencyRefs[]`, `selectedAnchorRef`, `requestReturnBundleRef`, `projectionState = ready | pending | repair_required | read_only | recovery_required`, `computedAt`

`PatientManageCapabilitiesProjection` is the single capability digest for request detail, callback status, records follow-up, appointments, pharmacy continuation, and repair-bound child routes. It keeps dominant and secondary actions honest to the same governing object, blocker set, and return target.

Every action exposed by `PatientManageCapabilitiesProjection` must also carry:

- `capabilityRef`
- `decisionRef`
- `canonicalObjectDescriptorRef`
- `entityVersionRef`
- `governingObjectVersionRef`
- `capabilityLeaseExpiresAt`
- `routeIntentBindingRef`
- `routeContractDigestRef`
- `projectionCompatibilityDigestRef`
- `routeIntentTupleHash`
- `idempotencyKeyTemplate`
- `dependencyState`
- `recoveryRouteFamily`
- `requiredReleaseApprovalFreezeRef`
- `requiredChannelReleaseFreezeRef`
- `requiredAssuranceSliceTrustRefs[]`

Rules:

- a CTA is live only while its capability lease, governing-object version, audience tier, bound `RouteIntentBinding`, `routeContractDigestRef`, `projectionCompatibilityDigestRef`, `routeIntentTupleHash`, and required release or trust posture still match the current shell consistency envelope
- if the governing object moves, the CTA must morph in place to pending or recovery guidance rather than submitting against stale state
- once a `RouteIntentBinding` exists, the CTA may not derive mutation authority from URL params, list-row memory, or detached projection fragments; those may only help re-find the same bound object
- if a dependency such as reachability repair, step-up, or consent renewal blocks the action, the dominant CTA becomes the dependency repair route, not the blocked action itself
- if a waitlist or alternative-offer surface is still present but the current continuation truth says fallback is now due, the dominant CTA must become the governed callback, hub, or recovery route instead of leaving stale `Accept offer` or `Keep waiting` posture live
- if required assurance trust degrades or a linked release or channel freeze becomes active, the same shell must downgrade to read-only, placeholder, or safe-route recovery through the active disposition instead of leaving the old mutation CTA live
- the home spotlight and request header may each show only one dominant CTA, and both must resolve from the same capability-decision record

## Typed patient action routing contract

<!-- Architectural correction: patient actions are typed commands bound to live governing objects. This closes the baseline gap where booking, callback, messaging, and pharmacy actions could otherwise be over-routed back into generic triage. -->

**PatientActionRoutingProjection**
`actionRoutingProjectionId`, `actionRef`, `actionScope`, `governingObjectRef`, `canonicalObjectDescriptorRef`, `governingObjectVersionRef`, `owningRouteFamily`, `routeProfileRef`, `routeIntentBindingRef`, `routeContractDigestRef`, `projectionCompatibilityDigestRef`, `routeIntentTupleHash`, `policyBundleRef`, `decisionRef`, `entityVersionRef`, `capabilityLeaseExpiresAt`, `consistencyToken`, `freshnessToken`, `governingFenceEpochHint`, `requiredReleaseApprovalFreezeRef`, `requiredChannelReleaseFreezeRef`, `requiredAssuranceSliceTrustRefs[]`, `requestReturnBundleRef`, `expiryAt`

`PatientActionRoutingProjection` is the typed routing envelope exported by every live CTA. It binds one patient action to one governing object, one shell return target, and one release or trust posture before the mutation gate runs.

**PatientActionSettlementProjection**
`actionSettlementProjectionId`, `actionRoutingProjectionRef`, `commandActionRecordRef`, `commandSettlementRef`, `localAckState = none | shown | superseded`, `processingAcceptanceState = not_started | accepted_for_processing | awaiting_external_confirmation | externally_accepted | externally_rejected | timed_out`, `externalObservationState = unobserved | projection_visible | external_effect_observed | review_disposition_observed | recovery_observed | disputed | failed | expired`, `authoritativeOutcomeState = pending | projection_pending | review_required | reconciliation_required | stale_recoverable | blocked_policy | denied_scope | recovery_required | settled | failed | expired | superseded`, `sameShellState = pending | quiet_suppressed | read_only | recovery_required | settled`, `confirmedArtifactRefs[]`, `recoveryContinuationRef`, `requestReturnBundleRef`, `patientActionRecoveryEnvelopeRef`, `summarySafetyTier`, `recoveryTupleHash`, `experienceContinuityEvidenceRef`, `recordedAt`

`PatientActionSettlementProjection` is the patient-safe settlement view over the canonical mutation chain. It keeps local acknowledgement, processing acceptance, external observation, authoritative outcome, and quiet-return eligibility distinct so the shell cannot cosmetically complete before truth, continuity, and return posture all agree. `sameShellState = settled` is legal only when `authoritativeOutcomeState = settled` and the linked continuity evidence proves the current return posture. When `authoritativeOutcomeState = stale_recoverable | blocked_policy | denied_scope | expired | recovery_required`, the projection must point to one current `PatientActionRecoveryEnvelope`; route-local stale handling is not allowed.

**PatientSafetyInterruptionProjection**
`patientSafetyInterruptionProjectionId`, `governingRequestRef`, `currentEvidenceAssimilationRef`, `currentMaterialDeltaAssessmentRef`, `currentEvidenceClassificationRef`, `currentSafetyPreemptionRef`, `currentSafetyDecisionRef`, `currentUrgentDiversionSettlementRef`, `safetyDecisionEpoch`, `surfaceState = assimilation_pending | review_pending | urgent_required | urgent_issued | residual_review | manual_review_required`, `suppressedActionRefs[]`, `dominantSafetyActionRef`, `lastSafeSummaryRef`, `recoveryContinuationRef`, `renderedAt`

`PatientSafetyInterruptionProjection` is the same-shell safety contract for late evidence and urgent interruption. It must explain whether the request is waiting on evidence assimilation, re-safety, urgent issuance, residual-review continuation, or manual fallback, and it must suppress stale actionability without discarding the current request anchor.

Every action emitted by `PatientManageCapabilitiesProjection` must carry:

- `actionScope`
- `governingObjectRef`
- `canonicalObjectDescriptorRef`
- `owningRouteFamily`
- `routeProfileRef`
- `routeIntentBindingRef`
- `governingObjectVersionRef`
- `routeContractDigestRef`
- `projectionCompatibilityDigestRef`
- `routeIntentTupleHash`
- `policyBundleRef`
- `requiresStepUp`
- `preemptionPolicy`
- `decisionRef`
- `entityVersionRef`
- `capabilityLeaseExpiresAt`
- `idempotencyKeyTemplate`
- `consistencyToken`
- `freshnessToken`
- `governingFenceEpochHint`
- `settlementProjectionRef`
- `recoveryRouteFamily`
- `requiredReleaseApprovalFreezeRef`
- `requiredChannelReleaseFreezeRef`
- `requiredAssuranceSliceTrustRefs[]`
- `expiryAt` where relevant

Submission through `ScopedMutationGate` must resolve or refresh the current `RouteIntentBinding`, persist one `CommandActionRecord`, and return one authoritative `CommandSettlementRecord`. `PatientActionSettlementProjection` is therefore a patient-safe view over that canonical settlement chain, not a substitute for it.

Routing matrix:

- `respond_more_info` -> request detail child surface -> active `MoreInfoCycle`
- `message_reply` -> message thread child surface -> `ClinicianMessageThread`
- `callback_response` -> callback status child surface -> `CallbackCase`
- `waitlist_offer` -> appointment-manage child surface -> `WaitlistOffer` plus current `WaitlistContinuationTruthProjection`
- `alternative_offer` -> request detail or appointment child surface -> `AlternativeOfferSession`, current `AlternativeOfferOptimisationPlan`, current `AlternativeOfferFallbackCard`, and current `HubOfferToConfirmationTruthProjection`
- `appointment_manage_entry` -> appointment-manage child surface -> `BookingCase` or `HubCoordinationCase`, plus current `HubOfferToConfirmationTruthProjection` when the appointment is hub-managed
- `pharmacy_status_entry` -> pharmacy child surface -> `PharmacyCase`, plus current `PharmacyChoiceTruthProjection` when provider choice, recommendation, or warned override is live, and provider-bound consent checkpoint plus current `PharmacyDispatchTruthProjection` when dispatch, redispatch, or patient reassurance is blocked on current referral consent, dispatch-plan drift, or withdrawal reconciliation
- `contact_route_repair` -> contact-repair child surface -> active `ContactRouteRepairJourney` bound to `ReachabilityDependency`

Rules:

- no CTA may omit `governingObjectRef`, `canonicalObjectDescriptorRef`, or `routeIntentTupleHash`
- no mutating CTA may bypass `ScopedMutationGate`; the patient shell must submit `actionScope`, `routeProfileRef`, `routeIntentBindingRef`, `policyBundleRef`, `freshnessToken`, latest governing-object version, `routeContractDigestRef`, `projectionCompatibilityDigestRef`, `routeIntentTupleHash`, required release or trust posture, and idempotency key through the canonical mutation gate rather than posting directly to a domain endpoint
- no fallback mutation route may post directly to the generic triage queue when a governing object exists
- routing must reject stale `entityVersionRef`, expired capability lease, mismatched `consistencyToken`, mismatched `routeIntentTupleHash`, or mismatched canonical object descriptor and re-enter the same shell through recovery rather than dropping the patient into a generic error
- once `routeIntentBindingRef` exists, route params, cached cards, and detached settlement previews may not retarget a mutation toward a sibling message thread, callback case, booking case, waitlist offer, pharmacy case, or repair journey
- `alternative_offer` child routes may expose live accept, decline, or callback only while the current `AlternativeOfferSession`, `AlternativeOfferOptimisationPlan`, `AlternativeOfferEntry` or `AlternativeOfferFallbackCard`, and any `AlternativeOfferRegenerationSettlement` still match the current `HubOfferToConfirmationTruthProjection`; regenerated or superseded sessions must keep the last safe option set visible as read-only provenance and recover in shell rather than silently reopening stale choice
- if submitted payload becomes `potentially_clinical` or `contact_safety_relevant`, keep the user in the same request shell, show `PatientSafetyInterruptionProjection`, and let `SafetyOrchestrator` preempt behind that shell
- if `PatientSafetyInterruptionProjection.surfaceState = assimilation_pending | review_pending | urgent_required | manual_review_required`, suppress calm cancel, reply, booking-manage, callback, pharmacy, and completion CTAs until the latest `EvidenceAssimilationRecord`, `MaterialDeltaAssessment`, `SafetyDecisionRecord`, and any required `UrgentDiversionSettlement` settle for the current `safetyDecisionEpoch`
- if `PatientActionSettlementProjection.authoritativeOutcomeState = pending | projection_pending | review_required | reconciliation_required | stale_recoverable | blocked_policy | denied_scope | recovery_required`, render it inside the same shell instead of showing a generic success or error page
- `PatientActionSettlementProjection` may acknowledge `localAckState`, `processingAcceptanceState`, or `externalObservationState`, but durable reassurance and `sameShellState = settled` may advance only from `CommandSettlementRecord.authoritativeOutcomeState = settled` or command-following projection truth on the same governing object chain; transport success, local acknowledgement, projection lag, and stale child-route state are not valid substitutes
- patient-safe live narration must keep `localAckState`, `processingAcceptanceState`, `externalObservationState`, `authoritativeOutcomeState`, freshness posture, and recovery state semantically distinct; reply sent, callback queued, pharmacy consent captured, waitlist updated, and action settled may not reuse one announcement string or urgency band
- no final reassurance text may render until the returned causal token or command-following refresh confirms `authoritativeOutcomeState = settled` for the governing object under the current audience tier
- no request-detail, status, booking-manage, callback, or pharmacy shell may appear calmer than the latest `PatientSafetyInterruptionProjection`; stale action-settlement success may not outrun a later safety epoch
- every mutation-capable child route must keep `requestReturnBundleRef` or the equivalent record or conversation continuation target attached to `PatientActionRoutingProjection` and `PatientActionSettlementProjection`; return may not be reconstructed from ambient navigation state after mutation starts
- respond-to-more-info child routes must also bind one `PatientMoreInfoStatusProjection` and one `PatientExperienceContinuityEvidenceProjection` with `controlCode = more_info_reply`; if either drifts, preserve the last safe question summary and recovery path but suppress live reply posture
- expired or superseded actions must morph to recovery guidance in place rather than disappearing after tap
- if booking, hub, or pharmacy work is disputed, reconciliation-bound, or identity-held, morph the same shell into a calm recovery or pending state instead of emitting false final assurance
- appointment-manage, waitlist-offer, and alternative-offer child routes must also bind one `PatientExperienceContinuityEvidenceProjection` with `controlCode = booking_manage`; if the linked `experienceContinuityEvidenceRef` is stale, blocked, or no longer points at the active appointment lineage and manage settlement chain, the shell may preserve the booked summary and recovery path but it must not present calm cancel, reschedule, reminder, or offer-acceptance posture
- waitlist-offer child routes must also bind one current `WaitlistContinuationTruthProjection`; if that projection says `patientVisibleState = callback_expected | hub_review_pending | expired` or `windowRiskState = fallback_due | overdue`, the same shell must preserve the active offer or waitlist-preference summary as provenance but suppress stale waitlist acceptance and promote the governed fallback or recovery path in place
- pharmacy child routes that expose provider choice or change-pharmacy must also bind one current `PharmacyChoiceTruthProjection`; if `choiceProofRef`, `choiceDisclosurePolicyRef`, `selectionBindingHash`, or `visibleChoiceSetHash` drifts, the shell may preserve the last safe provider summary and recovery path but it must not present stale recommendation order, hidden-choice subsets, or live choose or change controls
- pharmacy child routes that expose pending, referred, or redispatch posture must also bind one current `PharmacyDispatchTruthProjection`; if `dispatchPlanRef`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `packageHash`, or `outboundReferenceSetHash` drifts, the shell may preserve the last safe chosen-provider summary and pending explanation but it must not present stale referred reassurance, retry affordance, or transport-specific promises
- if the current `RouteIntentBinding`, required `ReleaseApprovalFreeze`, active `ChannelReleaseFreezeRecord`, or required `AssuranceSliceTrustRecord` rows no longer allow writable posture, typed routing must fail closed into the same shell's bounded recovery or read-only mode instead of attempting the mutation
- if the governing dependency is a degraded contact route or delivery dispute, typed routing must validate the current `ReachabilityAssessmentRecord` and `reachabilityEpoch`, then enter `contact-route repair` or the relevant recovery child surface before allowing further transactional mutation
- contact-route repair may not resolve to generic profile maintenance; the repair route must preserve the blocked action summary, current `selectedAnchorRef`, `requestReturnBundleRef` where present, and `resumeContinuationRef` until `ContactRouteVerificationCheckpoint.rebindState = rebound`

## Recovery and identity-hold contract

<!-- Architectural correction: expired links, wrong-patient holds, consent expiry, and disputed downstream states must recover inside the same request shell. They must not dump the patient to generic errors, blank pages, or false-success confirmations. -->

`PatientActionRecoveryProjection` and `PatientIdentityHoldProjection` should render through the same `PersistentShell` as the originating request, callback, booking, hub, or pharmacy flow.

**PatientActionRecoveryProjection**
`actionRecoveryProjectionId`, `governingObjectRef`, `originRouteFamilyRef`, `patientShellConsistencyRef`, `patientDegradedModeProjectionRef`, `blockedActionRef`, `patientRecoveryLoopRef`, `recoveryReasonCode`, `entryChannelRef = secure_link | authenticated | embedded | deep_link | child_route`, `lastSafeSummaryRef`, `summarySafetyTier`, `selectedAnchorRef`, `requestReturnBundleRef`, `recoveryContinuationRef`, `actionRecoveryEnvelopeRef`, `writableEligibilityFenceRef`, `nextSafeActionRef`, `reentryRouteFamilyRef`, `surfaceState = pending | repair_required | read_only | recovery_required | settled_return_ready`, `recoveryTupleHash`, `experienceContinuityEvidenceRef`, `renderedAt`

`PatientActionRecoveryProjection` is the same-shell recovery frame for stale routes, expired actions, disputed external confirmation, and post-submit repair. It must keep the last safe summary and dominant recovery action visible instead of replacing the journey with a generic expired-link page. For one underlying action chain, secure-link, signed-in, embedded, deep-link, and child-route recovery must all render from the same `actionRecoveryEnvelopeRef`, `recoveryTupleHash`, and `PatientDegradedModeProjection.currentMode`.

`PatientActionRecoveryProjection`, `PatientIdentityHoldProjection`, `PatientSecureLinkSessionProjection`, and `PatientEmbeddedSessionProjection` are binding-fenced consumers of the latest settled `IdentityBinding`. Auth return, secure-link uplift, embedded resume, and support correction may reopen PHI-bearing detail or writable action only while the referenced binding version still matches the authority-settled lineage.

**PatientIdentityHoldProjection**
`identityHoldProjectionId`, `identityRepairCaseRef`, `identityRepairFreezeRef`, `identityBindingRef`, `bindingVersionRef`, `resultingIdentityBindingRef`, `identityRepairReleaseSettlementRef`, `bindingFenceState = aligned | superseded | awaiting_correction`, `governingObjectRef`, `patientShellConsistencyRef`, `patientDegradedModeProjectionRef`, `holdReasonRef`, `downstreamDispositionSummaryRef`, `allowedSummaryTier`, `suppressedActionRefs[]`, `writableEligibilityFenceRef`, `nextSafeActionRef`, `requestReturnBundleRef`, `resumeContinuationRef`, `surfaceState = active | awaiting_verification | read_only | recovery_required | released`, `renderedAt`

`PatientIdentityHoldProjection` is the only patient-visible shell allowed to explain a wrong-patient or binding dispute while suppressing PHI-bearing detail. It keeps the original route context visible at summary tier, carries the active `IdentityRepairFreezeRecord` plus downstream branch summary, and binds release back to the correct return target only after `IdentityRepairCase`, the resulting authority-settled `IdentityBinding` version, and `IdentityRepairReleaseSettlement` all settle.

**PatientSecureLinkSessionProjection**
`patientSecureLinkSessionId`, `accessGrantRef`, `grantFamily`, `grantState`, `grantScopeEnvelopeRef`, `accessGrantRedemptionRef`, `grantSupersessionRef`, `routeIntentBindingRef`, `postAuthReturnIntentRef`, `sessionEstablishmentDecisionRef`, `subjectRef`, `identityBindingRef`, `requiredIdentityBindingRef`, `subjectBindingVersionRef`, `sessionEpochRef`, `lineageFenceEpoch`, `tokenKeyVersionRef`, `fenceState = aligned | stale_session | stale_binding | stale_lineage | superseded | expired`, `proofState = pending | session_bound | step_up_required | invalid`, `audienceTier`, `resumeContinuationRef`, `patientActionRecoveryEnvelopeRef`, `lastSafeSummaryRef`, `summarySafetyTier`, `recoveryRouteFamily`, `expiryAt`, `sessionState = live | step_up_required | stale_recoverable | superseded | expired`

`PatientSecureLinkSessionProjection` is required whenever entry arrives through secure-link, uplift, continuation, or recovery-grant redemption. Secure-link landing may not rely on URL possession alone once shell state begins to render, and it may not carry forward a superseded patient lineage after auth return or support correction.

Recovery surfaces should show:

- why the original action is blocked: expired, superseded, already used, wrong patient, lineage-level identity hold, consent expired, or external confirmation disputed
- the safest next step: re-authenticate, step up, renew consent, restore contact route, or resume the current child flow
- zero PHI beyond the current audience tier
- timeline evidence that the case is under review, paused, or awaiting confirmation where applicable
- whether the shell is waiting for consistency refresh, delivery repair, or governing-object reconciliation before the original action can resume

Rules:

- no expired or superseded action may hard-fail to 404 or to a generic home redirect when lineage can still be recovered
- secure-link landing and recovery must validate the current `AccessGrant`, `grantState`, `grantScopeEnvelopeRef`, `accessGrantRedemptionRef`, any `grantSupersessionRef`, `tokenKeyVersionRef`, `RouteIntentBinding`, current `IdentityBinding`, `requiredIdentityBindingRef`, `subjectBindingVersionRef`, `sessionEpochRef`, `lineageFenceEpoch`, `fenceState`, and expiry before any live CTA, reply control, or transactional detail is shown
- URL grant redemption may only create or refresh `PatientSecureLinkSessionProjection`; once `proofState = session_bound`, every write must arrive through the secure-link session cookie and CSRF secret rather than by replaying the URL grant
- exact replay of a used, superseded, or rotated secure link must return the current `accessGrantRedemptionRef` or same-lineage recovery posture; it may not mint a second session or second authorized entry path
- NHS login uplift or `claim_step_up` entered from a secure-link shell must also settle one current `SessionEstablishmentDecision`; anonymous, stale, or different-subject browser sessions may not be upgraded in place, and any subject conflict must preserve only bounded same-shell recovery until the correct session is established
- stale, superseded, expired, step-up-required, or non-session-bound secure-link sessions must preserve only non-sensitive shell context and reopen bounded recovery in place; they may not silently switch subject, reopen a stale live composer, or route to a generic success page
- secure-link, authenticated, embedded, and direct child-route recovery for the same patient action must converge on the same `PatientActionRecoveryEnvelope`, blocked reason, preserved summary tier, next safe action, and `PatientDegradedModeProjection.currentMode`; channel-specific stale-action copy is forbidden
- `PatientActionRecoveryProjection` must keep `lastSafeSummaryRef`, `selectedAnchorRef`, and `requestReturnBundleRef` visible whenever the original action can still be resumed or safely explained
- `PatientActionRecoveryProjection`, `PatientRequestReturnBundle`, and `RecoveryContinuationToken` must share one `recoveryTupleHash`; if any part of that tuple drifts, the shell must stay recovery-bound or read-only until a fresh envelope is minted
- `PatientPortalEntryProjection`, `PatientActionRecoveryProjection`, `PatientIdentityHoldProjection`, `PatientSecureLinkSessionProjection`, `PatientEmbeddedSessionProjection`, and any patient-visible artifact fallback must resolve the same `PatientDegradedModeProjection.truthTupleHash`; if one contributor drifts, the shell must keep the stricter mode and suppress stale reassurance or writable posture
- `PatientIdentityHoldProjection` may leave hold posture only when `IdentityRepairFreezeRecord.freezeState = released`, the latest `IdentityBinding` matches `IdentityRepairReleaseSettlement.resultingIdentityBindingRef`, and any downstream `IdentityRepairBranchDisposition` that governs the visible branch is already `released`
- booked slots, pharmacy provider cards, callback promises, message threads, and artifact previews created under the frozen binding may remain as safe summary context, but they may not reopen PHI-bearing detail or live controls until the corresponding downstream branch disposition has been rebuilt or compensated
- local caches, inline previews, and previously rendered PHI snippets captured before the active repair freeze must be discarded or reduced to summary-only content; the shell may not replay pre-freeze detail from client memory after wrong-patient hold begins
- when `blockedActionRef` depends on a degraded contact path, `PatientActionRecoveryProjection` and `PatientRecoveryLoop` must reopen the same `ContactRouteRepairJourney`; redirecting to generic account settings or a detached success confirmation is invalid
- lineage-level identity-hold or binding-supersession metadata suppresses PHI-bearing detail and dominant transactional CTAs until `IdentityRepairCase` resolves and the expected resulting binding is current
- pharmacy consent expiry, supersession, or post-dispatch revocation must render a consent-renewal or withdrawal-reconciliation checkpoint in place rather than silently cancelling the referral or preserving stale reassurance
- disputed booking or hub confirmation must stay in a provisional or recovery state until authoritative resolution lands
- recovery completion must re-enter typed routing, current `RouteIntentBinding`, and command-following causal reads before calm reassurance or writable posture resumes; preserved summary alone is not enough to reopen the old CTA
- authenticated portal routes and secure-link routes must use the same typed routing, route-intent, and authoritative settlement chain so the same patient action cannot behave differently by entry channel
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
- message center, conversation cluster, thread, and reply
- contact-route repair
- action recovery and identity-hold recovery
- contact settings
- secure-link landing and recovery

Whenever `channelType = embedded`, the active route family must also materialize `PatientEmbeddedSessionProjection` carrying at least `subjectRef`, `identityBindingRef`, `requiredIdentityBindingRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `minimumBridgeCapabilitiesRef`, `currentBridgeCapabilityMatrixRef`, `routeFreezeDispositionRef`, `recoveryRouteRef`, and `computedAt`.

**PatientEmbeddedSessionProjection**
`patientEmbeddedSessionProjectionId`, `subjectRef`, `identityBindingRef`, `requiredIdentityBindingRef`, `sessionEpochRef`, `subjectBindingVersionRef`, `manifestVersionRef`, `releaseApprovalFreezeRef`, `channelReleaseFreezeState = monitoring | frozen | kill_switch_active | rollback_recommended | released`, `minimumBridgeCapabilitiesRef`, `currentBridgeCapabilityMatrixRef`, `routeFreezeDispositionRef`, `patientDegradedModeProjectionRef`, `recoveryRouteRef`, `projectionState = trusted | degraded | frozen | recovery_required`, `computedAt`

`PatientEmbeddedSessionProjection` is the patient-side embedded runtime fence. Embedded route truth may not be inferred from user-agent hints, script presence, or stale callback state once shell rendering begins.

**PatientEmbeddedNavEligibility**
`patientEmbeddedNavEligibilityId`, `routeFamilyRef`, `patientEmbeddedSessionProjectionRef`, `patientDegradedModeProjectionRef`, `currentBridgeCapabilityMatrixRef`, `minimumBridgeCapabilitiesRef`, `requiredBridgeActionRefs[]`, `allowedBridgeActionRefs[]`, `currentBridgeActionLeaseRefs[]`, `routeFreezeDispositionRef`, `experienceContinuityEvidenceRef`, `eligibilityState = live | read_only | placeholder_only | safe_browser_handoff | recovery_required | blocked`, `evaluatedAt`

`PatientEmbeddedNavEligibility` is the sole authority for embedded CTA exposure and bridge-backed behavior. Route-level bridge capability, current session lineage, continuity evidence, and route-freeze posture must all agree here before embedded-only actions may render live.

Embedded patient CTAs, artifact actions, deep links, and bridge-backed navigation may render live only when `PatientEmbeddedSessionProjection`, `PatientEmbeddedNavEligibility`, `PatientDegradedModeProjection`, and `PatientShellConsistencyProjection` agree on the same subject, current `IdentityBinding`, session lineage, manifest tuple, route entitlement, and route-level writable posture. Manifest drift, binding supersession, bridge-capability loss, frozen rollout, or release-tuple conflict must keep the patient in the same shell and degrade through `routeFreezeDispositionRef` to read-only, placeholder, or safe-browser recovery rather than exposing a stale embedded variant.

Native back, app-page navigation, overlay launch, external-browser launch, calendar export, and bridge-backed file delivery must also consume `BridgeActionLease` or `OutboundNavigationGrant` under the current `PatientEmbeddedNavEligibility`. Stale bridge leases may not survive route exit, shell morph, session drift, or manifest drift.

Every patient route family must also publish or derive `QuietClarityBinding`, `QuietClarityEligibilityGate`, `MissionStackFoldPlan`, `EmptyStateContract`, and `QuietSettlementEnvelope` through the owning shell and current `AudienceSurfaceRouteContract`. Patient routes may remain in calm `essential` posture only while those contracts allow it; step-up, delayed release, identity hold, blocked contact repair, embedded freeze, or stale continuity evidence must elevate the same shell into placeholder, expanded, or recovery posture instead of fragmenting the journey into detached pages.

Every patient route family must also materialize one live `FrontendContractManifest` from the current `AudienceSurfaceRouteContract`, `AudienceSurfacePublicationRef`, and `AudienceSurfaceRuntimeBinding`, with one exact `ProjectionContractVersionSet` and `projectionCompatibilityDigestRef`. Home, request, record, message, callback, booking, and pharmacy child routes may hydrate only through the manifest's declared `ProjectionQueryContract` refs, mutate only through declared `MutationCommandContract` refs, consume live deltas only through declared `LiveUpdateChannelContract` refs, and reuse cache only through the declared `ClientCachePolicy`. Empty-state truth, live CTA exposure, quiet success copy, and same-shell recovery posture may not be reconstructed from route names, payload shape, cached projection residue, or mixed-version tolerance once the manifest has downgraded to `read_only | recovery_only | blocked`.

## Quality rules

- no spotlight may churn between equivalent entities without a higher-ranked trigger or hysteresis expiry
- no quiet-home state may render unless `PatientQuietHomeDecision.decisionState = eligible`
- no live CTA may render from a stale or conflicting shell consistency envelope
- no communications preview may exceed the current audience tier, release state, or step-up posture
- no action token may outlive its capability lease or governing-object version
- no spotlight CTA may outlive the selected entity's `selectionTupleHash`, capability lease, writable-eligibility fence, or current release-trust verdict
- no reachability or delivery blocker may remain hidden in secondary disclosure when it blocks the current patient path
- no contradictory statuses across pages
- no PHI on unauthenticated fallback pages
- no PHI-bearing request detail while lineage-level identity-hold metadata is active
- no hidden state transitions without timeline evidence
- no more than one dominant primary CTA in the patient spotlight or request header
- no home compact card or request row may expose more than one live CTA
- no request summary may hide `awaiting party`, `last meaningful update`, or child-lineage visibility behind a detail click
- no request list may default to `Complete` while any blocked or action-needed request exists
- no typed patient action may mutate one domain and silently reopen another without timeline evidence
- no booking, callback, or pharmacy CTA may land on a generic triage confirmation page when a governing child flow exists
- no home, record, or message CTA may appear live when the current navigation digest, record action context, or conversation settlement has already degraded to pending, stale recovery, or read-only posture
- no expired or superseded action may terminate in a blank or generic error state when recovery is possible
- no false final assurance while confirmation, reconciliation, consent, or identity repair is still open
- no action CTA shown unless policy allows that action now
- no unread, reply-needed, reviewed, or settled conversation state may advance from local acknowledgement or transport delivery alone
- no patient-facing result view may lead with raw codes, acronyms, or chart-only meaning before a plain-language explanation
- no result, medication, or document state may rely on color alone for urgency or abnormality
- no patient-visible document may be file-download-only when a safe structured summary can be rendered in the shell
- no patient mutation may bypass a live `RouteIntentBinding`, authoritative `CommandActionRecord`, and `CommandSettlementRecord` chain
- no secure-link, embedded, or artifact-delivery route may expose writable or PHI-bearing state after subject, session, manifest, release, or trust fences drift
- no patient route may lose `SelectedAnchor`, blocker visibility, or the dominant action when `mission_stack` folds or unfolds
- no patient route may return to ordinary calm completion before `QuietSettlementEnvelope` plus the current continuity and settlement chain allow it
- no patient empty or sparse state may omit why the area is quiet, what usually appears there, and the fastest safe next action
- no patient shell may surface shell-level save, freshness, pending, or recovery cues outside `StatusStripAuthority`
- no patient shell may treat websocket health, poll success, or recent patch arrival as proof of fresh child-route truth; freshness and CTA posture must come from the current `ProjectionFreshnessEnvelope` plus command-following settlement
- no patient surface may swap the primary region to a sibling object under live drift without `PrimaryRegionBinding`
- no document, attachment, or external artifact action may bypass `ArtifactPresentationContract` or any required `OutboundNavigationGrant`
