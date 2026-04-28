# Data Storage Foundation

This directory contains the provider-neutral Phase 0 storage baseline for `par_085`.

- `terraform/` publishes the transactional domain store and FHIR representation store realizations.
- `bootstrap/` contains deterministic bootstrap SQL for the two store classes.
- `local/` mirrors the same split for developer and CI use, including compose and dry-run bootstrap planning.
- `tests/` contains smoke checks that fail when the truth-layer split, browser block, or bootstrap plan drifts.
