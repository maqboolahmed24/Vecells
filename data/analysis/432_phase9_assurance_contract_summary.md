# 432 Phase 9 Assurance Ledger Contract Freeze

Schema version: 432.phase9.assurance-ledger-contracts.v1
Phase 8 exit packet: data/contracts/431_phase8_exit_packet.json
Contract count: 16
Contract set hash: 17b1e13e0207f05e4bcedfe763f80a0e61d1749a05b6a0669b3ad741865b0f80
Graph snapshot: aegs_432_demo
Graph hash: 2829b85f0c7b608fa34b583ad67ac16b5894cb84d45a8098f0a0550830433a26
Completeness verdict: complete

## Frozen Contracts

- AssuranceLedgerEntry
- EvidenceArtifact
- ControlObjective
- ControlEvidenceLink
- ProjectionHealthSnapshot
- AttestationRecord
- AssurancePack
- AssuranceIngestCheckpoint
- ControlStatusSnapshot
- AssuranceSliceTrustRecord
- ExperienceContinuityControlEvidence
- AssuranceSurfaceRuntimeBinding
- IdentityRepairEvidenceBundle
- AssuranceEvidenceGraphSnapshot
- AssuranceEvidenceGraphEdge
- AssuranceGraphCompletenessVerdict

## Fail-Closed Gates

- Pack export, support replay, retention disposition, deletion/archive, recovery proof, and authoritative dashboards require a complete graph snapshot and completeness verdict.
- Slice trust uses lower-bound scores with Phase 9 hysteresis: enter trusted at >= 0.88 for two same-model evaluations, leave trusted below 0.82, quarantine on hard block or below 0.40.
- Evidence artifacts preserve capture bundle, derivation package, summary parity, redaction transform, retention class, and visibility scope.
- Consumers may not keep local evidence lists when an AssuranceEvidenceGraphSnapshot is available.
