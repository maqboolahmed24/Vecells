# 367 Update Record and Transport Sandbox Runbook

## Purpose

This runbook operationalises the Phase 6 non-production request path for:

- Update Record observation readiness only
- referral dispatch transports that the repository already enables
- the urgent return safety-net channel without collapsing it into Update Record

This runbook does not authorise direct Vecells Update Record sending and does not prove clinical completion.

## Boundary rules

1. Update Record stays consultation-summary only.
2. Urgent return stays outside Update Record and uses the governed `urgent_return_safety_net` channel.
3. Sandbox readiness is environment truth, not dispatch truth and not outcome truth.
4. Approval evidence must stay machine-readable and repository-visible.
5. Sandbox and live tuples must remain separate in manifests, evidence, and operator handoff.

## Source manifests

- `data/config/367_update_record_observation_manifest.example.json`
- `data/config/367_transport_sandbox_manifest.example.json`
- `data/contracts/367_sandbox_readiness_contract.json`
- `data/contracts/PHASE6_BATCH_364_371_INTERFACE_GAP_TRANSPORT_AND_UPDATE_RECORD_SANDBOX.json`

## Supported request modes

- `draft_only`: prepare the full request pack and operator bundle but do not submit
- `manual_stop_before_submit`: allow Playwright to reach the final checkpoint and stop
- `submit_rehearsal`: submit inside the local rehearsal harness only
- `status_check_only`: use Playwright to inspect and capture evidence, not mutate
- `not_required`: no browser-driven onboarding step exists for the row

## Request families

### Update Record observation

- `update_record_367_integration_pairing`
- `update_record_367_training_pairing`
- `update_record_367_deployment_observation`

All Update Record rows inherit Rule 3 and `6F`: observation only, never urgent return, never referral dispatch.

### Referral transport

- `transport_367_bars_deployment_preflight`
- `transport_367_supplier_integration`
- `transport_367_mesh_training_mailbox`
- `transport_367_nhsmail_deployment_safetynet`
- `transport_367_manual_assisted_local`

These rows inherit `6D`, `6G`, and the transport law frozen by `350`, `352`, `353`, and `366`.

## Operator workflow

1. Materialise the tracked artifacts.

```bash
pnpm exec tsx ./scripts/pharmacy/367_materialize_transport_sandbox_artifacts.ts
```

2. Review `ops/onboarding/367_nonprod_request_pack_checklist.md`.
3. Prepare the exact operator handoff bundle for the row you intend to review.

```bash
pnpm exec tsx ./tools/browser-automation/367_prepare_operator_submission_bundle.ts \
  --request-id update_record_367_integration_pairing \
  --request-id transport_367_mesh_training_mailbox
```

4. Run the request harness when you need a browser-driven draft, manual stop, or rehearsal submission.

```bash
pnpm exec tsx ./tools/browser-automation/367_request_transport_sandboxes.spec.ts --run
```

5. Run the status and evidence harness to capture safe verification output.

```bash
pnpm exec tsx ./tools/browser-automation/367_check_request_status_and_capture_evidence.spec.ts --run
```

6. Validate the full 367 pack.

```bash
pnpm validate:367-sandbox-readiness
```

## Environment handling

### development_local_twin

- local-only rehearsal support
- no real NHS onboarding credentials
- safe for `not_required` and internal operator process proof

### integration_candidate

- explicit draft and manual-stop posture
- used for supplier pairing and request-pack proof

### training_candidate

- explicit MESH mailbox and training observation packs
- may use `submit_rehearsal` in the local harness only

### deployment_candidate

- evidence-first and `status_check_only` for blocked or awaiting rows
- release candidate proof is allowed, approval claims are not

## Safe evidence policy

- browser storage state stays local to `output/playwright`
- screenshots and traces are captured only after the redaction boundary
- masked fingerprints may be shown
- raw `secret://` locators must never be rendered in the browser, runtime state, or bundle output
- HAR capture is disabled

## Transport-specific notes

### Update Record

- `gp_connect_update_record`
- consultation summary observation only
- never used for urgent return
- never used for safeguarding escalation

### BARS

- deployment preflight only in this pack
- approval remains operator and NHS onboarding controlled

### MESH

- mailbox and workflow setup are explicit
- workflow IDs and mailbox issuance remain environment-bound

### NHSmail monitored mailbox

- reserved for the `urgent_return_safety_net`
- evidence may show `awaiting_response`
- mailbox existence alone is not outcome truth

## Renewal, expiry, and blocked handling

- `approved` and `awaiting_response` rows may still carry expiry dates
- `blocked` rows remain explicit until named operator evidence replaces the blocker
- `expired` rows must be renewed through the same request-pack and handoff path
- blocked or expired rows must never be silently widened into ready or approved posture

## Rollback and recovery

- delete or replace only the local runtime state in `output/playwright/367-transport-sandbox-state`
- do not rewrite tracked manifests to pretend approval
- rerun the request harness, status harness, and validator after any operator correction

## Acceptance reminder

The 367 pack is truthful only when it shows:

- what has not been requested
- what is drafted
- what reached a manual stop
- what is submitted or awaiting response
- what is approved with evidence
- what is blocked or expired

If any step still depends on external human approval, leave it explicit.
