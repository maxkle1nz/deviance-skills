#!/usr/bin/env node
// render.mjs — compilador da projeção HTML humana do MANUAL (skill /m4nual).
//
// Node ZERO-DEP (só builtins node:). Uso:
//   node render.mjs <MANUAL.md> [saida.html] [--standalone] [--lang XX] [--selftest]
//
// FILOSOFIA (PRD.md, RC-4): o gerador é o ENFORCEMENT de um DIALETO FECHADO —
// não um parser de markdown genérico. Ele aceita SÓ a lista fechada abaixo e
// RECUSA com erro (arquivo:linha + construção) qualquer coisa fora dela.
//
// DIALETO FECHADO (a lista exaustiva do que é suportado):
//   - headings ATX  #  ##  ###  ####   (h1..h4; h5+ = erro; setext === / --- = erro)
//   - tabelas pipe  | a | b |  com linha separadora | --- | --- |
//   - fenced code   ```lang ... ```     (inclui ```mermaid)
//   - listas        -  *  +  1.         (1 nível de nesting; >1 = erro)
//   - blockquote    > ...
//   - links inline  [texto](url)        (schema javascript:/data:/vbscript: = erro)
//   - bold **x**  ·  itálico *x*  ·  code inline `x`
//   - régua horizontal  ---  (ou ***  ___), sempre em linha própria após linha vazia
//   - parágrafos
//   - MARCADORES de controle m4nual (canal sancionado; TODO outro HTML = erro):
//       <!-- m4nual: lang=XX version=N -->     (idioma da UI + versão)
//       <!-- m4nual:mirror date=YYYY-MM-DD commit=SHORT -->   (carimbo do espelho)
//       <!-- m4nual:section id=slug -->        (id estável, opcional, p/ a próxima H2)
//
// QUALQUER outra construção (imagem ![](), footnote [^], HTML inline <tag>, task
// list - [ ], heading setext, fence não fechado, nesting >1) → ERRO fail-loud.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Diretório da skill (…/m4nual), a partir de …/m4nual/bin/render.mjs
const SKILL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Arquivo-fonte corrente, usado só para o prefixo de erro "arquivo:linha".
// Módulo single-thread no Node: seguro como variável de escopo de módulo.
let CURRENT_FILE = 'MANUAL.md';

