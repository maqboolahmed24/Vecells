# 92 Preview Tuple And Ephemeral Data Rules

Preview environments are governed tuples, not disposable demo sandboxes.

## Non-negotiable rules

- Preview data is synthetic-only.
- Preview reset restores exact tuples rather than partial emptiness.
- Browser-visible preview surfaces must carry the synthetic-only banner and DOM markers from [preview-browser-policy.json](/Users/test/Code/V/infra/preview-environments/local/preview-browser-policy.json).
- TTL expiry forces reset or teardown. Expired previews may not quietly continue as mutable truth.
- Seeded degraded and recovery states are required; healthy-path-only preview packs are forbidden.

## Substrate reset coverage

Every preview reset row in [preview_reset_matrix.csv](/Users/test/Code/V/data/analysis/preview_reset_matrix.csv) binds one environment and one substrate fixture set across:

- runtime topology bundle
- domain store
- FHIR store
- projection store
- event spine
- cache plane
- object storage
- browser surface banner

## Drift classes

- `clean`
- `publication_drift`
- `seed_drift`
- `reset_required`

These classes are published in [preview_environment_manifest.json](/Users/test/Code/V/data/analysis/preview_environment_manifest.json) and enforced by the local drift detector.

## Browser posture

Every governed preview carries:

- a `PREVIEW / SYNTHETIC ONLY` banner prefix
- `data-vecells-preview`
- `data-preview-seed-pack`
- `data-preview-tuple-hash`

Forbidden trust signals remain blocked:

- `production`
- `live patient`
- `unwatermarked screenshot`
- `raw callback payload`

## Ownership and TTL

- Branch previews default to `ci-preview` and short TTL windows.
- Release-candidate previews bind to `preprod` while staying synthetic-only.
- Ownership is explicit per environment and filterable in the control room.
- TTL, drift, reset failure, and expiry remain machine-readable rather than implicit in logs.
