# 100 Provenance Quarantine, Revocation, and Supersession Rules

## Canonical Outcomes

The authoritative policy matrix is `/Users/test/Code/V/data/analysis/provenance_policy_matrix.csv`.

Operational meaning:

- `approved / verified / publishable`
  The artifact tuple, SBOM, attestations, and runtime binding all match the expected published tuple.
- `quarantined / blocked`
  Integrity drift, hidden material inputs, gate failure, dirty source, missing attestation, or runtime-binding drift prevents runtime consumption.
- `revoked / withdrawn`
  The previously valid record is no longer trusted and must be removed from runtime consumption.
- `superseded / withdrawn`
  A fresher valid record exists and stale tuples may not remain silently publishable.

## Quarantine Rules

Quarantine is mandatory when any of the following occur:

- signature drift on the canonical provenance subject
- missing or invalid attestation envelopes
- dirty source-tree posture
- blocked dependency policy or blocked required gate evidence
- SBOM digest mismatch
- missing required material inputs
- runtime-binding drift
- reproducibility posture downgraded to `non_reproducible_blocked`

Quarantine does not mutate the original artifact tuple into a new truth source. It preserves immutable audit history and blocks runtime consumption.

## Revocation Rules

Revocation is a stronger lifecycle action than quarantine.

Use revocation when:

- a previously trusted attestation or signer is explicitly revoked
- an operator or automated verifier determines the artifact tuple must be withdrawn

Revocation changes runtime consumption to `withdrawn` and blocks promotion, publication, wave widening, and rollback reuse.

## Supersession Rules

Supersession is used when the artifact tuple has been replaced by a fresher valid provenance record for the same target runtime scope.

Rules:

- the older record remains visible as audit history
- the older record must not stay publishable after the newer record is active
- runtime consumption for the old record becomes `withdrawn`

## In-Place Recovery Is Forbidden

The key state-law from `par_100` is:

- a quarantined record may not be manually flipped back to `verified`
- recovery requires a fresh record with a new provenance identity and a newly verified attestation chain

That rule is implemented in `/Users/test/Code/V/packages/release-controls/src/supply-chain-provenance.ts` and covered by `/Users/test/Code/V/packages/release-controls/tests/supply-chain-provenance.test.ts`.

## Runtime Binding Law

Provenance cannot be reused against a different runtime tuple.

The verification path blocks runtime consumption if any of these drift:

- `RuntimePublicationBundle`
- `ReleasePublicationParityRecord`
- topology tuple hash
- surface-schema-set ref
- target workload families
- target trust boundaries
- target gateway surfaces

This closes the anti-pattern where a generic “signed build” status could be replayed against a different gateway or topology scope.
