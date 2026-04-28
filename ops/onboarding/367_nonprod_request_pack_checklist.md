# 367 Non-Production Request Pack Checklist

Use this checklist before any operator reviews, manual-stop checkpoints, or evidence capture runs.

## Tuple checks

- Confirm the exact environment tuple: `development_local_twin`, `integration_candidate`, `training_candidate`, or `deployment_candidate`.
- Confirm the request belongs to the same tuple across manifest row, bundle, screenshot, and runtime output.
- Confirm no sandbox/live tuple mixing in mailbox, endpoint, or approval notes.

## Request inventory

| Request ID | Family | Environment | State baseline | Automation mode | Approval expectation |
| --- | --- | --- | --- | --- | --- |
| `update_record_367_integration_pairing` | Update Record observation | `integration_candidate` | `drafted` | `manual_stop_before_submit` | Named operator review before any external submission |
| `update_record_367_training_pairing` | Update Record observation | `training_candidate` | `not_requested` | `draft_only` | Draft pack only |
| `update_record_367_deployment_observation` | Update Record observation | `deployment_candidate` | `blocked` | `status_check_only` | Blocker evidence only |
| `transport_367_bars_deployment_preflight` | Referral transport | `deployment_candidate` | `not_requested` | `manual_stop_before_submit` | Preflight only |
| `transport_367_supplier_integration` | Referral transport | `integration_candidate` | `blocked` | `manual_stop_before_submit` | External supplier action required |
| `transport_367_mesh_training_mailbox` | Referral transport | `training_candidate` | `drafted` | `submit_rehearsal` | Local rehearsal submission allowed |
| `transport_367_nhsmail_deployment_safetynet` | Urgent return | `deployment_candidate` | `awaiting_response` | `status_check_only` | Status capture only |
| `transport_367_manual_assisted_local` | Referral transport | `development_local_twin` | `approved` | `not_required` | Internal process proof only |

## Update Record checklist

- Confirm the row is observation-only and tied to `gp_connect_update_record`.
- Confirm the service set is limited to Pharmacy First, Blood Pressure Check, and Pharmacy Contraception.
- Confirm urgent return is forbidden on the row.
- Confirm the handoff language does not imply direct Vecells Update Record sending.

## Referral transport checklist

- Confirm the row maps to a transport mode already frozen in the repo.
- Confirm the transport row does not imply patient-safe completion.
- Confirm MESH rows include workflow and mailbox handling notes.
- Confirm `transport_367_nhsmail_deployment_safetynet` remains urgent return only.

## Evidence checklist

- Prepare the operator bundle first.
- Capture screenshots only after verifying the page is secret-safe.
- Capture traces only after the redaction boundary.
- Confirm runtime state and readiness summary are written.
- Confirm screenshots, traces, and runtime evidence reference the same request IDs.

## Human approval checklist

- Record the named operator.
- Record the external system or mailbox owner.
- Record the approval or ticket reference if one exists.
- Record expiry or review date.
- Record whether the row is `drafted`, `submitted`, `awaiting_response`, `approved`, `blocked`, or `expired`.

## Stop conditions

- Stop if a row would turn Update Record into an urgent return channel.
- Stop if a browser page renders a raw `secret://` locator.
- Stop if the evidence implies approval without captured proof.
- Stop if a sandbox/live tuple mismatch is detected.
