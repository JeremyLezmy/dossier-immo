import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import process from "node:process";

const server = spawn(process.execPath, ["tools/test-server.mjs"], {
  cwd: process.cwd(),
  stdio: "ignore",
  windowsHide: true,
});

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:4173/");
      if (response.ok) return;
    } catch {
      // Le serveur démarre ; la tentative suivante est attendue.
    }
    await delay(100);
  }
  throw new Error("Le serveur de test n'a pas démarré dans le délai attendu.");
}

let exitCode = 1;
try {
  await waitForServer();
  const args = ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)];
  const runner = spawn(process.execPath, args, { cwd: process.cwd(), stdio: "inherit", windowsHide: true });
  exitCode = await new Promise((resolve) => runner.once("exit", (code) => resolve(code ?? 1)));
} finally {
  server.kill();
  await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(2_000)]);
}
process.exit(exitCode);
