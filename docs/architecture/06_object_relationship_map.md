# 06 Object Relationship Map

Relationships are extracted from schema refs, truth-bridge cues, and bounded do-not-confuse mappings. The CSV is authoritative for machine use.

## Relationship Counts

| Relationship | Count |
| --- | --- |
| binds | 6 |
| blocks | 2 |
| contains | 3 |
| governs | 2 |
| guards | 6 |
| projects | 2 |
| proves | 1 |
| publishes | 2 |
| references | 19 |
| settles | 3 |

## Key Relationships

| Source | Relationship | Target | Evidence |
| --- | --- | --- | --- |
| AccessGrant | binds | IdentityBinding | Grant scope must stay distinct from subject binding. |
| AdminResolutionSettlement | settles | AdminResolutionCase | Admin-resolution completion must settle the owning case. |
| ApprovalCheckpoint | guards | DecisionEpoch | Irreversible action approval is fenced by the current epoch. |
| ArchiveManifest | references | RetentionLifecycleBinding | Archive outputs remain governed by retention lifecycle binding. |
| AssistedBookingSession | references | TaskCompletionSettlementEnvelope | AssistedBookingSession field ``taskCompletionSettlementEnvelopeRef` |
| AssistiveReleaseState | binds | CompiledPolicyBundle | AssistiveReleaseState field ``compiledPolicyBundleRef` |
| AssistiveRunSettlement | settles | AssistiveInvocationGrant | Assistive runs require bounded invocation proof. |
| AssistiveSurfaceBinding | binds | PersistentShell | Assistive behavior is always bound to the owning shell. |
| AssuranceEvidenceGraphSnapshot | contains | AssuranceLedgerEntry | Graph snapshots are built from typed ledger rows. |
| AssuranceEvidenceGraphSnapshot | contains | EvidenceArtifact | Graph snapshots join admissible evidence artifacts. |
| BookingCase | guards | ExternalConfirmationGate | Ambiguous external confirmation must remain explicit on the booking lineage. |
| BookingCase | references | BookingConfirmationTruthProjection | Booking surfaces derive from the current confirmation truth projection. |
| BookingIntent | binds | DecisionSupersessionRecord | BookingIntent field ``decisionSupersessionRecordRef` |
| BookingTransaction | references | ReleaseRecoveryDisposition | BookingTransaction field ``releaseRecoveryDispositionRef` |
| CallbackResolutionGate | guards | CallbackCase | Callback completion, retry, or escalation must route through the resolution gate. |
| DecisionEpoch | guards | EndpointDecision | Endpoint choice stays valid only while the current epoch is live. |
| DeletionCertificate | proves | RetentionLifecycleBinding | Deletion proof is admissible only against the governing retention binding. |
| DesignContractPublicationBundle | publishes | AudienceSurfaceRouteContract | Design-contract publication ships route-family contracts. |
| FieldAccessibilityContract | governs | AssistiveTextPolicy | FieldAccessibilityContract field ``assistiveTextPolicyRef` |
| HubCoordinationCase | references | HubOfferToConfirmationTruthProjection | Hub patient and practice posture derives from the current truth projection. |
| HubFallbackRecord | references | HubCoordinationCase | Fallback continuity must stay attached to the active hub case. |
| HubOfferToConfirmationTruthProjection | projects | HubAppointmentRecord | Hub truth projection materializes booked and practice-visible state. |
| HubSupplierMirrorState | binds | Task | HubSupplierMirrorState field ``reopenTaskRef` |
| JourneyPathDefinition | references | RouteFreezeDisposition | JourneyPathDefinition field ``routeFreezeDispositionRef` |
| MessageDispatchEnvelope | references | ClinicianMessageThread | Dispatch remains attached to one message thread. |
| MigrationActionRecord | references | CommandActionRecord | MigrationActionRecord field ``commandActionRecordRef` |
| ModelPolicy | governs | ReplayEvidencePolicy | ModelPolicy field ``replayEvidencePolicyRef` |
| MoreInfoReminderSchedule | references | MoreInfoCycle | Reminder cadence is bound to one current cycle. |
| MoreInfoReplyWindowCheckpoint | guards | MoreInfoCycle | Checkpoint governs due-state, late-review, and expiry posture. |
| MoreInfoResponseDisposition | settles | MoreInfoCycle | Response disposition explains acceptance, expiry, or supersession. |
| NetworkCandidateSnapshot | references | CrossSiteDecisionPlan | NetworkCandidateSnapshot field ``crossSiteDecisionPlanRef` |
| PharmacyCase | references | PharmacyDispatchAttempt | Dispatch lineage stays attached to the active pharmacy case. |
| PharmacyIntent | binds | DecisionSupersessionRecord | PharmacyIntent field ``decisionSupersessionRecordRef` |
| PharmacyOutcomeReconciliationGate | blocks | PharmacyCase | Weak or ambiguous outcome truth blocks ordinary closure. |
| PharmacyOutcomeTruthProjection | projects | PharmacyOutcomeRecord | Patient and staff pharmacy truth derives from the current outcome record and gate posture. |
| Request | references | IdentityBinding | Nullable patientRef derives from IdentityBinding rather than direct ownership shorthand. |
| RequestClosureRecord | references | Request | Closure is coordinator-owned request truth. |
| RequestLineage | contains | LineageCaseLink | Child workflows join through explicit lineage links. |
| ReviewSession | references | ReleaseRecoveryDisposition | ReviewSession field ``releaseRecoveryDispositionRef` |
| RuntimePublicationBundle | publishes | AudienceSurfaceRuntimeBinding | Runtime publication activates audience-surface bindings. |
| SecurityIncident | references | ReportabilityAssessment | SecurityIncident field ``reportabilityAssessmentRef` |
| SlotSetSnapshot | references | NormalizedSlot | SlotSetSnapshot field ``normalizedSlotRefs` |
| SubmissionEnvelope | references | RequestLineage | Submission promotion keeps one lineage spine. |
| SuggestionActionRecord | references | CommandActionRecord | SuggestionActionRecord field ``commandActionRecordRef` |
| ThreadResolutionGate | guards | ClinicianMessageThread | Thread closure, reopen, or escalation is gate-controlled. |
| WaitlistFallbackObligation | blocks | BookingCase | Fallback debt keeps booking continuation honest. |
