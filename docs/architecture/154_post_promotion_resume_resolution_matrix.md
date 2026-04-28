# 154 Post Promotion Resume Resolution Matrix

The authoritative resolver for stale draft entry is `DraftSessionAutosaveService.resolveDraftRouteEntry`. Frontend shells should consume the contract in `data/contracts/154_resume_blocking_and_recovery_contract.json` rather than rebuilding these decisions from local state.

| Scenario | Presented proof | Promoted request state | Resolution | Target |
| --- | --- | --- | --- | --- |
| Mutable draft refresh before promotion | valid grant | none | `draft_mutable` | resume the draft route already stored on the continuity projection |
| Refresh or stale tab after routine submit | superseded same-lineage grant or lease | routine receipt / `triage_ready` | `request_redirect` | `/intake/requests/:requestPublicId/receipt` |
| Refresh after the request becomes active | superseded same-lineage grant or lease | `triage_active` or later non-urgent state | `request_redirect` | `/intake/requests/:requestPublicId/status` |
| Auth return after urgent submit | superseded same-lineage grant or lease | urgent diverted | `request_redirect` | `/intake/requests/:requestPublicId/urgent-guidance` |
| Copied stale draft link without lawful request-view proof | none | promoted | `denied_scope` | bounded blocked-policy recovery route |
| Broken or missing draft proof before any promoted request view is lawful | none | not promoted or not lawfully recoverable | `recovery_only` | `/intake/drafts/:draftPublicId/recovery` |

## Reason-code contract

- `DRAFT_PROMOTED_IMMUTABLE_SUBMIT_BOUNDARY`: submit committed and the draft lineage is no longer mutable.
- `PROMOTED_REQUEST_AVAILABLE`: same-lineage request truth exists and may be used for redirect when proof allows.
- `GAP_RESOLVED_POST_PROMOTION_RECOVERY_ROUTE_ENTRY_V1`: bounded gap closure for the shared route-entry and recovery tuple family.
- `PROMOTED_REQUEST_VIEW_NOT_GRANTED`: the draft token or lease does not lawfully widen to request-view scope.
- `DRAFT_ROUTE_ENTRY_RECOVERY_REQUIRED`: no promoted request continuation is available, so the stale draft must fall into bounded recovery.

## Shell expectations

- Request redirect is authoritative, not advisory. A frontend may decorate it, but may not reopen a draft editor.
- `denied_scope` must stay PHI-safe and may not reveal request details.
- `recovery_only` is still same-shell continuity, not a generic dead-end link-expired page.
