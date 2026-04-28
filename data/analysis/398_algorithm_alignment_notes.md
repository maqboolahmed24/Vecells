# 398 Algorithm Alignment Notes

Task `398` consumes the phase 7 route, SSO, bridge, artifact, and release-control outputs and exposes a support/governance/audit surface inside the operations shell.

| Required law | Implemented surface | Enforcement |
| --- | --- | --- |
| Support can answer what the patient saw. | `WhatPatientSawPanel`, timeline patient summaries, root `data-patient-visible-recovery-summary`. | Playwright verifies patient state for consent denial, read-only freeze, and safe route recovery. |
| Release and support share channel vocabulary. | `nhs-app-channel-workbench.model.ts` exports one grammar for channel type, SSO outcome, freeze posture, artifact posture, and recovery kind. | Validator checks grammar values in the model and contract. |
| Channel data is visually readable. | Three-region workbench with route rail, center timeline canvas, and right inspector using the `NHSApp_Channel_Control_Workbench` visual mode. | Visual Playwright spec checks no horizontal overflow and captures a screenshot. |
| Operator actions stay subordinate to release posture. | Recovery action bar uses selected-case `recoveryKind`, `recoveryPath`, and freeze data instead of independent override controls. | Governance Playwright spec asserts freeze posture and recovery action stay linked. |
| Audit and release deep-link into one channel context. | `NHSAppAuditDeepLinkStrip` links support case, release row, audit event, and governed recovery path. | Audit Playwright spec asserts deep-link hrefs share the selected event/case. |
| Inspector state is replayable. | `buildNHSAppWorkbenchUrl` serializes `case`, `tab`, `event`, `channel`, `route`, `sso`, `freeze`, and `dock`. | Traceability Playwright spec clicks a case and verifies URL mutation. |

## Upstream Mapping

| Upstream task | Consumed concept | 398 record field |
| --- | --- | --- |
| `380` | deep link and return-to-journey resolution | `jumpOffRoute`, `resumePath` |
| `381` | bridge capability matrix | `bridgeCapabilityFloor` |
| `383` | continuity evidence and promotion checks | `releaseEvidenceRef` |
| `385` | live control, kill switch, freeze checks | `freezePosture`, `routeFreezeRecordRef` |
| `386` | embedded shell split and header suppression | `channelType`, patient-visible summaries |
| `396` | Sandpit/AOS operational tuple and SCAL evidence posture | `cohortRef`, `releaseEvidenceRef` |
| `397` | cohort, guardrail, freeze disposition, monthly pack law | `routeFreezeDispositionRef`, `recoveryKind` |

The implementation deliberately does not introduce a new backend object for task `398`. The repo already has phase 7 service objects for route, SSO, artifact, and release controls; this workbench joins those objects into the operator-facing support surface.
