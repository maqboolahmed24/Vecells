# 155 Patient Intake Same-Shell Contracts

## Core Law
The patient intake mission frame is one same-shell child route family of the patient shell contract. It does not get to fork into a wizard shell, detached success page, or generic recovery page once the intake lineage is active.

## Continuity Tuple
| Contract member | Value |
| --- | --- |
| route family | `rf_intake_self_service` |
| continuity key | `patient.portal.requests` |
| selected anchors | `request-start`, `request-proof`, `request-return` |
| dominant shell posture | `live`, `recovery_only`, `outcome_authoritative` |
| runtime scenarios exercised | `live`, `recovery_only` |
| summary modes | `panel`, `drawer`, `sheet` |

## Alias Resolution
The runtime supports both:
- implemented alias family: `/start-request...`
- preserved seq_139 contract family: `/intake/...`

This is deliberate. The frontend task required `/start-request...`, while seq_139 already froze `/intake/...`. The shell therefore maps both path sets onto the same route family, same continuity key, same selected-anchor policy, and same shell anatomy.

## Transition Contract
- landing -> request type creates or reopens one draft lineage in place
- request type -> details -> files -> contact -> review changes only the child content region
- review -> urgent or receipt stays inside the same shell and keeps `request-return`
- recovery stays same-shell and returns to the lawful step instead of creating a second draft lane
- receipt -> status is still the same shell, not a dashboard handoff

## Shell-Owned Signals
Only the quiet ribbon owns shell-level status:
- draft not started
- saving quietly
- saved to the active draft
- resume safely
- urgent guidance issued
- outcome settled

Forbidden shell-level patterns:
- toast duplication
- detached alert banners
- global validation blocks
- hidden meaning that exists only in animation

## Action Tray Contract
- exactly one dominant primary action per route
- back action remains quiet and secondary
- tray is sticky on compact and narrow layouts
- focused controls scroll into safe view before the tray can cover them

## Summary Peek Contract
- desktop: persistent right-side panel
- tablet: drawer
- mobile: bottom sheet
- toggling the summary never changes the current route, current selected anchor, or focus target for the step content

## Outcome Contract
The urgent and receipt placeholders are already published as same-shell routes so later tasks can deepen data and copy without replacing shell anatomy:
- `urgent_outcome` proves the in-place urgent morph
- `receipt_outcome` proves the in-place calm receipt
- `request_status` proves the minimal follow-on route in the same shell

## Verification
The validator and browser spec fail when:
- route changes rebuild the shell instead of morphing child content
- shell-level status appears in more than one surface
- mobile tray can cover the focused field region
- diagrams exist without table parity
- urgent or receipt placeholder routes break the continuity key
