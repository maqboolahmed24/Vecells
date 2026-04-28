# 301 Booking Recovery Envelopes Accessibility Notes

## Accessibility goals

- Recovery explanations remain perceivable without moving focus unexpectedly.
- Identity-hold recovery preserves only summary-safe detail.
- The dominant recovery action stays singular and keyboard reachable.
- Secure-link recovery retains the same meaning and next step as the authenticated route.

## Implemented posture

- `BookingRecoveryShell` publishes machine-readable recovery markers through data attributes and a polite live region.
- `BookingContactRepairMorph` is focusable with `tabIndex="-1"` so the manage recovery shell can move focus to the repair morph without opening a detached modal.
- Wrong-patient recovery uses `identity_hold_summary` and a dedicated `BookingIdentityHoldPanel` so the surface reads as more restrictive than ordinary stale recovery.
- Waitlist secure-link recovery adds `BookingSecureLinkRecoveryFrame` without changing `data-recovery-reason` or `data-next-safe-action`.
- contact-route repair remains attached to the blocked booking context instead of opening a generic stale detour.

## Standards support

- WCAG 2.2 `Focus Order` informed the summary -> reason -> action -> return reading order.
- WCAG 2.2 `Status Messages` informed the polite live-region announcement strategy.
- WCAG 2.2 `Timing Adjustable` informed recovery copy around expired windows and pending confirmation so time-bound states stay explicit.
- WAI-ARIA APG `Alert` informed non-focus-stealing status messaging.
- WAI-ARIA APG `Dialog (Modal)` informed focus-return expectations even though this recovery family avoids modal interruption.

## Playwright proof

- aria snapshots for workspace recovery, identity-hold recovery, and secure-link contact-repair recovery
- axe scans for WCAG A and AA tags
- reduced-motion coverage on secure-link recovery
- screenshot and atlas proof to catch structural drift
