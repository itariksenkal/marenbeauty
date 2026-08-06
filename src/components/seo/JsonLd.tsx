/**
 * One JSON-LD `<script>` per page.
 *
 * `dangerouslySetInnerHTML` is required — React escapes text children, and an
 * escaped `&` or `<` inside a JSON-LD block makes the whole thing unparseable.
 * The input is not user data: it is built from typed config and validated
 * frontmatter, and `JSON.stringify` cannot produce a raw `</script>` from it.
 * The `<` escape below closes that remaining hole anyway, so a title
 * containing `</script>` could not break out of the block.
 */
export function JsonLd({ graph }: { graph: Record<string, unknown> }) {
  const json = JSON.stringify(graph).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
