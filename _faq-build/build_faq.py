#!/usr/bin/env python3
"""copy.json + faq-strings.json → ../{lang}/faq.html

    python3 build_faq.py

**copy.json에 있는 언어만 생성한다.** 언어를 추가하려면 copy.json에 키를 넣기만
하면 되고 이 스크립트는 고칠 필요가 없다. 현재는 한국어만 서비스한다.

언어 스위처는 copy.json에 실제로 존재하는 언어만 나열한다 — 없는 언어를 링크하면
404가 되기 때문이다. 언어가 하나뿐이면 스위처 자체를 렌더하지 않는다.

언어 목록(표시명·BCP47·RTL 여부)은 i18n/build.py의 META를 임포트해 쓴다.
복제하면 두 벌이 되어 어긋난다 — PRD-FAQ.md §6.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# 언어 메타는 랜딩 빌더와 공유한다 (import 부작용 없음 — main()은 __main__ 가드 안)
sys.path.insert(0, os.path.join(ROOT, "i18n"))
from build import META, ORDER  # noqa: E402

# copy.json의 언어 키(ko) → faq-strings.json의 키(ko_kr)
LANG_TO_STRINGS = {
    "en": "en_us", "ko": "ko_kr", "ja": "ja_jp", "zh-CN": "zh_cn", "zh-TW": "zh_tw",
    "de": "de_de", "fr": "fr_fr", "es": "es_es", "it": "it_it", "pt-BR": "pt_br",
    "ru": "ru_ru", "nl": "nl_nl", "pl": "pl_pl", "tr": "tr_tr", "vi": "vi_vn",
    "th": "th_th", "id": "id_id", "sv": "sv_se", "hi": "hi_in", "ar": "ar_sa",
}


def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)


def esc(s):
    """속성값용 이스케이프. 본문은 카피에 의도적 인라인 태그가 있어 그대로 쓴다."""
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def switcher(active, available):
    """copy.json에 있는 언어만. 하나뿐이면 렌더하지 않는다."""
    if len(available) < 2:
        return ""
    rows = []
    for code in ORDER:
        if code not in available:
            continue
        native = META[code][4]
        cls = "lang-option active" if code == active else "lang-option"
        rows.append(f'<a href="/{code}/faq.html" class="{cls}">{esc(native)}</a>')
    return '<nav class="lang-switch">' + "".join(rows) + "</nav>"


def head_links(active, available):
    lines = [f'<link rel="canonical" href="https://averic.co.kr/{active}/faq.html">']
    for code in available:
        bcp = META[code][0]
        lines.append(f'<link rel="alternate" hreflang="{bcp}" '
                     f'href="https://averic.co.kr/{code}/faq.html">')
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
        "HTML_LANG": bcp,
        "DIR_ATTR": ' dir="rtl"' if direction == "rtl" else "",
        "PATH": f"/{code}/",
        "META_TITLE": esc(copy["meta_title"]),
        "META_DESC": esc(copy["meta_desc"]),
        "HEAD_LINKS": head_links(code, available),
        "SWITCHER": switcher(code, available),
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
    copy_all = load("copy.json")
    strings = load("faq-strings.json")

    global COPY_LANGS
    COPY_LANGS = [k for k in copy_all if not k.startswith("_")]
    if not COPY_LANGS:
        sys.exit("오류: copy.json에 언어가 없습니다.")

    for code in COPY_LANGS:
        if code not in META:
            sys.exit(f"오류: 알 수 없는 언어 코드 '{code}' — i18n/build.py의 META에 없습니다.")
        skey = LANG_TO_STRINGS.get(code)
        if not skey or skey not in strings:
            sys.exit(f"오류: '{code}'의 앱 문구가 faq-strings.json에 없습니다. "
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
        print("→ copy.json에 카피를 추가하면 자동으로 생성됩니다.")


if __name__ == "__main__":
    main()
