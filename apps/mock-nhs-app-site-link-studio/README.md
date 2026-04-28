# Mock NHS App Site Link Studio

This app is the seq_030 rehearsal surface for NHS App site-link metadata and path allowlists.

## Visual mode

`Linkloom_Metadata_Studio`

## What it does

- previews route-family allowlists
- generates Android `assetlinks.json` placeholders
- generates iOS `apple-app-site-association` placeholders
- validates locally hosted `.well-known` assets
- keeps later real registration fail-closed behind explicit gates

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

## Local hosted files

The preview serves:
- `/.well-known/assetlinks.json`
- `/.well-known/apple-app-site-association`

Those files are rehearsal artifacts generated from the same shared pack as the UI. They intentionally use placeholders and must not be treated as real registration evidence.
