# 159 Contact Preference Editor And Masked Summary

`par_159` turns the patient intake contact step into a real same-shell editor backed by the frozen `par_147` capture contract and the `par_153` confirmation-dispatch semantics.

## Outcome

- `ChannelPreferenceStack` handles preferred-route selection without implying verification.
- `RouteEntryPanel` keeps raw route values inside the active edit surface only.
- `RouteMaskedSummaryCard` and recap chips render masked values only.
- `ConfirmationCopyPreview` binds to the same summary tuple and keeps delivery truth separate from preference capture.
- `TrustBoundaryNote` makes the route-truth and delivery boundary explicit in plain language.

## Authoritative Tuple

The step now renders one machine-readable tuple:

1. What the patient chose now.
2. What ordinary masked summaries may say now.
3. Whether the capture is complete enough for review.
4. Whether the change is contact-safety-relevant and needs review emphasis.
5. Which later confirmation-copy state is lawful without implying verification or delivery.

That tuple is published in [159_contact_summary_view_contract.json](/Users/test/Code/V/data/contracts/159_contact_summary_view_contract.json) and exercised through [159_contact_preference_state_matrix.csv](/Users/test/Code/V/data/analysis/159_contact_preference_state_matrix.csv).

## Masking Law

- Raw destination values remain in the active input only.
- Summary chips, recap cards, confirmation previews, gallery artifacts, and later receipt/status surfaces must use masked values only.
- Preference capture does not equal verified route truth.
- Queueing or transport acceptance does not equal delivery evidence.
- Calm delivery language is reserved for the later `delivery_confirmed` state only.

## Review Cues

The UI now surfaces bounded review cues when any of these change families are present:

- preferred channel
- preferred or alternate destination
- follow-up permission
- contact timing or quiet hours
- language or accessibility support

Those deltas collapse into `CONTACT_PREF_ROUTE_DELTA_POTENTIALLY_CONTACT_SAFETY_RELEVANT` so the patient sees a clear review note before submit instead of a visually trivial change.
