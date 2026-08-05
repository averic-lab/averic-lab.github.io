# averic.co.kr — Averic Lab 사이트 (GitHub Pages)

안부(Anbu) 앱의 공식 웹사이트. **GitHub Pages**로 호스팅되며 `git push` 시 자동 배포된다.

| 항목 | 값 |
| --- | --- |
| 도메인 | `averic.co.kr` (CNAME) |
| 저장소 | `averic-lab/averic-lab.github.io` (branch `main`) |
| 배포 | `main`에 push → GitHub Pages 자동 게시 |
| 게시 엔진 | Jekyll(기본) — `_config.yml`·`.nojekyll` 없음. **`_` 로 시작하는 폴더는 게시에서 제외됨** |

## 사이트 구조

- `index.html` — 루트 스플래시(언어 자동 분기), `style.css`, `site.js`
- `ko/`, `en/`, `ja/` … (20개 언어 폴더) — 각 언어별 `index.html` / `privacy-policy.html` / `terms-of-service.html`
- `i18n/` — 다국어 페이지 빌드 도구(`build.py`, `template.html`, `translations.json`)
- `CNAME` — `averic.co.kr`

## 비공개 테스트 안내 페이지 (이 저장소에서 관리)

Google Play 비공개 테스트 / 마케팅용으로 만든 **자기완결형 단일 HTML** 2종. 둘 다 CSS·JS 인라인 + **스크린샷을 base64로 내장**해 의존성이 없다. `<meta name="robots" content="noindex,nofollow">`로 검색 비노출(unlisted) 처리 — 인증 기반 비공개는 GitHub Pages 한계로 불가, **URL을 아는 사람만 접근**.

| 페이지 | URL | 용도 | 성격 |
| --- | --- | --- | --- |
| `test/index.html` | **averic.co.kr/test/** | **비공개 테스터(전문 외주 업체)** | 절차 중심 단순 가이드. 메커니즘 설명 제외, "무엇을 누르는지"만 |
| `preview/index.html` | **averic.co.kr/preview/** | **마케팅 / 인플루언서** | 앱 동작·핵심기능까지 상세 설명 |

> ⚠️ `test/`·`preview/`의 `index.html`은 **직접 수정하지 말 것.** 아래 빌드 스크립트로 생성되는 산출물이다.

### 빌드 (소스 = `_beta-test-build/`)

`_` 접두 폴더라 **웹에 게시되지 않는다**. 편집·재생성은 여기서 한다.

```
_beta-test-build/
├── build_test.py        # → ../test/index.html    (테스터용 단순 버전)
├── build_preview.py     # → ../preview/index.html  (마케팅 상세 버전)
└── img/                 # 웹용으로 축소한 스크린샷(JPEG, 폭 560) — base64 소스
    ├── settings.jpg  safety_home.jpg  dashboard.jpg  add_subject.jpg
    └── connection_management.jpg  notifications.jpg  notifications_settings.jpg
```

```bash
cd _beta-test-build
python3 build_test.py      # test/index.html 재생성
python3 build_preview.py   # preview/index.html 재생성
```

- HTML 본문·CSS는 각 스크립트의 `HTML = r"""..."""` 문자열에 들어 있다. **문구/디자인 수정은 이 문자열을 고치고 재빌드**한다.
- 이미지는 `__IMG_SETTINGS__` 같은 토큰을 `img/`의 파일에서 읽어 `data:image/jpeg;base64,...`로 치환한다.
- 스크린샷 원본(고해상도)은 앱 저장소 쪽 `~/Desktop/안부 언어별 스크린샷/한국어/`의 PNG. 교체 시 `sips -Z 560 원본.png --out img/이름.jpg -s format jpeg -s formatOptions 82`로 축소해 `img/`에 넣고 재빌드.

### 두 페이지의 내용 범위

공통 전제: **G+S(보호자가 대상자 겸함) 방식**으로 테스트하되, "G+S" 같은 내부 약어는 노출하지 않고 앱의 실제 버튼 문구("내 안전 코드 생성")나 일반어("안부 보호 활성화")로 표현한다. Android 전용. 버그 보고 메일: **l10s18bok@naver.com**.

**`test/` (테스터용) 7단계:** ①설치&권한 허용 ②안부 보호 활성화 ③서로의 코드 연결(본인 코드 금지) ④안부시각 전원 동일(오후 12~6시) ⑤매일 루틴(★핵심: 하루 1회 실행→알림 확인→스와이프 종료) ⑥경고 시 '안전확인 완료' ⑦긴급 도움 요청(선택). 5번에 **알림 2종 구분**(💗 "안부 확인이 필요합니다"=내 안부 즉시 전송 / 그 외 주의·경고·긴급=내가 지켜보는 대상자 알림, 예약시각+2h 이후 터치) 포함.

**`preview/` (마케팅):** 위 흐름 + heartbeat 자동 전송 원리, +2시간 안전망, 스와이프 종료 이유, 권한 단계, 참고 화면(알림설정·연결관리) 등 상세.

### 핵심 UI 라벨 (앱 실제 문구 — 변경 시 두 페이지 동기화)

- 안부 보호 활성화 버튼: **내 안전 코드 생성** (활성화 후 같은 자리 → **내 안전 코드 확인**)
- 안부시각 변경: **안부 푸시 알림 시각 변경**
- 경고 해소 버튼: **안전확인 완료**
- 수동 보고: **지금 바로 안전 보고하기** / 긴급: **도움이 필요해요**
- ⚠️ 제공된 설정 스크린샷은 **활성화 후** 상태("내 안전 코드 확인")라, 테스터가 처음 보는 "내 안전 코드 생성"과 다르다 — 두 페이지 모두 이 차이를 명시하고 있으니 유지할 것.

## 배포 (git push)

GitHub Pages라 `main`에 push하면 자동 게시된다. **배포는 사용자가 요청할 때만** 수행한다.

```bash
cd /Users/macmini/Project/Anbu/averic-lab
git add CLAUDE.md test/ preview/ _beta-test-build/
git commit -m "비공개 테스트/마케팅 안내 페이지 추가"
git push        # → averic.co.kr/test/ · averic.co.kr/preview/ 자동 반영
```

> **현재 상태(미배포):** `CLAUDE.md`, `test/`, `preview/`, `_beta-test-build/` 가 모두 **untracked(커밋 대기)** 다. 아직 averic.co.kr에 올라가 있지 않으며, 위 커밋·push를 해야 게시된다. (`_beta-test-build/`는 `_` 접두라 push해도 웹에는 노출되지 않고 저장소에만 보존됨.)

## 규칙

- 응답·주석·커밋 메시지는 **한글**.
- `test/`·`preview/`는 산출물 — 항상 `_beta-test-build/`의 스크립트를 고쳐 재빌드.
- 배포는 사용자가 요청할 때만 `git push`.
