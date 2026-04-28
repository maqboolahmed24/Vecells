# 414 Algorithm Alignment Notes

Local source-of-truth order followed:

1. `blueprint/phase-8-the-assistive-layer.md` sections `8A`, `8B`, `8F`, and
   `8H`
2. `blueprint/phase-0-the-foundation-protocol.md`
3. validated outputs from tasks `404` through `413`

Implemented alignments:

- Prompt packages and prompt snapshots are governed artifacts with immutable
  canonical hashes and release-candidate or watch-tuple lineage.
- Inference logs store refs and hashes for model, prompt, evidence, derivation,
  policy, schema, calibration, runtime image, publication tuple, output
  artifacts, run settlement, and optional feedback chain.
- Replay-critical raw content is represented only through protected artifact
  refs. Routine audit and telemetry do not store prompt fragments, transcript
  fragments, clinician free text, or evidence spans.
- `AssistiveProvenanceEnvelope` is one per artifact revision and bridges later
  UI, assurance, export, monitoring, and trainability to immutable source refs.
- `AssistiveReplayManifest` pins model, prompt snapshot, evidence hash,
  derivation refs, schema, calibration, policy, runtime image, publication, and
  replay harness version.
- `FeedbackEligibilityFlag` is materialized from settlement-backed chain and
  final-human-artifact truth. It defaults conservatively unless the chain is
  settled clean and evidence quality is complete.
- Revocation appends a `TrainabilityRevocationRecord` plus a replacement revoked
  flag. The previous flag remains inspectable for replay.
- Export is guarded by disclosure posture, artifact presentation contract,
  outbound navigation grants for external handoff, and full-replay audience
  restrictions.

Boundary decisions:

- Task `414` does not recompute the human review chain; it consumes refs from
  task `413`.
- Task `414` does not monitor drift, fairness, or capability trust projection;
  task `415` consumes the replay and eligibility outputs.
- Materialized eligibility marks dual-review, incident-linked, policy-exception,
  high-severity, partial-counterfactual, or pending-label cases as requiring
  adjudication instead of eligible.
