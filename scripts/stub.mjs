/**
 * Placeholder for an npm script that must exist from M0 but is implemented at
 * a later milestone (CLAUDE.md §4: "Every npm script exists, even if some are
 * stubs").
 *
 * Prints loudly so a green `npm run verify` is never mistaken for coverage
 * that does not exist yet.
 *
 * Usage: node scripts/stub.mjs <script-name> "<when it arrives>"
 */
const [name = 'unknown', when = 'a later milestone'] = process.argv.slice(2);

console.log(`\n  ⧗  ${name}: NOT IMPLEMENTED — ${when}.`);
console.log(`     This is a stub. It asserts nothing.\n`);

process.exit(0);
