# 425 Secret Reference Handling Rules

## Rules

1. Store only managed references in source: `secret://`, `vault://`, `kms://`, or `env://managed/`.
2. Never store a raw API key, bearer token, client secret, private key, service-account JSON, or provider session cookie in source.
3. Managed environment variable names must end in `_REF` to show they carry a handle, not a value.
4. Browser automation may render only masked fingerprints and readiness decisions.
5. Traces, videos, screenshots, console logs, and HTML snapshots must not contain secret locators or raw secret values.
6. New live values land first in the partner capture quarantine and then move to the correct vault or HSM path.
7. Rotate or revoke at the provider first when needed, then rotate vault material, then republish runtime handles, then append audit evidence.

## Fingerprints

Task 425 fingerprints use the `fp_sha256_` prefix and deterministic hashes over the key reference id, environment id, and secret reference handle. They prove the reference did not drift without exposing the secret or even the full locator in browser evidence.

## Blocks

The validator must fail closed on:

- fields named `apiKey`, `clientSecret`, `rawSecret`, `secretValue`, `token`, `accessToken`, or `refreshToken`
- values shaped like OpenAI-style secret keys, bearer tokens, or private keys
- wildcard scopes
- production environments
- `apply` mode enabled by default
- an external provider key marked ready before provider selection and intended-use review
