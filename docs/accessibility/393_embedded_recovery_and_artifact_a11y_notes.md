# 393 Embedded Recovery And Artifact Accessibility Notes

## Landmark And Structure

- The route exposes one `main` landmark through `EmbeddedRecoveryArtifactFrame`.
- The masthead uses `role="banner"` and the view switcher uses a named `nav`.
- Each surface uses a labelled `section` with `aria-labelledby`.
- Summary facts use `dl`, `dt`, and `dd` instead of visual-only metadata rows.

## Recovery Semantics

- Expired link, route freeze, degraded mode, and artifact progress use status semantics.
- Invalid context and channel-unavailable conditions can use alert semantics when the route is blocked or requires recovery.
- Support codes are visible only where the governing recovery truth requires them.
- The live region is polite and only mirrors the active recovery announcement.

## Artifact Semantics

- Artifact summary uses a labelled card and structured summary rows.
- Download progress uses `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.
- Preview and fallback are separate labelled sections so a screen reader user can distinguish summary, preview, and fallback posture.

## Keyboard And Motion

- Primary and secondary actions are native buttons.
- The sticky action cluster keeps 44px minimum target height.
- Reduced-motion mode keeps the same hierarchy and disables meaningful transition duration rather than changing content.
- The primary action is disabled for blocked channel state rather than hidden.

## Content

- Each recovery route has one dominant next step and at most one secondary action.
- Copy avoids generic browser failure wording.
- The preserved context line is summary-safe and does not widen PHI exposure.
