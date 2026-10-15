#!/usr/bin/env python3
"""App Store 헤더·검색 결과용 분할 영상 — 홈페이지의 쇼츠 두 편(안부 앱 소개 · 아무것도 하지 않아도)을 나란히 놓고 한 영상으로 낸다.

  python3 split_video.py --lang ko --kind header|search [--assets <폴더>] [--end <오른쪽 엔딩 다시 렌더 mp4>] [--out <파일>]

· 왼쪽(app-intro)  : 37초 중 '안드로이드도·아이폰도'(21.0~23.8)와 '도움이 필요할 때'+'무료·$9.99'(27.3~32.2)를 들어내고 장면 이음에 0.25초 크로스페이드
· 오른쪽(anbu-3d)  : 팝업이 뜨는 구간(7.3~13.0)을 1.8배, 대상자 카드가 넘어가는 구간(15.5~21.5)을 2배로 — 끝나면 마지막 장면에서 기다리다 왼쪽이 반복될 때 함께 처음부터
· 맨 앞 1초는 두 편의 썸네일 장면을 합친 정지 화면(스토어가 첫 프레임을 썸네일로 쓴다)
· 소리는 왼쪽 영상의 배경음악(motivating-mornings.mp3, 4.395초부터)만 — 효과음 없이 끝에서 페이드아웃
· 규격(Apple): header 21:9 3840×1646 / search 3:2 — 모두 30fps, 5~30초, 정사각 픽셀. 원본은 .mix/hq 의 1080×1920 고화질.
· 장면 시각은 한국어판에서 확인한 값이다. 다른 언어는 같은 타임라인인지 확인한 뒤 쓴다.
"""
import argparse, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
HQ = os.path.join(HERE.replace('_store-build', '_shorts-build'), '.mix', 'hq')
BGM = os.path.join(ROOT, 'media', 'bgm', 'motivating-mornings.mp3'); BGM_START = 4.395
FOLDER = {'ko': '한국어', 'en': '영어', 'ja': '일본어', 'zh-CN': '중국어 간체', 'zh-TW': '중국어 번체', 'de': '독일어', 'fr': '프랑스', 'es': '스페인', 'it': '이탈리아',
          'nl': '네덜란드', 'pt-BR': '포르투갈', 'ru': '러시아어', 'ar': '아랍어', 'tr': '튀르키어', 'pl': '폴란드', 'vi': '베트남', 'th': '태국어', 'sv': '스웨덴', 'hi': '힌디어', 'id': '인도네시아'}
# 파일 이름 앞에 언어 식별자(ID)를 붙인다: ko-header-info.mp4 / cn-search-info.mp4 (사용자 지정, 2026-10-15)
ID = {'zh-CN': 'cn', 'zh-TW': 'tw', 'pt-BR': 'pt'}
KINDS = {'header': dict(W=3840, H=1646, pw=832, ph=1480, gap=120, name='header-info.mp4'),
         'search': dict(W=2880, H=1920, pw=956, ph=1700, gap=140, name='search-info.mp4')}

ap = argparse.ArgumentParser()
ap.add_argument('--lang', default='ko'); ap.add_argument('--kind', default='header', choices=KINDS)
ap.add_argument('--assets', required=True); ap.add_argument('--end'); ap.add_argument('--out')
a = ap.parse_args(); K = KINDS[a.kind]
suffix = '' if a.lang == 'ko' else '-' + a.lang
left = os.path.join(HQ, f'app-intro{suffix}.mp4'); right = os.path.join(HQ, f'anbu-3d{suffix}.mp4')
out = a.out or os.path.join(os.path.expanduser('~'), 'Documents', '스토어 앱 등록 정보', '안부 언어별 스크린샷', FOLDER[a.lang], 'ios', f"{ID.get(a.lang, a.lang)}-{K['name']}")
os.makedirs(os.path.dirname(out), exist_ok=True)

# ── 왼쪽 ──
XF = 0.25
LSEG = [(0, 21.0), (23.8, 27.3), (32.2, 37.0)]
l_len = sum(e - s for s, e in LSEG) - XF * (len(LSEG) - 1)
# ── 오른쪽 ──
RSEG = [(0, 7.3, 1.0), (7.3, 13.0, 1.8), (13.0, 15.5, 1.0), (15.5, 21.5, 2.0), (21.5, 29.0, 1.0)]   # (시작, 끝, 배속)
r_len = sum((e - s) / v for s, e, v in RSEG) + 5.0               # + 엔딩 29~34 (5초)
STILL = 1.0
total = STILL + l_len

f = []
# 왼쪽 본편
f.append('[1:v]fps=30,setsar=1,format=yuv420p,split=4[l0][l1][l2][lst]')
for i, (s, e) in enumerate(LSEG):
    f.append(f'[l{i}]trim={s}:{e},setpts=PTS-STARTPTS[la{i}]')
