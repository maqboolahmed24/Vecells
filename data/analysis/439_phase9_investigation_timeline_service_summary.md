# 439 Phase 9 Investigation Timeline Service

Schema version: 439.phase9.investigation-timeline-service.v1
Generated at: 2026-04-27T08:20:00.000Z
Scope envelope: ise_439_4c24423bb4d570a1
Timeline hash: 6ecdfd608dd8ae49ed0fb6b2ac7849c46d0766b2169ecdc2eda0a6d5fd4338ea
Query coverage: exact
Support replay session: srs_439_752c19b5a47e13f3
Replay hash: 51ae3116a9839bfb0590e0418acc93872825d3f3a5027fbf1cd48e9b0aa4e9ee

## Governance Contract

- InvestigationScopeEnvelope is mandatory before any audit query.
- AuditQuerySession, SupportReplaySession, BreakGlassReviewRecord, and DataSubjectTrace share the same scope envelope and timeline reconstruction for one diagnostic question.
- Timeline ordering is deterministic by event time, source sequence ref, assurance ledger entry id, and deterministic fallback id.
- Break-glass reviews expire and never become permanent visibility grants.
- Export/preview remains blocked without ArtifactPresentationContract and OutboundNavigationGrant policy refs.
