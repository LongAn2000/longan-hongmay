import './style.css';
import './desktop.css';
import './backgrounds.css';
import './lace.css';
import './intro.css';
import { initIntro } from './intro.js';
import { wedding, rsvpEndpoint } from './config.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const e = escapeHtml;
const assetUrl = (path) => path.startsWith('/') && !path.startsWith('//') ? `${import.meta.env.BASE_URL}${path.slice(1)}` : path;
const icons = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  music: '<path d="M9 18V5l12-2v13M9 9l12-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="18" cy="16" rx="3" ry="3"/>',
  mute: '<path d="M9 18V5l12-2v10M9 9l12-2M17 17l5 5M22 17l-5 5"/><ellipse cx="6" cy="18" rx="3" ry="3"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H8a3 3 0 1 1 3-3l1 3ZM12 8h4a3 3 0 1 0-3-3l-1 3Z"/>',
  map: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
  rings: '<circle cx="8" cy="14" r="6.5"/><circle cx="8" cy="14" r="5"/><circle cx="16" cy="14" r="6.5"/><circle cx="16" cy="14" r="5"/><path d="m5 7-2-4 3-2 4 1 1 4M3 3l5 4M6 1l2 6 2-5"/>',
  banquet: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="5.3"/><path d="M2 2v6m2-6v6M1 2v4a2 2 0 0 0 4 0V2M3 8v14M22 2v20m0-20c-3 3-3 8 0 9M9 9l3 3-3 4m6-7-3 3 3 4M9 9c3-2 3 1 3 3 0-2 0-5 3-3M9 16c3 2 3-2 3-4 0 2 0 6 3 4"/>',
};
const icon = (name, extra = '') => `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const photo = (name, className = '', position = '50% 50%', eager = false) => `<img class="${className}" src="${e(assetUrl(wedding.images[name]))}" alt="Ảnh cưới ${e(wedding.groom)} và ${e(wedding.bride)}" style="object-position:${e(wedding.imagePositions?.[name] || position)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const decoration = (name, className = '') => `<img class="decoration ${className}" src="${assetUrl(`/assets/theme-${name}.png`)}" alt="" aria-hidden="true" loading="lazy">`;
const toDate = (iso) => new Date(`${iso}T12:00:00+07:00`);
const dateParts = (iso) => {
  const [year, month, day] = iso.split('-');
  return { year, month: Number(month), day, weekday: new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(toDate(iso)) };
};
const date = dateParts(wedding.date);
document.title = `Thiệp cưới ${wedding.groom} & ${wedding.bride}`;
const eventCard = (event) => {
  const day = dateParts(event.date);
  return `<article class="event-card reveal">
    <p class="event-invitation">Trân trọng kính mời<br>Quý khách đến dự buổi tiệc chung vui<br>cùng gia đình chúng tôi</p>
    <h3>${e(event.title)}</h3>
    <p class="event-couple script">${e(wedding.groom)}<span>&</span>${e(wedding.bride)}</p>
    ${decoration('venue', 'venue-illustration')}
    <div class="event-date"><span>${e(day.weekday)}</span><strong>${day.day} . ${String(day.month).padStart(2, '0')} . ${day.year}</strong><span>${e(event.time)}</span></div>
    ${event.venue ? `<h4>${e(event.venue)}</h4>` : ''}<p class="event-address">${e(event.address)}</p>
    ${event.mapUrl ? `<a class="map-link" href="${e(event.mapUrl)}" target="_blank" rel="noopener noreferrer">${icon('map')} Chỉ đường</a>` : ''}
  </article>`;
};

