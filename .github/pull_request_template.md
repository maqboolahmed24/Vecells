## Summary

- Task:
- Prompt:
- Architecture refs:

## Change Type

- [ ] arch
- [ ] scaffold
- [ ] feat
- [ ] fix
- [ ] test
- [ ] docs
- [ ] security
- [ ] release
- [ ] migration

## Validation

- [ ] `pnpm check`
- [ ] `pnpm test:e2e` when browser-visible work changed
- [ ] Additional task-specific validation noted below

Commands run:

```text
pnpm check
```

## Review Focus

- [ ] Boundary ownership and public entrypoints stayed intact
- [ ] Security, redaction, and secret handling were reviewed
- [ ] Accessibility and reduced-motion behavior were reviewed
- [ ] Performance or retry posture changes were reviewed

## Risk Triggers

- [ ] Route intent or command acceptance changed
- [ ] Release controls, parity, or watch posture changed
- [ ] Trust posture, authz, or secret handling changed
- [ ] Boundary contracts or topology changed
- [ ] Data or contract migration changed

Risk / rollback notes:

## Browser Evidence

- Screenshots, traces, or Playwright notes:
- Stable `data-testid` markers confirmed:
