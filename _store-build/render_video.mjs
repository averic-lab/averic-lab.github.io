// App Store 헤더·검색 결과용 반복 영상 — feature.html 의 구도를 6초 주기로 천천히 움직여 mp4 로 낸다.
//   node render_video.mjs --lang ko --kind header|search [--out <폴더>] [--secs 6]
//   header = 21:9 3840×1646 / search = 3:2 1920×1280 (Apple 규격: 30fps, 5~30초, mp4·mov·m4v, 기본 음소거·반복)
// playwright-core 는 PLAYWRIGHT_CORE, 브라우저는 CHROMIUM_PATH 로 넘긴다(render.mjs 와 같다). ffmpeg 필요.
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { pathToFileURL, fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const LANG = arg('lang', 'ko'), KIND = arg('kind', 'header'), SECS = +arg('secs', 6), FPS = 30;
const SPEC = {
  header: { W: 1166.4, H: 500, dsf: 3.3, w: 3840, h: 1646, name: 'header-video-3840x1646.mp4' },   // 21:9
  search: { W: 1024, H: 683, dsf: 2, w: 1920, h: 1280, name: 'search-video-1920x1280.mp4' },      // 3:2
}[KIND];
const FOLDER = { ko: '한국어', en: '영어', ja: '일본어', 'zh-CN': '중국어 간체', 'zh-TW': '중국어 번체', de: '독일어', fr: '프랑스', es: '스페인', it: '이탈리아',
  nl: '네덜란드', 'pt-BR': '포르투갈', ru: '러시아어', ar: '아랍어', tr: '튀르키어', pl: '폴란드', vi: '베트남', th: '태국어', sv: '스웨덴', hi: '힌디어', id: '인도네시아' };
const out = arg('out', path.join(os.homedir(), 'Documents', '스토어 앱 등록 정보', '안부 언어별 스크린샷', FOLDER[LANG], 'ios'));
fs.mkdirSync(out, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anbuvid-'));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: Math.ceil(SPEC.W), height: SPEC.H }, deviceScaleFactor: SPEC.dsf });
await page.goto(pathToFileURL(path.join(here, 'feature.html')).href + `?lang=${LANG}&w=${SPEC.W}&h=${SPEC.H}`);
await page.waitForSelector('body[data-ready="1"]'); await page.evaluate(() => document.fonts.ready);
const N = Math.round(SECS * FPS);   // 6초 = 180프레임. __setT 의 주기(6초)와 같아 마지막 프레임 다음이 첫 프레임으로 이어진다
for (let i = 0; i < N; i++) {
  await page.evaluate(t => window.__setT(t), i / FPS);
  await page.screenshot({ path: path.join(tmp, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: Math.ceil(SPEC.W), height: SPEC.H } });
}
await browser.close();
const file = path.join(out, SPEC.name);
// 방송 범위 BT.709 를 명시한다 — 재생기마다 색이 달라지지 않게
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(tmp, '%04d.jpg'),
  '-vf', `scale=${SPEC.w}:${SPEC.h}:flags=lanczos:in_range=pc:out_range=tv:out_color_matrix=bt709,setsar=1,format=yuv420p`, '-c:v', 'libx264', '-profile:v', 'high',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-crf', '15', '-r', String(FPS), '-an', '-movflags', '+faststart', file]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(file);
