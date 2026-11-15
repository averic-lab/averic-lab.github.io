// 휴대폰 화면 속 안부 앱 UI — 캔버스 2D로 그린다(앱 코드 값 그대로: dp 단위, 375 기준).
// 출처: guardian_notifications_page.dart / guardian_dashboard_page.dart / guardian_bottom_nav.dart
// 문구는 strings.json(앱·서버 번역 + 영상 교정) — setStrings() 로 언어를 정한 뒤 createScreen().
// ⚠️ 앱은 flutter_localizations 가 없어 아랍어에서도 LTR 배치다(좌우 반전하지 않는다). 아랍어만 있는 줄만 RTL 로 흐른다.
import { ICONS } from './icons.js';
import { wrap, drawLine, isRtlText } from './text.js';

export const W = 375, H = 826.5, S = 2.8;
const FONT = '"Apple SD Gothic Neo","Noto Sans KR","Noto Sans JP","Noto Sans SC","Noto Sans Thai","Noto Sans Devanagari","Geeza Pro",sans-serif';
const F = (size, weight) => `${weight} ${size}px ${FONT}`;
const C = {
  surface: '#F9F9F9', white: '#FFFFFF', text1: '#1A1C1C', text2: '#3F4948', text3: '#757575',
  indigo: '#4355B9', outlineVar: '#BEC9C7', red: '#E53935',
};
const P = {};
for (const k in ICONS) P[k] = new Path2D(ICONS[k]);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eio = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eout = x => 1 - Math.pow(1 - x, 3);
const eback = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const alpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

let L, LANG, NUM, mg;     // 문구·언어·숫자 형식·측정용 캔버스
export function setStrings(strings, lang) {
  L = strings; LANG = lang; NUM = new Intl.NumberFormat(strings.num_locale);
  mg = document.createElement('canvas').getContext('2d');
  buildLayout();
}

function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, typeof r === 'number' ? [r, r, r, r] : r); }
function icon(g, name, x, y, size, color) {
  g.save(); g.translate(x, y); g.scale(size / 24, size / 24); g.fillStyle = color; g.fill(P[name]); g.restore();
}
function txt(g, s, x, y, size, weight, color, align = 'left', base = 'alphabetic') {
  g.font = F(size, weight); g.fillStyle = color; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y);
}
function measure(g, s, size, weight) { g.font = F(size, weight); return g.measureText(s).width; }
// 여러 줄 텍스트(앱 Text 는 폭을 넘으면 줄바꿈) — 줄 배열 반환
const lines = (s, size, weight, maxW) => wrap(mg, [{ t: s, f: F(size, weight) }], maxW, LANG);
function drawLines(g, ls, x, y, lh, color, align = 'left') {
  g.textBaseline = 'middle';
  ls.forEach((ln, i) => {
    const rtl = isRtlText(ln.map(p => p.t).join(''));
    drawLine(g, ln, x, y + i * lh, { align, rtl, color });
  });
}

// ─── 레이아웃(언어마다 줄 수가 달라 계산한다) ────────────────────────────
const LAY = {};
function buildLayout() {
  LAY.notice = lines(L.notifications_auto_delete_notice, 11, 400, 321);
  LAY.listTop = 142 + (LAY.notice.length - 1) * 15 + 18;
  LAY.head = lines(L.checking, 20, 700, 321);
  const extra = (LAY.head.length - 2) * 28;
  LAY.headY = 96 + 14; LAY.sumY = 178 + extra; LAY.legY = 204 + extra; LAY.listTitleY = 256 + extra;
  LAY.cardTop = 280 + extra;
  LAY.add = lines(L.add_subject_button, 16, 600, 300);
  LAY.need = lines(L.guardian_safety_needed, 16, 700, 287.3 - 32 - 24 - 40).slice(0, 2);
}
export const cardTop = () => LAY.cardTop;

