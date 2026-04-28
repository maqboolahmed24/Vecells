# 309 Phase 4 End-to-End, Accessibility, and Load Plan

This plan binds the final Phase 4 assurance battery to the whole local-booking product experience. The goal is not another route-slice proof. The goal is one release-grade evidence bundle across patient launch, staff-assisted handling, notification and record-origin re-entry, responsive and embedded parity, accessibility posture, artifact parity, and realistic load.

## Scope

- Patient launch and continuity: `PatientAppointmentWorkspaceProjection`, `PatientBookingReturnContract`, `PatientPortalContinuityEvidenceBundle293`, and same-shell selected-anchor law.
- Notification and re-entry: `BookingNotificationEntryProjection`, secure-link provenance, notification banner singularity, record-origin continuation, and recovery-envelope reuse.
- Confirmation and manage truth: `BookingConfirmationProjection`, `ExternalConfirmationGate`, `PatientAppointmentManageProjection`, and artifact exposure monotonicity.
- Staff-assisted truth: `StaffBookingHandoffPanel`, compare anchors, stale-owner recovery, review-lease state, and reconciliation-required posture.
- Waitlist continuity: `WaitlistContinuationTruthProjection`, `WaitlistFallbackObligation`, deadline monotonicity, and hub or callback fallback debt.
- Performance and accessibility evidence: Core Web Vitals support targets, keyboard and focus return, reflow-safe responsive posture, reduced-motion posture, and browser-visible load outcomes.

## Suite Map

| Suite | Files | Governing objects | Failure modes closed |
| --- | --- | --- | --- |
| Patient and staff local booking E2E | `tests/playwright/309_patient_staff_local_booking_e2e.spec.ts` | patient workspace route family, `BookingConfirmationProjection`, `PatientAppointmentManageProjection`, `StaffBookingHandoffPanel` | self-service booking never reaches manage truth, staff shell widens pending or stale states into calm confirmation, patient and staff recovery truth diverge |
| Notification and record-origin re-entry | `tests/playwright/309_notification_and_record_origin_reentry.spec.ts` | `PatientBookingEntryProjection`, `BookingNotificationEntryProjection`, `PatientBookingReturnContract` | lawful launches lose quiet return, record-origin continuation drops recovery token, secure-link replay duplicates banners or resets same-shell continuity |
| Mobile, tablet, desktop, embedded parity | `tests/playwright/309_mobile_tablet_desktop_embedded_parity.spec.ts` | responsive booking frame, embedded-shell markers, sticky action tray, selected anchor preservation | narrow or embedded posture forks the journey, safe-area handling hides actions, mobile overflow breaks reflow safety |
| Artifact, print, and export parity | `tests/playwright/309_artifact_print_and_export_parity.spec.ts` | `AppointmentPresentationArtifact`, `BookingConfirmationProjection`, artifact exposure states | receipt or print routes outrun confirmation truth, reconciliation routes still export calm artifacts, embedded artifact actions exceed summary-only posture |
| Accessibility matrix | `tests/playwright/309_accessibility_matrix.spec.ts` | accessibility contract, route landmarks, live regions, focus return, target size, reduced-motion markers | pending or recovery states lose assistive semantics, sticky trays obscure focus, staff mutation controls fall below minimum target size |
| Visual regression stability | `tests/playwright/309_visual_regression.spec.ts` | route-family composite surfaces, release board rendering | high-value booking surfaces drift silently, repeat capture produces unstable render output, release board degrades into a generic dashboard |
| Lifecycle and notification truth | `tests/integration/309_end_to_end_lifecycle_and_notification_truth.spec.ts` | `ExternalConfirmationGate`, `WaitlistContinuationTruthProjection`, notification integration, governed reopen | callback-before-read mints a booked state, waitlist deadline resets on fallback refresh, reopened notifications lose request ownership or deep-link safety |
| Local booking load probe | `tests/load/309_phase4_local_booking_load_probe.ts` | route-ready latency, browser-visible responsiveness, mixed patient and staff activity | slot-search bursts and confirmation churn are measured on empty pages, mixed-role load has no governed evidence, performance cards hide route-latency regressions |

## Case IDs

