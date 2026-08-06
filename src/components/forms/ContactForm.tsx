'use client';

import Link from 'next/link';
import { useId, useRef, useState, type FormEvent } from 'react';

import { CONTACT_FIELDS, contactForm } from '@/config/forms';
import type { ContactResult } from '@/config/forms';
import { cn } from '@/lib/cn';

import { FormField, fieldClassName } from './FormField';
import { FormStatus, type StatusTone } from './FormStatus';
import { useAltcha } from './useAltcha';

/**
 * The contact form.
 *
 * PROGRESSIVE ENHANCEMENT, properly. The `<form>` has a real `action` and
 * `method`, so with JavaScript off the browser posts it and the handler
 * redirects back to this page with a result in the query string — a complete,
 * working submission with no client code at all. JavaScript then upgrades it:
 * it intercepts the submit, attaches a solved proof of work, and updates the
 * live region in place instead of navigating.
 *
 * The signed page token is rendered server-side and posted either way, so the
 * no-JavaScript path is not an unprotected back door
 * (`src/lib/spam/form-token.ts`).
 *
 * Copy comes from `src/config/forms.ts`. No Turkish sentence lives here.
 */
export function ContactForm({
  formToken,
  services,
  initialResult,
}: {
  formToken: string;
  services: readonly { readonly slug: string; readonly title: string }[];
  /** The no-JavaScript outcome, read from the query string by the page. */
  initialResult?: ContactResult;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const altcha = useAltcha();

  const [result, setResult] = useState<ContactResult | undefined>(
    initialResult,
  );
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState<readonly string[]>([]);

  const fieldId = (name: string) => `${uid}-${name}`;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // Everything below this line is the enhancement. Without it the browser
    // submits the form itself, which is a supported path, not a fallback.
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setResult(undefined);
    setInvalid([]);

    const form = event.currentTarget;
    const data = new FormData(form);

    const solution = await altcha.ensure();
    if (solution) data.set(CONTACT_FIELDS.altcha, solution);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: data,
      });
      const body: { result?: ContactResult; fields?: string[] } =
        await response.json();

      setResult(body.result ?? 'error');
      setInvalid(body.fields ?? []);
      if (body.result === 'success') form.reset();
    } catch {
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  const tone: StatusTone = submitting
    ? 'pending'
    : result === 'success'
      ? 'success'
      : 'error';

  const message = submitting
    ? contactForm.status.pending
    : result
      ? contactForm.status[
          result === 'rateLimited'
            ? 'rateLimited'
            : result === 'invalid'
              ? 'invalid'
              : result === 'success'
                ? 'success'
                : 'error'
        ]
      : undefined;

  const errorFor = (name: string, text: string) =>
    invalid.includes(name) ? text : undefined;

  return (
    <form
      ref={formRef}
      id="iletisim-formu"
      action="/api/contact"
      method="post"
      noValidate
      onSubmit={onSubmit}
      onFocus={() => void altcha.ensure()}
      className="flex max-w-reading flex-col gap-6"
    >
      <input type="hidden" name={CONTACT_FIELDS.formToken} value={formToken} />

      {/*
        Honeypot. Off-screen rather than `display:none`: some bots skip hidden
        fields, and `aria-hidden` with `tabIndex={-1}` keeps it away from
        screen readers and the tab order regardless.
      */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor={fieldId(CONTACT_FIELDS.honeypot)}>Website</label>
        <input
          id={fieldId(CONTACT_FIELDS.honeypot)}
          type="text"
          name={CONTACT_FIELDS.honeypot}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <FormField
        id={fieldId(CONTACT_FIELDS.name)}
        label={contactForm.labels.name}
        error={errorFor(CONTACT_FIELDS.name, contactForm.errors.name)}
        required
      >
        {(props) => (
          <input
            {...props}
            type="text"
            name={CONTACT_FIELDS.name}
            autoComplete="name"
            className={fieldClassName}
          />
        )}
      </FormField>

      <FormField
        id={fieldId(CONTACT_FIELDS.email)}
        label={contactForm.labels.email}
        hint={contactForm.hints.email}
        error={errorFor(CONTACT_FIELDS.email, contactForm.errors.email)}
        required
      >
        {(props) => (
          <input
            {...props}
            type="email"
            name={CONTACT_FIELDS.email}
            autoComplete="email"
            className={fieldClassName}
          />
        )}
      </FormField>

      <FormField
        id={fieldId(CONTACT_FIELDS.service)}
        label={contactForm.labels.service}
      >
        {(props) => (
          <select
            {...props}
            name={CONTACT_FIELDS.service}
            defaultValue=""
            className={fieldClassName}
          >
            <option value="">{contactForm.labels.servicePlaceholder}</option>
            {services.map((service) => (
              <option key={service.slug} value={service.title}>
                {service.title}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField
        id={fieldId(CONTACT_FIELDS.message)}
        label={contactForm.labels.message}
        hint={contactForm.hints.message}
        error={errorFor(CONTACT_FIELDS.message, contactForm.errors.message)}
        required
      >
        {(props) => (
          <textarea
            {...props}
            name={CONTACT_FIELDS.message}
            rows={6}
            className={cn(fieldClassName, 'resize-y')}
          />
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id={fieldId(CONTACT_FIELDS.consent)}
            type="checkbox"
            name={CONTACT_FIELDS.consent}
            aria-describedby={
              invalid.includes(CONTACT_FIELDS.consent)
                ? `${fieldId(CONTACT_FIELDS.consent)}-error`
                : undefined
            }
            aria-invalid={
              invalid.includes(CONTACT_FIELDS.consent) ? true : undefined
            }
            className="mt-1 h-5 w-5 shrink-0 rounded-xs border border-border-strong"
          />
          <label
            htmlFor={fieldId(CONTACT_FIELDS.consent)}
            className="text-sm text-text-secondary"
          >
            {contactForm.labels.consent}{' '}
            <Link
              href="/kvkk"
              className="text-text-accent underline decoration-1 underline-offset-4"
            >
              {contactForm.labels.consentLinkText}
            </Link>
          </label>
        </div>
        {invalid.includes(CONTACT_FIELDS.consent) ? (
          <p
            id={`${fieldId(CONTACT_FIELDS.consent)}-error`}
            className="text-sm text-feedback-error"
          >
            <span aria-hidden="true">✕ </span>
            {contactForm.errors.consent}
          </p>
        ) : null}
      </div>

      <FormStatus message={message} tone={tone} />

      <div>
        <button
          type="submit"
          className="rounded-lg bg-accent-solid px-6 py-3 text-sm tracking-wide text-text-on-accent transition-colors hover:bg-accent-solid-hover"
        >
          {submitting
            ? contactForm.labels.submitting
            : contactForm.labels.submit}
        </button>
      </div>
    </form>
  );
}
