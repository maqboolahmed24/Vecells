# 388 Embedded Entry Corridor Accessibility Notes

## Semantics

The page uses one `main`, one `banner`, a labelled progress `nav`, one live state card, and one labelled action cluster. The state card uses `role="status"` for non-blocking postures and `role="alert"` for recovery postures that stop the journey.

Focus moves to the visible `h1` whenever the posture changes so screen reader users hear the new result before the action cluster.

## Accessible Names

Buttons use visible text as their accessible names. The compact chip is static text and is not used as the only indicator of outcome. The route intent is shown as ordinary text inside the state card, avoiding hidden-only labels.

## Motion And Viewports

State transitions use a short opacity and translate animation. `prefers-reduced-motion: reduce` removes the animation and transition timing. The action cluster is fixed to the bottom safe area and keeps 44px minimum targets.

## Playwright Evidence

The accessibility test writes ARIA snapshots for:

- Primary state card: `output/playwright/388-embedded-entry-state-card.aria.yml`
- Action cluster: `output/playwright/388-embedded-entry-action-cluster.aria.yml`

The tests also check keyboard focus, no horizontal overflow, and absence of raw authentication plumbing from visible text, client URL, and console output.

## Reference Alignment

- Playwright accessibility testing recommends combining automated checks with manual assessment.
- Playwright ARIA snapshots represent accessible structure as YAML.
- WAI ARIA status guidance uses `role="status"` for status messages.
- WAI APG accessible-name guidance prefers visible text and native naming.
- NHS service manual error-summary guidance informed assertive recovery postures, without making the corridor a validation form.

