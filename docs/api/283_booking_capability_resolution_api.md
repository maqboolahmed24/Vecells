# 283 Booking Capability Resolution API

`283` publishes one backend surface family for current booking capability truth.

## Public read routes

- `GET /v1/bookings/cases/{bookingCaseId}/capability`
- `GET /v1/appointments/{appointmentId}/manage-capability`

These routes resolve one current `BookingCapabilityResolution` and one current `BookingCapabilityProjection` for the exact route tuple.

## Internal command and diagnostics routes

- `POST /internal/v1/bookings/capabilities:resolve-case`
- `POST /internal/v1/bookings/capabilities:resolve-appointment-manage`
- `GET /internal/v1/bookings/capabilities/diagnostics`

The internal command routes exist so later workers and controllers can persist a lawful tuple under explicit command and settlement refs instead of inferring capability ad hoc in browser or queue code.

## Response contract

Each successful resolution returns:

- one current matrix row
- one current compiled binding
- one adapter contract profile
- one dependency degradation profile
- one authoritative-read and confirmation policy seam
- one deterministic `capabilityTupleHash`
- machine-readable allowed action scopes
- machine-readable blocked reason codes
- machine-readable fallback action refs
- one audience projection bound to the same tuple

The diagnostics route returns the same authority chain plus currentness metadata so internal tooling can explain why the tuple is writable, degraded, recovery-only, or blocked.

## Query guarantees

The API keeps inventory, binding, resolution, and projection separate.
Consumers may not infer manage capability from appointment status, supplier label, or route family.
They must consume the returned `BookingCapabilityProjection`.

## Currentness rules

A read is current only when the stored resolution still matches the live scope key:

- booking case or appointment id
- governing object descriptor and governing object ref
- audience
- requested action scope

If the current scope drifts, the API returns the newer resolution and projection and the older tuple remains descriptive only.
