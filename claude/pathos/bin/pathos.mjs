#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const ROOT = realpathSync(process.cwd());
const DEFAULT_BACKUP_ROOT = ".pathos/backups";
const DEFAULT_TRASH_ROOT = ".pathos/trash";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  lime: "\x1b[92m",
  gold: "\x1b[93m",
  red: "\x1b[91m",
  gray: "\x1b[90m",
};

function color(text, tone) {
  if (process.env.NO_COLOR || !process.stdout.isTTY) return text;
  return `${ANSI[tone] ?? ""}${text}${ANSI.reset}`;
}

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: options.cwd ?? ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return options.fallback ?? "";
  }
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      out._.push(item);
      continue;
    }
    const [rawKey, rawValue] = item.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (rawValue !== undefined) {
      out[key] = rawValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
      out[key] = argv[i + 1];
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function rel(path) {
  const value = relative(ROOT, path);
  return value || ".";
}

function isInsideRoot(path) {
  return isWithin(ROOT, path);
}

function isWithin(parent, path) {
  const value = relative(parent, path);
  return value === "" || (value !== ".." && !value.startsWith(`..${sep}`) && !isAbsolute(value));
}

function assertProjectPath(path) {
  if (path === ROOT || !isInsideRoot(path)) {
    throw new Error("Archive and source paths must be strict descendants of the project root.");
  }
  let current = ROOT;
  for (const part of relative(ROOT, path).split(sep)) {
    if (part === ".git") throw new Error("Refusing to archive into Git metadata.");
    current = join(current, part);
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) {
      throw new Error("Refusing a custodian path containing a symlink.");
    }
    if (stat?.isDirectory() && lstatSync(join(current, ".git"), { throwIfNoEntry: false })) {
      throw new Error("Refusing to cross a nested repository boundary.");
    }
  }
}

