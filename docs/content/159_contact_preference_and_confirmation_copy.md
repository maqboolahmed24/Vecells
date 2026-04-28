# 159 Contact Preference And Confirmation Copy

The `par_159` copy pack resolves:

- `GAP_RESOLVED_CONTACT_CONFIRMATION_COPY_PHASE1_PREVIEW_V1`
- `GAP_RESOLVED_CONTACT_CONFIRMATION_COPY_ROUTE_BOUNDARY_V1`

## Step Preview Copy

### `preference_incomplete`

- Title: `How we’ll confirm this`
- Body: `Add the missing route details before we can preview the confirmation wording that later receipt and notification surfaces will use.`

### `confirmation_attempt_planned`

- Title: `How we’ll confirm this`
- Body: `After you submit, we’ll plan to use this preferred route if it is still available and safe. This preview is not delivery confirmation.`

### `follow_up_declined`

- Title: `How we’ll confirm this`
- Body: `We’ll keep your preference with the request, but no routine follow-up is planned on this route unless you change that before submit.`

## Later Reused Copy States

### `confirmation_queued`

- Body: `A confirmation attempt is queued for the preferred route. That queue state is not delivery evidence.`

### `delivery_pending`

- Body: `A handoff to the preferred route may be in progress, but delivery has not been confirmed yet.`

### `delivery_confirmed`

- Body: `Delivery evidence is present for the masked preferred route. This state is only available once the later communication chain confirms it.`

### `recovery_required`

- Body: `The preferred route needs a protected recovery step. Do not assume a confirmation arrived on this route.`

## Truth Boundary

- Use `preference captured` language for current-step summary and preview.
- Use `queued` language only when a later queue state exists.
- Use `delivery pending` only when transport may be in progress.
- Use `delivery confirmed` only when later evidence exists.
- Never flatten these into one calm sentence.
