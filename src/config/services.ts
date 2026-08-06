import type { ServiceGroup } from '@/content-layer/schemas';

/**
 * Display labels for the service groups (docs/CONTENT-PLAN.md §1).
 *
 * These are category names for services the owner has confirmed, so they are
 * not invented. Nothing here describes how a service is performed, how long it
 * takes, or what equipment is involved — none of that is known.
 */
/**
 * Panel surfaces, warming as the visitor descends.
 *
 * This is the largest single lever on rose balance (docs/DESIGN-SYSTEM.md
 * §1.7): five full-viewport panels are the biggest area on the site. Left at
 * ivory they measured COOLER than the page — the sampled average was #faf7f3
 * against cream's #faf4ec — which is precisely the "reads beige" failure.
 *
 * Only `ink`, `espresso` and `cocoa` may sit on the warmer surfaces
 * (§1.5 rule 4), and only those are used. `rose-beige` at ink is 11.10:1.
 *
 * Tune the balance HERE. Do not reach for rose text or rose borders — they
 * fail contrast, which is arithmetic rather than taste.
 */
export type PanelSurface =
  | 'bg-surface-raised'
  | 'bg-surface-sunken'
  | 'bg-surface-accent'
  | 'bg-surface-decor';

export const serviceGroups: readonly {
  readonly id: ServiceGroup;
  readonly label: string;
  /** Sets the aurora stops while this panel is on screen. */
  readonly auroraB: string;
  readonly auroraC: string;
  readonly surface: PanelSurface;
}[] = [
  {
    id: 'cilt-bakimi',
    label: 'Cilt Bakımı',
    auroraB: 'var(--mb-nude)',
    auroraC: 'var(--mb-rose-beige)',
    surface: 'bg-surface-raised',
  },
  {
    id: 'epilasyon',
    label: 'Epilasyon',
    auroraB: 'var(--mb-rose-beige)',
    auroraC: 'var(--mb-blush)',
    surface: 'bg-surface-sunken',
  },
  {
    id: 'cilt-yenileme',
    label: 'Cilt Yenileme',
    auroraB: 'var(--mb-blush)',
    auroraC: 'var(--mb-champagne)',
    surface: 'bg-surface-accent',
  },
  {
    id: 'kas-kirpik',
    label: 'Kaş & Kirpik',
    auroraB: 'var(--mb-nude)',
    auroraC: 'var(--mb-blush)',
    surface: 'bg-surface-decor',
  },
  {
    id: 'ozel-paket',
    label: 'Özel Paketler',
    auroraB: 'var(--mb-champagne-light)',
    auroraC: 'var(--mb-rose-beige)',
    surface: 'bg-surface-accent',
  },
];
