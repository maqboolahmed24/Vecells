# 280 Phase 4 slot snapshot, offer, commit, and manage contract pack

This pack freezes the Booking Phase 4 path from search through manage against the exact authority chain published in `278` and `279`.

- `SlotSearchSession`, `ProviderSearchSlice`, `TemporalNormalizationEnvelope`, `CanonicalSlotIdentity`, `SlotSetSnapshot`, and `SlotSnapshotRecoveryState` freeze search as a snapshot-producing operation.
- `RankPlan`, `CapacityRankProof`, `CapacityRankExplanation`, and `OfferSession` freeze ranking and selection over persisted snapshot truth.
- `ReservationTruthProjection` remains the sole authority for exclusivity and truthful hold posture.
- `BookingTransaction` and `BookingConfirmationTruthProjection` freeze commit, confirmation, and compensation semantics.
- `AppointmentManageCommand`, `BookingManageSettlement`, `BookingContinuityEvidenceProjection`, `ReminderPlan`, and `AppointmentPresentationArtifact` freeze manage and continuity semantics.
- typed waitlist and fallback seams are published now because search, offer, and commit already depend on them.

## Contract split

| Contract | Phase | Authority | Why separate |
| --- | --- | --- | --- |
| SlotSearchSession | 4C | Snapshot-producing search session, fenced to case version, policy bundle, capability tuple, and adapter binding | keeps live supplier lists from leaking directly into selection or commit |
| ProviderSearchSlice | 4C | per-provider coverage, degradation, and raw payload lineage | distinguishes complete, partial, timeout, and degraded coverage |
| TemporalNormalizationEnvelope | 4C | timezone, DST, and clock-skew correctness | prevents supplier-local timestamps from forking booking truth |
| CanonicalSlotIdentity | 4C | dedupe-safe slot identity and stable tie-break key | prevents distinct inventory from collapsing under aliasing |
| SlotSetSnapshot | 4C | frozen searchable and selectable slot set with checksum and recovery posture | selection and commit must consume persisted snapshot truth |
| SlotSnapshotRecoveryState | 4C | renderable vs partial vs stale vs no-supply vs support-fallback view state | empty results are not enough to imply no supply |
| RankPlan and CapacityRankProof | 4D | frontier-safe rank plan, proof, explanations, and patient cue law | keeps ordering stable across pagination, grouping, and replay |
| OfferSession | 4D | selected candidate, proof hash, and interaction TTL over pre-ranked offers | OfferSession.expiresAt is not proof of exclusivity |
| ReservationTruthProjection | 4D/4E | sole authority for exclusivity, truthful-nonexclusive, pending-confirmation, release, and expiry language | selected means held is explicitly forbidden |
| BookingTransaction | 4E | append-only commit chain with local, processing, external, and authoritative states | appointment rows or accepted processing alone may not imply booked truth |
| BookingConfirmationTruthProjection | 4E/4F | sole audience-safe authority for booked summary, manage, artifact, and reminder exposure | async or disputed confirmation must stay first-class and same-shell |
| AppointmentManage and Reminder bundle | 4F | manage command, settlement, continuity evidence, reminder plan, and artifact rules | manage cannot infer capability or safety from page shape |
| Waitlist and fallback stubs | 4C/4E/4F | typed continuation truth for no-supply, expired offer, revalidation failure, and fallback transfer | waitlist or fallback is already part of truthful booking semantics |

## Mandatory formulas

