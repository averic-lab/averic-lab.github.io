import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** 천천히 움직이는 그라데이션 배경. 색은 props 로 받는다. */
export const GradientBackground: React.FC<{ from: string; to: string; angleSpeed?: number }> = ({
  from,
  to,
  angleSpeed = 0.15,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const angle = 160 + frame * angleSpeed;
  const shift = interpolate(frame, [0, durationInFrames], [0, 20]);
  return <AbsoluteFill style={{ background: `linear-gradient(${angle}deg, ${from} ${shift}%, ${to} 100%)` }} />;
};
