# 125 Independent Review And No Self Approval Rules

This document defines the actor-separation rules that the machine-readable signoff graph enforces.

## Section A — `Mock_now_execution`

- Material changes always require approver separation.
- High-impact change classes always require an independent safety reviewer.
- Privacy/security approval remains distinct from the proposer for identity, communications, and assistive changes.

## Section B — `Actual_production_strategy_later`

- Named rosters should replace placeholders, but the same rule IDs should continue to gate approval.
- If later live onboarding introduces new approver roles, they must be added without weakening these rule families.

## Actor Separation Rules

| Rule id | Applies to | Rule summary |
| --- | --- | --- |
| NSA_125_MATERIAL_PROPOSER_CANNOT_APPROVE | material_only | For material change classes, the proposer may not occupy any approving role in the same signoff path. |
| NSA_125_CLINICAL_AND_INDEPENDENT_REVIEW_MUST_BE_DISTINCT | independent_review_required | The clinical safety lead and the independent safety reviewer must be different actors on the same change. |
| NSA_125_RELEASE_APPROVER_CANNOT_SOLE_APPROVE_OWN_CHANGE | material_only | The release approver may not be the only approving actor when they also proposed or implemented the change. |
| NSA_125_PRIVACY_OR_SECURITY_APPROVER_MUST_REMAIN_DISTINCT_FOR_IDENTITY_OR_ASSISTIVE_CHANGES | cc_identity_session_authorization_behavior|cc_communications_reachability_behavior|cc_assistive_capability_change | Identity, session, communications, and assistive changes that trigger privacy or security review must use a distinct privacy or security approver, not the proposer. |
