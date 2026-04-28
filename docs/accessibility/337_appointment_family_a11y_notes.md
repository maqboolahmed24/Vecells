# 337 Appointment Family Accessibility Notes

## Primary rules

- The merged family keeps one appointments grammar, but it does not flatten semantics. Each `PatientAppointmentFamilyRow` remains an explicit button-backed selection target with a separate next-safe action button.
- `AppointmentFamilyTimelineBridge` uses an ordered list so reminder, continuity, and fallback rows remain readable in sequence.
- `HubFallbackRibbon` is summary-first and does not hide the governing recovery path behind hover or disclosure-only affordances.
- `HubLocalReturnAnchorReceipt` appears above the restored workspace content so focus and reading order do not land underneath later controls.

## WCAG and APG posture

- Reflow: the atlas and runtime layout both target single-column collapse below the wide-shell breakpoint, with no horizontal-scroll dependency for core state.
- Focus not obscured: restored family receipts and selection anchors appear before the working surface, so route returns do not put focus beneath sticky or lower controls.
- Status honesty: pending network truth remains `Confirmation pending`; calm confirmation never comes from route presence alone.
- Disclosure discipline: practice-informed and practice-acknowledged nuance remain secondary disclosure rather than headline truth.

## Proof notes

- `/Users/test/Code/V/tests/playwright/337_appointment_family_list_and_detail.spec.ts` captures an ARIA snapshot for the merged workspace.
- `/Users/test/Code/V/tests/playwright/337_appointment_manage_entry_resolution.spec.ts` proves same-shell route resolution across local manage, network manage, and read-only network posture.
- `/Users/test/Code/V/tests/playwright/337_appointment_family_timeline_and_recovery.spec.ts` proves fallback continuity, return-anchor restoration, and preserved family selection.
- All three specs start Playwright trace capture and keep trace artifacts on failure.

