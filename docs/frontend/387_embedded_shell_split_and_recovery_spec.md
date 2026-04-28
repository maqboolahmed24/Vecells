# 387 Embedded Shell Split And Recovery Spec

## Purpose

`NHSApp_Embedded_Patient_Shell` proves the Phase 7 one-portal-two-shell law for patient entry routes. The implementation lives inside `apps/patient-web` and uses one route tree, one continuity envelope, and one route content renderer. `StandaloneShell` and `EmbeddedShell` only change the owning chrome and channel policy.

## Route Tree

The source route tree is `EMBEDDED_PATIENT_ROUTE_TREE` in `apps/patient-web/src/embedded-shell-split.model.ts`.

| Route | Standalone path | Embedded path | Continuity object |
| --- | --- | --- | --- |
| `jp_patient_home` | `/home?phase7=embedded_shell&shell=standalone` | `/nhs-app/home?context=signed` | patient home |
| `jp_request_status` | `/requests/REQ-2049/status` | `/nhs-app/requests/REQ-2049/status` | request status |
| `jp_manage_local_appointment` | `/appointments/APT-778/manage` | `/nhs-app/appointments/APT-778/manage` | appointment manage |
| `jp_records_letters_summary` | `/records/letters/REC-LET-3` | `/nhs-app/records/letters/REC-LET-3` | record letter |
| `jp_patient_message_thread` | `/messages/thread/THR-420` | `/nhs-app/messages/thread/THR-420` | message thread |

`EmbeddedRouteContextBoundary` renders the same route title, status, consent, error summary, facts, selected anchor, and dominant action for both shell modes.

## Channel Resolution

Resolution order mirrors `blueprint/phase-7-inside-the-nhs-app.md`:

1. signed context (`context=signed`) or entry token
2. custom NHS App user-agent evidence
3. query hints such as `from=nhsApp`
4. standalone web fallback

Query hints can request embedded styling, but they resolve to `query_hint_only` and `revalidate_only`; they do not unlock privileged bridge-backed actions.

## Shell Policies

`StandaloneShell` uses portal header and footer. `EmbeddedShell` suppresses that supplier chrome and replaces it with:

- `EmbeddedShellHeaderFrame`
- `EmbeddedShellStateRibbon`
- `EmbeddedContinuityBanner`
- `EmbeddedRecoveryFrame`
- `EmbeddedActionReserve`
- `EmbeddedSafeAreaContainer`

The embedded policy uses host safe-area padding, summary-then-handoff delivery, and a sticky action reserve. It does not remove route semantics.

## Continuity

The continuity envelope carries:

- `patientShellContinuityKey`
- `entityContinuityKey`
- `selectedAnchorRef`
- `returnContractRef`
- `shellState`
- `routeId`

The envelope is stored in `sessionStorage` under `vecells.phase7.embedded-shell.continuity`. On refresh, deep-link recovery, browser back or forward, and safe browser handoff return, the shell restores continuity only when patient shell key, entity key, and selected anchor still match.

## Recovery

Recovery is bounded inside the shell.

| Reason | Shell state | Action state | Patient posture |
| --- | --- | --- | --- |
| `none` | `live` | enabled | continue in shell |
| `signed_context_missing` | `revalidate_only` | frozen | revalidate NHS App context |
| `stale_continuity` | `recovery_only` | frozen | recover same route |
| `wrong_patient` | `blocked` | frozen | return to NHS App |
| `route_freeze` | `recovery_only` | frozen | keep last safe summary |
| `eligibility_blocked` | `blocked` | frozen | safe handoff or support |
| `shell_drift` | `revalidate_only` | frozen | refresh continuity evidence |

## Automation Anchors

Every route root exposes the canonical DOM markers required by `blueprint/canonical-ui-contract-kernel.md`, including `data-shell-type`, `data-channel-profile`, `data-route-family`, `data-continuity-key`, `data-return-anchor`, `data-anchor-id`, and `data-dominant-action`.

Key test IDs:

- `EmbeddedPatientShellRoot`
- `StandaloneShell`
- `EmbeddedShellHeaderFrame`
- `EmbeddedShellStateRibbon`
- `EmbeddedContinuityBanner`
- `EmbeddedRecoveryFrame`
- `EmbeddedActionReserve`
- `EmbeddedSafeAreaContainer`
- `EmbeddedRouteContextBoundary`

## Verification

The acceptance proof is:

- `pnpm --dir apps/patient-web typecheck`
- `pnpm validate:387-embedded-shell-ui`
- `pnpm exec tsx ./tests/playwright/387_embedded_shell_continuity.spec.ts --run`
- `pnpm exec tsx ./tests/playwright/387_embedded_shell_recovery.spec.ts --run`
- `pnpm exec tsx ./tests/playwright/387_embedded_shell_accessibility.spec.ts --run`
- `pnpm exec tsx ./tests/playwright/387_embedded_shell_visual.spec.ts --run`
