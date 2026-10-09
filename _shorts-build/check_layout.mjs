// 레이아웃 검사 — 영상 전체를 0.5초 간격으로 그려, **1초 이상 이어지는** 문제만 보고한다(날아가는 애니메이션의 순간 값은 무시).
//   · 자막(.cap2) 아래끝 > 236  · 카메라 안 글자가 오른쪽 475 / 아래 768 밖  · 한 줄 고정 요소의 가로 넘침
//   node check_layout.mjs i.html ko,en,de,...
// 의도된 예외(어둡게 깔린 버튼, 카드 넘기기에서 옆에 보이는 다음 카드 등)도 나오니 시각으로 구분해 읽는다. 기존 --check 는 이 편의 클래스를 모른다.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const lang of process.argv[3].split(',')) {
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  await p.goto(pathToFileURL(path.join(here, process.argv[2])).href + '?lang=' + lang); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  const out = await p.evaluate(() => {
    const vis = e => { let o = 1, x = e; while (x && x !== document.body) { o *= +getComputedStyle(x).opacity; x = x.parentElement; } return o; };
    const hits = new Map();   // 키 → [시각들]
    const add = (k, v) => { if (!hits.has(k)) hits.set(k, []); hits.get(k).push(v); };
    for (let v = 0.25; v < window.DURATION - .2; v += 0.5) {
      window.render(v * 1000);
      document.querySelectorAll('.cap2').forEach(e => { if (vis(e) < .98) return; const r = e.getBoundingClientRect();
        if (r.bottom > 236) add(`자막 아래끝 ${Math.round(r.bottom)} "${e.innerText.replace(/\n/g, '/').slice(0, 26)}"`, v); });
      document.querySelectorAll('.cam *').forEach(e => {
        if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return; if (vis(e) < .98) return;
        const r = e.getBoundingClientRect(); if (r.width < 1 || r.left > 540 || r.right < 0) return;
        if (r.right > 476 || r.bottom > 769) add(`영역 밖 R${Math.round(r.right)} B${Math.round(r.bottom)} "${e.textContent.trim().slice(0, 22)}"`, v);
      });
      document.querySelectorAll('.ibtn, .alr .bs span, .lg, .pill, .dlg .o, .chip, .b1, .bd, .cbtn span, .cs').forEach(e => { if (vis(e) < .98) return;
        if (e.scrollWidth > e.clientWidth + 1) add(`넘침 ${e.className} "${e.textContent.trim().slice(0, 22)}" ${e.scrollWidth}>${e.clientWidth}`, v); });
    }
    const res = []; hits.forEach((ts, k) => { const run = ts.some((t, i) => i > 0 && Math.abs(t - ts[i - 1] - .5) < .01); if (run) res.push(`${k} @${ts[0].toFixed(1)}~${ts[ts.length - 1].toFixed(1)}s`); });
    return res;
  });
  console.log(lang, out.length ? '\n  ' + out.join('\n  ') : 'OK'); await p.close();
}
await b.close();
