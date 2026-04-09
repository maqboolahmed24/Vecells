# 12 Language Standards And Allowed Toolchains

The runtime and shared-workspace baseline is TypeScript-first. Python remains allowed only for bounded analysis and validator tooling; YAML and Markdown remain delivery-control artifacts, not runtime truth owners.

## Language Posture Scorecard

| Posture | Shared contracts | Codegen | Validation | Impedance | Tooling fit | Sprawl resistance | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TypeScript everywhere | 5 | 5 | 4 | 5 | 2 | 5 | rejected |
| TypeScript-first runtime plus bounded Python tooling | 5 | 5 | 5 | 5 | 5 | 5 | chosen |
| Polyglot service family split | 3 | 3 | 4 | 2 | 5 | 1 | rejected |

## TypeScript Runtime Standards

- Compiler posture: strict mode, exact optional property types, unchecked index access disallowed, unknown-in-catch, composite projects, declaration output, and project references.
- Contract posture: route, live-channel, and event contracts emit machine-readable schemas and generated clients from one canonical source package.
- Runtime validation posture: published schemas compile to validators; ad hoc route-local parsing and hand-rolled DTO drift are forbidden.
- Date and time posture: wire timestamps are explicit UTC instants; business-local schedules carry IANA timezone IDs and local calendar fields rather than ambiguous strings.
- ID posture: opaque prefixed IDs and correlation IDs are typed value objects, not bare strings threaded by convention.
- Numeric posture: currency, dosage, and exact-scale values serialize as strings or scaled integers; floating point arithmetic is never canonical business truth.
- Error posture: structured error family, code, and recovery hints; UI or service branching on free-text messages is forbidden.

## Allowed Secondary Toolchains

- Python is allowed only in `tools/analysis` and `tools/validators`.
- Shell scripts and YAML may bootstrap delivery or CI, but they may not own canonical contracts or state transitions.
- Unbounded Go, JVM, or Python runtime services are outside the baseline and fail validation without a later explicit ADR.
