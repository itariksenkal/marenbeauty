/**
 * Licence audit — CLAUDE.md §2, docs/LICENSES.md.
 *
 * Every dependency must carry a licence from the policy list. Anything else
 * needs an explicit, reasoned exception in licenses.exceptions.json.
 *
 * Why a wrapper rather than `license-checker-rseidelsohn --onlyAllow ...`:
 * the raw CLI exits on the FIRST violation and its --excludePackages list is
 * an undocumented semicolon string with no room for a reason. This script
 *   - reports every violation at once,
 *   - requires a written reason for each exception,
 *   - pins the licence each exception was granted against, so a package that
 *     CHANGES licence fails even though it is excepted,
 *   - reports stale exceptions that are no longer needed.
 *
 * It never widens the policy silently.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(
  readFileSync(join(root, 'licenses.exceptions.json'), 'utf8'),
);

const policy = new Set(config.policy);
const exceptions = new Map(config.exceptions.map((e) => [e.package, e]));

for (const e of config.exceptions) {
  if (!e.reason || !e.licence || !e.scope || !e.status) {
    console.error(
      `\n  ✗ licences: exception for "${e.package}" is missing reason/licence/scope/status.\n`,
    );
    process.exit(1);
  }
}

// Run the checker's JS entry point with the current Node binary. Spawning the
// .bin shim directly is EINVAL on Windows (Node refuses to spawnSync a .cmd).
const checker = join(
  root,
  'node_modules',
  'license-checker-rseidelsohn',
  'bin',
  'license-checker-rseidelsohn.js',
);

const raw = execFileSync(
  process.execPath,
  [checker, '--json', '--excludePrivatePackages'],
  { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);

const installed = JSON.parse(raw);
const violations = [];
const changed = [];
const used = new Set();

for (const [id, meta] of Object.entries(installed)) {
  const licence = String(meta.licenses ?? 'UNKNOWN');
  if (policy.has(licence)) continue;

  const name = id.slice(0, id.lastIndexOf('@'));
  const exception = exceptions.get(name);

  if (!exception) {
    violations.push({ id, licence });
    continue;
  }

  used.add(name);
  if (exception.licence !== licence) {
    changed.push({ id, was: exception.licence, now: licence });
  }
}

const stale = config.exceptions
  .map((e) => e.package)
  .filter((name) => !used.has(name));

const total = Object.keys(installed).length;
console.log(`\n  licences: ${total} packages audited.`);
console.log(`  policy: ${config.policy.join(', ')}`);
console.log(`  exceptions on file: ${config.exceptions.length}\n`);

let failed = false;

if (violations.length) {
  failed = true;
  console.error(`  ✗ ${violations.length} package(s) outside the policy with`);
  console.error(`    no recorded exception:\n`);
  for (const v of violations) {
    console.error(`      ${v.licence.padEnd(40)} ${v.id}`);
  }
  console.error(
    `\n    Add a reasoned entry to licenses.exceptions.json, or remove the`,
  );
  console.error(
    `    dependency. Do not widen "policy" without owner sign-off.\n`,
  );
}

if (changed.length) {
  failed = true;
  console.error(`  ✗ ${changed.length} excepted package(s) CHANGED LICENCE:\n`);
  for (const c of changed) {
    console.error(`      ${c.id}: granted for ${c.was}, now ${c.now}`);
  }
  console.error(`\n    Re-review the exception before updating it.\n`);
}

if (stale.length) {
  console.warn(`  ⚠ ${stale.length} exception(s) no longer needed:\n`);
  for (const s of stale) console.warn(`      ${s}`);
  console.warn(`\n    Remove them from licenses.exceptions.json.\n`);
}

const pending = config.exceptions.filter(
  (e) => e.status !== 'approved' && used.has(e.package),
);
if (pending.length) {
  console.warn(`  ⚠ ${pending.length} exception(s) AWAITING OWNER APPROVAL:\n`);
  for (const p of pending) {
    console.warn(`      ${p.licence.padEnd(34)} ${p.package}  (${p.scope})`);
  }
  console.warn(
    `\n    See docs/LICENSES.md §5 and docs/OPEN-QUESTIONS.md E4.\n`,
  );
}

if (failed) process.exit(1);
console.log('  ✓ licences: no unrecorded violations.\n');
