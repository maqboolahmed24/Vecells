# 300 Record Origin Booking Entry Accessibility Notes

## Landmarks and Structure

- The route stays inside one signed-in patient shell with one `header`, one `nav`, and one `main`.
- `BookingEntryContextRibbon` is the first settled region and gives orientation before deeper action.
- `RecordFollowUpBookingCard`, `BookingLaunchSummaryCard`, `BookingEntryNextActionPanel`, and `BookingQuietReturnStub` each keep explicit headings so landmarks remain scannable.

## Keyboard Order

- The keyboard sequence follows source-first reading order: context ribbon, provenance rail, launch summary, next action, then quiet return.
- Focus lands on the context ribbon after route change and refresh so the patient hears why they arrived before controls.
- The keyboard flow keeps all controls in one section before moving to the next section, matching the same-shell layout.

## Status and Live Messaging

- Route changes announce through one polite live region.
- The context ribbon uses a visible status label and machine-readable `data-entry-writable` posture.
- Recovery or read-only entry states keep status text in place instead of shifting the patient to a detached interruption page.

## Same-Shell Return

- Safe return stays next to the dominant action instead of being buried in a footer.
- Browser-history restore must reopen the same source summary, return target, and selected anchor.
- If continuity drifts, the route keeps origin context visible and downgrades actionability in place.

## Focus and Motion

- Reduced motion preserves meaning through layout and focus restore rather than large transitions.
- Primary and secondary controls keep visible focus treatment with enough contrast against both light and tinted panels.
- No horizontal overflow is allowed at mobile widths because provenance chips, object refs, and continuation tokens wrap aggressively.
