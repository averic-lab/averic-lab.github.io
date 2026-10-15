// 분할 영상(헤더·검색 결과)의 배경 PNG 와 둥근 모서리 마스크 PNG 를 만든다.
//   node gen_split_assets.mjs <출력 폴더>      (PLAYWRIGHT_CORE / CHROMIUM_PATH 는 render.mjs 와 같다)
// 배경은 feature.css 와 같은 남색 그라데이션 + 별. 마스크는 흰 둥근 사각형(알파 병합용).
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const KINDS = {
  header: { W: 3840, H: 1646, pw: 832, ph: 1480, r: 48 },
  search: { W: 2880, H: 1920, pw: 956, ph: 1700, r: 52 },
};
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [k, s] of Object.entries(KINDS)) {
  const pg = await browser.newPage({ viewport: { width: s.W, height: s.H }, deviceScaleFactor: 1 });
  await pg.setContent(`<html><body style="margin:0;width:${s.W}px;height:${s.H}px;overflow:hidden;background:#050b2a">
  <div style="position:absolute;inset:0;background:
    radial-gradient(${s.W * .35}px ${s.H * .3}px at ${s.W * .72}px ${s.H * 1.05}px, rgba(40,235,255,.55), transparent 72%),
    radial-gradient(${s.W * .6}px ${s.H * .6}px at ${s.W * .8}px ${s.H * .5}px, rgba(40,90,230,.42), transparent 70%),
    radial-gradient(${s.W * .5}px ${s.H * .8}px at ${s.W * .12}px ${s.H * .2}px, rgba(30,70,190,.35), transparent 70%),
    linear-gradient(105deg, #040a26 0%, #081a55 42%, #0a2a7a 70%, #0a3591 100%)"></div>
  <svg id="sp" width="${s.W}" height="${s.H}" style="position:absolute;left:0;top:0"></svg></body></html>`);
  await pg.evaluate(([W, H]) => { let t = 7; const r = () => (t = (t * 16807) % 2147483647) / 2147483647; let g = '';
    for (let i = 0; i < 260; i++) { const x = r() * W, y = r() * H, rr = (.8 + r() * 2.4) * W / 2000; g += `<circle cx="${x}" cy="${y}" r="${rr}" fill="${r() > .5 ? '#9ff3ff' : '#fff'}" fill-opacity="${(.15 + r() * .5).toFixed(2)}"/>`; }
    document.getElementById('sp').innerHTML = g; }, [s.W, s.H]);
  await pg.screenshot({ path: path.join(out, `bg_${k}.png`) });
  const mp = await browser.newPage({ viewport: { width: s.pw, height: s.ph }, deviceScaleFactor: 1 });
  await mp.setContent(`<html><body style="margin:0;background:#000"><div style="width:${s.pw}px;height:${s.ph}px;border-radius:${s.r}px;background:#fff"></div></body></html>`);
  await mp.screenshot({ path: path.join(out, `mask_${k}.png`) });
}
await browser.close();
console.log(JSON.stringify(KINDS));
