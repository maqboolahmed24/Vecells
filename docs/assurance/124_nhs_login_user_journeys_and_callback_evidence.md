# 124 NHS Login User Journeys And Callback Evidence

This document aligns the current repo evidence to the official NHS login journey expectations that are applicable to the current web MVP surface.

## Section A — `Mock_now_execution`

The applicable official journey family is the web-browser solution. The current mock pack does not claim mobile-native evidence.

### Applicable Journey Map

| Official expectation | Current route or scenario | Current evidence ref | Current state |
| --- | --- | --- | --- |
| new user journey, user does not agree to share | `rb_patient_home` with `consent_denied` | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | seeded in repo |
| new user journey, user agrees to share | `rb_patient_home` with `happy_path` | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | seeded in repo |
| returning user journey | `rb_patient_requests` or `rb_patient_appointments` with `happy_path` | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | seeded in repo |
| returning user journeys to NHS login settings | `rb_patient_settings_link` with `settings_return` | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | seeded in repo |
| logout journey | local logout action after successful callback | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | seeded in repo |
| expiry and recovery | `expired_session` recovery path | `EVID_124_MOCK_PLAYWRIGHT_JOURNEYS` | seeded in repo |

### Callback And Session Boundary Rules

| Scenario | Callback result | Allowed local session decisions | Why it matters |
| --- | --- | --- | --- |
| `happy_path` | `callback_received` | `auth_read_only`, `local_capability_review`, `writable_candidate`, `claim_pending` | callback success is still bounded by local route and capability law |
| `consent_denied` | `denied` | `consent_denied` | denial returns safely without inventing a session |
| `wrong_redirect_uri` | `invalid_callback` | `no_local_session` | unregistered callback URIs fail closed |
| `stale_code` | `recovery_required` | `reauth_required` | expired authorisation codes cannot silently succeed |
| `reused_code` | `recovery_required` | `replay_blocked` | duplicate callback redemption stays blocked |
| `expired_session` | `re_auth_required` | `re_auth_required` | upstream expiry forces a fresh local auth transaction |
| `settings_return` | `callback_received` | `auth_read_only` | settings-link return preserves route family without widening |
| `im1_pairing` | `callback_received` or `blocked` | `claim_pending` or `im1_blocked` | IM1 remains explicitly gated |

### Accessibility Evidence

The browser suite also verifies:

- headings remain present across sign-in and return states
- reduced-motion mode stays functionally equivalent
- narrow viewport behavior preserves the same sign-in and recovery controls

## Section B — `Actual_production_strategy_later`

Later actual onboarding evidence should replace simulator captures with official-environment captures for the same journey families. The same callback/session rules must remain true:

- successful authentication still does not directly imply write authority
- all non-success outcomes still settle into bounded recovery, not arbitrary redirect
- logout remains the relying party responsibility
- route-family and session intent must stay preserved through expiry, restart, and settings return
