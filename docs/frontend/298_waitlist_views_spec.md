# 298 Waitlist views spec

`PatientWaitlistViews` in `Waitlist_Continuation_Studio` is the patient-facing waitlist child surface for the signed-in booking shell.

## Route

- `/bookings/:bookingCaseId/waitlist`

## Required regions

- `WaitlistPreferenceSummary`
- `ActiveWaitlistOfferCard`
- `WaitlistContinuationStatePanel`
- `JoinWaitlistSheet`
- `WaitlistManageView`
- `WaitlistOfferAcceptView`
- `WaitlistExpiryOutcome`
- `WaitlistFallbackPanel`
- `WaitlistContactRepairMorph`
- `ExpiryOrSupersessionProvenanceCard`

## Behavior

- Keep the preference summary visible before join, while waiting, while an offer is live, and after expiry or supersession.
- Keep the active offer card pinned through accept, pending confirmation, expiry, supersession, and contact-route repair.
- Show held language and countdown only when the current reservation truth is `exclusive_held`.
- Use nonexclusive wording when the current offer is still subject to live confirmation.
- Switch the dominant action from waiting to governed fallback when the continuation truth reaches `fallback_due` or `overdue`.
- Keep contact-route repair in the same viewport with the blocked offer context still visible.
- Keep secure-link offer acceptance inside the signed-in booking shell with the same summary rail and support path.

## Gating law

- `ReservationTruthProjection` is the only authority for held, nonexclusive, pending, expired, and released offer wording.
- `WaitlistContinuationTruthProjection` is the only authority for waiting, offer-available, accepted-pending, callback-expected, expired, fallback-due, and overdue posture.
- `WaitlistFallbackObligation` remains armed until authoritative booking truth or durable fallback transfer settles.
- Reachability and contact-route repair govern whether offer acceptance or fallback movement may remain writable.
- Secure-link entry may not become a detached mini-site; it must rebind to the same booking continuation before writable actions appear.

## Copy law

- Keep wording short, factual, and action-led.
- Use one dominant action per state.
- Preserve expired or superseded context as read-only provenance instead of quietly removing it.
- Avoid dashboard or inbox framing.
- Avoid countdown language unless the current reservation truth allows it.

## Reference posture

- NHS guidance informs verb-first buttons, summary-first panels, calm interruption or expiry language, and concise plain-English copy.
- Carbon informs lightweight empty or blocked states, dialog restraint, and the difference between disabled and read-only posture.
- WCAG 2.2 and WAI-ARIA APG govern reflow, status messages, focus handling, and alert or dialog behavior where needed.
- Playwright governs state proofs, visual snapshots, accessibility coverage, and trace capture.
