// 숏폼 렌더러 — 페이지의 render(ms)를 프레임마다 호출해 캡처하고 ffmpeg 로 mp4 를 만든다.
// 벽시계를 쓰지 않으므로 몇 번을 돌려도 같은 영상이 나온다.
//
//   node render.mjs a.html out.mp4 [--lang en]                         전체 렌더
//   node render.mjs a.html --stills 0,5,8,13,18 <출력폴더> [--lang en]  지정 초의 정지 화면만
//   node render.mjs a.html --check [--lang en]                         글자 넘침 검사
//
// playwright-core 는 이 저장소에 설치하지 않는다(게시 저장소라 node_modules 를 두지 않는다).
// 설치된 위치를 PLAYWRIGHT_CORE 로 넘긴다. 브라우저는 ~/Library/Caches/ms-playwright 의 것을 쓴다.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const li = argv.indexOf('--lang');
const LANG = li >= 0 ? argv.splice(li, 2)[1] : 'ko';
const [page_, ...rest] = argv;
const FPS = 30;

// 헤드리스 셸이 없으면 CHROMIUM_PATH 로 일반 크로미움 실행 파일을 넘긴다.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(here, page_)).href + '?lang=' + LANG);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

const shot = async ms => { await page.evaluate(m => window.render(m), ms); return page.screenshot({ type: 'png' }); };

if (rest[0] === '--check') {
  // 자막이 폰/카드 영역을 침범하는지, 한 줄짜리 요소가 넘치는지 검사한다(투명도와 무관하게 레이아웃만 본다)
  const issues = await page.evaluate(() => {
    const out = [], lim = 250;
    document.querySelectorAll('.cap').forEach(e => { const b = e.getBoundingClientRect().bottom; if (b > lim) out.push(`자막 아래끝 ${Math.round(b)}px > ${lim}: ${e.textContent.slice(0, 30)}`); });
    document.querySelectorAll('.clock, .push .ti, .scard .r1, .calls .row').forEach(e => { if (e.scrollWidth > e.clientWidth + 1) out.push(`가로 넘침: ${e.className} ${e.textContent.slice(0, 30)}`); });
    const dp = document.querySelector('.dphone');
    if (dp) { const r = dp.getBoundingClientRect();
      document.querySelectorAll('.p2 .clock, .p2 .city, .dnote').forEach(e => { const q = e.getBoundingClientRect();
        const rg = document.createRange(); rg.selectNodeContents(e);
        const w = Array.from(rg.getClientRects()).some(x => x.right > r.left && x.left < r.right && x.bottom > r.top && x.top < r.bottom);
        if (w) out.push(`폰과 겹침: ${e.className} ${e.textContent.slice(0, 30)}`); }); }
    document.querySelectorAll('.end .q').forEach(e => { if (e.getBoundingClientRect().height > 150) out.push(`엔딩 문장 4줄 이상: ${e.textContent.slice(0, 30)}`); });
    return out;
  });
  console.log(`${LANG} ${page_}: ${issues.length ? issues.join(' | ') : 'OK'}`);
} else if (rest[0] === '--stills') {
  const fs = await import('fs');
  const out = rest[2];
  fs.mkdirSync(out, { recursive: true });
  for (const s of rest[1].split(',')) fs.writeFileSync(path.join(out, `${LANG}-${path.parse(page_).name}-${s}s.png`), await shot(Number(s) * 1000));
} else {
  const out = rest[0];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(duration * FPS);
  for (let i = 0; i < n; i++) {
    const buf = await shot((i * 1000) / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 90 === 0) process.stdout.write(`\r${page_} ${i}/${n}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`\r${page_} → ${out} (${n} frames)`);
}
await browser.close();
