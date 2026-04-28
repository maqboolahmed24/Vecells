# 206 Wrong-Patient Freeze And Release Matrix

This matrix is keyed by triggering signal, active binding version, hold state, downstream disposition state, allowed summary tier, release prerequisites, and final return target.

| Case                                           | Triggering Signal                                     | Hold State             | Allowed Summary Tier                | Suppressed Actions                                | Release Prerequisites                                             | Expected Result                                   |
| ---------------------------------------------- | ----------------------------------------------------- | ---------------------- | ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `WPR206_SUBJECT_CONFLICT_BEFORE_DETAIL`        | Auth subject differs before request detail renders    | `identity_hold_active` | neutral request shell summary       | PHI detail, reply, upload, cancel                 | corrected binding, freeze committed, branch dispositions released | Detail never renders PHI; same-shell hold appears |
| `WPR206_SUBJECT_CONFLICT_AFTER_DETAIL_VISIBLE` | Subject conflict after detail was previously visible  | `identity_hold_active` | last safe non-PHI summary           | cached detail, attachment preview, mutable CTA    | client cache discarded, freeze active, branch review open         | Previously rendered PHI is removed immediately    |
| `WPR206_BINDING_SUPERSESSION_DETAIL_OPEN`      | Binding supersedes while detail is open               | `identity_hold_active` | request lineage summary             | all stale route intents and grants                | current binding version and fresh route intent                    | Detail demotes to read-only hold                  |
| `WPR206_SECURE_LINK_UPLIFT_HOLD`               | Secure-link uplift resolves to wrong subject          | `identity_hold_active` | public-safe summary                 | claim, seeded context, attachment preview         | authority correction and access-grant supersession                | Secure link enters same hold route                |
| `WPR206_SIGNED_IN_PORTAL_HOLD`                 | Signed-in portal detects binding dispute              | `identity_hold_active` | authenticated neutral summary       | status detail, reply, upload, cancellation        | identity repair review and branch settlement                      | Portal and secure-link use same posture           |
| `WPR206_PHONE_ORIGIN_CONVERGENCE_HOLD`         | Phone-origin convergence binds to disputed patient    | `identity_hold_active` | call-origin summary only            | transcript detail, SMS continuation, seeded grant | telephony continuation quarantine and correction                  | Phone provenance does not widen access            |
| `WPR206_BRANCH_COMPENSATION_PENDING`           | External delivery branch still needs compensation     | `identity_hold_active` | neutral summary plus blocked reason | release, resend, message preview                  | compensation reference and branch release                         | Release is blocked                                |
| `WPR206_RELEASE_SETTLEMENT_BINDING_STALE`      | Release helper exists but resulting binding is stale  | `release_blocked`      | read-only summary                   | writable resume, PHI detail, fresh grant          | authoritative resulting binding current                           | Release fails closed                              |
| `WPR206_RESULTING_BINDING_CURRENT_RELEASE`     | Binding authority and branch dispositions are current | `released`             | authenticated detail after rebuild  | stale grants remain suppressed                    | release settlement, branch release, rebuilt projections           | Same shell resumes at selected anchor             |
| `WPR206_STALE_CACHE_REPLAY_PHI_BLOCKED`        | Browser attempts stale PHI replay after hold          | `identity_hold_active` | summary-only                        | cached PHI fragment, stale local action           | cache invalidation and hold projection                            | PHI replay is blocked                             |

## Release Law

Release is permitted only when all of these are true:

- `IdentityRepairFreezeRecord.freezeState = released`
- the latest `IdentityBinding` matches `IdentityRepairReleaseSettlement.resultingIdentityBindingRef`
- every visible branch disposition is `released`, `rebuilt`, `compensated`, `terminal_suppressed`, `manual_review_closed`, or `already_safe`
- a fresh session, grant, or route intent is minted under the current binding version
- stale client cache and previously rendered PHI are discarded or downgraded to summary-only

## Execution Note

Mock-now verification is fixture-backed and Playwright-backed through the `Parity_Repair_Lab`. Live-provider-later support correction flows must reuse this wrong-patient release law. Semantic parity still applies: web, phone, secure-link, and signed-in shell entry may alter provenance copy but not same-shell hold posture, PHI suppression, release prerequisites, or final return semantics.