function trackedPaths() {
  try {
    const output = execFileSync("git", ["ls-files", "-z", "--cached", "--", "."], {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    return { verified: true, reason: "Git tracking verified.", files: output.split("\0").filter(Boolean).map((file) => resolve(ROOT, file)) };
  } catch {
    return { verified: false, reason: "Git tracking unavailable; scan/report-only until tracking can be verified.", files: [] };
  }
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function gitInfo() {
  const inside = run("git", ["rev-parse", "--is-inside-work-tree"]) === "true";
  if (!inside) {
    return {
      inside: false,
      branch: null,
      status: "not a git repo",
      latestCommit: null,
      remote: null,
      dirty: null,
      changedFiles: [],
    };
  }
  const branch = run("git", ["branch", "--show-current"], { fallback: "detached" }) || "detached";
  const shortStatus = run("git", ["status", "-sb"], { fallback: "" });
  const changedFiles = run("git", ["status", "--porcelain"], { fallback: "" })
    .split("\n")
    .filter(Boolean)
    .map((line) => line.trim());
  const latestCommit = run("git", ["log", "--oneline", "-1"], { fallback: "" });
  const remote = run("git", ["remote", "get-url", "origin"], { fallback: "" });
  return {
    inside: true,
    branch,
    status: shortStatus,
    latestCommit,
    remote,
    dirty: changedFiles.length > 0,
    changedFiles,
  };
}

function packageInfo() {
  const pkg = readJson(join(ROOT, "package.json"));
  if (!pkg) return null;
  return {
    name: pkg.name ?? null,
    version: pkg.version ?? null,
    scripts: Object.keys(pkg.scripts ?? {}),
    bin: pkg.bin ?? null,
  };
}

function sizeOf(path) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink()) return 0;
  if (!stat.isDirectory()) return stat.size;
  if (lstatSync(join(path, ".git"), { throwIfNoEntry: false })) return 0;
  let total = 0;
  for (const entry of readdirSync(path)) {
    if (entry === ".git" || entry === ".pathos") continue;
    total += sizeOf(join(path, entry));
  }
  return total;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)}${units[unit]}`;
}

function ageOf(path) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (!stat) return "--";
  const ms = Date.now() - stat.mtimeMs;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function walkFiles(dir, maxDepth = 3, depth = 0, out = []) {
  if (!existsSync(dir) || depth > maxDepth) return out;
  if (dir !== ROOT && lstatSync(join(dir, ".git"), { throwIfNoEntry: false })) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === ".pathos" || entry === "node_modules" || entry === "dist") continue;
    const path = join(dir, entry);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) {
      walkFiles(path, maxDepth, depth + 1, out);
    } else {
      out.push(path);
    }
  }
  return out;
}

function containsProtectedTree(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
  const entries = readdirSync(path);
  if (entries.includes(".git") || entries.includes(".pathos")) return true;
  return entries.some((entry) => containsProtectedTree(join(path, entry)));
}

function candidate(path, kind, risk, action, cleanable = false) {
  const bytes = sizeOf(path);
  return {
    path: rel(path),
    kind,
    age: ageOf(path),
    size: formatBytes(bytes),
    bytes,
    risk,
    action,
    cleanable,
  };
}

function scanCandidates() {
  const candidates = [];
  const tracking = trackedPaths();
  const knownDirs = [
    ["dist", "build output", "low", "archive or regenerate", true],
    ["coverage", "test coverage", "low", "archive or regenerate", true],
    [".vite", "vite cache", "low", "archive or regenerate", true],
    [".turbo", "tool cache", "low", "archive or regenerate", true],
    [".next", "framework output", "low", "archive or regenerate", true],
    [".cache", "tool cache", "medium", "review first", false],
    ["node_modules", "dependency install", "medium", "keep unless disk pressure is explicit", false],
  ];
  for (const [name, kind, risk, action, cleanable] of knownDirs) {
    const path = join(ROOT, name);
    if (lstatSync(path, { throwIfNoEntry: false })) candidates.push(candidate(path, kind, risk, action, cleanable));
  }

  for (const file of walkFiles(ROOT, 4)) {
    const name = basename(file);
    const relFile = rel(file);
    const pathosSessionArtifact =
      name.startsWith("pathos-") && !relFile.startsWith("skill/references/");
    if (
      name.endsWith(".log") ||
      name.endsWith(".tsbuildinfo") ||
      name.startsWith("proof-") ||
      name.startsWith("screenshot") ||
      pathosSessionArtifact ||
      name === "ingest_roots.json"
    ) {
      const kind = name === "ingest_roots.json" ? "local m1nd artifact" : "session artifact";
      candidates.push(candidate(file, kind, "low", "archive or remove after backup", true));
    }
  }

  for (const item of candidates) {
    const path = resolve(ROOT, item.path);
    const reason = lstatSync(path).isSymbolicLink() ? "symlink; review only"
      : !tracking.verified ? tracking.reason
      : tracking.files.some((file) => isWithin(path, file) || isWithin(file, path)) ? "tracked content; review only"
      : item.cleanable && containsProtectedTree(path) ? "nested repository or PATHOS archive; review only"
      : null;
    if (reason) {
      item.cleanable = false;
      item.risk = "protected";
      item.action = reason;
    }
  }
  return {
    candidates: candidates.sort((a, b) => b.bytes - a.bytes),
    tracking: { verified: tracking.verified, reason: tracking.reason },
  };
}

function collectStatus() {
  const git = gitInfo();
  const pkg = packageInfo();
  const { candidates, tracking } = scanCandidates();
  return {
    schema: "pathos-session-status-v0",
    generated_at: new Date().toISOString(),
    cwd: ROOT,
    project: pkg?.name ?? basename(ROOT),
    package: pkg,
    git,
    custodian: {
      tracking,
      candidates: candidates.length,
      cleanable_candidates: candidates.filter((item) => item.cleanable).length,
      total_candidate_bytes: candidates.reduce((sum, item) => sum + item.bytes, 0),
    },
  };
}

function printStatus(status) {
  console.log(color("✦ PATHOS SESSION STATE", "lime"));
  console.log();
  console.log(`${color("PROJECT", "cyan").padEnd(24)}${status.project}`);
  console.log(`${color("LOCAL REPO", "cyan").padEnd(24)}${status.cwd}`);
  console.log(`${color("BRANCH", "cyan").padEnd(24)}${status.git.branch ?? "--"}`);
  console.log(`${color("GIT STATE", "cyan").padEnd(24)}${status.git.dirty ? "dirty" : "clean"}`);
  console.log(`${color("LATEST COMMIT", "cyan").padEnd(24)}${status.git.latestCommit || "--"}`);
  console.log(`${color("REMOTE", "cyan").padEnd(24)}${status.git.remote || "--"}`);
  console.log(`${color("CUSTODIAN", "cyan").padEnd(24)}${status.custodian.cleanable_candidates} cleanable / ${status.custodian.candidates} candidates`);
  if (status.git.changedFiles.length > 0) {
    console.log();
    console.log(color("Changed files", "gold"));
    for (const file of status.git.changedFiles.slice(0, 12)) console.log(`  ${file}`);
    if (status.git.changedFiles.length > 12) console.log(`  ... ${status.git.changedFiles.length - 12} more`);
  }
}

function proofCommands(pkg) {
  const scripts = new Set(pkg?.scripts ?? []);
  const commands = [];
  if (scripts.has("lint:docs")) commands.push("npm run lint:docs");
  if (scripts.has("test:cli")) commands.push("npm run test:cli");
  if (scripts.has("build")) commands.push("npm run build");
  commands.push("git diff --check");
  return commands;
}

function handoffMarkdown(status) {
  const proof = proofCommands(status.package);
  return `# PATHOS Handoff

