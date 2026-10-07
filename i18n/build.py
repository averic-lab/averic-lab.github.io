#!/usr/bin/env python3
"""Build localized landing pages from a fixed template + per-language translations.

- 20개 언어 **전부** template.html + translations.json 에서 생성한다.
- 예전에는 ko/en 만 손으로 쓴 페이지였고 언어 메뉴·hreflang 만 제자리 패치했다.
  본문을 고칠 때 세 곳(ko, en, 템플릿)을 따로 고쳐야 해서 조용히 어긋났기 때문에
  ko/en 카피를 translations.json 으로 옮기고 단일 출처로 통합했다.
"""
import hashlib
import html
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

# 언어 메뉴의 국기 이모지. META 튜플에 끼우지 않는 이유는 5-튜플 언패킹이
# build.py·build_faq.py·build_guide.py 세 곳에 있어 원소를 늘리면 전부 깨지기 때문이다.
# ⚠️ 국기는 국가지 언어가 아니다 — 여러 나라가 쓰는 언어(en·ar)는 한 나라를 고르면
#    나머지 사용자를 배제하므로 지구본을 쓴다. pt-BR 은 브라질 포르투갈어라 🇧🇷 다(🇵🇹 아님).
# ⚠️ 윈도우(크롬·엣지)는 국기 글리프가 없어 "KR" 같은 두 글자로 보인다. 알려진 OS 제약이고
#    읽을 수는 있어 수용한다. 인라인 SVG 20개로 바꾸는 비용이 훨씬 크다.
FLAG = {
    "en": "🌍", "ko": "🇰🇷", "ja": "🇯🇵", "zh-CN": "🇨🇳", "zh-TW": "🇹🇼",
    "de": "🇩🇪", "fr": "🇫🇷", "es": "🇪🇸", "it": "🇮🇹", "pt-BR": "🇧🇷",
    "ru": "🇷🇺", "nl": "🇳🇱", "pl": "🇵🇱", "tr": "🇹🇷", "vi": "🇻🇳",
    "th": "🇹🇭", "id": "🇮🇩", "sv": "🇸🇪", "hi": "🇮🇳", "ar": "🌍",
}
# 값은 여기 박아 둔 고정 문자라 HTML 이스케이프가 필요 없다(원어명은 esc 를 거친다).

# 사이트 언어 코드 → App Store 국가 코드.
# 국가 없는 링크(apps.apple.com/app/id...)는 애플이 301로 /us/ 에 보내 영문 스토어가 열린다.
# 그래서 언어마다 스토어 국가를 명시한다. 20개 국가 모두 앱이 열리는 것을 확인함(2026-09-18).
APP_STORE_COUNTRY = {
    "en": "us", "ko": "kr", "ja": "jp", "zh-CN": "cn", "zh-TW": "tw", "de": "de",
    "fr": "fr", "es": "es", "it": "it", "pt-BR": "br", "ru": "ru", "nl": "nl",
    "pl": "pl", "tr": "tr", "vi": "vn", "th": "th", "id": "id", "sv": "se",
    "hi": "in", "ar": "sa",
}

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


def switcher(active, page=""):
    rows = []
    for code in ORDER:
        bcp, _dir, _og, label, native = META[code]
        cls = "lang-option active" if code == active else "lang-option"
        rows.append(
            f'    <a href="/{code}/{page}" class="{cls}" role="menuitem" data-lang="{code}">\n'
            f'      <span class="lang-flag" aria-hidden="true">{FLAG[code]}</span>'
            f'<span class="lang-name">{native}</span>\n'
            f'    </a>'
        )
    return "\n".join(rows)


