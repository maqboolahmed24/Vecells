# 400 Phase 7 Booking, Pharmacy, Artifact, Navigation, and Webview Suite

Task `400` is the second final proof battery for the NHS App patient-visible chain. It proves booking, alternative offers, waitlist, manage, calendar handoff, pharmacy choice/status/recovery, deep links, site links, outbound navigation grants, and embedded artifact handling under webview constraints.

## Executable Proofs

| Proof                               | File                                                                       | Purpose                                                                                                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep links and site links           | `tests/playwright/400_deep_links_site_links_and_return_to_journey.spec.ts` | Proves Android and iOS association payloads, configured site-link opening, replay/expiry recovery, and unconfigured browser fallback evidence in an isolated Playwright context. |
| Booking and bridge navigation       | `tests/playwright/400_booking_waitlist_manage_and_calendar.spec.ts`        | Proves offer selection, alternative-offer drift, waitlist, manage, calendar handoff, unsupported calendar capability, native back leases, and booking re-entry state.            |
| Pharmacy status and recovery        | `tests/playwright/400_pharmacy_choice_status_and_recovery.spec.ts`         | Proves provider choice, instructions, pending status, outcome, urgent recovery, and patient-visible state consistency across embedded and browser-sized contexts.                |
| Artifact fallback and navigation    | `tests/playwright/400_artifact_fallback_and_navigation.spec.ts`            | Proves summary-first artifact rendering, preview, byte-transfer posture, secure-send-later fallback, route freeze, return-safe recovery, and outbound grant blocking.            |
| Backend navigation and artifact law | `tests/integration/400_booking_artifact_navigation_contract.spec.ts`       | Proves site-link grant redemption, replay, expiry, subject mismatch, promoted-draft denial, bridge grant validation, calendar capability gating, and artifact byte-grant fences. |

Run the full proof pack with:

```bash
pnpm validate:400-phase7-booking-artifact-suite
pnpm exec tsx tests/integration/400_booking_artifact_navigation_contract.spec.ts --run
pnpm exec tsx tests/playwright/400_deep_links_site_links_and_return_to_journey.spec.ts --run
pnpm exec tsx tests/playwright/400_booking_waitlist_manage_and_calendar.spec.ts --run
pnpm exec tsx tests/playwright/400_pharmacy_choice_status_and_recovery.spec.ts --run
pnpm exec tsx tests/playwright/400_artifact_fallback_and_navigation.spec.ts --run
```

## Pass/Fail Boundary

This suite fails the phase when:

- Android App Links or iOS Associated Domains exports drift from the phase 7 manifest
- a site link, secure link, replayed token, expired token, wrong-patient link, or promoted draft opens full PHI or mutable state outside its governed fence
- booking alternatives, waitlist, manage, calendar, native back, or re-entry flows lose selected-anchor continuity
- pharmacy choice, instructions, status, outcome, or urgent recovery contradict the backend truth projection or lose the selected provider context
- byte delivery is attempted without a live bridge, current continuity, matching subject/session, supported MIME type, and size-safe payload
- outbound navigation launches PHI-bearing or stale/mismatched URLs to the external browser
- unsupported print/download/browser behavior leaves a dead end instead of same-shell recovery

Current machine-readable results live in `data/test/400_suite_results.json`.
