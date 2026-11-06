import { test, expect } from '@playwright/test';

// Không gọi Apps Script thật: GET trả danh sách lời chúc mẫu, POST trả ok. Test nào cần thì tự route lại.
const SAMPLE_WISHES = [
  { name: 'Cô Lan', text: 'Chúc hai cháu trăm năm hạnh phúc!' },
  { name: '', text: 'Mãi bên nhau nhé <3' },
];
test.beforeEach(async ({ page }) => {
  await page.route('https://script.google.com/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: route.request().method() === 'GET' ? JSON.stringify({ ok: true, wishes: SAMPLE_WISHES }) : '{"ok":true}',
  }));
});

async function openInvitation(page) {
  await page.goto('/?intro=0');
  await page.locator('#invitation-intro').scrollIntoViewIfNeeded();
  await expect(page.locator('#invitation-intro')).toBeInViewport();
}

test('assets load locally and the invitation fits mobile and desktop screens', async ({ page }) => {
  // Resizes through 11 widths and takes several screenshots of a ~11,000px page; give it room on slow machines.
  test.setTimeout(90000);
  const errors = [];
  const failures = [];
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  // The only intended outside call is the Apps Script endpoint (wishes are read from the Google Sheet).
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173') && !request.url().startsWith('data:') && !request.url().startsWith('https://script.google.com/')) external.push(request.url()); });
  await page.goto('/?intro=0');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Luxurious Script' && font.status === 'loaded'))).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-cover.png' });
  await page.locator('#invitation-intro').scrollIntoViewIfNeeded();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1 span')).toHaveText(['Long An', 'Hồng Mây']);
  for (const width of [320, 375, 390, 430, 600, 767, 768, 820, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const desktop = width >= 1024;
    // Desktop: the page frame is up to 1120px; the column sections inside stay 573px wide, zoomed 1.25× (1.4× from 1600px).
    const expectedWidth = desktop ? Math.min(1120, width) : width >= 768 ? Math.min(573, width - 48) : Math.min(430, width);
    await expect.poll(() => page.locator('main').evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(expectedWidth, 0);
    if (desktop) {
      const zoom = width >= 1600 ? 1.4 : 1.25;
      await expect.poll(() => page.locator('#invitation-intro').evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(573 * zoom, 0);
    }
    // Mobile/tablet: the buttons sit inside the card. Desktop: they sit in the screen's right corner.
    await expect.poll(() => page.evaluate(desktop => {
      const card = document.querySelector('main').getBoundingClientRect();
      const actions = document.querySelector('#floating-actions').getBoundingClientRect();
      if (desktop) return Math.abs(innerWidth - actions.right - 24) <= 1;
      return actions.left >= card.left && actions.right <= card.right;
    }, desktop)).toBe(true);
    // Desktop shows the groom's and bride's receptions side by side.
    const columns = await page.locator('.event-cards').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(desktop ? 2 : 1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const image of await page.locator('main img').all()) await image.scrollIntoViewIfNeeded();
  // Decode one at a time: decoding ~60 full-size photos at once exceeds Chromium's image-decode budget.
  // Under memory pressure decode() can still reject for an image that loaded fine, so a rejection only
  // counts as broken when the image has no pixels; broken images are reported by name.
  const broken = await page.evaluate(async () => {
    const out = [];
    for (const img of document.querySelectorAll('main img')) {
      try { await img.decode(); } catch { if (!img.complete || !img.naturalWidth) out.push(img.currentSrc || img.src); }
    }
    return out;
  });
  expect(broken).toEqual([]);
  await page.locator('#home').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/mobile-invitation.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/desktop-invitation.png' });
  await page.locator('#events').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/desktop-events.png' });
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.screenshot({ path: 'test-results/tablet-events.png' });
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test('album navigation, lightbox keyboard controls, and music work', async ({ page }) => {
  await openInvitation(page);
  await page.locator('.album-next').click();
  await expect(page.locator('#album-count')).toHaveText('2 / 38');
  await expect(page.locator('.slide-outgoing')).toHaveCount(0);
  await page.getByRole('button', { name: 'Phóng to ảnh cưới' }).click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightbox-count')).toHaveText('3 / 38');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(page.locator('#open-lightbox')).toBeFocused();
  await page.getByRole('button', { name: 'Xem ảnh 38', exact: true }).click();
  await page.locator('.album-next').click();
  await expect(page.locator('#album-count')).toHaveText('1 / 38');
  // Stop and restart the actual bundled audio file.
  await page.evaluate(() => document.querySelector('audio').pause());
  await page.getByRole('button', { name: 'Bật nhạc', exact: true }).click();
  await expect(page.locator('#toggle-music')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Tắt nhạc', exact: true }).click();
  await expect(page.locator('#toggle-music')).toHaveAttribute('aria-pressed', 'false');
});

test('album slides in the chosen direction and handles quick repeated clicks', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openInvitation(page);
  await page.locator('.album-next').click();
  await expect(page.locator('#album-count')).toHaveText('2 / 38');
  const movement = await page.locator('#album-image').evaluate(image => {
    const outgoing = image.parentElement.querySelector('.slide-outgoing');
    for (const layer of [image, outgoing]) {
      for (const animation of layer.getAnimations()) {
        animation.pause();
        animation.currentTime = 350;
      }
    }
    const frame = image.parentElement.getBoundingClientRect();
    return { incomingX: image.getBoundingClientRect().left - frame.left, outgoingX: outgoing.getBoundingClientRect().left - frame.left };
  });
  expect(movement.incomingX).toBeGreaterThan(0);
  expect(movement.outgoingX).toBeLessThan(0);
  await page.locator('.album-image-button').evaluate(button => button.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
  await expect(page.locator('.slide-outgoing')).toHaveCount(0);

  await page.locator('.album-prev').click();
  await expect(page.locator('#album-count')).toHaveText('1 / 38');
  const reverse = await page.locator('#album-image').evaluate(image => {
    const outgoing = image.parentElement.querySelector('.slide-outgoing');
    for (const layer of [image, outgoing]) {
      for (const animation of layer.getAnimations()) {
        animation.pause();
        animation.currentTime = 350;
      }
    }
    const frame = image.parentElement.getBoundingClientRect();
    return { incomingX: image.getBoundingClientRect().left - frame.left, outgoingX: outgoing.getBoundingClientRect().left - frame.left };
  });
  expect(reverse.incomingX).toBeLessThan(0);
  expect(reverse.outgoingX).toBeGreaterThan(0);
  await page.locator('.album-next').evaluate(button => { button.click(); button.click(); button.click(); });
  await expect(page.locator('#album-count')).toHaveText('4 / 38');
  await expect(page.locator('#album-image')).toHaveAttribute('src', '/assets/album-4.jpg');
  await expect(page.locator('.slide-outgoing')).toHaveCount(0);

  await page.locator('#open-lightbox').click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightbox-count')).toHaveText('5 / 38');
  await expect(page.locator('.lightbox-stage .slide-outgoing')).toHaveCount(1);
  await expect(page.locator('.lightbox-stage .slide-outgoing')).toHaveCount(0);
});

test('wedding gifts show both recipients and copy their accounts independently', async ({ page }) => {
  await page.goto('/?intro=0');
  // The section shows a single "Gửi quà mừng cưới" button; both accounts stay hidden until it is pressed.
  await expect(page.locator('#gift .gift-card, #gift .gift-intro')).toHaveCount(0);
  const dialog = page.locator('#gift-dialog');
  await expect(page.getByRole('img', { name: 'Mã QR mừng cưới Long An' })).toBeHidden();
  await page.getByRole('button', { name: 'Gửi quà mừng cưới' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.gift-role')).toHaveText(['Chú rể', 'Cô dâu']);
  await expect(dialog.locator('.gift-person')).toHaveText(['Long An', 'Hồng Mây']);
  await expect(dialog.getByRole('img', { name: 'Mã QR mừng cưới Long An' })).toHaveAttribute('src', '/assets/qr-long-an.png');
  await expect(dialog.getByRole('img', { name: 'Mã QR mừng cưới Hồng Mây' })).toHaveAttribute('src', '/assets/qr-hong-may.png');
  await expect(dialog.locator('.copy-account span')).toHaveText(['9966834597', '6839812027']);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // Supply test-only account and QR values without changing the real configuration.
  await page.route('**/src/config.js*', async route => {
    const response = await route.fetch();
    const body = await response.text() + `
      wedding.gifts[0].account = 'TEST_GROOM_ACCOUNT';
      wedding.gifts[0].qrImage = '/assets/hero.jpg';
      wedding.gifts[1].account = 'TEST_BRIDE_ACCOUNT';
      wedding.gifts[1].qrImage = '/assets/bride.jpg';
    `;
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    window.copiedAccounts = [];
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: async value => { window.copiedAccounts.push(value); },
    } });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Gửi quà mừng cưới' }).click();
  await page.getByRole('button', { name: 'Sao chép số tài khoản Hồng Mây', exact: true }).click();
  await page.getByRole('button', { name: 'Sao chép số tài khoản Long An', exact: true }).click();
  expect(await page.evaluate(() => window.copiedAccounts)).toEqual(['TEST_BRIDE_ACCOUNT', 'TEST_GROOM_ACCOUNT']);
  await expect(page.getByRole('link', { name: 'Tải mã QR Long An', exact: true })).toHaveAttribute('href', '/assets/hero.jpg');
  await expect(page.getByRole('link', { name: 'Tải mã QR Hồng Mây', exact: true })).toHaveAttribute('href', '/assets/bride.jpg');
  await dialog.getByRole('button', { name: 'Đóng' }).click();
  await expect(dialog).toBeHidden();
});

test('RSVP handles both attendance choices, persists locally and posts to the sheet', async ({ page }) => {
  // Chặn Apps Script để test không ghi vào Google Sheet thật.
  const posted = [];
  await page.route('https://script.google.com/**', route => {
    if (route.request().method() !== 'POST') return route.fallback();
    posted.push(JSON.parse(route.request().postData())); route.fulfill({ status: 200, body: '{"ok":true}' });
  });
  await openInvitation(page);
  await page.locator('[data-attending="yes"]').click();
  await page.getByLabel('Tên của bạn', { exact: true }).fill('Khách thử nghiệm');
  await page.getByLabel('Số người tham dự').selectOption('3');
  await page.getByLabel('Lời nhắn nhủ dành cho đôi bạn trẻ').fill('Hẹn gặp hai bạn!');
  await page.getByRole('button', { name: 'Gửi xác nhận', exact: true }).click();
  await expect(page.locator('#rsvp-status')).toContainText('Đã xác nhận tham dự');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('longan-hongmay:rsvp')).guests)).toBe(3);
  await openInvitation(page);
  await expect(page.locator('#rsvp-status')).toContainText('Khách thử nghiệm');
  await page.locator('[data-attending="no"]').click();
  await expect(page.locator('#rsvp-guests-field')).toBeHidden();
  await page.getByRole('button', { name: 'Gửi xác nhận', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('longan-hongmay:rsvp')).guests)).toBe(0);
  await expect.poll(() => posted.length).toBe(2);
  expect(posted[0]).toMatchObject({ name: 'Khách thử nghiệm', attending: 'yes', guests: 3, note: 'Hẹn gặp hai bạn!' });
  expect(posted[1]).toMatchObject({ name: 'Khách thử nghiệm', attending: 'no', guests: 0 });
});

test('scroll reveals work without reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openInvitation(page);
  await page.locator('.invitation-heading').scrollIntoViewIfNeeded();
  await expect(page.locator('.intro-message')).toHaveClass(/revealed/);
  await expect(page.locator('.invitation-heading')).toHaveCSS('opacity', '1');
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await expect(page.locator('#rsvp .section-title')).toHaveClass(/revealed/);
});


test('countdown uses the configured ceremony time in Vietnam and stops at zero', async ({page}) => {
  await page.clock.install({time:new Date('2026-11-28T07:58:59Z')});
  await page.clock.pauseAt(new Date('2026-11-28T07:59:00Z'));
  await page.goto('/?intro=0');
  await expect(page.locator('[data-count="days"]')).toHaveText('00');
  await expect(page.locator('[data-count="minutes"]')).toHaveText('01');
  await page.clock.runFor(60000);
  for(const unit of ['days','hours','minutes','seconds']) await expect(page.locator('[data-count="'+unit+'"]')).toHaveText('00');
  await expect(page.locator('#countdown-message')).toContainText('Ngày chung đôi');
  await page.clock.runFor(10000);
  await expect(page.locator('[data-count="seconds"]')).toHaveText('00');
});

test('save-the-date slot machine spins to the wedding date and opens the invitation', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('.slot-intro');
  await expect(intro).toBeVisible();
  await expect(page.locator('.slot-open')).toBeHidden();
  // The page behind cannot scroll while the intro is open.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  await page.getByRole('button', { name: 'Kéo cần gạt để xem ngày cưới' }).click();
  const open = page.getByRole('button', { name: 'Xem Thiệp' });
  await expect(open).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.slot-result')).toHaveText('Chúc mừng bạn đã nhận được thiệp mời. Ngày cưới: 28 tháng 11 năm 2026');
  // The middle row of each reel shows the date.
  const shown = await page.locator('.slot-strip').evaluateAll(strips => strips.map(strip => {
    const reel = strip.parentElement.getBoundingClientRect();
    const middle = reel.top + reel.height / 2;
    return [...strip.children].find(item => { const r = item.getBoundingClientRect(); return r.top <= middle && r.bottom >= middle; })?.textContent;
  }));
  expect(shown).toEqual(['28', 'THG 11', '2026']);
  await open.click();
  await expect(intro).toHaveCount(0);
  await expect(page.locator('#home')).toBeInViewport();
  await expect(page.locator('#toggle-music')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
});

test('wishes from the sheet pop up bottom-left like TikTok live comments, on desktop and phones', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?intro=0');
  // No wishes section, no left rail, no wish form: only the floating feed.
  await expect(page.locator('#wishes, .wishes-rail, .wish-form')).toHaveCount(0);
  const feed = page.locator('#wish-feed');
  await expect(feed).toBeVisible();
  await expect(feed.locator('.feed-item.is-in').first()).toBeVisible({ timeout: 4000 });
  await expect(feed.locator('.feed-name').first()).toHaveText('Cô Lan');
  await expect(feed.locator('.feed-avatar').first()).toHaveText('L');
  // Blank names show as "Ẩn danh"; text is rendered as text, not HTML.
  await expect(feed.locator('.feed-name').nth(1)).toHaveText('Ẩn danh', { timeout: 6000 });
  await expect(feed.locator('.feed-text').nth(1)).toHaveText('Mãi bên nhau nhé <3');
  expect(await feed.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  const box = await feed.boundingBox();
  expect(box.x).toBeLessThan(40);
  expect(box.y + box.height).toBeGreaterThan(900 - 60);
  // A note sent with the RSVP pops up straight away.
  await page.locator('[data-attending="yes"]').click();
  await page.getByLabel('Tên của bạn', { exact: true }).fill('Bạn Thân');
  await page.getByLabel('Lời nhắn nhủ dành cho đôi bạn trẻ').fill('Hạnh phúc nhé!');
  await page.getByRole('button', { name: 'Gửi xác nhận', exact: true }).click();
  await expect(feed.locator('.feed-text').last()).toHaveText('Hạnh phúc nhé!');
  await expect(feed.locator('.feed-name').last()).toHaveText('Bạn Thân');
  // Phones show the same feed.
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(feed).toBeVisible();
  // Bubbles are at most 40% of the screen wide.
  expect(await feed.evaluate(el => el.getBoundingClientRect().width)).toBeCloseTo(390 * 0.4, 0);
});