f.append(f'[la0][la1]xfade=transition=fade:duration={XF}:offset={LSEG[0][1] - LSEG[0][0] - XF}[lab]')
f.append(f'[lab][la2]xfade=transition=fade:duration={XF}:offset={LSEG[0][1] - LSEG[0][0] + LSEG[1][1] - LSEG[1][0] - 2 * XF}[lcon]')
f.append('[lst]trim=start=11.4:end=11.45,setpts=PTS-STARTPTS,loop=loop=29:size=1:start=0[lstill]')
# 오른쪽 본편 + 엔딩
n = len(RSEG) + (1 if not a.end else 1)
if a.end:
    f.append(f'[2:v]fps=30,setsar=1,format=yuv420p,split={len(RSEG) + 0}' + ''.join(f'[r{i}]' for i in range(len(RSEG))))
    f.append('[3:v]fps=30,setsar=1,format=yuv420p,split=2[re][rst]')
    f.append('[rst]trim=start=4.5:end=4.55,setpts=PTS-STARTPTS,loop=loop=29:size=1:start=0[rstill]')
    end_label = '[re]'
else:
    f.append(f'[2:v]fps=30,setsar=1,format=yuv420p,split={len(RSEG) + 2}' + ''.join(f'[r{i}]' for i in range(len(RSEG))) + '[re0][rst]')
    f.append('[re0]trim=29:34,setpts=PTS-STARTPTS[re]')
    f.append('[rst]trim=start=33.5:end=33.55,setpts=PTS-STARTPTS,loop=loop=29:size=1:start=0[rstill]')
    end_label = '[re]'
for i, (s, e, v) in enumerate(RSEG):
    sp = '' if v == 1.0 else f'/{v}'
    f.append(f'[r{i}]trim={s}:{e},setpts=(PTS-STARTPTS){sp},fps=30[rs{i}]')
f.append(''.join(f'[rs{i}]' for i in range(len(RSEG))) + end_label + f'concat=n={len(RSEG) + 1}:v=1:a=0[rcon0]')
f.append(f'[rcon0]tpad=stop_mode=clone:stop_duration={max(0.0, l_len - r_len) + 0.1:.3f},trim=duration={l_len:.3f},setpts=PTS-STARTPTS[rcon]')
# 정지 1초 + 본편
f.append('[lstill][lcon]concat=n=2:v=1:a=0[lp0]')
f.append('[rstill][rcon]concat=n=2:v=1:a=0[rp0]')
# 패널(둥근 모서리) → 배경
pw, ph = K['pw'], K['ph']
f.append('[4:v]format=gray,split=2[m0][m1]')
f.append(f'[lp0]scale={pw}:{ph}:flags=lanczos,setsar=1[lp1];[lp1][m0]alphamerge[lp]')
f.append(f'[rp0]scale={pw}:{ph}:flags=lanczos,setsar=1[rp1];[rp1][m1]alphamerge[rp]')
x1 = (K['W'] - (2 * pw + K['gap'])) // 2; x2 = x1 + pw + K['gap']; y = (K['H'] - ph) // 2
f.append(f"[0:v]scale={K['W']}:{K['H']}:in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setsar=1[bg]")
f.append(f'[bg][lp]overlay={x1}:{y}:format=auto[t1];[t1][rp]overlay={x2}:{y}:format=auto:shortest=1,format=yuv420p,setsar=1[v]')
f.append(f'[5:a]afade=t=in:d=0.3,afade=t=out:st={total - 1.5:.2f}:d=1.5,aformat=sample_rates=48000:channel_layouts=stereo[a]')

cmd = ['ffmpeg', '-y', '-loglevel', 'error',
       '-loop', '1', '-framerate', '30', '-i', os.path.join(a.assets, f'bg_{a.kind}.png'),
       '-i', left, '-i', right, '-i', a.end or right,
       '-loop', '1', '-framerate', '30', '-i', os.path.join(a.assets, f'mask_{a.kind}.png'),
       '-ss', str(BGM_START), '-t', f'{total:.2f}', '-i', BGM,
       '-filter_complex', ';'.join(f), '-map', '[v]', '-map', '[a]', '-t', f'{total:.2f}',
       '-c:v', 'libx264', '-profile:v', 'high', '-crf', '16', '-preset', 'slow', '-r', '30',
       '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
       '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]
print(f'왼쪽 {l_len:.2f}s · 오른쪽 {r_len:.2f}s · 전체 {total:.2f}s → {out}', file=sys.stderr)
subprocess.run(cmd, check=True, timeout=int(os.environ.get('SPLIT_TIMEOUT', 300)))   # 멈춘 ffmpeg 가 배치를 막지 않게(2026-10-15 zh-TW 에서 24분 정지)
print(out)
