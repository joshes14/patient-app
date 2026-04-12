import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { DEFAULT_PRACTITIONER_ID } from "@/lib/constants";
import {
  hashPassword,
  needsPasswordHashUpgrade,
  verifyPassword,
} from "@/lib/password";

export const AUTH_COOKIE_NAME = "clinic_auth";

export function getPractitionerId(): string {
  const practitioner = db
    .prepare(
      `
      SELECT id
      FROM practitioners
      WHERE is_active = 1
      ORDER BY datetime(created_at) ASC
      LIMIT 1
      `,
    )
    .get() as { id: string } | undefined;

  if (practitioner?.id) {
    return practitioner.id;
  }

  return DEFAULT_PRACTITIONER_ID;
}

export function checkPractitionerId(input: string): boolean {
  const practitionerId = input.trim();
  if (practitionerId.length === 0) {
    return false;
  }

  const row = db
    .prepare(
      `
      SELECT id
      FROM practitioners
      WHERE id = ? AND is_active = 1
      LIMIT 1
      `,
    )
    .get(practitionerId) as { id: string } | undefined;

  return Boolean(row?.id);
}

export function checkPassword(practitionerId: string, input: string): boolean {
  const row = db
    .prepare(
      `
      SELECT password
      FROM practitioners
      WHERE id = ? AND is_active = 1
      LIMIT 1
      `,
    )
    .get(practitionerId.trim()) as { password: string } | undefined;

  if (!row) {
    return false;
  }

  const isMatch = verifyPassword(input, row.password);
  if (isMatch && needsPasswordHashUpgrade(row.password)) {
    db.prepare(
      `
      UPDATE practitioners
      SET password = ?, updated_at = datetime('now')
      WHERE id = ?
      `,
    ).run(hashPassword(input), practitionerId.trim());
  }

  return isMatch;
}

export function isAuthenticated(): boolean {
  return cookies().get(AUTH_COOKIE_NAME)?.value === "true";
}

export function requirePageAuth(): void {
  if (!isAuthenticated()) {
    redirect("/login");
  }
}

export function requireApiAuth(request: NextRequest): NextResponse | null {
  if (request.cookies.get(AUTH_COOKIE_NAME)?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
