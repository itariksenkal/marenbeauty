/**
 * Content guard — CLAUDE.md §9, §12.
 *
 * Runs AFTER `npm run build` and scans BUILD OUTPUT ONLY:
 *   .next/server/app/**\/*.{html,rsc}   — what a visitor actually receives
 *   .next/static/chunks/**\/*.js        — strings that reach the client bundle
 *
 * It deliberately does NOT scan `docs/` or `src/`. This repository discusses
 * every banned word openly — CLAUDE.md §9 lists all sixteen — so a source scan
 * would flag its own rulebook. What matters is what ships.
 *
 * Tiers:
 *   ERROR   — exits non-zero. Blocking lexicon, unresolved {{tokens}},
 *             empty-target channel links, lorem ipsum.
 *   WARNING — reported, exits 0. Advisory lexicon and percentage claims.
 *
 * Every violation of either tier is reported, not just the first.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ── Turkish-aware word boundaries ────────────────────────────────────────────
 *
 * JavaScript's \b is ASCII-only: it treats "ü" as a NON-word character, so
 * /\bkür/ happily matches inside "şükür". That single detail is the difference
 * between a working guard and one that flags ordinary Turkish words.
 *
 * Unicode property escapes with the /u flag get it right.
 */
const L = '(?<![\\p{L}\\p{N}])'; // left boundary
const R = '(?![\\p{L}\\p{N}])'; // right boundary
const W = '[\\p{L}]*'; // greedy Turkish suffix

/* ── Rule 1 — blocking lexicon (CLAUDE.md §9, 16 terms) ──────────────────────
 *
 * Most stems are unambiguous in Turkish, so a greedy suffix is safe:
 * "tedavi" catches tedavisi / tedaviler / tedavide, and nothing else begins
 * with those letters.
 *
 * "kür" is the exception and the reason this is a table rather than a loop.
 * A greedy suffix would flag kürk (fur), kürek (oar) and küresel (global).
 * It therefore takes an explicit suffix whitelist instead. Combined with the
 * left boundary — which is what excludes şükür — the four words named in
 * docs/OPEN-QUESTIONS.md F7 all pass cleanly. There are fixture tests for
 * each, in both directions.
 */
const BLOCKING = [
  { id: 'tedavi', pattern: `tedavi${W}` },
  { id: 'terapi', pattern: `terapi${W}` },
  {
    id: 'kür',
    // Explicit suffixes only — see note above.
    pattern:
      'kür(?:ü|ün|ünü|ümüz|üne|ünde|ünden|ler|leri|lerde|lerden|lerin|le|yle|dür|dir)?',
  },
  { id: 'iyileştir', pattern: `iyileştir${W}` },
  { id: 'yok ed', pattern: `yok\\s+ed${W}` },
  { id: 'garanti', pattern: `garanti${W}` },
  { id: 'kesin sonuç', pattern: `kesin\\s+sonuç${W}` },
  { id: 'mucize', pattern: `mucize${W}` },
  { id: 'kalıcı çözüm', pattern: `kalıcı\\s+çözüm${W}` },
  { id: 'kanıtlanmış', pattern: `kanıtlanmış${W}` },
  // Percent forms are checked in rendered text only — see SCOPES below.
  { id: '%100', pattern: '%\\s?100', scope: 'text' },
  { id: 'risksiz', pattern: `risksiz${W}` },
  { id: 'yan etkisiz', pattern: `yan\\s+etkisiz${W}` },
  { id: 'ağrısız', pattern: `ağrısız${W}` },
  { id: '1 numaralı', pattern: `1\\s*numaralı${W}` },
  // Right boundary stops "en iyimser" matching as "en iyi".
  { id: 'en iyi', pattern: 'en\\s+iyi(?:si|sini|siyle|dir)?' },
];

/* ── Rule 5 — warning lexicon ────────────────────────────────────────────────
 *
 * `tıbbi` MUST stay non-blocking. The required disclaimer contains it:
 *   "Bu uygulamalar kozmetik bakım amaçlıdır ve tıbbi bir hizmetin yerine
 *    geçmez."
 * Promoting it to blocking breaks that sentence. A fixture test asserts the
 * disclaimer passes, so the mistake fails here before it reaches review.
 */
