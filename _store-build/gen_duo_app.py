#!/usr/bin/env python3
"""Duo 스크린샷용 앱 문구 — 앱 번역 파일(lib/app/core/translations/*.dart)에서 실제 화면 문구를 그대로 가져온다.
결과: duo_app/<언어>.js (window.A = {...}). 직접 고치지 말 것 — 앱 번역을 고치고 다시 돌린다."""
import json, os, re
APP = os.path.join(os.path.dirname(__file__), '..', '..', 'kr.co.anbucheck', 'lib', 'app', 'core', 'translations')
FILES = {'ko': 'ko_kr', 'en': 'en_us', 'ja': 'ja_jp', 'zh-CN': 'zh_cn', 'zh-TW': 'zh_tw', 'de': 'de_de', 'fr': 'fr_fr', 'es': 'es_es', 'it': 'it_it',
         'nl': 'nl_nl', 'pt-BR': 'pt_br', 'ru': 'ru_ru', 'ar': 'ar_sa', 'tr': 'tr_tr', 'pl': 'pl_pl', 'vi': 'vi_vn', 'th': 'th_th', 'sv': 'sv_se', 'hi': 'hi_in', 'id': 'id_id'}
KEYS = ['app_guardian_title', 'guardian_checking_subjects', 'guardian_checking_subjects_one', 'guardian_subject_list', 'guardian_status_confirmed', 'guardian_status_caution',
        'guardian_safety_needed', 'guardian_activity_prefix', 'guardian_activity_very_active', 'guardian_activity_active', 'guardian_activity_needs_exercise',
        'guardian_call_now', 'guardian_confirm_safety', 'guardian_last_check_now', 'guardian_last_check_days', 'guardian_last_check_days_one',
        'guardian_chart_y_axis_steps', 'guardian_chart_x_axis_last_7_days', 'guardian_chart_x_axis_last_30_days', 'add_subject_button',
        'notifications_title', 'notifications_today', 'notifications_auto_delete_notice', 'notifications_level_health', 'notifications_level_caution',
        'notifications_level_info', 'noti_caution_missing_body', 'noti_auto_report_body', 'noti_steps_body',
        'add_subject_title', 'add_subject_guide_title', 'add_subject_guide_subtitle', 'add_subject_code_label', 'add_subject_code_info',
        'add_subject_alias_label', 'add_subject_phone_label', 'add_subject_phone_info', 'add_subject_phone_hint', 'add_subject_connect',
        'guardian_status_urgent', 'guardian_last_check_minutes', 'notifications_level_urgent', 'noti_emergency_body', 'notifications_view_location',
        'nav_home', 'nav_connection', 'nav_notification', 'nav_settings']
PAT = re.compile(r"""^\s*'([a-z0-9_]+)'\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")\s*,?\s*$""")
def unesc(s): return s.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n').replace('\\\\', '\\')
os.makedirs(os.path.join(os.path.dirname(__file__), 'duo_app'), exist_ok=True)
for lang, f in FILES.items():
    d = {}
    for line in open(os.path.join(APP, f + '.dart'), encoding='utf-8'):
        m = PAT.match(line)
        if m and m.group(1) in KEYS: d[m.group(1)] = unesc(m.group(2) if m.group(2) is not None else m.group(3))
    miss = [k for k in KEYS if k not in d and not k.endswith('_one')]
    if miss: print(lang, '누락:', miss)
    open(os.path.join(os.path.dirname(__file__), 'duo_app', lang + '.js'), 'w', encoding='utf-8').write('window.A = ' + json.dumps(d, ensure_ascii=False, indent=1) + ';\n')
print('ok')
