# 349 Referral Package Composer And Governance Binding

## Scope

`par_349_phase6_track_backend_build_referral_pack_composer_and_content_governance_binding`
publishes the transport-neutral pharmacy referral package as one immutable backend authority.

The runtime lives in
`/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-referral-package-engine.ts`.

## Runtime shape

The engine owns:

- `PharmacyReferralPackage`
- `PharmacyPackageArtifact`
- `PharmacyPackageContentGovernanceDecision`
- `PharmacyReferralPackageFreezeRecord`
- `PharmacyReferralPackageSupersessionRecord`
- `PharmacyReferralPackageInvalidationRecord`
- `PharmacyCorrelationRecord`

The public service boundary is:

- `validatePackageTuple`
- `composeDraftPackage`
- `freezePackage`
- `supersedePackage`
- `invalidatePackage`
- `getPackageById`
- `getCurrentPackageForCase`
- `replayCanonicalRepresentationGeneration`

## Composition law

Freeze resolves exactly one governing tuple:

- `PharmacyCase`
- current selected `PharmacyProvider`
- current `PharmacyChoiceProof`
- current selected `PharmacyChoiceExplanation`
- current `PharmacyProviderCapabilitySnapshot`
- current `PharmacyConsentCheckpoint`
- caller-supplied compiled policy bundle
- caller-supplied route-intent binding and route-intent tuple

The tuple is reduced into:

- a deterministic `packageFingerprint`
- a deterministic `packageHash`
- a transport-neutral canonical payload for the pharmacy referral boundary
- one canonical `FhirRepresentationSet`

The package only freezes if the tuple remains valid at freeze time.

## Content-governance law

Every candidate lane is evaluated into one typed decision:

- `included`
- `excluded_by_policy`
- `included_redaction_required`
- `included_summary_only`
- `unavailable`

Each decision keeps:

- source artifact ref
- source hash
- derivation ref
- visibility policy ref
- minimum-necessary contract ref
- reason code
- resulting artifact ref or recorded absence reason

Adapters do not get to widen or re-decide package content later. `350` must consume this frozen
package boundary and may only perform transport-specific transformation from it.

## Representation law

349 uses the shared FHIR compiler directly, but freezes the package against a transport-neutral
representation contract clone with bundle emission disabled. The aggregate version ref is derived
from `packageHash`, so the same frozen tuple deterministically rematerializes the same
`FhirRepresentationSet`.

The freeze path materializes twice and requires the second pass to replay the first representation
set. Replay drift is therefore a hard invariant failure rather than a silent mismatch.

## Supersession and invalidation law

The engine enforces append-only package history:

- a changed package tuple creates a new package
- a newer valid package supersedes the prior frozen package
- an invalid tuple invalidates the current frozen package
- frozen packages are never mutated in place back into a composing state

The real upstream law gap found during 349 was in the case kernel, not the package service: the
kernel previously rejected `consent_pending -> package_ready` for `pharmacy.package.composed`.
349 closes that by adding the missing transition so `package_ready` now means a durable frozen
package exists, not merely that consent was captured.
