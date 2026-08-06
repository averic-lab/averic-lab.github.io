# PRD — averic.co.kr 사용자 페이지 (FAQ · 사용설명)

안부(Anbu) 앱 사용자용 페이지 **두 종**을 만든다. 둘 다 앱 화면을 스크린샷 대신 **HTML/CSS로 재현**한다.

| | FAQ | 사용설명 |
| --- | --- | --- |
| 산출물 | `{lang}/faq.html` × 20 | `{lang}/guide.html` |
| 다루는 것 | 신호가 늦거나 걸음수·위치가 비어 보일 때 (문제 해결) | 안전 코드를 만들어 가족에게 알려주고, 가족이 그 코드로 연결하기까지 (첫 사용) |
| 보여주는 법 | safety_home 한 화면 + 스포트라이트 | 화면 3종(설정 → 안전 홈 → 연결) 9단계 애니메이션 |
| 카피 | `copy/{lang}.json` | `guide-copy/{lang}.json` |
| 템플릿 | `template.html` | `guide-template.html` |
| 빌더 | `build_faq.py` | `build_guide.py` |
| 상태 | **20개 언어 배포 완료** (2026-08-06, `bd38607`) | **한국어만** — 카피 확정 후 19개 언어 확장 |

| 공통 항목 | 값 |
| --- | --- |
| 소스 | `_faq-build/` (이 폴더 — `_` 접두라 웹 게시 제외) |
| 앱 화면 문구 | `app-strings.json` (`extract_strings.py`가 앱 저장소에서 추출) |
| 공용 코드 | `common.py` (언어 메타·`@키` 치환·CSS 로딩) |
| 공용 CSS | `base.css`(팔레트·헤더) · `mockup.css`(앱 화면 복제) · `footer.css` |
| 이미지 | **없음** — 앱 UI를 HTML/CSS로 재현 |
| 진입점 | 각 언어 홈 헤더 링크(§6) |

> **폴더 이름이 `_faq-build`인데 두 페이지를 만든다.** 나누지 않은 이유: 앱 문구 추출·언어 목록·앱 화면 복제 CSS를 공유하기 때문이다. 폴더를 나누면 그 셋이 두 벌이 되어 어긋나며, 그건 §1이 스크린샷을 버린 이유와 같은 문제다. 이름은 낡았지만 중복보다 낫다.


## 1. 왜 스크린샷을 쓰지 않는가

이 결정은 되돌리지 말 것. 근거는 셋이다.

1. **문구를 새로 번역할 필요가 없다.** 필요한 문구가 앱 번역 파일 20개 언어에 이미 전부 있다. 추출해 넣으면 FAQ에 뜨는 문장이 **사용자가 앱에서 실제로 보는 그 문장**이다.
2. **낡지 않는다.** 스크린샷은 앱 문구가 바뀌어도 조용히 방치된다(실제로 "나도 안부 보호 받기" → "내 안전 코드 생성" 변경이 안내 페이지에 반영되지 않은 채 남아 있었다). 재추출하면 20개 언어가 한 번에 갱신된다.
3. **애초에 찍기 어려운 화면이다.** FAQ가 다루는 경고 3종은 **권한이 거부된 상태에서만** 나타난다. 스크린샷을 찍으려면 20개 로케일마다 걸음수·위치 권한을 해제하고 배터리 제한을 걸어야 한다.

**재현도 기준은 "픽셀 일치"가 아니다.** 비교할 원본 스크린샷 자체가 없으므로, 기준은 **같은 것으로 알아볼 수 있고 · 문구가 실제와 같고 · 색·간격이 소스 값과 같을 것**이다. 앱과 웹의 글꼴 렌더링 차이로 자간이 미세하게 다른 것은 허용된 차이다.


## 2. 다루는 주제 (4개)

safety_home 화면의 권한 관련 안내 4가지. **이 범위를 넓히지 말 것** — 안전코드 카드·상태 카드 등 나머지 UI는 "경고가 어디 있는지" 보여주는 맥락으로만 그리고, 그 자체를 설명하지 않는다.

