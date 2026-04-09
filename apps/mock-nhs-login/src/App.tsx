import { useEffect, useState } from "react";
import { nhsLoginCapturePack } from "./generated/nhsLoginCapturePack";

type View = "admin" | "signin" | "consent" | "return" | "settings";
type Mode = "mock" | "actual";
type AuthStage = "credentials" | "stepup";

type Pack = typeof nhsLoginCapturePack;
type Client = Pack["mock_clients"][number];
type TestUser = Pack["test_users"][number];
type RouteBinding = Pack["route_bindings"][number];
type ScopeBundle = Pack["scope_bundles"][number];
type Scenario = Pack["auth_scenarios"][number];
type EnvironmentProfile = Pack["environment_profiles"][number];
type PlaceholderField = Pack["placeholder_registry"]["placeholder_fields"][number];

type RegistryClientState = {
  friendlyName: string;
  im1Enabled: boolean;
  redirectsByEnv: Record<string, string[]>;
};

type LogEntry = {
  eventId: string;
  step: string;
  status: "info" | "success" | "warning" | "blocked";
  summary: string;
};

type ReturnCard = {
  title: string;
  tone: "success" | "warning" | "blocked";
  returnState: string;
  reasonCode: string;
  message: string;
  localSessionDecision: string;
  callbackUri: string;
  state: string;
  nonce: string;
  pkce: string;
  authCode: string;
  tokenPreview: string;
  userinfoPreview: string;
};

type AppState = {
  mode: Mode;
  view: View;
  authStage: AuthStage;
  selectedClientId: string;
  selectedEnvId: string;
  selectedRouteBindingId: string;
  selectedUserId: string;
  selectedScenarioId: string;
  registry: Record<string, RegistryClientState>;
  authFields: {
    email: string;
    password: string;
    otp: string;
    state: string;
    nonce: string;
    pkce: string;
  };
  newRedirectUri: string;
  adminMessage: string | null;
  errorSummary: string[];
  actualFields: Record<string, string>;
  logEntries: LogEntry[];
  returnCard: ReturnCard | null;
  lastSavedAt: string | null;
};

const STORAGE_KEY = "bluewoven-identity-simulator";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function initialMode(): Mode {
  const params = new URLSearchParams(window.location.search);
  return params.get("mode") === "actual" ? "actual" : "mock";
}

function initialView(): View {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (view === "signin" || view === "consent" || view === "return" || view === "settings") {
    return view;
  }
  return "admin";
}

function hasValue(values: readonly string[], value: string): boolean {
  return values.includes(value);
}

function routeBindingById(routeBindingId: string): RouteBinding {
  return nhsLoginCapturePack.route_bindings.find((row) => row.route_binding_id === routeBindingId)!;
}

function clientById(clientId: string): Client {
  return nhsLoginCapturePack.mock_clients.find((row) => row.client_id === clientId)!;
}

function userById(userId: string): TestUser {
  return nhsLoginCapturePack.test_users.find((row) => row.user_id === userId)!;
}

function scenarioById(scenarioId: string): Scenario {
  return nhsLoginCapturePack.auth_scenarios.find((row) => row.scenario_id === scenarioId)!;
}

function scopeBundleById(bundleId: string): ScopeBundle {
  return nhsLoginCapturePack.scope_bundles.find((row) => row.bundle_id === bundleId)!;
}

function environmentById(environmentId: string): EnvironmentProfile {
  return nhsLoginCapturePack.environment_profiles.find((row) => row.environment_profile_id === environmentId)!;
}

function makeRegistry(): Record<string, RegistryClientState> {
  const registry: Record<string, RegistryClientState> = {};

  for (const client of nhsLoginCapturePack.mock_clients) {
    const redirectsByEnv: Record<string, string[]> = {};
    const rows = nhsLoginCapturePack.redirect_uri_rows.filter((row) => row.client_id === client.client_id);
    for (const row of rows) {
      const current = redirectsByEnv[row.environment_profile_id] ?? [];
      redirectsByEnv[row.environment_profile_id] = [...current, row.callback_uri];
    }
    registry[client.client_id] = {
      friendlyName: client.friendly_name,
      im1Enabled: client.im1_enabled,
      redirectsByEnv,
    };
  }

  return registry;
}

function makeActualFields(): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const field of nhsLoginCapturePack.placeholder_registry.placeholder_fields) {
    fields[field.placeholder_id] = field.default_value;
  }
  return fields;
}

