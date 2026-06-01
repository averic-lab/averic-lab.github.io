#!/usr/bin/env python3
"""Build localized landing pages from a fixed template + per-language translations.

- 18 translation locales are generated from template.html + translations.json.
- ko/en already have final bespoke pages; only their language menu + hreflang
  block are patched in place so every page shares the same 20-language switcher.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(ROOT, "i18n")

# code -> (html_lang/bcp47, dir, og_locale, menu label, native name)
META = {
    "en":    ("en",      "ltr", "en_US", "EN", "English"),
    "ko":    ("ko",      "ltr", "ko_KR", "KO", "한국어"),
    "ja":    ("ja",      "ltr", "ja_JP", "JA", "日本語"),
    "zh-CN": ("zh-Hans", "ltr", "zh_CN", "简", "简体中文"),
    "zh-TW": ("zh-Hant", "ltr", "zh_TW", "繁", "繁體中文"),
    "de":    ("de",      "ltr", "de_DE", "DE", "Deutsch"),
    "fr":    ("fr",      "ltr", "fr_FR", "FR", "Français"),
    "es":    ("es",      "ltr", "es_ES", "ES", "Español"),
    "it":    ("it",      "ltr", "it_IT", "IT", "Italiano"),
    "pt-BR": ("pt-BR",   "ltr", "pt_BR", "PT", "Português"),
    "ru":    ("ru",      "ltr", "ru_RU", "RU", "Русский"),
    "nl":    ("nl",      "ltr", "nl_NL", "NL", "Nederlands"),
    "pl":    ("pl",      "ltr", "pl_PL", "PL", "Polski"),
    "tr":    ("tr",      "ltr", "tr_TR", "TR", "Türkçe"),
    "vi":    ("vi",      "ltr", "vi_VN", "VI", "Tiếng Việt"),
    "th":    ("th",      "ltr", "th_TH", "TH", "ไทย"),
    "id":    ("id",      "ltr", "id_ID", "ID", "Bahasa Indonesia"),
    "sv":    ("sv",      "ltr", "sv_SE", "SV", "Svenska"),
    "hi":    ("hi",      "ltr", "hi_IN", "HI", "हिन्दी"),
    "ar":    ("ar",      "rtl", "ar_AR", "AR", "العربية"),
}

# display order in the switcher menu
ORDER = ["en", "ko", "ja", "zh-CN", "zh-TW", "de", "fr", "es", "it", "pt-BR",
         "ru", "nl", "pl", "tr", "vi", "th", "id", "sv", "hi", "ar"]

# locales generated from the template (ko/en are patched in place instead)
GENERATED = [c for c in ORDER if c not in ("en", "ko")]


def switcher(active):
    rows = []
    for code in ORDER:
        bcp, _dir, _og, label, native = META[code]
        cls = "lang-option active" if code == active else "lang-option"
        rows.append(
            f'    <a href="/{code}/" class="{cls}" role="menuitem" data-lang="{code}">\n'
            f'      <span class="lang-name">{native}</span><span class="lang-code">{label}</span>\n'
            f'    </a>'
        )
    return "\n".join(rows)


def head_links(active):
    lines = [f'<link rel="canonical" href="https://averic.co.kr/{active}/">']
    for code in ORDER:
        bcp = META[code][0]
        lines.append(f'<link rel="alternate" hreflang="{bcp}" href="https://averic.co.kr/{code}/">')
    lines.append('<link rel="alternate" hreflang="x-default" href="https://averic.co.kr/en/">')
    return "\n".join(lines)


def build_page(code, strings, template):
    bcp, direction, og_locale, label, native = META[code]
    page = template
    repl = {
        "HTML_LANG": bcp,
        "DIR_ATTR": ' dir="rtl"' if direction == "rtl" else "",
        "PATH": f"/{code}/",
        "OG_LOCALE": og_locale,
        "LANG_CURRENT": label,
        "SWITCHER": switcher(code),
        "HEAD_LINKS": head_links(code),
    }
    repl.update(strings)
    for key, val in repl.items():
        page = page.replace("{{" + key + "}}", val)
    return page


def patch_inplace(code):
    """Update lang-menu + canonical/hreflang block of an existing ko/en page."""
    path = os.path.join(ROOT, code, "index.html")
    with open(path, encoding="utf-8") as f:
        html = f.read()

    new_menu = (
        '  <div class="lang-menu" id="langMenu" role="menu" aria-hidden="true">\n'
        + switcher(code)
        + "\n  </div>\n</header>"
    )
    html, n_menu = re.subn(
        r'  <div class="lang-menu".*?\n  </div>\n</header>',
        lambda m: new_menu, html, count=1, flags=re.S,
    )

    html, n_head = re.subn(
        r'<link rel="canonical".*?hreflang="x-default"[^>]*>',
        lambda m: head_links(code), html, count=1, flags=re.S,
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return n_menu, n_head


def main():
    with open(os.path.join(I18N, "template.html"), encoding="utf-8") as f:
        template = f.read()
    with open(os.path.join(I18N, "strings.en.json"), encoding="utf-8") as f:
        en = json.load(f)
    with open(os.path.join(I18N, "translations.json"), encoding="utf-8") as f:
        translations = json.load(f)

    problems = []
    for code in GENERATED:
        t = translations.get(code)
        if not t:
            problems.append(f"{code}: missing translations")
            continue
        merged = dict(en)
        merged.update({k: v for k, v in t.items() if v})  # en fallback for blanks
        page = build_page(code, merged, template)
        leftovers = re.findall(r"\{\{[A-Za-z0-9_]+\}\}", page)
        if leftovers:
            problems.append(f"{code}: unresolved tokens {set(leftovers)}")
            continue
        os.makedirs(os.path.join(ROOT, code), exist_ok=True)
        with open(os.path.join(ROOT, code, "index.html"), "w", encoding="utf-8") as f:
            f.write(page)
        print(f"  generated /{code}/index.html  ({len(page)} bytes)")

    for code in ("ko", "en"):
        n_menu, n_head = patch_inplace(code)
        print(f"  patched   /{code}/index.html  (menu={n_menu}, head={n_head})")

    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("\nOK — all pages built.")


if __name__ == "__main__":
    main()