// ─────────────────────────────────────────────────────────────────────────────
// Dicionário de strings de UI do HTML. UNIVERSAL: default/fallback = 'en' (neutro).
// O idioma vem do marcador <!-- m4nual: lang=XX --> na fonte, nunca hardcoded.
// ─────────────────────────────────────────────────────────────────────────────
const I18N = {
  en: {
    tocTitle: 'Contents',
    search: 'Search the manual…',
    copy: 'copy',
    copied: 'copied ✓',
    themeToggle: 'Toggle theme',
    stampVerified: 'Mirror verified',
    stampFresh: 'fresh',
    stampStale: 'suspect (>30 days)',
    stampMissing: 'mirror not verified',
    mermaidLabel: 'map (mermaid)',
    generatedNote: 'Generated from',
    doNotEdit: 'do not edit by hand',
    noResults: 'No results',
    untitled: 'MANUAL',
  },
  pt: {
    tocTitle: 'Índice',
    search: 'Buscar no manual…',
    copy: 'copiar',
    copied: 'copiado ✓',
    themeToggle: 'Alternar tema',
    stampVerified: 'Espelho verificado',
    stampFresh: 'fresco',
    stampStale: 'suspeito (>30 dias)',
    stampMissing: 'espelho não verificado',
    mermaidLabel: 'mapa (mermaid)',
    generatedNote: 'Gerado de',
    doNotEdit: 'não editar à mão',
    noResults: 'Nenhum resultado',
    untitled: 'MANUAL',
  },
  it: {
    tocTitle: 'Indice',
    search: 'Cerca nel manuale…',
    copy: 'copia',
    copied: 'copiato ✓',
    themeToggle: 'Cambia tema',
    stampVerified: 'Specchio verificato',
    stampFresh: 'fresco',
    stampStale: 'sospetto (>30 giorni)',
    stampMissing: 'specchio non verificato',
    mermaidLabel: 'mappa (mermaid)',
    generatedNote: 'Generato da',
    doNotEdit: 'non modificare a mano',
    noResults: 'Nessun risultato',
    untitled: 'MANUAL',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Padrões de segredo (estilo gitleaks) para o no-leak bloqueante (lei 5).
// ─────────────────────────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { name: 'Stripe live key (sk_live_)', src: 'sk_live_[A-Za-z0-9]{8,}' },
  { name: 'Anthropic key (sk-ant-)', src: 'sk-ant-[A-Za-z0-9_-]{8,}' },
  { name: 'GitHub PAT (ghp_)', src: 'ghp_[A-Za-z0-9]{20,}' },
  { name: 'GitHub fine-grained PAT (github_pat_)', src: 'github_pat_[A-Za-z0-9_]{20,}' },
  { name: 'AWS access key (AKIA)', src: 'AKIA[0-9A-Z]{16}' },
  { name: 'Postgres URL with password', src: 'postgres(?:ql)?:\\/\\/[^\\s:/@]+:[^\\s@]+@' },
  { name: 'Bearer token', src: 'Bearer\\s+[A-Za-z0-9._~+/=-]{20,}' },
  { name: 'PEM private key', src: '-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----' },
  { name: 'Slack token (xox)', src: 'xox[baprs]-[A-Za-z0-9-]{10,}' },
];

// Segmentos de caminho servido/público onde a saída NÃO pode ser gravada (RC-5).
const SERVED_DIRS = ['public', 'dist', 'build', 'content', 'static'];

// Reconhece uma LINHA que é um marcador de controle m4nual (canal sancionado).
const MARKER_LINE_RE = /^\s*<!--\s*m4nual\b[\s\S]*?-->\s*$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de erro e de escape.
// ─────────────────────────────────────────────────────────────────────────────
function err(line, msg) {
  return new Error(`${CURRENT_FILE}:${line}: ${msg}`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// slug ASCII-estável para ids (remove acentos, minúsculas, hifeniza).
function slug(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sez';
}

// ─────────────────────────────────────────────────────────────────────────────
// Marcadores de controle: idioma, versão, carimbo do espelho (neutros, greppable).
// ─────────────────────────────────────────────────────────────────────────────
function parseLangMarker(source) {
  const m = /<!--\s*m4nual:?\s*[^>]*?\blang=([a-zA-Z][a-zA-Z-]*)/i.exec(source);
  return m ? m[1].toLowerCase().split('-')[0] : null;
}

// Carimbo do espelho a partir do MARCADOR neutro (a linha visível é só apresentação).
function extractMirror(source) {
  const m = /<!--\s*m4nual:mirror\b([^>]*)-->/i.exec(source);
  if (!m) return null;
  const body = m[1];
  const d = /\bdate=(\d{4}-\d{2}-\d{2})/.exec(body);
  const c = /\bcommit=([A-Za-z0-9._-]+)/.exec(body);
  if (!d) return null;
  return { date: d[1], commit: c ? c[1] : '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificação inline fail-loud: recusa construções fora do dialeto.
// Recebe o texto CRU; remove os spans de código inline antes de checar (o que
// está entre `crases` é literal e não conta como HTML/imagem).
// ─────────────────────────────────────────────────────────────────────────────
function stripInlineCode(text) {
  return text.replace(/`[^`]*`/g, ' ');
}

function checkInline(text, line) {
  const t = stripInlineCode(text);
  if (/!\[/.test(t)) {
    throw err(line, 'inline image (![…](…)) is not part of the MANUAL dialect (manuals point to where things live, they do not embed images)');
  }
  if (/\[\^/.test(t)) {
    throw err(line, 'footnote ([^…]) is not supported by the dialect');
  }
  // HTML inline proibido — EXCETO os marcadores de controle m4nual, tratados
  // como linha inteira antes de chegar aqui.
  if (/<!--/.test(t) || /<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^<>]*)?\/?>/.test(t)) {
    throw err(line, 'inline HTML is not supported by the dialect; use the allowed markdown or `code`');
  }
  // Links com esquema perigoso.
  const lre = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = lre.exec(t))) {
    if (/^\s*(javascript|vbscript|data):/i.test(m[1])) {
      throw err(line, `disallowed link URL (scheme ${m[1].trim().split(':')[0]}:)`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderização inline: bold, itálico, code, links. O texto já passou por
// checkInline no tokenize, então aqui só escapamos e aplicamos os 4 construtos.
// ─────────────────────────────────────────────────────────────────────────────
function splitByCode(text) {
  const parts = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '`') {
      const j = text.indexOf('`', i + 1);
      if (j === -1) { parts.push({ code: false, v: text.slice(i) }); break; }
      parts.push({ code: true, v: text.slice(i + 1, j) });
      i = j + 1;
    } else {
      let k = text.indexOf('`', i);
      if (k === -1) k = text.length;
      parts.push({ code: false, v: text.slice(i, k) });
      i = k;
    }
  }
  return parts;
}

function applyEmphasis(s) {
  // bold primeiro (consome os pares **), depois os * simples restantes = itálico.
  return s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderInlineNoCode(t) {
  const escaped = escapeHtml(t); // brackets/parens/asteriscos preservados
  let out = '';
  let last = 0;
  const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(escaped))) {
    out += applyEmphasis(escaped.slice(last, m.index));
    const url = m[2].trim();
    out += `<a href="${url}" rel="noopener">${applyEmphasis(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  out += applyEmphasis(escaped.slice(last));
  return out;
}

function renderInline(text) {
  let out = '';
  for (const p of splitByCode(String(text))) {
    if (p.code) out += `<code>${escapeHtml(p.v)}</code>`;
    else out += renderInlineNoCode(p.v);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades de tabela.
// ─────────────────────────────────────────────────────────────────────────────
function isTableSep(line) {
  const s = line.trim();
  if (!s.includes('-')) return false;
  const body = s.replace(/^\|/, '').replace(/\|$/, '');
  const cells = body.split('|');
  return cells.length >= 1 && cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
}

function splitRow(line) {
  let s = line.trim();
  s = s.replace(/^\|/, '').replace(/\|$/, '');
  return s.split('|').map((c) => c.trim());
}

function parseAlign(sep) {
  const s = sep.trim().replace(/^\|/, '').replace(/\|$/, '');
  return s.split('|').map((c) => {
    c = c.trim();
    const l = c.startsWith(':');
    const r = c.endsWith(':');
    if (l && r) return 'center';
    if (r) return 'right';
    if (l) return 'left';
    return 'none';
  });
}

function isBlockStart(line) {
  return /^(#{1,6}\s|```|>\s?|\s*([-*+]|\d+\.)\s+|(-{3,}|\*{3,}|_{3,})\s*$)/.test(line);
}

// ─────────────────────────────────────────────────────────────────────────────
// Listas com no máximo 1 nível de nesting (pilha de profundidade ≤ 2).
// ─────────────────────────────────────────────────────────────────────────────
function buildList(listLines) {
  const root = { children: [] };
  const stack = [{ indent: -1, node: root }];
  for (const { raw, line } of listLines) {
    const m = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(raw);
    const indent = m[1].replace(/\t/g, '  ').length;
    const ordered = /\d+\./.test(m[2]);
    const content = m[3];
    if (/^\[[ xX]\]/.test(content)) {
      throw err(line, 'task list (- [ ]) is not supported by the dialect');
    }
    checkInline(content, line);
    const item = { ordered, content, line, children: [] };
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    // stack.length: 1 = raiz (item nível 0), 2 = dentro de item nível 0 (nível 1 ok),
    // 3+ = tentando um 2º nível de nesting → proibido.
    if (stack.length >= 3) {
      throw err(line, 'more than one nesting level is not supported by the dialect (max 1)');
    }
    stack[stack.length - 1].node.children.push(item);
    stack.push({ indent, node: item });
  }
  return { kind: 'list', roots: root.children };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOKENIZE — o coração do dialeto fechado. Linha-a-linha, com pequeno estado.
// ─────────────────────────────────────────────────────────────────────────────
function tokenize(source) {
  const lines = source.split(/\r?\n/);
  const tokens = [];
  let para = [];
  let pendingSectionId = null; // id opcional para a próxima H2 (marcador de seção)

  const flush = () => {
    if (para.length) {
      tokens.push({ kind: 'p', text: para.map((p) => p.text).join(' '), line: para[0].line });
      para = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const lineNo = i + 1;

    // Marcador de controle m4nual (linha inteira): consumido, nunca renderizado.
    if (MARKER_LINE_RE.test(line)) {
      const sm = /<!--\s*m4nual:section\b([^>]*)-->/i.exec(line);
      if (sm) {
        const idm = /\bid=([A-Za-z0-9_-]+)/.exec(sm[1]);
        if (idm) pendingSectionId = idm[1];
      }
      i++;
      continue;
    }

    // Fenced code block.
    let m = /^```(.*)$/.exec(line);
    if (m) {
      flush();
      const info = m[1].trim();
      const lang = info.split(/\s+/)[0] || '';
      const content = [];
      let closed = false;
      i++;
      while (i < lines.length) {
        if (/^```\s*$/.test(lines[i])) { closed = true; i++; break; }
        content.push(lines[i]);
        i++;
      }
      if (!closed) throw err(lineNo, 'unclosed code block (missing closing ```)');
      if (lang.toLowerCase() === 'mermaid') tokens.push({ kind: 'mermaid', content: content.join('\n') });
      else tokens.push({ kind: 'code', lang, content: content.join('\n') });
      continue;
    }

    // Linha vazia: fecha parágrafo.
    if (/^\s*$/.test(line)) { flush(); i++; continue; }

    // Heading ATX.
    m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      const level = m[1].length;
      if (level > 4) {
        flush();
        throw err(lineNo, `heading h${level} is not supported: the dialect stops at #### (h4)`);
      }
      flush();
      const text = m[2].replace(/\s+#+\s*$/, '').trim();
      checkInline(text, lineNo);
      const tok = { kind: 'heading', level, text, line: lineNo, sectionId: level === 2 ? pendingSectionId : null };
      tokens.push(tok);
      if (level === 2) pendingSectionId = null;
      i++;
      continue;
    }

    // Setext === (sempre erro se sob texto; isolado = texto literal).
    if (/^=+\s*$/.test(line)) {
      if (para.length) throw err(lineNo, 'setext-style heading (=== under text) is not supported; use # or ##');
      para.push({ text: line, line: lineNo });
      i++;
      continue;
    }

    // Régua horizontal OU setext --- (--- sob texto = erro; após vazio = régua).
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      if (para.length) {
        if (/^-{3,}\s*$/.test(line)) {
          throw err(lineNo, 'setext-style heading (--- under text) is not supported; use # or ##. For a horizontal rule leave a blank line before ---');
        }
        flush();
        tokens.push({ kind: 'hr' });
        i++;
        continue;
      }
      flush();
      tokens.push({ kind: 'hr' });
      i++;
      continue;
    }

    // Blockquote.
    if (/^>\s?/.test(line)) {
      flush();
      const qlines = [];
      const startNo = lineNo;
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        const c = lines[i].replace(/^>\s?/, '');
        checkInline(c, i + 1);
        qlines.push(c);
        i++;
      }
      tokens.push({ kind: 'blockquote', lines: qlines, line: startNo });
      continue;
    }

    // Tabela pipe (esta linha + próxima é separadora).
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flush();
      const header = splitRow(line);
      header.forEach((c) => checkInline(c, lineNo));
      const align = parseAlign(lines[i + 1]);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && !/^\s*$/.test(lines[i]) && !isBlockStart(lines[i])) {
        const r = splitRow(lines[i]);
        r.forEach((c) => checkInline(c, i + 1));
        rows.push(r);
        i++;
      }
      tokens.push({ kind: 'table', header, align, rows, line: lineNo });
      continue;
    }

    // Lista.
    if (/^(\s*)([-*+]|\d+\.)\s+/.test(line)) {
      flush();
      const listLines = [];
      while (i < lines.length && /^(\s*)([-*+]|\d+\.)\s+/.test(lines[i])) {
        listLines.push({ raw: lines[i], line: i + 1 });
        i++;
      }
      tokens.push(buildList(listLines));
      continue;
    }

    // Parágrafo: valida construtos proibidos ANTES de acumular.
    checkInline(line, lineNo);
    para.push({ text: line, line: lineNo });
    i++;
  }
  flush();
  return tokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderizadores de bloco.
