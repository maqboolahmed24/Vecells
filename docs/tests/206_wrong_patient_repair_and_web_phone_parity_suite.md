# 206 Wrong-Patient Repair And Web/Phone Parity Suite

Task: `seq_206_phase2_Playwright_or_other_appropriate_tooling_testing_run_wrong_patient_repair_and_web_phone_parity_regression_suites`

## Verdict

Mock-now status: `passed`

Live-provider-later status: `not_applicable`

Repository-owned defect finding: `absent_for_206_parity_and_repair_boundary`

The suite proves that wrong-patient repair fails closed and that equivalent web-origin and phone-origin facts converge on the same canonical request truth, duplicate posture, safety outcome, receipt semantics, and recovery posture. The focused repository tests passed against the current command-api implementation: 4 files and 22 tests.

## Local Algorithm Sources

- `blueprint/phase-2-identity-and-echoes.md#2C` requires subject conflict and wrong-patient suspicion to append repair signals, open or reuse one active repair case, and expose only bounded identity-hold recovery until freeze and release settlements allow otherwise.
- `blueprint/phase-2-identity-and-echoes.md#2G` requires web, phone, SMS continuation, secure-link, and support-assisted capture to enter one canonical `SubmissionIngressRecord`, `NormalizedSubmission`, duplicate policy, safety policy, receipt grammar, and status family.
- `blueprint/patient-account-and-communications-blueprint.md#PatientIdentityHoldProjection` requires PHI-bearing detail and mutable actions to be suppressed immediately during hold, including content previously rendered from client memory.
- `blueprint/patient-account-and-communications-blueprint.md#PatientRequestReturnBundle` requires same-shell recovery to preserve selected anchors and return targets.
- `blueprint/phase-0-the-foundation-protocol.md` defines exact-once promotion, idempotency, duplicate handling, route intent, and recovery laws used by both channels.

## Design And Browser Research

This lab borrows structure and hierarchy from established diagnostic and public-service systems without copying brand chrome:

- Carbon dashboards and status indicators informed the use of dense scan lanes, visible status semantics, and table-backed proof rather than decorative cards: https://v10.carbondesignsystem.com/data-visualization/dashboards/ and https://v10.carbondesignsystem.com/patterns/status-indicator-pattern/
- GOV.UK summary-list and tabs patterns informed table-first evidence and keyboard-visible switches: https://design-system.service.gov.uk/components/summary-list/ and https://design-system.service.gov.uk/components/tabs/
- NHS typography guidance informed restrained clinical-service copy hierarchy: https://service-manual.nhs.uk/design-system/styles/typography
- Playwright screenshot, ARIA snapshot, and reduced-motion guidance informed the browser proof strategy: https://playwright.dev/docs/screenshots, https://playwright.dev/docs/aria-snapshots, and https://playwright.dev/docs/emulation#reduced-motion
- WCAG 2.2 focus appearance expectations informed the visible focus and zoom checks: https://www.w3.org/TR/WCAG22/#focus-appearance

## Mock-Now Execution

The suite uses local fixtures and simulator-backed command-api flows:

- `services/command-api/tests/identity-repair-chain.integration.test.js`
- `services/command-api/tests/identity-repair.integration.test.js`
- `services/command-api/tests/telephony-convergence-pipeline.integration.test.js`
- `services/command-api/tests/phone-followup-resafety.integration.test.js`
- `data/test/206_wrong_patient_cases.csv`
- `data/test/206_web_phone_parity_cases.csv`
- `data/test/206_expected_identity_hold_and_release_chains.json`
- `docs/frontend/206_parity_repair_lab.html`
- `tests/playwright/206_parity_repair_lab.spec.ts`

## Live-Provider-Later Strategy

When live auth, telephony, support correction, or provider callback flows arrive, the same test semantics must be reused rather than replaced by manual visual review:

- wrong-patient detection continues to enter `IdentityRepairSignal`, `IdentityRepairCase`, `IdentityRepairFreezeRecord`, and `PatientIdentityHoldProjection`
- release remains fail-closed until the authoritative resulting `IdentityBinding` is current and every governing `IdentityRepairBranchDisposition` is released, compensated, rebuilt, or terminally suppressed
- web-origin, phone-origin, SMS-continuation, secure-link, and support-assisted facts continue to compare through the canonical comparison tuple
- exact duplicates and semantic duplicates never mint a second request, receipt, safety-preemption chain, or PHI-bearing recovery path
- materially new evidence re-enters governed re-safety before calm status is restored

## Scenario Families Covered

Wrong-patient freeze and suppression coverage:

- subject conflict detected before detail is shown
- subject conflict detected after detail was previously visible
- binding supersession while request detail is open
- wrong-patient hold from secure-link uplift
- wrong-patient hold from signed-in portal path
- wrong-patient hold after phone-origin convergence
- hold remains active while branch compensation is pending
- release settlement arrives while resulting binding is stale
- resulting binding becomes current and release completes
- stale client cache tries to replay PHI after hold began

Web and phone semantic parity coverage:

- same symptoms and same routing facts via web and phone
- same urgent-safety facts captured in different order
- same non-urgent case with attachment only on one channel
- same case with missing optional detail on one channel
- later phone follow-up attached to existing lineage
- exact duplicate across channels
- semantic duplicate across channels
- material new evidence across channels requiring re-safety

Recovery and continuity parity coverage:

- request detail return after auth uplift from both channels
- same request viewed signed-in after starting by phone
- same request viewed through secure-link after starting on web
- identity-hold route entered from either channel
- recovery completion returns to the same selected anchor or summary target
- stale and read-only posture matches across channel-origin cases

## Acceptance Evidence

The suite distinguishes `passed`, `failed`, `blocked_external`, and `not_applicable`. `blocked_external` is reserved for future live-provider proof, not for current local simulator failures.

The browser lab is named `Parity_Repair_Lab` and contains:

- `ParityBraid`
- `WrongPatientFreezeReleaseChain`
- `StatusSemanticsMirror`
- `SuppressionInspector`
- `MatrixPair`

The Playwright proof captures aligned parity, duplicate parity, material-new-evidence re-safety, active wrong-patient hold, released-and-resumed, mobile lane switching, reduced-motion, and zoom-resilience states.
