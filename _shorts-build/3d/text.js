// 언어별 줄바꿈·조각 배치 — 화면(screen.js)·푸시 배너(main.js)·엔딩(ending.js) 공용
//  · 띄어쓰기 언어: 단어 단위
//  · 일본어·중국어: 글자(grapheme) 단위 + 닫는 문장부호는 앞 글자에 붙인다(줄 첫머리 금지)
//  · 태국어: Intl.Segmenter 단어 단위(Array.from 은 결합 모음·성조 부호를 떼어 놓는다)
//  · 아랍어: 조각을 오른쪽부터 배치(RTL) — 굵기·색이 다른 조각을 왼쪽부터 이어 그리면 문장 순서가 뒤섞인다
const CJK = /^(ja|zh)/;
const NO_START = /^[、。，．,.!?！？：；:;）」』】〉》”’・ー〜…%％]/;

export function tokens(text, lang) {
  if (CJK.test(lang)) {
    const out = [];
    for (const { segment } of new Intl.Segmenter(lang, { granularity: 'grapheme' }).segment(text)) {
      if (out.length && NO_START.test(segment)) out[out.length - 1] += segment; else out.push(segment);
    }
    return out;
  }
  if (lang === 'th') {
    return Array.from(new Intl.Segmenter('th', { granularity: 'word' }).segment(text), s => s.segment);
  }
  return text.split(' ').map((w, i) => (i ? ' ' : '') + w);
}

// runs: [{t, f(폰트 문자열), c?(색)}] → 줄 배열(줄마다 조각 배열). '\n' 은 강제 줄바꿈
export function wrap(g, runs, maxW, lang) {
  const toks = [];
  for (const r of runs) {
    r.t.split('\n').forEach((part, pi) => {
      if (pi) toks.push({ br: true });
      for (const t of tokens(part, lang)) if (t) toks.push({ t, f: r.f, c: r.c });
    });
  }
  const lines = []; let cur = [], cw = 0;
  const push = () => { lines.push(merge(cur)); cur = []; cw = 0; };
  for (const tk of toks) {
    if (tk.br) { push(); continue; }
    g.font = tk.f; let w = g.measureText(tk.t).width;
    if (cw + w > maxW && cur.length) {
      push();
      const t2 = tk.t.replace(/^ /, ''); g.font = tk.f; cur.push({ ...tk, t: t2 }); cw = g.measureText(t2).width;
    } else { cur.push(tk); cw += w; }
  }
  if (cur.length) push();
  return lines.filter(l => l.length);
}
function merge(pieces) {
  const out = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (last && last.f === p.f && last.c === p.c) last.t += p.t; else out.push({ ...p });
  }
  if (out.length) out[out.length - 1].t = out[out.length - 1].t.replace(/\s+$/, '');
  return out;
}
export function lineWidth(g, pieces) { let w = 0; for (const p of pieces) { g.font = p.f; w += g.measureText(p.t).width; } return w; }

// 한 줄을 화면에 그린다. align: 'left' | 'right' | 'center' 기준점 x. rtl 이면 첫 조각이 오른쪽 끝.
// 반환: 조각별 시각 위치 [{t, x(왼쪽 끝), w}]
export function drawLine(g, pieces, x, y, { align = 'left', rtl = false, color, dry = false } = {}) {
  const total = lineWidth(g, pieces);
  let left = align === 'left' ? x : align === 'right' ? x - total : x - total / 2;
  const pos = [];
  let cursor = rtl ? left + total : left;
  for (const p of pieces) {
    g.font = p.f; const w = g.measureText(p.t).width;
    const px = rtl ? cursor - w : cursor;
    pos.push({ t: p.t, x: px, w, f: p.f });
    if (!dry) {
      g.direction = rtl ? 'rtl' : 'ltr'; g.textAlign = 'left'; g.fillStyle = p.c || color;
      g.fillText(p.t, px, y);
    }
    cursor = rtl ? cursor - w : cursor + w;
  }
  g.direction = 'ltr';
  return pos;
}
// 아랍 문자로 된 줄인가(앱은 LTR 이라도 아랍어만 있는 줄은 한 덩어리 RTL 로 흐른다)
export const isRtlText = s => /[֐-ࣿ]/.test(s);
