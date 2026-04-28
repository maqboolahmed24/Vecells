# mock-telephony-carrier

Local carrier twin for seq_032.

## Run

```bash
pnpm start
```

Defaults:

- Host: `127.0.0.1`
- Port: `4180`

## HTTP surfaces

- `GET /api/health`
- `GET /api/registry`
- `GET /api/numbers`
- `POST /api/numbers/assign`
- `POST /api/numbers/release`
- `GET /api/calls`
- `POST /api/calls/simulate`
- `POST /api/calls/:id/advance`
- `POST /api/calls/:id/retry-webhook`

The service preserves the same truth split as the blueprint: call transport, recording availability, transcript derivation, continuation dispatch, and routine-promotion readiness remain separate states.