Generated: ${status.generated_at}

## North Star

Continue this project without losing the human/agent operating cadence, proof discipline, access map, or known limits.

## Current State

- Repo: ${status.cwd}
- Project: ${status.project}
- Branch: ${status.git.branch ?? "--"}
- Git state: ${status.git.dirty ? "dirty" : "clean"}
- Latest commit: ${status.git.latestCommit || "--"}
- Remote: ${status.git.remote || "--"}
- Custodian candidates: ${status.custodian.cleanable_candidates} cleanable / ${status.custodian.candidates} total

## Human/Agent Pathos

- Keep the vision high and the next proof small.
- Be warm, direct, and honest.
- Celebrate artifacts, not unsupported narrative.
- Push back when a claim outruns evidence.

## Operating Doctrine

- Capture baseline before changes.
- Prefer contracts and artifacts over prose-only confidence.
- Preserve user work and never revert unknown changes.
- Use dry-run and backup before cleanup.

## Access Map

- Main repo: ${status.cwd}
- Package scripts: ${(status.package?.scripts ?? []).join(", ") || "--"}
- Public remote: ${status.git.remote || "--"}
- CLI: \`pathos\` or \`npx pathos\` when installed.

## Known Problems

- PATHOS transfers observable continuity, not hidden model memory.
- Custodian cleanup is confirmation-gated and reversible-first.
- The next agent must verify current state with real commands.

## Proof Standard

Run:

${proof.map((command) => `- \`${command}\``).join("\n")}

## Next Agent Prompt

\`\`\`text
You are continuing from a PATHOS handoff.

First read this handoff, then run:
- git status -sb
- pathos status

Preserve the working relationship: high ambition, small proof, honest limits,
no secret values, and no destructive cleanup without explicit approval.
\`\`\`

## First Commands

\`\`\`bash
git status -sb
pathos status
pathos custodian scan --dry-run
\`\`\`

## Do Not Do

- Do not record secret values.
- Do not delete or move files without explicit approval.
- Do not claim capability without proof.
- Do not overwrite existing user work.

## Open Questions

- Which artifacts should be archived after review?
- Should PATHOS Custodian become a published package command?
`;
}

function writeHandoff(args) {
  const status = collectStatus();
  const output = args.write || args.out || "PATHOS.md";
  const target = resolve(ROOT, output);
  if (!isInsideRoot(target)) {
    throw new Error("Refusing to write outside the current repo.");
  }
  mkdirSync(dirname(target), { recursive: true });
  try {
    writeFileSync(target, handoffMarkdown(status), { flag: "wx" });
  } catch (error) {
    if (error.code === "EEXIST") {
      throw new Error("Refusing to overwrite existing handoff. Read and update it manually, or choose a new output path.");
    }
    throw error;
  }
  if (args.json) {
    console.log(JSON.stringify({ schema: "pathos-handoff-write-v0", wrote: rel(target), status }, null, 2));
  } else {
    console.log(`${color("✦ PATHOS", "lime")} wrote ${color(rel(target), "cyan")}`);
  }
}

function printScan({ candidates, tracking }, args) {
  if (args.json) {
    console.log(JSON.stringify({ schema: "pathos-custodian-scan-v0", dry_run: true, candidates, tracking }, null, 2));
    return;
  }
  console.log(color("✦ PATHOS CUSTODIAN", "lime"));
  console.log(color("dry-run inventory; nothing changed", "dim"));
  console.log(tracking.reason);
  console.log();
  console.log("SESSION / ARTIFACT".padEnd(34), "AGE".padEnd(7), "SIZE".padEnd(9), "STATUS");
  for (const item of candidates) {
    const marker = item.cleanable ? "🧼" : "🛡️";
    const status = item.cleanable ? item.action : `review: ${item.action}`;
    console.log(`${marker} ${item.path}`.padEnd(34), item.age.padEnd(7), item.size.padEnd(9), status);
  }
  console.log();
  console.log("[1] write handoff   [2] backup sanitized");
  console.log("[3] dry-run clean   [4] apply only with --apply --yes");
}

