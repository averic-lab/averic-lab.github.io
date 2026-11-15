/**
 * 애니메이션 유틸 — 모든 움직임은 frame 의 함수다.
 * CSS animation·transition, Math.random, Date.now 를 쓰면 렌더 결과가 프레임마다 달라진다.
 * 난수가 필요하면 remotion 의 random(seed) 를 쓴다.
 */
import { Easing, interpolate, spring } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** start 프레임부터 duration 프레임 동안 0→1 (easing 적용) */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = Easing.out(Easing.cubic),
) => interpolate(frame, [start, start + duration], [0, 1], { ...clamp, easing });

/** 0→1 진행값을 임의 범위로 */
export const mix = (t: number, from: number, to: number) => from + (to - from) * t;

/** 튕기며 들어오는 0→1. delay 프레임 뒤 시작 */
export const pop = (frame: number, fps: number, delay = 0, damping = 12) =>
  spring({ frame: frame - delay, fps, config: { damping, mass: 0.6, stiffness: 140 } });

/** 부드럽게 들어오는 0→1 (튕김 없음) */
export const smooth = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 200 } });

/** 들어왔다가 end 에서 나가는 불투명도 */
export const fadeInOut = (frame: number, start: number, end: number, fade = 8) =>
  interpolate(frame, [start, start + fade, end - fade, end], [0, 1, 1, 0], clamp);

/** i 번째 요소의 시작 프레임 (순서대로 등장) */
export const stagger = (i: number, gap: number, start = 0) => start + i * gap;
