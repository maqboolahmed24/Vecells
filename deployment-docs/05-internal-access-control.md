# Internal Access Control

Goal: secure and easy access for nontechnical internal testers.

## Recommendation

Use one shared internal password gate in the public entrypoint.

Tester experience:

1. Open one Render URL.
2. Enter one password.
3. See a simple internal test menu for patient, clinical, ops, hub, pharmacy, support, and governance surfaces.

This is easier and safer than sending seven Render URLs or requiring testers to understand accounts, IP allowlists, or service-specific auth.

## Implementation Direction

Add a small app-level gate later:

- `INTERNAL_TEST_PASSWORD_HASH`
- `SESSION_SECRET`
- secure HTTP-only session cookie
- `Secure` and `SameSite=Lax` cookie flags in Render
- logout button
- internal-only banner after login
- no raw secrets in the repo

Do not store the shared password in Git. Generate the hash locally or in Render Dashboard and store only the hash as an env var.

## Backend Exposure

Preferred:

- public: only the protected entrypoint;
- private: backend APIs and workers;
- private or omitted: simulators and infra-like services.

If API gateway must be public, it should participate in the same password/session gate or accept only requests proxied from the protected entrypoint.

## Render IP Rules

Render inbound IP rules can help if the account plan supports them. Current Render docs say web service/static site IP rules require Enterprise, while managed datastore IP rules are broader. Therefore IP rules should be treated as optional hardening, not the default access mechanism.

## Password Handling

Use a temporary internal testing password:

- rotate it after every test round;
- distribute it in the team channel only;
- remove it after the internal test;
- do not reuse a personal password;
- do not put it in screenshots or docs.

## Tester Data Safety

The login page and app header should say:

- internal testing only;
- no real patient data;
- no official service;
- data can be reset/deleted.

## Minimum Smoke Test For Access

Before sending the URL to testers:

1. Anonymous visitor sees only the password page.
2. Wrong password fails without revealing app content.
3. Correct password opens the internal menu.
4. Each app link loads.
5. Logout returns to password page.
6. Backend/admin/private URLs are not directly exposed in tester instructions.

