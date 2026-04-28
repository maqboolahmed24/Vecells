# 359 Referral Confirmation And Dispatch Posture Spec

## Scope

`par_359` implements the shared dispatch-assurance family for Phase 6 pharmacy work.

It covers:

- the staff referral confirmation drawer inside `/workspace/pharmacy/:pharmacyCaseId/handoff`
- the patient-safe dispatch posture surfaces inside `/pharmacy/:pharmacyCaseId/:routeKey`
- continuity, consent, and calmness gating for pending, blocked, drifted, and confirmed referral states

## Authoritative UI surfaces

- `PharmacyReferralConfirmationDrawer`
- `DispatchProofStatusStrip`
- `DispatchEvidenceRows`
- `DispatchArtifactSummaryCard`
- `PatientDispatchPendingState`
- `PatientConsentCheckpointNotice`
- `ChosenPharmacyAnchorCard`
- `DispatchContinuityWarningStrip`

## Truth sources

The dispatch preview layer is the only browser-facing composition point for this task.
It binds the UI to:

- `PharmacyDispatchTruthProjection`
- `PharmacyConsentCheckpoint`
- `PharmacyReferralPackage`
- `PharmacyDispatchPlan`
- `DispatchProofEnvelope`
- `ReferralArtifactManifest`
- `PharmacyHandoffWatchProjection`
- `PharmacyConsoleContinuityEvidenceProjection`

The browser may compose these facts for presentation.
It may not infer confirmation from local click state, transport-specific acknowledgements, or partial proof.

## Calmness law

Calm referred reassurance is allowed only when all three conditions hold for the active chosen pharmacy:

1. the current consent checkpoint is satisfied
2. authoritative dispatch proof is satisfied
3. continuity evidence still validates the same anchor

If any one of those conditions drifts, the UI must widen immediately into pending, blocked, or read-only posture.

## Staff behaviour

The staff drawer must always show:

- chosen pharmacy anchor
- pathway label
- referral summary
- transport method
- separate rows for transport acceptance, provider acceptance, authoritative proof, proof deadline, and recovery owner
- an explicit omitted/redacted artifact summary

The drawer must not collapse those rows into one soft “sent” status.

## Patient behaviour

The patient shell must:

- keep the chosen-pharmacy anchor visible across pending, blocked, and drifted states
- hide transport jargon
- show one dominant next step
- keep continuity warnings explicit when proof, consent, or anchor validity drifts
- preserve previous selection provenance when the anchor is no longer current

## Scenario seeds

- `PHC-2048`: dispatch confirmed and calmness allowed
- `PHC-2057`: dispatch pending, proof incomplete, calmness blocked
- `PHC-2090`: consent-blocked clarification hold with read-only anchor
- `PHC-2148`: warned-choice acknowledgement still blocking dispatch
- `PHC-2156`: continuity drift with preserved prior anchor provenance

## Proof expectations

Playwright must prove that:

1. staff drawer rows stay distinct and keyboard reachable
2. omitted and redacted artifacts are visible in the drawer
3. patient copy stays non-technical
4. calm reassurance does not appear before proof and continuity are current
5. consent-blocked states preserve the chosen-pharmacy anchor
6. drift states expose provenance and an explicit recovery path
