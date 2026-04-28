# 121 Change Control And Safety Update Workflow

This workflow makes safety upkeep part of normal engineering change control. Every material change either updates the hazard pack or records explicit non-applicability.

## Section A — `Mock_now_execution`

1. Triage the change against the trigger catalog.
2. Update the matching hazard row or append `SAFETY_NON_APPLICABILITY_RECORD_V1`.
3. Refresh the traceability row and affected evidence refs.
4. Run [`validate_dcb0129_seed_pack.py`](../../tools/assurance/validate_dcb0129_seed_pack.py).
5. Require independent review for any high-severity hazard or residual high-risk delta.

## Section B — `Actual_production_strategy_later`

1. Attach live provider, deployment, or release evidence to the same change-control path.
2. Preserve the same close tokens so audit, assurance, and release packs can prove a change did not skip safety review.
3. Keep no-self-approval enforced through the same review-event and path IDs.

## Trigger Catalog

| Trigger | Meaning | Owner |
| --- | --- | --- |
| TRIGGER_RULESET_CHANGE | Clinical ruleset, classification, or threshold change | ROLE_TRIAGE_RULESET_OWNER |
| TRIGGER_IDENTITY_PROVIDER_CHANGE | Identity provider, callback, secure-link, or binding flow change | ROLE_IDENTITY_DOMAIN_LEAD |
| TRIGGER_TELEPHONY_PATH_CHANGE | Telephony capture, readiness, or continuation path change | ROLE_IDENTITY_DOMAIN_LEAD |
| TRIGGER_BOOKING_POLICY_CHANGE | Booking, reservation, or confirmation logic change | ROLE_BOOKING_DOMAIN_LEAD |
| TRIGGER_NETWORK_POLICY_CHANGE | Network alternative ranking, expiry, or hub visibility change | ROLE_NETWORK_COORDINATION_LEAD |
| TRIGGER_PHARMACY_FLOW_CHANGE | Pharmacy consent, dispatch, or outcome reconciliation change | ROLE_PHARMACY_DOMAIN_LEAD |
| TRIGGER_SUPPORT_REPLAY_CHANGE | Support replay, resend, or contact-route repair change | ROLE_SUPPORT_WORKFLOW_LEAD |
| TRIGGER_RELEASE_PUBLICATION_DRIFT | Runtime publication, release parity, or environment drift | ROLE_RELEASE_MANAGER |
| TRIGGER_ASSISTIVE_POLICY_CHANGE | Assistive visible-slice, trust, approval, or rollout policy change | ROLE_ASSISTIVE_SAFETY_COORDINATOR |
| TRIGGER_INCIDENT_OR_NEAR_MISS | Clinical safety incident, near miss, or audit finding mapped to an existing hazard family | ROLE_MANUFACTURER_CSO |

## Change-Control Paths

| Path | Title | Triggers | Required Close Tokens | Alternative Close Tokens |
| --- | --- | --- | --- | --- |
| PATH_RULESET_CHANGE | Clinical ruleset and safety-threshold change | TRIGGER_RULESET_CHANGE | hazard_register_updated<br>evidence_refs_refreshed<br>safety_case_delta_recorded | non_applicability_recorded |
| PATH_IDENTITY_AND_TELEPHONY_CHANGE | Identity, callback, secure-link, or telephony safety change | TRIGGER_IDENTITY_PROVIDER_CHANGE<br>TRIGGER_TELEPHONY_PATH_CHANGE | hazard_register_updated<br>evidence_refs_refreshed | non_applicability_recorded |
| PATH_BOOKING_AND_NETWORK_CHANGE | Booking, reservation, network alternative, or hub visibility change | TRIGGER_BOOKING_POLICY_CHANGE<br>TRIGGER_NETWORK_POLICY_CHANGE | hazard_register_updated<br>evidence_refs_refreshed<br>safety_case_delta_recorded | non_applicability_recorded |
| PATH_PHARMACY_CHANGE | Pharmacy consent, dispatch, reconciliation, or bounce-back change | TRIGGER_PHARMACY_FLOW_CHANGE | hazard_register_updated<br>evidence_refs_refreshed<br>safety_case_delta_recorded | non_applicability_recorded |
| PATH_SUPPORT_AND_RELEASE_DRIFT | Support replay, resend, or release/publication drift change | TRIGGER_SUPPORT_REPLAY_CHANGE<br>TRIGGER_RELEASE_PUBLICATION_DRIFT | hazard_register_updated<br>evidence_refs_refreshed | non_applicability_recorded |
| PATH_ASSISTIVE_RELEASE_CHANGE | Assistive visible-slice or approval-graph change | TRIGGER_ASSISTIVE_POLICY_CHANGE | hazard_register_updated<br>evidence_refs_refreshed<br>safety_case_delta_recorded | non_applicability_recorded |

## Non-Negotiable Approval Rules

- High-severity hazards may not close without `ROLE_INDEPENDENT_CLINICAL_SAFETY_REVIEWER`.
- The proposer may not approve their own high-severity safety change.
- A change path may not close without `hazard_register_updated` or `non_applicability_recorded`.
