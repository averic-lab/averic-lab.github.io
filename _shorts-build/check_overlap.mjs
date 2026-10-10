// 겹침 검사 — 언어마다 카드·글자 높이가 달라 생기는 '글자끼리', '글자와 알림 카드'의 겹침을 찾는다.
//   영상 전체를 0.25초 간격으로 그려 겹치는 쌍을 모으고, **한국어(확정본)에 없는 겹침이 0.5초 이상 이어지는 것**만 보고한다
//   (헤드라인 두 줄이 튀어 오를 때 잠깐 스치는 것처럼 한국어에도 있는 겹침과, 날아가는 순간 값은 무시).
//   node check_overlap.mjs j.html en,de,fr,...        (기준 한국어는 자동으로 함께 잰다)
// 2026-10-11 떠나기 전 필수품 편: 여백·넘침 검사(--check, check_layout)로는 못 잡은 겹침 둘(배터리 각주·걸음수 라벨)을 이 방식으로 찾았다.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const STEP = .25, page_ = process.argv[2], langs = ['ko', ...process.argv[3].split(',').filter(x => x && x !== 'ko')];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const all = {};
for (const lang of langs) {
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  await p.goto(pathToFileURL(path.join(here, page_)).href + '?lang=' + lang); await p.evaluate(() => document.fonts.ready);
  const dur = await p.evaluate(() => window.DURATION), hits = [];
  for (let t = 0; t < dur; t += STEP) {
    const h = await p.evaluate(ms => {
      window.render(ms);
      const vis = e => { let o = 1; for (let n = e; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= +cs.opacity; } return o; };
      const C = [];
      [...document.querySelectorAll('[data-k],[data-h],.push')].forEach((e, i) => { if (vis(e) < .35) return;
        let rs; if (e.classList.contains('push')) rs = [e.getBoundingClientRect()];
        else { const rg = document.createRange(); rg.selectNodeContents(e); rs = [...rg.getClientRects()].filter(r => r.width > 2 && r.height > 2); }
        if (rs.length) C.push({ i, e, rs, id: e.dataset.k || e.dataset.h || 'push:' + (e.querySelector('.ti')?.textContent || '').slice(0, 14) }); });
      const res = [];
      for (let a = 0; a < C.length; a++) for (let c = a + 1; c < C.length; c++) {
        const A = C[a], Z = C[c]; if (A.e.contains(Z.e) || Z.e.contains(A.e)) continue;
        let m = 0; for (const r of A.rs) for (const q of Z.rs) { const w = Math.min(r.right, q.right) - Math.max(r.left, q.left), hh = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); if (w > 3 && hh > 3) m = Math.max(m, Math.min(w, hh)); }
        if (m > 0) res.push([A.i, Z.i, A.id, Z.id, Math.round(m)]);
      }
      return res;
    }, Math.round(t * 1000));
    h.forEach(x => hits.push([+t.toFixed(2), ...x]));
  }
  all[lang] = hits; await p.close();
}
await b.close();
const base = new Set(all.ko.map(h => `${h[0]}|${h[3]}|${h[4]}`));
for (const lang of langs.slice(1)) {
  const g = new Map();
  all[lang].filter(h => !base.has(`${h[0]}|${h[3]}|${h[4]}`)).forEach(h => { const k = `${h[3]} × ${h[4]}`; if (!g.has(k)) g.set(k, []); g.get(k).push([h[0], h[5]]); });
  const bad = [];
  g.forEach((v, k) => { const run = v.some((x, i) => i > 0 && Math.abs(x[0] - v[i - 1][0] - STEP) < .01 && Math.max(x[1], v[i - 1][1]) > 5);
    if (run) bad.push(`${k} @${v[0][0]}~${v[v.length - 1][0]}s 최대 ${Math.max(...v.map(x => x[1]))}px`); });
  console.log(lang, bad.length ? '\n  ' + bad.join('\n  ') : 'OK');
}
