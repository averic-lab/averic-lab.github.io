// 스토어 스크린샷 공통 — 문구 채우기와 앱 화면 빌더. (벽시계·타이머를 쓰지 않는다)
(function () {
  const m = location.search.match(/[?&]lang=([A-Za-z-]+)/), lang = m ? m[1] : 'ko';
  const hm = location.search.match(/[?&]h=([\d.]+)/);
  document.documentElement.style.setProperty('--H', (hm ? hm[1] : '932') + 'px');
  const nm = location.search.match(/[?&]n=(\d+)/);
  document.documentElement.style.setProperty('--N', nm ? nm[1] : '8');
  document.write('<script src="../_shorts-build/data/' + lang + '.js"><\/script>');
  document.write('<script src="copy/' + lang + '.js"><\/script>');
})();

window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = L.bcp; document.documentElement.dir = L.dir;
  const LOC = L.bcp + '-u-nu-latn';
  const lc = L.bcp.split('-')[0], SEP = ['de', 'es', 'it', 'nl', 'pt', 'tr', 'id', 'vi'].includes(lc) ? '.' : ['fr', 'ru', 'pl', 'sv'].includes(lc) ? '\u00a0' : ',';   // 앱 NumberText.format 과 같은 표
  const fmtNum = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, SEP);
  const fmtT = (h, m) => new Intl.DateTimeFormat(LOC, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 8, 19, h, m)));
  const fmtShort = (h, m) => new Intl.DateTimeFormat(LOC, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC', hour12: false }).format(new Date(Date.UTC(2026, 8, 19, h, m)));
  const WEEK = { mom: [5120, 5860, 5340, 6280, 5510, 5930, 6420], dad: [1620, 1380, 1840, 1510, 1960, 1730, 0], daughter: [7120, 6840, 7560, 8210, 6930, 7480, 7340] };   // 성인 5,000보 이상 · 고령자 1천 보대(딱 1,000 아님)
  const actOf = w => { const a = w.reduce((x, y) => x + y, 0) / 7; return a >= 6000 ? L.act_very : a >= 3000 ? L.act : L.act_need; };
  const pushBody = (who, n) => `${who} · ${L.steps_tpl.replace('@steps', fmtNum(n))}`;
  const HI = ['안녕하세요', 'Hello', 'こんにちは', '你好', '哈囉', 'Hallo', 'Bonjour', 'Hola', 'Ciao', 'Hoi', 'Olá', 'Привет', 'مرحبا', 'Merhaba', 'Cześć', 'Xin chào', 'สวัสดี', 'Hej', 'नमस्ते', 'Halo'];   // 앱 소개 영상(h.html)과 같은 20개 인사말
  const heart = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,21 C2,15 5,5 12,8 C19,5 22,15 12,21 Z"/></svg>';


  // ── 예전 전화기 수화기(3번) — 만화풍 빨간 수화기: 굵은 외곽선·두 톤(밝은 빨강 + 짙은 적갈색 옆면)·하이라이트 선·작은 구멍·검은 코드선. 오른쪽 위 수화부에서 왼쪽 아래 송화부로 비스듬히 내려온다.
  const handset = () => {
    const OUT = '#2a0a0a', RED = '#FF2B0A', RED2 = '#E8200A', MAR = '#A01808', DARK = '#6e0f05';
    // 컵 한 개: 두께(어두운 옆면을 겹쳐 쌓기) + 앞면 + 안쪽 오목 선 + 구멍 + 하이라이트
    const cup = (cx, cy, rx, ry, rot, th, holes, hl) => {
      let ext = '';
      for (let i = th; i >= 1; i -= 1.5) { const k = 1 - i / th, c = `rgb(${Math.round(110 + 50 * k)},${Math.round(15 + 9 * k)},${Math.round(5 + 3 * k)})`; ext += `<ellipse cx="${(i * .62).toFixed(1)}" cy="${(i * 1).toFixed(1)}" rx="${rx}" ry="${ry}" fill="${c}"/>`; }
      return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
        <ellipse cx="${(th * .62).toFixed(1)}" cy="${th}" rx="${rx}" ry="${ry}" fill="none" stroke="${OUT}" stroke-width="3.2"/>${ext}
        <path d="M${-rx * .96} ${ry * .2} A${rx} ${ry} 0 0 0 ${rx * .7} ${ry * .75}" fill="none" stroke="#FF6A4D" stroke-width="2.6" transform="translate(${(th * .62).toFixed(1)} ${th})" opacity=".85"/>
        <ellipse rx="${rx}" ry="${ry}" fill="${RED}" stroke="${OUT}" stroke-width="3.2"/>
        <path d="M${-rx * .72} ${ry * .5} A${rx * .84} ${ry * .82} 0 0 0 ${rx * .8} ${ry * .3}" fill="none" stroke="${MAR}" stroke-width="2.6" stroke-linecap="round"/>
        ${holes}${hl}</g>`;
    };
    const dots = (n, sp, rr, rx, ry, ox, oy) => { let s = ''; for (let r = -n; r <= n; r++) for (let c = -n; c <= n; c++) { const x = c * sp + (r % 2 ? sp / 2 : 0), y = r * sp * .86; if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) s += `<circle cx="${(x + ox).toFixed(1)}" cy="${(y + oy).toFixed(1)}" r="${rr}" fill="#8a1406"/>`; } return s; };
    const arc = (rx, ry) => `<path d="M${-rx * .62} ${ry * .72} Q${-rx * .1} ${ry * .98} ${rx * .42} ${ry * .84}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-opacity=".9"/><path d="M${rx * .58} ${ry * .66} L${rx * .7} ${ry * .55}" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-opacity=".9"/>`;
    // 코드선(검은 코일) — 송화부 아래에서 왼쪽 아래로
    const P0 = [96, 448], P1 = [70, 462], P2 = [48, 466], P3 = [10, 492];
    let cord = '', pts = [];
    for (let i = 0; i <= 90; i++) { const t = i / 90, u = 1 - t, x = u*u*u*P0[0] + 3*u*u*t*P1[0] + 3*u*t*t*P2[0] + t*t*t*P3[0], y = u*u*u*P0[1] + 3*u*u*t*P1[1] + 3*u*t*t*P2[1] + t*t*t*P3[1];
      const dx = 3*u*u*(P1[0]-P0[0]) + 6*u*t*(P2[0]-P1[0]) + 3*t*t*(P3[0]-P2[0]), dy = 3*u*u*(P1[1]-P0[1]) + 6*u*t*(P2[1]-P1[1]) + 3*t*t*(P3[1]-P2[1]), l = Math.hypot(dx, dy) || 1, w = Math.sin(t * Math.PI * 7) * 11;
      pts.push(`${(x - dy / l * w).toFixed(1)},${(y + dx / l * w).toFixed(1)}`); }
    cord = `<polyline points="${pts.join(' ')}" fill="none" stroke="#8b93b8" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts.join(' ')}" fill="none" stroke="#14141c" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pts.join(' ')}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round" transform="translate(-2 -2)"/>`;
    const C = 'M440 92 C426 190 340 288 200 380';   // 손잡이 중심선
    return `<svg viewBox="0 0 540 580" width="540" height="580">
      ${cord}
      <path d="${C}" fill="none" stroke="${OUT}" stroke-width="108" stroke-linecap="round"/>
      <path d="${C}" fill="none" stroke="${DARK}" stroke-width="101" stroke-linecap="round"/>
      <path d="${C}" fill="none" stroke="${MAR}" stroke-width="88" stroke-linecap="round" transform="translate(-3 -2)"/>
      <path d="${C}" fill="none" stroke="${RED}" stroke-width="58" stroke-linecap="round" transform="translate(-18 -12)"/>
      <path d="M393 110 C382 196 316 280 196 358" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-opacity=".85" stroke-dasharray="70 14 26 14 8 14"/>
      ${cup(430, 58, 66, 50, -22, 26, dots(3, 8, 1.9, 14, 10, -6, 6), arc(66, 50))}
      ${cup(158, 396, 80, 58, -10, 36, dots(4, 9, 2.1, 36, 24, -8, -4), arc(80, 58))}
    </svg>`;
  };

  // ── 푸시 조각 (실제 서버 형식: 제목 + 별칭 · 본문)
  const push = (who, n) => `<div class="r"><span class="ico" style="background:none"><img src="app_icon.png" alt=""></span><span class="app">${S.push_app}</span><span class="now" style="margin-inline-start:auto;font-size:10.5px;color:#9AA0AE">${L.now}</span></div>
    <div class="ti">${L.push_title}</div><div class="bo">${pushBody(who, n)}</div>`;

  // ── 알림 카드 (앱 _NotificationCard: 등급색 배경 · 36 원형 배지 · 라벨 · 시각 · 구분선 · 본문)
  const ICON = { normal: '✓', caution: 'i', warning: '!', urgent: '!' };
  const nc = (lv, who, body, h, mi, extra = '') => `<div class="nc ${lv}"><div class="r1"><i class="ic">${ICON[lv]}</i><b>${S['lv_' + lv]}</b><span class="tm">${fmtT(h, mi)}</span></div><hr>
    <p><b>${who} - </b>${body}</p>${extra}</div>`;

  // ── 대상자 카드 (홈 히어로 .scard)
  const card = (o) => `<div class="scard ${o.c2 ? 'c2' : ''}" style="${o.style || ''}">
    <div class="r1"><span class="nm"><span>${o.name}</span>${o.bat ? `<span class="bat">${o.bat}</span>` : ''}</span><span class="pill">${o.pill}</span></div>
    <div class="r2"><span class="act">${actOf(o.week)}</span></div>
    ${o.warn ? `<div class="warn">⚠ ${S.safety_needed}</div>` : ''}
    <div class="slot" style="height:104px"><div class="ghost" data-week="${o.week.join(',')}">
      <div class="chd"><span>${L.steps}</span><b class="peak n-steps"></b></div>
      <div class="plot"><i></i><i></i><i></i><i></i><i></i><i></i><i class="today"></i></div>
      <div class="xlab">${L.last7}</div></div></div>
    <div class="last">${o.last}</div>
    ${o.btns ? `<div class="pbtn" style="margin-top:8px">📞 ${S.call_now}</div><div class="pbtn o">✅ ${S.confirm_safety}</div>` : ''}</div>`;
  const CARD = {
    mom: () => card({ name: L.mom, bat: '72%', pill: L.pill, week: WEEK.mom, last: L.last_now }),
    daughter: () => card({ name: L.daughter, bat: '88%', pill: L.pill, week: WEEK.daughter, last: L.last_now }),
    dad: (btns) => card({ c2: 1, name: S.dad, pill: S.pill_caution, week: WEEK.dad, last: S.last_1d, warn: 1, btns }),
  };

  // 요약 카드(작은 버전) — 이름·배터리·상태, 활동량·마지막 확인, 7일 막대
  const mini = w => { const mx = Math.max(...w); return `<span class="mini">${w.map((v, i) => `<i${i === 6 ? ' class="today"' : ''} style="height:${Math.max(v / mx * 100, 6).toFixed(0)}%"></i>`).join('')}</span>`; };
  const fc = o => `<div class="scard fc ${o.c2 ? 'c2' : ''}"><div class="r1" style="grid-column:1/3"><span class="nm"><span>${o.name}</span>${o.bat ? `<span class="bat">${o.bat}</span>` : ''}</span><span class="pill">${o.pill}</span></div>
    <div class="lt"><div class="act">${actOf(o.week)}</div><div class="last">${o.last}</div></div>${mini(o.week)}</div>`;
  const FAM = () => `<div class="fcards">${fc({ c2: 1, name: S.dad, pill: S.pill_caution, week: WEEK.dad, last: S.last_1d })}${fc({ name: L.mom, bat: '72%', pill: L.pill, week: WEEK.mom, last: L.last_now })}${fc({ name: L.daughter, bat: '88%', pill: L.pill, week: WEEK.daughter, last: S.last_3h })}</div>
    <div class="lensorg"><i class="lensh"></i><div class="lensw"><div class="lens"><div class="lin"><div class="slot" style="width:176px;height:146px"><div class="ghost" data-week="${WEEK.mom.join(',')}">
      <div class="chd"><span>${L.steps}</span><b class="peak n-steps"></b></div><div class="plot" style="height:80px"><i></i><i></i><i></i><i></i><i></i><i></i><i class="today"></i></div><div class="xlab">${L.last7}</div></div></div></div></div></div></div>`;
  const sb = '<div class="statusbar"><span>' + fmtShort(9, 41) + '</span><span>&#9646;&#9646;&#9646;</span></div>';
  const dashHead = `<div class="appbar">${L.guardian_title}</div>`;
  const SCREEN = {
    dash1: () => `${sb}${dashHead}<div class="pbody"><div class="phead">${S.d1_head || L.phead}</div><div class="psum">${L.psum}</div>
      <div class="plegend"><span><i></i><span>${L.legend}</span></span></div><div class="plist">${L.plist}</div>
      <div class="cards">${CARD.mom().replace('class="scard "', 'class="scard" ').replace('style=""', 'style="flex-basis:100%"')}</div>
      <div class="addbtn"><span class="circle">+</span><span class="t">${L.add}</span></div></div>`,
    dash3: () => `${sb}${dashHead}<div class="pbody"><div class="phead">${S.d3_head}</div><div class="psum">${L.psum}</div>
      <div class="plegend"><span><i></i><span>${S.legend_ok}</span></span><span><i class="c"></i><span>${S.legend_caution}</span></span></div><div class="plist">${L.plist}</div>
      <div class="cards">${CARD.dad(true)}${CARD.mom()}</div>
      <div class="dots"><i class="on"></i><i></i><i></i></div></div>`,
    off: () => `<div class="offscr"><svg viewBox="0 0 160 110" class="batt"><rect x="6" y="22" width="132" height="66" rx="16" fill="none" stroke="#E53935" stroke-width="7"/><rect x="144" y="43" width="11" height="24" rx="4" fill="#E53935"/><rect x="17" y="33" width="14" height="44" rx="5" fill="#E53935"/><path d="M82 28 L62 58 H78 L70 82 L96 50 H80 Z" fill="#fff" fill-opacity=".92"/></svg></div>`,
    lock: () => `<div class="lockscr"><div class="d">${new Intl.DateTimeFormat(LOC, { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 8, 19, 18, 3)))}</div><div class="tm">${fmtShort(18, 3)}</div></div>`,
    notif: () => `${sb}<div class="appbar">${S.n_title}</div><div class="pbody npad"><div class="plist">${S.n_today}</div>
      ${nc('normal', L.mom, S.b_auto, 18, 2)}${nc('normal', S.dad, S.b_auto, 17, 48)}${nc('normal', L.daughter, S.b_auto, 17, 35)}</div>`,
    sos: () => `${sb}<div class="appbar">${S.n_title}</div><div class="pbody npad"><div class="plist">${S.n_today}</div>
      ${nc('urgent', L.mom, S.b_sos, 18, 42, `<div class="loc">${S.view_loc}</div>`)}${nc('normal', S.dad, S.b_auto, 17, 48)}</div>`,
    add: () => `${sb}<div class="appbar">${S.add_title}</div><div class="pbody apad">
      <div class="g1">${S.add_guide}</div><div class="g2">${S.add_sub}</div>
      <label>${S.add_code_label}</label><div class="inp code">K7M-4PXR</div>
      <label>${S.add_alias_label}</label><div class="inp">${L.mom}</div>
      <label>${S.add_phone_label}</label><div class="inp ph">${S.add_phone_hint || '01012345678'}</div>
      <div class="cbtn">${S.add_connect}</div></div>`,
  };
  document.querySelectorAll('.pw[data-screen]').forEach(pw => {
    pw.innerHTML = `<div class="phone"><i class="btn l1"></i><i class="btn l2"></i><i class="btn r1"></i>${pw.classList.contains('side') ? '<i class="edge"></i><i class="edgeb"></i>' : ''}<i class="island"></i><div class="screen">${SCREEN[pw.dataset.screen]()}</div></div>`;
  });
  document.querySelectorAll('[data-build]').forEach(el => {
    const [k, a, b] = el.dataset.build.split(':');
    if (k === 'push') el.innerHTML = push(a === 'daughter' ? L.daughter : L.mom, WEEK[a][6]);
    if (k === 'nc') el.innerHTML = {
      sos: nc('urgent', L.mom, S.b_sos, 18, 42, `<div class="loc">${S.view_loc}</div>`), caution: nc('caution', L.mom, S.b_caution, 19, 5), warning: nc('warning', L.mom, S.b_warning, 19, 5), urgent: nc('urgent', L.mom, S.b_urgent, 19, 5),
    }[a];
    if (k === 'week') { const w = WEEK.mom, dn = new Intl.DateTimeFormat(LOC, { weekday: 'short', timeZone: 'UTC' });
      el.innerHTML = `<div class="wh"><b>${L.mom}</b><span>${L.last7}</span></div><div class="wd">${w.map((v, i) => `<div class="${i === 6 ? 'today' : ''}"><em>${dn.format(new Date(Date.UTC(2026, 8, 13 + i)))}</em><i>✓</i><span>${fmtNum(v)}</span></div>`).join('')}</div>`; }
    if (k === 'handset') el.innerHTML = handset();
    if (k === 'fam') el.innerHTML = FAM();
    if (k === 'greet') el.innerHTML = HI.map(w => `<span dir="auto">${w}</span>`).join('');
    if (k === 'card') el.innerHTML = CARD[a](b === 'btns');
  });
  document.querySelectorAll('[data-k]').forEach(e => { e.textContent = L[e.dataset.k]; });
  document.querySelectorAll('[data-h]').forEach(e => { e.innerHTML = L[e.dataset.h]; });
  document.querySelectorAll('[data-s]').forEach(e => { e.innerHTML = S[e.dataset.s]; });
  document.querySelectorAll('[data-w]').forEach(e => { const [h, mi] = e.dataset.w.split(':').map(Number); e.textContent = fmtT(h, mi); });
  // 막대 높이·최댓값(7일 중 최대, 오늘 아님)
  document.querySelectorAll('.ghost[data-week]').forEach(g => {
    const w = g.dataset.week.split(',').map(Number), mx = Math.max(...w);
    g.querySelectorAll('.plot i').forEach((b, i) => { b.style.height = Math.max(w[i] / mx * 100, 3).toFixed(1) + '%'; });
    g.querySelector('.n-steps').textContent = fmtNum(mx);
  });
  document.querySelectorAll('.t-push').forEach(e => { e.textContent = pushBody(L.mom, WEEK.mom[6]); });
  document.querySelectorAll('.t-push-d').forEach(e => { e.textContent = pushBody(L.daughter, WEEK.daughter[6]); });
  document.querySelectorAll('.t-sb').forEach(e => { e.textContent = fmtShort(9, 41); });
  document.querySelectorAll('.av').forEach(e => { e.textContent = Array.from(L.mom)[0]; });
  // 오른쪽→왼쪽 언어(아랍어): 스토어가 목록을 뒤집어 보여 주므로 1·2번 파노라마도 좌우를 뒤집는다(폰이 두 장에 걸쳐 이어지도록)
  if (L.dir === 'rtl') document.querySelectorAll('[data-pair]').forEach(el => {
    const x = parseFloat(el.style.left); el.style.left = 'auto'; el.style.right = (8 * 430 - 860 + x) + 'px'; el.style.transformOrigin = '100% 0';
    el.style.transform = el.style.transform.replace(/rotateY\((-?[\d.]+)deg\)/, (m, a) => `rotateY(${-a}deg)`).replace(/rotate\((-?[\d.]+)deg\)/, (m, a) => `rotate(${-a}deg)`);
  });
  // 글자가 길어지는 언어(독일어·러시아어 등): 문구 상자가 아래 그림을 침범하면 글자를 줄인다
  const fit = () => document.querySelectorAll('.tb').forEach(tb => {
    const max = tb.dataset.maxsel ? document.querySelector(tb.dataset.maxsel).getBoundingClientRect().top - 12 : +tb.dataset.max;
    for (let k = 0; k < 16 && tb.getBoundingClientRect().bottom > max; k++) {
      tb.querySelectorAll('.h').forEach(e => { e.style.fontSize = (parseFloat(getComputedStyle(e).fontSize) - 1.5) + 'px'; });
      tb.querySelectorAll('.sub, .o').forEach(e => { e.style.fontSize = (parseFloat(getComputedStyle(e).fontSize) - .6) + 'px'; });
    }
  });
  // 4번 카드 묶음 — 본문이 길어지는 언어는 글자를 줄여 3장이 화면 안에 들어오게 한다
  const fitStack = () => { const s = document.querySelector('.ncstack'); if (!s) return; const lim = Math.min(+getComputedStyle(document.documentElement).getPropertyValue('--H').replace('px', '') - 372 - 2, 400);
    for (let k = 0; k < 14 && s.getBoundingClientRect().height > lim && parseFloat(getComputedStyle(s.querySelector('.nc p')).fontSize) > 11.6; k++) s.querySelectorAll('.nc p').forEach(p => { p.style.fontSize = (parseFloat(getComputedStyle(p).fontSize) - .6) + 'px'; }); };
  const fitChips = () => { const c = document.getElementById('chips'); if (!c) return; let f = 18; while (c.scrollWidth > c.clientWidth + 1 && f > 11) { f -= 1; c.style.setProperty('--cf', f + 'px'); } };
  document.fonts.ready.then(() => { fit(); fitChips(); fitStack(); document.body.dataset.ready = '1'; });
});
