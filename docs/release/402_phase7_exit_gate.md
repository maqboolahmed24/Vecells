# 402 Phase 7 Exit Gate

## Formal Decision

`approved`

Decision timestamp: `2026-04-27T13:00:00.000Z`

Release class: `approved_phase7_completion_with_phase8_launch_conditions`

Manifest: `nhsapp-manifest-v0.1.0-freeze-374`

Release approval freeze: `ReleaseApprovalFreeze:RAF-P7-374-CONTRACT-FREEZE`

## Basis

The final gate has verified that:

- the NHS App channel is the same portal, not a fork
- embedded, standalone, and resumed-link entry resolve to shared backend contracts
- SSO, silent auth, safe re-entry, return intent, replay, expiry, subject mismatch, and consent-denied paths are fenced
- deep links, site links, bridge navigation, outbound grants, calendar handoff, and artifact delivery are webview-safe
- all final proof batteries from 399, 400, and 401 are passed
- telemetry, monthly pack, route-freeze, kill switch, and rollback controls are machine governed
- support, governance, and audit surfaces expose what the patient saw

## Blockers

None.

## Carry-Forward

None.

## Launch Conditions For Phase 8

Phase 8 must inherit the 402 launch conditions in `data/contracts/402_phase8_launch_conditions.json`. The assistive-layer wave is not automatically opened by this decision; task 403 owns that launch verdict.

## Validation

Run:

```sh
pnpm validate:402-phase7-exit-gate
pnpm exec tsx tests/playwright/402_phase7_exit_gate_board.spec.ts --run
```
