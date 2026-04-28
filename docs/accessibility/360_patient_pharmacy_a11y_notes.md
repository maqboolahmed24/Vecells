# 360 Patient Pharmacy Accessibility Notes

## Landmarks

- the shell keeps one `banner`
- the route family keeps one named `navigation` landmark: `Patient pharmacy routes`
- the shell keeps one `main`

## Status and alert semantics

- review-next-step pages use `role="status"` when the content is advisory and should not interrupt focus
- urgent and contact-repair pages use `role="alert"` because they are time-sensitive and block calm progress
- alert surfaces do not move focus

## Disclosure semantics

- `PharmacyStatusTracker` uses button disclosures
- each disclosure row has `aria-expanded`
- each disclosure row points at its detail panel with `aria-controls`

## Mobile proof

- reduced-motion mobile scenarios are part of the 360 Playwright battery
- the route must hold at `390px` width without horizontal overflow

## Content

- no transport or integration jargon is exposed in the patient route
- no appointment-booking language is used for pharmacy instructions or outcomes
- calm completion copy is gated by the status truth rather than by route alone
