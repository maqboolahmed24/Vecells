# 263 Callback Workbench Accessibility Notes

- Keep callback wording sentence-case and plain spoken. The expectation card should read like service-grade staff copy, not provider jargon.
- The worklist is keyboard reachable before the detail plane. Operators must be able to move from filter controls to rows, then into attempt timeline and outcome capture without pointer-only affordances.
- `CallbackOutcomeCapture` uses labelled checkboxes for required evidence and keeps the record button disabled until the legal evidence set is complete.
- Route repair warnings stay textual, not color-only. `CallbackRouteRepairPrompt` carries explicit repair wording when route health drifts or fails.
- Reduced motion keeps the same information hierarchy. Stage changes may fade or outline, but the workbench should not spatially jump enough to lose orientation.
- Focus protection still applies while the operator is capturing an outcome. Buffered queue change surfaces remain visible without stealing focus from the evidence stage.