// ─── 알림 카드 (_NotificationCard) ──────────────────────────────────────
const LV = {
  normal:  { bg: '#E8F5E9', c: '#43A047', ic: 'check_circle', label: () => L.notifications_level_health },
  steps:   { bg: '#E3F2FD', c: '#4355B9', ic: 'directions_walk', label: () => L.notifications_level_info, noTime: true },
  battery: { bg: '#EDE7F6', c: '#7B1FA2', ic: 'battery_alert', label: () => L.notifications_level_info },
  caution: { bg: '#FFF9C4', c: '#FFC107', ic: 'info', label: () => L.notifications_level_caution },
  urgent:  { bg: '#FFEBEE', c: '#E53935', ic: 'error', label: () => L.notifications_level_urgent },
};
// 알림 목록 카드 — 문구는 앱 noti_* (영상 교정 포함). at = 몇 번째 팝업과 함께 들어오는가
const NOTI = () => [
  { at: 0, lv: 'steps',   name: L.names.mom, body: L.steps_body },
  { at: 0, lv: 'normal',  name: L.names.mom, time: L.times.t1800, body: L.noti_auto_report_body },
  { at: 1, lv: 'battery', name: L.names.mom, time: L.times.t1800, body: L.noti_battery_low_body },
  { at: 2, lv: 'caution', name: L.names.sib, time: L.times.t1900, body: L.noti_caution_suspicious_body },
  { at: 3, lv: 'caution', name: L.names.dad, time: L.times.t2000, body: L.noti_caution_missing_body },
  { at: 4, lv: 'urgent',  name: L.names.sib, time: L.times.t2005, body: L.noti_emergency_body, loc: true },
];
function cardHeight(n) {
  // RichText: 이름(굵게) + ' - ' + 본문
  const ls = wrap(mg, [{ t: n.name + ' - ', f: F(14, 600) }, { t: n.body, f: F(14, 400) }], 289, LANG);
  return { lines: ls, h: 12 + 36 + 8 + 1 + 12 + ls.length * 20 + (n.loc ? 8 + 30 : 0) + 16 };
}
function drawNotiCard(g, n, x, y, ch) {
  const s = LV[n.lv];
  rr(g, x, y, 321, ch.h, 16); g.fillStyle = s.bg; g.fill();
  const cy = y + 12 + 18;
  g.beginPath(); g.arc(x + 16 + 18, cy, 18, 0, Math.PI * 2); g.fillStyle = alpha(s.c, .15); g.fill();
  icon(g, s.ic, x + 16 + 8, cy - 10, 20, s.c);
  txt(g, s.label(), x + 16 + 36 + 12, cy, 14, 900, s.c, 'left', 'middle');
  if (!s.noTime) txt(g, n.time, x + 321 - 16, cy, 14, 500, C.indigo, 'right', 'middle');
  g.fillStyle = alpha(s.c, .2); g.fillRect(x + 16, y + 12 + 36 + 8, 289, 1);
  const by = y + 12 + 36 + 8 + 1 + 12;
  drawLines(g, ch.lines, x + 16, by + 10, 20, C.text1);
  if (n.loc) {
    const ly = by + ch.lines.length * 20 + 8 + 15;
    icon(g, 'map_outlined', x + 16, ly - 9, 18, C.indigo);
    txt(g, L.notifications_view_location, x + 16 + 18 + 8, ly, 14, 500, C.indigo, 'left', 'middle');
  }
}

