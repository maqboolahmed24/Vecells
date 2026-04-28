# Wave 1 Observation Report

Generated: 2026-04-28T00:00:00.000Z

## Active verdict

- Verdict: stable
- Wave: wave_476_1_core_web_canary
- Watch tuple: RWT_LOCAL_V1
- Watch tuple hash: 9e419df51ddbbe289935c8f50152d2c69039cc8e9b6a443f83be09f054094779
- Dwell evidence: dwell_window_483_stable
- Widening eligibility: widening_eligibility_483_stable
- Next safe action: Wave 1 is stable. Task 484 may compute the next canary widening scope.

## Scenario coverage

- stable: stable; blockers=0
- observing: observing; blockers=1
- insufficient_evidence: insufficient_evidence; blockers=1
- tenant_slice_incident: pause_recommended; blockers=1
- staff_queue_projection_lag: pause_recommended; blockers=1
- assistive_freeze: pause_recommended; blockers=1
- runtime_parity_stale: rollback_recommended; blockers=1
- support_load_breach: pause_recommended; blockers=1
- channel_monthly_missing: blocked; blockers=1

## Browser evidence

- output/playwright/483-wave-observation/wave-observation/wave-observation.artifact-manifest.json
- output/playwright/483-wave-observation/wave-observation/wave_483_blocked.guardrails.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_blocked.mobile.png
- output/playwright/483-wave-observation/wave-observation/wave_483_blocked.tower.png
- output/playwright/483-wave-observation/wave-observation/wave_483_insufficient.guardrails.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_insufficient.tower.png
- output/playwright/483-wave-observation/wave-observation/wave_483_observing.dwell-timeline.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_observing.tower.png
- output/playwright/483-wave-observation/wave-observation/wave_483_pause.drawer.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_pause.incident-rail.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_pause.tower.png
- output/playwright/483-wave-observation/wave-observation/wave_483_rollback.rail.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_rollback.tower.png
- output/playwright/483-wave-observation/wave-observation/wave_483_stable.dwell-timeline.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_stable.guardrail-drawer.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_stable.guardrails.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_stable.timeline-drawer.aria.txt
- output/playwright/483-wave-observation/wave-observation/wave_483_stable.tower.png
- output/playwright/483-wave-observation/wave_483_blocked.trace.zip
- output/playwright/483-wave-observation/wave_483_insufficient_evidence.trace.zip
- output/playwright/483-wave-observation/wave_483_observing.trace.zip
- output/playwright/483-wave-observation/wave_483_pause_recommended.trace.zip
- output/playwright/483-wave-observation/wave_483_rollback_recommended.trace.zip
- output/playwright/483-wave-observation/wave_483_stable.trace.zip
