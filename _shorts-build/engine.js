// 언어 데이터 — ?lang=xx (기본 ko). gen.py 가 만든 data/<언어>.js 가 window.L 을 채운다.
// document.write 라 이 파일 뒤의 인라인 스크립트보다 먼저 실행된다.
(function () {
  const m = location.search.match(/[?&]lang=([A-Za-z-]+)/);
  document.write('<script src="data/' + (m ? m[1] : 'ko') + '.js"><\/script>');
})();

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

// 공통 엔딩 — 모든 숏폼이 같은 문장으로 끝난다(브랜드 서명). 홈 「해질녘」 ③ 문장(dawn_q3_html).
window.mountEnding = function (start) {
  const s = n => (start + n).toFixed(2);
  const heart = `<svg viewBox="0 0 100 100"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ff8a95"/><stop offset="1" stop-color="#e54b5e"/></linearGradient></defs>
    <path fill="url(#hg)" d="M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z"/></svg>`;
  const div = document.createElement('div');
  div.className = 'end'; div.dataset.t = s(0);
  div.innerHTML = `
    <p class="q q1" data-t="${s(0.6)}" data-fx="up">${L.q1}</p>
    <p class="q q2" data-t="${s(2.2)}" data-fx="up">${L.q2}</p>
    <div class="brand" data-t="${s(4.0)}" data-fx="pop">${heart}
      <div class="nm">${L.app_name}</div><div class="sub">${L.brand_sub}</div>
      <div class="store">${L.store}</div></div>`;
  document.querySelector('.v').appendChild(div);
};

// ── 언어별 채우기 ─────────────────────────────────────────────────────
// data-k="키" → 글자, data-h="키" → HTML. 시각·숫자는 브라우저 Intl(언어별 12/24시간제·자릿수 구분).
window.fillText = function () {
  document.documentElement.lang = L.bcp;
  document.documentElement.dir = L.dir;
  document.querySelectorAll('[data-k]').forEach(e => { e.textContent = L[e.dataset.k]; });
  document.querySelectorAll('[data-h]').forEach(e => { e.innerHTML = L[e.dataset.h]; });
};
const LOC = () => L.bcp + '-u-nu-latn';
window.fmtNum = n => new Intl.NumberFormat(LOC()).format(n);
const parts = (d, tz) => new Intl.DateTimeFormat(LOC(), { hour: 'numeric', minute: '2-digit', timeZone: tz }).formatToParts(d);
window.fmtTime = (d, tz = 'UTC') => parts(d, tz).map(p => p.value).join('');
// 시계 모양: 오전/오후(AM/PM)는 작게. 24시간제 언어는 그대로 숫자만.
window.clockHTML = (d, tz = 'UTC') => parts(d, tz).map(p => p.type === 'dayPeriod' ? `<b>${p.value}</b>` : p.value).join('').trim();
// 잠금 화면·상태 표시줄처럼 오전/오후를 빼는 자리
window.fmtShort = (d, tz = 'UTC') => parts(d, tz).filter(p => p.type !== 'dayPeriod').map(p => p.value).join('').trim();
window.fmtDate = (d, tz = 'UTC') => new Intl.DateTimeFormat(LOC(), { month: 'long', day: 'numeric', timeZone: tz }).format(d);
window.wall = (hh, mm) => new Date(Date.UTC(2026, 8, 19, hh, mm));   // 시간대 없는 '벽시계' 시각
window.pushBody = (who, n) => `${who} · ${L.steps_tpl.replace('@steps', fmtNum(n))}`;