function initialState(): AppState {
  const base: AppState = {
    mode: initialMode(),
    view: initialView(),
    authStage: "credentials",
    selectedClientId: nhsLoginCapturePack.mock_clients[0].client_id,
    selectedEnvId: "env_local_mock",
    selectedRouteBindingId: nhsLoginCapturePack.mock_clients[0].route_binding_ids[0],
    selectedUserId: nhsLoginCapturePack.mock_clients[0].test_user_ids[0],
    selectedScenarioId: "happy_path",
    registry: makeRegistry(),
    authFields: {
      email: nhsLoginCapturePack.test_users[0].email,
      password: nhsLoginCapturePack.test_users[0].password,
      otp: nhsLoginCapturePack.test_users[0].otp,
      state: "state-patient-home-001",
      nonce: "nonce-home-001",
      pkce: "pkce-verifier-seq-025",
    },
    newRedirectUri: "",
    adminMessage: null,
    errorSummary: [],
    actualFields: makeActualFields(),
    logEntries: [],
    returnCard: null,
    lastSavedAt: null,
  };

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return base;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      ...base,
      ...parsed,
      mode: initialMode(),
      view: initialView(),
      registry: { ...base.registry, ...(parsed.registry ?? {}) },
      authFields: { ...base.authFields, ...(parsed.authFields ?? {}) },
      actualFields: { ...base.actualFields, ...(parsed.actualFields ?? {}) },
      errorSummary: parsed.errorSummary ?? [],
      logEntries: parsed.logEntries ?? [],
      returnCard: parsed.returnCard ?? null,
    };
  } catch {
    return base;
  }
}

function validationErrors(state: AppState): string[] {
  const errors: string[] = [];
  const routeBinding = routeBindingById(state.selectedRouteBindingId);
  const client = clientById(state.selectedClientId);
  const user = userById(state.selectedUserId);

  if (!state.authFields.email.trim()) {
    errors.push("Enter the mock user email address.");
  }
  if (!state.authFields.password.trim()) {
    errors.push("Enter the mock password.");
  }
  if (state.authStage === "stepup" && !state.authFields.otp.trim()) {
    errors.push("Enter the mock one-time passcode.");
  }
  if (!state.authFields.state.trim()) {
    errors.push("Provide a state value so route-intent fan-out stays explicit.");
  }
  if (!state.authFields.nonce.trim()) {
    errors.push("Provide a nonce so callback replay and stale-session checks remain testable.");
  }
  if (!state.authFields.pkce.trim()) {
    errors.push("Provide a PKCE verifier to keep the mock transport posture realistic.");
  }
  if (
    routeBinding.route_binding_id === "rb_gp_im1_pairing" &&
    (!state.registry[state.selectedClientId].im1Enabled || !user.im1_ready)
  ) {
    errors.push("IM1 pairing is disabled unless both the client and the test user carry the IM1 flag.");
  }
  if (
    routeBinding.route_binding_id === "rb_embedded_channel_future" &&
    state.selectedEnvId.startsWith("env_actual_")
  ) {
    errors.push("The embedded channel route stays deferred and cannot be used for actual-provider registration.");
  }
  if (!hasValue(client.route_binding_ids, routeBinding.route_binding_id)) {
    errors.push("The selected route binding does not belong to the active client.");
  }
  return errors;
}

function callbackUriFor(state: AppState): string {
  const routeBinding = routeBindingById(state.selectedRouteBindingId);
  const clientRedirects = state.registry[state.selectedClientId].redirectsByEnv[state.selectedEnvId] ?? [];
  const match = clientRedirects.find((uri) => uri.endsWith(`/auth/callback/${routeBinding.callback_slug}`));
  return match ?? `${environmentById(state.selectedEnvId).base_url}/auth/callback/${routeBinding.callback_slug}`;
}

function localSessionDecision(routeBinding: RouteBinding, user: TestUser): string {
  if (routeBinding.local_session_ceiling === "deferred_channel_only") {
    return "deferred_channel_only";
  }
  if (routeBinding.local_session_ceiling === "auth_read_only") {
    return "auth_read_only";
  }
  if (routeBinding.local_session_ceiling === "claim_pending_or_step_up") {
    return user.verification_level === "P9" ? "claim_pending" : "step_up_required";
  }
  if (routeBinding.local_session_ceiling === "writable_if_local_capability_allows") {
    return user.verification_level === "P9" ? "writable_candidate" : "step_up_required";
  }
  if (routeBinding.local_session_ceiling === "auth_read_only_or_writable_after_local_capability") {
    return user.verification_level === "P9" ? "local_capability_review" : "auth_read_only";
  }
  return "auth_read_only";
}

