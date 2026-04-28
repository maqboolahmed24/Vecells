# 56 Command Settlement And Same-Shell Recovery Rules

            `CommandSettlementRecord.authoritativeOutcomeState` is the only settlement dimension allowed to drive calm success, terminal reassurance, or shell collapse. Processing acceptance and external observation may widen guidance, but they may not stand in for business settlement.

            ## Settlement Ladder

            | Settlement row | Result | Processing acceptance | External observation | Authoritative outcome | Calm return eligible |
| --- | --- | --- | --- | --- | --- |
| CSR_056_PENDING_PROCESSING_V1 | pending | accepted_for_processing | unobserved | pending | no |
| CSR_056_AWAITING_EXTERNAL_V1 | awaiting_external | awaiting_external_confirmation | external_effect_observed | awaiting_external | no |
| CSR_056_APPLIED_NOT_SETTLED_V1 | applied | externally_accepted | projection_visible | projection_pending | no |
| CSR_056_APPLIED_SETTLED_V1 | applied | externally_accepted | projection_visible | settled | yes |
| CSR_056_REVIEW_REQUIRED_V1 | review_required | accepted_for_processing | review_disposition_observed | review_required | no |
| CSR_056_RECONCILIATION_REQUIRED_V1 | reconciliation_required | externally_accepted | disputed | reconciliation_required | no |
| CSR_056_STALE_RECOVERABLE_V1 | stale_recoverable | not_started | recovery_observed | stale_recoverable | no |
| CSR_056_BLOCKED_POLICY_V1 | blocked_policy | not_started | recovery_observed | recovery_required | no |
| CSR_056_DENIED_SCOPE_V1 | denied_scope | not_started | recovery_observed | recovery_required | no |
| CSR_056_EXPIRED_V1 | expired | timed_out | expired | expired | no |

            ## Recovery Mapping

            | Result class | Recovery envelope | Next action | Preserve anchor |
| --- | --- | --- | --- |
| stale_recoverable | RecoveryEnvelope::tuple-rebind | Refresh current action | yes |
| blocked_policy | RecoveryEnvelope::policy-hold | View governing policy hold | yes |
| denied_scope | RecoveryEnvelope::scope-switch | Reissue authority | yes |
| expired | RecoveryEnvelope::reissue-or-step-up | Reissue access | yes |
| review_required | RecoveryEnvelope::review-hold | View review disposition | yes |
| reconciliation_required | RecoveryEnvelope::reconciliation-hold | Resolve disputed evidence | yes |
| publication_stale | RecoveryEnvelope::runtime-watch-refresh | Refresh published runtime tuple | yes |
| contact_repair_required | RecoveryEnvelope::contact-route-repair | Repair contact route | yes |

            ## Non-Negotiable Settlement Rules

            - Transport or HTTP success is never authoritative business success.
            - `applied` may still remain `projection_pending`; calm return still stays blocked.
            - `review_required`, `reconciliation_required`, `stale_recoverable`, `blocked_policy`, `denied_scope`, and `expired` must each return one same-shell recovery envelope.
            - Every mutation persists both an action record and a settlement record even when dispatch never starts.
