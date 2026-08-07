import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Two build shapes, and the coupling that keeps both working.
 *
 * `output: 'standalone'` makes the build call `copyTracedFiles()`, which reads
 * `.next/next-server.js.nft.json`. Turbopack never writes it — trace collection
 * is guarded by `if (bundler !== Bundler.Turbopack)` in Next's build. Set
 * unconditionally, it killed every Turbopack production build at the very end,
 * after all 89 pages had generated.
 *
 * So: `npm run build` is Turbopack with no standalone (Vercel, and what
 * `verify` exercises), and `npm run build:standalone` is webpack WITH
 * standalone (the Dockerfile, and the CI container job).
 *
 * These assertions exist because the failure they prevent is invisible locally.
 * `npm run verify` never builds the standalone shape, and re-adding a bare
 * `output: 'standalone'` breaks nothing until the next deploy — at the last
 * step of it, with a stack that names a file nobody has heard of.
 */

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

/** Comments discuss both settings at length; only real code should be tested. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('the two build targets', () => {
  it('never sets output: standalone unconditionally', () => {
    const config = stripComments(read('next.config.ts'));

    expect(config).not.toMatch(/output:\s*'standalone'\s*,/);
    expect(config).toContain("process.env.BUILD_STANDALONE === '1'");
  });

  it('asks for standalone without switching bundlers', () => {
    const script = stripComments(read('scripts/build-standalone.mjs'));

    expect(script).toContain('BUILD_STANDALONE');
    // Both targets build with Turbopack on purpose: the container then ships
    // the same bundler `verify`'s 210 browser tests exercised. Turbopack does
    // emit the .nft.json files standalone needs — that was measured, not
    // assumed — so forcing webpack here would buy nothing and would leave the
    // image running code no gate had covered.
    expect(script).not.toContain('--webpack');
  });

  it('exposes the container build as its own npm script', () => {
    const pkg: { scripts: Record<string, string> } = JSON.parse(
      read('package.json'),
    );

    expect(pkg.scripts['build:standalone']).toBe(
      'node scripts/build-standalone.mjs',
    );
    // The default build must stay the Vercel shape: no --webpack, no flag that
    // would quietly turn standalone back on for everyone.
    expect(pkg.scripts.build).toBe('next build');
  });

  it('builds the image with the standalone script, not the default build', () => {
    const dockerfile = read('Dockerfile');

    // The runtime stage copies .next/standalone, which the default build does
    // not produce — so this line and that COPY have to agree.
    expect(dockerfile).toContain('npm run build:standalone');
    expect(dockerfile).toMatch(/RUN npm run build:standalone/);
    expect(dockerfile).not.toMatch(/RUN npm run build\s*$/m);
    expect(dockerfile).toContain('/app/.next/standalone');
  });

  it('does not let verify build the standalone shape', () => {
    const pkg: { scripts: Record<string, string> } = JSON.parse(
      read('package.json'),
    );

    // `verify` runs the production build then drives it with `next start`,
    // which does not support standalone and warns about it. The container path
    // is covered by the docker job in CI instead.
    expect(pkg.scripts.verify).toContain('npm run build ');
    expect(pkg.scripts.verify).not.toContain('build:standalone');
  });
});
