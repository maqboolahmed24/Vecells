# 397 Change Notice Workflow

## Notice Types

| Change type   | Required lead time | Examples                                                             |
| ------------- | ------------------ | -------------------------------------------------------------------- |
| `minor`       | `P1M`              | Jump-off copy, non-functional screen text, safe-route copy updates.  |
| `significant` | `P3M`              | Changed journey flow, new write action, altered embedded navigation. |
| `new_journey` | `P3M`              | Additional NHS App journey path or new functionality.                |

## Workflow

1. Create a `JourneyChangeNotice` with affected journey refs, manifest version, planned change date, and integration manager ref.
2. Validate lead time. Notices that miss the lead-time window are recorded as `blocked_lead_time`.
3. Keep the affected journeys bound to the current manifest until the notice is approved.
4. Re-run cohort, route disposition, and monthly pack validation after the manifest version changes.
5. Supersede older notices only by writing a new notice tied to the new manifest version.
