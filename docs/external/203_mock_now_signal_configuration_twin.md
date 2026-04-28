# 203 Mock-Now Signal Configuration Twin

The mock-now lane is complete without live provider credentials. It uses the manifest, selector manifest, and Playwright harness to prove endpoint coverage, event subscriptions, signature posture, replay posture, evidence redaction, and live gate blocking.

## Twin Inputs

| Artifact | Role |
| --- | --- |
| `data/contracts/203_signal_provider_manifest.json` | authoritative callback, event, signature, replay, redaction, and gate contract |
| `data/contracts/203_signal_provider_selector_manifests.json` | deterministic selectors for the local twin and future provider consoles |
| `data/analysis/203_webhook_endpoint_matrix.csv` | endpoint parity table used by validators and the control board |
| `data/analysis/203_event_subscription_matrix.csv` | exact event subscription rows |
| `data/analysis/203_signature_rotation_and_replay_matrix.csv` | signature mechanism and replay-window rows |
| `data/analysis/203_live_gate_and_rollback_checklist.json` | live mutation and rollback blockers |

## Local Control Board Behavior

`docs/frontend/203_signal_edge_control_board.html` renders the `Signal_Edge_Control_Board` with:

- a full-width family tab rail for `Telephony`, `SMS`, `Email`, `Replay`, and `Evidence`
- endpoint-to-provider-family matrix and adjacent table parity
- event-subscription coverage diagram and adjacent table parity
- replay and signature guard board and adjacent table parity
- a right evidence drawer with redacted screenshot names, timestamps, and environment metadata
- a live-gate checklist that remains blocked unless the explicit gate variables and approvals exist

The local twin includes a duplicate endpoint probe. Duplicate endpoint IDs produce a visible warning; this prevents provider-console copy/paste drift from becoming invisible.

## Playwright Dry Run

Run the harness in structural mode:

```bash
pnpm exec tsx tools/playwright/203_signal_provider_console_harness.ts
```

Run the real browser proof:

```bash
pnpm exec tsx tools/playwright/203_signal_provider_console_harness.ts --run
```

Expected evidence artifacts:

- `output/playwright/203-signal-provider-console-harness.png`
- `output/playwright/203-signal-provider-console-harness-evidence.json`
- `output/playwright/203-signal-provider-selector-snapshot.json`

All evidence is redacted before writing JSON. The screenshot is taken only from the local control board, which contains no raw provider credentials or unmasked patient contact values.

## Diff Discipline

The twin compares intended state from the manifest with console state captured by selectors. In `local` and `sandbox_twin`, all mutation controls are disabled, so the harness proves selector reach and evidence capture without changing provider state.

## Mock-Now Exit Criteria

- every callback endpoint is scoped as `edge`
- every callback path starts with `/edge/signal/`
- every family has signature and replay requirements
- telephony includes call-status, IVR gather/menu, and recording-status rows
- SMS and email include delivery and failure rows
- live mutation is blocked by default
- evidence artifacts contain no raw credential material
