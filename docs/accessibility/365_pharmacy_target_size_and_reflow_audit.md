# 365 Pharmacy Target Size And Reflow Audit

## Target Size
- Minimum enforced target size: `44px`
- Applied explicitly to:
  - patient route toggles
  - chooser filter buttons
  - chooser map toggle
  - chooser provider select actions
  - chooser change-provider action
  - pharmacy console route toggles
  - dispatch drawer trigger

## Reflow
- Verified at `390px` mobile width on patient and pharmacy shells.
- Verified at `320px` width on patient and pharmacy shells.
- Verified with reduced motion enabled to ensure no overflow was hidden behind animation timing.

## Motion
- Shared motion bridge collapses transitions to essential-only timing.
- Mission-stack support-region scroll switches from `smooth` to `auto` when motion is reduced.
