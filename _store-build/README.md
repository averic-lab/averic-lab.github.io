# 스토어 스크린샷 빌드 (게시 제외 — `_` 접두 폴더)

파노라마 한 장(패널 430px × N장)을 HTML 로 그리고 패널별로 잘라 PNG 로 낸다. 앱 화면은 `../style.css` 목업, 앱 문구는 `../_shorts-build/data/<언어>.js`, 스토어 문구는 `copy/<언어>.js`.

```bash
npm i --prefix <임시 폴더> playwright-core
export PLAYWRIGHT_CORE=<임시 폴더>/node_modules/playwright-core
export CHROMIUM_PATH="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
node render.mjs --lang ko --store google   # 1080×1920 → ~/Desktop/안부 언어별 스크린샷/한국어/Android/
node render.mjs --lang ko --store apple    # 1290×2796 → …/한국어/ios/
```
- Play 는 패널을 432px 폭으로 잘라(2.5배) 정확히 1920px 을 맞춘다 — 430px×(1080/430배)는 1919px 로 깎인다.
- 높이는 스토어마다 다르다(Play 768 / App Store 932). 폰은 아래가 잘리게 놓아 높이 차이를 흡수한다.
- iOS 판에는 대상자 모드 화면과 Android 언급을 넣지 않는다(심사 포지셔닝).

## 구성 (한국어 8장, 2026-10-07)
1·2 훅(파노라마) → 3 매일 도착(잠금화면) → 4 단계별 알림 → 5 코드로 연결 → 6 한눈에 → 7 도움 요청·위치 → 8 개인정보·무료 체험.
- 3~8번 화면은 `store.js` 의 `SCREEN`/`CARD`/`nc` 빌더가 그린다. 문구는 `copy/<언어>.js` — **ko 만 있다.** 다른 언어는 앱 번역 키(`notifications_*`, `noti_*_body`, `add_subject_*`, `guardian_*`, `emergency_map_*`)에서 가져와 같은 키로 채운다(용어집 필독).
- 모든 장이 보호자 시점이라 Android·iOS 내용이 같다(iOS 심사 포지셔닝). 푸시 앱 이름은 한국어도 `Anbu`(사용자 결정).
- 걸음수: 성인 5,000보 이상, 고령자(아빠) 1천 보대. 아빠 카드는 오늘 안부가 없는 '주의' 상태라 오늘 막대가 0이다.

## 20개 언어 (2026-10-07)
- 마케팅 문구 원본: 한국어 `copy/ko.js`(손으로 씀), 나머지 19개 `marketing.py`. 앱 화면 안 문구는 `gen_copy.py` 가 앱 번역 키에서 가져와 `copy/<언어>.js` 를 만든다(직접 고치지 말 것).
- 전체 렌더: `./render_all.sh` (또는 언어 코드를 인자로). 넘침 검사: `node render.mjs --lang xx --store google --check`.
- ⚠️ 번역은 용어집 기준으로 쓴 초안이며 **원어민 검수 전**이다. 안부 → 언어별 용어(en wellness check, ja 安否, de Lebenszeichen …)는 용어집 §2.
- 아랍어(RTL)는 스토어가 목록을 뒤집어 보여 주므로 1·2번 파노라마를 좌우 반전하고(`data-pair`) 1번 파일에 오른쪽 절반을 낸다(`render.mjs` 의 `RTL`).
- 문구가 긴 언어는 `store.js` 의 `fit()` 이 글자를 줄이고, 4번 카드는 흐름 배치다.

## Play 그래픽 이미지 1024×500 (2026-10-08)
- `feature.html`/`feature.css` — 홈페이지 히어로 구도(폰 + 떠오른 조각), 폰은 세워 금속 테두리·두께를 준다. 배경은 옛 Play 그래픽의 파랑·청록.
- 글자는 `gen_feature.py` → `fdata/<언어>.js`(직접 고치지 말 것). 폰 화면은 앱 번역 키 + 앱 조합 규칙(labelSeparator·NumberText·아랍어 쌍수형), 푸시는 서버 `push_auto_report`와 같은 조합(`push_auto_report_title` + `별칭 · get_steps_message()`), 안전 코드 점선 라벨만 홈페이지 문구다. 서버 저장소가 옆에 있어야 돈다.
- 렌더: `node render.mjs --lang xx --store feature` → `~/Documents/스토어 앱 등록 정보/안부 언어별 스크린샷/<언어>/Android/feature-graphic-1024x500.png`. 아랍어는 구도 좌우 반전.
- 앱 이름은 한국어도 `Anbu`(사용자 결정). 홈페이지 히어로는 실제 앱 알림대로 한국어 `안부`다 — 둘이 다른 것은 의도.
