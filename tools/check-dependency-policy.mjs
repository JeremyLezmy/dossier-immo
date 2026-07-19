import { mkdtemp, mkdir, readFile, rm, copyFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = join(root, "docs", "dependency-trust-exclusions.json");
const workspacePath = join(root, "pnpm-workspace.yaml");
const lockfilePath = join(root, "pnpm-lock.yaml");
const probeRequested = process.argv.includes("--probe");
const manifestPaths = [
  "package.json",
  "apps/web/package.json",
  "packages/calculations/package.json",
  "packages/document/package.json",
  "packages/domain/package.json",
  "packages/fixtures/package.json",
  "packages/schema/package.json"
];

const [policyText, workspaceText, lockfileText] = await Promise.all([
  readFile(policyPath, "utf8"),
  readFile(workspacePath, "utf8"),
  readFile(lockfilePath, "utf8")
]);
const policy = JSON.parse(policyText);
const errors = [];

function fail(message) {
  errors.push(message);
}

function extractYamlExclusions(yaml) {
  const block = yaml.match(/^trustPolicyExclude:\s*\r?\n((?:^[ \t]+.*(?:\r?\n|$))*)/m)?.[1] ?? "";
  return [...block.matchAll(/^\s+-\s+(?:"([^"]+)"|'([^']+)'|([^\s#]+))/gm)].map(
    (match) => match[1] ?? match[2] ?? match[3]
  );
}

function packageName(specifier) {
  const separator = specifier.lastIndexOf("@");
  return specifier.slice(0, separator);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const yamlExclusions = extractYamlExclusions(workspaceText);
const documentedExclusions = policy.exclusions.map(({ specifier }) => specifier);

if (policy.policy.maturityWindowMinutes !== 4320) {
  fail("La fenêtre de maturité documentée doit rester de 4320 minutes (72 h). ");
}
if (policy.policy.trustPolicy !== "no-downgrade") {
  fail("La politique documentée doit rester no-downgrade.");
}
if (!workspaceText.includes("minimumReleaseAge: 4320")) {
  fail("pnpm-workspace.yaml ne fixe plus la fenêtre de maturité à 72 h.");
}
if (!workspaceText.includes("minimumReleaseAgeStrict: true")) {
  fail("minimumReleaseAgeStrict doit rester activé.");
}
if (!workspaceText.includes("trustPolicy: no-downgrade")) {
  fail("trustPolicy: no-downgrade doit rester activé.");
}
if (new Set(yamlExclusions).size !== yamlExclusions.length) {
  fail("Une exclusion trustPolicy est dupliquée dans pnpm-workspace.yaml.");
}
if (
  yamlExclusions.length !== documentedExclusions.length ||
  yamlExclusions.some((specifier) => !documentedExclusions.includes(specifier))
) {
  fail("Les exclusions pnpm et docs/dependency-trust-exclusions.json divergent.");
}

const today = new Date().toISOString().slice(0, 10);
for (const exclusion of policy.exclusions) {
  const { specifier } = exclusion;
  const separator = specifier.lastIndexOf("@");
  const version = specifier.slice(separator + 1);
  if (separator <= 0 || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    fail(`${specifier} n'est pas une exclusion exacte nom@version.`);
  }
  if (!exclusion.reason || !exclusion.integrity || !exclusion.removalCondition) {
    fail(`${specifier} ne documente pas complètement raison, intégrité et condition de retrait.`);
  }
  if (!Array.isArray(exclusion.requiredBy) || exclusion.requiredBy.length === 0) {
    fail(`${specifier} ne documente aucun parent requis.`);
  }
  if (
    !Number.isInteger(exclusion.reviewCadenceDays) ||
    exclusion.reviewCadenceDays > policy.policy.maximumReviewCadenceDays
  ) {
    fail(`${specifier} dépasse la cadence maximale de revue autorisée.`);
  }
  if (exclusion.nextReviewOn < today) {
    fail(`${specifier} aurait dû être revu le ${exclusion.nextReviewOn}.`);
  }
  const lockEntry = new RegExp(
    `(?:^|\\n)  ['\"]?${escapeRegExp(specifier)}['\"]?:\\r?\\n    resolution: \\{integrity: ${escapeRegExp(exclusion.integrity)}\\}`
  );
  if (!lockEntry.test(lockfileText)) {
    fail(`${specifier} ou son intégrité documentée ne correspond plus au lockfile.`);
  }
  for (const parent of exclusion.requiredBy) {
    if (!lockfileText.includes(parent)) {
      fail(`Le parent documenté ${parent} de ${specifier} est absent du lockfile.`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Politique statique valide : ${documentedExclusions.length} exclusion(s) exacte(s), fenêtre 72 h.`);

async function copyManifest(relativePath, destinationRoot) {
  const destination = join(destinationRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(root, relativePath), destination);
}

async function probeExclusion(exclusion) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "dossier-immo-trust-probe-"));
  try {
    await Promise.all(manifestPaths.map((path) => copyManifest(path, temporaryRoot)));
    await copyFile(lockfilePath, join(temporaryRoot, "pnpm-lock.yaml"));
    const linePattern = new RegExp(
      `^\\s+-\\s+(?:"${escapeRegExp(exclusion.specifier)}"|'${escapeRegExp(exclusion.specifier)}'|${escapeRegExp(exclusion.specifier)})\\s*\\r?\\n`,
      "m"
    );
    const workspaceWithoutExclusion = workspaceText.replace(linePattern, "");
    if (workspaceWithoutExclusion === workspaceText) {
      throw new Error(`Impossible de retirer ${exclusion.specifier} du YAML de test.`);
    }
    await writeFile(join(temporaryRoot, "pnpm-workspace.yaml"), workspaceWithoutExclusion, "utf8");

    const isWindows = process.platform === "win32";
    const command = isWindows ? process.env.ComSpec ?? "cmd.exe" : "corepack";
    const commandArguments = isWindows
      ? [
          "/d",
          "/s",
          "/c",
          "corepack.cmd pnpm install --lockfile-only --frozen-lockfile --ignore-scripts"
        ]
      : ["pnpm", "install", "--lockfile-only", "--frozen-lockfile", "--ignore-scripts"];
    const result = spawnSync(
      command,
      commandArguments,
      {
        cwd: temporaryRoot,
        encoding: "utf8",
        env: { ...process.env, CI: "true", NO_COLOR: "1" }
      }
    );
    if (result.error) {
      throw new Error(`Impossible de lancer Corepack pour ${exclusion.specifier}: ${result.error.message}`);
    }
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (result.status === 0) {
      throw new Error(
        `${exclusion.specifier} ne bloque plus la politique : l'exclusion doit être examinée et probablement supprimée.`
      );
    }
    const name = packageName(exclusion.specifier);
    if (!/TRUST_DOWNGRADE|trust level downgrade/i.test(output) || !output.includes(name)) {
      throw new Error(
        `Le sondage de ${exclusion.specifier} a échoué pour une raison inattendue :\n${output.trim()}`
      );
    }
    console.log(`Exclusion encore nécessaire : ${exclusion.specifier}`);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

if (probeRequested) {
  for (const exclusion of policy.exclusions) {
    await probeExclusion(exclusion);
  }
}
