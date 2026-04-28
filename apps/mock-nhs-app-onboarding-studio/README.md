# mock-nhs-app-onboarding-studio

Internal rehearsal studio for seq_029. This is not a real NHS App portal and must not be confused with the real NHS App or real NHS App onboarding systems.

## Purpose

- rehearse the NHS App EOI and staged onboarding path
- preview embedded-shell readiness for the same patient route families as standalone web
- keep deferred-scope warnings and live-provider gates explicit

## Run

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Notes

- Visual mode: `Embedded_Channel_Atelier`
- Default preview URL: `http://127.0.0.1:4180/`
- The app reads generated data from `src/generated/nhsAppPack.ts`.
- Real provider mutation is never allowed from the UI; actual mode is a gated dossier review only.
