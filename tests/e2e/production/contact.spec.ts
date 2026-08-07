import { expect, test, type APIRequestContext } from '@playwright/test';

import { watchForRuntimeErrors } from '../helpers/runtime-errors';

/**
 * The contact form in production — with no SMTP credential, which is the state
 * the site is actually in (docs/OPEN-QUESTIONS.md B1/B3).
 *
 * That makes this suite more useful than it sounds: everything up to the send
 * is exercised for real, and the send is asserted to fail the way it should —
 * a generic Turkish message, a 500, and nothing about SMTP anywhere near the
 * client.
 *
 * EVERY POST CARRIES ITS OWN `x-forwarded-for`. The rate limit is per address
 * and Playwright's requests all come from one, so without this a test that
 * submits five times would starve the next one. Giving each case its own
 * address is also the only way to test the limit itself.
 */

const FORM_ACTION = '/api/contact';

/** Mint a page token the way a browser would: by loading the page. */
async function freshToken(request: APIRequestContext): Promise<string> {
  const page = await request.get('/iletisim');
  expect(page.status()).toBe(200);
  const html = await page.text();
  const match = html.match(/name="form_token"\s+value="([^"]+)"/);
  expect(match, 'the page must render a form token').not.toBeNull();
  return match![1]!;
}

const submission = (token: string) => ({
  ad: 'Test Kullanıcı',
  eposta: 'test@example.com',
  mesaj: 'Bu bir test mesajıdır ve yeterince uzundur.',
  onay: 'true',
  form_token: token,
});

test.describe('the contact page', () => {
  test('renders with no runtime error and exactly one h1', async ({ page }) => {
    const errors = watchForRuntimeErrors(page);
    await page.goto('/iletisim');
    await page.waitForLoadState('load');

    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors.pageErrors).toEqual([]);
    expect(errors.consoleErrors).toEqual([]);
  });

  test('works without JavaScript: a real action and method', async ({
    page,
  }) => {
    await page.goto('/iletisim');
    const form = page.locator('form#iletisim-formu');
    await expect(form).toHaveAttribute('action', FORM_ACTION);
    await expect(form).toHaveAttribute('method', 'post');
    // The no-JS floor travels with it.
    await expect(page.locator('input[name="form_token"]')).toHaveCount(1);
  });

  test('every control has a real label', async ({ page }) => {
    await page.goto('/iletisim');
    const unlabelled = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '#iletisim-formu input, #iletisim-formu select, #iletisim-formu textarea',
        ),
      ]
        .filter((el) => {
          const control = el as HTMLInputElement;
          if (control.type === 'hidden') return false;
          return !control.labels || control.labels.length === 0;
        })
        .map((el) => (el as HTMLInputElement).name),
    );
    expect(unlabelled).toEqual([]);
  });

  test('hints are wired with aria-describedby', async ({ page }) => {
    await page.goto('/iletisim');
    const described = await page
      .locator('#iletisim-formu [aria-describedby]')
      .evaluateAll((els) =>
        els.map((el) => {
          const id = el.getAttribute('aria-describedby') ?? '';
          return id
            .split(' ')
            .every((part) => document.getElementById(part) !== null);
        }),
      );
    expect(described.length).toBeGreaterThan(0);
    expect(described.every(Boolean)).toBe(true);
  });

  test('consent is required and unchecked, and links to /kvkk', async ({
    page,
  }) => {
    await page.goto('/iletisim');
    const consent = page.locator('input[name="onay"]');
    await expect(consent).not.toBeChecked();
    // Scoped to the form: from M12 the footer links to /kvkk on every page, and
    // a consent notice that relies on the footer is not a consent notice.
    await expect(page.locator('form a[href="/kvkk"]')).toBeVisible();
  });

  test('the honeypot is hidden from people and from assistive tech', async ({
    page,
  }) => {
    await page.goto('/iletisim');
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveCount(1);
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    // Its wrapper is aria-hidden and off-screen, not display:none.
    const offScreen = await honeypot.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.left < 0 || box.width === 0;
    });
    expect(offScreen).toBe(true);
    await expect(
      page.locator('[aria-hidden="true"] input[name="website"]'),
    ).toHaveCount(1);
  });

  test('the live region exists before it has anything to say', async ({
    page,
  }) => {
    // A live region added at the same moment as its message is often not
    // announced at all.
    await page.goto('/iletisim');
    const status = page.locator('#iletisim-formu [role="status"]');
    await expect(status).toHaveCount(1);
    await expect(status).toHaveAttribute('aria-live', 'polite');
  });

  test('every channel link has a real target, and nothing is disabled', async ({
    page,
  }) => {
    await page.goto('/iletisim');
    // Channels are configured from M17, so links DO render. What must never
    // appear is a dead one. `npm run guard` fails the build on a bare scheme;
    // this is the same contract, checked in a browser.
    const hrefs = await page
      .locator('[data-channel]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^(?:tel:\+?\d|mailto:[^@]+@|https:\/\/)/);
    }
    expect(
      await page.locator('a[href="tel:"], a[href="mailto:"]').count(),
    ).toBe(0);
    expect(await page.locator('a[href="#"]').count()).toBe(0);
    expect(
      await page.locator('button[disabled], a[aria-disabled="true"]').count(),
    ).toBe(0);
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/iletisim');
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('the route handler', () => {
  test('rejects a submission with no spam credential at all', async ({
    request,
  }) => {
    const response = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.1' },
      form: {
        ad: 'Bot',
        eposta: 'bot@example.com',
        mesaj: 'Yeterince uzun bir mesaj gövdesi.',
        onay: 'true',
      },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).result).toBe('invalid');
  });

  test('rejects a tampered token', async ({ request }) => {
    const token = await freshToken(request);
    const response = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.2' },
      form: { ...submission(token), form_token: `${token}x` },
    });
    expect(response.status()).toBe(400);
  });

  test('refuses to redeem the same token twice', async ({ request }) => {
    const token = await freshToken(request);
    const first = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.3' },
      form: submission(token),
    });
    // No mailbox configured, so a valid submission gets as far as the send and
    // fails there — which is exactly what "the credential is the last step"
    // means.
    expect(first.status()).toBe(500);

    const replay = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.3' },
      form: submission(token),
    });
    expect(replay.status()).toBe(400);
    expect((await replay.json()).result).toBe('invalid');
  });

  test('names the invalid fields, so the form can point at them', async ({
    request,
  }) => {
    const token = await freshToken(request);
    const response = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.4' },
      form: { ...submission(token), eposta: 'not-an-address', onay: 'false' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.fields).toEqual(expect.arrayContaining(['eposta', 'onay']));
  });

  test('rejects unknown keys rather than ignoring them', async ({
    request,
  }) => {
    const token = await freshToken(request);
    const response = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.5' },
      form: { ...submission(token), surprise: 'payload' },
    });
    expect(response.status()).toBe(400);
  });

  test('answers a honeypot hit as if it had worked', async ({ request }) => {
    const token = await freshToken(request);
    const response = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.6' },
      form: { ...submission(token), website: 'https://spam.example' },
    });
    // Telling a bot why it failed only helps it. Nothing is sent.
    expect(response.status()).toBe(200);
    expect((await response.json()).result).toBe('success');
  });

  test('rate limits per address', async ({ request }) => {
    const address = '10.0.0.7';
    let sawLimit = false;
    for (let i = 0; i < 8; i++) {
      const response = await request.post(FORM_ACTION, {
        headers: { accept: 'application/json', 'x-forwarded-for': address },
        form: { ad: 'x' },
      });
      if (response.status() === 429) {
        sawLimit = true;
        expect(response.headers()['retry-after']).toBeTruthy();
        break;
      }
    }
    expect(sawLimit).toBe(true);

    // A different address is unaffected.
    const other = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.8' },
      form: { ad: 'x' },
    });
    expect(other.status()).not.toBe(429);
  });

  test('a failed delivery says nothing about SMTP', async ({ request }) => {
    const token = await freshToken(request);
    const response = await request.post(FORM_ACTION, {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.0.0.9' },
      form: submission(token),
    });
    expect(response.status()).toBe(500);

    const text = await response.text();
    expect(JSON.parse(text).result).toBe('error');
    for (const leak of ['SMTP', 'smtp', 'ECONN', 'auth', 'password', 'gmail']) {
      expect(text, leak).not.toContain(leak);
    }
  });

  test('challenges are never cached', async ({ request }) => {
    const response = await request.get('/api/altcha');
    // 200 with a key configured; the header must be no-store either way.
    expect(response.headers()['cache-control']).toContain('no-store');
  });
});

