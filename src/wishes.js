// Lời chúc, theo mẫu thaiha-wedding.web.app:
// - Phần "Lời Chúc": tổng số, danh sách mới nhất ở trên (cuộn trong khung), ô viết lời chúc.
// - Góc dưới bên trái màn hình, kiểu bình luận TikTok Live: lời chúc lần lượt nổi lên, đẩy lời cũ lên trên rồi mờ dần.
// Dữ liệu là cột "Lời nhắn" của Google Sheet, đọc qua Apps Script (GET cùng URL /exec với RSVP).
const FEED_EVERY = 2600; // ms giữa hai lời chúc nổi lên
const FEED_MAX = 5;      // số lời chúc giữ trên màn hình cùng lúc
const LOCAL_KEY = 'longan-hongmay:my-wishes';

const readLocal = () => { try { const v = JSON.parse(localStorage.getItem(LOCAL_KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
const writeLocal = list => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(-50))); } catch {} };
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const valid = w => w && typeof w.text === 'string' && w.text.trim();

export function initWishes({ endpoint, toast }) {
  const $ = s => document.querySelector(s);
  const list = $('#wishes-list');
  if (!list) return { add() {} };

  const formHtml = id => `<form class="wish-form" id="${id}" autocomplete="on">
      <input name="name" type="text" maxlength="60" placeholder="Tên (tuỳ chọn)" aria-label="Tên của bạn (tuỳ chọn)">
      <input name="text" type="text" maxlength="300" placeholder="Viết lời chúc…" aria-label="Lời chúc" required>
      <button type="submit" aria-label="Gửi lời chúc"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg><span>Gửi</span></button>
    </form>`;
  $('#wish-form-slot').innerHTML = formHtml('wish-form-inline');
  document.body.insertAdjacentHTML('beforeend', `
    <aside class="wish-feed" id="wish-feed" aria-hidden="true"><div class="wish-feed-list" id="wish-feed-list"></div></aside>`);

  let remote = [];
  let remoteOk = false; // chỉ gửi lên Sheet khi Apps Script đã có phần đọc lời chúc (tránh ghi nhầm thành "Không" tham dự)
  let local = readLocal().filter(valid);
  const all = () => {
    const seen = new Set(remote.map(w => `${w.name}\u0000${w.text}`));
    return [...remote, ...local.filter(w => !seen.has(`${w.name}\u0000${w.text}`))];
  };

  const item = (w, tag, cls) => {
    const el = document.createElement(tag); el.className = cls;
    const name = document.createElement(tag === 'li' ? 'p' : 'div'); name.className = 'wish-name'; name.textContent = w.name || 'Ẩn danh';
    const text = document.createElement(tag === 'li' ? 'p' : 'div'); text.className = 'wish-text'; text.textContent = w.text;
    el.append(name, text); return el;
  };

  // ---- Lời chúc nổi kiểu TikTok Live (góc dưới trái) ----
  const feed = $('#wish-feed');
  const feedList = $('#wish-feed-list');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let queue = [], next = 0, timer = 0;
  const bubble = w => {
    const el = document.createElement('div'); el.className = 'feed-item';
    const avatar = document.createElement('span'); avatar.className = 'feed-avatar';
    avatar.textContent = (w.name || 'Ẩn danh').trim().split(/\s+/).pop().charAt(0).toUpperCase();
    const body = document.createElement('span'); body.className = 'feed-body';
    const name = document.createElement('span'); name.className = 'feed-name'; name.textContent = w.name || 'Ẩn danh';
    const text = document.createElement('span'); text.className = 'feed-text'; text.textContent = w.text;
    body.append(name, text); el.append(avatar, body); return el;
  };
  function pushBubble(w) {
    const el = bubble(w);
    feedList.append(el);
    if (!reduced) {
      // Lời mới vào từ dưới: cả danh sách đang ở thấp hơn đúng một dòng rồi trượt lên, lời mới hiện dần.
      const shift = el.offsetHeight + 8;
      feedList.style.transition = 'none';
      feedList.style.transform = `translateY(${shift}px)`;
      feedList.getBoundingClientRect();
      feedList.style.transition = '';
      feedList.style.transform = '';
    }
    requestAnimationFrame(() => el.classList.add('is-in'));
    while (feedList.children.length > FEED_MAX) feedList.firstElementChild.remove();
  }
  function tick() {
    if (queue.length && !document.documentElement.classList.contains('intro-open') && !document.hidden) {
      pushBubble(queue[next % queue.length]);
      next = (next + 1) % queue.length;
    }
    timer = setTimeout(tick, FEED_EVERY);
  }
  function setFeed(wishes) {
    queue = wishes;
    feed.classList.toggle('is-empty', !wishes.length);
    if (next >= queue.length) next = 0;
    if (!timer && wishes.length) timer = setTimeout(tick, 600);
  }

  function render() {
    const wishes = all();
    list.replaceChildren(...[...wishes].reverse().map(w => item(w, 'li', 'wish-item')));
    if (!wishes.length) list.innerHTML = '<li class="wish-empty">Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể!</li>';
    setFeed(wishes);
  }

  function add(name, text, { post = true } = {}) {
    const wish = { name: clean(name, 60) || 'Ẩn danh', text: clean(text, 300), time: new Date().toISOString() };
    if (!wish.text) return;
    local = [...local, wish]; writeLocal(local); render();
    pushBubble(wish); // lời chúc vừa gửi nổi lên ngay
    list.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
    if (!post) return;
    if (!endpoint || !remoteOk) { toast('Cảm ơn bạn đã gửi lời chúc tới cô dâu chú rể!'); return; }
    fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'wish', name: wish.name, note: wish.text, createdAt: wish.time }) })
      .then(() => toast('Đã gửi lời chúc tới cô dâu chú rể. Cảm ơn bạn!'))
      .catch(() => toast('Chưa gửi được, bạn kiểm tra mạng rồi gửi lại giúp mình nhé.'));
  }

  for (const form of document.querySelectorAll('.wish-form')) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const text = form.elements.text.value.trim();
      if (!text) { form.elements.text.focus(); return; }
      add(form.elements.name.value, text);
      form.elements.text.value = '';
      form.elements.text.blur();
    });
  }

  render();
  if (endpoint) {
    fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}action=wishes`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (!data || !Array.isArray(data.wishes)) return;
        remote = data.wishes.filter(valid).map(w => ({ name: clean(w.name, 60) || 'Ẩn danh', text: clean(w.text, 300) }));
        remoteOk = true;
        // Lời chúc của chính khách đã có trên Sheet thì không cần giữ bản trên máy nữa.
        const onSheet = new Set(remote.map(w => `${w.name}\u0000${w.text}`));
        local = local.filter(w => !onSheet.has(`${w.name}\u0000${w.text}`)); writeLocal(local);
        render();
      })
      .catch(() => {});
  }

  return { add };
}