// ─────────────────────────────────────────────────────────────────────────────
function renderCode(t, L) {
  const lang = t.lang || '';
  const langLabel = lang || 'text';
  const codeClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
  return `<div class="codeblock"><div class="cb-bar"><span class="cb-lang">${escapeHtml(langLabel)}</span>` +
    `<button class="copy-btn" type="button" data-copied="${escapeHtml(L.copied)}">${escapeHtml(L.copy)}</button></div>` +
    `<pre><code${codeClass}>${escapeHtml(t.content)}</code></pre></div>`;
}

function renderMermaid(t, L) {
  return `<figure class="mermaid-fig"><figcaption>${escapeHtml(L.mermaidLabel)}</figcaption>` +
    `<div class="codeblock"><div class="cb-bar"><span class="cb-lang">mermaid</span>` +
    `<button class="copy-btn" type="button" data-copied="${escapeHtml(L.copied)}">${escapeHtml(L.copy)}</button></div>` +
    `<pre class="mermaid">${escapeHtml(t.content)}</pre></div></figure>`;
}

function renderTable(t) {
  const cols = t.header.length;
  const alignAttr = (i) => {
    const a = t.align[i] || 'none';
    return a === 'none' ? '' : ` style="text-align:${a}"`;
  };
  let h = '<div class="table-wrap"><table><thead><tr>';
  t.header.forEach((c, i) => { h += `<th${alignAttr(i)}>${renderInline(c)}</th>`; });
  h += '</tr></thead><tbody>';
  t.rows.forEach((r) => {
    h += '<tr>';
    for (let i = 0; i < cols; i++) h += `<td${alignAttr(i)}>${renderInline(r[i] || '')}</td>`;
    h += '</tr>';
  });
  h += '</tbody></table></div>';
  return h;
}

