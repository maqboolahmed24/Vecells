# 250 Advice Content Review And Rollout Runbook

## Normal rollout

1. register `ClinicalContentApprovalRecord`
2. register `ContentReviewSchedule`
3. register `AdviceBundleVersion`
4. register one or more `AdviceVariantSet`
5. render advice only after the current `249` boundary and grant tuple is live

## Operational checks

- confirm the bundle path matches the current compiled policy bundle
- confirm the review schedule is still current
- confirm the selected variant and any fallback path match the requested audience, channel, locale, reading level, and accessibility needs
- confirm the current publication and trust posture still permits visible advice

## Failure handling

- review due or approval drift: settle `withheld`
- boundary or grant drift: settle `invalidated`
- new approved content replaces current content: settle `superseded`
- trust quarantine or quarantined release input: settle `quarantined`

## Accepted temporary seams

The current release-watch and channel-freeze posture is still simulator-backed input to the render command rather than a subscribed control-plane feed.
The self-care experience projection remains an explicit seam; `250` publishes the authoritative settlement and later surfaces consume it.
