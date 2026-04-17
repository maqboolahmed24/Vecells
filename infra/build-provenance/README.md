# Build Provenance And CI/CD Baseline

This directory contains the provider-neutral Phase 0 delivery-control substrate for `par_091`.

- `.github/workflows/build-provenance-ci.yml` runs deterministic install, build, check, provenance rehearsal, and provenance verification.
- `.github/workflows/nonprod-provenance-promotion.yml` reuses the same records and only approves promotion into non-production rings.
- `local/dependency-policy.json` is the machine-readable dependency-policy baseline consumed by the rehearsal scripts.
- `tests/build-provenance-smoke.test.mjs` proves that signed provenance verifies cleanly and that tampering fails closed.

Frozen counts:

- build families: `8`
- pipeline runs: `8`
- quarantine rules: `6`
- publish hooks: `16`
