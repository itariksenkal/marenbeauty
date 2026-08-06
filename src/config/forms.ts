/**
 * The contact form — every user-facing string, and every tunable number.
 *
 * Components may not contain a Turkish sentence (CLAUDE.md §7), and no value
 * that could plausibly change may be hardcoded (§7 again). Both live here.
 *
 * Nothing in this file asserts a fact about the business. The copy says what
 * the form actually does — a message reaches the team and is answered when the
 * centre opens (CLAUDE.md §10) — and nothing more: no response time, no
 * opening date, no phone number.
 */

/** Field names, shared by the form, the schema and the route handler. */
export const CONTACT_FIELDS = {
  name: 'ad',
  email: 'eposta',
  message: 'mesaj',
  service: 'hizmet',
  consent: 'onay',
  /** Must stay empty. Named to look plausible to a bot, hidden from people. */
  honeypot: 'website',
  /** Solved proof-of-work payload, present only when JavaScript ran. */
  altcha: 'altcha',
  /** Signed page token. Always present — the floor for the no-JS path. */
  formToken: 'form_token',
} as const;

/** Length bounds. Generous, but bounded: an unbounded field is a mail bomb. */
export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 160,
  messageMin: 10,
  messageMax: 2000,
} as const;

/**
 * Spam and abuse limits.
 *
 * The rate limit is per process and best-effort — it is NOT the primary
 * defence (docs/ARCHITECTURE.md §7). Proof of work is. On a single container
 * this is a useful backstop; behind several replicas it degrades to a per-replica
 * limit, which is still better than nothing and honest about what it is.
 */
export const SPAM_LIMITS = {
  /** Submissions allowed from one address inside the window. */
  maxSubmissionsPerWindow: 5,
  rateLimitWindowMs: 10 * 60 * 1000,
  /** How long a challenge or page token stays valid. Short on purpose. */
  challengeTtlMs: 20 * 60 * 1000,
  /**
   * Proof-of-work difficulty. The client searches 0..maxNumber for a hash
   * match, so this is the cost knob: high enough to make bulk posting
   * expensive, low enough to finish while someone is still typing.
   */
  powMaxNumber: 60_000,
  /**
   * How long the browser waits for a solution before giving up and letting the
   * page token carry the submission.
   *
   * A solver that hangs must never block a send. The first version had no
   * timeout and a protocol mismatch left the worker silent, so the form sat on
   * "gönderiliyor" forever — a browser test caught it
   * (docs/OPEN-QUESTIONS.md G23).
   */
  powTimeoutMs: 8_000,
  /** Cap on remembered single-use ids, so memory cannot grow unbounded. */
  singleUseCapacity: 5_000,
} as const;

export const contactForm = {
  eyebrow: 'İletişim',
  heading: 'Bize yazın',
  /**
   * Says exactly what happens: the message arrives, and it is answered when the
   * centre opens. No response-time promise — there is no team on shift yet.
   */
  lead: 'Sorularınızı buradan iletebilirsiniz. Mesajınız merkeze ulaşır ve açılışla birlikte size dönüş yapılır.',

  labels: {
    name: 'Adınız',
    email: 'E-posta adresiniz',
    message: 'Mesajınız',
    service: 'İlgilendiğiniz uygulama',
    servicePlaceholder: 'Seçmek isterseniz',
    consent: 'Aydınlatma metnini okudum ve mesajımın iletilmesini istiyorum.',
    consentLinkText: 'KVKK Aydınlatma Metni',
    submit: 'Mesajı gönderin',
    submitting: 'Gönderiliyor…',
  },

  hints: {
    email: 'Size yalnızca bu adres üzerinden dönüş yapılır.',
    message: 'Ne sormak istediğinizi birkaç cümleyle yazmanız yeterli.',
  },

  /**
   * Field errors. Every one names the field and says what to do — an error that
   * only says "geçersiz" leaves the reader guessing.
   */
  errors: {
    name: 'Lütfen adınızı yazın.',
    email: 'Lütfen geçerli bir e-posta adresi yazın.',
    message: 'Lütfen mesajınızı biraz daha ayrıntılı yazın.',
    consent: 'Göndermeden önce aydınlatma metnini onaylamanız gerekiyor.',
  },

  /**
   * Status messages, announced politely rather than shown as a toast.
   *
   * The failure message is deliberately generic and identical for every
   * server-side cause: an SMTP error, a rejected challenge and a missing
   * credential all read the same to the visitor. Detail belongs in the server
   * log, not in the browser.
   */
  status: {
    pending: 'Mesajınız gönderiliyor.',
    success:
      'Mesajınız ulaştı. Açılışla birlikte size dönüş yapacağız; ilginiz için teşekkür ederiz.',
    error:
      'Mesajınız şu anda gönderilemedi. Lütfen biraz sonra tekrar deneyin.',
    invalid: 'Formda eksik ya da hatalı alanlar var. Lütfen kontrol edin.',
    rateLimited:
      'Kısa süre içinde birden fazla mesaj alındı. Lütfen biraz bekleyip tekrar deneyin.',
    /** Announced while the proof of work runs. Never blocks typing. */
    verifying: 'Güvenlik doğrulaması hazırlanıyor.',
  },

  /** Where the no-JS form lands after a POST, and what each state means. */
  resultParam: 'durum',
  resultValues: {
    success: 'gonderildi',
    error: 'hata',
    invalid: 'eksik',
    rateLimited: 'bekleyin',
  },
} as const;

export type ContactResult = keyof typeof contactForm.resultValues;
