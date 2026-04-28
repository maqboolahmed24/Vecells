# 328 Patient Network Alternative Choice Spec

## Purpose

`par_328` builds the patient-facing network alternative-choice route inside the same booking product family as local booking.

This route is not a marketplace, not a recommendation-first funnel, and not a detached mini-site. It is the governed patient choice surface for a network appointment when the ideal local slot is not currently available.

## Visual Mode

- visual mode: `Patient_Network_Open_Choice`
- route family: `rf_patient_network_alternative_choice`
- task root marker: `data-network-choice="true"`

## Layout

- main content width: `min(760px, 100%)`
- supporting rail: `280px` to `320px` depending on responsive stage
- desktop gutter: `24px`
- tablet gutter: `16px`
- mobile gutter: `12px`
- card stack gap: `16px`
- sticky action tray appears only after an explicit patient selection on folded layouts

The opening viewport must show the title, short explanation, and at least the first option card on common mobile sizes.

## Regions

### Hero

- `AlternativeOfferHero`
- truthful title, explanation, and time sensitivity
- secure-link or signed-in posture shown without changing route family

### Time and recovery strip

- `AlternativeOfferExpiryStrip`
- shows `reply_by`, `expired`, `superseded`, or recovery posture
- does not mint fake urgency outside a lawful current session

### Open-choice stack

- `AlternativeOfferCard` grouped by `windowLabel`
- full current patient-offerable set stays visible at once
- recommendation chips remain advisory and plain language only
- no hidden rows, no preselected option on first entry, no auto-accept

### Separate callback fallback

- `CallbackFallbackCard`
- appears beneath the ranked stack
- never inherits slot ordinals, ranked-row markers, or recommendation grammar

### Decision and support rail

- `AlternativeOfferSelectionPanel`
- current service and preference summary
- same-shell help and return stub

### Recovery and provenance

- `AlternativeOfferProvenanceStub`
- `OfferRouteRepairPanel`
- keep last safe card context in place for stale-link, wrong-patient, expiry, supersession, embedded drift, publication drift, and contact-route repair

## Choice law

- recommendation guides but never chooses for the patient
- the full current choice set remains visible while the route is live
- callback remains a visibly separate governed fallback action
- decline-all does not silently trigger callback
- regenerated sets may preserve the selected card anchor, but they do not auto-accept it

## Recovery law

- stale secure links fail closed and keep read-only provenance
- wrong-patient posture shows summary-only provenance and blocks fresh actions
- superseded and expired sets remain visible as provenance
- embedded drift and publication drift preserve the selected anchor and fail closed on fresh mutation
- contact-route repair stays same-shell and can reopen the current choice set with the preserved anchor

## DOM markers

- `data-network-choice`
- `data-offer-session`
- `data-choice-actionability`
- `data-offer-state`
- `data-confirmation-truth`
- `data-selected-offer-entry`
- `data-selected-anchor-ref`
- `data-selected-anchor-tuple-hash`
- `data-callback-fallback`
- `data-offer-provenance`
- `data-repair-state`

## Proof requirements

- live route renders four visible option cards with no preselected choice
- recommendation chips stay advisory only
- callback remains outside the radiogroup
- accept, decline-all, and callback request update truthful route posture without leaving the shell
- superseded, expired, stale-link, wrong-patient, embedded drift, and publication drift routes preserve last-safe context
- mobile and embedded routes remain folded versions of the same semantics
- radio-group keyboard navigation, live-region announcements, and reduced-motion parity remain intact
