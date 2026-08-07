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
from build import META, ORDER, LANG_TO_STRINGS  # noqa: E402,F401

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
    """copy에 있는 언어만. 하나뿐이면 렌더하지 않는다."""
    if len(available) < 2:
        return ""
    rows = []
    for code in ORDER:
        if code not in available:
            continue
        native = META[code][4]
        cls = "lang-option active" if code == active else "lang-option"
        rows.append(f'<a href="/{code}/{page}" class="{cls}">{esc(native)}</a>')
    return '<nav class="lang-switch">' + "".join(rows) + "</nav>"


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
