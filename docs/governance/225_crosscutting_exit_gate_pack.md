# 225 Crosscutting Exit Gate Pack

Task: `seq_225`

Visual mode: `Portal_Support_Baseline_Exit_Board`

Verdict: `approved`

Decision boundary: Approves the repository-runnable patient account, records, communications, support entry, support workspace, masking, replay-safe fallback, and patient-support parity baseline. It does not approve credentialled live NHS login, live provider replay, production clinical-safety signoff, DSPT signoff, or operational deployment readiness.

## Design Research References

The board and scorecard reuse structural ideas, not branding, from:

- https://service-manual.nhs.uk/accessibility/design for plain-language recovery and restrained hierarchy
- https://design-system.service.gov.uk/components/service-navigation/ for compact sectioning and route orientation
- https://atlassian.design/components/navigation-system for stable product-family navigation and low-noise inspector patterns
- https://support.zendesk.com/hc/en-us/articles/4408821259930-About-the-Zendesk-Agent-Workspace for ticket-first chronology and bounded omnichannel support posture
- https://playwright.dev/docs/screenshots and https://playwright.dev/docs/emulation#reduced-motion for screenshot, accessibility, keyboard, and reduced-motion proof expectations

## Gate Decision

This is a real go/no-go gate. The verdict is `approved` because the repository now has traceable, machine-readable proof for the complete portal and support baseline in scope, while later Phase 3 contract work and live-environment proof remain explicit carry-forward items rather than hidden assumptions.

| Question | Answer state | Evidence |
| --- | --- | --- |
| Are tasks 210 to 224 complete, source-traceable, and internally coherent? | approved | prompt/checklist.md<br>data/analysis/225_conformance_rows.json<br>data/analysis/225_evidence_manifest.csv<br>data/analysis/223_merge_gap_log.json |
| Did the definitive continuity suite from 224 pass with machine-readable evidence? | approved | data/test/224_suite_results.json<br>data/test/224_defect_log_and_remediation.json<br>tools/test/validate_crosscutting_continuity_suite.py |
| Do patient account, records, communications, support entry, support workspace, masking, and fallback routes now behave like one coherent product family? | approved | data/analysis/225_conformance_rows.json<br>docs/governance/225_portal_and_support_conformance_scorecard.md<br>data/test/224_suite_results.json |
| Are patient and support surfaces demonstrably aligned to the same Phase 2 identity, status, and capability truth? | approved | data/contracts/223_crosscutting_identity_status_surface_bundle.json<br>data/analysis/223_patient_support_status_parity_matrix.csv<br>tests/playwright/223_patient_support_identity_status_integration.spec.js |
| Are record artifacts and communication artifacts parity-safe and restriction-safe? | approved | data/analysis/213_record_parity_and_release_matrix.csv<br>data/analysis/214_preview_visibility_and_placeholder_matrix.csv<br>data/analysis/217_record_chart_table_fallback_matrix.csv<br>data/test/224_record_parity_and_visibility_cases.csv |
| Which evidence is repository-runnable today, and which later live-environment proofs still remain outside this baseline? | approved | data/analysis/225_conformance_rows.json<br>data/analysis/225_open_items_and_phase3_carry_forward.json<br>docs/governance/208_phase2_mock_now_vs_crosscutting_boundary.md |
| Which items are intentionally deferred to Phase 3 tasks 226+, and why are they not blockers for the current exit? | approved | data/analysis/225_open_items_and_phase3_carry_forward.json<br>prompt/226.md<br>prompt/227.md<br>prompt/228.md<br>prompt/229.md |

## Mandatory Suite

| Suite | Outcome | Proof basis | Summary |
| --- | --- | --- | --- |
| seq_224 | passed | mixed | The definitive cross-cutting continuity suite passes with machine-readable case results, accessibility evidence, screenshot evidence, trace evidence, and explicit remediation of repository-owned defects discovered during the suite buildout. |

