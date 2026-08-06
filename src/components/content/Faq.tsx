/**
 * Frequently asked questions.
 *
 * Built on native `<details>` / `<summary>` rather than a Radix Accordion.
 * That is a deliberate deviation from docs/ARCHITECTURE.md §6, recorded in the
 * roadmap, for three reasons:
 *
 *   - It is a Server Component. Twenty service pages ship zero JavaScript for
 *     this, where an Accordion would put a client bundle on every one of them.
 *   - It works before hydration and without JavaScript at all. A visitor on a
 *     slow connection can open a question while the page is still loading.
 *   - The browser gives us the disclosure semantics, keyboard handling and
 *     screen-reader announcement for free, and gets them right.
 *
 * No dependency was added for it, which also keeps the licence audit unchanged.
 *
 * The `FAQPage` JSON-LD this feeds arrives at M13 with the rest of the
 * structured data, so the markup and the schema are built against one spec
 * rather than two.
 *
 * Renders nothing when there are no questions.
 */
export function Faq({
  items,
  title,
  headingId = 'sss',
}: {
  items: readonly { readonly question: string; readonly answer: string }[];
  /** A prop, not a config lookup — service pages and posts label it from
      their own copy files, and this component need not know which it is on. */
  title: string;
  headingId?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-display text-2xl tracking-display text-text-primary"
      >
        {title}
      </h2>

      <ul className="mt-6 max-w-reading">
        {items.map((item) => (
          <li key={item.question} className="border-b border-border-decor">
            <details className="group">
              <summary className="flex cursor-pointer items-baseline justify-between gap-4 py-4 text-text-primary transition-colors hover:bg-surface-decor/40">
                {item.question}
                {/*
                  Rotates rather than swapping glyphs, so the control never
                  changes width and the row cannot reflow on open.
                */}
                <span
                  aria-hidden="true"
                  className="text-text-accent transition-transform ease-standard group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-text-secondary">{item.answer}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
