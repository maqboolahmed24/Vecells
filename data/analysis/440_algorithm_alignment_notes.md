# Phase 9 Assurance Pack Factory Algorithm Alignment

The pack factory follows Phase 9 section 9D: StandardsVersionMap rows are versioned, framework-specific generators build deterministic query plans, admissible evidence comes from graph-backed control and evidence rows, and generated packs pin graph verdict, trust, freshness, redaction, retention, continuity, and reproduction hashes.

The implementation supports DSPT, DTAC, DCB0129, DCB0160, NHS App/channel, IM1 change, and local tenant framework families. It blocks or degrades on missing graph verdicts, stale or superseded evidence, missing redaction policy, ambiguous standards versions, tenant mismatch, missing continuity evidence, and missing retention lifecycle binding.

AssurancePackActionRecord and AssurancePackSettlement are emitted for signoff, publish, export-ready, and blocked outcomes so task 441 can consume pack state for attestation, signoff, CAPA, and export handoff workflow.
