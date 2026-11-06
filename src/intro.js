// Màn mở đầu "Save the Date": kéo cần gạt, ba ô quay dừng ở ngày / tháng / năm cưới,
// pháo giấy rơi, rồi nút "Xem thiệp mời" mở thiệp. Thêm ?intro=0 vào link để bỏ qua.
const ROW = 46; // chiều cao một hàng trong ô quay (px), khớp với --reel-row trong intro.css

export function initIntro({ wedding, onOpen }) {
  if (new URLSearchParams(location.search).get('intro') === '0') return;
  const [year, month, day] = wedding.date.split('-').map(Number);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = n => String(n).padStart(2, '0');
  const reels = [
    { label: 'Ngày', target: pad(day), pool: [...new Set([3, 7, 9, 12, 14, 18, 21, 25, day])].map(pad) },
    { label: 'Tháng', target: `THG ${month}`, pool: [...new Set([3, 6, 8, 9, 10, 12, month])].map(m => `THG ${m}`) },
    { label: 'Năm', target: String(year), pool: [year - 1, year, year + 1].map(String) },
  ];

  const intro = document.createElement('section');
  intro.className = 'slot-intro';
  intro.setAttribute('aria-label', 'Save the date');
  intro.innerHTML = `
    <canvas class="slot-confetti" aria-hidden="true"></canvas>
    <div class="slot-inner">
      <p class="slot-congrats" aria-hidden="true"><span>Chúc mừng</span><span>bạn đã nhận được thiệp mời</span></p>
      <div class="slot-machine">
        <svg class="slot-crown" viewBox="0 0 300 80" aria-hidden="true">
          <path id="slot-arc" d="M40 76 A150 150 0 0 1 260 76" fill="none"/>
          <text><textPath href="#slot-arc" startOffset="50%" text-anchor="middle">SAVE THE DATE</textPath></text>
        </svg>
        <div class="slot-lights" aria-hidden="true">${'<i></i>'.repeat(7)}</div>
        <div class="slot-window">
          ${reels.map((reel, i) => `<div class="slot-reel" data-reel="${i}" aria-label="${reel.label}"><div class="slot-strip"></div></div>`).join('')}
        </div>
        <div class="slot-plate" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="slot-tray" aria-hidden="true"><span>♥</span></div>
        <button class="slot-lever" type="button" aria-label="Kéo cần gạt để xem ngày cưới"><span class="slot-rod"></span><span class="slot-knob"></span></button>
      </div>
      <div class="slot-actions">
        <p class="slot-hint">Kéo cần gạt để nhận quà</p>
        <button class="slot-open" type="button" hidden>Xem Thiệp</button>
      </div>
      <p class="slot-result" aria-live="polite"></p>
    </div>`;
  document.body.prepend(intro);
  document.documentElement.classList.add('intro-open');
  scrollTo(0, 0);

  // Mỗi ô: dải số lặp nhiều vòng, phần tử cuối cùng là đáp án. Lúc đầu hiện trái tim.
  const strips = [...intro.querySelectorAll('.slot-strip')];
  strips.forEach(strip => { strip.innerHTML = '<span>♡</span>'.repeat(3); });
  const lever = intro.querySelector('.slot-lever');
  const machine = intro.querySelector('.slot-machine');
  const openButton = intro.querySelector('.slot-open');
  let spun = false;

  function spin() {
    if (spun) return;
    spun = true;
    intro.classList.add('is-spinning');
    lever.disabled = true;
    lever.classList.add('pulled');
    setTimeout(() => lever.classList.remove('pulled'), 450);
    const stops = reels.map((reel, i) => {
      const strip = strips[i];
      const loops = reduced ? 1 : 6 + i * 2;
      const items = ['♡'];
      for (let l = 0; l < loops; l++) items.push(...reel.pool);
      // Đáp án nằm ở hàng giữa, có một hàng phía trên và một hàng phía dưới.
      const others = reel.pool.filter(v => v !== reel.target);
      items.push(others[0] ?? reel.target, reel.target, others[1] ?? others[0] ?? reel.target);
      strip.innerHTML = items.map(v => `<span>${v}</span>`).join('');
      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      strip.getBoundingClientRect();
      const duration = reduced ? 300 : 1700 + i * 650;
      strip.style.transition = `transform ${duration}ms cubic-bezier(.12,.62,.18,1.04)`;
      strip.style.transform = `translateY(${-(items.length - 3) * ROW}px)`;
      return new Promise(resolve => setTimeout(() => { strip.parentElement.classList.add('landed'); resolve(); }, duration + 60));
    });
    Promise.all(stops).then(() => {
      intro.classList.remove('is-spinning');
      intro.classList.add('is-done');
      intro.querySelector('.slot-result').textContent = `Chúc mừng bạn đã nhận được thiệp mời. Ngày cưới: ${pad(day)} tháng ${month} năm ${year}`;
      openButton.hidden = false;
      openButton.focus({ preventScroll: true });
      if (!reduced) confetti(intro.querySelector('.slot-confetti'));
    });
  }

  lever.addEventListener('click', event => { event.stopPropagation(); spin(); });
  machine.addEventListener('click', spin);
  let dragY = null; // vuốt cần gạt xuống trên điện thoại cũng kích hoạt
  lever.addEventListener('pointerdown', event => { dragY = event.clientY; });
  addEventListener('pointerup', event => { if (dragY !== null && event.clientY - dragY > 25) spin(); dragY = null; });

  openButton.addEventListener('click', () => {
    onOpen?.();
    intro.classList.add('is-leaving');
    document.documentElement.classList.remove('intro-open');
    setTimeout(() => intro.remove(), reduced ? 0 : 900);
  });
}

function confetti(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  addEventListener('resize', size);
  const colors = ['#9e8b73', '#c7b8a5', '#796650', '#f2eadd', '#371a16', '#e6dccd']; // bảng màu nâu – kem của thiệp
  const pieces = Array.from({ length: 170 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * innerWidth * .5,
    y: innerHeight * .42 + (Math.random() - .5) * 80,
    vx: (Math.random() - .5) * 11,
    vy: -Math.random() * 13 - 4,
    w: 4 + Math.random() * 6, h: 7 + Math.random() * 9,
    r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
    c: colors[Math.floor(Math.random() * colors.length)],
    round: Math.random() < .3,
  }));
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, Math.min(1, (5200 - t) / 1200));
    for (const p of pieces) {
      p.vy += .28; p.vx *= .985; p.vy *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r)));
      ctx.restore();
    }
    if (t < 5200 && canvas.isConnected) requestAnimationFrame(frame);
    else { ctx.clearRect(0, 0, innerWidth, innerHeight); removeEventListener('resize', size); }
  })(start);
}
