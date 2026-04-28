# 481 Algorithm Alignment Notes

Task 481 binds the final DR/go-live smoke decision to Phase 9 resilience, incident, and full-program exercise rules. The implementation treats backup configuration as insufficient unless restore evidence, report-channel delivery, failover parity, essential-function continuity, incident communication, and rollback smoke are all represented as typed records.

## Source Mapping

- Phase 9 9F maps to `BackupRestoreEvidence`, `FailoverProbeEvidence`, `RestoreReportChannelEvidence`, and `EssentialFunctionContinuityVerdict`.
- Phase 9 9G maps to `RecoveryCommunicationEvidence` and owner-rota constraints.
- Phase 9 9I and platform Gate 4/Gate 5 map to `FinalDRSmokeRun`, `GoLiveSmokeScenario`, and `RollbackSmokeEvidence`.
- Phase 0 WORM/audit rules are represented by `wormAuditRef`, deterministic hashes, synthetic data only, and no optimistic completion before settlement.

## Verdict

The approved Wave 1 scope is green. Required negative edge cases are retained as fail-closed scenario evidence and are not used to widen Wave 1 exposure. NHS App/mobile and assistive rollback findings remain constrained or blocked outside Wave 1 until later tasks explicitly enable those scopes.
