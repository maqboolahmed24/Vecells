# 218 Support Lineage Binding And Subject History Design

Task:
`par_218_crosscutting_track_backend_build_support_lineage_binding_ticket_projection_and_subject_history_queries`

Visual mode: `Support_Lineage_Atlas`.

## Scope

This task adds the support backend projection family for:

- `GET /ops/support/tickets/:supportTicketId`
- `GET /ops/support/tickets/:supportTicketId/subject-history`
- `GET /ops/support/tickets/:supportTicketId/subject-360`
- `GET /internal/ops/support/tickets/:supportTicketId/lineage/scope-members`
- `GET /internal/ops/support/tickets/:supportTicketId/lineage/artifacts`

The production implementation lives in
`services/command-api/src/support-lineage-ticket-subject-history.ts`.

## Canonical Join

`SupportTicket` is the workspace frame. It owns queue, SLA, severity, owner, shell mode, selected
timeline anchor, current action lease, and fallback pointers. It does not copy request, callback,
message, identity, or artifact truth.

`SupportLineageBinding` is the only canonical join between the ticket and upstream truth. It binds:

- subject
- primary request lineage
- primary line case link
- governing object descriptor and version
- explicit scope members
- source lineage, thread, and artifact refs
- mask scope and disclosure ceiling
- binding hash and binding state

Any stale, superseded, closed, or runtime-blocked binding returns the same ticket shell with
`SupportReadOnlyFallbackProjection`; it does not redirect to a detached error page.

## Scope Members

`SupportLineageScopeMember` is the typed list of objects the ticket may see. The first fixture has
four members:

- `primary_action_target` for the conversation thread with `actionability = governed_mutation`
- `communication_context` for the callback with `actionability = observe_only`
- `artifact_provenance` for the record artifact with `actionability = artifact_only`
- `identity_repair_dependency` for watch-only identity context

Exactly one active scope member may provide live mutation authority. Sibling context stays visible
for continuity but cannot silently become a resend, reissue, correction, export, or replay target.

## Artifact Provenance

`SupportLineageArtifactBinding` is required for every support-visible excerpt, derived summary,
record context, recovery note, resolution note, or future export. The implementation binds the
message reply excerpt and the related record summary to exact source lineage, source case link,
source artifact or evidence snapshot, mask scope, disclosure ceiling, and parity digest.

This blocks a support-authored note or copied transcript from becoming durable timeline truth unless
it cites a current source row.

## Ticket Workspace

`SupportTicketWorkspaceProjection` is the ticket anatomy contract for downstream tasks 220 to 222.
It returns:

- one ticket header
- one selected timeline anchor tuple
- timeline entry points derived from scope members
- one promoted subject 360 context
- artifact provenance refs
- allowed action refs
- same-shell read-only fallback when the binding or runtime posture drifts

The query surface is `GET /ops/support/tickets/:supportTicketId`.

## Subject 360

`SupportSubject360Projection` is compact and masked. It contains masked identity summary, contact
route health, scoped open objects, recent outcome refs, repeat-contact signal, scope-member refs,
artifact-binding refs, and disclosure-record refs.

The projection deliberately excludes raw demographics, full names, addresses, unrestricted thread
content, and broad historical chronology.

## Subject History

`SupportSubjectHistoryQuery` and `SupportSubjectHistoryProjection` are summary-first. Default
queries return masked summaries only. A request for detail must produce one
`SupportContextDisclosureRecord` with:

- requesting support user
- reason code
- requested and approved mode
- mask scope
- disclosure ceiling
- revealed scope members
- revealed artifact bindings
- expiry

If the context binding, ticket version, runtime binding, or mask scope is stale, the query remains
summary-only and the ticket shell preserves the current anchor.

## Downstream Contract

Support frontend tasks must consume the published contract and atlas instead of recomputing
support-local state. The machine-readable contract is
`data/contracts/218_support_lineage_ticket_subject_history_contract.json`.

Sibling task 219 may add controlled resend, delivery repair, replay, and action-workbench objects,
but it must reuse the current `SupportLineageBinding`, actionable `SupportLineageScopeMember`, and
artifact provenance refs created here.

## Official Guidance Used

- NHS service manual accessibility: <https://service-manual.nhs.uk/accessibility>
- WCAG 2.2 quick reference: <https://www.w3.org/WAI/WCAG22/quickref/>
- OWASP Authorization Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html>
- OWASP Logging Cheat Sheet: <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>
- Playwright ARIA snapshots: <https://playwright.dev/docs/aria-snapshots>
- Playwright screenshots: <https://playwright.dev/docs/screenshots>
