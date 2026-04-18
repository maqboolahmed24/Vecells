# 274 Phase 3 Callback, Message, And Reachability Suite

`seq_274` is the definitive communication-integrity assurance pack for the Phase 3 callback, clinician-message, reachability-repair, and support-linked recovery chain.

The lab visual mode is `Communication_Repair_Integrity_Lab`.

The suite proves the following repository contracts with real runnable evidence:

- callback truth is provable from leases, attempts, outcomes, and resolution gates rather than local timers
- clinician-message truth is provable from dispatch, delivery evidence, dispute, and governed repair rather than outbox optimism
- repaired routes do not return to calm posture until a fresh reachability epoch exists
- support-local provisional work may not calm patient posture
- patient, staff, and support surfaces remain parity-aligned for the same lineage

## Suite Shape

The assurance pack is split across one service suite, three Playwright suites, one validator, and one static lab:

- service: `/Users/test/Code/V/services/command-api/tests/274_phase3_communication_integrity_assurance.integration.test.js`
- multi-actor Playwright: `/Users/test/Code/V/tests/playwright/274_communication_integrity_multi_actor.spec.ts`
- visuals and accessibility Playwright: `/Users/test/Code/V/tests/playwright/274_callback_and_message_visuals.spec.ts`
- reachability, repair, and support Playwright: `/Users/test/Code/V/tests/playwright/274_reachability_repair_and_support.spec.ts`
- validator: `/Users/test/Code/V/tools/test/validate_274_phase3_communication_integrity_suite.py`
- lab: `/Users/test/Code/V/docs/frontend/274_communication_repair_integrity_lab.html`

## Coverage

The suite covers:

1. callback intent and scheduling:
   - schedule callback
   - reschedule callback
   - cancel callback
   - gate-led expiry
   - lease rotation on material drift
2. callback attempt and outcome families:
   - answered
   - no answer
   - voicemail left
   - invalid route
   - provider failure
   - duplicate dial suppression
   - resolution-gate closure blocking without outcome evidence
3. clinician-message delivery and dispute:
   - draft to send to provider-accepted pending evidence
   - delivered with evidence
   - contradictory receipts
   - governed resend, channel change, and attachment recovery authorization
4. reachability repair:
   - bounce and invalid route open repair-required posture
   - rebound requires a fresh reachability epoch
   - controlled resend and callback reschedule only after rebound
   - stale identity or preference freshness blocks repair calmness
5. patient, staff, and support parity:
   - callback parity across patient and staff
   - message thread parity across patient and staff
   - support replay stays bound to the same lineage and does not imply premature calmness

## Machine-Readable Evidence

Case and expectation artifacts live in:

- `/Users/test/Code/V/data/test/274_callback_cases.csv`
- `/Users/test/Code/V/data/test/274_message_delivery_cases.csv`
- `/Users/test/Code/V/data/test/274_reachability_repair_cases.csv`
- `/Users/test/Code/V/data/test/274_patient_staff_support_parity_cases.csv`
- `/Users/test/Code/V/data/test/274_expected_communication_settlements.json`
- `/Users/test/Code/V/data/test/274_suite_results.json`
- `/Users/test/Code/V/data/test/274_defect_log_and_remediation.json`

`274_suite_results.json` records `passed_without_repository_fix`. no repository-owned communication defect remained after rerun.

## Run

Primary validator entry:

- `pnpm --dir /Users/test/Code/V validate:274-phase3-communication-integrity-suite`

Supporting executions:

- `pnpm --dir /Users/test/Code/V/services/command-api exec vitest run tests/274_phase3_communication_integrity_assurance.integration.test.js`
- `pnpm exec tsx /Users/test/Code/V/tests/playwright/274_communication_integrity_multi_actor.spec.ts --run`
- `pnpm exec tsx /Users/test/Code/V/tests/playwright/274_callback_and_message_visuals.spec.ts --run`
- `pnpm exec tsx /Users/test/Code/V/tests/playwright/274_reachability_repair_and_support.spec.ts --run`

## Result

The suite is repeatable, evidence-rich, and intentionally fail-closed. It rejects timer-only callback truth, provider-accepted-as-delivered optimism, stale-route calmness, and support-local premature closure.
