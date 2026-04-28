# 372 Phase 6 Completion And Phase 7 Handoff Map

## Completion Boundary

The formal handoff verdict is `go_with_constraints`.

Phase 6 now has one closed-loop pharmacy baseline:

- triage-created pharmacy cases remain tied to the originating request lineage
- eligibility and provider choice use versioned policy and disclosure contracts
- consent, package composition, dispatch, and proof deadlines are fenced
- patient status is referral-loop truth, not appointment truth
- outcomes reconcile through outcome truth gates before closure
- urgent returns, bounce-backs, no-contact states, provider outages, and practice visibility stay explicit
- pharmacy console and patient routes share same-shell continuity, responsive behavior, and accessibility proof

## Phase 7 May Assume Complete

- canonical pharmacy route inventory exists for patient and staff surfaces
- patient pharmacy routes expose chooser, instructions, status, review, repair, and urgent-return states
- pharmacy console routes expose queue, case, inventory, handoff, assurance, and recovery states
- browser proof exists for desktop, tablet, phone, Chromium, and Firefox critical smoke
- local non-production provider and transport manifests exist

## Phase 7 Must Inherit As Constrained

- `CF372_001` and `CF372_002`: live partner onboarding, Update Record observation, and referral-transport certification are not claimed by Phase 6
- `CF372_003`: manual assistive technology testing and physical device-lab assessment remain required before NHS App limited release
- `CF372_004` and `CF372_005`: NHS App SCAL, product assessment, incident rehearsal, limited-release plan, and connection agreement remain external launch controls
- `CF372_006`: production rollback and kill-switch rehearsal must happen before widened live release

## Phase 7 Must Not Reopen Without A New Gate

- `LifecycleCoordinator` closure authority
- Update Record observation boundary and urgent-return separation
- patient-choice truth and visible choice-set disclosure
- dispatch proof, degraded transport confirmation gates, and no-auto-close outcome rules
- urgent-return, bounce-back, no-contact, and loop-prevention semantics

## Handoff Artifacts

- verdict: `data/contracts/372_phase6_exit_verdict.json`
- readiness registry: `data/contracts/372_phase6_release_readiness_registry.json`
- handoff contract: `data/contracts/372_phase6_to_phase7_handoff_contract.json`
- rollout guardrails: `data/contracts/372_phase6_rollout_guardrail_pack.json`
- launch seed packets: `data/launchpacks/372_phase7_seed_packet_373.json` through `data/launchpacks/372_phase7_seed_packet_376.json`