test.describe('the no-JavaScript path', () => {
  test.use({ javaScriptEnabled: false });

  test('submits, redirects, and reports the outcome on the page', async ({
    page,
  }) => {
    // Slower than it looks: with no JavaScript the page still swaps fonts, and
    // under a fully parallel run the layout takes a moment to settle before a
    // checkbox is stable enough to click.
    test.slow();
    await page.goto('/iletisim');

    await page.fill('input[name="ad"]', 'Test Kullanıcı');
    await page.fill('input[name="eposta"]', 'test@example.com');
    await page.fill(
      'textarea[name="mesaj"]',
      'JavaScript kapalıyken gönderilen bir mesaj.',
    );
    await page.check('input[name="onay"]');
    await page.click('button[type="submit"]');

    // A 303 back to the page, with the outcome in the URL — no JSON on screen.
    await expect(page).toHaveURL(/\/iletisim\?durum=/);
    // No mailbox configured, so the honest outcome here is the generic error.
    await expect(page).toHaveURL(/durum=hata/);
    await expect(
      page.getByText('Mesajınız şu anda gönderilemedi.', { exact: false }),
    ).toBeVisible();
  });

  /**
   * The redirect target must be RELATIVE.
   *
   * It was absolute, built from `new URL('/iletisim', request.url)`. In the
   * standalone server `request.url` is composed from `HOSTNAME` and `PORT`
   * rather than the Host header, so a container started with
   * `HOSTNAME=0.0.0.0` sent every no-JavaScript visitor to
   * `http://0.0.0.0:3000/iletisim` — an address that resolves nowhere. It
   * worked on Vercel, which is exactly why CLAUDE.md §3 requires running it in
   * a plain container. Found at M16, on the first real POST inside one.
   */
  test('redirects to a relative location, not to an assumed origin', async ({
    request,
  }) => {
    const response = await request.post('/api/contact', {
      form: { ad: '', eposta: '', mesaj: '', onay: '', website: '' },
      maxRedirects: 0,
    });

    expect(response.status()).toBe(303);
    const location = response.headers()['location'];
    expect(location).toBe('/iletisim?durum=eksik#iletisim-formu');
    expect(location).not.toMatch(/^https?:\/\//);
  });
});

test.describe('the development capture', () => {
  test('has no route in production', async ({ request }) => {
    // Two independent guards: `env.ts` refuses the capture transport in
    // production, and this route does not exist there. Both are asserted.
    const response = await request.get('/api/dev/outbox');
    expect(response.status()).toBe(404);
  });
});
