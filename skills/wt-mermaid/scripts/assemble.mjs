#!/usr/bin/env node
/**
 * wt-mermaid assembler
 *
 * Builds a standalone, self-contained Mermaid HTML page by filling the component
 * templates in ../references/components/ with the contents of a JSON spec.
 *
 * Usage:
 *   node scripts/assemble.mjs < spec.json
 *   node scripts/assemble.mjs --in spec.json
 *   node scripts/assemble.mjs < spec.json --out - --force
 *
 * Options:
 *   --in <file>, -i   read the spec from a file instead of stdin
 *   --out <path>, -o  write the HTML here; "-" writes to stdout; default
 *                     work-together/diagrams/<slug>.html
 *   --force, -f       overwrite an existing output file
 *   --strict          treat warnings as errors (writes nothing)
 *   --help, -h        print this help
 *
 * PowerShell note: set $OutputEncoding to UTF-8 before piping, otherwise
 * non-ASCII text is mangled; or use --in <file> which always reads UTF-8.
 *
 * Input (stdin or --in file): a JSON spec, see SPEC below.
 * Output: work-together/diagrams/<slug>.html (relative to the current directory)
 *         unless --out is given.
 *
 * Exit codes: 0 ok, 1 invalid input/spec, 2 output exists (pass --force), 3 internal error.
 *
 * SPEC
 * {
 *   "slug": "order-flow",            // required (unless --out is used)
 *   "lang": "vi",                    // default "en"
 *   "title": "Order Flow",           // page <title> + page header
 *   "page_title": "Order Flow",      // optional, overrides the <title> tag only
 *   "description": "Payment path",   // optional
 *   "created_date": "2026-10-08",    // optional, default today
 *   "out": "some/path.html",         // optional
 *   "diagrams": [                    // 1..n diagrams, each rendered as a card
 *     {
 *       "id": "checkout",            // required, kebab-case, unique
 *       "title": "Checkout flow",    // required
 *       "caption": "Happy path",     // optional
 *       "mermaid": "flowchart TD\n...",   // required
 *       "legend": [ { "color": "#dbeafe", "symbol": ":::primary", "meaning": "entry point" } ],
 *       "component_notes": [ { "target_node_id": "cart", "component_name": "Cart", "note_content": "<p>...</p>" } ],
 *       "notes_html": "<p>...</p>"
 *     }
 *   ]
 * }
 *
 * Note: the TOC is included only when there are 2 or more diagrams.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPONENTS_DIR = resolve(HERE, '..', 'references', 'components');
const DEFAULT_OUT_DIR = 'work-together/diagrams';

const SUPPORTED_TYPES = [
  'flowchart',
  'graph',
  'sequenceDiagram',
  'classDiagram',
  'stateDiagram',
  'stateDiagram-v2',
  'erDiagram',
];

// Semantic HTML subset allowed in {{notes_html}} and {{note_content}}.
const ALLOWED_TEXT_TAGS = new Set(['p', 'ul', 'ol', 'li', 'code', 'strong', 'em']);

/** Placeholders each component is allowed to declare. */
const COMPONENT_PLACEHOLDERS = {
  'shell.html': ['lang', 'page_title'],
  'header.html': ['title', 'description', 'created_date', 'diagram_count'],
  'toc.html': [],
  'toc-item.html': ['diagram_id', 'diagram_title'],
  'diagram-card.html': ['diagram_id', 'diagram_title', 'caption', 'mermaid_code'],
  'legend.html': [],
  'legend-item.html': ['color', 'symbol', 'meaning'],
  'component-notes.html': [],
  'component-note-item.html': ['target_node_id', 'component_name', 'note_content'],
  'notes.html': ['notes_html'],
};

const KNOWN_SLOTS = new Set([
  'HEADER',
  'TOC',
  'CONTENT',
  'TOC_ITEMS',
  'LEGEND',
  'LEGEND_ITEMS',
  'COMPONENT_NOTES',
  'COMPONENT_NOTE_ITEMS',
  'NOTES',
]);

const KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TARGET_ID = /^[A-Za-z0-9_.-]+$/;
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const NAMED_COLOR = /^[a-zA-Z]{3,20}$/;
const SENTINEL = (i) => `\u0000WT:CODE:${i}\u0000`;

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

/* ------------------------------------------------------------------ CLI --- */

function usage() {
  const self = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
  const body = [];
  for (const line of self.slice(2)) {
    if (line.trim().startsWith('*/')) break;
    body.push(line.replace(/^ \* ?/, ''));
  }
  return body.join('\n').trim();
}

