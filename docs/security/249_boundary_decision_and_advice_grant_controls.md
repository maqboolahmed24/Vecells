# 249 Boundary Decision And Advice Grant Controls

## Control Statements

A surviving link or cached payload is not proof of a live `AdviceEligibilityGrant`.

Decision epoch drift, evidence drift, subject drift, session drift, publication drift, and trust drift all fail closed.

`decisionState = self_care` is legal only while `clinicalMeaningState = informational_only`, `operationalFollowUpScope = self_serve_guidance`, and `adminMutationAuthorityState = none`.

`decisionState = admin_resolution` is legal only while `clinicalMeaningState = bounded_admin_only`, `operationalFollowUpScope = bounded_admin_resolution`, and admin mutation authority stays bounded.

Reopen or safety drift must supersede the prior boundary.

## Consequence Separation

Grant issuance is narrower than route availability. The grant does not widen endpoint availability, does not count as patient-visible advice truth, and does not bypass approval, trust, or publication controls.

## Failure Posture

When the tuple is stale, the system returns governed recovery instead of continuing consequence on the stale tuple. The kernel records explicit supersession or transition records rather than relying on local booleans.
