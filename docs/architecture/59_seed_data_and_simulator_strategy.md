# 59 Seed Data And Simulator Strategy

        Seq `059` freezes one simulator-first seed corpus for Phase 0 so preview shells, integration rehearsals, backend tests, and release verification all reuse the same deterministic request truth instead of waiting on live onboarding.

        ## Summary

        - Generated at: `2026-04-13T14:51:09+00:00`
        - Reference cases: `11`
        - Simulators: `13`
        - Seed rows: `158`
        - Fault-injection rows: `48`
        - Continuity-control families covered: `9`

        ## Posture Mix

        | Posture | Cases |
        | --- | ---: |
        | happy | 2 |
| degraded | 3 |
| blocked | 3 |
| recovery | 3 |

        ## Governing Law

        1. Phase 0 provider-shaped dependencies are simulator-first by default.
        2. Reference cases reuse canonical request, lineage, blocker, settlement, and recovery semantics from the blueprint corpus.
        3. Seed data includes unhappy-path truth, not only visual placeholder success.
        4. Preview shells may not imply calm or writable posture unless the seeded tuples and settlements justify it.
        5. Every simulator publishes explicit mock-now and actual-provider-later sections with rollback-to-simulator law.

        ## Gap Closures

        - `RESOLVED_059_PHASE0_EXTERNAL_FOUNDATION_WAIT`: Phase 0 no longer waits on live onboarding because simulator-first seams are the legal default for the seed corpus.
- `RESOLVED_059_HAPPY_PATH_ONLY_SEED_DATA`: The seed corpus now includes duplicate, blocker, confirmation, identity-repair, degraded, and recovery truth instead of polished happy-path placeholders.
- `RESOLVED_059_PREVIEW_CONTINUITY_TRUTH_DRIFT`: Every reference case now binds to continuity-control families and ring-specific verification tuples so preview shells cannot claim calmness without governing truth.
- `RESOLVED_059_SIMULATOR_PROVIDER_SEMANTIC_DRIFT`: Each simulator now publishes mock-now and actual-provider-later sections with bounded deltas and rollback-to-simulator law.
- `RESOLVED_059_TELEPHONY_CONTINUATION_GUESSWORK`: Telephony seeded continuation is now tied to explicit continuation-eligibility and reachability seed tuples rather than transcript heuristics.
- `RESOLVED_059_RELEASE_PROOF_SIMULATION_SPLIT`: Reference cases now map directly into preview, integration, preprod, and wave-probe verification instead of living in a separate demo-only world.

        ## Source Order

        - `prompt/059.md`
- `prompt/shared_operating_contract_056_to_065.md`
- `prompt/AGENT.md`
- `prompt/checklist.md`
- `blueprint/phase-cards.md#Card 1: Phase 0 - The Foundation Protocol`
- `blueprint/phase-0-the-foundation-protocol.md#0A Foundation kernel, control plane, and hard invariants`
- `blueprint/phase-0-the-foundation-protocol.md#6.5 Support and replay algorithm`
- `blueprint/phase-0-the-foundation-protocol.md#6.6 Adapter outbox, inbox, and callback replay rule`
- `blueprint/platform-runtime-and-release-blueprint.md#Verification ladder contract`
- `blueprint/platform-runtime-and-release-blueprint.md#ContinuityContractCoverageRecord`
- `blueprint/platform-runtime-and-release-blueprint.md#SyntheticRecoveryCoverageRecord`
- `blueprint/platform-frontend-blueprint.md#Typed patient transaction route contract`
- `blueprint/ux-quiet-clarity-redesign.md#Control priorities`
- `blueprint/forensic-audit-findings.md#Finding 57`
- `blueprint/forensic-audit-findings.md#Finding 58`
- `blueprint/forensic-audit-findings.md#Finding 71`
- `blueprint/forensic-audit-findings.md#Finding 72`
- `blueprint/forensic-audit-findings.md#Finding 95`
- `data/analysis/adapter_simulator_contract_manifest.json`
- `data/analysis/adapter_contract_profile_template.json`
- `data/analysis/dependency_degradation_profiles.json`
- `data/analysis/frontend_route_to_query_command_channel_cache_matrix.csv`
- `data/analysis/release_contract_verification_matrix.json`
- `data/analysis/verification_scenarios.json`
- `data/analysis/closure_blocker_taxonomy.json`
- `data/analysis/canonical_event_family_matrix.csv`