function parseArgs(argv) {
  const args = { out: null, in: null, force: false, help: false, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--force' || a === '-f') args.force = true;
    else if (a === '--strict') args.strict = true;
    else if (a === '--out' || a === '-o') args.out = argv[++i] ?? null;
    else if (a === '--in' || a === '-i') args.in = argv[++i] ?? null;
    else if (a.startsWith('--')) fail(`Unknown option: ${a}`);
    else if (!args.in) args.in = a;
    else fail(`Unexpected argument: ${a}`);
  }
  return args;
}

function readInput(args) {
  if (args.in) {
    const p = resolve(process.cwd(), args.in);
    if (!existsSync(p)) {
      console.error(`error: input file not found: ${p}`);
      process.exit(1);
    }
    return readFileSync(p, 'utf8');
  }
  if (process.stdin.isTTY) {
    console.error('error: no input. Pipe a JSON spec to stdin or pass --in <file>. See --help.');
    process.exit(1);
  }
  // Read stdin as UTF-8 (BOM stripped below); also survives PowerShell piping.
  return readFileSync(0, 'utf8');
}

/* ----------------------------------------------------------- components --- */

function component(name) {
  const p = join(COMPONENTS_DIR, name);
  if (!existsSync(p)) {
    console.error(`error: missing component file: ${p}`);
    process.exit(3);
  }
  const tpl = readFileSync(p, 'utf8');
  checkTemplate(name, tpl);
  return tpl;
}

/**
 * Guard the component templates themselves: every {{token}} they declare must be
 * one this script knows how to fill. Content is never scanned this way, because
 * diagram sources legitimately contain braces (Mermaid hexagons, e.g. {{Event Bus}}).
 */
function checkTemplate(name, tpl) {
  const known = new Set(COMPONENT_PLACEHOLDERS[name] ?? []);
  for (const token of new Set(tpl.match(/\{\{[^{}]*\}\}/g) ?? [])) {
    const key = token.slice(2, -2);
    if (!known.has(key)) {
      fail(`${name}: unrecognized placeholder ${token}. Add it to COMPONENT_PLACEHOLDERS and fill it.`);
    }
  }
  const slots = [...new Set(tpl.match(/<!--\s*SLOT:([A-Z_]+)\s*-->/g) ?? [])];
  for (const s of slots) {
    if (!KNOWN_SLOTS.has(s.replace(/<!--\s*SLOT:|\s*-->/g, ''))) {
      fail(`${name}: unrecognized slot marker ${s}`);
    }
  }
}

/** Replace {{key}} tokens. Values are inserted literally (use esc* first). */
function fill(template, vars) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

/** Replace a <!-- SLOT:NAME --> marker with content (or '' to drop it). */
function slot(template, name, content = '') {
  const re = new RegExp(`[ \\t]*<!--\\s*SLOT:${name}\\s*-->[ \\t]*`, 'g');
  return template.replace(re, () => content);
}

/** Drop any slot marker that was not filled in. */
function dropEmptySlots(template) {
  return template.replace(/[ \t]*<!--\s*SLOT:[A-Z_]+\s*-->[ \t]*\n?/g, '');
}

/* ------------------------------------------------------------- escaping --- */

function escText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(value) {
  return escText(value).replace(/"/g, '&quot;');
}

function escMermaid(code) {
  return String(code ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Validate the semantic-HTML subset and reject script-ish content. */
function checkRichText(value, where) {
  const html = String(value ?? '');
  if (/<\s*script/i.test(html)) fail(`${where}: <script> is not allowed`);
  if (/javascript:/i.test(html)) fail(`${where}: "javascript:" URLs are not allowed`);
  if (/\son[a-z]+\s*=/i.test(html)) fail(`${where}: inline event handlers (on*) are not allowed`);
  for (const match of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/g)) {
    const tag = match[1].toLowerCase();
    if (!ALLOWED_TEXT_TAGS.has(tag)) {
      fail(
        `${where}: tag <${tag}> is not allowed (allowed: ${[...ALLOWED_TEXT_TAGS].join(', ')}). ` +
          'Escape literal angle brackets as &lt; and &gt;.'
      );
    }
  }
  return html;
}

/* ---------------------------------------------------------- spec checks --- */

const pick = (obj, keys) => keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null);

function checkMermaid(code, where) {
  const text = String(code ?? '').trim();
  if (!text) {
    fail(`${where}: "mermaid" is required and must be non-empty`);
    return text;
  }
  const first = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('%%'));
  const head = (first ?? '').replace(/^(%%\{.*?\}%%\s*)/, '');
  const type = SUPPORTED_TYPES.find((t) => head.startsWith(t));
  if (!type) {
    warn(
      `${where}: diagram type not recognized on the first line ("${(first ?? '').slice(0, 40)}"). ` +
        `Supported: ${SUPPORTED_TYPES.join(', ')}.`
    );
  }
  if (/<br\s*\/?>/i.test(text)) {
    warn(`${where}: contains <br>; the page renders with htmlLabels:false, use a plain line break inside quotes instead`);
  }
  checkLabelContrast(text, where);
  return text;
}

