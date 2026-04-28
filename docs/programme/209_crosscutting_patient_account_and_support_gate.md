
# Crosscutting Patient Account And Support Gate

Task: `seq_209`

Visual mode: `Patient_Account_Support_Gate_Board`

Decision: `open_patient_account_and_support_parallel_work_package`

Gate state: `opened_with_explicit_parallel_seams`

This gate opens tasks `210` through `222` as one parallel work package with explicit seams. It does not approve production clinical-safety, DSPT, credentialled live NHS login, live signal-provider, or operational release evidence. Those remain actual-later constraints from `seq_208`.

## Tracks

| Lane | Tasks | Responsibility |
| --- | --- | --- |
| Patient backend | par_210<br>par_211<br>par_212<br>par_213<br>par_214 | Projection owners for patient home, request detail, child context, records, and communications. |
| Patient frontend | par_215<br>par_216<br>par_217 | Patient account routes consume backend projections and publish browser proof without route-local truth. |
| Support backend | par_218<br>par_219 | Support lineage, ticket workspace, controlled repair, delivery, replay, and fallback foundations. |
| Support frontend | par_220<br>par_221<br>par_222 | Staff entry, support ticket shell, masking, read-only fallback, and contextual assist surfaces. |

## Frozen Continuity Laws

| Law | Rule | Evidence |
| --- | --- | --- |
| Identity-binding truth | No patient or support surface may reinterpret authenticated subject, identity hold, wrong-patient repair, or binding supersession outside the Phase 2 binding outputs. | data/test/204_suite_results.json<br>data/test/206_suite_results.json<br>data/test/207_suite_results.json |
| Session truth | Local session, logout, expiry, state, nonce, and same-shell recovery remain owned by the Phase 2 session governor. | data/test/204_suite_results.json<br>data/analysis/195_auth_recovery_state_matrix.csv |
| Release and trust freezes | Writable posture requires route intent, release freeze, channel release posture, and assurance-slice trust to remain live for the governing object. | data/analysis/180_scope_envelope_authorization_cases.json<br>data/analysis/197_access_posture_and_reason_code_matrix.csv |
| Same-shell continuity | Home, request detail, more-info, records, messages, support ticket, observe, and replay routes preserve shell and selected anchor when the continuity tuple is still valid. | data/analysis/199_saved_context_restore_and_promotion_mapping_matrix.csv<br>blueprint/phase-0-the-foundation-protocol.md |
| Return contracts | Patient and support child routes return through typed return bundles or continuity evidence, not browser history alone. | blueprint/patient-account-and-communications-blueprint.md<br>blueprint/staff-operations-and-support-blueprint.md |
| Canonical request and duplicate truth | Request lineage, duplicate follow-up, late evidence, and re-safety remain canonical request truth and may only be consumed through the published projections. | data/test/206_suite_results.json<br>data/test/207_suite_results.json<br>data/analysis/184_request_identity_state_matrix.csv |
| Contact and reachability truth | Reachability, contact repair, consent, callback, and delivery posture are blocker-first and may not be bypassed by stale optimistic actions. | data/analysis/200_contact_source_editability_and_repair_matrix.csv<br>data/analysis/201_channel_parity_matrix.csv |
| Masking and replay truth | Support summary, replay, observe, and read-only fallback preserve chronology and mask scope without becoming a second system of record. | data/analysis/186_masking_and_disclosure_cases.json<br>blueprint/staff-operations-and-support-blueprint.md |

## Merge Gates

