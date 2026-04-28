# 202 Mock-Now NHS Login Configuration Twin

Task: `seq_202`  
Lane: `Mock_now_execution`

## Purpose

The mock-now twin lets the team rehearse NHS login client configuration without provider credentials or live mutation. It models the provider-console fields that matter, then proves them through local artifacts, a control board, and a Playwright harness.

## Executable Local Surfaces

- Control board: `docs/frontend/202_nhs_login_config_control_board.html`
- Manifest: `data/contracts/202_nhs_login_client_config_manifest.json`
- Selector manifest: `data/contracts/202_nhs_login_console_selector_manifest.json`
- Harness: `tools/playwright/202_nhs_login_console_harness.ts`
- Browser spec: `tests/playwright/202_nhs_login_config_control_board.spec.ts`

## Local Twin Rules

The twin can:

- inspect redirect and scope drift before any provider-console work
- render route-family ownership for every callback
- simulate sandpit and integration evidence posture
- capture redacted screenshots
- produce a selector snapshot
- produce rollback evidence
- reject raw client secrets, passwords, OTPs, or console credentials

The twin cannot:

- create real NHS login clients
- submit sandpit or integration requests
- register production callbacks
- infer local session or logout authority from NHS login

## Dry-Run Evidence

The harness writes evidence under `output/playwright/`:

- `202-nhs-login-console-harness.png`
- `202-nhs-login-console-harness-evidence.json`
- `202-nhs-login-selector-snapshot.json`

These artifacts redact client identifiers, secret references, redirect hosts, and any test-user credential class. The evidence is proof of local configuration discipline, not proof of provider acceptance.

## Rollback Simulation

Rollback is modeled by preserving the current manifest snapshot and proving it can be re-applied in dry run. Real provider rollback requires a named approver and a pre-mutation provider snapshot. No script in this pack performs live rollback by default.
