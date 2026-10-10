import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../bin/pathos.mjs', import.meta.url));
const sentinel = 'Synthetic fixture: retain these exact bytes.\n';

function fixture(t, git = true) {
  const base = mkdtempSync(join(tmpdir(), 'pathos-custodian-test-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const root = join(base, 'repo');
  const outside = join(base, 'outside');
  mkdirSync(root); mkdirSync(outside);
  if (git) assert.equal(spawnSync('git', ['init', '-q', root]).status, 0);
  return { base, root, outside };
}

function write(root, path, contents = sentinel) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
  return target;
}

function run(root, ...args) {
  return spawnSync(process.execPath, [cli, 'custodian', ...args, '--json'], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
}

function scan(root) {
  const result = run(root, 'scan', '--dry-run');
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function link(t, target, path) {
  try { symlinkSync(target, path, 'dir'); }
  catch (error) {
    if (error.code === 'EPERM') { t.skip('symlinks unavailable on this host'); return false; }
    throw error;
  }
  return true;
}

for (const destination of ['absolute', 'relative', 'root']) {
  test(`archive destination must be a strict project descendant (${destination})`, (t) => {
    const { root, outside } = fixture(t);
    const source = write(root, 'proof-temp.log');
    const target = destination === 'absolute' ? join(outside, 'archive') : destination === 'relative' ? '../outside/archive' : '.';
    const result = run(root, 'clean', '--apply', '--yes', '--trash', target);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /archive|root|project/i);
    assert.equal(readFileSync(source, 'utf8'), sentinel);
    assert.deepEqual(readdirSync(outside), []);
    assert.equal(existsSync(join(root, 'manifest.json')), false);
  });
}

test('archive path cannot pass through a symlink', (t) => {
  const { root, outside } = fixture(t);
  const source = write(root, 'proof-temp.log');
  if (!link(t, outside, join(root, 'archive-link'))) return;
  const result = run(root, 'clean', '--apply', '--yes', '--trash', 'archive-link/archive');
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /symlink/i);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
  assert.deepEqual(readdirSync(outside), []);
});

test('scan and cleanup never follow a source directory symlink', (t) => {
  const { root, outside } = fixture(t);
  const external = write(outside, 'proof-external.log');
  if (!link(t, outside, join(root, 'linked'))) return;
  assert.equal(scan(root).candidates.some((item) => item.path.includes('proof-external')), false);
  const result = run(root, 'clean', '--apply', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(external, 'utf8'), sentinel);
});

test('tracked source and directories with tracked descendants remain review-only', (t) => {
  const { root } = fixture(t);
  const files = ['docs/proof-contract.md', 'dist/bundle.js', 'proof-new\nline.log'];
  for (const file of files) write(root, file);
  assert.equal(spawnSync('git', ['add', '--', ...files], { cwd: root }).status, 0);
  const inventory = scan(root);
  for (const path of ['docs/proof-contract.md', 'dist', 'proof-new\nline.log']) {
    const entry = inventory.candidates.find((item) => item.path === path);
    assert.ok(entry, path);
    assert.equal(entry.cleanable, false, path);
    assert.match(entry.action, /tracked/i);
  }
  const result = run(root, 'clean', '--apply', '--yes');
  assert.equal(result.status, 0, result.stderr);
  for (const file of files) assert.equal(readFileSync(join(root, file), 'utf8'), sentinel);
});

test('explicit dry-run wins over apply and yes', (t) => {
  const { root } = fixture(t);
  const source = write(root, 'proof-temp.log');
  const result = run(root, 'clean', '--dry-run', '--apply', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).dry_run, true);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
  assert.equal(existsSync(join(root, '.pathos')), false);
});

test('existing archive is refused before any source or old archive changes', (t) => {
  const { root } = fixture(t);
  const source = write(root, 'proof-temp.log');
  const prior = write(root, 'archive/proof-temp.log', 'Previous archive.\n');
  const result = run(root, 'clean', '--apply', '--yes', '--trash', 'archive');
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /exist|fresh/i);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
  assert.equal(readFileSync(prior, 'utf8'), 'Previous archive.\n');
});

test('archive cannot be nested within a candidate being moved', (t) => {
  const { root } = fixture(t);
  const source = write(root, 'dist/bundle.js');
  const result = run(root, 'clean', '--apply', '--yes', '--trash', 'dist/archive');
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /overlap|candidate/i);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
  assert.equal(existsSync(join(root, 'dist/archive')), false);
});

test('prior PATHOS archives are neither enumerated nor consumed', (t) => {
  const { root } = fixture(t);
  const previous = write(root, '.pathos/trash/old/proof-record.log');
  assert.equal(scan(root).candidates.some((item) => item.path.startsWith('.pathos/')), false);
  const result = run(root, 'clean', '--apply', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(previous, 'utf8'), sentinel);
});

test('without verified Git tracking, read-only inventory works and apply refuses', (t) => {
  const { root } = fixture(t, false);
  const source = write(root, 'proof-temp.log');
  const inventory = scan(root);
  assert.equal(inventory.tracking.verified, false);
  assert.match(inventory.tracking.reason, /tracking/i);
  assert.equal(inventory.candidates[0].cleanable, false);
  const result = run(root, 'clean', '--apply', '--yes');
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stderr, /tracking/i);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
  assert.equal(existsSync(join(root, '.pathos')), false);
});

