# 121 DCB0129 Hazard Log Structure

This document defines the seeded hazard-log schema used by [`dcb0129_hazard_register.json`](../../data/assurance/dcb0129_hazard_register.json) and [`dcb0129_hazard_register.csv`](../../data/assurance/dcb0129_hazard_register.csv).

## Section A — `Mock_now_execution`

- Keep one canonical hazard ID per hazard statement.
- Preserve explicit `source_blueprint_refs[]`, control refs, evidence refs, owner roles, review dates, and change-trigger refs.
- Record known future assistive hazards as `future_detail_pending` instead of dropping them from the register.

## Section B — `Actual_production_strategy_later`

- Add live evidence and residual-risk decisions by extending the same rows.
- Do not fork separate spreadsheets for provider onboarding, release safety, or operational exceptions.

## Hazard Taxonomy

| Family | Title | Summary |
| --- | --- | --- |
| identity_authorization | Identity and authorization hazards | Wrong-subject binding, callback or secure-link confusion, and access-scope drift that can expose or act on the wrong record. |
| safety_screening_triage | Safety-screening and triage hazards | Urgent-diversion miss, delayed re-safety, or fail-open classification when clinically meaningful evidence arrives. |
| workflow_concurrency_replay | Workflow, concurrency, and replay hazards | Silent merge, wrong-lineage attach, stale decision epoch, or duplicate/replay collisions that produce unsafe actions. |
| booking_network_pharmacy | Booking, network, and pharmacy hazards | Unsafe booking reassurance, wrong-site offers, missing fallback, consent drift, weak dispatch proof, or unsafe pharmacy close. |
| visibility_runtime_publication | Visibility, runtime, and publication hazards | Stale runtime publication, drifted writable posture, or false calmness caused by publication/runtime mismatch. |
| communications_reachability | Communications and reachability hazards | Promised callback or more-info paths failing after patient expectation has been set, or wrong-subject resend/repair actions. |
| assistive_change_control | Future assistive and change-control hazards | Deferred-but-known hazards where assistive suggestions, rollout, or approval posture could bypass human checkpoint and independent review. |

## Hazard Register Fields

| Field | Meaning |
| --- | --- |
| hazard_id | hazard id |
| hazard_title | hazard title |
| hazard_family | hazard family |
| phase_scope | phase scope |
| source_blueprint_refs | source blueprint refs |
| hazard_description | hazard description |
| trigger_condition | trigger condition |
| failure_mode | failure mode |
| clinical_harm_path | clinical harm path |
| affected_actor_types | affected actor types |
| affected_channels | affected channels |
| affected_objects | affected objects |
| causal_controls_existing | causal controls existing |
| causal_controls_required | causal controls required |
| verification_evidence_refs | verification evidence refs |
| residual_risk_statement | residual risk statement |
| severity_band | severity band |
| likelihood_band | likelihood band |
| initial_risk_band | initial risk band |
| residual_risk_band | residual risk band |
| review_owner_role | review owner role |
| independent_reviewer_role | independent reviewer role |
| status | status |
| last_reviewed_at | last reviewed at |
| next_review_due_at | next review due at |
| change_trigger_refs | change trigger refs |
| notes | notes |
| standards_version | standards version |
| review_note | review note |
| canonical_invariant_refs | canonical invariant refs |
| platform_service_refs | platform service refs |
| route_runtime_publication_control_refs | route runtime publication control refs |
| operational_procedure_refs | operational procedure refs |

## Seeded Hazards

| Hazard | Title | Family | Severity | Status |
| --- | --- | --- | --- | --- |
| HZ-121-001 | Wrong-patient identity binding or correction failure allows care actions on the wrong subject. | identity_authorization | high | seeded_open |
| HZ-121-002 | Urgent-diversion miss or delayed safety preemption after clinically meaningful evidence changes. | safety_screening_triage | high | seeded_open |
| HZ-121-003 | Duplicate silent merge or wrong-lineage attach hides distinct clinical work. | workflow_concurrency_replay | high | seeded_open |
| HZ-121-004 | Stale writable UI or runtime/publication drift enables an unsafe action from stale truth. | visibility_runtime_publication | high | seeded_open |
| HZ-121-005 | More-info or callback delay after patient expectation has been set leaves unsafe unanswered need. | communications_reachability | high | seeded_open |
| HZ-121-006 | Telephony or continuation route fails after follow-up is promised or before safety-usable evidence is ready. | communications_reachability | high | seeded_open |
| HZ-121-007 | Local booking confirmation ambiguity or wrong booking outcome is shown as confirmed. | booking_network_pharmacy | high | seeded_open |
| HZ-121-008 | Network alternative expiry, wrong-site offer, or fallback failure leads to unsafe booking decision. | booking_network_pharmacy | high | seeded_open |
| HZ-121-009 | Hub wrong-practice visibility or acknowledgement debt exposes or delays the wrong case. | booking_network_pharmacy | high | seeded_open |
| HZ-121-010 | Pharmacy consent drift or stale checkpoint is treated as still valid for dispatch. | booking_network_pharmacy | high | seeded_open |
| HZ-121-011 | Pharmacy dispatch proof ambiguity, weak-match outcome, or unsafe close hides unresolved care. | booking_network_pharmacy | high | seeded_open |
| HZ-121-012 | Support replay, contact-route repair, or resend action exposes the wrong subject or stale truth. | communications_reachability | high | seeded_open |
| HZ-121-013 | Assistive output or assistive release change bypasses independent safety signoff or leaves stale controls armed. | assistive_change_control | high | future_detail_pending |