| # | 주제 | 앱 소스 | 표시 조건 |
| --- | --- | --- | --- |
| ① | 배터리 사용 제한 | `battery_optimization_warning.dart` | `batteryUnrestricted == false` · Android |
| ② | 걸음수 권한 거부 | `activity_permission_warning.dart` | `activityPermissionDenied == true` |
| ③ | 위치 권한 거부 | `location_permission_warning.dart` | `locationPermissionDenied == true` |
| ④ | 휴면(자동 권한 해제) 안내 | `subject_home_controller.dart` `_checkHibernationSetting()` | `isAutoRevokeWhitelisted == false` · Android · **S 모드 전용** |

④는 **S 모드에서만** 나타난다(G+S 제외는 의도된 설계 — 앱 저장소 `PRD-FrontEnd.md` §9.3 참조). FAQ에서 "보호자 겸용으로 쓰면 이 안내가 안 뜬다"는 사실을 언급할지는 카피 작성 시 결정한다.


## 3. 아키텍처 — 3단계

```
[1] 추출 (수동 실행 — 앱 문구가 바뀌었을 때만)
    앱 저장소 lib/app/core/translations/*.dart (20개)
        │  extract_strings.py
        ▼
    _faq-build/app-strings.json   ← 커밋됨
[2] 생성 (수동 실행) — 두 페이지가 같은 JSON·같은 공용 CSS를 쓴다
    app-strings.json + 공용 CSS + copy/{lang}.json      + template.html
                                + guide-copy/{lang}.json + guide-template.html
        │  build_faq.py / build_guide.py  (언어 목록·공용 함수는 common.py)
        ▼
[3] 산출  {ko,en,…}/faq.html × 20 · {ko}/guide.html  →  git push  →  GitHub Pages
```

**앱 저장소를 빌드 시점에 직접 읽지 않는다.** JSON을 중간에 두는 이유:
- 두 저장소가 빌드 시점에 결합되지 않는다(어느 한쪽을 옮겨도 빌드가 깨지지 않음)
- 앱 문구가 바뀌었을 때 **JSON diff로 무엇이 바뀌었는지 보인다**
- 재추출이 명시적 행위가 된다(모르는 사이에 문구가 바뀌지 않음)

### 카피 안의 `@키` — 앱 문구 인용 (`interpolate()`)

카피에서 앱 화면 문구를 인용할 때는 문장을 옮겨 적지 않고 **`@키`를 쓴다**. 빌드 때 해당 언어의 실제 앱 문구로 치환된다.

```json
"q2": "가족 폰에 “@notifications_level_caution” 알림으로 “@noti_caution_missing_body”라고 왔어요."
```

**번역가가 인용문까지 옮기면 앱 화면과 어긋나기 때문**이다. 이 방식이면 인용문은 언제나 그 언어의 실제 앱 문구가 되고, 앱 문구가 바뀌어도 재추출만으로 20개 언어가 따라온다.

⚠️ 치환은 **긴 키부터** 수행한다 — 그렇지 않으면 `@noti_caution_missing_body`가 `@noti_caution`으로 잘못 잡힌다.


## 4. 문구 추출 계약 (`extract_strings.py`)

### 입력
`../../kr.co.anbucheck/lib/app/core/translations/{lang}.dart` 20개. 경로가 없으면 **즉시 실패**하고 종료한다 — 부분적인 JSON을 절대 쓰지 않는다.

### 파서가 반드시 처리해야 하는 것 (실측으로 확인된 함정)

세 가지 모두 실제로 겪은 것이다. 정규식을 단순화하다가 재발시키지 말 것.

1. **작은따옴표와 큰따옴표 양쪽** — `it_it.dart`만 큰따옴표를 쓴다. 작은따옴표만 처리하면 이 한 줄을 **조용히 놓치고** 해당 언어에 빈 값이 들어간다.
   ```dart
   'location_permission_warning':
       "La posizione non verrà inviata…",   // ← it_it
   ```