function renderItems(items) {
  if (!items.length) return '';
  const tag = items[0].ordered ? 'ol' : 'ul';
  let h = `<${tag}>`;
  for (const it of items) h += `<li>${renderInline(it.content)}${renderItems(it.children)}</li>`;
  h += `</${tag}>`;
  return h;
}

function renderBlockquote(lines) {
  const text = lines.join(' ').trim();
  let cls = '';
  if (/^⚠/.test(text)) cls = ' class="callout-warn"';
  else if (/^✓/.test(text)) cls = ' class="callout-ok"';
  return `<blockquote${cls}>${renderInline(text)}</blockquote>`;
}

// Banner do carimbo, calculado do MARCADOR neutro (verde ≤30d / âmbar / cinza).
function bannerHtml(mirror, now, L) {
  let cls;
  let state;
  let meta = '';
  if (!mirror) {
    cls = 'gray';
    state = L.stampMissing;
  } else {
    const d = new Date(mirror.date + 'T00:00:00Z');
    if (isNaN(d.getTime())) {
      cls = 'gray';
      state = L.stampMissing;
    } else {
      const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
      meta = mirror.commit ? `${mirror.date} · ${mirror.commit}` : mirror.date;
      if (days <= 30) { cls = 'green'; state = L.stampFresh; }
      else { cls = 'amber'; state = L.stampStale; }
    }
  }
  const label = cls === 'gray' ? '' : `<span class="stamp-label">${escapeHtml(L.stampVerified)}</span>`;
  const metaHtml = meta ? `<span class="stamp-meta">${escapeHtml(meta)}</span>` : '';
  return `<div class="stamp stamp-${cls}"><span class="stamp-dot" aria-hidden="true"></span>${label}` +
    `<span class="stamp-state">${escapeHtml(state)}</span>${metaHtml}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// no-leak bloqueante: varre o HTML GERADO; se achar, localiza a linha da FONTE.
// ─────────────────────────────────────────────────────────────────────────────
function scanSecretsOrThrow(html, source) {
  for (const p of SECRET_PATTERNS) {
    if (new RegExp(p.src).test(html)) {
      const lines = source.split(/\r?\n/);
      let ln = 0;
      for (let i = 0; i < lines.length; i++) {
        if (new RegExp(p.src).test(lines[i])) { ln = i + 1; break; }
      }
      throw new Error(
        `${CURRENT_FILE}${ln ? ':' + ln : ''}: no-leak — possible secret (${p.name}) detected` +
        `${ln ? ' at source line ' + ln : ' in generated output'}. Render ABORTED: the MANUAL must point to WHERE a ` +
        `credential lives (Keychain item / Fly secret / env), never the value. Remove the value from the source.`
      );
    }
  }
}

// Regra de superfície (RC-5): recusa gravar em caminho servido/público.
function checkSurface(outPath) {
  const resolved = path.resolve(outPath);
  const segs = resolved.toLowerCase().split(path.sep);
  for (const b of SERVED_DIRS) {
    if (segs.includes(b)) {
      throw new Error(
        `disallowed surface: output path contains "/${b}/" (${resolved}). The MANUAL must not be emitted into a ` +
        `served/public directory (RC-5). Choose a non-served path (e.g. docs/) or explicitly declare a sanctioned ` +
        `third projection with an access tier.`
      );
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS e JS embutidos (self-contained). Calmo, pastel, humano — anti-HUD/neon.
// Uma única cor de acento (verde-sálvia dessaturado). Tema claro + escuro.
// ─────────────────────────────────────────────────────────────────────────────
const STYLE = `
:root{
  --bg:#faf9f6; --surface:#ffffff; --surface-2:#f3f1ec; --text:#2e2b27; --muted:#6b6560;
  --border:#e6e1d8; --accent:#4f7d6a; --accent-soft:#eaf1ed; --code-bg:#f5f2ec; --code-text:#3a352f;
  --shadow:0 1px 2px rgba(40,36,30,.05),0 6px 20px rgba(40,36,30,.05);
  --g-bg:#e8f1ea; --g-tx:#2f5f47; --g-bd:#bcd8c8;
  --a-bg:#f7efdd; --a-tx:#7a5a1e; --a-bd:#e6d4a8;
  --n-bg:#eeece8; --n-tx:#5f5a54; --n-bd:#dcd7cf;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#1b1a18; --surface:#24221f; --surface-2:#201f1c; --text:#e8e4dd; --muted:#a49e95;
    --border:#35322d; --accent:#7fb79e; --accent-soft:#26302b; --code-bg:#201f1c; --code-text:#d7d2c9;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.28);
    --g-bg:#1f3128; --g-tx:#9fd3b7; --g-bd:#2f4b3c;
    --a-bg:#33291a; --a-tx:#e0c48a; --a-bd:#4c3d24;
    --n-bg:#2a2824; --n-tx:#b0aaa1; --n-bd:#3a372f;
  }
}
:root[data-theme="light"]{
  --bg:#faf9f6; --surface:#ffffff; --surface-2:#f3f1ec; --text:#2e2b27; --muted:#6b6560;
  --border:#e6e1d8; --accent:#4f7d6a; --accent-soft:#eaf1ed; --code-bg:#f5f2ec; --code-text:#3a352f;
  --shadow:0 1px 2px rgba(40,36,30,.05),0 6px 20px rgba(40,36,30,.05);
  --g-bg:#e8f1ea; --g-tx:#2f5f47; --g-bd:#bcd8c8;
  --a-bg:#f7efdd; --a-tx:#7a5a1e; --a-bd:#e6d4a8;
  --n-bg:#eeece8; --n-tx:#5f5a54; --n-bd:#dcd7cf;
}
:root[data-theme="dark"]{
  --bg:#1b1a18; --surface:#24221f; --surface-2:#201f1c; --text:#e8e4dd; --muted:#a49e95;
  --border:#35322d; --accent:#7fb79e; --accent-soft:#26302b; --code-bg:#201f1c; --code-text:#d7d2c9;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.28);
  --g-bg:#1f3128; --g-tx:#9fd3b7; --g-bd:#2f4b3c;
  --a-bg:#33291a; --a-tx:#e0c48a; --a-bd:#4c3d24;
  --n-bg:#2a2824; --n-tx:#b0aaa1; --n-bd:#3a372f;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--sans);
  font-size:16px;line-height:1.62;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code{font-family:var(--mono);font-size:.9em;background:var(--code-bg);color:var(--code-text);
  padding:.12em .38em;border-radius:5px}
.topbar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);
  backdrop-filter:saturate(1.1) blur(8px);border-bottom:1px solid var(--border)}
