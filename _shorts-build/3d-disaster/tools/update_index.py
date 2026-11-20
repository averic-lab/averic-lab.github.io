# 화풍 요약(_recipes/<화풍>.md·.ref.js)과 목록(_recipes/INDEX.md)을 다시 만든다. 부품을 _kit/parts/ 에 추가한 뒤 실행.
#   python3 /Users/macmini/Project/Anbu/3D_Style_Atlas/_kit/tools/update_index.py
import re, glob, os
A = '/Users/macmini/Project/Anbu/3D_Style_Atlas/'
rows = []
for f in sorted(glob.glob(A + '*.txt')):
    n = os.path.basename(f)[:-4]
    t = open(f).read()
    card = re.search(r'STYLE CARD\n(.*?)\n\n(?=STAGE KIT)', t, re.S)
    card = card.group(1).strip() if card else ''
    fonts = re.search(r'Load these Google Fonts before building[^:]*:\s*([^\n]*)', t)
    fonts = fonts.group(1).strip() if fonts else '-'
    ref = re.search(r'REFERENCE STYLE SOURCE \(([^)]*)\)\n```js\n(.*?)```', t, re.S)
    topic = ''
    if ref and 'was' in ref.group(1):
        topic = ref.group(1).split('was', 1)[1].strip(' "')
    lines = [
        '# ' + n, '',
        '원본: `../' + n + '.txt` — STAGE·SOUND KIT 은 `../_kit/lib/` 과 같아서 여기서는 뺐다.', '',
        '## STYLE CARD', card, '',
        '- 원본 지정 글꼴: ' + fonts + ' (한글은 Noto Sans KR 을 함께 쓴다)',
        '- 참고 장면 코드: `' + n + '.ref.js`' + (' — 예시 주제: ' + topic if topic else ''),
    ]
    open(A + '_recipes/' + n + '.md', 'w').write('\n'.join(lines) + '\n')
    if ref:
        open(A + '_recipes/' + n + '.ref.js', 'w').write(ref.group(2))
    good = re.search(r'^Good for:\s*(.*)$', card, re.M)
    use = re.search(r'^Use:\s*(.*)$', card, re.M)
    rows.append((n, use.group(1) if use else '', (good.group(1) if good else '')[:130]))

parts = sorted(os.listdir(A + '_kit/parts'))
idx = ['# 화풍 목록 (' + str(len(rows)) + '개)', '',
       '화풍을 고를 때는 이 표 → `<화풍>.md`(STYLE CARD) → 필요할 때만 `<화풍>.ref.js`(참고 코드) 순서로 읽는다. 원본 `.txt` 는 열지 않는다.',
       '만들어 둔 부품이 있으면 `../_kit/parts/<화풍>__<변형>.js` 를 먼저 고쳐 쓴다.', '',
       '| 화풍 | 용도 | 잘 맞는 것 (Good for 앞부분) | 만들어 둔 부품 |', '|---|---|---|---|']
for n, u, g in rows:
    ps = ', '.join(p[:-3].split('__')[1] for p in parts if p.startswith(n + '__'))
    idx.append('| ' + n + ' | ' + u + ' | ' + g.replace('|', '/') + '… | ' + (ps or '-') + ' |')
open(A + '_recipes/INDEX.md', 'w').write('\n'.join(idx) + '\n')
print(len(rows), 'styles,', len(parts), 'parts')
