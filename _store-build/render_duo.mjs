// iPhone Duo 스토어 스크린샷 렌더러 — 일반 폰 스크린샷과 같은 구성 8장(1·2 파노라마 + 3~8).
//   node render_duo.mjs --lang ko [--only s12,s3] [--kind inner|outer|both] [--out <폴더>]
//   속 화면 2007×2853(669×951 @3x) / 겉 화면 1398×2034(669×973 @3x 를 ffmpeg 로 줄임 — 두 화면 비율이 거의 같다)
// 기본 출력: ~/Documents/스토어 앱 등록 정보/안부 언어별 스크린샷/<언어 폴더>/ios/<ID>-duo-(inner|outer)-NN.png
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFileSync } from 'child_process';
import { pathToFileURL, fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const LANG = arg('lang', 'ko');
const FOLDER = { ko: '한국어', en: '영어', ja: '일본어', 'zh-CN': '중국어 간체', 'zh-TW': '중국어 번체', de: '독일어', fr: '프랑스', es: '스페인', it: '이탈리아', nl: '네덜란드', 'pt-BR': '포르투갈', ru: '러시아어', ar: '아랍어', tr: '튀르키어', pl: '폴란드', vi: '베트남', th: '태국어', sv: '스웨덴', hi: '힌디어', id: '인도네시아' };
const ID = { ko: 'ko', en: 'en', ja: 'ja', 'zh-CN': 'cn', 'zh-TW': 'tw', de: 'de', fr: 'fr', es: 'es', it: 'it', nl: 'nl', 'pt-BR': 'pt', ru: 'ru', ar: 'ar', tr: 'tr', pl: 'pl', vi: 'vi', th: 'th', sv: 'sv', hi: 'hi', id: 'id' };
const out = arg('out', path.join(os.homedir(), 'Documents', '스토어 앱 등록 정보', '안부 언어별 스크린샷', FOLDER[LANG], 'ios'));
fs.mkdirSync(out, { recursive: true });
const only = arg('only', 's12,s3,s4,s5,s6,s7,s8').split(',');
const kinds = { inner: [['inner', 951]], outer: [['outer', 973]], both: [['inner', 951], ['outer', 973]] }[arg('kind', 'both')];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
for (const [kind, H] of kinds) for (const s of only) {
  const pano = s === 's12', W = pano ? 1338 : 669;
  // 6배로 찍어 lanczos 로 절반 — 기울인(3D) 기기 안의 가는 막대 가장자리가 울퉁불퉁하지 않게(초표본화).
  // 3D 요소는 배율과 무관하게 1배로 그려지므로 --zz 도 6 으로 맞춘다(duo.css).
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 6 });
  await page.goto(pathToFileURL(path.join(here, 'duo.html')).href + `?lang=${LANG}&s=${s}&h=${H}`);
  await page.addStyleTag({ content: ':root { --zz: 6; }' });
  await page.waitForSelector('body[data-ready="1"]'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  const shots = pano ? [[1, 0], [2, 669]] : [[+s.slice(1), 0]];
  for (const [n, x] of shots) {
    const file = path.join(out, `${ID[LANG]}-duo-${kind}-${String(n).padStart(2, '0')}.png`);
    const tmp = file + '.big.png'; await page.screenshot({ path: tmp, clip: { x, y: 0, width: 669, height: H } });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-vf', `scale=${kind === 'inner' ? '2007:2853' : '1398:2034'}:flags=lanczos`, '-pix_fmt', 'rgb24', file]); fs.unlinkSync(tmp);
    console.log(file);
  }
  await page.close();
}
await browser.close();