# ── 링크 공유 미리보기(Open Graph) ─────────────────────────────────────
# 카카오톡·스레드·인스타그램 DM·페이스북·X 는 링크를 받으면 그 주소의 HTML 을 **JS 없이**
# 읽어 og:* 태그로 카드를 그린다. 그래서 JS 라우터인 루트 index.html 에도 정적 태그가 필요하다.
# 홈·영상·FAQ·사용설명·루트가 전부 이 함수 하나를 쓴다 — 페이지마다 따로 쓰면 필드가 조용히 어긋난다.
SITE = "https://averic.co.kr"
# ⚠️ 이미지를 바꿀 때는 **파일명을 바꾸거나 ?v= 를 올릴 것.** 카카오·메타는 이미지 주소 단위로
#    오래 캐시해서, 같은 주소에 새 그림을 올리면 옛 그림이 계속 나간다.
OG_IMAGE = SITE + "/og-image-2.png"


def og_tags(url, title, desc, og_locale, site_name, tw_desc=None):
    """og:* + twitter:* 메타 블록. 인자는 이스케이프 전 원문을 받는다.

    og:image:width/height 는 선택 항목처럼 보이지만 빼면 메타(스레드·인스타)가 **처음 공유할 때**
    이미지를 비동기로 받느라 그림 없는 카드를 내보낸다. 카카오도 크기를 보고 큰 카드로 그린다."""
    e = lambda v: html.escape(v, quote=True)
    alt = "안부 · Anbu"  # 이미지 속 글자 그대로 — 20개 언어가 이 한 장을 공유한다
    return "\n".join([
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{e(site_name)}">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{e(url)}">',
        f'<meta property="og:image" content="{OG_IMAGE}">',
        '<meta property="og:image:type" content="image/png">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{alt}">',
        f'<meta property="og:locale" content="{og_locale}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(tw_desc or desc)}">',
        f'<meta name="twitter:image" content="{OG_IMAGE}">',
        f'<meta name="twitter:image:alt" content="{alt}">',
    ])


def head_links(active, page="", codes=None):
    codes = codes or ORDER
    lines = [f'<link rel="canonical" href="https://averic.co.kr/{active}/{page}">']
    for code in codes:
        bcp = META[code][0]
        lines.append(f'<link rel="alternate" hreflang="{bcp}" href="https://averic.co.kr/{code}/{page}">')
    fallback = "en" if "en" in codes else codes[0]
    lines.append(f'<link rel="alternate" hreflang="x-default" href="https://averic.co.kr/{fallback}/{page}">')
    return "\n".join(lines)


def app_tokens(code, app_all):
    """폰 목업에 넣을 앱 문구를 APP_* 토큰으로 만든다. 자리표시자는 여기서 채운다."""
    a = app_all[LANG_TO_STRINGS[code]]
    checking = a["guardian_checking_subjects"].replace("@count", "2")
    # 아랍어는 2가 쌍수형(ساعتين)이라 기본 키(3~10 형태)에 2를 넣으면 문법이 틀린다 — 3을 쓴다
    last = a["guardian_last_check_hours"].replace("@hours", "3" if code == "ar" else "2")
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


# 「해질녘」 ③ 자리를 숏폼 영상으로 바꾼 언어. 영상 끝(공통 엔딩)에 ③ 문장이 그대로 들어 있으므로
# 문장을 지우고 영상을 둔다. 영상이 없는 언어는 지금처럼 ③ 문장을 보여 준다.
# 파일은 media/shorts/<code>/ — 만드는 법은 _shorts-build/README.md.
def media_name(code, vid):
    """media/shorts/<언어>/ 안의 파일명(확장자 제외). 한국어만 <편id> 그대로, 나머지는 <편id>-<언어코드>
    (daughter-abroad-ja). 파일만 따로 내려받아도 어느 나라 영상인지 알 수 있게 하려는 규칙이다."""
    return vid if code == "ko" else f"{vid}-{code}"