const LOW_CONTRAST = 4.5;

function parseColorValue(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!str || str === 'none' || str === 'transparent') return null;
  if (str.startsWith('#')) {
    const hex = str.slice(1);
    const full = hex.length === 3 || hex.length === 4 ? hex.split('').map((c) => c + c).join('') : hex;
    if (full.length < 6) return null;
    const rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return rgb.every(Number.isFinite) ? rgb : null;
  }
  const named = { white: '#ffffff', black: '#000000' };
  if (named[str.toLowerCase()]) return parseColorValue(named[str.toLowerCase()]);
  return null;
}

function contrastRatio(a, b) {
  const lum = (rgb) => {
    const ch = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * ch(rgb[0]) + 0.7152 * ch(rgb[1]) + 0.0722 * ch(rgb[2]);
  };
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Warn when a classDef/style paints a background but leaves the label color to
 * the theme. Mermaid then uses the theme text color, which is light in dark mode
 * and dark in light mode, so light pastel fills end up with unreadable labels.
 */
function checkLabelContrast(code, where) {
  const decls = [];
  const re = /(classDef\s+[A-Za-z0-9_]+\s+|style\s+[A-Za-z0-9_]+\s+)([^\n;]+)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const props = {};
    for (const pair of m[2].split(',')) {
      const idx = pair.indexOf(':');
      if (idx === -1) continue;
      props[pair.slice(0, idx).trim().toLowerCase()] = pair.slice(idx + 1).trim();
    }
    decls.push({ target: m[1].trim().split(/\s+/).slice(0, 2).join(' '), props });
  }

  const classDefs = decls.filter((d) => d.target.startsWith('classDef'));

  classDefs.forEach((d) => {
    const fill = parseColorValue(d.props.fill);
    if (fill && !d.props.color) {
      warn(
        `${where}: "${d.target}" sets fill:${d.props.fill} without color. ` +
          `Mermaid uses the theme text color for labels, which is unreadable on light fills in dark mode. ` +
          `Add an explicit color:, e.g. color:#0f172a.`
      );
    }
  });

  for (const d of decls) {
    const fill = parseColorValue(d.props.fill);
    const color = parseColorValue(d.props.color);
    if (!fill || !color) continue;
    const ratio = contrastRatio(fill, color);
    if (ratio < LOW_CONTRAST) {
      warn(
        `${where}: "${d.target}" label contrast is only ${ratio.toFixed(2)}:1 ` +
          `(fill:${d.props.fill} on color:${d.props.color}); aim for at least ${LOW_CONTRAST}:1.`
      );
    }
  }

  // Dark palettes only: in light mode a dark fill keeps the dark theme label readable.
  for (const d of decls) {
    const fill = parseColorValue(d.props.fill);
    if (!fill) continue;
    const lum = (fill[0] * 299 + fill[1] * 587 + fill[2] * 114) / 1000;
    if (lum >= 128) continue;
    const color = parseColorValue(d.props.color);
    if (color && (color[0] * 299 + color[1] * 587 + color[2] * 114) / 1000 < 128) continue;
    const label = color ? `color:${d.props.color}` : 'the light default label color';
    warn(
      `${where}: "${d.target}" fill:${d.props.fill} is dark, so ${label} is unreadable in light mode. ` +
        `Add an explicit light color: (e.g. color:#ffffff) or use a lighter fill.`
    );
  }
}