// ─── 공통 크롬(상태바·앱바·하단 탭) ────────────────────────────────────
function statusBar(g) {
  txt(g, L.common_time_style === 'post12' ? '8:10' : '20:10', 26, 17, 14, 600, C.text1, 'left', 'middle');   // 상태바: 영어·아랍어·힌디어만 12시간제
  icon(g, 'signal_cellular_alt', 300, 8, 17, C.text1);
  icon(g, 'wifi', 318, 8, 17, C.text1);
  icon(g, 'battery_full', 338, 8, 18, C.text1);
  g.beginPath(); g.arc(W / 2, 17, 5.2, 0, Math.PI * 2); g.fillStyle = '#05060a'; g.fill();   // 펀치홀
}
function bottomNav(g, active) {
  const top = H - 76;
  g.save(); g.shadowColor = 'rgba(0,0,0,.06)'; g.shadowBlur = 8 * S; g.shadowOffsetY = -2 * S;
  rr(g, 0, top, W, 76, [20, 20, 0, 0]); g.fillStyle = C.white; g.fill(); g.restore();
  const items = [['home', L.nav_home], ['link', L.nav_connection], ['notifications', L.nav_notification], ['settings', L.nav_settings]];
  items.forEach(([ic, lb], i) => {
    const cx = W / 8 + i * W / 4, col = i === active ? C.text1 : C.outlineVar;
    icon(g, ic, cx - 12, top + 9, 24, col);
    const fs = Math.min(12, 12 * 88 / Math.max(1, measure(g, lb, 12, 600)));   // 탭 폭(약 94dp) 안에
    txt(g, lb, cx, top + 44, fs, i === active ? 600 : 400, col, 'center', 'middle');
  });
  rr(g, W / 2 - 54, H - 9, 108, 4, 2); g.fillStyle = 'rgba(26,28,28,.75)'; g.fill();   // 제스처 바
}
export const NAV_Y = H - 76 + 21;
// 터치 표시 — 물결 + 손가락 점(영상용 표시)
function touch(g, x, y, p) {
  if (p <= 0 || p >= 1) return;
  const r = 10 + 34 * eout(p);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = `rgba(26,28,28,${.14 * (1 - p)})`; g.fill();
  const a = p < .15 ? p / .15 : 1 - seg(p, .45, 1);
  const s = p < .2 ? 1 - .18 * (p / .2) : .82 + .18 * seg(p, .2, .45);
  g.beginPath(); g.arc(x, y, 17 * s, 0, Math.PI * 2); g.fillStyle = `rgba(255,255,255,${.55 * a})`; g.fill();
  g.lineWidth = 2; g.strokeStyle = `rgba(67,85,185,${.55 * a})`; g.stroke();
}

// ─── 알림 페이지 ────────────────────────────────────────────────────────
function notificationsPage(g, st) {
  g.fillStyle = C.surface; g.fillRect(0, 0, W, H);
  statusBar(g);
  icon(g, 'notifications', 16, 49, 22, C.text1);
  txt(g, L.notifications_title, 16 + 22 + 8, 60, 18, 600, C.text1, 'left', 'middle');
  if (st.inserted.some(v => v > 0)) icon(g, 'delete_outline', W - 15 - 12 - 48 - 12, 48, 24, C.red);
  icon(g, 'refresh', W - 15 - 12 - 12, 48, 24, C.indigo);
  txt(g, L.notifications_today, 27, 112, 14, 600, C.indigo, 'left', 'middle');
  icon(g, 'help_outline', W - 15 - 24 - 12 + 12, 100, 24, C.text3);
  drawLines(g, LAY.notice, 27, 142, 15, alpha(C.red, .7));
  let y = LAY.listTop;
  g.save(); g.beginPath(); g.rect(0, LAY.listTop - 8, W, H - 76 - LAY.listTop + 8); g.clip();
  const notis = NOTI();
  for (let i = notis.length - 1; i >= 0; i--) {
    const n = notis[i], p = st.inserted[n.at];
    if (p <= 0) continue;
    const ch = cardHeight(n), e = eout(p);
    g.save(); g.globalAlpha = seg(p, .25, 1);
    const sc = .94 + .06 * e;
    g.translate(27 + 160.5, y + ch.h / 2); g.scale(sc, sc); g.translate(-(27 + 160.5), -(y + ch.h / 2));
    drawNotiCard(g, n, 27, y - (1 - e) * 18, ch);
    g.restore();
    y += (ch.h + 12) * e;
  }
  g.restore();
  bottomNav(g, 2);
}

// ─── 대시보드 ───────────────────────────────────────────────────────────
const STEPS7 = [4120, 5380, 3950, 6010, 4870, 5520, 6240];
export const STEPS30 = [5210, 4680, 6120, 3880, 5450, 7412, 4990, 5630, 4210, 6380, 5050, 3720, 5890, 6650, 4470,
  5320, 4060, 6930, 5180, 4780, 5940, 6210, 4350, ...STEPS7];
const CARDS = () => [
  { name: L.names.sib, lv: 'urgent', last: L.last_1h },
  { name: L.names.dad, lv: 'caution', last: L.last_1d },
  { name: L.names.mom, lv: 'normal', last: L.last_2h, battery: 18 },
];
const STATUS = {
  urgent:  { c: '#E53935', bg: 'rgba(255,235,238,.6)', label: () => L.guardian_status_urgent },
  caution: { c: '#F59E0B', bg: 'rgba(255,249,196,.6)', label: () => L.guardian_status_caution },
  normal:  { c: '#00685E', bg: 'rgba(232,245,233,.5)', label: () => L.guardian_status_confirmed },
};
const fmt = v => NUM.format(v);

