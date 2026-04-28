# 336 Partner Feed Secret Handling

## Rules

- Use least privilege per partner feed and per environment.
- Store only references such as `secret://...` and `vault://...` in tracked files.
- Render only masked fingerprints in operator evidence.
- Never commit raw API keys, JWT private keys, supplier passwords, certificate PEM bodies, or SFTP private keys.

## Allowed Repo Material

- secret references like `secret://capacity/...`
- vault references like `vault://capacity/...`
- masked fingerprints like `sha256:abc123...`
- non-secret endpoint identities
- adapter identities and site/service mapping rows

## Forbidden Material

- raw partner credentials
- raw certificate PEM bodies
- raw private-key PEM bodies
- browser exports that contain live cookies or reusable authenticated state
- screenshots or traces that expose full secret values

## Browser Automation Handling

- Keep browser state ephemeral.
- Do not persist authenticated browser state under `playwright/.auth`.
- If a local harness needs sign-in, use fixture-only credentials and reset the runtime state before each proof run.
- Traces and screenshots must contain masked fingerprints only.

## Operational Handling

- Rotation remains external to the repo and external to Playwright.
- Review masked fingerprints before promotion so stale bundles are visible without disclosing the underlying secret.
- Supported-test supplier portals stay manual-bridge bound until named operator evidence is refreshed.

## Why This Exists

`seq_336` configures operationally material partner feeds. The repo must prove adapter, endpoint, ODS, site, and service bindings while keeping secrets out of tracked code and durable evidence.
