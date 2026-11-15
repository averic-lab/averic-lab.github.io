import React from "react";
import { CalculateMetadataFunction, useVideoConfig } from "remotion";
import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { z } from "zod";
import { secToFrames, videoSpecSchema } from "../../config/video";
import { EndScene, ShapesScene, TitleScene } from "./scenes";

export const sampleSchema = videoSpecSchema.extend({
  lang: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ending: z.string(),
  /** 안전 영역 선 표시 (Studio 확인용) */
  debug: z.boolean(),
});

export type SampleProps = z.infer<typeof sampleSchema>;

/** 규격(해상도·fps·길이)을 props 에서 읽는다 → Studio 나 --props 로 바꿀 수 있다 */
export const calculateSampleMetadata: CalculateMetadataFunction<SampleProps> = ({ props }) => ({
  width: props.width,
  height: props.height,
  fps: props.fps,
  durationInFrames: secToFrames(props.durationInSeconds, props.fps),
});

const TRANSITION_SEC = 0.6;

export const Sample: React.FC<SampleProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const tr = secToFrames(TRANSITION_SEC, fps);
  // TransitionSeries 길이 = 장면 합 − 전환 합. 전체 길이가 바뀌어도 장면이 비율대로 늘어난다.
  const scenesTotal = durationInFrames + tr * 2;
  const a = Math.round(scenesTotal * 0.36);
  const b = Math.round(scenesTotal * 0.3);
  const c = scenesTotal - a - b;

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={a}>
        <TitleScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-bottom" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: tr })}
      />
      <TransitionSeries.Sequence durationInFrames={b}>
        <ShapesScene {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: tr })} />
      <TransitionSeries.Sequence durationInFrames={c}>
        <EndScene {...props} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
