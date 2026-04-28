# 51 Release Candidate Freeze Strategy

## Summary

`seq_051` publishes `5` environment-scoped release candidates and `5` approval freezes so release, provenance, watch, and browser authority no longer float as separate conventions.

## Candidate Matrix

| Release | Environment | Parity | Wave | Publication | Freeze |
| --- | --- | --- | --- | --- | --- |
| RC_LOCAL_V1 | local | exact | draft | published | active |
| RC_CI_PREVIEW_V1 | ci-preview | exact | preview_ready | published | active |
| RC_INTEGRATION_V1 | integration | stale | integration_rehearsal | stale | active |
| RC_PREPROD_V1 | preprod | conflict | preprod_frozen | conflict | active |
| RC_PRODUCTION_V1 | production | withdrawn | rollback_review | withdrawn | active |

## Freeze Law

- Release candidates freeze git ref, artifact digests, bundle hashes, runtime topology, schemas, migration posture, and bridge floors together.
- Release approval freeze also pins the governance review package hash, standards dependency watchlist hash, compilation tuple hash, and approval tuple hash.
- Promotion and rollback reuse the same approval unit. If any member drifts, the freeze is no longer valid.

## Frozen Member Groups

| Group | What is frozen | Why it cannot drift |
| --- | --- | --- |
| Artifacts | Artifact digests, SBOM linkage, and approved bundle freeze must stay candidate-bound. | Unsigned or drifted artifacts block promotion and rollback reuse immediately. |
| Topology | Runtime topology manifest and topology tuple hash must still match the approved release. | Topology drift freezes writable posture and blocks widen or resume. |
| Manifests | Frontend manifests, runtime bindings, and surface publications must publish together. | Any stale or withdrawn manifest collapses browser authority to recovery or blocked posture. |
| Design bundles | Design contract publication bundle and lint refs remain inside the promoted tuple. | Design publication drift blocks calm trust even if runtime parity still matches. |
| Schemas | Route digests, projection compatibility, settlement schemas, transition envelopes, event schemas, and FHIR contracts share one schema-set freeze. | Schema drift invalidates parity and forces a fresh freeze before promotion. |
| Migrations | Schema migration and projection backfill posture must promote and roll back as one unit. | Backfill or read-path compatibility drift blocks widening and candidate reuse. |
| Provenance | Build provenance and runtime consumption state are part of publication truth, not sidecar audit data. | Quarantined, revoked, or withdrawn provenance freezes mutating posture before deploy calmness can lie. |
| Recovery and watch | Recovery dispositions, watch tuples, and observation policy must stay aligned with parity. | Watch drift or missing recovery posture blocks widening and governed handoff. |

## Gap Closures

- Provenance and rollback are no longer frozen separately; they now bind to the same approval tuple.
- Governance review, standards watchlist, and compiled policy bundle all stay candidate-bound instead of becoming sidecar evidence.
- Design publication remains inside the release tuple instead of drifting into token or frontend-only sidecars.

## Source Anchors

- `phase-0-the-foundation-protocol.md#1.24 ReleaseApprovalFreeze`
- `platform-runtime-and-release-blueprint.md#ReleaseCandidate`
- `platform-runtime-and-release-blueprint.md#RuntimePublicationBundle`
- `phase-cards.md#Extended Summary-Layer Alignment`
- `forensic-audit-findings.md#Finding 91`
- `forensic-audit-findings.md#Finding 103`
- `forensic-audit-findings.md#Finding 118`
