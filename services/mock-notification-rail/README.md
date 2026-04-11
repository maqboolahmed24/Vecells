# mock-notification-rail

Local notification rail twin for `seq_033`.

## Run

```bash
pnpm start
```

Defaults:

- Host: `127.0.0.1`
- Port: `4190`

## HTTP surfaces

- `GET /api/health`
- `GET /api/registry`
- `GET /api/messages`
- `POST /api/messages/simulate`
- `POST /api/messages/:id/retry-webhook`
- `POST /api/messages/:id/repair`
- `POST /api/messages/:id/settle`

The service keeps transport acceptance, delivery evidence, dispute posture, repair, and authoritative settlement distinct on purpose.
