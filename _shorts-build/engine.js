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

// 공통 엔딩 — 기본은 홈 「해질녘」 ③ 문장(dawn_q3_html). 편마다 문장만 바꿀 수 있다(q1/q2),
// 배경·하트·앱 이름·스토어 안내는 모든 편이 같다(브랜드 서명).
window.mountEnding = function (start, q1 = L.q1, q2 = L.q2) {
  const s = n => (start + n).toFixed(2);
  const heart = `<svg viewBox="0 0 100 100"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ff8a95"/><stop offset="1" stop-color="#e54b5e"/></linearGradient></defs>
    <path fill="url(#hg)" d="M50,86 C-10,52 12,8 50,32 C88,8 110,52 50,86 Z"/></svg>`;
  const div = document.createElement('div');
  div.className = 'end'; div.dataset.t = s(0);
  div.innerHTML = `
    <p class="q q1" data-t="${s(0.6)}" data-fx="up">${q1}</p>
    <p class="q q2" data-t="${s(2.2)}" data-fx="up">${q2}</p>
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
// 주간 걸음수(7개, 마지막이 오늘) 하나로 카드 전체를 앱 규칙대로 채운다. 오늘 걸음수를 돌려준다.
//   · 막대 높이 = 최댓값 대비   · 상단 숫자 = 7일 최댓값(오늘이 아님)
//   · 활동량 라벨 = 7일 평균 ≥6000 아주 활동적 / ≥3000 활동적 / 그 외 운동 필요
//     (앱 guardian_dashboard_controller.dart 의 activityLabelFromSteps 와 같은 기준)
// 걸음수 기준: 성인 5,000보 이상, 고령자 1천 보대(딱 1,000 은 피한다) — README 참조
window.setWeek = function (week) {
  const mx = Math.max(...week), avg = week.reduce((a, b) => a + b, 0) / week.length;
  document.querySelectorAll('.plot').forEach(p => p.querySelectorAll('i').forEach((b, i) => {
    b.style.height = (week[i] / mx * 100).toFixed(1) + '%';
  }));
  document.querySelectorAll('.n-steps').forEach(e => { e.textContent = fmtNum(mx); });
  const act = avg >= 6000 ? L.act_very : avg >= 3000 ? L.act : L.act_need;
  document.querySelectorAll('[data-k="act"]').forEach(e => { e.textContent = act; });
  return week[week.length - 1];
};
window.pushBody = (who, n) => `${who} · ${L.steps_tpl.replace('@steps', fmtNum(n))}`;
