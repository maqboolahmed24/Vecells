# 426 Model Audit And Safety Runbook

Task: `par_426_phase8_use_Playwright_or_other_appropriate_tooling_browser_automation_to_configure_model_audit_logs_and_safety_settings`

## Current Provider Posture

The selected provider is inherited from task 425:

- primary provider: `vecells_assistive_vendor_watch_shadow_twin`
- posture: `watch_only_nonproduction`
- live vendor mutation: blocked
- apply mode: modeled, but blocked

OpenAI appears only as a future placeholder from `mvproj_425_preprod_openai_placeholder`. The 426 baseline must not mark OpenAI audit logs, retention, model access, or moderation settings as configured until a future provider-selection artifact and intended-use review exist.

## Operator Modes

Use the browser automation harnesses from the repository root:

```bash
pnpm exec tsx tools/browser-automation/426_configure_model_audit_and_safety.spec.ts --run --mode=dry_run
pnpm exec tsx tools/browser-automation/426_configure_model_audit_and_safety.spec.ts --run --mode=rehearsal
pnpm exec tsx tools/browser-automation/426_verify_model_audit_and_safety.spec.ts --run
```

`--mode=apply` is accepted by the harness only to prove it fails closed. It must return `blocked_for_apply` and must not mutate a live vendor dashboard.

## Configuration Checklist

1. Confirm task 425 manifests validate and the primary provider remains `vecells_assistive_vendor_watch_shadow_twin`.
2. Review `data/config/426_model_audit_baseline.example.json`.
3. Review `data/config/426_model_safety_baseline.example.json`.
4. Run `pnpm validate:426-model-audit-and-safety`.
5. Run the configure harness in `dry_run` or `rehearsal`.
6. Run the verify harness.
7. Store only the generated redacted evidence under `output/playwright/426-model-audit-and-safety/`.

## Required Gates Before Any Future Live Provider Apply

- `LIVE_GATE_MODEL_VENDOR_PROVIDER_SELECTED`
- `LIVE_GATE_ASSISTIVE_INTENDED_USE_REVIEW`
- verified provider audit-log access
- verified retention posture
- verified project-level model access restriction or equivalent deployment restriction
- verified safety or moderation guardrail posture
- machine-readable unsupported-control records for anything the vendor cannot expose

## Secret And Payload Rules

- Do not commit raw API keys, admin tokens, browser storage state, prompts, responses, audit payloads, or vendor exports.
- Manifest evidence may use `artifact://`, `evidence://`, `guardrail://`, and `blocked://` references only.
- Secret references remain in task 425's managed secret-reference manifests.
- Browser traces and screenshots are allowed only for the local redacted harness.

