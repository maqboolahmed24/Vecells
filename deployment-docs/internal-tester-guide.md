# Vecells Internal Tester Guide

Status: internal testing pack. This is not an official launch.

Do not enter real patient data, real contact details, real provider details, or real credentials. Use synthetic/fake data only.

## Access

Open this URL:

`https://<replace-with-render-service>.onrender.com`

You will be asked for one shared internal test password. The password will be shared outside Git and outside these docs, for example in the private team channel for this test window.

Do not put the password in screenshots, feedback notes, tickets, chat history outside the test channel, or copied browser output.

## What To Try

After login, use the internal menu to open each surface:

- Patient
- Clinical
- Ops
- Hub
- Pharmacy
- Support
- Governance

For each surface, try the normal path a tester would expect: open the page, scan the content, click through the main actions, and note anything confusing, broken, slow, or visually wrong.

## Important Limits

- This is for internal testing only.
- This is not an official production service.
- The Render service is currently configured on the free tier, so the first page load can be slow after the service has been idle.
- State is synthetic and disposable; it can be reset or removed.
- No official production data is connected.
- No real provider integrations are available unless the deployment owner explicitly says they were deployed for this test.

## Reset Your Browser State

If the app gets stuck or old test data is confusing:

1. Go back to the internal menu.
2. Select the browser-state reset action.
3. Reopen the surface you were testing.

## Reporting Feedback

Use the feedback template shared with the rollout message. If you only have this guide, ask the internal test owner for the template before sending feedback.

Include:

- what you were trying to do;
- what you expected to happen;
- what actually happened;
- the surface name;
- your browser/device;
- a screenshot only if it contains no secrets and no patient data.

For urgent blockers, send the feedback immediately to the internal test owner instead of waiting until the end of the test window.