.topbar-in{max-width:1180px;margin:0 auto;padding:14px 22px;display:flex;gap:18px;
  align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
.title-wrap{display:flex;flex-direction:column;gap:8px;min-width:0}
.doc-title{margin:0;font-size:1.32rem;font-weight:650;letter-spacing:-.01em}
.tools{display:flex;gap:10px;align-items:center}
.search{font:inherit;font-size:.92rem;padding:8px 12px;border:1px solid var(--border);
  border-radius:9px;background:var(--surface);color:var(--text);min-width:min(46vw,240px)}
.search:focus{outline:2px solid var(--accent-soft);border-color:var(--accent)}
.theme-toggle{font-size:1.05rem;width:38px;height:38px;border:1px solid var(--border);
  border-radius:9px;background:var(--surface);color:var(--text);cursor:pointer}
.theme-toggle:hover{border-color:var(--accent)}
.stamp{display:inline-flex;align-items:center;gap:9px;font-size:.82rem;padding:5px 12px;
  border-radius:999px;border:1px solid var(--n-bd);background:var(--n-bg);color:var(--n-tx);width:fit-content}
.stamp-dot{width:8px;height:8px;border-radius:50%;background:currentColor;opacity:.8}
.stamp-label{font-weight:600}
.stamp-meta{font-family:var(--mono);opacity:.82;font-size:.78rem}
.stamp-green{background:var(--g-bg);color:var(--g-tx);border-color:var(--g-bd)}
.stamp-amber{background:var(--a-bg);color:var(--a-tx);border-color:var(--a-bd)}
.stamp-gray{background:var(--n-bg);color:var(--n-tx);border-color:var(--n-bd)}
.layout{max-width:1180px;margin:0 auto;padding:26px 22px 64px;display:grid;
  grid-template-columns:250px minmax(0,1fr);gap:36px;align-items:start}
.sidebar{position:sticky;top:86px;align-self:start}
.toc-details{border:1px solid var(--border);border-radius:12px;background:var(--surface);
  box-shadow:var(--shadow);overflow:hidden}
.toc-title{cursor:pointer;padding:12px 16px;font-weight:640;font-size:.82rem;
  text-transform:uppercase;letter-spacing:.06em;color:var(--muted);list-style:none}
.toc-title::-webkit-details-marker{display:none}
.toc{padding:4px 8px 12px}
.toc ul{list-style:none;margin:0;padding:0}
.toc li{margin:1px 0}
.toc-link{display:block;padding:6px 10px;border-radius:7px;color:var(--text);
  font-size:.9rem;border-left:2px solid transparent}
.toc-link:hover{background:var(--surface-2);text-decoration:none;border-left-color:var(--accent)}
.toc-sub{margin-left:8px !important}
.toc-sub-link{font-size:.84rem;color:var(--muted)}
.content{min-width:0}
.content h2,.content h3,.content h4{letter-spacing:-.01em;line-height:1.3;scroll-margin-top:92px}
.content p{margin:.7em 0}
.content ul,.content ol{margin:.6em 0;padding-left:1.4em}
.content li{margin:.24em 0}
.section{border:1px solid var(--border);border-radius:14px;background:var(--surface);
  box-shadow:var(--shadow);margin:0 0 20px;overflow:hidden}
.sec-head{cursor:pointer;list-style:none;display:flex;align-items:center;gap:12px;
  padding:16px 20px;font-size:1.14rem;font-weight:640}
.sec-head::-webkit-details-marker{display:none}
.sec-title{flex:1;min-width:0}
.sec-chevron{color:var(--muted);transition:transform .16s ease;font-size:1.2rem}
.section[open] .sec-chevron{transform:rotate(90deg)}
.sec-body{padding:2px 20px 18px;border-top:1px solid var(--border)}
.sec-body>*:first-child{margin-top:.6em}
blockquote{margin:.9em 0;padding:.5em 1em;border-left:3px solid var(--accent);
  background:var(--accent-soft);border-radius:0 8px 8px 0;color:var(--text)}
blockquote.callout-warn{border-left-color:var(--a-tx);background:var(--a-bg);color:var(--a-tx)}
blockquote.callout-ok{border-left-color:var(--g-tx);background:var(--g-bg);color:var(--g-tx)}
hr{border:none;border-top:1px solid var(--border);margin:1.8em 0}
.table-wrap{overflow-x:auto;margin:1em 0;border:1px solid var(--border);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:.92rem}
th,td{padding:9px 14px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}
thead th{background:var(--surface-2);font-weight:620;color:var(--text)}
tbody tr:last-child td{border-bottom:none}
.codeblock{margin:1em 0;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--code-bg)}
.cb-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;
  background:var(--surface-2);border-bottom:1px solid var(--border)}
