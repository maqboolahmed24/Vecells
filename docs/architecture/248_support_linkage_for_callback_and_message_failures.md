# 248 Support Linkage For Callback And Message Failures

`248` turns callback and clinician-message failure handling into one governed continuation of the communication chain instead of a detached support ticketing side path.

## What changed

- one canonical `SupportLineageBinding` is opened or attached for each active callback or message failure path
- the active `SupportLineageScopeMember` stays bound to the same governing callback case or clinician-message thread tuple the operational domain already uses
- support settlements now stay pinned to the communication chain through `SupportActionRecord`, `SupportActionSettlement`, and `SupportResolutionSnapshot`
- durable support summaries require `SupportLineageArtifactBinding`
- repeated support entry reuses the existing live path instead of creating duplicate tickets

## 218 and 219 continuation

This is a thin continuation over the earlier support stack:

- `218` remains the canonical workspace and lineage anatomy
- `219` remains the repair and replay stack for support-side mutation posture
- `248` adds communication-failure open-or-attach, communication-aware support settlement, and provenance-bound resolution snapshots over callback and message failures

The new query bundle reuses the `218` projection service to render a workspace-safe ticket view over the dynamically created communication-failure lineage.

## Message failure linkage

For clinician-message failures the support chain cites:

- `ClinicianMessageThread`
- `MessageDispatchEnvelope`
- `MessageDeliveryEvidenceBundle`
- `ThreadExpectationEnvelope`
- `ThreadResolutionGate`

Support settlement may acknowledge local action, but it cannot outrun the current delivery bundle or resolution gate.

## Callback failure linkage

For callback failures the support chain cites:

- `CallbackCase`
- the current callback expectation envelope
- the latest callback outcome evidence bundle
- the current callback resolution gate
- the current reachability repair journey when callback recovery is still active

This closes the gap where callback recovery could enter support as a subject-only ticket without one explicit governing failure target.

## Attach vs create law

The attach or create decision is driven by one failure-path key over:

- communication domain
- request lineage
- lineage case link
- governing object ref
- governing thread tuple hash

If the same active failure path re-enters through another channel, support attaches the existing live path. If the visible tuple is stale, the open path fails closed into `stale_recoverable`.

## Resolution law

`SupportResolutionSnapshot` becomes durable only when:

1. the linked `SupportActionSettlement` is authoritative
2. the summary or handoff note has a current `SupportLineageArtifactBinding`
3. the binding still preserves the current mask scope and disclosure ceiling

`awaiting_external` never becomes durable resolution copy. `manual_handoff_required` becomes durable only when the accepted transfer branch is explicit.
