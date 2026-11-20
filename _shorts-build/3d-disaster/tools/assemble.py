# 장면 9개(out/s1.mp4 … s9.mp4 + 효과음)를 한 편으로 잇는다.
#   python3 tools/assemble.py [음악배율=1.0] [효과음배율=1.0]  →  out/before-departure-3d.mp4
# 장면 사이: 앞 장면 마지막 3프레임은 어둠으로, 다음 장면 첫 3프레임은 어둠에서 (어두운 바탕 화풍이라 짧은 암전이 가장 자연스럽다)
# 소리: Techno Fights(마디 0 = 원곡 0.3058초)를 바닥에 깔고, 장면별 효과음을 그 장면 시작 시각에 얹은 뒤 -22 LUFS / TP -1.5 로 맞춘다.
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
MUSIC = '/Users/macmini/Project/Anbu/averic-lab/media/shorts/ko/bgm-후보/ai2/171_techno-fights.mp3'
MUSIC_START = 0.3058
SEGS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']
FRAMES = [234, 176, 175, 176, 234, 351, 176, 293, 351]
mv = float(sys.argv[1]) if len(sys.argv) > 1 else 1.0
sv = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
starts = [sum(FRAMES[:i]) for i in range(len(FRAMES))]
total = sum(FRAMES); dur = total / 30

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); sys.exit(1)
    return r.stderr

# 1) 영상: 장면마다 프레임 수 확인 + 암전 → 이어 붙이기
inp, fl = [], []
for i, (s, n) in enumerate(zip(SEGS, FRAMES)):
    f = os.path.join(OUT, s + '.mp4')
    got = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip())
    if got != n: print(f'⚠ {s}: 프레임 {got} (기대 {n})')
    inp += ['-i', f]
    chain = f'[{i}:v]trim=end_frame={n},setpts=PTS-STARTPTS,fps=30'
    if i > 0: chain += ',fade=t=in:st=0:d=0.2'
    if i < len(SEGS) - 1: chain += f',fade=t=out:st={(n - 6) / 30:.4f}:d=0.2'
    fl.append(chain + f'[v{i}]')
fl.append(''.join(f'[v{i}]' for i in range(len(SEGS))) + f'concat=n={len(SEGS)}:v=1:a=0[v]')
# 2) 소리
ai = len(SEGS)
inp += ['-ss', str(MUSIC_START), '-t', f'{dur:.4f}', '-i', MUSIC]
amix = [f'[{ai}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={mv},afade=t=in:st=0:d=0.03,afade=t=out:st={dur - 1.6:.3f}:d=1.6[m]']
labels = ['[m]']
for i, s in enumerate(SEGS):
    w = os.path.join(OUT, s + '_sfx.wav')
    if not os.path.exists(w): print(f'⚠ {s}: 효과음 없음'); continue
    inp += ['-i', w]; k = ai + 1 + len(labels) - 1
    ms = int(round(starts[i] / 30 * 1000))
    amix.append(f'[{k}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={sv},adelay={ms}|{ms}[e{i}]'); labels.append(f'[e{i}]')
amix.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=first[mix]')
tmp = os.path.join(OUT, '_mix.wav'); vid = os.path.join(OUT, '_video.mp4'); final = os.path.join(OUT, 'before-departure-3d.mp4')
run(['ffmpeg', '-y', '-loglevel', 'error'] + inp + ['-filter_complex', ';'.join(fl + amix), '-map', '[v]', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', vid, '-map', '[mix]', '-t', f'{dur:.4f}', tmp])
# 3) 음량 -22 LUFS (2단계 loudnorm)
st = run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-22:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
m = json.loads(st[st.rindex('{'):st.rindex('}') + 1])
af = f"loudnorm=I=-22:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', tmp, '-af', af + ',aresample=48000', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final])
st = run(['ffmpeg', '-hide_banner', '-i', final, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
summ = st[st.rindex('Summary:'):]
print('완성:', final, f'{dur:.2f}s')
print(summ)
