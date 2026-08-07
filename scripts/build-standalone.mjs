/**
 * The container build: the same build as everyone else's, plus
 * `output: 'standalone'`.
 *
 * WHY THIS IS NOT JUST `next build`, AND WHY IT IS NOT THE DEFAULT.
 *
 * `output: 'standalone'` used to be set unconditionally in `next.config.ts`.
 * That broke Vercel: every production deploy compiled, generated all 89 static
 * pages, and then died at the very last step with
 *
 *     ENOENT: no such file or directory, open '…/.next/next-server.js.nft.json'
 *
 * `copyTracedFiles()` — reached only from the `config.output === 'standalone'`
 * branch — is the sole reader of that file. In `next/dist/build/index.js` that
 * branch runs immediately AFTER a deploy adapter's `handleBuildComplete()`,
 * which is what Vercel configures via `config.adapterPath`, and Next's own
 * comment there reads: "in the future output: standalone might not be allowed
 * if an adapter with onBuildComplete is configured".
 *
 * ⚠️ The tempting explanation — "Turbopack emits no .nft.json files" — is
 * WRONG, and was checked rather than assumed. A local Turbopack build writes 62
 * of them, `next-server.js.nft.json` included, produces a working
 * `.next/standalone`, and `node server.js` serves 200s. The CI container job has
 * been building precisely that combination since M16. Turbopack is not the
 * problem; asking for a standalone bundle on a platform that packages the app
 * itself is.
 *
 * So this script does NOT switch bundlers. Vercel and the container both build
 * with Turbopack, which means the 210 browser and 102 accessibility tests in
 * `npm run verify` exercise the same bundler the image ships. Forcing webpack
 * here would buy nothing and would leave the container running code no gate
 * had tested.
 *
 * Standalone output is consumed by exactly one thing: the Dockerfile. Vercel
 * ignores it, and `next start` warns that it does not work with it.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Resolved rather than shelled out to: `next` on PATH depends on how npm
// invoked us, and `shell: true` would need different quoting on Windows and
// Linux. Both matter — the image builds on Linux, and the developer checking
// this path before pushing is on Windows.
const nextBin = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: { ...process.env, BUILD_STANDALONE: '1' },
});

child.on('exit', (code, signal) => {
  // A signal death reports no exit code. Returning 0 there would let a killed
  // build pass as a green one, which is exactly the failure mode this project
  // already spent a session chasing.
  process.exit(code ?? (signal ? 1 : 0));
});