function calendarBtn(g, x, y) {      // _buildFullChartButton — 30 아이콘 + 흰 바탕 "30"
  icon(g, 'calendar_month', x, y, 30, C.text2);
  const w = measure(g, '30', 10, 800) + 2;
  g.fillStyle = C.white; g.fillRect(x + 15 - w / 2, y + 15 - 1, w, 11);
  txt(g, '30', x + 15, y + 15 + 5, 10, 800, C.text2, 'center', 'middle');
}
function barChart(g, x, y, w, h, steps, grow, thirty) {
  const plotL = x + 16, plotT = y + 16, plotR = x + w, plotB = y + h - 16;
  g.save(); g.translate(x + 8, (plotT + plotB) / 2); g.rotate(-Math.PI / 2); txt(g, L.guardian_chart_y_axis_steps, 0, 0, 11, 500, C.text3, 'center', 'middle'); g.restore();
  txt(g, thirty ? L.guardian_chart_x_axis_last_30_days : L.guardian_chart_x_axis_last_7_days, thirty ? (plotL + plotR) / 2 : plotR, plotB + 9, 11, 500, C.text3, thirty ? 'center' : 'right', 'middle');
  g.fillStyle = 'rgba(117,117,117,.4)'; g.fillRect(plotL, plotT, 1, plotB - plotT); g.fillRect(plotL, plotB - 1, plotR - plotL, 1);
  const max = Math.max(...steps); let mi = -1; steps.forEach((v, i) => { if (v === max) mi = i; });
  const n = steps.length, bw = n <= 7 ? 24 : 8, ph = plotB - plotT - 1;
  steps.forEach((v, i) => {
    const gi = clamp(grow * (1 + n * .06) - i * .06);
    const hh = v / max * ph * eback(gi);
    if (hh <= 0) return;
    const cx = plotL + (i + .5) * (plotR - plotL) / n;
    rr(g, cx - bw / 2, plotB - 1 - hh, bw, hh, 2);
    g.fillStyle = i === n - 1 ? '#FB8C00' : 'rgba(26,35,126,.7)'; g.fill();
    if (i === mi && gi > .6) {
      g.save(); g.globalAlpha = seg(gi, .6, 1);
      const lw = measure(g, fmt(max), 11, 700);
      txt(g, fmt(max), clamp(cx, plotL + lw / 2, plotR - lw / 2), y + 8, 11, 700, '#1A237E', 'center', 'middle'); g.restore();
    }
  });
}
// "활동량 : 활동적" — 앞말과 강조어의 시각 위치(아랍어는 강조어가 왼쪽). 대시보드 카드·30일 창·고해상도 판 공용
export function actPieces(size = 12, boldWord = false) {
  return [{ t: L.act_pre, f: F(size, 400) }, { t: L.act_word, f: F(size, boldWord ? 800 : 400) }];
}
export const actRtl = () => isRtlText(L.act_pre + L.act_word);

