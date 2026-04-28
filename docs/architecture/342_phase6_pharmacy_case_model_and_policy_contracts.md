# 342 Phase 6 Pharmacy Case Model And Policy Contracts

Contract version: `342.phase6.pharmacy-case-policy-freeze.v1`

This document freezes the Phase 6 pharmacy backbone so implementation tracks can build a real pharmacy loop without reinterpreting case, eligibility, or rule-pack law.

## Why 342 exists

- Phase 6 starts from the proven Phase 5 foundation recorded in [341_phase5_to_phase6_handoff_contract.json](/Users/test/Code/V/data/contracts/341_phase5_to_phase6_handoff_contract.json).
- `PharmacyCase` is a governed child lineage branch, not a loose referral note.
- Eligibility and timing thresholds are versioned data inside immutable rule packs, never hidden code defaults.
- Later tracks `343` and `344` inherit typed references from this freeze instead of backfilling vague placeholders.

## Aggregate boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| PharmacyCase | Durable Phase 6 aggregate and state root. | Must bind RequestLineage, LineageCaseLink(caseFamily = pharmacy), lifecycle lease, fence, and blocker references directly. |
| ServiceTypeDecision | Resolves the service lane and candidate pathways. | Must keep clinical pathways, minor-illness fallback, and non-pharmacy return distinct. |
| PathwayEligibilityEvaluation | Replayable eligibility record. | Must persist matched rules, completeness, contradiction, confidence, and explanation bundle refs. |
| PharmacyRulePack | Immutable effective-dated policy pack. | Pack mutation in place is forbidden; replay and golden-case regression are mandatory. |
| PathwayDefinition | Single named pathway contract. | Age/sex gates, exclusions, fallback rules, escalation modes, and timing guardrail binding are frozen together. |
| PathwayTimingGuardrail | Delay and safety envelope. | Choice and dispatch tracks may consume it later but may not redefine it. |
| EligibilityExplanationBundle | Shared patient/staff explanation family. | Patient and staff views come from the same underlying evaluation evidence hash. |

## Canonical PharmacyCase state machine

| State | Family | Meaning |
| --- | --- | --- |
| candidate_received | intake | A pharmacy-eligible branch has been created and lineage has been acknowledged, but rules have not yet begun. |
| rules_evaluating | evaluation | The case is actively being evaluated against the frozen pathway and fallback pack. |
| ineligible_returned | evaluation | Pharmacy suitability has been denied and the work returns to a non-pharmacy route. |
| eligible_choice_pending | choice | Eligibility passed and the case waits on provider-choice truth under the current pack. |
| provider_selected | choice | A single provider has been durably selected but consent and package posture still govern onward progress. |
| consent_pending | consent | Selection exists, but referral consent or checkpoint posture is not currently satisfied. |
| package_ready | dispatch | The canonical package is frozen and the current consent checkpoint is satisfied. |
| dispatch_pending | dispatch | A fenced dispatch attempt exists and transport proof is still being gathered. |
| referred | dispatch | Dispatch proof satisfies the current assurance profile and the referral is live with the selected provider. |
| consultation_outcome_pending | outcome | The referral is live and the branch waits for an authoritative pharmacy outcome. |
| outcome_reconciliation_pending | outcome | Weak or contradictory outcome truth blocks ordinary settlement pending case-local review. |
| resolved_by_pharmacy | outcome | Outcome truth is strong enough to settle the pharmacy branch locally, but closure still requires blocker clearance. |
| unresolved_returned | return | The pharmacy branch has not resolved and is returning to practice or triage under routine return law. |
| urgent_bounce_back | return | Urgent return dominates ordinary branch messaging and requires direct safety handling. |
| no_contact_return_pending | return | No-contact return has been made explicit and cannot auto-close. |
| closed | closure | LifecycleCoordinator has accepted closure because no confirmation, reachability, consent, or outcome blockers remain open. |

Closure authority remains `LifecycleCoordinator`. `PharmacyCase.status` may never close the canonical request directly.

## Transition and blocker law

- Only the transitions published in [342_phase6_case_state_machine.yaml](/Users/test/Code/V/data/contracts/342_phase6_case_state_machine.yaml) are legal.
- Dispatch, outcome, reopen, and close must all compare the active `ownershipEpoch`, `RequestLifecycleLease`, and `LineageFence`.
- `minor_illness_fallback` is lawful only when no named clinical pathway remains eligible, `s_global(x) < tau_global_block`, and every rejected named pathway failed for pathway-specific reasons only.
- `urgent_bounce_back` and `no_contact_return_pending` are canonical states here even though their detailed evidence and visibility models are frozen by `344`.

## Rule-pack immutability

| Rule | Meaning |
| --- | --- |
| Active packs are immutable | No in-place edits after promotion. |
| Effective dating is mandatory | Every pack has a start and optional end window. |
| Golden-case regression is required | Promotion requires deterministic replay across the golden-case suite. |
| Thresholds version together | Thresholds, explanations, fallback rules, and timing guardrails may not drift independently. |
| Replay is mandatory | Every evaluation keeps the exact pack version used at decision time. |

## Reserved later-owned interfaces

| Later owner | Already frozen here | Detailed schema deferred |
| --- | --- | --- |
| seq_343 | choiceSessionRef, selectedProviderRef, activeConsentRef, activeConsentCheckpointRef, latestConsentRevocationRef, activeDispatchAttemptRef, correlationRef, outcomeRef, currentConfirmationGateRefs | Provider discovery, consent, dispatch, transport proof, and outcome reconciliation payloads. |
| seq_344 | bounceBackRef, activeReachabilityDependencyRefs, currentClosureBlockerRefs | Bounce-back detail, urgent return, patient-status macros, practice visibility, and operations exception models. |

The field registry is embedded directly into the machine-readable schemas through the `x-vecells-*` metadata on every frozen field.
