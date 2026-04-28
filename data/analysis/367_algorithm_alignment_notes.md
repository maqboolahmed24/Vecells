# 367 Algorithm Alignment Notes

Reviewed on 2026-04-24.

## Intent

`seq_367` operationalises environment readiness for Phase 6 without changing the underlying clinical and transport law already frozen by `350`, `352`, `353`, and `366`.

## Rule mapping

| Request or step | Exact rule or dependency | Why it exists |
| --- | --- | --- |
| `update_record_367_integration_pairing` | Rule 3, `6F`, `352` | Prepares observation-readiness packs while preserving the prohibition on direct urgent transport through Update Record |
| `update_record_367_training_pairing` | Rule 3, `6F`, `366` | Holds a training request pack at `draft_only` so sandbox access is explicit but not overclaimed |
| `update_record_367_deployment_observation` | Rule 3, `6F`, `341`, `345` | Keeps deployment observation blocked until named operator evidence exists |
| `transport_367_bars_deployment_preflight` | `6D`, `350`, `366`, `EDGE345_023` | Mirrors the real referral-dispatch transport family without widening beyond the enabled BaRS stack |
| `transport_367_supplier_integration` | `6D`, `350`, `366` | Captures a supplier-admin onboarding seam as blocked instead of hiding it in email threads |
| `transport_367_mesh_training_mailbox` | `6D`, `350`, `366` | Makes MESH mailbox and workflow setup requestable and testable in non-production |
| `transport_367_nhsmail_deployment_safetynet` | `6G`, `353`, `344` | Preserves urgent-return channel separation and monitored mailbox evidence |
| `transport_367_manual_assisted_local` | phase-0 degraded transport rules, `350` | Keeps the local manual-assisted dispatch fallback explicit and non-NHS |

## Why Update Record stays separate

- Rule 3 forbids direct Vecells Update Record sending as a general-purpose outbound channel.
- `6F` allows consultation-summary observation and reconciliation, not urgent return or referral dispatch.
- `352` consumes Update Record as a trusted observation source class, which is why 367 models observation readiness and not clinical completion.

## Why urgent return stays separate

- `6G` requires a direct professional communication path for urgent return.
- `353` already freezes bounce-back, urgent return, and reopen mechanics.
- Therefore `transport_367_nhsmail_deployment_safetynet` is modelled as `urgent_return_safety_net`, not an Update Record extension.

## Why transport readiness is not dispatch truth

- `350` owns dispatch adapter law, retry, expiry, and calm-truth boundaries.
- 367 may request or verify transport sandboxes, but mailbox existence or API access never proves dispatch completion.
- The request harness therefore records request posture only: `not_requested | drafted | submitted | awaiting_response | approved | blocked | expired`.

## Why environment onboarding remains explicit

- `366` already froze the credential and secret-reference discipline for non-production directory and dispatch setup.
- `PHASE6_PARALLEL_INTERFACE_GAP_ENVIRONMENT_ONBOARDING_BOUNDARY.json` remains inherited because NHS-side approvals are environment-controlled.
- 367 closes the machine-readable request-pack gap, not the external-approval ownership gap.

## Additional implementation notes

- The request harness always prepares operator bundles from the same source manifests used by the validator.
- The status harness writes machine-readable readiness evidence under `output/playwright/367-transport-sandbox-state`.
- `manual_stop_before_submit` is preserved for `update_record_367_integration_pairing` and `transport_367_bars_deployment_preflight` because those rows must stop before a real external submission step.
