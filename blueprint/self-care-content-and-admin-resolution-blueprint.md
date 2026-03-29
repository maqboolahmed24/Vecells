# Self-care content and admin-resolution blueprint

## Purpose

Close two endpoint gaps by defining:

- governed self-care and safety-net content lifecycle
- explicit admin-resolution case lifecycle

## Self-care content governance

### Suggested objects

- `AdviceBundleVersion`
- `SafetyNetInstructionSet`
- `AdviceRuleLink`
- `ClinicalContentApprovalRecord`
- `ContentReviewSchedule`
- `AdviceUsageAnalyticsRecord`

### Required controls

- versioned content and safety-net text
- channel-specific preview
- readability and clarity standards
- approval workflow for clinical content
- expiry and review cadence
- rollback and supersession controls

### Outcome analytics

Track:

- advice issue volume by pathway
- recontact rates after advice
- escalation-after-advice rates
- content version performance

## Admin-resolution domain

### Core object

- `AdminResolutionCase`

### Suggested states

`queued -> in_progress -> awaiting_internal_action | awaiting_external_dependency | awaiting_practice_action -> patient_notified -> completed -> closed`

Reopen path:

`closed -> reopened -> in_progress`

### Suggested subtype categories

- document or letter workflow
- form workflow
- result follow-up workflow
- medication admin query
- registration or demographic update
- routed admin task

### Required controls

- explicit waiting-state reasons
- ownership and reassignment rules
- patient-visible waiting wording
- completion type taxonomy
- reopen triggers and lineage links

## Cross-domain behaviour

Self-care and admin-resolution states should flow into:

- patient account timeline
- staff start-of-day views
- audit and assurance evidence
- communications governance and template use
