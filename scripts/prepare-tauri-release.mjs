import {
  mkdirSync,
  copyFileSync,
  rmSync,
  existsSync,
  cpSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());
const outputDir = join(root, "release", "next");
const sidecarDir = join(root, "src-tauri", "binaries");

const commandOutput = (command, args) => {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Failed to run ${command}`);
  }

  return result.stdout.trim();
};

const resolveTargetTriple = () => {
  try {
    return commandOutput("rustc", ["--print", "host-tuple"]);
  } catch {
    const rustVerboseVersion = commandOutput("rustc", ["-Vv"]);
    const hostLine = rustVerboseVersion
      .split(/\r?\n/)
      .find((line) => line.startsWith("host:"));

    if (!hostLine) {
      throw new Error("Could not resolve rust target triple from `rustc -Vv`");
    }

    return hostLine.replace("host:", "").trim();
  }
};

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

mkdirSync(sidecarDir, { recursive: true });
for (const fileName of readdirSync(sidecarDir)) {
  if (fileName.startsWith("next-sidecar-")) {
    rmSync(join(sidecarDir, fileName), { force: true });
  }
}

const targetTriple = resolveTargetTriple();
const sidecarFileName =
  process.platform === "win32" ? `next-sidecar-${targetTriple}.exe` : `next-sidecar-${targetTriple}`;
const sidecarPath = join(sidecarDir, sidecarFileName);

copyFileSync(process.execPath, sidecarPath);

if (process.platform !== "win32") {
  chmodSync(sidecarPath, 0o755);
}

const windowsHostTriple = "x86_64-pc-windows-msvc";
if (targetTriple !== windowsHostTriple) {
  const placeholderWindowsSidecar = join(sidecarDir, `next-sidecar-${windowsHostTriple}.exe`);
  if (!existsSync(placeholderWindowsSidecar)) {
    copyFileSync(sidecarPath, placeholderWindowsSidecar);
  }
}

console.log("Prepared Tauri release assets at", outputDir);
console.log("Prepared Node sidecar at", sidecarPath);
