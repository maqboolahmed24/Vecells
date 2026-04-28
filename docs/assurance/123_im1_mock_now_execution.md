# 123 IM1 Mock Now Execution

Reviewed against the current official IM1 and SCAL pages on `2026-04-14`. This document is the `Mock_now_execution` lane for `par_123`.

Related `Actual_production_strategy_later`: see [123_im1_actual_pairing_strategy_later.md](./123_im1_actual_pairing_strategy_later.md).

## Mock_now_execution

### Bounded IM1 scope

Vecells uses this pack to unblock engineering now without pretending that live IM1 pairing already exists.

- IM1 remains a booking-facing and supplier-capability-driven seam, not a Phase 2 identity shortcut.
- The current rehearsal target is the bounded local-booking use case plus truthful staff-assisted fallback.
- `Optum (EMISWeb), TPP (SystmOne)` are treated as the current provider suppliers because that is what the official IM1 material still names as of `2026-04-14`.

### What engineering can build now

- one bounded product scope dossier
- one non-submittable prerequisite response model using the current public field shape
- one SCAL question bank tied to current repo evidence and explicit gaps
- one supplier capability matrix that distinguishes goals, simulator truth, and real pairing blockers
- one simulator-backed evidence lane for IM1 twins and authoritative booking truth rehearsal

### Simulator-backed evidence placeholders

- Current IM1 twin posture is anchored to [gp_booking_capability_evidence.json](../../data/analysis/gp_booking_capability_evidence.json).
- Current provider roster posture is anchored to [im1_provider_supplier_register.json](../../data/analysis/im1_provider_supplier_register.json).
- Current prerequisite and stage posture is anchored to [im1_pairing_pack.json](../../data/analysis/im1_pairing_pack.json).
- Current safety and IG posture is anchored to [dcb0129_hazard_register.json](../../data/assurance/dcb0129_hazard_register.json) and [dspt_gap_register.json](../../data/assurance/dspt_gap_register.json).

### Sample prerequisite response posture

| Question | Mock response posture | Actual conversion posture | Owner |
| --- | --- | --- | --- |
| Name | covered_with_mock_evidence | gap_open | ROLE_INTEROPERABILITY_LEAD |
| Email | covered_with_mock_evidence | gap_open | ROLE_INTEROPERABILITY_LEAD |
| Organisation name | covered_with_mock_evidence | gap_open | ROLE_INTEROPERABILITY_LEAD |
| Product name | covered_with_mock_evidence | ready_for_conversion_after_submission | ROLE_PROGRAMME_ARCHITECT |
| Qualified Clinical Safety Officer in place | covered_with_mock_evidence | ready_for_refresh_before_submission | ROLE_MANUFACTURER_CSO |
| Detailed use case description covering the whole product | covered_with_mock_evidence | ready_for_refresh_before_submission | ROLE_MANUFACTURER_CSO |
| Written clinical safety process and uplift commitment | covered_with_mock_evidence | ready_for_refresh_before_submission | ROLE_MANUFACTURER_CSO |
| Hazard log capability and uplift commitment | covered_with_mock_evidence | ready_for_refresh_before_submission | ROLE_MANUFACTURER_CSO |
| SaMD additional scrutiny understood where applicable | covered_with_mock_evidence | ready_for_refresh_before_submission | ROLE_MANUFACTURER_CSO |
| DSPT annual assessment commitment | covered_with_mock_evidence | dependency_refresh_required | ROLE_SECURITY_LEAD |

## Actual_production_strategy_later

This mock dossier converts later; it does not become a real submission by drift. The conversion route remains blocked on named owners, refreshed safety and IG evidence, supplier-specific provider packs, licence execution, and supported-test entry criteria.
