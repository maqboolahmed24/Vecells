# Phone Follow-Up Re-Safety And Projection Freeze Rules

## Data Handling

Late phone follow-up ingestion stores refs, hashes, and redacted provenance only. Raw provider payloads, raw phone numbers, signed continuation URLs, audio bytes, transcript blobs, full NHS numbers, and PHI-rich diagnostic payloads are not allowed in logs, route params, projection keys, or analysis artifacts.

## Fail-Closed Attachment

Same-request attach requires an explicit continuity witness. The service rejects score-only attach because a duplicate score is not authority to mutate a submitted request. Drifted route, subject, release, request, episode, or lineage fences move the batch to review or separate-request posture.

## Safety Reassessment

Contact-safety relevant and clinically material deltas create canonical materiality and classification records before any request or projection behavior changes. `re_safety_required` and `blocked_manual_review` open a `SafetyPreemptionRecord`; degraded transcripts use `artifact_degraded` fallback rather than silent acceptance.

## Projection Truth

Patient and staff projections may not show calm, closed, or fully reviewed copy while:

- a duplicate evaluation requires review
- a material delta requires re-safety
- a safety preemption is pending or blocked
- a degraded transcript blocks classification confidence
- continuity was not proven and a separate request posture is active

The machine-readable hold contract is `data/contracts/194_phone_followup_projection_hold_contract.json`. Frontends must render from this contract and settled reason codes, not local UI guesses.