2. **키 다음 줄로 이어지는 값** — `ru_ru`, `ko_kr` 등. 한 줄짜리 정규식으로는 못 잡는다.
3. **Dart 이스케이프 해석** — `\n`, `\'`, `\"`, `\\`. 특히 `permission_hibernation_message`는 `\n\n`으로 3개 문단이 나뉘며, HTML에서 문단으로 렌더해야 한다.

### 검증 (실패 시 exit 1)
- **모든 키 × 모든 언어**가 존재하고 비어 있지 않을 것 — 하나라도 없으면 실패. 키 이름이 바뀌었는데 영어 폴백이 19개 언어에 조용히 나가는 것을 막는다.
- `permission_hibernation_highlight`가 `permission_hibernation_title`의 **부분 문자열**일 것. 앱이 `title.indexOf(highlight)`로 강조 범위를 찾고 못 찾으면 강조 없이 표시하므로, 목업도 같아야 한다. (현재 20개 언어 전부 매칭됨 — 2026-08-05 확인)

### 키 목록
`extract_strings.py`의 `KEYS` 상수가 유일한 권위다. 화면에 문구를 추가하려면 여기에 키를 넣고 재실행한다.

| 구분 | 키 |
| --- | --- |
| 경고 3종 | `stability_battery_warning_short`, `gs_activity_permission_denied_warning`, `location_permission_warning` |
| 휴면 다이얼로그 | `permission_hibernation_title`, `_highlight`, `_message`, `_go_to_settings`, `common_later` |
| 화면 맥락 | `app_name`, `subject_home_share_title`, `subject_home_check_title_last`, `subject_home_check_body_reported`, `heartbeat_schedule_change`, `heartbeat_daily_time`, `subject_home_report_button`, `_desc`, `subject_home_emergency_button`, `_desc` |

### 실행
```bash
cd _faq-build && python3 extract_strings.py   # → app-strings.json 갱신
git diff app-strings.json                     # 무엇이 바뀌었는지 확인 후 커밋
```


## 5. 목업 재현 규격

모든 값은 앱 소스에서 그대로 옮긴다. 아래 표가 기준이며, 앱이 바뀌면 여기도 함께 고친다.

### 공통 — 경고 3종
`radius 12` · `border 1px` · `padding 12/8` · `icon 20` · `gap 8` · `12sp w600 line-height 1.33` · `min-height 48`

| | 배경 | 테두리 | 글자 | 아이콘 |
| --- | --- | --- | --- | --- |
| ① 배터리 | `#FFF8E1` | `#F9A825` 40% | `#B75A00` | `#E65100` (`battery_alert`) + 우측 `chevron_right` |
| ② 걸음수 | `#FFEBEE` | `#B71C1C` 30% | `#B71C1C` | `#B71C1C` (`warning_amber`) |
| ③ 위치 | ②와 동일 | | | |

### ⚠️ 여백은 페이지가 아니라 위젯 자신이 갖는다

`safety_home_page.dart`에는 이 세 자리에 `SizedBox`가 **없다**. 위젯이 사라질 때(`SizedBox.shrink()`) 빈 여백이 남지 않도록 한 구조다. 방향이 셋 다 같지 않으니 주의:

| 위젯 | 여백 |
| --- | --- |
| ① 배터리 | `EdgeInsets.only(bottom: 12)` — 헤더에 붙고 아래가 떨어짐 |
| ② 걸음수 | `EdgeInsets.only(top: 12)` |
| ③ 위치 | `EdgeInsets.only(top: 12)` |

### ④ 휴면 다이얼로그
화면 위에 **겹쳐 뜨는 모달**로 표현한다.

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 배리어 | `rgba(0,0,0,0.54)` | `barrierColor` 미지정 → Flutter 기본 `Colors.black54` |
| 좌우 여백 | 40px (다이얼로그 폭 = 화면폭 − 80) | `AlertDialog` 기본 `insetPadding` |
| 표면 | `#FFFFFF` · `radius 16` | `_lightDialogTheme` |
| 제목 | `18 w700 #1A1C1C`, highlight만 `#B71C1C w700` | |
| 본문 | `14 #3F4948`, `\n\n` → 문단 | |
| 버튼 | `14 w500 #00685E` **양쪽 동일** | `TextButton`에 style 없음 + 전역 `TextButtonTheme` 없음 → `colorScheme.primary` |

