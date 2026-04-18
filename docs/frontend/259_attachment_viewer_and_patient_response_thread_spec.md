# 259 Attachment Viewer And Patient Response Thread Spec

## Intent

`par_259` extends the active task shell with one same-shell reference layer for governed attachments and patient-response chronology. The task shell keeps `DecisionDock` dominant while `ReferenceStack` becomes the bounded place where reviewers inspect attachment summaries, open heavier viewers, and read authoritative response chronology.

## Authoritative surfaces

- `AttachmentDigestCard`
- `AttachmentDigestGrid`
- `ArtifactViewerStage`
- `AudioDigestCard`
- `PatientResponseThreadPanel`
- `ThreadEventRow`
- `ThreadDispositionChip`
- `ThreadAnchorStub`

## Interaction laws

1. Attachments stay summary-first. Inline cards show provenance, availability, and one restrained open action.
2. `ArtifactViewerStage` is the only heavy-view entry, and it always renders through the governed artifact shell from `109`.
3. `PatientResponseThreadPanel` renders chronology from canonical tuple terms: `ConversationThreadProjection`, `PatientConversationPreviewDigest`, `ConversationCommandSettlement`, and `MoreInfoResponseDisposition`.
4. Viewer open and thread focus preserve the selected anchor and quiet-return target.
5. Stale, step-up, placeholder, and recovery posture degrade in place instead of replacing the task shell.

## Layout

- `ReferenceStack` remains collapsed by default until explicitly opened or until the viewer or thread anchor is already active.
- Digest cards render first in a 2-column grid when space allows.
- The support lane under the grid holds `ArtifactViewerStage` and `PatientResponseThreadPanel`.
- On narrow layouts the support lane collapses to one column and keeps the same order: digest grid, viewer stage, thread.

## Viewer behavior

- `ArtifactViewerStage` shows summary, provenance, mode truth, and safe preview or placeholder.
- Audio uses chunked loading. Summary and provenance stay visible while the heavier preview hydrates.
- Large guarded documents remain placeholder-safe and never push the user into a detached browser view.
- Recovery posture remains explicit and contract-bound through the artifact shell.

## Thread behavior

- Thread ordering comes from the authoritative projection order, not timestamp heuristics.
- Chips represent canonical disposition, settlement, repair, or visibility states.
- `ThreadAnchorStub` appears when the reviewer focuses an older chronology anchor or when visibility posture suppresses detail.
- Related attachments can be opened directly from thread rows, but they still route through the same governed viewer stage.

## Continuity

- Viewer and thread focus survive `/workspace/task/:taskId`, `/more-info`, and `/decision` transitions for the same task.
- The global selected anchor remains the task-shell anchor. The viewer and thread publish local focus only.
- Quiet return always points back to the task reference layer rather than a detached file or message page.
