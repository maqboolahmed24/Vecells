# 193 Exact-Once Promotion And Receipt Parity

## Replay Handling

Exact replay returns the prior convergence outcome when the idempotency key and source hash match. Semantic replay returns the prior outcome when the source lineage and semantic replay key match. Neither path creates a new capture bundle, evidence snapshot, ingress record, normalized submission, promotion, or receipt.

Idempotency collision creates one frozen collision-review branch. It does not reopen a promoted envelope and does not enter normal triage or receipt issuance.

## Promotion Rules

Promotion is allowed only when the latest `SubmissionIngressRecord` and `NormalizedSubmission` both point at the frozen evidence cut and:

- evidence readiness is `safety_usable`;
- duplicate decision is not `exact_retry_collapse`;
- duplicate decision is not `same_request_attach`;
- the command is not in collision review;
- capability ceiling does not block mutation.

The service then calls the canonical submission backbone. The backbone owns compare-and-set promotion and emits one `SubmissionPromotionRecord`.

## Receipt And Status Parity

The receipt/status projection uses `phase2-receipt-consistency-193.v1`. Web, embedded, phone, secure-link continuation, and support-assisted paths use the same key grammar and promise states. Channel labels are provenance only; they do not alter ETA bucket, promise state, or recovery posture for equivalent facts.

Same-request attach and promotion replay return the existing request shell and do not issue a second receipt. Pending, urgent-live, manual-review, and collision-review states expose status truth but no routine submitted receipt.

## Operational Holds

`evidence_pending` keeps the same shell pending until a later readiness assessment resumes. `urgent_live_only` routes to urgent-live follow-up. `manual_review_only` and `unusable_terminal` route to governed manual follow-up. None of these states may display calm routine submission truth before promotion lawfully settles.
