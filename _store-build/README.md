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

## App Store 헤더·검색 결과 (2026-10-15)
App Store Connect "헤더 및 검색 결과" 탭용. iOS 27+ 에서만 보인다. 모두 선택 항목이다(검색 결과를 비우면 스크린샷이 대신 쓰인다).
- 규격(Apple 크리에이티브 애셋 사양): 헤더 21:9 3840×1646 또는 16:9 5244×2950(PNG) · 검색 결과 3:2 1920×1280~3840×2560 또는 16:9 5244×2950(PNG). 영상은 30/60fps, 5~30초, .mov/.m4v/.mp4, 기본 음소거·반복(헤더는 사용자가 소리를 켤 수 있고 검색 결과는 못 켠다).
- **정지 이미지**: `node render.mjs --lang xx --store apple-feature` → `…/<언어>/ios/header-5244x2950.png`, `search-3840x2560.png`. Play 그래픽과 같은 구도에 위아래 여백만 더한다(`feature.html?h=`, `?w=`).
- **짧은 반복 영상(시험)**: `node render_video.mjs --lang xx --kind header|search` — 위 구도를 6초 주기로 천천히 움직인다. ⚠️ **영상 안에 기록된 화면 비율(SAR)이 1:1 이 아니면 "파일 크기가 유효하지 않습니다"로 거부된다** — `setsar=1` 을 빼지 말 것. 색은 BT.709 방송 범위로 명시.
- **분할 영상(실사용)**: 홈페이지의 쇼츠 두 편(안부 앱 소개·아무것도 하지 않아도)을 나란히 놓은 영상. `gen_split_assets.mjs <폴더>` 로 배경·둥근 모서리 마스크를 만들고 `python3 split_video.py --lang xx --kind header|search --assets <폴더> [--end <엔딩 mp4>]` → `…/<언어>/ios/<ID>-header-info.mp4`, `<ID>-search-info.mp4`. ID 는 ko en ja **cn tw** de fr es it **pt** nl ru ar tr pl vi th sv hi id.
  - 헤더 3840×1646, 검색 결과 2880×1920(원본 1080×1920 패널을 거의 그대로 쓴다), 29.8초, 소리는 왼쪽 영상의 배경음악만(효과음 없음, 끝 페이드아웃).
  - 원본은 `_shorts-build/.mix/hq/`(1080×1920 고화질). 30초 제한 때문에 왼쪽(37초)은 '안드로이드도·아이폰도'(21.0~23.8)와 '도움이 필요할 때'+'무료·$9.99'(27.3~32.2)를 들어내고 0.25초 크로스페이드로 잇는다. 오른쪽(34초)은 팝업 구간(7.3~13.0)을 1.8배, 카드 슬라이드(15.5~21.5)를 2배로 줄이고 끝나면 마지막 장면에서 기다린다. 맨 앞 1초는 두 썸네일을 합친 정지 화면(스토어가 첫 프레임을 썸네일로 쓴다). **20개 언어 원본의 길이가 모두 같아(37.058초·34.0초) 한 타임라인을 쓴다.**
  - ⚠️ **iOS 에는 Android·Google Play 를 언급하지 않는다**(심사 포지셔닝). 오른쪽 영상 한국어판 엔딩에 "App Store · Google Play에서" 가 박혀 있어 3D 소스(`_shorts-build/3d/strings.json` 의 ko `store`)를 "App Store에서 “Anbu” 검색"으로 고쳐 29~34초만 다시 렌더링해(`T0=29 T1=34 node rshot.mjs video …`) `.mix/hq/anbu-3d-end-ko.mp4` 로 두고 `--end` 로 이어 붙인다. 다른 19개 언어의 엔딩 문구는 원래 '앱 스토어'라 그대로 쓴다. 가격(연 $9.99) 장면도 뺐다.
  - ⚠️ ffmpeg 가 합성 중 드물게 멈춘다(CPU 0%로 수 분~수십 분). `SPLIT_TIMEOUT`(초, 기본 300)으로 끊고 다시 돌린다.
  - ⚠️ 쉘 연관 배열(`declare -A`)은 macOS 기본 bash 3.2 에서 안 된다 — 언어 목록 일괄 실행은 파이썬으로 할 것(첫 시도에서 여러 언어가 한 파일에 덮어써졌다).
  - 헤더 영상은 올려서 재생까지 확인했다(한국어). 아랍어는 두 패널의 좌우를 바꾸지 않았다.
