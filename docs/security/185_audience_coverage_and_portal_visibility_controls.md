# Audience Coverage And Portal Visibility Controls

Authenticated portal access is not blanket access. `AuthenticatedPortalProjectionService` treats `PatientAudienceCoverageProjection` as the access-control decision for patient portal reads and mutations.

## Controls

- Coverage is computed before list, detail, timeline, message, artifact, and CTA projections.
- Public and authenticated audiences use distinct projection families and coverage row refs.
- `PatientCommunicationVisibilityProjection` governs preview depth for callback and clinician-message content.
- `PatientRequestDetailProjection` may disclose more than a list row only when it remains bound to the same lineage tuple, coverage projection, shell consistency projection, and route tuple.
- `PatientActionRecoveryProjection` replaces detail when session, binding, route intent, lineage fence, grant, or command consistency is stale.
- `PatientIdentityHoldProjection` replaces PHI-bearing detail during wrong-patient repair, suppressing writable action refs until release settlement.

## No-Leak Rules

Portal projections expose refs, hashes, status labels, summary tiers, placeholders, and reason codes. They must not expose raw NHS numbers, full phone numbers, OAuth tokens, raw OIDC claims, transcript bodies, raw evidence blobs, or attachment contents in projections, logs, URLs, screenshots, or browser artifacts.

Authenticated status views may still narrow to `summary_only`, `action_disabled`, `read_only`, `pending_confirmation`, `recovery_required`, or `identity_hold`. A signed-in session alone does not grant every request detail, every conversation body, or every artifact preview.

## Auditable Decisions

Every projection carries policy version, coverage refs, route family refs, route-intent refs, session epoch where applicable, subject binding version via route tuple, lineage fence, surface state, and reason codes. These are sufficient for later identity audit work to reconstruct why a list row, detail route, message preview, or CTA was visible, suppressed, or degraded.

## OWASP Alignment

The controls follow least privilege, deny-or-degrade defaults, server-side authorization, and secure session management. UI code receives only projection-safe fields; it does not implement hidden access policy after receiving a broad payload.
