const fs = require("node:fs");
const { spawn } = require("node:child_process");
const path = require("node:path");

const launcherDir = __dirname;
const serverDir = path.join(launcherDir, "server");
const serverEntrypoint = path.join(serverDir, "server.js");

const nextPort = process.env.NEXT_SERVER_PORT || "4120";

const logFile = path.join(process.env.CLINIC_DB_PATH ? path.dirname(process.env.CLINIC_DB_PATH) : launcherDir, "next-server-error.log");
const errStream = fs.openSync(logFile, "a");

const child = spawn(process.execPath, [serverEntrypoint], {
  cwd: serverDir,
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    PORT: nextPort,
  },
  stdio: ["ignore", errStream, errStream],
  windowsHide: true,
});

child.on("exit", (code) => {
  fs.writeFileSync(path.join(path.dirname(logFile), "next-exit-code.log"), `Exited with code ${code}`);
  process.exit(code ?? 0);
});
