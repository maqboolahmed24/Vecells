# 223 Patient and Support Integration Matrix

## Core parity checks

| Scenario | Patient route | Support route | Expected cause class | Expected recovery class | Expected status |
| --- | --- | --- | --- | --- | --- |
| Signed in, live lineage | `/requests/request_211_a` | `/ops/support/tickets/support_ticket_218_delivery_failure` | `session_current` | `none` | `Reply needed` |
| Repair required | `/requests/request_211_a/callback/at-risk` | `/ops/support/tickets/support_ticket_218_delivery_failure/actions/controlled_resend?state=active&anchor=repair_preview_219` | `repair_required` | `same_shell_repair` | `Repair required` |
| Step-up restricted record | `/records/results/result_213_step_up` | `/ops/support/tickets/support_ticket_218_delivery_failure/history?state=active&disclosure=expanded` | `step_up_required` | `step_up` | `Step-up required` |
| Signed out recovery | `/auth/signed-out` | n/a | `session_recovery_required` | `same_shell_recovery` | `Signed out` |
| Identity hold | `/portal/claim/identity-hold` | n/a | `identity_hold` | `read_only` | `Identity hold` |
| Read-only recovery | `/portal/claim/read-only` | `/ops/support/replay/support_replay_session_218_delivery_failure?state=blocked&fallback=replay_restore_failure` | `read_only_recovery` | `read_only` | `Read-only recovery` |

## Contact domain proof

Every route class above must render:

- `Auth claim`
- `Identity evidence`
- `Demographic evidence`
- `Patient preference`
- `Support reachability`

The Playwright suite asserts these as separate labels. It does not accept merged phrasing.

## Accessibility proof

The suite also captures:

- ARIA snapshots for patient request, support ticket, and the integration lab
- keyboard traversal through patient and support navigation
- reduced-motion parity on support shell
- contrast checks on the Phase 2 truth panels

## Screenshot pack

- `223-patient-request-parity.png`
- `223-patient-repair-parity.png`
- `223-patient-record-step-up.png`
- `223-auth-signed-out-parity.png`
- `223-claim-identity-hold-parity.png`
- `223-support-ticket-parity.png`
- `223-support-history-parity.png`
- `223-support-replay-read-only.png`
- `223-integration-lab.png`
- `223-integration-lab-mobile.png`
- `223-reduced-motion-parity.png`
