# 343 Phase 6 Discovery, Dispatch, And Outcome Contracts

Contract version: `343.phase6.discovery-dispatch-outcome-freeze.v1`

This document freezes the Phase 6 provider discovery, provider choice, dispatch truth, and outcome reconciliation backbone so later implementation tracks cannot invent per-adapter semantics.

## Why 343 exists

- [342_phase6_pharmacy_case_model_and_policy_contracts.md](/Users/test/Code/V/docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md) froze the case, policy pack, and state machine but left the later-owned discovery, consent, dispatch, and outcome objects typed only by reference.
- Provider choice, dispatch proof, and outcome truth are separate authorities and must stay separate.
- The contract must preserve full visible choice, explicit consent binding, transport-neutral dispatch, and replay-safe outcome matching.

## Discovery and choice boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| PharmacyDirectorySnapshot | One normalized choice refresh for a pharmacy case. | Recommended providers must come from the same full visible set the patient can inspect. |
| PharmacyProviderCapabilitySnapshot | Provider capability and transport summary for one normalized provider. | `manual_supported` remains visible with warning; only `unsupported` may be hidden as invalid. |
| PharmacyChoiceProof | Auditable visible frontier and recommended frontier proof. | No hidden top-K funneling is allowed. |
| PharmacyChoiceSession | Durable choice session carrying the visible set, selected provider, and override posture. | Selection provenance must survive drift as read-only context instead of being silently rewritten. |
| PharmacyChoiceTruthProjection | Audience-safe choice truth for patient chooser, request detail, and staff assist surfaces. | Visible order, recommended frontier, warning copy, and selection provenance must resolve from the same current proof and disclosure policy. |
| PharmacyConsentCheckpoint | Single authority for whether dispatch and calm reassurance may proceed. | Provider, proof, scope, or package drift must supersede earlier consent before dispatch. |

## Dispatch and proof boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| PharmacyReferralPackage | Immutable dispatch artifact bound to provider choice, consent, and policy. | Package lineage may not drift independently from consent or provider selection. |
| PharmacyDispatchPlan | Transport-bound plan derived from the frozen package. | Transport mode, adapter binding, and transform contract are locked only after package freeze. |
| DispatchProofEnvelope | Single proof envelope for transport acceptance, provider acceptance, delivery hints, and authoritative proof. | Only `authoritativeProofSourceRef` may satisfy live referral truth. |
| PharmacyDispatchSettlement | Dispatch result bound to proof, consent checkpoint, and continuity evidence. | Settlement copy and proof-envelope state may not diverge under retry or replay. |
| PharmacyDispatchTruthProjection | Audience-safe dispatch truth for patient, staff, and operations surfaces. | Calm referred posture is forbidden while authoritative proof remains unsatisfied. |

## Outcome reconciliation boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| OutcomeEvidenceEnvelope | Immutable canonicalized outcome evidence envelope. | Replay posture must be classified before any case mutation. |
| PharmacyOutcomeIngestAttempt | Best-match attempt over candidate open cases. | Exact and semantic replay must settle back to the prior accepted outcome. |
| PharmacyOutcomeReconciliationGate | Case-local weak-match review seam. | Weak or contradictory outcome truth blocks closure while the gate is open. |
| PharmacyOutcomeSettlement | Recorded outcome result after replay, matching, gate resolution, and typed downstream recovery handoff when required. | Email or manual capture may not quietly settle to resolved without stronger policy conditions. |
| PharmacyOutcomeTruthProjection | Audience-safe outcome posture for patient, staff, and operations views. | Calm completion is forbidden until the gate is absent or resolved and continuity evidence validates the same route and consent chain. |

## Separation laws

- Recommended frontier and visible frontier must remain auditable from the same proof and disclosure policy.
- Dispatch proof and outcome truth are different authorities. Dispatch may confirm live handoff without implying completion.
- Transport acceptance, provider acceptance, and mailbox delivery are subordinate evidence lanes. Only authoritative proof satisfies live referral truth.
- Update Record summaries and observed outcomes may update outcome posture, but they do not justify urgent return semantics or silent completion.
- Silence is not proof. No elapsed timer, missing Update Record, or missing email can imply outcome completion.

## Reserved and downstream seams

| Owner | Already frozen here | Deferred implementation detail |
| --- | --- | --- |
| seq_344 | Outcome classes and dispatch failures that must reopen, bounce back, or widen urgent-return debt already point to typed seams. | Bounce-back detail, patient macro states, practice visibility payloads, and operations exceptions. |
| 348 | Directory, provider, choice proof, explanation, disclosure, and consent families. | Executable discovery adapters, ranking engine, and choice/consent workflow. |
| 349 | Referral package, artifact manifest, dispatch plan, and transport-neutral governance chain. | Executable package composer and policy/governance binding. |
| 350 | Dispatch attempt, proof envelope, transport assurance profile, and settlement families. | Adapter execution, retry, proof refresh, and expiry logic. |
| 351 | Choice and dispatch truth projections are already frozen as audience-safe authorities. | Patient instruction and referral-status surfaces built from the frozen truth projections. |
| 352 | Outcome envelope, ingest attempt, reconciliation gate, settlement, and truth projection families. | Executable ingest, matching, replay, and reconciliation engine. |
