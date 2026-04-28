# 224 Patient, Support, and Record-Artifact Continuity Suite

Task `seq_224` publishes the definitive cross-cutting continuity proof for the patient account, communications, records, support entry, support ticket, masking, replay, and same-shell recovery surfaces built in `210` to `223`.

This suite is repository-runnable and mock-now. It does not claim live provider proof. It proves that the current repository state preserves lawful continuity across the route families and downgrade postures the local algorithm requires.

The assurance surface visual mode is `Portal_Support_Continuity_Assurance_Lab`.

## Local source trace

The suite is grounded in:

1. `blueprint/patient-account-and-communications-blueprint.md`
2. `blueprint/patient-portal-experience-architecture-blueprint.md`
3. `blueprint/staff-operations-and-support-blueprint.md`
4. `blueprint/callback-and-clinician-messaging-loop.md`
5. `blueprint/phase-2-identity-and-echoes.md`
6. `blueprint/phase-0-the-foundation-protocol.md`
7. `prompt/shared_operating_contract_220_to_227.md#3.5`
8. validated outputs from `170` to `223`

## Design research reused

This browser-visible board reuses structural ideas from:

- [NHS accessibility guidance for design](https://service-manual.nhs.uk/accessibility/design): plain-language recovery and bounded escalation copy
- [GOV.UK service navigation](https://design-system.service.gov.uk/components/service-navigation/): compact sectioning and calm route orientation
- [Atlassian navigation system](https://atlassian.design/components/navigation-system): stable left-rail family switching without decorative dashboard chrome
- [Zendesk Agent Workspace](https://support.zendesk.com/hc/en-us/articles/4408821259930-About-the-Zendesk-Agent-Workspace): ticket-first chronology and bounded omnichannel support posture

The lab uses those references for restrained structure, not branding. The local algorithm remains authoritative.

## What the suite proves

- patient shell routes survive home-to-detail, deep-link, back-button, refresh, and stale-link variants
- support entry and support ticket routes preserve selected anchor, same shell, and bounded fallback
- patient and support surfaces stay aligned on lineage, canonical status, repair posture, and provisional communication handling
- records and document artifacts degrade in place when source parity, release, or identity gates narrow the surface
- masked, summary-first, disclosure-gated, observe-only, replay, and read-only fallback states remain visible and lawful
- keyboard traversal, ARIA structure, reduced motion, high zoom, and screenshot evidence remain aligned with machine-readable results

## Executed proof spine

Primary browser proof:

```bash
node /Users/test/Code/V/tests/playwright/224_patient_support_record_artifact_continuity.spec.js --run
```

Playwright is the mandatory browser-proof spine for this suite.

Validator:

```bash
python3 /Users/test/Code/V/tools/test/validate_crosscutting_continuity_suite.py
```

## Artifacts

- case matrix: [224_continuity_case_matrix.csv](/Users/test/Code/V/data/test/224_continuity_case_matrix.csv)
- expected recoveries: [224_expected_settlements_and_recoveries.json](/Users/test/Code/V/data/test/224_expected_settlements_and_recoveries.json)
- record parity cases: [224_record_parity_and_visibility_cases.csv](/Users/test/Code/V/data/test/224_record_parity_and_visibility_cases.csv)
- support masking cases: [224_support_masking_and_fallback_cases.csv](/Users/test/Code/V/data/test/224_support_masking_and_fallback_cases.csv)
- runtime results: [224_suite_results.json](/Users/test/Code/V/data/test/224_suite_results.json)
- defect log: [224_defect_log_and_remediation.json](/Users/test/Code/V/data/test/224_defect_log_and_remediation.json)
- assurance lab: [224_patient_support_continuity_assurance_lab.html](/Users/test/Code/V/docs/frontend/224_patient_support_continuity_assurance_lab.html)

## Repository-owned remediation captured by 224

- `CONT224_001`: support summary now renders `Demographic evidence` alongside the other shared Phase 2 contact domains
- `CONT224_002`: the shared Phase 2 kernel now classifies support `controlled_resend` as `repair_required`

The suite treats those defects as fixed, not waived.
