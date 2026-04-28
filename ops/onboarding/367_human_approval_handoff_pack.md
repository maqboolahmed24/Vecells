# 367 Human Approval Handoff Pack

This pack is used when automation reaches the lawful boundary and a named operator must review or submit the request outside the repository-owned path.

It is the authoritative operator handoff packet for every 367 row that cannot lawfully complete inside unattended automation.

## Handoff rules

- Every handoff must identify the named operator.
- Every handoff must identify the exact environment tuple.
- Every handoff must keep the sandbox/live tuple explicit.
- Every handoff must distinguish observation readiness from transport readiness.
- Every handoff must record manual approval and any expiry or renewal date.

## Required handoff fields

| Field | Required content |
| --- | --- |
| Request ID | Exact manifest request ID |
| Environment tuple | One of the four 367 environment tuples |
| Channel type | Update Record observation, referral dispatch, or monitored mailbox urgent return |
| Manual approval owner | Named operator and external approver if applicable |
| Request pack hash | Immutable pack hash from the manifest |
| Evidence refs | Draft pack, ticket, blocker ledger, or rehearsal evidence |
| Expiry | Date or `not yet assigned` |
| Outcome expectation | `drafted`, `submitted`, `awaiting_response`, `approved`, `blocked`, or `expired` |

## Manual approval template

### Summary

- Request ID:
- Environment:
- Manual approval owner:
- External portal or mailbox owner:
- Current request state:
- Expiry or review date:

### Boundary confirmation

- Update Record is not being used for urgent return.
- Any monitored mailbox remains a monitored mailbox and not an outcome-truth channel.
- No sandbox/live tuple mixing is present.
- No raw credentials or `secret://` locators are attached.

### Operator decision

- Submit now
- Hold at manual stop
- Mark blocked
- Mark awaiting response
- Renew or replace due to expiry

## Request-specific notes

### `update_record_367_integration_pairing`

- manual stop before submit
- confirm assured supplier pairing
- confirm observation-only wording

### `transport_367_bars_deployment_preflight`

- manual stop before submit
- confirm deployment_candidate tuple
- confirm BaRS preflight only, not live widening

### `transport_367_supplier_integration`

- external supplier onboarding remains mandatory
- keep blocker evidence explicit

### `transport_367_mesh_training_mailbox`

- training rehearsal path only
- workflow and mailbox details must be reviewed

### `transport_367_nhsmail_deployment_safetynet`

- monitored mailbox only
- urgent return only
- never restated as Update Record readiness

## Evidence bundle attachments

- operator bundle JSON from `367_prepare_operator_submission_bundle.ts`
- browser screenshot
- browser trace
- readiness summary JSON
- any external ticket or mailbox confirmation reference