$('#app').innerHTML = `
  <main id="invitation" class="wedding-page">
    <header class="hero bg-frame" id="home">
      <div class="hero-rail">
        <p class="wedding-wordmark script" aria-hidden="true"><span>The</span><span>Wedding</span><span>Of</span></p>
        <h1><span>${e(wedding.groom)}</span><i aria-hidden="true">♥</i><span>${e(wedding.bride)}</span></h1>
        <div class="hero-round"><div class="hero-round-photo">${photo('heroRound', 'fill-image', '60% 50%', true)}</div><img class="hero-round-lace" src="${assetUrl('/assets/hero-lace.png')}" alt="" aria-hidden="true" fetchpriority="high"></div>
      </div>
      <div class="hero-portrait">${photo('heroPortrait', 'fill-image', '75% 50%', true)}</div>
    </header>

    <section class="invitation-intro bg-paper" id="invitation-intro">
      <div class="envelope-collage reveal">
        ${decoration('whiteFlower', 'collage-flower')}
        ${decoration('envelopeBack', 'envelope-back')}
        <div class="envelope-photo">${photo('invitation', 'fill-image', '54% 37%')}<span class="script">Forever</span></div>
        ${decoration('envelopeFront', 'envelope-front')}
        <div class="photo-strip">${['stripTop', 'stripMiddle', 'stripBottom'].map(name => `<div>${photo(name, 'fill-image')}</div>`).join('')}</div>
        <div class="date-tag">${decoration('dateTag')}<p>${date.day}<span>${new Intl.DateTimeFormat('en', {month:'short',timeZone:'Asia/Ho_Chi_Minh'}).format(toDate(wedding.date))}</span>${date.year.slice(-2)}</p></div>
      </div>
      <div class="intro-message reveal"><span class="eyebrow">THE WEDDING INVITATION</span><h2 class="invitation-heading">Thư mời chung vui</h2><p>Hạnh phúc của chúng mình sẽ trọn vẹn hơn<br>khi có bạn cùng sẻ chia.</p></div>
    </section>

    <section class="events-section bg-frame" id="events">
      <div class="family-section" aria-label="Thông tin hai gia đình">
        <div class="family reveal"><h2>Nhà Trai</h2>${wedding.groomFamily.map(name => `<p>${e(name)}</p>`).join('')}</div>
        <div class="family reveal"><h2>Nhà Gái</h2>${wedding.brideFamily.map(name => `<p>${e(name)}</p>`).join('')}</div>
      </div>
      <div class="event-cards">${wedding.events.map(eventCard).join('')}</div>
      ${decoration('calla', 'event-flower')}
    </section>

    <section class="photo-interlude" aria-label="Khoảnh khắc của chúng mình">${photo('celebration', 'fill-image', '61% 46%')}<div class="interlude-caption"><span class="eyebrow">TOGETHER IS A BEAUTIFUL PLACE TO BE</span><p class="script">You, me & forever</p></div></section>

    <section class="schedule-section bg-paper" aria-label="Chương trình ngày cưới">
      <div class="section-title reveal"><h2 class="script">Timeline</h2></div>
      <div class="schedule-path reveal">${wedding.timeline.map(event => `<article class="schedule-stop"><span class="schedule-symbol" aria-hidden="true">${icon(event.icon)}</span><span class="schedule-marker" aria-hidden="true">${icon('heart', 'filled')}</span><div class="schedule-details"><p class="schedule-date">${dateParts(event.date).day}.${String(dateParts(event.date).month).padStart(2,'0')}.${dateParts(event.date).year}</p><strong>${e(event.time)}</strong><h3>${event.title.split('\n').map(line => `<span class="schedule-title-line">${e(line)}</span>`).join(' ')}</h3></div></article>`).join('')}</div>
      <div class="dresscode reveal"><h2 class="script">Dresscode</h2><p>TRANG PHỤC LỊCH SỰ, PHÙ HỢP</p><div class="dresscode-colors" aria-label="Gợi ý màu trang phục: kem, be, nâu"><span></span><span></span><span></span></div></div>
    </section>

    <section class="couple-section bg-frame" id="couple">
      <div class="story-card reveal">
        <img class="story-lace" src="${assetUrl('/assets/story-lace.png')}" alt="" aria-hidden="true" loading="lazy">
        <div class="story-text">
          <p class="story-eyebrow">Our story</p>
          <h2 class="story-names script">${e(wedding.groom)}<span>&amp;</span>${e(wedding.bride)}</h2>
          <p class="story-body">Từ hai hành trình riêng biệt, chúng mình đã gặp nhau, chọn ở lại và cùng viết nên một câu chuyện mang tên chúng ta. Chỉ mong từ hôm nay và mãi về sau, mỗi niềm vui đều có nhau để sẻ chia, mỗi chặng đường đều có một bàn tay để nắm lấy.</p>
        </div>
      </div>
      <div class="story-photos reveal">
        <figure class="polaroid polaroid-bride"><div class="portrait">${photo('bride', 'fill-image', '51% 30%')}</div><figcaption><span class="script">Cô dâu</span><strong>${e(wedding.bride)}</strong></figcaption></figure>
        <figure class="polaroid polaroid-groom"><div class="portrait">${photo('groom', 'fill-image', '46% 28%')}</div><figcaption><span class="script">Chú rể</span><strong>${e(wedding.groom)}</strong></figcaption></figure>
      </div>
    </section>

    <div class="section-group bg-paper">
    <section class="countdown-section" aria-label="Đếm ngược đến ngày cưới">
      <div class="section-title reveal"><h2 class="script">Counting the moments</h2><p>CÙNG ĐẾM NGƯỢC ĐẾN NGÀY CHUNG ĐÔI</p></div>
      <div class="countdown reveal" id="countdown" role="timer" aria-label="Thời gian còn lại đến ngày cưới">${[['days','Ngày'],['hours','Giờ'],['minutes','Phút'],['seconds','Giây']].map(([key,label]) => `<div><strong data-count="${key}">00</strong><span>${label}</span></div>`).join('')}</div>
      <p class="countdown-message" id="countdown-message"></p>
    </section>

    <section class="calendar-section" aria-label="Lịch cưới"><div class="calendar-paper reveal"><span class="eyebrow">SAVE OUR DATE · ${date.year}</span><h2 class="script" id="calendar-month"></h2><div class="calendar-grid" id="calendar-grid"></div></div></section>
    </div>

    <section class="editorial-section bg-frame" aria-label="Câu chuyện tình yêu qua ảnh">
      <div class="section-title reveal"><h2 class="script">The Album</h2><p>A LITTLE OF OUR FOREVER</p></div>
      <div class="editorial-collage reveal"><div class="editorial-tall">${photo('calendar','fill-image')}</div><div class="editorial-right"><div class="editorial-wide">${photo('couple','fill-image')}</div><p class="editorial-whispers">WHISPERS</p><div class="editorial-label"><span>AFFECTION</span><p>TWO HEARTS<br>ONE LOVE</p></div></div></div>
      <div class="vertical-rule" aria-hidden="true"></div>
    </section>

    <section class="album-section bg-paper" id="album">
      <div class="section-title reveal"><span class="eyebrow">OUR MEMORIES</span><h2 class="script">Những ngày có nhau</h2><div class="tiny-divider">♥</div></div>
      <div class="album-viewer reveal" aria-roledescription="trình chiếu" aria-label="Album ảnh cưới">
        <button class="album-image-button" id="open-lightbox" aria-label="Phóng to ảnh cưới"><img id="album-image" src="${e(assetUrl(wedding.album[0].src))}" style="object-position:${e(wedding.album[0].position)}" alt="Ảnh cưới 1" loading="lazy"></button>
        <button class="round-button album-prev" data-album-direction="-1" aria-label="Ảnh trước">${icon('left')}</button>
        <button class="round-button album-next" data-album-direction="1" aria-label="Ảnh sau">${icon('right')}</button>
        <span class="album-count" id="album-count" aria-live="polite">1 / ${wedding.album.length}</span>
      </div>
      <div class="album-thumbnails" aria-label="Chọn ảnh">${wedding.album.map((image, i) => `<button class="thumbnail ${i === 0 ? 'active' : ''}" data-photo="${i}" aria-label="Xem ảnh ${i + 1}" aria-pressed="${i === 0}"><img src="${e(assetUrl(image.src))}" alt="" loading="lazy" style="object-position:${image.position}"></button>`).join('')}</div>
    </section>


    <div class="section-group bg-frame">
    <section class="rsvp-section" id="rsvp">
      
      <div class="section-title reveal"><h2 class="script">Tham Dự</h2><p>XÁC NHẬN THAM DỰ</p><div class="tiny-divider">♥</div></div>
      <p class="rsvp-intro reveal">Vui lòng xác nhận sự tham dự để chúng mình chuẩn bị đón tiếp bạn một cách chu đáo nhất. Trân trọng cảm ơn!</p><div class="rsvp-options reveal">
        <button class="rsvp-option" data-attending="yes">${icon('check')}<span>Có, tôi sẽ<br>tham dự</span></button>
        <button class="rsvp-option rsvp-decline" data-attending="no">${icon('close')}<span>Rất tiếc, chưa<br>sắp xếp được</span></button>
      </div>
      <p id="rsvp-status" class="rsvp-status" aria-live="polite"></p>
    </section>

    <section class="gift-section" id="gift">
      <div class="section-title reveal"><h2 class="script">Hộp Mừng Cưới</h2><p>Wedding Gift</p><div class="tiny-divider">♥</div></div>
      <p class="gift-intro reveal">Gia đình chúng tôi rất hân hạnh được đón tiếp !</p>
      <div class="gift-cards">${wedding.gifts.map((gift, index) => `<article class="gift-card reveal" aria-label="Mừng cưới ${e(gift.role)} ${e(gift.name)}"><p class="gift-role">${e(gift.role)}</p>
        ${gift.qrImage ? `<img class="gift-qr" src="${e(assetUrl(gift.qrImage))}" alt="Mã QR mừng cưới ${e(gift.name)}" loading="lazy"><a class="download-qr" href="${e(assetUrl(gift.qrImage))}" download="qr-mung-cuoi-${index + 1}.png" aria-label="Tải mã QR ${e(gift.name)}">${icon('download')} Tải mã QR</a>` : `<div class="qr-placeholder">${icon('gift')}<span>Trân trọng cảm ơn</span><small>Mã QR sẽ được cập nhật</small></div>`}
        <h3 class="gift-name">${e(gift.name)}</h3>
        ${gift.bank ? `<p class="gift-bank">${e(gift.bank)}</p>` : ''}
        ${gift.account ? `<button class="copy-account" data-copy-gift="${index}" aria-label="Sao chép số tài khoản ${e(gift.name)}"><span>${e(gift.account)}</span><small>Sao chép tài khoản</small></button>` : ''}
      </article>`).join('')}</div>
    </section>
    </div>

    <div class="closing-photo">${photo('footer', 'fill-image', '45% 40%')}</div><footer class="closing-footer bg-paper"><img class="monogram" src="${assetUrl('/assets/monogram-am.png')}" alt="" aria-hidden="true" loading="lazy"><div class="closing-text reveal"><h2 class="script">Thank you</h2><p>${e(wedding.groom)} & ${e(wedding.bride)}</p><span>${e(wedding.thankYou)}</span></div></footer>
  </main>

  <nav class="floating-actions" id="floating-actions" aria-label="Điều hướng thiệp">
    <button class="round-button music-button" id="toggle-music" aria-label="Bật nhạc" aria-pressed="false">${icon('mute')}</button>
    <a class="round-button" href="#rsvp" aria-label="Xác nhận tham dự">${icon('check')}</a>
    <a class="round-button" href="#gift" aria-label="Hộp mừng cưới">${icon('gift')}</a>
    <a class="round-button to-top" href="#home" aria-label="Về đầu thiệp">${icon('down')}</a>
  </nav>
  <audio id="background-music" src="${e(assetUrl(wedding.music))}" loop preload="none"></audio>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <dialog class="lightbox" id="lightbox" aria-label="Ảnh cưới phóng to">
    <button class="round-button dialog-close" data-close-dialog aria-label="Đóng ảnh">${icon('close')}</button>
    <button class="round-button lightbox-prev" data-album-direction="-1" aria-label="Ảnh trước">${icon('left')}</button>
    <div class="lightbox-stage"><img id="lightbox-image" alt="Ảnh cưới phóng to"></div><button class="round-button lightbox-next" data-album-direction="1" aria-label="Ảnh sau">${icon('right')}</button>
    <p class="lightbox-count" id="lightbox-count"></p>
  </dialog>

  <dialog class="form-dialog" id="rsvp-dialog" aria-labelledby="rsvp-dialog-title">
    <button class="round-button dialog-close" data-close-dialog aria-label="Đóng">${icon('close')}</button>
    <h2 class="script" id="rsvp-dialog-title">Hẹn gặp bạn</h2><p class="dialog-description" id="rsvp-dialog-description"></p>
    <form id="rsvp-form"><label for="rsvp-name">Tên của bạn</label><input id="rsvp-name" name="name" autocomplete="name" required maxlength="80" placeholder="Nhập tên của bạn">
      <div id="rsvp-guests-field"><label for="rsvp-guests">Số người tham dự</label><select id="rsvp-guests" name="guests">${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1} người</option>`).join('')}</select></div>
      <label for="rsvp-note">Lời nhắn (không bắt buộc)</label><textarea id="rsvp-note" name="note" rows="3" maxlength="500" placeholder="Gửi một lời nhắn tới cô dâu chú rể..."></textarea>
      <p class="local-notice">Bản xem thử: xác nhận được lưu trên trình duyệt này.</p><button class="primary-button" type="submit">${icon('check')} Gửi xác nhận</button>
    </form>
  </dialog>

