# 358 Pharmacy Chooser Spec

## Scope

`par_358` implements the patient pharmacy chooser inside the existing Phase 6 patient pharmacy shell at `/pharmacy/:pharmacyCaseId/choose`.

This surface is:

- list-first
- map-second
- proof-bound to the current `PharmacyChoiceTruthProjection`
- same-shell under warning and drift recovery

## Authoritative UI surfaces

- `PharmacyChoicePage`
- `PharmacyChoiceGroupSection`
- `PharmacyProviderCard`
- `PharmacyChoiceMap`
- `PharmacyOpenStateFilterBar`
- `PharmacyWarningAcknowledgementPanel`
- `PharmacyChosenProviderReview`
- `PharmacyChoiceDriftRecoveryStrip`

## State law

The chooser derives from one preview snapshot that carries:

- `PharmacyChoiceTruthProjection`
- `PharmacyChoiceProof`
- `PharmacyChoiceDisclosurePolicy`
- `PharmacyChoiceSession`
- `PharmacyChoiceExplanation[]`

The browser does not re-rank providers. It only:

- filters the current visible proof into `all`, `open_now`, and `open_later`
- partitions providers into `recommended` and `all_valid`
- synchronizes selection across the list and map
- blocks advance until warned-choice acknowledgement is completed where required

## Required behaviours

1. Keep the full visible choice set on screen.
2. Show recommended providers as guidance, not as a hidden top result.
3. Keep warned providers visible inside filter buckets.
4. Require explicit in-place acknowledgement for warned choices.
5. Preserve older selections as read-only provenance when proof drift invalidates them.
6. Keep the dominant next-step action in the shell `DecisionDock`.

## Scenario seeds

- `PHC-2048`: live choice set with no selection
- `PHC-2148`: warned selected provider requiring acknowledgement
- `PHC-2156`: refreshed choice proof with read-only prior selection provenance

## Shell integration

- Main region: chooser page and drift strip
- Rail: `PharmacyChosenProviderReview`
- Decision dock: focus list, focus warning panel, or continue to `instructions`

## Proof expectations

Playwright asserts:

- list and map order stay synchronized
- filter buckets keep warned providers visible
- warned choice cannot advance without acknowledgement
- drift preserves the previous selection as read-only provenance
- keyboard navigation works across filters, map toggle, cards, and warning panel