def _load_shorts():
    """홈 해질녘에 넣을 숏폼(_shorts-build/shorts.json 의 home:true 편).

    영상 파일이 전부 있는 언어만 돌려준다 — 파일 없이 목록에만 있으면 홈에 깨진 영상이 뜨므로
    렌더가 끝난 언어만 자동으로 켜진다. 없는 언어는 ③ 문장을 그대로 보여 준다."""
    path = os.path.join(ROOT, "_shorts-build", "shorts.json")
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    home = [v for v in cfg["videos"] if v.get("home")]
    have = lambda code, v: os.path.exists(os.path.join(ROOT, "media", "shorts", code, media_name(code, v["id"]) + ".mp4"))
    # 영상 페이지(/{code}/shorts.html)는 그 언어로 렌더된 편 전부 — 최신 날짜가 위, 같은 날짜는 목록 순서
    newest = sorted(cfg["videos"], key=lambda v: v["date"], reverse=True)
    out = {}
    for code, L in cfg["langs"].items():
        entry = {"play": L["play"], "replay": L["replay"],
                 "all": [(v["id"], L[v["title"]]) for v in newest if have(code, v) and v["title"] in L]}
        if home and all(have(code, v) for v in home):
            entry["videos"] = [(v["id"], L[v["title"]]) for v in home]
        out[code] = entry
    return out


SHORTS = _load_shorts()


PUBLISH_JSON = os.environ.get("PUBLISH_JSON") or os.path.expanduser(
    "~/Library/CloudStorage/GoogleDrive-anbucheck1018@gmail.com/내 드라이브/안부 쇼츠/publish.json")


def _load_youtube():
    """{(편id, 언어): youtube_id} — 유튜브에 공개(unlisted/public)된 편만.

    영상 페이지(/{언어}/shorts.html)가 이 편들을 mp4 대신 유튜브로 재생한다(저장소 용량 때문).
    홈 해질녘 두 편은 이 값을 쓰지 않고 자체 플레이어(mp4)를 유지한다.
    publish.json 은 공유 드라이브에 있어 이 Mac 이 아닌 곳에서는 못 읽는다 — 그때는 경고만 하고
    전부 mp4 로 빌드한다(깨지지는 않지만 유튜브로 바뀐 편이 mp4 로 되돌아가므로 조심할 것).
    status 가 private/scheduled/removed 이거나 youtube_id 가 없으면 mp4 그대로다."""
    try:
        with open(PUBLISH_JSON, encoding="utf-8") as f:
            vids = json.load(f)["videos"]
    except (OSError, ValueError, KeyError) as e:
        print(f"  ⚠ publish.json 을 읽지 못함({e.__class__.__name__}) — 영상 페이지는 전부 mp4 로 빌드: {PUBLISH_JSON}")
        return {}
    out = {}
    for v in vids.values():
        if v.get("status") in ("unlisted", "public") and v.get("youtube_id"):
            out[(v["id"], v["lang"])] = v["youtube_id"]
    return out


YOUTUBE = _load_youtube()

_PLAY_SVG = '<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>'
_REPLAY_SVG = ('<svg class="i-replay" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V2L7.5 6 12 10V7a5 5 0 1 1-5 5H5'
               'a7 7 0 1 0 7-7z"/></svg>')


def video_figs(code, items, play, replay, indent="      ", youtube=False):
    """영상 카드. 홈 해질녘과 영상 페이지가 같은 마크업·같은 버튼(site.js 「숏폼 영상」)을 쓴다.

    youtube=True(영상 페이지만)이면 유튜브에 공개된 편은 <video> 대신 포스터+버튼만 둔다.
    누를 때까지 유튜브를 불러오지 않는다(site.js 가 그때 iframe 을 만든다 — 속도·개인정보)."""
    out = []
    for v, cap in items:
        yt = YOUTUBE.get((v, code)) if youtube else None
        btn = (f'<button type="button" class="vbtn" aria-label="{play}: {cap}" '
               f'data-play="{play}: {cap}" data-replay="{replay}: {cap}">{_PLAY_SVG}{_REPLAY_SVG}</button>')
        if yt:
            out.append(f'{indent}<figure class="vbox vyt" data-yt="{yt}" data-hl="{META[code][0]}" data-title="{cap}">'
                       f'<img class="vposter" src="/media/shorts/{code}/{media_name(code, v)}.jpg" alt="" loading="lazy">'
                       f'{btn}<figcaption>{cap}</figcaption></figure>')
        else:
            out.append(f'{indent}<figure class="vbox"><video src="/media/shorts/{code}/{media_name(code, v)}.mp4" '
                       f'poster="/media/shorts/{code}/{media_name(code, v)}.jpg" playsinline preload="none"></video>'
                       f'{btn}<figcaption>{cap}</figcaption></figure>')
    return "\n".join(out)


