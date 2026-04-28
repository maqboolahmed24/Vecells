# 336 Network Capacity Feed Setup Runbook

## Purpose

`seq_336` makes partner-feed setup reproducible for the Phase 5 network-horizon capacity path.

The authoritative tracked artifacts are:

- `ops/capacity/336_partner_feed_registry.yaml`
- `ops/capacity/336_partner_credential_manifest.yaml`
- `ops/capacity/336_partner_site_service_map.csv`
- `data/contracts/336_capacity_feed_configuration_contract.json`
- `data/analysis/336_partner_feed_gap_register.json`

The executable entry points are:

- `scripts/capacity/336_bootstrap_partner_feeds.ts`
- `scripts/capacity/336_verify_partner_feed_bindings.ts`
- `scripts/capacity/336_reset_partner_nonprod_feeds.ts`

## Control-Plane Law

- The manifest remains the source of truth.
- Local masked supplier twins may be converged automatically.
- Supported-test supplier portals remain an explicit manual bridge.
- Unsupported or quarantined feeds stay explicit configuration states and never become implicit runtime truth.
- Reset and rollback affect only local runtime state under `.artifacts/capacity/336`.

## Bootstrap

Materialize tracked artifacts only:

```bash
pnpm exec tsx ./scripts/capacity/336_bootstrap_partner_feeds.ts --materialize-only
```

Converge the local non-production runtime state:

```bash
pnpm exec tsx ./scripts/capacity/336_bootstrap_partner_feeds.ts
```

Converge a single feed:

```bash
pnpm exec tsx ./scripts/capacity/336_bootstrap_partner_feeds.ts --feed-id feed_336_optum_local_twin
```

Bootstrap is convergent. Re-running it should return `already_current` for unchanged automated rows instead of layering duplicate state.

## Verification

Run the deterministic smoke verification:

```bash
pnpm exec tsx ./scripts/capacity/336_verify_partner_feed_bindings.ts
```

This rebuilds a real 318 candidate snapshot from the 336 manifest-driven bindings and writes:

- `.artifacts/capacity/336/336_partner_feed_verification_summary.json`

Expected posture:

- trusted local feeds remain `trusted_admitted`
- degraded local feeds stay explicitly degraded
- quarantined import feeds stay explicitly quarantined
- supported-test supplier portals stay `manual_bridge_required`
- unsupported feeds stay explicit unsupported rows

## Reset And Rollback

Remove local runtime state:

```bash
pnpm exec tsx ./scripts/capacity/336_reset_partner_nonprod_feeds.ts
```

Rollback rule:

1. Reset local runtime state.
2. Re-run bootstrap from the tracked manifest.
3. Re-run verification.
4. Do not hand-edit runtime JSON.

This keeps rollback deterministic and ensures browser-mediated state does not become the real source of truth.

## Manual Bridge

The narrow manual bridge is recorded in:

- `data/analysis/PHASE5_BATCH_332_339_INTERFACE_GAP_PARTNER_FEED_PORTAL_AUTOMATION.json`

Current manual bridge rows:

- `feed_336_optum_supported_test`
- `feed_336_tpp_supported_test`

Use the manual bridge only for lawful supplier-admin steps that cannot be automated safely.

## Roll Forward Criteria

Do not widen beyond the current non-production posture until:

- the manifest row exists
- the credential bundle exists as references only
- the site/service mapping row exists
- verification is current
- the manual bridge, if any, has fresh named-owner evidence
