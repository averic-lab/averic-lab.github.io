# 「안부 앱 소개」 3D 판 잇기 → out/app-intro-3d.mp4
#   python3 tools/assemble.py [음악배율=0.6] [효과음배율=2.0]
# 장면은 짧은 컷으로 바로 잇는다(각 장면 첫 순간의 번쩍임이 전환 역할) — 겹치지 않으므로 장면 경계가 곡의 마디에 그대로 맞는다.
# 음악 = Electro Dreams(Arulo, Mixkit, 120.0 BPM 실측 — 2026-11-25 사용자 요청으로 원판 곡에서 교체).
# 곡 구조(마디=2초): 도입 0–16 / A 16–48(드롭) / 브레이크 48–64 / B 64–96 / 마무리 96–112.
# 장면 1·2(도입) → 3 드롭 → 6a·6b(브레이크) → 7~11(B) → 엔딩(마무리). 1박 = 15프레임이라 반올림 오차가 없다.
# 소리 기준 -22 LUFS / True Peak -1.5 dBTP(2단계 loudnorm).
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
MUSIC = '/Users/macmini/Project/Anbu/averic-lab/media/bgm/electro-dreams.mp3'
BAR = 2.0                                        # 120.0 BPM(실측)
M_START = 0.025                                  # 원곡 첫 마디 = 0.01초. 8마디 뒤(16.01초)가 드롭 = 장면 3 시작
SEGS = ['hook', 'burden', 'drop', 'never', 'code', 'complex', 'simple', 'os', 'steps', 'lang', 'sos', 'price', 'end']
PAD = {'end': 1.0}
mv = float(sys.argv[1]) if len(sys.argv) > 1 else 0.6
sv = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); sys.exit(1)
    return r.stderr
def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
D = [dur(os.path.join(OUT, s + '.mp4')) + PAD.get(s, 0) for s in SEGS]
st = [0.0]
for d in D[:-1]: st.append(st[-1] + d)
total = st[-1] + D[-1]
print('장면 시작:', ', '.join(f'{s}={t:.2f}' for s, t in zip(SEGS, st)), f'/ 전체 {total:.2f}s / 음악 {M_START:.3f}s부터')
inp, fl = [], []
for i, s in enumerate(SEGS):
    inp += ['-i', os.path.join(OUT, s + '.mp4')]
    pad = f',tpad=stop_mode=clone:stop_duration={PAD[s]}' if s in PAD else ''
    fl.append(f'[{i}:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS{pad}[v{i}]')
n = len(SEGS)
fl.append(''.join(f'[v{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=0[vout]')
inp += ['-ss', f'{M_START:.4f}', '-i', MUSIC]
am = [f"[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={mv},apad,atrim=0:{total:.4f},afade=t=out:st={total - 1.6:.3f}:d=1.6[ma]"]
labels = ['[ma]']; k = n + 1
for i, s in enumerate(SEGS):
    w = os.path.join(OUT, s + '_sfx.wav')
    if not os.path.exists(w): print(f'⚠ {s}: 효과음 없음'); continue
    inp += ['-i', w]; ms = int(round(st[i] * 1000))
    am.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={sv:.3f},adelay={ms}|{ms}[e{i}]'); labels.append(f'[e{i}]'); k += 1
am.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=first[mix]')
tmp, vid, final = os.path.join(OUT, '_mix.wav'), os.path.join(OUT, '_video.mp4'), os.path.join(OUT, 'app-intro-3d.mp4')
run(['ffmpeg', '-y', '-loglevel', 'error'] + inp + ['-filter_complex', ';'.join(fl + am), '-map', '[vout]', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', vid, '-map', '[mix]', tmp])
r = run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-22:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
m = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = f"loudnorm=I=-22:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', tmp, '-af', af + ',aresample=48000', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', f'{total:.3f}', final])
r = run(['ffmpeg', '-hide_banner', '-i', final, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
print('완성:', final); print(r[r.rindex('Summary:'):])
