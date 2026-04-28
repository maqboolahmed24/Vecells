# 378 External Reference Notes

Recorded: 2026-04-27

## Official References Reviewed

- NHS App developer web integration guidance: https://nhsconnect.github.io/nhsapp-developer-documentation/web-integration-guidance/
- NHS App web integration process: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/nhs-app-web-integration
- Standards for NHS App integration: https://digital.nhs.uk/services/nhs-app/how-to-integrate-with-the-nhs-app/standards-for-nhs-app-integration

## Borrowed Into 378

- NHS App traffic may be identified for presentation through user-agent markers and query parameters, so the resolver records both as evidence but does not treat either as authority.
- The same URLs may serve browser and NHS App journeys, so the backend emits one `ChannelContext` and one SSR hydration envelope for route components to consume.
- NHS login SSO handoff is a separate integration concern, so `validated_sso` is accepted only as fenced input and still depends on local session, manifest, continuity, bridge, and route-freeze posture.
- Webview limitations around downloads, external links, and native navigation are modeled as `ShellPolicy` and route-scoped `PatientEmbeddedNavEligibility`, not route-component guesses.
- Integration standards and onboarding evidence remain external release obligations; this task records deterministic local contract behavior only.

## Rejected Or Deferred Claims

- Rejected: `from=nhsApp` unlocks embedded trust. It only allows presentation hints and can return `placeholder_only`.
- Rejected: user-agent detection is enough for live bridge actions. User-agent is evidence-only and returns `embedded_revalidate_only` without stronger proof.
- Rejected: a stale manifest tuple or frozen route can keep live CTAs visible. Manifest drift and route freeze downgrade the embedded session projection.
- Rejected: the client can recompute embedded trust during hydration. SSR emits a server envelope and hydration conflicts downgrade to bounded recovery.
- Deferred: production NHS App bridge capability probing, live SSO assertion binding, limited release approval, and SCAL evidence. Those remain owned by downstream tracks.

## Local Source Of Truth

The local contracts from `373`, `375`, and `377` remain authoritative. Official references sharpen the distinction between presentation detection and backend trust, and the implementation keeps that distinction explicit.