| Formula | Expression | Machine fields |
| --- | --- | --- |
| SnapshotSelectable(q,t) | SnapshotSelectable(q,t) = 1[t <= q.expiresAt] * 1[q.caseVersionRef matches the active BookingCase version] * 1[q.policyBundleHash matches the active compiled policy bundle] * 1[q.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * 1[q.capabilityTupleHash matches the current BookingCapabilityResolution.capabilityTupleHash] * 1[q.coverageState in {complete, partial_coverage}] * 1[recoveryState(q).viewState != stale_refresh_required] | expiresAt, caseVersionRef, policyBundleHash, providerAdapterBindingHash ... |
| Frontier_b | Frontier_b = { s : windowClass(s)=b and startAtEpoch(s) <= earliestStart_b + Delta_reorder_b } | windowClass, startAtEpoch, earliestStart_b, Delta_reorder_b |
| softScore(s) | softScore(s) = w_delay * f_delay(s) + w_continuity * f_continuity(s) + w_site * f_site(s) + w_tod * f_tod(s) + w_travel * f_travel(s) + w_modality * f_modality(s) | w_delay, w_continuity, w_site, w_tod ... |
| RevalidationPass(tx,t) | RevalidationPass(tx,t) = SnapshotSelectable(SlotSetSnapshot(tx.snapshotId),t) * 1[tx.providerAdapterBindingHash matches the current BookingCapabilityResolution.providerAdapterBindingHash] * LiveSupplierBookable(tx.selectedSlotRef,t) * PolicySatisfied(tx.selectedSlotRef, tx.policyBundleHash) * RouteWritable(tx,t) * VersionFresh(tx.preflightVersion, tx.selectedSlotRef, t) | snapshotId, providerAdapterBindingHash, selectedSlotRef, policyBundleHash ... |
| RouteWritable(tx,t) | RouteWritable(tx,t) = 1[AudienceSurfaceRouteContract live and surface publication current and RuntimePublicationBundle live and PatientShellConsistencyProjection valid and, when embedded, PatientEmbeddedSessionProjection valid] | surfaceRouteContractRef, surfacePublicationRef, runtimePublicationBundleRef, patientShellConsistencyProjectionRef ... |
| Cancelable(a,t) | Cancelable(a,t) = 1[a.status = booked and startAt(a) - t >= cancelCutoff(a) and no live AppointmentManageCommand fence exists for a] | appointmentStatus, startAt, cancelCutoff, liveCommandFence |
| Reschedulable(a,t) | Reschedulable(a,t) = 1[a.status = booked and startAt(a) - t >= amendCutoff(a) and no live AppointmentManageCommand fence exists for a] | appointmentStatus, startAt, amendCutoff, liveCommandFence |

## Core closures

1. Search resolves to governed snapshots with explicit freshness and recovery posture.
2. Selection state alone never implies exclusivity; only `ReservationTruthProjection` may do that.
3. Appointment record presence or accepted-for-processing alone never implies booked truth.
4. Pending and reconciliation remain first-class same-shell states.
5. Manage exposure binds current capability, continuity evidence, and route writability.
6. Waitlist and fallback semantics are typed now instead of deferred as prose debt.

## Published files

| File | Purpose |
| --- | --- |
| data/contracts/280_slot_search_session.schema.json | Snapshot-producing search session, fenced to case version, policy bundle, capability tuple, and adapter binding |
| data/contracts/280_provider_search_slice.schema.json | per-provider coverage, degradation, and raw payload lineage |
| data/contracts/280_temporal_normalization_envelope.schema.json | timezone, DST, and clock-skew correctness |
| data/contracts/280_canonical_slot_identity.schema.json | dedupe-safe slot identity and stable tie-break key |
| data/contracts/280_slot_set_snapshot.schema.json | frozen searchable and selectable slot set with checksum and recovery posture |
| data/contracts/280_slot_snapshot_recovery_state.schema.json | renderable vs partial vs stale vs no-supply vs support-fallback view state |
| data/contracts/280_rank_plan_and_capacity_rank_proof_contract.json | frontier-safe rank plan, proof, explanations, and patient cue law |
| data/contracts/280_offer_session.schema.json | selected candidate, proof hash, and interaction TTL over pre-ranked offers |
| data/contracts/280_reservation_truth_projection_contract.json | sole authority for exclusivity, truthful-nonexclusive, pending-confirmation, release, and expiry language |
| data/contracts/280_booking_transaction.schema.json | append-only commit chain with local, processing, external, and authoritative states |
| data/contracts/280_booking_confirmation_truth_projection.schema.json | sole audience-safe authority for booked summary, manage, artifact, and reminder exposure |
| data/contracts/280_appointment_manage_and_reminder_contract_bundle.json | manage command, settlement, continuity evidence, reminder plan, and artifact rules |
| data/contracts/280_waitlist_and_fallback_interface_stubs.json | typed continuation truth for no-supply, expired offer, revalidation failure, and fallback transfer |

Additional typed gap publication: [PHASE4 interface gap](/Users/test/Code/V/data/analysis/PHASE4_INTERFACE_GAP_SLOT_OFFER_COMMIT_MANAGE.json).
