# 202 NHS Login Console Automation Runbook

Task: `seq_202`  
Harness: `tools/playwright/202_nhs_login_console_harness.ts`

## Dry Run

```bash
pnpm exec tsx tools/playwright/202_nhs_login_console_harness.ts --run
```

The default NHS login dry run opens `docs/frontend/202_nhs_login_config_control_board.html`, checks the control-board anchors, switches tabs, captures a screenshot, writes redacted evidence, and exits without touching any provider console.

## Real Console Preparation

Real console operation is intentionally blocked unless every gate passes. To prepare a later run, collect:

- target environment
- secret references
- named approver
- selector snapshot
- pre-mutation rollback snapshot
- evidence checklist
- redaction configuration

The harness checks `ALLOW_REAL_PROVIDER_MUTATION`; without it, provider target mode records a blocked dry-run outcome.

## Selector Strategy

Use role-based selectors where provider pages expose accessible names. Use the selector manifest only for provider fields that do not expose stable roles. Snapshot before each major step and re-snapshot after navigation, modal opens, or field-entry transitions.

## Redaction Rules

Never capture raw:

- client secrets
- console passwords
- test-user passwords or OTPs
- unredacted client identifiers
- full provider hostnames in screenshots intended for broad sharing

The harness replaces sensitive classes with explicit redaction markers in JSON evidence.

## Operator Stop Conditions

Stop and do not mutate if:

- target environment is absent or ambiguous
- selector snapshot is stale
- rollback snapshot is missing
- the route-family matrix no longer matches the manifest
- the requested scopes differ from `data/analysis/202_scope_bundle_matrix.csv`
- any raw secret appears in evidence output
