#!/usr/bin/env python3
"""copy/{lang}.json + faq-strings.json → ../{lang}/faq.html

    python3 build_faq.py

**copy/ 폴더에 파일이 있는 언어만 생성한다.** 언어를 추가하려면 copy/ko.json을
복사해 번역하고 파일명을 언어 코드로 바꾸면 되고, 이 스크립트는 고칠 필요가 없다.

언어 스위처는 copy/에 실제로 존재하는 언어만 나열한다 — 없는 언어를 링크하면
404가 되기 때문이다. 언어가 하나뿐이면 스위처 자체를 렌더하지 않는다.

언어 목록(표시명·BCP47·RTL 여부)은 i18n/build.py의 META를 임포트해 쓴다.
복제하면 두 벌이 되어 어긋난다 — PRD-FAQ.md §6.

언어 메타·앱 문구 로딩·@키 치환·공용 CSS는 common.py가 갖고 있다. 같은 폴더의
build_guide.py(사용설명 페이지)와 공유한다.
"""
import json
import os
import sys

from common import (META, ORDER, ROOT, LANG_TO_STRINGS, css, esc, head_links,
                    interpolate, load, load_copy, switcher)

HERE = os.path.dirname(os.path.abspath(__file__))


def render_dialog(sec, copy, app):
    """경고를 탭했을 때 실제로 뜨는 다이얼로그를 앱 모양 그대로 렌더한다.

    문구만 나열하지 않고 앱과 같은 카드(흰 배경·radius 16·제목 18/w700·본문 14·
    우측 정렬 텍스트 버튼)로 그려, 사용자가 폰에서 본 것과 대조할 수 있게 한다.
    본문의 \\n\\n은 문단으로 나눈다 — 앱 AlertDialog도 그렇게 보인다.
    """
    dlg = sec.get("dialog")
    if not dlg:
        return ""

    def paras(raw):
        return "".join(f"<p>{p.strip()}</p>"
                       for p in interpolate(raw, app).split("\n\n") if p.strip())

    # 위치 다이얼로그만 본문이 플랫폼별로 다르다 — 두 창을 나열하면 거의 같은
    # 것이 반복되므로, 전환 버튼으로 한 번에 하나만 보여준다(앱과 동일하게).
    if dlg.get("variants"):
        tabs = "".join(
            f'<button class="pf-tab" type="button" data-pf="{i}" '
            f'aria-pressed="{"true" if i == 0 else "false"}">{esc(v["label"])}</button>'
            for i, v in enumerate(dlg["variants"]))
        body = "".join(
            f'<div class="pf-body" data-pf="{i}"{"" if i == 0 else " hidden"}>'
            f'{paras(v["body"])}</div>'
            for i, v in enumerate(dlg["variants"]))
        tabs = f'<div class="pf-tabs">{tabs}</div>'
    else:
        tabs = ""
        body = paras(dlg["body"])

    buttons = "".join(
        f'<button class="dlg-btn" type="button" tabindex="-1" disabled>'
        f'{interpolate(b, app)}</button>' for b in dlg["buttons"])
    # lead는 다이얼로그 **위**에 온다. 걸음수·위치는 우리 창이 아니라 안드로이드
    # 권한 팝업이 먼저 뜨는 것이 보통이라, 그 사실을 창을 보기 전에 알려야 한다.
    return (
        f'<div class="dlg-demo" hidden>'
        f'<p class="dlg-lead">{interpolate(dlg["lead"], app)}</p>'
        f'{tabs}'
        f'<div class="scrim"><div class="dlg">'
        f'<p class="dlg-title">{interpolate(dlg["title"], app)}</p>'
        f'<div class="dlg-body">{body}</div>'
        f'<div class="dlg-actions">{buttons}</div>'
        f'</div></div>'
        f'</div>')