**스크림이 화면을 덮을 때는 별도 dim(grayscale)을 걸지 않는다** — 앱에서 보이는 모습과 달라진다.

### 화면 맥락 (경고 위치를 보여주기 위한 배경)
`app bar(☰ + 앱이름)` → 헤더 → ① → 안전코드 카드 → ② → 상태 카드 → 시각 변경 → 안전 보고 → 긴급 → ③

- 안전코드 카드: `linear-gradient(135deg, #123C63, #1D6FA5)` + 흰 원 2개(7%·5%) + 코드 `42px w800 letter-spacing 3`
- 상태 카드: 흰 배경 + 좌측 5px 바 `#00685E` + 28px 원형 배지 `#FDECEC`
- 시각 변경 / 안전 보고: `#E0F2F1` 채움 + 40px 배지 + 라벨 `18 w700` + 설명 `12 w600`
- 긴급: `linear-gradient(135deg, #6E2020, #C07878)` + 테두리 `#571818`
- 콘텐츠 폭 **321px** (375 기준 화면에서 좌우 여백 27씩 제외)
- 광고 배너는 그리지 않는다

> 실제 앱에서는 세 경고가 동시에 다 뜨는 일이 드물다. FAQ 설명을 위해 한 화면에 모은 것이므로 **페이지에 그 취지를 한 줄 적는다**.

### 경고를 탭했을 때 뜨는 다이얼로그 (①②③)

각 섹션 아래에 접혀 있다가 `[화면에서 어디에 있는지 보기]`로 함께 펼쳐진다. 문구만 나열하지 않고 **앱과 같은 카드**로 그린다(흰 배경 · `radius 16` · 제목 `18 w700` · 본문 `14` · 우측 정렬 텍스트 버튼, 본문 `\n\n`은 문단 분리).

**셋의 동작이 다르다. 같은 것으로 뭉뚱그리지 말 것:**

| | 탭 시 실제 동작 | 다이얼로그 |
| --- | --- | --- |
| ① 배터리 | **조건 없이 항상** 우리 다이얼로그 → [설정 열기] 선택 시에만 OS 이동 | `stability_battery_dialog_title` / `_message` / [`common_later`] [`permission_hibernation_go_to_settings`] |
| ② 걸음수 | **보통 OS 권한 팝업**(`Permission.activityRecognition.request()`), `isPermanentlyDenied`일 때만 우리 다이얼로그 | `gs_activity_permission_settings_title` / `_body` / [`common_cancel`] [`gs_activity_permission_settings_go`] |
| ③ 위치 | ②와 동일 구조 | `location_permission_settings_title` / `_body_*` / 버튼은 ②와 **같은 키 재사용** |

- **설명(`lead`)은 다이얼로그 *위*에 둔다.** ②③은 우리 창이 아니라 안드로이드 권한 팝업이 먼저 뜨는 것이 보통이라, 창을 보여주기 전에 그 사실을 알려야 한다. 아래 각주로 달면 "대부분의 사용자가 겪는 일"이 예외처럼 읽힌다.
- **③ 위치 다이얼로그만 본문이 플랫폼별로 다르다**(`Platform.isIOS ? _body_ios : _body_android`). 두 창을 나란히 놓으면 거의 같은 것이 반복되므로 **Android/iPhone 전환 탭**으로 한 번에 하나만 보여준다. ①②는 분기가 없다.
- **OS 시스템 권한 팝업 자체는 그리지 않는다.** 제조사·안드로이드 버전·로케일마다 달라 하나를 그리면 상당수에게 틀린 그림이 되고, 웹페이지가 OS 대화상자를 흉내 내는 것 자체가 부적절하다. 글로 "안드로이드가 띄우는 팝업"이라고만 쓴다.


