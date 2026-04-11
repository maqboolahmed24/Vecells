# mock-notification-studio

Premium local notification operations studio for `seq_033`.

Visual mode: `Quiet_Send_Studio`

## Run

```bash
pnpm install
pnpm dev --host 127.0.0.1 --port 4191
```

Optional notification rail base URL:

```text
http://127.0.0.1:4191/?notificationBaseUrl=http://127.0.0.1:4190
```

The app embeds seeded data and still loads without the rail service. When the rail is present it uses the HTTP API for simulation, webhook retry, repair, and settlement actions.
