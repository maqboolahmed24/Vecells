# 202 Actual Provider Strategy And Release Gates

Task: `seq_202`  
Lane: `Actual_provider_strategy_later`

## Strategy

Actual NHS login configuration is split by environment:

- `sandpit_candidate`: proof-of-concept and login-flow rehearsal after provider request approval.
- `integration_candidate`: conformance and production-like testing after product demonstration, ODS or DSPT posture, and evidence readiness.
- future production: out of scope for task `202`; it may only be prepared after readiness activity and signed agreement.

These environments are not interchangeable. A pass in the local or sandpit-like twin does not authorize provider mutation.

## Preconditions For Mutation

All must be true before real provider-console mutation:

- `ALLOW_REAL_PROVIDER_MUTATION=true`
- target environment is explicitly `sandpit_candidate` or `integration_candidate`
- credential references resolve from approved secret management
- named approver is recorded
- selector snapshot is current
- redaction is enabled
- rollback snapshot is captured
- evidence checklist passes

If any precondition fails, the harness stays in dry-run mode and records a blocked posture.

## Sandpit Candidate

Expected fields:

- friendly service name
- approved redirect URI
- public key reference
- requested scope list
- contact owner and evidence owner

Expected evidence:

- redacted screenshot before save
- selector snapshot
- manifest validation output
- rollback snapshot

## Integration Candidate

Expected additions:

- sandpit completion evidence
- product demonstration completion evidence
- DSPT or ODS posture
- conformance test plan
- integration test-user pack reference
- SCAL and clinical-safety evidence where applicable

Integration is where production-like technical conformance belongs. It is not a substitute for live approval.

## Rollback

Rollback requires:

- pre-mutation provider snapshot
- previous manifest version
- named approver
- redacted evidence capture
- post-rollback validation

Provider rollback must not be driven from browser history, screenshots alone, or operator memory.