def render_sections(copy, app):
    out = []
    for sec in copy["sections"]:
        spot = sec.get("spot")
        attr = f' data-spot="{spot}"' if spot else ""
        items = []
        for it in sec["items"]:
            qs = f'<p class="q">{interpolate(it["q"], app)}</p>'
            if it.get("q2"):
                qs += f'<p class="q">{interpolate(it["q2"], app)}</p>'
            body = "".join(f"<p>{interpolate(p, app)}</p>" for p in it["a"])
            items.append(f'<div class="qa">{qs}<div class="a">{body}</div></div>')
        # 돋보기 아이콘 — 텍스트가 아니라 누르는 것임을 드러낸다
        icon = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79'
                'l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 '
                '4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 '
                '9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>')
        # 제목 바로 아래에 둔다 — 어떤 주제인지 알자마자 화면에서 위치를 찾을 수 있도록
        link = (f'<button class="show-me" type="button" data-show="{spot}" '
                f'aria-expanded="false" '
                f'data-open="{esc(copy["mockup_hint"])}" '
                f'data-close="{esc(copy["mockup_hint_close"])}">'
                f'{icon}<span>{copy["mockup_hint"]}</span></button>') if spot else ""
        out.append(
            f'<section class="topic" id="{sec["id"]}"{attr}>'
            f'<h2>{sec["heading"]}</h2>{link}{"".join(items)}'
            f'{render_dialog(sec, copy, app)}</section>')
    return "\n".join(out)


def render_chips(copy, available_spots):
    order = [("all", copy["spot_all"]), ("battery", copy["spot_battery"]),
             ("activity", copy["spot_activity"]), ("location", copy["spot_location"]),
             ("hibernation", copy["spot_hibernation"])]
    return "".join(
        f'<button class="chip" type="button" data-spot="{k}" '
        f'aria-pressed="{"true" if k == "all" else "false"}">{esc(v)}</button>'
        for k, v in order)


def build(code, copy, app):
    bcp, direction, _og, _label, _native = META[code]
    with open(os.path.join(HERE, "template.html"), encoding="utf-8") as f:
        page = f.read()

    available = [c for c in ORDER if c in COPY_LANGS]
    repl = {
        "CSS_BASE": css("base.css"),
        "CSS_MOCKUP": css("mockup.css"),
        "CSS_FOOTER": css("footer.css"),
        "HTML_LANG": bcp,
        "DIR_ATTR": ' dir="rtl"' if direction == "rtl" else "",
        "PATH": f"/{code}/",
        "META_TITLE": esc(copy["meta_title"]),
        "META_DESC": esc(copy["meta_desc"]),
        "HEAD_LINKS": head_links(code, available, "faq.html"),
        "SWITCHER": switcher(code, available, "faq.html"),
        "EYEBROW": copy["page_eyebrow"],
        "TITLE": copy["page_title"],
        "LEAD": copy["page_lead"],
        "CHIPS": render_chips(copy, None),
        "SECTIONS": render_sections(copy, app),
        "MOCKUP_CAPTION": copy["mockup_caption"],
        "APP_STRINGS": json.dumps(app, ensure_ascii=False),
        "FOOTER_HOME": copy["footer_home"],
        "FOOTER_PRIVACY": copy["footer_privacy"],
        "FOOTER_TERMS": copy["footer_terms"],
        "FOOTER_COPYRIGHT": copy["footer_copyright"],
    }
    for k, v in repl.items():
        page = page.replace("{{" + k + "}}", v)

    import re
    leftover = re.findall(r"\{\{[A-Z_]+\}\}", page)
    if leftover:
        sys.exit(f"오류: {code} — 치환되지 않은 토큰 {set(leftover)}")
    return page


def main():
    copy_all = load_copy("copy")
    strings = load("app-strings.json")

    global COPY_LANGS
    COPY_LANGS = list(copy_all)
    if not COPY_LANGS:
        sys.exit("오류: copy/ 폴더에 언어 파일이 없습니다.")

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
        with open(os.path.join(outdir, "faq.html"), "w", encoding="utf-8") as f:
            f.write(page)
        print(f"  생성  /{code}/faq.html  ({len(page) / 1024:.1f} KB)")

    missing = [c for c in ORDER if c not in COPY_LANGS]
    print(f"\n완료 — {len(COPY_LANGS)}개 언어")
    if missing:
        print(f"미생성 {len(missing)}개: {', '.join(missing)}")
        print("→ copy/{lang}.json을 추가하면 자동으로 생성됩니다.")


if __name__ == "__main__":
    main()
