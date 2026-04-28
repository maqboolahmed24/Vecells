# 357 Eligibility Accessibility Notes

## Keyboard

- every gate row is a real `button`
- each gate row publishes `aria-expanded` and `aria-controls`
- `Enter` and `Space` toggle gate detail disclosure
- the evidence drawer uses a button-led disclosure and stays in the normal tab order
- the patient next-step CTA remains visible and reachable on narrow screens

## Landmark And Reading Order

- the pharmacy-console shell keeps one `main` landmark and one promoted support region
- the patient shell keeps one `main` landmark and a separate anchor rail
- the unsuitable-return state remains in the main reading flow instead of being buried inside a later drawer

## Screen Reader Notes

- patient wording avoids threshold IDs, rule IDs, and internal class names
- supersession posture is exposed through `role="status"` so refresh or stale state is announced without a modal interruption
- the patient summary keeps the key message in one short paragraph

## Reflow

- the gate ladder collapses to one column below `960px`
- evidence and version grids collapse before the CTA
- no drawer or support surface may cover the dominant next-step button

## Reduced Motion

- hover and disclosure transitions are brief and non-essential
- reduced-motion parity is maintained by keeping structure changes visible without relying on animation
