# m4nual/bin — the human-projection generator

`render.mjs` compiles a `MANUAL.md` (the closed dialect) into one self-contained,
interactive HTML file. **Zero npm deps** (only `node:` builtins) and **zero network
at runtime**.

## Run

```bash
# MANUAL.md → MANUAL.html (same folder)
node ~/.claude/skills/m4nual/bin/render.mjs docs/MANUAL.md

# explicit output
node ~/.claude/skills/m4nual/bin/render.mjs docs/MANUAL.md docs/manual.html

# force the UI language (default: read from the source marker, else 'en')
node ~/.claude/skills/m4nual/bin/render.mjs docs/MANUAL.md --lang pt

# embed the mermaid library for a fully offline diagram (see below)
node ~/.claude/skills/m4nual/bin/render.mjs docs/MANUAL.md --standalone

# run the golden/error test suite (exit 0/1)
node ~/.claude/skills/m4nual/bin/render.mjs --selftest
```

## The closed dialect (what the source may contain)

Headings `#`..`####` · pipe tables · fenced code ```` ```lang ```` (incl.
```` ```mermaid ````) · lists `- * +` / `1.` (**1 nesting level**) · blockquote `>`
· inline links `[t](u)` · `**bold**` · `*italic*` · `` `code` `` · horizontal rule
`---` · paragraphs · and the **m4nual control markers**:

```
<!-- m4nual: lang=en version=1 -->               UI language + manual version
<!-- m4nual:mirror date=2026-07-18 commit=abc1234 -->   mirror stamp (banner source)
<!-- m4nual:section id=infra -->                 stable English id for the next H2
```

Anything else — inline image `![]()`, footnote `[^]`, raw inline HTML `<tag>`, task
list `- [ ]`, setext heading, unclosed fence, deeper nesting — is **rejected with
`file:line`**. The generator is the enforcement, not a generic markdown parser.

## Language & stamp are language-neutral by design

- The UI strings come from a dictionary (`en` / `pt` / `it`; **default & fallback =
  `en`**). The manual declares its language in the `lang=` marker; no marker → `en`
  plus a stderr warning.
- The green/amber/gray **mirror banner is computed from the neutral
  `<!-- m4nual:mirror … -->` marker**, never from a visible phrase. A visible line
  like `> Mirror verified: …` (or in any language) is presentation only.
- Sections are grouped by H2 **as written**, in any language. The optional
  `section id=` marker only supplies a stable English anchor id.

## Safety gates (blocking)

- **no-leak**: the generated HTML is scanned for secret patterns (Stripe/Anthropic
  keys, GitHub PATs, AWS keys, Postgres URLs with a password, Bearer tokens, PEM
  private keys, Slack tokens). A hit **aborts the render** and reports the source
  line. The MANUAL points to *where* a credential lives, never the value.
- **surface rule**: the render **refuses** to write into a served/public path
  (`/public/`, `/dist/`, `/build/`, `/content/`, `/static/`).

## `--standalone` (offline mermaid)

By default a `` ```mermaid `` block is emitted as `<pre class="mermaid">` — the
claude.ai Artifact renders it natively, and the raw MD stays the resilient path for
incidents. `--standalone` embeds the mermaid library so the local `.html` renders
the diagram with no network. The library is **never downloaded at runtime**; you
vendor it once:

```bash
mkdir -p ~/.claude/skills/m4nual/vendor
curl -fsSL https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js \
  -o ~/.claude/skills/m4nual/vendor/mermaid.min.js
```

If the file is absent, `--standalone` fails with these exact instructions instead
of touching the network.

## Regenerate the golden fixture

The test compares only the normalized **content region** (between the
`<!-- m4nual:content:start/end -->` sentinels), so CSS/JS tweaks don't flake it.
After an **intentional** change to the content structure, regenerate:

```bash
cd ~/.claude/skills/m4nual
node --input-type=module -e "import {renderManual} from './bin/render.mjs'; \
  import fs from 'node:fs'; \
  fs.writeFileSync('test/fixtures/minimal.html', \
    renderManual(fs.readFileSync('test/fixtures/minimal.md','utf8'), \
    {sourcePath:'minimal.md', now:new Date('2026-07-18T12:00:00Z')}));"
node bin/render.mjs --selftest   # confirm green
```

## After a Node upgrade

This is the only guardian of a user-scope generator between Node versions — run
`node bin/render.mjs --selftest` after any Node upgrade to catch a break before you
discover it with a broken manual in hand.