function backup(args) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = resolve(ROOT, args.out || join(DEFAULT_BACKUP_ROOT, stamp));
  if (!isInsideRoot(out)) throw new Error("Refusing to write backup outside the current repo.");
  mkdirSync(out, { recursive: true });
  const status = collectStatus();
  const { candidates } = scanCandidates();
  writeFileSync(join(out, "manifest.json"), JSON.stringify({
    schema: "pathos-custodian-backup-v0",
    generated_at: new Date().toISOString(),
    status,
    candidates,
  }, null, 2));
  writeFileSync(join(out, "PATHOS.md"), handoffMarkdown(status));
  if (existsSync(join(ROOT, "README.md"))) cpSync(join(ROOT, "README.md"), join(out, "README.snapshot.md"));
  if (args.json) {
    console.log(JSON.stringify({ schema: "pathos-custodian-backup-v0", out: rel(out), files: ["manifest.json", "PATHOS.md", "README.snapshot.md"] }, null, 2));
  } else {
    console.log(`${color("✦ PATHOS", "lime")} backup manifest written to ${color(rel(out), "cyan")}`);
  }
}

function clean(args) {
  const scan = scanCandidates();
  if (args.dryRun || !args.apply || !args.yes) {
    printScan(scan, args);
    if (!args.json) console.log(color("No files moved. Use --apply --yes after backup to archive cleanable artifacts.", "gold"));
    return;
  }
  if (!scan.tracking.verified) throw new Error(scan.tracking.reason);
  const eligible = scan.candidates.filter((item) => item.cleanable);
  const candidates = eligible.filter((item) => !eligible.some((other) =>
    other !== item && isWithin(resolve(ROOT, other.path), resolve(ROOT, item.path))));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const trashRoot = resolve(ROOT, args.trash || join(DEFAULT_TRASH_ROOT, stamp));
  assertProjectPath(trashRoot);
  if (lstatSync(trashRoot, { throwIfNoEntry: false })) {
    throw new Error("Refusing an existing archive destination; choose a fresh directory.");
  }
  for (const item of candidates) {
    const from = resolve(ROOT, item.path);
    assertProjectPath(from);
    if (isWithin(from, trashRoot) || isWithin(trashRoot, from)) {
      throw new Error("Archive destination overlaps a cleanup candidate.");
    }
  }
  mkdirSync(dirname(trashRoot), { recursive: true });
  assertProjectPath(trashRoot);
  mkdirSync(trashRoot); // Exclusive reservation: never reuse a prior archive.
  const moved = [];
  for (const item of candidates) {
    const from = resolve(ROOT, item.path);
    assertProjectPath(from);
    const to = join(trashRoot, item.path);
    assertProjectPath(to);
    mkdirSync(dirname(to), { recursive: true });
    assertProjectPath(to);
    if (lstatSync(to, { throwIfNoEntry: false })) throw new Error("Refusing to replace an archive entry.");
    renameSync(from, to);
    moved.push({ from: item.path, to: rel(to) });
  }
  const manifest = join(trashRoot, "manifest.json");
  assertProjectPath(manifest);
  writeFileSync(manifest, JSON.stringify({ schema: "pathos-custodian-trash-v0", moved }, null, 2), { flag: "wx" });
  if (args.json) {
    console.log(JSON.stringify({ schema: "pathos-custodian-clean-v0", moved }, null, 2));
  } else {
    console.log(`${color("✦ PATHOS", "lime")} moved ${moved.length} cleanable artifacts to ${color(rel(trashRoot), "cyan")}`);
  }
}

function help() {
  console.log(`PATHOS

Usage:
  pathos status [--json]
  pathos handoff --write docs/PATHOS.md [--json]
  pathos custodian scan --dry-run [--json]
  pathos custodian backup [--out .pathos/backups/name] [--json]
  pathos custodian clean --dry-run [--json]
  pathos custodian clean --apply --yes

Safety:
  Cleanup is dry-run by default. --apply --yes moves cleanable artifacts to
  .pathos/trash/<timestamp>; it does not permanently delete them.
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const [command, subcommand] = args._;
  try {
    if (!command || command === "help" || args.help) return help();
    if (command === "status") {
      const status = collectStatus();
      if (args.json) console.log(JSON.stringify(status, null, 2));
      else printStatus(status);
      return;
    }
    if (command === "handoff") return writeHandoff(args);
    if (command === "custodian" && subcommand === "scan") return printScan(scanCandidates(), { ...args, dryRun: true });
    if (command === "custodian" && subcommand === "backup") return backup(args);
    if (command === "custodian" && subcommand === "clean") return clean(args);
    help();
    process.exitCode = 1;
  } catch (error) {
    console.error(color(`PATHOS error: ${error.message}`, "red"));
    process.exitCode = 1;
  }
}

main();
