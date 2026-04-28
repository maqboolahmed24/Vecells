# Runtime Secrets

Shared runtime secret-management helpers for Phase 0.

- Loads the task `089` secret-class, key-hierarchy, and rotation-policy artifacts.
- Provides a file-backed secret-store emulator for local, test, and CI use.
- Exposes service and CI secret adapters that fail closed when required material is missing, stale, revoked, or inaccessible.
- Publishes audit-safe read summaries and rotation hooks without leaking raw secret values.
