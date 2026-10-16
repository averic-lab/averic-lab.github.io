"""삶의 선 쇼츠(3d-line) 문구 → strings.json
   푸시 문구는 서버 i18n/messages.py 의 실제 값(본문 앞 "이름 · " = 서버 decorate_body 와 같은 형식).
   캡션·엔딩은 line_text.json(언어별). 엔딩 CTA(다운로드·스토어)는 3d/manual.json 재사용.
   python3 gen_line_strings.py <서버 저장소> <3d/manual.json>"""
import json, os, sys
SERVER, MANUAL = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SERVER)
from i18n.messages import MESSAGES
LOC = {'ko':'ko_KR','en':'en_US','ja':'ja_JP','zh-CN':'zh_CN','zh-TW':'zh_TW','de':'de_DE','fr':'fr_FR','es':'es_ES','it':'it_IT','pt-BR':'pt_BR','ru':'ru_RU','nl':'nl_NL','pl':'pl_PL','tr':'tr_TR','vi':'vi_VN','th':'th_TH','id':'id_ID','sv':'sv_SE','hi':'hi_IN','ar':'ar_SA'}
from i18n.messages import format_number
txt = json.load(open(os.path.join(HERE, os.environ.get('TEXT','line_text.json')), encoding='utf-8'))
man = json.load(open(MANUAL, encoding='utf-8'))
out = {}
for code, loc in LOC.items():
    sv, mn, t = MESSAGES[loc], man[code], txt[code]
    dec = lambda body, who='mom': f"{mn['names'][who]} · {body}"
    out[code] = {
        'caps': t['caps'], 'caps_w': t.get('caps_w', {}), 'ending': t['ending'],
        'app_name': '안부' if code == 'ko' else 'Anbu', 'now': mn['now'], 'dl': mn['dl'], 'store': mn['store'], 'store_w': t.get('store_w'),
        'rtl': code == 'ar',
        'push': [
            {'lv': 'normal', 'title': sv['push_auto_report_title'], 'body': dec(sv['noti_steps_body'].format(steps=format_number(loc, 6240)), 'dad')},
            {'lv': 'normal', 'title': sv['push_auto_report_title'], 'body': dec(sv['noti_steps_body'].format(steps=format_number(loc, 7412)))},
            {'lv': 'urgent', 'title': sv['push_urgent_title'], 'body': dec(sv['push_urgent_body'].format(days=3), 'dad')},
        ],
    }
json.dump(out, open(os.path.join(HERE, 'strings.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', list(out))
