# Preview Environment Foundation

This directory contains the provider-neutral Phase 0 baseline for `par_092`.

It freezes:
- governed preview environment descriptors bound to one runtime tuple and one synthetic seed pack
- deterministic bootstrap, reset, drift-detect, and teardown flows for non-production previews
- browser-safe preview banner policy so screenshots and demos cannot be mistaken for production
- TTL-bound preview realizations for `ci-preview` and `preprod` rehearsal paths
