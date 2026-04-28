# 420 Algorithm Alignment Notes

## Local Blueprint Alignment

The implementation follows `blueprint/phase-8-the-assistive-layer.md` for the core object model:

- `AssistiveConfidenceDigest.displayBand` is the only primary confidence token.
- `AssistiveProvenanceEnvelope` supplies artifact, evidence snapshot, prompt, model, policy, calibration, publication, runtime, and masking refs.
- `AssistiveCapabilityTrustEnvelope` controls whether confidence remains visible or narrows to suppressed.
- `ArtifactPresentationContract` keeps rationale summary-first and prevents richer explanation synthesis when only summary or placeholder depth is allowed.

The component intentionally keeps draft insert authority outside this task. The confidence surface can explain, suppress, and reveal lineage, but it cannot make insert, accept, completion, export, or handoff legal.

## Suppression Logic

The state adapter uses the requested fixture plus current runtime scenario. Any non-live scenario narrows to `displayBand=suppressed`, because read-only, recovery, stale, or blocked postures cannot show confidence-bearing chrome. The `suppressed-degraded` fixture models a source digest that might otherwise be supported, but trust posture degrades it before rendering.

## Summary-First Rationale

Default copy is one rationale digest. Factor rows for evidence coverage, expected harm, uncertainty, trust, freshness, or abstention appear only inside the bounded disclosure. The disclosure says why the aid appears; it does not prove the clinical decision.

## Provenance Layers

Layer 1 is always visible in `AssistiveProvenanceFooter`: freshness, trust, and source snapshot. Layer 2 is `AssistiveProvenanceDrawer`, an inline bounded drawer with refs and hashes only. No raw prompt content, evidence text, or patient payload is exposed.

## Upstream Static Registry Gap

The 403 readiness registry still labels `par_420` as deferred by `WAIT403_420_REQUIRES_411_AND_415`. Local 411 and 415 contracts are present, so task 420 proceeds with a machine-readable temporary fallback gap note rather than weakening confidence or provenance behavior.