.cb-lang{font-family:var(--mono);font-size:.74rem;color:var(--muted);text-transform:lowercase;letter-spacing:.03em}
.copy-btn{font:inherit;font-size:.76rem;padding:3px 10px;border:1px solid var(--border);
  border-radius:6px;background:var(--surface);color:var(--muted);cursor:pointer}
.copy-btn:hover{border-color:var(--accent);color:var(--accent)}
pre{margin:0;padding:14px 16px;overflow-x:auto}
pre code{background:none;padding:0;font-size:.86rem;line-height:1.55;color:var(--code-text)}
pre.mermaid{white-space:pre;font-family:var(--mono);font-size:.84rem;color:var(--code-text)}
.mermaid-fig{margin:1.2em 0}
.mermaid-fig figcaption{font-size:.78rem;color:var(--muted);margin-bottom:6px;font-style:italic}
.no-results{color:var(--muted);font-style:italic;padding:20px 4px}
.foot{max-width:1180px;margin:0 auto;padding:20px 22px 40px;color:var(--muted);font-size:.82rem;
  border-top:1px solid var(--border)}
.foot code{font-size:.86em}
@media (max-width:900px){
  .layout{grid-template-columns:1fr;gap:18px}
  .sidebar{position:static}
  .toc-details:not([open]) .toc{display:none}
}
`;

// JS embutido, escrito à mão (tema, copiar, busca client-side, abrir seção-alvo).
const APP_JS = `
(function(){
  var root=document.documentElement;
  try{var saved=localStorage.getItem('m4nual-theme');if(saved)root.setAttribute('data-theme',saved);}catch(e){}
  var tbtn=document.getElementById('theme-toggle');
  if(tbtn)tbtn.addEventListener('click',function(){
    var cur=root.getAttribute('data-theme');
    var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next=cur==='dark'?'light':(cur==='light'?'dark':(prefersDark?'light':'dark'));
    root.setAttribute('data-theme',next);
    try{localStorage.setItem('m4nual-theme',next);}catch(e){}
  });
  Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'),function(btn){
    btn.addEventListener('click',function(){
      var wrap=btn.closest('.codeblock');if(!wrap)return;
      var pre=wrap.querySelector('pre');if(!pre)return;
      var txt=pre.innerText;
      function done(){var o=btn.textContent;btn.textContent=btn.getAttribute('data-copied')||'copied';
        setTimeout(function(){btn.textContent=o;},1400);}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,function(){});}
    });
  });
  var input=document.getElementById('m4-search');
  var sections=Array.prototype.slice.call(document.querySelectorAll('.section'));
  var tocItems=Array.prototype.slice.call(document.querySelectorAll('.toc-link'));
  var noRes=document.getElementById('no-results');
  if(input)input.addEventListener('input',function(){
    var q=input.value.trim().toLowerCase();var any=false;
    sections.forEach(function(sec){
      var match=!q||sec.textContent.toLowerCase().indexOf(q)>=0;
      sec.style.display=match?'':'none';
      if(match&&q)sec.open=true;
      if(match)any=true;
    });
    tocItems.forEach(function(a){
      var id=a.getAttribute('href').slice(1);var sec=document.getElementById(id);
      var li=a.parentElement;
      if(li)li.style.display=(!sec||sec.style.display!=='none')?'':'none';
    });
    if(noRes)noRes.hidden=any;
  });
  function openHash(){
    if(!location.hash)return;
    var el;try{el=document.querySelector(location.hash);}catch(e){return;}
    if(!el)return;
    if(el.tagName==='DETAILS')el.open=true;
    else{var d=el.closest('details');if(d)d.open=true;}
  }
  window.addEventListener('hashchange',openHash);openHash();
})();
`;

// Montagem do documento HTML completo (self-contained, openable localmente).
function page(o) {
  return `<!doctype html>
