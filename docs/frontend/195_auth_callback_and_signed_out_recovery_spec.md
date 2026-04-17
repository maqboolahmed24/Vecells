# Auth Callback And Signed-Out Recovery Frontend Spec

Task: `par_195`

Mode: `Auth_Callback_Recovery_Atlas`

## Scope

The patient web app now owns a same-shell auth callback and signed-out recovery experience for `/auth/*` routes. The route must never infer patient-visible state from browser query strings, local storage, or redirect presence alone. It renders from a projection made of authoritative backend contract fields:

- `AuthTransaction.transactionState`
- callback outcome class
- `SessionEstablishmentDecision.decision`
- `SessionEstablishmentDecision.writableAuthorityState`
- `PostAuthReturnIntent.returnAuthority`
- `PostAuthReturnIntent.intentState`
- `CapabilityDecision.decisionState`
- `CapabilityDecision.reasonCodes`
- `SessionTerminationSettlement.trigger`
- route-fence and release-drift state
- `RouteIntentBinding.validity`

## Routes

| Route                             | Screen                    | Authority posture                                                               |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `/auth/sign-in`                   | Sign-in entry             | Open transaction and pending return intent                                      |
| `/auth/callback`                  | Callback holding          | Callback received and session governor not settled                              |
| `/auth/callback/confirming`       | Confirming details        | Session decision and capability allow writable resume                           |
| `/auth/recovery/consent-declined` | Consent declined          | Provider declined consent and no session is created                             |
| `/auth/recovery/higher-assurance` | Higher assurance required | Capability step-up required                                                     |
| `/auth/recovery/safe-re-entry`    | Safe re-entry             | Stale route binding or release drift narrows to recovery-only                   |
| `/auth/recovery/session-expired`  | Session expired           | Termination settlement trigger is idle or absolute timeout                      |
| `/auth/signed-out`                | Signed-out cleanly        | User sign-out settlement clears session and keeps non-sensitive continuity copy |

## Screen Mapping Rules

1. `user_sign_out` termination settlements always render signed-out cleanly.
2. `idle_timeout`, `absolute_timeout`, or expired transactions render the session-expired recovery page.
3. Consent decline outcomes render consent declined without raw provider error details.
4. Insufficient assurance or `CapabilityDecision.decisionState=step_up_required` renders the higher-assurance page.
5. Awaiting or received callbacks render callback holding until the session governor emits a decision.
6. Invalid route intent bindings, route-fence drift, release drift, and recovery-only capability render safe re-entry.
7. Writable resume renders only when session decision, return intent, and capability decision all agree.

## Visual Contract

The route uses central auth callback design tokens from `@vecells/design-system/foundation.css`:

- Canvas `#F6F8FB`, shell `#EEF2F6`, panel `#FFFFFF`, muted panel `#F8FAFC`, border `#D7DEE7`
- Text `#0F1724`, `#24313D`, muted `#5E6B78`
- Auth accent `#2F6FED`, recovery `#5B61F6`, caution `#A05A07`, blocked `#B42318`, healthy `#116B5C`, focus `#0B57D0`
- State morphs use 180ms, holding indicators use 140ms, and reduced motion collapses transitions and transforms.

The NHS login button keeps the standard blue NHS login treatment and is not recolored into the route palette.

## Safety Rules

- The header identity chip may show masked patient context, but never raw NHS login claims, tokens, subject identifiers, signed URLs, or provider error payloads.
- Same-shell continuity is required for callback holding, stale return, replay, back-button, signed-out, timeout, consent decline, and higher assurance states.
- Writable actions stay hidden or fenced unless the current session decision and capability decision both authorize them.
- Stale return and release drift are read-only recovery states, not generic home redirects.

## Verification

Required verification artifacts:

- `tests/playwright/195_auth_callback_and_signed_out_recovery.spec.ts`
- `tests/playwright/195_auth_callback_and_signed_out_recovery.visual.spec.ts`
- `tests/playwright/195_auth_callback_and_signed_out_recovery.accessibility.spec.ts`
- `tests/playwright/195_auth_callback_and_signed_out_recovery.aria.spec.ts`
- `tools/analysis/validate_195_auth_frontend_contracts.py`
