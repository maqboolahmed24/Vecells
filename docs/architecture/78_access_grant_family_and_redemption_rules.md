# 78 Access Grant Family And Redemption Rules

        This document freezes the grant-family registry and the redemption law that `AccessGrantService`
        enforces before any patient-facing continuation or action path may proceed.

        ## Use-Case Matrix

        - `draft_resume` -> `draft_resume_minimal` / `envelope_resume` / `rf_intake_self_service` / `issued`
- `request_claim` -> `claim_step_up` / `claim` / `rf_patient_secure_link_recovery` / `issued`
- `secure_continuation` -> `continuation_seeded_verified` / `secure_resume` / `rf_patient_secure_link_recovery` / `issued`
- `callback_reply` -> `transaction_action_minimal` / `callback_response` / `rf_patient_messages` / `issued`
- `message_reply` -> `transaction_action_minimal` / `message_reply` / `rf_patient_messages` / `issued`
- `booking_manage` -> `transaction_action_minimal` / `appointment_manage_entry` / `rf_patient_appointments` / `issued`
- `waitlist_action` -> `transaction_action_minimal` / `waitlist_offer` / `rf_patient_appointments` / `issued`
- `network_alternative_choice` -> `transaction_action_minimal` / `alternative_offer` / `rf_patient_appointments` / `issued`
- `pharmacy_choice` -> `transaction_action_minimal` / `pharmacy_status_entry` / `rf_patient_requests` / `issued`
- `support_reissue` -> `support_recovery_minimal` / `secure_resume` / `rf_patient_secure_link_recovery` / `issued`
- `recover_only` -> `no_grant` / `no_action` / `rf_patient_secure_link_recovery` / `recover_only`

        ## Non-Negotiable Redemption Rules

        - `AccessGrantService` is the only authority allowed to issue, redeem, replace, rotate, revoke, or supersede patient-facing grants.
        - Every redeemable grant carries one immutable `AccessGrantScopeEnvelope`.
        - Redemption never widens route family, embedded capability, or PHI exposure beyond the frozen envelope.
        - Exact replay returns the current settlement and never creates a second side effect.
        - Anonymous or mismatched sessions are never upgraded in place; `SessionGovernor` decides whether a fresh or rotated posture is required.
        - Auth success is not permission; `AuthBridge` is bounded to proof and return-intent orchestration, while the grant service keeps route and scope authority.
        - Route-intent drift, lineage-fence drift, wrong-patient repair, logout, and support-driven reissue all close older links through authoritative supersession chains.
        - `recover_only` and `manual_only` are first-class outcomes and may not render a redeemable token.

        ## Token And Replay Law

        - Storage remains hashed; raw opaque tokens exist only at first materialization.
        - Key-version support is explicit through `token_key_local_v1` with room for later rotation.
        - Replay-safe families either return the prior settlement or reject drifted / stale tuples with a recover-only posture.
        - Audit joins remain intact across issue, redeem, replace, revoke, and supersede paths.
