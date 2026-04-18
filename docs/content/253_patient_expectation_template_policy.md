# 253 Patient Expectation Template Policy

## Policy

Patient expectation wording must be versioned content, not route-local prose.

The registry supports:

- self-care guidance
- self-care safety-net wording
- bounded admin waiting wording
- bounded admin completion wording
- blocked or recovery wording when only partial visibility is legal

## Required provenance

Each active version must record:

- authoring provenance
- approval or policy provenance where relevant
- active or superseded state
- channel coverage
- locale coverage
- readability coverage
- accessibility coverage

## Delivery rules

Every live template version must publish:

- one `full` variant
- one `summary_safe` variant
- one `placeholder_safe` variant

Variants are selected deterministically across:

- channel
- locale
- reading level
- accessibility variant
- audience tier
- release state
- visibility tier
- summary-safety tier

## Prohibited shortcuts

- do not embed expectation copy in queue notes
- do not embed expectation copy in worker-only strings
- do not treat a completion artifact summary as the only expectation source
- do not let analytics counters redefine the visible wording

## Fallback posture

When full visibility is no longer legal, resolution must fail closed to:

1. `summary_safe`
2. `placeholder_safe`

and never widen back to full copy without a fresh legal tuple.
