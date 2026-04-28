# Object Storage Foundation

This directory contains the provider-neutral Phase 0 object-storage baseline for `par_086`.

- `terraform/` publishes the object-storage namespace and the six governed storage-class buckets.
- `bootstrap/` contains the deterministic seed catalog used by local and CI bootstrap flows.
- `local/` mirrors the same storage taxonomy for developer and CI use, including the emulator compose file, malware-scan handoff seam, and reset-safe seeding script.
- `tests/` contains smoke checks that fail when quarantine, retention, key law, or browser blocking drift.
