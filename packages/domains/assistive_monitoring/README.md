# Assistive Monitoring Domain

Owns the Phase 8 monitoring and trust projection plane for assistive capabilities.

The package keeps the operational identity of one assistive behavior in
`AssistiveCapabilityWatchTuple`, records offline, shadow, and visible evidence as
PHI-safe metrics, and materializes one conservative trust and posture projection
for later freeze, release, and UI work.

It deliberately stores refs, hashes, counts, intervals, and blocker codes rather
than prompt fragments, transcripts, clinician notes, or patient context.
