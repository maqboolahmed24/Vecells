# Internal Test Support Runbook

Status: support instructions for the internal test window. This is not an official launch runbook.

## Ownership

- Internal test owner: `<internal-test-owner>`
- Technical owner: `<technical-owner>`
- Feedback collection location: `<private-team-channel-or-doc>`
- Test window start: `<start-date-time>`
- Test window end: `<end-date-time>`
- Render service URL: `<RENDER_INTERNAL_URL>`
- Render service dashboard: `<RENDER_SERVICE_DASHBOARD_URL>`

Do not commit or paste the shared password into this file.

## Before Sending To Testers

1. Confirm the latest `main` commit is deployed.
2. Confirm hosted smoke has passed:
   - `/health` returns `200`.
   - Anonymous visitors see only the password page.
   - Wrong password is rejected.
   - Correct password opens the internal menu.
   - Each app link opens behind authentication.
   - Logout returns to the password page.
3. Confirm the tester guide contains the final Render URL placeholder replaced in the outbound message only.
4. Confirm testers receive the shared password outside Git and outside committed docs.
5. Confirm testers are told to use synthetic/fake data only.

## Rotate The Shared Password

Use this when starting a new test round, when a password may have leaked, or when ending access for a previous group.

1. Pick a new temporary shared password outside Git.
2. Generate a new hash without putting the password in shell history:

```bash
read -rsp "New internal password: " INTERNAL_TEST_PASSWORD
echo
export INTERNAL_TEST_PASSWORD
pnpm --dir services/internal-entrypoint hash-password
unset INTERNAL_TEST_PASSWORD
```

3. In the Render Dashboard, open the internal entrypoint service.
4. Update `INTERNAL_TEST_PASSWORD_HASH` to the new hash.
5. Redeploy or restart the service so the new environment value is active.
6. Share the new password only in the private test channel.

To invalidate existing sessions too, rotate `SESSION_SECRET` and redeploy.

## Disable Access Quickly

Preferred quick options:

- Enable Render maintenance mode for the web service.
- Suspend the service from the Render Dashboard.
- Rotate `INTERNAL_TEST_PASSWORD_HASH` to a new password that has not been shared, then redeploy.

After access is disabled, post a short message in the private test channel saying the test window is paused or closed.

## Check Service Status And Logs

1. Open the Render service dashboard.
2. Check the service status on the Overview or Events page.
3. Open the Logs page and look for startup, deploy, or runtime errors.
4. For a failed deploy, open the deploy event and inspect the build/start logs.
5. Do not paste logs containing secrets, cookies, or internal URLs into public channels.

Useful verified references:

- Render Dashboard: https://render.com/docs/render-dashboard
- Render logs: https://render.com/docs/logging
- Render deploys: https://render.com/docs/deploys/
- Render maintenance mode: https://render.com/docs/maintenance-mode

## Redeploy Or Roll Back

To redeploy the latest allowed commit:

1. Open the service in Render.
2. Select Manual Deploy.
3. Select Deploy latest commit.
4. Wait for the deploy to finish.
5. Repeat hosted smoke before telling testers to continue.

To roll back:

1. Open the service Events page.
2. Find the most recent successful deploy before the bad deploy.
3. Select Rollback for that deploy.
4. Confirm the rollback.
5. Repeat hosted smoke before telling testers to continue.

Useful verified references:

- Render rollbacks: https://render.com/docs/rollbacks
- Deploying a specific commit: https://render.com/docs/deploying-a-commit

## Free-Tier Expectations

The first internal deployment is configured as a free Render web service. Render free web services can spin down after idle time, so testers may see a slow first request before the service responds.

Useful verified reference:

- Render free tier: https://render.com/free

## End The Internal Test

1. Tell testers the internal test window is closed.
2. Rotate the shared password to an unshared value.
3. Rotate `SESSION_SECRET` to invalidate active sessions.
4. Redeploy the service or disable/suspend it.
5. Archive the feedback.
6. Remove the Render URL from any active tester announcement.
7. Confirm no real patient data was submitted in feedback or screenshots.
8. Decide whether Prompt 10 should close the test formally with rollback/removal steps.
