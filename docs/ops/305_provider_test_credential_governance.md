# 305 Provider Test Credential Governance

## Scope

The 305 credential manifest stores secret references only. It is not a secret store and it must never contain raw passwords, JWT keys, certificates, bearer tokens, or callback secrets.

Tracked credential metadata is limited to:

- secret reference path or variable name
- masked fingerprint
- owner role
- environment binding
- last rotation hint
- expiry posture
- purpose

## Allowed reference schemes

- `secret://...`
- `vault://...`
- `env://...`

`config://...` and `docs://...` references are prerequisites, not credentials, and remain in the prerequisite registry instead of the credential manifest.

## Owner roles

The manifest uses explicit ownership so rotation and expiry review do not remain tribal knowledge.

| Owner role | Typical scope |
| --- | --- |
| `ROLE_SECURITY_LEAD` | callback HMAC secrets, JWT keys, mutual-TLS certificates, supplier portal passwords |
| `ROLE_INTEROPERABILITY_LEAD` | supplier portal user references, onboarding packs, supported-test pairing materials |
| `ROLE_RELEASE_MANAGER` | pairing packs or onboarding packs tied to governed environment promotion |
| `ROLE_BOOKING_DOMAIN_LEAD` | local component install packs and repo-owned twin configuration |

## Rotation posture

- portal-user references: 90 days
- portal-password references: 60 days
- callback HMAC references: 90 days
- JWT signing references: 90 days
- mutual-TLS certificate references: 120 days
- onboarding or pairing packs: 180 days

When expiry posture falls to review-required, the provider row must not be treated as silently current even if the capability matrix still declares the behavior.

## Redaction rules

Browser proof must never render:

- raw `secret://`, `vault://`, or `env://` values
- certificate or private-key bodies
- real supplier usernames or passwords
- any patient or appointment identifiers unrelated to the provider evidence task

Safe browser proof shows:

- credential id
- masked fingerprint
- owner role
- expiry state
- rotation cadence

## Manual-bridge rows

Manual-bridge providers still need credential metadata, but they remain review-controlled:

- Optum IM1 supported test
- TPP IM1 patient supported test
- TPP IM1 transaction supported test
- GP Connect integration candidate

Those rows are intentionally masked and must remain `review_required` until a lawful unattended browser capture path exists.

## Operator checklist

Before using a provider test environment:

1. confirm the credential belongs to the expected environment row
2. confirm the owner role is still valid
3. confirm the expiry state is not stale
4. confirm the binding hash in the evidence registry still matches the active provider row
5. confirm browser traces and screenshots expose only masked fingerprints
