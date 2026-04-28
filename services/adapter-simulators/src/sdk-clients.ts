import type {
  FailureMode,
  Im1CommitInput,
  Im1HoldInput,
  Im1ManageInput,
  Im1SearchInput,
  MeshDispatchInput,
  NhsLoginFlowInput,
  NotificationSendInput,
  RuntimeStateSnapshot,
  SimulatorDeckSnapshot,
  SimulatorFamilyCode,
  TelephonyStartInput,
} from "./backplane";

async function requestJson<T>(url: string, init?: globalThis.RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `Request failed with ${response.status}`);
  }
  return payload;
}

export class SimulatorControlPlaneClient {
  constructor(private readonly baseUrl: string) {}

  getDeck() {
    return requestJson<SimulatorDeckSnapshot>(`${this.baseUrl}/api/control/deck`);
  }

  getState() {
    return requestJson<RuntimeStateSnapshot>(`${this.baseUrl}/api/state`);
  }

  start(family?: SimulatorFamilyCode) {
    return requestJson<SimulatorDeckSnapshot>(`${this.baseUrl}/api/control/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ family }),
    });
  }

  stop(family?: SimulatorFamilyCode) {
    return requestJson<SimulatorDeckSnapshot>(`${this.baseUrl}/api/control/stop`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ family }),
    });
  }

  reset() {
    return requestJson<RuntimeStateSnapshot>(`${this.baseUrl}/api/control/reset`, {
      method: "POST",
    });
  }

  reseed(seedId?: string) {
    return requestJson<RuntimeStateSnapshot>(`${this.baseUrl}/api/control/reseed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ seedId }),
    });
  }

  setFailureMode(family: SimulatorFamilyCode, failureMode: FailureMode) {
    return requestJson<SimulatorDeckSnapshot>(`${this.baseUrl}/api/control/failure-mode`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ family, failureMode }),
    });
  }
}

export class NhsLoginSimulatorClient {
  constructor(private readonly baseUrl: string) {}

  beginFlow(input: NhsLoginFlowInput) {
    return requestJson(`${this.baseUrl}/api/nhs-login/begin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  deliverCallback(authSessionRef: string) {
    return requestJson(`${this.baseUrl}/api/nhs-login/callback`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authSessionRef }),
    });
  }

  replayCallback(authSessionRef: string) {
    return requestJson(`${this.baseUrl}/api/nhs-login/replay`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authSessionRef }),
    });
  }

  redeemCode(authSessionRef: string, idempotencyKey: string) {
    return requestJson(`${this.baseUrl}/api/nhs-login/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ authSessionRef, idempotencyKey }),
    });
  }
}

export class Im1SimulatorClient {
  constructor(private readonly baseUrl: string) {}

  search(input: Im1SearchInput) {
    return requestJson(`${this.baseUrl}/api/im1/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  hold(input: Im1HoldInput) {
    return requestJson(`${this.baseUrl}/api/im1/hold`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  commit(input: Im1CommitInput) {
    return requestJson(`${this.baseUrl}/api/im1/commit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  manage(input: Im1ManageInput) {
    return requestJson(`${this.baseUrl}/api/im1/manage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }
}

export class MeshSimulatorClient {
  constructor(private readonly baseUrl: string) {}

  dispatch(input: MeshDispatchInput) {
    return requestJson(`${this.baseUrl}/api/mesh/dispatch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  poll(mailboxKey: string) {
    return requestJson(`${this.baseUrl}/api/mesh/poll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mailboxKey }),
    });
  }

  acknowledge(messageRef: string) {
    return requestJson(`${this.baseUrl}/api/mesh/ack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
  }
}

export class TelephonySimulatorClient {
  constructor(private readonly baseUrl: string) {}

  start(input: TelephonyStartInput) {
    return requestJson(`${this.baseUrl}/api/telephony/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  advance(callRef: string) {
    return requestJson(`${this.baseUrl}/api/telephony/advance`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callRef }),
    });
  }

  emitWebhook(callRef: string) {
    return requestJson(`${this.baseUrl}/api/telephony/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callRef }),
    });
  }

  retryWebhook(callRef: string) {
    return requestJson(`${this.baseUrl}/api/telephony/retry-webhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callRef }),
    });
  }
}

export class NotificationSimulatorClient {
  constructor(private readonly baseUrl: string) {}

  send(input: NotificationSendInput) {
    return requestJson(`${this.baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  emitWebhook(messageRef: string) {
    return requestJson(`${this.baseUrl}/api/notifications/webhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
  }

  repair(messageRef: string) {
    return requestJson(`${this.baseUrl}/api/notifications/repair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
  }

  settle(messageRef: string) {
    return requestJson(`${this.baseUrl}/api/notifications/settle`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageRef }),
    });
  }
}

export function createSimulatorSdk(baseUrl: string) {
  return {
    control: new SimulatorControlPlaneClient(baseUrl),
    nhsLogin: new NhsLoginSimulatorClient(baseUrl),
    im1: new Im1SimulatorClient(baseUrl),
    mesh: new MeshSimulatorClient(baseUrl),
    telephony: new TelephonySimulatorClient(baseUrl),
    notifications: new NotificationSimulatorClient(baseUrl),
  } as const;
}
