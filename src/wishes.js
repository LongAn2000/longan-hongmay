// Lời chúc nổi kiểu bình luận TikTok Live ở góc dưới bên trái (máy tính và điện thoại):
// lời chúc lần lượt nổi lên, đẩy lời cũ lên trên; chạy hết danh sách một lần thì dừng.
// Dữ liệu là cột "Lời nhắn" của Google Sheet, đọc qua Apps Script (GET cùng URL /exec với RSVP).
// Khách gửi lời chúc qua ô "Lời nhắn nhủ dành cho đôi bạn trẻ" của form xác nhận tham dự.
const FEED_EVERY = 2600; // ms giữa hai lời chúc nổi lên
const FEED_MAX = 5;      // số lời chúc giữ trên màn hình cùng lúc
const LOCAL_KEY = 'longan-hongmay:my-wishes';

const readLocal = () => { try { const v = JSON.parse(localStorage.getItem(LOCAL_KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
const writeLocal = list => { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(-50))); } catch {} };
const clean = (value, max) => String(value ?? '').trim().slice(0, max);
const valid = w => w && typeof w.text === 'string' && w.text.trim();
const key = w => `${w.name}\u0000${w.text}`;

export function initWishes({ endpoint }) {
  document.body.insertAdjacentHTML('beforeend',
    '<aside class="wish-feed is-empty" id="wish-feed" aria-hidden="true"><div class="wish-feed-list" id="wish-feed-list"></div></aside>');
  const feed = document.querySelector('#wish-feed');
  const feedList = document.querySelector('#wish-feed-list');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let remote = [];
  let local = readLocal().filter(valid); // lời nhắn khách vừa gửi, giữ trên máy tới khi Sheet trả về
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
      // Lời mới vào từ dưới: cả danh sách đang thấp hơn đúng một dòng rồi trượt lên, lời mới hiện dần.
      const shift = el.offsetHeight + 8;
      feedList.style.transition = 'none';
      feedList.style.transform = `translateY(${shift}px)`;
      feedList.getBoundingClientRect();
      feedList.style.transition = '';
      feedList.style.transform = '';
    }
    requestAnimationFrame(() => el.classList.add('is-in'));
    // Giữ tối đa FEED_MAX lời và không cao quá --feed-max: bỏ hẳn lời cũ nhất thay vì cắt nửa chừng.
    const maxH = parseFloat(getComputedStyle(feed).getPropertyValue('--feed-max')) / 100 * innerHeight || innerHeight * 0.3;
    while (feedList.children.length > 1 && (feedList.children.length > FEED_MAX || feedList.offsetHeight > maxH)) feedList.firstElementChild.remove();
  }
  // Chạy lần lượt mỗi lời chúc đúng một lần; hết danh sách thì dừng, không lặp lại.
  function tick() {
    timer = 0;
    if (next >= queue.length) return;
    if (!document.documentElement.classList.contains('intro-open') && !document.hidden) pushBubble(queue[next++]);
    timer = setTimeout(tick, FEED_EVERY);
  }
  function refresh() {
    const seen = new Set(remote.map(key));
    queue = [...remote, ...local.filter(w => !seen.has(key(w)))];
    feed.classList.toggle('is-empty', !queue.length);
    if (!timer && next < queue.length) timer = setTimeout(tick, 600);
  }

  // Lời nhắn trong form tham dự: nổi lên ngay (đã được gửi lên Sheet cùng xác nhận).
  function add(name, text) {
    const wish = { name: clean(name, 60) || 'Ẩn danh', text: clean(text, 300) };
    if (!wish.text) return;
    local = [...local, wish]; writeLocal(local); refresh();
    pushBubble(wish);
  }

  refresh();
  if (endpoint) {
    fetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}action=wishes`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (!data || !Array.isArray(data.wishes)) return;
        remote = data.wishes.filter(valid).map(w => ({ name: clean(w.name, 60) || 'Ẩn danh', text: clean(w.text, 300) }));
        const onSheet = new Set(remote.map(key));
        local = local.filter(w => !onSheet.has(key(w))); writeLocal(local);
        refresh();
      })
      .catch(() => {});
  }

  return { add };
}
