// 엔딩 문구 — 화면에 붙인 1080×1920 캔버스(화면 픽셀 1:1)에 그린다.
// 글자 자체는 빛 번짐 기준(1.08) 아래의 단색이라 작은 글씨도 번지지 않는다.
// 빛(막대·반짝임)은 별도 가산 레이어에만 두고 그 레이어만 HDR 로 키운다.
const CSS_W = 540, CSS_H = 960, S = 2;
const FONT = '"Apple SD Gothic Neo","Noto Sans KR","Noto Sans","Noto Sans Thai","Noto Sans Devanagari","Noto Sans Arabic",sans-serif';
// 쇼츠 안전 영역(README): 위 8% · 아래 20% · 오른쪽 12% → 가로는 좌우 대칭으로 65~475
const BOX = { x: 65, w: 410, top: 96 };
const COLOR = { head: '#F5F8FF', headShine: '#FFFFFF', cta: 'rgba(236,240,248,0.82)', site: '#FFE27A', anbu: '#FF9EC4' };

import { wrap as wrapT, drawLine, isRtlText } from './text.js';
// 문구는 strings.json(manual.json 의 head / dl / store) — createEnding(L, lang)
// 스토어 줄의 "Anbu" 를 따옴표째 분홍으로(언어마다 따옴표가 다르다: “” „“ «» 「」 ”“ ‘’ …)
const ANBU_RE = /(«\s?Anbu\s?»|“Anbu”|„Anbu“|„Anbu”|「Anbu」|”Anbu“|”Anbu”|‘Anbu’|"Anbu"|Anbu)/;
function ctaRuns(L) {
  const m = L.store.split(ANBU_RE).filter(s => s !== '');
  return { cta1: [[L.dl + '  ', null], ['averic.co.kr', 'site']], cta2: m.map(s => [s, ANBU_RE.test(s) ? 'anbu' : null]) };
}
const wrap = (g, text, maxW, lang) => wrapT(g, [{ t: text, f: g.font }], maxW, lang).map(ln => ln.map(p => p.t).join(''));
// 헤드라인: 30px 에서 시작해 4줄·상자 높이 안에 들 때까지 줄인다(최소 18px)
function fitHead(g, text, lang) {
  // 30→18px 중 고른다: 줄 수가 적을수록, 한두 단어만 남은 짧은 줄(폭 30% 미만)이 없을수록 좋고, 같으면 큰 글자.
  // 22px 아래는 다른 방법이 없을 때만 쓴다(엔딩 문구가 너무 작아지지 않게)
  let best = null;
  for (let fs = 30; fs >= 18; fs -= 1) {
    g.font = `700 ${fs}px ${FONT}`;
    const lines = wrap(g, text, BOX.w, lang), lh = Math.round(fs * 1.42);
    if (lines.length > 4 || !lines.every(l => g.measureText(l).width <= BOX.w + 0.5)) continue;
    const short = lines.length > 1 && lines.some(l => g.measureText(l).width < BOX.w * 0.3);
    const score = lines.length * 10 + (short ? 6 : 0) + (fs < 22 ? 20 : 0);
    if (!best || score < best.score) best = { fs, lh, lines, score };
  }
  if (best) return best;
  g.font = `700 18px ${FONT}`; return { fs: 18, lh: 26, lines: wrap(g, text, BOX.w, lang) };
}
// CTA 한 줄: 조각들을 이어 그리되 상자보다 넓으면 글자를 줄인다
function fitRuns(g, runs, fs0, weight) {
  for (let fs = fs0; fs >= 11; fs -= 0.5) {
    let w = 0; for (const [t, k] of runs) { g.font = `${k ? 700 : weight} ${fs}px ${FONT}`; w += g.measureText(t).width; }
    if (w <= BOX.w) return { fs, w };
  }
  return { fs: 11, w: BOX.w };
}

