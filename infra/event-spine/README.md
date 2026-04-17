# Event Spine Infrastructure

This directory contains the provider-neutral Phase 0 event-spine baseline for `par_087`.

It freezes:
- namespace streams aligned to the canonical event registry
- queue groups and DLQ routes
- access-control posture for runtime identities
- local bootstrap and reset flows that preserve the same queue law used in non-production
