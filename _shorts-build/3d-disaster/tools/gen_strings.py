# 「72시간」 언어별 화면 문구 → lang/<lang>.json
#   python3 tools/gen_strings.py
# 앱 화면에 나오는 글자는 반드시 앱(dart)·서버(messages.py) 번역에서 가져온다(앱 사실 규칙). 영상에만 있는 새 문구는 lang/new.json.
# 숫자 천 단위·라벨 구분자·% 앞 공백은 앱 NumberText / labelSeparator 와 같은 표(용어집 §3·§5).
import json, os, re, importlib.util
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = '/Users/macmini/Project/Anbu/kr.co.anbucheck/lib/app/core/translations'
SRV = '/Users/macmini/Project/Anbu/anbucheck-server/i18n/messages.py'
DATA = os.path.join(ROOT, '..', 'data')
LANGS = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'de', 'fr', 'es', 'it', 'nl', 'pt-BR', 'ru', 'ar', 'tr', 'pl', 'vi', 'th', 'sv', 'hi', 'id']
DART = {'ko': 'ko_kr', 'en': 'en_us', 'ja': 'ja_jp', 'zh-CN': 'zh_cn', 'zh-TW': 'zh_tw', 'de': 'de_de', 'fr': 'fr_fr', 'es': 'es_es', 'it': 'it_it', 'nl': 'nl_nl',
        'pt-BR': 'pt_br', 'ru': 'ru_ru', 'ar': 'ar_sa', 'tr': 'tr_tr', 'pl': 'pl_pl', 'vi': 'vi_vn', 'th': 'th_th', 'sv': 'sv_se', 'hi': 'hi_in', 'id': 'id_id'}
LOC = {l: d[:2] + '_' + d[3:].upper() for l, d in DART.items()}

STR = r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\""
def dart(lang):
    s = open(os.path.join(APP, DART[lang] + '.dart'), encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"'([a-z0-9_]+)'\s*:\s*((?:" + STR + r")(?:\s*(?:" + STR + r"))*)\s*,", s):
        parts = re.findall(STR, m.group(2))
        v = ''.join(p[1:-1] for p in parts)
        v = v.replace("\\n", "\n").replace("\\'", "'").replace('\\"', '"').replace('\\$', '$').replace('\\\\', '\\')
        out[m.group(1)] = v
    return out

spec = importlib.util.spec_from_file_location('msgs', SRV); msgs = importlib.util.module_from_spec(spec); spec.loader.exec_module(msgs)
def data(lang):
    s = open(os.path.join(DATA, lang + '.js'), encoding='utf-8').read(); return json.loads(s[s.index('{'):s.rindex('}') + 1])
NEW = json.load(open(os.path.join(ROOT, 'lang', 'new.json'), encoding='utf-8'))

def num(lang, n):
    s = f'{n:,}'
    if lang in ('de', 'es', 'it', 'nl', 'pt-BR', 'tr', 'id', 'vi'): return s.replace(',', '.')
    if lang in ('fr', 'ru', 'pl', 'sv'): return s.replace(',', ' ')
    return s
def pct(lang, n):
    if lang in ('de', 'fr', 'es', 'ru', 'sv'): return f'{n} %'
    if lang == 'tr': return f'%{n}'
    return f'{n}%'
def sep(lang, ko_spaced=False):
    if lang == 'ko': return ' : ' if ko_spaced else ': '
    if lang == 'fr': return ' : '
    if lang in ('ja', 'zh-CN', 'zh-TW'): return '：'
    return ': '

os.makedirs(os.path.join(ROOT, 'lang'), exist_ok=True)
for lang in LANGS:
    A, D, N = dart(lang), data(lang), NEW[lang]
    M = msgs.MESSAGES[LOC[lang]] if LOC[lang] in msgs.MESSAGES else msgs.MESSAGES[msgs.resolve_locale(LOC[lang])]
    def a(k, **kw):
        if lang == 'ar' and kw and f'{k}_two' in A and list(kw.values())[0] == '2': k = f'{k}_two'
        v = A[k]
        for p, x in kw.items(): v = v.replace('@' + p, x)
        return v
    alias = N.get('alias') or [D['mom'], D['i_dad']]
    if lang == 'ko': store = N['store']
    else:
        st = D['store']; i = st.index('Anbu'); store = [st[:i], 'Anbu', st[i + 4:]]
    out = {
        'lang': lang, 'tags': N['tags'], 'alert': N['alert'], 'phone4': N['phone4'], 'end': N['end'], 'store': store, 'alias': alias,
        'brand': A['app_name'] if 'app_name' in A else D['app_name'],
        'now': A['onboarding_push_now'],
        'app': {
            'title': A['app_guardian_title'],
            'checking': a('guardian_checking_subjects', count='2'),
            'summary': A['guardian_today_summary'],
            'legendSafe': A['guardian_status_normal'] + sep(lang) + '1',
            'legendCaution': A['guardian_status_caution'] + sep(lang) + '1',
            'list': A['guardian_subject_list'],
            'pillSafe': A['guardian_status_confirmed'],
            'pillCaution': A['guardian_status_caution'],
            'activity': A['guardian_activity_prefix'] + sep(lang, ko_spaced=True) + A['guardian_activity_active'],
            'steps': A['guardian_chart_y_axis_steps'],
            'last7': A['guardian_chart_x_axis_last_7_days'],
            'lastCheck': a('guardian_last_check_hours', hours='2'),
            'add': A['add_subject_button'],
            'nav': [A['nav_home'], A['nav_connection'], A['nav_notification'], A['nav_settings']],
            'safetyNeeded': A['guardian_safety_needed'],
            'callNow': A['guardian_call_now'],
            'confirmSafety': A['guardian_confirm_safety'],
            'viewLoc': A['notifications_view_location'],
            'mapTitle': A['emergency_map_title'], 'subjLabel': A['emergency_map_subject_label'],
            'capturedLabel': A['emergency_map_captured_at_label'], 'accLabel': A['emergency_map_accuracy_label'],
            'openExternal': A['emergency_map_open_external'],
            'stepsBody': A['noti_steps_body'].replace('@steps', num(lang, 6240)),
        },
        'srv': {'autoTitle': M['push_auto_report_title'], 'emTitle': M['push_emergency_title'], 'emBody': M['push_emergency_body']},
        'steps': num(lang, 6240), 'battery': pct(lang, 85), 'captured': '2026-11-20 21:42', 'accuracy': '±20m',
    }
    json.dump(out, open(os.path.join(ROOT, 'lang', lang + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(lang, out['app']['checking'].replace('\n', ' / '), '|', out['app']['lastCheck'], '|', out['srv']['emTitle'], '|', '·'.join(store))