function buildReturnCard(state: AppState): ReturnCard {
  const routeBinding = routeBindingById(state.selectedRouteBindingId);
  const user = userById(state.selectedUserId);
  const scenario = scenarioById(state.selectedScenarioId);
  const bundle = scopeBundleById(routeBinding.scope_bundle_id);
  const redirectUri = callbackUriFor(state);
  const decision = localSessionDecision(routeBinding, user);
  const safeUserInfo = JSON.stringify(
    {
      sub: user.alias,
      identity_proofing_level: user.verification_level,
      scopes: bundle.scopes,
    },
    null,
    2,
  );

  if (scenario.scenario_id === "wrong_redirect_uri") {
    return {
      title: "Wrong redirect URI",
      tone: "blocked",
      returnState: "invalid_callback",
      reasonCode: scenario.reason_code,
      message:
        "The callback URI is not registered for the active client and environment. The mock refuses the handoff instead of flattening the error into a generic failure page.",
      localSessionDecision: "no_local_session",
      callbackUri: `${redirectUri}-mismatch`,
      state: state.authFields.state,
      nonce: state.authFields.nonce,
      pkce: state.authFields.pkce,
      authCode: "not-issued",
      tokenPreview: "token exchange blocked before code issuance",
      userinfoPreview: "{}",
    };
  }

  if (scenario.scenario_id === "consent_denied") {
    return {
      title: "Consent denied",
      tone: "warning",
      returnState: "denied",
      reasonCode: scenario.reason_code,
      message:
        "The user chose not to share the requested claims. Vecells must fall back to a bounded local state rather than treating this as a successful sign-in.",
      localSessionDecision: "consent_denied",
      callbackUri: redirectUri,
      state: state.authFields.state,
      nonce: state.authFields.nonce,
      pkce: state.authFields.pkce,
      authCode: "not-issued",
      tokenPreview: "error=access_denied",
      userinfoPreview: "{}",
    };
  }

  if (scenario.scenario_id === "stale_code") {
    return {
      title: "Expired authorization code",
      tone: "warning",
      returnState: "recovery_required",
      reasonCode: scenario.reason_code,
      message:
        "The token exchange sees an expired authorization code. The mock holds the current route family and points the user back into re-auth instead of inventing success.",
      localSessionDecision: "reauth_required",
      callbackUri: redirectUri,
      state: state.authFields.state,
      nonce: state.authFields.nonce,
      pkce: state.authFields.pkce,
      authCode: "code-expired",
      tokenPreview: "token exchange rejected: stale_authorization_code",
      userinfoPreview: "{}",
    };
  }

  if (scenario.scenario_id === "reused_code") {
    return {
      title: "Reused authorization code",
      tone: "blocked",
      returnState: "recovery_required",
      reasonCode: scenario.reason_code,
      message:
        "The callback race is caught and the previously redeemed code is rejected. Exact-once redemption stays intact.",
      localSessionDecision: "replay_blocked",
      callbackUri: redirectUri,
      state: state.authFields.state,
      nonce: state.authFields.nonce,
      pkce: state.authFields.pkce,
      authCode: "code-already-redeemed",
      tokenPreview: "token exchange rejected: authorization_code_already_redeemed",
      userinfoPreview: "{}",
    };
  }

  if (scenario.scenario_id === "expired_session") {
    return {
      title: "Session expired",
      tone: "warning",
      returnState: "re_auth_required",
      reasonCode: scenario.reason_code,
      message:
        "The upstream identity flow has ended, so the route must re-open via sign-in without losing its current route intent or shell context.",
      localSessionDecision: "re_auth_required",
      callbackUri: redirectUri,
      state: state.authFields.state,
      nonce: state.authFields.nonce,
      pkce: state.authFields.pkce,
      authCode: "session-expired",
      tokenPreview: "upstream session no longer satisfies the requested trust posture",
      userinfoPreview: "{}",
    };
  }

  if (scenario.scenario_id === "im1_pairing" && (!state.registry[state.selectedClientId].im1Enabled || !user.im1_ready)) {
    return {
      title: "IM1 scope blocked",
      tone: "blocked",
      returnState: "blocked",
      reasonCode: "IM1_SCOPE_BLOCKED",
      message:
        "The mock refuses `gp_integration_credentials` because the current client or test user is not flagged as IM1-ready.",
      localSessionDecision: "im1_blocked",
      callbackUri: redirectUri,
      state: state.authFields.state,
      nonce: state.authFields.nonce,
      pkce: state.authFields.pkce,
      authCode: "not-issued",
      tokenPreview: "userinfo request blocked: gp_integration_credentials requires explicit IM1 enablement",
      userinfoPreview: "{}",
    };
  }

  return {
    title: scenario.scenario_id === "settings_return" ? "Settings return complete" : "Authorization returned",
    tone: "success",
    returnState: scenario.return_state,
    reasonCode: scenario.reason_code,
    message:
      decision === "step_up_required"
        ? "Identity proof succeeded, but the selected route still requires a higher local trust posture before it can widen."
        : "The callback completed and the mock now shows the local session ceiling rather than pretending the route is automatically writable.",
    localSessionDecision: decision,
    callbackUri: redirectUri,
    state: state.authFields.state,
    nonce: state.authFields.nonce,
    pkce: state.authFields.pkce,
    authCode: `code-${slugify(user.alias)}-${slugify(routeBinding.callback_slug)}`,
    tokenPreview: JSON.stringify(
      {
        aud: state.selectedClientId,
        vot: user.vot,
        vtm: "https://auth.login.nhs.uk/trustmark/login.nhs.uk",
        route_intent: routeBinding.return_intent_key,
      },
      null,
      2,
    ),
    userinfoPreview: safeUserInfo,
  };
}

