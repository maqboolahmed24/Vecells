# 37 Directory And Update Record Decision Pack

This pack exists to close the three recurrent confusions: discovery is not dispatch, Update Record is not urgent return, and observed outcome evidence is not automatic closure truth.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| DEC_37_001 | Service Search v3 is the primary live discovery candidate. | Use the current Service Search v3 posture as the main live discovery direction while keeping EPS-facing legacy support visible but subordinate. |
| DEC_37_002 | Urgent-care DoS stays watch-only or supporting. | Urgent and emergency care directory context matters, but it is not the baseline patient-visible pharmacy-choice route. |
| DEC_37_003 | Dispatch transport is its own truth domain. | Discovery, transport acceptance, business acknowledgement, and authoritative dispatch proof remain separate facts. |
| DEC_37_004 | Update Record is visibility and outcome observation only. | GP Connect Update Record supports consultation summaries and GP visibility, not urgent return, safeguarding, or referral transport. |
| DEC_37_005 | Manual urgent fallback stays explicit. | A monitored NHSmail or professional phone route remains necessary for urgent return and cannot be hidden behind digital optimism. |
| DEC_37_006 | Outcome observation never auto-closes the request. | Weak matches, duplicates, delayed summaries, and disabled routes keep the PharmacyOutcomeReconciliationGate explicit and closure-blocking. |
| DEC_37_007 | Actual-provider progression remains fail-closed. | Live routes remain blocked until MVP, approver, environment, mutation flag, watch-register clearance, and route-specific assurance evidence all exist. |

## Proof ladders

| Ladder | Applies to | Steps | UI rule |
| --- | --- | --- | --- |
| Discovery and choice proof | service_search_v3_primary_candidate; dos_urgent_rest_watch_or_supporting_route; eps_dos_supporting_route | 1. Resolve one current directory source tuple and normalize it into PharmacyDirectorySnapshot.<br>2. Materialize the matching PharmacyProviderCapabilitySnapshot set and explicit visible-choice frontier.<br>3. Mint PharmacyChoiceProof over the visible-choice-set hash and any warnings or suppressed providers.<br>4. Require a fresh choice or consent renewal if the tuple drifts before dispatch. | Choice explanation may appear only while the current PharmacyChoiceProof and visible-choice-set hash remain valid. |
| Dispatch proof and expiry | dispatch_transport_primary_candidate | 1. Freeze PharmacyReferralPackage on the same selected-provider and consent tuple.<br>2. Compile PharmacyDispatchPlan with one live TransportAssuranceProfile and adapter binding.<br>3. Record PharmacyDispatchAttempt and keep transport acceptance, provider acceptance, and authoritative proof distinct.<br>4. Hold patient or staff calmness until DispatchProofEnvelope and ExternalConfirmationGate both satisfy the route policy. | Transport accepted is pending evidence, not final referred truth. |
| Visibility and reconciliation proof | gp_update_record_assured_path; mesh_or_transport_observation_dependency | 1. Observe the inbound summary or supporting transport event on the active case tuple.<br>2. Separate transport receipt from clinical or operational outcome evidence.<br>3. Run duplicate, replay, weak-match, and wrong-route checks through PharmacyOutcomeReconciliationGate.<br>4. Allow calm closure only after a resolved apply or resolved reopen outcome under the current gate. | Observed summaries and mailbox events may inform status, but they never auto-close the case. |
| Manual fallback and urgent recovery proof | manual_nhsmail_or_phone_fallback; practice_disabled_update_record_fallback | 1. Bind one monitored human-owned route to the active case and route intent.<br>2. Capture explicit acknowledgement or duty handoff evidence.<br>3. Escalate immediately if acknowledgement is overdue, misrouted, or clinically unsafe.<br>4. Keep closure blocked until the manual acknowledgement is reconciled with the active pharmacy lineage. | Manual fallback is continuity protection, not success. |

## Update Record path matrix

| Path | Scope | Direct write? | Urgent use | Closure policy |
| --- | --- | --- | --- | --- |
| GP Connect Update Record / assured path | consultation summary and GP visibility only | no | no | never auto-close from transport or weak match |
| MESH or transport / observation dependency | delivery or receipt evidence only | no | no | cannot close or reassure by itself |
| Practice-disabled Update Record / manual fallback | manual GP visibility when Update Record is disabled or unavailable | no | no | no auto-close and no calmness from manual visibility alone |
| Manual NHSmail or phone / urgent fallback | urgent return or professional safety-net contact | no | yes_manual_only | urgent return evidence blocks closure until acknowledged and reconciled |

## Route summary

| Route | Purpose | Patient choice | Update Record scope | Closure blocker |
| --- | --- | --- | --- | --- |
| Service Search v3 / primary candidate | strategic_directory_and_choice | yes_primary_when_choice_proof_current | No Update Record semantics. | Directory results cannot resolve or close the request lineage and cannot imply that a referral was sent. |
| DoS UEC REST / watch or supporting route | urgent_and_emergency_directory_watch | no_not_primary_choice_route | No Update Record semantics. | Urgent directory awareness cannot settle the pharmacy case or justify calm copy. |
| EPS DoS / supporting legacy route | legacy_supporting_directory | supporting_only_never_hidden_primary | No Update Record semantics. | Legacy directory hints never close the case and may not justify quiet success. |
| Referral dispatch / primary candidate | referral_dispatch_transport | no_after_choice_locked | No Update Record semantics. | Transport acceptance or mailbox pickup cannot calm the patient or close the pharmacy lineage. |
| GP Connect Update Record / assured path | assured_gp_visibility_and_outcome_observation | no_visibility_only | Consultation summary and GP visibility only; never urgent return, safeguarding, or generic referral transport. | Observed summaries or transport receipts do not auto-close the request; only explicit reconciliation resolution may unblock closure. |
| MESH or transport / observation dependency | supporting_transport_and_observation_dependency | no | Supporting transport dependency only. | Transport dependency signals cannot close the case or downgrade a weak match into resolved truth. |
| Manual NHSmail or phone / urgent fallback | urgent_return_manual_safety_net | no | Not applicable and explicitly separate from Update Record. | Urgent return evidence reopens or blocks closure until acknowledged and clinically reconciled. |
| Practice-disabled Update Record / manual fallback | visibility_recovery_when_update_record_disabled | no | Explicit alternative when Update Record is disabled or unsupported. | Manual visibility proof cannot auto-close the case and cannot turn a weak outcome into calm success. |
