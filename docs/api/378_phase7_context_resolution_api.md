# 378 Phase 7 Context Resolution API

## Service

`createDefaultPhase7EmbeddedContextApplication()` returns the local deterministic application service.

Primary exports:

```ts
import {
  createDefaultPhase7EmbeddedContextApplication,
  createTrustedContextEvidence,
} from "./phase7-embedded-context-service";
```

## Routes

The command API route catalog includes:

| Route ID                                     | Method | Path                                                  | Contract                                   |
| -------------------------------------------- | ------ | ----------------------------------------------------- | ------------------------------------------ |
| `phase7_embedded_context_resolve`            | POST   | `/internal/v1/nhs-app/context:resolve`                | `ChannelContextResolutionContract`         |
| `phase7_embedded_shell_policy_resolve`       | POST   | `/internal/v1/nhs-app/shell-policy:resolve`           | `ShellPolicyResolutionContract`            |
| `phase7_embedded_session_projection_current` | POST   | `/internal/v1/nhs-app/embedded-session:project`       | `PatientEmbeddedSessionProjectionContract` |
| `phase7_embedded_nav_eligibility_evaluate`   | POST   | `/internal/v1/nhs-app/nav-eligibility:evaluate`       | `PatientEmbeddedNavEligibilityContract`    |
| `phase7_embedded_context_hydration_envelope` | POST   | `/internal/v1/nhs-app/context:ssr-hydration-envelope` | `EmbeddedSsrHydrationConsistencyContract`  |

## `resolve`

Input:

- `environment`
- `journeyPathId`
- `routePath`
- optional `userAgent`
- optional query map, including presentation-only `from=nhsApp`
- optional signed `ChannelContextEvidence`
- optional signed `EmbeddedEntryToken`
- optional `ssoHandoffState`
- optional local session binding
- optional bridge capability snapshot
- optional expected manifest version and config fingerprint
- optional route-freeze state
- optional SSR hydration context

Output:

- one authoritative `ChannelContext`
- resolved `ShellPolicy`
- `EmbeddedShellConsistencyProjection`
- `PatientEmbeddedSessionProjection`
- `PatientEmbeddedNavEligibility`
- deterministic `blockedReasons`
- inherited manifest blocked reasons
- SSR hydration binding
- audit records

## Evidence Rules

`EmbeddedEntryTokenService.issue()` signs a token for the target route, cohort, manifest version, config fingerprint, and optional continuity keys. `verify()` checks signature, expiry, expected journey path, cohort, and nonce replay. Valid tokens are consumed by the resolver, so a second use returns `embedded_entry_token_replayed`.

`ChannelContextEvidence` uses the same signature and TTL posture. Signed evidence and token claims are evaluated before user-agent and query hints.

## Shell Policy

`ShellPolicy:embedded-nhs-app-v1` is emitted only for trusted or verified embedded context. Hint-only traffic gets `ShellPolicy:embedded-hint-styling-only-v1`, which hides duplicated chrome but blocks downloads and external-link grants. Standalone traffic gets `ShellPolicy:standalone-browser-v1`.

## Audit Safety

Audit records include route, manifest refs, config refs, trust tier, disposition, blocked reasons, and query keys. Query values are normalized and `assertedLoginIdentity` is redacted before it can enter `ChannelContext.queryEvidence`; audit records never include raw JWTs, patient identifiers, bridge payloads, or submitted free text.