- `INT309_001`: pending commit remains non-booked until authoritative read confirms one appointment chain.
- `INT309_002`: waitlist deadline authority survives offer expiry and hub fallback refresh without reset.
- `INT309_003`: handoff and reopen notifications preserve patient-safe deep links and return lifecycle ownership to triage.
- `E2E309_001`: patient self-service flow reaches selection, review, pending, confirmed, and manage truth in one same-shell family.
- `E2E309_002`: staff-assisted flow keeps compare-live, pending confirmation, and stale recovery explicit.
- `E2E309_003`: patient reconciliation and staff stale-owner recovery stay aligned on unresolved confirmation truth.
- `REENTRY309_001`: home, requests, and appointments launches preserve distinct quiet-return binders.
- `REENTRY309_002`: record-origin entry preserves continuation and recovery tokens into the workspace shell.
- `REENTRY309_003`: secure-link handoff, confirmed manage replay, and reopened recovery remain single-banner and same-shell safe.
- `VIEW309_001`: desktop, tablet, and mobile surfaces keep one route family while adapting breakpoint posture.
- `VIEW309_002`: embedded confirmation, manage, and waitlist routes preserve `nhs_app` host markers and safe-area behavior.
- `VIEW309_003`: compact sticky-tray posture remains overflow-safe and keyboard-safe.
- `ART309_001`: confirmed artifact modes stay aligned on receipt, calendar, print, and browser-handoff readiness.
- `ART309_002`: reconciliation artifact routes degrade to recovery-only posture and block detached export calmness.
- `ART309_003`: embedded artifact delivery remains summary-only.
- `A11Y309_001`: patient workspace and confirmation surfaces stay landmark-complete, live-region-complete, and axe-clean.
- `A11Y309_002`: narrow reflow and reduced-motion routes preserve focus visibility and motion-safe meaning.
- `A11Y309_003`: staff controls preserve target size, focus return, and scoped accessibility posture.
- `VIS309_001`: patient and staff screenshot captures remain deterministic across repeat capture.
- `VIS309_002`: the evidence board renders stably with the required premium layout regions.
- `LOAD309_001`: slot-search bursts stay inside support budgets at the 75th percentile.
- `LOAD309_002`: confirmation-state churn stays inside support budgets at the 75th percentile.
- `LOAD309_003`: mixed patient and staff booking activity stays inside support budgets at the 75th percentile.

## Browser Projects

- Desktop patient: 1440px and 1366px widths for workspace, confirmation, manage, and artifact proof.
- Tablet patient: 1024px width for manage and parity proof.
- Mobile patient: 430px and 390px widths for compact sticky-tray, waitlist, and overflow proof.
- Narrow reflow patient: 320px width for zoom-safe reflow proof.
- Embedded patient: `host=nhs_app&safeArea=bottom` plus reduced motion.
- Desktop staff: 1440px width for compare-live, pending confirmation, and stale recovery.
- Mixed load contexts: isolated BrowserContext-per-run in line with Playwright isolation guidance.

## Performance Support Targets

Support targets for reporting are based on current official Core Web Vitals guidance and must never override continuity or truth failures:

- `LCP <= 2.5s`
- `INP-style interaction latency <= 200ms`
- `CLS <= 0.1`

The load probe records route-ready latency, navigation timing, LCP when Chromium exposes it, and CLS. The evidence board reports the 75th percentile per scenario and highlights whether any metric exceeded the support target.

## Evidence Board

`docs/testing/309_phase4_e2e_evidence_board.html` is the reviewer-facing surface for this battery. It must keep one synchronized scenario rail and inspector, not a KPI wall. The board uses the required regions:

- `JourneyScenarioRail`
- `ContinuityFrameSummary`
- `ViewportParityGrid`
- `AccessibilityCoverageTable`
- `PerformanceBudgetStrip`
- `ArtifactAndTraceInspector`
- `FailureClusterTable`

## Run Commands

```bash
pnpm exec vitest run \
  /Users/test/Code/V/tests/integration/309_end_to_end_lifecycle_and_notification_truth.spec.ts
pnpm exec tsx /Users/test/Code/V/tests/playwright/309_patient_staff_local_booking_e2e.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/309_notification_and_record_origin_reentry.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/309_mobile_tablet_desktop_embedded_parity.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/309_artifact_print_and_export_parity.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/309_accessibility_matrix.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/playwright/309_visual_regression.spec.ts --run
pnpm exec tsx /Users/test/Code/V/tests/load/309_phase4_local_booking_load_probe.ts --run
pnpm validate:309-phase4-e2e-suite
```

## Evidence Bundle Requirements

The machine-readable bundle in `data/test-reports/309_phase4_e2e_results.json` must record, for every case:

- `providerRef`
- `environmentId`
- `seed`
- `artifactRefs`
- `status` from `passed`, `failed`, `blocked`, or `unsupported`

The companion files must remain separate:

- `data/test-reports/309_phase4_accessibility_results.json` for assistive coverage, aria snapshots, and axe outcomes
- `data/test-reports/309_phase4_performance_results.json` for route-ready and Core Web Vitals support metrics
- `data/test-reports/309_phase4_e2e_failure_clusters.json` for any blocked or unsupported paths instead of silently flattening them into passes
