# 112 Route Guard And Feature Flag Plumbing

`par_112` publishes one browser-authority seam in [packages/persistent-shell/src/route-guard-plumbing.tsx](/Users/test/Code/V/packages/persistent-shell/src/route-guard-plumbing.tsx). The module consumes one `FrontendContractManifest`, one `AudienceSurfaceRuntimeBinding`, audience and channel context, release or trust posture, and governed freeze or recovery dispositions, then returns one typed `RouteGuardDecision` plus route-scoped `ActionGuardDecision` results.

## Guard Surface

- Route ownership and audience or channel eligibility are resolved first.
- Runtime binding hydration is separate from route rendering and fails closed to `recovery_only` until the binding validates.
- Release or trust posture can degrade route calmness before any capability switch is evaluated.
- Capability switches are manifest-derived route or action capabilities, not route-local booleans.
- Route freeze and recovery dispositions only activate after an earlier authority stage degrades the route or explicitly freezes it.

## Published Types

- `RouteGuardDecision`: final route posture, same-shell downgrade mode, selected-anchor handling, recovery action, and precedence trail.
- `ActionGuardDecision`: final action posture for one capability switch inside the guarded route.
- `RuntimeBindingHydrationSnapshot`: browser-facing binding status with `binding_pending`, `binding_ready`, and `binding_invalid`.
- `ManifestCapabilitySwitch`: typed route or action capability derived from manifest membership, channel eligibility, and final route posture.

## Capability Switch Model

The capability switch registry is intentionally minimal and subordinate to manifest truth:

- `route_entry`
- `projection_query`
- `mutation_command`
- `live_update_channel`
- `cache_reuse`
- `recovery_action`
- `embedded_bridge`

The visible labels are plain-language capability labels such as `Route access`, `Primary governed action`, and `Embedded host bridge`. Inspector detail may still carry manifest refs, route-family refs, and reason refs without leaking toggle names into the route specimen itself.

## Same-Shell Downgrade Rules

- `live -> read_only`: preserve header, selected anchor, and last safe summary; freeze primary mutation.
- `live -> recovery_only`: preserve shell footprint and current anchor, then expose one governed recovery action.
- `live -> blocked`: keep the shell frame and route summary visible, but reset the selected anchor to the route default if the current object can no longer remain causally honest.
- `read_only/recovery_only -> live`: only after a fresh runtime binding validates the same manifest tuple.

## Files

- Code: [route-guard-plumbing.tsx](/Users/test/Code/V/packages/persistent-shell/src/route-guard-plumbing.tsx)
- Unit tests: [route-guard-plumbing.test.ts](/Users/test/Code/V/packages/persistent-shell/tests/route-guard-plumbing.test.ts)
- Browser lab: [112_route_guard_lab.html](/Users/test/Code/V/docs/architecture/112_route_guard_lab.html)
- Browser spec: [route-guard-and-feature-flags.spec.js](/Users/test/Code/V/tests/playwright/route-guard-and-feature-flags.spec.js)
- Validator: [validate_route_guard_plumbing.py](/Users/test/Code/V/tools/analysis/validate_route_guard_plumbing.py)

## Gap Resolutions

- `GAP_RESOLUTION_FEATURE_SWITCH_ROUTE_CAPABILITY_TYPES`: the blueprint corpus forbids loose flags but does not publish one generic capability-switch object, so `par_112` defines a minimal typed route and action capability registry.
- `GAP_RESOLUTION_FEATURE_SWITCH_PLAIN_LANGUAGE_LABELS`: visible capability labels are normalized to route-language labels while inspector detail still carries contract refs.
- `GAP_RESOLUTION_GUARD_COPY_ROUTE_RECOVERY`: when the corpus specifies posture but not exact downgrade copy, the implementation preserves the same-shell posture and last safe summary first, then supplies neutral recovery copy.

## Assumptions

- `ASSUMPTION_EMBEDDED_MINIMUM_CAPABILITIES`: embedded patient recovery requires `signed_identity_bridge` plus `host_return`. Missing either capability downgrades to `recovery_only` with governed handoff.
- `ASSUMPTION_CONSTRAINED_BROWSER_CHANNEL_MATCH`: telephony or proxy capture routes only remain live while the route declares `constrained_browser` and the current context matches it exactly.

## Source Refs

- `blueprint/platform-frontend-blueprint.md`
- `blueprint/platform-runtime-and-release-blueprint.md`
- `blueprint/patient-portal-experience-architecture-blueprint.md`
- `blueprint/phase-7-inside-the-nhs-app.md`
- `blueprint/forensic-audit-findings.md`
