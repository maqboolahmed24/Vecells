# Authenticated Portal Projection And Status Access Controls

`AuthenticatedPortalProjectionService` is the read-model boundary for signed-in portal entry, authenticated request lists, request detail, same-shell recovery, and identity hold. It consumes the coherent Phase 2 seams from `SessionGovernor`, `AccessGrantService`, `IdentityBindingAuthority`, `IdentityRepairOrchestrator`, and `SignedInRequestOwnershipService`; no `PARALLEL_INTERFACE_GAP_PHASE2_PORTAL.json` artifact is required.

## Projection Order

Every portal query follows a projection-first, minimum necessary access model: compute `PatientAudienceCoverageProjection` first, then materialize only the downstream projection fields allowed by that coverage row. The service then derives:

- `PatientPortalEntryProjection`
- `PatientHomeProjection`
- `PatientRequestsIndexProjection`
- `PatientRequestDetailProjection`
- `PatientCommunicationVisibilityProjection`
- `PatientActionRecoveryProjection`
- `PatientIdentityHoldProjection`
- `PatientSecureLinkSessionProjection`

The query layer must not fetch broad request, timeline, message, attachment, or artifact payloads and trim them in a controller. Coverage rows decide preview mode, timeline depth, artifact mode, mutation ceiling, blocked fields, placeholder contracts, and route-intent requirements before list or detail projections are materialized.

## Stable Query Surfaces

The command-api route catalog publishes these projection surfaces:

- `GET /v1/me` for `PatientPortalEntryProjection`
- `GET /v1/me/requests` for `PatientRequestsIndexProjection`
- `GET /v1/me/requests/{requestRef}` for `PatientRequestDetailProjection`
- `GET /v1/me/recovery/current` for `PatientActionRecoveryProjection`
- `GET /v1/me/identity-hold` for `PatientIdentityHoldProjection`

Future UI tasks consume this vocabulary directly. They should not infer trust posture from loose booleans or invent display-specific access semantics.

## Visibility Semantics

`patient_public` may see public-safe summaries, neutral request updates, recovery shells, and no PHI-bearing message bodies, attachments, timeline detail, or artifact previews. `patient_authenticated` may see richer request detail only when session epoch, subject binding version, route intent, lineage fence, trust posture, release posture, and command consistency all remain current.

List and detail are derived from the same `PatientAudienceCoverageProjection`. `PatientRequestsIndexProjection.bucketMembershipDigestRef`, `lineageOrderingDigestRef`, `PatientRequestLineageProjection.lineageTupleHash`, and `PatientRequestDetailProjection.lineageTupleHash` bind list rows and details to the same ordering, child chips, placeholders, awaiting-party posture, and next-safe-action grammar.

## Recovery And Hold

Stale session, stale binding, route-intent tuple drift, lineage-fence drift, and pending consistency do not collapse to generic home or generic empty states. They emit `PatientActionRecoveryProjection` with `PORTAL_185_SAME_SHELL_RECOVERY` and a current recovery tuple.

Wrong-patient repair and binding disputes emit `PatientIdentityHoldProjection`. That projection keeps the original request context at summary tier, suppresses PHI-bearing detail and writable actions, and waits for the repair case, freeze record, authority binding, and release settlement to align.

## Gap Closures

- `PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_CONTROLLER_LOCAL_TRIMMING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_AUTHENTICATED_NOT_EVERYTHING_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_SAME_SHELL_RECOVERY_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_STABLE_PROJECTION_VOCABULARY_V1`
- `PARALLEL_INTERFACE_GAP_PHASE2_PORTAL_LIST_DETAIL_COVERAGE_PARITY_V1`
