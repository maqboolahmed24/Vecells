# 223 Identity, Status, and Masking Merge Rules

## Governing rules

`223` does not invent new trust semantics. It republishes the frozen Phase 2 truth through one shared kernel that patient and support routes both consume.

## Mandatory cause classes

Every merged route must use one of these cause classes:

- `session_current`
- `session_recovery_required`
- `identity_hold`
- `wrong_patient_freeze`
- `repair_required`
- `step_up_required`
- `read_only_recovery`

No patient or support surface may emit route-local alternatives for the same condition.

## Contact-domain split

The following fields must remain distinct in UI and machine-readable artifacts:

1. `Auth claim`
2. `Identity evidence`
3. `Demographic evidence`
4. `Patient preference`
5. `Support reachability`

Security reason:

- auth claim proves current session posture
- identity evidence proves same-patient linkage
- demographic evidence is masked PDS or equivalent identity-adjacent proof
- patient preference expresses opted channels
- support reachability expresses current deliverability risk

These domains must never collapse into a single `contact` label or a combined field.

## Masking and disclosure rules

- patient routes default to `patient_safe_summary` or `same_patient_detail`
- support routes default to `support_summary` and only widen through governed disclosure
- identity hold, wrong-patient freeze, and replay fallback must preserve chronology while narrowing detail
- support replay and patient read-only routes may differ visually, but they must point to the same cause class when the governing truth is the same

## Read-only and recovery parity

`read_only_recovery` is the authoritative class for:

- `/portal/claim/read-only`
- `/ops/support/replay/:supportReplaySessionId?state=blocked&fallback=replay_restore_failure`

Both remain summary-first, preserve the last safe artifact, and expose the shortest lawful reacquire path.

## Route-level restrictions

- `/auth/*` routes use `session_recovery_required`
- `/portal/claim/identity-hold` uses `identity_hold`
- `/portal/claim/wrong-patient-freeze` uses `wrong_patient_freeze`
- `/requests/:requestId/callback/at-risk`, `/contact-repair/*`, and `/messages/*/repair` use `repair_required`
- `/records/results/result_213_step_up` uses `step_up_required`
- `/ops/support/replay/*` uses `read_only_recovery`

## Security checks enforced by validation

The validator fails when:

- patient and support surfaces disagree on `request_211_a` vs `support_ticket_218_delivery_failure`
- contact domains collapse into one meaning
- route-level downgrade logic drifts from the shared cause ladder
- patient recovery and support replay imply contradictory cause classes
- the lab shows meaning that the machine-readable parity bundle does not carry