function buildLogEntries(state: AppState, card: ReturnCard): LogEntry[] {
  const user = userById(state.selectedUserId);
  return [
    {
      eventId: "evt_01",
      step: "authorize",
      status: "info",
      summary: `Authorize opened for ${user.alias} with route intent ${routeBindingById(state.selectedRouteBindingId).return_intent_key}.`,
    },
    {
      eventId: "evt_02",
      step: "credentials",
      status: "info",
      summary: `Credentials and OTP accepted for alias ${user.alias}.`,
    },
    {
      eventId: "evt_03",
      step: "consent",
      status: card.tone === "success" ? "success" : "warning",
      summary: `Consent stage resolved as ${card.returnState}.`,
    },
    {
      eventId: "evt_04",
      step: "callback",
      status: card.tone === "blocked" ? "blocked" : card.tone === "warning" ? "warning" : "success",
      summary: `${card.reasonCode} on ${card.callbackUri}.`,
    },
    {
      eventId: "evt_05",
      step: "local-session",
      status: card.localSessionDecision.includes("writable") ? "success" : "info",
      summary: `Local session decision: ${card.localSessionDecision}.`,
    },
  ];
}

function usesReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function validateNewRedirect(uri: string, environment: EnvironmentProfile): string | null {
  if (!uri.trim()) {
    return "Enter a redirect URI before adding it.";
  }
  try {
    const parsed = new URL(uri);
    if (!parsed.pathname.startsWith("/auth/callback/")) {
      return "Redirect URIs must use the governed /auth/callback/* family.";
    }
    if (!uri.startsWith(environment.base_url)) {
      return `Redirect URIs in ${environment.label} must start with ${environment.base_url}.`;
    }
  } catch {
    return "Enter a valid absolute redirect URI.";
  }
  return null;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => initialState());
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => usesReducedMotion());

  const client = clientById(state.selectedClientId);
  const routeBinding = routeBindingById(state.selectedRouteBindingId);
  const environment = environmentById(state.selectedEnvId);
  const bundle = scopeBundleById(routeBinding.scope_bundle_id);
  const scenario = scenarioById(state.selectedScenarioId);
  const user = userById(state.selectedUserId);
  const clientRouteBindings = client.route_binding_ids.map((id) => routeBindingById(id));
  const clientRedirects = state.registry[state.selectedClientId].redirectsByEnv[state.selectedEnvId] ?? [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("mode", state.mode);
    params.set("view", state.view);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }, [state.mode, state.view]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = { ...state, lastSavedAt: new Date().toISOString() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState((previous) => (previous.lastSavedAt === next.lastSavedAt ? previous : next));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hasValue(client.route_binding_ids, state.selectedRouteBindingId)) {
      setState((previous) => ({
        ...previous,
        selectedRouteBindingId: client.route_binding_ids[0],
      }));
    }
    if (!hasValue(client.test_user_ids, state.selectedUserId)) {
      const nextUser = client.test_user_ids[0];
      setState((previous) => ({
        ...previous,
        selectedUserId: nextUser,
        authFields: {
          ...previous.authFields,
          email: userById(nextUser).email,
          password: userById(nextUser).password,
          otp: userById(nextUser).otp,
        },
      }));
    }
  }, [client, state.selectedRouteBindingId, state.selectedUserId]);

  function update<K extends keyof AppState["authFields"]>(key: K, value: AppState["authFields"][K]) {
    setState((previous) => ({
      ...previous,
      authFields: { ...previous.authFields, [key]: value },
    }));
  }

  function changeUser(nextUserId: string) {
    const nextUser = userById(nextUserId);
    setState((previous) => ({
      ...previous,
      selectedUserId: nextUserId,
      authFields: {
        ...previous.authFields,
        email: nextUser.email,
        password: nextUser.password,
        otp: nextUser.otp,
      },
    }));
  }

  function changeClient(nextClientId: string) {
    const nextClient = clientById(nextClientId);
    const nextUserId = nextClient.test_user_ids[0];
    setState((previous) => ({
      ...previous,
      selectedClientId: nextClientId,
      selectedRouteBindingId: nextClient.route_binding_ids[0],
      selectedUserId: nextUserId,
      authFields: {
        ...previous.authFields,
        email: userById(nextUserId).email,
        password: userById(nextUserId).password,
        otp: userById(nextUserId).otp,
      },
      adminMessage: null,
    }));
  }

  function nextAuthStage() {
    const errors = validationErrors(state);
    if (state.authStage === "credentials") {
      if (errors.filter((message) => !message.includes("one-time passcode")).length) {
        setState((previous) => ({ ...previous, errorSummary: errors }));
        return;
      }
      setState((previous) => ({
        ...previous,
        authStage: "stepup",
        errorSummary: [],
        view: "signin",
      }));
      return;
    }
    if (errors.length) {
      setState((previous) => ({ ...previous, errorSummary: errors }));
      return;
    }
    setState((previous) => ({
      ...previous,
      errorSummary: [],
      view: "consent",
    }));
  }

  function resolveConsent(consent: "allow" | "deny") {
    const scenarioId = consent === "deny" ? "consent_denied" : state.selectedScenarioId;
    const card = buildReturnCard({ ...state, selectedScenarioId: scenarioId });
    const logEntries = buildLogEntries({ ...state, selectedScenarioId: scenarioId }, card);
    setState((previous) => ({
      ...previous,
      selectedScenarioId: scenarioId,
      view: "return",
      returnCard: card,
      logEntries,
    }));
  }

  function addRedirect() {
    const message = validateNewRedirect(state.newRedirectUri, environment);
    if (message) {
      setState((previous) => ({ ...previous, adminMessage: message }));
      return;
    }
    const current = state.registry[state.selectedClientId].redirectsByEnv[state.selectedEnvId] ?? [];
    if (current.includes(state.newRedirectUri)) {
      setState((previous) => ({ ...previous, adminMessage: "This redirect URI is already registered." }));
      return;
    }
    if (current.length >= 10) {
      setState((previous) => ({
        ...previous,
        adminMessage: "This client already uses the 10-URI cap. Use route-intent state fan-out instead.",
      }));
      return;
    }
    setState((previous) => ({
      ...previous,
      registry: {
        ...previous.registry,
        [previous.selectedClientId]: {
          ...previous.registry[previous.selectedClientId],
          redirectsByEnv: {
            ...previous.registry[previous.selectedClientId].redirectsByEnv,
            [previous.selectedEnvId]: [...current, previous.newRedirectUri],
          },
        },
      },
      newRedirectUri: "",
      adminMessage: "Redirect URI added to the mock registry.",
    }));
  }

  function toggleIm1() {
    setState((previous) => ({
      ...previous,
      registry: {
        ...previous.registry,
        [previous.selectedClientId]: {
          ...previous.registry[previous.selectedClientId],
          im1Enabled: !previous.registry[previous.selectedClientId].im1Enabled,
        },
      },
    }));
  }

  function updateActualField(placeholderId: string, value: string) {
    setState((previous) => ({
      ...previous,
      actualFields: { ...previous.actualFields, [placeholderId]: value },
    }));
  }

  function renderWorkspace() {
    if (state.view === "admin") {
      return (
        <section className="registry-view" data-testid="admin-client-registry">
          <header className="panel hero-panel">
            <div className="heading-row">
              <div>
                <p className="eyebrow">Admin_Client_Registry</p>
                <h1>Bluewoven Identity Simulator</h1>
              </div>
              <div className="status-stack">
                <span className="tag">MOCK_NHS_LOGIN</span>
                <span className="mono-tag">{environment.label}</span>
              </div>
            </div>
            <p className="muted">
              The client registry is bound to route families, state fan-out, and local session ceilings.
              It is not a generic OAuth client table.
            </p>
          </header>

          <section className="panel registry-panel">
            <div className="registry-header">
              <div>
                <h2>Client registry</h2>
                <p className="muted">Select a client to review redirects, scopes, and environment posture.</p>
              </div>
              <div className="subtle-summary" data-testid="redirect-limit-status">
                {clientRedirects.length}/10 redirect URIs in {environment.label}
              </div>
            </div>

            <div className="client-grid" data-testid="client-registry-list">
              {nhsLoginCapturePack.mock_clients.map((row) => {
                const isActive = row.client_id === state.selectedClientId;
                return (
                  <button
                    key={row.client_id}
                    type="button"
                    className={`client-card${isActive ? " active" : ""}`}
                    data-testid={`client-card-${row.client_id}`}
                    onClick={() => changeClient(row.client_id)}
                  >
                    <div className="card-topline">
                      <strong>{state.registry[row.client_id].friendlyName}</strong>
                      <span className="mono-tag">{row.client_id}</span>
                    </div>
                    <p>{row.notes}</p>
                    <div className="tag-row">
                      <span className={`tag${state.registry[row.client_id].im1Enabled ? " success" : ""}`}>
                        IM1 {state.registry[row.client_id].im1Enabled ? "enabled" : "disabled"}
                      </span>
                      <span className="tag">{row.redirect_limit_strategy}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="registry-header">
              <div>
                <h2>Redirect URI cards</h2>
                <p className="muted">All callbacks stay under the governed `/auth/callback/*` family.</p>
              </div>
            </div>
            <div className="redirect-list">
              {clientRedirects.map((uri, index) => (
                <article
                  key={`${uri}-${index}`}
                  className="redirect-card"
                  data-testid={`redirect-uri-entry-${index}`}
                >
                  <span className="mono-block">{uri}</span>
                </article>
              ))}
            </div>
            <div className="inline-form">
              <input
                value={state.newRedirectUri}
                onChange={(event) =>
                  setState((previous) => ({ ...previous, newRedirectUri: event.target.value }))
                }
                placeholder={`${environment.base_url}/auth/callback/custom`}
                data-testid="redirect-uri-input"
              />
              <button type="button" onClick={addRedirect} data-testid="redirect-uri-add">
                Add redirect URI
              </button>
            </div>
            {state.adminMessage ? (
              <p className="admin-message" data-testid="admin-message">
                {state.adminMessage}
              </p>
            ) : null}
          </section>

          <section className="panel">
            <div className="registry-header">
              <div>
                <h2>Scope chips and test users</h2>
                <p className="muted">Scopes remain least-necessary and claims stay explicit.</p>
              </div>
              <button type="button" className="secondary-button" onClick={toggleIm1} data-testid="im1-toggle">
                {state.registry[state.selectedClientId].im1Enabled ? "Disable IM1" : "Enable IM1"}
              </button>
            </div>
            <div className="chip-row">
              {client.allowed_scope_bundle_ids.map((bundleId) => {
                const row = scopeBundleById(bundleId);
                return (
                  <span key={bundleId} className="scope-chip" data-testid={`scope-chip-${bundleId}`}>
                    {row.bundle_name}
                  </span>
                );
              })}
            </div>
            <div className="user-grid">
              {client.test_user_ids.map((userId) => {
                const row = userById(userId);
                return (
                  <button
                    key={row.user_id}
                    type="button"
                    className={`user-card${row.user_id === state.selectedUserId ? " active" : ""}`}
                    onClick={() => changeUser(row.user_id)}
                    data-testid={`test-user-${row.user_id}`}
                  >
                    <strong>{row.alias}</strong>
                    <span className="mono-tag">{row.vot}</span>
                    <span className="muted">{row.scenario_support.join(", ")}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      );
    }

    if (state.view === "signin") {
      return (
        <section className="auth-view" data-testid="user-sign-in">
          <article className="auth-card">
            <p className="eyebrow">User_Sign_In</p>
            <h1>Sign in to the mock identity rail</h1>
            <p className="muted">
              This simulator preserves state, nonce, PKCE, route-intent, and local session boundaries. It does not imply real approval.
            </p>

            <div className="journey-indicator" data-testid="journey-indicator">
              <span className={state.authStage === "credentials" ? "active" : "done"}>1. Email and password</span>
              <span className={state.authStage === "stepup" ? "active" : ""}>2. Passcode or step-up</span>
              <span>3. Consent and return</span>
            </div>

            {state.errorSummary.length ? (
              <section className="error-summary" role="alert" data-testid="error-summary">
                <strong>Check the mock input before continuing.</strong>
                <ul>
                  {state.errorSummary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <label>
              Mock email
              <input
                value={state.authFields.email}
                onChange={(event) => update("email", event.target.value)}
                data-testid="field-email"
              />
            </label>

            <label>
              Mock password
              <input
                type="password"
                value={state.authFields.password}
                onChange={(event) => update("password", event.target.value)}
                data-testid="field-password"
              />
            </label>

            {state.authStage === "stepup" ? (
              <label>
                Mock passcode
                <input
                  value={state.authFields.otp}
                  onChange={(event) => update("otp", event.target.value)}
                  data-testid="field-otp"
                />
              </label>
            ) : null}

            <div className="meta-grid">
              <label>
                State
                <input
                  value={state.authFields.state}
                  onChange={(event) => update("state", event.target.value)}
                  data-testid="field-state"
                />
              </label>
              <label>
                Nonce
                <input
                  value={state.authFields.nonce}
                  onChange={(event) => update("nonce", event.target.value)}
                  data-testid="field-nonce"
                />
              </label>
              <label>
                PKCE verifier
                <input
                  value={state.authFields.pkce}
                  onChange={(event) => update("pkce", event.target.value)}
                  data-testid="field-pkce"
                />
              </label>
            </div>

            <div className="chip-row">
              {nhsLoginCapturePack.auth_scenarios.map((row) => (
                <button
                  key={row.scenario_id}
                  type="button"
                  className={`scenario-chip${row.scenario_id === state.selectedScenarioId ? " active" : ""}`}
                  onClick={() => setState((previous) => ({ ...previous, selectedScenarioId: row.scenario_id }))}
                  data-testid={`scenario-chip-${row.scenario_id}`}
                >
                  {row.label}
                </button>
              ))}
            </div>

            <button type="button" className="primary-button" onClick={nextAuthStage} data-testid="continue-sign-in">
              {state.authStage === "credentials" ? "Continue to step-up" : "Continue to consent"}
            </button>
          </article>
        </section>
      );
    }

    if (state.view === "consent") {
      return (
        <section className="auth-view" data-testid="consent-and-share">
          <article className="auth-card consent-card">
            <p className="eyebrow">Consent_and_Share</p>
            <h1>Review the requested claims</h1>
            <p className="muted">
              This is a mock consent surface. The request is calm, exact, and visibly non-official.
            </p>
            <div className="claim-list">
              {bundle.claims.map((claim) => (
                <div key={claim} className="claim-row">
                  <span className="mono-tag">{claim}</span>
                </div>
              ))}
            </div>
            <div className="consent-actions">
              <button type="button" className="primary-button" onClick={() => resolveConsent("allow")} data-testid="consent-button-allow">
                Allow and continue
              </button>
              <button type="button" className="secondary-button" onClick={() => resolveConsent("deny")} data-testid="consent-button-deny">
                Deny sharing
              </button>
            </div>
          </article>
        </section>
      );
    }

    if (state.view === "return") {
      const card = state.returnCard ?? buildReturnCard(state);
      return (
        <section className="auth-view" data-testid="return-or-error">
          <article className={`auth-card return-card ${card.tone}`} data-testid="auth-return-state">
            <p className="eyebrow">Return_or_Error</p>
            <h1>{card.title}</h1>
            <p className="muted">{card.message}</p>
            <dl className="detail-grid">
              <div>
                <dt>Return state</dt>
                <dd className="mono-block">{card.returnState}</dd>
              </div>
              <div>
                <dt>Reason code</dt>
                <dd className="mono-block">{card.reasonCode}</dd>
              </div>
              <div>
                <dt>Callback URI</dt>
                <dd className="mono-block">{card.callbackUri}</dd>
              </div>
              <div>
                <dt>Local session decision</dt>
                <dd className="mono-block">{card.localSessionDecision}</dd>
              </div>
            </dl>
            <div className="preview-grid">
              <section>
                <h2>Token preview</h2>
                <pre>{card.tokenPreview}</pre>
              </section>
              <section>
                <h2>Userinfo preview</h2>
                <pre>{card.userinfoPreview}</pre>
              </section>
            </div>
          </article>
        </section>
      );
    }

    return (
      <section className="auth-view" data-testid="settings-link-simulator">
        <article className="auth-card settings-card">
          <p className="eyebrow">Settings_Link_Simulator</p>
          <h1>Mock settings-link return</h1>
          <p className="muted">
            The return path stays safe, bounded, and route-family specific. It does not widen access by itself.
          </p>
          <div className="settings-stack">
            <div className="settings-row">
              <span className="mono-tag">settings-link</span>
              <p>Return the user to the patient shell that requested the update.</p>
            </div>
            <div className="settings-row">
              <span className="mono-tag">route-intent</span>
              <p>{routeBinding.return_intent_key}</p>
            </div>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              const card = buildReturnCard({ ...state, selectedScenarioId: "settings_return" });
              setState((previous) => ({
                ...previous,
                selectedScenarioId: "settings_return",
                returnCard: card,
                logEntries: buildLogEntries({ ...previous, selectedScenarioId: "settings_return" }, card),
                view: "return",
              }));
            }}
            data-testid="settings-return-button"
          >
            Simulate safe return
          </button>
        </article>
      </section>
    );
  }

  return (
    <main
      className="app-shell"
      data-testid="bluewoven-shell"
      data-shell-type="patient"
      data-route-family={routeBinding.route_family_id}
      data-surface-state={state.returnCard?.returnState ?? "editing"}
      data-writable-state={state.returnCard?.localSessionDecision ?? "pending"}
    >
      <header className="topbar">
        <section className="summary-banner" data-testid="summary-banner">
          <Metric label="View" value={state.view} />
          <Metric label="Client" value={state.registry[state.selectedClientId].friendlyName} />
          <Metric label="Environment" value={environment.label} />
          <Metric label="Autosave" value={state.lastSavedAt ? new Date(state.lastSavedAt).toLocaleTimeString() : "not yet"} />
        </section>

        <section className="mode-card">
          <div className="brand-row">
            <Wordmark />
            <div>
              <div className="tag">MOCK_NHS_LOGIN</div>
              <h2 className="brand-title">Bluewoven Identity Simulator</h2>
            </div>
          </div>
          <div className="mode-toggle" data-testid="mode-toggle">
            <button
              type="button"
              data-testid="mode-toggle-mock"
              className={state.mode === "mock" ? "active" : ""}
              aria-pressed={state.mode === "mock"}
              onClick={() => setState((previous) => ({ ...previous, mode: "mock" }))}
            >
              Mock now
            </button>
            <button
              type="button"
              data-testid="mode-toggle-actual"
              className={state.mode === "actual" ? "active" : ""}
              aria-pressed={state.mode === "actual"}
              onClick={() => setState((previous) => ({ ...previous, mode: "actual", view: "admin" }))}
            >
              Actual later
            </button>
          </div>
        </section>
      </header>

      <div className="shell-grid">
        <aside className="left-rail">
          <section className="panel">
            <h3>Pages</h3>
            <nav className="nav-stack">
              {(["admin", "signin", "consent", "return", "settings"] as View[]).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={`nav-button${state.view === view ? " active" : ""}`}
                  onClick={() => setState((previous) => ({ ...previous, view }))}
                  data-testid={`nav-view-${view}`}
                >
                  {view}
                </button>
              ))}
            </nav>
          </section>

          <section className="panel">
            <h3>Environment</h3>
            <div className="switcher" data-testid="environment-switcher">
              {nhsLoginCapturePack.environment_profiles.map((row) => (
                <button
                  key={row.environment_profile_id}
                  type="button"
                  className={`switch-button${row.environment_profile_id === state.selectedEnvId ? " active" : ""}`}
                  onClick={() =>
                    setState((previous) => ({ ...previous, selectedEnvId: row.environment_profile_id, adminMessage: null }))
                  }
                  data-testid={`environment-option-${row.environment_profile_id}`}
                >
                  {row.label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>Client and route</h3>
            <label className="stacked-label">
              Client
              <select
                value={state.selectedClientId}
                onChange={(event) => changeClient(event.target.value)}
                data-testid="client-select"
              >
                {nhsLoginCapturePack.mock_clients.map((row) => (
                  <option key={row.client_id} value={row.client_id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="stacked-label">
              Route binding
              <select
                value={state.selectedRouteBindingId}
                onChange={(event) =>
                  setState((previous) => ({ ...previous, selectedRouteBindingId: event.target.value }))
                }
                data-testid="route-binding-select"
              >
                {clientRouteBindings.map((row) => (
                  <option key={row.route_binding_id} value={row.route_binding_id}>
                    {row.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="stacked-label">
              Test user
              <select
                value={state.selectedUserId}
                onChange={(event) => changeUser(event.target.value)}
                data-testid="user-select"
              >
                {client.test_user_ids.map((userId) => {
                  const row = userById(userId);
                  return (
                    <option key={row.user_id} value={row.user_id}>
                      {row.alias}
                    </option>
                  );
                })}
              </select>
            </label>
          </section>
        </aside>

        <section className="workspace">{renderWorkspace()}</section>

        <aside className="inspector">
          <section className="panel">
            <div className="heading-row">
              <div>
                <p className="eyebrow">Inspector</p>
                <h3>{routeBinding.display_name}</h3>
              </div>
              {reducedMotion ? (
                <span className="tag" data-testid="reduced-motion-indicator">
                  Reduced motion
                </span>
              ) : null}
            </div>
            <dl className="detail-list">
              <div>
                <dt>Return intent</dt>
                <dd className="mono-block">{routeBinding.return_intent_key}</dd>
              </div>
              <div>
                <dt>Scope bundle</dt>
                <dd className="mono-block">{bundle.bundle_name}</dd>
              </div>
              <div>
                <dt>Scenario</dt>
                <dd>{scenario.label}</dd>
              </div>
              <div>
                <dt>Active user</dt>
                <dd className="mono-block">{user.alias}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <div className="heading-row">
              <div>
                <p className="eyebrow">Route map</p>
                <h3>Authorize to token to userinfo to local session</h3>
              </div>
            </div>
            <div className="route-map" data-testid="route-map-diagram">
              {["authorize", "token", "userinfo", "local session"].map((step) => (
                <div key={step} className="route-node">
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="parity-table" data-testid="route-map-parity-table">
              <div className="parity-row">
                <strong>Callback</strong>
                <span className="mono-block">{callbackUriFor(state)}</span>
              </div>
              <div className="parity-row">
                <strong>VoT</strong>
                <span className="mono-block">{user.vot}</span>
              </div>
              <div className="parity-row">
                <strong>Local ceiling</strong>
                <span className="mono-block">{localSessionDecision(routeBinding, user)}</span>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="heading-row">
              <div>
                <p className="eyebrow">JWKS</p>
                <h3>Public-key preview</h3>
              </div>
            </div>
            <pre className="code-panel">{JSON.stringify(client.jwks, null, 2)}</pre>
          </section>

          <section className="panel">
            <div className="heading-row">
              <div>
                <p className="eyebrow">Event log</p>
                <h3>Protocol-safe events</h3>
              </div>
            </div>
            <div className="event-log" data-testid="event-log">
              {state.logEntries.length ? (
                state.logEntries.map((entry) => (
                  <div key={entry.eventId} className={`event-row ${entry.status}`}>
                    <strong>{entry.step}</strong>
                    <p>{entry.summary}</p>
                  </div>
                ))
              ) : (
                <p className="muted">No auth flow has been completed yet.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="heading-row">
              <div>
                <p className="eyebrow">Synthetic pack</p>
                <h3>Test data export</h3>
              </div>
            </div>
            <pre className="code-panel">
              {JSON.stringify(
                {
                  environment: environment.label,
                  aliases: client.test_user_ids.map((userId) => {
                    const row = userById(userId);
                    return { alias: row.alias, vot: row.vot, otp: row.otp };
                  }),
                },
                null,
                2,
              )}
            </pre>
          </section>

          <section className="panel" data-testid="credential-intake-drawer">
            <div className="heading-row">
              <div>
                <p className="eyebrow">Actual later</p>
                <h3>Credential intake drawer</h3>
              </div>
              <span className="tag blocked">dry-run only</span>
            </div>
            {state.mode === "actual" ? (
              <p className="actual-notice" data-testid="actual-submission-notice">
                Real provider mutation remains blocked until the live gates pass and `ALLOW_REAL_PROVIDER_MUTATION=true`.
              </p>
            ) : (
              <p className="muted">Switch to Actual later to rehearse the placeholder intake path.</p>
            )}
            <p className="redaction-notice" data-testid="redaction-notice">
              Redaction is mandatory. Only placeholder or redacted values are allowed in this simulator.
            </p>
            <div className="placeholder-grid">
              {nhsLoginCapturePack.placeholder_registry.placeholder_fields.map((field) => (
                <label key={field.placeholder_id}>
                  {field.label}
                  <input
                    value={state.actualFields[field.placeholder_id] ?? ""}
                    onChange={(event) => updateActualField(field.placeholder_id, event.target.value)}
                    data-testid={`placeholder-field-${field.placeholder_id}`}
                  />
                </label>
              ))}
            </div>
            <button type="button" className="secondary-button" data-testid="final-submit-button">
              Pause before final submit
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Wordmark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="wordmark">
      <defs>
        <linearGradient id="mark-a" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#0B57D0" />
          <stop offset="100%" stopColor="#335CFF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#EFF3F8" />
      <path d="M14 18h12l6 10 6-10h12L36 42H28L14 18Z" fill="url(#mark-a)" />
      <path d="M22 45h20" stroke="#6E59D9" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}