function subjectCard(g, c, x, y, grow) {
  const s = STATUS[c.lv], w = 287.3, h = 200;
  rr(g, x, y, w, h, 16); g.fillStyle = s.bg; g.fill();
  g.save(); rr(g, x, y, w, h, 16); g.clip(); g.fillStyle = s.c; g.fillRect(x, y, 4, h); g.restore();
  const px = x + 16, top = y + 8, iw = w - 32;
  const bw = measure(g, s.label(), 11, 600) + 20;
  // 이름(길면 줄임) + 배터리 + 배지
  const nameMax = iw - bw - (c.battery != null ? 52 : 8);
  let name = c.name; while (measure(g, name, 16, 700) > nameMax && name.length > 1) name = name.slice(0, -2) + '…';
  txt(g, name, px, top + 12, 16, 700, C.text1, 'left', 'middle');
  if (c.battery != null) {
    const nx = px + measure(g, name, 16, 700) + 6;
    icon(g, 'battery_2_bar', nx, top + 3, 18, '#FF9800');
    txt(g, c.battery + '%', nx + 20, top + 12, 11, 600, '#FF9800', 'left', 'middle');
  }
  rr(g, px + iw - bw, top + 1, bw, 22, 10); g.fillStyle = alpha(s.c, .12); g.fill();
  txt(g, s.label(), px + iw - bw / 2, top + 12, 11, 600, s.c, 'center', 'middle');
  if (c.lv === 'normal') {
    g.textBaseline = 'middle'; drawLine(g, actPieces(12), px, top + 24 + 19, { rtl: actRtl(), color: C.text2 });
    calendarBtn(g, px + iw - 34, top + 24 + 4);
    barChart(g, px, top + 24 + 38, iw, 106, STEPS7, grow, false);
    txt(g, c.last, px, y + h - 8 - 8, 12, 400, C.text3, 'left', 'middle');
  } else {
    const ry = top + 24 + 6 + 19;
    icon(g, 'info_outline', px, ry - 9, 18, s.c);
    const n = LAY.need.length; drawLines(g, LAY.need, px + 24, ry - (n - 1) * 11, 22, s.c);
    calendarBtn(g, px + iw - 34, ry - 19 + 4);
    const by = y + h - 8 - 16 - 8 - 86;
    rr(g, px, by, iw, 40, 10); g.fillStyle = s.c; g.fill();
    const lw = Math.min(measure(g, L.guardian_call_now, 11, 600), iw - 40);
    icon(g, 'phone', px + iw / 2 - (lw + 19) / 2, by + 12.5, 15, C.white);
    txt(g, L.guardian_call_now, px + iw / 2 - (lw + 19) / 2 + 19, by + 20, 11, 600, C.white, 'left', 'middle');
    rr(g, px + .5, by + 46.5, iw - 1, 39, 10); g.lineWidth = 1; g.strokeStyle = alpha(s.c, .3); g.stroke();
    txt(g, L.guardian_confirm_safety, px + iw / 2, by + 66, 11, 600, s.c, 'center', 'middle');
    txt(g, c.last, px, y + h - 8 - 8, 12, 400, C.text3, 'left', 'middle');
  }
}

export const PW = (W - 54) * .92;
function dashboard(g, st) {
  g.fillStyle = C.surface; g.fillRect(0, 0, W, H);
  statusBar(g);
  txt(g, L.app_guardian_title, W / 2, 60, 18, 600, C.text1, 'center', 'middle');
  drawLines(g, LAY.head, 27, LAY.headY, 28, C.text1);
  txt(g, L.guardian_today_summary, 27, LAY.sumY, 14, 500, C.text3, 'left', 'middle');
  let lx = 27;
  for (const [c, l] of [['#00685E', `${L.guardian_status_normal}: 1`], ['#F59E0B', `${L.guardian_status_caution}: 1`], ['#E53935', `${L.guardian_status_urgent}: 1`]]) {
    g.beginPath(); g.arc(lx + 3, LAY.legY, 3, 0, Math.PI * 2); g.fillStyle = c; g.fill();
    txt(g, l, lx + 10, LAY.legY, 11, 500, C.text3, 'left', 'middle'); lx += 10 + measure(g, l, 11, 500) + 10;
  }
  txt(g, L.guardian_subject_list, 27, LAY.listTitleY, 16, 600, C.text1, 'left', 'middle');
  CARDS().forEach((c, i) => subjectCard(g, c, 27 + (i - st.page) * PW, LAY.cardTop, i === 2 ? st.grow : 0));
  const dy = LAY.cardTop + 200 + 10 + 3;
  const ws = [0, 1, 2].map(i => 6 + 14 * clamp(1 - Math.abs(st.page - i)));
  let dx = W / 2 - (ws.reduce((a, b) => a + b) + 6 * 3) / 2;
  ws.forEach((w, i) => { rr(g, dx + 3, dy - 3, w, 6, 3); g.fillStyle = alpha(C.indigo, .2 + .8 * clamp(1 - Math.abs(st.page - i))); g.fill(); dx += w + 6; });
  const ay = dy + 3 + 32, ah = 126 + (LAY.add.length - 1) * 24;
  if (ay + ah < H - 80) {
    g.save(); rr(g, 27, ay, 321, ah, 14); g.setLineDash([6, 4]); g.lineWidth = 1.2; g.strokeStyle = 'rgba(63,73,72,.5)'; g.stroke(); g.restore();
    g.beginPath(); g.arc(W / 2, ay + 28 + 18, 18, 0, Math.PI * 2); g.fillStyle = '#F3F3F3'; g.fill();
    g.fillStyle = C.text2; g.fillRect(W / 2 - 7, ay + 46 - 1, 14, 2); g.fillRect(W / 2 - 1, ay + 46 - 7, 2, 14);
    drawLines(g, LAY.add, W / 2, ay + 28 + 36 + 10 + 12, 24, C.text2, 'center');
  }
  bottomNav(g, 0);
}

