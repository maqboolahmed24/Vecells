# 398 NHS App Channel Support/Ops Merge Map

Task `398` merges NHS App channel truth into the existing internal operations shell. The route family is intentionally shared across support, release governance, and audit so an operator can replay one patient-visible journey without cross-referencing a spreadsheet.

## Route Ownership

| Route | Shell owner | Workbench mode | State carried in URL |
| --- | --- | --- | --- |
| `/ops/support/channels/nhs-app` | support operations | support channel overview | `case`, `tab`, `event`, `channel`, `route`, `sso`, `freeze`, `dock` |
| `/ops/support/cases/:caseId/channel` | support case detail | support case replay | `case`, `tab`, `event`, `channel`, `route`, `sso`, `freeze`, `dock` |
| `/ops/release/nhs-app/cases/:journeyPathId` | release governance | route freeze inspection | `case`, `tab`, `event`, `channel`, `route`, `sso`, `freeze`, `dock` |
| `/ops/audit/channel/nhs-app/:eventId` | audit and replay | event evidence replay | `case`, `tab`, `event`, `channel`, `route`, `sso`, `freeze`, `dock` |

## Shared Channel Grammar

| Grammar term | Purpose | Source task lineage |
| --- | --- | --- |
| `jumpOffRoute` | Shows the exact NHS App entry or resume path. | `380`, `386`, `389` |
| `channelType` | Distinguishes embedded NHS App shell from standalone web fallback. | `375`, `386` |
| `ssoOutcome` | Captures silent success, failure, consent denial, or safe re-entry. | `378`, `379`, `388` |
| `freezePosture` | Reflects live route freeze disposition. | `385`, `397` |
| `artifactPosture` | Shows whether artifacts are available, summary-first, blocked, or placeholder-only. | `382`, `393` |
| `recoveryKind` | Keeps support action subordinate to governed release posture. | `384`, `397` |
| `patientVisibleSummary` | Records what the patient actually saw. | `386` to `395` |

## UI Composition

The root visual mode is `NHSApp_Channel_Control_Workbench`. The workbench has:

- left rail for case and route selection
- context ribbon for route family, channel, SSO outcome, cohort, and freeze posture
- timeline for entry, route resolution, SSO settlement, navigation, artifact, freeze, and recovery events
- patient preview panel for the exact patient-visible state
- inspector for release evidence, freeze disposition, artifact posture, and recovery action
- audit strip and disclosure-safe table with deep links back to support, release, evidence, and recovery rows

## Operational Boundary

The recovery action bar never changes route-freeze posture. It only exposes governed recovery actions from the selected channel record. Release governance remains the authority for `RouteFreezeDisposition`, while support and audit reuse the same vocabulary and URL state.
