# Mock NHS Login

`Bluewoven_Identity_Simulator` is the seq_025 local NHS login mock service and admin console.

## What it does

- simulates client registration, redirect-URI governance, scope bundles, VoT selection, and JWKS posture
- drives sign-in, consent, callback, settings-link return, and error handling flows
- keeps actual-provider credential capture fail-closed with placeholder fields and live-gate checks

## Run

```bash
pnpm install
pnpm dev
```

The default local URL is `http://127.0.0.1:4174`.

## Routes and views

- `/?view=admin` for the client registry and credential drawer
- `/?view=signin` for the user sign-in journey
- `/?view=consent` for consent and claims review
- `/?view=return` for callback and error states
- `/?view=settings` for the settings-link simulator

## Non-negotiable rules

- no real secrets or provider credentials belong in this app, its local storage, screenshots, or logs
- IM1 pairing remains disabled unless both the client and test user carry the explicit IM1 flag
- auth success never implies writable route access; the app shows the local session ceiling rather than faking final authority
