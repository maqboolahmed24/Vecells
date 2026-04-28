        # 32 Local Telephony Lab Spec

        ## Mission

        Create the telephony account-and-number provisioning pack with a high-fidelity local telephony lab and a gated real provider-later workspace, number, webhook, and recording strategy that preserves urgent-live preemption, evidence readiness, and SMS continuation law.

        ## Summary

        - Visual mode: `Voice_Fabric_Lab`
        - Number inventory rows: `10`
        - Webhook rows: `10`
        - Seeded calls: `6`
        - Current real-provider posture: `blocked`

        ## Section A — `Mock_now_execution`

        The local telephony twin is made of two coordinated artefacts:

        - `services/mock-telephony-carrier` exposes the carrier-like API, event disorder, signature checks, number assignment, and replay-safe call progression.
        - `apps/mock-telephony-lab` exposes the premium `Voice_Fabric_Lab` operator surface for number inventory, IVR flow rehearsal, recording posture, continuation, and live-gate review.

        The mock lane preserves the blueprint's non-negotiable telephony truths:

        - urgent-live preemption opens before routine promotion when the menu path or live signal demands it
        - recording availability is weaker than evidence readiness
        - transcript output is derivative, not source truth
        - SMS continuation may open a bounded grant, but never routine submission on its own
        - webhook transport success is never authoritative request or callback truth

        The lab uses a deliberately non-routable namespace, `MOCK:+44-VC-XXXX`, so number handling remains realistic without implying live PSTN reachability.

        ### Mock scenario matrix

        | scenario_id | label | terminal_state | urgent_state | recording_state | continuation_state |
| --- | --- | --- | --- | --- | --- |
| inbound_standard_continuation | Inbound call with continuation eligibility | continuation_sent | routine_review | available | eligible_then_sent |
| urgent_live_preemption | Urgent live preemption | closed | urgent_live_required | available | blocked |
| recording_missing_manual_review | Recording missing, manual review only | manual_audio_review_required | routine_review | missing | blocked |
| webhook_signature_retry | Webhook signature retry | webhook_retry_pending | routine_review | available | blocked |
| outbound_callback_settled | Outbound callback settled | closed | routine_review | verified | not_needed |
| provider_like_vonage_disorder | Provider-like disorder with Vonage fallback | evidence_pending | routine_review | available | under_review |

        ### Voice_Fabric_Lab surface

        The lab UI follows the required shell:

        - sticky `72px` posture banner
        - left number rail at `280px`
        - center flow and event workspace
        - right inspector at `360px`
        - lower strip showing `inbound_call -> ivr -> verification -> recording -> transcript_hook -> continuation_or_triage`

        ## Section B — `Actual_provider_strategy_later`

        The live path stays fail-closed. Real telephony account, workspace, or number mutation is blocked until:

        - one shortlisted vendor from task `031` is explicitly selected
        - named approver, target environment, callback base URL, number profile, recording policy, and spend cap are present
        - webhook security and replay posture are approved
        - `ALLOW_REAL_PROVIDER_MUTATION=true` and `ALLOW_SPEND=true` are set
        - the withheld Phase 0 external-readiness chain is cleared

        Shortlisted vendors for later execution:

        - `Twilio`
        - `Vonage`

        The later path stays a provider-plan handoff only. Workspace success, purchased numbers, or recording callbacks still do not imply product readiness or routine request truth.
