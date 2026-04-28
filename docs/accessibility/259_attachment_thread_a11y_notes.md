# 259 Attachment Thread Accessibility Notes

- Keep the workspace skip-link and landmark structure intact while the viewer or thread is active.
- `ReferenceStack` must remain keyboard-expandable and must not trap focus when the viewer opens.
- `ThreadEventRow` exposes a dedicated focus action instead of making the whole chronology row a nested interactive trap.
- All disposition, repair, and visibility states use text labels as well as color.
- Chunked loading keeps descriptive text in place and does not rely on motion alone.
- Reduced motion keeps the same layout and meaning while removing timed spatial travel.
- Viewer close and thread-anchor reset controls remain visible text buttons, not icon-only affordances.
