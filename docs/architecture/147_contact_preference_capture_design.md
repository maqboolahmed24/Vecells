# 147 Contact Preference Capture Design

`par_147` turns contact preferences into a backend-owned Phase 1 contract on the same `SubmissionEnvelope` lineage instead of leaving them as a UI-only field cluster.

## Authoritative objects

- `Phase1ContactPreferenceCapture`
  Protected append-only record containing the raw destinations, the source authority class, the capture hash, and machine-readable change reasons.
- `Phase1ContactPreferenceMaskedView`
  Ordinary-surface summary that exposes only masked destinations and completeness truth.
- `Phase1ContactRouteSnapshotSeed`
  Non-sensitive bridge object that carries the exact route seed required to mint a future `ContactRouteSnapshot` without reading mutable preference rows directly.
- `Phase1ContactPreferenceSubmitFreeze`
  Immutable submit-time freeze that pins the current capture, masked view, and route-seed bridge for later normalization and promotion.

## Capture rules

1. Contact-preference writes are replay-safe by `draftPublicId + idempotencyKey`.
2. Divergent payloads append a new protected capture version; they do not overwrite prior protected evidence.
3. Raw destinations stay only in protected capture rows.
4. Masked summaries are persisted separately and are the only ordinary-surface representation.
5. The preferred channel must map to a matching destination before completeness becomes `complete`.
6. Follow-up permission must be explicit before completeness becomes `complete`.

## Phase 1 minimum field set

- `preferredChannel`
- `contactWindow`
- `voicemailAllowed`
- `followUpPermission`
- `destinations.sms`
- `destinations.phone`
- `destinations.email`
- `quietHours`
- `languagePreference`
- `translationRequired`
- `accessibilityNeeds`
- `sourceAuthorityClass`
- `sourceEvidenceRef`

This is the bounded `GAP_RESOLVED_CONTACT_PREFERENCE_MINIMUM_PHASE1_SELF_SERVICE_V1` resolution over the earlier minimal draft projection.

## Normalization and submit freeze

- The stable normalization reference is `contactPreferencesRef`.
- `contactPreferencesRef` is deterministic from the protected payload hash, not from a mutable profile row or transport callback.
- `Phase1ContactPreferenceSubmitFreeze` binds the latest protected capture to the immutable submission path so later tasks can write `NormalizedSubmission.contactPreferencesRef` without re-reading mutable draft state.

## Reachability boundary

- Patient-entered preference does not equal verified route truth.
- `Phase1ContactRouteSnapshotSeed` defaults to `verificationState = unverified`.
- No calm `ReachabilityAssessmentRecord(clear)` is created during capture.
- Later delivery-dependent flows must mint a governed `ContactRouteSnapshot` from the seed, then settle independent reachability truth on top of that snapshot.