`;

// Calendar: the Monday-first grid and highlighted dates follow the configuration.
const firstDay = (toDate(`${date.year}-${String(date.month).padStart(2, '0')}-01`).getUTCDay() + 6) % 7;
const daysInMonth = new Date(Date.UTC(Number(date.year), date.month, 0)).getUTCDate();
const eventDays = wedding.events.filter(event => event.date.slice(0, 7) === wedding.date.slice(0, 7)).map(event => Number(event.date.slice(-2)));
$('#calendar-month').textContent = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(toDate(wedding.date));
$('#calendar-grid').innerHTML = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `<b>${day}</b>`).join('') + '<span></span>'.repeat(firstDay) + Array.from({ length: daysInMonth }, (_, i) => `<span class="${eventDays.includes(i + 1) ? 'wedding-day' : ''}">${eventDays.includes(i + 1) ? icon('heart', 'filled') : ''}<em>${i + 1}</em></span>`).join('');

// Reveals are progressive enhancement: the content stays visible if unsupported.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('IntersectionObserver' in window && !reducedMotion) {
  document.documentElement.classList.add('has-reveals');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(element => observer.observe(element));
}

let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}

const audio = $('#background-music');
const musicButton = $('#toggle-music');
function syncMusic() {
  const playing = !audio.paused;
  musicButton.innerHTML = icon(playing ? 'music' : 'mute');
  musicButton.setAttribute('aria-label', playing ? 'Tắt nhạc' : 'Bật nhạc');
  musicButton.setAttribute('aria-pressed', String(playing));
  musicButton.classList.toggle('playing', playing);
}
audio.volume = 0.35;
audio.addEventListener('play', syncMusic);
audio.addEventListener('pause', syncMusic);
if (!wedding.music) { musicButton.hidden = true; audio.removeAttribute('src'); }
musicButton.addEventListener('click', async () => {
  if (!audio.paused) { audio.pause(); return; }
  try { await audio.play(); } catch { toast('Chưa phát được nhạc. Bạn thử bật lại nhé.'); }
});
function startMusic() {
  if (wedding.music) audio.play().catch(() => syncMusic());
}
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('#toggle-music')) startMusic();
}, {once:true});

const ceremony = wedding.events.find(event => event.date === wedding.date) || wedding.events[0];
const countdownTarget = new Date(`${wedding.date}T${ceremony?.time || '00:00'}:00+07:00`).getTime();
function updateCountdown() {
  const remaining = Math.max(0, Math.floor((countdownTarget - Date.now()) / 1000));
  const units = {days:Math.floor(remaining / 86400), hours:Math.floor(remaining / 3600) % 24, minutes:Math.floor(remaining / 60) % 60, seconds:remaining % 60};
  for (const [key,value] of Object.entries(units)) $(`[data-count="${key}"]`).textContent = String(value).padStart(2,'0');
  $('#countdown-message').textContent = remaining ? 'Mong chờ ngày được gặp bạn!' : 'Ngày chung đôi · Mãi mãi bên nhau';
}
updateCountdown();
setInterval(updateCountdown, 1000);

let activePhoto = 0;
let photoRequest = 0;
const photoTransitions = new WeakMap();

function transitionPhoto(element, image, index, direction) {
  const previous = photoTransitions.get(element);
  if (previous) {
    previous.animations.forEach(animation => animation.cancel());
    previous.outgoing.remove();
    photoTransitions.delete(element);
  }
  const animate = direction && !reducedMotion && element.src && element.getClientRects().length && typeof element.animate === 'function';
  const outgoing = animate ? element.cloneNode() : null;
  if (outgoing) {
    outgoing.removeAttribute('id');
    outgoing.alt = '';
    outgoing.setAttribute('aria-hidden', 'true');
    outgoing.classList.add('slide-outgoing');
    element.after(outgoing);
  }
  element.src = assetUrl(image.src);
  element.style.objectPosition = image.position;
  element.alt = `Ảnh cưới ${index + 1}`;
  if (!outgoing) return;

  // The next image enters from the right; the previous image enters from the left.
  const options = { duration: 700, easing: 'cubic-bezier(.22,.61,.36,1)' };
  const incomingAnimation = element.animate([
    { transform: `translateX(${direction * 100}%)` },
    { transform: 'translateX(0)' },
  ], options);
  const outgoingAnimation = outgoing.animate([
    { transform: 'translateX(0)' },
    { transform: `translateX(${-direction * 100}%)` },
  ], options);
  const transition = { animations: [incomingAnimation, outgoingAnimation], outgoing };
  photoTransitions.set(element, transition);
  Promise.allSettled(transition.animations.map(animation => animation.finished)).then(() => {
    outgoing.remove();
    if (photoTransitions.get(element) === transition) photoTransitions.delete(element);
  });
}

async function showPhoto(index, direction = Math.sign(index - activePhoto)) {
  const previousIndex = activePhoto;
  activePhoto = (index + wedding.album.length) % wedding.album.length;
  const targetIndex = activePhoto;
  const request = ++photoRequest;
  const image = wedding.album[targetIndex];
  const preload = new Image();
  preload.src = assetUrl(image.src);
  try { await preload.decode(); }
  catch {
    if (request === photoRequest) {
      activePhoto = previousIndex;
      toast('Chưa tải được ảnh. Bạn thử chuyển lại nhé.');
    }
    return;
  }
  if (request !== photoRequest) return;
  transitionPhoto($('#album-image'), image, targetIndex, previousIndex === targetIndex ? 0 : direction);
  transitionPhoto($('#lightbox-image'), image, targetIndex, $('#lightbox').open && previousIndex !== targetIndex ? direction : 0);
  for (const selector of ['#album-count', '#lightbox-count']) $(selector).textContent = `${activePhoto + 1} / ${wedding.album.length}`;
  $$('.thumbnail').forEach((button, index) => {
    button.classList.toggle('active', index === activePhoto);
    button.setAttribute('aria-pressed', String(index === activePhoto));
  });
  const selected = $(`.thumbnail[data-photo="${activePhoto}"]`);
  const strip = $('.album-thumbnails');
  strip.scrollTo({ left: selected.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + selected.clientWidth / 2, behavior: reducedMotion ? 'instant' : 'smooth' });
}
$$('[data-album-direction]').forEach(button => button.addEventListener('click', () => showPhoto(activePhoto + Number(button.dataset.albumDirection))));
$$('[data-photo]').forEach(button => button.addEventListener('click', () => showPhoto(Number(button.dataset.photo))));
$('#open-lightbox').addEventListener('click', () => { showPhoto(activePhoto); $('#lightbox').showModal(); });
let swipeStart;
$('.album-viewer').addEventListener('touchstart', event => { swipeStart = event.changedTouches[0].clientX; }, { passive: true });
$('.album-viewer').addEventListener('touchend', event => {
  const delta = event.changedTouches[0].clientX - swipeStart;
  if (Math.abs(delta) > 50) showPhoto(activePhoto + (delta > 0 ? -1 : 1));
}, { passive: true });
document.addEventListener('keydown', event => {
  if (!$('#lightbox').open) return;
  if (event.key === 'ArrowLeft') showPhoto(activePhoto - 1);
  if (event.key === 'ArrowRight') showPhoto(activePhoto + 1);
});
$$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));

// Lưu RSVP và lời chúc trên máy khách; RSVP còn được gửi về Google Sheet nếu có rsvpEndpoint.
const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(`longan-hongmay:${key}`)) ?? fallback; } catch { return fallback; } },
  write(key, value) {
    try { localStorage.setItem(`longan-hongmay:${key}`, JSON.stringify(value)); return true; }
    catch { toast('Trình duyệt chưa cho phép lưu dữ liệu. Bạn kiểm tra chế độ riêng tư hoặc dung lượng nhé.'); return false; }
  },
};
let attending = 'yes';
const storedRsvp = storage.read('rsvp', null);
if (storedRsvp && typeof storedRsvp.name === 'string') {
  $('#rsvp-status').textContent = `${storedRsvp.name}: ${storedRsvp.attending === 'yes' ? 'Đã xác nhận tham dự' : 'Đã gửi lời hẹn dịp khác'}.`;
}
$$('[data-attending]').forEach(button => button.addEventListener('click', () => {
  attending = button.dataset.attending;
  $('#rsvp-dialog-title').textContent = attending === 'yes' ? 'Hẹn gặp bạn' : 'Cảm ơn bạn';
  $('#rsvp-dialog-description').textContent = attending === 'yes' ? 'Chúng mình rất vui khi có bạn cùng chung vui!' : 'Cảm ơn bạn đã gửi lời nhắn tới chúng mình.';
  $('#rsvp-guests-field').hidden = attending !== 'yes';
  if (storedRsvp?.name) $('#rsvp-name').value = storedRsvp.name;
  $('#rsvp-dialog').showModal();
}));
$('#rsvp-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('#rsvp-name').value.trim();
  if (!name) { $('#rsvp-name').setCustomValidity('Bạn nhập tên trước nhé.'); $('#rsvp-name').reportValidity(); return; }
  const response = { name, attending, guests: attending === 'yes' ? Number($('#rsvp-guests').value) : 0, note: $('#rsvp-note').value.trim(), createdAt: new Date().toISOString() };
  if (!storage.write('rsvp', response)) return;
  $('#rsvp-status').textContent = `${name}: ${attending === 'yes' ? 'Đã xác nhận tham dự' : 'Đã gửi lời hẹn dịp khác'}.`;
  $('#rsvp-dialog').close();
  if (!rsvpEndpoint) { toast('Đã lưu xác nhận trên thiết bị này. Cảm ơn bạn!'); return; }
  // Gửi về Google Sheet qua Apps Script. text/plain để trình duyệt không chặn CORS.
  fetch(rsvpEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(response) })
    .then(() => toast('Đã gửi xác nhận tới cô dâu chú rể. Cảm ơn bạn!'))
    .catch(() => toast('Chưa gửi được, bạn kiểm tra mạng rồi gửi lại giúp mình nhé.'));
});
$('#rsvp-name').addEventListener('input', event => event.target.setCustomValidity(''));

$$('[data-copy-gift]').forEach(button => button.addEventListener('click', async () => {
  const gift = wedding.gifts[Number(button.dataset.copyGift)];
  try { await navigator.clipboard.writeText(gift.account); toast(`Đã sao chép số tài khoản của ${gift.name}.`); }
  catch { toast(`Số tài khoản của ${gift.name}: ${gift.account}`); }
}));

// Màn mở đầu Save the Date; nút "Xem thiệp mời" mở thiệp và bật nhạc.
initIntro({ wedding, onOpen: startMusic });
