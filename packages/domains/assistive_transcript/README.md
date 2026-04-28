# Assistive Transcript Domain

This package owns the Phase 8 governed input pipeline for assistive documentation:

- audio capture session permission, source, and capture-mode validation
- quarantine-first transcript job orchestration
- immutable transcript derivation packages and reruns
- typed speaker segments, clinical concept spans, and redaction spans
- retention envelopes and deletion scheduling checks
- governed transcript presentation artifacts

The package produces transcript artifacts for downstream drafting. It does not expose raw blob URLs, mutate live workflow state, or widen ambient capture posture.
