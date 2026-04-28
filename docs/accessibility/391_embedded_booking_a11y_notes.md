# 391 Embedded Booking Accessibility Notes

The embedded booking route exposes one `main` landmark and labelled sections for offer list, comparison strip, alternatives, waitlist, manage, confirmation, reminders, calendar, recovery, and sticky actions.

The offer set is list-first and has text parity for every visual cue. Reservation truth badges use `role="status"` but avoid live urgency unless canonical truth allows it. The hidden live region announces route state changes politely.

The sticky action reserve is always within the viewport in the Playwright narrow-device checks and the page includes bottom safe-area padding so content is not obscured.

Calendar handoff is represented as a normal button with an explicit disabled state until bridge capability is available. The button does not call raw vendor URLs and the card carries `data-bridge-wrapper="EmbeddedBookingCalendarBridgeWrapper"` for automation and review.

Reduced-motion parity is implemented in CSS with `prefers-reduced-motion`.

