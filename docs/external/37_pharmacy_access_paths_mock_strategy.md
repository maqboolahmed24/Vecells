# 37 Pharmacy Access Paths Mock Strategy

Seq_037 creates the current pharmacy access-path twin without pretending that live directory onboarding, dispatch transport, or Update Record reach are already green.

## Mock_now_execution

- current route rows: `8`
- current update-record rows: `4`
- actual-provider-later routes still blocked: `7` gates blocked
- the twin keeps discovery, patient choice, dispatch proof, visibility observation, urgent return, and manual fallback separate
- Update Record remains visibility-only and may not stand in for urgent return or dispatch

## Executable mock matrix

| Route | Current execution | Purpose | Consent dependency | Fallback |
| --- | --- | --- | --- | --- |
| Service Search v3 / primary candidate | simulated_now | strategic_directory_and_choice | Choice list may be shown without consent, but provider binding, reassurance, and dispatch require an active PharmacyConsentCheckpoint on the same visible-choice tuple. | Same-shell directory regeneration, warned choice, or clinician/manual fallback when no safe provider remains. |
| DoS UEC REST / watch or supporting route | watched_and_stubbed | urgent_and_emergency_directory_watch | Watch lookups do not satisfy pharmacy-choice consent and may not authorise dispatch or reassurance. | Escalate to the monitored manual urgent-return route if urgent professional contact is required. |
| EPS DoS / supporting legacy route | watched_and_stubbed | legacy_supporting_directory | No standalone consent authority. Supporting data may inform choice only after policy acceptance and tuple normalization. | Drop back to Service Search v3 or explicit same-shell re-selection if the supporting tuple drifts. |
| Referral dispatch / primary candidate | simulated_now | referral_dispatch_transport | Requires the current PharmacyConsentCheckpoint, selected provider, pathway, package fingerprint, and selectionBindingHash. | Controlled redispatch under a fresh tuple, or manual-assisted dispatch only where policy permits. |
| GP Connect Update Record / assured path | simulated_now_no_live_write | assured_gp_visibility_and_outcome_observation | Cannot replace dispatch consent. Outcome observation must still bind the selected provider, pathway, scope hash, and active case tuple. | Use practice-disabled manual visibility fallback and keep the reconciliation gate open. |
| MESH or transport / observation dependency | simulated_now | supporting_transport_and_observation_dependency | Follows the existing dispatch or observation tuple; it cannot establish consent, provider choice, or calmness. | Escalate to manual urgent or manual visibility fallbacks if mailbox or secure transport becomes unreliable. |
| Manual NHSmail or phone / urgent fallback | runbook_now | urgent_return_manual_safety_net | Urgent safety handling does not rely on patient-choice consent, but it must still bind the active PharmacyCase and duty route. | Escalate immediately to duty task, supervisor, or practice-contact recovery. |
| Practice-disabled Update Record / manual fallback | runbook_now | visibility_recovery_when_update_record_disabled | The active consent, provider, and outcome tuple still govern; the fallback route does not rewrite choice or dispatch truth. | Keep the same shell in recovery and escalate through staff operations if practice visibility is still missing. |

## Guardrails

- Patient choice depends on PharmacyDirectorySnapshot, PharmacyProviderCapabilitySnapshot, and PharmacyChoiceProof together.
- Dispatch calmness depends on PharmacyDispatchPlan, PharmacyDispatchAttempt, DispatchProofEnvelope, and ExternalConfirmationGate together.
- Outcome visibility depends on reconciliation and may not auto-close the case from weak, delayed, or duplicate evidence.
- Manual NHSmail or phone fallback stays first-class and visible instead of hidden behind digital optimism.
