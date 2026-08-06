import { z } from 'zod';

import { CONTACT_FIELDS, CONTACT_LIMITS } from '@/config/forms';

/**
 * The contact submission, validated at the boundary (CLAUDE.md §15).
 *
 * `.strict()`: unknown keys are REJECTED rather than ignored. A bot that posts
 * twenty extra fields hoping one of them lands somewhere gets a 400, and a
 * future field cannot arrive silently unvalidated.
 *
 * The spam fields are not in this schema. They are consumed and discarded by
 * the route handler before validation runs, so they can never reach the mail
 * template — the message body is built from validated data only.
 *
 * Field names are Turkish because they appear in the HTML, and the no-JS path
 * posts exactly what the form is named.
 */
export const contactSubmissionSchema = z
  .object({
    [CONTACT_FIELDS.name]: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.nameMin)
      .max(CONTACT_LIMITS.nameMax),
    [CONTACT_FIELDS.email]: z.email().max(CONTACT_LIMITS.emailMax),
    [CONTACT_FIELDS.message]: z
      .string()
      .trim()
      .min(CONTACT_LIMITS.messageMin)
      .max(CONTACT_LIMITS.messageMax),
    /**
     * Optional, and a free string rather than an enum of service slugs: the
     * select is a convenience, and a submission that names an unknown service
     * is a curiosity, not an attack. It is escaped like every other field.
     */
    [CONTACT_FIELDS.service]: z.string().trim().max(120).optional(),
    /**
     * Required, and required to be TRUE. An unchecked box is a validation
     * failure, not a silent default — the consent has to be given.
     */
    [CONTACT_FIELDS.consent]: z.literal(true),
  })
  .strict();

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

/**
 * Normalise a raw body into the shape the schema expects.
 *
 * Handles both entry points with one function, so the JSON path and the plain
 * form POST cannot drift apart:
 *   - a checkbox arrives as `'on'` (or its value) when ticked and is ABSENT
 *     when not, so absence has to become `false` rather than `undefined`;
 *   - an empty optional select arrives as `''`, which should be absent.
 */
export function normaliseSubmission(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const consent = raw[CONTACT_FIELDS.consent];
  const service = raw[CONTACT_FIELDS.service];

  return {
    ...raw,
    [CONTACT_FIELDS.consent]:
      consent === true || consent === 'on' || consent === 'true',
    ...(typeof service === 'string' && service.trim() === ''
      ? { [CONTACT_FIELDS.service]: undefined }
      : {}),
  };
}

/** The field names a validation failure should point at, for `aria-describedby`. */
export function invalidFields(error: z.ZodError): readonly string[] {
  return [
    ...new Set(
      error.issues
        .map((issue) => issue.path[0])
        .filter((key): key is string => typeof key === 'string'),
    ),
  ];
}
