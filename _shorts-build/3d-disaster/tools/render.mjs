// 장면 렌더러.  작업 폴더(bd3d)에서:
//   node tools/render.mjs s1 stills 0.5,3,6 [샘플=16]   → out/s1/still_<t>.png
//   node tools/render.mjs s1 video [샘플=64]            → out/s1.mp4  (프레임 = round(DURATION*30), 소리 없음)
//   node tools/render.mjs s1 sfx                        → out/s1_sfx.wav (style.sound 의 효과음만)
// 크롬은 GPU(Metal)로 돈다. 장면마다 포트를 따로 잡으므로 여러 장면을 동시에 돌려도 된다.
import { chromium } from 'playwright-core';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn, spawnSync } from 'child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const [seg, mode, arg, arg2] = process.argv.slice(2);
const LANG = process.env.LANGID || 'ko', OUTD = LANG === 'ko' ? 'out' : path.join('out', LANG);   // 언어별 결과 = out/<lang>/ (ko 는 out/)
if (!seg || !mode) { console.log('usage: node tools/render.mjs <seg> stills|video|sfx ...'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(p).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const port = server.address().port;
const samples = mode === 'stills' ? +(arg2 || 16) : mode === 'video' ? +(arg || 64) : 2;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 700, height: 1300 } });
let failed = false;
page.on('pageerror', (e) => { console.log('[page error]', e.message); failed = true; });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text()); });
await page.goto(`http://127.0.0.1:${port}/page.html?seg=${seg}&s=${samples}&lang=${LANG}`);
try { await page.waitForFunction(() => window.READY || window.__err, null, { timeout: 180000 }); } catch (e) { console.log('READY 시간 초과'); failed = true; }
if (failed) { await browser.close(); server.close(); process.exit(2); }
const D = await page.evaluate(() => window.DURATION);
const grab = (t) => page.evaluate((t) => { window.seek(t); return document.getElementById('c').toDataURL('image/png'); }, t);
fs.mkdirSync(path.join(ROOT, OUTD), { recursive: true });
if (mode === 'stills') {
  const dir = path.join(ROOT, OUTD, seg); fs.mkdirSync(dir, { recursive: true });
  for (const t of String(arg).split(',').map(Number)) {
    const url = await grab(t); const f = path.join(dir, `still_${t.toFixed(2)}.png`);
    fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('still', f);
  }
} else if (mode === 'video') {
  // video [샘플] [시작프레임] [끝프레임] → 구간만 렌더(out/<seg>_<시작>.mp4). 긴 장면을 여러 프로세스로 나눠 돌릴 때
  const NT = Math.round(D * 30), F0 = arg2 ? +arg2 : 0, F1 = process.argv[6] ? +process.argv[6] : NT, N = F1;
  const out = path.join(ROOT, OUTD, arg2 ? `${seg}_${String(F0).padStart(5, '0')}.mp4` : `${seg}.mp4`);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out]);
  const t0 = Date.now();
  for (let i = F0; i < N; i++) {
    const url = await grab(i / 30);
    const ok = ff.stdin.write(Buffer.from(url.split(',')[1], 'base64')); if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 30 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('video', out, N, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
} else if (mode === 'sfx') {
  const r = await page.evaluate(() => window.renderSfx());
  const raw = path.join(ROOT, OUTD, `${seg}_sfx.f32`), out = path.join(ROOT, OUTD, `${seg}_sfx.wav`);
  fs.writeFileSync(raw, Buffer.from(r.b64, 'base64'));
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'f32le', '-ar', '48000', '-ac', '2', '-i', raw, '-c:a', 'pcm_s16le', out]); fs.unlinkSync(raw);
  console.log('sfx', out, 'peak', r.peak.toFixed(3), 'duration', D);
}
await browser.close(); server.close();
