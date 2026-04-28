# 385 Phase 7 Monthly Pack and Change Notice Data

## Monthly Pack Contract

`NHSAppPerformancePack` is generated per environment and period from the governed 384 telemetry contracts. The pack is replayable because it includes:

- `packId`
- `period`
- `environment`
- `manifestVersionRef`
- `releaseApprovalFreezeRef`
- `telemetryPlanRef`
- `eventContractRefs`
- `journeyUsage`
- `completionRates`
- `dropOffs`
- `guardrailBreaches`
- `incidentSummary`
- `accessibilityIssues`
- `safetyIssues`
- `packHash`

The monthly pack is aggregate-only. It does not accept raw JWTs, grant identifiers, NHS numbers, patient refs, email addresses, phone numbers, or query strings carrying PHI.

## Guardrail Inputs

The pack can include guardrail breach summaries produced from `ReleaseGuardrailPolicy`:

- auth failure rate
- journey error rate
- download failure rate
- support contact rate
- bridge failure rate
- telemetry presence
- compatibility evidence state
- continuity evidence state
- assurance slice state

## Change Notice Contract

`JourneyChangeNotice` records planned changes to NHS App journeys:

- `minor` changes require `P1M`
- `significant` changes require `P3M`
- `new_journey` changes require `P3M`

Each notice is tied to `manifestVersion`, `affectedJourneys`, `submittedAt`, and `plannedChangeAt`. Insufficient lead time is preserved as `blocked_lead_time` for audit and Integration Manager follow-up.
