            # 17 Programme Decision Log

            ## Assumptions

            | Assumption | Decision | Sources |

| --- | --- | --- |
| ASSUMPTION_017_SCOPE_AWARE_SEQUENCE | Deferred or optional sequence milestones stay visible in canonical order, but the current-baseline dependency graph bypasses them so the NHS App deferred channel and optional assistive enablement do not become hidden blockers. | blueprint/phase-cards.md#Programme Baseline Update (NHS App Deferred); prompt/017.md#Non-negotiable programme rules |
| ASSUMPTION_017_PHASE0_BRIDGING_SUBPHASE_NAMES | Phase 0 source text explicitly names 0A, 0B, and 0G and states there are seven hard-gated internal sub-phases. The intermediate 0C-0F titles are derived bridging labels over the runtime, control-plane, verification, and shell obligations already present in the source algorithm. | blueprint/phase-0-the-foundation-protocol.md#The detailed Phase 0 development algorithm; blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol |
| ASSUMPTION_017_LONG_LEAD_SPLIT | External onboarding milestones and Phase 0 assurance tracks are modeled as separate long-lead milestones so gates can bind concrete dependency evidence instead of hiding approvals inside generic implementation status. | prompt/017.md#Execution steps; blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol |

            ## Gap-Closure Decisions

            | Decision | Closure |

| --- | --- |
| Deferred Phase 7 handling | Represented as deferred-channel milestones and branches that never proxy current-baseline completion evidence. |
| Optional PDS handling | Represented as an optional branch from external readiness so Phase 2 baseline can proceed without it. |
| Optional assistive visible rollout | Represented as an optional post-wave branch after Phase 8 completes architecturally. |
| Phase 0 internal sub-phases | Operationalized as seven hard-gated subphases with 0G expanded into named long-lead assurance lanes. |
