"""숏폼 소리 입히기 — 배경음악 + 효과음을 섞어 이미 렌더된 mp4 에 넣는다.

  python3 audio.py living-alone            섞은 소리를 만들고 그 편의 모든 언어 mp4 에 넣는다
  python3 audio.py living-alone ko en      지정 언어만
  python3 audio.py living-alone --mix-only 섞은 소리만 만든다(.mix/<id>.m4a, 확인용)

만들 때마다 아래 기준을 스스로 재서 보고한다(기준을 넘으면 '⚠'). 기준은 2026-09-24 실청취로 정했다 —
처음 -16 LUFS·효과음 +8~25dB·더킹 8dB 로 만들었더니 "볼륨을 반으로 줄여도 크고 효과음이 튄다"였다.

  · 전체 -22 LUFS(integrated), True Peak -1.5 dBTP 이하 (처음 -20 → 실청취로 -22)
  · 배경음악은 모든 편 공통(shorts.json 최상위 audio) — 같은 곡·같은 시작점이라야 시리즈로 기억된다.
  · 배경음악: 앞 0.8초 페이드인(시작부터 음악이 느껴지게), 페이드아웃은 영상 끝 2초에만
    (엔딩 문구가 보이는 동안은 유지)
  · 효과음: 그 순간의 배경음악보다 +3~6dB(목표 +4.5dB) — 튀지 않게. 효과음이 나는 순간에도
    Short-term -16 LUFS 를 넘지 않는다. 앞뒤 짧은 페이드(클릭음 방지), 2초 넘는 꼬리는 자른다.
  · 더킹은 앱 알림음(cue 의 duck:true)에만 2.5dB. 다른 효과음은 크기 차이만으로 들리게 한다.

효과음 크기는 파일의 최대값이 아니라 **그 순간 배경음악 대비 상대 크기**로 정한다 — 같은 효과음도
배경이 조용한 순간과 큰 순간에 필요한 크기가 다르다. 크기는 귀의 민감도를 흉내 낸 K 가중(고음 +4dB)으로 잰다.

효과음 cue(window.SFX)의 t 는 화면에 팝업이 뜨는 시각이다. 파일 앞 무음은 잘라내므로 소리가 정확히 t 에 난다.
타임라인은 언어와 무관하므로 섞은 소리는 편당 한 번만 만들고, 각 언어 mp4 에는 영상은 그대로(copy) 소리만 붙인다.
원본 음원(media/bgm, media/sfx)과 섞은 소리(.mix/)는 라이선스상 커밋하지 않는다(.gitignore).
"""
import json, math, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BGM_DIR = os.path.join(ROOT, "media", "bgm")
SFX_DIR = os.path.join(ROOT, "media", "sfx")
MEDIA = os.path.join(ROOT, "media", "shorts")
MIX = os.path.join(HERE, ".mix")

TARGET_LUFS = -22.0
TRUE_PEAK_MAX = -1.5
SHORT_TERM_MAX = -16.0
FADE_IN, FADE_OUT = 0.8, 2.0
SFX_REL_DB = 4.5                  # 그 순간 배경음악보다 이만큼 크게(허용 3~6)
SFX_REL_RANGE = (3.0, 6.0)
SFX_FADE_IN, SFX_FADE_OUT, SFX_MAX_LEN = 0.008, 0.12, 2.0
DUCK_DB, ATTACK, RELEASE = 2.5, 0.08, 0.35
KWEIGHT = "highpass=f=60,highshelf=f=1500:g=4"   # K 가중 근사(BS.1770 의 고음 선반 +4dB)
MEASURE_WIN = 0.5                 # 효과음 크기 비교 구간(짧은 효과음은 그 길이까지)


def run(args, **kw):
    return subprocess.run(args, check=True, capture_output=True, text=True, **kw)


def ff_stderr(args):
    return run(["ffmpeg", "-hide_banner", "-nostats", *args, "-f", "null", "-"]).stderr


def onset(path):
    """파일 앞 무음 길이(초). -45 dBFS 를 넘는 첫 지점."""
    m = re.search(r"silence_end: ([0-9.]+)", ff_stderr(["-i", path, "-af", "silencedetect=noise=-45dB:d=0.005"]))
    return float(m.group(1)) if m else 0.0


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).stdout)