## 6. 페이지 구조

### 언어 스위처 — 반드시 처리할 것

`i18n/build.py`의 `patch_inplace()`는 정규식이 `{code}/index.html`만 대상으로 하므로 **`faq.html`의 스위처를 영원히 갱신하지 않는다.** 그대로 두면 조용히 낡는다. 또한 기존 스위처는 `/{code}/`(홈)를 가리켜, 한국어 FAQ에서 언어를 바꾸면 **영어 홈**으로 간다.

**결정: `build_faq.py`가 스위처를 직접 생성하고, 링크는 `/{code}/faq.html`로 한다.**

언어 목록은 복제하지 않는다 — `i18n/build.py`를 임포트해 `META`/`ORDER`를 그대로 쓴다(임포트 부작용 없음을 확인함). 목록이 두 벌이 되어 어긋나는 것을 구조적으로 막는다.

```python
sys.path.insert(0, os.path.join(ROOT, "i18n"))
from build import META, ORDER   # 단일 출처
```

### 홈에서 FAQ로 가는 진입점

각 언어 홈 헤더에 FAQ 링크를 둔다. **세 곳을 함께 고쳐야 20개 언어가 다 맞는다** — 랜딩 페이지는 생성 방식이 셋으로 갈리기 때문이다.

| 대상 | 방법 |
| --- | --- |
| 18개 생성 언어 | `i18n/template.html`에 링크 + `i18n/translations.json`에 `nav_faq` → `i18n/build.py` 재실행 |
| `ko/index.html` | **직접 수정** — `build.py`의 `patch_inplace()`는 언어 메뉴와 hreflang만 패치하고 본문은 건드리지 않는다 |
| `en/index.html` | 위와 동일 |

라벨은 기존 `nav_privacy`가 축약형(`プライバシー`)인 규칙에 맞춰 짧게 잡는다. 유럽어권은 `FAQ`가 실제 관용 표기이고, CJK·태국어·힌디어·아랍어는 자국어 표기를 쓴다.

⚠️ **`i18n/translations.json`은 `indent=1`로 직렬화되어 있다.** 스크립트로 키를 추가할 때 기본값(`indent=2`)으로 다시 쓰면 **2600줄이 바뀌어** 실제 변경을 검토할 수 없다. `json.dumps(t, ensure_ascii=False, indent=1)`로 원본 형식을 유지할 것.

### 구성
1. 헤더 — 사이트 로고 + 언어 스위처
2. 도입부 — eyebrow / 제목 / 리드
3. 본문 2단 — 좌: 주제별 Q&A, 우: 목업(넓은 화면에서 sticky)
4. 푸터 — 홈·개인정보처리방침·이용약관 링크

### 상호작용
- `[화면에서 어디에 있는지 보기]`는 **제목 바로 아래**에 둔다 — 주제를 알자마자 위치를 찾을 수 있어야 한다. 답변 끝에 두면 정작 궁금한 시점에 보이지 않는다.
- 이 버튼 하나가 **둘을 동시에** 한다: 목업에서 해당 경고 강조 + 그 경고를 탭했을 때 뜨는 다이얼로그 펼치기. 다시 누르면 접히고 목업은 전체 보기로 돌아간다.
- 텍스트가 아니라 누르는 것임이 보이도록 **돋보기 아이콘 + 알약형 테두리 + 채움**을 쓴다(밑줄 텍스트는 링크로도 버튼으로도 안 읽힌다).
- 상단 칩을 고르면 **해당 FAQ 본문으로 함께 스크롤**한다 — 단 **넓은 화면에서만**. 좁은 화면에서는 칩이 목업 바로 위에 있어, 위로 스크롤하면 방금 밝힌 화면이 시야에서 사라진다.

