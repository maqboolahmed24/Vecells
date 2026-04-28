# Prompt 10: Monitor, Rollback, And Close Internal Test

Run this after the internal tester rollout begins.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Operate the internal Render test safely, define rollback, collect results, and close the environment when testing is done.

Non-negotiable constraints:
- Internal test only, not official launch.
- No real patient data.
- Do not expose secrets.
- Do not leave access open indefinitely.
- Do not claim production readiness from internal smoke alone.

Must read first:
- deployment-docs/internal-tester-guide.md
- deployment-docs/internal-feedback-template.md
- deployment-docs/internal-support-runbook.md
- deployment-docs/internal-smoke-report.md
- output/result from Prompt 09

Monitoring plan:
1. Record test window start/end.
2. Check Render service status daily during the test.
3. Review logs for:
   - auth failures beyond expected wrong-password attempts;
   - 5xx responses;
   - repeated crashes/restarts;
   - database connection issues if a database is used;
   - accidental real data indicators.
4. Track tester feedback in one place.
5. Tag each issue:
   - deploy blocker;
   - tester usability;
   - data/state issue;
   - access/security;
   - performance/cold start;
   - out of scope for internal test.

Rollback plan:
1. Identify last known good commit on main.
2. Identify last known good Render deploy.
3. If a critical issue appears:
   - pause tester access by rotating password or disabling service;
   - roll back Render to last good deploy if available;
   - or revert the commit through Git and redeploy main.
4. Document exact rollback action and time.

Closeout plan:
1. Rotate or remove INTERNAL_TEST_PASSWORD_HASH.
2. Disable or delete temporary services if testing is complete.
3. Wipe disposable test data if a database was used.
4. Archive smoke report and tester feedback.
5. Write deployment-docs/internal-test-closeout.md with:
   - what was deployed;
   - who tested;
   - what passed;
   - what failed;
   - what must be fixed before another internal deployment;
   - what must be fixed before any public launch.

Validation:
- Verify protected entrypoint no longer allows old password after rotation/removal.
- Verify no test data remains if wipe was required.
- Verify Render billing/resources match team intent.

Deliverables:
- internal-test-closeout.md
- Updated unresolved risks list.
- Recommended next engineering tasks.
- Clear statement whether the internal environment remains active or is closed.

Acceptance criteria:
- Internal test has an owner, status, and closeout record.
- Access is rotated/closed as intended.
- Rollback path is documented.
- No official launch claim is made.
```

