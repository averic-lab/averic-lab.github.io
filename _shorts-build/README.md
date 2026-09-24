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
./render_all.sh                                        # 전체(40편, 약 25분) — 또는 ./render_all.sh en ja
```

브라우저에서 `a.html?lang=en&play`로 열면 실시간 재생으로 흐름을 볼 수 있다.

## 새 영상 추가

1. 페이지를 만든다(`a.html` 복사). 문구는 전부 `data-k`/`data-h`로, 새 문구는 `shorts.json` `langs` 20개 언어에 추가.
2. `shorts.json` `videos`에 `{id, page, title, date}`를 넣는다. **홈에 넣지 않을 영상은 `home`을 빼거나 false.**
3. `./render_all.sh` → 검토 페이지 언어 폴더와 공개 영상 페이지(`/{언어}/shorts.html`)에 자동으로 나타난다(최신 날짜가 위). 홈 해질녘에는 `home:true`인 편만 나온다.

## 소리 (배경음악 · 효과음)

- **배경음악은 모든 편 공통으로 고정**한다 — `shorts.json` 최상위 `audio`(We'll Be Okay, 0초부터). 같은 곡·같은 시작점이라야 음악만 듣고도 "그 쇼츠"로 알아본다. 편마다 바꾸지 말 것. 소리를 빼려면 그 편에 `"audio": false`. 원본은 `../media/bgm/`.
- **효과음**: 페이지의 `window.SFX = [{t, file, rel?, duck?}]`. `t`는 **화면에 팝업이 뜨는 시각**(그 요소의 `data-t`와 같은 값). 파일 앞 무음은 `audio.py`가 재서 당기므로 신경 쓰지 않는다. 원본은 `../media/sfx/`.
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
