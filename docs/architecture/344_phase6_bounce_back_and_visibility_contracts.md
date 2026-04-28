# 344 Phase 6 Bounce-Back And Visibility Contracts

Contract version: `344.phase6.return-status-visibility-freeze.v1`

This document freezes the Phase 6 return-path, patient-status, practice-visibility, and pharmacy-operations truth families so later implementation tracks cannot quietly reinterpret urgent return, review, or calm completion.

## Why 344 exists

- [342_phase6_pharmacy_case_model_and_policy_contracts.md](/Users/test/Code/V/docs/architecture/342_phase6_pharmacy_case_model_and_policy_contracts.md) already froze the return-oriented case states but explicitly reserved bounce-back detail, reachability debt, and visibility payloads for seq_344.
- [343_phase6_discovery_dispatch_and_outcome_contracts.md](/Users/test/Code/V/docs/architecture/343_phase6_discovery_dispatch_and_outcome_contracts.md) already routes reopened pharmacy outcomes into a typed PharmacyBounceBackRecord seam owned here.
- Patient, practice, and operations surfaces need one honest truth family, not three competing interpretations of timers, dispatch, or outcome state.

## Bounce-back and reachability boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| PharmacyBounceBackEvidenceEnvelope | Immutable normalized envelope for urgent, routine, no-contact, or safeguarding return evidence. | Return evidence must be normalized before branch mutation or reopen prioritization. |
| UrgentReturnDirectRouteProfile | Direct urgent route and monitored fallback policy. | Urgent return must use a direct route and must never reuse Update Record as the urgent transport. |
| PharmacyReachabilityPlan | Single authority over pharmacy contact, outcome confirmation, and urgent-return dependencies. | Broken or stale reachability must remain explicit and block calm progress. |
| PharmacyBounceBackRecord | First-class workflow object for returned or reopened pharmacy work. | Bounce-back is not a timeline note; it carries urgency, loop risk, reopen priority, and blocker posture. |

## Patient status boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| PharmacyPatientStatusProjection | Audience-safe patient pharmacy status and instruction surface. | Patient macro state must come from authoritative truth projections and blockers, never from timers or UI booleans. |
| Patient macro state vocabulary | Top-level patient state family for pharmacy requests. | Only choose_or_confirm, action_in_progress, reviewing_next_steps, completed, and urgent_action are legal. |
| Calm completion law | Guardrail for completed posture. | Completed is forbidden until outcome truth is settled_resolved, continuity evidence is current, and no active reconciliation, urgent return, reachability, or identity blocker remains. |

## Practice visibility and operations boundary

| Contract | Purpose | Non-negotiable law |
| --- | --- | --- |
| PharmacyPracticeVisibilityProjection | Minimum-necessary practice visibility for pharmacy referrals and returns. | Practice visibility may summarize truth, but it may not overclaim completion or booking certainty. |
| Operations exception registry | Canonical pharmacy exception vocabulary for queueing and escalation. | Top-level exception classes are frozen and may not be replaced by ad hoc synonyms. |
| Projection registry | Named projection families for practice and operations surfaces. | pharmacy_waiting_for_choice_projection must include the choice-truth summary and may not invent hidden ranking logic. |

## Cross-surface laws

- Patient, practice, and operations surfaces derive from the same authoritative truth family.
- Urgent return is materially distinct from routine unresolved return and dominates ordinary copy.
- Reachability repair debt remains explicit until the linked dependency rebounds under a current route authority state.
- Weak review or unresolved return posture may not reuse calm completion copy.
- Wrong-patient or identity-repair branches freeze calm and writable posture where applicable.

## Reserved later-owned interfaces

| Owner | Already frozen here | Deferred implementation detail |
| --- | --- | --- |
| 351 | Patient macro-state vocabulary and patient status projection contract. | Executable patient instruction generation and referral-status surfaces. |
| 353 | Bounce-back record, urgent route profile, reachability plan, reopen-priority, and loop-risk law. | Executable bounce-back, urgent-return, and reopen implementation. |
| 354 | Practice visibility projection, operations exception vocabulary, and named queue projections. | Practice visibility, operations queue, and exception APIs. |
| 355 | Provider-health and operations projection family boundaries for dense pharmacy workbenches. | Pharmacy-console support regions and stock-truth dependent surfaces. |
| 361 | Patient visibility truth and urgent-review grammar already frozen. | Browser-visible patient return and review surfaces. |
| 362 | Practice and operations visibility truth already frozen. | Browser-visible practice visibility and operations queue surfaces. |
