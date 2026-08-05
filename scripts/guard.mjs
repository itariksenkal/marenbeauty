/**
 * Content guard — M0 PLACEHOLDER.
 *
 * The real implementation is milestone M3 (docs/ROADMAP.md). It scans build
 * output — .next/server/app/**\/*.{html,rsc} and .next/static/chunks/**\/*.js —
 * for the blocking lexicon, unresolved {{tokens}}, empty channel links and
 * lorem ipsum, and reports the warning tier. See CLAUDE.md §12.
 *
 * Until then this script asserts nothing. To make sure that stays safe, it
 * FAILS the moment it becomes load-bearing: if any authored content exists,
 * a stub guard is no longer acceptable and the real one must be built.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_DIR = 'content';

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

const authored = listFiles(CONTENT_DIR).filter((f) => f.endsWith('.mdx'));

if (authored.length > 0) {
  console.error('\n  ✗  guard: STUB IS NOW UNSAFE.\n');
  console.error(
    `     Found ${authored.length} authored content file(s) under ${CONTENT_DIR}/,`,
  );
  console.error('     but the real content guard has not been built yet.');
  console.error(
    '     Content must never ship unchecked — implement M3 (docs/ROADMAP.md)',
  );
  console.error('     before adding content.\n');
  for (const f of authored) console.error(`       ${f}`);
  console.error('');
  process.exit(1);
}

console.log('\n  ⧗  guard: NOT IMPLEMENTED — the real guard arrives at M3.');
console.log('     No authored content exists yet, so nothing to check.');
console.log('     This stub fails automatically once content/ is populated.\n');

process.exit(0);
