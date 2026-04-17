# Cache And Live Transport Infrastructure

This directory contains the provider-neutral Phase 0 baseline for `par_088`.

It freezes:
- governed cache namespaces for runtime-manifest, projection-read, route-family, entity-scoped, and transient replay-support classes
- gateway-safe SSE and WebSocket transport fan-out
- connection registries, reconnect tokens, and bounded replay buffers
- local bootstrap, restart, reset, and degraded drill flows that preserve the same identifiers and posture used in non-production
