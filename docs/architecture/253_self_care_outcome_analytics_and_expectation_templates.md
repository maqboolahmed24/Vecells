# 253 Self-care Outcome Analytics And Expectation Templates

## Intent

`253` closes two gaps at the same time:

1. patient expectation wording is no longer hidden as inline prose in workers or route code
2. self-care and bounded-admin outcome analytics become typed records without acquiring operational authority

The implementation publishes one canonical backend layer for:

- `PatientExpectationTemplate`
- `PatientExpectationTemplateVersion`
- `PatientExpectationTemplateVariant`
- `AdviceUsageAnalyticsRecord`
- `AdviceFollowUpWatchWindow`

## Governing rules

- `SelfCareBoundaryDecision` still decides whether the tuple is self-care or bounded admin
- `AdviceAdminDependencySet` still decides whether consequence may continue
- `AdviceRenderSettlement` and later `AdminResolutionSettlement` remain operational authority
- analytics stay observational only and never re-open, complete, or validate consequence by themselves

## Template registry

Every expectation template resolves through one typed registry row and one active version.
Each version carries:

- authoring provenance
- approval or policy provenance
- explicit channel coverage
- explicit locale coverage
- explicit readability coverage
- explicit accessibility coverage
- active versus superseded state

Every version publishes three delivery modes:

- `full`
- `summary_safe`
- `placeholder_safe`

That makes release-aware, visibility-aware, and summary-safe delivery deterministic instead of implicit.

## Selection model

Expectation selection binds to the live tuple:

- `boundaryDecisionRef`
- `boundaryTupleHash`
- `decisionEpochRef`
- consequence class
- subtype or completion artifact when admin work is active
- current channel and locale
- current audience tier
- requested delivery mode

Selection follows one strict order:

1. explicit template ref from the current consequence object
2. current active template version for that ref
3. exact variant match for channel, locale, audience, and delivery mode
4. safe downgrade to `summary_safe` or `placeholder_safe` when the requested mode is not legal

This keeps “what wording may the patient see right now?” deterministic and auditable.

## Analytics model

`AdviceUsageAnalyticsRecord` is a typed domain-adjacent record.
It always binds the live:

- `requestRef`
- `boundaryTupleHash`
- `decisionEpochRef`
- consequence class
- template version and variant
- advice bundle or admin completion refs where present
- channel, locale, readability, and audience metadata

Analytics record only what happened after consequence:

- issue
- open
- acknowledge
- recontact
- clinician re-entry trigger
- waiting update seen
- completion seen
- rollback review

Analytics never mutate:

- `AdviceRenderSettlement.renderState`
- `SelfCareBoundaryDecision`
- `AdviceAdminDependencySet`
- `AdminResolutionSettlement`

## Watch-window linkage

`AdviceFollowUpWatchWindow.linkedAnalyticsRefs` now points to typed `AdviceUsageAnalyticsRecord` ids.

Every linked window stays bound to:

- the current `boundaryTupleHash`
- the current `decisionEpochRef`
- consequence class
- `adviceBundleVersionRef`
- subtype context when present

That closes the old “watch window exists but nothing links to it” gap without turning watch data into operational authority.

## Temporary seams

Two temporary seams remain explicit:

1. the canonical template bodies are lazily seeded from governed refs because no dedicated authoring or localization control plane exists yet
2. warehouse export remains downstream of these records rather than a live subscriber in this slice

Those seams are recorded in `data/analysis/253_gap_log.json` and do not weaken tuple binding or authority boundaries.
