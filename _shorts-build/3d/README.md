# 3D 앱 소개 숏폼 (three.js) — 2026-10-04

크롬 테두리 폰이 돌며 → 화면 아래 회로 기판에 빛 펄스가 모이고 → 안부 알림 화면이 켜져 푸시 팝업 5장이
튀어나오고 → 대시보드·30일 걸음수(활동적 줌인) → 엔딩 문구로 끝나는 34초 영상. `_shorts-build` 의
HTML/SVG 편과 달리 **WebGL(three.js)** 로 그리며, 렌더러도 이 폴더의 것을 쓴다.

| 파일 | 역할 |
|---|---|
| `main.js` | 장면 전체 — 폰(크롬 프레임·유리·베젤), 카메라 경로(키프레임·Catmull-Rom), 팝업, 타임라인, 효과음 신호(`window.SFX`), 후처리(빛 번짐 기준 1.3) |
| `screen.js` | 폰 화면 속 앱 UI(캔버스 2D, dp 단위·앱 코드 값 그대로) — 알림 목록·대시보드·30일 창 |
| `board.js` | 화면이 켜지기 전 비치는 회로 기판 + 빛 펄스 + 칩 번쩍임 |
| `ending.js` | 엔딩 문구(언어별 `ENDING`), 안전 영역 안 자동 맞춤(최대 4줄), 다운로드 안내 |
| `icons.js` | Material 아이콘 경로(`@material-design-icons/svg` round/outlined 에서 추출) |
| `rshot.mjs` | 렌더러 — `render(ms)` 를 1/30초씩 캡처 → ffmpeg. GPU(Metal) 옵션 켬 |
| `cues.mjs` | 페이지의 `window.SFX` 를 `cues.json` 으로 뽑는다 |
| `mix.py` | 배경음악(thinking-about-you, 0초부터 — 곡 28.25초 반전 = 엔딩 빛줄기) + 효과음 → -22 LUFS / TP -1.5 |

## 다시 빌드하기

`node_modules` 는 두지 않는다(게시 저장소). 작업 폴더를 따로 만들어 설치한다.

```bash
W=<작업폴더>; mkdir -p $W && cp _shorts-build/3d/* $W/ && cd $W
npm i three@0.186.1 esbuild@0.28.2 playwright-core@1.63.0 @material-design-icons/svg@0.14.15
cp <앱 저장소>/assets/icon/app_icon_512.png .
npx esbuild main.js --bundle --format=iife --loader:.png=dataurl --outfile=main.bundle.js
python3 -m http.server 8765 &        # file:// 로는 ES 모듈·이미지가 막혀 로컬 서버로 연다
export C="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
VLANG=ko node rshot.mjs stills 6,10,25,33.5 st            # 정지 화면
VLANG=ko node rshot.mjs video out_video.mp4               # 전체(약 8분, 1020프레임)
node cues.mjs && python3 mix.py out_video.mp4 out.mp4     # 소리 — 언어와 무관해 한 번만 섞으면 된다
```

## 규칙·교훈 (되돌리지 말 것)

- **빛 번짐 기준은 1.3** — 앱 화면이 흰색(밝기 1.03)이라 1.08 이면 유리 반사가 조금만 더해져도 화면이 하얗게 번진다.
- **커버 유리는 직접 짠 프레넬 셰이더** — 물리 재질은 정면에서도 반사가 커서 앱 화면을 덮었다.
- **엔딩 글자는 빛 효과를 글자에 입히지 않는다** — 작은 글씨가 뭉개진다. 글자는 단색(기준 아래), 빛은 별도 가산 레이어에만.
- **줄별 일어서기 판은 줄 높이만 잘라 쓴다** — 넓게 자르면 옆 줄 글자 일부가 먼저 보인다.
- 30일 창 줌인 동안 "활동량 : 활동적" 은 **고해상도 글자 판**으로 바꿔 보여 준다(화면 캔버스 2.8배로는 뭉개진다).
- 앱 화면·푸시 문구는 지어내지 않는다 — 앱 `noti_*`·대시보드 번역 키, 서버 `i18n/messages.py` 의 언어별 문구.
  배터리 알림은 엄마(정상 안부와 같은 heartbeat 로 나가는 조합). 아빠에게 배터리 부족 → 미수신 주의는 실제로 생기지 않는다
  (서버가 배터리 < 20% 미수신을 '배터리 방전 추정'으로 보낸다).
- 영상 파일은 **저장소에 커밋하지 않는다**(약 29MB) — 유튜브 공개 후 사이트는 유튜브로 재생하고 저장소엔 jpg 만.
