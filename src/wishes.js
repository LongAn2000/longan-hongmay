// Lời chúc, theo mẫu thaiha-wedding.web.app:
// - Phần "Lời Chúc": tổng số, danh sách mới nhất ở trên (cuộn trong khung), ô viết lời chúc.
// - Máy tính: cột lời chúc chạy chậm từ dưới lên ở mép trái màn hình.
// Dữ liệu là cột "Lời nhắn" của Google Sheet, đọc qua Apps Script (GET cùng URL /exec với RSVP).
const RAIL_SPEED = 20; // px/giây, như mẫu
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
    <aside class="wishes-rail" id="wishes-rail" aria-hidden="true"><div class="wishes-rail-box"><div class="wishes-rail-track" id="wishes-rail-track"></div></div></aside>`);

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

  // ---- Cột chữ chạy (máy tính) ----
  const rail = $('#wishes-rail');
  const track = $('#wishes-rail-track');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let offset = 0, half = 0, last = 0;
  function buildRail(wishes) {
    track.replaceChildren();
    rail.classList.toggle('is-empty', !wishes.length);
    if (!wishes.length) return;
    const frag = document.createDocumentFragment();
    for (const w of reduced ? wishes : wishes.concat(wishes)) frag.append(item(w, 'div', 'rail-item'));
    track.append(frag);
    half = reduced ? 0 : track.scrollHeight / 2;
    offset = Math.min(offset, half);
  }
  function step(ts) {
    if (!last) last = ts;
    const dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    if (half > 0 && rail.getClientRects().length) { // ẩn (display: none) trên màn hình nhỏ thì không chạy
      offset += RAIL_SPEED * dt;
      if (offset >= half) offset -= half;
      track.style.transform = `translateY(${-offset}px)`;
    }
    requestAnimationFrame(step);
  }
  if (!reduced) requestAnimationFrame(step);
  // Cột bị ẩn khi dựng thì đo lại lúc đổi kích thước màn hình.
  addEventListener('resize', () => { if (track.children.length) half = reduced ? 0 : track.scrollHeight / 2; });

  function render() {
    const wishes = all();
    list.replaceChildren(...[...wishes].reverse().map(w => item(w, 'li', 'wish-item')));
    if (!wishes.length) list.innerHTML = '<li class="wish-empty">Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể!</li>';
    buildRail(wishes);
  }

  function add(name, text, { post = true } = {}) {
    const wish = { name: clean(name, 60) || 'Ẩn danh', text: clean(text, 300), time: new Date().toISOString() };
    if (!wish.text) return;
    local = [...local, wish]; writeLocal(local); render();
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

  // Ẩn cột chữ chạy khi phần Lễ cưới (rộng) đang trên màn hình.
  if ('IntersectionObserver' in window) {
    const wide = $('#events');
    if (wide) new IntersectionObserver(([entry]) => rail.classList.toggle('is-covered', entry.isIntersecting), { rootMargin: '-80px 0px' }).observe(wide);
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
