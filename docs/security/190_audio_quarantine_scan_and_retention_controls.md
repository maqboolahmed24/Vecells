# 190 Audio Quarantine Scan And Retention Controls

## Provider Boundary

Provider recording URLs, signed URLs, and raw provider payloads are adapter-only data. `TelephonyRecordingIngestPipeline` persists provider refs, content digests, byte counts, media metadata, and artifact refs, but never raw URLs or raw audio bytes.

The operational policy for provider URLs is deny-by-default persistence: only the adapter can observe them, and all downstream records use provider refs plus `artifact://` refs.

## Quarantine Controls

Every available asset is written to quarantine before scanning. Quarantine assessment records:

- `providerAuthenticityState`
- `transportIntegrityState`
- `formatPolicyState`
- `malwareScanState`
- `quarantineOutcome`

Only `quarantineOutcome = clean` can be promoted to governed storage. Unsupported media, checksum failure, provider authenticity failure, malware, unreadable audio, provider-ref mismatch, missing assets, and over-limit duration or byte size remain quarantined or blocked and create manual review dispositions.

## Governed Storage

Governed audio uses storage class `governed_audio`, retention class `clinical_audio_evidence`, disclosure class `clinical_evidence_audio`, and an audio-specific encryption key lineage ref. The durable reference exposed to clinical and support surfaces is `artifact://recording-audio/{objectStorageRef}`.

## Retention And Review

Clean audio is retained as clinical evidence. Blocked quarantine records are retained for audit and security review according to the quarantine policy, but they are not promoted and do not create a `DocumentReference`. Manual review can request callback, audio review, staff transcription, or follow-up.
