"""영상에 들어가는 문구를 언어별로 모은다 → strings.json

- 앱 화면·알림 목록: 앱 번역 파일(lib/app/core/translations/*.dart) 의 실제 키 값
- 푸시 팝업: 서버 i18n/messages.py 의 실제 문구(본문 앞 "이름 · " 는 서버 decorate_body 와 같은 형식)
- 이름·OS 알림의 '지금'·엔딩·제목: manual.json (번역 검증을 거친 값)
- 시각 표기: 앱 time_utils.formatTimeOfDay 와 같은 규칙(common_time_style / common_am / common_pm)

    python3 gen_strings.py <앱 저장소> <서버 저장소>
"""
import json, os, re, sys

APP, SERVER = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
# 사이트 언어 코드 → (앱 dart 파일, 서버 로케일)
LANGS = {
    'ko': ('ko_kr', 'ko_KR'), 'en': ('en_us', 'en_US'), 'ja': ('ja_jp', 'ja_JP'), 'zh-CN': ('zh_cn', 'zh_CN'),
    'zh-TW': ('zh_tw', 'zh_TW'), 'de': ('de_de', 'de_DE'), 'fr': ('fr_fr', 'fr_FR'), 'es': ('es_es', 'es_ES'),
    'it': ('it_it', 'it_IT'), 'nl': ('nl_nl', 'nl_NL'), 'pt-BR': ('pt_br', 'pt_BR'), 'ru': ('ru_ru', 'ru_RU'),
    'ar': ('ar_sa', 'ar_SA'), 'tr': ('tr_tr', 'tr_TR'), 'pl': ('pl_pl', 'pl_PL'), 'vi': ('vi_vn', 'vi_VN'),
    'th': ('th_th', 'th_TH'), 'sv': ('sv_se', 'sv_SE'), 'hi': ('hi_in', 'hi_IN'), 'id': ('id_id', 'id_ID'),
}
APP_KEYS = [
    'notifications_title', 'notifications_today', 'notifications_auto_delete_notice',
    'notifications_level_health', 'notifications_level_info', 'notifications_level_caution', 'notifications_level_urgent',
    'noti_steps_body', 'noti_auto_report_body', 'noti_battery_low_body', 'noti_caution_suspicious_body',
    'noti_caution_missing_body', 'noti_emergency_body', 'notifications_view_location',
    'nav_home', 'nav_connection', 'nav_notification', 'nav_settings',
    'app_guardian_title', 'guardian_checking_subjects', 'guardian_today_summary', 'guardian_subject_list',
    'guardian_status_normal', 'guardian_status_caution', 'guardian_status_urgent', 'guardian_status_confirmed',
    'guardian_activity_prefix', 'guardian_activity_active', 'guardian_safety_needed',
    'guardian_call_now', 'guardian_confirm_safety', 'guardian_last_check_hours', 'guardian_last_check_days',
    'guardian_chart_y_axis_steps', 'guardian_chart_x_axis_last_7_days', 'guardian_chart_x_axis_last_30_days',
    'add_subject_button', 'common_time_style', 'common_am', 'common_pm',
]
SERVER_KEYS = ['push_auto_report_title', 'noti_steps_body', 'push_battery_low_title', 'push_battery_low_body',
               'push_caution_title', 'push_caution_suspicious_body', 'push_caution_missing_body',
               'push_emergency_title', 'push_emergency_body']

def dart(name):
    s = open(os.path.join(APP, 'lib/app/core/translations', name + '.dart'), encoding='utf-8').read()
    out = {}
    # 'key': '값' — 값 안의 \' 이스케이프를 허용
    # 값이 다음 줄에 오거나 큰따옴표로 묶인 경우, 인접 문자열 이어 붙이기('a' 'b')까지 처리
    for m in re.finditer(r"'([a-z0-9_]+)'\s*:\s*((?:(?:'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\")\s*)+)", s):
        parts = re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"", m.group(2))
        v = ''.join(p1 or p2 for p1, p2 in parts)
        out[m.group(1)] = v.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n').replace('\\$', '$')
    return out

sys.path.insert(0, SERVER)
from i18n.messages import MESSAGES  # noqa: E402

manual = json.load(open(os.path.join(HERE, 'manual.json'), encoding='utf-8'))

def fmt_time(a, h, m):
    st = a['common_time_style']
    if st == 'h24': return f'{h:02d}:{m:02d}'
    p = a['common_am'] if h < 12 else a['common_pm']; h12 = 12 if h % 12 == 0 else h % 12
    return f'{p} {h12}:{m:02d}' if st == 'pre12' else f'{h12}:{m:02d} {p}'

