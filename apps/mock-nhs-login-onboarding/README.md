# Mock NHS Login Onboarding

This app is the React and TypeScript rehearsal surface for seq_024. It mirrors the same field map, stage model, artefact register, and live gate pack generated into:

- `/Users/test/Code/V/data/analysis/nhs_login_application_field_map.json`
- `/Users/test/Code/V/data/analysis/nhs_login_live_gate_conditions.json`
- `/Users/test/Code/V/data/analysis/nhs_login_submission_artifact_checklist.csv`

## Scripts

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm preview`

## Visual mode

- `Partner_Access_Atelier`

## Notes

- The app is an internal mock and must not be mistaken for the NHS login website.
- Autosave persists rehearsal inputs to `localStorage`.
- Actual mode is intentionally fail-closed and shows why live submission is still blocked.
