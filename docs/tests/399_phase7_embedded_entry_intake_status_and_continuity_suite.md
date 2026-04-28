# 399 Phase 7 Embedded Entry, Intake, Status, and Continuity Suite

Task `399` is the first final proof battery for the NHS App patient-visible chain. It proves that embedded entry, SSO return, intake, request status, more-info, messaging, callback, and continuity behavior run through repository-owned browser and backend contracts.

## Executable Proofs

| Proof                      | File                                                               | Purpose                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell resolution and entry | `tests/playwright/399_shell_resolution_and_embedded_entry.spec.ts` | Proves redaction, shell handoff, spoofed query safety, and embedded header/footer suppression.                                                              |
| SSO and safe re-entry      | `tests/playwright/399_sso_silent_auth_and_safe_reentry.spec.ts`    | Proves silent success, consent denial, expired session, wrong-context recovery, and safe re-entry copy.                                                     |
| Intake continuity          | `tests/playwright/399_intake_resume_review_and_receipt.spec.ts`    | Proves embedded intake start, autosave, review, receipt promotion, resume, and promoted-draft recovery.                                                     |
| Status and messaging       | `tests/playwright/399_status_more_info_and_messages.spec.ts`       | Proves request status, more-info submit, callback state, message thread rendering, and same-shell continuity.                                               |
| Backend continuity law     | `tests/integration/399_entry_and_continuity_contract.spec.ts`      | Proves context resolution, single-redemption SSO grants, replay denial, subject mismatch, manifest drift, context drift, expiry, and promoted-draft denial. |

Run the full proof pack with:

```bash
pnpm validate:399-phase7-entry-continuity-suite
pnpm exec tsx tests/integration/399_entry_and_continuity_contract.spec.ts --run
pnpm exec tsx tests/playwright/399_shell_resolution_and_embedded_entry.spec.ts --run
pnpm exec tsx tests/playwright/399_sso_silent_auth_and_safe_reentry.spec.ts --run
pnpm exec tsx tests/playwright/399_intake_resume_review_and_receipt.spec.ts --run
pnpm exec tsx tests/playwright/399_status_more_info_and_messages.spec.ts --run
```

## Pass/Fail Boundary

This suite fails the phase when:

- a query hint or user-agent alone unlocks trusted embedded mode
- raw SSO or asserted identity plumbing appears in URL, visible text, console output, or automation anchors
- replayed or late `SSOEntryGrant` callbacks can produce a reusable session
- consent denial, expiry, manifest drift, context drift, or subject mismatch leads to a blank page, loop, or privileged shell
- promoted drafts reopen writable intake fields
- more-info, callback, or messages break same-shell request ownership

Current machine-readable results live in `data/test/399_suite_results.json`.