const WARNING = [
  { id: 'klinik', pattern: `klinik${W}` },
  { id: 'tıbbi', pattern: `tıbbi${W}` },
  { id: 'doktor kontrolünde', pattern: `doktor\\s+kontrol${W}` },
  // Ruled 2026-08-06: the same claim as `1 numaralı`, spelled out. Advisory
  // only — the blocking tier stays the sixteen terms as specified, and this is
  // a spelling variant of one of them rather than a seventeenth term.
  { id: 'bir numaralı', pattern: `bir\\s+numaralı${W}` },
];

/**
 * Which file kinds a rule applies to.
 *
 * `text` = rendered output only (.html/.rsc). Percentage rules are text-only
 * on purpose: minified JavaScript is full of `n%100` modulo arithmetic, and a
 * build that fails because the framework formats a number would be a guard
 * nobody trusts. Word-based rules scan JavaScript too — Turkish prose does not
 * occur in framework code, so a hit there is genuinely our string.
 */
const SCOPES = { text: ['.html', '.rsc'], all: ['.html', '.rsc', '.js'] };

function build(term, flags = 'giu') {
  return { ...term, regex: new RegExp(`${L}(?:${term.pattern})${R}`, flags) };
}

const BLOCKING_RULES = BLOCKING.map((t) => build(t));
const WARNING_RULES = WARNING.map((t) => build(t));

/* ── Rule 2 — unresolved tokens ──────────────────────────────────────────────
 *
 * `{{LEGAL_ENTITY}}` must never reach production (docs/OPEN-QUESTIONS.md B2).
 * In rendered text any {{…}} is wrong. In JavaScript the pattern is restricted
 * to SHOUTING_TOKENS, because `{{` is ordinary syntax in minified code and a
 * general pattern would fail every build.
 */
const TOKEN_TEXT = /\{\{[^{}\n]{1,80}\}\}/g;
const TOKEN_JS = /\{\{\s*[A-Z][A-Z0-9_]{2,}\s*\}\}/g;

/* ── Rule 3 — empty-target channel links ─────────────────────────────────────
 *
 * A channel that is unset must render NOTHING (CLAUDE.md §7). A dead `tel:` is
 * worse than an absent link. Both the HTML attribute form and the RSC payload
 * form are covered, since a client component's props arrive as JSON.
 */
