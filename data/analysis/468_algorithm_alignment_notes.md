# Phase 9 Restore, Failover, Chaos, And Slice Quarantine Alignment

Task 468 composes the existing Phase 9 resilience contracts rather than creating a second source of authority. Task 444 supplies EssentialFunctionMap, RecoveryTier, BackupSetManifest, OperationalReadinessSnapshot, RunbookBindingRecord, and RecoveryControlPosture. Task 445 supplies restore, failover, chaos, RecoveryEvidencePack, ResilienceActionSettlement, RecoveryEvidenceArtifact, and recovery graph writeback. Task 446 supplies projection rebuild and slice-bounded quarantine. Task 453 supplies the Resilience Board projection. Task 462 supplies governed backup target and restore report channel bindings.

Restore testing distinguishes data-restored-only evidence from journey-complete recovery authority. A clean-room restore is only accepted when tuple-compatible backup manifests, dependency order, dependency proof artifacts, journey proof artifacts, runbook bindings, synthetic recovery coverage, and settlement records all line up.

Failover testing covers scenario approval, activation, validation, and stand-down while proving stale tuple evidence is invalidated as stale_scope. Local log completion is not treated as recovery authority; ResilienceActionSettlement remains the control point.

Chaos testing covers schedule, start, halt, completion, guardrail, and blast-radius cases. Guardrail-blocked chaos cannot be used as successful recovery evidence, and old game-day runs become superseded after tuple drift.

Recovery artifact testing is summary-first and graph-bound. ArtifactPresentationContract, outbound navigation grants, fallback dispositions, report channels, masking, and graph writeback are checked without exposing raw object-store URLs, raw backup scopes, environment identifiers, PHI, or secret references in browser-visible surfaces.

Projection rebuild testing proves hash mismatch and exact replay divergence are not global outages. Quarantine remains slice-bounded: affected resilience slices block authority, while unaffected communications slices retain trusted current-tuple presentation.
