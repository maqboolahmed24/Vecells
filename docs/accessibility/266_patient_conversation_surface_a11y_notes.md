# 266 Patient Conversation Surface Accessibility Notes

## Keyboard

- the route keeps one clear heading and one dominant action
- section tabs are reachable in logical order before the active stage
- message chronology buttons remain keyboard focusable and update the route anchor without opening a detached page
- request detail and message-cluster launch buttons move into the same conversation family, so keyboard users do not lose context on navigation

## Screen reader

- the root route publishes stable state markers and keeps the live region in the patient shell
- more-info uses question and check-answer structure instead of chat-like transcript semantics
- callback status and repair context use plain headings and summary lists
- message receipt copy avoids internal transport jargon and explains pending review in patient-safe language

## Reduced motion

- route and stage changes preserve the same shell and rely on opacity and focus movement rather than spatial travel
- stale and blocked recovery never replace the route with spinner takeover
- reduced-motion proof covers live, stale, and blocked states

## Plain-language guardrails

- “sent” never means “delivered” or “reviewed”
- “repair” is explained as checking the contact route, not account maintenance
- the patient expectation is written as what happens next, not as internal workflow mechanics
