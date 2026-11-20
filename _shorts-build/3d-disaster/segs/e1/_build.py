# 3차 시안(2026-11-20): e1 원본은 _phone.js(폰 장면). 그대로 style.js 로 복사한다.
# 옛 장난감 블록판(_main.js + _toybox.js)은 out/e1_v2_toyblocks_*.bak 에 있다 — 되돌릴 때는 그 _main.js 의 /*TOYBOX*/ 자리에 _toybox.js 를 넣는다.
import os, shutil
D = os.path.dirname(os.path.abspath(__file__))
shutil.copy(os.path.join(D, '_phone.js'), os.path.join(D, 'style.js'))
print('ok')
