# Phase 9 Investigation Timeline Algorithm Alignment

The service follows Phase 9 section 9C: InvestigationScopeEnvelope is issued before any sensitive audit search, and every AuditQuerySession, BreakGlassReviewRecord, SupportReplaySession, and DataSubjectTrace pins the same timeline reconstruction for one diagnostic question.

Timeline reconstruction consumes WORM audit records, AssuranceLedgerEntry rows, assurance graph edges, data-subject trace joins, continuity refs, causal tokens, command settlements, UI transition settlements, projection visibility refs, and artifact refs. It orders by event time, source sequence ref, assurance ledger entry id, and deterministic fallback id.

The timeline hash is built from ordered ledger hashes, audit hashes, and the graph hash. Support replay cannot rebuild a separate chronology and export/preview cannot proceed without ArtifactPresentationContract and OutboundNavigationGrant policy refs.

Missing or expired scope, missing purpose evidence, absent or expired break-glass review, visibility gaps, graph blockers, orphan edges, timeline join gaps, selected-anchor mismatch, tenant crossing, runtime mismatch, and disclosure-ceiling violations fail closed.
