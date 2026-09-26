# 숏폼 영상 빌드 (게시 제외 — `_` 접두 폴더)

홈페이지 목업처럼 **앱 화면을 HTML/CSS로 그린 페이지**를 프레임 단위로 캡처해 mp4 로 만든다.
한 편 = 페이지 한 장이고, `?lang=xx`로 20개 언어가 같은 페이지에서 나온다.

| 파일 | 역할 |
|---|---|
| `shorts.json` | **단일 출처.** `videos`(편 목록, `home:true`면 홈 해질녘에 나옴) + `langs`(영상에만 나오는 문구 20개 언어) |
| `gen.py` | `data/<언어>.js`(페이지가 읽는 문구 묶음) + 검토 페이지 `preview/shorts/` 생성 |
| `a.html` / `b.html` | 영상 페이지. 540×960 CSS 캔버스(×2 = 1080×1920). 글자는 `data-k`/`data-h`로 채운다 |
| `shorts.css` | 캔버스·자막·공통 엔딩 + `../style.css` 앱 목업을 평평하게 펴는 덮어쓰기 |
| `engine.js` | 언어 데이터 로드, 결정적 타임라인(`data-t`/`data-fx`, `render(ms)`), 엔딩, Intl 시각·숫자 형식 |
| `render.mjs` | Playwright 로 `render(ms)`를 1/30초씩 캡처 → ffmpeg(libx264, yuv420p, faststart). `--stills`·`--check` |
| `render_all.sh` | 언어 × 편 전체 렌더(동시 4개) → `media/shorts/<언어>/<id>.mp4` + `.jpg` → `gen.py` 재실행 |
| `audio.py` | 배경음악 + 효과음을 섞어 렌더된 mp4 에 넣는다(영상은 다시 인코딩하지 않음). `render_all.sh` 가 자동으로 부른다 |

## 문구 출처 — 한 곳씩만

| 문구 | 출처 |
|---|---|
| 자막·통화 기록·말풍선·도시·딸 이름 등 영상 전용 | `shorts.json` `langs` |
| 앱 화면(대시보드 카드, "마지막 확인: 방금 전" 등) | 앱 저장소 `translations/*.dart` — `gen.py`의 `APP_KEYS` (홈 추출 계약 `extract_strings.py KEYS`는 늘리지 않는다) |
| 푸시 제목 `✅ 오늘 안부 확인 완료` | 서버 저장소 `i18n/messages.py` `push_auto_report_title` |
| 엄마 호칭, 엔딩 문장 | `i18n/translations.json` `nick1`, `dawn_q3_html` |
| 시각·날짜·숫자 형식 | 브라우저 Intl (언어별 12/24시간제, 자릿수 구분 자동) |

B의 두 도시 시각은 `home_tz`/`away_tz`로 **실제 시간대 계산**이다(집 밤 11:40 기준). 도시를 바꾸면 자녀 쪽이 낮 시간인지 확인할 것.

## 렌더

```bash
brew install ffmpeg                                    # 1회
npm i --prefix <임시 폴더> playwright-core
export PLAYWRIGHT_CORE=<임시 폴더>/node_modules/playwright-core
export CHROMIUM_PATH="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

python3 gen.py                                         # 데이터 먼저
node render.mjs b.html --check --lang de               # 글자 넘침·겹침 자동 검사
node render.mjs a.html --stills 1.5,8.5 /tmp/s --lang ja   # 정지 화면 확인
./render_all.sh                                        # 전체(편 × 20개 언어) — 또는 ./render_all.sh en ja
VIDEOS=neighbor-friends ./render_all.sh ko             # 그 편만(쉼표로 여러 편) — 새 편을 만들 때 다른 편을 다시 인코딩하지 않는다
```

브라우저에서 `a.html?lang=en&play`로 열면 실시간 재생으로 흐름을 볼 수 있다.

## 새 영상 추가

1. 페이지를 만든다(`a.html` 복사). 문구는 전부 `data-k`/`data-h`로, 새 문구는 `shorts.json` `langs` 20개 언어에 추가.
2. `shorts.json` `videos`에 `{id, page, title, date}`를 넣는다. **홈에 넣지 않을 영상은 `home`을 빼거나 false.**
3. `./render_all.sh` → 검토 페이지 언어 폴더와 공개 영상 페이지(`/{언어}/shorts.html`)에 자동으로 나타난다(최신 날짜가 위). 홈 해질녘에는 `home:true`인 편만 나온다.