def kdb(path, start, dur):
    """K 가중 평균 크기(dB) — 효과음과 배경음악을 같은 잣대로 비교한다."""
    out = ff_stderr(["-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", path, "-af", f"{KWEIGHT},volumedetect"])
    return float(re.search(r"mean_volume: (-?[0-9.]+) dB", out).group(1))


def ebur128(path):
    """(integrated LUFS, true peak dBTP, [(초, short-term LUFS)]). 요약값은 반드시 마지막 것을 쓴다."""
    out = ff_stderr(["-i", path, "-af", "ebur128=peak=true:framelog=info"])
    integ = float(re.findall(r"I:\s+(-?[0-9.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[0-9.inf]+) dBFS", out)[-1])
    st = [(float(t), float(s)) for t, s in re.findall(r"t:\s*([0-9.]+).*?S:\s*(-?[0-9.]+)", out)]
    return integ, tp, st


def cues_for(page):
    out = run(["node", "render.mjs", page, "--cues"], cwd=HERE).stdout.strip().splitlines()[-1]
    return json.loads(out)


def render_bed(cfg, dur, ducks, path):
    """배경음악 트랙 — 페이드 + 알림음 구간 더킹."""
    bgm = os.path.join(BGM_DIR, cfg["bgm"])
    start = float(cfg.get("bgm_start", 0))
    base = -24.0 - kdb(bgm, start, dur) + float(cfg.get("bgm_gain_db", 0))   # 섞기 전 여유(최종 크기는 뒤에서 맞춘다)
    duck = "0"
    for s, e in ducks:
        duck = (f"max({duck},min(clip((t-({s - ATTACK:.3f}))/{ATTACK},0,1),"
                f"clip(({e + RELEASE:.3f}-t)/{RELEASE},0,1)))")
    vol = f"pow(10,({base:.2f}-{DUCK_DB}*{duck})/20)"
    af = (f"aresample=48000,aformat=channel_layouts=stereo,"
          f"afade=t=in:st=0:d={FADE_IN},afade=t=out:st={dur - FADE_OUT:.3f}:d={FADE_OUT},"
          f"volume='{vol}':eval=frame,apad,atrim=0:{dur}")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", str(start), "-t", str(dur), "-i", bgm,
         "-af", af, "-c:a", "pcm_s16le", path])


def build_mix(video):
    cfg = video["audio"]
    cues = cues_for(video["page"])
    dur = float(cues["duration"])
    os.makedirs(MIX, exist_ok=True)

    sfx = []
    for c in cues["sfx"]:
        f = os.path.join(SFX_DIR, c["file"])
        on = onset(f)
        # 기본 2초 상한. 타이핑처럼 화면 동작 길이에 맞춰야 하는 소리는 cue 의 "len"(초)로 늘린다
        length = min(duration(f) - on, float(c.get("len", SFX_MAX_LEN)))
        sfx.append({**c, "path": f, "on": on, "len": length, "t": float(c["t"])})

    # 1) 배경음악 트랙(더킹 포함)
    bed = os.path.join(MIX, f"{video['id']}.bed.wav")
    render_bed(cfg, dur, [(s["t"], s["t"] + s["len"]) for s in sfx if s.get("duck")], bed)

    # 2) 효과음 크기 = 그 순간 배경음악(K 가중) + SFX_REL_DB
    for s in sfx:
        w = min(s["len"], MEASURE_WIN)
        s["bed_db"] = kdb(bed, s["t"], w)
        s["gain"] = s["bed_db"] + float(s.get("rel", SFX_REL_DB)) - kdb(s["path"], s["on"], w)

    # 3) 섞기
    inputs, chains, labels = ["-i", bed], [], []
    for i, s in enumerate(sfx, start=1):
        ms = int(round(s["t"] * 1000))
        L = s["len"]
        inputs += ["-i", s["path"]]
        chains.append(f"[{i}:a]atrim=start={s['on']:.4f}:duration={L:.4f},asetpts=PTS-STARTPTS,"
                      f"aresample=48000,aformat=channel_layouts=stereo,"
                      f"afade=t=in:d={SFX_FADE_IN},afade=t=out:st={L - SFX_FADE_OUT:.4f}:d={SFX_FADE_OUT},"
                      f"volume={s['gain']:.2f}dB,adelay={ms}|{ms}[s{i}]")
        labels.append(f"[s{i}]")
    graph = ";".join(chains + [f"[0:a]{''.join(labels)}amix=inputs={1 + len(labels)}:normalize=0:duration=first[pre]"])
    pre = os.path.join(MIX, f"{video['id']}.pre.wav")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-filter_complex", graph,
         "-map", "[pre]", "-c:a", "pcm_s16le", pre])

    # 4) 전체 크기 -20 LUFS + 리미터. AAC 인코딩이 피크를 조금 올리므로 결과를 재서 넘으면 리미터를 낮춰 다시
    integ0, _, _ = ebur128(pre)
    out = os.path.join(MIX, f"{video['id']}.m4a")
    limit = TRUE_PEAK_MAX - 0.5
    for _ in range(4):
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", pre,
             "-af", f"volume={TARGET_LUFS - integ0:.2f}dB,alimiter=limit={10 ** (limit / 20):.4f}:level=false",
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out])
        integ, tp, st = ebur128(out)
        if tp <= TRUE_PEAK_MAX:
            break
        limit -= 0.5

    report(video, sfx, integ, tp, st, pre, bed)
    for p in (pre, bed):
        os.remove(p)
    return out


