/**
 * The registered legal entity — deliberately unresolved.
 *
 * ⚠️ THIS FILE IS SERVER-SIDE ONLY BY CONSTRUCTION. Nothing under
 * `src/components/**` marked `'use client'` may import it, and a unit test
 * enforces that. The reason is mechanical rather than stylistic: the literal
 * below is a `{{…}}` token, `npm run guard` fails the build on any such token in
 * `.next/static/chunks/**`, and a client bundle is exactly where an unused
 * string can survive minification. Keeping it out of the client graph means the
 * gate can never fire on the token's own definition.
 *
 * `src/config/legal.ts` deliberately does NOT re-export any of this, for the
 * same reason: that file is reachable from a client component via
 * `src/config/services.ts`.
 *
 * See docs/OPEN-QUESTIONS.md B2 and G24.
 */

/**
 * The literal token. Used as the sentinel value, never printed to a page: a page
 * that printed it would fail `npm run guard` rule 2, which is the gate working
 * as designed rather than something to route around.
 */
export const LEGAL_ENTITY_TOKEN = '{{LEGAL_ENTITY}}';

export type LegalEntity =
  | { readonly resolved: true; readonly name: string }
  | { readonly resolved: false; readonly name: null };

/**
 * Resolve the registered ünvan from the environment.
 *
 * Unresolved is the expected state today (docs/OPEN-QUESTIONS.md B2). When it
 * is unresolved the legal pages say so in a sentence a reader can act on, and
 * they name **no** entity — not a guess, not a plausible-sounding placeholder,
 * and not the token, which is not a name either.
 *
 * `npm run preflight` refuses a production deployment while this is unresolved,
 * so "unresolved" can reach a local build and CI but never a live site.
 */
export function legalEntity(): LegalEntity {
  const raw = process.env.LEGAL_ENTITY?.trim();
  if (!raw || raw === LEGAL_ENTITY_TOKEN) {
    return { resolved: false, name: null };
  }
  return { resolved: true, name: raw };
}