## Conformance Summary

| Capability family | Status | Proof basis | Blocker class | Owning tasks |
| --- | --- | --- | --- | --- |
| Patient home and requests | approved | repository_run | none | `par_210`<br>`par_215` |
| Request detail and typed patient action routing | approved | repository_run | none | `par_211`<br>`par_215` |
| More-info, callback, and contact repair | approved | mixed | none | `par_212`<br>`par_216` |
| Records and communications | approved | mixed | none | `par_213`<br>`par_214`<br>`par_217` |
| Support entry and inbox | approved | repository_run | none | `par_218`<br>`par_219`<br>`par_220` |
| Support ticket shell and omnichannel timeline | approved | mixed | none | `par_218`<br>`par_219`<br>`par_221` |
| Support masking, knowledge, history, replay, and read-only fallback | approved | mixed | none | `par_218`<br>`par_219`<br>`par_222` |
| Patient/support identity and status integration | approved | repository_run | none | `seq_223` |
| Continuity and parity test evidence | approved | mixed | none | `seq_224` |

## Carry-Forward Boundary

| Item | State | Owner | Future task refs | Why non-blocking now |
| --- | --- | --- | --- | --- |
| Freeze the Phase 3 triage workspace state model and route-command contract pack | deferred_non_blocking | `seq_226` | prompt/226.md | This exit gate approves the current patient/support baseline only. Queue-task workspace contracts are explicitly the next publication step rather than part of the already-approved route family. |
| Freeze queue ranking, fairness, duplicate-cluster, and more-info review contracts | deferred_non_blocking | `seq_227` | prompt/227.md | The current baseline does not expose Phase 3 queue ranking or duplicate review as live human-checkpoint routes. Those capabilities extend the approved baseline; they do not define it. |
| Freeze endpoint decision, approval, escalation, callback, and admin-resolution boundaries | deferred_non_blocking | `seq_228_to_seq_229` | prompt/228.md<br>prompt/229.md | Those mutable human-checkpoint decisions are downstream of the already-approved patient/support baseline. They must consume this baseline rather than hold it open. |
| Replay the baseline against credentialled live environments and provider bindings | deferred_non_blocking | `future_production_release_gate` | prompt/202.md<br>prompt/203.md<br>docs/governance/208_phase2_mock_now_vs_crosscutting_boundary.md | The 225 verdict explicitly approves the repository-runnable baseline, not live-provider operation. Live replay remains outside the current gate by design. |
| Obtain production clinical-safety, DSPT, rollback, and operational signoff | deferred_non_blocking | `future_production_release_gate` | prompt/121.md<br>prompt/122.md<br>prompt/125.md<br>prompt/126.md | This gate is a product-baseline gate for the patient/support family. Production release approval remains a distinct governance boundary and is intentionally not claimed here. |

## Machine-Readable Artifacts

- `data/analysis/225_crosscutting_exit_gate_decision.json`
- `data/analysis/225_conformance_rows.json`
- `data/analysis/225_evidence_manifest.csv`
- `data/analysis/225_open_items_and_phase3_carry_forward.json`
- `docs/governance/225_crosscutting_exit_gate_pack.md`
- `docs/governance/225_portal_and_support_go_no_go_decision.md`
- `docs/governance/225_portal_and_support_conformance_scorecard.md`
- `docs/governance/225_phase3_carry_forward_boundary.md`
- `docs/frontend/225_portal_support_exit_board.html`
- `tools/analysis/validate_crosscutting_exit_gate.py`
- `tests/playwright/225_portal_support_exit_board.spec.js`

## Risk And Operational Posture

- The patient/support baseline is approved for Phase 3 entry because the repository proof is complete and internally coherent for the in-scope route families.
- Phase 3 must extend this baseline without reopening the already-approved identity, status, continuity, masking, or replay-safe truth.
- Credentialled live-provider proof and production assurance signoff remain explicit future boundaries, not implicit by-products of this approval.
