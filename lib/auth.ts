import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { DEFAULT_PRACTITIONER_ID } from "@/lib/constants";

export const AUTH_COOKIE_NAME = "clinic_auth";
const SESSION_SECRET = process.env.CLINIC_SESSION_SECRET?.trim() || "change-me-session-secret";

const signValue = (value: string): string => {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
};

const encodeSession = (practitionerId: string): string => {
  const value = practitionerId.trim();
  const signature = signValue(value);
  return `${value}.${signature}`;
};

const decodeSession = (value: string): string | null => {
  const separator = value.lastIndexOf(".");
  if (separator <= 0) {
    return null;
  }

  const practitionerId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = signValue(practitionerId);

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

export function getAuthenticatedPractitionerId(): string | null {
  const value = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!value) {
    return null;
  }

  return decodeSession(value);
}

export function isAuthenticated(): boolean {
  const value = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!value) {
    return false;
  }

  return decodeSession(value) !== null;
}

export function requirePageAuth(): void {
  if (!isAuthenticated()) {
    redirect("/login");
  }
}

export function requireApiAuth(request: NextRequest): NextResponse | null {
  const value = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (decodeSession(value) === null) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function getPractitionerId(): string {
  return process.env.CLINIC_PRACTITIONER_ID?.trim() || DEFAULT_PRACTITIONER_ID;
}

export function createAuthCookieValue(practitionerId: string): string {
  return encodeSession(practitionerId);
}

export function makeAuthCookieResponse(response: NextResponse, practitionerId: string): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createAuthCookieValue(practitionerId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  return response;
}

export function clearAuthCookieResponse(response: NextResponse): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
