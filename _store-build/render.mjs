// 스토어 스크린샷 렌더러 — 파노라마 한 장을 패널(430px)별로 잘라 PNG 로 저장한다.
//   node render.mjs --lang ko --store google|apple|feature   (feature = Play 그래픽 이미지 1024×500) [--panels 1,2] [--out <폴더>]
// 기본 출력: ~/Desktop/안부 언어별 스크린샷/<언어 폴더>/(Android|ios)/
//   google → 1080×1920(9:16, 패널 폭 432 = 2.5배)   apple → 1290×2796(6.9", 패널 폭 430 = 3배)
//   Play 는 dsf 가 정수·반정수여야 정확히 1920 이 나온다(1080/430 배는 1919 로 깎인다) — 그래서 패널을 2px 더 넓게 자른다
// playwright-core 는 저장소에 설치하지 않는다 — PLAYWRIGHT_CORE 로 위치를, CHROMIUM_PATH 로 브라우저를 넘긴다.
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { pathToFileURL, fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const LANG = arg('lang', 'ko'), STORE = arg('store', 'google');
const FOLDER = { ko: '한국어', en: '영어', ja: '일본어', 'zh-CN': '중국어 간체', 'zh-TW': '중국어 번체', de: '독일어', fr: '프랑스', es: '스페인', it: '이탈리아',
  nl: '네덜란드', 'pt-BR': '포르투갈', ru: '러시아어', ar: '아랍어', tr: '튀르키어', pl: '폴란드', vi: '베트남', th: '태국어', sv: '스웨덴', hi: '힌디어', id: '인도네시아' };
const W = 430;
const SPEC = STORE === 'feature' ? { h: 500, cw: 1024, dsf: 2, sub: 'Android' } : { google: { h: 768, cw: 432, dsf: 2.5, sub: 'Android' }, apple: { h: 932, cw: 430, dsf: 3, sub: 'ios' } }[STORE];
const panels = arg('panels', '1,2,3,4,5,6,7,8').split(',').map(Number);
const N = 8;                                   // 파노라마 전체 폭 고정(아랍어 좌우 반전 좌표가 이 폭을 쓴다)
const RTL = ['ar'].includes(LANG);
const BASE = STORE === 'feature' ? path.join(os.homedir(), 'Documents', '스토어 앱 등록 정보', '안부 언어별 스크린샷') : path.join(os.homedir(), 'Desktop', '안부 언어별 스크린샷');
const out = arg('out', path.join(BASE, FOLDER[LANG], SPEC.sub));
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const FEATURE = STORE === 'feature';          // Play 그래픽 이미지 1024×500 (feature.html)
const page = await browser.newPage({ viewport: FEATURE ? { width: 1024, height: 500 } : { width: N * W + 4, height: Math.ceil(SPEC.h) }, deviceScaleFactor: SPEC.dsf });
await page.goto(pathToFileURL(path.join(here, FEATURE ? 'feature.html' : 'store.html')).href + `?lang=${LANG}&n=${N}&h=${SPEC.h}`);
await page.waitForSelector('body[data-ready="1"]');
await page.evaluate(() => document.fonts.ready);
if (process.argv.includes('--check')) {
  const issues = await page.evaluate(() => {
    const out = [], max = tb => tb.dataset.maxsel ? document.querySelector(tb.dataset.maxsel).getBoundingClientRect().top - 12 : +tb.dataset.max;
    document.querySelectorAll('.tb').forEach(tb => { const b = tb.getBoundingClientRect().bottom; if (b > max(tb) + 1) out.push(`문구 상자가 그림을 침범 ${Math.round(b)}>${Math.round(max(tb))}: ${tb.textContent.trim().slice(0, 24)}`); });
    document.querySelectorAll('.tb .h, .tb .sub, .tb .o').forEach(e => { if (e.scrollWidth > e.clientWidth + 1) out.push(`가로 넘침: ${e.textContent.trim().slice(0, 24)}`); });
    document.querySelectorAll('.chip, .locchip, .greet span, .weekcard span, .weekcard em, .scard.fc .act, .scard.fc .last, .scard.fc .pill, .nc .r1 b, .codechip b, .codechip small, .mapcard .mh, .endbrand span, .push .ti, .push .bo, .bubble .t').forEach(e => { if (e.scrollWidth > e.clientWidth + 1) out.push(`넘침(${e.className || e.tagName}): ${e.textContent.trim().slice(0, 28)}`); });
    return out;
  });
  console.log(`${LANG} ${STORE}: ${issues.length ? '\n  ' + issues.join('\n  ') : 'OK'}`);
  await browser.close(); process.exit(0);
}
if (FEATURE) {
  const file = path.join(out, 'feature-graphic-1024x500.png');
  const tmp = file + '.2x.png';
  await page.screenshot({ path: tmp, clip: { x: 0, y: 0, width: 1024, height: 500 } });   // 2배로 찍어 1024×500 으로 줄인다(가장자리가 곱다)
  const { execFileSync } = await import('child_process');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-vf', 'scale=1024:500:flags=lanczos', '-pix_fmt', 'rgb24', file]);
  fs.unlinkSync(tmp);
  console.log(file);
  await browser.close(); process.exit(0);
}
for (const p of panels) {
  const file = path.join(out, `${String(p).padStart(2, '0')}.png`);
  await page.screenshot({ path: file, clip: { x: ((RTL && p <= 2 ? 3 - p : p) - 1) * W, y: 0, width: SPEC.cw, height: SPEC.h } });
  console.log(file);
}
await browser.close();
