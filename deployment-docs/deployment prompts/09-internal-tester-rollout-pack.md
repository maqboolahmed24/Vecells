# Prompt 09: Internal Tester Rollout Pack

Run this only after Prompt 08 smoke passes or the user explicitly accepts documented limitations.

```text
You are Codex working in /Users/test/Code/V.

Goal:
Prepare the internal tester rollout material for nontechnical team members.

Non-negotiable constraints:
- Do not include the actual shared password in any committed doc.
- Do not call this official launch.
- Do not invite testers to enter real patient data.
- Keep instructions simple for nontechnical testers.
- Include one URL, one password concept, and clear feedback steps.

Must read first:
- deployment-docs/05-internal-access-control.md
- deployment-docs/internal-smoke-report.md if it exists
- output/result from Prompt 08

Create docs:
1. deployment-docs/internal-tester-guide.md
2. deployment-docs/internal-feedback-template.md
3. deployment-docs/internal-support-runbook.md

Tester guide must include:
- Internal testing only.
- Use synthetic/fake data only.
- One Render URL placeholder.
- How the password will be shared outside Git/docs.
- Which surfaces to try:
  - patient
  - clinical
  - ops
  - hub
  - pharmacy
  - support
  - governance
- Known limitations:
  - free-tier cold starts if applicable;
  - disposable/synthetic state;
  - no official production data;
  - no real provider integrations unless explicitly deployed.
- How to report feedback.

Feedback template must include:
- tester name;
- date/time;
- browser/device;
- surface used;
- steps taken;
- expected result;
- actual result;
- screenshot guidance with no secrets/patient data;
- severity:
  - blocker
  - confusing
  - visual issue
  - content wording
  - performance
  - other.

Support runbook must include:
- how to rotate password;
- how to disable access quickly;
- how to check Render service status/logs;
- how to redeploy previous commit if needed;
- who owns the internal test window;
- how to end the test and remove access.

Validation:
- Check docs contain no actual secret/password values.
- Check all URLs are placeholders or verified non-secret URLs.
- Check instructions are clear for nontechnical testers.

Deliverables:
- Files created/updated.
- Short rollout checklist.
- Exact unresolved risks.
- Next prompt to run: Prompt 10.

Acceptance criteria:
- Tester docs are ready.
- No secrets are committed.
- Nontechnical testers can follow the instructions without Git/Render knowledge.
```

