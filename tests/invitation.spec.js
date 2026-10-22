import { test, expect } from '@playwright/test';

async function openInvitation(page) {
  await page.goto('/');
  await page.locator('#invitation-intro').scrollIntoViewIfNeeded();
  await expect(page.locator('#invitation-intro')).toBeInViewport();
}

test('assets load locally and the invitation fits mobile and desktop screens', async ({ page }) => {
  const errors = [];
  const failures = [];
  const external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Luxurious Script' && font.status === 'loaded'))).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-cover.png' });
  await page.locator('#invitation-intro').scrollIntoViewIfNeeded();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1 span')).toHaveText(['Long An', 'Hồng Mây']);
  for (const width of [320, 375, 390, 430, 600, 767, 768, 820, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const expectedWidth = width >= 768 ? Math.min(573, width - 48) : Math.min(430, width);
    await expect.poll(() => page.locator('main').evaluate(element => element.getBoundingClientRect().width)).toBeCloseTo(expectedWidth, 0);
    await expect.poll(() => page.evaluate(() => {
      const card = document.querySelector('main').getBoundingClientRect();
      const actions = document.querySelector('#floating-actions').getBoundingClientRect();
      return actions.left >= card.left && actions.right <= card.right;
    })).toBe(true);
    const columns = await page.locator('.event-cards').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const image of await page.locator('main img').all()) await image.scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll('main img')].map(img => img.decode()));
  });
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
  await expect(page.locator('#album-count')).toHaveText('2 / 16');
  await expect(page.locator('.slide-outgoing')).toHaveCount(0);
  await page.getByRole('button', { name: 'Phóng to ảnh cưới' }).click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightbox-count')).toHaveText('3 / 16');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(page.locator('#open-lightbox')).toBeFocused();
  await page.getByRole('button', { name: 'Xem ảnh 16', exact: true }).click();
  await page.locator('.album-next').click();
  await expect(page.locator('#album-count')).toHaveText('1 / 16');
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
  await expect(page.locator('#album-count')).toHaveText('2 / 16');
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
  await expect(page.locator('#album-count')).toHaveText('1 / 16');
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
  await expect(page.locator('#album-count')).toHaveText('4 / 16');
  await expect(page.locator('#album-image')).toHaveAttribute('src', '/assets/album-4.jpg');
  await expect(page.locator('.slide-outgoing')).toHaveCount(0);

  await page.locator('#open-lightbox').click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightbox-count')).toHaveText('5 / 16');
  await expect(page.locator('.lightbox-stage .slide-outgoing')).toHaveCount(1);
  await expect(page.locator('.lightbox-stage .slide-outgoing')).toHaveCount(0);
});

test('wedding gifts show both recipients and copy their accounts independently', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.gift-role')).toHaveText(['Chú rể', 'Cô dâu']);
  await expect(page.locator('.gift-name')).toHaveText(['Long An', 'Hồng Mây']);
  await expect(page.locator('.qr-placeholder')).toHaveCount(2);
  await expect(page.locator('.copy-account')).toHaveCount(0);

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
  await page.getByRole('button', { name: 'Sao chép số tài khoản Hồng Mây', exact: true }).click();
  await page.getByRole('button', { name: 'Sao chép số tài khoản Long An', exact: true }).click();
  expect(await page.evaluate(() => window.copiedAccounts)).toEqual(['TEST_BRIDE_ACCOUNT', 'TEST_GROOM_ACCOUNT']);
  await expect(page.getByRole('link', { name: 'Tải mã QR Long An', exact: true })).toHaveAttribute('href', '/assets/hero.jpg');
  await expect(page.getByRole('link', { name: 'Tải mã QR Hồng Mây', exact: true })).toHaveAttribute('href', '/assets/bride.jpg');
});

test('RSVP handles both attendance choices and persists a local response', async ({ page }) => {
  await openInvitation(page);
  await page.locator('[data-attending="yes"]').click();
  await page.getByLabel('Tên của bạn', { exact: true }).fill('Khách thử nghiệm');
  await page.getByLabel('Số người tham dự').selectOption('3');
  await page.getByLabel('Lời nhắn (không bắt buộc)').fill('Hẹn gặp hai bạn!');
  await page.getByRole('button', { name: 'Gửi xác nhận', exact: true }).click();
  await expect(page.locator('#rsvp-status')).toContainText('Đã xác nhận tham dự');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('longan-hongmay:rsvp')).guests)).toBe(3);
  await openInvitation(page);
  await expect(page.locator('#rsvp-status')).toContainText('Khách thử nghiệm');
  await page.locator('[data-attending="no"]').click();
  await expect(page.locator('#rsvp-guests-field')).toBeHidden();
  await page.getByRole('button', { name: 'Gửi xác nhận', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('longan-hongmay:rsvp')).guests)).toBe(0);
});

test('guestbook validates names, positions signatures, escapes messages, and persists', async ({ page }) => {
  await openInvitation(page);
  await page.getByRole('button', { name: 'Ký tên & gửi lời chúc', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp theo' }).click();
  await expect(page.locator('[data-panel="1"]')).toBeVisible();
  await page.getByLabel('Tên hoặc chữ ký của bạn').fill('Bạn thân');
  await page.getByRole('button', { name: 'Màu xanh lá', exact: true }).click();
  await page.getByRole('button', { name: 'Tiếp theo' }).click();
  await page.locator('#signature-picker').click({ position: { x: 100, y: 150 } });
  await page.locator('#signature-picker').press('ArrowRight');
  await page.getByRole('button', { name: 'Tiếp theo' }).click();
  await page.getByLabel('Lời chúc của bạn').fill('<img src=x onerror=alert(1)> Chúc hạnh phúc!');
  await page.getByRole('button', { name: 'Gửi lời chúc', exact: true }).click();
  await expect(page.locator('.board-signature')).toHaveText('Bạn thân');
  await expect(page.locator('.wish')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.wish img')).toHaveCount(0);
  await openInvitation(page);
  await expect(page.locator('.board-signature')).toHaveText('Bạn thân');
  await expect(page.locator('#signature-count')).toHaveText('1 lời chúc yêu thương');
});

test('scroll reveals work without reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openInvitation(page);
  await page.locator('.invitation-heading').scrollIntoViewIfNeeded();
  await expect(page.locator('.intro-message')).toHaveClass(/revealed/);
  await expect(page.locator('.invitation-heading')).toHaveCSS('opacity', '1');
  await page.locator('#guestbook').scrollIntoViewIfNeeded();
  await expect(page.locator('#guestbook .section-title')).toHaveClass(/revealed/);
  await page.getByRole('button', { name: 'Ký tên & gửi lời chúc', exact: true }).click();
  await expect(page.locator('#signature-dialog')).toBeVisible();
});


test('countdown uses the configured ceremony time in Vietnam and stops at zero', async ({page}) => {
  await page.clock.install({time:new Date('2026-11-28T07:58:59Z')});
  await page.clock.pauseAt(new Date('2026-11-28T07:59:00Z'));
  await page.goto('/');
  await expect(page.locator('[data-count="days"]')).toHaveText('00');
  await expect(page.locator('[data-count="minutes"]')).toHaveText('01');
  await page.clock.runFor(60000);
  for(const unit of ['days','hours','minutes','seconds']) await expect(page.locator('[data-count="'+unit+'"]')).toHaveText('00');
  await expect(page.locator('#countdown-message')).toContainText('Ngày chung đôi');
  await page.clock.runFor(10000);
  await expect(page.locator('[data-count="seconds"]')).toHaveText('00');
});
