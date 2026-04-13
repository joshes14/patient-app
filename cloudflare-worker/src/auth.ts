import { createHmac, timingSafeEqual } from "crypto";
import { json } from "./utils";
import type { Env } from "./db";

export const AUTH_COOKIE_NAME = "clinic_auth";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 12;

const getSessionSecret = (env: Pick<Env, "CLINIC_SESSION_SECRET">): string =>
  env.CLINIC_SESSION_SECRET?.trim() || "change-me-session-secret";

const signValue = (value: string, env: Pick<Env, "CLINIC_SESSION_SECRET">): string =>
  createHmac("sha256", getSessionSecret(env)).update(value).digest("hex");

const serializeCookie = (value: string, secure: boolean, maxAge: number): string => {
  const parts = [
    `${AUTH_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const getCookieValue = (cookieHeader: string, name: string): string | null => {
  for (const chunk of cookieHeader.split(";")) {
    const trimmed = chunk.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return trimmed.slice(name.length + 1);
    }
  }

  return null;
};

export const createAuthCookieValue = (
  practitionerId: string,
  env: Pick<Env, "CLINIC_SESSION_SECRET">,
): string => {
  const value = practitionerId.trim();
  return `${value}.${signValue(value, env)}`;
};

export const verifyAuthCookieValue = (
  value: string,
  env: Pick<Env, "CLINIC_SESSION_SECRET">,
): string | null => {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const practitionerId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = signValue(practitionerId, env);

  if (expected.length !== signature.length) {
    return null;
  }

  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  return practitionerId;
};

export const buildAuthCookieHeader = (
  practitionerId: string,
  env: Pick<Env, "CLINIC_SESSION_SECRET">,
  secure: boolean,
): string => serializeCookie(createAuthCookieValue(practitionerId, env), secure, AUTH_COOKIE_MAX_AGE);

export const buildClearAuthCookieHeader = (secure: boolean): string => serializeCookie("", secure, 0);

export const requireApiAuth = (request: Request, env: Pick<Env, "CLINIC_SESSION_SECRET">): Response | null => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);

  if (!cookieValue || verifyAuthCookieValue(cookieValue, env) === null) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
};
