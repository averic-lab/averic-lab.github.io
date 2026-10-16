# 삶의 선 쇼츠 소리 섞기 — README 소리 기준: 전체 -22 LUFS / TP -1.5 / 효과음은 배경음악보다 +3~6dB(기본 +4.5)
# 배경음악 Staring at the Night Sky(Mixkit) 를 0초부터 138초까지 — 곡 0~6초 조용 / 8초 상승 / 120초 평탄 / 122~134초 자연 감쇠(엔딩)
import json, re, subprocess, sys, os
SP = os.path.dirname(os.path.abspath(__file__))
MEDIA = os.path.abspath(os.path.join(SP, '/Users/macmini/Project/Anbu/averic-lab/media'))
VIDEO, OUT, DUR = sys.argv[1], sys.argv[2], 138.0
CUES = json.load(open(os.path.join(SP, 'cues.json')))
BGM_LUFS = -25.0           # 효과음까지 섞인 뒤 최종 loudnorm 으로 -22 에 맞춘다
REL = 4.5

def run(args): return subprocess.run(args, capture_output=True, text=True)
def lufs(path, start=0, dur=None, pad=False):
    # pad: 0.4초보다 짧은 효과음은 R128 측정 블록(400ms)에 못 미쳐 -70 으로 나온다 → 뒤에 무음을 붙여 잰다
    af = 'apad=whole_dur=3,ebur128' if pad else 'ebur128'
    a = ['ffmpeg', '-hide_banner', '-nostats', '-ss', str(start)] + (['-t', str(dur)] if dur else []) + ['-i', path, '-af', af, '-f', 'null', '-']
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', run(a).stderr)
    return float(m[-1]) if m else -70.0

# 1) 반짝임 합성 — 맑은 고음 종 4개를 60ms 간격으로 + 짧은 잔향
shimmer = os.path.join(SP, 'shimmer.wav')
expr = '+'.join(f"0.22*sin(2*PI*{f}*(t-{d}))*exp(-3.2*(t-{d}))*gte(t,{d})" for f, d in [(2093, 0), (2637, .06), (3136, .12), (4186, .18), (5274, .24)])
run(['ffmpeg', '-y', '-f', 'lavfi', '-i', f"aevalsrc='{expr}':s=48000:d=2.2", '-af', 'aecho=0.8:0.6:70|130:0.35|0.22,highpass=f=900,afade=t=out:st=1.6:d=0.6', '-ac', '2', shimmer])

# 1-2) '팅~' 단일음 — 안부가 전해지는 팝업 전용. 맑은 고음 하나(1760Hz)가 짧게 튕기고 길게 사라진다(배음은 아주 약하게, 화음 없음)
tingf = os.path.join(SP, 'ting.wav')
texpr = "(0.5*sin(2*PI*1760*t)*exp(-3.4*t)+0.14*sin(2*PI*3520*t)*exp(-6*t)+0.05*sin(2*PI*5274*t)*exp(-11*t))*min(t/0.004,1)"
run(['ffmpeg', '-y', '-f', 'lavfi', '-i', f"aevalsrc='{texpr}':s=48000:d=2.0", '-af', 'aecho=0.8:0.5:55:0.22,afade=t=out:st=1.5:d=0.5', '-ac', '2', tingf])

# 2) 배경음악 — 0초부터 DUR 초, 페이드인 0.8 / 끝 2초 페이드아웃, 레벨 맞춤
bgm_src = os.path.join(MEDIA, 'bgm', 'staring-at-the-night-sky.mp3')
bgm = os.path.join(SP, 'bgm_cut.wav')
run(['ffmpeg', '-y', '-ss', '0', '-t', str(DUR), '-i', bgm_src, '-af', f'afade=t=in:d=0.8,afade=t=out:st={DUR-2}:d=2', '-ar', '48000', '-ac', '2', bgm])
g = BGM_LUFS - lufs(bgm)
duck = [c['t'] for c in CUES if c.get('duck')]
duck_expr = ''.join(f",volume=enable='between(t,{t-0.05},{t+1.6})':volume={10**(-2.5/20):.4f}" for t in duck)
inputs, filters = ['-i', VIDEO, '-i', bgm], [f"[1:a]volume={g:.2f}dB{duck_expr}[b]"]
labels = ['[b]']
for i, c in enumerate(CUES):
    src = shimmer if c['file'] == 'SHIMMER' else tingf if c['file'] == 'TING' else os.path.join(MEDIA, 'sfx', c['file'])
    # 앞 무음 제거 후 2초에서 자른다
    tmp = os.path.join(SP, f'sfx_{i}.wav')
    run(['ffmpeg', '-y', '-i', src, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,atrim=0:2,afade=t=out:st=1.7:d=0.3', '-ar', '48000', '-ac', '2', tmp])
    # 그 순간 배경음악 음량(앞뒤 1.5초) 기준 +REL(+rel)
    local = lufs(bgm, max(0, c['t'] - 0.75), 1.5) + g
    target = max(local, BGM_LUFS - 6) + REL + c.get('rel', 0)
    sl = lufs(tmp, pad=True)
    assert sl > -60, f'효과음 측정 실패: {src}'
    gain = target - sl
    inputs += ['-i', tmp]
    k = len(labels) + 1
    ms = int(c['t'] * 1000)
    filters.append(f"[{k}:a]volume={gain:.2f}dB,afade=t=in:d=0.01,adelay={ms}|{ms}[s{i}]")
    labels.append(f'[s{i}]')
    print(f"{c['t']:5.2f}s {os.path.basename(src):42s} 배경 {local:6.1f} → 목표 {target:6.1f} LUFS (gain {gain:+.1f})")
filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=first[a]")
pre = os.path.join(SP, 'premix.wav')
r = run(['ffmpeg', '-y', *inputs, '-filter_complex', ';'.join(filters), '-map', '[a]', '-t', str(DUR), pre])
if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
# 2단계: 측정한 만큼 정확히 -22 로 옮기고, 피크만 리미터로 -1.6 dBTP 아래로
g2 = -22.0 - lufs(pre)
r = run(['ffmpeg', '-y', '-i', VIDEO, '-i', pre, '-filter_complex', f'[1:a]volume={g2:.2f}dB,alimiter=limit=0.83:level=false:attack=3:release=60[a]',
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(DUR), OUT])
if r.returncode: print(r.stderr[-1500:]); sys.exit(1)
print('최종:', lufs(OUT), 'LUFS')
tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', run(['ffmpeg', '-hide_banner', '-nostats', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr)
print('True Peak:', tp[-1] if tp else '?', 'dBTP')
