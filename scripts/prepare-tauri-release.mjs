import {
  mkdirSync,
  copyFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  cpSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const outputDir = join(root, "release", "next");

const requiredEnv = [
  "CLINIC_BACKEND_URL",
  "NEXT_PUBLIC_CLINIC_BACKEND_URL",
  "CLINIC_SESSION_SECRET",
  "CLINIC_PASSWORD",
  "CLINIC_PRACTITIONER_ID",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());
if (missingEnv.length > 0) {
  throw new Error(`Missing required build env vars: ${missingEnv.join(", ")}`);
}

const ensureExists = (path, label) => {
  if (!existsSync(path)) {
    throw new Error(`${label} was not found at ${path}`);
  }
};

const nextStandaloneDir = join(root, ".next", "standalone");
const nextStaticDir = join(root, ".next", "static");
const nextPublicDir = join(root, "public");
const nextServerEntrypoint = join(nextStandaloneDir, "server.js");

ensureExists(nextStandaloneDir, "Next standalone output");
ensureExists(nextStaticDir, "Next static assets");
ensureExists(nextServerEntrypoint, "Next standalone server entrypoint");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const serverTarget = join(outputDir, "server");

cpSync(nextStandaloneDir, serverTarget, { recursive: true });
mkdirSync(join(serverTarget, ".next"), { recursive: true });
cpSync(nextStaticDir, join(serverTarget, ".next", "static"), { recursive: true });

if (existsSync(nextPublicDir)) {
  cpSync(nextPublicDir, join(serverTarget, "public"), { recursive: true });
}

const launcherSource = join(root, "scripts", "next-standalone-launcher.js");
ensureExists(launcherSource, "Next launcher script");
copyFileSync(launcherSource, join(outputDir, "next-launcher.js"));

const envFilePath = join(outputDir, ".env");
const envFileContent = [
  `CLINIC_BACKEND_URL=${process.env.CLINIC_BACKEND_URL}`,
  `NEXT_PUBLIC_CLINIC_BACKEND_URL=${process.env.NEXT_PUBLIC_CLINIC_BACKEND_URL}`,
  `CLINIC_SESSION_SECRET=${process.env.CLINIC_SESSION_SECRET}`,
  `CLINIC_PASSWORD=${process.env.CLINIC_PASSWORD}`,
  `CLINIC_PRACTITIONER_ID=${process.env.CLINIC_PRACTITIONER_ID}`,
  "",
].join("\n");
writeFileSync(envFilePath, envFileContent);

const runtimeDir = join(outputDir, "runtime");
mkdirSync(runtimeDir, { recursive: true });

const nodeExecutableName = process.platform === "win32" ? "node.exe" : "node";
const runtimeNodePath = join(runtimeDir, nodeExecutableName);
copyFileSync(process.execPath, runtimeNodePath);

if (process.platform !== "win32") {
  chmodSync(runtimeNodePath, 0o755);
}

if (process.platform === "win32") {
  const nodeDir = dirname(process.execPath);
  for (const fileName of readdirSync(nodeDir)) {
    const extension = extname(fileName).toLowerCase();
    const lowerName = fileName.toLowerCase();
    if (
      extension !== ".dll" &&
      extension !== ".dat" &&
      lowerName !== "license" &&
      lowerName !== "license.txt" &&
      lowerName !== "nodevars.bat"
    ) {
      continue;
    }

    const sourceFile = join(nodeDir, fileName);
    const targetFile = join(runtimeDir, fileName);
    copyFileSync(sourceFile, targetFile);
  }
}

console.log("Prepared Tauri release assets at", outputDir);
console.log("Prepared embedded Node runtime at", runtimeNodePath);
