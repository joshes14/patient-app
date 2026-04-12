import {
  mkdirSync,
  copyFileSync,
  rmSync,
  existsSync,
  cpSync,
  chmodSync,
  readdirSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const outputDir = join(root, "release", "next");

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
    if (extension !== ".dll" && extension !== ".dat") {
      continue;
    }

    const sourceFile = join(nodeDir, fileName);
    const targetFile = join(runtimeDir, fileName);
    copyFileSync(sourceFile, targetFile);
  }
}

console.log("Prepared Tauri release assets at", outputDir);
console.log("Prepared embedded Node runtime at", runtimeNodePath);
