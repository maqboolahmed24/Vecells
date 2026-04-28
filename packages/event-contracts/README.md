# Event Contracts

## Purpose

Canonical source for event namespaces, event contracts, normalization rules, and JSON Schema artifacts. Producers may not replace it with route-local names or payload drift.

## Ownership

- Package: `@vecells/event-contracts`
- Artifact id: `package_event_contracts`
- Owner lane: `Shared Contracts` (`shared_contracts`)
- Canonical object families: `12`
- Shared contract families: `1`
- Versioning posture: `workspace-private published contract boundary with explicit public exports`

## Source Refs

- `blueprint/phase-0-the-foundation-protocol.md#CanonicalEventContract`
- `blueprint/phase-0-the-foundation-protocol.md#CanonicalEventEnvelope`
- `prompt/044.md`
- `prompt/048.md`

## Consumers

- Boundary contracts: `CBC_041_COMMAND_API_TO_EVENT_CONTRACTS`, `CBC_041_PROJECTION_WORKER_TO_DOMAIN_PROJECTIONS`, `CBC_041_ADAPTER_SIMULATORS_TO_CONTRACT_AND_FIXTURE_PACKAGES`, `CBC_041_DOMAIN_PACKAGES_TO_EVENT_CONTRACTS`
- Consumer selectors: `packages/domains/*`, `services/adapter-simulators`, `services/command-api`, `services/projection-worker`

## Allowed Dependencies

- `packages/domain-kernel`

## Forbidden Dependencies

- `apps/*`
- `services/*` deep imports

## Registry Coverage

- Namespaces: `22`
- Active event contracts: `192`
- Active schema artifacts: `192`
- Envelope schema: `packages/event-contracts/schemas/canonical-event-envelope.v1.schema.json`
- Catalog: `packages/event-contracts/schemas/catalog.json`

## Public API

- `makeFoundationEvent()`
- `canonicalEventNamespaces`
- `canonicalEventContracts`
- `schemaArtifactCatalog`
- `publishedEventFamilies`
- `bootstrapSharedPackage()`

## Contract Families

- `CF_048_CANONICAL_EVENT_REGISTRY`: machine-readable namespace, contract, normalization, and schema authority for every published event family.

## Family Coverage

- Governing object families: `CanonicalEventNamespace`, `CanonicalEventContract`, `CanonicalEventEnvelope`, `CanonicalEventNormalizationRule`, `TelemetryEventContract`, `UIEventEnvelope`, and runtime signal families preserved from seq_044.
- Namespace coverage includes request, attachment, identity, patient, communication, booking, hub, pharmacy, support, governance, analytics, audit, assistive, release, runtime, and control-plane events.

## Safety Law

- Raw PHI, transcripts, message bodies, phone numbers, and binary payloads are forbidden in event schemas.
- Alias normalization is mandatory before downstream consumption.
- Compatibility and replay semantics are explicit on every contract row.

## Bootstrapping Test

`tests/public-api.test.ts` proves the package boots through `@vecells/domain-kernel` public exports and that schema/catalog counts stay aligned with the published event registry.
