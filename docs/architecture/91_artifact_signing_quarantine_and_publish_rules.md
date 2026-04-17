# 91 Artifact Signing, Quarantine, And Publish Rules

## Non-negotiable rules

- Unverified artifacts may not be published or promoted.
- Quarantined, revoked, superseded, or blocked artifacts fail closed for runtime consumption.
- Provenance verification state, quarantine reasons, and publish decisions must remain machine-readable.
- Manual deployment or environment promotion may not bypass the provenance verifier.
- Dependency policy and SBOM drift are publish blockers, not dashboard notes.

## Quarantine rules

- `SIGNATURE_MISMATCH` -> `quarantined` / `quarantined` / `quarantine_and_rebuild`\n- `DEPENDENCY_POLICY_BLOCKED` -> `quarantined` / `quarantined` / `quarantine_and_remediate`\n- `SCHEMA_SET_DRIFT` -> `blocked` / `blocked` / `rebuild_after_schema_alignment`\n- `PROVENANCE_REVOKED` -> `revoked` / `revoked` / `revoke_and_replace`\n- `PROVENANCE_SUPERSEDED` -> `superseded` / `superseded` / `retain_read_only_history`\n- `MANUAL_DEPLOY_BYPASS_ATTEMPT` -> `blocked` / `blocked` / `fail_closed_and_alert`\n

## Workflow posture

- `build-provenance-ci.yml` runs deterministic install, build, check, provenance rehearsal, and provenance verification.
- `nonprod-provenance-promotion.yml` only promotes into `integration` or `preprod`, and only after provenance verification and publish decision approval succeed.
- The local rehearsal scripts generate the same record set and decision states without requiring a dashboard, managed registry, or manual environment toggles.

## Production hardening later

- Replace HMAC signing with managed KMS or HSM attestation without changing `BuildProvenanceRecord` identity, digest, state transitions, or quarantine law.
- Replace workspace bundle manifests with OCI or regional registry packaging without changing artifact digests, publish decisions, or supersession semantics.
- Bind final `RuntimePublicationBundle` publication and live watch tuple actioning through `par_094` and `par_097` without weakening the fail-closed contract created here.