def dawn_tail(code, strings):
    """③ 자리. 영상이 있는 언어는 영상 두 편, 없는 언어는 ③ 문장.

    기본 컨트롤 대신 가운데 버튼 하나를 쓴다(재생 → 재생 중 숨김 → 끝나면 다시 보기).
    동작은 site.js 의 「숏폼 영상」 블록. preload="none" 이라 누르기 전에는 받지 않는다.
    muted 를 두지 않는다 — 재생은 항상 사용자가 버튼을 눌러 시작하므로 브라우저가 소리를 허용하고,
    누른 사람은 배경음악·효과음까지 들을 의도가 있다. 자동 재생을 추가한다면 그때 muted 를 다시 검토할 것."""
    cfg = SHORTS.get(code)
    if not cfg or not cfg.get("videos"):
        return f'<p class="q3 reveal">{strings["dawn_q3_html"]}</p>'
    figs = video_figs(code, cfg["videos"], cfg["play"], cfg["replay"])
    more = (f'\n    <a class="shorts-more" href="/{code}/shorts.html">{strings["shorts_more"]}'
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" '
            'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>')
    return f'<div class="dawn-shorts vlist">\n{figs}\n    </div>{more}'


def asset_ver():
    """style.css + site.js 내용 해시(8자). 주소에 ?v= 로 붙인다.

    GitHub Pages 는 max-age=600 으로 내려주고 주소가 같으면 휴대폰 브라우저가 새로고침해도
    옛 CSS 를 쓴다(2026-09-19, 숏폼 영상 배치 변경이 폰에서 반영되지 않았다).
    내용이 바뀌면 주소가 바뀌므로 캐시가 즉시 무효화된다. CSS·JS 를 고친 뒤엔 반드시 재빌드할 것."""
    h = hashlib.sha1()
    for name in ("style.css", "site.js"):
        with open(os.path.join(ROOT, name), "rb") as f:
            h.update(f.read())
    return h.hexdigest()[:8]


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
        "ASSET_VER": asset_ver(),
        "APP_STORE_URL": f"https://apps.apple.com/{APP_STORE_COUNTRY[code]}/app/id6762031850",
    }
    repl.update(app_tokens(code, app_all))
    repl.update(strings)
    repl["OG_TAGS"] = og_tags(f"{SITE}/{code}/", strings["og_title"], strings["og_desc"],
                              og_locale, strings["brand"], strings["tw_desc"])
    repl["DAWN_TAIL"] = dawn_tail(code, strings)
    for key, val in repl.items():
        page = page.replace("{{" + key + "}}", val)
    return page


def _slice(html, start, end):
    """template.html 에서 머리글·꼬리글 블록을 그대로 잘라 온다 — 영상 페이지가 두 벌을 갖지 않게."""
    i = html.index(start)
    j = html.index(end, i) + len(end)
    return html[i:j]


