# Task 462 Algorithm Alignment Notes

## Resilience Binding

`BackupTargetBinding` is scoped by tenant, environment, release, dataset scope, essential-function refs, recovery tiers, runbook binding refs, `BackupSetManifest`, and `RecoveryEvidencePack`. Live controls are only allowed when every selected binding has current checksum proof, immutability proof, restore-compatibility digest, dependency-order digest, and an exact resilience tuple hash.

## Restore Report Channels

`RestoreReportChannelBinding` covers `restore_report`, `failover_report`, `chaos_report`, `journey_recovery_proof`, `backup_manifest_report`, `runbook_bundle`, and `readiness_snapshot_summary`. Each channel carries a `RecoveryArtifactChannelPolicy` that requires `ArtifactPresentationContract`, `ArtifactSurfaceFrame`, `ArtifactModeTruthProjection`, outbound grants, redaction, retention, and archive protection. Raw object-store URLs are explicitly disallowed.

## Failure States

The registry exposes fail-closed fixtures for target creation, stale checksum, missing secret, missing immutability proof, report delivery failure, unsupported scope, tuple drift, and withdrawn report channel. These fixtures downgrade the admin route and the `/ops/resilience` readiness strip through the same projection.

## Browser Contract

The governance route `/ops/config/backup-restore` provides keyboard-operable controls for tenant, environment, release, essential function, vault refs, fake backup target verification, and fake restore report delivery. The ops route consumes the same registry projection and surfaces target/channel readiness, evidence-pack state, tuple state, and recovery-control state.
