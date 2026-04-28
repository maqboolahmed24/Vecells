# 362 Bounce-Back Accessibility Notes

## Landmarks and semantics

- the recovery route remains inside the existing pharmacy shell `main`
- urgent or escalated recovery banners use `role="alert"` only when the state should interrupt
- non-urgent recovery banners and escalation updates use `role="status"` semantics

## Keyboard behaviour

- the shell return action remains reachable before the recovery workbench
- the original-request action is a real button and remains keyboard reachable on every recovery variant
- the patient message preview uses a disclosure button with `aria-expanded` and `aria-controls`
- the recovery `DecisionDock` remains the only decisive action cluster in the rail

## Reading order

- main-plane recovery facts appear before rail detail
- reopen diff rows keep previous and current values in one reading block
- suppressed patient messages are rendered as explicit state, never as an empty gap

## Focus and overflow

- recovery panels use `min-width: 0` throughout the main and rail columns
- mobile and 400% zoom proofs must not introduce horizontal scroll
- no recovery alert steals focus automatically

## Copy safety

- patient message preview avoids calm or completed language while recovery is active
- urgent return wording stays short, direct, and operational
- loop-risk escalation copy keeps the blocker and owner explicit
