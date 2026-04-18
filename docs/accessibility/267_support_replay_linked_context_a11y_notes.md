# 267 Support Replay Linked Context Accessibility Notes

- Keep replay, history, and knowledge as one reading order inside the same ticket shell. Replay must not spawn a detached panel that screen readers reach out of sequence.
- `SupportReplayRestoreBridge` must describe blockers in plain language and keep the primary restore action disabled until restore is lawful. The replay restore bridge must stay visible when replay gating persists across reload, deep link, or browser return.
- `data-support-shell-mode`, `data-replay-state`, and `data-restore-state` are published for deterministic automation and assistive debugging.
- The linked-context lane uses real buttons and tabs, not hover-only affordances.
- History widen and knowledge preview remain keyboard reachable from the same shell.
- Reduced motion keeps replay meaning through explicit badges, blockers, and lane order instead of depending on animated movement.
- Mobile replay stays summary-first so the selected anchor, replay checkpoint, and restore blockers remain above the fold.
- Masked content uses placeholder-safe summaries rather than visually hidden raw text.
