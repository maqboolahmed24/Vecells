# par_146 Attachment Artifact Presentation Contract

The attachment pipeline does not expose raw storage URLs. Every open, download, or external handoff path resolves through the frozen `seq_141` artifact and navigation law.

## Contract binding

- artifact contract ref: `APC_141_INTAKE_ATTACHMENT_V1`
- navigation grant ref: `ONG_141_INTAKE_ATTACHMENT_HANDOFF_V1`
- server view implementation: [createArtifactPresentation](/Users/test/Code/V/packages/domains/intake_request/src/attachment-pipeline.ts)

## Presentation modes

- `structured_summary`
  - used while upload or scan is still pending
  - no preview bytes and no external handoff
- `governed_preview`
  - safe durable attachment with preview allowed
  - open and download require one short-lived grant
- `placeholder_only`
  - safe durable attachment where inline preview is unavailable or intentionally omitted
  - summary remains primary; download or open still require a grant
- `recovery_only`
  - quarantined, rejected, timed out, removed, or replaced posture
  - no artifact bytes exposed

## Server guarantees

- returned destinations are scrubbed grant URIs, not object-store locations
- grant lifetime is short and explicit
- grant scope carries `routeFamilyRef`, `continuityKey`, `selectedAnchorRef`, and `returnTargetRef`
- preview bytes, when available, are derivative artifacts and never replace the durable source object

## Downstream effects

- draft cards show only masked metadata, posture, and governed actions
- `par_145` submit-readiness consumes the current attachment verdicts, not ad hoc client file state
- later promoted request shells can reuse the same attachment grant law without widening the public contract
