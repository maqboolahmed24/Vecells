# Intake Request Domain

## Purpose

Canonical package home for Phase 1 pre-submit intake validation, required-field truth, and submit-readiness law.

## Ownership

- Package: `@vecells/domain-intake-request`
- Artifact id: `package_domains_intake_request`
- Owning context: `Intake Request` (`intake_request`)
- Source contexts covered: `phase1_intake_validation`
- Canonical object families: `4`
- Versioning posture: `workspace-private domain boundary with explicit public exports`

## Source Refs

- `prompt/145.md`
- `prompt/shared_operating_contract_136_to_145.md`
- `data/analysis/143_phase1_shared_interface_seams.json#SEAM_143_VALIDATION_AND_REQUIRED_FIELD_DISCIPLINE`

## Allowed Dependencies

- `packages/domain-kernel`
- `packages/event-contracts`
- `packages/authz-policy`
- `packages/observability`

## Forbidden Dependencies

- `packages/domains/* sibling internals`
- `apps/*`
- `services/*`
- `packages/design-system`

## Public API

- `phase1QuestionDefinitions`
- `defaultPhase1IntakeExperienceBundles`
- `createSubmissionEnvelopeValidationService()`
- `buildRequiredFieldMeaningMap()`
- `bootstrapDomainModule()`
