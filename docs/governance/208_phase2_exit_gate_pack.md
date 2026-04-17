
# Phase 2 Exit Gate Pack

Task: `seq_208`

Visual mode: `Identity_Echoes_Exit_Board`

Verdict: `go_with_constraints`

Decision boundary: Approves the local Phase 2 identity, session, telephony, parity, optional PDS, duplicate, and re-safety algorithm for cross-cutting consumption. It does not approve production clinical signoff, DSPT signoff, credentialled live NHS login, or live signal-provider operation.

## Design Research References

The board reuses structure, not brand chrome, from:

- https://carbondesignsystem.com/data-visualization/dashboards/ for dense scorecard grouping and calm chart density
- https://carbondesignsystem.com/patterns/status-indicator-pattern/ for restrained state chips and status language
- https://design-system.service.gov.uk/components/summary-list/ for evidence summary parity and readable key-value rows
- https://design-system.service.gov.uk/components/tabs/ for compact state switching without changing source truth
- https://service-manual.nhs.uk/design-system/styles/typography for high-trust typography hierarchy
- https://playwright.dev/docs/screenshots, https://playwright.dev/docs/aria-snapshots, and https://playwright.dev/docs/emulation#reduced-motion for screenshot, ARIA, reduced-motion, and browser-proof expectations

Ideas reused: a full-width verdict band, an 8/12 conformance ladder plus 4/12 evidence rail, a lower boundary zone, diagram-to-table parity, and visible status chips for every row.

## Gate Decision

This is a real go/no-go gate. The verdict is `go_with_constraints`, not `approved`, because the repository proves the local Phase 2 algorithm but does not claim credentialled live-provider or production assurance evidence.

| Question | Answer state | Evidence |
| --- | --- | --- |
| Are tasks 170 to 207 complete, source-traceable, and internally coherent? | go_with_constraints | prompt/checklist.md<br>data/analysis/208_phase2_conformance_rows.json<br>data/analysis/208_phase2_evidence_manifest.csv |
| Did testing tasks 204 to 207 pass with machine-readable evidence? | approved | data/test/204_suite_results.json<br>data/test/205_suite_results.json<br>data/test/206_suite_results.json<br>data/test/207_suite_results.json |
| Are Phase 2 canonical invariants demonstrably true? | approved | data/analysis/208_phase2_exit_gate_decision.json<br>data/analysis/208_phase2_conformance_rows.json |
| Which evidence is simulator-backed today and where does live proof remain? | go_with_constraints | data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json<br>docs/governance/208_phase2_mock_now_vs_crosscutting_boundary.md |
| Which items are deferred to cross-cutting tasks 209+ and why are they not Phase 2 blockers? | approved | data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json<br>prompt/209.md |
| Are clinical-safety, security, logging, and operational readiness artifacts bounded enough for this phase boundary? | go_with_constraints | blueprint/phase-2-identity-and-echoes.md#2h-hardening-safety-evidence-and-the-formal-phase-2-exit-gate<br>data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json |

## Mandatory Suites

| Suite | Outcome | Proof basis | Summary |
| --- | --- | --- | --- |
| seq_204 | passed | mock_now | State, nonce, replay, session rotation, expiry, logout, identity mismatch, and same-shell recovery are proven without live provider claims. |
| seq_205 | passed | mock_now | Webhook signatures, duplicate and disorder handling, recording custody, readiness, seeded and challenge grants, and grant replay behavior are proven with simulator-backed evidence. |
| seq_206 | passed | mock_now | Wrong-patient hold, PHI suppression, release fail-closed rules, and semantic web/phone parity are proven. |
| seq_207 | passed | mock_now | Optional PDS enrichment remains bounded and duplicate or late follow-up evidence re-enters duplicate and safety rules correctly. |

## Conformance Summary

