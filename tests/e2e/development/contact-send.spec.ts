import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * The send path, driven against the local capture.
 *
 * The SMTP credential does not exist yet (docs/OPEN-QUESTIONS.md B1/B3), so
 * this is where "does a submission actually produce a correct message?" is
 * answered. The development server runs with `MAIL_TRANSPORT=capture`:
 * nodemailer composes the identical RFC822 message and hands it to an
 * in-memory outbox instead of opening a socket, and `/api/dev/outbox` — which
 * 404s in production — reads it back.
 *
 * What this proves: the whole chain works, end to end, in a real browser.
 * What it cannot prove: that Google Workspace accepts the credential. That is
 * the one remaining step.
 *
 * ORDER INDEPENDENCE. The outbox is one in-memory list shared by every test on
 * this server, and the suite runs fully parallel. Clearing it per test made
 * each one clobber its neighbours — they passed alone and failed together,
 * which is the worst way for a test to be wrong. Nothing is cleared and nothing
 * is counted globally: each test tags its submission with a unique name and
 * asserts only about messages carrying that tag.
 */

async function outbox(request: APIRequestContext) {
  const response = await request.get('/api/dev/outbox');
  expect(response.status()).toBe(200);
  const body: { messages: { raw: string; envelope: unknown }[] } =
    await response.json();
  return body.messages;
}

/** Turkish is transfer-encoded in transit; decode before asserting on it. */
function decodeBody(raw: string): string {
  const [headers, ...rest] = raw.split(/\r?\n\r?\n/);
  const body = rest.join('\n\n');
  if (/content-transfer-encoding:\s*base64/i.test(headers ?? '')) {
    return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf8');
  }
  if (/content-transfer-encoding:\s*quoted-printable/i.test(headers ?? '')) {
    return Buffer.from(
      body
        .replace(/=\r?\n/g, '')
        .replace(/=([0-9A-F]{2})/g, (_, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        ),
      'binary',
    ).toString('utf8');
  }
  return body;
}

async function messagesTagged(request: APIRequestContext, tag: string) {
  const messages = await outbox(request);
  return messages.filter((message) => decodeBody(message.raw).includes(tag));
}

test.describe('sending, with JavaScript', () => {
  test('a real submission produces a real message', async ({
    page,
    request,
  }) => {
    const tag = 'DenemeGonderim';
    const challengeRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/altcha')) challengeRequests.push(req.url());
    });

    await page.goto('/iletisim');
    await page.fill('input[name="ad"]', tag);
    await page.fill('input[name="eposta"]', 'deneme@example.com');
    await page.selectOption('select[name="hizmet"]', { label: 'Hydrafacial' });
    await page.fill(
      'textarea[name="mesaj"]',
      'Hydrafacial hakkında bilgi almak istiyorum, teşekkürler.',
    );
    await page.check('input[name="onay"]');
    await page.click('button[type="submit"]');

    // The live region reports success in place — no navigation.
    await expect(page.locator('#iletisim-formu [role="status"]')).toContainText(
      'Mesajınız ulaştı',
    );
    await expect(page).not.toHaveURL(/durum=/);

    // A challenge was fetched, so the proof of work really ran.
    expect(challengeRequests.length).toBeGreaterThan(0);

    const messages = await messagesTagged(request, tag);
    expect(messages).toHaveLength(1);

    const raw = messages[0]!.raw;
    expect(raw).toMatch(/^Reply-To: .*deneme@example\.com/m);
    const body = decodeBody(raw);
    expect(body).toContain(tag);
    expect(body).toContain('deneme@example.com');
    expect(body).toContain('Hydrafacial');
    expect(body).toContain('Hydrafacial hakkında bilgi almak istiyorum');
  });

  test('the form clears after a successful send', async ({ page }) => {
    await page.goto('/iletisim');
    await page.fill('input[name="ad"]', 'DenemeTemizlik');
    await page.fill('input[name="eposta"]', 'deneme@example.com');
    await page.fill('textarea[name="mesaj"]', 'Yeterince uzun bir mesaj.');
    await page.check('input[name="onay"]');
    await page.click('button[type="submit"]');

    await expect(page.locator('#iletisim-formu [role="status"]')).toContainText(
      'Mesajınız ulaştı',
    );
    await expect(page.locator('input[name="ad"]')).toHaveValue('');
    await expect(page.locator('input[name="onay"]')).not.toBeChecked();
  });

  test('an invalid submission points at the fields, and sends nothing', async ({
    page,
    request,
  }) => {
    const tag = 'DenemeGecersiz';
    await page.goto('/iletisim');
    await page.fill('input[name="ad"]', tag);
    await page.fill('input[name="eposta"]', 'bu-bir-adres-degil');
    await page.fill('textarea[name="mesaj"]', 'Yeterince uzun bir mesaj.');
    // Consent deliberately left unchecked.
    await page.click('button[type="submit"]');

    await expect(page.locator('#iletisim-formu [role="status"]')).toContainText(
      'eksik ya da hatalı',
    );
    // The error is exposed as state, not only as a colour.
    await expect(page.locator('input[name="eposta"]')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page.locator('input[name="onay"]')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(await messagesTagged(request, tag)).toHaveLength(0);
  });

  test('a honeypot hit looks successful and sends nothing', async ({
    page,
    request,
  }) => {
    const tag = 'DenemeBotKapani';
    await page.goto('/iletisim');
    await page.fill('input[name="ad"]', tag);
    await page.fill('input[name="eposta"]', 'bot@example.com');
    await page.fill('textarea[name="mesaj"]', 'Yeterince uzun bir mesaj.');
    await page.check('input[name="onay"]');
    // A person cannot reach this field; a naive bot fills everything.
    await page
      .locator('input[name="website"]')
      .fill('https://spam.example', { force: true });
    await page.click('button[type="submit"]');

    await expect(page.locator('#iletisim-formu [role="status"]')).toContainText(
      'Mesajınız ulaştı',
    );
    expect(await messagesTagged(request, tag)).toHaveLength(0);
  });
});