test('ordinary untracked artifacts archive once, with a receipt, preserving file bytes', (t) => {
  const { root } = fixture(t);
  write(root, 'proof-temp.log');
  write(root, 'coverage/proof-report.log');
  const result = run(root, 'clean', '--apply', '--yes');
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.schema, 'pathos-custodian-clean-v0');
  assert.deepEqual(receipt.moved.map((item) => item.from).sort(), ['coverage', 'proof-temp.log']);
  for (const item of receipt.moved) {
    assert.equal(existsSync(join(root, item.from)), false);
    const path = item.from === 'coverage' ? join(item.to, 'proof-report.log') : item.to;
    assert.equal(readFileSync(join(root, path), 'utf8'), sentinel);
  }
});

test('generated-directory symlinks remain review-only, including dangling links', (t) => {
  const { root, outside } = fixture(t);
  write(outside, 'proof-external.log');
  if (!link(t, outside, join(root, 'dist'))) return;
  if (!link(t, join(outside, 'missing'), join(root, 'coverage'))) return;
  const inventory = scan(root);
  for (const path of ['dist', 'coverage']) {
    const entry = inventory.candidates.find((item) => item.path === path);
    assert.equal(entry.cleanable, false);
    assert.equal(entry.bytes, 0);
    assert.match(entry.action, /symlink/i);
  }
});

test('recursive sizes do not follow symlink cycles inside generated directories', (t) => {
  const { root } = fixture(t);
  write(root, 'dist/bundle.js');
  if (!link(t, join(root, 'dist'), join(root, 'dist/cycle'))) return;
  const entry = scan(root).candidates.find((item) => item.path === 'dist');
  assert.equal(entry.bytes, Buffer.byteLength(sentinel));
});

test('tracking protection uses the invocation subdirectory correctly', (t) => {
  const { root } = fixture(t);
  write(root, 'sub/docs/proof-contract.md');
  assert.equal(spawnSync('git', ['add', '.'], { cwd: root }).status, 0);
  const inventory = scan(join(root, 'sub'));
  assert.equal(inventory.tracking.verified, true);
  const entry = inventory.candidates.find((item) => item.path === join('docs', 'proof-contract.md'));
  assert.equal(entry.cleanable, false);
  assert.match(entry.action, /tracked/i);
});

test('tracked gitlink ancestor protects descendants even without an initialized submodule', (t) => {
  const { root } = fixture(t);
  const source = write(root, 'nested/proof-important.log');
  const gitlink = spawnSync('git', ['update-index', '--add', '--cacheinfo',
    '160000,05736a2958501098a589fd4274d9aff547d3bb85,nested'], { cwd: root, encoding: 'utf8' });
  assert.equal(gitlink.status, 0, gitlink.stderr);
  const entry = scan(root).candidates.find((item) => item.path === join('nested', 'proof-important.log'));
  assert.equal(entry.cleanable, false);
  assert.match(entry.action, /tracked/i);
  assert.equal(run(root, 'clean', '--apply', '--yes').status, 0);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
});

test('nested repositories and enclosing generated directories stay protected', (t) => {
  const { root } = fixture(t);
  const nested = join(root, 'coverage/nested');
  mkdirSync(nested, { recursive: true });
  assert.equal(spawnSync('git', ['init', '-q', nested]).status, 0);
  const protectedFile = write(nested, 'proof-important.log');
  const ordinary = write(root, 'proof-temp.log');
  const inventory = scan(root);
  assert.equal(inventory.candidates.some((item) => item.path.includes('proof-important')), false);
  const directory = inventory.candidates.find((item) => item.path === 'coverage');
  assert.equal(directory.cleanable, false);
  assert.match(directory.action, /repository/i);
  const result = run(root, 'clean', '--apply', '--yes');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(protectedFile, 'utf8'), sentinel);
  assert.equal(existsSync(ordinary), false);
});

test('generated directory enclosing prior PATHOS archive is review-only', (t) => {
  const { root } = fixture(t);
  const source = write(root, 'coverage/.pathos/trash/old/proof-record.log');
  const entry = scan(root).candidates.find((item) => item.path === 'coverage');
  assert.equal(entry.cleanable, false);
  assert.match(entry.action, /archive/i);
  assert.equal(run(root, 'clean', '--apply', '--yes').status, 0);
  assert.equal(readFileSync(source, 'utf8'), sentinel);
});

for (const destination of ['.git/archive', 'nested/archive']) {
  test(`archive cannot target Git metadata or another repository (${destination})`, (t) => {
    const { root } = fixture(t);
    const nested = join(root, 'nested');
    mkdirSync(nested);
    assert.equal(spawnSync('git', ['init', '-q', nested]).status, 0);
    const source = write(root, 'proof-temp.log');
    const result = run(root, 'clean', '--apply', '--yes', '--trash', destination);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /metadata|repository/i);
    assert.equal(readFileSync(source, 'utf8'), sentinel);
    assert.equal(existsSync(join(root, destination)), false);
  });
}
