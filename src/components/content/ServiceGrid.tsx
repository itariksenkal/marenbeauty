import type { Service } from '@/content-layer';

import { ServiceCard } from './ServiceCard';

/**
 * A grid of service cards. Renders nothing for an empty group — a group with no
 * services yet is absent, not an empty shell with a heading over it.
 */
export function ServiceGrid({ services }: { services: readonly Service[] }) {
  if (services.length === 0) return null;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <li key={service.slug}>
          <ServiceCard service={service} />
        </li>
      ))}
    </ul>
  );
}
