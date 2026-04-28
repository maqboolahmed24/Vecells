# 348 Directory Failover Choice Supersession And Consent Rules

## Failover posture

The runtime never collapses source modes into one opaque feed. Each adapter publishes trust,
freshness, and failure posture separately.

Operational interpretation:

- `dohs_service_search`: strategic search source for current service discovery
- `eps_dos_legacy`: legacy compatibility source, kept visible in provenance but not preferred over
  fresher strategic or authoritative records
- `local_registry_override`: authoritative local correction path
- `manual_directory_snapshot`: manual-bridge evidence source for bounded fallback

## Visibility law

- `manual_supported` providers remain visible.
- `unsupported` providers may be hidden only when they are truly unusable.
- late-but-otherwise-valid providers may be suppressed only through the timing policy, and they
  must still appear in the suppressed summary.
- recommended providers are advisory only.

## Consent law

Consent is bound to:

- provider
- pathway or lane
- referral scope
- proof
- explanation
- capability snapshot
- `selectionBindingHash`
- package fingerprint when supplied

## Supersession triggers

348 treats the following as material drift:

- selected provider no longer visible
- visible choice set hash changed
- directory tuple changed
- explicit downstream reason codes such as `scope_drift` or `pathway_drift`

Resulting actions:

1. supersede or withdraw the consent record
2. record a revocation row
3. stale the checkpoint
4. preserve prior selection as provenance
5. require explicit recovery before calm reuse