// 30일 걸음수 다이얼로그(_StepsChartDialog) — scale 0.7→1.0 easeOutBack + fade
export const DLG = { x: 16, w: 343, h: 16 + 34 + 4 + 16 + 12 + 280 + 16 };
DLG.y = (H - DLG.h) / 2;
function dialog(g, st) {
  const p = st.dlg; if (p <= 0) return;
  g.fillStyle = `rgba(0,0,0,${.54 * clamp(p)})`; g.fillRect(0, 0, W, H);
  const sc = .7 + .3 * eback(clamp(p));
  g.save(); g.globalAlpha = clamp(p * 1.4);
  g.translate(W / 2, H / 2); g.scale(sc, sc); g.translate(-W / 2, -H / 2);
  const { x, y, w, h } = DLG;
  g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 24 * S; g.shadowOffsetY = 8 * S;
  rr(g, x, y, w, h, 16); g.fillStyle = C.white; g.fill(); g.restore();
  txt(g, L.names.mom, x + 16, y + 16 + 17, 16, 700, C.text1, 'left', 'middle');
  icon(g, 'close', x + w - 16 - 6 - 22, y + 16 + 6, 22, C.text2);
  g.save(); g.globalAlpha *= 1 - (st.subHide || 0);   // 줌인 구간엔 고해상도 판이 대신 보인다
  g.textBaseline = 'middle'; drawLine(g, actPieces(12), x + 16, y + 16 + 34 + 4 + 8, { rtl: actRtl(), color: C.text2 });
  g.restore();
  barChart(g, x + 16, y + 16 + 34 + 4 + 16 + 12, w - 32, 280, STEPS30, st.dlgGrow, true);
  g.restore();
}
// 30일 창 "활동량 : 활동적" 의 위치(dp) — 줌인 목표와 고해상도 판 배치
export function actMetrics() {
  const x0 = DLG.x + 16, cy = DLG.y + 16 + 34 + 4 + 8;
  const pos = drawLine(mg, actPieces(12), x0, cy, { rtl: actRtl(), dry: true });
  const word = pos[1], left = Math.min(...pos.map(p => p.x)), right = Math.max(...pos.map(p => p.x + p.w));
  return { x0: left, w: right - left, cy, wordCx: word.x + word.w / 2, wordW: word.w };
}
export function createScreen() {
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * S); cv.height = Math.round(H * S);
  const g = cv.getContext('2d');
  return {
    canvas: cv,
    draw(st) {
      g.setTransform(S, 0, 0, S, 0, 0); g.clearRect(0, 0, W, H);
      if (st.mode === 'off') { g.fillStyle = `rgba(0,0,0,${1 - (st.xray || 0)})`; g.fillRect(0, 0, W, H); return; }
      if (st.mode === 'noti') notificationsPage(g, st); else dashboard(g, st);
      if (st.mode === 'dash') dialog(g, st);
      for (const t of st.touches || []) touch(g, t.x, t.y, t.p);
      if (st.bright < 1) { g.fillStyle = `rgba(0,0,0,${1 - st.bright})`; g.fillRect(0, 0, W, H); }
      if (st.reveal != null && st.reveal < 1) {
        const e = st.reveal * st.reveal * (3 - 2 * st.reveal), R = 10 + e * 980, soft = 46;
        g.save(); g.globalCompositeOperation = 'destination-in';
        const m = g.createRadialGradient(W / 2, H / 2, Math.max(0, R - soft), W / 2, H / 2, R);
        m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'source-atop';
        const b = g.createRadialGradient(W / 2, H / 2, Math.max(0, R - soft), W / 2, H / 2, R);
        b.addColorStop(0, 'rgba(200,228,255,0)'); b.addColorStop(.7, `rgba(215,235,255,${0.85 * (1 - e)})`); b.addColorStop(1, 'rgba(200,228,255,0)');
        g.fillStyle = b; g.fillRect(0, 0, W, H); g.restore();
      }
    },
  };
}
export { seg, eio, eout, eback, clamp, F as fontOf };