### 반응형·테마·접근성
- 좁은 화면에서 목업과 설명이 세로로 쌓일 것
- 아랍어는 `dir="rtl"` (`META`의 방향 값 사용)
- 강조 애니메이션과 **스크롤 이동** 모두 `prefers-reduced-motion` 존중
- 목업은 조작 불가 — `tabindex="-1"` / `disabled`로 포커스와 조작에서 제외


## 7. 빌드·배포

```bash
cd _faq-build
python3 extract_strings.py   # 앱 문구가 바뀌었을 때만
python3 build_faq.py         # → ../{lang}/faq.html × 20
python3 build_guide.py       # → ../{lang}/guide.html
cd .. && git add -A && git commit -m "..." && git push
```

`mockup.css`(두 페이지 공용)를 고쳤으면 **둘 다 재빌드**한다. 공용 CSS를 처음 분리할 때는 FAQ 20개 페이지를 재생성해 `git diff`가 비는지로 안전을 확인했다 — 같은 리팩터를 또 할 일이 있으면 그 방법을 쓸 것.

### 배포 후 확인 (2026-08-06 검증 완료)

`_config.yml`이 처음 들어간 배포였다 — Jekyll 빌드가 "암묵적 기본값"에서 "우리 설정"으로 바뀌므로, 실패하면 문서가 아니라 **사이트가 깨진다.** 아래는 커밋 `bd38607` 배포 후 실제로 확인한 결과이며, **`_config.yml`을 손댈 때마다 다시 확인한다.**

| # | 확인 항목 | 결과 |
| --- | --- | --- |
| 1 | `/`·`/ko/`·`/en/`·`/ja/`·`/ar/`·약관·`/test/`·`/preview/`·`style.css` | 전부 200 (회귀 없음) |
| 2 | `/CLAUDE.md` · `/_faq-build/PRD-FAQ.md` · `/_beta-test-build/build_test.py` | 전부 **404** (exclude·`_`접두 동작) |
| 3 | 20개 언어 `/{lang}/faq.html` | 전부 200 |
| 4 | 홈 헤더 FAQ 링크 → 클릭 이동 · 미치환 `@키` 0건 · 스위처 20개 · RTL `dir=rtl` | 정상 |


## 8. 언어 확장

**20개 언어 전부 서비스 중이다.** 구조상 언어를 늘리거나 줄이는 비용이 낮다.

- 각 빌더는 **자기 카피 폴더(`copy/` · `guide-copy/`)에 파일이 있는 언어만** 생성한다. 언어를 늘리려면 `ko.json`을 복사해 번역하고 파일명을 언어 코드로 바꾸면 되고 **스크립트는 고칠 필요가 없다.**
- **언어 스위처와 `hreflang`도 그 폴더에 실제로 있는 언어만 나열**한다. 없는 언어를 링크하면 404가 되기 때문이며, 언어가 하나뿐이면 스위처 자체를 렌더하지 않는다.
- **사용설명은 현재 한국어만이다.** 그래서 홈 헤더의 사용설명 링크도 `ko/index.html`에만 있다 — 20개 언어 헤더에 먼저 링크를 걸면 19개가 404가 된다. 카피 확정 후 19개 언어를 채울 때 `i18n/translations.json`의 `nav_guide`와 `en/index.html`을 함께 추가한다.
- 사용설명 번역 시 주의: **"왼쪽 단추는 복사, 오른쪽은 공유"** 같은 좌우 표현은 RTL(아랍어)에서 뒤집힌다. 방향 대신 아이콘이나 동작으로 표현할 것.
- 카피는 **언어당 한 파일**로 나눈다. 한 파일에 20개 언어를 넣으면 3000줄이 넘어 검토·수정이 불가능하다.
- 앱 문구(`app-strings.json`)는 20개 언어가 이미 다 있으므로, 언어 추가 시 필요한 것은 **FAQ 질문·답변 번역뿐**이다.

### 두 종류의 문장을 혼동하지 말 것

