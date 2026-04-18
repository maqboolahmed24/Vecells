# 253 Analytics And Template Data Handling

## Boundary

`253` stores patient expectation content and typed outcome analytics.
It does not store raw external analytics payloads or grant operational authority to counters.

## Security rules

- analytics are observational only
- template resolution is tuple-bound
- stale or superseded versions remain auditable but are not selected for new consequence
- full wording may degrade to summary-safe or placeholder-safe in place
- raw external URLs are not required for template delivery

## Data minimisation

`AdviceUsageAnalyticsRecord` keeps only the refs and metadata needed to explain:

- what consequence class was active
- which template version and variant were shown
- which channel and locale were used
- whether the event happened inside or outside the active watch window

It does not replace the authoritative outcome chain.

## Explicit non-authority rule

Open, read, acknowledge, or recontact metrics must not settle:

- advice validity
- admin completion
- dependency legality
- review calmness

Operational state still comes from the canonical evaluators and settlement chain.
