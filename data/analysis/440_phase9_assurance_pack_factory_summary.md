# 440 Phase 9 Assurance Pack Factory

Schema version: 440.phase9.assurance-pack-factory.v1
Generated at: 2026-04-27T10:00:00.000Z
Framework mappings: 7
Baseline pack: ap_440_bd321a1905909edb
Pack version hash: bd321a1905909edb40191ccd4909beb4744adcf70f80fdc5346b5d4c084b8f62
Evidence set hash: b50239cb90c0ab32803a251c3836d1b5ef05eaf168d80b68c4bd9380e3466db6
Continuity set hash: 60879cdfaf53c74add43a41998d04bc35d1a21390d7aad3884a995e65b22b30e
Replay hash: b44afebe422d1415567d6c0d5950cc2b7e3cb7c8f81000a0c8b3c40c50d06001

## Factory Contract

- Supported framework families have versioned StandardsVersionMap rows.
- Pack generation is graph-backed, deterministic, and hash-addressable.
- Export-ready settlement requires ArtifactPresentationContract, OutboundNavigationGrant, redaction policy, current graph verdict, and retention lifecycle binding.
- Task 441 can consume AssurancePackActionRecord and AssurancePackSettlement rows for attestation, signoff, CAPA, and export-ready workflow.
