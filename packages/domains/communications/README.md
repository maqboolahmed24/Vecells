# Communications Domain

## Purpose

Canonical package home for the Communications bounded context.

## Ownership

- Package: `@vecells/domain-communications`
- Artifact id: `package_domains_communications`
- Owning context: `Communications` (`communications`)
- Source contexts covered: callback_messaging
- Canonical object families: `14`
- Versioning posture: `workspace-private domain boundary with explicit public exports`

## Source Refs

- `prompt/044.md`
- `blueprint/phase-0-the-foundation-protocol.md#BoundedContextDescriptor`

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

- `ownedObjectFamilies`
- `aggregateFamilies` (1)
- `domainServiceFamilies` (0)
- `eventFamilies` (0)
- `policyFamilies` (2)
- `projectionFamilies` (0)
- `bootstrapDomainModule()`

## Family Coverage

- Dominant kinds: bundle=2, case=1, descriptor=1, gate=2, lease=2, other=1, record=4, thread=1
- Representative families: CallbackAttemptRecord, CallbackCase, CallbackExpectationEnvelope, CallbackIntentLease, CallbackOutcomeEvidenceBundle, CallbackResolutionGate, ClinicianMessageThread, MessageDeliveryEvidenceBundle, MessageDispatchEnvelope, PatientComposerLease, PatientConversationCluster, PatientUrgentDiversionState

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel`, `@vecells/event-contracts`, `@vecells/authz-policy`, and `@vecells/observability` public exports only.
