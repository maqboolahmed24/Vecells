# 250 Advice Render Settlement And Content Approval

`AdviceRenderSettlement` is the sole authority for visible self-care advice.
Rendered copy, cached HTML, template rows, and linked artifacts are derivative only.

## Core model

This task adds five versioned objects:

- `ClinicalContentApprovalRecord`
- `ContentReviewSchedule`
- `AdviceBundleVersion`
- `AdviceVariantSet`
- `AdviceRenderSettlement`

Every visible advice render binds all five objects together with the current `249` tuple:

- `SelfCareBoundaryDecision`
- `AdviceEligibilityGrant`
- current `DecisionEpoch`
- surface route and publication tuple
- current trust and release posture

## Selection law

The render path resolves exactly one `AdviceBundleVersion` for the current pathway, compiled policy bundle, and audience tier.
It then resolves exactly one `AdviceVariantSet` for channel, locale, reading level, and accessibility needs.

Fallback is allowed only through an explicit stored path such as locale transform or reading-level default.
Fallback transforms may not change clinical or operational meaning.

## Settlement law

`AdviceRenderSettlement` is immutable and versioned.
Each new settlement supersedes the prior one for the task.
The render posture is one of:

- `renderable`
- `withheld`
- `invalidated`
- `superseded`
- `quarantined`

These are not UI hints. They are the authoritative consequence state for visible advice.

## Safety and continuity rules

Every render requires one explicit `ClinicalContentApprovalRecord` and one current `ContentReviewSchedule`.
Unapproved, expired-review, superseded, or missing content stays blocked.

A live `AdviceEligibilityGrant` is not proof of renderable advice.
The render path also checks publication compatibility, trust posture, and the current boundary tuple before settling.

If the boundary tuple, decision epoch, advice grant, release watch input, surface publication, runtime bundle, or trust posture drifts, the render must settle to `withheld`, `invalidated`, `superseded`, or `quarantined` explicitly.

## Downstream boundary

This task keeps advice render separate from analytics and watch-window logic.
`252` still owns dependency-set and reopen-trigger evaluation.
`253` still owns patient expectation copy and analytics-facing template bodies.
`251` admin-resolution opening consumes the same bounded `249` tuple but does not share self-care render settlement.
