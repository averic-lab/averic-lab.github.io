"""fdata/<언어>.js 생성 — Play 그래픽 이미지(feature.html)의 글자.
  · 폰 화면 문구   앱 저장소 translations/*.dart (대시보드가 조합하는 규칙 그대로: labelSeparator · NumberText · 아랍어 복수형)
  · 푸시 제목      서버 i18n/messages.py push_auto_report_title / 본문 = 엄마 별칭 · noti_steps_body (쇼츠와 같은 형식)
  · 안전 코드 점선 라벨(복사/SNS 공유)  홈페이지 히어로(<언어>/index.html) — 앱 화면이 아니라 홈페이지 설명 라벨이다
  python3 gen_feature.py
"""
import html as H, importlib.util, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "i18n")); sys.path.insert(0, os.path.join(ROOT, "_faq-build"))
import build as site, extract_strings as ex   # noqa: E402

LANGS = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'de', 'fr', 'es', 'it', 'pt-BR', 'nl', 'ru', 'pl', 'sv', 'tr', 'ar', 'hi', 'vi', 'th', 'id']
KEYS = ['app_guardian_title', 'guardian_checking_subjects', 'guardian_today_summary', 'guardian_status_normal', 'guardian_status_caution',
        'guardian_subject_list', 'guardian_status_confirmed', 'guardian_activity_prefix', 'guardian_activity_active',
        'guardian_chart_y_axis_steps', 'guardian_chart_x_axis_last_7_days', 'guardian_last_check_hours', 'guardian_safety_needed',
        'guardian_call_now', 'guardian_confirm_safety', 'add_subject_button', 'nav_home', 'nav_connection', 'nav_notification',
        'nav_settings', 'onboarding_push_now']
spec = importlib.util.spec_from_file_location("m", os.path.join(os.path.dirname(ROOT), "anbucheck-server", "i18n", "messages.py"))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); MSG = mod.MESSAGES
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), "anbucheck-server"))
from services import push_service as PS   # noqa: E402  decorate_body 그대로 쓴다
TR = json.load(open(os.path.join(ROOT, "i18n", "translations.json"), encoding="utf-8"))

def get(src, k):
    m = re.search(rf"'{re.escape(k)}'\s*:\s*{ex.VALUE_RE}", src)
    return ex.unescape(m.group(1) if m.group(1) is not None else m.group(2)) if m else None

def num(n, lc):   # 앱 NumberText.format 과 같은 표
    sep = '.' if lc in ('de', 'es', 'it', 'nl', 'pt', 'tr', 'id', 'vi') else ' ' if lc in ('fr', 'ru', 'pl', 'sv') else ','
    return f"{n:,}".replace(',', sep)

def sep(lc, ko_spaced=False):   # 앱 labelSeparator 와 같은 규칙
    return (' : ' if ko_spaced else ': ') if lc == 'ko' else ' : ' if lc == 'fr' else '：' if lc in ('ja', 'zh') else ': '

for code in LANGS:
    lf = site.LANG_TO_STRINGS[code]; src = open(os.path.join(ex.TRANS, f"{lf}.dart"), encoding="utf-8").read()
    a = {k: get(src, k) for k in KEYS}
    for k, v in a.items():
        if v is None: sys.exit(f"{lf}: {k} 없음")
    lc = code.split('-')[0]; locale = lf[:2] + "_" + lf[3:].upper()
    # 마지막 확인 2시간 전 — 아랍어는 복수형(2 = _two), 나머지는 앱처럼 숫자만 넣는다
    last = (get(src, 'guardian_last_check_hours_two') or a['guardian_last_check_hours']) if lc == 'ar' else a['guardian_last_check_hours']
    last = last.replace('@hours', '2')
    hero = open(os.path.join(ROOT, code, "index.html"), encoding="utf-8").read()
    i = hero.index('class="codecard"'); blk = hero[i:hero.index('class="pop"', i)]
    lg = [H.unescape(x) for x in re.findall(r'<span class="lg">([^<]+)</span>', blk)]
    sm = [H.unescape(x) for x in re.findall(r'<span class="sm">([^<]+)</span>', blk)]
    mom, dad = TR[code]["nick1"], TR[code]["nick2"]
    F = {
        "bcp": site.META[code][0], "dir": site.META[code][1],
        "appbar": a['app_guardian_title'],
        "phead": a['guardian_checking_subjects'].replace('@count', '2').replace('\n', '<br>'),
        "psum": a['guardian_today_summary'],
        "lg_ok": a['guardian_status_normal'] + sep(lc) + '1', "lg_caution": a['guardian_status_caution'] + sep(lc) + '1',
        "plist": a['guardian_subject_list'], "mom": mom, "dad": dad,
        "pill_ok": a['guardian_status_confirmed'], "pill_caution": a['guardian_status_caution'],
        "act": a['guardian_activity_prefix'] + sep(lc, True) + a['guardian_activity_active'],
        "steps": a['guardian_chart_y_axis_steps'], "last7": a['guardian_chart_x_axis_last_7_days'], "peak": num(6240, lc),
        "last": last, "warn": a['guardian_safety_needed'], "call": a['guardian_call_now'], "confirm": a['guardian_confirm_safety'],
        "add": a['add_subject_button'], "now": a['onboarding_push_now'],
        "nav": [a['nav_home'], a['nav_connection'], a['nav_notification'], a['nav_settings']],
        "push_title": MSG[locale]["push_auto_report_title"],
        "co_copy": lg[0], "co_share": lg[1], "co_copy_sm": sm[0], "co_share_sm": sm[1],
    }
    # 실제 푸시 = 서버 push_auto_report(걸음수 있음) → decorate_body(별칭 · 본문)
    F["push_body"] = PS.decorate_body(mod.get_steps_message(locale, 6240), mom)
    with open(os.path.join(HERE, "fdata", f"{code}.js"), "w", encoding="utf-8") as f:
        f.write("// 자동 생성(gen_feature.py) — 직접 고치지 말 것\nwindow.F = " + json.dumps(F, ensure_ascii=False, indent=1) + ";\n")
    print(code, F["push_title"], "|", F["push_body"], "|", F["act"], "|", F["last"])
