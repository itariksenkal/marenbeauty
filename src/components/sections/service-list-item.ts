import type { Service, ServiceGroup } from '@/content-layer/schemas';

/**
 * The three fields the home panel list actually needs.
 *
 * NOT `Service`. `ServicesPanels` is a client component, so every prop crosses
 * the server/client boundary as JSON in the RSC payload — passing whole
 * services shipped all twenty MDX bodies, roughly nine thousand words of prose,
 * inside the home page's payload for a list that renders twenty titles. A
 * browser test caught it by finding body copy in the serialised stream.
 *
 * This lives in its own module rather than beside the component because
 * `ServicesPanels.tsx` carries `'use client'`: anything exported from there is
 * a CLIENT reference, and calling it during server rendering fails the build
 * with "attempted to call it from the server". Narrowing has to happen on the
 * server, which means the function cannot live in a client module.
 */
export type ServiceListItem = {
  readonly slug: string;
  readonly title: string;
  readonly group: ServiceGroup;
};

/** Call this at the server-side call site, before the props are serialised. */
export function toListItems(
  services: readonly Service[],
): readonly ServiceListItem[] {
  return services.map(({ slug, title, group }) => ({ slug, title, group }));
}
