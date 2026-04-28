# 368 Algorithm Alignment Notes

## Primary source order used

1. `blueprint/phase-6-the-pharmacy-loop.md`
2. `blueprint/vecells-complete-end-to-end-flow.md`
3. `blueprint/patient-account-and-communications-blueprint.md`
4. `blueprint/patient-portal-experience-architecture-blueprint.md`
5. `blueprint/staff-operations-and-support-blueprint.md`
6. `blueprint/platform-frontend-blueprint.md`
7. validated outputs `346` to `367`

## Merge decisions frozen in 368

### Request-to-pharmacy bindings

- `request_211_b` binds to `PHC-2057` as the triage-created pending pharmacy continuation.
- `request_215_callback` binds to `PHC-2103` as the urgent-return / bounce-back reopen path.
- `request_215_closed` binds to `PHC-2196` as the settled outcome path.

### Why these bindings were chosen

- They reuse authoritative Phase 6 patient-status, dispatch, and bounce-back previews already present in the repository.
- They let the wider product prove one pending, one reopened urgent-return, and one completed lineage without inventing synthetic pharmacy states.
- They leave legacy Phase 3 / Phase 4 request-detail proof around `request_211_a` intact.

## Product-path mapping

1. Triage or staff-entry decides the pharmacy route.
2. The parent request remains the anchor.
3. `PharmacyLoopMergeSnapshot` resolves the correct pharmacy case for request detail, messages, staff-entry, and ops.
4. Patient messages reuse the same merge snapshot instead of local route-based guesses.
5. Urgent-return work promotes to the shared ops board via `ops-route-pharmacy-2103`.
6. Support replay and audit stay anchored to the parent request and pharmacy case together.

## Gaps considered

- No new `PHASE6_BATCH_364_371_INTERFACE_GAP_PRODUCT_MERGE.json` was required.
- Existing 349/350/355 and 364/365 foundations were sufficient once request detail, messages, staff-entry, and ops consumed the same merge adapter.
