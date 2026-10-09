// 전 언어 토큰 검사 — 영상 전체를 0.4초 간격으로 그려 화면 글자에 치환 안 된 @토큰·undefined·NaN 이 남았는지 본다.
//   node check_tokens.mjs i.html ko,en,ja,...        (SHOWCAPS=1 이면 그 언어 자막을 전부 출력)
// 필요: PLAYWRIGHT_CORE, CHROMIUM_PATH (README 「렌더」). 사용법 튜토리얼 편(i.html)에서 처음 썼다.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const langs = process.argv[3].split(',');
for (const lang of langs) {
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(pathToFileURL(path.join(here, process.argv[2])).href + '?lang=' + lang); await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(() => { const bad = new Set(); const caps = new Set();
    for (let v = 0.2; v < window.DURATION; v += 0.4) { window.render(v * 1000);
      const txt = document.querySelector('.v').innerText;
      (txt.match(/@[a-z]+|undefined|NaN/g) || []).forEach(x => bad.add(x));
      document.querySelectorAll('.cap2').forEach(e => { if (+getComputedStyle(e).opacity > .9) caps.add(e.innerText.replace(/\n/g, ' / ')); }); }
    return { bad: [...bad], caps: [...caps] }; });
  console.log(lang, errs.length ? 'ERR ' + errs.join('|') : '', r.bad.length ? '토큰/undefined: ' + r.bad.join(',') : 'OK');
  if (lang === 'ko' || process.env.SHOWCAPS) r.caps.forEach(c => console.log('   ', c));
  await p.close();
}
await b.close();
