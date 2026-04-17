# 51 Publication Parity Strategy

## Summary

The parity model currently reports `2` exact candidates and `3` non-exact candidates. Exact parity is necessary for live authority, but it still does not bypass seq_050 browser ceilings around design publication and accessibility completeness.

## Fail-Closed Rules

- `RULE_051_RELEASE_CANDIDATE_IS_ONE_APPROVAL_UNIT`: Artifacts, policies, schemas, bridge capabilities, migration posture, immutable baseline, review package, and standards watchlist promote and roll back as one tuple. If any member drifts, approval freeze expires and the candidate cannot advance.
- `RULE_051_RUNTIME_PUBLICATION_AND_PARITY_PUBLISH_TOGETHER`: Runtime publication, surface publications, runtime bindings, provenance, and parity are published together as one runtime truth bundle. Hidden CI-only state, ad hoc dashboard joins, or route-local cache cannot replace published parity.
- `RULE_051_EXACT_PARITY_IS_MANDATORY_FOR_WRITABLE_OR_CALM_TRUST`: ReleasePublicationParityRecord(parityState = exact) is mandatory before writable or calmly trustworthy posture may remain live. Stale, conflict, withdrawn, or missing parity suppresses mutation before any local cache or deploy-green signal can reopen it.
- `RULE_051_WAVE_CONTROL_READS_WATCH_TUPLES_NOT_DASHBOARDS`: Watch, widen, pause, rollback, and recovery decisions must read ReleaseWatchTuple and WaveObservationPolicy rather than operator memory or dashboard interpretation. Stale or superseded watch tuples block widening, calm watch posture, and governed handoff.

## Watch Evidence Requirements

| Evidence | Required state | Blocking effect |
| --- | --- | --- |
| Approval freeze | active | Promotion, resume, and writable posture stop if the approved freeze expires or drifts. |
| Runtime publication bundle | published | No runtime publication means no live authority, regardless of deployment dashboards. |
| Publication parity verdict | exact | Wave widening and calm trust block unless parity remains exact. |
| Wave guardrail snapshot | current | Scope and guardrail drift supersede the tuple and force a fresh wave publication. |
| Observation policy | armed | Operators cannot shorten, extend, or replace dwell obligations from memory or chat. |
| Rollback readiness | ready | Resume, widen, and recovery activation halt on constrained or blocked rollback readiness. |

## Parity Outcomes

| State | Meaning | Writable / calm trust outcome |
| --- | --- | --- |
| exact | Published tuple matches the approved freeze | Still subject to design publication, accessibility, and route-specific runtime binding ceilings |
| stale | Published digests or watch evidence are out of date | Freeze mutation and reduce to read_only or recovery_only |
| conflict | Topology, provenance, or governance watch facts disagree with approval | Block promotion and hold surfaces at blocked or governed recovery posture |
| withdrawn | Publication or watch tuple was withdrawn or superseded | Treat the prior tuple as non-authoritative and require a fresh publication |

## Mandatory Source Anchors

- `platform-runtime-and-release-blueprint.md#ReleasePublicationParityRecord`
- `platform-runtime-and-release-blueprint.md#ReleaseWatchTuple`
- `platform-runtime-and-release-blueprint.md#WaveObservationPolicy`
- `platform-runtime-and-release-blueprint.md#AudienceSurfaceRuntimeBinding`
- `forensic-audit-findings.md#Finding 95`
- `forensic-audit-findings.md#Finding 104`
