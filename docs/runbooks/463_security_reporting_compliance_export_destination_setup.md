# Phase 9 Security Reporting and Compliance Export Destination Setup

Task 463 configures the governed destination registry for reportable security incident handoff and compliance exports. Use `/ops/config/security-compliance-exports` to select tenant, environment, framework, destination class, artifact class, and a vault reference.

## Operator Flow

1. Select the tenant and environment that match the source assurance scope.
2. Select the framework and destination class.
3. Keep the vault ref in `vault-ref/<tenant>/<environment>/security-compliance-exports/<destination>/v1` form.
4. Run `Verify reportability handoff` for security reporting bindings.
5. Run `Test compliance export` for compliance export bindings.
6. Confirm the readiness strip is ready for Assurance, Incident Desk, Audit Explorer, Records Governance, Resilience Board, and Conformance Scorecard.

## Guardrails

- Do not paste endpoint URLs, bearer tokens, keys, or PHI into the UI.
- The fake receivers accept only redacted summaries, manifest metadata, framework/version refs, hashes, and settlement refs.
- Artifact handoff must keep `ArtifactPresentationContract` and `OutboundNavigationGrant` visible before delivery settlement.
- Missing secret, missing destination, denied scope, stale graph, stale redaction policy, blocked graph, blocked redaction, permission denial, pending reportability, and delivery failure all fail closed.

## Verification

Run:

```bash
pnpm test:phase9:security-compliance-exports
pnpm validate:463-phase9-security-compliance-exports
pnpm --dir packages/domains/operations typecheck
pnpm --dir apps/governance-console typecheck
pnpm --dir apps/ops-console typecheck
```