def report(video, sfx, integ, tp, st, pre, bed):
    ok = lambda c: "  " if c else "⚠ "
    print(f"[{video['id']}] 배경음악 {video['audio']['bgm']}, 효과음 {len(sfx)}개")
    print(f"  {ok(abs(integ - TARGET_LUFS) <= 0.5)}전체 {integ:.1f} LUFS (목표 {TARGET_LUFS})")
    print(f"  {ok(tp <= TRUE_PEAK_MAX)}True Peak {tp:.1f} dBTP (≤ {TRUE_PEAK_MAX})")
    if not st:   # 측정값을 못 읽었으면 통과가 아니다
        print("  ⚠ Short-term 측정값을 읽지 못함 — ebur128 로그 형식 확인")
    smax = max((s for _, s in st), default=float("nan"))
    print(f"  {ok(smax <= SHORT_TERM_MAX)}Short-term 최대 {smax:.1f} LUFS (≤ {SHORT_TERM_MAX})")
    lo, hi = SFX_REL_RANGE
    for s in sfx:
        # 섞은 결과에서 실측 — (섞은 트랙 − 배경음악 트랙)의 전력 = 효과음만의 크기
        w = min(s["len"], MEASURE_WIN)
        mix_db, bed_db = kdb(pre, s["t"], w), kdb(bed, s["t"], w)
        sfx_db = 10 * math.log10(max(10 ** (mix_db / 10) - 10 ** (bed_db / 10), 1e-12))
        rel = sfx_db - bed_db
        near = [v for t, v in st if s["t"] <= t <= s["t"] + s["len"] + 3.0]
        sm = max(near, default=float("nan"))
        print(f"  {ok(lo <= rel <= hi and sm <= SHORT_TERM_MAX)}{s['t']:5.1f}초 {os.path.basename(s['file']):42} "
              f"배경 대비 {rel:+.1f}dB · 그 순간 Short-term {sm:.1f} LUFS{' · 더킹 ' + str(DUCK_DB) + 'dB' if s.get('duck') else ''}")


def mux(video, audio, langs):
    n = 0
    for code in langs:
        mp4 = os.path.join(MEDIA, code, f"{video['id']}.mp4")
        if not os.path.exists(mp4):
            continue
        tmp = mp4 + ".tmp.mp4"
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", mp4, "-i", audio,
             "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "copy",
             "-shortest", "-movflags", "+faststart", tmp])
        os.replace(tmp, mp4)
        n += 1
    print(f"  소리 넣음: {n}개 언어")


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    vid, rest = args[0], args[1:]
    cfg = json.load(open(os.path.join(HERE, "shorts.json"), encoding="utf-8"))
    video = next((v for v in cfg["videos"] if v["id"] == vid), None)
    if not video:
        sys.exit(f"shorts.json 에 {vid} 가 없습니다")
    if video.get("audio") is False:
        print(f"{vid}: audio false — 소리 없이 둔다")
        return
    audio = build_mix({**video, "audio": cfg["audio"]})   # 배경음악은 모든 편 공통(shorts.json 최상위 audio)
    if "--mix-only" in rest:
        return
    mux(video, audio, [a for a in rest if not a.startswith("--")] or list(cfg["langs"]))


if __name__ == "__main__":
    main()
