#!/usr/bin/env python3
"""guide-copy/{lang}.json + app-strings.json → ../{lang}/guide.html

    python3 build_guide.py

안전 코드를 만들어 가족에게 알려주고, 가족이 그 코드로 연결하기까지를 앱 화면
그대로 보여주는 사용설명 페이지. FAQ와 같은 원칙이다 — 스크린샷을 쓰지 않고 앱
UI를 HTML/CSS로 재현하며, 화면 안 문구는 앱 번역 파일에서 추출한다(PRD-FAQ.md §1).

**guide-copy/에 파일이 있는 언어만 생성한다.** 언어를 추가하려면 guide-copy/ko.json을
복사해 번역하고 파일명을 언어 코드로 바꾸면 되고, 이 스크립트는 고칠 필요가 없다.

단계 수는 카피의 steps 배열이 아니라 **guide-template.html의 STEPS(JS)**가 정한다.
둘의 길이가 어긋나면 번호와 화면이 따로 놀므로 build()에서 확인해 exit 1 한다.
"""
import json
import os
import re
import sys

from common import (META, ORDER, ROOT, LANG_TO_STRINGS, css, esc, head_links,
                    interpolate, load, load_copy, switcher)

HERE = os.path.dirname(os.path.abspath(__file__))

# 템플릿 JS의 STEPS 길이 — 카피가 이 수만큼 단계를 갖고 있어야 한다
STEP_COUNT = 9