function checkDiagram(d, index) {
  const where = `diagrams[${index}]`;
  const id = String(pick(d, ['id', 'diagram_id']) ?? '');
  if (!id) fail(`${where}: "id" is required`);
  else if (!KEBAB_ID.test(id)) fail(`${where}.id "${id}": must be kebab-case ([a-z0-9-]+)`);

  const title = String(pick(d, ['title', 'diagram_title']) ?? '');
  if (!title) fail(`${where}: "title" is required`);

  const mermaid = checkMermaid(pick(d, ['mermaid', 'mermaid_code', 'code']), `${where} (${id || 'no id'})`);

  const legend = [];
  const rawLegend = pick(d, ['legend', 'legend_items']) ?? [];
  if (!Array.isArray(rawLegend)) fail(`${where}.legend: must be an array`);
  else {
    rawLegend.forEach((item, i) => {
      const color = String(pick(item, ['color', 'swatch']) ?? '').trim();
      if (!color) fail(`${where}.legend[${i}]: "color" is required`);
      else if (!HEX_COLOR.test(color) && !NAMED_COLOR.test(color)) {
        fail(`${where}.legend[${i}].color: "${color}" is not a hex code or a named color`);
      }
      const meaning = String(pick(item, ['meaning', 'label']) ?? '');
      if (!meaning) fail(`${where}.legend[${i}]: "meaning" is required`);
      legend.push({ color, symbol: String(pick(item, ['symbol']) ?? ''), meaning });
    });
  }

  const componentNotes = [];
  const rawNotes = pick(d, ['component_notes', 'component_annotations']) ?? [];
  if (!Array.isArray(rawNotes)) fail(`${where}.component_notes: must be an array`);
  else {
    rawNotes.forEach((item, i) => {
      const target = String(pick(item, ['target_node_id', 'target', 'node_id']) ?? '').trim();
      if (!target) fail(`${where}.component_notes[${i}]: "target_node_id" is required`);
      else if (!TARGET_ID.test(target)) {
        fail(`${where}.component_notes[${i}].target_node_id: "${target}" must match [A-Za-z0-9_.-]+`);
      } else if (mermaid && !mermaid.toLowerCase().includes(target.toLowerCase())) {
        warn(`${where}.component_notes[${i}]: target "${target}" does not appear in the Mermaid code`);
      }
      const name = String(pick(item, ['component_name', 'name', 'component']) ?? '');
      if (!name) fail(`${where}.component_notes[${i}]: "component_name" is required`);
      const body = checkRichText(
        pick(item, ['note_content', 'note', 'content']) ?? '',
        `${where}.component_notes[${i}]`
      );
      componentNotes.push({ target, name, body });
    });
  }

  const notesHtml = pick(d, ['notes_html', 'notes']);
  const notes = notesHtml ? checkRichText(notesHtml, `${where}.notes_html`) : '';

  return {
    id,
    title,
    caption: String(pick(d, ['caption']) ?? ''),
    mermaid,
    legend,
    componentNotes,
    notes,
  };
}

/* ------------------------------------------------------------- builders --- */

function buildHeader(spec, count, date) {
  return fill(component('header.html'), {
    title: escText(spec.title ?? ''),
    description: escText(spec.description ?? ''),
    created_date: escAttr(date),
    diagram_count: String(count),
  });
}

function buildToc(diagrams) {
  const itemTpl = component('toc-item.html');
  const items = diagrams
    .map((d) => fill(itemTpl, { diagram_id: escAttr(d.id), diagram_title: escText(d.title) }))
    .join('\n');
  return slot(component('toc.html'), 'TOC_ITEMS', items);
}

function buildLegend(legend) {
  const itemTpl = component('legend-item.html');
  const items = legend
    .map((l) =>
      fill(itemTpl, {
        color: escAttr(l.color),
        symbol: escText(l.symbol),
        meaning: escText(l.meaning),
      })
    )
    .join('\n');
  return slot(component('legend.html'), 'LEGEND_ITEMS', items);
}

function buildComponentNotes(notes) {
  const itemTpl = component('component-note-item.html');
  const items = notes
    .map((n) =>
      fill(itemTpl, {
        target_node_id: escAttr(n.target),
        component_name: escText(n.name),
        note_content: n.body,
      })
    )
    .join('\n');
  return slot(component('component-notes.html'), 'COMPONENT_NOTE_ITEMS', items);
}

function buildCard(d, index) {
  const codeToken = SENTINEL(index);
  let card = component('diagram-card.html');

  // Swap the Mermaid placeholder for a sentinel so later replacements cannot
  // touch the diagram source (e.g. Mermaid hexagon nodes like {{Event Bus}}).
  card = card.split('{{mermaid_code}}').join(codeToken);

  card = fill(card, {
    diagram_id: escAttr(d.id),
    diagram_title: escText(d.title),
    caption: escText(d.caption),
  });

  if (d.legend.length) card = slot(card, 'LEGEND', buildLegend(d.legend));
  if (d.componentNotes.length) card = slot(card, 'COMPONENT_NOTES', buildComponentNotes(d.componentNotes));
  if (d.notes) card = slot(card, 'NOTES', fill(component('notes.html'), { notes_html: d.notes }));

  card = dropEmptySlots(card);
  card = card.split(codeToken).join(escMermaid(d.mermaid));

  assertClean(card, `diagram "${d.id}"`);
  return card;
}

