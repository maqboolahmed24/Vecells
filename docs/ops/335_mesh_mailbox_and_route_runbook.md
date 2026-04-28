# 335 MESH Mailbox And Route Runbook

## Purpose

Task `335` turns non-production MESH setup from tribal knowledge into a manifest-driven control plane.

Use this runbook when you need to:

- materialise the tracked mailbox and route manifests
- converge the repo-owned local MESH twin
- seed safe send, receive, retry, and duplicate route checks
- verify route binding without implying business acknowledgement
- execute the narrow manual bridge for Path to Live deployment rows

## Control-plane law

- `ops/messaging/335_mesh_mailbox_registry.yaml` is the mailbox source of truth.
- `ops/messaging/335_mesh_route_manifest.yaml` is the route-binding source of truth.
- `ops/messaging/335_mesh_environment_matrix.csv` is the environment-separation source of truth.
- local automation is allowed only for the masked `local_twin`.
- `path_to_live_deployment` rows stay `manual_bridge_required` until lawful mailbox-admin, workflow, smartcard, and HSCN access are available.
- `path_to_live_integration` stays a pre-mailbox rehearsal environment only. It is not route proof.

## Files to trust

- Registry: `ops/messaging/335_mesh_mailbox_registry.yaml`
- Routes: `ops/messaging/335_mesh_route_manifest.yaml`
- Contract: `data/contracts/335_mesh_route_contract.json`
- Gap register: `data/analysis/335_mesh_setup_gap_register.json`
- Manual bridge: `data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_MESH_PORTAL_AUTOMATION.json`

## Standard operator flow

### 1. Materialise the tracked artifacts

```bash
pnpm exec tsx ./scripts/messaging/335_bootstrap_mesh_mailboxes.ts --materialize-only
```

Expected result:

- the tracked YAML, CSV, and JSON artifacts are regenerated from one library
- no mailbox or route row exists only in a browser page

### 2. Converge the local MESH twin

```bash
pnpm exec tsx ./scripts/messaging/335_bootstrap_mesh_mailboxes.ts
```

Expected result:

- `mailbox_335_vecells_hub_local_twin`
- `mailbox_335_practice_proxy_local_twin`
- `mailbox_335_servicing_site_local_twin`

move to `current`.

`path_to_live_deployment` rows must remain `manual_bridge_required`.

### 3. Seed safe non-production route checks

```bash
pnpm exec tsx ./scripts/messaging/335_seed_nonprod_route_checks.ts
```

This writes safe, non-patient-identifiable route fixtures for:

- send
- receive
- retry
- duplicate

### 4. Verify route bindings

```bash
pnpm exec tsx ./scripts/messaging/335_verify_mesh_routes.ts
```

Expected result:

- all `*_local` routes verify successfully
- all `*_ptl` routes remain `manual_bridge_required`
- decision classes prove replay-safe receipt handling
- `practice_visibility_notice` still carries `transport_only_not_acknowledged`
- `practice_business_ack` still carries `business_ack_generation_bound`

### 5. Browser proof

```bash
pnpm exec tsx ./tests/playwright/335_mesh_admin_portal_setup.spec.ts --run
pnpm exec tsx ./tests/playwright/335_mesh_route_verification.spec.ts --run
```

The Playwright portal is a masked local twin. It proves:

- manifest-driven convergence
- already-current detection
- manual bridge visibility
- masked evidence capture
- local-only network scope

## Manual bridge for Path to Live deployment

These steps are intentionally not automated from the repository.

### Mailbox creation or amendment

1. Confirm the target workflow group and workflow IDs against the current NHS worksheet.
2. If the IDs are not already approved, submit the workflow request or amendment first.
3. Submit the mailbox request for the exact environment and organisation row in the manifest.
4. Record the resulting mailbox identity, workflow assignment, and evidence outside the repo if it contains sensitive operational data.
5. Compare the returned NHS-controlled state against:
   - mailbox alias
   - organisation ref
   - environment
   - route purpose
   - workflow group
   - workflow IDs

### UI or lookup access

1. Request the MESH UI account if the workflow needs UI-based confirmation.
2. If lookup or message tracking requires MOLES, complete the HSCN and smartcard gated step outside unattended automation.
3. Do not export or paste cookies, smartcard artefacts, or raw mailbox credentials into the repository.

## Rollback or reset

Local twin only:

```bash
node --experimental-strip-types ./scripts/messaging/335_bootstrap_mesh_mailboxes.ts --materialize-only
```

Then restart the local browser proof harness or call the helper-backed reset used by the Playwright harness.

Do not use the local reset flow against real NHS-managed environments.

## What counts as success

- the tracked manifests match the generator output
- the local automated rows converge without duplication
- route verification stays bound to the intended environment and mailbox aliases
- transport proof never clears practice acknowledgement debt by itself
- Path to Live remains explicit as a manual bridge instead of an implied configured state
