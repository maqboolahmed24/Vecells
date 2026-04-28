# 311 Phase 5 Org Boundary And Visibility Rules

This document closes the Phase 5 gap where cross-organisation access could otherwise degrade into a role check plus frontend state.

## Identity and acting-context stack

| Contract | Key fields | Security role |
| --- | --- | --- |
| `StaffIdentityContext` | `authProvider = cis2`, `sessionAssurance`, `identityState`, organisation grants | Authenticates the person and their organisation affiliations. |
| `ActingContext` | `purposeOfUse`, `audienceTierRef`, `scopeTupleHash`, `breakGlassState`, `contextState` | Turns identity into a current, bounded, minimum-necessary action scope. |
| `CrossOrganisationVisibilityEnvelope` | `sourceOrganisationRef`, `targetOrganisationRef`, `visibleFieldRefs[]`, `envelopeState` | Materializes exactly which fields may be seen across org boundaries. |

Rules:

1. Raw RBAC claims are necessary but not sufficient.
2. Every write proves one exact `ActingContext.scopeTupleHash`.
3. Cross-org access proves one current `CrossOrganisationVisibilityEnvelope`.
4. Break-glass remains explicit, reason-coded, and auditable.

## Visibility tiers

| Tier | Visible | Never visible | Drift response |
| --- | --- | --- | --- |
| Origin practice visibility | requestLineageRef, macro_booking_status, fallback_reason_code, patient_communication_state, latest_continuity_delta, ack_generation_state | hub_internal_free_text, cross_site_capacity_detail, raw_native_booking_proof | Demote to read-only or recovery posture when organisation, purpose-of-use, or envelope drift invalidates the current scope. |
| Hub desk visibility | clinical_routing_summary, operational_timing_needs, travel_access_constraints, governed_coordination_evidence, requestLineageRef, selected_candidate_ref | broad_narrative_without_promotion, attachment_payload_without_break_glass | Freeze writable controls in place and require a same-shell re-read under the new acting context. |
| Servicing site visibility | encounter_delivery_brief, site_local_capacity, confirmed_slot_summary, manage_capability_state | origin_practice_triage_notes, callback_rationale, alternative_options_other_sites | Keep the case anchor visible but downgrade to read-only delivery posture until the servicing-site envelope is regenerated. |

## Drift handling

| Drift or denial case | Required response |
| --- | --- |
| Organisation switch | Revoke writable posture and require same-shell re-read under the new context. |
| Stale ownership fence | Reject mutation, create or reuse stale-owner recovery, keep the case visible. |
| Visibility envelope stale | Demote to read-only or recovery posture; do not reinterpret scope from UI state. |
| Purpose-of-use drift | Block cross-org actions until the new purpose is explicitly materialized and audited. |
| Break-glass without reason | Deny elevated access and require structured reason capture before retry. |

## Audit minimums

Every hub mutation audit record must capture:

1. who acted
2. from which organisation or site
3. against which `HubCoordinationCase`
4. which purpose of use and audience tier were active
5. whether break-glass was active
6. whether the command was rejected because lease, organisation, purpose-of-use, or visibility posture drifted