## 소리 (배경음악 · 효과음)

- **배경음악은 모든 편 공통으로 고정**한다 — `shorts.json` 최상위 `audio`(We'll Be Okay, 0초부터). 같은 곡·같은 시작점이라야 음악만 듣고도 "그 쇼츠"로 알아본다. 편마다 바꾸지 말 것. 소리를 빼려면 그 편에 `"audio": false`. 원본은 `../media/bgm/`.
- **효과음**: 페이지의 `window.SFX = [{t, file, rel?, duck?}]`. `t`는 **화면에 팝업이 뜨는 시각**(그 요소의 `data-t`와 같은 값). 파일 앞 무음은 `audio.py`가 재서 당기므로 신경 쓰지 않는다. 원본은 `../media/sfx/`.
  효과음은 기본 **2초**에서 자른다. 타이핑처럼 화면 동작과 길이를 맞춰야 하는 소리는 `len`(초)으로 늘린다 — 글자가 다 찍히는 시간과 같게.
- **팝업·알림이 뜰 때만** 효과음을 넣는다. 자막 전환마다 넣지 않는다.
- **크기 기준**(2026-09-24 실청취로 정함 — 처음 -16 LUFS·효과음 +8~25dB는 "볼륨을 반으로 줄여도 크고 튄다"였다):
  - 전체 -22 LUFS(-20에서 실청취로 2 더 낮춤), True Peak -1.5 dBTP 이하
  - 배경음악 페이드인 0.8초, 페이드아웃은 영상 끝 2초에만(엔딩 문구 동안 유지)
  - 효과음은 **그 순간 배경음악보다 +3~6dB**(기본 +4.5, cue의 `rel`로 조정) — 튀지 않게. 그 순간에도 Short-term -16 LUFS 이하
  - 더킹은 앱 알림음(`duck: true`)에만 2.5dB. 효과음 앞뒤 짧은 페이드
  - `audio.py`가 매번 이 기준을 실측해 보고하고, 넘으면 `⚠`를 찍는다
- 곡을 고를 때는 **저음 위주·타악기 없는 곡**이 효과음과 덜 겹친다. 고음이 밝은 곡(Valley Sunset, Serene Moments)은 효과음을 가린다.
- ⚠️ **음원 원본과 `.mix/`는 커밋하지 않는다**(`.gitignore`). Mixkit 라이선스가 파일 단독 재배포를 금지하고, `media/`는 그대로 공개되는 폴더다. 라이선스 증빙은 `../media/bgm/LICENSE-증빙.md`·`../media/sfx/LICENSE-증빙.md`(역시 커밋 제외 — 원본과 함께 보관).

## 규칙

- **벽시계·CSS 무한 애니메이션을 쓰지 말 것.** 모든 움직임은 `render(ms)`의 함수여야 한다.
- **폰 목업은 `.pw` 래퍼를 `scale()`로만 줄인다** — 안쪽 좌표는 홈페이지 실측값(352×722).
- **폰 안 글씨는 영상에서 읽히지 않는다.** 보여줘야 할 알림·카드는 `.float`으로 확대해 띄운다.
- **안전 영역**: 위 8%·아래 20%·오른쪽 12%는 틱톡·릴스 UI가 덮는다.
- **좌우 위치는 논리 속성(`inset-inline-*`)으로** — 아랍어가 자동으로 뒤집힌다. 좌표를 코드에 박지 말고 요소에서 잰다.
- **일본어·중국어 자막은 `word-break: normal`** (`shorts.css`) — keep-all이면 절 하나가 안 끊겨 넘친다.
- **걸음수는 현실적인 값으로** — 성인 **5,000보 이상**, 고령자(할머니 등) **1천 보대**(딱 1,000은 피한다). 800보는 집 앞 편의점을 다녀온 정도라 "아파서 거의 못 걸었다"를 뜻하게 된다.
- **걸음수 카드는 `setWeek([7일치])` 하나로 채운다**(engine.js). 막대 높이·상단 숫자(7일 **최댓값** — 오늘이 아니다)·활동량 라벨(앱과 같은 7일 평균 기준)·알림의 "오늘 N보"가 전부 여기서 나온다. 숫자를 따로 박으면 앱 화면과 어긋난다.
- **푸시 문구는 실제 서버 형식** — 제목 `push_auto_report_title`, 본문 `별칭 · noti_steps_body`.
- 특정 메신저·OS 화면을 흉내 내지 않는다(말풍선·통화 기록은 일반형).
- 프레임 PNG·node_modules·`data/`를 커밋하지 말 것(`data/`는 `.gitignore`).
- 영상은 다시 렌더할 때마다 git 기록에 쌓인다(편당 약 1.4MB × 20개 언어). 한국어로 확정한 뒤 전체를 돌린다.

## 유튜브 전달 — 공유 드라이브 (2026-09-26)

유튜브 업로드·공개는 **공개 담당 LLM**이 맡고, 영상과 설명은 **공유 드라이브**로 넘긴다(이 저장소는 그쪽에서 열리지 않는다).

- 위치: 계정 anbucheck1018 의 **내 드라이브/안부 쇼츠/**. 이 Mac에서는 `~/Library/CloudStorage/GoogleDrive-anbucheck1018@gmail.com/내 드라이브/안부 쇼츠/`(Drive 데스크톱 앱 동기화, 바탕화면에 별칭).
  ```
  안부 쇼츠/videos/<언어>/<편id>.mp4   — 제작 담당(Claude Code)이 넣는다
  안부 쇼츠/upload.json               — 제작 담당만 수정: 제목(임시)·설명·태그·카테고리·렌더일
  안부 쇼츠/publish.json              — 공개 담당만 수정: youtube_id·title_live·description_live·status 등
  ```
- **파일마다 쓰는 사람은 한 명** — 드라이브에서 둘이 같은 파일을 고치면 충돌 사본이 생긴다.
- 키는 `"편id/언어"`(예: `"lost-mom/ko"`). 실제 유튜브에 올라간 값은 **publish.json이 기준**이고, 값이 있으면 upload.json보다 우선한다.
- **새 편·다국어판을 만들면**: 렌더가 끝난 mp4를 `videos/<언어>/`에 복사하고 upload.json에 항목을 추가한다. **설명·태그는 사용자 확인을 받은 뒤** 넣는다. 설명 끝에는 공통 문구(`안부 — 매일 자동으로 전해지는 안부` / `스토어에서 'Anbu' 검색` / `https://averic.co.kr`)를 붙인다. 앱 사실 규칙(구조·위치 추적 약속 금지, 안부가 전화를 대신한다고 쓰지 않기 등)은 설명에도 똑같이 적용한다.
  - **줄바꿈 — 모든 편·모든 언어의 설명에 적용**(다국어판 포함): 휴대폰에서 한눈에 읽히게 짧은 줄로 끊고, 이야기 / 기능 설명 / 해시태그 / 공통 문구를 빈 줄로 나눈다. 번역할 때도 문장을 한 덩어리로 붙이지 말고 같은 단락 구조를 유지한다.
  - **해시태그**: 설명의 첫 해시태그 3개가 유튜브 제목 위에 뜬다. 1인가구가 주제인 편은 `#1인가구`를 **맨 앞**에 둔다(SNS 공통 핵심 태그).
  - **긴급 도움 요청이 나오는 편**은 "위치는 버튼을 누른 그 순간 한 번만 전달되고 그날 자정에 삭제되며, 평소에는 위치를 보내지 않습니다"를 넣는다 — 위치 추적 앱으로 읽히지 않게.
- ⚠️ **감사(audit) 전에는 API로 업로드하지 않는다** — 감사 전 API 프로젝트로 올린 영상은 비공개로 고정된다(공식 문서). 그동안은 공개 담당이 Studio로 올린다. 감사 후 API로 올릴 때는 **업로드 전에 두 json 모두에서 편id/언어를 확인**하고, 인증된 채널이 브랜드 계정 **@anbucheck**인지 조회한 뒤에만 올린다(개인 채널은 AdMob·세금 정보가 연결돼 있다).
- 홈페이지 영상은 앞으로 **유튜브 재생으로 바꾼다**(결정만, 미구현): 빌드가 publish.json 의 `status`가 `unlisted`/`public`이면 `youtube_id`로 재생하고, 그 외에는 지금처럼 `media/shorts/` mp4를 재생한다. `publish_at`은 보지 않는다. 첫 영상이 공개된 뒤 착수.
