import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SESSION_TTL_SECONDS = 8 * 60 * 60;

export const LOCAL_DEV_PASSWORD = "vecells-internal-test";
export const LOCAL_DEV_SESSION_SECRET = "local-dev-session-secret-not-valid-for-render";

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

export function hashInternalPassword(password: string, salt = randomBytes(16)): string {
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, toBase64Url(salt), toBase64Url(hash)].join("$");
}

export function verifyInternalPassword(password: string, encodedHash: string): boolean {
  try {
    const [scheme, rawN, rawR, rawP, rawSalt, rawHash] = encodedHash.split("$");
    if (scheme !== "scrypt" || !rawN || !rawR || !rawP || !rawSalt || !rawHash) {
      return false;
    }
    const expected = fromBase64Url(rawHash);
    const actual = scryptSync(password, fromBase64Url(rawSalt), expected.length, {
      N: Number(rawN),
      r: Number(rawR),
      p: Number(rawP),
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export const LOCAL_DEV_PASSWORD_HASH = hashInternalPassword(
  LOCAL_DEV_PASSWORD,
  Buffer.from("vecells-local-entrypoint-salt"),
);

interface SessionPayload {
  readonly iat: number;
  readonly exp: number;
}

function signSessionPayload(encodedPayload: string, sessionSecret: string): string {
  return createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
}

export function createSessionToken(
  sessionSecret: string,
  now = new Date(),
  ttlSeconds = SESSION_TTL_SECONDS,
): string {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload: SessionPayload = {
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signSessionPayload(encodedPayload, sessionSecret);
  return `v1.${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  sessionSecret: string,
  now = new Date(),
): boolean {
  if (!token) {
    return false;
  }
  const [version, encodedPayload, signature] = token.split(".");
  if (version !== "v1" || !encodedPayload || !signature) {
    return false;
  }
  const expected = signSessionPayload(encodedPayload, sessionSecret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return false;
  }
  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString("utf8")) as SessionPayload;
    return Number.isFinite(payload.exp) && payload.exp > Math.floor(now.getTime() / 1000);
  } catch {
    return false;
  }
}

export function serializeSessionCookie(token: string, secure: boolean): string {
  const flags = [
    `vecells_internal_session=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (secure) {
    flags.push("Secure");
  }
  return flags.join("; ");
}

export function serializeExpiredSessionCookie(secure: boolean): string {
  const flags = ["vecells_internal_session=", "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) {
    flags.push("Secure");
  }
  return flags.join("; ");
}
