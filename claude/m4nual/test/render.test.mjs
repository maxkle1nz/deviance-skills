// Suíte golden-file + casos de erro para render.mjs (node:test builtin, zero-dep).
// Roda com:  node --test test/   ou   node bin/render.mjs --selftest
//
// Regenerar o golden após uma mudança INTENCIONAL de template:
//   node --input-type=module -e "import {renderManual} from './bin/render.mjs'; \
//     import fs from 'node:fs'; \
//     fs.writeFileSync('test/fixtures/minimal.html', \
//       renderManual(fs.readFileSync('test/fixtures/minimal.md','utf8'), \
//       {sourcePath:'minimal.md', now:new Date('2026-07-18T12:00:00Z')}));"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  renderManual,
  checkSurface,
  parseLangMarker,
  extractMirror,
} from '../bin/render.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const fx = (p) => join(__dir, 'fixtures', p);

// "now" fixo para determinismo do banner (0 dias → verde no minimal).
const NOW = new Date('2026-07-18T12:00:00Z');

// Compara SÓ a região de conteúdo (entre os sentinelas), normalizando o
// whitespace irrelevante — assim tweaks de CSS/JS não flakeiam o golden.
function contentOf(html) {
  const m = html.match(/<!-- m4nual:content:start -->([\s\S]*?)<!-- m4nual:content:end -->/);
  return m ? m[1] : html;
}
function norm(s) {
  return s.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}

// ── golden ──────────────────────────────────────────────────────────────────
test('golden: minimal.md casa com minimal.html (região de conteúdo)', () => {
  const src = readFileSync(fx('minimal.md'), 'utf8');
  const got = renderManual(src, { sourcePath: 'minimal.md', now: NOW });
  const golden = readFileSync(fx('minimal.html'), 'utf8');
  assert.equal(norm(contentOf(got)), norm(contentOf(golden)));
});

test('golden: cobre todo o dialeto (headings, tabela, lista aninhada, code, mermaid, blockquote, links, bold/it/code, hr)', () => {
  const html = renderManual(readFileSync(fx('minimal.md'), 'utf8'), { sourcePath: 'minimal.md', now: NOW });
  assert.match(html, /<h1 class="doc-title">MANUAL — Example System<\/h1>/);
  assert.match(html, /<table>/);
  assert.match(html, /<li>Second point<ul><li>Nested sub-point<\/li><\/ul><\/li>/); // 1 nível de nesting
  assert.match(html, /<code class="language-bash">flyctl deploy --remote-only<\/code>/);
  assert.match(html, /<pre class="mermaid">flowchart LR/);
  assert.match(html, /<blockquote>Note: this blockquote/);
  assert.match(html, /<strong>manual<\/strong> <em>example<\/em> with <code>inline code<\/code>/);
  assert.match(html, /<a href="https:\/\/example\.com" rel="noopener">link<\/a>/);
  assert.match(html, /<hr>/);
});

// ── universalidade: idioma por marcador + fallback en ────────────────────────
test('lang: marcador é lido; dicionário it aplicado', () => {
  const html = renderManual(readFileSync(fx('minimal-it.md'), 'utf8'), { sourcePath: 'minimal-it.md', now: NOW });
  assert.match(html, /<html lang="it">/);
  assert.match(html, /Cerca nel manuale…/);   // search it
  assert.match(html, />Indice</);              // tocTitle it
  assert.match(html, /Specchio verificato/);   // stampVerified it
});

test('lang: minimal.md (lang=en) usa dicionário en', () => {
  const html = renderManual(readFileSync(fx('minimal.md'), 'utf8'), { sourcePath: 'minimal.md', now: NOW });
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Search the manual…/);
  assert.match(html, /Mirror verified/);
});

test('lang: sem marcador → fallback en', () => {
  assert.equal(parseLangMarker('# T\n\nCiao.\n'), null);
  const html = renderManual('# T\n\nCiao.\n', { now: NOW });
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Contents/);
});

test('lang: --lang override vence o marcador', () => {
  const html = renderManual(readFileSync(fx('minimal.md'), 'utf8'), { sourcePath: 'minimal.md', lang: 'pt', now: NOW });
  assert.match(html, /<html lang="pt">/);
  assert.match(html, /Buscar no manual…/);
});

// ── carimbo do espelho (marcador NEUTRO, não frase de idioma) ────────────────
test('carimbo: marcador neutro parseado (date+commit)', () => {
  assert.deepEqual(
    extractMirror('<!-- m4nual:mirror date=2026-07-18 commit=abc1234 -->\n# T\n'),
    { date: '2026-07-18', commit: 'abc1234' }
  );
});

