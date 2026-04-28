# Phase 9 Essential Function Metrics Algorithm Alignment

The 438 metrics engine consumes lifecycle events from the existing waitlist, pharmacy, notification, conversation-settlement, assurance-trust, and graph-verdict projections. No new lifecycle interface gap artifact is required.

Waitlist conversion counts accepted offers only when an offer lifecycle has a booking commit. Expired, withdrawn, declined, or suppressed auto-fill paths remain in the denominator without becoming false conversions.

Pharmacy bounce-back metrics keep dispatch, outcome, urgent return, routine return, unable-to-contact, staff review, safe action, and reopen states separate so no-contact loops cannot close silently and reopened loops do not double-count the original bounce-back.

Notification metrics separate communication envelope creation, transport acceptance, provider acknowledgement, delivery, patient receipt, retries, and patient reply settlement. Provider acknowledgement failure updates delivery risk without counting a patient receipt.

Every snapshot carries source event refs, a bounded source window hash, metric definition ref, tenant and scope, normalization version, trust and completeness state, projection health ref, graph verdict ref, and explicit blockers.

Metric observations are fed into the task 437 operational projection engine so dashboards and alerts share one projection health posture instead of forming a silo.