test.describe('sending, without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a plain form POST delivers and reports on the page', async ({
    page,
    request,
  }) => {
    // Slower than it looks: with no JavaScript the page still swaps fonts, and
    // under a fully parallel run the layout takes a moment to settle before a
    // checkbox is stable enough to click.
    test.slow();

    const tag = 'BetikYokGonderim';
    await page.goto('/iletisim');
    await page.fill('input[name="ad"]', tag);
    await page.fill('input[name="eposta"]', 'betikyok@example.com');
    await page.fill(
      'textarea[name="mesaj"]',
      'JavaScript kapalıyken gönderilmiş bir mesaj.',
    );
    await page.check('input[name="onay"]');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/durum=gonderildi/);
    await expect(
      page.getByText('Mesajınız ulaştı', { exact: false }),
    ).toBeVisible();

    expect(await messagesTagged(request, tag)).toHaveLength(1);
  });

  test('the page token is what carried it — and only once', async ({
    page,
    request,
  }) => {
    test.slow();

    const tag = 'TekrarKullanim';
    // Scrape the token the browser would have posted, then try to reuse it.
    await page.goto('/iletisim');
    const token = await page.locator('input[name="form_token"]').inputValue();

    const body = {
      ad: tag,
      eposta: 'tekrar@example.com',
      mesaj: 'Yeterince uzun bir mesaj gövdesi.',
      onay: 'true',
      form_token: token,
    };

    const first = await request.post('/api/contact', {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.1.0.1' },
      form: body,
    });
    expect(first.status()).toBe(200);

    const replay = await request.post('/api/contact', {
      headers: { accept: 'application/json', 'x-forwarded-for': '10.1.0.1' },
      form: body,
    });
    expect(replay.status()).toBe(400);

    // One message, not two.
    expect(await messagesTagged(request, tag)).toHaveLength(1);
  });
});