test('banner: carimbo fresco (≤30d) → verde', () => {
  const src = '<!-- m4nual: lang=en -->\n<!-- m4nual:mirror date=2026-07-18 commit=abc1234 -->\n# T\n\nHi.\n';
  assert.match(renderManual(src, { now: NOW }), /stamp-green/);
});

test('banner: carimbo velho (>30d) → âmbar', () => {
  const src = '<!-- m4nual: lang=en -->\n<!-- m4nual:mirror date=2020-01-01 commit=deadbee -->\n# T\n\nHi.\n';
  assert.match(renderManual(src, { now: NOW }), /stamp-amber/);
});

test('banner: sem carimbo → cinza + "mirror not verified"', () => {
  const html = renderManual('<!-- m4nual: lang=en -->\n# T\n\nHi.\n', { now: NOW });
  assert.match(html, /stamp-gray/);
  assert.match(html, /mirror not verified/);
});

// ── dialeto fechado fail-loud (RC-4): cada erro assertando a mensagem ─────────
function throwsWith(fn, ...needles) {
  assert.throws(fn, (e) => needles.every((n) => n.test(e.message)));
}

test('erro: imagem ![](...) fora do dialeto', () => {
  throwsWith(() => renderManual('# T\n\n![x](y.png)\n', { now: NOW }), /:3:/, /image/);
});

test('erro: HTML inline', () => {
  throwsWith(() => renderManual('# T\n\nHi <b>x</b> world\n', { now: NOW }), /:3:/, /HTML/);
});

test('erro: footnote [^1]', () => {
  throwsWith(() => renderManual('# T\n\nText[^1]\n', { now: NOW }), /:3:/, /footnote/);
});

test('erro: heading setext (--- sob texto)', () => {
  throwsWith(() => renderManual('# T\n\nTitle\n---\n', { now: NOW }), /:4:/, /setext/);
});

test('erro: heading h5', () => {
  throwsWith(() => renderManual('# T\n\n##### too deep\n', { now: NOW }), /:3:/, /h5/, /h4/);
});

test('erro: task list', () => {
  throwsWith(() => renderManual('# T\n\n- [ ] task\n', { now: NOW }), /:3:/, /task list/);
});

test('erro: nesting > 1 nível', () => {
  throwsWith(() => renderManual('# T\n\n- a\n  - b\n    - c\n', { now: NOW }), /:5:/, /nesting/);
});

test('erro: fence não fechado', () => {
  throwsWith(() => renderManual('# T\n\n```bash\necho hi\n', { now: NOW }), /:3:/, /unclosed/);
});

test('erro: link com esquema perigoso', () => {
  throwsWith(() => renderManual('# T\n\n[x](javascript:alert(1))\n', { now: NOW }), /:3:/, /scheme javascript/);
});

// ── no-leak bloqueante (lei 5) ───────────────────────────────────────────────
// Tokens fake construídos por CONCATENAÇÃO: o literal contíguo nunca aparece no
// arquivo (senão o gitleaks do repo bloqueia o próprio teste), mas em runtime o
// render recebe o valor completo e DEVE recusar.
test('no-leak: segredo fake na fonte → render RECUSA com a linha da fonte', () => {
  const secret = 'sk_' + 'live_' + 'FAKE1234567890abcd';
  const src = '<!-- m4nual: lang=en -->\n# T\n\nToken: ' + secret + '\n';
  throwsWith(() => renderManual(src, { now: NOW }), /no-leak/, /:4:/, /Stripe/);
});

test('no-leak: segredo dentro de code inline também é pego', () => {
  const secret = 'gh' + 'p_' + 'FAKE0123456789abcdefghij';
  const src = '<!-- m4nual: lang=en -->\n# T\n\nUse `' + secret + '` here\n';
  throwsWith(() => renderManual(src, { now: NOW }), /no-leak/, /GitHub PAT/);
});

// ── regra de superfície (RC-5) ───────────────────────────────────────────────
test('superfície: recusa /public/', () => {
  throwsWith(() => checkSurface('/Users/x/site/public/manual.html'), /surface/, /public/);
});

test('superfície: recusa /dist/, /build/, /content/, /static/', () => {
  for (const d of ['dist', 'build', 'content', 'static']) {
    throwsWith(() => checkSurface(`/Users/x/${d}/manual.html`), /surface/, new RegExp(d));
  }
});

test('superfície: aceita docs/', () => {
  assert.equal(checkSurface('/Users/x/repo/docs/manual.html'), true);
});

// ── --standalone sem a lib vendorizada → erro honesto (nunca baixa) ──────────
test('standalone: sem vendor/mermaid.min.js → erro com instruções', () => {
  throwsWith(
    () => renderManual('<!-- m4nual: lang=en -->\n# T\n\nHi.\n', { now: NOW, standalone: true }),
    /standalone/, /mermaid/, /cdn\.jsdelivr\.net/
  );
});
