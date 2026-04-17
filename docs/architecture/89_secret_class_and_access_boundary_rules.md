# 89 Secret Class And Access Boundary Rules

## Boundary Rules

1. Secret values are never authoritative browser data. Browser surfaces may only consume redacted summaries, secret-class refs, version refs, or fingerprints.
2. One service identity may only load the secret classes declared by `data/analysis/secret_class_manifest.json`.
3. Long-lived CI variables are not authoritative secret storage. CI jobs use named secret classes and access policies.
4. A rotation window breach is a fail-closed runtime condition, not a warning-only hint.
5. Revoked material blocks startup or refresh immediately. Runtime does not silently continue on superseded or revoked secrets.
6. Break-glass access is not a normal runtime path. It requires explicit policy, explicit audit, and separate key material.
7. Key branches are split by purpose and blast radius. Session, signing, provider, data-plane, CI, and break-glass material do not collapse into one branch.
8. Mock-now and actual-later keep the same secret class refs, access policies, key branches, and retrieval APIs.

## Access Boundaries

### Published Gateway

- may read only `AUTH_EDGE_SESSION_SECRET_REF`, `AUTH_EDGE_SIGNING_KEY_REF`, and later route-bound cache or transport secrets already declared for the same surface
- may not read provider credentials, object-store credentials, broker credentials, or break-glass material

### Command And Projection

- `command-api` reads only command-plane store and mutation-gate material
- `projection-worker` reads only cursor and dead-letter store material
- neither service may read notification, provider, CI, or break-glass classes

### Integration Dispatch And Simulators

- `notification-worker` reads provider, callback, and signing material for dispatch only
- simulator backplanes keep their own secret classes and may not silently inherit live-provider or production credentials

### Data Plane

- domain store, FHIR store, event spine, and object-storage credentials remain in the data-plane or assurance zones
- browsers and published gateways never receive these credentials

### Assurance And CI

- CI release attestation consumes only the provenance signing class
- preview reset consumes only the preview reset token plus the break-glass HMAC where policy requires it
- assurance control alone holds the break-glass audit material

## Gap Closure Notes

- `GAP_ENV_LOADING_FOLKLORE` is closed by manifest-driven secret refs and shared service adapters.
- `GAP_SINGLE_MASTER_KEY` is closed by the six-purpose branch hierarchy under per-environment roots.
- `GAP_ROTATION_REQUIRES_CODE_CHANGE` is closed by service bootstrap refresh and store-level supersession.
- `GAP_LONG_LIVED_CI_VARIABLES` is closed by the CI job bindings in the manifest.
- `GAP_BREAK_GLASS_WITHOUT_AUDIT` is closed by separate access-policy mode and `BREAK_GLASS_AUDIT_HMAC_REF`.
