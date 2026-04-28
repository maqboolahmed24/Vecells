# 372 Phase 6 Exit Gate Decision

Task: `seq_372_phase6_exit_gate_approve_pharmacy_loop_completion`

## Verdict

`go_with_constraints`

Phase 6 is complete enough to hand off to the deferred NHS App channel wave, provided Phase 7 inherits the launch constraints in `data/contracts/372_phase6_to_phase7_handoff_contract.json` and does not treat external onboarding as already complete.

## Release Class

`controlled_phase6_completion_with_external_partner_and_assurance_constraints`

This is not a production-wide Pharmacy First go-live approval. It is a formal close of the repository-owned Phase 6 implementation and proof wave, with bounded constraints for live NHS partner onboarding, SCAL and clinical-safety sign-off, manual assistive technology assessment, physical device-lab coverage, and live rollback rehearsal.

## Evidence Basis

- `369`: eligibility, provider-choice, directory, dispatch-proof, and outcome-reconciliation proof passed.
- `370`: bounce-back, urgent-return, practice-visibility, exception, provider-health, and outage proof passed after fixing the operations summary CAS ordering defect.
- `371`: console, patient status, responsive, accessibility, aria, reduced-motion, visual, and cross-browser proof passed after fixing the inline acknowledgement target-size defect.
- `366` and `367`: non-production directory, dispatch, Update Record observation, and referral-transport setup are deterministic but still bounded by live partner approval.
- `368`: pharmacy loop is integrated into request detail, patient messaging, staff entry, operations visibility, and notification surfaces.

## Blocking Defects

No repository-owned blocking defects are open in this gate.

## Carry Forward

Six constraints carry forward. They are bounded and do not weaken the Phase 6 local contract:

- `CF372_001`: live directory and dispatch-provider approval
- `CF372_002`: live Update Record observation and referral-transport certification
- `CF372_003`: manual assistive technology and physical device-lab assessment
- `CF372_004`: SCAL, clinical-safety case, and CSO sign-off before NHS App launch
- `CF372_005`: NHS App incident rehearsal and limited-release implementation plan
- `CF372_006`: live rollback and kill-switch rehearsal before widened production release

## Launch Conditions For Phase 7

Phase 7 may start only as a constrained deferred-channel wave. It may consume Phase 6 pharmacy truth, patient-status truth, pharmacy console routes, accessibility proof, and release guardrails, but it must not reopen Phase 6 domain semantics without a new gate.

The first downstream gate, `373`, must consume the seed packet at `data/launchpacks/372_phase7_seed_packet_373.json`.
