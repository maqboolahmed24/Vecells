# 218 Support Lineage Masking And Subject History Controls

Task:
`par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries`

## Minimum Necessary Posture

Support views start in masked summary mode. `SupportSubject360Projection` and
`SupportSubjectHistoryProjection` can reference only objects in the current `SupportLineageBinding`
and its explicit `SupportLineageScopeMember` rows.

Default subject history returns:

- masked subject label
- contact-route health state
- bounded open-object refs
- recent outcome refs
- masked chronology summaries
- provenance refs

It must not return raw adapter payloads, raw provider callbacks, unrestricted audit traces, full
demographics, or broad subject dossiers.

## Authorization And Binding Checks

Every support history query validates:

- current `SupportLineageBinding.bindingState = active`
- one current primary actionable `SupportLineageScopeMember`
- current `maskScopeRef`
- current `disclosureCeilingRef`
- live `SupportSubjectContextBinding`
- live `supportSurfaceRuntimeBindingRef`
- route family `GET /ops/support/tickets/:supportTicketId/subject-history`

OWASP authorization guidance calls for least privilege, deny-by-default behavior, and permission
validation on every request. This implementation maps those principles into explicit binding
checks and same-shell fallback rather than route-local optimistic access.

## Disclosure Records

Any reveal beyond governed summary creates `SupportContextDisclosureRecord`. The record carries:

- support ticket and current support-lineage binding
- subject context binding
- requested support user
- reason code
- requested and approved disclosure mode
- revealed scope members and artifact bindings
- expiry and collapse state

Expired, denied, revoked, stale, or blocked disclosure collapses to summary-only. It may not leave
detail rows visible after mask scope narrows.

## Logging And Telemetry

Logs and telemetry may record refs, hashes, route family, reason code, approval state, and analytical
confidence. They must not record raw health data, raw identifiers, access tokens, session IDs, raw
thread body, raw provider metadata, or full contact details.

OWASP logging guidance explicitly calls out sensitive personal data, access tokens, session
identifiers, secrets, and higher-classification data as material to exclude, mask, hash, sanitize, or
encrypt before logging. Support disclosure telemetry follows that pattern.

## Artifact Provenance

`SupportLineageArtifactBinding` is mandatory before a support-visible excerpt, derived record
summary, note, or future export becomes durable timeline or handoff truth. Each binding cites source
lineage, source case link, evidence snapshot or artifact, derived artifact, note or summary ref,
mask scope, disclosure ceiling, and parity digest.

If a source artifact is stale, blocked, superseded, or lacks parity, the support view may preserve a
placeholder or summary-only row but cannot promote the derived artifact.

## Read-Only Fallback

When route intent, binding state, runtime publication, or mask scope drifts, the ticket shell returns
`SupportReadOnlyFallbackProjection`. The fallback preserves:

- selected timeline anchor
- strongest confirmed artifact ref
- held mutation or dispatch refs where present
- current mask scope
- reacquire action ref

The fallback prevents both blank workspaces and stale writable controls.

## Browser And Accessibility Proof

The atlas is tested with Playwright screenshots, ARIA snapshots, keyboard tab controls, mobile
viewport, reduced motion, semantic landmarks, tables, and description lists. NHS accessibility
guidance and WCAG 2.2 require accessible, inclusive services; the atlas proof gives downstream
support UI tasks a stable browser-readable contract.
