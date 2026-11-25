# 곡의 템포·첫 박·박 격자 안정도를 잰다(순수 파이썬). 사용: python3 tempo.py <mp3> [...]
import sys, subprocess, array, math
def env(f):
    raw = subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar','8000','-f','s16le','-'], capture_output=True).stdout
    a = array.array('h'); a.frombytes(raw); hop = 80
    e = [math.sqrt(sum(v*v for v in a[i:i+hop])/hop) for i in range(0, len(a)-hop, hop)]
    le = [math.log(1+x) for x in e]
    return [max(0, le[i]-le[i-1]) for i in range(1, len(le))]   # 100Hz 온셋
for f in sys.argv[1:]:
    on = env(f); N = len(on)
    best = None
    for p100 in range(4000, 6200, 2):                 # 주기 0.40~0.62s (0.01s 단위의 1/... 보간)
        P = p100/10000*100                             # 프레임 단위
        for ph in range(0, int(P)):
            s = 0; k = 0; x = ph
            while x < N: s += on[int(x)]; x += P; k += 1
            sc = s/k
            if best is None or sc > best[0]: best = (sc, P, ph)
    sc, P, ph = best
    # 구간별 위상 일치: 16박 창마다 격자 위치 대 반 박 위치 온셋 비교
    segs = []
    x = ph; seg = []; 
    while x < N:
        seg.append(on[int(x)] - on[int(x+P/2)] if x+P/2 < N else 0); x += P
    win = [sum(seg[i:i+16]) for i in range(0, len(seg), 16)]
    ok = sum(1 for w in win if w > 0)/len(win)
    mean = sum(on)/N
    print(f"{f.split('/')[-1]:26s} bpm {6000/P:6.2f} beat0 {ph/100:5.2f}  박 강도 {sc/mean:4.2f}x  격자 위상 유지 {ok:4.0%} ({len(win)}창) 창별:" + ''.join('+' if w>0 else '-' for w in win))
