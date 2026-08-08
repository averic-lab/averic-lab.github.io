#!/usr/bin/env python3
"""Build localized landing pages from a fixed template + per-language translations.

- 20개 언어 **전부** template.html + translations.json 에서 생성한다.
- 예전에는 ko/en 만 손으로 쓴 페이지였고 언어 메뉴·hreflang 만 제자리 패치했다.
  본문을 고칠 때 세 곳(ko, en, 템플릿)을 따로 고쳐야 해서 조용히 어긋났기 때문에
  ko/en 카피를 translations.json 으로 옮기고 단일 출처로 통합했다.
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

# 사이트 언어 코드(ko) → 앱 번역 파일 코드(ko_kr).
# _faq-build/common.py 가 이 모듈을 임포트하므로 여기가 단일 출처다
# (반대로 build.py 가 common.py 를 임포트하면 순환이 된다).
LANG_TO_STRINGS = {
    "en": "en_us", "ko": "ko_kr", "ja": "ja_jp", "zh-CN": "zh_cn", "zh-TW": "zh_tw",
    "de": "de_de", "fr": "fr_fr", "es": "es_es", "it": "it_it", "pt-BR": "pt_br",
    "ru": "ru_ru", "nl": "nl_nl", "pl": "pl_pl", "tr": "tr_tr", "vi": "vi_vn",
    "th": "th_th", "id": "id_id", "sv": "sv_se", "hi": "hi_in", "ar": "ar_sa",
}

# 히어로 폰 목업이 쓰는 앱 화면 문구. FAQ·사용설명과 같은 파이프라인으로
# 앱 번역 파일에서 추출해 쓴다 — 20개 언어가 공짜이고 앱 문구가 바뀌어도 낡지 않는다
# (근거는 _faq-build/PRD-FAQ.md §1).
APP_STRINGS = os.path.join(ROOT, "_faq-build", "app-strings.json")

# 20개 언어 전부 템플릿에서 생성한다 (예외 없음 — 단일 출처)
GENERATED = list(ORDER)


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


def app_tokens(code, app_all):
    """폰 목업에 넣을 앱 문구를 APP_* 토큰으로 만든다. 자리표시자는 여기서 채운다."""
    a = app_all[LANG_TO_STRINGS[code]]
    checking = a["guardian_checking_subjects"].replace("@count", "2")
    last = a["guardian_last_check_hours"].replace("@hours", "2")
    # 연결관리 카운터 — @max 는 앱의 기본 상한(users.max_subjects)과 같은 5
    count = a["connection_managed_count_value"].replace("@max", "5")
    return {
        "APP_NAME": a["app_name"],
        "APP_CHECKING": checking.replace("\n", "<br>"),
        "APP_TODAY_SUMMARY": a["guardian_today_summary"],
        "APP_ST_NORMAL": a["guardian_status_normal"],
        "APP_ST_CAUTION": a["guardian_status_caution"],
        "APP_ST_CONFIRMED": a["guardian_status_confirmed"],
        "APP_SUBJECT_LIST": a["guardian_subject_list"],
        "APP_ACTIVITY": f'{a["guardian_activity_prefix"]}: {a["guardian_activity_active"]}',
        "APP_LAST_CHECK": last,
        "APP_STEPS": a["guardian_chart_y_axis_steps"],
        "APP_LAST_7": a["guardian_chart_x_axis_last_7_days"],
        "APP_ADD_SUBJECT": a["add_subject_button"],
        "APP_SAFETY_NEEDED": a["guardian_safety_needed"],
        "APP_CALL_NOW": a["guardian_call_now"],
        "APP_CONFIRM_SAFETY": a["guardian_confirm_safety"],
        "APP_PUSH_TITLE": a["notifications_level_caution"],
        "APP_PUSH_BODY": a["noti_caution_missing_body"],
        "APP_NAV_HOME": a["nav_home"],
        "APP_NAV_CONNECTION": a["nav_connection"],
        "APP_NAV_NOTIFICATION": a["nav_notification"],
        "APP_NAV_SETTINGS": a["nav_settings"],
        # "단계별 신호" 섹션의 알림 페이지 목업
        "APP_NOTI_TITLE": a["notifications_title"],
        "APP_LV_NORMAL": a["notifications_level_health"],
        "APP_LV_CAUTION": a["guardian_status_caution"],
        "APP_LV_WARNING": a["notifications_level_warning"],
        "APP_LV_URGENT": a["notifications_level_urgent"],
        "APP_LV_INFO": a["notifications_level_info"],
        "APP_NOTI_NORMAL": a["noti_auto_report_body"],
        "APP_NOTI_CAUTION": a["noti_caution_missing_body"],
        "APP_NOTI_WARNING": a["noti_warning_body"],
        "APP_NOTI_URGENT": a["noti_urgent_body"].replace("@days", "3"),
        "APP_NOTI_STEPS": a["noti_steps_body"].replace("@steps", "3,482"),
        # "도움이 필요해요" 섹션 — 긴급 요청 흐름
        "APP_SOS_BTN": a["subject_home_emergency_button"],
        "APP_SOS_DESC": a["subject_home_emergency_desc"],
        "APP_SOS_TITLE": a["subject_home_emergency_confirm_title"],
        "APP_SOS_BODY": a["subject_home_emergency_confirm_body"].replace("\n", "<br>"),
        "APP_SOS_HINT": a["emergency_message_hint"],
        "APP_SOS_SEND": a["subject_home_emergency_confirm_send"],
        "APP_SOS_CANCEL": a["common_cancel"],
        "APP_SOS_NOTI": a["noti_emergency_body"],
        "APP_SOS_VIEWMAP": a["notifications_view_location"],
        "APP_MAP_TITLE": a["emergency_map_title"],
        "APP_MAP_SUBJECT": a["emergency_map_subject_label"],
        "APP_MAP_ACCURACY": a["emergency_map_accuracy_label"],
        "APP_MAP_EXTERNAL": a["emergency_map_open_external"],
        "APP_SHARE_TITLE": a["subject_home_share_title"],
        "APP_REPORT_BTN": a["subject_home_report_button"],
        # ① 대상자 앱 홈 — 사용설명(guide)의 안전 홈 UI 전체를 옮겨왔다.
        # 사용설명은 상태 카드 제목에 오늘 날짜를 JS 로 붙이지만 여기서는 붙이지
        # 않는다 — 홈은 빌드 시각에 문자열이 박혀서 날짜를 넣으면 저절로 낡는다.
        "APP_CHECK_TITLE": a["subject_home_check_title_last"],
        "APP_CHECK_BODY": a["subject_home_check_body_reported"].replace("@time", "18:00"),
        "APP_SCHED_LBL": a["heartbeat_schedule_change"],
        "APP_SCHED_DSC": a["heartbeat_daily_time"].replace("@time", "18:00"),
        "APP_REPORT_DESC": a["subject_home_report_desc"],
        # "최대 5명" 섹션 — 연결관리 → 대상자 추가 → 대시보드 반영
        # 카운터는 등록 전/후 두 값이 다 필요해서 토큰을 둘로 나눠 둔다.
        "APP_CONN_TITLE": a["connection_title"],
        "APP_CONN_HEAD": a["connection_connected_subjects"],
        "APP_CONN_CNT3": count.replace("@current", "3"),
        "APP_CONN_CNT4": count.replace("@current", "4"),
        "APP_CONN_SCHED": a["connection_heartbeat_schedule"].replace("@time", "18:00"),
        "APP_ADD_TITLE": a["add_subject_title"],
        "APP_ADD_GUIDE": a["add_subject_guide_title"],
        "APP_ADD_CODE_LBL": a["add_subject_code_label"],
        "APP_ADD_ALIAS_LBL": a["add_subject_alias_label"],
        "APP_ADD_PHONE_LBL": a["add_subject_phone_label"],
        # 입력 필드에 채워 넣는 예시 연락처. 앱의 힌트 값이 곧 그 언어의 예시 번호라
        # 그대로 쓴다(별칭·코드는 대시보드 카드와 맞춘 A~D / K7M-4PXR).
        "APP_ADD_PHONE_VAL": a["add_subject_phone_hint"],
        "APP_ADD_CONNECT": a["add_subject_connect"],
        # 헤드라인은 등록 전 3명 / 등록 후 4명 두 벌이 필요하다
        "APP_CHECKING3": a["guardian_checking_subjects"].replace("@count", "3").replace("\n", "<br>"),
        "APP_CHECKING4": a["guardian_checking_subjects"].replace("@count", "4").replace("\n", "<br>"),
    }


def build_page(code, strings, template, app_all):
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
    repl.update(app_tokens(code, app_all))
    repl.update(strings)
    for key, val in repl.items():
        page = page.replace("{{" + key + "}}", val)
    return page


def patch_inplace(code):
    """(미사용) 예전에 손으로 쓴 ko/en 페이지의 언어 메뉴·hreflang 만 갱신하던 함수.

    지금은 20개 언어를 모두 템플릿에서 생성하므로 호출되지 않는다.
    _faq-build 가 이 모듈의 META/ORDER 를 임포트하므로 삭제하지 않고 남겨 둔다."""
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
    if not os.path.exists(APP_STRINGS):
        sys.exit("오류: _faq-build/app-strings.json 이 없습니다. "
                 "먼저 _faq-build/extract_strings.py 를 실행하세요.")
    with open(APP_STRINGS, encoding="utf-8") as f:
        app_all = json.load(f)

    problems = []
    for code in GENERATED:
        t = translations.get(code)
        if not t:
            problems.append(f"{code}: missing translations")
            continue
        merged = dict(en)
        merged.update({k: v for k, v in t.items() if v})  # en fallback for blanks
        page = build_page(code, merged, template, app_all)
        leftovers = re.findall(r"\{\{[A-Za-z0-9_]+\}\}", page)
        if leftovers:
            problems.append(f"{code}: unresolved tokens {set(leftovers)}")
            continue
        os.makedirs(os.path.join(ROOT, code), exist_ok=True)
        with open(os.path.join(ROOT, code, "index.html"), "w", encoding="utf-8") as f:
            f.write(page)
        print(f"  generated /{code}/index.html  ({len(page)} bytes)")

    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("\nOK — all pages built.")


if __name__ == "__main__":
    main()
