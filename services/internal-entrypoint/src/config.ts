import fs from "node:fs";
import path from "node:path";
import { LOCAL_DEV_PASSWORD_HASH, LOCAL_DEV_SESSION_SECRET } from "./security.js";

export interface InternalSurface {
  readonly id: string;
  readonly label: string;
  readonly pathPrefix: string;
  readonly distDir: string;
}

export interface InternalEntrypointConfig {
  readonly host: string;
  readonly port: number;
  readonly environment: string;
  readonly repoRoot: string;
  readonly passwordHash: string;
  readonly sessionSecret: string;
  readonly cookieSecure: boolean;
  readonly dataMode: "synthetic-disposable";
  readonly surfaces: readonly InternalSurface[];
}

export const INTERNAL_SURFACES: readonly InternalSurface[] = [
  {
    id: "patient-web",
    label: "Patient web",
    pathPrefix: "/apps/patient-web/",
    distDir: "apps/patient-web/dist",
  },
  {
    id: "clinical-workspace",
    label: "Clinical workspace",
    pathPrefix: "/apps/clinical-workspace/",
    distDir: "apps/clinical-workspace/dist",
  },
  {
    id: "ops-console",
    label: "Ops console",
    pathPrefix: "/apps/ops-console/",
    distDir: "apps/ops-console/dist",
  },
  {
    id: "hub-desk",
    label: "Hub desk",
    pathPrefix: "/apps/hub-desk/",
    distDir: "apps/hub-desk/dist",
  },
  {
    id: "pharmacy-console",
    label: "Pharmacy console",
    pathPrefix: "/apps/pharmacy-console/",
    distDir: "apps/pharmacy-console/dist",
  },
  {
    id: "support-workspace",
    label: "Support workspace",
    pathPrefix: "/apps/support-workspace/",
    distDir: "apps/support-workspace/dist",
  },
  {
    id: "governance-console",
    label: "Governance console",
    pathPrefix: "/apps/governance-console/",
    distDir: "apps/governance-console/dist",
  },
] as const;

function readString(
  env: Record<string, string | undefined>,
  keys: readonly string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function readNumber(
  env: Record<string, string | undefined>,
  keys: readonly string[],
  fallback: number,
): number {
  const raw = readString(env, keys, String(fallback));
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${keys.join("/")} value: expected number >= 0`);
  }
  return parsed;
}

function readBoolean(
  env: Record<string, string | undefined>,
  key: string,
  fallback: boolean,
): boolean {
  const raw = env[key];
  if (!raw) {
    return fallback;
  }
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  throw new Error(`Invalid ${key} value: expected true or false`);
}

function isProductionLike(env: Record<string, string | undefined>, environment: string): boolean {
  return env.NODE_ENV === "production" || env.RENDER === "true" || environment === "production";
}

function findWorkspaceRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

export function loadInternalEntrypointConfig(
  env: Record<string, string | undefined> = process.env,
): InternalEntrypointConfig {
  const environment = readString(env, ["VECELLS_ENVIRONMENT"], "local");
  const productionLike = isProductionLike(env, environment);
  const passwordHash = env.INTERNAL_TEST_PASSWORD_HASH;
  const sessionSecret = env.SESSION_SECRET;
  const repoRootOverride = readString(env, ["VECELLS_REPO_ROOT"], "");

  if (productionLike && (!passwordHash || !sessionSecret)) {
    throw new Error("INTERNAL_TEST_PASSWORD_HASH and SESSION_SECRET are required for Render");
  }

  return {
    host: readString(
      env,
      ["INTERNAL_ENTRYPOINT_HOST", "HOST"],
      productionLike ? "0.0.0.0" : "127.0.0.1",
    ),
    port: readNumber(env, ["INTERNAL_ENTRYPOINT_PORT", "PORT"], 7300),
    environment,
    repoRoot: repoRootOverride ? path.resolve(repoRootOverride) : findWorkspaceRoot(process.cwd()),
    passwordHash: passwordHash ?? LOCAL_DEV_PASSWORD_HASH,
    sessionSecret: sessionSecret ?? LOCAL_DEV_SESSION_SECRET,
    cookieSecure: readBoolean(env, "INTERNAL_ENTRYPOINT_COOKIE_SECURE", productionLike),
    dataMode: "synthetic-disposable",
    surfaces: INTERNAL_SURFACES,
  };
}
