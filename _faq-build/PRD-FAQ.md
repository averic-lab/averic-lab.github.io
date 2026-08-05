# PRD — averic.co.kr FAQ 페이지

안부(Anbu) 앱 사용자용 FAQ를 **20개 언어**로 제공한다. 앱 화면을 스크린샷 대신 **HTML/CSS로 재현**하고, 설명 대상만 밝히는 스포트라이트 방식으로 보여준다.

| 항목 | 값 |
| --- | --- |
| 산출물 | `{lang}/faq.html` — **현재 한국어만 서비스**, 카피 확정 후 19개 언어 확장 |
| 소스 | `_faq-build/` (이 폴더 — `_` 접두라 웹 게시 제외) |
| 문구 출처 | 앱 저장소 번역 파일 → `faq-strings.json` (커밋됨) |
| 이미지 | **없음** — 앱 UI를 HTML/CSS로 재현 |
| 상태 | 재현도 승인 완료(2026-08-05) · **FAQ 본문 카피 미작성** |


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
[1] 추출 (수동 실행)
    앱 저장소 lib/app/core/translations/*.dart (20개)
        │  extract_strings.py
        ▼
    _faq-build/faq-strings.json   ← 커밋됨
[2] 생성 (수동 실행)
    faq-strings.json + template.html
        │  build_faq.py  (언어 목록은 i18n/build.py에서 임포트)
        ▼
[3] 산출  {ko,en,…}/faq.html × 20  →  git push  →  GitHub Pages
```

**앱 저장소를 빌드 시점에 직접 읽지 않는다.** JSON을 중간에 두는 이유:
- 두 저장소가 빌드 시점에 결합되지 않는다(어느 한쪽을 옮겨도 빌드가 깨지지 않음)
- 앱 문구가 바뀌었을 때 **JSON diff로 무엇이 바뀌었는지 보인다**
- 재추출이 명시적 행위가 된다(모르는 사이에 문구가 바뀌지 않음)


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
cd _faq-build && python3 extract_strings.py   # → faq-strings.json 갱신
git diff faq-strings.json                     # 무엇이 바뀌었는지 확인 후 커밋
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


## 6. 페이지 구조

### 언어 스위처 — 반드시 처리할 것

`i18n/build.py`의 `patch_inplace()`는 정규식이 `{code}/index.html`만 대상으로 하므로 **`faq.html`의 스위처를 영원히 갱신하지 않는다.** 그대로 두면 조용히 낡는다. 또한 기존 스위처는 `/{code}/`(홈)를 가리켜, 한국어 FAQ에서 언어를 바꾸면 **영어 홈**으로 간다.

**결정: `build_faq.py`가 스위처를 직접 생성하고, 링크는 `/{code}/faq.html`로 한다.**

언어 목록은 복제하지 않는다 — `i18n/build.py`를 임포트해 `META`/`ORDER`를 그대로 쓴다(임포트 부작용 없음을 확인함). 목록이 두 벌이 되어 어긋나는 것을 구조적으로 막는다.

```python
sys.path.insert(0, os.path.join(ROOT, "i18n"))
from build import META, ORDER   # 단일 출처
```

### 구성
1. 헤더 — 제목 + 언어 스위처 (사이트 `style.css` 재사용)
2. 주제 4개 — 각각: 질문 → 답변 → 목업(해당 부분 강조)
3. 푸터 — 홈·개인정보처리방침·이용약관 링크 (기존 페이지와 동일)

### 반응형·테마·접근성
- 좁은 화면에서 목업과 설명이 세로로 쌓일 것
- 아랍어는 `dir="rtl"` (`META`의 방향 값 사용)
- 강조 애니메이션은 `prefers-reduced-motion` 존중
- 목업은 조작 불가 — 실제 `button`/`input`을 쓰지 않거나 `tabindex="-1"`로 포커스에서 제외


## 7. 빌드·배포

```bash
cd _faq-build
python3 extract_strings.py   # 앱 문구가 바뀌었을 때만
python3 build_faq.py         # → ../{lang}/faq.html × 20
cd .. && git add -A && git commit -m "..." && git push
```

### 배포 후 반드시 확인할 것

`_config.yml`은 이번에 **처음 추가**된 것이라, Jekyll 빌드가 "암묵적 기본값"에서 "우리 설정"으로 바뀌었다. 실패하면 문서가 아니라 **사이트가 깨진다.** push 후 다음을 직접 확인한다:

1. `averic.co.kr/ko/` 가 정상 렌더 — 20개 언어 폴더가 그대로 게시되는지
2. `averic.co.kr/CLAUDE.md` 가 **404** — exclude가 실제로 동작하는지
3. `averic.co.kr/ko/faq.html` 정상 렌더 + 언어 스위처가 **다른 언어의 faq.html**로 이동하는지
4. `averic.co.kr/test/` · `/preview/` 가 여전히 정상 — 기존 페이지 회귀 없음


## 8. 언어 확장 — 한국어 먼저

**현재 한국어만 서비스한다.** 카피가 확정되면 나머지 19개 언어를 붙인다.

- `build_faq.py`는 **`copy.json`에 있는 언어만** 생성한다. 언어를 늘리려면 `copy.json`에 같은 구조로 키를 넣기만 하면 되고 **스크립트는 고칠 필요가 없다.**
- **언어 스위처도 `copy.json`에 실제로 있는 언어만 나열**한다. 없는 언어를 링크하면 404가 되기 때문이며, 언어가 하나뿐이면 스위처 자체를 렌더하지 않는다. `hreflang`도 동일 기준.
- 앱 문구(`faq-strings.json`)는 이미 20개 언어가 다 있으므로, 추가로 필요한 것은 **FAQ 설명문 번역뿐**이다.

### 두 종류의 문장을 혼동하지 말 것

| | 출처 | 20개 언어 상태 |
| --- | --- | --- |
| 앱 화면 문구 (`.tr` 키) | `extract_strings.py`로 **추출** | ✅ 완비 |
| FAQ 질문·답변 | `copy.json`에 **직접 작성** | 한국어만 |

### 카피 작성 원칙 (`copy.json`)

1. **질문은 증상으로 쓴다.** 사용자는 safety_home 화면을 보고 있지 않은 채 검색한다. "빨간 안내가 떠요"가 아니라 "걸음 수가 표시되지 않아요"로 시작한다.
2. **경고가 뜨는 폰과 증상을 겪는 사람이 다르다.** 경고는 전부 안부를 보내는 분의 폰에 뜨는데, 걸음수·위치 문제는 **가족이** 알아챈다. 답변은 반드시 "안부를 보내는 분의 폰에서 확인해 주세요"로 연결한다.
3. 랜딩의 문학적 어조를 쓰지 않는다. 평이하게 2~4문장.
4. 호칭은 **"본인" / "가족"**. "대상자/보호자" 같은 내부 용어 금지.
5. 목업 위치를 가리키는 표현("아래 화면에서")을 쓰지 말 것 — 목업은 넓은 화면에서 **오른쪽**, 좁은 화면에서 아래에 온다.


## 9. 불변 규칙

1. `{lang}/faq.html`은 **산출물**이다. 직접 수정하지 말고 `_faq-build/`의 스크립트를 고쳐 재생성한다.
2. 언어 목록은 `i18n/build.py`의 `META`/`ORDER`가 단일 출처다. 복제하지 말 것.
3. `faq-strings.json`은 손으로 고치지 말 것. `extract_strings.py`로만 갱신한다.
4. 추출 스크립트는 키가 하나라도 없으면 **실패해야 한다**. 폴백으로 넘어가지 말 것.
5. 재현 범위는 §2의 4개 주제로 한정한다.
6. 내부 문서를 새로 추가할 때는 `_` 접두 폴더에 두거나 `_config.yml`의 `exclude`에 추가한다(상세는 저장소 `CLAUDE.md`).
