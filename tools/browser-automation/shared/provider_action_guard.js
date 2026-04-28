import {
  getCheckpointRule,
  getProviderProfile,
  nextRetryClassDecision,
  requiresHumanConfirmation,
} from "./provider_checkpoint_model.js";

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function buildLiveMutationContext(providerFamily, env = {}, overrides = {}) {
  const profile = getProviderProfile(providerFamily);
  invariant(profile, `Unknown provider family: ${providerFamily}`);
  return {
    providerFamily,
    namedApprover: overrides.namedApprover ?? env[profile.env_bindings.named_approver] ?? null,
    environmentTarget:
      overrides.environmentTarget ?? env[profile.env_bindings.environment_target] ?? null,
    liveMutationFlag:
      overrides.liveMutationFlag ??
      (profile.env_bindings.live_mutation_flag
        ? env[profile.env_bindings.live_mutation_flag] === "true"
        : false),
    spendFlag:
      overrides.spendFlag ??
      (profile.env_bindings.spend_flag ? env[profile.env_bindings.spend_flag] === "true" : false),
    evidenceBundleRef: overrides.evidenceBundleRef ?? null,
    evidenceFreshnessDays: overrides.evidenceFreshnessDays ?? null,
    humanConfirmed: overrides.humanConfirmed ?? false,
    capturePlan: overrides.capturePlan ?? {
      screenshotEnabled: false,
      traceEnabled: false,
      harEnabled: false,
      redactionProven: false,
    },
  };
}

export function assertCapturePlanAllowed(actionRule, capturePlan) {
  const classId = actionRule.retry_class;
  if (classId === "safe_read_retry" || classId === "resume_from_checkpoint_only") {
    return;
  }
  if (classId === "secrets_redacted_only") {
    invariant(
      capturePlan.redactionProven === true,
      `Action ${actionRule.action_key} handles secrets and requires proven redaction before still capture.`,
    );
    invariant(
      capturePlan.traceEnabled !== true && capturePlan.harEnabled !== true,
      `Action ${actionRule.action_key} forbids trace and HAR capture while secret material is in scope.`,
    );
    return;
  }
  if (classId === "never_auto_repeat" || classId === "capture_evidence_then_stop") {
    invariant(
      capturePlan.traceEnabled !== true && capturePlan.harEnabled !== true,
      `Action ${actionRule.action_key} forbids trace and HAR capture after the commit boundary.`,
    );
  }
}

export function assertLiveMutationGate(actionRule, context) {
  const profile = getProviderProfile(actionRule.provider_family);
  invariant(profile, `Missing provider profile for ${actionRule.provider_family}`);
  invariant(
    context.liveMutationFlag === true,
    `Action ${actionRule.action_key} is blocked until ALLOW_REAL_PROVIDER_MUTATION=true.`,
  );
  invariant(
    Boolean(context.namedApprover),
    `Action ${actionRule.action_key} requires a named approver.`,
  );
  invariant(
    Boolean(context.environmentTarget),
    `Action ${actionRule.action_key} requires an explicit environment target.`,
  );
  invariant(
    Boolean(context.evidenceBundleRef),
    `Action ${actionRule.action_key} requires an evidence bundle reference.`,
  );
  invariant(
    Number.isFinite(context.evidenceFreshnessDays),
    `Action ${actionRule.action_key} requires an evidence freshness age in days.`,
  );
  invariant(
    context.evidenceFreshnessDays <= profile.max_evidence_age_days,
    `Action ${actionRule.action_key} is blocked because evidence is older than ${profile.max_evidence_age_days} days.`,
  );
}

export function assertProviderActionAllowed(actionKey, context) {
  const actionRule = getCheckpointRule(actionKey);
  invariant(actionRule, `Unknown action key: ${actionKey}`);

  assertCapturePlanAllowed(actionRule, context.capturePlan ?? {});

  if (actionRule.live_gate_required) {
    assertLiveMutationGate(actionRule, context);
  }

  if (requiresHumanConfirmation(actionKey)) {
    invariant(
      context.humanConfirmed === true,
      `Action ${actionKey} requires an explicit human confirmation before the next mutation.`,
    );
  }

  return {
    actionKey,
    retryClass: actionRule.retry_class,
    liveGateStatus: actionRule.live_gate_status,
    allowed: true,
  };
}

export function nextRetryDecision(actionKey, attemptCount) {
  return nextRetryClassDecision(actionKey, attemptCount);
}