def build_shorts_page(code, strings, template, shorts_template):
    """/{code}/shorts.html — 그 언어로 렌더된 숏폼 전부. 영상 카드·버튼 동작은 홈과 같다."""
    cfg = SHORTS[code]
    codes = [c for c in ORDER if SHORTS.get(c, {}).get("all")]
    header = _slice(template, "<!-- ========== HEADER ========== -->", "</header>")
    footer = _slice(template, "<footer>", "</footer>")
    page = shorts_template.replace("{{HEADER}}", header).replace("{{FOOTER}}", footer)
    bcp, direction, og_locale, label, native = META[code]
    repl = {
        "HTML_LANG": bcp,
        "DIR_ATTR": ' dir="rtl"' if direction == "rtl" else "",
        "PATH": f"/{code}/",
        "OG_LOCALE": og_locale,
        "LANG_CURRENT": label,
        "SWITCHER": switcher(code, "shorts.html"),
        "SHORTS_HEAD_LINKS": head_links(code, "shorts.html", codes),
        "ASSET_VER": asset_ver(),
        "SHORTS_GRID": f'  <div class="shorts-grid vlist">\n{video_figs(code, cfg["all"], cfg["play"], cfg["replay"], "    ", youtube=True)}\n  </div>',
    }
    repl.update(strings)
    repl["OG_TAGS"] = og_tags(f"{SITE}/{code}/shorts.html",
                              f'{strings["shorts_title"]} · {strings["brand"]}',
                              strings["shorts_lead"], og_locale, strings["brand"])
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


ROOT_OG_BEGIN = "<!-- og:begin (자동 생성 — i18n/build.py 의 patch_root_og, 한국어 og_* 를 쓴다) -->"
ROOT_OG_END = "<!-- og:end -->"


def patch_root_og(ko):
    """루트 index.html(언어 분기 JS 라우터)에 공유 미리보기 태그를 넣는다.

    공유 앱의 수집기는 JS 를 실행하지 않아 리다이렉트를 따라가지 못한다. 그래서 가장 많이
    공유되는 맨 주소 `averic.co.kr` 이 **그림 없는 카드**로 나가고 있었다(2026-09-28).
    수집기는 언어를 알려 주지 않으므로 한 벌만 둘 수 있고, 주로 카카오톡으로 공유되므로
    한국어를 쓴다. 루트는 noindex 라 검색에는 영향이 없다.
    og:url 은 루트 자신이어야 한다 — /ko/ 를 가리키면 메타가 그 주소를 다시 수집한다.
    **멱등** — 기존 블록을 지우고 다시 넣는다."""
    path = os.path.join(ROOT, "index.html")
    with open(path, encoding="utf-8") as f:
        src = f.read()
    src = re.sub(re.escape(ROOT_OG_BEGIN) + r".*?" + re.escape(ROOT_OG_END) + r"\n",
                 "", src, flags=re.S)
    anchor = re.search(r'^<meta name="theme-color"[^>]*>\n', src, re.M)
    if not anchor:
        sys.exit("오류: 루트 index.html 에서 theme-color 줄을 못 찾음 — og 태그를 넣을 수 없다")
    block = "\n".join([ROOT_OG_BEGIN,
                       og_tags(f"{SITE}/", ko["og_title"], ko["og_desc"], META["ko"][2],
                               ko["brand"], ko["tw_desc"]),
                       ROOT_OG_END]) + "\n"
    new = src[:anchor.end()] + block + src[anchor.end():]
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)
    print("  patched /index.html  (og 태그)")


def main():
    with open(os.path.join(I18N, "template.html"), encoding="utf-8") as f:
        template = f.read()
    with open(os.path.join(I18N, "shorts-template.html"), encoding="utf-8") as f:
        shorts_template = f.read()
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
        if SHORTS.get(code, {}).get("all"):
            sp = build_shorts_page(code, merged, template, shorts_template)
            left = re.findall(r"\{\{[A-Za-z0-9_]+\}\}", sp)
            if left:
                problems.append(f"{code}: shorts.html unresolved tokens {set(left)}")
                continue
            with open(os.path.join(ROOT, code, "shorts.html"), "w", encoding="utf-8") as f:
                f.write(sp)

    ko = dict(en)
    ko.update({k: v for k, v in translations["ko"].items() if v})
    patch_root_og(ko)

    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("\nOK — all pages built.")


if __name__ == "__main__":
    main()
