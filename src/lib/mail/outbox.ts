/**
 * The development capture — a local stand-in for a mailbox.
 *
 * The SMTP credential is not available yet (docs/OPEN-QUESTIONS.md B1/B3), so
 * the send path is verified against this instead of a real inbox. Nodemailer
 * composes the message exactly as it would for SMTP; the transport hands the
 * finished envelope here rather than opening a socket.
 *
 * THREE PROPERTIES MAKE THIS SAFE:
 *
 *   1. **In memory, never on disk.** CLAUDE.md §11 says the contact form
 *      persists nothing. A file of captured messages would be a folder of
 *      personal data sitting in a repo — precisely the thing the rule exists to
 *      prevent. This array dies with the process.
 *   2. **Bounded.** It keeps only the last few messages, so a long dev session
 *      cannot accumulate.
 *   3. **Impossible in production.** `env.ts` rejects the capture transport
 *      when `NODE_ENV` is production, and the route that reads this 404s there.
 *      Two independent guards, because one that is only a convention is not a
 *      guard.
 */

export type CapturedMessage = {
  readonly at: string;
  readonly envelope: unknown;
  readonly messageId: string;
  /** The full composed RFC822 message, headers and body. */
  readonly raw: string;
};

const CAPACITY = 20;

const captured: CapturedMessage[] = [];

export function captureMessage(message: CapturedMessage): void {
  captured.push(message);
  while (captured.length > CAPACITY) captured.shift();
}

export function capturedMessages(): readonly CapturedMessage[] {
  return captured;
}

export function clearCapturedMessages(): void {
  captured.length = 0;
}
