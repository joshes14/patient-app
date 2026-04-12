import assert from "assert/strict";
import { hashPassword, isPasswordHash, verifyPassword } from "@/lib/password";

const runPasswordUnitChecks = () => {
  const raw = "super-secure-pass";
  const hashed = hashPassword(raw);

  assert.ok(isPasswordHash(hashed), "hashPassword should produce supported hash format");
  assert.ok(verifyPassword(raw, hashed), "verifyPassword should accept valid password for hash");
  assert.equal(verifyPassword("wrong-password", hashed), false, "verifyPassword should reject wrong password");
};

const runApiSmokeChecks = async () => {
  const base = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";

  const unauthSettings = await fetch(`${base}/api/settings`);
  assert.equal(unauthSettings.status, 401, "settings endpoint should require auth");

  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ practitionerId: "LDS-000-00", password: "clinic123" }),
  });
  assert.equal(login.status, 200, "default practitioner login should succeed for smoke test");

  const setCookieHeader = login.headers.get("set-cookie") ?? "";
  const cookieHeader = setCookieHeader.split(";")[0] ?? "";
  assert.ok(cookieHeader.includes("clinic_auth=true"), "login should set clinic_auth cookie");

  const authSettings = await fetch(`${base}/api/settings`, {
    headers: {
      Cookie: cookieHeader,
    },
  });
  assert.equal(authSettings.status, 200, "settings endpoint should return success with auth cookie");

  const settingsPayload = (await authSettings.json()) as {
    settings?: { shell_title?: string };
  };
  assert.ok(settingsPayload.settings?.shell_title, "settings response should include shell_title");

  const practitionersResponse = await fetch(`${base}/api/settings/practitioners`, {
    headers: {
      Cookie: cookieHeader,
    },
  });
  assert.equal(practitionersResponse.status, 200, "practitioner list should return success with auth cookie");

  const practitionersPayload = (await practitionersResponse.json()) as {
    practitioners?: Array<{ id: string }>;
  };
  assert.ok(
    Array.isArray(practitionersPayload.practitioners),
    "practitioner list response should include practitioners array",
  );
};

const main = async () => {
  runPasswordUnitChecks();

  if (process.env.RUN_API_SMOKE === "1") {
    await runApiSmokeChecks();
    process.stdout.write("Password checks + API smoke tests passed\n");
    return;
  }

  process.stdout.write("Password checks passed (set RUN_API_SMOKE=1 to include API smoke tests)\n");
};

main().catch((error) => {
  process.stderr.write(`Smoke tests failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
