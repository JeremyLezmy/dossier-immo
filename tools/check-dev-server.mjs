import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const viteEntry = path.join(
  workspaceRoot,
  "node_modules",
  "vite",
  "bin",
  "vite.js",
);
const port = 5198;
const baseUrl = `http://127.0.0.1:${port}`;
let output = "";

const server = spawn(
  process.execPath,
  [
    viteEntry,
    "apps/web",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  {
    cwd: workspaceRoot,
    env: { ...process.env, NO_COLOR: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => {
    output = `${output}${chunk}`.slice(-8_000);
  });
}

async function waitForTransform() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null)
      throw new Error(`Vite s'est arrêté prématurément.\n${output}`);

    try {
      const [indexResponse, mainResponse] = await Promise.all([
        fetch(`${baseUrl}/`),
        fetch(`${baseUrl}/src/main.tsx`),
      ]);
      if (indexResponse.ok && mainResponse.ok) return;
      output = `${output}\nHTTP index=${indexResponse.status}, main=${mainResponse.status}`;
    } catch {
      // Vite n'écoute pas encore : la tentative suivante vérifiera de nouveau.
    }

    await delay(250);
  }

  throw new Error(
    `Vite n'a pas transformé l'application dans le délai imparti.\n${output}`,
  );
}

try {
  await waitForTransform();
  console.log("Vite dev : index et src/main.tsx répondent correctement.");
} finally {
  server.kill();
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    delay(2_000),
  ]);
}
