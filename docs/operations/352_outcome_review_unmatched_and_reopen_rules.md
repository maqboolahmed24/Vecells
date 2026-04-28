# 352 Outcome Review, Unmatched, And Reopen Rules

This note defines the operator posture for the backend outcome review family landed in `352`.

## Review queue entry rules

`PharmacyOutcomeReconciliationGate` opens when any of the following is true:

- replay posture is `collision_review`
- match state is not `strong_match`
- trust class is low assurance and trusted-correlation auto-apply is not available
- operator policy explicitly requires review

Review gates are closure blockers. They are not informational-only artifacts.

## When not to auto-apply

Do not auto-apply when:

- the evidence is low-assurance and lacks a trustworthy correlation chain
- the source key is reused with materially different meaning
- the candidate match is weak or contradicted
- the consent checkpoint is revoked or under withdrawal reconciliation
- safety assimilation explicitly blocks automatic settlement

## Reopen-for-safety rules

Strongly matched outcome evidence should reopen instead of resolve when the authoritative branch indicates safety escalation, including:

- `urgent_gp_action`
- `onward_referral`
- `pharmacy_unable_to_complete`
- other evidence that the Phase 0 safety bridge classifies to `re_safety_required`

These cases settle to `reopened_for_safety` and move the pharmacy case onto the bounce-back or urgent path. They do not linger in calm review unless the safety bridge explicitly demands manual review.

## Manual review resolutions

Operators resolve a gate through exactly one of:

- `apply`
- `reopen`
- `unmatched`

Effects:

- `apply` settles the reviewed outcome through the same outcome-truth family and removes the outcome gate blocker.
- `reopen` preserves the reviewed evidence but routes the case into the safety reopening path.
- `unmatched` closes the review item as unmatched evidence and does not mutate the pharmacy case again.

## Unmatched handling

`unmatched` is a terminal ingest settlement for that evidence chain, not a hidden review placeholder. It means:

- the evidence was received and preserved
- the evidence did not win a lawful case match
- the case was not mutated from this evidence

Later queue and console work must read unmatched posture from the 352 settlement family rather than re-parsing raw source payloads.

## Replay handling

The following must never mint a second downstream mutation:

- repeated Update Record observations for the same outcome
- duplicate email deliveries
- repeated manual capture of the same normalized outcome meaning

Accepted replay returns `duplicate_ignored` and preserves prior truth.

## Audit expectations

Every ingest and review-resolution flow writes:

- immutable envelope evidence
- ingest attempt
- optional review gate
- settlement
- audit event

That gives operations and assurance work a deterministic trail from inbound artifact to final truth posture.
