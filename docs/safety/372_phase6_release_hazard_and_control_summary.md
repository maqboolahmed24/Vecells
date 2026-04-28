# 372 Phase 6 Release Hazard And Control Summary

## Summary

The Phase 6 hazard set is covered by repository-owned controls and proof artifacts. The safety posture supports the `go_with_constraints` verdict. No uncontrolled repository hazard remains open, but live clinical-safety sign-off and SCAL evidence remain carry-forward constraints before NHS App launch or widened production rollout.

## Covered Hazards

- ineligible patient referred down a Pharmacy First pathway
- wrong pathway or wrong pharmacy chosen
- patient denied full provider choice
- stale or superseded pharmacy consent treated as valid
- referral lost in transport
- patient believes a referral is a booked appointment
- urgent bounce-back not seen in time
- outcome linked to the wrong case
- lack of Update Record mistaken for lack of outcome
- repeated bounce-backs causing unsafe delay

## Control Families

- versioned eligibility and policy packs
- provider-choice proof, visible choice-set hash, and warning acknowledgement
- consent checkpoint and dispatch-proof gates
- transport assurance, idempotency, proof deadlines, and degraded dispatch states
- outcome normalization, confidence thresholds, manual review, and closure blockers
- urgent-return direct-channel separation from Update Record
- practice visibility, exception queues, provider-health states, and operations telemetry
- browser accessibility, aria, reflow, reduced motion, and visual baseline proof

## Carry-Forward Safety Controls

- `CF372_004`: DCB0129 and DCB0160 evidence must be completed and signed off before NHS App limited release.
- `CF372_004` and `CF372_005`: SCAL and connection-agreement evidence must be owned by the Phase 7 launch gate.
- `CF372_003`: manual assistive technology testing and physical device-lab checks must augment, not replace, the Playwright proof.
- `CF372_006`: live rollback, incident rehearsal, and kill-switch procedures must be rehearsed before widened production release.
