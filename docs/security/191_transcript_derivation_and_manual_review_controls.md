# 191 Transcript Derivation And Manual Review Controls

## Transcript Storage Boundary

Raw transcript blobs and audio contents remain governed artifacts. Operational records store `artifact://telephony-transcript/...` refs, content digests, span refs, and derived signal codes. Logs and support-safe projections must not contain raw transcript text.

## Fail-Closed Controls

The coverage sufficiency law requires clinically sufficient coverage before routine promotion. Partial segments, extractor failure, low quality, unreadable audio, unresolved contradictions, and urgent-live-only postures are blocked from routine submission.

Manual review is structured through `ManualAudioReviewQueueEntry`, not comments. The queue entry records trigger class, review mode, governing transcript-readiness ref, governing evidence-readiness ref, and reason codes.

## Auditability

Every derivation package records input artifact refs, derivation version, output hash, materiality class, supersession lineage, and derivation timestamp. Reruns append; they never mutate previous derivation or readiness records.