# 하단 네비게이션 4탭. 설정 화면은 4번째, 연결 화면은 2번째가 선택 상태다
# (guardian_bottom_nav.dart의 currentIndex 3 / 1).
NAV = [
    ("nav_home", 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'),
    ("nav_connection",
     'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1z'
     'M8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4a5 5 0 0 0 0-10z'),
    ("nav_notification",
     'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5'
     's-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z'),
    ("nav_settings",
     'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32'
     'a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84'
     'c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87'
     'a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61'
     'l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84'
     'c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32'
     'a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z'),
]


def fill(text, app, where):
    """카피의 @키를 앱 문구로 치환하고, 남은 @키가 있으면 실패시킨다.

    검사는 **카피 문자열에만** 건다 — 완성된 페이지 전체를 훑으면 CSS의 @media나
    앱 문구 안의 자리표시자(@time)까지 잡혀 거짓 실패가 난다.
    """
    out = interpolate(text, app)
    stray = set(re.findall(r"@[a-z][a-z0-9_]{3,}", out))
    if stray:
        sys.exit(f"오류: {where} — app-strings.json에 없는 @키 {stray}. "
                 f"extract_strings.py의 KEYS에 넣거나 인용을 고치세요.")
    return out


def render_bnav(app, active):
    out = []
    for i, (key, path) in enumerate(NAV):
        cls = "tab on" if i == active else "tab"
        out.append(f'<span class="{cls}">'
                   f'<svg viewBox="0 0 24 24"><path d="{path}"/></svg>'
                   f'<span>{esc(app[key])}</span></span>')
    return "".join(out)


def render_cards(app):
    """보호 대상자 리스트 제목 + 카드 + 메뉴바.

    연락처를 왜 넣는지는 말로만 하면 와닿지 않아서, 그 설명 안에 대상자 카드를
    실물 그대로 끼워 넣는다. 카드 마크업은 이 파일 하나에서만 만들어 쓴다.
    """
    with open(os.path.join(HERE, "_cards_block.html"), encoding="utf-8") as f:
        block = f.read()
    return ('<div class="inline-card">'
            + block.replace("{{BNAV_HOME}}", render_bnav(app, 0))
            + '</div>')


def render_steps(copy, app, code):
    """단계 목록. 애니메이션을 보지 않아도 순서대로 읽히는 본문이기도 하다."""
    out = []
    for i, st in enumerate(copy["steps"]):
        w = f"{code} 단계 {i + 1}"
        out.append(
            f'<li><button class="step" type="button">'
            f'<span class="n">{i + 1}</span>'
            f'<span><span class="h">{fill(st["h"], app, w)}</span>'
            f'<span class="d">{fill(st["d"], app, w)}</span></span>'
            f'</button>'
            # 카드는 button 밖에 둔다 — <button> 안의 <p>/<div>는 유효하지 않은 HTML이라
            # 브라우저마다 렌더가 달라진다. 들여쓰기는 .extra가 맞춘다.
            f'{extra(st, app, w)}'
            f'</li>')
    return "\n".join(out)


def extra(st, app, w):
    """단계 설명 아래에 붙는 그림 + 이어지는 설명."""
    if st.get("illus") != "cards" and not st.get("d_after"):
        return ""
    after = (f'<p class="d">{fill(st["d_after"], app, w)}</p>'
             if st.get("d_after") else "")
    cards = render_cards(app) if st.get("illus") == "cards" else ""
    return f'<div class="extra">{cards}{after}</div>'


def build(code, copy, app):
    bcp, direction, _og, _label, _native = META[code]
    if len(copy["steps"]) != STEP_COUNT:
        sys.exit(f"오류: {code} — 단계가 {len(copy['steps'])}개입니다. "
                 f"guide-template.html의 STEPS는 {STEP_COUNT}개라 번호와 화면이 어긋납니다.")

    with open(os.path.join(HERE, "guide-template.html"), encoding="utf-8") as f:
        page = f.read()

    available = [c for c in ORDER if c in COPY_LANGS]
    repl = {
        "CSS_BASE": css("base.css"),
        "CSS_MOCKUP": css("mockup.css"),
        "CSS_GUIDE_MOCKUP": css("guide-mockup.css"),
        "CSS_FOOTER": css("footer.css"),
        "BRAND": esc(app["app_name"]),   # 한국어만 "안부", 나머지 "Anbu"
        "HTML_LANG": bcp,
        "DIR_ATTR": ' dir="rtl"' if direction == "rtl" else "",
        "PATH": f"/{code}/",
        "META_TITLE": esc(copy["meta_title"]),
        "META_DESC": esc(copy["meta_desc"]),
        "HEAD_LINKS": head_links(code, available, "guide.html"),
        "SWITCHER": switcher(code, available, "guide.html"),
        "EYEBROW": copy["page_eyebrow"],
        "TITLE": copy["page_title"],
        "LEAD": fill(copy["page_lead"], app, code + " lead"),
        "BNAV_SETTINGS": render_bnav(app, 3),
        "BNAV_CONNECT": render_bnav(app, 1),
        "STEPS": render_steps(copy, app, code),
        "NOTE": f'<p class="note">{fill(copy["note"], app, code + " note")}</p>',
        "CTRL_PREV": esc(copy["ctrl_prev"]),
        "CTRL_NEXT": esc(copy["ctrl_next"]),
        "CTRL_REPLAY": esc(copy["ctrl_replay"]),
        "MOCKUP_CAPTION": copy["mockup_caption"],
        "APP_STRINGS": json.dumps(app, ensure_ascii=False),
        "WHO": json.dumps([copy["phone_me"], copy["phone_family"]], ensure_ascii=False),
        "DEMO": json.dumps(copy["demo"], ensure_ascii=False),
        "FOOTER_HOME": copy["footer_home"],
        "FOOTER_FAQ": copy["footer_faq"],
        "FOOTER_PRIVACY": copy["footer_privacy"],
        "FOOTER_TERMS": copy["footer_terms"],
        "FOOTER_COPYRIGHT": copy["footer_copyright"],
    }
    for k, v in repl.items():
        page = page.replace("{{" + k + "}}", v)

    leftover = re.findall(r"\{\{[A-Z_]+\}\}", page)
    if leftover:
        sys.exit(f"오류: {code} — 치환되지 않은 토큰 {set(leftover)}")
    return page


def main():
    copy_all = load_copy("guide-copy")
    strings = load("app-strings.json")

    global COPY_LANGS
    COPY_LANGS = list(copy_all)
    if not COPY_LANGS:
        sys.exit("오류: guide-copy/ 폴더에 언어 파일이 없습니다.")

    for code in COPY_LANGS:
        if code not in META:
            sys.exit(f"오류: 알 수 없는 언어 코드 '{code}' — i18n/build.py의 META에 없습니다.")
        skey = LANG_TO_STRINGS.get(code)
        if not skey or skey not in strings:
            sys.exit(f"오류: '{code}'의 앱 문구가 app-strings.json에 없습니다. "
                     f"extract_strings.py를 먼저 실행하세요.")

        page = build(code, copy_all[code], strings[skey])
        outdir = os.path.join(ROOT, code)
        os.makedirs(outdir, exist_ok=True)
        with open(os.path.join(outdir, "guide.html"), "w", encoding="utf-8") as f:
            f.write(page)
        print(f"  생성  /{code}/guide.html  ({len(page) / 1024:.1f} KB)")

    missing = [c for c in ORDER if c not in COPY_LANGS]
    print(f"\n완료 — {len(COPY_LANGS)}개 언어")
    if missing:
        print(f"미생성 {len(missing)}개: {', '.join(missing)}")
        print("→ guide-copy/{lang}.json을 추가하면 자동으로 생성됩니다.")


if __name__ == "__main__":
    main()
