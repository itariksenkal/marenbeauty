/**
 * Reading time, computed from the body — never authored.
 *
 * 200 words/minute is a conservative figure for Turkish prose read on a phone.
 * Turkish is agglutinative, so a "word" carries more meaning (and more
 * syllables) than an English one; a faster figure would flatter the estimate.
 */
const WORDS_PER_MINUTE = 200;

/** Strip MDX/Markdown syntax so the count reflects prose, not punctuation. */
function toPlainText(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ') // fenced code
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/<[^>]+>/g, ' ') // JSX / HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their text
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ') // heading markers
    .replace(/[*_~>|-]/g, ' ') // emphasis, quotes, table pipes
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(body: string): number {
  const text = toPlainText(body);
  return text === '' ? 0 : text.split(' ').length;
}

/** Whole minutes, minimum 1 — "0 dakika" is not a useful thing to render. */
export function readingMinutes(body: string): number {
  return Math.max(1, Math.round(countWords(body) / WORDS_PER_MINUTE));
}
