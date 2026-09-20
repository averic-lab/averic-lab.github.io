#!/usr/bin/env python3
"""FAQ·사용설명 두 페이지 빌더가 공유하는 것들.

이 폴더는 이름과 달리 **두 페이지**를 만든다 — `build_faq.py`(문제 해결)와
`build_guide.py`(사용설명). 둘은 앱 문구 추출(`app-strings.json`)·언어 목록·
앱 화면 복제 CSS(`mockup.css`)를 공유하므로 폴더를 나누지 않았다. 나누면
그 셋이 두 벌이 되어 어긋난다 — 그게 FAQ가 스크린샷을 버린 이유와 같다.

CSS는 세 조각으로 나뉘어 있고 두 템플릿이 같은 파일을 인라인한다:
  base.css    팔레트·리셋·헤더            (사이트 공통)
  mockup.css  앱 화면 복제 — 값은 앱 소스와 동일. 임의로 바꾸지 말 것
  footer.css  푸터
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# 언어 메타는 랜딩 빌더와 공유한다 (import 부작용 없음 — main()은 __main__ 가드 안)
sys.path.insert(0, os.path.join(ROOT, "i18n"))
from build import META, ORDER, LANG_TO_STRINGS, FLAG  # noqa: E402,F401

# LANG_TO_STRINGS(사이트 코드 → 앱 번역 파일 코드)는 build.py 가 단일 출처다.


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def load_copy(dirname):
    """{dirname}/{lang}.json 전부 읽는다. 파일이 있는 언어만 생성 대상이 된다."""
    d = os.path.join(HERE, dirname)
    out = {}
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(d, fn), encoding="utf-8") as f:
            out[fn[:-5]] = json.load(f)
    return out


def css(name):
    """공용 CSS 조각을 그대로 읽어 온다 (끝 개행 제거 — 템플릿이 이미 갖고 있다)."""
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read().rstrip("\n")


def esc(s):
    """속성값용 이스케이프. 본문은 카피에 의도적 인라인 태그가 있어 그대로 쓴다."""
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def switcher(active, available, page):
    """copy에 있는 언어만. 하나뿐이면 렌더하지 않는다.

    홈(i18n/template.html)과 같은 드롭다운이다 — 20개 언어를 헤더에 가로로 펼치면
    좁은 화면에서 3줄까지 접혀 헤더가 본문을 덮었다(base.css 의 min-height 주석 참조).
    국기·대문자·마크업 모두 홈과 같은 클래스를 써서 두 UI 가 한 벌로 보이게 한다.
    열고 닫는 JS 는 두 템플릿의 인라인 <script> 에 있다(이 페이지들은 site.js 를 안 쓴다).
    """
    if len(available) < 2:
        return ""
    rows = []
    for code in ORDER:
        if code not in available:
            continue
        native = META[code][4]
        cls = "lang-option active" if code == active else "lang-option"
        rows.append(
            # data-lang 은 장식이 아니다 — 인라인 JS 가 이 값을 읽어
            # 루트 라우터용 localStorage('anbu.lang') 에 기록한다.
            f'<a href="/{code}/{page}" class="{cls}" role="menuitem" data-lang="{code}">'
            f'<span class="lang-flag" aria-hidden="true">{FLAG[code]}</span>'
            f'<span class="lang-name">{esc(native)}</span></a>'
        )
    # 토글 라벨은 원어명이 아니라 짧은 코드(KO/JA)다 — 헤더 폭을 좁게 유지한다.
    label = esc(META[active][3])
    return (
        '<span class="lang-wrap">'
        '<button class="lang-toggle" id="langToggle" type="button"'
        ' aria-haspopup="true" aria-expanded="false">'
        '<svg class="globe" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
        ' stroke-width="1.8" aria-hidden="true">'
        '<circle cx="12" cy="12" r="9"/>'
        '<path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
        f'<span class="lang-current">{label}</span>'
        '<svg class="caret" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">'
        '<path d="M2 4l4 4 4-4z"/></svg>'
        '</button>'
        '<div class="lang-menu" id="langMenu" role="menu" aria-hidden="true">'
        + "".join(rows) +
        '</div></span>'
    )


def head_links(active, available, page):
    lines = [f'<link rel="canonical" href="https://averic.co.kr/{active}/{page}">']
    for code in available:
        bcp = META[code][0]
        lines.append(f'<link rel="alternate" hreflang="{bcp}" '
                     f'href="https://averic.co.kr/{code}/{page}">')
    # x-default — 어느 언어에도 안 맞는 방문자가 갈 곳. 없으면 Google 이 임의로 고른다.
    # 홈(i18n/build.py)이 en 을 x-default 로 쓰므로 여기서도 en 으로 맞춘다.
    fallback = "en" if "en" in available else next(
        (c for c in ORDER if c in available), active)
    lines.append('<link rel="alternate" hreflang="x-default" '
                 f'href="https://averic.co.kr/{fallback}/{page}">')
    return "\n  ".join(lines)


def interpolate(text, app):
    """카피 안의 @키를 앱 실제 문구로 치환한다.

    앱이 실제로 보여주는 알림·버튼 문구를 카피에서 인용할 때 쓴다. 번역가가
    인용문까지 옮기면 앱 화면과 어긋나므로, 인용은 추출된 문구를 그대로 쓴다.
    긴 키부터 치환해야 `@noti_caution_missing_body`가 `@noti_caution`으로
    잘못 잡히지 않는다.
    """
    for key in sorted(app, key=len, reverse=True):
        text = text.replace("@" + key, app[key])
    return text
