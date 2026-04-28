# 422 Trust Posture Accessibility Notes

## Semantics

`AssistiveTrustStateFrame` is a labelled section inside the existing assistive rail complementary region. It reflects the current `AssistiveCapabilityTrustEnvelope`. It uses `role="status"` for non-interruptive posture changes and `role="alert"` for quarantined and blocked-by-policy states that require immediate assistive-action suppression.

The severe alert states are persistent and do not auto-dismiss. `blocked_by_policy` is a hard stop, while `quarantined` is containment; neither state steals focus. This follows the WAI-ARIA alert pattern expectation that important messages can be announced without interrupting the user's current task.

## Disclosure

Bounded recovery detail uses a native button with `aria-expanded` and `aria-controls`. Enter and Space use native button behavior. Escape closes the open detail drawer while focus is inside the trust frame and returns focus to the disclosure button.

## Actionability

The frame renders allowed and suppressed actions as visible text lists. This avoids color-only status communication and makes blocked-by-policy states explicit without implying a workaround.

## Reduced Motion

Posture transitions and recovery detail reveal are restrained to 120ms. `prefers-reduced-motion` removes these animations and transitions.

## Keyboard Checks

- Tab reaches the recovery detail button when it is enabled.
- Enter opens the bounded recovery drawer.
- Escape closes the drawer and returns focus.
- Severe states expose `role="alert"` without moving focus.
- Blocked-by-policy has no enabled assistive action button.
- Frozen posture stays distinct from quarantined containment because frozen means preserved context with actions stopped.
