# 350 Transport Retry Expiry And Manual Assistance Rules

## Transport families

Implemented as first-class governed modes:

- `bars_fhir`
- `supplier_interop`
- `nhsmail_shared_mailbox`
- `mesh`
- `manual_assisted_dispatch`

Each mode is bound to one frozen `TransportAssuranceProfile` from `343`.

## Retry rules

- submit replay:
  identical submit commands replay and do not issue a second provider-side send
- resend:
  an explicit resend stays on the same `PharmacyDispatchAttempt` family when the plan hash, package hash, and route tuple hash still match
- tuple drift:
  if the governing tuple changed, a fresh attempt is opened and the previous attempt is superseded

## Proof deadline and expiry

- deadline comes from `TransportAssuranceProfile.proofDeadlinePolicy`
- if the deadline passes without satisfying authoritative proof:
  - proof becomes `expired`
  - risk becomes `likely_failed`
  - settlement widens to `reconciliation_required`
  - truth never widens to calm referral confirmation

## Contradiction

- contradictory evidence or threshold breach sets:
  - `proofState = disputed`
  - `riskState = disputed`
  - `settlement.result = reconciliation_required`
- contradiction is stronger than transport acceptance or provider acceptance

## Manual assisted dispatch

- `manual_assisted_dispatch` and `nhsmail_shared_mailbox` may require operator and second-review posture
- `recordManualDispatchAssistance(...)` persists operator evidence
- a second-review attestation is treated as authoritative evidence for the manual profile
- rejected manual attestation is recorded as contradictory evidence and routes the case to reconciliation posture

## Stale choice or stale consent

- dispatch re-checks the current consent checkpoint immediately before send
- if the checkpoint is no longer `satisfied`, the service fails closed with `STALE_CHOICE_OR_CONSENT`
- when possible, the pharmacy case is widened back to recovery posture rather than claiming a live referral
