# Algorithm Alignment Notes For Track 380

## Canonical Grant Path

`issueExternalEntryGrant` calls `AccessGrantService.issueGrant`. `resolveExternalEntry` calls `AccessGrantService.redeemGrant`. There is no second token store and no link resolver bypass for site links, secure links, email, SMS, or return-to-journey entries.

## Scope Tuple

The immutable scope includes grant family, action scope, route family, governing object, object version, session epoch, subject binding version, lineage fence, release approval freeze, manifest version, channel posture, embedded posture, audience scope, visibility scope, and route-intent binding ref.

## Return Intent Fence

Resolution blocks return-to-journey continuity when any of these drift:

- `sessionEpochRef`
- `subjectBindingVersionRef`
- `manifestVersionRef`
- `routeFamilyRef`

The resolver downgrades these cases to bounded recovery before full route detail is released.

## Subject Binding Fence

Full detail requires an active session, matching subject when the grant is subject-bound, matching session epoch, matching binding version, and a verification level that meets the route requirement.

## Draft Resume Fence

Draft resume is allowed only while the same `SubmissionIngressRecord` remains current. If a `SubmissionPromotionRecord` exists, the route instruction targets the promoted request shell and `includePhi` remains false for the recovery response.

## Placeholder Contract

Blocked, inventory-only, replay, expiry, supersession, drift, and verification-required states return route-specific summary tier and placeholder contract refs. They do not fall back to a generic home page.
