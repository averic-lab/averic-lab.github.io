// 숏폼 렌더러 — 페이지의 render(ms)를 프레임마다 호출해 캡처하고 ffmpeg 로 mp4 를 만든다.
// 벽시계를 쓰지 않으므로 몇 번을 돌려도 같은 영상이 나온다.
//
//   node render.mjs a.html ../preview/shorts/a.mp4            전체 렌더
//   node render.mjs a.html --stills 0,5,8,13,18 <출력폴더>     지정 초의 정지 화면만
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
const [, , page_, ...rest] = process.argv;
const FPS = 30;

// 헤드리스 셸이 없으면 CHROMIUM_PATH 로 일반 크로미움 실행 파일을 넘긴다.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(here, page_)).href);
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.DURATION);

const shot = async ms => { await page.evaluate(m => window.render(m), ms); return page.screenshot({ type: 'png' }); };

if (rest[0] === '--stills') {
  const fs = await import('fs');
  const out = rest[2];
  fs.mkdirSync(out, { recursive: true });
  for (const s of rest[1].split(',')) fs.writeFileSync(path.join(out, `${path.parse(page_).name}-${s}s.png`), await shot(Number(s) * 1000));
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