<html lang="${o.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(o.title)} — MANUAL</title>
<style>${STYLE}</style>
</head>
<body>
<!-- GERADO de ${escapeHtml(o.sourceLabel)} — não editar (compilado por m4nual/render.mjs) -->
<!-- m4nual:content:start -->
<header class="topbar">
  <div class="topbar-in">
    <div class="title-wrap"><h1 class="doc-title">${renderInline(o.title)}</h1>${o.banner}</div>
    <div class="tools">
      <input id="m4-search" class="search" type="search" placeholder="${escapeHtml(o.L.search)}" aria-label="${escapeHtml(o.L.search)}">
      <button id="theme-toggle" class="theme-toggle" type="button" aria-label="${escapeHtml(o.L.themeToggle)}" title="${escapeHtml(o.L.themeToggle)}">◐</button>
    </div>
  </div>
</header>
<div class="layout">
  <aside class="sidebar">
    <details class="toc-details" open>
      <summary class="toc-title">${escapeHtml(o.L.tocTitle)}</summary>
      <nav class="toc"><ul>${o.toc}</ul></nav>
    </details>
  </aside>
  <main class="content">
${o.intro}
${o.sections}
    <p id="no-results" class="no-results" hidden>${escapeHtml(o.L.noResults)}</p>
  </main>