export function createEnding(S0, lang) {
  const L = { head: S0.head, ...ctaRuns(S0) }, rtl = !!S0.rtl;
  const mk = () => { const c = document.createElement('canvas'); c.width = CSS_W * S; c.height = CSS_H * S; return c; };
  const textC = mk(), glowC = mk(), headC = mk(), tmp = mk();
  const tg = textC.getContext('2d'), gg = glowC.getContext('2d'), hg = headC.getContext('2d'), mg = tmp.getContext('2d');
  [tg, gg, hg, mg].forEach(g => g.setTransform(S, 0, 0, S, 0, 0));

  // 레이아웃 계산
  const head = fitHead(hg, L.head, lang);
  const c1 = fitRuns(hg, L.cta1, 19, 500), c2 = fitRuns(hg, L.cta2, 16, 400);
  const ctaFs = Math.min(c1.fs, c2.fs + 3);          // 두 줄의 크기 관계 유지
  const headH = head.lines.length * head.lh, gap = 26, ctaH = ctaFs * 1.5 + (ctaFs - 3) * 1.5 + 4;
  // 블록을 위쪽 화면(폰 위)에 두되 안전 영역 위 8% 아래로 내려가지 않게
  const blockH = headH + gap + ctaH, top = Math.max(BOX.top, 245 - blockH / 2);   // 안전 영역 위(96)와 폰 윗변(약 400) 사이 가운데
  const lines = head.lines.map((s, i) => {
    hg.font = `700 ${head.fs}px ${FONT}`;
    const w = hg.measureText(s).width;
    return { s, w, x: CSS_W / 2 - w / 2, y: top + i * head.lh + head.lh / 2 };
  });
  // 헤드라인 원본(단색) 한 번 그려 둔다
  hg.clearRect(0, 0, CSS_W, CSS_H); hg.font = `700 ${head.fs}px ${FONT}`; hg.textAlign = 'left'; hg.textBaseline = 'middle';
  hg.shadowColor = 'rgba(0,0,8,0.55)'; hg.shadowBlur = 10; hg.fillStyle = COLOR.head;
  hg.direction = rtl ? 'rtl' : 'ltr';
  for (const l of lines) hg.fillText(l.s, l.x, l.y);
  hg.direction = 'ltr';
  const ctaY1 = top + headH + gap + ctaFs * 0.75, ctaY2 = ctaY1 + ctaFs * 1.5 + 4;

  function drawRuns(g, runs, fs, weight, y, alpha) {
    // 아랍어는 첫 조각이 오른쪽 끝(drawLine rtl) — 왼쪽부터 이어 그리면 문장 순서가 뒤섞인다
    const pieces = runs.map(([t, k]) => ({ t, f: `${k ? 700 : weight} ${fs}px ${FONT}`, c: k ? COLOR[k] : COLOR.cta }));
    g.textBaseline = 'middle'; g.globalAlpha = alpha; g.shadowColor = 'rgba(0,0,8,0.55)'; g.shadowBlur = 8;
    drawLine(g, pieces, CSS_W / 2, y, { align: 'center', rtl });
    g.globalAlpha = 1; g.shadowBlur = 0;
  }
  function star(g, x, y, r, a) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(210,228,255,.55)'); gr.addColorStop(1, 'rgba(180,210,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    for (const [w, h] of [[r * 3.2, 1.6], [1.6, r * 3.2]]) {
      const l = g.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(.5, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = l; g.fillRect(x - w / 2, y - h / 2, w, h);
    }
    g.restore();
  }

  return {
    textCanvas: textC, glowCanvas: glowC, headCanvas: headC,
    // 줄별 사각형(CSS px) — 3D 판이 이 영역을 잘라 쓴다
    // 각 줄 자기 높이(줄 간격)만 — 넓게 잡으면 옆 줄 글자 일부가 딸려 와 먼저 보인다
    lineRects: () => lines.map(l => ({ x: 0, y: l.y - head.lh * 0.5, w: CSS_W, h: head.lh, cx: l.x + l.w / 2, cy: l.y })),
    // 빛줄기가 닿을 지점(첫 줄 왼쪽 끝) — 3D 빛줄기의 목표
    anchor: { x: lines[0].x - 8, y: lines[0].y },
    // te: 엔딩 시작(곡 반전 28.25초)부터의 초
    draw(te) {
      tg.clearRect(0, 0, CSS_W, CSS_H); gg.clearRect(0, 0, CSS_W, CSS_H);
      const n = lines.length;
      // 마지막 줄 끝의 반짝임(가산 레이어)
      const last = lines[n - 1], gq = (te - 2.6) / 0.7;
      if (gq > 0 && gq < 1) star(gg, rtl ? last.x - 16 : last.x + last.w + 16, last.y - head.lh * 0.42, head.fs * 0.5, Math.sin(Math.PI * gq));   // 마지막 글자에 겹치지 않게
      // 다운로드 안내 — 아래에서 살짝 올라오며
      const cq = Math.min(1, Math.max(0, (te - 3.0) / 0.9));
      if (cq > 0) {
        const e = 1 - Math.pow(1 - cq, 3), dy = 8 * (1 - e);
        drawRuns(tg, L.cta1, ctaFs, 500, ctaY1 + dy, e);
        const cq2 = Math.min(1, Math.max(0, (te - 3.25) / 0.9)), e2 = 1 - Math.pow(1 - cq2, 3);
        if (cq2 > 0) drawRuns(tg, L.cta2, ctaFs - 3, 400, ctaY2 + 8 * (1 - e2), e2);
      }
    },
    info: () => ({ fs: head.fs, lines: head.lines, ctaFs, top, bottom: ctaY2 + ctaFs }),
  };
}
