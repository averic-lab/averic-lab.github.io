// 결정적 타임라인 엔진. 벽시계를 쓰지 않는다 — 녹화 스크립트가 render(ms)를 프레임마다 부른다.
// 브라우저에서 직접 열면 ?play 로 실시간 재생해 볼 수 있다(검토용).
(function () {
  const IN = 0.55, OUT = 0.4;
  const ease = p => 1 - Math.pow(1 - Math.min(Math.max(p, 0), 1), 3);
  const els = () => document.querySelectorAll('[data-t]');

  function fx(kind, p) {
    const q = 1 - p;
    switch (kind) {
      case 'up':   return `translateY(${q * 28}px)`;
      case 'down': return `translateY(${-q * 70}px)`;
      case 'pop':  return `scale(${0.82 + 0.18 * p})`;
      default:     return 'translate(0,0)';
    }
  }

  window.render = function (ms) {
    const t = ms / 1000;
    els().forEach(el => {
      const [a, b] = el.dataset.t.split(',').map(Number);
      let p = ease((t - a) / IN);
      if (!isNaN(b) && t > b) p = Math.min(p, 1 - ease((t - b) / OUT));
      el.style.opacity = p;
      el.style.setProperty('--fx', fx(el.dataset.fx || 'fade', t < a + IN ? p : 1));
    });
    if (window.extra) window.extra(t);
  };

  // 막대그래프가 차례로 자라는 효과: 시작초 start, 막대 간격 gap
  window.growBars = function (root, t, start, gap = 0.12) {
    root.querySelectorAll('.plot i').forEach((b, i) => {
      b.style.setProperty('--g', ease((t - start - i * gap) / 0.5).toFixed(3));
    });
  };
  window.ease = ease;

  window.addEventListener('load', () => {
    window.render(0);
    if (location.search.includes('play')) {
      const t0 = performance.now();
      const loop = () => { window.render((performance.now() - t0) % (window.DURATION * 1000)); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  });
})();

// 공통 엔딩 — 모든 숏폼이 같은 문장으로 끝난다(브랜드 서명). 홈페이지 「해질녘」 ③ 문장.
window.mountEnding = function (start) {
  const s = n => (start + n).toFixed(2);
  const heart = `<svg viewBox="0 0 100 100"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ff8a95"/><stop offset="1" stop-color="#e54b5e"/></linearGradient></defs>
    <path fill="url(#hg)" d="M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z"/></svg>`;
  const div = document.createElement('div');
  div.className = 'end'; div.dataset.t = s(0);
  div.innerHTML = `
    <p class="q q1" data-t="${s(0.6)}" data-fx="up">가족들은 늘<br>“난 괜찮아”라고 말합니다.</p>
    <p class="q q2" data-t="${s(2.2)}" data-fx="up"><em>하지만 정말 괜찮은 걸까요.</em></p>
    <div class="brand" data-t="${s(4.0)}" data-fx="pop">${heart}
      <div class="nm">안부</div><div class="sub">매일 자동으로 전해지는 안부</div>
      <div class="store">스토어에서 ‘안부’ 검색</div></div>`;
  document.querySelector('.v').appendChild(div);
};
