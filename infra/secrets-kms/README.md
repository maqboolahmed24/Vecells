# Secrets And KMS Foundation

This directory contains the provider-neutral Phase 0 secret-store and key-management baseline for `par_089`.

- `terraform/` realizes the secret namespace, KMS hierarchy, class bindings, and access-policy views from the machine-readable manifests.
- `local/` bootstraps a file-backed emulator with the same secret classes, key refs, rotation windows, and audit-log shape used by the shared runtime package.
- `tests/` contains smoke checks for bootstrap, break-glass posture, and plaintext-leak prevention.