</div>
<footer class="foot"><!-- GERADO de ${escapeHtml(o.sourceLabel)} — não editar --><span>${escapeHtml(o.L.generatedNote)} <code>${escapeHtml(o.sourceLabel)}</code> · ${escapeHtml(o.L.doNotEdit)}</span></footer>
<!-- m4nual:content:end -->
<script>${APP_JS}</script>
${o.extraScripts || ''}
</body>
</html>
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// renderManual — a função pura: fonte → HTML string (com no-leak antes de retornar).
// ─────────────────────────────────────────────────────────────────────────────
function renderManual(source, opts = {}) {
  CURRENT_FILE = opts.sourcePath || 'MANUAL.md';

  // Idioma: override CLI > marcador na fonte > 'en' (fallback universal).
  const overrideLang = opts.lang && I18N[opts.lang] ? opts.lang : null;
  const markerLang = parseLangMarker(source);
  const lang = overrideLang || (markerLang && I18N[markerLang] ? markerLang : 'en');
  const L = I18N[lang];

  const now = opts.now instanceof Date
    ? opts.now
    : (process.env.M4NUAL_NOW ? new Date(process.env.M4NUAL_NOW) : new Date());

  const tokens = tokenize(source);
  const mirror = extractMirror(source);

  // Agrupamento em seções por H2 (sem assumir NENHUM nome de seção; usa o heading
  // tal-qual e, se houver, o id do marcador de seção).
  const usedIds = new Set();
  const uniqueId = (raw) => {
    let base = raw || 'sez';
    let id = base;
    let n = 2;
    while (usedIds.has(id)) { id = base + '-' + n; n++; }
    usedIds.add(id);
    return id;
  };

  let title = null;
  const intro = [];
  const sections = [];
  let cur = null;
  for (const t of tokens) {
    if (t.kind === 'heading' && t.level === 1 && title === null) { title = t.text; continue; }
    if (t.kind === 'heading' && t.level === 2) {
      const id = t.sectionId ? uniqueId(t.sectionId) : uniqueId('sec-' + slug(t.text));
      cur = { id, title: t.text, tokens: [] };
      sections.push(cur);
      continue;
    }
    (cur ? cur.tokens : intro).push(t);
  }
  if (title === null) title = L.untitled;

  const renderTok = (t) => {
    switch (t.kind) {
      case 'heading': return `<h${t.level} id="${uniqueId('h-' + slug(t.text))}" class="h${t.level}">${renderInline(t.text)}</h${t.level}>`;
      case 'p': return `<p>${renderInline(t.text)}</p>`;
      case 'code': return renderCode(t, L);
      case 'mermaid': return renderMermaid(t, L);
      case 'table': return renderTable(t);
      case 'list': return renderItems(t.roots);
      case 'blockquote': return renderBlockquote(t.lines);
      case 'hr': return '<hr>';
      default: return '';
    }
  };

  const introHtml = intro.map(renderTok).join('\n');

  let tocHtml = '';
  let sectionsHtml = '';
  for (const sec of sections) {
    let body = '';
    const subs = [];
    for (const t of sec.tokens) {
      if (t.kind === 'heading' && t.level === 3) {
        const id = uniqueId('h-' + slug(t.text));
        subs.push({ id, text: t.text });
        body += `<h3 id="${id}" class="h3">${renderInline(t.text)}</h3>`;
      } else {
        body += renderTok(t);
      }
    }
    sectionsHtml += `<details class="section" id="${sec.id}" open>` +
      `<summary class="sec-head"><span class="sec-title">${renderInline(sec.title)}</span>` +
      `<span class="sec-chevron" aria-hidden="true">›</span></summary>` +
      `<div class="sec-body">${body}</div></details>`;
    tocHtml += `<li><a class="toc-link" href="#${sec.id}">${escapeHtml(sec.title)}</a>` +
      (subs.length
        ? `<ul class="toc-sub">${subs.map((s) => `<li><a class="toc-link toc-sub-link" href="#${s.id}">${escapeHtml(s.text)}</a></li>`).join('')}</ul>`
        : '') +
      '</li>';
  }

  // --standalone: embute a lib mermaid vendorizada (NUNCA baixa da rede).
  let extraScripts = '';
  if (opts.standalone) {
    const vendor = path.join(SKILL_DIR, 'vendor', 'mermaid.min.js');
    if (!fs.existsSync(vendor)) {
      throw new Error(
        `${CURRENT_FILE}: --standalone requires the vendored mermaid library, which is absent: ${vendor}\n` +
        `Download it once (never at runtime) from https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js ` +
        `and save it to ${vendor}. Without --standalone the diagram stays as <pre class="mermaid"> (rendered ` +
        `natively by the claude.ai Artifact).`
      );
    }
    const lib = fs.readFileSync(vendor, 'utf8');
    extraScripts = `<script>${lib}</script>\n` +
      `<script>(function(){try{var dark=document.documentElement.getAttribute('data-theme')==='dark'||` +
      `(!document.documentElement.getAttribute('data-theme')&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);` +
      `mermaid.initialize({startOnLoad:true,securityLevel:'strict',theme:dark?'dark':'neutral'});}catch(e){}})();</script>`;
  }

  const html = page({
    lang,
    title,
    banner: bannerHtml(mirror, now, L),
    toc: tocHtml,
    intro: introHtml,
    sections: sectionsHtml,
    sourceLabel: CURRENT_FILE,
    L,
    extraScripts,
  });

  if (opts.scanSecrets !== false) scanSecretsOrThrow(html, source);
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI.
// ─────────────────────────────────────────────────────────────────────────────
function printUsage() {
  process.stderr.write(
    'uso: node render.mjs <MANUAL.md> [saida.html] [--standalone] [--lang XX] [--selftest]\n' +
    '  --standalone  embute a lib mermaid vendorizada (…/m4nual/vendor/mermaid.min.js)\n' +
    '  --lang XX     força o idioma da UI (en|pt|it); default = marcador <!-- m4nual: lang=.. --> ou en\n' +
    '  --selftest    roda a suíte de testes golden (node --test) e sai 0/1\n'
  );
}

function main(argv) {
  const args = argv.slice(2);
  let input = null;
  let output = null;
  let standalone = false;
  let selftest = false;
  let langOverride = null;
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    if (a === '--standalone') standalone = true;
    else if (a === '--selftest') selftest = true;
    else if (a === '--lang') langOverride = args[++k] || null;
    else if (a.startsWith('--lang=')) langOverride = a.slice(7);
    else if (a === '-h' || a === '--help') { printUsage(); return 0; }
    else if (a.startsWith('-')) { process.stderr.write(`unknown option: ${a}\n`); printUsage(); return 2; }
    else if (input === null) input = a;
    else if (output === null) output = a;
  }

  if (selftest) {
    const r = spawnSync(process.execPath, ['--test', path.join(SKILL_DIR, 'test', 'render.test.mjs')], { stdio: 'inherit' });
    return r.status == null ? 1 : r.status;
  }

  if (!input) { printUsage(); return 2; }

  let src;
  try { src = fs.readFileSync(input, 'utf8'); }
  catch (e) { process.stderr.write(`cannot read ${input}: ${e.message}\n`); return 1; }

  if (!output) output = /\.md$/i.test(input) ? input.replace(/\.md$/i, '.html') : input + '.html';

  // Warning universal: sem marcador de idioma e sem --lang → en.
  if (!langOverride && !parseLangMarker(src)) {
    process.stderr.write(`m4nual: no <!-- m4nual: lang=.. --> marker in ${input}; defaulting UI language to 'en'\n`);
  }

  try {
    checkSurface(output);
    const html = renderManual(src, {
      sourcePath: path.basename(input),
      standalone,
      lang: langOverride,
      now: process.env.M4NUAL_NOW ? new Date(process.env.M4NUAL_NOW) : new Date(),
    });
    fs.writeFileSync(output, html);
    process.stdout.write(`✓ ${output} written (${Buffer.byteLength(html)} bytes) from ${input}\n`);
    return 0;
  } catch (e) {
    process.stderr.write(`✗ ${e.message}\n`);
    return 1;
  }
}

// Só executa o CLI quando invocado diretamente (não quando importado nos testes).
const isMain = (() => {
  try { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
  catch { return false; }
})();
if (isMain) process.exit(main(process.argv));

export {
  renderManual,
  tokenize,
  checkSurface,
  scanSecretsOrThrow,
  parseLangMarker,
  extractMirror,
  I18N,
};
