# 「72시간」 한 편으로 잇기: out/<장면>.mp4 + out/<장면>_sfx.wav → out/disaster-72h.mp4
#   python3 tools/assemble72.py [음악배율=0.55] [효과음배율=2.0]
# 장면 사이는 교차 전환(xfade). 음악은 한 곡이 처음부터 끝까지 이어진다(2026-11-19 사용자 지적: 알림 장면에서 곡이 바뀌면 흐름이 끊긴다).
# 소리 기준: -22 LUFS / True Peak -1.5 dBTP (2단계 loudnorm)
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
BGM = '/Users/macmini/Project/Anbu/averic-lab/media/bgm'
MUSIC_A, A_START = os.path.join(BGM, 'no-turning-back.mp3'), 22.0      # Mixkit "No Turning Back" — 쌓여 올라가는 구간부터
SEGS = ['s0', 'pop', 'e1', 'e2', 'e3']
XF = [0.5, 0.45, 0.3, 0.4]           # 장면 i → i+1 교차 길이(초). pop→e1: 아이콘이 사라진 뒤표지에서 painted 폰 장면으로 교차
mv = float(sys.argv[1]) if len(sys.argv) > 1 else 0.55
sv = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); sys.exit(1)
    return r.stderr
def dur(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)

SFXK = {'e1': 1.4}                 # 장면별 효과음 추가 배율(e1 폰 장면 효과음이 옛 블록판보다 2.5dB 작다)
PAD = {'e3': 1.0}                  # 끝 장면 마지막 프레임을 더 붙들어 둔다(스토어 검색 화면 정지 2초 이상)
D = [dur(os.path.join(OUT, s + '.mp4')) + PAD.get(s, 0) for s in SEGS]
starts = [0.0]
for i in range(1, len(SEGS)): starts.append(starts[-1] + D[i - 1] - XF[i - 1])
total = starts[-1] + D[-1]
print('장면 시작:', ', '.join(f'{s}={t:.2f}' for s, t in zip(SEGS, starts)), f'/ 전체 {total:.2f}s')

# 1) 영상
inp, fl = [], []
for i, s in enumerate(SEGS):
    inp += ['-i', os.path.join(OUT, s + '.mp4')]
    pad = f',tpad=stop_mode=clone:stop_duration={PAD[s]}' if s in PAD else ''
    fl.append(f'[{i}:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS{pad}[v{i}]')
prev = 'v0'
for i in range(1, len(SEGS)):
    off = starts[i]
    fl.append(f'[{prev}][v{i}]xfade=transition=fade:duration={XF[i-1]}:offset={off:.4f}[x{i}]'); prev = f'x{i}'
# 2) 소리: 음악 두 곡 + 장면별 효과음
n = len(SEGS)
inp += ['-ss', str(A_START), '-t', f'{total + 0.5:.3f}', '-i', MUSIC_A]
am = [f'[{n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={mv},afade=t=in:st=0:d=0.02,afade=t=out:st={total - 2.4:.3f}:d=2.4[ma]']
labels = ['[ma]']; k = n + 1
for i, s in enumerate(SEGS):
    w = os.path.join(OUT, s + '_sfx.wav')
    if not os.path.exists(w): print(f'⚠ {s}: 효과음 없음'); continue
    inp += ['-i', w]; ms = int(round(starts[i] * 1000))
    am.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={sv * SFXK.get(s, 1):.3f},adelay={ms}|{ms}[e{i}]'); labels.append(f'[e{i}]'); k += 1
am.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{total:.4f}[mix]')
tmp, vid, final = os.path.join(OUT, '_mix.wav'), os.path.join(OUT, '_video.mp4'), os.path.join(OUT, 'disaster-72h.mp4')
run(['ffmpeg', '-y', '-loglevel', 'error'] + inp + ['-filter_complex', ';'.join(fl + am), '-map', f'[{prev}]', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', vid, '-map', '[mix]', tmp])
st = run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-22:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
m = json.loads(st[st.rindex('{'):st.rindex('}') + 1])
af = f"loudnorm=I=-22:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', tmp, '-af', af + ',aresample=48000', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final])
st = run(['ffmpeg', '-hide_banner', '-i', final, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
print('완성:', final); print(st[st.rindex('Summary:'):])
