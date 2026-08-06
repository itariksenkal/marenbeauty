import Link from 'next/link';

import { blog, blogCategories } from '@/config/blog';
import type { BlogCategory } from '@/content-layer';
import { cn } from '@/lib/cn';

/**
 * The category filter — all six, always, plus "Tümü".
 *
 * All six render even while every one of them is empty. They are the confirmed
 * taxonomy (docs/CONTENT-PLAN.md §3), not a reflection of what happens to be
 * published this week, and a filter row that grows as posts appear would make
 * the blog feel unfinished in a way the empty state already handles honestly.
 *
 * A Server Component and a list of plain links: filtering is navigation, so it
 * works without JavaScript, is linkable, and is back-button correct. `aria-
 * current` marks the active one, so the state is announced rather than only
 * coloured (CLAUDE.md §16 — colour is never the only signal; the active pill
 * also inverts).
 */
export function CategoryPills({ active }: { active?: BlogCategory }) {
  const pills = [
    {
      href: '/blog',
      label: blog.categories.all,
      isActive: active === undefined,
    },
    ...blogCategories.map((category) => ({
      href: `/blog/kategori/${category.id}`,
      label: category.label,
      isActive: active === category.id,
    })),
  ];

  return (
    <nav aria-label={blog.categories.navLabel}>
      <ul className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <li key={pill.href}>
            <Link
              href={pill.href}
              aria-current={pill.isActive ? 'page' : undefined}
              className={cn(
                'inline-block rounded-full border px-4 py-2 text-sm transition-colors',
                pill.isActive
                  ? 'border-border-strong bg-surface-inverse text-text-on-inverse'
                  : 'border-border-decor text-text-secondary hover:bg-surface-accent',
              )}
            >
              {pill.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
