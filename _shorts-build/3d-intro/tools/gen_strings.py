#!/usr/bin/env python3
"""lang/<언어>.json 만들기 — 「안부 앱 소개」 3D 판.

자막은 원판(app-intro, h.html)과 같은 키를 그대로 쓴다: shorts.json langs[<언어>] 의 p_* 와,
gen.py 가 앱·서버 번역에서 만든 data/<언어>.js(push_title·steps_tpl·em_btn·app_name·now·mom·q1·q2·store).
엔딩 카드(segs/end)는 5줄(0·1 = 첫 문장, 2·4 = 둘째 문장, 3 = 구리 박 강조)이라 q1/q2 를 줄로 나눈 값을
END 에 언어별로 적는다(없으면 q1 을 두 줄, q2 를 앞·뒤로 나눈 자동 분할).

    python3 tools/gen_strings.py ko
"""
import json, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.abspath(os.path.join(HERE, '..', '..'))

# 엔딩 카드 줄 나누기(문장은 원판 q1/q2 그대로 — 줄만 나눈다). [첫 문장 1줄, 첫 문장 2줄, 둘째 앞, 박 강조, 둘째 뒤]
END = {
    'ko': ['가족들은 늘', '“난 괜찮아”라고 말합니다.', '하지만', '정말', '괜찮은 걸까요.'],
}
# 엔딩 둘째 카드의 '스토어에서 ‘Anbu’ 검색' — 가운데 조각만 호박색(e3 계약)
STORE = {'ko': ['스토어에서 안부 ‘', 'Anbu', '’ 검색']}


def plain(s):
    return re.sub(r'<(?!br\s*/?>)[^>]+>', '', s or '').replace('<br/>', '<br>').replace('<br />', '<br>')


def main(lang):
    shorts = json.load(open(os.path.join(BUILD, 'shorts.json')))['langs'][lang]
    t = open(os.path.join(BUILD, 'data', f'{lang}.js')).read()
    L = json.loads(t[t.index('{'):t.rindex('}') + 1])
    cap = {k: plain(v) for k, v in shorts.items() if k.startswith('p_')}
    q1, q2 = plain(L['q1']), plain(L['q2'])
    end = END.get(lang)
    if not end:
        w = q2.split(' ')
        h = max(1, len(w) // 2)
        end = [q1, '', ' '.join(w[:h]), '', ' '.join(w[h:])]
    out = {
        'lang': lang,
        'cap': cap,
        'q1': q1, 'q2': q2,
        'end': end,
        'store': STORE.get(lang) or [L['store'].split('Anbu')[0], 'Anbu', L['store'].split('Anbu')[-1]],
        'brand': L['app_name'], 'app': L['app_name'], 'now': L['now'], 'alias': [L['mom']],
        'pushTitle': L['push_title'],
        'pushBody': f"{L['mom']} · " + L['steps_tpl'].replace('@steps', '6,120' if lang in ('ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'hi', 'th', 'ar') else '6.120'),
        'emBtn': L['em_btn'], 'stepsLabel': L.get('steps', ''),
    }
    p = os.path.join(HERE, '..', 'lang', f'{lang}.json')
    json.dump(out, open(p, 'w'), ensure_ascii=False, indent=1)
    print('wrote', os.path.relpath(p), len(cap), 'captions')


if __name__ == '__main__':
    for l in sys.argv[1:] or ['ko']:
        main(l)