| | 출처 | 갱신 방법 |
| --- | --- | --- |
| 앱 화면 문구 (`.tr` 키) | `app-strings.json` — **추출** | `extract_strings.py` 재실행 |
| FAQ 질문·답변 | `copy/{lang}.json` — **직접 작성** | 손으로 수정·번역 |

카피 안에서 앱 문구를 인용할 때는 `@키`를 쓴다(§3).

### 카피 작성 원칙 (`copy/{lang}.json`)

1. **질문은 증상으로 쓴다.** 사용자는 safety_home 화면을 보고 있지 않은 채 검색한다. "빨간 안내가 떠요"가 아니라 "걸음 수가 표시되지 않아요"로 시작한다.
2. **경고가 뜨는 폰과 증상을 겪는 사람이 다르다.** 경고는 전부 안부를 보내는 분의 폰에 뜨는데, 걸음수·위치 문제는 **가족이** 알아챈다. 답변은 반드시 "안부를 보내는 분의 폰에서 확인해 주세요"로 연결한다.
3. 랜딩의 문학적 어조를 쓰지 않는다. 평이하게 2~4문장.
4. 호칭은 **"본인" / "가족"**. "대상자/보호자" 같은 내부 용어 금지.
5. 목업 위치를 가리키는 표현("아래 화면에서")을 쓰지 말 것 — 목업은 넓은 화면에서 **오른쪽**, 좁은 화면에서 아래에 온다.


## 9. 불변 규칙

1. `{lang}/faq.html`은 **산출물**이다. 직접 수정하지 말고 `_faq-build/`의 스크립트를 고쳐 재생성한다.
2. 언어 목록은 `i18n/build.py`의 `META`/`ORDER`가 단일 출처다. 복제하지 말 것.
3. `app-strings.json`은 손으로 고치지 말 것. `extract_strings.py`로만 갱신한다.
4. 추출 스크립트는 키가 하나라도 없으면 **실패해야 한다**. 폴백으로 넘어가지 말 것.
5. 카피 안의 `@키`는 **번역하지 않는다**. 앱 문구로 치환되는 자리다.
6. 재현 범위는 §2의 4개 주제로 한정한다.
7. 내부 문서를 새로 추가할 때는 `_` 접두 폴더에 두거나 `_config.yml`의 `exclude`에 추가한다(상세는 저장소 `CLAUDE.md`).
8. **앱 화면 복제 CSS는 한 벌만 둔다.** 두 템플릿은 각자 **본문 마크업**만 갖고, 기기 폭·색·글꼴 크기 같은 재현 값은 `mockup.css`(공용) / `guide-mockup.css`(사용설명 전용 위젯)를 인라인해 쓴다. 값을 템플릿에 복붙하면 한쪽만 고쳐져 어긋난다. `mockup.css`를 고쳤으면 **두 페이지를 모두 재빌드해 확인**한다.
9. **`@`가 든 앱 문구를 그냥 추출하지 않는다.** 앱이 `trParams`로 채우는 자리표시자(`@days`, `@version`)라 페이지에 그대로 나가면 사용자가 `@days`를 본다. 템플릿이 직접 채울 것만 `extract_strings.py`의 `PLACEHOLDER_OK`에 넣고, 나머지는 추출하지 않고 목업에서 그 요소를 뺀다(앱에서도 조건부로만 보이는 것들이다). 검사는 `extract_strings.py`가 한다.
10. **사용설명의 단계 수는 `guide-template.html`의 `STEPS`(JS)가 정한다.** 카피의 `steps` 길이가 다르면 `build_guide.py`가 실패한다 — 번호와 화면이 따로 놀기 때문이다.
11. **카피가 앱 동작을 단정할 때는 코드를 확인한다.** 실제로 틀렸던 것 둘: 안전 코드는 `^[A-Z0-9]{3}-[A-Z0-9]{4}$`라 **하이픈이 필수**이고(생략 가능이라 썼다가 정정), `연결` 탭은 연결관리 화면으로 가므로 거기서 [`add_subject_button`]을 한 번 더 눌러야 연결 화면이 나온다(바로 나온다고 썼다가 정정).
