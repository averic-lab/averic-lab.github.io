"""copy/<언어>.js 생성 — 한국어(copy/ko.js)는 손으로 쓴 원본이라 건드리지 않는다.
  · 앱 화면 안 문구      앱 저장소 translations/*.dart (gen.py 의 파서 재사용)
  · 마케팅 문구          marketing.py
  · 엄마/아빠 호칭·20개 언어 문구  i18n/translations.json(nick2), shorts.json(p_j1)
  python3 gen_copy.py            19개 언어
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(ROOT, "i18n")); sys.path.insert(0, os.path.join(ROOT, "_faq-build")); sys.path.insert(0, HERE)
import build as site            # noqa: E402
import extract_strings as ex    # noqa: E402
from marketing import M         # noqa: E402

KEYS = ["notifications_title", "notifications_today", "notifications_level_health", "notifications_level_caution",
        "notifications_level_warning", "notifications_level_urgent", "noti_auto_report_body", "noti_caution_missing_body",
        "noti_warning_body", "noti_urgent_body", "noti_emergency_body", "notifications_view_location",
        "add_subject_title", "add_subject_guide_title", "add_subject_guide_subtitle", "add_subject_code_label",
        "add_subject_alias_label", "add_subject_phone_label", "add_subject_phone_hint", "add_subject_connect", "add_subject_success",
        "guardian_checking_subjects", "guardian_checking_subjects_one", "guardian_status_normal", "guardian_status_caution", "guardian_safety_needed",
        "guardian_call_now", "guardian_confirm_safety", "guardian_last_check_days_one", "guardian_last_check_hours",
        "emergency_map_title", "emergency_map_subject_label", "emergency_map_captured_at_label", "emergency_map_accuracy_label",
        "subject_home_emergency_button"]

def app(lf):
    src = open(os.path.join(ex.TRANS, f"{lf}.dart"), encoding="utf-8").read()
    out = {}
    for k in KEYS:
        m = re.search(rf"'{re.escape(k)}'\s*:\s*{ex.VALUE_RE}", src)
        if not m: sys.exit(f"오류: {lf}.dart 에 {k} 가 없습니다")
        out[k] = ex.unescape(m.group(1) if m.group(1) is not None else m.group(2))
    return out

tr = json.load(open(os.path.join(ROOT, "i18n", "translations.json"), encoding="utf-8"))
shorts = json.load(open(os.path.join(ROOT, "_shorts-build", "shorts.json"), encoding="utf-8"))["langs"]
for code, mk in M.items():
    a = app(site.LANG_TO_STRINGS[code])
    base = code.split("-")[0]
    sep = " : " if base == "fr" else "：" if base in ("ja", "zh") else ": "
    help_ = re.sub(r"^[\U0001F300-\U0001FAFF☀-➿️\s]+", "", a["subject_home_emergency_button"])
    S = {"brand": "Anbu", "push_app": "Anbu", "dad": tr[code]["nick2"], "p8_lang": shorts[code]["p_j1"]}
    for k, v in mk.items(): S[k] = [x for x in v] if isinstance(v, list) else v.replace("{help}", help_)
    S.update({
        "n_title": a["notifications_title"], "n_today": a["notifications_today"],
        "lv_normal": a["notifications_level_health"], "lv_caution": a["notifications_level_caution"],
        "lv_warning": a["notifications_level_warning"], "lv_urgent": a["notifications_level_urgent"],
        "b_auto": a["noti_auto_report_body"], "b_caution": a["noti_caution_missing_body"], "b_warning": a["noti_warning_body"],
        "b_urgent": a["noti_urgent_body"].replace("@days", "3"), "b_sos": a["noti_emergency_body"], "view_loc": a["notifications_view_location"],
        "add_title": a["add_subject_title"], "add_guide": a["add_subject_guide_title"], "add_sub": a["add_subject_guide_subtitle"],
        "add_code_label": a["add_subject_code_label"], "add_alias_label": a["add_subject_alias_label"], "add_phone_label": a["add_subject_phone_label"],
        "add_phone_hint": a["add_subject_phone_hint"], "add_connect": a["add_subject_connect"], "add_ok": a["add_subject_success"],
        "d1_head": a["guardian_checking_subjects_one"].replace("@count", "1").replace("\n", "<br>"),
        "d3_head": a["guardian_checking_subjects"].replace("@count", "3").replace("\n", "<br>"),
        "legend_ok": a["guardian_status_normal"] + sep + "2", "legend_caution": a["guardian_status_caution"] + sep + "1",
        "pill_caution": "⚠️ " + a["guardian_status_caution"], "safety_needed": a["guardian_safety_needed"],
        "call_now": a["guardian_call_now"], "confirm_safety": a["guardian_confirm_safety"],
        "last_1d": a["guardian_last_check_days_one"].replace("@days", "1"), "last_3h": a["guardian_last_check_hours"].replace("@hours", "3"),
        "map_title": a["emergency_map_title"], "map_subject": a["emergency_map_subject_label"],
        "map_time": a["emergency_map_captured_at_label"], "map_acc": a["emergency_map_accuracy_label"],
    })
    with open(os.path.join(HERE, "copy", f"{code}.js"), "w", encoding="utf-8") as f:
        f.write(f"// 자동 생성(gen_copy.py) — 직접 고치지 말고 marketing.py 를 고친다.\nwindow.S = {json.dumps(S, ensure_ascii=False, indent=1)};\n")
    print(code, "OK", help_)
