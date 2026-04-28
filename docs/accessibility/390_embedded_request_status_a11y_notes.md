# 390 Embedded Request Status Accessibility Notes

## Landmarks And Naming

`EmbeddedRequestStatusFrame` is the single main landmark. The masthead uses `role="banner"`, the request-view switcher is a labelled `nav`, and every summary, timeline, more-info, callback, message, and recovery section is labelled by a visible heading.

## Timeline Parity

The visual timeline is an ordered list. Every dot has adjacent text that includes the milestone title, patient-facing body, state label, and projection reference, so meaning is not carried by color or position alone.

## Status And Live Updates

`EmbeddedRequestStateRibbon` uses `role="status"`. Route changes and reply-settlement changes update a single polite live region. More-info validation uses an already-mounted `role="alert"` region with `aria-atomic="true"`.

## Controls

The reply textarea is disabled when `PatientMoreInfoResponseThreadProjection.answerabilityState` is not answerable. The sticky `EmbeddedRequestActionReserve` is labelled, remains within the viewport, and exposes one dominant next action plus an optional status-return action.

## Responsive And Motion

The CSS uses 16px safe-area padding, a 72px sticky reserve, no horizontal overflow target, and `prefers-reduced-motion: reduce` parity for timeline and panel transitions.
