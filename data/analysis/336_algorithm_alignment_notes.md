# 336 Algorithm Alignment Notes

Reviewed for `seq_336` on `2026-04-23`.

## Local Source Of Truth

The governing implementation remains:

- `blueprint/phase-5-the-network-horizon.md`
- `blueprint/phase-0-the-foundation-protocol.md`
- `packages/domains/hub_coordination/src/phase5-network-capacity-pipeline.ts`
- `docs/architecture/318_capacity_ingestion_and_candidate_snapshot_pipeline.md`

## Binding Law

Each 336 partner-feed row must be able to support the same control-plane objects used by 318:

- `HubCapacityAdapterBindingSnapshot`
- `CapacitySourceTrustRecordInput`
- `NetworkSlotCandidate`
- `NetworkCandidateSnapshot`
- `CrossSiteDecisionPlan`
- `CapacityRankProof`

The 336 manifests therefore bind:

- `partner`
- `environment`
- `endpointIdentity`
- `adapterIdentity`
- `ODSCode`
- `siteRef`
- `serviceRef`
- `trustAdmissionState`
- `verificationState`

## Admission Mapping

The manifest trust classes map into the 318 capacity-ingestion law as follows:

- `trusted` -> ordinary admission path and normal candidate exposure
- `degraded` -> explicitly degraded admission only; no quiet normality
- `quarantined` -> explicit quarantine and `quarantined_hidden` posture
- `unsupported` -> no adapter binding is derived at all

## Why Site And Service Mapping Matter

The 318 raw capacity row does not carry `serviceRef` directly. 336 therefore keeps the site/service binding in the manifest and re-attaches it through `sourceRefs`, binding hash, and operator evidence so the adapter identity and the site/service map stay in one authority chain.

## Browser Automation Boundary

The local masked supplier twins prove convergence and verification behavior.

Real supported-test supplier-admin routes remain manual bridges because browser visibility alone is not sufficient proof that a feed is safe to treat as authoritative supply.
