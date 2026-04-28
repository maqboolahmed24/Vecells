# 351 Patient Instruction Generation And Status Projection

Task `par_351_phase6_track_backend_build_patient_instruction_generation_and_referral_status_projections` lands the authoritative backend status family for the Phase 6 pharmacy loop. The implementation lives in `packages/domains/pharmacy/src/phase6-pharmacy-patient-status-engine.ts` and publishes one replayable patient-safe truth bundle instead of letting later patient UI work combine raw dispatch, outcome, reachability, and identity-repair rows in the browser.

## Scope owned here

- `PharmacyPatientStatusProjection`
- `PharmacyPatientProviderSummary`
- `PharmacyPatientReferralReferenceSummary`
- `PharmacyPatientReachabilityRepairProjection`
- `PharmacyPatientContinuityProjection`
- `PharmacyPatientInstructionPanel`
- `PharmacyPatientStatusAuditEvent`

`351` also materialises the minimum fallback runtime for `PharmacyOutcomeTruthProjection` and `PharmacyReachabilityPlan` when later-owner surfaces are not yet present. Those fallbacks are typed, persisted, and explicitly bounded by the 351 gap artifact.

## Derivation law

The projection builder reads exactly these authorities:

1. `PharmacyCase`
2. `PharmacyChoiceTruthProjection` and `PharmacyConsentCheckpoint`
3. `PharmacyDispatchTruthProjection`
4. `PharmacyOutcomeTruthProjection`
5. `PharmacyBounceBackRecord`
6. live `ReachabilityDependency`, `ReachabilityAssessmentRecord`, `ContactRouteSnapshot`, and `ContactRouteRepairJourney`
7. `IdentityRepairBranchDisposition` and `IdentityRepairReleaseSettlement`
8. `PatientShellConsistencyProjection` and `PatientExperienceContinuityEvidenceProjection`

No patient macro state is inferred from frontend timers, stale delivery success, or UI-local booleans.

## Macro-state mapping

The implementation hard-maps the pharmacy loop into the Phase 0 macro-state set only:

- `choose_or_confirm`
- `action_in_progress`
- `reviewing_next_steps`
- `completed`
- `urgent_action`

Key rules:

- `choose_or_confirm` is used for `eligible_choice_pending`, `provider_selected`, `consent_pending`, `package_ready`, or any unsatisfied or non-current consent checkpoint.
- `action_in_progress` is used only for live referral flow such as `dispatch_pending`, `referred`, or `consultation_outcome_pending`, and only if no stronger blocker dominates.
- `reviewing_next_steps` is used for review-required outcome truth, open return states, non-trusted continuity, identity freeze, and non-urgent reachability blockers.
- `completed` is legal only when outcome truth is `settled_resolved`, continuity is `trusted`, no close blocker remains, no active reachability dependency remains, and no urgent or identity hold posture is active.
- `urgent_action` is used when urgent return dominates either through `PharmacyBounceBackRecord` or urgent reachability truth.

## Reachability and same-shell repair

`351` projects the live pharmacy patient posture together with the current reachability authorities for:

- `pharmacy_contact`
- `outcome_confirmation`
- `urgent_return`

If the dominant dependency is degraded, blocked, disputed, stale, or under repair, the patient posture moves to governed repair or review. The repair projection carries:

- selected provider summary reference
- referral anchor
- repair journey reference
- resume continuation reference
- selected anchor
- governing status truth revision

This preserves same-shell continuity for later patient UI work.

## Wrong-patient and identity-repair law

When a branch disposition exists without a release settlement:

- provider detail becomes provenance-only
- referral reference display is suppressed
- calm completion is blocked
- ordinary live CTAs are replaced with bounded recovery guidance

Release settlement must agree with continuity before ordinary calm posture resumes.

## Content grammar

Instruction copy is generated from authoritative state families, not controller conditionals. The engine publishes typed copy refs and rendered strings for:

- headline
- next step
- who or where
- when to expect something
- warning
- review
- symptoms worsening guidance
- calm completion

The grammar explicitly avoids appointment language for pharmacy referral flow. Dispatch, contact, or consultation text uses referral wording such as “we’re sending your referral” or “the pharmacist may speak to you by phone, video or in person”.

## Persistence shape

Migration `159_phase6_pharmacy_patient_status_and_instruction_projection.sql` adds durable tables for:

- outcome truth fallback
- reachability plan fallback
- patient status projection
- provider summary
- referral reference summary
- reachability repair projection
- continuity projection
- instruction panel
- audit events

These tables give later patient UI work stable server-derived truth instead of recomputing status client-side.
