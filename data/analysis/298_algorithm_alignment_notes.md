# 298 Algorithm alignment notes

## Visible state mapping

| Visible state | Continuation truth | Reservation truth | Reachability | Fallback obligation | UI result |
| --- | --- | --- | --- | --- | --- |
| join sheet | pre-join | none | current | stay local waitlist | show `JoinWaitlistSheet` and current preference summary |
| waiting | waiting_for_offer + on_track | none | current | stay local waitlist | show `WaitlistManageView` with no fake offer urgency |
| waiting at risk | waiting_for_offer + at_risk | none | current | stay local waitlist | show waitlist status with warning but no fallback takeover yet |
| live offer nonexclusive | offer_available + on_track | truthful_nonexclusive | current | stay local waitlist | show `WaitlistOfferAcceptView` with honest nonexclusive wording |
| live offer held | offer_available + on_track | exclusive_held | current | stay local waitlist | show `WaitlistOfferAcceptView` with real hold countdown |
| accepted pending | accepted_pending_booking + on_track | pending_confirmation | current | stay local waitlist | keep offer pinned and suppress booked reassurance |
| expired offer | expired + on_track | expired | current | stay local waitlist | keep provenance card visible and switch to next safe action |
| superseded offer | offer_available + on_track | released | current | stay local waitlist | keep superseded provenance visible and move action to newer offer |
| fallback due | waiting_for_offer + fallback_due | none | current | callback armed | switch dominant action to governed fallback |
| overdue callback | callback_expected + overdue | none | current | callback transferred | suppress offer acceptance and keep callback posture explicit |
| contact repair | offer_available + on_track | truthful_nonexclusive | repair_required | stay local waitlist | preserve live offer context and morph to in-place repair |
| secure-link offer | offer_available + at_risk | truthful_nonexclusive | current | stay local waitlist | keep the same shell chrome and pinned offer context |

## Explicit closures

- Fake urgency gap: only `exclusive_held` with `hold_expiry` shows a countdown.
- Detached secure-link gap: secure-link routes stay inside `/bookings/:bookingCaseId/waitlist` with the same preference rail.
- Expired-offer-loses-context gap: expired and superseded offers keep a provenance card in the same layout.
- Indefinite-waitlist gap: `fallback_due` and `overdue` switch the dominant action to callback.
- Detached-contact-repair gap: contact repair stays inline with the offer context still visible.
