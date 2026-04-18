# 258 Reasoning Layer Accessibility Notes

- Every rapid-entry control keeps a visible label.
- `QuestionSetPicker` exposes one explicit picker region instead of relying on placeholder-only text.
- `RapidEntryNoteField` remains keyboard reachable and uses the shared status strip for local save acknowledgement.
- Reduced motion keeps the dock and side stages readable without animation dependency.
- Freeze posture is written in text; it does not rely on colour or position alone.
- The `more-info` and endpoint child routes remain in the same shell, so browser focus and back-path continuity stay predictable.
