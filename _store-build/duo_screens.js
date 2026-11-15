// iPhone Duo 펼침 화면 — 실제 앱(분할 화면) 코드를 그대로 옮긴 목업. 단위는 Duo 논리 pt(창 951×669, 한 pane 475.5×669).
// 근거: guardian_dashboard_page.dart(분할 왼쪽 = 접힘 판정 → '오늘의 안부 요약' 숨김, 컴팩트 배치, 카드 슬라이드 0.92),
//       guardian_notifications_page.dart, split_shell.dart(왼쪽 pane 덮개·가운데 3px 선), guardian_bottom_nav.dart, app_colors.dart.
// ScreenUtil: designSize 750×812 → .w = 951/750 = 1.268, .h·.sp·.r = 669/812 = 0.824.
(function () {
  const W = 1.268, S_ = 0.824, w = v => +(v * W).toFixed(2), h = v => +(v * S_).toFixed(2), sp = h;
  const I = c => `<i class="mi">${String.fromCodePoint(c)}</i>`;   // Material Icons(Flutter SDK 폰트) 코드포인트
  const ICON = { home: 0xf7f5, link: 0xf85a, bell: 0xf002a, settings: 0xf0164, del: 0xf696, refresh: 0xf00e9, help: 0xf7e4,
    info: 0xf816, check: 0xf635, walk: 0xf6bd, phone: 0xf0083, batt6: 0xf07e6, add: 0xe047, infoO: 0xf815, err: 0xf713, map: 0xf1ae, back: 0xf570 };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lc = () => (L.bcp || 'ko').split('-')[0];
  const sepOf = () => lc() === 'fr' ? ' : ' : (lc() === 'ja' || lc() === 'zh') ? '：' : ': ';
  const SEP = () => ['de', 'es', 'it', 'nl', 'pt', 'tr', 'id', 'vi'].includes(lc()) ? '.' : ['fr', 'ru', 'pl', 'sv'].includes(lc()) ? ' ' : ',';
  const num = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, SEP());
  const tm = (hh, mm) => new Intl.DateTimeFormat(L.bcp + '-u-nu-latn', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 8, 19, hh, mm)));
  // _LabelValueText — 첫 ':' 까지는 라벨색, 뒤는 굵게 값색
  // 색은 CSS(.lab2/.lab3 라벨, .val 값) — 라이트·다크가 앱처럼 갈린다
  const lv = (t, lab) => { const i = t.search(/[:：]/); if (i < 0) return `<span class="${lab}">${esc(t)}</span>`;
    const head = t.slice(0, i + 1), tail = t.slice(i + 1), lead = tail.length - tail.trimStart().length;
    return `<span class="${lab}">${esc(head + tail.slice(0, lead))}</span><b class="val ${lab}v">${esc(tail.slice(lead))}</b>`; };
  const MOM = [5120, 5860, 5340, 6280, 5510, 5930, 6420];
  const actLabel = st => { const a = st.reduce((x, y) => x + y, 0) / st.length, sep = lc() === 'ko' ? ' : ' : sepOf();
    return `${A.guardian_activity_prefix}${sep}${a >= 6000 ? A.guardian_activity_very_active : a >= 3000 ? A.guardian_activity_active : A.guardian_activity_needs_exercise}`; };
  const lastDays = n => (n === 1 && A.guardian_last_check_days_one ? A.guardian_last_check_days_one : A.guardian_last_check_days).replace('@days', n);

  // 7일 막대 차트(fl_chart) — 왼쪽 축 이름(세로) · 아래 축 이름 · 최댓값 라벨 · 막대 폭 24 · 오늘 주황
  const chart = (st, d30) => { const mx = Math.max(...st), mi = st.lastIndexOf(mx);
    const bars = st.map((v, i) => `<div class="col"><div class="bar${i === st.length - 1 ? ' today' : ''}" style="height:${(v / mx * 100).toFixed(1)}%">${i === mi ? `<em>${num(mx)}</em>` : ''}</div></div>`).join('');
    return `<div class="chart${d30 ? ' d30' : ''}"><div class="yname"><span>${esc(A.guardian_chart_y_axis_steps)}</span></div><div class="plotw"><div class="plot">${bars}</div><div class="xname">${esc(d30 ? A.guardian_chart_x_axis_last_30_days : A.guardian_chart_x_axis_last_7_days)}</div></div></div>`; };
  // 엄마 30일 — 마지막 7일은 카드(MOM)와 같다
  const MOM30 = [4870, 5320, 6110, 4580, 5940, 6730, 5210, 4960, 5480, 6210, 7412, 5630, 4790, 5350, 6040, 5870, 4920, 5560, 6380, 5150, 5720, 6090, 5260].concat(MOM);
  const cal = `<span class="cal"><i class="r1"></i><i class="r2"></i><span class="cb"><span class="ct"></span><span class="cn">30</span></span></span>`;
  const cardNormal = () => `<div class="card normal">
      <div class="r1"><span class="nm"><b>${esc(L.mom)}</b>${I(ICON.batt6).replace('class="mi"', 'class="mi batt"')}<span class="bp">72%</span></span><span class="badge">${esc(A.guardian_status_confirmed)}</span></div>
      <div class="r2"><span class="lvt">${lv(actLabel(MOM), 'lab2')}</span>${cal}</div>
      ${chart(MOM)}
      <div class="lvt last">${lv(A.guardian_last_check_now, 'lab3')}</div></div>`;
  const cardCaution = (who = S.dad) => `<div class="card caution">
      <div class="r1"><span class="nm"><b>${esc(who)}</b></span><span class="badge">${esc(A.guardian_status_caution)}</span></div>
      <div class="sp"></div><div class="r2 warn">${I(ICON.infoO)}<span>${esc(A.guardian_safety_needed)}</span>${cal}</div><div class="sp"></div>
      <div class="cbtn">${I(ICON.phone)}<span>${esc(A.guardian_call_now)}</span></div><div class="obtn"><span>${esc(A.guardian_confirm_safety)}</span></div>
      <div class="lvt last">${lv(lastDays(1), 'lab3')}</div></div>`;
  const cardUrgent = () => `<div class="card urgent">
      <div class="r1"><span class="nm"><b>${esc(L.mom)}</b></span><span class="badge">${esc(A.guardian_status_urgent)}</span></div>
      <div class="sp"></div><div class="r2 warn">${I(ICON.infoO)}<span>${esc(A.guardian_safety_needed)}</span>${cal}</div><div class="sp"></div>
      <div class="cbtn">${I(ICON.phone)}<span>${esc(A.guardian_call_now)}</span></div><div class="obtn"><span>${esc(A.guardian_confirm_safety)}</span></div>
      <div class="lvt last">${lv((A.guardian_last_check_minutes || A.guardian_last_check_now).replace('@minutes', 40), 'lab3')}</div></div>`;
  const T = `<span class="t">8:12</span>`, IC = `<span class="ic"><i class="sig"><b></b><b></b><b></b><b></b></i><i class="wifi"></i><i class="bat"><b></b></i></span>`;
  const status = side => `<div class="sbar ${side}">${side === 'l' ? T : side === 'r' ? IC : T + IC}</div>`;
  const nav = (sel = 2) => `<div class="nav">${[['home', 'nav_home'], ['link', 'nav_connection'], ['bell', 'nav_notification'], ['settings', 'nav_settings']].map(([ic, k], i) =>
      `<div class="it${i === sel ? ' on' : ''}">${I(ICON[ic])}<span>${esc(A[k])}</span></div>`).join('')}</div>`;
  const nc = (lvl, icon, label, time, who, body, extra = '') => `<div class="ncard ${lvl}"><div class="nr"><span class="ci">${I(icon)}</span><b>${esc(label)}</b>${time ? `<span class="tt">${time}</span>` : ''}</div><hr><p><b>${esc(who)} - </b>${esc(body)}</p>${extra}</div>`;

  // 왼쪽 pane — 보호자 대시보드(분할 중: 덮개 + 하단 탭은 오른쪽에 열린 '알림' 탭 표시)
  const dashPane = (n, first = cardNormal) => `<div class="pane dash">${status('l')}
      <div class="abar c">${esc(A.app_guardian_title)}</div>
      <div class="body">
        <div class="head">${esc((n === 1 && A.guardian_checking_subjects_one ? A.guardian_checking_subjects_one : A.guardian_checking_subjects).replace('@count', n)).replace(/\n/g, '<br>')}</div>
        <div class="lhead">${esc(A.guardian_subject_list)}</div>
        <div class="pager${n === 1 ? ' one' : ''}"><div class="pg">${first()}</div>${n > 1 ? `<div class="pg">${cardCaution()}</div>` : ''}</div>
        ${n > 1 ? '<div class="pdots"><i class="on"></i><i></i></div>' : ''}
        <div class="addc"><span class="ac">${I(ICON.add)}</span><span class="at">${esc(A.add_subject_button)}</span></div>
      </div>${nav()}<div class="dim"></div></div>`;
  // 오른쪽 pane — 알림 페이지(분할 pane 안에서는 하단 탭이 없다)
  const notifPane = (dad, sos, momc) => `<div class="pane notif">${status('r')}
      <div class="abar"><span class="ttl">${I(ICON.bell)}<span>${esc(A.notifications_title)}</span></span><span class="act">${I(ICON.del).replace('class="mi"', 'class="mi del"')}${I(ICON.refresh).replace('class="mi"', 'class="mi ref"')}</span></div>
      <div class="todayrow"><span>${esc(A.notifications_today)}</span>${I(ICON.help)}</div>
      <div class="notice">${esc(A.notifications_auto_delete_notice)}</div>
      <div class="list">
        ${sos ? nc('urgent', ICON.err, A.notifications_level_urgent, tm(18, 42), L.mom, A.noti_emergency_body, `<div class="vloc">${I(ICON.map)}<span>${esc(A.notifications_view_location)}</span></div>`) : ''}
        ${dad ? nc('caution', ICON.info, A.notifications_level_caution, tm(20, 0), S.dad, A.noti_caution_missing_body) : ''}
        ${momc ? nc('caution', ICON.info, A.notifications_level_caution, tm(19, 5), L.mom, A.noti_caution_missing_body) : `
        ${nc('normal', ICON.check, A.notifications_level_health, tm(18, 2), L.mom, A.noti_auto_report_body)}
        ${nc('info', ICON.walk, A.notifications_level_info, '', L.mom, A.noti_steps_body.replace('@steps', num(6420)))}`}
      </div></div>`;

  // 30일 걸음수 대화상자(_StepsChartDialog) — 루트 내비게이터라 창 전체(두 pane)를 덮는 유리 배경 위 가운데
  const chart30 = () => `<div class="dlgpane"><div class="gdlg"><div class="gin">
      <div class="gt"><b>${esc(L.mom)}</b><span class="x">${I(0xf647)}</span></div>
      <div class="lvt gs">${lv(actLabel(MOM30), 'lab2')}</div>
      <div class="gch">${chart(MOM30, true)}</div></div></div></div>`;

  // 보호 대상자 연결(guardian_add_subject_page) — 접은 겉 화면. 하단 탭 '연결' 선택
  const field = (v, hint) => `<div class="fld${v ? '' : ' hint'}">${esc(v || hint)}</div>`;
  const addPane = () => `<div class="pane out add">${status('both')}
      <div class="abar c"><span class="bk">${I(ICON.back)}</span>${esc(A.add_subject_title)}</div>
      <div class="gd"><div class="g1">${esc(A.add_subject_guide_title)}</div><div class="g2">${esc(A.add_subject_guide_subtitle)}</div></div>
      <div class="frm">
        <div class="lb">${esc(A.add_subject_code_label)}</div>${field('K7M-4PXR', '')}
        <div class="inf">${I(ICON.infoO)}<span>${esc(A.add_subject_code_info)}</span></div>
        <div class="lb gap">${esc(A.add_subject_alias_label)}</div>${field(L.mom, '')}
        <div class="lb gap">${esc(A.add_subject_phone_label)}</div>${field('', A.add_subject_phone_hint)}
        <div class="inf">${I(ICON.infoO)}<span>${esc(A.add_subject_phone_info)}</span></div>
        <div class="cbig">${I(ICON.link)}<span>${esc(A.add_subject_connect)}</span></div>
      </div>${nav(1)}</div>`;

  window.DUOSCREEN = {
    add: addPane,
    dashC: () => dashPane(1, () => cardCaution(L.mom)),   // 엄마 주의(오늘 안부 없음)
    notifC: () => notifPane(false, false, true),
    dashU: () => dashPane(1, cardUrgent),   // 엄마 긴급(도움 요청)
    notifS: () => notifPane(false, true),   // 엄마 긴급 도움 요청 + 정상·걸음수
    chart30,
    // 왼쪽 pane — 보호자 대시보드(분할 중: 덮개 + 하단 탭은 오른쪽에 열린 '알림' 탭 표시)
    dash: () => dashPane(2),     // 엄마(정상) + 아빠(주의)
    dash1: () => dashPane(1),    // 엄마(정상)만
    // 오른쪽 pane — 알림 페이지(분할 pane 안에서는 하단 탭이 없다)
    notif: () => notifPane(true),     // 아빠 주의 + 엄마 정상·걸음수
    notif1: () => notifPane(false),   // 엄마 정상·걸음수만
  };
  window.DUOSCREEN_META = { w, h, sp };
})();
