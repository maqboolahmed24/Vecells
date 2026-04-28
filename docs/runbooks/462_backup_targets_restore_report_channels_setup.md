# Backup Targets And Restore Report Channels Setup

## Scope

Task 462 configures Phase 9 backup targets and restore report channels for `/ops/config/backup-restore` and the `/ops/resilience` readiness projection.

## Required Bindings

Create one `BackupTargetBinding` for each dataset scope:

- `patient_intake_event_data`
- `safety_gate_triage_queue`
- `booking_hub_coordination`
- `pharmacy_referral_loop`
- `outbound_communications`
- `audit_search_assurance_ledger`
- `assistive_downgrade_human_artifact`
- `operational_projection_conformance_proof`

Each binding must include essential-function refs, recovery tiers, runbook refs, `BackupSetManifest`, `RecoveryEvidencePack`, checksum proof, immutability proof, restore compatibility digest, dependency order digest, and a vault-backed secret ref.

## Restore Report Channels

Restore report channels must handle `restore_report`, `failover_report`, `chaos_report`, `journey_recovery_proof`, `backup_manifest_report`, `runbook_bundle`, and `readiness_snapshot_summary`.

Every channel must render through `ArtifactPresentationContract`, `ArtifactSurfaceFrame`, and `ArtifactModeTruthProjection`. Do not expose raw object-store URLs. Outbound delivery uses a presentation grant and masked artifact summary.

## Verification

Run:

```bash
pnpm test:phase9:backup-restore-channels
pnpm validate:462-phase9-backup-restore-channels
pnpm exec tsx automation/phase9/configure_backup_targets_and_restore_channels.ts --run
```

Expected result: target verification is `verified`, report delivery is `delivered`, readiness is `ready`, recovery controls are `live_control`, and failure fixtures downgrade controls without leaking raw endpoints or secret material.