function assertClean(html, where) {
  if (/<!--\s*SLOT:/.test(html)) fail(`Unremoved slot marker in ${where}`);
  if (html.includes('\u0000')) fail(`Internal sentinel leaked into ${where}`);
  const shellTokens = [...new Set(html.match(/\{\{(?:lang|page_title)\}\}/g) ?? [])];
  if (shellTokens.length) fail(`Unreplaced placeholder in ${where}: ${shellTokens.join(', ')}`);
}

/* ---------------------------------------------------------------- main --- */

function printSummary(outPath, count, bytes) {
  flushWarnings();
  const warnNote = warnings.length ? `, ${warnings.length} warning(s)` : '';
  const line = `Wrote ${outPath} (${count} diagram(s), ${(bytes / 1024).toFixed(1)} KB${warnNote})`;
  if (outPath === '-') console.error(line);
  else console.log(line);
}

let warningsFlushed = false;
function flushWarnings() {
  if (warningsFlushed) return;
  warningsFlushed = true;
  for (const w of new Set(warnings)) console.error(`warn: ${w}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (errors.length) return;

  const raw = readInput(args);
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) {
    console.error('error: empty input. Pipe a JSON spec to stdin or pass --in <file>.');
    process.exit(1);
  }

  let spec;
  try {
    spec = JSON.parse(text);
  } catch (err) {
    console.error(`error: input is not valid JSON: ${err.message}`);
    process.exit(1);
  }
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    console.error('error: the spec must be a JSON object.');
    process.exit(1);
  }

  const rawDiagrams = spec.diagrams;
  if (!Array.isArray(rawDiagrams) || rawDiagrams.length === 0) {
    console.error('error: "diagrams" must be a non-empty array.');
    process.exit(1);
  }

  const diagrams = rawDiagrams.map(checkDiagram);

  const seen = new Set();
  for (const d of diagrams) {
    if (seen.has(d.id)) fail(`Duplicate diagram id "${d.id}": ids must be unique (they become element ids).`);
    seen.add(d.id);
  }

  const slug = String(spec.slug ?? '').trim();
  if (slug && !KEBAB_ID.test(slug)) fail(`"slug" "${slug}" must be kebab-case ([a-z0-9-]+)`);
  if (!slug && !args.out && !spec.out) fail('"slug" is required when no --out is given');

  const date = String(spec.created_date ?? new Date().toISOString().slice(0, 10)).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`"created_date" must be YYYY-MM-DD, got "${date}"`);

  const title = String(spec.title ?? slug ?? 'Mermaid diagrams');
  const lang = String(spec.lang ?? 'en').trim() || 'en';

  if (errors.length) return;

  let html = component('shell.html');
  html = fill(html, { lang: escAttr(lang), page_title: escText(spec.page_title ?? title) });
  html = slot(html, 'HEADER', buildHeader({ ...spec, title }, diagrams.length, date));
  html = diagrams.length >= 2 ? slot(html, 'TOC', buildToc(diagrams)) : slot(html, 'TOC', '');
  html = slot(html, 'CONTENT', diagrams.map(buildCard).join('\n\n'));
  html = dropEmptySlots(html);
  assertClean(html, 'output');

  const cardCount = (html.match(/<section class="wt-card"/g) ?? []).length;
  if (cardCount !== diagrams.length) {
    fail(`Expected ${diagrams.length} rendered card(s), found ${cardCount}`);
  }

  if (errors.length) return;
  if (args.strict && warnings.length) {
    flushWarnings();
    console.error('error: --strict: warnings are treated as errors, nothing was written');
    process.exit(1);
  }

  // Output path
  const target = args.out ?? spec.out ?? join(DEFAULT_OUT_DIR, `${slug}.html`);
  if (target === '-') {
    process.stdout.write(html);
    printSummary('-', diagrams.length, Buffer.byteLength(html));
    return;
  }
  const outPath = resolve(process.cwd(), target);
  if (existsSync(outPath) && !args.force) {
    console.error(`error: ${outPath} already exists. Ask the user before overwriting, or pass --force.`);
    process.exit(2);
  }
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, 'utf8');
  printSummary(outPath, diagrams.length, Buffer.byteLength(html));
}

main();

flushWarnings();
for (const e of new Set(errors)) console.error(`error: ${e}`);
if (errors.length) process.exit(1);
