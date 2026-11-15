/**
 * 오디오 동기화 유틸.
 * 박자에 맞추려면 곡의 BPM 과 첫 박 위치(offsetSec)를 먼저 잰다
 * (README 기술 메모: librosa.beat.beat_track(..., start_bpm=…, tightness=400)).
 * 박에 *시작*을 맞추면 40~80ms 늦어 보인다 — 가장 크게 바뀌는 순간을 박에 둔다.
 */
export const beatToFrame = (beat: number, bpm: number, fps: number, offsetSec = 0) =>
  Math.round((offsetSec + (beat * 60) / bpm) * fps);

export const frameToBeat = (frame: number, bpm: number, fps: number, offsetSec = 0) =>
  ((frame / fps - offsetSec) * bpm) / 60;
