# 207 PDS Enrichment Boundary Matrix

Task: `seq_207`

The PDS matrix proves that enrichment is an optional evidence lane. It can improve demographic confidence only when every gate passes, and it never mutates patient binding, local communication preferences, or mutable request actions directly.

This matrix is paired with the duplicate follow-up re-safety matrix so PDS provenance and late-evidence safety truth are validated together.

| Case                                        | Adapter attempted | Canonical progression                                                       | Updated fields                                                       | Ignored or quarantined fields                                     | Provenance truth                                               | Mutable actions                                                      |
| ------------------------------------------- | ----------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `PDS207_FLAG_OFF_LOCAL_ONLY`                | No                | Local matching continues.                                                   | None.                                                                | PDS candidate is not requested.                                   | `PDS_183_DISABLED_BY_DEFAULT` gating decision.                 | Unaffected local actions continue; binding mutation remains blocked. |
| `PDS207_ON_SUCCESS_ENRICHED`                | Yes               | Canonical request proceeds with fresh PDS evidence available.               | Hashed demographic evidence, GP ref, snapshot refs, and source refs. | Raw demographics and communication preferences are not persisted. | `pds_fhir` source refs and retrieved timestamp.                | Binding mutation blocked; preference actions unaffected.             |
| `PDS207_ON_NO_MATCH`                        | Yes               | Local matching continues.                                                   | None.                                                                | Provider no-match result is not converted into a binding.         | Provider attempt and fallback reason are recorded.             | Binding mutation blocked; mutable clinical actions unaffected.       |
| `PDS207_ON_AMBIGUOUS_MATCH`                 | Yes               | Local matching continues with review posture.                               | None.                                                                | Ambiguous candidates are quarantined for review.                  | Parse or ambiguity fallback is explicit.                       | Binding mutation blocked; review-only posture.                       |
| `PDS207_DEGRADED_UPSTREAM`                  | Yes               | Local matching continues, or stale evidence is labelled stale if available. | Stale snapshot only when cache policy allows it.                     | Upstream timeout or provider error is quarantined.                | Timeout/provider failure reason and provenance penalty.        | Degraded evidence cannot unlock mutable binding actions.             |
| `PDS207_FLAG_TOGGLED_DURING_ACTIVE_REQUEST` | Yes               | The active request uses its captured gate and settles once.                 | Fresh snapshot when the captured gate allowed lookup.                | Later flag changes do not rewrite in-flight provenance.           | Request ref and gating ref stay tied to the captured decision. | No mid-flight mutation; replay returns settled chain.                |
| `PDS207_FLAG_OFF_AFTER_PRIOR_ENRICHMENT`    | No                | Local matching continues even if a prior enriched cache exists.             | None.                                                                | Prior PDS cache is ignored while disabled.                        | Disabled gating decision supersedes cache use.                 | Binding mutation blocked; local actions remain unaffected.           |
| `PDS207_LEGAL_BASIS_OR_ENV_GUARD_ABSENT`    | No                | Local matching continues.                                                   | None.                                                                | Lookup denied before adapter call.                                | Legal-basis or environment denial is explicit.                 | Binding mutation blocked; no provider-derived actions.               |
| `PDS207_CONFLICTING_CONTACT_DETAILS`        | Yes               | Canonical request proceeds with separated contact truth.                    | PDS demographic hashes only.                                         | PDS/NHS-login contact claims cannot overwrite local preferences.  | Data-class separation identifies contact conflict.             | Contact preference actions stay locally governed.                    |
| `PDS207_LATE_ENRICHMENT_AFTER_PREF_CHANGE`  | Yes               | PDS change signal queues refresh or review, not mutation.                   | Refresh ref only.                                                    | Late PDS contact data cannot roll back user preference change.    | Change signal says queued and mutation-prohibited.             | Preference mutation blocked; reachability remains local.             |

## Required Assertions

- Every row distinguishes whether the adapter was attempted.
- Canonical request handling always has a deterministic route when PDS is absent.
- Updated fields are restricted to refs, hashes, digests, freshness, source refs, and bounded change-signal refs.
- Ignored fields include raw demographics, PDS contact details that conflict with local preference truth, and any ambiguous candidate values.
- Provenance is never silent; the matrix records whether the truth came from gating, provider attempt, cache, fallback, or change signal.
- Mutable actions are either blocked, degraded, or explicitly unaffected. PDS never becomes binding authority.

## Validation Posture

Mock-now status is `passed` for all repository-owned rows. Live PDS provider evidence remains `not_applicable` until credentialled external access is available. Playwright covers the PDS off, PDS success, and PDS degraded visual states.