| Capability family | Status | Proof basis | Blocker class | Owning tasks |
| --- | --- | --- | --- | --- |
| Trust contract and capability gates | approved | mixed | none | seq_170<br>par_180 |
| Auth bridge and local session engine | approved | mock_now | none | seq_171<br>par_175<br>par_176<br>seq_204 |
| Patient linkage and optional PDS seam | approved | mock_now | none | seq_172<br>par_178<br>par_179<br>par_183<br>seq_207 |
| Authenticated request ownership and portal access | approved | mixed | none | par_181<br>par_184<br>par_185<br>par_195<br>par_196<br>par_197 |
| Telephony edge and call-session state machine | approved | mock_now | none | seq_173<br>par_187<br>par_188<br>seq_205 |
| Caller verification, recording custody, and readiness | approved | mock_now | none | par_189<br>par_190<br>par_191<br>seq_205 |
| Continuation grants and supersession | approved | mock_now | none | par_181<br>par_192<br>par_198<br>seq_205 |
| One-pipeline convergence | approved | mock_now | none | par_193<br>par_201<br>seq_206 |
| Duplicate follow-up and re-safety handling | approved | mock_now | none | par_194<br>seq_206<br>seq_207 |
| Audit and masking | approved | mixed | none | par_177<br>par_186<br>seq_204<br>seq_207 |
| Browser-facing patient experiences | approved | mock_now | none | par_195<br>par_196<br>par_197<br>par_198<br>par_199<br>par_200<br>par_201 |
| Provider-configuration discipline | go_with_constraints | mixed | live_later_non_blocking | seq_202<br>seq_203 |
| Hardening and regression evidence | go_with_constraints | mixed | production_assurance_non_blocking | seq_204<br>seq_205<br>seq_206<br>seq_207 |

## Carry-Forward Boundary

| Item | State | Owner | Future task refs | Why non-blocking now |
| --- | --- | --- | --- | --- |
| CFI_208_LIVE_NHS_LOGIN_CREDENTIALLED_PROOF | deferred_non_blocking | seq_209 | prompt/209.md<br>prompt/202.md | The local callback, replay, session, and logout algorithms are proven by seq_204. Live NHS login credentials remain a provider onboarding and operational-gate activity, not a reason to reopen Phase 2 request truth. |
| CFI_208_LIVE_TELEPHONY_SIGNAL_PROVIDER_PROOF | deferred_non_blocking | seq_209 | prompt/209.md<br>prompt/203.md | Seq_205 proves signed webhook, recording, readiness, and continuation-grant semantics against simulator-backed inputs. Live console mutation remains intentionally blocked until provider credentials and approvals exist. |
| CFI_208_CROSSCUTTING_PATIENT_ACCOUNT_CONSUMPTION | crosscutting_ready | seq_209 | prompt/209.md<br>prompt/210.md<br>prompt/211.md<br>prompt/215.md<br>prompt/216.md<br>prompt/217.md | Phase 2 has frozen identity, session, grant, contact-truth, and same-shell laws. Patient home, request detail, contact repair, record, and communications surfaces may consume those laws without reopening the binding or session algorithms. |
| CFI_208_SUPPORT_SURFACE_CONSUMPTION | crosscutting_ready | seq_209 | prompt/209.md<br>prompt/218.md<br>prompt/219.md<br>prompt/220.md<br>prompt/221.md | Identity repair, replay, duplicate, and masking controls are Phase 2 truths. Support tasks can bind tickets and replay evidence, but they may not redefine request ownership, binding authority, or patient-facing status. |
| CFI_208_CLINICAL_SECURITY_OPERATIONAL_SIGNOFF | deferred_non_blocking | seq_209 | prompt/209.md<br>prompt/121.md<br>prompt/122.md<br>prompt/125.md<br>prompt/126.md | The gate can exit the simulator-backed local algorithm with constraints because clinical-safety, DSPT, and production operational proof are explicitly outside this live-provider claim. |

## Machine-Readable Artifacts

- `data/analysis/208_phase2_exit_gate_decision.json`
- `data/analysis/208_phase2_conformance_rows.json`
- `data/analysis/208_phase2_evidence_manifest.csv`
- `data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json`
- `docs/frontend/208_phase2_exit_board.html`
- `tools/analysis/validate_phase2_exit_gate.py`
- `tests/playwright/208_phase2_exit_board.spec.js`

## Risk And Operational Posture

- Clinical-safety and DSPT artifacts are bounded for algorithmic exit, not production deployment signoff.
- Logging, audit, masking, and event references are sufficient for Phase 2 proof and must be preserved by support and patient-account tasks.
- Rollback and freeze posture remains constrained until live provider and production operational gates rerun the same trust tuples.
- No Sev-1 or Sev-2 local algorithm blocker is represented in the machine-readable rows.
