# 388 Embedded Entry Corridor Spec

## Purpose

`NHSApp_Embedded_Entry_Corridor` is the patient-visible sign-in bootstrap for NHS App embedded journeys. It sits before the Phase 7 embedded shell, keeps the requested route family and selected anchor intact, and only hands off to the shell after the sign-in check has a safe local session decision.

The corridor is intentionally narrow: it is not a landing page, support article, or wizard. It provides one header frame, one progress rail, one state card, and one bottom action cluster.

## Components

- `EmbeddedEntryLanding`: page composition and focus reset on posture changes.
- `EmbeddedIdentityResolverView`: selects the visible posture from the state-machine adapter.
- `EmbeddedEntryStateCard`: single card for patient-visible sign-in and recovery messaging.
- `EmbeddedConsentDeniedView`: declined NHS login sharing recovery.
- `EmbeddedExpiredSessionView`: ended-session recovery.
- `EmbeddedSafeReentryView`: trusted-origin recovery.
- `EmbeddedWrongContextRecoveryView`: route and subject mismatch recovery.
- `EmbeddedEntryProgressRail`: compact four-step progress.
- `EmbeddedEntryActionCluster`: bottom safe-area action reserve.
- `EmbeddedEntryHeaderFrame`: NHS App embedded frame label and route label.
- `EmbeddedEntryStateMachineAdapter`: controller that scrubs inbound URL data, resolves route intent, and performs shell handoff.

## Route Contract

Entry routes:

- `/nhs-app/entry?entry=landing&route=request_status`
- `/embedded-entry?entry=confirming&route=appointment_manage`
- `/auth/nhs-app/entry?entry=success&route=patient_message_thread`

The entry route must be evaluated before the existing `/nhs-app` embedded shell catch-all. Successful continuation uses `buildEmbeddedShellUrl(route, "embedded")` and `window.location.replace(...)` so the browser history does not retain inbound handoff data.

## Patient-Visible Postures

- Opening your NHS login
- Confirming your details
- We could not sign you in here
- Please go back to the NHS App and try again
- You chose not to use your NHS login
- Your session has ended

Visible copy, DOM anchors, and client-side console output must not expose raw authentication plumbing. The controller removes sensitive inbound query keys and preserves only `entry`, `route`, and `channel` before the patient continues.

## State Machine

The adapter resolves:

- `SSOEntryGrant`
- `AuthBridgeTransaction`
- `SessionMergePolicy`
- `IdentityAssertionBinding`
- `SessionMergeDecision`
- `ReturnIntent`
- `SSOReturnDisposition`

Only `success` and `reauth_success` can produce `shell_handoff`. All other postures keep patient details closed and either restart sign-in or return to the NHS App shell home.

## Layout

- Canvas: `#F6F8FB`
- Panel: `#FFFFFF`
- Panel soft: `#EEF3F7`
- Stroke: `#D9E2EC`
- Text strong: `#0F172A`
- Text: `#334155`
- Text muted: `#64748B`
- Entry accent: `#2457FF`
- Success: `#146C43`
- Warning: `#A16207`
- Blocked: `#B42318`

The content surface is capped at 34rem, the state card at 32rem, horizontal padding starts at 16px, card padding is 20px, and the action cluster sits at 16px plus safe-area inset.

## Verification

Validation is provided by `tools/analysis/validate_388_embedded_entry_corridor_ui.ts`.

Playwright evidence covers clean entry, silent re-auth success, consent denial, session expiry, wrong context, safe re-entry, narrow embedded viewport behavior, safe-area action placement, ARIA snapshots, traces, and visual screenshots.

