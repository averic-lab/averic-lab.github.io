/**
 * 영상 규격 — 해상도·프레임 레이트·길이는 여기서만 바꾼다.
 * 컴포지션마다 다른 값이 필요하면 Root.tsx 에서 덮어쓰거나,
 * 렌더할 때 --props='{"fps":60,"durationInSeconds":30}' 로 바꾼다(calculateMetadata 가 읽는다).
 */
import { z } from "zod";

/** 컴포지션 props 에 섞어 쓰는 규격 스키마 — Studio 오른쪽 패널에서 바로 고칠 수 있다 */
export const videoSpecSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fps: z.number().positive(),
  durationInSeconds: z.number().positive(),
});

export type VideoSpec = z.infer<typeof videoSpecSchema>;

/** 쇼츠·릴스·틱톡 세로 규격 (9:16) */
export const SHORTS: VideoSpec = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInSeconds: 15,
};

/** 가로 규격이 필요할 때 */
export const LANDSCAPE: VideoSpec = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInSeconds: 15,
};

export const secToFrames = (sec: number, fps: number) => Math.round(sec * fps);
