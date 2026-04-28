# 426 Audit Export And Retention Notes

## Selected Local Watch Twin

The local watch twin supports a repository-owned audit baseline:

- development retention: 30 days
- integration retention: 90 days
- export format: redacted metadata JSONL reference
- payload policy: `metadata_only_redacted_no_prompts_responses`
- event classes: invocation metadata, trust posture transitions, safety decisions, operator overrides, model access denial, and change-control evidence linkage

The export references are not raw files in source control. They are stable `artifact://` locators that downstream release and ops tasks can bind to their own redacted evidence stores.

## OpenAI Placeholder

OpenAI is not selected in the current repository baseline. Official OpenAI documentation describes audit log APIs, RBAC, moderation, safety, and data retention concepts, but this task does not configure a live OpenAI organization.

The OpenAI placeholder rows remain:

- `blocked_pending_provider_selection`
- no retention-days assertion
- no model allow-list assertion
- no moderation assertion
- explicit unsupported-control records

## Retention Drift Response

If retention, export destination, event class allow-list, or payload policy drifts:

1. Stop using the affected baseline for release evidence.
2. Run `pnpm validate:426-model-audit-and-safety`.
3. Run `pnpm exec tsx tools/browser-automation/426_verify_model_audit_and_safety.spec.ts --run`.
4. Reconcile the manifest through change control before marking the affected environment ready again.

## Non-Production Rings

Task 426 covers development, integration/test-equivalent, and training/preprod-rehearsal postures through the task 425 environment registry. Production vendor environments are explicitly out of scope, and production apply is not represented by these manifests.