const EMPTY_HREF_HTML = /href\s*=\s*["']\s*(?:tel|mailto|sms):\s*["']/gi;
const EMPTY_HREF_RSC = /"href"\s*:\s*"\s*(?:tel|mailto|sms):\s*"/gi;
const EMPTY_WA = /wa\.me\/(?![0-9])/gi;
/** `<a>` carrying data-channel but going nowhere. Attribute order-independent. */
const ANCHOR_TAG = /<a\b[^>]*>/gi;

/* ── Rule 4 — placeholder copy ───────────────────────────────────────────────*/
const LOREM = /lorem\s+ipsum|dolor\s+sit\s+amet/gi;

/* ── Rule 6 — percentage claims (warning) ────────────────────────────────────
 * Turkish writes percentages as %90, so `%` followed by a digit is the claim
 * shape. Text-only, and any range already reported by rule 1 (%100) is skipped
 * so the blocking hit is never masked by a warning.
 */
const PERCENT = /%\s?\d+/g;

/**
 * Decode escapes so an escaped banned word cannot slip through.
 * Line-preserving: neither escape form contains a newline, so line numbers
 * computed on the decoded text still match the original file.
 */
function decodeLine(line) {
  return line
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

/**
 * Blank out inline `style="…"` values, preserving length so indices still line
 * up. Percentage rules run against this rather than the raw line.
 *
 * Without it, `clip-path:inset(0 0 100% 0)` matches `%\s?\d` and every page
 * using an image or text reveal reports a bogus percentage claim. Warnings
 * that fire on every page teach people to ignore warnings, which costs more
 * than the rule is worth.
 */
function maskStyleAttributes(line) {
  return line.replace(/style="[^"]*"/gi, (match) => ' '.repeat(match.length));
}

function excerpt(line, index, length) {
  const from = Math.max(0, index - 40);
  const to = Math.min(line.length, index + length + 40);
  return `${from > 0 ? '…' : ''}${line.slice(from, to).trim()}${to < line.length ? '…' : ''}`;
}

/**
 * @typedef {{ phrase: string, reason: string, rule?: string }} Allowance
 * @typedef {{
 *   tier: 'error' | 'warning',
 *   rule: string,
 *   file: string,
 *   line: number,
 *   column: number,
 *   matched: string,
 *   excerpt: string,
 * }} Violation
 */

/**
 * Scan one file's text. Exported so fixture tests can exercise the real rules
 * rather than a reimplementation of them.
 *
 * @param {string} text
 * @param {{ file?: string, ext?: string, allowances?: Allowance[] }} [options]
 * @returns {Violation[]}
 */
export function scanText(
  text,
  { file = 'inline', ext = '.html', allowances = [] } = {},
) {
  /** @type {Violation[]} */
  const violations = [];
  const lines = text.split('\n');
  const applies = (rule) => SCOPES[rule.scope ?? 'all'].includes(ext);

  lines.forEach((rawLine, i) => {
    const line = decodeLine(rawLine);
    // Percentage rules only — see maskStyleAttributes.
    const proseLine = maskStyleAttributes(line);
    const lineNo = i + 1;

    /**
     * Ranges already flagged as errors on this line, so warnings can defer.
     * @type {Array<[number, number]>}
     */
    const blockedRanges = [];

    const suppressed = (index, length, matched) =>
      allowances.some((a) => {
        const at = line.toLowerCase().indexOf(a.phrase.toLowerCase());
        if (at === -1) return false;
        return index >= at && index + length <= at + a.phrase.length;
      }) ||
      // An allowance may also be written as the exact matched fragment.
      allowances.some((a) => a.phrase.toLowerCase() === matched.toLowerCase());

    const push = (tier, rule, index, matched) => {
      if (tier === 'error' && suppressed(index, matched.length, matched))
        return;
      violations.push({
        tier,
        rule,
        file,
        line: lineNo,
        column: index + 1,
        matched,
        excerpt: excerpt(line, index, matched.length),
      });
    };

    // Rule 1 — blocking lexicon. Runs FIRST so rule 6 can defer to it.
    for (const rule of BLOCKING_RULES) {
      if (!applies(rule)) continue;
      rule.regex.lastIndex = 0;
      // `%100` is a percentage rule and must not fire inside a style attribute.
      const haystack = rule.scope === 'text' ? proseLine : line;
      let m;
      while ((m = rule.regex.exec(haystack)) !== null) {
        blockedRanges.push([m.index, m.index + m[0].length]);
        push('error', `blocking:${rule.id}`, m.index, m[0]);
        if (m[0].length === 0) rule.regex.lastIndex++;
      }
    }

    // Rule 2 — unresolved tokens.
    const tokenRe = ext === '.js' ? TOKEN_JS : TOKEN_TEXT;
    tokenRe.lastIndex = 0;
    let t;
    while ((t = tokenRe.exec(line)) !== null) {
      push('error', 'unresolved-token', t.index, t[0]);
    }

    // Rule 3 — empty-target channel links.
    if (ext !== '.js') {
      for (const re of [EMPTY_HREF_HTML, EMPTY_HREF_RSC, EMPTY_WA]) {
        re.lastIndex = 0;
        let h;
        while ((h = re.exec(line)) !== null) {
          push('error', 'empty-channel-link', h.index, h[0]);
        }
      }
      ANCHOR_TAG.lastIndex = 0;
      let a;
      while ((a = ANCHOR_TAG.exec(line)) !== null) {
        const tag = a[0];
        if (!/data-channel/i.test(tag)) continue;
        const href = tag.match(/href\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
        if (
          href === '' ||
          href === '#' ||
          /^(?:tel|mailto|sms):$/i.test(href)
        ) {
          push('error', 'empty-channel-link', a.index, tag);
        }
      }
    }

    // Rule 4 — placeholder copy.
    LOREM.lastIndex = 0;
    let lo;
    while ((lo = LOREM.exec(line)) !== null) {
      push('error', 'lorem-ipsum', lo.index, lo[0]);
    }

    // Rule 5 — warning lexicon.
    for (const rule of WARNING_RULES) {
      if (!applies(rule)) continue;
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(line)) !== null) {
        push('warning', `advisory:${rule.id}`, m.index, m[0]);
        if (m[0].length === 0) rule.regex.lastIndex++;
      }
    }

    // Rule 6 — percentage claims, deferring to rule 1 (F9).
    if (SCOPES.text.includes(ext)) {
      PERCENT.lastIndex = 0;
      let p;
      while ((p = PERCENT.exec(proseLine)) !== null) {
        const overlaps = blockedRanges.some(
          ([start, end]) => p.index < end && p.index + p[0].length > start,
        );
        if (overlaps) continue;
        push('warning', 'percentage-claim', p.index, p[0]);
      }
    }
  });

  return violations;
}

/* ── CLI ─────────────────────────────────────────────────────────────────────*/

/**
 * An allowance means a banned term is shipping to visitors, so it must say why.
 * Exported so the rejection is covered by a test rather than only by a
 * process.exit nobody exercises.
 */
/**
 * @param {Array<Partial<Allowance>>} entries
 * @returns {Array<Partial<Allowance>>}
 */
export function validateAllowances(entries) {
  for (const entry of entries) {
    if (!entry?.phrase || !entry?.reason) {
      throw new Error(
        `guard: allowance ${JSON.stringify(entry?.phrase ?? entry)} has no "reason". ` +
          `Every exception must say why it exists. Add one, or remove it.`,
      );
    }
  }
  return entries;
}

function loadAllowances() {
  const file = join(root, 'scripts', 'guard.allow.json');
  if (!existsSync(file)) return [];
  const config = JSON.parse(readFileSync(file, 'utf8'));
  try {
    return validateAllowances(config.allow ?? []);
  } catch (error) {
    console.error(`\n  ✗ ${error.message}\n`);
    process.exit(1);
  }
}

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

function main() {
  const appDir = join(root, '.next', 'server', 'app');
  const chunkDir = join(root, '.next', 'static', 'chunks');

  if (!existsSync(join(root, '.next'))) {
    console.error(
      '\n  ✗ guard: no .next directory. The guard inspects BUILD OUTPUT —\n' +
        '    run `npm run build` first.\n',
    );
    process.exit(1);
  }

  const allowances = loadAllowances();
  const files = [
    ...walk(appDir, ['.html', '.rsc']),
    ...walk(chunkDir, ['.js']),
  ];

  const violations = [];
  for (const file of files) {
    const ext = file.slice(file.lastIndexOf('.'));
    const text = readFileSync(file, 'utf8');
    violations.push(
      ...scanText(text, {
        file: relative(root, file).split(sep).join('/'),
        ext,
        allowances,
      }),
    );
  }

  const errors = violations.filter((v) => v.tier === 'error');
  const warnings = violations.filter((v) => v.tier === 'warning');

  console.log(`\n  guard: ${files.length} build artefacts scanned.`);
  console.log(
    `  ${BLOCKING.length} blocking terms, ${WARNING.length} advisory terms, ` +
      `${allowances.length} allowance(s).\n`,
  );

  const report = (list, symbol, heading) => {
    if (!list.length) return;
    console.log(`  ${symbol} ${list.length} ${heading}:\n`);
    for (const v of list) {
      console.log(`      ${v.file}:${v.line}:${v.column}  [${v.rule}]`);
      console.log(`        ${v.excerpt}`);
    }
    console.log('');
  };

  report(warnings, '⚠', 'warning(s) — reviewed by hand, not blocking');
  report(errors, '✗', 'BLOCKING violation(s)');

  if (errors.length) {
    console.error(
      `  Content must not ship with these. See CLAUDE.md §9 for the\n` +
        `  substitutions, or add a reasoned entry to scripts/guard.allow.json.\n`,
    );
    process.exit(1);
  }

  console.log('  ✓ guard: no blocking violations.\n');
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) main();