| Gate | Requirement | Evidence |
| --- | --- | --- |
| MG_209_TASK_OUTPUT_CONTRACT_PRESENT | Tasks 210-222 must each publish their promised docs, data, validator, and Playwright or backend proof before seq_223 integrates the block. | prompt/210.md<br>prompt/211.md<br>prompt/212.md<br>prompt/213.md<br>prompt/214.md<br>prompt/215.md<br>prompt/216.md<br>prompt/217.md<br>prompt/218.md<br>prompt/219.md<br>prompt/220.md<br>prompt/221.md<br>prompt/222.md |
| MG_209_INTERFACE_SINGLE_OWNER | Every interface in the shared registry has exactly one authoritative owner and all consumers bind through that owner or an explicit gap artifact. | data/analysis/209_crosscutting_shared_interface_seams.json |
| MG_209_PHASE2_TRUTH_CONSUMED_NOT_REOPENED | Identity, session, release/trust, same-shell, return, request, duplicate, masking, and replay laws remain frozen and are not redefined by patient or support tasks. | data/analysis/208_phase2_exit_gate_decision.json<br>data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json |
| MG_209_NO_DASHBOARD_ROUTE_LOCAL_DRIFT | Patient home stays quiet and projection-owned; staff/support entry stays workbench-owned; no route may recompute action, visibility, or status truth from local joins. | docs/frontend/209_crosscutting_gate_board.html<br>tests/playwright/209_crosscutting_gate_board.spec.js |
| MG_209_GAP_ARTIFACT_RECONCILED | Every missing sibling seam is represented by a PARALLEL_INTERFACE_GAP_CROSSCUTTING artifact and is either closed by the owning task or carried into 223 as a named blocker. | data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_HOME.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_REQUEST_CONTEXT.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_RECORDS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_COMMUNICATIONS.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_LINEAGE.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_REPAIR_REPLAY.json<br>data/analysis/PARALLEL_INTERFACE_GAP_CROSSCUTTING_SUPPORT_FRONTEND.json |
| MG_209_MOCK_ACTUAL_BOUNDARY | Simulator, fixture, and board evidence may open the block; live provider, live credential, clinical-safety, DSPT, and production operational evidence remain actual-later. | data/analysis/209_crosscutting_mock_now_vs_actual_later_matrix.csv<br>data/analysis/208_phase2_open_items_and_crosscutting_carry_forward.json |
| MG_209_BROWSER_BOARD_PARITY | The browser gate board, track matrix, merge gate strip, seam ribbon, ownership conflict panel, and mock/actual boundary map agree exactly with machine-readable artifacts. | docs/frontend/209_crosscutting_gate_board.html<br>tests/playwright/209_crosscutting_gate_board.spec.js |

## Forbidden Overlap Controls

| Overlap | Owner boundary | Risk | Merge check |
| --- | --- | --- | --- |
| Home spotlight cannot own request action semantics | par_210 owns spotlight selection; par_211 owns request action routing and settlement. | Two dominant patient CTAs or a home card that bypasses typed action routing. | Patient home Playwright proof must show the spotlight CTA binds to PatientNextActionProjection or renders read-only. |
| Request detail cannot hide missing child context | par_211 owns shell/detail placeholders; par_212, par_213, and par_214 own child truth. | More-info, callback, record, or message work disappears instead of degrading to governed placeholders. | Request downstream projections must enumerate every missing child with a placeholder or gap artifact. |
| Records and communications cannot redefine status | par_213 owns source-artifact parity; par_214 owns visibility/receipt chronology; neither owns canonical request status. | Record summaries, callback cards, or receipt copy contradict request list/detail state. | Lineage and receipt parity evidence must bind to PatientRequestLineageProjection and authoritative settlement refs. |
| Frontend routes cannot compose truth locally | par_215 to par_217 consume typed patient projections; par_220 to par_222 consume typed support projections. | Browser state, local joins, optimistic timers, or dashboard widgets become de facto domain logic. | Playwright and validators must assert projection payload parity for every browser state. |
| Support cannot become a second system of record | par_218 frames support tickets over lineage; patient request, message, callback, identity, and artifact truths stay upstream. | Ticket-local copies diverge from patient-visible truth or mask scope. | Support projections cite SupportLineageBinding, SupportLineageArtifactBinding, and disclosure records for every widened context. |
| Repair and replay cannot fork external effects | par_219 owns controlled resend, repair, replay checkpoint, release, and restore settlement; frontend tasks render only those states. | Duplicate operator clicks or provider retries create second external side effects or timeline truth. | Support action settlement and replay release must prove idempotency, evidence freeze, live-restore checks, and read-only fallback. |

## Drift Controls

- Dashboard drift is blocked by `PatientSpotlightDecisionProjection`, `PatientSpotlightDecisionUseWindow`, and `PatientQuietHomeDecision`.
- Route-local patient action drift is blocked by `PatientActionRoutingProjection`, `PatientActionSettlementProjection`, `PatientNextActionProjection`, and `PatientSafetyInterruptionProjection`.
- Support ownership creep is blocked by `SupportLineageBinding`, `SupportLineageArtifactBinding`, `SupportContextDisclosureRecord`, and `SupportReadOnlyFallbackProjection`.

## Machine-Readable Artifacts

- `data/analysis/209_crosscutting_parallel_gate.json`
- `data/analysis/209_crosscutting_track_matrix.csv`
- `data/analysis/209_crosscutting_shared_interface_seams.json`
- `data/analysis/209_crosscutting_mock_now_vs_actual_later_matrix.csv`
- `docs/frontend/209_crosscutting_gate_board.html`
- `tools/analysis/validate_crosscutting_parallel_gate.py`
- `tests/playwright/209_crosscutting_gate_board.spec.js`
