const { spawn } = require("node:child_process");
const path = require("node:path");

const launcherDir = __dirname;
const serverDir = path.join(launcherDir, "server");
const serverEntrypoint = path.join(serverDir, "server.js");

const nextPort = process.env.NEXT_SERVER_PORT || "4120";

const child = spawn(process.execPath, [serverEntrypoint], {
  cwd: serverDir,
  env: {
    ...process.env,
    HOSTNAME: "127.0.0.1",
    PORT: nextPort,
  },
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
