# 298 Waitlist views accessibility notes

## Scope

`PatientWaitlistViews` keeps join, waiting, live offer, expiry, fallback, secure-link continuation, and contact-route repair inside the same booking shell.

## Accessibility commitments

- Keep one `main` landmark from the booking shell and preserve the existing shell navigation landmarks.
- Move focus to the waitlist stage heading when the local waitlist state changes in place.
- Use `role="status"` and `aria-live="polite"` for same-page state changes that do not take focus.
- Keep secure-link offer acceptance inside the same shell so screen-reader users do not lose orientation.
- Preserve all actionable content at narrow widths without horizontal scrolling.
- Keep repair and fallback posture readable even when actions are temporarily blocked.

## Specific notes

- Join and manage states are inline cards, not modal dialogs, because the patient still needs the surrounding request and preference context.
- Contact-route repair also stays inline for the same reason; the blocked offer card remains visible above the repair action.
- The offer card distinguishes honest nonexclusive, real held, pending, expired, and superseded posture using text and structure, not color alone.
- Sticky actionable controls are supplemental only; the primary action also remains in the document flow.
- Reduced motion keeps all meaning through focus movement, text, and state chips rather than animated countdown treatment.

## Standards reviewed

- WCAG 2.2 Reflow
- WCAG 2.2 Status Messages
- WAI-ARIA APG Dialog (Modal) Pattern
- WAI-ARIA APG Alert Dialog Pattern
- NHS accessibility and content guidance
