import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Circle, Rect, Star, Triangle } from "@remotion/shapes";
import { AnimatedText } from "../../components/AnimatedText";
import { AppIcon } from "../../components/AppIcon";
import { GradientBackground } from "../../components/Background";
import { SafeFrame } from "../../components/SafeFrame";
import { mix, pop, progress, smooth, stagger } from "../../lib/animation";
import { UI_FONT } from "../../lib/fonts";
import type { SampleProps } from "./Sample";

/** 장면 1 — 글자가 순서대로 튀어 오르는 제목 */
export const TitleScene: React.FC<SampleProps> = ({ lang, title, subtitle, debug }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const sub = smooth(frame, fps, 18);
  return (
    <AbsoluteFill>
      <GradientBackground from="#1b1f4a" to="#3a2a6e" />
      <SafeFrame debug={debug}>
        <AnimatedText text={title} lang={lang} fontSize={width * 0.11} fontFamily={UI_FONT} fontWeight={900} />
        <div
          style={{
            marginTop: width * 0.04,
            fontFamily: UI_FONT,
            fontSize: width * 0.045,
            color: "#cfd3ff",
            opacity: sub,
            transform: `translateY(${mix(sub, 30, 0)}px)`,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};

/** 장면 2 — 도형이 돌며 들어오고, 고정 시드 난수로 흩어진다 */
export const ShapesScene: React.FC<SampleProps> = ({ debug }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const unit = width * 0.16;
  const shapes = [
    <Circle key="c" radius={unit / 2} fill="#ff6b8b" />,
    <Rect key="r" width={unit} height={unit} cornerRadius={unit * 0.2} fill="#ffd166" />,
    <Triangle key="t" length={unit * 1.1} direction="up" fill="#4ecdc4" />,
    <Star key="s" points={5} innerRadius={unit * 0.25} outerRadius={unit * 0.55} fill="#a78bfa" />,
  ];
  return (
    <AbsoluteFill style={{ background: "#0f1226" }}>
      {/* 배경 입자 — random(시드) 라 프레임마다 같은 위치에서 시작한다 */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = random(`x${i}`) * width;
        const y0 = random(`y${i}`) * height;
        const y = (y0 - frame * (1 + random(`v${i}`) * 3)) % height;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y < 0 ? y + height : y,
              width: 6,
              height: 6,
              borderRadius: 3,
              background: "rgba(255,255,255,0.25)",
            }}
          />
        );
      })}
      <SafeFrame debug={debug}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: unit * 0.5 }}>
          {shapes.map((s, i) => {
            const t = pop(frame, fps, stagger(i, 5, 4), 10);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: unit * 1.2,
                  height: unit * 1.2,
                  transform: `scale(${t}) rotate(${mix(t, -180, 0) + Math.sin((frame + i * 10) / 12) * 6}deg)`,
                }}
              >
                {s}
              </div>
            );
          })}
        </div>
      </SafeFrame>
    </AbsoluteFill>
  );
};

/** 장면 3 — 앱 아이콘과 끝 문구 */
export const EndScene: React.FC<SampleProps> = ({ lang, ending, debug }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const icon = pop(frame, fps, 2, 9);
  const ring = progress(frame, 2, 24);
  return (
    <AbsoluteFill>
      <GradientBackground from="#2a1240" to="#7a2f5f" />
      <SafeFrame debug={debug}>
        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              position: "absolute",
              width: width * 0.3,
              height: width * 0.3,
              borderRadius: "50%",
              border: `${interpolate(ring, [0, 1], [12, 0])}px solid rgba(255,255,255,0.6)`,
              transform: `scale(${mix(ring, 0.6, 1.9)})`,
              opacity: 1 - ring,
            }}
          />
          <AppIcon size={width * 0.26} style={{ transform: `scale(${icon})`, borderRadius: width * 0.06 }} />
        </div>
        <AnimatedText
          text={ending}
          lang={lang}
          delay={12}
          fontSize={width * 0.065}
          fontFamily={UI_FONT}
          style={{ marginTop: width * 0.07 }}
        />
      </SafeFrame>
    </AbsoluteFill>
  );
};