# ── 영상용 번역 교정 ── 앱·서버 문구가 어색하거나 틀린 곳. 코드 수정 목록은 translation_fixes.md
# (앱 저장소에 반영되면 여기서 지운다 — 같은 값이 두 곳에 남지 않게)
FIX = json.load(open(os.path.join(HERE, 'fixes.json'), encoding='utf-8'))
# 숫자: 서버 f"{steps:,}"·앱 차트는 언어와 무관하게 쉼표 → 영상은 언어별 규칙(브라우저 Intl 과 같은 CLDR)
import subprocess
NUM_LOC = {'ko': 'ko-KR', 'en': 'en-US', 'ja': 'ja-JP', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'de': 'de-DE', 'fr': 'fr-FR',
           'es': 'es-ES', 'it': 'it-IT', 'nl': 'nl-NL', 'pt-BR': 'pt-BR', 'ru': 'ru-RU', 'ar': 'ar-SA-u-nu-latn', 'tr': 'tr-TR',
           'pl': 'pl-PL', 'vi': 'vi-VN', 'th': 'th-TH', 'sv': 'sv-SE', 'hi': 'hi-IN', 'id': 'id-ID'}
NUMS = json.loads(subprocess.run(['node', '-e', 'const m=' + json.dumps(NUM_LOC) + ';const o={};for(const[k,v]of Object.entries(m))o[k]=[6240,7412].map(n=>new Intl.NumberFormat(v).format(n));console.log(JSON.stringify(o))'],
                                 capture_output=True, text=True, check=True).stdout)

out = {}
for code, (df, loc) in LANGS.items():
    a, sv, mn = dart(df), MESSAGES[loc], manual[code]
    missing = [k for k in APP_KEYS if k not in a] + [k for k in SERVER_KEYS if k not in sv]
    if missing: sys.exit(f'{code}: 키 없음 {missing}')
    L = {k: a[k] for k in APP_KEYS}
    L.update(mn)
    STEPS = NUMS[code][0]
    for k, v in FIX.get(code, {}).get('app', {}).items(): L[k] = v
    sv = dict(sv); sv.update(FIX.get(code, {}).get('server', {}))
    nm = mn['names']                          # {mom, dad, sib}
    dec = lambda name, body: f'{name} · {body}'   # 서버 decorate_body
    L['push'] = [
        {'lv': 'normal', 'title': sv['push_auto_report_title'], 'body': dec(nm['mom'], sv['noti_steps_body'].format(steps=STEPS))},
        {'lv': 'battery', 'title': sv['push_battery_low_title'], 'body': dec(nm['mom'], sv['push_battery_low_body'])},
        {'lv': 'caution', 'title': sv['push_caution_title'], 'body': dec(nm['sib'], sv['push_caution_suspicious_body'])},
        {'lv': 'caution', 'title': sv['push_caution_title'], 'body': dec(nm['dad'], sv['push_caution_missing_body'])},
        {'lv': 'urgent', 'title': sv['push_emergency_title'], 'body': dec(nm['sib'], sv['push_emergency_body'])},
    ]
    L['steps_body'] = L['noti_steps_body'].replace('@steps', STEPS)
    L['num_locale'] = NUM_LOC[code]
    L['times'] = {k: fmt_time(a, h, m) for k, (h, m) in {'t1800': (18, 0), 't1900': (19, 0), 't2000': (20, 0), 't2005': (20, 5)}.items()}
    # 개수 문장은 앱 NumberText 와 같은 규칙으로 키를 고른다: n==1 이면 `<키>_one`(있는 언어만),
    # 아랍어는 1 `_one` / 2 `_two` / 3~10 기본 키. 이걸 빼면 "1 days ago"·"vor 1 Tagen"·"قبل 1 ساعات"이 나온다.
    def cnt(a, key, param, n):
        if code == 'ar':
            suf = '_one' if n == 1 else '_two' if n == 2 else ''
            k = key + suf if (key + suf) in a else key
        else:
            k = key + '_one' if n == 1 and (key + '_one') in a else key
        return a[k].replace('@' + param, str(n))
    L['checking'] = cnt(a, 'guardian_checking_subjects', 'count', 3)
    L['last_1h'] = cnt(a, 'guardian_last_check_hours', 'hours', 1)
    L['last_2h'] = cnt(a, 'guardian_last_check_hours', 'hours', 2)
    L['last_1d'] = cnt(a, 'guardian_last_check_days', 'days', 1)
    V = FIX.get(code, {}).get('video', {})
    # 앱 activityLabelFromSteps 는 모든 언어에 ' : ' — 영상은 언어별 구두점(sep). 줌인 강조 단어는 act_word
    sep = V.get('act_sep', ': ')
    L['act_pre'] = a['guardian_activity_prefix'] + sep
    L['act_word'] = a['guardian_activity_active']
    L['activity_full'] = L['act_pre'] + L['act_word']
    L['app_name'] = '안부' if code == 'ko' else 'Anbu'
    L['rtl'] = code == 'ar'
    out[code] = L
json.dump(out, open(os.path.join(HERE, 'strings.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(out), '개 언어')
