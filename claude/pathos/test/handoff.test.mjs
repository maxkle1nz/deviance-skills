import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../bin/pathos.mjs', import.meta.url));
const preserved = '# PATHOS\n\nOwner decisions, proven state, and next steps.\n';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pathos-handoff-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function run(root, args = []) {
  return spawnSync(process.execPath, [cli, 'handoff', ...args], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
}

function assertRefused(result) {
  assert.equal(result.status, 1, result.stderr || result.stdout);
  assert.match(result.stderr, /Refusing to overwrite existing handoff/);
  assert.match(result.stderr, /new output path/);
  assert.doesNotMatch(result.stdout, /wrote|"wrote"/);
}

for (const [name, args, destination] of [
  ['default', [], 'PATHOS.md'],
  ['--write', ['--write', 'docs/PATHOS.md', '--json'], 'docs/PATHOS.md'],
  ['--out alias', ['--out', 'docs/handoff.md'], 'docs/handoff.md'],
]) {
  test(`existing handoff is refused and preserved (${name})`, (t) => {
    const root = fixture(t);
    const target = join(root, destination);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, preserved);
    const result = run(root, args);
    assert.equal(readFileSync(target, 'utf8'), preserved);
    assertRefused(result);
  });
}

test('absent nested handoff is created with its existing JSON receipt', (t) => {
  const root = fixture(t);
  const result = run(root, ['--write', 'docs/PATHOS.md', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.schema, 'pathos-handoff-write-v0');
  assert.equal(receipt.wrote, 'docs/PATHOS.md');
  assert.match(readFileSync(join(root, 'docs/PATHOS.md'), 'utf8'), /^# PATHOS Handoff\n/);
});

test('existing destination symlink never overwrites its target', (t) => {
  const root = fixture(t);
  const target = join(root, 'curated.md');
  writeFileSync(target, preserved);
  try {
    symlinkSync(target, join(root, 'PATHOS.md'));
  } catch (error) {
    if (error.code === 'EPERM') return t.skip('symlink creation not permitted on this host');
    throw error;
  }
  assertRefused(run(root));
  assert.equal(readFileSync(target, 'utf8'), preserved);
});

test('concurrent creators get one success and one explicit refusal', async (t) => {
  const root = fixture(t);
  function create() {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [cli, 'handoff', '--json'], { cwd: root });
      let stdout = '', stderr = '';
      child.stdout.on('data', (data) => { stdout += data; });
      child.stderr.on('data', (data) => { stderr += data; });
      child.on('error', reject);
      child.on('close', (status) => resolve({ status, stdout, stderr }));
    });
  }
  const results = await Promise.all([create(), create()]);
  assert.deepEqual(results.map((result) => result.status).sort(), [0, 1]);
  assertRefused(results.find((result) => result.status === 1));
  assert.equal(JSON.parse(results.find((result) => result.status === 0).stdout).wrote, 'PATHOS.md');
  assert.match(readFileSync(join(root, 'PATHOS.md'), 'utf8'), /^# PATHOS Handoff\n/);
});
